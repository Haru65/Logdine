import * as React from 'react';
import { cn } from '@/lib/utils';

export const Alert = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement> & { variant?: 'default' | 'warning' | 'destructive' | 'success' }
>(({ className, variant = 'default', ...props }, ref) => (
  <div
    ref={ref}
    role="alert"
    className={cn(
      'rounded-lg border p-4 text-sm',
      variant === 'default' && 'border-border bg-muted/30 text-foreground',
      variant === 'warning' && 'border-amber-500/30 bg-amber-50 text-amber-900 dark:bg-amber-500/10 dark:text-amber-100',
      variant === 'destructive' && 'border-destructive/30 bg-destructive/10 text-destructive',
      variant === 'success' && 'border-emerald-500/30 bg-emerald-50 text-emerald-900 dark:bg-emerald-500/10 dark:text-emerald-100',
      className,
    )}
    {...props}
  />
));
Alert.displayName = 'Alert';

export const AlertTitle = ({ className, ...props }: React.HTMLAttributes<HTMLHeadingElement>) => (
  <h5 className={cn('mb-1 font-semibold leading-none tracking-normal', className)} {...props} />
);

export const AlertDescription = ({ className, ...props }: React.HTMLAttributes<HTMLParagraphElement>) => (
  <p className={cn('text-sm opacity-90', className)} {...props} />
);
