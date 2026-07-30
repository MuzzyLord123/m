import { useState, useEffect, useCallback, Suspense } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useNavigate, useLocation, Outlet } from 'react-router-dom';
import { Bell, Menu } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { ThemeToggle } from '@/components/ThemeToggle';
import { TooltipProvider } from '@/components/ui/tooltip';
import quooroLogo from '@/assets/quooro-logo.png';
import { useBranding } from '@/contexts/BrandingContext';
import { cn } from '@/lib/utils';
import { Badge } from '@/components/ui/badge';
import { useUnreadMessages } from '@/hooks/useUnreadMessages';
import { useTwoFactor } from '@/hooks/useTwoFactor';
import { useSessionTimeout } from '@/hooks/useSessionTimeout';
import { useAuthSync, quickSignOut } from '@/hooks/useAuthSync';
import { useSaveCurrentAccount } from '@/hooks/useSaveCurrentAccount';
import { supabase } from '@/integrations/supabase/client';
import TwoFactorWarning from '@/components/security/TwoFactorWarning';
import { EmailVerificationBanner } from '@/components/EmailVerificationBanner';
import { PortalSidebar } from './PortalSidebar';
import { MobileBottomNav } from './MobileBottomNav';
import { MobileMenu } from './MobileMenu';
import { GlobalSearch } from './GlobalSearch';
import { FloatingDock } from './FloatingDock';
import { useUIPreferences } from '@/hooks/useUIPreferences';
import { LoungeBackground } from './LoungeBackground';
import { useClientPresence } from '@/hooks/useClientPresence';
import { useTeamCalls } from '@/hooks/useTeamCalls';
import { IncomingCallOverlay } from '@/components/comms/IncomingCallOverlay';
import { AnimatePresence } from 'framer-motion';
import GreetingBanner from './GreetingBanner';
import { MainSplash } from '@/components/splash/MainSplash';
import {
  TemperamentProvider,
  CommandPalette,
  ShortcutOverlay,
  usePlatformKeys,
  SkeletonLedger,
} from '@/components/platform';

function MobileHeaderLogoComponent() {
  const branding = useBranding();
  return (
    <div className="lg:hidden">
      <img 
        src={branding.logoUrl} 
        alt="Logo" 
        className="h-8 w-auto dark:brightness-0 dark:invert"
      />
    </div>
  );
}


export default function LoungeLayout() {
  const { user, signOut } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  
  const { preferences } = useUIPreferences();
  const [sidebarCollapsed, setSidebarCollapsed] = useState(() => {
    const saved = localStorage.getItem('lounge-sidebar-collapsed');
    return saved === 'true';
  });
  const { unreadCount } = useUnreadMessages();
  const { status: twoFactorStatus, loading: twoFactorLoading } = useTwoFactor();
  const [bannerDismissed, setBannerDismissed] = useState(() => {
    const dismissedUntil = localStorage.getItem('2fa-banner-dismissed-until');
    return dismissedUntil ? Date.now() < Number(dismissedUntil) : false;
  });
  const [mobileDrawerOpen, setMobileDrawerOpen] = useState(false);
  const [paletteOpen, setPaletteOpen] = useState(false);
  const [shortcutsOpen, setShortcutsOpen] = useState(false);
  usePlatformKeys({
    onPalette: () => setPaletteOpen(true),
    onShortcuts: () => setShortcutsOpen(true),
  });
  const [showSplash, setShowSplash] = useState(() => {
    return !(location.state as any)?.skipSplash;
  });
  const handleSplashComplete = useCallback(() => setShowSplash(false), []);
  
  useSessionTimeout(true);
  
  const show2FAWarning = !twoFactorLoading && !twoFactorStatus?.enabled;

  useEffect(() => {
    localStorage.setItem('lounge-sidebar-collapsed', String(sidebarCollapsed));
  }, [sidebarCollapsed]);

  // Apply performance preferences as <body> classes so they affect every
  // rendered element (cards, modals, portaled overlays, etc.).
  useEffect(() => {
    const body = document.body;
    const map: Array<[string, boolean]> = [
      ['perf-no-blur', !preferences.enableBlur],
      ['perf-no-shadows', !preferences.enableShadows],
      ['perf-no-gradients', !preferences.enableGradients],
      ['perf-no-3d', !preferences.enable3DEffects],
      ['perf-no-hover', !preferences.enableHoverEffects],
      ['perf-no-transitions', !preferences.enablePageTransitions],
      ['perf-no-transparency', preferences.reduceTransparency],
      ['perf-no-bg', preferences.themeBackground === 'none'],
      ['lounge-no-animations', !preferences.animationsEnabled],
    ];
    map.forEach(([cls, on]) => body.classList.toggle(cls, on));
    return () => map.forEach(([cls]) => body.classList.remove(cls));
  }, [
    preferences.enableBlur,
    preferences.enableShadows,
    preferences.enableGradients,
    preferences.enable3DEffects,
    preferences.enableHoverEffects,
    preferences.enablePageTransitions,
    preferences.reduceTransparency,
    preferences.themeBackground,
    preferences.animationsEnabled,
  ]);


  // Close drawer on route change
  useEffect(() => {
    setMobileDrawerOpen(false);
  }, [location.pathname]);

  const [profile, setProfile] = useState<{ full_name: string | null; company: string | null; avatar_url: string | null } | null>(null);

  useEffect(() => {
    const fetchProfile = async () => {
      if (!user) return;
      const { data } = await supabase
        .from('profiles')
        .select('full_name, company, avatar_url')
        .eq('user_id', user.id)
        .maybeSingle();
      if (data) setProfile(data);
    };
    fetchProfile();
  }, [user]);

  useEffect(() => {
    if (!user) return;
    const channel = supabase
      .channel('profile-changes')
      .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'profiles', filter: `user_id=eq.${user.id}` },
        (payload) => {
          setProfile(prev => ({
            ...prev,
            ...payload.new as { full_name: string | null; company: string | null; avatar_url: string | null }
          }));
        }
      )
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [user]);

  useAuthSync();
  useSaveCurrentAccount();

  // Global incoming call listener
  const { incomingCall, acceptCall, declineCall } = useTeamCalls();

  useClientPresence(profile);

  const handleSignOut = async () => {
    setShowSplash(false); // prevent splash from showing during sign-out
    await quickSignOut('customer');
    navigate('/sign-in', { replace: true });
  };

  // On mobile/tablet, force top/bottom since left/right don't fit
  const [isSmallScreen, setIsSmallScreen] = useState(() => typeof window !== 'undefined' && window.innerWidth < 1024);
  useEffect(() => {
    const mql = window.matchMedia('(max-width: 1023px)');
    const onChange = () => setIsSmallScreen(mql.matches);
    mql.addEventListener('change', onChange);
    return () => mql.removeEventListener('change', onChange);
  }, []);
  const rawPos = preferences.sidebarPosition;
  // On mobile/tablet, hide the sidebar entirely; navigation is via the burger menu / drawer
  const sidebarPos = isSmallScreen ? 'hidden' : rawPos;
  const isHorizontalSidebar = sidebarPos === 'top' || sidebarPos === 'bottom';
  // For top/bottom, always show collapsed (icon-only horizontal bar)
  const effectiveCollapsed = isHorizontalSidebar ? true : sidebarCollapsed;

  const sidebarWidth = effectiveCollapsed ? 'w-[72px]' : 'w-[272px]';

  const horizontalBarHeight = 'h-[52px]';

  // Apply accent colour CSS variables
  useEffect(() => {
    const accentMap: Record<string, string> = {
      neutral: '0 0% 45%',
      blue: '217 91% 60%',
      violet: '263 70% 58%',
      rose: '346 77% 60%',
      amber: '38 92% 50%',
      emerald: '160 84% 39%',
      cyan: '189 94% 43%',
      orange: '25 95% 53%',
    };
    const hsl = accentMap[preferences.accentColor] || accentMap.neutral;
    if (preferences.accentColor && preferences.accentColor !== 'neutral') {
      document.documentElement.style.setProperty('--primary', hsl);
      document.documentElement.style.setProperty('--primary-foreground', '0 0% 100%');
    } else {
      document.documentElement.style.removeProperty('--primary');
      document.documentElement.style.removeProperty('--primary-foreground');
    }
    return () => {
      document.documentElement.style.removeProperty('--primary');
      document.documentElement.style.removeProperty('--primary-foreground');
    };
  }, [preferences.accentColor]);

  if (showSplash) {
    return (
      <TooltipProvider>
        <MainSplash onComplete={handleSplashComplete} />
      </TooltipProvider>
    );
  }


  return (
    <TooltipProvider>
      <TemperamentProvider value="portal">
      <div className={cn(
        "min-h-screen bg-background workshop-ui",
        `lounge-font-${preferences.fontSize}`,
        isHorizontalSidebar ? 'flex flex-col' : 'flex'
      )}>
        <LoungeBackground />
        {/* Spacer for fixed top bar */}
        {sidebarPos === 'top' && (
          <div className={cn("shrink-0", horizontalBarHeight)} />
        )}
        {/* Desktop Sidebar - positioned based on preference */}
        {/* LEFT sidebar (default) */}
        {sidebarPos === 'left' && (
          <>
            <div className={cn("hidden lg:block transition-all duration-300 flex-shrink-0", sidebarWidth)} />
            <PortalSidebar
              collapsed={effectiveCollapsed}
              onCollapsedChange={setSidebarCollapsed}
              profile={profile}
              user={user}
              unreadCount={unreadCount}
              show2FAWarning={show2FAWarning}
              onSignOut={handleSignOut}
              position="left"
            />
          </>
        )}

        {/* RIGHT sidebar */}
        {sidebarPos === 'right' && (
          <div className={cn("hidden lg:block transition-all duration-300 flex-shrink-0 order-last", sidebarWidth)} />
        )}

        {/* TOP horizontal nav */}
        {sidebarPos === 'top' && (
          <PortalSidebar
            collapsed={true}
            onCollapsedChange={setSidebarCollapsed}
            profile={profile}
            user={user}
            unreadCount={unreadCount}
            show2FAWarning={show2FAWarning}
            onSignOut={handleSignOut}
            position="top"
          />
        )}

        {/* Main Content */}
        <div className={cn("flex-1 flex flex-col min-w-0", sidebarPos === 'right' && 'order-first')}>
          {show2FAWarning && !bannerDismissed && (
            <TwoFactorWarning 
              role="user" 
              variant="banner"
              showDismiss
              onDismiss={() => {
                const twentyFourHours = 24 * 60 * 60 * 1000;
                localStorage.setItem('2fa-banner-dismissed-until', String(Date.now() + twentyFourHours));
                setBannerDismissed(true);
              }}
            />
          )}

          <EmailVerificationBanner />

          {/* Top Header Bar */}
          <header className="sticky top-0 z-40 border-b border-border/60 bg-background/90 backdrop-blur-md">
            <div className="flex h-14 items-center justify-between px-4 lg:px-6">
              <div className="flex items-center gap-3">
                <MobileHeaderLogoComponent />
              </div>

              <div className="flex items-center gap-2 sm:gap-3">
                <GlobalSearch className="hidden sm:flex" />
                <GlobalSearch className="sm:hidden" />
                
                <Button 
                  variant="ghost" 
                  size="icon" 
                  className="relative h-9 w-9"
                  onClick={() => navigate('/lounge/messages')}
                  aria-label="Notifications"
                >
                  <Bell className="h-5 w-5" />
                  {unreadCount > 0 && (
                    <Badge className="absolute -top-1 -right-1 h-5 min-w-5 flex items-center justify-center text-[10px] px-1">
                      {unreadCount > 9 ? '9+' : unreadCount}
                    </Badge>
                  )}
                </Button>
                
                <div className="hidden lg:block">
                  <ThemeToggle />
                </div>

                {/* Mobile/tablet burger menu */}
                <Button
                  variant="ghost"
                  size="icon"
                  className="lg:hidden h-9 w-9"
                  onClick={() => setMobileDrawerOpen(true)}
                  aria-label="Open menu"
                >
                  <Menu className="h-5 w-5" />
                </Button>
              </div>
            </div>
          </header>
          {/* Page Content */}
          <main 
            className={cn(
              "flex-1 overflow-x-hidden overflow-y-auto",
              "pb-24 md:pb-0",
              `lounge-density-${preferences.dashboardDensity}`,
              `lounge-cards-${preferences.cardStyle}`,
              `lounge-radius-${preferences.cardRadius}`,
              `lounge-font-${preferences.fontSize}`,
              `lounge-width-${preferences.contentWidth}`,
              !preferences.animationsEnabled && 'lounge-no-animations'
            )}
          >
            <Suspense fallback={
              <div className="flex-1 p-5 lg:p-8" aria-hidden>
                <span className="block h-7 w-52 animate-pulse rounded bg-foreground/[0.06]" />
                <span className="mt-2 block h-4 w-72 animate-pulse rounded bg-foreground/[0.05]" />
                <div className="mt-7 rounded-[10px] border border-border/60">
                  <SkeletonLedger rows={5} />
                </div>
              </div>
            }>
              <Outlet />
            </Suspense>
            <GreetingBanner />
          </main>

          {/* Bottom bar on phones/tablets: primary destinations + the full
              menu via More. (Previously only rendered on desktop, where its
              own lg:hidden made it invisible — effectively dead.) */}
          {!isHorizontalSidebar && isSmallScreen && (
            <MobileBottomNav
              unreadCount={unreadCount}
              show2FAWarning={show2FAWarning}
              onSignOut={handleSignOut}
              onMenuOpen={() => setMobileDrawerOpen(true)}
            />
          )}
        </div>

        {/* RIGHT sidebar (actual component) */}
        {sidebarPos === 'right' && (
          <PortalSidebar
            collapsed={effectiveCollapsed}
            onCollapsedChange={setSidebarCollapsed}
            profile={profile}
            user={user}
            unreadCount={unreadCount}
            show2FAWarning={show2FAWarning}
            onSignOut={handleSignOut}
            position="right"
          />
        )}

        {/* BOTTOM horizontal nav */}
        {sidebarPos === 'bottom' && (
          <>
            {/* Spacer for fixed bottom bar */}
            <div className={cn("shrink-0", horizontalBarHeight)} />
            <PortalSidebar
              collapsed={true}
              onCollapsedChange={setSidebarCollapsed}
              profile={profile}
              user={user}
              unreadCount={unreadCount}
              show2FAWarning={show2FAWarning}
              onSignOut={handleSignOut}
              position="bottom"
            />
          </>
        )}

        {/* Mobile menu: the custom Lounge drawer (registry-driven sections,
            identity header, swipe to dismiss) - no longer the desktop
            sidebar squeezed into a sheet */}
        <MobileMenu
          open={mobileDrawerOpen}
          onClose={() => setMobileDrawerOpen(false)}
          profile={profile}
          user={user}
          unreadCount={unreadCount}
          show2FAWarning={show2FAWarning}
          onSignOut={handleSignOut}
        />
      </div>

      <FloatingDock />

      {/* ⌘K jump-anywhere + ? shortcut overlay (client-side only) */}
      <CommandPalette open={paletteOpen} onOpenChange={setPaletteOpen} role="user" />
      <ShortcutOverlay open={shortcutsOpen} onOpenChange={setShortcutsOpen} />

      {/* Global incoming call overlay */}
      <AnimatePresence>
        {incomingCall && (
          <IncomingCallOverlay
            call={incomingCall}
            onAccept={() => acceptCall(incomingCall.id)}
            onDecline={() => declineCall(incomingCall.id)}
          />
        )}
      </AnimatePresence>
      </TemperamentProvider>
    </TooltipProvider>
  );
}
