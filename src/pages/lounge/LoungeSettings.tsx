import { useState, useEffect, useRef } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useSearchParams } from 'react-router-dom';
import { motion } from 'framer-motion';
import { 
  User, 
  Building2, 
  Phone, 
  Mail,
  Camera,
  Loader2,
  Check,
  X,
  Lock,
  Eye,
  EyeOff,
  KeyRound,
  Shield,
  Briefcase,
  Palette,
  List,
  LayoutGrid,
  Maximize2,
  Type,
  Sparkles,
  RotateCcw,
  Columns,
  Square,
  RectangleHorizontal,
  ToggleLeft,
  ToggleRight,
  Grip,
  SlidersHorizontal,
  PanelLeft,
  PanelTop,
  PanelRight,
  PanelBottom,
  Plug,
  ExternalLink,
  MessageSquare,
  Video,
  Globe,
  Zap,
  MousePointer2,
  Gauge,
  Monitor,
  Smartphone,
  Cpu,
  Paintbrush,
  Circle,
  Grid3X3,
  Waves,
  ImageOff,
  Layers,
  Timer,
  Image,
  Radio,
  MousePointer,
  Move3D,
  Volume2,
  ArrowRightLeft,
  EyeOff as EyeOffIcon,
  Database,
  Wifi,
  Download,
  Activity,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import SecuritySettings from '@/components/security/SecuritySettings';
import ConnectionsSettings from '@/components/lounge/ConnectionsSettings';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { IndustryCombobox } from '@/components/ui/IndustryCombobox';
import { useUIPreferences, type ThemeBackground, type AccentColor } from '@/hooks/useUIPreferences';
import { Switch } from '@/components/ui/switch';
import { LoungePageHeader } from '@/components/lounge/LoungePageHeader';
import { Settings, FolderOpen } from 'lucide-react';
import { FolderManagement } from '@/components/lounge/FolderManagement';
import { DeviceSettingsTab } from '@/components/lounge/DeviceSettingsTab';


interface UserProfile {
  full_name: string | null;
  company: string | null;
  phone: string | null;
  email: string | null;
  avatar_url: string | null;
  customer_id: string | null;
  industry: string | null;
}

const containerVariants = {
  visible: { transition: { staggerChildren: 0.05 } },
};

const itemVariants = {
  hidden: { opacity: 1, y: 0 },
  visible: { opacity: 1, y: 0 },
};

/** Simple wrapper – no opacity animation so tabs never flash blank */
function TabMotionGroup({ tabKey, children }: { tabKey: string; children: React.ReactNode }) {
  return (
    <div key={tabKey} className="space-y-6">
      {children}
    </div>
  );
}

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
      toast.error('Failed to load profile');
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

      toast.success('Profile updated successfully');
    } catch (error) {
      console.error('Error updating profile:', error);
      toast.error('Failed to update profile');
    } finally {
      setSaving(false);
    }
  };

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!newPassword || !confirmNewPassword) {
      toast.error('Please fill in all password fields');
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
        toast.success('Password updated successfully');
        setCurrentPassword('');
        setNewPassword('');
        setConfirmNewPassword('');
      }
    } catch (err) {
      toast.error('Failed to update password');
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
      toast.error('Please upload an image file');
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
      toast.success('Avatar updated successfully');
    } catch (error) {
      console.error('Error uploading avatar:', error);
      toast.error('Failed to upload avatar');
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
      toast.error('Failed to remove avatar');
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
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="px-4 sm:px-6 lg:px-8 py-6 sm:py-8 lg:py-10">
      <motion.div
        variants={containerVariants}
        initial="hidden"
        animate="visible"
        className="space-y-6 sm:space-y-8"
      >
        <LoungePageHeader
          title="Account Settings"
          description="Manage your profile information and security settings"
          icon={Settings}
        />

        {/* Tabs - vertical layout */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full flex flex-col lg:flex-row gap-6">
          <TabsList className="flex lg:flex-col lg:w-48 lg:h-auto lg:justify-start shrink-0 bg-muted/50 overflow-x-auto scrollbar-hide w-full">
            <TabsTrigger value="profile" className="gap-2 lg:w-full lg:justify-start shrink-0">
              <User className="h-4 w-4" />
              Profile
            </TabsTrigger>
            <TabsTrigger value="security" className="gap-2 lg:w-full lg:justify-start shrink-0">
              <Shield className="h-4 w-4" />
              Security
            </TabsTrigger>
            <TabsTrigger value="ui" className="gap-2 lg:w-full lg:justify-start shrink-0">
              <Palette className="h-4 w-4" />
              UI
            </TabsTrigger>
            <TabsTrigger value="theme" className="gap-2 lg:w-full lg:justify-start shrink-0">
              <Paintbrush className="h-4 w-4" />
              Theme
            </TabsTrigger>
            <TabsTrigger value="sidebar" className="gap-2 lg:w-full lg:justify-start shrink-0 hidden lg:flex">
              <FolderOpen className="h-4 w-4" />
              Sidebar
            </TabsTrigger>
            <TabsTrigger value="device" className="gap-2 lg:w-full lg:justify-start shrink-0">
              <Smartphone className="h-4 w-4" />
              Device
            </TabsTrigger>
            <TabsTrigger value="performance" className="gap-2 lg:w-full lg:justify-start shrink-0">
              <Gauge className="h-4 w-4" />
              Performance
            </TabsTrigger>

            <TabsTrigger value="connections" className="gap-2 lg:w-full lg:justify-start shrink-0">
              <Plug className="h-4 w-4" />
              <span className="hidden sm:inline">Connections</span>
              <span className="sm:hidden">Connect</span>
            </TabsTrigger>
          </TabsList>

          <div className="flex-1 min-w-0">

          <TabsContent value="security" className="mt-0">
            <TabMotionGroup tabKey="security">
              <motion.div variants={itemVariants}>
                <SecuritySettings />
              </motion.div>
            </TabMotionGroup>
          </TabsContent>

          <TabsContent value="ui" className="mt-0">
            <TabMotionGroup tabKey="ui">
            {/* Reset Button */}
            <motion.div variants={itemVariants} className="flex justify-end">
              <Button variant="ghost" size="sm" onClick={() => { resetPreferences(); toast.success('UI preferences reset to defaults'); }} className="gap-2 text-muted-foreground">
                <RotateCcw className="w-3.5 h-3.5" />
                Reset All
              </Button>
            </motion.div>


            {/* Sidebar Position - desktop only */}
            <motion.div variants={itemVariants} className="hidden lg:block">
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-base flex items-center gap-2"><PanelLeft className="w-4 h-4" /> Sidebar Position</CardTitle>
                  <CardDescription>Choose where the navigation sidebar appears</CardDescription>
                </CardHeader>
                <CardContent>
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
                        className={`flex flex-col items-center gap-2 p-3 rounded-xl border-2 transition-all duration-200 ${
                          preferences.sidebarPosition === opt.value
                            ? 'border-primary bg-primary/5 shadow-sm shadow-primary/10'
                            : 'border-border hover:border-muted-foreground/30 hover:bg-accent/30'
                        }`}
                      >
                        <opt.icon className={`w-6 h-6 ${preferences.sidebarPosition === opt.value ? 'text-primary' : 'text-muted-foreground'}`} />
                        <p className={`text-xs font-medium ${preferences.sidebarPosition === opt.value ? 'text-foreground' : 'text-muted-foreground'}`}>{opt.label}</p>
                      </button>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </motion.div>


            {/* Dashboard Density */}
            <motion.div variants={itemVariants}>
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-base flex items-center gap-2"><Grip className="w-4 h-4" /> Dashboard Density</CardTitle>
                  <CardDescription>Control the spacing and size of dashboard elements</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-3 gap-3">
                    {([
                      { value: 'compact' as const, label: 'Compact', desc: 'Dense layout' },
                      { value: 'comfortable' as const, label: 'Comfortable', desc: 'Balanced' },
                      { value: 'spacious' as const, label: 'Spacious', desc: 'Lots of space' },
                    ]).map(opt => (
                      <button
                        key={opt.value}
                        onClick={() => updatePreference('dashboardDensity', opt.value)}
                        className={`flex flex-col items-center gap-1.5 p-3 rounded-xl border-2 transition-all duration-200 ${
                          preferences.dashboardDensity === opt.value
                            ? 'border-primary bg-primary/5'
                            : 'border-border hover:border-muted-foreground/30'
                        }`}
                      >
                        <div className={`flex gap-0.5 ${opt.value === 'compact' ? 'gap-px' : opt.value === 'spacious' ? 'gap-1.5' : 'gap-1'}`}>
                          {[1,2,3].map(i => <div key={i} className={`rounded bg-muted-foreground/20 ${opt.value === 'compact' ? 'w-3 h-3' : opt.value === 'spacious' ? 'w-5 h-5' : 'w-4 h-4'}`} />)}
                        </div>
                        <p className={`text-xs font-medium ${preferences.dashboardDensity === opt.value ? 'text-foreground' : 'text-muted-foreground'}`}>{opt.label}</p>
                      </button>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </motion.div>




            {/* Card Style */}
            <motion.div variants={itemVariants}>
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-base flex items-center gap-2"><Square className="w-4 h-4" /> Card Style</CardTitle>
                  <CardDescription>Visual appearance of dashboard cards</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-3 gap-3">
                    {([
                      { value: 'bordered' as const, label: 'Bordered', cls: 'border-2 border-muted-foreground/20' },
                      { value: 'elevated' as const, label: 'Elevated', cls: 'shadow-md border-0' },
                      { value: 'flat' as const, label: 'Flat', cls: 'bg-muted/40 border-0' },
                    ]).map(opt => (
                      <button
                        key={opt.value}
                        onClick={() => updatePreference('cardStyle', opt.value)}
                        className={`flex flex-col items-center gap-2 p-3 rounded-xl border-2 transition-all duration-200 ${
                          preferences.cardStyle === opt.value
                            ? 'border-primary bg-primary/5'
                            : 'border-border hover:border-muted-foreground/30'
                        }`}
                      >
                        <div className={`w-12 h-8 rounded-md ${opt.cls}`} />
                        <p className={`text-xs font-medium ${preferences.cardStyle === opt.value ? 'text-foreground' : 'text-muted-foreground'}`}>{opt.label}</p>
                      </button>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </motion.div>

            {/* Card Radius */}
            <motion.div variants={itemVariants}>
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-base flex items-center gap-2"><RectangleHorizontal className="w-4 h-4" /> Card Corners</CardTitle>
                  <CardDescription>Border radius for dashboard cards</CardDescription>
                </CardHeader>
                <CardContent>
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
                        className={`flex flex-col items-center gap-2 p-3 rounded-xl border-2 transition-all duration-200 ${
                          preferences.cardRadius === opt.value
                            ? 'border-primary bg-primary/5'
                            : 'border-border hover:border-muted-foreground/30'
                        }`}
                      >
                        <div className={`w-10 h-7 border-2 border-muted-foreground/30 ${opt.r}`} />
                        <p className={`text-xs font-medium ${preferences.cardRadius === opt.value ? 'text-foreground' : 'text-muted-foreground'}`}>{opt.label}</p>
                      </button>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </motion.div>

            {/* Content Width */}



            {/* Font Size */}
            <motion.div variants={itemVariants}>
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-base flex items-center gap-2"><Type className="w-4 h-4" /> Font Size</CardTitle>
                  <CardDescription>Text size throughout the dashboard</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-3 gap-3">
                    {([
                      { value: 'small' as const, label: 'Small', size: 'text-xs' },
                      { value: 'medium' as const, label: 'Medium', size: 'text-sm' },
                      { value: 'large' as const, label: 'Large', size: 'text-base' },
                    ]).map(opt => (
                      <button
                        key={opt.value}
                        onClick={() => updatePreference('fontSize', opt.value)}
                        className={`flex flex-col items-center gap-2 p-3 rounded-xl border-2 transition-all duration-200 ${
                          preferences.fontSize === opt.value
                            ? 'border-primary bg-primary/5'
                            : 'border-border hover:border-muted-foreground/30'
                        }`}
                      >
                        <span className={`font-medium ${opt.size} ${preferences.fontSize === opt.value ? 'text-foreground' : 'text-muted-foreground'}`}>Aa</span>
                        <p className={`text-xs font-medium ${preferences.fontSize === opt.value ? 'text-foreground' : 'text-muted-foreground'}`}>{opt.label}</p>
                      </button>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </motion.div>

            {/* Toggle Widgets */}
            <motion.div variants={itemVariants}>
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-base flex items-center gap-2"><Sparkles className="w-4 h-4" /> Dashboard Widgets</CardTitle>
                  <CardDescription>Show or hide dashboard sections</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium">Floating Action Button</p>
                      <p className="text-xs text-muted-foreground">Quick shortcut button (bottom-right)</p>
                    </div>
                    <Switch
                      checked={preferences.showFAB}
                      onCheckedChange={(v) => updatePreference('showFAB', v)}
                    />
                  </div>
                </CardContent>
              </Card>
            </motion.div>

            {/* Animations */}
            <motion.div variants={itemVariants}>
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-base flex items-center gap-2"><Palette className="w-4 h-4" /> Animations</CardTitle>
                  <CardDescription>Control motion and transitions</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium">Enable Animations</p>
                      <p className="text-xs text-muted-foreground">Smooth transitions and motion effects</p>
                    </div>
                    <Switch
                      checked={preferences.animationsEnabled}
                      onCheckedChange={(v) => updatePreference('animationsEnabled', v)}
                    />
                  </div>
                </CardContent>
              </Card>
            </motion.div>

            {/* Cursor Style - desktop only */}
            <motion.div variants={itemVariants} className="hidden lg:block">
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-base flex items-center gap-2"><MousePointer2 className="w-4 h-4" /> Cursor Style</CardTitle>
                  <CardDescription>Choose your pointer style across the platform</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-3 gap-3">
                    {([
                      { value: 'dot' as const, label: 'Dot', desc: 'Minimal dot cursor' },
                      { value: 'enterprise' as const, label: 'Enterprise', desc: 'Precision crosshair' },
                      { value: 'default' as const, label: 'Standard', desc: 'System default' },
                    ]).map(opt => (
                      <button
                        key={opt.value}
                        onClick={() => updatePreference('cursorStyle', opt.value)}
                        className={`flex flex-col items-center gap-2 p-3 rounded-xl border-2 transition-all duration-200 ${
                          preferences.cursorStyle === opt.value
                            ? 'border-primary bg-primary/5'
                            : 'border-border hover:border-muted-foreground/30'
                        }`}
                      >
                        <div className="w-8 h-8 flex items-center justify-center">
                          {opt.value === 'dot' ? (
                            <div className="w-3 h-3 rounded-full bg-foreground/60" />
                          ) : opt.value === 'enterprise' ? (
                            <span className="text-lg" style={{ cursor: 'crosshair' }}>+</span>
                          ) : (
                            <MousePointer2 className="w-5 h-5 text-muted-foreground" />
                          )}
                        </div>
                        <p className={`text-xs font-medium ${preferences.cursorStyle === opt.value ? 'text-foreground' : 'text-muted-foreground'}`}>{opt.label}</p>
                        <p className="text-[10px] text-muted-foreground">{opt.desc}</p>
                      </button>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </motion.div>
            </TabMotionGroup>
          </TabsContent>

          <TabsContent value="device" className="mt-0">
            <TabMotionGroup tabKey="device">
              <DeviceSettingsTab />
            </TabMotionGroup>
          </TabsContent>

          <TabsContent value="performance" className="mt-0">
            <TabMotionGroup tabKey="performance">

              {/* Performance Presets */}
              <motion.div variants={itemVariants}>
                <Card>
                  <CardHeader className="pb-3">
                    <CardTitle className="text-base flex items-center gap-2"><Cpu className="w-4 h-4" /> Performance Presets</CardTitle>
                    <CardDescription>Quickly optimise for your device. Choose a preset or fine-tune individual settings below.</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-3 gap-3">
                      {([
                        {
                          key: 'low',
                          label: 'Low End',
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
                          label: 'High End',
                          icon: Cpu,
                          desc: 'Full experience',
                          detail: 'Everything enabled — blur, 3D, parallax, realtime',
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
                                toast.success('Low-end preset applied — maximum performance');
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
                                toast.success('Medium preset applied — balanced performance');
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
                                toast.success('High-end preset applied — full visual experience');
                              }
                            }}
                            className={`flex flex-col items-center gap-2 p-4 rounded-xl border-2 transition-all duration-200 ${
                              currentPreset === preset.key
                                ? 'border-primary bg-primary/5 shadow-sm shadow-primary/10'
                                : 'border-border hover:border-muted-foreground/30 hover:bg-accent/30'
                            }`}
                          >
                            <preset.icon className={`w-7 h-7 ${currentPreset === preset.key ? 'text-primary' : 'text-muted-foreground'}`} />
                            <p className={`text-sm font-semibold ${currentPreset === preset.key ? 'text-foreground' : 'text-muted-foreground'}`}>{preset.label}</p>
                            <p className={`text-xs ${currentPreset === preset.key ? 'text-foreground/70' : 'text-muted-foreground'}`}>{preset.desc}</p>
                            <p className="text-[10px] text-muted-foreground leading-tight text-center">{preset.detail}</p>
                          </button>
                        );
                      })}
                    </div>
                  </CardContent>
                </Card>
              </motion.div>

              {/* Rendering */}
              <motion.div variants={itemVariants}>
                <Card>
                  <CardHeader className="pb-3">
                    <CardTitle className="text-base flex items-center gap-2"><Layers className="w-4 h-4" /> Rendering</CardTitle>
                    <CardDescription>Controls that affect GPU usage and visual fidelity</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-5">
                    {/* Render Quality */}
                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-sm font-medium">Render Quality</p>
                          <p className="text-xs text-muted-foreground">Affects image resolution, blur radius, and shadow complexity</p>
                        </div>
                      </div>
                      <div className="flex gap-2">
                        {(['low', 'medium', 'high'] as const).map(q => (
                          <button
                            key={q}
                            onClick={() => updatePreference('renderQuality', q)}
                            className={`flex-1 px-3 py-2 rounded-lg border text-sm font-medium capitalize transition-all ${
                              preferences.renderQuality === q
                                ? 'border-primary bg-primary/10 text-primary'
                                : 'border-border text-muted-foreground hover:border-muted-foreground/40'
                            }`}
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
                          <p className="text-sm font-medium flex items-center gap-1.5"><Timer className="w-3.5 h-3.5" /> Frame Rate Limit</p>
                          <p className="text-xs text-muted-foreground">Cap animation frame rate to reduce CPU/GPU load</p>
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
                            className={`flex-1 px-3 py-2 rounded-lg border text-sm font-medium transition-all ${
                              preferences.maxFPS === opt.value
                                ? 'border-primary bg-primary/10 text-primary'
                                : 'border-border text-muted-foreground hover:border-muted-foreground/40'
                            }`}
                          >
                            {opt.label}
                          </button>
                        ))}
                      </div>
                    </div>

                    <div className="h-px bg-border" />

                    {([
                      { key: 'enableBlur' as const, label: 'Backdrop Blur', desc: 'Glass morphism effects — heavy on GPU', icon: Waves },
                      { key: 'enableShadows' as const, label: 'Complex Shadows', desc: 'Multi-layer box shadows on cards and modals', icon: Layers },
                      { key: 'enableGradients' as const, label: 'Gradient Effects', desc: 'Gradient overlays and accent washes', icon: Paintbrush },
                      { key: 'enable3DEffects' as const, label: '3D Transforms', desc: 'Perspective, rotateX/Y and depth effects', icon: Move3D },
                      { key: 'reduceTransparency' as const, label: 'Reduce Transparency', desc: 'Replace translucent panels with solid backgrounds', icon: EyeOffIcon, invert: true },
                    ] as const).map(item => (
                      <div key={item.key} className="flex items-center justify-between">
                        <div className="flex items-start gap-2.5">
                          <item.icon className="w-4 h-4 text-muted-foreground mt-0.5 shrink-0" />
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
                  </CardContent>
                </Card>
              </motion.div>

              {/* Animations & Interactions */}
              <motion.div variants={itemVariants}>
                <Card>
                  <CardHeader className="pb-3">
                    <CardTitle className="text-base flex items-center gap-2"><Activity className="w-4 h-4" /> Animations & Interactions</CardTitle>
                    <CardDescription>Motion, transitions, and interactive feedback</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-5">
                    {([
                      { key: 'animationsEnabled' as const, label: 'UI Animations', desc: 'Staggered reveals, scale effects, fade-ins across all pages', icon: Sparkles },
                      { key: 'enablePageTransitions' as const, label: 'Page Transitions', desc: 'Animated route changes between pages', icon: ArrowRightLeft },
                      { key: 'showWidgetAnimations' as const, label: 'Widget Entry Animations', desc: 'Dashboard widgets animate in on load', icon: LayoutGrid },
                      { key: 'enableHoverEffects' as const, label: 'Hover Effects', desc: 'Scale, glow, and lift effects on interactive elements', icon: MousePointer },
                      { key: 'enableParallax' as const, label: 'Parallax Scrolling', desc: 'Depth-based scroll effects on backgrounds', icon: Layers },
                      { key: 'enableSoundEffects' as const, label: 'Sound Effects', desc: 'Subtle UI sounds on interactions (clicks, notifications)', icon: Volume2 },
                    ] as const).map(item => (
                      <div key={item.key} className="flex items-center justify-between">
                        <div className="flex items-start gap-2.5">
                          <item.icon className="w-4 h-4 text-muted-foreground mt-0.5 shrink-0" />
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
                  </CardContent>
                </Card>
              </motion.div>

              {/* Visual Chrome */}
              <motion.div variants={itemVariants}>
                <Card>
                  <CardHeader className="pb-3">
                    <CardTitle className="text-base flex items-center gap-2"><Paintbrush className="w-4 h-4" /> Visual Chrome</CardTitle>
                    <CardDescription>Decorative elements that can be toggled for cleaner UI</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-5">
                    <div className="flex items-center justify-between">
                      <div className="flex items-start gap-2.5">
                        <ImageOff className="w-4 h-4 text-muted-foreground mt-0.5 shrink-0" />
                        <div>
                          <p className="text-sm font-medium">Background Effects</p>
                          <p className="text-xs text-muted-foreground">Orbs, grids, gradients, aurora — uses GPU</p>
                        </div>
                      </div>
                      <Switch
                        checked={preferences.themeBackground !== 'none'}
                        onCheckedChange={(v) => updatePreference('themeBackground', v ? 'orbs' : 'none')}
                      />
                    </div>
                    <div className="flex items-center justify-between">
                      <div className="flex items-start gap-2.5">
                        <MousePointer2 className="w-4 h-4 text-muted-foreground mt-0.5 shrink-0" />
                        <div>
                          <p className="text-sm font-medium">Custom Cursor</p>
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
                        <Zap className="w-4 h-4 text-muted-foreground mt-0.5 shrink-0" />
                        <div>
                          <p className="text-sm font-medium">Floating Action Button</p>
                          <p className="text-xs text-muted-foreground">Quick-access overlay button</p>
                        </div>
                      </div>
                      <Switch
                        checked={preferences.showFAB}
                        onCheckedChange={(v) => updatePreference('showFAB', v)}
                      />
                    </div>
                  </CardContent>
                </Card>
              </motion.div>

              {/* Data & Network */}
              <motion.div variants={itemVariants}>
                <Card>
                  <CardHeader className="pb-3">
                    <CardTitle className="text-base flex items-center gap-2"><Database className="w-4 h-4" /> Data & Network</CardTitle>
                    <CardDescription>Controls that affect bandwidth, memory, and background processing</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-5">
                    {([
                      { key: 'enableRealtime' as const, label: 'Realtime Updates', desc: 'Live data subscriptions — uses persistent connections', icon: Wifi },
                      { key: 'lazyLoadImages' as const, label: 'Lazy Load Images', desc: 'Only load images when they enter the viewport', icon: Image },
                      { key: 'prefetchPages' as const, label: 'Prefetch Pages', desc: 'Preload adjacent pages in the background for instant navigation', icon: Download },
                    ] as const).map(item => (
                      <div key={item.key} className="flex items-center justify-between">
                        <div className="flex items-start gap-2.5">
                          <item.icon className="w-4 h-4 text-muted-foreground mt-0.5 shrink-0" />
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
                  </CardContent>
                </Card>
              </motion.div>
            </TabMotionGroup>
          </TabsContent>

          <TabsContent value="profile" className="mt-0">
            <TabMotionGroup tabKey="profile">
        {/* Avatar Section */}
        <motion.div variants={itemVariants}>
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Profile Picture</CardTitle>
              <CardDescription>
                Click on the avatar to upload a new picture
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-6">
                <div className="relative group">
                  <Avatar 
                    className="h-24 w-24 cursor-pointer border-2 border-border hover:border-primary transition-colors"
                    onClick={handleAvatarClick}
                  >
                    <AvatarImage src={profile?.avatar_url || ''} alt={profile?.full_name || 'User'} />
                    <AvatarFallback className="text-2xl bg-primary/10 text-primary">
                      {getInitials()}
                    </AvatarFallback>
                  </Avatar>
                  
                  {/* Upload overlay */}
                  <div 
                    className="absolute inset-0 rounded-full bg-black/50 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer"
                    onClick={handleAvatarClick}
                  >
                    {uploadingAvatar ? (
                      <Loader2 className="w-6 h-6 text-white animate-spin" />
                    ) : (
                      <Camera className="w-6 h-6 text-white" />
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
                    onClick={handleAvatarClick}
                    disabled={uploadingAvatar}
                  >
                    {uploadingAvatar ? (
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    ) : (
                      <Camera className="w-4 h-4 mr-2" />
                    )}
                    Upload Photo
                  </Button>
                  {profile?.avatar_url && (
                    <Button 
                      variant="ghost" 
                      size="sm"
                      onClick={handleRemoveAvatar}
                      disabled={uploadingAvatar}
                      className="text-destructive hover:text-destructive hover:bg-destructive/10"
                    >
                      <X className="w-4 h-4 mr-2" />
                      Remove
                    </Button>
                  )}
                  <p className="text-xs text-muted-foreground">
                    JPG, PNG or GIF. Max 5MB.
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* Profile Information */}
        <motion.div variants={itemVariants}>
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Profile Information</CardTitle>
              <CardDescription>
                Update your personal and business details
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="fullName" className="flex items-center gap-2">
                  <User className="w-4 h-4" />
                  Full Name
                </Label>
                <Input
                  id="fullName"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  placeholder="Enter your full name"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="company" className="flex items-center gap-2">
                  <Building2 className="w-4 h-4" />
                  Company Name
                </Label>
                <Input
                  id="company"
                  value={company}
                  onChange={(e) => setCompany(e.target.value)}
                  placeholder="Enter your company name"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="phone" className="flex items-center gap-2">
                  <Phone className="w-4 h-4" />
                  Phone Number
                </Label>
                <Input
                  id="phone"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="Enter your phone number"
                />
              </div>

              <div className="space-y-2">
                <Label className="flex items-center gap-2">
                  <Briefcase className="w-4 h-4" />
                  Industry / Business Type
                </Label>
                <IndustryCombobox value={industry} onChange={setIndustry} />
                <p className="text-xs text-muted-foreground">
                  This personalises your AI assistant to your specific industry
                </p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="email" className="flex items-center gap-2 text-muted-foreground">
                  <Mail className="w-4 h-4" />
                  Email Address
                </Label>
                <Input
                  id="email"
                  value={user?.email || ''}
                  disabled
                  className="bg-muted"
                />
                <p className="text-xs text-muted-foreground">
                  Email cannot be changed. Contact support if you need to update it.
                </p>
              </div>

              <div className="pt-4">
                <Button 
                  onClick={handleSaveProfile}
                  disabled={saving}
                  className="w-full sm:w-auto"
                >
                  {saving ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Saving...
                    </>
                  ) : (
                    <>
                      <Check className="w-4 h-4 mr-2" />
                      Save Changes
                    </>
                  )}
                </Button>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* Change Password */}
        <motion.div variants={itemVariants}>
          <Card>
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <KeyRound className="w-5 h-5" />
                Change Password
              </CardTitle>
              <CardDescription>
                Update your account password
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleChangePassword} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="newPassword" className="flex items-center gap-2">
                    <Lock className="w-4 h-4" />
                    New Password
                  </Label>
                  <div className="relative">
                    <Input
                      id="newPassword"
                      type={showPasswords ? 'text' : 'password'}
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      placeholder="Enter new password"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPasswords(!showPasswords)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                    >
                      {showPasswords ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                  <p className="text-xs text-muted-foreground">Minimum 6 characters</p>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="confirmNewPassword" className="flex items-center gap-2">
                    <Lock className="w-4 h-4" />
                    Confirm New Password
                  </Label>
                  <Input
                    id="confirmNewPassword"
                    type={showPasswords ? 'text' : 'password'}
                    value={confirmNewPassword}
                    onChange={(e) => setConfirmNewPassword(e.target.value)}
                    placeholder="Confirm new password"
                  />
                </div>

                <Button 
                  type="submit"
                  disabled={changingPassword || !newPassword || !confirmNewPassword}
                  className="w-full sm:w-auto"
                >
                  {changingPassword ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Updating...
                    </>
                  ) : (
                    <>
                      <KeyRound className="w-4 h-4 mr-2" />
                      Update Password
                    </>
                  )}
                </Button>
              </form>
            </CardContent>
          </Card>
        </motion.div>

        {/* Account Info */}
        <motion.div variants={itemVariants}>
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Account Information</CardTitle>
              <CardDescription>
                Your account details and customer ID
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              {profile?.customer_id && (
                <div className="flex justify-between items-center py-2 border-b border-border/50">
                  <span className="text-sm text-muted-foreground">Customer ID</span>
                  <span className="font-mono text-sm">{profile.customer_id}</span>
                </div>
              )}
              <div className="flex justify-between items-center py-2 border-b border-border/50">
                <span className="text-sm text-muted-foreground">Account Email</span>
                <span className="text-sm">{user?.email}</span>
              </div>
              <div className="flex justify-between items-center py-2">
                <span className="text-sm text-muted-foreground">Member Since</span>
                <span className="text-sm">
                  {user?.created_at 
                    ? new Date(user.created_at).toLocaleDateString('en-US', { 
                        month: 'long', 
                        year: 'numeric' 
                      })
                    : '-'
                  }
                </span>
              </div>
            </CardContent>
          </Card>
        </motion.div>
            </TabMotionGroup>
          </TabsContent>

          <TabsContent value="sidebar" className="mt-0">
            <TabMotionGroup tabKey="sidebar">
              <motion.div variants={itemVariants}>
                <FolderManagement userId={user?.id} />
              </motion.div>
            </TabMotionGroup>
          </TabsContent>

          <TabsContent value="theme" className="mt-0">
            <TabMotionGroup tabKey="theme">
              {/* Background Pattern */}
              <motion.div variants={itemVariants}>
                <Card>
                  <CardHeader className="pb-3">
                    <CardTitle className="text-base flex items-center gap-2"><Waves className="w-4 h-4" /> Background Pattern</CardTitle>
                    <CardDescription>Choose the ambient background effect for the portal</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
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
                          className={`flex flex-col items-center gap-2 p-4 rounded-xl border-2 transition-all duration-200 ${
                            preferences.themeBackground === opt.value
                              ? 'border-primary bg-primary/5 shadow-sm shadow-primary/10'
                              : 'border-border hover:border-muted-foreground/30 hover:bg-accent/30'
                          }`}
                        >
                          <div className={`w-full h-12 rounded-lg border border-border/50 overflow-hidden relative ${opt.preview}`}>
                            {opt.value === 'grid' && (
                              <svg className="absolute inset-0 w-full h-full" xmlns="http://www.w3.org/2000/svg">
                                <defs><pattern id="grid-preview" width="10" height="10" patternUnits="userSpaceOnUse"><path d="M 10 0 L 0 0 0 10" fill="none" stroke="currentColor" strokeWidth="0.5" opacity="0.15" /></pattern></defs>
                                <rect width="100%" height="100%" fill="url(#grid-preview)" />
                              </svg>
                            )}
                            {opt.value === 'dots' && (
                              <svg className="absolute inset-0 w-full h-full" xmlns="http://www.w3.org/2000/svg">
                                <defs><pattern id="dots-preview" width="8" height="8" patternUnits="userSpaceOnUse"><circle cx="4" cy="4" r="0.8" fill="currentColor" opacity="0.15" /></pattern></defs>
                                <rect width="100%" height="100%" fill="url(#dots-preview)" />
                              </svg>
                            )}
                            {opt.value === 'orbs' && (
                              <div className="absolute inset-0 flex items-center justify-center">
                                <div className="w-8 h-8 rounded-full bg-muted-foreground/10 blur-sm" />
                                <div className="w-5 h-5 rounded-full bg-muted-foreground/8 blur-sm absolute top-1 right-2" />
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
                                <div className="absolute w-10 h-6 rounded-full bg-blue-500/15 blur-md top-1 left-1" />
                                <div className="absolute w-8 h-5 rounded-full bg-violet-500/15 blur-md bottom-1 right-2" />
                                <div className="absolute w-6 h-4 rounded-full bg-emerald-500/10 blur-md top-2 right-4" />
                              </div>
                            )}
                            {opt.value === 'none' && (
                              <div className="absolute inset-0 flex items-center justify-center">
                                <ImageOff className="w-4 h-4 text-muted-foreground/30" />
                              </div>
                            )}
                          </div>
                          <p className={`text-xs font-medium ${preferences.themeBackground === opt.value ? 'text-foreground' : 'text-muted-foreground'}`}>{opt.label}</p>
                          <p className="text-[10px] text-muted-foreground text-center leading-tight">{opt.desc}</p>
                        </button>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              </motion.div>

              {/* Accent Colour */}
              <motion.div variants={itemVariants}>
                <Card>
                  <CardHeader className="pb-3">
                    <CardTitle className="text-base flex items-center gap-2"><Circle className="w-4 h-4" /> Accent Colour</CardTitle>
                    <CardDescription>Choose the primary accent colour used across the portal</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-4 sm:grid-cols-8 gap-3">
                      {([
                        { value: 'neutral' as AccentColor, label: 'Neutral', hsl: 'hsl(0, 0%, 50%)', ring: 'ring-zinc-400' },
                        { value: 'blue' as AccentColor, label: 'Blue', hsl: 'hsl(217, 91%, 60%)', ring: 'ring-blue-500' },
                        { value: 'violet' as AccentColor, label: 'Violet', hsl: 'hsl(263, 70%, 58%)', ring: 'ring-violet-500' },
                        { value: 'rose' as AccentColor, label: 'Rose', hsl: 'hsl(346, 77%, 60%)', ring: 'ring-rose-500' },
                        { value: 'amber' as AccentColor, label: 'Amber', hsl: 'hsl(38, 92%, 50%)', ring: 'ring-amber-500' },
                        { value: 'emerald' as AccentColor, label: 'Emerald', hsl: 'hsl(160, 84%, 39%)', ring: 'ring-emerald-500' },
                        { value: 'cyan' as AccentColor, label: 'Cyan', hsl: 'hsl(189, 94%, 43%)', ring: 'ring-cyan-500' },
                        { value: 'orange' as AccentColor, label: 'Orange', hsl: 'hsl(25, 95%, 53%)', ring: 'ring-orange-500' },
                      ]).map(opt => (
                        <button
                          key={opt.value}
                          onClick={() => {
                            updatePreference('accentColor', opt.value);
                            toast.success(`Accent colour set to ${opt.label}`);
                          }}
                          className={`flex flex-col items-center gap-2 p-3 rounded-xl border-2 transition-all duration-200 ${
                            preferences.accentColor === opt.value
                              ? 'border-primary bg-primary/5 shadow-sm'
                              : 'border-border hover:border-muted-foreground/30 hover:bg-accent/30'
                          }`}
                        >
                          <div
                            className={`w-8 h-8 rounded-full ring-2 ring-offset-2 ring-offset-background transition-all ${preferences.accentColor === opt.value ? opt.ring : 'ring-transparent'}`}
                            style={{ backgroundColor: opt.hsl }}
                          />
                          <p className={`text-[10px] font-medium ${preferences.accentColor === opt.value ? 'text-foreground' : 'text-muted-foreground'}`}>{opt.label}</p>
                        </button>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            </TabMotionGroup>
          </TabsContent>

          <TabsContent value="connections" className="mt-0">
            <TabMotionGroup tabKey="connections">
              <motion.div variants={itemVariants}>
                <ConnectionsSettings />
              </motion.div>
            </TabMotionGroup>
          </TabsContent>

          </div>
        </Tabs>
      </motion.div>
    </div>
  );
}