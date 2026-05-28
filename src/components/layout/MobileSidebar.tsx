import { NavLink } from 'react-router-dom';
import { ChefHat, ClipboardList, LayoutDashboard, ShoppingCart, UtensilsCrossed } from 'lucide-react';
import { Logo } from '@/components/common/Logo';
import { cn } from '@/lib/utils';

const navItems = [
  { to: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { to: '/pos', label: 'POS', icon: ShoppingCart },
  { to: '/orders', label: 'Orders', icon: ClipboardList },
  { to: '/kds', label: 'Kitchen', icon: ChefHat },
  { to: '/menu', label: 'Menu', icon: UtensilsCrossed },
];

export function MobileSidebar() {
  return (
    <div className="flex h-full flex-col">
      <div className="flex h-16 items-center border-b border-border/60 px-4">
        <Logo />
      </div>
      <nav className="flex-1 overflow-y-auto p-3">
        {navItems.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            className={({ isActive }) =>
              cn(
                'flex items-center gap-3 rounded-lg px-3 py-3 text-sm font-medium transition-colors',
                isActive ? 'bg-primary/10 text-primary' : 'text-foreground/80 hover:bg-accent',
              )
            }
          >
            <item.icon className="size-5" />
            {item.label}
          </NavLink>
        ))}
      </nav>
    </div>
  );
}

/** Persistent mobile bottom nav — visible on screens < lg */
export function MobileBottomNav() {
  return (
    <nav
      className="fixed inset-x-0 bottom-0 z-30 flex h-16 items-stretch justify-around border-t border-border/60 bg-background/95 px-2 backdrop-blur-md safe-bottom lg:hidden"
      aria-label="Primary"
    >
      {navItems.map((item) => (
        <NavLink
          key={item.to}
          to={item.to}
          className={({ isActive }) =>
            cn(
              'flex flex-1 flex-col items-center justify-center gap-1 text-[11px] font-medium transition-colors touch-target',
              isActive ? 'text-primary' : 'text-muted-foreground',
            )
          }
        >
          {({ isActive }) => (
            <>
              <span
                className={cn(
                  'relative grid place-items-center rounded-full p-1.5 transition-all',
                  isActive && 'bg-primary/10',
                )}
              >
                <item.icon className="size-5" />
                {isActive && (
                  <span className="absolute -bottom-1 size-1 rounded-full bg-primary" />
                )}
              </span>
              {item.label}
            </>
          )}
        </NavLink>
      ))}
    </nav>
  );
}
