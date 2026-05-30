import { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ImagePlus, Pencil, Plus, Search, Sparkles, Trash2, UtensilsCrossed, Wand2, X } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  useBulkUpdateImages,
  useCategories,
  useCreateItemsBulk,
  useDeleteItem,
  useMenuItems,
  useUpdateItem,
  useUpdateItemAddons,
  useUpdateItemVariants,
} from '@/hooks/useRestaurant';
import { cn, formatCurrency } from '@/lib/utils';
import type { MenuCategory, MenuItem } from '@/types';

export default function MenuPage() {
  const navigate = useNavigate();
  const { data: categories = [], isLoading: catsLoading } = useCategories();
  const { data: items = [], isLoading: itemsLoading } = useMenuItems();
  const updateItem = useUpdateItem();
  const deleteItem = useDeleteItem();

  const [activeCat, setActiveCat] = useState<string | 'all'>('all');
  const [search, setSearch] = useState('');
  const [editingItem, setEditingItem] = useState<MenuItem | null>(null);
  const [bulkOpen, setBulkOpen] = useState(false);

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
          <Button variant="outline" className="gap-1.5" onClick={() => navigate('/menu/extraction')}>
            <Wand2 className="size-4" /> AI extract
          </Button>
          <Button variant="outline" className="gap-1.5" onClick={() => setBulkOpen(true)}>
            <Plus className="size-4" /> Bulk import
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
                  onEdit={() => setEditingItem(item)}
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

      <Sheet open={!!editingItem} onOpenChange={(open) => !open && setEditingItem(null)}>
        <SheetContent side="right" className="overflow-y-auto">
          {editingItem && (
            <MenuItemEditor
              key={editingItem.id}
              item={editingItem}
              categories={categories}
              onClose={() => setEditingItem(null)}
            />
          )}
        </SheetContent>
      </Sheet>

      <Sheet open={bulkOpen} onOpenChange={setBulkOpen}>
        <SheetContent side="right" className="overflow-y-auto">
          <BulkImportPanel
            categories={categories}
            defaultCategoryId={activeCat === 'all' ? categories[0]?.id : activeCat}
            onClose={() => setBulkOpen(false)}
          />
        </SheetContent>
      </Sheet>
    </div>
  );
}

function ItemRow({
  item,
  onEdit,
  onToggle,
  onDelete,
}: {
  item: MenuItem;
  onEdit: () => void;
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
            <div className="flex shrink-0 gap-1">
              <button
                onClick={onEdit}
                className="rounded-md p-1.5 text-muted-foreground transition-colors hover:bg-primary/10 hover:text-primary"
                aria-label="Edit"
              >
                <Pencil className="size-4" />
              </button>
              <button
                onClick={onDelete}
                className="rounded-md p-1.5 text-muted-foreground transition-colors hover:bg-destructive/10 hover:text-destructive"
                aria-label="Delete"
              >
                <Trash2 className="size-4" />
              </button>
            </div>
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

function MenuItemEditor({
  item,
  categories,
  onClose,
}: {
  item: MenuItem;
  categories: MenuCategory[];
  onClose: () => void;
}) {
  const updateItem = useUpdateItem();
  const updateVariants = useUpdateItemVariants();
  const updateAddons = useUpdateItemAddons();
  const bulkImages = useBulkUpdateImages();
  const [name, setName] = useState(item.name);
  const [categoryId, setCategoryId] = useState(item.category_id);
  const [description, setDescription] = useState(item.description ?? '');
  const [price, setPrice] = useState(String(item.price));
  const [imageUrl, setImageUrl] = useState(item.image_url ?? '');
  const [tags, setTags] = useState((item.tags ?? []).join(', '));
  const [preparationTime, setPreparationTime] = useState(
    item.preparation_time ? String(item.preparation_time) : '',
  );
  const [isVeg, setIsVeg] = useState(item.is_veg);
  const [isSpicy, setIsSpicy] = useState(Boolean(item.is_spicy));
  const [isAvailable, setIsAvailable] = useState(item.is_available);
  const [variants, setVariants] = useState(
    (item.variants?.length ? item.variants : []).map((v) => ({ name: v.name, price: String(v.price) })),
  );
  const [addons, setAddons] = useState(
    (item.addons?.length ? item.addons : []).map((a) => ({ name: a.name, price: String(a.price) })),
  );

  const canSave = name.trim().length > 0 && Number.isFinite(Number(price)) && Number(price) >= 0;

  return (
    <>
      <SheetHeader>
        <SheetTitle>Edit menu item</SheetTitle>
      </SheetHeader>
      <div className="space-y-4 p-6">
        <div className="space-y-1.5">
          <Label>Name</Label>
          <Input value={name} onChange={(e) => setName(e.target.value)} />
        </div>

        <div className="space-y-1.5">
          <Label>Category</Label>
          <select
            value={categoryId}
            onChange={(e) => setCategoryId(e.target.value)}
            className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
          >
            {categories.map((category) => (
              <option key={category.id} value={category.id}>
                {category.name}
              </option>
            ))}
          </select>
        </div>

        <div className="space-y-1.5">
          <Label>Description</Label>
          <Textarea value={description} onChange={(e) => setDescription(e.target.value)} />
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-1.5">
            <Label>Price</Label>
            <Input type="number" min={0} step="0.01" value={price} onChange={(e) => setPrice(e.target.value)} />
          </div>
          <div className="space-y-1.5">
            <Label>Prep time</Label>
            <Input
              type="number"
              min={0}
              placeholder="Minutes"
              value={preparationTime}
              onChange={(e) => setPreparationTime(e.target.value)}
            />
          </div>
        </div>

        <div className="space-y-1.5">
          <Label>Image URL</Label>
          <div className="flex gap-2">
            <Input value={imageUrl} onChange={(e) => setImageUrl(e.target.value)} />
            <Button
              type="button"
              variant="outline"
              size="icon"
              loading={bulkImages.isPending}
              onClick={() => bulkImages.mutate()}
              title="Auto update missing images"
            >
              <ImagePlus className="size-4" />
            </Button>
          </div>
        </div>

        <div className="space-y-1.5">
          <Label>Tags</Label>
          <Input placeholder="bestseller, new, chef special" value={tags} onChange={(e) => setTags(e.target.value)} />
        </div>

        <div className="grid grid-cols-3 gap-2">
          <label className="flex cursor-pointer items-center justify-between rounded-lg border border-border px-3 py-2 text-sm">
            <span>Vegetarian</span>
            <input
              type="checkbox"
              checked={isVeg}
              onChange={(e) => setIsVeg(e.target.checked)}
              className="size-4 accent-primary"
            />
          </label>
          <label className="flex cursor-pointer items-center justify-between rounded-lg border border-border px-3 py-2 text-sm">
            <span>Spicy</span>
            <input
              type="checkbox"
              checked={isSpicy}
              onChange={(e) => setIsSpicy(e.target.checked)}
              className="size-4 accent-primary"
            />
          </label>
          <label className="flex cursor-pointer items-center justify-between rounded-lg border border-border px-3 py-2 text-sm">
            <span>Available</span>
            <input
              type="checkbox"
              checked={isAvailable}
              onChange={(e) => setIsAvailable(e.target.checked)}
              className="size-4 accent-primary"
            />
          </label>
        </div>

        <OptionEditor
          title="Variants"
          rows={variants}
          onChange={setVariants}
          addLabel="Add variant"
          namePlaceholder="Small / Large / Half"
        />

        <OptionEditor
          title="Add-ons"
          rows={addons}
          onChange={setAddons}
          addLabel="Add add-on"
          namePlaceholder="Extra cheese"
        />

        <div className="flex gap-2 pt-2">
          <Button
            className="flex-1"
            disabled={!canSave}
            loading={updateItem.isPending}
            onClick={() => {
              updateItem.mutate(
                {
                  id: item.id,
                  data: {
                    category_id: categoryId,
                    name: name.trim(),
                    description,
                    price: Number(price),
                    image_url: imageUrl,
                    preparation_time: preparationTime ? Number(preparationTime) : undefined,
                    tags: tags.split(',').map((tag) => tag.trim()).filter(Boolean),
                    is_veg: isVeg,
                    is_spicy: isSpicy,
                    is_available: isAvailable,
                  },
                },
                {
                  onSuccess: () => {
                    const cleanVariants = variants
                      .filter((row) => row.name.trim() && Number(row.price) >= 0)
                      .map((row, index) => ({ name: row.name.trim(), price: Number(row.price), sort_order: index }));
                    const cleanAddons = addons
                      .filter((row) => row.name.trim() && Number(row.price) >= 0)
                      .map((row, index) => ({ name: row.name.trim(), price: Number(row.price), sort_order: index }));
                    updateVariants.mutate({ id: item.id, variants: cleanVariants });
                    updateAddons.mutate({ id: item.id, addons: cleanAddons }, { onSuccess: onClose });
                  },
                },
              );
            }}
          >
            Save changes
          </Button>
          <Button variant="outline" onClick={onClose}>
            Cancel
          </Button>
        </div>
      </div>
    </>
  );
}

function OptionEditor({
  title,
  rows,
  onChange,
  addLabel,
  namePlaceholder,
}: {
  title: string;
  rows: { name: string; price: string }[];
  onChange: (rows: { name: string; price: string }[]) => void;
  addLabel: string;
  namePlaceholder: string;
}) {
  return (
    <div className="space-y-2 rounded-lg border border-border p-3">
      <div className="flex items-center justify-between">
        <Label>{title}</Label>
        <Button type="button" variant="ghost" size="sm" onClick={() => onChange([...rows, { name: '', price: '0' }])}>
          <Plus className="size-3.5" /> {addLabel}
        </Button>
      </div>
      {rows.length === 0 ? (
        <p className="text-xs text-muted-foreground">No {title.toLowerCase()} configured.</p>
      ) : (
        <div className="space-y-2">
          {rows.map((row, index) => (
            <div key={index} className="grid grid-cols-[1fr_96px_auto] gap-2">
              <Input
                placeholder={namePlaceholder}
                value={row.name}
                onChange={(e) => onChange(rows.map((r, i) => (i === index ? { ...r, name: e.target.value } : r)))}
              />
              <Input
                type="number"
                min={0}
                step="0.01"
                value={row.price}
                onChange={(e) => onChange(rows.map((r, i) => (i === index ? { ...r, price: e.target.value } : r)))}
              />
              <Button type="button" variant="ghost" size="icon" onClick={() => onChange(rows.filter((_, i) => i !== index))}>
                <X className="size-4" />
              </Button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function BulkImportPanel({
  categories,
  defaultCategoryId,
  onClose,
}: {
  categories: MenuCategory[];
  defaultCategoryId?: string;
  onClose: () => void;
}) {
  const createBulk = useCreateItemsBulk();
  const [categoryId, setCategoryId] = useState(defaultCategoryId ?? '');
  const [text, setText] = useState('Masala Dosa, 120\nPaneer Tikka, 240\nCold Coffee, 110');

  const parsed = text
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean)
    .map((line) => {
      const [name, price, description = ''] = line.split(',').map((part) => part.trim());
      return { name, price: Number(price), description };
    })
    .filter((item) => item.name && Number.isFinite(item.price));

  return (
    <>
      <SheetHeader>
        <SheetTitle>Bulk import items</SheetTitle>
      </SheetHeader>
      <div className="space-y-4 p-6">
        <div className="space-y-1.5">
          <Label>Category</Label>
          <select
            value={categoryId}
            onChange={(e) => setCategoryId(e.target.value)}
            className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
          >
            <option value="">Select category</option>
            {categories.map((category) => (
              <option key={category.id} value={category.id}>
                {category.name}
              </option>
            ))}
          </select>
        </div>
        <div className="space-y-1.5">
          <Label>Items</Label>
          <Textarea value={text} onChange={(e) => setText(e.target.value)} className="min-h-56 font-mono text-xs" />
          <p className="text-xs text-muted-foreground">One item per line: name, price, optional description.</p>
        </div>
        <div className="rounded-lg bg-muted/40 p-3 text-sm">
          {parsed.length} valid item{parsed.length === 1 ? '' : 's'} ready to import
        </div>
        <div className="flex gap-2">
          <Button
            className="flex-1"
            disabled={!categoryId || parsed.length === 0}
            loading={createBulk.isPending}
            onClick={() =>
              createBulk.mutate(
                parsed.map((item) => ({
                  category_id: categoryId,
                  name: item.name,
                  price: item.price,
                  description: item.description,
                  is_veg: true,
                  is_available: true,
                })),
                { onSuccess: onClose },
              )
            }
          >
            Import items
          </Button>
          <Button variant="outline" onClick={onClose}>
            Cancel
          </Button>
        </div>
      </div>
    </>
  );
}
