/**
 * User Accounts & RBAC Management Service
 */

import { apiRequest } from './api.service';
import type { User, AdminRole } from '../types';

export const UserService = {
  async getUsers(): Promise<User[]> {
    const res = await apiRequest<{ success: boolean; users: User[] }>('/api/admin/users');
    return res.users || [];
  },

  async createUser(data: {
    username: string;
    password?: string;
    fullName?: string;
    email?: string;
    role: AdminRole;
    status?: string;
  }): Promise<string> {
    const res = await apiRequest<{ success: boolean; message: string }>('/api/admin/users', {
      method: 'POST',
      data
    });
    return res.message;
  },

  async updateUser(data: {
    username: string;
    fullName?: string;
    email?: string;
    role?: AdminRole;
    status?: string;
  }): Promise<string> {
    const res = await apiRequest<{ success: boolean; message: string }>('/api/admin/users/update', {
      method: 'POST',
      data
    });
    return res.message;
  },

  async toggleStatus(username: string): Promise<string> {
    const res = await apiRequest<{ success: boolean; message: string }>('/api/admin/users/toggle-status', {
      method: 'POST',
      data: { username }
    });
    return res.message;
  },

  async deleteUser(username: string): Promise<string> {
    const res = await apiRequest<{ success: boolean; message: string }>('/api/admin/users/delete', {
      method: 'POST',
      data: { username }
    });
    return res.message;
  }
};
