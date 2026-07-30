import { useCallback, useEffect, useRef, useState } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import { Phone, Radar, Check, Loader2, Mic, RefreshCw, Copy, PictureInPicture2 } from 'lucide-react';
import { cn } from '@/lib/utils';
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

const CALL_KEY = 'quooro-active-call';

/**
 * The in-progress call is written to both stores: localStorage survives
 * the tab being discarded and restored, sessionStorage covers private
 * windows where localStorage is refused.
 */
function storeCall(payload: { push: Push; startedAt: number | null; transcript?: string }) {
  const raw = JSON.stringify(payload);
  try { localStorage.setItem(CALL_KEY, raw); } catch { /* refused */ }
  try { sessionStorage.setItem(CALL_KEY, raw); } catch { /* refused */ }
}

function readStoredCall(): { push: Push; startedAt: number; transcript?: string } | null {
  for (const store of [localStorage, sessionStorage]) {
    try {
      const raw = store.getItem(CALL_KEY);
      if (raw) return JSON.parse(raw);
    } catch { /* unreadable */ }
  }
  return null;
}

function clearStoredCall() {
  try { localStorage.removeItem(CALL_KEY); } catch { /* noop */ }
  try { sessionStorage.removeItem(CALL_KEY); } catch { /* noop */ }
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
  const [deskFinished, setDeskFinished] = useState(false);
  const [pip, setPip] = useState(false);
  const handled = useRef<Set<string>>(new Set());
  const recogRef = useRef<any>(null);
  const wakeRef = useRef<any>(null);
  const transcriptRef = useRef('');
  const lastSyncRef = useRef('');
  const onCallRef = useRef<Push | null>(null);
  const loadedAtRef = useRef(Date.now());
  const callStartedRef = useRef<number | null>(null);
  const pipVideoRef = useRef<HTMLVideoElement>(null);
  const pipCanvasRef = useRef<HTMLCanvasElement | null>(null);
  const pipTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const pipStreamRef = useRef<MediaStream | null>(null);
  transcriptRef.current = transcript;
  onCallRef.current = onCall;
  callStartedRef.current = callStarted;

  const speechOk = typeof window !== 'undefined' && speechRecognitionSupported();
  const help = micUnblockHelp();
  const pipSupported = typeof document !== 'undefined'
    && (document as any).pictureInPictureEnabled
    && typeof (HTMLCanvasElement.prototype as any).captureStream === 'function';

  // Connect. Being signed in on this page is the proof the phone is
  // yours, so the companion always connects: it claims the QR token when
  // one is present (so the desktop's waiting card resolves) and
  // self-registers a claimed link otherwise. Old unhandled pushes are
  // swept first so a stale dial from an earlier session can never fire
  // the moment the page opens.
  useEffect(() => {
    if (authLoading || !user) return;
    let cancelled = false;
    (async () => {
      await supabase.from('crm_call_pushes' as any)
        .update({ handled_at: new Date().toISOString() } as any)
        .is('handled_at', null)
        .lt('created_at', new Date(loadedAtRef.current - 5000).toISOString());

      if (token) {
        await supabase.from('crm_phone_links' as any)
          .update({ claimed_at: new Date().toISOString(), last_seen_at: new Date().toISOString(), device_label: help.browser } as any)
          .eq('token', token);
      }

      const { data: links } = await supabase.from('crm_phone_links' as any)
        .select('id').not('claimed_at', 'is', null).limit(1);
      if (!((links as any[]) || []).length) {
        await supabase.from('crm_phone_links' as any).insert({
          user_id: user.id,
          token: crypto.randomUUID().replace(/-/g, ''),
          claimed_at: new Date().toISOString(),
          last_seen_at: new Date().toISOString(),
          device_label: help.browser,
        } as any);
      }
      if (!cancelled) {
        setState('connected');
        reconcileLiveCall();
      }
    })();
    return () => { cancelled = true; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [authLoading, user, token]);

  // First paint after a reload: put the call screen straight back up
  // from storage so there is never a flash of the idle screen. The
  // database reconcile that follows is the authority on whether the
  // call is still running.
  useEffect(() => {
    const saved = readStoredCall();
    if (!saved?.push?.id) return;
    if (Date.now() - saved.startedAt >= 2 * 3600e3) { clearStoredCall(); return; }
    handled.current.add(saved.push.id);
    setOnCall(saved.push);
    setCallStarted(saved.startedAt);
    setTranscript(saved.transcript || '');
    setTimeout(() => { if (!recogRef.current) startTranscript(); }, 500);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // The live call belongs to the database, not to this page's memory.
  // Whatever happens to the tab - Opera reloading it on the way back
  // from the dialler, the browser discarding it in the background, even
  // opening the link fresh on another phone - the companion rejoins the
  // call in progress here, with its real start time and the transcript
  // captured so far. If nothing is live any more, the screen clears.
  const reconcileLiveCall = useCallback(async () => {
    if (!user) return;
    const { data, error } = await supabase.from('crm_call_logs' as any)
      .select('id, phone, entity_name, started_at')
      .eq('admin_id', user.id)
      .eq('source', 'phone')
      .is('ended_at', null)
      .gt('started_at', new Date(Date.now() - 2 * 3600e3).toISOString())
      .order('started_at', { ascending: false })
      .limit(1);
    // A failed lookup says nothing about the call. Never clear the
    // screen on a network blip - only on a clean "no live call".
    if (error) return;
    const log = ((data as any[]) || [])[0];
    if (!log) {
      if (onCallRef.current) finishFromDesk();
      else clearStoredCall();
      return;
    }
    if (onCallRef.current?.call_id === log.id) return;

    const push: Push = {
      id: `log-${log.id}`,
      phone: log.phone,
      entity_name: log.entity_name,
      call_id: log.id,
      created_at: log.started_at,
    };
    handled.current.add(push.id);
    const startedAt = new Date(log.started_at).getTime();
    const { data: t } = await supabase.from('crm_call_transcripts' as any)
      .select('content').eq('call_id', log.id).limit(1);
    const text = ((t as any[]) || [])[0]?.content || '';
    lastSyncRef.current = text;
    setOnCall(push);
    setCallStarted(startedAt);
    setTranscript(text);
    storeCall({ push, startedAt, transcript: text });
    setTimeout(() => { if (!recogRef.current) startTranscript(); }, 400);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user]);

  // Write the call down before the page goes away, so even an
  // unexpected teardown loses nothing.
  useEffect(() => {
    const persist = () => {
      if (onCallRef.current) {
        storeCall({ push: onCallRef.current, startedAt: callStartedRef.current, transcript: transcriptRef.current });
      }
    };
    window.addEventListener('pagehide', persist);
    return () => window.removeEventListener('pagehide', persist);
  }, []);

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
    // Restart with a short breather: recognition drops out whenever the
    // OS borrows the mic (dialler up, screen off) and this loop brings
    // it back the moment it can.
    r.onend = () => {
      setTimeout(() => {
        if (recogRef.current === r) { try { r.start(); } catch { /* stopped */ } }
      }, 400);
    };
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

  // Hand the number to the phone app through an anchor rather than a
  // document navigation. Assigning location.href makes Opera treat the
  // call as leaving the site, which is what reloaded this page and
  // dropped the live call on the way back.
  const dial = (phone: string) => {
    const a = document.createElement('a');
    a.href = `tel:${phone.replace(/\s+/g, '')}`;
    a.rel = 'noopener';
    a.style.display = 'none';
    document.body.appendChild(a);
    a.click();
    setTimeout(() => a.remove(), 0);
  };

  // A push lands: go straight to the on-call screen, start the
  // transcript, and try to open the dialler with no tap at all. If the
  // browser blocks the automatic jump, the big dial button is right
  // there.
  const receivePush = useCallback((push: Push) => {
    if (handled.current.has(push.id)) return;
    handled.current.add(push.id);
    supabase.from('crm_call_pushes' as any).update({ handled_at: new Date().toISOString() } as any).eq('id', push.id);
    // Never dial a push from before this page opened - that is a
    // leftover from an earlier session, not a live request.
    if (new Date(push.created_at).getTime() < loadedAtRef.current - 5000) return;
    try { navigator.vibrate?.([200, 90, 200, 90, 320]); } catch { /* unsupported */ }
    setOnCall(push);
    setCallStarted(Date.now());
    setElapsed(0);
    setTranscript('');
    lastSyncRef.current = '';
    storeCall({ push, startedAt: Date.now() });
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
        .not('claimed_at', 'is', null);
    }, 30000);

    return () => {
      supabase.removeChannel(channel);
      clearInterval(poll);
      clearInterval(heartbeat);
    };
  }, [state, user, token, receivePush]);

  // Coming back from the dialler: rejoin the call and pick the
  // transcript straight back up.
  useEffect(() => {
    const onVis = () => {
      if (document.visibilityState !== 'visible') return;
      if (onCallRef.current && !recogRef.current) startTranscript();
      reconcileLiveCall();
    };
    document.addEventListener('visibilitychange', onVis);
    window.addEventListener('pageshow', onVis);
    return () => {
      document.removeEventListener('visibilitychange', onVis);
      window.removeEventListener('pageshow', onVis);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [reconcileLiveCall]);

  // Call timer.
  useEffect(() => {
    if (!onCall || !callStarted) return;
    const id = setInterval(() => setElapsed(Math.floor((Date.now() - callStarted) / 1000)), 1000);
    return () => clearInterval(id);
  }, [onCall, callStarted]);

  // Every 3 seconds while on a call: stream the transcript to the
  // desktop, and watch for the call being finished at the desk - one
  // Finish anywhere ends the call on both screens.
  useEffect(() => {
    if (!onCall?.call_id || !user) return;
    const id = setInterval(async () => {
      const text = transcriptRef.current.trim();
      if (text && text !== lastSyncRef.current) {
        lastSyncRef.current = text;
        supabase.from('crm_call_transcripts' as any).upsert({
          call_id: onCall.call_id, admin_id: user.id, content: text, updated_at: new Date().toISOString(),
        } as any);
        storeCall({ push: onCall, startedAt: callStarted, transcript: text });
      }
      const { data } = await supabase.from('crm_call_logs' as any)
        .select('ended_at').eq('id', onCall.call_id!).limit(1);
      if (((data as any[]) || [])[0]?.ended_at) finishFromDesk();
    }, 3000);
    return () => clearInterval(id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [onCall?.call_id, user]);

  // Show the live call on the lock screen and notification shade where
  // the OS supports media metadata.
  useEffect(() => {
    if (!onCall) return;
    try {
      if ('mediaSession' in navigator && typeof (window as any).MediaMetadata === 'function') {
        (navigator as any).mediaSession.metadata = new (window as any).MediaMetadata({
          title: `${onCall.entity_name || 'Lead'} · live call`,
          artist: 'Quooro',
          artwork: [
            { src: '/favicon.png', sizes: '196x196', type: 'image/png' },
            { src: '/apple-touch-icon.png', sizes: '180x180', type: 'image/png' },
          ],
        });
      }
    } catch { /* unsupported */ }
    return () => {
      try { (navigator as any).mediaSession.metadata = null; } catch { /* noop */ }
    };
  }, [onCall]);

  // The floating call card: the call screen rendered to a canvas and
  // popped out through picture-in-picture, so a movable always-on-top
  // mini window keeps the timer in view while other apps are open.
  function drawPipFrame() {
    const canvas = pipCanvasRef.current;
    if (!canvas) return;
    const c = canvas.getContext('2d');
    if (!c) return;
    const w = canvas.width;
    const h = canvas.height;
    c.fillStyle = '#0A0A0D';
    c.fillRect(0, 0, w, h);
    c.fillStyle = 'rgba(194,65,12,0.9)';
    c.fillRect(0, 0, w, 3);
    c.fillStyle = 'rgba(160,160,168,0.9)';
    c.font = '500 20px ui-monospace, SFMono-Regular, Menlo, monospace';
    c.fillText('Q U O O R O   ·   L I V E   C A L L', 36, 64);
    const t = Date.now() / 1000;
    c.fillStyle = `rgba(194,65,12,${(0.55 + 0.45 * Math.abs(Math.sin(t * 2))).toFixed(2)})`;
    c.beginPath();
    c.arc(w - 48, 56, 9, 0, Math.PI * 2);
    c.fill();
    const name = onCallRef.current?.entity_name || 'Lead';
    c.fillStyle = '#EDEDEF';
    c.font = '600 40px system-ui, -apple-system, sans-serif';
    c.fillText(name.length > 22 ? `${name.slice(0, 21)}…` : name, 36, 138);
    const secs = callStartedRef.current ? Math.floor((Date.now() - callStartedRef.current) / 1000) : 0;
    const mmp = String(Math.floor(secs / 60)).padStart(2, '0');
    const ssp = String(secs % 60).padStart(2, '0');
    c.font = '600 112px ui-monospace, SFMono-Regular, Menlo, monospace';
    c.fillText(`${mmp}:${ssp}`, 36, 264);
    c.fillStyle = 'rgba(160,160,168,0.75)';
    c.font = '400 20px system-ui, -apple-system, sans-serif';
    c.fillText('Tap to return · transcript keeps streaming', 36, 324);
  }

  function closePip() {
    if (pipTimerRef.current) clearInterval(pipTimerRef.current);
    pipTimerRef.current = null;
    setPip(false);
    const video = pipVideoRef.current;
    if (video) {
      try {
        if ((document as any).pictureInPictureElement === video) (document as any).exitPictureInPicture();
      } catch { /* already closed */ }
      video.srcObject = null;
    }
    pipStreamRef.current?.getTracks().forEach(tr => tr.stop());
    pipStreamRef.current = null;
  }

  async function enterPip() {
    const video = pipVideoRef.current;
    if (!video || pip) return;
    if (!pipCanvasRef.current) {
      const cv = document.createElement('canvas');
      cv.width = 640;
      cv.height = 360;
      pipCanvasRef.current = cv;
    }
    drawPipFrame();
    try {
      const stream = (pipCanvasRef.current as any).captureStream(4) as MediaStream;
      pipStreamRef.current = stream;
      video.srcObject = stream;
      await video.play();
      await (video as any).requestPictureInPicture();
      setPip(true);
      pipTimerRef.current = setInterval(drawPipFrame, 500);
    } catch {
      closePip();
    }
  }

  useEffect(() => {
    const v = pipVideoRef.current;
    if (!v) return;
    const onLeave = () => closePip();
    v.addEventListener('leavepictureinpicture', onLeave);
    return () => v.removeEventListener('leavepictureinpicture', onLeave);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (!onCall) closePip();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [onCall]);

  // The desk pressed End call and save: clear this screen too, keeping
  // whatever transcript is newest, without touching the already-ended
  // log.
  function finishFromDesk() {
    if (!onCallRef.current) return;
    clearStoredCall();
    stopTranscript();
    closePip();
    const push = onCallRef.current;
    const text = transcriptRef.current.trim();
    if (push?.call_id && user && text && text !== lastSyncRef.current) {
      supabase.from('crm_call_transcripts' as any).upsert({
        call_id: push.call_id, admin_id: user.id, content: text, updated_at: new Date().toISOString(),
      } as any);
    }
    setOnCall(null);
    setCallStarted(null);
    setTranscript('');
    setDeskFinished(true);
    setTimeout(() => setDeskFinished(false), 6000);
  }

  async function finishCall() {
    clearStoredCall();
    stopTranscript();
    closePip();
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
        {user && state === 'connected' && (
          <span className="ml-auto flex items-center gap-1.5 rounded-full border border-border/60 bg-card px-2.5 py-1 font-mono text-[8.5px] font-medium uppercase tracking-[0.14em]">
            <span aria-hidden className={cn('h-1.5 w-1.5 rounded-full', onCall ? 'animate-pulse bg-primary' : 'bg-ok')} />
            {onCall ? 'Live call' : 'Linked'}
          </span>
        )}
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
              Android shows the phone app while you dial. Put the call on speakerphone and come straight back - this screen and the transcript pick up exactly where they were, even if the browser reloads the page.
            </p>
            {pipSupported && (
              <button
                type="button"
                onClick={() => (pip ? closePip() : enterPip())}
                className="flex h-11 w-full items-center justify-center gap-2 rounded-[12px] border border-border/60 text-[12.5px] font-medium"
              >
                <PictureInPicture2 className="h-4 w-4" />
                {pip ? 'Close the floating card' : 'Float this call over other apps'}
              </button>
            )}
            {mic === 'granted' ? <VoiceMeter active /> : micSetup}
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
              One Finish is enough: end it here or at your desk and both screens clear themselves.
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
            {deskFinished && (
              <p className="flex items-center gap-1.5 rounded-full border border-ok/40 bg-ok/[0.06] px-3.5 py-1.5 text-[11.5px] text-ok">
                <Check className="h-3.5 w-3.5" /> Call saved from your desk
              </p>
            )}
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

      {/* Off-screen sink for the picture-in-picture call card. */}
      <video ref={pipVideoRef} muted playsInline className="pointer-events-none fixed left-0 top-0 h-px w-px opacity-0" />
    </div>
  );
}
