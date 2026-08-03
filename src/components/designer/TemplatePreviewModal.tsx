import { useState, useMemo, useEffect } from 'react';
import { Dialog, DialogContent, DialogTitle } from '@/components/ui/dialog';
import { DesignerTemplate, EditorElement } from './types';
import { exportToHTML } from './utils/htmlExporter';
import { X, Monitor, Tablet, Smartphone, Globe, ChevronLeft, ChevronRight } from 'lucide-react';
import { motion } from 'framer-motion';

interface TemplatePreviewModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  template: DesignerTemplate | null;
}

type PreviewDevice = 'browser' | 'desktop' | 'tablet' | 'mobile';

const DEVICES: { key: PreviewDevice; label: string; icon: typeof Monitor; width: string; frame?: { w: number; h: number; radius: string } }[] = [
  { key: 'browser', label: 'Browser', icon: Globe, width: '100%' },
  { key: 'desktop', label: 'Desktop', icon: Monitor, width: '100%', frame: { w: 1280, h: 800, radius: '12px' } },
  { key: 'tablet', label: 'Tablet', icon: Tablet, width: '768px', frame: { w: 768, h: 1024, radius: '24px' } },
  { key: 'mobile', label: 'Mobile', icon: Smartphone, width: '375px', frame: { w: 375, h: 812, radius: '36px' } },
];

export function TemplatePreviewModal({ open, onOpenChange, template }: TemplatePreviewModalProps) {
  const [device, setDevice] = useState<PreviewDevice>('browser');
  const [activePageIndex, setActivePageIndex] = useState(0);

  const pages = useMemo(() => {
    if (!template) return [];
    if (template.pages && template.pages.length > 0) return template.pages;
    return [{ name: 'Home', slug: '/', elements: template.elements }];
  }, [template]);

  // Reset page index when template changes
  useEffect(() => { setActivePageIndex(0); }, [template?.id]);

  const previewHTML = useMemo(() => {
    if (!open || !template || pages.length === 0) return '';
    const currentPage = pages[activePageIndex] || pages[0];
    const { html, css, js } = exportToHTML(currentPage.elements, template.name);

    // Inject page navigation script that intercepts link clicks
    const navScript = `
      <script>
        document.addEventListener('click', function(e) {
          var link = e.target.closest('a[href]');
          if (!link) return;
          var href = link.getAttribute('href');
          if (href && href.startsWith('/')) {
            e.preventDefault();
            window.parent.postMessage({ type: 'TEMPLATE_NAV', slug: href }, '*');
          }
        });
      </script>
    `;

    return html
      .replace('<link rel="stylesheet" href="styles.css">', `<style>${css}</style>`)
      .replace('<script src="script.js" defer></script>', `<script>${js}</script>${navScript}`);
  }, [open, template, pages, activePageIndex]);

  // Listen for navigation messages from iframe
  useEffect(() => {
    if (!open) return;
    const handler = (e: MessageEvent) => {
      if (e.data?.type === 'TEMPLATE_NAV' && e.data.slug) {
        const idx = pages.findIndex(p => p.slug === e.data.slug);
        if (idx >= 0) setActivePageIndex(idx);
      }
    };
    window.addEventListener('message', handler);
    return () => window.removeEventListener('message', handler);
  }, [open, pages]);

  if (!template) return null;

  const activeDevice = DEVICES.find(d => d.key === device)!;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-[95vw] h-[92vh] p-0 gap-0 border-0 rounded-lg overflow-hidden flex flex-col" style={{ backgroundColor: 'hsl(var(--studio-panel))' }}>
        <DialogTitle className="sr-only">Template Preview — {template.name}</DialogTitle>
        {/* Top bar */}
        <div className="flex items-center justify-between px-4 h-12 shrink-0" style={{ borderBottom: '1px solid hsl(var(--studio-line))' }}>
          <span className="text-[11px] font-medium truncate max-w-[200px]" style={{ color: 'hsl(var(--studio-ink-2))' }}>
            Preview — {template.name}
          </span>

          {/* Page tabs */}
          {pages.length > 1 && (
            <div className="flex items-center gap-0 rounded-lg p-0.5 mx-2" style={{ backgroundColor: 'hsl(var(--studio-raised))', border: '1px solid hsl(var(--studio-line))' }}>
              {pages.map((page, i) => (
                <button
                  key={page.slug}
                  onClick={() => setActivePageIndex(i)}
                  className="h-7 px-3 flex items-center gap-1.5 rounded-md text-[10px] font-medium transition-all"
                  style={{
                    backgroundColor: activePageIndex === i ? 'hsl(var(--studio-accent))' : 'transparent',
                    color: activePageIndex === i ? 'hsl(var(--studio-ink))' : 'hsl(var(--studio-ink-2))',
                  }}
                >
                  {page.name}
                </button>
              ))}
            </div>
          )}

          {/* Device switcher */}
          <div className="flex items-center gap-0 rounded-lg p-0.5" style={{ backgroundColor: 'hsl(var(--studio-raised))', border: '1px solid hsl(var(--studio-line))' }}>
            {DEVICES.map(d => {
              const Icon = d.icon;
              const active = device === d.key;
              return (
                <button
                  key={d.key}
                  onClick={() => setDevice(d.key)}
                  className="h-7 px-2.5 flex items-center gap-1 rounded-md text-[10px] font-medium transition-all"
                  style={{
                    backgroundColor: active ? 'hsl(var(--studio-accent))' : 'transparent',
                    color: active ? 'hsl(var(--studio-ink))' : 'hsl(var(--studio-ink-2))',
                  }}
                >
                  <Icon className="h-3.5 w-3.5" />
                  <span className="hidden sm:inline">{d.label}</span>
                </button>
              );
            })}
          </div>

          <button
            onClick={() => onOpenChange(false)}
            className="h-7 w-7 flex items-center justify-center rounded hover:bg-[hsl(var(--studio-hover))] transition-colors"
          >
            <X className="h-3.5 w-3.5" style={{ color: 'hsl(var(--studio-ink-2))' }} />
          </button>
        </div>

        {/* Preview area */}
        <div className="flex-1 flex justify-center overflow-hidden" style={{
          backgroundColor: 'hsl(var(--studio-sunken))',
          padding: device === 'browser' ? '0' : '24px',
          alignItems: device === 'browser' ? 'stretch' : 'flex-start',
        }}>
          <motion.div
            layout
            transition={{ type: 'spring', stiffness: 300, damping: 30 }}
            style={{
              width: activeDevice.width,
              maxWidth: '100%',
              height: device === 'browser' ? '100%' : undefined,
              maxHeight: device === 'mobile' ? '812px' : device === 'tablet' ? '1024px' : '100%',
              position: 'relative',
              display: 'flex',
              flexDirection: 'column',
            }}
          >
            {/* Browser chrome bar */}
            {device === 'browser' && (
              <div style={{
                height: '36px', display: 'flex', alignItems: 'center', gap: '8px',
                padding: '0 12px', backgroundColor: 'hsl(var(--studio-raised))',
                borderBottom: '1px solid hsl(var(--studio-line))',
              }}>
                <div style={{ display: 'flex', gap: '6px' }}>
                  <div style={{ width: 10, height: 10, borderRadius: '50%', backgroundColor: '#ff5f57' }} />
                  <div style={{ width: 10, height: 10, borderRadius: '50%', backgroundColor: '#febc2e' }} />
                  <div style={{ width: 10, height: 10, borderRadius: '50%', backgroundColor: '#28c840' }} />
                </div>
                <div className="flex items-center gap-1.5" style={{ flex: 1 }}>
                  <button
                    onClick={() => setActivePageIndex(Math.max(0, activePageIndex - 1))}
                    disabled={activePageIndex === 0}
                    className="h-5 w-5 flex items-center justify-center rounded transition-colors"
                    style={{ opacity: activePageIndex === 0 ? 0.3 : 0.6 }}
                  >
                    <ChevronLeft className="h-3 w-3" style={{ color: 'hsl(var(--studio-ink-2))' }} />
                  </button>
                  <button
                    onClick={() => setActivePageIndex(Math.min(pages.length - 1, activePageIndex + 1))}
                    disabled={activePageIndex >= pages.length - 1}
                    className="h-5 w-5 flex items-center justify-center rounded transition-colors"
                    style={{ opacity: activePageIndex >= pages.length - 1 ? 0.3 : 0.6 }}
                  >
                    <ChevronRight className="h-3 w-3" style={{ color: 'hsl(var(--studio-ink-2))' }} />
                  </button>
                  <div style={{
                    flex: 1, height: '22px', borderRadius: '4px', backgroundColor: 'hsl(var(--studio-panel))',
                    border: '1px solid hsl(var(--studio-line))', display: 'flex', alignItems: 'center',
                    padding: '0 10px', fontSize: '10px', color: 'hsl(var(--studio-ink-3))',
                  }}>
                    {template.name.toLowerCase().replace(/\s+/g, '-')}.com{pages[activePageIndex]?.slug !== '/' ? pages[activePageIndex]?.slug : ''}
                  </div>
                </div>
              </div>
            )}

            {/* Device frame */}
            {activeDevice.frame && device !== 'browser' && (
              <div
                style={{
                  position: 'absolute',
                  inset: device === 'mobile' ? '-16px -8px' : device === 'tablet' ? '-12px -8px' : '-8px -4px',
                  borderRadius: activeDevice.frame.radius,
                  border: `${device === 'mobile' ? '3px' : '2px'} solid hsl(var(--studio-line))`,
                  pointerEvents: 'none',
                  zIndex: 10,
                }}
              />
            )}
            {device === 'mobile' && (
              <div style={{
                position: 'absolute', top: '-10px', left: '50%', transform: 'translateX(-50%)',
                width: '120px', height: '24px', backgroundColor: 'hsl(var(--studio-panel))',
                borderRadius: '0 0 16px 16px', zIndex: 20,
                border: '2px solid hsl(var(--studio-line))', borderTop: 'none',
              }} />
            )}

            <iframe
              key={`${template.id}-${activePageIndex}`}
              srcDoc={previewHTML}
              className="border-none"
              title="Template Preview"
              sandbox="allow-scripts"
              style={{
                width: '100%',
                flex: device === 'browser' ? '1' : undefined,
                height: device === 'browser' ? undefined : device === 'mobile' ? '812px' : device === 'tablet' ? '1024px' : '800px',
                backgroundColor: 'hsl(var(--studio-ink))',
                borderRadius: device === 'browser' ? '0' : (activeDevice.frame?.radius || '8px'),
                overflow: 'hidden',
              }}
            />

            {activeDevice.frame && device !== 'browser' && (
              <div style={{
                textAlign: 'center', marginTop: '16px',
                fontSize: '10px', fontWeight: 600, color: 'hsl(var(--studio-ink-3))',
                letterSpacing: '0.06em', textTransform: 'uppercase',
              }}>
                {activeDevice.label} — {activeDevice.frame.w}×{activeDevice.frame.h}
              </div>
            )}
          </motion.div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
