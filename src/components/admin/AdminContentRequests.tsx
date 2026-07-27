import { useState, useEffect } from 'react';
import { FileText, Clock, Loader2, CheckCircle, Upload, X, FileImage, Link as LinkIcon, ExternalLink, Trash2, User } from 'lucide-react';
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
import { Skeleton } from '@/components/ui/skeleton';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';
import { format } from 'date-fns';

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

const PRIORITY_CONFIG = {
  low: { label: 'Low', color: 'bg-slate-500/10 text-slate-600 border-slate-500/20', emoji: '🟢' },
  normal: { label: 'Normal', color: 'bg-blue-500/10 text-blue-600 border-blue-500/20', emoji: '🔵' },
  high: { label: 'High', color: 'bg-orange-500/10 text-orange-600 border-orange-500/20', emoji: '🟠' },
  urgent: { label: 'Urgent', color: 'bg-destructive/10 text-destructive border-destructive/20', emoji: '🔴' },
};

interface Profile {
  user_id: string;
  full_name: string | null;
  email: string | null;
  customer_id: string | null;
  company: string | null;
}

const REQUEST_TYPES = [
  { value: 'blog', label: 'Blog Post', icon: '📝' },
  { value: 'social_post', label: 'Social Post', icon: '📱' },
  { value: 'ad_copy', label: 'Ad Copy', icon: '📢' },
  { value: 'website_section', label: 'Website Section', icon: '🌐' },
];

const STATUS_CONFIG = {
  pending: { label: 'Pending', color: 'bg-amber-500/10 text-amber-600 border-amber-500/20', icon: Clock },
  in_progress: { label: 'In Progress', color: 'bg-blue-500/10 text-blue-600 border-blue-500/20', icon: Loader2 },
  delivered: { label: 'Delivered', color: 'bg-emerald-500/10 text-emerald-600 border-emerald-500/20', icon: CheckCircle },
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

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="grid gap-4 grid-cols-2 md:grid-cols-3">
          {[1, 2, 3].map(i => (
            <Skeleton key={i} className="h-24" />
          ))}
        </div>
        <Skeleton className="h-96" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Status Summary */}
      <div className="grid gap-4 grid-cols-2 md:grid-cols-3">
        {Object.entries(STATUS_CONFIG).map(([status, config]) => {
          const StatusIcon = config.icon;
          const count = getRequestsByStatus(status).length;
          return (
            <Card key={status}>
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className={cn("p-2 rounded-lg", config.color)}>
                      <StatusIcon className={cn("w-4 h-4", status === 'in_progress' && 'animate-spin')} />
                    </div>
                    <div>
                      <p className="text-2xl font-bold">{count}</p>
                      <p className="text-sm text-muted-foreground">{config.label}</p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Requests Table */}
      <Tabs defaultValue="all" className="space-y-4">
        <TabsList className="overflow-x-auto w-max">
          <TabsTrigger value="all">All ({requests.length})</TabsTrigger>
          <TabsTrigger value="pending">Pending ({getRequestsByStatus('pending').length})</TabsTrigger>
          <TabsTrigger value="in_progress">In Progress ({getRequestsByStatus('in_progress').length})</TabsTrigger>
          <TabsTrigger value="delivered">Delivered ({getRequestsByStatus('delivered').length})</TabsTrigger>
        </TabsList>

        {['all', 'pending', 'in_progress', 'delivered'].map(tab => (
          <TabsContent key={tab} value={tab}>
            <Card>
              <CardContent className="p-0">
                {(tab === 'all' ? requests : getRequestsByStatus(tab)).length === 0 ? (
                  <div className="flex flex-col items-center justify-center py-12">
                    <FileText className="w-12 h-12 text-muted-foreground/50 mb-4" />
                    <h3 className="font-medium text-lg mb-1">No requests found</h3>
                    <p className="text-muted-foreground text-sm">
                      {tab === 'all' ? 'No content requests yet' : `No ${STATUS_CONFIG[tab as keyof typeof STATUS_CONFIG]?.label.toLowerCase()} requests`}
                    </p>
                  </div>
                ) : (
                  <ScrollArea className="h-[500px]">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Client</TableHead>
                          <TableHead>Type</TableHead>
                          <TableHead>Title</TableHead>
                          <TableHead>Priority</TableHead>
                          <TableHead>Status</TableHead>
                          <TableHead>Scheduled</TableHead>
                          <TableHead className="text-right">Actions</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {(tab === 'all' ? requests : getRequestsByStatus(tab)).map(request => {
                          const client = getClientInfo(request.user_id);
                          const typeInfo = getTypeInfo(request.request_type);
                          const statusConfig = STATUS_CONFIG[request.status];
                          const StatusIcon = statusConfig.icon;
                          const priorityConfig = PRIORITY_CONFIG[request.priority || 'normal'];

                          return (
                            <TableRow key={request.id}>
                              <TableCell>
                                <div className="flex items-center gap-2">
                                  <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
                                    <User className="w-4 h-4 text-primary" />
                                  </div>
                                  <div>
                                    <p className="font-medium text-sm">{client?.full_name || 'Unknown'}</p>
                                    <p className="text-xs text-muted-foreground">{client?.customer_id || client?.email}</p>
                                  </div>
                                </div>
                              </TableCell>
                              <TableCell>
                                <Badge variant="outline" className="gap-1">
                                  <span>{typeInfo.icon}</span>
                                  <span className="hidden sm:inline">{typeInfo.label}</span>
                                </Badge>
                              </TableCell>
                              <TableCell>
                                <p className="font-medium max-w-[200px] truncate">{request.title}</p>
                                {request.description && (
                                  <p className="text-xs text-muted-foreground truncate max-w-[200px]">{request.description}</p>
                                )}
                              </TableCell>
                              <TableCell>
                                <Badge className={cn("gap-1", statusConfig.color)}>
                                  <StatusIcon className={cn("w-3 h-3", request.status === 'in_progress' && 'animate-spin')} />
                                  {statusConfig.label}
                                </Badge>
                              </TableCell>
                              <TableCell>
                                <Badge className={cn("gap-1", priorityConfig.color)}>
                                  <span>{priorityConfig.emoji}</span>
                                  {priorityConfig.label}
                                </Badge>
                              </TableCell>
                              <TableCell>
                                <Badge className={cn("gap-1", statusConfig.color)}>
                                  <StatusIcon className={cn("w-3 h-3", request.status === 'in_progress' && 'animate-spin')} />
                                  {statusConfig.label}
                                </Badge>
                              </TableCell>
                              <TableCell>
                                <span className="text-sm text-muted-foreground">
                                  {request.scheduled_date 
                                    ? format(new Date(request.scheduled_date), 'MMM d, yyyy')
                                    : '-'}
                                </span>
                              </TableCell>
                              <TableCell className="text-right">
                                <div className="flex items-center justify-end gap-2">
                                  <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() => handleOpenDialog(request)}
                                  >
                                    Manage
                                  </Button>
                                  <Button
                                    variant="ghost"
                                    size="icon"
                                    className="text-destructive hover:text-destructive"
                                    onClick={() => {
                                      setRequestToDelete(request.id);
                                      setDeleteDialogOpen(true);
                                    }}
                                  >
                                    <Trash2 className="w-4 h-4" />
                                  </Button>
                                </div>
                              </TableCell>
                            </TableRow>
                          );
                        })}
                      </TableBody>
                    </Table>
                  </ScrollArea>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        ))}
      </Tabs>

      {/* Edit Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="w-[95vw] sm:max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Manage Content Request</DialogTitle>
          </DialogHeader>
          {selectedRequest && (
            <div className="space-y-6 pt-4">
              {/* Request Details */}
              <Card>
                <CardHeader className="pb-3">
                  <div className="flex items-start gap-3">
                    <span className="text-2xl">{getTypeInfo(selectedRequest.request_type).icon}</span>
                    <div>
                      <CardTitle className="text-lg">{selectedRequest.title}</CardTitle>
                      <CardDescription>
                        {getTypeInfo(selectedRequest.request_type).label} • {format(new Date(selectedRequest.created_at), 'MMM d, yyyy')}
                      </CardDescription>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="space-y-3">
                  {selectedRequest.description && (
                    <div>
                      <p className="text-xs font-medium text-muted-foreground mb-1">Description:</p>
                      <p className="text-sm">{selectedRequest.description}</p>
                    </div>
                  )}
                  
                  {selectedRequest.reference_urls && selectedRequest.reference_urls.length > 0 && (
                    <div>
                      <p className="text-xs font-medium text-muted-foreground mb-1">Reference URLs:</p>
                      <div className="flex flex-wrap gap-2">
                        {selectedRequest.reference_urls.map((url, i) => (
                          <a
                            key={i}
                            href={url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-1 text-xs text-primary hover:underline"
                          >
                            <LinkIcon className="w-3 h-3" />
                            {url}
                            <ExternalLink className="w-2.5 h-2.5" />
                          </a>
                        ))}
                      </div>
                    </div>
                  )}

                  {selectedRequest.reference_files && selectedRequest.reference_files.length > 0 && (
                    <div>
                      <p className="text-xs font-medium text-muted-foreground mb-1">Reference Files:</p>
                      <div className="flex flex-wrap gap-2">
                        {selectedRequest.reference_files.map((file, i) => (
                          <a
                            key={i}
                            href={file}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-1 text-xs text-primary hover:underline"
                          >
                            <FileImage className="w-3 h-3" />
                            File {i + 1}
                            <ExternalLink className="w-2.5 h-2.5" />
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
                  <Label>Status</Label>
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
                  <Label>Assigned To</Label>
                  <Input
                    placeholder="Team member name"
                    value={formData.assigned_to}
                    onChange={(e) => setFormData(prev => ({ ...prev, assigned_to: e.target.value }))}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label>Admin Notes (Internal)</Label>
                <Textarea
                  placeholder="Internal notes for the team..."
                  value={formData.admin_notes}
                  onChange={(e) => setFormData(prev => ({ ...prev, admin_notes: e.target.value }))}
                />
              </div>

              <div className="space-y-2">
                <Label>Delivered Content (Visible to Client)</Label>
                <Textarea
                  placeholder="Message to send with the delivered content..."
                  value={formData.delivered_content}
                  onChange={(e) => setFormData(prev => ({ ...prev, delivered_content: e.target.value }))}
                />
              </div>

              <div className="space-y-2">
                <Label>Upload Delivered Files</Label>
                <div
                  className="border-2 border-dashed rounded-lg p-4 text-center cursor-pointer hover:border-primary/50 hover:bg-muted/50 transition-all"
                  onClick={() => document.getElementById('delivered-upload')?.click()}
                >
                  <input
                    id="delivered-upload"
                    type="file"
                    multiple
                    className="hidden"
                    onChange={handleFileChange}
                  />
                  <Upload className="w-6 h-6 mx-auto text-muted-foreground mb-2" />
                  <p className="text-sm text-muted-foreground">
                    Click to upload delivered files
                  </p>
                </div>

                {/* Existing delivered files */}
                {selectedRequest.delivered_files && selectedRequest.delivered_files.length > 0 && (
                  <div className="space-y-2">
                    <p className="text-xs font-medium text-muted-foreground">Previously uploaded:</p>
                    {selectedRequest.delivered_files.map((file, index) => (
                      <div key={index} className="flex items-center justify-between p-2 bg-muted rounded-lg">
                        <a
                          href={file}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex items-center gap-2 text-sm text-primary hover:underline truncate"
                        >
                          <FileImage className="w-4 h-4 flex-shrink-0" />
                          <span className="truncate">Delivered file {index + 1}</span>
                          <ExternalLink className="w-3 h-3 flex-shrink-0" />
                        </a>
                      </div>
                    ))}
                  </div>
                )}

                {/* New files to upload */}
                {selectedFiles.length > 0 && (
                  <div className="space-y-2">
                    <p className="text-xs font-medium text-muted-foreground">New files to upload:</p>
                    {selectedFiles.map((file, index) => (
                      <div key={index} className="flex items-center justify-between p-2 bg-muted rounded-lg">
                        <div className="flex items-center gap-2 truncate">
                          <FileImage className="w-4 h-4 text-muted-foreground flex-shrink-0" />
                          <span className="text-sm truncate">{file.name}</span>
                        </div>
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          className="h-6 w-6"
                          onClick={() => removeFile(index)}
                        >
                          <X className="w-3 h-3" />
                        </Button>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <div className="flex justify-end gap-2 pt-4 border-t">
                <Button variant="outline" onClick={() => setDialogOpen(false)}>
                  Cancel
                </Button>
                <Button onClick={handleSave} disabled={saving}>
                  {uploading ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Uploading...
                    </>
                  ) : saving ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Saving...
                    </>
                  ) : (
                    'Save Changes'
                  )}
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Content Request</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete this content request? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
