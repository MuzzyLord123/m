import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, ChevronRight, LayoutTemplate } from 'lucide-react';
import { Input } from '@/components/ui/input';
import DesignStudioShell from '@/components/design-studio/DesignStudioShell';

const TEMPLATE_CATEGORIES = [
  { label: 'Presentation', count: 2400 },
  { label: 'Poster', count: 1800 },
  { label: 'Resume', count: 950 },
  { label: 'Email', count: 600 },
  { label: 'Logo', count: 3200 },
  { label: 'Flyer', count: 1400 },
  { label: 'Brochure', count: 780 },
  { label: 'Instagram post', count: 5600 },
  { label: 'Instagram story', count: 3100 },
  { label: 'Landscape video', count: 890 },
  { label: 'Invitation', count: 1200 },
  { label: 'Mobile video', count: 670 },
  { label: 'Facebook post', count: 2100 },
  { label: 'Business card', count: 1500 },
];

const TRENDING = [
  { title: 'Modern Pitch Deck', type: 'Presentation' },
  { title: 'Minimal Resume', type: 'Resume' },
  { title: 'Story Highlight', type: 'Instagram story' },
  { title: 'Product Flyer', type: 'Flyer' },
  { title: 'Event Invitation', type: 'Invitation' },
  { title: 'Newsletter Layout', type: 'Email' },
  { title: 'Brand Logo Pack', type: 'Logo' },
  { title: 'YouTube Banner', type: 'Video' },
];

export default function DesignStudioTemplates() {
  const navigate = useNavigate();
  const [search, setSearch] = useState('');

  const openEditor = () => navigate('/lounge/office/design-studio/editor');

  return (
    <DesignStudioShell activeNav="templates">
      <div className="px-8 py-8 max-w-6xl mx-auto">
        <div className="mb-8">
          <h1 className="text-[17px] font-semibold tracking-[-0.01em] text-foreground mb-1.5">Templates</h1>
          <p className="text-[13px] text-muted-foreground">Browse professionally designed templates.</p>
        </div>

        {/* Search */}
        <div className="relative max-w-xl mb-8">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search templates..." className="pl-10 h-10" />
        </div>

        {/* Categories */}
        <h2 className="text-[13.5px] font-[550] tracking-[-0.01em] text-foreground mb-3">Browse by category</h2>
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-7 gap-3 mb-10">
          {TEMPLATE_CATEGORIES.map((tmpl) => (
            <button key={tmpl.label}
              onClick={openEditor}
              className="relative rounded-[10px] border border-border/60 bg-card h-24 p-3 text-left transition-colors duration-150 hover:bg-foreground/[0.02] hover:border-border group"
            >
              <span className="text-xs font-medium leading-tight block text-foreground">{tmpl.label}</span>
              <span className="font-mono text-[10px] tabular-nums mt-1 block text-muted-foreground">{tmpl.count.toLocaleString()} templates</span>
              <ChevronRight className="absolute bottom-2.5 right-2.5 h-3 w-3 text-muted-foreground/40 opacity-0 group-hover:opacity-100 transition-opacity" />
            </button>
          ))}
        </div>

        {/* Trending */}
        <h2 className="text-[13.5px] font-[550] tracking-[-0.01em] text-foreground mb-3">Trending now</h2>
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
          {TRENDING.map((t) => (
            <button key={t.title}
              onClick={openEditor} className="group text-left"
            >
              <div className="aspect-[4/3] rounded-[10px] border border-border/60 bg-sunken mb-2 transition-colors duration-150 group-hover:border-border flex items-center justify-center">
                <LayoutTemplate className="h-5 w-5 text-muted-foreground/40" />
              </div>
              <p className="text-xs font-medium text-foreground truncate">{t.title}</p>
              <p className="text-[10px] text-muted-foreground">{t.type}</p>
            </button>
          ))}
        </div>
      </div>
    </DesignStudioShell>
  );
}
