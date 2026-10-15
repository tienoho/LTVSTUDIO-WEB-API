/**
 * Authentication & Session Management Service
 */

import { apiRequest } from './api.service';
import type { AdminSession } from '../types';

export const AuthService = {
  async login(credentials: { username: string; secret: string; role?: string }): Promise<{ token: string; user: AdminSession }> {
    const res = await apiRequest<{ success: boolean; token: string; user: AdminSession; message: string }>(
      '/api/admin/login',
      {
        method: 'POST',
        data: {
          username: credentials.username,
          password: credentials.secret,
          secret: credentials.secret,
          role: credentials.role
        }
      }
    );

    if (res.token) {
      localStorage.setItem('ltv_admin_token', res.token);
      localStorage.setItem('ltv_admin_user', JSON.stringify(res.user));
    }

    return { token: res.token, user: res.user };
  },

  async verifySession(): Promise<AdminSession | null> {
    const token = localStorage.getItem('ltv_admin_token');
    if (!token) return null;

    try {
      const res = await apiRequest<{ valid: boolean; user: AdminSession }>('/api/admin/verify-session');
      if (res.valid && res.user) {
        localStorage.setItem('ltv_admin_user', JSON.stringify(res.user));
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
    localStorage.removeItem('ltv_admin_token');
    localStorage.removeItem('ltv_admin_user');
  },

  async changePassword(data: { currentPassword: string; newPassword: string; targetUsername?: string }): Promise<string> {
    const res = await apiRequest<{ success: boolean; message: string }>('/api/admin/change-password', {
      method: 'POST',
      data
    });
    return res.message;
  }
};
