import { restaurantService } from '@/services/restaurant.service';
import type { ComboOffer } from '@/types';

export const comboService = {
  getCombos: (tenantId: string) => restaurantService.getCombos(tenantId),
  createCombo: (tenantId: string, data: Partial<ComboOffer>) => restaurantService.createCombo(tenantId, data),
  updateCombo: (tenantId: string, comboId: string, data: Partial<ComboOffer>) =>
    restaurantService.updateCombo(tenantId, comboId, data),
  deleteCombo: (tenantId: string, comboId: string) => restaurantService.deleteCombo(tenantId, comboId),
};
