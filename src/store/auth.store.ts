import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import type { User } from '@/types';

interface AuthState {
  user: User | null;
  token: string | null;
  hydrated: boolean;
  setAuth: (payload: { user: User; token: string }) => void;
  setUser: (user: User | null) => void;
  logout: () => void;
}

/**
 * Persistent auth state.
 * - Token + user are stored in localStorage so refresh keeps the session.
 * - `hydrated` flips true once the persist middleware has finished restoring,
 *   so we can avoid a flash of "logged-out" UI on first paint.
 */
export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      user: null,
      token: null,
      hydrated: false,
      setAuth: ({ user, token }) => set({ user, token }),
      setUser: (user) => set({ user }),
      logout: () => set({ user: null, token: null }),
    }),
    {
      name: 'restrohub.auth',
      storage: createJSONStorage(() => localStorage),
      partialize: ({ user, token }) => ({ user, token }),
      onRehydrateStorage: () => (state) => {
        state?.setUser?.(state.user);
        // Signal hydration complete on next tick.
        setTimeout(() => useAuthStore.setState({ hydrated: true }), 0);
      },
    },
  ),
);

export const selectIsAuthed = (s: AuthState) => Boolean(s.token && s.user);
export const selectTenantId = (s: AuthState) => s.user?.tenantId ?? null;
