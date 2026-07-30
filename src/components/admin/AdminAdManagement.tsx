import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { 
  Megaphone, 
  Plus, 
  Edit2, 
  Trash2, 
  Play, 
  Pause, 
  CheckCircle, 
  Clock,
  Target,
  Calendar,
  DollarSign,
  Image,
  Video,
  Upload,
  Save,
  X,
  ChevronDown,
  Users,
  Search,
  Building,
  Hash
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';
import { format } from 'date-fns';

interface ClientProfile {
  id: string;
  user_id: string;
  email: string | null;
  full_name: string | null;
  company: string | null;
  customer_id: string | null;
}

interface AdCampaign {
  id: string;
  user_id: string;
  platform: string;
  campaign_name: string;
  creative_url: string | null;
  creative_type: string;
  status: string;
  objective: string | null;
  start_date: string | null;
  monthly_budget: number | null;
  notes: string | null;
  last_updated_at: string;
  created_at: string;
}

const platformOptions = [
  { value: 'meta', label: 'Meta (Facebook/Instagram)' },
  { value: 'google', label: 'Google Ads' },
  { value: 'tiktok', label: 'TikTok' },
  { value: 'linkedin', label: 'LinkedIn' },
  { value: 'twitter', label: 'X / Twitter' },
];

const statusOptions = [
  { value: 'running', label: 'Running', icon: Play, color: 'text-ok' },
  { value: 'paused', label: 'Paused', icon: Pause, color: 'text-attend' },
  { value: 'completed', label: 'Completed', icon: CheckCircle, color: 'text-ok' },
  { value: 'scheduled', label: 'Scheduled', icon: Clock, color: 'text-ink-2' },
];

const objectiveOptions = [
  { value: 'leads', label: 'Leads' },
  { value: 'traffic', label: 'Traffic' },
  { value: 'sales', label: 'Sales' },
  { value: 'awareness', label: 'Awareness' },
  { value: 'engagement', label: 'Engagement' },
];

const statusColors: Record<string, string> = {
  running: 'bg-ok/10 text-ok border-ok/20',
  paused: 'bg-attend/10 text-attend border-attend/20',
  completed: 'bg-ok/10 text-ok border-ok/20',
  scheduled: 'bg-foreground/[0.06] text-ink-2 border-border/60',
};

export default function AdminAdManagement() {
  // Client state
  const [clients, setClients] = useState<ClientProfile[]>([]);
  const [filteredClients, setFilteredClients] = useState<ClientProfile[]>([]);
  const [loadingClients, setLoadingClients] = useState(true);
  const [clientSearch, setClientSearch] = useState('');
  const [selectedClient, setSelectedClient] = useState<ClientProfile | null>(null);

  // Campaign state
  const [campaigns, setCampaigns] = useState<AdCampaign[]>([]);
  const [loading, setLoading] = useState(false);
  const [showDialog, setShowDialog] = useState(false);
  const [editingCampaign, setEditingCampaign] = useState<AdCampaign | null>(null);
  const [saving, setSaving] = useState(false);

  // File upload state
  const [uploading, setUploading] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [dragActive, setDragActive] = useState(false);

  // Form state
  const [formData, setFormData] = useState({
    platform: 'meta',
    campaign_name: '',
    creative_url: '',
    creative_type: 'image',
    status: 'running',
    objective: '',
    start_date: '',
    monthly_budget: '',
    notes: '',
  });

  // Fetch clients on mount
  useEffect(() => {
    fetchClients();
  }, []);

  // Filter clients based on search
  useEffect(() => {
    if (clientSearch.trim() === '') {
      setFilteredClients(clients);
    } else {
      const term = clientSearch.toLowerCase();
      setFilteredClients(
        clients.filter(
          (c) =>
            c.full_name?.toLowerCase().includes(term) ||
            c.email?.toLowerCase().includes(term) ||
            c.company?.toLowerCase().includes(term) ||
            c.customer_id?.toLowerCase().includes(term)
        )
      );
    }
  }, [clients, clientSearch]);

  // Fetch campaigns when client changes
  useEffect(() => {
    if (selectedClient) {
      fetchCampaigns();
    } else {
      setCampaigns([]);
    }
  }, [selectedClient]);

  const fetchClients = async () => {
    setLoadingClients(true);
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('id, user_id, email, full_name, company, customer_id')
        .order('full_name', { ascending: true });

      if (error) throw error;
      setClients(data || []);
    } catch (error) {
      console.error('Error fetching clients:', error);
      toast.error('Failed to load clients');
    } finally {
      setLoadingClients(false);
    }
  };

  const fetchCampaigns = async () => {
    if (!selectedClient) return;
    
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('ad_campaigns')
        .select('*')
        .eq('user_id', selectedClient.user_id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setCampaigns(data || []);
    } catch (error) {
      console.error('Error fetching campaigns:', error);
      toast.error('Failed to load campaigns');
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setFormData({
      platform: 'meta',
      campaign_name: '',
      creative_url: '',
      creative_type: 'image',
      status: 'running',
      objective: '',
      start_date: '',
      monthly_budget: '',
      notes: '',
    });
    setEditingCampaign(null);
    setSelectedFile(null);
    setPreviewUrl(null);
  };

  const handleOpenDialog = (campaign?: AdCampaign) => {
    if (campaign) {
      setEditingCampaign(campaign);
      setFormData({
        platform: campaign.platform,
        campaign_name: campaign.campaign_name,
        creative_url: campaign.creative_url || '',
        creative_type: campaign.creative_type,
        status: campaign.status,
        objective: campaign.objective || '',
        start_date: campaign.start_date || '',
        monthly_budget: campaign.monthly_budget?.toString() || '',
        notes: campaign.notes || '',
      });
      // Set preview URL if there's an existing creative
      if (campaign.creative_url) {
        setPreviewUrl(campaign.creative_url);
      }
    } else {
      resetForm();
    }
    setShowDialog(true);
  };

  const handleCloseDialog = () => {
    setShowDialog(false);
    resetForm();
  };

  // File upload handlers
  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFileSelect(e.dataTransfer.files[0]);
    }
  };

  const handleFileSelect = (file: File) => {
    // Validate file type
    const isImage = file.type.startsWith('image/');
    const isVideo = file.type.startsWith('video/');
    
    if (!isImage && !isVideo) {
      toast.error('Please upload an image or video file');
      return;
    }

    // Check file size (max 50MB)
    if (file.size > 50 * 1024 * 1024) {
      toast.error('File size must be less than 50MB');
      return;
    }

    setSelectedFile(file);
    setFormData({ ...formData, creative_type: isVideo ? 'video' : 'image' });

    // Create preview URL
    const objectUrl = URL.createObjectURL(file);
    setPreviewUrl(objectUrl);
  };

  const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      handleFileSelect(e.target.files[0]);
    }
  };

  const uploadFile = async (): Promise<string | null> => {
    if (!selectedFile || !selectedClient) return null;

    setUploading(true);
    try {
      const fileExt = selectedFile.name.split('.').pop();
      const fileName = `${selectedClient.user_id}/${Date.now()}-${Math.random().toString(36).substring(7)}.${fileExt}`;

      const { error: uploadError } = await supabase.storage
        .from('ad-creatives')
        .upload(fileName, selectedFile);

      if (uploadError) throw uploadError;

      const { data } = supabase.storage
        .from('ad-creatives')
        .getPublicUrl(fileName);

      return data.publicUrl;
    } catch (error) {
      console.error('Error uploading file:', error);
      toast.error('Failed to upload file');
      return null;
    } finally {
      setUploading(false);
    }
  };

  const removeCreative = () => {
    setSelectedFile(null);
    setPreviewUrl(null);
    setFormData({ ...formData, creative_url: '' });
  };

  const handleSave = async () => {
    if (!selectedClient || !formData.campaign_name.trim()) {
      toast.error('Please fill in required fields');
      return;
    }

    setSaving(true);
    try {
      // Upload file if selected
      let creativeUrl = formData.creative_url;
      if (selectedFile) {
        const uploadedUrl = await uploadFile();
        if (uploadedUrl) {
          creativeUrl = uploadedUrl;
        } else if (!formData.creative_url) {
          // Upload failed and no existing URL
          setSaving(false);
          return;
        }
      }

      const campaignData = {
        user_id: selectedClient.user_id,
        platform: formData.platform,
        campaign_name: formData.campaign_name.trim(),
        creative_url: creativeUrl.trim() || null,
        creative_type: formData.creative_type,
        status: formData.status,
        objective: formData.objective || null,
        start_date: formData.start_date || null,
        monthly_budget: formData.monthly_budget ? parseFloat(formData.monthly_budget) : null,
        notes: formData.notes.trim() || null,
        last_updated_at: new Date().toISOString(),
      };

      if (editingCampaign) {
        const { error } = await supabase
          .from('ad_campaigns')
          .update(campaignData)
          .eq('id', editingCampaign.id);

        if (error) throw error;
        toast.success('Campaign updated');
      } else {
        const { error } = await supabase
          .from('ad_campaigns')
          .insert(campaignData);

        if (error) throw error;
        toast.success('Campaign created');
      }

      handleCloseDialog();
      fetchCampaigns();
    } catch (error) {
      console.error('Error saving campaign:', error);
      toast.error('Failed to save campaign');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (campaignId: string) => {
    if (!confirm('Are you sure you want to delete this campaign?')) return;

    try {
      const { error } = await supabase
        .from('ad_campaigns')
        .delete()
        .eq('id', campaignId);

      if (error) throw error;
      toast.success('Campaign deleted');
      fetchCampaigns();
    } catch (error) {
      console.error('Error deleting campaign:', error);
      toast.error('Failed to delete campaign');
    }
  };

  return (
    <div className="mx-auto max-w-[1200px] space-y-5 px-4 pb-16 pt-6 sm:px-6">
      <header>
        <p className="font-mono text-[9px] font-medium uppercase tracking-[0.16em] text-muted-foreground">
          Advertising
        </p>
        <h1 className="mt-1.5 font-display text-[26px] font-semibold leading-none tracking-[-0.02em] sm:text-[30px]">
          Ad campaigns
        </h1>
        <p className="mt-2 max-w-xl text-[13px] leading-relaxed text-muted-foreground">
          Pick the client whose advertising you are running, then manage what is live for them.
        </p>
      </header>

      {/* Whose advertising */}
      <div className="overflow-hidden rounded-[12px] border border-border/60 bg-card">
        <div className="border-b border-border/60 p-3">
          <div className="relative">
            <Search className="pointer-events-none absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Search client, email, company or ID"
              value={clientSearch}
              onChange={(e) => setClientSearch(e.target.value)}
              className="h-9 rounded-[10px] pl-8 text-[12.5px]"
            />
          </div>
        </div>
        <div className="p-3">

          {/* Client List */}
          {loadingClients ? (
            <div className="text-center py-8 text-muted-foreground">Loading clients...</div>
          ) : filteredClients.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              {clientSearch ? 'No clients match your search' : 'No clients found'}
            </div>
          ) : (
            <div className="grid gap-2 max-h-[300px] overflow-y-auto pr-1">
              {filteredClients.map((client) => (
                <motion.div
                  key={client.id}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className={cn(
                    "p-3 rounded-lg border cursor-pointer transition-all",
                    selectedClient?.id === client.id
                      ? "border-primary bg-primary/10"
                      : "border-border hover:border-primary/50 hover:bg-muted/50"
                  )}
                  onClick={() => setSelectedClient(client)}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-muted flex items-center justify-center text-muted-foreground">
                        <Users className="w-5 h-5" />
                      </div>
                      <div>
                        <p className="font-medium">{client.full_name || 'No Name'}</p>
                        <p className="text-sm text-muted-foreground">{client.email}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      {client.company && (
                        <Badge variant="outline" className="hidden sm:flex gap-1 items-center">
                          <Building className="w-3 h-3" />
                          {client.company}
                        </Badge>
                      )}
                      {client.customer_id && (
                        <Badge variant="secondary" className="font-mono text-xs">
                          <Hash className="w-3 h-3 mr-1" />
                          {client.customer_id}
                        </Badge>
                      )}
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Campaign Management Section */}
      {selectedClient ? (
        <>
          {/* Header */}
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-xl font-bold flex items-center gap-2">
                <Megaphone className="w-5 h-5" />
                Ad Campaigns
              </h2>
              <p className="text-sm text-muted-foreground">
                Managing ads for: <span className="font-medium text-foreground">{selectedClient.full_name || selectedClient.email}</span>
                {selectedClient.company && <span className="text-muted-foreground"> ({selectedClient.company})</span>}
              </p>
            </div>
            <Button onClick={() => handleOpenDialog()} className="gap-2">
              <Plus className="w-4 h-4" />
              Add Campaign
            </Button>
          </div>

          {/* Campaigns Table */}
          {loading ? (
            <Card>
              <CardContent className="py-8 text-center text-muted-foreground">
                Loading campaigns...
              </CardContent>
            </Card>
          ) : campaigns.length === 0 ? (
            <Card>
              <CardContent className="flex flex-col items-center justify-center py-12">
                <div className="p-4 rounded-full bg-muted mb-4">
                  <Megaphone className="w-8 h-8 text-muted-foreground" />
                </div>
                <h3 className="text-lg font-semibold mb-2">No Campaigns Yet</h3>
                <p className="text-muted-foreground text-center max-w-md mb-4">
                  Create ad campaigns to help this client track their advertising efforts.
                </p>
                <Button onClick={() => handleOpenDialog()} className="gap-2">
                  <Plus className="w-4 h-4" />
                  Create First Campaign
                </Button>
              </CardContent>
            </Card>
          ) : (
            <Card>
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Campaign</TableHead>
                      <TableHead>Platform</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Objective</TableHead>
                      <TableHead>Budget</TableHead>
                      <TableHead>Start Date</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {campaigns.map((campaign) => (
                      <TableRow key={campaign.id}>
                        <TableCell>
                          <div className="flex items-center gap-3">
                            {campaign.creative_url ? (
                              <div className="w-12 h-12 rounded-lg overflow-hidden bg-muted flex-shrink-0">
                                {campaign.creative_type === 'video' ? (
                                  <video src={campaign.creative_url} className="w-full h-full object-cover" muted />
                                ) : (
                                  <img src={campaign.creative_url} alt="" className="w-full h-full object-cover" />
                                )}
                              </div>
                            ) : (
                              <div className="w-12 h-12 rounded-lg bg-muted flex items-center justify-center flex-shrink-0">
                                {campaign.creative_type === 'video' ? (
                                  <Video className="w-5 h-5 text-muted-foreground" />
                                ) : (
                                  <Image className="w-5 h-5 text-muted-foreground" />
                                )}
                              </div>
                            )}
                            <div>
                              <p className="font-medium">{campaign.campaign_name}</p>
                              {campaign.notes && (
                                <p className="text-xs text-muted-foreground line-clamp-1">{campaign.notes}</p>
                              )}
                            </div>
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline" className="capitalize">
                            {platformOptions.find(p => p.value === campaign.platform)?.label || campaign.platform}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <Badge className={cn("border", statusColors[campaign.status])}>
                            {statusOptions.find(s => s.value === campaign.status)?.label || campaign.status}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          {campaign.objective ? (
                            <span className="capitalize">{campaign.objective}</span>
                          ) : (
                            <span className="text-muted-foreground">-</span>
                          )}
                        </TableCell>
                        <TableCell>
                          {campaign.monthly_budget ? (
                            <span>£{campaign.monthly_budget.toLocaleString()}/mo</span>
                          ) : (
                            <span className="text-muted-foreground">-</span>
                          )}
                        </TableCell>
                        <TableCell>
                          {campaign.start_date ? (
                            format(new Date(campaign.start_date), 'MMM d, yyyy')
                          ) : (
                            <span className="text-muted-foreground">-</span>
                          )}
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex items-center justify-end gap-2">
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => handleOpenDialog(campaign)}
                            >
                              <Edit2 className="w-4 h-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => handleDelete(campaign.id)}
                              className="text-destructive hover:text-destructive"
                            >
                              <Trash2 className="w-4 h-4" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </Card>
          )}
        </>
      ) : (
        <div className="flex flex-col items-center justify-center rounded-[12px] border border-dashed border-border/70 px-6 py-14 text-center">
          <Megaphone className="h-5 w-5 text-muted-foreground/60" />
          <p className="mt-3 text-[14px] font-medium">Pick a client to begin</p>
          <p className="mt-1.5 max-w-sm text-[12.5px] leading-relaxed text-muted-foreground">
            Their live campaigns, creatives and monthly spend all sit behind their name.
          </p>
        </div>
      )}

      {/* Add/Edit Dialog */}
      <Dialog open={showDialog} onOpenChange={setShowDialog}>
        <DialogContent className="w-[95vw] sm:max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {editingCampaign ? 'Edit Campaign' : 'Add New Campaign'}
            </DialogTitle>
            <DialogDescription>
              {editingCampaign 
                ? 'Update the campaign details below.'
                : 'Create a new ad campaign for this client.'}
            </DialogDescription>
          </DialogHeader>

          <div className="grid gap-4 py-4">
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="campaign_name">Campaign Name *</Label>
                <Input
                  id="campaign_name"
                  value={formData.campaign_name}
                  onChange={(e) => setFormData({ ...formData, campaign_name: e.target.value })}
                  placeholder="Summer Sale 2024"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="platform">Platform *</Label>
                <Select
                  value={formData.platform}
                  onValueChange={(value) => setFormData({ ...formData, platform: value })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {platformOptions.map((option) => (
                      <SelectItem key={option.value} value={option.value}>
                        {option.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="status">Status</Label>
                <Select
                  value={formData.status}
                  onValueChange={(value) => setFormData({ ...formData, status: value })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {statusOptions.map((option) => (
                      <SelectItem key={option.value} value={option.value}>
                        <div className="flex items-center gap-2">
                          <option.icon className={cn("w-4 h-4", option.color)} />
                          {option.label}
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="objective">Objective</Label>
                <Select
                  value={formData.objective}
                  onValueChange={(value) => setFormData({ ...formData, objective: value })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select objective" />
                  </SelectTrigger>
                  <SelectContent>
                    {objectiveOptions.map((option) => (
                      <SelectItem key={option.value} value={option.value}>
                        {option.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="start_date">Start Date</Label>
                <Input
                  id="start_date"
                  type="date"
                  value={formData.start_date}
                  onChange={(e) => setFormData({ ...formData, start_date: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="monthly_budget">Monthly Budget (£)</Label>
                <Input
                  id="monthly_budget"
                  type="number"
                  value={formData.monthly_budget}
                  onChange={(e) => setFormData({ ...formData, monthly_budget: e.target.value })}
                  placeholder="500"
                />
              </div>
            </div>

            {/* Creative Upload Section */}
            <div className="space-y-3">
              <Label>Ad Creative (Image/Video)</Label>
              
              {previewUrl ? (
                <div className="relative">
                  <div className="rounded-lg overflow-hidden bg-muted border border-border">
                    {formData.creative_type === 'video' ? (
                      <video 
                        src={previewUrl} 
                        className="w-full max-h-[200px] object-contain"
                        controls
                        muted
                      />
                    ) : (
                      <img 
                        src={previewUrl} 
                        alt="Creative preview" 
                        className="w-full max-h-[200px] object-contain"
                      />
                    )}
                  </div>
                  <div className="flex items-center justify-between mt-2">
                    <div className="flex items-center gap-2">
                      <Badge variant="secondary" className="gap-1">
                        {formData.creative_type === 'video' ? (
                          <Video className="w-3 h-3" />
                        ) : (
                          <Image className="w-3 h-3" />
                        )}
                        {selectedFile ? selectedFile.name : 'Existing creative'}
                      </Badge>
                      {selectedFile && (
                        <span className="text-xs text-muted-foreground">
                          ({(selectedFile.size / 1024 / 1024).toFixed(2)} MB)
                        </span>
                      )}
                    </div>
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={removeCreative}
                      className="text-destructive hover:text-destructive gap-1"
                    >
                      <X className="w-4 h-4" />
                      Remove
                    </Button>
                  </div>
                </div>
              ) : (
                <div
                  onDragEnter={handleDrag}
                  onDragLeave={handleDrag}
                  onDragOver={handleDrag}
                  onDrop={handleDrop}
                  className={cn(
                    "border-2 border-dashed rounded-lg p-6 text-center cursor-pointer transition-all",
                    dragActive 
                      ? "border-primary bg-primary/5" 
                      : "border-border hover:border-primary/50 hover:bg-muted/50"
                  )}
                  onClick={() => document.getElementById('creative-upload')?.click()}
                >
                  <input
                    id="creative-upload"
                    type="file"
                    accept="image/*,video/*"
                    className="hidden"
                    onChange={handleFileInputChange}
                  />
                  <div className="flex flex-col items-center gap-2">
                    <div className="p-3 rounded-full bg-muted">
                      <Upload className="w-6 h-6 text-muted-foreground" />
                    </div>
                    <div>
                      <p className="font-medium text-sm">
                        {dragActive ? 'Drop your file here' : 'Upload ad creative'}
                      </p>
                      <p className="text-xs text-muted-foreground mt-1">
                        Drag & drop or click to browse. Max 50MB.
                      </p>
                    </div>
                    <div className="flex gap-2 mt-1">
                      <Badge variant="outline" className="text-xs gap-1">
                        <Image className="w-3 h-3" />
                        Images
                      </Badge>
                      <Badge variant="outline" className="text-xs gap-1">
                        <Video className="w-3 h-3" />
                        Videos
                      </Badge>
                    </div>
                  </div>
                </div>
              )}

              {/* Optional URL input as fallback */}
              <div className="pt-2 border-t border-border">
                <Label htmlFor="creative_url" className="text-xs text-muted-foreground">
                  Or paste an external URL
                </Label>
                <Input
                  id="creative_url"
                  value={formData.creative_url}
                  onChange={(e) => {
                    setFormData({ ...formData, creative_url: e.target.value });
                    if (e.target.value && !selectedFile) {
                      setPreviewUrl(e.target.value);
                    }
                  }}
                  placeholder="https://..."
                  className="mt-1"
                  disabled={!!selectedFile}
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="notes">Notes (visible to client)</Label>
              <Textarea
                id="notes"
                value={formData.notes}
                onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                placeholder="Add any notes about this campaign that the client should see..."
                rows={3}
              />
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={handleCloseDialog} disabled={saving || uploading}>
              Cancel
            </Button>
            <Button onClick={handleSave} disabled={saving || uploading} className="gap-2">
              {saving || uploading ? (
                <>
                  <div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
                  {uploading ? 'Uploading...' : 'Saving...'}
                </>
              ) : (
                <>
                  <Save className="w-4 h-4" />
                  {editingCampaign ? 'Update Campaign' : 'Create Campaign'}
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
