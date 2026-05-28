import { RouterProvider } from 'react-router-dom';
import { QueryClientProvider } from '@tanstack/react-query';
import { useEffect } from 'react';
import { router } from '@/routes/router';
import { queryClient } from '@/api/queryClient';
import { Toaster } from '@/components/ui/toaster';
import { useUIStore } from '@/store/ui.store';
import { PWAUpdatePrompt } from '@/pwa/PWAUpdatePrompt';

export default function App() {
  // Sync system theme changes if user opted into 'system'.
  const theme = useUIStore((s) => s.theme);

  useEffect(() => {
    if (theme !== 'system') return;
    const mq = window.matchMedia('(prefers-color-scheme: dark)');
    const handler = () => useUIStore.getState().setTheme('system');
    mq.addEventListener('change', handler);
    return () => mq.removeEventListener('change', handler);
  }, [theme]);

  return (
    <QueryClientProvider client={queryClient}>
      <RouterProvider router={router} />
      <Toaster />
      <PWAUpdatePrompt />
    </QueryClientProvider>
  );
}
