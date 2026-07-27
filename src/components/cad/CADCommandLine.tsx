import { useState, useRef, useEffect } from 'react';
import { useCAD } from './CADContext';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Terminal } from 'lucide-react';

export function CADCommandLine() {
  const { state, executeCommand } = useCAD();
  const [input, setInput] = useState('');
  const [historyIdx, setHistoryIdx] = useState(-1);
  const inputRef = useRef<HTMLInputElement>(null);
  const logRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (logRef.current) {
      logRef.current.scrollTop = logRef.current.scrollHeight;
    }
  }, [state.commandHistory]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim()) return;
    executeCommand(input.trim());
    setInput('');
    setHistoryIdx(-1);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'ArrowUp') {
      e.preventDefault();
      const newIdx = Math.min(historyIdx + 1, state.commandHistory.length - 1);
      setHistoryIdx(newIdx);
      if (newIdx >= 0) setInput(state.commandHistory[state.commandHistory.length - 1 - newIdx]);
    } else if (e.key === 'ArrowDown') {
      e.preventDefault();
      const newIdx = Math.max(historyIdx - 1, -1);
      setHistoryIdx(newIdx);
      setInput(newIdx >= 0 ? state.commandHistory[state.commandHistory.length - 1 - newIdx] : '');
    }
  };

  return (
    <div className="h-28 bg-[#0a0a0a] border-t border-border flex flex-col flex-shrink-0">
      <div className="flex items-center gap-1.5 px-2 py-1 border-b border-border/50">
        <Terminal className="h-3 w-3 text-muted-foreground" />
        <span className="text-[9px] font-semibold text-muted-foreground uppercase tracking-wider">Command Line</span>
        <div className="ml-auto flex items-center gap-2 text-[9px] text-muted-foreground">
          <span>Tool: <span className="text-primary capitalize">{state.activeTool}</span></span>
          <span>•</span>
          <span>{state.orthoMode ? 'ORTHO' : ''} {state.snapEnabled ? 'SNAP' : ''} {state.gridVisible ? 'GRID' : ''}</span>
        </div>
      </div>

      <div ref={logRef} className="flex-1 overflow-y-auto px-2 py-1 font-mono text-[11px]">
        {state.commandHistory.map((cmd, i) => (
          <div key={i} className="text-muted-foreground">
            <span className="text-primary mr-1">{'>'}</span>
            {cmd}
          </div>
        ))}
      </div>

      <form onSubmit={handleSubmit} className="flex items-center gap-1 px-2 py-1 border-t border-border/30">
        <span className="text-primary text-xs font-mono">Command:</span>
        <input
          ref={inputRef}
          value={input}
          onChange={e => setInput(e.target.value)}
          onKeyDown={handleKeyDown}
          className="flex-1 bg-transparent text-foreground font-mono text-xs outline-none placeholder:text-muted-foreground/50"
          placeholder="Type a command (LINE, CIRCLE, RECT, UNDO...)"
          autoComplete="off"
          spellCheck={false}
        />
      </form>
    </div>
  );
}
