import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useStorefront } from '@/contexts/StorefrontContext';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { Package, CalendarDays, User, LogOut, ShoppingBag, Clock, CheckCircle } from 'lucide-react';
import { format } from 'date-fns';

export function VisitorDashboard({ siteId }: { siteId: string }) {
  const { visitor, logout, setAuthOpen } = useStorefront();
  const [orders, setOrders] = useState<any[]>([]);
  const [bookings, setBookings] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!visitor) return;
    const fetchData = async () => {
      const [ordRes, bookRes] = await Promise.all([
        supabase.from('site_orders').select('*').eq('site_id', siteId).eq('customer_email', visitor.email).order('created_at', { ascending: false }).limit(20),
        supabase.from('site_bookings').select('*').eq('site_id', siteId).eq('customer_email', visitor.email).order('booking_date', { ascending: false }).limit(20),
      ]);
      if (ordRes.data) setOrders(ordRes.data);
      if (bookRes.data) setBookings(bookRes.data);
      setLoading(false);
    };
    fetchData();
  }, [visitor, siteId]);

  if (!visitor) {
    return (
      <div className="max-w-md mx-auto p-8 text-center space-y-4">
        <User className="h-16 w-16 mx-auto text-muted-foreground/40" />
        <h3 className="text-xl font-bold">Sign in to view your dashboard</h3>
        <p className="text-muted-foreground">Track your orders and manage your bookings</p>
        <Button onClick={() => setAuthOpen(true)}>Sign In / Create Account</Button>
      </div>
    );
  }

  const statusColor = (status: string) => {
    switch (status) {
      case 'confirmed': case 'paid': case 'completed': return 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400';
      case 'pending': return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400';
      case 'cancelled': return 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400';
      default: return 'bg-muted text-muted-foreground';
    }
  };

  const formatPrice = (amount: number, currency = 'GBP') =>
    new Intl.NumberFormat('en-GB', { style: 'currency', currency }).format(amount);

  return (
    <div className="max-w-3xl mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Welcome, {visitor.name || visitor.email}</h2>
          <p className="text-sm text-muted-foreground">{visitor.email}</p>
        </div>
        <Button variant="outline" size="sm" onClick={logout}>
          <LogOut className="h-4 w-4 mr-2" /> Sign Out
        </Button>
      </div>

      <Tabs defaultValue="orders" className="w-full">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="orders" className="flex items-center gap-2">
            <ShoppingBag className="h-4 w-4" /> Orders
          </TabsTrigger>
          <TabsTrigger value="bookings" className="flex items-center gap-2">
            <CalendarDays className="h-4 w-4" /> Bookings
          </TabsTrigger>
        </TabsList>

        <TabsContent value="orders" className="space-y-3 mt-4">
          {orders.length === 0 ? (
            <div className="text-center py-12">
              <Package className="h-12 w-12 mx-auto text-muted-foreground/40 mb-3" />
              <p className="text-muted-foreground">No orders yet</p>
            </div>
          ) : (
            orders.map(order => (
              <Card key={order.id}>
                <CardHeader className="pb-2">
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-sm font-mono">{order.order_number}</CardTitle>
                    <Badge className={statusColor(order.status)}>{order.status}</Badge>
                  </div>
                </CardHeader>
                <CardContent className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">{format(new Date(order.created_at), 'dd MMM yyyy')}</span>
                    <span className="font-semibold">{formatPrice(order.total_amount, order.currency)}</span>
                  </div>
                  {order.items && (
                    <div className="text-xs text-muted-foreground">
                      {(order.items as any[]).map((item: any, i: number) => (
                        <span key={i}>{item.name} x{item.quantity}{i < order.items.length - 1 ? ', ' : ''}</span>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            ))
          )}
        </TabsContent>

        <TabsContent value="bookings" className="space-y-3 mt-4">
          {bookings.length === 0 ? (
            <div className="text-center py-12">
              <CalendarDays className="h-12 w-12 mx-auto text-muted-foreground/40 mb-3" />
              <p className="text-muted-foreground">No bookings yet</p>
            </div>
          ) : (
            bookings.map(booking => (
              <Card key={booking.id}>
                <CardContent className="pt-4">
                  <div className="flex items-center justify-between mb-2">
                    <h4 className="font-medium text-sm">{booking.service_name}</h4>
                    <Badge className={statusColor(booking.status)}>{booking.status}</Badge>
                  </div>
                  <div className="flex items-center gap-4 text-sm text-muted-foreground">
                    <span className="flex items-center gap-1">
                      <CalendarDays className="h-3.5 w-3.5" />
                      {format(new Date(booking.booking_date), 'EEE, dd MMM yyyy')}
                    </span>
                    <span className="flex items-center gap-1">
                      <Clock className="h-3.5 w-3.5" />
                      {booking.start_time?.slice(0, 5)} ({booking.duration_minutes}min)
                    </span>
                  </div>
                  {booking.notes && <p className="text-xs text-muted-foreground mt-2">{booking.notes}</p>}
                </CardContent>
              </Card>
            ))
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}
