import { NavLink, useLocation } from 'react-router-dom';
import {
  LayoutDashboard,
  ChefHat,
  UtensilsCrossed,
  Table2,
  BarChart3,
  Tag,
  Settings,
  Wand2,
  ChevronLeft,
  CreditCard,
  PlugZap,
  Boxes,
} from 'lucide-react';
import { motion } from 'framer-motion';
import { useQuery } from '@tanstack/react-query';
import { Logo } from '@/components/common/Logo';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { useUIStore } from '@/store/ui.store';
import { useAuthStore } from '@/store/auth.store';
import { restaurantService } from '@/services/restaurant.service';

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
    label: 'Orders',
    items: [
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

export function Sidebar() {
  const collapsed = useUIStore((s) => s.sidebarCollapsed);
  const toggle = useUIStore((s) => s.toggleSidebar);
  const tenant = useAuthStore((s) => s.user?.tenant);
  const tenantId = useAuthStore((s) => s.user?.tenantId);
  const latestTenant = useQuery({
    queryKey: ['active-tenant-info', tenantId],
    queryFn: () => restaurantService.getInfo(String(tenantId)),
    enabled: Boolean(tenantId),
  });
  const activeTenant = latestTenant.data || tenant;
  const tenantKind = String(activeTenant?.tenant_type || activeTenant?.type || activeTenant?.source || '').toLowerCase();
  const activeLabel = tenantKind === 'cafe' || activeTenant?.name?.toLowerCase().includes('cafe')
    ? 'Active Cafe'
    : 'Active Restaurant';
  const logoSrc = activeTenant?.logo_url || activeTenant?.logoUrl || activeTenant?.logo || '';
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
      {!collapsed && activeTenant && (
        <div className="m-3 rounded-xl border border-border/60 bg-background/60 p-3">
          <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
            {activeLabel}
          </p>
          {logoSrc && (
            <div className="mt-3 flex h-[72px] w-full items-center justify-center overflow-hidden rounded-lg border border-border/50 bg-card/80 p-2">
              <img
                src={logoSrc}
                alt={`${activeTenant.name} logo`}
                className="max-h-full max-w-full object-contain"
                loading="lazy"
              />
            </div>
          )}
          <p className="mt-2 truncate text-sm font-semibold">{activeTenant.name}</p>
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
