import { useRef, useState } from 'react';
import { Download, Upload, Loader2, Sparkles } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { toast } from '@/hooks/use-toast';
import type { EntityType } from './useCRMData';
import CRMLeadImportDialog from './CRMLeadImportDialog';
import { exportEntities, importEntities, EXPORT_COLUMNS, toCSV, downloadCSV } from './csvIO';

interface Props {
  entity: EntityType;
  rows: any[];
  onImported: () => void;
}

export function ImportExportMenu({ entity, rows, onImported }: Props) {
  const fileRef = useRef<HTMLInputElement>(null);
  const [busy, setBusy] = useState(false);
  const [leadDialogOpen, setLeadDialogOpen] = useState(false);

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
      {entity === 'contact' && (
        <CRMLeadImportDialog open={leadDialogOpen} onOpenChange={setLeadDialogOpen} onImportComplete={onImported} />
      )}
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button size="sm" variant="ghost" className="h-7 gap-1 text-xs" disabled={busy}>
            {busy ? <Loader2 className="h-3 w-3 animate-spin" /> : <Download className="h-3 w-3" />}
            Data
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-60">
          {entity === 'contact' && (
            <>
              <DropdownMenuItem onClick={() => setLeadDialogOpen(true)}>
                <Sparkles className="h-3.5 w-3.5 mr-2" /> Import leads (CSV, Excel, JSON, HTML, Manual)
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
