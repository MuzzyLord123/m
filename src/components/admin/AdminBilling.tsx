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
  Send,
  Megaphone,
  Share2,
  Palette,
  Mail,
  FileText
} from 'lucide-react';
import { format } from 'date-fns';
import InvoiceManager from '@/components/billing/InvoiceManager';
import { Panel, StatusBadge, statusTone, statusLabel, Money, EmptyState, SkeletonBlock, SkeletonLedger } from '@/components/platform';
import { cn } from '@/lib/utils';

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
  { id: 'branding', name: 'Branding & Design', price: 99, icon: Palette },
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
      <div className="space-y-4" aria-busy>
        <div className="grid grid-cols-2 gap-3 md:grid-cols-3 lg:grid-cols-6">
          {Array.from({ length: 6 }, (_, i) => (
            <SkeletonBlock key={i} className="h-[64px] rounded-[10px]" />
          ))}
        </div>
        <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
          <Panel><SkeletonLedger rows={6} /></Panel>
          <Panel className="lg:col-span-2"><SkeletonLedger rows={4} /></Panel>
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-[1400px] space-y-4 px-4 pb-16 pt-6 sm:px-6">
      <header>
        <p className="font-mono text-[9px] font-medium uppercase tracking-[0.16em] text-muted-foreground">
          Recurring revenue
        </p>
        <h1 className="mt-1.5 font-display text-[26px] font-semibold leading-none tracking-[-0.02em] sm:text-[30px]">
          Billing
        </h1>
        <p className="mt-2 max-w-xl text-[13px] leading-relaxed text-muted-foreground">
          What each client is on, what they owe, and what has been collected.
        </p>
      </header>

      {/* The book: revenue leads, the rest supports it. */}
      <div className="grid grid-cols-2 gap-px overflow-hidden rounded-[12px] border border-border/60 bg-border/60 lg:grid-cols-6">
        <div className="bg-card px-4 py-3.5 lg:col-span-2">
          <p className="font-mono text-[9px] font-medium uppercase tracking-[0.16em] text-muted-foreground">
            Monthly revenue
          </p>
          <p className="mt-1.5 font-display text-[30px] font-semibold leading-none tracking-[-0.02em] tabular-nums text-primary">
            <Money value={totalMonthlyRevenue} whole />
          </p>
          <p className="mt-1.5 text-[11px] text-muted-foreground">
            Across {clients.length} client{clients.length === 1 ? '' : 's'}
          </p>
        </div>
        {[
          { label: 'Collected', value: <Money value={totalRevenueMade} whole />, meta: 'All time' },
          { label: 'Paid up', value: String(paidClients), meta: 'Settled accounts', tone: 'ok' },
          { label: 'Pending', value: String(pendingPayments), meta: 'Awaiting payment', tone: pendingPayments ? 'attend' : undefined },
          { label: 'In cart', value: String(clientsWithCart.length), meta: 'Unbilled items' },
        ].map((s) => (
          <div key={s.label} className="bg-card px-4 py-3.5">
            <p className="truncate font-mono text-[9px] font-medium uppercase tracking-[0.16em] text-muted-foreground">{s.label}</p>
            <p className={cn(
              'mt-1.5 font-display text-[22px] font-semibold leading-none tracking-[-0.02em] tabular-nums',
              s.tone === 'ok' && 'text-ok', s.tone === 'attend' && 'text-attend',
            )}>
              {s.value}
            </p>
            <p className="mt-1.5 truncate text-[11px] text-muted-foreground">{s.meta}</p>
          </div>
        ))}
      </div>

      {/* Clients with items in cart */}
      {clientsWithCart.length > 0 && (
        <Panel>
          <div className="flex min-h-[40px] items-center gap-3 border-b border-border/60 px-4 py-2">
            <span className="font-mono text-[10px] font-medium uppercase tracking-[0.14em] text-attend">
              Clients with items in cart
            </span>
          </div>
          <div className="flex flex-wrap gap-2 p-3">
            {clientsWithCart.map(billing => {
              const client = clients.find(c => c.user_id === billing.user_id);
              const cartTotal = billing.one_off_charges.filter(c => !c.paid).reduce((s, c) => s + c.price, 0) + billing.plan_price;
              return (
                <button
                  key={billing.id}
                  onClick={() => client && handleSelectClient(client)}
                  className="flex items-center gap-2 rounded-lg border border-border/60 bg-background px-3 py-1.5 transition-colors duration-150 hover:border-primary/50"
                >
                  <span className="text-[13px] font-medium">{client?.full_name || 'Unknown'}</span>
                  <span className="font-mono text-[11px] tabular-nums text-muted-foreground"><Money value={cartTotal} whole /></span>
                </button>
              );
            })}
          </div>
        </Panel>
      )}

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        {/* Client List */}
        <Card className="rounded-[10px] border-border/60 shadow-none lg:col-span-1">
          <CardHeader className="px-4 py-3">
            <CardTitle className="flex items-center gap-2 font-mono text-[10px] font-medium uppercase tracking-[0.14em] text-muted-foreground">
              <CreditCard className="h-3.5 w-3.5" />
              Clients
            </CardTitle>
            <div className="relative mt-2">
              <Search className="absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Search clients…"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="h-8 pl-9 text-[13px]"
              />
            </div>
          </CardHeader>
          <CardContent className="p-0">
            <ScrollArea className="h-[600px]">
              <div className="space-y-1 p-3 pt-0">
                {filteredClients.map((client) => {
                  const billing = getClientBilling(client.user_id);
                  return (
                    <button
                      key={client.id}
                      onClick={() => handleSelectClient(client)}
                      className={cn(
                        'w-full rounded-lg p-2.5 text-left transition-colors duration-150',
                        selectedClient?.id === client.id
                          ? 'bg-primary/[0.06] ring-1 ring-inset ring-primary/20'
                          : 'hover:bg-foreground/[0.025]',
                      )}
                    >
                      <div className="flex items-center justify-between">
                        <div className="min-w-0 flex-1">
                          <p className="truncate text-[13px] font-medium">{client.full_name || 'Unnamed'}</p>
                          <p className="truncate text-[11px] text-muted-foreground">{client.email}</p>
                        </div>
                        <div className="ml-2 flex flex-col items-end gap-1">
                          {billing ? (
                            <>
                              <Badge variant="outline" className="border-border/60 text-[10px] font-normal text-muted-foreground">
                                {billing.plan_name}
                              </Badge>
                              <StatusBadge
                                tone={statusTone(billing.payment_status)}
                                label={statusLabel(billing.payment_status)}
                                className="text-[10.5px]"
                              />
                            </>
                          ) : (
                            <Badge variant="outline" className="border-border/60 text-[10px] font-normal text-muted-foreground">
                              No plan
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
        <Card className="rounded-[10px] border-border/60 shadow-none lg:col-span-2">
          <CardHeader className="px-4 py-3">
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-[15px] font-semibold tracking-[-0.01em]">
                  {selectedClient ? `Billing for ${selectedClient.full_name || 'client'}` : 'Select a client'}
                </CardTitle>
                <CardDescription className="text-[12px]">
                  {selectedClient?.email || 'Choose a client to manage their billing'}
                </CardDescription>
              </div>
              {selectedClient && (
                <div className="flex gap-2">
                  <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
                    <DialogTrigger asChild>
                      <Button size="sm" className="h-8 gap-2 rounded-lg px-3 text-xs">
                        {selectedBilling ? <Edit className="h-3.5 w-3.5" /> : <Plus className="h-3.5 w-3.5" />}
                        {selectedBilling ? 'Edit plan' : 'Create plan'}
                      </Button>
                    </DialogTrigger>
                    <DialogContent className="max-h-[90vh] w-[95vw] overflow-y-auto rounded-xl border-border/60 bg-card sm:max-w-2xl">
                      <DialogHeader>
                        <DialogTitle className="text-[15px] font-semibold tracking-[-0.01em]">{selectedBilling ? 'Edit billing' : 'Create billing'}</DialogTitle>
                        <DialogDescription className="text-[13px]">
                          Configure billing for {selectedClient.full_name || 'this client'}
                        </DialogDescription>
                      </DialogHeader>

                      <Tabs defaultValue="plan" className="mt-4">
                        <TabsList className="grid h-9 w-full grid-cols-3 rounded-lg border border-border/60 bg-sunken p-0.5">
                          <TabsTrigger value="plan" className="h-8 rounded-md text-xs data-[state=active]:bg-card">Plan</TabsTrigger>
                          <TabsTrigger value="addons" className="h-8 rounded-md text-xs data-[state=active]:bg-card">Add-ons</TabsTrigger>
                          <TabsTrigger value="settings" className="h-8 rounded-md text-xs data-[state=active]:bg-card">Settings</TabsTrigger>
                        </TabsList>

                        <TabsContent value="plan" className="mt-4 space-y-4">
                          <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                              <Label className="font-mono text-[10px] font-medium uppercase tracking-[0.14em] text-muted-foreground">Plan</Label>
                              <Select value={formData.plan_name} onValueChange={handlePlanChange}>
                                <SelectTrigger>
                                  <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                  {PLAN_OPTIONS.map((plan) => (
                                    <SelectItem key={plan.name} value={plan.name}>
                                      {plan.name} at £{plan.price}/mo
                                    </SelectItem>
                                  ))}
                                </SelectContent>
                              </Select>
                            </div>
                            <div className="space-y-2">
                              <Label className="font-mono text-[10px] font-medium uppercase tracking-[0.14em] text-muted-foreground">Custom price in £/mo</Label>
                              <Input
                                type="number"
                                className="tabular-nums"
                                value={formData.plan_price}
                                onChange={(e) => setFormData(prev => ({ ...prev, plan_price: Number(e.target.value) }))}
                              />
                            </div>
                          </div>
                        </TabsContent>

                        <TabsContent value="addons" className="mt-4 space-y-4">
                          <p className="text-[13px] text-muted-foreground">
                            Select which add-ons to include in this client's package:
                          </p>
                          <div className="space-y-2">
                            {AVAILABLE_ADDONS.map((addon) => {
                              const Icon = addon.icon;
                              const isActive = formData.selectedAddons.has(addon.id);

                              return (
                                <div
                                  key={addon.id}
                                  className={cn(
                                    'flex items-center justify-between rounded-lg border p-3 transition-colors duration-150',
                                    isActive ? 'border-primary/50 bg-primary/[0.04]' : 'border-border/60',
                                  )}
                                >
                                  <div className="flex items-center gap-3">
                                    <div className={cn('rounded-lg p-2', isActive ? 'bg-primary/10' : 'bg-sunken')}>
                                      <Icon className={cn('h-4 w-4', isActive ? 'text-primary' : 'text-muted-foreground')} />
                                    </div>
                                    <div>
                                      <p className="text-[13px] font-medium">{addon.name}</p>
                                      <p className="text-[12px] tabular-nums text-muted-foreground">£{addon.price}/mo</p>
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

                        <TabsContent value="settings" className="mt-4 space-y-4">
                          <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                              <Label className="font-mono text-[10px] font-medium uppercase tracking-[0.14em] text-muted-foreground">Billing cycle</Label>
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
                              <Label className="font-mono text-[10px] font-medium uppercase tracking-[0.14em] text-muted-foreground">Payment status</Label>
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
                            <Label className="font-mono text-[10px] font-medium uppercase tracking-[0.14em] text-muted-foreground">Next billing date</Label>
                            <Input
                              type="date"
                              className="tabular-nums"
                              value={formData.next_billing_date}
                              onChange={(e) => setFormData(prev => ({ ...prev, next_billing_date: e.target.value }))}
                            />
                          </div>
                          <div className="space-y-2">
                            <Label className="font-mono text-[10px] font-medium uppercase tracking-[0.14em] text-muted-foreground">Admin notes</Label>
                            <Textarea
                              value={formData.notes}
                              onChange={(e) => setFormData(prev => ({ ...prev, notes: e.target.value }))}
                              placeholder="Internal notes…"
                              rows={3}
                            />
                          </div>
                        </TabsContent>
                      </Tabs>

                      {/* Total Preview */}
                      <div className="mt-4 rounded-lg border border-border/60 bg-sunken p-3">
                        <div className="flex items-center justify-between">
                          <span className="font-mono text-[10px] font-medium uppercase tracking-[0.14em] text-muted-foreground">Total monthly</span>
                          <span className="font-mono text-[16px] font-semibold tabular-nums">
                            £{(formData.plan_price + Array.from(formData.selectedAddons).reduce((sum, id) => {
                              const addon = AVAILABLE_ADDONS.find(a => a.id === id);
                              return sum + (addon?.price || 0);
                            }, 0)).toFixed(2)}/mo
                          </span>
                        </div>
                      </div>

                      <DialogFooter className="mt-4">
                        <Button variant="outline" className="h-8 rounded-lg px-3 text-xs" onClick={() => setDialogOpen(false)}>
                          Cancel
                        </Button>
                        <Button className="h-8 rounded-lg px-3 text-xs" onClick={handleSaveBilling}>
                          Save changes
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
                <div className="grid grid-cols-1 gap-3 md:grid-cols-3">
                  <div className="rounded-lg border border-border/60 bg-sunken p-3">
                    <p className="font-mono text-[10px] font-medium uppercase tracking-[0.14em] text-muted-foreground">Plan</p>
                    <p className="mt-1 text-[16px] font-semibold tracking-[-0.01em]">{selectedBilling.plan_name}</p>
                    <p className="text-[12px] tabular-nums text-muted-foreground">£{selectedBilling.plan_price}/mo</p>
                  </div>
                  <div className="rounded-lg border border-border/60 bg-sunken p-3">
                    <p className="font-mono text-[10px] font-medium uppercase tracking-[0.14em] text-muted-foreground">Monthly total</p>
                    <p className="mt-1 text-[16px] font-semibold tabular-nums tracking-[-0.01em]"><Money value={clientMonthlyTotal} whole /></p>
                    <p className="text-[12px] tabular-nums text-muted-foreground">
                      {selectedBilling.add_ons.filter(a => a.active).length} add-ons
                    </p>
                  </div>
                  <div className="rounded-lg border border-border/60 bg-sunken p-3">
                    <p className="font-mono text-[10px] font-medium uppercase tracking-[0.14em] text-muted-foreground">Status</p>
                    <StatusBadge
                      tone={statusTone(selectedBilling.payment_status)}
                      label={statusLabel(selectedBilling.payment_status)}
                      className="mt-1.5"
                    />
                  </div>
                </div>

                {/* Active Add-ons */}
                {selectedBilling.add_ons.filter(a => a.active).length > 0 && (
                  <div>
                    <h3 className="mb-2 font-mono text-[10px] font-medium uppercase tracking-[0.14em] text-muted-foreground">Active add-ons</h3>
                    <div className="flex flex-wrap gap-2">
                      {selectedBilling.add_ons.filter(a => a.active).map((addon, index) => (
                        <Badge key={index} variant="outline" className="gap-1 border-border/60 bg-sunken font-normal text-ink-2">
                          {addon.name}
                          <span className="tabular-nums text-muted-foreground">£{addon.price}</span>
                        </Badge>
                      ))}
                    </div>
                  </div>
                )}

                <Separator />

                {/* One-off Charges */}
                <div>
                  <div className="mb-2 flex items-center justify-between">
                    <h3 className="font-mono text-[10px] font-medium uppercase tracking-[0.14em] text-muted-foreground">One-off charges</h3>
                    <Dialog open={addChargeDialogOpen} onOpenChange={setAddChargeDialogOpen}>
                      <DialogTrigger asChild>
                        <Button variant="outline" size="sm" className="h-7 gap-2 rounded-md border-border/60 px-2.5 text-xs">
                          <Plus className="h-3.5 w-3.5" />
                          Add charge
                        </Button>
                      </DialogTrigger>
                      <DialogContent className="rounded-xl border-border/60 bg-card">
                        <DialogHeader>
                          <DialogTitle className="text-[15px] font-semibold tracking-[-0.01em]">Add one-off charge</DialogTitle>
                          <DialogDescription className="text-[13px]">
                            This charge will appear in the client's payment portal
                          </DialogDescription>
                        </DialogHeader>
                        <div className="space-y-4 py-4">
                          <div className="space-y-2">
                            <Label className="font-mono text-[10px] font-medium uppercase tracking-[0.14em] text-muted-foreground">Description</Label>
                            <Input
                              value={newCharge.name}
                              onChange={(e) => setNewCharge(prev => ({ ...prev, name: e.target.value }))}
                              placeholder="e.g. Website redesign, logo design"
                            />
                          </div>
                          <div className="space-y-2">
                            <Label className="font-mono text-[10px] font-medium uppercase tracking-[0.14em] text-muted-foreground">Amount in £</Label>
                            <Input
                              type="number"
                              className="tabular-nums"
                              value={newCharge.price}
                              onChange={(e) => setNewCharge(prev => ({ ...prev, price: Number(e.target.value) }))}
                            />
                          </div>
                          <div className="space-y-2">
                            <Label className="font-mono text-[10px] font-medium uppercase tracking-[0.14em] text-muted-foreground">Date</Label>
                            <Input
                              type="date"
                              className="tabular-nums"
                              value={newCharge.date}
                              onChange={(e) => setNewCharge(prev => ({ ...prev, date: e.target.value }))}
                            />
                          </div>
                        </div>
                        <DialogFooter>
                          <Button variant="outline" className="h-8 rounded-lg px-3 text-xs" onClick={() => setAddChargeDialogOpen(false)}>
                            Cancel
                          </Button>
                          <Button className="h-8 rounded-lg px-3 text-xs" onClick={handleAddCharge}>
                            Add charge
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
                          className="flex h-10 items-center justify-between rounded-lg border border-border/60 px-3"
                        >
                          <div className="flex items-center gap-3">
                            <button
                              onClick={() => handleToggleChargePaid(index)}
                              aria-label={charge.paid ? 'Mark as unpaid' : 'Mark as paid'}
                              className={cn(
                                'flex h-4 w-4 items-center justify-center rounded border transition-colors duration-150',
                                charge.paid
                                  ? 'border-ok bg-ok'
                                  : 'border-muted-foreground hover:border-primary',
                              )}
                            >
                              {charge.paid && <CheckCircle2 className="h-3 w-3 text-background" />}
                            </button>
                            <div className="flex items-baseline gap-2">
                              <p className={cn('text-[13px] font-medium', charge.paid && 'text-muted-foreground line-through')}>
                                {charge.name}
                              </p>
                              <p className="font-mono text-[10.5px] tabular-nums text-muted-foreground">
                                {format(new Date(charge.date), 'dd MMM yyyy')}
                              </p>
                            </div>
                          </div>
                          <div className="flex items-center gap-3">
                            <span className="font-mono text-[13px] font-semibold tabular-nums">£{charge.price.toFixed(2)}</span>
                            <StatusBadge
                              tone={charge.paid ? 'ok' : 'attend'}
                              label={charge.paid ? 'Paid' : 'Pending'}
                              className="text-[10.5px]"
                            />
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-[13px] text-muted-foreground">No one-off charges</p>
                  )}
                </div>

                {/* Pending Total & Actions */}
                {clientPendingTotal > 0 && (
                  <div className="rounded-lg border border-attend/30 bg-attend/[0.06] p-3">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-[13px] font-medium text-attend">
                          Total pending: <span className="font-mono tabular-nums">£{clientPendingTotal.toFixed(2)}</span>
                        </p>
                        <p className="text-[12px] tabular-nums text-muted-foreground">
                          {clientPendingCharges.length} unpaid charge{clientPendingCharges.length !== 1 ? 's' : ''}
                        </p>
                      </div>
                      <div className="flex gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          className="h-7 gap-2 rounded-md border-border/60 px-2.5 text-xs"
                          onClick={handleSendPaymentRequest}
                        >
                          <Send className="h-3.5 w-3.5" />
                          Send reminder
                        </Button>
                        <Button
                          size="sm"
                          className="h-7 gap-2 rounded-md px-2.5 text-xs"
                          onClick={handleMarkAsPaid}
                        >
                          <CheckCircle2 className="h-3.5 w-3.5" />
                          Mark all paid
                        </Button>
                      </div>
                    </div>
                  </div>
                )}

                {/* Quick Actions */}
                <div className="flex flex-wrap gap-2">
                  <Button variant="outline" size="sm" className="h-7 gap-2 rounded-md border-border/60 px-2.5 text-xs" onClick={() => setInvoiceDialogOpen(true)}>
                    <FileText className="h-3.5 w-3.5" />
                    Create invoice
                  </Button>
                  <Button variant="outline" size="sm" className="h-7 gap-2 rounded-md border-border/60 px-2.5 text-xs" onClick={handleSendPaymentRequest}>
                    <Mail className="h-3.5 w-3.5" />
                    Request payment
                  </Button>
                  {selectedBilling.payment_status !== 'paid' && (
                    <Button variant="outline" size="sm" className="h-7 gap-2 rounded-md border-border/60 px-2.5 text-xs" onClick={handleMarkAsPaid}>
                      <CheckCircle2 className="h-3.5 w-3.5" />
                      Mark as paid
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
              <EmptyState
                title="No billing set up"
                body="This client doesn't have billing configured yet. Create a plan to start tracking their payments."
                action={{ label: 'Create billing plan', onClick: () => setDialogOpen(true) }}
              />
            ) : (
              <EmptyState
                title="Select a client"
                body="Choose a client from the list to view and manage their billing information."
              />
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default AdminBilling;
