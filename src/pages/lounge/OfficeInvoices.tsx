import { useState, useRef, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  ArrowLeft, Receipt, Plus, Trash2, TrendingDown,
  Download, FileText, Eye, X, Save, ChevronLeft,
  ChevronRight, Type, Image, Square,
  Upload, ZoomIn, ZoomOut, Pen, Highlighter,
  Building2, Globe, Hash,
  Calendar, CreditCard, Printer, Send, Stamp, Megaphone
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';
import {
  Panel, PanelHeader, PanelRow, StatusBadge, Money, EmptyState,
  type Tone,
} from '@/components/platform';
import jsPDF from 'jspdf';
import * as pdfjsLib from 'pdfjs-dist';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

pdfjsLib.GlobalWorkerOptions.workerSrc = `https://cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjsLib.version}/pdf.worker.min.mjs`;

/* ─── Types ─── */
type InvStatus = 'draft' | 'sent' | 'paid' | 'overdue';
type ExpCategory = 'software' | 'hardware' | 'travel' | 'office' | 'marketing' | 'other';
type MainTab = 'invoices' | 'expenses' | 'creator' | 'pdf-editor' | 'summary';
type PDFTool = 'select' | 'text' | 'draw' | 'highlight' | 'rect';

interface Invoice {
  id: string; number: string; client: string; amount: number; status: InvStatus;
  dueDate: string; items: string; createdAt: Date;
}
interface Expense {
  id: string; title: string; amount: number; category: ExpCategory;
  date: string; receipt: boolean; notes: string;
}
interface InvoiceLineItem {
  id: string; description: string; quantity: number; rate: number;
}
interface PDFAnnotation {
  id: string; type: 'text' | 'draw' | 'highlight' | 'rect'; page: number;
  x: number; y: number; content?: string; width?: number; height?: number;
  color: string; points?: { x: number; y: number }[];
}

/* ─── Professional Template Definitions ─── */
interface PremiumTemplate {
  id: string;
  name: string;
  description: string;
  accent: string;
  headerStyle: 'minimal' | 'bold-bar' | 'split' | 'corner-accent' | 'gradient' | 'border-left' | 'centered' | 'dark';
  previewBg: string;
  previewAccent: string;
}

const PREMIUM_TEMPLATES: PremiumTemplate[] = [
  { id: 'executive', name: 'Executive', description: 'Clean & authoritative', accent: '#000000', headerStyle: 'minimal', previewBg: '#fafafa', previewAccent: '#000' },
  { id: 'sapphire', name: 'Sapphire', description: 'Modern corporate blue', accent: '#0071e3', headerStyle: 'bold-bar', previewBg: '#f0f5ff', previewAccent: '#0071e3' },
  { id: 'slate', name: 'Slate Pro', description: 'Sophisticated dark header', accent: '#1e293b', headerStyle: 'dark', previewBg: '#f8fafc', previewAccent: '#1e293b' },
  { id: 'emerald', name: 'Emerald', description: 'Fresh & professional', accent: '#059669', headerStyle: 'corner-accent', previewBg: '#f0fdf4', previewAccent: '#059669' },
  { id: 'sunset', name: 'Sunset', description: 'Warm & inviting', accent: '#ea580c', headerStyle: 'gradient', previewBg: '#fff7ed', previewAccent: '#ea580c' },
  { id: 'violet', name: 'Violet', description: 'Creative & bold', accent: '#7c3aed', headerStyle: 'border-left', previewBg: '#faf5ff', previewAccent: '#7c3aed' },
  { id: 'rose', name: 'Rosé', description: 'Elegant & refined', accent: '#be185d', headerStyle: 'centered', previewBg: '#fff1f2', previewAccent: '#be185d' },
  { id: 'carbon', name: 'Carbon', description: 'Ultra-minimal monochrome', accent: '#27272a', headerStyle: 'split', previewBg: '#fafafa', previewAccent: '#27272a' },
];

/* ─── Pre-built Invoice Presets ─── */
interface InvoicePreset {
  id: string; name: string; description: string; icon: any;
  templateId: string; companyName: string; companyAddress: string; companyEmail: string;
  clientName: string; clientAddress: string; clientEmail: string;
  items: InvoiceLineItem[]; taxRate: number; notes: string; currency: string;
}

const INVOICE_PRESETS: InvoicePreset[] = [
  {
    id: 'web-design', name: 'Website Design', description: 'Full web design project', icon: Globe,
    templateId: 'sapphire', companyName: 'Studio Co.', companyAddress: '100 Design Street, London EC1A 1BB', companyEmail: 'hello@studio.co',
    clientName: 'Acme Corporation', clientAddress: '200 Business Rd, Manchester M1 1AA', clientEmail: 'accounts@acme.com',
    items: [
      { id: '1', description: 'Website Design & UX Strategy', quantity: 1, rate: 4500 },
      { id: '2', description: 'Frontend Development (React)', quantity: 1, rate: 6000 },
      { id: '3', description: 'CMS Integration & Content Setup', quantity: 1, rate: 1500 },
      { id: '4', description: 'Quality Assurance & Launch', quantity: 1, rate: 800 },
    ],
    taxRate: 20, notes: 'Payment due within 30 days. Bank transfer preferred.', currency: 'GBP',
  },
  {
    id: 'consulting', name: 'Consulting Retainer', description: 'Monthly advisory services', icon: Building2,
    templateId: 'executive', companyName: 'Apex Advisory', companyAddress: '1 Canary Wharf, London E14 5AB', companyEmail: 'invoice@apex.io',
    clientName: 'TechStart Ltd', clientAddress: '50 Silicon Way, Cambridge CB1 2AB', clientEmail: 'finance@techstart.com',
    items: [
      { id: '1', description: 'Strategic Consulting — February 2026', quantity: 40, rate: 150 },
      { id: '2', description: 'Market Research & Analysis', quantity: 1, rate: 2500 },
      { id: '3', description: 'Executive Workshop (Half Day)', quantity: 2, rate: 1200 },
    ],
    taxRate: 20, notes: 'Retainer fees are non-refundable. Net 14 terms.', currency: 'GBP',
  },
  {
    id: 'photography', name: 'Photography Package', description: 'Event & product shoot', icon: Image,
    templateId: 'rose', companyName: 'Iris Photography', companyAddress: '34 Lens Lane, Brighton BN1 1AA', companyEmail: 'bookings@iris.photo',
    clientName: 'FreshFoods Market', clientAddress: '88 Organic Ave, Bristol BS1 5AA', clientEmail: 'marketing@freshfoods.co.uk',
    items: [
      { id: '1', description: 'Full-Day Product Photography', quantity: 1, rate: 1800 },
      { id: '2', description: 'Professional Retouching (50 images)', quantity: 50, rate: 15 },
      { id: '3', description: 'Social Media Crop Package', quantity: 1, rate: 350 },
      { id: '4', description: 'Express Delivery (48hr)', quantity: 1, rate: 200 },
    ],
    taxRate: 20, notes: '50% deposit required before shoot date. Includes 2 rounds of revisions.', currency: 'GBP',
  },
  {
    id: 'saas', name: 'SaaS License', description: 'Annual software subscription', icon: CreditCard,
    templateId: 'violet', companyName: 'CloudStack Inc.', companyAddress: '500 Tech Park, San Francisco CA 94105', companyEmail: 'billing@cloudstack.io',
    clientName: 'Global Enterprises PLC', clientAddress: '1 Corporate Plaza, London EC2V 8AA', clientEmail: 'procurement@globalent.com',
    items: [
      { id: '1', description: 'Enterprise Plan — Annual License', quantity: 1, rate: 12000 },
      { id: '2', description: 'Priority Support Add-on', quantity: 12, rate: 200 },
      { id: '3', description: 'Custom API Integration', quantity: 1, rate: 3500 },
      { id: '4', description: 'Onboarding & Training (Remote)', quantity: 4, rate: 500 },
    ],
    taxRate: 0, notes: 'Annual billing. Auto-renews unless cancelled 30 days before term end.', currency: 'USD',
  },
  {
    id: 'construction', name: 'Construction Project', description: 'Building & renovation', icon: Building2,
    templateId: 'sunset', companyName: 'Buildwell Construction', companyAddress: '12 Builder Yard, Leeds LS1 4AA', companyEmail: 'accounts@buildwell.co.uk',
    clientName: 'Horizon Properties', clientAddress: '99 Estate Road, Leeds LS2 7BB', clientEmail: 'payments@horizonprop.co.uk',
    items: [
      { id: '1', description: 'Phase 1 — Demolition & Clearance', quantity: 1, rate: 8500 },
      { id: '2', description: 'Structural Steelwork', quantity: 1, rate: 22000 },
      { id: '3', description: 'Electrical First Fix', quantity: 1, rate: 6500 },
      { id: '4', description: 'Plumbing & Heating Install', quantity: 1, rate: 9200 },
      { id: '5', description: 'Project Management Fee', quantity: 1, rate: 4500 },
    ],
    taxRate: 20, notes: 'Payment schedule: 30% upfront, 40% at midpoint, 30% on completion. CIS deduction applies.', currency: 'GBP',
  },
  {
    id: 'marketing', name: 'Marketing Campaign', description: 'Digital marketing package', icon: Megaphone,
    templateId: 'emerald', companyName: 'GrowthLab Agency', companyAddress: '22 Creative Quarter, Shoreditch EC2A 3AA', companyEmail: 'billing@growthlab.agency',
    clientName: 'StyleHub Fashion', clientAddress: '10 Regent Street, London W1B 5AA', clientEmail: 'finance@stylehub.com',
    items: [
      { id: '1', description: 'Social Media Strategy & Setup', quantity: 1, rate: 2000 },
      { id: '2', description: 'Content Creation (30 posts)', quantity: 30, rate: 75 },
      { id: '3', description: 'Paid Ads Management (Monthly)', quantity: 3, rate: 1500 },
      { id: '4', description: 'Analytics & Reporting', quantity: 3, rate: 400 },
    ],
    taxRate: 20, notes: 'Ad spend billed separately. Monthly reporting included.', currency: 'GBP',
  },
  {
    id: 'freelance-dev', name: 'Freelance Development', description: 'App development sprint', icon: FileText,
    templateId: 'carbon', companyName: 'Alex Rivera', companyAddress: '15 Code Street, Edinburgh EH1 2AA', companyEmail: 'alex@riveradev.com',
    clientName: 'HealthFirst App', clientAddress: '5 Wellness Way, Glasgow G1 1AA', clientEmail: 'dev@healthfirst.app',
    items: [
      { id: '1', description: 'Sprint 1 — Auth & User Profiles', quantity: 40, rate: 85 },
      { id: '2', description: 'Sprint 2 — Dashboard & Analytics', quantity: 35, rate: 85 },
      { id: '3', description: 'API Integration (3rd Party)', quantity: 1, rate: 1200 },
      { id: '4', description: 'Code Review & Documentation', quantity: 8, rate: 85 },
    ],
    taxRate: 0, notes: 'Sole trader — VAT not applicable. Payment via bank transfer within 14 days.', currency: 'GBP',
  },
  {
    id: 'legal', name: 'Legal Services', description: 'Professional legal fees', icon: Stamp,
    templateId: 'slate', companyName: 'Carter & Associates LLP', companyAddress: 'Lincoln House, 300 High Holborn, London WC1V 7AA', companyEmail: 'billing@carterlaw.co.uk',
    clientName: 'Nova Ventures', clientAddress: '42 Innovation Park, Oxford OX1 2AA', clientEmail: 'legal@novaventures.io',
    items: [
      { id: '1', description: 'Contract Drafting & Review', quantity: 6, rate: 350 },
      { id: '2', description: 'IP & Trademark Registration', quantity: 1, rate: 2800 },
      { id: '3', description: 'Legal Consultation (Senior Partner)', quantity: 3, rate: 500 },
      { id: '4', description: 'Company Formation & Compliance', quantity: 1, rate: 1500 },
    ],
    taxRate: 20, notes: 'Fees quoted exclusive of disbursements. Standard engagement terms apply.', currency: 'GBP',
  },
];

const INV_STATUS: Record<InvStatus, { label: string; tone: Tone }> = {
  draft: { label: 'Draft', tone: 'neutral' }, sent: { label: 'Sent', tone: 'attend' },
  paid: { label: 'Paid', tone: 'ok' }, overdue: { label: 'Overdue', tone: 'risk' },
};
const EXP_CATEGORIES: ExpCategory[] = ['software', 'hardware', 'travel', 'office', 'marketing', 'other'];

const PDF_TOOLS: { id: PDFTool; icon: any; label: string }[] = [
  { id: 'text', icon: Type, label: 'Text' }, { id: 'draw', icon: Pen, label: 'Draw' },
  { id: 'highlight', icon: Highlighter, label: 'Highlight' }, { id: 'rect', icon: Square, label: 'Rect' },
];
const PDF_COLORS = ['#ef4444', '#f97316', '#eab308', '#22c55e', '#3b82f6', '#8b5cf6', '#000000'];

/* ─── Currency helpers ─── */
const currencySymbol = (c: string) => c === 'USD' ? '$' : c === 'EUR' ? '€' : '£';
const fmtMoney = (n: number, c = 'GBP') => `${currencySymbol(c)}${n.toLocaleString('en-GB', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

export default function OfficeInvoices() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [tab, setTab] = useState<MainTab>('invoices');

  /* ─── Invoice & Expense Data ─── */
  const [invoices, setInvoices] = useState<Invoice[]>([
    { id: '1', number: 'INV-2026-001', client: 'Acme Corp', amount: 12500, status: 'paid', dueDate: '2026-02-01', items: 'Website Redesign', createdAt: new Date(Date.now() - 86400000 * 30) },
    { id: '2', number: 'INV-2026-002', client: 'TechStart Ltd', amount: 3200, status: 'sent', dueDate: '2026-03-01', items: 'SEO Audit', createdAt: new Date(Date.now() - 86400000 * 7) },
    { id: '3', number: 'INV-2026-003', client: 'FreshFoods', amount: 15000, status: 'overdue', dueDate: '2026-02-15', items: 'App Dev - Phase 1', createdAt: new Date(Date.now() - 86400000 * 14) },
    { id: '4', number: 'INV-2026-004', client: 'StyleHub', amount: 6500, status: 'draft', dueDate: '2026-03-10', items: 'E-commerce Setup', createdAt: new Date() },
  ]);
  const [expenses, setExpenses] = useState<Expense[]>([
    { id: '1', title: 'Figma Team Plan', amount: 45, category: 'software', date: '2026-02-01', receipt: true, notes: 'Monthly subscription' },
    { id: '2', title: 'AWS Hosting', amount: 128, category: 'software', date: '2026-02-01', receipt: true, notes: 'Cloud infrastructure' },
    { id: '3', title: 'Client Lunch - Acme', amount: 85, category: 'other', date: '2026-02-18', receipt: true, notes: 'Business lunch' },
    { id: '4', title: 'New Monitor', amount: 450, category: 'hardware', date: '2026-02-10', receipt: true, notes: '4K display for design work' },
    { id: '5', title: 'Train to London', amount: 65, category: 'travel', date: '2026-02-15', receipt: false, notes: 'Client meeting' },
  ]);

  /* ─── Invoice Creator State ─── */
  const [selectedTemplate, setSelectedTemplate] = useState<PremiumTemplate>(PREMIUM_TEMPLATES[1]);
  const [creatorStep, setCreatorStep] = useState<'templates' | 'edit'>('templates');
  const [companyName, setCompanyName] = useState('Your Company');
  const [companyAddress, setCompanyAddress] = useState('123 Business St, London, UK');
  const [companyEmail, setCompanyEmail] = useState('hello@company.com');
  const [companyPhone, setCompanyPhone] = useState('+44 20 1234 5678');
  const [companyVat, setCompanyVat] = useState('');
  const [clientName, setClientName] = useState('');
  const [clientAddress, setClientAddress] = useState('');
  const [clientEmail, setClientEmail] = useState('');
  const [invoiceNumber, setInvoiceNumber] = useState(`INV-${new Date().getFullYear()}-${String(invoices.length + 1).padStart(3, '0')}`);
  const [invoiceDate, setInvoiceDate] = useState(new Date().toISOString().split('T')[0]);
  const [dueDate, setDueDate] = useState('');
  const [invoiceNotes, setInvoiceNotes] = useState('');
  const [taxRate, setTaxRate] = useState(20);
  const [currency, setCurrency] = useState('GBP');
  const [lineItems, setLineItems] = useState<InvoiceLineItem[]>([{ id: '1', description: '', quantity: 1, rate: 0 }]);

  /* ─── PDF Editor State ─── */
  const [pdfFile, setPdfFile] = useState<File | null>(null);
  const [pdfDoc, setPdfDoc] = useState<any>(null);
  const [pdfPage, setPdfPage] = useState(1);
  const [pdfTotal, setPdfTotal] = useState(0);
  const [pdfZoom, setPdfZoom] = useState(100);
  const [pdfTool, setPdfTool] = useState<PDFTool>('select');
  const [pdfColor, setPdfColor] = useState('#ef4444');
  const [pdfAnnotations, setPdfAnnotations] = useState<PDFAnnotation[]>([]);
  const [pdfPageSize, setPdfPageSize] = useState({ width: 612, height: 792 });
  const [pdfTextItems, setPdfTextItems] = useState<any[]>([]);
  const [pdfEditingText, setPdfEditingText] = useState<number | null>(null);
  const [pdfTextEdits, setPdfTextEdits] = useState<Record<string, Record<number, string>>>({});
  const [pdfIsDrawing, setPdfIsDrawing] = useState(false);
  const [pdfCurrentDraw, setPdfCurrentDraw] = useState<{ x: number; y: number }[]>([]);
  const [editingAnnotText, setEditingAnnotText] = useState<string | null>(null);
  const pdfCanvasRef = useRef<HTMLCanvasElement>(null);
  const pdfContainerRef = useRef<HTMLDivElement>(null);
  const pdfFileRef = useRef<HTMLInputElement>(null);

  const totalInvoiced = invoices.reduce((s, i) => s + i.amount, 0);
  const totalPaid = invoices.filter(i => i.status === 'paid').reduce((s, i) => s + i.amount, 0);
  const totalExpenses = expenses.reduce((s, e) => s + e.amount, 0);

  const deleteInv = (id: string) => { setInvoices(p => p.filter(i => i.id !== id)); toast.success('Deleted'); };
  const deleteExp = (id: string) => { setExpenses(p => p.filter(e => e.id !== id)); toast.success('Deleted'); };

  /* ─── Invoice Creator Logic ─── */
  const subtotal = lineItems.reduce((s, i) => s + i.quantity * i.rate, 0);
  const tax = subtotal * (taxRate / 100);
  const total = subtotal + tax;

  const addLineItem = () => setLineItems(p => [...p, { id: Date.now().toString(), description: '', quantity: 1, rate: 0 }]);
  const removeLineItem = (id: string) => setLineItems(p => p.filter(i => i.id !== id));
  const updateLineItem = (id: string, field: keyof InvoiceLineItem, value: any) => setLineItems(p => p.map(i => i.id === id ? { ...i, [field]: value } : i));

  const loadPreset = (preset: InvoicePreset) => {
    setSelectedTemplate(PREMIUM_TEMPLATES.find(t => t.id === preset.templateId) || PREMIUM_TEMPLATES[0]);
    setCompanyName(preset.companyName);
    setCompanyAddress(preset.companyAddress);
    setCompanyEmail(preset.companyEmail);
    setClientName(preset.clientName);
    setClientAddress(preset.clientAddress);
    setClientEmail(preset.clientEmail);
    setLineItems(preset.items);
    setTaxRate(preset.taxRate);
    setInvoiceNotes(preset.notes);
    setCurrency(preset.currency);
    setInvoiceNumber(`INV-${new Date().getFullYear()}-${String(invoices.length + 1).padStart(3, '0')}`);
    setInvoiceDate(new Date().toISOString().split('T')[0]);
    setDueDate('');
    setCreatorStep('edit');
    toast.success(`Loaded "${preset.name}" template`);
  };

  const saveInvoice = async () => {
    if (!clientName) { toast.error('Enter client name'); return; }
    const inv: Invoice = {
      id: Date.now().toString(), number: invoiceNumber, client: clientName, amount: total,
      status: 'draft', dueDate: dueDate || 'Not set',
      items: lineItems.map(i => i.description).filter(Boolean).join(', ') || 'Services',
      createdAt: new Date(),
    };
    setInvoices(p => [inv, ...p]);

    // Persist to platform_files so it appears in Files > Invoices
    if (user) {
      await supabase.from('platform_files').insert({
        user_id: user.id,
        file_name: `${invoiceNumber} — ${clientName}`,
        file_type: 'document',
        app_source: 'invoices',
        source_route: '/lounge/office/invoices',
        metadata: { meta: `${currencySymbol(currency)}${total.toLocaleString()} • ${inv.status}`, client: clientName, amount: total, status: inv.status },
      });
    }

    toast.success('Invoice saved as draft');
    setTab('invoices');
  };

  const exportInvoicePDF = () => {
    const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });
    const pw = doc.internal.pageSize.getWidth();
    const ph = doc.internal.pageSize.getHeight();
    const m = 20;
    const cw = pw - m * 2;
    let y = m;
    const tc = selectedTemplate.accent;
    const sym = currencySymbol(currency);

    const line = (yy: number, w = cw, sx = m) => { doc.setDrawColor('#d2d2d7'); doc.setLineWidth(0.3); doc.line(sx, yy, sx + w, yy); };

    // ─── Header ───
    doc.setFont('helvetica', 'bold'); doc.setFontSize(24); doc.setTextColor(tc);
    doc.text(companyName.toUpperCase(), m, y + 8);
    doc.setFont('helvetica', 'normal'); doc.setFontSize(9); doc.setTextColor('#86868b');
    doc.text(companyAddress, m, y + 15);
    doc.text(companyEmail, m, y + 20);
    if (companyPhone) doc.text(companyPhone, m, y + 25);

    doc.setFont('helvetica', 'bold'); doc.setFontSize(24); doc.setTextColor('#000');
    doc.text('INVOICE', pw - m, y + 8, { align: 'right' });

    y += 35; line(y); y += 15;

    // ─── Bill To & Details ───
    doc.setFont('helvetica', 'bold'); doc.setFontSize(8); doc.setTextColor('#86868b');
    doc.text('BILL TO', m, y);
    y += 6;
    doc.setFont('helvetica', 'bold'); doc.setFontSize(12); doc.setTextColor('#000');
    doc.text(clientName || 'Client Name', m, y);
    if (clientEmail) { y += 5; doc.setFont('helvetica', 'normal'); doc.setFontSize(9); doc.setTextColor('#6e6e73'); doc.text(clientEmail, m, y); }
    if (clientAddress) { y += 5; doc.text(clientAddress, m, y, { maxWidth: 80 }); }

    const iy = y - 16;
    const rx = pw - m - 70;
    [
      ['Invoice Number', invoiceNumber],
      ['Issue Date', invoiceDate],
      ['Due Date', dueDate || 'On Receipt'],
    ].forEach(([label, val], i) => {
      const ly = iy + i * 8;
      doc.setFont('helvetica', 'normal'); doc.setFontSize(8); doc.setTextColor('#86868b');
      doc.text(label, rx, ly);
      doc.setFont('helvetica', i === 2 ? 'bold' : 'normal'); doc.setFontSize(10); doc.setTextColor('#000');
      doc.text(val, pw - m, ly, { align: 'right' });
    });

    y += 20; line(y); y += 8;

    // ─── Table Header ───
    doc.setFont('helvetica', 'bold'); doc.setFontSize(8); doc.setTextColor('#86868b');
    doc.text('DESCRIPTION', m, y);
    doc.text('QTY', m + cw * 0.55, y, { align: 'center' });
    doc.text('UNIT PRICE', m + cw * 0.72, y, { align: 'center' });
    doc.text('AMOUNT', pw - m, y, { align: 'right' });
    y += 5; line(y); y += 8;

    // ─── Table Rows ───
    lineItems.forEach((item, idx) => {
      if (!item.description) return;
      if (idx % 2 === 0) { doc.setFillColor('#f5f5f7'); doc.rect(m, y - 4, cw, 10, 'F'); }
      doc.setFont('helvetica', 'normal'); doc.setFontSize(10); doc.setTextColor('#000');
      doc.text(item.description, m, y, { maxWidth: cw * 0.5 });
      doc.text(String(item.quantity), m + cw * 0.55, y, { align: 'center' });
      doc.text(`${sym}${item.rate.toFixed(2)}`, m + cw * 0.72, y, { align: 'center' });
      doc.setFont('helvetica', 'bold');
      doc.text(`${sym}${(item.quantity * item.rate).toFixed(2)}`, pw - m, y, { align: 'right' });
      y += 10;
    });

    y += 5; line(y); y += 15;

    // ─── Totals ───
    const tx = pw - m - 80;
    doc.setFont('helvetica', 'normal'); doc.setFontSize(10); doc.setTextColor('#6e6e73');
    doc.text('Subtotal', tx, y); doc.text(`${sym}${subtotal.toFixed(2)}`, pw - m, y, { align: 'right' }); y += 8;
    if (taxRate > 0) { doc.text(`VAT (${taxRate}%)`, tx, y); doc.text(`${sym}${tax.toFixed(2)}`, pw - m, y, { align: 'right' }); y += 8; }
    line(y, 80, tx); y += 10;
    doc.setFont('helvetica', 'bold'); doc.setFontSize(11); doc.setTextColor('#000');
    doc.text('TOTAL DUE', tx, y);
    doc.setFontSize(16); doc.setTextColor(tc);
    doc.text(`${sym}${total.toFixed(2)}`, pw - m, y, { align: 'right' });
    y += 20;

    // ─── Notes ───
    if (invoiceNotes) {
      line(y); y += 10;
      doc.setFont('helvetica', 'bold'); doc.setFontSize(8); doc.setTextColor('#86868b');
      doc.text('NOTES', m, y); y += 6;
      doc.setFont('helvetica', 'normal'); doc.setFontSize(9); doc.setTextColor('#6e6e73');
      const split = doc.splitTextToSize(invoiceNotes, cw);
      doc.text(split.join('\n'), m, y); y += split.length * 5 + 10;
    }

    // ─── Payment Box ───
    y = Math.max(y, ph - 70);
    doc.setFillColor('#f5f5f7'); doc.roundedRect(m, y, cw, 30, 3, 3, 'F');
    y += 8;
    doc.setFont('helvetica', 'bold'); doc.setFontSize(8); doc.setTextColor('#86868b');
    doc.text('PAYMENT INFORMATION', m + 8, y); y += 6;
    doc.setFont('helvetica', 'normal'); doc.setFontSize(9); doc.setTextColor('#000');
    doc.text(`Bank Transfer: ${companyName}`, m + 8, y);
    doc.setTextColor('#6e6e73');
    doc.text(`Reference: ${invoiceNumber}`, m + 8, y + 5);

    // ─── Footer ───
    const fy = ph - 15;
    line(fy - 5);
    doc.setFont('helvetica', 'normal'); doc.setFontSize(7); doc.setTextColor('#86868b');
    doc.text(`${companyName} · ${companyAddress} · ${companyEmail}${companyVat ? ` · VAT: ${companyVat}` : ''}`, pw / 2, fy, { align: 'center' });
    doc.setFont('helvetica', 'bold'); doc.setFontSize(8); doc.setTextColor('#6e6e73');
    doc.text('Thank you for your business', pw / 2, fy + 4, { align: 'center' });

    doc.save(`${invoiceNumber}.pdf`);
    toast.success('Invoice PDF exported');
  };

  /* ─── PDF Editor Logic (unchanged) ─── */
  const loadPDF = async (f: File) => {
    const buf = await f.arrayBuffer();
    const d = await pdfjsLib.getDocument({ data: buf }).promise;
    setPdfFile(f); setPdfDoc(d); setPdfTotal(d.numPages); setPdfPage(1);
    setPdfAnnotations([]); setPdfTextEdits({}); toast.success(`Loaded ${d.numPages} pages`);
  };

  const renderPdfPage = async () => {
    if (!pdfDoc || !pdfCanvasRef.current) return;
    const page = await pdfDoc.getPage(pdfPage);
    const scale = (pdfZoom / 100) * 1.5;
    const viewport = page.getViewport({ scale });
    const canvas = pdfCanvasRef.current;
    canvas.width = viewport.width; canvas.height = viewport.height;
    setPdfPageSize({ width: viewport.width, height: viewport.height });
    const ctx = canvas.getContext('2d')!;
    await page.render({ canvasContext: ctx, viewport }).promise;
    const tc2 = await page.getTextContent();
    const items: any[] = [];
    tc2.items.forEach((item: any, idx: number) => {
      if (!item.str?.trim()) return;
      const tx2 = pdfjsLib.Util.transform(viewport.transform, item.transform);
      const fontSize = Math.sqrt(tx2[0] * tx2[0] + tx2[1] * tx2[1]);
      items.push({ str: item.str, x: tx2[4], y: tx2[5] - fontSize, width: Math.max(item.width * scale, fontSize * item.str.length * 0.6), height: fontSize * 1.2, fontSize, idx });
    });
    setPdfTextItems(items);
    const pk = `${pdfPage}`;
    const edits = pdfTextEdits[pk];
    if (edits) {
      Object.entries(edits).forEach(([idxStr, newText]) => {
        const item = items.find(i => i.idx === parseInt(idxStr));
        if (!item) return;
        ctx.fillStyle = '#ffffff'; ctx.fillRect(item.x - 1, item.y, item.width + 6, item.height + 2);
        if (newText.trim()) { ctx.fillStyle = '#000000'; ctx.font = `${item.fontSize}px sans-serif`; ctx.textBaseline = 'top'; ctx.fillText(newText, item.x, item.y + 1); }
      });
    }
  };

  // biome-ignore: render effect
  useState(() => { if (pdfDoc) renderPdfPage(); });

  const handlePdfCanvasClick = (e: React.MouseEvent) => {
    if (!pdfContainerRef.current || pdfEditingText !== null) return;
    const rect = pdfContainerRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left, y2 = e.clientY - rect.top;
    if (pdfTool === 'text') { const id = Date.now().toString(); setPdfAnnotations(p => [...p, { id, type: 'text', page: pdfPage, x, y: y2, content: '', color: pdfColor }]); setEditingAnnotText(id); }
    else if (pdfTool === 'rect') setPdfAnnotations(p => [...p, { id: Date.now().toString(), type: 'rect', page: pdfPage, x: x - 50, y: y2 - 25, width: 100, height: 50, color: pdfColor }]);
    else if (pdfTool === 'highlight') setPdfAnnotations(p => [...p, { id: Date.now().toString(), type: 'highlight', page: pdfPage, x: x - 75, y: y2 - 10, width: 150, height: 20, color: '#fbbf24' }]);
  };
  const handlePdfMouseDown = (e: React.MouseEvent) => { if (pdfTool !== 'draw' || !pdfContainerRef.current) return; const rect = pdfContainerRef.current.getBoundingClientRect(); setPdfIsDrawing(true); setPdfCurrentDraw([{ x: e.clientX - rect.left, y: e.clientY - rect.top }]); };
  const handlePdfMouseMove = (e: React.MouseEvent) => { if (!pdfIsDrawing || !pdfContainerRef.current) return; const rect = pdfContainerRef.current.getBoundingClientRect(); setPdfCurrentDraw(p => [...p, { x: e.clientX - rect.left, y: e.clientY - rect.top }]); };
  const handlePdfMouseUp = () => { if (!pdfIsDrawing || pdfCurrentDraw.length < 2) { setPdfIsDrawing(false); return; } setPdfAnnotations(p => [...p, { id: Date.now().toString(), type: 'draw', page: pdfPage, x: 0, y: 0, color: pdfColor, points: pdfCurrentDraw }]); setPdfCurrentDraw([]); setPdfIsDrawing(false); };

  const savePdfToInvoices = async () => {
    const inv: Invoice = { id: Date.now().toString(), number: `PDF-${Date.now().toString().slice(-4)}`, client: pdfFile?.name?.replace('.pdf', '') || 'PDF Document', amount: 0, status: 'draft', dueDate: '-', items: `Edited PDF: ${pdfFile?.name || 'Document'}`, createdAt: new Date() };
    setInvoices(p => [inv, ...p]);
    if (user) {
      await supabase.from('platform_files').insert({
        user_id: user.id,
        file_name: inv.number + ' — ' + inv.client,
        file_type: 'document',
        app_source: 'invoices',
        source_route: '/lounge/office/invoices',
        metadata: { meta: 'PDF Invoice • draft', client: inv.client, amount: 0, status: 'draft' },
      });
    }
    toast.success('Saved to Invoice Dashboard');
  };
  const exportEditedPdf = () => {
    const d = new jsPDF(); d.setFontSize(10); d.text(`Exported — ${pdfFile?.name || 'Document'}`, 10, 10);
    pdfAnnotations.forEach(ann => {
      if (ann.type === 'text' && ann.content) { d.setTextColor(ann.color); d.text(ann.content, ann.x * 0.35, ann.y * 0.35); }
      else if (ann.type === 'rect') { d.setDrawColor(ann.color); d.rect(ann.x * 0.35, ann.y * 0.35, (ann.width || 100) * 0.35, (ann.height || 50) * 0.35); }
      else if (ann.type === 'draw' && ann.points) { d.setDrawColor(ann.color); for (let i = 1; i < ann.points.length; i++) d.line(ann.points[i-1].x * 0.35, ann.points[i-1].y * 0.35, ann.points[i].x * 0.35, ann.points[i].y * 0.35); }
    });
    d.save(`${pdfFile?.name?.replace('.pdf', '') || 'edited'}-annotated.pdf`); toast.success('PDF exported');
  };

  // biome-ignore: PDF render
  if (pdfDoc && pdfCanvasRef.current) { renderPdfPage(); }

  /* ─── Render ─── */
  return (
    <div className="fixed inset-0 z-50 bg-background flex flex-col overflow-hidden">
      {/* Header */}
      <header className="flex h-[52px] shrink-0 items-center gap-2 border-b border-border/60 bg-background px-3 sm:gap-3 sm:px-5">
        <Button variant="ghost" size="sm" className="h-8 gap-2 rounded-lg text-xs shrink-0" onClick={() => navigate('/lounge/office', { state: { fromOfficeApp: true } })}>
          <ArrowLeft className="h-3.5 w-3.5" /><span className="hidden sm:inline">Office</span>
        </Button>
        <div className="hidden h-4 w-px bg-border/60 sm:block" />
        <span className="truncate font-mono text-[10px] font-medium uppercase tracking-[0.14em] text-muted-foreground">Invoices and expenses</span>
        <div className="flex-1" />
      </header>

      <div className="flex-1 overflow-auto">
        <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-10">
          <div className="pb-3 pt-5">
            <h1 className="text-[17px] font-semibold tracking-[-0.015em] text-foreground">Invoices and expenses</h1>
            <p className="mt-0.5 text-[13px] text-muted-foreground">Create, manage and export invoices.</p>
          </div>

          {/* Position ledger */}
          <Panel className="mb-4 overflow-hidden">
            <div className="grid grid-cols-1 gap-px bg-border/60 sm:grid-cols-2 lg:grid-cols-4">
              {[
                { label: 'Total invoiced', value: totalInvoiced },
                { label: 'Collected', value: totalPaid },
                { label: 'Expenses', value: totalExpenses },
                { label: 'Net profit', value: totalPaid - totalExpenses },
              ].map(s => (
                <div key={s.label} className="flex items-center justify-between gap-3 bg-card px-4 py-3">
                  <span className="font-mono text-[10px] font-medium uppercase tracking-[0.13em] text-muted-foreground">{s.label}</span>
                  <Money value={s.value} whole className="font-mono text-[15px] font-medium text-foreground" />
                </div>
              ))}
            </div>
          </Panel>

          {/* Tabs */}
          <div className="mb-4 flex w-fit max-w-full flex-wrap items-center gap-0.5 rounded-lg border border-border/60 bg-sunken p-0.5">
            {([
              { key: 'invoices' as MainTab, label: 'Invoices', icon: Receipt },
              { key: 'expenses' as MainTab, label: 'Expenses', icon: TrendingDown },
              { key: 'creator' as MainTab, label: 'Create invoice', icon: Plus },
              { key: 'pdf-editor' as MainTab, label: 'PDF editor', icon: FileText },
              { key: 'summary' as MainTab, label: 'Summary', icon: Hash },
            ]).map(t => (
              <button key={t.key} onClick={() => { setTab(t.key); if (t.key === 'creator') setCreatorStep('templates'); }}
                className={cn("flex items-center gap-1.5 whitespace-nowrap rounded-md px-3 py-1.5 text-[11px] font-medium transition-colors duration-150",
                  tab === t.key ? "bg-card text-foreground" : "text-muted-foreground hover:text-foreground")}>
                <t.icon className="h-3 w-3" /> {t.label}
              </button>
            ))}
          </div>

          {/* ═══ INVOICES TAB ═══ */}
          {tab === 'invoices' && (
            <div className="pb-10">
              <Panel>
                <PanelHeader label="Invoices" />
                {invoices.length === 0 && (
                  <EmptyState compact title="No invoices yet" body="Create your first invoice from the Create invoice tab." />
                )}
                {invoices.map(inv => {
                  const sc = INV_STATUS[inv.status];
                  return (
                    <div key={inv.id} className="group flex w-full items-center gap-3 border-t border-border/60 px-4 py-2.5 first:border-t-0">
                      <span className="min-w-0 flex-1">
                        <span className="block truncate font-mono text-xs tabular-nums text-foreground">{inv.number}</span>
                        <span className="block truncate text-[11.5px] text-muted-foreground">{inv.client} · {inv.items}</span>
                      </span>
                      <StatusBadge tone={sc.tone} label={sc.label} className="hidden sm:inline-flex" />
                      <Money value={inv.amount} whole className="font-mono text-[13px] font-medium text-foreground" />
                      <button onClick={() => deleteInv(inv.id)} aria-label="Delete invoice" className="flex h-7 w-7 items-center justify-center rounded-md opacity-0 transition-opacity hover:bg-risk/10 focus-visible:opacity-100 group-hover:opacity-100">
                        <Trash2 className="h-3.5 w-3.5 text-muted-foreground" />
                      </button>
                    </div>
                  );
                })}
              </Panel>
            </div>
          )}

          {/* ═══ EXPENSES TAB ═══ */}
          {tab === 'expenses' && (
            <div className="pb-10">
              <Panel>
                <PanelHeader label="Expenses" />
                {expenses.length === 0 && (
                  <EmptyState compact title="No expenses recorded" body="Expenses you add will appear here." />
                )}
                {expenses.map(exp => (
                  <div key={exp.id} className="group flex w-full items-center gap-3 border-t border-border/60 px-4 py-2.5 first:border-t-0">
                    <span className="min-w-0 flex-1">
                      <span className="block truncate text-[13px] font-[450] text-foreground">{exp.title}</span>
                      <span className="block truncate text-[11.5px] text-muted-foreground">{exp.date} · {exp.category}</span>
                    </span>
                    <Money value={exp.amount} whole className="font-mono text-[13px] font-medium text-foreground" />
                    <button onClick={() => deleteExp(exp.id)} aria-label="Delete expense" className="flex h-7 w-7 items-center justify-center rounded-md opacity-0 transition-opacity hover:bg-risk/10 focus-visible:opacity-100 group-hover:opacity-100">
                      <Trash2 className="h-3.5 w-3.5 text-muted-foreground" />
                    </button>
                  </div>
                ))}
              </Panel>
            </div>
          )}

          {/* ═══ INVOICE CREATOR TAB ═══ */}
          {tab === 'creator' && creatorStep === 'templates' && (
            <div className="pb-10">
              {/* Template Selection */}
              <div className="mb-8">
                <h2 className="text-[15px] font-semibold tracking-[-0.01em] text-foreground mb-0.5">Choose a style</h2>
                <p className="text-[13px] text-muted-foreground mb-4">Select a visual template for your invoice. You can customise everything afterwards.</p>
                <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-2 sm:gap-3">
                  {PREMIUM_TEMPLATES.map(t => (
                    <button key={t.id}
                      onClick={() => { setSelectedTemplate(t); setCreatorStep('edit'); }}
                      className={cn("group relative rounded-[10px] border bg-card p-3 text-left transition-colors duration-150",
                        selectedTemplate.id === t.id ? "border-primary ring-1 ring-primary/40" : "border-border/60 hover:border-border")}>
                      {/* Mini document preview */}
                      <div className="rounded-md overflow-hidden mb-2.5 aspect-[3/4] relative border border-border/40" style={{ background: t.previewBg }}>
                        <div className="absolute inset-x-0 top-0 h-[30%]" style={t.headerStyle === 'dark' ? { background: t.accent } : t.headerStyle === 'bold-bar' ? { background: `linear-gradient(135deg, ${t.accent}, ${t.accent}cc)` } : t.headerStyle === 'gradient' ? { background: `linear-gradient(135deg, ${t.accent}22, ${t.accent}08)` } : {}} />
                        {t.headerStyle === 'border-left' && <div className="absolute left-0 top-0 bottom-0 w-1.5" style={{ background: t.accent }} />}
                        {t.headerStyle === 'corner-accent' && <div className="absolute top-0 right-0 w-8 h-8 rounded-bl-2xl" style={{ background: t.accent }} />}
                        <div className="absolute inset-0 p-3 flex flex-col justify-between">
                          <div>
                            <div className="h-1.5 w-12 rounded-full mb-1" style={{ background: t.headerStyle === 'dark' ? '#fff' : t.accent }} />
                            <div className="h-1 w-8 rounded-full opacity-40" style={{ background: t.headerStyle === 'dark' ? '#fff' : t.accent }} />
                          </div>
                          <div className="space-y-1">
                            <div className="h-0.5 w-full rounded-full bg-foreground/5" />
                            <div className="h-0.5 w-full rounded-full bg-foreground/5" />
                            <div className="h-0.5 w-3/4 rounded-full bg-foreground/5" />
                            <div className="h-0.5 w-full rounded-full bg-foreground/5" />
                          </div>
                          <div className="flex justify-end">
                            <div className="h-2 w-10 rounded-full" style={{ background: t.accent }} />
                          </div>
                        </div>
                      </div>
                      <span className="text-[12px] font-[550] text-foreground block">{t.name}</span>
                      <span className="text-[10.5px] text-muted-foreground">{t.description}</span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Pre-built Invoice Presets */}
              <div>
                <h2 className="text-[15px] font-semibold tracking-[-0.01em] text-foreground mb-0.5">Start from a template</h2>
                <p className="text-[13px] text-muted-foreground mb-4">Professional invoices ready to customise. Click to load and edit.</p>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2 sm:gap-3">
                  {INVOICE_PRESETS.map(preset => {
                    const presetTotal = preset.items.reduce((s, it) => s + it.quantity * it.rate, 0);
                    const presetTax = presetTotal * (preset.taxRate / 100);
                    return (
                      <button key={preset.id}
                        onClick={() => loadPreset(preset)}
                        className="group rounded-[10px] border border-border/60 bg-card p-4 text-left transition-colors duration-150 hover:border-border">
                        <div className="flex items-center gap-3 mb-3">
                          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border border-border/60 bg-sunken">
                            <preset.icon className="h-4 w-4 text-muted-foreground" />
                          </div>
                          <div className="min-w-0">
                            <span className="text-[13px] font-[550] text-foreground block truncate">{preset.name}</span>
                            <span className="text-[10.5px] text-muted-foreground">{preset.description}</span>
                          </div>
                        </div>
                        <div className="flex items-center justify-between">
                          <span className="text-[10.5px] text-muted-foreground">{preset.items.length} line items</span>
                          <span className="font-mono text-[13px] font-medium tabular-nums text-foreground">{fmtMoney(presetTotal + presetTax, preset.currency)}</span>
                        </div>
                        <div className="mt-2 border-t border-border/60 pt-2">
                          <span className="text-[10px] text-muted-foreground">{preset.clientName}</span>
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Blank Invoice */}
              <div className="mt-6 text-center">
                <Button variant="outline" className="h-10 gap-2 rounded-lg px-6 text-[13px] font-medium" onClick={() => {
                  setLineItems([{ id: '1', description: '', quantity: 1, rate: 0 }]);
                  setClientName(''); setClientAddress(''); setClientEmail('');
                  setCompanyName('Your Company'); setCompanyAddress('123 Business St, London, UK');
                  setCompanyEmail('hello@company.com'); setInvoiceNotes(''); setTaxRate(20); setCurrency('GBP');
                  setCreatorStep('edit');
                }}>
                  <Plus className="h-4 w-4" /> Start from blank
                </Button>
              </div>
            </div>
          )}

          {tab === 'creator' && creatorStep === 'edit' && (
            <div className="pb-10">
              {/* Back to templates */}
              <button onClick={() => setCreatorStep('templates')} className="mb-4 flex items-center gap-1.5 text-[11px] font-medium text-muted-foreground transition-colors hover:text-foreground">
                <ArrowLeft className="h-3 w-3" /> Back to templates
              </button>

              <div className="grid grid-cols-1 lg:grid-cols-5 gap-4 sm:gap-6">
                {/* Left: Form */}
                <div className="lg:col-span-3 space-y-6">
                  {/* Template selector strip */}
                  <div>
                    <h3 className="font-mono text-[10px] font-medium uppercase tracking-[0.14em] text-muted-foreground mb-2">Template style</h3>
                    <div className="flex flex-wrap gap-1.5">
                      {PREMIUM_TEMPLATES.map(t => (
                        <button key={t.id} onClick={() => setSelectedTemplate(t)}
                          className={cn("flex shrink-0 items-center gap-2 rounded-lg border px-3 py-1.5 text-[11px] font-medium transition-colors duration-150",
                            selectedTemplate.id === t.id ? "border-primary bg-card text-foreground" : "border-border/60 text-muted-foreground hover:border-border")}>
                          <div className="h-3 w-3 rounded-full" style={{ background: t.accent }} />
                          {t.name}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Company & Client — side by side */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-5">
                    <div className="space-y-2.5">
                      <h4 className="font-mono text-[10px] font-medium uppercase tracking-[0.14em] text-muted-foreground flex items-center gap-1.5"><Building2 className="h-3 w-3" /> From</h4>
                      <div className="space-y-2 rounded-[10px] border border-border/60 bg-card p-4">
                        <Input placeholder="Company or your name" value={companyName} onChange={e => setCompanyName(e.target.value)} className="h-9 rounded-lg border-border/60 bg-card text-sm" />
                        <Input placeholder="Address" value={companyAddress} onChange={e => setCompanyAddress(e.target.value)} className="h-9 rounded-lg border-border/60 bg-card text-sm" />
                        <div className="grid grid-cols-2 gap-2">
                          <Input placeholder="Email" value={companyEmail} onChange={e => setCompanyEmail(e.target.value)} className="h-9 rounded-lg border-border/60 bg-card text-sm" />
                          <Input placeholder="Phone" value={companyPhone} onChange={e => setCompanyPhone(e.target.value)} className="h-9 rounded-lg border-border/60 bg-card text-sm" />
                        </div>
                        <Input placeholder="VAT number (optional)" value={companyVat} onChange={e => setCompanyVat(e.target.value)} className="h-9 rounded-lg border-border/60 bg-card text-sm" />
                      </div>
                    </div>
                    <div className="space-y-2.5">
                      <h4 className="font-mono text-[10px] font-medium uppercase tracking-[0.14em] text-muted-foreground flex items-center gap-1.5"><Send className="h-3 w-3" /> Bill to</h4>
                      <div className="space-y-2 rounded-[10px] border border-border/60 bg-card p-4">
                        <Input placeholder="Client name (required)" value={clientName} onChange={e => setClientName(e.target.value)} className="h-9 rounded-lg border-border/60 bg-card text-sm" />
                        <Input placeholder="Client address" value={clientAddress} onChange={e => setClientAddress(e.target.value)} className="h-9 rounded-lg border-border/60 bg-card text-sm" />
                        <Input placeholder="Client email" value={clientEmail} onChange={e => setClientEmail(e.target.value)} className="h-9 rounded-lg border-border/60 bg-card text-sm" />
                      </div>
                    </div>
                  </div>

                  {/* Invoice Details Row */}
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 sm:gap-3">
                    <div>
                      <label className="font-mono text-[10px] font-medium uppercase tracking-[0.14em] text-muted-foreground block mb-1.5"><Hash className="h-3 w-3 inline mr-1" />Invoice no.</label>
                      <Input value={invoiceNumber} onChange={e => setInvoiceNumber(e.target.value)} className="h-9 rounded-lg border-border/60 bg-card text-sm" />
                    </div>
                    <div>
                      <label className="font-mono text-[10px] font-medium uppercase tracking-[0.14em] text-muted-foreground block mb-1.5"><Calendar className="h-3 w-3 inline mr-1" />Date</label>
                      <Input type="date" value={invoiceDate} onChange={e => setInvoiceDate(e.target.value)} className="h-9 rounded-lg border-border/60 bg-card text-sm" />
                    </div>
                    <div>
                      <label className="font-mono text-[10px] font-medium uppercase tracking-[0.14em] text-muted-foreground block mb-1.5"><Calendar className="h-3 w-3 inline mr-1" />Due date</label>
                      <Input type="date" value={dueDate} onChange={e => setDueDate(e.target.value)} className="h-9 rounded-lg border-border/60 bg-card text-sm" />
                    </div>
                    <div>
                      <label className="font-mono text-[10px] font-medium uppercase tracking-[0.14em] text-muted-foreground block mb-1.5">Currency</label>
                      <select value={currency} onChange={e => setCurrency(e.target.value)} className="h-9 w-full rounded-lg border border-border/60 bg-card px-3 text-sm">
                        <option value="GBP">£ GBP</option>
                        <option value="USD">$ USD</option>
                        <option value="EUR">€ EUR</option>
                      </select>
                    </div>
                  </div>

                  {/* Line Items — Table Style */}
                  <div>
                    <h4 className="font-mono text-[10px] font-medium uppercase tracking-[0.14em] text-muted-foreground mb-2">Line items</h4>
                    <div className="overflow-hidden overflow-x-auto rounded-[10px] border border-border/60">
                      {/* Table header - hidden on mobile */}
                      <div className="hidden sm:grid grid-cols-[1fr_70px_90px_90px_36px] gap-2 px-4 py-2.5 bg-sunken border-b border-border/60">
                        <span className="font-mono text-[9.5px] font-medium uppercase tracking-[0.13em] text-muted-foreground">Description</span>
                        <span className="font-mono text-[9.5px] font-medium uppercase tracking-[0.13em] text-muted-foreground text-center">Qty</span>
                        <span className="font-mono text-[9.5px] font-medium uppercase tracking-[0.13em] text-muted-foreground text-right">Rate</span>
                        <span className="font-mono text-[9.5px] font-medium uppercase tracking-[0.13em] text-muted-foreground text-right">Amount</span>
                        <span />
                      </div>
                      {/* Rows - card layout on mobile, table on desktop */}
                      {lineItems.map((item, idx) => (
                        <div key={item.id} className={cn("px-3 sm:px-4 py-2.5 sm:py-2 items-center group", idx % 2 === 0 && "bg-sunken/40")}>
                          {/* Mobile layout */}
                          <div className="sm:hidden space-y-2">
                            <Input placeholder="Description" value={item.description} onChange={e => updateLineItem(item.id, 'description', e.target.value)} className="h-9 rounded-md border-border/60 bg-transparent text-sm" />
                            <div className="flex items-center gap-2">
                              <div className="flex-1">
                                <label className="text-[9px] text-muted-foreground/40 block mb-0.5">Qty</label>
                                <Input type="number" value={item.quantity || ''} onChange={e => updateLineItem(item.id, 'quantity', parseInt(e.target.value) || 0)} className="h-8 rounded-md border-border/60 bg-transparent text-center text-sm tabular-nums" />
                              </div>
                              <div className="flex-1">
                                <label className="text-[9px] text-muted-foreground/40 block mb-0.5">Rate</label>
                                <Input type="number" value={item.rate || ''} onChange={e => updateLineItem(item.id, 'rate', parseFloat(e.target.value) || 0)} className="h-8 rounded-md border-border/60 bg-transparent text-right text-sm tabular-nums" />
                              </div>
                              <div className="shrink-0 text-right pt-3">
                                <span className="font-mono text-[12px] font-medium tabular-nums text-foreground">{fmtMoney(item.quantity * item.rate, currency)}</span>
                              </div>
                              {lineItems.length > 1 && (
                                <button onClick={() => removeLineItem(item.id)} className="h-8 w-8 rounded-lg hover:bg-destructive/20 flex items-center justify-center shrink-0 mt-3">
                                  <X className="h-3 w-3 text-muted-foreground" />
                                </button>
                              )}
                            </div>
                          </div>
                          {/* Desktop layout */}
                          <div className="hidden sm:grid grid-cols-[1fr_70px_90px_90px_36px] gap-2 items-center">
                            <Input placeholder="Description" value={item.description} onChange={e => updateLineItem(item.id, 'description', e.target.value)} className="h-8 rounded-md border-border/60 bg-transparent text-sm" />
                            <Input type="number" value={item.quantity || ''} onChange={e => updateLineItem(item.id, 'quantity', parseInt(e.target.value) || 0)} className="h-8 rounded-md border-border/60 bg-transparent text-center text-sm tabular-nums" />
                            <Input type="number" value={item.rate || ''} onChange={e => updateLineItem(item.id, 'rate', parseFloat(e.target.value) || 0)} className="h-8 rounded-md border-border/60 bg-transparent text-right text-sm tabular-nums" />
                            <span className="text-right font-mono text-[12px] font-medium tabular-nums text-foreground">{fmtMoney(item.quantity * item.rate, currency)}</span>
                            {lineItems.length > 1 ? (
                              <button onClick={() => removeLineItem(item.id)} className="h-7 w-7 rounded-lg hover:bg-destructive/20 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                                <X className="h-3 w-3 text-muted-foreground" />
                              </button>
                            ) : <span />}
                          </div>
                        </div>
                      ))}
                    </div>
                    <Button variant="ghost" size="sm" className="mt-2 h-8 gap-1 rounded-lg text-[11px]" onClick={addLineItem}>
                      <Plus className="h-3 w-3" /> Add line item
                    </Button>
                  </div>

                  {/* Tax & Notes */}
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    <div>
                      <label className="font-mono text-[10px] font-medium uppercase tracking-[0.14em] text-muted-foreground block mb-1.5">Tax rate (%)</label>
                      <Input type="number" value={taxRate} onChange={e => setTaxRate(parseFloat(e.target.value) || 0)} className="h-9 w-24 rounded-lg border-border/60 bg-card text-sm" />
                    </div>
                    <div className="col-span-2">
                      <label className="font-mono text-[10px] font-medium uppercase tracking-[0.14em] text-muted-foreground block mb-1.5">Notes and terms</label>
                      <textarea value={invoiceNotes} onChange={e => setInvoiceNotes(e.target.value)} placeholder="Payment terms, bank details, notes…"
                        className="h-20 w-full resize-none rounded-lg border border-border/60 bg-card px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-ring" />
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex flex-wrap items-center gap-2 sm:gap-3 pt-2">
                    <Button className="h-9 flex-1 gap-2 rounded-lg px-4 text-xs font-medium sm:flex-none sm:px-5 sm:text-[13px]" onClick={saveInvoice}><Save className="h-4 w-4" /> Save draft</Button>
                    <Button variant="outline" className="h-9 flex-1 gap-2 rounded-lg px-4 text-xs font-medium sm:flex-none sm:px-5 sm:text-[13px]" onClick={exportInvoicePDF}><Download className="h-4 w-4" /> Export PDF</Button>
                    <Button variant="ghost" className="hidden h-9 gap-2 rounded-lg px-4 text-xs font-medium sm:flex sm:px-5 sm:text-[13px]" onClick={() => { exportInvoicePDF(); saveInvoice(); }}>
                      <Printer className="h-4 w-4" /> Save and export
                    </Button>
                  </div>
                </div>

                {/* Right: Live Preview */}
                <div className="lg:col-span-2 hidden lg:block">
                  <div className="sticky top-4">
                    <h4 className="font-mono text-[10px] font-medium uppercase tracking-[0.14em] text-muted-foreground mb-2 flex items-center gap-1.5"><Eye className="h-3 w-3" /> Live preview</h4>
                    <div className="overflow-hidden rounded-[10px] border border-border/60 bg-white" style={{ minHeight: 580 }}>
                      {/* Template-driven header */}
                      {selectedTemplate.headerStyle === 'bold-bar' || selectedTemplate.headerStyle === 'dark' ? (
                        <div className="px-6 py-5" style={{ background: selectedTemplate.accent }}>
                          <div className="flex justify-between items-start">
                            <div>
                              <h3 className="text-[14px] font-bold text-white tracking-tight">{companyName}</h3>
                              <p className="text-[8px] text-white/60 mt-0.5">{companyAddress}</p>
                            </div>
                            <div className="text-right">
                              <span className="text-[18px] font-black text-white/90 tracking-tight">INVOICE</span>
                              <p className="text-[8px] text-white/50 mt-0.5">{invoiceNumber}</p>
                            </div>
                          </div>
                        </div>
                      ) : selectedTemplate.headerStyle === 'border-left' ? (
                        <div className="flex">
                          <div className="w-1.5 shrink-0" style={{ background: selectedTemplate.accent }} />
                          <div className="flex-1 px-6 py-5 flex justify-between">
                            <div>
                              <h3 className="text-[14px] font-bold" style={{ color: '#1a1a1a' }}>{companyName}</h3>
                              <p className="text-[8px] text-gray-400 mt-0.5">{companyAddress}</p>
                            </div>
                            <div className="text-right">
                              <span className="text-[18px] font-black tracking-tight" style={{ color: selectedTemplate.accent }}>INVOICE</span>
                              <p className="text-[8px] text-gray-400">{invoiceNumber}</p>
                            </div>
                          </div>
                        </div>
                      ) : (
                        <div className="px-6 py-5">
                          {selectedTemplate.headerStyle === 'corner-accent' && <div className="absolute top-0 right-0 w-16 h-16 rounded-bl-[32px]" style={{ background: selectedTemplate.accent + '15' }} />}
                          <div className="flex justify-between items-start relative">
                            <div>
                              <h3 className="text-[14px] font-bold" style={{ color: selectedTemplate.accent }}>{companyName}</h3>
                              <p className="text-[8px] text-gray-400 mt-0.5">{companyAddress}</p>
                              <p className="text-[8px] text-gray-400">{companyEmail}</p>
                            </div>
                            <div className="text-right">
                              <span className="text-[18px] font-black tracking-tight" style={{ color: '#1a1a1a' }}>INVOICE</span>
                              <p className="text-[8px] text-gray-400">{invoiceNumber}</p>
                              <p className="text-[8px] text-gray-400">{invoiceDate}</p>
                            </div>
                          </div>
                        </div>
                      )}

                      <div className="px-6 pb-6">
                        {/* Bill To */}
                        {clientName && (
                          <div className="mb-4 pb-3 border-b border-gray-100">
                            <span className="text-[7px] font-bold uppercase tracking-[0.15em]" style={{ color: selectedTemplate.accent }}>BILL TO</span>
                            <p className="text-[11px] font-semibold text-gray-800 mt-0.5">{clientName}</p>
                            {clientAddress && <p className="text-[8px] text-gray-400">{clientAddress}</p>}
                            {clientEmail && <p className="text-[8px] text-gray-400">{clientEmail}</p>}
                          </div>
                        )}

                        {/* Items */}
                        <div className="mb-4">
                          {/* Table header */}
                          <div className="flex justify-between text-[7px] font-bold uppercase tracking-[0.12em] pb-1.5 mb-1.5 border-b" style={{ color: selectedTemplate.accent, borderColor: `${selectedTemplate.accent}20` }}>
                            <span className="flex-1">Description</span>
                            <span className="w-10 text-center">Qty</span>
                            <span className="w-16 text-right">Rate</span>
                            <span className="w-16 text-right">Amount</span>
                          </div>
                          {lineItems.filter(i => i.description).map((item, idx) => (
                            <div key={item.id} className={cn("flex justify-between text-[9px] py-1.5", idx % 2 === 0 && "bg-gray-50/50 -mx-1 px-1 rounded")}>
                              <span className="flex-1 text-gray-700">{item.description}</span>
                              <span className="w-10 text-center text-gray-500">{item.quantity}</span>
                              <span className="w-16 text-right text-gray-500">{fmtMoney(item.rate, currency)}</span>
                              <span className="w-16 text-right font-semibold text-gray-800">{fmtMoney(item.quantity * item.rate, currency)}</span>
                            </div>
                          ))}
                        </div>

                        {/* Totals */}
                        <div className="border-t border-gray-100 pt-3 space-y-1 ml-auto" style={{ maxWidth: 200 }}>
                          <div className="flex justify-between text-[9px] text-gray-500"><span>Subtotal</span><span>{fmtMoney(subtotal, currency)}</span></div>
                          {taxRate > 0 && <div className="flex justify-between text-[9px] text-gray-500"><span>VAT ({taxRate}%)</span><span>{fmtMoney(tax, currency)}</span></div>}
                          <div className="flex justify-between text-[12px] font-bold pt-2 border-t border-gray-200" style={{ color: selectedTemplate.accent }}>
                            <span>Total</span><span>{fmtMoney(total, currency)}</span>
                          </div>
                        </div>

                        {/* Notes */}
                        {invoiceNotes && (
                          <div className="mt-4 pt-3 border-t border-gray-100">
                            <span className="text-[7px] font-bold uppercase tracking-[0.15em] text-gray-400">Notes</span>
                            <p className="text-[8px] text-gray-500 mt-1 leading-relaxed">{invoiceNotes}</p>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* ═══ PDF EDITOR TAB ═══ */}
          {tab === 'pdf-editor' && (
            <div className="pb-10">
              {!pdfDoc ? (
                <div
                  className="mx-auto mt-8 flex max-w-md cursor-pointer flex-col items-center gap-3 rounded-[10px] border border-dashed border-border bg-card p-10 transition-colors duration-150 hover:border-primary/50"
                  onClick={() => pdfFileRef.current?.click()}
                  onDragOver={e => e.preventDefault()} onDrop={e => { e.preventDefault(); const f = e.dataTransfer.files[0]; if (f?.type === 'application/pdf') loadPDF(f); }}>
                  <div className="flex h-12 w-12 items-center justify-center rounded-lg border border-border/60 bg-sunken"><Upload className="h-5 w-5 text-muted-foreground" /></div>
                  <h2 className="text-[15px] font-semibold text-foreground">Upload a PDF</h2>
                  <p className="text-center text-[13px] text-muted-foreground">Drag and drop or click to browse. Edit, annotate, then save.</p>
                  <Button variant="outline" className="h-8 rounded-lg text-xs">Choose file</Button>
                  <input ref={pdfFileRef} type="file" accept="application/pdf" className="hidden" onChange={e => { const f = e.target.files?.[0]; if (f?.type === 'application/pdf') loadPDF(f); }} />
                </div>
              ) : (
                <div>
                  <div className="mb-4 flex flex-wrap items-center gap-2 rounded-[10px] border border-border/60 bg-card p-2">
                    <Button variant="ghost" size="sm" className="h-8 rounded-lg text-xs" onClick={() => { setPdfDoc(null); setPdfFile(null); setPdfAnnotations([]); }}>
                      <ArrowLeft className="h-3.5 w-3.5 mr-1" /> Back
                    </Button>
                    <span className="text-xs font-medium text-foreground truncate max-w-[150px]">{pdfFile?.name}</span>
                    <div className="h-4 w-px bg-border/60" />
                    <div className="flex items-center gap-0.5 rounded-lg border border-border/60 bg-sunken p-0.5">
                      {PDF_TOOLS.map(t => (
                        <button key={t.id} onClick={() => setPdfTool(t.id)}
                          className={cn("flex h-7 w-7 items-center justify-center rounded-md transition-colors duration-150", pdfTool === t.id ? "bg-card text-foreground" : "text-muted-foreground hover:text-foreground")}>
                          <t.icon className="h-3.5 w-3.5" />
                        </button>
                      ))}
                    </div>
                    <div className="flex gap-0.5">
                      {PDF_COLORS.map(c => (
                        <button key={c} onClick={() => setPdfColor(c)}
                          className={cn("h-5 w-5 rounded-full border-2 transition-colors duration-150", pdfColor === c ? "border-foreground" : "border-transparent")}
                          style={{ background: c }} />
                      ))}
                    </div>
                    <div className="h-4 w-px bg-border/60" />
                    {pdfTotal > 1 && (
                      <div className="flex items-center gap-1">
                        <Button variant="ghost" size="icon" className="h-7 w-7" disabled={pdfPage <= 1} onClick={() => { setPdfPage(p => p - 1); setTimeout(renderPdfPage, 50); }}><ChevronLeft className="h-3.5 w-3.5" /></Button>
                        <span className="w-10 text-center font-mono text-[10px] tabular-nums">{pdfPage}/{pdfTotal}</span>
                        <Button variant="ghost" size="icon" className="h-7 w-7" disabled={pdfPage >= pdfTotal} onClick={() => { setPdfPage(p => p + 1); setTimeout(renderPdfPage, 50); }}><ChevronRight className="h-3.5 w-3.5" /></Button>
                      </div>
                    )}
                    <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => { setPdfZoom(z => Math.max(50, z - 25)); setTimeout(renderPdfPage, 50); }}><ZoomOut className="h-3.5 w-3.5" /></Button>
                    <span className="w-8 text-center font-mono text-[10px] tabular-nums">{pdfZoom}%</span>
                    <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => { setPdfZoom(z => Math.min(200, z + 25)); setTimeout(renderPdfPage, 50); }}><ZoomIn className="h-3.5 w-3.5" /></Button>
                    <div className="flex-1" />
                    <Button variant="ghost" size="sm" className="h-8 gap-1 rounded-lg text-xs" onClick={savePdfToInvoices}><Save className="h-3.5 w-3.5" /> Save</Button>
                    <Button size="sm" className="h-8 gap-1 rounded-lg text-xs" onClick={exportEditedPdf}><Download className="h-3.5 w-3.5" /> Export</Button>
                  </div>
                  <div className="flex justify-center overflow-auto">
                    <div ref={pdfContainerRef} className="relative rounded-md border border-border/60 bg-white"
                      style={{ width: pdfPageSize.width, height: pdfPageSize.height }}
                      onClick={handlePdfCanvasClick} onMouseDown={handlePdfMouseDown} onMouseMove={handlePdfMouseMove} onMouseUp={handlePdfMouseUp} onMouseLeave={handlePdfMouseUp}>
                      <canvas ref={pdfCanvasRef} className="absolute inset-0 rounded-md" style={{ width: pdfPageSize.width, height: pdfPageSize.height }} />
                      <svg className="absolute inset-0 pointer-events-none" style={{ zIndex: 10, width: pdfPageSize.width, height: pdfPageSize.height }}>
                        {pdfAnnotations.filter(a => a.type === 'draw' && a.page === pdfPage).map(a => (
                          <polyline key={a.id} points={a.points?.map(p => `${p.x},${p.y}`).join(' ') || ''} fill="none" stroke={a.color} strokeWidth="2" strokeLinecap="round" />
                        ))}
                        {pdfIsDrawing && pdfCurrentDraw.length > 1 && (
                          <polyline points={pdfCurrentDraw.map(p => `${p.x},${p.y}`).join(' ')} fill="none" stroke={pdfColor} strokeWidth="2" strokeLinecap="round" />
                        )}
                      </svg>
                      {pdfTool === 'select' && pdfTextItems.map(item => {
                        const pk = `${pdfPage}`;
                        const edited = pdfTextEdits[pk]?.[item.idx] ?? item.str;
                        return (
                          <div key={`t-${item.idx}`} className="absolute" style={{ left: item.x, top: item.y, width: item.width + 4, height: item.height, zIndex: 15 }}>
                            {pdfEditingText === item.idx ? (
                              <input autoFocus defaultValue={edited}
                                onBlur={e => { setPdfTextEdits(p => ({ ...p, [pk]: { ...p[pk], [item.idx]: e.target.value } })); setPdfEditingText(null); setTimeout(renderPdfPage, 50); }}
                                onKeyDown={e => { if (e.key === 'Enter') { setPdfTextEdits(p => ({ ...p, [pk]: { ...p[pk], [item.idx]: (e.target as HTMLInputElement).value } })); setPdfEditingText(null); setTimeout(renderPdfPage, 50); } }}
                                onClick={e => e.stopPropagation()} onMouseDown={e => e.stopPropagation()}
                                className="w-full h-full border-2 border-primary rounded-sm bg-white outline-none px-0.5"
                                style={{ fontSize: item.fontSize, fontFamily: 'sans-serif', lineHeight: `${item.height}px`, color: '#000' }} />
                            ) : (
                              <div className="w-full h-full cursor-text rounded-sm hover:bg-primary/10 hover:outline hover:outline-1 hover:outline-primary/30 transition-colors"
                                onClick={e => { e.stopPropagation(); setPdfEditingText(item.idx); }} onMouseDown={e => e.stopPropagation()}
                                style={{ fontSize: item.fontSize, lineHeight: `${item.height}px`, color: 'transparent' }}>{edited}</div>
                            )}
                          </div>
                        );
                      })}
                      {pdfAnnotations.filter(a => a.type !== 'draw' && a.page === pdfPage).map(a => (
                        <div key={a.id} className="absolute group" style={{ left: a.x, top: a.y, zIndex: 20 }}>
                          {a.type === 'text' ? (
                            <div className="relative">
                              {editingAnnotText === a.id ? (
                                <input autoFocus value={a.content || ''} onChange={e => setPdfAnnotations(p => p.map(x => x.id === a.id ? { ...x, content: e.target.value } : x))}
                                  onBlur={() => setEditingAnnotText(null)} onKeyDown={e => e.key === 'Enter' && setEditingAnnotText(null)}
                                  className="min-w-[100px] px-1 py-0.5 text-sm border border-primary rounded bg-white outline-none" style={{ color: a.color }} />
                              ) : (
                                <span className="text-sm cursor-pointer px-1 py-0.5 rounded hover:bg-accent" style={{ color: a.color }}
                                  onClick={e => { e.stopPropagation(); setEditingAnnotText(a.id); }}>{a.content || 'Click to type…'}</span>
                              )}
                              <button onClick={e => { e.stopPropagation(); setPdfAnnotations(p => p.filter(x => x.id !== a.id)); }}
                                className="absolute -top-2 -right-2 h-4 w-4 rounded-full bg-destructive text-destructive-foreground flex items-center justify-center text-[8px] opacity-0 group-hover:opacity-100">×</button>
                            </div>
                          ) : a.type === 'highlight' ? (
                            <div className="relative">
                              <div style={{ width: a.width, height: a.height, background: `${a.color}40` }} className="rounded" />
                              <button onClick={e => { e.stopPropagation(); setPdfAnnotations(p => p.filter(x => x.id !== a.id)); }}
                                className="absolute -top-2 -right-2 h-4 w-4 rounded-full bg-destructive text-destructive-foreground flex items-center justify-center text-[8px] opacity-0 group-hover:opacity-100">×</button>
                            </div>
                          ) : a.type === 'rect' ? (
                            <div className="relative">
                              <div style={{ width: a.width, height: a.height, border: `2px solid ${a.color}` }} className="rounded" />
                              <button onClick={e => { e.stopPropagation(); setPdfAnnotations(p => p.filter(x => x.id !== a.id)); }}
                                className="absolute -top-2 -right-2 h-4 w-4 rounded-full bg-destructive text-destructive-foreground flex items-center justify-center text-[8px] opacity-0 group-hover:opacity-100">×</button>
                            </div>
                          ) : null}
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* ═══ SUMMARY TAB ═══ */}
          {tab === 'summary' && (
            <div className="grid grid-cols-1 gap-4 pb-10 md:grid-cols-2">
              <Panel>
                <PanelHeader label="Invoice status" />
                {Object.entries(INV_STATUS).map(([key, cfg]) => {
                  const count = invoices.filter(i => i.status === key).length;
                  const amount = invoices.filter(i => i.status === key).reduce((s, i) => s + i.amount, 0);
                  return (
                    <PanelRow
                      key={key}
                      leading={undefined}
                      title={<StatusBadge tone={cfg.tone} label={`${cfg.label} (${count})`} />}
                      trailing={<Money value={amount} whole className="font-mono text-[13px] font-medium text-foreground" />}
                    />
                  );
                })}
              </Panel>
              <Panel>
                <PanelHeader label="Expense categories" />
                {EXP_CATEGORIES.map(cat => {
                  const catTotal = expenses.filter(e => e.category === cat).reduce((s, e) => s + e.amount, 0);
                  if (catTotal === 0) return null;
                  return (
                    <PanelRow
                      key={cat}
                      title={<span className="capitalize">{cat}</span>}
                      trailing={<Money value={catTotal} whole className="font-mono text-[13px] font-medium text-foreground" />}
                    />
                  );
                })}
              </Panel>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
