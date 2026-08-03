import React, { useState, useEffect } from 'react';
import { useEditor } from './EditorContext';
import { ScrollArea } from '@/components/ui/scroll-area';
import { ChevronDown, Globe, Accessibility, Tag, Code2, Layers, Link2, Copy, Check, Search, FileCode, Shield, Zap, Phone } from 'lucide-react';
import { motion } from 'framer-motion';
import { supabase } from '@/integrations/supabase/client';

function SectionHeader({ label, open, onClick, icon: Icon }: { label: string; open: boolean; onClick: () => void; icon?: React.ComponentType<{ className?: string; style?: React.CSSProperties }> }) {
  return (
    <button
      onClick={onClick}
      className="w-full flex items-center justify-between h-8 px-0 text-[10px] font-semibold uppercase tracking-[0.08em] transition-colors"
      style={{ color: 'hsl(var(--studio-ink-2))' }}
    >
      <span className="flex items-center gap-2">
        {Icon && <Icon className="h-3 w-3" style={{ color: 'hsl(var(--studio-ink-3))' }} />}
        {label}
      </span>
      <ChevronDown className={`h-3 w-3 transition-transform duration-200 ${open ? '' : '-rotate-90'}`} style={{ color: 'hsl(var(--studio-ink-3))' }} />
    </button>
  );
}

function FieldRow({ label, value, onChange, placeholder, multiline }: {
  label: string; value: string; onChange: (v: string) => void; placeholder?: string; multiline?: boolean;
}) {
  const InputEl = multiline ? 'textarea' : 'input';
  return (
    <div className="flex items-start gap-2">
      <span className="text-[10px] w-16 shrink-0 text-right pt-1.5" style={{ color: 'hsl(var(--studio-ink-3))' }}>{label}</span>
      <InputEl
        value={value}
        onChange={(e: any) => onChange(e.target.value)}
        placeholder={placeholder}
        className="flex-1 px-2 rounded text-[11px] outline-none transition-all resize-none"
        style={{
          backgroundColor: 'hsl(var(--studio-raised))',
          border: '1px solid hsl(var(--studio-line))',
          color: 'hsl(var(--studio-ink-2))',
          height: multiline ? '60px' : '24px',
          paddingTop: multiline ? '6px' : '0',
          lineHeight: multiline ? '1.4' : '24px',
        }}
        onFocus={(e: any) => { e.currentTarget.style.borderColor = 'hsl(var(--studio-accent))'; }}
        onBlur={(e: any) => { e.currentTarget.style.borderColor = 'hsl(var(--studio-line))'; }}
      />
    </div>
  );
}

function ToggleRow({ label, value, onChange }: { label: string; value: boolean; onChange: (v: boolean) => void }) {
  return (
    <div className="flex items-center gap-2 h-7">
      <span className="text-[10px] flex-1 text-right" style={{ color: 'hsl(var(--studio-ink-3))' }}>{label}</span>
      <button
        onClick={() => onChange(!value)}
        className="w-8 h-4 rounded-full relative transition-colors"
        style={{ backgroundColor: value ? 'hsl(var(--studio-accent))' : 'hsl(var(--studio-line))' }}
      >
        <div className="absolute top-0.5 w-3 h-3 rounded-full bg-white transition-all" style={{ left: value ? '16px' : '2px' }} />
      </button>
    </div>
  );
}

function ColorField({ label, value, onChange }: { label: string; value: string; onChange: (v: string) => void }) {
  const [copied, setCopied] = useState(false);
  const handleCopy = () => {
    if (value) { navigator.clipboard.writeText(value); setCopied(true); setTimeout(() => setCopied(false), 1200); }
  };
  return (
    <div className="flex items-center gap-2 h-7">
      <span className="text-[10px] w-16 shrink-0 text-right" style={{ color: 'hsl(var(--studio-ink-3))' }}>{label}</span>
      <div className="flex-1 flex items-center gap-1.5">
        <div className="relative">
          <input type="color" value={value || '#000000'} onChange={e => onChange(e.target.value)} className="absolute inset-0 w-full h-full opacity-0 cursor-pointer" />
          <div className="w-6 h-6 rounded-md border cursor-pointer" style={{ backgroundColor: value || 'transparent', borderColor: 'hsl(var(--studio-line-strong))', backgroundImage: !value ? 'linear-gradient(45deg, hsl(var(--studio-line)) 25%, transparent 25%, transparent 75%, hsl(var(--studio-line)) 75%), linear-gradient(45deg, hsl(var(--studio-line)) 25%, transparent 25%, transparent 75%, hsl(var(--studio-line)) 75%)' : undefined, backgroundSize: !value ? '8px 8px' : undefined, backgroundPosition: !value ? '0 0, 4px 4px' : undefined }} />
        </div>
        <input value={value} onChange={e => onChange(e.target.value)} placeholder="#000000" className="flex-1 h-6 px-2 rounded text-[11px] outline-none transition-all font-mono" style={{ backgroundColor: 'hsl(var(--studio-raised))', border: '1px solid hsl(var(--studio-line))', color: 'hsl(var(--studio-ink-2))' }} onFocus={e => { e.currentTarget.style.borderColor = 'hsl(var(--studio-accent))'; }} onBlur={e => { e.currentTarget.style.borderColor = 'hsl(var(--studio-line))'; }} />
        <button onClick={handleCopy} className="h-6 w-6 flex items-center justify-center rounded hover:bg-[hsl(var(--studio-hover))] transition-colors">
          {copied ? <Check className="h-3 w-3" style={{ color: 'hsl(var(--studio-ok))' }} /> : <Copy className="h-3 w-3" style={{ color: 'hsl(var(--studio-ink-3))' }} />}
        </button>
      </div>
    </div>
  );
}

function PageLinkSelector({ value, onChange, siteId }: { value: string; onChange: (v: string) => void; siteId?: string }) {
  const [pages, setPages] = useState<{ id: string; page_name: string; slug: string }[]>([]);
  useEffect(() => {
    if (!siteId) return;
    supabase.from('designer_pages').select('id, page_name, slug').eq('site_id', siteId).order('sort_order').then(({ data }) => {
      if (data) setPages(data);
    });
  }, [siteId]);

  const linkedPage = pages.find(p => value === `#${p.slug}`);

  return (
    <div className="space-y-1">
      <div className="flex items-center gap-2 h-7">
        <span className="text-[10px] w-16 shrink-0 text-right" style={{ color: 'hsl(var(--studio-accent))' }}>📄 Page</span>
        <select
          value={value}
          onChange={e => onChange(e.target.value)}
          className="flex-1 h-6 px-1.5 rounded text-[11px] outline-none appearance-none cursor-pointer transition-all"
          style={{ backgroundColor: 'hsl(var(--studio-raised))', border: `1px solid ${linkedPage ? 'hsl(var(--studio-accent))' : 'hsl(var(--studio-line))'}`, color: 'hsl(var(--studio-ink-2))' }}
          onFocus={e => { e.currentTarget.style.borderColor = 'hsl(var(--studio-accent))'; }}
          onBlur={e => { e.currentTarget.style.borderColor = linkedPage ? 'hsl(var(--studio-accent))' : 'hsl(var(--studio-line))'; }}
        >
          <option value="">— No page link —</option>
          {pages.map(p => (
            <option key={p.id} value={`#${p.slug}`}>📄 {p.page_name}</option>
          ))}
        </select>
      </div>
      {linkedPage && (
        <div className="flex items-center gap-1.5 ml-[72px] px-2 py-1 rounded" style={{ backgroundColor: 'hsl(var(--studio-accent) / 0.08)', border: '1px solid hsl(var(--studio-accent) / 0.15)' }}>
          <span className="text-[9px] font-semibold" style={{ color: 'hsl(var(--studio-accent))' }}>✓ Linked to "{linkedPage.page_name}"</span>
          <button onClick={() => onChange('')} className="text-[9px] ml-auto hover:text-red-400 transition-colors" style={{ color: 'hsl(var(--studio-ink-3))' }}>✕</button>
        </div>
      )}
    </div>
  );
}

function CodeEditor({ value, onChange, placeholder, rows = 6 }: { value: string; onChange: (v: string) => void; placeholder?: string; rows?: number }) {
  return (
    <textarea
      value={value}
      onChange={e => onChange(e.target.value)}
      placeholder={placeholder}
      rows={rows}
      className="w-full px-3 py-2 rounded-lg text-[11px] font-mono outline-none resize-none"
      style={{ backgroundColor: 'hsl(var(--studio-panel))', border: '1px solid hsl(var(--studio-line))', color: 'hsl(var(--studio-ink-3))', lineHeight: '1.5' }}
      onFocus={e => { e.currentTarget.style.borderColor = 'hsl(var(--studio-accent))'; }}
      onBlur={e => { e.currentTarget.style.borderColor = 'hsl(var(--studio-line))'; }}
    />
  );
}

export function SettingsPanel({ siteId }: { siteId?: string }) {
  const { state, dispatch, selectedElement } = useEditor();
  const [openSections, setOpenSections] = React.useState<Record<string, boolean>>({
    element: true, seo: true, accessibility: false, classes: false, advanced: false,
    pageSeo: true, codeInjection: false, openGraph: false, performance: false, favicon: false,
  });

  // Page-level SEO state
  const [pageSeo, setPageSeo] = useState({
    seo_title: '', seo_description: '', og_title: '', og_description: '', og_image: '',
    twitter_handle: '', favicon_url: '', canonical_url: '', no_index: false, no_follow: false,
    head_code: '', body_code: '',
  });
  const [seoLoaded, setSeoLoaded] = useState(false);
  const [seoSaving, setSeoSaving] = useState(false);

  // Load page SEO from database
  useEffect(() => {
    if (!state.activePage) return;
    setSeoLoaded(false);
    supabase.from('designer_pages')
      .select('seo_title, seo_description, page_settings')
      .eq('id', state.activePage)
      .single()
      .then(({ data }) => {
        if (data) {
          const ps = (data.page_settings as any) || {};
          setPageSeo({
            seo_title: data.seo_title || '',
            seo_description: data.seo_description || '',
            og_title: ps.og_title || '',
            og_description: ps.og_description || '',
            og_image: ps.og_image || '',
            twitter_handle: ps.twitter_handle || '',
            favicon_url: ps.favicon_url || '',
            canonical_url: ps.canonical_url || '',
            no_index: ps.no_index || false,
            no_follow: ps.no_follow || false,
            head_code: ps.head_code || '',
            body_code: ps.body_code || '',
          });
        }
        setSeoLoaded(true);
      });
  }, [state.activePage]);

  // Save page SEO to database (debounced)
  const saveSeoRef = React.useRef<ReturnType<typeof setTimeout> | null>(null);
  const savePageSeo = React.useCallback((newSeo: typeof pageSeo) => {
    if (!state.activePage) return;
    if (saveSeoRef.current) clearTimeout(saveSeoRef.current);
    saveSeoRef.current = setTimeout(async () => {
      setSeoSaving(true);
      const { seo_title, seo_description, ...rest } = newSeo;
      await supabase.from('designer_pages').update({
        seo_title: seo_title || null,
        seo_description: seo_description || null,
        page_settings: rest,
      }).eq('id', state.activePage);
      setSeoSaving(false);
    }, 800);
  }, [state.activePage]);

  const updateSeo = (key: string, value: any) => {
    const newSeo = { ...pageSeo, [key]: value };
    setPageSeo(newSeo);
    savePageSeo(newSeo);
  };

  const toggle = (key: string) => setOpenSections(prev => ({ ...prev, [key]: !prev[key] }));

  if (!selectedElement) {
    return (
      <ScrollArea className="h-full">
        <div className="p-3 space-y-0.5">
          {/* Page-level settings when no element is selected */}
          <div className="flex items-center justify-between py-3">
            <div className="flex flex-col gap-1">
              <span className="text-[11px] font-semibold text-white">Page Settings</span>
              <span className="text-[9px] text-[hsl(var(--studio-hover))]">SEO, meta tags, favicon & code injection</span>
            </div>
            {seoSaving && (
              <span className="text-[9px] px-2 py-0.5 rounded animate-pulse" style={{ backgroundColor: 'hsl(var(--studio-accent) / 0.1)', color: 'hsl(var(--studio-accent))' }}>
                Saving…
              </span>
            )}
          </div>

          <div className="h-[1px] my-2" style={{ backgroundColor: 'hsl(var(--studio-raised))' }} />

          {/* Favicon */}
          <SectionHeader label="Favicon" open={openSections.favicon} onClick={() => toggle('favicon')} icon={Globe} />
          {openSections.favicon && (
            <div className="space-y-2 pb-3">
              <FieldRow label="URL" value={pageSeo.favicon_url} onChange={(v) => updateSeo('favicon_url', v)} placeholder="https://example.com/favicon.ico" />
              {pageSeo.favicon_url && (
                <div className="flex items-center gap-2 ml-[72px]">
                  <img src={pageSeo.favicon_url} alt="Favicon" className="w-5 h-5 rounded" onError={e => { (e.target as HTMLImageElement).style.display = 'none'; }} />
                  <span className="text-[9px]" style={{ color: 'hsl(var(--studio-ok))' }}>✓ Favicon set</span>
                </div>
              )}
              <div className="text-[9px] px-1 py-1 rounded" style={{ color: 'hsl(var(--studio-ink-3))', backgroundColor: 'hsl(var(--studio-panel))' }}>
                🌐 The favicon appears in the browser tab. Use a .ico, .png, or .svg file.
              </div>
            </div>
          )}

          <div className="h-[1px] my-1" style={{ backgroundColor: 'hsl(var(--studio-raised))' }} />

          {/* Page SEO */}
          <SectionHeader label="SEO Meta Tags" open={openSections.pageSeo} onClick={() => toggle('pageSeo')} icon={Search} />
          {openSections.pageSeo && (
            <div className="space-y-2 pb-3">
              <FieldRow label="Title" value={pageSeo.seo_title} onChange={(v) => updateSeo('seo_title', v)} placeholder="Page title (max 60 chars)" />
              <FieldRow label="Desc" value={pageSeo.seo_description} onChange={(v) => updateSeo('seo_description', v)} placeholder="Meta description (max 160 chars)" multiline />
              <FieldRow label="Canonical" value={pageSeo.canonical_url} onChange={(v) => updateSeo('canonical_url', v)} placeholder="https://..." />
              <ToggleRow label="No Index" value={pageSeo.no_index} onChange={(v) => updateSeo('no_index', v)} />
              <ToggleRow label="No Follow" value={pageSeo.no_follow} onChange={(v) => updateSeo('no_follow', v)} />
              {pageSeo.seo_title && (
                <div className="ml-[72px] p-2 rounded space-y-1" style={{ backgroundColor: 'hsl(var(--studio-panel))', border: '1px solid hsl(var(--studio-line))' }}>
                  <div className="text-[10px] font-medium" style={{ color: '#8ab4f8' }}>{pageSeo.seo_title}</div>
                  <div className="text-[9px]" style={{ color: 'hsl(var(--studio-ok))' }}>example.com › page</div>
                  <div className="text-[9px] line-clamp-2" style={{ color: '#bdc1c6' }}>{pageSeo.seo_description || 'No description set'}</div>
                </div>
              )}
            </div>
          )}

          <div className="h-[1px] my-1" style={{ backgroundColor: 'hsl(var(--studio-raised))' }} />

          {/* Open Graph */}
          <SectionHeader label="Open Graph / Social" open={openSections.openGraph} onClick={() => toggle('openGraph')} icon={Globe} />
          {openSections.openGraph && (
            <div className="space-y-2 pb-3">
              <FieldRow label="OG Title" value={pageSeo.og_title} onChange={(v) => updateSeo('og_title', v)} placeholder="Open Graph title" />
              <FieldRow label="OG Desc" value={pageSeo.og_description} onChange={(v) => updateSeo('og_description', v)} placeholder="OG description" multiline />
              <FieldRow label="OG Image" value={pageSeo.og_image} onChange={(v) => updateSeo('og_image', v)} placeholder="https://image-url.jpg" />
              <FieldRow label="Twitter" value={pageSeo.twitter_handle} onChange={(v) => updateSeo('twitter_handle', v)} placeholder="@handle" />
              <div className="text-[9px] px-1 py-1 rounded" style={{ color: 'hsl(var(--studio-ink-3))', backgroundColor: 'hsl(var(--studio-panel))' }}>
                💡 These tags control how your page looks when shared on social media
              </div>
            </div>
          )}

          <div className="h-[1px] my-1" style={{ backgroundColor: 'hsl(var(--studio-raised))' }} />

          {/* Code Injection */}
          <SectionHeader label="Custom Code" open={openSections.codeInjection} onClick={() => toggle('codeInjection')} icon={FileCode} />
          {openSections.codeInjection && (
            <div className="space-y-3 pb-3">
              <div className="space-y-1.5">
                <span className="text-[9px] text-[hsl(var(--studio-ink-3))] font-semibold uppercase tracking-wider">Head Code</span>
                <CodeEditor value={pageSeo.head_code} onChange={(v) => updateSeo('head_code', v)} placeholder="<!-- Add scripts, meta tags, fonts... -->" rows={4} />
              </div>
              <div className="space-y-1.5">
                <span className="text-[9px] text-[hsl(var(--studio-ink-3))] font-semibold uppercase tracking-wider">Body End Code</span>
                <CodeEditor value={pageSeo.body_code} onChange={(v) => updateSeo('body_code', v)} placeholder="<!-- Analytics, chat widgets... -->" rows={4} />
              </div>
              <div className="text-[9px] px-1 py-1 rounded" style={{ color: 'hsl(var(--studio-warn))', backgroundColor: 'rgba(245,158,11,0.06)' }}>
                ⚠️ Custom code is included in the exported site
              </div>
            </div>
          )}
        </div>
      </ScrollArea>
    );
  }

  const updateProp = (key: string, value: unknown) => {
    dispatch({ type: 'UPDATE_ELEMENT', payload: { id: selectedElement.id, updates: { props: { ...selectedElement.props, [key]: value } } } });
  };

  const sectionDivider = <div className="h-[1px] my-1" style={{ backgroundColor: 'hsl(var(--studio-raised))' }} />;

  return (
    <ScrollArea className="h-full">
      <div className="p-3 space-y-0.5">
        {/* Element info */}
        <SectionHeader label="Element" open={openSections.element} onClick={() => toggle('element')} icon={Layers} />
        {openSections.element && (
          <div className="space-y-1.5 pb-2">
            <FieldRow label="Name" value={selectedElement.name || ''} onChange={(v) => dispatch({ type: 'UPDATE_ELEMENT', payload: { id: selectedElement.id, updates: { name: v } } })} placeholder="My Element" />
            <div className="flex items-center gap-2 h-7">
              <span className="text-[10px] w-16 shrink-0 text-right" style={{ color: 'hsl(var(--studio-ink-3))' }}>ID</span>
              <span className="text-[10px] font-mono" style={{ color: 'hsl(var(--studio-ink-3))' }}>{selectedElement.id.slice(0, 12)}…</span>
            </div>
            <div className="flex items-center gap-2 h-7">
              <span className="text-[10px] w-16 shrink-0 text-right" style={{ color: 'hsl(var(--studio-ink-3))' }}>Type</span>
              <span className="text-[10px] px-2 py-0.5 rounded font-medium" style={{ backgroundColor: 'hsl(var(--studio-hover))', color: 'hsl(var(--studio-accent))' }}>{selectedElement.type}</span>
            </div>
          </div>
        )}
        {sectionDivider}

        {/* Link to Page — available on ALL element types */}
        <SectionHeader label="Link & Navigation" open={openSections.seo} onClick={() => toggle('seo')} icon={Globe} />
        {openSections.seo && (
          <div className="space-y-1.5 pb-2">
            <PageLinkSelector
              value={(selectedElement.props.href as string)?.startsWith('#') ? (selectedElement.props.href as string) : ''}
              onChange={(v) => updateProp('href', v)}
              siteId={siteId}
            />
            <FieldRow label="URL" value={(selectedElement.props.href as string) || ''} onChange={(v) => updateProp('href', v)} placeholder="https://… or select a page above" />
            
            {/* Phone number / tel: link */}
            {(selectedElement.type === 'button' || selectedElement.type === 'link') && (
              <div className="space-y-1.5">
                <div className="flex items-start gap-2">
                  <span className="text-[10px] w-16 shrink-0 text-right pt-1.5" style={{ color: 'hsl(var(--studio-ink-3))' }}>
                    <span className="flex items-center gap-1 justify-end"><Phone className="h-3 w-3" /> Phone</span>
                  </span>
                  <div className="flex-1 space-y-1">
                    <input
                      value={(selectedElement.props.phoneNumber as string) || ''}
                      onChange={(e) => {
                        const num = e.target.value;
                        updateProp('phoneNumber', num);
                        if (num && !num.startsWith('http') && !num.startsWith('#') && !num.startsWith('/')) {
                          updateProp('href', `tel:${num.replace(/\s/g, '')}`);
                        }
                      }}
                      placeholder="+44 7700 900000"
                      className="w-full px-2 rounded text-[11px] outline-none transition-all"
                      style={{
                        backgroundColor: 'hsl(var(--studio-raised))',
                        border: `1px solid ${(selectedElement.props.phoneNumber as string) ? 'hsl(var(--studio-ok))' : 'hsl(var(--studio-line))'}`,
                        color: 'hsl(var(--studio-ink-2))',
                        height: '24px',
                        lineHeight: '24px',
                      }}
                      onFocus={(e) => { e.currentTarget.style.borderColor = 'hsl(var(--studio-ok))'; }}
                      onBlur={(e) => { e.currentTarget.style.borderColor = (selectedElement.props.phoneNumber as string) ? 'hsl(var(--studio-ok))' : 'hsl(var(--studio-line))'; }}
                    />
                    {(selectedElement.props.phoneNumber as string) && (
                      <div className="flex items-center gap-1.5 px-2 py-1 rounded" style={{ backgroundColor: 'rgba(34,197,94,0.08)', border: '1px solid rgba(34,197,94,0.15)' }}>
                        <Phone className="h-2.5 w-2.5" style={{ color: 'hsl(var(--studio-ok))' }} />
                        <span className="text-[9px] font-semibold" style={{ color: 'hsl(var(--studio-ok))' }}>
                          Calls {(selectedElement.props.phoneNumber as string)} on click
                        </span>
                        <button
                          onClick={() => {
                            updateProp('phoneNumber', '');
                            if ((selectedElement.props.href as string)?.startsWith('tel:')) {
                              updateProp('href', '');
                            }
                          }}
                          className="text-[9px] ml-auto hover:text-red-400 transition-colors"
                          style={{ color: 'hsl(var(--studio-ink-3))' }}
                        >
                          ✕
                        </button>
                      </div>
                    )}
                  </div>
                </div>
                {!(selectedElement.props.phoneNumber as string) && (
                  <div className="text-[9px] px-2 py-1 rounded ml-[72px]" style={{ color: 'hsl(var(--studio-ink-3))', backgroundColor: 'hsl(var(--studio-panel))' }}>
                    📞 Enter a phone number to make this button dial on the user's device
                  </div>
                )}
              </div>
            )}

            {(selectedElement.props.href) && (
              <>
                <FieldRow label="Target" value={(selectedElement.props.target as string) || ''} onChange={(v) => updateProp('target', v)} placeholder="_blank" />
                <ToggleRow label="New Tab" value={(selectedElement.props.openInNewTab as boolean) || false} onChange={(v) => updateProp('openInNewTab', v)} />
              </>
            )}
            {(selectedElement.type === 'button' || selectedElement.type === 'link') && (
              <>
                <ColorField label="Text" value={(selectedElement.props.textColor as string) || ''} onChange={(v) => updateProp('textColor', v)} />
                <ColorField label="BG" value={(selectedElement.props.bgColor as string) || ''} onChange={(v) => updateProp('bgColor', v)} />
              </>
            )}
            {selectedElement.type === 'image' && (
              <>
                <FieldRow label="Alt" value={(selectedElement.props.alt as string) || ''} onChange={(v) => updateProp('alt', v)} placeholder="Descriptive alt text" />
                <FieldRow label="Title" value={(selectedElement.props.title as string) || ''} onChange={(v) => updateProp('title', v)} placeholder="Image title" />
                <ToggleRow label="Lazy Load" value={(selectedElement.props.loading as string) === 'lazy'} onChange={(v) => updateProp('loading', v ? 'lazy' : 'eager')} />
              </>
            )}
            {!(selectedElement.props.href) && !(selectedElement.props.phoneNumber) && (
              <div className="text-[9px] px-2 py-1.5 rounded" style={{ color: 'hsl(var(--studio-ink-3))', backgroundColor: 'hsl(var(--studio-panel))' }}>
                🔗 Link this element to any page, URL, or phone number.
              </div>
            )}
          </div>
        )}
        {sectionDivider}

        {/* Accessibility */}
        <SectionHeader label="Accessibility" open={openSections.accessibility} onClick={() => toggle('accessibility')} icon={Accessibility} />
        {openSections.accessibility && (
          <div className="space-y-1.5 pb-2">
            <FieldRow label="Role" value={(selectedElement.props.role as string) || ''} onChange={(v) => updateProp('role', v)} placeholder="button, banner…" />
            <FieldRow label="Aria Label" value={(selectedElement.props.ariaLabel as string) || ''} onChange={(v) => updateProp('ariaLabel', v)} placeholder="Accessible label" />
            <FieldRow label="Aria Desc" value={(selectedElement.props.ariaDescribedBy as string) || ''} onChange={(v) => updateProp('ariaDescribedBy', v)} placeholder="description-id" />
            <FieldRow label="Tab Index" value={(selectedElement.props.tabIndex as string) || ''} onChange={(v) => updateProp('tabIndex', v)} placeholder="0" />
            <ToggleRow label="Aria Hidden" value={(selectedElement.props.ariaHidden as boolean) || false} onChange={(v) => updateProp('ariaHidden', v)} />
            <ToggleRow label="Focusable" value={(selectedElement.props.focusable as boolean) || false} onChange={(v) => updateProp('focusable', v)} />
          </div>
        )}
        {sectionDivider}

        {/* Custom Classes */}
        <SectionHeader label="Custom Classes" open={openSections.classes} onClick={() => toggle('classes')} icon={Code2} />
        {openSections.classes && (
          <div className="space-y-1.5 pb-2">
            <FieldRow label="Classes" value={(selectedElement.props.className as string) || ''} onChange={(v) => updateProp('className', v)} placeholder="my-class another-class" />
            <FieldRow label="Element ID" value={(selectedElement.props.elementId as string) || ''} onChange={(v) => updateProp('elementId', v)} placeholder="hero-section" />
            <div className="text-[9px] px-2 py-1 rounded" style={{ color: 'hsl(var(--studio-ink-3))', backgroundColor: 'hsl(var(--studio-panel))' }}>
              🔗 Use Element ID for anchor links: #hero-section
            </div>
            <div className="h-1" />
            <span className="text-[9px] font-semibold uppercase tracking-wider" style={{ color: 'hsl(var(--studio-ink-3))' }}>Custom Data Attributes</span>
            <FieldRow label="data-*" value={(selectedElement.props.dataAttr as string) || ''} onChange={(v) => updateProp('dataAttr', v)} placeholder="data-section=hero" />
            <FieldRow label="data-2" value={(selectedElement.props.dataAttr2 as string) || ''} onChange={(v) => updateProp('dataAttr2', v)} placeholder="data-analytics=cta" />
            <FieldRow label="data-3" value={(selectedElement.props.dataAttr3 as string) || ''} onChange={(v) => updateProp('dataAttr3', v)} placeholder="data-testid=button" />
          </div>
        )}
        {sectionDivider}

        {/* Conditional Visibility */}
        <SectionHeader label="Visibility & Settings" open={openSections.advanced} onClick={() => toggle('advanced')} icon={Shield} />
        {openSections.advanced && (
          <div className="space-y-1.5 pb-2">
            <span className="text-[9px] font-semibold uppercase tracking-wider" style={{ color: 'hsl(var(--studio-ink-3))' }}>Responsive Visibility</span>
            <ToggleRow label="Hide on Mobile" value={(selectedElement.props.hideOnMobile as boolean) || false} onChange={(v) => updateProp('hideOnMobile', v)} />
            <ToggleRow label="Hide on Tablet" value={(selectedElement.props.hideOnTablet as boolean) || false} onChange={(v) => updateProp('hideOnTablet', v)} />
            <ToggleRow label="Hide on Desktop" value={(selectedElement.props.hideOnDesktop as boolean) || false} onChange={(v) => updateProp('hideOnDesktop', v)} />
            <ToggleRow label="Require Auth" value={(selectedElement.props.requireAuth as boolean) || false} onChange={(v) => updateProp('requireAuth', v)} />

            <div className="h-[1px] my-1" style={{ backgroundColor: 'hsl(var(--studio-raised))' }} />
            <span className="text-[9px] font-semibold uppercase tracking-wider" style={{ color: 'hsl(var(--studio-ink-3))' }}>Background Video</span>
            <FieldRow label="Video URL" value={(selectedElement.props.bgVideoUrl as string) || ''} onChange={(v) => updateProp('bgVideoUrl', v)} placeholder="https://…mp4" />
            <FieldRow label="Poster" value={(selectedElement.props.bgVideoPoster as string) || ''} onChange={(v) => updateProp('bgVideoPoster', v)} placeholder="https://…jpg" />
            <ToggleRow label="Autoplay" value={(selectedElement.props.bgVideoAutoplay as boolean) ?? true} onChange={(v) => updateProp('bgVideoAutoplay', v)} />
            <ToggleRow label="Loop" value={(selectedElement.props.bgVideoLoop as boolean) ?? true} onChange={(v) => updateProp('bgVideoLoop', v)} />
            <ToggleRow label="Muted" value={(selectedElement.props.bgVideoMuted as boolean) ?? true} onChange={(v) => updateProp('bgVideoMuted', v)} />

            <div className="h-[1px] my-1" style={{ backgroundColor: 'hsl(var(--studio-raised))' }} />
            <span className="text-[9px] font-semibold uppercase tracking-wider" style={{ color: 'hsl(var(--studio-ink-3))' }}>Link Settings</span>
            <FieldRow label="Rel" value={(selectedElement.props.rel as string) || ''} onChange={(v) => updateProp('rel', v)} placeholder="nofollow noopener" />
            <ToggleRow label="Download" value={(selectedElement.props.download as boolean) || false} onChange={(v) => updateProp('download', v)} />

            {/* Component-specific props */}
            {selectedElement.type === 'input' && (
              <>
                <div className="h-[1px] my-1" style={{ backgroundColor: 'hsl(var(--studio-raised))' }} />
                <FieldRow label="Label" value={(selectedElement.props.label as string) || ''} onChange={(v) => updateProp('label', v)} />
                <FieldRow label="Placeholder" value={(selectedElement.props.placeholder as string) || ''} onChange={(v) => updateProp('placeholder', v)} />
                <FieldRow label="Type" value={(selectedElement.props.inputType as string) || ''} onChange={(v) => updateProp('inputType', v)} placeholder="text, email, number…" />
                <ToggleRow label="Required" value={(selectedElement.props.required as boolean) || false} onChange={(v) => updateProp('required', v)} />
                <FieldRow label="Pattern" value={(selectedElement.props.pattern as string) || ''} onChange={(v) => updateProp('pattern', v)} placeholder="[A-Za-z]+" />
                <FieldRow label="Min" value={(selectedElement.props.min as string) || ''} onChange={(v) => updateProp('min', v)} placeholder="0" />
                <FieldRow label="Max" value={(selectedElement.props.max as string) || ''} onChange={(v) => updateProp('max', v)} placeholder="100" />
                <FieldRow label="Autocomplete" value={(selectedElement.props.autocomplete as string) || ''} onChange={(v) => updateProp('autocomplete', v)} placeholder="email, name…" />
              </>
            )}
            {selectedElement.type === 'video' && (
              <>
                <FieldRow label="Source" value={(selectedElement.props.src as string) || ''} onChange={(v) => updateProp('src', v)} placeholder="https://…" />
                <ToggleRow label="Autoplay" value={(selectedElement.props.autoplay as boolean) || false} onChange={(v) => updateProp('autoplay', v)} />
                <ToggleRow label="Loop" value={(selectedElement.props.loop as boolean) || false} onChange={(v) => updateProp('loop', v)} />
                <ToggleRow label="Muted" value={(selectedElement.props.muted as boolean) || false} onChange={(v) => updateProp('muted', v)} />
                <ToggleRow label="Controls" value={(selectedElement.props.controls as boolean) ?? true} onChange={(v) => updateProp('controls', v)} />
                <ToggleRow label="PiP" value={(selectedElement.props.pip as boolean) || false} onChange={(v) => updateProp('pip', v)} />
              </>
            )}
            {(selectedElement.type === 'embed' || selectedElement.type === 'map') && (
              <FieldRow label="Embed URL" value={(selectedElement.props.embedUrl as string) || ''} onChange={(v) => updateProp('embedUrl', v)} placeholder="https://…" />
            )}
            {selectedElement.type === 'progress' && (
              <>
                <FieldRow label="Label" value={(selectedElement.props.label as string) || ''} onChange={(v) => updateProp('label', v)} />
                <FieldRow label="Value" value={String((selectedElement.props.value as number) || 0)} onChange={(v) => updateProp('value', Number(v))} placeholder="0-100" />
                <ToggleRow label="Show Value" value={(selectedElement.props.showValue as boolean) || false} onChange={(v) => updateProp('showValue', v)} />
                <FieldRow label="Color" value={(selectedElement.props.barColor as string) || ''} onChange={(v) => updateProp('barColor', v)} placeholder="hsl(var(--studio-accent))" />
              </>
            )}
            {selectedElement.type === 'countdown' && (
              <>
                <FieldRow label="Label" value={(selectedElement.props.label as string) || ''} onChange={(v) => updateProp('label', v)} />
                <FieldRow label="Target Date" value={(selectedElement.props.targetDate as string) || ''} onChange={(v) => updateProp('targetDate', v)} placeholder="2026-12-31" />
              </>
            )}
            {selectedElement.type === 'list' && (
              <>
                <FieldRow label="Items" value={((selectedElement.props.items as string[]) || []).join(', ')} onChange={(v) => updateProp('items', v.split(',').map(s => s.trim()))} placeholder="Item 1, Item 2" />
                <ToggleRow label="Ordered" value={(selectedElement.props.ordered as boolean) || false} onChange={(v) => updateProp('ordered', v)} />
              </>
            )}
            {selectedElement.type === 'tabs' && (
              <FieldRow label="Tab Labels" value={((selectedElement.props.tabs as string[]) || []).join(', ')} onChange={(v) => updateProp('tabs', v.split(',').map(s => s.trim()))} placeholder="Tab 1, Tab 2" />
            )}
            {selectedElement.type === 'accordion' && (
              <FieldRow label="Title" value={(selectedElement.props.title as string) || ''} onChange={(v) => updateProp('title', v)} />
            )}
            {selectedElement.type === 'table' && (
              <FieldRow label="Headers" value={((selectedElement.props.headers as string[]) || []).join(', ')} onChange={(v) => updateProp('headers', v.split(',').map(s => s.trim()))} placeholder="Col 1, Col 2" />
            )}
            {selectedElement.type === 'alert-banner' && (
              <>
                <FieldRow label="Text" value={(selectedElement.props.text as string) || ''} onChange={(v) => updateProp('text', v)} />
                <FieldRow label="Variant" value={(selectedElement.props.variant as string) || 'info'} onChange={(v) => updateProp('variant', v)} placeholder="info, success, warning, error" />
                <ToggleRow label="Dismissible" value={(selectedElement.props.dismissible as boolean) || false} onChange={(v) => updateProp('dismissible', v)} />
              </>
            )}
            {selectedElement.type === 'tag-pill' && (
              <>
                <FieldRow label="Text" value={(selectedElement.props.text as string) || ''} onChange={(v) => updateProp('text', v)} />
                <FieldRow label="Color" value={(selectedElement.props.color as string) || ''} onChange={(v) => updateProp('color', v)} placeholder="hsl(var(--studio-accent))" />
                <ToggleRow label="Removable" value={(selectedElement.props.removable as boolean) || false} onChange={(v) => updateProp('removable', v)} />
              </>
            )}
            {selectedElement.type === 'avatar' && (
              <>
                <FieldRow label="Image" value={(selectedElement.props.src as string) || ''} onChange={(v) => updateProp('src', v)} placeholder="https://…" />
                <FieldRow label="Initials" value={(selectedElement.props.initials as string) || ''} onChange={(v) => updateProp('initials', v)} placeholder="JD" />
                <FieldRow label="Size" value={String((selectedElement.props.size as number) || 48)} onChange={(v) => updateProp('size', Number(v))} placeholder="48" />
              </>
            )}
            {selectedElement.type === 'pagination' && (
              <>
                <FieldRow label="Pages" value={String((selectedElement.props.totalPages as number) || 10)} onChange={(v) => updateProp('totalPages', Number(v))} />
                <FieldRow label="Current" value={String((selectedElement.props.currentPage as number) || 1)} onChange={(v) => updateProp('currentPage', Number(v))} />
              </>
            )}
          </div>
        )}
      </div>
    </ScrollArea>
  );
}