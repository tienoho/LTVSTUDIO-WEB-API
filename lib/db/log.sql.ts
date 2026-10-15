/**
 * Activation Audit Logs Database Operations (SQL)
 * Adheres to Single Responsibility Principle (SRP)
 */

import { getClient } from './connection';
import type { ActivationLog } from '../../types/index';

export async function logActivation(entry: {
  licenseKey: string;
  machineId?: string;
  ipAddress?: string;
  status?: string;
  message?: string;
  userAgent?: string;
}): Promise<boolean> {
  const sql = getClient();
  if (!sql) return false;

  try {
    await sql`
      INSERT INTO activation_logs (license_key, machine_id, ip_address, status, message, user_agent, created_at)
      VALUES (${entry.licenseKey}, ${entry.machineId || ''}, ${entry.ipAddress || ''}, 
              ${entry.status || 'SUCCESS'}, ${entry.message || ''}, ${entry.userAgent || ''}, NOW());
    `;
    return true;
  } catch (err: any) {
    console.error('[Neon Postgres] logActivation error:', err.message);
    return false;
  }
}

export async function getActivationLogs(key: string = '', limit: number = 50): Promise<ActivationLog[]> {
  const sql = getClient();
  if (!sql) return [];

  try {
    const lim = Math.min(Math.max(Number(limit) || 50, 1), 200);
    let rows: any[];
    if (key && key.trim()) {
      rows = await sql`
        SELECT * FROM activation_logs 
        WHERE UPPER(license_key) = UPPER(${key.trim()})
        ORDER BY id DESC 
        LIMIT ${lim};
      `;
    } else {
      rows = await sql`
        SELECT * FROM activation_logs 
        ORDER BY id DESC 
        LIMIT ${lim};
      `;
    }

    return rows.map(r => ({
      id: r.id,
      licenseKey: r.license_key,
      machineId: r.machine_id || '',
      ipAddress: r.ip_address || '',
      status: r.status,
      message: r.message || '',
      userAgent: r.user_agent || '',
      createdAt: r.created_at ? new Date(r.created_at).toISOString() : new Date().toISOString()
    }));
  } catch (err: any) {
    console.error('[Neon Postgres] getActivationLogs error:', err.message);
    return [];
  }
}
