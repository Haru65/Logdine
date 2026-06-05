/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_API_URL?: string;
  readonly BACKEND_API?: string;
  readonly VITE_CUSTOMER_URL?: string;
  readonly VITE_FRONTEND_URL?: string;
  readonly VITE_API_DEBUG?: string;
  readonly VITE_RAZORPAY_KEY_ID?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
