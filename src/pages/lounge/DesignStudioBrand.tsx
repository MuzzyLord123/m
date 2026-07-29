import { useState } from 'react';
import { Palette, Type, Image, Plus, Upload } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
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
            <h1 className="text-[17px] font-semibold tracking-[-0.01em] text-foreground mb-1">Brand kit</h1>
            <p className="text-[13px] text-muted-foreground">Manage your brand identity across all designs.</p>
          </div>
          <Button className="gap-2 h-9 rounded-lg text-[13px]"><Plus className="h-4 w-4" /> New brand kit</Button>
        </div>

        {/* Brand name */}
        <section className="bg-card border border-border/60 rounded-[10px] p-5 mb-4">
          <h2 className="font-mono text-[10px] font-medium uppercase tracking-[0.14em] text-muted-foreground mb-3">Brand name</h2>
          <Input value={brandName} onChange={e => setBrandName(e.target.value)} className="max-w-sm" />
        </section>

        {/* Logo */}
        <section className="bg-card border border-border/60 rounded-[10px] p-5 mb-4">
          <h2 className="font-mono text-[10px] font-medium uppercase tracking-[0.14em] text-muted-foreground mb-3 flex items-center gap-2"><Image className="h-3.5 w-3.5" /> Logos</h2>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            {['Primary logo', 'Icon', 'Wordmark'].map(label => (
              <button key={label} className="aspect-square rounded-[10px] border border-dashed border-border/60 flex flex-col items-center justify-center gap-2 hover:border-primary/40 hover:bg-muted/30 transition-colors duration-150">
                <Upload className="h-4 w-4 text-muted-foreground" />
                <span className="text-[11px] text-muted-foreground font-medium">{label}</span>
              </button>
            ))}
          </div>
        </section>

        {/* Colours */}
        <section className="bg-card border border-border/60 rounded-[10px] p-5 mb-4">
          <h2 className="font-mono text-[10px] font-medium uppercase tracking-[0.14em] text-muted-foreground mb-4 flex items-center gap-2"><Palette className="h-3.5 w-3.5" /> Brand colours</h2>
          <div className="flex gap-3 flex-wrap">
            {BRAND_COLORS.map(c => (
              <div key={c.name} className="text-center">
                <div className="h-14 w-14 rounded-[10px] border border-border/60 mb-1.5 cursor-pointer"
                  style={{ backgroundColor: c.hex }} />
                <p className="text-[10px] font-medium text-foreground">{c.name}</p>
                <p className="font-mono text-[9px] text-muted-foreground">{c.hex}</p>
              </div>
            ))}
            <button className="h-14 w-14 rounded-[10px] border border-dashed border-border/60 flex items-center justify-center hover:border-primary/40 transition-colors duration-150">
              <Plus className="h-4 w-4 text-muted-foreground" />
            </button>
          </div>
        </section>

        {/* Fonts */}
        <section className="bg-card border border-border/60 rounded-[10px] p-5">
          <h2 className="font-mono text-[10px] font-medium uppercase tracking-[0.14em] text-muted-foreground mb-4 flex items-center gap-2"><Type className="h-3.5 w-3.5" /> Typography</h2>
          <div className="space-y-2">
            {BRAND_FONTS.map(f => (
              <div key={f.name} className="flex items-center justify-between p-3 rounded-[10px] border border-border/60 hover:bg-foreground/[0.02] transition-colors duration-150">
                <div>
                  <p className="text-xs font-medium text-foreground">{f.name}</p>
                  <p className="text-[11px] text-muted-foreground">{f.font} · {f.weight}</p>
                </div>
                <span className="text-sm text-foreground" style={{ fontFamily: f.font }}>{f.sample}</span>
              </div>
            ))}
            <Button variant="outline" size="sm" className="gap-2 text-xs mt-2"><Plus className="h-3 w-3" /> Add font</Button>
          </div>
        </section>
      </div>
    </DesignStudioShell>
  );
}
