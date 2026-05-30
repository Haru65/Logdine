import { useMemo, useState } from 'react';
import { Boxes, Plus, Trash2 } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { Textarea } from '@/components/ui/textarea';
import { Skeleton } from '@/components/ui/skeleton';
import { useCombos, useCreateCombo, useDeleteCombo, useMenuItems } from '@/hooks/useRestaurant';
import { formatCurrency } from '@/lib/utils';
import type { ComboItem } from '@/types';

export default function ComboManagementPage() {
  const { data: combos = [], isLoading } = useCombos();
  const deleteCombo = useDeleteCombo();
  const [open, setOpen] = useState(false);

  return (
    <div className="container py-6 lg:py-8">
      <div className="mb-6 flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="flex items-center gap-2 font-serif text-3xl font-bold tracking-tight">
            <Boxes className="size-6 text-primary" />
            Combo Offers
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">Bundle menu items with special pricing.</p>
        </div>
        <Button onClick={() => setOpen(true)}>
          <Plus className="size-4" /> Create combo
        </Button>
      </div>

      {isLoading ? (
        <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
          {Array.from({ length: 3 }).map((_, i) => <Skeleton key={i} className="h-48 rounded-2xl" />)}
        </div>
      ) : combos.length === 0 ? (
        <Card>
          <CardContent className="grid place-items-center gap-2 p-16 text-center">
            <Boxes className="size-10 text-muted-foreground/40" />
            <p className="font-serif text-xl font-semibold">No combos yet</p>
            <Button onClick={() => setOpen(true)}>Create first combo</Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
          {combos.map((combo) => (
            <Card key={combo.id}>
              <CardContent className="space-y-3 p-5">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="font-serif text-xl font-bold">{combo.name}</p>
                    {combo.description && <p className="text-sm text-muted-foreground">{combo.description}</p>}
                  </div>
                  <Badge variant={combo.is_active ? 'success' : 'secondary'}>{combo.is_active ? 'Active' : 'Paused'}</Badge>
                </div>
                <div className="flex items-end justify-between">
                  <div>
                    <p className="text-xs text-muted-foreground">Combo price</p>
                    <p className="font-serif text-2xl font-bold">{formatCurrency(combo.combo_price)}</p>
                  </div>
                  {combo.original_price ? (
                    <p className="text-sm text-muted-foreground line-through">{formatCurrency(combo.original_price)}</p>
                  ) : null}
                </div>
                <div className="space-y-1 border-t border-border/60 pt-3 text-sm">
                  {(combo.items ?? []).map((item) => (
                    <div key={item.id ?? item.menu_item_id} className="flex justify-between">
                      <span>{item.quantity}x {item.item_name ?? item.menu_item_id}</span>
                      {item.item_price !== undefined && <span>{formatCurrency(item.item_price)}</span>}
                    </div>
                  ))}
                </div>
                <Button variant="outline" className="w-full text-destructive" onClick={() => deleteCombo.mutate(combo.id)}>
                  <Trash2 className="size-4" /> Delete combo
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      <Sheet open={open} onOpenChange={setOpen}>
        <SheetContent side="right" className="overflow-y-auto">
          <ComboEditor onClose={() => setOpen(false)} />
        </SheetContent>
      </Sheet>
    </div>
  );
}

function ComboEditor({ onClose }: { onClose: () => void }) {
  const { data: items = [] } = useMenuItems();
  const create = useCreateCombo();
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [comboPrice, setComboPrice] = useState('');
  const [selected, setSelected] = useState<ComboItem[]>([]);

  const originalPrice = useMemo(
    () => selected.reduce((sum, row) => {
      const item = items.find((it) => it.id === row.menu_item_id);
      return sum + Number(item?.price ?? 0) * row.quantity;
    }, 0),
    [items, selected],
  );

  return (
    <>
      <SheetHeader>
        <SheetTitle>Create combo</SheetTitle>
      </SheetHeader>
      <div className="space-y-4 p-6">
        <Field label="Name" value={name} onChange={setName} />
        <div className="space-y-1.5">
          <Label>Description</Label>
          <Textarea value={description} onChange={(e) => setDescription(e.target.value)} />
        </div>
        <Field label="Combo price" value={comboPrice} onChange={setComboPrice} type="number" />
        <div className="rounded-lg bg-muted/40 p-3 text-sm">
          Original price: <span className="font-semibold">{formatCurrency(originalPrice)}</span>
        </div>
        <div className="space-y-2">
          <Label>Items</Label>
          <select
            className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
            value=""
            onChange={(e) => {
              if (!e.target.value) return;
              setSelected((rows) => [...rows, { menu_item_id: e.target.value, quantity: 1 }]);
            }}
          >
            <option value="">Add menu item</option>
            {items.map((item) => <option key={item.id} value={item.id}>{item.name}</option>)}
          </select>
          {selected.map((row, index) => {
            const item = items.find((it) => it.id === row.menu_item_id);
            return (
              <div key={`${row.menu_item_id}-${index}`} className="grid grid-cols-[1fr_80px_auto] gap-2">
                <Input value={item?.name ?? row.menu_item_id} readOnly />
                <Input
                  type="number"
                  min={1}
                  value={row.quantity}
                  onChange={(e) => setSelected((rows) => rows.map((r, i) => i === index ? { ...r, quantity: Number(e.target.value) } : r))}
                />
                <Button variant="ghost" size="icon" onClick={() => setSelected((rows) => rows.filter((_, i) => i !== index))}>
                  <Trash2 className="size-4" />
                </Button>
              </div>
            );
          })}
        </div>
        <Button
          className="w-full"
          disabled={!name || !comboPrice || selected.length === 0}
          loading={create.isPending}
          onClick={() =>
            create.mutate(
              { name, description, combo_price: Number(comboPrice), items: selected },
              { onSuccess: onClose },
            )
          }
        >
          Save combo
        </Button>
      </div>
    </>
  );
}

function Field({ label, value, onChange, type = 'text' }: { label: string; value: string; onChange: (value: string) => void; type?: string }) {
  return (
    <div className="space-y-1.5">
      <Label>{label}</Label>
      <Input type={type} value={value} onChange={(e) => onChange(e.target.value)} />
    </div>
  );
}
