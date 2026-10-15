/**
 * Health & Metrics Controller - System Health Diagnostics & Admin KPI Stats
 */

import { HttpContext } from '../http/context';
import * as licenseRepo from '../repositories/license.repository';
import * as versionRepo from '../repositories/version.repository';
import * as neonDb from '../db';
import type { HealthResponse, DbHealth, AdminStats } from '../../types/index';

export class HealthController {
  public static async getHealth(ctx: HttpContext): Promise<void> {
    const startTime = Date.now();
    const useNeon = neonDb.isNeonConfigured();
    let dbStatus = 'healthy';
    let dbLatencyMs = 0;
    let totalCount = 0;
    let activeCount = 0;

    if (useNeon) {
      try {
        const stats = await neonDb.getStats();
        dbLatencyMs = Date.now() - startTime;
        totalCount = stats?.total || 0;
        activeCount = stats?.active || 0;
      } catch (err: any) {
        dbStatus = 'degraded';
        dbLatencyMs = Date.now() - startTime;
      }
    } else {
      const fallbackList = await licenseRepo.getFallbackLicenses();
      totalCount = fallbackList.length;
      activeCount = fallbackList.filter(l => !!l.machineId).length;
    }

    const dbHealth: DbHealth = {
      connected: useNeon ? dbStatus === 'healthy' : true,
      driver: useNeon ? 'neon_postgres' : 'local_file_fallback',
      latencyMs: dbLatencyMs,
      error: dbStatus === 'degraded' ? 'Database connection degraded, using active memory cache' : undefined
    };

    const healthRes: HealthResponse = {
      status: dbStatus === 'healthy' ? 'healthy' : 'degraded',
      service: 'LTVStudio Web API',
      version: '1.0.0',
      uptimeSeconds: Math.floor(process.uptime()),
      timestamp: new Date().toISOString(),
      database: dbHealth,
      stats: {
        totalLicenses: totalCount,
        activeLicenses: activeCount
      }
    };

    return ctx.sendJson(200, healthRes);
  }

  public static async getStats(ctx: HttpContext): Promise<void> {
    const auth = ctx.requireAdminRole(['SuperAdmin', 'Support', 'Auditor']);
    if (!auth.ok) return;

    if (neonDb.isNeonConfigured()) {
      try {
        const stats = await neonDb.getStats();
        return ctx.sendJson(200, { ...(stats || {}), dbProvider: 'Neon Postgres (Cloud)' });
      } catch (e) {}
    }

    const licenses = await licenseRepo.getFallbackLicenses();
    const ver = await versionRepo.getVersion();
    const total = licenses.length;
    const active = licenses.filter(l => l.status === 'ACTIVE' && l.machineId).length;
    const unactivated = licenses.filter(l => !l.machineId && l.status === 'ACTIVE').length;
    const revoked = licenses.filter(l => l.status === 'REVOKED').length;
    const lifetime = licenses.filter(l => l.plan === 'LIFETIME').length;

    const adminStats: AdminStats = {
      total,
      active,
      unactivated,
      revoked,
      lifetime,
      currentVersion: ver.version,
      downloadUrl: ver.download_url,
      dbProvider: 'Local JSON / Memory'
    };

    return ctx.sendJson(200, adminStats);
  }
}
