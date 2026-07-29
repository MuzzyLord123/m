import { useState, useEffect, useCallback, useRef } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { SubscriptionPaywall } from '@/components/lounge/SubscriptionPaywall';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Switch } from '@/components/ui/switch';
import { toast } from 'sonner';
import {
  Palette, Upload, FileText, Save, CheckCircle2, Trash2, Users, X,
} from 'lucide-react';
import jsPDF from 'jspdf';
import {
  PageHeader, Panel, PanelHeader, StatusBadge, AvatarID,
  ConfirmDialog, EmptyState, FIELD_LABEL,
} from '@/components/platform';
import { cn } from '@/lib/utils';

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
  { id: 'executive_summary', label: 'Executive summary', description: 'High-level overview with key metrics' },
  { id: 'detailed_timeline', label: 'Detailed timeline', description: 'Full project timeline with milestones' },
  { id: 'milestone_tracker', label: 'Milestone tracker', description: 'Progress-focused milestone report' },
];

const TAB_TRIGGER =
  'relative -mb-px gap-1.5 rounded-none border-b-2 border-transparent bg-transparent px-3 py-2 text-[13px] text-muted-foreground shadow-none transition-colors duration-150 hover:text-foreground data-[state=active]:border-primary data-[state=active]:bg-transparent data-[state=active]:font-medium data-[state=active]:text-foreground data-[state=active]:shadow-none';

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

  return (
    <div className="mx-auto max-w-[1024px] space-y-5 px-5 py-7 lg:px-8">
      <PageHeader
        kicker="Branding"
        title="White label and branding"
        description="Your logo, brand identity and client-facing portal"
      />

      <Tabs defaultValue="logo" className="space-y-4">
        <div className="flex items-center gap-1 border-b border-border/60">
          <TabsList className="h-auto gap-1 rounded-none border-0 bg-transparent p-0">
            <TabsTrigger value="logo" className={TAB_TRIGGER}>Logo</TabsTrigger>
            <TabsTrigger value="branding" className={TAB_TRIGGER}>Brand colours</TabsTrigger>
            <TabsTrigger value="reports" className={TAB_TRIGGER}>Reports</TabsTrigger>
            <TabsTrigger value="templates" className={TAB_TRIGGER}>Templates</TabsTrigger>
          </TabsList>
        </div>

        {/* ── Logo Tab ────────────────────────────────── */}
        <TabsContent value="logo" className="mt-0 space-y-4">
          {/* Personal logo section */}
          <Panel as="div">
            <PanelHeader label="Personal logo" />
            <div className="space-y-4 p-4">
              <p className="text-xs text-muted-foreground">
                Upload your logo to replace the default Quooro branding across the platform.
              </p>
              {/* Upload zone */}
              <div
                onClick={() => personalInputRef.current?.click()}
                className="flex cursor-pointer flex-col items-center gap-3 rounded-[10px] border border-dashed border-border p-6 transition-colors duration-150 hover:border-primary/40"
              >
                <div className="flex h-20 w-20 items-center justify-center overflow-hidden rounded-[10px] bg-sunken">
                  {(previewUrl || personalLogo) ? (
                    <img src={previewUrl || personalLogo!} alt="Logo preview" className="h-full w-full object-contain" />
                  ) : (
                    <Upload className="h-6 w-6 text-muted-foreground" />
                  )}
                </div>
                <p className="text-xs text-muted-foreground">Click to upload · PNG, JPG, SVG, WEBP · max 2MB</p>
                <input
                  ref={personalInputRef}
                  type="file"
                  accept=".png,.jpg,.jpeg,.svg,.webp"
                  className="hidden"
                  onChange={handlePersonalFileSelect}
                />
              </div>

              {logoError && (
                <p className="flex items-center gap-2 text-xs text-risk" role="alert">
                  <X className="h-3.5 w-3.5 shrink-0" /> {logoError}
                </p>
              )}

              <div className="flex items-center gap-2">
                {pendingFile && (
                  <Button size="sm" onClick={savePersonalLogo} disabled={uploadingPersonal} className="h-8 gap-1.5 rounded-lg px-3 text-xs">
                    <Save className="h-3.5 w-3.5" />
                    {uploadingPersonal ? 'Saving' : 'Save logo'}
                  </Button>
                )}
                {personalLogo && (
                  <Button size="sm" variant="outline" onClick={removePersonalLogo} disabled={uploadingPersonal} className="h-8 gap-1.5 rounded-lg px-3 text-xs text-risk hover:text-risk">
                    <Trash2 className="h-3.5 w-3.5" /> Remove logo
                  </Button>
                )}
              </div>

              {/* Platform badge toggle */}
              <div className="flex items-center justify-between border-t border-border/60 pt-3">
                <div>
                  <Label className="text-xs font-medium">Hide the "Powered by Quooro" badge</Label>
                  <p className="mt-0.5 text-[11px] text-muted-foreground">Remove the platform badge from your portal</p>
                </div>
                <Switch checked={hidePlatformBadge} onCheckedChange={togglePlatformBadge} />
              </div>

              {(personalLogo || pendingFile) && (
                <p className="flex items-center gap-2 text-xs text-ok">
                  <CheckCircle2 className="h-3.5 w-3.5 shrink-0" />
                  Logo saved. Changes apply on your next login.
                </p>
              )}
            </div>
          </Panel>

          {/* Manager team section */}
          {isTeamOwner && (
            <>
              <Panel as="div">
                <PanelHeader label="Team default logo">
                  <StatusBadge tone="attend" label="Manager only" />
                </PanelHeader>
                <div className="space-y-4 p-4">
                  <p className="text-xs text-muted-foreground">
                    Set a default logo for your team. Members without a personal logo will inherit this.
                  </p>
                  <div
                    onClick={() => teamInputRef.current?.click()}
                    className="flex cursor-pointer flex-col items-center gap-3 rounded-[10px] border border-dashed border-border p-6 transition-colors duration-150 hover:border-primary/40"
                  >
                    <div className="flex h-20 w-20 items-center justify-center overflow-hidden rounded-[10px] bg-sunken">
                      {(teamPreviewUrl || teamLogo) ? (
                        <img src={teamPreviewUrl || teamLogo!} alt="Team logo preview" className="h-full w-full object-contain" />
                      ) : (
                        <Upload className="h-6 w-6 text-muted-foreground" />
                      )}
                    </div>
                    <p className="text-xs text-muted-foreground">Click to upload · PNG, JPG, SVG, WEBP · max 2MB</p>
                    <input
                      ref={teamInputRef}
                      type="file"
                      accept=".png,.jpg,.jpeg,.svg,.webp"
                      className="hidden"
                      onChange={handleTeamFileSelect}
                    />
                  </div>

                  {teamLogoError && (
                    <p className="flex items-center gap-2 text-xs text-risk" role="alert">
                      <X className="h-3.5 w-3.5 shrink-0" /> {teamLogoError}
                    </p>
                  )}

                  <div className="flex items-center gap-2">
                    {pendingTeamFile && (
                      <Button size="sm" onClick={saveTeamLogo} disabled={uploadingTeam} className="h-8 gap-1.5 rounded-lg px-3 text-xs">
                        <Save className="h-3.5 w-3.5" />
                        {uploadingTeam ? 'Saving' : 'Save team logo'}
                      </Button>
                    )}
                    {teamLogo && (
                      <Button size="sm" variant="outline" onClick={() => setDeleteTeamLogoOpen(true)} className="h-8 gap-1.5 rounded-lg px-3 text-xs text-risk hover:text-risk">
                        <Trash2 className="h-3.5 w-3.5" /> Remove team logo
                      </Button>
                    )}
                  </div>

                  {teamLogo && !pendingTeamFile && (
                    <p className="flex items-center gap-2 text-xs text-ok">
                      <CheckCircle2 className="h-3.5 w-3.5 shrink-0" />
                      Team logo saved. Members without a personal logo see it on their next login.
                    </p>
                  )}
                </div>
              </Panel>

              {/* Per-member override panel */}
              {teamMembers.length > 0 && (
                <Panel as="div">
                  <PanelHeader label="Push logo to members">
                    <StatusBadge tone="attend" label="Manager only" />
                  </PanelHeader>
                  <p className="px-4 pt-3 text-xs text-muted-foreground">
                    Override individual member logos with your team logo.
                  </p>
                  <div className="p-2">
                    {teamMembers.map(member => {
                      const isPushed = pushedMembers.has(member.user_id);
                      const memberLogoUrl = memberBranding[member.user_id];
                      return (
                        <div key={member.user_id} className="flex items-center justify-between gap-3 border-t border-border/60 px-2 py-2.5 first:border-t-0">
                          <div className="flex min-w-0 items-center gap-3">
                            {memberLogoUrl ? (
                              <img src={memberLogoUrl} alt="" className="h-8 w-8 rounded-lg bg-sunken object-contain" />
                            ) : (
                              <AvatarID name={member.full_name} email={member.email} size="lg" />
                            )}
                            <div className="min-w-0">
                              <p className="truncate text-[13px] font-[450] text-foreground">{member.full_name}</p>
                              <p className="truncate text-[11px] text-muted-foreground">{member.email}</p>
                            </div>
                          </div>
                          {isPushed ? (
                            <StatusBadge tone="ok" label="Applied" className="shrink-0" />
                          ) : (
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => pushLogoToMember(member.user_id)}
                              className="h-7 shrink-0 rounded-lg px-2.5 text-xs"
                            >
                              Push logo
                            </Button>
                          )}
                        </div>
                      );
                    })}
                  </div>
                  <div className="border-t border-border/60 p-3">
                    <Button
                      size="sm"
                      variant="outline"
                      className="h-8 w-full gap-1.5 rounded-lg text-xs"
                      onClick={pushLogoToAll}
                    >
                      <Users className="h-3.5 w-3.5" /> Push to all accounts
                    </Button>
                  </div>
                </Panel>
              )}
            </>
          )}
        </TabsContent>

        {/* ── Brand Colours Tab ────────────────────────── */}
        <TabsContent value="branding" className="mt-0 space-y-4">
          <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
            <Panel as="div">
              <PanelHeader label="Company details" />
              <div className="space-y-4 p-4">
                <div>
                  <Label className={FIELD_LABEL}>Company name</Label>
                  <Input value={settings.company_name} onChange={e => update('company_name', e.target.value)} placeholder="Your Company Ltd" className="mt-1" />
                </div>
                <div>
                  <Label className={FIELD_LABEL}>Custom domain</Label>
                  <Input value={settings.custom_domain} onChange={e => update('custom_domain', e.target.value)} placeholder="portal.yourbusiness.com" className="mt-1" />
                </div>
              </div>
            </Panel>

            <Panel as="div">
              <PanelHeader label="Brand colours" />
              <div className="space-y-4 p-4">
                {([['primary_color', 'Primary'], ['secondary_color', 'Secondary'], ['accent_color', 'Accent']] as const).map(([key, label]) => (
                  <div key={key} className="flex items-center gap-3">
                    <input type="color" value={settings[key]} onChange={e => update(key, e.target.value)} className="w-10 h-10 rounded-lg border border-border cursor-pointer" />
                    <div>
                      <Label className="text-xs">{label}</Label>
                      <p className="font-mono text-[11px] text-muted-foreground">{settings[key]}</p>
                    </div>
                  </div>
                ))}
              </div>
            </Panel>

            <Panel as="div" className="lg:col-span-2">
              <PanelHeader label="Brand preview" />
              <div className="p-4">
                <div className="overflow-hidden rounded-[10px] border border-border/60">
                  <div className="flex h-16 items-center gap-3 px-6" style={{ background: settings.primary_color }}>
                    {(personalLogo || teamLogo || settings.logo_url) ? (
                      <img src={personalLogo || teamLogo || settings.logo_url} alt="Logo" className="h-8 w-8 rounded object-cover" />
                    ) : (
                      <div className="flex h-8 w-8 items-center justify-center rounded bg-white/20 text-xs font-bold text-white">
                        {(settings.company_name || 'Co')[0]}
                      </div>
                    )}
                    <span className="font-semibold text-white">{settings.company_name || 'Your Company'}</span>
                  </div>
                  <div className="bg-background p-6">
                    <p className="text-[13px] text-muted-foreground">This is how your branded portal header will appear to clients.</p>
                    <div className="mt-3 flex gap-2">
                      <div className="h-3 w-20 rounded-full" style={{ background: settings.primary_color }} />
                      <div className="h-3 w-16 rounded-full" style={{ background: settings.secondary_color }} />
                      <div className="h-3 w-12 rounded-full" style={{ background: settings.accent_color }} />
                    </div>
                  </div>
                </div>
              </div>
            </Panel>
          </div>

          <Button onClick={handleSave} disabled={saving} className="h-8 gap-1.5 rounded-lg px-3 text-xs" size="sm">
            <Save className="h-3.5 w-3.5" />
            {saving ? 'Saving' : 'Save brand settings'}
          </Button>
        </TabsContent>

        {/* ── Reports Tab ──────────────────────────────── */}
        <TabsContent value="reports" className="mt-0 space-y-4">
          <p className="text-[13px] text-muted-foreground">Generate branded PDF reports for your projects.</p>
          <Panel as="div">
            <PanelHeader label="Projects" />
            {projects.length === 0 ? (
              <EmptyState
                compact
                title="No projects found"
                body="Create a project first, then generate a branded report from it."
              />
            ) : (
              projects.map(project => (
                <div key={project.id} className="flex items-center gap-3 border-t border-border/60 px-4 py-2.5 first:border-t-0">
                  <FileText className="h-4 w-4 shrink-0 text-muted-foreground" aria-hidden />
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-[13px] font-[450] text-foreground">{project.project_name}</p>
                    <StatusBadge status={project.status} className="mt-0.5" />
                  </div>
                  <Button size="sm" variant="outline" className="h-7 shrink-0 gap-1.5 rounded-lg px-2.5 text-xs" onClick={() => generateReport(project)} disabled={generatingPDF}>
                    {generatingPDF ? 'Generating' : 'Generate PDF'}
                  </Button>
                </div>
              ))
            )}
          </Panel>
        </TabsContent>

        {/* ── Templates Tab ────────────────────────────── */}
        <TabsContent value="templates" className="mt-0 space-y-4">
          <p className="text-[13px] text-muted-foreground">Choose a report layout for your branded reports.</p>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
            {REPORT_TEMPLATES.map(t => (
              <button
                key={t.id}
                type="button"
                onClick={() => update('report_template', t.id)}
                className={cn(
                  'rounded-[10px] border bg-card p-4 text-left transition-colors duration-150',
                  settings.report_template === t.id
                    ? 'border-primary'
                    : 'border-border/60 hover:border-primary/40',
                )}
              >
                <div className="flex items-center justify-between">
                  <p className="text-[13px] font-medium text-foreground">{t.label}</p>
                  {settings.report_template === t.id && <CheckCircle2 className="h-4 w-4 text-primary" />}
                </div>
                <p className="mt-1.5 text-xs text-muted-foreground">{t.description}</p>
              </button>
            ))}
          </div>
        </TabsContent>
      </Tabs>

      {/* Delete team logo confirmation dialog */}
      <ConfirmDialog
        open={deleteTeamLogoOpen}
        onOpenChange={setDeleteTeamLogoOpen}
        title="Remove team logo?"
        consequence="This removes the default logo from all accounts that inherit it. Members with a personal logo are not affected."
        confirmLabel="Remove logo"
        onConfirm={deleteTeamLogo}
      />
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
