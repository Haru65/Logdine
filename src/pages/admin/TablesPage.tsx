import { useMemo, useState } from 'react';
import { motion } from 'framer-motion';
import { Clock, ScanLine, Table2, Trash2, Users } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { useDeleteTable, useTables, useUpdateTable } from '@/hooks/useRestaurant';
import { cn, timeAgo } from '@/lib/utils';
import BulkAddTablesDialog from '@/components/BulkAddTablesDialog';
import BulkQRDownloadButton from '@/components/BulkQRDownloadButton';
import QRCodeDisplay from '@/components/QRCodeDisplay';
import QRStandee from '@/components/QRStandee';
import type { RestaurantTable, TableStatus } from '@/types';

const statusStyles: Record<TableStatus, string> = {
  available: 'border-emerald-500/40 bg-emerald-50/50 dark:bg-emerald-500/5',
  occupied: 'border-red-500/40 bg-red-50/50 dark:bg-red-500/5',
  reserved: 'border-amber-500/40 bg-amber-50/50 dark:bg-amber-500/5',
  maintenance: 'border-slate-300 bg-slate-50/70 dark:bg-slate-500/5',
};

const statusDot: Record<TableStatus, string> = {
  available: 'bg-emerald-500',
  occupied: 'bg-red-500',
  reserved: 'bg-amber-500',
  maintenance: 'bg-slate-400',
};

const tableSortValue = (table: RestaurantTable) => table.table_number || table.name || table.identifier || '';

function compareTablesAsc(a: RestaurantTable, b: RestaurantTable) {
  return tableSortValue(a).localeCompare(tableSortValue(b), undefined, {
    numeric: true,
    sensitivity: 'base',
  });
}

export default function TablesPage() {
  const { data: tables, isLoading } = useTables();
  const [selected, setSelected] = useState<RestaurantTable | null>(null);
  const sortedTables = useMemo(() => [...(tables ?? [])].sort(compareTablesAsc), [tables]);

  return (
    <div className="container py-6 lg:py-8">
      <div className="mb-6 flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="flex items-center gap-2 font-serif text-3xl font-bold tracking-tight">
            <Table2 className="size-6 text-primary" />
            Table Management
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Create tables, generate QR codes, and track live status.
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <BulkQRDownloadButton tables={sortedTables} />
          <BulkAddTablesDialog />
        </div>
      </div>

      {isLoading ? (
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6">
          {Array.from({ length: 12 }).map((_, i) => (
            <Skeleton key={i} className="aspect-[4/5] rounded-2xl" />
          ))}
        </div>
      ) : !sortedTables.length ? (
        <Card>
          <CardContent className="grid place-items-center gap-3 p-16 text-center">
            <Table2 className="size-12 text-muted-foreground/30" />
            <p className="font-serif text-xl font-semibold">No tables yet</p>
            <p className="max-w-xs text-sm text-muted-foreground">
              Add tables to start tracking occupancy and generate customer QR codes.
            </p>
            <div className="mt-2 flex flex-wrap justify-center gap-2">
              <BulkQRDownloadButton tables={sortedTables} />
              <BulkAddTablesDialog />
            </div>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6">
          {sortedTables.map((t) => (
            <TableCard key={t.id} table={t} onClick={() => setSelected(t)} />
          ))}
        </div>
      )}

      <Sheet open={!!selected} onOpenChange={(o) => !o && setSelected(null)}>
        <SheetContent side="right">
          {selected && <TableEditor table={selected} onClose={() => setSelected(null)} />}
        </SheetContent>
      </Sheet>
    </div>
  );
}

function TableCard({ table, onClick }: { table: RestaurantTable; onClick: () => void }) {
  return (
    <motion.button
      initial={{ opacity: 0, y: 6 }}
      animate={{ opacity: 1, y: 0 }}
      onClick={onClick}
      className={cn(
        'group relative aspect-[4/5] overflow-hidden rounded-2xl border-2 p-3 text-left transition-all hover:-translate-y-0.5 hover:shadow-soft',
        statusStyles[table.status],
      )}
    >
      <div className="flex items-start justify-between">
        <Badge variant="outline" className="bg-card font-mono uppercase text-[10px]">
          T{table.table_number}
        </Badge>
        <span className={cn('size-2.5 rounded-full', statusDot[table.status])} />
      </div>

      {/* QR Code Display */}
      <div className="flex justify-center py-2">
        <QRCodeDisplay table={table} size={80} />
      </div>

      <div className="absolute inset-x-3 bottom-3">
        <p className="font-serif text-lg font-bold tracking-tight">{table.table_number}</p>
        <div className="mt-0.5 flex items-center gap-1 text-[10px] text-muted-foreground">
          <Users className="size-3" /> {table.capacity} seats
        </div>
        <div className="flex items-center gap-1 text-[10px] text-muted-foreground">
          <ScanLine className="size-3" /> {table.qr_scan_count ?? 0} scans
        </div>
        <p className="mt-0.5 text-[9px] font-semibold uppercase tracking-wider text-muted-foreground capitalize">
          {table.status}
        </p>
      </div>
    </motion.button>
  );
}

function TableEditor({ table, onClose }: { table: RestaurantTable; onClose: () => void }) {
  const update = useUpdateTable();
  const deleteTable = useDeleteTable();
  const [number, setNumber] = useState(table.table_number);
  const [capacity, setCapacity] = useState(String(table.capacity));
  const [status, setStatus] = useState<TableStatus>(table.status);

  return (
    <>
      <SheetHeader>
        <SheetTitle>Table {table.table_number}</SheetTitle>
      </SheetHeader>
      <div className="space-y-4 p-6">
        <div className="space-y-1.5">
          <Label>Table number</Label>
          <Input value={number} onChange={(e) => setNumber(e.target.value)} />
        </div>
        <div className="space-y-1.5">
          <Label>Capacity</Label>
          <Input type="number" min={1} max={20} value={capacity} onChange={(e) => setCapacity(e.target.value)} />
        </div>
        <div className="space-y-1.5">
          <Label>Status</Label>
          <div className="grid grid-cols-2 gap-2">
            {(['available', 'occupied', 'reserved', 'maintenance'] as TableStatus[]).map((s) => (
              <button
                key={s}
                onClick={() => setStatus(s)}
                className={cn(
                  'rounded-lg border px-3 py-2 text-sm font-medium capitalize transition-colors',
                  status === s ? 'border-primary bg-primary/10 text-primary' : 'border-border hover:bg-accent',
                )}
              >
                {s}
              </button>
            ))}
          </div>
        </div>

        <Card>
          <CardContent className="grid place-items-center gap-3 p-6">
            <QRStandee table={table} className="w-full" />
            <p className="text-xs text-muted-foreground">QR standee - scan to order</p>
            <div className="text-center">
              <p className="text-sm font-semibold">{table.qr_scan_count ?? 0} total scans</p>
              <p className="mt-0.5 flex items-center justify-center gap-1 text-xs text-muted-foreground">
                <Clock className="size-3" />
                {table.last_qr_scan_at ? `Last scanned ${timeAgo(table.last_qr_scan_at)}` : 'No scans yet'}
              </p>
            </div>
          </CardContent>
        </Card>

        <div className="flex gap-2 pt-2">
          <Button
            className="flex-1"
            loading={update.isPending}
            disabled={deleteTable.isPending}
            onClick={() => {
              update.mutate(
                {
                  tableId: table.id,
                  data: { name: number, capacity: Number(capacity), status },
                },
                { onSuccess: onClose },
              );
            }}
          >
            Save changes
          </Button>
          <Button variant="outline" onClick={onClose}>
            Cancel
          </Button>
        </div>

        <Button
          type="button"
          variant="destructive"
          className="w-full gap-1.5"
          loading={deleteTable.isPending}
          disabled={update.isPending}
          onClick={() => {
            const confirmed = window.confirm(`Delete table ${table.table_number}? This will remove it from table management.`);
            if (!confirmed) return;

            deleteTable.mutate(table.id, { onSuccess: onClose });
          }}
        >
          <Trash2 className="size-4" /> Delete Table
        </Button>
      </div>
    </>
  );
}
