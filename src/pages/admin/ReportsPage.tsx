import { useState } from 'react';
import { BarChart3, Download, FileText } from 'lucide-react';
import {
  Bar,
  BarChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { useProductReport, useRevenueReport } from '@/hooks/useRestaurant';
import { cn, formatCompact, formatCurrency } from '@/lib/utils';

const periods = [
  { value: 'day' as const, label: 'Today' },
  { value: 'week' as const, label: '7 days' },
  { value: 'month' as const, label: '30 days' },
  { value: 'year' as const, label: '12 months' },
];

const mockData = Array.from({ length: 7 }).map((_, i) => ({
  label: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'][i],
  value: Math.round(2000 + Math.random() * 4000 + i * 300),
}));

export default function ReportsPage() {
  const [period, setPeriod] = useState<'day' | 'week' | 'month' | 'year'>('week');
  const { data: revenue, isLoading: revLoading } = useRevenueReport(period);
  const { data: products, isLoading: prodLoading } = useProductReport();

  const data = revenue?.breakdown?.length ? revenue.breakdown : mockData;

  return (
    <div className="container py-6 lg:py-8">
      <div className="mb-6 flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="flex items-center gap-2 font-serif text-3xl font-bold tracking-tight">
            <BarChart3 className="size-6 text-primary" />
            Reports & Analytics
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Trends, top products, and exports.
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" className="gap-1.5">
            <FileText className="size-4" /> Export PDF
          </Button>
          <Button variant="outline" className="gap-1.5">
            <Download className="size-4" /> Export CSV
          </Button>
        </div>
      </div>

      <Card className="mb-4">
        <CardHeader className="flex-row items-center justify-between space-y-0">
          <div>
            <CardTitle className="text-lg">Revenue</CardTitle>
            <p className="text-sm text-muted-foreground">Breakdown by {period}</p>
          </div>
          <div className="flex gap-1 rounded-lg bg-muted/60 p-1">
            {periods.map((p) => (
              <button
                key={p.value}
                onClick={() => setPeriod(p.value)}
                className={cn(
                  'rounded-md px-3 py-1.5 text-xs font-semibold transition-colors',
                  period === p.value ? 'bg-background shadow-soft' : 'text-muted-foreground hover:bg-background/50',
                )}
              >
                {p.label}
              </button>
            ))}
          </div>
        </CardHeader>
        <CardContent className="h-[320px] pl-0">
          {revLoading ? (
            <div className="grid h-full place-items-center">
              <Skeleton className="h-[260px] w-full" />
            </div>
          ) : (
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={data} margin={{ top: 10, right: 16, left: 0, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" vertical={false} />
                <XAxis dataKey="label" stroke="hsl(var(--muted-foreground))" fontSize={12} tickLine={false} axisLine={false} />
                <YAxis
                  stroke="hsl(var(--muted-foreground))"
                  fontSize={12}
                  tickLine={false}
                  axisLine={false}
                  tickFormatter={(v) => `₹${formatCompact(v as number)}`}
                />
                <Tooltip
                  contentStyle={{
                    background: 'hsl(var(--card))',
                    border: '1px solid hsl(var(--border))',
                    borderRadius: 8,
                    fontSize: 12,
                  }}
                  formatter={(v: number) => [formatCurrency(v), 'Revenue']}
                />
                <Bar dataKey="value" fill="#ff6b00" radius={[8, 8, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Top Products</CardTitle>
          <p className="text-sm text-muted-foreground">By quantity sold</p>
        </CardHeader>
        <CardContent className="p-0">
          {prodLoading ? (
            <div className="space-y-2 p-4">
              {Array.from({ length: 5 }).map((_, i) => (
                <Skeleton key={i} className="h-12" />
              ))}
            </div>
          ) : (
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border bg-muted/30 text-xs uppercase tracking-wider text-muted-foreground">
                  <th className="px-4 py-2.5 text-left font-semibold">Rank</th>
                  <th className="px-4 py-2.5 text-left font-semibold">Product</th>
                  <th className="px-4 py-2.5 text-right font-semibold">Qty Sold</th>
                  <th className="px-4 py-2.5 text-right font-semibold">Revenue</th>
                </tr>
              </thead>
              <tbody>
                {(products ?? mockProducts).slice(0, 10).map((p, i) => (
                  <tr key={p.product_id ?? i} className="border-b border-border/40 last:border-0 hover:bg-accent/30">
                    <td className="px-4 py-3">
                      <span className="grid size-7 place-items-center rounded-md bg-primary/10 font-mono text-xs font-bold text-primary">
                        {i + 1}
                      </span>
                    </td>
                    <td className="px-4 py-3 font-medium">{p.name}</td>
                    <td className="px-4 py-3 text-right tabular-nums">{p.quantity_sold}</td>
                    <td className="px-4 py-3 text-right font-semibold tabular-nums">
                      {formatCurrency(p.revenue)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

const mockProducts = [
  { product_id: '1', name: 'Paneer Tikka Masala', quantity_sold: 142, revenue: 42_600 },
  { product_id: '2', name: 'Margherita Pizza', quantity_sold: 128, revenue: 38_400 },
  { product_id: '3', name: 'Chicken Biryani', quantity_sold: 95, revenue: 28_500 },
  { product_id: '4', name: 'Masala Dosa', quantity_sold: 87, revenue: 13_050 },
  { product_id: '5', name: 'Cold Coffee', quantity_sold: 76, revenue: 9_120 },
];
