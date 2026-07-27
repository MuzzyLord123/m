import { useState, useRef, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Phone, PhoneOff, Video, VideoOff, Mic, MicOff,
  Monitor, MonitorOff, Maximize2, Minimize2, X, Users,
  Volume2, VolumeX,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';

interface CallPanelProps {
  channelId: string;
  channelName: string;
  onClose: () => void;
  callType: 'audio' | 'video';
}

interface Participant {
  userId: string;
  name: string;
  avatar?: string;
  isMuted: boolean;
  isVideoOff: boolean;
  stream?: MediaStream;
}

// ICE servers — STUN + free TURN for symmetric NAT traversal
const ICE_SERVERS: RTCIceServer[] = [
  { urls: 'stun:stun.l.google.com:19302' },
  { urls: 'stun:stun1.l.google.com:19302' },
  { urls: 'stun:stun2.l.google.com:19302' },
  // Free TURN relay for NAT traversal (metered.ca open relay)
  {
    urls: 'turn:a.relay.metered.ca:80',
    username: 'e8dd65b92f6ee1e5c3ad499f',
    credential: 'dWLLVSEcAWPOqGOi',
  },
  {
    urls: 'turn:a.relay.metered.ca:443',
    username: 'e8dd65b92f6ee1e5c3ad499f',
    credential: 'dWLLVSEcAWPOqGOi',
  },
  {
    urls: 'turn:a.relay.metered.ca:443?transport=tcp',
    username: 'e8dd65b92f6ee1e5c3ad499f',
    credential: 'dWLLVSEcAWPOqGOi',
  },
];

/**
 * Deterministic offerer: the peer with the "lower" user ID always creates the offer.
 * This eliminates the glare problem (two simultaneous offers).
 */
function shouldCreateOffer(localId: string, remoteId: string): boolean {
  return localId < remoteId;
}

export function CallPanel({ channelId, channelName, onClose, callType }: CallPanelProps) {
  const { user } = useAuth();
  const [isMuted, setIsMuted] = useState(false);
  const [isVideoOff, setIsVideoOff] = useState(callType === 'audio');
  const [isScreenSharing, setIsScreenSharing] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [callDuration, setCallDuration] = useState(0);
  const [callStatus, setCallStatus] = useState<'connecting' | 'ringing' | 'active' | 'ended'>('connecting');
  const [participants, setParticipants] = useState<Participant[]>([]);
  const [localStream, setLocalStream] = useState<MediaStream | null>(null);
  const [isSpeakerOff, setIsSpeakerOff] = useState(false);

  // Refs that survive re-renders and are accessible inside closures
  const localStreamRef = useRef<MediaStream | null>(null);
  const remoteAudioRefs = useRef<Map<string, HTMLAudioElement>>(new Map());
  const localVideoRef = useRef<HTMLVideoElement>(null);
  const remoteVideoRefs = useRef<Map<string, HTMLVideoElement>>(new Map());
  const peerConnections = useRef<Map<string, RTCPeerConnection>>(new Map());
  const iceCandidateQueue = useRef<Map<string, RTCIceCandidateInit[]>>(new Map());
  const channelRef = useRef<any>(null);
  const timerRef = useRef<ReturnType<typeof setInterval>>();
  const panelRef = useRef<HTMLDivElement>(null);
  const makingOffer = useRef<Map<string, boolean>>(new Map());
  const mountedRef = useRef(true);

  // Keep localStreamRef in sync with state
  useEffect(() => {
    localStreamRef.current = localStream;
  }, [localStream]);

  // Get user media
  const startLocalStream = useCallback(async () => {
    try {
      const constraints: MediaStreamConstraints = {
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true,
        },
        video: callType === 'video' ? {
          width: { ideal: 1280, max: 1920 },
          height: { ideal: 720, max: 1080 },
          frameRate: { ideal: 30 },
          facingMode: 'user',
        } : false,
      };

      const stream = await navigator.mediaDevices.getUserMedia(constraints);
      setLocalStream(stream);
      localStreamRef.current = stream;

      if (localVideoRef.current) {
        localVideoRef.current.srcObject = stream;
      }

      return stream;
    } catch (err: any) {
      console.error('Failed to get media:', err);
      if (err.name === 'NotAllowedError') {
        toast.error('Please allow microphone/camera access to make calls');
      } else if (err.name === 'NotFoundError') {
        toast.error('No microphone/camera found on this device');
      } else {
        toast.error('Failed to access media devices');
      }
      onClose();
      return null;
    }
  }, [callType, onClose]);

  // Keep localVideoRef in sync with localStream (critical for screen share toggle)
  useEffect(() => {
    if (localVideoRef.current && localStream) {
      localVideoRef.current.srcObject = localStream;
    }
  }, [localStream]);

  /**
   * Flush queued ICE candidates once remote description is set.
   */
  const flushIceCandidates = useCallback(async (remoteUserId: string) => {
    const pc = peerConnections.current.get(remoteUserId);
    const queue = iceCandidateQueue.current.get(remoteUserId);
    if (!pc || !queue || !pc.remoteDescription) return;

    for (const candidate of queue) {
      try {
        await pc.addIceCandidate(new RTCIceCandidate(candidate));
      } catch (e) {
        console.warn('Failed to add queued ICE candidate:', e);
      }
    }
    iceCandidateQueue.current.set(remoteUserId, []);
  }, []);

  /**
   * Core: create a peer connection for a remote user.
   * Uses the CURRENT stream from localStreamRef (not a stale closure capture).
   */
  const createPeerConnection = useCallback((remoteUserId: string): RTCPeerConnection => {
    // Close existing connection if any
    const existing = peerConnections.current.get(remoteUserId);
    if (existing) {
      existing.close();
      peerConnections.current.delete(remoteUserId);
    }

    const pc = new RTCPeerConnection({ iceServers: ICE_SERVERS });

    // Add ALL current local tracks (uses ref, not stale closure)
    const currentStream = localStreamRef.current;
    if (currentStream) {
      currentStream.getTracks().forEach(track => {
        pc.addTrack(track, currentStream);
      });
    }

    // Send ICE candidates to remote peer
    pc.onicecandidate = (event) => {
      if (event.candidate && channelRef.current) {
        channelRef.current.send({
          type: 'broadcast',
          event: 'ice-candidate',
          payload: {
            candidate: event.candidate.toJSON(),
            from: user?.id,
            to: remoteUserId,
          },
        });
      }
    };

    // Handle remote tracks — audio playback + video stream
    pc.ontrack = (event) => {
      const remoteStream = event.streams[0];
      if (!remoteStream) return;

      // Update participant stream for video rendering
      setParticipants(prev =>
        prev.map(p =>
          p.userId === remoteUserId ? { ...p, stream: remoteStream } : p
        )
      );

      // Hidden audio element for reliable audio playback
      let audioEl = remoteAudioRefs.current.get(remoteUserId);
      if (!audioEl) {
        audioEl = new Audio();
        audioEl.autoplay = true;
        (audioEl as any).playsInline = true;
        remoteAudioRefs.current.set(remoteUserId, audioEl);
      }
      audioEl.srcObject = remoteStream;
      audioEl.play().catch(() => {});
    };

    pc.onconnectionstatechange = () => {
      const state = pc.connectionState;
      console.log(`[WebRTC] ${remoteUserId.slice(0, 8)} connectionState: ${state}`);
      if (state === 'connected') {
        setCallStatus('active');
      } else if (state === 'failed') {
        console.warn(`[WebRTC] Connection to ${remoteUserId.slice(0, 8)} failed, cleaning up`);
        setParticipants(prev => prev.filter(p => p.userId !== remoteUserId));
        pc.close();
        peerConnections.current.delete(remoteUserId);
        remoteAudioRefs.current.get(remoteUserId)?.remove();
        remoteAudioRefs.current.delete(remoteUserId);
      }
    };

    pc.oniceconnectionstatechange = () => {
      const state = pc.iceConnectionState;
      console.log(`[WebRTC] ${remoteUserId.slice(0, 8)} iceConnectionState: ${state}`);
      if (state === 'failed') {
        pc.restartIce();
      }
    };

    // Needed for "perfect negotiation" — handle renegotiation
    pc.onnegotiationneeded = async () => {
      if (!shouldCreateOffer(user?.id || '', remoteUserId)) return;
      try {
        makingOffer.current.set(remoteUserId, true);
        const offer = await pc.createOffer();
        if (pc.signalingState !== 'stable') return; // Abort if state changed
        await pc.setLocalDescription(offer);

        channelRef.current?.send({
          type: 'broadcast',
          event: 'offer',
          payload: { sdp: pc.localDescription, from: user?.id, to: remoteUserId },
        });
      } catch (e) {
        console.error('[WebRTC] onnegotiationneeded error:', e);
      } finally {
        makingOffer.current.set(remoteUserId, false);
      }
    };

    peerConnections.current.set(remoteUserId, pc);
    return pc;
  }, [user?.id]);

  // Initialize call
  useEffect(() => {
    mountedRef.current = true;
    let cleanedUp = false;

    const init = async () => {
      const stream = await startLocalStream();
      if (!stream || cleanedUp) return;

      // Add self as participant
      const { data: profile } = await supabase
        .from('profiles')
        .select('full_name, avatar_url')
        .eq('user_id', user?.id)
        .single();

      setParticipants([{
        userId: user?.id || '',
        name: profile?.full_name || 'You',
        avatar: profile?.avatar_url || undefined,
        isMuted: false,
        isVideoOff: callType === 'audio',
      }]);

      // Join Supabase Realtime channel for signaling
      const realtimeChannel = supabase.channel(`call-${channelId}`, {
        config: { presence: { key: user?.id || '' } },
      });

      realtimeChannel
        .on('presence', { event: 'join' }, async ({ key, newPresences }) => {
          if (key === user?.id || cleanedUp) return;
          const presenceData = newPresences[0] as any;

          // Fetch profile
          let name = presenceData?.name || 'Participant';
          let avatar = presenceData?.avatar;
          try {
            const { data: remoteProfile } = await supabase
              .from('profiles')
              .select('full_name, avatar_url')
              .eq('user_id', key)
              .single();
            if (remoteProfile?.full_name) name = remoteProfile.full_name;
            if (remoteProfile?.avatar_url) avatar = remoteProfile.avatar_url;
          } catch {}

          // Add participant
          setParticipants(prev => {
            if (prev.find(p => p.userId === key)) return prev;
            return [...prev, {
              userId: key,
              name,
              avatar,
              isMuted: false,
              isVideoOff: false,
            }];
          });

          // Create peer connection — the deterministic offerer will auto-create offer via onnegotiationneeded
          createPeerConnection(key);
        })
        .on('presence', { event: 'leave' }, ({ key }) => {
          setParticipants(prev => prev.filter(p => p.userId !== key));
          const pc = peerConnections.current.get(key);
          if (pc) {
            pc.close();
            peerConnections.current.delete(key);
          }
          const audio = remoteAudioRefs.current.get(key);
          if (audio) {
            audio.srcObject = null;
            audio.remove();
            remoteAudioRefs.current.delete(key);
          }
          iceCandidateQueue.current.delete(key);
        })
        .on('broadcast', { event: 'offer' }, async ({ payload }) => {
          if (payload.to !== user?.id || cleanedUp) return;
          const fromId = payload.from;

          let pc = peerConnections.current.get(fromId);
          if (!pc) {
            pc = createPeerConnection(fromId);
          }

          // Perfect negotiation: if we're also making an offer, the "polite" peer rolls back
          const isPolite = !shouldCreateOffer(user?.id || '', fromId);
          const offerCollision = makingOffer.current.get(fromId) || pc.signalingState !== 'stable';

          if (offerCollision && !isPolite) {
            // Impolite peer ignores the incoming offer
            return;
          }

          try {
            if (offerCollision && isPolite) {
              await pc.setLocalDescription({ type: 'rollback' } as any);
            }
            await pc.setRemoteDescription(new RTCSessionDescription(payload.sdp));
            const answer = await pc.createAnswer();
            await pc.setLocalDescription(answer);

            realtimeChannel.send({
              type: 'broadcast',
              event: 'answer',
              payload: { sdp: pc.localDescription, from: user?.id, to: fromId },
            });

            // Flush any queued ICE candidates
            await flushIceCandidates(fromId);
          } catch (e) {
            console.error('[WebRTC] Error handling offer:', e);
          }
        })
        .on('broadcast', { event: 'answer' }, async ({ payload }) => {
          if (payload.to !== user?.id) return;
          const pc = peerConnections.current.get(payload.from);
          if (!pc) return;

          try {
            if (pc.signalingState === 'have-local-offer') {
              await pc.setRemoteDescription(new RTCSessionDescription(payload.sdp));
              await flushIceCandidates(payload.from);
            }
          } catch (e) {
            console.error('[WebRTC] Error handling answer:', e);
          }
        })
        .on('broadcast', { event: 'ice-candidate' }, async ({ payload }) => {
          if (payload.to !== user?.id) return;
          const pc = peerConnections.current.get(payload.from);

          if (!pc || !pc.remoteDescription) {
            // Queue the candidate — remote description not set yet
            const queue = iceCandidateQueue.current.get(payload.from) || [];
            queue.push(payload.candidate);
            iceCandidateQueue.current.set(payload.from, queue);
            return;
          }

          try {
            await pc.addIceCandidate(new RTCIceCandidate(payload.candidate));
          } catch (e) {
            console.warn('[WebRTC] addIceCandidate error:', e);
          }
        })
        .on('broadcast', { event: 'mute-status' }, ({ payload }) => {
          setParticipants(prev =>
            prev.map(p =>
              p.userId === payload.userId
                ? { ...p, isMuted: payload.isMuted, isVideoOff: payload.isVideoOff }
                : p
            )
          );
        })
        .subscribe(async (status) => {
          if (status === 'SUBSCRIBED') {
            const { data: prof } = await supabase
              .from('profiles')
              .select('full_name, avatar_url')
              .eq('user_id', user?.id)
              .single();

            await realtimeChannel.track({
              name: prof?.full_name || 'User',
              avatar: prof?.avatar_url,
              callType,
            });
            setCallStatus('ringing');
            setTimeout(() => {
              if (mountedRef.current) setCallStatus('active');
            }, 3000);
          }
        });

      channelRef.current = realtimeChannel;
    };

    init();

    return () => {
      cleanedUp = true;
      mountedRef.current = false;
      if (channelRef.current) {
        supabase.removeChannel(channelRef.current);
        channelRef.current = null;
      }
      peerConnections.current.forEach(pc => pc.close());
      peerConnections.current.clear();
      iceCandidateQueue.current.clear();
      makingOffer.current.clear();
      remoteAudioRefs.current.forEach(audio => {
        audio.srcObject = null;
        audio.remove();
      });
      remoteAudioRefs.current.clear();
    };
  }, [channelId, user?.id, callType, startLocalStream, createPeerConnection, flushIceCandidates]);

  // Call duration timer
  useEffect(() => {
    if (callStatus === 'active') {
      timerRef.current = setInterval(() => {
        setCallDuration(prev => prev + 1);
      }, 1000);
    }
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [callStatus]);

  const formatDuration = (seconds: number) => {
    const h = Math.floor(seconds / 3600);
    const m = Math.floor((seconds % 3600) / 60);
    const s = seconds % 60;
    if (h > 0) return `${h}:${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
    return `${m}:${s.toString().padStart(2, '0')}`;
  };

  const toggleMute = () => {
    if (localStream) {
      localStream.getAudioTracks().forEach(track => {
        track.enabled = isMuted;
      });
      setIsMuted(!isMuted);
      channelRef.current?.send({
        type: 'broadcast',
        event: 'mute-status',
        payload: { userId: user?.id, isMuted: !isMuted, isVideoOff },
      });
    }
  };

  const toggleVideo = () => {
    if (localStream) {
      const videoTracks = localStream.getVideoTracks();
      if (videoTracks.length > 0) {
        videoTracks.forEach(track => {
          track.enabled = isVideoOff;
        });
        setIsVideoOff(!isVideoOff);
      } else if (isVideoOff) {
        navigator.mediaDevices.getUserMedia({ video: true }).then(newStream => {
          const videoTrack = newStream.getVideoTracks()[0];
          localStream.addTrack(videoTrack);
          peerConnections.current.forEach(pc => {
            pc.addTrack(videoTrack, localStream);
          });
          setIsVideoOff(false);
        }).catch(() => {
          toast.error('Failed to enable camera');
        });
      }
      channelRef.current?.send({
        type: 'broadcast',
        event: 'mute-status',
        payload: { userId: user?.id, isMuted, isVideoOff: !isVideoOff },
      });
    }
  };

  /**
   * Replace video track on ALL peer connections using sender.replaceTrack()
   * — this does NOT trigger renegotiation, preserving ICE.
   */
  const replaceVideoTrackOnAllPeers = useCallback((newTrack: MediaStreamTrack) => {
    peerConnections.current.forEach((pc, peerId) => {
      const sender = pc.getSenders().find(s => s.track?.kind === 'video');
      if (sender) {
        sender.replaceTrack(newTrack).catch(e =>
          console.warn(`[WebRTC] replaceTrack failed for ${peerId.slice(0, 8)}:`, e)
        );
      } else {
        // No video sender exists — add track (will trigger renegotiation)
        const stream = localStreamRef.current;
        if (stream) pc.addTrack(newTrack, stream);
      }
    });
  }, []);

  const stopScreenShare = async () => {
    try {
      localStream?.getVideoTracks().forEach(track => track.stop());
      const camStream = await navigator.mediaDevices.getUserMedia({
        video: { width: { ideal: 1280 }, height: { ideal: 720 } },
      });
      const newVideoTrack = camStream.getVideoTracks()[0];

      replaceVideoTrackOnAllPeers(newVideoTrack);

      const newStream = new MediaStream();
      localStream?.getAudioTracks().forEach(t => newStream.addTrack(t));
      newStream.addTrack(newVideoTrack);

      setLocalStream(newStream);
      setIsScreenSharing(false);
    } catch {
      toast.error('Failed to restore camera');
      setIsScreenSharing(false);
    }
  };

  const startScreenShare = async () => {
    try {
      const screenStream = await navigator.mediaDevices.getDisplayMedia({
        video: { width: { ideal: 1920 }, height: { ideal: 1080 } },
        audio: true,
      });
      const screenTrack = screenStream.getVideoTracks()[0];

      replaceVideoTrackOnAllPeers(screenTrack);

      localStream?.getVideoTracks().forEach(t => t.stop());

      const newStream = new MediaStream();
      localStream?.getAudioTracks().forEach(t => newStream.addTrack(t));
      newStream.addTrack(screenTrack);

      setLocalStream(newStream);

      screenTrack.onended = () => {
        stopScreenShare();
      };

      setIsScreenSharing(true);
      setIsVideoOff(false);
    } catch (error) {
      if (error instanceof Error && error.name === 'NotAllowedError') return;
      toast.error('Screen sharing failed');
    }
  };

  const toggleScreenShare = () => {
    if (isScreenSharing) {
      stopScreenShare();
    } else {
      startScreenShare();
    }
  };

  const endCall = () => {
    setCallStatus('ended');
    localStream?.getTracks().forEach(track => track.stop());
    peerConnections.current.forEach(pc => pc.close());
    if (channelRef.current) {
      supabase.removeChannel(channelRef.current);
      channelRef.current = null;
    }
    toast.success(`Call ended · ${formatDuration(callDuration)}`);
    onClose();
  };

  const toggleFullscreen = () => {
    if (isFullscreen) {
      document.exitFullscreen?.();
    } else {
      panelRef.current?.requestFullscreen?.();
    }
    setIsFullscreen(!isFullscreen);
  };

  const getInitials = (name: string) => {
    const parts = name.trim().split(' ');
    return parts.length >= 2 ? `${parts[0][0]}${parts[parts.length - 1][0]}`.toUpperCase() : name.substring(0, 2).toUpperCase();
  };

  const otherParticipants = participants.filter(p => p.userId !== user?.id);
  const showVideoGrid = callType === 'video' || isScreenSharing;

  return (
    <motion.div
      ref={panelRef}
      initial={{ opacity: 0, scale: 0.95, y: 20 }}
      animate={{ opacity: 1, scale: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.95, y: 20 }}
      className={cn(
        "fixed inset-4 z-50 rounded-2xl overflow-hidden flex flex-col",
        "bg-[hsl(var(--card))] border border-border shadow-2xl shadow-black/30",
        isFullscreen && "inset-0 rounded-none"
      )}
    >
      {/* Header */}
      <div className="flex items-center justify-between px-5 py-3 border-b border-border/50 bg-card/80 backdrop-blur-sm shrink-0">
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2">
            <div className={cn(
              "h-2.5 w-2.5 rounded-full animate-pulse",
              callStatus === 'active' ? 'bg-emerald-500' : callStatus === 'ringing' ? 'bg-amber-500' : 'bg-muted-foreground'
            )} />
            <h3 className="font-semibold text-sm">#{channelName}</h3>
          </div>
          <Badge variant="secondary" className="text-[10px] font-mono">
            {callStatus === 'connecting' ? 'Connecting...' : callStatus === 'ringing' ? 'Ringing...' : formatDuration(callDuration)}
          </Badge>
          <Badge variant="outline" className="text-[10px] gap-1">
            <Users className="w-3 h-3" /> {participants.length}
          </Badge>
        </div>
        <div className="flex items-center gap-1">
          <Tooltip>
            <TooltipTrigger asChild>
              <Button variant="ghost" size="icon" className="h-8 w-8" onClick={toggleFullscreen}>
                {isFullscreen ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
              </Button>
            </TooltipTrigger>
            <TooltipContent>{isFullscreen ? 'Exit fullscreen' : 'Fullscreen'}</TooltipContent>
          </Tooltip>
        </div>
      </div>

      {/* Main content */}
      <div className="flex-1 flex items-center justify-center p-6 overflow-hidden bg-gradient-to-b from-card to-background">
        {showVideoGrid ? (
          <div className={cn(
            "grid gap-3 w-full h-full max-w-6xl",
            participants.length <= 1 && "grid-cols-1",
            participants.length === 2 && "grid-cols-2",
            participants.length <= 4 && participants.length > 2 && "grid-cols-2 grid-rows-2",
            participants.length > 4 && "grid-cols-3 grid-rows-2",
          )}>
            {/* Local video */}
            <div className="relative rounded-xl overflow-hidden bg-muted/30 border border-border/30">
              <video
                ref={localVideoRef}
                autoPlay
                muted
                playsInline
                className={cn(
                  "w-full h-full object-cover",
                  isVideoOff && !isScreenSharing && "hidden"
                )}
              />
              {isVideoOff && !isScreenSharing && (
                <div className="absolute inset-0 flex items-center justify-center">
                  <Avatar className="h-20 w-20">
                    <AvatarFallback className="text-2xl bg-primary/10 text-primary font-bold">
                      {getInitials(participants[0]?.name || 'You')}
                    </AvatarFallback>
                  </Avatar>
                </div>
              )}
              <div className="absolute bottom-2 left-2 flex items-center gap-1.5">
                <Badge variant="secondary" className="text-[10px] bg-black/50 text-white border-0">
                  You {isMuted && '(muted)'}
                </Badge>
              </div>
              {isScreenSharing && (
                <Badge className="absolute top-2 left-2 text-[10px] bg-primary/80">
                  <Monitor className="w-3 h-3 mr-1" /> Screen sharing
                </Badge>
              )}
            </div>

            {/* Remote videos */}
            {otherParticipants.map(p => (
              <div key={p.userId} className="relative rounded-xl overflow-hidden bg-muted/30 border border-border/30">
                {p.stream && !p.isVideoOff ? (
                  <video
                    ref={el => { if (el) { el.srcObject = p.stream!; remoteVideoRefs.current.set(p.userId, el); } }}
                    autoPlay
                    playsInline
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="absolute inset-0 flex items-center justify-center">
                    <Avatar className="h-20 w-20">
                      <AvatarImage src={p.avatar} />
                      <AvatarFallback className="text-2xl bg-primary/10 text-primary font-bold">
                        {getInitials(p.name)}
                      </AvatarFallback>
                    </Avatar>
                  </div>
                )}
                <div className="absolute bottom-2 left-2">
                  <Badge variant="secondary" className="text-[10px] bg-black/50 text-white border-0">
                    {p.name} {p.isMuted && '🔇'}
                  </Badge>
                </div>
              </div>
            ))}
          </div>
        ) : (
          /* Audio-only call UI */
          <div className="flex flex-col items-center gap-6">
            <div className="relative">
              <motion.div
                animate={{ scale: [1, 1.08, 1] }}
                transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }}
                className="absolute inset-0 rounded-full bg-primary/10"
                style={{ margin: '-12px' }}
              />
              <Avatar className="h-28 w-28 border-4 border-primary/20">
                <AvatarFallback className="text-3xl bg-primary/10 text-primary font-bold">
                  {getInitials(channelName)}
                </AvatarFallback>
              </Avatar>
            </div>

            <div className="text-center space-y-1">
              <h2 className="text-xl font-bold">#{channelName}</h2>
              <p className="text-sm text-muted-foreground">
                {callStatus === 'connecting' ? 'Connecting...' :
                  callStatus === 'ringing' ? 'Ringing...' :
                    `${participants.length} participant${participants.length !== 1 ? 's' : ''}`}
              </p>
              {callStatus === 'active' && (
                <p className="text-lg font-mono text-primary">{formatDuration(callDuration)}</p>
              )}
            </div>

            {otherParticipants.length > 0 && (
              <div className="flex -space-x-3">
                {otherParticipants.map(p => (
                  <Tooltip key={p.userId}>
                    <TooltipTrigger>
                      <Avatar className="h-10 w-10 border-2 border-card">
                        <AvatarImage src={p.avatar} />
                        <AvatarFallback className="text-xs bg-primary/10 text-primary">
                          {getInitials(p.name)}
                        </AvatarFallback>
                      </Avatar>
                    </TooltipTrigger>
                    <TooltipContent>{p.name}</TooltipContent>
                  </Tooltip>
                ))}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Controls */}
      <div className="flex items-center justify-center gap-3 py-5 px-6 border-t border-border/50 bg-card/80 backdrop-blur-sm shrink-0">
        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              variant={isMuted ? 'destructive' : 'secondary'}
              size="icon"
              className="h-12 w-12 rounded-full"
              onClick={toggleMute}
            >
              {isMuted ? <MicOff className="w-5 h-5" /> : <Mic className="w-5 h-5" />}
            </Button>
          </TooltipTrigger>
          <TooltipContent>{isMuted ? 'Unmute' : 'Mute'}</TooltipContent>
        </Tooltip>

        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              variant={isVideoOff ? 'secondary' : 'secondary'}
              size="icon"
              className={cn("h-12 w-12 rounded-full", isVideoOff && "bg-muted")}
              onClick={toggleVideo}
            >
              {isVideoOff ? <VideoOff className="w-5 h-5" /> : <Video className="w-5 h-5" />}
            </Button>
          </TooltipTrigger>
          <TooltipContent>{isVideoOff ? 'Turn on camera' : 'Turn off camera'}</TooltipContent>
        </Tooltip>

        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              variant={isScreenSharing ? 'default' : 'secondary'}
              size="icon"
              className="h-12 w-12 rounded-full"
              onClick={toggleScreenShare}
            >
              {isScreenSharing ? <MonitorOff className="w-5 h-5" /> : <Monitor className="w-5 h-5" />}
            </Button>
          </TooltipTrigger>
          <TooltipContent>{isScreenSharing ? 'Stop sharing' : 'Share screen'}</TooltipContent>
        </Tooltip>

        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              variant={isSpeakerOff ? 'secondary' : 'secondary'}
              size="icon"
              className={cn("h-12 w-12 rounded-full", isSpeakerOff && "bg-muted")}
              onClick={() => {
                setIsSpeakerOff(!isSpeakerOff);
                remoteVideoRefs.current.forEach(v => { v.muted = !isSpeakerOff; });
                remoteAudioRefs.current.forEach(a => { a.muted = !isSpeakerOff; });
              }}
            >
              {isSpeakerOff ? <VolumeX className="w-5 h-5" /> : <Volume2 className="w-5 h-5" />}
            </Button>
          </TooltipTrigger>
          <TooltipContent>{isSpeakerOff ? 'Unmute speaker' : 'Mute speaker'}</TooltipContent>
        </Tooltip>

        <div className="w-px h-8 bg-border mx-2" />

        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              variant="destructive"
              size="icon"
              className="h-14 w-14 rounded-full shadow-lg shadow-destructive/30"
              onClick={endCall}
            >
              <PhoneOff className="w-6 h-6" />
            </Button>
          </TooltipTrigger>
          <TooltipContent>End call</TooltipContent>
        </Tooltip>
      </div>
    </motion.div>
  );
}
