import type { UIPreferences } from '@/hooks/useUIPreferences';
import type { DeviceInfo } from '@/hooks/useDeviceInfo';

export type PerfPreset = 'low' | 'medium' | 'high' | 'elite';

/** Maps a preset to concrete UI preference overrides. */
export const PRESET_OVERRIDES: Record<PerfPreset, Partial<UIPreferences>> = {
  low: {
    renderQuality: 'low',
    maxFPS: '30',
    enableBlur: false,
    enableShadows: false,
    enableGradients: false,
    enable3DEffects: false,
    enableHoverEffects: false,
    enableParallax: false,
    enablePageTransitions: false,
    reduceTransparency: true,
    enableRealtime: false,
    lazyLoadImages: true,
    prefetchPages: false,
    showWidgetAnimations: false,
    animationsEnabled: false,
    themeBackground: 'none',
    cursorStyle: 'default',
    showFAB: false,
  },
  medium: {
    renderQuality: 'medium',
    maxFPS: '60',
    enableBlur: false,
    enableShadows: true,
    enableGradients: true,
    enable3DEffects: false,
    enableHoverEffects: true,
    enableParallax: false,
    enablePageTransitions: true,
    reduceTransparency: false,
    enableRealtime: true,
    lazyLoadImages: true,
    prefetchPages: true,
    showWidgetAnimations: true,
    animationsEnabled: true,
    themeBackground: 'gradient',
  },
  high: {
    renderQuality: 'high',
    maxFPS: '60',
    enableBlur: true,
    enableShadows: true,
    enableGradients: true,
    enable3DEffects: true,
    enableHoverEffects: true,
    enableParallax: true,
    enablePageTransitions: true,
    reduceTransparency: false,
    enableRealtime: true,
    lazyLoadImages: true,
    prefetchPages: true,
    showWidgetAnimations: true,
    animationsEnabled: true,
    themeBackground: 'orbs',
  },
  elite: {
    renderQuality: 'high',
    maxFPS: 'unlimited',
    enableBlur: true,
    enableShadows: true,
    enableGradients: true,
    enable3DEffects: true,
    enableHoverEffects: true,
    enableParallax: true,
    enablePageTransitions: true,
    reduceTransparency: false,
    enableRealtime: true,
    lazyLoadImages: true,
    prefetchPages: true,
    showWidgetAnimations: true,
    animationsEnabled: true,
    themeBackground: 'aurora',
  },
};

export function presetForDevice(d: DeviceInfo): PerfPreset {
  return d.tier;
}

export const PRESET_LABEL: Record<PerfPreset, string> = {
  low: 'Battery Saver',
  medium: 'Balanced',
  high: 'Performance',
  elite: 'Maximum',
};

export const PRESET_DESC: Record<PerfPreset, string> = {
  low: 'Strips effects for the fastest experience on older devices',
  medium: 'Sensible defaults — works well on most laptops & phones',
  high: 'Full effects, smooth animations, all backgrounds enabled',
  elite: 'Everything on, no FPS cap — for high-end desktops only',
};
