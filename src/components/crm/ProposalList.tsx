import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Plus, FileText, Search, Trash2, Send, Eye, Edit3, Check,
  Clock, MoreHorizontal, Loader2, X, ChevronDown,
} from 'lucide-react';
import { format } from 'date-fns';
import { type Proposal, type TemplateType, PROPOSAL_TEMPLATES, useProposals } from '@/hooks/useProposals';

interface ProposalListProps {
  proposals: Proposal[];
  loading: boolean;
  onSelect: (p: Proposal) => void;
  onCreateFromTemplate: (type: TemplateType) => void;
  onDelete: (id: string) => void;
  onSend: (id: string) => void;
}

const STATUS_STYLES: Record<string, { label: string; color: string; bg: string }> = {
  draft: { label: 'Draft', color: '#888', bg: 'rgba(136,136,136,0.12)' },
  sent: { label: 'Sent', color: '#60a5fa', bg: 'rgba(96,165,250,0.12)' },
  viewed: { label: 'Viewed', color: '#fbbf24', bg: 'rgba(251,191,36,0.12)' },
  accepted: { label: 'Accepted', color: '#22c55e', bg: 'rgba(34,197,94,0.12)' },
  declined: { label: 'Declined', color: '#ef4444', bg: 'rgba(239,68,68,0.12)' },
  expired: { label: 'Expired', color: '#6b7280', bg: 'rgba(107,114,128,0.12)' },
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
    <div className="h-full flex flex-col" style={{ backgroundColor: '#111' }}>
      {/* Header */}
      <div className="p-3 shrink-0" style={{ borderBottom: '1px solid #2a2a2a' }}>
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-2">
            <FileText className="h-4 w-4 text-[#0073E6]" />
            <span className="text-[12px] font-semibold text-[#ccc]">Proposals</span>
            <span className="text-[10px] text-[#666]">({proposals.length})</span>
          </div>
          <div className="relative">
            <button
              onClick={() => setShowTemplateMenu(!showTemplateMenu)}
              className="h-7 px-2.5 flex items-center gap-1 rounded-md text-[11px] font-medium bg-[#0073E6] text-white hover:bg-[#005bb5] transition-colors"
            >
              <Plus className="h-3.5 w-3.5" /> New Proposal
              <ChevronDown className="h-3 w-3" />
            </button>
            <AnimatePresence>
              {showTemplateMenu && (
                <motion.div
                  initial={{ opacity: 0, y: -4 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -4 }}
                  className="absolute right-0 top-full mt-1 w-56 rounded-lg shadow-xl z-50"
                  style={{ backgroundColor: '#1e1e1e', border: '1px solid #333' }}
                >
                  <div className="p-1.5">
                    <span className="text-[9px] font-medium text-[#666] uppercase tracking-wider px-2">Choose Template</span>
                  </div>
                  {(Object.entries(PROPOSAL_TEMPLATES) as [TemplateType, { label: string }][]).map(([key, tmpl]) => (
                    <button
                      key={key}
                      onClick={() => { onCreateFromTemplate(key); setShowTemplateMenu(false); }}
                      className="w-full text-left px-3 py-2 text-[11px] text-[#ccc] hover:bg-[#333] transition-colors flex items-center gap-2"
                    >
                      <FileText className="h-3.5 w-3.5 text-[#666]" />
                      {tmpl.label}
                    </button>
                  ))}
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>

        {/* Search + filter */}
        <div className="flex items-center gap-2">
          <div className="flex-1 flex items-center gap-1.5 px-2 py-1.5 rounded-lg" style={{ backgroundColor: '#1e1e1e', border: '1px solid #2a2a2a' }}>
            <Search className="h-3.5 w-3.5 text-[#555]" />
            <input
              type="text"
              placeholder="Search proposals…"
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="bg-transparent text-[11px] text-[#ccc] placeholder:text-[#555] outline-none flex-1"
            />
            {search && <button onClick={() => setSearch('')}><X className="h-3 w-3 text-[#555]" /></button>}
          </div>
          <select
            value={statusFilter || ''}
            onChange={e => setStatusFilter(e.target.value || null)}
            className="bg-[#1e1e1e] text-[10px] text-[#888] border border-[#2a2a2a] rounded-md px-2 py-1.5 outline-none"
          >
            <option value="">All Status</option>
            {Object.entries(STATUS_STYLES).map(([k, v]) => (
              <option key={k} value={k}>{v.label}</option>
            ))}
          </select>
        </div>
      </div>

      {/* List */}
      <div className="flex-1 overflow-y-auto">
        {loading ? (
          <div className="flex items-center justify-center h-32">
            <Loader2 className="h-4 w-4 animate-spin text-[#555]" />
          </div>
        ) : filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-40 text-[#555]">
            <FileText className="h-6 w-6 mb-2" />
            <span className="text-[11px]">No proposals yet</span>
            <span className="text-[9px] mt-1">Create one from a template</span>
          </div>
        ) : (
          filtered.map(p => {
            const ss = STATUS_STYLES[p.status] || STATUS_STYLES.draft;
            return (
              <button
                key={p.id}
                onClick={() => onSelect(p)}
                className="w-full text-left px-3 py-3 hover:bg-[#1a1a1a] transition-colors border-b border-[#1a1a1a] group"
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-0.5">
                      <span className="text-[11px] font-medium text-[#ddd] truncate">{p.title}</span>
                      <span
                        className="text-[8px] font-medium px-1.5 py-0.5 rounded-full shrink-0"
                        style={{ color: ss.color, backgroundColor: ss.bg }}
                      >
                        {ss.label}
                      </span>
                    </div>
                    <div className="flex items-center gap-2 text-[9px] text-[#666]">
                      <span className="font-mono">{p.proposal_number}</span>
                      <span>•</span>
                      <span>{p.client_name || p.client_company || 'No client'}</span>
                    </div>
                    <div className="flex items-center gap-3 mt-1 text-[9px] text-[#555]">
                      <span>£{p.total_amount.toLocaleString()}</span>
                      <span>{format(new Date(p.created_at), 'dd MMM yyyy')}</span>
                      {p.valid_until && (
                        <span className="flex items-center gap-0.5">
                          <Clock className="h-2.5 w-2.5" />
                          Valid until {format(new Date(p.valid_until), 'dd MMM')}
                        </span>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    {p.status === 'draft' && (
                      <button
                        onClick={e => { e.stopPropagation(); onSend(p.id); }}
                        className="h-6 w-6 flex items-center justify-center rounded hover:bg-[#333]"
                        title="Mark as Sent"
                      >
                        <Send className="h-3 w-3 text-[#60a5fa]" />
                      </button>
                    )}
                    <button
                      onClick={e => { e.stopPropagation(); onDelete(p.id); }}
                      className="h-6 w-6 flex items-center justify-center rounded hover:bg-[#333]"
                      title="Delete"
                    >
                      <Trash2 className="h-3 w-3 text-[#ef4444]" />
                    </button>
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
