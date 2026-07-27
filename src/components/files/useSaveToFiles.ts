import { useState, useCallback } from 'react';
import type { SaveToFilesOptions } from './SaveToFilesDialog';

/**
 * Universal hook for triggering the "Save to Files" dialog from any app.
 * 
 * Usage:
 *   const { openSaveDialog, saveDialogProps } = useSaveToFiles();
 * 
 *   // In a save handler:
 *   openSaveDialog({
 *     fileName: 'My Website',
 *     fileType: 'website',
 *     appSource: 'workshop',
 *     sourceId: siteId,
 *     sourceRoute: `/lounge/website-editor/${siteId}`,
 *     onSaveToDevice: () => downloadExport(),
 *   });
 * 
 *   // In JSX:
 *   <SaveToFilesDialog {...saveDialogProps} />
 */
export function useSaveToFiles() {
  const [open, setOpen] = useState(false);
  const [options, setOptions] = useState<SaveToFilesOptions>({
    fileName: '',
    fileType: '',
    appSource: '',
  });
  const [onSavedCallback, setOnSavedCallback] = useState<((fileId: string) => void) | undefined>();

  const openSaveDialog = useCallback((opts: SaveToFilesOptions, onSaved?: (fileId: string) => void) => {
    setOptions(opts);
    setOnSavedCallback(() => onSaved);
    setOpen(true);
  }, []);

  return {
    openSaveDialog,
    saveDialogProps: {
      open,
      onOpenChange: setOpen,
      options,
      onSaved: onSavedCallback,
    },
  };
}
