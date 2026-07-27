import { useState, useRef, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  ArrowLeft, Receipt, Plus, Trash2, DollarSign, TrendingUp, TrendingDown,
  Download, Search, FileText, Palette, Eye, Edit, X, Save, ChevronLeft,
  ChevronRight, Type, Image, Square, Minus, Bold, Italic, AlignLeft,
  AlignCenter, AlignRight, Upload, ZoomIn, ZoomOut, Pen, Highlighter,
  Copy, Layers, Sparkles, Check, Building2, Globe, Mail, Phone, Hash,
  Calendar, CreditCard, FileDown, Printer, Send, Star, Stamp
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { cn } from '@/lib/utils';
import { motion, AnimatePresence } from 'framer-motion';
import { toast } from 'sonner';
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
  id: string; name: string; description: string; icon: any; color: string;
  templateId: string; companyName: string; companyAddress: string; companyEmail: string;
  clientName: string; clientAddress: string; clientEmail: string;
  items: InvoiceLineItem[]; taxRate: number; notes: string; currency: string;
}

const INVOICE_PRESETS: InvoicePreset[] = [
  {
    id: 'web-design', name: 'Website Design', description: 'Full web design project', icon: Globe, color: '#0071e3',
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
    id: 'consulting', name: 'Consulting Retainer', description: 'Monthly advisory services', icon: Building2, color: '#1e293b',
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
    id: 'photography', name: 'Photography Package', description: 'Event & product shoot', icon: Image, color: '#be185d',
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
    id: 'saas', name: 'SaaS License', description: 'Annual software subscription', icon: CreditCard, color: '#7c3aed',
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
    id: 'construction', name: 'Construction Project', description: 'Building & renovation', icon: Building2, color: '#ea580c',
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
    id: 'marketing', name: 'Marketing Campaign', description: 'Digital marketing package', icon: Sparkles, color: '#059669',
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
    id: 'freelance-dev', name: 'Freelance Development', description: 'App development sprint', icon: FileText, color: '#27272a',
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
    id: 'legal', name: 'Legal Services', description: 'Professional legal fees', icon: Stamp, color: '#1e293b',
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

const INV_STATUS: Record<InvStatus, { label: string; color: string }> = {
  draft: { label: 'Draft', color: '#94a3b8' }, sent: { label: 'Sent', color: '#3b82f6' },
  paid: { label: 'Paid', color: '#10b981' }, overdue: { label: 'Overdue', color: '#ef4444' },
};
const CAT_COLORS: Record<ExpCategory, string> = {
  software: '#3b82f6', hardware: '#8b5cf6', travel: '#f59e0b',
  office: '#10b981', marketing: '#ec4899', other: '#94a3b8',
};

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
    setPdfAnnotations([]); setPdfTextEdits({}); toast.success(`Loaded — ${d.numPages} pages`);
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
      <header className="shrink-0 h-[52px] border-b border-border/30 bg-background/80 backdrop-blur-2xl flex items-center px-3 sm:px-5 gap-2 sm:gap-3">
        <Button variant="ghost" size="sm" className="h-8 gap-2 rounded-xl text-xs shrink-0" onClick={() => navigate('/lounge/office', { state: { fromOfficeApp: true } })}>
          <ArrowLeft className="h-3.5 w-3.5" /><span className="hidden sm:inline">Back to Office</span>
        </Button>
        <div className="h-4 w-px bg-border/40 hidden sm:block" />
        <div className="h-7 w-7 rounded-lg bg-gradient-to-br from-emerald-500 to-green-600 flex items-center justify-center shrink-0">
          <Receipt className="h-3.5 w-3.5 text-white" />
        </div>
        <span className="text-xs sm:text-sm font-bold tracking-tight truncate">Invoice & Expenses</span>
        <div className="flex-1" />
      </header>

      <div className="flex-1 overflow-auto">
        <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-10">
          <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} className="pt-6 pb-3">
            <h1 className="text-2xl font-bold text-foreground tracking-tight">Invoice & Expenses</h1>
            <p className="text-sm text-muted-foreground/60 mt-1">Create, manage, and export professional invoices.</p>
          </motion.div>

          {/* Summary Cards */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-2 sm:gap-3 mb-5">
            {[
              { label: 'Total Invoiced', value: `£${totalInvoiced.toLocaleString()}`, icon: Receipt, color: '#3b82f6' },
              { label: 'Collected', value: `£${totalPaid.toLocaleString()}`, icon: TrendingUp, color: '#10b981' },
              { label: 'Expenses', value: `£${totalExpenses.toLocaleString()}`, icon: TrendingDown, color: '#ef4444' },
              { label: 'Net Profit', value: `£${(totalPaid - totalExpenses).toLocaleString()}`, icon: DollarSign, color: '#8b5cf6' },
            ].map((s, i) => (
              <motion.div key={s.label} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}
                className="p-4 rounded-2xl bg-card/50 border border-border/20">
                <div className="flex items-center gap-2 mb-2">
                  <div className="h-8 w-8 rounded-xl flex items-center justify-center" style={{ background: `${s.color}15` }}>
                    <s.icon className="h-4 w-4" style={{ color: s.color }} />
                  </div>
                  <span className="text-[10px] text-muted-foreground/50 font-medium uppercase tracking-wider">{s.label}</span>
                </div>
                <span className="text-xl font-bold text-foreground">{s.value}</span>
              </motion.div>
            ))}
          </div>

          {/* Tabs */}
          <div className="flex flex-wrap items-center gap-1 mb-5 bg-muted/30 p-0.5 rounded-xl">
            {([
              { key: 'invoices' as MainTab, label: 'Invoices', icon: Receipt },
              { key: 'expenses' as MainTab, label: 'Expenses', icon: TrendingDown },
              { key: 'creator' as MainTab, label: 'Create Invoice', icon: Sparkles },
              { key: 'pdf-editor' as MainTab, label: 'PDF Editor', icon: FileText },
              { key: 'summary' as MainTab, label: 'Summary', icon: DollarSign },
            ]).map(t => (
              <button key={t.key} onClick={() => { setTab(t.key); if (t.key === 'creator') setCreatorStep('templates'); }}
                className={cn("px-3 py-2 rounded-lg text-[11px] font-semibold flex items-center gap-1.5 transition-all whitespace-nowrap",
                  tab === t.key ? "bg-background shadow-sm text-foreground" : "text-muted-foreground/60 hover:text-foreground")}>
                <t.icon className="h-3 w-3" /> {t.label}
              </button>
            ))}
          </div>

          {/* ═══ INVOICES TAB ═══ */}
          {tab === 'invoices' && (
            <div className="pb-10 space-y-2">
              {invoices.map(inv => {
                const sc = INV_STATUS[inv.status];
                return (
                   <motion.div key={inv.id} initial={{ opacity: 0 }} animate={{ opacity: 1 }}
                    className="group p-3 sm:p-5 rounded-2xl bg-card/50 border border-border/20 hover:border-border/40 hover:shadow-lg transition-all">
                    <div className="flex items-center justify-between gap-2">
                      <div className="flex items-center gap-2 sm:gap-4 min-w-0">
                        <div className="h-9 w-9 sm:h-10 sm:w-10 rounded-xl flex items-center justify-center shrink-0" style={{ background: `${sc.color}15` }}>
                          <Receipt className="h-4 w-4 sm:h-5 sm:w-5" style={{ color: sc.color }} />
                        </div>
                        <div className="min-w-0">
                          <h3 className="text-[12px] sm:text-[13px] font-semibold text-foreground truncate">{inv.number}</h3>
                          <span className="text-[10px] text-muted-foreground/50 truncate block">{inv.client}</span>
                        </div>
                      </div>
                      <div className="flex items-center gap-2 sm:gap-3 shrink-0">
                        <div className="text-right">
                          <span className="text-[13px] sm:text-[14px] font-bold text-foreground block">£{inv.amount.toLocaleString()}</span>
                          <span className="text-[9px] sm:text-[10px] px-2 py-0.5 rounded-full font-medium" style={{ background: `${sc.color}15`, color: sc.color }}>{sc.label}</span>
                        </div>
                        <button onClick={() => deleteInv(inv.id)} className="h-7 w-7 rounded-lg hover:bg-destructive/20 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                          <Trash2 className="h-3.5 w-3.5 text-muted-foreground" />
                        </button>
                      </div>
                    </div>
                  </motion.div>
                );
              })}
            </div>
          )}

          {/* ═══ EXPENSES TAB ═══ */}
          {tab === 'expenses' && (
            <div className="pb-10 space-y-2">
              {expenses.map(exp => (
                <motion.div key={exp.id} initial={{ opacity: 0 }} animate={{ opacity: 1 }}
                  className="group flex items-center gap-4 p-4 rounded-2xl bg-card/50 border border-border/20 hover:border-border/40 transition-all">
                  <div className="h-10 w-10 rounded-xl flex items-center justify-center shrink-0" style={{ background: `${CAT_COLORS[exp.category]}15` }}>
                    <TrendingDown className="h-5 w-5" style={{ color: CAT_COLORS[exp.category] }} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <span className="text-[12px] font-semibold text-foreground block truncate">{exp.title}</span>
                    <span className="text-[10px] text-muted-foreground/45">{exp.date} · {exp.category}</span>
                  </div>
                  <span className="text-[13px] font-bold text-foreground shrink-0">£{exp.amount.toLocaleString()}</span>
                  <button onClick={() => deleteExp(exp.id)} className="h-7 w-7 rounded-lg hover:bg-destructive/20 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity shrink-0">
                    <Trash2 className="h-3.5 w-3.5 text-muted-foreground" />
                  </button>
                </motion.div>
              ))}
            </div>
          )}

          {/* ═══ INVOICE CREATOR TAB ═══ */}
          {tab === 'creator' && creatorStep === 'templates' && (
            <div className="pb-10">
              {/* Template Selection */}
              <div className="mb-8">
                <h2 className="text-lg font-bold text-foreground mb-1">Choose a Style</h2>
                <p className="text-sm text-muted-foreground/50 mb-5">Select a visual template for your invoice. You can customise everything afterwards.</p>
                <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-2 sm:gap-3">
                  {PREMIUM_TEMPLATES.map((t, i) => (
                    <motion.button key={t.id} initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.04 }}
                      onClick={() => { setSelectedTemplate(t); setCreatorStep('edit'); }}
                      className={cn("group relative p-4 rounded-2xl border-2 transition-all text-left hover:shadow-xl hover:-translate-y-1",
                        selectedTemplate.id === t.id ? "border-foreground shadow-lg" : "border-border/20 hover:border-border/50")}>
                      {/* Mini preview */}
                      <div className="rounded-xl overflow-hidden mb-3 aspect-[3/4] relative" style={{ background: t.previewBg }}>
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
                      <span className="text-[12px] font-bold text-foreground block">{t.name}</span>
                      <span className="text-[10px] text-muted-foreground/50">{t.description}</span>
                    </motion.button>
                  ))}
                </div>
              </div>

              {/* Pre-built Invoice Presets */}
              <div>
                <h2 className="text-lg font-bold text-foreground mb-1">Start from a Template</h2>
                <p className="text-sm text-muted-foreground/50 mb-5">Professional invoices ready to customise. Click to load and edit.</p>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2 sm:gap-3">
                  {INVOICE_PRESETS.map((preset, i) => {
                    const presetTotal = preset.items.reduce((s, it) => s + it.quantity * it.rate, 0);
                    const presetTax = presetTotal * (preset.taxRate / 100);
                    return (
                      <motion.button key={preset.id} initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 + i * 0.04 }}
                        onClick={() => loadPreset(preset)}
                        className="group p-5 rounded-2xl border border-border/20 bg-card/40 hover:border-border/50 hover:shadow-xl hover:-translate-y-1 transition-all text-left">
                        <div className="flex items-center gap-3 mb-3">
                          <div className="h-10 w-10 rounded-xl flex items-center justify-center shrink-0 group-hover:scale-110 transition-transform" style={{ background: `${preset.color}12` }}>
                            <preset.icon className="h-5 w-5" style={{ color: preset.color }} />
                          </div>
                          <div className="min-w-0">
                            <span className="text-[13px] font-bold text-foreground block truncate">{preset.name}</span>
                            <span className="text-[10px] text-muted-foreground/45">{preset.description}</span>
                          </div>
                        </div>
                        <div className="flex items-center justify-between">
                          <span className="text-[10px] text-muted-foreground/40">{preset.items.length} line items</span>
                          <span className="text-[13px] font-bold" style={{ color: preset.color }}>{fmtMoney(presetTotal + presetTax, preset.currency)}</span>
                        </div>
                        <div className="mt-2 pt-2 border-t border-border/10">
                          <span className="text-[9px] text-muted-foreground/35">{preset.clientName}</span>
                        </div>
                      </motion.button>
                    );
                  })}
                </div>
              </div>

              {/* Blank Invoice */}
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.5 }} className="mt-6 text-center">
                <Button variant="outline" className="h-12 px-8 rounded-2xl gap-2 text-sm font-semibold" onClick={() => {
                  setLineItems([{ id: '1', description: '', quantity: 1, rate: 0 }]);
                  setClientName(''); setClientAddress(''); setClientEmail('');
                  setCompanyName('Your Company'); setCompanyAddress('123 Business St, London, UK');
                  setCompanyEmail('hello@company.com'); setInvoiceNotes(''); setTaxRate(20); setCurrency('GBP');
                  setCreatorStep('edit');
                }}>
                  <Plus className="h-4 w-4" /> Start from Blank
                </Button>
              </motion.div>
            </div>
          )}

          {tab === 'creator' && creatorStep === 'edit' && (
            <div className="pb-10">
              {/* Back to templates */}
              <button onClick={() => setCreatorStep('templates')} className="flex items-center gap-1.5 text-[11px] font-medium text-muted-foreground/50 hover:text-foreground mb-4 transition-colors">
                <ArrowLeft className="h-3 w-3" /> Back to Templates
              </button>

              <div className="grid grid-cols-1 lg:grid-cols-5 gap-4 sm:gap-6">
                {/* Left: Form */}
                <div className="lg:col-span-3 space-y-6">
                  {/* Template selector strip */}
                  <div>
                    <h3 className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground/40 mb-2">Template Style</h3>
                    <div className="flex flex-wrap gap-1.5">
                      {PREMIUM_TEMPLATES.map(t => (
                        <button key={t.id} onClick={() => setSelectedTemplate(t)}
                          className={cn("shrink-0 flex items-center gap-2 px-3 py-2 rounded-xl border transition-all text-[11px] font-medium",
                            selectedTemplate.id === t.id ? "border-foreground bg-foreground/5 text-foreground" : "border-border/20 text-muted-foreground/50 hover:border-border/40")}>
                          <div className="h-3 w-3 rounded-full" style={{ background: t.accent }} />
                          {t.name}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Company & Client — side by side */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-5">
                    <div className="space-y-2.5">
                      <h4 className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground/40 flex items-center gap-1.5"><Building2 className="h-3 w-3" /> From</h4>
                      <div className="p-4 rounded-2xl bg-card/40 border border-border/15 space-y-2">
                        <Input placeholder="Company / Your Name" value={companyName} onChange={e => setCompanyName(e.target.value)} className="h-9 rounded-xl text-sm border-border/20 bg-background/50" />
                        <Input placeholder="Address" value={companyAddress} onChange={e => setCompanyAddress(e.target.value)} className="h-9 rounded-xl text-sm border-border/20 bg-background/50" />
                        <div className="grid grid-cols-2 gap-2">
                          <Input placeholder="Email" value={companyEmail} onChange={e => setCompanyEmail(e.target.value)} className="h-9 rounded-xl text-sm border-border/20 bg-background/50" />
                          <Input placeholder="Phone" value={companyPhone} onChange={e => setCompanyPhone(e.target.value)} className="h-9 rounded-xl text-sm border-border/20 bg-background/50" />
                        </div>
                        <Input placeholder="VAT Number (optional)" value={companyVat} onChange={e => setCompanyVat(e.target.value)} className="h-9 rounded-xl text-sm border-border/20 bg-background/50" />
                      </div>
                    </div>
                    <div className="space-y-2.5">
                      <h4 className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground/40 flex items-center gap-1.5"><Send className="h-3 w-3" /> Bill To</h4>
                      <div className="p-4 rounded-2xl bg-card/40 border border-border/15 space-y-2">
                        <Input placeholder="Client Name *" value={clientName} onChange={e => setClientName(e.target.value)} className="h-9 rounded-xl text-sm border-border/20 bg-background/50" />
                        <Input placeholder="Client Address" value={clientAddress} onChange={e => setClientAddress(e.target.value)} className="h-9 rounded-xl text-sm border-border/20 bg-background/50" />
                        <Input placeholder="Client Email" value={clientEmail} onChange={e => setClientEmail(e.target.value)} className="h-9 rounded-xl text-sm border-border/20 bg-background/50" />
                      </div>
                    </div>
                  </div>

                  {/* Invoice Details Row */}
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 sm:gap-3">
                    <div>
                      <label className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground/40 block mb-1.5"><Hash className="h-3 w-3 inline mr-1" />Invoice #</label>
                      <Input value={invoiceNumber} onChange={e => setInvoiceNumber(e.target.value)} className="h-9 rounded-xl text-sm border-border/20 bg-background/50" />
                    </div>
                    <div>
                      <label className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground/40 block mb-1.5"><Calendar className="h-3 w-3 inline mr-1" />Date</label>
                      <Input type="date" value={invoiceDate} onChange={e => setInvoiceDate(e.target.value)} className="h-9 rounded-xl text-sm border-border/20 bg-background/50" />
                    </div>
                    <div>
                      <label className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground/40 block mb-1.5"><Calendar className="h-3 w-3 inline mr-1" />Due Date</label>
                      <Input type="date" value={dueDate} onChange={e => setDueDate(e.target.value)} className="h-9 rounded-xl text-sm border-border/20 bg-background/50" />
                    </div>
                    <div>
                      <label className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground/40 block mb-1.5">Currency</label>
                      <select value={currency} onChange={e => setCurrency(e.target.value)} className="h-9 w-full rounded-xl text-sm border border-border/20 bg-background/50 px-3">
                        <option value="GBP">£ GBP</option>
                        <option value="USD">$ USD</option>
                        <option value="EUR">€ EUR</option>
                      </select>
                    </div>
                  </div>

                  {/* Line Items — Table Style */}
                  <div>
                    <h4 className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground/40 mb-2">Line Items</h4>
                    <div className="rounded-2xl border border-border/15 overflow-hidden overflow-x-auto">
                      {/* Table header - hidden on mobile */}
                      <div className="hidden sm:grid grid-cols-[1fr_70px_90px_90px_36px] gap-2 px-4 py-2.5 bg-muted/30 border-b border-border/10">
                        <span className="text-[9px] font-bold uppercase tracking-widest text-muted-foreground/40">Description</span>
                        <span className="text-[9px] font-bold uppercase tracking-widest text-muted-foreground/40 text-center">Qty</span>
                        <span className="text-[9px] font-bold uppercase tracking-widest text-muted-foreground/40 text-right">Rate</span>
                        <span className="text-[9px] font-bold uppercase tracking-widest text-muted-foreground/40 text-right">Amount</span>
                        <span />
                      </div>
                      {/* Rows - card layout on mobile, table on desktop */}
                      {lineItems.map((item, idx) => (
                        <div key={item.id} className={cn("px-3 sm:px-4 py-2.5 sm:py-2 items-center group", idx % 2 === 0 && "bg-card/30")}>
                          {/* Mobile layout */}
                          <div className="sm:hidden space-y-2">
                            <Input placeholder="Description" value={item.description} onChange={e => updateLineItem(item.id, 'description', e.target.value)} className="h-9 rounded-lg text-sm border-border/15 bg-transparent" />
                            <div className="flex items-center gap-2">
                              <div className="flex-1">
                                <label className="text-[9px] text-muted-foreground/40 block mb-0.5">Qty</label>
                                <Input type="number" value={item.quantity || ''} onChange={e => updateLineItem(item.id, 'quantity', parseInt(e.target.value) || 0)} className="h-8 rounded-lg text-sm text-center border-border/15 bg-transparent" />
                              </div>
                              <div className="flex-1">
                                <label className="text-[9px] text-muted-foreground/40 block mb-0.5">Rate</label>
                                <Input type="number" value={item.rate || ''} onChange={e => updateLineItem(item.id, 'rate', parseFloat(e.target.value) || 0)} className="h-8 rounded-lg text-sm text-right border-border/15 bg-transparent" />
                              </div>
                              <div className="shrink-0 text-right pt-3">
                                <span className="text-[12px] font-bold text-foreground">{fmtMoney(item.quantity * item.rate, currency)}</span>
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
                            <Input placeholder="Description" value={item.description} onChange={e => updateLineItem(item.id, 'description', e.target.value)} className="h-8 rounded-lg text-sm border-border/15 bg-transparent" />
                            <Input type="number" value={item.quantity || ''} onChange={e => updateLineItem(item.id, 'quantity', parseInt(e.target.value) || 0)} className="h-8 rounded-lg text-sm text-center border-border/15 bg-transparent" />
                            <Input type="number" value={item.rate || ''} onChange={e => updateLineItem(item.id, 'rate', parseFloat(e.target.value) || 0)} className="h-8 rounded-lg text-sm text-right border-border/15 bg-transparent" />
                            <span className="text-[12px] font-bold text-foreground text-right">{fmtMoney(item.quantity * item.rate, currency)}</span>
                            {lineItems.length > 1 ? (
                              <button onClick={() => removeLineItem(item.id)} className="h-7 w-7 rounded-lg hover:bg-destructive/20 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                                <X className="h-3 w-3 text-muted-foreground" />
                              </button>
                            ) : <span />}
                          </div>
                        </div>
                      ))}
                    </div>
                    <Button variant="ghost" size="sm" className="mt-2 h-8 gap-1 text-[11px] rounded-xl" onClick={addLineItem}>
                      <Plus className="h-3 w-3" /> Add Line Item
                    </Button>
                  </div>

                  {/* Tax & Notes */}
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    <div>
                      <label className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground/40 block mb-1.5">Tax Rate (%)</label>
                      <Input type="number" value={taxRate} onChange={e => setTaxRate(parseFloat(e.target.value) || 0)} className="h-9 rounded-xl text-sm w-24 border-border/20 bg-background/50" />
                    </div>
                    <div className="col-span-2">
                      <label className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground/40 block mb-1.5">Notes / Terms</label>
                      <textarea value={invoiceNotes} onChange={e => setInvoiceNotes(e.target.value)} placeholder="Payment terms, bank details, notes…"
                        className="w-full h-20 rounded-xl border border-border/20 bg-background/50 px-3 py-2 text-sm resize-none focus:outline-none focus:ring-1 focus:ring-ring" />
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex flex-wrap items-center gap-2 sm:gap-3 pt-2">
                    <Button className="h-10 sm:h-11 px-4 sm:px-6 gap-2 rounded-xl text-xs sm:text-sm font-semibold flex-1 sm:flex-none" onClick={saveInvoice}><Save className="h-4 w-4" /> Save Draft</Button>
                    <Button variant="outline" className="h-10 sm:h-11 px-4 sm:px-6 gap-2 rounded-xl text-xs sm:text-sm font-semibold flex-1 sm:flex-none" onClick={exportInvoicePDF}><Download className="h-4 w-4" /> Export PDF</Button>
                    <Button variant="ghost" className="h-10 sm:h-11 px-4 sm:px-6 gap-2 rounded-xl text-xs sm:text-sm font-semibold hidden sm:flex" onClick={() => { exportInvoicePDF(); saveInvoice(); }}>
                      <Printer className="h-4 w-4" /> Save & Export
                    </Button>
                  </div>
                </div>

                {/* Right: Live Preview */}
                <div className="lg:col-span-2 hidden lg:block">
                  <div className="sticky top-4">
                    <h4 className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground/40 mb-2 flex items-center gap-1.5"><Eye className="h-3 w-3" /> Live Preview</h4>
                    <div className="rounded-2xl border border-border/20 bg-white shadow-2xl overflow-hidden" style={{ minHeight: 580 }}>
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
                <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }}
                  className="max-w-md mx-auto p-10 rounded-3xl border-2 border-dashed border-border/30 bg-card/30 flex flex-col items-center gap-4 hover:border-primary/30 transition-all cursor-pointer mt-8"
                  onClick={() => pdfFileRef.current?.click()}
                  onDragOver={e => e.preventDefault()} onDrop={e => { e.preventDefault(); const f = e.dataTransfer.files[0]; if (f?.type === 'application/pdf') loadPDF(f); }}>
                  <div className="h-16 w-16 rounded-2xl bg-destructive/10 flex items-center justify-center"><Upload className="h-8 w-8 text-destructive" /></div>
                  <h2 className="text-lg font-bold text-foreground">Upload a PDF</h2>
                  <p className="text-sm text-muted-foreground/60 text-center">Drag & drop or click to browse. Edit, annotate, then save.</p>
                  <Button variant="outline" className="rounded-xl">Choose File</Button>
                  <input ref={pdfFileRef} type="file" accept="application/pdf" className="hidden" onChange={e => { const f = e.target.files?.[0]; if (f?.type === 'application/pdf') loadPDF(f); }} />
                </motion.div>
              ) : (
                <div>
                  <div className="flex items-center gap-2 mb-4 p-2 rounded-xl bg-card/50 border border-border/20 flex-wrap">
                    <Button variant="ghost" size="sm" className="h-8 rounded-lg text-xs" onClick={() => { setPdfDoc(null); setPdfFile(null); setPdfAnnotations([]); }}>
                      <ArrowLeft className="h-3.5 w-3.5 mr-1" /> Back
                    </Button>
                    <span className="text-xs font-medium text-foreground truncate max-w-[150px]">{pdfFile?.name}</span>
                    <div className="h-4 w-px bg-border/40" />
                    <div className="flex items-center gap-0.5 bg-muted/50 p-0.5 rounded-lg">
                      {PDF_TOOLS.map(t => (
                        <button key={t.id} onClick={() => setPdfTool(t.id)}
                          className={cn("h-7 w-7 rounded-md flex items-center justify-center transition-all", pdfTool === t.id ? "bg-background shadow-sm text-foreground" : "text-muted-foreground/60 hover:text-foreground")}>
                          <t.icon className="h-3.5 w-3.5" />
                        </button>
                      ))}
                    </div>
                    <div className="flex gap-0.5">
                      {PDF_COLORS.map(c => (
                        <button key={c} onClick={() => setPdfColor(c)}
                          className={cn("h-5 w-5 rounded-full border-2 transition-all", pdfColor === c ? "border-foreground scale-110" : "border-transparent")}
                          style={{ background: c }} />
                      ))}
                    </div>
                    <div className="h-4 w-px bg-border/40" />
                    {pdfTotal > 1 && (
                      <div className="flex items-center gap-1">
                        <Button variant="ghost" size="icon" className="h-7 w-7" disabled={pdfPage <= 1} onClick={() => { setPdfPage(p => p - 1); setTimeout(renderPdfPage, 50); }}><ChevronLeft className="h-3.5 w-3.5" /></Button>
                        <span className="text-[10px] font-mono w-10 text-center">{pdfPage}/{pdfTotal}</span>
                        <Button variant="ghost" size="icon" className="h-7 w-7" disabled={pdfPage >= pdfTotal} onClick={() => { setPdfPage(p => p + 1); setTimeout(renderPdfPage, 50); }}><ChevronRight className="h-3.5 w-3.5" /></Button>
                      </div>
                    )}
                    <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => { setPdfZoom(z => Math.max(50, z - 25)); setTimeout(renderPdfPage, 50); }}><ZoomOut className="h-3.5 w-3.5" /></Button>
                    <span className="text-[10px] w-8 text-center font-mono">{pdfZoom}%</span>
                    <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => { setPdfZoom(z => Math.min(200, z + 25)); setTimeout(renderPdfPage, 50); }}><ZoomIn className="h-3.5 w-3.5" /></Button>
                    <div className="flex-1" />
                    <Button variant="ghost" size="sm" className="h-8 gap-1 rounded-lg text-xs text-emerald-600" onClick={savePdfToInvoices}><Save className="h-3.5 w-3.5" /> Save</Button>
                    <Button size="sm" className="h-8 gap-1 rounded-lg text-xs" onClick={exportEditedPdf}><Download className="h-3.5 w-3.5" /> Export</Button>
                  </div>
                  <div className="flex justify-center overflow-auto">
                    <div ref={pdfContainerRef} className="relative shadow-2xl rounded-lg bg-white"
                      style={{ width: pdfPageSize.width, height: pdfPageSize.height }}
                      onClick={handlePdfCanvasClick} onMouseDown={handlePdfMouseDown} onMouseMove={handlePdfMouseMove} onMouseUp={handlePdfMouseUp} onMouseLeave={handlePdfMouseUp}>
                      <canvas ref={pdfCanvasRef} className="absolute inset-0 rounded-lg" style={{ width: pdfPageSize.width, height: pdfPageSize.height }} />
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
            <div className="pb-10 grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="p-6 rounded-2xl bg-card/50 border border-border/20">
                <h3 className="text-[11px] font-semibold text-muted-foreground/40 uppercase tracking-widest mb-4">Invoice Status</h3>
                <div className="space-y-3">
                  {Object.entries(INV_STATUS).map(([key, cfg]) => {
                    const count = invoices.filter(i => i.status === key).length;
                    const amount = invoices.filter(i => i.status === key).reduce((s, i) => s + i.amount, 0);
                    return (
                      <div key={key} className="flex items-center justify-between">
                        <span className="text-[11px] font-medium" style={{ color: cfg.color }}>{cfg.label} ({count})</span>
                        <span className="text-[12px] font-bold text-foreground">£{amount.toLocaleString()}</span>
                      </div>
                    );
                  })}
                </div>
              </div>
              <div className="p-6 rounded-2xl bg-card/50 border border-border/20">
                <h3 className="text-[11px] font-semibold text-muted-foreground/40 uppercase tracking-widest mb-4">Expense Categories</h3>
                <div className="space-y-3">
                  {Object.entries(CAT_COLORS).map(([cat, color]) => {
                    const catTotal = expenses.filter(e => e.category === cat).reduce((s, e) => s + e.amount, 0);
                    if (catTotal === 0) return null;
                    return (
                      <div key={cat} className="flex items-center justify-between">
                        <span className="text-[11px] font-medium capitalize" style={{ color }}>{cat}</span>
                        <span className="text-[12px] font-bold text-foreground">£{catTotal.toLocaleString()}</span>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
