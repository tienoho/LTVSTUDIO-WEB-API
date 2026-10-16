/**
 * License Repository - Implements Neon DB with File/Memory Fallback
 */

import fs from 'fs';
import path from 'path';
import crypto from 'crypto';
import * as neonDb from '../db';
import type { License } from '../../types/index';
import { LOCAL_DATA_DIR, TMP_DATA_DIR, DEFAULT_LICENSES } from '../config/constants';

let memoryLicenses: License[] | null = null;

export async function getFallbackLicenses(): Promise<License[]> {
  if (memoryLicenses) return memoryLicenses;

  const pathsToTry = [
    path.join(LOCAL_DATA_DIR, 'licenses.json'),
    path.join(TMP_DATA_DIR, 'licenses.json')
  ];

  for (const p of pathsToTry) {
    try {
      if (fs.existsSync(/*turbopackIgnore: true*/ p)) {
        const content = fs.readFileSync(/*turbopackIgnore: true*/ p, 'utf8');
        const parsed = JSON.parse(content);
        if (Array.isArray(parsed) && parsed.length > 0) {
          memoryLicenses = parsed;
          return parsed;
        }
      }
    } catch (e) {}
  }

  memoryLicenses = JSON.parse(JSON.stringify(DEFAULT_LICENSES));
  await saveFallbackLicenses(memoryLicenses!);
  return memoryLicenses!;
}

export async function saveFallbackLicenses(licenses: License[]): Promise<void> {
  memoryLicenses = licenses;
  const pathsToTry = [
    path.join(LOCAL_DATA_DIR, 'licenses.json'),
    path.join(TMP_DATA_DIR, 'licenses.json')
  ];

  for (const p of pathsToTry) {
    try {
      const dir = path.dirname(p);
      if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
      fs.writeFileSync(p, JSON.stringify(licenses, null, 2), 'utf8');
    } catch (e) {}
  }
}

export function generateKey(plan: string = 'PRO'): string {
  let prefix = 'LTV-PRO';
  if (plan === '1_YEAR') prefix = 'LTV-1Y';
  else if (plan === 'TRIAL') prefix = 'LTV-TRIL';
  else if (plan === 'ENTERPRISE') prefix = 'LTV-ENT';

  const part1 = crypto.randomBytes(3).toString('hex').toUpperCase();
  const part2 = crypto.randomBytes(3).toString('hex').toUpperCase();
  const part3 = crypto.randomBytes(3).toString('hex').toUpperCase();
  return `${prefix}-${part1}-${part2}-${part3}`;
}

export async function getAllLicenses(): Promise<License[]> {
  if (neonDb.isNeonConfigured()) {
    try {
      const dbLicenses = await neonDb.getLicenses();
      if (dbLicenses && dbLicenses.length > 0) return dbLicenses;
    } catch (e) {}
  }
  return await getFallbackLicenses();
}

export async function getLicenseByKey(key: string): Promise<License | null> {
  const cleanKey = (key || '').trim().toUpperCase();
  if (!cleanKey) return null;

  if (neonDb.isNeonConfigured()) {
    try {
      const item = await neonDb.getLicenseByKey(cleanKey);
      if (item) return item;
    } catch (e) {}
  }

  const list = await getFallbackLicenses();
  return list.find(l => l.key.toUpperCase() === cleanKey) || null;
}

export async function createLicensesBatch(newKeys: License[]): Promise<void> {
  if (neonDb.isNeonConfigured()) {
    try {
      await neonDb.createLicensesBatch(newKeys);
    } catch (e) {}
  }

  const currentList = await getFallbackLicenses();
  currentList.push(...newKeys);
  await saveFallbackLicenses(currentList);
}

export async function updateLicense(key: string, updates: Partial<License>): Promise<void> {
  const cleanKey = (key || '').trim().toUpperCase();
  if (neonDb.isNeonConfigured()) {
    try {
      await neonDb.updateLicense(cleanKey, updates);
    } catch (e) {}
  }

  const licenses = await getFallbackLicenses();
  const item = licenses.find(l => l.key.toUpperCase() === cleanKey);
  if (item) {
    Object.assign(item, updates);
    await saveFallbackLicenses(licenses);
  }
}

export async function deleteLicense(key: string): Promise<boolean> {
  const cleanKey = (key || '').trim().toUpperCase();
  if (neonDb.isNeonConfigured()) {
    try {
      return await neonDb.deleteLicense(cleanKey);
    } catch (e) {}
  }

  const licenses = await getFallbackLicenses();
  const initialLen = licenses.length;
  const filtered = licenses.filter(l => l.key.toUpperCase() !== cleanKey);
  if (filtered.length !== initialLen) {
    await saveFallbackLicenses(filtered);
    return true;
  }
  return false;
}
