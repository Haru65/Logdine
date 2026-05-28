/**
 * Endpoint builder. Keeps URL shapes in one place so a backend rename is a
 * one-line change. All helpers are pure string functions; no side effects.
 */
export const endpoints = {
  auth: {
    login: '/auth/login',
    me: '/auth/me',
  },
  superadmin: {
    tenants: '/admin/superadmin/tenants',
    tenant: (id: string) => `/admin/superadmin/tenants/${id}`,
    pause: (id: string) => `/admin/superadmin/tenants/${id}/pause`,
    resume: (id: string) => `/admin/superadmin/tenants/${id}/resume`,
    metrics: '/admin/superadmin/dashboard/metrics',
  },
  restaurant: (tenantId: string) => ({
    info: `/admin/restaurant/${tenantId}/info`,
    dashboardMetrics: `/admin/restaurant/${tenantId}/dashboard/metrics`,

    tables: `/admin/restaurant/${tenantId}/tables`,
    tablesBulk: `/admin/restaurant/${tenantId}/tables/bulk`,
    table: (tableId: string) => `/admin/restaurant/${tenantId}/tables/${tableId}`,

    categories: `/admin/restaurant/${tenantId}/menu/categories`,
    category: (id: string) => `/admin/restaurant/${tenantId}/menu/categories/${id}`,

    items: `/admin/restaurant/${tenantId}/menu/items`,
    allItems: `/admin/restaurant/${tenantId}/menu/items`,
    item: (id: string) => `/admin/restaurant/${tenantId}/menu/items/${id}`,
    itemsBulk: `/admin/restaurant/${tenantId}/menu/items/bulk`,
    itemImage: (id: string) => `/admin/restaurant/${tenantId}/menu/items/${id}/upload-image`,
    itemAutoImage: (id: string) =>
      `/admin/restaurant/${tenantId}/menu/items/${id}/auto-update-image`,
    bulkUpdateImages: `/admin/restaurant/${tenantId}/menu/bulk-update-images`,

    itemAddons: (id: string) => `/admin/restaurant/${tenantId}/menu/items/${id}/addons`,
    itemAddon: (id: string, addonId: string) =>
      `/admin/restaurant/${tenantId}/menu/items/${id}/addons/${addonId}`,

    itemVariants: (id: string) => `/admin/restaurant/${tenantId}/menu/items/${id}/variants`,
    itemVariant: (id: string, variantId: string) =>
      `/admin/restaurant/${tenantId}/menu/items/${id}/variants/${variantId}`,

    orders: `/admin/restaurant/${tenantId}/orders`,
    order: (id: string) => `/admin/restaurant/${tenantId}/orders/${id}`,
    orderItem: (orderId: string, itemId: string) =>
      `/admin/restaurant/${tenantId}/orders/${orderId}/items/${itemId}`,

    revenueReport: `/admin/restaurant/${tenantId}/reports/revenue`,
    ordersReport: `/admin/restaurant/${tenantId}/reports/orders`,
    productsReport: `/admin/restaurant/${tenantId}/reports/products`,
    summaryReport: `/admin/restaurant/${tenantId}/reports/summary`,

    taxConfig: `/admin/restaurant/${tenantId}/tax-config`,
    taxLogs: `/admin/restaurant/${tenantId}/tax-logs`,
    integrationConfig: (provider: string) =>
      `/admin/restaurant/${tenantId}/integration-config/${provider}`,
    emailConfig: `/admin/restaurant/${tenantId}/email-config`,
    emailConfigById: (id: string) => `/admin/restaurant/${tenantId}/email-config/${id}`,

    offers: `/admin/restaurant/${tenantId}/offers`,
    offer: (id: string) => `/admin/restaurant/${tenantId}/offers/${id}`,

    convertToJson: `/admin/restaurant/${tenantId}/menu/convert-to-json`,
    ocrProcess: `/admin/restaurant/${tenantId}/ocr/process`,
    extractImage: `/admin/restaurant/${tenantId}/menu/extract-from-image`,
    extractPdf: `/admin/restaurant/${tenantId}/menu/extract-from-pdf`,
    importExtracted: `/admin/restaurant/${tenantId}/menu/import-extracted`,
    extractAndImport: `/admin/restaurant/${tenantId}/menu/extract-and-import`,
    enrichItems: `/admin/restaurant/${tenantId}/menu/enrich-items`,
    importEnriched: `/admin/restaurant/${tenantId}/menu/import-enriched`,
  }),
  public: {
    health: '/api/public/health',
    menu: (slug: string, table: string) => `/api/public/menu/${slug}/${table}`,
    order: (slug: string, table: string) => `/api/public/order/${slug}/${table}`,
    orderStatus: (slug: string, orderId: string) => `/api/public/order/${slug}/${orderId}`,
    tableOrders: (slug: string, table: string) => `/api/public/table-orders/${slug}/${table}`,
    paymentCreate: '/api/public/payment/create-order',
    paymentVerify: '/api/public/payment/verify',
    paymentWebhook: '/api/public/payment/webhook',
  },
  paytm: {
    createTransaction: '/api/paytm/create-transaction',
    createOrder: '/api/paytm/create-order',
    verify: '/api/paytm/verify',
    callback: '/api/paytm/callback',
  },
  webhooks: {
    razorpay: '/api/webhooks/razorpay',
    zomato: '/api/webhooks/zomato',
    swiggy: '/api/webhooks/swiggy',
    health: '/api/webhooks/health',
  },
} as const;
