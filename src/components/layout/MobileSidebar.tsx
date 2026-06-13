import { NavLink } from 'react-router-dom';
import {
  BarChart3,
  Boxes,
  ChefHat,
  ClipboardList,
  CreditCard,
  LayoutDashboard,
  PlugZap,
  Settings,
  Table2,
  Tag,
  UtensilsCrossed,
  Wand2,
} from 'lucide-react';
import { Logo } from '@/components/common/Logo';
import { cn } from '@/lib/utils';

const bottomNavItems = [
  { to: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { to: '/kds', label: 'Kitchen', icon: ChefHat },
  { to: '/tables', label: 'Tables', icon: Table2 },
  { to: '/reports', label: 'Reports', icon: BarChart3 },
  { to: '/menu', label: 'Menu', icon: UtensilsCrossed },
];

const mobileGroups = [
  {
    label: 'Overview',
    items: [{ to: '/dashboard', label: 'Dashboard', icon: LayoutDashboard }],
  },
  {
    label: 'Orders',
    items: [
      { to: '/orders', label: 'Orders', icon: ClipboardList },
      { to: '/kds', label: 'Kitchen Display', icon: ChefHat },
    ],
  },
  {
    label: 'Restaurant',
    items: [
      { to: '/menu', label: 'Menu Management', icon: UtensilsCrossed },
      { to: '/menu/extraction', label: 'Menu OCR', icon: Wand2 },
      { to: '/tables', label: 'Table Management', icon: Table2 },
    ],
  },
  {
    label: 'Insights',
    items: [
      { to: '/reports', label: 'Reports', icon: BarChart3 },
      { to: '/offers', label: 'Offers & Promotions', icon: Tag },
      { to: '/offers/combos', label: 'Combo Offers', icon: Boxes },
    ],
  },
  {
    label: 'Integrations',
    items: [
      { to: '/payment-config', label: 'Payments', icon: CreditCard },
      { to: '/integration-config', label: 'Delivery Apps', icon: PlugZap },
    ],
  },
  {
    label: 'Account',
    items: [{ to: '/settings', label: 'Settings', icon: Settings }],
  },
];

export function MobileSidebar() {
  return (
    <div className="flex h-full flex-col">
      <div className="flex h-16 items-center border-b border-border/60 px-4">
        <Logo />
      </div>
      <nav className="flex-1 overflow-y-auto px-3 pb-6">
        {mobileGroups.map((group) => (
          <div key={group.label} className="mt-4">
            <p className="px-3 pb-1.5 text-[10px] font-bold uppercase tracking-widest text-muted-foreground/70">
              {group.label}
            </p>
            <div className="space-y-0.5">
              {group.items.map((item) => (
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
                  <item.icon className="size-5 shrink-0" />
                  <span className="truncate">{item.label}</span>
                </NavLink>
              ))}
            </div>
          </div>
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
      {bottomNavItems.map((item) => (
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
