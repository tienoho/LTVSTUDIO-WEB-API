/**
 * LTVStudio Web API & License Server - Type Definitions
 */

export type LicensePlan = 'LIFETIME' | 'PRO' | '1_YEAR' | 'TRIAL' | 'ENTERPRISE';
export type LicenseStatus = 'ACTIVE' | 'REVOKED' | 'EXPIRED' | 'UNBOUND';

export interface License {
  id?: number;
  key: string;
  type: string;
  plan: LicensePlan | string;
  customer?: string;
  notes?: string;
  machineId: string | null;
  status: LicenseStatus | string;
  createdAt: string;
  expiresAt: string;
  lastVerifiedAt: string | null;
  activatedAt?: string | null;
}

export interface VersionConfig {
  id?: number;
  version: string;
  changelog: string;
  releaseNotes?: string;
  download_url: string;
  downloadUrl?: string;
  force_update: boolean;
  forceUpdate?: boolean;
  updated_at?: string;
  updatedAt?: string;
}

export type ActivationStatus = 'SUCCESS' | 'WRONG_HWID' | 'EXPIRED' | 'REVOKED' | 'NOT_FOUND' | 'INVALID';

export interface ActivationLog {
  id?: number;
  licenseKey: string;
  machineId: string;
  ipAddress: string;
  status: ActivationStatus | string;
  message: string;
  userAgent: string;
  createdAt: string;
}

export interface VerifyRequestBody {
  licenseKey?: string;
  key?: string;
  machineId?: string;
  hwid?: string;
}

export interface VerifyResponseBody {
  isValid: boolean;
  licenseType: string;
  expiresAt: string | null;
  machineId: string | null;
  message: string;
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

export interface DbHealth {
  connected: boolean;
  driver: 'neon_postgres' | 'local_file_fallback';
  latencyMs: number;
  error?: string | null;
}

export interface HealthResponse {
  status: 'healthy' | 'degraded';
  service: string;
  version: string;
  uptimeSeconds: number;
  timestamp: string;
  database: DbHealth;
  stats: {
    totalLicenses: number;
    activeLicenses: number;
  };
}
