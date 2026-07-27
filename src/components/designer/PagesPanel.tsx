import { useState, useEffect } from 'react';
import { useEditor } from './EditorContext';
import { supabase } from '@/integrations/supabase/client';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Plus, Search, Home, File, Copy, Trash2, MoreHorizontal, GripVertical, Settings, ChevronDown } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

interface PageItem {
  id: string;
  page_name: string;
  slug: string;
  is_homepage: boolean;
  sort_order: number;
  seo_title: string | null;
  seo_description: string | null;
  element_count?: number;
}

export function PagesPanel({ siteId }: { siteId: string }) {
  const { state, dispatch } = useEditor();
  const [pages, setPages] = useState<PageItem[]>([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [menuOpen, setMenuOpen] = useState<string | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editName, setEditName] = useState('');

  const countElements = (els: any[]): number => {
    if (!Array.isArray(els)) return 0;
    return els.reduce((acc: number, el: any) => acc + 1 + countElements(el.children || []), 0);
  };

  const loadPages = async () => {
    const { data } = await supabase
      .from('designer_pages')
      .select('id, page_name, slug, is_homepage, sort_order, seo_title, seo_description, elements')
      .eq('site_id', siteId)
      .order('sort_order', { ascending: true });
    if (data) setPages(data.map(p => ({
      ...p,
      element_count: countElements((p.elements as any) || []),
    })));
    setLoading(false);
  };

  useEffect(() => { loadPages(); }, [siteId]);

  const addPage = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;
    const name = `Page ${pages.length + 1}`;
    const slug = name.toLowerCase().replace(/\s+/g, '-');
    const { data } = await supabase
      .from('designer_pages')
      .insert({
        site_id: siteId,
        user_id: user.id,
        page_name: name,
        slug,
        sort_order: pages.length,
        elements: [],
      })
      .select()
      .single();
    if (data) {
      await loadPages();
      dispatch({ type: 'SET_ACTIVE_PAGE', payload: data.id });
    }
  };

  const duplicatePage = async (page: PageItem) => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;
    // Get full page data
    const { data: fullPage } = await supabase
      .from('designer_pages')
      .select('*')
      .eq('id', page.id)
      .single();
    if (!fullPage) return;

    const { data } = await supabase
      .from('designer_pages')
      .insert({
        site_id: siteId,
        user_id: user.id,
        page_name: `${page.page_name} (copy)`,
        slug: `${page.slug}-copy`,
        sort_order: pages.length,
        elements: fullPage.elements,
        page_settings: fullPage.page_settings,
        seo_title: fullPage.seo_title,
        seo_description: fullPage.seo_description,
      })
      .select()
      .single();
    if (data) {
      await loadPages();
      setMenuOpen(null);
    }
  };

  const deletePage = async (id: string) => {
    if (pages.length <= 1) return;
    await supabase.from('designer_pages').delete().eq('id', id);
    await loadPages();
    if (state.activePage === id) {
      const remaining = pages.filter(p => p.id !== id);
      if (remaining.length > 0) dispatch({ type: 'SET_ACTIVE_PAGE', payload: remaining[0].id });
    }
    setMenuOpen(null);
  };

  const renamePage = async (id: string, newName: string) => {
    await supabase.from('designer_pages').update({
      page_name: newName,
      slug: newName.toLowerCase().replace(/\s+/g, '-'),
    }).eq('id', id);
    setEditingId(null);
    await loadPages();
  };

  const setHomepage = async (id: string) => {
    // Unset all homepages first
    await supabase.from('designer_pages').update({ is_homepage: false }).eq('site_id', siteId);
    await supabase.from('designer_pages').update({ is_homepage: true }).eq('id', id);
    await loadPages();
    setMenuOpen(null);
  };

  const switchPage = async (targetPageId: string) => {
    if (targetPageId === state.activePage) return;

    // Save current page elements BEFORE switching
    if (state.activePage) {
      try {
        await supabase
          .from('designer_pages')
          .update({
            elements: JSON.parse(JSON.stringify(state.elements)),
            updated_at: new Date().toISOString(),
          })
          .eq('id', state.activePage);
      } catch (err) {
        console.error('Failed to save current page before switching:', err);
      }
    }

    // Now switch to the new page
    dispatch({ type: 'SET_ACTIVE_PAGE', payload: targetPageId });

    // Load new page elements
    const { data } = await supabase
      .from('designer_pages')
      .select('elements')
      .eq('id', targetPageId)
      .single();
    if (data?.elements) {
      dispatch({ type: 'SET_ELEMENTS', payload: data.elements as any });
    } else {
      dispatch({ type: 'SET_ELEMENTS', payload: [] });
    }
  };

  const filtered = pages.filter(p =>
    p.page_name.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <ScrollArea className="h-full">
      <div className="py-2">
        {/* Header */}
        <div className="flex items-center justify-between px-3 pb-2">
          <span className="text-[11px] font-semibold text-white">Pages</span>
          <button
            onClick={addPage}
            className="h-6 w-6 flex items-center justify-center rounded hover:bg-[#333] transition-colors"
            title="Add page"
          >
            <Plus className="h-3.5 w-3.5 text-[#888]" />
          </button>
        </div>

        {/* Search */}
        <div className="px-3 pb-2">
          <div className="relative">
            <Search className="h-3 w-3 absolute left-2 top-1/2 -translate-y-1/2 text-[#555]" />
            <input
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Search pages…"
              className="w-full h-7 pl-7 pr-2 rounded text-[11px] outline-none"
              style={{ backgroundColor: '#1e1e1e', border: '1px solid #333', color: '#ccc' }}
              onFocus={e => { e.currentTarget.style.borderColor = '#0073E6'; }}
              onBlur={e => { e.currentTarget.style.borderColor = '#333'; }}
            />
          </div>
        </div>

        {/* Pages section */}
        <div className="px-2">
          <div className="flex items-center gap-1 px-1 py-1">
            <ChevronDown className="h-3 w-3 text-[#555]" />
            <span className="text-[10px] font-semibold uppercase tracking-wider text-[#666]">Pages</span>
          </div>

          {loading ? (
            <div className="flex items-center justify-center py-8">
              <div className="w-5 h-5 border-2 border-[#333] border-t-[#0073E6] rounded-full animate-spin" />
            </div>
          ) : filtered.length === 0 ? (
            <div className="text-[11px] text-center py-6 text-[#555]">
              {search ? 'No matching pages' : 'No pages yet'}
            </div>
          ) : (
            <div className="space-y-0.5">
              {(() => {
                const maxElements = Math.max(...filtered.map(p => p.element_count || 0), 1);
                return filtered.map(page => {
                  const density = (page.element_count || 0) / maxElements;
                  return (
                    <div
                      key={page.id}
                      className="group relative flex items-center gap-1 h-9 px-2 rounded cursor-pointer transition-all"
                      style={{
                        backgroundColor: state.activePage === page.id ? 'rgba(0,115,230,0.12)' : 'transparent',
                        borderLeft: state.activePage === page.id ? '2px solid #0073E6' : '2px solid transparent',
                      }}
                      onClick={() => switchPage(page.id)}
                    >
                      <GripVertical className="h-3 w-3 shrink-0 opacity-0 group-hover:opacity-30 cursor-grab text-[#666]" />
                      {page.is_homepage ? (
                        <Home className="h-3 w-3 shrink-0 text-[#0073E6]" />
                      ) : (
                        <File className="h-3 w-3 shrink-0 text-[#666]" />
                      )}

                      {editingId === page.id ? (
                        <input
                          autoFocus
                          value={editName}
                          onChange={e => setEditName(e.target.value)}
                          onBlur={() => renamePage(page.id, editName)}
                          onKeyDown={e => { if (e.key === 'Enter') renamePage(page.id, editName); if (e.key === 'Escape') setEditingId(null); }}
                          className="flex-1 bg-transparent text-[11px] font-medium text-white outline-none px-1"
                          onClick={e => e.stopPropagation()}
                        />
                      ) : (
                        <div className="flex-1 min-w-0">
                          <span
                            className="block text-[11px] font-medium truncate"
                            style={{ color: state.activePage === page.id ? '#fff' : '#bbb' }}
                            onDoubleClick={(e) => {
                              e.stopPropagation();
                              setEditingId(page.id);
                              setEditName(page.page_name);
                            }}
                          >
                            {page.page_name}
                          </span>
                          {/* Density bar */}
                          <div className="flex items-center gap-1 mt-0.5">
                            <div className="flex-1 h-[2px] rounded-full overflow-hidden" style={{ backgroundColor: 'rgba(255,255,255,0.04)' }}>
                              <div
                                className="h-full rounded-full transition-all duration-300"
                                style={{
                                  width: `${density * 100}%`,
                                  backgroundColor: density > 0.8 ? '#f59e0b' : density > 0.5 ? '#0073E6' : '#22c55e',
                                }}
                              />
                            </div>
                            <span className="text-[7px] tabular-nums font-mono shrink-0" style={{ color: '#555' }}>
                              {page.element_count || 0}
                            </span>
                          </div>
                        </div>
                      )}

                      {page.is_homepage && (
                        <span className="text-[8px] px-1 py-0.5 rounded font-bold" style={{ backgroundColor: 'rgba(0,115,230,0.2)', color: '#0073E6' }}>
                          HOME
                        </span>
                      )}

                  <div className="relative">
                    <button
                      onClick={(e) => { e.stopPropagation(); setMenuOpen(menuOpen === page.id ? null : page.id); }}
                      className="h-5 w-5 flex items-center justify-center rounded opacity-0 group-hover:opacity-100 hover:bg-[#333] transition-all"
                    >
                      <MoreHorizontal className="h-3 w-3 text-[#888]" />
                    </button>

                    <AnimatePresence>
                      {menuOpen === page.id && (
                        <motion.div
                          initial={{ opacity: 0, scale: 0.95 }}
                          animate={{ opacity: 1, scale: 1 }}
                          exit={{ opacity: 0, scale: 0.95 }}
                          className="absolute right-0 top-full mt-1 z-[200] rounded-lg py-1 min-w-[150px]"
                          style={{ backgroundColor: '#2d2d2d', border: '1px solid #3a3a3a', boxShadow: '0 8px 24px rgba(0,0,0,0.4)' }}
                          onClick={e => e.stopPropagation()}
                        >
                          <button
                            onClick={() => { setEditingId(page.id); setEditName(page.page_name); setMenuOpen(null); }}
                            className="w-full flex items-center gap-2 h-7 px-3 text-[11px] text-[#ccc] hover:bg-[#3a3a3a]"
                          >
                            <Settings className="h-3 w-3 text-[#888]" /> Rename
                          </button>
                          <button
                            onClick={() => duplicatePage(page)}
                            className="w-full flex items-center gap-2 h-7 px-3 text-[11px] text-[#ccc] hover:bg-[#3a3a3a]"
                          >
                            <Copy className="h-3 w-3 text-[#888]" /> Duplicate
                          </button>
                          {!page.is_homepage && (
                            <button
                              onClick={() => setHomepage(page.id)}
                              className="w-full flex items-center gap-2 h-7 px-3 text-[11px] text-[#ccc] hover:bg-[#3a3a3a]"
                            >
                              <Home className="h-3 w-3 text-[#888]" /> Set as homepage
                            </button>
                          )}
                          {pages.length > 1 && (
                            <>
                              <div className="h-[1px] my-1 mx-2" style={{ backgroundColor: '#3a3a3a' }} />
                              <button
                                onClick={() => deletePage(page.id)}
                                className="w-full flex items-center gap-2 h-7 px-3 text-[11px] text-red-400 hover:bg-red-500/10"
                              >
                                <Trash2 className="h-3 w-3" /> Delete
                              </button>
                            </>
                          )}
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>
                </div>
                  );
                });
              })()}
            </div>
          )}
        </div>
      </div>
    </ScrollArea>
  );
}
