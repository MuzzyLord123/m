import { useMemo } from 'react';
import { Booking, BookingService, BookingStaff } from '@/hooks/useBookingSystem';
import { BarChart3, CalendarDays, TrendingUp, Users, DollarSign, Clock } from 'lucide-react';

export function BookingAnalytics({ bookings, services, staff }: { bookings: Booking[]; services: BookingService[]; staff: BookingStaff[] }) {
  const stats = useMemo(() => {
    const now = new Date();
    const thisMonth = bookings.filter(b => b.booking_date.startsWith(now.toISOString().slice(0, 7)));
    const confirmed = bookings.filter(b => b.status === 'confirmed' || b.status === 'completed');
    const cancelled = bookings.filter(b => b.status === 'cancelled');
    const totalRevenue = confirmed.reduce((sum, b) => sum + Number(b.price || 0), 0);
    const thisMonthRevenue = thisMonth.filter(b => b.status !== 'cancelled').reduce((sum, b) => sum + Number(b.price || 0), 0);

    // Most booked service
    const serviceCounts: Record<string, number> = {};
    confirmed.forEach(b => {
      const name = (b.booking_services as any)?.name || 'Unknown';
      serviceCounts[name] = (serviceCounts[name] || 0) + 1;
    });
    const topService = Object.entries(serviceCounts).sort((a, b) => b[1] - a[1])[0];

    // Staff utilization
    const staffCounts: Record<string, number> = {};
    confirmed.forEach(b => {
      const name = (b.booking_staff as any)?.name || 'Unassigned';
      staffCounts[name] = (staffCounts[name] || 0) + 1;
    });

    // Source breakdown
    const sourceCounts: Record<string, number> = {};
    bookings.forEach(b => { sourceCounts[b.source] = (sourceCounts[b.source] || 0) + 1; });

    const noShowRate = bookings.length > 0 ? Math.round((cancelled.length / bookings.length) * 100) : 0;

    return {
      total: bookings.length,
      thisMonth: thisMonth.length,
      confirmed: confirmed.length,
      cancelled: cancelled.length,
      totalRevenue,
      thisMonthRevenue,
      topService,
      staffCounts,
      sourceCounts,
      noShowRate,
    };
  }, [bookings]);

  return (
    <div className="space-y-6">
      {/* KPI Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <KPICard icon={<CalendarDays className="h-5 w-5" />} label="Total Bookings" value={String(stats.total)} sub={`${stats.thisMonth} this month`} />
        <KPICard icon={<DollarSign className="h-5 w-5" />} label="Revenue" value={`£${stats.totalRevenue.toFixed(0)}`} sub={`£${stats.thisMonthRevenue.toFixed(0)} this month`} />
        <KPICard icon={<TrendingUp className="h-5 w-5" />} label="Completion Rate" value={`${stats.total > 0 ? Math.round((stats.confirmed / stats.total) * 100) : 0}%`} sub={`${stats.confirmed} confirmed`} />
        <KPICard icon={<Clock className="h-5 w-5" />} label="No-show Rate" value={`${stats.noShowRate}%`} sub={`${stats.cancelled} cancelled`} />
      </div>

      <div className="grid md:grid-cols-2 gap-4">
        {/* Top Services */}
        <div className="rounded-xl border p-4 space-y-3">
          <h3 className="font-semibold flex items-center gap-2"><BarChart3 className="h-4 w-4" /> Top Services</h3>
          {stats.topService ? (
            <div className="space-y-2">
              {Object.entries(
                bookings
                  .filter(b => b.status !== 'cancelled')
                  .reduce((acc, b) => {
                    const name = (b.booking_services as any)?.name || 'Unknown';
                    acc[name] = (acc[name] || 0) + 1;
                    return acc;
                  }, {} as Record<string, number>)
              )
                .sort((a, b) => b[1] - a[1])
                .slice(0, 5)
                .map(([name, count]) => (
                  <div key={name} className="flex items-center justify-between">
                    <span className="text-sm">{name}</span>
                    <div className="flex items-center gap-2">
                      <div className="w-24 h-2 rounded-full bg-muted overflow-hidden">
                        <div className="h-full bg-primary rounded-full" style={{ width: `${(count / stats.confirmed) * 100}%` }} />
                      </div>
                      <span className="text-xs text-muted-foreground w-8 text-right">{count}</span>
                    </div>
                  </div>
                ))}
            </div>
          ) : (
            <p className="text-sm text-muted-foreground">No data yet</p>
          )}
        </div>

        {/* Staff Utilization */}
        <div className="rounded-xl border p-4 space-y-3">
          <h3 className="font-semibold flex items-center gap-2"><Users className="h-4 w-4" /> Staff Utilization</h3>
          {Object.entries(stats.staffCounts).length > 0 ? (
            <div className="space-y-2">
              {Object.entries(stats.staffCounts)
                .sort((a, b) => b[1] - a[1])
                .map(([name, count]) => (
                  <div key={name} className="flex items-center justify-between">
                    <span className="text-sm">{name}</span>
                    <div className="flex items-center gap-2">
                      <div className="w-24 h-2 rounded-full bg-muted overflow-hidden">
                        <div className="h-full bg-accent rounded-full" style={{ width: `${(count / stats.confirmed) * 100}%` }} />
                      </div>
                      <span className="text-xs text-muted-foreground w-8 text-right">{count}</span>
                    </div>
                  </div>
                ))}
            </div>
          ) : (
            <p className="text-sm text-muted-foreground">No data yet</p>
          )}
        </div>

        {/* Booking Sources */}
        <div className="rounded-xl border p-4 space-y-3 md:col-span-2">
          <h3 className="font-semibold">Booking Sources</h3>
          <div className="flex gap-4">
            {Object.entries(stats.sourceCounts).map(([source, count]) => (
              <div key={source} className="flex items-center gap-2 bg-muted rounded-lg px-3 py-2">
                <span className="text-sm font-medium capitalize">{source.replace('_', ' ')}</span>
                <span className="text-xs bg-background rounded-full px-2 py-0.5">{count}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

function KPICard({ icon, label, value, sub }: { icon: React.ReactNode; label: string; value: string; sub: string }) {
  return (
    <div className="rounded-xl border p-4 space-y-1 bg-card">
      <div className="flex items-center gap-2 text-muted-foreground">{icon}<span className="text-xs">{label}</span></div>
      <p className="text-2xl font-bold">{value}</p>
      <p className="text-xs text-muted-foreground">{sub}</p>
    </div>
  );
}
