import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Sparkles, Send, Wand2, Image, Type, Layout, Palette, Zap } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { motion } from 'framer-motion';
import DesignStudioShell from '@/components/design-studio/DesignStudioShell';

const AI_FEATURES = [
  { icon: Image, label: 'Generate Image', desc: 'Create images from text prompts', gradient: 'from-violet-500 to-purple-600' },
  { icon: Type, label: 'Write Copy', desc: 'Generate headlines, captions & more', gradient: 'from-blue-500 to-cyan-500' },
  { icon: Layout, label: 'Design Layout', desc: 'Auto-generate complete designs', gradient: 'from-orange-500 to-pink-500' },
  { icon: Palette, label: 'Color Palette', desc: 'Generate palettes from a mood', gradient: 'from-green-500 to-emerald-500' },
  { icon: Wand2, label: 'Remove Background', desc: 'Instantly remove image backgrounds', gradient: 'from-pink-500 to-rose-500' },
  { icon: Zap, label: 'Resize & Adapt', desc: 'Magic resize for any platform', gradient: 'from-amber-500 to-orange-500' },
];

const SUGGESTIONS = [
  'Create a modern social media post for a product launch',
  'Design a minimalist presentation template',
  'Generate a brand color palette inspired by ocean sunsets',
  'Write a catchy headline for an email campaign',
  'Create a YouTube thumbnail with bold typography',
  'Design an Instagram story template for a restaurant',
];

export default function DesignStudioAI() {
  const navigate = useNavigate();
  const [prompt, setPrompt] = useState('');

  const handleGenerate = () => {
    if (prompt.trim()) {
      navigate('/lounge/office/design-studio/editor');
    }
  };

  return (
    <DesignStudioShell activeNav="ai">
      <div className="px-8 py-8 max-w-4xl mx-auto">
        {/* Hero */}
        <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} className="text-center mb-10">
          <div className="inline-flex items-center justify-center h-16 w-16 rounded-2xl bg-gradient-to-br from-violet-500 to-pink-500 mb-4 shadow-lg">
            <Sparkles className="h-8 w-8 text-white" />
          </div>
          <h1 className="text-2xl font-bold text-foreground mb-2">Quooro AI</h1>
          <p className="text-sm text-muted-foreground max-w-md mx-auto">Describe what you want to create and let AI do the heavy lifting.</p>
        </motion.div>

        {/* Prompt */}
        <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="mb-8">
          <div className="relative">
            <Sparkles className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-purple-400" />
            <Input value={prompt} onChange={e => setPrompt(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && handleGenerate()}
              placeholder="Describe what you'd like to create..."
              className="pl-12 pr-14 h-14 text-sm bg-card border-border/60 rounded-2xl shadow-sm" />
            <Button size="icon" onClick={handleGenerate}
              className="absolute right-2 top-1/2 -translate-y-1/2 h-10 w-10 rounded-xl bg-primary hover:bg-primary/90">
              <Send className="h-4 w-4" />
            </Button>
          </div>
        </motion.div>

        {/* Suggestions */}
        <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }} className="mb-10">
          <p className="text-xs font-medium text-muted-foreground mb-3">Try these prompts:</p>
          <div className="flex flex-wrap gap-2">
            {SUGGESTIONS.map(s => (
              <button key={s} onClick={() => setPrompt(s)}
                className="px-3 py-1.5 rounded-full border border-border/40 bg-card text-xs text-muted-foreground hover:text-foreground hover:border-primary/30 transition-colors">
                {s}
              </button>
            ))}
          </div>
        </motion.div>

        {/* Features */}
        <h2 className="text-lg font-bold text-foreground mb-4">AI-Powered Tools</h2>
        <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
          {AI_FEATURES.map((f, i) => (
            <motion.button key={f.label}
              initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3, delay: 0.2 + i * 0.04 }}
              onClick={() => navigate('/lounge/office/design-studio/editor')}
              className="group p-4 rounded-2xl border border-border/30 bg-card text-left hover:shadow-lg hover:-translate-y-0.5 transition-all"
            >
              <div className={cn("h-10 w-10 rounded-xl flex items-center justify-center text-white mb-3 bg-gradient-to-br", f.gradient)}>
                <f.icon className="h-5 w-5" />
              </div>
              <p className="text-sm font-semibold text-foreground">{f.label}</p>
              <p className="text-[11px] text-muted-foreground mt-0.5">{f.desc}</p>
            </motion.button>
          ))}
        </div>
      </div>
    </DesignStudioShell>
  );
}
