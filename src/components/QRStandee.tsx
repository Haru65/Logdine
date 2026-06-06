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

function binaryStringFromBase64(base64: string) {
  return atob(base64);
}

function downloadBlob(blob: Blob, fileName: string) {
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = fileName;
  link.click();
  URL.revokeObjectURL(url);
}

function createPdfFromJpegs(images: string[]) {
  const objects: string[] = [];
  const kids: number[] = [];

  objects.push('<< /Type /Catalog /Pages 2 0 R >>');
  objects.push('');

  images.forEach((imageData, index) => {
    const pageObj = objects.length + 1;
    const contentObj = pageObj + 1;
    const imageObj = pageObj + 2;
    kids.push(pageObj);

    const base64 = imageData.split(',')[1] || '';
    const jpg = binaryStringFromBase64(base64);
    const content = `q\n${STANDEE_WIDTH} 0 0 ${STANDEE_HEIGHT} 0 0 cm\n/Im${index} Do\nQ`;

    objects.push(
      `<< /Type /Page /Parent 2 0 R /MediaBox [0 0 ${STANDEE_WIDTH} ${STANDEE_HEIGHT}] /Resources << /XObject << /Im${index} ${imageObj} 0 R >> >> /Contents ${contentObj} 0 R >>`,
    );
    objects.push(`<< /Length ${content.length} >>\nstream\n${content}\nendstream`);
    objects.push(
      `<< /Type /XObject /Subtype /Image /Width ${STANDEE_WIDTH} /Height ${STANDEE_HEIGHT} /ColorSpace /DeviceRGB /BitsPerComponent 8 /Filter /DCTDecode /Length ${jpg.length} >>\nstream\n${jpg}\nendstream`,
    );
  });

  objects[1] = `<< /Type /Pages /Kids [${kids.map((kid) => `${kid} 0 R`).join(' ')}] /Count ${kids.length} >>`;

  let pdf = '%PDF-1.4\n';
  const offsets = [0];
  objects.forEach((object, index) => {
    offsets.push(pdf.length);
    pdf += `${index + 1} 0 obj\n${object}\nendobj\n`;
  });

  const xrefOffset = pdf.length;
  pdf += `xref\n0 ${objects.length + 1}\n`;
  pdf += '0000000000 65535 f \n';
  offsets.slice(1).forEach((offset) => {
    pdf += `${String(offset).padStart(10, '0')} 00000 n \n`;
  });
  pdf += `trailer\n<< /Size ${objects.length + 1} /Root 1 0 R >>\nstartxref\n${xrefOffset}\n%%EOF`;

  const bytes = new Uint8Array(pdf.length);
  for (let i = 0; i < pdf.length; i += 1) {
    bytes[i] = pdf.charCodeAt(i) & 0xff;
  }
  return new Blob([bytes], { type: 'application/pdf' });
}

export async function downloadQrStandeeImage(table: RestaurantTable, tenant?: Tenant) {
  const canvas = await createStandeeCanvas(table, tenant);
  if (!canvas) return;

  downloadBlob(
    await new Promise<Blob>((resolve) => canvas.toBlob((blob) => resolve(blob as Blob), 'image/png')),
    `table-${table.table_number}-qr-standee.png`,
  );
}

export async function downloadQrStandeePdf(tables: RestaurantTable[], tenant?: Tenant) {
  const images: string[] = [];

  for (const table of tables) {
    const canvas = await createStandeeCanvas(table, tenant);
    if (canvas) images.push(canvas.toDataURL('image/jpeg', 0.92));
  }

  if (!images.length) return false;

  downloadBlob(createPdfFromJpegs(images), 'table-qr-standees.pdf');
  return true;
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
