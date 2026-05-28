import { useEffect } from 'react';
import { useRegisterSW } from 'virtual:pwa-register/react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';

/**
 * Surfaces a toast when a new service-worker version is waiting.
 * Also handles offline-ready notification.
 */
export function PWAUpdatePrompt() {
  const {
    needRefresh: [needRefresh, setNeedRefresh],
    offlineReady: [offlineReady, setOfflineReady],
    updateServiceWorker,
  } = useRegisterSW({
    onRegisteredSW(swUrl) {
      // Re-check for updates every 60 minutes while the app is open.
      setInterval(async () => {
        const r = await navigator.serviceWorker.getRegistration(swUrl);
        if (r) await r.update();
      }, 60 * 60 * 1000);
    },
  });

  useEffect(() => {
    if (offlineReady) {
      toast.success('Ready to work offline', { duration: 3000 });
      setOfflineReady(false);
    }
  }, [offlineReady, setOfflineReady]);

  useEffect(() => {
    if (needRefresh) {
      toast('A new version is available', {
        action: (
          <Button size="sm" onClick={() => updateServiceWorker(true)}>
            Reload
          </Button>
        ),
        duration: Infinity,
        onDismiss: () => setNeedRefresh(false),
      });
    }
  }, [needRefresh, setNeedRefresh, updateServiceWorker]);

  return null;
}
