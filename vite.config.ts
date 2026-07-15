import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';
import { VitePWA } from 'vite-plugin-pwa';
import path from 'node:path';

const parsePort = (value: string | undefined, fallback: number) => {
  const port = Number.parseInt(value || '', 10);
  return Number.isInteger(port) && port > 0 && port <= 65535 ? port : fallback;
};

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '');
  const backendApi = env.BACKEND_API || env.VITE_API_URL || `http://localhost:${parsePort(env.BACKEND_PORT, 5001)}`;

  return ({
  envPrefix: ['VITE_', 'BACKEND_'],
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      injectRegister: 'auto',
      includeAssets: ['favicon.svg', 'robots.txt', 'apple-touch-icon.png', 'offline.html'],
      manifest: {
        id: '/',
        name: 'RestroHub – Restaurant Manager',
        short_name: 'RestroHub',
        description: 'QR-based cafe & restaurant management platform',
        theme_color: '#ff6b00',
        background_color: '#fffaf5',
        display: 'standalone',
        display_override: ['standalone', 'minimal-ui'],
        orientation: 'portrait',
        scope: '/',
        start_url: '/',
        lang: 'en',
        categories: ['business', 'food', 'productivity'],
        icons: [
          { src: '/icons/icon-192.png', sizes: '192x192', type: 'image/png' },
          { src: '/icons/icon-512.png', sizes: '512x512', type: 'image/png' },
          { src: '/icons/maskable-512.png', sizes: '512x512', type: 'image/png', purpose: 'maskable' },
        ],
        shortcuts: [
          {
            name: 'Kitchen',
            short_name: 'Kitchen',
            description: 'Open the live kitchen display',
            url: '/kds',
            icons: [{ src: '/icons/icon-192.png', sizes: '192x192' }],
          },
          {
            name: 'Tables',
            short_name: 'Tables',
            description: 'Open table management',
            url: '/tables',
            icons: [{ src: '/icons/icon-192.png', sizes: '192x192' }],
          },
        ],
      },
      workbox: {
        globPatterns: ['**/*.{js,css,html,svg,png,ico,woff2,webmanifest}'],
        cleanupOutdatedCaches: true,
        navigateFallback: '/index.html',
        navigateFallbackDenylist: [/^\/api\//, /^\/admin\//, /^\/auth\//],
        runtimeCaching: [
          {
            // Payment-method availability must always reflect the current
            // restaurant setting, even when an older menu is cached offline.
            urlPattern: ({ url }) =>
              url.pathname.startsWith('/api/public/checkout-options/'),
            handler: 'NetworkOnly',
          },
          {
            // Public customer APIs can be served briefly from cache when offline.
            // Authenticated admin APIs are intentionally excluded because menu
            // payloads can be large and should not be cloned into Cache Storage.
            urlPattern: ({ url }) =>
              url.pathname.startsWith('/api/public'),
            handler: 'NetworkFirst',
            options: {
              cacheName: 'restrohub-public-api',
              networkTimeoutSeconds: 4,
              expiration: { maxEntries: 200, maxAgeSeconds: 60 * 60 * 24 },
              cacheableResponse: { statuses: [0, 200] },
            },
          },
          {
            // Menu images – cache-first
            urlPattern: /\.(?:png|jpg|jpeg|svg|webp|gif)$/i,
            handler: 'CacheFirst',
            options: {
              cacheName: 'restrohub-images',
              expiration: { maxEntries: 300, maxAgeSeconds: 60 * 60 * 24 * 30 },
            },
          },
        ],
      },
      devOptions: { enabled: false },
    }),
  ],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  server: {
    host: env.VITE_HOST || 'localhost',
    port: parsePort(env.VITE_PORT, 5173),
    proxy: {
      '/auth': backendApi,
      '/admin': backendApi,
      '/api': backendApi,
    },
  },
  build: {
    sourcemap: false,
    rollupOptions: {
      output: {
        manualChunks: {
          'react-vendor': ['react', 'react-dom', 'react-router-dom'],
          'data-vendor': ['@tanstack/react-query', 'axios', 'zustand'],
          'ui-vendor': ['framer-motion', 'lucide-react', 'recharts'],
        },
      },
    },
  },
  });
});
