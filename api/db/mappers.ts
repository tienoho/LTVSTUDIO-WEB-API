/**
 * Database Row to Domain Model Mappers
 * Adheres to Single Responsibility Principle (SRP)
 */

import type { License, User } from '../../types/index';

export function mapLicenseRow(row: any): License | null {
  if (!row) return null;
  return {
    id: row.id,
    key: row.key,
    type: row.type,
    plan: row.plan,
    customer: row.customer || '',
    notes: row.notes || '',
    machineId: row.machine_id,
    status: row.status,
    createdAt: row.created_at ? new Date(row.created_at).toISOString() : new Date().toISOString(),
    expiresAt: row.expires_at || 'LIFETIME',
    lastVerifiedAt: row.last_verified_at ? new Date(row.last_verified_at).toISOString() : null,
    activatedAt: row.activated_at ? new Date(row.activated_at).toISOString() : null
  };
}

export function mapUserRow(row: any): User | null {
  if (!row) return null;
  return {
    id: row.id,
    username: row.username,
    passwordHash: row.password_hash,
    fullName: row.full_name || '',
    email: row.email || '',
    role: row.role || 'Support',
    status: row.status || 'ACTIVE',
    lastLoginAt: row.last_login_at ? new Date(row.last_login_at).toISOString() : null,
    createdAt: row.created_at ? new Date(row.created_at).toISOString() : new Date().toISOString(),
    updatedAt: row.updated_at ? new Date(row.updated_at).toISOString() : new Date().toISOString()
  };
}
