import type { TaxConfig, TaxType } from '@/types';

export interface CalculatedTax extends TaxType {
  amount: number;
}

function toBoolean(value: unknown): boolean {
  if (typeof value === 'boolean') return value;
  if (typeof value === 'number') return value !== 0;
  return ['1', 'true', 't', 'yes', 'on', 'enabled'].includes(String(value ?? '').trim().toLowerCase());
}

export function normalizeTaxConfig(value: unknown): TaxConfig {
  if (!value || typeof value !== 'object' || Array.isArray(value)) {
    return { taxTypes: [], totalTaxTypes: 0, gstin: '' };
  }

  const config = value as Record<string, unknown>;
  const taxTypes = Array.isArray(config.taxTypes)
    ? config.taxTypes.flatMap((entry): TaxType[] => {
        if (!entry || typeof entry !== 'object' || Array.isArray(entry)) return [];
        const tax = entry as Record<string, unknown>;
        const percentage = Number(tax.percentage);
        const id = String(tax.id ?? '').trim();
        const name = String(tax.name ?? '').trim();
        if (!id || !name || !Number.isFinite(percentage) || percentage < 0 || percentage > 100) return [];

        return [{
          id,
          name,
          percentage: Math.round((percentage + Number.EPSILON) * 100) / 100,
          isActive: toBoolean(tax.isActive),
        }];
      })
    : [];

  return {
    taxTypes,
    totalTaxTypes: taxTypes.length,
    gstin: String(config.gstin ?? '').trim().toUpperCase(),
  };
}

export function roundCurrency(value: number): number {
  return Math.round((Number(value) + Number.EPSILON) * 100) / 100;
}

export function calculateTaxes(subtotal: number, config?: TaxConfig | null): CalculatedTax[] {
  if (!Number.isFinite(subtotal) || subtotal <= 0) return [];

  return (config?.taxTypes ?? [])
    .filter((tax) => tax.isActive && Number(tax.percentage) > 0)
    .map((tax) => ({
      ...tax,
      percentage: Number(tax.percentage),
      amount: roundCurrency((subtotal * Number(tax.percentage)) / 100),
    }));
}

export function totalTaxAmount(taxes: CalculatedTax[]): number {
  return roundCurrency(taxes.reduce((sum, tax) => sum + tax.amount, 0));
}
