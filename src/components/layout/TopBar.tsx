import { Bell, LogOut, Menu, Moon, Search, Sun } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useUIStore } from '@/store/ui.store';
import { useAuthStore } from '@/store/auth.store';
import { useLogout } from '@/hooks/useAuth';
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet';
import { MobileSidebar } from '@/components/layout/MobileSidebar';

export function TopBar() {
  const { theme, setTheme, toggleSidebar } = useUIStore();
  const user = useAuthStore((s) => s.user);
  const logout = useLogout();

  return (
    <header className="sticky top-0 z-30 flex h-16 items-center gap-3 border-b border-border/60 bg-background/80 px-4 backdrop-blur-md lg:px-6">
      {/* Mobile menu trigger */}
      <Sheet>
        <SheetTrigger asChild>
          <Button variant="ghost" size="icon" className="lg:hidden">
            <Menu className="size-5" />
          </Button>
        </SheetTrigger>
        <SheetContent side="left" className="w-[88vw] max-w-sm p-0">
          <MobileSidebar />
        </SheetContent>
      </Sheet>

      {/* Desktop sidebar collapse */}
      <Button variant="ghost" size="icon" onClick={toggleSidebar} className="hidden lg:inline-flex">
        <Menu className="size-5" />
      </Button>

      {/* Search */}
      <div className="relative mx-2 hidden flex-1 max-w-md md:block">
        <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          placeholder="Search orders, items, customers…"
          className="h-10 pl-9 bg-muted/40 border-transparent"
        />
        <kbd className="pointer-events-none absolute right-2 top-1/2 hidden -translate-y-1/2 rounded border border-border/60 bg-background px-1.5 py-0.5 text-[10px] font-mono text-muted-foreground md:inline">
          ⌘K
        </kbd>
      </div>

      <div className="ml-auto flex items-center gap-1.5">
        {/* Theme toggle */}
        <Button
          variant="ghost"
          size="icon"
          onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
          aria-label="Toggle theme"
        >
          {theme === 'dark' ? <Sun className="size-4" /> : <Moon className="size-4" />}
        </Button>

        {/* Notifications */}
        <Button variant="ghost" size="icon" aria-label="Notifications" className="relative">
          <Bell className="size-4" />
          <span className="absolute right-2 top-2 inline-flex size-2 rounded-full bg-primary ring-2 ring-background" />
        </Button>

        {/* User chip */}
        <div className="hidden items-center gap-2.5 rounded-full border border-border/60 bg-muted/30 px-2.5 py-1 md:flex">
          <div className="flex size-7 items-center justify-center rounded-full bg-gradient-warm text-xs font-bold text-white">
            {user?.name?.[0] ?? 'A'}
          </div>
          <div className="leading-tight">
            <p className="text-xs font-semibold">{user?.name ?? 'Admin'}</p>
            <p className="text-[10px] text-muted-foreground capitalize">
              {user?.role?.replace('_', ' ') ?? 'Admin'}
            </p>
          </div>
        </div>

        {/* Logout */}
        <Button variant="ghost" size="sm" onClick={logout} className="gap-1.5 text-destructive hover:text-destructive">
          <LogOut className="size-4" />
          <span className="hidden sm:inline">Logout</span>
        </Button>
      </div>
    </header>
  );
}
