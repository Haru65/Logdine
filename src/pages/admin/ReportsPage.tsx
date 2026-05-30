import { useMemo, useState } from 'react';
import { BarChart3, Download, FileText, PackageSearch } from 'lucide-react';
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
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { useProductReport, useRevenueReport } from '@/hooks/useRestaurant';
import { cn, formatCompact, formatCurrency, formatDate } from '@/lib/utils';

const periods = [
  { value: 'day' as const, label: 'Today', days: 0 },
  { value: 'week' as const, label: '7 days', days: 6 },
  { value: 'month' as const, label: '30 days', days: 29 },
  { value: 'year' as const, label: '12 months', days: 364 },
];

type Period = (typeof periods)[number]['value'];

function toDateInput(date: Date) {
  return date.toISOString().slice(0, 10);
}

function getRange(period: Period) {
  const end = new Date();
  const start = new Date();
  const days = periods.find((p) => p.value === period)?.days ?? 6;
  start.setDate(end.getDate() - days);
  return { startDate: toDateInput(start), endDate: toDateInput(end) };
}

export default function ReportsPage() {
  const [period, setPeriod] = useState<Period>('week');
  const [dates, setDates] = useState(() => getRange('week'));

  const { data: revenue, isLoading: revLoading, isError: revError } = useRevenueReport(period, dates);
  const { data: products, isLoading: prodLoading, isError: prodError } = useProductReport(dates);

  const chartData = useMemo(
    () =>
      (revenue?.data ?? [])
        .slice()
        .reverse()
        .map((row) => ({
          label: row.period,
          value: Number(row.total_revenue ?? 0),
          orders: Number(row.total_orders ?? 0),
        })),
    [revenue],
  );

  const productRows = products?.items ?? [];
  const summary = revenue?.summary;

  function selectPeriod(next: Period) {
    setPeriod(next);
    setDates(getRange(next));
  }

  function exportCsv() {
    const rows = [
      ['Period', 'Revenue', 'Orders'],
      ...chartData.map((row) => [row.label, row.value, row.orders]),
      [],
      ['Product', 'Category', 'Qty Sold', 'Revenue'],
      ...productRows.map((row) => [
        row.name,
        row.category_name ?? '',
        Number(row.total_quantity ?? 0),
        Number(row.total_revenue ?? 0),
      ]),
    ];
    const csv = rows.map((row) => row.map((cell) => `"${String(cell).replace(/"/g, '""')}"`).join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `restrohub-report-${dates.startDate}-to-${dates.endDate}.csv`;
    link.click();
    URL.revokeObjectURL(url);
  }

  return (
    <div className="container py-6 lg:py-8">
      <div className="mb-6 flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="flex items-center gap-2 font-serif text-3xl font-bold tracking-tight">
            <BarChart3 className="size-6 text-primary" />
            Reports & Analytics
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Live revenue, order volume, and product performance.
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" className="gap-1.5" onClick={() => window.print()}>
            <FileText className="size-4" /> Export PDF
          </Button>
          <Button variant="outline" className="gap-1.5" onClick={exportCsv}>
            <Download className="size-4" /> Export CSV
          </Button>
        </div>
      </div>

      <Card className="mb-4">
        <CardContent className="grid gap-3 p-4 lg:grid-cols-[1fr_auto]">
          <div className="flex flex-wrap gap-1 rounded-lg bg-muted/60 p-1">
            {periods.map((p) => (
              <button
                key={p.value}
                onClick={() => selectPeriod(p.value)}
                className={cn(
                  'rounded-md px-3 py-1.5 text-xs font-semibold transition-colors',
                  period === p.value ? 'bg-background shadow-soft' : 'text-muted-foreground hover:bg-background/50',
                )}
              >
                {p.label}
              </button>
            ))}
          </div>
          <div className="grid gap-3 sm:grid-cols-2">
            <div className="space-y-1">
              <Label>Start date</Label>
              <Input
                type="date"
                value={dates.startDate}
                onChange={(e) => setDates((value) => ({ ...value, startDate: e.target.value }))}
              />
            </div>
            <div className="space-y-1">
              <Label>End date</Label>
              <Input
                type="date"
                value={dates.endDate}
                onChange={(e) => setDates((value) => ({ ...value, endDate: e.target.value }))}
              />
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="mb-4 grid gap-3 md:grid-cols-4">
        <Metric title="Revenue" value={formatCurrency(summary?.total_revenue ?? 0)} loading={revLoading} />
        <Metric title="Orders" value={String(summary?.total_orders ?? 0)} loading={revLoading} />
        <Metric title="Avg order" value={formatCurrency(summary?.avg_order_value ?? 0)} loading={revLoading} />
        <Metric title="Items sold" value={String(products?.summary?.total_items_sold ?? 0)} loading={prodLoading} />
      </div>

      <Card className="mb-4">
        <CardHeader>
          <CardTitle className="text-lg">Revenue</CardTitle>
          <p className="text-sm text-muted-foreground">
            {formatDate(dates.startDate)} to {formatDate(dates.endDate)}
          </p>
        </CardHeader>
        <CardContent className="h-[320px] pl-0">
          {revLoading ? (
            <div className="grid h-full place-items-center">
              <Skeleton className="h-[260px] w-full" />
            </div>
          ) : revError ? (
            <EmptyState title="Could not load revenue report" />
          ) : chartData.length === 0 ? (
            <EmptyState title="No revenue in this date range" />
          ) : (
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chartData} margin={{ top: 10, right: 16, left: 0, bottom: 0 }}>
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
          <p className="text-sm text-muted-foreground">By quantity sold in the selected date range</p>
        </CardHeader>
        <CardContent className="p-0">
          {prodLoading ? (
            <div className="space-y-2 p-4">
              {Array.from({ length: 5 }).map((_, i) => (
                <Skeleton key={i} className="h-12" />
              ))}
            </div>
          ) : prodError ? (
            <EmptyState title="Could not load product report" />
          ) : productRows.length === 0 ? (
            <EmptyState title="No products sold in this date range" />
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Rank</TableHead>
                  <TableHead>Product</TableHead>
                  <TableHead>Category</TableHead>
                  <TableHead className="text-right">Qty Sold</TableHead>
                  <TableHead className="text-right">Revenue</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {productRows.slice(0, 10).map((p, i) => (
                  <TableRow key={p.id ?? i}>
                    <TableCell>
                      <span className="grid size-7 place-items-center rounded-md bg-primary/10 font-mono text-xs font-bold text-primary">
                        {i + 1}
                      </span>
                    </TableCell>
                    <TableCell className="font-medium">{p.name}</TableCell>
                    <TableCell>{p.category_name ?? '-'}</TableCell>
                    <TableCell className="text-right tabular-nums">{Number(p.total_quantity ?? 0)}</TableCell>
                    <TableCell className="text-right font-semibold tabular-nums">
                      {formatCurrency(Number(p.total_revenue ?? 0))}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

function Metric({ title, value, loading }: { title: string; value: string; loading?: boolean }) {
  return (
    <Card>
      <CardContent className="p-4">
        <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">{title}</p>
        {loading ? <Skeleton className="mt-2 h-7 w-24" /> : <p className="mt-1 font-serif text-2xl font-bold">{value}</p>}
      </CardContent>
    </Card>
  );
}

function EmptyState({ title }: { title: string }) {
  return (
    <div className="grid min-h-40 place-items-center gap-2 p-8 text-center text-muted-foreground">
      <PackageSearch className="size-10 opacity-40" />
      <p className="text-sm font-medium">{title}</p>
    </div>
  );
}
