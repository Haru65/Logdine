import { useEffect, useMemo, useState } from 'react';
import QRCode from 'qrcode';
import { Download, QrCode } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useAuthStore } from '@/store/auth.store';
import type { RestaurantTable, Tenant } from '@/types';
import { getCustomerOrderUrl } from '@/lib/customerOrderUrl';

const ASSET_BASE = '/qr-design/images';
const CARD_BG = '#f0ede8';
const INK = '#111111';
const ORANGE = '#d95b28';
const STANDEE_WIDTH = 1200;
const STANDEE_HEIGHT = 1800;

interface QRStandeeProps {
  table: RestaurantTable;
  className?: string;
}

interface StandeeAssets {
  cup: HTMLImageElement;
  pizza: HTMLImageElement;
  burger: HTMLImageElement;
  cupBeans: HTMLImageElement;
  scan: HTMLImageElement;
  menu: HTMLImageElement;
  placeOrder: HTMLImageElement;
  arrow: HTMLImageElement;
  heart: HTMLImageElement;
  logdine: HTMLImageElement;
  qr: HTMLImageElement;
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
    QRCode.toCanvas(
      canvas,
      text,
      {
        width: 900,
        margin: 1,
        color: { dark: '#000000', light: CARD_BG },
        errorCorrectionLevel: 'H',
      },
      (error) => {
        if (error) {
          reject(error);
          return;
        }
        resolve(canvas.toDataURL('image/png'));
      },
    );
  });

async function loadStandeeAssets(qrDataUrl: string): Promise<StandeeAssets> {
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

  return { cup, pizza, burger, cupBeans, scan, menu, placeOrder, arrow, heart, logdine, qr };
}

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
  const len = 76;
  ctx.strokeStyle = ORANGE;
  ctx.lineWidth = 7;
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

function drawHeadline(ctx: CanvasRenderingContext2D, centerX: number, baseline: number) {
  let mainSize = 94;
  let toSize = 76;
  let gap = 24;
  let totalWidth = 0;

  do {
    ctx.font = `900 ${mainSize}px Arial`;
    const scanWidth = ctx.measureText('SCAN').width;
    const orderWidth = ctx.measureText('ORDER').width;
    ctx.font = `900 ${toSize}px Arial`;
    const toWidth = ctx.measureText('TO').width;
    totalWidth = scanWidth + orderWidth + toWidth + gap * 2;

    if (totalWidth <= 900) break;
    mainSize -= 2;
    toSize -= 2;
    gap = Math.max(16, gap - 1);
  } while (mainSize > 70);

  ctx.textAlign = 'left';
  ctx.textBaseline = 'alphabetic';

  let x = centerX - totalWidth / 2;
  ctx.font = `900 ${mainSize}px Arial`;
  ctx.fillStyle = INK;
  ctx.fillText('SCAN', x, baseline);
  x += ctx.measureText('SCAN').width + gap;

  ctx.font = `900 ${toSize}px Arial`;
  ctx.fillText('TO', x, baseline - 4);
  x += ctx.measureText('TO').width + gap;

  ctx.font = `900 ${mainSize}px Arial`;
  ctx.fillStyle = ORANGE;
  ctx.fillText('ORDER', x, baseline);
}

function drawStandeeCanvas(
  ctx: CanvasRenderingContext2D,
  table: RestaurantTable,
  cafeName: string,
  assets: StandeeAssets,
) {
  ctx.clearRect(0, 0, STANDEE_WIDTH, STANDEE_HEIGHT);

  ctx.fillStyle = '#1b120d';
  ctx.fillRect(0, 0, STANDEE_WIDTH, STANDEE_HEIGHT);

  roundRect(ctx, 52, 44, 1096, 1712, 66);
  ctx.fillStyle = '#000';
  ctx.fill();

  roundRect(ctx, 84, 76, 1032, 1520, 34);
  ctx.fillStyle = CARD_BG;
  ctx.fill();

  ctx.globalAlpha = 0.7;
  ctx.drawImage(assets.cup, 102, 92, 198, 174);
  ctx.drawImage(assets.pizza, 916, 88, 176, 168);
  ctx.drawImage(assets.burger, 98, 860, 188, 138);
  ctx.drawImage(assets.cupBeans, 908, 858, 172, 140);
  ctx.globalAlpha = 1;

  const brand = cafeName.trim().toUpperCase() || 'YOUR CAFE';
  ctx.fillStyle = INK;
  const brandSize = fitFont(ctx, brand, 720, 74, 40, 900);
  ctx.font = `900 ${brandSize}px Arial`;
  drawCenteredText(ctx, brand, 600, 186, 760);
  ctx.fillStyle = ORANGE;
  ctx.fillRect(462, 208, 276, 6);

  const scanBox = { x: 148, y: 298, w: 904, h: 228 };
  drawCornerBrackets(ctx, scanBox.x, scanBox.y, scanBox.w, scanBox.h);
  drawHeadline(ctx, 600, 430);

  ctx.font = '500 25px Arial';
  ctx.fillStyle = '#222';
  drawCenteredText(ctx, 'DIGITAL MENU - FAST SERVICE - CONTACTLESS EXPERIENCE', 600, 498, 780);

  ctx.font = '900 42px Arial';
  ctx.fillStyle = INK;
  drawCenteredText(ctx, `TABLE ${table.table_number}`, 600, 582, 850);

  const qrBox = { x: 360, y: 628, w: 480, h: 480 };
  roundRect(ctx, qrBox.x, qrBox.y, qrBox.w, qrBox.h, 40);
  ctx.fillStyle = CARD_BG;
  ctx.fill();
  ctx.lineWidth = 14;
  ctx.strokeStyle = INK;
  ctx.stroke();
  ctx.drawImage(assets.qr, qrBox.x + 38, qrBox.y + 38, qrBox.w - 76, qrBox.h - 76);

  ctx.strokeStyle = '#d8d2c8';
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(166, 1190);
  ctx.lineTo(1034, 1190);
  ctx.stroke();

  const stepY = 1240;
  const stepXs = [300, 600, 900];
  const stepImgs = [assets.scan, assets.menu, assets.placeOrder];
  const stepLabels = ['SCAN QR CODE', 'BROWSE MENU', 'PLACE ORDER'];
  ctx.font = '800 25px Arial';
  ctx.fillStyle = INK;
  stepXs.forEach((x, index) => {
    ctx.drawImage(stepImgs[index], x - 54, stepY, 108, 108);
    drawCenteredText(ctx, stepLabels[index], x, stepY + 158, 230);
    if (index < 2) ctx.drawImage(assets.arrow, x + 128, stepY + 40, 48, 38);
  });

  const tagY = 1492;
  const tagParts = [
    { text: 'GOOD FOOD', x: 300 },
    { text: 'GOOD MOOD', x: 600 },
    { text: 'GREAT EXPERIENCE', x: 900 },
  ];
  ctx.font = '800 25px Arial';
  ctx.fillStyle = INK;
  tagParts.forEach(({ text, x }) => {
    const textWidth = ctx.measureText(text).width;
    ctx.drawImage(assets.heart, x - textWidth / 2 - 34, tagY - 22, 24, 24);
    drawCenteredText(ctx, text, x, tagY, 260);
  });

  ctx.fillStyle = '#000';
  ctx.fillRect(84, 1596, 1032, 118);
  roundRect(ctx, 84, 1600, 1032, 116, 0);
  ctx.fill();
  ctx.font = '400 34px Arial';
  ctx.fillStyle = '#fff';
  ctx.textAlign = 'right';
  ctx.fillText('Powered By', 562, 1672);
  ctx.drawImage(assets.logdine, 594, 1628, 274, 80);
}

export async function downloadQrStandeeImage(table: RestaurantTable, tenant?: Tenant) {
  const cafeName = tenant?.name || 'Your Cafe';
  const qrUrl = getCustomerOrderUrl(table, tenant);
  if (!qrUrl) return;

  const qrDataUrl = await createQrDataUrl(qrUrl);
  const assets = await loadStandeeAssets(qrDataUrl);
  const canvas = document.createElement('canvas');
  canvas.width = STANDEE_WIDTH;
  canvas.height = STANDEE_HEIGHT;

  const ctx = canvas.getContext('2d');
  if (!ctx) return;

  drawStandeeCanvas(ctx, table, cafeName, assets);

  const link = document.createElement('a');
  link.href = canvas.toDataURL('image/png');
  link.download = `table-${table.table_number}-qr-standee.png`;
  link.click();
}

export default function QRStandee({ table, className }: QRStandeeProps) {
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
      await downloadQrStandeeImage(table, tenant);
    } finally {
      setDownloading(false);
    }
  }

  return (
    <div className={className}>
      <div className="relative mx-auto aspect-[2/3] w-full max-w-[360px] overflow-hidden rounded-[22px] border-[6px] border-black bg-[#f0ede8] pt-5 text-center shadow-xl">
        <img src={getImageUrl('cup.png')} alt="" className="pointer-events-none absolute left-0 top-3 w-20 opacity-70" />
        <img src={getImageUrl('pizza.png')} alt="" className="pointer-events-none absolute right-0 top-2 w-24 opacity-70" />
        <img src={getImageUrl('burger.png')} alt="" className="pointer-events-none absolute bottom-[30%] left-0 w-20 opacity-70" />
        <img src={getImageUrl('cup-beans.png')} alt="" className="pointer-events-none absolute bottom-[30%] right-0 w-20 opacity-70" />

        <div className="relative z-10 mx-auto mt-1 max-w-[80%]">
          <p className="truncate text-[22px] font-black uppercase leading-tight tracking-normal text-black">{cafeName}</p>
          <div className="mx-auto mt-1 h-0.5 w-24 bg-[#d95b28]" />
        </div>

        <div className="relative mx-4 mt-7 py-7">
          <span className="absolute left-0 top-0 size-7 rounded-tl-lg border-l-[3px] border-t-[3px] border-[#d95b28]" />
          <span className="absolute right-0 top-0 size-7 rounded-tr-lg border-r-[3px] border-t-[3px] border-[#d95b28]" />
          <span className="absolute bottom-0 left-0 size-7 rounded-bl-lg border-b-[3px] border-l-[3px] border-[#d95b28]" />
          <span className="absolute bottom-0 right-0 size-7 rounded-br-lg border-b-[3px] border-r-[3px] border-[#d95b28]" />
          <p className="flex items-baseline justify-center gap-1.5 text-[32px] font-black leading-none tracking-normal text-black">
            <span>SCAN</span>
            <span className="text-[24px]">TO</span>
            <span className="text-[#d95b28]">ORDER</span>
          </p>
          <p className="absolute -bottom-2 left-1/2 w-[90%] -translate-x-1/2 bg-[#f0ede8] px-1 text-[8px] font-medium tracking-normal text-[#222]">
            DIGITAL MENU - FAST SERVICE - CONTACTLESS EXPERIENCE
          </p>
        </div>

        <p className="mt-6 text-sm font-black uppercase tracking-normal text-black">Table {table.table_number}</p>

        <div className="mx-auto my-4 grid aspect-square w-[56%] place-items-center rounded-[24px] border-[7px] border-[#111] bg-[#f0ede8]">
          {qrDataUrl ? (
            <img src={qrDataUrl} alt={`QR code for table ${table.table_number}`} className="size-[86%]" />
          ) : (
            <QrCode className="size-14 text-muted-foreground" />
          )}
        </div>

        <div className="mx-4 grid grid-cols-3 gap-2 border-t border-[#ccc] pt-4 text-[9px] font-semibold text-black">
          <div className="relative min-w-0">
            <img src={getImageUrl('scan.png')} alt="" className="mx-auto mb-2 size-10 object-contain" />
            <span className="block leading-tight">SCAN QR CODE</span>
            <img src={getImageUrl('arrow.png')} alt="" className="absolute -right-3 top-4 w-5" />
          </div>
          <div className="relative min-w-0">
            <img src={getImageUrl('menu.png')} alt="" className="mx-auto mb-2 size-10 object-contain" />
            <span className="block leading-tight">BROWSE MENU</span>
            <img src={getImageUrl('arrow.png')} alt="" className="absolute -right-3 top-4 w-5" />
          </div>
          <div className="min-w-0">
            <img src={getImageUrl('place-order.png')} alt="" className="mx-auto mb-2 size-10 object-contain" />
            <span className="block leading-tight">PLACE ORDER</span>
          </div>
        </div>

        <div className="mx-auto my-3 grid w-[88%] grid-cols-3 items-center gap-1 text-[8px] font-semibold leading-tight text-black">
          <span><img src={getImageUrl('heart.png')} alt="" className="mr-1 inline size-2.5" />GOOD FOOD</span>
          <span><img src={getImageUrl('heart.png')} alt="" className="mr-1 inline size-2.5" />GOOD MOOD</span>
          <span><img src={getImageUrl('heart.png')} alt="" className="mr-1 inline size-2.5" />GREAT EXPERIENCE</span>
        </div>

        <div className="absolute inset-x-0 bottom-0 flex items-center justify-center gap-3 bg-black px-4 py-3 text-white">
          <span className="text-xs font-light uppercase">Powered By</span>
          <img src={getImageUrl('logdine.png')} alt="LogDine" className="h-6 w-auto" />
        </div>
      </div>

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
