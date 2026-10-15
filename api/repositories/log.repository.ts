/**
 * Activation Log Repository - Implements Neon DB with File/Memory Fallback
 */

import fs from 'fs';
import path from 'path';
import * as neonDb from '../db';
import type { ActivationLog } from '../../types/index';
import { LOCAL_DATA_DIR } from '../config/constants';

let memoryLogs: ActivationLog[] | null = null;

export async function getFallbackLogs(key: string = '', limit: number = 50): Promise<ActivationLog[]> {
  if (!memoryLogs) {
    const logPath = path.join(LOCAL_DATA_DIR, 'activation_logs.json');
    try {
      if (fs.existsSync(logPath)) {
        const content = fs.readFileSync(logPath, 'utf8');
        memoryLogs = JSON.parse(content);
      }
    } catch (e) {}
    if (!Array.isArray(memoryLogs)) memoryLogs = [];
  }

  let list = memoryLogs || [];
  if (key && key.trim()) {
    const upperKey = key.trim().toUpperCase();
    list = list.filter(l => (l.licenseKey || '').toUpperCase() === upperKey);
  }
  const lim = Math.min(Math.max(Number(limit) || 50, 1), 200);
  return list.slice(0, lim);
}

export async function saveFallbackLog(entry: Partial<ActivationLog>): Promise<ActivationLog> {
  if (!memoryLogs) await getFallbackLogs();
  const logItem: ActivationLog = {
    id: Date.now() + Math.floor(Math.random() * 1000),
    licenseKey: entry.licenseKey || '',
    machineId: entry.machineId || '',
    ipAddress: entry.ipAddress || '',
    status: entry.status || 'SUCCESS',
    message: entry.message || '',
    userAgent: entry.userAgent || '',
    createdAt: new Date().toISOString()
  };
  memoryLogs!.unshift(logItem);
  if (memoryLogs!.length > 500) memoryLogs = memoryLogs!.slice(0, 500);

  try {
    const logPath = path.join(LOCAL_DATA_DIR, 'activation_logs.json');
    const dir = path.dirname(logPath);
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
    fs.writeFileSync(logPath, JSON.stringify(memoryLogs, null, 2), 'utf8');
  } catch (e) {}
  return logItem;
}

export async function getLogs(key: string = '', limit: number = 50): Promise<ActivationLog[]> {
  if (neonDb.isNeonConfigured()) {
    try {
      const logs = await neonDb.getActivationLogs(key, limit);
      if (logs && logs.length > 0) return logs;
    } catch (e) {}
  }
  return await getFallbackLogs(key, limit);
}

export async function recordActivationLog(entry: Partial<ActivationLog>): Promise<ActivationLog> {
  if (neonDb.isNeonConfigured()) {
    try {
      await neonDb.logActivation({
        licenseKey: entry.licenseKey || '',
        machineId: entry.machineId || '',
        ipAddress: entry.ipAddress || '',
        status: entry.status || 'SUCCESS',
        message: entry.message || '',
        userAgent: entry.userAgent || ''
      });
    } catch (e) {}
  }
  return await saveFallbackLog(entry);
}
