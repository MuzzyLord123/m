import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { CheckCircle2, Loader2, ArrowRight, Sparkles, Lock, Star } from 'lucide-react';
import { useUserRole } from '@/hooks/useUserRole';

// Per-feature subscription config
export const SUBSCRIPTION_FEATURES = {
  'website-designer': {
    productId: 'prod_U0gwetWRvudyvP',
    priceId: 'price_1T2fYnRsdRM0b4FvLAVZg309',
    name: 'Website Designer',
    tagline: 'Build stunning websites with AI superpowers',
    gradient: 'from-blue-600/20 via-violet-600/10 to-transparent',
    accentColor: 'hsl(var(--primary))',
    price: '£49.99',
    includes: [
      'Visual drag-and-drop website editor',
      'AI-powered page generation from a prompt',
      'Template marketplace — 50+ enterprise niches',
      'Full site management & deployment control',
      'CSS export & production-ready code output',
    ],
  },
  'cad-studio': {
    productId: 'prod_U0gxhso93mCXOg',
    priceId: 'price_1T2fZMRsdRM0b4FvF6LLq6VB',
    name: 'CAD Studio',
    tagline: 'Professional 2D/3D drafting and design tools',
    gradient: 'from-emerald-600/20 via-teal-600/10 to-transparent',
    accentColor: 'hsl(var(--primary))',
    price: '£49.99',
    includes: [
      'Professional 2D/3D drafting canvas',
      'Floor plan generator with room detection',
      'Layer management & smart snap engine',
      'Block library & material editor',
      'Export to DXF, PDF & more',
    ],
  },
  'inventory': {
    productId: 'prod_U0gxb5PamIJenA',
    priceId: 'price_1T2fZtRsdRM0b4FvYHdsU3Mx',
    name: 'Inventory Management',
    tagline: 'Real-time stock control for growing businesses',
    gradient: 'from-orange-600/20 via-amber-600/10 to-transparent',
    accentColor: 'hsl(var(--primary))',
    price: '£49.99',
    includes: [
      'Real-time stock level tracking with alerts',
      'Stock movements & full adjustment history',
      'Multi-location warehouse management',
      'Stock count reconciliation sessions',
      'Reports: valuation, movement & low stock',
    ],
  },
  'ai-intelligence': {
    productId: 'prod_U4mBBujuQlmbP8',
    priceId: 'price_1T6ccjRsdRM0b4FvXZtqyL47',
    name: 'AI Business Intelligence',
    tagline: 'Turn your data into actionable insights with AI',
    gradient: 'from-cyan-600/20 via-sky-600/10 to-transparent',
    accentColor: 'hsl(var(--primary))',
    price: '£79.99',
    includes: [
      'AI-generated business summaries & analysis',
      'Natural language data queries',
      'Auto-generated charts & visualisations',
      'KPI goal tracking with progress alerts',
      'Exportable branded PDF reports',
    ],
  },
  'white-label': {
    productId: 'prod_U4mBLQPxsiCVF9',
    priceId: 'price_1T6cd4RsdRM0b4FvdGWLa7MK',
    name: 'White-Label & Branded Reports',
    tagline: 'Present a professional, branded experience to clients',
    gradient: 'from-indigo-600/20 via-purple-600/10 to-transparent',
    accentColor: 'hsl(var(--primary))',
    price: '£59.99',
    includes: [
      'Custom branding — logo, colours, domain',
      'Branded PDF project reports',
      'White-labelled client status pages',
      'Report template gallery',
      'Branded notification emails',
    ],
  },
  'automations-pro': {
    productId: 'prod_U4mBprXKMyUqWI',
    priceId: 'price_1T6cdWRsdRM0b4FvKzAaxebC',
    name: 'Advanced Automations',
    tagline: 'Scheduled workflows, API keys, and integration hub',
    gradient: 'from-rose-600/20 via-pink-600/10 to-transparent',
    accentColor: 'hsl(var(--primary))',
    price: '£69.99',
    includes: [
      'Scheduled workflow automation (cron)',
      'Webhook triggers — inbound & outbound',
      'Personal API keys for external tools',
      'Detailed execution logs & retry',
      'Usage dashboard & time saved estimates',
    ],
  },
} as const;

export type SubscriptionFeatureKey = keyof typeof SUBSCRIPTION_FEATURES;

interface SubscriptionPaywallProps {
  children: React.ReactNode;
  featureKey: SubscriptionFeatureKey;
  featureDescription: string;
  icon: React.ComponentType<{ className?: string }>;
}

export function SubscriptionPaywall({
  children,
  featureKey,
  featureDescription,
  icon: Icon,
}: SubscriptionPaywallProps) {
  const { user, session } = useAuth();
  const { isAdmin, loading: roleLoading } = useUserRole();
  const [loading, setLoading] = useState(true);
  const [subscribed, setSubscribed] = useState(false);
  const [checkoutLoading, setCheckoutLoading] = useState(false);

  const feature = SUBSCRIPTION_FEATURES[featureKey];

  useEffect(() => {
    // Wait for role to load
    if (roleLoading) return;

    // Admins bypass paywall entirely
    if (isAdmin) {
      setSubscribed(true);
      setLoading(false);
      return;
    }

    if (!user) return;
    checkSubscription();
  }, [user, isAdmin, roleLoading]);

  const checkSubscription = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke('check-subscriptions-plan', {
        headers: { Authorization: `Bearer ${session?.access_token}` },
        body: { productId: feature.productId },
      });
      if (!error && data?.subscribed) setSubscribed(true);
    } catch {
      // silently fail — show paywall
    } finally {
      setLoading(false);
    }
  };

  const handleCheckout = async () => {
    setCheckoutLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke('create-subscriptions-checkout', {
        headers: { Authorization: `Bearer ${session?.access_token}` },
        body: { priceId: feature.priceId },
      });
      if (error) throw new Error(error.message);
      if (data?.url) window.open(data.url, '_blank');
    } catch (err) {
      console.error('Checkout error:', err);
    } finally {
      setCheckoutLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[70vh] px-4">
        <div className="w-full max-w-2xl space-y-4">
          <Skeleton className="h-48 w-full rounded-2xl" />
          <div className="grid grid-cols-2 gap-3">
            {[...Array(4)].map((_, i) => <Skeleton key={i} className="h-16 rounded-xl" />)}
          </div>
          <Skeleton className="h-12 w-full rounded-xl" />
        </div>
      </div>
    );
  }

  if (subscribed) return <>{children}</>;

  return (
    <div className="flex items-center justify-center min-h-[70vh] px-4 py-10">
      <motion.div
        initial={{ opacity: 0, y: 28, scale: 0.97 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ duration: 0.45, ease: [0.22, 1, 0.36, 1] }}
        className="w-full max-w-2xl"
      >
        {/* Main card */}
        <div className="rounded-2xl border border-border/50 bg-card overflow-hidden shadow-2xl shadow-black/30">

          {/* Hero gradient section */}
          <div className={`relative bg-gradient-to-br ${feature.gradient} border-b border-border/40 px-8 pt-10 pb-8 overflow-hidden`}>
            {/* Decorative blobs */}
            <div className="absolute -top-16 -right-16 w-64 h-64 rounded-full bg-primary/5 blur-3xl pointer-events-none" />
            <div className="absolute -bottom-8 -left-8 w-40 h-40 rounded-full bg-primary/5 blur-2xl pointer-events-none" />

            {/* PRO badge + icon row */}
            <div className="relative flex items-center gap-3 mb-5">
              <div className="h-12 w-12 rounded-xl bg-primary/15 border border-primary/25 flex items-center justify-center shadow-lg shadow-primary/10">
                <Icon className="w-6 h-6 text-primary" />
              </div>
              <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-primary/10 border border-primary/20">
                <Star className="w-3 h-3 text-primary fill-primary" />
                <span className="text-[11px] font-semibold text-primary tracking-wide uppercase">Pro</span>
              </div>
            </div>

            {/* Heading */}
            <div className="relative space-y-2">
              <h2 className="text-2xl font-bold tracking-tight text-foreground">{feature.name}</h2>
              <p className="text-sm text-muted-foreground leading-relaxed max-w-md">{feature.tagline}</p>
            </div>
          </div>

          {/* Body */}
          <div className="px-8 py-7 space-y-7">

            {/* Features grid */}
            <div className="space-y-3">
              <p className="text-[11px] font-semibold uppercase tracking-widest text-muted-foreground">
                What's included
              </p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                {feature.includes.map((f) => (
                  <div
                    key={f}
                    className="flex items-start gap-2.5 p-3 rounded-xl bg-muted/30 border border-border/30 hover:bg-muted/50 transition-colors"
                  >
                    <CheckCircle2 className="w-4 h-4 text-primary shrink-0 mt-0.5" />
                    <span className="text-[13px] text-foreground/80 leading-snug">{f}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Pricing + CTA */}
            <div className="rounded-xl border border-border/40 bg-muted/20 p-5 space-y-4">
              <div className="flex items-end justify-between">
                <div>
                  <div className="flex items-baseline gap-1">
                    <span className="text-3xl font-extrabold tracking-tight text-foreground">{feature.price}</span>
                    <span className="text-sm text-muted-foreground font-medium">/ month</span>
                  </div>
                  <p className="text-xs text-muted-foreground mt-0.5">Billed monthly · Cancel anytime</p>
                </div>
                <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-primary/10 border border-primary/20">
                  <Lock className="w-3 h-3 text-primary" />
                  <span className="text-[11px] font-semibold text-primary">Subscription Required</span>
                </div>
              </div>

              <Button
                onClick={handleCheckout}
                disabled={checkoutLoading}
                size="lg"
                className="w-full h-12 rounded-xl font-semibold text-base gap-2 shadow-lg shadow-primary/20"
              >
                {checkoutLoading ? (
                  <Loader2 className="w-5 h-5 animate-spin" />
                ) : (
                  <>
                    <Sparkles className="w-4 h-4" />
                    Unlock {feature.name}
                    <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </Button>
            </div>

            <p className="text-center text-[11px] text-muted-foreground">
              Already subscribed?{' '}
              <button
                onClick={checkSubscription}
                className="underline underline-offset-2 hover:text-foreground transition-colors font-medium"
              >
                Refresh status
              </button>
            </p>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
