import { useState, useEffect, useRef, useMemo } from 'react';
import { Slider } from '@/components/ui/slider';
import { Button } from '@/components/ui/button';
import { Minus, Plus, FileText, BookOpen, MousePointer, Zap, GraduationCap } from 'lucide-react';
import { cn } from '@/lib/utils';

interface WordStatusBarProps {
  wordCount: number;
  charCount: number;
  pageCount: number;
  zoom: number;
  onZoomChange: (z: number) => void;
  cursorLine?: number;
  cursorCol?: number;
  selectionLength?: number;
  paragraphCount?: number;
  editorText?: string;
}

function estimateReadability(text: string): { score: number; label: string; color: string } {
  if (!text || text.trim().length < 30) return { score: 0, label: '—', color: 'text-muted-foreground/50' };
  const sentences = text.split(/[.!?]+/).filter(s => s.trim().length > 0);
  const words = text.trim().split(/\s+/).filter(w => w.length > 0);
  const syllables = words.reduce((sum, w) => {
    const s = w.toLowerCase().replace(/[^a-z]/g, '');
    if (s.length <= 3) return sum + 1;
    const count = s.replace(/(?:[^laeiouy]es|ed|[^laeiouy]e)$/, '').match(/[aeiouy]{1,2}/g);
    return sum + Math.max(1, count ? count.length : 1);
  }, 0);
  if (sentences.length === 0 || words.length === 0) return { score: 0, label: '—', color: 'text-muted-foreground/50' };
  const fk = 206.835 - 1.015 * (words.length / sentences.length) - 84.6 * (syllables / words.length);
  const clamped = Math.max(0, Math.min(100, Math.round(fk)));
  if (clamped >= 80) return { score: clamped, label: 'Easy', color: 'text-emerald-400' };
  if (clamped >= 60) return { score: clamped, label: 'Standard', color: 'text-primary/70' };
  if (clamped >= 40) return { score: clamped, label: 'Moderate', color: 'text-amber-400' };
  return { score: clamped, label: 'Complex', color: 'text-red-400' };
}

export function WordStatusBar({ wordCount, charCount, pageCount, zoom, onZoomChange, cursorLine = 1, cursorCol = 1, selectionLength = 0, paragraphCount = 0, editorText = '' }: WordStatusBarProps) {
  const readingTime = Math.max(1, Math.ceil(wordCount / 200));
  const sentenceCount = useMemo(() => {
    if (!editorText) return 0;
    return editorText.split(/[.!?]+/).filter(s => s.trim().length > 0).length;
  }, [editorText]);

  const readability = useMemo(() => estimateReadability(editorText), [editorText]);

  // WPM tracking
  const prevWordCount = useRef(wordCount);
  const wordTimestamps = useRef<number[]>([]);
  const [wpm, setWpm] = useState(0);

  useEffect(() => {
    const diff = wordCount - prevWordCount.current;
    prevWordCount.current = wordCount;
    if (diff > 0) {
      const now = Date.now();
      wordTimestamps.current = [...wordTimestamps.current.filter(t => now - t < 60000), ...Array(diff).fill(now)];
    }
  }, [wordCount]);

  useEffect(() => {
    const iv = setInterval(() => {
      const now = Date.now();
      wordTimestamps.current = wordTimestamps.current.filter(t => now - t < 60000);
      setWpm(wordTimestamps.current.length);
    }, 2000);
    return () => clearInterval(iv);
  }, []);

  const wpmColor = wpm >= 40 ? 'text-emerald-400' : wpm >= 15 ? 'text-primary/70' : 'text-muted-foreground/50';

  return (
    <div className="flex items-center justify-between px-3 h-6 bg-card border-t border-border/30 text-[9px] text-muted-foreground/70 shrink-0 select-none font-medium">
      {/* Left */}
      <div className="flex items-center gap-2.5">
        <div className="flex items-center gap-1">
          <FileText className="h-2.5 w-2.5" />
          <span className="tabular-nums">Page {pageCount} of {pageCount}</span>
        </div>
        <div className="h-2.5 w-px bg-border/30" />
        <span className="tabular-nums">{wordCount.toLocaleString()} words</span>
        <div className="h-2.5 w-px bg-border/30" />
        <span className="tabular-nums">{charCount.toLocaleString()} chars</span>
        {paragraphCount > 0 && (
          <>
            <div className="h-2.5 w-px bg-border/30" />
            <span className="tabular-nums">{paragraphCount} ¶</span>
          </>
        )}
        {sentenceCount > 0 && (
          <>
            <div className="h-2.5 w-px bg-border/30" />
            <span className="tabular-nums">{sentenceCount} sentences</span>
          </>
        )}
        <div className="h-2.5 w-px bg-border/30" />
        <div className="flex items-center gap-0.5">
          <BookOpen className="h-2.5 w-2.5" />
          <span>{readingTime} min read</span>
        </div>
        <div className="h-2.5 w-px bg-border/30" />
        <div className={cn("flex items-center gap-0.5 transition-colors", wpmColor)} title="Words per minute (last 60s)">
          <Zap className="h-2.5 w-2.5" />
          <span className="tabular-nums">{wpm} wpm</span>
        </div>
        <div className="h-2.5 w-px bg-border/30" />
        <div className={cn("flex items-center gap-0.5 transition-colors", readability.color)} title={`Flesch Reading Ease: ${readability.score}/100`}>
          <GraduationCap className="h-2.5 w-2.5" />
          <span>{readability.label}</span>
        </div>
        <div className="h-2.5 w-px bg-border/30" />
        <span className="tabular-nums">Ln {cursorLine}, Col {cursorCol}</span>
        {selectionLength > 0 && (
          <>
            <div className="h-2.5 w-px bg-border/30" />
            <div className="flex items-center gap-0.5 text-primary/70">
              <MousePointer className="h-2.5 w-2.5" />
              <span className="tabular-nums">{selectionLength} selected</span>
            </div>
          </>
        )}
      </div>

      {/* Right */}
      <div className="flex items-center gap-1">
        <Button
          variant="ghost"
          size="icon"
          className="h-4 w-4 rounded-sm"
          onClick={() => onZoomChange(Math.max(25, zoom - 10))}
        >
          <Minus className="h-2 w-2" />
        </Button>
        <div className="w-16">
          <Slider
            value={[zoom]}
            onValueChange={([v]) => onZoomChange(v)}
            min={25}
            max={200}
            step={5}
            className="cursor-pointer"
          />
        </div>
        <Button
          variant="ghost"
          size="icon"
          className="h-4 w-4 rounded-sm"
          onClick={() => onZoomChange(Math.min(200, zoom + 10))}
        >
          <Plus className="h-2 w-2" />
        </Button>
        <span className="min-w-[28px] text-right tabular-nums">{zoom}%</span>
      </div>
    </div>
  );
}