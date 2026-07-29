import { useState, useEffect } from 'react';
import { FileText, Loader2, Upload, X, FileImage, Link as LinkIcon, ExternalLink, Trash2, Smartphone, Megaphone, Globe, type LucideIcon } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ScrollArea } from '@/components/ui/scroll-area';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';
import { format } from 'date-fns';
import {
  Panel, DataTable, StatusBadge, StatusDot, AvatarID, SkeletonBlock, SkeletonTable,
  type Column, type Tone,
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

/* Priorities and statuses on the platform tone vocabulary — the emoji
   and hue maps are gone. */
const PRIORITY_CONFIG: Record<string, { label: string; tone: Tone }> = {
  low: { label: 'Low', tone: 'neutral' },
  normal: { label: 'Normal', tone: 'neutral' },
  high: { label: 'High', tone: 'attend' },
  urgent: { label: 'Urgent', tone: 'risk' },
};

interface Profile {
  user_id: string;
  full_name: string | null;
  email: string | null;
  customer_id: string | null;
  company: string | null;
}

const REQUEST_TYPES: { value: string; label: string; icon: LucideIcon }[] = [
  { value: 'blog', label: 'Blog post', icon: FileText },
  { value: 'social_post', label: 'Social post', icon: Smartphone },
  { value: 'ad_copy', label: 'Ad copy', icon: Megaphone },
  { value: 'website_section', label: 'Website section', icon: Globe },
];

const STATUS_CONFIG: Record<string, { label: string; tone: Tone }> = {
  pending: { label: 'Pending', tone: 'attend' },
  in_progress: { label: 'In progress', tone: 'accent' },
  delivered: { label: 'Delivered', tone: 'ok' },
};

export default function AdminContentRequests() {
  const [requests, setRequests] = useState<ContentRequest[]>([]);
  const [profiles, setProfiles] = useState<Profile[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedRequest, setSelectedRequest] = useState<ContentRequest | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [requestToDelete, setRequestToDelete] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [formData, setFormData] = useState({
    status: 'pending' as string,
    assigned_to: '',
    admin_notes: '',
    delivered_content: '',
  });

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const [requestsRes, profilesRes] = await Promise.all([
        supabase.from('content_requests').select('*').order('created_at', { ascending: false }),
        supabase.from('profiles').select('user_id, full_name, email, customer_id, company'),
      ]);

      if (requestsRes.error) throw requestsRes.error;
      if (profilesRes.error) throw profilesRes.error;

      setRequests((requestsRes.data as ContentRequest[]) || []);
      setProfiles(profilesRes.data || []);
    } catch (error) {
      console.error('Error fetching data:', error);
      toast.error('Failed to load content requests');
    } finally {
      setLoading(false);
    }
  };

  const getClientInfo = (userId: string) => {
    return profiles.find(p => p.user_id === userId);
  };

  const getTypeInfo = (type: string) => {
    return REQUEST_TYPES.find(t => t.value === type) || REQUEST_TYPES[0];
  };

  const handleOpenDialog = (request: ContentRequest) => {
    setSelectedRequest(request);
    setFormData({
      status: request.status,
      assigned_to: request.assigned_to || '',
      admin_notes: request.admin_notes || '',
      delivered_content: request.delivered_content || '',
    });
    setSelectedFiles([]);
    setDialogOpen(true);
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

  const uploadFiles = async (): Promise<string[]> => {
    const uploadedUrls: string[] = [];

    for (const file of selectedFiles) {
      const fileExt = file.name.split('.').pop();
      const fileName = `delivered/${selectedRequest?.id}/${Date.now()}-${Math.random().toString(36).substring(7)}.${fileExt}`;

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

  const handleSave = async () => {
    if (!selectedRequest) return;

    setSaving(true);
    try {
      let deliveredFiles = selectedRequest.delivered_files || [];

      if (selectedFiles.length > 0) {
        setUploading(true);
        const newFiles = await uploadFiles();
        deliveredFiles = [...deliveredFiles, ...newFiles];
        setUploading(false);
      }

      const { error } = await supabase
        .from('content_requests')
        .update({
          status: formData.status,
          assigned_to: formData.assigned_to || null,
          admin_notes: formData.admin_notes || null,
          delivered_content: formData.delivered_content || null,
          delivered_files: deliveredFiles.length > 0 ? deliveredFiles : null,
        })
        .eq('id', selectedRequest.id);

      if (error) throw error;

      toast.success('Request updated successfully');
      setDialogOpen(false);
      fetchData();
    } catch (error) {
      console.error('Error updating request:', error);
      toast.error('Failed to update request');
    } finally {
      setSaving(false);
      setUploading(false);
    }
  };

  const handleDelete = async () => {
    if (!requestToDelete) return;

    try {
      const { error } = await supabase
        .from('content_requests')
        .delete()
        .eq('id', requestToDelete);

      if (error) throw error;

      toast.success('Request deleted successfully');
      setDeleteDialogOpen(false);
      setRequestToDelete(null);
      fetchData();
    } catch (error) {
      console.error('Error deleting request:', error);
      toast.error('Failed to delete request');
    }
  };

  const getRequestsByStatus = (status: string) => {
    return requests.filter(r => r.status === status);
  };

  const columns: Column<ContentRequest>[] = [
    {
      key: 'client',
      header: 'Client',
      sortValue: (r) => (getClientInfo(r.user_id)?.full_name || '').toLowerCase(),
      render: (request) => {
        const client = getClientInfo(request.user_id);
        return (
          <div className="flex items-center gap-2 py-1">
            <AvatarID name={client?.full_name} email={client?.email} size="md" />
            <div className="min-w-0">
              <p className="truncate text-[13px] font-medium">{client?.full_name || 'Unknown'}</p>
              <p className="truncate font-mono text-[10px] tabular-nums text-muted-foreground">{client?.customer_id || client?.email}</p>
            </div>
          </div>
        );
      },
    },
    {
      key: 'type',
      header: 'Type',
      hideBelowMd: true,
      sortValue: (r) => r.request_type,
      render: (request) => {
        const typeInfo = getTypeInfo(request.request_type);
        const TypeIcon = typeInfo.icon;
        return (
          <Badge variant="outline" className="gap-1 border-border/60 font-normal text-ink-2">
            <TypeIcon className="h-3 w-3 text-muted-foreground" aria-hidden />
            <span className="hidden sm:inline">{typeInfo.label}</span>
          </Badge>
        );
      },
    },
    {
      key: 'title',
      header: 'Title',
      sortValue: (r) => r.title.toLowerCase(),
      render: (request) => (
        <div className="min-w-0">
          <p className="max-w-[200px] truncate text-[13px] font-medium">{request.title}</p>
          {request.description && (
            <p className="max-w-[200px] truncate text-[11px] text-muted-foreground">{request.description}</p>
          )}
        </div>
      ),
    },
    {
      key: 'priority',
      header: 'Priority',
      hideBelowMd: true,
      sortValue: (r) => r.priority || 'normal',
      render: (request) => {
        const priorityConfig = PRIORITY_CONFIG[request.priority || 'normal'];
        return <StatusBadge tone={priorityConfig.tone} label={priorityConfig.label} />;
      },
    },
    {
      key: 'status',
      header: 'Status',
      sortValue: (r) => r.status,
      render: (request) => {
        const sc = STATUS_CONFIG[request.status];
        return <StatusBadge tone={sc.tone} label={sc.label} />;
      },
    },
    {
      key: 'scheduled',
      header: 'Scheduled',
      hideBelowMd: true,
      mono: true,
      sortValue: (r) => r.scheduled_date || '',
      render: (request) => (
        <span className="text-muted-foreground">
          {request.scheduled_date ? format(new Date(request.scheduled_date), 'd MMM yyyy') : '·'}
        </span>
      ),
    },
    {
      key: 'actions',
      header: '',
      align: 'right',
      render: (request) => (
        <div className="flex items-center justify-end gap-1">
          <Button
            variant="outline"
            size="sm"
            className="h-7 rounded-md border-border/60 px-2.5 text-xs"
            onClick={() => handleOpenDialog(request)}
          >
            Manage
          </Button>
          <Button
            variant="ghost"
            size="icon"
            className="h-7 w-7 text-risk hover:text-risk"
            aria-label="Delete request"
            onClick={() => {
              setRequestToDelete(request.id);
              setDeleteDialogOpen(true);
            }}
          >
            <Trash2 className="h-3.5 w-3.5" />
          </Button>
        </div>
      ),
    },
  ];

  if (loading) {
    return (
      <div className="space-y-4" aria-busy>
        <div className="grid grid-cols-2 gap-3 md:grid-cols-3">
          {[1, 2, 3].map(i => (
            <SkeletonBlock key={i} className="h-[64px] rounded-[10px]" />
          ))}
        </div>
        <Panel>
          <SkeletonTable cols={5} rows={6} />
        </Panel>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Status Summary */}
      <div className="grid grid-cols-2 gap-3 md:grid-cols-3">
        {Object.entries(STATUS_CONFIG).map(([status, config]) => {
          const count = getRequestsByStatus(status).length;
          return (
            <Panel key={status} className="p-3">
              <div className="flex items-center gap-1.5">
                <StatusDot tone={config.tone} />
                <p className="font-mono text-[10px] font-medium uppercase tracking-[0.14em] text-muted-foreground">{config.label}</p>
              </div>
              <p className="mt-1 text-[18px] font-semibold tabular-nums tracking-[-0.01em]">{count}</p>
            </Panel>
          );
        })}
      </div>

      {/* Requests Table */}
      <Tabs defaultValue="all" className="space-y-3">
        <TabsList className="h-9 w-max overflow-x-auto rounded-lg border border-border/60 bg-sunken p-0.5">
          <TabsTrigger value="all" className="h-8 rounded-md text-xs tabular-nums data-[state=active]:bg-card">All ({requests.length})</TabsTrigger>
          <TabsTrigger value="pending" className="h-8 rounded-md text-xs tabular-nums data-[state=active]:bg-card">Pending ({getRequestsByStatus('pending').length})</TabsTrigger>
          <TabsTrigger value="in_progress" className="h-8 rounded-md text-xs tabular-nums data-[state=active]:bg-card">In progress ({getRequestsByStatus('in_progress').length})</TabsTrigger>
          <TabsTrigger value="delivered" className="h-8 rounded-md text-xs tabular-nums data-[state=active]:bg-card">Delivered ({getRequestsByStatus('delivered').length})</TabsTrigger>
        </TabsList>

        {['all', 'pending', 'in_progress', 'delivered'].map(tab => (
          <TabsContent key={tab} value={tab}>
            <Panel className="overflow-hidden">
              <ScrollArea className="max-h-[500px]">
                <DataTable
                  rows={tab === 'all' ? requests : getRequestsByStatus(tab)}
                  columns={columns}
                  rowKey={(r) => r.id}
                  aria-label="Content requests"
                  empty={{
                    title: 'No requests found',
                    body: tab === 'all'
                      ? 'No content requests yet.'
                      : `No ${STATUS_CONFIG[tab as keyof typeof STATUS_CONFIG]?.label.toLowerCase()} requests.`,
                  }}
                  mobileCard={(request) => {
                    const client = getClientInfo(request.user_id);
                    const sc = STATUS_CONFIG[request.status];
                    return (
                      <button
                        type="button"
                        onClick={() => handleOpenDialog(request)}
                        className="flex w-full items-center gap-3 px-3 py-3 text-left transition-colors duration-150 active:bg-foreground/[0.04]"
                      >
                        <AvatarID name={client?.full_name} email={client?.email} size="lg" />
                        <div className="min-w-0 flex-1">
                          <p className="truncate text-[13px] font-medium">{request.title}</p>
                          <p className="truncate text-[11px] text-muted-foreground">{client?.full_name || 'Unknown'}</p>
                        </div>
                        <StatusBadge tone={sc.tone} label={sc.label} className="shrink-0 text-[10.5px]" />
                      </button>
                    );
                  }}
                />
              </ScrollArea>
            </Panel>
          </TabsContent>
        ))}
      </Tabs>

      {/* Edit Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-h-[90vh] w-[95vw] overflow-y-auto rounded-xl border-border/60 bg-card sm:max-w-2xl">
          <DialogHeader>
            <DialogTitle className="text-[15px] font-semibold tracking-[-0.01em]">Manage content request</DialogTitle>
          </DialogHeader>
          {selectedRequest && (
            <div className="space-y-5 pt-4">
              {/* Request Details */}
              <Card className="rounded-[10px] border-border/60 shadow-none">
                <CardHeader className="px-4 pb-3 pt-4">
                  <div className="flex items-start gap-3">
                    {(() => {
                      const TypeIcon = getTypeInfo(selectedRequest.request_type).icon;
                      return (
                        <span className="rounded-lg bg-sunken p-2">
                          <TypeIcon className="h-4 w-4 text-muted-foreground" aria-hidden />
                        </span>
                      );
                    })()}
                    <div>
                      <CardTitle className="text-[15px] font-semibold tracking-[-0.01em]">{selectedRequest.title}</CardTitle>
                      <CardDescription className="text-[12px]">
                        {getTypeInfo(selectedRequest.request_type).label} · <span className="font-mono tabular-nums">{format(new Date(selectedRequest.created_at), 'd MMM yyyy')}</span>
                      </CardDescription>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="space-y-3 px-4 pb-4">
                  {selectedRequest.description && (
                    <div>
                      <p className="mb-1 font-mono text-[9px] font-medium uppercase tracking-[0.1em] text-muted-foreground">Description</p>
                      <p className="text-[13px]">{selectedRequest.description}</p>
                    </div>
                  )}

                  {selectedRequest.reference_urls && selectedRequest.reference_urls.length > 0 && (
                    <div>
                      <p className="mb-1 font-mono text-[9px] font-medium uppercase tracking-[0.1em] text-muted-foreground">Reference URLs</p>
                      <div className="flex flex-wrap gap-2">
                        {selectedRequest.reference_urls.map((url, i) => (
                          <a
                            key={i}
                            href={url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-1 text-xs text-primary hover:underline"
                          >
                            <LinkIcon className="h-3 w-3" />
                            {url}
                            <ExternalLink className="h-2.5 w-2.5" />
                          </a>
                        ))}
                      </div>
                    </div>
                  )}

                  {selectedRequest.reference_files && selectedRequest.reference_files.length > 0 && (
                    <div>
                      <p className="mb-1 font-mono text-[9px] font-medium uppercase tracking-[0.1em] text-muted-foreground">Reference files</p>
                      <div className="flex flex-wrap gap-2">
                        {selectedRequest.reference_files.map((file, i) => (
                          <a
                            key={i}
                            href={file}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-1 text-xs text-primary hover:underline"
                          >
                            <FileImage className="h-3 w-3" />
                            File {i + 1}
                            <ExternalLink className="h-2.5 w-2.5" />
                          </a>
                        ))}
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Admin Controls */}
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label className="font-mono text-[10px] font-medium uppercase tracking-[0.14em] text-muted-foreground">Status</Label>
                  <Select
                    value={formData.status}
                    onValueChange={(value) => setFormData(prev => ({ ...prev, status: value }))}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {Object.entries(STATUS_CONFIG).map(([value, config]) => (
                        <SelectItem key={value} value={value}>
                          {config.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label className="font-mono text-[10px] font-medium uppercase tracking-[0.14em] text-muted-foreground">Assigned to</Label>
                  <Input
                    placeholder="Team member name"
                    value={formData.assigned_to}
                    onChange={(e) => setFormData(prev => ({ ...prev, assigned_to: e.target.value }))}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label className="font-mono text-[10px] font-medium uppercase tracking-[0.14em] text-muted-foreground">Admin notes (internal)</Label>
                <Textarea
                  placeholder="Internal notes for the team…"
                  value={formData.admin_notes}
                  onChange={(e) => setFormData(prev => ({ ...prev, admin_notes: e.target.value }))}
                />
              </div>

              <div className="space-y-2">
                <Label className="font-mono text-[10px] font-medium uppercase tracking-[0.14em] text-muted-foreground">Delivered content (visible to client)</Label>
                <Textarea
                  placeholder="Message to send with the delivered content…"
                  value={formData.delivered_content}
                  onChange={(e) => setFormData(prev => ({ ...prev, delivered_content: e.target.value }))}
                />
              </div>

              <div className="space-y-2">
                <Label className="font-mono text-[10px] font-medium uppercase tracking-[0.14em] text-muted-foreground">Upload delivered files</Label>
                <div
                  className="cursor-pointer rounded-lg border border-dashed border-border p-4 text-center transition-colors duration-150 hover:border-primary/50 hover:bg-foreground/[0.02]"
                  onClick={() => document.getElementById('delivered-upload')?.click()}
                >
                  <input
                    id="delivered-upload"
                    type="file"
                    multiple
                    className="hidden"
                    onChange={handleFileChange}
                  />
                  <Upload className="mx-auto mb-2 h-5 w-5 text-muted-foreground" />
                  <p className="text-[13px] text-muted-foreground">
                    Click to upload delivered files
                  </p>
                </div>

                {/* Existing delivered files */}
                {selectedRequest.delivered_files && selectedRequest.delivered_files.length > 0 && (
                  <div className="space-y-2">
                    <p className="font-mono text-[9px] font-medium uppercase tracking-[0.1em] text-muted-foreground">Previously uploaded</p>
                    {selectedRequest.delivered_files.map((file, index) => (
                      <div key={index} className="flex items-center justify-between rounded-lg border border-border/60 bg-sunken p-2">
                        <a
                          href={file}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex items-center gap-2 truncate text-[13px] text-primary hover:underline"
                        >
                          <FileImage className="h-4 w-4 flex-shrink-0" />
                          <span className="truncate">Delivered file {index + 1}</span>
                          <ExternalLink className="h-3 w-3 flex-shrink-0" />
                        </a>
                      </div>
                    ))}
                  </div>
                )}

                {/* New files to upload */}
                {selectedFiles.length > 0 && (
                  <div className="space-y-2">
                    <p className="font-mono text-[9px] font-medium uppercase tracking-[0.1em] text-muted-foreground">New files to upload</p>
                    {selectedFiles.map((file, index) => (
                      <div key={index} className="flex items-center justify-between rounded-lg border border-border/60 bg-sunken p-2">
                        <div className="flex items-center gap-2 truncate">
                          <FileImage className="h-4 w-4 flex-shrink-0 text-muted-foreground" />
                          <span className="truncate text-[13px]">{file.name}</span>
                        </div>
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          className="h-6 w-6"
                          aria-label="Remove file"
                          onClick={() => removeFile(index)}
                        >
                          <X className="h-3 w-3" />
                        </Button>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <div className="flex justify-end gap-2 border-t border-border/60 pt-4">
                <Button variant="outline" className="h-8 rounded-lg px-3 text-xs" onClick={() => setDialogOpen(false)}>
                  Cancel
                </Button>
                <Button className="h-8 rounded-lg px-3 text-xs" onClick={handleSave} disabled={saving}>
                  {uploading ? (
                    <>
                      <Loader2 className="mr-2 h-3.5 w-3.5 animate-spin" />
                      Uploading
                    </>
                  ) : saving ? (
                    <>
                      <Loader2 className="mr-2 h-3.5 w-3.5 animate-spin" />
                      Saving
                    </>
                  ) : (
                    'Save changes'
                  )}
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent className="max-w-sm rounded-xl border-border/60 bg-card p-5">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-[15px] font-semibold tracking-[-0.01em]">Delete this content request?</AlertDialogTitle>
            <AlertDialogDescription className="text-[13px] leading-relaxed text-muted-foreground">
              This permanently deletes the request and its delivered files for the client. It can't be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="mt-2">
            <AlertDialogCancel className="h-8 rounded-lg px-3 text-xs">Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} className="h-8 rounded-lg bg-destructive px-3 text-xs text-destructive-foreground hover:bg-destructive/90">
              Delete request
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
