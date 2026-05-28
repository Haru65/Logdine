import { useParams, Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import { CheckCircle2, ChefHat, Clock, Soup, Utensils, Home } from 'lucide-react';
import { publicOrderService } from '@/services/publicOrder.service';
import { qk } from '@/api/queryClient';
import { Card, CardContent } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Button } from '@/components/ui/button';
import { cn, formatCurrency, timeAgo } from '@/lib/utils';
import type { OrderStatus } from '@/types';

const stages: { key: OrderStatus; label: string; icon: React.ReactNode }[] = [
  { key: 'pending', label: 'Order placed', icon: <Clock className="size-4" /> },
  { key: 'preparing', label: 'In the kitchen', icon: <Soup className="size-4" /> },
  { key: 'ready', label: 'Ready', icon: <ChefHat className="size-4" /> },
  { key: 'served', label: 'Served', icon: <Utensils className="size-4" /> },
];

const stageIndex: Record<OrderStatus, number> = {
  pending: 0,
  confirmed: 0,
  preparing: 1,
  ready: 2,
  served: 3,
  completed: 3,
  cancelled: -1,
};

export default function OrderStatusPage() {
  const { slug = '', orderId = '' } = useParams();

  const { data: order, isLoading } = useQuery({
    queryKey: qk.publicOrder(slug, orderId),
    queryFn: () => publicOrderService.getOrderStatus(slug, orderId),
    refetchInterval: 10_000,
  });

  if (isLoading || !order) {
    return (
      <div className="container mx-auto max-w-md p-6">
        <Skeleton className="h-40 w-full rounded-2xl" />
      </div>
    );
  }

  const current = stageIndex[order.status];

  return (
    <div className="min-h-screen pb-12">
      <header className="bg-gradient-warm p-6 text-white">
        <div className="container mx-auto max-w-md">
          <p className="text-xs font-bold uppercase tracking-widest text-white/80">
            Order #{order.id.slice(-6).toUpperCase()}
          </p>
          <h1 className="mt-2 font-serif text-3xl font-bold leading-tight">
            {order.status === 'served' || order.status === 'completed'
              ? 'Enjoy your meal!'
              : order.status === 'cancelled'
                ? 'Order cancelled'
                : "We're on it"}
          </h1>
          <p className="mt-1 text-sm text-white/80">Placed {timeAgo(order.created_at)}</p>
        </div>
      </header>

      <main className="container mx-auto -mt-6 max-w-md space-y-4 px-4">
        {/* Progress */}
        <Card>
          <CardContent className="p-5">
            <ol className="relative space-y-4">
              {stages.map((stage, i) => {
                const done = i <= current;
                const active = i === current;
                return (
                  <li key={stage.key} className="flex items-start gap-3">
                    <motion.div
                      animate={active ? { scale: [1, 1.1, 1] } : {}}
                      transition={{ repeat: active ? Infinity : 0, duration: 2 }}
                      className={cn(
                        'relative grid size-9 shrink-0 place-items-center rounded-full transition-colors',
                        done ? 'bg-primary text-white' : 'bg-muted text-muted-foreground',
                      )}
                    >
                      {done && i < current ? <CheckCircle2 className="size-4" /> : stage.icon}
                      {active && (
                        <span className="absolute inset-0 animate-pulse-ring rounded-full bg-primary/40" />
                      )}
                    </motion.div>
                    <div className="flex-1 pt-1.5">
                      <p className={cn('font-semibold', done ? 'text-foreground' : 'text-muted-foreground')}>
                        {stage.label}
                      </p>
                    </div>
                    {i < stages.length - 1 && (
                      <span
                        className={cn(
                          'absolute left-[17px] mt-9 h-6 w-px',
                          done ? 'bg-primary' : 'bg-border',
                        )}
                        style={{ top: `${i * 56 + 36}px` }}
                      />
                    )}
                  </li>
                );
              })}
            </ol>
          </CardContent>
        </Card>

        {/* Items recap */}
        <Card>
          <CardContent className="p-5">
            <p className="mb-3 text-xs font-bold uppercase tracking-widest text-muted-foreground">
              Your order
            </p>
            <ul className="space-y-2 text-sm">
              {order.items.map((it) => (
                <li key={it.id} className="flex justify-between gap-3">
                  <span className="flex-1">
                    <strong className="font-bold">{it.quantity}×</strong> {it.name_snapshot}
                  </span>
                  <span className="font-mono">{formatCurrency(it.price_snapshot * it.quantity)}</span>
                </li>
              ))}
            </ul>
            <hr className="my-3 border-border" />
            <div className="flex justify-between font-bold tabular-nums">
              <span>Total</span>
              <span>{formatCurrency(order.total_amount)}</span>
            </div>
          </CardContent>
        </Card>

        <Button asChild variant="outline" className="w-full gap-1.5">
          <Link to={`/m/${slug}/${order.table_id}`}>
            <Home className="size-4" /> Back to menu
          </Link>
        </Button>
      </main>
    </div>
  );
}
