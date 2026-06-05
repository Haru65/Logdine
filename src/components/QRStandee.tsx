import { useEffect, useMemo, useRef, useState } from 'react';
import QRCode from 'qrcode';
import { Download, QrCode } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useAuthStore } from '@/store/auth.store';
import type { RestaurantTable } from '@/types';
import { getCustomerOrderUrl } from '@/lib/customerOrderUrl';

const ASSET_BASE = '/qr-design/images';
const CARD_BG = '#f0ede8';
const INK = '#111111';
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
      color: { dark: '#000000', light: CARD_BG },
      errorCorrectionLevel: 'H',
    }, (error) => {
      if (error) {
        reject(error);
        return;
      }
      resolve(canvas.toDataURL('image/png'));
    });
  });

function roundRect(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  width: number,
  height: number,
  radius: number,
) {
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
}

function drawCenteredText(
  ctx: CanvasRenderingContext2D,
  text: string,
  x: number,
  y: number,
  maxWidth: number,
) {
  ctx.textAlign = 'center';
  ctx.fillText(text, x, y, maxWidth);
}

function fitFont(
  ctx: CanvasRenderingContext2D,
  text: string,
  maxWidth: number,
  maxSize: number,
  minSize: number,
  weight = 900,
) {
  let size = maxSize;
  do {
    ctx.font = `${weight} ${size}px Arial`;
    if (ctx.measureText(text).width <= maxWidth) return size;
    size -= 2;
  } while (size >= minSize);
  return minSize;
}

function drawCornerBrackets(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number) {
  const len = 58;
  ctx.strokeStyle = ORANGE;
  ctx.lineWidth = 6;
  ctx.lineCap = 'square';
  [
    [[x, y + len], [x, y], [x + len, y]],
    [[x + w - len, y], [x + w, y], [x + w, y + len]],
    [[x, y + h - len], [x, y + h], [x + len, y + h]],
    [[x + w - len, y + h], [x + w, y + h], [x + w, y + h - len]],
  ].forEach(([a, b, c]) => {
    ctx.beginPath();
    ctx.moveTo(a[0], a[1]);
    ctx.lineTo(b[0], b[1]);
    ctx.lineTo(c[0], c[1]);
    ctx.stroke();
  });
}

export default function QRStandee({ table, className }: QRStandeeProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [qrDataUrl, setQrDataUrl] = useState('');
  const [downloading, setDownloading] = useState(false);
  const tenant = useAuthStore((state) => state.user?.tenant);
  const cafeName = tenant?.name || 'Your Cafe';

  const qrUrl = useMemo(() => getCustomerOrderUrl(table, tenant), [table, tenant]);

  useEffect(() => {
    let active = true;
    if (!qrUrl) {
      setQrDataUrl('');
      return;
    }

    createQrDataUrl(qrUrl)
      .then((url) => {
        if (active) setQrDataUrl(url);
      })
      .catch((error) => {
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
      const [cup, pizza, burger, cupBeans, scan, menu, placeOrder, arrow, heart, logdine, qr] =
        await Promise.all([
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
      canvas.width = 900;
      canvas.height = 1350;
      const ctx = canvas.getContext('2d');
      if (!ctx) return;

      ctx.clearRect(0, 0, canvas.width, canvas.height);
      ctx.fillStyle = '#1b120d';
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      roundRect(ctx, 38, 24, 824, 1302, 48);
      ctx.fillStyle = '#000';
      ctx.fill();

      roundRect(ctx, 58, 44, 784, 1192, 28);
      ctx.fillStyle = CARD_BG;
      ctx.fill();

      ctx.globalAlpha = 0.72;
      ctx.drawImage(cup, 72, 56, 150, 132);
      ctx.drawImage(pizza, 690, 52, 138, 132);
      ctx.drawImage(burger, 70, 650, 148, 108);
      ctx.drawImage(cupBeans, 682, 650, 138, 112);
      ctx.globalAlpha = 1;

      const brand = cafeName.trim().toUpperCase();
      ctx.fillStyle = INK;
      const brandSize = fitFont(ctx, brand, 480, 52, 28, 900);
      ctx.font = `900 ${brandSize}px Arial`;
      drawCenteredText(ctx, brand, 450, 138, 500);
      ctx.fillStyle = ORANGE;
      ctx.fillRect(342, 154, 216, 5);

      const scanBox = { x: 110, y: 220, w: 680, h: 166 };
      drawCornerBrackets(ctx, scanBox.x, scanBox.y, scanBox.w, scanBox.h);

      ctx.textAlign = 'center';
      ctx.font = '900 74px Arial';
      ctx.fillStyle = INK;
      ctx.fillText('SCAN TO', 386, 318);
      ctx.fillStyle = ORANGE;
      ctx.fillText('ORDER', 620, 318);

      ctx.fillStyle = CARD_BG;
      ctx.fillRect(184, 348, 532, 32);
      ctx.font = '500 19px Arial';
      ctx.fillStyle = '#222';
      drawCenteredText(ctx, 'DIGITAL MENU  •  FAST SERVICE  •  CONTACTLESS EXPERIENCE', 450, 372, 570);

      ctx.font = '900 30px Arial';
      ctx.fillStyle = INK;
      drawCenteredText(ctx, `TABLE ${table.table_number}`, 450, 434, 650);

      const qrBox = { x: 260, y: 470, w: 380, h: 380 };
      roundRect(ctx, qrBox.x, qrBox.y, qrBox.w, qrBox.h, 32);
      ctx.fillStyle = CARD_BG;
      ctx.fill();
      ctx.lineWidth = 12;
      ctx.strokeStyle = INK;
      ctx.stroke();
      ctx.drawImage(qr, qrBox.x + 28, qrBox.y + 28, qrBox.w - 56, qrBox.h - 56);

      ctx.strokeStyle = '#d8d2c8';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(124, 900);
      ctx.lineTo(776, 900);
      ctx.stroke();

      const stepY = 940;
      const stepXs = [234, 450, 666];
      const stepImgs = [scan, menu, placeOrder];
      const stepLabels = ['SCAN QR CODE', 'BROWSE MENU', 'PLACE ORDER'];
      ctx.font = '800 19px Arial';
      ctx.fillStyle = INK;
      stepXs.forEach((x, index) => {
        ctx.drawImage(stepImgs[index], x - 39, stepY, 78, 78);
        drawCenteredText(ctx, stepLabels[index], x, stepY + 120, 172);
        if (index < 2) ctx.drawImage(arrow, x + 86, stepY + 28, 34, 28);
      });

      const tagY = 1128;
      const tagParts = [
        { text: 'GOOD FOOD', x: 225 },
        { text: 'GOOD MOOD', x: 450 },
        { text: 'GREAT EXPERIENCE', x: 682 },
      ];
      ctx.font = '800 18px Arial';
      ctx.fillStyle = INK;
      tagParts.forEach(({ text, x }) => {
        ctx.drawImage(heart, x - 72, tagY - 18, 18, 18);
        drawCenteredText(ctx, text, x, tagY, 170);
      });
      ctx.drawImage(heart, 790, tagY - 18, 18, 18);

      ctx.fillStyle = '#000';
      roundRect(ctx, 58, 1208, 784, 108, 0);
      ctx.fill();
      ctx.font = '400 27px Arial';
      ctx.fillStyle = '#fff';
      ctx.textAlign = 'right';
      ctx.fillText('Powered By', 418, 1272);
      ctx.drawImage(logdine, 442, 1234, 214, 62);

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
      <div className="relative mx-auto aspect-[2/3] w-full max-w-[360px] overflow-hidden rounded-[22px] border-[6px] border-black bg-[#f0ede8] pt-5 text-center shadow-xl">
        <img src={getImageUrl('cup.png')} alt="" className="pointer-events-none absolute left-0 top-3 w-20 opacity-70" />
        <img src={getImageUrl('pizza.png')} alt="" className="pointer-events-none absolute right-0 top-2 w-24 opacity-70" />
        <img src={getImageUrl('burger.png')} alt="" className="pointer-events-none absolute bottom-[29%] left-0 w-20 opacity-70" />
        <img src={getImageUrl('cup-beans.png')} alt="" className="pointer-events-none absolute bottom-[29%] right-0 w-20 opacity-70" />

        <div className="relative z-10 mx-auto mt-1 max-w-[78%]">
          <p className="truncate text-xl font-black uppercase tracking-normal text-black">{cafeName}</p>
          <div className="mx-auto mt-1 h-0.5 w-24 bg-[#d95b28]" />
        </div>

        <div className="relative mx-4 mt-6 py-7">
          <span className="absolute left-0 top-0 size-7 rounded-tl-lg border-l-[3px] border-t-[3px] border-[#d95b28]" />
          <span className="absolute right-0 top-0 size-7 rounded-tr-lg border-r-[3px] border-t-[3px] border-[#d95b28]" />
          <span className="absolute bottom-0 left-0 size-7 rounded-bl-lg border-b-[3px] border-l-[3px] border-[#d95b28]" />
          <span className="absolute bottom-0 right-0 size-7 rounded-br-lg border-b-[3px] border-r-[3px] border-[#d95b28]" />
          <p className="text-[33px] font-black leading-none tracking-normal text-black">
            SCAN TO <span className="text-[#d95b28]">ORDER</span>
          </p>
          <p className="absolute -bottom-2 left-1/2 w-[88%] -translate-x-1/2 bg-[#f0ede8] px-1 text-[8px] font-medium tracking-normal text-[#222]">
            DIGITAL MENU <span className="text-[#d95b28]">•</span> FAST SERVICE <span className="text-[#d95b28]">•</span> CONTACTLESS EXPERIENCE
          </p>
        </div>

        <p className="mt-6 text-sm font-black uppercase tracking-normal text-black">Table {table.table_number}</p>

        <div className="mx-auto my-4 grid aspect-square w-[58%] place-items-center rounded-[24px] border-[7px] border-[#111] bg-[#f0ede8]">
          {qrDataUrl ? (
            <img src={qrDataUrl} alt={`QR code for table ${table.table_number}`} className="size-[88%]" />
          ) : (
            <QrCode className="size-14 text-muted-foreground" />
          )}
        </div>

        <div className="mx-3 grid grid-cols-3 gap-2 border-t border-[#ccc] pt-4 text-[9px] font-semibold text-black">
          <div className="relative">
            <img src={getImageUrl('scan.png')} alt="" className="mx-auto mb-2 size-10 object-contain" />
            SCAN QR CODE
            <img src={getImageUrl('arrow.png')} alt="" className="absolute -right-3 top-4 w-5" />
          </div>
          <div className="relative">
            <img src={getImageUrl('menu.png')} alt="" className="mx-auto mb-2 size-10 object-contain" />
            BROWSE MENU
            <img src={getImageUrl('arrow.png')} alt="" className="absolute -right-3 top-4 w-5" />
          </div>
          <div>
            <img src={getImageUrl('place-order.png')} alt="" className="mx-auto mb-2 size-10 object-contain" />
            PLACE ORDER
          </div>
        </div>

        <div className="mx-auto my-3 grid w-[86%] grid-cols-3 items-center gap-1 text-[8px] font-semibold text-black">
          <span><img src={getImageUrl('heart.png')} alt="" className="mr-1 inline size-2.5" />GOOD FOOD</span>
          <span><img src={getImageUrl('heart.png')} alt="" className="mr-1 inline size-2.5" />GOOD MOOD</span>
          <span><img src={getImageUrl('heart.png')} alt="" className="mr-1 inline size-2.5" />GREAT EXPERIENCE</span>
        </div>

        <div className="absolute inset-x-0 bottom-0 flex items-center justify-center gap-3 bg-black px-4 py-3 text-white">
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
