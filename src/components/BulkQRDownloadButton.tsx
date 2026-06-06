import { useState } from 'react';
import { Download } from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { downloadQrStandeeImage } from '@/components/QRStandee';
import { useAuthStore } from '@/store/auth.store';
import type { RestaurantTable } from '@/types';

interface BulkQRDownloadButtonProps {
  tables?: RestaurantTable[];
}

const wait = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

export default function BulkQRDownloadButton({ tables = [] }: BulkQRDownloadButtonProps) {
  const [downloading, setDownloading] = useState(false);
  const tenant = useAuthStore((state) => state.user?.tenant);
  const downloadableTables = tables.filter((table) => table.identifier);

  async function handleDownload() {
    if (!downloadableTables.length) {
      toast.error('No table QR codes available to download');
      return;
    }

    setDownloading(true);
    try {
      for (const table of downloadableTables) {
        await downloadQrStandeeImage(table, tenant);
        await wait(180);
      }
      toast.success(`Downloaded ${downloadableTables.length} QR standee${downloadableTables.length === 1 ? '' : 's'}`);
    } catch (error) {
      console.error('Bulk QR download failed:', error);
      toast.error('Bulk QR download failed');
    } finally {
      setDownloading(false);
    }
  }

  return (
    <Button
      type="button"
      className="gap-1.5"
      disabled={!downloadableTables.length}
      loading={downloading}
      onClick={handleDownload}
    >
      <Download className="size-4" /> Bulk QR Download
    </Button>
  );
}
