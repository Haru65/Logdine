import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { authService } from '@/services/auth.service';
import { useAuthStore } from '@/store/auth.store';
import { qk } from '@/api/queryClient';
import type { LoginCredentials } from '@/types';
import { toast } from 'sonner';

export function useLogin() {
  const setAuth = useAuthStore((s) => s.setAuth);
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (creds: LoginCredentials) => authService.login(creds),
    onSuccess: (res) => {
      setAuth({ user: res.user, token: res.token });
      qc.setQueryData(qk.me(), res.user);
      toast.success(`Welcome back, ${res.user.name.split(' ')[0]}!`);
    },
    onError: (err: { message?: string }) => {
      toast.error(err?.message || 'Login failed. Check your credentials.');
    },
  });
}

export function useMe() {
  const token = useAuthStore((s) => s.token);
  return useQuery({
    queryKey: qk.me(),
    queryFn: () => authService.me(),
    enabled: Boolean(token),
    staleTime: 5 * 60_000,
  });
}

export function useLogout() {
  const logout = useAuthStore((s) => s.logout);
  const qc = useQueryClient();
  return () => {
    logout();
    qc.clear();
    toast.success('Signed out');
  };
}
