import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Search, Presentation, Heart, Play, Printer, FileText, Layout, Table2,
  Globe, Mail, Image, Crop, Upload, MoreHorizontal, Plus,
  ChevronRight,
} from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import DesignStudioShell from '@/components/design-studio/DesignStudioShell';

const CATEGORIES = [
  { label: 'Presentation', icon: Presentation, preset: { w: 1920, h: 1080 } },
  { label: 'Social media', icon: Heart, preset: { w: 1080, h: 1080 } },
  { label: 'Video', icon: Play, preset: { w: 1920, h: 1080 } },
  { label: 'Print', icon: Printer, preset: { w: 794, h: 1123 } },
  { label: 'Doc', icon: FileText, preset: { w: 794, h: 1123 } },
  { label: 'Whiteboard', icon: Layout, preset: { w: 1920, h: 1080 } },
  { label: 'Sheet', icon: Table2, preset: { w: 1920, h: 1080 } },
  { label: 'Website', icon: Globe, preset: { w: 1440, h: 900 } },
  { label: 'Email', icon: Mail, preset: { w: 600, h: 800 } },
  { label: 'Photo editor', icon: Image, preset: { w: 1080, h: 1080 } },
  { label: 'Custom size', icon: Crop, preset: { w: 800, h: 600 } },
  { label: 'Upload', icon: Upload, preset: null },
  { label: 'More', icon: MoreHorizontal, preset: null },
];

const CREATIVE_SUITE_APPS = [
  { name: 'Photo Studio', abbr: 'Ps', tagline: 'Image editing & compositing', route: '/lounge/creative/photo-studio' },
];

const TEMPLATE_CATEGORIES = [
  { label: 'Presentation' },
  { label: 'Poster' },
  { label: 'Resume' },
  { label: 'Email' },
  { label: 'Logo' },
  { label: 'Flyer' },
  { label: 'Brochure' },
  { label: 'Instagram post' },
  { label: 'Instagram story' },
  { label: 'Landscape video' },
  { label: 'Invitation' },
  { label: 'Mobile video' },
  { label: 'Facebook post' },
  { label: 'Business card' },
];

const RECENT_DESIGNS = [
  { title: 'Marketing Deck', type: 'Presentation', time: '2 hours ago' },
  { title: 'Brand Guidelines', type: 'Doc', time: '1 day ago' },
  { title: 'Social Campaign', type: 'Instagram post', time: '3 days ago' },
  { title: 'Product Launch', type: 'Poster', time: '5 days ago' },
  { title: 'Team Update', type: 'Presentation', time: '1 week ago' },
  { title: 'Newsletter', type: 'Email', time: '1 week ago' },
  { title: 'Event Flyer', type: 'Flyer', time: '2 weeks ago' },
  { title: 'Annual Report', type: 'Doc', time: '2 weeks ago' },
];

export default function DesignStudioHome() {
  const navigate = useNavigate();
  const [search, setSearch] = useState('');

  const openEditor = (w = 1080, h = 1080) => {
    navigate(`/lounge/office/design-studio/editor?w=${w}&h=${h}`);
  };

  return (
    <DesignStudioShell activeNav="home">
      {/* Header */}
      <div className="px-8 pt-12 pb-8 max-w-4xl mx-auto text-center">
        <h1 className="text-2xl font-semibold tracking-[-0.015em] text-foreground mb-6">
          What will you design today?
        </h1>

        {/* Search */}
        <div className="max-w-2xl mx-auto">
          <div className="relative">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Search millions of templates"
              className="pl-11 pr-4 h-11 text-sm bg-card border-border/60 rounded-[10px]"
            />
          </div>
        </div>
      </div>

      {/* Category icons */}
      <div className="px-8 pb-8">
        <div className="flex items-center justify-center gap-5 flex-wrap max-w-4xl mx-auto">
          {CATEGORIES.map((cat) => (
            <button key={cat.label}
              onClick={() => cat.preset && openEditor(cat.preset.w, cat.preset.h)}
              className="flex flex-col items-center gap-2 group w-16"
            >
              <div className="h-11 w-11 rounded-[10px] border border-border/60 bg-card flex items-center justify-center text-muted-foreground transition-colors duration-150 group-hover:text-foreground group-hover:border-border">
                <cat.icon className="h-4 w-4" />
              </div>
              <span className="text-[11px] text-muted-foreground group-hover:text-foreground transition-colors text-center leading-tight font-medium">{cat.label}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Explore templates */}
      <div className="px-8 pb-8">
        <h2 className="text-[13.5px] font-[550] tracking-[-0.01em] text-foreground mb-3">Explore templates</h2>
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-7 gap-3">
          {TEMPLATE_CATEGORIES.map((tmpl) => (
            <button key={tmpl.label}
              onClick={() => openEditor()}
              className="relative rounded-[10px] border border-border/60 bg-card h-20 p-3 text-left transition-colors duration-150 hover:bg-foreground/[0.02] hover:border-border group"
            >
              <span className="text-xs font-medium leading-tight block text-foreground">{tmpl.label}</span>
              <ChevronRight className="absolute bottom-2.5 right-2.5 h-3.5 w-3.5 text-muted-foreground/40 opacity-0 group-hover:opacity-100 transition-opacity" />
            </button>
          ))}
        </div>
      </div>

      {/* Recent designs */}
      <div className="px-8 pb-10">
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-[13.5px] font-[550] tracking-[-0.01em] text-foreground">Recent designs</h2>
          <Button variant="ghost" size="sm" className="text-xs text-muted-foreground" onClick={() => navigate('/lounge/office/design-studio/projects')}>
            See all <ChevronRight className="h-3 w-3 ml-1" />
          </Button>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-4 xl:grid-cols-5 gap-4">
          {RECENT_DESIGNS.map((design) => (
            <button key={design.title}
              onClick={() => openEditor()}
              className="group text-left"
            >
              <div className="aspect-[4/3] rounded-[10px] border border-border/60 bg-sunken mb-2 transition-colors duration-150 group-hover:border-border">
                <div className="h-full w-full flex items-center justify-center">
                  <FileText className="h-6 w-6 text-muted-foreground/40" />
                </div>
              </div>
              <p className="text-[12px] font-medium text-foreground truncate group-hover:text-primary transition-colors">{design.title}</p>
              <div className="flex items-center gap-1.5 mt-0.5">
                <span className="text-[10px] text-muted-foreground">{design.type}</span>
                <span className="text-[10px] text-muted-foreground/40">·</span>
                <span className="text-[10px] text-muted-foreground/60">{design.time}</span>
              </div>
            </button>
          ))}
        </div>
      </div>

      {/* Quooro Creative Suite */}
      <div className="px-8 pb-12">
        <div className="mb-5">
          <h2 className="text-[13.5px] font-[550] tracking-[-0.01em] text-foreground mb-1">Quooro Creative Suite</h2>
          <p className="text-[13px] text-muted-foreground">Professional creative tools for every workflow.</p>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-3">
          {CREATIVE_SUITE_APPS.map((app) => (
            <button key={app.name}
              onClick={() => app.route ? navigate(app.route) : openEditor()}
              className="group relative rounded-[10px] border border-border/60 bg-card p-4 text-left transition-colors duration-150 hover:bg-foreground/[0.02] hover:border-border"
            >
              <div className="h-10 w-10 rounded-[10px] border border-border/60 bg-sunken flex items-center justify-center mb-3">
                <span className="text-foreground font-semibold text-sm tracking-tight">{app.abbr}</span>
              </div>
              <span className="text-[13px] font-medium text-foreground block leading-tight">{app.name}</span>
              <span className="text-[10px] text-muted-foreground leading-tight block mt-0.5">{app.tagline}</span>
              <ChevronRight className="absolute top-3 right-3 h-3.5 w-3.5 text-muted-foreground/30 group-hover:text-muted-foreground transition-colors" />
            </button>
          ))}
        </div>
      </div>
    </DesignStudioShell>
  );
}
