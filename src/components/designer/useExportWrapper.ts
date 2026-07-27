import { useCallback } from 'react';
import { useEditor } from './EditorContext';
import { exportToHTML } from './utils/htmlExporter';
import JSZip from 'jszip';

export function useExportWrapper(siteName: string) {
  const { state } = useEditor();

  const downloadExport = useCallback(async () => {
    const { html, css } = exportToHTML(state.elements, siteName);

    const zip = new JSZip();
    zip.file('index.html', html);
    zip.file('styles.css', css);

    const blob = await zip.generateAsync({ type: 'blob' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${siteName.replace(/\s+/g, '-').toLowerCase()}-export.zip`;
    a.click();
    URL.revokeObjectURL(url);
  }, [state.elements, siteName]);

  return { downloadExport };
}
