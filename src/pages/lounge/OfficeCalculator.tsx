import { useState, useCallback, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Calculator, Delete, RotateCcw, History, Copy, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { OfficeModuleBand } from '@/pages/lounge/office/ModuleShell';
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
      <OfficeModuleBand appId="calculator" icon={Calculator} title="Calculator">
        {/* Mode toggle — hide labels on very small screens */}
        <div className="flex items-center gap-0.5 rounded-lg border border-border/60 bg-card p-0.5 shrink-0">
          {(['standard', 'scientific'] as const).map(m => (
            <button key={m} onClick={() => setMode(m)} className={cn("px-2 sm:px-3 py-1.5 rounded-md text-[10px] sm:text-[11px] font-medium transition-colors duration-150", mode === m ? "bg-foreground/[0.05] text-foreground" : "text-muted-foreground hover:text-foreground")}>
              {m === 'standard' ? 'Std' : 'Sci'}
            </button>
          ))}
        </div>
        <Button variant="ghost" size="icon" aria-label="History" className="h-8 w-8 rounded-lg shrink-0" onClick={() => setShowHistory(!showHistory)}>
          <History className="h-3.5 w-3.5" />
        </Button>
      </OfficeModuleBand>

      <div className="flex-1 overflow-auto flex items-start sm:items-center justify-center p-4 sm:p-6">
        {/* Stack vertically on mobile, side by side on sm+ */}
        <div className="flex flex-col sm:flex-row gap-4 items-center sm:items-start w-full sm:w-auto">
          <div className="w-full max-w-[340px] rounded-[10px] bg-card border border-border/60 overflow-hidden">
            <div className="p-5 sm:p-6 pb-3">
              <div className="text-right">
                <p className="text-[11px] text-muted-foreground/60 font-mono tabular-nums h-5 truncate">{expression || ' '}</p>
                <p className={cn("font-mono font-medium tabular-nums text-foreground", display.length > 12 ? "text-2xl" : display.length > 8 ? "text-3xl" : "text-4xl")}>
                  {display}
                </p>
              </div>
              <div className="flex items-center justify-between mt-1">
                <div className="flex items-center gap-1">
                  {hasMemory && (
                    <span className="font-mono text-[8px] font-medium tabular-nums text-primary bg-primary/10 px-1.5 py-0.5 rounded">M {memory}</span>
                  )}
                </div>
                <button onClick={copyResult} className="text-[10px] text-muted-foreground/60 hover:text-foreground flex items-center gap-1 transition-colors duration-150 min-h-[32px] px-1">
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
                  className="flex-1 h-10 sm:h-7 rounded-lg bg-foreground/[0.04] font-mono text-[11px] sm:text-[10px] font-medium text-muted-foreground hover:bg-foreground/[0.07] hover:text-foreground transition-colors duration-150 active:scale-95">
                  {m.label}
                </button>
              ))}
            </div>

            {mode === 'scientific' && (
              <div className="px-3 pb-2 grid grid-cols-4 gap-1.5">
                {sciButtons.map(fn => (
                  <button key={fn} onClick={() => handleScientific(fn)}
                    className="h-10 sm:h-9 rounded-lg bg-foreground/[0.04] text-[11px] font-mono font-medium text-muted-foreground hover:bg-foreground/[0.07] hover:text-foreground transition-colors duration-150 active:scale-95">
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
                    "h-16 sm:h-14 rounded-[10px] font-mono text-base font-medium tabular-nums transition-colors duration-150 active:scale-95",
                    isOp(btn) ? "bg-primary text-primary-foreground hover:bg-primary/90" :
                    isFunc(btn) ? "bg-foreground/[0.06] text-foreground hover:bg-foreground/[0.09]" :
                    btn === '⌫' ? "bg-foreground/[0.06] text-foreground hover:bg-foreground/[0.09]" :
                    "bg-card hover:bg-foreground/[0.03] text-foreground border border-border/60"
                  )}>
                  {btn === '⌫' ? <Delete className="h-4 w-4 mx-auto" /> : btn}
                </button>
              ))}
            </div>

            <div className="px-4 pb-3 text-center hidden sm:block">
              <p className="font-mono text-[8px] uppercase tracking-[0.13em] text-muted-foreground/60">Keyboard: 0-9 · + − * / = · Enter · Esc</p>
            </div>
          </div>

          {/* History panel — full width below on mobile, side panel on sm+ */}
          {showHistory && (
              <div
                className="w-full max-w-[340px] sm:w-[260px] sm:max-w-none rounded-[10px] bg-card border border-border/60 p-4 overflow-auto max-h-80 sm:max-h-[520px]">
                <div className="flex items-center justify-between mb-3">
                  <span className="font-mono text-[10px] font-medium text-muted-foreground uppercase tracking-[0.14em]">History</span>
                  <div className="flex items-center gap-2">
                    <button onClick={clearHistory} className="text-[10px] text-muted-foreground hover:text-foreground transition-colors duration-150">Clear</button>
                    <button aria-label="Close history" onClick={() => setShowHistory(false)} className="sm:hidden h-6 w-6 rounded-lg bg-foreground/[0.04] flex items-center justify-center">
                      <X className="h-3 w-3" />
                    </button>
                  </div>
                </div>
                {history.length === 0 && <p className="text-[11px] text-muted-foreground text-center py-8">No calculations yet</p>}
                <div className="space-y-2">
                  {history.map((h, i) => (
                    <button key={h.id || i} onClick={() => { setDisplay(h.result); setPrevResult(h.result); }} className="w-full text-right p-3 rounded-lg hover:bg-foreground/[0.025] transition-colors duration-150 min-h-[48px]">
                      <p className="text-[10px] text-muted-foreground/70 font-mono tabular-nums truncate">{h.expression}</p>
                      <p className="text-sm font-medium text-foreground font-mono tabular-nums">{h.result}</p>
                    </button>
                  ))}
                </div>
              </div>
            )}
        </div>
      </div>
    </div>
  );
}
