/**
 * Shared Frontend Types (Extends and maps from root types)
 */

export type AdminRole = 'SuperAdmin' | 'Support' | 'Auditor';

export interface License {
  id?: number;
  key: string;
  type: string;
  plan: string;
  customer?: string;
  notes?: string;
  machineId?: string | null;
  status: 'ACTIVE' | 'REVOKED' | 'EXPIRED' | 'UNBOUND' | string;
  createdAt: string;
  expiresAt: string;
  lastVerifiedAt?: string | null;
  activatedAt?: string | null;
}

export interface User {
  id?: number;
  username: string;
  fullName?: string;
  email?: string;
  role: AdminRole;
  status: 'ACTIVE' | 'SUSPENDED' | 'LOCKED' | string;
  createdAt: string;
  updatedAt?: string;
  lastLoginAt?: string | null;
}

export interface AdminStats {
  total: number;
  active: number;
  unactivated: number;
  revoked: number;
  lifetime: number;
  currentVersion: string;
  downloadUrl: string;
  dbProvider?: string;
}

export interface VersionConfig {
  version: string;
  changelog?: string;
  releaseNotes?: string;
  download_url?: string;
  downloadUrl?: string;
  force_update?: boolean;
  updated_at?: string;
}

export interface ActivationLog {
  id?: number;
  licenseKey: string;
  machineId: string;
  ipAddress: string;
  status: string;
  message: string;
  userAgent: string;
  createdAt: string;
}

export interface AdminSession {
  username: string;
  fullName?: string;
  email?: string;
  role: AdminRole;
  permissions: string[];
}
