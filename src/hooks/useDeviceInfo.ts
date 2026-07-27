import { useEffect, useState } from 'react';

export interface DeviceInfo {
  // Identity
  deviceType: 'phone' | 'tablet' | 'laptop' | 'desktop' | 'unknown';
  make: string;            // e.g. "Samsung", "Apple", "Acer", "Unknown"
  model: string;           // e.g. "Galaxy S21", "iPhone", "Aspire Z3-615", best-effort
  os: string;              // "Windows 10", "macOS", "iOS 17", "Android 14"
  browser: string;         // "Chrome 121", "Safari", "Firefox"
  // Hardware
  cpuCores: number | null;
  cpuClass: string;        // best-effort: "x86", "ARM", "Apple Silicon"
  gpuVendor: string;       // best-effort from WebGL
  gpuRenderer: string;     // best-effort from WebGL
  memoryGB: number | null; // navigator.deviceMemory (Chromium only)
  // Display / monitor
  screenW: number;
  screenH: number;
  dpr: number;
  touch: boolean;
  colorDepth: number;          // bits per pixel
  colorGamut: string;          // 'srgb' | 'p3' | 'rec2020' | 'unknown'
  hdr: boolean;                // dynamic-range: high
  refreshHz: number | null;    // measured via rAF
  monitorCount: number | null; // window.screen.isExtended
  orientation: string;         // 'landscape' | 'portrait'
  monitorLabel: string;        // e.g. "1920 × 1080 @ 60Hz · sRGB"
  monitorName: string | null;  // EDID label via Window Management API (requires permission)


  // Network / power
  networkType: string;     // '4g', 'wifi', 'unknown'
  downlinkMbps: number | null;
  battery: { level: number; charging: boolean } | null;
  prefersReducedMotion: boolean;
  // Score
  score: number;           // 0-100, higher = faster
  tier: 'low' | 'medium' | 'high' | 'elite';
}

const LOW_END_GPU_PATTERNS = [
  /intel.+(hd graphics (2|3|4)\d{3})/i,            // Intel HD 2000-4999 (incl. Acer Z3-615's HD 4400)
  /intel.+(gma|graphics media)/i,
  /atom/i,
  /mali-(3|4|5)\d{2}/i,                            // older Mali
  /adreno (3|4)\d{2}/i,                            // Adreno 3xx/4xx
  /powervr sgx/i,
  /vivante/i,
];

const HIGH_END_GPU_PATTERNS = [
  /rtx ?\d{3,4}/i, /gtx ?(1[6-9]|2|3|4)\d{2}/i,
  /radeon.+(rx ?[56-9]\d{3}|rx ?\d{4})/i,
  /apple m\d/i,
  /adreno (7|8)\d{2}/i, /mali-g(7|8|9)\d/i,
];

function detectBrowser(ua: string): string {
  if (/Edg\//.test(ua)) return 'Edge ' + (ua.match(/Edg\/(\d+)/)?.[1] || '');
  if (/Chrome\//.test(ua) && !/Chromium/.test(ua)) return 'Chrome ' + (ua.match(/Chrome\/(\d+)/)?.[1] || '');
  if (/Firefox\//.test(ua)) return 'Firefox ' + (ua.match(/Firefox\/(\d+)/)?.[1] || '');
  if (/Safari\//.test(ua)) return 'Safari ' + (ua.match(/Version\/(\d+)/)?.[1] || '');
  return 'Unknown browser';
}

function detectOS(ua: string): string {
  if (/Windows NT 10/.test(ua)) return 'Windows 10/11';
  if (/Windows NT 6\.3/.test(ua)) return 'Windows 8.1';
  if (/Windows NT 6\.2/.test(ua)) return 'Windows 8';
  if (/Windows NT 6\.1/.test(ua)) return 'Windows 7';
  if (/Mac OS X ([\d_]+)/.test(ua)) return 'macOS ' + (ua.match(/Mac OS X ([\d_]+)/)?.[1].replace(/_/g, '.') || '');
  if (/iPhone OS ([\d_]+)/.test(ua) || /iPad.+OS ([\d_]+)/.test(ua)) return 'iOS ' + (ua.match(/OS ([\d_]+)/)?.[1].replace(/_/g, '.') || '');
  if (/Android ([\d.]+)/.test(ua)) return 'Android ' + (ua.match(/Android ([\d.]+)/)?.[1] || '');
  if (/Linux/.test(ua)) return 'Linux';
  return 'Unknown OS';
}

function detectDeviceType(ua: string, touch: boolean, screenW: number): DeviceInfo['deviceType'] {
  if (/iPhone|Android.+Mobile|Mobile.+Firefox/.test(ua)) return 'phone';
  if (/iPad|Tablet|Android(?!.+Mobile)/.test(ua)) return 'tablet';
  if (touch && screenW < 1024) return 'phone';
  if (/Macintosh|Windows|Linux/.test(ua)) return screenW < 1500 ? 'laptop' : 'desktop';
  return 'unknown';
}

function detectMakeModel(ua: string, uaData?: any): { make: string; model: string } {
  // UA-CH high-entropy hints (Chromium only, requires getHighEntropyValues)
  if (uaData?.model) {
    const model: string = uaData.model;
    let make = 'Unknown';
    if (/iPhone|iPad/.test(model)) make = 'Apple';
    else if (/SM-|Galaxy/.test(model)) make = 'Samsung';
    else if (/Pixel/.test(model)) make = 'Google';
    else if (/Mi |Redmi|POCO/.test(model)) make = 'Xiaomi';
    else if (/OnePlus/.test(model)) make = 'OnePlus';
    return { make, model };
  }
  // Fallbacks from UA string
  if (/iPhone/.test(ua)) return { make: 'Apple', model: 'iPhone' };
  if (/iPad/.test(ua)) return { make: 'Apple', model: 'iPad' };
  if (/Macintosh/.test(ua)) return { make: 'Apple', model: 'Mac' };
  const samsung = ua.match(/SM-[A-Z0-9]+/);
  if (samsung) return { make: 'Samsung', model: samsung[0] };
  const pixel = ua.match(/Pixel \d[a-z]?/);
  if (pixel) return { make: 'Google', model: pixel[0] };
  if (/Windows/.test(ua)) return { make: 'PC', model: 'Windows Device' };
  if (/Android/.test(ua)) return { make: 'Android', model: 'Android Device' };
  if (/Linux/.test(ua)) return { make: 'Linux', model: 'Linux PC' };
  return { make: 'Unknown', model: 'Unknown' };
}

function detectGPU(): { vendor: string; renderer: string } {
  try {
    const canvas = document.createElement('canvas');
    const gl = (canvas.getContext('webgl') || canvas.getContext('experimental-webgl')) as WebGLRenderingContext | null;
    if (!gl) return { vendor: 'Unknown', renderer: 'Unknown' };
    const dbg = gl.getExtension('WEBGL_debug_renderer_info');
    if (!dbg) return { vendor: gl.getParameter(gl.VENDOR) || 'Unknown', renderer: gl.getParameter(gl.RENDERER) || 'Unknown' };
    return {
      vendor: gl.getParameter(dbg.UNMASKED_VENDOR_WEBGL) || 'Unknown',
      renderer: gl.getParameter(dbg.UNMASKED_RENDERER_WEBGL) || 'Unknown',
    };
  } catch {
    return { vendor: 'Unknown', renderer: 'Unknown' };
  }
}

function computeScore(d: Omit<DeviceInfo, 'score' | 'tier'>): number {
  let score = 50;
  // Cores
  if (d.cpuCores) {
    if (d.cpuCores >= 12) score += 20;
    else if (d.cpuCores >= 8) score += 14;
    else if (d.cpuCores >= 6) score += 8;
    else if (d.cpuCores >= 4) score += 0;
    else score -= 15;
  }
  // Memory
  if (d.memoryGB != null) {
    if (d.memoryGB >= 16) score += 15;
    else if (d.memoryGB >= 8) score += 8;
    else if (d.memoryGB >= 4) score += 0;
    else score -= 20;
  }
  // GPU
  if (HIGH_END_GPU_PATTERNS.some(r => r.test(d.gpuRenderer))) score += 20;
  if (LOW_END_GPU_PATTERNS.some(r => r.test(d.gpuRenderer))) score -= 25;
  // Network
  if (d.networkType === '2g' || d.networkType === 'slow-2g') score -= 15;
  if (d.networkType === '3g') score -= 5;
  // Battery low + not charging
  if (d.battery && d.battery.level < 0.2 && !d.battery.charging) score -= 10;
  // Phone screen scales down
  if (d.deviceType === 'phone') score -= 5;
  if (d.prefersReducedMotion) score -= 5;
  return Math.max(0, Math.min(100, score));
}

function tierFromScore(score: number): DeviceInfo['tier'] {
  if (score >= 80) return 'elite';
  if (score >= 60) return 'high';
  if (score >= 40) return 'medium';
  return 'low';
}

export function useDeviceInfo() {
  const [info, setInfo] = useState<DeviceInfo | null>(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      const ua = navigator.userAgent;
      const uaData: any = (navigator as any).userAgentData;
      let highEntropy: any = null;
      try {
        if (uaData?.getHighEntropyValues) {
          highEntropy = await uaData.getHighEntropyValues(['model', 'platform', 'platformVersion', 'architecture', 'bitness']);
        }
      } catch {}

      const { make, model } = detectMakeModel(ua, highEntropy);
      const screenW = window.screen.width;
      const screenH = window.screen.height;
      const dpr = window.devicePixelRatio || 1;
      const touch = navigator.maxTouchPoints > 0 || 'ontouchstart' in window;
      const deviceType = detectDeviceType(ua, touch, screenW);
      const { vendor: gpuVendor, renderer: gpuRenderer } = detectGPU();
      const conn = (navigator as any).connection;
      const networkType = conn?.effectiveType || 'unknown';
      const downlinkMbps = conn?.downlink ?? null;

      let battery: DeviceInfo['battery'] = null;
      try {
        if ((navigator as any).getBattery) {
          const b = await (navigator as any).getBattery();
          battery = { level: b.level, charging: b.charging };
        }
      } catch {}

      // Monitor / display capabilities
      const colorDepth = window.screen.colorDepth || 24;
      const colorGamut = window.matchMedia('(color-gamut: rec2020)').matches ? 'rec2020'
        : window.matchMedia('(color-gamut: p3)').matches ? 'p3'
        : window.matchMedia('(color-gamut: srgb)').matches ? 'srgb' : 'unknown';
      const hdr = window.matchMedia('(dynamic-range: high)').matches;
      const orientation = screenW >= screenH ? 'landscape' : 'portrait';
      let monitorCount: number | null = null;
      try {
        if ('isExtended' in window.screen) monitorCount = (window.screen as any).isExtended ? 2 : 1;
      } catch {}

      // Measure refresh rate over ~60 frames and snap to common rates
      const measuredHz: number | null = await new Promise((resolve) => {
        const samples: number[] = [];
        let last = 0;
        const tick = (t: number) => {
          if (last) samples.push(t - last);
          last = t;
          if (samples.length >= 60) {
            samples.sort((a, b) => a - b);
            const median = samples[Math.floor(samples.length / 2)];
            const hz = Math.round(1000 / median);
            const common = [30, 60, 75, 90, 100, 120, 144, 165, 180, 200, 240, 360];
            const snapped = common.find((c) => Math.abs(c - hz) <= 5) ?? hz;
            resolve(snapped > 20 && snapped < 500 ? snapped : null);
          } else requestAnimationFrame(tick);
        };
        requestAnimationFrame(tick);
        setTimeout(() => {
          if (samples.length < 10) resolve(null);
        }, 2000);
      });
      const refreshHz = measuredHz;

      // Monitor name via Window Management API (Chromium, requires permission)
      let monitorName: string | null = null;
      try {
        const w: any = window;
        if (w.getScreenDetails) {
          const perm = await (navigator as any).permissions?.query?.({ name: 'window-management' as any }).catch(() => null);
          if (perm?.state === 'granted') {
            const details = await w.getScreenDetails();
            const current = details.currentScreen || details.screens?.[0];
            if (current?.label) monitorName = current.label;
          }
        }
      } catch {}

      const monitorLabel = `${screenW} × ${screenH}${refreshHz ? ` @ ${refreshHz}Hz` : ''} · ${colorGamut.toUpperCase()}${hdr ? ' · HDR' : ''}`;


      const base: Omit<DeviceInfo, 'score' | 'tier'> = {
        deviceType,
        make,
        model: highEntropy?.model || model,
        os: detectOS(ua),
        browser: detectBrowser(ua),
        cpuCores: navigator.hardwareConcurrency ?? null,
        cpuClass: highEntropy?.architecture
          ? `${highEntropy.architecture}${highEntropy.bitness ? ` (${highEntropy.bitness}-bit)` : ''}`
          : /Apple/.test(gpuRenderer) ? 'Apple Silicon' : /ARM|aarch/i.test(ua) ? 'ARM' : 'x86',
        gpuVendor,
        gpuRenderer,
        memoryGB: (navigator as any).deviceMemory ?? null,
        screenW,
        screenH,
        dpr,
        touch,
        colorDepth,
        colorGamut,
        hdr,
        refreshHz,
        monitorCount,
        orientation,
        monitorLabel,
        monitorName,

        networkType,
        downlinkMbps,
        battery,
        prefersReducedMotion: window.matchMedia('(prefers-reduced-motion: reduce)').matches,
      };


      const score = computeScore(base);
      if (!cancelled) setInfo({ ...base, score, tier: tierFromScore(score) });
    })();
    return () => { cancelled = true; };
  }, []);

  return info;
}
