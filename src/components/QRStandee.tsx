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
const STANDEE_WIDTH = 1000;
const STANDEE_HEIGHT = 1450;
const BULK_CARD_WIDTH_MM = 136.5;
const BULK_CARD_HEIGHT_MM = 194;
const BULK_CARD_SCALE = 12;
const BULK_CARD_WIDTH_PX = Math.round(BULK_CARD_WIDTH_MM * BULK_CARD_SCALE);
const BULK_CARD_HEIGHT_PX = Math.round(BULK_CARD_HEIGHT_MM * BULK_CARD_SCALE);
const BULK_CARD_POSITIONS = [
  { x: 8, y: 8 },
  { x: 152.5, y: 8 },
] as const;

interface QRStandeeProps {
  table: RestaurantTable;
  className?: string;
}

interface StandeeAssets {
  logo?: HTMLImageElement;
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

interface BulkStandeeAssets extends Omit<StandeeAssets, 'qr'> {
  logo: HTMLImageElement;
}

const getImageUrl = (name: string) => `${ASSET_BASE}/${name}`;

const sanitizeFileName = (value: string) =>
  value
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '') || 'restaurant';

const trimSlash = (value: string) => value.replace(/\/+$/, '');

const loadImage = (src: string) =>
  new Promise<HTMLImageElement>((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => resolve(img);
    img.onerror = reject;
    img.src = src;
  });

async function loadImageWithFallback(src: string | undefined, fallback: string) {
  if (src) {
    try {
      return await loadImage(src);
    } catch (error) {
      console.warn('Could not load QR standee logo, using default logo:', error);
    }
  }
  return loadImage(fallback);
}

const createQrDataUrl = (text: string) =>
  new Promise<string>((resolve, reject) => {
    const canvas = document.createElement('canvas');
    QRCode.toCanvas(
      canvas,
      text,
      {
        width: 820,
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

async function loadBulkStandeeAssets(restaurantLogo?: string): Promise<BulkStandeeAssets> {
  const [logo, cup, pizza, burger, cupBeans, scan, menu, placeOrder, arrow, heart, logdine] =
    await Promise.all([
      loadImageWithFallback(restaurantLogo, getImageUrl('logo.png')),
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
    ]);

  return { logo, cup, pizza, burger, cupBeans, scan, menu, placeOrder, arrow, heart, logdine };
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

function mm(value: number) {
  return value * BULK_CARD_SCALE;
}

function drawImageContain(
  ctx: CanvasRenderingContext2D,
  image: HTMLImageElement,
  x: number,
  y: number,
  width: number,
  height: number,
) {
  const imageRatio = image.naturalWidth / image.naturalHeight;
  const boxRatio = width / height;
  const drawWidth = imageRatio > boxRatio ? width : height * imageRatio;
  const drawHeight = imageRatio > boxRatio ? width / imageRatio : height;
  ctx.drawImage(image, x + (width - drawWidth) / 2, y + (height - drawHeight) / 2, drawWidth, drawHeight);
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

function drawHeadline(ctx: CanvasRenderingContext2D, centerX: number, baseline: number, maxWidth: number) {
  let mainSize = 76;
  let toSize = 62;
  const gap = 20;
  let widths = { scan: 0, to: 0, order: 0 };
  let totalWidth = 0;

  do {
    ctx.font = `900 ${mainSize}px Arial`;
    widths.scan = ctx.measureText('SCAN').width;
    widths.order = ctx.measureText('ORDER').width;
    ctx.font = `900 ${toSize}px Arial`;
    widths.to = ctx.measureText('TO').width;
    totalWidth = widths.scan + widths.to + widths.order + gap * 2;

    if (totalWidth <= maxWidth) break;
    mainSize -= 2;
    toSize -= 2;
  } while (mainSize >= 58);

  ctx.textAlign = 'left';
  ctx.textBaseline = 'alphabetic';

  let x = centerX - totalWidth / 2;
  ctx.font = `900 ${mainSize}px Arial`;
  ctx.fillStyle = INK;
  ctx.fillText('SCAN', x, baseline);
  x += widths.scan + gap;

  ctx.font = `900 ${toSize}px Arial`;
  ctx.fillText('TO', x, baseline - 3);
  x += widths.to + gap;

  ctx.font = `900 ${mainSize}px Arial`;
  ctx.fillStyle = ORANGE;
  ctx.fillText('ORDER', x, baseline);
}

function drawBulkHeadline(ctx: CanvasRenderingContext2D, centerX: number, baseline: number, maxWidth: number) {
  let mainSize = mm(10.5);
  let toSize = mm(9.2);
  const gap = mm(2.2);
  let widths = { scan: 0, to: 0, order: 0 };
  let totalWidth = 0;

  do {
    ctx.font = `900 ${mainSize}px Arial`;
    widths.scan = ctx.measureText('SCAN').width;
    widths.order = ctx.measureText('ORDER').width;
    ctx.font = `900 ${toSize}px Arial`;
    widths.to = ctx.measureText('TO').width;
    totalWidth = widths.scan + widths.to + widths.order + gap * 2;

    if (totalWidth <= maxWidth) break;
    mainSize -= mm(0.25);
    toSize -= mm(0.25);
  } while (mainSize >= mm(9));

  ctx.textAlign = 'left';
  ctx.textBaseline = 'alphabetic';

  let x = centerX - totalWidth / 2;
  ctx.font = `900 ${mainSize}px Arial`;
  ctx.fillStyle = INK;
  ctx.fillText('SCAN', x, baseline);
  x += widths.scan + gap;

  ctx.font = `900 ${toSize}px Arial`;
  ctx.fillText('TO', x, baseline - mm(0.4));
  x += widths.to + gap;

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

  roundRect(ctx, 28, 20, 944, 1398, 42);
  ctx.fillStyle = CARD_BG;
  ctx.fill();
  ctx.lineWidth = 16;
  ctx.strokeStyle = '#000';
  ctx.stroke();

  ctx.globalAlpha = 0.72;
  ctx.drawImage(assets.cup, 56, 42, 200, 176);
  ctx.drawImage(assets.pizza, 746, 36, 226, 214);
  ctx.drawImage(assets.burger, 68, 694, 160, 118);
  ctx.drawImage(assets.cupBeans, 778, 694, 148, 120);
  ctx.globalAlpha = 1;

  const brand = cafeName.trim().toUpperCase() || 'YOUR CAFE';
  ctx.fillStyle = INK;
  const brandSize = fitFont(ctx, brand, 600, 58, 34, 900);
  ctx.font = `900 ${brandSize}px Arial`;
  drawCenteredText(ctx, brand, 500, 120, 640);
  ctx.fillStyle = ORANGE;
  ctx.fillRect(390, 142, 220, 5);

  const scanBox = { x: 96, y: 210, w: 808, h: 172 };
  drawCornerBrackets(ctx, scanBox.x, scanBox.y, scanBox.w, scanBox.h);
  drawHeadline(ctx, 500, 310, 670);

  ctx.font = '500 19px Arial';
  ctx.fillStyle = '#222';
  drawCenteredText(ctx, 'DIGITAL MENU  -  FAST SERVICE  -  CONTACTLESS EXPERIENCE', 500, 360, 680);

  ctx.font = '900 30px Arial';
  ctx.fillStyle = INK;
  drawCenteredText(ctx, `TABLE ${table.table_number}`, 500, 420, 760);

  const qrBox = { x: 270, y: 455, w: 460, h: 460 };
  roundRect(ctx, qrBox.x, qrBox.y, qrBox.w, qrBox.h, 30);
  ctx.fillStyle = CARD_BG;
  ctx.fill();
  ctx.lineWidth = 10;
  ctx.strokeStyle = INK;
  ctx.stroke();
  ctx.drawImage(assets.qr, qrBox.x + 38, qrBox.y + 38, qrBox.w - 76, qrBox.h - 76);

  ctx.strokeStyle = '#d4cec4';
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(108, 990);
  ctx.lineTo(892, 990);
  ctx.stroke();

  const stepY = 1038;
  const stepXs = [252, 500, 748];
  const stepImgs = [assets.scan, assets.menu, assets.placeOrder];
  const stepLabels = ['SCAN QR CODE', 'BROWSE MENU', 'PLACE ORDER'];
  ctx.font = '800 18px Arial';
  ctx.fillStyle = INK;
  stepXs.forEach((x, index) => {
    ctx.drawImage(stepImgs[index], x - 42, stepY, 84, 84);
    drawCenteredText(ctx, stepLabels[index], x, stepY + 126, 190);
    if (index < 2) ctx.drawImage(assets.arrow, x + 92, stepY + 34, 36, 28);
  });

  const tagY = 1236;
  const tagParts = [
    { text: 'GOOD FOOD', x: 250 },
    { text: 'GOOD MOOD', x: 500 },
    { text: 'GREAT EXPERIENCE', x: 760 },
  ];
  ctx.font = '800 17px Arial';
  ctx.fillStyle = INK;
  tagParts.forEach(({ text, x }) => {
    const textWidth = ctx.measureText(text).width;
    ctx.drawImage(assets.heart, x - textWidth / 2 - 24, tagY - 17, 17, 17);
    drawCenteredText(ctx, text, x, tagY, 200);
  });
  ctx.drawImage(assets.heart, 910, tagY - 17, 17, 17);

  ctx.fillStyle = '#000';
  ctx.fillRect(36, 1296, 928, 114);
  ctx.font = '400 25px Arial';
  ctx.fillStyle = '#fff';
  ctx.textAlign = 'right';
  ctx.fillText('Powered By', 488, 1368);
  ctx.drawImage(assets.logdine, 520, 1330, 210, 62);
}

function drawBulkStandeeCanvas(
  ctx: CanvasRenderingContext2D,
  table: RestaurantTable,
  restaurantName: string,
  assets: BulkStandeeAssets,
  qr: HTMLImageElement,
) {
  const w = BULK_CARD_WIDTH_PX;
  const h = BULK_CARD_HEIGHT_PX;
  const centerX = w / 2;
  const tableLabel = table.table_number || table.name || table.identifier || 'Table';

  ctx.clearRect(0, 0, w, h);
  roundRect(ctx, mm(1), mm(1), w - mm(2), h - mm(2), mm(6));
  ctx.fillStyle = CARD_BG;
  ctx.fill();
  ctx.lineWidth = mm(2);
  ctx.strokeStyle = '#000';
  ctx.stroke();

  ctx.save();
  ctx.beginPath();
  roundRect(ctx, mm(2), mm(2), w - mm(4), h - mm(4), mm(4.5));
  ctx.clip();

  ctx.globalAlpha = 0.62;
  drawImageContain(ctx, assets.cup, mm(1), mm(3), mm(28), mm(24));
  drawImageContain(ctx, assets.pizza, w - mm(32), mm(2), mm(31), mm(28));
  drawImageContain(ctx, assets.burger, mm(1), mm(92), mm(25), mm(18));
  drawImageContain(ctx, assets.cupBeans, w - mm(27), mm(92), mm(24), mm(19));
  ctx.globalAlpha = 1;

  drawImageContain(ctx, assets.logo, centerX - mm(18), mm(5), mm(36), mm(18));
  ctx.fillStyle = INK;
  ctx.font = `900 ${mm(3.4)}px Arial`;
  ctx.textAlign = 'center';
  ctx.fillText(restaurantName.trim().toUpperCase() || 'RESTAURANT', centerX, mm(26), mm(96));

  const scanBox = { x: mm(12), y: mm(29), w: mm(112.5), h: mm(30) };
  drawCornerBrackets(ctx, scanBox.x, scanBox.y, scanBox.w, scanBox.h);
  drawBulkHeadline(ctx, centerX, mm(45.5), mm(108));

  ctx.fillStyle = '#222';
  ctx.font = `500 ${mm(2.8)}px Arial`;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'alphabetic';
  ctx.fillText('DIGITAL MENU  •  FAST SERVICE  •  CONTACTLESS EXPERIENCE', centerX, mm(54), mm(106));

  ctx.fillStyle = INK;
  ctx.font = `900 ${mm(5)}px Arial`;
  ctx.fillText(`TABLE ${tableLabel}`, centerX, mm(64), mm(112));

  const qrBox = { x: (w - mm(65)) / 2, y: mm(72), size: mm(65) };
  roundRect(ctx, qrBox.x, qrBox.y, qrBox.size, qrBox.size, mm(6));
  ctx.fillStyle = CARD_BG;
  ctx.fill();
  ctx.lineWidth = mm(2);
  ctx.strokeStyle = INK;
  ctx.stroke();
  drawImageContain(ctx, qr, qrBox.x + mm(2.5), qrBox.y + mm(2.5), mm(60), mm(60));

  ctx.strokeStyle = '#d4cec4';
  ctx.lineWidth = mm(0.25);
  ctx.beginPath();
  ctx.moveTo(mm(10), mm(145));
  ctx.lineTo(w - mm(10), mm(145));
  ctx.stroke();

  const stepY = mm(151);
  const stepCenters = [mm(30), centerX, w - mm(30)];
  const stepImgs = [assets.scan, assets.menu, assets.placeOrder];
  const stepLabels = ['SCAN QR CODE', 'BROWSE MENU', 'PLACE ORDER'];
  ctx.font = `800 ${mm(3)}px Arial`;
  ctx.fillStyle = INK;
  stepCenters.forEach((x, index) => {
    drawImageContain(ctx, stepImgs[index], x - mm(5), stepY, mm(10), mm(10));
    ctx.fillText(stepLabels[index], x, stepY + mm(16), mm(34));
    if (index < 2) {
      drawImageContain(ctx, assets.arrow, x + mm(17), stepY + mm(3.5), mm(7), mm(5));
    }
  });

  const taglineY = mm(175);
  const taglineParts = [
    { text: 'GOOD FOOD', x: mm(31) },
    { text: 'GOOD MOOD', x: centerX },
    { text: 'GREAT EXPERIENCE', x: w - mm(34) },
  ];
  ctx.font = `800 ${mm(2.9)}px Arial`;
  taglineParts.forEach(({ text, x }) => {
    const textWidth = ctx.measureText(text).width;
    drawImageContain(ctx, assets.heart, x - textWidth / 2 - mm(3.6), taglineY - mm(2.6), mm(2.8), mm(2.8));
    ctx.fillText(text, x, taglineY, mm(42));
  });
  drawImageContain(ctx, assets.heart, w - mm(8), taglineY - mm(2.6), mm(2.8), mm(2.8));

  ctx.fillStyle = '#000';
  ctx.fillRect(mm(2), h - mm(14), w - mm(4), mm(12));
  ctx.fillStyle = '#fff';
  ctx.font = `400 ${mm(3.2)}px Arial`;
  ctx.textAlign = 'right';
  ctx.fillText('Powered By', centerX - mm(3), h - mm(6.2), mm(32));
  drawImageContain(ctx, assets.logdine, centerX + mm(5), h - mm(11.2), mm(26), mm(7));

  ctx.restore();
}

async function createStandeeCanvas(table: RestaurantTable, tenant?: Tenant) {
  const cafeName = tenant?.name || 'Your Cafe';
  const qrUrl = getCustomerOrderUrl(table, tenant);
  if (!qrUrl) return null;

  const qrDataUrl = await createQrDataUrl(qrUrl);
  const assets = await loadStandeeAssets(qrDataUrl);
  const canvas = document.createElement('canvas');
  canvas.width = STANDEE_WIDTH;
  canvas.height = STANDEE_HEIGHT;

  const ctx = canvas.getContext('2d');
  if (!ctx) return null;

  drawStandeeCanvas(ctx, table, cafeName, assets);
  return canvas;
}

async function createBulkStandeeCanvas(
  table: RestaurantTable,
  restaurantName: string,
  assets: BulkStandeeAssets,
  baseUrl?: string,
) {
  if (!table.identifier) return null;

  const qrUrl = baseUrl
    ? `${trimSlash(baseUrl)}/${table.identifier}`
    : table.qr_url || table.qr_code_url || `${trimSlash(window.location.origin)}/m/restaurant/${table.identifier}`;
  const qrDataUrl = await createQrDataUrl(qrUrl);
  const qr = await loadImage(qrDataUrl);
  const canvas = document.createElement('canvas');
  canvas.width = BULK_CARD_WIDTH_PX;
  canvas.height = BULK_CARD_HEIGHT_PX;

  const ctx = canvas.getContext('2d');
  if (!ctx) return null;

  drawBulkStandeeCanvas(ctx, table, restaurantName, assets, qr);
  return canvas;
}

function getTenantCustomerBaseUrl(tenant?: Tenant) {
  if (!tenant?.slug) return undefined;
  const frontendUrl =
    import.meta.env.VITE_CUSTOMER_URL ||
    import.meta.env.VITE_FRONTEND_URL ||
    window.location.origin;
  return `${trimSlash(frontendUrl)}/m/${tenant.slug}`;
}

function downloadBlob(blob: Blob, fileName: string) {
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = fileName;
  link.click();
  URL.revokeObjectURL(url);
}

export async function downloadQrStandeeImage(table: RestaurantTable, tenant?: Tenant) {
  const canvas = await createStandeeCanvas(table, tenant);
  if (!canvas) return;

  downloadBlob(
    await new Promise<Blob>((resolve) => canvas.toBlob((blob) => resolve(blob as Blob), 'image/png')),
    `table-${table.table_number}-qr-standee.png`,
  );
}

export async function createBulkQRPDF(
  tables: RestaurantTable[],
  restaurantName = 'restaurant',
  restaurantLogo?: string,
  baseUrl?: string,
) {
  const printableTables = tables.filter((table) => table.identifier);
  if (!printableTables.length) return false;

  const { default: jsPDF } = await import('jspdf');
  const pdf = new jsPDF({
    orientation: 'landscape',
    unit: 'mm',
    format: 'a4',
  });
  const assets = await loadBulkStandeeAssets(restaurantLogo);
  let rendered = 0;

  for (const table of printableTables) {
    const canvas = await createBulkStandeeCanvas(table, restaurantName, assets, baseUrl);
    if (!canvas) continue;

    if (rendered > 0 && rendered % 2 === 0) {
      pdf.addPage('a4', 'landscape');
    }

    const position = BULK_CARD_POSITIONS[rendered % 2];
    pdf.addImage(
      canvas.toDataURL('image/jpeg', 0.94),
      'JPEG',
      position.x,
      position.y,
      BULK_CARD_WIDTH_MM,
      BULK_CARD_HEIGHT_MM,
      undefined,
      'FAST',
    );
    rendered += 1;
  }

  if (!rendered) return false;

  pdf.save(`${sanitizeFileName(restaurantName)}-bulk-qr-standees.pdf`);
  return true;
}

export async function downloadQrStandeePdf(tables: RestaurantTable[], tenant?: Tenant) {
  return createBulkQRPDF(
    tables,
    tenant?.name || 'restaurant',
    tenant?.logo_url || tenant?.logoUrl || tenant?.logo,
    getTenantCustomerBaseUrl(tenant),
  );
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
      <div className="relative mx-auto aspect-[1000/1450] w-full max-w-[360px] overflow-hidden rounded-[22px] border-[6px] border-black bg-[#f0ede8] pt-5 text-center shadow-xl">
        <img src={getImageUrl('cup.png')} alt="" className="pointer-events-none absolute left-1 top-3 w-20 opacity-70" />
        <img src={getImageUrl('pizza.png')} alt="" className="pointer-events-none absolute right-0 top-2 w-24 opacity-70" />
        <img src={getImageUrl('burger.png')} alt="" className="pointer-events-none absolute bottom-[42%] left-1 w-16 opacity-70" />
        <img src={getImageUrl('cup-beans.png')} alt="" className="pointer-events-none absolute bottom-[42%] right-2 w-16 opacity-70" />

        <div className="relative z-10 mx-auto mt-1 max-w-[72%]">
          <p className="truncate text-[22px] font-black uppercase leading-tight tracking-normal text-black">{cafeName}</p>
          <div className="mx-auto mt-1 h-0.5 w-24 bg-[#d95b28]" />
        </div>

        <div className="relative mx-5 mt-7 py-6">
          <span className="absolute left-0 top-0 size-7 rounded-tl-lg border-l-[3px] border-t-[3px] border-[#d95b28]" />
          <span className="absolute right-0 top-0 size-7 rounded-tr-lg border-r-[3px] border-t-[3px] border-[#d95b28]" />
          <span className="absolute bottom-0 left-0 size-7 rounded-bl-lg border-b-[3px] border-l-[3px] border-[#d95b28]" />
          <span className="absolute bottom-0 right-0 size-7 rounded-br-lg border-b-[3px] border-r-[3px] border-[#d95b28]" />
          <p className="flex items-baseline justify-center gap-1.5 text-[29px] font-black leading-none tracking-normal text-black">
            <span>SCAN</span>
            <span className="text-[23px]">TO</span>
            <span className="text-[#d95b28]">ORDER</span>
          </p>
          <p className="absolute -bottom-2 left-1/2 w-[92%] -translate-x-1/2 bg-[#f0ede8] px-1 text-[8px] font-medium tracking-normal text-[#222]">
            DIGITAL MENU - FAST SERVICE - CONTACTLESS EXPERIENCE
          </p>
        </div>

        <p className="mt-5 text-sm font-black uppercase tracking-normal text-black">Table {table.table_number}</p>

        <div className="mx-auto my-3 grid aspect-square w-[50%] place-items-center rounded-[22px] border-[6px] border-[#111] bg-[#f0ede8]">
          {qrDataUrl ? (
            <img src={qrDataUrl} alt={`QR code for table ${table.table_number}`} className="size-[84%]" />
          ) : (
            <QrCode className="size-14 text-muted-foreground" />
          )}
        </div>

        <div className="mx-5 grid grid-cols-3 gap-2 border-t border-[#ccc] pt-4 text-[8px] font-semibold text-black">
          <div className="relative min-w-0">
            <img src={getImageUrl('scan.png')} alt="" className="mx-auto mb-2 size-9 object-contain" />
            <span className="block leading-tight">SCAN QR CODE</span>
            <img src={getImageUrl('arrow.png')} alt="" className="absolute -right-3 top-4 w-5" />
          </div>
          <div className="relative min-w-0">
            <img src={getImageUrl('menu.png')} alt="" className="mx-auto mb-2 size-9 object-contain" />
            <span className="block leading-tight">BROWSE MENU</span>
            <img src={getImageUrl('arrow.png')} alt="" className="absolute -right-3 top-4 w-5" />
          </div>
          <div className="min-w-0">
            <img src={getImageUrl('place-order.png')} alt="" className="mx-auto mb-2 size-9 object-contain" />
            <span className="block leading-tight">PLACE ORDER</span>
          </div>
        </div>

        <div className="mx-auto my-3 grid w-[88%] grid-cols-3 items-center gap-1 text-[7px] font-semibold leading-tight text-black">
          <span><img src={getImageUrl('heart.png')} alt="" className="mr-1 inline size-2" />GOOD FOOD</span>
          <span><img src={getImageUrl('heart.png')} alt="" className="mr-1 inline size-2" />GOOD MOOD</span>
          <span><img src={getImageUrl('heart.png')} alt="" className="mr-1 inline size-2" />GREAT EXPERIENCE</span>
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
