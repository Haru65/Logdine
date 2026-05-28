import { type ClassValue, clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

/** Tailwind-aware class merger. Used everywhere `className` gets composed. */
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/** Format a number as INR by default; pass `locale`/`currency` to change. */
export function formatCurrency(
  amount: number,
  { locale = 'en-IN', currency = 'INR' }: { locale?: string; currency?: string } = {},
) {
  return new Intl.NumberFormat(locale, {
    style: 'currency',
    currency,
    maximumFractionDigits: 2,
  }).format(amount || 0);
}

/** Compact number formatting — 1.2k, 3.4M, etc. */
export function formatCompact(n: number) {
  return new Intl.NumberFormat('en', { notation: 'compact', maximumFractionDigits: 1 }).format(n);
}

/** Friendly relative time ("2 min ago"). Falls back to formatted date for old timestamps. */
export function timeAgo(iso: string) {
  const date = new Date(iso);
  const diff = (Date.now() - date.getTime()) / 1000;
  const rtf = new Intl.RelativeTimeFormat('en', { numeric: 'auto' });

  const buckets: Array<[number, Intl.RelativeTimeFormatUnit]> = [
    [60, 'second'],
    [3600, 'minute'],
    [86_400, 'hour'],
    [604_800, 'day'],
    [2_629_800, 'week'],
    [31_557_600, 'month'],
    [Infinity, 'year'],
  ];

  let prev = 1;
  for (const [limit, unit] of buckets) {
    if (diff < limit) {
      const value = -Math.round(diff / prev);
      return rtf.format(value, unit);
    }
    prev = limit;
  }
  return date.toLocaleDateString();
}

/** Friendly long-form date like "Wed, 27 May 2026". */
export function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString('en-IN', {
    weekday: 'short',
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  });
}

/** Debounce — keeps the last invocation only. */
export function debounce<A extends unknown[]>(fn: (...args: A) => void, wait = 250) {
  let t: ReturnType<typeof setTimeout> | null = null;
  return (...args: A) => {
    if (t) clearTimeout(t);
    t = setTimeout(() => fn(...args), wait);
  };
}

/** Small UID generator for local cart items. Not cryptographically strong. */
export function uid(prefix = 'id') {
  return `${prefix}_${Math.random().toString(36).slice(2, 10)}${Date.now().toString(36).slice(-4)}`;
}
