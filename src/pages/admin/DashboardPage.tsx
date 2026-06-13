import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import {
  ArrowDownRight,
  ArrowRight,
  ArrowUpRight,
  ChefHat,
  CircleDollarSign,
  CreditCard,
  Receipt,
  ShoppingBag,
  Soup,
  Table2,
  TrendingUp,
  Users,
} from 'lucide-react';
import {
  Area,
  AreaChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { useDashboardMetrics, useTables } from '@/hooks/useRestaurant';
import { useAuthStore } from '@/store/auth.store';
import { cn, formatCurrency, formatCompact, formatDate } from '@/lib/utils';
import type { TableStatus } from '@/types';

const statusStyles: Record<TableStatus, { dot: string; label: string; ring: string }> = {
  available: { dot: 'bg-emerald-500', label: 'Available', ring: 'ring-emerald-500/30' },
  occupied: { dot: 'bg-red-500', label: 'Occupied', ring: 'ring-red-500/30' },
  reserved: { dot: 'bg-amber-500', label: 'Reserved', ring: 'ring-amber-500/30' },
  maintenance: { dot: 'bg-slate-400', label: 'Maintenance', ring: 'ring-slate-400/30' },
};

// Mock fallback so the dashboard always renders something — replaced by API.
const mockTrend = Array.from({ length: 7 }).map((_, i) => ({
  date: `D${i + 1}`,
  value: 1200 + Math.round(Math.sin(i) * 400 + Math.random() * 600 + i * 200),
}));

type KpiDelta = {
  label: string;
  tone: 'positive' | 'negative' | 'neutral' | 'warning';
};

function formatPercentDelta(value?: number | null): KpiDelta {
  if (value === null) return { label: 'New today', tone: 'positive' };
  if (value === undefined || Math.abs(value) < 0.05) return { label: 'No change', tone: 'neutral' };
  const sign = value > 0 ? '+' : '';
  return {
    label: `${sign}${value.toFixed(1)}% vs yesterday`,
    tone: value > 0 ? 'positive' : 'negative',
  };
}

function formatCountDelta(today?: number, growth?: number | null): KpiDelta {
  const count = today ?? 0;
  const growthText = growth === null ? 'new' : growth === undefined || Math.abs(growth) < 0.05 ? 'flat' : `${growth > 0 ? '+' : ''}${growth.toFixed(1)}%`;
  return {
    label: `${count} today · ${growthText}`,
    tone: growth === null || (growth ?? 0) > 0 ? 'positive' : (growth ?? 0) < 0 ? 'negative' : 'neutral',
  };
}

function formatCurrencyDelta(value?: number): KpiDelta {
  const delta = value ?? 0;
  if (Math.abs(delta) < 0.01) return { label: 'No change', tone: 'neutral' };
  return {
    label: `${delta > 0 ? '+' : '-'}${formatCurrency(Math.abs(delta))} vs yesterday`,
    tone: delta > 0 ? 'positive' : 'negative',
  };
}

export default function DashboardPage() {
  const { data: metrics, isLoading } = useDashboardMetrics();
  const { data: tables, isLoading: tablesLoading } = useTables();
  const user = useAuthStore((s) => s.user);

  const trend = metrics?.revenue_trend?.length ? metrics.revenue_trend : mockTrend;
  const revenueDelta = formatPercentDelta(metrics?.revenue_growth_percent);
  const ordersDelta = formatCountDelta(metrics?.today_orders, metrics?.orders_growth_percent);
  const avgOrderDelta = formatCurrencyDelta(metrics?.avg_order_value_delta);
  const unpaidDelta: KpiDelta = metrics?.unpaid_bills
    ? { label: `${metrics.unpaid_bills} awaiting payment`, tone: 'warning' }
    : { label: 'All clear', tone: 'positive' };

  return (
    <div className="container space-y-6 py-6 lg:py-8">
      {/* -------- Welcome hero -------- */}
      <motion.section
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className="relative overflow-hidden rounded-2xl bg-gradient-warm p-6 text-white shadow-float md:p-8"
      >
        <div className="absolute inset-0 grain opacity-60" />
        <div className="absolute -right-12 -top-12 size-56 rounded-full bg-white/10 blur-3xl" />
        <div className="relative flex flex-col gap-2 md:flex-row md:items-end md:justify-between">
          <div>
            <p className="text-sm font-medium text-white/80">
              {formatDate(new Date().toISOString())}
            </p>
            <h1 className="mt-1 font-serif text-3xl font-bold tracking-tight md:text-4xl">
              Welcome back, {user?.tenant?.name || user?.name || 'Chef'}!
            </h1>
            <p className="mt-1 max-w-prose text-white/85">
              Here's your restaurant at a glance — orders flowing, kitchens humming.
            </p>
          </div>
          <div className="flex shrink-0 items-center gap-3">
            <Link
              to="/pos"
              className="inline-flex items-center gap-2 rounded-full bg-white px-4 py-2.5 text-sm font-semibold text-primary shadow-soft hover:shadow-float transition-shadow"
            >
              Open POS
              <ArrowRight className="size-4" />
            </Link>
          </div>
        </div>
      </motion.section>

      {/* -------- KPI cards -------- */}
      <section className="grid grid-cols-2 gap-3 md:gap-4 lg:grid-cols-4">
        <KpiCard
          icon={<CircleDollarSign className="size-5" />}
          label="Total Revenue"
          value={isLoading ? null : formatCurrency(metrics?.total_revenue ?? 0)}
          accent="from-emerald-500/20 to-emerald-500/5 text-emerald-600"
          delta={isLoading ? undefined : revenueDelta}
        />
        <KpiCard
          icon={<ShoppingBag className="size-5" />}
          label="Total Orders"
          value={isLoading ? null : formatCompact(metrics?.total_orders ?? 0)}
          accent="from-sky-500/20 to-sky-500/5 text-sky-600"
          delta={isLoading ? undefined : ordersDelta}
        />
        <KpiCard
          icon={<TrendingUp className="size-5" />}
          label="Avg Order Value"
          value={isLoading ? null : formatCurrency(metrics?.avg_order_value ?? 0)}
          accent="from-violet-500/20 to-violet-500/5 text-violet-600"
          delta={isLoading ? undefined : avgOrderDelta}
        />
        <KpiCard
          icon={<CreditCard className="size-5" />}
          label="Unpaid Bills"
          value={isLoading ? null : String(metrics?.unpaid_bills ?? 0)}
          accent="from-amber-500/20 to-amber-500/5 text-amber-600"
          delta={isLoading ? undefined : unpaidDelta}
        />
      </section>

      {/* -------- Main grid -------- */}
      <section className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        {/* Live table status */}
        <Card className="lg:col-span-2">
          <CardHeader className="flex-row items-center justify-between space-y-0">
            <div>
              <CardTitle className="flex items-center gap-2 text-lg">
                <Table2 className="size-5 text-primary" />
                Live Table Status
              </CardTitle>
              <div className="mt-2 flex flex-wrap gap-3 text-xs">
                {(['available', 'occupied', 'reserved', 'maintenance'] as TableStatus[]).map((s) => (
                  <span key={s} className="flex items-center gap-1.5 text-muted-foreground">
                    <span className={`size-2 rounded-full ${statusStyles[s].dot}`} />
                    {statusStyles[s].label}
                  </span>
                ))}
              </div>
            </div>
            <Link
              to="/tables"
              className="flex items-center gap-1 text-sm font-semibold text-primary hover:underline"
            >
              Manage <ArrowRight className="size-3.5" />
            </Link>
          </CardHeader>
          <CardContent>
            {tablesLoading ? (
              <div className="grid grid-cols-4 gap-2 sm:grid-cols-6 lg:grid-cols-8">
                {Array.from({ length: 16 }).map((_, i) => (
                  <Skeleton key={i} className="aspect-square rounded-xl" />
                ))}
              </div>
            ) : !tables?.length ? (
              <EmptyState
                title="No tables yet"
                description="Add tables to begin tracking occupancy in real time."
                action={
                  <Link
                    to="/tables"
                    className="inline-flex items-center gap-1.5 rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground"
                  >
                    Add tables <ArrowRight className="size-3.5" />
                  </Link>
                }
              />
            ) : (
              <div className="grid grid-cols-4 gap-2 sm:grid-cols-6 lg:grid-cols-8">
                {tables.map((t) => {
                  const s = statusStyles[t.status] || statusStyles.available;
                  return (
                    <button
                      key={t.id}
                      className={`group relative aspect-square rounded-xl border border-border/60 bg-background p-2 text-left transition-all hover:-translate-y-0.5 hover:shadow-soft hover:ring-2 ${s.ring}`}
                    >
                      <span className={`absolute right-2 top-2 size-2 rounded-full ${s.dot}`} />
                      <p className="font-mono text-xs text-muted-foreground">T</p>
                      <p className="font-serif text-xl font-bold">{t.table_number}</p>
                      <p className="absolute bottom-2 left-2 flex items-center gap-1 text-[10px] text-muted-foreground">
                        <Users className="size-3" /> {t.capacity}
                      </p>
                    </button>
                  );
                })}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Kitchen status */}
        <Card>
          <CardHeader className="flex-row items-center justify-between space-y-0">
            <CardTitle className="flex items-center gap-2 text-lg">
              <ChefHat className="size-5 text-primary" />
              Kitchen Status
            </CardTitle>
            <Link
              to="/kds"
              className="flex items-center gap-1 text-sm font-semibold text-primary hover:underline"
            >
              View <ArrowRight className="size-3.5" />
            </Link>
          </CardHeader>
          <CardContent className="space-y-3">
            <KitchenPill
              tone="amber"
              icon={<Receipt className="size-4" />}
              label="Pending"
              value={metrics?.pending_kitchen ?? 0}
            />
            <KitchenPill
              tone="sky"
              icon={<Soup className="size-4" />}
              label="Preparing"
              value={metrics?.preparing_kitchen ?? 0}
            />
            <KitchenPill
              tone="emerald"
              icon={<ChefHat className="size-4" />}
              label="Ready to Serve"
              value={metrics?.ready_kitchen ?? 0}
            />
          </CardContent>
        </Card>
      </section>

      {/* -------- Revenue chart + top items -------- */}
      <section className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle className="text-lg">Revenue Trend</CardTitle>
            <p className="text-sm text-muted-foreground">Last 7 days</p>
          </CardHeader>
          <CardContent className="h-[260px] pl-0">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={trend} margin={{ top: 10, right: 16, left: 0, bottom: 0 }}>
                <defs>
                  <linearGradient id="rev" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#ff6b00" stopOpacity={0.35} />
                    <stop offset="100%" stopColor="#ff6b00" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" vertical={false} />
                <XAxis
                  dataKey="date"
                  stroke="hsl(var(--muted-foreground))"
                  fontSize={12}
                  tickLine={false}
                  axisLine={false}
                />
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
                <Area
                  type="monotone"
                  dataKey="value"
                  stroke="#ff6b00"
                  strokeWidth={2.5}
                  fill="url(#rev)"
                />
              </AreaChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Top Items</CardTitle>
            <p className="text-sm text-muted-foreground">Sales today</p>
          </CardHeader>
          <CardContent className="space-y-3">
            {(metrics?.top_items ?? mockTopItems).map((item, i) => (
              <div key={item.name} className="flex items-center gap-3">
                <div className="grid size-10 shrink-0 place-items-center rounded-lg bg-primary/10 font-serif font-bold text-primary">
                  {i + 1}
                </div>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-semibold">{item.name}</p>
                  <p className="text-xs text-muted-foreground">{item.count} sold</p>
                </div>
                <span className="text-sm font-semibold tabular-nums">
                  {formatCurrency(item.revenue)}
                </span>
              </div>
            ))}
          </CardContent>
        </Card>
      </section>
    </div>
  );
}

// ---------------------------------------------------------------------------
//  Sub-components
// ---------------------------------------------------------------------------
function KpiCard({
  icon,
  label,
  value,
  accent,
  delta,
}: {
  icon: React.ReactNode;
  label: string;
  value: string | null;
  accent: string;
  delta?: KpiDelta;
}) {
  const deltaStyles = {
    positive: 'text-emerald-600',
    negative: 'text-red-600',
    neutral: 'text-muted-foreground',
    warning: 'text-amber-600',
  }[delta?.tone ?? 'neutral'];
  const DeltaIcon = delta?.tone === 'negative' ? ArrowDownRight : ArrowUpRight;

  return (
    <Card className="relative overflow-hidden">
      <div className={`absolute -right-6 -top-6 size-24 rounded-full bg-gradient-to-br ${accent} blur-xl opacity-50`} />
      <CardContent className="relative p-5">
        <div className="flex items-start justify-between">
          <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
            {label}
          </p>
          <div className={`grid size-9 place-items-center rounded-lg bg-gradient-to-br ${accent}`}>
            {icon}
          </div>
        </div>
        <div className="mt-3 flex items-baseline gap-2">
          {value === null ? (
            <Skeleton className="h-8 w-20" />
          ) : (
            <p className="font-serif text-2xl font-bold tracking-tight">{value}</p>
          )}
        </div>
        {delta && (
          <div className={cn('mt-2 flex items-center gap-1 text-xs font-medium', deltaStyles)}>
            <DeltaIcon className="size-3" />
            {delta.label}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

function KitchenPill({
  tone,
  icon,
  label,
  value,
}: {
  tone: 'amber' | 'sky' | 'emerald';
  icon: React.ReactNode;
  label: string;
  value: number;
}) {
  const styles = {
    amber: 'bg-amber-50 text-amber-900 dark:bg-amber-500/10 dark:text-amber-200',
    sky: 'bg-sky-50 text-sky-900 dark:bg-sky-500/10 dark:text-sky-200',
    emerald: 'bg-emerald-50 text-emerald-900 dark:bg-emerald-500/10 dark:text-emerald-200',
  }[tone];
  const badge = {
    amber: 'bg-amber-500',
    sky: 'bg-sky-500',
    emerald: 'bg-emerald-500',
  }[tone];
  return (
    <div className={`flex items-center justify-between rounded-xl ${styles} p-3.5`}>
      <div className="flex items-center gap-2.5">
        <span className="grid size-8 place-items-center rounded-lg bg-white/60 dark:bg-black/20">
          {icon}
        </span>
        <span className="font-semibold">{label}</span>
      </div>
      <Badge className={`min-w-8 justify-center ${badge} text-white`}>{value}</Badge>
    </div>
  );
}

function EmptyState({
  title,
  description,
  action,
}: {
  title: string;
  description: string;
  action?: React.ReactNode;
}) {
  return (
    <div className="grid place-items-center gap-3 rounded-xl border border-dashed border-border bg-muted/30 p-10 text-center">
      <p className="font-serif text-lg font-semibold">{title}</p>
      <p className="max-w-xs text-sm text-muted-foreground">{description}</p>
      {action}
    </div>
  );
}

const mockTopItems = [
  { name: 'Paneer Tikka Masala', count: 42, revenue: 12_600 },
  { name: 'Margherita Pizza', count: 38, revenue: 11_400 },
  { name: 'Chicken Biryani', count: 31, revenue: 9_300 },
  { name: 'Masala Dosa', count: 27, revenue: 4_050 },
  { name: 'Cold Coffee', count: 22, revenue: 2_640 },
];
