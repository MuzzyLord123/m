import { motion } from 'framer-motion';
import { Phone, PhoneOff, Video } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { CallSession } from '@/hooks/useTeamCalls';
import { useEffect, useRef } from 'react';

interface IncomingCallOverlayProps {
  call: CallSession;
  onAccept: () => void;
  onDecline: () => void;
}

function getInitials(name: string) {
  if (!name) return 'U';
  const parts = name.trim().split(' ');
  return parts.length >= 2
    ? `${parts[0][0]}${parts[parts.length - 1][0]}`.toUpperCase()
    : name.substring(0, 2).toUpperCase();
}

export function IncomingCallOverlay({ call, onAccept, onDecline }: IncomingCallOverlayProps) {
  const audioRef = useRef<HTMLAudioElement | null>(null);

  // Play ringtone using oscillator
  useEffect(() => {
    let ctx: AudioContext | null = null;
    let osc: OscillatorNode | null = null;
    let gain: GainNode | null = null;
    let interval: ReturnType<typeof setInterval>;

    try {
      ctx = new AudioContext();
      osc = ctx.createOscillator();
      gain = ctx.createGain();
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.frequency.value = 440;
      osc.type = 'sine';
      gain.gain.value = 0;
      osc.start();

      // Ring pattern: 0.5s on, 0.5s off
      let on = true;
      const ring = () => {
        if (gain) gain.gain.value = on ? 0.15 : 0;
        on = !on;
      };
      ring();
      interval = setInterval(ring, 500);
    } catch {
      // Audio not supported
    }

    return () => {
      clearInterval(interval!);
      try {
        osc?.stop();
        ctx?.close();
      } catch {}
    };
  }, []);

  return (
    <motion.div
      initial={{ opacity: 0, y: -60, scale: 0.9 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, y: -60, scale: 0.9 }}
      className="fixed top-6 left-1/2 -translate-x-1/2 z-[100] w-[380px] rounded-2xl border border-border bg-card shadow-2xl shadow-black/30 overflow-hidden"
    >
      {/* Pulsing ring indicator */}
      <div className="h-1 bg-emerald-500 animate-pulse" />

      <div className="p-6 space-y-5">
        {/* Caller info */}
        <div className="flex items-center gap-4">
          <div className="relative">
            <motion.div
              animate={{ scale: [1, 1.15, 1] }}
              transition={{ duration: 2, repeat: Infinity }}
              className="absolute inset-0 rounded-full bg-emerald-500/20"
            />
            <Avatar className="h-16 w-16 relative z-10 ring-2 ring-emerald-500/30">
              <AvatarImage src={call.callerAvatar || ''} />
              <AvatarFallback className="bg-primary text-primary-foreground text-lg font-bold">
                {getInitials(call.callerName || 'Unknown')}
              </AvatarFallback>
            </Avatar>
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-lg font-bold truncate">{call.callerName || 'Unknown'}</p>
            <div className="flex items-center gap-1.5 text-sm text-muted-foreground">
              {call.call_type === 'video' ? (
                <Video className="w-4 h-4 text-emerald-500" />
              ) : (
                <Phone className="w-4 h-4 text-emerald-500" />
              )}
              <span>Incoming {call.call_type} call</span>
            </div>
          </div>
        </div>

        {/* Action buttons */}
        <div className="flex items-center justify-center gap-6">
          <Button
            size="icon"
            className="h-14 w-14 rounded-full bg-destructive hover:bg-destructive/90 text-destructive-foreground shadow-lg"
            onClick={onDecline}
          >
            <PhoneOff className="w-6 h-6" />
          </Button>
          <Button
            size="icon"
            className="h-14 w-14 rounded-full bg-emerald-500 hover:bg-emerald-600 text-white shadow-lg"
            onClick={onAccept}
          >
            <Phone className="w-6 h-6" />
          </Button>
        </div>

        <p className="text-[10px] text-muted-foreground text-center">
          This call will connect you directly in the app
        </p>
      </div>
    </motion.div>
  );
}
