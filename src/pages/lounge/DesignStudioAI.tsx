import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Send, Image, Type, Layout, Palette, Zap, Eraser } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import DesignStudioShell from '@/components/design-studio/DesignStudioShell';

const AI_FEATURES = [
  { icon: Image, label: 'Generate image', desc: 'Create images from text prompts' },
  { icon: Type, label: 'Write copy', desc: 'Generate headlines, captions and more' },
  { icon: Layout, label: 'Design layout', desc: 'Auto-generate complete designs' },
  { icon: Palette, label: 'Colour palette', desc: 'Generate palettes from a mood' },
  { icon: Eraser, label: 'Remove background', desc: 'Remove image backgrounds' },
  { icon: Zap, label: 'Resize and adapt', desc: 'Resize for any platform' },
];

const SUGGESTIONS = [
  'Create a modern social media post for a product launch',
  'Design a minimalist presentation template',
  'Generate a brand colour palette inspired by ocean sunsets',
  'Write a headline for an email campaign',
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
        <div className="text-center mb-10">
          <span aria-hidden className="mx-auto mb-4 block h-px w-8 bg-primary" />
          <h1 className="text-[17px] font-semibold tracking-[-0.01em] text-foreground mb-2">Quooro AI</h1>
          <p className="text-[13px] text-muted-foreground max-w-md mx-auto">Describe what you want to create and start from a working draft.</p>
        </div>

        {/* Prompt */}
        <div className="mb-8">
          <div className="relative">
            <Input value={prompt} onChange={e => setPrompt(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && handleGenerate()}
              placeholder="Describe what you'd like to create..."
              className="pl-4 pr-14 h-12 text-sm bg-card border-border/60 rounded-[10px]" />
            <Button size="icon" onClick={handleGenerate}
              className="absolute right-1.5 top-1/2 -translate-y-1/2 h-9 w-9 rounded-lg bg-primary hover:bg-primary/90">
              <Send className="h-4 w-4" />
            </Button>
          </div>
        </div>

        {/* Suggestions */}
        <div className="mb-10">
          <p className="font-mono text-[10px] font-medium uppercase tracking-[0.14em] text-muted-foreground mb-3">Try these prompts</p>
          <div className="flex flex-wrap gap-2">
            {SUGGESTIONS.map(s => (
              <button key={s} onClick={() => setPrompt(s)}
                className="px-3 py-1.5 rounded-full border border-border/60 bg-card text-xs text-muted-foreground hover:text-foreground hover:border-border transition-colors duration-150">
                {s}
              </button>
            ))}
          </div>
        </div>

        {/* Features */}
        <h2 className="text-[13.5px] font-[550] tracking-[-0.01em] text-foreground mb-3">Tools</h2>
        <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
          {AI_FEATURES.map((f) => (
            <button key={f.label}
              onClick={() => navigate('/lounge/office/design-studio/editor')}
              className="group p-4 rounded-[10px] border border-border/60 bg-card text-left hover:bg-foreground/[0.02] hover:border-border transition-colors duration-150"
            >
              <div className="h-9 w-9 rounded-[10px] border border-border/60 bg-sunken flex items-center justify-center text-muted-foreground mb-3">
                <f.icon className="h-4 w-4" />
              </div>
              <p className="text-[13px] font-medium text-foreground">{f.label}</p>
              <p className="text-[11px] text-muted-foreground mt-0.5">{f.desc}</p>
            </button>
          ))}
        </div>
      </div>
    </DesignStudioShell>
  );
}
