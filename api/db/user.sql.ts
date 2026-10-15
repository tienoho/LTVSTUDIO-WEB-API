/**
 * User Account Database Operations (SQL)
 * Adheres to Single Responsibility Principle (SRP)
 */

import { getClient } from './connection';
import { mapUserRow } from './mappers';
import type { User } from '../../types/index';

export async function getAllDbUsers(): Promise<User[]> {
  const sql = getClient();
  if (!sql) return [];
  try {
    const rows = await sql`SELECT * FROM users ORDER BY id ASC;`;
    return rows.map((r: any) => mapUserRow(r)).filter((u: any): u is User => u !== null);
  } catch (err: any) {
    console.error('[Neon Postgres] getAllDbUsers error:', err.message);
    return [];
  }
}

export async function getDbUserByUsername(username: string): Promise<User | null> {
  const sql = getClient();
  if (!sql || !username) return null;
  try {
    const rows = await sql`SELECT * FROM users WHERE LOWER(username) = LOWER(${username.trim()}) LIMIT 1;`;
    if (!rows || rows.length === 0) return null;
    return mapUserRow(rows[0]);
  } catch (err: any) {
    console.error('[Neon Postgres] getDbUserByUsername error:', err.message);
    return null;
  }
}

export async function createDbUser(user: User): Promise<boolean> {
  const sql = getClient();
  if (!sql) return false;
  try {
    await sql`
      INSERT INTO users (username, password_hash, full_name, email, role, status, created_at, updated_at)
      VALUES (${user.username.trim().toLowerCase()}, ${user.passwordHash}, ${user.fullName || ''}, 
              ${user.email || ''}, ${user.role || 'Support'}, ${user.status || 'ACTIVE'}, NOW(), NOW());
    `;
    return true;
  } catch (err: any) {
    console.error('[Neon Postgres] createDbUser error:', err.message);
    return false;
  }
}

export async function updateDbUser(username: string, updates: Partial<User>): Promise<boolean> {
  const sql = getClient();
  if (!sql || !username) return false;
  try {
    const existing = await getDbUserByUsername(username);
    if (!existing) return false;

    const newFullName = updates.fullName !== undefined ? updates.fullName : existing.fullName;
    const newEmail = updates.email !== undefined ? updates.email : existing.email;
    const newRole = updates.role !== undefined ? updates.role : existing.role;
    const newStatus = updates.status !== undefined ? updates.status : existing.status;

    await sql`
      UPDATE users 
      SET full_name = ${newFullName || ''},
          email = ${newEmail || ''},
          role = ${newRole || 'Support'},
          status = ${newStatus || 'ACTIVE'},
          updated_at = NOW()
      WHERE LOWER(username) = LOWER(${username.trim()});
    `;
    return true;
  } catch (err: any) {
    console.error('[Neon Postgres] updateDbUser error:', err.message);
    return false;
  }
}

export async function updateDbUserPassword(username: string, newPasswordHash: string): Promise<boolean> {
  const sql = getClient();
  if (!sql || !username || !newPasswordHash) return false;
  try {
    await sql`
      UPDATE users 
      SET password_hash = ${newPasswordHash},
          updated_at = NOW()
      WHERE LOWER(username) = LOWER(${username.trim()});
    `;
    return true;
  } catch (err: any) {
    console.error('[Neon Postgres] updateDbUserPassword error:', err.message);
    return false;
  }
}

export async function updateDbUserLastLogin(username: string): Promise<boolean> {
  const sql = getClient();
  if (!sql || !username) return false;
  try {
    await sql`
      UPDATE users 
      SET last_login_at = NOW()
      WHERE LOWER(username) = LOWER(${username.trim()});
    `;
    return true;
  } catch (err: any) {
    console.error('[Neon Postgres] updateDbUserLastLogin error:', err.message);
    return false;
  }
}

export async function deleteDbUser(username: string): Promise<boolean> {
  const sql = getClient();
  if (!sql || !username) return false;
  try {
    await sql`DELETE FROM users WHERE LOWER(username) = LOWER(${username.trim()});`;
    return true;
  } catch (err: any) {
    console.error('[Neon Postgres] deleteDbUser error:', err.message);
    return false;
  }
}
