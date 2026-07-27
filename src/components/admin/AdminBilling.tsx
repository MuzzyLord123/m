import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Switch } from '@/components/ui/switch';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { 
  CreditCard, 
  Search, 
  Plus, 
  Edit, 
  CheckCircle2, 
  Clock,
  AlertCircle,
  Users,
  TrendingUp,
  Send,
  Globe,
  Megaphone,
  Share2,
  Sparkles,
  Mail,
  FileText,
  DollarSign,
  ShoppingCart
} from 'lucide-react';
import { format } from 'date-fns';
import InvoiceManager from '@/components/billing/InvoiceManager';

interface Profile {
  id: string;
  user_id: string;
  full_name: string | null;
  email: string | null;
  company: string | null;
  customer_id: string | null;
}

interface BillingData {
  id: string;
  user_id: string;
  plan_name: string;
  plan_price: number;
  billing_cycle: string;
  services: { name: string; included: boolean }[];
  add_ons: { name: string; price: number; active: boolean }[];
  one_off_charges: { name: string; price: number; date: string; paid: boolean }[];
  next_billing_date: string | null;
  payment_status: string;
  notes: string | null;
  created_at: string;
}

const PLAN_OPTIONS = [
  { name: 'Starter', price: 49 },
  { name: 'Professional', price: 149 },
  { name: 'Growth', price: 299 },
  { name: 'Enterprise', price: 599 },
  { name: 'Custom Elite', price: 0 }
];

const AVAILABLE_ADDONS = [
  { id: 'ad-management', name: 'Ad Management', price: 199, icon: Megaphone },
  { id: 'social-media', name: 'Social Media Management', price: 149, icon: Share2 },
  { id: 'seo', name: 'SEO Strategy', price: 199, icon: Search },
  { id: 'branding', name: 'Branding & Design', price: 99, icon: Sparkles },
  { id: 'support-plus', name: 'Priority Support', price: 49, icon: CreditCard }
];

const DEFAULT_SERVICES = [
  'Website Hosting',
  'SSL Certificate',
  'Monthly Updates (2)',
  'Email Support',
  '24/7 Uptime Monitoring',
  'Weekly Backups',
  'SEO Basics',
  'Analytics Dashboard'
];

const AdminBilling = () => {
  const [clients, setClients] = useState<Profile[]>([]);
  const [billingRecords, setBillingRecords] = useState<BillingData[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedClient, setSelectedClient] = useState<Profile | null>(null);
  const [selectedBilling, setSelectedBilling] = useState<BillingData | null>(null);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [addChargeDialogOpen, setAddChargeDialogOpen] = useState(false);
  const [invoiceDialogOpen, setInvoiceDialogOpen] = useState(false);

  const [formData, setFormData] = useState({
    plan_name: 'Starter',
    plan_price: 49,
    billing_cycle: 'monthly',
    next_billing_date: '',
    payment_status: 'pending',
    notes: '',
    selectedAddons: new Set<string>()
  });

  const [newCharge, setNewCharge] = useState({ name: '', price: 0, date: '', paid: false });

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const [clientsRes, billingRes] = await Promise.all([
        supabase.from('profiles').select('*').order('full_name'),
        supabase.from('client_billing').select('*')
      ]);

      if (clientsRes.error) throw clientsRes.error;
      if (billingRes.error) throw billingRes.error;

      setClients(clientsRes.data || []);
      setBillingRecords((billingRes.data || []).map(b => ({
        ...b,
        services: (b.services as { name: string; included: boolean }[]) || [],
        add_ons: (b.add_ons as { name: string; price: number; active: boolean }[]) || [],
        one_off_charges: (b.one_off_charges as { name: string; price: number; date: string; paid: boolean }[]) || []
      })));
    } catch (error) {
      console.error('Error fetching data:', error);
      toast.error('Failed to load data');
    } finally {
      setLoading(false);
    }
  };

  const filteredClients = clients.filter(client => {
    const search = searchTerm.toLowerCase();
    return (
      client.full_name?.toLowerCase().includes(search) ||
      client.email?.toLowerCase().includes(search) ||
      client.company?.toLowerCase().includes(search) ||
      client.customer_id?.toLowerCase().includes(search)
    );
  });

  const getClientBilling = (userId: string) => {
    return billingRecords.find(b => b.user_id === userId);
  };

  const handleSelectClient = (client: Profile) => {
    setSelectedClient(client);
    const billing = getClientBilling(client.user_id);
    if (billing) {
      setSelectedBilling(billing);
      
      // Extract active addon IDs
      const activeAddonIds = new Set<string>();
      billing.add_ons.forEach(addon => {
        const match = AVAILABLE_ADDONS.find(a => a.name === addon.name);
        if (match && addon.active) {
          activeAddonIds.add(match.id);
        }
      });
      
      setFormData({
        plan_name: billing.plan_name,
        plan_price: billing.plan_price,
        billing_cycle: billing.billing_cycle,
        next_billing_date: billing.next_billing_date || '',
        payment_status: billing.payment_status,
        notes: billing.notes || '',
        selectedAddons: activeAddonIds
      });
    } else {
      setSelectedBilling(null);
      setFormData({
        plan_name: 'Starter',
        plan_price: 49,
        billing_cycle: 'monthly',
        next_billing_date: '',
        payment_status: 'pending',
        notes: '',
        selectedAddons: new Set()
      });
    }
  };

  const handlePlanChange = (planName: string) => {
    const plan = PLAN_OPTIONS.find(p => p.name === planName);
    setFormData(prev => ({
      ...prev,
      plan_name: planName,
      plan_price: plan?.price || 0
    }));
  };

  const toggleAddon = (addonId: string) => {
    setFormData(prev => {
      const next = new Set(prev.selectedAddons);
      if (next.has(addonId)) {
        next.delete(addonId);
      } else {
        next.add(addonId);
      }
      return { ...prev, selectedAddons: next };
    });
  };

  const handleSaveBilling = async () => {
    if (!selectedClient) return;

    try {
      const services = DEFAULT_SERVICES.map(name => ({ name, included: true }));
      const addons = Array.from(formData.selectedAddons).map(id => {
        const addon = AVAILABLE_ADDONS.find(a => a.id === id)!;
        return { name: addon.name, price: addon.price, active: true };
      });
      
      if (selectedBilling) {
        const { error } = await supabase
          .from('client_billing')
          .update({
            plan_name: formData.plan_name,
            plan_price: formData.plan_price,
            billing_cycle: formData.billing_cycle,
            next_billing_date: formData.next_billing_date || null,
            payment_status: formData.payment_status,
            notes: formData.notes || null,
            add_ons: addons
          })
          .eq('id', selectedBilling.id);

        if (error) throw error;
        toast.success('Billing updated successfully');
      } else {
        const { error } = await supabase
          .from('client_billing')
          .insert({
            user_id: selectedClient.user_id,
            plan_name: formData.plan_name,
            plan_price: formData.plan_price,
            billing_cycle: formData.billing_cycle,
            services,
            add_ons: addons,
            one_off_charges: [],
            next_billing_date: formData.next_billing_date || null,
            payment_status: formData.payment_status,
            notes: formData.notes || null
          });

        if (error) throw error;
        toast.success('Billing created successfully');
      }

      setDialogOpen(false);
      fetchData();
    } catch (error) {
      console.error('Error saving billing:', error);
      toast.error('Failed to save billing');
    }
  };

  const handleAddCharge = async () => {
    if (!selectedBilling || !newCharge.name) return;

    try {
      const updatedCharges = [
        ...selectedBilling.one_off_charges,
        { ...newCharge, date: newCharge.date || new Date().toISOString().split('T')[0] }
      ];

      const { error } = await supabase
        .from('client_billing')
        .update({ 
          one_off_charges: updatedCharges,
          payment_status: 'pending' // Set to pending when adding new charge
        })
        .eq('id', selectedBilling.id);

      if (error) throw error;
      
      toast.success('Charge added - client will see it in their payment portal');
      setAddChargeDialogOpen(false);
      setNewCharge({ name: '', price: 0, date: '', paid: false });
      fetchData();
    } catch (error) {
      console.error('Error adding charge:', error);
      toast.error('Failed to add charge');
    }
  };

  const handleToggleChargePaid = async (chargeIndex: number) => {
    if (!selectedBilling) return;

    try {
      const updatedCharges = selectedBilling.one_off_charges.map((c, i) => 
        i === chargeIndex ? { ...c, paid: !c.paid } : c
      );

      const { error } = await supabase
        .from('client_billing')
        .update({ one_off_charges: updatedCharges })
        .eq('id', selectedBilling.id);

      if (error) throw error;
      fetchData();
    } catch (error) {
      console.error('Error updating charge:', error);
      toast.error('Failed to update charge');
    }
  };

  const handleSendPaymentRequest = async () => {
    if (!selectedClient || !selectedBilling) return;
    
    // Update status to pending to trigger payment request
    try {
      const { error } = await supabase
        .from('client_billing')
        .update({ payment_status: 'pending' })
        .eq('id', selectedBilling.id);

      if (error) throw error;
      toast.success(`Payment request sent to ${selectedClient.email}`);
      fetchData();
    } catch (error) {
      console.error('Error sending payment request:', error);
      toast.error('Failed to send payment request');
    }
  };

  const handleMarkAsPaid = async () => {
    if (!selectedBilling) return;

    try {
      // Mark all one-off charges as paid too
      const updatedCharges = selectedBilling.one_off_charges.map(c => ({ ...c, paid: true }));

      const { error } = await supabase
        .from('client_billing')
        .update({ 
          payment_status: 'paid',
          one_off_charges: updatedCharges
        })
        .eq('id', selectedBilling.id);

      if (error) throw error;
      toast.success('Payment marked as complete');
      fetchData();
    } catch (error) {
      console.error('Error updating payment:', error);
      toast.error('Failed to update payment status');
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'paid': return 'bg-green-500/10 text-green-600 dark:text-green-400 border-green-500/20';
      case 'pending': return 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20';
      case 'overdue': return 'bg-red-500/10 text-red-600 dark:text-red-400 border-red-500/20';
      default: return 'bg-muted text-muted-foreground';
    }
  };

  // Summary stats
  const totalMonthlyRevenue = billingRecords.reduce((sum, b) => {
    const addonTotal = b.add_ons.filter(a => a.active).reduce((s, a) => s + a.price, 0);
    return sum + b.plan_price + addonTotal;
  }, 0);
  const paidClients = billingRecords.filter(b => b.payment_status === 'paid').length;
  const pendingPayments = billingRecords.filter(b => b.payment_status === 'pending').length;
  
  // Total revenue from all paid one-off charges
  const totalRevenueMade = billingRecords.reduce((sum, b) => {
    const paidCharges = b.one_off_charges.filter(c => c.paid).reduce((s, c) => s + c.price, 0);
    return sum + paidCharges;
  }, 0);
  
  // Clients with items in cart (pending status with items)
  const clientsWithCart = billingRecords.filter(b => 
    b.payment_status === 'pending' && 
    (b.one_off_charges.some(c => !c.paid) || b.plan_price > 0)
  );

  // Calculate selected client totals
  const clientMonthlyTotal = selectedBilling 
    ? selectedBilling.plan_price + selectedBilling.add_ons.filter(a => a.active).reduce((s, a) => s + a.price, 0)
    : 0;
  const clientPendingCharges = selectedBilling?.one_off_charges.filter(c => !c.paid) || [];
  const clientPendingTotal = clientPendingCharges.reduce((s, c) => s + c.price, 0);

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
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
        <Card>
          <CardContent className="pt-4 pb-4">
            <div className="flex items-center gap-2">
              <div className="p-1.5 bg-primary/10 rounded-lg">
                <Users className="h-4 w-4 text-primary" />
              </div>
              <div className="min-w-0">
                <p className="text-xs text-muted-foreground truncate">Clients</p>
                <p className="text-xl font-bold">{clients.length}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4 pb-4">
            <div className="flex items-center gap-2">
              <div className="p-1.5 bg-green-500/10 rounded-lg">
                <TrendingUp className="h-4 w-4 text-green-600 dark:text-green-400" />
              </div>
              <div className="min-w-0">
                <p className="text-xs text-muted-foreground truncate">Monthly Rev.</p>
                <p className="text-xl font-bold">£{totalMonthlyRevenue.toLocaleString()}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4 pb-4">
            <div className="flex items-center gap-2">
              <div className="p-1.5 bg-emerald-500/10 rounded-lg">
                <DollarSign className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
              </div>
              <div className="min-w-0">
                <p className="text-xs text-muted-foreground truncate">Total Made</p>
                <p className="text-xl font-bold">£{totalRevenueMade.toLocaleString()}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4 pb-4">
            <div className="flex items-center gap-2">
              <div className="p-1.5 bg-green-500/10 rounded-lg">
                <CheckCircle2 className="h-4 w-4 text-green-600 dark:text-green-400" />
              </div>
              <div className="min-w-0">
                <p className="text-xs text-muted-foreground truncate">Paid</p>
                <p className="text-xl font-bold">{paidClients}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4 pb-4">
            <div className="flex items-center gap-2">
              <div className="p-1.5 bg-amber-500/10 rounded-lg">
                <Clock className="h-4 w-4 text-amber-600 dark:text-amber-400" />
              </div>
              <div className="min-w-0">
                <p className="text-xs text-muted-foreground truncate">Pending</p>
                <p className="text-xl font-bold">{pendingPayments}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4 pb-4">
            <div className="flex items-center gap-2">
              <div className="p-1.5 bg-blue-500/10 rounded-lg">
                <ShoppingCart className="h-4 w-4 text-blue-600 dark:text-blue-400" />
              </div>
              <div className="min-w-0">
                <p className="text-xs text-muted-foreground truncate">In Cart</p>
                <p className="text-xl font-bold">{clientsWithCart.length}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Clients with items in Cart - Alert */}
      {clientsWithCart.length > 0 && (
        <Card className="border-blue-500/30 bg-blue-500/5">
          <CardHeader className="pb-2">
            <CardTitle className="flex items-center gap-2 text-base">
              <ShoppingCart className="h-4 w-4 text-blue-600 dark:text-blue-400" />
              Clients with Items in Cart
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-2">
              {clientsWithCart.map(billing => {
                const client = clients.find(c => c.user_id === billing.user_id);
                const cartTotal = billing.one_off_charges.filter(c => !c.paid).reduce((s, c) => s + c.price, 0) + billing.plan_price;
                return (
                  <button
                    key={billing.id}
                    onClick={() => client && handleSelectClient(client)}
                    className="flex items-center gap-2 px-3 py-2 bg-background rounded-lg border hover:border-primary/50 transition-colors"
                  >
                    <span className="font-medium text-sm">{client?.full_name || 'Unknown'}</span>
                    <Badge variant="outline" className="text-xs">£{cartTotal.toLocaleString()}</Badge>
                  </button>
                );
              })}
            </div>
          </CardContent>
        </Card>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Client List */}
        <Card className="lg:col-span-1">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <CreditCard className="h-5 w-5" />
              Clients
            </CardTitle>
            <div className="relative mt-2">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search clients..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-9"
              />
            </div>
          </CardHeader>
          <CardContent className="p-0">
            <ScrollArea className="h-[600px]">
              <div className="space-y-1 p-4 pt-0">
                {filteredClients.map((client) => {
                  const billing = getClientBilling(client.user_id);
                  return (
                    <button
                      key={client.id}
                      onClick={() => handleSelectClient(client)}
                      className={`w-full text-left p-3 rounded-lg transition-colors ${
                        selectedClient?.id === client.id
                          ? 'bg-primary/10 border border-primary/20'
                          : 'hover:bg-muted/50'
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <div className="min-w-0 flex-1">
                          <p className="font-medium truncate">{client.full_name || 'Unnamed'}</p>
                          <p className="text-sm text-muted-foreground truncate">{client.email}</p>
                        </div>
                        <div className="ml-2 flex flex-col items-end gap-1">
                          {billing ? (
                            <>
                              <Badge variant="outline" className="text-xs">
                                {billing.plan_name}
                              </Badge>
                              <Badge className={`text-xs ${getStatusColor(billing.payment_status)}`}>
                                {billing.payment_status === 'paid' && <CheckCircle2 className="h-3 w-3 mr-1" />}
                                {billing.payment_status === 'pending' && <Clock className="h-3 w-3 mr-1" />}
                                {billing.payment_status}
                              </Badge>
                            </>
                          ) : (
                            <Badge variant="outline" className="text-muted-foreground text-xs">
                              No Plan
                            </Badge>
                          )}
                        </div>
                      </div>
                    </button>
                  );
                })}
              </div>
            </ScrollArea>
          </CardContent>
        </Card>

        {/* Billing Details */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle>
                  {selectedClient ? `${selectedClient.full_name || 'Client'}'s Billing` : 'Select a Client'}
                </CardTitle>
                <CardDescription>
                  {selectedClient?.email || 'Choose a client to manage their billing'}
                </CardDescription>
              </div>
              {selectedClient && (
                <div className="flex gap-2">
                  <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
                    <DialogTrigger asChild>
                      <Button size="sm" className="gap-2">
                        {selectedBilling ? <Edit className="h-4 w-4" /> : <Plus className="h-4 w-4" />}
                        {selectedBilling ? 'Edit Plan' : 'Create Plan'}
                      </Button>
                    </DialogTrigger>
                    <DialogContent className="w-[95vw] sm:max-w-2xl max-h-[90vh] overflow-y-auto">
                      <DialogHeader>
                        <DialogTitle>{selectedBilling ? 'Edit Billing' : 'Create Billing'}</DialogTitle>
                        <DialogDescription>
                          Configure billing for {selectedClient.full_name || 'this client'}
                        </DialogDescription>
                      </DialogHeader>
                      
                      <Tabs defaultValue="plan" className="mt-4">
                        <TabsList className="grid w-full grid-cols-3">
                          <TabsTrigger value="plan">Plan</TabsTrigger>
                          <TabsTrigger value="addons">Add-ons</TabsTrigger>
                          <TabsTrigger value="settings">Settings</TabsTrigger>
                        </TabsList>
                        
                        <TabsContent value="plan" className="space-y-4 mt-4">
                          <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                              <Label>Plan</Label>
                              <Select value={formData.plan_name} onValueChange={handlePlanChange}>
                                <SelectTrigger>
                                  <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                  {PLAN_OPTIONS.map((plan) => (
                                    <SelectItem key={plan.name} value={plan.name}>
                                      {plan.name} - £{plan.price}/mo
                                    </SelectItem>
                                  ))}
                                </SelectContent>
                              </Select>
                            </div>
                            <div className="space-y-2">
                              <Label>Custom Price (£/mo)</Label>
                              <Input
                                type="number"
                                value={formData.plan_price}
                                onChange={(e) => setFormData(prev => ({ ...prev, plan_price: Number(e.target.value) }))}
                              />
                            </div>
                          </div>
                        </TabsContent>
                        
                        <TabsContent value="addons" className="space-y-4 mt-4">
                          <p className="text-sm text-muted-foreground">
                            Select which add-ons to include in this client's package:
                          </p>
                          <div className="space-y-3">
                            {AVAILABLE_ADDONS.map((addon) => {
                              const Icon = addon.icon;
                              const isActive = formData.selectedAddons.has(addon.id);
                              
                              return (
                                <div 
                                  key={addon.id}
                                  className={`flex items-center justify-between p-4 rounded-lg border transition-colors ${
                                    isActive ? 'border-primary bg-primary/5' : 'border-border'
                                  }`}
                                >
                                  <div className="flex items-center gap-3">
                                    <div className={`p-2 rounded-lg ${isActive ? 'bg-primary/20' : 'bg-muted'}`}>
                                      <Icon className={`h-4 w-4 ${isActive ? 'text-primary' : 'text-muted-foreground'}`} />
                                    </div>
                                    <div>
                                      <p className="font-medium">{addon.name}</p>
                                      <p className="text-sm text-muted-foreground">£{addon.price}/mo</p>
                                    </div>
                                  </div>
                                  <Switch
                                    checked={isActive}
                                    onCheckedChange={() => toggleAddon(addon.id)}
                                  />
                                </div>
                              );
                            })}
                          </div>
                        </TabsContent>
                        
                        <TabsContent value="settings" className="space-y-4 mt-4">
                          <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                              <Label>Billing Cycle</Label>
                              <Select 
                                value={formData.billing_cycle} 
                                onValueChange={(v) => setFormData(prev => ({ ...prev, billing_cycle: v }))}
                              >
                                <SelectTrigger>
                                  <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                  <SelectItem value="monthly">Monthly</SelectItem>
                                  <SelectItem value="quarterly">Quarterly</SelectItem>
                                  <SelectItem value="annually">Annually</SelectItem>
                                </SelectContent>
                              </Select>
                            </div>
                            <div className="space-y-2">
                              <Label>Payment Status</Label>
                              <Select 
                                value={formData.payment_status} 
                                onValueChange={(v) => setFormData(prev => ({ ...prev, payment_status: v }))}
                              >
                                <SelectTrigger>
                                  <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                  <SelectItem value="pending">Pending</SelectItem>
                                  <SelectItem value="paid">Paid</SelectItem>
                                  <SelectItem value="overdue">Overdue</SelectItem>
                                </SelectContent>
                              </Select>
                            </div>
                          </div>
                          <div className="space-y-2">
                            <Label>Next Billing Date</Label>
                            <Input
                              type="date"
                              value={formData.next_billing_date}
                              onChange={(e) => setFormData(prev => ({ ...prev, next_billing_date: e.target.value }))}
                            />
                          </div>
                          <div className="space-y-2">
                            <Label>Admin Notes</Label>
                            <Textarea
                              value={formData.notes}
                              onChange={(e) => setFormData(prev => ({ ...prev, notes: e.target.value }))}
                              placeholder="Internal notes..."
                              rows={3}
                            />
                          </div>
                        </TabsContent>
                      </Tabs>

                      {/* Total Preview */}
                      <div className="mt-4 p-4 bg-muted/50 rounded-lg">
                        <div className="flex items-center justify-between">
                          <span className="text-sm text-muted-foreground">Total Monthly</span>
                          <span className="text-xl font-bold">
                            £{(formData.plan_price + Array.from(formData.selectedAddons).reduce((sum, id) => {
                              const addon = AVAILABLE_ADDONS.find(a => a.id === id);
                              return sum + (addon?.price || 0);
                            }, 0)).toFixed(2)}/mo
                          </span>
                        </div>
                      </div>

                      <DialogFooter className="mt-4">
                        <Button variant="outline" onClick={() => setDialogOpen(false)}>
                          Cancel
                        </Button>
                        <Button onClick={handleSaveBilling}>
                          Save Changes
                        </Button>
                      </DialogFooter>
                    </DialogContent>
                  </Dialog>
                </div>
              )}
            </div>
          </CardHeader>
          
          <CardContent>
            {selectedClient && selectedBilling ? (
              <div className="space-y-6">
                {/* Billing Summary */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="p-4 bg-muted/30 rounded-lg">
                    <p className="text-sm text-muted-foreground">Plan</p>
                    <p className="text-xl font-bold">{selectedBilling.plan_name}</p>
                    <p className="text-sm text-muted-foreground">£{selectedBilling.plan_price}/mo</p>
                  </div>
                  <div className="p-4 bg-muted/30 rounded-lg">
                    <p className="text-sm text-muted-foreground">Monthly Total</p>
                    <p className="text-xl font-bold">£{clientMonthlyTotal}</p>
                    <p className="text-sm text-muted-foreground">
                      {selectedBilling.add_ons.filter(a => a.active).length} add-ons
                    </p>
                  </div>
                  <div className="p-4 bg-muted/30 rounded-lg">
                    <p className="text-sm text-muted-foreground">Status</p>
                    <Badge className={`mt-1 ${getStatusColor(selectedBilling.payment_status)}`}>
                      {selectedBilling.payment_status === 'paid' && <CheckCircle2 className="h-3 w-3 mr-1" />}
                      {selectedBilling.payment_status === 'pending' && <Clock className="h-3 w-3 mr-1" />}
                      {selectedBilling.payment_status === 'overdue' && <AlertCircle className="h-3 w-3 mr-1" />}
                      {selectedBilling.payment_status.charAt(0).toUpperCase() + selectedBilling.payment_status.slice(1)}
                    </Badge>
                  </div>
                </div>

                {/* Active Add-ons */}
                {selectedBilling.add_ons.filter(a => a.active).length > 0 && (
                  <div>
                    <h3 className="text-sm font-medium text-muted-foreground mb-3">Active Add-ons</h3>
                    <div className="flex flex-wrap gap-2">
                      {selectedBilling.add_ons.filter(a => a.active).map((addon, index) => (
                        <Badge key={index} variant="secondary" className="gap-1">
                          {addon.name}
                          <span className="text-muted-foreground">£{addon.price}</span>
                        </Badge>
                      ))}
                    </div>
                  </div>
                )}

                <Separator />

                {/* One-off Charges */}
                <div>
                  <div className="flex items-center justify-between mb-3">
                    <h3 className="text-sm font-medium text-muted-foreground">One-off Charges</h3>
                    <Dialog open={addChargeDialogOpen} onOpenChange={setAddChargeDialogOpen}>
                      <DialogTrigger asChild>
                        <Button variant="outline" size="sm" className="gap-2">
                          <Plus className="h-4 w-4" />
                          Add Charge
                        </Button>
                      </DialogTrigger>
                      <DialogContent>
                        <DialogHeader>
                          <DialogTitle>Add One-off Charge</DialogTitle>
                          <DialogDescription>
                            This charge will appear in the client's payment portal
                          </DialogDescription>
                        </DialogHeader>
                        <div className="space-y-4 py-4">
                          <div className="space-y-2">
                            <Label>Description</Label>
                            <Input
                              value={newCharge.name}
                              onChange={(e) => setNewCharge(prev => ({ ...prev, name: e.target.value }))}
                              placeholder="e.g., Website Redesign, Logo Design"
                            />
                          </div>
                          <div className="space-y-2">
                            <Label>Amount (£)</Label>
                            <Input
                              type="number"
                              value={newCharge.price}
                              onChange={(e) => setNewCharge(prev => ({ ...prev, price: Number(e.target.value) }))}
                            />
                          </div>
                          <div className="space-y-2">
                            <Label>Date</Label>
                            <Input
                              type="date"
                              value={newCharge.date}
                              onChange={(e) => setNewCharge(prev => ({ ...prev, date: e.target.value }))}
                            />
                          </div>
                        </div>
                        <DialogFooter>
                          <Button variant="outline" onClick={() => setAddChargeDialogOpen(false)}>
                            Cancel
                          </Button>
                          <Button onClick={handleAddCharge}>
                            Add Charge
                          </Button>
                        </DialogFooter>
                      </DialogContent>
                    </Dialog>
                  </div>

                  {selectedBilling.one_off_charges.length > 0 ? (
                    <div className="space-y-2">
                      {selectedBilling.one_off_charges.map((charge, index) => (
                        <div 
                          key={index} 
                          className="flex items-center justify-between p-3 bg-muted/30 rounded-lg"
                        >
                          <div className="flex items-center gap-3">
                            <button
                              onClick={() => handleToggleChargePaid(index)}
                              className={`h-5 w-5 rounded border-2 flex items-center justify-center transition-colors ${
                                charge.paid 
                                  ? 'bg-green-500 border-green-500' 
                                  : 'border-muted-foreground hover:border-primary'
                              }`}
                            >
                              {charge.paid && <CheckCircle2 className="h-3 w-3 text-white" />}
                            </button>
                            <div>
                              <p className={`font-medium ${charge.paid ? 'line-through text-muted-foreground' : ''}`}>
                                {charge.name}
                              </p>
                              <p className="text-sm text-muted-foreground">
                                {format(new Date(charge.date), 'dd MMM yyyy')}
                              </p>
                            </div>
                          </div>
                          <div className="flex items-center gap-3">
                            <span className="font-semibold">£{charge.price.toFixed(2)}</span>
                            <Badge className={charge.paid ? 'bg-green-500/10 text-green-600' : 'bg-amber-500/10 text-amber-600'}>
                              {charge.paid ? 'Paid' : 'Pending'}
                            </Badge>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-sm text-muted-foreground">No one-off charges</p>
                  )}
                </div>

                {/* Pending Total & Actions */}
                {clientPendingTotal > 0 && (
                  <div className="p-4 bg-amber-500/10 rounded-lg border border-amber-500/20">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="font-medium text-amber-700 dark:text-amber-300">
                          Total Pending: £{clientPendingTotal.toFixed(2)}
                        </p>
                        <p className="text-sm text-amber-600 dark:text-amber-400">
                          {clientPendingCharges.length} unpaid charge{clientPendingCharges.length !== 1 ? 's' : ''}
                        </p>
                      </div>
                      <div className="flex gap-2">
                        <Button 
                          variant="outline" 
                          size="sm" 
                          className="gap-2"
                          onClick={handleSendPaymentRequest}
                        >
                          <Send className="h-4 w-4" />
                          Send Reminder
                        </Button>
                        <Button 
                          size="sm" 
                          className="gap-2"
                          onClick={handleMarkAsPaid}
                        >
                          <CheckCircle2 className="h-4 w-4" />
                          Mark All Paid
                        </Button>
                      </div>
                    </div>
                  </div>
                )}

                {/* Quick Actions */}
                <div className="flex flex-wrap gap-2">
                  <Button variant="outline" size="sm" className="gap-2" onClick={() => setInvoiceDialogOpen(true)}>
                    <FileText className="h-4 w-4" />
                    Create Invoice
                  </Button>
                  <Button variant="outline" size="sm" className="gap-2" onClick={handleSendPaymentRequest}>
                    <Mail className="h-4 w-4" />
                    Request Payment
                  </Button>
                  {selectedBilling.payment_status !== 'paid' && (
                    <Button variant="outline" size="sm" className="gap-2" onClick={handleMarkAsPaid}>
                      <CheckCircle2 className="h-4 w-4" />
                      Mark as Paid
                    </Button>
                  )}
                </div>

                {/* Invoice Manager Dialog */}
                <InvoiceManager
                  clientName={selectedClient?.full_name || 'Client'}
                  clientEmail={selectedClient?.email || ''}
                  open={invoiceDialogOpen}
                  onOpenChange={setInvoiceDialogOpen}
                  onSendInvoice={async (items, notes) => {
                    if (!selectedClient) return;
                    
                    // Find the team for this client
                    const { data: teamData } = await supabase
                      .from('client_teams')
                      .select('id')
                      .eq('primary_account_id', selectedClient.user_id)
                      .maybeSingle();
                    
                    if (!teamData) {
                      // Try to find via membership
                      const { data: membership } = await supabase
                        .from('team_memberships')
                        .select('team_id')
                        .eq('user_id', selectedClient.user_id)
                        .maybeSingle();
                      
                      if (!membership) {
                        toast.error('Client does not have a team. Please set up their team first.');
                        return;
                      }
                      
                      // Use the membership team_id
                      const teamId = membership.team_id;
                      await createInvoiceForTeam(teamId, items, notes);
                    } else {
                      await createInvoiceForTeam(teamData.id, items, notes);
                    }
                    
                    async function createInvoiceForTeam(teamId: string, invoiceItems: typeof items, invoiceNotes: string) {
                      // Generate invoice number
                      const { data: invoiceNumber, error: numberError } = await supabase
                        .rpc('generate_invoice_number');

                      if (numberError) {
                        console.error('Failed to generate invoice number:', numberError);
                        toast.error('Failed to generate invoice number');
                        return;
                      }

                      const subtotal = invoiceItems.reduce((sum, item) => sum + item.price, 0);

                      const { error } = await supabase
                        .from('client_invoices')
                        .insert({
                          team_id: teamId,
                          invoice_number: invoiceNumber,
                          items: invoiceItems.map(item => ({
                            name: item.name,
                            price: item.price,
                            quantity: 1
                          })),
                          amount: subtotal,
                          tax_amount: 0,
                          total_amount: subtotal,
                          status: 'pending',
                          notes: invoiceNotes || null,
                          currency: 'GBP'
                        });

                      if (error) {
                        console.error('Failed to create invoice:', error);
                        toast.error('Failed to create invoice');
                        return;
                      }

                      // Also add to client_billing one_off_charges for legacy compatibility
                      if (selectedBilling) {
                        const newCharges = invoiceItems.map(item => ({
                          name: item.name,
                          price: item.price,
                          date: new Date().toISOString().split('T')[0],
                          paid: false
                        }));
                        
                        const updatedCharges = [...selectedBilling.one_off_charges, ...newCharges];
                        
                        await supabase
                          .from('client_billing')
                          .update({ 
                            one_off_charges: updatedCharges,
                            payment_status: 'pending',
                            notes: invoiceNotes || selectedBilling.notes
                          })
                          .eq('id', selectedBilling.id);
                      }

                      toast.success(`Invoice ${invoiceNumber} created and sent to ${selectedClient?.email}`);
                      fetchData();
                    }
                  }}
                />
              </div>
            ) : selectedClient && !selectedBilling ? (
              <div className="flex flex-col items-center justify-center py-12 text-center">
                <CreditCard className="h-12 w-12 text-muted-foreground mb-4" />
                <h3 className="text-lg font-semibold mb-2">No Billing Set Up</h3>
                <p className="text-muted-foreground mb-4 max-w-md">
                  This client doesn't have billing configured yet. Create a plan to start tracking their payments.
                </p>
                <Button onClick={() => setDialogOpen(true)} className="gap-2">
                  <Plus className="h-4 w-4" />
                  Create Billing Plan
                </Button>
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center py-12 text-center">
                <Users className="h-12 w-12 text-muted-foreground mb-4" />
                <h3 className="text-lg font-semibold mb-2">Select a Client</h3>
                <p className="text-muted-foreground max-w-md">
                  Choose a client from the list to view and manage their billing information.
                </p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default AdminBilling;
