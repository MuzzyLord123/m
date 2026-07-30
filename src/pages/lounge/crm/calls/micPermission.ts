/**
 * Microphone permission handling for the calling surfaces. Browsers
 * never re-show the permission popup once a site is blocked, so the UI
 * needs to know the real state and walk the user through the browser's
 * own site-settings when they denied by accident.
 */

export type MicState = 'granted' | 'denied' | 'prompt' | 'unknown';

export async function queryMicPermission(): Promise<MicState> {
  try {
    const status = await (navigator.permissions as any)?.query({ name: 'microphone' as PermissionName });
    if (status?.state === 'granted' || status?.state === 'denied' || status?.state === 'prompt') return status.state;
  } catch { /* Permissions API unsupported for microphone */ }
  return 'unknown';
}

/** Ask for the mic (must run from a tap). Returns the resulting state. */
export async function requestMic(): Promise<MicState> {
  try {
    const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
    stream.getTracks().forEach(t => t.stop());
    return 'granted';
  } catch (e: any) {
    if (e?.name === 'NotAllowedError' || e?.name === 'SecurityError') return 'denied';
    return 'unknown';
  }
}

export interface MicHelp {
  browser: string;
  steps: string[];
}

/** Browser-specific unblock steps, keyed off the user agent. */
export function micUnblockHelp(): MicHelp {
  const ua = navigator.userAgent;
  if (/OPR\//.test(ua) || /Opera/.test(ua)) {
    return {
      browser: 'Opera',
      steps: [
        'Open the Opera menu (the O), then Settings',
        'Privacy and security, then Site settings, then Microphone',
        'Find this site under Blocked and remove it (or set Allow)',
        'Come back and tap Retry - the popup appears again once removed',
      ],
    };
  }
  if (/SamsungBrowser/.test(ua)) {
    return {
      browser: 'Samsung Internet',
      steps: [
        'Tap the padlock next to the address bar',
        'Tap Permissions',
        'Set Microphone to Allow',
        'Come back here and tap Retry',
      ],
    };
  }
  if (/iPhone|iPad/.test(ua)) {
    return {
      browser: 'Safari',
      steps: [
        'Tap the aA (or puzzle) icon in the address bar',
        'Open Website Settings',
        'Set Microphone to Allow',
        'Reload this page',
      ],
    };
  }
  return {
    browser: 'Chrome',
    steps: [
      'Tap the padlock next to the address bar',
      'Tap Permissions (or Site settings)',
      'Set Microphone to Allow',
      'Come back here and tap Retry',
    ],
  };
}

export function speechRecognitionSupported(): boolean {
  return !!((window as any).SpeechRecognition || (window as any).webkitSpeechRecognition);
}
