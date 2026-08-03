import React, { useMemo, useState, useRef, useCallback, useEffect } from 'react';
import { Dialog, DialogContent } from '@/components/ui/dialog';
import { useEditor } from './EditorContext';
import { generateBodyHTML } from './utils/htmlExporter';
import { buildCSS } from './utils/cssCompiler';
import { generateJS } from './utils/jsGenerator';
import { X, Monitor, Tablet, Smartphone, Maximize2, Globe, ExternalLink, Share2, TerminalSquare, ChevronDown, AlertTriangle, Info, XCircle, Copy, Check } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';
import { EditorElement } from './types';

interface PreviewModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  siteName: string;
  siteId?: string;
}

type PreviewDevice = 'browser' | 'responsive' | 'desktop' | 'tablet' | 'mobile';

const DEVICES: { key: PreviewDevice; label: string; icon: typeof Monitor; width: string; frame?: { w: number; h: number; radius: string } }[] = [
  { key: 'browser', label: 'Browser', icon: Globe, width: '100%' },
  { key: 'responsive', label: 'Responsive', icon: Maximize2, width: '100%' },
  { key: 'desktop', label: 'Desktop', icon: Monitor, width: '100%', frame: { w: 1280, h: 800, radius: '12px' } },
  { key: 'tablet', label: 'Tablet', icon: Tablet, width: '768px', frame: { w: 768, h: 1024, radius: '24px' } },
  { key: 'mobile', label: 'Mobile', icon: Smartphone, width: '375px', frame: { w: 375, h: 812, radius: '36px' } },
];

interface ConsoleEntry {
  level: 'log' | 'warn' | 'error' | 'info';
  message: string;
  timestamp: number;
}

export function PreviewModal({ open, onOpenChange, siteName, siteId }: PreviewModalProps) {
  const { state } = useEditor();
  const [device, setDevice] = useState<PreviewDevice>('browser');
  const [consoleOpen, setConsoleOpen] = useState(false);
  const [consoleLogs, setConsoleLogs] = useState<ConsoleEntry[]>([]);
  const [linkCopied, setLinkCopied] = useState(false);
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const [allPages, setAllPages] = useState<{ id: string; slug: string; is_homepage: boolean; page_name: string; elements: EditorElement[] }[]>([]);

  // Load all pages for multi-page preview
  useEffect(() => {
    if (!open || !siteId) return;
    supabase.from('designer_pages')
      .select('id, slug, is_homepage, page_name, elements')
      .eq('site_id', siteId)
      .order('sort_order', { ascending: true })
      .then(({ data }) => {
        if (data) {
          setAllPages(data.map(p => ({ ...p, elements: (p.elements as any) || [] })));
        }
      });
  }, [open, siteId]);

  // Build multi-page preview HTML with client-side router
  const previewHTML = useMemo(() => {
    if (!open) return '';

    // Use DB pages but substitute the currently-edited page with live editor state
    // so unsaved changes appear instantly in preview
    const activePageId = state.activePage;
    const pages = allPages.length > 0
      ? allPages.map(p => 
          p.id === activePageId 
            ? { ...p, elements: state.elements }
            : p
        )
      : [{ id: 'fallback', slug: 'index', is_homepage: true, page_name: siteName, elements: state.elements }];
    
    // Build CSS and JS from all pages' elements
    const allElements = pages.flatMap(p => p.elements);
    const css = buildCSS(allElements);
    const js = generateJS(allElements);

    // Determine homepage slug — normalize "/" to "index" for consistent routing
    const rawHomepageSlug = pages.find(p => p.is_homepage)?.slug || pages[0]?.slug || 'index';
    const homepageSlug = rawHomepageSlug === '/' ? 'index' : rawHomepageSlug;

    // Build each page as a hidden section using normalized slug as data-page
    const pageSections = pages.map(page => {
      const bodyContent = generateBodyHTML(page.elements);
      const normalizedSlug = page.slug === '/' ? 'index' : page.slug;
      return `<div data-page="${normalizedSlug}" class="page-section" style="display:none">\n${bodyContent}\n</div>`;
    }).join('\n\n');

    // Build a slug lookup set for the router (with normalized slugs)
    const slugList = pages.map(p => `'${p.slug === '/' ? 'index' : p.slug}'`).join(',');

    // Client-side page router
    const routerScript = `
<script>
(function() {
  var pageSlugs = [${slugList}];
  var homepageSlug = '${homepageSlug}';
  
  function showPage(slug) {
    var allPageDivs = document.querySelectorAll('[data-page]');
    var found = false;
    allPageDivs.forEach(function(p) {
      if (p.getAttribute('data-page') === slug) {
        p.style.display = 'block';
        found = true;
      } else {
        p.style.display = 'none';
      }
    });
    if (!found) {
      // Show homepage if slug not found
      allPageDivs.forEach(function(p) {
        p.style.display = (p.getAttribute('data-page') === homepageSlug) ? 'block' : 'none';
      });
    }
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  // Intercept all clicks (buttons AND links)
  document.addEventListener('click', function(e) {
    // Handle <a> elements with href
    var link = e.target.closest('a[href]');
    if (link) {
      var href = link.getAttribute('href');
      if (!href) return;
      if (href === '#') { e.preventDefault(); return; }
      
      // Handle #slug page links
      if (href.startsWith('#') && href.length > 1 && !href.includes(' ')) {
        var slug = href.substring(1);
        if (pageSlugs.indexOf(slug) !== -1) {
          e.preventDefault();
          showPage(slug);
          return;
        }
      }
      
      // Handle .html file links
      if (href.endsWith('.html')) {
        e.preventDefault();
        var pageSlug = href === 'index.html' ? homepageSlug : href.replace('.html', '');
        showPage(pageSlug);
        return;
      }

      // External links - open in new tab
      if (href.startsWith('http')) {
        e.preventDefault();
        window.open(href, '_blank');
      }
      return;
    }
    
    // Handle <button> elements - prevent any default behavior
    var btn = e.target.closest('button');
    if (btn) {
      e.preventDefault();
    }
  });

  // Show homepage on load
  showPage(homepageSlug);
})();
</script>`;

    // Console capture script
    const consoleCapture = `
<script>
(function() {
  var origLog = console.log, origWarn = console.warn, origError = console.error, origInfo = console.info;
  function send(level, args) {
    try {
      window.parent.postMessage({ type: 'preview-console', level: level, message: Array.from(args).map(function(a) { return typeof a === 'object' ? JSON.stringify(a, null, 2) : String(a); }).join(' ') }, '*');
    } catch(e) {}
  }
  console.log = function() { send('log', arguments); origLog.apply(console, arguments); };
  console.warn = function() { send('warn', arguments); origWarn.apply(console, arguments); };
  console.error = function() { send('error', arguments); origError.apply(console, arguments); };
  console.info = function() { send('info', arguments); origInfo.apply(console, arguments); };
  window.onerror = function(msg, url, line) { send('error', ['Error: ' + msg + ' (line ' + line + ')']); };
  window.addEventListener('unhandledrejection', function(e) { send('error', ['Unhandled Promise: ' + e.reason]); });
})();
</script>`;

    const interactiveStyles = `
<style>
  *, *::before, *::after { box-sizing: border-box; }
  html { scroll-behavior: smooth; }
  body { margin: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; }
  input, textarea, select { outline: none; transition: border-color 0.2s ease, box-shadow 0.2s ease; }
  input:focus, textarea:focus, select:focus { border-color: hsl(var(--studio-accent)) !important; box-shadow: 0 0 0 3px hsl(var(--studio-accent) / 0.15); }
  a, button { cursor: pointer; }
  button:active, a:active { transform: scale(0.97); }
  [data-animate] { opacity: 0; transform: translateY(20px); transition: opacity 0.6s ease, transform 0.6s ease; }
  [data-animate].is-visible { opacity: 1; transform: translateY(0); }
  @keyframes marquee { from { transform: translateX(0); } to { transform: translateX(-50%); } }
  ::selection { background: hsl(var(--studio-accent) / 0.3); }
  details summary { cursor: pointer; }
  details[open] summary ~ * { animation: fadeIn 0.3s ease; }
  @keyframes fadeIn { from { opacity: 0; transform: translateY(-8px); } to { opacity: 1; transform: translateY(0); } }
  .page-section { min-height: 100vh; }
</style>`;

    const fullHTML = `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>${siteName} — Preview</title>
    ${interactiveStyles}
    <style>${css}</style>
</head>
<body>

${pageSections}

${consoleCapture}
<script>${js}</script>
${routerScript}
</body>
</html>`;

    return fullHTML;
  }, [open, state.elements, siteName, allPages]);

  // Listen for console messages from iframe
  useEffect(() => {
    if (!open) return;
    const handler = (e: MessageEvent) => {
      if (e.data?.type === 'preview-console') {
        setConsoleLogs(prev => [...prev.slice(-200), {
          level: e.data.level,
          message: e.data.message,
          timestamp: Date.now(),
        }]);
      }
    };
    window.addEventListener('message', handler);
    return () => window.removeEventListener('message', handler);
  }, [open]);

  // Clear console on open
  useEffect(() => {
    if (open) setConsoleLogs([]);
  }, [open]);

  const openInNewTab = useCallback(() => {
    const blob = new Blob([previewHTML], { type: 'text/html' });
    const url = URL.createObjectURL(blob);
    window.open(url, '_blank');
    // Revoke after a delay
    setTimeout(() => URL.revokeObjectURL(url), 60000);
  }, [previewHTML]);

  const copyShareLink = useCallback(() => {
    // In production, this would generate a temporary share link
    // For now, show a toast about the feature
    navigator.clipboard.writeText(window.location.href);
    setLinkCopied(true);
    toast.success('Preview link copied to clipboard');
    setTimeout(() => setLinkCopied(false), 2000);
  }, []);

  const activeDevice = DEVICES.find(d => d.key === device)!;

  const consoleLogColors: Record<string, string> = {
    log: 'hsl(var(--studio-ink))',
    info: 'hsl(var(--studio-accent))',
    warn: 'hsl(var(--studio-warn))',
    error: 'hsl(var(--studio-risk))',
  };
  const consoleLogIcons: Record<string, typeof Info> = {
    log: Info,
    info: Info,
    warn: AlertTriangle,
    error: XCircle,
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-[95vw] h-[92vh] p-0 gap-0 border-0 rounded-lg overflow-hidden flex flex-col" style={{ backgroundColor: 'hsl(var(--studio-panel))' }}>
        {/* Top bar */}
        <div className="flex items-center justify-between px-4 h-12 shrink-0" style={{ borderBottom: '1px solid hsl(var(--studio-line))' }}>
          <div className="flex items-center gap-3">
            <span className="text-[11px] font-medium" style={{ color: 'hsl(var(--studio-ink-2))' }}>Preview — {siteName}</span>
            {/* Test mode badge */}
            <span className="text-[9px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full" style={{ backgroundColor: 'rgba(251,191,36,0.15)', color: 'hsl(var(--studio-warn))', border: '1px solid rgba(251,191,36,0.3)' }}>
              Live Preview
            </span>
          </div>

          {/* Device switcher */}
          <div className="flex items-center gap-0 rounded-lg p-0.5" style={{ backgroundColor: 'hsl(var(--studio-raised))', border: '1px solid hsl(var(--studio-line))' }}>
            {DEVICES.map(d => {
              const Icon = d.icon;
              const active = device === d.key;
              return (
                <button
                  key={d.key}
                  onClick={() => setDevice(d.key)}
                  className="h-7 px-3 flex items-center gap-1.5 rounded-md text-[10px] font-medium transition-all"
                  style={{
                    backgroundColor: active ? 'hsl(var(--studio-accent))' : 'transparent',
                    color: active ? 'hsl(var(--studio-ink))' : 'hsl(var(--studio-ink-2))',
                  }}
                >
                  <Icon className="h-3.5 w-3.5" />
                  {d.label}
                </button>
              );
            })}
          </div>

          {/* Action buttons */}
          <div className="flex items-center gap-1">
            <button
              onClick={() => setConsoleOpen(!consoleOpen)}
              className="h-7 px-2.5 flex items-center gap-1.5 rounded text-[10px] font-medium transition-colors"
              style={{
                backgroundColor: consoleOpen ? '#1e3a5f' : 'transparent',
                color: consoleOpen ? 'hsl(var(--studio-accent))' : 'hsl(var(--studio-ink-2))',
              }}
              title="Toggle Console"
            >
              <TerminalSquare className="h-3.5 w-3.5" />
              Console
              {consoleLogs.filter(l => l.level === 'error').length > 0 && (
                <span className="ml-1 w-4 h-4 rounded-full flex items-center justify-center text-[8px] font-bold" style={{ backgroundColor: 'hsl(var(--studio-risk))', color: 'hsl(var(--studio-ink))' }}>
                  {consoleLogs.filter(l => l.level === 'error').length}
                </span>
              )}
            </button>
            <button
              onClick={copyShareLink}
              className="h-7 px-2.5 flex items-center gap-1.5 rounded text-[10px] font-medium transition-colors hover:bg-[hsl(var(--studio-hover))]"
              style={{ color: 'hsl(var(--studio-ink-2))' }}
              title="Share Preview"
            >
              {linkCopied ? <Check className="h-3.5 w-3.5" style={{ color: 'hsl(var(--studio-ok))' }} /> : <Share2 className="h-3.5 w-3.5" />}
            </button>
            <button
              onClick={openInNewTab}
              className="h-7 px-2.5 flex items-center gap-1.5 rounded text-[10px] font-medium transition-colors hover:bg-[hsl(var(--studio-hover))]"
              style={{ color: 'hsl(var(--studio-ink-2))' }}
              title="Open in New Tab"
            >
              <ExternalLink className="h-3.5 w-3.5" />
            </button>
            <button
              onClick={() => onOpenChange(false)}
              className="h-7 w-7 flex items-center justify-center rounded hover:bg-[hsl(var(--studio-hover))] transition-colors"
            >
              <X className="h-3.5 w-3.5" style={{ color: 'hsl(var(--studio-ink-2))' }} />
            </button>
          </div>
        </div>

        {/* Preview area */}
        <div className="flex-1 flex flex-col overflow-hidden" style={{ minHeight: 0 }}>
          <div className="flex-1 flex justify-center overflow-hidden" style={{
            backgroundColor: 'hsl(var(--studio-sunken))',
            padding: device === 'browser' || device === 'responsive' ? '0' : '24px',
            alignItems: device === 'browser' || device === 'responsive' ? 'stretch' : 'flex-start',
          }}>
            <motion.div
              layout
              transition={{ type: 'spring', stiffness: 300, damping: 30 }}
              style={{
                width: activeDevice.width,
                maxWidth: '100%',
                height: device === 'browser' || device === 'responsive' ? '100%' : undefined,
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
                  <div style={{
                    flex: 1, height: '22px', borderRadius: '4px', backgroundColor: 'hsl(var(--studio-panel))',
                    border: '1px solid hsl(var(--studio-line))', display: 'flex', alignItems: 'center',
                    padding: '0 10px', fontSize: '10px', color: 'hsl(var(--studio-ink-3))',
                  }}>
                    🔒 https://{siteName.toLowerCase().replace(/\s+/g, '-')}.quooro-sites.com
                  </div>
                </div>
              )}

              {/* Device frame */}
              {activeDevice.frame && device !== 'responsive' && device !== 'browser' && (
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
              {/* Notch for mobile */}
              {device === 'mobile' && (
                <div style={{
                  position: 'absolute', top: '-10px', left: '50%', transform: 'translateX(-50%)',
                  width: '120px', height: '24px', backgroundColor: 'hsl(var(--studio-panel))',
                  borderRadius: '0 0 16px 16px', zIndex: 20,
                  border: '2px solid hsl(var(--studio-line))', borderTop: 'none',
                }} />
              )}

              <iframe
                ref={iframeRef}
                srcDoc={previewHTML}
                className="border-none"
                title="Live Preview"
                sandbox="allow-scripts allow-forms allow-modals allow-popups allow-same-origin allow-popups-to-escape-sandbox"
                allow="clipboard-write; fullscreen"
                style={{
                  width: '100%',
                  flex: device === 'browser' || device === 'responsive' ? '1' : undefined,
                  height: device === 'browser' || device === 'responsive' ? undefined : device === 'mobile' ? '812px' : device === 'tablet' ? '1024px' : '800px',
                  backgroundColor: 'hsl(var(--studio-ink))',
                  borderRadius: device === 'browser' || device === 'responsive' ? '0' : (activeDevice.frame?.radius || '8px'),
                  overflow: 'hidden',
                }}
              />

              {/* Device label */}
              {device !== 'responsive' && device !== 'browser' && (
                <div style={{
                  textAlign: 'center', marginTop: '16px',
                  fontSize: '10px', fontWeight: 600, color: 'hsl(var(--studio-ink-3))',
                  letterSpacing: '0.06em', textTransform: 'uppercase',
                }}>
                  {activeDevice.label} — {activeDevice.frame?.w}×{activeDevice.frame?.h}
                </div>
              )}
            </motion.div>
          </div>

          {/* Console panel */}
          <AnimatePresence>
            {consoleOpen && (
              <motion.div
                initial={{ height: 0 }}
                animate={{ height: 180 }}
                exit={{ height: 0 }}
                transition={{ duration: 0.2 }}
                style={{
                  borderTop: '1px solid hsl(var(--studio-line))',
                  backgroundColor: 'hsl(var(--studio-sunken))',
                  overflow: 'hidden',
                }}
              >
                <div className="flex items-center justify-between px-3 h-7 shrink-0" style={{ borderBottom: '1px solid hsl(var(--studio-line))', backgroundColor: 'hsl(var(--studio-panel))' }}>
                  <span className="text-[10px] font-medium" style={{ color: 'hsl(var(--studio-ink-2))' }}>Console</span>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => setConsoleLogs([])}
                      className="text-[9px] px-1.5 rounded hover:bg-[hsl(var(--studio-hover))] transition-colors"
                      style={{ color: 'hsl(var(--studio-ink-3))' }}
                    >
                      Clear
                    </button>
                  </div>
                </div>
                <div className="overflow-y-auto" style={{ height: 'calc(100% - 28px)', fontFamily: "'SF Mono', 'Fira Code', monospace", fontSize: '11px' }}>
                  {consoleLogs.length === 0 && (
                    <div className="flex items-center justify-center h-full" style={{ color: 'hsl(var(--studio-hover))' }}>
                      <span className="text-[10px]">No console output yet — interact with the preview</span>
                    </div>
                  )}
                  {consoleLogs.map((entry, i) => {
                    const Icon = consoleLogIcons[entry.level] || Info;
                    return (
                      <div
                        key={i}
                        className="flex items-start gap-2 px-3 py-1 border-b"
                        style={{
                          borderColor: 'hsl(var(--studio-line))',
                          backgroundColor: entry.level === 'error' ? 'rgba(220,38,38,0.05)' : entry.level === 'warn' ? 'rgba(251,191,36,0.03)' : 'transparent',
                          color: consoleLogColors[entry.level],
                        }}
                      >
                        <Icon className="h-3 w-3 mt-0.5 shrink-0" style={{ opacity: 0.6 }} />
                        <span className="whitespace-pre-wrap break-all">{entry.message}</span>
                        <span className="ml-auto text-[9px] shrink-0" style={{ color: 'hsl(var(--studio-hover))' }}>
                          {new Date(entry.timestamp).toLocaleTimeString('en-GB', { hour12: false })}
                        </span>
                      </div>
                    );
                  })}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </DialogContent>
    </Dialog>
  );
}
