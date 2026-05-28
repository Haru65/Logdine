import apiClient, { unwrap } from '@/api/client';
import { endpoints } from '@/api/endpoints';
import type { AuthResponse, LoginCredentials, User } from '@/types';

export const authService = {
  async login(credentials: LoginCredentials): Promise<AuthResponse> {
    const res = await apiClient.post(endpoints.auth.login, {
      email: credentials.email,
      password: credentials.password,
    });
    return unwrap<AuthResponse>(res.data);
  },

  async me(): Promise<User> {
    const res = await apiClient.get(endpoints.auth.me);
    const data = unwrap<{ user: User } | User>(res.data);
    return 'user' in (data as { user?: User }) ? (data as { user: User }).user : (data as User);
  },

  async getCurrentUser(): Promise<User> {
    const res = await apiClient.get(endpoints.auth.me);
    const data = unwrap<{ user: User } | User>(res.data);
    return 'user' in (data as { user?: User }) ? (data as { user: User }).user : (data as User);
  },
};
