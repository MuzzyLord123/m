import { useState } from 'react';
import {
  Plus, FileText, Search, Trash2, Send, Clock, X, ChevronDown,
} from 'lucide-react';
import { format } from 'date-fns';
import { type Proposal, type TemplateType, PROPOSAL_TEMPLATES } from '@/hooks/useProposals';
import { cn } from '@/lib/utils';
import {
  EmptyState, Money, SkeletonLedger, StatusBadge, type Tone,
} from '@/components/platform';

interface ProposalListProps {
  proposals: Proposal[];
  loading: boolean;
  onSelect: (p: Proposal) => void;
  onCreateFromTemplate: (type: TemplateType) => void;
  onDelete: (id: string) => void;
  onSend: (id: string) => void;
}

/* Proposal statuses resolve to the platform tone vocabulary —
   the old hex STATUS_STYLES rainbow is gone. */
const STATUS_TONES: Record<string, { label: string; tone: Tone }> = {
  draft: { label: 'Draft', tone: 'neutral' },
  sent: { label: 'Sent', tone: 'accent' },
  viewed: { label: 'Viewed', tone: 'attend' },
  accepted: { label: 'Accepted', tone: 'ok' },
  declined: { label: 'Declined', tone: 'risk' },
  expired: { label: 'Expired', tone: 'neutral' },
};

export function ProposalList({ proposals, loading, onSelect, onCreateFromTemplate, onDelete, onSend }: ProposalListProps) {
  const [search, setSearch] = useState('');
  const [showTemplateMenu, setShowTemplateMenu] = useState(false);
  const [statusFilter, setStatusFilter] = useState<string | null>(null);

  const filtered = proposals.filter(p => {
    const q = search.toLowerCase();
    const matchSearch = !q ||
      (p.client_name || '').toLowerCase().includes(q) ||
      (p.client_company || '').toLowerCase().includes(q) ||
      p.proposal_number.toLowerCase().includes(q) ||
      p.title.toLowerCase().includes(q);
    const matchStatus = !statusFilter || p.status === statusFilter;
    return matchSearch && matchStatus;
  });

  return (
    <div className="flex h-full flex-col bg-background">
      {/* Header */}
      <div className="shrink-0 border-b border-border/60 p-3">
        <div className="mb-2 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <FileText className="h-4 w-4 text-muted-foreground" />
            <span className="text-[12px] font-semibold text-foreground">Proposals</span>
            <span className="font-mono text-[10px] tabular-nums text-muted-foreground">{proposals.length}</span>
          </div>
          <div className="relative">
            <button
              onClick={() => setShowTemplateMenu(!showTemplateMenu)}
              className="flex h-7 items-center gap-1 rounded-md bg-primary px-2.5 text-[11px] font-medium text-primary-foreground transition-[filter] duration-150 hover:brightness-105"
            >
              <Plus className="h-3.5 w-3.5" /> New proposal
              <ChevronDown className="h-3 w-3" />
            </button>
            {showTemplateMenu && (
              <div className="absolute right-0 top-full z-50 mt-1 w-56 rounded-lg border border-border/60 bg-popover shadow-lg">
                <div className="p-1.5">
                  <span className="px-2 font-mono text-[9px] font-medium uppercase tracking-[0.14em] text-muted-foreground">Choose template</span>
                </div>
                {(Object.entries(PROPOSAL_TEMPLATES) as [TemplateType, { label: string }][]).map(([key, tmpl]) => (
                  <button
                    key={key}
                    onClick={() => { onCreateFromTemplate(key); setShowTemplateMenu(false); }}
                    className="flex w-full items-center gap-2 px-3 py-2 text-left text-[11px] text-foreground transition-colors duration-150 hover:bg-foreground/[0.04] last:rounded-b-lg"
                  >
                    <FileText className="h-3.5 w-3.5 text-muted-foreground" />
                    {tmpl.label}
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Search + filter */}
        <div className="flex items-center gap-2">
          <div className="flex flex-1 items-center gap-1.5 rounded-lg border border-border/60 bg-foreground/[0.03] px-2 py-1.5 transition-colors duration-150 focus-within:border-primary/60">
            <Search className="h-3.5 w-3.5 text-muted-foreground/70" />
            <input
              type="text"
              placeholder="Search proposals…"
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="flex-1 bg-transparent text-[11px] text-foreground outline-none placeholder:text-muted-foreground/60"
            />
            {search && <button onClick={() => setSearch('')} aria-label="Clear search"><X className="h-3 w-3 text-muted-foreground/70" /></button>}
          </div>
          <select
            value={statusFilter || ''}
            onChange={e => setStatusFilter(e.target.value || null)}
            className="rounded-md border border-border/60 bg-foreground/[0.03] px-2 py-1.5 text-[10px] text-muted-foreground outline-none transition-colors duration-150 focus:border-primary/60"
          >
            <option value="">All statuses</option>
            {Object.entries(STATUS_TONES).map(([k, v]) => (
              <option key={k} value={k}>{v.label}</option>
            ))}
          </select>
        </div>
      </div>

      {/* List */}
      <div className="flex-1 overflow-y-auto">
        {loading ? (
          <SkeletonLedger rows={5} />
        ) : filtered.length === 0 ? (
          <EmptyState
            compact
            title="No proposals yet"
            body="Create one from a template to send your first quote."
          />
        ) : (
          filtered.map(p => {
            const ss = STATUS_TONES[p.status] || STATUS_TONES.draft;
            return (
              <button
                key={p.id}
                onClick={() => onSelect(p)}
                className="group w-full border-b border-border/60 px-3 py-2.5 text-left transition-colors duration-150 hover:bg-foreground/[0.025]"
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0 flex-1">
                    <div className="mb-0.5 flex items-center gap-2">
                      <span className="truncate text-[12px] font-medium text-foreground">{p.title}</span>
                      <StatusBadge tone={ss.tone} label={ss.label} className="shrink-0 text-[10px]" />
                    </div>
                    <div className="flex items-center gap-2 text-[10px] text-muted-foreground">
                      <span className="font-mono">{p.proposal_number}</span>
                      <span aria-hidden>·</span>
                      <span className="truncate">{p.client_name || p.client_company || 'No client'}</span>
                    </div>
                    <div className="mt-1 flex items-center gap-3 text-[10px] text-muted-foreground">
                      <Money value={p.total_amount} whole className="font-mono tabular-nums text-ink-2" />
                      <span>{format(new Date(p.created_at), 'd MMM yyyy')}</span>
                      {p.valid_until && (
                        <span className="flex items-center gap-0.5">
                          <Clock className="h-2.5 w-2.5" />
                          Valid until {format(new Date(p.valid_until), 'd MMM')}
                        </span>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center gap-1 opacity-0 transition-opacity duration-150 group-hover:opacity-100 group-focus-within:opacity-100">
                    {p.status === 'draft' && (
                      <span
                        role="button"
                        tabIndex={0}
                        onClick={e => { e.stopPropagation(); onSend(p.id); }}
                        onKeyDown={e => { if (e.key === 'Enter') { e.stopPropagation(); onSend(p.id); } }}
                        className="flex h-6 w-6 items-center justify-center rounded transition-colors duration-150 hover:bg-foreground/[0.06]"
                        title="Mark as sent"
                      >
                        <Send className="h-3 w-3 text-primary" />
                      </span>
                    )}
                    <span
                      role="button"
                      tabIndex={0}
                      onClick={e => { e.stopPropagation(); onDelete(p.id); }}
                      onKeyDown={e => { if (e.key === 'Enter') { e.stopPropagation(); onDelete(p.id); } }}
                      className="flex h-6 w-6 items-center justify-center rounded transition-colors duration-150 hover:bg-foreground/[0.06]"
                      title="Delete"
                    >
                      <Trash2 className="h-3 w-3 text-risk" />
                    </span>
                  </div>
                </div>
              </button>
            );
          })
        )}
      </div>
    </div>
  );
}
