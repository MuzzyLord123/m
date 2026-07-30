import { useState, useEffect, useRef, useCallback } from 'react';
import { FileText, Plus, Upload, X, Loader2, FileImage, Link as LinkIcon, ExternalLink, Calendar as CalendarIcon, Check, RotateCcw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';
import { format } from 'date-fns';
import {
  PageHeader, Panel, PanelHeader, StatusBadge, EmptyState, SkeletonLedger,
  FIELD, FIELD_LABEL,
} from '@/components/platform';

interface ContentRequest {
  id: string;
  user_id: string;
  request_type: 'blog' | 'social_post' | 'ad_copy' | 'website_section';
  title: string;
  description: string | null;
  reference_urls: string[] | null;
  reference_files: string[] | null;
  status: 'pending' | 'in_progress' | 'delivered';
  assigned_to: string | null;
  admin_notes: string | null;
  delivered_content: string | null;
  delivered_files: string[] | null;
  created_at: string;
  updated_at: string;
  scheduled_date: string | null;
  priority: 'low' | 'normal' | 'high' | 'urgent' | null;
}

const REQUEST_TYPES = [
  { value: 'blog', label: 'Blog post' },
  { value: 'social_post', label: 'Social post' },
  { value: 'ad_copy', label: 'Ad copy' },
  { value: 'website_section', label: 'Website section' },
];

const STATUS_TABS = [
  { key: 'all', label: 'All' },
  { key: 'pending', label: 'Pending' },
  { key: 'in_progress', label: 'In progress' },
  { key: 'delivered', label: 'Delivered' },
] as const;

/**
 * Bulk upload queue. Every file is tracked individually - queued,
 * uploading, done or failed - and a failed file is NEVER dropped
 * silently: the request will not send while any file is unresolved.
 * (The old uploader skipped failures with `continue`, which is how a
 * 43-photo drop could arrive with photos missing.)
 */
interface QueuedFile {
  id: string;
  file: File;
  preview: string | null;
  status: 'queued' | 'uploading' | 'done' | 'failed';
  url?: string;
  error?: string;
}

const UPLOAD_CONCURRENCY = 4;

export default function LoungeContentRequests() {
  const { user } = useAuth();
  const [requests, setRequests] = useState<ContentRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [queue, setQueue] = useState<QueuedFile[]>([]);
  const [dragOver, setDragOver] = useState(false);
  const queueRef = useRef<QueuedFile[]>([]);
  queueRef.current = queue;
  const [tab, setTab] = useState<(typeof STATUS_TABS)[number]['key']>('all');
  const [formData, setFormData] = useState({
    request_type: '' as string,
    title: '',
    description: '',
    reference_urls: [''],
    scheduled_date: null as Date | null,
    priority: 'normal' as string,
  });

  useEffect(() => {
    if (user) {
      fetchRequests();
    }
  }, [user]);

  const fetchRequests = async () => {
    try {
      const { data, error } = await supabase
        .from('content_requests')
        .select('*')
        .eq('user_id', user?.id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setRequests((data as ContentRequest[]) || []);
    } catch (error) {
      console.error('Error fetching requests:', error);
      toast.error('Your content requests did not load. Refresh to try again.');
    } finally {
      setLoading(false);
    }
  };

  const addFiles = useCallback((files: FileList | File[]) => {
    const arr = Array.from(files);
    if (!arr.length) return;
    setQueue(prev => {
      const seen = new Set(prev.map(f => `${f.file.name}:${f.file.size}`));
      const next = arr
        .filter(f => !seen.has(`${f.name}:${f.size}`))
        .map((file, i) => ({
          id: `f-${Date.now().toString(36)}-${i}-${Math.random().toString(36).slice(2, 6)}`,
          file,
          preview: file.type.startsWith('image/') ? URL.createObjectURL(file) : null,
          status: 'queued' as const,
        }));
      return [...prev, ...next];
    });
  }, []);

  const removeFile = (id: string) => {
    setQueue(prev => {
      const target = prev.find(f => f.id === id);
      if (target?.preview) URL.revokeObjectURL(target.preview);
      return prev.filter(f => f.id !== id);
    });
  };

  const resetQueue = useCallback(() => {
    queueRef.current.forEach(f => { if (f.preview) URL.revokeObjectURL(f.preview); });
    setQueue([]);
  }, []);

  const patchFile = (id: string, patch: Partial<QueuedFile>) => {
    setQueue(prev => prev.map(f => (f.id === id ? { ...f, ...patch } : f)));
  };

  const addUrlField = () => {
    setFormData(prev => ({
      ...prev,
      reference_urls: [...prev.reference_urls, ''],
    }));
  };

  const updateUrl = (index: number, value: string) => {
    setFormData(prev => ({
      ...prev,
      reference_urls: prev.reference_urls.map((url, i) => (i === index ? value : url)),
    }));
  };

  const removeUrl = (index: number) => {
    setFormData(prev => ({
      ...prev,
      reference_urls: prev.reference_urls.filter((_, i) => i !== index),
    }));
  };

  /**
   * Upload every unresolved file with a small worker pool. Each file is
   * marked done or failed individually; the same storage path and call
   * shape as before, just never a silent skip.
   */
  const uploadPending = async (): Promise<{ done: number; failed: number }> => {
    const items = queueRef.current.filter(f => f.status === 'queued' || f.status === 'failed');
    let cursor = 0;
    let failed = 0;
    const workers = Array.from({ length: Math.min(UPLOAD_CONCURRENCY, items.length) }, async () => {
      while (cursor < items.length) {
        const item = items[cursor++];
        patchFile(item.id, { status: 'uploading', error: undefined });
        const fileExt = item.file.name.split('.').pop();
        const fileName = `${user?.id}/${Date.now()}-${Math.random().toString(36).substring(7)}.${fileExt}`;
        const { error: uploadError } = await supabase.storage
          .from('content-requests')
          .upload(fileName, item.file);
        if (uploadError) {
          failed += 1;
          patchFile(item.id, { status: 'failed', error: uploadError.message });
        } else {
          const { data: { publicUrl } } = supabase.storage
            .from('content-requests')
            .getPublicUrl(fileName);
          patchFile(item.id, { status: 'done', url: publicUrl });
        }
      }
    });
    await Promise.all(workers);
    return { done: items.length - failed, failed };
  };

  const handleSubmit = async () => {
    if (!formData.request_type || !formData.title.trim()) {
      toast.error('Choose a content type and add a title');
      return;
    }

    setSubmitting(true);
    try {
      const pendingCount = queue.filter(f => f.status === 'queued' || f.status === 'failed').length;
      if (pendingCount > 0) {
        setUploading(true);
        const { failed } = await uploadPending();
        setUploading(false);
        if (failed > 0) {
          // Nothing is lost silently: the request holds until every file
          // is either uploaded or removed by hand.
          toast.error(`${failed} of ${pendingCount} files did not upload. Retry the failed files or remove them, then send again.`);
          setSubmitting(false);
          return;
        }
      }

      const fileUrls = queueRef.current.filter(f => f.status === 'done' && f.url).map(f => f.url!) ;
      const validUrls = formData.reference_urls.filter(url => url.trim() !== '');

      const { error } = await supabase.from('content_requests').insert({
        user_id: user?.id,
        request_type: formData.request_type,
        title: formData.title.trim(),
        description: formData.description.trim() || null,
        reference_urls: validUrls.length > 0 ? validUrls : null,
        reference_files: fileUrls.length > 0 ? fileUrls : null,
        scheduled_date: formData.scheduled_date ? format(formData.scheduled_date, 'yyyy-MM-dd') : null,
        priority: formData.priority,
      });

      if (error) throw error;

      toast.success(
        fileUrls.length > 0
          ? `Content request sent with all ${fileUrls.length} ${fileUrls.length === 1 ? 'file' : 'files'} attached`
          : 'Content request sent to the studio',
      );
      setDialogOpen(false);
      setFormData({ request_type: '', title: '', description: '', reference_urls: [''], scheduled_date: null, priority: 'normal' });
      resetQueue();
      fetchRequests();
    } catch (error) {
      console.error('Error submitting request:', error);
      toast.error('Your request did not send. Try again.');
    } finally {
      setSubmitting(false);
      setUploading(false);
    }
  };

  const getRequestsByStatus = (status: string) => {
    return requests.filter(r => r.status === status);
  };

  const getTypeInfo = (type: string) => {
    return REQUEST_TYPES.find(t => t.value === type) || REQUEST_TYPES[0];
  };

  if (loading) {
    return (
      <div className="mx-auto max-w-[1024px] px-5 py-7 lg:px-8" aria-hidden>
        <span className="block h-5 w-44 animate-pulse rounded bg-foreground/[0.06]" />
        <span className="mt-2 block h-3.5 w-72 animate-pulse rounded bg-foreground/[0.05]" />
        <div className="mt-6 rounded-[10px] border border-border/60">
          <SkeletonLedger rows={5} />
        </div>
      </div>
    );
  }

  const visible = tab === 'all' ? requests : getRequestsByStatus(tab);

  return (
    <div className="mx-auto max-w-[1024px] px-5 py-7 lg:px-8">
      <PageHeader
        kicker="Client portal"
        title="Content requests"
        description="Ask the studio for new content and follow each piece to delivery"
        actions={
          <Button className="h-8 gap-1.5 rounded-lg px-3 text-xs" onClick={() => setDialogOpen(true)}>
            <Plus className="h-3.5 w-3.5" />
            New request
          </Button>
        }
      />

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-h-[90vh] w-[95vw] max-w-lg overflow-y-auto">
          <DialogHeader>
            <DialogTitle>New content request</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 pt-4">
            <div className="space-y-1.5">
              <Label className={FIELD_LABEL}>Content type</Label>
              <Select
                value={formData.request_type}
                onValueChange={(value) => setFormData(prev => ({ ...prev, request_type: value }))}
              >
                <SelectTrigger className={FIELD}>
                  <SelectValue placeholder="Choose a content type" />
                </SelectTrigger>
                <SelectContent>
                  {REQUEST_TYPES.map(type => (
                    <SelectItem key={type.value} value={type.value}>
                      {type.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-1.5">
              <Label className={FIELD_LABEL}>Title</Label>
              <Input
                className={FIELD}
                placeholder="A short title for your request"
                value={formData.title}
                onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
              />
            </div>

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div className="space-y-1.5">
                <Label className={FIELD_LABEL}>Scheduled date</Label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button variant="outline" className={cn('w-full justify-start text-left font-normal', FIELD, !formData.scheduled_date && 'text-muted-foreground')}>
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {formData.scheduled_date ? format(formData.scheduled_date, 'PPP') : 'Pick a date'}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start">
                    <Calendar
                      mode="single"
                      selected={formData.scheduled_date || undefined}
                      onSelect={(date) => setFormData(prev => ({ ...prev, scheduled_date: date || null }))}
                      initialFocus
                      className="p-3 pointer-events-auto"
                    />
                  </PopoverContent>
                </Popover>
              </div>

              <div className="space-y-1.5">
                <Label className={FIELD_LABEL}>Priority</Label>
                <Select
                  value={formData.priority}
                  onValueChange={(value) => setFormData(prev => ({ ...prev, priority: value }))}
                >
                  <SelectTrigger className={FIELD}>
                    <SelectValue placeholder="Choose a priority" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="low">Low</SelectItem>
                    <SelectItem value="normal">Normal</SelectItem>
                    <SelectItem value="high">High</SelectItem>
                    <SelectItem value="urgent">Urgent</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-1.5">
              <Label className={FIELD_LABEL}>Description</Label>
              <Textarea
                placeholder="Describe what you need in detail"
                value={formData.description}
                onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                className="min-h-[100px] rounded-xl border-border/60 bg-foreground/[0.03] text-[14px] shadow-none focus-visible:border-primary/60 focus-visible:ring-1 focus-visible:ring-primary/30 dark:bg-foreground/[0.05]"
              />
            </div>

            <div className="space-y-1.5">
              <Label className={FIELD_LABEL}>Reference URLs</Label>
              <div className="space-y-2">
                {formData.reference_urls.map((url, index) => (
                  <div key={index} className="flex gap-2">
                    <Input
                      className={FIELD}
                      placeholder="https://example.com/inspiration"
                      value={url}
                      onChange={(e) => updateUrl(index, e.target.value)}
                    />
                    {formData.reference_urls.length > 1 && (
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        onClick={() => removeUrl(index)}
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    )}
                  </div>
                ))}
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={addUrlField}
                  className="h-8 gap-1.5 rounded-lg px-3 text-xs"
                >
                  <Plus className="h-3 w-3" />
                  Add URL
                </Button>
              </div>
            </div>

            <div className="space-y-1.5">
              <Label className={FIELD_LABEL}>Reference files</Label>
              <div
                role="button"
                tabIndex={0}
                aria-label="Add reference files"
                className={cn(
                  'cursor-pointer rounded-[10px] border border-dashed p-4 text-center transition-colors duration-150',
                  dragOver
                    ? 'border-primary/60 bg-primary/[0.04]'
                    : 'border-border hover:border-primary/50 hover:bg-foreground/[0.02]',
                )}
                onClick={() => document.getElementById('reference-upload')?.click()}
                onKeyDown={(e) => (e.key === 'Enter' || e.key === ' ') && document.getElementById('reference-upload')?.click()}
                onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
                onDragLeave={() => setDragOver(false)}
                onDrop={(e) => {
                  e.preventDefault();
                  setDragOver(false);
                  if (e.dataTransfer.files?.length) addFiles(e.dataTransfer.files);
                }}
              >
                <input
                  id="reference-upload"
                  type="file"
                  multiple
                  className="hidden"
                  onChange={(e) => { if (e.target.files) addFiles(e.target.files); e.target.value = ''; }}
                  accept="image/*,.pdf,.doc,.docx"
                />
                <Upload className="mx-auto mb-2 h-5 w-5 text-muted-foreground" />
                <p className="text-sm text-muted-foreground">
                  Drop photos and files here, or tap to browse
                </p>
                <p className="mt-1 text-xs text-muted-foreground">
                  Add as many as you need in one go. Every file shows its own upload status.
                </p>
              </div>

              {queue.length > 0 && (
                <div className="mt-2 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="font-mono text-[10px] uppercase tracking-[0.14em] text-muted-foreground">
                      {queue.length} {queue.length === 1 ? 'file' : 'files'}
                      {queue.some(f => f.status === 'done') && ` · ${queue.filter(f => f.status === 'done').length} uploaded`}
                      {queue.some(f => f.status === 'failed') && (
                        <span className="text-risk"> · {queue.filter(f => f.status === 'failed').length} failed</span>
                      )}
                    </span>
                    {queue.some(f => f.status === 'failed') && !uploading && (
                      <button
                        type="button"
                        onClick={async () => { setUploading(true); await uploadPending(); setUploading(false); }}
                        className="inline-flex items-center gap-1 text-xs text-muted-foreground transition-colors hover:text-foreground"
                      >
                        <RotateCcw className="h-3 w-3" /> Retry failed
                      </button>
                    )}
                  </div>

                  {/* Photos as a compact grid; other files as rows */}
                  {queue.some(f => f.preview) && (
                    <div className="grid grid-cols-5 gap-1.5 sm:grid-cols-6">
                      {queue.filter(f => f.preview).map(f => (
                        <div key={f.id} className="group relative aspect-square overflow-hidden rounded-lg border border-border/60">
                          <img src={f.preview!} alt={f.file.name} className="h-full w-full object-cover" />
                          {f.status === 'uploading' && (
                            <span className="absolute inset-0 flex items-center justify-center bg-black/45">
                              <Loader2 className="h-4 w-4 animate-spin text-white" />
                            </span>
                          )}
                          {f.status === 'done' && (
                            <span className="absolute bottom-1 right-1 flex h-4 w-4 items-center justify-center rounded-full bg-ok text-white">
                              <Check className="h-2.5 w-2.5" />
                            </span>
                          )}
                          {f.status === 'failed' && (
                            <span className="absolute inset-0 flex items-center justify-center bg-risk/60" title={f.error}>
                              <X className="h-4 w-4 text-white" />
                            </span>
                          )}
                          {f.status !== 'uploading' && (
                            <button
                              type="button"
                              aria-label={`Remove ${f.file.name}`}
                              onClick={() => removeFile(f.id)}
                              className="absolute right-1 top-1 hidden h-5 w-5 items-center justify-center rounded-full bg-black/60 text-white group-hover:flex"
                            >
                              <X className="h-3 w-3" />
                            </button>
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                  {queue.filter(f => !f.preview).map(f => (
                    <div key={f.id} className="flex items-center justify-between rounded-lg border border-border/60 bg-foreground/[0.02] p-2">
                      <div className="flex min-w-0 items-center gap-2">
                        {f.status === 'uploading' ? (
                          <Loader2 className="h-4 w-4 flex-shrink-0 animate-spin text-muted-foreground" />
                        ) : f.status === 'done' ? (
                          <Check className="h-4 w-4 flex-shrink-0 text-ok" />
                        ) : f.status === 'failed' ? (
                          <X className="h-4 w-4 flex-shrink-0 text-risk" />
                        ) : (
                          <FileImage className="h-4 w-4 flex-shrink-0 text-muted-foreground" />
                        )}
                        <span className="truncate text-sm">{f.file.name}</span>
                        {f.status === 'failed' && f.error && (
                          <span className="truncate text-[11px] text-risk">{f.error}</span>
                        )}
                      </div>
                      {f.status !== 'uploading' && (
                        <Button type="button" variant="ghost" size="icon" className="h-6 w-6" onClick={() => removeFile(f.id)}>
                          <X className="h-3 w-3" />
                        </Button>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="flex justify-end gap-2 pt-4">
              <Button variant="outline" className="h-8 rounded-lg px-3 text-xs" onClick={() => setDialogOpen(false)}>
                Cancel
              </Button>
              <Button className="h-8 rounded-lg px-3 text-xs" onClick={handleSubmit} disabled={submitting}>
                {uploading ? (
                  <>
                    <Loader2 className="mr-1.5 h-3.5 w-3.5 animate-spin" />
                    Uploading {queue.filter(f => f.status === 'done').length}/{queue.length}
                  </>
                ) : submitting ? (
                  <>
                    <Loader2 className="mr-1.5 h-3.5 w-3.5 animate-spin" />
                    Sending
                  </>
                ) : (
                  'Send request'
                )}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Status filter */}
      <div className="mt-5 flex items-center gap-1 border-b border-border/60">
        {STATUS_TABS.map(t => {
          const count = t.key === 'all' ? requests.length : getRequestsByStatus(t.key).length;
          return (
            <button
              key={t.key}
              onClick={() => setTab(t.key)}
              className={cn(
                'relative -mb-px border-b-2 px-3 py-2 text-[13px] transition-colors duration-150',
                tab === t.key
                  ? 'border-primary font-medium text-foreground'
                  : 'border-transparent text-muted-foreground hover:text-foreground',
              )}
            >
              {t.label}
              <span className="ml-1.5 font-mono text-[10.5px] tabular-nums text-muted-foreground">{count}</span>
            </button>
          );
        })}
      </div>

      <div className="pt-5">
        {visible.length === 0 ? (
          <Panel>
            <EmptyState
              title={tab === 'all' ? 'No requests yet' : 'Nothing here'}
              body={
                tab === 'all'
                  ? 'Ask the studio for a blog post, social content, ad copy or a new website section.'
                  : 'No requests match this filter right now.'
              }
              action={tab === 'all' ? { label: 'New request', onClick: () => setDialogOpen(true) } : undefined}
            />
          </Panel>
        ) : (
          <Panel>
            <PanelHeader label={`${visible.length} ${visible.length === 1 ? 'request' : 'requests'}`} />
            <div>
              {visible.map((request) => {
                const typeInfo = getTypeInfo(request.request_type);
                return (
                  <div key={request.id} className="border-t border-border/60 px-4 py-3 first:border-t-0">
                    <div className="flex items-start justify-between gap-4">
                      <div className="min-w-0">
                        <p className="truncate text-[13px] font-[550] text-foreground">{request.title}</p>
                        <p className="mt-0.5 flex flex-wrap items-center gap-x-2 text-[11.5px] text-muted-foreground">
                          <span>{typeInfo.label}</span>
                          <span aria-hidden>·</span>
                          <span className="font-mono text-[10.5px] tabular-nums">
                            {format(new Date(request.created_at), 'd MMM yyyy')}
                          </span>
                        </p>
                      </div>
                      <StatusBadge status={request.status} className="shrink-0" />
                    </div>

                    {request.description && (
                      <p className="mt-2 text-[13px] leading-relaxed text-muted-foreground">{request.description}</p>
                    )}

                    {request.reference_urls && request.reference_urls.length > 0 && (
                      <div className="mt-2 flex flex-wrap items-center gap-x-3 gap-y-1">
                        <span className="font-mono text-[10px] uppercase tracking-[0.14em] text-muted-foreground">References</span>
                        {request.reference_urls.map((url, i) => (
                          <a
                            key={i}
                            href={url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-1 text-xs text-muted-foreground underline decoration-border underline-offset-2 transition-colors duration-150 hover:text-foreground"
                          >
                            <LinkIcon className="h-3 w-3" />
                            Link {i + 1}
                            <ExternalLink className="h-2.5 w-2.5" />
                          </a>
                        ))}
                      </div>
                    )}

                    {request.reference_files && request.reference_files.length > 0 && (
                      <div className="mt-2 flex flex-wrap items-center gap-x-3 gap-y-1">
                        <span className="font-mono text-[10px] uppercase tracking-[0.14em] text-muted-foreground">Attached</span>
                        {request.reference_files.map((file, i) => (
                          <a
                            key={i}
                            href={file}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-1 text-xs text-muted-foreground underline decoration-border underline-offset-2 transition-colors duration-150 hover:text-foreground"
                          >
                            <FileImage className="h-3 w-3" />
                            File {i + 1}
                            <ExternalLink className="h-2.5 w-2.5" />
                          </a>
                        ))}
                      </div>
                    )}

                    {request.assigned_to && (
                      <p className="mt-2 text-xs text-muted-foreground">
                        Assigned to <span className="font-medium text-foreground">{request.assigned_to}</span>
                      </p>
                    )}

                    {request.status === 'delivered' && (
                      <div className="mt-3 rounded-lg border border-border/60 bg-foreground/[0.02] p-3">
                        <StatusBadge tone="ok" label="Content delivered" />
                        {request.delivered_content && (
                          <p className="mt-2 text-[13px] leading-relaxed text-muted-foreground">{request.delivered_content}</p>
                        )}
                        {request.delivered_files && request.delivered_files.length > 0 && (
                          <div className="mt-2 flex flex-wrap gap-3">
                            {request.delivered_files.map((file, i) => (
                              <a
                                key={i}
                                href={file}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="inline-flex items-center gap-1 text-xs text-muted-foreground underline decoration-border underline-offset-2 transition-colors duration-150 hover:text-foreground"
                              >
                                <FileImage className="h-3 w-3" />
                                Download {i + 1}
                                <ExternalLink className="h-2.5 w-2.5" />
                              </a>
                            ))}
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </Panel>
        )}
      </div>
    </div>
  );
}
