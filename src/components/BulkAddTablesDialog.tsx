import { useState } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent } from '@/components/ui/card';
import { Plus, AlertCircle } from 'lucide-react';
import { useCreateBulkTables } from '@/hooks/useRestaurant';
import type { RestaurantTable } from '@/types';

export default function BulkAddTablesDialog() {
  const [open, setOpen] = useState(false);
  const [startNumber, setStartNumber] = useState('1');
  const [endNumber, setEndNumber] = useState('4');
  const [capacity, setCapacity] = useState('4');
  
  const createBulk = useCreateBulkTables();

  const handleCreate = () => {
    const start = parseInt(startNumber);
    const end = parseInt(endNumber);
    const cap = parseInt(capacity);

    if (isNaN(start) || isNaN(end) || isNaN(cap) || start < 1 || end < start || cap < 1) {
      return;
    }

    // Generate table objects with CORRECT field names for backend
    const tables: Partial<RestaurantTable>[] = [];
    for (let i = start; i <= end; i++) {
      tables.push({
        name: String(i),              // Backend expects 'name', not 'table_number'
        identifier: `table-${i}`,     // Backend expects 'identifier'
        capacity: cap,
        table_type: 'regular'         // Backend expects this
      } as Partial<RestaurantTable>);
    }

    createBulk.mutate(tables, {
      onSuccess: () => {
        // Reset form
        setStartNumber('1');
        setEndNumber('4');
        setCapacity('4');
        setOpen(false);
      },
    });
  };

  const tableCount = Math.max(0, parseInt(endNumber) - parseInt(startNumber) + 1);

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button className="gap-1.5">
          <Plus className="size-4" /> Bulk Add Tables
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Bulk Add Tables</DialogTitle>
          <DialogDescription>
            Create multiple tables at once. QR codes will be generated automatically for each table.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label htmlFor="start">Start Table Number</Label>
              <Input
                id="start"
                type="number"
                min={1}
                value={startNumber}
                onChange={(e) => setStartNumber(e.target.value)}
                placeholder="1"
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="end">End Table Number</Label>
              <Input
                id="end"
                type="number"
                min={1}
                value={endNumber}
                onChange={(e) => setEndNumber(e.target.value)}
                placeholder="4"
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="capacity">Capacity per Table</Label>
            <Input
              id="capacity"
              type="number"
              min={1}
              max={20}
              value={capacity}
              onChange={(e) => setCapacity(e.target.value)}
              placeholder="4"
            />
            <p className="text-xs text-muted-foreground">Number of seats per table (same for all)</p>
          </div>

          {parseInt(endNumber) < parseInt(startNumber) && (
            <Card className="border-amber-200 bg-amber-50 dark:border-amber-900/40 dark:bg-amber-950/20">
              <CardContent className="flex gap-2 p-3 text-sm text-amber-900 dark:text-amber-200">
                <AlertCircle className="size-4 flex-shrink-0 mt-0.5" />
                <span>End table number must be greater than or equal to start number</span>
              </CardContent>
            </Card>
          )}

          <Card className="border-blue-200 bg-blue-50 dark:border-blue-900/40 dark:bg-blue-950/20">
            <CardContent className="p-3">
              <p className="text-sm font-medium text-blue-900 dark:text-blue-200">Preview</p>
              <p className="mt-1 text-sm text-blue-800 dark:text-blue-300">
                Tables {startNumber} to {endNumber} ({tableCount} table{tableCount !== 1 ? 's' : ''}) with {capacity} seats each
              </p>
              <p className="mt-1 text-xs text-blue-700 dark:text-blue-400">
                ✓ QR codes will be auto-generated for each table
              </p>
            </CardContent>
          </Card>

          <div className="flex gap-2 pt-2">
            <Button
              className="flex-1"
              onClick={handleCreate}
              disabled={
                createBulk.isPending ||
                isNaN(parseInt(startNumber)) ||
                isNaN(parseInt(endNumber)) ||
                isNaN(parseInt(capacity)) ||
                parseInt(startNumber) < 1 ||
                parseInt(endNumber) < parseInt(startNumber) ||
                parseInt(capacity) < 1
              }
              loading={createBulk.isPending}
            >
              Create {tableCount} Table{tableCount !== 1 ? 's' : ''}
            </Button>
            <Button variant="outline" onClick={() => setOpen(false)}>
              Cancel
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
