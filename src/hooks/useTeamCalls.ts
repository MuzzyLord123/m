import { useState, useEffect, useCallback, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';

export interface CallSession {
  id: string;
  caller_id: string;
  callee_id: string;
  channel_id: string | null;
  call_type: 'audio' | 'video';
  status: 'ringing' | 'accepted' | 'declined' | 'ended' | 'missed' | 'busy';
  started_at: string | null;
  ended_at: string | null;
  created_at: string;
  callerName?: string;
  callerAvatar?: string;
  calleeName?: string;
  calleeAvatar?: string;
}

export function useTeamCalls() {
  const { user } = useAuth();
  const [incomingCall, setIncomingCall] = useState<CallSession | null>(null);
  const [activeCallSession, setActiveCallSession] = useState<CallSession | null>(null);
  const ringtoneRef = useRef<ReturnType<typeof setInterval>>();

  // Listen for incoming calls (calls where I'm the callee and status is 'ringing')
  useEffect(() => {
    if (!user?.id) return;

    // Check for existing ringing calls on mount
    const checkExisting = async () => {
      const { data } = await supabase
        .from('call_sessions')
        .select('*')
        .eq('callee_id', user.id)
        .eq('status', 'ringing')
        .order('created_at', { ascending: false })
        .limit(1);

      if (data && data.length > 0) {
        const call = data[0] as any;
        await enrichCall(call);
      }
    };
    checkExisting();

    // Subscribe to new calls
    const channel = supabase
      .channel('incoming-calls')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'call_sessions',
          filter: `callee_id=eq.${user.id}`,
        },
        async (payload) => {
          const call = payload.new as any;
          if (call.status === 'ringing') {
            await enrichCall(call);
          }
        }
      )
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'call_sessions',
          filter: `callee_id=eq.${user.id}`,
        },
        (payload) => {
          const call = payload.new as any;
          if (call.status !== 'ringing') {
            setIncomingCall(prev => prev?.id === call.id ? null : prev);
          }
        }
      )
      // Also listen for updates to calls I initiated (e.g. callee accepted)
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'call_sessions',
          filter: `caller_id=eq.${user.id}`,
        },
        (payload) => {
          const call = payload.new as any;
          if (call.status === 'accepted') {
            setActiveCallSession(prev => {
              if (prev?.id === call.id) return { ...prev, status: 'accepted' };
              return prev;
            });
          } else if (call.status === 'declined' || call.status === 'ended' || call.status === 'busy') {
            setActiveCallSession(prev => {
              if (prev?.id === call.id) {
                if (call.status === 'declined') toast.info('Call was declined');
                if (call.status === 'busy') toast.info('User is busy');
                return null;
              }
              return prev;
            });
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user?.id]);

  // Auto-timeout ringing calls after 30s
  useEffect(() => {
    if (!incomingCall) return;
    const timeout = setTimeout(async () => {
      await supabase
        .from('call_sessions')
        .update({ status: 'missed', ended_at: new Date().toISOString() })
        .eq('id', incomingCall.id)
        .eq('status', 'ringing');
      setIncomingCall(null);
    }, 30000);
    return () => clearTimeout(timeout);
  }, [incomingCall]);

  const enrichCall = async (call: any) => {
    // Get caller profile
    const { data: callerProfile } = await supabase
      .from('profiles')
      .select('full_name, avatar_url')
      .eq('user_id', call.caller_id)
      .single();

    setIncomingCall({
      ...call,
      callerName: callerProfile?.full_name || 'Unknown',
      callerAvatar: callerProfile?.avatar_url || undefined,
    });
  };

  const initiateCall = useCallback(async (calleeId: string, callType: 'audio' | 'video', channelId?: string) => {
    if (!user?.id) return null;
    if (calleeId === user.id) {
      toast.error("You can't call yourself");
      return null;
    }

    // Check if callee is busy
    const { data: existingCalls } = await supabase
      .from('call_sessions')
      .select('id')
      .or(`caller_id.eq.${calleeId},callee_id.eq.${calleeId}`)
      .in('status', ['ringing', 'accepted'])
      .limit(1);

    if (existingCalls && existingCalls.length > 0) {
      toast.info('User is currently on another call');
      return null;
    }

    const { data, error } = await supabase
      .from('call_sessions')
      .insert({
        caller_id: user.id,
        callee_id: calleeId,
        channel_id: channelId || null,
        call_type: callType,
        status: 'ringing',
      })
      .select()
      .single();

    if (error) {
      toast.error('Failed to initiate call');
      return null;
    }

    // Also create a notification for the callee
    const { data: myProfile } = await supabase
      .from('profiles')
      .select('full_name')
      .eq('user_id', user.id)
      .single();

    await supabase.from('notifications').insert({
      user_id: calleeId,
      type: 'call',
      title: `Incoming ${callType} call`,
      message: `${myProfile?.full_name || 'Someone'} is calling you`,
      icon: callType === 'video' ? 'video' : 'phone',
      link: '/lounge/team-comms',
      metadata: { call_session_id: data.id, call_type: callType },
    });

    setActiveCallSession(data as any);
    toast.info('Calling...');
    return data;
  }, [user?.id]);

  const acceptCall = useCallback(async (callId: string) => {
    const { error } = await supabase
      .from('call_sessions')
      .update({ status: 'accepted', started_at: new Date().toISOString() })
      .eq('id', callId);

    if (!error) {
      const call = incomingCall;
      setIncomingCall(null);
      if (call) {
        setActiveCallSession({ ...call, status: 'accepted' });
      }
      return call;
    }
    return null;
  }, [incomingCall]);

  const declineCall = useCallback(async (callId: string) => {
    await supabase
      .from('call_sessions')
      .update({ status: 'declined', ended_at: new Date().toISOString() })
      .eq('id', callId);
    setIncomingCall(null);
  }, []);

  const endCallSession = useCallback(async (callId: string) => {
    await supabase
      .from('call_sessions')
      .update({ status: 'ended', ended_at: new Date().toISOString() })
      .eq('id', callId);
    setActiveCallSession(null);
  }, []);

  return {
    incomingCall,
    activeCallSession,
    initiateCall,
    acceptCall,
    declineCall,
    endCallSession,
    setActiveCallSession,
  };
}
