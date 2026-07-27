import { useStorefront } from '@/contexts/StorefrontContext';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ShoppingCart, User, LogOut } from 'lucide-react';

export function StorefrontHeader() {
  const { cartCount, setCartOpen, visitor, setAuthOpen, logout } = useStorefront();

  return (
    <div className="flex items-center gap-2">
      <Button variant="outline" size="sm" className="relative" onClick={() => setCartOpen(true)}>
        <ShoppingCart className="h-4 w-4" />
        {cartCount > 0 && (
          <Badge className="absolute -top-2 -right-2 h-5 w-5 flex items-center justify-center p-0 text-[10px]">
            {cartCount}
          </Badge>
        )}
      </Button>
      {visitor ? (
        <div className="flex items-center gap-2">
          <span className="text-sm hidden sm:inline">{visitor.name || visitor.email}</span>
          <Button variant="ghost" size="icon" className="h-8 w-8" onClick={logout}>
            <LogOut className="h-4 w-4" />
          </Button>
        </div>
      ) : (
        <Button variant="outline" size="sm" onClick={() => setAuthOpen(true)}>
          <User className="h-4 w-4 mr-1.5" /> Sign In
        </Button>
      )}
    </div>
  );
}
