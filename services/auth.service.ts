/**
 * Authentication & Session Management Service
 */

import { apiRequest } from './api.service';
import type { AdminSession } from '@/types';

export const AuthService = {
  async login(credentials: { username: string; secret: string; role?: string }): Promise<{ token: string; user: AdminSession }> {
    const res = await apiRequest<{ success: boolean; token: string; user: AdminSession; message: string }>(
      '/api/admin/login',
      {
        method: 'POST',
        headers: {
          'x-admin-key': credentials.secret
        },
        data: {
          username: credentials.username,
          password: credentials.secret,
          secret: credentials.secret,
          role: credentials.role
        }
      }
    );

    if (res.token && typeof window !== 'undefined') {
      try {
        localStorage.setItem('ltv_admin_token', res.token);
        localStorage.setItem('ltv_admin_user', JSON.stringify(res.user));
      } catch {}
    }

    return { token: res.token, user: res.user };
  },

  async verifySession(): Promise<AdminSession | null> {
    if (typeof window === 'undefined') return null;
    const token = localStorage.getItem('ltv_admin_token');
    if (!token) return null;

    try {
      const res = await apiRequest<{ valid: boolean; user: AdminSession }>('/api/admin/verify-session');
      if (res.valid && res.user) {
        try {
          localStorage.setItem('ltv_admin_user', JSON.stringify(res.user));
        } catch {}
        return res.user;
      }
      return null;
    } catch {
      this.clearSession();
      return null;
    }
  },

  async logout(): Promise<void> {
    try {
      await apiRequest('/api/admin/logout', { method: 'POST' });
    } catch (e) {
      // Ignore network errors on logout
    } finally {
      this.clearSession();
    }
  },

  clearSession(): void {
    if (typeof window !== 'undefined') {
      try {
        localStorage.removeItem('ltv_admin_token');
        localStorage.removeItem('ltv_admin_user');
      } catch {}
    }
  },

  async changePassword(data: { currentPassword: string; newPassword: string; targetUsername?: string }): Promise<string> {
    const res = await apiRequest<{ success: boolean; message: string }>(
      '/api/admin/change-password',
      {
        method: 'POST',
        data
      }
    );
    return res.message || 'Đổi mật khẩu thành công!';
  }
};
