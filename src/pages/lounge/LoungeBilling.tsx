import { useState, useEffect, useCallback, useRef } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  CreditCard, 
  Sparkles,
  Globe,
  Megaphone,
  Share2,
  Search,
  Palette,
  HeadphonesIcon,
  Check,
  ChevronRight,
  Loader2,
  ShoppingCart,
  Receipt,
  Clock,
  ArrowRight,
  FileText,
  Download,
  Eye,
  Lock,
  Paintbrush,
  Boxes,
  PenTool,
  Star,
  Zap,
  X,
  ExternalLink,
  CheckCircle2,
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
import { LoungePageHeader } from '@/components/lounge/LoungePageHeader';

// ─── Subscription Plans ───────────────────────────────────────────────────────
interface SubPlan {
  id: string;
  name: string;
  priceId: string;
  productId: string;
  monthlyPrice: number;
  tagline: string;
  gradient: string;
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
    tagline: 'Build and manage your website with AI superpowers',
    gradient: 'from-blue-600/15 via-violet-600/8 to-transparent',
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
    gradient: 'from-emerald-600/15 via-teal-600/8 to-transparent',
    badge: 'Most Popular',
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
    tagline: 'The complete Quooro toolkit — build, stock & design',
    gradient: 'from-orange-600/15 via-amber-600/8 to-transparent',
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
      toast.error('Failed to start checkout. Please try again.');
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
      toast.error('Could not open subscription portal. Please contact support.');
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
      toast.error('Failed to load billing information');
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
    toast.info('Stripe payment integration coming soon! Contact support to process your payment.');
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

      toast.success('Selections saved! Complete payment when ready.');
      fetchBilling();
    } catch (error) {
      console.error('Error saving:', error);
      toast.error('Failed to save selections');
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
      <div className="p-4 md:p-6 lg:p-8 flex items-center justify-center min-h-[600px]">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  // Checkout Step - Billing Details Form
  if (checkoutStep === 'billing') {
    return (
      <div className="p-4 md:p-6 lg:p-8 min-h-screen">
        <div>
          {/* Header */}
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-8 text-center"
          >
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 text-primary mb-4">
              <CreditCard className="h-4 w-4" />
              <span className="text-sm font-medium">Secure Checkout</span>
            </div>
            <h1 className="text-3xl md:text-4xl font-bold mb-2">Complete Your Order</h1>
            <p className="text-muted-foreground">
              Enter your billing details to complete the purchase
            </p>
          </motion.div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Billing Form */}
            <div className="lg:col-span-2">
              <BillingDetailsForm
                onBack={() => setCheckoutStep('selection')}
                onSubmit={async (details) => {
                  setProcessing(true);
                  // Save and process payment
                  await handleSaveForLater();
                  toast.info('Stripe payment integration coming soon! Your order has been saved.');
                  setCheckoutStep('selection');
                  setProcessing(false);
                }}
                isLoading={processing}
                initialData={{
                  email: user?.email || ''
                }}
              />
            </div>

            {/* Order Summary */}
            <div className="lg:col-span-1">
              <OrderSummary items={orderItems} />
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-4 md:p-6 lg:p-8 min-h-screen">
      <div>
        {/* Cart Modal */}
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
        <LoungePageHeader
          title="Plan & Billing"
          description="Select a website, choose your management plan, and add any extras"
          icon={CreditCard}
          actions={
            <Button
              variant="outline"
              size="sm"
              className="relative gap-2"
              onClick={() => setCartModalOpen(true)}
            >
              <ShoppingCart className="h-4 w-4" />
              <span className="hidden sm:inline">View Cart</span>
              {checkoutItems.length > 0 && (
                <Badge className="absolute -top-2 -right-2 h-5 w-5 p-0 flex items-center justify-center text-xs">
                  {checkoutItems.length}
                </Badge>
              )}
            </Button>
          }
        />

        {/* Status Banner */}
        {billing?.payment_status === 'pending' && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-6 p-4 bg-amber-500/10 border border-amber-500/30 rounded-xl flex items-center justify-between"
          >
            <div className="flex items-center gap-3">
              <Clock className="h-5 w-5 text-amber-500" />
              <div>
                <p className="font-medium text-amber-700 dark:text-amber-300">Payment Awaiting</p>
                <p className="text-sm text-amber-600 dark:text-amber-400">
                  Complete your payment to activate all services
                </p>
              </div>
            </div>
            <Button 
              className="gap-2" 
              onClick={() => setCheckoutStep('billing')}
              disabled={processing}
            >
              <CreditCard className="h-4 w-4" />
              Proceed to Checkout
            </Button>
          </motion.div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-6">
            {/* Checkout Summary - Now at TOP on mobile, RIGHT on desktop */}
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
              <TabsList className="grid w-full grid-cols-5 h-10">
                <TabsTrigger value="my-pricing" className="gap-2 text-sm data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">
                  <CreditCard className="h-4 w-4" />
                  <span className="hidden sm:inline">My Pricing</span>
                </TabsTrigger>
                <TabsTrigger value="subscriptions" className="gap-2 text-sm data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">
                  <Star className="h-4 w-4" />
                  <span className="hidden sm:inline">Subscriptions</span>
                </TabsTrigger>
                <TabsTrigger value="checkout" className="gap-2 text-sm data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">
                  <ShoppingCart className="h-4 w-4" />
                  <span className="hidden sm:inline">Checkout</span>
                </TabsTrigger>
                <TabsTrigger value="invoices" className="gap-2 text-sm data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">
                  <FileText className="h-4 w-4" />
                  <span className="hidden sm:inline">Invoices</span>
                </TabsTrigger>
                <TabsTrigger value="history" className="gap-2 text-sm data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">
                  <Receipt className="h-4 w-4" />
                  <span className="hidden sm:inline">History</span>
                </TabsTrigger>
              </TabsList>


              {/* ── Subscriptions Tab ─────────────────────────────────── */}
              <TabsContent value="subscriptions" className="space-y-6">
                {/* Header */}
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                  <div>
                    <h2 className="text-xl font-bold tracking-tight">Platform Subscriptions</h2>
                    <p className="text-sm text-muted-foreground mt-0.5">
                      Unlock powerful tools — each plan includes a free first month.
                    </p>
                  </div>
                  {activeSubIds.size > 0 && (
                    <Button
                      variant="outline"
                      size="sm"
                      className="gap-2 shrink-0"
                      onClick={handleManageSubscriptions}
                      disabled={portalLoading}
                    >
                      {portalLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Settings className="h-4 w-4" />}
                      Manage / Cancel Subscriptions
                    </Button>
                  )}
                </div>

                {/* Free trial callout */}
                <div className="flex items-center gap-3 p-4 rounded-xl bg-primary/8 border border-primary/20">
                  <div className="h-9 w-9 rounded-xl bg-primary/15 border border-primary/25 flex items-center justify-center shrink-0">
                    <Sparkles className="h-5 w-5 text-primary" />
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-foreground">First month free on all plans</p>
                    <p className="text-xs text-muted-foreground">No credit card charged until your trial ends. Cancel anytime with one click.</p>
                  </div>
                </div>

                {/* Plan cards */}
                {subLoading ? (
                  <div className="grid grid-cols-1 gap-4">
                    {[...Array(3)].map((_, i) => (
                      <div key={i} className="h-64 rounded-2xl bg-muted/30 animate-pulse" />
                    ))}
                  </div>
                ) : (
                  <div className="grid grid-cols-1 gap-5">
                    {SUBSCRIPTION_PLANS.map((plan, idx) => {
                      const isActive = activeSubIds.has(plan.productId);
                      const isLoadingThis = checkoutLoadingId === plan.id;
                      return (
                        <motion.div
                          key={plan.id}
                          initial={{ opacity: 0, y: 16 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ delay: idx * 0.08, duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
                          className={`relative rounded-2xl border overflow-hidden transition-all duration-200 ${
                            isActive
                              ? 'border-primary/40 shadow-lg shadow-primary/10'
                              : 'border-border/50 hover:border-border'
                          }`}
                        >
                          {/* Hero gradient */}
                          <div className={`bg-gradient-to-br ${plan.gradient} px-6 pt-6 pb-5 border-b border-border/30`}>
                            <div className="flex items-start justify-between gap-4">
                              <div className="space-y-1.5">
                                <div className="flex items-center gap-2">
                                  <span className="text-lg font-bold tracking-tight">{plan.name}</span>
                                  {plan.badge && (
                                    <Badge className="bg-primary/15 text-primary border-primary/25 text-[11px] font-semibold px-2 py-0.5">
                                      {plan.badge}
                                    </Badge>
                                  )}
                                  {isActive && (
                                    <Badge className="bg-emerald-500/15 text-emerald-500 border-emerald-500/25 text-[11px] font-semibold px-2 py-0.5 gap-1">
                                      <CheckCircle2 className="h-3 w-3" /> Active
                                    </Badge>
                                  )}
                                </div>
                                <p className="text-sm text-muted-foreground max-w-sm">{plan.tagline}</p>
                                {/* Tool badges */}
                                <div className="flex items-center gap-2 pt-1 flex-wrap">
                                  {plan.tools.map((t) => {
                                    const TIcon = t.icon;
                                    return (
                                      <span key={t.label} className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-background/60 border border-border/50 text-[12px] font-medium text-foreground/80">
                                        <TIcon className="h-3.5 w-3.5 text-primary" />
                                        {t.label}
                                      </span>
                                    );
                                  })}
                                </div>
                              </div>
                              {/* Pricing */}
                              <div className="text-right shrink-0">
                                <div className="text-xs text-muted-foreground line-through mb-0.5">
                                  £{plan.monthlyPrice.toFixed(2)}/mo
                                </div>
                                <div className="text-2xl font-extrabold tracking-tight text-foreground">Free</div>
                                <div className="text-xs text-muted-foreground">first month</div>
                                <div className="text-xs text-muted-foreground mt-1">then £{plan.monthlyPrice.toFixed(2)}/mo</div>
                              </div>
                            </div>
                          </div>

                          {/* Features + CTA */}
                          <div className="px-6 py-5 bg-card flex flex-col sm:flex-row gap-5 sm:items-center">
                            <ul className="flex-1 grid grid-cols-1 sm:grid-cols-2 gap-y-2 gap-x-4">
                              {plan.features.map((f) => (
                                <li key={f} className="flex items-start gap-2 text-sm text-foreground/75">
                                  <Check className="h-4 w-4 text-primary shrink-0 mt-0.5" />
                                  {f}
                                </li>
                              ))}
                            </ul>
                            <div className="shrink-0 flex flex-col gap-2 min-w-[160px]">
                              {isActive ? (
                                <>
                                  <div className="flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-500 text-sm font-semibold">
                                    <CheckCircle2 className="h-4 w-4" /> Subscribed
                                  </div>
                                  <Button
                                    variant="outline"
                                    size="sm"
                                    className="w-full gap-2 text-destructive border-destructive/30 hover:bg-destructive/10"
                                    onClick={handleManageSubscriptions}
                                    disabled={portalLoading}
                                  >
                                    {portalLoading ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <X className="h-3.5 w-3.5" />}
                                    Cancel Plan
                                  </Button>
                                </>
                              ) : (
                                <Button
                                  className="w-full gap-2 font-semibold"
                                  onClick={() => handleSubCheckout(plan)}
                                  disabled={isLoadingThis}
                                >
                                  {isLoadingThis ? (
                                    <Loader2 className="h-4 w-4 animate-spin" />
                                  ) : (
                                    <>
                                      <Sparkles className="h-4 w-4" />
                                      Start Free Month
                                      <ArrowRight className="h-4 w-4" />
                                    </>
                                  )}
                                </Button>
                              )}
                            </div>
                          </div>
                        </motion.div>
                      );
                    })}
                  </div>
                )}

                {/* Cancel note */}
                <p className="text-center text-xs text-muted-foreground">
                  Subscriptions are billed monthly after the free trial. Cancel anytime via{' '}
                  <button onClick={handleManageSubscriptions} className="underline underline-offset-2 hover:text-foreground transition-colors font-medium">
                    the billing portal
                  </button>{' '}
                  — no hidden fees.
                </p>
              </TabsContent>

              {/* My Pricing Tab - Client-specific pricing */}
              <TabsContent value="my-pricing" className="space-y-6">
                {pricingLoading ? (

                  <div className="flex items-center justify-center py-12">
                    <Loader2 className="h-8 w-8 animate-spin text-primary" />
                  </div>
                ) : !canViewBilling ? (
                  <Card className="border-amber-500/30 bg-amber-500/5">
                    <CardContent className="flex flex-col items-center justify-center py-12 text-center">
                      <Lock className="h-12 w-12 text-amber-500 mb-4" />
                      <h3 className="text-lg font-semibold mb-2">Billing Access Restricted</h3>
                      <p className="text-muted-foreground max-w-md">
                        You don't have permission to view billing information. Contact your account owner for access.
                      </p>
                    </CardContent>
                  </Card>
                ) : customPricing.length === 0 ? (
                  <Card>
                    <CardContent className="flex flex-col items-center justify-center py-12 text-center">
                      <CreditCard className="h-12 w-12 text-muted-foreground mb-4" />
                      <h3 className="text-lg font-semibold mb-2">No Custom Pricing Yet</h3>
                      <p className="text-muted-foreground max-w-md">
                        Your custom pricing will appear here once it's been set up by our team. 
                        Browse our standard packages in the Checkout tab.
                      </p>
                      <Button 
                        variant="outline" 
                        className="mt-4 gap-2"
                        onClick={() => setActiveTab('checkout')}
                      >
                        <ShoppingCart className="h-4 w-4" />
                        View Standard Packages
                      </Button>
                    </CardContent>
                  </Card>
                ) : (
                  <>
                    {/* Summary Cards */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <Card className="bg-gradient-to-br from-primary/10 to-primary/5 border-primary/20">
                        <CardContent className="pt-6">
                          <div className="flex items-center gap-3">
                            <div className="p-3 rounded-xl bg-primary/20">
                              <CreditCard className="h-5 w-5 text-primary" />
                            </div>
                            <div>
                              <p className="text-sm text-muted-foreground">Monthly Recurring</p>
                              <p className="text-2xl font-bold">£{recurringTotal.toLocaleString()}</p>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                      
                      <Card>
                        <CardContent className="pt-6">
                          <div className="flex items-center gap-3">
                            <div className="p-3 rounded-xl bg-muted">
                              <Receipt className="h-5 w-5 text-muted-foreground" />
                            </div>
                            <div>
                              <p className="text-sm text-muted-foreground">One-time Charges</p>
                              <p className="text-2xl font-bold">£{oneTimeTotal.toLocaleString()}</p>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                      
                      <Card>
                        <CardContent className="pt-6">
                          <div className="flex items-center gap-3">
                            <div className="p-3 rounded-xl bg-muted">
                              <FileText className="h-5 w-5 text-muted-foreground" />
                            </div>
                            <div>
                              <p className="text-sm text-muted-foreground">Active Services</p>
                              <p className="text-2xl font-bold">{customPricing.length}</p>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    </div>

                    {/* Pricing by Category */}
                    {Object.entries(pricingByType).map(([type, items]) => (
                      <Card key={type}>
                        <CardHeader>
                          <CardTitle className="flex items-center gap-2 capitalize">
                            {type === 'website' && <Globe className="h-5 w-5" />}
                            {type === 'addon' && <Sparkles className="h-5 w-5" />}
                            {type === 'social' && <Share2 className="h-5 w-5" />}
                            {type === 'ads' && <Megaphone className="h-5 w-5" />}
                            {type === 'seo' && <Search className="h-5 w-5" />}
                            {!['website', 'addon', 'social', 'ads', 'seo'].includes(type) && <CreditCard className="h-5 w-5" />}
                            {type.replace(/_/g, ' ')} Services
                          </CardTitle>
                        </CardHeader>
                        <CardContent>
                          <div className="space-y-3">
                            {items.map((item) => (
                              <div 
                                key={item.id}
                                className="flex items-center justify-between p-4 bg-muted/30 rounded-lg"
                              >
                                <div>
                                  <p className="font-medium">{item.service_name}</p>
                                  {item.description && (
                                    <p className="text-sm text-muted-foreground">{item.description}</p>
                                  )}
                                </div>
                                <div className="flex items-center gap-3">
                                  <div className="text-right">
                                    <span className="text-lg font-bold">£{item.negotiated_price.toLocaleString()}</span>
                                    {item.is_recurring && (
                                      <span className="text-sm text-muted-foreground">/{item.billing_frequency || 'mo'}</span>
                                    )}
                                  </div>
                                  <Badge className={item.is_recurring 
                                    ? 'bg-primary/10 text-primary border-primary/20' 
                                    : 'bg-muted text-muted-foreground'
                                  }>
                                    {item.is_recurring ? 'Recurring' : 'One-time'}
                                  </Badge>
                                </div>
                              </div>
                            ))}
                          </div>
                        </CardContent>
                      </Card>
                    ))}

                    {/* Contracts Section */}
                    {contracts.length > 0 && (
                      <Card>
                        <CardHeader>
                          <CardTitle className="flex items-center gap-2">
                            <FileText className="h-5 w-5" />
                            Contracts & Documents
                          </CardTitle>
                        </CardHeader>
                        <CardContent>
                          <div className="space-y-3">
                            {contracts.map((contract) => (
                              <div 
                                key={contract.id}
                                className="flex items-center justify-between p-4 bg-muted/30 rounded-lg"
                              >
                                <div className="flex items-center gap-3">
                                  <div className="p-2 rounded-lg bg-muted">
                                    <FileText className="h-4 w-4" />
                                  </div>
                                  <div>
                                    <p className="font-medium">{contract.title}</p>
                                    <p className="text-sm text-muted-foreground">
                                      {contract.signed_at 
                                        ? `Signed ${format(new Date(contract.signed_at), 'dd MMM yyyy')}`
                                        : contract.status
                                      }
                                    </p>
                                  </div>
                                </div>
                                <div className="flex items-center gap-2">
                                  <Badge className={
                                    contract.status === 'signed' ? 'bg-green-500/10 text-green-500' :
                                    contract.status === 'pending' ? 'bg-amber-500/10 text-amber-500' :
                                    'bg-muted text-muted-foreground'
                                  }>
                                    {contract.status}
                                  </Badge>
                                  {contract.document_url && (
                                    <Button variant="ghost" size="sm" asChild>
                                      <a href={contract.document_url} target="_blank" rel="noopener noreferrer">
                                        <Eye className="h-4 w-4" />
                                      </a>
                                    </Button>
                                  )}
                                </div>
                              </div>
                            ))}
                          </div>
                        </CardContent>
                      </Card>
                    )}
                  </>
                )}
              </TabsContent>

              {/* Invoices Tab */}
              <TabsContent value="invoices" className="space-y-6">
                {pricingLoading ? (
                  <div className="flex items-center justify-center py-12">
                    <Loader2 className="h-8 w-8 animate-spin text-primary" />
                  </div>
                ) : !canViewBilling ? (
                  <Card className="border-amber-500/30 bg-amber-500/5">
                    <CardContent className="flex flex-col items-center justify-center py-12 text-center">
                      <Lock className="h-12 w-12 text-amber-500 mb-4" />
                      <h3 className="text-lg font-semibold mb-2">Invoice Access Restricted</h3>
                      <p className="text-muted-foreground max-w-md">
                        You don't have permission to view invoices. Contact your account owner for access.
                      </p>
                    </CardContent>
                  </Card>
                ) : customInvoices.length === 0 ? (
                  <Card>
                    <CardContent className="flex flex-col items-center justify-center py-12 text-center">
                      <FileText className="h-12 w-12 text-muted-foreground mb-4" />
                      <h3 className="text-lg font-semibold mb-2">No Invoices Yet</h3>
                      <p className="text-muted-foreground max-w-md">
                        Your invoices will appear here once they've been generated.
                      </p>
                    </CardContent>
                  </Card>
                ) : (
                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <FileText className="h-5 w-5" />
                        Invoices
                      </CardTitle>
                      <CardDescription>
                        View and download your invoices
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-3">
                        {customInvoices.map((invoice) => (
                          <div 
                            key={invoice.id}
                            className="flex items-center justify-between p-4 bg-muted/30 rounded-lg"
                          >
                            <div>
                              <p className="font-medium">{invoice.invoice_number}</p>
                              <p className="text-sm text-muted-foreground">
                                {format(new Date(invoice.created_at), 'dd MMM yyyy')}
                                {invoice.due_date && ` • Due ${format(new Date(invoice.due_date), 'dd MMM yyyy')}`}
                              </p>
                            </div>
                            <div className="flex items-center gap-3">
                              <span className="font-semibold">£{invoice.total_amount.toLocaleString()}</span>
                              <Badge className={
                                invoice.status === 'paid' ? 'bg-green-500/10 text-green-500 border-green-500/20' :
                                invoice.status === 'overdue' ? 'bg-red-500/10 text-red-500 border-red-500/20' :
                                'bg-amber-500/10 text-amber-500 border-amber-500/20'
                              }>
                                {invoice.status || 'Pending'}
                              </Badge>
                              <Button variant="ghost" size="sm">
                                <Download className="h-4 w-4" />
                              </Button>
                            </div>
                          </div>
                        ))}
                      </div>
                    </CardContent>
                  </Card>
                )}
              </TabsContent>

              {/* Checkout Tab */}
              <TabsContent value="checkout" className="space-y-6">
                {/* Website Selection */}
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.1 }}
                >
                  <div className="flex items-center gap-2 mb-3">
                    <Globe className="h-4 w-4 text-primary" />
                    <h2 className="text-lg font-semibold">1. Choose Your Website</h2>
                    {selectedWebsite && (
                      <Badge className="ml-auto bg-primary/10 text-primary text-xs">Selected</Badge>
                    )}
                  </div>
                  <WebsitePackageSelector
                    packages={WEBSITE_PACKAGES}
                    selectedPackage={selectedWebsite}
                    onSelectPackage={setSelectedWebsite}
                  />
                  {!selectedWebsite && (
                    <p className="text-xs text-muted-foreground mt-2 text-center">
                      Skip if you already have a website with us
                    </p>
                  )}
                </motion.div>

                {/* Plan Selection */}
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.2 }}
                >
                  <div className="flex items-center gap-2 mb-3">
                    <Sparkles className="h-4 w-4 text-primary" />
                    <h2 className="text-lg font-semibold">2. Select Management Plan</h2>
                    <Badge className="ml-auto bg-primary/10 text-primary text-xs">{selectedPlanData?.name}</Badge>
                  </div>
                  <PlanSelector
                    plans={PLANS}
                    selectedPlan={selectedPlan}
                    onSelectPlan={setSelectedPlan}
                  />
                </motion.div>

                {/* Add-ons */}
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.3 }}
                >
                  <div className="flex items-center gap-2 mb-3">
                    <Sparkles className="h-4 w-4 text-primary" />
                    <h2 className="text-lg font-semibold">3. Add Extras</h2>
                    {selectedAddons.size > 0 && (
                      <Badge className="ml-auto bg-primary/10 text-primary text-xs">
                        {selectedAddons.size} selected
                      </Badge>
                    )}
                  </div>
                  
                  <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3">
                    {AVAILABLE_ADDONS.map((addon, index) => {
                      const Icon = addon.icon;
                      const isActive = selectedAddons.has(addon.id);
                      
                      return (
                        <motion.div
                          key={addon.id}
                          initial={{ opacity: 0, y: 20 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ delay: 0.3 + index * 0.05 }}
                          className={`
                            relative rounded-xl border-2 p-3 transition-all duration-300 cursor-pointer
                            ${isActive 
                              ? 'border-primary bg-primary/5 shadow-md shadow-primary/10' 
                              : 'border-border/50 hover:border-border hover:bg-muted/30'
                            }
                          `}
                          onClick={() => toggleAddon(addon.id)}
                        >
                          <div className="flex items-center justify-between mb-2">
                            <div className={`p-1.5 rounded-lg ${isActive ? 'bg-primary/20' : 'bg-muted'}`}>
                              <Icon className={`h-4 w-4 ${isActive ? 'text-primary' : 'text-muted-foreground'}`} />
                            </div>
                            <Switch
                              checked={isActive}
                              onCheckedChange={() => toggleAddon(addon.id)}
                              onClick={(e) => e.stopPropagation()}
                              className="scale-75"
                            />
                          </div>
                          
                          <h3 className="font-semibold text-sm mb-0.5 truncate">{addon.name}</h3>
                          <div className="flex items-baseline gap-0.5">
                            {hidePrices ? (
                              <span className="text-sm font-semibold text-muted-foreground">Custom Quote</span>
                            ) : (
                              <>
                                <span className="text-lg font-bold">£{addon.price}</span>
                                <span className="text-muted-foreground text-xs">/mo</span>
                              </>
                            )}
                          </div>
                        </motion.div>
                      );
                    })}
                  </div>
                </motion.div>
              </TabsContent>

              {/* Website Tab - Full Package View */}
              <TabsContent value="website" className="space-y-6">
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Globe className="h-5 w-5" />
                      Website Packages
                    </CardTitle>
                    <CardDescription>
                      Choose the perfect website package for your business. All packages include responsive design, SEO basics, and SSL.
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <WebsitePackageSelector
                      packages={WEBSITE_PACKAGES}
                      selectedPackage={selectedWebsite}
                      onSelectPackage={setSelectedWebsite}
                    />
                  </CardContent>
                </Card>
              </TabsContent>

              {/* History Tab */}
              <TabsContent value="history" className="space-y-6">
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Receipt className="h-5 w-5" />
                      Payment History
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    {billing?.one_off_charges && billing.one_off_charges.length > 0 ? (
                      <div className="space-y-3">
                        {billing.one_off_charges.map((charge, index) => (
                          <div 
                            key={index}
                            className="flex items-center justify-between p-4 bg-muted/30 rounded-lg"
                          >
                            <div>
                              <p className="font-medium">{charge.name}</p>
                              <p className="text-sm text-muted-foreground">
                                {format(new Date(charge.date), 'dd MMM yyyy')}
                              </p>
                            </div>
                            <div className="flex items-center gap-3">
                              <span className="font-semibold">£{charge.price.toLocaleString()}</span>
                              <Badge className={charge.paid 
                                ? 'bg-green-500/10 text-green-500 border-green-500/20' 
                                : 'bg-amber-500/10 text-amber-500 border-amber-500/20'
                              }>
                                {charge.paid ? 'Paid' : 'Pending'}
                              </Badge>
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="text-center py-12 text-muted-foreground">
                        <Receipt className="h-12 w-12 mx-auto mb-4 opacity-30" />
                        <p>No payment history yet</p>
                      </div>
                    )}
                  </CardContent>
                </Card>

                {/* Current Subscription */}
                {billing && (
                  <Card>
                    <CardHeader>
                      <CardTitle>Current Subscription</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div className="flex items-center justify-between p-4 bg-muted/30 rounded-lg">
                        <div>
                          <p className="font-medium">{billing.plan_name} Plan</p>
                          <p className="text-sm text-muted-foreground">Monthly subscription</p>
                        </div>
                        <span className="font-semibold">£{billing.plan_price}/mo</span>
                      </div>
                      
                      {billing.add_ons.filter(a => a.active).map((addon, index) => (
                        <div 
                          key={index}
                          className="flex items-center justify-between p-4 bg-muted/30 rounded-lg"
                        >
                          <div>
                            <p className="font-medium">{addon.name}</p>
                            <p className="text-sm text-muted-foreground">Monthly add-on</p>
                          </div>
                          <span className="font-semibold">£{addon.price}/mo</span>
                        </div>
                      ))}
                    </CardContent>
                  </Card>
                )}
              </TabsContent>
            </Tabs>
          </div>

          {/* Checkout Summary Sidebar */}
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.3 }}
            className="lg:col-span-1"
          >
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

            {/* Help Card */}
            <Card className="mt-4 bg-muted/30 border-dashed">
              <CardContent className="pt-6">
                <div className="text-center">
                  <HeadphonesIcon className="h-8 w-8 text-muted-foreground mx-auto mb-3" />
                  <p className="text-sm text-muted-foreground">
                    Need help choosing? Contact our team for personalized recommendations.
                  </p>
                  <Button variant="link" className="mt-2">
                    Book a consultation
                  </Button>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        </div>
      </div>
    </div>
  );
};

export default LoungeBilling;
