import { useStorefront } from '@/contexts/StorefrontContext';
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { ShoppingCart, Trash2, Plus, Minus, CreditCard, Loader2 } from 'lucide-react';

export function StorefrontCart() {
  const { cart, cartOpen, setCartOpen, removeFromCart, updateQuantity, cartTotal, cartCount, checkout, checkingOut, clearCart } = useStorefront();

  const formatPrice = (amount: number, currency = 'GBP') => {
    return new Intl.NumberFormat('en-GB', { style: 'currency', currency }).format(amount);
  };

  return (
    <Sheet open={cartOpen} onOpenChange={setCartOpen}>
      <SheetContent className="flex flex-col w-full sm:max-w-lg">
        <SheetHeader>
          <SheetTitle className="flex items-center gap-2">
            <ShoppingCart className="h-5 w-5" />
            Cart
            {cartCount > 0 && <Badge variant="secondary">{cartCount}</Badge>}
          </SheetTitle>
        </SheetHeader>

        {cart.length === 0 ? (
          <div className="flex-1 flex items-center justify-center">
            <div className="text-center space-y-2">
              <ShoppingCart className="h-12 w-12 mx-auto text-muted-foreground/40" />
              <p className="text-muted-foreground">Your cart is empty</p>
            </div>
          </div>
        ) : (
          <>
            <div className="flex-1 overflow-y-auto space-y-3 py-4">
              {cart.map(item => (
                <div key={item.product_id} className="flex gap-3 p-3 rounded-lg border bg-card">
                  {item.image && (
                    <img src={item.image} alt={item.name} className="w-16 h-16 object-cover rounded-md" />
                  )}
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-sm truncate">{item.name}</p>
                    <p className="text-sm text-muted-foreground">{formatPrice(item.price, item.currency)}</p>
                    <div className="flex items-center gap-2 mt-2">
                      <Button variant="outline" size="icon" className="h-7 w-7" onClick={() => updateQuantity(item.product_id, item.quantity - 1)}>
                        <Minus className="h-3 w-3" />
                      </Button>
                      <span className="text-sm font-medium w-6 text-center">{item.quantity}</span>
                      <Button variant="outline" size="icon" className="h-7 w-7" onClick={() => updateQuantity(item.product_id, item.quantity + 1)}>
                        <Plus className="h-3 w-3" />
                      </Button>
                    </div>
                  </div>
                  <div className="flex flex-col items-end justify-between">
                    <Button variant="ghost" size="icon" className="h-7 w-7 text-destructive" onClick={() => removeFromCart(item.product_id)}>
                      <Trash2 className="h-3.5 w-3.5" />
                    </Button>
                    <p className="text-sm font-semibold">{formatPrice(item.price * item.quantity, item.currency)}</p>
                  </div>
                </div>
              ))}
            </div>

            <div className="space-y-3 pt-3 border-t">
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Subtotal</span>
                <span className="font-semibold">{formatPrice(cartTotal)}</span>
              </div>
              <Separator />
              <Button className="w-full" size="lg" onClick={checkout} disabled={checkingOut}>
                {checkingOut ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <CreditCard className="h-4 w-4 mr-2" />}
                {checkingOut ? 'Processing...' : `Checkout ${formatPrice(cartTotal)}`}
              </Button>
              <Button variant="ghost" size="sm" className="w-full" onClick={clearCart}>Clear Cart</Button>
            </div>
          </>
        )}
      </SheetContent>
    </Sheet>
  );
}
