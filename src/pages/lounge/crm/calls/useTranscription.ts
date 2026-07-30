import { useCallback, useEffect, useRef, useState } from 'react';

/**
 * The transcription engine behind every calling surface.
 *
 * Browser speech recognition is not a stream you start once: it ends by
 * itself after a pause, after a network wobble, and every time the OS
 * lends the microphone to the phone app mid-call. A transcript that
 * runs "100% of call time" therefore lives or dies on the restart loop,
 * which is what this hook owns.
 *
 * Everything the loop needs is held in refs, because the handlers are
 * attached once and would otherwise close over stale state and quietly
 * stop restarting - which is exactly how a transcript dies after the
 * first silence.
 */

export type TranscriptStatus =
  | 'idle'          // not started
  | 'starting'      // waiting for the first result
  | 'listening'     // running
  | 'reconnecting'  // dropped, coming back
  | 'blocked'       // microphone refused
  | 'unsupported';  // no speech recognition in this browser

export function speechRecognitionAvailable(): boolean {
  if (typeof window === 'undefined') return false;
  return !!((window as any).SpeechRecognition || (window as any).webkitSpeechRecognition);
}

export interface Transcription {
  text: string;
  interim: string;
  status: TranscriptStatus;
  running: boolean;
  start: () => void;
  stop: () => void;
  reset: (seed?: string) => void;
  textRef: React.MutableRefObject<string>;
}

export function useTranscription(lang = 'en-GB'): Transcription {
  const [text, setText] = useState('');
  const [interim, setInterim] = useState('');
  const [status, setStatus] = useState<TranscriptStatus>('idle');
  const recogRef = useRef<any>(null);
  const wantRef = useRef(false);
  const retryRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const backoffRef = useRef(300);
  const textRef = useRef('');
  textRef.current = text;

  const clearRetry = () => {
    if (retryRef.current) clearTimeout(retryRef.current);
    retryRef.current = null;
  };

  // Declared as a ref so the recogniser's own handlers can call the
  // latest version without being rebound.
  const spawnRef = useRef<() => void>(() => {});

  spawnRef.current = () => {
    if (!wantRef.current) return;
    const SR = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SR) { setStatus('unsupported'); return; }

    // Tear the previous instance down before making another, or Chrome
    // throws InvalidStateError and the loop stalls.
    const previous = recogRef.current;
    if (previous) {
      previous.onend = null;
      previous.onerror = null;
      previous.onresult = null;
      try { previous.abort(); } catch { /* already gone */ }
    }

    const r = new SR();
    r.lang = lang;
    r.continuous = true;
    r.interimResults = true;

    r.onstart = () => {
      backoffRef.current = 300;
      if (wantRef.current) setStatus('listening');
    };

    r.onresult = (e: any) => {
      let interimText = '';
      let finalText = '';
      for (let i = e.resultIndex; i < e.results.length; i++) {
        const res = e.results[i];
        if (res.isFinal) finalText += `${res[0].transcript.trim()} `;
        else interimText += res[0].transcript;
      }
      if (finalText.trim()) {
        setText(prev => (prev ? `${prev} ` : '') + finalText.trim());
      }
      setInterim(interimText);
      if (wantRef.current) setStatus('listening');
    };

    r.onerror = (e: any) => {
      const kind = e?.error;
      setInterim('');
      if (kind === 'not-allowed' || kind === 'service-not-allowed') {
        // A refusal is the one error worth stopping for: retrying just
        // spins until the user fixes the permission.
        wantRef.current = false;
        setStatus('blocked');
        return;
      }
      // no-speech, network, audio-capture, aborted: all recoverable.
      // onend follows and the restart happens there.
      if (wantRef.current) setStatus('reconnecting');
    };

    r.onend = () => {
      if (recogRef.current !== r) return;
      if (!wantRef.current) { setStatus('idle'); return; }
      setStatus('reconnecting');
      clearRetry();
      retryRef.current = setTimeout(() => spawnRef.current(), backoffRef.current);
      backoffRef.current = Math.min(backoffRef.current * 2, 5000);
    };

    recogRef.current = r;
    try {
      r.start();
      setStatus('starting');
    } catch {
      // Already starting: let onend or onstart settle it.
      clearRetry();
      retryRef.current = setTimeout(() => spawnRef.current(), 600);
    }
  };

  const start = useCallback(() => {
    if (!speechRecognitionAvailable()) { setStatus('unsupported'); return; }
    if (wantRef.current) return;
    wantRef.current = true;
    backoffRef.current = 300;
    spawnRef.current();
  }, []);

  const stop = useCallback(() => {
    wantRef.current = false;
    clearRetry();
    const r = recogRef.current;
    recogRef.current = null;
    setInterim('');
    setStatus('idle');
    if (r) {
      r.onend = null;
      r.onerror = null;
      r.onresult = null;
      try { r.stop(); } catch { /* already stopped */ }
    }
  }, []);

  const reset = useCallback((seed = '') => {
    setText(seed);
    textRef.current = seed;
    setInterim('');
  }, []);

  // The OS takes the microphone away when the call screen comes up and
  // gives it back on return: nudge the loop rather than wait out the
  // backoff.
  useEffect(() => {
    const onVis = () => {
      if (document.visibilityState !== 'visible' || !wantRef.current) return;
      clearRetry();
      backoffRef.current = 300;
      spawnRef.current();
    };
    document.addEventListener('visibilitychange', onVis);
    return () => document.removeEventListener('visibilitychange', onVis);
  }, []);

  useEffect(() => () => {
    wantRef.current = false;
    clearRetry();
    const r = recogRef.current;
    recogRef.current = null;
    if (r) { r.onend = null; try { r.abort(); } catch { /* gone */ } }
  }, []);

  return {
    text, interim, status,
    running: status === 'listening' || status === 'starting' || status === 'reconnecting',
    start, stop, reset, textRef,
  };
}

export const TRANSCRIPT_STATUS_LABEL: Record<TranscriptStatus, string> = {
  idle: 'Not recording',
  starting: 'Starting',
  listening: 'Listening',
  reconnecting: 'Reconnecting',
  blocked: 'Microphone blocked',
  unsupported: 'Not supported here',
};
