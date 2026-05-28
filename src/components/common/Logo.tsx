import { cn } from '@/lib/utils';

interface LogoProps {
  className?: string;
  /** Show the wordmark next to the icon. */
  withText?: boolean;
}

/**
 * RestroHub mark — a stylised flame/cup hybrid in the brand orange.
 * Pure SVG, no external dependencies.
 */
export function Logo({ className, withText = true }: LogoProps) {
  return (
    <div className={cn('flex items-center gap-2.5', className)}>
      <span className="relative inline-flex">
        <svg
          width="32"
          height="32"
          viewBox="0 0 32 32"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
          aria-hidden="true"
        >
          <defs>
            <linearGradient id="rh-grad" x1="0" y1="0" x2="1" y2="1">
              <stop offset="0%" stopColor="#ff8a33" />
              <stop offset="100%" stopColor="#ff6b00" />
            </linearGradient>
          </defs>
          <rect width="32" height="32" rx="9" fill="url(#rh-grad)" />
          <path
            d="M16 6c2.4 2.6 3.5 5.1 3.5 7.5 0 2.3-1.5 4.1-3.5 4.1S12.5 15.8 12.5 13.5C12.5 11.1 13.6 8.6 16 6Z"
            fill="#fff"
            fillOpacity="0.95"
          />
          <path
            d="M10 19h12c0 4-2.7 7-6 7s-6-3-6-7Z"
            fill="#fff"
            fillOpacity="0.85"
          />
        </svg>
      </span>
      {withText && (
        <span className="font-serif text-lg font-bold tracking-tight leading-none">
          Restro<span className="text-primary">Hub</span>
        </span>
      )}
    </div>
  );
}
