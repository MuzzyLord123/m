import { useCallback, useEffect, useRef, useState } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import { Phone, Radar, Check, Loader2, PhoneOff } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { VoiceMeter } from '@/pages/lounge/crm/calls/VoiceMeter';

/**
 * The phone companion. Scan the QR from Calls while signed in on the
 * phone: the token is claimed, a wake lock keeps the screen alive, and
 * dial requests arrive over realtime (with a fast poll as backup). Each
 * push vibrates the phone and raises an incoming-call screen; tapping
 * Call opens the dialler, then the companion times the call, captures
 * the transcript through the phone's microphone (speakerphone) and
 * streams it live back to the desktop console every few seconds.
 */

interface Push {
  id: string;
  phone: string;
  entity_name: string | null;
  call_id: string | null;
  created_at: string;
}

export default function CallCompanion() {
  const { user, loading: authLoading } = useAuth();
  const [params] = useSearchParams();
  const token = params.get('token');
  const [state, setState] = useState<'claiming' | 'connected' | 'invalid'>('claiming');
  const [incoming, setIncoming] = useState<Push | null>(null);
  const [onCall, setOnCall] = useState<Push | null>(null);
  const [callStarted, setCallStarted] = useState<number | null>(null);
  const [elapsed, setElapsed] = useState(0);
  const [transcript, setTranscript] = useState('');
  const [interim, setInterim] = useState('');
  const [listening, setListening] = useState(false);
  const handled = useRef<Set<string>>(new Set());
  const recogRef = useRef<any>(null);
  const wakeRef = useRef<any>(null);
  const transcriptRef = useRef('');
  const lastSyncRef = useRef('');
  transcriptRef.current = transcript;

  const speechSupported = typeof window !== 'undefined' &&
    !!((window as any).SpeechRecognition || (window as any).webkitSpeechRecognition);

  // Claim the token for this signed-in account.
  useEffect(() => {
    if (authLoading || !user) return;
    let cancelled = false;
    (async () => {
      if (!token) { setState('invalid'); return; }
      const { data, error } = await supabase.from('crm_phone_links' as any)
        .update({ claimed_at: new Date().toISOString(), last_seen_at: new Date().toISOString(), device_label: 'phone' } as any)
        .eq('token', token)
        .select('id');
      if (cancelled) return;
      if (error || !((data as any[]) || []).length) setState('invalid');
      else setState('connected');
    })();
    return () => { cancelled = true; };
  }, [authLoading, user, token]);

  // Keep the screen awake while connected, re-acquiring after backgrounding.
  useEffect(() => {
    if (state !== 'connected') return;
    const acquire = async () => {
      try { wakeRef.current = await (navigator as any).wakeLock?.request('screen'); } catch { /* unsupported */ }
    };
    acquire();
    const onVis = () => { if (document.visibilityState === 'visible') acquire(); };
    document.addEventListener('visibilitychange', onVis);
    return () => {
      document.removeEventListener('visibilitychange', onVis);
      wakeRef.current?.release?.().catch(() => {});
    };
  }, [state]);

  const receivePush = useCallback((push: Push) => {
    if (handled.current.has(push.id)) return;
    handled.current.add(push.id);
    setIncoming(push);
    try { navigator.vibrate?.([200, 90, 200, 90, 320]); } catch { /* unsupported */ }
    supabase.from('crm_call_pushes' as any).update({ handled_at: new Date().toISOString() } as any).eq('id', push.id);
  }, []);

  // Dial requests: realtime first, fast poll as the safety net.
  useEffect(() => {
    if (state !== 'connected' || !user) return;
    const channel = supabase
      .channel('crm-call-pushes')
      .on('postgres_changes' as any, {
        event: 'INSERT', schema: 'public', table: 'crm_call_pushes', filter: `user_id=eq.${user.id}`,
      }, (payload: any) => { if (payload?.new?.id) receivePush(payload.new as Push); })
      .subscribe();

    const poll = setInterval(async () => {
      const { data } = await supabase.from('crm_call_pushes' as any)
        .select('id, phone, entity_name, call_id, created_at')
        .is('handled_at', null)
        .gt('created_at', new Date(Date.now() - 10 * 60e3).toISOString())
        .order('created_at', { ascending: false })
        .limit(1);
      const push = ((data as any[]) || [])[0] as Push | undefined;
      if (push) receivePush(push);
    }, 2000);

    const heartbeat = setInterval(() => {
      supabase.from('crm_phone_links' as any)
        .update({ last_seen_at: new Date().toISOString() } as any)
        .eq('token', token as string);
    }, 30000);

    return () => {
      supabase.removeChannel(channel);
      clearInterval(poll);
      clearInterval(heartbeat);
    };
  }, [state, user, token, receivePush]);

  // Call timer.
  useEffect(() => {
    if (!onCall || !callStarted) return;
    const id = setInterval(() => setElapsed(Math.floor((Date.now() - callStarted) / 1000)), 1000);
    return () => clearInterval(id);
  }, [onCall, callStarted]);

  // Stream the transcript to the desktop every 3 seconds while it grows.
  useEffect(() => {
    if (!onCall?.call_id || !user) return;
    const id = setInterval(() => {
      const text = transcriptRef.current.trim();
      if (!text || text === lastSyncRef.current) return;
      lastSyncRef.current = text;
      supabase.from('crm_call_transcripts' as any).upsert({
        call_id: onCall.call_id, admin_id: user.id, content: text, updated_at: new Date().toISOString(),
      } as any);
    }, 3000);
    return () => clearInterval(id);
  }, [onCall?.call_id, user]);

  function startTranscript() {
    const SR = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SR) return;
    const r = new SR();
    r.lang = 'en-GB';
    r.continuous = true;
    r.interimResults = true;
    r.onresult = (e: any) => {
      let interimText = '';
      for (let i = e.resultIndex; i < e.results.length; i++) {
        const res = e.results[i];
        if (res.isFinal) setTranscript(prev => (prev ? prev + ' ' : '') + res[0].transcript.trim());
        else interimText += res[0].transcript;
      }
      setInterim(interimText);
    };
    r.onend = () => { if (recogRef.current === r) { try { r.start(); } catch { /* stopped */ } } };
    r.onerror = () => setInterim('');
    recogRef.current = r;
    try { r.start(); setListening(true); } catch { /* running */ }
  }

  function stopTranscript() {
    const r = recogRef.current;
    recogRef.current = null;
    setListening(false);
    setInterim('');
    if (r) { try { r.stop(); } catch { /* noop */ } }
  }

  function answer(push: Push) {
    setIncoming(null);
    setOnCall(push);
    setCallStarted(Date.now());
    setElapsed(0);
    setTranscript('');
    lastSyncRef.current = '';
    // The tel: jump is on the same tap, so the dialler always opens; the
    // companion stays behind it capturing the transcript.
    setTimeout(() => startTranscript(), 400);
  }

  async function endCall() {
    stopTranscript();
    const push = onCall;
    const duration = callStarted ? Math.floor((Date.now() - callStarted) / 1000) : null;
    setOnCall(null);
    setCallStarted(null);
    if (push?.call_id && user) {
      const text = transcriptRef.current.trim();
      if (text) {
        await supabase.from('crm_call_transcripts' as any).upsert({
          call_id: push.call_id, admin_id: user.id, content: text, updated_at: new Date().toISOString(),
        } as any);
      }
      await supabase.from('crm_call_logs' as any).update({
        ended_at: new Date().toISOString(), duration_seconds: duration,
      } as any).eq('id', push.call_id).is('ended_at', null);
    }
    setTranscript('');
  }

  const kicker = 'font-mono text-[9px] font-medium uppercase tracking-[0.16em] text-muted-foreground';
  const mm = String(Math.floor(elapsed / 60)).padStart(2, '0');
  const ss = String(elapsed % 60).padStart(2, '0');

  return (
    <div className="flex min-h-dvh flex-col bg-background px-6 pb-[max(24px,env(safe-area-inset-bottom))] pt-[max(24px,env(safe-area-inset-top))] text-foreground">
      <header className="flex items-center gap-2.5">
        <span className="flex h-8 w-8 items-center justify-center rounded-[9px] border border-border/60 bg-card">
          <Radar className="h-4 w-4 text-primary" />
        </span>
        <div>
          <p className="font-display text-[15px] font-semibold leading-tight tracking-[-0.01em]">Quooro</p>
          <p className={kicker}>Call companion</p>
        </div>
      </header>
      <div aria-hidden className="mt-4 h-px bg-gradient-to-r from-primary/50 via-border to-transparent" />

      <main className="flex flex-1 flex-col items-center justify-center gap-5 text-center">
        {authLoading ? (
          <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
        ) : !user ? (
          <>
            <p className="max-w-xs text-[14px] leading-relaxed text-muted-foreground">
              Sign in to Quooro on this phone first, then scan the QR again.
            </p>
            <Link
              to="/sign-in"
              className="flex h-11 items-center justify-center rounded-[11px] bg-primary px-6 text-[13px] font-medium text-primary-foreground"
            >
              Sign in
            </Link>
          </>
        ) : state === 'claiming' ? (
          <>
            <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
            <p className="text-[13px] text-muted-foreground">Connecting this phone…</p>
          </>
        ) : state === 'invalid' ? (
          <p className="max-w-xs text-[14px] leading-relaxed text-muted-foreground">
            This link has expired or belongs to another account. Generate a fresh QR from Calls in the CRM and scan again.
          </p>
        ) : onCall ? (
          /* On a call: timer, voice meter, live transcript streaming to desktop. */
          <div className="flex w-full max-w-sm flex-col items-center gap-4">
            <p className={kicker}>On a call</p>
            <p className="truncate font-display text-xl font-semibold tracking-[-0.01em]">{onCall.entity_name || 'Lead'}</p>
            <p className="font-mono text-[34px] font-semibold tabular-nums">{mm}:{ss}</p>
            <VoiceMeter active={listening} />
            <div className="max-h-44 min-h-[88px] w-full overflow-y-auto rounded-[12px] border border-border/60 bg-card p-3.5 text-left text-[13px] leading-relaxed">
              {transcript || interim ? (
                <>
                  {transcript}
                  {interim && <span className="text-muted-foreground"> {interim}</span>}
                </>
              ) : (
                <span className="text-muted-foreground">
                  {speechSupported
                    ? (listening
                      ? 'Listening. Put the call on speakerphone so both sides are captured.'
                      : 'Transcription is starting…')
                    : 'This browser cannot transcribe. Use Chrome on Android for live transcripts.'}
                </span>
              )}
            </div>
            <p className="text-[10.5px] text-muted-foreground">Streaming live to your desktop console.</p>
            <div className="flex w-full gap-2">
              <a
                href={`tel:${onCall.phone.replace(/\s+/g, '')}`}
                className="flex h-12 flex-1 items-center justify-center gap-2 rounded-[12px] border border-border/60 text-[13px] font-medium"
              >
                <Phone className="h-4 w-4" /> Redial
              </a>
              <button
                type="button"
                onClick={endCall}
                className="flex h-12 flex-1 items-center justify-center gap-2 rounded-[12px] bg-risk text-[13px] font-medium text-white"
              >
                <PhoneOff className="h-4 w-4" /> End call
              </button>
            </div>
          </div>
        ) : incoming ? (
          /* Incoming push: one tap places the call and starts the transcript. */
          <div className="flex w-full max-w-sm flex-col items-center gap-5">
            <p className={kicker}>Call from your desk</p>
            <div>
              <p className="font-display text-2xl font-semibold tracking-[-0.02em]">{incoming.entity_name || 'Lead'}</p>
              <p className="mt-1 font-mono text-[15px] tabular-nums text-muted-foreground">{incoming.phone}</p>
            </div>
            <a
              href={`tel:${incoming.phone.replace(/\s+/g, '')}`}
              onClick={() => answer(incoming)}
              className="flex h-16 w-full items-center justify-center gap-2.5 rounded-[16px] bg-primary text-[16px] font-semibold text-primary-foreground"
            >
              <Phone className="h-5 w-5" /> Call now
            </a>
            <button
              type="button"
              onClick={() => setIncoming(null)}
              className="text-[12.5px] text-muted-foreground transition-colors hover:text-foreground"
            >
              Dismiss
            </button>
          </div>
        ) : (
          <>
            <span className="relative flex h-14 w-14 items-center justify-center rounded-full bg-ok/10 text-ok">
              <span aria-hidden className="absolute inset-0 animate-ping rounded-full bg-ok/20" style={{ animationDuration: '2.4s' }} />
              <Check className="h-6 w-6" />
            </span>
            <div>
              <p className="font-display text-lg font-semibold tracking-[-0.01em]">Phone connected</p>
              <p className="mt-1 max-w-xs text-[13px] leading-relaxed text-muted-foreground">
                Keep this page open. Press Call on your desktop and this phone rings the lead, with the transcript streaming back to your desk.
              </p>
            </div>
          </>
        )}
      </main>

      <p className="pt-4 text-center font-mono text-[8.5px] uppercase tracking-[0.16em] text-muted-foreground/60">
        Quooro · Built in Wales
      </p>
    </div>
  );
}
