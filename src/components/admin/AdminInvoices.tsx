import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { 
  FileText, 
  Search, 
  Plus, 
  Edit, 
  CheckCircle2, 
  Clock,
  AlertCircle,
  Send,
  Download,
  Eye,
  Trash2,
  DollarSign,
  Calendar,
  Building2,
  RefreshCw,
  Loader2
} from 'lucide-react';
import { format } from 'date-fns';
import { generateInvoicePDF } from '@/lib/invoicePdfGenerator';
import PaymentTrendsChart from './PaymentTrendsChart';

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
    return team?.team_name || team?.team_code || 'Unknown Team';
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
    if (!confirm('Are you sure you want to delete this invoice?')) return;

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

  const getStatusColor = (status: string | null) => {
    switch (status) {
      case 'paid': return 'bg-green-500/10 text-green-600 dark:text-green-400 border-green-500/20';
      case 'sent': return 'bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-500/20';
      case 'awaiting_payment': return 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20';
      case 'overdue': return 'bg-red-500/10 text-red-600 dark:text-red-400 border-red-500/20';
      case 'draft': return 'bg-muted text-muted-foreground';
      case 'cancelled': return 'bg-gray-500/10 text-gray-600 dark:text-gray-400 border-gray-500/20';
      default: return 'bg-muted text-muted-foreground';
    }
  };

  const getStatusIcon = (status: string | null) => {
    switch (status) {
      case 'paid': return <CheckCircle2 className="h-3 w-3" />;
      case 'sent': return <Send className="h-3 w-3" />;
      case 'awaiting_payment': return <Clock className="h-3 w-3" />;
      case 'overdue': return <AlertCircle className="h-3 w-3" />;
      default: return null;
    }
  };

  const getStatusLabel = (status: string | null) => {
    switch (status) {
      case 'paid': return 'Paid';
      case 'sent': return 'Sent';
      case 'awaiting_payment': return 'Awaiting Payment';
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

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Stats Overview */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-4 pb-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-primary/10 rounded-lg">
                <FileText className="h-5 w-5 text-primary" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Total Invoices</p>
                <p className="text-2xl font-bold">{totalInvoices}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4 pb-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-green-500/10 rounded-lg">
                <DollarSign className="h-5 w-5 text-green-600" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Revenue (Paid)</p>
                <p className="text-2xl font-bold">£{totalRevenue.toLocaleString()}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4 pb-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-amber-500/10 rounded-lg">
                <Clock className="h-5 w-5 text-amber-600" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Awaiting</p>
                <p className="text-2xl font-bold">£{awaitingAmount.toLocaleString()}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4 pb-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-red-500/10 rounded-lg">
                <AlertCircle className="h-5 w-5 text-red-600" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Overdue</p>
                <p className="text-2xl font-bold">£{overdueAmount.toLocaleString()}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Payment Trends Chart */}
      <PaymentTrendsChart invoices={invoices} loading={loading} />

      {/* Main Content */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <FileText className="h-5 w-5" />
                All Invoices
              </CardTitle>
              <CardDescription>
                Manage invoices for all clients
              </CardDescription>
            </div>
            <div className="flex gap-2">
              <Button variant="outline" size="sm" onClick={fetchData} className="gap-2">
                <RefreshCw className="h-4 w-4" />
                Refresh
              </Button>
              <Dialog open={createDialogOpen} onOpenChange={setCreateDialogOpen}>
                <DialogTrigger asChild>
                  <Button size="sm" className="gap-2">
                    <Plus className="h-4 w-4" />
                    Create Invoice
                  </Button>
                </DialogTrigger>
                <DialogContent className="w-[95vw] sm:max-w-2xl max-h-[90vh] overflow-y-auto">
                  <DialogHeader>
                    <DialogTitle>Create New Invoice</DialogTitle>
                    <DialogDescription>
                      Create an invoice for a client
                    </DialogDescription>
                  </DialogHeader>
                  
                  <div className="space-y-6 py-4">
                    {/* Client Selection */}
                    <div className="space-y-2">
                      <Label>Client / Team</Label>
                      <Select 
                        value={newInvoice.team_id} 
                        onValueChange={(v) => setNewInvoice(prev => ({ ...prev, team_id: v }))}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Select a client..." />
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

                    <Separator />

                    {/* Invoice Items */}
                    <div className="space-y-3">
                      <Label>Invoice Items</Label>
                      
                      {newInvoice.items.length > 0 && (
                        <div className="space-y-2 mb-4">
                          {newInvoice.items.map((item, index) => (
                            <div key={index} className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
                              <div>
                                <p className="font-medium">{item.name}</p>
                                <p className="text-sm text-muted-foreground">Qty: {item.quantity}</p>
                              </div>
                              <div className="flex items-center gap-3">
                                <span className="font-semibold">£{(item.price * item.quantity).toFixed(2)}</span>
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  className="h-8 w-8 text-destructive"
                                  onClick={() => removeItemFromInvoice(index)}
                                >
                                  <Trash2 className="h-4 w-4" />
                                </Button>
                              </div>
                            </div>
                          ))}
                        </div>
                      )}

                      <div className="flex gap-2">
                        <Input
                          placeholder="Item description..."
                          value={newItem.name}
                          onChange={(e) => setNewItem(prev => ({ ...prev, name: e.target.value }))}
                          className="flex-1"
                        />
                        <Input
                          type="number"
                          placeholder="Qty"
                          className="w-20"
                          value={newItem.quantity}
                          onChange={(e) => setNewItem(prev => ({ ...prev, quantity: Number(e.target.value) }))}
                        />
                        <Input
                          type="number"
                          placeholder="Price"
                          className="w-28"
                          value={newItem.price || ''}
                          onChange={(e) => setNewItem(prev => ({ ...prev, price: Number(e.target.value) }))}
                        />
                        <Button variant="outline" size="icon" onClick={addItemToInvoice}>
                          <Plus className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>

                    <Separator />

                    {/* Due Date & Tax */}
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label>Due Date</Label>
                        <Input
                          type="date"
                          value={newInvoice.due_date}
                          onChange={(e) => setNewInvoice(prev => ({ ...prev, due_date: e.target.value }))}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label>Tax Rate (%)</Label>
                        <Input
                          type="number"
                          value={newInvoice.tax_rate}
                          onChange={(e) => setNewInvoice(prev => ({ ...prev, tax_rate: Number(e.target.value) }))}
                        />
                      </div>
                    </div>

                    {/* Notes */}
                    <div className="space-y-2">
                      <Label>Notes (optional)</Label>
                      <Textarea
                        value={newInvoice.notes}
                        onChange={(e) => setNewInvoice(prev => ({ ...prev, notes: e.target.value }))}
                        placeholder="Payment terms, additional info..."
                        rows={3}
                      />
                    </div>

                    {/* Totals */}
                    <Card className="bg-muted/30">
                      <CardContent className="pt-4">
                        <div className="space-y-2">
                          <div className="flex justify-between text-sm">
                            <span>Subtotal</span>
                            <span>£{calculateSubtotal().toFixed(2)}</span>
                          </div>
                          {newInvoice.tax_rate > 0 && (
                            <div className="flex justify-between text-sm">
                              <span>Tax ({newInvoice.tax_rate}%)</span>
                              <span>£{calculateTax().toFixed(2)}</span>
                            </div>
                          )}
                          <Separator className="my-2" />
                          <div className="flex justify-between font-bold text-lg">
                            <span>Total</span>
                            <span>£{calculateTotal().toFixed(2)}</span>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  </div>

                  <DialogFooter>
                    <Button variant="outline" onClick={() => setCreateDialogOpen(false)}>
                      Cancel
                    </Button>
                    <Button onClick={handleCreateInvoice} className="gap-2">
                      <FileText className="h-4 w-4" />
                      Create Invoice
                    </Button>
                  </DialogFooter>
                </DialogContent>
              </Dialog>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {/* Filters */}
          <div className="flex gap-4 mb-6">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search by invoice number or client..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-9"
              />
            </div>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-40">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Statuses</SelectItem>
                <SelectItem value="draft">Draft</SelectItem>
                <SelectItem value="sent">Sent</SelectItem>
                <SelectItem value="awaiting_payment">Awaiting Payment</SelectItem>
                <SelectItem value="paid">Paid</SelectItem>
                <SelectItem value="overdue">Overdue</SelectItem>
                <SelectItem value="cancelled">Cancelled</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Invoice Table */}
          {filteredInvoices.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <FileText className="h-12 w-12 text-muted-foreground mb-4" />
              <h3 className="text-lg font-semibold mb-2">No Invoices Found</h3>
              <p className="text-muted-foreground max-w-md">
                {invoices.length === 0 
                  ? "Create your first invoice to get started."
                  : "No invoices match your search criteria."}
              </p>
            </div>
          ) : (
            <div className="border rounded-lg">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Invoice #</TableHead>
                    <TableHead>Client</TableHead>
                    <TableHead>Amount</TableHead>
                    <TableHead>Due Date</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Created</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredInvoices.map((invoice) => (
                    <TableRow key={invoice.id}>
                      <TableCell className="font-medium">{invoice.invoice_number}</TableCell>
                      <TableCell>{getTeamName(invoice.team_id)}</TableCell>
                      <TableCell className="font-semibold">£{invoice.total_amount.toLocaleString()}</TableCell>
                      <TableCell>
                        {invoice.due_date 
                          ? format(new Date(invoice.due_date), 'dd MMM yyyy')
                          : '-'}
                      </TableCell>
                      <TableCell>
                        <Badge className={`gap-1 ${getStatusColor(invoice.status)}`}>
                          {getStatusIcon(invoice.status)}
                          {getStatusLabel(invoice.status)}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-muted-foreground">
                        {format(new Date(invoice.created_at), 'dd MMM yyyy')}
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex items-center justify-end gap-1">
                          <Button 
                            variant="ghost" 
                            size="icon" 
                            className="h-8 w-8"
                            onClick={() => {
                              setSelectedInvoice(invoice);
                              setViewDialogOpen(true);
                            }}
                          >
                            <Eye className="h-4 w-4" />
                          </Button>
                          <Button 
                            variant="ghost" 
                            size="icon" 
                            className="h-8 w-8"
                            onClick={() => handleDownloadPDF(invoice)}
                            disabled={downloadingId === invoice.id}
                          >
                            {downloadingId === invoice.id ? (
                              <Loader2 className="h-4 w-4 animate-spin" />
                            ) : (
                              <Download className="h-4 w-4" />
                            )}
                          </Button>
                          <Button 
                            variant="ghost" 
                            size="icon" 
                            className="h-8 w-8"
                            onClick={() => openEditDialog(invoice)}
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                          {invoice.status !== 'paid' && (
                            <Button 
                              variant="ghost" 
                              size="icon" 
                              className="h-8 w-8 text-green-600"
                              onClick={() => handleUpdateStatus(invoice.id, 'paid')}
                            >
                              <CheckCircle2 className="h-4 w-4" />
                            </Button>
                          )}
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* View Invoice Dialog */}
      <Dialog open={viewDialogOpen} onOpenChange={setViewDialogOpen}>
        <DialogContent className="w-[95vw] sm:max-w-2xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <FileText className="h-5 w-5" />
              Invoice {selectedInvoice?.invoice_number}
            </DialogTitle>
            <DialogDescription>
              {selectedInvoice && getTeamName(selectedInvoice.team_id)}
            </DialogDescription>
          </DialogHeader>

          {selectedInvoice && (
            <div className="space-y-6 py-4">
              {/* Status & Dates */}
              <div className="flex items-center justify-between">
                <Badge className={`gap-1 ${getStatusColor(selectedInvoice.status)}`}>
                  {getStatusIcon(selectedInvoice.status)}
                  {getStatusLabel(selectedInvoice.status)}
                </Badge>
                <div className="text-sm text-muted-foreground">
                  <p>Created: {format(new Date(selectedInvoice.created_at), 'dd MMM yyyy')}</p>
                  {selectedInvoice.due_date && (
                    <p>Due: {format(new Date(selectedInvoice.due_date), 'dd MMM yyyy')}</p>
                  )}
                </div>
              </div>

              <Separator />

              {/* Items */}
              <div className="space-y-3">
                <Label>Items</Label>
                {Array.isArray(selectedInvoice.items) && selectedInvoice.items.map((item: any, index: number) => (
                  <div key={index} className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
                    <div>
                      <p className="font-medium">{item.name}</p>
                      <p className="text-sm text-muted-foreground">Qty: {item.quantity || 1}</p>
                    </div>
                    <span className="font-semibold">
                      £{((item.price || 0) * (item.quantity || 1)).toFixed(2)}
                    </span>
                  </div>
                ))}
              </div>

              {/* Totals */}
              <Card className="bg-muted/30">
                <CardContent className="pt-4">
                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span>Subtotal</span>
                      <span>£{selectedInvoice.amount.toFixed(2)}</span>
                    </div>
                    {selectedInvoice.tax_amount && selectedInvoice.tax_amount > 0 && (
                      <div className="flex justify-between text-sm">
                        <span>Tax</span>
                        <span>£{selectedInvoice.tax_amount.toFixed(2)}</span>
                      </div>
                    )}
                    <Separator className="my-2" />
                    <div className="flex justify-between font-bold text-lg">
                      <span>Total</span>
                      <span>£{selectedInvoice.total_amount.toFixed(2)}</span>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {selectedInvoice.notes && (
                <div>
                  <Label>Notes</Label>
                  <p className="text-sm text-muted-foreground mt-1">{selectedInvoice.notes}</p>
                </div>
              )}
            </div>
          )}

          <DialogFooter className="gap-2 flex-wrap sm:flex-nowrap">
            <Button 
              variant="destructive" 
              size="sm" 
              onClick={() => selectedInvoice && handleDeleteInvoice(selectedInvoice.id)}
            >
              <Trash2 className="h-4 w-4 mr-2" />
              Delete
            </Button>
            <Button 
              variant="outline" 
              size="sm"
              onClick={() => selectedInvoice && handleDownloadPDF(selectedInvoice)}
              disabled={downloadingId === selectedInvoice?.id}
            >
              {downloadingId === selectedInvoice?.id ? (
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              ) : (
                <Download className="h-4 w-4 mr-2" />
              )}
              Download PDF
            </Button>
            <div className="flex-1" />
            {/* Status update dropdown */}
            <Select 
              value={selectedInvoice?.status || 'draft'} 
              onValueChange={(v) => selectedInvoice && handleUpdateStatus(selectedInvoice.id, v)}
            >
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Update status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="draft">Draft</SelectItem>
                <SelectItem value="sent">Sent</SelectItem>
                <SelectItem value="awaiting_payment">Awaiting Payment</SelectItem>
                <SelectItem value="paid">Paid</SelectItem>
                <SelectItem value="overdue">Overdue</SelectItem>
                <SelectItem value="cancelled">Cancelled</SelectItem>
              </SelectContent>
            </Select>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit Invoice Dialog */}
      <Dialog open={editDialogOpen} onOpenChange={setEditDialogOpen}>
        <DialogContent className="w-[95vw] sm:max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Edit Invoice</DialogTitle>
            <DialogDescription>
              Update invoice details
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-6 py-4">
            {/* Client Selection */}
            <div className="space-y-2">
              <Label>Client / Team</Label>
              <Select 
                value={editInvoice.team_id} 
                onValueChange={(v) => setEditInvoice(prev => ({ ...prev, team_id: v }))}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select a client..." />
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

            <Separator />

            {/* Invoice Items */}
            <div className="space-y-3">
              <Label>Invoice Items</Label>
              
              {editInvoice.items.length > 0 && (
                <div className="space-y-2 mb-4">
                  {editInvoice.items.map((item, index) => (
                    <div key={index} className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
                      <div>
                        <p className="font-medium">{item.name}</p>
                        <p className="text-sm text-muted-foreground">Qty: {item.quantity}</p>
                      </div>
                      <div className="flex items-center gap-3">
                        <span className="font-semibold">£{(item.price * item.quantity).toFixed(2)}</span>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 text-destructive"
                          onClick={() => removeItemFromEditInvoice(index)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              <div className="flex gap-2">
                <Input
                  placeholder="Item description..."
                  value={editItem.name}
                  onChange={(e) => setEditItem(prev => ({ ...prev, name: e.target.value }))}
                  className="flex-1"
                />
                <Input
                  type="number"
                  placeholder="Qty"
                  className="w-20"
                  value={editItem.quantity}
                  onChange={(e) => setEditItem(prev => ({ ...prev, quantity: Number(e.target.value) }))}
                />
                <Input
                  type="number"
                  placeholder="Price"
                  className="w-28"
                  value={editItem.price || ''}
                  onChange={(e) => setEditItem(prev => ({ ...prev, price: Number(e.target.value) }))}
                />
                <Button variant="outline" size="icon" onClick={addItemToEditInvoice}>
                  <Plus className="h-4 w-4" />
                </Button>
              </div>
            </div>

            <Separator />

            {/* Status, Due Date & Tax */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label>Status</Label>
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
                    <SelectItem value="awaiting_payment">Awaiting Payment</SelectItem>
                    <SelectItem value="paid">Paid</SelectItem>
                    <SelectItem value="overdue">Overdue</SelectItem>
                    <SelectItem value="cancelled">Cancelled</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Due Date</Label>
                <Input
                  type="date"
                  value={editInvoice.due_date}
                  onChange={(e) => setEditInvoice(prev => ({ ...prev, due_date: e.target.value }))}
                />
              </div>
              <div className="space-y-2">
                <Label>Tax Rate (%)</Label>
                <Input
                  type="number"
                  value={editInvoice.tax_rate}
                  onChange={(e) => setEditInvoice(prev => ({ ...prev, tax_rate: Number(e.target.value) }))}
                />
              </div>
            </div>

            {/* Notes */}
            <div className="space-y-2">
              <Label>Notes (optional)</Label>
              <Textarea
                value={editInvoice.notes}
                onChange={(e) => setEditInvoice(prev => ({ ...prev, notes: e.target.value }))}
                placeholder="Payment terms, additional info..."
                rows={3}
              />
            </div>

            {/* Totals */}
            <Card className="bg-muted/30">
              <CardContent className="pt-4">
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span>Subtotal</span>
                    <span>£{calculateEditSubtotal().toFixed(2)}</span>
                  </div>
                  {editInvoice.tax_rate > 0 && (
                    <div className="flex justify-between text-sm">
                      <span>Tax ({editInvoice.tax_rate}%)</span>
                      <span>£{calculateEditTax().toFixed(2)}</span>
                    </div>
                  )}
                  <Separator className="my-2" />
                  <div className="flex justify-between font-bold text-lg">
                    <span>Total</span>
                    <span>£{calculateEditTotal().toFixed(2)}</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setEditDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleEditInvoice} className="gap-2">
              <Edit className="h-4 w-4" />
              Save Changes
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default AdminInvoices;
