import { Toaster as Sonner } from 'sonner';
import { useUIStore } from '@/store/ui.store';

export function Toaster() {
  const theme = useUIStore((s) => s.theme);
  return (
    <Sonner
      theme={theme as 'light' | 'dark' | 'system'}
      position="top-right"
      richColors
      closeButton
      toastOptions={{
        classNames: {
          toast:
            'group toast group-[.toaster]:bg-card group-[.toaster]:text-foreground group-[.toaster]:border-border group-[.toaster]:shadow-card group-[.toaster]:rounded-xl',
          description: 'group-[.toast]:text-muted-foreground',
          actionButton: 'group-[.toast]:bg-primary group-[.toast]:text-primary-foreground',
        },
      }}
    />
  );
}
