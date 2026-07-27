import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Search, Presentation, Heart, Play, Printer, FileText, Layout, Table2,
  Globe, Mail, Image, Crop, Upload, MoreHorizontal, Sparkles, Plus,
  FolderOpen, Palette, Star, ChevronRight, Clock, TrendingUp
} from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { motion } from 'framer-motion';
import DesignStudioShell from '@/components/design-studio/DesignStudioShell';

const CATEGORIES = [
  { label: 'Presentation', icon: Presentation, color: 'bg-orange-500', preset: { w: 1920, h: 1080 } },
  { label: 'Social media', icon: Heart, color: 'bg-pink-500', preset: { w: 1080, h: 1080 } },
  { label: 'Video', icon: Play, color: 'bg-purple-600', preset: { w: 1920, h: 1080 } },
  { label: 'Print', icon: Printer, color: 'bg-teal-500', preset: { w: 794, h: 1123 } },
  { label: 'Doc', icon: FileText, color: 'bg-blue-500', preset: { w: 794, h: 1123 } },
  { label: 'Whiteboard', icon: Layout, color: 'bg-violet-500', preset: { w: 1920, h: 1080 } },
  { label: 'Sheet', icon: Table2, color: 'bg-green-500', preset: { w: 1920, h: 1080 } },
  { label: 'Website', icon: Globe, color: 'bg-cyan-600', preset: { w: 1440, h: 900 } },
  { label: 'Email', icon: Mail, color: 'bg-indigo-500', preset: { w: 600, h: 800 } },
  { label: 'Photo editor', icon: Image, color: 'bg-amber-600', preset: { w: 1080, h: 1080 } },
  { label: 'Custom size', icon: Crop, color: 'bg-gray-600', preset: { w: 800, h: 600 } },
  { label: 'Upload', icon: Upload, color: 'bg-gray-400', preset: null },
  { label: 'More', icon: MoreHorizontal, color: 'bg-gray-300', preset: null },
];

const CREATIVE_SUITE_APPS = [
  { name: 'Photo Studio', abbr: 'Ps', tagline: 'Image editing & compositing', gradient: 'linear-gradient(135deg, #001E36, #31A8FF)', route: '/lounge/creative/photo-studio' },
];

const TEMPLATE_CATEGORIES = [
  { label: 'Presentation', gradient: 'from-orange-100 to-orange-50', accent: 'text-orange-700' },
  { label: 'Poster', gradient: 'from-yellow-100 to-amber-50', accent: 'text-amber-700' },
  { label: 'Resume', gradient: 'from-pink-100 to-pink-50', accent: 'text-pink-700' },
  { label: 'Email', gradient: 'from-blue-100 to-blue-50', accent: 'text-blue-700' },
  { label: 'Logo', gradient: 'from-green-100 to-green-50', accent: 'text-green-700' },
  { label: 'Flyer', gradient: 'from-teal-100 to-teal-50', accent: 'text-teal-700' },
  { label: 'Brochure', gradient: 'from-violet-100 to-violet-50', accent: 'text-violet-700' },
  { label: 'Instagram Post', gradient: 'from-pink-100 to-rose-50', accent: 'text-rose-700' },
  { label: 'Instagram Story', gradient: 'from-purple-100 to-purple-50', accent: 'text-purple-700' },
  { label: 'Landscape Video', gradient: 'from-indigo-100 to-indigo-50', accent: 'text-indigo-700' },
  { label: 'Invitation', gradient: 'from-amber-100 to-amber-50', accent: 'text-amber-700' },
  { label: 'Mobile Video', gradient: 'from-fuchsia-100 to-fuchsia-50', accent: 'text-fuchsia-700' },
  { label: 'Facebook Post', gradient: 'from-blue-100 to-sky-50', accent: 'text-sky-700' },
  { label: 'Business Card', gradient: 'from-slate-100 to-slate-50', accent: 'text-slate-700' },
];

const RECENT_DESIGNS = [
  { title: 'Marketing Deck', type: 'Presentation', color: 'bg-gradient-to-br from-orange-400 to-pink-500', time: '2 hours ago' },
  { title: 'Brand Guidelines', type: 'Doc', color: 'bg-gradient-to-br from-blue-400 to-indigo-500', time: '1 day ago' },
  { title: 'Social Campaign', type: 'Instagram Post', color: 'bg-gradient-to-br from-purple-400 to-pink-500', time: '3 days ago' },
  { title: 'Product Launch', type: 'Poster', color: 'bg-gradient-to-br from-teal-400 to-cyan-500', time: '5 days ago' },
  { title: 'Team Update', type: 'Presentation', color: 'bg-gradient-to-br from-amber-400 to-orange-500', time: '1 week ago' },
  { title: 'Newsletter', type: 'Email', color: 'bg-gradient-to-br from-green-400 to-emerald-500', time: '1 week ago' },
  { title: 'Event Flyer', type: 'Flyer', color: 'bg-gradient-to-br from-violet-400 to-purple-600', time: '2 weeks ago' },
  { title: 'Annual Report', type: 'Doc', color: 'bg-gradient-to-br from-slate-400 to-gray-600', time: '2 weeks ago' },
];

export default function DesignStudioHome() {
  const navigate = useNavigate();
  const [search, setSearch] = useState('');

  const openEditor = (w = 1080, h = 1080) => {
    navigate(`/lounge/office/design-studio/editor?w=${w}&h=${h}`);
  };

  return (
    <DesignStudioShell activeNav="home">
      {/* Hero Section */}
      <div className="relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-r from-violet-200/60 via-purple-200/40 to-pink-200/50 dark:from-violet-900/30 dark:via-purple-900/20 dark:to-pink-900/25" />
        <div className="absolute inset-0 bg-gradient-to-b from-transparent to-background" style={{ top: '60%' }} />

        <div className="relative px-8 pt-12 pb-8 max-w-4xl mx-auto text-center">
          <motion.h1
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="text-3xl md:text-4xl font-bold bg-gradient-to-r from-violet-600 via-purple-600 to-pink-500 dark:from-violet-400 dark:via-purple-400 dark:to-pink-400 bg-clip-text text-transparent mb-6"
          >
            What will you design today?
          </motion.h1>

          {/* Search */}
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: 0.15 }}
            className="max-w-2xl mx-auto"
          >
            <div className="relative">
              <div className="absolute left-4 top-1/2 -translate-y-1/2 flex items-center gap-2">
                <Sparkles className="h-4 w-4 text-purple-400" />
              </div>
              <Input
                value={search}
                onChange={e => setSearch(e.target.value)}
                placeholder="Search millions of templates"
                className="pl-12 pr-12 h-12 text-sm bg-background border-border/60 rounded-xl shadow-sm focus:shadow-md transition-shadow"
              />
            </div>
          </motion.div>
        </div>
      </div>

      {/* Category Icons */}
      <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4, delay: 0.2 }} className="px-8 pb-8">
        <div className="flex items-center justify-center gap-5 flex-wrap max-w-4xl mx-auto">
          {CATEGORIES.map((cat) => (
            <button key={cat.label}
              onClick={() => cat.preset && openEditor(cat.preset.w, cat.preset.h)}
              className="flex flex-col items-center gap-2 group w-16"
            >
              <div className={cn("h-12 w-12 rounded-full flex items-center justify-center text-white transition-all duration-200 group-hover:scale-110 group-hover:shadow-lg", cat.color)}>
                <cat.icon className="h-5 w-5" />
              </div>
              <span className="text-[11px] text-muted-foreground group-hover:text-foreground transition-colors text-center leading-tight font-medium">{cat.label}</span>
            </button>
          ))}
        </div>
      </motion.div>

      {/* Explore Templates */}
      <div className="px-8 pb-8">
        <h2 className="text-xl font-bold text-foreground mb-4">Explore templates</h2>
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-7 gap-3">
          {TEMPLATE_CATEGORIES.map((tmpl, i) => (
            <motion.button key={tmpl.label}
              initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3, delay: 0.25 + i * 0.03 }}
              onClick={() => openEditor()}
              className={cn("relative rounded-xl overflow-hidden h-20 p-3 text-left transition-all duration-200 hover:shadow-md hover:scale-[1.02] group bg-gradient-to-br", tmpl.gradient)}
            >
              <span className={cn("text-xs font-semibold leading-tight block", tmpl.accent)}>{tmpl.label}</span>
              <div className="absolute bottom-1 right-1 h-8 w-8 rounded-lg bg-white/40 dark:bg-white/20 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                <ChevronRight className="h-3.5 w-3.5 text-foreground/60" />
              </div>
            </motion.button>
          ))}
        </div>
      </div>

      {/* Recent Designs */}
      <div className="px-8 pb-10">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-bold text-foreground">Recent designs</h2>
          <Button variant="ghost" size="sm" className="text-xs text-muted-foreground" onClick={() => navigate('/lounge/office/design-studio/projects')}>
            See all <ChevronRight className="h-3 w-3 ml-1" />
          </Button>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-4 xl:grid-cols-5 gap-4">
          {RECENT_DESIGNS.map((design, i) => (
            <motion.button key={design.title}
              initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3, delay: 0.3 + i * 0.04 }}
              onClick={() => openEditor()}
              className="group text-left"
            >
              <div className={cn("aspect-[4/3] rounded-xl mb-2 transition-all duration-200 group-hover:shadow-lg group-hover:scale-[1.02]", design.color)}>
                <div className="h-full w-full flex items-center justify-center opacity-30">
                  <FileText className="h-8 w-8 text-white" />
                </div>
              </div>
              <p className="text-[12px] font-semibold text-foreground truncate group-hover:text-primary transition-colors">{design.title}</p>
              <div className="flex items-center gap-1.5 mt-0.5">
                <span className="text-[10px] text-muted-foreground">{design.type}</span>
                <span className="text-[10px] text-muted-foreground/40">·</span>
                <span className="text-[10px] text-muted-foreground/60">{design.time}</span>
              </div>
            </motion.button>
          ))}
        </div>
      </div>

      {/* Quooro Creative Suite */}
      <div className="px-8 pb-12">
        <div className="mb-6">
          <h2 className="text-xl font-bold text-foreground mb-1">Quooro Creative Suite</h2>
          <p className="text-sm text-muted-foreground">Professional-grade creative tools for every workflow.</p>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-3">
          {CREATIVE_SUITE_APPS.map((app, i) => (
            <motion.button key={app.name}
              initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.35, delay: 0.15 + i * 0.04, type: 'spring', stiffness: 300, damping: 24 }}
              onClick={() => app.route ? navigate(app.route) : openEditor()}
              className="group relative rounded-2xl border border-border/30 bg-card p-4 text-left hover:shadow-xl hover:-translate-y-1 transition-all duration-300"
            >
              <div className="h-12 w-12 rounded-xl flex items-center justify-center mb-3 shadow-lg group-hover:scale-110 transition-transform duration-300"
                style={{ background: app.gradient }}>
                <span className="text-white font-bold text-sm tracking-tight">{app.abbr}</span>
              </div>
              <span className="text-[13px] font-bold text-foreground block leading-tight">{app.name}</span>
              <span className="text-[10px] text-muted-foreground/70 leading-tight block mt-0.5">{app.tagline}</span>
              <ChevronRight className="absolute top-3 right-3 h-3.5 w-3.5 text-muted-foreground/20 group-hover:text-foreground/50 group-hover:translate-x-0.5 transition-all" />
            </motion.button>
          ))}
        </div>
      </div>
    </DesignStudioShell>
  );
}
