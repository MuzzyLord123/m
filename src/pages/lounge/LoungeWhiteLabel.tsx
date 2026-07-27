import { useState, useEffect, useCallback, useRef } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { SubscriptionPaywall } from '@/components/lounge/SubscriptionPaywall';
import { LoungePageHeader } from '@/components/lounge/LoungePageHeader';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { toast } from 'sonner';
import { motion } from 'framer-motion';
import {
  Palette, Upload, Globe, FileText, Eye, Save, Loader2,
  Building2, Image, CheckCircle2, Trash2, Users, Shield, X,
} from 'lucide-react';
import jsPDF from 'jspdf';

const MAX_FILE_SIZE = 2 * 1024 * 1024; // 2MB
const ACCEPTED_TYPES = ['image/png', 'image/jpeg', 'image/svg+xml', 'image/webp'];

interface BrandSettings {
  logo_url: string;
  primary_color: string;
  secondary_color: string;
  accent_color: string;
  company_name: string;
  custom_domain: string;
  email_header_url: string;
  login_background_url: string;
  report_template: string;
}

const REPORT_TEMPLATES = [
  { id: 'executive_summary', label: 'Executive Summary', description: 'High-level overview with key metrics' },
  { id: 'detailed_timeline', label: 'Detailed Timeline', description: 'Full project timeline with milestones' },
  { id: 'milestone_tracker', label: 'Milestone Tracker', description: 'Progress-focused milestone report' },
];

function LoungeWhiteLabelInner() {
  const { user } = useAuth();
  const [settings, setSettings] = useState<BrandSettings>({
    logo_url: '', primary_color: '#3b82f6', secondary_color: '#6366f1',
    accent_color: '#8b5cf6', company_name: '', custom_domain: '',
    email_header_url: '', login_background_url: '', report_template: 'executive_summary',
  });
  const [saving, setSaving] = useState(false);
  const [loaded, setLoaded] = useState(false);
  const [projects, setProjects] = useState<any[]>([]);
  const [generatingPDF, setGeneratingPDF] = useState(false);

  // Logo system state
  const [personalLogo, setPersonalLogo] = useState<string | null>(null);
  const [hidePlatformBadge, setHidePlatformBadge] = useState(false);
  const [teamLogo, setTeamLogo] = useState<string | null>(null);
  const [isTeamOwner, setIsTeamOwner] = useState(false);
  const [teamMembers, setTeamMembers] = useState<any[]>([]);
  const [memberBranding, setMemberBranding] = useState<Record<string, string | null>>({});
  const [pushedMembers, setPushedMembers] = useState<Set<string>>(new Set());
  const [uploadingPersonal, setUploadingPersonal] = useState(false);
  const [uploadingTeam, setUploadingTeam] = useState(false);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [teamPreviewUrl, setTeamPreviewUrl] = useState<string | null>(null);
  const [pendingFile, setPendingFile] = useState<File | null>(null);
  const [pendingTeamFile, setPendingTeamFile] = useState<File | null>(null);
  const [deleteTeamLogoOpen, setDeleteTeamLogoOpen] = useState(false);
  const [logoError, setLogoError] = useState<string | null>(null);
  const [teamLogoError, setTeamLogoError] = useState<string | null>(null);
  const personalInputRef = useRef<HTMLInputElement>(null);
  const teamInputRef = useRef<HTMLInputElement>(null);

  const fetchSettings = useCallback(async () => {
    if (!user) return;
    const [brandRes, projectsRes] = await Promise.all([
      supabase.from('brand_settings').select('*').eq('user_id', user.id).maybeSingle(),
      supabase.from('app_projects').select('*').eq('user_id', user.id).limit(20),
    ]);
    if (brandRes.data) {
      const d = brandRes.data as any;
      setSettings({
        logo_url: d.logo_url || '',
        primary_color: d.primary_color || '#3b82f6',
        secondary_color: d.secondary_color || '#6366f1',
        accent_color: d.accent_color || '#8b5cf6',
        company_name: d.company_name || '',
        custom_domain: d.custom_domain || '',
        email_header_url: d.email_header_url || '',
        login_background_url: d.login_background_url || '',
        report_template: d.report_template || 'executive_summary',
      });
    }
    setProjects(projectsRes.data || []);
    setLoaded(true);
  }, [user]);

  const fetchLogoData = useCallback(async () => {
    if (!user) return;

    // Fetch personal branding
    const { data: ub } = await supabase
      .from('user_branding')
      .select('logo_url, hide_platform_badge')
      .eq('user_id', user.id)
      .maybeSingle();

    if (ub) {
      setPersonalLogo(ub.logo_url);
      setHidePlatformBadge(ub.hide_platform_badge ?? false);
    }

    // Check if user is a team owner
    const { data: team } = await supabase
      .from('client_teams')
      .select('id')
      .eq('primary_account_id', user.id)
      .maybeSingle();

    if (team) {
      setIsTeamOwner(true);

      // Fetch team branding
      const { data: tb } = await supabase
        .from('team_branding')
        .select('default_logo_url')
        .eq('manager_id', user.id)
        .maybeSingle();

      if (tb) setTeamLogo(tb.default_logo_url);

      // Fetch team members
      const { data: members } = await supabase
        .from('team_memberships')
        .select('user_id, display_name, member_role')
        .eq('team_id', team.id);

      if (members && members.length > 0) {
        // Get profiles for members
        const memberIds = members.map(m => m.user_id);
        const { data: profiles } = await supabase
          .from('profiles')
          .select('user_id, full_name, email, avatar_url')
          .in('user_id', memberIds);

        const enriched = members.map(m => {
          const profile = profiles?.find(p => p.user_id === m.user_id);
          return {
            ...m,
            full_name: m.display_name || profile?.full_name || 'Unknown',
            email: profile?.email || '',
            avatar_url: profile?.avatar_url,
          };
        });
        setTeamMembers(enriched);

        // Fetch branding for each member
        const { data: memberBrandingData } = await supabase
          .from('user_branding')
          .select('user_id, logo_url')
          .in('user_id', memberIds);

        const brandingMap: Record<string, string | null> = {};
        memberBrandingData?.forEach(mb => {
          brandingMap[mb.user_id] = mb.logo_url;
        });
        setMemberBranding(brandingMap);
      }
    }
  }, [user]);

  useEffect(() => { fetchSettings(); fetchLogoData(); }, [fetchSettings, fetchLogoData]);

  // --- Brand settings save ---
  const handleSave = async () => {
    if (!user) return;
    setSaving(true);
    try {
      const payload = { ...settings, user_id: user.id } as any;
      const { data: existing } = await supabase.from('brand_settings').select('id').eq('user_id', user.id).maybeSingle();
      if (existing) {
        await supabase.from('brand_settings').update(payload).eq('user_id', user.id);
      } else {
        await supabase.from('brand_settings').insert(payload);
      }
      toast.success('Brand settings saved');
    } catch {
      toast.error('Failed to save');
    } finally {
      setSaving(false);
    }
  };

  // --- File validation ---
  const validateFile = (file: File): string | null => {
    if (!ACCEPTED_TYPES.includes(file.type)) return 'Please upload a PNG, JPG, SVG, or WEBP image.';
    if (file.size > MAX_FILE_SIZE) return 'File too large. Please upload an image under 2MB.';
    return null;
  };

  // --- Personal logo upload ---
  const handlePersonalFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    setLogoError(null);
    const file = e.target.files?.[0];
    if (!file) return;
    const err = validateFile(file);
    if (err) { setLogoError(err); return; }
    setPendingFile(file);
    setPreviewUrl(URL.createObjectURL(file));
  };

  const savePersonalLogo = async () => {
    if (!user || !pendingFile) return;
    setUploadingPersonal(true);
    try {
      const ext = pendingFile.name.split('.').pop() || 'png';
      const path = `${user.id}/logo.${ext}`;

      const { error: uploadErr } = await supabase.storage
        .from('branding-assets')
        .upload(path, pendingFile, { upsert: true });

      if (uploadErr) throw uploadErr;

      const { data: urlData } = supabase.storage
        .from('branding-assets')
        .getPublicUrl(path);

      const logoUrl = urlData.publicUrl + '?t=' + Date.now();

      // Upsert user_branding
      const { data: existing } = await supabase
        .from('user_branding')
        .select('id')
        .eq('user_id', user.id)
        .maybeSingle();

      if (existing) {
        await supabase.from('user_branding').update({ logo_url: logoUrl }).eq('user_id', user.id);
      } else {
        await supabase.from('user_branding').insert({ user_id: user.id, logo_url: logoUrl, hide_platform_badge: hidePlatformBadge });
      }

      setPersonalLogo(logoUrl);
      setPendingFile(null);
      setPreviewUrl(null);
      toast.success('Logo saved — changes will apply on your next login.');
    } catch {
      toast.error('Upload failed. Please try again.');
    } finally {
      setUploadingPersonal(false);
    }
  };

  const removePersonalLogo = async () => {
    if (!user) return;
    setUploadingPersonal(true);
    try {
      await supabase.from('user_branding').update({ logo_url: null }).eq('user_id', user.id);
      setPersonalLogo(null);
      setPreviewUrl(null);
      setPendingFile(null);
      toast.success('Logo removed. Team default or Quooro logo will be used.');
    } catch {
      toast.error('Failed to remove logo.');
    } finally {
      setUploadingPersonal(false);
    }
  };

  const togglePlatformBadge = async (value: boolean) => {
    if (!user) return;
    setHidePlatformBadge(value);
    const { data: existing } = await supabase
      .from('user_branding')
      .select('id')
      .eq('user_id', user.id)
      .maybeSingle();

    if (existing) {
      await supabase.from('user_branding').update({ hide_platform_badge: value }).eq('user_id', user.id);
    } else {
      await supabase.from('user_branding').insert({ user_id: user.id, hide_platform_badge: value });
    }
    toast.success('Badge preference saved.');
  };

  // --- Team logo upload ---
  const handleTeamFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    setTeamLogoError(null);
    const file = e.target.files?.[0];
    if (!file) return;
    const err = validateFile(file);
    if (err) { setTeamLogoError(err); return; }
    setPendingTeamFile(file);
    setTeamPreviewUrl(URL.createObjectURL(file));
  };

  const saveTeamLogo = async () => {
    if (!user || !pendingTeamFile) return;
    setUploadingTeam(true);
    try {
      const ext = pendingTeamFile.name.split('.').pop() || 'png';
      const path = `${user.id}/team-logo.${ext}`;

      const { error: uploadErr } = await supabase.storage
        .from('branding-assets')
        .upload(path, pendingTeamFile, { upsert: true });

      if (uploadErr) throw uploadErr;

      const { data: urlData } = supabase.storage
        .from('branding-assets')
        .getPublicUrl(path);

      const logoUrl = urlData.publicUrl + '?t=' + Date.now();

      const { data: existing } = await supabase
        .from('team_branding')
        .select('id')
        .eq('manager_id', user.id)
        .maybeSingle();

      if (existing) {
        await supabase.from('team_branding').update({ default_logo_url: logoUrl }).eq('manager_id', user.id);
      } else {
        await supabase.from('team_branding').insert({ manager_id: user.id, default_logo_url: logoUrl });
      }

      setTeamLogo(logoUrl);
      setPendingTeamFile(null);
      setTeamPreviewUrl(null);
      toast.success('Team logo saved — members without a personal logo will see this on their next login.');
    } catch {
      toast.error('Upload failed. Please try again.');
    } finally {
      setUploadingTeam(false);
    }
  };

  const deleteTeamLogo = async () => {
    if (!user) return;
    await supabase.from('team_branding').update({ default_logo_url: null }).eq('manager_id', user.id);
    setTeamLogo(null);
    setDeleteTeamLogoOpen(false);
    toast.success('Team logo removed.');
  };

  // --- Push logo to member ---
  const pushLogoToMember = async (memberId: string) => {
    if (!teamLogo) {
      toast.error('Please upload a team logo first.');
      return;
    }

    const { data: existing } = await supabase
      .from('user_branding')
      .select('id')
      .eq('user_id', memberId)
      .maybeSingle();

    if (existing) {
      await supabase.from('user_branding').update({ logo_url: teamLogo }).eq('user_id', memberId);
    } else {
      await supabase.from('user_branding').insert({ user_id: memberId, logo_url: teamLogo });
    }

    setMemberBranding(prev => ({ ...prev, [memberId]: teamLogo }));
    setPushedMembers(prev => new Set(prev).add(memberId));
    toast.success('Logo pushed to member.');
  };

  const pushLogoToAll = async () => {
    if (!teamLogo) {
      toast.error('Please upload a team logo first.');
      return;
    }
    for (const member of teamMembers) {
      await pushLogoToMember(member.user_id);
    }
    toast.success('Logo pushed to all team members.');
  };

  // --- Report generation ---
  const generateReport = async (project: any) => {
    setGeneratingPDF(true);
    try {
      const doc = new jsPDF();
      const brandName = settings.company_name || 'Your Company';
      doc.setFillColor(settings.primary_color);
      doc.rect(0, 0, 210, 40, 'F');
      doc.setTextColor(255, 255, 255);
      doc.setFontSize(22);
      doc.text(brandName, 20, 25);
      doc.setFontSize(10);
      doc.text('Project Status Report', 20, 33);
      doc.setTextColor(30, 30, 30);
      doc.setFontSize(16);
      doc.text(project.project_name, 20, 55);
      doc.setFontSize(10);
      doc.setTextColor(100, 100, 100);
      doc.text(`Type: ${project.project_type || 'N/A'}`, 20, 63);
      doc.text(`Status: ${project.status}`, 20, 70);
      doc.text(`Created: ${new Date(project.created_at).toLocaleDateString()}`, 20, 77);
      if (project.description) {
        doc.setFontSize(12);
        doc.setTextColor(30, 30, 30);
        doc.text('Description', 20, 92);
        doc.setFontSize(10);
        doc.setTextColor(80, 80, 80);
        const lines = doc.splitTextToSize(project.description, 170);
        doc.text(lines, 20, 100);
      }
      doc.setFontSize(8);
      doc.setTextColor(160, 160, 160);
      doc.text(`Generated by ${brandName} · ${new Date().toLocaleDateString()}`, 20, 285);
      doc.save(`${project.project_name.replace(/\s+/g, '-')}-report.pdf`);
      toast.success('Report downloaded');
    } catch {
      toast.error('Failed to generate report');
    } finally {
      setGeneratingPDF(false);
    }
  };

  const update = (key: keyof BrandSettings, value: string) => setSettings(prev => ({ ...prev, [key]: value }));

  const getInitials = (name: string) => {
    const parts = name.trim().split(' ');
    return parts.length >= 2
      ? `${parts[0][0]}${parts[parts.length - 1][0]}`.toUpperCase()
      : name.substring(0, 2).toUpperCase();
  };

  return (
    <div className="p-4 md:p-6 lg:p-8 space-y-6">
      <LoungePageHeader
        title="White-label & branding"
        description="Customise your logo, brand identity, and client-facing portal"
      />

      <Tabs defaultValue="logo" className="space-y-4">
        <TabsList className="bg-muted/50">
          <TabsTrigger value="logo">Logo</TabsTrigger>
          <TabsTrigger value="branding">Brand colours</TabsTrigger>
          <TabsTrigger value="reports">Reports</TabsTrigger>
          <TabsTrigger value="templates">Templates</TabsTrigger>
        </TabsList>

        {/* ── Logo Tab ────────────────────────────────── */}
        <TabsContent value="logo" className="space-y-6">
          {/* Personal logo section */}
          <Card className="border-border/40">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm flex items-center gap-2">
                <Image className="w-4 h-4" /> Personal logo
              </CardTitle>
              <p className="text-xs text-muted-foreground">Upload your logo to replace the default Quooro branding across the platform.</p>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Upload zone */}
              <div
                onClick={() => personalInputRef.current?.click()}
                className="border-2 border-dashed border-border rounded-xl p-6 flex flex-col items-center gap-3 cursor-pointer hover:border-primary/40 transition-colors"
              >
                <div className="w-20 h-20 rounded-xl bg-muted flex items-center justify-center overflow-hidden">
                  {(previewUrl || personalLogo) ? (
                    <img src={previewUrl || personalLogo!} alt="Logo preview" className="w-full h-full object-contain" />
                  ) : (
                    <Upload className="w-6 h-6 text-muted-foreground" />
                  )}
                </div>
                <p className="text-xs text-muted-foreground">Click to upload · PNG, JPG, SVG, WEBP · Max 2MB</p>
                <input
                  ref={personalInputRef}
                  type="file"
                  accept=".png,.jpg,.jpeg,.svg,.webp"
                  className="hidden"
                  onChange={handlePersonalFileSelect}
                />
              </div>

              {logoError && (
                <div className="flex items-center gap-2 text-xs text-destructive bg-destructive/10 rounded-lg px-3 py-2">
                  <X className="w-3.5 h-3.5 shrink-0" /> {logoError}
                </div>
              )}

              <div className="flex items-center gap-2">
                {pendingFile && (
                  <Button size="sm" onClick={savePersonalLogo} disabled={uploadingPersonal} className="gap-1.5">
                    {uploadingPersonal ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Save className="w-3.5 h-3.5" />}
                    Save logo
                  </Button>
                )}
                {personalLogo && (
                  <Button size="sm" variant="outline" onClick={removePersonalLogo} disabled={uploadingPersonal} className="gap-1.5 text-destructive hover:text-destructive">
                    <Trash2 className="w-3.5 h-3.5" /> Remove logo
                  </Button>
                )}
              </div>

              {/* Platform badge toggle */}
              <div className="flex items-center justify-between pt-2 border-t border-border/40">
                <div>
                  <Label className="text-xs font-medium">Hide "Powered by Quooro" badge</Label>
                  <p className="text-[11px] text-muted-foreground mt-0.5">Remove the platform badge from your portal</p>
                </div>
                <Switch checked={hidePlatformBadge} onCheckedChange={togglePlatformBadge} />
              </div>

              {(personalLogo || pendingFile) && (
                <div className="flex items-center gap-2 text-xs text-emerald-600 bg-emerald-50 dark:bg-emerald-950/30 dark:text-emerald-400 rounded-lg px-3 py-2">
                  <CheckCircle2 className="w-3.5 h-3.5 shrink-0" />
                  Logo saved — changes will apply on your next login.
                </div>
              )}
            </CardContent>
          </Card>

          {/* Manager team section */}
          {isTeamOwner && (
            <>
              <div className="h-px bg-border/40" />

              <Card className="border-border/40">
                <CardHeader className="pb-3">
                  <div className="flex items-center gap-2">
                    <CardTitle className="text-sm flex items-center gap-2">
                      <Users className="w-4 h-4" /> Team default logo
                    </CardTitle>
                    <Badge variant="outline" className="text-[10px] text-amber-600 border-amber-300 bg-amber-50 dark:bg-amber-950/30 dark:text-amber-400 dark:border-amber-800">
                      <Shield className="w-3 h-3 mr-1" /> Manager only
                    </Badge>
                  </div>
                  <p className="text-xs text-muted-foreground">Set a default logo for your team. Members without a personal logo will inherit this.</p>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div
                    onClick={() => teamInputRef.current?.click()}
                    className="border-2 border-dashed border-border rounded-xl p-6 flex flex-col items-center gap-3 cursor-pointer hover:border-primary/40 transition-colors"
                  >
                    <div className="w-20 h-20 rounded-xl bg-muted flex items-center justify-center overflow-hidden">
                      {(teamPreviewUrl || teamLogo) ? (
                        <img src={teamPreviewUrl || teamLogo!} alt="Team logo preview" className="w-full h-full object-contain" />
                      ) : (
                        <Upload className="w-6 h-6 text-muted-foreground" />
                      )}
                    </div>
                    <p className="text-xs text-muted-foreground">Click to upload · PNG, JPG, SVG, WEBP · Max 2MB</p>
                    <input
                      ref={teamInputRef}
                      type="file"
                      accept=".png,.jpg,.jpeg,.svg,.webp"
                      className="hidden"
                      onChange={handleTeamFileSelect}
                    />
                  </div>

                  {teamLogoError && (
                    <div className="flex items-center gap-2 text-xs text-destructive bg-destructive/10 rounded-lg px-3 py-2">
                      <X className="w-3.5 h-3.5 shrink-0" /> {teamLogoError}
                    </div>
                  )}

                  <div className="flex items-center gap-2">
                    {pendingTeamFile && (
                      <Button size="sm" onClick={saveTeamLogo} disabled={uploadingTeam} className="gap-1.5">
                        {uploadingTeam ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Save className="w-3.5 h-3.5" />}
                        Save team logo
                      </Button>
                    )}
                    {teamLogo && (
                      <Button size="sm" variant="outline" onClick={() => setDeleteTeamLogoOpen(true)} className="gap-1.5 text-destructive hover:text-destructive">
                        <Trash2 className="w-3.5 h-3.5" /> Remove team logo
                      </Button>
                    )}
                  </div>

                  {teamLogo && !pendingTeamFile && (
                    <div className="flex items-center gap-2 text-xs text-emerald-600 bg-emerald-50 dark:bg-emerald-950/30 dark:text-emerald-400 rounded-lg px-3 py-2">
                      <CheckCircle2 className="w-3.5 h-3.5 shrink-0" />
                      Team logo saved — members without a personal logo will see this on their next login.
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Per-member override panel */}
              {teamMembers.length > 0 && (
                <Card className="border-border/40">
                  <CardHeader className="pb-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <CardTitle className="text-sm">Push logo to members</CardTitle>
                        <Badge variant="outline" className="text-[10px] text-amber-600 border-amber-300 bg-amber-50 dark:bg-amber-950/30 dark:text-amber-400 dark:border-amber-800">
                          <Shield className="w-3 h-3 mr-1" /> Manager only
                        </Badge>
                      </div>
                    </div>
                    <p className="text-xs text-muted-foreground">Override individual member logos with your team logo.</p>
                  </CardHeader>
                  <CardContent className="space-y-2">
                    {teamMembers.map(member => {
                      const isPushed = pushedMembers.has(member.user_id);
                      const memberLogoUrl = memberBranding[member.user_id];
                      return (
                        <div key={member.user_id} className="flex items-center justify-between p-3 rounded-xl border border-border/40 bg-card">
                          <div className="flex items-center gap-3">
                            {memberLogoUrl ? (
                              <img src={memberLogoUrl} alt="" className="w-8 h-8 rounded-lg object-contain bg-muted" />
                            ) : (
                              <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center text-xs font-bold text-primary">
                                {getInitials(member.full_name)}
                              </div>
                            )}
                            <div>
                              <p className="text-sm font-medium">{member.full_name}</p>
                              <p className="text-[11px] text-muted-foreground">{member.email}</p>
                            </div>
                          </div>
                          <Button
                            size="sm"
                            variant={isPushed ? 'ghost' : 'outline'}
                            onClick={() => pushLogoToMember(member.user_id)}
                            disabled={isPushed}
                            className={isPushed ? 'text-emerald-600 gap-1.5' : 'gap-1.5'}
                          >
                            {isPushed ? (
                              <><CheckCircle2 className="w-3.5 h-3.5" /> Applied</>
                            ) : (
                              'Push logo'
                            )}
                          </Button>
                        </div>
                      );
                    })}

                    <Button
                      size="sm"
                      variant="outline"
                      className="w-full mt-2 gap-1.5"
                      onClick={pushLogoToAll}
                    >
                      <Users className="w-3.5 h-3.5" /> Push to all accounts
                    </Button>
                  </CardContent>
                </Card>
              )}
            </>
          )}
        </TabsContent>

        {/* ── Brand Colours Tab ────────────────────────── */}
        <TabsContent value="branding" className="space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card className="border-border/40">
              <CardHeader className="pb-3">
                <CardTitle className="text-sm flex items-center gap-2">
                  <Building2 className="w-4 h-4" /> Company details
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label className="text-xs">Company name</Label>
                  <Input value={settings.company_name} onChange={e => update('company_name', e.target.value)} placeholder="Your Company Ltd" className="mt-1" />
                </div>
                <div>
                  <Label className="text-xs">Custom domain</Label>
                  <Input value={settings.custom_domain} onChange={e => update('custom_domain', e.target.value)} placeholder="portal.yourbusiness.com" className="mt-1" />
                </div>
              </CardContent>
            </Card>

            <Card className="border-border/40">
              <CardHeader className="pb-3">
                <CardTitle className="text-sm flex items-center gap-2">
                  <Palette className="w-4 h-4" /> Brand colours
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {([['primary_color', 'Primary'], ['secondary_color', 'Secondary'], ['accent_color', 'Accent']] as const).map(([key, label]) => (
                  <div key={key} className="flex items-center gap-3">
                    <input type="color" value={settings[key]} onChange={e => update(key, e.target.value)} className="w-10 h-10 rounded-lg border border-border cursor-pointer" />
                    <div>
                      <Label className="text-xs">{label}</Label>
                      <p className="text-[11px] text-muted-foreground">{settings[key]}</p>
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>

            <Card className="border-border/40 lg:col-span-2">
              <CardHeader className="pb-3">
                <CardTitle className="text-sm flex items-center gap-2">
                  <Eye className="w-4 h-4" /> Brand preview
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="rounded-xl border border-border/30 overflow-hidden">
                  <div className="h-16 flex items-center px-6 gap-3" style={{ background: settings.primary_color }}>
                    {(personalLogo || teamLogo || settings.logo_url) ? (
                      <img src={personalLogo || teamLogo || settings.logo_url} alt="Logo" className="h-8 w-8 rounded object-cover" />
                    ) : (
                      <div className="h-8 w-8 rounded bg-white/20 flex items-center justify-center text-white text-xs font-bold">
                        {(settings.company_name || 'Co')[0]}
                      </div>
                    )}
                    <span className="text-white font-semibold">{settings.company_name || 'Your Company'}</span>
                  </div>
                  <div className="p-6 bg-background">
                    <p className="text-sm text-muted-foreground">This is how your branded portal header will appear to clients.</p>
                    <div className="flex gap-2 mt-3">
                      <div className="h-3 w-20 rounded-full" style={{ background: settings.primary_color }} />
                      <div className="h-3 w-16 rounded-full" style={{ background: settings.secondary_color }} />
                      <div className="h-3 w-12 rounded-full" style={{ background: settings.accent_color }} />
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          <Button onClick={handleSave} disabled={saving} className="gap-2">
            {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
            Save brand settings
          </Button>
        </TabsContent>

        {/* ── Reports Tab ──────────────────────────────── */}
        <TabsContent value="reports" className="space-y-4">
          <p className="text-sm text-muted-foreground">Generate branded PDF reports for your projects.</p>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {projects.map(project => (
              <Card key={project.id} className="border-border/40">
                <CardContent className="p-4 space-y-3">
                  <div className="flex items-start justify-between">
                    <div>
                      <p className="font-medium text-sm">{project.project_name}</p>
                      <Badge variant="outline" className="text-[10px] mt-1">{project.status}</Badge>
                    </div>
                    <FileText className="w-4 h-4 text-muted-foreground" />
                  </div>
                  <Button size="sm" variant="outline" className="w-full gap-1" onClick={() => generateReport(project)} disabled={generatingPDF}>
                    {generatingPDF ? <Loader2 className="w-3 h-3 animate-spin" /> : <FileText className="w-3 h-3" />}
                    Generate PDF
                  </Button>
                </CardContent>
              </Card>
            ))}
            {projects.length === 0 && (
              <p className="text-sm text-muted-foreground col-span-3 text-center py-8">No projects found. Create a project first.</p>
            )}
          </div>
        </TabsContent>

        {/* ── Templates Tab ────────────────────────────── */}
        <TabsContent value="templates" className="space-y-4">
          <p className="text-sm text-muted-foreground">Choose a report layout template for your branded reports.</p>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            {REPORT_TEMPLATES.map(t => (
              <Card
                key={t.id}
                className={`border-border/40 cursor-pointer transition-all ${settings.report_template === t.id ? 'ring-2 ring-primary border-primary/50' : 'hover:border-border'}`}
                onClick={() => update('report_template', t.id)}
              >
                <CardContent className="p-4 space-y-2">
                  <div className="flex items-center justify-between">
                    <p className="font-medium text-sm">{t.label}</p>
                    {settings.report_template === t.id && <CheckCircle2 className="w-4 h-4 text-primary" />}
                  </div>
                  <p className="text-xs text-muted-foreground">{t.description}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>
      </Tabs>

      {/* Delete team logo confirmation dialog */}
      <Dialog open={deleteTeamLogoOpen} onOpenChange={setDeleteTeamLogoOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Remove team logo?</DialogTitle>
          </DialogHeader>
          <p className="text-sm text-muted-foreground">
            This will remove the default logo from all accounts that inherit it. Members with a personal logo will not be affected.
          </p>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteTeamLogoOpen(false)}>Cancel</Button>
            <Button variant="destructive" onClick={deleteTeamLogo}>Remove</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

export default function LoungeWhiteLabel() {
  return (
    <SubscriptionPaywall
      featureKey="white-label"
      featureDescription="Custom branding, white-labelled client portals, and branded PDF project reports."
      icon={Palette}
    >
      <LoungeWhiteLabelInner />
    </SubscriptionPaywall>
  );
}
