import { useMemo, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery, useMutation } from '@tanstack/react-query';
import { motion, AnimatePresence } from 'framer-motion';
import { Leaf, Minus, Plus, Search, ShoppingBag, Star, Utensils, MapPin } from 'lucide-react';
import { publicOrderService } from '@/services/publicOrder.service';
import { qk } from '@/api/queryClient';
import { useCartStore, selectItemCount, selectSubtotal } from '@/store/cart.store';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from '@/components/ui/sheet';
import { cn, formatCurrency, uid } from '@/lib/utils';
import { toast } from 'sonner';
import type { MenuItem } from '@/types';

const TAX_RATE = 0.05;

export default function PublicMenuPage() {
  const { slug = '', table = '' } = useParams();
  const navigate = useNavigate();
  const [activeCat, setActiveCat] = useState<string | 'all'>('all');
  const [search, setSearch] = useState('');
  const [vegOnly, setVegOnly] = useState(false);

  const { data, isLoading, error } = useQuery({
    queryKey: qk.publicMenu(slug, table),
    queryFn: () => publicOrderService.getMenu(slug, table),
  });

  const cart = useCartStore();
  const itemCount = useCartStore(selectItemCount);
  const subtotal = useCartStore(selectSubtotal);
  const tax = subtotal * TAX_RATE;
  const total = subtotal + tax;

  const createOrder = useMutation({
    mutationFn: () =>
      publicOrderService.createOrder(slug, table, {
        items: cart.items.map((ci) => ({
          menu_item_id: ci.menu_item_id,
          quantity: ci.quantity,
          variants: ci.variants.map((v) => v.id),
          addons: ci.addons.map((a) => a.id),
          notes: ci.notes,
        })),
        paymentMethod: 'online',
        notes: cart.notes,
      }),
    onSuccess: (order) => {
      cart.clear();
      toast.success('Order placed!');
      navigate(`/m/${slug}/order/${order.id}`);
    },
    onError: () => toast.error("Couldn't place the order. Please try again."),
  });

  const filtered = useMemo(() => {
    if (!data) return [];
    return data.items.filter((it) => {
      if (vegOnly && !it.is_veg) return false;
      if (activeCat !== 'all' && it.category_id !== activeCat) return false;
      if (search && !it.name.toLowerCase().includes(search.toLowerCase())) return false;
      return it.is_available;
    });
  }, [data, vegOnly, activeCat, search]);

  if (error) {
    return (
      <div className="grid min-h-screen place-items-center p-6 text-center">
        <div className="space-y-2">
          <p className="font-serif text-2xl font-semibold">Menu not found</p>
          <p className="text-sm text-muted-foreground">
            The QR code may be invalid. Please ask staff for assistance.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen pb-32">
      {/* Hero band */}
      <header className="relative overflow-hidden bg-gradient-warm pb-8 pt-10 text-white">
        <div className="absolute inset-0 grain opacity-60" />
        <div className="absolute -right-10 top-0 size-48 rounded-full bg-white/10 blur-3xl" />
        <div className="container relative">
          {isLoading ? (
            <>
              <Skeleton className="h-4 w-24 bg-white/20" />
              <Skeleton className="mt-3 h-10 w-3/4 bg-white/20" />
            </>
          ) : (
            <>
              <p className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-widest text-white/80">
                <MapPin className="size-3" /> Table {data?.table.table_number}
              </p>
              <h1 className="mt-2 font-serif text-4xl font-bold leading-[1.05] tracking-tight">
                {data?.restaurant.name}
              </h1>
              <div className="mt-3 flex items-center gap-3 text-sm text-white/80">
                <span className="inline-flex items-center gap-1">
                  <Star className="size-3.5 fill-current" /> 4.6
                </span>
                <span>·</span>
                <span>{data?.categories.length} categories</span>
              </div>
            </>
          )}
        </div>
      </header>

      <div className="container -mt-4 space-y-4">
        {/* Search */}
        <div className="rounded-2xl border border-border/60 bg-card p-3 shadow-card">
          <div className="relative">
            <Search className="pointer-events-none absolute left-3.5 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Search menu…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="border-transparent bg-muted/30 pl-10"
            />
          </div>
        </div>

        {/* Filters */}
        <button
          onClick={() => setVegOnly(!vegOnly)}
          className={cn(
            'inline-flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-xs font-semibold transition-colors',
            vegOnly
              ? 'border-emerald-500/40 bg-emerald-500/10 text-emerald-700'
              : 'border-border bg-background',
          )}
        >
          <Leaf className="size-3.5" /> Pure veg only
        </button>

        {/* Categories */}
        <div className="-mx-1 overflow-x-auto px-1 pb-1">
          <div className="flex gap-2">
            <button
              onClick={() => setActiveCat('all')}
              className={cn(
                'shrink-0 rounded-full border px-4 py-1.5 text-sm font-semibold',
                activeCat === 'all' ? 'border-primary bg-primary text-primary-foreground' : 'border-border bg-background',
              )}
            >
              All
            </button>
            {data?.categories.map((c) => (
              <button
                key={c.id}
                onClick={() => setActiveCat(c.id)}
                className={cn(
                  'shrink-0 rounded-full border px-4 py-1.5 text-sm font-semibold',
                  activeCat === c.id ? 'border-primary bg-primary text-primary-foreground' : 'border-border bg-background',
                )}
              >
                {c.name}
              </button>
            ))}
          </div>
        </div>

        {/* Items list — Swiggy-style horizontal cards */}
        <div className="space-y-3">
          {isLoading
            ? Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-28 rounded-2xl" />)
            : filtered.length === 0
              ? (
                  <div className="grid place-items-center gap-2 rounded-2xl border border-dashed border-border bg-card p-10 text-center">
                    <Utensils className="size-8 text-muted-foreground/40" />
                    <p className="font-semibold">No items match</p>
                  </div>
                )
              : filtered.map((item) => <CustomerItemRow key={item.id} item={item} />)}
        </div>
      </div>

      {/* Cart FAB */}
      <AnimatePresence>
        {itemCount > 0 && (
          <motion.div
            initial={{ y: 80, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: 80, opacity: 0 }}
            className="fixed inset-x-4 bottom-4 z-40 safe-bottom"
          >
            <Sheet>
              <SheetTrigger asChild>
                <Button size="lg" className="h-14 w-full justify-between text-base shadow-float">
                  <span className="flex items-center gap-2">
                    <ShoppingBag className="size-5" />
                    {itemCount} item{itemCount !== 1 ? 's' : ''}
                  </span>
                  <span className="flex items-center gap-2">
                    View cart · {formatCurrency(total)}
                  </span>
                </Button>
              </SheetTrigger>
              <SheetContent side="bottom" className="h-[88vh] overflow-y-auto">
                <SheetHeader className="text-left">
                  <SheetTitle>Your Order · Table {table}</SheetTitle>
                </SheetHeader>

                <div className="space-y-3 px-6 py-4">
                  {cart.items.map((line) => (
                    <div key={line.uid} className="flex items-start justify-between gap-3 rounded-xl border border-border/60 p-3">
                      <div className="flex-1">
                        <p className="font-semibold">{line.name}</p>
                        <div className="mt-2 inline-flex items-center gap-1.5 rounded-md border border-primary/30 bg-primary/5 px-1">
                          <button
                            onClick={() => cart.updateQuantity(line.uid, line.quantity - 1)}
                            className="grid size-7 place-items-center text-primary"
                          >
                            <Minus className="size-3.5" />
                          </button>
                          <span className="min-w-5 text-center text-sm font-bold tabular-nums">
                            {line.quantity}
                          </span>
                          <button
                            onClick={() => cart.updateQuantity(line.uid, line.quantity + 1)}
                            className="grid size-7 place-items-center text-primary"
                          >
                            <Plus className="size-3.5" />
                          </button>
                        </div>
                      </div>
                      <span className="font-bold tabular-nums">
                        {formatCurrency(line.price * line.quantity)}
                      </span>
                    </div>
                  ))}
                </div>

                <div className="mx-6 space-y-1 rounded-xl bg-muted/40 p-4 text-sm">
                  <Row label="Subtotal" value={formatCurrency(subtotal)} />
                  <Row label="Tax" value={formatCurrency(tax)} muted />
                  <div className="my-2 h-px bg-border" />
                  <Row label="Total" value={formatCurrency(total)} bold />
                </div>

                <div className="p-6">
                  <Button
                    size="lg"
                    className="h-12 w-full"
                    loading={createOrder.isPending}
                    onClick={() => createOrder.mutate()}
                  >
                    Place order · {formatCurrency(total)}
                  </Button>
                </div>
              </SheetContent>
            </Sheet>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

function CustomerItemRow({ item }: { item: MenuItem }) {
  const addItem = useCartStore((s) => s.addItem);
  const cart = useCartStore((s) => s.items);
  const inCart = cart.find((c) => c.menu_item_id === item.id);

  return (
    <motion.article
      layout
      className="flex gap-3 overflow-hidden rounded-2xl border border-border/60 bg-card p-3 shadow-soft"
    >
      <div className="min-w-0 flex-1 space-y-1.5">
        <div className="flex items-center gap-1.5">
          <span
            className={cn(
              'grid size-4 place-items-center rounded-sm border-2 bg-white',
              item.is_veg ? 'border-emerald-600' : 'border-red-600',
            )}
          >
            <span className={cn('size-1.5 rounded-full', item.is_veg ? 'bg-emerald-600' : 'bg-red-600')} />
          </span>
          {item.is_featured && (
            <Badge variant="warning" className="gap-1 text-[10px]">
              Bestseller
            </Badge>
          )}
        </div>
        <h3 className="font-serif text-base font-semibold leading-tight">{item.name}</h3>
        <p className="font-bold tabular-nums">{formatCurrency(item.price)}</p>
        {item.description && (
          <p className="line-clamp-2 text-xs text-muted-foreground">{item.description}</p>
        )}
      </div>
      <div className="relative w-28 shrink-0">
        <div className="aspect-square overflow-hidden rounded-xl bg-muted">
          {item.image_url ? (
            <img src={item.image_url} alt={item.name} className="size-full object-cover" loading="lazy" />
          ) : (
            <div className="grid h-full place-items-center bg-gradient-to-br from-primary/15 to-primary/5">
              <Utensils className="size-7 text-primary/40" />
            </div>
          )}
        </div>
        <button
          onClick={() => addItem(item, { quantity: 1 })}
          className={cn(
            'absolute -bottom-2 left-1/2 -translate-x-1/2 rounded-lg border-2 border-primary bg-white px-4 py-1 text-xs font-bold uppercase tracking-wider text-primary shadow-soft',
            inCart && 'bg-primary text-white',
          )}
        >
          {inCart ? `${inCart.quantity} · Added` : 'Add'}
        </button>
      </div>
    </motion.article>
  );
}

function Row({ label, value, bold, muted }: { label: string; value: string; bold?: boolean; muted?: boolean }) {
  return (
    <div className={cn('flex justify-between tabular-nums', bold && 'text-base font-bold', muted && 'text-muted-foreground')}>
      <span>{label}</span>
      <span>{value}</span>
    </div>
  );
}

// Silence unused import lint
void uid;
