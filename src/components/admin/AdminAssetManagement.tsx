import { useState, useEffect, useCallback } from 'react';
import { 
  HardDrive,
  Users,
  File,
  FileImage,
  FileVideo,
  FileAudio,
  FileText,
  FileArchive,
  Search,
  Download,
  Trash2,
  Eye,
  ChevronRight,
  TrendingUp,
  AlertTriangle,
  MoreVertical,
  RefreshCw,
  Filter,
  BarChart3,
  PieChart,
  Settings,
  Shield
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Progress } from '@/components/ui/progress';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';
import SecureImage from '@/components/SecureImage';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Slider } from '@/components/ui/slider';
import { Label } from '@/components/ui/label';

interface ClientProfile {
  user_id: string;
  full_name: string | null;
  company_name: string | null;
  email: string | null;
  avatar_url: string | null;
}

interface ClientAsset {
  id: string;
  user_id: string;
  file_name: string;
  original_name: string;
  file_path: string;
  file_type: string;
  file_size: number;
  mime_type: string;
  is_starred: boolean;
  download_count: number;
  created_at: string;
}

interface StorageQuota {
  user_id: string;
  quota_bytes: number;
  used_bytes: number;
  file_count: number;
}

interface StorageStats {
  totalUsers: number;
  totalFiles: number;
  totalStorage: number;
  averageUsage: number;
  byFileType: Record<string, { count: number; size: number }>;
  highUsageClients: Array<{ user_id: string; usage: number; quota: number }>;
}

const FILE_TYPE_ICONS: Record<string, React.ElementType> = {
  image: FileImage,
  video: FileVideo,
  audio: FileAudio,
  document: FileText,
  archive: FileArchive,
  other: File,
};

/* File-type chips on the token set — no hue map. */
const FILE_TYPE_COLORS: Record<string, string> = {
  image: 'bg-foreground/[0.08]',
  video: 'bg-foreground/[0.08]',
  audio: 'bg-foreground/[0.08]',
  document: 'bg-foreground/[0.08]',
  archive: 'bg-foreground/[0.08]',
  other: 'bg-foreground/[0.08]',
};

const formatFileSize = (bytes: number): string => {
  if (bytes === 0) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB', 'TB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
};

export default function AdminAssetManagement() {
  const [clients, setClients] = useState<ClientProfile[]>([]);
  const [quotas, setQuotas] = useState<StorageQuota[]>([]);
  const [assets, setAssets] = useState<ClientAsset[]>([]);
  const [stats, setStats] = useState<StorageStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  
  // Filters
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedClient, setSelectedClient] = useState<string | null>(null);
  const [filterType, setFilterType] = useState<string>('all');
  
  // Dialogs
  const [clientDetailOpen, setClientDetailOpen] = useState(false);
  const [assetPreviewOpen, setAssetPreviewOpen] = useState(false);
  const [quotaDialogOpen, setQuotaDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  
  // Selected items
  const [selectedClientDetail, setSelectedClientDetail] = useState<ClientProfile | null>(null);
  const [selectedAsset, setSelectedAsset] = useState<ClientAsset | null>(null);
  const [assetToDelete, setAssetToDelete] = useState<ClientAsset | null>(null);
  const [quotaToEdit, setQuotaToEdit] = useState<{ userId: string; currentQuota: number } | null>(null);
  const [newQuotaGB, setNewQuotaGB] = useState(5);

  const fetchData = useCallback(async () => {
    try {
      // Fetch clients with their storage info
      const { data: clientsData } = await supabase
        .from('profiles')
        .select('user_id, full_name, email, avatar_url')
        .order('full_name');
      
      // Fetch all quotas - cast to any since types may not be generated yet
      const { data: quotasData } = await (supabase
        .from('storage_quotas' as any)
        .select('*') as any);
      
      // Fetch all assets - cast to any since types may not be generated yet
      const { data: assetsData } = await (supabase
        .from('client_assets' as any)
        .select('*')
        .order('created_at', { ascending: false }) as any);
      
      // Map clients to include company_name field
      const mappedClients = (clientsData || []).map((c: any) => ({
        ...c,
        company_name: null
      }));
      
      setClients(mappedClients);
      setQuotas(quotasData || []);
      setAssets(assetsData || []);
      
      // Calculate stats
      if (quotasData && assetsData) {
        const byFileType: Record<string, { count: number; size: number }> = {};
        assetsData.forEach(asset => {
          if (!byFileType[asset.file_type]) {
            byFileType[asset.file_type] = { count: 0, size: 0 };
          }
          byFileType[asset.file_type].count++;
          byFileType[asset.file_type].size += asset.file_size;
        });
        
        const highUsageClients = quotasData
          .filter(q => q.used_bytes / q.quota_bytes > 0.7)
          .map(q => ({ user_id: q.user_id, usage: q.used_bytes, quota: q.quota_bytes }))
          .sort((a, b) => (b.usage / b.quota) - (a.usage / a.quota));
        
        setStats({
          totalUsers: quotasData.length,
          totalFiles: assetsData.length,
          totalStorage: quotasData.reduce((sum, q) => sum + q.used_bytes, 0),
          averageUsage: quotasData.length > 0 
            ? quotasData.reduce((sum, q) => sum + (q.used_bytes / q.quota_bytes), 0) / quotasData.length * 100
            : 0,
          byFileType,
          highUsageClients,
        });
      }
    } catch (error) {
      console.error('Error fetching data:', error);
      toast.error('Failed to load asset data');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const handleRefresh = () => {
    setRefreshing(true);
    fetchData();
  };

  const getClientInfo = (userId: string) => {
    return clients.find(c => c.user_id === userId);
  };

  const getClientQuota = (userId: string) => {
    return quotas.find(q => q.user_id === userId);
  };

  const handleViewClientAssets = (client: ClientProfile) => {
    setSelectedClientDetail(client);
    setSelectedClient(client.user_id);
    setClientDetailOpen(true);
  };

  const handlePreviewAsset = (asset: ClientAsset) => {
    setSelectedAsset(asset);
    setAssetPreviewOpen(true);
  };

  const handleDownloadAsset = async (asset: ClientAsset) => {
    try {
      const { data, error } = await supabase.storage
        .from('client-assets')
        .createSignedUrl(asset.file_path, 60);
      
      if (error) throw error;
      
      const a = document.createElement('a');
      a.href = data.signedUrl;
      a.download = asset.original_name;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      
      toast.success('Download started');
    } catch (error) {
      console.error('Download error:', error);
      toast.error('Failed to download file');
    }
  };

  const handleDeleteAsset = async () => {
    if (!assetToDelete) return;
    
    try {
      await supabase.storage.from('client-assets').remove([assetToDelete.file_path]);
      await (supabase.from('client_assets' as any).delete().eq('id', assetToDelete.id) as any);
      
      toast.success('Asset deleted');
      setDeleteDialogOpen(false);
      setAssetToDelete(null);
      fetchData();
    } catch (error) {
      console.error('Delete error:', error);
      toast.error('Failed to delete asset');
    }
  };

  const handleUpdateQuota = async () => {
    if (!quotaToEdit) return;
    
    try {
      const newQuotaBytes = newQuotaGB * 1024 * 1024 * 1024;
      
      const { error } = await (supabase
        .from('storage_quotas' as any)
        .update({ quota_bytes: newQuotaBytes })
        .eq('user_id', quotaToEdit.userId) as any);
      
      if (error) throw error;
      
      toast.success('Quota updated');
      setQuotaDialogOpen(false);
      setQuotaToEdit(null);
      fetchData();
    } catch (error) {
      console.error('Quota update error:', error);
      toast.error('Failed to update quota');
    }
  };

  const openQuotaDialog = (userId: string, currentQuota: number) => {
    setQuotaToEdit({ userId, currentQuota });
    setNewQuotaGB(Math.round(currentQuota / (1024 * 1024 * 1024)));
    setQuotaDialogOpen(true);
  };

  // Filter assets
  const filteredAssets = assets.filter(asset => {
    if (selectedClient && asset.user_id !== selectedClient) return false;
    if (filterType !== 'all' && asset.file_type !== filterType) return false;
    if (searchQuery) {
      const client = getClientInfo(asset.user_id);
      const searchLower = searchQuery.toLowerCase();
      return (
        asset.original_name.toLowerCase().includes(searchLower) ||
        client?.full_name?.toLowerCase().includes(searchLower) ||
        client?.company_name?.toLowerCase().includes(searchLower)
      );
    }
    return true;
  });

  // Client assets for detail view
  const clientAssets = selectedClientDetail 
    ? assets.filter(a => a.user_id === selectedClientDetail.user_id)
    : [];

  if (loading) {
    return (
      <div className="p-6 space-y-6">
        <div className="h-8 w-48 bg-muted animate-pulse rounded" />
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          {[1, 2, 3, 4].map(i => (
            <div key={i} className="h-32 bg-muted animate-pulse rounded-xl" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Asset Management</h1>
          <p className="text-muted-foreground">
            Manage client file storage and quotas across the platform.
          </p>
        </div>
        <Button variant="outline" onClick={handleRefresh} disabled={refreshing}>
          <RefreshCw className={`w-4 h-4 mr-2 ${refreshing ? 'animate-spin' : ''}`} />
          Refresh
        </Button>
      </div>

      {/* Stats Overview */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="rounded-[10px] border border-border/60 bg-card p-5">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground">Total Storage Used</p>
              <p className="text-2xl font-bold mt-1">{formatFileSize(stats?.totalStorage || 0)}</p>
            </div>
            <div className="p-3 rounded-xl bg-primary/10">
              <HardDrive className="w-5 h-5 text-primary" />
            </div>
          </div>
        </div>
        
        <div className="rounded-[10px] border border-border/60 bg-card p-5">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground">Total Files</p>
              <p className="text-2xl font-bold mt-1">{stats?.totalFiles || 0}</p>
            </div>
            <div className="p-3 rounded-xl bg-sunken">
              <File className="w-5 h-5 text-muted-foreground" />
            </div>
          </div>
        </div>
        
        <div className="rounded-[10px] border border-border/60 bg-card p-5">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground">Active Users</p>
              <p className="text-2xl font-bold mt-1">{stats?.totalUsers || 0}</p>
            </div>
            <div className="p-3 rounded-xl bg-sunken">
              <Users className="w-5 h-5 text-muted-foreground" />
            </div>
          </div>
        </div>
        
        <div className="rounded-[10px] border border-border/60 bg-card p-5">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground">Avg. Usage</p>
              <p className="text-2xl font-bold mt-1">{(stats?.averageUsage || 0).toFixed(1)}%</p>
            </div>
            <div className="p-3 rounded-xl bg-sunken">
              <TrendingUp className="w-5 h-5 text-muted-foreground" />
            </div>
          </div>
        </div>
      </div>

      {/* File Type Breakdown */}
      {stats?.byFileType && Object.keys(stats.byFileType).length > 0 && (
        <div className="rounded-[10px] border border-border/60 bg-card p-5">
          <div className="flex items-center gap-2 mb-4">
            <PieChart className="w-5 h-5 text-primary" />
            <h3 className="font-semibold">Storage by File Type</h3>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4">
            {Object.entries(stats.byFileType).map(([type, data]) => {
              const Icon = FILE_TYPE_ICONS[type] || File;
              const bgColor = FILE_TYPE_COLORS[type] || 'bg-muted';
              return (
                <div key={type} className="text-center">
                  <div className={`w-12 h-12 ${bgColor} rounded-xl flex items-center justify-center mx-auto mb-2`}>
                    <Icon className="w-6 h-6 text-ink-2" />
                  </div>
                  <p className="text-sm font-medium capitalize">{type}</p>
                  <p className="text-xs text-muted-foreground">{data.count} files</p>
                  <p className="text-xs text-muted-foreground">{formatFileSize(data.size)}</p>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* High Usage Alerts */}
      {stats?.highUsageClients && stats.highUsageClients.length > 0 && (
        <div className="rounded-[10px] border border-attend/30 bg-attend/[0.06] p-5">
          <div className="flex items-center gap-2 mb-4">
            <AlertTriangle className="w-5 h-5 text-attend" />
            <h3 className="font-semibold text-attend">High usage clients</h3>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {stats.highUsageClients.slice(0, 6).map(client => {
              const info = getClientInfo(client.user_id);
              const percentage = (client.usage / client.quota) * 100;
              return (
                <div key={client.user_id} className="flex items-center gap-3 p-3 rounded-xl bg-background/50">
                  <div className="flex-1 min-w-0">
                    <p className="font-medium truncate">{info?.full_name || info?.email || 'Unknown'}</p>
                    <div className="flex items-center gap-2 mt-1">
                      <Progress value={percentage} className="h-2 flex-1" />
                      <span className="text-xs text-muted-foreground">{percentage.toFixed(0)}%</span>
                    </div>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => openQuotaDialog(client.user_id, client.quota)}
                  >
                    <Settings className="w-4 h-4" />
                  </Button>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder="Search files or clients..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9"
          />
        </div>
        
        <Select value={selectedClient || 'all'} onValueChange={(v) => setSelectedClient(v === 'all' ? null : v)}>
          <SelectTrigger className="w-full sm:w-48">
            <SelectValue placeholder="All Clients" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Clients</SelectItem>
            {clients.map(client => (
              <SelectItem key={client.user_id} value={client.user_id}>
                {client.full_name || client.email || 'Unknown'}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        
        <Select value={filterType} onValueChange={setFilterType}>
          <SelectTrigger className="w-full sm:w-40">
            <SelectValue placeholder="All Types" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Types</SelectItem>
            <SelectItem value="image">Images</SelectItem>
            <SelectItem value="video">Videos</SelectItem>
            <SelectItem value="audio">Audio</SelectItem>
            <SelectItem value="document">Documents</SelectItem>
            <SelectItem value="archive">Archives</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Client List with Storage Info */}
      <div className="rounded-[10px] border border-border/60 overflow-hidden">
        <div className="p-4 bg-muted/30 border-b border-border/50">
          <h3 className="font-semibold">Client Storage Overview</h3>
        </div>
        <ScrollArea className="h-[400px]">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Client</TableHead>
                <TableHead>Files</TableHead>
                <TableHead>Storage Used</TableHead>
                <TableHead>Quota</TableHead>
                <TableHead>Usage</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {clients.map(client => {
                const quota = getClientQuota(client.user_id);
                const clientFileCount = assets.filter(a => a.user_id === client.user_id).length;
                const usagePercent = quota ? (quota.used_bytes / quota.quota_bytes) * 100 : 0;
                
                return (
                  <TableRow key={client.user_id}>
                    <TableCell>
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-sm font-medium">
                          {client.full_name?.[0] || client.email?.[0] || '?'}
                        </div>
                        <div>
                          <p className="font-medium">{client.full_name || 'Unknown'}</p>
                          <p className="text-xs text-muted-foreground">{client.company_name || client.email}</p>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>{quota?.file_count || clientFileCount || 0}</TableCell>
                    <TableCell>{formatFileSize(quota?.used_bytes || 0)}</TableCell>
                    <TableCell>{formatFileSize(quota?.quota_bytes || 5368709120)}</TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Progress value={usagePercent} className="w-20 h-2" />
                        <span className="text-xs text-muted-foreground">{usagePercent.toFixed(0)}%</span>
                      </div>
                    </TableCell>
                    <TableCell className="text-right">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon">
                            <MoreVertical className="w-4 h-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem onClick={() => handleViewClientAssets(client)}>
                            <Eye className="w-4 h-4 mr-2" />
                            View Assets
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => openQuotaDialog(client.user_id, quota?.quota_bytes || 5368709120)}>
                            <Settings className="w-4 h-4 mr-2" />
                            Adjust Quota
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </ScrollArea>
      </div>

      {/* Recent Assets */}
      <div className="rounded-[10px] border border-border/60 overflow-hidden">
        <div className="p-4 bg-muted/30 border-b border-border/50 flex items-center justify-between">
          <h3 className="font-semibold">
            {selectedClient ? 'Filtered Assets' : 'Recent Assets'}
            <Badge variant="secondary" className="ml-2">{filteredAssets.length}</Badge>
          </h3>
        </div>
        <ScrollArea className="h-[400px]">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>File</TableHead>
                <TableHead>Client</TableHead>
                <TableHead>Type</TableHead>
                <TableHead>Size</TableHead>
                <TableHead>Uploaded</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredAssets.slice(0, 50).map(asset => {
                const client = getClientInfo(asset.user_id);
                const Icon = FILE_TYPE_ICONS[asset.file_type] || File;
                
                return (
                  <TableRow key={asset.id}>
                    <TableCell>
                      <div className="flex items-center gap-3">
                        <Icon className="w-5 h-5 text-muted-foreground" />
                        <span className="font-medium truncate max-w-[200px]">{asset.original_name}</span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <span className="text-sm">{client?.full_name || client?.email || 'Unknown'}</span>
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline" className="capitalize">{asset.file_type}</Badge>
                    </TableCell>
                    <TableCell>{formatFileSize(asset.file_size)}</TableCell>
                    <TableCell>
                      {new Date(asset.created_at).toLocaleDateString()}
                    </TableCell>
                    <TableCell className="text-right">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon">
                            <MoreVertical className="w-4 h-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          {asset.file_type === 'image' && (
                            <DropdownMenuItem onClick={() => handlePreviewAsset(asset)}>
                              <Eye className="w-4 h-4 mr-2" />
                              Preview
                            </DropdownMenuItem>
                          )}
                          <DropdownMenuItem onClick={() => handleDownloadAsset(asset)}>
                            <Download className="w-4 h-4 mr-2" />
                            Download
                          </DropdownMenuItem>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem 
                            className="text-destructive"
                            onClick={() => {
                              setAssetToDelete(asset);
                              setDeleteDialogOpen(true);
                            }}
                          >
                            <Trash2 className="w-4 h-4 mr-2" />
                            Delete
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </ScrollArea>
      </div>

      {/* Client Detail Dialog */}
      <Dialog open={clientDetailOpen} onOpenChange={setClientDetailOpen}>
        <DialogContent className="sm:max-w-3xl max-h-[80vh] overflow-hidden flex flex-col">
          <DialogHeader>
            <DialogTitle>
              {selectedClientDetail?.full_name || selectedClientDetail?.email}'s Assets
            </DialogTitle>
            <DialogDescription>
              {clientAssets.length} files • {formatFileSize(clientAssets.reduce((sum, a) => sum + a.file_size, 0))} total
            </DialogDescription>
          </DialogHeader>
          <ScrollArea className="flex-1 -mx-6 px-6">
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 pb-4">
              {clientAssets.map(asset => {
                const Icon = FILE_TYPE_ICONS[asset.file_type] || File;
                return (
                  <div
                    key={asset.id}
                    className="group relative aspect-square rounded-xl border border-border/50 overflow-hidden cursor-pointer hover:border-primary/30 transition-all"
                    onClick={() => asset.file_type === 'image' && handlePreviewAsset(asset)}
                  >
                    {asset.file_type === 'image' ? (
                      <SecureImage
                        src={asset.file_path}
                        bucket="client-assets"
                        alt={asset.original_name}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="w-full h-full flex flex-col items-center justify-center bg-muted/30">
                        <Icon className="w-10 h-10 text-muted-foreground" />
                        <span className="text-xs text-muted-foreground mt-2 text-center px-2 line-clamp-2">
                          {asset.original_name}
                        </span>
                      </div>
                    )}
                    <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                      <Button size="icon" variant="secondary" onClick={(e) => { e.stopPropagation(); handleDownloadAsset(asset); }}>
                        <Download className="w-4 h-4" />
                      </Button>
                      <Button 
                        size="icon" 
                        variant="destructive"
                        onClick={(e) => {
                          e.stopPropagation();
                          setAssetToDelete(asset);
                          setDeleteDialogOpen(true);
                        }}
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                );
              })}
            </div>
          </ScrollArea>
        </DialogContent>
      </Dialog>

      {/* Asset Preview Dialog */}
      <Dialog open={assetPreviewOpen} onOpenChange={setAssetPreviewOpen}>
        <DialogContent className="sm:max-w-2xl p-0 overflow-hidden">
          {selectedAsset && (
            <>
              <div className="relative aspect-video bg-muted">
                <SecureImage
                  src={selectedAsset.file_path}
                  bucket="client-assets"
                  alt={selectedAsset.original_name}
                  className="w-full h-full object-contain"
                />
              </div>
              <div className="p-4">
                <h3 className="font-semibold">{selectedAsset.original_name}</h3>
                <p className="text-sm text-muted-foreground">
                  {formatFileSize(selectedAsset.file_size)} • {new Date(selectedAsset.created_at).toLocaleDateString()}
                </p>
                <div className="flex gap-2 mt-4">
                  <Button onClick={() => handleDownloadAsset(selectedAsset)} className="flex-1">
                    <Download className="w-4 h-4 mr-2" />
                    Download
                  </Button>
                </div>
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>

      {/* Quota Edit Dialog */}
      <Dialog open={quotaDialogOpen} onOpenChange={setQuotaDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Adjust Storage Quota</DialogTitle>
            <DialogDescription>
              Set the storage limit for this client.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-6 pt-4">
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <Label>Storage Quota</Label>
                <span className="text-2xl font-bold">{newQuotaGB} GB</span>
              </div>
              <Slider
                value={[newQuotaGB]}
                onValueChange={([value]) => setNewQuotaGB(value)}
                min={1}
                max={50}
                step={1}
              />
              <div className="flex justify-between text-xs text-muted-foreground">
                <span>1 GB</span>
                <span>50 GB</span>
              </div>
            </div>
            <Button onClick={handleUpdateQuota} className="w-full">
              Update Quota
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Asset?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete "{assetToDelete?.original_name}". This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDeleteAsset} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
