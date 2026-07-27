import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  FolderPlus,
  Pencil,
  Trash2,
  X,
  Plus,
  ChevronDown,
  RotateCcw,
  Home,
  Sparkles,
  Globe,
  Paintbrush,
  Wand2,
  Package,
  Layout,
  Target,
  Workflow,
  FileText,
  Search,
  Megaphone,
  Share2,
  Calendar,
  HardDrive,
  Upload,
  Users,
  CreditCard,
  MessageSquare,
  Ticket,
  Settings,
  FolderOpen,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
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
import { useSidebarLayout, FOLDER_COLORS, DEFAULT_PRESET_FOLDERS, type SidebarFolder } from '@/hooks/useSidebarLayout';
import { useUIPreferences } from '@/hooks/useUIPreferences';
import { toast } from 'sonner';

// Icon registry matching PortalSidebar
const ICON_MAP: Record<string, React.ComponentType<{ className?: string }>> = {
  dashboard: Home,
  'ai-assistant': Sparkles,
  website: Globe,
  'website-dashboard': Paintbrush,
  'ai-builder': Wand2,
  products: Package,
  apps: Layout,
  crm: Target,
  workflows: Workflow,
  content: FileText,
  seo: Search,
  ads: Megaphone,
  social: Share2,
  calendar: Calendar,
  assets: HardDrive,
  uploads: Upload,
  team: Users,
  billing: CreditCard,
  messages: MessageSquare,
  tickets: Ticket,
  settings: Settings,
};

const LABEL_MAP: Record<string, string> = {
  dashboard: 'Dashboard',
  'ai-assistant': 'Quooro AI',
  website: 'Website',
  'website-dashboard': 'Website Dashboard',
  'ai-builder': 'AI Builder',
  products: 'Products & CMS',
  apps: 'App Projects',
  crm: 'CRM',
  workflows: 'Workflows',
  content: 'Content Requests',
  seo: 'SEO Checker',
  ads: 'Ad Campaigns',
  social: 'Social Media',
  calendar: 'Calendar',
  assets: 'Asset Storage',
  uploads: 'Uploads',
  team: 'Team',
  billing: 'Plan & Billing',
  messages: 'Messages',
  tickets: 'Support Tickets',
  settings: 'Settings',
};

const PINNED = ['dashboard', 'ai-assistant'];
const ALL_DRAGGABLE = Object.keys(LABEL_MAP).filter(id => !PINNED.includes(id));


const containerVariants = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { staggerChildren: 0.05 } },
};

const cardVariants = {
  hidden: { opacity: 0, y: 12 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.3, ease: [0.25, 0.46, 0.45, 0.94] as const } },
};

interface FolderManagementProps {
  userId: string | undefined;
}

export function FolderManagement({ userId }: FolderManagementProps) {
  const {
    layout,
    loaded,
    createFolder,
    renameFolder,
    deleteFolder,
    changeFolderColor,
    moveToFolder,
    moveOutOfFolder,
    resetToPresets,
    clearAllFolders,
    update,
  } = useSidebarLayout(userId);

  const { preferences, updatePreference } = useUIPreferences();

  // Dialog states
  const [createOpen, setCreateOpen] = useState(false);
  const [editFolder, setEditFolder] = useState<SidebarFolder | null>(null);
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);
  const [newName, setNewName] = useState('');
  const [newColor, setNewColor] = useState('#3b82f6');

  // Get ungrouped items
  const allFolderItemIds = new Set(layout.folders.flatMap(f => f.itemIds));
  const ungroupedItems = ALL_DRAGGABLE.filter(id => !allFolderItemIds.has(id));

  const handleCreate = () => {
    if (!newName.trim()) return;
    createFolder(newName.trim(), newColor);
    setCreateOpen(false);
    setNewName('');
    setNewColor('#3b82f6');
    toast.success(`Folder "${newName.trim()}" created`);
  };

  const handleEdit = () => {
    if (!editFolder || !newName.trim()) return;
    renameFolder(editFolder.id, newName.trim());
    changeFolderColor(editFolder.id, newColor);
    setEditFolder(null);
    setNewName('');
    toast.success('Folder updated');
  };

  const handleDelete = (folderId: string) => {
    deleteFolder(folderId);
    setDeleteConfirm(null);
    toast.success('Folder deleted, items returned to sidebar');
  };

  const handleResetToDefaults = () => {
    resetToPresets();
    toast.success('Folders reset to defaults');
  };

  const handleRemoveItem = (itemId: string, folderId: string) => {
    moveOutOfFolder(itemId, folderId);
    toast.success(`${LABEL_MAP[itemId] || itemId} moved to sidebar`);
  };

  const handleAddItem = (itemId: string, folderId: string) => {
    moveToFolder(itemId, folderId);
    toast.success(`${LABEL_MAP[itemId] || itemId} added to folder`);
  };

  if (!loaded) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <motion.div
      variants={containerVariants}
      initial="hidden"
      animate="visible"
      className="space-y-6"
    >
      {/* Toggles */}
      <motion.div variants={cardVariants}>
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2">
              <FolderOpen className="w-4 h-4" />
              Organization Settings
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium">Expand all folders</p>
                <p className="text-xs text-muted-foreground">Keep all sidebar folders open by default</p>
              </div>
              <Switch
                checked={preferences.sidebarExpandAll}
                onCheckedChange={(checked) => updatePreference('sidebarExpandAll', checked)}
              />
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* Actions bar */}
      <motion.div variants={cardVariants} className="flex flex-wrap gap-2">
        <Button onClick={() => { setNewName(''); setNewColor('#3b82f6'); setCreateOpen(true); }} className="gap-2">
          <FolderPlus className="w-4 h-4" />
          Create New Folder
        </Button>
        <Button variant="outline" onClick={handleResetToDefaults} className="gap-2 text-muted-foreground">
          <RotateCcw className="w-3.5 h-3.5" />
          Reset to Default Folders
        </Button>
        {layout.folders.length > 0 && (
          <Button
            variant="outline"
            onClick={() => {
              clearAllFolders();
              toast.success('All folders removed');
            }}
            className="gap-2 text-muted-foreground hover:text-destructive hover:border-destructive/50"
          >
            <Trash2 className="w-3.5 h-3.5" />
            Remove All Folders
          </Button>
        )}
      </motion.div>

      {/* Folder cards grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
        <AnimatePresence mode="popLayout">
          {layout.folders.map((folder) => {
            const availableToAdd = ungroupedItems.filter(id => !folder.itemIds.includes(id));
            return (
              <motion.div
                key={folder.id}
                variants={cardVariants}
                layout
                exit={{ opacity: 0, scale: 0.95, transition: { duration: 0.2 } }}
              >
                <Card className="overflow-hidden border-border/60 bg-card hover:border-border transition-colors">
                  {/* Header */}
                  <CardHeader className="pb-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3 min-w-0">
                        <div
                          className="w-4 h-4 rounded-full shrink-0 ring-2 ring-offset-2 ring-offset-card ring-border/40"
                          style={{ backgroundColor: folder.color }}
                        />
                        <CardTitle className="text-sm font-semibold truncate">{folder.name}</CardTitle>
                        <Badge variant="secondary" className="text-[10px] px-1.5 py-0 h-5 shrink-0">
                          {folder.itemIds.length}
                        </Badge>
                      </div>
                      <div className="flex items-center gap-1 shrink-0">
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-7 w-7 text-muted-foreground hover:text-foreground"
                          onClick={() => {
                            setEditFolder(folder);
                            setNewName(folder.name);
                            setNewColor(folder.color);
                          }}
                        >
                          <Pencil className="w-3.5 h-3.5" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-7 w-7 text-muted-foreground hover:text-destructive"
                          onClick={() => setDeleteConfirm(folder.id)}
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </Button>
                      </div>
                    </div>
                  </CardHeader>

                  {/* Items */}
                  <CardContent className="pt-0 pb-3">
                    <div className="space-y-1">
                      <AnimatePresence mode="popLayout">
                        {folder.itemIds.map(itemId => {
                          const Icon = ICON_MAP[itemId] || FileText;
                          const label = LABEL_MAP[itemId] || itemId;
                          return (
                            <motion.div
                              key={itemId}
                              layout
                              initial={{ opacity: 0, x: -8 }}
                              animate={{ opacity: 1, x: 0 }}
                              exit={{ opacity: 0, x: 8, transition: { duration: 0.15 } }}
                              className="flex items-center gap-2.5 px-2.5 py-1.5 rounded-lg bg-muted/40 group"
                            >
                              <Icon className="w-3.5 h-3.5 text-muted-foreground shrink-0" />
                              <span className="text-xs font-medium text-foreground truncate flex-1">{label}</span>
                              <button
                                onClick={() => handleRemoveItem(itemId, folder.id)}
                                className="opacity-0 group-hover:opacity-100 transition-opacity p-0.5 rounded hover:bg-destructive/10 hover:text-destructive"
                              >
                                <X className="w-3 h-3" />
                              </button>
                            </motion.div>
                          );
                        })}
                      </AnimatePresence>

                      {folder.itemIds.length === 0 && (
                        <p className="text-xs text-muted-foreground/60 text-center py-3">No items in this folder</p>
                      )}
                    </div>

                    {/* Add Item dropdown */}
                    {availableToAdd.length > 0 && (
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="sm" className="w-full mt-2 gap-2 text-xs text-muted-foreground hover:text-foreground h-8">
                            <Plus className="w-3 h-3" />
                            Add Item
                            <ChevronDown className="w-3 h-3 ml-auto" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="start" className="w-56 max-h-64 overflow-y-auto">
                          {availableToAdd.map(itemId => {
                            const Icon = ICON_MAP[itemId] || FileText;
                            return (
                              <DropdownMenuItem key={itemId} onClick={() => handleAddItem(itemId, folder.id)} className="gap-2.5">
                                <Icon className="w-4 h-4 text-muted-foreground" />
                                <span className="text-sm">{LABEL_MAP[itemId] || itemId}</span>
                              </DropdownMenuItem>
                            );
                          })}
                        </DropdownMenuContent>
                      </DropdownMenu>
                    )}
                  </CardContent>
                </Card>
              </motion.div>
            );
          })}
        </AnimatePresence>
      </div>

      {/* Empty state */}
      {layout.folders.length === 0 && (
        <motion.div variants={cardVariants}>
          <Card className="border-dashed">
            <CardContent className="flex flex-col items-center justify-center py-10 gap-3">
              <FolderOpen className="w-10 h-10 text-muted-foreground/40" />
              <p className="text-sm text-muted-foreground">No folders yet. Create one to organize your sidebar.</p>
              <Button size="sm" onClick={() => { setNewName(''); setNewColor('#3b82f6'); setCreateOpen(true); }} className="gap-2">
                <FolderPlus className="w-4 h-4" />
                Create Folder
              </Button>
            </CardContent>
          </Card>
        </motion.div>
      )}

      {/* Ungrouped items */}
      {ungroupedItems.length > 0 && (
        <motion.div variants={cardVariants}>
          <Card className="border-border/40">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm flex items-center gap-2 text-muted-foreground">
                Ungrouped Items
                <Badge variant="outline" className="text-[10px] px-1.5 py-0 h-5">
                  {ungroupedItems.length}
                </Badge>
              </CardTitle>
              <CardDescription className="text-xs">These items appear individually in your sidebar</CardDescription>
            </CardHeader>
            <CardContent className="pt-0">
              <div className="flex flex-wrap gap-1.5">
                {ungroupedItems.map(itemId => {
                  const Icon = ICON_MAP[itemId] || FileText;
                  return (
                    <motion.div
                      key={itemId}
                      layout
                      className="flex items-center gap-2 px-2.5 py-1.5 rounded-lg bg-muted/30 border border-border/30"
                    >
                      <Icon className="w-3.5 h-3.5 text-muted-foreground" />
                      <span className="text-xs font-medium text-muted-foreground">{LABEL_MAP[itemId] || itemId}</span>
                    </motion.div>
                  );
                })}
              </div>
            </CardContent>
          </Card>
        </motion.div>
      )}

      {/* Create Folder Dialog */}
      <Dialog open={createOpen} onOpenChange={setCreateOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Create New Folder</DialogTitle>
            <DialogDescription>Name your folder and pick a color.</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-2">
              <Label>Folder Name</Label>
              <Input
                value={newName}
                onChange={(e) => setNewName(e.target.value)}
                placeholder="e.g. Work, Marketing, Admin"
                maxLength={30}
                onKeyDown={(e) => e.key === 'Enter' && handleCreate()}
              />
            </div>
            <div className="space-y-2">
              <Label>Color</Label>
              <div className="flex flex-wrap gap-2">
                {FOLDER_COLORS.map(c => (
                  <button
                    key={c.value}
                    onClick={() => setNewColor(c.value)}
                    className={cn(
                      "w-8 h-8 rounded-full transition-all duration-200 ring-offset-2 ring-offset-background",
                      newColor === c.value ? "ring-2 ring-primary scale-110" : "hover:scale-105 opacity-70 hover:opacity-100"
                    )}
                    style={{ backgroundColor: c.value }}
                    title={c.name}
                  />
                ))}
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setCreateOpen(false)}>Cancel</Button>
            <Button onClick={handleCreate} disabled={!newName.trim()}>Create Folder</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit Folder Dialog */}
      <Dialog open={!!editFolder} onOpenChange={(open) => !open && setEditFolder(null)}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Edit Folder</DialogTitle>
            <DialogDescription>Rename or change the folder color.</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-2">
              <Label>Folder Name</Label>
              <Input
                value={newName}
                onChange={(e) => setNewName(e.target.value)}
                placeholder="Folder name"
                maxLength={30}
                onKeyDown={(e) => e.key === 'Enter' && handleEdit()}
              />
            </div>
            <div className="space-y-2">
              <Label>Color</Label>
              <div className="flex flex-wrap gap-2">
                {FOLDER_COLORS.map(c => (
                  <button
                    key={c.value}
                    onClick={() => setNewColor(c.value)}
                    className={cn(
                      "w-8 h-8 rounded-full transition-all duration-200 ring-offset-2 ring-offset-background",
                      newColor === c.value ? "ring-2 ring-primary scale-110" : "hover:scale-105 opacity-70 hover:opacity-100"
                    )}
                    style={{ backgroundColor: c.value }}
                    title={c.name}
                  />
                ))}
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditFolder(null)}>Cancel</Button>
            <Button onClick={handleEdit} disabled={!newName.trim()}>Save Changes</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete confirmation */}
      <AlertDialog open={!!deleteConfirm} onOpenChange={(open) => !open && setDeleteConfirm(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Folder?</AlertDialogTitle>
            <AlertDialogDescription>
              Items in this folder will be returned to the main sidebar. This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => deleteConfirm && handleDelete(deleteConfirm)}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Delete Folder
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </motion.div>
  );
}
