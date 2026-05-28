import { Navigate, useLocation } from 'react-router-dom';
import { useAuthStore, selectIsAuthed } from '@/store/auth.store';
import type { UserRole } from '@/types';

interface ProtectedRouteProps {
  children: React.ReactNode;
  roles?: UserRole[];
}

/**
 * Gate a subtree behind authentication. If `roles` is provided, the user
 * must additionally hold one of those roles.
 *
 * Waits for auth-store hydration before redirecting to avoid a flash of
 * the login page on hard refresh.
 */
export function ProtectedRoute({ children, roles }: ProtectedRouteProps) {
  const isAuthed = useAuthStore(selectIsAuthed);
  const hydrated = useAuthStore((s) => s.hydrated);
  const user = useAuthStore((s) => s.user);
  const location = useLocation();

  if (!hydrated) {
    // Brief loading splash; tied to persist rehydration (usually <50ms).
    return (
      <div className="grid min-h-screen place-items-center bg-background">
        <div className="size-8 animate-spin rounded-full border-4 border-primary/20 border-t-primary" />
      </div>
    );
  }

  if (!isAuthed) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  if (roles && user && !roles.includes(user.role)) {
    return <Navigate to="/dashboard" replace />;
  }

  return <>{children}</>;
}
