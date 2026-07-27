import { useState, useCallback, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Calculator, Delete, RotateCcw, History, Copy, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { motion, AnimatePresence } from 'framer-motion';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

interface HistoryEntry { id?: string; expression: string; result: string; }

export default function OfficeCalculator() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [display, setDisplay] = useState('0');
  const [expression, setExpression] = useState('');
  const [prevResult, setPrevResult] = useState('');
  const [history, setHistory] = useState<HistoryEntry[]>([]);
  const [showHistory, setShowHistory] = useState(false);
  const [mode, setMode] = useState<'standard' | 'scientific'>('standard');
  const [memory, setMemory] = useState(0);
  const [hasMemory, setHasMemory] = useState(false);

  useEffect(() => {
    if (!user) return;
    const load = async () => {
      const { data } = await supabase.from('calculator_history').select('*').eq('user_id', user.id).order('created_at', { ascending: false }).limit(20);
      if (data) setHistory(data.map((h: any) => ({ id: h.id, expression: h.expression, result: h.result })));
    };
    load();
  }, [user]);

  const handleNumber = (num: string) => {
    if (display === '0' || prevResult) {
      setDisplay(num);
      if (prevResult) { setExpression(''); setPrevResult(''); }
    } else {
      setDisplay(prev => prev + num);
    }
  };

  const handleOperator = (op: string) => {
    setPrevResult('');
    setExpression(prev => prev + display + ' ' + op + ' ');
    setDisplay('0');
  };

  const handleEquals = async () => {
    const full = expression + display;
    try {
      const sanitized = full.replace(/[^0-9+\-*/().%\s]/g, '');
      const result = new Function('return ' + sanitized)();
      const resultStr = Number.isFinite(result) ? String(parseFloat(result.toFixed(10))) : 'Error';
      if (user && resultStr !== 'Error') {
        const { data } = await supabase.from('calculator_history').insert({
          user_id: user.id, expression: full, result: resultStr,
        } as any).select().single();
        setHistory(prev => [{ id: data?.id, expression: full, result: resultStr }, ...prev].slice(0, 20));
      } else {
        setHistory(prev => [{ expression: full, result: resultStr }, ...prev].slice(0, 20));
      }
      setDisplay(resultStr);
      setExpression('');
      setPrevResult(resultStr);
    } catch {
      setDisplay('Error');
      setExpression('');
    }
  };

  const handleClear = () => { setDisplay('0'); setExpression(''); setPrevResult(''); };
  const handleBackspace = () => setDisplay(prev => prev.length > 1 ? prev.slice(0, -1) : '0');
  const handleDecimal = () => { if (!display.includes('.')) setDisplay(prev => prev + '.'); };
  const handlePercent = () => setDisplay(String(parseFloat(display) / 100));
  const handleNegate = () => setDisplay(prev => prev.startsWith('-') ? prev.slice(1) : '-' + prev);
  const copyResult = () => { navigator.clipboard.writeText(display); toast.success('Copied'); };

  const memoryAdd = () => { setMemory(prev => prev + parseFloat(display)); setHasMemory(true); };
  const memorySub = () => { setMemory(prev => prev - parseFloat(display)); setHasMemory(true); };
  const memoryRecall = () => { if (hasMemory) setDisplay(String(memory)); };
  const memoryClear = () => { setMemory(0); setHasMemory(false); };

  const clearHistory = async () => {
    if (user) { await supabase.from('calculator_history').delete().eq('user_id', user.id); }
    setHistory([]);
  };

  const handleScientific = (fn: string) => {
    const val = parseFloat(display);
    let result: number;
    switch (fn) {
      case 'sin': result = Math.sin(val * Math.PI / 180); break;
      case 'cos': result = Math.cos(val * Math.PI / 180); break;
      case 'tan': result = Math.tan(val * Math.PI / 180); break;
      case 'sqrt': result = Math.sqrt(val); break;
      case 'log': result = Math.log10(val); break;
      case 'ln': result = Math.log(val); break;
      case 'x²': result = val * val; break;
      case 'x³': result = val * val * val; break;
      case '1/x': result = 1 / val; break;
      case 'π': result = Math.PI; break;
      case 'e': result = Math.E; break;
      case '|x|': result = Math.abs(val); break;
      case 'x!': result = val <= 0 ? 1 : Array.from({length: val}, (_, i) => i + 1).reduce((a, b) => a * b, 1); break;
      case '10^x': result = Math.pow(10, val); break;
      default: result = val;
    }
    setDisplay(String(parseFloat(result.toFixed(10))));
  };

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.target instanceof HTMLInputElement) return;
      if (/^[0-9]$/.test(e.key)) { handleNumber(e.key); e.preventDefault(); }
      else if (e.key === '+') { handleOperator('+'); e.preventDefault(); }
      else if (e.key === '-') { handleOperator('-'); e.preventDefault(); }
      else if (e.key === '*') { handleOperator('*'); e.preventDefault(); }
      else if (e.key === '/') { handleOperator('/'); e.preventDefault(); }
      else if (e.key === 'Enter' || e.key === '=') { handleEquals(); e.preventDefault(); }
      else if (e.key === 'Backspace') { handleBackspace(); e.preventDefault(); }
      else if (e.key === 'Escape') { handleClear(); e.preventDefault(); }
      else if (e.key === '.') { handleDecimal(); e.preventDefault(); }
      else if (e.key === '%') { handlePercent(); e.preventDefault(); }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  });

  const stdButtons = [
    ['C', '±', '%', '÷'],
    ['7', '8', '9', '×'],
    ['4', '5', '6', '−'],
    ['1', '2', '3', '+'],
    ['0', '.', '⌫', '='],
  ];

  const sciButtons = ['sin', 'cos', 'tan', 'sqrt', 'log', 'ln', 'x²', 'x³', '1/x', 'π', 'e', '|x|', 'x!', '10^x'];

  const handleButton = (btn: string) => {
    switch (btn) {
      case 'C': handleClear(); break;
      case '±': handleNegate(); break;
      case '%': handlePercent(); break;
      case '÷': handleOperator('/'); break;
      case '×': handleOperator('*'); break;
      case '−': handleOperator('-'); break;
      case '+': handleOperator('+'); break;
      case '=': handleEquals(); break;
      case '.': handleDecimal(); break;
      case '⌫': handleBackspace(); break;
      default: handleNumber(btn);
    }
  };

  const isOp = (b: string) => ['÷', '×', '−', '+', '='].includes(b);
  const isFunc = (b: string) => ['C', '±', '%'].includes(b);

  return (
    <div className="fixed inset-0 z-50 bg-background flex flex-col">
      <header className="h-[52px] border-b border-border/30 bg-background/80 backdrop-blur-2xl flex items-center px-3 sm:px-5 gap-2 sm:gap-3 shrink-0">
        <Button variant="ghost" size="sm" className="h-8 gap-2 rounded-xl text-xs" onClick={() => navigate('/lounge/office', { state: { fromOfficeApp: true } })}>
          <ArrowLeft className="h-3.5 w-3.5" />
          <span className="hidden sm:inline">Back to Office</span>
        </Button>
        <div className="h-4 w-px bg-border/40" />
        <Calculator className="h-4 w-4 text-teal-500 shrink-0" />
        <span className="text-sm font-semibold tracking-tight">Calculator</span>
        <div className="flex-1" />
        {/* Mode toggle — hide labels on very small screens */}
        <div className="flex items-center gap-0.5 bg-muted/50 p-0.5 rounded-xl shrink-0">
          {(['standard', 'scientific'] as const).map(m => (
            <button key={m} onClick={() => setMode(m)} className={cn("px-2 sm:px-3 py-1.5 rounded-lg text-[10px] sm:text-[11px] font-medium transition-all", mode === m ? "bg-background shadow-sm text-foreground" : "text-muted-foreground/60 hover:text-foreground")}>
              {m === 'standard' ? 'Std' : 'Sci'}
            </button>
          ))}
        </div>
        <Button variant="ghost" size="icon" className="h-8 w-8 rounded-xl shrink-0" onClick={() => setShowHistory(!showHistory)}>
          <History className="h-3.5 w-3.5" />
        </Button>
      </header>

      <div className="flex-1 overflow-auto flex items-start sm:items-center justify-center p-4 sm:p-6">
        {/* Stack vertically on mobile, side by side on sm+ */}
        <div className="flex flex-col sm:flex-row gap-4 items-center sm:items-start w-full sm:w-auto">
          <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="w-full max-w-[340px] rounded-3xl bg-card/60 border border-border/20 shadow-2xl overflow-hidden">
            <div className="p-5 sm:p-6 pb-3">
              <div className="text-right">
                <p className="text-[11px] text-muted-foreground/40 font-mono h-5 truncate">{expression || ' '}</p>
                <p className={cn("font-mono font-semibold text-foreground transition-all", display.length > 12 ? "text-2xl" : display.length > 8 ? "text-3xl" : "text-4xl")}>
                  {display}
                </p>
              </div>
              <div className="flex items-center justify-between mt-1">
                <div className="flex items-center gap-1">
                  {hasMemory && (
                    <span className="text-[8px] font-bold text-primary bg-primary/10 px-1.5 py-0.5 rounded">M: {memory}</span>
                  )}
                </div>
                <button onClick={copyResult} className="text-[10px] text-muted-foreground/30 hover:text-muted-foreground/60 flex items-center gap-1 transition-colors min-h-[32px] px-1">
                  <Copy className="h-3 w-3" /> Copy
                </button>
              </div>
            </div>

            {/* Memory buttons — taller on mobile for finger tap */}
            <div className="px-3 pb-2 flex gap-1">
              {[
                { label: 'MC', fn: memoryClear },
                { label: 'MR', fn: memoryRecall },
                { label: 'M+', fn: memoryAdd },
                { label: 'M−', fn: memorySub },
              ].map(m => (
                <button key={m.label} onClick={m.fn}
                  className="flex-1 h-10 sm:h-7 rounded-lg bg-muted/30 text-[11px] sm:text-[10px] font-semibold text-muted-foreground hover:bg-muted/50 hover:text-foreground transition-all active:scale-95">
                  {m.label}
                </button>
              ))}
            </div>

            {mode === 'scientific' && (
              <div className="px-3 pb-2 grid grid-cols-4 gap-1.5">
                {sciButtons.map(fn => (
                  <button key={fn} onClick={() => handleScientific(fn)}
                    className="h-10 sm:h-9 rounded-xl bg-muted/40 text-[11px] font-mono font-medium text-muted-foreground hover:bg-muted/60 hover:text-foreground transition-all active:scale-95">
                    {fn}
                  </button>
                ))}
              </div>
            )}

            {/* Main buttons — h-14 on desktop, h-16 on mobile for big tap targets */}
            <div className="p-3 pt-1 grid grid-cols-4 gap-2">
              {stdButtons.flat().map((btn, i) => (
                <button key={btn + i} onClick={() => handleButton(btn)}
                  className={cn(
                    "h-16 sm:h-14 rounded-2xl text-base font-semibold transition-all active:scale-95",
                    isOp(btn) ? "bg-primary text-primary-foreground hover:bg-primary/90 shadow-md" :
                    isFunc(btn) ? "bg-muted/60 text-foreground hover:bg-muted/80" :
                    btn === '⌫' ? "bg-muted/60 text-foreground hover:bg-muted/80" :
                    "bg-card hover:bg-accent/50 text-foreground border border-border/15"
                  )}>
                  {btn === '⌫' ? <Delete className="h-4 w-4 mx-auto" /> : btn}
                </button>
              ))}
            </div>

            <div className="px-4 pb-3 text-center hidden sm:block">
              <p className="text-[8px] text-muted-foreground/30">Use keyboard: 0-9, +−*/=, Enter, Esc, Backspace</p>
            </div>
          </motion.div>

          {/* History panel — full width below on mobile, side panel on sm+ */}
          <AnimatePresence>
            {showHistory && (
              <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 10 }}
                className="w-full max-w-[340px] sm:w-[260px] sm:max-w-none rounded-3xl bg-card/60 border border-border/20 shadow-2xl p-4 overflow-auto max-h-80 sm:max-h-[520px]">
                <div className="flex items-center justify-between mb-3">
                  <span className="text-[11px] font-semibold text-muted-foreground/60 uppercase tracking-widest">History</span>
                  <div className="flex items-center gap-2">
                    <button onClick={clearHistory} className="text-[10px] text-muted-foreground/40 hover:text-foreground">Clear</button>
                    <button onClick={() => setShowHistory(false)} className="sm:hidden h-6 w-6 rounded-lg bg-muted/30 flex items-center justify-center">
                      <X className="h-3 w-3" />
                    </button>
                  </div>
                </div>
                {history.length === 0 && <p className="text-[11px] text-muted-foreground/30 text-center py-8">No calculations yet</p>}
                <div className="space-y-2">
                  {history.map((h, i) => (
                    <button key={h.id || i} onClick={() => { setDisplay(h.result); setPrevResult(h.result); }} className="w-full text-right p-3 rounded-xl hover:bg-accent/30 transition-colors min-h-[48px]">
                      <p className="text-[10px] text-muted-foreground/40 font-mono truncate">{h.expression}</p>
                      <p className="text-sm font-semibold text-foreground font-mono">{h.result}</p>
                    </button>
                  ))}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
}
