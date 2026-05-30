import { motion, AnimatePresence } from 'framer-motion';
import {
  ChefHat,
  Clock,
  CheckCircle2,
  Flame,
  Soup,
  ArrowRight,
} from 'lucide-react';
import { useMemo, useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { useOrders, useUpdateOrderStatus } from '@/hooks/useRestaurant';
import { cn, timeAgo, formatCurrency } from '@/lib/utils';
import type { Order, OrderStatus } from '@/types';

interface Column {
  status: OrderStatus;
  label: string;
  icon: React.ReactNode;
  tone: string;
  next?: OrderStatus;
  nextLabel?: string;
}

const columns: Column[] = [
  {
    status: 'pending',
    label: 'Pending',
    icon: <Clock className="size-5" />,
    tone: 'border-amber-500/40 bg-amber-50/50 dark:bg-amber-500/5',
    next: 'preparing',
    nextLabel: 'Start preparing',
  },
  {
    status: 'preparing',
    label: 'Preparing',
    icon: <Soup className="size-5" />,
    tone: 'border-sky-500/40 bg-sky-50/50 dark:bg-sky-500/5',
    next: 'ready',
    nextLabel: 'Mark ready',
  },
  {
    status: 'ready',
    label: 'Ready to Serve',
    icon: <CheckCircle2 className="size-5" />,
    tone: 'border-emerald-500/40 bg-emerald-50/50 dark:bg-emerald-500/5',
    next: 'served',
    nextLabel: 'Mark served',
  },
];

export default function KDSPage() {
  const { data: orders, isLoading } = useOrders();
  const updateStatus = useUpdateOrderStatus();
  const [autoRefresh] = useState(true);

  const grouped = useMemo(() => {
    const map: Record<OrderStatus, Order[]> = {
      pending: [],
      confirmed: [],
      preparing: [],
      ready: [],
      served: [],
      completed: [],
      cancelled: [],
    };
    (orders ?? []).forEach((o) => {
      if (map[o.status]) map[o.status].push(o);
    });
    // Treat 'confirmed' as pending for KDS purposes.
    map.pending = [...map.pending, ...map.confirmed];
    return map;
  }, [orders]);

  return (
    <div className="container py-6 lg:py-8">
      <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="flex items-center gap-2 font-serif text-3xl font-bold tracking-tight">
            <ChefHat className="size-7 text-primary" />
            Orders & Kitchen
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Live order queue · Auto-refreshing every 15s
          </p>
        </div>
        <div className="flex items-center gap-2 rounded-full border border-border/60 bg-card px-3 py-1.5 text-xs font-medium">
          <span
            className={cn(
              'relative inline-flex size-2 rounded-full',
              autoRefresh ? 'bg-emerald-500' : 'bg-muted-foreground',
            )}
          >
            {autoRefresh && (
              <span className="absolute inset-0 animate-ping rounded-full bg-emerald-500/60" />
            )}
          </span>
          Live
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
        {columns.map((col) => {
          const list = grouped[col.status];
          return (
            <div
              key={col.status}
              className={cn('rounded-2xl border-2 p-3', col.tone)}
            >
              <div className="mb-3 flex items-center justify-between px-2">
                <div className="flex items-center gap-2 font-semibold">
                  {col.icon}
                  <span>{col.label}</span>
                </div>
                <Badge variant="secondary" className="bg-card font-mono">
                  {list.length}
                </Badge>
              </div>

              <div className="space-y-2.5">
                {isLoading ? (
                  Array.from({ length: 2 }).map((_, i) => (
                    <Skeleton key={i} className="h-36 rounded-xl" />
                  ))
                ) : list.length === 0 ? (
                  <div className="grid place-items-center gap-1 rounded-xl border border-dashed border-border/60 bg-card/50 p-6 text-center text-sm text-muted-foreground">
                    <span>No {col.label.toLowerCase()} orders</span>
                  </div>
                ) : (
                  <AnimatePresence mode="popLayout">
                    {list.map((order) => (
                      <OrderTicket
                        key={order.id}
                        order={order}
                        next={col.next}
                        nextLabel={col.nextLabel}
                        isLoading={updateStatus.isPending}
                        onAdvance={(status) =>
                          updateStatus.mutate({ orderId: order.id, status })
                        }
                      />
                    ))}
                  </AnimatePresence>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function OrderTicket({
  order,
  next,
  nextLabel,
  isLoading,
  onAdvance,
}: {
  order: Order;
  next?: OrderStatus;
  nextLabel?: string;
  isLoading?: boolean;
  onAdvance: (s: OrderStatus) => void;
}) {
  // Tickets older than 10 min in pending/preparing get "urgent" treatment.
  const ageMs = Date.now() - new Date(order.created_at).getTime();
  const urgent = (order.status === 'pending' || order.status === 'preparing') && ageMs > 10 * 60_000;

  return (
    <motion.div
      layout
      initial={{ opacity: 0, scale: 0.97 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, x: 40 }}
      transition={{ type: 'spring', stiffness: 350, damping: 30 }}
    >
      <Card className={cn('overflow-hidden', urgent && 'ring-2 ring-destructive/40 animate-pulse')}>
        <div className={cn('flex items-center justify-between border-b border-border/60 px-3 py-2', urgent && 'bg-destructive/5')}>
          <div className="flex items-center gap-2">
            <span className="font-mono text-[10px] text-muted-foreground">
              #{order.id.slice(-6).toUpperCase()}
            </span>
            {order.table_number && (
              <Badge variant="outline" className="font-mono">
                T{order.table_number}
              </Badge>
            )}
            {urgent && (
              <Badge variant="destructive" className="gap-1">
                <Flame className="size-3" /> Late
              </Badge>
            )}
          </div>
          <span className="text-xs font-medium text-muted-foreground">
            {timeAgo(order.created_at)}
          </span>
        </div>

        <CardContent className="p-3">
          <ul className="space-y-1.5">
            {order.items.slice(0, 5).map((it) => (
              <li key={it.id} className="flex items-start gap-2 text-sm">
                <span className="grid size-6 shrink-0 place-items-center rounded-md bg-primary/10 font-bold text-primary text-xs">
                  {it.quantity}
                </span>
                <div className="flex-1">
                  <p className="font-medium leading-tight">{it.name_snapshot}</p>
                  {it.notes && (
                    <p className="mt-0.5 text-[11px] italic text-muted-foreground">
                      “{it.notes}”
                    </p>
                  )}
                </div>
              </li>
            ))}
            {order.items.length > 5 && (
              <li className="text-xs text-muted-foreground">+ {order.items.length - 5} more…</li>
            )}
          </ul>

          {order.notes && (
            <p className="mt-2 rounded-md bg-amber-50 px-2 py-1.5 text-xs text-amber-900 dark:bg-amber-500/10 dark:text-amber-200">
              📝 {order.notes}
            </p>
          )}

          {next && (
            <Button
              size="sm"
              variant="soft"
              disabled={isLoading}
              onClick={() => onAdvance(next)}
              className="mt-3 w-full justify-between"
            >
              {isLoading ? 'Updating...' : nextLabel}
              <ArrowRight className="size-3.5" />
            </Button>
          )}
        </CardContent>

        <div className="flex items-center justify-between border-t border-border/60 bg-muted/30 px-3 py-1.5 text-[11px]">
          <span className="capitalize text-muted-foreground">{order.type.replace('_', ' ')}</span>
          <span className="font-mono font-semibold">{formatCurrency(order.total_amount)}</span>
        </div>
      </Card>
    </motion.div>
  );
}
