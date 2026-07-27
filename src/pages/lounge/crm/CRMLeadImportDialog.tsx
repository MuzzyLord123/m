import { useState, useRef, useMemo } from 'react';
import * as XLSX from 'xlsx';
import { Upload, FileSpreadsheet, FileJson, Code, Plus, Check, Loader2, X, AlertCircle, FileText } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onImportComplete: () => void;
}

interface ParsedLead {
  business_name: string | null;
  personal_name: string | null;
  contact_name: string | null;
  phone: string | null;
  email: string | null;
  website_url: string | null;
  location_city: string | null;
  location_postcode: string | null;
  google_rating: number | null;
  review_count: number;
  category: string | null;
}

interface ImportResult { added: number; duplicates: number; errors: string[]; }

const FIELD_OPTIONS = [
  { value: '__skip', label: 'Skip this column' },
  { value: 'business_name', label: 'Business Name' },
  { value: 'personal_name', label: 'Personal Name' },
  { value: 'contact_name', label: 'Contact Name' },
  { value: 'phone', label: 'Phone' },
  { value: 'email', label: 'Email' },
  { value: 'website_url', label: 'Website' },
  { value: 'location_city', label: 'City' },
  { value: 'location_postcode', label: 'Postcode' },
  { value: 'google_rating', label: 'Google Rating' },
  { value: 'review_count', label: 'Review Count' },
  { value: 'category', label: 'Category' },
];

const emptyLead = (): ParsedLead => ({
  business_name: null, personal_name: null, contact_name: null,
  phone: null, email: null, website_url: null,
  location_city: null, location_postcode: null,
  google_rating: null, review_count: 0, category: null,
});

function autoMap(headers: string[]): Record<string, string> {
  const m: Record<string, string> = {};
  headers.forEach((h, i) => {
    const l = h.toLowerCase();
    if (l.includes('business') || l.includes('company') || l === 'name') m[i] = 'business_name';
    else if (l.includes('personal')) m[i] = 'personal_name';
    else if (l.includes('contact')) m[i] = 'contact_name';
    else if (l.includes('phone') || l.includes('tel') || l.includes('mobile')) m[i] = 'phone';
    else if (l.includes('email')) m[i] = 'email';
    else if (l.includes('website') || l.includes('url')) m[i] = 'website_url';
    else if (l.includes('city') || l.includes('location')) m[i] = 'location_city';
    else if (l.includes('postcode') || l.includes('zip')) m[i] = 'location_postcode';
    else if (l.includes('rating')) m[i] = 'google_rating';
    else if (l.includes('review')) m[i] = 'review_count';
    else if (l.includes('category') || l.includes('industry')) m[i] = 'category';
  });
  return m;
}

function parseCSVText(text: string): string[][] {
  return text.split(/\r?\n/).map(line => {
    const out: string[] = []; let cur = ''; let q = false;
    for (const ch of line) {
      if (ch === '"') q = !q;
      else if (ch === ',' && !q) { out.push(cur.trim()); cur = ''; }
      else cur += ch;
    }
    out.push(cur.trim());
    return out;
  }).filter(r => r.some(c => c.length));
}

export default function CRMLeadImportDialog({ open, onOpenChange, onImportComplete }: Props) {
  const [tab, setTab] = useState<'csv' | 'excel' | 'json' | 'html' | 'manual'>('csv');
  const [step, setStep] = useState<'input' | 'mapping' | 'preview'>('input');
  const [rawRows, setRawRows] = useState<string[][]>([]);
  const [headers, setHeaders] = useState<string[]>([]);
  const [mapping, setMapping] = useState<Record<string, string>>({});
  const [leads, setLeads] = useState<ParsedLead[]>([]);
  const [html, setHtml] = useState('');
  const [manual, setManual] = useState<ParsedLead>(emptyLead());
  const [importing, setImporting] = useState(false);
  const [progress, setProgress] = useState(0);
  const [processed, setProcessed] = useState(0);
  const [result, setResult] = useState<ImportResult | null>(null);
  const csvRef = useRef<HTMLInputElement>(null);
  const xlsxRef = useRef<HTMLInputElement>(null);
  const jsonRef = useRef<HTMLInputElement>(null);

  const reset = () => {
    setStep('input'); setRawRows([]); setHeaders([]); setMapping({});
    setLeads([]); setHtml(''); setManual(emptyLead()); setResult(null);
    setProgress(0); setProcessed(0);
  };
  const close = (v: boolean) => { if (!v) reset(); onOpenChange(v); };

  /* ---------- CSV ---------- */
  const handleCsv = (file: File) => {
    const r = new FileReader();
    r.onload = e => {
      const rows = parseCSVText(e.target?.result as string);
      if (!rows.length) return toast.error('Empty CSV');
      setHeaders(rows[0]); setRawRows(rows.slice(1));
      setMapping(autoMap(rows[0])); setStep('mapping');
    };
    r.readAsText(file);
  };

  /* ---------- Excel ---------- */
  const handleXlsx = (file: File) => {
    const r = new FileReader();
    r.onload = e => {
      try {
        const wb = XLSX.read(e.target?.result, { type: 'array' });
        const ws = wb.Sheets[wb.SheetNames[0]];
        const rows = XLSX.utils.sheet_to_json<any[]>(ws, { header: 1, defval: '' })
          .map(r => r.map(c => (c ?? '').toString())).filter(r => r.some((c: string) => c.length));
        if (!rows.length) return toast.error('Empty spreadsheet');
        setHeaders(rows[0]); setRawRows(rows.slice(1));
        setMapping(autoMap(rows[0])); setStep('mapping');
      } catch { toast.error('Failed to read Excel file'); }
    };
    r.readAsArrayBuffer(file);
  };

  /* ---------- JSON ---------- */
  const handleJson = (file: File) => {
    const r = new FileReader();
    r.onload = e => {
      try {
        const data = JSON.parse(e.target?.result as string);
        const arr = Array.isArray(data) ? data : (data.leads || data.data || []);
        if (!Array.isArray(arr) || !arr.length) return toast.error('No leads found in JSON');
        const parsed: ParsedLead[] = arr.map((it: any) => ({
          business_name: it.title || it.business_name || it.businessName || it.company || it.name || null,
          personal_name: it.personal_name || it.personalName || null,
          contact_name: it.contact_name || it.contactName || it.contact || null,
          phone: it.phone || it.telephone || it.tel || it.mobile || null,
          email: it.email || it.emailAddress || null,
          website_url: it.website_url || it.websiteUrl || it.website || null,
          location_city: it.city || it.location_city || it.locationCity || it.location || null,
          location_postcode: it.location_postcode || it.postcode || it.zip || null,
          google_rating: parseFloat(it.totalScore || it.google_rating || it.rating) || null,
          review_count: parseInt(it.reviewsCount || it.review_count || it.reviews) || 0,
          category: it.categoryName || it.category || it.industry || null,
        })).filter((l: ParsedLead) => l.business_name || l.personal_name || l.phone || l.email);
        if (!parsed.length) return toast.error('No valid leads (need name/email/phone)');
        setLeads(parsed); setStep('preview');
      } catch { toast.error('Invalid JSON'); }
    };
    r.readAsText(file);
  };

  /* ---------- HTML ---------- */
  const parseHtml = () => {
    try {
      const doc = new DOMParser().parseFromString(html, 'text/html');
      const rows = doc.querySelectorAll('tr');
      const out: ParsedLead[] = [];
      rows.forEach((row, i) => {
        if (i === 0) return;
        const cells = row.querySelectorAll('td');
        if (cells.length < 2) return;
        const l = emptyLead();
        cells.forEach(c => {
          const t = c.textContent?.trim() || '';
          if (/^[\d\s\-+()]{10,}$/.test(t)) l.phone = t;
          else if (t.includes('@') && t.includes('.')) l.email = t;
          else if (t.startsWith('http') || t.includes('www.')) l.website_url = t.startsWith('http') ? t : `https://${t}`;
          else if (/^\d\.\d$/.test(t) || /^[1-5]$/.test(t)) l.google_rating = parseFloat(t);
          else if (/^\d+$/.test(t) && +t < 100000) l.review_count = +t;
          else if (!l.business_name && t.length > 2 && !/^\d/.test(t)) l.business_name = t;
        });
        if (l.business_name || l.phone || l.email) out.push(l);
      });
      if (!out.length) return toast.error('No rows found in HTML');
      setLeads(out); setStep('preview');
    } catch { toast.error('Invalid HTML'); }
  };

  /* ---------- Mapping -> preview ---------- */
  const applyMapping = () => {
    const out: ParsedLead[] = rawRows.map(row => {
      const l = emptyLead();
      Object.entries(mapping).forEach(([i, f]) => {
        if (!f || f === '__skip') return;
        const v = (row[+i] || '').trim();
        if (!v) return;
        if (f === 'google_rating') l.google_rating = parseFloat(v) || null;
        else if (f === 'review_count') l.review_count = parseInt(v) || 0;
        else (l as any)[f] = v;
      });
      return l;
    }).filter(l => l.business_name || l.personal_name || l.phone || l.email);
    if (!out.length) return toast.error('No valid rows after mapping');
    setLeads(out); setStep('preview');
  };

  /* ---------- Import ---------- */
  const runImport = async (list: ParsedLead[], source: string) => {
    const { data: u } = await supabase.auth.getUser();
    const userId = u?.user?.id;
    if (!userId) return toast.error('Not signed in');
    const { data: admin } = await supabase.from('user_roles').select('user_id, created_at')
      .eq('role', 'admin').order('created_at', { ascending: true }).limit(1).maybeSingle();
    const orgId = admin?.user_id;
    if (!orgId) return toast.error('No admin org');

    // Load existing signatures for dedup (email/phone/full_name lowercased)
    const { data: existing } = await supabase.from('crm_contacts')
      .select('email, phone, full_name').eq('org_id', orgId).limit(20000);
    const seen = new Set<string>();
    (existing || []).forEach(e => {
      if (e.email) seen.add('e:' + e.email.toLowerCase());
      if (e.phone) seen.add('p:' + e.phone.replace(/\s+/g, ''));
      if (e.full_name) seen.add('n:' + e.full_name.toLowerCase());
    });

    setImporting(true); setProgress(0); setProcessed(0);
    const res: ImportResult = { added: 0, duplicates: 0, errors: [] };
    const CHUNK = 500;

    for (let i = 0; i < list.length; i += CHUNK) {
      const batch = list.slice(i, i + CHUNK);
      const rows: any[] = [];
      for (const l of batch) {
        const name = l.personal_name || l.contact_name || l.business_name;
        const sigs = [
          l.email && 'e:' + l.email.toLowerCase(),
          l.phone && 'p:' + l.phone.replace(/\s+/g, ''),
          name && 'n:' + name.toLowerCase(),
        ].filter(Boolean) as string[];
        if (sigs.some(s => seen.has(s))) { res.duplicates++; continue; }
        sigs.forEach(s => seen.add(s));
        const notesParts = [
          l.business_name && `Business: ${l.business_name}`,
          l.website_url && `Web: ${l.website_url}`,
          l.location_city && `City: ${l.location_city}`,
          l.location_postcode && `Postcode: ${l.location_postcode}`,
          l.google_rating && `Rating: ${l.google_rating} (${l.review_count})`,
          l.category && `Category: ${l.category}`,
        ].filter(Boolean);
        rows.push({
          org_id: orgId, owner_id: userId,
          full_name: name || l.business_name,
          email: l.email, phone: l.phone,
          job_title: l.category, source,
          relationship_type: ['lead'],
          notes: notesParts.join(' • ') || null,
        });
      }
      if (rows.length) {
        const { error } = await supabase.from('crm_contacts').insert(rows as any);
        if (error) res.errors.push(error.message);
        else res.added += rows.length;
      }
      const done = Math.min(i + CHUNK, list.length);
      setProcessed(done); setProgress(Math.round((done / list.length) * 100));
    }

    setResult(res); setImporting(false);
    if (res.added) { toast.success(`Imported ${res.added} leads`); onImportComplete(); }
    if (res.duplicates) toast.warning(`${res.duplicates} duplicates skipped`);
    if (res.errors.length) toast.error(res.errors[0]);
  };

  const previewCounts = useMemo(() => {
    const withEmail = leads.filter(l => l.email).length;
    const withPhone = leads.filter(l => l.phone).length;
    return { withEmail, withPhone };
  }, [leads]);

  return (
    <Dialog open={open} onOpenChange={close}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2"><Upload className="h-5 w-5" /> Import Leads</DialogTitle>
          <DialogDescription>Import from CSV, Excel, JSON, HTML tables, or add one manually. Duplicates (matching email, phone, or name) are skipped automatically.</DialogDescription>
        </DialogHeader>

        {result ? (
          <div className="py-8 text-center space-y-4">
            <div className="mx-auto h-12 w-12 rounded-full bg-green-500/10 flex items-center justify-center">
              <Check className="h-6 w-6 text-green-500" />
            </div>
            <div className="text-lg font-semibold">Import complete</div>
            <div className="flex justify-center gap-6 text-sm">
              <div><div className="text-2xl font-bold text-green-500">{result.added}</div><div className="text-muted-foreground">Added</div></div>
              <div><div className="text-2xl font-bold text-yellow-500">{result.duplicates}</div><div className="text-muted-foreground">Duplicates</div></div>
              <div><div className="text-2xl font-bold text-red-500">{result.errors.length}</div><div className="text-muted-foreground">Errors</div></div>
            </div>
            <Button onClick={() => close(false)}>Done</Button>
          </div>
        ) : importing ? (
          <div className="py-8 space-y-4">
            <div className="text-center"><Loader2 className="h-8 w-8 animate-spin mx-auto text-primary" /></div>
            <Progress value={progress} />
            <div className="text-center text-sm text-muted-foreground">{processed} / {leads.length} • {progress}%</div>
          </div>
        ) : step === 'preview' ? (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex gap-4 text-sm">
                <Badge variant="secondary">{leads.length} leads</Badge>
                <Badge variant="outline">{previewCounts.withEmail} with email</Badge>
                <Badge variant="outline">{previewCounts.withPhone} with phone</Badge>
              </div>
              <Button variant="ghost" size="sm" onClick={reset}><X className="h-3 w-3 mr-1" /> Start over</Button>
            </div>
            <div className="border rounded-md max-h-[400px] overflow-auto">
              <table className="w-full text-xs">
                <thead className="bg-muted/50 sticky top-0"><tr>
                  <th className="text-left p-2">Business</th><th className="text-left p-2">Contact</th>
                  <th className="text-left p-2">Email</th><th className="text-left p-2">Phone</th>
                  <th className="text-left p-2">City</th>
                </tr></thead>
                <tbody>{leads.slice(0, 100).map((l, i) => (
                  <tr key={i} className="border-t"><td className="p-2">{l.business_name}</td>
                    <td className="p-2">{l.personal_name || l.contact_name}</td>
                    <td className="p-2">{l.email}</td><td className="p-2">{l.phone}</td>
                    <td className="p-2">{l.location_city}</td></tr>
                ))}</tbody>
              </table>
              {leads.length > 100 && <div className="p-2 text-center text-xs text-muted-foreground">…and {leads.length - 100} more</div>}
            </div>
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={reset}>Back</Button>
              <Button onClick={() => runImport(leads, tab + '_import')}>Import {leads.length} leads</Button>
            </div>
          </div>
        ) : step === 'mapping' ? (
          <div className="space-y-4">
            <div className="text-sm text-muted-foreground">Map each column to a lead field. Auto-detected where possible.</div>
            <div className="border rounded-md max-h-[400px] overflow-auto">
              <table className="w-full text-xs">
                <thead className="bg-muted/50 sticky top-0"><tr>
                  <th className="text-left p-2 w-1/3">Column</th><th className="text-left p-2 w-1/3">Sample</th>
                  <th className="text-left p-2">Map to</th>
                </tr></thead>
                <tbody>{headers.map((h, i) => (
                  <tr key={i} className="border-t">
                    <td className="p-2 font-medium">{h || `Column ${i + 1}`}</td>
                    <td className="p-2 text-muted-foreground truncate max-w-[200px]">{rawRows[0]?.[i]}</td>
                    <td className="p-2">
                      <Select value={mapping[i] || '__skip'} onValueChange={v => setMapping({ ...mapping, [i]: v })}>
                        <SelectTrigger className="h-8 text-xs"><SelectValue /></SelectTrigger>
                        <SelectContent>{FIELD_OPTIONS.map(o => <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>)}</SelectContent>
                      </Select>
                    </td>
                  </tr>
                ))}</tbody>
              </table>
            </div>
            <div className="flex justify-between">
              <Button variant="ghost" onClick={reset}>Back</Button>
              <Button onClick={applyMapping}>Preview {rawRows.length} rows</Button>
            </div>
          </div>
        ) : (
          <Tabs value={tab} onValueChange={v => setTab(v as any)}>
            <TabsList className="grid grid-cols-5">
              <TabsTrigger value="csv"><FileSpreadsheet className="h-3 w-3 mr-1" /> CSV</TabsTrigger>
              <TabsTrigger value="excel"><FileSpreadsheet className="h-3 w-3 mr-1" /> Excel</TabsTrigger>
              <TabsTrigger value="json"><FileJson className="h-3 w-3 mr-1" /> JSON</TabsTrigger>
              <TabsTrigger value="html"><Code className="h-3 w-3 mr-1" /> HTML</TabsTrigger>
              <TabsTrigger value="manual"><Plus className="h-3 w-3 mr-1" /> Manual</TabsTrigger>
            </TabsList>

            <TabsContent value="csv" className="pt-4">
              <div onClick={() => csvRef.current?.click()} className="border-2 border-dashed rounded-lg p-10 text-center cursor-pointer hover:border-primary hover:bg-muted/30">
                <FileSpreadsheet className="h-10 w-10 mx-auto mb-2 text-muted-foreground" />
                <div className="font-medium">Choose CSV file</div>
                <div className="text-xs text-muted-foreground">Columns are mapped in the next step</div>
                <input ref={csvRef} type="file" accept=".csv,text/csv" className="hidden" onChange={e => e.target.files?.[0] && handleCsv(e.target.files[0])} />
              </div>
            </TabsContent>

            <TabsContent value="excel" className="pt-4">
              <div onClick={() => xlsxRef.current?.click()} className="border-2 border-dashed rounded-lg p-10 text-center cursor-pointer hover:border-primary hover:bg-muted/30">
                <FileSpreadsheet className="h-10 w-10 mx-auto mb-2 text-muted-foreground" />
                <div className="font-medium">Choose Excel file (.xlsx / .xls)</div>
                <div className="text-xs text-muted-foreground">First sheet, first row = headers</div>
                <input ref={xlsxRef} type="file" accept=".xlsx,.xls" className="hidden" onChange={e => e.target.files?.[0] && handleXlsx(e.target.files[0])} />
              </div>
            </TabsContent>

            <TabsContent value="json" className="pt-4">
              <div onClick={() => jsonRef.current?.click()} className="border-2 border-dashed rounded-lg p-10 text-center cursor-pointer hover:border-primary hover:bg-muted/30">
                <FileJson className="h-10 w-10 mx-auto mb-2 text-muted-foreground" />
                <div className="font-medium">Choose JSON file</div>
                <div className="text-xs text-muted-foreground">Array of objects, or {'{ leads: [...] }'}</div>
                <input ref={jsonRef} type="file" accept=".json,application/json" className="hidden" onChange={e => e.target.files?.[0] && handleJson(e.target.files[0])} />
              </div>
            </TabsContent>

            <TabsContent value="html" className="pt-4 space-y-3">
              <Label className="text-xs">Paste HTML containing a &lt;table&gt;</Label>
              <Textarea value={html} onChange={e => setHtml(e.target.value)} rows={10} placeholder="<table>...</table>" className="font-mono text-xs" />
              <Button onClick={parseHtml} disabled={!html.trim()}>Parse HTML</Button>
            </TabsContent>

            <TabsContent value="manual" className="pt-4 space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <div><Label className="text-xs">Business Name</Label><Input value={manual.business_name || ''} onChange={e => setManual({ ...manual, business_name: e.target.value })} /></div>
                <div><Label className="text-xs">Contact / Personal Name</Label><Input value={manual.personal_name || ''} onChange={e => setManual({ ...manual, personal_name: e.target.value })} /></div>
                <div><Label className="text-xs">Email</Label><Input type="email" value={manual.email || ''} onChange={e => setManual({ ...manual, email: e.target.value })} /></div>
                <div><Label className="text-xs">Phone</Label><Input value={manual.phone || ''} onChange={e => setManual({ ...manual, phone: e.target.value })} /></div>
                <div><Label className="text-xs">Website</Label><Input value={manual.website_url || ''} onChange={e => setManual({ ...manual, website_url: e.target.value })} /></div>
                <div><Label className="text-xs">Category</Label><Input value={manual.category || ''} onChange={e => setManual({ ...manual, category: e.target.value })} /></div>
                <div><Label className="text-xs">City</Label><Input value={manual.location_city || ''} onChange={e => setManual({ ...manual, location_city: e.target.value })} /></div>
                <div><Label className="text-xs">Postcode</Label><Input value={manual.location_postcode || ''} onChange={e => setManual({ ...manual, location_postcode: e.target.value })} /></div>
              </div>
              <div className="flex justify-end">
                <Button onClick={() => {
                  if (!manual.business_name && !manual.personal_name && !manual.email && !manual.phone) return toast.error('Enter at least a name, email, or phone');
                  runImport([manual], 'manual');
                }}>Add lead</Button>
              </div>
            </TabsContent>
          </Tabs>
        )}
      </DialogContent>
    </Dialog>
  );
}
