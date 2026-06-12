import { useState, useEffect, useRef } from 'react';
import QRCode from 'qrcode';
import { QrCode } from 'lucide-react';
import type { RestaurantTable } from '@/types';
import { useAuthStore } from '@/store/auth.store';
import { getCustomerOrderUrl } from '@/lib/customerOrderUrl';

interface QRCodeDisplayProps {
  table: RestaurantTable;
  size?: number;
  level?: 'L' | 'M' | 'Q' | 'H';
  includeMargin?: boolean;
}

export default function QRCodeDisplay({
  table,
  size = 80,
  level = 'H',
  includeMargin = true,
}: QRCodeDisplayProps) {
  const [loading, setLoading] = useState(true);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const authStore = useAuthStore();

  useEffect(() => {
    // Build the QR URL from the server-generated QR token.
    if ((table.qr_token || table.qrToken) && canvasRef.current) {
      const url = getCustomerOrderUrl(table, authStore.user?.tenant);
      
      // Generate QR code on canvas
      QRCode.toCanvas(canvasRef.current, url, {
        width: size,
        margin: includeMargin ? 1 : 0,
        color: {
          dark: '#000000',
          light: '#FFFFFF',
        },
        errorCorrectionLevel: level,
      }, (error: Error | null | undefined) => {
        if (error) {
          console.error('QR Code generation error:', error);
        }
        setLoading(false);
      });
    } else {
      setLoading(false);
    }
  }, [table, authStore.user?.tenant, size, level, includeMargin]);

  if (!(table.qr_token || table.qrToken)) {
    return (
      <div className={`grid place-items-center rounded border border-dashed border-border bg-muted/50`}
        style={{ width: size, height: size }}
      >
        <QrCode className="text-muted-foreground/50" style={{ width: size / 3, height: size / 3 }} />
      </div>
    );
  }

  return (
    <div className="flex justify-center">
      <canvas
        ref={canvasRef}
        className="rounded border border-border/50"
        style={{ 
          display: loading ? 'none' : 'block',
          width: size,
          height: size,
        }}
      />
      {loading && (
        <div className={`grid place-items-center rounded border border-dashed border-border bg-muted/50`}
          style={{ width: size, height: size }}
        >
          <QrCode className="text-muted-foreground/50" style={{ width: size / 3, height: size / 3 }} />
        </div>
      )}
    </div>
  );
}
