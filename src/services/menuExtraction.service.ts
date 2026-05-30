import { restaurantService } from '@/services/restaurant.service';
import type { MenuItem } from '@/types';

export interface ExtractedMenuItem extends Partial<MenuItem> {
  category?: string;
}

export const menuExtractionService = {
  extractTextFromImage: (tenantId: string, file: File) =>
    restaurantService.extractFromImage(tenantId, file),
  extractTextFromPDF: (tenantId: string, file: File) =>
    restaurantService.extractFromPDF(tenantId, file),
  extractAndImport: (tenantId: string, file: File) =>
    restaurantService.extractAndImport(tenantId, file),
  enrichItems: (tenantId: string, items: ExtractedMenuItem[]) =>
    restaurantService.enrichItems(tenantId, { items }),
  importItems: (tenantId: string, items: ExtractedMenuItem[]) =>
    restaurantService.importExtracted(tenantId, items),
  parseMenuText(text: string): ExtractedMenuItem[] {
    return text
      .split(/\r?\n/)
      .map((line) => line.trim())
      .filter(Boolean)
      .map((line) => {
        const match = line.match(/^(.*?)(?:,|\s+-\s+|\s+)(?:₹|Rs\.?)?\s*(\d+(?:\.\d{1,2})?)$/i);
        return {
          name: (match?.[1] ?? line).trim(),
          price: Number(match?.[2] ?? 0),
          is_veg: true,
          is_available: true,
        };
      })
      .filter((item) => item.name);
  },
};
