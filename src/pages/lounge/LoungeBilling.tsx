import { useState, useEffect, useCallback, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';
import {
  CreditCard,
  Globe,
  Megaphone,
  Share2,
  Search,
  Palette,
  HeadphonesIcon,
  Check,
  Loader2,
  ShoppingCart,
  FileText,
  Download,
  Eye,
  Lock,
  Paintbrush,
  Boxes,
  PenTool,
  X,
  Settings
} from 'lucide-react';
import { format } from 'date-fns';
import PlanSelector, { PlanOption } from '@/components/billing/PlanSelector';
import CheckoutSummary from '@/components/billing/CheckoutSummary';
import WebsitePackageSelector, { WebsitePackage } from '@/components/billing/WebsitePackageSelector';
import BillingDetailsForm from '@/components/billing/BillingDetailsForm';
import OrderSummary from '@/components/billing/OrderSummary';
import CartModal from '@/components/billing/CartModal';
import { useClientPricing } from '@/hooks/useClientPricing';
import {
  PageHeader, Panel, PanelHeader, StatusBadge, EmptyState, Money, SkeletonLedger,
} from '@/components/platform';
import { cn } from '@/lib/utils';

// ─── Subscription plans ───────────────────────────────────────────────────────
interface SubPlan {
  id: string;
  name: string;
  priceId: string;
  productId: string;
  monthlyPrice: number;
  tagline: string;
  badge?: string;
  features: string[];
  tools: { icon: React.ComponentType<{ className?: string }>; label: string }[];
}

const SUBSCRIPTION_PLANS: SubPlan[] = [
  {
    id: 'professional',
    name: 'Professional',
    priceId: 'price_1T2fm9RsdRM0b4Fv9eIY9AAa',
    productId: 'prod_U0hAY0tdooMWQQ',
    monthlyPrice: 49.99,
    tagline: 'Build and manage your website with AI assistance',
    features: [
      'Visual drag-and-drop website editor',
      'AI-powered page generation from a prompt',
      'Template marketplace (50+ niches)',
      'Full site management & deployment',
      'CSS export & production-ready code',
    ],
    tools: [
      { icon: Paintbrush, label: 'Website Designer' },
    ],
  },
  {
    id: 'growth',
    name: 'Growth',
    priceId: 'price_1T2fokRsdRM0b4Fv5NPeZ2gL',
    productId: 'prod_U0hDSJBwQWaFO6',
    monthlyPrice: 99.99,
    tagline: 'Design sites and run your stock operations',
    badge: 'Most popular',
    features: [
      'Everything in Professional',
      'Real-time stock level tracking',
      'Stock movements & adjustment history',
      'Multi-location warehouse management',
      'Inventory reports & valuation',
    ],
    tools: [
      { icon: Paintbrush, label: 'Website Designer' },
      { icon: Boxes, label: 'Inventory' },
    ],
  },
  {
    id: 'enterprise',
    name: 'Enterprise',
    priceId: 'price_1T2fp1RsdRM0b4FvPQ19nd9c',
    productId: 'prod_U0hD5Vzv4N2F8H',
    monthlyPrice: 149.99,
    tagline: 'The complete Quooro toolkit: build, stock and design',
    features: [
      'Everything in Growth',
      'Professional 2D/3D CAD drafting canvas',
      'Floor plan generator & smart snap',
      'Block library & material editor',
      'Export to DXF, PDF & more',
    ],
    tools: [
      { icon: Paintbrush, label: 'Website Designer' },
      { icon: Boxes, label: 'Inventory' },
      { icon: PenTool, label: 'CAD Studio' },
    ],
  },
];


interface BillingData {
  id: string;
  plan_name: string;
  plan_price: number;
  billing_cycle: string;
  services: { name: string; included: boolean }[];
  add_ons: { name: string; price: number; active: boolean }[];
  one_off_charges: { name: string; price: number; date: string; paid: boolean }[];
  next_billing_date: string | null;
  payment_status: string;
}

// Website packages for purchase
const WEBSITE_PACKAGES: WebsitePackage[] = [
  {
    id: 'starter-site',
    name: 'Starter Website',
    price: 499,
    description: 'Perfect for small businesses and personal brands',
    pages: '1-5 pages',
    features: [
      'Custom responsive design',
      'Contact form integration',
      'Basic SEO setup',
      'Mobile optimized',
      '2 revision rounds'
    ]
  },
  {
    id: 'business-site',
    name: 'Business Website',
    price: 999,
    description: 'Ideal for growing businesses',
    pages: '5-10 pages',
    features: [
      'Everything in Starter',
      'Blog or news section',
      'Google Analytics setup',
      'Social media integration',
      '3 revision rounds',
      'Content management system'
    ],
    popular: true
  },
  {
    id: 'premium-site',
    name: 'Premium Website',
    price: 1999,
    description: 'For established businesses needing more',
    pages: '10-20 pages',
    features: [
      'Everything in Business',
      'Advanced animations',
      'Custom integrations',
      'Priority development',
      'Unlimited revisions',
      'Training session included'
    ]
  },
  {
    id: 'ecommerce-site',
    name: 'E-commerce Website',
    price: 2999,
    description: 'Full online store solution',
    pages: 'Unlimited products',
    features: [
      'Complete store setup',
      'Payment gateway integration',
      'Inventory management',
      'Order tracking system',
      'Customer accounts',
      'Email automation'
    ]
  }
];

// Monthly management plans
const PLANS: PlanOption[] = [
  {
    id: 'starter',
    name: 'Starter',
    price: 49,
    description: 'Basic maintenance',
    features: [
      'Hosting included',
      'SSL Certificate',
      'Monthly updates (2)',
      'Email support',
      'Weekly backups'
    ]
  },
  {
    id: 'professional',
    name: 'Professional',
    price: 149,
    description: 'Active management',
    features: [
      'Everything in Starter',
      'Priority support',
      'Weekly updates',
      'SEO optimization',
      'Analytics dashboard',
      'Performance monitoring'
    ],
    popular: true
  },
  {
    id: 'growth',
    name: 'Growth',
    price: 299,
    description: 'Scale your business',
    features: [
      'Everything in Professional',
      'Unlimited updates',
      'Dedicated account manager',
      'A/B testing',
      'Advanced analytics',
      'Priority queue'
    ]
  },
  {
    id: 'enterprise',
    name: 'Enterprise',
    price: 599,
    description: 'Full service',
    features: [
      'Everything in Growth',
      'Custom development',
      '24/7 support',
      'SLA guarantee',
      'White-label options',
      'API access'
    ]
  }
];

// Available add-ons
const AVAILABLE_ADDONS = [
  {
    id: 'ad-management',
    name: 'Ad Management',
    description: 'Facebook, Google & TikTok campaigns',
    price: 199,
    icon: Megaphone,
    features: ['Campaign setup', 'Monthly optimization', 'Performance reports']
  },
  {
    id: 'social-media',
    name: 'Social Media',
    description: 'Content creation & scheduling',
    price: 149,
    icon: Share2,
    features: ['3 platforms', '12 posts/month', 'Engagement tracking']
  },
  {
    id: 'seo',
    name: 'SEO Strategy',
    description: 'Improve search rankings',
    price: 199,
    icon: Search,
    features: ['Keyword research', 'On-page SEO', 'Monthly reports']
  },
  {
    id: 'branding',
    name: 'Branding & Design',
    description: 'Logo, graphics & assets',
    price: 99,
    icon: Palette,
    features: ['Logo refresh', 'Social graphics', 'Brand guidelines']
  },
  {
    id: 'support-plus',
    name: 'Priority Support',
    description: '24/7 dedicated agent',
    price: 49,
    icon: HeadphonesIcon,
    features: ['24/7 availability', 'Dedicated agent', '1-hour response']
  }
];

const LoungeBilling = () => {
  const { user, session } = useAuth();
  const [billing, setBilling] = useState<BillingData | null>(null);
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState(false);
  const [activeTab, setActiveTab] = useState('my-pricing');
  const [checkoutStep, setCheckoutStep] = useState<'selection' | 'billing'>('selection');
  const [cartModalOpen, setCartModalOpen] = useState(false);

  // Subscription states
  const [subLoading, setSubLoading] = useState(true);
  const [activeSubIds, setActiveSubIds] = useState<Set<string>>(new Set());
  const [checkoutLoadingId, setCheckoutLoadingId] = useState<string | null>(null);
  const [portalLoading, setPortalLoading] = useState(false);

  // Fetch client-specific pricing
  const {
    pricing: customPricing,
    pricingByType,
    invoices: customInvoices,
    contracts,
    teamInfo,
    loading: pricingLoading,
    canViewBilling,
    recurringTotal,
    oneTimeTotal
  } = useClientPricing();

  // Hide all speculative pricing until an admin has assigned pricing for this team
  const hidePrices = !pricingLoading && (!customPricing || customPricing.length === 0);

  // Checkout selections
  const [selectedWebsite, setSelectedWebsite] = useState<string | null>(null);
  const [selectedPlan, setSelectedPlan] = useState('starter');
  const [selectedAddons, setSelectedAddons] = useState<Set<string>>(new Set());

  // Auto-save debounce ref
  const autoSaveTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const hasInitializedRef = useRef(false);

  // Load subscription statuses for all plans
  useEffect(() => {
    if (!user) return;
    (async () => {
      setSubLoading(true);
      const results = await Promise.all(
        SUBSCRIPTION_PLANS.map(async (plan) => {
          try {
            const { data } = await supabase.functions.invoke('check-subscriptions-plan', {
              headers: { Authorization: `Bearer ${session?.access_token}` },
              body: { productId: plan.productId },
            });
            return data?.subscribed ? plan.productId : null;
          } catch { return null; }
        })
      );
      setActiveSubIds(new Set(results.filter(Boolean) as string[]));
      setSubLoading(false);
    })();
  }, [user]);

  const handleSubCheckout = async (plan: SubPlan) => {
    setCheckoutLoadingId(plan.id);
    try {
      const { data, error } = await supabase.functions.invoke('create-subscriptions-checkout', {
        headers: { Authorization: `Bearer ${session?.access_token}` },
        body: { priceId: plan.priceId },
      });
      if (error) throw new Error(error.message);
      if (data?.url) window.open(data.url, '_blank');
    } catch {
      toast.error('Checkout did not start. Try again.');
    } finally {
      setCheckoutLoadingId(null);
    }
  };

  const handleManageSubscriptions = async () => {
    setPortalLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke('subscriptions-customer-portal', {
        headers: { Authorization: `Bearer ${session?.access_token}` },
      });
      if (error) throw new Error(error.message);
      if (data?.url) window.open(data.url, '_blank');
    } catch {
      toast.error('The subscription portal did not open. Message the studio if it keeps happening.');
    } finally {
      setPortalLoading(false);
    }
  };

  useEffect(() => {
    if (user) {
      fetchBilling();
    }
  }, [user]);


  const fetchBilling = async () => {
    try {
      const { data, error } = await supabase
        .from('client_billing')
        .select('*')
        .eq('user_id', user?.id)
        .maybeSingle();

      if (error) throw error;

      if (data) {
        const billingData = {
          ...data,
          services: (data.services as { name: string; included: boolean }[]) || [],
          add_ons: (data.add_ons as { name: string; price: number; active: boolean }[]) || [],
          one_off_charges: (data.one_off_charges as { name: string; price: number; date: string; paid: boolean }[]) || []
        };
        setBilling(billingData);

        // Set initial selections based on current billing
        const plan = PLANS.find(p => p.name === data.plan_name);
        if (plan) setSelectedPlan(plan.id);

        const activeAddons = new Set(
          billingData.add_ons.filter(a => a.active).map(a => {
            const addon = AVAILABLE_ADDONS.find(aa => aa.name === a.name);
            return addon?.id || '';
          }).filter(Boolean)
        );
        setSelectedAddons(activeAddons);
      }
    } catch (error) {
      console.error('Error fetching billing:', error);
      toast.error('Your billing details did not load. Refresh to try again.');
    } finally {
      setLoading(false);
    }
  };

  // Auto-save to cart when selections change
  const autoSaveToCart = useCallback(async () => {
    if (!user || !hasInitializedRef.current) return;

    const plan = PLANS.find(p => p.id === selectedPlan)!;
    const addons = Array.from(selectedAddons).map(id => {
      const addon = AVAILABLE_ADDONS.find(a => a.id === id)!;
      return { name: addon.name, price: addon.price, active: true };
    });

    // Add website as one-off charge if selected
    const existingCharges = billing?.one_off_charges || [];
    let oneOffCharges = [...existingCharges];

    if (selectedWebsite) {
      const websitePkg = WEBSITE_PACKAGES.find(p => p.id === selectedWebsite);
      if (websitePkg) {
        const existingWebsite = oneOffCharges.find(c => c.name.includes('Website'));
        if (!existingWebsite) {
          oneOffCharges.push({
            name: websitePkg.name,
            price: websitePkg.price,
            date: new Date().toISOString().split('T')[0],
            paid: false
          });
        }
      }
    }

    try {
      if (billing) {
        await supabase
          .from('client_billing')
          .update({
            plan_name: plan.name,
            plan_price: plan.price,
            add_ons: addons,
            one_off_charges: oneOffCharges,
            payment_status: 'pending'
          })
          .eq('id', billing.id);
      } else {
        await supabase
          .from('client_billing')
          .insert({
            user_id: user.id,
            plan_name: plan.name,
            plan_price: plan.price,
            add_ons: addons,
            services: [],
            one_off_charges: oneOffCharges,
            payment_status: 'pending'
          });
        // Refresh billing after insert
        fetchBilling();
      }
    } catch (error) {
      console.error('Auto-save error:', error);
    }
  }, [user, selectedPlan, selectedAddons, selectedWebsite, billing]);

  // Debounced auto-save effect
  useEffect(() => {
    if (!hasInitializedRef.current) return;

    if (autoSaveTimeoutRef.current) {
      clearTimeout(autoSaveTimeoutRef.current);
    }

    autoSaveTimeoutRef.current = setTimeout(() => {
      autoSaveToCart();
    }, 1500); // 1.5 second debounce

    return () => {
      if (autoSaveTimeoutRef.current) {
        clearTimeout(autoSaveTimeoutRef.current);
      }
    };
  }, [selectedPlan, selectedAddons, selectedWebsite, autoSaveToCart]);

  // Mark as initialized after first load
  useEffect(() => {
    if (!loading && user) {
      // Small delay to prevent immediate auto-save on initial load
      const timer = setTimeout(() => {
        hasInitializedRef.current = true;
      }, 500);
      return () => clearTimeout(timer);
    }
  }, [loading, user]);

  const toggleAddon = (addonId: string) => {
    setSelectedAddons(prev => {
      const next = new Set(prev);
      if (next.has(addonId)) {
        next.delete(addonId);
      } else {
        next.add(addonId);
      }
      return next;
    });
  };

  const handlePayNow = async () => {
    setProcessing(true);
    toast.info('Card payment is coming soon. Message the studio to arrange payment.');
    setTimeout(() => setProcessing(false), 2000);
  };

  const handleSaveForLater = async () => {
    if (!user) return;

    setProcessing(true);
    try {
      const plan = PLANS.find(p => p.id === selectedPlan)!;
      const addons = Array.from(selectedAddons).map(id => {
        const addon = AVAILABLE_ADDONS.find(a => a.id === id)!;
        return { name: addon.name, price: addon.price, active: true };
      });

      // Add website as one-off charge if selected
      const existingCharges = billing?.one_off_charges || [];
      let oneOffCharges = [...existingCharges];

      if (selectedWebsite) {
        const websitePkg = WEBSITE_PACKAGES.find(p => p.id === selectedWebsite);
        if (websitePkg) {
          // Check if website is already in charges
          const existingWebsite = oneOffCharges.find(c => c.name.includes('Website'));
          if (!existingWebsite) {
            oneOffCharges.push({
              name: websitePkg.name,
              price: websitePkg.price,
              date: new Date().toISOString().split('T')[0],
              paid: false
            });
          }
        }
      }

      if (billing) {
        const { error } = await supabase
          .from('client_billing')
          .update({
            plan_name: plan.name,
            plan_price: plan.price,
            add_ons: addons,
            one_off_charges: oneOffCharges,
            payment_status: 'pending'
          })
          .eq('id', billing.id);

        if (error) throw error;
      } else {
        const { error } = await supabase
          .from('client_billing')
          .insert({
            user_id: user.id,
            plan_name: plan.name,
            plan_price: plan.price,
            add_ons: addons,
            services: [],
            one_off_charges: oneOffCharges,
            payment_status: 'pending'
          });

        if (error) throw error;
      }

      toast.success('Selections saved. Complete payment when you are ready.');
      fetchBilling();
    } catch (error) {
      console.error('Error saving:', error);
      toast.error('Your selections did not save. Try again.');
    } finally {
      setProcessing(false);
    }
  };

  // Calculate totals
  const selectedWebsitePkg = WEBSITE_PACKAGES.find(p => p.id === selectedWebsite);
  const websitePrice = selectedWebsitePkg?.price || 0;

  const selectedPlanData = PLANS.find(p => p.id === selectedPlan);
  const planPrice = selectedPlanData?.price || 0;

  const addonsTotal = Array.from(selectedAddons).reduce((sum, id) => {
    const addon = AVAILABLE_ADDONS.find(a => a.id === id);
    return sum + (addon?.price || 0);
  }, 0);

  const pendingCharges = billing?.one_off_charges.filter(c => !c.paid) || [];
  const oneOffTotal = pendingCharges.reduce((sum, c) => sum + c.price, 0);

  // Build checkout items
  const checkoutItems = [
    // Website (if selected)
    ...(selectedWebsitePkg ? [{
      id: selectedWebsitePkg.id,
      name: selectedWebsitePkg.name,
      price: selectedWebsitePkg.price,
      type: 'website' as const
    }] : []),
    // Plan
    {
      id: selectedPlanData?.id || 'plan',
      name: `${selectedPlanData?.name || 'No Plan'} Plan`,
      price: planPrice,
      type: 'plan' as const
    },
    // Addons
    ...Array.from(selectedAddons).map(id => {
      const addon = AVAILABLE_ADDONS.find(a => a.id === id)!;
      return {
        id: addon.id,
        name: addon.name,
        price: addon.price,
        type: 'addon' as const
      };
    }),
    // Pending one-off charges from billing
    ...pendingCharges.map(c => ({
      id: `charge-${c.name}`,
      name: c.name,
      price: c.price,
      type: 'one-off' as const
    }))
  ];

  const paymentStatus = billing?.payment_status === 'paid'
    ? 'paid'
    : billing?.payment_status === 'pending'
      ? 'waiting'
      : 'none';

  // Build order items for summary
  const orderItems = [
    ...(selectedWebsitePkg ? [{
      id: selectedWebsitePkg.id,
      name: selectedWebsitePkg.name,
      price: selectedWebsitePkg.price,
      recurring: false
    }] : []),
    {
      id: selectedPlanData?.id || 'plan',
      name: `${selectedPlanData?.name || 'No Plan'} Plan`,
      price: planPrice,
      recurring: true
    },
    ...Array.from(selectedAddons).map(id => {
      const addon = AVAILABLE_ADDONS.find(a => a.id === id)!;
      return {
        id: addon.id,
        name: addon.name,
        price: addon.price,
        recurring: true
      };
    }),
    ...pendingCharges.map(c => ({
      id: `charge-${c.name}`,
      name: c.name,
      price: c.price,
      recurring: false
    }))
  ];

  const totalDue = websitePrice + planPrice + addonsTotal + oneOffTotal;
  const hasSelections = selectedWebsite || selectedAddons.size > 0;

  if (loading) {
    return (
      <div className="mx-auto max-w-[1024px] px-5 py-7 lg:px-8" aria-hidden>
        <span className="block h-5 w-40 animate-pulse rounded bg-foreground/[0.06]" />
        <span className="mt-2 block h-3.5 w-72 animate-pulse rounded bg-foreground/[0.05]" />
        <div className="mt-6 grid gap-4 lg:grid-cols-[1fr_320px]">
          <div className="rounded-[10px] border border-border/60"><SkeletonLedger rows={6} /></div>
          <div className="rounded-[10px] border border-border/60"><SkeletonLedger rows={4} /></div>
        </div>
      </div>
    );
  }

  // Checkout step: billing details form
  if (checkoutStep === 'billing') {
    return (
      <div className="mx-auto max-w-[1024px] px-5 py-7 lg:px-8">
        <PageHeader
          kicker="Secure checkout"
          title="Complete your order"
          description="Enter your billing details to complete the purchase"
        />

        <div className="mt-6 grid grid-cols-1 gap-6 lg:grid-cols-3">
          {/* Billing form */}
          <div className="lg:col-span-2">
            <BillingDetailsForm
              onBack={() => setCheckoutStep('selection')}
              onSubmit={async (details) => {
                setProcessing(true);
                // Save and process payment
                await handleSaveForLater();
                toast.info('Card payment is coming soon. Your order has been saved.');
                setCheckoutStep('selection');
                setProcessing(false);
              }}
              isLoading={processing}
              initialData={{
                email: user?.email || ''
              }}
            />
          </div>

          {/* Order summary */}
          <div className="lg:col-span-1">
            <OrderSummary items={orderItems} />
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-[1024px] px-5 py-7 lg:px-8">
      <div>
        {/* Cart modal */}
        <CartModal
          items={checkoutItems}
          isOpen={cartModalOpen}
          onOpenChange={setCartModalOpen}
          onCheckout={() => setCheckoutStep('billing')}
          onRemoveItem={(id) => {
            // Handle removing items
            if (id.startsWith('charge-')) return; // Can't remove pending charges
            const pkg = WEBSITE_PACKAGES.find(p => p.id === id);
            if (pkg) {
              setSelectedWebsite(null);
              return;
            }
            const plan = PLANS.find(p => p.id === id);
            if (plan) return; // Can't remove plan, only change it
            setSelectedAddons(prev => {
              const next = new Set(prev);
              next.delete(id);
              return next;
            });
          }}
          onClearCart={() => {
            setSelectedWebsite(null);
            setSelectedAddons(new Set());
          }}
        />

        {/* Header */}
        <PageHeader
          kicker="Client portal"
          title="Plan and billing"
          description="Your pricing, subscriptions, invoices and payment history"
          actions={
            <Button
              variant="outline"
              size="sm"
              className="relative h-8 gap-1.5 rounded-lg px-3 text-xs"
              onClick={() => setCartModalOpen(true)}
            >
              <ShoppingCart className="h-3.5 w-3.5" />
              <span className="hidden sm:inline">View cart</span>
              {checkoutItems.length > 0 && (
                <span className="font-mono text-[10.5px] tabular-nums text-muted-foreground">
                  {checkoutItems.length}
                </span>
              )}
            </Button>
          }
        />

        {/* Payment pending banner */}
        {billing?.payment_status === 'pending' && (
          <div className="mt-5 flex flex-wrap items-center justify-between gap-3 rounded-[10px] border border-border/60 bg-card p-4">
            <div className="flex items-center gap-3">
              <StatusBadge tone="attend" label="Payment awaiting" />
              <p className="text-[13px] text-muted-foreground">
                Complete your payment to activate all services
              </p>
            </div>
            <Button
              className="h-8 gap-1.5 rounded-lg px-3 text-xs"
              onClick={() => setCheckoutStep('billing')}
              disabled={processing}
            >
              <CreditCard className="h-3.5 w-3.5" />
              Proceed to checkout
            </Button>
          </div>
        )}

        <div className="mt-5 grid grid-cols-1 gap-6 lg:grid-cols-3">
          {/* Main content */}
          <div className="space-y-6 lg:col-span-2">
            {/* Checkout summary: top on mobile, right on desktop */}
            <div className="lg:hidden">
              <CheckoutSummary
                items={checkoutItems}
                paymentStatus={paymentStatus}
                onPayNow={() => setCheckoutStep('billing')}
                onSaveForLater={handleSaveForLater}
                onSaveToCart={handleSaveForLater}
                isLoading={processing}
                showCheckoutButton={totalDue > 0 && !hidePrices}
                hidePrices={hidePrices}
              />
            </div>

            <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
              <TabsList className="h-9 w-full justify-start gap-1 overflow-x-auto rounded-none border-b border-border/60 bg-transparent p-0">
                <TabsTrigger value="my-pricing" className="rounded-none border-b-2 border-transparent px-3 text-[13px] data-[state=active]:border-primary data-[state=active]:bg-transparent data-[state=active]:shadow-none">
                  My pricing
                </TabsTrigger>
                <TabsTrigger value="subscriptions" className="rounded-none border-b-2 border-transparent px-3 text-[13px] data-[state=active]:border-primary data-[state=active]:bg-transparent data-[state=active]:shadow-none">
                  Subscriptions
                </TabsTrigger>
                <TabsTrigger value="checkout" className="rounded-none border-b-2 border-transparent px-3 text-[13px] data-[state=active]:border-primary data-[state=active]:bg-transparent data-[state=active]:shadow-none">
                  Checkout
                </TabsTrigger>
                <TabsTrigger value="invoices" className="rounded-none border-b-2 border-transparent px-3 text-[13px] data-[state=active]:border-primary data-[state=active]:bg-transparent data-[state=active]:shadow-none">
                  Invoices
                </TabsTrigger>
                <TabsTrigger value="history" className="rounded-none border-b-2 border-transparent px-3 text-[13px] data-[state=active]:border-primary data-[state=active]:bg-transparent data-[state=active]:shadow-none">
                  History
                </TabsTrigger>
              </TabsList>


              {/* ── Subscriptions tab ─────────────────────────────────── */}
              <TabsContent value="subscriptions" className="space-y-4">
                <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                  <div>
                    <h2 className="text-[15px] font-semibold tracking-[-0.01em]">Platform subscriptions</h2>
                    <p className="mt-0.5 text-[13px] text-muted-foreground">
                      Each plan includes a free first month. Cancel any time.
                    </p>
                  </div>
                  {activeSubIds.size > 0 && (
                    <Button
                      variant="outline"
                      size="sm"
                      className="h-8 shrink-0 gap-1.5 rounded-lg px-3 text-xs"
                      onClick={handleManageSubscriptions}
                      disabled={portalLoading}
                    >
                      {portalLoading ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Settings className="h-3.5 w-3.5" />}
                      Manage subscriptions
                    </Button>
                  )}
                </div>

                {/* Free trial note */}
                <div className="rounded-[10px] border border-border/60 bg-card p-4">
                  <p className="text-sm font-medium text-foreground">First month free on all plans</p>
                  <p className="mt-0.5 text-xs text-muted-foreground">Nothing is charged until your trial ends. Cancel any time from the billing portal.</p>
                </div>

                {/* Plan cards */}
                {subLoading ? (
                  <div className="grid grid-cols-1 gap-4" aria-hidden>
                    {[...Array(3)].map((_, i) => (
                      <div key={i} className="h-56 animate-pulse rounded-[10px] border border-border/60 bg-foreground/[0.03]" />
                    ))}
                  </div>
                ) : (
                  <div className="grid grid-cols-1 gap-4">
                    {SUBSCRIPTION_PLANS.map((plan) => {
                      const isActive = activeSubIds.has(plan.productId);
                      const isLoadingThis = checkoutLoadingId === plan.id;
                      return (
                        <div
                          key={plan.id}
                          className={cn(
                            'overflow-hidden rounded-[10px] border transition-colors duration-150',
                            isActive ? 'border-primary/40' : 'border-border/60 hover:border-border',
                          )}
                        >
                          <div className="border-b border-border/60 bg-sunken px-5 pb-4 pt-5">
                            <div className="flex items-start justify-between gap-4">
                              <div className="space-y-1.5">
                                <div className="flex flex-wrap items-center gap-3">
                                  <span className="text-[15px] font-semibold tracking-[-0.01em]">{plan.name}</span>
                                  {plan.badge && (
                                    <StatusBadge tone="accent" label={plan.badge} />
                                  )}
                                  {isActive && (
                                    <StatusBadge tone="ok" label="Active" />
                                  )}
                                </div>
                                <p className="max-w-sm text-[13px] text-muted-foreground">{plan.tagline}</p>
                                {/* Tool chips */}
                                <div className="flex flex-wrap items-center gap-2 pt-1">
                                  {plan.tools.map((t) => {
                                    const TIcon = t.icon;
                                    return (
                                      <span key={t.label} className="inline-flex items-center gap-1.5 rounded-full border border-border/60 px-2.5 py-1 text-[12px] font-medium text-muted-foreground">
                                        <TIcon className="h-3.5 w-3.5" />
                                        {t.label}
                                      </span>
                                    );
                                  })}
                                </div>
                              </div>
                              {/* Pricing */}
                              <div className="shrink-0 text-right">
                                <div className="mb-0.5 text-xs text-muted-foreground line-through">
                                  <Money value={plan.monthlyPrice} />/mo
                                </div>
                                <div className="text-xl font-semibold tracking-tight text-foreground">Free</div>
                                <div className="text-xs text-muted-foreground">first month</div>
                                <div className="mt-1 text-xs tabular-nums text-muted-foreground">then <Money value={plan.monthlyPrice} />/mo</div>
                              </div>
                            </div>
                          </div>

                          {/* Features + CTA */}
                          <div className="flex flex-col gap-5 bg-card px-5 py-4 sm:flex-row sm:items-center">
                            <ul className="grid flex-1 grid-cols-1 gap-x-4 gap-y-1.5 sm:grid-cols-2">
                              {plan.features.map((f) => (
                                <li key={f} className="flex items-start gap-2 text-[13px] text-muted-foreground">
                                  <Check className="mt-0.5 h-3.5 w-3.5 shrink-0 text-foreground/50" />
                                  {f}
                                </li>
                              ))}
                            </ul>
                            <div className="flex min-w-[160px] shrink-0 flex-col gap-2">
                              {isActive ? (
                                <>
                                  <div className="flex items-center justify-center rounded-lg border border-border/60 px-4 py-2">
                                    <StatusBadge tone="ok" label="Subscribed" />
                                  </div>
                                  <Button
                                    variant="outline"
                                    size="sm"
                                    className="h-8 w-full gap-1.5 rounded-lg text-xs text-destructive hover:text-destructive"
                                    onClick={handleManageSubscriptions}
                                    disabled={portalLoading}
                                  >
                                    {portalLoading ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <X className="h-3.5 w-3.5" />}
                                    Cancel plan
                                  </Button>
                                </>
                              ) : (
                                <Button
                                  className="h-8 w-full gap-1.5 rounded-lg text-xs"
                                  onClick={() => handleSubCheckout(plan)}
                                  disabled={isLoadingThis}
                                >
                                  {isLoadingThis ? (
                                    <Loader2 className="h-3.5 w-3.5 animate-spin" />
                                  ) : (
                                    'Start free month'
                                  )}
                                </Button>
                              )}
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}

                {/* Cancel note */}
                <p className="text-center text-xs text-muted-foreground">
                  Subscriptions are billed monthly after the free trial. Cancel any time via{' '}
                  <button onClick={handleManageSubscriptions} className="font-medium underline underline-offset-2 transition-colors duration-150 hover:text-foreground">
                    the billing portal
                  </button>. No hidden fees.
                </p>
              </TabsContent>

              {/* My pricing tab: client-specific pricing */}
              <TabsContent value="my-pricing" className="space-y-4">
                {pricingLoading ? (
                  <div className="rounded-[10px] border border-border/60" aria-hidden>
                    <SkeletonLedger rows={5} />
                  </div>
                ) : !canViewBilling ? (
                  <Panel>
                    <EmptyState
                      title="Billing access is restricted"
                      body="You don't have permission to view billing information. Ask your account owner for access."
                    />
                  </Panel>
                ) : customPricing.length === 0 ? (
                  <Panel>
                    <EmptyState
                      title="No custom pricing yet"
                      body="Your pricing appears here once the studio has set it up. In the meantime, browse the standard packages."
                      action={{ label: 'View standard packages', onClick: () => setActiveTab('checkout') }}
                    />
                  </Panel>
                ) : (
                  <>
                    {/* Totals */}
                    <Panel>
                      <div className="grid grid-cols-3 divide-x divide-border/60">
                        <div className="px-4 py-3">
                          <p className="font-mono text-[10px] font-medium uppercase tracking-[0.14em] text-muted-foreground">Monthly recurring</p>
                          <p className="mt-1 text-lg font-semibold tabular-nums"><Money value={recurringTotal} whole /></p>
                        </div>
                        <div className="px-4 py-3">
                          <p className="font-mono text-[10px] font-medium uppercase tracking-[0.14em] text-muted-foreground">One-time charges</p>
                          <p className="mt-1 text-lg font-semibold tabular-nums"><Money value={oneTimeTotal} whole /></p>
                        </div>
                        <div className="px-4 py-3">
                          <p className="font-mono text-[10px] font-medium uppercase tracking-[0.14em] text-muted-foreground">Active services</p>
                          <p className="mt-1 text-lg font-semibold tabular-nums">{customPricing.length}</p>
                        </div>
                      </div>
                    </Panel>

                    {/* Pricing by category */}
                    {Object.entries(pricingByType).map(([type, items]) => (
                      <Panel key={type}>
                        <PanelHeader label={`${type.replace(/_/g, ' ')} services`} />
                        <div>
                          {items.map((item) => (
                            <div
                              key={item.id}
                              className="flex items-center justify-between gap-4 border-t border-border/60 px-4 py-2.5 first:border-t-0"
                            >
                              <div className="min-w-0">
                                <p className="truncate text-[13px] font-[450] text-foreground">{item.service_name}</p>
                                {item.description && (
                                  <p className="truncate text-[11.5px] text-muted-foreground">{item.description}</p>
                                )}
                              </div>
                              <div className="flex shrink-0 items-center gap-3">
                                <span className="text-[13px] font-[550] tabular-nums">
                                  <Money value={item.negotiated_price} whole />
                                  {item.is_recurring && (
                                    <span className="text-xs font-normal text-muted-foreground">/{item.billing_frequency || 'mo'}</span>
                                  )}
                                </span>
                                <StatusBadge
                                  tone={item.is_recurring ? 'accent' : 'neutral'}
                                  label={item.is_recurring ? 'Recurring' : 'One-time'}
                                />
                              </div>
                            </div>
                          ))}
                        </div>
                      </Panel>
                    ))}

                    {/* Contracts */}
                    {contracts.length > 0 && (
                      <Panel>
                        <PanelHeader label="Contracts and documents" />
                        <div>
                          {contracts.map((contract) => (
                            <div
                              key={contract.id}
                              className="flex items-center justify-between gap-4 border-t border-border/60 px-4 py-2.5 first:border-t-0"
                            >
                              <div className="flex min-w-0 items-center gap-3">
                                <FileText className="h-4 w-4 shrink-0 text-muted-foreground" />
                                <div className="min-w-0">
                                  <p className="truncate text-[13px] font-[450] text-foreground">{contract.title}</p>
                                  <p className="text-[11.5px] text-muted-foreground">
                                    {contract.signed_at
                                      ? `Signed ${format(new Date(contract.signed_at), 'd MMM yyyy')}`
                                      : contract.status
                                    }
                                  </p>
                                </div>
                              </div>
                              <div className="flex shrink-0 items-center gap-2">
                                <StatusBadge status={contract.status} />
                                {contract.document_url && (
                                  <Button variant="ghost" size="sm" asChild>
                                    <a href={contract.document_url} target="_blank" rel="noopener noreferrer" aria-label="View contract">
                                      <Eye className="h-4 w-4" />
                                    </a>
                                  </Button>
                                )}
                              </div>
                            </div>
                          ))}
                        </div>
                      </Panel>
                    )}
                  </>
                )}
              </TabsContent>

              {/* Invoices tab */}
              <TabsContent value="invoices" className="space-y-4">
                {pricingLoading ? (
                  <div className="rounded-[10px] border border-border/60" aria-hidden>
                    <SkeletonLedger rows={4} />
                  </div>
                ) : !canViewBilling ? (
                  <Panel>
                    <EmptyState
                      title="Invoice access is restricted"
                      body="You don't have permission to view invoices. Ask your account owner for access."
                    />
                  </Panel>
                ) : customInvoices.length === 0 ? (
                  <Panel>
                    <EmptyState
                      title="No invoices yet"
                      body="Your invoices appear here once they've been generated."
                    />
                  </Panel>
                ) : (
                  <Panel>
                    <PanelHeader label="Invoices" />
                    <div>
                      {customInvoices.map((invoice) => (
                        <div
                          key={invoice.id}
                          className="flex items-center justify-between gap-4 border-t border-border/60 px-4 py-2.5 first:border-t-0"
                        >
                          <div className="min-w-0">
                            <p className="truncate font-mono text-xs text-foreground">{invoice.invoice_number}</p>
                            <p className="font-mono text-[10.5px] tabular-nums text-muted-foreground">
                              {format(new Date(invoice.created_at), 'd MMM yyyy')}
                              {invoice.due_date && ` · due ${format(new Date(invoice.due_date), 'd MMM yyyy')}`}
                            </p>
                          </div>
                          <div className="flex shrink-0 items-center gap-3">
                            <span className="text-[13px] font-[550] tabular-nums"><Money value={invoice.total_amount} whole /></span>
                            <StatusBadge status={invoice.status || 'pending'} />
                            <Button variant="ghost" size="sm" aria-label="Download invoice">
                              <Download className="h-4 w-4" />
                            </Button>
                          </div>
                        </div>
                      ))}
                    </div>
                  </Panel>
                )}
              </TabsContent>

              {/* Checkout tab */}
              <TabsContent value="checkout" className="space-y-6">
                {/* Website selection */}
                <div>
                  <div className="mb-3 flex items-center gap-2">
                    <h2 className="text-[13.5px] font-[550] tracking-[-0.01em]">1. Choose your website</h2>
                    {selectedWebsite && (
                      <StatusBadge tone="accent" label="Selected" className="ml-auto" />
                    )}
                  </div>
                  <WebsitePackageSelector
                    packages={WEBSITE_PACKAGES}
                    selectedPackage={selectedWebsite}
                    onSelectPackage={setSelectedWebsite}
                  />
                  {!selectedWebsite && (
                    <p className="mt-2 text-center text-xs text-muted-foreground">
                      Skip this step if you already have a website with us
                    </p>
                  )}
                </div>

                {/* Plan selection */}
                <div>
                  <div className="mb-3 flex items-center gap-2">
                    <h2 className="text-[13.5px] font-[550] tracking-[-0.01em]">2. Select a management plan</h2>
                    <StatusBadge tone="neutral" label={selectedPlanData?.name ?? ''} className="ml-auto" />
                  </div>
                  <PlanSelector
                    plans={PLANS}
                    selectedPlan={selectedPlan}
                    onSelectPlan={setSelectedPlan}
                  />
                </div>

                {/* Add-ons */}
                <div>
                  <div className="mb-3 flex items-center gap-2">
                    <h2 className="text-[13.5px] font-[550] tracking-[-0.01em]">3. Add extras</h2>
                    {selectedAddons.size > 0 && (
                      <StatusBadge tone="accent" label={`${selectedAddons.size} selected`} className="ml-auto" />
                    )}
                  </div>

                  <div className="grid grid-cols-2 gap-3 md:grid-cols-3 lg:grid-cols-5">
                    {AVAILABLE_ADDONS.map((addon) => {
                      const Icon = addon.icon;
                      const isActive = selectedAddons.has(addon.id);

                      return (
                        <div
                          key={addon.id}
                          role="button"
                          tabIndex={0}
                          className={cn(
                            'cursor-pointer rounded-[10px] border p-3 transition-colors duration-150',
                            isActive
                              ? 'border-primary bg-primary/[0.04]'
                              : 'border-border/60 hover:border-border hover:bg-foreground/[0.02]',
                          )}
                          onClick={() => toggleAddon(addon.id)}
                        >
                          <div className="mb-2 flex items-center justify-between">
                            <Icon className={cn('h-4 w-4', isActive ? 'text-primary' : 'text-muted-foreground')} />
                            <Switch
                              checked={isActive}
                              onCheckedChange={() => toggleAddon(addon.id)}
                              onClick={(e) => e.stopPropagation()}
                              className="scale-75"
                            />
                          </div>

                          <h3 className="mb-0.5 truncate text-[13px] font-[550]">{addon.name}</h3>
                          <div className="flex items-baseline gap-0.5">
                            {hidePrices ? (
                              <span className="text-sm font-[550] text-muted-foreground">Custom quote</span>
                            ) : (
                              <>
                                <span className="text-[15px] font-semibold tabular-nums"><Money value={addon.price} whole /></span>
                                <span className="text-xs text-muted-foreground">/mo</span>
                              </>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </TabsContent>

              {/* Website tab: full package view */}
              <TabsContent value="website" className="space-y-4">
                <Panel>
                  <PanelHeader label="Website packages" />
                  <div className="p-4">
                    <p className="mb-4 text-[13px] text-muted-foreground">
                      Choose the website package that fits your business. Every package includes responsive design, SEO basics and SSL.
                    </p>
                    <WebsitePackageSelector
                      packages={WEBSITE_PACKAGES}
                      selectedPackage={selectedWebsite}
                      onSelectPackage={setSelectedWebsite}
                    />
                  </div>
                </Panel>
              </TabsContent>

              {/* History tab */}
              <TabsContent value="history" className="space-y-4">
                <Panel>
                  <PanelHeader label="Payment history" />
                  {billing?.one_off_charges && billing.one_off_charges.length > 0 ? (
                    <div>
                      {billing.one_off_charges.map((charge, index) => (
                        <div
                          key={index}
                          className="flex items-center justify-between gap-4 border-t border-border/60 px-4 py-2.5 first:border-t-0"
                        >
                          <div className="min-w-0">
                            <p className="truncate text-[13px] font-[450] text-foreground">{charge.name}</p>
                            <p className="font-mono text-[10.5px] tabular-nums text-muted-foreground">
                              {format(new Date(charge.date), 'd MMM yyyy')}
                            </p>
                          </div>
                          <div className="flex shrink-0 items-center gap-3">
                            <span className="text-[13px] font-[550] tabular-nums"><Money value={charge.price} whole /></span>
                            <StatusBadge tone={charge.paid ? 'ok' : 'attend'} label={charge.paid ? 'Paid' : 'Pending'} />
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <EmptyState
                      compact
                      title="No payment history yet"
                      body="Charges appear here as they're raised and paid."
                    />
                  )}
                </Panel>

                {/* Current subscription */}
                {billing && (
                  <Panel>
                    <PanelHeader label="Current subscription" />
                    <div>
                      <div className="flex items-center justify-between gap-4 px-4 py-2.5">
                        <div>
                          <p className="text-[13px] font-[450] text-foreground">{billing.plan_name} plan</p>
                          <p className="text-[11.5px] text-muted-foreground">Monthly subscription</p>
                        </div>
                        <span className="text-[13px] font-[550] tabular-nums"><Money value={billing.plan_price} whole />/mo</span>
                      </div>

                      {billing.add_ons.filter(a => a.active).map((addon, index) => (
                        <div
                          key={index}
                          className="flex items-center justify-between gap-4 border-t border-border/60 px-4 py-2.5"
                        >
                          <div>
                            <p className="text-[13px] font-[450] text-foreground">{addon.name}</p>
                            <p className="text-[11.5px] text-muted-foreground">Monthly add-on</p>
                          </div>
                          <span className="text-[13px] font-[550] tabular-nums"><Money value={addon.price} whole />/mo</span>
                        </div>
                      ))}
                    </div>
                  </Panel>
                )}
              </TabsContent>
            </Tabs>
          </div>

          {/* Checkout summary sidebar */}
          <div className="lg:col-span-1">
            <CheckoutSummary
              items={checkoutItems}
              paymentStatus={paymentStatus}
              onPayNow={() => setCheckoutStep('billing')}
              onSaveForLater={handleSaveForLater}
              onSaveToCart={handleSaveForLater}
              isLoading={processing}
              showCheckoutButton={totalDue > 0 && !hidePrices}
              hidePrices={hidePrices}
            />

            {/* Help note */}
            <div className="mt-4 rounded-[10px] border border-dashed border-border/60 p-4 text-center">
              <p className="text-[13px] text-muted-foreground">
                Not sure what to choose? The studio can recommend the right setup for you.
              </p>
              <Button variant="link" className="mt-1 h-auto p-0 text-[13px]">
                Book a consultation
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default LoungeBilling;
