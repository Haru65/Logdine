import { restaurantService } from '@/services/restaurant.service';
import type { PaymentConfig, PaymentProvider } from '@/types';

export const paymentService = {
  getConfig: (tenantId: string, provider: PaymentProvider) =>
    restaurantService.getPaymentConfig(tenantId, provider),
  saveConfig: (tenantId: string, config: PaymentConfig) =>
    restaurantService.savePaymentConfig(tenantId, config),
  testGateway: (tenantId: string, config: PaymentConfig) =>
    restaurantService.validatePaymentConfig(tenantId, config),
};
