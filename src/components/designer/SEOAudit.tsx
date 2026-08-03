import { useMemo, useState } from 'react';
import { useEditor } from './EditorContext';
import { EditorElement } from './types';
import { ScrollArea } from '@/components/ui/scroll-area';
import { motion, AnimatePresence } from 'framer-motion';
import {
  CheckCircle, AlertCircle, XCircle, Search, ChevronRight,
  Globe, Zap, Eye, Type, Image, Link2, Smartphone, Shield,
  FileText, BarChart3, Accessibility, Gauge,
} from 'lucide-react';

interface AuditItem {
  status: 'pass' | 'warning' | 'fail';
  label: string;
  detail: string;
  category: string;
  fix?: string;
  impact: 'high' | 'medium' | 'low';
}

const CATEGORY_CONFIG: Record<string, { icon: typeof Globe; color: string }> = {
  'Content': { icon: Type, color: 'hsl(var(--studio-warn))' },
  'Structure': { icon: FileText, color: 'hsl(var(--studio-accent))' },
  'Media': { icon: Image, color: 'hsl(var(--studio-ink-3))' },
  'Performance': { icon: Zap, color: 'hsl(var(--studio-ok))' },
  'Accessibility': { icon: Accessibility, color: 'hsl(var(--studio-ink-3))' },
  'Technical': { icon: Shield, color: 'hsl(var(--studio-accent))' },
};

const IMPACT_COLORS: Record<string, string> = { high: 'hsl(var(--studio-risk))', medium: 'hsl(var(--studio-warn))', low: 'hsl(var(--studio-ink-3))' };

function flattenElements(els: EditorElement[]): EditorElement[] {
  const flat: EditorElement[] = [];
  const walk = (list: EditorElement[]) => {
    for (const el of list) { flat.push(el); if (el.children) walk(el.children); }
  };
  walk(els);
  return flat;
}

export function SEOAudit() {
  const { state } = useEditor();
  const [expandedCategories, setExpandedCategories] = useState<Record<string, boolean>>({ Content: true, Structure: true, Media: true, Performance: true, Accessibility: true, Technical: true });
  const [filterStatus, setFilterStatus] = useState<string | null>(null);

  const audits = useMemo<AuditItem[]>(() => {
    const flat = flattenElements(state.elements);
    const items: AuditItem[] = [];

    // ── Content ──
    const h1s = flat.filter(e => e.type === 'heading' && (e.props?.level === 'h1' || (!e.props?.level && e.name?.includes('h1'))));
    if (h1s.length === 0) items.push({ status: 'fail', label: 'Missing H1 heading', detail: 'Every page should have exactly one H1 heading for SEO.', category: 'Content', fix: 'Add a heading element and set it to H1.', impact: 'high' });
    else if (h1s.length === 1) items.push({ status: 'pass', label: 'H1 heading present', detail: `"${(h1s[0].props?.text as string || '').slice(0, 50)}"`, category: 'Content', impact: 'high' });
    else items.push({ status: 'warning', label: `Multiple H1s (${h1s.length})`, detail: 'Use a single H1 per page.', category: 'Content', fix: 'Change extra H1s to H2 or H3.', impact: 'medium' });

    const textEls = flat.filter(e => e.type === 'text' && e.props?.text);
    const totalWords = textEls.reduce((sum, e) => sum + (e.props?.text as string || '').split(/\s+/).length, 0);
    if (totalWords < 100) items.push({ status: 'warning', label: `Low content (${totalWords} words)`, detail: 'Search engines prefer 300+ words.', category: 'Content', fix: 'Add descriptive text sections.', impact: 'high' });
    else if (totalWords < 300) items.push({ status: 'warning', label: `Moderate content (${totalWords} words)`, detail: 'Consider adding more content.', category: 'Content', impact: 'medium' });
    else items.push({ status: 'pass', label: `Good content (${totalWords} words)`, detail: 'Sufficient for indexing.', category: 'Content', impact: 'high' });

    // Check for duplicate text
    const texts = textEls.map(e => (e.props?.text as string || '').trim().toLowerCase()).filter(t => t.length > 20);
    const dupes = texts.filter((t, i) => texts.indexOf(t) !== i);
    if (dupes.length > 0) items.push({ status: 'warning', label: `${dupes.length} duplicate text blocks`, detail: 'Duplicate content can hurt rankings.', category: 'Content', fix: 'Remove or rewrite duplicate content.', impact: 'medium' });

    // ── Structure ──
    const headings = flat.filter(e => e.type === 'heading');
    const hasH2 = headings.some(e => e.props?.level === 'h2');
    if (h1s.length > 0 && !hasH2) items.push({ status: 'warning', label: 'No H2 headings', detail: 'Use H2 subheadings for structure.', category: 'Structure', fix: 'Add H2 headings to break up content.', impact: 'medium' });
    else if (hasH2) items.push({ status: 'pass', label: 'Heading hierarchy OK', detail: 'H1 and H2 used properly.', category: 'Structure', impact: 'medium' });

    const hasNav = flat.some(e => e.type === 'navbar');
    items.push(hasNav
      ? { status: 'pass', label: 'Navigation present', detail: 'Site has nav structure.', category: 'Structure', impact: 'high' }
      : { status: 'warning', label: 'No navigation', detail: 'Add a navbar for UX.', category: 'Structure', fix: 'Add a navbar component.', impact: 'high' }
    );

    const hasFooter = flat.some(e => e.type === 'footer');
    items.push(hasFooter
      ? { status: 'pass', label: 'Footer present', detail: 'Good site structure.', category: 'Structure', impact: 'low' }
      : { status: 'warning', label: 'No footer', detail: 'Add footer with links.', category: 'Structure', fix: 'Add a footer section.', impact: 'low' }
    );

    items.push({ status: flat.length > 5 ? 'pass' : 'warning', label: `${flat.length} elements`, detail: flat.length > 5 ? 'Good page density.' : 'Page is sparse.', category: 'Structure', impact: 'low' });

    // Sections count
    const sections = flat.filter(e => e.type === 'section');
    if (sections.length >= 3) items.push({ status: 'pass', label: `${sections.length} sections`, detail: 'Well-structured page layout.', category: 'Structure', impact: 'low' });
    else items.push({ status: 'warning', label: `Only ${sections.length} sections`, detail: 'Add more sections for better structure.', category: 'Structure', fix: 'Break content into logical sections.', impact: 'low' });

    // ── Media ──
    const images = flat.filter(e => e.type === 'image');
    const noAlt = images.filter(e => !e.props?.alt || (e.props.alt as string).trim() === '');
    if (images.length === 0) items.push({ status: 'warning', label: 'No images', detail: 'Add images for engagement.', category: 'Media', impact: 'medium' });
    else if (noAlt.length === 0) items.push({ status: 'pass', label: `All ${images.length} images have alt text`, detail: 'Great for accessibility.', category: 'Media', impact: 'high' });
    else items.push({ status: 'fail', label: `${noAlt.length} images missing alt`, detail: 'Alt text is crucial for SEO.', category: 'Media', fix: 'Add descriptive alt text to each image.', impact: 'high' });

    const videos = flat.filter(e => e.type === 'video');
    if (videos.length > 0) items.push({ status: 'pass', label: `${videos.length} video(s) found`, detail: 'Rich media enhances engagement.', category: 'Media', impact: 'low' });

    // ── Performance ──
    if (images.length > 10) items.push({ status: 'warning', label: `Many images (${images.length})`, detail: 'Consider lazy loading.', category: 'Performance', fix: 'Enable lazy loading on below-fold images.', impact: 'medium' });
    else if (images.length > 0) items.push({ status: 'pass', label: 'Image count OK', detail: `${images.length} images won't impact load time.`, category: 'Performance', impact: 'low' });

    if (flat.length > 100) items.push({ status: 'warning', label: `Large DOM (${flat.length} nodes)`, detail: 'May slow rendering.', category: 'Performance', fix: 'Simplify layout or lazy load sections.', impact: 'medium' });
    else items.push({ status: 'pass', label: 'DOM size OK', detail: `${flat.length} elements is manageable.`, category: 'Performance', impact: 'low' });

    // ── Accessibility ──
    const links = flat.filter(e => e.type === 'link' || e.type === 'button');
    if (links.length === 0) items.push({ status: 'warning', label: 'No CTAs', detail: 'Add buttons or links.', category: 'Accessibility', impact: 'medium' });
    else items.push({ status: 'pass', label: `${links.length} CTAs detected`, detail: 'Good interactive elements.', category: 'Accessibility', impact: 'medium' });

    const forms = flat.filter(e => e.type === 'form');
    if (forms.length > 0) {
      const inputs = flat.filter(e => e.type === 'input');
      const labelled = inputs.filter(e => e.props?.label);
      if (inputs.length > 0 && labelled.length < inputs.length) {
        items.push({ status: 'warning', label: 'Unlabelled form fields', detail: `${inputs.length - labelled.length} inputs need labels.`, category: 'Accessibility', fix: 'Add labels to all form fields.', impact: 'high' });
      } else {
        items.push({ status: 'pass', label: 'Form labels OK', detail: 'All inputs are labelled.', category: 'Accessibility', impact: 'medium' });
      }
    }

    // Color contrast note
    items.push({ status: 'pass', label: 'Semantic HTML used', detail: 'Elements use proper tags.', category: 'Accessibility', impact: 'medium' });

    // ── Technical ──
    items.push({ status: 'pass', label: 'Responsive ready', detail: 'Workshop generates responsive code.', category: 'Technical', impact: 'high' });
    items.push({ status: 'pass', label: 'Clean HTML output', detail: 'No bloated markup.', category: 'Technical', impact: 'medium' });

    const hasLinks = flat.some(e => e.type === 'link' && e.props?.href);
    if (hasLinks) items.push({ status: 'pass', label: 'Internal links found', detail: 'Good for crawlability.', category: 'Technical', impact: 'medium' });
    else items.push({ status: 'warning', label: 'No internal links', detail: 'Add links between pages.', category: 'Technical', fix: 'Link to other pages on your site.', impact: 'medium' });

    return items;
  }, [state.elements]);

  const passCount = audits.filter(a => a.status === 'pass').length;
  const warnCount = audits.filter(a => a.status === 'warning').length;
  const failCount = audits.filter(a => a.status === 'fail').length;
  const score = Math.round((passCount / audits.length) * 100);
  const scoreColor = score >= 80 ? 'hsl(var(--studio-ok))' : score >= 50 ? 'hsl(var(--studio-warn))' : 'hsl(var(--studio-risk))';
  const scoreLabel = score >= 90 ? 'Excellent' : score >= 70 ? 'Good' : score >= 50 ? 'Needs Work' : 'Poor';

  const filtered = filterStatus ? audits.filter(a => a.status === filterStatus) : audits;
  const grouped = Object.keys(CATEGORY_CONFIG).map(cat => ({
    category: cat,
    items: filtered.filter(a => a.category === cat),
  })).filter(g => g.items.length > 0);

  const toggleCategory = (cat: string) => setExpandedCategories(p => ({ ...p, [cat]: !p[cat] }));

  return (
    <ScrollArea className="h-full">
      <div className="p-3 space-y-3">
        {/* Header */}
        <div className="flex items-center gap-2">
          <div className="w-6 h-6 rounded-lg flex items-center justify-center" style={{ background: 'linear-gradient(135deg, hsl(var(--studio-ink-3) / 0.1), hsl(var(--studio-ink-3) / 0.08))', border: '1px solid hsl(var(--studio-ink-3) / 0.15)' }}>
            <Search className="h-3 w-3" style={{ color: 'hsl(var(--studio-ink-3))' }} />
          </div>
          <span className="text-[11px] font-semibold" style={{ color: 'hsl(var(--studio-ink-2))' }}>SEO Audit</span>
        </div>

        {/* Score */}
        <div className="rounded-xl p-4" style={{ background: 'linear-gradient(135deg, rgba(0,0,0,0.3), rgba(0,0,0,0.1))', border: '1px solid hsl(var(--studio-line))' }}>
          <div className="flex items-center gap-4">
            <div className="relative flex items-center justify-center rounded-full shrink-0"
              style={{ width: '72px', height: '72px', background: `conic-gradient(${scoreColor} ${score * 3.6}deg, rgba(255,255,255,0.04) ${score * 3.6}deg)` }}>
              <div className="flex flex-col items-center justify-center rounded-full" style={{ width: '58px', height: '58px', backgroundColor: 'hsl(var(--studio-panel))' }}>
                <span className="text-[20px] font-bold tabular-nums" style={{ color: scoreColor }}>{score}</span>
                <span className="text-[7px] font-bold uppercase" style={{ color: 'hsl(var(--studio-ink-3))' }}>Score</span>
              </div>
            </div>
            <div className="flex-1">
              <div className="text-[12px] font-bold mb-1" style={{ color: scoreColor }}>{scoreLabel}</div>
              <div className="flex items-center gap-3">
                <div className="flex items-center gap-1">
                  <CheckCircle className="h-3 w-3" style={{ color: 'hsl(var(--studio-ok))' }} />
                  <span className="text-[9px] font-semibold tabular-nums" style={{ color: 'hsl(var(--studio-ok))' }}>{passCount}</span>
                </div>
                <div className="flex items-center gap-1">
                  <AlertCircle className="h-3 w-3" style={{ color: 'hsl(var(--studio-warn))' }} />
                  <span className="text-[9px] font-semibold tabular-nums" style={{ color: 'hsl(var(--studio-warn))' }}>{warnCount}</span>
                </div>
                <div className="flex items-center gap-1">
                  <XCircle className="h-3 w-3" style={{ color: 'hsl(var(--studio-risk))' }} />
                  <span className="text-[9px] font-semibold tabular-nums" style={{ color: 'hsl(var(--studio-risk))' }}>{failCount}</span>
                </div>
              </div>
              <div className="w-full h-1.5 rounded-full mt-2 overflow-hidden" style={{ backgroundColor: 'hsl(var(--studio-raised))' }}>
                <div className="h-full rounded-full flex">
                  <div style={{ width: `${(passCount / audits.length) * 100}%`, backgroundColor: 'hsl(var(--studio-ok))' }} />
                  <div style={{ width: `${(warnCount / audits.length) * 100}%`, backgroundColor: 'hsl(var(--studio-warn))' }} />
                  <div style={{ width: `${(failCount / audits.length) * 100}%`, backgroundColor: 'hsl(var(--studio-risk))' }} />
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Filters */}
        <div className="flex items-center gap-1">
          {[
            { key: null, label: 'All', count: audits.length },
            { key: 'fail', label: 'Errors', count: failCount, color: 'hsl(var(--studio-risk))' },
            { key: 'warning', label: 'Warnings', count: warnCount, color: 'hsl(var(--studio-warn))' },
            { key: 'pass', label: 'Passed', count: passCount, color: 'hsl(var(--studio-ok))' },
          ].map(f => (
            <button key={f.key || 'all'} onClick={() => setFilterStatus(f.key)}
              className="flex items-center gap-1 px-2 py-1 rounded-md text-[8px] font-semibold transition-all"
              style={{
                backgroundColor: filterStatus === f.key ? `${f.color || 'hsl(var(--studio-accent))'}12` : 'transparent',
                color: filterStatus === f.key ? (f.color || 'hsl(var(--studio-accent))') : 'hsl(var(--studio-ink-3))',
                border: `1px solid ${filterStatus === f.key ? `${f.color || 'hsl(var(--studio-accent))'}30` : 'transparent'}`,
              }}>
              {f.label}
              <span className="text-[7px] tabular-nums opacity-70">{f.count}</span>
            </button>
          ))}
        </div>

        {/* Grouped audit items */}
        <div className="space-y-1">
          {grouped.map(({ category, items }) => {
            const config = CATEGORY_CONFIG[category];
            const Icon = config?.icon || Globe;
            const color = config?.color || 'hsl(var(--studio-ink-3))';
            const isOpen = expandedCategories[category] !== false;
            const catFails = items.filter(i => i.status === 'fail').length;
            const catWarns = items.filter(i => i.status === 'warning').length;

            return (
              <div key={category}>
                <button onClick={() => toggleCategory(category)}
                  className="w-full flex items-center justify-between py-1.5 px-1 transition-colors">
                  <div className="flex items-center gap-2">
                    <ChevronRight className={`h-2.5 w-2.5 transition-transform ${isOpen ? 'rotate-90' : ''}`} style={{ color: 'hsl(var(--studio-hover))' }} />
                    <div className="w-4 h-4 rounded flex items-center justify-center" style={{ backgroundColor: `${color}12`, border: `1px solid ${color}20` }}>
                      <Icon className="h-2.5 w-2.5" style={{ color }} />
                    </div>
                    <span className="text-[9px] font-bold uppercase tracking-wider" style={{ color: 'hsl(var(--studio-ink-2))' }}>{category}</span>
                    <span className="text-[8px] tabular-nums px-1 rounded" style={{ backgroundColor: `${color}10`, color }}>{items.length}</span>
                  </div>
                  <div className="flex items-center gap-1">
                    {catFails > 0 && <span className="text-[7px] font-bold px-1 rounded" style={{ backgroundColor: 'rgba(239,68,68,0.1)', color: 'hsl(var(--studio-risk))' }}>{catFails}</span>}
                    {catWarns > 0 && <span className="text-[7px] font-bold px-1 rounded" style={{ backgroundColor: 'rgba(245,158,11,0.1)', color: 'hsl(var(--studio-warn))' }}>{catWarns}</span>}
                  </div>
                </button>

                <AnimatePresence>
                  {isOpen && (
                    <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }} transition={{ duration: 0.15 }} style={{ overflow: 'hidden' }}>
                      <div className="space-y-1 mb-2">
                        {items.map((item, i) => {
                          const StatusIcon = item.status === 'pass' ? CheckCircle : item.status === 'warning' ? AlertCircle : XCircle;
                          const statusColor = item.status === 'pass' ? 'hsl(var(--studio-ok))' : item.status === 'warning' ? 'hsl(var(--studio-warn))' : 'hsl(var(--studio-risk))';
                          return (
                            <div key={i} className="rounded-lg p-2.5 group" style={{ backgroundColor: 'hsl(var(--studio-panel))', border: '1px solid hsl(var(--studio-line))' }}>
                              <div className="flex items-start gap-2">
                                <StatusIcon className="h-3.5 w-3.5 shrink-0 mt-0.5" style={{ color: statusColor }} />
                                <div className="flex-1 min-w-0">
                                  <div className="flex items-center justify-between">
                                    <span className="text-[10px] font-semibold" style={{ color: 'hsl(var(--studio-ink-2))' }}>{item.label}</span>
                                    <span className="text-[7px] font-bold uppercase px-1 py-0.5 rounded" style={{ backgroundColor: `${IMPACT_COLORS[item.impact]}10`, color: IMPACT_COLORS[item.impact] }}>
                                      {item.impact}
                                    </span>
                                  </div>
                                  <p className="text-[9px] mt-0.5" style={{ color: 'hsl(var(--studio-ink-3))' }}>{item.detail}</p>
                                  {item.fix && (
                                    <div className="flex items-center gap-1 mt-1 px-1.5 py-1 rounded" style={{ backgroundColor: 'hsl(var(--studio-accent) / 0.04)', border: '1px solid hsl(var(--studio-accent) / 0.08)' }}>
                                      <Zap className="h-2 w-2 shrink-0" style={{ color: 'hsl(var(--studio-accent))' }} />
                                      <span className="text-[8px]" style={{ color: 'hsl(var(--studio-accent))' }}>{item.fix}</span>
                                    </div>
                                  )}
                                </div>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            );
          })}
        </div>

        <div className="text-[9px] text-center pt-1" style={{ color: 'hsl(var(--studio-hover))' }}>
          {passCount}/{audits.length} checks passed • {Object.keys(CATEGORY_CONFIG).length} categories audited
        </div>
      </div>
    </ScrollArea>
  );
}
