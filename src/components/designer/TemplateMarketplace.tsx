import { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ALL_TEMPLATES as TEMPLATES, TEMPLATE_CATEGORIES } from './constants/templates';
import { DesignerTemplate, EditorElement } from './types';
import { useEditor } from './EditorContext';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Search, LayoutGrid, Sparkles, ArrowRight, Eye, FileText, Trash2, BookmarkPlus, Star, Layers, ChevronRight, Filter } from 'lucide-react';
import { TemplatePreviewModal } from './TemplatePreviewModal';
import { TemplateThumbnail } from './TemplateThumbnail';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { useSavedTemplates } from '@/hooks/useSavedTemplates';

const CATEGORY_COLORS: Record<string, string> = {
  All: 'hsl(var(--studio-ink-3))', Portfolio: 'hsl(var(--studio-ink-3))', Agency: 'hsl(var(--studio-accent))', SaaS: 'hsl(var(--studio-ok))',
  Business: 'hsl(var(--studio-warn))', Startup: 'hsl(var(--studio-ink-3))', Creator: 'hsl(var(--studio-ink-3))', Restaurant: 'hsl(var(--studio-warn))',
  Blog: 'hsl(var(--studio-accent))', 'E-commerce': 'hsl(var(--studio-ink-3))', Landing: 'hsl(var(--studio-ink-3))', Saved: 'hsl(var(--studio-ink-3))',
};

function countElements(els: EditorElement[]): number {
  let c = els.length;
  for (const el of els) { if (el.children) c += countElements(el.children); }
  return c;
}

export function TemplateMarketplace({ siteId }: { siteId?: string }) {
  const { dispatch } = useEditor();
  const { templates: savedTemplates, deleteTemplate } = useSavedTemplates();
  const [search, setSearch] = useState('');
  const [activeCategory, setActiveCategory] = useState('All');
  const [hoveredId, setHoveredId] = useState<string | null>(null);
  const [previewTemplate, setPreviewTemplate] = useState<DesignerTemplate | null>(null);
  const [applying, setApplying] = useState(false);
  const [sortBy, setSortBy] = useState<'name' | 'pages' | 'elements'>('name');

  const filtered = useMemo(() => {
    let items = TEMPLATES.filter(t => {
      const matchesCat = activeCategory === 'All' || t.category === activeCategory;
      const matchesSearch = !search || t.name.toLowerCase().includes(search.toLowerCase()) || t.description.toLowerCase().includes(search.toLowerCase()) || t.category.toLowerCase().includes(search.toLowerCase());
      return matchesCat && matchesSearch;
    });
    if (sortBy === 'pages') items = [...items].sort((a, b) => (b.pages?.length || 1) - (a.pages?.length || 1));
    if (sortBy === 'elements') items = [...items].sort((a, b) => {
      const aCount = countElements(a.pages?.[0]?.elements || a.elements || []);
      const bCount = countElements(b.pages?.[0]?.elements || b.elements || []);
      return bCount - aCount;
    });
    return items;
  }, [activeCategory, search, sortBy]);

  const assignIds = (els: EditorElement[]) => {
    for (const el of els) { el.id = crypto.randomUUID(); if (el.children) assignIds(el.children); }
  };

  const applyTemplate = async (template: DesignerTemplate) => {
    if (applying) return;
    setApplying(true);
    try {
      if (template.pages && template.pages.length > 0 && siteId) {
        const { data: userData } = await supabase.auth.getUser();
        if (!userData.user) throw new Error('Not authenticated');
        await supabase.from('designer_pages').delete().eq('site_id', siteId);
        const pageInserts = template.pages.map((page, i) => {
          const elements = JSON.parse(JSON.stringify(page.elements)) as EditorElement[];
          assignIds(elements);
          return { site_id: siteId, user_id: userData.user!.id, page_name: page.name, slug: page.slug, is_homepage: i === 0, sort_order: i, elements: elements as any };
        });
        const { data: insertedPages } = await supabase.from('designer_pages').insert(pageInserts).select('id');
        const firstPageElements = JSON.parse(JSON.stringify(template.pages[0].elements)) as EditorElement[];
        assignIds(firstPageElements);
        dispatch({ type: 'SET_ELEMENTS', payload: firstPageElements });
        if (insertedPages && insertedPages.length > 0) dispatch({ type: 'SET_ACTIVE_PAGE', payload: insertedPages[0].id });
        toast.success(`Applied "${template.name}" with ${template.pages.length} pages`);
      } else {
        const sourceElements = template.pages && template.pages.length > 0 ? template.pages[0].elements : template.elements;
        const freshElements = JSON.parse(JSON.stringify(sourceElements)) as EditorElement[];
        assignIds(freshElements);
        dispatch({ type: 'SET_ELEMENTS', payload: freshElements });
      }
    } catch { toast.error('Failed to apply template'); }
    finally { setApplying(false); }
  };

  // Category stats
  const categoryCounts = useMemo(() => {
    const counts: Record<string, number> = { All: TEMPLATES.length };
    TEMPLATES.forEach(t => { counts[t.category] = (counts[t.category] || 0) + 1; });
    return counts;
  }, []);

  const activeColor = CATEGORY_COLORS[activeCategory] || 'hsl(var(--studio-ink-3))';

  return (
    <>
      <ScrollArea className="h-full">
        <div className="p-3 space-y-3">
          {/* Header */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="w-6 h-6 rounded-lg flex items-center justify-center" style={{ background: 'linear-gradient(135deg, hsl(var(--studio-ink-3) / 0.12), hsl(var(--studio-ink-3) / 0.08))', border: '1px solid hsl(var(--studio-ink-3) / 0.15)' }}>
                <Sparkles className="h-3 w-3" style={{ color: 'hsl(var(--studio-ink-3))' }} />
              </div>
              <span className="text-[11px] font-semibold" style={{ color: 'hsl(var(--studio-ink-2))' }}>Templates</span>
            </div>
            <span className="text-[9px] tabular-nums px-1.5 py-0.5 rounded-md" style={{ backgroundColor: `${activeColor}10`, color: activeColor, border: `1px solid ${activeColor}15` }}>
              {TEMPLATES.length}
            </span>
          </div>

          {/* Search */}
          <div className="relative">
            <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3 w-3" style={{ color: 'hsl(var(--studio-ink-3))' }} />
            <input
              value={search} onChange={e => setSearch(e.target.value)}
              placeholder={`Search templates…`}
              className="w-full h-7 pl-7 pr-3 rounded-lg text-[10px] outline-none transition-colors"
              style={{ backgroundColor: 'hsl(var(--studio-panel))', border: '1px solid hsl(var(--studio-line))', color: 'hsl(var(--studio-ink-2))' }}
              onFocus={e => { e.currentTarget.style.borderColor = 'hsl(var(--studio-ink-3))'; e.currentTarget.style.boxShadow = '0 0 0 2px hsl(var(--studio-ink-3) / 0.08)'; }}
              onBlur={e => { e.currentTarget.style.borderColor = 'hsl(var(--studio-raised))'; e.currentTarget.style.boxShadow = 'none'; }}
            />
            {search && <button onClick={() => setSearch('')} className="absolute right-2 top-1/2 -translate-y-1/2 h-4 w-4 flex items-center justify-center rounded-full hover:bg-white/10" style={{ color: 'hsl(var(--studio-ink-3))', fontSize: '9px' }}>✕</button>}
          </div>

          {/* Category pills with counts */}
          <div className="flex flex-wrap gap-0.5">
            {TEMPLATE_CATEGORIES.map(cat => {
              const catColor = CATEGORY_COLORS[cat] || 'hsl(var(--studio-ink-3))';
              const count = categoryCounts[cat] || 0;
              return (
                <button
                  key={cat} onClick={() => setActiveCategory(cat)}
                  className="flex items-center gap-1 px-2 py-0.5 rounded-md text-[8px] font-semibold uppercase tracking-wider transition-all"
                  style={{
                    backgroundColor: activeCategory === cat ? `${catColor}15` : 'transparent',
                    color: activeCategory === cat ? catColor: 'hsl(var(--studio-ink-3))',
                    border: `1px solid ${activeCategory === cat ? `${catColor}30` : 'transparent'}`,
                  }}
                >
                  {cat}
                  {count > 0 && <span className="text-[7px] tabular-nums opacity-70">{count}</span>}
                </button>
              );
            })}
          </div>

          {/* Sort & results */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <LayoutGrid className="h-2.5 w-2.5" style={{ color: 'hsl(var(--studio-hover))' }} />
              <span className="text-[9px] tabular-nums" style={{ color: 'hsl(var(--studio-ink-3))' }}>{filtered.length} template{filtered.length !== 1 ? 's' : ''}</span>
            </div>
            <div className="flex items-center gap-0.5">
              <Filter className="h-2.5 w-2.5" style={{ color: 'hsl(var(--studio-hover))' }} />
              {(['name', 'pages', 'elements'] as const).map(s => (
                <button key={s} onClick={() => setSortBy(s)} className="text-[7px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded transition-all"
                  style={{ backgroundColor: sortBy === s ? 'hsl(var(--studio-ink-3) / 0.1)' : 'transparent', color: sortBy === s ? 'hsl(var(--studio-ink-3))' : 'hsl(var(--studio-line-strong))' }}
                >{s}</button>
              ))}
            </div>
          </div>

          {/* Saved Templates */}
          {savedTemplates.length > 0 && (activeCategory === 'All' || activeCategory === 'Saved') && (
            <div>
              <div className="flex items-center gap-1.5 mb-2">
                <Star className="h-3 w-3 text-amber-500 fill-amber-500" />
                <span className="text-[9px] font-bold uppercase tracking-wider" style={{ color: 'hsl(var(--studio-ink-3))' }}>Saved</span>
                <span className="text-[7px] tabular-nums px-1 py-0.5 rounded-full" style={{ backgroundColor: 'rgba(245,158,11,0.1)', color: 'hsl(var(--studio-warn))' }}>{savedTemplates.length}</span>
              </div>
              <div className="grid grid-cols-1 gap-1.5">
                {savedTemplates.filter(t => !search || t.name.toLowerCase().includes(search.toLowerCase())).map(st => (
                  <div key={st.id} className="group rounded-lg p-2.5 cursor-pointer transition-all" style={{ backgroundColor: 'hsl(var(--studio-panel))', border: '1px solid rgba(167,139,250,0.12)' }}>
                    <div className="flex items-center justify-between mb-0.5">
                      <div className="flex items-center gap-1.5">
                        <BookmarkPlus className="h-3 w-3 text-amber-500" />
                        <span className="text-[10px] font-semibold" style={{ color: 'hsl(var(--studio-ink-2))' }}>{st.name}</span>
                      </div>
                      <div className="flex gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button onClick={() => { const t: DesignerTemplate = { id: st.id, name: st.name, description: st.description, category: st.category, elements: st.elements, pages: st.pages || undefined }; applyTemplate(t); }}
                          className="px-2 py-0.5 rounded text-[8px] font-semibold" style={{ backgroundColor: 'hsl(var(--studio-ink-3) / 0.12)', color: 'hsl(var(--studio-ink-3))', border: '1px solid hsl(var(--studio-ink-3) / 0.2)' }}>Use</button>
                        <button onClick={() => deleteTemplate(st.id)} className="p-1 rounded hover:bg-red-500/20 transition-colors"><Trash2 className="w-2.5 h-2.5 text-red-400" /></button>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      {st.description && <p className="text-[8px] flex-1 truncate" style={{ color: 'hsl(var(--studio-ink-3))' }}>{st.description}</p>}
                      <span className="text-[7px] tabular-nums shrink-0" style={{ color: 'hsl(var(--studio-hover))' }}>{st.elements.length} els</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Template grid */}
          <div className="grid grid-cols-1 gap-2">
            <AnimatePresence mode="popLayout">
              {filtered.map(template => {
                const catColor = CATEGORY_COLORS[template.category] || 'hsl(var(--studio-ink-3))';
                const elCount = countElements(template.pages?.[0]?.elements || template.elements || []);
                const pageCount = template.pages?.length || 1;
                return (
                  <motion.div
                    key={template.id} layout
                    initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, scale: 0.95 }}
                    transition={{ type: 'spring', stiffness: 400, damping: 30 }}
                    className="group rounded-lg overflow-hidden cursor-pointer"
                    style={{ backgroundColor: 'hsl(var(--studio-panel))', border: `1px solid ${hoveredId === template.id ? `${catColor}40` : 'hsl(var(--studio-raised))'}`, transition: 'border-color 0.2s ease' }}
                    onMouseEnter={() => setHoveredId(template.id)} onMouseLeave={() => setHoveredId(null)}
                  >
                    <div className="relative overflow-hidden" style={{ height: '110px' }}>
                      <div className="w-full h-full transition-transform duration-500" style={{ transform: hoveredId === template.id ? 'scale(1.03)' : 'scale(1)' }}>
                        <TemplateThumbnail template={template} />
                      </div>
                      <div className="absolute inset-0" style={{ background: 'linear-gradient(180deg, transparent 30%, rgba(0,0,0,0.75) 100%)' }} />

                      {/* Category badge */}
                      <div className="absolute top-2 left-2 flex items-center gap-1 px-1.5 py-0.5 rounded-md text-[7px] font-bold uppercase tracking-wider"
                        style={{ backgroundColor: `${catColor}20`, backdropFilter: 'blur(8px)', color: catColor, border: `1px solid ${catColor}25` }}>
                        <div className="w-1 h-1 rounded-full" style={{ backgroundColor: catColor }} />
                        {template.category}
                      </div>

                      {/* Stats badges */}
                      <div className="absolute top-2 right-2 flex items-center gap-1">
                        {pageCount > 1 && (
                          <div className="flex items-center gap-0.5 px-1.5 py-0.5 rounded-md text-[7px] font-bold"
                            style={{ backgroundColor: 'hsl(var(--studio-accent) / 0.8)', backdropFilter: 'blur(8px)', color: 'hsl(var(--studio-ink))' }}>
                            <FileText className="h-2 w-2" /> {pageCount}
                          </div>
                        )}
                        <div className="flex items-center gap-0.5 px-1.5 py-0.5 rounded-md text-[7px] font-bold"
                          style={{ backgroundColor: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(8px)', color: 'rgba(255,255,255,0.7)' }}>
                          <Layers className="h-2 w-2" /> {elCount}
                        </div>
                      </div>

                      {/* Hover overlay */}
                      <AnimatePresence>
                        {hoveredId === template.id && (
                          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.2 }}
                            className="absolute inset-0 flex items-center justify-center gap-2" style={{ backgroundColor: 'rgba(0,0,0,0.5)', backdropFilter: 'blur(2px)' }}>
                            <motion.button initial={{ scale: 0.8, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.8, opacity: 0 }}
                              className="flex items-center gap-1.5 px-3 py-1.5 rounded-md" style={{ backgroundColor: 'rgba(255,255,255,0.12)', backdropFilter: 'blur(12px)', border: '1px solid rgba(255,255,255,0.2)' }}
                              onClick={e => { e.stopPropagation(); setPreviewTemplate(template); }}>
                              <Eye className="h-3 w-3 text-white" /><span className="text-[10px] font-semibold text-white">Preview</span>
                            </motion.button>
                            <motion.button initial={{ scale: 0.8, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.8, opacity: 0 }} transition={{ delay: 0.05 }}
                              className="flex items-center gap-1.5 px-3 py-1.5 rounded-md"
                              style={{ background: `linear-gradient(135deg, ${catColor}, ${catColor}cc)`, border: '1px solid rgba(255,255,255,0.15)' }}
                              onClick={() => applyTemplate(template)}>
                              <Sparkles className="h-3 w-3 text-white" /><span className="text-[10px] font-semibold text-white">Use</span>
                              <ArrowRight className="h-3 w-3 text-white" />
                            </motion.button>
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </div>

                    {/* Info */}
                    <div className="p-2">
                      <div className="flex items-center justify-between mb-0.5">
                        <span className="text-[10px] font-semibold truncate" style={{ color: 'hsl(var(--studio-ink-2))' }}>{template.name}</span>
                      </div>
                      <p className="text-[8px] leading-snug truncate" style={{ color: 'hsl(var(--studio-ink-3))' }}>{template.description}</p>
                    </div>
                  </motion.div>
                );
              })}
            </AnimatePresence>
            {filtered.length === 0 && (
              <div className="text-center py-8" style={{ color: 'hsl(var(--studio-ink-3))', fontSize: '11px' }}>No templates found</div>
            )}
          </div>
        </div>
      </ScrollArea>

      <TemplatePreviewModal open={!!previewTemplate} onOpenChange={(open) => { if (!open) setPreviewTemplate(null); }} template={previewTemplate} />
    </>
  );
}
