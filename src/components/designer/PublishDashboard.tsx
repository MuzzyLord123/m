import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Globe, ExternalLink, Clock, CheckCircle2, AlertCircle,
  RotateCcw, Trash2, Plus, Copy, Shield, Zap, Server,
  ChevronDown, ChevronRight, X, Loader2, Link2, Archive,
  Rocket, FileText, HardDrive
} from 'lucide-react';
import { useSitePublish, Deployment, SiteDomain } from '@/hooks/useSitePublish';
import { ScrollArea } from '@/components/ui/scroll-area';
import { toast } from 'sonner';

interface PublishDashboardProps {
  siteId: string;
  siteName: string;
  onPublish: () => void;
  isOpen: boolean;
  onClose: () => void;
}

const STATUS_CONFIG: Record<string, { color: string; icon: typeof CheckCircle2; label: string }> = {
  live: { color: '#22c55e', icon: CheckCircle2, label: 'Live' },
  building: { color: '#f59e0b', icon: Loader2, label: 'Building' },
  pending: { color: '#6b7280', icon: Clock, label: 'Pending' },
  archived: { color: '#6b7280', icon: Archive, label: 'Archived' },
  failed: { color: '#ef4444', icon: AlertCircle, label: 'Failed' },
};

function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function timeAgo(date: string): string {
  const diff = Date.now() - new Date(date).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return 'just now';
  if (mins < 60) return `${mins}m ago`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  return `${days}d ago`;
}

export function PublishDashboard({ siteId, siteName, onPublish, isOpen, onClose }: PublishDashboardProps) {
  const {
    deployments, domains, currentDeployment, publishing,
    publishProgress, publishStage, rollback, addCustomDomain, removeDomain,
    rollingBack, verifyingDomain, verifyDomain,
  } = useSitePublish(siteId);

  const [tab, setTab] = useState<'overview' | 'history' | 'domains'>('overview');
  const [newDomain, setNewDomain] = useState('');
  const [expandedLog, setExpandedLog] = useState<string | null>(null);

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-[500] flex items-center justify-center"
        style={{ backgroundColor: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(4px)' }}
        onClick={onClose}
      >
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 20 }}
          transition={{ type: 'spring', damping: 25, stiffness: 300 }}
          className="rounded-2xl overflow-hidden w-[640px] max-h-[85vh] flex flex-col"
          style={{ backgroundColor: '#1a1a1a', border: '1px solid #2a2a2a', boxShadow: '0 25px 80px rgba(0,0,0,0.6)' }}
          onClick={e => e.stopPropagation()}
        >
          {/* Header */}
          <div className="px-5 py-4 flex items-center justify-between shrink-0" style={{ borderBottom: '1px solid #2a2a2a' }}>
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl flex items-center justify-center" style={{ background: 'linear-gradient(135deg, #0073E6, #005bb5)' }}>
                <Rocket className="w-4.5 h-4.5 text-white" />
              </div>
              <div>
                <h2 className="text-[14px] font-bold text-white">Publish & Deploy</h2>
                <p className="text-[11px] text-[#666]">{siteName}</p>
              </div>
            </div>
            <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-[#333] transition-colors">
              <X className="w-4 h-4 text-[#666]" />
            </button>
          </div>

          {/* Publishing Progress */}
          <AnimatePresence>
            {publishing && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: 'auto', opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                className="px-5 py-3 shrink-0"
                style={{ borderBottom: '1px solid #2a2a2a', background: 'linear-gradient(180deg, rgba(0,115,230,0.05), transparent)' }}
              >
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <Loader2 className="w-3.5 h-3.5 text-[#0073E6] animate-spin" />
                    <span className="text-[11px] font-medium text-[#0073E6]">{publishStage}</span>
                  </div>
                  <span className="text-[10px] text-[#555] tabular-nums">{publishProgress}%</span>
                </div>
                <div className="h-1.5 rounded-full overflow-hidden" style={{ backgroundColor: '#2a2a2a' }}>
                  <motion.div
                    className="h-full rounded-full"
                    style={{ background: 'linear-gradient(90deg, #0073E6, #4da3ff)' }}
                    initial={{ width: '0%' }}
                    animate={{ width: `${publishProgress}%` }}
                    transition={{ duration: 0.5 }}
                  />
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Tabs */}
          <div className="flex px-5 gap-1 pt-3 shrink-0">
            {(['overview', 'history', 'domains'] as const).map(t => (
              <button
                key={t}
                onClick={() => setTab(t)}
                className="px-3 py-1.5 rounded-lg text-[11px] font-medium capitalize transition-all"
                style={{
                  backgroundColor: tab === t ? 'rgba(0,115,230,0.1)' : 'transparent',
                  color: tab === t ? '#4da3ff' : '#888',
                  border: `1px solid ${tab === t ? 'rgba(0,115,230,0.2)' : 'transparent'}`,
                }}
              >
                {t === 'overview' && <Globe className="w-3 h-3 inline mr-1.5" />}
                {t === 'history' && <Clock className="w-3 h-3 inline mr-1.5" />}
                {t === 'domains' && <Link2 className="w-3 h-3 inline mr-1.5" />}
                {t}
              </button>
            ))}
          </div>

          {/* Content */}
          <ScrollArea className="flex-1 min-h-0">
            <div className="p-5 space-y-4">
              {tab === 'overview' && (
                <OverviewTab
                  currentDeployment={currentDeployment}
                  domains={domains}
                  publishing={publishing}
                  onPublish={onPublish}
                />
              )}
              {tab === 'history' && (
                <HistoryTab
                  deployments={deployments}
                  expandedLog={expandedLog}
                  setExpandedLog={setExpandedLog}
                  onRollback={rollback}
                  rollingBack={rollingBack}
                />
              )}
              {tab === 'domains' && (
                <DomainsTab
                  domains={domains}
                  newDomain={newDomain}
                  setNewDomain={setNewDomain}
                  onAddDomain={addCustomDomain}
                  onRemoveDomain={removeDomain}
                  onVerifyDomain={verifyDomain}
                  verifyingDomain={verifyingDomain}
                />
              )}
            </div>
          </ScrollArea>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}

// ─── Overview ──────────────────

function OverviewTab({ currentDeployment, domains, publishing, onPublish }: {
  currentDeployment: Deployment | null;
  domains: SiteDomain[];
  publishing: boolean;
  onPublish: () => void;
}) {
  const activeDomain = domains.find(d => d.status === 'active');

  return (
    <div className="space-y-4">
      {/* Current status */}
      {currentDeployment ? (
        <div className="rounded-xl p-4 space-y-3" style={{ backgroundColor: '#222', border: '1px solid #2a2a2a' }}>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 rounded-full animate-pulse" style={{ backgroundColor: '#22c55e' }} />
              <span className="text-[12px] font-semibold text-white">Your site is live</span>
            </div>
            <span className="text-[10px] px-2 py-0.5 rounded-full font-semibold" style={{ backgroundColor: 'rgba(34,197,94,0.1)', color: '#22c55e' }}>
              v{currentDeployment.version_number}
            </span>
          </div>

          {/* Live URL */}
          {currentDeployment.live_url && (
            <div className="flex items-center gap-2">
              <div className="flex-1 px-3 py-2 rounded-lg text-[11px] font-mono truncate" style={{ backgroundColor: '#1a1a1a', border: '1px solid #333', color: '#4da3ff' }}>
                {currentDeployment.live_url}
              </div>
              <button
                onClick={() => {
                  navigator.clipboard.writeText(currentDeployment.live_url!);
                  toast.success('URL copied!');
                }}
                className="h-8 w-8 flex items-center justify-center rounded-lg hover:bg-[#333] transition-colors"
                style={{ border: '1px solid #333' }}
              >
                <Copy className="w-3.5 h-3.5 text-[#888]" />
              </button>
              <a
                href={currentDeployment.live_url}
                target="_blank"
                rel="noopener noreferrer"
                className="h-8 w-8 flex items-center justify-center rounded-lg hover:bg-[#333] transition-colors"
                style={{ border: '1px solid #333' }}
              >
                <ExternalLink className="w-3.5 h-3.5 text-[#888]" />
              </a>
            </div>
          )}

          {/* Stats */}
          <div className="grid grid-cols-3 gap-2">
            <StatCard icon={<FileText className="w-3 h-3" />} label="Pages" value={String(currentDeployment.page_count)} />
            <StatCard icon={<HardDrive className="w-3 h-3" />} label="Size" value={formatBytes(currentDeployment.total_size_bytes)} />
            <StatCard icon={<Clock className="w-3 h-3" />} label="Published" value={currentDeployment.deployed_at ? timeAgo(currentDeployment.deployed_at) : '—'} />
          </div>
        </div>
      ) : (
        <div className="rounded-xl p-6 text-center space-y-3" style={{ backgroundColor: '#222', border: '1px solid #2a2a2a' }}>
          <div className="w-12 h-12 rounded-xl mx-auto flex items-center justify-center" style={{ background: 'linear-gradient(135deg, rgba(0,115,230,0.1), transparent)', border: '1px solid rgba(0,115,230,0.15)' }}>
            <Globe className="w-6 h-6" style={{ color: 'rgba(0,115,230,0.4)' }} />
          </div>
          <div>
            <p className="text-[13px] font-semibold text-white">Not published yet</p>
            <p className="text-[11px] text-[#666] mt-0.5">Click Publish to make your site live</p>
          </div>
        </div>
      )}

      {/* Publish button */}
      <button
        onClick={onPublish}
        disabled={publishing}
        className="w-full flex items-center justify-center gap-2 py-3 rounded-xl text-[13px] font-bold text-white transition-all disabled:opacity-50"
        style={{ background: 'linear-gradient(135deg, #0073E6, #005bb5)', boxShadow: '0 4px 20px rgba(0,115,230,0.3)' }}
      >
        {publishing ? (
          <>
            <Loader2 className="w-4 h-4 animate-spin" />
            Publishing…
          </>
        ) : (
          <>
            <Rocket className="w-4 h-4" />
            {currentDeployment ? 'Publish Update' : 'Publish Site'}
          </>
        )}
      </button>

      {/* Quick info */}
      <div className="grid grid-cols-3 gap-2">
        <InfoCard icon={<Server className="w-3.5 h-3.5" />} title="Global CDN" desc="Worldwide delivery" />
        <InfoCard icon={<Shield className="w-3.5 h-3.5" />} title="SSL/HTTPS" desc="Auto-enabled" />
        <InfoCard icon={<Zap className="w-3.5 h-3.5" />} title="Instant" desc="< 10s deploy" />
      </div>
    </div>
  );
}

function StatCard({ icon, label, value }: { icon: React.ReactNode; label: string; value: string }) {
  return (
    <div className="rounded-lg p-2.5 text-center" style={{ backgroundColor: '#1a1a1a', border: '1px solid #2a2a2a' }}>
      <div className="flex items-center justify-center gap-1 mb-1" style={{ color: '#666' }}>{icon}</div>
      <div className="text-[12px] font-bold text-white">{value}</div>
      <div className="text-[9px] text-[#555] uppercase tracking-wider">{label}</div>
    </div>
  );
}

function InfoCard({ icon, title, desc }: { icon: React.ReactNode; title: string; desc: string }) {
  return (
    <div className="rounded-lg p-3 flex flex-col items-center gap-1.5" style={{ backgroundColor: '#222', border: '1px solid #2a2a2a' }}>
      <div style={{ color: '#0073E6' }}>{icon}</div>
      <span className="text-[10px] font-semibold text-[#ccc]">{title}</span>
      <span className="text-[9px] text-[#555]">{desc}</span>
    </div>
  );
}

// ─── History ──────────────────

function HistoryTab({ deployments, expandedLog, setExpandedLog, onRollback, rollingBack }: {
  rollingBack?: string | null;
  deployments: Deployment[];
  expandedLog: string | null;
  setExpandedLog: (id: string | null) => void;
  onRollback: (id: string) => void;
}) {
  if (deployments.length === 0) {
    return (
      <div className="text-center py-8">
        <Clock className="w-8 h-8 mx-auto mb-2" style={{ color: '#333' }} />
        <p className="text-[12px] text-[#666]">No deployments yet</p>
      </div>
    );
  }

  return (
    <div className="space-y-2">
      {deployments.map(dep => {
        const config = STATUS_CONFIG[dep.status] || STATUS_CONFIG.pending;
        const StatusIcon = config.icon;
        const isExpanded = expandedLog === dep.id;

        return (
          <div key={dep.id} className="rounded-xl overflow-hidden" style={{ backgroundColor: '#222', border: `1px solid ${dep.status === 'live' ? 'rgba(34,197,94,0.2)' : '#2a2a2a'}` }}>
            <div className="flex items-center justify-between px-4 py-3">
              <div className="flex items-center gap-3">
                <StatusIcon className={`w-4 h-4 ${dep.status === 'building' ? 'animate-spin' : ''}`} style={{ color: config.color }} />
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-[12px] font-semibold text-white">Version {dep.version_number}</span>
                    <span className="text-[9px] px-1.5 py-0.5 rounded-full font-semibold" style={{ backgroundColor: config.color + '15', color: config.color }}>
                      {config.label}
                    </span>
                  </div>
                  <div className="flex items-center gap-3 mt-0.5">
                    <span className="text-[10px] text-[#666]">{dep.page_count} pages</span>
                    <span className="text-[10px] text-[#666]">{formatBytes(dep.total_size_bytes)}</span>
                    <span className="text-[10px] text-[#555]">{dep.deployed_at ? timeAgo(dep.deployed_at) : dep.created_at ? timeAgo(dep.created_at) : ''}</span>
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-1">
                {dep.status === 'archived' && (
                  <button
                    onClick={() => onRollback(dep.id)}
                    disabled={!!rollingBack}
                    className="flex items-center gap-1 px-2.5 py-1 rounded-lg text-[10px] font-medium transition-colors hover:bg-[#333] disabled:opacity-50"
                    style={{ border: '1px solid #333', color: '#888' }}
                  >
                    <RotateCcw className={`w-3 h-3 ${rollingBack === dep.id ? 'animate-spin' : ''}`} />
                    {rollingBack === dep.id ? 'Restoring…' : 'Rollback'}
                  </button>
                )}
                <button
                  onClick={() => setExpandedLog(isExpanded ? null : dep.id)}
                  className="p-1.5 rounded-lg hover:bg-[#333] transition-colors"
                >
                  {isExpanded ? <ChevronDown className="w-3.5 h-3.5 text-[#888]" /> : <ChevronRight className="w-3.5 h-3.5 text-[#888]" />}
                </button>
              </div>
            </div>

            {/* Build log */}
            <AnimatePresence>
              {isExpanded && dep.build_log && (
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: 'auto', opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  className="px-4 pb-3"
                >
                  <div className="rounded-lg p-3 space-y-1.5" style={{ backgroundColor: '#1a1a1a', border: '1px solid #2a2a2a' }}>
                    <div className="text-[9px] font-bold uppercase tracking-wider mb-2" style={{ color: '#555' }}>Build Log</div>
                    {(dep.build_log as any[]).map((entry: any, i: number) => (
                      <div key={i} className="flex items-center gap-2">
                        <div className="w-1.5 h-1.5 rounded-full shrink-0" style={{ backgroundColor: entry.status === 'complete' ? '#22c55e' : entry.status === 'running' ? '#f59e0b' : '#ef4444' }} />
                        <span className="text-[10px] font-medium" style={{ color: '#999' }}>{entry.step}</span>
                        {entry.details && <span className="text-[10px] text-[#555] ml-auto">{entry.details}</span>}
                      </div>
                    ))}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        );
      })}
    </div>
  );
}

// ─── Domains ──────────────────

function DomainsTab({ domains, newDomain, setNewDomain, onAddDomain, onRemoveDomain, onVerifyDomain, verifyingDomain }: {
  onVerifyDomain?: (id: string) => void;
  verifyingDomain?: string | null;
  domains: SiteDomain[];
  newDomain: string;
  setNewDomain: (v: string) => void;
  onAddDomain: (domain: string) => void;
  onRemoveDomain: (id: string) => void;
}) {
  return (
    <div className="space-y-4">
      {/* Add domain */}
      <div className="rounded-xl p-4 space-y-3" style={{ backgroundColor: '#222', border: '1px solid #2a2a2a' }}>
        <div className="text-[11px] font-semibold text-white">Connect Custom Domain</div>
        <div className="flex gap-2">
          <input
            value={newDomain}
            onChange={e => setNewDomain(e.target.value)}
            placeholder="yourdomain.com"
            className="flex-1 h-9 px-3 rounded-lg text-[12px] outline-none"
            style={{ backgroundColor: '#1a1a1a', border: '1px solid #333', color: '#ccc' }}
            onKeyDown={e => {
              if (e.key === 'Enter' && newDomain.trim()) {
                onAddDomain(newDomain.trim());
                setNewDomain('');
              }
            }}
          />
          <button
            onClick={() => { if (newDomain.trim()) { onAddDomain(newDomain.trim()); setNewDomain(''); } }}
            disabled={!newDomain.trim()}
            className="h-9 px-4 rounded-lg text-[11px] font-semibold text-white disabled:opacity-30"
            style={{ backgroundColor: '#0073E6' }}
          >
            <Plus className="w-3.5 h-3.5 inline mr-1" />
            Add
          </button>
        </div>
      </div>

      {/* Domain list */}
      {domains.length === 0 ? (
        <div className="text-center py-6">
          <Link2 className="w-8 h-8 mx-auto mb-2" style={{ color: '#333' }} />
          <p className="text-[12px] text-[#666]">No domains connected</p>
          <p className="text-[10px] text-[#444] mt-1">Publish your site to get a free Quooro subdomain</p>
        </div>
      ) : (
        <div className="space-y-2">
          {domains.map(domain => (
            <div key={domain.id} className="rounded-xl p-4" style={{ backgroundColor: '#222', border: '1px solid #2a2a2a' }}>
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  {domain.status === 'active' ? (
                    <CheckCircle2 className="w-4 h-4 text-green-500" />
                  ) : (
                    <AlertCircle className="w-4 h-4 text-amber-500" />
                  )}
                  <span className="text-[12px] font-semibold text-white">{domain.domain_name}</span>
                  <span className="text-[9px] px-1.5 py-0.5 rounded-full font-semibold uppercase" style={{
                    backgroundColor: domain.domain_type === 'subdomain' ? 'rgba(0,115,230,0.1)' : 'rgba(167,139,250,0.1)',
                    color: domain.domain_type === 'subdomain' ? '#4da3ff' : '#a78bfa',
                  }}>
                    {domain.domain_type}
                  </span>
                </div>
                {domain.domain_type === 'custom' && (
                  <button
                    onClick={() => onRemoveDomain(domain.id)}
                    className="p-1.5 rounded-lg hover:bg-red-500/10 transition-colors"
                  >
                    <Trash2 className="w-3.5 h-3.5 text-red-400" />
                  </button>
                )}
              </div>

              <div className="flex items-center gap-3 text-[10px] text-[#666]">
                {domain.ssl_active && (
                  <span className="flex items-center gap-1">
                    <Shield className="w-3 h-3 text-green-500" /> SSL Active
                  </span>
                )}
                {domain.dns_verified && (
                  <span className="flex items-center gap-1">
                    <CheckCircle2 className="w-3 h-3 text-green-500" /> DNS Verified
                  </span>
                )}
                {domain.verified_at && (
                  <span>Connected {timeAgo(domain.verified_at)}</span>
                )}
              </div>

              {/* DNS Instructions for pending custom domains */}
              {domain.domain_type === 'custom' && domain.status === 'pending_dns' && domain.dns_instructions && (
                <div className="mt-3 rounded-lg p-3 space-y-2" style={{ backgroundColor: '#1a1a1a', border: '1px solid #333' }}>
                  <div className="text-[10px] font-bold uppercase tracking-wider" style={{ color: '#f59e0b' }}>DNS Setup Required</div>
                  <p className="text-[10px] text-[#888]">Add these records at your domain provider:</p>
                  {(domain.dns_instructions as any)?.records?.map((rec: any, i: number) => (
                    <div key={i} className="flex items-center gap-3 px-2 py-1.5 rounded" style={{ backgroundColor: '#222' }}>
                      <span className="text-[10px] font-mono font-bold" style={{ color: '#4da3ff', minWidth: '40px' }}>{rec.type}</span>
                      <span className="text-[10px] font-mono text-[#999]">{rec.name}</span>
                      <span className="text-[10px] text-[#555]">→</span>
                      <span className="text-[10px] font-mono text-[#ccc] truncate">{rec.value}</span>
                      <button
                        onClick={() => { navigator.clipboard.writeText(rec.value); toast.success('Copied!'); }}
                        className="ml-auto shrink-0"
                      >
                        <Copy className="w-3 h-3 text-[#555] hover:text-white" />
                      </button>
                    </div>
                  ))}
                  {/* Adding a domain used to leave it pending for ever with
                      nothing ever checking. This asks the resolver. */}
                  <button
                    onClick={() => onVerifyDomain?.(domain.id)}
                    disabled={!!verifyingDomain}
                    className="mt-1 flex w-full items-center justify-center gap-1.5 rounded-lg py-1.5 text-[10px] font-medium transition-colors hover:bg-[#2a2a2a] disabled:opacity-50"
                    style={{ border: '1px solid #333', color: '#ccc' }}
                  >
                    <RotateCcw className={`w-3 h-3 ${verifyingDomain === domain.id ? 'animate-spin' : ''}`} />
                    {verifyingDomain === domain.id ? 'Checking DNS…' : "I've added these — check now"}
                  </button>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
