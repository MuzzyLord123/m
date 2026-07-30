import { useEffect, useMemo, useRef, useState } from 'react';
import {
  Search, Globe, Upload, Loader2, Check, ExternalLink, Plus, ShieldCheck,
  Clock, AlertCircle, FileArchive, History, Link2, X,
} from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { toast } from 'sonner';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';
import { AvatarID, EmptyState, SkeletonLedger, Panel, PanelHeader } from '@/components/platform';

/**
 * Client website delivery.
 *
 * The left column is the book of clients, grouped by where their site
 * has got to, so the shape of the workload is visible before anything is
 * clicked. The right is one client's site: the preview itself, framed
 * live, then the address, the certificate, the files and the history of
 * what has been released to them.
 *
 * Attaching a preview address to an account is the single most important
 * action here, so it sits at the top with the preview beside it.
 */

interface VersionEntry { version: string; date: string; changes: string }

interface ClientProfile {
  id: string;
  user_id: string;
  full_name: string | null;
  email: string | null;
  company: string | null;
  customer_id: string | null;
  plan: string | null;
  avatar_url: string | null;
  website_status: string | null;
  preview_url: string | null;
  domain_name: string | null;
  ssl_status: string | null;
  hosting_provider: string | null;
  last_updated_at: string | null;
  site_files_url: string | null;
  version_history: VersionEntry[] | null;
  site_published_at: string | null;
}

const STAGES = [
  { value: 'design', label: 'Design', dot: 'bg-muted-foreground/60' },
  { value: 'development', label: 'Development', dot: 'bg-primary' },
  { value: 'review', label: 'With the client', dot: 'bg-attend' },
  { value: 'live', label: 'Live', dot: 'bg-ok' },
  { value: 'not_published', label: 'Not published', dot: 'bg-muted-foreground/40' },
];

const SSL_OPTIONS = [
  { value: 'active', label: 'Active', icon: ShieldCheck, tone: 'text-ok' },
  { value: 'pending', label: 'Pending', icon: Clock, tone: 'text-attend' },
  { value: 'expired', label: 'Expired', icon: AlertCircle, tone: 'text-risk' },
];

const KICKER = 'font-mono text-[9px] font-medium uppercase tracking-[0.16em] text-muted-foreground';
const MAX_UPLOAD_BYTES = 500 * 1024 * 1024;

const stageOf = (s: string | null) => STAGES.find(x => x.value === (s || 'design')) || STAGES[0];
const nameOf = (c: ClientProfile) => c.company || c.full_name || c.email || 'Unnamed client';
const hrefOf = (url: string | null) => (url ? (url.startsWith('http') ? url : `https://${url}`) : null);

export default function AdminWebsiteManagement() {
  const [clients, setClients] = useState<ClientProfile[]>([]);
  const [selected, setSelected] = useState<ClientProfile | null>(null);
  const [search, setSearch] = useState('');
  const [stageFilter, setStageFilter] = useState<string>('all');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [dragging, setDragging] = useState(false);
  const [versionOpen, setVersionOpen] = useState(false);
  const [newVersion, setNewVersion] = useState({ version: '', changes: '' });
  const [urlError, setUrlError] = useState('');
  const fileRef = useRef<HTMLInputElement>(null);

  const [form, setForm] = useState({
    website_status: '', preview_url: '', domain_name: '',
    ssl_status: '', hosting_provider: '', site_files_url: '',
  });

  const validateUrl = (url: string) => {
    if (!url) return true;
    return /^(https?:\/\/)?([\da-z.-]+)\.([a-z.]{2,6})([/\w .-]*)*\/?$/i.test(url);
  };

  const fetchClients = async () => {
    try {
      const { data, error } = await supabase
        .from('profiles').select('*').order('full_name', { ascending: true });
      if (error) throw error;
      const parsed = (data || []).map((c: any) => ({
        ...c,
        version_history: typeof c.version_history === 'string'
          ? JSON.parse(c.version_history)
          : c.version_history,
      }));
      setClients(parsed as ClientProfile[]);
    } catch (e) {
      console.error('Error fetching clients:', e);
      toast.error('Failed to load clients');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchClients(); }, []);

  function pick(client: ClientProfile) {
    setSelected(client);
    setUrlError('');
    setForm({
      website_status: client.website_status || 'design',
      preview_url: client.preview_url || '',
      domain_name: client.domain_name || '',
      ssl_status: client.ssl_status || 'pending',
      hosting_provider: client.hosting_provider || 'Quooro Cloud',
      site_files_url: client.site_files_url || '',
    });
  }

  async function uploadSiteFile(file: File) {
    if (!selected) return;
    if (!file.size || (file.size === 0 && !file.type)) {
      toast.error('Drop a single archive (.zip / .tar / .gz). Folders need zipping first.');
      return;
    }
    if (file.size > MAX_UPLOAD_BYTES) {
      toast.error(`That file is ${(file.size / 1024 / 1024).toFixed(1)} MB. The limit is 500 MB.`);
      return;
    }
    setUploading(true);
    try {
      const ext = (file.name.split('.').pop() || 'bin').toLowerCase();
      const path = `${selected.user_id}/site-files-${Date.now()}.${ext}`;
      const { error: uploadError } = await supabase.storage.from('site-files')
        .upload(path, file, { upsert: true, contentType: file.type || 'application/octet-stream' });
      if (uploadError) throw uploadError;
      const { data: { publicUrl } } = supabase.storage.from('site-files').getPublicUrl(path);
      setForm(prev => ({ ...prev, site_files_url: publicUrl }));
      toast.success(`Uploaded ${file.name} (${(file.size / 1024 / 1024).toFixed(1)} MB)`);
    } catch (e: any) {
      const msg = e?.message || e?.error || 'Unknown error';
      toast.error(/exceeded|too large|size/i.test(msg)
        ? 'That file is over the storage limit. Compress it further or raise the limit.'
        : `Upload failed: ${msg}`);
    } finally {
      setUploading(false);
    }
  }

  async function save() {
    if (!selected) return;
    if (form.preview_url && !validateUrl(form.preview_url)) {
      setUrlError('That does not look like a web address.');
      return;
    }
    setUrlError('');
    setSaving(true);
    try {
      const { error } = await supabase.from('profiles').update({
        website_status: form.website_status,
        preview_url: form.preview_url || null,
        domain_name: form.domain_name || null,
        ssl_status: form.ssl_status,
        hosting_provider: form.hosting_provider || 'Quooro Cloud',
        site_files_url: form.site_files_url || null,
      }).eq('id', selected.id);
      if (error) throw error;
      toast.success('Saved to this client\'s account');
      const updated = { ...selected, ...form } as ClientProfile;
      setSelected(updated);
      setClients(prev => prev.map(c => (c.id === selected.id ? updated : c)));
    } catch (e) {
      console.error('Error saving:', e);
      toast.error('Failed to save changes');
    } finally {
      setSaving(false);
    }
  }

  async function addVersion() {
    if (!selected || !newVersion.version || !newVersion.changes) {
      toast.error('A version needs both a number and what changed');
      return;
    }
    try {
      const history = (selected.version_history as VersionEntry[] | null) || [];
      const updatedHistory = [
        { version: newVersion.version, date: new Date().toISOString(), changes: newVersion.changes },
        ...history,
      ];
      const { error } = await supabase.from('profiles')
        .update({ version_history: JSON.stringify(updatedHistory) }).eq('id', selected.id);
      if (error) throw error;
      toast.success('Release recorded');
      setVersionOpen(false);
      setNewVersion({ version: '', changes: '' });
      const updated = { ...selected, version_history: updatedHistory };
      setSelected(updated);
      setClients(prev => prev.map(c => (c.id === selected.id ? updated : c)));
    } catch (e) {
      console.error('Error adding version:', e);
      toast.error('Failed to record the release');
    }
  }

  const counts = useMemo(() => {
    const c: Record<string, number> = { all: clients.length };
    STAGES.forEach(s => { c[s.value] = 0; });
    clients.forEach(cl => { const k = (cl.website_status || 'design'); c[k] = (c[k] || 0) + 1; });
    return c;
  }, [clients]);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return clients
      .filter(c => stageFilter === 'all' || (c.website_status || 'design') === stageFilter)
      .filter(c => !q
        || nameOf(c).toLowerCase().includes(q)
        || (c.email || '').toLowerCase().includes(q)
        || (c.domain_name || '').toLowerCase().includes(q));
  }, [clients, search, stageFilter]);

  const previewHref = hrefOf(form.preview_url);
  const liveHref = hrefOf(form.domain_name);

  return (
    <div className="flex h-full min-h-0 flex-col">
      <header className="border-b border-border/60 px-4 py-4 sm:px-6">
        <div className="flex flex-wrap items-end justify-between gap-3">
          <div>
            <p className={KICKER}>Delivery</p>
            <h1 className="mt-1.5 font-display text-[24px] font-semibold leading-none tracking-[-0.02em] sm:text-[28px]">
              Client websites
            </h1>
            <p className="mt-2 text-[13px] text-muted-foreground">
              Attach a preview to an account, move it through to live, and keep the record of what was released.
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-1.5">
            {[{ value: 'all', label: 'All' }, ...STAGES].map(s => (
              <button
                key={s.value}
                type="button"
                onClick={() => setStageFilter(s.value)}
                className={cn(
                  'flex h-8 items-center gap-1.5 rounded-lg border px-2.5 text-[12px] transition-colors',
                  stageFilter === s.value
                    ? 'border-primary/50 bg-primary/[0.08] text-primary'
                    : 'border-border/60 text-muted-foreground hover:text-foreground',
                )}
              >
                {s.label}
                <span className="font-mono text-[10px] tabular-nums opacity-70">{counts[s.value] ?? 0}</span>
              </button>
            ))}
          </div>
        </div>
      </header>

      <div className="grid min-h-0 flex-1 lg:grid-cols-[330px_1fr]">
        {/* The book of clients */}
        <aside className={cn(
          'flex min-h-0 flex-col border-border/60 lg:border-r',
          selected && 'hidden lg:flex',
        )}>
          <div className="border-b border-border/60 p-3">
            <div className="relative">
              <Search className="pointer-events-none absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" />
              <Input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search client, email or domain"
                className="h-9 rounded-[10px] pl-8 text-[12.5px]"
              />
            </div>
          </div>
          <ScrollArea className="min-h-0 flex-1">
            {loading ? (
              <SkeletonLedger rows={7} />
            ) : filtered.length === 0 ? (
              <EmptyState compact title="Nobody here" body="No client matches this filter." />
            ) : (
              <ul className="divide-y divide-border/60">
                {filtered.map(c => {
                  const stage = stageOf(c.website_status);
                  const on = selected?.id === c.id;
                  return (
                    <li key={c.id}>
                      <button
                        type="button"
                        onClick={() => pick(c)}
                        className={cn(
                          'flex w-full items-center gap-3 px-3.5 py-3 text-left transition-colors',
                          on ? 'bg-primary/[0.06]' : 'hover:bg-foreground/[0.025]',
                        )}
                      >
                        <span aria-hidden className={cn('h-1.5 w-1.5 shrink-0 rounded-full', stage.dot)} />
                        <AvatarID name={c.full_name} email={c.email} src={c.avatar_url} size="md" />
                        <span className="min-w-0 flex-1">
                          <span className="block truncate text-[13px] font-medium">{nameOf(c)}</span>
                          <span className="block truncate font-mono text-[10.5px] text-muted-foreground">
                            {c.domain_name || c.preview_url || 'No address yet'}
                          </span>
                        </span>
                        <span className="shrink-0 font-mono text-[9px] uppercase tracking-[0.12em] text-muted-foreground">
                          {stage.label}
                        </span>
                      </button>
                    </li>
                  );
                })}
              </ul>
            )}
          </ScrollArea>
        </aside>

        {/* One client's site */}
        <section className="min-h-0">
          {!selected ? (
            <div className="flex h-full items-center justify-center p-8">
              <EmptyState
                title="Pick a client"
                body="Their preview, address, certificate, files and release history all sit here."
              />
            </div>
          ) : (
            <ScrollArea className="h-full">
              <div className="mx-auto max-w-3xl space-y-4 p-4 sm:p-6">
                <div className="flex items-start gap-3">
                  <button
                    type="button"
                    onClick={() => setSelected(null)}
                    className="flex h-9 w-9 shrink-0 items-center justify-center rounded-[10px] border border-border/60 text-muted-foreground lg:hidden"
                    aria-label="Back to clients"
                  >
                    <X className="h-4 w-4" />
                  </button>
                  <AvatarID name={selected.full_name} email={selected.email} src={selected.avatar_url} size="xl" />
                  <div className="min-w-0 flex-1">
                    <h2 className="truncate font-display text-[19px] font-semibold tracking-[-0.01em]">
                      {nameOf(selected)}
                    </h2>
                    <p className="truncate text-[12.5px] text-muted-foreground">{selected.email}</p>
                    {selected.customer_id && (
                      <p className="mt-0.5 font-mono text-[10.5px] text-muted-foreground">{selected.customer_id}</p>
                    )}
                  </div>
                  <Button className="h-9 gap-2 rounded-[10px] text-xs" disabled={saving} onClick={save}>
                    {saving ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Check className="h-3.5 w-3.5" />}
                    Save
                  </Button>
                </div>

                {/* The preview itself, attached to this account */}
                <Panel>
                  <PanelHeader label="Preview attached to this account">
                    {previewHref && (
                      <a
                        href={previewHref} target="_blank" rel="noreferrer noopener"
                        className="inline-flex items-center gap-1 text-[11.5px] text-muted-foreground hover:text-foreground"
                      >
                        Open <ExternalLink className="h-3 w-3" />
                      </a>
                    )}
                  </PanelHeader>
                  <div className="relative aspect-[16/9] w-full overflow-hidden bg-sunken">
                    {previewHref ? (
                      <iframe
                        key={previewHref}
                        src={previewHref}
                        title="Client preview"
                        sandbox="allow-scripts allow-same-origin"
                        className="pointer-events-none h-[1080px] w-[1920px] origin-top-left border-0"
                        style={{ transform: 'scale(0.365)' }}
                      />
                    ) : (
                      <div className="flex h-full flex-col items-center justify-center gap-2 text-center">
                        <Globe className="h-5 w-5 text-muted-foreground/50" />
                        <p className="text-[12.5px] text-muted-foreground">
                          No preview attached yet. Add the address below and it appears here.
                        </p>
                      </div>
                    )}
                  </div>
                  <div className="space-y-3 p-4">
                    <div>
                      <label className={KICKER}>Preview address</label>
                      <div className="mt-1.5 flex gap-2">
                        <Input
                          value={form.preview_url}
                          onChange={(e) => { setForm(p => ({ ...p, preview_url: e.target.value })); setUrlError(''); }}
                          placeholder="preview.quooro.co.uk/client"
                          className="h-10 text-[13px]"
                        />
                      </div>
                      {urlError && <p className="mt-1.5 text-[11.5px] text-risk">{urlError}</p>}
                      <p className="mt-1.5 text-[11px] leading-relaxed text-muted-foreground">
                        The client sees this on their account as soon as it is saved.
                      </p>
                    </div>
                  </div>
                </Panel>

                {/* Where it has got to */}
                <Panel>
                  <PanelHeader label="Status and hosting" />
                  <div className="grid gap-3.5 p-4 sm:grid-cols-2">
                    <div>
                      <label className={KICKER}>Stage</label>
                      <Select value={form.website_status} onValueChange={(v) => setForm(p => ({ ...p, website_status: v }))}>
                        <SelectTrigger className="mt-1.5 h-10 text-[13px]"><SelectValue /></SelectTrigger>
                        <SelectContent>
                          {STAGES.map(s => (
                            <SelectItem key={s.value} value={s.value}>
                              <span className="flex items-center gap-2">
                                <span aria-hidden className={cn('h-1.5 w-1.5 rounded-full', s.dot)} />
                                {s.label}
                              </span>
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <label className={KICKER}>Live domain</label>
                      <Input
                        value={form.domain_name}
                        onChange={(e) => setForm(p => ({ ...p, domain_name: e.target.value }))}
                        placeholder="clientsite.co.uk"
                        className="mt-1.5 h-10 text-[13px]"
                      />
                    </div>
                    <div>
                      <label className={KICKER}>Certificate</label>
                      <Select value={form.ssl_status} onValueChange={(v) => setForm(p => ({ ...p, ssl_status: v }))}>
                        <SelectTrigger className="mt-1.5 h-10 text-[13px]"><SelectValue /></SelectTrigger>
                        <SelectContent>
                          {SSL_OPTIONS.map(s => (
                            <SelectItem key={s.value} value={s.value}>{s.label}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <label className={KICKER}>Hosting</label>
                      <Input
                        value={form.hosting_provider}
                        onChange={(e) => setForm(p => ({ ...p, hosting_provider: e.target.value }))}
                        placeholder="Quooro Cloud"
                        className="mt-1.5 h-10 text-[13px]"
                      />
                    </div>
                  </div>
                  {liveHref && (
                    <div className="flex items-center gap-2 border-t border-border/60 px-4 py-2.5">
                      <Link2 className="h-3.5 w-3.5 text-muted-foreground" />
                      <a
                        href={liveHref} target="_blank" rel="noreferrer noopener"
                        className="truncate font-mono text-[11.5px] text-muted-foreground hover:text-foreground"
                      >
                        {form.domain_name}
                      </a>
                      {(() => {
                        const ssl = SSL_OPTIONS.find(s => s.value === form.ssl_status);
                        if (!ssl) return null;
                        const Icon = ssl.icon;
                        return (
                          <span className={cn('ml-auto flex items-center gap-1 font-mono text-[9.5px] uppercase tracking-[0.12em]', ssl.tone)}>
                            <Icon className="h-3 w-3" /> {ssl.label}
                          </span>
                        );
                      })()}
                    </div>
                  )}
                </Panel>

                {/* Files */}
                <Panel>
                  <PanelHeader label="Site files" />
                  <div className="p-4">
                    <div
                      onDragOver={(e) => { e.preventDefault(); setDragging(true); }}
                      onDragLeave={() => setDragging(false)}
                      onDrop={(e) => {
                        e.preventDefault();
                        setDragging(false);
                        const f = e.dataTransfer.files?.[0];
                        if (f) uploadSiteFile(f);
                      }}
                      className={cn(
                        'flex flex-col items-center justify-center gap-2 rounded-[12px] border border-dashed px-4 py-7 text-center transition-colors',
                        dragging ? 'border-primary/60 bg-primary/[0.05]' : 'border-border/70',
                      )}
                    >
                      {uploading ? (
                        <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
                      ) : (
                        <FileArchive className="h-5 w-5 text-muted-foreground" />
                      )}
                      <p className="text-[12.5px]">
                        {uploading ? 'Uploading…' : 'Drop the site archive here'}
                      </p>
                      <p className="text-[11px] text-muted-foreground">
                        A single .zip, .tar or .gz, up to 500 MB
                      </p>
                      <Button
                        variant="outline" size="sm"
                        className="mt-1 h-8 gap-1.5 rounded-lg text-xs"
                        disabled={uploading}
                        onClick={() => fileRef.current?.click()}
                      >
                        <Upload className="h-3.5 w-3.5" /> Choose a file
                      </Button>
                      <input
                        ref={fileRef}
                        type="file"
                        className="hidden"
                        onChange={async (e) => {
                          if (!e.target.files?.length) return;
                          await uploadSiteFile(e.target.files[0]);
                          e.target.value = '';
                        }}
                      />
                    </div>
                    {form.site_files_url && (
                      <a
                        href={form.site_files_url} target="_blank" rel="noreferrer noopener"
                        className="mt-3 flex items-center gap-2 truncate rounded-[10px] border border-border/60 px-3 py-2 font-mono text-[11px] text-muted-foreground hover:text-foreground"
                      >
                        <FileArchive className="h-3.5 w-3.5 shrink-0" />
                        <span className="truncate">{form.site_files_url}</span>
                        <ExternalLink className="ml-auto h-3 w-3 shrink-0" />
                      </a>
                    )}
                  </div>
                </Panel>

                {/* Releases */}
                <Panel>
                  <PanelHeader label={`${(selected.version_history || []).length} releases`}>
                    <Button
                      variant="outline" size="sm"
                      className="h-8 gap-1.5 rounded-lg text-xs"
                      onClick={() => setVersionOpen(true)}
                    >
                      <Plus className="h-3.5 w-3.5" /> Record a release
                    </Button>
                  </PanelHeader>
                  {(selected.version_history || []).length === 0 ? (
                    <EmptyState
                      compact
                      title="Nothing released yet"
                      body="Record each version you hand over, so the client's history is clear."
                    />
                  ) : (
                    <ul className="divide-y divide-border/60">
                      {(selected.version_history || []).map((v, i) => (
                        <li key={`${v.version}-${i}`} className="flex gap-3 px-4 py-3">
                          <span className="mt-0.5 flex h-6 shrink-0 items-center rounded-md border border-border/60 px-1.5 font-mono text-[10px] tabular-nums">
                            {v.version}
                          </span>
                          <div className="min-w-0 flex-1">
                            <p className="text-[12.5px] leading-relaxed">{v.changes}</p>
                            <p className="mt-0.5 font-mono text-[10px] text-muted-foreground">
                              {v.date ? format(new Date(v.date), 'd MMM yyyy · HH:mm') : ''}
                            </p>
                          </div>
                          <History className="h-3.5 w-3.5 shrink-0 text-muted-foreground/60" />
                        </li>
                      ))}
                    </ul>
                  )}
                </Panel>
              </div>
            </ScrollArea>
          )}
        </section>
      </div>

      <Dialog open={versionOpen} onOpenChange={setVersionOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader><DialogTitle className="text-[15px]">Record a release</DialogTitle></DialogHeader>
          <div className="space-y-3.5">
            <div>
              <label className={KICKER}>Version</label>
              <Input
                value={newVersion.version}
                onChange={(e) => setNewVersion(p => ({ ...p, version: e.target.value }))}
                placeholder="1.2"
                className="mt-1.5 h-10 text-[13px]"
              />
            </div>
            <div>
              <label className={KICKER}>What changed</label>
              <Textarea
                value={newVersion.changes}
                onChange={(e) => setNewVersion(p => ({ ...p, changes: e.target.value }))}
                placeholder="New booking form, updated gallery"
                className="mt-1.5 min-h-[84px] text-[13px]"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" className="h-10 rounded-[10px]" onClick={() => setVersionOpen(false)}>Cancel</Button>
            <Button className="h-10 gap-2 rounded-[10px]" onClick={addVersion}>
              <Check className="h-4 w-4" /> Record
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
