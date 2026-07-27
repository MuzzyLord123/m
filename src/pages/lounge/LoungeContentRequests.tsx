import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { FileText, Plus, Upload, X, Clock, Loader2, CheckCircle, FileImage, Link as LinkIcon, ExternalLink, Calendar as CalendarIcon, AlertTriangle, Flag } from 'lucide-react';
import { LoungePageHeader } from '@/components/lounge/LoungePageHeader';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Skeleton } from '@/components/ui/skeleton';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
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

const PRIORITY_CONFIG = {
  low: { label: 'Low', color: 'bg-slate-500/10 text-slate-600 border-slate-500/20' },
  normal: { label: 'Normal', color: 'bg-blue-500/10 text-blue-600 border-blue-500/20' },
  high: { label: 'High', color: 'bg-orange-500/10 text-orange-600 border-orange-500/20' },
  urgent: { label: 'Urgent', color: 'bg-destructive/10 text-destructive border-destructive/20' },
};

export default function LoungeContentRequests() {
  const { user } = useAuth();
  const [requests, setRequests] = useState<ContentRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
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
      toast.error('Failed to load content requests');
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
      toast.error('Please select a request type and enter a title');
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

      toast.success('Content request submitted successfully!');
      setDialogOpen(false);
      setFormData({ request_type: '', title: '', description: '', reference_urls: [''], scheduled_date: null, priority: 'normal' });
      setSelectedFiles([]);
      fetchRequests();
    } catch (error) {
      console.error('Error submitting request:', error);
      toast.error('Failed to submit request');
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
      <div className="p-4 sm:p-6 lg:p-8 space-y-6">
        <div className="space-y-2">
          <Skeleton className="h-8 w-64" />
          <Skeleton className="h-4 w-96" />
        </div>
        <div className="grid gap-4 md:grid-cols-3">
          {[1, 2, 3].map(i => (
            <Skeleton key={i} className="h-32" />
          ))}
        </div>
        <Skeleton className="h-64" />
      </div>
    );
  }

  return (
    <div className="p-4 sm:p-6 lg:p-8 space-y-6">
      <LoungePageHeader
        title="Content Requests"
        description="Request new content from our team"
        icon={FileText}
        actions={
          <Button className="gap-2" onClick={() => setDialogOpen(true)}>
            <Plus className="w-4 h-4" />
            Request Content
          </Button>
        }
      />

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogContent className="w-[95vw] max-w-lg max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>New Content Request</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 pt-4">
              <div className="space-y-2">
                <Label>Content Type *</Label>
                <Select
                  value={formData.request_type}
                  onValueChange={(value) => setFormData(prev => ({ ...prev, request_type: value }))}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select content type" />
                  </SelectTrigger>
                  <SelectContent>
                    {REQUEST_TYPES.map(type => (
                      <SelectItem key={type.value} value={type.value}>
                        <span className="flex items-center gap-2">
                          <span>{type.icon}</span>
                          <span>{type.label}</span>
                        </span>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>Title *</Label>
                <Input
                  placeholder="Brief title for your request"
                  value={formData.title}
                  onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
                />
              </div>

              {/* Date and Priority */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Scheduled Date</Label>
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button variant="outline" className={cn("w-full justify-start text-left font-normal", !formData.scheduled_date && "text-muted-foreground")}>
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

                <div className="space-y-2">
                  <Label>Priority</Label>
                  <Select
                    value={formData.priority}
                    onValueChange={(value) => setFormData(prev => ({ ...prev, priority: value }))}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select priority" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="low">🟢 Low</SelectItem>
                      <SelectItem value="normal">🔵 Normal</SelectItem>
                      <SelectItem value="high">🟠 High</SelectItem>
                      <SelectItem value="urgent">🔴 Urgent</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="space-y-2">
                <Label>Description</Label>
                <Textarea
                  placeholder="Describe what you need in detail..."
                  value={formData.description}
                  onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                  className="min-h-[100px]"
                />
              </div>

              <div className="space-y-2">
                <Label>Reference URLs</Label>
                <div className="space-y-2">
                  {formData.reference_urls.map((url, index) => (
                    <div key={index} className="flex gap-2">
                      <Input
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
                          <X className="w-4 h-4" />
                        </Button>
                      )}
                    </div>
                  ))}
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={addUrlField}
                    className="gap-2"
                  >
                    <Plus className="w-3 h-3" />
                    Add URL
                  </Button>
                </div>
              </div>

              <div className="space-y-2">
                <Label>Reference Files</Label>
                <div
                  className="border-2 border-dashed rounded-lg p-4 text-center cursor-pointer hover:border-primary/50 hover:bg-muted/50 transition-all"
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
                  <Upload className="w-6 h-6 mx-auto text-muted-foreground mb-2" />
                  <p className="text-sm text-muted-foreground">
                    Click to upload reference files
                  </p>
                  <p className="text-xs text-muted-foreground mt-1">
                    Images, PDFs, Documents
                  </p>
                </div>
                {selectedFiles.length > 0 && (
                  <div className="space-y-2 mt-2">
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

              <div className="flex justify-end gap-2 pt-4">
                <Button variant="outline" onClick={() => setDialogOpen(false)}>
                  Cancel
                </Button>
                <Button onClick={handleSubmit} disabled={submitting}>
                  {uploading ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Uploading...
                    </>
                  ) : submitting ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Submitting...
                    </>
                  ) : (
                    'Submit Request'
                  )}
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>

      {/* Status Summary */}
      <div className="grid gap-4 md:grid-cols-3">
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

      {/* Requests List */}
      <Tabs defaultValue="all" className="space-y-4">
        <TabsList>
          <TabsTrigger value="all">All ({requests.length})</TabsTrigger>
          <TabsTrigger value="pending">Pending ({getRequestsByStatus('pending').length})</TabsTrigger>
          <TabsTrigger value="in_progress">In Progress ({getRequestsByStatus('in_progress').length})</TabsTrigger>
          <TabsTrigger value="delivered">Delivered ({getRequestsByStatus('delivered').length})</TabsTrigger>
        </TabsList>

        {['all', 'pending', 'in_progress', 'delivered'].map(tab => (
          <TabsContent key={tab} value={tab} className="space-y-4">
            {(tab === 'all' ? requests : getRequestsByStatus(tab)).length === 0 ? (
              <Card>
                <CardContent className="flex flex-col items-center justify-center py-12">
                  <FileText className="w-12 h-12 text-muted-foreground/50 mb-4" />
                  <h3 className="font-medium text-lg mb-1">No requests found</h3>
                  <p className="text-muted-foreground text-sm">
                    {tab === 'all' ? 'Submit your first content request to get started' : `No ${STATUS_CONFIG[tab as keyof typeof STATUS_CONFIG]?.label.toLowerCase()} requests`}
                  </p>
                </CardContent>
              </Card>
            ) : (
              <ScrollArea className="h-[500px]">
                <div className="space-y-4 pr-4">
                  {(tab === 'all' ? requests : getRequestsByStatus(tab)).map((request, index) => {
                    const typeInfo = getTypeInfo(request.request_type);
                    const statusConfig = STATUS_CONFIG[request.status];
                    const StatusIcon = statusConfig.icon;

                    return (
                      <motion.div
                        key={request.id}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: index * 0.05 }}
                      >
                        <Card>
                          <CardHeader className="pb-3">
                            <div className="flex items-start justify-between gap-4">
                              <div className="flex items-start gap-3">
                                <span className="text-2xl">{typeInfo.icon}</span>
                                <div>
                                  <CardTitle className="text-lg">{request.title}</CardTitle>
                                  <CardDescription className="flex items-center gap-2 mt-1">
                                    <Badge variant="outline" className="text-xs">
                                      {typeInfo.label}
                                    </Badge>
                                    <span className="text-xs">
                                      {format(new Date(request.created_at), 'MMM d, yyyy')}
                                    </span>
                                  </CardDescription>
                                </div>
                              </div>
                              <Badge className={cn("gap-1", statusConfig.color)}>
                                <StatusIcon className={cn("w-3 h-3", request.status === 'in_progress' && 'animate-spin')} />
                                {statusConfig.label}
                              </Badge>
                            </div>
                          </CardHeader>
                          <CardContent className="space-y-3">
                            {request.description && (
                              <p className="text-sm text-muted-foreground">{request.description}</p>
                            )}

                            {request.reference_urls && request.reference_urls.length > 0 && (
                              <div className="space-y-1">
                                <p className="text-xs font-medium text-muted-foreground">References:</p>
                                <div className="flex flex-wrap gap-2">
                                  {request.reference_urls.map((url, i) => (
                                    <a
                                      key={i}
                                      href={url}
                                      target="_blank"
                                      rel="noopener noreferrer"
                                      className="inline-flex items-center gap-1 text-xs text-primary hover:underline"
                                    >
                                      <LinkIcon className="w-3 h-3" />
                                      Link {i + 1}
                                      <ExternalLink className="w-2.5 h-2.5" />
                                    </a>
                                  ))}
                                </div>
                              </div>
                            )}

                            {request.reference_files && request.reference_files.length > 0 && (
                              <div className="space-y-1">
                                <p className="text-xs font-medium text-muted-foreground">Attached Files:</p>
                                <div className="flex flex-wrap gap-2">
                                  {request.reference_files.map((file, i) => (
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

                            {request.assigned_to && (
                              <p className="text-xs text-muted-foreground">
                                Assigned to: <span className="font-medium">{request.assigned_to}</span>
                              </p>
                            )}

                            {request.status === 'delivered' && (
                              <div className="mt-4 p-3 bg-emerald-500/5 border border-emerald-500/20 rounded-lg">
                                <p className="text-sm font-medium text-emerald-600 mb-2">✅ Content Delivered</p>
                                {request.delivered_content && (
                                  <p className="text-sm text-muted-foreground">{request.delivered_content}</p>
                                )}
                                {request.delivered_files && request.delivered_files.length > 0 && (
                                  <div className="flex flex-wrap gap-2 mt-2">
                                    {request.delivered_files.map((file, i) => (
                                      <a
                                        key={i}
                                        href={file}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="inline-flex items-center gap-1 text-xs text-emerald-600 hover:underline"
                                      >
                                        <FileImage className="w-3 h-3" />
                                        Download {i + 1}
                                        <ExternalLink className="w-2.5 h-2.5" />
                                      </a>
                                    ))}
                                  </div>
                                )}
                              </div>
                            )}
                          </CardContent>
                        </Card>
                      </motion.div>
                    );
                  })}
                </div>
              </ScrollArea>
            )}
          </TabsContent>
        ))}
      </Tabs>
    </div>
  );
}
