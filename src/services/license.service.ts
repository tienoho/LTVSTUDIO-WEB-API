/**
 * License, OTA & System Operations Service
 */

import { apiRequest } from './api.service';
import type { License, AdminStats, VersionConfig, ActivationLog } from '../types';

export const LicenseService = {
  async getStats(): Promise<AdminStats> {
    return await apiRequest<AdminStats>('/api/admin/stats');
  },

  async getLicenses(params: { search?: string; status?: string; plan?: string } = {}): Promise<License[]> {
    const query = new URLSearchParams();
    if (params.search) query.append('search', params.search);
    if (params.status && params.status !== 'ALL') query.append('status', params.status);
    if (params.plan && params.plan !== 'ALL') query.append('plan', params.plan);

    const queryString = query.toString();
    const url = `/api/admin/licenses${queryString ? `?${queryString}` : ''}`;
    const res = await apiRequest<{ licenses: License[] }>(url);
    return res.licenses || [];
  },

  async createLicenses(data: { plan: string; count: number; customer?: string; notes?: string }): Promise<License[]> {
    const res = await apiRequest<{ success: boolean; keys: License[]; message: string }>(
      '/api/admin/licenses/create',
      { method: 'POST', data }
    );
    return res.keys || [];
  },

  async resetHwid(key: string): Promise<string> {
    const res = await apiRequest<{ success: boolean; message: string }>('/api/admin/licenses/reset-hwid', {
      method: 'POST',
      data: { key }
    });
    return res.message;
  },

  async toggleStatus(key: string): Promise<{ status: string; message: string }> {
    const res = await apiRequest<{ success: boolean; status: string; message: string }>(
      '/api/admin/licenses/toggle-status',
      { method: 'POST', data: { key } }
    );
    return { status: res.status, message: res.message };
  },

  async extendLicense(data: { key: string; days?: number; lifetime?: boolean }): Promise<string> {
    const res = await apiRequest<{ success: boolean; message: string }>('/api/admin/licenses/extend', {
      method: 'POST',
      data
    });
    return res.message;
  },

  async deleteLicense(key: string): Promise<string> {
    const res = await apiRequest<{ success: boolean; message: string }>(`/api/admin/licenses/${encodeURIComponent(key)}`, {
      method: 'DELETE'
    });
    return res.message;
  },

  async lookup(key: string): Promise<any> {
    return await apiRequest(`/api/license/lookup?key=${encodeURIComponent(key)}`);
  },

  async verifyHwid(data: { licenseKey: string; machineId: string }): Promise<any> {
    return await apiRequest('/api/auth/verify', {
      method: 'POST',
      data
    });
  },

  async getLogs(params: { key?: string; limit?: number } = {}): Promise<ActivationLog[]> {
    const query = new URLSearchParams();
    if (params.key) query.append('key', params.key);
    if (params.limit) query.append('limit', params.limit.toString());

    const queryString = query.toString();
    const url = `/api/admin/licenses/logs${queryString ? `?${queryString}` : ''}`;
    const res = await apiRequest<{ logs: ActivationLog[] }>(url);
    return res.logs || [];
  },

  async getOtaVersion(): Promise<VersionConfig> {
    return await apiRequest<VersionConfig>('/api/transform/version');
  },

  async updateOtaVersion(data: Partial<VersionConfig>): Promise<string> {
    const res = await apiRequest<{ success: boolean; message: string }>('/api/admin/version', {
      method: 'POST',
      data
    });
    return res.message;
  },

  async backupDatabase(): Promise<any> {
    return await apiRequest('/api/admin/backup');
  },

  async restoreDatabase(payload: any): Promise<string> {
    const res = await apiRequest<{ success: boolean; message: string }>('/api/admin/restore', {
      method: 'POST',
      data: payload
    });
    return res.message;
  }
};
