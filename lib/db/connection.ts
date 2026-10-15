/**
 * Neon Postgres Connection Provider & Driver Lifecycle Manager
 * Adheres to Single Responsibility Principle (SRP)
 */

import type { DbHealth } from '../../types/index';

let sqlClient: any = null;

export function getDatabaseUrl(): string {
  return process.env.DATABASE_URL || 
         process.env.POSTGRES_URL || 
         process.env.POSTGRES_PRISMA_URL || 
         process.env.POSTGRES_URL_NON_POOLING || 
         process.env.NEON_DATABASE_URL || '';
}

export function isNeonConfigured(): boolean {
  const url = getDatabaseUrl();
  return !!url && (url.startsWith('postgres://') || url.startsWith('postgresql://'));
}

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
