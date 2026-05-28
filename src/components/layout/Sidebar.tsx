import { NavLink, useLocation } from 'react-router-dom';
import {
  LayoutDashboard,
  ShoppingCart,
  Receipt,
  ChefHat,
  ClipboardList,
  UtensilsCrossed,
  Table2,
  CalendarClock,
  Bike,
  BarChart3,
  Tag,
  Settings,
  ChevronLeft,
} from 'lucide-react';
import { motion } from 'framer-motion';
import { Logo } from '@/components/common/Logo';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { useUIStore } from '@/store/ui.store';
import { useAuthStore } from '@/store/auth.store';

interface NavGroup {
  label: string;
  items: { to: string; label: string; icon: typeof LayoutDashboard }[];
}

const groups: NavGroup[] = [
  {
    label: 'Overview',
    items: [{ to: '/dashboard', label: 'Dashboard', icon: LayoutDashboard }],
  },
  {
    label: 'Orders & Billing',
    items: [
      { to: '/pos', label: 'POS Billing', icon: ShoppingCart },
      { to: '/billing', label: 'Billing', icon: Receipt },
      { to: '/kds', label: 'Kitchen Display', icon: ChefHat },
      { to: '/orders', label: 'Orders', icon: ClipboardList },
    ],
  },
  {
    label: 'Restaurant',
    items: [
      { to: '/menu', label: 'Menu Management', icon: UtensilsCrossed },
      { to: '/tables', label: 'Table Management', icon: Table2 },
      { to: '/reservations', label: 'Reservations', icon: CalendarClock },
      { to: '/delivery', label: 'Delivery Management', icon: Bike },
    ],
  },
  {
    label: 'Insights',
    items: [
      { to: '/reports', label: 'Reports', icon: BarChart3 },
      { to: '/offers', label: 'Offers & Promotions', icon: Tag },
    ],
  },
  {
    label: 'Account',
    items: [{ to: '/settings', label: 'Settings', icon: Settings }],
  },
];

export function Sidebar() {
  const collapsed = useUIStore((s) => s.sidebarCollapsed);
  const toggle = useUIStore((s) => s.toggleSidebar);
  const tenant = useAuthStore((s) => s.user?.tenant);
  const location = useLocation();

  return (
    <aside
      className={cn(
        'sticky top-0 hidden h-screen shrink-0 flex-col border-r border-border/60 bg-card/40 backdrop-blur-md transition-[width] duration-300 ease-out lg:flex',
        collapsed ? 'w-[76px]' : 'w-[260px]',
      )}
    >
      {/* Brand */}
      <div className={cn('flex h-16 items-center border-b border-border/60 px-4', collapsed && 'justify-center')}>
        <Logo withText={!collapsed} />
      </div>

      {/* Restaurant chip */}
      {!collapsed && tenant && (
        <div className="m-3 rounded-xl border border-border/60 bg-background/60 p-3">
          <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
            Active Restaurant
          </p>
          <p className="mt-0.5 truncate text-sm font-semibold">{tenant.name}</p>
        </div>
      )}

      {/* Groups */}
      <nav className="flex-1 overflow-y-auto px-2 pb-4">
        {groups.map((group) => (
          <div key={group.label} className="mt-4">
            {!collapsed && (
              <p className="px-3 pb-1.5 text-[10px] font-bold uppercase tracking-widest text-muted-foreground/70">
                {group.label}
              </p>
            )}
            <ul className="space-y-0.5">
              {group.items.map((item) => {
                const isActive = location.pathname.startsWith(item.to);
                return (
                  <li key={item.to}>
                    <NavLink
                      to={item.to}
                      className={({ isActive: linkActive }) =>
                        cn(
                          'group relative flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors',
                          'hover:bg-accent hover:text-accent-foreground',
                          linkActive
                            ? 'text-primary bg-primary/8'
                            : 'text-foreground/75',
                          collapsed && 'justify-center px-2',
                        )
                      }
                      title={collapsed ? item.label : undefined}
                    >
                      {isActive && (
                        <motion.span
                          layoutId="sidebar-active"
                          className="absolute inset-y-1 left-0 w-[3px] rounded-r-full bg-primary"
                          transition={{ type: 'spring', stiffness: 350, damping: 30 }}
                        />
                      )}
                      <item.icon className="size-[18px] shrink-0" />
                      {!collapsed && <span className="truncate">{item.label}</span>}
                    </NavLink>
                  </li>
                );
              })}
            </ul>
          </div>
        ))}
      </nav>

      {/* Collapse toggle */}
      <div className="border-t border-border/60 p-3">
        <Button
          variant="ghost"
          size={collapsed ? 'icon' : 'default'}
          onClick={toggle}
          className="w-full justify-center gap-2"
        >
          <ChevronLeft className={cn('size-4 transition-transform', collapsed && 'rotate-180')} />
          {!collapsed && <span className="text-xs">Collapse</span>}
        </Button>
        {!collapsed && (
          <p className="mt-3 text-center text-[10px] text-muted-foreground">
            © 2026 RestroHub
          </p>
        )}
      </div>
    </aside>
  );
}
