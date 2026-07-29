import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import JSZip from 'jszip';
import {
  Upload,
  FolderPlus,
  Folder,
  File,
  FileText,
  FileImage,
  FileVideo,
  FileAudio,
  FileArchive,
  Tag,
  Trash2,
  Star,
  StarOff,
  Download,
  Search,
  Grid3X3,
  List,
  MoreVertical,
  ChevronRight,
  Home,
  Filter,
  Lock,
  Check,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Progress } from '@/components/ui/progress';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';
import SecureImage from '@/components/SecureImage';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
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
import { cn } from '@/lib/utils';
import {
  PageHeader, Panel, PanelHeader, StatusBadge, EmptyState,
  FIELD, FIELD_LABEL,
} from '@/components/platform';

interface AssetFolder {
  id: string;
  name: string;
  parent_id: string | null;
  color: string;
  created_at: string;
}

interface AssetTag {
  id: string;
  name: string;
  color: string;
}

interface ClientAsset {
  id: string;
  folder_id: string | null;
  file_name: string;
  original_name: string;
  file_path: string;
  file_type: string;
  file_size: number;
  mime_type: string;
  description: string | null;
  is_starred: boolean;
  download_count: number;
  created_at: string;
  tags?: AssetTag[];
}

interface StorageQuota {
  quota_bytes: number;
  used_bytes: number;
  file_count: number;
}

const FILE_TYPE_ICONS: Record<string, React.ElementType> = {
  image: FileImage,
  video: FileVideo,
  audio: FileAudio,
  document: FileText,
  archive: FileArchive,
  other: File,
};

const getFileType = (mimeType: string): string => {
  if (mimeType.startsWith('image/')) return 'image';
  if (mimeType.startsWith('video/')) return 'video';
  if (mimeType.startsWith('audio/')) return 'audio';
  if (mimeType.includes('pdf') || mimeType.includes('document') || mimeType.includes('sheet') || mimeType.includes('presentation') || mimeType.includes('text')) return 'document';
  if (mimeType.includes('zip') || mimeType.includes('rar') || mimeType.includes('7z')) return 'archive';
  return 'other';
};

const formatFileSize = (bytes: number): string => {
  if (bytes === 0) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
};

// Stored folder/tag colour values (written to the database, displayed as data).
const SWATCHES = ['#6366f1', '#ec4899', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6'];

export default function LoungeAssetStorage() {
  const { user } = useAuth();
  const [assets, setAssets] = useState<ClientAsset[]>([]);
  const [folders, setFolders] = useState<AssetFolder[]>([]);
  const [tags, setTags] = useState<AssetTag[]>([]);
  const [quota, setQuota] = useState<StorageQuota | null>(null);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);

  // Navigation
  const [currentFolderId, setCurrentFolderId] = useState<string | null>(null);
  const [breadcrumbs, setBreadcrumbs] = useState<AssetFolder[]>([]);
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [searchQuery, setSearchQuery] = useState('');
  const [filterTag, setFilterTag] = useState<string | null>(null);
  const [filterType, setFilterType] = useState<string | null>(null);

  // Dialogs
  const [uploadDialogOpen, setUploadDialogOpen] = useState(false);
  const [folderDialogOpen, setFolderDialogOpen] = useState(false);
  const [tagDialogOpen, setTagDialogOpen] = useState(false);
  const [assetDetailOpen, setAssetDetailOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);

  // Form states
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [uploadDescription, setUploadDescription] = useState('');
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [newFolderName, setNewFolderName] = useState('');
  const [newFolderColor, setNewFolderColor] = useState('#6366f1');
  const [newTagName, setNewTagName] = useState('');
  const [newTagColor, setNewTagColor] = useState('#6366f1');
  const [selectedAsset, setSelectedAsset] = useState<ClientAsset | null>(null);
  const [itemToDelete, setItemToDelete] = useState<{ type: 'asset' | 'folder'; id: string; name: string } | null>(null);

  const fetchData = useCallback(async () => {
    if (!user) return;

    try {
      // Fetch folders - cast to any since types may not be generated yet
      const { data: foldersData } = await (supabase
        .from('asset_folders' as any)
        .select('*')
        .order('name') as any);

      // Fetch tags - cast to any since types may not be generated yet
      const { data: tagsData } = await (supabase
        .from('asset_tags' as any)
        .select('*')
        .order('name') as any);

      // Fetch assets - cast to any since types may not be generated yet
      const { data: assetsData } = await (supabase
        .from('client_assets' as any)
        .select('*')
        .order('created_at', { ascending: false }) as any);

      // Fetch quota - cast to any since types may not be generated yet
      const { data: quotaData } = await (supabase
        .from('storage_quotas' as any)
        .select('*')
        .eq('user_id', user.id)
        .single() as any);

      setFolders((foldersData || []) as AssetFolder[]);
      setTags((tagsData || []) as AssetTag[]);
      setAssets((assetsData || []) as ClientAsset[]);
      setQuota(quotaData || { quota_bytes: 5368709120, used_bytes: 0, file_count: 0 });
    } catch (error) {
      console.error('Error fetching data:', error);
      toast.error('Your assets did not load. Refresh to try again.');
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // Build breadcrumbs when folder changes
  useEffect(() => {
    const buildBreadcrumbs = () => {
      if (!currentFolderId) {
        setBreadcrumbs([]);
        return;
      }

      const path: AssetFolder[] = [];
      let folderId: string | null = currentFolderId;

      while (folderId) {
        const folder = folders.find(f => f.id === folderId);
        if (folder) {
          path.unshift(folder);
          folderId = folder.parent_id;
        } else {
          break;
        }
      }

      setBreadcrumbs(path);
    };

    buildBreadcrumbs();
  }, [currentFolderId, folders]);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    if (quota && files.reduce((acc, f) => acc + f.size, 0) + quota.used_bytes > quota.quota_bytes) {
      toast.error('These files would exceed your storage quota');
      return;
    }
    setSelectedFiles(files);
  };

  const handleUpload = async () => {
    if (selectedFiles.length === 0 || !user) return;

    setUploading(true);
    setUploadProgress(0);

    try {
      const totalFiles = selectedFiles.length;
      let uploaded = 0;

      for (const file of selectedFiles) {
        const fileExt = file.name.split('.').pop();
        const fileName = `${Date.now()}-${Math.random().toString(36).substring(7)}.${fileExt}`;
        const filePath = `${user.id}/${currentFolderId || 'root'}/${fileName}`;

        // Upload to storage
        const { error: uploadError } = await supabase.storage
          .from('client-assets')
          .upload(filePath, file);

        if (uploadError) throw uploadError;

        // Create asset record - cast to any since types may not be generated yet
        const { data: assetData, error: dbError } = await (supabase
          .from('client_assets' as any)
          .insert({
            user_id: user.id,
            folder_id: currentFolderId,
            file_name: fileName,
            original_name: file.name,
            file_path: filePath,
            file_type: getFileType(file.type),
            file_size: file.size,
            mime_type: file.type,
            description: uploadDescription || null,
          })
          .select()
          .single() as any);

        if (dbError) throw dbError;

        // Assign tags - cast to any since types may not be generated yet
        if (selectedTags.length > 0 && assetData) {
          await (supabase
            .from('asset_tag_assignments' as any)
            .insert(selectedTags.map(tagId => ({
              asset_id: assetData.id,
              tag_id: tagId,
            }))) as any);
        }

        uploaded++;
        setUploadProgress((uploaded / totalFiles) * 100);
      }

      toast.success(`${totalFiles} ${totalFiles > 1 ? 'files' : 'file'} uploaded`);
      setUploadDialogOpen(false);
      setSelectedFiles([]);
      setUploadDescription('');
      setSelectedTags([]);
      fetchData();
    } catch (error) {
      console.error('Upload error:', error);
      toast.error('The upload failed. Try again.');
    } finally {
      setUploading(false);
      setUploadProgress(0);
    }
  };

  const handleCreateFolder = async () => {
    if (!newFolderName.trim() || !user) return;

    try {
      const { error } = await (supabase
        .from('asset_folders' as any)
        .insert({
          user_id: user.id,
          name: newFolderName.trim(),
          parent_id: currentFolderId,
          color: newFolderColor,
        }) as any);

      if (error) throw error;

      toast.success('Folder created');
      setFolderDialogOpen(false);
      setNewFolderName('');
      fetchData();
    } catch (error) {
      console.error('Error creating folder:', error);
      toast.error('The folder was not created. Try again.');
    }
  };

  const handleCreateTag = async () => {
    if (!newTagName.trim() || !user) return;

    try {
      const { error } = await (supabase
        .from('asset_tags' as any)
        .insert({
          user_id: user.id,
          name: newTagName.trim(),
          color: newTagColor,
        }) as any);

      if (error) throw error;

      toast.success('Tag created');
      setTagDialogOpen(false);
      setNewTagName('');
      fetchData();
    } catch (error) {
      console.error('Error creating tag:', error);
      toast.error('The tag was not created. Try again.');
    }
  };

  const handleDownload = async (asset: ClientAsset) => {
    try {
      const { data, error } = await supabase.storage
        .from('client-assets')
        .createSignedUrl(asset.file_path, 60);

      if (error) throw error;

      // Update download count - cast to any since types may not be generated yet
      await (supabase
        .from('client_assets' as any)
        .update({
          download_count: asset.download_count + 1,
          last_accessed_at: new Date().toISOString()
        })
        .eq('id', asset.id) as any);

      // Trigger download
      const a = document.createElement('a');
      a.href = data.signedUrl;
      a.download = asset.original_name;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);

      toast.success('Download started');
    } catch (error) {
      console.error('Download error:', error);
      toast.error('The download failed. Try again.');
    }
  };

  const handleExportFolder = async (folder: AssetFolder) => {
    try {
      toast.info('Preparing folder export');

      // Get all assets in this folder
      const folderAssets = assets.filter(a => a.folder_id === folder.id);

      if (folderAssets.length === 0) {
        toast.warning('This folder is empty');
        return;
      }

      const zip = new JSZip();

      // Download each file and add to zip
      for (const asset of folderAssets) {
        try {
          const { data: signedUrlData, error: urlError } = await supabase.storage
            .from('client-assets')
            .createSignedUrl(asset.file_path, 300); // 5 min expiry

          if (urlError || !signedUrlData?.signedUrl) {
            console.error('Failed to get signed URL for:', asset.original_name);
            continue;
          }

          const response = await fetch(signedUrlData.signedUrl);
          if (!response.ok) continue;

          const blob = await response.blob();
          zip.file(asset.original_name, blob);
        } catch (err) {
          console.error('Error fetching file:', asset.original_name, err);
        }
      }

      // Generate zip file
      const content = await zip.generateAsync({ type: 'blob' });

      // Download zip
      const url = URL.createObjectURL(content);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${folder.name}.zip`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);

      toast.success(`Exported ${folderAssets.length} files`);
    } catch (error) {
      console.error('Export error:', error);
      toast.error('The export failed. Try again.');
    }
  };

  const handleToggleStar = async (asset: ClientAsset) => {
    try {
      const { error } = await (supabase
        .from('client_assets' as any)
        .update({ is_starred: !asset.is_starred })
        .eq('id', asset.id) as any);

      if (error) throw error;
      fetchData();
    } catch (error) {
      console.error('Error toggling star:', error);
    }
  };

  const handleDelete = async () => {
    if (!itemToDelete) return;

    try {
      if (itemToDelete.type === 'asset') {
        const asset = assets.find(a => a.id === itemToDelete.id);
        if (asset) {
          await supabase.storage.from('client-assets').remove([asset.file_path]);
          await (supabase.from('client_assets' as any).delete().eq('id', itemToDelete.id) as any);
        }
      } else {
        await (supabase.from('asset_folders' as any).delete().eq('id', itemToDelete.id) as any);
      }

      toast.success(`${itemToDelete.type === 'asset' ? 'File' : 'Folder'} deleted`);
      setDeleteDialogOpen(false);
      setItemToDelete(null);
      setSelectedAsset(null);
      setAssetDetailOpen(false);
      fetchData();
    } catch (error) {
      console.error('Delete error:', error);
      toast.error('Delete failed. Try again.');
    }
  };

  // Filter assets for current view
  const currentFolders = folders.filter(f => f.parent_id === currentFolderId);
  const currentAssets = assets.filter(a => {
    if (a.folder_id !== currentFolderId) return false;
    if (searchQuery && !a.original_name.toLowerCase().includes(searchQuery.toLowerCase())) return false;
    if (filterTag && !a.tags?.some(t => t.id === filterTag)) return false;
    if (filterType && a.file_type !== filterType) return false;
    return true;
  });

  const quotaPercentage = quota ? (quota.used_bytes / quota.quota_bytes) * 100 : 0;

  return (
    <div className="mx-auto max-w-[1024px] px-5 py-7 lg:px-8">
      <PageHeader
        kicker="Client portal"
        title="Asset storage"
        description="Store and organise your files securely"
        actions={
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" className="h-8 gap-1.5 rounded-lg px-3 text-xs" onClick={() => setFolderDialogOpen(true)}>
              <FolderPlus className="h-3.5 w-3.5" />
              <span className="hidden sm:inline">New folder</span>
            </Button>
            <Button variant="outline" size="sm" className="h-8 gap-1.5 rounded-lg px-3 text-xs" onClick={() => setTagDialogOpen(true)}>
              <Tag className="h-3.5 w-3.5" />
              <span className="hidden sm:inline">New tag</span>
            </Button>
            <Button className="h-8 gap-1.5 rounded-lg px-3 text-xs" onClick={() => setUploadDialogOpen(true)}>
              <Upload className="h-3.5 w-3.5" />
              Upload files
            </Button>
          </div>
        }
      />

      {/* Folder dialog */}
      <Dialog open={folderDialogOpen} onOpenChange={setFolderDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>New folder</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 pt-4">
            <div className="space-y-1.5">
              <Label className={FIELD_LABEL}>Folder name</Label>
              <Input
                className={FIELD}
                placeholder="My documents"
                value={newFolderName}
                onChange={(e) => setNewFolderName(e.target.value)}
              />
            </div>
            <div className="space-y-1.5">
              <Label className={FIELD_LABEL}>Colour</Label>
              <div className="flex gap-2">
                {SWATCHES.map(color => (
                  <button
                    key={color}
                    type="button"
                    aria-label={`Folder colour ${color}`}
                    className={`h-8 w-8 rounded-full transition-transform duration-150 ${newFolderColor === color ? 'ring-2 ring-primary ring-offset-2' : ''}`}
                    style={{ backgroundColor: color }}
                    onClick={() => setNewFolderColor(color)}
                  />
                ))}
              </div>
            </div>
            <Button onClick={handleCreateFolder} className="h-9 w-full rounded-lg text-xs">
              Create folder
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Tag dialog */}
      <Dialog open={tagDialogOpen} onOpenChange={setTagDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>New tag</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 pt-4">
            <div className="space-y-1.5">
              <Label className={FIELD_LABEL}>Tag name</Label>
              <Input
                className={FIELD}
                placeholder="Important"
                value={newTagName}
                onChange={(e) => setNewTagName(e.target.value)}
              />
            </div>
            <div className="space-y-1.5">
              <Label className={FIELD_LABEL}>Colour</Label>
              <div className="flex gap-2">
                {SWATCHES.map(color => (
                  <button
                    key={color}
                    type="button"
                    aria-label={`Tag colour ${color}`}
                    className={`h-8 w-8 rounded-full transition-transform duration-150 ${newTagColor === color ? 'ring-2 ring-primary ring-offset-2' : ''}`}
                    style={{ backgroundColor: color }}
                    onClick={() => setNewTagColor(color)}
                  />
                ))}
              </div>
            </div>
            <Button onClick={handleCreateTag} className="h-9 w-full rounded-lg text-xs">
              Create tag
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Upload dialog */}
      <Dialog open={uploadDialogOpen} onOpenChange={setUploadDialogOpen}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>Upload files</DialogTitle>
            <DialogDescription>
              Files upload to your secure storage. Up to 50MB per file.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 pt-4">
            <div className="space-y-1.5">
              <Label className={FIELD_LABEL}>Files</Label>
              {selectedFiles.length > 0 ? (
                <div className="space-y-2 rounded-[10px] border border-border/60 p-3">
                  {selectedFiles.map((file, i) => (
                    <div key={i} className="flex items-center justify-between text-sm">
                      <span className="truncate">{file.name}</span>
                      <span className="font-mono text-xs tabular-nums text-muted-foreground">{formatFileSize(file.size)}</span>
                    </div>
                  ))}
                  <Button
                    variant="outline"
                    size="sm"
                    className="mt-2 h-8 w-full rounded-lg text-xs"
                    onClick={() => setSelectedFiles([])}
                  >
                    Clear selection
                  </Button>
                </div>
              ) : (
                <label className="flex h-32 w-full cursor-pointer flex-col items-center justify-center rounded-[10px] border border-dashed border-border transition-colors duration-150 hover:border-primary/50 hover:bg-foreground/[0.02]">
                  <Upload className="mb-2 h-5 w-5 text-muted-foreground" />
                  <span className="text-sm text-muted-foreground">Click or drag files here</span>
                  <input
                    type="file"
                    multiple
                    className="hidden"
                    onChange={handleFileSelect}
                  />
                </label>
              )}
            </div>

            <div className="space-y-1.5">
              <Label className={FIELD_LABEL}>Description (optional)</Label>
              <Textarea
                placeholder="Add a description for these files"
                value={uploadDescription}
                onChange={(e) => setUploadDescription(e.target.value)}
                rows={2}
                className="rounded-xl border-border/60 bg-foreground/[0.03] text-[14px] shadow-none focus-visible:border-primary/60 focus-visible:ring-1 focus-visible:ring-primary/30 dark:bg-foreground/[0.05]"
              />
            </div>

            {tags.length > 0 && (
              <div className="space-y-1.5">
                <Label className={FIELD_LABEL}>Tags</Label>
                <div className="flex flex-wrap gap-2">
                  {tags.map(tag => (
                    <button
                      key={tag.id}
                      type="button"
                      onClick={() => setSelectedTags(prev =>
                        prev.includes(tag.id)
                          ? prev.filter(t => t !== tag.id)
                          : [...prev, tag.id]
                      )}
                      className={`rounded-full px-3 py-1 text-sm transition-all duration-150 ${
                        selectedTags.includes(tag.id)
                          ? 'ring-2 ring-primary ring-offset-2'
                          : 'opacity-60 hover:opacity-100'
                      }`}
                      style={{ backgroundColor: `${tag.color}20`, color: tag.color }}
                    >
                      {tag.name}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {uploading && (
              <div className="space-y-2">
                <Progress value={uploadProgress} />
                <p className="text-center font-mono text-xs tabular-nums text-muted-foreground">
                  Uploading {Math.round(uploadProgress)}%
                </p>
              </div>
            )}

            <Button
              onClick={handleUpload}
              className="h-9 w-full rounded-lg text-xs"
              disabled={selectedFiles.length === 0 || uploading}
            >
              {uploading ? 'Uploading' : `Upload ${selectedFiles.length} ${selectedFiles.length !== 1 ? 'files' : 'file'}`}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Storage quota */}
      <Panel className="mt-6">
        <PanelHeader label="Storage">
          <StatusBadge tone="ok" label="Encrypted" />
        </PanelHeader>
        <div className="p-4">
          <div className="mb-3 flex items-center justify-between gap-4">
            <p className="text-[13px] text-muted-foreground">
              <span className="font-mono tabular-nums text-foreground">{formatFileSize(quota?.used_bytes || 0)}</span>
              {' '}of{' '}
              <span className="font-mono tabular-nums">{formatFileSize(quota?.quota_bytes || 5368709120)}</span> used
            </p>
            <p className="font-mono text-xs tabular-nums text-muted-foreground">{quota?.file_count || 0} files</p>
          </div>
          <Progress value={quotaPercentage} className="h-2" />
          {quotaPercentage > 80 && (
            <p className="mt-2 text-[13px] text-attend">
              Storage is nearly full. Remove unused files to free up space.
            </p>
          )}
        </div>
      </Panel>

      {/* Breadcrumbs and filters */}
      <div className="mt-4 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-2 overflow-x-auto text-sm">
          <button
            onClick={() => setCurrentFolderId(null)}
            className="flex items-center gap-1 text-muted-foreground transition-colors duration-150 hover:text-foreground"
          >
            <Home className="h-4 w-4" />
            <span>Home</span>
          </button>
          {breadcrumbs.map((folder, i) => (
            <div key={folder.id} className="flex items-center gap-2">
              <ChevronRight className="h-4 w-4 text-muted-foreground" />
              <button
                onClick={() => setCurrentFolderId(folder.id)}
                className={`transition-colors duration-150 hover:text-foreground ${
                  i === breadcrumbs.length - 1 ? 'font-medium text-foreground' : 'text-muted-foreground'
                }`}
              >
                {folder.name}
              </button>
            </div>
          ))}
        </div>

        <div className="flex items-center gap-2">
          <div className="relative flex-1 sm:w-64">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Search files"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className={cn(FIELD, 'h-9 pl-9')}
            />
          </div>

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="icon" className="h-9 w-9 rounded-lg" aria-label="Filter files">
                <Filter className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-48">
              <div className="px-2 py-1.5 font-mono text-[10px] font-medium uppercase tracking-[0.14em] text-muted-foreground">File type</div>
              {['image', 'video', 'audio', 'document', 'archive'].map(type => (
                <DropdownMenuItem
                  key={type}
                  onClick={() => setFilterType(filterType === type ? null : type)}
                  className="capitalize"
                >
                  {filterType === type && <Check className="mr-1.5 h-3.5 w-3.5" />}{type}
                </DropdownMenuItem>
              ))}
              <DropdownMenuSeparator />
              <div className="px-2 py-1.5 font-mono text-[10px] font-medium uppercase tracking-[0.14em] text-muted-foreground">Tags</div>
              {tags.map(tag => (
                <DropdownMenuItem
                  key={tag.id}
                  onClick={() => setFilterTag(filterTag === tag.id ? null : tag.id)}
                >
                  {filterTag === tag.id && <Check className="mr-1.5 h-3.5 w-3.5" />}{tag.name}
                </DropdownMenuItem>
              ))}
              {(filterType || filterTag) && (
                <>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={() => { setFilterType(null); setFilterTag(null); }}>
                    Clear filters
                  </DropdownMenuItem>
                </>
              )}
            </DropdownMenuContent>
          </DropdownMenu>

          <div className="flex items-center overflow-hidden rounded-lg border border-border/60">
            <button
              onClick={() => setViewMode('grid')}
              aria-label="Grid view"
              className={`p-2 transition-colors duration-150 ${viewMode === 'grid' ? 'bg-foreground/[0.06]' : 'hover:bg-foreground/[0.03]'}`}
            >
              <Grid3X3 className="h-4 w-4" />
            </button>
            <button
              onClick={() => setViewMode('list')}
              aria-label="List view"
              className={`p-2 transition-colors duration-150 ${viewMode === 'list' ? 'bg-foreground/[0.06]' : 'hover:bg-foreground/[0.03]'}`}
            >
              <List className="h-4 w-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="mt-5">
        {loading ? (
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5" aria-hidden>
            {[1, 2, 3, 4, 5, 6].map(i => (
              <div key={i} className="aspect-square animate-pulse rounded-[10px] border border-border/60 bg-foreground/[0.04]" />
            ))}
          </div>
        ) : currentFolders.length === 0 && currentAssets.length === 0 ? (
          <Panel>
            <EmptyState
              title={currentFolderId ? 'This folder is empty' : 'No files yet'}
              body={
                currentFolderId
                  ? 'Upload files here or create subfolders to organise your assets.'
                  : 'Upload your first files or create folders to organise your assets.'
              }
              action={{ label: 'Upload files', onClick: () => setUploadDialogOpen(true) }}
            />
          </Panel>
        ) : viewMode === 'grid' ? (
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
            {/* Folders */}
            {currentFolders.map(folder => (
              <div
                key={folder.id}
                role="button"
                tabIndex={0}
                className="group relative flex aspect-square cursor-pointer flex-col items-center justify-center gap-2 rounded-[10px] border border-border/60 bg-card p-4 transition-colors duration-150 hover:border-primary/40"
                onClick={() => setCurrentFolderId(folder.id)}
              >
                <Folder className="h-10 w-10" style={{ color: folder.color }} />
                <span className="line-clamp-2 text-center text-[13px] font-[450]">{folder.name}</span>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
                    <Button
                      variant="ghost"
                      size="icon"
                      aria-label="Folder actions"
                      className="absolute right-2 top-2 h-8 w-8 opacity-0 transition-opacity duration-150 group-hover:opacity-100"
                    >
                      <MoreVertical className="h-4 w-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuItem onClick={(e) => {
                      e.stopPropagation();
                      handleExportFolder(folder);
                    }}>
                      <Download className="mr-2 h-4 w-4" />
                      Export as ZIP
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem onClick={(e) => {
                      e.stopPropagation();
                      setItemToDelete({ type: 'folder', id: folder.id, name: folder.name });
                      setDeleteDialogOpen(true);
                    }} className="text-destructive">
                      <Trash2 className="mr-2 h-4 w-4" />
                      Delete
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            ))}

            {/* Assets */}
            {currentAssets.map(asset => {
              const FileIcon = FILE_TYPE_ICONS[asset.file_type] || File;

              return (
                <div
                  key={asset.id}
                  role="button"
                  tabIndex={0}
                  className="group relative flex aspect-square cursor-pointer flex-col overflow-hidden rounded-[10px] border border-border/60 bg-card transition-colors duration-150 hover:border-primary/40"
                  onClick={() => {
                    setSelectedAsset(asset);
                    setAssetDetailOpen(true);
                  }}
                >
                  {asset.file_type === 'image' ? (
                    <SecureImage
                      src={asset.file_path}
                      bucket="client-assets"
                      alt={asset.original_name}
                      className="min-h-0 w-full flex-1 object-cover"
                    />
                  ) : (
                    <div className="flex min-h-0 w-full flex-1 flex-col items-center justify-center bg-sunken p-4">
                      <FileIcon className="h-10 w-10 text-muted-foreground" />
                    </div>
                  )}

                  {/* Caption */}
                  <div className="flex items-center gap-2 border-t border-border/60 px-2.5 py-2">
                    <span className="min-w-0 flex-1">
                      <span className="block truncate text-[12px] font-[450] text-foreground">{asset.original_name}</span>
                      <span className="block font-mono text-[10px] tabular-nums text-muted-foreground">{formatFileSize(asset.file_size)}</span>
                    </span>
                    {asset.is_starred && (
                      <Star className="h-3.5 w-3.5 shrink-0 fill-[hsl(var(--gold))] text-[hsl(var(--gold))]" />
                    )}
                    {asset.tags && asset.tags.length > 0 && (
                      <span className="flex shrink-0 gap-1">
                        {asset.tags.slice(0, 2).map(tag => (
                          <span
                            key={tag.id}
                            className="h-2 w-2 rounded-full"
                            style={{ backgroundColor: tag.color }}
                          />
                        ))}
                      </span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          /* List view */
          <div className="overflow-hidden rounded-[10px] border border-border/60">
            <div className="grid grid-cols-[1fr_auto] items-center gap-4 bg-sunken px-4 py-2 font-mono text-[9.5px] font-medium uppercase tracking-[0.13em] text-muted-foreground sm:grid-cols-[1fr_auto_auto_auto]">
              <span>Name</span>
              <span className="hidden w-24 text-right sm:block">Size</span>
              <span className="hidden w-32 text-right sm:block">Modified</span>
              <span className="w-16" />
            </div>

            {currentFolders.map(folder => (
              <div
                key={folder.id}
                role="button"
                tabIndex={0}
                className="grid cursor-pointer grid-cols-[1fr_auto] items-center gap-4 border-t border-border/60 px-4 py-2.5 transition-colors duration-150 hover:bg-foreground/[0.025] sm:grid-cols-[1fr_auto_auto_auto]"
                onClick={() => setCurrentFolderId(folder.id)}
              >
                <div className="flex min-w-0 items-center gap-3">
                  <Folder className="h-4 w-4 shrink-0" style={{ color: folder.color }} />
                  <span className="truncate text-[13px] font-[450]">{folder.name}</span>
                </div>
                <span className="hidden w-24 text-right font-mono text-xs tabular-nums text-muted-foreground sm:block">-</span>
                <span className="hidden w-32 text-right font-mono text-xs tabular-nums text-muted-foreground sm:block">
                  {new Date(folder.created_at).toLocaleDateString('en-GB')}
                </span>
                <div className="flex w-16 justify-end">
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
                      <Button variant="ghost" size="icon" aria-label="Folder actions" className="h-8 w-8">
                        <MoreVertical className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem onClick={(e) => {
                        e.stopPropagation();
                        handleExportFolder(folder);
                      }}>
                        <Download className="mr-2 h-4 w-4" />
                        Export as ZIP
                      </DropdownMenuItem>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem onClick={(e) => {
                        e.stopPropagation();
                        setItemToDelete({ type: 'folder', id: folder.id, name: folder.name });
                        setDeleteDialogOpen(true);
                      }} className="text-destructive">
                        <Trash2 className="mr-2 h-4 w-4" />
                        Delete
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              </div>
            ))}

            {currentAssets.map(asset => {
              const FileIcon = FILE_TYPE_ICONS[asset.file_type] || File;

              return (
                <div
                  key={asset.id}
                  role="button"
                  tabIndex={0}
                  className="grid cursor-pointer grid-cols-[1fr_auto] items-center gap-4 border-t border-border/60 px-4 py-2.5 transition-colors duration-150 hover:bg-foreground/[0.025] sm:grid-cols-[1fr_auto_auto_auto]"
                  onClick={() => {
                    setSelectedAsset(asset);
                    setAssetDetailOpen(true);
                  }}
                >
                  <div className="flex min-w-0 items-center gap-3">
                    <FileIcon className="h-4 w-4 flex-shrink-0 text-muted-foreground" />
                    <span className="truncate text-[13px] font-[450]">{asset.original_name}</span>
                    {asset.is_starred && <Star className="h-3.5 w-3.5 flex-shrink-0 fill-[hsl(var(--gold))] text-[hsl(var(--gold))]" />}
                    {asset.tags?.map(tag => (
                      <Badge key={tag.id} variant="outline" className="hidden text-xs md:inline-flex" style={{ borderColor: tag.color, color: tag.color }}>
                        {tag.name}
                      </Badge>
                    ))}
                  </div>
                  <span className="hidden w-24 text-right font-mono text-xs tabular-nums text-muted-foreground sm:block">
                    {formatFileSize(asset.file_size)}
                  </span>
                  <span className="hidden w-32 text-right font-mono text-xs tabular-nums text-muted-foreground sm:block">
                    {new Date(asset.created_at).toLocaleDateString('en-GB')}
                  </span>
                  <div className="flex w-16 justify-end">
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
                        <Button variant="ghost" size="icon" aria-label="File actions" className="h-8 w-8">
                          <MoreVertical className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem onClick={(e) => {
                          e.stopPropagation();
                          handleDownload(asset);
                        }}>
                          <Download className="mr-2 h-4 w-4" />
                          Download
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={(e) => {
                          e.stopPropagation();
                          handleToggleStar(asset);
                        }}>
                          {asset.is_starred ? <StarOff className="mr-2 h-4 w-4" /> : <Star className="mr-2 h-4 w-4" />}
                          {asset.is_starred ? 'Unstar' : 'Star'}
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem
                          className="text-destructive"
                          onClick={(e) => {
                            e.stopPropagation();
                            setItemToDelete({ type: 'asset', id: asset.id, name: asset.original_name });
                            setDeleteDialogOpen(true);
                          }}
                        >
                          <Trash2 className="mr-2 h-4 w-4" />
                          Delete
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Asset detail dialog */}
      <Dialog open={assetDetailOpen} onOpenChange={setAssetDetailOpen}>
        <DialogContent className="overflow-hidden p-0 sm:max-w-2xl">
          {selectedAsset && (
            <>
              {selectedAsset.file_type === 'image' && (
                <div className="relative h-64 border-b border-border/60 bg-sunken sm:h-80">
                  <SecureImage
                    src={selectedAsset.file_path}
                    bucket="client-assets"
                    alt={selectedAsset.original_name}
                    className="h-full w-full object-contain"
                  />
                </div>
              )}
              <div className="space-y-4 p-6">
                <div className="flex items-start justify-between">
                  <div>
                    <h3 className="text-[15px] font-semibold">{selectedAsset.original_name}</h3>
                    <p className="mt-1 font-mono text-xs tabular-nums text-muted-foreground">
                      {formatFileSize(selectedAsset.file_size)} · uploaded {new Date(selectedAsset.created_at).toLocaleDateString('en-GB')}
                    </p>
                  </div>
                  <Button
                    variant="ghost"
                    size="icon"
                    aria-label={selectedAsset.is_starred ? 'Unstar file' : 'Star file'}
                    onClick={() => handleToggleStar(selectedAsset)}
                  >
                    {selectedAsset.is_starred
                      ? <Star className="h-5 w-5 fill-[hsl(var(--gold))] text-[hsl(var(--gold))]" />
                      : <StarOff className="h-5 w-5" />
                    }
                  </Button>
                </div>

                {selectedAsset.description && (
                  <p className="text-[13px] leading-relaxed text-muted-foreground">{selectedAsset.description}</p>
                )}

                {selectedAsset.tags && selectedAsset.tags.length > 0 && (
                  <div className="flex flex-wrap gap-2">
                    {selectedAsset.tags.map(tag => (
                      <Badge
                        key={tag.id}
                        variant="outline"
                        style={{ borderColor: tag.color, color: tag.color }}
                      >
                        {tag.name}
                      </Badge>
                    ))}
                  </div>
                )}

                <div className="flex items-center gap-3 pt-2">
                  <Button onClick={() => handleDownload(selectedAsset)} className="h-8 flex-1 gap-1.5 rounded-lg text-xs">
                    <Download className="h-3.5 w-3.5" />
                    Download
                  </Button>
                  <Button
                    variant="outline"
                    aria-label="Delete file"
                    className="h-8 rounded-lg text-destructive hover:text-destructive"
                    onClick={() => {
                      setItemToDelete({ type: 'asset', id: selectedAsset.id, name: selectedAsset.original_name });
                      setDeleteDialogOpen(true);
                    }}
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </Button>
                </div>

                <div className="flex items-center gap-4 pt-2 text-xs text-muted-foreground">
                  <span className="flex items-center gap-1 font-mono tabular-nums">
                    <Download className="h-3 w-3" />
                    {selectedAsset.download_count} downloads
                  </span>
                  <span className="flex items-center gap-1">
                    <Lock className="h-3 w-3" />
                    AES-256 encrypted
                  </span>
                </div>
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>

      {/* Delete confirmation */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete {itemToDelete?.type === 'folder' ? 'folder' : 'file'}?</AlertDialogTitle>
            <AlertDialogDescription>
              {itemToDelete?.type === 'folder'
                ? 'This permanently deletes the folder and everything inside it.'
                : `This permanently deletes "${itemToDelete?.name}".`
              }
              {' '}It cannot be undone.
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
