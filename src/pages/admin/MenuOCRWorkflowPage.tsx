import { useMemo, useState } from 'react';
import { FileUp, Wand2, UploadCloud } from 'lucide-react';
import { toast } from 'sonner';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Progress } from '@/components/ui/progress';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { menuExtractionService, type ExtractedMenuItem } from '@/services/menuExtraction.service';
import { useAuthStore, selectTenantId } from '@/store/auth.store';
import { useCategories } from '@/hooks/useRestaurant';
import { restaurantService } from '@/services/restaurant.service';

const steps = ['Upload', 'Extract', 'Review', 'Import'];

export default function MenuOCRWorkflowPage() {
  const tenantId = useAuthStore(selectTenantId);
  const { data: categories = [] } = useCategories();
  const [step, setStep] = useState(0);
  const [file, setFile] = useState<File | null>(null);
  const [text, setText] = useState('');
  const [items, setItems] = useState<ExtractedMenuItem[]>([]);
  const [busy, setBusy] = useState(false);

  const progress = ((step + 1) / steps.length) * 100;
  const defaultCategoryId = categories[0]?.id;
  const parsedItems = useMemo(() => menuExtractionService.parseMenuText(text), [text]);

  const normalizeExtractedItem = (item: ExtractedMenuItem): ExtractedMenuItem => ({
    ...item,
    is_veg: item.is_veg ?? item.isVeg ?? true,
    addons: item.addons ?? item.extras ?? [],
    variants: item.variants ?? [],
  });

  async function extract() {
    if (!tenantId || !file) return;
    setBusy(true);
    try {
      const result = file.type === 'application/pdf'
        ? await menuExtractionService.extractTextFromPDF(tenantId, file)
        : await menuExtractionService.extractTextFromImage(tenantId, file);
      const data = result as {
        text?: string;
        rawText?: string;
        extractedText?: string;
        cleanedText?: string;
        items?: ExtractedMenuItem[];
      };
      const extractedItems = data.items?.map(normalizeExtractedItem) ?? [];
      setText(
        data.extractedText ??
          data.cleanedText ??
          data.text ??
          data.rawText ??
          extractedItems.map((item) => `${item.name ?? ''} - ${item.price ?? 0}`).join('\n'),
      );
      setItems(extractedItems);
      setStep(2);
    } catch {
      toast.error('Extraction failed. You can paste text and parse manually.');
      setStep(1);
    } finally {
      setBusy(false);
    }
  }

  async function importItems() {
    if (!tenantId) return;
    const source = (items.length ? items : parsedItems).map(normalizeExtractedItem);
    if (!source.some((item) => item.category) && !defaultCategoryId) return;
    setBusy(true);
    try {
      if (source.some((item) => item.category)) {
        await menuExtractionService.importItems(tenantId, source);
      } else {
        await restaurantService.createItemsBulk(
          tenantId,
          source.map((item) => ({
            category_id: item.category_id ?? defaultCategoryId,
            name: item.name,
            description: item.description,
            price: Number(item.price ?? 0),
            is_veg: item.is_veg ?? true,
            is_available: true,
          })),
        );
      }
      setStep(3);
      toast.success('Menu imported');
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="container py-6 lg:py-8">
      <div className="mb-6">
        <h1 className="flex items-center gap-2 font-serif text-3xl font-bold tracking-tight">
          <Wand2 className="size-6 text-primary" />
          Menu OCR Workflow
        </h1>
        <p className="mt-1 text-sm text-muted-foreground">Upload a menu image or PDF, review extracted items, and import.</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-lg">{steps[step]}</CardTitle>
          <Progress value={progress} />
        </CardHeader>
        <CardContent className="space-y-5">
          <div className="grid grid-cols-4 gap-2">
            {steps.map((label, index) => (
              <div key={label} className="text-xs font-semibold text-muted-foreground">
                <span className={index <= step ? 'text-primary' : undefined}>{index + 1}. {label}</span>
              </div>
            ))}
          </div>

          {step === 0 && (
            <div className="grid place-items-center gap-4 rounded-xl border border-dashed border-border p-10 text-center">
              <UploadCloud className="size-12 text-muted-foreground" />
              <div>
                <Label htmlFor="menu-file" className="cursor-pointer">
                  <span className="rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground">Choose file</span>
                </Label>
                <input
                  id="menu-file"
                  type="file"
                  accept="image/*,application/pdf"
                  className="hidden"
                  onChange={(e) => setFile(e.target.files?.[0] ?? null)}
                />
              </div>
              {file && <p className="text-sm font-medium">{file.name}</p>}
              <Button disabled={!file} loading={busy} onClick={extract}>
                <FileUp className="size-4" /> Extract menu
              </Button>
            </div>
          )}

          {step === 1 && (
            <div className="space-y-3">
              <Alert>
                <AlertDescription>Paste OCR text or menu lines. Format like: Item name, price.</AlertDescription>
              </Alert>
              <Textarea className="min-h-72 font-mono text-xs" value={text} onChange={(e) => setText(e.target.value)} />
              <Button onClick={() => { setItems(parsedItems); setStep(2); }}>Parse text</Button>
            </div>
          )}

          {step === 2 && (
            <div className="space-y-3">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Item</TableHead>
                    <TableHead>Price</TableHead>
                    <TableHead>Type</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {(items.length ? items : parsedItems).map((item, index) => (
                    <TableRow key={`${item.name}-${index}`}>
                      <TableCell className="font-medium">{item.name}</TableCell>
                      <TableCell>{item.price ?? 0}</TableCell>
                      <TableCell>{(item.is_veg ?? item.isVeg) === false ? 'Non-veg' : 'Veg'}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
              <Button disabled={(!defaultCategoryId && !(items.length ? items : parsedItems).some((item) => item.category)) || (items.length ? items : parsedItems).length === 0} loading={busy} onClick={importItems}>
                Import reviewed items
              </Button>
            </div>
          )}

          {step === 3 && (
            <div className="grid place-items-center gap-3 p-10 text-center">
              <p className="font-serif text-2xl font-bold">Menu imported</p>
              <Button onClick={() => { setStep(0); setFile(null); setText(''); setItems([]); }}>Start another import</Button>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
