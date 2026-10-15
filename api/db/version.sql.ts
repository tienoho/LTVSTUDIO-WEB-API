/**
 * Version Configuration Database Operations (SQL)
 * Adheres to Single Responsibility Principle (SRP)
 */

import { getClient } from './connection';
import type { VersionConfig } from '../../types/index';

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
