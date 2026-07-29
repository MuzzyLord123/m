import { useState, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Skeleton } from '@/components/ui/skeleton';
import { 
  LineChart, 
  Line, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  Legend, 
  ResponsiveContainer 
} from 'recharts';
import { format, subDays, subMonths, startOfYear, parseISO, isAfter, isBefore, startOfMonth, endOfMonth } from 'date-fns';
import { TrendingUp } from 'lucide-react';

interface Invoice {
  id: string;
  total_amount: number;
  status: string | null;
  payment_method: string | null;
  created_at: string;
  paid_at: string | null;
}

interface PaymentTrendsChartProps {
  invoices: Invoice[];
  loading?: boolean;
}

type DateRange = '30days' | '3months' | '6months' | '12months' | 'ytd';

/* Series colours from the token set — brand ember and brass plus the
   semantic ok/attend tones. No raw hex. */
const COLORS = {
  oneTime: 'hsl(var(--gold))',
  monthly: 'hsl(var(--ok))',
  awaiting: 'hsl(var(--attend))',
  total: 'hsl(var(--primary))',
};

const PaymentTrendsChart = ({ invoices, loading = false }: PaymentTrendsChartProps) => {
  const [dateRange, setDateRange] = useState<DateRange>('6months');
  const [hiddenLines, setHiddenLines] = useState<Set<string>>(new Set());

  const getDateRangeFilter = (range: DateRange) => {
    const now = new Date();
    switch (range) {
      case '30days':
        return subDays(now, 30);
      case '3months':
        return subMonths(now, 3);
      case '6months':
        return subMonths(now, 6);
      case '12months':
        return subMonths(now, 12);
      case 'ytd':
        return startOfYear(now);
      default:
        return subMonths(now, 6);
    }
  };

  const chartData = useMemo(() => {
    const startDate = getDateRangeFilter(dateRange);
    const now = new Date();
    
    // Filter invoices within date range
    const filteredInvoices = invoices.filter(inv => {
      const invDate = parseISO(inv.created_at);
      return isAfter(invDate, startDate) && isBefore(invDate, now);
    });

    // Group by month
    const monthlyData: Record<string, {
      oneTime: number;
      monthly: number;
      awaiting: number;
      total: number;
    }> = {};

    // Initialize months
    let currentDate = startOfMonth(startDate);
    while (isBefore(currentDate, now)) {
      const monthKey = format(currentDate, 'MMM yyyy');
      monthlyData[monthKey] = { oneTime: 0, monthly: 0, awaiting: 0, total: 0 };
      currentDate = startOfMonth(subMonths(currentDate, -1));
    }

    // Aggregate data
    filteredInvoices.forEach(inv => {
      const monthKey = format(parseISO(inv.created_at), 'MMM yyyy');
      if (!monthlyData[monthKey]) {
        monthlyData[monthKey] = { oneTime: 0, monthly: 0, awaiting: 0, total: 0 };
      }

      const amount = inv.total_amount || 0;
      const isSubscription = inv.payment_method === 'subscription' || inv.payment_method === 'recurring';
      const isPaid = inv.status === 'paid';
      const isAwaiting = inv.status === 'awaiting_payment' || inv.status === 'sent' || inv.status === 'pending';

      if (isPaid) {
        if (isSubscription) {
          monthlyData[monthKey].monthly += amount;
        } else {
          monthlyData[monthKey].oneTime += amount;
        }
        monthlyData[monthKey].total += amount;
      }

      if (isAwaiting) {
        monthlyData[monthKey].awaiting += amount;
      }
    });

    // Convert to array and sort by date
    return Object.entries(monthlyData)
      .map(([month, data]) => ({
        month,
        ...data
      }))
      .sort((a, b) => {
        const dateA = new Date(a.month);
        const dateB = new Date(b.month);
        return dateA.getTime() - dateB.getTime();
      });
  }, [invoices, dateRange]);

  const formatCurrency = (value: number) => {
    return `£${value.toLocaleString('en-GB', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`;
  };

  const toggleLine = (dataKey: string) => {
    setHiddenLines(prev => {
      const newSet = new Set(prev);
      if (newSet.has(dataKey)) {
        newSet.delete(dataKey);
      } else {
        newSet.add(dataKey);
      }
      return newSet;
    });
  };

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-background border border-border rounded-lg shadow-lg p-3 min-w-[180px]">
          <p className="font-medium text-sm mb-2">{label}</p>
          {payload.map((entry: any, index: number) => (
            <div key={index} className="flex items-center justify-between gap-4 text-sm">
              <div className="flex items-center gap-2">
                <div 
                  className="w-3 h-3 rounded-sm" 
                  style={{ backgroundColor: entry.color }}
                />
                <span className="text-muted-foreground">{entry.name}</span>
              </div>
              <span className="font-medium">{formatCurrency(entry.value)}</span>
            </div>
          ))}
        </div>
      );
    }
    return null;
  };

  const CustomLegend = ({ payload }: any) => {
    if (!payload) return null;
    
    return (
      <div className="flex flex-wrap items-center justify-center gap-4 mt-4">
        {payload.map((entry: any, index: number) => {
          const isHidden = hiddenLines.has(entry.dataKey);
          return (
            <button
              key={index}
              onClick={() => toggleLine(entry.dataKey)}
              className={`flex items-center gap-2 px-2 py-1 rounded-md transition-all ${
                isHidden ? 'opacity-40' : 'opacity-100 hover:bg-muted'
              }`}
            >
              <div 
                className="w-3 h-3 rounded-sm" 
                style={{ backgroundColor: entry.color }}
              />
              <span className="text-sm text-muted-foreground">{entry.value}</span>
            </button>
          );
        })}
      </div>
    );
  };

  if (loading) {
    return (
      <Card>
        <CardHeader className="flex flex-row items-center justify-between pb-2">
          <Skeleton className="h-6 w-48" />
          <Skeleton className="h-10 w-40" />
        </CardHeader>
        <CardContent>
          <Skeleton className="h-[350px] w-full" />
        </CardContent>
      </Card>
    );
  }

  const hasData = chartData.some(d => d.oneTime > 0 || d.monthly > 0 || d.awaiting > 0 || d.total > 0);

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <div className="flex items-center gap-2">
          <TrendingUp className="h-5 w-5 text-primary" />
          <CardTitle className="text-lg font-semibold">Payment Trends</CardTitle>
        </div>
        <Select value={dateRange} onValueChange={(v) => setDateRange(v as DateRange)}>
          <SelectTrigger className="w-[160px]">
            <SelectValue placeholder="Select range" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="30days">Last 30 Days</SelectItem>
            <SelectItem value="3months">Last 3 Months</SelectItem>
            <SelectItem value="6months">Last 6 Months</SelectItem>
            <SelectItem value="12months">Last 12 Months</SelectItem>
            <SelectItem value="ytd">Year to Date</SelectItem>
          </SelectContent>
        </Select>
      </CardHeader>
      <CardContent>
        {!hasData ? (
          <div className="flex items-center justify-center h-[350px] text-muted-foreground">
            <div className="text-center">
              <TrendingUp className="h-12 w-12 mx-auto mb-3 opacity-30" />
              <p>No invoice data available for this period</p>
            </div>
          </div>
        ) : (
          <ResponsiveContainer width="100%" height={350}>
            <LineChart data={chartData} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" className="stroke-border/50" />
              <XAxis 
                dataKey="month" 
                tick={{ fontSize: 12 }}
                className="text-muted-foreground"
                tickLine={false}
                axisLine={{ className: 'stroke-border' }}
              />
              <YAxis 
                tickFormatter={formatCurrency}
                tick={{ fontSize: 12 }}
                className="text-muted-foreground"
                tickLine={false}
                axisLine={{ className: 'stroke-border' }}
                width={80}
              />
              <Tooltip content={<CustomTooltip />} />
              <Legend content={<CustomLegend />} />
              
              {!hiddenLines.has('oneTime') && (
                <Line
                  type="monotone"
                  dataKey="oneTime"
                  name="One-time Payments"
                  stroke={COLORS.oneTime}
                  strokeWidth={2}
                  dot={{ fill: COLORS.oneTime, strokeWidth: 2, r: 4 }}
                  activeDot={{ r: 6, strokeWidth: 2 }}
                />
              )}
              
              {!hiddenLines.has('monthly') && (
                <Line
                  type="monotone"
                  dataKey="monthly"
                  name="Monthly Payments"
                  stroke={COLORS.monthly}
                  strokeWidth={2}
                  dot={{ fill: COLORS.monthly, strokeWidth: 2, r: 4 }}
                  activeDot={{ r: 6, strokeWidth: 2 }}
                />
              )}
              
              {!hiddenLines.has('awaiting') && (
                <Line
                  type="monotone"
                  dataKey="awaiting"
                  name="Awaiting Payments"
                  stroke={COLORS.awaiting}
                  strokeWidth={2}
                  dot={{ fill: COLORS.awaiting, strokeWidth: 2, r: 4 }}
                  activeDot={{ r: 6, strokeWidth: 2 }}
                />
              )}
              
              {!hiddenLines.has('total') && (
                <Line
                  type="monotone"
                  dataKey="total"
                  name="Total Payments"
                  stroke={COLORS.total}
                  strokeWidth={2}
                  dot={{ fill: COLORS.total, strokeWidth: 2, r: 4 }}
                  activeDot={{ r: 6, strokeWidth: 2 }}
                />
              )}
            </LineChart>
          </ResponsiveContainer>
        )}
      </CardContent>
    </Card>
  );
};

export default PaymentTrendsChart;
