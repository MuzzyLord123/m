import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { Badge } from '@/components/ui/badge';
import { 
  CreditCard, 
  Shield, 
  Lock, 
  Loader2,
  CheckCircle2
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

interface LineItem {
  name: string;
  price: number;
  type: 'plan' | 'addon' | 'one-off';
}

interface PaymentSummaryProps {
  items: LineItem[];
  paymentStatus: 'waiting' | 'processing' | 'paid' | 'none';
  onPayNow: () => void;
  isLoading?: boolean;
}

const PaymentSummary = ({ 
  items, 
  paymentStatus, 
  onPayNow,
  isLoading = false 
}: PaymentSummaryProps) => {
  const monthlyItems = items.filter(i => i.type !== 'one-off');
  const oneOffItems = items.filter(i => i.type === 'one-off');
  
  const monthlyTotal = monthlyItems.reduce((sum, item) => sum + item.price, 0);
  const oneOffTotal = oneOffItems.reduce((sum, item) => sum + item.price, 0);
  const grandTotal = monthlyTotal + oneOffTotal;

  const getStatusBadge = () => {
    switch (paymentStatus) {
      case 'waiting':
        return (
          <Badge className="bg-amber-500/10 text-amber-500 border-amber-500/20">
            Awaiting Payment
          </Badge>
        );
      case 'processing':
        return (
          <Badge className="bg-blue-500/10 text-blue-500 border-blue-500/20">
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

  return (
    <Card className="sticky top-4 overflow-hidden">
      
      
      <CardHeader className="pb-4">
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <CreditCard className="h-5 w-5" />
            Order Summary
          </CardTitle>
          {getStatusBadge()}
        </div>
      </CardHeader>
      
      <CardContent className="space-y-4">
        {/* Monthly Items */}
        <AnimatePresence mode="popLayout">
          {monthlyItems.length > 0 && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="space-y-2"
            >
              <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                Monthly Services
              </p>
              {monthlyItems.map((item, index) => (
                <motion.div
                  key={item.name}
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -10 }}
                  transition={{ delay: index * 0.05 }}
                  className="flex items-center justify-between py-1"
                >
                  <span className="text-sm">{item.name}</span>
                  <span className="text-sm font-medium">£{item.price.toFixed(2)}</span>
                </motion.div>
              ))}
            </motion.div>
          )}
        </AnimatePresence>

        {/* One-off Items */}
        <AnimatePresence mode="popLayout">
          {oneOffItems.length > 0 && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="space-y-2"
            >
              <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                One-time Charges
              </p>
              {oneOffItems.map((item, index) => (
                <motion.div
                  key={item.name}
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -10 }}
                  transition={{ delay: index * 0.05 }}
                  className="flex items-center justify-between py-1"
                >
                  <span className="text-sm">{item.name}</span>
                  <span className="text-sm font-medium">£{item.price.toFixed(2)}</span>
                </motion.div>
              ))}
            </motion.div>
          )}
        </AnimatePresence>

        <Separator />

        {/* Totals */}
        <div className="space-y-2">
          {monthlyItems.length > 0 && (
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">Monthly subtotal</span>
              <span>£{monthlyTotal.toFixed(2)}/mo</span>
            </div>
          )}
          {oneOffItems.length > 0 && (
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">One-time charges</span>
              <span>£{oneOffTotal.toFixed(2)}</span>
            </div>
          )}
        </div>

        <Separator />

        <div className="flex items-center justify-between">
          <span className="text-lg font-semibold">Total Due Today</span>
          <motion.span
            key={grandTotal}
            initial={{ scale: 1.2, color: 'hsl(var(--primary))' }}
            animate={{ scale: 1, color: 'inherit' }}
            className="text-2xl font-bold"
          >
            £{grandTotal.toFixed(2)}
          </motion.span>
        </div>

        {/* Payment Button */}
        {paymentStatus === 'waiting' && grandTotal > 0 && (
          <Button 
            size="lg" 
            className="w-full gap-2 h-11 text-sm font-medium"
            onClick={onPayNow}
            disabled={isLoading}
          >
            {isLoading ? (
              <>
                <Loader2 className="h-5 w-5 animate-spin" />
                Processing...
              </>
            ) : (
              <>
                <CreditCard className="h-5 w-5" />
                Pay with Stripe
              </>
            )}
          </Button>
        )}

        {paymentStatus === 'paid' && (
          <div className="flex items-center justify-center gap-2 border-t border-border/60 py-3 text-ok">
            <CheckCircle2 className="h-5 w-5" />
            <span className="font-medium">Payment Complete</span>
          </div>
        )}

        {paymentStatus === 'none' && grandTotal === 0 && (
          <p className="text-center text-sm text-muted-foreground py-2">
            Select services to see pricing
          </p>
        )}

        {/* Trust Badges */}
        <div className="flex items-center justify-center gap-4 pt-4 border-t border-border/50">
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

export default PaymentSummary;
