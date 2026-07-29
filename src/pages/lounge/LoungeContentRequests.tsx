import { useState, useEffect } from 'react';
import { FileText, Plus, Upload, X, Loader2, FileImage, Link as LinkIcon, ExternalLink, Calendar as CalendarIcon } from 'lucide-react';
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

export default function LoungeContentRequests() {
  const { user } = useAuth();
  const [requests, setRequests] = useState<ContentRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
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

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const newFiles = Array.from(e.target.files);
      setSelectedFiles(prev => [...prev, ...newFiles]);
    }
  };

  const removeFile = (index: number) => {
    setSelectedFiles(prev => prev.filter((_, i) => i !== index));
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

  const uploadFiles = async (): Promise<string[]> => {
    const uploadedUrls: string[] = [];

    for (const file of selectedFiles) {
      const fileExt = file.name.split('.').pop();
      const fileName = `${user?.id}/${Date.now()}-${Math.random().toString(36).substring(7)}.${fileExt}`;

      const { error: uploadError } = await supabase.storage
        .from('content-requests')
        .upload(fileName, file);

      if (uploadError) {
        console.error('Upload error:', uploadError);
        continue;
      }

      const { data: { publicUrl } } = supabase.storage
        .from('content-requests')
        .getPublicUrl(fileName);

      uploadedUrls.push(publicUrl);
    }

    return uploadedUrls;
  };

  const handleSubmit = async () => {
    if (!formData.request_type || !formData.title.trim()) {
      toast.error('Choose a content type and add a title');
      return;
    }

    setSubmitting(true);
    try {
      let fileUrls: string[] = [];

      if (selectedFiles.length > 0) {
        setUploading(true);
        fileUrls = await uploadFiles();
        setUploading(false);
      }

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

      toast.success('Content request sent to the studio');
      setDialogOpen(false);
      setFormData({ request_type: '', title: '', description: '', reference_urls: [''], scheduled_date: null, priority: 'normal' });
      setSelectedFiles([]);
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
                className="cursor-pointer rounded-[10px] border border-dashed border-border p-4 text-center transition-colors duration-150 hover:border-primary/50 hover:bg-foreground/[0.02]"
                onClick={() => document.getElementById('reference-upload')?.click()}
              >
                <input
                  id="reference-upload"
                  type="file"
                  multiple
                  className="hidden"
                  onChange={handleFileChange}
                  accept="image/*,.pdf,.doc,.docx"
                />
                <Upload className="mx-auto mb-2 h-5 w-5 text-muted-foreground" />
                <p className="text-sm text-muted-foreground">
                  Click to upload reference files
                </p>
                <p className="mt-1 text-xs text-muted-foreground">
                  Images, PDFs and documents
                </p>
              </div>
              {selectedFiles.length > 0 && (
                <div className="mt-2 space-y-2">
                  {selectedFiles.map((file, index) => (
                    <div key={index} className="flex items-center justify-between rounded-lg border border-border/60 bg-foreground/[0.02] p-2">
                      <div className="flex items-center gap-2 truncate">
                        <FileImage className="h-4 w-4 flex-shrink-0 text-muted-foreground" />
                        <span className="truncate text-sm">{file.name}</span>
                      </div>
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        className="h-6 w-6"
                        onClick={() => removeFile(index)}
                      >
                        <X className="h-3 w-3" />
                      </Button>
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
                    Uploading
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
