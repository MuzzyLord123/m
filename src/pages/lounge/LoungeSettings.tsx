import { useState, useEffect, useRef } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useSearchParams } from 'react-router-dom';
import {
  Camera,
  Loader2,
  Check,
  X,
  Eye,
  EyeOff,
  KeyRound,
  Sparkles,
  RotateCcw,
  Grip,
  PanelLeft,
  PanelTop,
  PanelRight,
  PanelBottom,
  Zap,
  MousePointer2,
  Monitor,
  Smartphone,
  Cpu,
  Paintbrush,
  Waves,
  ImageOff,
  Layers,
  Timer,
  Image,
  MousePointer,
  Move3D,
  Volume2,
  ArrowRightLeft,
  EyeOff as EyeOffIcon,
  Wifi,
  Download,
  LayoutGrid,
  Square,
  RectangleHorizontal,
  Type,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import SecuritySettings from '@/components/security/SecuritySettings';
import ConnectionsSettings from '@/components/lounge/ConnectionsSettings';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { IndustryCombobox } from '@/components/ui/IndustryCombobox';
import { useUIPreferences, type ThemeBackground, type AccentColor } from '@/hooks/useUIPreferences';
import { Switch } from '@/components/ui/switch';
import { FolderManagement } from '@/components/lounge/FolderManagement';
import { DeviceSettingsTab } from '@/components/lounge/DeviceSettingsTab';
import { cn } from '@/lib/utils';
import {
  PageHeader, Panel, PanelHeader, SkeletonForm,
  FIELD, FIELD_LABEL, FIELD_HELP,
} from '@/components/platform';


interface UserProfile {
  full_name: string | null;
  company: string | null;
  phone: string | null;
  email: string | null;
  avatar_url: string | null;
  customer_id: string | null;
  industry: string | null;
}

/** Simple wrapper so each tab shares consistent spacing */
function TabMotionGroup({ tabKey, children }: { tabKey: string; children: React.ReactNode }) {
  return (
    <div key={tabKey} className="space-y-4">
      {children}
    </div>
  );
}

/** Shared option-tile recipe for preference pickers */
const optionTile = (active: boolean) =>
  cn(
    'flex flex-col items-center gap-2 rounded-[10px] border p-3 transition-colors duration-150',
    active
      ? 'border-primary bg-primary/[0.04]'
      : 'border-border/60 hover:border-border hover:bg-foreground/[0.02]',
  );

const optionLabel = (active: boolean) =>
  cn('text-xs font-medium', active ? 'text-foreground' : 'text-muted-foreground');

/** Quiet vertical settings-nav trigger */
const SETTINGS_TAB =
  'shrink-0 justify-start rounded-lg px-3 py-1.5 text-[13px] text-muted-foreground data-[state=active]:bg-foreground/[0.05] data-[state=active]:text-foreground data-[state=active]:shadow-none lg:w-full';

export default function LoungeSettings() {
  const { user } = useAuth();
  const [searchParams] = useSearchParams();
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploadingAvatar, setUploadingAvatar] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Tab state - default to security if coming from 2FA warning
  const initialTab = searchParams.get('section') === 'security' ? 'security' : searchParams.get('section') === 'ui' ? 'ui' : searchParams.get('section') === 'sidebar' ? 'sidebar' : searchParams.get('section') === 'connections' ? 'connections' : searchParams.get('section') === 'theme' ? 'theme' : searchParams.get('section') === 'performance' ? 'performance' : searchParams.get('section') === 'device' ? 'device' : 'profile';

  const [activeTab, setActiveTab] = useState(initialTab);


  // UI preferences
  const { preferences, updatePreference, resetPreferences } = useUIPreferences();

  // Form state
  const [fullName, setFullName] = useState('');
  const [company, setCompany] = useState('');
  const [phone, setPhone] = useState('');
  const [industry, setIndustry] = useState('');

  // Password change state
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmNewPassword, setConfirmNewPassword] = useState('');
  const [showPasswords, setShowPasswords] = useState(false);
  const [changingPassword, setChangingPassword] = useState(false);

  useEffect(() => {
    if (user) {
      fetchProfile();
    }
  }, [user]);

  const fetchProfile = async () => {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('full_name, company, phone, email, avatar_url, customer_id, industry')
        .eq('user_id', user?.id)
        .single();

      if (error) throw error;

      setProfile(data);
      setFullName(data?.full_name || '');
      setCompany(data?.company || '');
      setPhone(data?.phone || '');
      setIndustry(data?.industry || '');
    } catch (error) {
      console.error('Error fetching profile:', error);
      toast.error('Your profile did not load. Refresh to try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleSaveProfile = async () => {
    if (!user) return;

    setSaving(true);
    try {
      const { error } = await supabase
        .from('profiles')
        .update({
          full_name: fullName.trim() || null,
          company: company.trim() || null,
          phone: phone.trim() || null,
          industry: industry || null,
        })
        .eq('user_id', user.id);

      if (error) throw error;

      setProfile(prev => prev ? {
        ...prev,
        full_name: fullName.trim() || null,
        company: company.trim() || null,
        phone: phone.trim() || null,
        industry: industry || null,
      } : null);

      toast.success('Profile updated');
    } catch (error) {
      console.error('Error updating profile:', error);
      toast.error('Your profile did not save. Try again.');
    } finally {
      setSaving(false);
    }
  };

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!newPassword || !confirmNewPassword) {
      toast.error('Fill in both password fields');
      return;
    }

    if (newPassword !== confirmNewPassword) {
      toast.error('New passwords do not match');
      return;
    }

    if (newPassword.length < 6) {
      toast.error('Password must be at least 6 characters');
      return;
    }

    setChangingPassword(true);

    try {
      const { error } = await supabase.auth.updateUser({
        password: newPassword
      });

      if (error) {
        toast.error(error.message);
      } else {
        toast.success('Password updated');
        setCurrentPassword('');
        setNewPassword('');
        setConfirmNewPassword('');
      }
    } catch (err) {
      toast.error('Your password did not update. Try again.');
    } finally {
      setChangingPassword(false);
    }
  };

  const handleAvatarClick = () => {
    fileInputRef.current?.click();
  };

  const handleAvatarUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file || !user) return;

    // Validate file type
    if (!file.type.startsWith('image/')) {
      toast.error('Choose an image file');
      return;
    }

    // Validate file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      toast.error('Image must be less than 5MB');
      return;
    }

    setUploadingAvatar(true);
    try {
      // Generate unique filename
      const fileExt = file.name.split('.').pop();
      const fileName = `${user.id}/avatar.${fileExt}`;

      // Delete old avatar if exists
      if (profile?.avatar_url) {
        const oldPath = profile.avatar_url.split('/avatars/')[1];
        if (oldPath) {
          await supabase.storage.from('avatars').remove([oldPath]);
        }
      }

      // Upload new avatar
      const { error: uploadError } = await supabase.storage
        .from('avatars')
        .upload(fileName, file, { upsert: true });

      if (uploadError) throw uploadError;

      // Get public URL
      const { data: { publicUrl } } = supabase.storage
        .from('avatars')
        .getPublicUrl(fileName);

      // Add cache buster to URL
      const avatarUrl = `${publicUrl}?t=${Date.now()}`;

      // Update profile with new avatar URL
      const { error: updateError } = await supabase
        .from('profiles')
        .update({ avatar_url: avatarUrl })
        .eq('user_id', user.id);

      if (updateError) throw updateError;

      setProfile(prev => prev ? { ...prev, avatar_url: avatarUrl } : null);
      toast.success('Avatar updated');
    } catch (error) {
      console.error('Error uploading avatar:', error);
      toast.error('Your avatar did not upload. Try again.');
    } finally {
      setUploadingAvatar(false);
      // Reset file input
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  const handleRemoveAvatar = async () => {
    if (!user || !profile?.avatar_url) return;

    setUploadingAvatar(true);
    try {
      // Extract path from URL
      const urlParts = profile.avatar_url.split('/avatars/');
      if (urlParts[1]) {
        const filePath = urlParts[1].split('?')[0]; // Remove query params
        await supabase.storage.from('avatars').remove([filePath]);
      }

      // Update profile to remove avatar URL
      const { error } = await supabase
        .from('profiles')
        .update({ avatar_url: null })
        .eq('user_id', user.id);

      if (error) throw error;

      setProfile(prev => prev ? { ...prev, avatar_url: null } : null);
      toast.success('Avatar removed');
    } catch (error) {
      console.error('Error removing avatar:', error);
      toast.error('The avatar was not removed. Try again.');
    } finally {
      setUploadingAvatar(false);
    }
  };

  const getInitials = () => {
    if (profile?.full_name) {
      const names = profile.full_name.trim().split(' ');
      if (names.length >= 2) {
        return `${names[0][0]}${names[names.length - 1][0]}`.toUpperCase();
      }
      return names[0].substring(0, 2).toUpperCase();
    }
    if (user?.email) {
      return user.email.substring(0, 2).toUpperCase();
    }
    return 'U';
  };

  if (loading) {
    return (
      <div className="mx-auto max-w-[880px] px-5 py-7 lg:px-8" aria-hidden>
        <span className="block h-5 w-32 animate-pulse rounded bg-foreground/[0.06]" />
        <span className="mt-2 block h-3.5 w-64 animate-pulse rounded bg-foreground/[0.05]" />
        <div className="mt-6 rounded-[10px] border border-border/60 p-4">
          <SkeletonForm fields={4} />
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-[880px] px-5 py-7 lg:px-8">
      <div className="space-y-6">
        <PageHeader
          kicker="Client portal"
          title="Settings"
          description="Your profile, security and portal preferences"
        />

        {/* Tabs: vertical layout */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full flex flex-col lg:flex-row gap-6">
          <TabsList className="scrollbar-hide flex w-full shrink-0 justify-start gap-0.5 overflow-x-auto rounded-lg bg-transparent p-0 lg:h-auto lg:w-44 lg:flex-col">
            <TabsTrigger value="profile" className={SETTINGS_TAB}>Profile</TabsTrigger>
            <TabsTrigger value="security" className={SETTINGS_TAB}>Security</TabsTrigger>
            <TabsTrigger value="ui" className={SETTINGS_TAB}>Interface</TabsTrigger>
            <TabsTrigger value="theme" className={SETTINGS_TAB}>Theme</TabsTrigger>
            <TabsTrigger value="sidebar" className={cn(SETTINGS_TAB, 'hidden lg:flex')}>Sidebar</TabsTrigger>
            <TabsTrigger value="device" className={SETTINGS_TAB}>Device</TabsTrigger>
            <TabsTrigger value="performance" className={SETTINGS_TAB}>Performance</TabsTrigger>
            <TabsTrigger value="connections" className={SETTINGS_TAB}>Connections</TabsTrigger>
          </TabsList>

          <div className="min-w-0 flex-1">

          <TabsContent value="security" className="mt-0">
            <TabMotionGroup tabKey="security">
              <SecuritySettings />
            </TabMotionGroup>
          </TabsContent>

          <TabsContent value="ui" className="mt-0">
            <TabMotionGroup tabKey="ui">
            {/* Reset */}
            <div className="flex justify-end">
              <Button variant="ghost" size="sm" onClick={() => { resetPreferences(); toast.success('Interface preferences reset to defaults'); }} className="h-8 gap-1.5 rounded-lg px-3 text-xs text-muted-foreground">
                <RotateCcw className="h-3.5 w-3.5" />
                Reset all
              </Button>
            </div>


            {/* Sidebar position (desktop only) */}
            <div className="hidden lg:block">
              <Panel>
                <PanelHeader label="Sidebar position" />
                <div className="p-4">
                  <p className="mb-3 text-[13px] text-muted-foreground">Choose where the navigation sidebar appears</p>
                  <div className="grid grid-cols-4 gap-3">
                    {([
                      { value: 'left' as const, icon: PanelLeft, label: 'Left' },
                      { value: 'top' as const, icon: PanelTop, label: 'Top' },
                      { value: 'right' as const, icon: PanelRight, label: 'Right' },
                      { value: 'bottom' as const, icon: PanelBottom, label: 'Bottom' },
                    ]).map(opt => (
                      <button
                        key={opt.value}
                        onClick={() => updatePreference('sidebarPosition', opt.value)}
                        className={optionTile(preferences.sidebarPosition === opt.value)}
                      >
                        <opt.icon className={cn('h-5 w-5', preferences.sidebarPosition === opt.value ? 'text-primary' : 'text-muted-foreground')} />
                        <p className={optionLabel(preferences.sidebarPosition === opt.value)}>{opt.label}</p>
                      </button>
                    ))}
                  </div>
                </div>
              </Panel>
            </div>


            {/* Dashboard density */}
            <Panel>
              <PanelHeader label="Dashboard density" />
              <div className="p-4">
                <p className="mb-3 text-[13px] text-muted-foreground">Control the spacing and size of dashboard elements</p>
                <div className="grid grid-cols-3 gap-3">
                  {([
                    { value: 'compact' as const, label: 'Compact', desc: 'Dense layout' },
                    { value: 'comfortable' as const, label: 'Comfortable', desc: 'Balanced' },
                    { value: 'spacious' as const, label: 'Spacious', desc: 'Lots of space' },
                  ]).map(opt => (
                    <button
                      key={opt.value}
                      onClick={() => updatePreference('dashboardDensity', opt.value)}
                      className={optionTile(preferences.dashboardDensity === opt.value)}
                    >
                      <div className={cn('flex', opt.value === 'compact' ? 'gap-px' : opt.value === 'spacious' ? 'gap-1.5' : 'gap-1')}>
                        {[1,2,3].map(i => <div key={i} className={cn('rounded bg-muted-foreground/20', opt.value === 'compact' ? 'h-3 w-3' : opt.value === 'spacious' ? 'h-5 w-5' : 'h-4 w-4')} />)}
                      </div>
                      <p className={optionLabel(preferences.dashboardDensity === opt.value)}>{opt.label}</p>
                    </button>
                  ))}
                </div>
              </div>
            </Panel>




            {/* Card style */}
            <Panel>
              <PanelHeader label="Card style" />
              <div className="p-4">
                <p className="mb-3 text-[13px] text-muted-foreground">Visual appearance of dashboard cards</p>
                <div className="grid grid-cols-3 gap-3">
                  {([
                    { value: 'bordered' as const, label: 'Bordered', cls: 'border-2 border-muted-foreground/20' },
                    { value: 'elevated' as const, label: 'Elevated', cls: 'shadow-md border-0' },
                    { value: 'flat' as const, label: 'Flat', cls: 'bg-muted/40 border-0' },
                  ]).map(opt => (
                    <button
                      key={opt.value}
                      onClick={() => updatePreference('cardStyle', opt.value)}
                      className={optionTile(preferences.cardStyle === opt.value)}
                    >
                      <div className={cn('h-8 w-12 rounded-md', opt.cls)} />
                      <p className={optionLabel(preferences.cardStyle === opt.value)}>{opt.label}</p>
                    </button>
                  ))}
                </div>
              </div>
            </Panel>

            {/* Card corners */}
            <Panel>
              <PanelHeader label="Card corners" />
              <div className="p-4">
                <p className="mb-3 text-[13px] text-muted-foreground">Border radius for dashboard cards</p>
                <div className="grid grid-cols-4 gap-3">
                  {([
                    { value: 'none' as const, label: 'Sharp', r: 'rounded-none' },
                    { value: 'sm' as const, label: 'Small', r: 'rounded-sm' },
                    { value: 'md' as const, label: 'Medium', r: 'rounded-md' },
                    { value: 'lg' as const, label: 'Large', r: 'rounded-xl' },
                  ]).map(opt => (
                    <button
                      key={opt.value}
                      onClick={() => updatePreference('cardRadius', opt.value)}
                      className={optionTile(preferences.cardRadius === opt.value)}
                    >
                      <div className={cn('h-7 w-10 border-2 border-muted-foreground/30', opt.r)} />
                      <p className={optionLabel(preferences.cardRadius === opt.value)}>{opt.label}</p>
                    </button>
                  ))}
                </div>
              </div>
            </Panel>

            {/* Font size */}
            <Panel>
              <PanelHeader label="Font size" />
              <div className="p-4">
                <p className="mb-3 text-[13px] text-muted-foreground">Text size throughout the dashboard</p>
                <div className="grid grid-cols-3 gap-3">
                  {([
                    { value: 'small' as const, label: 'Small', size: 'text-xs' },
                    { value: 'medium' as const, label: 'Medium', size: 'text-sm' },
                    { value: 'large' as const, label: 'Large', size: 'text-base' },
                  ]).map(opt => (
                    <button
                      key={opt.value}
                      onClick={() => updatePreference('fontSize', opt.value)}
                      className={optionTile(preferences.fontSize === opt.value)}
                    >
                      <span className={cn('font-medium', opt.size, preferences.fontSize === opt.value ? 'text-foreground' : 'text-muted-foreground')}>Aa</span>
                      <p className={optionLabel(preferences.fontSize === opt.value)}>{opt.label}</p>
                    </button>
                  ))}
                </div>
              </div>
            </Panel>

            {/* Widgets */}
            <Panel>
              <PanelHeader label="Dashboard widgets" />
              <div className="space-y-4 p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium">Floating action button</p>
                    <p className="text-xs text-muted-foreground">Quick shortcut button (bottom right)</p>
                  </div>
                  <Switch
                    checked={preferences.showFAB}
                    onCheckedChange={(v) => updatePreference('showFAB', v)}
                  />
                </div>
              </div>
            </Panel>

            {/* Animations */}
            <Panel>
              <PanelHeader label="Animations" />
              <div className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium">Enable animations</p>
                    <p className="text-xs text-muted-foreground">Smooth transitions and motion effects</p>
                  </div>
                  <Switch
                    checked={preferences.animationsEnabled}
                    onCheckedChange={(v) => updatePreference('animationsEnabled', v)}
                  />
                </div>
              </div>
            </Panel>

            {/* Cursor style (desktop only) */}
            <div className="hidden lg:block">
              <Panel>
                <PanelHeader label="Cursor style" />
                <div className="p-4">
                  <p className="mb-3 text-[13px] text-muted-foreground">Choose your pointer style across the platform</p>
                  <div className="grid grid-cols-3 gap-3">
                    {([
                      { value: 'dot' as const, label: 'Dot', desc: 'Minimal dot cursor' },
                      { value: 'enterprise' as const, label: 'Enterprise', desc: 'Precision crosshair' },
                      { value: 'default' as const, label: 'Standard', desc: 'System default' },
                    ]).map(opt => (
                      <button
                        key={opt.value}
                        onClick={() => updatePreference('cursorStyle', opt.value)}
                        className={optionTile(preferences.cursorStyle === opt.value)}
                      >
                        <div className="flex h-8 w-8 items-center justify-center">
                          {opt.value === 'dot' ? (
                            <div className="h-3 w-3 rounded-full bg-foreground/60" />
                          ) : opt.value === 'enterprise' ? (
                            <span className="text-lg" style={{ cursor: 'crosshair' }}>+</span>
                          ) : (
                            <MousePointer2 className="h-5 w-5 text-muted-foreground" />
                          )}
                        </div>
                        <p className={optionLabel(preferences.cursorStyle === opt.value)}>{opt.label}</p>
                        <p className="text-[10px] text-muted-foreground">{opt.desc}</p>
                      </button>
                    ))}
                  </div>
                </div>
              </Panel>
            </div>
            </TabMotionGroup>
          </TabsContent>

          <TabsContent value="device" className="mt-0">
            <TabMotionGroup tabKey="device">
              <DeviceSettingsTab />
            </TabMotionGroup>
          </TabsContent>

          <TabsContent value="performance" className="mt-0">
            <TabMotionGroup tabKey="performance">

              {/* Performance presets */}
              <Panel>
                <PanelHeader label="Performance presets" />
                <div className="p-4">
                  <p className="mb-3 text-[13px] text-muted-foreground">Optimise for your device with a preset, or fine-tune individual settings below</p>
                  <div className="grid grid-cols-3 gap-3">
                    {([
                      {
                        key: 'low',
                        label: 'Low end',
                        icon: Smartphone,
                        desc: 'Maximum performance',
                        detail: 'Strips all effects for smooth operation on older devices',
                      },
                      {
                        key: 'medium',
                        label: 'Medium',
                        icon: Monitor,
                        desc: 'Balanced',
                        detail: 'Core animations with reduced GPU-heavy effects',
                      },
                      {
                        key: 'high',
                        label: 'High end',
                        icon: Cpu,
                        desc: 'Full experience',
                        detail: 'Everything enabled: blur, 3D, parallax, realtime',
                      },
                    ] as const).map(preset => {
                      const isLow = !preferences.animationsEnabled && preferences.themeBackground === 'none' && preferences.cursorStyle === 'default' && !preferences.enableBlur && !preferences.enableShadows;
                      const isHigh = preferences.animationsEnabled && preferences.themeBackground !== 'none' && preferences.enableBlur && preferences.enableShadows && preferences.enable3DEffects;
                      const currentPreset = isLow ? 'low' : isHigh ? 'high' : 'medium';

                      return (
                        <button
                          key={preset.key}
                          onClick={() => {
                            if (preset.key === 'low') {
                              updatePreference('animationsEnabled', false);
                              updatePreference('themeBackground', 'none');
                              updatePreference('cursorStyle', 'default');
                              updatePreference('showFAB', false);
                              updatePreference('renderQuality', 'low');
                              updatePreference('maxFPS', '30');
                              updatePreference('enableBlur', false);
                              updatePreference('enableShadows', false);
                              updatePreference('enableGradients', false);
                              updatePreference('enable3DEffects', false);
                              updatePreference('enableHoverEffects', false);
                              updatePreference('enableParallax', false);
                              updatePreference('enableSoundEffects', false);
                              updatePreference('enablePageTransitions', false);
                              updatePreference('reduceTransparency', true);
                              updatePreference('showWidgetAnimations', false);
                              updatePreference('prefetchPages', false);
                              toast.success('Low-end preset applied: maximum performance');
                            } else if (preset.key === 'medium') {
                              updatePreference('animationsEnabled', true);
                              updatePreference('themeBackground', 'none');
                              updatePreference('cursorStyle', 'default');
                              updatePreference('showFAB', true);
                              updatePreference('renderQuality', 'medium');
                              updatePreference('maxFPS', '60');
                              updatePreference('enableBlur', false);
                              updatePreference('enableShadows', true);
                              updatePreference('enableGradients', true);
                              updatePreference('enable3DEffects', false);
                              updatePreference('enableHoverEffects', true);
                              updatePreference('enableParallax', false);
                              updatePreference('enableSoundEffects', false);
                              updatePreference('enablePageTransitions', true);
                              updatePreference('reduceTransparency', false);
                              updatePreference('showWidgetAnimations', true);
                              updatePreference('prefetchPages', true);
                              toast.success('Medium preset applied: balanced performance');
                            } else {
                              updatePreference('animationsEnabled', true);
                              updatePreference('themeBackground', 'orbs');
                              updatePreference('cursorStyle', 'dot');
                              updatePreference('showFAB', true);
                              updatePreference('renderQuality', 'high');
                              updatePreference('maxFPS', 'unlimited');
                              updatePreference('enableBlur', true);
                              updatePreference('enableShadows', true);
                              updatePreference('enableGradients', true);
                              updatePreference('enable3DEffects', true);
                              updatePreference('enableHoverEffects', true);
                              updatePreference('enableParallax', true);
                              updatePreference('enableSoundEffects', false);
                              updatePreference('enablePageTransitions', true);
                              updatePreference('reduceTransparency', false);
                              updatePreference('showWidgetAnimations', true);
                              updatePreference('prefetchPages', true);
                              toast.success('High-end preset applied: full visual experience');
                            }
                          }}
                          className={optionTile(currentPreset === preset.key)}
                        >
                          <preset.icon className={cn('h-6 w-6', currentPreset === preset.key ? 'text-primary' : 'text-muted-foreground')} />
                          <p className={cn('text-sm font-[550]', currentPreset === preset.key ? 'text-foreground' : 'text-muted-foreground')}>{preset.label}</p>
                          <p className={cn('text-xs', currentPreset === preset.key ? 'text-foreground/70' : 'text-muted-foreground')}>{preset.desc}</p>
                          <p className="text-center text-[10px] leading-tight text-muted-foreground">{preset.detail}</p>
                        </button>
                      );
                    })}
                  </div>
                </div>
              </Panel>

              {/* Rendering */}
              <Panel>
                <PanelHeader label="Rendering" />
                <div className="space-y-5 p-4">
                  <p className="text-[13px] text-muted-foreground">Controls that affect GPU usage and visual fidelity</p>
                  {/* Render quality */}
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium">Render quality</p>
                        <p className="text-xs text-muted-foreground">Affects image resolution, blur radius and shadow complexity</p>
                      </div>
                    </div>
                    <div className="flex gap-2">
                      {(['low', 'medium', 'high'] as const).map(q => (
                        <button
                          key={q}
                          onClick={() => updatePreference('renderQuality', q)}
                          className={cn(
                            'flex-1 rounded-lg border px-3 py-2 text-sm font-medium capitalize transition-colors duration-150',
                            preferences.renderQuality === q
                              ? 'border-primary bg-primary/[0.06] text-primary'
                              : 'border-border/60 text-muted-foreground hover:border-border',
                          )}
                        >
                          {q}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Max FPS */}
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="flex items-center gap-1.5 text-sm font-medium"><Timer className="h-3.5 w-3.5" /> Frame rate limit</p>
                        <p className="text-xs text-muted-foreground">Cap animation frame rate to reduce CPU and GPU load</p>
                      </div>
                    </div>
                    <div className="flex gap-2">
                      {([
                        { value: '30' as const, label: '30 FPS' },
                        { value: '60' as const, label: '60 FPS' },
                        { value: 'unlimited' as const, label: 'Unlimited' },
                      ]).map(opt => (
                        <button
                          key={opt.value}
                          onClick={() => updatePreference('maxFPS', opt.value)}
                          className={cn(
                            'flex-1 rounded-lg border px-3 py-2 text-sm font-medium tabular-nums transition-colors duration-150',
                            preferences.maxFPS === opt.value
                              ? 'border-primary bg-primary/[0.06] text-primary'
                              : 'border-border/60 text-muted-foreground hover:border-border',
                          )}
                        >
                          {opt.label}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className="h-px bg-border/60" />

                  {([
                    { key: 'enableBlur' as const, label: 'Backdrop blur', desc: 'Glass effects (heavy on GPU)', icon: Waves },
                    { key: 'enableShadows' as const, label: 'Complex shadows', desc: 'Multi-layer box shadows on cards and modals', icon: Layers },
                    { key: 'enableGradients' as const, label: 'Gradient effects', desc: 'Gradient overlays and accent washes', icon: Paintbrush },
                    { key: 'enable3DEffects' as const, label: '3D transforms', desc: 'Perspective, rotation and depth effects', icon: Move3D },
                    { key: 'reduceTransparency' as const, label: 'Reduce transparency', desc: 'Replace translucent panels with solid backgrounds', icon: EyeOffIcon, invert: true },
                  ] as const).map(item => (
                    <div key={item.key} className="flex items-center justify-between">
                      <div className="flex items-start gap-2.5">
                        <item.icon className="mt-0.5 h-4 w-4 shrink-0 text-muted-foreground" />
                        <div>
                          <p className="text-sm font-medium">{item.label}</p>
                          <p className="text-xs text-muted-foreground">{item.desc}</p>
                        </div>
                      </div>
                      <Switch
                        checked={'invert' in item && item.invert ? preferences[item.key] as boolean : preferences[item.key] as boolean}
                        onCheckedChange={(v) => updatePreference(item.key, v)}
                      />
                    </div>
                  ))}
                </div>
              </Panel>

              {/* Animations and interactions */}
              <Panel>
                <PanelHeader label="Animations and interactions" />
                <div className="space-y-5 p-4">
                  {([
                    { key: 'animationsEnabled' as const, label: 'UI animations', desc: 'Reveals, scale effects and fade-ins across all pages', icon: Sparkles },
                    { key: 'enablePageTransitions' as const, label: 'Page transitions', desc: 'Animated route changes between pages', icon: ArrowRightLeft },
                    { key: 'showWidgetAnimations' as const, label: 'Widget entry animations', desc: 'Dashboard widgets animate in on load', icon: LayoutGrid },
                    { key: 'enableHoverEffects' as const, label: 'Hover effects', desc: 'Scale, glow and lift effects on interactive elements', icon: MousePointer },
                    { key: 'enableParallax' as const, label: 'Parallax scrolling', desc: 'Depth-based scroll effects on backgrounds', icon: Layers },
                    { key: 'enableSoundEffects' as const, label: 'Sound effects', desc: 'Subtle UI sounds on interactions (clicks, notifications)', icon: Volume2 },
                  ] as const).map(item => (
                    <div key={item.key} className="flex items-center justify-between">
                      <div className="flex items-start gap-2.5">
                        <item.icon className="mt-0.5 h-4 w-4 shrink-0 text-muted-foreground" />
                        <div>
                          <p className="text-sm font-medium">{item.label}</p>
                          <p className="text-xs text-muted-foreground">{item.desc}</p>
                        </div>
                      </div>
                      <Switch
                        checked={preferences[item.key]}
                        onCheckedChange={(v) => updatePreference(item.key, v)}
                      />
                    </div>
                  ))}
                </div>
              </Panel>

              {/* Visual chrome */}
              <Panel>
                <PanelHeader label="Visual chrome" />
                <div className="space-y-5 p-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-start gap-2.5">
                      <ImageOff className="mt-0.5 h-4 w-4 shrink-0 text-muted-foreground" />
                      <div>
                        <p className="text-sm font-medium">Background effects</p>
                        <p className="text-xs text-muted-foreground">Orbs, grids, gradients and aurora (uses GPU)</p>
                      </div>
                    </div>
                    <Switch
                      checked={preferences.themeBackground !== 'none'}
                      onCheckedChange={(v) => updatePreference('themeBackground', v ? 'orbs' : 'none')}
                    />
                  </div>
                  <div className="flex items-center justify-between">
                    <div className="flex items-start gap-2.5">
                      <MousePointer2 className="mt-0.5 h-4 w-4 shrink-0 text-muted-foreground" />
                      <div>
                        <p className="text-sm font-medium">Custom cursor</p>
                        <p className="text-xs text-muted-foreground">Dot or enterprise cursor style (desktop only)</p>
                      </div>
                    </div>
                    <Switch
                      checked={preferences.cursorStyle !== 'default'}
                      onCheckedChange={(v) => updatePreference('cursorStyle', v ? 'dot' : 'default')}
                    />
                  </div>
                  <div className="flex items-center justify-between">
                    <div className="flex items-start gap-2.5">
                      <Zap className="mt-0.5 h-4 w-4 shrink-0 text-muted-foreground" />
                      <div>
                        <p className="text-sm font-medium">Floating action button</p>
                        <p className="text-xs text-muted-foreground">Quick-access overlay button</p>
                      </div>
                    </div>
                    <Switch
                      checked={preferences.showFAB}
                      onCheckedChange={(v) => updatePreference('showFAB', v)}
                    />
                  </div>
                </div>
              </Panel>

              {/* Data and network */}
              <Panel>
                <PanelHeader label="Data and network" />
                <div className="space-y-5 p-4">
                  <p className="text-[13px] text-muted-foreground">Controls that affect bandwidth, memory and background processing</p>
                  {([
                    { key: 'enableRealtime' as const, label: 'Realtime updates', desc: 'Live data subscriptions (persistent connections)', icon: Wifi },
                    { key: 'lazyLoadImages' as const, label: 'Lazy load images', desc: 'Only load images when they enter the viewport', icon: Image },
                    { key: 'prefetchPages' as const, label: 'Prefetch pages', desc: 'Preload adjacent pages in the background for instant navigation', icon: Download },
                  ] as const).map(item => (
                    <div key={item.key} className="flex items-center justify-between">
                      <div className="flex items-start gap-2.5">
                        <item.icon className="mt-0.5 h-4 w-4 shrink-0 text-muted-foreground" />
                        <div>
                          <p className="text-sm font-medium">{item.label}</p>
                          <p className="text-xs text-muted-foreground">{item.desc}</p>
                        </div>
                      </div>
                      <Switch
                        checked={preferences[item.key]}
                        onCheckedChange={(v) => updatePreference(item.key, v)}
                      />
                    </div>
                  ))}
                </div>
              </Panel>
            </TabMotionGroup>
          </TabsContent>

          <TabsContent value="profile" className="mt-0">
            <TabMotionGroup tabKey="profile">
        {/* Avatar */}
        <Panel>
          <PanelHeader label="Profile picture" />
          <div className="p-4">
            <div className="flex items-center gap-6">
              <div className="group relative">
                <Avatar
                  className="h-24 w-24 cursor-pointer border border-border/60 transition-colors duration-150 hover:border-primary"
                  onClick={handleAvatarClick}
                >
                  <AvatarImage src={profile?.avatar_url || ''} alt={profile?.full_name || 'User'} />
                  <AvatarFallback className="bg-primary/10 text-2xl text-primary">
                    {getInitials()}
                  </AvatarFallback>
                </Avatar>

                {/* Upload overlay */}
                <div
                  className="absolute inset-0 flex cursor-pointer items-center justify-center rounded-full bg-background/70 opacity-0 transition-opacity duration-150 group-hover:opacity-100"
                  onClick={handleAvatarClick}
                >
                  {uploadingAvatar ? (
                    <Loader2 className="h-6 w-6 animate-spin text-foreground" />
                  ) : (
                    <Camera className="h-6 w-6 text-foreground" />
                  )}
                </div>

                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  onChange={handleAvatarUpload}
                  className="hidden"
                />
              </div>

              <div className="space-y-2">
                <Button
                  variant="outline"
                  size="sm"
                  className="h-8 rounded-lg px-3 text-xs"
                  onClick={handleAvatarClick}
                  disabled={uploadingAvatar}
                >
                  {uploadingAvatar ? (
                    <Loader2 className="mr-2 h-3.5 w-3.5 animate-spin" />
                  ) : (
                    <Camera className="mr-2 h-3.5 w-3.5" />
                  )}
                  Upload photo
                </Button>
                {profile?.avatar_url && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={handleRemoveAvatar}
                    disabled={uploadingAvatar}
                    className="h-8 rounded-lg px-3 text-xs text-destructive hover:bg-destructive/10 hover:text-destructive"
                  >
                    <X className="mr-2 h-3.5 w-3.5" />
                    Remove
                  </Button>
                )}
                <p className="text-xs text-muted-foreground">
                  JPG, PNG or GIF. Up to 5MB.
                </p>
              </div>
            </div>
          </div>
        </Panel>

        {/* Profile information */}
        <Panel>
          <PanelHeader label="Profile information" />
          <div className="space-y-4 p-4">
            <div className="space-y-1.5">
              <Label htmlFor="fullName" className={FIELD_LABEL}>
                Full name
              </Label>
              <Input
                id="fullName"
                className={FIELD}
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                placeholder="Enter your full name"
              />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="company" className={FIELD_LABEL}>
                Company name
              </Label>
              <Input
                id="company"
                className={FIELD}
                value={company}
                onChange={(e) => setCompany(e.target.value)}
                placeholder="Enter your company name"
              />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="phone" className={FIELD_LABEL}>
                Phone number
              </Label>
              <Input
                id="phone"
                className={FIELD}
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="Enter your phone number"
              />
            </div>

            <div className="space-y-1.5">
              <Label className={FIELD_LABEL}>
                Industry or business type
              </Label>
              <IndustryCombobox value={industry} onChange={setIndustry} />
              <p className={FIELD_HELP}>
                This personalises your AI assistant to your specific industry
              </p>
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="email" className={FIELD_LABEL}>
                Email address
              </Label>
              <Input
                id="email"
                value={user?.email || ''}
                disabled
                className={cn(FIELD, 'opacity-70')}
              />
              <p className={FIELD_HELP}>
                Email cannot be changed here. Message the studio if you need to update it.
              </p>
            </div>

            <div className="pt-2">
              <Button
                onClick={handleSaveProfile}
                disabled={saving}
                className="h-8 w-full rounded-lg px-3 text-xs sm:w-auto"
              >
                {saving ? (
                  <>
                    <Loader2 className="mr-2 h-3.5 w-3.5 animate-spin" />
                    Saving
                  </>
                ) : (
                  <>
                    <Check className="mr-2 h-3.5 w-3.5" />
                    Save changes
                  </>
                )}
              </Button>
            </div>
          </div>
        </Panel>

        {/* Change password */}
        <Panel>
          <PanelHeader label="Change password" />
          <div className="p-4">
            <form onSubmit={handleChangePassword} className="space-y-4">
              <div className="space-y-1.5">
                <Label htmlFor="newPassword" className={FIELD_LABEL}>
                  New password
                </Label>
                <div className="relative">
                  <Input
                    id="newPassword"
                    className={cn(FIELD, 'pr-10')}
                    type={showPasswords ? 'text' : 'password'}
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    placeholder="Enter new password"
                  />
                  <button
                    type="button"
                    aria-label={showPasswords ? 'Hide passwords' : 'Show passwords'}
                    onClick={() => setShowPasswords(!showPasswords)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground transition-colors duration-150 hover:text-foreground"
                  >
                    {showPasswords ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
                <p className={FIELD_HELP}>Minimum 6 characters</p>
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="confirmNewPassword" className={FIELD_LABEL}>
                  Confirm new password
                </Label>
                <Input
                  id="confirmNewPassword"
                  className={FIELD}
                  type={showPasswords ? 'text' : 'password'}
                  value={confirmNewPassword}
                  onChange={(e) => setConfirmNewPassword(e.target.value)}
                  placeholder="Confirm new password"
                />
              </div>

              <Button
                type="submit"
                disabled={changingPassword || !newPassword || !confirmNewPassword}
                className="h-8 w-full rounded-lg px-3 text-xs sm:w-auto"
              >
                {changingPassword ? (
                  <>
                    <Loader2 className="mr-2 h-3.5 w-3.5 animate-spin" />
                    Updating
                  </>
                ) : (
                  <>
                    <KeyRound className="mr-2 h-3.5 w-3.5" />
                    Update password
                  </>
                )}
              </Button>
            </form>
          </div>
        </Panel>

        {/* Account info */}
        <Panel>
          <PanelHeader label="Account information" />
          <dl>
            {profile?.customer_id && (
              <div className="flex items-center justify-between px-4 py-2.5">
                <dt className="text-[13px] text-muted-foreground">Customer ID</dt>
                <dd className="font-mono text-xs tabular-nums text-foreground">{profile.customer_id}</dd>
              </div>
            )}
            <div className="flex items-center justify-between border-t border-border/60 px-4 py-2.5">
              <dt className="text-[13px] text-muted-foreground">Account email</dt>
              <dd className="text-[13px] text-foreground">{user?.email}</dd>
            </div>
            <div className="flex items-center justify-between border-t border-border/60 px-4 py-2.5">
              <dt className="text-[13px] text-muted-foreground">Member since</dt>
              <dd className="text-[13px] tabular-nums text-foreground">
                {user?.created_at
                  ? new Date(user.created_at).toLocaleDateString('en-GB', {
                      month: 'long',
                      year: 'numeric'
                    })
                  : '-'
                }
              </dd>
            </div>
          </dl>
        </Panel>
            </TabMotionGroup>
          </TabsContent>

          <TabsContent value="sidebar" className="mt-0">
            <TabMotionGroup tabKey="sidebar">
              <FolderManagement userId={user?.id} />
            </TabMotionGroup>
          </TabsContent>

          <TabsContent value="theme" className="mt-0">
            <TabMotionGroup tabKey="theme">
              {/* Background pattern */}
              <Panel>
                <PanelHeader label="Background pattern" />
                <div className="p-4">
                  <p className="mb-3 text-[13px] text-muted-foreground">Choose the ambient background effect for the portal</p>
                  <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
                    {([
                      { value: 'none' as ThemeBackground, label: 'None', desc: 'Clean solid background', preview: 'bg-background' },
                      { value: 'orbs' as ThemeBackground, label: 'Orbs', desc: 'Soft floating particles', preview: 'bg-background' },
                      { value: 'grid' as ThemeBackground, label: 'Grid', desc: 'Subtle grid lines', preview: 'bg-background' },
                      { value: 'dots' as ThemeBackground, label: 'Dots', desc: 'Minimal dot pattern', preview: 'bg-background' },
                      { value: 'gradient' as ThemeBackground, label: 'Gradient', desc: 'Gentle colour shift', preview: 'bg-background' },
                      { value: 'noise' as ThemeBackground, label: 'Noise', desc: 'Film grain texture', preview: 'bg-background' },
                      { value: 'aurora' as ThemeBackground, label: 'Aurora', desc: 'Colourful ambient glow', preview: 'bg-background' },
                    ]).map(opt => (
                      <button
                        key={opt.value}
                        onClick={() => updatePreference('themeBackground', opt.value)}
                        className={optionTile(preferences.themeBackground === opt.value)}
                      >
                        <div className={`relative h-12 w-full overflow-hidden rounded-lg border border-border/50 ${opt.preview}`}>
                          {opt.value === 'grid' && (
                            <svg className="absolute inset-0 h-full w-full" xmlns="http://www.w3.org/2000/svg">
                              <defs><pattern id="grid-preview" width="10" height="10" patternUnits="userSpaceOnUse"><path d="M 10 0 L 0 0 0 10" fill="none" stroke="currentColor" strokeWidth="0.5" opacity="0.15" /></pattern></defs>
                              <rect width="100%" height="100%" fill="url(#grid-preview)" />
                            </svg>
                          )}
                          {opt.value === 'dots' && (
                            <svg className="absolute inset-0 h-full w-full" xmlns="http://www.w3.org/2000/svg">
                              <defs><pattern id="dots-preview" width="8" height="8" patternUnits="userSpaceOnUse"><circle cx="4" cy="4" r="0.8" fill="currentColor" opacity="0.15" /></pattern></defs>
                              <rect width="100%" height="100%" fill="url(#dots-preview)" />
                            </svg>
                          )}
                          {opt.value === 'orbs' && (
                            <div className="absolute inset-0 flex items-center justify-center">
                              <div className="h-8 w-8 rounded-full bg-muted-foreground/10 blur-sm" />
                              <div className="absolute right-2 top-1 h-5 w-5 rounded-full bg-muted-foreground/8 blur-sm" />
                            </div>
                          )}
                          {opt.value === 'gradient' && (
                            <div className="absolute inset-0 bg-gradient-to-br from-primary/10 via-transparent to-accent/10" />
                          )}
                          {opt.value === 'noise' && (
                            <div className="absolute inset-0 opacity-30" style={{ backgroundImage: 'url("data:image/svg+xml,%3Csvg viewBox=\'0 0 256 256\' xmlns=\'http://www.w3.org/2000/svg\'%3E%3Cfilter id=\'n\'%3E%3CfeTurbulence type=\'fractalNoise\' baseFrequency=\'0.9\' numOctaves=\'4\' stitchTiles=\'stitch\'/%3E%3C/filter%3E%3Crect width=\'100%25\' height=\'100%25\' filter=\'url(%23n)\' opacity=\'0.5\'/%3E%3C/svg%3E")' }} />
                          )}
                          {opt.value === 'aurora' && (
                            <div className="absolute inset-0">
                              <div className="absolute left-1 top-1 h-6 w-10 rounded-full bg-primary/15 blur-md" />
                              <div className="absolute bottom-1 right-2 h-5 w-8 rounded-full bg-[hsl(var(--gold))]/15 blur-md" />
                              <div className="absolute right-4 top-2 h-4 w-6 rounded-full bg-muted-foreground/10 blur-md" />
                            </div>
                          )}
                          {opt.value === 'none' && (
                            <div className="absolute inset-0 flex items-center justify-center">
                              <ImageOff className="h-4 w-4 text-muted-foreground/30" />
                            </div>
                          )}
                        </div>
                        <p className={optionLabel(preferences.themeBackground === opt.value)}>{opt.label}</p>
                        <p className="text-center text-[10px] leading-tight text-muted-foreground">{opt.desc}</p>
                      </button>
                    ))}
                  </div>
                </div>
              </Panel>

              {/* Accent colour */}
              <Panel>
                <PanelHeader label="Accent colour" />
                <div className="p-4">
                  <p className="mb-3 text-[13px] text-muted-foreground">Choose the primary accent colour used across the portal</p>
                  <div className="grid grid-cols-4 gap-3 sm:grid-cols-8">
                    {([
                      { value: 'neutral' as AccentColor, label: 'Neutral', hsl: 'hsl(0, 0%, 50%)' },
                      { value: 'blue' as AccentColor, label: 'Blue', hsl: 'hsl(217, 91%, 60%)' },
                      { value: 'violet' as AccentColor, label: 'Violet', hsl: 'hsl(263, 70%, 58%)' },
                      { value: 'rose' as AccentColor, label: 'Rose', hsl: 'hsl(346, 77%, 60%)' },
                      { value: 'amber' as AccentColor, label: 'Amber', hsl: 'hsl(38, 92%, 50%)' },
                      { value: 'emerald' as AccentColor, label: 'Emerald', hsl: 'hsl(160, 84%, 39%)' },
                      { value: 'cyan' as AccentColor, label: 'Cyan', hsl: 'hsl(189, 94%, 43%)' },
                      { value: 'orange' as AccentColor, label: 'Orange', hsl: 'hsl(25, 95%, 53%)' },
                    ]).map(opt => (
                      <button
                        key={opt.value}
                        onClick={() => {
                          updatePreference('accentColor', opt.value);
                          toast.success(`Accent colour set to ${opt.label.toLowerCase()}`);
                        }}
                        className={optionTile(preferences.accentColor === opt.value)}
                      >
                        <div
                          className={cn(
                            'h-8 w-8 rounded-full ring-offset-2 ring-offset-background transition-all duration-150',
                            preferences.accentColor === opt.value ? 'ring-2 ring-primary' : 'ring-0',
                          )}
                          style={{ backgroundColor: opt.hsl }}
                        />
                        <p className={cn('text-[10px] font-medium', preferences.accentColor === opt.value ? 'text-foreground' : 'text-muted-foreground')}>{opt.label}</p>
                      </button>
                    ))}
                  </div>
                </div>
              </Panel>
            </TabMotionGroup>
          </TabsContent>

          <TabsContent value="connections" className="mt-0">
            <TabMotionGroup tabKey="connections">
              <ConnectionsSettings />
            </TabMotionGroup>
          </TabsContent>

          </div>
        </Tabs>
      </div>
    </div>
  );
}
