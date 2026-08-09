import { useCallback, useEffect, useMemo, useState } from 'react';
import { X, Search, ChevronRight, RefreshCw, Copy } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';

/*
 * Tree Memory.
 *
 * Every movement in the office writes one short line into a tree, and an
 * agent picking up someone else's work reads the tree instead of the log.
 * This page is that tree made visible - the same rows, the same
 * summaries, nothing dramatised.
 *
 * The honesty rule the rest of the office lives by applies here too: a
 * summary is written by database code from a real row, so nothing on this
 * page can describe a movement that did not happen. The "what the agent
 * reads" panel shows the EXACT digest handed to a model, not a prettier
 * version of it.
 */

type Node = {
  id: string; parent: string | null; depth: number; kind: string;
  agent: string | null; model: string | null; title: string; summary: string;
  ok: boolean | null; ts: string; task: string | null;
};
type Root = { root: string; title: string; ts: string; nodes: number; agents: number; failed: number };

const KIND: Record<string, { dot: string; label: string }> = {
  task: { dot: '#2563eb', label: 'TASK' },
  result: { dot: '#35c26b', label: 'RESULT' },
  handoff: { dot: '#0fb8d4', label: 'HANDOFF' },
  op: { dot: '#f5c518', label: 'PLATFORM OP' },
  fallback: { dot: '#f97316', label: 'FALLBACK' },
  digest: { dot: '#6d3fd4', label: 'DIGEST' },
  note: { dot: '#98a1b4', label: 'NOTE' },
};

const rpc = (fn: string, args: Record<string, unknown>) =>
  (supabase.rpc as unknown as (f: string, a: Record<string, unknown>) => PromiseLike<{ data: unknown; error: unknown }>)(fn, args);

export function MemoryTree({ open, onClose }: { open: boolean; onClose: () => void }) {
  const [roots, setRoots] = useState<Root[]>([]);
  const [activeRoot, setActiveRoot] = useState<string | null>(null);
  const [nodes, setNodes] = useState<Node[]>([]);
  const [collapsed, setCollapsed] = useState<Set<string>>(new Set());
  const [q, setQ] = useState('');
  const [selected, setSelected] = useState<Node | null>(null);
  const [digest, setDigest] = useState<string>('');
  const [loading, setLoading] = useState(false);

  const loadRoots = useCallback(async () => {
    const { data } = await rpc('memory_roots', { p_limit: 40 });
    const rows = (data as Root[] | null) ?? [];
    setRoots(rows);
    setActiveRoot(prev => prev ?? rows[0]?.root ?? null);
  }, []);

  const loadTree = useCallback(async (root: string | null) => {
    if (!root) { setNodes([]); return; }
    setLoading(true);
    const { data } = await rpc('memory_tree', { p_root: root, p_max_depth: 12, p_limit: 800 });
    setNodes(((data as Node[] | null) ?? []).sort((a, b) => a.ts.localeCompare(b.ts)));
    setLoading(false);
  }, []);

  useEffect(() => { if (open) void loadRoots(); }, [open, loadRoots]);
  useEffect(() => { if (open) void loadTree(activeRoot); }, [open, activeRoot, loadTree]);

  /* New nodes arrive as they are written - the tree grows while you watch. */
  useEffect(() => {
    if (!open) return;
    const ch = supabase.channel('memory-tree')
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'memory_nodes' },
        payload => {
          const n = payload.new as unknown as Node & { root_id: string };
          if (activeRoot && n.root_id === activeRoot) setNodes(prev => [...prev, n]);
          void loadRoots();
        })
      .subscribe();
    return () => { supabase.removeChannel(ch); };
  }, [open, activeRoot, loadRoots]);

  /* The exact text a model is handed for this branch. Shown verbatim so
     you can see what the office is spending context on. */
  const showDigest = useCallback(async (node: Node) => {
    setSelected(node);
    setDigest('');
    if (!node.task) return;
    const { data } = await rpc('memory_recall', { p_task: node.task, p_max_chars: 3000 });
    setDigest(typeof data === 'string' ? data : '');
  }, []);

  const children = useMemo(() => {
    const m = new Map<string | null, Node[]>();
    nodes.forEach(n => {
      const k = n.parent;
      if (!m.has(k)) m.set(k, []);
      m.get(k)!.push(n);
    });
    return m;
  }, [nodes]);

  const matches = useCallback((n: Node) =>
    !q.trim() || (n.title + ' ' + n.summary + ' ' + (n.agent ?? '') + ' ' + (n.model ?? ''))
      .toLowerCase().includes(q.trim().toLowerCase()), [q]);

  const toggle = (id: string) => setCollapsed(prev => {
    const s = new Set(prev); s.has(id) ? s.delete(id) : s.add(id); return s;
  });

  const rows: { node: Node; kids: number }[] = [];
  const walk = (parent: string | null) => {
    (children.get(parent) ?? []).forEach(n => {
      const kids = (children.get(n.id) ?? []).length;
      rows.push({ node: n, kids });
      if (!collapsed.has(n.id)) walk(n.id);
    });
  };
  walk(null);
  /* An orphan can exist if its parent scrolled past the depth cap - show
     it rather than silently dropping a real movement. */
  const shown = new Set(rows.map(r => r.node.id));
  nodes.filter(n => !shown.has(n.id)).forEach(n => rows.push({ node: n, kids: 0 }));

  const visible = rows.filter(r => matches(r.node));
  const hhmm = (iso: string) => new Date(iso).toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' });

  if (!open) return null;
  return (
    <div className="absolute inset-0 z-[60] flex flex-col bg-[#050b16] text-slate-200" role="dialog" aria-label="Tree memory">
      <div className="flex h-[54px] shrink-0 items-center gap-3 border-b border-cyan-300/10 px-4">
        <span className="text-[14px] font-bold tracking-tight text-cyan-50">
          QUOORO <span className="font-medium text-cyan-200/40">/ TREE MEMORY</span>
        </span>
        <span className="hidden font-mono text-[8px] uppercase tracking-[0.18em] text-cyan-200/40 sm:block">
          every movement, one line each · written by code, not narrated
        </span>
        <div className="ml-auto flex items-center gap-2">
          <div className="relative">
            <Search className="pointer-events-none absolute left-2 top-1/2 h-3 w-3 -translate-y-1/2 text-slate-500" />
            <input value={q} onChange={e => setQ(e.target.value)} placeholder="filter…"
              aria-label="Filter memory"
              className="h-8 w-[150px] rounded-[8px] border border-cyan-300/15 bg-[#0d1b30] pl-7 pr-2 text-[11.5px] outline-none placeholder:text-slate-600 focus:border-cyan-300/40" />
          </div>
          <button onClick={() => { void loadRoots(); void loadTree(activeRoot); }} aria-label="Refresh"
            className="flex h-8 w-8 items-center justify-center rounded-[8px] border border-cyan-300/20 text-cyan-200 hover:bg-cyan-300/10">
            <RefreshCw className={cn('h-3.5 w-3.5', loading && 'animate-spin')} />
          </button>
          <button onClick={onClose} aria-label="Back to the office"
            className="flex h-8 items-center gap-1.5 rounded-[8px] border border-cyan-300/20 px-3 text-[12px] font-semibold text-cyan-100 hover:bg-cyan-300/10">
            <X className="h-3.5 w-3.5" /> Office
          </button>
        </div>
      </div>

      <div className="grid min-h-0 flex-1 grid-cols-1 gap-3 p-3 lg:grid-cols-[230px_1fr_320px]">
        {/* roots */}
        <div className="hidden min-h-0 flex-col overflow-y-auto rounded-[10px] border border-cyan-300/10 bg-[#0a1526]/80 p-3 lg:flex">
          <p className="font-mono text-[8.5px] uppercase tracking-[0.16em] text-cyan-200/50">Threads</p>
          {roots.length === 0 && (
            <p className="mt-2 text-[11.5px] leading-relaxed text-slate-500">
              Nothing remembered yet. The tree fills itself the moment an agent does something.
            </p>
          )}
          {roots.map(r => (
            <button key={r.root} onClick={() => { setActiveRoot(r.root); setSelected(null); setDigest(''); }}
              className={cn('mt-1.5 rounded-[8px] border px-2.5 py-2 text-left transition',
                activeRoot === r.root ? 'border-cyan-300/40 bg-cyan-300/10' : 'border-transparent hover:bg-white/[0.04]')}>
              <p className="truncate text-[11.5px] font-medium text-slate-200">{r.title}</p>
              <p className="mt-0.5 font-mono text-[8px] tracking-[0.08em] text-slate-500">
                {r.nodes} steps · {r.agents} agent{r.agents === 1 ? '' : 's'}
                {r.failed > 0 && <span className="text-rose-300"> · {r.failed} failed</span>}
              </p>
            </button>
          ))}
        </div>

        {/* the tree */}
        <div className="min-h-0 overflow-y-auto rounded-[10px] border border-cyan-300/10 bg-[#0a1526]/80 p-3">
          {visible.length === 0 && (
            <p className="mt-6 text-center text-[12px] text-slate-500">
              {nodes.length === 0 ? 'This thread has no recorded steps.' : 'Nothing matches that filter.'}
            </p>
          )}
          {visible.map(({ node, kids }) => {
            const k = KIND[node.kind] ?? KIND.note;
            return (
              <div key={node.id} style={{ paddingLeft: Math.min(node.depth, 14) * 16 }}
                className="group flex items-start gap-2 rounded-[7px] py-[3px] pr-2 hover:bg-white/[0.04]">
                <button onClick={() => kids && toggle(node.id)} aria-label={kids ? 'Collapse branch' : undefined}
                  className={cn('mt-[3px] flex h-4 w-4 shrink-0 items-center justify-center rounded text-slate-500',
                    kids ? 'hover:text-cyan-200' : 'opacity-0')}>
                  <ChevronRight className={cn('h-3 w-3 transition-transform', !collapsed.has(node.id) && 'rotate-90')} />
                </button>
                <span className="mt-[7px] h-1.5 w-1.5 shrink-0 rounded-full" style={{ background: k.dot }} />
                <button onClick={() => void showDigest(node)} className="min-w-0 flex-1 text-left">
                  <p className="truncate text-[12px] leading-snug text-slate-200">
                    {node.summary}
                    {node.ok === false && <span className="ml-1.5 font-mono text-[8.5px] text-rose-300">FAILED</span>}
                  </p>
                  <p className="truncate font-mono text-[8px] uppercase tracking-[0.1em] text-slate-500">
                    {k.label}{node.agent ? ` · ${node.agent}` : ''}{node.model ? ` · ${node.model}` : ''} · {hhmm(node.ts)}
                    {kids > 0 && ` · ${kids} below`}
                  </p>
                </button>
              </div>
            );
          })}
        </div>

        {/* what the agent reads */}
        <div className="hidden min-h-0 flex-col rounded-[10px] border border-cyan-300/10 bg-[#0a1526]/80 p-3 lg:flex">
          <p className="font-mono text-[8.5px] uppercase tracking-[0.16em] text-cyan-200/50">What the agent reads</p>
          {!selected && (
            <p className="mt-2 text-[11.5px] leading-relaxed text-slate-500">
              Pick a step. This shows the exact digest handed to a model for that
              branch — the thing it reads instead of the whole log.
            </p>
          )}
          {selected && (
            <>
              <p className="mt-2 text-[11.5px] text-slate-300">{selected.title}</p>
              <p className="font-mono text-[8px] uppercase tracking-[0.1em] text-slate-500">
                {(KIND[selected.kind] ?? KIND.note).label}{selected.agent ? ` · ${selected.agent}` : ''}
              </p>
              <pre className="mt-2 min-h-0 flex-1 overflow-auto whitespace-pre-wrap rounded-[7px] border border-cyan-300/10 bg-[#0d1b30] p-2.5 font-mono text-[10px] leading-relaxed text-slate-300">
{digest || (selected.task ? 'Reading…' : 'This step has no task of its own, so it carries no digest.')}
              </pre>
              {digest && (
                <p className="mt-1.5 flex items-center justify-between font-mono text-[8.5px] text-slate-500">
                  <span>{digest.length} characters · zero tokens to produce</span>
                  <button onClick={() => { void navigator.clipboard.writeText(digest); toast.success('Digest copied'); }}
                    className="flex items-center gap-1 text-cyan-200 hover:text-cyan-100">
                    <Copy className="h-3 w-3" /> COPY
                  </button>
                </p>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}
