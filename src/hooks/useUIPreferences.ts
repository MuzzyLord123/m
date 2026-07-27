import { useState, useEffect, useCallback } from 'react';

export interface FABShortcut {
  id: string;
  label: string;
  path: string;
  icon: string; // lucide icon name
}

export type SidebarPosition = 'left' | 'top' | 'right' | 'bottom';
export type CursorStyle = 'dot' | 'enterprise' | 'default';
export type ThemeBackground = 'none' | 'orbs' | 'grid' | 'dots' | 'gradient' | 'noise' | 'aurora';
export type AccentColor = 'neutral' | 'blue' | 'violet' | 'rose' | 'amber' | 'emerald' | 'cyan' | 'orange';

export type RenderQuality = 'low' | 'medium' | 'high';
export type MaxFPS = '30' | '60' | 'unlimited';

export interface UIPreferences {
  // Sidebar
  sidebarViewMode: 'grouped' | 'flat';
  sidebarPosition: SidebarPosition;
  
  // Dashboard Layout
  dashboardDensity: 'compact' | 'comfortable' | 'spacious';
  dashboardColumns: '2' | '3' | '4';
  
  // Cards
  cardStyle: 'bordered' | 'elevated' | 'flat';
  cardRadius: 'none' | 'sm' | 'md' | 'lg';
  
  // Widgets visibility
  showQuickActions: boolean;
  showRecentActivity: boolean;
  showAnnouncements: boolean;
  showStatsRow: boolean;
  
  // Appearance
  contentWidth: 'narrow' | 'default' | 'wide' | 'full';
  fontSize: 'small' | 'medium' | 'large';
  animationsEnabled: boolean;
  
  // Greeting
  showGreeting: boolean;
  
  // Widget order
  widgetOrder: string[];

  // FAB
  showFAB: boolean;
  fabShortcuts: FABShortcut[];

  // Sidebar folders
  sidebarExpandAll: boolean;

  // Cursor
  cursorStyle: CursorStyle;

  // Theme
  themeBackground: ThemeBackground;
  accentColor: AccentColor;

  // Performance — Rendering
  renderQuality: RenderQuality;
  maxFPS: MaxFPS;
  enableBlur: boolean;
  enableShadows: boolean;
  enableGradients: boolean;
  enable3DEffects: boolean;

  // Performance — Interactions
  enableHoverEffects: boolean;
  enableParallax: boolean;
  enableSoundEffects: boolean;
  enablePageTransitions: boolean;
  reduceTransparency: boolean;

  // Performance — Data
  enableRealtime: boolean;
  lazyLoadImages: boolean;
  prefetchPages: boolean;
  showWidgetAnimations: boolean;
}

const defaultPreferences: UIPreferences = {
  sidebarViewMode: 'grouped',
  sidebarPosition: 'left',
  dashboardDensity: 'comfortable',
  dashboardColumns: '4',
  cardStyle: 'bordered',
  cardRadius: 'md',
  showQuickActions: true,
  showRecentActivity: true,
  showAnnouncements: true,
  showStatsRow: true,
  contentWidth: 'full',
  fontSize: 'medium',
  animationsEnabled: true,
  showGreeting: true,
  widgetOrder: ['greeting', 'stats', 'quickActions', 'recentActivity', 'announcements'],
  showFAB: true,
  fabShortcuts: [],
  sidebarExpandAll: true,
  cursorStyle: 'dot',
  themeBackground: 'orbs',
  accentColor: 'neutral',
  // Performance — Rendering
  renderQuality: 'high',
  maxFPS: 'unlimited',
  enableBlur: true,
  enableShadows: true,
  enableGradients: true,
  enable3DEffects: true,
  // Performance — Interactions
  enableHoverEffects: true,
  enableParallax: true,
  enableSoundEffects: false,
  enablePageTransitions: true,
  reduceTransparency: false,
  // Performance — Data
  enableRealtime: true,
  lazyLoadImages: true,
  prefetchPages: true,
  showWidgetAnimations: true,
};

const STORAGE_KEY = 'lounge-ui-preferences';

function loadPreferences(): UIPreferences {
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
      return { ...defaultPreferences, ...JSON.parse(saved) };
    }
  } catch {}
  // Also migrate old sidebar view mode key
  const oldMode = localStorage.getItem('lounge-sidebar-view-mode');
  if (oldMode === 'flat' || oldMode === 'grouped') {
    return { ...defaultPreferences, sidebarViewMode: oldMode };
  }
  return defaultPreferences;
}

export function useUIPreferences() {
  const [preferences, setPreferences] = useState<UIPreferences>(loadPreferences);

  // Listen for cross-tab sync
  useEffect(() => {
    const handler = (e: StorageEvent) => {
      if (e.key === STORAGE_KEY && e.newValue) {
        try {
          setPreferences({ ...defaultPreferences, ...JSON.parse(e.newValue) });
        } catch {}
      }
    };
    window.addEventListener('storage', handler);
    return () => window.removeEventListener('storage', handler);
  }, []);

  const updatePreference = useCallback(<K extends keyof UIPreferences>(key: K, value: UIPreferences[K]) => {
    setPreferences(prev => {
      const next = { ...prev, [key]: value };
      localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
      // Keep legacy key in sync for sidebar
      if (key === 'sidebarViewMode') {
        localStorage.setItem('lounge-sidebar-view-mode', value as string);
        window.dispatchEvent(new StorageEvent('storage', { key: 'lounge-sidebar-view-mode', newValue: value as string }));
      }
      // Broadcast to other tabs
      window.dispatchEvent(new StorageEvent('storage', { key: STORAGE_KEY, newValue: JSON.stringify(next) }));
      return next;
    });
  }, []);

  const resetPreferences = useCallback(() => {
    setPreferences(defaultPreferences);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(defaultPreferences));
    localStorage.setItem('lounge-sidebar-view-mode', defaultPreferences.sidebarViewMode);
    window.dispatchEvent(new StorageEvent('storage', { key: STORAGE_KEY, newValue: JSON.stringify(defaultPreferences) }));
    window.dispatchEvent(new StorageEvent('storage', { key: 'lounge-sidebar-view-mode', newValue: defaultPreferences.sidebarViewMode }));
  }, []);

  return { preferences, updatePreference, resetPreferences };
}
