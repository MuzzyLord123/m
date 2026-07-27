import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { Shield, Lock } from 'lucide-react';

interface OrderItem {
  id: string;
  name: string;
  price: number;
  quantity?: number;
  recurring?: boolean;
}

interface OrderSummaryProps {
  items: OrderItem[];
}

const OrderSummary = ({ items }: OrderSummaryProps) => {
  const oneTimeItems = items.filter(i => !i.recurring);
  const recurringItems = items.filter(i => i.recurring);
  
  const subtotal = items.reduce((sum, item) => sum + (item.price * (item.quantity || 1)), 0);
  const monthlyTotal = recurringItems.reduce((sum, item) => sum + (item.price * (item.quantity || 1)), 0);

  return (
    <Card className="sticky top-4">
      <CardHeader className="pb-4">
        <CardTitle className="text-xl">Your Order</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Header */}
        <div className="flex justify-between text-sm font-medium text-muted-foreground pb-2 border-b">
          <span>Product</span>
          <span>Total</span>
        </div>

        {/* Items */}
        <div className="space-y-3">
          {items.map((item) => (
            <div key={item.id} className="flex justify-between items-start">
              <div className="flex-1">
                <span className="text-primary font-medium">{item.name}</span>
                {(item.quantity || 1) > 1 && (
                  <span className="text-muted-foreground"> × {item.quantity}</span>
                )}
                {item.recurring && (
                  <span className="text-xs text-muted-foreground block">(monthly)</span>
                )}
              </div>
              <span className="font-medium">
                £{(item.price * (item.quantity || 1)).toLocaleString()}
                {item.recurring && <span className="text-xs text-muted-foreground">/mo</span>}
              </span>
            </div>
          ))}
        </div>

        <Separator />

        {/* Subtotal */}
        <div className="flex justify-between text-sm">
          <span className="font-medium">Subtotal</span>
          <span>£{subtotal.toLocaleString()}</span>
        </div>

        {/* Total */}
        <div className="flex justify-between text-lg font-bold pt-2 border-t">
          <span>Total</span>
          <span>£{subtotal.toLocaleString()}</span>
        </div>

        {monthlyTotal > 0 && (
          <p className="text-sm text-muted-foreground text-right">
            Then £{monthlyTotal.toLocaleString()}/mo
          </p>
        )}

        <Separator />

        {/* Trust Badges */}
        <div className="flex items-center justify-center gap-4 pt-2">
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

export default OrderSummary;
