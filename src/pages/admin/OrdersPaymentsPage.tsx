import { useMemo, useState } from 'react';
import * as DropdownMenu from '@radix-ui/react-dropdown-menu';
import {
  AlertTriangle,
  CheckCircle2,
  Clock3,
  CreditCard,
  Eye,
  MoreHorizontal,
  RefreshCw,
  Search,
} from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { cn } from '@/lib/utils';
import {
  usePaymentLogDetails,
  usePaymentLogs,
  useReconcilePaymentLog,
} from '@/hooks/useRestaurant';
import type { PaymentLedgerRow, PaymentLog, PaymentLogFilters } from '@/types';

const currency = new Intl.NumberFormat('en-IN', {
  style: 'currency',
  currency: 'INR',
  maximumFractionDigits: 2,
});

const dateTime = new Intl.DateTimeFormat('en-IN', {
  dateStyle: 'medium',
  timeStyle: 'short',
});

const statusVariant: Record<string, 'success' | 'warning' | 'destructive' | 'secondary' | 'outline'> = {
  paid: 'success',
  completed: 'success',
  pending: 'warning',
  failed: 'destructive',
  refunded: 'secondary',
  cancelled: 'destructive',
  confirmed: 'success',
  draft: 'outline',
};

function formatDate(value?: string | null) {
  if (!value) return '-';
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? '-' : dateTime.format(date);
}

function formatAmount(value?: number | string | null) {
  const amount = Number(value || 0);
  return currency.format(Number.isFinite(amount) ? amount : 0);
}

function humanize(value?: string | null) {
  if (!value) return '-';
  return value
    .split('_')
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(' ');
}

function todayMinus(days: number) {
  const date = new Date();
  date.setDate(date.getDate() - days);
  return date.toISOString().slice(0, 10);
}

function StatusBadge({ value }: { value?: string | null }) {
  const normalized = String(value || '').toLowerCase();
  return (
    <Badge variant={statusVariant[normalized] || 'secondary'} className="capitalize">
      {value || 'unknown'}
    </Badge>
  );
}

export default function OrdersPaymentsPage() {
  const [selectedOrderId, setSelectedOrderId] = useState<string | null>(null);
  const [filters, setFilters] = useState<PaymentLogFilters>({
    startDate: todayMinus(30),
    endDate: new Date().toISOString().slice(0, 10),
    limit: 100,
  });
  const queryFilters = useMemo(
    () => ({
      ...filters,
      search: filters.search?.trim() || undefined,
      provider: filters.provider || undefined,
      paymentStatus: filters.paymentStatus || undefined,
    }),
    [filters],
  );
  const { data, isLoading, isFetching } = usePaymentLogs(queryFilters);
  const reconcile = useReconcilePaymentLog();

  const rows = data?.items || [];
  const paidCount = rows.filter((row) => ['paid', 'completed'].includes(String(row.payment_status).toLowerCase())).length;
  const failedCount = rows.filter((row) => String(row.payment_status).toLowerCase() === 'failed' || row.error_message).length;
  const revenue = rows.reduce((sum, row) => {
    return ['paid', 'completed'].includes(String(row.payment_status).toLowerCase())
      ? sum + Number(row.total_amount || 0)
      : sum;
  }, 0);

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
        <div>
          <p className="text-sm font-medium text-muted-foreground">Payment audit</p>
          <h1 className="text-2xl font-bold tracking-tight">Orders & Payments</h1>
        </div>
        <Button variant="outline" onClick={() => window.location.reload()} disabled={isFetching}>
          <RefreshCw className={cn('size-4', isFetching && 'animate-spin')} />
          Refresh
        </Button>
      </div>

      <div className="grid gap-3 md:grid-cols-3">
        <StatCard title="Successful value" value={formatAmount(revenue)} icon={CreditCard} />
        <StatCard title="Paid orders" value={String(paidCount)} icon={CheckCircle2} />
        <StatCard title="Needs review" value={String(failedCount)} icon={AlertTriangle} tone="warning" />
      </div>

      <Card>
        <CardHeader className="gap-4">
          <div className="flex flex-col gap-3 xl:flex-row xl:items-center xl:justify-between">
            <CardTitle className="text-lg">Payment ledger</CardTitle>
            <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-5">
              <div className="relative sm:col-span-2">
                <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  className="pl-9"
                  placeholder="Search order or transaction"
                  value={filters.search || ''}
                  onChange={(event) => setFilters((current) => ({ ...current, search: event.target.value }))}
                />
              </div>
              <Input
                type="date"
                value={filters.startDate || ''}
                onChange={(event) => setFilters((current) => ({ ...current, startDate: event.target.value }))}
              />
              <Input
                type="date"
                value={filters.endDate || ''}
                onChange={(event) => setFilters((current) => ({ ...current, endDate: event.target.value }))}
              />
              <select
                className="h-10 rounded-md border border-input bg-background px-3 text-sm focus-ring"
                value={filters.paymentStatus || ''}
                onChange={(event) => setFilters((current) => ({ ...current, paymentStatus: event.target.value }))}
              >
                <option value="">All payments</option>
                <option value="pending">Pending</option>
                <option value="completed">Completed</option>
                <option value="paid">Paid</option>
                <option value="failed">Failed</option>
              </select>
            </div>
          </div>
        </CardHeader>
        <CardContent className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Order</TableHead>
                <TableHead>Table</TableHead>
                <TableHead>Amount</TableHead>
                <TableHead>Payment</TableHead>
                <TableHead>Gateway</TableHead>
                <TableHead>Last event</TableHead>
                <TableHead className="w-12" />
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                Array.from({ length: 6 }).map((_, index) => (
                  <TableRow key={index}>
                    <TableCell colSpan={7}>
                      <Skeleton className="h-8 w-full" />
                    </TableCell>
                  </TableRow>
                ))
              ) : rows.length ? (
                rows.map((row) => (
                  <LedgerRow
                    key={row.id}
                    row={row}
                    onOpen={() => setSelectedOrderId(row.id)}
                    onReconcile={() => reconcile.mutate(row.id)}
                    reconciling={reconcile.isPending}
                  />
                ))
              ) : (
                <TableRow>
                  <TableCell colSpan={7} className="h-28 text-center text-muted-foreground">
                    No payment records found for this range.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <PaymentDetailDialog
        orderId={selectedOrderId}
        open={Boolean(selectedOrderId)}
        onOpenChange={(open) => !open && setSelectedOrderId(null)}
      />
    </div>
  );
}

function StatCard({
  title,
  value,
  icon: Icon,
  tone = 'default',
}: {
  title: string;
  value: string;
  icon: typeof CreditCard;
  tone?: 'default' | 'warning';
}) {
  return (
    <Card>
      <CardContent className="flex items-center justify-between p-4">
        <div>
          <p className="text-sm text-muted-foreground">{title}</p>
          <p className="mt-1 text-2xl font-semibold">{value}</p>
        </div>
        <span className={cn('grid size-10 place-items-center rounded-lg bg-primary/10 text-primary', tone === 'warning' && 'bg-warning/15 text-amber-600')}>
          <Icon className="size-5" />
        </span>
      </CardContent>
    </Card>
  );
}

function LedgerRow({
  row,
  onOpen,
  onReconcile,
  reconciling,
}: {
  row: PaymentLedgerRow;
  onOpen: () => void;
  onReconcile: () => void;
  reconciling: boolean;
}) {
  const isPaytm = String(row.payment_provider || '').toLowerCase() === 'paytm';
  return (
    <TableRow>
      <TableCell>
        <div className="font-medium">{row.order_number || row.id}</div>
        <div className="text-xs text-muted-foreground">{formatDate(row.created_at)}</div>
      </TableCell>
      <TableCell>{row.table_name || '-'}</TableCell>
      <TableCell className="font-medium">{formatAmount(row.total_amount)}</TableCell>
      <TableCell>
        <div className="flex flex-col gap-1">
          <StatusBadge value={row.payment_status} />
          <span className="text-xs uppercase text-muted-foreground">{row.payment_provider || 'cash'}</span>
        </div>
      </TableCell>
      <TableCell>
        <div className="max-w-[220px] space-y-1">
          <div className="font-mono text-xs">{row.gateway_transaction_id || row.payment_id || '-'}</div>
          {row.error_message ? (
            <div className="truncate text-xs text-destructive">{row.error_message}</div>
          ) : (
            <div className="text-xs text-muted-foreground">{row.gateway_status || 'No gateway event yet'}</div>
          )}
        </div>
      </TableCell>
      <TableCell>
        <div className="text-sm">{humanize(row.latest_event_type)}</div>
        <div className="text-xs text-muted-foreground">{formatDate(row.payment_event_at)}</div>
      </TableCell>
      <TableCell className="text-right">
        <DropdownMenu.Root>
          <DropdownMenu.Trigger asChild>
            <Button variant="ghost" size="icon" aria-label="Order payment actions">
              <MoreHorizontal className="size-4" />
            </Button>
          </DropdownMenu.Trigger>
          <DropdownMenu.Portal>
            <DropdownMenu.Content
              align="end"
              className="z-50 min-w-44 rounded-md border border-border bg-popover p-1 text-popover-foreground shadow-md"
            >
              <DropdownMenu.Item
                className="flex cursor-pointer items-center gap-2 rounded-sm px-2 py-2 text-sm outline-none hover:bg-accent"
                onSelect={onOpen}
              >
                <Eye className="size-4" />
                View details
              </DropdownMenu.Item>
              {isPaytm && (
                <DropdownMenu.Item
                  className="flex cursor-pointer items-center gap-2 rounded-sm px-2 py-2 text-sm outline-none hover:bg-accent"
                  onSelect={onReconcile}
                  disabled={reconciling}
                >
                  <RefreshCw className={cn('size-4', reconciling && 'animate-spin')} />
                  Fetch Paytm status
                </DropdownMenu.Item>
              )}
            </DropdownMenu.Content>
          </DropdownMenu.Portal>
        </DropdownMenu.Root>
      </TableCell>
    </TableRow>
  );
}

function PaymentDetailDialog({
  orderId,
  open,
  onOpenChange,
}: {
  orderId: string | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const { data, isLoading } = usePaymentLogDetails(orderId);
  const order = data?.order;
  const logs = data?.logs || [];

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[88vh] max-w-4xl overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{order?.order_number || orderId || 'Payment details'}</DialogTitle>
          <DialogDescription>
            {order ? `${order.payment_provider || order.payment_method || 'cash'} payment audit` : 'Loading audit timeline'}
          </DialogDescription>
        </DialogHeader>

        {isLoading ? (
          <div className="space-y-3">
            <Skeleton className="h-20 w-full" />
            <Skeleton className="h-40 w-full" />
          </div>
        ) : order ? (
          <div className="grid gap-5 lg:grid-cols-[0.9fr_1.1fr]">
            <div className="space-y-4">
              <section className="rounded-lg border border-border p-4">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="text-sm text-muted-foreground">Amount</p>
                    <p className="text-2xl font-semibold">{formatAmount(order.total_amount)}</p>
                  </div>
                  <StatusBadge value={order.payment_status} />
                </div>
                <dl className="mt-4 grid gap-3 text-sm">
                  <Detail label="Table" value={order.table_name || order.table_number || '-'} />
                  <Detail label="Order status" value={humanize(order.status)} />
                  <Detail label="Created" value={formatDate(order.created_at)} />
                  <Detail label="Provider account" value={order.payment_provider_account_id || '-'} mono />
                  <Detail label="Gateway order ID" value={order.payment_order_id || '-'} mono />
                  <Detail label="Transaction ID" value={order.payment_id || '-'} mono />
                </dl>
              </section>

              <section className="rounded-lg border border-border p-4">
                <h3 className="font-semibold">Items</h3>
                <div className="mt-3 space-y-2">
                  {(order.items || []).map((item) => (
                    <div key={item.id} className="flex justify-between gap-3 text-sm">
                      <span>{item.quantity} x {item.name_snapshot}</span>
                      <span className="font-medium">{formatAmount(Number(item.price_snapshot) * Number(item.quantity))}</span>
                    </div>
                  ))}
                </div>
              </section>
            </div>

            <section className="rounded-lg border border-border p-4">
              <div className="flex items-center gap-2">
                <Clock3 className="size-4 text-primary" />
                <h3 className="font-semibold">Audit timeline</h3>
              </div>
              <div className="mt-4 space-y-4">
                {logs.length ? logs.map((log) => <TimelineEvent key={log.id} log={log} />) : (
                  <p className="text-sm text-muted-foreground">No payment events have been recorded for this order yet.</p>
                )}
              </div>
            </section>
          </div>
        ) : (
          <p className="text-sm text-muted-foreground">Order details could not be loaded.</p>
        )}
      </DialogContent>
    </Dialog>
  );
}

function Detail({ label, value, mono = false }: { label: string; value: string; mono?: boolean }) {
  return (
    <div>
      <dt className="text-xs uppercase text-muted-foreground">{label}</dt>
      <dd className={cn('mt-1 break-all', mono && 'font-mono text-xs')}>{value}</dd>
    </div>
  );
}

function TimelineEvent({ log }: { log: PaymentLog }) {
  const hasError = Boolean(log.error_message || String(log.gateway_status || '').toUpperCase() === 'ERROR');
  return (
    <div className="relative border-l border-border pl-4">
      <span className={cn('absolute -left-[5px] top-1 size-2.5 rounded-full bg-primary', hasError && 'bg-destructive')} />
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div>
          <p className="font-medium">{humanize(log.event_type)}</p>
          <p className="text-xs text-muted-foreground">{humanize(log.event_source)} - {formatDate(log.event_at)}</p>
        </div>
        <StatusBadge value={log.payment_status} />
      </div>
      <dl className="mt-3 grid gap-2 text-sm sm:grid-cols-2">
        <Detail label="Gateway status" value={log.gateway_status || '-'} />
        <Detail label="Transaction ID" value={log.gateway_transaction_id || '-'} mono />
        <Detail label="Payment mode" value={log.payment_mode || '-'} />
        <Detail label="User UPI ID" value={log.payer_upi_id || '-'} mono />
        <Detail label="Amount" value={formatAmount(log.amount)} />
        <Detail label="Error" value={log.error_message || log.error_code || '-'} />
      </dl>
    </div>
  );
}
