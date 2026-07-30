import { useRef, useState } from 'react';
import { Download, Upload, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { toast } from '@/hooks/use-toast';
import type { EntityType } from './useCRMData';
import { exportEntities, importEntities, EXPORT_COLUMNS, toCSV, downloadCSV } from './csvIO';

interface Props {
  entity: EntityType;
  rows: any[];
  onImported: () => void;
  /**
   * Opens the rich lead-import dialog. The dialog itself is mounted by
   * CRMShell at the shell root - NOT here - so a list refresh (which
   * re-renders this toolbar) can never unmount an open dialog and swallow
   * the import receipt (IMPORT-CONTRACT.md defect 1).
   */
  onOpenLeadImport?: () => void;
}

export function ImportExportMenu({ entity, rows, onImported, onOpenLeadImport }: Props) {
  const fileRef = useRef<HTMLInputElement>(null);
  const [busy, setBusy] = useState(false);

  const handleExport = () => {
    if (!rows.length) {
      toast({ title: 'Nothing to export', description: `No ${entity}s in the current view.` });
      return;
    }
    exportEntities(entity, rows);
    toast({ title: 'Exported', description: `${rows.length} ${entity}s exported as CSV.` });
  };

  const handleTemplate = () => {
    downloadCSV(`crm-${entity}s-template.csv`, toCSV([], EXPORT_COLUMNS[entity]));
  };

  const handleImportClick = () => fileRef.current?.click();

  const handleFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file) return;
    setBusy(true);
    try {
      const text = await file.text();
      const res = await importEntities(entity, text);
      toast({
        title: res.failed ? 'Import completed with errors' : 'Import complete',
        description: `${res.inserted} imported${res.failed ? `, ${res.failed} failed` : ''}${res.errors[0] ? `. ${res.errors[0]}` : ''}`,
        variant: res.failed ? 'destructive' : 'default',
      });
      onImported();
    } catch (err: any) {
      toast({ title: 'Import failed', description: err?.message || 'Unknown error', variant: 'destructive' });
    } finally {
      setBusy(false);
    }
  };

  return (
    <>
      <input ref={fileRef} type="file" accept=".csv,text/csv" className="hidden" onChange={handleFile} />
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button size="sm" variant="ghost" className="h-11 sm:h-7 gap-1 text-xs shrink-0" disabled={busy}>
            {busy ? <Loader2 className="h-3 w-3 animate-spin" /> : <Download className="h-3 w-3" />}
            Data
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-60">
          {(entity === 'contact' || entity === 'company') && onOpenLeadImport && (
            <>
              <DropdownMenuItem onClick={onOpenLeadImport}>
                <Upload className="h-3.5 w-3.5 mr-2" /> Import leads (CSV, Excel, JSON, HTML, manual)
              </DropdownMenuItem>
              <DropdownMenuSeparator />
            </>
          )}
          <DropdownMenuItem onClick={handleExport}>
            <Download className="h-3.5 w-3.5 mr-2" /> Export {rows.length} to CSV
          </DropdownMenuItem>
          <DropdownMenuItem onClick={handleImportClick}>
            <Upload className="h-3.5 w-3.5 mr-2" /> Quick CSV import
          </DropdownMenuItem>
          <DropdownMenuItem onClick={handleTemplate}>
            <Download className="h-3.5 w-3.5 mr-2" /> Download template
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </>
  );
}
