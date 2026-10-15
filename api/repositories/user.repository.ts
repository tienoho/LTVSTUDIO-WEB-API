/**
 * User Repository - Implements Neon DB with File/Memory Fallback
 */

import fs from 'fs';
import path from 'path';
import * as neonDb from '../db';
import type { User } from '../../types/index';
import { LOCAL_DATA_DIR, TMP_DATA_DIR, DEFAULT_USERS } from '../config/constants';

let memoryUsers: User[] | null = null;

export async function getFallbackUsers(): Promise<User[]> {
  if (memoryUsers) return memoryUsers;
  const pathsToTry = [
    path.join(LOCAL_DATA_DIR, 'users.json'),
    path.join(TMP_DATA_DIR, 'users.json')
  ];

  for (const p of pathsToTry) {
    try {
      if (fs.existsSync(p)) {
        const content = fs.readFileSync(p, 'utf8');
        const parsed = JSON.parse(content);
        if (Array.isArray(parsed) && parsed.length > 0) {
          memoryUsers = parsed;
          return parsed;
        }
      }
    } catch (e) {}
  }

  memoryUsers = JSON.parse(JSON.stringify(DEFAULT_USERS));
  await saveFallbackUsers(memoryUsers!);
  return memoryUsers!;
}

export async function saveFallbackUsers(users: User[]): Promise<void> {
  memoryUsers = users;
  const pathsToTry = [
    path.join(LOCAL_DATA_DIR, 'users.json'),
    path.join(TMP_DATA_DIR, 'users.json')
  ];

  for (const p of pathsToTry) {
    try {
      const dir = path.dirname(p);
      if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
      fs.writeFileSync(p, JSON.stringify(users, null, 2), 'utf8');
    } catch (e) {}
  }
}

export async function getAllUsers(): Promise<User[]> {
  if (neonDb.isNeonConfigured()) {
    try {
      const dbUsers = await neonDb.getAllDbUsers();
      if (dbUsers && dbUsers.length > 0) return dbUsers;
    } catch (e) {}
  }
  return await getFallbackUsers();
}

export async function getUserByUsername(username: string): Promise<User | null> {
  if (!username) return null;
  const clean = username.trim().toLowerCase();
  if (neonDb.isNeonConfigured()) {
    try {
      const dbUser = await neonDb.getDbUserByUsername(clean);
      if (dbUser) return dbUser;
    } catch (e) {}
  }
  const users = await getFallbackUsers();
  return users.find(u => u.username.toLowerCase() === clean) || null;
}

export async function createUser(user: User): Promise<boolean> {
  if (neonDb.isNeonConfigured()) {
    try {
      await neonDb.createDbUser(user);
    } catch (e) {}
  }
  const users = await getFallbackUsers();
  const exists = users.find(u => u.username.toLowerCase() === user.username.toLowerCase());
  if (exists) return false;
  users.push({
    ...user,
    id: users.length > 0 ? Math.max(...users.map(u => u.id || 0)) + 1 : 1,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  });
  await saveFallbackUsers(users);
  return true;
}

export async function updateUser(username: string, updates: Partial<User>): Promise<boolean> {
  if (neonDb.isNeonConfigured()) {
    try {
      await neonDb.updateDbUser(username, updates);
    } catch (e) {}
  }
  const users = await getFallbackUsers();
  const idx = users.findIndex(u => u.username.toLowerCase() === username.toLowerCase());
  if (idx === -1) return false;
  users[idx] = {
    ...users[idx],
    ...updates,
    updatedAt: new Date().toISOString()
  };
  await saveFallbackUsers(users);
  return true;
}

export async function updateUserPassword(username: string, newPasswordHash: string): Promise<boolean> {
  if (neonDb.isNeonConfigured()) {
    try {
      await neonDb.updateDbUserPassword(username, newPasswordHash);
    } catch (e) {}
  }
  const users = await getFallbackUsers();
  const idx = users.findIndex(u => u.username.toLowerCase() === username.toLowerCase());
  if (idx === -1) return false;
  users[idx].passwordHash = newPasswordHash;
  users[idx].updatedAt = new Date().toISOString();
  await saveFallbackUsers(users);
  return true;
}

export async function updateUserLastLogin(username: string): Promise<boolean> {
  if (neonDb.isNeonConfigured()) {
    try {
      await neonDb.updateDbUserLastLogin(username);
    } catch (e) {}
  }
  const users = await getFallbackUsers();
  const idx = users.findIndex(u => u.username.toLowerCase() === username.toLowerCase());
  if (idx === -1) return false;
  users[idx].lastLoginAt = new Date().toISOString();
  await saveFallbackUsers(users);
  return true;
}

export async function deleteUser(username: string): Promise<boolean> {
  if (neonDb.isNeonConfigured()) {
    try {
      await neonDb.deleteDbUser(username);
    } catch (e) {}
  }
  const users = await getFallbackUsers();
  const filtered = users.filter(u => u.username.toLowerCase() !== username.toLowerCase());
  if (filtered.length === users.length) return false;
  await saveFallbackUsers(filtered);
  return true;
}
