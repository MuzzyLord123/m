import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { motion, AnimatePresence } from 'framer-motion';
import { LoungePageHeader } from '@/components/lounge/LoungePageHeader';
import JSZip from 'jszip';
import { 
  Upload, 
  FolderPlus,
  Folder,
  FolderOpen,
  File,
  FileText,
  FileImage,
  FileVideo,
  FileAudio,
  FileArchive,
  Tag,
  Plus,
  Trash2,
  X,
  Star,
  StarOff,
  Download,
  Search,
  Grid3X3,
  List,
  MoreVertical,
  ChevronRight,
  Home,
  HardDrive,
  Clock,
  Filter,
  Edit2,
  Eye,
  Lock,
  Shield
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogDescription } from '@/components/ui/dialog';
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
import { ScrollArea } from '@/components/ui/scroll-area';

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

const FILE_TYPE_COLORS: Record<string, string> = {
  image: 'text-pink-500',
  video: 'text-purple-500',
  audio: 'text-blue-500',
  document: 'text-amber-500',
  archive: 'text-emerald-500',
  other: 'text-muted-foreground',
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

const containerVariants = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { staggerChildren: 0.05 } },
};

const itemVariants = {
  hidden: { opacity: 0, y: 10 },
  visible: { opacity: 1, y: 0 },
};

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
      toast.error('Failed to load assets');
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
      
      toast.success(`${totalFiles} file${totalFiles > 1 ? 's' : ''} uploaded successfully`);
      setUploadDialogOpen(false);
      setSelectedFiles([]);
      setUploadDescription('');
      setSelectedTags([]);
      fetchData();
    } catch (error) {
      console.error('Upload error:', error);
      toast.error('Failed to upload files');
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
      toast.error('Failed to create folder');
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
      toast.error('Failed to create tag');
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
      toast.error('Failed to download file');
    }
  };

  const handleExportFolder = async (folder: AssetFolder) => {
    try {
      toast.info('Preparing folder export...');
      
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
      toast.error('Failed to export folder');
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
      toast.error('Failed to delete');
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
    <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
      <motion.div
        variants={containerVariants}
        initial="hidden"
        animate="visible"
        className="space-y-6"
      >
        <LoungePageHeader
          title="Asset Storage"
          description="Securely store and manage your files with enterprise-grade encryption."
          icon={HardDrive}
          actions={
            <div className="flex items-center gap-2">
              <Button variant="outline" size="sm" className="gap-2" onClick={() => setFolderDialogOpen(true)}>
                <FolderPlus className="w-4 h-4" />
                <span className="hidden sm:inline">New Folder</span>
              </Button>
              <Button variant="outline" size="sm" className="gap-2" onClick={() => setTagDialogOpen(true)}>
                <Tag className="w-4 h-4" />
                <span className="hidden sm:inline">New Tag</span>
              </Button>
              <Button className="gap-2 shadow-lg shadow-primary/25" onClick={() => setUploadDialogOpen(true)}>
                <Upload className="w-4 h-4" />
                Upload Files
              </Button>
            </div>
          }
        />

        {/* Folder Dialog */}
        <Dialog open={folderDialogOpen} onOpenChange={setFolderDialogOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Create Folder</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 pt-4">
              <div className="space-y-2">
                <Label>Folder Name</Label>
                <Input
                  placeholder="My Documents"
                  value={newFolderName}
                  onChange={(e) => setNewFolderName(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label>Color</Label>
                <div className="flex gap-2">
                  {['#6366f1', '#ec4899', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6'].map(color => (
                    <button
                      key={color}
                      className={`w-8 h-8 rounded-full transition-transform ${newFolderColor === color ? 'scale-110 ring-2 ring-offset-2 ring-primary' : ''}`}
                      style={{ backgroundColor: color }}
                      onClick={() => setNewFolderColor(color)}
                    />
                  ))}
                </div>
              </div>
              <Button onClick={handleCreateFolder} className="w-full">
                Create Folder
              </Button>
            </div>
          </DialogContent>
        </Dialog>
        
        {/* Tag Dialog */}
        <Dialog open={tagDialogOpen} onOpenChange={setTagDialogOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Create Tag</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 pt-4">
              <div className="space-y-2">
                <Label>Tag Name</Label>
                <Input
                  placeholder="Important"
                  value={newTagName}
                  onChange={(e) => setNewTagName(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label>Color</Label>
                <div className="flex gap-2">
                  {['#6366f1', '#ec4899', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6'].map(color => (
                    <button
                      key={color}
                      className={`w-8 h-8 rounded-full transition-transform ${newTagColor === color ? 'scale-110 ring-2 ring-offset-2 ring-primary' : ''}`}
                      style={{ backgroundColor: color }}
                      onClick={() => setNewTagColor(color)}
                    />
                  ))}
                </div>
              </div>
              <Button onClick={handleCreateTag} className="w-full">
                Create Tag
              </Button>
            </div>
          </DialogContent>
        </Dialog>
        
        {/* Upload Dialog */}
        <Dialog open={uploadDialogOpen} onOpenChange={setUploadDialogOpen}>
          <DialogContent className="sm:max-w-lg">
            <DialogHeader>
              <DialogTitle>Upload Files</DialogTitle>
              <DialogDescription>
                Upload files to your secure storage. Max 50MB per file.
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 pt-4">
              <div className="space-y-2">
                <Label>Select Files</Label>
                {selectedFiles.length > 0 ? (
                  <div className="border rounded-xl p-3 space-y-2">
                    {selectedFiles.map((file, i) => (
                      <div key={i} className="flex items-center justify-between text-sm">
                        <span className="truncate">{file.name}</span>
                        <span className="text-muted-foreground">{formatFileSize(file.size)}</span>
                      </div>
                    ))}
                    <Button
                      variant="outline"
                      size="sm"
                      className="w-full mt-2"
                      onClick={() => setSelectedFiles([])}
                    >
                      Clear Selection
                    </Button>
                  </div>
                ) : (
                  <label className="flex flex-col items-center justify-center w-full h-32 border-2 border-dashed rounded-xl cursor-pointer hover:bg-muted/30 transition-colors">
                    <Upload className="w-8 h-8 text-muted-foreground mb-2" />
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
              
              <div className="space-y-2">
                <Label>Description (optional)</Label>
                <Textarea
                  placeholder="Add a description for these files..."
                  value={uploadDescription}
                  onChange={(e) => setUploadDescription(e.target.value)}
                  rows={2}
                />
              </div>
              
              {tags.length > 0 && (
                <div className="space-y-2">
                  <Label>Tags</Label>
                  <div className="flex flex-wrap gap-2">
                    {tags.map(tag => (
                      <button
                        key={tag.id}
                        onClick={() => setSelectedTags(prev => 
                          prev.includes(tag.id) 
                            ? prev.filter(t => t !== tag.id)
                            : [...prev, tag.id]
                        )}
                        className={`px-3 py-1 rounded-full text-sm transition-all ${
                          selectedTags.includes(tag.id)
                            ? 'ring-2 ring-offset-2 ring-primary'
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
                  <p className="text-sm text-center text-muted-foreground">
                    Uploading... {Math.round(uploadProgress)}%
                  </p>
                </div>
              )}
              
              <Button 
                onClick={handleUpload} 
                className="w-full"
                disabled={selectedFiles.length === 0 || uploading}
              >
                {uploading ? 'Uploading...' : `Upload ${selectedFiles.length} File${selectedFiles.length !== 1 ? 's' : ''}`}
              </Button>
            </div>
          </DialogContent>
        </Dialog>

        {/* Storage Quota */}
        <motion.div variants={itemVariants} className="rounded-2xl border border-border/50 bg-card p-4 sm:p-6">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <div className="p-2.5 rounded-xl bg-primary/10">
                <HardDrive className="w-5 h-5 text-primary" />
              </div>
              <div>
                <h3 className="font-semibold">Storage</h3>
                <p className="text-sm text-muted-foreground">
                  {formatFileSize(quota?.used_bytes || 0)} of {formatFileSize(quota?.quota_bytes || 5368709120)} used
                </p>
              </div>
            </div>
            <div className="flex items-center gap-4 text-sm text-muted-foreground">
              <div className="flex items-center gap-1.5">
                <File className="w-4 h-4" />
                <span>{quota?.file_count || 0} files</span>
              </div>
              <div className="flex items-center gap-1.5">
                <Shield className="w-4 h-4 text-emerald-500" />
                <span className="text-emerald-600 dark:text-emerald-400">Encrypted</span>
              </div>
            </div>
          </div>
          <Progress value={quotaPercentage} className="h-2" />
          {quotaPercentage > 80 && (
            <p className="text-sm text-amber-600 dark:text-amber-400 mt-2">
              You're running low on storage. Consider removing unused files.
            </p>
          )}
        </motion.div>

        {/* Breadcrumbs & Filters */}
        <motion.div variants={itemVariants} className="flex flex-col sm:flex-row gap-4 sm:items-center sm:justify-between">
          <div className="flex items-center gap-2 text-sm overflow-x-auto">
            <button
              onClick={() => setCurrentFolderId(null)}
              className="flex items-center gap-1 text-muted-foreground hover:text-foreground transition-colors"
            >
              <Home className="w-4 h-4" />
              <span>Home</span>
            </button>
            {breadcrumbs.map((folder, i) => (
              <div key={folder.id} className="flex items-center gap-2">
                <ChevronRight className="w-4 h-4 text-muted-foreground" />
                <button
                  onClick={() => setCurrentFolderId(folder.id)}
                  className={`hover:text-foreground transition-colors ${
                    i === breadcrumbs.length - 1 ? 'text-foreground font-medium' : 'text-muted-foreground'
                  }`}
                >
                  {folder.name}
                </button>
              </div>
            ))}
          </div>
          
          <div className="flex items-center gap-2">
            <div className="relative flex-1 sm:w-64">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                placeholder="Search files..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9 h-9"
              />
            </div>
            
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" size="icon" className="h-9 w-9">
                  <Filter className="w-4 h-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-48">
                <div className="px-2 py-1.5 text-xs font-semibold text-muted-foreground">File Type</div>
                {['image', 'video', 'audio', 'document', 'archive'].map(type => (
                  <DropdownMenuItem 
                    key={type}
                    onClick={() => setFilterType(filterType === type ? null : type)}
                    className="capitalize"
                  >
                    {filterType === type && '✓ '}{type}
                  </DropdownMenuItem>
                ))}
                <DropdownMenuSeparator />
                <div className="px-2 py-1.5 text-xs font-semibold text-muted-foreground">Tags</div>
                {tags.map(tag => (
                  <DropdownMenuItem 
                    key={tag.id}
                    onClick={() => setFilterTag(filterTag === tag.id ? null : tag.id)}
                  >
                    {filterTag === tag.id && '✓ '}{tag.name}
                  </DropdownMenuItem>
                ))}
                {(filterType || filterTag) && (
                  <>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem onClick={() => { setFilterType(null); setFilterTag(null); }}>
                      Clear Filters
                    </DropdownMenuItem>
                  </>
                )}
              </DropdownMenuContent>
            </DropdownMenu>
            
            <div className="flex items-center border rounded-lg overflow-hidden">
              <button
                onClick={() => setViewMode('grid')}
                className={`p-2 transition-colors ${viewMode === 'grid' ? 'bg-muted' : 'hover:bg-muted/50'}`}
              >
                <Grid3X3 className="w-4 h-4" />
              </button>
              <button
                onClick={() => setViewMode('list')}
                className={`p-2 transition-colors ${viewMode === 'list' ? 'bg-muted' : 'hover:bg-muted/50'}`}
              >
                <List className="w-4 h-4" />
              </button>
            </div>
          </div>
        </motion.div>

        {/* Content */}
        {loading ? (
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
            {[1, 2, 3, 4, 5, 6].map(i => (
              <div key={i} className="aspect-square rounded-2xl bg-muted animate-pulse" />
            ))}
          </div>
        ) : currentFolders.length === 0 && currentAssets.length === 0 ? (
          <motion.div 
            variants={itemVariants}
            className="flex flex-col items-center justify-center py-20 rounded-3xl border-2 border-dashed border-border/50"
          >
            <div className="w-20 h-20 rounded-full bg-primary/10 flex items-center justify-center mb-4">
              <Folder className="w-10 h-10 text-primary/60" />
            </div>
            <h4 className="text-lg font-semibold mb-2">
              {currentFolderId ? 'This folder is empty' : 'No files yet'}
            </h4>
            <p className="text-sm text-muted-foreground text-center max-w-sm mb-6">
              {currentFolderId 
                ? 'Upload files or create subfolders to organize your assets.'
                : 'Start by uploading files or creating folders to organize your assets.'
              }
            </p>
            <Button onClick={() => setUploadDialogOpen(true)} className="gap-2">
              <Upload className="w-4 h-4" />
              Upload Files
            </Button>
          </motion.div>
        ) : viewMode === 'grid' ? (
          <motion.div 
            variants={containerVariants}
            className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4"
          >
            {/* Folders */}
            {currentFolders.map(folder => (
              <motion.div
                key={folder.id}
                variants={itemVariants}
                className="group relative aspect-square rounded-2xl border border-border/50 bg-card p-4 flex flex-col items-center justify-center gap-2 cursor-pointer hover:border-primary/30 hover:shadow-lg transition-all"
                onClick={() => setCurrentFolderId(folder.id)}
              >
                <Folder className="w-12 h-12" style={{ color: folder.color }} />
                <span className="text-sm font-medium text-center line-clamp-2">{folder.name}</span>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="absolute top-2 right-2 h-8 w-8 opacity-0 group-hover:opacity-100 transition-opacity"
                    >
                      <MoreVertical className="w-4 h-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuItem onClick={(e) => {
                      e.stopPropagation();
                      handleExportFolder(folder);
                    }}>
                      <Download className="w-4 h-4 mr-2" />
                      Export as ZIP
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem onClick={(e) => {
                      e.stopPropagation();
                      setItemToDelete({ type: 'folder', id: folder.id, name: folder.name });
                      setDeleteDialogOpen(true);
                    }} className="text-destructive">
                      <Trash2 className="w-4 h-4 mr-2" />
                      Delete
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </motion.div>
            ))}
            
            {/* Assets */}
            {currentAssets.map(asset => {
              const FileIcon = FILE_TYPE_ICONS[asset.file_type] || File;
              const iconColor = FILE_TYPE_COLORS[asset.file_type] || FILE_TYPE_COLORS.other;
              
              return (
                <motion.div
                  key={asset.id}
                  variants={itemVariants}
                  className="group relative aspect-square rounded-2xl border border-border/50 bg-card overflow-hidden cursor-pointer hover:border-primary/30 hover:shadow-lg transition-all"
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
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full flex flex-col items-center justify-center p-4 bg-muted/30">
                      <FileIcon className={`w-12 h-12 ${iconColor}`} />
                      <span className="text-xs text-muted-foreground mt-2 text-center line-clamp-2">
                        {asset.original_name}
                      </span>
                    </div>
                  )}
                  
                  {/* Overlay */}
                  <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity">
                    <div className="absolute bottom-0 left-0 right-0 p-3">
                      <p className="text-white text-sm font-medium truncate">{asset.original_name}</p>
                      <p className="text-white/70 text-xs">{formatFileSize(asset.file_size)}</p>
                    </div>
                  </div>
                  
                  {/* Star indicator */}
                  {asset.is_starred && (
                    <div className="absolute top-2 left-2">
                      <Star className="w-4 h-4 text-amber-400 fill-amber-400" />
                    </div>
                  )}
                  
                  {/* Tags */}
                  {asset.tags && asset.tags.length > 0 && (
                    <div className="absolute top-2 right-2 flex gap-1">
                      {asset.tags.slice(0, 2).map(tag => (
                        <div
                          key={tag.id}
                          className="w-2 h-2 rounded-full"
                          style={{ backgroundColor: tag.color }}
                        />
                      ))}
                    </div>
                  )}
                </motion.div>
              );
            })}
          </motion.div>
        ) : (
          /* List View */
          <motion.div variants={containerVariants} className="rounded-2xl border border-border/50 overflow-hidden">
            <div className="grid grid-cols-[1fr_auto_auto_auto] gap-4 px-4 py-3 bg-muted/50 text-sm font-medium text-muted-foreground">
              <span>Name</span>
              <span className="w-24 text-right">Size</span>
              <span className="w-32 text-right">Modified</span>
              <span className="w-16" />
            </div>
            
            {currentFolders.map(folder => (
              <motion.div
                key={folder.id}
                variants={itemVariants}
                className="grid grid-cols-[1fr_auto_auto_auto] gap-4 px-4 py-3 border-t border-border/50 hover:bg-muted/30 cursor-pointer transition-colors items-center"
                onClick={() => setCurrentFolderId(folder.id)}
              >
                <div className="flex items-center gap-3">
                  <Folder className="w-5 h-5" style={{ color: folder.color }} />
                  <span className="font-medium truncate">{folder.name}</span>
                </div>
                <span className="w-24 text-right text-sm text-muted-foreground">—</span>
                <span className="w-32 text-right text-sm text-muted-foreground">
                  {new Date(folder.created_at).toLocaleDateString()}
                </span>
                <div className="w-16 flex justify-end">
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
                      <Button variant="ghost" size="icon" className="h-8 w-8">
                        <MoreVertical className="w-4 h-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem onClick={(e) => {
                        e.stopPropagation();
                        handleExportFolder(folder);
                      }}>
                        <Download className="w-4 h-4 mr-2" />
                        Export as ZIP
                      </DropdownMenuItem>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem onClick={(e) => {
                        e.stopPropagation();
                        setItemToDelete({ type: 'folder', id: folder.id, name: folder.name });
                        setDeleteDialogOpen(true);
                      }} className="text-destructive">
                        <Trash2 className="w-4 h-4 mr-2" />
                        Delete
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              </motion.div>
            ))}
            
            {currentAssets.map(asset => {
              const FileIcon = FILE_TYPE_ICONS[asset.file_type] || File;
              const iconColor = FILE_TYPE_COLORS[asset.file_type] || FILE_TYPE_COLORS.other;
              
              return (
                <motion.div
                  key={asset.id}
                  variants={itemVariants}
                  className="grid grid-cols-[1fr_auto_auto_auto] gap-4 px-4 py-3 border-t border-border/50 hover:bg-muted/30 cursor-pointer transition-colors items-center"
                  onClick={() => {
                    setSelectedAsset(asset);
                    setAssetDetailOpen(true);
                  }}
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <FileIcon className={`w-5 h-5 flex-shrink-0 ${iconColor}`} />
                    <span className="font-medium truncate">{asset.original_name}</span>
                    {asset.is_starred && <Star className="w-4 h-4 text-amber-400 fill-amber-400 flex-shrink-0" />}
                    {asset.tags?.map(tag => (
                      <Badge key={tag.id} variant="outline" className="text-xs" style={{ borderColor: tag.color, color: tag.color }}>
                        {tag.name}
                      </Badge>
                    ))}
                  </div>
                  <span className="w-24 text-right text-sm text-muted-foreground">
                    {formatFileSize(asset.file_size)}
                  </span>
                  <span className="w-32 text-right text-sm text-muted-foreground">
                    {new Date(asset.created_at).toLocaleDateString()}
                  </span>
                  <div className="w-16 flex justify-end">
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
                        <Button variant="ghost" size="icon" className="h-8 w-8">
                          <MoreVertical className="w-4 h-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem onClick={(e) => {
                          e.stopPropagation();
                          handleDownload(asset);
                        }}>
                          <Download className="w-4 h-4 mr-2" />
                          Download
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={(e) => {
                          e.stopPropagation();
                          handleToggleStar(asset);
                        }}>
                          {asset.is_starred ? <StarOff className="w-4 h-4 mr-2" /> : <Star className="w-4 h-4 mr-2" />}
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
                          <Trash2 className="w-4 h-4 mr-2" />
                          Delete
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                </motion.div>
              );
            })}
          </motion.div>
        )}
      </motion.div>

      {/* Asset Detail Dialog */}
      <Dialog open={assetDetailOpen} onOpenChange={setAssetDetailOpen}>
        <DialogContent className="sm:max-w-2xl p-0 overflow-hidden">
          {selectedAsset && (
            <>
              {selectedAsset.file_type === 'image' && (
                <div className="relative h-64 sm:h-80 bg-muted">
                  <SecureImage
                    src={selectedAsset.file_path}
                    bucket="client-assets"
                    alt={selectedAsset.original_name}
                    className="w-full h-full object-contain"
                  />
                </div>
              )}
              <div className="p-6 space-y-4">
                <div className="flex items-start justify-between">
                  <div>
                    <h3 className="text-xl font-semibold">{selectedAsset.original_name}</h3>
                    <p className="text-sm text-muted-foreground mt-1">
                      {formatFileSize(selectedAsset.file_size)} • Uploaded {new Date(selectedAsset.created_at).toLocaleDateString()}
                    </p>
                  </div>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => handleToggleStar(selectedAsset)}
                  >
                    {selectedAsset.is_starred 
                      ? <Star className="w-5 h-5 text-amber-400 fill-amber-400" />
                      : <StarOff className="w-5 h-5" />
                    }
                  </Button>
                </div>
                
                {selectedAsset.description && (
                  <p className="text-muted-foreground">{selectedAsset.description}</p>
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
                  <Button onClick={() => handleDownload(selectedAsset)} className="flex-1 gap-2">
                    <Download className="w-4 h-4" />
                    Download
                  </Button>
                  <Button
                    variant="outline"
                    className="text-destructive hover:text-destructive"
                    onClick={() => {
                      setItemToDelete({ type: 'asset', id: selectedAsset.id, name: selectedAsset.original_name });
                      setDeleteDialogOpen(true);
                    }}
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
                
                <div className="text-xs text-muted-foreground pt-2 flex items-center gap-4">
                  <span className="flex items-center gap-1">
                    <Download className="w-3 h-3" />
                    {selectedAsset.download_count} downloads
                  </span>
                  <span className="flex items-center gap-1">
                    <Lock className="w-3 h-3" />
                    AES-256 encrypted
                  </span>
                </div>
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete {itemToDelete?.type === 'folder' ? 'Folder' : 'File'}?</AlertDialogTitle>
            <AlertDialogDescription>
              {itemToDelete?.type === 'folder'
                ? 'This will permanently delete the folder and all its contents.'
                : `This will permanently delete "${itemToDelete?.name}".`
              }
              This action cannot be undone.
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
