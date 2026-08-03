import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useNavigate, useLocation } from 'react-router-dom';
import { Menu, LogOut } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { ThemeToggle } from '@/components/ThemeToggle';
import quooroLogo from '@/assets/quooro-logo.png';
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet';
import { cn } from '@/lib/utils';
import { useTwoFactor } from '@/hooks/useTwoFactor';
import { useSessionTimeout } from '@/hooks/useSessionTimeout';
import { useAuthSync, quickSignOut } from '@/hooks/useAuthSync';
import { useSaveCurrentAccount } from '@/hooks/useSaveCurrentAccount';
import { supabase } from '@/integrations/supabase/client';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { TooltipProvider } from '@/components/ui/tooltip';
import TwoFactorWarning from '@/components/security/TwoFactorWarning';
import TeamSidebar from './TeamSidebar';
import {
  TemperamentProvider,
  CommandPalette,
  ShortcutOverlay,
  usePlatformKeys,
} from '@/components/platform';
import { ActiveWebsiteSplash } from '@/components/splash/ActiveWebsiteSplash';

// Mobile nav items for sheet menu
import {
  Mail, Users, Megaphone, Share2, FileText, Calendar, Globe,
  CreditCard, MessageSquare, Shield, Target, HardDrive, Settings,
  Workflow, BarChart3, Monitor, BookOpen, ClipboardList, FileSpreadsheet,
  Paintbrush, PenTool, Sparkles, ShoppingBag } from
'lucide-react';

const mobileNavItems = [
{ label: 'Command Center', icon: BarChart3, tab: 'command-center' },
{ label: 'Enquiries', icon: Mail, tab: 'enquiries' },
{ label: 'Business Relationships', icon: Target, tab: 'leads', path: '/lounge/crm' },
{ label: 'Clients', icon: Users, tab: 'clients' },
{ label: 'Client Accounts', icon: Users, tab: 'client-accounts' },
{ label: 'Account Creation', icon: Shield, tab: 'account-creation' },
{ label: 'Greeting Messages', icon: MessageSquare, tab: 'greeting-messages' },
{ label: 'App Projects', icon: Globe, tab: 'apps' },
{ label: 'Ad Campaigns', icon: Megaphone, tab: 'ads' },
{ label: 'Social Media', icon: Share2, tab: 'social' },
{ label: 'Content', icon: FileText, tab: 'content' },
{ label: 'Calendar', icon: Calendar, tab: 'calendar' },
{ label: 'Websites', icon: Globe, tab: 'websites' },
{ label: 'Marketing Site', icon: Sparkles, tab: 'marketing-site' },
{ label: 'Website Designer', icon: Paintbrush, tab: 'website-designer' },
{ label: 'Quooro Office', icon: FileSpreadsheet, tab: 'office' },
{ label: 'E-commerce', icon: ShoppingBag, tab: 'ecommerce' },
{ label: 'Subscription Websites', icon: Globe, tab: 'subscription-sites' },
{ label: 'Hosted Websites', icon: Globe, tab: 'hosted-sites' },
{ label: 'Invoices', icon: FileText, tab: 'invoices' },
{ label: 'Billing', icon: CreditCard, tab: 'billing' },
{ label: 'Messages', icon: MessageSquare, tab: 'messages' },
{ label: 'Assets', icon: HardDrive, tab: 'assets' },
{ label: 'Tickets', icon: MessageSquare, tab: 'tickets' },
{ label: 'Security', icon: Shield, tab: 'security' },
{ label: 'Site Analytics', icon: BarChart3, tab: 'site-analytics' },
{ label: 'Announcements', icon: Megaphone, tab: 'announcements' },
{ label: 'Workflows', icon: Workflow, tab: 'workflows' },
{ label: 'Resources', icon: BarChart3, tab: 'resources' },
{ label: 'Live Sessions', icon: Monitor, tab: 'live-sessions' },
{ label: 'Settings', icon: Settings, tab: 'settings' },
{ label: 'Knowledge Base', icon: BookOpen, tab: 'knowledge-base' },
{ label: 'Automation Rules', icon: Workflow, tab: 'automation-rules' },
{ label: 'Planner', icon: ClipboardList, tab: 'planner' },
{ label: 'Team Comms', icon: MessageSquare, tab: 'team-comms' },
{ label: 'Roles & Permissions', icon: Shield, tab: 'roles-permissions' }];


interface TeamLayoutProps {
  activeTab: string;
  onTabChange: (tab: string) => void;
  children: React.ReactNode;
}

export default function TeamLayout({ activeTab, onTabChange, children }: TeamLayoutProps) {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  // The desk opening: shown once per session, not on every navigation.
  const [splashDone, setSplashDone] = useState(() => {
    try { return sessionStorage.getItem('quooro-team-splash') === 'seen'; } catch { return true; }
  });
  const [sidebarCollapsed, setSidebarCollapsed] = useState(() => {
    const saved = localStorage.getItem('team-sidebar-collapsed');
    return saved === 'true';
  });
  const { status: twoFactorStatus, loading: twoFactorLoading } = useTwoFactor();
  const [bannerDismissed, setBannerDismissed] = useState(false);
  const [paletteOpen, setPaletteOpen] = useState(false);
  const [shortcutsOpen, setShortcutsOpen] = useState(false);
  usePlatformKeys({
    onPalette: () => setPaletteOpen(true),
    onShortcuts: () => setShortcutsOpen(true),
  });

  useSessionTimeout(true);
  const show2FAWarning = !twoFactorLoading && !twoFactorStatus?.enabled;

  useEffect(() => {
    localStorage.setItem('team-sidebar-collapsed', String(sidebarCollapsed));
  }, [sidebarCollapsed]);

  const [profile, setProfile] = useState<{full_name: string | null;company: string | null;avatar_url: string | null;} | null>(null);

  useEffect(() => {
    const fetchProfile = async () => {
      if (!user) return;
      const { data } = await supabase.
      from('profiles').
      select('full_name, company, avatar_url').
      eq('user_id', user.id).
      single();
      if (data) setProfile(data);
    };
    fetchProfile();
  }, [user]);

  useEffect(() => {
    if (!user) return;
    const channel = supabase.
    channel('team-profile-changes').
    on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'profiles', filter: `user_id=eq.${user.id}` },
    (payload) => {
      setProfile((prev) => ({ ...prev, ...(payload.new as any) }));
    }
    ).subscribe();
    return () => {supabase.removeChannel(channel);};
  }, [user]);

  useAuthSync();
  useSaveCurrentAccount();

  const handleSignOut = async () => {
    navigate('/sign-in', { replace: true });
    await quickSignOut('team');
  };

  const handleNavClick = (tab: string) => {
    if (tab === 'planner') {
      navigate('/dashboard/planner');
      setMobileMenuOpen(false);
      return;
    }
    onTabChange(tab);
    setMobileMenuOpen(false);
  };

  const getInitials = () => {
    if (profile?.full_name) {
      const names = profile.full_name.trim().split(' ');
      return names.length >= 2 ? `${names[0][0]}${names[names.length - 1][0]}`.toUpperCase() : names[0].substring(0, 2).toUpperCase();
    }
    return user?.email ? user.email.substring(0, 2).toUpperCase() : 'A';
  };

  const sidebarWidth = sidebarCollapsed ? 'lg:ml-[72px]' : 'lg:ml-[272px]';

  return (
    <TooltipProvider>
      {!splashDone && (
        <ActiveWebsiteSplash
          surface="team"
          onComplete={() => {
            try { sessionStorage.setItem('quooro-team-splash', 'seen'); } catch { /* refused */ }
            setSplashDone(true);
          }}
        />
      )}
      <TemperamentProvider value="office">
      <div className="h-screen overflow-hidden bg-background flex workshop-ui">
        {/* Desktop Sidebar */}
        <TeamSidebar
          collapsed={sidebarCollapsed}
          onCollapsedChange={setSidebarCollapsed}
          profile={profile}
          user={user}
          activeTab={activeTab}
          onTabChange={onTabChange}
          show2FAWarning={show2FAWarning}
          onSignOut={handleSignOut} />


        {/* Mobile Header & Content */}
        <div className={cn("flex-1 flex flex-col min-w-0 h-screen overflow-hidden transition-all duration-300", sidebarWidth)}>
          {/* Mobile Header */}
          <header className="lg:hidden sticky top-0 z-50 border-b border-border/60 bg-background/90 backdrop-blur-md">
            <div className="flex h-12 items-center justify-between px-4">
              <div className="flex items-center gap-2">
                <span className="font-mono text-[10px] font-medium uppercase tracking-[0.14em] text-foreground">Quooro office</span>
              </div>
              <div className="flex items-center gap-2">
                <ThemeToggle />
                <Sheet open={mobileMenuOpen} onOpenChange={setMobileMenuOpen}>
                  <SheetTrigger asChild>
                    <Button variant="ghost" size="icon" className="h-9 w-9">
                      <Menu className="h-5 w-5" />
                    </Button>
                  </SheetTrigger>
                  <SheetContent side="left" className="h-dvh max-h-dvh overflow-hidden w-[280px] p-0 border-r-0 bg-transparent">
                    <TeamSidebar
                      collapsed={false}
                      onCollapsedChange={() => {}}
                      profile={profile}
                      user={user}
                      activeTab={activeTab}
                      onTabChange={(tab) => { onTabChange(tab); setMobileMenuOpen(false); }}
                      show2FAWarning={show2FAWarning}
                      onSignOut={handleSignOut}
                      mobile
                    />
                  </SheetContent>
                </Sheet>
              </div>
            </div>
          </header>

          {/* 2FA Warning Banner */}
          {show2FAWarning && !bannerDismissed &&
          <TwoFactorWarning role="admin" variant="banner" showDismiss onDismiss={() => setBannerDismissed(true)} />
          }

          {/* Main Content */}
          <main className="flex-1 overflow-y-auto">
            {children}
          </main>

          {/* Build marker */}
          <footer className="flex h-7 shrink-0 items-center border-t border-border/60 bg-background px-4">
            <span className="font-mono text-[10px] font-medium uppercase tracking-[0.14em] text-muted-foreground">
              Quooro office · internal
            </span>
          </footer>
        </div>
      </div>

      {/* ⌘K jump-anywhere + ? shortcut overlay (client-side only) */}
      <CommandPalette open={paletteOpen} onOpenChange={setPaletteOpen} role="admin" />
      <ShortcutOverlay open={shortcutsOpen} onOpenChange={setShortcutsOpen} />
      </TemperamentProvider>
    </TooltipProvider>);

}