import { useState, useEffect, useCallback, useRef } from 'react';

export interface TeamSidebarFolder {
  id: string;
  name: string;
  color: string;
  itemIds: string[];
  expanded: boolean;
}

export interface TeamSidebarLayoutData {
  folders: TeamSidebarFolder[];
  itemOrder: string[];
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

export { FOLDER_COLORS as TEAM_FOLDER_COLORS };

const DEFAULT_LAYOUT: TeamSidebarLayoutData = { folders: [], itemOrder: [] };
const STORAGE_KEY = 'team-sidebar-layout';
const SYNC_EVENT = 'team-sidebar-layout-sync';

export const TEAM_DEFAULT_PRESET_FOLDERS = [
  { name: 'CRM', color: '#3b82f6', itemIds: ['enquiries', 'leads', 'clients', 'client-accounts'] },
  { name: 'Services', color: '#22c55e', itemIds: ['apps', 'ads', 'social', 'content', 'websites'] },
  { name: 'Finance', color: '#eab308', itemIds: ['invoices', 'billing'] },
  { name: 'Operations', color: '#f97316', itemIds: ['calendar', 'messages', 'team-comms', 'assets', 'tickets', 'workflows', 'resources'] },
  { name: 'Admin', color: '#a855f7', itemIds: ['security', 'announcements', 'live-sessions', 'settings', 'knowledge-base', 'automation-rules'] },
];

function broadcastLayout(newLayout: TeamSidebarLayoutData) {
  window.dispatchEvent(new CustomEvent(SYNC_EVENT, { detail: newLayout }));
}

function buildPresetLayout(): TeamSidebarLayoutData {
  const folders: TeamSidebarFolder[] = TEAM_DEFAULT_PRESET_FOLDERS.map((p, i) => ({
    id: `team-folder-preset-${i}`,
    name: p.name,
    color: p.color,
    itemIds: p.itemIds,
    expanded: true,
  }));
  return { folders, itemOrder: folders.map(f => f.id) };
}

function loadLayout(): TeamSidebarLayoutData {
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) return JSON.parse(saved);
  } catch {}
  return buildPresetLayout();
}

export function useTeamSidebarLayout() {
  const [layout, setLayout] = useState<TeamSidebarLayoutData>(loadLayout);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (!saved) {
      const preset = buildPresetLayout();
      setLayout(preset);
      localStorage.setItem(STORAGE_KEY, JSON.stringify(preset));
    }
    setLoaded(true);
  }, []);

  useEffect(() => {
    const handler = (e: Event) => {
      const detail = (e as CustomEvent<TeamSidebarLayoutData>).detail;
      if (detail) setLayout(detail);
    };
    window.addEventListener(SYNC_EVENT, handler);
    return () => window.removeEventListener(SYNC_EVENT, handler);
  }, []);

  const save = useCallback((newLayout: TeamSidebarLayoutData) => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(newLayout));
    queueMicrotask(() => broadcastLayout(newLayout));
  }, []);

  const update = useCallback((fn: (prev: TeamSidebarLayoutData) => TeamSidebarLayoutData) => {
    setLayout(prev => {
      const next = fn(prev);
      save(next);
      return next;
    });
  }, [save]);

  const createFolder = useCallback((name: string, color: string, itemIds: string[] = []) => {
    const id = `team-folder-${Date.now().toString(36)}`;
    update(prev => {
      const newOrder = prev.itemOrder.filter(i => !itemIds.includes(i));
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
      newOrder.splice(idx >= 0 ? idx : newOrder.length, 0, ...folder.itemIds);
      return { folders: prev.folders.filter(f => f.id !== folderId), itemOrder: newOrder };
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

  const moveToFolder = useCallback((itemId: string, folderId: string) => {
    update(prev => {
      const folder = prev.folders.find(f => f.id === folderId);
      if (!folder || folder.itemIds.length >= 10) return prev;
      const folders = prev.folders.map(f => ({ ...f, itemIds: f.itemIds.filter(i => i !== itemId) }));
      const updatedFolders = folders.map(f => f.id === folderId ? { ...f, itemIds: [...f.itemIds, itemId] } : f);
      return { folders: updatedFolders, itemOrder: prev.itemOrder.filter(i => i !== itemId) };
    });
  }, [update]);

  const moveOutOfFolder = useCallback((itemId: string, folderId: string) => {
    update(prev => {
      const folder = prev.folders.find(f => f.id === folderId);
      if (!folder) return prev;
      const folderIdx = prev.itemOrder.indexOf(folderId);
      const newFolders = prev.folders.map(f => f.id === folderId ? { ...f, itemIds: f.itemIds.filter(i => i !== itemId) } : f);
      const cleanFolders = newFolders.filter(f => f.itemIds.length > 0);
      const newOrder = [...prev.itemOrder];
      if (cleanFolders.every(f => f.id !== folderId)) {
        const idx = newOrder.indexOf(folderId);
        if (idx >= 0) newOrder[idx] = itemId;
      } else {
        newOrder.splice(folderIdx + 1, 0, itemId);
      }
      return { folders: cleanFolders, itemOrder: newOrder };
    });
  }, [update]);

  const mergeIntoFolder = useCallback((itemA: string, itemB: string) => {
    const id = `team-folder-${Date.now().toString(36)}`;
    update(prev => {
      let folders = prev.folders.map(f => ({ ...f, itemIds: f.itemIds.filter(i => i !== itemA && i !== itemB) }));
      folders = folders.filter(f => f.itemIds.length > 0);
      const aIdx = prev.itemOrder.indexOf(itemA);
      const bIdx = prev.itemOrder.indexOf(itemB);
      const insertAt = Math.min(aIdx >= 0 ? aIdx : Infinity, bIdx >= 0 ? bIdx : Infinity);
      const newOrder = prev.itemOrder.filter(i => i !== itemA && i !== itemB);
      newOrder.splice(insertAt >= 0 && insertAt < newOrder.length + 1 ? insertAt : newOrder.length, 0, id);
      return { folders: [...folders, { id, name: 'New Folder', color: '#6b7280', itemIds: [itemA, itemB], expanded: true }], itemOrder: newOrder };
    });
  }, [update]);

  const reorderRoot = useCallback((fromIdx: number, toIdx: number) => {
    update(prev => {
      const newOrder = [...prev.itemOrder];
      const [moved] = newOrder.splice(fromIdx, 1);
      newOrder.splice(toIdx, 0, moved);
      return { ...prev, itemOrder: newOrder };
    });
  }, [update]);

  const resetToPresets = useCallback(() => {
    const preset = buildPresetLayout();
    setLayout(preset);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(preset));
    queueMicrotask(() => broadcastLayout(preset));
  }, []);

  const clearAllFolders = useCallback(() => {
    const empty: TeamSidebarLayoutData = { folders: [], itemOrder: [] };
    setLayout(empty);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(empty));
    queueMicrotask(() => broadcastLayout(empty));
  }, []);

  return {
    layout, loaded, createFolder, renameFolder, deleteFolder, changeFolderColor,
    toggleFolder, moveToFolder, moveOutOfFolder, mergeIntoFolder, reorderRoot,
    resetToPresets, clearAllFolders, update,
  };
}
