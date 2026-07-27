import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, ChevronRight, Sparkles } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { cn } from '@/lib/utils';
import { motion } from 'framer-motion';
import DesignStudioShell from '@/components/design-studio/DesignStudioShell';

const TEMPLATE_CATEGORIES = [
  { label: 'Presentation', gradient: 'from-orange-100 to-orange-50', accent: 'text-orange-700', count: 2400 },
  { label: 'Poster', gradient: 'from-yellow-100 to-amber-50', accent: 'text-amber-700', count: 1800 },
  { label: 'Resume', gradient: 'from-pink-100 to-pink-50', accent: 'text-pink-700', count: 950 },
  { label: 'Email', gradient: 'from-blue-100 to-blue-50', accent: 'text-blue-700', count: 600 },
  { label: 'Logo', gradient: 'from-green-100 to-green-50', accent: 'text-green-700', count: 3200 },
  { label: 'Flyer', gradient: 'from-teal-100 to-teal-50', accent: 'text-teal-700', count: 1400 },
  { label: 'Brochure', gradient: 'from-violet-100 to-violet-50', accent: 'text-violet-700', count: 780 },
  { label: 'Instagram Post', gradient: 'from-pink-100 to-rose-50', accent: 'text-rose-700', count: 5600 },
  { label: 'Instagram Story', gradient: 'from-purple-100 to-purple-50', accent: 'text-purple-700', count: 3100 },
  { label: 'Landscape Video', gradient: 'from-indigo-100 to-indigo-50', accent: 'text-indigo-700', count: 890 },
  { label: 'Invitation', gradient: 'from-amber-100 to-amber-50', accent: 'text-amber-700', count: 1200 },
  { label: 'Mobile Video', gradient: 'from-fuchsia-100 to-fuchsia-50', accent: 'text-fuchsia-700', count: 670 },
  { label: 'Facebook Post', gradient: 'from-blue-100 to-sky-50', accent: 'text-sky-700', count: 2100 },
  { label: 'Business Card', gradient: 'from-slate-100 to-slate-50', accent: 'text-slate-700', count: 1500 },
];

const TRENDING = [
  { title: 'Modern Pitch Deck', type: 'Presentation', color: 'bg-gradient-to-br from-orange-400 to-pink-500' },
  { title: 'Minimal Resume', type: 'Resume', color: 'bg-gradient-to-br from-slate-400 to-gray-600' },
  { title: 'Story Highlight', type: 'Instagram Story', color: 'bg-gradient-to-br from-purple-400 to-pink-500' },
  { title: 'Product Flyer', type: 'Flyer', color: 'bg-gradient-to-br from-teal-400 to-cyan-500' },
  { title: 'Event Invitation', type: 'Invitation', color: 'bg-gradient-to-br from-amber-400 to-orange-500' },
  { title: 'Newsletter Layout', type: 'Email', color: 'bg-gradient-to-br from-green-400 to-emerald-500' },
  { title: 'Brand Logo Pack', type: 'Logo', color: 'bg-gradient-to-br from-violet-400 to-purple-600' },
  { title: 'YouTube Banner', type: 'Video', color: 'bg-gradient-to-br from-red-400 to-rose-500' },
];

export default function DesignStudioTemplates() {
  const navigate = useNavigate();
  const [search, setSearch] = useState('');

  const openEditor = () => navigate('/lounge/office/design-studio/editor');

  return (
    <DesignStudioShell activeNav="templates">
      <div className="px-8 py-8 max-w-6xl mx-auto">
        <div className="mb-8">
          <h1 className="text-2xl font-bold text-foreground mb-2">Templates</h1>
          <p className="text-sm text-muted-foreground">Browse thousands of professionally designed templates.</p>
        </div>

        {/* Search */}
        <div className="relative max-w-xl mb-8">
          <Sparkles className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search templates..." className="pl-10 h-11" />
        </div>

        {/* Categories */}
        <h2 className="text-lg font-bold text-foreground mb-4">Browse by category</h2>
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-7 gap-3 mb-10">
          {TEMPLATE_CATEGORIES.map((tmpl, i) => (
            <motion.button key={tmpl.label}
              initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3, delay: i * 0.03 }}
              onClick={openEditor}
              className={cn("relative rounded-xl overflow-hidden h-24 p-3 text-left transition-all hover:shadow-md hover:scale-[1.02] group bg-gradient-to-br", tmpl.gradient)}
            >
              <span className={cn("text-xs font-semibold leading-tight block", tmpl.accent)}>{tmpl.label}</span>
              <span className={cn("text-[10px] mt-1 block opacity-60", tmpl.accent)}>{tmpl.count.toLocaleString()} templates</span>
              <div className="absolute bottom-1 right-1 h-7 w-7 rounded-lg bg-white/40 dark:bg-white/20 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                <ChevronRight className="h-3 w-3 text-foreground/60" />
              </div>
            </motion.button>
          ))}
        </div>

        {/* Trending */}
        <h2 className="text-lg font-bold text-foreground mb-4">Trending now</h2>
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
          {TRENDING.map((t, i) => (
            <motion.button key={t.title}
              initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3, delay: i * 0.04 }}
              onClick={openEditor} className="group text-left"
            >
              <div className={cn("aspect-[4/3] rounded-xl mb-2 transition-all group-hover:shadow-lg group-hover:scale-[1.02] flex items-center justify-center", t.color)}>
                <Search className="h-6 w-6 text-white opacity-20" />
              </div>
              <p className="text-xs font-semibold text-foreground truncate">{t.title}</p>
              <p className="text-[10px] text-muted-foreground">{t.type}</p>
            </motion.button>
          ))}
        </div>
      </div>
    </DesignStudioShell>
  );
}
