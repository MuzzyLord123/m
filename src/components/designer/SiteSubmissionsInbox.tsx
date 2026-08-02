import { useCallback, useEffect, useMemo, useState } from 'react';
import { Mail, MailOpen, Ban, Trash2, Download, RefreshCw, ChevronLeft } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';
import { Panel, EmptyState, ErrorState, SkeletonBlock, RelativeTime, FIELD, CHIP_ON, CHIP_OFF } from '@/components/platform';

/**
 * What the published sites collected.
 *
 * Everything here is a row somebody actually submitted through a live form -
 * there is no sample data and no placeholder inbox. When a site has had no
 * enquiries the panel says so plainly rather than inventing one.
 */

export interface SiteSubmission {
  id: string;
  site_id: string;
  form_name: string;
  page_slug: string;
  payload: Record<string, string>;
  contact_name: string | null;
  contact_email: string | null;
  is_read: boolean;
  is_spam: boolean;
  submitted_at: string;
}

const LABEL = 'text-[10px] font-medium uppercase tracking-[0.09em] text-muted-foreground/90';

type Filter = 'unread' | 'all' | 'spam';

export function SiteSubmissionsInbox({ sites }: { sites: { id: string; site_name: string }[] }) {
  const [rows, setRows] = useState<SiteSubmission[]>([]);
  const [loading, setLoading] = useState(true);
  const [failed, setFailed] = useState(false);
  const [filter, setFilter] = useState<Filter>('unread');
  const [siteFilter, setSiteFilter] = useState<string>('all');
  const [search, setSearch] = useState('');
  const [openId, setOpenId] = useState<string | null>(null);

  const siteName = useCallback(
    (id: string) => sites.find(s => s.id === id)?.site_name || 'Site',
    [sites],
  );

  const load = useCallback(async () => {
    if (sites.length === 0) { setRows([]); setLoading(false); return; }
    setFailed(false);
    const { data, error } = await supabase
      .from('site_form_submissions' as never)
      .select('*')
      .in('site_id', sites.map(s => s.id))
      .order('submitted_at', { ascending: false })
      .limit(500);
    if (error) { setFailed(true); setLoading(false); return; }
    setRows((data || []) as unknown as SiteSubmission[]);
    setLoading(false);
  }, [sites]);

  useEffect(() => { load(); }, [load]);

  const visible = useMemo(() => {
    const q = search.trim().toLowerCase();
    return rows.filter(r => {
      if (filter === 'unread' && (r.is_read || r.is_spam)) return false;
      if (filter === 'all' && r.is_spam) return false;
      if (filter === 'spam' && !r.is_spam) return false;
      if (siteFilter !== 'all' && r.site_id !== siteFilter) return false;
      if (!q) return true;
      return (
        (r.contact_name || '').toLowerCase().includes(q) ||
        (r.contact_email || '').toLowerCase().includes(q) ||
        r.form_name.toLowerCase().includes(q) ||
        Object.values(r.payload || {}).some(v => String(v).toLowerCase().includes(q))
      );
    });
  }, [rows, filter, siteFilter, search]);

  const unreadCount = rows.filter(r => !r.is_read && !r.is_spam).length;
  const open = rows.find(r => r.id === openId) || null;

  const patch = async (id: string, changes: Partial<SiteSubmission>) => {
    setRows(prev => prev.map(r => (r.id === id ? { ...r, ...changes } : r)));
    const { error } = await supabase
      .from('site_form_submissions' as never)
      .update(changes as never)
      .eq('id', id);
    if (error) { toast.error('Could not save that change'); load(); }
  };

  const openSubmission = (row: SiteSubmission) => {
    setOpenId(row.id);
    if (!row.is_read) patch(row.id, { is_read: true });
  };

  const remove = async (id: string) => {
    const { error } = await supabase.from('site_form_submissions' as never).delete().eq('id', id);
    if (error) { toast.error('Could not delete that submission'); return; }
    setRows(prev => prev.filter(r => r.id !== id));
    if (openId === id) setOpenId(null);
    toast.success('Submission deleted');
  };

  /** A spreadsheet of exactly what is on screen - no hidden rows, no invented columns. */
  const exportCSV = () => {
    if (visible.length === 0) return;
    const fieldNames = Array.from(new Set(visible.flatMap(r => Object.keys(r.payload || {}))));
    const head = ['Received', 'Site', 'Form', 'Page', ...fieldNames];
    const esc = (v: string) => `"${String(v ?? '').replace(/"/g, '""')}"`;
    const lines = visible.map(r => [
      new Date(r.submitted_at).toISOString(),
      siteName(r.site_id),
      r.form_name,
      r.page_slug,
      ...fieldNames.map(f => r.payload?.[f] ?? ''),
    ].map(esc).join(','));
    const blob = new Blob([[head.map(esc).join(','), ...lines].join('\n')], { type: 'text/csv;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `site-submissions-${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  if (loading) {
    return (
      <div className="space-y-2">
        {Array.from({ length: 6 }).map((_, i) => <SkeletonBlock key={i} className="h-[58px] rounded-[12px]" />)}
      </div>
    );
  }

  if (failed) {
    return (
      <Panel>
        <ErrorState
          title="Submissions could not be loaded"
          body="The connection to your site data failed."
          onRetry={load}
        />
      </Panel>
    );
  }

  if (sites.length === 0) {
    return (
      <Panel>
        <EmptyState
          compact
          title="No sites yet"
          body="Once you publish a site with a form on it, everything it collects arrives here."
        />
      </Panel>
    );
  }

  // ── reading one submission ──
  if (open) {
    const entries = Object.entries(open.payload || {});
    return (
      <div className="space-y-3">
        <button
          onClick={() => setOpenId(null)}
          className="flex items-center gap-1.5 text-[12px] text-muted-foreground transition-colors hover:text-foreground"
        >
          <ChevronLeft className="h-3.5 w-3.5" />
          All submissions
        </button>

        <section className="overflow-hidden rounded-[12px] border border-border/40 bg-card">
          <div className="flex flex-wrap items-start justify-between gap-3 border-b border-border/40 px-4 py-3">
            <div className="min-w-0">
              <p className={LABEL}>{open.form_name}</p>
              <h3 className="mt-1 truncate font-display text-[16px] font-semibold tracking-[-0.01em]">
                {open.contact_name || open.contact_email || 'Submission'}
              </h3>
              <p className="mt-0.5 text-[11.5px] text-muted-foreground">
                {siteName(open.site_id)}
                {open.page_slug ? ` · ${open.page_slug}` : ''} · <RelativeTime date={open.submitted_at} />
              </p>
            </div>
            <div className="flex shrink-0 items-center gap-1.5">
              {open.contact_email && (
                <Button size="sm" variant="outline" className="h-8 text-[12px]" asChild>
                  <a href={`mailto:${open.contact_email}`}>Reply</a>
                </Button>
              )}
              <Button
                size="sm" variant="outline" className="h-8 text-[12px]"
                onClick={() => patch(open.id, { is_spam: !open.is_spam })}
              >
                <Ban className="mr-1.5 h-3.5 w-3.5" />
                {open.is_spam ? 'Not spam' : 'Spam'}
              </Button>
              <Button
                size="sm" variant="outline"
                className="h-8 text-[12px] text-risk hover:text-risk"
                onClick={() => remove(open.id)}
              >
                <Trash2 className="h-3.5 w-3.5" />
              </Button>
            </div>
          </div>

          {entries.length === 0 ? (
            <p className="px-4 py-8 text-center text-[12.5px] text-muted-foreground">
              This submission arrived with no fields.
            </p>
          ) : (
            <dl className="divide-y divide-border/30">
              {entries.map(([field, value]) => (
                <div key={field} className="grid gap-1 px-4 py-3 sm:grid-cols-[180px_1fr] sm:gap-4">
                  <dt className={cn(LABEL, 'sm:pt-0.5')}>{field}</dt>
                  <dd className="whitespace-pre-wrap break-words text-[13px] leading-relaxed">
                    {value || <span className="text-muted-foreground">—</span>}
                  </dd>
                </div>
              ))}
            </dl>
          )}
        </section>
      </div>
    );
  }

  // ── the list ──
  return (
    <div className="space-y-3">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="flex flex-wrap items-center gap-1.5">
          {([
            ['unread', unreadCount > 0 ? `Unread (${unreadCount})` : 'Unread'],
            ['all', 'All'],
            ['spam', 'Spam'],
          ] as [Filter, string][]).map(([key, label]) => (
            <button
              key={key}
              type="button"
              onClick={() => setFilter(key)}
              aria-pressed={filter === key}
              className={cn('rounded-full border px-3 py-1 text-[11px] font-medium transition-colors duration-150',
                filter === key ? CHIP_ON : CHIP_OFF)}
            >
              {label}
            </button>
          ))}
          {sites.length > 1 && (
            <select
              value={siteFilter}
              onChange={e => setSiteFilter(e.target.value)}
              aria-label="Filter by site"
              className={cn(FIELD, 'h-7 w-auto px-2 text-[11px]')}
            >
              <option value="all">Every site</option>
              {sites.map(s => <option key={s.id} value={s.id}>{s.site_name}</option>)}
            </select>
          )}
        </div>
        <div className="flex items-center gap-1.5">
          <Input
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Search submissions"
            className={cn(FIELD, 'h-8 w-[190px] text-[12px]')}
          />
          <Button size="sm" variant="outline" className="h-8 px-2.5 text-[12px]" onClick={load} aria-label="Refresh">
            <RefreshCw className="h-3.5 w-3.5" />
          </Button>
          <Button
            size="sm" variant="outline" className="h-8 px-2.5 text-[12px]"
            onClick={exportCSV} disabled={visible.length === 0} aria-label="Export CSV"
          >
            <Download className="h-3.5 w-3.5" />
          </Button>
        </div>
      </div>

      {visible.length === 0 ? (
        <Panel>
          <EmptyState
            compact
            title={
              filter === 'spam' ? 'Nothing marked as spam'
                : filter === 'unread' ? 'No unread submissions'
                : search ? 'Nothing matches that search'
                : 'No submissions yet'
            }
            body={
              search ? 'Try a different name, address or word from the message.'
                : filter === 'unread' ? 'Everything that has come in has been read.'
                : 'When somebody fills in a form on one of your published sites, it lands here.'
            }
          />
        </Panel>
      ) : (
        <section className="overflow-hidden rounded-[12px] border border-border/40 bg-card">
          <ul className="divide-y divide-border/30">
            {visible.map(row => {
              const preview = Object.values(row.payload || {}).find(v => String(v).length > 24) || '';
              return (
                <li key={row.id}>
                  <button
                    onClick={() => openSubmission(row)}
                    className="flex w-full items-center gap-3 px-3.5 py-2.5 text-left transition-colors hover:bg-foreground/[0.025]"
                  >
                    <span className="shrink-0 text-muted-foreground">
                      {row.is_read
                        ? <MailOpen className="h-3.5 w-3.5" />
                        : <Mail className="h-3.5 w-3.5 text-primary" />}
                    </span>
                    <span className="min-w-0 flex-1">
                      <span className="flex items-baseline gap-2">
                        <span className={cn('truncate text-[13px]', !row.is_read && 'font-semibold')}>
                          {row.contact_name || row.contact_email || row.form_name}
                        </span>
                        <span className="shrink-0 text-[11px] text-muted-foreground">{row.form_name}</span>
                      </span>
                      <span className="mt-0.5 block truncate text-[11.5px] text-muted-foreground">
                        {sites.length > 1 ? `${siteName(row.site_id)} · ` : ''}{preview || row.contact_email || '—'}
                      </span>
                    </span>
                    <span className="shrink-0 text-[11px] tabular-nums text-muted-foreground">
                      <RelativeTime date={row.submitted_at} />
                    </span>
                  </button>
                </li>
              );
            })}
          </ul>
        </section>
      )}

      <p className="px-1 text-[11px] leading-relaxed text-muted-foreground">
        Collected from forms on your published sites. Up to 500 most recent are shown.
      </p>
    </div>
  );
}

export default SiteSubmissionsInbox;
