import { useState, useEffect } from 'react';
import { 
  Globe, 
  Search, 
  User, 
  Shield, 
  Server,
  ExternalLink,
  Upload,
  FileCode,
  History,
  CheckCircle,
  Clock,
  AlertCircle,
  Save,
  Loader2,
  Plus,
  Trash2,
  Download
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import { supabase } from '@/integrations/supabase/client';
import { SkeletonLedger, SkeletonBlock } from '@/components/platform';
import { toast } from 'sonner';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';

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

interface VersionEntry {
  version: string;
  date: string;
  changes: string;
}

const WEBSITE_STATUS_OPTIONS = [
  { value: 'design', label: 'Design' },
  { value: 'development', label: 'Development' },
  { value: 'review', label: 'Review' },
  { value: 'live', label: 'Live' },
  { value: 'not_published', label: 'Not Published' },
];

const SSL_STATUS_OPTIONS = [
  { value: 'active', label: 'Active' },
  { value: 'pending', label: 'Pending' },
  { value: 'expired', label: 'Expired' },
];

const SSL_STATUS_CONFIG = {
  active: { label: 'Active', color: 'bg-ok/10 text-ok border-ok/20', icon: CheckCircle },
  pending: { label: 'Pending', color: 'bg-attend/10 text-attend border-attend/20', icon: Clock },
  expired: { label: 'Expired', color: 'bg-destructive/10 text-destructive border-destructive/20', icon: AlertCircle },
};

export default function AdminWebsiteManagement() {
  const [clients, setClients] = useState<ClientProfile[]>([]);
  const [filteredClients, setFilteredClients] = useState<ClientProfile[]>([]);
  const [selectedClient, setSelectedClient] = useState<ClientProfile | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const [addVersionDialogOpen, setAddVersionDialogOpen] = useState(false);
  const [newVersion, setNewVersion] = useState({ version: '', changes: '' });
  
  const [formData, setFormData] = useState({
    website_status: '',
    preview_url: '',
    domain_name: '',
    ssl_status: '',
    hosting_provider: '',
    site_files_url: '',
  });
  const [urlError, setUrlError] = useState('');

  // URL validation helper
  const validateUrl = (url: string): boolean => {
    if (!url) return true; // Empty is valid (optional field)
    // Allow domain-only format (e.g., quooro.com) or full URLs
    const urlPattern = /^(https?:\/\/)?([\da-z\.-]+)\.([a-z\.]{2,6})([\/\w \.-]*)*\/?$/i;
    return urlPattern.test(url);
  };

  const handlePreviewUrlChange = (value: string) => {
    setFormData(prev => ({ ...prev, preview_url: value }));
    if (value && !validateUrl(value)) {
      setUrlError('Please enter a valid URL (e.g., example.com or https://example.com)');
    } else {
      setUrlError('');
    }
  };

  useEffect(() => {
    fetchClients();
  }, []);

  useEffect(() => {
    if (searchTerm) {
      const filtered = clients.filter(client => 
        client.full_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        client.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        client.company?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        client.customer_id?.toLowerCase().includes(searchTerm.toLowerCase())
      );
      setFilteredClients(filtered);
    } else {
      setFilteredClients(clients);
    }
  }, [searchTerm, clients]);

  const fetchClients = async () => {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .order('full_name', { ascending: true });

      if (error) throw error;
      
      // Parse version_history for each client
      const parsedData = (data || []).map(client => ({
        ...client,
        version_history: typeof client.version_history === 'string' 
          ? JSON.parse(client.version_history) 
          : client.version_history
      }));
      
      setClients(parsedData as ClientProfile[]);
      setFilteredClients(parsedData as ClientProfile[]);
    } catch (error) {
      console.error('Error fetching clients:', error);
      toast.error('Failed to load clients');
    } finally {
      setLoading(false);
    }
  };

  const handleSelectClient = (client: ClientProfile) => {
    setSelectedClient(client);
    setFormData({
      website_status: client.website_status || 'design',
      preview_url: client.preview_url || '',
      domain_name: client.domain_name || '',
      ssl_status: client.ssl_status || 'pending',
      hosting_provider: client.hosting_provider || 'Quooro Cloud',
      site_files_url: client.site_files_url || '',
    });
  };

  const MAX_UPLOAD_BYTES = 500 * 1024 * 1024; // 500MB

  const uploadSiteFile = async (file: File) => {
    if (!selectedClient) return;

    // Detect folder / empty file (folders dropped via OS report size 0 + no type)
    if (!file.size || (file.size === 0 && !file.type)) {
      toast.error('Please drop a single archive (.zip / .tar / .gz). Folders cannot be uploaded directly — zip it first.');
      return;
    }

    if (file.size > MAX_UPLOAD_BYTES) {
      toast.error(`File too large (${(file.size / 1024 / 1024).toFixed(1)} MB). Max is 500 MB.`);
      return;
    }

    setUploading(true);
    try {
      const fileExt = (file.name.split('.').pop() || 'bin').toLowerCase();
      const fileName = `${selectedClient.user_id}/site-files-${Date.now()}.${fileExt}`;

      const { error: uploadError } = await supabase.storage
        .from('site-files')
        .upload(fileName, file, {
          upsert: true,
          contentType: file.type || 'application/octet-stream',
        });

      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage
        .from('site-files')
        .getPublicUrl(fileName);

      setFormData(prev => ({ ...prev, site_files_url: publicUrl }));
      toast.success(`Uploaded ${file.name} (${(file.size / 1024 / 1024).toFixed(1)} MB)`);
    } catch (error: any) {
      console.error('Upload error:', error);
      const msg = error?.message || error?.error || 'Unknown error';
      if (/exceeded|too large|size/i.test(msg)) {
        toast.error('File exceeds the storage size limit. Try compressing further or contact support to raise the limit.');
      } else {
        toast.error(`Upload failed: ${msg}`);
      }
    } finally {
      setUploading(false);
    }
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files?.length) return;
    await uploadSiteFile(e.target.files[0]);
    e.target.value = '';
  };

  const handleSave = async () => {
    if (!selectedClient) return;
    
    // Validate URL before saving
    if (formData.preview_url && !validateUrl(formData.preview_url)) {
      toast.error('Please enter a valid preview URL');
      return;
    }

    setSaving(true);
    try {
      const { error } = await supabase
        .from('profiles')
        .update({
          website_status: formData.website_status,
          preview_url: formData.preview_url || null,
          domain_name: formData.domain_name || null,
          ssl_status: formData.ssl_status,
          hosting_provider: formData.hosting_provider || 'Quooro Cloud',
          site_files_url: formData.site_files_url || null,
        })
        .eq('id', selectedClient.id);

      if (error) throw error;

      toast.success('Website settings updated');
      
      // Update local state
      const updatedClient = {
        ...selectedClient,
        ...formData,
      };
      setSelectedClient(updatedClient);
      setClients(prev => prev.map(c => c.id === selectedClient.id ? updatedClient : c));
    } catch (error) {
      console.error('Error saving:', error);
      toast.error('Failed to save changes');
    } finally {
      setSaving(false);
    }
  };

  const handleAddVersion = async () => {
    if (!selectedClient || !newVersion.version || !newVersion.changes) {
      toast.error('Please fill in all version fields');
      return;
    }

    try {
      const currentHistory = (selectedClient.version_history as VersionEntry[] | null) || [];
      const updatedHistory = [
        { 
          version: newVersion.version, 
          date: new Date().toISOString(), 
          changes: newVersion.changes 
        },
        ...currentHistory
      ];

      const { error } = await supabase
        .from('profiles')
        .update({ version_history: JSON.stringify(updatedHistory) })
        .eq('id', selectedClient.id);

      if (error) throw error;

      toast.success('Version added');
      setAddVersionDialogOpen(false);
      setNewVersion({ version: '', changes: '' });
      
      // Update local state
      const updatedClient = { ...selectedClient, version_history: updatedHistory };
      setSelectedClient(updatedClient);
      setClients(prev => prev.map(c => c.id === selectedClient.id ? updatedClient : c));
    } catch (error) {
      console.error('Error adding version:', error);
      toast.error('Failed to add version');
    }
  };

  const getInitials = (name: string | null) => {
    if (!name) return 'U';
    return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
  };

  if (loading) {
    return (
      <div className="grid grid-cols-1 lg:grid-cols-[320px_1fr] gap-6" aria-busy>
        <SkeletonLedger rows={6} />
        <SkeletonBlock className="h-[320px] rounded-[10px]" />
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-[320px_1fr] gap-6">
      {/* Client List Sidebar */}
      <Card className="h-fit lg:sticky lg:top-4">
        <CardHeader className="pb-3">
          <CardTitle className="text-lg flex items-center gap-2">
            <User className="w-5 h-5 text-primary" />
            Clients
          </CardTitle>
          <div className="relative mt-2">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              placeholder="Search clients..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-9"
            />
          </div>
        </CardHeader>
        <CardContent className="p-0">
          <ScrollArea className="h-[500px]">
            <div className="p-2 space-y-1">
              {filteredClients.map(client => (
                <button
                  key={client.id}
                  onClick={() => handleSelectClient(client)}
                  className={cn(
                    "w-full flex items-center gap-3 p-3 rounded-lg transition-colors text-left",
                    selectedClient?.id === client.id
                      ? "bg-primary/10 border border-primary/30"
                      : "hover:bg-muted"
                  )}
                >
                  <Avatar className="w-10 h-10">
                    <AvatarImage src={client.avatar_url || ''} />
                    <AvatarFallback className="bg-primary/10 text-primary">
                      {getInitials(client.full_name)}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium truncate">{client.full_name || 'Unknown'}</p>
                    <p className="text-xs text-muted-foreground truncate">
                      {client.customer_id || client.email}
                    </p>
                  </div>
                  {client.website_status === 'live' && (
                    <Badge variant="outline" className="bg-ok/10 text-ok border-ok/20 text-xs">
                      Live
                    </Badge>
                  )}
                </button>
              ))}
            </div>
          </ScrollArea>
        </CardContent>
      </Card>

      {/* Main Content */}
      {selectedClient ? (
        <div className="space-y-6">
          {/* Client Header */}
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-4">
                <Avatar className="w-16 h-16">
                  <AvatarImage src={selectedClient.avatar_url || ''} />
                  <AvatarFallback className="bg-primary/10 text-primary text-xl">
                    {getInitials(selectedClient.full_name)}
                  </AvatarFallback>
                </Avatar>
                <div className="flex-1">
                  <h2 className="text-xl font-bold">{selectedClient.full_name || 'Unknown'}</h2>
                  <p className="text-muted-foreground">{selectedClient.company || 'No company'}</p>
                  <div className="flex items-center gap-2 mt-1">
                    <Badge variant="outline">{selectedClient.customer_id}</Badge>
                    {selectedClient.plan && <Badge>{selectedClient.plan}</Badge>}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Website Settings */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Globe className="w-5 h-5 text-primary" />
                Website Settings
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid gap-6 md:grid-cols-2">
                {/* Website Status */}
                <div className="space-y-2">
                  <Label>Website Status</Label>
                  <Select
                    value={formData.website_status}
                    onValueChange={(value) => setFormData(prev => ({ ...prev, website_status: value }))}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select status" />
                    </SelectTrigger>
                    <SelectContent>
                      {WEBSITE_STATUS_OPTIONS.map(option => (
                        <SelectItem key={option.value} value={option.value}>
                          {option.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {/* SSL Status */}
                <div className="space-y-2">
                  <Label>SSL Status</Label>
                  <Select
                    value={formData.ssl_status}
                    onValueChange={(value) => setFormData(prev => ({ ...prev, ssl_status: value }))}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select SSL status" />
                    </SelectTrigger>
                    <SelectContent>
                      {SSL_STATUS_OPTIONS.map(option => (
                        <SelectItem key={option.value} value={option.value}>
                          {option.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {/* Preview URL */}
                <div className="space-y-2">
                  <Label>Preview URL</Label>
                  <Input
                    placeholder="example.com or https://example.com"
                    value={formData.preview_url}
                    onChange={(e) => handlePreviewUrlChange(e.target.value)}
                    className={urlError ? 'border-destructive focus-visible:ring-destructive' : ''}
                  />
                  {urlError && (
                    <p className="text-xs text-destructive">{urlError}</p>
                  )}
                </div>

                {/* Domain Name */}
                <div className="space-y-2">
                  <Label>Domain Name</Label>
                  <Input
                    placeholder="www.example.com"
                    value={formData.domain_name}
                    onChange={(e) => setFormData(prev => ({ ...prev, domain_name: e.target.value }))}
                  />
                </div>

                {/* Hosting Provider */}
                <div className="space-y-2">
                  <Label>Hosting Provider</Label>
                  <Input
                    placeholder="Quooro Cloud"
                    value={formData.hosting_provider}
                    onChange={(e) => setFormData(prev => ({ ...prev, hosting_provider: e.target.value }))}
                  />
                </div>

                {/* Site Files */}
                <div className="space-y-2">
                  <Label>Site Files URL</Label>
                  <div className="flex gap-2">
                    <Input
                      placeholder="URL to site files"
                      value={formData.site_files_url}
                      onChange={(e) => setFormData(prev => ({ ...prev, site_files_url: e.target.value }))}
                      className="flex-1"
                    />
                    <Button 
                      variant="outline" 
                      size="icon"
                      onClick={() => document.getElementById('site-files-upload')?.click()}
                      disabled={uploading}
                    >
                      {uploading ? (
                        <Loader2 className="w-4 h-4 animate-spin" />
                      ) : (
                        <Upload className="w-4 h-4" />
                      )}
                    </Button>
                    <input
                      id="site-files-upload"
                      type="file"
                      className="hidden"
                      accept=".zip,.tar,.gz"
                      onChange={handleFileUpload}
                    />
                  </div>

                  {/* Drag & drop zone */}
                  <div
                    onDragOver={(e) => { e.preventDefault(); e.stopPropagation(); setIsDragging(true); }}
                    onDragEnter={(e) => { e.preventDefault(); e.stopPropagation(); setIsDragging(true); }}
                    onDragLeave={(e) => { e.preventDefault(); e.stopPropagation(); setIsDragging(false); }}
                    onDrop={async (e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      setIsDragging(false);
                      const file = e.dataTransfer.files?.[0];
                      if (file) await uploadSiteFile(file);
                    }}
                    onClick={() => !uploading && document.getElementById('site-files-upload')?.click()}
                    className={`mt-2 flex flex-col items-center justify-center gap-2 rounded-lg border-2 border-dashed px-4 py-6 text-center cursor-pointer transition-all ${
                      isDragging
                        ? 'border-primary bg-primary/10 scale-[1.01]'
                        : 'border-border bg-muted/30 hover:border-primary/50 hover:bg-muted/50'
                    } ${uploading ? 'opacity-60 pointer-events-none' : ''}`}
                  >
                    {uploading ? (
                      <Loader2 className="w-6 h-6 animate-spin text-primary" />
                    ) : (
                      <Upload className={`w-6 h-6 ${isDragging ? 'text-primary' : 'text-muted-foreground'}`} />
                    )}
                    <div className="text-sm font-medium">
                      {uploading
                        ? 'Uploading...'
                        : isDragging
                          ? 'Release to upload'
                          : 'Drop site files here'}
                    </div>
                    <div className="text-xs text-muted-foreground">
                      Drag & drop a .zip / .tar / .gz (up to 500 MB) — or click to browse. Zip your site folder first; folders can't be uploaded directly.
                    </div>
                  </div>
                </div>
              </div>

              <div className="flex justify-end">

                <Button onClick={handleSave} disabled={saving} className="gap-2">
                  {saving ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      Saving...
                    </>
                  ) : (
                    <>
                      <Save className="w-4 h-4" />
                      Save Changes
                    </>
                  )}
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Version History */}
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="flex items-center gap-2">
                  <History className="w-5 h-5 text-primary" />
                  Version History
                </CardTitle>
                <Button variant="outline" size="sm" onClick={() => setAddVersionDialogOpen(true)} className="gap-2">
                  <Plus className="w-4 h-4" />
                  Add Version
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              {(selectedClient.version_history as VersionEntry[])?.length > 0 ? (
                <ScrollArea className="h-[250px]">
                  <div className="space-y-3 pr-4">
                    {(selectedClient.version_history as VersionEntry[]).map((entry, index) => (
                      <div key={index} className="p-3 rounded-lg border bg-muted/30">
                        <div className="flex items-center justify-between mb-1">
                          <Badge variant="outline">{entry.version}</Badge>
                          <span className="text-xs text-muted-foreground">
                            {format(new Date(entry.date), 'MMM d, yyyy')}
                          </span>
                        </div>
                        <p className="text-sm">{entry.changes}</p>
                      </div>
                    ))}
                  </div>
                </ScrollArea>
              ) : (
                <div className="flex flex-col items-center justify-center py-8 text-center">
                  <History className="w-10 h-10 text-muted-foreground/50 mb-3" />
                  <p className="text-sm text-muted-foreground">No version history yet</p>
                  <Button variant="link" size="sm" onClick={() => setAddVersionDialogOpen(true)}>
                    Add first version
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      ) : (
        <Card className="flex items-center justify-center min-h-[400px]">
          <div className="text-center">
            <Globe className="w-12 h-12 text-muted-foreground/50 mx-auto mb-4" />
            <h3 className="font-semibold text-lg mb-1">Select a Client</h3>
            <p className="text-muted-foreground">
              Choose a client from the list to manage their website settings
            </p>
          </div>
        </Card>
      )}

      {/* Add Version Dialog */}
      <Dialog open={addVersionDialogOpen} onOpenChange={setAddVersionDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add Version Entry</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 pt-4">
            <div className="space-y-2">
              <Label>Version Number</Label>
              <Input
                placeholder="e.g., v1.2.0"
                value={newVersion.version}
                onChange={(e) => setNewVersion(prev => ({ ...prev, version: e.target.value }))}
              />
            </div>
            <div className="space-y-2">
              <Label>Changes Description</Label>
              <Textarea
                placeholder="Describe the changes in this version..."
                value={newVersion.changes}
                onChange={(e) => setNewVersion(prev => ({ ...prev, changes: e.target.value }))}
                className="min-h-[100px]"
              />
            </div>
            <div className="flex justify-end gap-2 pt-2">
              <Button variant="outline" onClick={() => setAddVersionDialogOpen(false)}>
                Cancel
              </Button>
              <Button onClick={handleAddVersion}>
                Add Version
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
