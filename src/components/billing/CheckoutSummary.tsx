import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { Badge } from '@/components/ui/badge';
import { 
  CreditCard, 
  Shield, 
  Lock, 
  Loader2,
  CheckCircle2,
  Globe,
  Sparkles,
  Clock,
  ShoppingCart
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

interface CheckoutItem {
  id: string;
  name: string;
  price: number;
  type: 'website' | 'plan' | 'addon' | 'one-off';
  recurring?: boolean;
}

interface CheckoutSummaryProps {
  items: CheckoutItem[];
  paymentStatus: 'waiting' | 'processing' | 'paid' | 'none';
  onPayNow: () => void;
  onSaveForLater: () => void;
  onSaveToCart?: () => void;
  isLoading?: boolean;
  showCheckoutButton?: boolean;
  hidePrices?: boolean;
}

const CheckoutSummary = ({ 
  items, 
  paymentStatus, 
  onPayNow,
  onSaveForLater,
  onSaveToCart,
  isLoading = false,
  showCheckoutButton = false,
  hidePrices = false,
}: CheckoutSummaryProps) => {
  const fmt = (n: number, suffix = '') => hidePrices ? 'Custom Quote' : `£${n.toLocaleString()}${suffix}`;
  // Separate items by type
  const websiteItems = items.filter(i => i.type === 'website');
  const monthlyItems = items.filter(i => i.type === 'plan' || i.type === 'addon');
  const oneOffItems = items.filter(i => i.type === 'one-off');
  
  const websiteTotal = websiteItems.reduce((sum, item) => sum + item.price, 0);
  const monthlyTotal = monthlyItems.reduce((sum, item) => sum + item.price, 0);
  const oneOffTotal = oneOffItems.reduce((sum, item) => sum + item.price, 0);
  const grandTotal = websiteTotal + monthlyTotal + oneOffTotal;

  const getStatusBadge = () => {
    switch (paymentStatus) {
      case 'waiting':
        return (
          <Badge className="bg-amber-500/10 text-amber-500 border-amber-500/20">
            <Clock className="h-3 w-3 mr-1" />
            Awaiting Payment
          </Badge>
        );
      case 'processing':
        return (
          <Badge className="bg-blue-500/10 text-blue-500 border-blue-500/20">
            <Loader2 className="h-3 w-3 mr-1 animate-spin" />
            Processing
          </Badge>
        );
      case 'paid':
        return (
          <Badge className="border-ok/30 bg-transparent text-ok">
            <CheckCircle2 className="h-3 w-3 mr-1" />
            Paid
          </Badge>
        );
      default:
        return null;
    }
  };

  const ItemSection = ({ 
    title, 
    items, 
    icon: Icon, 
    suffix = '' 
  }: { 
    title: string; 
    items: CheckoutItem[]; 
    icon: React.ElementType;
    suffix?: string;
  }) => (
    <AnimatePresence mode="popLayout">
      {items.length > 0 && (
        <motion.div
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: 'auto' }}
          exit={{ opacity: 0, height: 0 }}
          className="space-y-2"
        >
          <div className="flex items-center gap-2 text-xs font-medium text-muted-foreground uppercase tracking-wide">
            <Icon className="h-3 w-3" />
            {title}
          </div>
          {items.map((item, index) => (
            <motion.div
              key={item.id}
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -10 }}
              transition={{ delay: index * 0.05 }}
              className="flex items-center justify-between py-2 px-3 bg-muted/30 rounded-lg"
            >
              <span className="text-sm font-medium">{item.name}</span>
              <span className="text-sm font-semibold">{fmt(item.price, suffix)}</span>
            </motion.div>
          ))}
        </motion.div>
      )}
    </AnimatePresence>
  );

  return (
    <Card className="sticky top-4 overflow-hidden border-2">
      
      
      <CardHeader className="pb-2 pt-4">
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2 text-base">
            <CreditCard className="h-4 w-4" />
            Checkout
          </CardTitle>
          {getStatusBadge()}
        </div>
      </CardHeader>
      
      <CardContent className="space-y-3 pt-2">
        {/* Website Purchase */}
        <ItemSection 
          title="Website Purchase" 
          items={websiteItems} 
          icon={Globe}
        />

        {/* Monthly Services */}
        <ItemSection 
          title="Monthly Services" 
          items={monthlyItems} 
          icon={Sparkles}
          suffix="/mo"
        />

        {/* One-off Charges */}
        <ItemSection 
          title="One-time Charges" 
          items={oneOffItems} 
          icon={CreditCard}
        />

        {items.length === 0 && (
          <div className="text-center py-4 text-muted-foreground">
            <Globe className="h-8 w-8 mx-auto mb-2 opacity-30" />
            <p className="text-xs">Select services to see pricing</p>
          </div>
        )}

        {items.length > 0 && (
          <>
            <Separator />

            {/* Totals Breakdown */}
            <div className="space-y-2">
              {websiteTotal > 0 && (
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">Website (one-time)</span>
                  <span className="font-medium">{fmt(websiteTotal)}</span>
                </div>
              )}
              {monthlyTotal > 0 && (
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">Monthly subscription</span>
                  <span className="font-medium">{fmt(monthlyTotal, '/mo')}</span>
                </div>
              )}
              {oneOffTotal > 0 && (
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">One-time charges</span>
                  <span className="font-medium">{fmt(oneOffTotal)}</span>
                </div>
              )}
            </div>

            <Separator />

            {/* Grand Totals */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-lg font-semibold">Due Today</span>
                <motion.span
                  key={websiteTotal + oneOffTotal}
                  initial={{ scale: 1.2, color: 'hsl(var(--primary))' }}
                  animate={{ scale: 1, color: 'inherit' }}
                  className="text-2xl font-bold"
                >
                  {fmt(websiteTotal + oneOffTotal + monthlyTotal)}
                </motion.span>
              </div>
              {monthlyTotal > 0 && (
                <div className="flex items-center justify-between text-sm text-muted-foreground">
                  <span>Then monthly</span>
                  <span>{fmt(monthlyTotal, '/mo')}</span>
                </div>
              )}
            </div>

            {/* Checkout / Payment Buttons */}
            <div className="space-y-2 pt-2">
              {/* Main Checkout Button - Always show if showCheckoutButton is true */}
              {showCheckoutButton && grandTotal > 0 && (
                <Button 
                  size="lg" 
                  className="w-full gap-2 h-11 text-sm font-medium"
                  onClick={onPayNow}
                  disabled={isLoading}
                >
                  {isLoading ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin" />
                      Processing...
                    </>
                  ) : (
                    <>
                      <CreditCard className="h-4 w-4" />
                      Proceed to Checkout
                    </>
                  )}
                </Button>
              )}

              {/* Save to Cart Button */}
              {onSaveToCart && grandTotal > 0 && (
                <Button 
                  variant="outline"
                  size="sm" 
                  className="w-full gap-2"
                  onClick={onSaveToCart}
                  disabled={isLoading}
                >
                  <ShoppingCart className="h-4 w-4" />
                  Save to Cart
                </Button>
              )}
            </div>

            {paymentStatus === 'paid' && (
              <div className="flex items-center justify-center gap-2 border-t border-border/60 py-3 text-ok">
                <CheckCircle2 className="h-4 w-4" />
                <span className="font-medium text-sm">Payment Complete</span>
              </div>
            )}
          </>
        )}

        {/* Trust Badges */}
        <div className="flex items-center justify-center gap-4 pt-3 border-t border-border/50">
          <div className="flex items-center gap-1 text-xs text-muted-foreground">
            <Lock className="h-3 w-3" />
            <span>SSL Secured</span>
          </div>
          <div className="flex items-center gap-1 text-xs text-muted-foreground">
            <Shield className="h-3 w-3" />
            <span>PCI Compliant</span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default CheckoutSummary;
