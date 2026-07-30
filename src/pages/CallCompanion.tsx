import { useCallback, useEffect, useRef, useState } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import { Phone, Radar, Check, Loader2, Mic, RefreshCw, Copy } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { VoiceMeter } from '@/pages/lounge/crm/calls/VoiceMeter';
import {
  type MicState, queryMicPermission, requestMic, micUnblockHelp, speechRecognitionSupported,
} from '@/pages/lounge/crm/calls/micPermission';

/**
 * The phone companion. Pairs by QR, keeps a wake lock, receives dial
 * pushes over realtime and dials the moment one lands - the dialler is
 * opened automatically where the browser allows it, with a one-tap
 * fallback when it does not. Microphone permission is a first-class
 * setup step: the page knows whether it is granted, promptable or
 * blocked, and walks the user through their browser's own site settings
 * when they denied it by accident. Transcripts stream to the desktop
 * every few seconds and resume automatically when the user returns from
 * the call screen.
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
  const [mic, setMic] = useState<MicState>('unknown');
  const [micBusy, setMicBusy] = useState(false);
  const [onCall, setOnCall] = useState<Push | null>(null);
  const [callStarted, setCallStarted] = useState<number | null>(null);
  const [elapsed, setElapsed] = useState(0);
  const [transcript, setTranscript] = useState('');
  const [interim, setInterim] = useState('');
  const [listening, setListening] = useState(false);
  const [copied, setCopied] = useState(false);
  const handled = useRef<Set<string>>(new Set());
  const recogRef = useRef<any>(null);
  const wakeRef = useRef<any>(null);
  const transcriptRef = useRef('');
  const lastSyncRef = useRef('');
  const onCallRef = useRef<Push | null>(null);
  transcriptRef.current = transcript;
  onCallRef.current = onCall;

  const speechOk = typeof window !== 'undefined' && speechRecognitionSupported();
  const help = micUnblockHelp();

  // Claim the token for this signed-in account.
  useEffect(() => {
    if (authLoading || !user) return;
    let cancelled = false;
    (async () => {
      if (!token) { setState('invalid'); return; }
      const { data, error } = await supabase.from('crm_phone_links' as any)
        .update({ claimed_at: new Date().toISOString(), last_seen_at: new Date().toISOString(), device_label: help.browser } as any)
        .eq('token', token)
        .select('id');
      if (cancelled) return;
      if (error || !((data as any[]) || []).length) setState('invalid');
      else setState('connected');
    })();
    return () => { cancelled = true; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [authLoading, user, token]);

  // Track the real microphone permission, live.
  useEffect(() => {
    if (state !== 'connected') return;
    let status: any;
    let alive = true;
    (async () => {
      const s = await queryMicPermission();
      if (alive) setMic(s);
      try {
        status = await (navigator.permissions as any)?.query({ name: 'microphone' });
        if (status) status.onchange = () => { if (alive) setMic(status.state); };
      } catch { /* no live updates */ }
    })();
    return () => { alive = false; if (status) status.onchange = null; };
  }, [state]);

  async function enableMic() {
    setMicBusy(true);
    const result = await requestMic();
    setMic(result);
    setMicBusy(false);
  }

  // Wake lock while connected, re-acquired after backgrounding.
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

  function startTranscript() {
    if (!speechOk) return;
    const SR = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
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

  const dial = (phone: string) => {
    window.location.href = `tel:${phone.replace(/\s+/g, '')}`;
  };

  // A push lands: go straight to the on-call screen, start the
  // transcript, and try to open the dialler with no tap at all. If the
  // browser blocks the automatic jump, the big dial button is right
  // there.
  const receivePush = useCallback((push: Push) => {
    if (handled.current.has(push.id)) return;
    handled.current.add(push.id);
    try { navigator.vibrate?.([200, 90, 200, 90, 320]); } catch { /* unsupported */ }
    supabase.from('crm_call_pushes' as any).update({ handled_at: new Date().toISOString() } as any).eq('id', push.id);
    setOnCall(push);
    setCallStarted(Date.now());
    setElapsed(0);
    setTranscript('');
    lastSyncRef.current = '';
    setTimeout(() => startTranscript(), 300);
    dial(push.phone);
    // eslint-disable-next-line react-hooks/exhaustive-deps
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

  // Coming back from the dialler: pick the transcript straight back up.
  useEffect(() => {
    const onVis = () => {
      if (document.visibilityState === 'visible' && onCallRef.current && !recogRef.current) {
        startTranscript();
      }
    };
    document.addEventListener('visibilitychange', onVis);
    return () => document.removeEventListener('visibilitychange', onVis);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

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

  async function finishCall() {
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

  async function copyLink() {
    try {
      await navigator.clipboard.writeText(window.location.href);
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    } catch { /* clipboard unavailable */ }
  }

  const kicker = 'font-mono text-[9px] font-medium uppercase tracking-[0.16em] text-muted-foreground';
  const mm = String(Math.floor(elapsed / 60)).padStart(2, '0');
  const ss = String(elapsed % 60).padStart(2, '0');

  const micSetup = mic !== 'granted' && (
    <div className="w-full max-w-sm rounded-[14px] border border-attend/40 bg-attend/[0.05] p-4 text-left">
      <p className="flex items-center gap-2 text-[13px] font-semibold">
        <Mic className="h-4 w-4 text-attend" /> Microphone needed for transcripts
      </p>
      {mic === 'denied' ? (
        <>
          <p className="mt-1.5 text-[12px] leading-relaxed text-muted-foreground">
            {help.browser} has this site's microphone blocked, and browsers never re-show the popup once blocked. Unblock it in {help.browser}'s site settings:
          </p>
          <ol className="mt-2 space-y-1">
            {help.steps.map((s, i) => (
              <li key={i} className="flex gap-2 text-[12px] leading-relaxed">
                <span className="font-mono text-[10px] tabular-nums text-attend">{i + 1}.</span> {s}
              </li>
            ))}
          </ol>
          <div className="mt-3 flex gap-2">
            <button
              type="button"
              onClick={enableMic}
              disabled={micBusy}
              className="flex h-10 flex-1 items-center justify-center gap-1.5 rounded-[10px] bg-primary text-[12.5px] font-medium text-primary-foreground"
            >
              {micBusy ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <RefreshCw className="h-3.5 w-3.5" />} Retry
            </button>
            <button
              type="button"
              onClick={() => window.location.reload()}
              className="flex h-10 flex-1 items-center justify-center rounded-[10px] border border-border/60 text-[12.5px]"
            >
              Reload page
            </button>
          </div>
        </>
      ) : (
        <>
          <p className="mt-1.5 text-[12px] leading-relaxed text-muted-foreground">
            Allow it once and it keeps working in {help.browser} on this phone from then on.
          </p>
          <button
            type="button"
            onClick={enableMic}
            disabled={micBusy}
            className="mt-3 flex h-10 w-full items-center justify-center gap-1.5 rounded-[10px] bg-primary text-[12.5px] font-medium text-primary-foreground"
          >
            {micBusy ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Mic className="h-3.5 w-3.5" />} Enable microphone
          </button>
        </>
      )}
    </div>
  );

  const chromeNote = !speechOk && (
    <div className="w-full max-w-sm rounded-[14px] border border-border/60 bg-card p-4 text-left">
      <p className="text-[13px] font-semibold">Live transcripts need Chrome</p>
      <p className="mt-1.5 text-[12px] leading-relaxed text-muted-foreground">
        {help.browser} cannot transcribe speech - it has never shipped that capability, no matter the permissions. The voice meter still works here; for live transcripts open this same link in Chrome and pair there.
      </p>
      <button
        type="button"
        onClick={copyLink}
        className="mt-3 flex h-10 w-full items-center justify-center gap-1.5 rounded-[10px] border border-border/60 text-[12.5px]"
      >
        {copied ? <Check className="h-3.5 w-3.5 text-ok" /> : <Copy className="h-3.5 w-3.5" />}
        {copied ? 'Link copied, paste it into Chrome' : 'Copy this page link for Chrome'}
      </button>
    </div>
  );

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
          /* One screen for the whole call: dial, meter, live transcript. */
          <div className="flex w-full max-w-sm flex-col items-center gap-4">
            <p className={kicker}>On a call</p>
            <p className="truncate font-display text-xl font-semibold tracking-[-0.01em]">{onCall.entity_name || 'Lead'}</p>
            <p className="font-mono text-[34px] font-semibold tabular-nums">{mm}:{ss}</p>
            <button
              type="button"
              onClick={() => dial(onCall.phone)}
              className="flex h-14 w-full items-center justify-center gap-2.5 rounded-[14px] bg-primary text-[15px] font-semibold text-primary-foreground"
            >
              <Phone className="h-5 w-5" /> Open dialler · {onCall.phone}
            </button>
            <p className="text-[10.5px] leading-relaxed text-muted-foreground">
              Android shows the phone app while you dial. Put the call on speakerphone and come straight back here - the transcript resumes on its own.
            </p>
            {mic === 'granted' ? <VoiceMeter active={listening} /> : micSetup}
            {chromeNote}
            <div className="max-h-40 min-h-[80px] w-full overflow-y-auto rounded-[12px] border border-border/60 bg-card p-3.5 text-left text-[13px] leading-relaxed">
              {transcript || interim ? (
                <>
                  {transcript}
                  {interim && <span className="text-muted-foreground"> {interim}</span>}
                </>
              ) : (
                <span className="text-muted-foreground">
                  {speechOk
                    ? (mic === 'granted'
                      ? (listening ? 'Listening. Speakerphone captures both sides.' : 'Transcription is starting…')
                      : 'Enable the microphone above to start the transcript.')
                    : 'No live transcript in this browser - the call still logs with its timer and outcome.'}
                </span>
              )}
            </div>
            <p className="text-[10.5px] text-muted-foreground">Streaming live to your desktop console.</p>
            <button
              type="button"
              onClick={finishCall}
              className="flex h-12 w-full items-center justify-center gap-2 rounded-[12px] border border-border/60 text-[13px] font-medium"
            >
              <Check className="h-4 w-4" /> Finish and save
            </button>
            <p className="-mt-3 text-[10px] text-muted-foreground">
              Hang up in your phone's call screen, then tap Finish.
            </p>
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
                Keep this page open. Press Call on your desktop and this phone dials the lead straight away.
              </p>
            </div>
            {micSetup}
            {mic === 'granted' && (
              <p className="flex items-center gap-1.5 font-mono text-[9.5px] uppercase tracking-[0.14em] text-ok">
                <Mic className="h-3 w-3" /> Microphone ready
              </p>
            )}
            {chromeNote}
          </>
        )}
      </main>

      <p className="pt-4 text-center font-mono text-[8.5px] uppercase tracking-[0.16em] text-muted-foreground/60">
        Quooro · Built in Wales
      </p>
    </div>
  );
}
