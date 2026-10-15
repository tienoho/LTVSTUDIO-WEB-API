/**
 * Database Schema Initializer & Default Data Seeder
 * Adheres to Single Responsibility Principle (SRP)
 */

import { getClient } from './connection';
import type { License, VersionConfig, User } from '../../types/index';

let isInitialized = false;

export async function initDb(
  seedLicenses: License[] = [], 
  seedVersion: VersionConfig | null = null,
  seedUsers: User[] = []
): Promise<boolean> {
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

    // 4. Create table users (Role-Based Admin Accounts)
    await sql`
      CREATE TABLE IF NOT EXISTS users (
        id SERIAL PRIMARY KEY,
        username VARCHAR(64) UNIQUE NOT NULL,
        password_hash VARCHAR(255) NOT NULL,
        full_name VARCHAR(128) DEFAULT '',
        email VARCHAR(128) DEFAULT '',
        role VARCHAR(32) NOT NULL DEFAULT 'Support',
        status VARCHAR(32) NOT NULL DEFAULT 'ACTIVE',
        last_login_at TIMESTAMPTZ DEFAULT NULL,
        created_at TIMESTAMPTZ DEFAULT NOW(),
        updated_at TIMESTAMPTZ DEFAULT NOW()
      );
    `;
    await sql`CREATE INDEX IF NOT EXISTS idx_users_username ON users(username);`;
    await sql`CREATE INDEX IF NOT EXISTS idx_users_role ON users(role);`;

    // 5. Seed licenses if empty
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

    // 6. Seed version_config if empty
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

    // 7. Seed users if empty
    const userCountRes = await sql`SELECT COUNT(*)::int AS count FROM users;`;
    const userCount = userCountRes[0]?.count || 0;
    if (userCount === 0 && Array.isArray(seedUsers) && seedUsers.length > 0) {
      console.log(`[Neon Postgres] Seeding ${seedUsers.length} admin users into database...`);
      for (const u of seedUsers) {
        await sql`
          INSERT INTO users (username, password_hash, full_name, email, role, status, created_at, updated_at)
          VALUES (${u.username}, ${u.passwordHash}, ${u.fullName || ''}, ${u.email || ''}, 
                  ${u.role || 'Support'}, ${u.status || 'ACTIVE'}, NOW(), NOW())
          ON CONFLICT (username) DO NOTHING;
        `;
      }
    }

    isInitialized = true;
    console.log('[Neon Postgres] Connected and schema (licenses, version, logs, users) initialized successfully!');
    return true;
  } catch (err: any) {
    console.error('[Neon Postgres] Initialization error:', err.message);
    return false;
  }
}
