import { useEffect, useMemo, useRef, useState } from 'react';
import QRCode from 'qrcode';
import { Download, QrCode } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useAuthStore } from '@/store/auth.store';
import type { RestaurantTable } from '@/types';

const ASSET_BASE = '/qr-design/images';
const CARD_BG = '#f0ede8';
const ORANGE = '#d95b28';

interface QRStandeeProps {
  table: RestaurantTable;
  className?: string;
}

const getImageUrl = (name: string) => `${ASSET_BASE}/${name}`;

const loadImage = (src: string) =>
  new Promise<HTMLImageElement>((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => resolve(img);
    img.onerror = reject;
    img.src = src;
  });

const createQrDataUrl = (text: string) =>
  new Promise<string>((resolve, reject) => {
    const canvas = document.createElement('canvas');
    QRCode.toCanvas(canvas, text, {
      width: 720,
      margin: 1,
      color: {
        dark: '#000000',
        light: CARD_BG,
      },
      errorCorrectionLevel: 'H',
    }, (error) => {
      if (error) {
        reject(error);
        return;
      }
      resolve(canvas.toDataURL('image/png'));
    });
  });

const drawRoundRect = (
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  width: number,
  height: number,
  radius: number,
) => {
  ctx.beginPath();
  ctx.moveTo(x + radius, y);
  ctx.lineTo(x + width - radius, y);
  ctx.quadraticCurveTo(x + width, y, x + width, y + radius);
  ctx.lineTo(x + width, y + height - radius);
  ctx.quadraticCurveTo(x + width, y + height, x + width - radius, y + height);
  ctx.lineTo(x + radius, y + height);
  ctx.quadraticCurveTo(x, y + height, x, y + height - radius);
  ctx.lineTo(x, y + radius);
  ctx.quadraticCurveTo(x, y, x + radius, y);
  ctx.closePath();
};

const drawCenteredText = (
  ctx: CanvasRenderingContext2D,
  text: string,
  x: number,
  y: number,
  maxWidth: number,
) => {
  ctx.textAlign = 'center';
  ctx.fillText(text, x, y, maxWidth);
};

export default function QRStandee({ table, className }: QRStandeeProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [qrDataUrl, setQrDataUrl] = useState('');
  const [downloading, setDownloading] = useState(false);
  const tenant = useAuthStore((state) => state.user?.tenant);

  const qrUrl = useMemo(() => {
    if (table.qr_url || table.qr_code_url) return table.qr_url || table.qr_code_url || '';
    const frontendUrl = import.meta.env.VITE_FRONTEND_URL || window.location.origin;
    const slug = tenant?.slug || 'restaurant';
    return table.identifier ? `${frontendUrl}/order/${slug}/${table.identifier}` : '';
  }, [table.identifier, table.qr_code_url, table.qr_url, tenant?.slug]);

  useEffect(() => {
    let active = true;
    if (!qrUrl) {
      setQrDataUrl('');
      return;
    }

    createQrDataUrl(qrUrl).then((url) => {
      if (active) setQrDataUrl(url);
    }).catch((error) => {
      console.error('QR standee generation error:', error);
      if (active) setQrDataUrl('');
    });

    return () => {
      active = false;
    };
  }, [qrUrl]);

  async function downloadStandee() {
    if (!qrDataUrl) return;
    setDownloading(true);

    try {
      const [logo, cup, pizza, burger, cupBeans, scan, menu, placeOrder, arrow, heart, logdine, qr] =
        await Promise.all([
          loadImage(getImageUrl('logo.png')),
          loadImage(getImageUrl('cup.png')),
          loadImage(getImageUrl('pizza.png')),
          loadImage(getImageUrl('burger.png')),
          loadImage(getImageUrl('cup-beans.png')),
          loadImage(getImageUrl('scan.png')),
          loadImage(getImageUrl('menu.png')),
          loadImage(getImageUrl('place-order.png')),
          loadImage(getImageUrl('arrow.png')),
          loadImage(getImageUrl('heart.png')),
          loadImage(getImageUrl('logdine.png')),
          loadImage(qrDataUrl),
        ]);

      const canvas = canvasRef.current || document.createElement('canvas');
      canvas.width = 1200;
      canvas.height = 1800;
      const ctx = canvas.getContext('2d');
      if (!ctx) return;

      ctx.clearRect(0, 0, canvas.width, canvas.height);
      ctx.fillStyle = '#1b120d';
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      const card = { x: 120, y: 70, w: 960, h: 1660, r: 54 };
      drawRoundRect(ctx, card.x, card.y, card.w, card.h, card.r);
      ctx.fillStyle = CARD_BG;
      ctx.fill();
      ctx.lineWidth = 22;
      ctx.strokeStyle = '#000';
      ctx.stroke();

      ctx.drawImage(cup, card.x + 10, card.y + 28, 210, 190);
      ctx.drawImage(pizza, card.x + card.w - 260, card.y + 25, 245, 225);
      ctx.drawImage(burger, card.x + 8, card.y + 645, 190, 150);
      ctx.drawImage(cupBeans, card.x + card.w - 205, card.y + 645, 180, 155);

      ctx.drawImage(logo, card.x + 300, card.y + 35, 360, 150);

      const scanBox = { x: card.x + 90, y: card.y + 230, w: card.w - 180, h: 210 };
      ctx.strokeStyle = ORANGE;
      ctx.lineWidth = 8;
      const corner = 80;
      const r = 18;
      [
        [scanBox.x, scanBox.y, corner, corner, 'tl'],
        [scanBox.x + scanBox.w - corner, scanBox.y, corner, corner, 'tr'],
        [scanBox.x, scanBox.y + scanBox.h - corner, corner, corner, 'bl'],
        [scanBox.x + scanBox.w - corner, scanBox.y + scanBox.h - corner, corner, corner, 'br'],
      ].forEach(([x, y, w, h, pos]) => {
        ctx.beginPath();
        if (pos === 'tl') {
          ctx.moveTo(Number(x) + r, Number(y));
          ctx.lineTo(Number(x) + Number(w), Number(y));
          ctx.moveTo(Number(x), Number(y) + r);
          ctx.lineTo(Number(x), Number(y) + Number(h));
        } else if (pos === 'tr') {
          ctx.moveTo(Number(x), Number(y));
          ctx.lineTo(Number(x) + Number(w) - r, Number(y));
          ctx.moveTo(Number(x) + Number(w), Number(y) + r);
          ctx.lineTo(Number(x) + Number(w), Number(y) + Number(h));
        } else if (pos === 'bl') {
          ctx.moveTo(Number(x), Number(y));
          ctx.lineTo(Number(x), Number(y) + Number(h) - r);
          ctx.moveTo(Number(x) + r, Number(y) + Number(h));
          ctx.lineTo(Number(x) + Number(w), Number(y) + Number(h));
        } else {
          ctx.moveTo(Number(x) + Number(w), Number(y));
          ctx.lineTo(Number(x) + Number(w), Number(y) + Number(h) - r);
          ctx.moveTo(Number(x), Number(y) + Number(h));
          ctx.lineTo(Number(x) + Number(w) - r, Number(y) + Number(h));
        }
        ctx.stroke();
      });

      ctx.font = '900 92px Arial';
      ctx.fillStyle = '#111';
      ctx.textAlign = 'center';
      ctx.fillText('SCAN TO ', card.x + card.w / 2 - 95, scanBox.y + 118);
      ctx.fillStyle = ORANGE;
      ctx.fillText('ORDER', card.x + card.w / 2 + 245, scanBox.y + 118);

      ctx.fillStyle = CARD_BG;
      ctx.fillRect(scanBox.x + 55, scanBox.y + 160, 670, 50);
      ctx.font = '500 26px Arial';
      ctx.fillStyle = '#222';
      drawCenteredText(
        ctx,
        'DIGITAL MENU  •  FAST SERVICE  •  CONTACTLESS EXPERIENCE',
        card.x + card.w / 2,
        scanBox.y + 194,
        720,
      );

      ctx.font = '800 38px Arial';
      ctx.fillStyle = '#111';
      drawCenteredText(ctx, `TABLE ${table.table_number}`, card.x + card.w / 2, card.y + 510, 760);

      const qrBox = { x: card.x + 230, y: card.y + 555, w: 500, h: 500 };
      drawRoundRect(ctx, qrBox.x, qrBox.y, qrBox.w, qrBox.h, 48);
      ctx.fillStyle = CARD_BG;
      ctx.fill();
      ctx.lineWidth = 18;
      ctx.strokeStyle = '#111';
      ctx.stroke();
      ctx.drawImage(qr, qrBox.x + 40, qrBox.y + 40, qrBox.w - 80, qrBox.h - 80);

      ctx.strokeStyle = '#ccc';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(card.x + 40, card.y + 1120);
      ctx.lineTo(card.x + card.w - 40, card.y + 1120);
      ctx.stroke();

      const stepY = card.y + 1180;
      const stepXs = [card.x + 220, card.x + 480, card.x + 740];
      const stepImgs = [scan, menu, placeOrder];
      const stepTexts = ['SCAN QR CODE', 'BROWSE MENU', 'PLACE ORDER'];
      ctx.font = '700 27px Arial';
      ctx.fillStyle = '#111';
      stepXs.forEach((x, index) => {
        ctx.drawImage(stepImgs[index], x - 50, stepY, 100, 100);
        drawCenteredText(ctx, stepTexts[index], x, stepY + 150, 230);
        if (index < 2) ctx.drawImage(arrow, x + 115, stepY + 30, 50, 42);
      });

      const tagY = card.y + 1435;
      ctx.font = '600 27px Arial';
      ctx.fillStyle = '#111';
      const tagParts = ['GOOD FOOD', 'GOOD MOOD', 'GREAT EXPERIENCE'];
      let cursor = card.x + 165;
      tagParts.forEach((part, index) => {
        ctx.drawImage(heart, cursor - 42, tagY - 25, 24, 24);
        ctx.fillText(part, cursor, tagY);
        cursor += index === 2 ? 0 : 255;
      });
      ctx.drawImage(heart, card.x + card.w - 112, tagY - 25, 24, 24);

      ctx.fillStyle = '#000';
      ctx.fillRect(card.x + 11, card.y + card.h - 130, card.w - 22, 118);
      ctx.font = '400 38px Arial';
      ctx.fillStyle = '#fff';
      ctx.fillText('Powered By', card.x + 360, card.y + card.h - 58);
      ctx.drawImage(logdine, card.x + 575, card.y + card.h - 105, 250, 72);

      const link = document.createElement('a');
      link.href = canvas.toDataURL('image/png');
      link.download = `table-${table.table_number}-qr-standee.png`;
      link.click();
    } finally {
      setDownloading(false);
    }
  }

  return (
    <div className={className}>
      <div className="relative mx-auto w-full max-w-[360px] overflow-hidden rounded-[22px] border-[6px] border-black bg-[#f0ede8] pt-5 text-center shadow-xl">
        <img src={getImageUrl('cup.png')} alt="" className="pointer-events-none absolute left-0 top-4 w-20 opacity-80" />
        <img src={getImageUrl('pizza.png')} alt="" className="pointer-events-none absolute right-0 top-3 w-24 opacity-80" />
        <img src={getImageUrl('burger.png')} alt="" className="pointer-events-none absolute bottom-40 left-0 w-20 opacity-80" />
        <img src={getImageUrl('cup-beans.png')} alt="" className="pointer-events-none absolute bottom-40 right-0 w-20 opacity-80" />

        <img src={getImageUrl('logo.png')} alt="Restaurant logo" className="relative z-10 mx-auto w-36 -rotate-1" />

        <div className="relative mx-4 mt-4 py-7">
          <span className="absolute left-0 top-0 size-7 rounded-tl-lg border-l-[3px] border-t-[3px] border-[#d95b28]" />
          <span className="absolute right-0 top-0 size-7 rounded-tr-lg border-r-[3px] border-t-[3px] border-[#d95b28]" />
          <span className="absolute bottom-0 left-0 size-7 rounded-bl-lg border-b-[3px] border-l-[3px] border-[#d95b28]" />
          <span className="absolute bottom-0 right-0 size-7 rounded-br-lg border-b-[3px] border-r-[3px] border-[#d95b28]" />
          <p className="text-[34px] font-black leading-none tracking-normal text-black">
            SCAN TO <span className="text-[#d95b28]">ORDER</span>
          </p>
          <p className="absolute -bottom-2 left-3 bg-[#f0ede8] px-1 text-[9px] font-medium tracking-normal text-[#222]">
            DIGITAL MENU <span className="text-[#d95b28]">•</span> FAST SERVICE <span className="text-[#d95b28]">•</span> CONTACTLESS EXPERIENCE
          </p>
        </div>

        <p className="mt-6 text-sm font-black uppercase tracking-normal text-black">Table {table.table_number}</p>

        <div className="mx-auto my-5 grid aspect-square w-[62%] place-items-center rounded-[24px] border-[8px] border-[#111] bg-[#f0ede8]">
          {qrDataUrl ? (
            <img src={qrDataUrl} alt={`QR code for table ${table.table_number}`} className="size-[88%]" />
          ) : (
            <QrCode className="size-14 text-muted-foreground" />
          )}
        </div>

        <div className="mx-3 grid grid-cols-3 gap-2 border-t border-[#ccc] pt-4 text-[10px] font-semibold text-black">
          <div className="relative">
            <img src={getImageUrl('scan.png')} alt="" className="mx-auto mb-2 size-11 object-contain" />
            SCAN QR CODE
            <img src={getImageUrl('arrow.png')} alt="" className="absolute -right-3 top-4 w-5" />
          </div>
          <div className="relative">
            <img src={getImageUrl('menu.png')} alt="" className="mx-auto mb-2 size-11 object-contain" />
            BROWSE MENU
            <img src={getImageUrl('arrow.png')} alt="" className="absolute -right-3 top-4 w-5" />
          </div>
          <div>
            <img src={getImageUrl('place-order.png')} alt="" className="mx-auto mb-2 size-11 object-contain" />
            PLACE ORDER
          </div>
        </div>

        <div className="mx-auto my-4 flex items-center justify-center gap-1 text-[9px] font-semibold text-black">
          <img src={getImageUrl('heart.png')} alt="" className="size-3" />
          GOOD FOOD
          <img src={getImageUrl('heart.png')} alt="" className="size-3" />
          GOOD MOOD
          <img src={getImageUrl('heart.png')} alt="" className="size-3" />
          GREAT EXPERIENCE
          <img src={getImageUrl('heart.png')} alt="" className="size-3" />
        </div>

        <div className="flex items-center justify-center gap-3 bg-black px-4 py-3 text-white">
          <span className="text-xs font-light uppercase">Powered By</span>
          <img src={getImageUrl('logdine.png')} alt="LogDine" className="h-6 w-auto" />
        </div>
      </div>

      <canvas ref={canvasRef} className="hidden" />

      <Button
        type="button"
        variant="outline"
        size="sm"
        className="mt-3 w-full gap-1.5"
        disabled={!qrDataUrl}
        loading={downloading}
        onClick={downloadStandee}
      >
        <Download className="size-3.5" /> Download QR Standee
      </Button>
    </div>
  );
}
