import { useState, useEffect, useCallback, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';

export interface SidebarFolder {
  id: string;
  name: string;
  color: string;
  itemIds: string[];
  expanded: boolean;
}

export interface SidebarLayoutData {
  folders: SidebarFolder[];
  itemOrder: string[]; // ordered list of itemIds and folderIds at root level
}

const FOLDER_COLORS = [
  { name: 'Red', value: '#ef4444' },
  { name: 'Orange', value: '#f97316' },
  { name: 'Yellow', value: '#eab308' },
  { name: 'Green', value: '#22c55e' },
  { name: 'Blue', value: '#3b82f6' },
  { name: 'Purple', value: '#a855f7' },
  { name: 'Pink', value: '#ec4899' },
  { name: 'Gray', value: '#6b7280' },
];

export { FOLDER_COLORS };

const DEFAULT_LAYOUT: SidebarLayoutData = { folders: [], itemOrder: [] };
const SAVE_DEBOUNCE_MS = 2000;
const LAYOUT_SYNC_EVENT = 'sidebar-layout-sync';

// Night Shift default tones: neutral / ember / brass rotation
export const DEFAULT_PRESET_FOLDERS = [
  { name: 'Website', color: '#8a8a8a', itemIds: ['website', 'ai-builder'] },
  { name: 'Projects', color: '#C2410C', itemIds: ['products', 'apps', 'workflows', 'content', 'planner'] },
  { name: 'Marketing', color: '#a16207', itemIds: ['seo', 'ads', 'social', 'calendar'] },
  { name: 'Files', color: '#8a8a8a', itemIds: ['assets', 'uploads'] },
  { name: 'Manage', color: '#C2410C', itemIds: ['crm', 'team', 'billing', 'messages', 'tickets', 'mail', 'team-comms', 'notifications', 'settings'] },
  { name: 'Subscriptions', color: '#a16207', itemIds: ['website-designer', 'cad-studio', 'inventory', 'office', 'white-label', 'automations-pro'] },
];

const SUBSCRIPTION_ITEM_IDS = ['website-designer', 'cad-studio', 'inventory', 'office', 'white-label', 'automations-pro'];
const OLD_SUBSCRIPTION_IDS = ['website-dashboard', 'ai-builder']; // legacy IDs to clean up

// Ensure existing saved layouts have the Subscriptions folder with correct IDs
function migrateLayout(layout: SidebarLayoutData): { layout: SidebarLayoutData; changed: boolean } {
  let changed = false;

  // Step 1: Rename 'website-dashboard' → 'website-designer' everywhere
  let folders = layout.folders.map((f) => ({
    ...f,
    itemIds: f.itemIds.map((id) => id === 'website-dashboard' ? 'website-designer' : id),
    name: f.name === 'Website Dashboard' ? 'Website Designer' : f.name,
  }));
  const itemOrder = layout.itemOrder.map((id) => id === 'website-dashboard' ? 'website-designer' : id);
  if (JSON.stringify(folders) !== JSON.stringify(layout.folders) || JSON.stringify(itemOrder) !== JSON.stringify(layout.itemOrder)) {
    changed = true;
  }

  // Step 2: Remove 'ai-builder' from any folders (it's merged into Website Designer now)
  folders = folders.map((f) => ({
    ...f,
    itemIds: f.itemIds.filter((id) => id !== 'ai-builder'),
  })).filter((f) => f.itemIds.length > 0);

  // Step 3: Ensure a Subscriptions folder exists with the correct items
  const hasSubFolder = folders.some((f) => f.name === 'Subscriptions');
  if (!hasSubFolder) {
    const folderId = `folder-subscriptions`;
    const cleanOrder = itemOrder
      .filter((id) => !SUBSCRIPTION_ITEM_IDS.includes(id) && !OLD_SUBSCRIPTION_IDS.includes(id))
      .filter((id) => id !== folderId);
    cleanOrder.push(folderId);
    folders = folders.map((f) => ({
      ...f,
      itemIds: f.itemIds.filter((id) => !SUBSCRIPTION_ITEM_IDS.includes(id)),
    })).filter((f) => f.itemIds.length > 0);
    folders = [...folders, { id: folderId, name: 'Subscriptions', color: '#a16207', itemIds: SUBSCRIPTION_ITEM_IDS, expanded: true }];
    return { layout: { folders, itemOrder: cleanOrder }, changed: true };
  }

  // Step 4: Make sure the Subscriptions folder has all required items
  const subFolder = folders.find((f) => f.name === 'Subscriptions');
  if (subFolder) {
    const missingIds = SUBSCRIPTION_ITEM_IDS.filter((id) => !subFolder.itemIds.includes(id));
    if (missingIds.length > 0) {
      // Remove these items from other folders and root order
      folders = folders.map((f) =>
        f.name === 'Subscriptions'
          ? { ...f, itemIds: [...f.itemIds, ...missingIds] }
          : { ...f, itemIds: f.itemIds.filter((id) => !missingIds.includes(id)) }
      ).filter((f) => f.itemIds.length > 0);
      changed = true;
    }
  }

  // Step 5: Ensure mail, team-comms, notifications are in Manage folder
  const MANAGE_EXTRAS = ['mail', 'team-comms', 'notifications'];
  const manageFolder = folders.find((f) => f.name === 'Manage');
  if (manageFolder) {
    const missingManage = MANAGE_EXTRAS.filter((id) => !manageFolder.itemIds.includes(id) && !folders.some((f) => f.name !== 'Manage' && f.itemIds.includes(id)));
    if (missingManage.length > 0) {
      folders = folders.map((f) =>
        f.name === 'Manage' ? { ...f, itemIds: [...f.itemIds, ...missingManage] } : f
      );
      changed = true;
    }
  }

  // Step 6: Ensure planner is in Projects folder
  const projectsFolder = folders.find((f) => f.name === 'Projects');
  if (projectsFolder && !projectsFolder.itemIds.includes('planner')) {
    // Remove from root or other folders
    folders = folders.map((f) =>
      f.name === 'Projects' ? { ...f, itemIds: [...f.itemIds, 'planner'] } : { ...f, itemIds: f.itemIds.filter((id) => id !== 'planner') }
    );
    changed = true;
  }

  return { layout: { folders, itemOrder }, changed };
}

// Broadcast layout changes to other hook instances
function broadcastLayout(newLayout: SidebarLayoutData) {
  window.dispatchEvent(new CustomEvent(LAYOUT_SYNC_EVENT, { detail: newLayout }));
}

function buildPresetLayout(): SidebarLayoutData {
  const folders: SidebarFolder[] = DEFAULT_PRESET_FOLDERS.map((p, i) => ({
    id: `folder-preset-${i}`,
    name: p.name,
    color: p.color,
    itemIds: p.itemIds,
    expanded: true,
  }));
  const itemOrder = folders.map(f => f.id);
  return { folders, itemOrder };
}

export function useSidebarLayout(userId: string | undefined) {
  const [layout, setLayout] = useState<SidebarLayoutData>(DEFAULT_LAYOUT);
  const [loaded, setLoaded] = useState(false);
  const saveTimer = useRef<ReturnType<typeof setTimeout>>();
  const pendingLayout = useRef<SidebarLayoutData | null>(null);

  // Load from DB — if no saved layout, apply presets
  useEffect(() => {
    if (!userId) return;
    (async () => {
      const { data } = await supabase
        .from('user_sidebar_layout')
        .select('layout_data')
        .eq('user_id', userId)
        .maybeSingle();
      if (data?.layout_data) {
        const saved = data.layout_data as unknown as SidebarLayoutData;
        const { layout: migrated, changed } = migrateLayout(saved);
        setLayout(migrated);
        if (changed) {
          await supabase
            .from('user_sidebar_layout')
            .upsert({ user_id: userId, layout_data: migrated as any }, { onConflict: 'user_id' });
        }
      } else {
        // First time user — apply presets
        const preset = buildPresetLayout();
        setLayout(preset);
        await supabase
          .from('user_sidebar_layout')
          .upsert({ user_id: userId, layout_data: preset as any }, { onConflict: 'user_id' });
      }
      setLoaded(true);
    })();
  }, [userId]);

  // Listen for cross-instance sync events
  useEffect(() => {
    const handler = (e: Event) => {
      const detail = (e as CustomEvent<SidebarLayoutData>).detail;
      if (detail) setLayout(detail);
    };
    window.addEventListener(LAYOUT_SYNC_EVENT, handler);
    return () => window.removeEventListener(LAYOUT_SYNC_EVENT, handler);
  }, []);

  // Debounced save
  const scheduleSave = useCallback((newLayout: SidebarLayoutData) => {
    if (!userId) return;
    pendingLayout.current = newLayout;
    if (saveTimer.current) clearTimeout(saveTimer.current);
    saveTimer.current = setTimeout(async () => {
      const toSave = pendingLayout.current;
      if (!toSave) return;
      await supabase
        .from('user_sidebar_layout')
        .upsert({ user_id: userId, layout_data: toSave as any }, { onConflict: 'user_id' });
      pendingLayout.current = null;
    }, SAVE_DEBOUNCE_MS);
  }, [userId]);

  // Immediate save (for destructive operations)
  const saveNow = useCallback(async (newLayout: SidebarLayoutData) => {
    if (!userId) return;
    if (saveTimer.current) clearTimeout(saveTimer.current);
    pendingLayout.current = null;
    await supabase
      .from('user_sidebar_layout')
      .upsert({ user_id: userId, layout_data: newLayout as any }, { onConflict: 'user_id' });
  }, [userId]);

  const update = useCallback((fn: (prev: SidebarLayoutData) => SidebarLayoutData) => {
    setLayout(prev => {
      const next = fn(prev);
      scheduleSave(next);
      // Defer broadcast to avoid triggering setState in another component during this render
      queueMicrotask(() => broadcastLayout(next));
      return next;
    });
  }, [scheduleSave]);

  // --- Folder CRUD ---

  const createFolder = useCallback((name: string, color: string, itemIds: string[] = []) => {
    const id = `folder-${Date.now().toString(36)}`;
    update(prev => {
      const newOrder = prev.itemOrder.filter(i => !itemIds.includes(i));
      // Insert folder where the first item was
      const firstIdx = prev.itemOrder.findIndex(i => itemIds.includes(i));
      const insertAt = firstIdx >= 0 ? firstIdx : newOrder.length;
      newOrder.splice(insertAt, 0, id);
      return {
        folders: [...prev.folders, { id, name, color, itemIds, expanded: true }],
        itemOrder: newOrder,
      };
    });
    return id;
  }, [update]);

  const renameFolder = useCallback((folderId: string, name: string) => {
    update(prev => ({
      ...prev,
      folders: prev.folders.map(f => f.id === folderId ? { ...f, name } : f),
    }));
  }, [update]);

  const deleteFolder = useCallback((folderId: string) => {
    update(prev => {
      const folder = prev.folders.find(f => f.id === folderId);
      if (!folder) return prev;
      const idx = prev.itemOrder.indexOf(folderId);
      const newOrder = prev.itemOrder.filter(i => i !== folderId);
      // Re-insert folder items at the folder's position
      newOrder.splice(idx >= 0 ? idx : newOrder.length, 0, ...folder.itemIds);
      return {
        folders: prev.folders.filter(f => f.id !== folderId),
        itemOrder: newOrder,
      };
    });
  }, [update]);

  const changeFolderColor = useCallback((folderId: string, color: string) => {
    update(prev => ({
      ...prev,
      folders: prev.folders.map(f => f.id === folderId ? { ...f, color } : f),
    }));
  }, [update]);

  const toggleFolder = useCallback((folderId: string) => {
    update(prev => ({
      ...prev,
      folders: prev.folders.map(f => f.id === folderId ? { ...f, expanded: !f.expanded } : f),
    }));
  }, [update]);

  // Move item into a folder
  const moveToFolder = useCallback((itemId: string, folderId: string) => {
    update(prev => {
      const folder = prev.folders.find(f => f.id === folderId);
      if (!folder || folder.itemIds.length >= 10) return prev;
      // Remove from any existing folder
      const folders = prev.folders.map(f => ({
        ...f,
        itemIds: f.itemIds.filter(i => i !== itemId),
      }));
      // Add to target folder
      const updatedFolders = folders.map(f =>
        f.id === folderId ? { ...f, itemIds: [...f.itemIds, itemId] } : f
      );
      // Remove solo folders (< 2 items) — but keep them if they were explicitly created
      return {
        folders: updatedFolders,
        itemOrder: prev.itemOrder.filter(i => i !== itemId),
      };
    });
  }, [update]);

  // Move item out of folder back to root
  const moveOutOfFolder = useCallback((itemId: string, folderId: string) => {
    update(prev => {
      const folder = prev.folders.find(f => f.id === folderId);
      if (!folder) return prev;
      const folderIdx = prev.itemOrder.indexOf(folderId);
      const newFolders = prev.folders.map(f =>
        f.id === folderId ? { ...f, itemIds: f.itemIds.filter(i => i !== itemId) } : f
      );
      // Remove empty folders
      const cleanFolders = newFolders.filter(f => f.itemIds.length > 0);
      const newOrder = [...prev.itemOrder];
      // If folder is now empty, replace it with the item
      if (cleanFolders.every(f => f.id !== folderId)) {
        const idx = newOrder.indexOf(folderId);
        if (idx >= 0) newOrder[idx] = itemId;
      } else {
        newOrder.splice(folderIdx + 1, 0, itemId);
      }
      return { folders: cleanFolders, itemOrder: newOrder };
    });
  }, [update]);

  // Create folder by merging two items
  const mergeIntoFolder = useCallback((itemA: string, itemB: string) => {
    const id = `folder-${Date.now().toString(36)}`;
    update(prev => {
      // Remove both from any existing folder
      let folders = prev.folders.map(f => ({
        ...f,
        itemIds: f.itemIds.filter(i => i !== itemA && i !== itemB),
      }));
      // Clean empty folders
      folders = folders.filter(f => f.itemIds.length > 0);
      const aIdx = prev.itemOrder.indexOf(itemA);
      const bIdx = prev.itemOrder.indexOf(itemB);
      const insertAt = Math.min(aIdx >= 0 ? aIdx : Infinity, bIdx >= 0 ? bIdx : Infinity);
      const newOrder = prev.itemOrder.filter(i => i !== itemA && i !== itemB);
      newOrder.splice(insertAt >= 0 && insertAt < newOrder.length + 1 ? insertAt : newOrder.length, 0, id);
      return {
        folders: [...folders, { id, name: 'New Folder', color: '#8a8a8a', itemIds: [itemA, itemB], expanded: true }],
        itemOrder: newOrder,
      };
    });
  }, [update]);

  // Reorder root items
  const reorderRoot = useCallback((fromIdx: number, toIdx: number) => {
    update(prev => {
      const newOrder = [...prev.itemOrder];
      const [moved] = newOrder.splice(fromIdx, 1);
      newOrder.splice(toIdx, 0, moved);
      return { ...prev, itemOrder: newOrder };
    });
  }, [update]);

  // Reorder within folder
  const reorderInFolder = useCallback((folderId: string, fromIdx: number, toIdx: number) => {
    update(prev => ({
      ...prev,
      folders: prev.folders.map(f => {
        if (f.id !== folderId) return f;
        const items = [...f.itemIds];
        const [moved] = items.splice(fromIdx, 1);
        items.splice(toIdx, 0, moved);
        return { ...f, itemIds: items };
      }),
    }));
  }, [update]);

  const resetToPresets = useCallback(() => {
    const preset = buildPresetLayout();
    setLayout(preset);
    saveNow(preset);
    queueMicrotask(() => broadcastLayout(preset));
  }, [saveNow]);

  const clearAllFolders = useCallback(() => {
    const empty: SidebarLayoutData = { folders: [], itemOrder: [] };
    setLayout(empty);
    saveNow(empty);
    queueMicrotask(() => broadcastLayout(empty));
  }, [saveNow]);

  return {
    layout,
    loaded,
    createFolder,
    renameFolder,
    deleteFolder,
    changeFolderColor,
    toggleFolder,
    moveToFolder,
    moveOutOfFolder,
    mergeIntoFolder,
    reorderRoot,
    reorderInFolder,
    resetToPresets,
    clearAllFolders,
    update,
  };
}
