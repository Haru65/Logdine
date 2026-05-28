import { useMemo, useState } from 'react';
import { motion } from 'framer-motion';
import { Plus, Search, Sparkles, Trash2, UtensilsCrossed, Wand2 } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { useCategories, useDeleteItem, useMenuItems, useUpdateItem } from '@/hooks/useRestaurant';
import { cn, formatCurrency } from '@/lib/utils';
import type { MenuItem } from '@/types';

export default function MenuPage() {
  const { data: categories = [], isLoading: catsLoading } = useCategories();
  const { data: items = [], isLoading: itemsLoading } = useMenuItems();
  const updateItem = useUpdateItem();
  const deleteItem = useDeleteItem();

  const [activeCat, setActiveCat] = useState<string | 'all'>('all');
  const [search, setSearch] = useState('');

  const filtered = useMemo(() => {
    return items.filter((it) => {
      if (activeCat !== 'all' && it.category_id !== activeCat) return false;
      if (search && !it.name.toLowerCase().includes(search.toLowerCase())) return false;
      return true;
    });
  }, [items, activeCat, search]);

  return (
    <div className="container py-6 lg:py-8">
      <div className="mb-6 flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="flex items-center gap-2 font-serif text-3xl font-bold tracking-tight">
            <UtensilsCrossed className="size-6 text-primary" />
            Menu Management
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Edit categories, items, prices, addons, and availability.
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" className="gap-1.5">
            <Wand2 className="size-4" /> AI extract
          </Button>
          <Button className="gap-1.5">
            <Plus className="size-4" /> Add item
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-[260px_1fr]">
        {/* Categories rail */}
        <aside className="space-y-1.5">
          <p className="px-3 pb-1.5 text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
            Categories
          </p>
          <button
            onClick={() => setActiveCat('all')}
            className={cn(
              'flex w-full items-center justify-between rounded-lg px-3 py-2 text-sm font-medium transition-colors',
              activeCat === 'all' ? 'bg-primary/10 text-primary' : 'hover:bg-accent',
            )}
          >
            <span>All items</span>
            <Badge variant="secondary">{items.length}</Badge>
          </button>
          {catsLoading
            ? Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-9 rounded-lg" />)
            : categories.map((c) => {
                const count = items.filter((it) => it.category_id === c.id).length;
                return (
                  <button
                    key={c.id}
                    onClick={() => setActiveCat(c.id)}
                    className={cn(
                      'flex w-full items-center justify-between rounded-lg px-3 py-2 text-sm font-medium transition-colors',
                      activeCat === c.id ? 'bg-primary/10 text-primary' : 'hover:bg-accent',
                    )}
                  >
                    <span className="truncate">{c.name}</span>
                    <Badge variant="secondary">{count}</Badge>
                  </button>
                );
              })}
          <Button variant="ghost" size="sm" className="mt-2 w-full justify-start gap-1.5 text-muted-foreground">
            <Plus className="size-3.5" /> New category
          </Button>
        </aside>

        {/* Items area */}
        <div className="space-y-4">
          <div className="relative">
            <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Search items…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-10"
            />
          </div>

          {itemsLoading ? (
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {Array.from({ length: 6 }).map((_, i) => (
                <Skeleton key={i} className="h-48 rounded-2xl" />
              ))}
            </div>
          ) : filtered.length === 0 ? (
            <Card>
              <CardContent className="grid place-items-center gap-2 p-12 text-center">
                <Sparkles className="size-8 text-muted-foreground" />
                <p className="font-serif text-lg font-semibold">No items here yet</p>
                <p className="text-sm text-muted-foreground">
                  Add your first menu item to get started.
                </p>
                <Button className="mt-2 gap-1.5">
                  <Plus className="size-4" /> Add item
                </Button>
              </CardContent>
            </Card>
          ) : (
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {filtered.map((item) => (
                <ItemRow
                  key={item.id}
                  item={item}
                  onToggle={(v) =>
                    updateItem.mutate({ id: item.id, data: { is_available: v } })
                  }
                  onDelete={() => {
                    if (confirm(`Delete "${item.name}"?`)) deleteItem.mutate(item.id);
                  }}
                />
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function ItemRow({
  item,
  onToggle,
  onDelete,
}: {
  item: MenuItem;
  onToggle: (v: boolean) => void;
  onDelete: () => void;
}) {
  return (
    <motion.div initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }}>
      <Card className="group overflow-hidden">
        <div className="relative aspect-[4/3] bg-muted">
          {item.image_url ? (
            <img src={item.image_url} alt={item.name} className="size-full object-cover" loading="lazy" />
          ) : (
            <div className="grid h-full place-items-center bg-gradient-to-br from-primary/10 to-primary/5">
              <UtensilsCrossed className="size-10 text-primary/40" />
            </div>
          )}
          <div className="absolute left-2 top-2 flex gap-1">
            <span
              className={cn(
                'grid size-5 place-items-center rounded-sm border-2 bg-white',
                item.is_veg ? 'border-emerald-600' : 'border-red-600',
              )}
            >
              <span className={cn('size-2 rounded-full', item.is_veg ? 'bg-emerald-600' : 'bg-red-600')} />
            </span>
            {item.is_featured && (
              <Badge variant="warning" className="gap-1">
                <Sparkles className="size-3" /> Featured
              </Badge>
            )}
          </div>
        </div>
        <CardContent className="p-3">
          <div className="flex items-start justify-between gap-2">
            <div className="min-w-0 flex-1">
              <p className="truncate font-semibold">{item.name}</p>
              <p className="font-serif text-lg font-bold">{formatCurrency(item.price)}</p>
            </div>
            <button
              onClick={onDelete}
              className="rounded-md p-1.5 text-muted-foreground transition-colors hover:bg-destructive/10 hover:text-destructive"
              aria-label="Delete"
            >
              <Trash2 className="size-4" />
            </button>
          </div>

          <label className="mt-2 flex cursor-pointer items-center justify-between rounded-md border border-border bg-muted/30 px-2.5 py-1.5 text-xs">
            <span className="font-medium">
              {item.is_available ? 'Available' : 'Hidden from menu'}
            </span>
            <input
              type="checkbox"
              checked={item.is_available}
              onChange={(e) => onToggle(e.target.checked)}
              className="size-4 accent-primary"
            />
          </label>
        </CardContent>
      </Card>
    </motion.div>
  );
}
