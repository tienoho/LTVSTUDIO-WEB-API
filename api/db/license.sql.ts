/**
 * License Database Operations (SQL)
 * Adheres to Single Responsibility Principle (SRP)
 */

import { getClient } from './connection';
import { mapLicenseRow } from './mappers';
import { getVersionConfig, updateVersionConfig } from './version.sql';
import type { License, AdminStats, VersionConfig } from '../../types/index';

export async function getLicenses(search: string = '', status: string = 'ALL', plan: string = 'ALL'): Promise<License[] | null> {
  const sql = getClient();
  if (!sql) return null;

  try {
    const rows = await sql`SELECT * FROM licenses ORDER BY id DESC;`;
    let items: License[] = rows.map(mapLicenseRow).filter((x: any): x is License => x !== null);

    if (status === 'UNBOUND') {
      items = items.filter(l => l.status === 'ACTIVE' && !l.machineId);
    } else if (status !== 'ALL') {
      items = items.filter(l => l.status === status);
    }

    if (plan !== 'ALL') {
      items = items.filter(l => (l.plan || '').toUpperCase() === plan.toUpperCase());
    }

    if (search && search.trim()) {
      const term = search.trim().toLowerCase();
      items = items.filter(l =>
        (l.key && l.key.toLowerCase().includes(term)) ||
        (l.customer && l.customer.toLowerCase().includes(term)) ||
        (l.notes && l.notes.toLowerCase().includes(term)) ||
        (l.machineId && l.machineId.toLowerCase().includes(term))
      );
    }

    return items;
  } catch (err: any) {
    console.error('[Neon Postgres] getLicenses error:', err.message);
    return null;
  }
}

export async function getLicenseByKey(key: string): Promise<License | null> {
  const sql = getClient();
  if (!sql) return null;

  try {
    const rows = await sql`SELECT * FROM licenses WHERE UPPER(key) = UPPER(${key}) LIMIT 1;`;
    if (!rows || rows.length === 0) return null;
    return mapLicenseRow(rows[0]);
  } catch (err: any) {
    console.error('[Neon Postgres] getLicenseByKey error:', err.message);
    return null;
  }
}

export async function createLicense(item: License): Promise<License | null> {
  const sql = getClient();
  if (!sql) return null;

  try {
    await sql`
      INSERT INTO licenses (key, type, plan, customer, notes, machine_id, status, expires_at, created_at)
      VALUES (${item.key}, ${item.type}, ${item.plan}, ${item.customer || ''}, ${item.notes || ''}, 
              ${item.machineId || null}, ${item.status || 'ACTIVE'}, ${item.expiresAt || 'LIFETIME'}, NOW());
    `;
    return item;
  } catch (err: any) {
    console.error('[Neon Postgres] createLicense error:', err.message);
    return null;
  }
}

export async function createLicensesBatch(items: License[]): Promise<License[] | null> {
  const sql = getClient();
  if (!sql) return null;

  try {
    for (const item of items) {
      await createLicense(item);
    }
    return items;
  } catch (err: any) {
    console.error('[Neon Postgres] createLicensesBatch error:', err.message);
    return null;
  }
}

export async function updateLicense(key: string, updates: Partial<License>): Promise<boolean> {
  const sql = getClient();
  if (!sql) return false;

  try {
    const current = await getLicenseByKey(key);
    if (!current) return false;

    const newMachineId = updates.machineId !== undefined ? updates.machineId : current.machineId;
    const newStatus = updates.status !== undefined ? updates.status : current.status;
    const newExpiresAt = updates.expiresAt !== undefined ? updates.expiresAt : current.expiresAt;
    const newPlan = updates.plan !== undefined ? updates.plan : current.plan;
    const newType = updates.type !== undefined ? updates.type : current.type;
    const lastVerified = updates.lastVerifiedAt !== undefined ? updates.lastVerifiedAt : current.lastVerifiedAt;
    const activatedAt = updates.activatedAt !== undefined ? updates.activatedAt : current.activatedAt;

    await sql`
      UPDATE licenses 
      SET 
        machine_id = ${newMachineId},
        status = ${newStatus},
        expires_at = ${newExpiresAt},
        plan = ${newPlan},
        type = ${newType},
        last_verified_at = ${lastVerified ? new Date(lastVerified) : null},
        activated_at = ${activatedAt ? new Date(activatedAt) : null}
      WHERE UPPER(key) = UPPER(${key});
    `;
    return true;
  } catch (err: any) {
    console.error('[Neon Postgres] updateLicense error:', err.message);
    return false;
  }
}

export async function deleteLicense(key: string): Promise<boolean> {
  const sql = getClient();
  if (!sql) return false;

  try {
    const res = await sql`DELETE FROM licenses WHERE UPPER(key) = UPPER(${key}) RETURNING key;`;
    return res && res.length > 0;
  } catch (err: any) {
    console.error('[Neon Postgres] deleteLicense error:', err.message);
    return false;
  }
}

export async function getStats(): Promise<AdminStats | null> {
  const sql = getClient();
  if (!sql) return null;

  try {
    const statsRes = await sql`
      SELECT 
        COUNT(*)::int AS total,
        COUNT(*) FILTER (WHERE status = 'ACTIVE' AND machine_id IS NOT NULL)::int AS active,
        COUNT(*) FILTER (WHERE status = 'ACTIVE' AND machine_id IS NULL)::int AS unactivated,
        COUNT(*) FILTER (WHERE status = 'REVOKED')::int AS revoked,
        COUNT(*) FILTER (WHERE plan = 'LIFETIME')::int AS lifetime
      FROM licenses;
    `;
    const ver = await getVersionConfig();
    const s = statsRes[0] || {};

    return {
      total: s.total || 0,
      active: s.active || 0,
      unactivated: s.unactivated || 0,
      revoked: s.revoked || 0,
      lifetime: s.lifetime || 0,
      currentVersion: ver?.version || '1.0.0',
      downloadUrl: ver?.download_url || ver?.downloadUrl || '',
      dbProvider: 'Neon Postgres (Cloud)'
    };
  } catch (err: any) {
    console.error('[Neon Postgres] getStats error:', err.message);
    return null;
  }
}

export async function restoreDatabase(licensesList: License[], versionObj: VersionConfig): Promise<boolean> {
  const sql = getClient();
  if (!sql) return false;

  try {
    if (Array.isArray(licensesList)) {
      await sql`TRUNCATE TABLE licenses;`;
      for (const item of licensesList) {
        await createLicense(item);
      }
    }
    if (versionObj && versionObj.version) {
      await updateVersionConfig(versionObj);
    }
    return true;
  } catch (err: any) {
    console.error('[Neon Postgres] restoreDatabase error:', err.message);
    return false;
  }
}
