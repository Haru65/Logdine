import { restaurantService } from '@/services/restaurant.service';
import type { IntegrationConfig, IntegrationProvider } from '@/types';

export const integrationService = {
  getConfig: (tenantId: string, provider: IntegrationProvider) =>
    restaurantService.getIntegrationConfig(tenantId, provider),
  saveConfig: (tenantId: string, provider: IntegrationProvider, config: Partial<IntegrationConfig>) =>
    restaurantService.saveIntegrationConfig(tenantId, provider, config),
  testWebhook: async (_provider: IntegrationProvider, url?: string) => ({
    isValid: Boolean(url && /^https?:\/\//i.test(url)),
    message: url && /^https?:\/\//i.test(url) ? 'Webhook URL format looks valid.' : 'Enter a valid http or https URL.',
  }),
};
