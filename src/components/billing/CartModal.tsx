import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { ShoppingCart, Globe, Sparkles, CreditCard, Trash2, ArrowRight } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

interface CartItem {
  id: string;
  name: string;
  price: number;
  type: 'website' | 'plan' | 'addon' | 'one-off';
}

interface CartModalProps {
  items: CartItem[];
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  onRemoveItem?: (id: string) => void;
  onCheckout: () => void;
  onClearCart?: () => void;
}

const CartModal = ({ 
  items, 
  isOpen, 
  onOpenChange, 
  onRemoveItem,
  onCheckout,
  onClearCart
}: CartModalProps) => {
  const websiteItems = items.filter(i => i.type === 'website');
  const monthlyItems = items.filter(i => i.type === 'plan' || i.type === 'addon');
  const oneOffItems = items.filter(i => i.type === 'one-off');

  const websiteTotal = websiteItems.reduce((sum, item) => sum + item.price, 0);
  const monthlyTotal = monthlyItems.reduce((sum, item) => sum + item.price, 0);
  const oneOffTotal = oneOffItems.reduce((sum, item) => sum + item.price, 0);
  const grandTotal = websiteTotal + monthlyTotal + oneOffTotal;

  const getIcon = (type: string) => {
    switch (type) {
      case 'website': return Globe;
      case 'plan': return Sparkles;
      case 'addon': return Sparkles;
      default: return CreditCard;
    }
  };

  const getTypeLabel = (type: string) => {
    switch (type) {
      case 'website': return 'Website';
      case 'plan': return 'Plan';
      case 'addon': return 'Add-on';
      default: return 'One-time';
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <ShoppingCart className="h-5 w-5" />
            Your Cart
            {items.length > 0 && (
              <Badge variant="secondary" className="ml-2">
                {items.length} items
              </Badge>
            )}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4 max-h-[60vh] overflow-y-auto">
          {items.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <ShoppingCart className="h-12 w-12 mx-auto mb-3 opacity-30" />
              <p className="text-sm">Your cart is empty</p>
              <p className="text-xs mt-1">Select services to add them to your cart</p>
            </div>
          ) : (
            <AnimatePresence mode="popLayout">
              {items.map((item, index) => {
                const Icon = getIcon(item.type);
                return (
                  <motion.div
                    key={item.id}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: 20 }}
                    transition={{ delay: index * 0.05 }}
                    className="flex items-center gap-3 p-3 bg-muted/30 rounded-lg group"
                  >
                    <div className="p-2 bg-primary/10 rounded-lg">
                      <Icon className="h-4 w-4 text-primary" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-sm truncate">{item.name}</p>
                      <p className="text-xs text-muted-foreground">{getTypeLabel(item.type)}</p>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="font-semibold text-sm">
                        £{item.price.toLocaleString()}
                        {(item.type === 'plan' || item.type === 'addon') && '/mo'}
                      </span>
                      {onRemoveItem && (
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 opacity-0 group-hover:opacity-100 transition-opacity"
                          onClick={() => onRemoveItem(item.id)}
                        >
                          <Trash2 className="h-4 w-4 text-destructive" />
                        </Button>
                      )}
                    </div>
                  </motion.div>
                );
              })}
            </AnimatePresence>
          )}

          {items.length > 0 && (
            <>
              <Separator />

              {/* Totals */}
              <div className="space-y-2">
                {websiteTotal > 0 && (
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Website (one-time)</span>
                    <span>£{websiteTotal.toLocaleString()}</span>
                  </div>
                )}
                {monthlyTotal > 0 && (
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Monthly</span>
                    <span>£{monthlyTotal.toLocaleString()}/mo</span>
                  </div>
                )}
                {oneOffTotal > 0 && (
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">One-time charges</span>
                    <span>£{oneOffTotal.toLocaleString()}</span>
                  </div>
                )}
              </div>

              <Separator />

              <div className="flex justify-between items-center">
                <span className="text-lg font-semibold">Total Due</span>
                <span className="text-2xl font-bold">£{grandTotal.toLocaleString()}</span>
              </div>

              {/* Actions */}
              <div className="space-y-2 pt-2">
                <Button 
                  size="lg" 
                  className="w-full gap-2"
                  onClick={() => {
                    onOpenChange(false);
                    onCheckout();
                  }}
                >
                  <CreditCard className="h-4 w-4" />
                  Proceed to Checkout
                  <ArrowRight className="h-4 w-4" />
                </Button>
                {onClearCart && (
                  <Button 
                    variant="outline" 
                    size="sm" 
                    className="w-full gap-2 text-destructive hover:text-destructive"
                    onClick={onClearCart}
                  >
                    <Trash2 className="h-4 w-4" />
                    Clear Cart
                  </Button>
                )}
              </div>
            </>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default CartModal;
