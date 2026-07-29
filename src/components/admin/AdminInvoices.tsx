import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import {
  FileText,
  Search,
  Plus,
  Edit,
  CheckCircle2,
  Send,
  Download,
  Eye,
  Trash2,
  Building2,
  RefreshCw,
  Loader2
} from 'lucide-react';
import { format } from 'date-fns';
import { generateInvoicePDF } from '@/lib/invoicePdfGenerator';
import PaymentTrendsChart from './PaymentTrendsChart';
import {
  Panel, DataTable, StatusBadge, Money, ConfirmDialog, SkeletonBlock, SkeletonTable,
  type Column, type Tone,
} from '@/components/platform';

interface Invoice {
  id: string;
  invoice_number: string;
  team_id: string;
  amount: number;
  total_amount: number;
  tax_amount: number | null;
  status: string | null;
  due_date: string | null;
  paid_at: string | null;
  notes: string | null;
  items: any;
  currency: string | null;
  payment_method: string | null;
  created_at: string;
  created_by: string | null;
}

interface ClientTeam {
  id: string;
  team_name: string | null;
  team_code: string;
  primary_account_id: string;
}

const AdminInvoices = () => {
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [teams, setTeams] = useState<ClientTeam[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [selectedInvoice, setSelectedInvoice] = useState<Invoice | null>(null);
  const [loading, setLoading] = useState(true);
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [viewDialogOpen, setViewDialogOpen] = useState(false);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [downloadingId, setDownloadingId] = useState<string | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<Invoice | null>(null);

  const [newInvoice, setNewInvoice] = useState({
    team_id: '',
    items: [] as { name: string; quantity: number; price: number }[],
    due_date: '',
    notes: '',
    tax_rate: 0
  });

  const [editInvoice, setEditInvoice] = useState({
    id: '',
    team_id: '',
    items: [] as { name: string; quantity: number; price: number }[],
    due_date: '',
    notes: '',
    tax_rate: 0,
    status: 'pending'
  });

  const [newItem, setNewItem] = useState({ name: '', quantity: 1, price: 0 });
  const [editItem, setEditItem] = useState({ name: '', quantity: 1, price: 0 });

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const [invoicesRes, teamsRes] = await Promise.all([
        supabase.from('client_invoices').select('*').order('created_at', { ascending: false }),
        supabase.from('client_teams').select('*').order('team_name')
      ]);

      if (invoicesRes.error) throw invoicesRes.error;
      if (teamsRes.error) throw teamsRes.error;

      setInvoices(invoicesRes.data || []);
      setTeams(teamsRes.data || []);
    } catch (error) {
      console.error('Error fetching data:', error);
      toast.error('Failed to load invoices');
    } finally {
      setLoading(false);
    }
  };

  const getTeamName = (teamId: string) => {
    const team = teams.find(t => t.id === teamId);
    return team?.team_name || team?.team_code || 'Unknown team';
  };

  const filteredInvoices = invoices.filter(invoice => {
    const search = searchTerm.toLowerCase();
    const teamName = getTeamName(invoice.team_id).toLowerCase();
    const matchesSearch =
      invoice.invoice_number.toLowerCase().includes(search) ||
      teamName.includes(search);
    const matchesStatus = statusFilter === 'all' || invoice.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const addItemToInvoice = () => {
    if (newItem.name && newItem.price > 0) {
      setNewInvoice(prev => ({
        ...prev,
        items: [...prev.items, { ...newItem }]
      }));
      setNewItem({ name: '', quantity: 1, price: 0 });
    }
  };

  const removeItemFromInvoice = (index: number) => {
    setNewInvoice(prev => ({
      ...prev,
      items: prev.items.filter((_, i) => i !== index)
    }));
  };

  // Edit invoice item functions
  const addItemToEditInvoice = () => {
    if (editItem.name && editItem.price > 0) {
      setEditInvoice(prev => ({
        ...prev,
        items: [...prev.items, { ...editItem }]
      }));
      setEditItem({ name: '', quantity: 1, price: 0 });
    }
  };

  const removeItemFromEditInvoice = (index: number) => {
    setEditInvoice(prev => ({
      ...prev,
      items: prev.items.filter((_, i) => i !== index)
    }));
  };

  const calculateSubtotal = () => {
    return newInvoice.items.reduce((sum, item) => sum + (item.price * item.quantity), 0);
  };

  const calculateTax = () => {
    return calculateSubtotal() * (newInvoice.tax_rate / 100);
  };

  const calculateTotal = () => {
    return calculateSubtotal() + calculateTax();
  };

  const calculateEditSubtotal = () => {
    return editInvoice.items.reduce((sum, item) => sum + (item.price * item.quantity), 0);
  };

  const calculateEditTax = () => {
    return calculateEditSubtotal() * (editInvoice.tax_rate / 100);
  };

  const calculateEditTotal = () => {
    return calculateEditSubtotal() + calculateEditTax();
  };

  const openEditDialog = (invoice: Invoice) => {
    const items = Array.isArray(invoice.items) ? invoice.items.map((item: any) => ({
      name: item.name || '',
      quantity: item.quantity || 1,
      price: item.price || 0
    })) : [];

    const taxRate = invoice.tax_amount && invoice.amount > 0
      ? (invoice.tax_amount / invoice.amount) * 100
      : 0;

    setEditInvoice({
      id: invoice.id,
      team_id: invoice.team_id,
      items,
      due_date: invoice.due_date || '',
      notes: invoice.notes || '',
      tax_rate: taxRate,
      status: invoice.status || 'pending'
    });
    setEditDialogOpen(true);
  };

  const handleEditInvoice = async () => {
    if (!editInvoice.team_id || editInvoice.items.length === 0) {
      toast.error('Please select a client and add at least one item');
      return;
    }

    try {
      const subtotal = calculateEditSubtotal();
      const tax = calculateEditTax();
      const total = subtotal + tax;

      const { error } = await supabase
        .from('client_invoices')
        .update({
          team_id: editInvoice.team_id,
          items: editInvoice.items,
          amount: subtotal,
          tax_amount: tax,
          total_amount: total,
          due_date: editInvoice.due_date || null,
          notes: editInvoice.notes || null,
          status: editInvoice.status
        })
        .eq('id', editInvoice.id);

      if (error) throw error;

      toast.success('Invoice updated successfully');
      setEditDialogOpen(false);
      fetchData();
    } catch (error) {
      console.error('Error updating invoice:', error);
      toast.error('Failed to update invoice');
    }
  };

  const handleCreateInvoice = async () => {
    if (!newInvoice.team_id || newInvoice.items.length === 0) {
      toast.error('Please select a client and add at least one item');
      return;
    }

    try {
      // Generate invoice number
      const { data: invoiceNumber, error: numberError } = await supabase
        .rpc('generate_invoice_number');

      if (numberError) throw numberError;

      const subtotal = calculateSubtotal();
      const tax = calculateTax();
      const total = subtotal + tax;

      const { error } = await supabase
        .from('client_invoices')
        .insert({
          team_id: newInvoice.team_id,
          invoice_number: invoiceNumber,
          items: newInvoice.items,
          amount: subtotal,
          tax_amount: tax,
          total_amount: total,
          due_date: newInvoice.due_date || null,
          notes: newInvoice.notes || null,
          status: 'pending',
          currency: 'GBP'
        });

      if (error) throw error;

      toast.success(`Invoice ${invoiceNumber} created successfully`);
      setCreateDialogOpen(false);
      setNewInvoice({
        team_id: '',
        items: [],
        due_date: '',
        notes: '',
        tax_rate: 0
      });
      fetchData();
    } catch (error) {
      console.error('Error creating invoice:', error);
      toast.error('Failed to create invoice');
    }
  };

  const handleUpdateStatus = async (invoiceId: string, newStatus: string) => {
    try {
      const updateData: any = { status: newStatus };
      if (newStatus === 'paid') {
        updateData.paid_at = new Date().toISOString();
      }

      const { error } = await supabase
        .from('client_invoices')
        .update(updateData)
        .eq('id', invoiceId);

      if (error) throw error;
      toast.success(`Invoice marked as ${newStatus}`);
      fetchData();
      setViewDialogOpen(false);
    } catch (error) {
      console.error('Error updating invoice:', error);
      toast.error('Failed to update invoice');
    }
  };

  const handleDeleteInvoice = async (invoiceId: string) => {
    try {
      const { error } = await supabase
        .from('client_invoices')
        .delete()
        .eq('id', invoiceId);

      if (error) throw error;
      toast.success('Invoice deleted');
      fetchData();
      setViewDialogOpen(false);
    } catch (error) {
      console.error('Error deleting invoice:', error);
      toast.error('Failed to delete invoice');
    }
  };

  const handleDownloadPDF = async (invoice: Invoice) => {
    setDownloadingId(invoice.id);
    try {
      const clientName = getTeamName(invoice.team_id);
      const team = teams.find(t => t.id === invoice.team_id);

      // Get client email if available
      let clientEmail = '';
      if (team?.primary_account_id) {
        const { data: profile } = await supabase
          .from('profiles')
          .select('email')
          .eq('user_id', team.primary_account_id)
          .maybeSingle();
        clientEmail = profile?.email || '';
      }

      // Calculate tax rate from amounts
      const taxRate = invoice.tax_amount && invoice.amount > 0
        ? (invoice.tax_amount / invoice.amount) * 100
        : 0;

      await generateInvoicePDF({
        invoiceNumber: invoice.invoice_number,
        clientName,
        clientEmail,
        createdAt: invoice.created_at,
        dueDate: invoice.due_date,
        items: Array.isArray(invoice.items) ? invoice.items.map((item: any) => ({
          name: item.name || '',
          quantity: item.quantity || 1,
          price: item.price || 0
        })) : [],
        subtotal: invoice.amount,
        taxAmount: invoice.tax_amount,
        taxRate,
        totalAmount: invoice.total_amount,
        notes: invoice.notes,
        status: invoice.status,
        currency: invoice.currency || 'GBP',
        paidAt: invoice.paid_at
      });

      toast.success('Invoice PDF downloaded');
    } catch (error) {
      console.error('Error generating PDF:', error);
      toast.error('Failed to generate invoice PDF');
    } finally {
      setDownloadingId(null);
    }
  };

  /* Invoice statuses on the platform tone vocabulary — no hue map. */
  const getStatusTone = (status: string | null): Tone => {
    switch (status) {
      case 'paid': return 'ok';
      case 'sent': return 'accent';
      case 'awaiting_payment': return 'attend';
      case 'overdue': return 'risk';
      default: return 'neutral';
    }
  };

  const getStatusLabel = (status: string | null) => {
    switch (status) {
      case 'paid': return 'Paid';
      case 'sent': return 'Sent';
      case 'awaiting_payment': return 'Awaiting payment';
      case 'overdue': return 'Overdue';
      case 'draft': return 'Draft';
      case 'cancelled': return 'Cancelled';
      default: return 'Draft';
    }
  };

  // Stats
  const totalRevenue = invoices.filter(i => i.status === 'paid').reduce((sum, i) => sum + i.total_amount, 0);
  const awaitingAmount = invoices.filter(i => i.status === 'awaiting_payment' || i.status === 'sent').reduce((sum, i) => sum + i.total_amount, 0);
  const overdueAmount = invoices.filter(i => i.status === 'overdue').reduce((sum, i) => sum + i.total_amount, 0);
  const totalInvoices = invoices.length;

  const invoiceActions = (invoice: Invoice) => (
    <div className="flex items-center justify-end gap-1">
      <Button
        variant="ghost"
        size="icon"
        className="h-7 w-7"
        aria-label="View invoice"
        onClick={() => {
          setSelectedInvoice(invoice);
          setViewDialogOpen(true);
        }}
      >
        <Eye className="h-3.5 w-3.5" />
      </Button>
      <Button
        variant="ghost"
        size="icon"
        className="h-7 w-7"
        aria-label="Download PDF"
        onClick={() => handleDownloadPDF(invoice)}
        disabled={downloadingId === invoice.id}
      >
        {downloadingId === invoice.id ? (
          <Loader2 className="h-3.5 w-3.5 animate-spin" />
        ) : (
          <Download className="h-3.5 w-3.5" />
        )}
      </Button>
      <Button
        variant="ghost"
        size="icon"
        className="h-7 w-7"
        aria-label="Edit invoice"
        onClick={() => openEditDialog(invoice)}
      >
        <Edit className="h-3.5 w-3.5" />
      </Button>
      {invoice.status !== 'paid' && (
        <Button
          variant="ghost"
          size="icon"
          className="h-7 w-7 text-ok"
          aria-label="Mark as paid"
          onClick={() => handleUpdateStatus(invoice.id, 'paid')}
        >
          <CheckCircle2 className="h-3.5 w-3.5" />
        </Button>
      )}
    </div>
  );

  const columns: Column<Invoice>[] = [
    {
      key: 'number',
      header: 'Invoice',
      mono: true,
      sortValue: (i) => i.invoice_number,
      render: (i) => <span className="font-mono text-xs font-medium text-foreground">{i.invoice_number}</span>,
    },
    {
      key: 'client',
      header: 'Client',
      sortValue: (i) => getTeamName(i.team_id).toLowerCase(),
      render: (i) => <span className="text-[13px]">{getTeamName(i.team_id)}</span>,
    },
    {
      key: 'amount',
      header: 'Amount',
      align: 'right',
      mono: true,
      sortValue: (i) => i.total_amount,
      render: (i) => <Money value={i.total_amount} whole className="font-medium text-foreground" />,
    },
    {
      key: 'due',
      header: 'Due',
      hideBelowMd: true,
      mono: true,
      sortValue: (i) => i.due_date || '',
      render: (i) => (
        <span className="text-muted-foreground">
          {i.due_date ? format(new Date(i.due_date), 'dd MMM yyyy') : '·'}
        </span>
      ),
    },
    {
      key: 'status',
      header: 'Status',
      sortValue: (i) => i.status || 'draft',
      render: (i) => <StatusBadge tone={getStatusTone(i.status)} label={getStatusLabel(i.status)} />,
    },
    {
      key: 'created',
      header: 'Created',
      hideBelowMd: true,
      mono: true,
      sortValue: (i) => i.created_at,
      render: (i) => (
        <span className="text-muted-foreground">{format(new Date(i.created_at), 'dd MMM yyyy')}</span>
      ),
    },
    {
      key: 'actions',
      header: '',
      align: 'right',
      render: invoiceActions,
    },
  ];

  if (loading) {
    return (
      <div className="space-y-4" aria-busy>
        <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
          {Array.from({ length: 4 }, (_, i) => (
            <SkeletonBlock key={i} className="h-[64px] rounded-[10px]" />
          ))}
        </div>
        <Panel>
          <SkeletonTable cols={5} rows={6} />
        </Panel>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Stats Overview */}
      <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
        {[
          { label: 'Total invoices', value: <>{totalInvoices}</> },
          { label: 'Revenue, paid', value: <Money value={totalRevenue} whole /> },
          { label: 'Awaiting', value: <Money value={awaitingAmount} whole /> },
          { label: 'Overdue', value: <Money value={overdueAmount} whole />, risk: overdueAmount > 0 },
        ].map((s) => (
          <Panel key={s.label} className="p-3">
            <p className="truncate font-mono text-[10px] font-medium uppercase tracking-[0.14em] text-muted-foreground">{s.label}</p>
            <p className={`mt-1 text-[18px] font-semibold tabular-nums tracking-[-0.01em] ${s.risk ? 'text-risk' : 'text-foreground'}`}>{s.value}</p>
          </Panel>
        ))}
      </div>

      {/* Payment Trends Chart */}
      <PaymentTrendsChart invoices={invoices} loading={loading} />

      {/* Main Content */}
      <Card className="rounded-[10px] border-border/60 shadow-none">
        <CardHeader className="px-4 py-3">
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2 text-[15px] font-semibold tracking-[-0.01em]">
                <FileText className="h-4 w-4 text-muted-foreground" />
                All invoices
              </CardTitle>
              <CardDescription className="text-[12px]">
                Manage invoices for all clients
              </CardDescription>
            </div>
            <div className="flex gap-2">
              <Button variant="outline" size="sm" onClick={fetchData} className="h-8 gap-2 rounded-lg border-border/60 px-3 text-xs">
                <RefreshCw className="h-3.5 w-3.5" />
                Refresh
              </Button>
              <Dialog open={createDialogOpen} onOpenChange={setCreateDialogOpen}>
                <DialogTrigger asChild>
                  <Button size="sm" className="h-8 gap-2 rounded-lg px-3 text-xs">
                    <Plus className="h-3.5 w-3.5" />
                    Create invoice
                  </Button>
                </DialogTrigger>
                <DialogContent className="max-h-[90vh] w-[95vw] overflow-y-auto rounded-xl border-border/60 bg-card sm:max-w-2xl">
                  <DialogHeader>
                    <DialogTitle className="text-[15px] font-semibold tracking-[-0.01em]">Create new invoice</DialogTitle>
                    <DialogDescription className="text-[13px]">
                      Create an invoice for a client
                    </DialogDescription>
                  </DialogHeader>

                  <div className="space-y-5 py-4">
                    {/* Client Selection */}
                    <div className="space-y-2">
                      <Label className="font-mono text-[10px] font-medium uppercase tracking-[0.14em] text-muted-foreground">Client or team</Label>
                      <Select
                        value={newInvoice.team_id}
                        onValueChange={(v) => setNewInvoice(prev => ({ ...prev, team_id: v }))}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Select a client…" />
                        </SelectTrigger>
                        <SelectContent>
                          {teams.map((team) => (
                            <SelectItem key={team.id} value={team.id}>
                              <div className="flex items-center gap-2">
                                <Building2 className="h-4 w-4 text-muted-foreground" />
                                {team.team_name || team.team_code}
                              </div>
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    <Separator className="bg-border/60" />

                    {/* Invoice Items */}
                    <div className="space-y-3">
                      <Label className="font-mono text-[10px] font-medium uppercase tracking-[0.14em] text-muted-foreground">Invoice items</Label>

                      {newInvoice.items.length > 0 && (
                        <div className="mb-4 space-y-2">
                          {newInvoice.items.map((item, index) => (
                            <div key={index} className="flex h-10 items-center justify-between rounded-lg border border-border/60 bg-sunken px-3">
                              <div className="flex items-baseline gap-2">
                                <p className="text-[13px] font-medium">{item.name}</p>
                                <p className="font-mono text-[10.5px] tabular-nums text-muted-foreground">Qty {item.quantity}</p>
                              </div>
                              <div className="flex items-center gap-2">
                                <span className="font-mono text-[13px] font-semibold tabular-nums">£{(item.price * item.quantity).toFixed(2)}</span>
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  className="h-7 w-7 text-risk"
                                  aria-label="Remove item"
                                  onClick={() => removeItemFromInvoice(index)}
                                >
                                  <Trash2 className="h-3.5 w-3.5" />
                                </Button>
                              </div>
                            </div>
                          ))}
                        </div>
                      )}

                      <div className="flex gap-2">
                        <Input
                          placeholder="Item description…"
                          value={newItem.name}
                          onChange={(e) => setNewItem(prev => ({ ...prev, name: e.target.value }))}
                          className="flex-1"
                        />
                        <Input
                          type="number"
                          placeholder="Qty"
                          className="w-20 tabular-nums"
                          value={newItem.quantity}
                          onChange={(e) => setNewItem(prev => ({ ...prev, quantity: Number(e.target.value) }))}
                        />
                        <Input
                          type="number"
                          placeholder="Price"
                          className="w-28 tabular-nums"
                          value={newItem.price || ''}
                          onChange={(e) => setNewItem(prev => ({ ...prev, price: Number(e.target.value) }))}
                        />
                        <Button variant="outline" size="icon" aria-label="Add item" onClick={addItemToInvoice}>
                          <Plus className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>

                    <Separator className="bg-border/60" />

                    {/* Due Date & Tax */}
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label className="font-mono text-[10px] font-medium uppercase tracking-[0.14em] text-muted-foreground">Due date</Label>
                        <Input
                          type="date"
                          className="tabular-nums"
                          value={newInvoice.due_date}
                          onChange={(e) => setNewInvoice(prev => ({ ...prev, due_date: e.target.value }))}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label className="font-mono text-[10px] font-medium uppercase tracking-[0.14em] text-muted-foreground">Tax rate in %</Label>
                        <Input
                          type="number"
                          className="tabular-nums"
                          value={newInvoice.tax_rate}
                          onChange={(e) => setNewInvoice(prev => ({ ...prev, tax_rate: Number(e.target.value) }))}
                        />
                      </div>
                    </div>

                    {/* Notes */}
                    <div className="space-y-2">
                      <Label className="font-mono text-[10px] font-medium uppercase tracking-[0.14em] text-muted-foreground">Notes (optional)</Label>
                      <Textarea
                        value={newInvoice.notes}
                        onChange={(e) => setNewInvoice(prev => ({ ...prev, notes: e.target.value }))}
                        placeholder="Payment terms, additional info…"
                        rows={3}
                      />
                    </div>

                    {/* Totals */}
                    <div className="rounded-lg border border-border/60 bg-sunken p-3">
                      <div className="space-y-1.5">
                        <div className="flex justify-between text-[13px]">
                          <span className="text-muted-foreground">Subtotal</span>
                          <span className="font-mono tabular-nums">£{calculateSubtotal().toFixed(2)}</span>
                        </div>
                        {newInvoice.tax_rate > 0 && (
                          <div className="flex justify-between text-[13px]">
                            <span className="text-muted-foreground">Tax ({newInvoice.tax_rate}%)</span>
                            <span className="font-mono tabular-nums">£{calculateTax().toFixed(2)}</span>
                          </div>
                        )}
                        <Separator className="my-2 bg-border/60" />
                        <div className="flex justify-between text-[15px] font-semibold">
                          <span>Total</span>
                          <span className="font-mono tabular-nums">£{calculateTotal().toFixed(2)}</span>
                        </div>
                      </div>
                    </div>
                  </div>

                  <DialogFooter>
                    <Button variant="outline" className="h-8 rounded-lg px-3 text-xs" onClick={() => setCreateDialogOpen(false)}>
                      Cancel
                    </Button>
                    <Button onClick={handleCreateInvoice} className="h-8 gap-2 rounded-lg px-3 text-xs">
                      <FileText className="h-3.5 w-3.5" />
                      Create invoice
                    </Button>
                  </DialogFooter>
                </DialogContent>
              </Dialog>
            </div>
          </div>
        </CardHeader>
        <CardContent className="px-4 pb-4">
          {/* Filters */}
          <div className="mb-4 flex gap-3">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Search by invoice number or client…"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="h-8 pl-9 text-[13px]"
              />
            </div>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="h-8 w-40 text-[13px]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All statuses</SelectItem>
                <SelectItem value="draft">Draft</SelectItem>
                <SelectItem value="sent">Sent</SelectItem>
                <SelectItem value="awaiting_payment">Awaiting payment</SelectItem>
                <SelectItem value="paid">Paid</SelectItem>
                <SelectItem value="overdue">Overdue</SelectItem>
                <SelectItem value="cancelled">Cancelled</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Invoice Table */}
          <div className="rounded-lg border border-border/60">
            <DataTable
              rows={filteredInvoices}
              columns={columns}
              rowKey={(i) => i.id}
              aria-label="Invoices"
              defaultSort={{ key: 'created', dir: 'desc' }}
              empty={{
                title: 'No invoices found',
                body: invoices.length === 0
                  ? 'Create your first invoice to get started.'
                  : 'No invoices match your search criteria.',
              }}
              mobileCard={(invoice) => (
                <div className="flex items-center justify-between gap-3 px-3 py-3">
                  <div className="min-w-0">
                    <p className="truncate font-mono text-xs font-medium text-foreground">{invoice.invoice_number}</p>
                    <p className="truncate text-[11.5px] text-muted-foreground">{getTeamName(invoice.team_id)}</p>
                    <StatusBadge tone={getStatusTone(invoice.status)} label={getStatusLabel(invoice.status)} className="mt-1 text-[10.5px]" />
                  </div>
                  <div className="flex shrink-0 flex-col items-end gap-1">
                    <Money value={invoice.total_amount} whole className="font-mono text-[13px] font-semibold" />
                    {invoiceActions(invoice)}
                  </div>
                </div>
              )}
            />
          </div>
        </CardContent>
      </Card>

      {/* View Invoice Dialog */}
      <Dialog open={viewDialogOpen} onOpenChange={setViewDialogOpen}>
        <DialogContent className="w-[95vw] rounded-xl border-border/60 bg-card sm:max-w-2xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-[15px] font-semibold tracking-[-0.01em]">
              <FileText className="h-4 w-4 text-muted-foreground" />
              Invoice <span className="font-mono">{selectedInvoice?.invoice_number}</span>
            </DialogTitle>
            <DialogDescription className="text-[13px]">
              {selectedInvoice && getTeamName(selectedInvoice.team_id)}
            </DialogDescription>
          </DialogHeader>

          {selectedInvoice && (
            <div className="space-y-5 py-4">
              {/* Status & Dates */}
              <div className="flex items-center justify-between">
                <StatusBadge tone={getStatusTone(selectedInvoice.status)} label={getStatusLabel(selectedInvoice.status)} />
                <div className="text-right font-mono text-[11px] tabular-nums text-muted-foreground">
                  <p>Created {format(new Date(selectedInvoice.created_at), 'dd MMM yyyy')}</p>
                  {selectedInvoice.due_date && (
                    <p>Due {format(new Date(selectedInvoice.due_date), 'dd MMM yyyy')}</p>
                  )}
                </div>
              </div>

              <Separator className="bg-border/60" />

              {/* Items */}
              <div className="space-y-2">
                <Label className="font-mono text-[10px] font-medium uppercase tracking-[0.14em] text-muted-foreground">Items</Label>
                {Array.isArray(selectedInvoice.items) && selectedInvoice.items.map((item: any, index: number) => (
                  <div key={index} className="flex h-10 items-center justify-between rounded-lg border border-border/60 bg-sunken px-3">
                    <div className="flex items-baseline gap-2">
                      <p className="text-[13px] font-medium">{item.name}</p>
                      <p className="font-mono text-[10.5px] tabular-nums text-muted-foreground">Qty {item.quantity || 1}</p>
                    </div>
                    <span className="font-mono text-[13px] font-semibold tabular-nums">
                      £{((item.price || 0) * (item.quantity || 1)).toFixed(2)}
                    </span>
                  </div>
                ))}
              </div>

              {/* Totals */}
              <div className="rounded-lg border border-border/60 bg-sunken p-3">
                <div className="space-y-1.5">
                  <div className="flex justify-between text-[13px]">
                    <span className="text-muted-foreground">Subtotal</span>
                    <span className="font-mono tabular-nums">£{selectedInvoice.amount.toFixed(2)}</span>
                  </div>
                  {selectedInvoice.tax_amount && selectedInvoice.tax_amount > 0 && (
                    <div className="flex justify-between text-[13px]">
                      <span className="text-muted-foreground">Tax</span>
                      <span className="font-mono tabular-nums">£{selectedInvoice.tax_amount.toFixed(2)}</span>
                    </div>
                  )}
                  <Separator className="my-2 bg-border/60" />
                  <div className="flex justify-between text-[15px] font-semibold">
                    <span>Total</span>
                    <span className="font-mono tabular-nums">£{selectedInvoice.total_amount.toFixed(2)}</span>
                  </div>
                </div>
              </div>

              {selectedInvoice.notes && (
                <div>
                  <Label className="font-mono text-[10px] font-medium uppercase tracking-[0.14em] text-muted-foreground">Notes</Label>
                  <p className="mt-1 text-[13px] text-muted-foreground">{selectedInvoice.notes}</p>
                </div>
              )}
            </div>
          )}

          <DialogFooter className="flex-wrap gap-2 sm:flex-nowrap">
            <Button
              variant="outline"
              size="sm"
              className="h-8 rounded-lg border-border/60 px-3 text-xs text-risk hover:text-risk"
              onClick={() => selectedInvoice && setDeleteTarget(selectedInvoice)}
            >
              <Trash2 className="mr-2 h-3.5 w-3.5" />
              Delete
            </Button>
            <Button
              variant="outline"
              size="sm"
              className="h-8 rounded-lg border-border/60 px-3 text-xs"
              onClick={() => selectedInvoice && handleDownloadPDF(selectedInvoice)}
              disabled={downloadingId === selectedInvoice?.id}
            >
              {downloadingId === selectedInvoice?.id ? (
                <Loader2 className="mr-2 h-3.5 w-3.5 animate-spin" />
              ) : (
                <Download className="mr-2 h-3.5 w-3.5" />
              )}
              Download PDF
            </Button>
            <div className="flex-1" />
            {/* Status update dropdown */}
            <Select
              value={selectedInvoice?.status || 'draft'}
              onValueChange={(v) => selectedInvoice && handleUpdateStatus(selectedInvoice.id, v)}
            >
              <SelectTrigger className="h-8 w-[180px] text-xs">
                <SelectValue placeholder="Update status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="draft">Draft</SelectItem>
                <SelectItem value="sent">Sent</SelectItem>
                <SelectItem value="awaiting_payment">Awaiting payment</SelectItem>
                <SelectItem value="paid">Paid</SelectItem>
                <SelectItem value="overdue">Overdue</SelectItem>
                <SelectItem value="cancelled">Cancelled</SelectItem>
              </SelectContent>
            </Select>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete confirm */}
      <ConfirmDialog
        open={!!deleteTarget}
        onOpenChange={(o) => { if (!o) setDeleteTarget(null); }}
        title="Delete this invoice?"
        consequence={`This permanently deletes invoice ${deleteTarget?.invoice_number || ''} for ${deleteTarget ? getTeamName(deleteTarget.team_id) : ''}. It can't be undone.`}
        confirmLabel="Delete invoice"
        onConfirm={() => {
          if (deleteTarget) handleDeleteInvoice(deleteTarget.id);
          setDeleteTarget(null);
        }}
      />

      {/* Edit Invoice Dialog */}
      <Dialog open={editDialogOpen} onOpenChange={setEditDialogOpen}>
        <DialogContent className="max-h-[90vh] w-[95vw] overflow-y-auto rounded-xl border-border/60 bg-card sm:max-w-2xl">
          <DialogHeader>
            <DialogTitle className="text-[15px] font-semibold tracking-[-0.01em]">Edit invoice</DialogTitle>
            <DialogDescription className="text-[13px]">
              Update invoice details
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-5 py-4">
            {/* Client Selection */}
            <div className="space-y-2">
              <Label className="font-mono text-[10px] font-medium uppercase tracking-[0.14em] text-muted-foreground">Client or team</Label>
              <Select
                value={editInvoice.team_id}
                onValueChange={(v) => setEditInvoice(prev => ({ ...prev, team_id: v }))}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select a client…" />
                </SelectTrigger>
                <SelectContent>
                  {teams.map((team) => (
                    <SelectItem key={team.id} value={team.id}>
                      <div className="flex items-center gap-2">
                        <Building2 className="h-4 w-4 text-muted-foreground" />
                        {team.team_name || team.team_code}
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <Separator className="bg-border/60" />

            {/* Invoice Items */}
            <div className="space-y-3">
              <Label className="font-mono text-[10px] font-medium uppercase tracking-[0.14em] text-muted-foreground">Invoice items</Label>

              {editInvoice.items.length > 0 && (
                <div className="mb-4 space-y-2">
                  {editInvoice.items.map((item, index) => (
                    <div key={index} className="flex h-10 items-center justify-between rounded-lg border border-border/60 bg-sunken px-3">
                      <div className="flex items-baseline gap-2">
                        <p className="text-[13px] font-medium">{item.name}</p>
                        <p className="font-mono text-[10.5px] tabular-nums text-muted-foreground">Qty {item.quantity}</p>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="font-mono text-[13px] font-semibold tabular-nums">£{(item.price * item.quantity).toFixed(2)}</span>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-7 w-7 text-risk"
                          aria-label="Remove item"
                          onClick={() => removeItemFromEditInvoice(index)}
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              <div className="flex gap-2">
                <Input
                  placeholder="Item description…"
                  value={editItem.name}
                  onChange={(e) => setEditItem(prev => ({ ...prev, name: e.target.value }))}
                  className="flex-1"
                />
                <Input
                  type="number"
                  placeholder="Qty"
                  className="w-20 tabular-nums"
                  value={editItem.quantity}
                  onChange={(e) => setEditItem(prev => ({ ...prev, quantity: Number(e.target.value) }))}
                />
                <Input
                  type="number"
                  placeholder="Price"
                  className="w-28 tabular-nums"
                  value={editItem.price || ''}
                  onChange={(e) => setEditItem(prev => ({ ...prev, price: Number(e.target.value) }))}
                />
                <Button variant="outline" size="icon" aria-label="Add item" onClick={addItemToEditInvoice}>
                  <Plus className="h-4 w-4" />
                </Button>
              </div>
            </div>

            <Separator className="bg-border/60" />

            {/* Status, Due Date & Tax */}
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
              <div className="space-y-2">
                <Label className="font-mono text-[10px] font-medium uppercase tracking-[0.14em] text-muted-foreground">Status</Label>
                <Select
                  value={editInvoice.status}
                  onValueChange={(v) => setEditInvoice(prev => ({ ...prev, status: v }))}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="draft">Draft</SelectItem>
                    <SelectItem value="sent">Sent</SelectItem>
                    <SelectItem value="awaiting_payment">Awaiting payment</SelectItem>
                    <SelectItem value="paid">Paid</SelectItem>
                    <SelectItem value="overdue">Overdue</SelectItem>
                    <SelectItem value="cancelled">Cancelled</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label className="font-mono text-[10px] font-medium uppercase tracking-[0.14em] text-muted-foreground">Due date</Label>
                <Input
                  type="date"
                  className="tabular-nums"
                  value={editInvoice.due_date}
                  onChange={(e) => setEditInvoice(prev => ({ ...prev, due_date: e.target.value }))}
                />
              </div>
              <div className="space-y-2">
                <Label className="font-mono text-[10px] font-medium uppercase tracking-[0.14em] text-muted-foreground">Tax rate in %</Label>
                <Input
                  type="number"
                  className="tabular-nums"
                  value={editInvoice.tax_rate}
                  onChange={(e) => setEditInvoice(prev => ({ ...prev, tax_rate: Number(e.target.value) }))}
                />
              </div>
            </div>

            {/* Notes */}
            <div className="space-y-2">
              <Label className="font-mono text-[10px] font-medium uppercase tracking-[0.14em] text-muted-foreground">Notes (optional)</Label>
              <Textarea
                value={editInvoice.notes}
                onChange={(e) => setEditInvoice(prev => ({ ...prev, notes: e.target.value }))}
                placeholder="Payment terms, additional info…"
                rows={3}
              />
            </div>

            {/* Totals */}
            <div className="rounded-lg border border-border/60 bg-sunken p-3">
              <div className="space-y-1.5">
                <div className="flex justify-between text-[13px]">
                  <span className="text-muted-foreground">Subtotal</span>
                  <span className="font-mono tabular-nums">£{calculateEditSubtotal().toFixed(2)}</span>
                </div>
                {editInvoice.tax_rate > 0 && (
                  <div className="flex justify-between text-[13px]">
                    <span className="text-muted-foreground">Tax ({editInvoice.tax_rate}%)</span>
                    <span className="font-mono tabular-nums">£{calculateEditTax().toFixed(2)}</span>
                  </div>
                )}
                <Separator className="my-2 bg-border/60" />
                <div className="flex justify-between text-[15px] font-semibold">
                  <span>Total</span>
                  <span className="font-mono tabular-nums">£{calculateEditTotal().toFixed(2)}</span>
                </div>
              </div>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" className="h-8 rounded-lg px-3 text-xs" onClick={() => setEditDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleEditInvoice} className="h-8 gap-2 rounded-lg px-3 text-xs">
              <Edit className="h-3.5 w-3.5" />
              Save changes
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default AdminInvoices;
