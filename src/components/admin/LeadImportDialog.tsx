import { useState, useCallback, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Upload, FileSpreadsheet, Code, Plus, X, AlertCircle,
  Check, Loader2, Table as TableIcon, ArrowRight, FileJson, Clock
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';

interface LeadImportDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onImportComplete: () => void;
}

interface ParsedLead {
  business_name: string | null;
  personal_name: string | null;
  contact_name: string | null;
  is_personal: boolean;
  phone: string | null;
  email: string | null;
  website_url: string | null;
  location_city: string | null;
  location_postcode: string | null;
  google_rating: number | null;
  review_count: number;
  category: string | null;
  street?: string | null;
}

interface ImportResult {
  added: number;
  skipped: number;
  duplicates: number;
  errors: string[];
}

export default function LeadImportDialog({ open, onOpenChange, onImportComplete }: LeadImportDialogProps) {
  const { user } = useAuth();
  const [jsonParsedLeads, setJsonParsedLeads] = useState<ParsedLead[]>([]);
  const [activeTab, setActiveTab] = useState<'csv' | 'json' | 'html' | 'manual'>('csv');
  const [jsonFile, setJsonFile] = useState<File | null>(null);
  const [importing, setImporting] = useState(false);
  const [csvFile, setCsvFile] = useState<File | null>(null);
  const [csvData, setCsvData] = useState<string[][]>([]);
  const [csvHeaders, setCsvHeaders] = useState<string[]>([]);
  const [columnMapping, setColumnMapping] = useState<Record<string, string>>({});
  const [htmlContent, setHtmlContent] = useState('');
  const [parsedLeads, setParsedLeads] = useState<ParsedLead[]>([]);
  const [previewStep, setPreviewStep] = useState<'input' | 'mapping' | 'preview'>('input');
  const [importResult, setImportResult] = useState<ImportResult | null>(null);
  
  // Progress tracking state
  const [importProgress, setImportProgress] = useState(0);
  const [currentLeadIndex, setCurrentLeadIndex] = useState(0);
  const [estimatedTimeRemaining, setEstimatedTimeRemaining] = useState<number | null>(null);
  const importStartTime = useRef<number>(0);
  const avgTimePerLead = useRef<number>(0);

  // Manual entry state
  const [manualLead, setManualLead] = useState<ParsedLead>({
    business_name: '',
    personal_name: null,
    contact_name: null,
    is_personal: false,
    phone: null,
    email: null,
    website_url: null,
    location_city: null,
    location_postcode: null,
    google_rating: null,
    review_count: 0,
    category: null,
  });

  const fieldOptions = [
    { value: '', label: 'Skip this column' },
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

  // Reset state when dialog closes
  const handleOpenChange = (newOpen: boolean) => {
    if (!newOpen) {
      setCsvFile(null);
      setJsonFile(null);
      setCsvData([]);
      setCsvHeaders([]);
      setColumnMapping({});
      setHtmlContent('');
      setParsedLeads([]);
      setPreviewStep('input');
      setImportResult(null);
      setManualLead({
        business_name: '',
        personal_name: null,
        contact_name: null,
        is_personal: false,
        phone: null,
        email: null,
        website_url: null,
        location_city: null,
        location_postcode: null,
        google_rating: null,
        review_count: 0,
        category: null,
      });
    }
    onOpenChange(newOpen);
  };

  // Parse JSON file
  const handleJsonUpload = (file: File) => {
    setJsonFile(file);
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const text = e.target?.result as string;
        const jsonData = JSON.parse(text);
        
        // Handle both array of leads and object with leads array
        const leadsArray = Array.isArray(jsonData) ? jsonData : (jsonData.leads || jsonData.data || []);
        
        if (!Array.isArray(leadsArray) || leadsArray.length === 0) {
          toast.error('No leads found in JSON file. Expected an array of lead objects.');
          return;
        }

        const leads: ParsedLead[] = leadsArray.map((item: any) => {
          // Map common field names to our schema (including Google Maps export format)
          return {
            business_name: item.title || item.business_name || item.businessName || item.company || item.name || null,
            personal_name: item.personal_name || item.personalName || null,
            contact_name: item.contact_name || item.contactName || item.contact || null,
            is_personal: item.is_personal || item.isPersonal || false,
            phone: item.phone || item.telephone || item.tel || item.mobile || null,
            email: item.email || item.emailAddress || null,
            website_url: item.website_url || item.websiteUrl || item.website || null,
            location_city: item.city || item.location_city || item.locationCity || item.location || null,
            location_postcode: item.location_postcode || item.locationPostcode || item.postcode || item.zip || item.zipcode || null,
            google_rating: parseFloat(item.totalScore || item.google_rating || item.googleRating || item.rating) || null,
            review_count: parseInt(item.reviewsCount || item.review_count || item.reviewCount || item.reviews) || 0,
            category: item.categoryName || item.category || item.industry || item.type || null,
            street: item.street || null,
          };
        }).filter((lead: ParsedLead) => lead.business_name || lead.personal_name || lead.phone || lead.email);

        if (leads.length === 0) {
          toast.error('No valid leads found in JSON file. Leads need at least a name, email, or phone.');
          return;
        }

        setParsedLeads(leads);
        setPreviewStep('preview');
        toast.success(`Parsed ${leads.length} leads from JSON`);
      } catch (error) {
        toast.error('Invalid JSON file. Please check the format.');
      }
    };
    reader.readAsText(file);
  };

  // Parse CSV file
  const handleCsvUpload = (file: File) => {
    setCsvFile(file);
    const reader = new FileReader();
    reader.onload = (e) => {
      const text = e.target?.result as string;
      const lines = text.split('\n').map(line => {
        const result: string[] = [];
        let current = '';
        let inQuotes = false;
        
        for (const char of line) {
          if (char === '"') {
            inQuotes = !inQuotes;
          } else if (char === ',' && !inQuotes) {
            result.push(current.trim());
            current = '';
          } else {
            current += char;
          }
        }
        result.push(current.trim());
        return result;
      }).filter(line => line.some(cell => cell.length > 0));

      if (lines.length > 0) {
        setCsvHeaders(lines[0]);
        setCsvData(lines.slice(1));
        
        // Auto-detect column mapping
        const autoMapping: Record<string, string> = {};
        lines[0].forEach((header, index) => {
          const headerLower = header.toLowerCase();
          if (headerLower.includes('business') || headerLower.includes('company') || headerLower === 'name') {
            autoMapping[index.toString()] = 'business_name';
          } else if (headerLower.includes('phone') || headerLower.includes('tel')) {
            autoMapping[index.toString()] = 'phone';
          } else if (headerLower.includes('email')) {
            autoMapping[index.toString()] = 'email';
          } else if (headerLower.includes('website') || headerLower.includes('url')) {
            autoMapping[index.toString()] = 'website_url';
          } else if (headerLower.includes('city') || headerLower.includes('location')) {
            autoMapping[index.toString()] = 'location_city';
          } else if (headerLower.includes('postcode') || headerLower.includes('zip')) {
            autoMapping[index.toString()] = 'location_postcode';
          } else if (headerLower.includes('rating')) {
            autoMapping[index.toString()] = 'google_rating';
          } else if (headerLower.includes('review')) {
            autoMapping[index.toString()] = 'review_count';
          } else if (headerLower.includes('category') || headerLower.includes('industry')) {
            autoMapping[index.toString()] = 'category';
          } else if (headerLower.includes('contact')) {
            autoMapping[index.toString()] = 'contact_name';
          }
        });
        setColumnMapping(autoMapping);
        setPreviewStep('mapping');
      }
    };
    reader.readAsText(file);
  };

  // Parse HTML table
  const parseHtmlTable = () => {
    try {
      const parser = new DOMParser();
      const doc = parser.parseFromString(htmlContent, 'text/html');
      const rows = doc.querySelectorAll('tr');
      const leads: ParsedLead[] = [];

      rows.forEach((row, index) => {
        if (index === 0) return; // Skip header row
        const cells = row.querySelectorAll('td');
        if (cells.length < 2) return;

        const lead: ParsedLead = {
          business_name: null,
          personal_name: null,
          contact_name: null,
          is_personal: false,
          phone: null,
          email: null,
          website_url: null,
          location_city: null,
          location_postcode: null,
          google_rating: null,
          review_count: 0,
          category: null,
        };

        // Try to extract data from cells
        cells.forEach((cell) => {
          const text = cell.textContent?.trim() || '';
          
          // Detect phone numbers
          if (text.match(/^[\d\s\-+\(\)]{10,}$/)) {
            lead.phone = text;
          }
          // Detect emails
          else if (text.includes('@') && text.includes('.')) {
            lead.email = text;
          }
          // Detect URLs
          else if (text.startsWith('http') || text.includes('www.')) {
            lead.website_url = text.startsWith('http') ? text : `https://${text}`;
          }
          // Detect ratings
          else if (text.match(/^\d\.\d$/) || text.match(/^[1-5]$/)) {
            lead.google_rating = parseFloat(text);
          }
          // Detect review counts
          else if (text.match(/^\d+$/) && parseInt(text) < 100000) {
            lead.review_count = parseInt(text);
          }
          // Otherwise treat as business name if not set
          else if (!lead.business_name && text.length > 2 && !text.match(/^\d/)) {
            lead.business_name = text;
          }
        });

        if (lead.business_name || lead.phone || lead.email) {
          leads.push(lead);
        }
      });

      setParsedLeads(leads);
      setPreviewStep('preview');
    } catch (error) {
      toast.error('Failed to parse HTML. Make sure you pasted valid HTML table content.');
    }
  };

  // Process CSV with column mapping
  const processCsvMapping = () => {
    const leads: ParsedLead[] = csvData.map((row) => {
      const lead: ParsedLead = {
        business_name: null,
        personal_name: null,
        contact_name: null,
        is_personal: false,
        phone: null,
        email: null,
        website_url: null,
        location_city: null,
        location_postcode: null,
        google_rating: null,
        review_count: 0,
        category: null,
      };

      Object.entries(columnMapping).forEach(([colIndex, field]) => {
        if (field && row[parseInt(colIndex)]) {
          const value = row[parseInt(colIndex)].trim();
          if (field === 'google_rating') {
            lead.google_rating = parseFloat(value) || null;
          } else if (field === 'review_count') {
            lead.review_count = parseInt(value) || 0;
          } else {
            (lead as any)[field] = value;
          }
        }
      });

      return lead;
    }).filter(lead => lead.business_name || lead.personal_name || lead.phone || lead.email);

    setParsedLeads(leads);
    setPreviewStep('preview');
  };

  // Check for duplicates
  const checkDuplicate = async (lead: ParsedLead): Promise<boolean> => {
    const conditions: string[] = [];
    if (lead.phone) conditions.push(`phone.eq.${lead.phone}`);
    if (lead.email) conditions.push(`email.ilike.${lead.email}`);
    if (lead.business_name) conditions.push(`business_name.ilike.%${lead.business_name}%`);

    if (conditions.length === 0) return false;

    const { data } = await supabase
      .from('leads')
      .select('id')
      .or(conditions.join(','))
      .limit(1);

    return (data?.length || 0) > 0;
  };

  // Format time remaining
  const formatTimeRemaining = (seconds: number): string => {
    if (seconds < 60) return `${Math.ceil(seconds)}s`;
    const mins = Math.floor(seconds / 60);
    const secs = Math.ceil(seconds % 60);
    return `${mins}m ${secs}s`;
  };

  // Import leads with progress tracking
  const importLeads = async (leadsToImport: ParsedLead[], sourceType: 'csv_import' | 'html_import' | 'manual' | 'json_import') => {
    if (!user) return;
    setImporting(true);
    setImportProgress(0);
    setCurrentLeadIndex(0);
    setEstimatedTimeRemaining(null);
    importStartTime.current = Date.now();
    
    const result: ImportResult = { added: 0, skipped: 0, duplicates: 0, errors: [] };
    const importLog: any[] = [];
    const totalLeads = leadsToImport.length;

    // Batch processing for faster imports (groups of 10)
    const BATCH_SIZE = 10;
    const batches = [];
    for (let i = 0; i < leadsToImport.length; i += BATCH_SIZE) {
      batches.push(leadsToImport.slice(i, i + BATCH_SIZE));
    }

    let processedCount = 0;
    for (const batch of batches) {
      const batchStartTime = Date.now();
      
      // Process batch in parallel for duplicate checks
      const duplicateChecks = await Promise.all(batch.map(lead => checkDuplicate(lead)));
      
      // Prepare non-duplicate leads for batch insert
      const leadsToInsert = [];
      for (let i = 0; i < batch.length; i++) {
        const lead = batch[i];
        if (duplicateChecks[i]) {
          result.duplicates++;
          importLog.push({ lead, status: 'duplicate' });
        } else {
          const locationCity = lead.street && lead.location_city 
            ? `${lead.street}, ${lead.location_city}` 
            : lead.location_city || lead.street || null;
          
          leadsToInsert.push({
            business_name: lead.business_name,
            personal_name: lead.personal_name,
            contact_name: lead.contact_name,
            is_personal: lead.is_personal,
            phone: lead.phone,
            email: lead.email,
            website_url: lead.website_url,
            location_city: locationCity,
            location_postcode: lead.location_postcode,
            google_rating: lead.google_rating,
            review_count: lead.review_count,
            category: lead.category,
            source: sourceType as any,
            status: 'new' as const,
          });
        }
      }

      // Batch insert non-duplicates
      if (leadsToInsert.length > 0) {
        const { error } = await supabase.from('leads').insert(leadsToInsert);
        if (error) {
          result.errors.push(`Batch insert failed: ${error.message}`);
          leadsToInsert.forEach(lead => {
            importLog.push({ lead, status: 'error', error: error.message });
          });
        } else {
          result.added += leadsToInsert.length;
          leadsToInsert.forEach(lead => {
            importLog.push({ lead, status: 'added' });
          });
        }
      }

      processedCount += batch.length;
      setCurrentLeadIndex(processedCount);
      setImportProgress(Math.round((processedCount / totalLeads) * 100));
      
      // Calculate time estimate
      const elapsedMs = Date.now() - importStartTime.current;
      avgTimePerLead.current = elapsedMs / processedCount;
      const remainingLeads = totalLeads - processedCount;
      const estimatedMs = remainingLeads * avgTimePerLead.current;
      setEstimatedTimeRemaining(estimatedMs / 1000);
    }

    // Log the import
    await supabase.from('lead_imports').insert([{
      imported_by: user.id,
      source_type: sourceType as any,
      total_count: leadsToImport.length,
      added_count: result.added,
      skipped_count: result.skipped,
      duplicate_count: result.duplicates,
      import_log: importLog,
    }]);

    setImportResult(result);
    setImporting(false);
    setImportProgress(100);
    setEstimatedTimeRemaining(0);
    
    if (result.added > 0) {
      toast.success(`Imported ${result.added} leads`);
      onImportComplete();
    }
    if (result.duplicates > 0) {
      toast.warning(`${result.duplicates} duplicates skipped`);
    }
  };

  // Manual lead submission
  const handleManualSubmit = async () => {
    if (!manualLead.business_name && !manualLead.personal_name && !manualLead.email && !manualLead.phone) {
      toast.error('Please fill in at least a name, email, or phone');
      return;
    }
    await importLeads([manualLead], 'manual');
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="w-[95vw] sm:max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Upload className="w-5 h-5 text-primary" />
            Import Leads
          </DialogTitle>
          <DialogDescription>
            Import leads from CSV, HTML tables, or add them manually
          </DialogDescription>
        </DialogHeader>

        {importResult ? (
          <div className="py-6 space-y-4">
            <div className="text-center">
              <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-ok/15 mb-4">
                <Check className="w-8 h-8 text-ok" />
              </div>
              <h3 className="text-xl font-semibold">Import Complete</h3>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-center">
              <div className="p-4 rounded-lg bg-ok/10">
                <p className="text-2xl font-bold tabular-nums text-ok">{importResult.added}</p>
                <p className="text-sm text-muted-foreground">Added</p>
              </div>
              <div className="p-4 rounded-lg bg-attend/10">
                <p className="text-2xl font-bold tabular-nums text-attend">{importResult.duplicates}</p>
                <p className="text-sm text-muted-foreground">Duplicates</p>
              </div>
              <div className="p-4 rounded-lg bg-muted">
                <p className="text-2xl font-bold text-muted-foreground">{importResult.skipped}</p>
                <p className="text-sm text-muted-foreground">Skipped</p>
              </div>
            </div>
            {importResult.errors.length > 0 && (
              <div className="p-4 rounded-lg bg-risk/10 border border-risk/30">
                <p className="text-sm font-medium text-risk mb-2">Errors:</p>
                <ul className="text-xs text-risk/80 space-y-1">
                  {importResult.errors.slice(0, 5).map((err, i) => (
                    <li key={i}>{err}</li>
                  ))}
                </ul>
              </div>
            )}
            <Button onClick={() => handleOpenChange(false)} className="w-full">
              Done
            </Button>
          </div>
        ) : (
          <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as typeof activeTab)}>
            <TabsList className="overflow-x-auto w-full">
              <TabsTrigger value="csv" className="gap-2">
                <FileSpreadsheet className="w-4 h-4" />
                CSV
              </TabsTrigger>
              <TabsTrigger value="json" className="gap-2">
                <FileJson className="w-4 h-4" />
                JSON
              </TabsTrigger>
              <TabsTrigger value="html" className="gap-2">
                <Code className="w-4 h-4" />
                HTML
              </TabsTrigger>
              <TabsTrigger value="manual" className="gap-2">
                <Plus className="w-4 h-4" />
                Manual
              </TabsTrigger>
            </TabsList>

            {/* CSV Import */}
            <TabsContent value="csv" className="space-y-4 mt-4">
              {previewStep === 'input' && (
                <div
                  onDragOver={(e) => e.preventDefault()}
                  onDrop={(e) => {
                    e.preventDefault();
                    const file = e.dataTransfer.files[0];
                    if (file?.type === 'text/csv' || file?.name.endsWith('.csv')) {
                      handleCsvUpload(file);
                    }
                  }}
                  className="border-2 border-dashed border-border rounded-xl p-12 text-center hover:border-primary/50 transition-colors cursor-pointer"
                  onClick={() => document.getElementById('csv-upload')?.click()}
                >
                  <input
                    id="csv-upload"
                    type="file"
                    accept=".csv"
                    className="hidden"
                    onChange={(e) => e.target.files?.[0] && handleCsvUpload(e.target.files[0])}
                  />
                  <FileSpreadsheet className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
                  <p className="font-medium">Drop CSV file here or click to browse</p>
                  <p className="text-sm text-muted-foreground mt-1">Supports .csv files</p>
                </div>
              )}

              {previewStep === 'mapping' && (
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <h4 className="font-medium">Map Columns</h4>
                    <Badge variant="secondary">{csvData.length} rows</Badge>
                  </div>
                  <div className="grid grid-cols-2 gap-3 max-h-72 overflow-y-auto p-1">
                    {csvHeaders.map((header, index) => (
                      <div key={index} className="flex items-center gap-2">
                        <span className="text-sm font-medium min-w-[120px] truncate">{header}</span>
                        <ArrowRight className="w-4 h-4 text-muted-foreground flex-shrink-0" />
                        <Select
                          value={columnMapping[index.toString()] || ''}
                          onValueChange={(v) => setColumnMapping({ ...columnMapping, [index.toString()]: v })}
                        >
                          <SelectTrigger className="flex-1">
                            <SelectValue placeholder="Select field" />
                          </SelectTrigger>
                          <SelectContent>
                            {fieldOptions.map(opt => (
                              <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                    ))}
                  </div>
                  <div className="flex gap-2">
                    <Button variant="outline" onClick={() => setPreviewStep('input')}>
                      Back
                    </Button>
                    <Button onClick={processCsvMapping} className="flex-1">
                      Preview Import
                    </Button>
                  </div>
                </div>
              )}

              {previewStep === 'preview' && activeTab === 'csv' && (
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <h4 className="font-medium">Preview</h4>
                    <Badge variant="secondary">{parsedLeads.length} leads to import</Badge>
                  </div>
                  <div className="border rounded-lg overflow-hidden max-h-64 overflow-y-auto">
                    <table className="w-full text-sm">
                      <thead className="bg-muted sticky top-0">
                        <tr>
                          <th className="p-2 text-left">Name</th>
                          <th className="p-2 text-left">Phone</th>
                          <th className="p-2 text-left">Email</th>
                          <th className="p-2 text-left">City</th>
                        </tr>
                      </thead>
                      <tbody>
                        {parsedLeads.slice(0, 10).map((lead, i) => (
                          <tr key={i} className="border-t">
                            <td className="p-2">{lead.business_name || lead.personal_name || '-'}</td>
                            <td className="p-2">{lead.phone || '-'}</td>
                            <td className="p-2">{lead.email || '-'}</td>
                            <td className="p-2">{lead.location_city || '-'}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                    {parsedLeads.length > 10 && (
                      <p className="p-2 text-center text-xs text-muted-foreground">
                        +{parsedLeads.length - 10} more leads
                      </p>
                    )}
                  </div>
                  {importing && (
                    <div className="space-y-3 p-4 bg-muted/50 rounded-lg">
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-muted-foreground">
                          Importing {currentLeadIndex} of {parsedLeads.length} leads
                        </span>
                        {estimatedTimeRemaining !== null && estimatedTimeRemaining > 0 && (
                          <span className="flex items-center gap-1.5 text-muted-foreground">
                            <Clock className="w-3.5 h-3.5" />
                            ~{formatTimeRemaining(estimatedTimeRemaining)} remaining
                          </span>
                        )}
                      </div>
                      <Progress value={importProgress} className="h-2" />
                      <p className="text-xs text-muted-foreground text-center">
                        {importProgress}% complete
                      </p>
                    </div>
                  )}
                  <div className="flex gap-2">
                    <Button variant="outline" onClick={() => setPreviewStep('mapping')} disabled={importing}>
                      Back
                    </Button>
                    <Button 
                      onClick={() => importLeads(parsedLeads, 'csv_import')} 
                      disabled={importing}
                      className="flex-1"
                    >
                      {importing ? (
                        <>
                          <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                          Importing...
                        </>
                      ) : (
                        `Import ${parsedLeads.length} Leads`
                      )}
                    </Button>
                  </div>
                </div>
              )}
            </TabsContent>

            {/* JSON Import */}
            <TabsContent value="json" className="space-y-4 mt-4">
              {previewStep === 'input' && (
                <div
                  onDragOver={(e) => e.preventDefault()}
                  onDrop={(e) => {
                    e.preventDefault();
                    const file = e.dataTransfer.files[0];
                    if (file?.type === 'application/json' || file?.name.endsWith('.json')) {
                      handleJsonUpload(file);
                    }
                  }}
                  className="border-2 border-dashed border-border rounded-xl p-12 text-center hover:border-primary/50 transition-colors cursor-pointer"
                  onClick={() => document.getElementById('json-upload')?.click()}
                >
                  <input
                    id="json-upload"
                    type="file"
                    accept=".json,application/json"
                    className="hidden"
                    onChange={(e) => e.target.files?.[0] && handleJsonUpload(e.target.files[0])}
                  />
                  <FileJson className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
                  <p className="font-medium">Drop JSON file here or click to browse</p>
                  <p className="text-sm text-muted-foreground mt-1">Supports .json files with leads array</p>
                </div>
              )}

              {previewStep === 'preview' && activeTab === 'json' && (
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <h4 className="font-medium">Parsed Leads</h4>
                    <Badge variant="secondary">{parsedLeads.length} leads found</Badge>
                  </div>
                  <div className="border rounded-lg overflow-hidden max-h-64 overflow-y-auto">
                    <table className="w-full text-sm">
                      <thead className="bg-muted sticky top-0">
                        <tr>
                          <th className="p-2 text-left">Name</th>
                          <th className="p-2 text-left">Rating</th>
                          <th className="p-2 text-left">Reviews</th>
                          <th className="p-2 text-left">Category</th>
                          <th className="p-2 text-left">Location</th>
                        </tr>
                      </thead>
                      <tbody>
                        {parsedLeads.slice(0, 10).map((lead, i) => (
                          <tr key={i} className="border-t">
                            <td className="p-2">{lead.business_name || lead.personal_name || '-'}</td>
                            <td className="p-2">{lead.google_rating ? `${lead.google_rating.toFixed(1)} ⭐` : '-'}</td>
                            <td className="p-2">{lead.review_count || '-'}</td>
                            <td className="p-2">{lead.category || '-'}</td>
                            <td className="p-2">{lead.street ? `${lead.street}, ${lead.location_city || ''}` : (lead.location_city || '-')}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                    {parsedLeads.length > 10 && (
                      <p className="p-2 text-center text-xs text-muted-foreground">
                        +{parsedLeads.length - 10} more leads
                      </p>
                    )}
                  </div>
                  {importing && (
                    <div className="space-y-3 p-4 bg-muted/50 rounded-lg">
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-muted-foreground">
                          Importing {currentLeadIndex} of {parsedLeads.length} leads
                        </span>
                        {estimatedTimeRemaining !== null && estimatedTimeRemaining > 0 && (
                          <span className="flex items-center gap-1.5 text-muted-foreground">
                            <Clock className="w-3.5 h-3.5" />
                            ~{formatTimeRemaining(estimatedTimeRemaining)} remaining
                          </span>
                        )}
                      </div>
                      <Progress value={importProgress} className="h-2" />
                      <p className="text-xs text-muted-foreground text-center">
                        {importProgress}% complete
                      </p>
                    </div>
                  )}
                  <div className="flex gap-2">
                    <Button variant="outline" onClick={() => setPreviewStep('input')} disabled={importing}>
                      Back
                    </Button>
                    <Button 
                      onClick={() => importLeads(parsedLeads, 'json_import')} 
                      disabled={importing}
                      className="flex-1"
                    >
                      {importing ? (
                        <>
                          <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                          Importing...
                        </>
                      ) : (
                        `Import ${parsedLeads.length} Leads`
                      )}
                    </Button>
                  </div>
                </div>
              )}
            </TabsContent>

            {/* HTML Import */}
            <TabsContent value="html" className="space-y-4 mt-4">
              {previewStep === 'input' && (
                <>
                  <div>
                    <Label>Paste HTML Table Content</Label>
                    <Textarea
                      placeholder="Paste the HTML <table> content here (e.g., from Google Maps or a website)..."
                      value={htmlContent}
                      onChange={(e) => setHtmlContent(e.target.value)}
                      className="h-48 font-mono text-xs mt-2"
                    />
                  </div>
                  <Button onClick={parseHtmlTable} disabled={!htmlContent.trim()} className="w-full">
                    Parse HTML
                  </Button>
                </>
              )}

              {previewStep === 'preview' && activeTab === 'html' && (
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <h4 className="font-medium">Parsed Leads</h4>
                    <Badge variant="secondary">{parsedLeads.length} leads found</Badge>
                  </div>
                  <div className="border rounded-lg overflow-hidden max-h-64 overflow-y-auto">
                    <table className="w-full text-sm">
                      <thead className="bg-muted sticky top-0">
                        <tr>
                          <th className="p-2 text-left">Name</th>
                          <th className="p-2 text-left">Phone</th>
                          <th className="p-2 text-left">Email</th>
                        </tr>
                      </thead>
                      <tbody>
                        {parsedLeads.slice(0, 10).map((lead, i) => (
                          <tr key={i} className="border-t">
                            <td className="p-2">{lead.business_name || '-'}</td>
                            <td className="p-2">{lead.phone || '-'}</td>
                            <td className="p-2">{lead.email || '-'}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                  {importing && (
                    <div className="space-y-3 p-4 bg-muted/50 rounded-lg">
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-muted-foreground">
                          Importing {currentLeadIndex} of {parsedLeads.length} leads
                        </span>
                        {estimatedTimeRemaining !== null && estimatedTimeRemaining > 0 && (
                          <span className="flex items-center gap-1.5 text-muted-foreground">
                            <Clock className="w-3.5 h-3.5" />
                            ~{formatTimeRemaining(estimatedTimeRemaining)} remaining
                          </span>
                        )}
                      </div>
                      <Progress value={importProgress} className="h-2" />
                      <p className="text-xs text-muted-foreground text-center">
                        {importProgress}% complete
                      </p>
                    </div>
                  )}
                  <div className="flex gap-2">
                    <Button variant="outline" onClick={() => setPreviewStep('input')} disabled={importing}>
                      Back
                    </Button>
                    <Button 
                      onClick={() => importLeads(parsedLeads, 'html_import')} 
                      disabled={importing}
                      className="flex-1"
                    >
                      {importing ? (
                        <>
                          <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                          Importing...
                        </>
                      ) : (
                        `Import ${parsedLeads.length} Leads`
                      )}
                    </Button>
                  </div>
                </div>
              )}
            </TabsContent>

            {/* Manual Entry */}
            <TabsContent value="manual" className="space-y-4 mt-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <Label>Business Name</Label>
                  <Input
                    placeholder="Acme Corp"
                    value={manualLead.business_name || ''}
                    onChange={(e) => setManualLead({ ...manualLead, business_name: e.target.value || null })}
                  />
                </div>
                <div>
                  <Label>Contact Name</Label>
                  <Input
                    placeholder="John Smith"
                    value={manualLead.contact_name || ''}
                    onChange={(e) => setManualLead({ ...manualLead, contact_name: e.target.value || null })}
                  />
                </div>
                <div>
                  <Label>Phone</Label>
                  <Input
                    placeholder="+44 7700 900000"
                    value={manualLead.phone || ''}
                    onChange={(e) => setManualLead({ ...manualLead, phone: e.target.value || null })}
                  />
                </div>
                <div>
                  <Label>Email</Label>
                  <Input
                    type="email"
                    placeholder="contact@business.com"
                    value={manualLead.email || ''}
                    onChange={(e) => setManualLead({ ...manualLead, email: e.target.value || null })}
                  />
                </div>
                <div>
                  <Label>Website</Label>
                  <Input
                    placeholder="https://example.com"
                    value={manualLead.website_url || ''}
                    onChange={(e) => setManualLead({ ...manualLead, website_url: e.target.value || null })}
                  />
                </div>
                <div>
                  <Label>City</Label>
                  <Input
                    placeholder="London"
                    value={manualLead.location_city || ''}
                    onChange={(e) => setManualLead({ ...manualLead, location_city: e.target.value || null })}
                  />
                </div>
                <div>
                  <Label>Postcode</Label>
                  <Input
                    placeholder="SW1A 1AA"
                    value={manualLead.location_postcode || ''}
                    onChange={(e) => setManualLead({ ...manualLead, location_postcode: e.target.value || null })}
                  />
                </div>
                <div>
                  <Label>Category</Label>
                  <Input
                    placeholder="Restaurant, Plumber, etc."
                    value={manualLead.category || ''}
                    onChange={(e) => setManualLead({ ...manualLead, category: e.target.value || null })}
                  />
                </div>
              </div>
              <Button 
                onClick={handleManualSubmit} 
                disabled={importing}
                className="w-full"
              >
                {importing ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Adding...
                  </>
                ) : (
                  <>
                    <Plus className="w-4 h-4 mr-2" />
                    Add Lead
                  </>
                )}
              </Button>
            </TabsContent>
          </Tabs>
        )}
      </DialogContent>
    </Dialog>
  );
}
