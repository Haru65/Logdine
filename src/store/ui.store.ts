import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';

type Theme = 'light' | 'dark' | 'system';

interface UIState {
  theme: Theme;
  sidebarCollapsed: boolean;
  cartOpen: boolean; // mobile slide-up cart

  setTheme: (t: Theme) => void;
  toggleSidebar: () => void;
  setSidebarCollapsed: (v: boolean) => void;
  setCartOpen: (v: boolean) => void;
}

export const useUIStore = create<UIState>()(
  persist(
    (set, get) => ({
      theme: 'light',
      sidebarCollapsed: false,
      cartOpen: false,

      setTheme: (theme) => {
        applyTheme(theme);
        set({ theme });
      },
      toggleSidebar: () => set({ sidebarCollapsed: !get().sidebarCollapsed }),
      setSidebarCollapsed: (v) => set({ sidebarCollapsed: v }),
      setCartOpen: (v) => set({ cartOpen: v }),
    }),
    {
      name: 'restrohub.ui',
      storage: createJSONStorage(() => localStorage),
      partialize: ({ theme, sidebarCollapsed }) => ({ theme, sidebarCollapsed }),
      onRehydrateStorage: () => (state) => {
        // Re-apply the persisted theme as soon as we hydrate.
        if (state) applyTheme(state.theme);
      },
    },
  ),
);

function applyTheme(theme: Theme) {
  const root = document.documentElement;
  const effective =
    theme === 'system'
      ? window.matchMedia('(prefers-color-scheme: dark)').matches
        ? 'dark'
        : 'light'
      : theme;
  root.classList.toggle('dark', effective === 'dark');
}
