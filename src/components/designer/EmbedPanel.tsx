import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useEditor } from './EditorContext';
import { createElement } from './utils/elementFactory';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Slider } from '@/components/ui/slider';
import { toast } from 'sonner';
import {
  Copy, Check, CalendarDays, Code2, FileCode, Globe, Puzzle, Plus,
  ExternalLink, Eye, Paintbrush, Monitor, Smartphone, ArrowLeft,
} from 'lucide-react';

type EmbedType = 'booking' | 'form' | 'custom-html' | 'third-party';
type DetailTab = 'preview' | 'customize' | 'code';

interface EmbedConfig {
  type: EmbedType;
  label: string;
  icon: typeof CalendarDays;
  description: string;
  hasPreview: boolean;
}

const EMBED_TYPES: EmbedConfig[] = [
  { type: 'booking', label: 'Booking Widget', icon: CalendarDays, description: 'Embed your appointment booking system', hasPreview: true },
  { type: 'form', label: 'Contact Form', icon: FileCode, description: 'Add a contact or lead capture form', hasPreview: true },
  { type: 'custom-html', label: 'Custom HTML', icon: Code2, description: 'Inject any HTML/CSS/JS code', hasPreview: false },
  { type: 'third-party', label: '3rd Party', icon: Puzzle, description: 'Google Maps, Calendly, Typeform, etc.', hasPreview: false },
];

const THIRD_PARTY_PRESETS = [
  { name: 'Google Maps', placeholder: '<iframe src="https://www.google.com/maps/embed?pb=..." ...></iframe>' },
  { name: 'Calendly', placeholder: '<div class="calendly-inline-widget" data-url="https://calendly.com/your-link"></div><script src="https://assets.calendly.com/assets/external/widget.js"></script>' },
  { name: 'Typeform', placeholder: '<div data-tf-live="YOUR_FORM_ID"></div><script src="//embed.typeform.com/next/embed.js"></script>' },
  { name: 'YouTube', placeholder: '<iframe src="https://www.youtube.com/embed/VIDEO_ID" ...></iframe>' },
  { name: 'Stripe Buy Button', placeholder: '<stripe-buy-button buy-button-id="..." publishable-key="..."></stripe-buy-button>' },
];

export function EmbedPanel({ siteId }: { siteId?: string }) {
  const { dispatch } = useEditor();
  const [activeType, setActiveType] = useState<EmbedType | null>(null);
  const [detailTab, setDetailTab] = useState<DetailTab>('preview');
  const [bookingSlug, setBookingSlug] = useState('');
  const [bookingSettings, setBookingSettings] = useState<any>(null);
  const [copied, setCopied] = useState(false);
  const [customHtml, setCustomHtml] = useState('');
  const [thirdPartyPreset, setThirdPartyPreset] = useState('');
  const [thirdPartyCode, setThirdPartyCode] = useState('');
  const [previewDevice, setPreviewDevice] = useState<'desktop' | 'mobile'>('desktop');
  const [previewKey, setPreviewKey] = useState(0);

  // Booking customization
  const [bookingCustom, setBookingCustom] = useState({
    color: '#3b82f6',
    height: 700,
    rounded: 12,
    shadow: true,
    mode: 'appointment' as string,
  });

  // Form embed config
  const [formConfig, setFormConfig] = useState({
    fields: ['name', 'email', 'message'],
    submitLabel: 'Send Message',
    successMessage: "Thank you! We'll be in touch soon.",
    brandColor: '#3b82f6',
    rounded: 8,
    fontSize: 14,
  });

  // Load booking settings
  useEffect(() => {
    const loadBooking = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;
      const { data } = await supabase
        .from('booking_settings')
        .select('business_slug, branding_color, business_name, booking_page_enabled')
        .eq('user_id', user.id)
        .maybeSingle();
      if (data) {
        setBookingSettings(data);
        setBookingSlug(data.business_slug || '');
        if (data.branding_color) {
          setBookingCustom(p => ({ ...p, color: data.branding_color }));
        }
      }
    };
    loadBooking();
  }, []);

  const origin = window.location.origin;

  const getBookingSnippet = () => {
    if (!bookingSlug) return '';
    return `<!-- Quooro Booking Widget -->\n<div\n  data-quooro-booking="${bookingSlug}"\n  data-quooro-color="${bookingCustom.color}"\n  data-quooro-height="${bookingCustom.height}"\n  data-quooro-rounded="${bookingCustom.rounded}"\n  data-quooro-shadow="${bookingCustom.shadow}"\n  data-quooro-mode="${bookingCustom.mode}"\n></div>\n<script src="${origin}/booking-embed.js" defer></script>`;
  };

  const getFormSnippet = () => {
    const fieldsHtml = formConfig.fields.map(f => {
      if (f === 'message') {
        return `    <div style="margin-bottom:16px"><label style="display:block;font-size:${formConfig.fontSize}px;font-weight:500;margin-bottom:4px;color:#374151">Message</label><textarea name="message" rows="4" required style="width:100%;padding:10px 14px;border:1px solid #d1d5db;border-radius:${formConfig.rounded}px;font-size:${formConfig.fontSize}px;resize:vertical"></textarea></div>`;
      }
      const label = f.charAt(0).toUpperCase() + f.slice(1);
      const type = f === 'email' ? 'email' : f === 'phone' ? 'tel' : 'text';
      return `    <div style="margin-bottom:16px"><label style="display:block;font-size:${formConfig.fontSize}px;font-weight:500;margin-bottom:4px;color:#374151">${label}</label><input type="${type}" name="${f}" required style="width:100%;padding:10px 14px;border:1px solid #d1d5db;border-radius:${formConfig.rounded}px;font-size:${formConfig.fontSize}px" /></div>`;
    }).join('\n');

    return `<!-- Quooro Contact Form -->\n<form id="quooro-contact-form" style="max-width:480px;margin:0 auto;padding:32px;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif">\n${fieldsHtml}\n    <button type="submit" style="width:100%;padding:12px;background:${formConfig.brandColor};color:#fff;border:none;border-radius:${formConfig.rounded}px;font-size:${formConfig.fontSize + 1}px;font-weight:600;cursor:pointer">${formConfig.submitLabel}</button>\n    <p id="quooro-form-success" style="display:none;text-align:center;padding:16px;color:#059669;font-weight:500">${formConfig.successMessage}</p>\n</form>`;
  };

  const getActiveSnippet = () => {
    switch (activeType) {
      case 'booking': return getBookingSnippet();
      case 'form': return getFormSnippet();
      case 'custom-html': return customHtml;
      case 'third-party': return thirdPartyCode;
      default: return '';
    }
  };

  const copySnippet = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    toast.success('Code copied to clipboard');
    setTimeout(() => setCopied(false), 2000);
  };

  const insertAsElement = () => {
    const snippet = getActiveSnippet();
    if (!snippet) {
      toast.error('No code to insert');
      return;
    }
    const el = createElement('text');
    el.props.text = snippet;
    el.styles.desktop = {
      ...el.styles.desktop,
      width: '100%',
      minHeight: '100px',
      padding: '16px',
    };
    dispatch({ type: 'ADD_ELEMENT', payload: { element: el } });
    toast.success('Embed code added to canvas');
  };

  const refreshPreview = () => setPreviewKey(k => k + 1);

  // ── Gallery view ──
  if (!activeType) {
    return (
      <ScrollArea className="h-full">
        <div className="p-3 space-y-3">
          <div className="px-1">
            <h3 className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
              Code Embeds
            </h3>
            <p className="text-[10px] mt-0.5 text-muted-foreground/60">
              Add booking widgets, forms, or custom code to your site
            </p>
          </div>

          {EMBED_TYPES.map(embed => {
            const Icon = embed.icon;
            return (
              <button
                key={embed.type}
                onClick={() => {
                  setActiveType(embed.type);
                  setDetailTab(embed.hasPreview ? 'preview' : 'code');
                }}
                className="w-full text-left p-3 rounded-xl transition-all hover:scale-[1.01] bg-card/60 border border-border/40 hover:border-brand/40"
              >
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-lg flex items-center justify-center bg-brand/10">
                    <Icon className="h-4 w-4 text-brand" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="text-[11px] font-medium text-foreground">{embed.label}</div>
                    <div className="text-[10px] text-muted-foreground">{embed.description}</div>
                  </div>
                </div>
              </button>
            );
          })}

          <div className="pt-2 px-1">
            <p className="text-[10px] text-muted-foreground/50">
              Tip: Embeds work on exported sites and published pages.
            </p>
          </div>
        </div>
      </ScrollArea>
    );
  }

  // ── Detail view ──
  const activeConfig = EMBED_TYPES.find(t => t.type === activeType)!;
  const ActiveIcon = activeConfig.icon;

  const DETAIL_TABS: { key: DetailTab; label: string; icon: typeof Eye }[] = [
    ...(activeConfig.hasPreview ? [{ key: 'preview' as DetailTab, label: 'Preview', icon: Eye }] : []),
    ...(activeConfig.hasPreview ? [{ key: 'customize' as DetailTab, label: 'Style', icon: Paintbrush }] : []),
    { key: 'code' as DetailTab, label: 'Code', icon: Code2 },
  ];

  const bookingPreviewUrl = bookingSlug
    ? `${origin}/book/${bookingSlug}?mode=${bookingCustom.mode}&brand=${encodeURIComponent(bookingCustom.color)}`
    : null;

  // Build form preview HTML
  const formPreviewHtml = `
    <!DOCTYPE html>
    <html><head><meta charset="utf-8"><style>
      body { margin: 0; padding: 24px; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; background: #fff; }
      label { display: block; font-size: ${formConfig.fontSize}px; font-weight: 500; margin-bottom: 4px; color: #374151; }
      input, textarea { width: 100%; padding: 10px 14px; border: 1px solid #d1d5db; border-radius: ${formConfig.rounded}px; font-size: ${formConfig.fontSize}px; box-sizing: border-box; }
      textarea { resize: vertical; }
      .field { margin-bottom: 16px; }
      button { width: 100%; padding: 12px; background: ${formConfig.brandColor}; color: #fff; border: none; border-radius: ${formConfig.rounded}px; font-size: ${formConfig.fontSize + 1}px; font-weight: 600; cursor: pointer; }
      button:hover { opacity: 0.9; }
    </style></head><body>
      <form>
        ${formConfig.fields.map(f => {
          if (f === 'message') return `<div class="field"><label>Message</label><textarea rows="4" placeholder="Your message..."></textarea></div>`;
          const label = f.charAt(0).toUpperCase() + f.slice(1);
          const type = f === 'email' ? 'email' : f === 'phone' ? 'tel' : 'text';
          return `<div class="field"><label>${label}</label><input type="${type}" placeholder="${label}..." /></div>`;
        }).join('')}
        <button type="button">${formConfig.submitLabel}</button>
      </form>
    </body></html>
  `;

  return (
    <ScrollArea className="h-full">
      <div className="p-3 space-y-3">
        {/* Back + header */}
        <button
          onClick={() => setActiveType(null)}
          className="flex items-center gap-1 text-[10px] font-medium text-muted-foreground hover:text-foreground transition-colors"
        >
          <ArrowLeft className="h-3 w-3" /> All Embeds
        </button>

        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-lg flex items-center justify-center bg-brand/10">
            <ActiveIcon className="h-3.5 w-3.5 text-brand" />
          </div>
          <h3 className="text-[12px] font-semibold text-foreground">{activeConfig.label}</h3>
        </div>

        {/* Sub-tabs */}
        <div className="flex rounded-lg bg-muted/50 p-0.5 gap-0.5">
          {DETAIL_TABS.map(tab => {
            const TabIcon = tab.icon;
            const active = detailTab === tab.key;
            return (
              <button
                key={tab.key}
                onClick={() => setDetailTab(tab.key)}
                className={`flex-1 flex items-center justify-center gap-1 px-2 py-1.5 rounded-md text-[10px] font-medium transition-all ${
                  active
                    ? 'bg-brand text-white shadow-sm'
                    : 'text-muted-foreground hover:text-foreground'
                }`}
              >
                <TabIcon className="h-3 w-3" />
                {tab.label}
              </button>
            );
          })}
        </div>

        {/* ═══ PREVIEW TAB ═══ */}
        {detailTab === 'preview' && activeType === 'booking' && (
          <div className="space-y-3">
            {!bookingSlug ? (
              <div className="p-3 rounded-xl text-[10px] bg-amber-500/10 border border-amber-500/20 text-amber-400">
                No booking slug configured. Go to Bookings → Embed & Share to set one up.
              </div>
            ) : (
              <>
                {/* Device toggle */}
                <div className="flex items-center justify-between">
                  <span className="text-[10px] text-muted-foreground">Live Preview</span>
                  <div className="flex gap-1">
                    <button
                      onClick={() => setPreviewDevice('desktop')}
                      className={`p-1.5 rounded-md transition-colors ${previewDevice === 'desktop' ? 'bg-brand/15 text-brand' : 'text-muted-foreground hover:text-foreground'}`}
                    >
                      <Monitor className="h-3.5 w-3.5" />
                    </button>
                    <button
                      onClick={() => setPreviewDevice('mobile')}
                      className={`p-1.5 rounded-md transition-colors ${previewDevice === 'mobile' ? 'bg-brand/15 text-brand' : 'text-muted-foreground hover:text-foreground'}`}
                    >
                      <Smartphone className="h-3.5 w-3.5" />
                    </button>
                  </div>
                </div>

                {/* Preview iframe */}
                <div
                  className="mx-auto rounded-xl overflow-hidden border border-border/40 bg-white"
                  style={{
                    width: previewDevice === 'mobile' ? '220px' : '100%',
                    height: previewDevice === 'mobile' ? '400px' : '360px',
                    transition: 'all 0.3s ease',
                  }}
                >
                  <iframe
                    key={previewKey}
                    src={bookingPreviewUrl!}
                    className="w-full h-full border-none"
                    title="Booking preview"
                    style={{
                      borderRadius: `${bookingCustom.rounded}px`,
                      transform: previewDevice === 'mobile' ? 'scale(0.65)' : 'scale(0.55)',
                      transformOrigin: 'top left',
                      width: previewDevice === 'mobile' ? '338px' : '182%',
                      height: previewDevice === 'mobile' ? '615px' : '655px',
                    }}
                  />
                </div>

                <div className="flex gap-2">
                  <Button
                    size="sm"
                    variant="outline"
                    className="flex-1 h-7 text-[10px]"
                    onClick={refreshPreview}
                  >
                    Refresh
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    className="h-7 text-[10px] gap-1"
                    onClick={() => window.open(bookingPreviewUrl!, '_blank')}
                  >
                    <ExternalLink className="h-3 w-3" /> Open
                  </Button>
                </div>
              </>
            )}
          </div>
        )}

        {detailTab === 'preview' && activeType === 'form' && (
          <div className="space-y-3">
            <span className="text-[10px] text-muted-foreground">Live Preview</span>
            <div
              className="rounded-xl overflow-hidden border border-border/40 bg-white"
              style={{ height: '360px' }}
            >
              <iframe
                key={previewKey}
                srcDoc={formPreviewHtml}
                className="w-full h-full border-none"
                title="Form preview"
                style={{
                  transform: 'scale(0.7)',
                  transformOrigin: 'top left',
                  width: '143%',
                  height: '143%',
                }}
              />
            </div>
          </div>
        )}

        {/* ═══ CUSTOMIZE TAB ═══ */}
        {detailTab === 'customize' && activeType === 'booking' && (
          <div className="space-y-4">
            {!bookingSlug ? (
              <div className="p-3 rounded-xl text-[10px] bg-amber-500/10 border border-amber-500/20 text-amber-400">
                Set up a booking slug first.
              </div>
            ) : (
              <>
                {/* Brand Color */}
                <div className="space-y-1.5">
                  <Label className="text-[10px] text-muted-foreground">Brand Color</Label>
                  <div className="flex gap-2 items-center">
                    <input
                      type="color"
                      value={bookingCustom.color}
                      onChange={e => { setBookingCustom(p => ({ ...p, color: e.target.value })); refreshPreview(); }}
                      className="w-8 h-8 rounded-lg cursor-pointer border border-border/40"
                    />
                    <Input
                      value={bookingCustom.color}
                      onChange={e => setBookingCustom(p => ({ ...p, color: e.target.value }))}
                      onBlur={refreshPreview}
                      className="h-7 text-[11px] font-mono flex-1 bg-card/60 border-border/40"
                    />
                  </div>
                </div>

                {/* Mode */}
                <div className="space-y-1.5">
                  <Label className="text-[10px] text-muted-foreground">Booking Mode</Label>
                  <div className="flex gap-1">
                    {['appointment', 'enquiry', 'table'].map(m => (
                      <button
                        key={m}
                        onClick={() => { setBookingCustom(p => ({ ...p, mode: m })); refreshPreview(); }}
                        className={`flex-1 px-2 py-1.5 rounded-lg text-[10px] font-medium transition-colors ${
                          bookingCustom.mode === m
                            ? 'bg-brand text-white'
                            : 'bg-muted/50 text-muted-foreground hover:text-foreground'
                        }`}
                      >
                        {m.charAt(0).toUpperCase() + m.slice(1)}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Height */}
                <div className="space-y-1.5">
                  <div className="flex justify-between">
                    <Label className="text-[10px] text-muted-foreground">Height</Label>
                    <span className="text-[10px] text-muted-foreground">{bookingCustom.height}px</span>
                  </div>
                  <Slider
                    value={[bookingCustom.height]}
                    onValueChange={([v]) => setBookingCustom(p => ({ ...p, height: v }))}
                    min={400}
                    max={1000}
                    step={50}
                    className="w-full"
                  />
                </div>

                {/* Border Radius */}
                <div className="space-y-1.5">
                  <div className="flex justify-between">
                    <Label className="text-[10px] text-muted-foreground">Rounded Corners</Label>
                    <span className="text-[10px] text-muted-foreground">{bookingCustom.rounded}px</span>
                  </div>
                  <Slider
                    value={[bookingCustom.rounded]}
                    onValueChange={([v]) => setBookingCustom(p => ({ ...p, rounded: v }))}
                    min={0}
                    max={32}
                    step={2}
                    className="w-full"
                  />
                </div>

                {/* Shadow */}
                <div className="flex items-center justify-between">
                  <Label className="text-[10px] text-muted-foreground">Box Shadow</Label>
                  <Switch
                    checked={bookingCustom.shadow}
                    onCheckedChange={v => { setBookingCustom(p => ({ ...p, shadow: v })); refreshPreview(); }}
                  />
                </div>

                <Button
                  size="sm"
                  className="w-full h-8 text-[10px] bg-brand hover:bg-brand/90 text-white"
                  onClick={() => { refreshPreview(); setDetailTab('preview'); }}
                >
                  <Eye className="h-3 w-3 mr-1" /> See Preview
                </Button>
              </>
            )}
          </div>
        )}

        {detailTab === 'customize' && activeType === 'form' && (
          <div className="space-y-4">
            {/* Fields */}
            <div className="space-y-1.5">
              <Label className="text-[10px] text-muted-foreground">Form Fields</Label>
              <div className="flex flex-wrap gap-1">
                {['name', 'email', 'phone', 'company', 'message'].map(field => {
                  const active = formConfig.fields.includes(field);
                  return (
                    <button
                      key={field}
                      onClick={() => {
                        setFormConfig(p => ({
                          ...p,
                          fields: active ? p.fields.filter(f => f !== field) : [...p.fields, field],
                        }));
                        refreshPreview();
                      }}
                      className={`px-2 py-1 rounded-lg text-[10px] font-medium transition-colors ${
                        active
                          ? 'bg-brand text-white'
                          : 'bg-muted/50 text-muted-foreground border border-border/40'
                      }`}
                    >
                      {field}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Brand Color */}
            <div className="space-y-1.5">
              <Label className="text-[10px] text-muted-foreground">Button Color</Label>
              <div className="flex gap-2 items-center">
                <input
                  type="color"
                  value={formConfig.brandColor}
                  onChange={e => { setFormConfig(p => ({ ...p, brandColor: e.target.value })); refreshPreview(); }}
                  className="w-8 h-8 rounded-lg cursor-pointer border border-border/40"
                />
                <Input
                  value={formConfig.brandColor}
                  onChange={e => setFormConfig(p => ({ ...p, brandColor: e.target.value }))}
                  onBlur={refreshPreview}
                  className="h-7 text-[11px] font-mono flex-1 bg-card/60 border-border/40"
                />
              </div>
            </div>

            {/* Button Label */}
            <div className="space-y-1.5">
              <Label className="text-[10px] text-muted-foreground">Button Label</Label>
              <Input
                value={formConfig.submitLabel}
                onChange={e => setFormConfig(p => ({ ...p, submitLabel: e.target.value }))}
                onBlur={refreshPreview}
                className="h-7 text-[11px] bg-card/60 border-border/40"
              />
            </div>

            {/* Rounded */}
            <div className="space-y-1.5">
              <div className="flex justify-between">
                <Label className="text-[10px] text-muted-foreground">Border Radius</Label>
                <span className="text-[10px] text-muted-foreground">{formConfig.rounded}px</span>
              </div>
              <Slider
                value={[formConfig.rounded]}
                onValueChange={([v]) => { setFormConfig(p => ({ ...p, rounded: v })); refreshPreview(); }}
                min={0}
                max={20}
                step={2}
                className="w-full"
              />
            </div>

            {/* Font size */}
            <div className="space-y-1.5">
              <div className="flex justify-between">
                <Label className="text-[10px] text-muted-foreground">Font Size</Label>
                <span className="text-[10px] text-muted-foreground">{formConfig.fontSize}px</span>
              </div>
              <Slider
                value={[formConfig.fontSize]}
                onValueChange={([v]) => { setFormConfig(p => ({ ...p, fontSize: v })); refreshPreview(); }}
                min={12}
                max={18}
                step={1}
                className="w-full"
              />
            </div>

            {/* Success message */}
            <div className="space-y-1.5">
              <Label className="text-[10px] text-muted-foreground">Success Message</Label>
              <Input
                value={formConfig.successMessage}
                onChange={e => setFormConfig(p => ({ ...p, successMessage: e.target.value }))}
                className="h-7 text-[11px] bg-card/60 border-border/40"
              />
            </div>

            <Button
              size="sm"
              className="w-full h-8 text-[10px] bg-brand hover:bg-brand/90 text-white"
              onClick={() => { refreshPreview(); setDetailTab('preview'); }}
            >
              <Eye className="h-3 w-3 mr-1" /> See Preview
            </Button>
          </div>
        )}

        {/* ═══ CODE TAB ═══ */}
        {detailTab === 'code' && activeType === 'booking' && (
          <div className="space-y-3">
            {!bookingSlug ? (
              <div className="p-3 rounded-xl text-[10px] bg-amber-500/10 border border-amber-500/20 text-amber-400">
                No booking slug configured.
              </div>
            ) : (
              <>
                <div className="p-2.5 rounded-xl bg-emerald-500/10 border border-emerald-500/20">
                  <div className="flex items-center gap-1.5">
                    <Check className="h-3 w-3 text-emerald-400" />
                    <span className="text-[10px] font-medium text-emerald-400">
                      Booking active: {bookingSlug}
                    </span>
                  </div>
                </div>
                <div className="space-y-1.5">
                  <Label className="text-[10px] text-muted-foreground">Hosted page</Label>
                  <div className="flex gap-1">
                    <code className="flex-1 text-[9px] px-2 py-1.5 rounded-lg truncate bg-muted/50 text-muted-foreground">
                      {origin}/book/{bookingSlug}
                    </code>
                    <Button variant="ghost" size="icon" className="h-7 w-7 shrink-0" onClick={() => copySnippet(`${origin}/book/${bookingSlug}`)}>
                      <Copy className="h-3 w-3 text-muted-foreground" />
                    </Button>
                    <Button variant="ghost" size="icon" className="h-7 w-7 shrink-0" onClick={() => window.open(`${origin}/book/${bookingSlug}`, '_blank')}>
                      <ExternalLink className="h-3 w-3 text-muted-foreground" />
                    </Button>
                  </div>
                </div>
              </>
            )}
          </div>
        )}

        {detailTab === 'code' && activeType === 'form' && (
          <div className="space-y-2">
            <p className="text-[10px] text-muted-foreground">
              Customise fields and styling in the Style tab, then copy this code.
            </p>
          </div>
        )}

        {detailTab === 'code' && activeType === 'custom-html' && (
          <div className="space-y-2">
            <Label className="text-[10px] text-muted-foreground">Paste your HTML / CSS / JavaScript</Label>
            <Textarea
              value={customHtml}
              onChange={e => setCustomHtml(e.target.value)}
              rows={10}
              placeholder="<div>Your custom code here...</div>"
              className="text-[11px] font-mono bg-card/60 border-border/40"
            />
          </div>
        )}

        {detailTab === 'code' && activeType === 'third-party' && (
          <div className="space-y-3">
            <div className="space-y-1.5">
              <Label className="text-[10px] text-muted-foreground">Quick Presets</Label>
              <div className="flex flex-wrap gap-1">
                {THIRD_PARTY_PRESETS.map(preset => (
                  <button
                    key={preset.name}
                    onClick={() => {
                      setThirdPartyPreset(preset.name);
                      setThirdPartyCode(preset.placeholder);
                    }}
                    className={`px-2 py-1 rounded-lg text-[10px] font-medium transition-colors ${
                      thirdPartyPreset === preset.name
                        ? 'bg-brand text-white'
                        : 'bg-muted/50 text-muted-foreground border border-border/40'
                    }`}
                  >
                    {preset.name}
                  </button>
                ))}
              </div>
            </div>
            <div className="space-y-1">
              <Label className="text-[10px] text-muted-foreground">Embed Code</Label>
              <Textarea
                value={thirdPartyCode}
                onChange={e => setThirdPartyCode(e.target.value)}
                rows={8}
                placeholder="Paste your embed code here..."
                className="text-[11px] font-mono bg-card/60 border-border/40"
              />
            </div>
          </div>
        )}

        {/* Generated snippet (shown on Code tab when there's a snippet) */}
        {detailTab === 'code' && getActiveSnippet() && (
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label className="text-[10px] text-muted-foreground">Generated Code</Label>
            </div>
            <div className="relative">
              <pre
                className="rounded-xl p-3 text-[9px] overflow-x-auto whitespace-pre-wrap font-mono leading-relaxed max-h-[200px] overflow-y-auto bg-muted/50 text-emerald-400 border border-border/30"
              >
                {getActiveSnippet()}
              </pre>
              <button
                onClick={() => copySnippet(getActiveSnippet())}
                className="absolute top-1.5 right-1.5 p-1.5 rounded-md bg-card/80 hover:bg-card transition-colors"
              >
                {copied ? (
                  <Check className="h-3 w-3 text-emerald-400" />
                ) : (
                  <Copy className="h-3 w-3 text-muted-foreground" />
                )}
              </button>
            </div>

            {/* Actions */}
            <div className="flex gap-2">
              <Button
                size="sm"
                className="flex-1 h-8 text-[10px] font-semibold bg-brand hover:bg-brand/90 text-white"
                onClick={() => copySnippet(getActiveSnippet())}
              >
                <Copy className="h-3 w-3 mr-1" />
                {copied ? 'Copied!' : 'Copy Code'}
              </Button>
              <Button
                size="sm"
                variant="outline"
                className="flex-1 h-8 text-[10px] font-semibold border-border/40"
                onClick={insertAsElement}
              >
                <Plus className="h-3 w-3 mr-1" />
                Add to Page
              </Button>
            </div>
          </div>
        )}
      </div>
    </ScrollArea>
  );
}
