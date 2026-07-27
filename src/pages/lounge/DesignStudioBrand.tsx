import { useState } from 'react';
import { Palette, Type, Image, Plus, Upload, ChevronRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { cn } from '@/lib/utils';
import { motion } from 'framer-motion';
import DesignStudioShell from '@/components/design-studio/DesignStudioShell';

const BRAND_COLORS = [
  { name: 'Primary', hex: '#7C3AED' },
  { name: 'Secondary', hex: '#EC4899' },
  { name: 'Accent', hex: '#F59E0B' },
  { name: 'Dark', hex: '#1F2937' },
  { name: 'Light', hex: '#F9FAFB' },
];

const BRAND_FONTS = [
  { name: 'Heading', font: 'Space Grotesk', weight: 'Bold', sample: 'The quick brown fox' },
  { name: 'Body', font: 'Inter', weight: 'Regular', sample: 'The quick brown fox jumps over the lazy dog' },
  { name: 'Display', font: 'SF Pro Display', weight: 'Semibold', sample: 'DISPLAY TEXT' },
];

export default function DesignStudioBrand() {
  const [brandName, setBrandName] = useState('My Brand');

  return (
    <DesignStudioShell activeNav="brand">
      <div className="px-8 py-8 max-w-4xl mx-auto">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-2xl font-bold text-foreground mb-1">Brand Kit</h1>
            <p className="text-sm text-muted-foreground">Manage your brand identity across all designs.</p>
          </div>
          <Button className="gap-2"><Plus className="h-4 w-4" /> New Brand Kit</Button>
        </div>

        {/* Brand Name */}
        <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} className="bg-card border border-border/40 rounded-2xl p-6 mb-6">
          <h2 className="text-sm font-semibold text-foreground mb-3">Brand Name</h2>
          <Input value={brandName} onChange={e => setBrandName(e.target.value)} className="max-w-sm" />
        </motion.div>

        {/* Logo */}
        <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.05 }}
          className="bg-card border border-border/40 rounded-2xl p-6 mb-6">
          <h2 className="text-sm font-semibold text-foreground mb-3 flex items-center gap-2"><Image className="h-4 w-4" /> Logos</h2>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            {['Primary Logo', 'Icon', 'Wordmark'].map(label => (
              <button key={label} className="aspect-square rounded-xl border-2 border-dashed border-border/60 flex flex-col items-center justify-center gap-2 hover:border-primary/40 hover:bg-muted/30 transition-colors">
                <Upload className="h-5 w-5 text-muted-foreground" />
                <span className="text-[11px] text-muted-foreground font-medium">{label}</span>
              </button>
            ))}
          </div>
        </motion.div>

        {/* Colors */}
        <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}
          className="bg-card border border-border/40 rounded-2xl p-6 mb-6">
          <h2 className="text-sm font-semibold text-foreground mb-4 flex items-center gap-2"><Palette className="h-4 w-4" /> Brand Colors</h2>
          <div className="flex gap-3 flex-wrap">
            {BRAND_COLORS.map(c => (
              <div key={c.name} className="text-center">
                <div className="h-14 w-14 rounded-xl shadow-sm border border-border/20 mb-1.5 cursor-pointer hover:scale-110 transition-transform"
                  style={{ backgroundColor: c.hex }} />
                <p className="text-[10px] font-medium text-foreground">{c.name}</p>
                <p className="text-[9px] text-muted-foreground">{c.hex}</p>
              </div>
            ))}
            <button className="h-14 w-14 rounded-xl border-2 border-dashed border-border/60 flex items-center justify-center hover:border-primary/40 transition-colors">
              <Plus className="h-4 w-4 text-muted-foreground" />
            </button>
          </div>
        </motion.div>

        {/* Fonts */}
        <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }}
          className="bg-card border border-border/40 rounded-2xl p-6">
          <h2 className="text-sm font-semibold text-foreground mb-4 flex items-center gap-2"><Type className="h-4 w-4" /> Typography</h2>
          <div className="space-y-4">
            {BRAND_FONTS.map(f => (
              <div key={f.name} className="flex items-center justify-between p-3 rounded-xl bg-muted/30 hover:bg-muted/50 transition-colors">
                <div>
                  <p className="text-xs font-semibold text-foreground">{f.name}</p>
                  <p className="text-[11px] text-muted-foreground">{f.font} · {f.weight}</p>
                </div>
                <span className="text-sm text-foreground" style={{ fontFamily: f.font }}>{f.sample}</span>
              </div>
            ))}
            <Button variant="outline" size="sm" className="gap-2 text-xs"><Plus className="h-3 w-3" /> Add Font</Button>
          </div>
        </motion.div>
      </div>
    </DesignStudioShell>
  );
}
