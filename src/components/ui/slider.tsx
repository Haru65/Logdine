import * as React from 'react';
import { cn } from '@/lib/utils';

export type SliderProps = React.InputHTMLAttributes<HTMLInputElement>;

export const Slider = React.forwardRef<HTMLInputElement, SliderProps>(
  ({ className, type, ...props }, ref) => (
    <input
      ref={ref}
      type="range"
      className={cn('h-2 w-full cursor-pointer appearance-none rounded-full bg-muted accent-primary', className)}
      {...props}
    />
  ),
);
Slider.displayName = 'Slider';
