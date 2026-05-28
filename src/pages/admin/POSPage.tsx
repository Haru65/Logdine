import { useMemo, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Bike,
  Leaf,
  Minus,
  Plus,
  Search,
  ShoppingBag,
  ShoppingCart,
  Sparkles,
  Trash2,
  UtensilsCrossed,
  X,
} from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Skeleton } from '@/components/ui/skeleton';
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet';
import { useCategories, useMenuItems, useTables } from '@/hooks/useRestaurant';
import { useCartStore, selectItemCount, selectSubtotal } from '@/store/cart.store';
import { cn, formatCurrency } from '@/lib/utils';
import type { MenuItem, OrderType } from '@/types';

const TAX_RATE = 0.05; // 5% — read from /tax-config in production

export default function POSPage() {
  const { data: categories = [], isLoading: catsLoading } = useCategories();
  const { data: items = [], isLoading: itemsLoading } = useMenuItems();
  const { data: tables = [] } = useTables();

  const cart = useCartStore();
  const itemCount = useCartStore(selectItemCount);
  const subtotal = useCartStore(selectSubtotal);
  const tax = subtotal * TAX_RATE;
  const total = subtotal + tax;

  const [activeCategory, setActiveCategory] = useState<string | 'all'>('all');
  const [search, setSearch] = useState('');
  const [vegOnly, setVegOnly] = useState(false);

  const filteredItems = useMemo(() => {
    return items.filter((it) => {
      if (vegOnly && !it.is_veg) return false;
      if (activeCategory !== 'all' && it.category_id !== activeCategory) return false;
      if (search && !it.name.toLowerCase().includes(search.toLowerCase())) return false;
      return true;
    });
  }, [items, vegOnly, activeCategory, search]);

  return (
    <div className="container py-6 lg:py-8">
      {/* ---------- Header ---------- */}
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="flex items-center gap-2 font-serif text-3xl font-bold tracking-tight">
            <ShoppingCart className="size-6 text-primary" />
            POS Billing
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Take orders and bill faster. Optimised for tablet.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 xl:grid-cols-[1fr_400px]">
        {/* ============ MENU PANEL ============ */}
        <div className="space-y-4">
          {/* Order type & table */}
          <Card>
            <CardContent className="p-4">
              <Tabs value={cart.type} onValueChange={(v) => cart.setType(v as OrderType)}>
                <TabsList className="w-full">
                  <TabsTrigger value="dine_in" className="gap-2">
                    <UtensilsCrossed className="size-4" /> Dine In
                  </TabsTrigger>
                  <TabsTrigger value="take_away" className="gap-2">
                    <ShoppingBag className="size-4" /> Take Away
                  </TabsTrigger>
                  <TabsTrigger value="delivery" className="gap-2">
                    <Bike className="size-4" /> Delivery
                  </TabsTrigger>
                </TabsList>
              </Tabs>

              {cart.type === 'dine_in' && (
                <div className="mt-4">
                  <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                    Select Table
                  </label>
                  <select
                    value={cart.tableId ?? ''}
                    onChange={(e) => cart.setTable(e.target.value || null)}
                    className="h-11 w-full rounded-lg border border-input bg-background px-3 text-sm shadow-inner focus-ring"
                  >
                    <option value="">— Choose a table —</option>
                    {tables.map((t) => (
                      <option key={t.id} value={t.id} disabled={t.status === 'occupied'}>
                        Table {t.table_number} · {t.capacity} seats
                        {t.status === 'occupied' ? ' (occupied)' : ''}
                      </option>
                    ))}
                  </select>
                  {!cart.tableId && (
                    <p className="mt-2 flex items-center gap-1.5 rounded-md bg-amber-50 px-2.5 py-1.5 text-xs text-amber-900 dark:bg-amber-500/10 dark:text-amber-200">
                      ⚠ Please select a table to add items.
                    </p>
                  )}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Search + filters */}
          <div className="flex flex-wrap items-center gap-3">
            <div className="relative flex-1 min-w-[220px]">
              <Search className="pointer-events-none absolute left-3.5 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search menu…"
                className="pl-10"
              />
              {search && (
                <button
                  onClick={() => setSearch('')}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 rounded-md p-1 text-muted-foreground hover:bg-muted"
                >
                  <X className="size-3.5" />
                </button>
              )}
            </div>
            <button
              onClick={() => setVegOnly(!vegOnly)}
              className={cn(
                'inline-flex items-center gap-1.5 rounded-lg border px-3 py-2 text-sm font-medium transition-colors',
                vegOnly
                  ? 'border-emerald-500/40 bg-emerald-500/10 text-emerald-700 dark:text-emerald-300'
                  : 'border-border bg-background text-foreground hover:bg-accent',
              )}
            >
              <Leaf className="size-4" /> Veg only
            </button>
          </div>

          {/* Categories scroller */}
          <div className="-mx-1 overflow-x-auto px-1 pb-1">
            <div className="flex gap-2">
              <CategoryChip
                active={activeCategory === 'all'}
                onClick={() => setActiveCategory('all')}
                label="All"
                count={items.length}
              />
              {catsLoading
                ? Array.from({ length: 4 }).map((_, i) => (
                    <Skeleton key={i} className="h-10 w-28 rounded-full" />
                  ))
                : categories.map((c) => (
                    <CategoryChip
                      key={c.id}
                      active={activeCategory === c.id}
                      onClick={() => setActiveCategory(c.id)}
                      label={c.name}
                      count={items.filter((it) => it.category_id === c.id).length}
                    />
                  ))}
            </div>
          </div>

          {/* Items grid */}
          {itemsLoading ? (
            <div className="grid grid-cols-2 gap-3 md:grid-cols-3 xl:grid-cols-3">
              {Array.from({ length: 6 }).map((_, i) => (
                <Skeleton key={i} className="h-44 rounded-2xl" />
              ))}
            </div>
          ) : filteredItems.length === 0 ? (
            <Card>
              <CardContent className="grid place-items-center gap-2 p-12 text-center">
                <Sparkles className="size-8 text-muted-foreground" />
                <p className="font-serif text-lg font-semibold">Nothing matches</p>
                <p className="text-sm text-muted-foreground">
                  Try clearing filters or searching for something else.
                </p>
              </CardContent>
            </Card>
          ) : (
            <div className="grid grid-cols-2 gap-3 md:grid-cols-3 xl:grid-cols-3">
              <AnimatePresence mode="popLayout">
                {filteredItems.map((item) => (
                  <MenuItemCard
                    key={item.id}
                    item={item}
                    disabled={cart.type === 'dine_in' && !cart.tableId}
                  />
                ))}
              </AnimatePresence>
            </div>
          )}
        </div>

        {/* ============ CART PANEL (desktop) ============ */}
        <div className="hidden xl:block">
          <div className="sticky top-20">
            <CartPanel subtotal={subtotal} tax={tax} total={total} />
          </div>
        </div>
      </div>

      {/* ============ MOBILE CART FAB ============ */}
      <div className="fixed bottom-20 left-1/2 z-40 -translate-x-1/2 xl:hidden">
        <Sheet>
          <SheetTrigger asChild>
            <Button
              size="lg"
              className="gap-3 shadow-float"
              disabled={itemCount === 0}
            >
              <ShoppingCart className="size-5" />
              <span>{itemCount} item{itemCount !== 1 ? 's' : ''}</span>
              <span className="font-bold tabular-nums">{formatCurrency(total)}</span>
            </Button>
          </SheetTrigger>
          <SheetContent side="bottom" className="h-[88vh] overflow-y-auto p-0">
            <CartPanel subtotal={subtotal} tax={tax} total={total} embedded />
          </SheetContent>
        </Sheet>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
//  Sub-components
// ---------------------------------------------------------------------------
function CategoryChip({
  active,
  label,
  count,
  onClick,
}: {
  active: boolean;
  label: string;
  count: number;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className={cn(
        'group inline-flex shrink-0 items-center gap-2 rounded-full border px-4 py-2 text-sm font-semibold transition-all',
        active
          ? 'border-primary bg-primary text-primary-foreground shadow-soft'
          : 'border-border bg-background hover:bg-accent',
      )}
    >
      {label}
      <span
        className={cn(
          'rounded-full px-1.5 py-0.5 text-[10px] font-bold tabular-nums',
          active ? 'bg-white/25 text-white' : 'bg-muted text-muted-foreground',
        )}
      >
        {count}
      </span>
    </button>
  );
}

function MenuItemCard({ item, disabled }: { item: MenuItem; disabled?: boolean }) {
  const addItem = useCartStore((s) => s.addItem);

  return (
    <motion.div
      layout
      initial={{ opacity: 0, scale: 0.96 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.96 }}
      transition={{ duration: 0.2 }}
    >
      <Card
        className={cn(
          'group flex h-full flex-col overflow-hidden transition-all hover:-translate-y-0.5 hover:shadow-float',
          (disabled || !item.is_available) && 'pointer-events-none opacity-50',
        )}
      >
        <div className="relative aspect-[4/3] w-full overflow-hidden bg-muted">
          {item.image_url ? (
            <img
              src={item.image_url}
              alt={item.name}
              className="size-full object-cover transition-transform duration-500 group-hover:scale-105"
              loading="lazy"
            />
          ) : (
            <div className="grid h-full w-full place-items-center bg-gradient-to-br from-primary/10 to-primary/5">
              <UtensilsCrossed className="size-10 text-primary/40" />
            </div>
          )}
          <div className="absolute left-2 top-2">
            <VegIndicator isVeg={item.is_veg} />
          </div>
          {!item.is_available && (
            <Badge variant="destructive" className="absolute right-2 top-2">
              Unavailable
            </Badge>
          )}
        </div>
        <CardContent className="flex flex-1 flex-col gap-3 p-3">
          <div className="flex-1">
            <p className="line-clamp-1 font-semibold">{item.name}</p>
            {item.description && (
              <p className="mt-0.5 line-clamp-1 text-xs text-muted-foreground">{item.description}</p>
            )}
          </div>
          <div className="flex items-center justify-between gap-2">
            <span className="font-serif text-lg font-bold">{formatCurrency(item.price)}</span>
            <Button
              size="sm"
              onClick={() => addItem(item)}
              disabled={disabled}
              className="gap-1 px-3"
            >
              <Plus className="size-3.5" /> Add
            </Button>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
}

function VegIndicator({ isVeg }: { isVeg: boolean }) {
  return (
    <span
      className={cn(
        'grid size-5 place-items-center rounded-sm border-2 bg-white',
        isVeg ? 'border-emerald-600' : 'border-red-600',
      )}
      aria-label={isVeg ? 'Vegetarian' : 'Non-vegetarian'}
    >
      <span
        className={cn('size-2 rounded-full', isVeg ? 'bg-emerald-600' : 'bg-red-600')}
      />
    </span>
  );
}

function CartPanel({
  subtotal,
  tax,
  total,
  embedded = false,
}: {
  subtotal: number;
  tax: number;
  total: number;
  embedded?: boolean;
}) {
  const cart = useCartStore();

  return (
    <div className={cn(!embedded && 'rounded-2xl bg-card shadow-card border border-border/60', 'flex flex-col overflow-hidden')}>
      {/* Heading band */}
      <div className="bg-gradient-warm p-5 text-white">
        <p className="text-xs font-bold uppercase tracking-widest text-white/80">Order Summary</p>
        <p className="mt-1 font-serif text-2xl font-bold">
          {cart.items.length === 0 ? 'Empty cart' : `${cart.items.length} line${cart.items.length !== 1 ? 's' : ''}`}
        </p>
      </div>

      {/* Items */}
      <div className="max-h-[40vh] flex-1 overflow-y-auto px-5 py-4">
        {cart.items.length === 0 ? (
          <div className="grid place-items-center gap-2 py-8 text-center">
            <ShoppingCart className="size-10 text-muted-foreground/30" />
            <p className="font-medium">No items added yet</p>
            <p className="text-xs text-muted-foreground">Pick from the menu to start an order.</p>
          </div>
        ) : (
          <ul className="space-y-3">
            <AnimatePresence>
              {cart.items.map((line) => (
                <motion.li
                  key={line.uid}
                  layout
                  initial={{ opacity: 0, x: -8 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: 8 }}
                  className="flex gap-3 rounded-xl border border-border/60 bg-background p-3"
                >
                  <div className="flex-1">
                    <p className="line-clamp-1 text-sm font-semibold">{line.name}</p>
                    {line.variants.length > 0 && (
                      <p className="mt-0.5 text-xs text-muted-foreground">
                        {line.variants.map((v) => v.name).join(', ')}
                      </p>
                    )}
                    {line.addons.length > 0 && (
                      <p className="mt-0.5 text-xs text-muted-foreground">
                        + {line.addons.map((a) => a.name).join(', ')}
                      </p>
                    )}
                    <div className="mt-2 flex items-center gap-1.5">
                      <button
                        onClick={() => cart.updateQuantity(line.uid, line.quantity - 1)}
                        className="grid size-7 place-items-center rounded-md border border-border bg-background text-muted-foreground hover:bg-muted touch-target"
                      >
                        <Minus className="size-3" />
                      </button>
                      <span className="min-w-6 text-center text-sm font-bold tabular-nums">
                        {line.quantity}
                      </span>
                      <button
                        onClick={() => cart.updateQuantity(line.uid, line.quantity + 1)}
                        className="grid size-7 place-items-center rounded-md border border-primary/30 bg-primary/10 text-primary hover:bg-primary/15 touch-target"
                      >
                        <Plus className="size-3" />
                      </button>
                    </div>
                  </div>
                  <div className="flex flex-col items-end justify-between">
                    <span className="text-sm font-bold tabular-nums">
                      {formatCurrency(line.price * line.quantity)}
                    </span>
                    <button
                      onClick={() => cart.removeItem(line.uid)}
                      className="text-destructive/70 hover:text-destructive"
                    >
                      <Trash2 className="size-4" />
                    </button>
                  </div>
                </motion.li>
              ))}
            </AnimatePresence>
          </ul>
        )}
      </div>

      {/* Notes */}
      <div className="px-5 pb-3">
        <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
          Special Instructions
        </label>
        <textarea
          value={cart.notes}
          onChange={(e) => cart.setNotes(e.target.value)}
          rows={2}
          placeholder="e.g., Extra spicy, no onions…"
          className="mt-1 w-full resize-none rounded-lg border border-input bg-background px-3 py-2 text-sm placeholder:text-muted-foreground/60 focus-ring"
        />
      </div>

      {/* Totals */}
      <div className="space-y-1.5 border-t border-border/60 bg-muted/30 px-5 py-4 text-sm">
        <Row label="Subtotal" value={formatCurrency(subtotal)} />
        <Row label={`Tax (${(TAX_RATE * 100).toFixed(0)}%)`} value={formatCurrency(tax)} muted />
        <div className="my-2 h-px bg-border" />
        <Row label="Total" value={formatCurrency(total)} bold />
      </div>

      {/* CTA */}
      <div className="space-y-2 border-t border-border/60 bg-card p-4">
        <Button
          size="lg"
          className="h-12 w-full text-base"
          disabled={cart.items.length === 0 || (cart.type === 'dine_in' && !cart.tableId)}
        >
          Place Order · {formatCurrency(total)}
        </Button>
        <Button
          variant="ghost"
          size="sm"
          onClick={cart.clear}
          disabled={cart.items.length === 0}
          className="w-full text-muted-foreground"
        >
          Clear cart
        </Button>
      </div>
    </div>
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
