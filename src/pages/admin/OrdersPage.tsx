import { useState } from 'react';
import { motion } from 'framer-motion';
import { ClipboardList, Filter, Search } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Skeleton } from '@/components/ui/skeleton';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription } from '@/components/ui/sheet';
import { useOrders, useUpdateOrderStatus } from '@/hooks/useRestaurant';
import { cn, formatCurrency, timeAgo } from '@/lib/utils';
import type { Order, OrderStatus } from '@/types';
import { Button } from '@/components/ui/button';

const filters: { value: OrderStatus | 'all'; label: string }[] = [
  { value: 'all', label: 'All' },
  { value: 'pending', label: 'Pending' },
  { value: 'preparing', label: 'Preparing' },
  { value: 'ready', label: 'Ready' },
  { value: 'served', label: 'Served' },
  { value: 'completed', label: 'Completed' },
  { value: 'cancelled', label: 'Cancelled' },
];

const statusBadge: Record<OrderStatus, { variant: 'success' | 'warning' | 'destructive' | 'soft' | 'secondary'; label: string }> = {
  pending: { variant: 'warning', label: 'Pending' },
  confirmed: { variant: 'soft', label: 'Confirmed' },
  preparing: { variant: 'soft', label: 'Preparing' },
  ready: { variant: 'success', label: 'Ready' },
  served: { variant: 'success', label: 'Served' },
  completed: { variant: 'secondary', label: 'Completed' },
  cancelled: { variant: 'destructive', label: 'Cancelled' },
};

export default function OrdersPage() {
  const [filter, setFilter] = useState<OrderStatus | 'all'>('all');
  const [search, setSearch] = useState('');
  const [selected, setSelected] = useState<Order | null>(null);

  const { data, isLoading } = useOrders(filter === 'all' ? undefined : { status: filter });
  const updateStatus = useUpdateOrderStatus();

  const orders = (data ?? []).filter((o) =>
    !search ? true : o.id.toLowerCase().includes(search.toLowerCase()) ||
      o.customer_name?.toLowerCase().includes(search.toLowerCase()),
  );

  return (
    <div className="container py-6 lg:py-8">
      <div className="mb-6">
        <h1 className="flex items-center gap-2 font-serif text-3xl font-bold tracking-tight">
          <ClipboardList className="size-6 text-primary" />
          Orders
        </h1>
        <p className="mt-1 text-sm text-muted-foreground">Track every order across the floor in real time.</p>
      </div>

      {/* Filters */}
      <div className="mb-4 flex flex-wrap items-center gap-3">
        <div className="relative flex-1 min-w-[240px]">
          <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Search by order id or customer…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-10"
          />
        </div>
        <div className="flex items-center gap-2 text-xs">
          <Filter className="size-4 text-muted-foreground" />
          <span className="text-muted-foreground">Filter:</span>
          <div className="flex flex-wrap gap-1">
            {filters.map((f) => (
              <button
                key={f.value}
                onClick={() => setFilter(f.value)}
                className={cn(
                  'rounded-full px-3 py-1.5 text-xs font-semibold transition-colors',
                  filter === f.value
                    ? 'bg-primary text-primary-foreground'
                    : 'bg-muted text-muted-foreground hover:bg-muted/70',
                )}
              >
                {f.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* List */}
      <Card>
        <CardContent className="p-0">
          {isLoading ? (
            <div className="space-y-2 p-4">
              {Array.from({ length: 5 }).map((_, i) => (
                <Skeleton key={i} className="h-16 w-full rounded-lg" />
              ))}
            </div>
          ) : orders.length === 0 ? (
            <div className="grid place-items-center gap-2 p-16 text-center">
              <ClipboardList className="size-10 text-muted-foreground/40" />
              <p className="font-serif text-lg font-semibold">No orders match</p>
              <p className="text-sm text-muted-foreground">Try a different filter or clear the search.</p>
            </div>
          ) : (
            <div className="divide-y divide-border/60">
              {orders.map((o, idx) => (
                <motion.button
                  key={o.id}
                  initial={{ opacity: 0, y: 6 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: idx * 0.03 }}
                  onClick={() => setSelected(o)}
                  className="grid w-full grid-cols-[auto_1fr_auto] items-center gap-4 px-4 py-3.5 text-left transition-colors hover:bg-accent/40"
                >
                  <div className="grid size-11 place-items-center rounded-lg bg-primary/10 font-mono text-xs font-bold text-primary">
                    #{o.id.slice(-4).toUpperCase()}
                  </div>
                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <p className="truncate font-semibold">
                        {o.customer_name || (o.table_number ? `Table ${o.table_number}` : 'Walk-in')}
                      </p>
                      <Badge variant={statusBadge[o.status].variant}>{statusBadge[o.status].label}</Badge>
                      <Badge variant="outline" className="font-mono uppercase">
                        {o.type.replace('_', ' ')}
                      </Badge>
                    </div>
                    <p className="mt-0.5 truncate text-xs text-muted-foreground">
                      {o.items.length} item{o.items.length !== 1 ? 's' : ''} · {timeAgo(o.created_at)}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="font-serif text-lg font-bold tabular-nums">{formatCurrency(o.total_amount)}</p>
                    <p className="text-[10px] uppercase tracking-wider text-muted-foreground">
                      {o.payment_status}
                    </p>
                  </div>
                </motion.button>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Detail drawer */}
      <Sheet open={!!selected} onOpenChange={(o) => !o && setSelected(null)}>
        <SheetContent side="right" className="overflow-y-auto p-0">
          {selected && (
            <>
              <SheetHeader>
                <SheetTitle className="flex items-center gap-2">
                  Order #{selected.id.slice(-6).toUpperCase()}
                  <Badge variant={statusBadge[selected.status].variant}>
                    {statusBadge[selected.status].label}
                  </Badge>
                </SheetTitle>
                <SheetDescription>
                  Placed {timeAgo(selected.created_at)} · {selected.type.replace('_', ' ')}
                </SheetDescription>
              </SheetHeader>

              <div className="space-y-4 p-6">
                <Card>
                  <CardContent className="p-4">
                    <ul className="space-y-2">
                      {selected.items.map((it) => (
                        <li key={it.id} className="flex items-start gap-3 text-sm">
                          <span className="grid size-7 place-items-center rounded-md bg-primary/10 font-bold text-primary text-xs">
                            {it.quantity}
                          </span>
                          <div className="flex-1">
                            <p className="font-medium">{it.name_snapshot}</p>
                            {it.notes && <p className="text-xs italic text-muted-foreground">“{it.notes}”</p>}
                          </div>
                          <span className="font-mono">{formatCurrency(it.price_snapshot * it.quantity)}</span>
                        </li>
                      ))}
                    </ul>
                    <hr className="my-3 border-border" />
                    <div className="space-y-1 text-sm">
                      <Row label="Subtotal" value={formatCurrency((selected.subtotal ?? selected.total_amount - selected.tax_amount))} />
                      <Row label="Tax" value={formatCurrency(selected.tax_amount)} muted />
                      <Row label="Discount" value={`-${formatCurrency(selected.discount_amount)}`} muted />
                      <Row label="Total" value={formatCurrency(selected.total_amount)} bold />
                    </div>
                  </CardContent>
                </Card>

                <div className="flex flex-wrap gap-2">
                  {selected.status === 'pending' && (
                    <Button onClick={() => updateStatus.mutate({ orderId: selected.id, status: 'preparing' })}>
                      Confirm & Prepare
                    </Button>
                  )}
                  {selected.status === 'preparing' && (
                    <Button onClick={() => updateStatus.mutate({ orderId: selected.id, status: 'ready' })}>
                      Mark Ready
                    </Button>
                  )}
                  {selected.status === 'ready' && (
                    <Button onClick={() => updateStatus.mutate({ orderId: selected.id, status: 'served' })}>
                      Mark Served
                    </Button>
                  )}
                  {!['cancelled', 'completed'].includes(selected.status) && (
                    <Button
                      variant="outline"
                      className="text-destructive"
                      onClick={() => updateStatus.mutate({ orderId: selected.id, status: 'cancelled' })}
                    >
                      Cancel order
                    </Button>
                  )}
                </div>
              </div>
            </>
          )}
        </SheetContent>
      </Sheet>
    </div>
  );
}

function Row({ label, value, bold, muted }: { label: string; value: string; bold?: boolean; muted?: boolean }) {
  return (
    <div className={cn('flex justify-between tabular-nums', bold && 'pt-1 text-base font-bold', muted && 'text-muted-foreground')}>
      <span>{label}</span>
      <span>{value}</span>
    </div>
  );
}
