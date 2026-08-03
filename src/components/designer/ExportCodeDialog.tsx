import { useState, useMemo, useEffect } from 'react';
import { useEditor } from './EditorContext';
import { exportToHTML, exportMultiPageSite } from './utils/htmlExporter';
import { X, Copy, Check, Download, FileCode, FileText, Braces, Image, ChevronDown, ExternalLink, Info } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { supabase } from '@/integrations/supabase/client';
import JSZip from 'jszip';

type CodeTab = 'html' | 'css' | 'js' | 'assets';

interface PageData {
  id: string;
  page_name: string;
  slug: string;
  is_homepage: boolean;
  elements: any[];
  seo_title?: string | null;
  seo_description?: string | null;
  page_settings?: any;
}

interface ExportCodeDialogProps {
  open: boolean;
  onClose: () => void;
  siteName: string;
  siteId?: string;
}

// Simple syntax highlighting
function highlightHTML(code: string): string {
  return code
    .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
    // Tags
    .replace(/(&lt;\/?)([\w-]+)/g, '$1<span class="hl-tag">$2</span>')
    // Attributes
    .replace(/\s([\w-]+)(=)/g, ' <span class="hl-attr">$1</span>$2')
    // Strings
    .replace(/(["'])(.*?)\1/g, '<span class="hl-str">$1$2$1</span>')
    // Comments
    .replace(/(&lt;!--.*?--&gt;)/gs, '<span class="hl-cmt">$1</span>');
}

function highlightCSS(code: string): string {
  return code
    .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
    // Comments
    .replace(/(\/\*[\s\S]*?\*\/)/g, '<span class="hl-cmt">$1</span>')
    // Selectors (before {)
    .replace(/^([^{}\n\/]+?)(\s*\{)/gm, '<span class="hl-sel">$1</span>$2')
    // Properties
    .replace(/\s\s([\w-]+)(:)/g, '  <span class="hl-prop">$1</span>$2')
    // Values with units
    .replace(/:([^;{}\n]+)(;)/g, ':<span class="hl-val">$1</span>$2')
    // @media
    .replace(/(@media[^{]+)/g, '<span class="hl-media">$1</span>');
}

function highlightJS(code: string): string {
  return code
    .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
    // Comments
    .replace(/(\/\/.*$)/gm, '<span class="hl-cmt">$1</span>')
    .replace(/(\/\*[\s\S]*?\*\/)/g, '<span class="hl-cmt">$1</span>')
    // Keywords
    .replace(/\b(var|let|const|function|return|if|else|for|forEach|new|this|typeof|document|window|true|false|null|undefined)\b/g, '<span class="hl-kw">$1</span>')
    // Strings
    .replace(/(["'`])((?:(?!\1).)*)\1/g, '<span class="hl-str">$1$2$1</span>')
    // Numbers
    .replace(/\b(\d+\.?\d*)\b/g, '<span class="hl-num">$1</span>')
    // Methods
    .replace(/\.([\w]+)\s*\(/g, '.<span class="hl-fn">$1</span>(');
}

const tabConfig: { key: CodeTab; label: string; icon: typeof FileCode }[] = [
  { key: 'html', label: 'HTML', icon: FileCode },
  { key: 'css', label: 'CSS', icon: FileText },
  { key: 'js', label: 'JS', icon: Braces },
  { key: 'assets', label: 'Assets', icon: Image },
];

export function ExportCodeDialog({ open, onClose, siteName, siteId }: ExportCodeDialogProps) {
  const { state } = useEditor();
  const [activeTab, setActiveTab] = useState<CodeTab>('html');
  const [copied, setCopied] = useState(false);
  const [pages, setPages] = useState<PageData[]>([]);
  const [selectedPageIdx, setSelectedPageIdx] = useState(0);
  const [exportMode, setExportMode] = useState<'single' | 'multi'>('multi');

  // Load all pages for multi-page export
  useEffect(() => {
    if (!open || !siteId) return;
    (async () => {
      const { data } = await supabase
        .from('designer_pages')
        .select('id, page_name, slug, is_homepage, elements, seo_title, seo_description, page_settings')
        .eq('site_id', siteId)
        .order('sort_order', { ascending: true });
      if (data) {
        setPages(data.map(p => ({ ...p, elements: (p.elements as any) || [], page_settings: (p.page_settings as any) || {} })));
        setSelectedPageIdx(0);
      }
    })();
  }, [open, siteId]);

  // Generate code for current view
  const currentPage = pages[selectedPageIdx];
  const elements = exportMode === 'single' && currentPage ? currentPage.elements : state.elements;
  const pageTitle = exportMode === 'single' && currentPage ? currentPage.page_name : siteName;

  const { html, css, js } = useMemo(() => {
    if (!open) return { html: '', css: '', js: '' };
    return exportToHTML(elements, pageTitle);
  }, [elements, pageTitle, open]);

  // Collect assets
  const assets = useMemo(() => {
    const urls: string[] = [];
    function walk(els: any[]) {
      for (const el of els) {
        if (el.props?.src && typeof el.props.src === 'string') urls.push(el.props.src);
        if (el.styles?.desktop?.backgroundImage) {
          const match = (el.styles.desktop.backgroundImage as string).match(/url\(["']?(.+?)["']?\)/);
          if (match) urls.push(match[1]);
        }
        if (el.children) walk(el.children);
      }
    }
    // Walk all pages for multi, or current for single
    if (exportMode === 'multi') {
      pages.forEach(p => walk(p.elements));
    } else {
      walk(elements);
    }
    return [...new Set(urls)];
  }, [elements, pages, exportMode, open]);

  const getContent = () => {
    switch (activeTab) {
      case 'html': return html;
      case 'css': return css;
      case 'js': return js;
      case 'assets': return assets.length > 0
        ? assets.map((url, i) => `/* Asset ${i + 1} */\n${url}`).join('\n\n')
        : '/* No assets used in this site */';
    }
  };

  const getHighlighted = () => {
    const content = getContent();
    switch (activeTab) {
      case 'html': return highlightHTML(content);
      case 'css': return highlightCSS(content);
      case 'js': return highlightJS(content);
      case 'assets': return content.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
    }
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(getContent());
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  };

  const handleDownload = async () => {
    const zip = new JSZip();

    if (exportMode === 'multi' && pages.length > 1) {
      // Multi-page export
      const { sharedCSS, sharedJS, pageFiles } = exportMultiPageSite(pages, siteName);
      zip.file('styles.css', sharedCSS);
      zip.file('script.js', sharedJS);
      
      for (const pf of pageFiles) {
        zip.file(pf.filename, pf.html);
      }
    } else {
      zip.file('index.html', html);
      zip.file('styles.css', css);
      zip.file('script.js', js);
    }

    // Assets manifest
    if (assets.length > 0) {
      const assetsFolder = zip.folder('assets');
      assetsFolder?.file('manifest.json', JSON.stringify(assets.map((url, i) => ({
        id: i + 1,
        url,
        filename: url.split('/').pop() || `asset-${i + 1}`,
      })), null, 2));
    }

    // README
    zip.file('README.md', `# ${siteName}\n\nExported from Workshop.\n\n## Structure\n\n${
      exportMode === 'multi' && pages.length > 1
        ? pages.map(p => `- \`${p.is_homepage ? 'index' : p.slug.replace(/^\/+/, '')}.html\` — ${p.page_name}`).join('\n')
        : '- `index.html` — Main page'
    }\n- \`styles.css\` — All styles\n- \`script.js\` — Interactive functionality\n- \`assets/\` — Images & media\n\n## Usage\n\nOpen \`index.html\` in any browser or deploy to any static hosting provider.\n`);

    const blob = await zip.generateAsync({ type: 'blob' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${siteName.replace(/\s+/g, '-').toLowerCase()}-export.zip`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const lineCount = getContent().split('\n').length;

  // File size estimates
  const sizeEstimate = useMemo(() => {
    if (!open) return { html: 0, css: 0, js: 0, total: 0 };
    const htmlSize = new Blob([html]).size;
    const cssSize = new Blob([css]).size;
    const jsSize = new Blob([js]).size;
    return { html: htmlSize, css: cssSize, js: jsSize, total: htmlSize + cssSize + jsSize };
  }, [html, css, js, open]);

  const formatSize = (bytes: number) => {
    if (bytes < 1024) return `${bytes} B`;
    return `${(bytes / 1024).toFixed(1)} KB`;
  };

  const currentTabSize = activeTab === 'html' ? sizeEstimate.html
    : activeTab === 'css' ? sizeEstimate.css
    : activeTab === 'js' ? sizeEstimate.js
    : 0;

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-[600] flex items-center justify-center"
          style={{ backgroundColor: 'rgba(0,0,0,0.75)' }}
          onClick={onClose}
        >
          <motion.div
            initial={{ scale: 0.95, opacity: 0, y: 10 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.95, opacity: 0, y: 10 }}
            transition={{ duration: 0.2, ease: [0.22, 1, 0.36, 1] }}
            className="w-[800px] max-h-[85vh] rounded-xl flex flex-col overflow-hidden"
            style={{ backgroundColor: 'hsl(var(--studio-sunken))', border: '1px solid hsl(var(--studio-line))', boxShadow: '0 32px 80px rgba(0,0,0,0.7)' }}
            onClick={e => e.stopPropagation()}
          >
            {/* Header */}
            <div className="flex items-center justify-between px-5 h-12 shrink-0" style={{ borderBottom: '1px solid hsl(var(--studio-line))' }}>
              <div className="flex items-center gap-3">
                <span className="text-[13px] font-bold text-white">Export Code</span>
                {pages.length > 1 && (
                  <div className="flex items-center h-6 rounded-md overflow-hidden" style={{ border: '1px solid hsl(var(--studio-line))' }}>
                    <button
                      onClick={() => setExportMode('multi')}
                      className="h-full px-2.5 text-[10px] font-semibold transition-colors"
                      style={{
                        backgroundColor: exportMode === 'multi' ? '#238636' : 'transparent',
                        color: exportMode === 'multi' ? 'hsl(var(--studio-ink))' : '#8b949e',
                      }}
                    >
                      All Pages
                    </button>
                    <button
                      onClick={() => setExportMode('single')}
                      className="h-full px-2.5 text-[10px] font-semibold transition-colors"
                      style={{
                        backgroundColor: exportMode === 'single' ? '#1f6feb' : 'transparent',
                        color: exportMode === 'single' ? 'hsl(var(--studio-ink))' : '#8b949e',
                      }}
                    >
                      Single Page
                    </button>
                  </div>
                )}
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={handleCopy}
                  className="h-7 px-3 flex items-center gap-1.5 rounded-md text-[11px] font-medium transition-colors"
                  style={{ backgroundColor: 'hsl(var(--studio-line))', color: '#c9d1d9', border: '1px solid hsl(var(--studio-line))' }}
                >
                  {copied ? <Check className="h-3 w-3" style={{ color: '#3fb950' }} /> : <Copy className="h-3 w-3" />}
                  {copied ? 'Copied!' : 'Copy'}
                </button>
                <button
                  onClick={handleDownload}
                  className="h-7 px-3 flex items-center gap-1.5 rounded-md text-[11px] font-semibold text-white transition-all hover:brightness-110"
                  style={{ background: '#238636' }}
                >
                  <Download className="h-3 w-3" /> Download ZIP
                </button>
                <button onClick={onClose} className="h-7 w-7 flex items-center justify-center rounded-md hover:bg-[hsl(var(--studio-line))] transition-colors">
                  <X className="h-4 w-4" style={{ color: '#8b949e' }} />
                </button>
              </div>
            </div>

            {/* Page selector for single-page mode */}
            {exportMode === 'single' && pages.length > 1 && (
              <div className="flex items-center gap-2 px-5 h-9 shrink-0" style={{ borderBottom: '1px solid hsl(var(--studio-line))', backgroundColor: 'hsl(var(--studio-panel))' }}>
                <span className="text-[10px] font-medium" style={{ color: '#8b949e' }}>Page:</span>
                <div className="flex gap-1">
                  {pages.map((p, i) => (
                    <button
                      key={p.id}
                      onClick={() => setSelectedPageIdx(i)}
                      className="h-6 px-2.5 rounded text-[10px] font-medium transition-colors"
                      style={{
                        backgroundColor: selectedPageIdx === i ? '#1f6feb' : 'hsl(var(--studio-line))',
                        color: selectedPageIdx === i ? 'hsl(var(--studio-ink))' : '#8b949e',
                      }}
                    >
                      {p.page_name}
                      {p.is_homepage && ' ⌂'}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Tabs */}
            <div className="flex px-5 gap-0 shrink-0" style={{ borderBottom: '1px solid hsl(var(--studio-line))', backgroundColor: 'hsl(var(--studio-panel))' }}>
              {tabConfig.map(tab => {
                const Icon = tab.icon;
                const isActive = activeTab === tab.key;
                return (
                  <button
                    key={tab.key}
                    onClick={() => setActiveTab(tab.key)}
                    className="h-10 px-4 flex items-center gap-1.5 text-[12px] font-semibold transition-colors relative"
                    style={{ color: isActive ? '#f0f6fc' : '#8b949e' }}
                  >
                    <Icon className="h-3.5 w-3.5" />
                    {tab.label}
                    {isActive && (
                      <motion.div
                        layoutId="export-tab"
                        className="absolute bottom-0 left-0 right-0 h-[2px]"
                        style={{ backgroundColor: '#f78166' }}
                      />
                    )}
                  </button>
                );
              })}
              <div className="flex-1" />
              <div className="flex items-center gap-3 self-center">
                {currentTabSize > 0 && (
                  <span className="text-[9px] font-mono px-1.5 py-0.5 rounded" style={{ backgroundColor: 'hsl(var(--studio-line))', color: '#7ee787' }}>
                    {formatSize(currentTabSize)}
                  </span>
                )}
                <span className="text-[10px] font-mono" style={{ color: '#484f58' }}>
                  {lineCount} lines
                </span>
              </div>
            </div>

            {/* Code with line numbers */}
            <div className="flex-1 overflow-auto" style={{ backgroundColor: 'hsl(var(--studio-sunken))' }}>
              <style dangerouslySetInnerHTML={{ __html: `
                .hl-tag { color: #7ee787; }
                .hl-attr { color: #79c0ff; }
                .hl-str { color: #a5d6ff; }
                .hl-cmt { color: #8b949e; font-style: italic; }
                .hl-sel { color: #d2a8ff; }
                .hl-prop { color: #79c0ff; }
                .hl-val { color: #a5d6ff; }
                .hl-media { color: #ff7b72; }
                .hl-kw { color: #ff7b72; }
                .hl-num { color: #79c0ff; }
                .hl-fn { color: #d2a8ff; }
              `}} />
              <div className="flex">
                {/* Line numbers */}
                <div className="shrink-0 py-4 pr-3 text-right select-none" style={{ minWidth: '52px', color: '#484f58', borderRight: '1px solid hsl(var(--studio-line))' }}>
                  {getContent().split('\n').map((_, i) => (
                    <div key={i} className="text-[11px] font-mono leading-5 px-2">{i + 1}</div>
                  ))}
                </div>
                {/* Code */}
                <pre className="flex-1 p-4 text-[12px] font-mono leading-5 whitespace-pre overflow-x-auto" style={{ color: '#c9d1d9' }}>
                  <code dangerouslySetInnerHTML={{ __html: getHighlighted() }} />
                </pre>
              </div>
            </div>

            {/* Footer */}
            <div className="flex items-center justify-between px-5 py-2.5 shrink-0" style={{ borderTop: '1px solid hsl(var(--studio-line))', backgroundColor: 'hsl(var(--studio-panel))' }}>
              <div className="flex items-center gap-1.5">
                <Info className="h-3 w-3" style={{ color: '#484f58' }} />
                <span className="text-[10px]" style={{ color: '#484f58' }}>
                  Clean, production-ready code. No frameworks or proprietary markup.
                </span>
              </div>
              <div className="flex items-center gap-3">
                <span className="text-[9px] font-mono px-1.5 py-0.5 rounded" style={{ backgroundColor: 'hsl(var(--studio-line))', color: '#79c0ff' }}>
                  Total: {formatSize(sizeEstimate.total)}
                </span>
                {exportMode === 'multi' && pages.length > 1 && (
                  <span className="text-[10px] font-medium" style={{ color: '#3fb950' }}>
                    {pages.length} pages linked
                  </span>
                )}
              </div>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
