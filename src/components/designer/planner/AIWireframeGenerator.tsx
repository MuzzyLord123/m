import { useState } from 'react';
import { Sparkles, Zap, Globe, Building2, ShoppingBag, Palette, Code, Briefcase, GraduationCap, Heart, Utensils, Camera } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { notifySitePagesUpdated } from './useSitePagesSync';
import { ALL_SECTION_BLOCKS } from '../constants/sectionBlocks';
import { EditorElement } from '../types';
import { ScrollArea } from '@/components/ui/scroll-area';
import { toast } from '@/hooks/use-toast';
import { generateWireframes } from './wireframeGenerator';

interface AIWireframeGeneratorProps {
  siteId: string;
  onGenerated: () => void;
  onClose: () => void;
}

const PAGE_COUNTS = [3, 5, 10, 20, 50, 100];

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

export function AIWireframeGenerator({ siteId, onGenerated, onClose }: AIWireframeGeneratorProps) {
  const [prompt, setPrompt] = useState('');
  const [pageCount, setPageCount] = useState(5);
  const [generating, setGenerating] = useState(false);
  const [progress, setProgress] = useState('');


  const generate = async (overridePrompt?: string) => {
    const finalPrompt = overridePrompt || prompt;
    if (!finalPrompt.trim()) {
      toast({ title: 'Please describe your website', variant: 'destructive' });
      return;
    }

    setGenerating(true);
    setProgress('Generating wireframe structure…');

    try {
      const sectionIds = ALL_SECTION_BLOCKS.map(b => b.id);
      const aiPages = generateWireframes(finalPrompt, pageCount, sectionIds);

      // Get current user
      const { data: userData } = await supabase.auth.getUser();
      if (!userData.user) throw new Error('Not authenticated');

      setProgress(`Creating ${aiPages.length} pages…`);

      // Build all page links for nav injection
      const allPageLinks = aiPages.map(p => ({ name: p.page_name, slug: p.slug }));

      // Create pages in database with resolved elements
      for (let i = 0; i < aiPages.length; i++) {
        const aiPage = aiPages[i];
        setProgress(`Creating page ${i + 1}/${aiPages.length}: ${aiPage.page_name}`);

        // Resolve section IDs to actual elements
        const elements: EditorElement[] = [];
        for (const sectionId of aiPage.sections) {
          const block = ALL_SECTION_BLOCKS.find(b => b.id === sectionId);
          if (block) {
            const fresh = JSON.parse(JSON.stringify(block.elements)) as EditorElement[];
            const assignIds = (el: EditorElement) => {
              el.id = crypto.randomUUID();
              el.children?.forEach(assignIds);
            };
            fresh.forEach(assignIds);
            elements.push(...fresh);
          }
        }

        // Inject inter-page links into navbar link elements
        function injectNavLinks(els: EditorElement[]) {
          for (const el of els) {
            if (el.type === 'link' && el.props?.text) {
              const text = (el.props.text as string).toLowerCase();
              const match = allPageLinks.find(p => p.name.toLowerCase() === text || p.slug.replace('/', '') === text);
              if (match) {
                el.props.href = `#${match.slug.replace(/^\//, '') || 'index'}`;
              }
            }
            if (el.children) injectNavLinks(el.children);
          }
        }
        injectNavLinks(elements);

        await supabase.from('designer_pages').insert({
          site_id: siteId,
          user_id: userData.user.id,
          page_name: aiPage.page_name,
          slug: aiPage.slug,
          sort_order: i,
          elements: elements as any,
        });
      }

      setProgress('Done!');
      toast({ title: `Generated ${aiPages.length} pages successfully!` });
      notifySitePagesUpdated();
      onGenerated();
    } catch (err: any) {
      console.error('Generation error:', err);
      toast({ title: 'Generation failed', description: err.message, variant: 'destructive' });
    } finally {
      setGenerating(false);
      setProgress('');
    }
  };

  return (
    <div
      className="w-[320px] flex flex-col h-full shrink-0"
      style={{ backgroundColor: '#1e1e1e', borderRight: '1px solid #2a2a2a' }}
    >
      {/* Header */}
      <div className="flex items-center gap-2 px-4 py-3" style={{ borderBottom: '1px solid #2a2a2a' }}>
        <Sparkles className="h-4 w-4 text-[#a78bfa]" />
        <span className="text-xs font-semibold text-[#e0e0e0]">AI Wireframe Generator</span>
      </div>

      <ScrollArea className="flex-1">
        <div className="p-4 space-y-5">
          {/* Prompt */}
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

          {/* Page count */}
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

          {/* Generate button */}
          <button
            onClick={() => generate()}
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
                Generate {pageCount} Pages
              </>
            )}
          </button>

          {/* Divider */}
          <div className="flex items-center gap-3">
            <div className="flex-1 h-[1px]" style={{ backgroundColor: '#2a2a2a' }} />
            <span className="text-[9px] text-[#555] font-medium">or use a template</span>
            <div className="flex-1 h-[1px]" style={{ backgroundColor: '#2a2a2a' }} />
          </div>

          {/* Industry templates */}
          <div className="space-y-1.5">
            {INDUSTRY_TEMPLATES.map(tmpl => {
              const Icon = tmpl.icon;
              return (
                <button
                  key={tmpl.label}
                  onClick={() => { setPrompt(tmpl.prompt); generate(tmpl.prompt); }}
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
  );
}
