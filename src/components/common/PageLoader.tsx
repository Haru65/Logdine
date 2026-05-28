import { Logo } from '@/components/common/Logo';

export function PageLoader() {
  return (
    <div className="grid min-h-[60vh] place-items-center">
      <div className="flex flex-col items-center gap-4">
        <div className="relative">
          <Logo withText={false} />
          <span className="absolute inset-0 -m-2 animate-pulse-ring rounded-2xl bg-primary/20" />
        </div>
        <p className="text-xs font-medium uppercase tracking-widest text-muted-foreground">
          Loading…
        </p>
      </div>
    </div>
  );
}
