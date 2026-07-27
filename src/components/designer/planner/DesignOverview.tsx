import { useState, useRef, useEffect, useLayoutEffect } from 'react';
import { Monitor, Tablet, Smartphone, Plus } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { EditorElement } from '../types';
import { SectionBlock } from '../constants/sectionBlocks';
import { WireframeSectionEditor } from './WireframeSectionEditor';
import { WireframeAddSectionPanel } from './WireframeAddSectionPanel';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useSitePagesSync, notifySitePagesUpdated } from './useSitePagesSync';

function renderEl(el: EditorElement): string {
  const rawStyle = (el.styles?.desktop || {}) as Record<string, unknown>;
  // Clamp 100vh values to a fixed px for preview rendering
  const style = Object.entries(rawStyle)
    .filter(([, v]) => v != null && v !== '')
    .map(([k, v]) => {
      let val = String(v);
      if (val.includes('100vh')) val = val.replace('100vh', '700px');
      return `${k.replace(/[A-Z]/g, m => '-' + m.toLowerCase())}:${val}`;
    })
    .join(';');

  const children = el.children?.length ? el.children.map(c => renderEl(c)).join('') : '';
  const text = el.props?.text ? String(el.props.text).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/\n/g, '<br/>') : '';

  if (el.type === 'image') {
    const src = (el.props?.src as string) || '';
    return `<img src="${src.replace(/"/g, '&quot;')}" alt="" style="${style}; display:block; max-width:100%;" loading="lazy" />`;
  }
  if (el.type === 'spacer') return `<div style="${style}"></div>`;
  if (el.type === 'divider') return `<hr style="${style}; border:none; height:1px; background:rgba(255,255,255,0.1);" />`;

  const tag = el.type === 'navbar' ? 'nav' : el.type === 'footer' ? 'footer' : el.type === 'section' ? 'section' : el.type === 'text' ? 'p' : 'div';
  return `<${tag} style="${style};overflow:hidden">${text}${children}</${tag}>`;
}

function ScaledSection({ el, idx, scale, previewWidth, isSelected, onClick }: {
  el: EditorElement; idx: number; scale: number; previewWidth: number; isSelected: boolean; onClick: () => void;
}) {
  const innerRef = useRef<HTMLDivElement>(null);
  const [h, setH] = useState<number>(0);

  useEffect(() => {
    if (!innerRef.current) return;
    const ro = new ResizeObserver(entries => {
      for (const entry of entries) setH(entry.contentRect.height * scale);
    });
    ro.observe(innerRef.current);
    // initial measure
    setH(innerRef.current.scrollHeight * scale);
    return () => ro.disconnect();
  }, [scale]);

  return (
    <div
      className="relative cursor-pointer"
      style={{ outline: isSelected ? '2px solid #0073E6' : 'none', height: h || 'auto', overflow: 'hidden' }}
      onClick={onClick}
    >
      <div
        ref={innerRef}
        style={{
          width: previewWidth,
          transform: `scale(${scale})`,
          transformOrigin: 'top left',
          pointerEvents: 'none',
          userSelect: 'none',
        }}
        dangerouslySetInnerHTML={{ __html: renderEl(el) }}
      />
      <div
        className="absolute inset-0 opacity-0 hover:opacity-100 transition-opacity flex items-center justify-center"
        style={{ backgroundColor: 'rgba(0,115,230,0.06)' }}
      >
        <span className="text-[8px] font-medium px-2 py-0.5 rounded" style={{ backgroundColor: 'rgba(0,0,0,0.7)', color: '#fff' }}>
          {el.name || el.type}
        </span>
      </div>
    </div>
  );
}

interface DesignOverviewProps {
  siteId?: string;
  onNavigateToPage?: (pageId: string) => void;
}

export function DesignOverview({ siteId, onNavigateToPage }: DesignOverviewProps) {
  const { pages, loading, reload: loadPages, setPages } = useSitePagesSync(siteId);
  const [device, setDevice] = useState<'desktop' | 'tablet' | 'mobile'>('desktop');
  const [selectedPageId, setSelectedPageId] = useState<string | null>(null);
  const [selectedSectionIdx, setSelectedSectionIdx] = useState<number | null>(null);
  const [showAddPanel, setShowAddPanel] = useState(false);

  const cardWidth = device === 'desktop' ? 380 : device === 'tablet' ? 260 : 180;
  const previewWidth = device === 'desktop' ? 1280 : device === 'tablet' ? 768 : 375;
  const scale = cardWidth / previewWidth;

  const selectedPage = pages.find(p => p.id === selectedPageId);
  const selectedSection = selectedPage && selectedSectionIdx !== null ? selectedPage.elements[selectedSectionIdx] : null;

  const savePageElements = async (pageId: string, elements: EditorElement[]) => {
    await supabase.from('designer_pages').update({ elements: elements as any }).eq('id', pageId);
    setPages(prev => prev.map(p => p.id === pageId ? { ...p, elements } : p));
    notifySitePagesUpdated();
  };

  const handleSectionClick = (pageId: string, idx: number) => {
    setSelectedPageId(pageId);
    setSelectedSectionIdx(idx);
    setShowAddPanel(false);
  };

  const handleMoveUp = () => {
    if (!selectedPage || selectedSectionIdx === null || selectedSectionIdx === 0) return;
    const els = [...selectedPage.elements];
    [els[selectedSectionIdx - 1], els[selectedSectionIdx]] = [els[selectedSectionIdx], els[selectedSectionIdx - 1]];
    savePageElements(selectedPage.id, els);
    setSelectedSectionIdx(selectedSectionIdx - 1);
  };

  const handleMoveDown = () => {
    if (!selectedPage || selectedSectionIdx === null || selectedSectionIdx >= selectedPage.elements.length - 1) return;
    const els = [...selectedPage.elements];
    [els[selectedSectionIdx], els[selectedSectionIdx + 1]] = [els[selectedSectionIdx + 1], els[selectedSectionIdx]];
    savePageElements(selectedPage.id, els);
    setSelectedSectionIdx(selectedSectionIdx + 1);
  };

  const handleDuplicate = () => {
    if (!selectedPage || selectedSectionIdx === null) return;
    const els = [...selectedPage.elements];
    const clone = JSON.parse(JSON.stringify(els[selectedSectionIdx]));
    const assignIds = (el: EditorElement) => { el.id = crypto.randomUUID(); el.children?.forEach(assignIds); };
    assignIds(clone);
    els.splice(selectedSectionIdx + 1, 0, clone);
    savePageElements(selectedPage.id, els);
    setSelectedSectionIdx(selectedSectionIdx + 1);
  };

  const handleDelete = () => {
    if (!selectedPage || selectedSectionIdx === null) return;
    const els = selectedPage.elements.filter((_, i) => i !== selectedSectionIdx);
    savePageElements(selectedPage.id, els);
    setSelectedSectionIdx(null);
  };

  const handleReplace = (block: SectionBlock) => {
    if (!selectedPage || selectedSectionIdx === null) return;
    const els = [...selectedPage.elements];
    const fresh = JSON.parse(JSON.stringify(block.elements[0] || block.elements));
    const assignIds = (el: EditorElement) => { el.id = crypto.randomUUID(); el.children?.forEach(assignIds); };
    if (Array.isArray(fresh)) { fresh.forEach(assignIds); els.splice(selectedSectionIdx, 1, ...fresh); }
    else { assignIds(fresh); els[selectedSectionIdx] = fresh; }
    savePageElements(selectedPage.id, els);
  };

  const handleAddSection = (block: SectionBlock) => {
    if (!selectedPageId) return;
    const page = pages.find(p => p.id === selectedPageId);
    if (!page) return;
    const fresh = JSON.parse(JSON.stringify(block.elements)) as EditorElement[];
    const assignIds = (el: EditorElement) => { el.id = crypto.randomUUID(); el.children?.forEach(assignIds); };
    fresh.forEach(assignIds);
    savePageElements(page.id, [...page.elements, ...fresh]);
    setShowAddPanel(false);
  };

  const addPage = async () => {
    if (!siteId) return;
    const { data: userData } = await supabase.auth.getUser();
    if (!userData.user) return;
    const { data } = await supabase.from('designer_pages').insert({
      site_id: siteId, user_id: userData.user.id,
      page_name: `Page ${pages.length + 1}`,
      slug: `/page-${pages.length + 1}`,
      sort_order: pages.length,
    }).select().single();
    if (data) {
      setPages(prev => [...prev, { ...data, elements: [], sort_order: data.sort_order ?? 0 }]);
      setSelectedPageId(data.id);
      setShowAddPanel(true);
      notifySitePagesUpdated();
    }
  };

  const devices = [
    { key: 'desktop' as const, icon: Monitor },
    { key: 'tablet' as const, icon: Tablet },
    { key: 'mobile' as const, icon: Smartphone },
  ];

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full" style={{ backgroundColor: '#181818' }}>
        <div className="w-6 h-6 border-2 border-[#333] border-t-[#0073E6] rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="flex h-full w-full" style={{ backgroundColor: '#181818' }}>
      {/* Section editor sidebar */}
      {selectedSection && !showAddPanel && (
        <WireframeSectionEditor
          section={selectedSection}
          sectionIndex={selectedSectionIdx!}
          totalSections={selectedPage?.elements.length || 0}
          onClose={() => setSelectedSectionIdx(null)}
          onMoveUp={handleMoveUp}
          onMoveDown={handleMoveDown}
          onDuplicate={handleDuplicate}
          onDelete={handleDelete}
          onReplace={handleReplace}
        />
      )}
      {showAddPanel && selectedPageId && (
        <WireframeAddSectionPanel onAdd={handleAddSection} onClose={() => setShowAddPanel(false)} />
      )}

      {/* Main area */}
      <div className="flex-1 flex flex-col overflow-hidden">
        <div className="flex items-center justify-between px-6 py-3 shrink-0" style={{ borderBottom: '1px solid #252525' }}>
          <div className="flex items-center gap-2">
            {devices.map(d => {
              const Icon = d.icon;
              return (
                <button
                  key={d.key}
                  onClick={() => setDevice(d.key)}
                  className="h-7 w-7 flex items-center justify-center rounded-md transition-all"
                  style={{ backgroundColor: device === d.key ? '#0073E6' : '#252525', color: device === d.key ? '#fff' : '#888' }}
                >
                  <Icon className="h-3.5 w-3.5" />
                </button>
              );
            })}
          </div>
          <span className="text-[10px] text-[#555]">{pages.length} page{pages.length !== 1 ? 's' : ''} · Click section to edit</span>
        </div>

        <ScrollArea className="flex-1">
          <div className="flex justify-center gap-6 px-8 py-8 flex-wrap">
            {pages.map(page => (
              <div key={page.id} className="flex flex-col items-center gap-2">
                <span className="text-[10px] font-semibold text-[#888] uppercase tracking-wider">{page.page_name}</span>
                <div
                  className="rounded-lg overflow-hidden transition-all"
                  style={{
                    width: cardWidth,
                    border: selectedPageId === page.id ? '2px solid #0073E6' : '1px solid #333',
                    boxShadow: selectedPageId === page.id ? '0 0 20px rgba(0,115,230,0.15)' : '0 4px 16px rgba(0,0,0,0.3)',
                  }}
                >
                  {page.elements.length > 0 ? (
                    <div style={{ backgroundColor: '#1e1e1e' }}>
                      {page.elements.map((el, idx) => (
                        <ScaledSection
                          key={el.id || idx}
                          el={el}
                          idx={idx}
                          scale={scale}
                          previewWidth={previewWidth}
                          isSelected={selectedPageId === page.id && selectedSectionIdx === idx}
                          onClick={() => handleSectionClick(page.id, idx)}
                        />
                      ))}
                    </div>
                  ) : (
                    <div className="flex flex-col items-center justify-center py-12 gap-2" style={{ backgroundColor: '#1e1e1e' }}>
                      <span className="text-[10px] text-[#555]">Empty page</span>
                    </div>
                  )}
                  <button
                    onClick={() => { setSelectedPageId(page.id); setShowAddPanel(true); setSelectedSectionIdx(null); }}
                    className="w-full flex items-center justify-center gap-1.5 py-2 text-[9px] font-medium transition-colors hover:bg-white/5"
                    style={{ backgroundColor: '#1a1a1a', color: '#0073E6', borderTop: '1px solid #2a2a2a' }}
                  >
                    <Plus className="h-3 w-3" /> Add Section
                  </button>
                </div>
                <span className="text-[8px] text-[#444] font-mono">{page.slug}</span>
              </div>
            ))}

            <div className="flex flex-col items-center gap-2">
              <span className="text-[10px] font-semibold text-transparent uppercase">Add</span>
              <button
                onClick={addPage}
                className="rounded-lg flex flex-col items-center justify-center gap-2 transition-all hover:border-[#0073E6] hover:bg-white/[0.02]"
                style={{ width: cardWidth, minHeight: 200, border: '2px dashed #333' }}
              >
                <Plus className="h-5 w-5 text-[#555]" />
                <span className="text-[10px] font-medium text-[#555]">Add Page</span>
              </button>
            </div>
          </div>
        </ScrollArea>
      </div>
    </div>
  );
}
