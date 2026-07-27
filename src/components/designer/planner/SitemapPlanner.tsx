import { useState, useCallback, useEffect, useRef } from 'react';
import { Plus, FileText, Trash2, Globe, Sparkles, Zap, Building2, Code, ShoppingBag, Briefcase, Palette, GraduationCap, Heart, Utensils, Camera, ZoomIn, ZoomOut, Maximize } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { ScrollArea } from '@/components/ui/scroll-area';
import { toast } from '@/hooks/use-toast';
import { notifySitePagesUpdated } from './useSitePagesSync';

interface SitemapNode {
  id: string;
  name: string;
  slug: string;
  sections: string[];
  children: SitemapNode[];
  expanded: boolean;
}

function generateId() {
  return Math.random().toString(36).substr(2, 9);
}

const PAGE_COUNTS = [3, 5, 10, 15, 20];

const INDUSTRY_TEMPLATES = [
  { icon: Building2, label: 'Agency', prompt: 'A digital creative agency showcasing services, portfolio, team, and client testimonials' },
  { icon: Code, label: 'SaaS', prompt: 'A SaaS product landing page with features, pricing tiers, integrations, FAQ, and signup' },
  { icon: ShoppingBag, label: 'E-Commerce', prompt: 'An online store with product listings, categories, featured products, reviews, and checkout' },
  { icon: Briefcase, label: 'Corporate', prompt: 'A corporate business website with about us, services, case studies, careers, and contact' },
  { icon: Palette, label: 'Creative', prompt: 'A creative portfolio website for a designer or artist with gallery, about, services, and blog' },
  { icon: GraduationCap, label: 'Education', prompt: 'An online education platform with courses, instructors, testimonials, pricing, and blog' },
  { icon: Heart, label: 'Healthcare', prompt: 'A healthcare provider website with services, doctors, appointments, testimonials, and resources' },
  { icon: Utensils, label: 'Restaurant', prompt: 'A restaurant website with menu, reservations, gallery, about, reviews, and location' },
  { icon: Camera, label: 'Photography', prompt: 'A photography studio website with portfolio gallery, packages, about, testimonials, and booking' },
  { icon: Globe, label: 'Startup', prompt: 'A modern startup landing page with product features, how it works, team, pricing, and investors' },
];

interface SitemapPlannerProps {
  siteId?: string;
}

function SitemapCard({ node, depth = 0, onRemove, onAddSection, onRemoveSection, onAddChild }: {
  node: SitemapNode;
  depth?: number;
  onRemove: (id: string) => void;
  onAddSection: (nodeId: string) => void;
  onRemoveSection: (nodeId: string, idx: number) => void;
  onAddChild: (parentId: string) => void;
}) {
  return (
    <div className="flex flex-col items-center" style={{ minWidth: depth === 0 ? 'auto' : undefined }}>
      {/* Card */}
      <div
        className="rounded-lg border overflow-hidden"
        style={{
          width: depth === 0 ? 240 : 200,
          backgroundColor: depth === 0 ? '#252525' : '#1e1e1e',
          borderColor: depth === 0 ? '#0073E6' : '#333',
          boxShadow: depth === 0 ? '0 0 20px rgba(0,115,230,0.15)' : '0 2px 8px rgba(0,0,0,0.3)',
        }}
      >
        <div className="flex items-center gap-2 px-3 py-2.5" style={{ borderBottom: '1px solid #2a2a2a' }}>
          <FileText className="h-3.5 w-3.5" style={{ color: depth === 0 ? '#4a9eff' : '#888' }} />
          <span className="text-[11px] font-semibold text-[#e0e0e0] flex-1 truncate">{node.name}</span>
          <span className="text-[9px] text-[#555] font-mono">{node.slug}</span>
          {depth > 0 && (
            <button onClick={() => onRemove(node.id)} className="opacity-60 hover:opacity-100 transition-opacity">
              <Trash2 className="h-3 w-3 text-[#555] hover:text-red-400" />
            </button>
          )}
        </div>

        <div className="px-2 py-1.5 space-y-0.5 max-h-[200px] overflow-y-auto scrollbar-none">
          {node.sections.map((section, idx) => {
            const isHeader = section.toLowerCase().includes('header') && idx === 0;
            const isFooter = section.toLowerCase() === 'footer';
            const color = isHeader ? '#4a9eff' : isFooter ? '#666' : section.toLowerCase().includes('cta') ? '#e6a817' : section.toLowerCase().includes('feature') ? '#22c55e' : section.toLowerCase().includes('hero') ? '#a78bfa' : section.toLowerCase().includes('testimonial') ? '#f472b6' : section.toLowerCase().includes('contact') ? '#06b6d4' : section.toLowerCase().includes('stats') ? '#fb923c' : '#999';
            return (
              <div key={idx} className="group flex items-center gap-1.5 px-2 py-0.5 rounded hover:bg-white/[0.04] transition-colors">
                <div className="w-1.5 h-1.5 rounded-full shrink-0" style={{ backgroundColor: color }} />
                <span className="text-[9px] flex-1 truncate" style={{ color }}>{section}</span>
                <button onClick={() => onRemoveSection(node.id, idx)} className="opacity-0 group-hover:opacity-100 transition-opacity">
                  <Trash2 className="h-2.5 w-2.5 text-[#555] hover:text-red-400" />
                </button>
              </div>
            );
          })}
          <button onClick={() => onAddSection(node.id)} className="flex items-center gap-1 px-2 py-0.5 text-[8px] text-[#555] hover:text-[#888] transition-colors w-full">
            <Plus className="h-2.5 w-2.5" /> Add section
          </button>
        </div>
      </div>

      {/* Tree branches to children */}
      {node.children.length > 0 && (
        <div className="flex flex-col items-center">
          {/* Vertical connector from parent */}
          <div className="w-px h-8" style={{ backgroundColor: '#444' }} />

          {/* Horizontal bar spanning all children */}
          <div className="relative">
            <div className="flex items-start gap-6">
              {node.children.map((child, childIdx) => (
                <div key={child.id} className="flex flex-col items-center relative">
                  {/* Vertical drop from horizontal bar */}
                  <div className="w-px h-6" style={{ backgroundColor: '#444' }} />
                  <SitemapCard
                    node={child}
                    depth={depth + 1}
                    onRemove={onRemove}
                    onAddSection={onAddSection}
                    onRemoveSection={onRemoveSection}
                    onAddChild={onAddChild}
                  />
                </div>
              ))}
            </div>
            {/* Horizontal connecting bar */}
            {node.children.length > 1 && (
              <div
                className="absolute top-0 h-px"
                style={{
                  backgroundColor: '#444',
                  left: `calc(${100 / (2 * node.children.length)}% + 1px)`,
                  right: `calc(${100 / (2 * node.children.length)}% + 1px)`,
                }}
              />
            )}
          </div>
        </div>
      )}

      {/* Add child page button */}
      {depth < 2 && (
        <div className="mt-3">
          <button onClick={() => onAddChild(node.id)} className="flex items-center gap-1 px-2.5 py-1 rounded-md text-[8px] font-medium transition-all hover:bg-white/[0.06]" style={{ color: '#555', border: '1px dashed #333' }}>
            <Plus className="h-2.5 w-2.5" /> Add page
          </button>
        </div>
      )}
    </div>
  );
}

export function SitemapPlanner({ siteId }: SitemapPlannerProps) {
  const [nodes, setNodes] = useState<SitemapNode[]>([]);
  const [projectName, setProjectName] = useState('Project');
  const [showAIPanel, setShowAIPanel] = useState(true);
  const [prompt, setPrompt] = useState('');
  const [pageCount, setPageCount] = useState(5);
  const [generating, setGenerating] = useState(false);
  const [progress, setProgress] = useState('');
  const [hasGenerated, setHasGenerated] = useState(false);

  // Canvas zoom/pan state
  const [canvasZoom, setCanvasZoom] = useState(1);
  const [panOffset, setPanOffset] = useState({ x: 0, y: 0 });
  const [isPanning, setIsPanning] = useState(false);
  const panStart = useRef({ x: 0, y: 0 });
  const panOffsetStart = useRef({ x: 0, y: 0 });
  const canvasRef = useRef<HTMLDivElement>(null);
  const zoomRef = useRef(canvasZoom);
  const panRef = useRef(panOffset);
  zoomRef.current = canvasZoom;
  panRef.current = panOffset;

  // Wheel zoom (zoom to cursor)
  useEffect(() => {
    const el = canvasRef.current;
    if (!el) return;
    const onWheel = (e: WheelEvent) => {
      e.preventDefault();
      e.stopPropagation();
      const factor = e.deltaY > 0 ? 0.85 : 1.15;
      const rect = el.getBoundingClientRect();
      const mouseX = e.clientX - rect.left;
      const mouseY = e.clientY - rect.top;
      const prevZoom = zoomRef.current;
      const newZoom = Math.min(3, Math.max(0.1, prevZoom * factor));
      const ratio = newZoom / prevZoom;
      const prev = panRef.current;
      setPanOffset({
        x: mouseX - ratio * (mouseX - prev.x),
        y: mouseY - ratio * (mouseY - prev.y),
      });
      setCanvasZoom(newZoom);
    };
    el.addEventListener('wheel', onWheel, { passive: false });
    return () => el.removeEventListener('wheel', onWheel);
  }, [hasGenerated]);

  // Middle-mouse pan
  useEffect(() => {
    const el = canvasRef.current;
    if (!el) return;
    const onDown = (e: PointerEvent) => {
      if (e.button !== 1) return;
      e.preventDefault();
      setIsPanning(true);
      panStart.current = { x: e.clientX, y: e.clientY };
      panOffsetStart.current = { ...panOffset };
      el.setPointerCapture(e.pointerId);
    };
    const onMove = (e: PointerEvent) => {
      if (!isPanning) return;
      setPanOffset({
        x: panOffsetStart.current.x + (e.clientX - panStart.current.x),
        y: panOffsetStart.current.y + (e.clientY - panStart.current.y),
      });
    };
    const onUp = (e: PointerEvent) => {
      if (e.button !== 1) return;
      setIsPanning(false);
    };
    el.addEventListener('pointerdown', onDown);
    el.addEventListener('pointermove', onMove);
    el.addEventListener('pointerup', onUp);
    return () => {
      el.removeEventListener('pointerdown', onDown);
      el.removeEventListener('pointermove', onMove);
      el.removeEventListener('pointerup', onUp);
    };
  }, [isPanning, panOffset]);

  // Prevent default middle-click scroll
  useEffect(() => {
    const el = canvasRef.current;
    if (!el) return;
    const prevent = (e: MouseEvent) => { if (e.button === 1) e.preventDefault(); };
    el.addEventListener('mousedown', prevent);
    return () => el.removeEventListener('mousedown', prevent);
  }, []);

  const resetView = () => { setCanvasZoom(1); setPanOffset({ x: 0, y: 0 }); };
  const zoomIn = () => setCanvasZoom(z => Math.min(3, z + 0.15));
  const zoomOut = () => setCanvasZoom(z => Math.max(0.1, z - 0.15));

  // Load existing pages from DB to build sitemap
  const loadSitemapFromDB = useCallback(async () => {
    if (!siteId) return;
    const { data } = await supabase
      .from('designer_pages')
      .select('id, page_name, slug, sort_order')
      .eq('site_id', siteId)
      .order('sort_order');
    if (data && data.length > 0) {
      const home = data.find(p => p.slug === '/') || data[0];
      const children = data.filter(p => p.id !== home.id);
      const tree: SitemapNode[] = [{
        id: home.id,
        name: home.page_name,
        slug: home.slug,
        sections: ['Header', 'Hero Section', 'Feature Section', 'Footer'],
        children: children.map(c => ({
          id: c.id,
          name: c.page_name,
          slug: c.slug,
          sections: ['Header', 'Hero Section', 'Feature Section', 'Footer'],
          children: [],
          expanded: true,
        })),
        expanded: true,
      }];
      setNodes(tree);
      setHasGenerated(true);
      setShowAIPanel(false);
    }
  }, [siteId]);

  useEffect(() => { loadSitemapFromDB(); }, [loadSitemapFromDB]);

  // Listen for cross-component sync events
  useEffect(() => {
    const handler = () => loadSitemapFromDB();
    window.addEventListener('site-pages-updated', handler);
    return () => window.removeEventListener('site-pages-updated', handler);
  }, [loadSitemapFromDB]);

  const generateSitemap = async (overridePrompt?: string) => {
    const finalPrompt = overridePrompt || prompt;
    if (!finalPrompt.trim()) {
      toast({ title: 'Please describe your website', variant: 'destructive' });
      return;
    }
    if (!siteId) {
      toast({ title: 'No site selected', variant: 'destructive' });
      return;
    }

    setGenerating(true);
    setProgress('Generating sitemap structure…');

    try {
      const { data, error } = await supabase.functions.invoke('generate-sitemap', {
        body: { prompt: finalPrompt, pageCount },
      });

      if (error) throw error;
      if (!data?.success || !data?.pages) throw new Error(data?.error || 'Generation failed');

      const aiPages = data.pages as { page_name: string; slug: string; parent_slug: string | null; sections: string[] }[];

      // Get current user
      const { data: userData } = await supabase.auth.getUser();
      if (!userData.user) throw new Error('Not authenticated');

      // Delete existing pages for this site first
      setProgress('Clearing existing pages…');
      await supabase.from('designer_pages').delete().eq('site_id', siteId);

      // Save pages to database
      setProgress(`Creating ${aiPages.length} pages…`);
      for (let i = 0; i < aiPages.length; i++) {
        const aiPage = aiPages[i];
        await supabase.from('designer_pages').insert({
          site_id: siteId,
          user_id: userData.user.id,
          page_name: aiPage.page_name,
          slug: aiPage.slug,
          sort_order: i,
          elements: [] as any, // Empty elements - wireframe generation fills these
        });
      }

      // Build proper hierarchical tree from parent_slug
      function buildTree(pages: typeof aiPages, parentSlug: string | null): SitemapNode[] {
        return pages
          .filter(p => (p.parent_slug || null) === parentSlug)
          .map(p => ({
            id: generateId(),
            name: p.page_name,
            slug: p.slug,
            sections: p.sections,
            children: buildTree(pages, p.slug),
            expanded: true,
          }));
      }
      const tree = buildTree(aiPages, null);
      // Fallback: if tree is empty (no null parent_slug), use "/" as root
      const finalTree = tree.length > 0 ? tree : (() => {
        const home = aiPages.find(p => p.slug === '/') || aiPages[0];
        return [{
          id: generateId(),
          name: home.page_name,
          slug: home.slug,
          sections: home.sections,
          children: buildTree(aiPages, home.slug).length > 0
            ? buildTree(aiPages, home.slug)
            : aiPages.filter(p => p.slug !== home.slug).map(c => ({
                id: generateId(),
                name: c.page_name,
                slug: c.slug,
                sections: c.sections,
                children: [],
                expanded: true,
              })),
          expanded: true,
        }];
      })();

      setNodes(finalTree);
      setHasGenerated(true);
      setShowAIPanel(false);
      setProgress('Done!');
      notifySitePagesUpdated();
      toast({ title: `Sitemap generated with ${aiPages.length} pages!` });
    } catch (err: any) {
      console.error('Sitemap generation error:', err);
      toast({ title: 'Generation failed', description: err.message, variant: 'destructive' });
    } finally {
      setGenerating(false);
      setProgress('');
    }
  };

  const addChild = useCallback((parentId: string) => {
    const newNode: SitemapNode = {
      id: generateId(), name: 'New Page', slug: '/new-page',
      sections: ['Header', 'Hero Section', 'Footer'], children: [], expanded: true,
    };
    function addToTree(nodes: SitemapNode[]): SitemapNode[] {
      return nodes.map(n => {
        if (n.id === parentId) return { ...n, children: [...n.children, newNode] };
        return { ...n, children: addToTree(n.children) };
      });
    }
    setNodes(prev => addToTree(prev));
  }, []);

  const removeNode = useCallback((id: string) => {
    function removeFromTree(nodes: SitemapNode[]): SitemapNode[] {
      return nodes.filter(n => n.id !== id).map(n => ({ ...n, children: removeFromTree(n.children) }));
    }
    setNodes(prev => removeFromTree(prev));
  }, []);

  const addSection = useCallback((nodeId: string) => {
    function add(nodes: SitemapNode[]): SitemapNode[] {
      return nodes.map(n => {
        if (n.id === nodeId) {
          const footerIdx = n.sections.findIndex(s => s.toLowerCase() === 'footer');
          const newSections = [...n.sections];
          newSections.splice(footerIdx >= 0 ? footerIdx : n.sections.length, 0, 'Feature Section');
          return { ...n, sections: newSections };
        }
        return { ...n, children: add(n.children) };
      });
    }
    setNodes(prev => add(prev));
  }, []);

  const removeSection = useCallback((nodeId: string, idx: number) => {
    function remove(nodes: SitemapNode[]): SitemapNode[] {
      return nodes.map(n => {
        if (n.id === nodeId) return { ...n, sections: n.sections.filter((_, i) => i !== idx) };
        return { ...n, children: remove(n.children) };
      });
    }
    setNodes(prev => remove(prev));
  }, []);

  return (
    <div className="flex h-full w-full" style={{ backgroundColor: '#181818' }}>
      {/* AI Generation sidebar */}
      {showAIPanel && (
        <div className="w-[320px] flex flex-col h-full shrink-0" style={{ backgroundColor: '#1e1e1e', borderRight: '1px solid #2a2a2a' }}>
          <div className="flex items-center gap-2 px-4 py-3" style={{ borderBottom: '1px solid #2a2a2a' }}>
            <Sparkles className="h-4 w-4 text-[#a78bfa]" />
            <span className="text-xs font-semibold text-[#e0e0e0]">AI Sitemap Generator</span>
          </div>

          <ScrollArea className="flex-1">
            <div className="p-4 space-y-5">
              <div>
                <label className="text-[9px] font-semibold text-[#888] uppercase tracking-wider">Describe your website</label>
                <textarea
                  value={prompt}
                  onChange={e => setPrompt(e.target.value)}
                  placeholder="A modern SaaS platform for project management with team collaboration features, pricing plans, and integrations…"
                  className="mt-1.5 w-full h-24 px-3 py-2 rounded-md text-xs text-[#e0e0e0] placeholder:text-[#555] outline-none resize-none"
                  style={{ backgroundColor: '#252525', border: '1px solid #333' }}
                  disabled={generating}
                />
              </div>

              <div>
                <label className="text-[9px] font-semibold text-[#888] uppercase tracking-wider">Number of pages</label>
                <div className="mt-1.5 flex flex-wrap gap-1.5">
                  {PAGE_COUNTS.map(n => (
                    <button
                      key={n}
                      onClick={() => setPageCount(n)}
                      disabled={generating}
                      className="px-3 py-1.5 rounded-md text-[10px] font-semibold transition-all"
                      style={{
                        backgroundColor: pageCount === n ? '#0073E6' : '#252525',
                        color: pageCount === n ? '#fff' : '#888',
                        border: `1px solid ${pageCount === n ? '#0073E6' : '#333'}`,
                      }}
                    >
                      {n}
                    </button>
                  ))}
                </div>
              </div>

              <button
                onClick={() => generateSitemap()}
                disabled={generating || !prompt.trim()}
                className="w-full flex items-center justify-center gap-2 py-3 rounded-lg text-xs font-semibold transition-all disabled:opacity-50"
                style={{ backgroundColor: '#a78bfa', color: '#000', boxShadow: '0 4px 16px rgba(167,139,250,0.2)' }}
              >
                {generating ? (
                  <>
                    <div className="w-3.5 h-3.5 border-2 border-black/20 border-t-black rounded-full animate-spin" />
                    {progress}
                  </>
                ) : (
                  <>
                    <Zap className="h-3.5 w-3.5" />
                    Generate Sitemap
                  </>
                )}
              </button>

              <div className="flex items-center gap-3">
                <div className="flex-1 h-[1px]" style={{ backgroundColor: '#2a2a2a' }} />
                <span className="text-[9px] text-[#555] font-medium">or use a template</span>
                <div className="flex-1 h-[1px]" style={{ backgroundColor: '#2a2a2a' }} />
              </div>

              <div className="space-y-1.5">
                {INDUSTRY_TEMPLATES.map(tmpl => {
                  const Icon = tmpl.icon;
                  return (
                    <button
                      key={tmpl.label}
                      onClick={() => { setPrompt(tmpl.prompt); generateSitemap(tmpl.prompt); }}
                      disabled={generating}
                      className="w-full flex items-center gap-3 px-3 py-2.5 rounded-md text-left transition-all hover:bg-white/5 disabled:opacity-50"
                      style={{ border: '1px solid #2a2a2a' }}
                    >
                      <Icon className="h-4 w-4 text-[#0073E6] shrink-0" />
                      <div>
                        <div className="text-[10px] font-semibold text-[#e0e0e0]">{tmpl.label}</div>
                        <div className="text-[8px] text-[#666] line-clamp-1">{tmpl.prompt}</div>
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>
          </ScrollArea>
        </div>
      )}

      {/* Main sitemap area */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Top bar */}
        <div className="flex items-center justify-between px-6 py-3 shrink-0" style={{ borderBottom: '1px solid #252525' }}>
          <div className="flex items-center gap-2">
            <Globe className="h-4 w-4 text-[#666]" />
            <input
              value={projectName}
              onChange={e => setProjectName(e.target.value)}
              className="bg-transparent text-[13px] font-semibold text-[#ccc] outline-none border-none"
              style={{ caretColor: '#0073E6' }}
            />
          </div>

          {/* Zoom controls */}
          <div className="flex items-center gap-1">
            <button onClick={zoomOut} className="h-7 w-7 flex items-center justify-center rounded-md transition-all hover:bg-white/10" style={{ backgroundColor: '#252525', border: '1px solid #333' }}>
              <ZoomOut className="h-3.5 w-3.5 text-[#888]" />
            </button>
            <span className="text-[10px] font-mono text-[#888] w-12 text-center select-none">{Math.round(canvasZoom * 100)}%</span>
            <button onClick={zoomIn} className="h-7 w-7 flex items-center justify-center rounded-md transition-all hover:bg-white/10" style={{ backgroundColor: '#252525', border: '1px solid #333' }}>
              <ZoomIn className="h-3.5 w-3.5 text-[#888]" />
            </button>
            <button onClick={resetView} className="h-7 w-7 flex items-center justify-center rounded-md transition-all hover:bg-white/10 ml-1" style={{ backgroundColor: '#252525', border: '1px solid #333' }} title="Reset view">
              <Maximize className="h-3.5 w-3.5 text-[#888]" />
            </button>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setShowAIPanel(!showAIPanel)}
              className="h-7 px-3 flex items-center gap-1.5 rounded-md text-[10px] font-semibold transition-all"
              style={{
                backgroundColor: showAIPanel ? '#a78bfa' : 'rgba(167,139,250,0.15)',
                color: showAIPanel ? '#000' : '#a78bfa',
                border: `1px solid ${showAIPanel ? '#a78bfa' : 'rgba(167,139,250,0.3)'}`,
              }}
            >
              <Sparkles className="h-3.5 w-3.5" />
              {hasGenerated ? 'Regenerate' : 'AI Generate'}
            </button>
            {hasGenerated && (
              <span className="text-[10px] text-[#555]">
                ✓ Sitemap ready
              </span>
            )}
          </div>
        </div>

        {nodes.length === 0 ? (
          <div className="flex-1 flex flex-col items-center justify-center gap-4">
            <Sparkles className="h-8 w-8 text-[#333]" />
            <div className="text-center">
              <p className="text-sm font-semibold text-[#666]">No sitemap yet</p>
              <p className="text-[11px] text-[#444] mt-1">Use the AI generator to create your sitemap structure</p>
            </div>
            <button
              onClick={() => setShowAIPanel(true)}
              className="h-8 px-4 flex items-center gap-2 rounded-lg text-[11px] font-semibold transition-all"
              style={{ backgroundColor: '#a78bfa', color: '#000' }}
            >
              <Sparkles className="h-3.5 w-3.5" />
              Generate Sitemap
            </button>
          </div>
        ) : (
          /* Infinite canvas */
          <div
            ref={canvasRef}
            className="flex-1 overflow-hidden relative"
            style={{
              cursor: isPanning ? 'grabbing' : 'default',
              backgroundColor: '#141414',
              backgroundImage: 'radial-gradient(circle, #222 1px, transparent 1px)',
              backgroundSize: `${20 * canvasZoom}px ${20 * canvasZoom}px`,
              backgroundPosition: `${panOffset.x}px ${panOffset.y}px`,
            }}
          >
            <div
              style={{
                transform: `translate(${panOffset.x}px, ${panOffset.y}px) scale(${canvasZoom})`,
                transformOrigin: '0 0',
                position: 'absolute',
                top: 0,
                left: 0,
              }}
            >
              <div className="flex justify-center py-16 px-16" style={{ minWidth: 'max-content' }}>
                {nodes.map(node => (
                  <SitemapCard
                    key={node.id}
                    node={node}
                    onRemove={removeNode}
                    onAddSection={addSection}
                    onRemoveSection={removeSection}
                    onAddChild={addChild}
                  />
                ))}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
