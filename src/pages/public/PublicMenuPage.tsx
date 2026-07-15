import { useEffect, useMemo, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { AnimatePresence, motion } from 'framer-motion';
import {
  Banknote,
  ChefHat,
  Clock,
  CreditCard,
  Flame,
  Loader2,
  Minus,
  Plus,
  RefreshCw,
  Search,
  ShoppingBag,
  Sparkles,
  Tag,
  Utensils,
  X,
} from 'lucide-react';
import { toast } from 'sonner';
import { publicOrderService } from '@/services/publicOrder.service';
import { qk } from '@/api/queryClient';
import { useCartStore, selectItemCount, selectSubtotal } from '@/store/cart.store';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from '@/components/ui/sheet';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import { cn, formatCurrency, timeAgo } from '@/lib/utils';
import { getThumbnailUrl } from '@/lib/imageUrl';
import { calculateTaxes, roundCurrency, totalTaxAmount } from '@/lib/taxes';
import type { ComboOffer, MenuAddon, MenuItem, MenuVariant, Order } from '@/types';

type DietFilter = 'all' | 'veg' | 'non-veg';
type CheckoutPaymentMethod = 'cash' | 'paytm';

const activeOrderStatuses = new Set(['pending', 'confirmed', 'cooking', 'preparing', 'ready']);

export default function PublicMenuPage() {
  const { slug = '', table = '' } = useParams();
  const queryClient = useQueryClient();
  const [activeCat, setActiveCat] = useState<string | 'all'>('all');
  const [search, setSearch] = useState('');
  const [searchOpen, setSearchOpen] = useState(false);
  const [diet, setDiet] = useState<DietFilter>('all');
  const [cartOpen, setCartOpen] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState<CheckoutPaymentMethod>('cash');

  const menuQuery = useQuery({
    queryKey: qk.publicMenu(slug, table),
    queryFn: () => publicOrderService.getMenu(slug, table),
  });

  const ordersQuery = useQuery({
    queryKey: ['public', 'table-orders', slug, table],
    queryFn: () => publicOrderService.getTableOrders(slug, table),
    enabled: Boolean(slug && table && menuQuery.data),
    refetchInterval: 10_000,
  });

  const cart = useCartStore();
  const itemCount = useCartStore(selectItemCount);
  const subtotal = useCartStore(selectSubtotal);
  const taxes = useMemo(() => calculateTaxes(subtotal, menuQuery.data?.taxConfig), [subtotal, menuQuery.data?.taxConfig]);
  const total = roundCurrency(subtotal + totalTaxAmount(taxes));
  const cashAvailable = menuQuery.data?.paymentOptions?.cash?.isAvailable !== false;
  const paytmOption = menuQuery.data?.paymentOptions?.paytm;
  const paytmAvailable = paytmOption?.isAvailable === true;
  const cartScope = `${slug}:${table}`;
  const availableItemIds = useMemo(
    () => new Set((menuQuery.data?.items ?? []).map((item) => item.id)),
    [menuQuery.data?.items],
  );
  const availableComboIds = useMemo(
    () => new Set((menuQuery.data?.combos ?? []).map((combo) => combo.id)),
    [menuQuery.data?.combos],
  );

  useEffect(() => {
    if (!slug || !table) return;
    if (cart.tableId === cartScope) return;
    if (cart.items.length) toast.info('Cart cleared for this table.');
    cart.clear();
    cart.setTable(cartScope);
  }, [cart, cart.items.length, cart.tableId, cartScope, slug, table]);

  useEffect(() => {
    if (!menuQuery.data || cart.items.length === 0) return;
    const staleItems = cart.items.filter((line) =>
      line.combo_id ? !availableComboIds.has(line.combo_id) : !availableItemIds.has(line.menu_item_id),
    );
    if (!staleItems.length) return;
    staleItems.forEach((line) => cart.removeItem(line.uid));
    toast.error('Removed unavailable items from your cart.');
  }, [availableComboIds, availableItemIds, cart, cart.items, menuQuery.data]);

  useEffect(() => {
    if (!menuQuery.data) return;
    if (!cashAvailable && paytmAvailable) setPaymentMethod('paytm');
    if (cashAvailable && !paytmAvailable) setPaymentMethod('cash');
  }, [cashAvailable, menuQuery.data, paytmAvailable]);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const payment = params.get('payment');
    const orderId = params.get('orderId');
    if (!payment || !orderId) return;

    if (payment === 'success' || payment === 'already-processed') {
      cart.clear();
      setCartOpen(false);
      toast.success(payment === 'success' ? 'Payment successful. Your order is confirmed.' : 'Payment already processed.');
      void queryClient.invalidateQueries({ queryKey: ['public', 'table-orders', slug, table] });
    } else if (payment === 'failed') {
      toast.error(cashAvailable ? 'Payment failed. Please try again or pay at the counter.' : 'Payment failed. Please try again.');
    }

    window.history.replaceState({}, '', window.location.pathname);
  }, [cart, cashAvailable, queryClient, slug, table]);

  const activeOrder = useMemo(() => {
    return ordersQuery.data?.find((order) => activeOrderStatuses.has(order.status)) ?? null;
  }, [ordersQuery.data]);

  const filtered = useMemo(() => {
    const items = menuQuery.data?.items ?? [];
    return items.filter((item) => {
      if (!item.is_available) return false;
      if (activeCat !== 'all' && item.category_id !== activeCat) return false;
      if (diet === 'veg' && !item.is_veg) return false;
      if (diet === 'non-veg' && item.is_veg) return false;
      if (search) {
        const haystack = `${item.name} ${item.description ?? ''}`.toLowerCase();
        if (!haystack.includes(search.toLowerCase())) return false;
      }
      return true;
    });
  }, [activeCat, diet, menuQuery.data?.items, search]);

  const submitPaytmForm = (payment: Awaited<ReturnType<typeof publicOrderService.createPaytmTransaction>>) => {
    const form = document.createElement('form');
    form.method = 'POST';
    form.action = payment.paymentUrl;
    form.target = '_self';

    Object.entries({
      mid: payment.merchantId,
      orderId: payment.orderId,
      txnToken: payment.txnToken,
    }).forEach(([name, value]) => {
      const input = document.createElement('input');
      input.type = 'hidden';
      input.name = name;
      input.value = String(value);
      form.appendChild(input);
    });

    document.body.appendChild(form);
    form.submit();
  };

  const createOrder = useMutation({
    mutationFn: async (method: CheckoutPaymentMethod) => {
      if (method === 'cash' && !cashAvailable) throw new Error('Pay at Counter is not available.');
      if (method === 'paytm' && !paytmAvailable) throw new Error('Online payment is not available.');
      const unavailableItems = cart.items.filter((line) =>
        line.combo_id ? !availableComboIds.has(line.combo_id) : !availableItemIds.has(line.menu_item_id),
      );
      if (unavailableItems.length) {
        unavailableItems.forEach((line) => cart.removeItem(line.uid));
        throw new Error('Some cart items are no longer available. Please add them again.');
      }
      const createdOrder = await publicOrderService.createOrder(slug, table, {
        paymentMethod: method === 'paytm' ? 'online' : 'cash',
        paymentAccountId: method === 'paytm' ? paytmOption?.accountId || undefined : undefined,
        notes: cart.notes,
        items: cart.items.map((line) => (
          line.combo_id
            ? {
                combo_id: line.combo_id,
                quantity: line.quantity,
                notes: line.notes,
              }
            : {
                menu_item_id: line.menu_item_id,
                quantity: line.quantity,
                selectedVariant: line.variants[0]
                  ? {
                      id: line.variants[0].id,
                      name: line.variants[0].name,
                      price: line.variants[0].price,
                    }
                  : null,
                selectedAddons: line.addons.map((addon) => ({
                  id: addon.id,
                  name: addon.name,
                  price: addon.price,
                })),
                notes: line.notes,
              }
        )),
      });

      if (method === 'paytm') {
        const orderAmount = Number((createdOrder as any).total ?? (createdOrder as any).totalAmount ?? total);
        const payment = await publicOrderService.createPaytmTransaction({
          orderId: createdOrder.id,
          amount: orderAmount,
          restaurantSlug: slug,
          accountId: paytmOption?.accountId || undefined,
        });
        submitPaytmForm(payment);
      }

      return { method };
    },
    onSuccess: async ({ method }) => {
      if (method === 'paytm') {
        toast.success('Opening Paytm payment gateway...');
        return;
      }
      cart.clear();
      setCartOpen(false);
      toast.success('Order placed. The kitchen has received it.');
      await queryClient.invalidateQueries({ queryKey: ['public', 'table-orders', slug, table] });
    },
    onError: (error: any) => toast.error(error?.message || "Couldn't start checkout. Please try again."),
  });

  if (menuQuery.error) {
    return (
      <div className="grid min-h-screen place-items-center p-6 text-center">
        <div className="max-w-sm space-y-3">
          <p className="font-serif text-2xl font-semibold">Menu not found</p>
          <p className="text-sm text-muted-foreground">
            This QR code may be invalid. Please ask staff for assistance.
          </p>
          <Button onClick={() => menuQuery.refetch()}>Try again</Button>
        </div>
      </div>
    );
  }

  const data = menuQuery.data;
  const logoSrc = data?.restaurant.logo_url || data?.restaurant.logoUrl || data?.restaurant.logo || '';

  return (
    <div className="min-h-screen bg-background pb-28">
      <header className="sticky top-0 z-30 border-b border-border bg-background/95 backdrop-blur">
        <div className="container py-3">
          <div className="flex items-center gap-3">
            <div className="grid size-12 shrink-0 place-items-center overflow-hidden rounded-xl bg-primary/10">
              {logoSrc ? (
                <img
                  src={getThumbnailUrl(logoSrc, { width: 96, height: 96, quality: 80 })}
                  alt={data?.restaurant.name || 'Restaurant logo'}
                  className="size-full object-contain p-1"
                />
              ) : (
                <Utensils className="size-5 text-primary" />
              )}
            </div>
            <div className="min-w-0 flex-1">
              {menuQuery.isLoading ? (
                <Skeleton className="h-8 w-48" />
              ) : (
                <>
                  <h1 className="truncate font-serif text-xl font-bold leading-tight">
                    {data?.restaurant.name}
                  </h1>
                  <p className="mt-0.5 flex items-center gap-1 text-xs font-medium text-muted-foreground">
                    <span className="truncate">Table {data?.table.table_number}</span>
                    <span>·</span>
                    <span>{data?.categories.length ?? 0} categories</span>
                  </p>
                </>
              )}
            </div>
            <Button
              variant="ghost"
              size="icon"
              onClick={() => {
                queryClient.invalidateQueries({ queryKey: qk.publicMenu(slug, table) });
                queryClient.invalidateQueries({ queryKey: ['public', 'table-orders', slug, table] });
              }}
              title="Refresh menu"
            >
              <RefreshCw className={cn('size-4', menuQuery.isFetching && 'animate-spin')} />
            </Button>
            <Button variant="ghost" size="icon" onClick={() => setSearchOpen((open) => !open)}>
              {searchOpen ? <X className="size-4" /> : <Search className="size-4" />}
            </Button>
          </div>

          <AnimatePresence initial={false}>
            {searchOpen && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: 'auto', opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                className="overflow-hidden"
              >
                <div className="relative mt-3">
                  <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
                  <Input
                    value={search}
                    onChange={(event) => setSearch(event.target.value)}
                    placeholder="Search dishes..."
                    className="pl-9"
                    autoFocus
                  />
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          <div className="mt-3 flex gap-2 overflow-x-auto pb-1">
            <FilterChip active={diet === 'all'} onClick={() => setDiet('all')}>All</FilterChip>
            <FilterChip active={diet === 'veg'} onClick={() => setDiet('veg')}>
              <VegMark veg /> Veg
            </FilterChip>
            <FilterChip active={diet === 'non-veg'} onClick={() => setDiet('non-veg')}>
              <VegMark /> Non-veg
            </FilterChip>
          </div>

          <div className="mt-2 flex gap-2 overflow-x-auto pb-1">
            <CategoryChip active={activeCat === 'all'} onClick={() => setActiveCat('all')}>
              All
            </CategoryChip>
            {data?.categories.map((category) => (
              <CategoryChip
                key={category.id}
                active={activeCat === category.id}
                onClick={() => setActiveCat(category.id)}
              >
                {category.name}
              </CategoryChip>
            ))}
          </div>
        </div>
      </header>

      <main className="container space-y-4 py-4">
        {activeOrder && <ActiveOrderCard order={activeOrder} slug={slug} />}

        <section className="rounded-lg bg-primary/10 p-4">
          <div className="flex items-center gap-2 text-primary">
            <Sparkles className="size-4" />
            <p className="text-xs font-bold uppercase tracking-widest">Scan, choose, order</p>
          </div>
          <p className="mt-1 text-sm text-muted-foreground">
            Browse the live menu for your table. Staff will confirm and serve your order.
          </p>
        </section>

        {data?.combos?.length ? (
          <section className="space-y-3">
            <div className="flex items-center justify-between gap-3">
              <div>
                <p className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-widest text-primary">
                  <Tag className="size-3.5" />
                  Combo offers
                </p>
                <h2 className="font-serif text-xl font-bold">Value meals</h2>
              </div>
              <Badge variant="secondary">{data.combos.length}</Badge>
            </div>
            <div className="-mx-4 flex gap-3 overflow-x-auto px-4 pb-1 sm:mx-0 sm:px-0">
              {data.combos.map((combo) => (
                <ComboOfferCard key={combo.id} combo={combo} />
              ))}
            </div>
          </section>
        ) : null}

        <div className="grid grid-cols-1 gap-3 min-[520px]:grid-cols-2 lg:grid-cols-3">
          {menuQuery.isLoading
            ? Array.from({ length: 6 }).map((_, index) => <Skeleton key={index} className="h-72 rounded-lg" />)
            : filtered.length
              ? filtered.map((item) => <CustomerMenuCard key={item.id} item={item} />)
              : (
                  <div className="col-span-full grid place-items-center gap-2 rounded-lg border border-dashed border-border bg-card p-12 text-center">
                    <Utensils className="size-8 text-muted-foreground/40" />
                    <p className="font-semibold">No items match</p>
                    <p className="text-sm text-muted-foreground">Try a different category or search.</p>
                  </div>
                )}
        </div>
      </main>

      <AnimatePresence>
        {itemCount > 0 && (
          <motion.div
            initial={{ y: 90, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: 90, opacity: 0 }}
            className="fixed inset-x-4 bottom-4 z-40 safe-bottom"
          >
            <Sheet open={cartOpen} onOpenChange={setCartOpen}>
              <SheetTrigger asChild>
                <Button size="lg" className="h-14 w-full justify-between text-base shadow-float">
                  <span className="flex items-center gap-2">
                    <ShoppingBag className="size-5" />
                    {itemCount} item{itemCount === 1 ? '' : 's'}
                  </span>
                  <span>{formatCurrency(total)}</span>
                </Button>
              </SheetTrigger>
              <SheetContent side="bottom" className="h-[90vh] overflow-y-auto rounded-t-3xl">
                <SheetHeader className="text-left">
                  <SheetTitle>Your order · Table {data?.table.table_number ?? table}</SheetTitle>
                </SheetHeader>

                <div className="space-y-3 px-6 py-4">
                  {cart.items.map((line) => (
                    <div key={line.uid} className="rounded-lg border border-border/70 bg-card p-3">
                      <div className="flex items-start justify-between gap-3">
                        <div className="min-w-0">
                          <p className="font-semibold">{line.name}</p>
                          <p className="mt-0.5 text-sm font-bold text-primary">
                            {formatCurrency(line.price + line.addons.reduce((sum, addon) => sum + addon.price, 0))}
                          </p>
                          {[...line.variants, ...line.addons].length > 0 && (
                            <p className="mt-1 text-xs text-muted-foreground">
                              {[...line.variants, ...line.addons].map((entry) => entry.name).join(', ')}
                            </p>
                          )}
                          {line.combo_items?.length ? (
                            <p className="mt-1 text-xs text-muted-foreground">
                              {line.combo_items.map((item) => `${item.quantity}x ${item.item_name ?? 'Item'}`).join(', ')}
                            </p>
                          ) : null}
                          {line.notes && !line.combo_id && <p className="mt-1 text-xs text-muted-foreground">Note: {line.notes}</p>}
                        </div>
                        <div className="inline-flex items-center gap-1 rounded-md border border-primary/30 bg-primary/5 px-1">
                          <button className="grid size-8 place-items-center text-primary" onClick={() => cart.updateQuantity(line.uid, line.quantity - 1)}>
                            <Minus className="size-3.5" />
                          </button>
                          <span className="min-w-5 text-center text-sm font-bold">{line.quantity}</span>
                          <button className="grid size-8 place-items-center text-primary" onClick={() => cart.updateQuantity(line.uid, line.quantity + 1)}>
                            <Plus className="size-3.5" />
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>

                <div className="mx-6 rounded-lg bg-muted/40 p-4 text-sm">
                  <BillRow label="Subtotal" value={formatCurrency(subtotal)} />
                  {taxes.map((tax) => (
                    <BillRow key={tax.id} label={`${tax.name} (${tax.percentage}%)`} value={formatCurrency(tax.amount)} muted />
                  ))}
                  <div className="my-2 h-px bg-border" />
                  <BillRow label="Total" value={formatCurrency(total)} bold />
                </div>

                <div className="p-6">
                  <div className={cn('mb-4 grid gap-2', cashAvailable && paytmAvailable ? 'grid-cols-2' : 'grid-cols-1')}>
                    {cashAvailable && <button
                      type="button"
                      onClick={() => setPaymentMethod('cash')}
                      className={cn(
                        'flex min-h-16 items-center gap-3 rounded-lg border p-3 text-left transition-colors',
                        paymentMethod === 'cash' ? 'border-primary bg-primary/10 text-primary' : 'border-border bg-background',
                      )}
                    >
                      <Banknote className="size-5 shrink-0" />
                      <span className="min-w-0">
                        <span className="block text-sm font-bold">Counter</span>
                        <span className="block truncate text-xs text-muted-foreground">Pay after ordering</span>
                      </span>
                    </button>}
                    {paytmAvailable && <button
                      type="button"
                      onClick={() => setPaymentMethod('paytm')}
                      className={cn(
                        'flex min-h-16 items-center gap-3 rounded-lg border p-3 text-left transition-colors',
                        paymentMethod === 'paytm' ? 'border-primary bg-primary/10 text-primary' : 'border-border bg-background',
                      )}
                    >
                      <CreditCard className="size-5 shrink-0" />
                      <span className="min-w-0">
                        <span className="block text-sm font-bold">Paytm PG</span>
                        <span className="block truncate text-xs text-muted-foreground">{formatCurrency(total)}</span>
                      </span>
                    </button>}
                  </div>
                  {!cashAvailable && !paytmAvailable && (
                    <p className="mb-4 rounded-lg border border-amber-500/30 bg-amber-50 p-3 text-sm text-amber-900 dark:bg-amber-500/10 dark:text-amber-200">
                      No payment method is currently available. Please ask restaurant staff for assistance.
                    </p>
                  )}
                  <Button
                    size="lg"
                    className="h-12 w-full gap-2"
                    loading={createOrder.isPending}
                    disabled={!cashAvailable && !paytmAvailable}
                    onClick={() => createOrder.mutate(paymentMethod)}
                  >
                    {createOrder.isPending && paymentMethod === 'paytm'
                      ? <Loader2 className="size-4 animate-spin" />
                      : paymentMethod === 'paytm'
                        ? <CreditCard className="size-4" />
                        : <Banknote className="size-4" />}
                    {paymentMethod === 'paytm' ? `Paytm PG - ${formatCurrency(total)}` : 'Place order - Pay at counter'}
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

function CustomerMenuCard({ item }: { item: MenuItem }) {
  const [open, setOpen] = useState(false);
  const inCartCount = useCartStore((state) =>
    state.items
      .filter((line) => line.menu_item_id === item.id)
      .reduce((sum, line) => sum + line.quantity, 0),
  );

  const hasCustomizations = Boolean(item.variants?.length || item.addons?.length);

  return (
    <>
      <motion.article
        layout
        onClick={() => setOpen(true)}
        className="flex h-full cursor-pointer flex-col overflow-hidden rounded-lg border border-border/60 bg-card shadow-soft transition hover:-translate-y-0.5 hover:shadow-card"
      >
        <div className="relative aspect-[4/3] bg-muted">
          {item.image_url ? (
            <img
              src={getThumbnailUrl(item.image_url, { width: 520, height: 390 })}
              alt={item.name}
              className="size-full object-cover"
              loading="lazy"
            />
          ) : (
            <div className="grid size-full place-items-center bg-gradient-to-br from-primary/15 to-primary/5">
              <Utensils className="size-10 text-primary/40" />
            </div>
          )}
          {item.is_spicy && (
            <Badge variant="destructive" className="absolute right-2 top-2 gap-1">
              <Flame className="size-3" /> Spicy
            </Badge>
          )}
        </div>
        <div className="flex flex-1 flex-col p-3">
          <div className="flex items-start gap-2">
            <VegMark veg={item.is_veg} className="mt-0.5" />
            <div className="min-w-0 flex-1">
              <h2 className="line-clamp-2 font-serif text-lg font-semibold leading-tight">{item.name}</h2>
              <p className="mt-1 font-bold text-primary">{formatCurrency(item.price)}</p>
            </div>
          </div>
          {item.description && (
            <p className="mt-2 line-clamp-2 text-sm text-muted-foreground">{item.description}</p>
          )}
          <div className="mt-auto flex items-center justify-between gap-2 pt-3">
            <div className="flex flex-wrap gap-1">
              {hasCustomizations && <Badge variant="secondary">Customizable</Badge>}
              {item.preparation_time && (
                <Badge variant="outline" className="gap-1">
                  <Clock className="size-3" /> {item.preparation_time} min
                </Badge>
              )}
            </div>
            <Button size="sm" className="min-w-20" onClick={(event) => { event.stopPropagation(); setOpen(true); }}>
              {inCartCount ? `${inCartCount} added` : hasCustomizations ? 'Customize' : 'Add'}
            </Button>
          </div>
        </div>
      </motion.article>

      <ItemDetailDialog item={item} open={open} onOpenChange={setOpen} />
    </>
  );
}

function ComboOfferCard({ combo }: { combo: ComboOffer }) {
  const addCombo = useCartStore((state) => state.addCombo);
  const inCartCount = useCartStore((state) =>
    state.items
      .filter((line) => line.combo_id === combo.id)
      .reduce((sum, line) => sum + line.quantity, 0),
  );
  const image = combo.image_url || combo.items?.find((item) => item.item_image)?.item_image;
  const savings = Math.max(0, Number(combo.original_price ?? 0) - Number(combo.combo_price ?? 0));

  return (
    <article className="flex w-[280px] shrink-0 overflow-hidden rounded-lg border border-primary/20 bg-card shadow-soft">
      <div className="w-24 shrink-0 bg-muted">
        {image ? (
          <img
            src={getThumbnailUrl(image, { width: 180, height: 180 })}
            alt={combo.name}
            className="size-full object-cover"
            loading="lazy"
          />
        ) : (
          <div className="grid size-full place-items-center bg-primary/10">
            <Tag className="size-7 text-primary" />
          </div>
        )}
      </div>
      <div className="flex min-w-0 flex-1 flex-col p-3">
        <div className="min-w-0">
          <div className="mb-1 flex items-center gap-1.5">
            <Badge variant="success" className="px-1.5 py-0 text-[10px]">Combo</Badge>
            {savings > 0 && (
              <span className="text-[10px] font-bold text-emerald-600">Save {formatCurrency(savings)}</span>
            )}
          </div>
          <h3 className="line-clamp-2 font-serif text-base font-bold leading-tight">{combo.name}</h3>
          {combo.description && (
            <p className="mt-0.5 line-clamp-1 text-xs text-muted-foreground">{combo.description}</p>
          )}
          {combo.items?.length ? (
            <p className="mt-1 line-clamp-2 text-[11px] text-muted-foreground">
              {combo.items.map((item) => `${item.quantity}x ${item.item_name ?? 'Item'}`).join(', ')}
            </p>
          ) : null}
        </div>
        <div className="mt-auto flex items-end justify-between gap-2 pt-2">
          <div>
            <p className="font-serif text-lg font-bold text-primary">{formatCurrency(combo.combo_price)}</p>
            {combo.original_price ? (
              <p className="text-xs text-muted-foreground line-through">{formatCurrency(combo.original_price)}</p>
            ) : null}
          </div>
          <Button
            size="sm"
            className="min-w-20"
            onClick={() => {
              addCombo(combo);
              toast.success(`${combo.name} added`);
            }}
          >
            {inCartCount ? `${inCartCount} added` : 'Add'}
          </Button>
        </div>
      </div>
    </article>
  );
}

function ItemDetailDialog({
  item,
  open,
  onOpenChange,
}: {
  item: MenuItem;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const addItem = useCartStore((state) => state.addItem);
  const [quantity, setQuantity] = useState(1);
  const [variant, setVariant] = useState<MenuVariant | null>(item.variants?.[0] ?? null);
  const [addons, setAddons] = useState<MenuAddon[]>([]);
  const [notes, setNotes] = useState('');

  const unit = (variant?.price ?? item.price) + addons.reduce((sum, addon) => sum + addon.price, 0);

  const toggleAddon = (addon: MenuAddon) => {
    setAddons((current) =>
      current.some((entry) => entry.id === addon.id)
        ? current.filter((entry) => entry.id !== addon.id)
        : [...current, addon],
    );
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        className="max-h-[90vh] overflow-y-auto p-0"
        onOpenAutoFocus={(event) => event.preventDefault()}
      >
        <div className="aspect-[16/10] bg-muted">
          {item.image_url ? (
            <img
              src={getThumbnailUrl(item.image_url, { width: 900, height: 560 })}
              alt={item.name}
              className="size-full object-cover"
            />
          ) : (
            <div className="grid size-full place-items-center bg-gradient-to-br from-primary/15 to-primary/5">
              <ChefHat className="size-12 text-primary/40" />
            </div>
          )}
        </div>
        <div className="space-y-4 p-5">
          <DialogHeader>
            <DialogTitle className="pr-8 font-serif text-2xl">{item.name}</DialogTitle>
            <DialogDescription>{item.description || 'Choose options and add it to your order.'}</DialogDescription>
          </DialogHeader>

          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <VegMark veg={item.is_veg} />
              <span className="text-sm font-medium">{item.is_veg ? 'Vegetarian' : 'Non-veg'}</span>
            </div>
            <span className="font-bold text-primary">{formatCurrency(variant?.price ?? item.price)}</span>
          </div>

          {item.variants?.length ? (
            <section className="space-y-2">
              <p className="text-xs font-bold uppercase tracking-widest text-muted-foreground">Choose size</p>
              <div className="grid gap-2">
                {item.variants.map((entry) => (
                  <button
                    key={entry.id}
                    onClick={() => setVariant(entry)}
                    className={cn(
                      'flex items-center justify-between rounded-lg border p-3 text-left transition-colors',
                      variant?.id === entry.id ? 'border-primary bg-primary/10' : 'border-border bg-background',
                    )}
                  >
                    <span className="font-medium">{entry.name}</span>
                    <span className="font-bold">{formatCurrency(entry.price)}</span>
                  </button>
                ))}
              </div>
            </section>
          ) : null}

          {item.addons?.length ? (
            <section className="space-y-2">
              <p className="text-xs font-bold uppercase tracking-widest text-muted-foreground">Add extras</p>
              <div className="grid gap-2">
                {item.addons.map((addon) => {
                  const selected = addons.some((entry) => entry.id === addon.id);
                  return (
                    <button
                      key={addon.id}
                      onClick={() => toggleAddon(addon)}
                      className={cn(
                        'flex items-center justify-between rounded-lg border p-3 text-left transition-colors',
                        selected ? 'border-primary bg-primary/10' : 'border-border bg-background',
                      )}
                    >
                      <span className="font-medium">{addon.name}</span>
                      <span className="font-bold">+ {formatCurrency(addon.price)}</span>
                    </button>
                  );
                })}
              </div>
            </section>
          ) : null}

          <div className="space-y-2">
            <p className="text-xs font-bold uppercase tracking-widest text-muted-foreground">Notes</p>
            <Textarea value={notes} onChange={(event) => setNotes(event.target.value)} placeholder="Less spicy, no onion..." />
          </div>

          <div className="flex items-center justify-between gap-3 pt-2">
            <div className="inline-flex items-center rounded-lg border border-primary/30 bg-primary/5">
              <button className="grid size-10 place-items-center text-primary" onClick={() => setQuantity((q) => Math.max(1, q - 1))}>
                <Minus className="size-4" />
              </button>
              <span className="min-w-8 text-center font-bold">{quantity}</span>
              <button className="grid size-10 place-items-center text-primary" onClick={() => setQuantity((q) => q + 1)}>
                <Plus className="size-4" />
              </button>
            </div>
            <Button
              className="h-11 flex-1"
              onClick={() => {
                addItem(item, {
                  quantity,
                  variants: variant ? [variant] : [],
                  addons,
                  notes: notes.trim() || undefined,
                });
                onOpenChange(false);
                toast.success(`${item.name} added`);
              }}
            >
              Add · {formatCurrency(unit * quantity)}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

function ActiveOrderCard({ order, slug }: { order: Order; slug: string }) {
  return (
    <Link
      to={`/m/${slug}/order/${order.id}`}
      className="block rounded-lg border border-primary/30 bg-primary/10 p-4 transition-colors hover:bg-primary/15"
    >
      <div className="flex items-center justify-between gap-3">
        <div>
          <p className="text-xs font-bold uppercase tracking-widest text-primary">Active order</p>
          <p className="mt-1 font-serif text-xl font-bold capitalize">{order.status}</p>
          <p className="mt-0.5 text-sm text-muted-foreground">Placed {timeAgo(order.created_at)}</p>
        </div>
        <div className="grid size-11 place-items-center rounded-full bg-primary text-primary-foreground">
          <ChefHat className="size-5" />
        </div>
      </div>
    </Link>
  );
}

function VegMark({ veg = false, className }: { veg?: boolean; className?: string }) {
  return (
    <span className={cn('grid size-4 shrink-0 place-items-center rounded-sm border-2 bg-white', veg ? 'border-emerald-600' : 'border-red-600', className)}>
      <span className={cn('size-1.5 rounded-full', veg ? 'bg-emerald-600' : 'bg-red-600')} />
    </span>
  );
}

function FilterChip({ active, onClick, children }: { active: boolean; onClick: () => void; children: React.ReactNode }) {
  return (
    <button
      onClick={onClick}
      className={cn(
        'inline-flex shrink-0 items-center gap-1.5 rounded-full border px-3 py-1.5 text-xs font-semibold transition-colors',
        active ? 'border-primary bg-primary text-primary-foreground' : 'border-border bg-background',
      )}
    >
      {children}
    </button>
  );
}

function CategoryChip({ active, onClick, children }: { active: boolean; onClick: () => void; children: React.ReactNode }) {
  return (
    <button
      onClick={onClick}
      className={cn(
        'shrink-0 rounded-full border px-4 py-1.5 text-sm font-semibold transition-colors',
        active ? 'border-primary bg-primary text-primary-foreground' : 'border-border bg-background',
      )}
    >
      {children}
    </button>
  );
}

function BillRow({ label, value, bold, muted }: { label: string; value: string; bold?: boolean; muted?: boolean }) {
  return (
    <div className={cn('flex justify-between tabular-nums', bold && 'text-base font-bold', muted && 'text-muted-foreground')}>
      <span>{label}</span>
      <span>{value}</span>
    </div>
  );
}
