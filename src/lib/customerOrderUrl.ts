import type { RestaurantTable, Tenant } from '@/types';

const trimSlash = (value: string) => value.replace(/\/+$/, '');

const slugFromQrUrl = (url?: string) => {
  if (!url) return '';
  try {
    const parsed = new URL(url);
    const parts = parsed.pathname.split('/').filter(Boolean);
    const markerIndex = parts.findIndex((part) => part === 'm' || part === 'order');
    return markerIndex >= 0 ? parts[markerIndex + 1] ?? '' : '';
  } catch {
    return '';
  }
};

export function getCustomerOrderUrl(table: RestaurantTable, tenant?: Tenant) {
  const qrToken = table.qr_token || table.qrToken;
  if (!qrToken) return '';

  const frontendUrl =
    import.meta.env.VITE_CUSTOMER_URL ||
    import.meta.env.VITE_FRONTEND_URL ||
    window.location.origin;

  const slug = tenant?.slug || slugFromQrUrl(table.qr_url || table.qr_code_url) || 'restaurant';

  return `${trimSlash(frontendUrl)}/m/${slug}/${qrToken}`;
}
