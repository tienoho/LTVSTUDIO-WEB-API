/**
 * Neon Postgres Database Layer for LTVStudio (TypeScript)
 * Supports @neondatabase/serverless and standard pg Pool
 */

import fs from 'fs';
import path from 'path';
import type { 
  License, 
  VersionConfig, 
  ActivationLog, 
  AdminStats, 
  DbHealth 
} from '../types/index';

// Dynamic Connection string from environment variables
export function getDatabaseUrl(): string {
  return process.env.DATABASE_URL || 
         process.env.POSTGRES_URL || 
         process.env.POSTGRES_PRISMA_URL || 
         process.env.POSTGRES_URL_NON_POOLING || 
         process.env.NEON_DATABASE_URL || '';
}

let sqlClient: any = null;
let isInitialized = false;

// Check if Neon is configured
export function isNeonConfigured(): boolean {
  const url = getDatabaseUrl();
  return !!url && (url.startsWith('postgres://') || url.startsWith('postgresql://'));
}

// Get Neon client
export function getClient(): any {
  if (sqlClient) return sqlClient;
  if (!isNeonConfigured()) return null;

  const connStr = getDatabaseUrl();

  try {
    // Dynamic require for serverless environment compatibility
    const { neon } = require('@neondatabase/serverless');
    sqlClient = neon(connStr);
    return sqlClient;
  } catch (err: any) {
    console.warn('[Neon Postgres] @neondatabase/serverless not available, falling back:', err.message);
    try {
      const { Pool } = require('pg');
      const pool = new Pool({ connectionString: connStr, ssl: { rejectUnauthorized: false } });
      sqlClient = async (strings: any, ...values: any[]) => {
        if (Array.isArray(strings) && (strings as any).raw) {
          let query = '';
          for (let i = 0; i < strings.length; i++) {
            query += strings[i];
            if (i < values.length) {
              query += `$${i + 1}`;
            }
          }
          const res = await pool.query(query, values);
          return res.rows;
        } else {
          const res = await pool.query(strings, values[0] || []);
          return res.rows;
        }
      };
      return sqlClient;
    } catch (e: any) {
      console.error('[Neon Postgres] Driver initialization failed:', e.message);
      return null;
    }
  }
}

// Helper map DB row to JS Object
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

// Initialize Database Schema & Seed Data
export async function initDb(seedLicenses: License[] = [], seedVersion: VersionConfig | null = null): Promise<boolean> {
  const sql = getClient();
  if (!sql) return false;
  if (isInitialized) return true;

  try {
    // 1. Create table licenses
    await sql`
      CREATE TABLE IF NOT EXISTS licenses (
        id SERIAL PRIMARY KEY,
        key VARCHAR(64) UNIQUE NOT NULL,
        type VARCHAR(100) NOT NULL,
        plan VARCHAR(32) NOT NULL,
        customer VARCHAR(255) DEFAULT '',
        notes TEXT DEFAULT '',
        machine_id VARCHAR(255) DEFAULT NULL,
        status VARCHAR(32) DEFAULT 'ACTIVE',
        created_at TIMESTAMPTZ DEFAULT NOW(),
        expires_at VARCHAR(64) DEFAULT 'LIFETIME',
        last_verified_at TIMESTAMPTZ DEFAULT NULL,
        activated_at TIMESTAMPTZ DEFAULT NULL
      );
    `;

    await sql`CREATE INDEX IF NOT EXISTS idx_licenses_key ON licenses(key);`;
    await sql`CREATE INDEX IF NOT EXISTS idx_licenses_status ON licenses(status);`;

    // 2. Create table version_config
    await sql`
      CREATE TABLE IF NOT EXISTS version_config (
        id INT PRIMARY KEY DEFAULT 1,
        version VARCHAR(32) NOT NULL,
        changelog TEXT DEFAULT '',
        download_url TEXT DEFAULT '',
        force_update BOOLEAN DEFAULT FALSE,
        updated_at TIMESTAMPTZ DEFAULT NOW()
      );
    `;

    // 3. Create table activation_logs (Audit Trail & Anti-Fraud)
    await sql`
      CREATE TABLE IF NOT EXISTS activation_logs (
        id SERIAL PRIMARY KEY,
        license_key VARCHAR(64) NOT NULL,
        machine_id VARCHAR(255) DEFAULT '',
        ip_address VARCHAR(64) DEFAULT '',
        status VARCHAR(32) NOT NULL,
        message TEXT DEFAULT '',
        user_agent TEXT DEFAULT '',
        created_at TIMESTAMPTZ DEFAULT NOW()
      );
    `;
    await sql`CREATE INDEX IF NOT EXISTS idx_logs_key ON activation_logs(license_key);`;
    await sql`CREATE INDEX IF NOT EXISTS idx_logs_created_at ON activation_logs(created_at);`;

    // 4. Seed licenses if empty
    const countRes = await sql`SELECT COUNT(*)::int AS count FROM licenses;`;
    const count = countRes[0]?.count || 0;

    if (count === 0 && Array.isArray(seedLicenses) && seedLicenses.length > 0) {
      console.log(`[Neon Postgres] Seeding ${seedLicenses.length} default licenses into database...`);
      for (const item of seedLicenses) {
        await sql`
          INSERT INTO licenses (key, type, plan, customer, notes, machine_id, status, expires_at, created_at)
          VALUES (${item.key}, ${item.type}, ${item.plan}, ${item.customer || ''}, ${item.notes || ''}, 
                  ${item.machineId || null}, ${item.status || 'ACTIVE'}, ${item.expiresAt || 'LIFETIME'}, NOW())
          ON CONFLICT (key) DO NOTHING;
        `;
      }
    }

    // 5. Seed version_config if empty
    const verRes = await sql`SELECT COUNT(*)::int AS count FROM version_config;`;
    if ((verRes[0]?.count || 0) === 0 && seedVersion) {
      await sql`
        INSERT INTO version_config (id, version, changelog, download_url, force_update, updated_at)
        VALUES (1, ${seedVersion.version || '1.0.0'}, ${seedVersion.changelog || ''}, 
                ${seedVersion.download_url || seedVersion.downloadUrl || ''}, 
                ${seedVersion.force_update || false}, NOW())
        ON CONFLICT (id) DO NOTHING;
      `;
    }

    isInitialized = true;
    console.log('[Neon Postgres] Connected and schema initialized successfully!');
    return true;
  } catch (err: any) {
    console.error('[Neon Postgres] Initialization error:', err.message);
    return false;
  }
}

// ── CRUD OPERATIONS ──────────────────────────────────────────

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

export async function getVersionConfig(): Promise<VersionConfig | null> {
  const sql = getClient();
  if (!sql) return null;

  try {
    const rows = await sql`SELECT * FROM version_config WHERE id = 1 LIMIT 1;`;
    if (!rows || rows.length === 0) return null;
    const r = rows[0];
    return {
      id: r.id,
      version: r.version,
      changelog: r.changelog,
      releaseNotes: r.changelog,
      download_url: r.download_url,
      downloadUrl: r.download_url,
      force_update: r.force_update,
      updated_at: r.updated_at ? new Date(r.updated_at).toISOString() : new Date().toISOString()
    };
  } catch (err: any) {
    console.error('[Neon Postgres] getVersionConfig error:', err.message);
    return null;
  }
}

export async function updateVersionConfig(config: Partial<VersionConfig>): Promise<boolean> {
  const sql = getClient();
  if (!sql) return false;

  try {
    const current = await getVersionConfig();
    const ver = config.version || current?.version || '1.0.0';
    const changelog = config.changelog !== undefined ? config.changelog : (current?.changelog || '');
    const dlUrl = config.download_url || config.downloadUrl || current?.download_url || '';
    const forceUpdate = config.force_update !== undefined ? config.force_update : (current?.force_update || false);

    await sql`
      INSERT INTO version_config (id, version, changelog, download_url, force_update, updated_at)
      VALUES (1, ${ver}, ${changelog}, ${dlUrl}, ${forceUpdate}, NOW())
      ON CONFLICT (id) DO UPDATE 
      SET 
        version = ${ver},
        changelog = ${changelog},
        download_url = ${dlUrl},
        force_update = ${forceUpdate},
        updated_at = NOW();
    `;
    return true;
  } catch (err: any) {
    console.error('[Neon Postgres] updateVersionConfig error:', err.message);
    return false;
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

// ── ACTIVATION AUDIT LOGS & HEALTH MONITOR ───────────────────

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

export async function checkDbHealth(): Promise<DbHealth> {
  const sql = getClient();
  if (!sql) {
    return { connected: false, driver: 'neon_postgres', error: 'Neon driver not configured', latencyMs: 0 };
  }

  const start = Date.now();
  try {
    await sql`SELECT 1;`;
    return { connected: true, driver: 'neon_postgres', latencyMs: Date.now() - start };
  } catch (err: any) {
    return { connected: false, driver: 'neon_postgres', error: err.message, latencyMs: Date.now() - start };
  }
}
