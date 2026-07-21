import { useEffect, useMemo, useState } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ImagePlus, Pencil, Plus, Search, Sparkles, Trash2, Upload, UtensilsCrossed, Wand2, X } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  useBulkUpdateImages,
  useCategories,
  useCreateCategory,
  useCreateItem,
  useCreateItemsBulk,
  useDeleteCategory,
  useDeleteItem,
  useMenuItems,
  useUpdateCategory,
  useUpdateItem,
  useUpdateItemAddons,
  useUpdateItemVariants,
} from '@/hooks/useRestaurant';
import { cn, formatCurrency } from '@/lib/utils';
import { getThumbnailUrl } from '@/lib/imageUrl';
import type { MenuCategory, MenuItem } from '@/types';
import { restaurantService } from '@/services/restaurant.service';
import { useAuthStore, selectTenantId } from '@/store/auth.store';
import { qk } from '@/api/queryClient';

type OptionRow = {
  name: string;
  price: string;
  is_available: boolean;
};

function tagsToInputValue(tags: unknown): string {
  if (Array.isArray(tags)) {
    return tags.map((tag) => String(tag).trim()).filter(Boolean).join(', ');
  }
  if (typeof tags === 'string') {
    const trimmed = tags.trim();
    if (!trimmed) return '';

    try {
      const parsed = JSON.parse(trimmed);
      if (Array.isArray(parsed)) {
        return parsed.map((tag) => String(tag).trim()).filter(Boolean).join(', ');
      }
    } catch {
      // Existing cafe API stores tags as comma-separated text.
    }

    return trimmed;
  }
  return '';
}

export default function MenuPage() {
  const navigate = useNavigate();
  const { data: categories = [], isLoading: catsLoading } = useCategories();
  const { data: items = [], isLoading: itemsLoading } = useMenuItems();
  const updateItem = useUpdateItem();
  const deleteItem = useDeleteItem();
  const createCategory = useCreateCategory();
  const updateCategory = useUpdateCategory();
  const deleteCategory = useDeleteCategory();

  const [activeCat, setActiveCat] = useState<string | 'all'>('all');
  const [search, setSearch] = useState('');
  const [editingItem, setEditingItem] = useState<MenuItem | null>(null);
  const [createOpen, setCreateOpen] = useState(false);
  const [bulkOpen, setBulkOpen] = useState(false);
  const [categoryOpen, setCategoryOpen] = useState(false);
  const [editingCategory, setEditingCategory] = useState<MenuCategory | null>(null);
  const [categoryToDelete, setCategoryToDelete] = useState<MenuCategory | null>(null);
  const [categoryName, setCategoryName] = useState('');

  const defaultCategoryId = activeCat === 'all' ? categories[0]?.id : activeCat;
  const categoryDeleteItemCount = categoryToDelete
    ? items.filter((item) => item.category_id === categoryToDelete.id).length
    : 0;
  const categoryMutationPending = createCategory.isPending || updateCategory.isPending;

  const filtered = useMemo(() => {
    return items.filter((it) => {
      if (activeCat !== 'all' && it.category_id !== activeCat) return false;
      if (search && !it.name.toLowerCase().includes(search.toLowerCase())) return false;
      return true;
    });
  }, [items, activeCat, search]);

  useEffect(() => {
    if (activeCat !== 'all' && !categories.some((category) => category.id === activeCat)) {
      setActiveCat('all');
    }
  }, [activeCat, categories]);

  const submitCategory = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const name = categoryName.trim();
    if (!name) return;

    if (editingCategory) {
      updateCategory.mutate(
        { id: editingCategory.id, data: { name } },
        {
          onSuccess: () => {
            setCategoryName('');
            setEditingCategory(null);
            setCategoryOpen(false);
          },
        },
      );
      return;
    }

    createCategory.mutate({ name }, {
      onSuccess: (category) => {
        setCategoryName('');
        setCategoryOpen(false);
        if (category.id) setActiveCat(category.id);
      },
    });
  };

  const openNewCategory = () => {
    setEditingCategory(null);
    setCategoryName('');
    setCategoryOpen(true);
  };

  const openEditCategory = (category: MenuCategory) => {
    setEditingCategory(category);
    setCategoryName(category.name);
    setCategoryOpen(true);
  };

  return (
    <div className="container max-w-full overflow-x-hidden px-3 py-4 sm:px-4 sm:py-6 lg:py-8">
      <div className="mb-5 flex flex-col gap-3 sm:mb-6 lg:flex-row lg:items-end lg:justify-between">
        <div className="min-w-0">
          <h1 className="flex items-center gap-2 font-serif text-2xl font-bold tracking-tight sm:text-3xl">
            <UtensilsCrossed className="size-6 text-primary" />
            <span className="min-w-0 truncate">Menu Management</span>
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Edit categories, items, prices, addons, and availability.
          </p>
        </div>
        <div className="grid grid-cols-1 gap-2 min-[420px]:grid-cols-3 lg:flex lg:shrink-0">
          <Button variant="outline" className="min-w-0 gap-1.5" onClick={() => navigate('/menu/extraction')}>
            <Wand2 className="size-4" /> AI extract
          </Button>
          <Button variant="outline" className="min-w-0 gap-1.5" onClick={() => setBulkOpen(true)}>
            <Plus className="size-4" /> Bulk import
          </Button>
          <Button className="min-w-0 gap-1.5" onClick={() => setCreateOpen(true)}>
            <Plus className="size-4" /> Add item
          </Button>
        </div>
      </div>

      <div className="grid min-w-0 grid-cols-1 gap-4 lg:grid-cols-[260px_minmax(0,1fr)]">
        {/* Categories rail */}
        <aside className="min-w-0 space-y-1.5">
          <p className="px-1 pb-1.5 text-[10px] font-bold uppercase tracking-widest text-muted-foreground sm:px-3">
            Categories
          </p>
          <div className="-mx-3 flex gap-2 overflow-x-auto px-3 pb-1 lg:mx-0 lg:block lg:space-y-1.5 lg:overflow-visible lg:px-0 lg:pb-0">
            <button
              onClick={() => setActiveCat('all')}
              className={cn(
                'flex shrink-0 items-center justify-between gap-2 rounded-lg px-3 py-2 text-sm font-medium transition-colors lg:w-full lg:shrink',
                activeCat === 'all' ? 'bg-primary/10 text-primary' : 'hover:bg-accent',
              )}
            >
              <span className="whitespace-nowrap">All items</span>
              <Badge variant="secondary">{items.length}</Badge>
            </button>
            {catsLoading
              ? Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-9 w-28 shrink-0 rounded-lg lg:w-full" />)
              : categories.map((c) => {
                  const count = items.filter((it) => it.category_id === c.id).length;
                  return (
                    <div
                      key={c.id}
                      className={cn(
                        'flex w-[230px] shrink-0 items-center rounded-lg text-sm font-medium transition-colors lg:w-full lg:shrink',
                        activeCat === c.id ? 'bg-primary/10 text-primary' : 'hover:bg-accent',
                      )}
                    >
                      <button
                        type="button"
                        onClick={() => setActiveCat(c.id)}
                        className="flex min-w-0 flex-1 items-center justify-between gap-2 px-3 py-2 text-left"
                      >
                        <span className="truncate">{c.name}</span>
                        <Badge variant="secondary">{count}</Badge>
                      </button>
                      <div className="flex shrink-0 items-center pr-1">
                        <button
                          type="button"
                          onClick={() => openEditCategory(c)}
                          className="grid size-8 place-items-center rounded-md text-muted-foreground transition-colors hover:bg-background hover:text-foreground"
                          aria-label={`Edit ${c.name} category`}
                          title="Edit category"
                        >
                          <Pencil className="size-3.5" />
                        </button>
                        <button
                          type="button"
                          onClick={() => setCategoryToDelete(c)}
                          className="grid size-8 place-items-center rounded-md text-muted-foreground transition-colors hover:bg-destructive/10 hover:text-destructive"
                          aria-label={`Delete ${c.name} category`}
                          title="Delete category"
                        >
                          <Trash2 className="size-3.5" />
                        </button>
                      </div>
                    </div>
                  );
                })}
          </div>
          <Button
            variant="ghost"
            size="sm"
            className="mt-2 w-full justify-start gap-1.5 text-muted-foreground"
            onClick={openNewCategory}
          >
            <Plus className="size-3.5" /> New category
          </Button>
        </aside>

        {/* Items area */}
        <div className="min-w-0 space-y-4">
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
            <div className="grid min-w-0 grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-3">
              {Array.from({ length: 6 }).map((_, i) => (
                <Skeleton key={i} className="h-48 rounded-2xl" />
              ))}
            </div>
          ) : filtered.length === 0 ? (
            <Card>
              <CardContent className="grid place-items-center gap-2 px-4 py-10 text-center sm:p-12">
                <Sparkles className="size-8 text-muted-foreground" />
                <p className="font-serif text-lg font-semibold">No items here yet</p>
                <p className="text-sm text-muted-foreground">
                  Add your first menu item to get started.
                </p>
                <Button className="mt-2 gap-1.5" onClick={() => setCreateOpen(true)}>
                  <Plus className="size-4" /> Add item
                </Button>
              </CardContent>
            </Card>
          ) : (
            <div className="grid min-w-0 grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-3">
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
        <SheetContent side="right" className="w-full max-w-full overflow-y-auto sm:w-3/4 sm:max-w-md">
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

      <Sheet open={createOpen} onOpenChange={setCreateOpen}>
        <SheetContent side="right" className="w-full max-w-full overflow-y-auto sm:w-3/4 sm:max-w-md">
          <MenuItemEditor
            key={`new-${defaultCategoryId ?? 'none'}`}
            categories={categories}
            defaultCategoryId={defaultCategoryId}
            onClose={() => setCreateOpen(false)}
          />
        </SheetContent>
      </Sheet>

      <Dialog
        open={categoryOpen}
        onOpenChange={(open) => {
          setCategoryOpen(open);
          if (!open) {
            setEditingCategory(null);
            setCategoryName('');
          }
        }}
      >
        <DialogContent className="sm:max-w-md">
          <form onSubmit={submitCategory} className="space-y-4">
            <DialogHeader>
              <DialogTitle>{editingCategory ? 'Edit category' : 'New category'}</DialogTitle>
              <DialogDescription>
                {editingCategory
                  ? 'Rename this category everywhere it appears in the menu.'
                  : 'This category will only be available to the current restaurant.'}
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-2">
              <Label htmlFor="category-name">Category name</Label>
              <Input
                id="category-name"
                value={categoryName}
                onChange={(event) => setCategoryName(event.target.value)}
                placeholder="e.g. Breakfast"
                autoFocus
                maxLength={100}
              />
            </div>
            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => setCategoryOpen(false)}
                disabled={categoryMutationPending}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={!categoryName.trim() || categoryMutationPending}>
                {categoryMutationPending
                  ? (editingCategory ? 'Saving…' : 'Creating…')
                  : (editingCategory ? 'Save changes' : 'Create category')}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      <Dialog open={!!categoryToDelete} onOpenChange={(open) => !open && setCategoryToDelete(null)}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>
              {categoryDeleteItemCount > 0 ? 'Category cannot be deleted' : 'Delete category?'}
            </DialogTitle>
            <DialogDescription>
              {categoryDeleteItemCount > 0
                ? `“${categoryToDelete?.name}” contains ${categoryDeleteItemCount} menu ${categoryDeleteItemCount === 1 ? 'item' : 'items'}. Move or delete those items first.`
                : `“${categoryToDelete?.name}” will be removed from this restaurant. This action cannot be undone.`}
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => setCategoryToDelete(null)}
              disabled={deleteCategory.isPending}
            >
              {categoryDeleteItemCount > 0 ? 'Close' : 'Cancel'}
            </Button>
            {categoryDeleteItemCount === 0 && categoryToDelete && (
              <Button
                type="button"
                variant="destructive"
                disabled={deleteCategory.isPending}
                onClick={() => {
                  const categoryId = categoryToDelete.id;
                  deleteCategory.mutate(categoryId, {
                    onSuccess: () => {
                      if (activeCat === categoryId) setActiveCat('all');
                      setCategoryToDelete(null);
                    },
                  });
                }}
              >
                {deleteCategory.isPending ? 'Deleting…' : 'Delete category'}
              </Button>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Sheet open={bulkOpen} onOpenChange={setBulkOpen}>
        <SheetContent side="right" className="w-full max-w-full overflow-y-auto sm:w-3/4 sm:max-w-md">
          <BulkImportPanel
            categories={categories}
            defaultCategoryId={defaultCategoryId}
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
            <img
              src={getThumbnailUrl(item.image_url, { width: 420, height: 315 })}
              alt={item.name}
              className="size-full object-cover"
              loading="lazy"
            />
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
                type="button"
                onClick={onEdit}
                className="rounded-md p-1.5 text-muted-foreground transition-colors hover:bg-primary/10 hover:text-primary"
                aria-label="Edit"
              >
                <Pencil className="size-4" />
              </button>
              <button
                type="button"
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
  defaultCategoryId,
  onClose,
}: {
  item?: MenuItem;
  categories: MenuCategory[];
  defaultCategoryId?: string;
  onClose: () => void;
}) {
  const createItem = useCreateItem();
  const updateItem = useUpdateItem();
  const updateVariants = useUpdateItemVariants();
  const updateAddons = useUpdateItemAddons();
  const bulkImages = useBulkUpdateImages();
  const tenantId = useAuthStore(selectTenantId);
  const queryClient = useQueryClient();
  const isEditing = Boolean(item?.id);
  const [name, setName] = useState(item?.name ?? '');
  const [categoryId, setCategoryId] = useState(item?.category_id ?? defaultCategoryId ?? '');
  const [description, setDescription] = useState(item?.description ?? '');
  const [price, setPrice] = useState(item ? String(item.price) : '');
  const [imageUrl, setImageUrl] = useState(item?.image_url ?? '');
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imageSource, setImageSource] = useState<'url' | 'upload'>(item?.image_url ? 'url' : 'upload');
  const [imagePreviewUrl, setImagePreviewUrl] = useState('');
  const [uploadingImage, setUploadingImage] = useState(false);
  const [tags, setTags] = useState(tagsToInputValue(item?.tags));
  const [preparationTime, setPreparationTime] = useState(
    item?.preparation_time ? String(item.preparation_time) : '',
  );
  const [isVeg, setIsVeg] = useState(item?.is_veg ?? true);
  const [isSpicy, setIsSpicy] = useState(Boolean(item?.is_spicy));
  const [isAvailable, setIsAvailable] = useState(item?.is_available ?? true);
  const [variants, setVariants] = useState<OptionRow[]>(
    (item?.variants?.length ? item.variants : []).map((v) => ({
      name: v.name,
      price: String(v.price),
      is_available: v.is_available === undefined ? true : Boolean(v.is_available),
    })),
  );
  const [addons, setAddons] = useState<OptionRow[]>(
    (item?.addons?.length ? item.addons : []).map((a) => ({
      name: a.name,
      price: String(a.price),
      is_available: a.is_available === undefined ? true : Boolean(a.is_available),
    })),
  );

  const canSave = Boolean(categoryId) && name.trim().length > 0 && Number.isFinite(Number(price)) && Number(price) >= 0;
  const isSaving = createItem.isPending || updateItem.isPending || updateVariants.isPending || updateAddons.isPending || uploadingImage;

  useEffect(() => {
    if (!imageFile) {
      setImagePreviewUrl('');
      return;
    }

    const objectUrl = URL.createObjectURL(imageFile);
    setImagePreviewUrl(objectUrl);
    return () => URL.revokeObjectURL(objectUrl);
  }, [imageFile]);

  const cleanVariants = () =>
    variants
      .filter((row) => row.name.trim() && Number(row.price) >= 0)
      .map((row, index) => ({
        name: row.name.trim(),
        price: Number(row.price),
        is_available: row.is_available,
        sort_order: index,
      }));

  const cleanAddons = () =>
    addons
      .filter((row) => row.name.trim() && Number(row.price) >= 0)
      .map((row, index) => ({
        name: row.name.trim(),
        price: Number(row.price),
        is_available: row.is_available,
        sort_order: index,
      }));

  const saveItem = async () => {
    if (!canSave) return;

    const data = {
      category_id: categoryId,
      name: name.trim(),
      description,
      price: Number(price),
      image_url: imageFile ? (item?.image_url ?? '') : imageUrl,
      preparation_time: preparationTime ? Number(preparationTime) : undefined,
      tags: tags.split(',').map((tag) => tag.trim()).filter(Boolean),
      is_veg: isVeg,
      is_spicy: isSpicy,
      is_available: isAvailable,
    };

    const itemId = item?.id ?? (await createItem.mutateAsync(data)).id;
    if (item?.id) {
      await updateItem.mutateAsync({ id: item.id, data });
    }

    await updateVariants.mutateAsync({ id: itemId, variants: cleanVariants() });
    await updateAddons.mutateAsync({ id: itemId, addons: cleanAddons() });

    if (imageFile && tenantId) {
      setUploadingImage(true);
      try {
        await restaurantService.uploadItemImage(tenantId, itemId, imageFile);
        await queryClient.invalidateQueries({ queryKey: qk.items(tenantId) });
      } finally {
        setUploadingImage(false);
      }
    }
    onClose();
  };

  return (
    <>
      <SheetHeader>
        <SheetTitle>{isEditing ? 'Edit menu item' : 'Add menu item'}</SheetTitle>
      </SheetHeader>
      <div className="space-y-4 px-4 py-5 sm:p-6">
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
            <option value="">Select category</option>
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

        <div className="grid grid-cols-1 gap-3 min-[420px]:grid-cols-2">
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

        <div className="space-y-2">
          <Label>Image</Label>
          <Tabs value={imageSource} onValueChange={(value) => setImageSource(value as 'url' | 'upload')}>
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="url">Image URL</TabsTrigger>
              <TabsTrigger value="upload">Upload image</TabsTrigger>
            </TabsList>
            <TabsContent value="url" className="mt-3 space-y-2">
              <div className="flex gap-2">
                <Input
                  placeholder="https://example.com/item.jpg"
                  value={imageUrl}
                  onChange={(e) => {
                    setImageUrl(e.target.value);
                    if (e.target.value.trim()) setImageFile(null);
                  }}
                />
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
            </TabsContent>
            <TabsContent value="upload" className="mt-3 space-y-2">
              <label className="flex min-h-24 cursor-pointer flex-col items-center justify-center gap-2 rounded-md border border-dashed border-border bg-muted/20 px-3 py-4 text-center text-sm text-muted-foreground transition-colors hover:border-primary hover:text-primary">
                <Upload className="size-5" />
                <span className="font-medium">{imageFile ? imageFile.name : 'Choose image file'}</span>
                <span className="text-xs">JPEG, PNG, or WebP</span>
                <input
                  type="file"
                  accept="image/jpeg,image/png,image/webp"
                  className="hidden"
                  onChange={(e) => {
                    const file = e.target.files?.[0] ?? null;
                    setImageFile(file);
                    if (file) setImageUrl('');
                  }}
                />
              </label>
              {imageFile && (
                <Button type="button" variant="outline" size="sm" onClick={() => setImageFile(null)}>
                  Clear upload
                </Button>
              )}
            </TabsContent>
          </Tabs>
          {(imageFile || imageUrl || item?.image_url) && (
            <div className="overflow-hidden rounded-md border border-border">
              <img
                src={imagePreviewUrl || getThumbnailUrl(imageUrl || item?.image_url, { width: 640, height: 320 })}
                alt={name || 'Menu item'}
                className="h-32 w-full object-cover"
              />
            </div>
          )}
        </div>

        <div className="space-y-1.5">
          <Label>Tags</Label>
          <Input placeholder="bestseller, new, chef special" value={tags} onChange={(e) => setTags(e.target.value)} />
        </div>

        <div className="grid grid-cols-1 gap-2 min-[420px]:grid-cols-3">
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

        <div className="flex flex-col gap-2 pt-2 min-[420px]:flex-row">
          <Button
            className="flex-1"
            disabled={!canSave}
            loading={isSaving}
            onClick={() => void saveItem()}
          >
            {isEditing ? 'Save changes' : 'Create item'}
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
  rows: OptionRow[];
  onChange: (rows: OptionRow[]) => void;
  addLabel: string;
  namePlaceholder: string;
}) {
  return (
    <div className="space-y-2 rounded-lg border border-border p-3">
      <div className="flex items-center justify-between">
        <Label>{title}</Label>
        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={() => onChange([...rows, { name: '', price: '0', is_available: true }])}
        >
          <Plus className="size-3.5" /> {addLabel}
        </Button>
      </div>
      {rows.length === 0 ? (
        <p className="text-xs text-muted-foreground">No {title.toLowerCase()} configured.</p>
      ) : (
        <div className="space-y-2">
          {rows.map((row, index) => (
            <div key={index} className="grid grid-cols-1 items-center gap-2 min-[460px]:grid-cols-[minmax(0,1fr)_88px_auto_auto]">
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
              <label className="flex h-10 cursor-pointer items-center justify-center gap-2 rounded-md border border-border px-2 text-xs">
                <input
                  type="checkbox"
                  checked={row.is_available}
                  onChange={(e) => onChange(rows.map((r, i) => (i === index ? { ...r, is_available: e.target.checked } : r)))}
                  className="size-4 accent-primary"
                />
                <span>Visible</span>
              </label>
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
      <div className="space-y-4 px-4 py-5 sm:p-6">
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
        <div className="flex flex-col gap-2 min-[420px]:flex-row">
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
