import { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import {
  ArrowLeft, Globe, Image, Search, Code2, BarChart3, Shield, Trash2,
  Save, Loader2, Check, ExternalLink, Upload, X
} from 'lucide-react';
import { motion } from 'framer-motion';

interface SiteSettings {
  favicon_url: string;
  og_image_url: string;
  site_title: string;
  site_description: string;
  site_keywords: string;
  robots_index: boolean;
  robots_follow: boolean;
  canonical_base_url: string;
  custom_domain: string;
  google_analytics_id: string;
  meta_pixel_id: string;
  custom_head_code: string;
  custom_body_code: string;
  social_twitter: string;
  social_facebook: string;
  social_instagram: string;
  social_linkedin: string;
}

const defaultSettings: SiteSettings = {
  favicon_url: '',
  og_image_url: '',
  site_title: '',
  site_description: '',
  site_keywords: '',
  robots_index: true,
  robots_follow: true,
  canonical_base_url: '',
  custom_domain: '',
  google_analytics_id: '',
  meta_pixel_id: '',
  custom_head_code: '',
  custom_body_code: '',
  social_twitter: '',
  social_facebook: '',
  social_instagram: '',
  social_linkedin: '',
};

type SettingsSection = 'general' | 'seo' | 'analytics' | 'code' | 'social' | 'danger';

const sections: { key: SettingsSection; label: string; icon: typeof Globe }[] = [
  { key: 'general', label: 'General', icon: Globe },
  { key: 'seo', label: 'SEO & Meta', icon: Search },
  { key: 'analytics', label: 'Analytics', icon: BarChart3 },
  { key: 'code', label: 'Custom Code', icon: Code2 },
  { key: 'social', label: 'Social Links', icon: ExternalLink },
  { key: 'danger', label: 'Danger Zone', icon: Shield },
];

export default function SiteSettingsPage() {
  const { siteId } = useParams<{ siteId: string }>();
  const navigate = useNavigate();
  const [siteName, setSiteName] = useState('');
  const [originalName, setOriginalName] = useState('');
  const [settings, setSettings] = useState<SiteSettings>(defaultSettings);
  const [activeSection, setActiveSection] = useState<SettingsSection>('general');
  const [saving, setSaving] = useState(false);
  const [loading, setLoading] = useState(true);
  const [uploadingFavicon, setUploadingFavicon] = useState(false);
  const [uploadingOg, setUploadingOg] = useState(false);

  useEffect(() => {
    if (!siteId) return;
    (async () => {
      const { data } = await supabase
        .from('designer_sites')
        .select('site_name, settings')
        .eq('id', siteId)
        .single();
      if (data) {
        setSiteName(data.site_name || '');
        setOriginalName(data.site_name || '');
        const stored = (data.settings as any) || {};
        setSettings({ ...defaultSettings, ...stored });
      }
      setLoading(false);
    })();
  }, [siteId]);

  const updateSetting = <K extends keyof SiteSettings>(key: K, value: SiteSettings[K]) => {
    setSettings(prev => ({ ...prev, [key]: value }));
  };

  const handleSave = useCallback(async () => {
    if (!siteId) return;
    setSaving(true);
    try {
      const { error } = await supabase
        .from('designer_sites')
        .update({
          site_name: siteName,
          settings: settings as any,
          updated_at: new Date().toISOString(),
        })
        .eq('id', siteId);
      if (error) throw error;
      setOriginalName(siteName);
      toast.success('Site settings saved');
    } catch {
      toast.error('Failed to save settings');
    }
    setSaving(false);
  }, [siteId, siteName, settings]);

  const handleFileUpload = async (file: File, type: 'favicon' | 'og') => {
    if (!siteId) return;
    const setter = type === 'favicon' ? setUploadingFavicon : setUploadingOg;
    setter(true);
    try {
      const ext = file.name.split('.').pop() || 'png';
      const path = `${siteId}/${type}-${Date.now()}.${ext}`;
      const { error: uploadErr } = await supabase.storage
        .from('designer-uploads')
        .upload(path, file, { upsert: true });
      if (uploadErr) throw uploadErr;
      const { data: urlData } = supabase.storage.from('designer-uploads').getPublicUrl(path);
      const key = type === 'favicon' ? 'favicon_url' : 'og_image_url';
      updateSetting(key, urlData.publicUrl);
      toast.success(`${type === 'favicon' ? 'Favicon' : 'OG image'} uploaded`);
    } catch {
      toast.error('Upload failed');
    }
    setter(false);
  };

  const handleDeleteSite = async () => {
    if (!siteId) return;
    if (!window.confirm(`Delete "${siteName}" permanently? This cannot be undone.`)) return;
    const { error } = await supabase.from('designer_sites').delete().eq('id', siteId);
    if (error) {
      toast.error('Failed to delete site');
    } else {
      toast.success('Site deleted');
      navigate('/lounge/website-designer');
    }
  };

  if (loading) {
    return (
      <div className="h-screen flex items-center justify-center" style={{ backgroundColor: '#0a0a0a' }}>
        <Loader2 className="h-6 w-6 animate-spin" style={{ color: '#555' }} />
      </div>
    );
  }

  return (
    <div className="h-screen flex" style={{ backgroundColor: '#0a0a0a', color: '#e0e0e0' }}>
      {/* Sidebar */}
      <div className="w-[260px] shrink-0 flex flex-col border-r" style={{ borderColor: '#1a1a1a', backgroundColor: '#0f0f0f' }}>
        {/* Back to editor */}
        <div className="p-4 pb-2">
          <button
            onClick={() => navigate(`/lounge/editor/${siteId}`)}
            className="flex items-center gap-2 text-[12px] font-medium hover:text-white transition-colors mb-4"
            style={{ color: '#888' }}
          >
            <ArrowLeft className="h-3.5 w-3.5" />
            Back to Editor
          </button>
          <h1 className="text-[15px] font-semibold text-white truncate">{originalName || 'Site Settings'}</h1>
          <p className="text-[11px] mt-0.5" style={{ color: '#666' }}>Site Configuration</p>
        </div>

        {/* Nav */}
        <nav className="flex-1 px-2 py-2 space-y-0.5">
          {sections.map(s => {
            const Icon = s.icon;
            const active = activeSection === s.key;
            return (
              <button
                key={s.key}
                onClick={() => setActiveSection(s.key)}
                className="w-full flex items-center gap-2.5 h-9 px-3 rounded-lg text-[12px] font-medium transition-all"
                style={{
                  backgroundColor: active ? '#1a1a1a' : 'transparent',
                  color: active ? '#fff' : '#888',
                  border: active ? '1px solid #252525' : '1px solid transparent',
                }}
              >
                <Icon className="h-3.5 w-3.5" style={{ color: active ? '#0073E6' : '#666' }} />
                {s.label}
              </button>
            );
          })}
        </nav>

        {/* Save button */}
        <div className="p-3 border-t" style={{ borderColor: '#1a1a1a' }}>
          <button
            onClick={handleSave}
            disabled={saving}
            className="w-full h-9 flex items-center justify-center gap-2 rounded-lg text-[12px] font-semibold text-white transition-all hover:brightness-110 disabled:opacity-60"
            style={{ background: 'linear-gradient(135deg, #0073E6, #005bb5)', boxShadow: '0 2px 12px rgba(0,115,230,0.3)' }}
          >
            {saving ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Save className="h-3.5 w-3.5" />}
            {saving ? 'Saving…' : 'Save Changes'}
          </button>
        </div>
      </div>

      {/* Main content */}
      <div className="flex-1 overflow-y-auto">
        <div className="max-w-[640px] mx-auto py-10 px-8">
          <motion.div key={activeSection} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.15 }}>
            {activeSection === 'general' && (
              <SettingsPanel title="General" description="Basic site information and branding.">
                <Field label="Site Name" value={siteName} onChange={setSiteName} placeholder="My Website" />
                <Field label="Site Description" value={settings.site_description} onChange={v => updateSetting('site_description', v)} placeholder="A brief description of your site" multiline />
                <Field label="Custom Domain" value={settings.custom_domain} onChange={v => updateSetting('custom_domain', v)} placeholder="www.example.com" hint="Point your domain's A record to deploy" />

                {/* Favicon */}
                <div className="space-y-2">
                  <label className="text-[11px] font-semibold uppercase tracking-wider" style={{ color: '#888' }}>Favicon</label>
                  <div className="flex items-center gap-3">
                    {settings.favicon_url ? (
                      <div className="relative w-12 h-12 rounded-lg overflow-hidden border flex items-center justify-center" style={{ borderColor: '#333', backgroundColor: '#1a1a1a' }}>
                        <img src={settings.favicon_url} alt="Favicon" className="w-8 h-8 object-contain" />
                        <button onClick={() => updateSetting('favicon_url', '')} className="absolute -top-1 -right-1 w-4 h-4 rounded-full flex items-center justify-center" style={{ backgroundColor: '#dc2626' }}>
                          <X className="h-2.5 w-2.5 text-white" />
                        </button>
                      </div>
                    ) : (
                      <div className="w-12 h-12 rounded-lg border-2 border-dashed flex items-center justify-center" style={{ borderColor: '#333' }}>
                        <Image className="h-4 w-4" style={{ color: '#555' }} />
                      </div>
                    )}
                    <div>
                      <label className="cursor-pointer">
                        <input
                          type="file"
                          accept="image/*,.ico,.svg"
                          className="hidden"
                          onChange={e => { if (e.target.files?.[0]) handleFileUpload(e.target.files[0], 'favicon'); }}
                        />
                        <span className="inline-flex items-center gap-1.5 h-7 px-3 rounded-md text-[11px] font-medium transition-colors hover:bg-[#333]" style={{ backgroundColor: '#252525', color: '#ccc', border: '1px solid #333' }}>
                          {uploadingFavicon ? <Loader2 className="h-3 w-3 animate-spin" /> : <Upload className="h-3 w-3" />}
                          Upload
                        </span>
                      </label>
                      <Field label="" value={settings.favicon_url} onChange={v => updateSetting('favicon_url', v)} placeholder="Or paste favicon URL" compact />
                    </div>
                  </div>
                </div>

                {/* OG Image */}
                <div className="space-y-2">
                  <label className="text-[11px] font-semibold uppercase tracking-wider" style={{ color: '#888' }}>Default OG Image</label>
                  {settings.og_image_url ? (
                    <div className="relative rounded-lg overflow-hidden border" style={{ borderColor: '#333' }}>
                      <img src={settings.og_image_url} alt="OG" className="w-full h-32 object-cover" />
                      <button onClick={() => updateSetting('og_image_url', '')} className="absolute top-2 right-2 w-5 h-5 rounded-full flex items-center justify-center" style={{ backgroundColor: 'rgba(0,0,0,0.7)' }}>
                        <X className="h-3 w-3 text-white" />
                      </button>
                    </div>
                  ) : null}
                  <div className="flex items-center gap-2">
                    <label className="cursor-pointer">
                      <input
                        type="file"
                        accept="image/*"
                        className="hidden"
                        onChange={e => { if (e.target.files?.[0]) handleFileUpload(e.target.files[0], 'og'); }}
                      />
                      <span className="inline-flex items-center gap-1.5 h-7 px-3 rounded-md text-[11px] font-medium transition-colors hover:bg-[#333]" style={{ backgroundColor: '#252525', color: '#ccc', border: '1px solid #333' }}>
                        {uploadingOg ? <Loader2 className="h-3 w-3 animate-spin" /> : <Upload className="h-3 w-3" />}
                        Upload OG Image
                      </span>
                    </label>
                  </div>
                  <Field label="" value={settings.og_image_url} onChange={v => updateSetting('og_image_url', v)} placeholder="Or paste image URL" compact />
                </div>
              </SettingsPanel>
            )}

            {activeSection === 'seo' && (
              <SettingsPanel title="SEO & Meta" description="Search engine optimisation defaults applied to all pages.">
                <Field label="Default Page Title" value={settings.site_title} onChange={v => updateSetting('site_title', v)} placeholder="My Website — Tagline" hint="Fallback <title> when a page doesn't set one" />
                <Field label="Meta Description" value={settings.site_description} onChange={v => updateSetting('site_description', v)} placeholder="Brief description for search engines" multiline />
                <Field label="Keywords" value={settings.site_keywords} onChange={v => updateSetting('site_keywords', v)} placeholder="web design, agency, creative" hint="Comma-separated" />
                <Field label="Canonical Base URL" value={settings.canonical_base_url} onChange={v => updateSetting('canonical_base_url', v)} placeholder="https://www.example.com" />

                <div className="space-y-2 pt-2">
                  <label className="text-[11px] font-semibold uppercase tracking-wider" style={{ color: '#888' }}>Indexing</label>
                  <div className="flex items-center gap-4">
                    <Toggle label="Allow search engines to index" checked={settings.robots_index} onChange={v => updateSetting('robots_index', v)} />
                    <Toggle label="Allow following links" checked={settings.robots_follow} onChange={v => updateSetting('robots_follow', v)} />
                  </div>
                </div>
              </SettingsPanel>
            )}

            {activeSection === 'analytics' && (
              <SettingsPanel title="Analytics & Tracking" description="Connect your analytics and tracking pixels.">
                <Field label="Google Analytics ID" value={settings.google_analytics_id} onChange={v => updateSetting('google_analytics_id', v)} placeholder="G-XXXXXXXXXX" hint="Measurement ID from Google Analytics 4" />
                <Field label="Meta Pixel ID" value={settings.meta_pixel_id} onChange={v => updateSetting('meta_pixel_id', v)} placeholder="123456789" hint="Facebook/Meta Pixel tracking ID" />
              </SettingsPanel>
            )}

            {activeSection === 'code' && (
              <SettingsPanel title="Custom Code" description="Inject custom HTML into every page. Use with caution.">
                <Field label="Head Code" value={settings.custom_head_code} onChange={v => updateSetting('custom_head_code', v)} placeholder="<!-- Scripts, meta tags, CSS -->" multiline code hint="Injected before </head>" />
                <Field label="Body Code" value={settings.custom_body_code} onChange={v => updateSetting('custom_body_code', v)} placeholder="<!-- Analytics, chat widgets -->" multiline code hint="Injected before </body>" />
              </SettingsPanel>
            )}

            {activeSection === 'social' && (
              <SettingsPanel title="Social Links" description="Social media profiles linked to this site.">
                <Field label="Twitter / X" value={settings.social_twitter} onChange={v => updateSetting('social_twitter', v)} placeholder="https://x.com/yourhandle" />
                <Field label="Facebook" value={settings.social_facebook} onChange={v => updateSetting('social_facebook', v)} placeholder="https://facebook.com/yourpage" />
                <Field label="Instagram" value={settings.social_instagram} onChange={v => updateSetting('social_instagram', v)} placeholder="https://instagram.com/yourhandle" />
                <Field label="LinkedIn" value={settings.social_linkedin} onChange={v => updateSetting('social_linkedin', v)} placeholder="https://linkedin.com/company/yourco" />
              </SettingsPanel>
            )}

            {activeSection === 'danger' && (
              <SettingsPanel title="Danger Zone" description="Irreversible actions for this site." danger>
                <div className="rounded-lg p-4 space-y-3" style={{ backgroundColor: 'rgba(220,38,38,0.06)', border: '1px solid rgba(220,38,38,0.2)' }}>
                  <div>
                    <h4 className="text-[13px] font-semibold text-red-400">Delete this site</h4>
                    <p className="text-[11px] mt-0.5" style={{ color: '#888' }}>Permanently delete "{siteName}" and all its pages. This action cannot be undone.</p>
                  </div>
                  <button
                    onClick={handleDeleteSite}
                    className="h-8 px-4 flex items-center gap-2 rounded-lg text-[11px] font-semibold text-white transition-all hover:brightness-110"
                    style={{ backgroundColor: '#dc2626' }}
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                    Delete Site
                  </button>
                </div>
              </SettingsPanel>
            )}
          </motion.div>
        </div>
      </div>
    </div>
  );
}

/* ─── Reusable sub-components ─── */

function SettingsPanel({ title, description, children, danger }: { title: string; description: string; children: React.ReactNode; danger?: boolean }) {
  return (
    <div className="space-y-6">
      <div>
        <h2 className={`text-[18px] font-bold ${danger ? 'text-red-400' : 'text-white'}`}>{title}</h2>
        <p className="text-[12px] mt-1" style={{ color: '#888' }}>{description}</p>
      </div>
      <div className="space-y-5">
        {children}
      </div>
    </div>
  );
}

function Field({ label, value, onChange, placeholder, hint, multiline, code, compact }: {
  label: string; value: string; onChange: (v: string) => void; placeholder?: string; hint?: string; multiline?: boolean; code?: boolean; compact?: boolean;
}) {
  const inputStyle: React.CSSProperties = {
    backgroundColor: '#141414',
    border: '1px solid #252525',
    color: '#e0e0e0',
    fontSize: compact ? '10px' : '12px',
    fontFamily: code ? "'SF Mono', 'Fira Code', monospace" : undefined,
  };
  return (
    <div className={compact ? 'mt-1.5' : 'space-y-1.5'}>
      {label && <label className="text-[11px] font-semibold uppercase tracking-wider block" style={{ color: '#888' }}>{label}</label>}
      {multiline ? (
        <textarea
          value={value}
          onChange={e => onChange(e.target.value)}
          placeholder={placeholder}
          rows={code ? 5 : 3}
          className="w-full rounded-lg px-3 py-2 placeholder:text-[#444] focus:outline-none focus:border-[#0073E6] transition-colors resize-none"
          style={inputStyle}
        />
      ) : (
        <input
          type="text"
          value={value}
          onChange={e => onChange(e.target.value)}
          placeholder={placeholder}
          className={`w-full rounded-lg px-3 placeholder:text-[#444] focus:outline-none focus:border-[#0073E6] transition-colors ${compact ? 'h-7 text-[10px]' : 'h-9'}`}
          style={inputStyle}
        />
      )}
      {hint && <p className="text-[10px]" style={{ color: '#555' }}>{hint}</p>}
    </div>
  );
}

function Toggle({ label, checked, onChange }: { label: string; checked: boolean; onChange: (v: boolean) => void }) {
  return (
    <label className="flex items-center gap-2 cursor-pointer select-none">
      <div
        onClick={() => onChange(!checked)}
        className="w-8 h-[18px] rounded-full relative transition-colors cursor-pointer"
        style={{ backgroundColor: checked ? '#0073E6' : '#333' }}
      >
        <div
          className="absolute top-[2px] w-[14px] h-[14px] rounded-full transition-all"
          style={{
            left: checked ? '15px' : '2px',
            backgroundColor: '#fff',
          }}
        />
      </div>
      <span className="text-[11px]" style={{ color: '#aaa' }}>{label}</span>
    </label>
  );
}
