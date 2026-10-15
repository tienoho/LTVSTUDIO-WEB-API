/**
 * Version Repository - Implements Neon DB with File/Memory Fallback
 */

import fs from 'fs';
import path from 'path';
import * as neonDb from '../db';
import type { VersionConfig } from '../../types/index';
import { LOCAL_DATA_DIR, TMP_DATA_DIR, DEFAULT_VERSION } from '../config/constants';

let memoryVersion: VersionConfig | null = null;

export async function getFallbackVersion(): Promise<VersionConfig> {
  if (memoryVersion) return memoryVersion;

  const pathsToTry = [
    path.join(LOCAL_DATA_DIR, 'version_config.json'),
    path.join(TMP_DATA_DIR, 'version_config.json')
  ];

  for (const p of pathsToTry) {
    try {
      if (fs.existsSync(p)) {
        const content = fs.readFileSync(p, 'utf8');
        const parsed = JSON.parse(content);
        if (parsed && parsed.version) {
          memoryVersion = parsed;
          return parsed;
        }
      }
    } catch (e) {}
  }

  memoryVersion = JSON.parse(JSON.stringify(DEFAULT_VERSION));
  await saveFallbackVersion(memoryVersion!);
  return memoryVersion!;
}

export async function saveFallbackVersion(ver: VersionConfig): Promise<void> {
  memoryVersion = ver;
  const pathsToTry = [
    path.join(LOCAL_DATA_DIR, 'version_config.json'),
    path.join(TMP_DATA_DIR, 'version_config.json')
  ];

  for (const p of pathsToTry) {
    try {
      const dir = path.dirname(p);
      if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
      fs.writeFileSync(p, JSON.stringify(ver, null, 2), 'utf8');
    } catch (e) {}
  }
}

export async function getVersion(): Promise<VersionConfig> {
  if (neonDb.isNeonConfigured()) {
    try {
      const ver = await neonDb.getVersionConfig();
      if (ver) return ver;
    } catch (e) {}
  }
  return await getFallbackVersion();
}

export async function updateVersion(updateData: Partial<VersionConfig>): Promise<void> {
  if (neonDb.isNeonConfigured()) {
    try {
      await neonDb.updateVersionConfig(updateData);
    } catch (e) {}
  }

  const current = await getFallbackVersion();
  Object.assign(current, updateData);
  await saveFallbackVersion(current);
}
