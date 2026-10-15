/**
 * LTVStudio Serverless API & License Hub (TypeScript)
 * Handles Version Check, HWID License Verification, Admin CRUD, Rate Limiting & Audit Trail
 */

import http from 'http';
import fs from 'fs';
import path from 'path';
import crypto from 'crypto';
import url from 'url';
import * as neonDb from './db';
import type { 
  License, 
  VersionConfig, 
  ActivationLog, 
  AdminStats, 
  HealthResponse 
} from '../types/index';

// Configuration & Secrets
const ADMIN_SECRET = process.env.ADMIN_SECRET || 'ltvstudio_secret_admin_2026';
const LOCAL_DATA_DIR = path.join(__dirname, '..', 'data');
const TMP_DATA_DIR = '/tmp';

// Default Seed Data
const DEFAULT_VERSION: VersionConfig = {
  version: "1.0.0",
  changelog: "• Bản phát hành chính thức LTVStudio v1.0.0\n• Tích hợp mô hình AI Expressive TTS cao cấp đa cảm xúc\n• Tối ưu hệ thống bóc tách phụ đề và dịch thuật siêu tốc\n• Hệ thống kiểm soát bản quyền HWID đám mây bảo mật cao",
  download_url: "https://github.com/ltvstudio/releases/releases/download/v1.0.0/LTVStudio_Setup.exe",
  force_update: false
};

const DEFAULT_LICENSES: License[] = [
  {
    key: "LTV-PRO-MASTER-2026-DEV",
    type: "LTVStudio Pro Lifetime (Developer Master)",
    plan: "LIFETIME",
    customer: "LTVStudio Internal Dev Team",
    notes: "Khóa Master Developer - Dùng cho kiểm thử hệ thống",
    machineId: null,
    status: "ACTIVE",
    createdAt: new Date().toISOString(),
    expiresAt: "LIFETIME",
    lastVerifiedAt: null
  },
  {
    key: "LTV-TRIL-SAMPLE-WEEK-001",
    type: "LTVStudio Trial (7 Ngày Trải Nghiệm)",
    plan: "TRIAL",
    customer: "Khách Hàng Dùng Thử",
    notes: "Mã kích hoạt mẫu 7 ngày",
    machineId: null,
    status: "ACTIVE",
    createdAt: new Date().toISOString(),
    expiresAt: new Date(Date.now() + 7 * 86400000).toISOString(),
    lastVerifiedAt: null
  }
];

// In-Memory fallback cache
let memoryLicenses: License[] | null = null;
let memoryVersion: VersionConfig | null = null;
let memoryLogs: ActivationLog[] | null = null;

// ── SECURITY HELPERS ─────────────────────────────────────────

// 1. In-Memory Sliding-Window Rate Limiter
interface RateRecord {
  count: number;
  resetTime: number;
}
const rateLimitMap = new Map<string, RateRecord>();

function checkRateLimit(ip: string, limit: number = 150, windowMs: number = 60000) {
  const now = Date.now();
  let record = rateLimitMap.get(ip);
  if (!record || now > record.resetTime) {
    record = { count: 1, resetTime: now + windowMs };
    rateLimitMap.set(ip, record);
    return { allowed: true, remaining: limit - 1, retryAfter: 0 };
  }
  record.count++;
  if (record.count > limit) {
    return { allowed: false, remaining: 0, retryAfter: Math.ceil((record.resetTime - now) / 1000) };
  }
  return { allowed: true, remaining: limit - record.count, retryAfter: 0 };
}

// Auto clean up stale rate limits
if (typeof setInterval !== 'undefined') {
  const timer = setInterval(() => {
    const now = Date.now();
    for (const [ip, rec] of rateLimitMap.entries()) {
      if (now > rec.resetTime) rateLimitMap.delete(ip);
    }
  }, 120000);
  if (timer.unref) timer.unref();
}

// 2. Timing-Safe String Comparison (CWE-208)
export function safeCompare(a: string, b: string): boolean {
  if (typeof a !== 'string' || typeof b !== 'string') return false;
  const bufA = Buffer.from(a, 'utf8');
  const bufB = Buffer.from(b, 'utf8');
  if (bufA.length !== bufB.length) {
    crypto.timingSafeEqual(bufA, bufA);
    return false;
  }
  return crypto.timingSafeEqual(bufA, bufB);
}

// ── FALLBACK STORAGE (FILE / TMP / MEMORY) ────────────────────
async function getFallbackLicenses(): Promise<License[]> {
  if (memoryLicenses) return memoryLicenses;

  const pathsToTry = [
    path.join(LOCAL_DATA_DIR, 'licenses.json'),
    path.join(TMP_DATA_DIR, 'licenses.json')
  ];

  for (const p of pathsToTry) {
    try {
      if (fs.existsSync(p)) {
        const content = fs.readFileSync(p, 'utf8');
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

async function saveFallbackLicenses(licenses: License[]): Promise<void> {
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

async function getFallbackVersion(): Promise<VersionConfig> {
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

async function saveFallbackVersion(ver: VersionConfig): Promise<void> {
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

async function getFallbackLogs(key: string = '', limit: number = 50): Promise<ActivationLog[]> {
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

async function saveFallbackLog(entry: Partial<ActivationLog>): Promise<ActivationLog> {
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

// Generate License Key with Crypto Entropy
function generateKey(plan: string = 'PRO'): string {
  let prefix = 'LTV-PRO';
  if (plan === '1_YEAR') prefix = 'LTV-1Y';
  else if (plan === 'TRIAL') prefix = 'LTV-TRIL';
  else if (plan === 'ENTERPRISE') prefix = 'LTV-ENT';

  const part1 = crypto.randomBytes(3).toString('hex').toUpperCase();
  const part2 = crypto.randomBytes(3).toString('hex').toUpperCase();
  const part3 = crypto.randomBytes(3).toString('hex').toUpperCase();
  return `${prefix}-${part1}-${part2}-${part3}`;
}

// ── SERVERLESS MAIN HANDLER ──────────────────────────────────
export default async function handler(req: http.IncomingMessage, res: http.ServerResponse): Promise<void> {
  // 1. OWASP Standard Defensive Security Headers
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('X-Frame-Options', 'SAMEORIGIN');
  res.setHeader('X-XSS-Protection', '1; mode=block');
  res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');

  // 2. CORS Headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization, x-admin-key');

  if (req.method === 'OPTIONS') {
    res.statusCode = 204;
    res.end();
    return;
  }

  // 3. Client IP Extraction & Rate Limiting (CWE-307 / CWE-799)
  const forwarded = req.headers['x-forwarded-for'];
  const clientIp = (typeof forwarded === 'string' ? forwarded.split(',')[0].trim() : req.socket?.remoteAddress || '127.0.0.1');
  const rateLimit = checkRateLimit(clientIp, 150, 60000);
  if (!rateLimit.allowed) {
    res.statusCode = 429;
    res.setHeader('Retry-After', rateLimit.retryAfter);
    res.setHeader('Content-Type', 'application/json; charset=utf-8');
    res.end(JSON.stringify({
      error: 'Too Many Requests',
      message: `Bạn đang gửi yêu cầu quá nhanh! Vui lòng thử lại sau ${rateLimit.retryAfter} giây.`
    }));
    return;
  }

  // 4. Ensure Neon Postgres DB is initialized if configured
  const useNeon = neonDb.isNeonConfigured();
  if (useNeon) {
    await neonDb.initDb(DEFAULT_LICENSES, DEFAULT_VERSION);
  }

  const parsedUrl = url.parse(req.url || '/', true);
  const pathname = (parsedUrl.pathname || '/').replace(/^\/api\/index\.js/, '/api');
  const query = parsedUrl.query;

  const sendJson = (status: number, data: any) => {
    res.statusCode = status;
    res.setHeader('Content-Type', 'application/json; charset=utf-8');
    res.end(JSON.stringify(data));
  };

  // 5. Safe Body Parser with Payload Size Limit (CWE-400)
  const getBody = (maxBytes: number = 1048576): Promise<any> => new Promise((resolve, reject) => {
    if ((req as any).body && typeof (req as any).body === 'object') return resolve((req as any).body);
    let bodyStr = '';
    let received = 0;
    let rejected = false;

    req.on('data', (chunk: any) => {
      if (rejected) return;
      received += chunk.length;
      if (received > maxBytes) {
        rejected = true;
        req.removeAllListeners('data');
        req.resume();
        return reject(new Error('PAYLOAD_TOO_LARGE'));
      }
      bodyStr += chunk;
    });
    req.on('end', () => {
      if (rejected) return;
      try {
        resolve(bodyStr ? JSON.parse(bodyStr) : {});
      } catch (err) {
        resolve({});
      }
    });
    req.on('error', (err: any) => {
      if (!rejected) reject(err);
    });
  });

  const recordActivationLog = async (entry: Partial<ActivationLog>) => {
    try {
      if (useNeon) {
        await neonDb.logActivation(entry as any);
      } else {
        await saveFallbackLog(entry);
      }
    } catch (e: any) {
      console.error('[Audit Log Error]:', e.message);
    }
  };

  // 6. Timing-Safe Admin Authentication
  const isAuthorizedAdmin = (): boolean => {
    let provided = (req.headers['x-admin-key'] as string) || (query.adminKey as string) || '';
    const authHeader = (req.headers['authorization'] as string) || '';
    if (authHeader.startsWith('Bearer ')) {
      provided = authHeader.substring(7).trim();
    }
    return safeCompare(provided, ADMIN_SECRET);
  };

  try {
    // ── 0. HEALTH CHECK & MONITORING ENDPOINT (PUBLIC) ─────────
    if ((pathname === '/api/health' || pathname === '/api/status') && req.method === 'GET') {
      let dbHealth: any = { connected: true, driver: 'local_file_fallback', latencyMs: 0 };

      if (useNeon) {
        const nCheck = await neonDb.checkDbHealth();
        dbHealth = {
          connected: nCheck.connected,
          driver: 'neon_postgres' as const,
          latencyMs: nCheck.latencyMs,
          ...(nCheck.error ? { error: nCheck.error } : {})
        };
      } else {
        const fbCheckStart = Date.now();
        await getFallbackVersion();
        dbHealth.latencyMs = Date.now() - fbCheckStart;
      }

      const versionInfo = useNeon ? await neonDb.getVersionConfig() : await getFallbackVersion();
      
      let totalCount = 0;
      let activeCount = 0;
      if (useNeon) {
        const s = await neonDb.getStats();
        totalCount = s?.total || 0;
        activeCount = s?.active || 0;
      } else {
        const lics = await getFallbackLicenses();
        totalCount = lics.length;
        activeCount = lics.filter(l => l.status === 'ACTIVE' && l.machineId).length;
      }

      const healthRes: HealthResponse = {
        status: dbHealth.connected ? 'healthy' : 'degraded',
        service: 'LTVStudio License & Cloud API',
        version: versionInfo?.version || '1.0.0',
        uptimeSeconds: Math.floor(process.uptime()),
        timestamp: new Date().toISOString(),
        database: dbHealth,
        stats: {
          totalLicenses: totalCount,
          activeLicenses: activeCount
        }
      };
      return sendJson(200, healthRes);
    }

    // ── 0.1 ADMIN: ACTIVATION AUDIT LOGS ───────────────────────
    if (pathname === '/api/admin/licenses/logs' && req.method === 'GET') {
      if (!isAuthorizedAdmin()) return sendJson(401, { error: 'Unauthorized: Sai mã admin secret' });

      const searchKey = ((query.key as string) || '').trim();
      const limit = parseInt(query.limit as string) || 50;
      let logs: ActivationLog[] = [];

      if (useNeon) {
        logs = await neonDb.getActivationLogs(searchKey, limit);
      } else {
        logs = await getFallbackLogs(searchKey, limit);
      }

      return sendJson(200, {
        success: true,
        count: logs.length,
        filterKey: searchKey || 'ALL',
        logs: logs
      });
    }

    // ── 1. CLIENT VERSION CHECK ───────────────────────────────
    if ((pathname === '/api/transform/version' || pathname === '/api/version') && req.method === 'GET') {
      const ver = useNeon ? await neonDb.getVersionConfig() : await getFallbackVersion();
      return sendJson(200, {
        version: ver?.version || '1.0.0',
        changelog: ver?.changelog || ver?.releaseNotes || 'Bản cập nhật tối ưu hiệu năng và sửa lỗi giao diện.',
        download_url: ver?.download_url || ver?.downloadUrl || 'https://github.com/ltvstudio/releases/releases',
        force_update: ver?.force_update || false
      });
    }

    // ── 2. LICENSE VALIDATION & HWID BINDING ───────────────────
    if (pathname === '/api/auth/verify' && req.method === 'POST') {
      const body = await getBody(65536);
      const licenseKey = (body.licenseKey || body.key || '').trim().toUpperCase().slice(0, 64);
      const machineId = (body.machineId || body.hwid || '').trim().slice(0, 128);
      const userAgent = ((req.headers['user-agent'] as string) || '').slice(0, 200);

      if (!licenseKey) {
        await recordActivationLog({ licenseKey: 'EMPTY', machineId, ipAddress: clientIp, status: 'INVALID', message: 'Chưa nhập mã license', userAgent });
        return sendJson(200, {
          isValid: false,
          licenseType: 'Chưa kích hoạt',
          expiresAt: null,
          machineId: machineId,
          message: 'Vui lòng nhập mã bản quyền (License Key).'
        });
      }

      let found: License | null = null;
      if (useNeon) {
        found = await neonDb.getLicenseByKey(licenseKey);
      } else {
        const licenses = await getFallbackLicenses();
        found = licenses.find(l => l.key.toUpperCase() === licenseKey) || null;
      }

      if (!found) {
        await recordActivationLog({ licenseKey, machineId, ipAddress: clientIp, status: 'NOT_FOUND', message: 'Mã không tồn tại', userAgent });
        return sendJson(200, {
          isValid: false,
          licenseType: 'Không xác định',
          expiresAt: null,
          machineId: machineId,
          message: 'Mã bản quyền không tồn tại trong hệ thống.'
        });
      }

      // Check Revoked
      if (found.status === 'REVOKED' || found.status === 'BANNED') {
        await recordActivationLog({ licenseKey, machineId, ipAddress: clientIp, status: 'REVOKED', message: 'Mã bản quyền đã bị khóa', userAgent });
        return sendJson(200, {
          isValid: false,
          licenseType: found.type,
          expiresAt: found.expiresAt,
          machineId: machineId,
          message: 'Mã bản quyền này đã bị khóa do vi phạm chính sách hoặc chia sẻ trái phép.'
        });
      }

      // Check Expiration
      if (found.expiresAt && found.expiresAt !== 'LIFETIME' && found.expiresAt !== 'Vĩnh viễn') {
        const expDate = new Date(found.expiresAt);
        if (expDate < new Date()) {
          found.status = 'EXPIRED';
          if (useNeon) {
            await neonDb.updateLicense(licenseKey, { status: 'EXPIRED' });
          } else {
            const licenses = await getFallbackLicenses();
            const item = licenses.find(l => l.key.toUpperCase() === licenseKey);
            if (item) item.status = 'EXPIRED';
            await saveFallbackLicenses(licenses);
          }

          await recordActivationLog({ licenseKey, machineId, ipAddress: clientIp, status: 'EXPIRED', message: 'Mã bản quyền đã hết hạn', userAgent });
          return sendJson(200, {
            isValid: false,
            licenseType: found.type,
            expiresAt: found.expiresAt,
            machineId: machineId,
            message: `Mã bản quyền đã hết hạn vào ngày ${expDate.toLocaleDateString('vi-VN')}. Vui lòng liên hệ Admin để gia hạn!`
          });
        }
      }

      // Check HWID Machine Lock
      const updates: Partial<License> = { lastVerifiedAt: new Date().toISOString() };
      if (machineId) {
        if (!found.machineId) {
          found.machineId = machineId;
          found.status = 'ACTIVE';
          found.activatedAt = new Date().toISOString();
          updates.machineId = machineId;
          updates.status = 'ACTIVE';
          updates.activatedAt = found.activatedAt;
        } else if (found.machineId !== machineId) {
          await recordActivationLog({ licenseKey, machineId, ipAddress: clientIp, status: 'WRONG_HWID', message: `Thiết bị không khớp (Đang gắn: ${found.machineId})`, userAgent });
          return sendJson(200, {
            isValid: false,
            licenseType: found.type,
            expiresAt: found.expiresAt,
            machineId: machineId,
            message: 'Bản quyền này đã được kích hoạt trên một thiết bị khác! Vui lòng liên hệ Admin để mở khóa chuyển máy.'
          });
        }
      }

      if (useNeon) {
        await neonDb.updateLicense(licenseKey, updates);
      } else {
        const licenses = await getFallbackLicenses();
        const item = licenses.find(l => l.key.toUpperCase() === licenseKey);
        if (item) Object.assign(item, updates);
        await saveFallbackLicenses(licenses);
      }

      await recordActivationLog({ licenseKey, machineId: found.machineId || machineId, ipAddress: clientIp, status: 'SUCCESS', message: 'Xác thực bản quyền thành công', userAgent });
      return sendJson(200, {
        isValid: true,
        licenseType: found.type || 'LTVStudio Pro Lifetime',
        expiresAt: found.expiresAt === 'LIFETIME' ? 'Không giới hạn (Lifetime)' : found.expiresAt,
        machineId: found.machineId || machineId,
        message: '✓ Bản quyền hợp lệ và đã kích hoạt thành công!'
      });
    }

    // ── 3. PUBLIC LICENSE LOOKUP ───────────────────────────────
    if (pathname === '/api/license/lookup' && req.method === 'GET') {
      const searchKey = ((query.key as string) || '').trim().toUpperCase().slice(0, 64);
      if (!searchKey) {
        return sendJson(400, { error: 'Vui lòng cung cấp mã bản quyền cần tra cứu' });
      }

      let found: License | null = null;
      if (useNeon) {
        found = await neonDb.getLicenseByKey(searchKey);
      } else {
        const licenses = await getFallbackLicenses();
        found = licenses.find(l => l.key.toUpperCase() === searchKey) || null;
      }

      if (!found) {
        return sendJson(200, {
          exists: false,
          message: 'Mã bản quyền không tồn tại trong hệ thống.'
        });
      }

      // Return public masked info
      return sendJson(200, {
        exists: true,
        key: found.key,
        plan: found.plan,
        type: found.type,
        status: found.status,
        expiresAt: found.expiresAt === 'LIFETIME' ? 'Vĩnh viễn (Lifetime)' : found.expiresAt,
        isActivated: !!found.machineId,
        maskedMachineId: found.machineId ? `${found.machineId.substring(0, 5)}--****--${found.machineId.substring(found.machineId.length - 3)}` : null,
        createdAt: found.createdAt
      });
    }

    // ── 4. ADMIN DASHBOARD STATS ───────────────────────────────
    if (pathname === '/api/admin/stats' && req.method === 'GET') {
      if (!isAuthorizedAdmin()) return sendJson(401, { error: 'Unauthorized: Sai mã admin secret' });

      if (useNeon) {
        const stats = await neonDb.getStats();
        return sendJson(200, { ...stats, dbProvider: 'Neon Postgres (Cloud)' });
      }

      const licenses = await getFallbackLicenses();
      const ver = await getFallbackVersion();
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
      return sendJson(200, adminStats);
    }

    // ── 5. ADMIN LIST LICENSES ─────────────────────────────────
    if (pathname === '/api/admin/licenses' && req.method === 'GET') {
      if (!isAuthorizedAdmin()) return sendJson(401, { error: 'Unauthorized' });

      const q = ((query.search as string) || '').trim().slice(0, 100);
      let status = ((query.status as string) || 'ALL').toUpperCase();
      const ALLOWED_STATUSES = ['ALL', 'ACTIVE', 'UNBOUND', 'REVOKED', 'EXPIRED'];
      if (!ALLOWED_STATUSES.includes(status)) status = 'ALL';
      let plan = ((query.plan as string) || 'ALL').toUpperCase();

      if (useNeon) {
        const licenses = await neonDb.getLicenses(q, status, plan);
        return sendJson(200, { licenses: licenses || [] });
      }

      const licenses = await getFallbackLicenses();
      let filtered = licenses;
      if (status === 'UNBOUND') {
        filtered = filtered.filter(l => l.status === 'ACTIVE' && !l.machineId);
      } else if (status !== 'ALL') {
        filtered = filtered.filter(l => l.status === status);
      }
      if (plan !== 'ALL') {
        filtered = filtered.filter(l => (l.plan || '').toUpperCase() === plan);
      }
      if (q) {
        const term = q.toLowerCase();
        filtered = filtered.filter(l =>
          (l.key && l.key.toLowerCase().includes(term)) ||
          (l.customer && l.customer.toLowerCase().includes(term)) ||
          (l.machineId && l.machineId.toLowerCase().includes(term)) ||
          (l.notes && l.notes.toLowerCase().includes(term))
        );
      }

      return sendJson(200, { licenses: filtered.slice().reverse() });
    }

    // ── 6. ADMIN CREATE KEY / BULK GENERATE ────────────────────
    if (pathname === '/api/admin/licenses/create' && req.method === 'POST') {
      if (!isAuthorizedAdmin()) return sendJson(401, { error: 'Unauthorized' });

      const body = await getBody(65536);
      let plan = (body.plan || 'LIFETIME').toUpperCase();
      const count = Math.min(Math.max(parseInt(body.count) || 1, 1), 100);
      const customer = (body.customer || '').trim().slice(0, 200);
      const notes = (body.notes || '').trim().slice(0, 500);

      let typeName = 'LTVStudio Pro Lifetime';
      let expiresAt = 'LIFETIME';

      if (plan === '1_YEAR') {
        typeName = 'LTVStudio Bản Quyền 1 Năm';
        expiresAt = new Date(Date.now() + 365 * 86400000).toISOString();
      } else if (plan === 'TRIAL') {
        typeName = 'LTVStudio Dùng Thử 7 Ngày';
        expiresAt = new Date(Date.now() + 7 * 86400000).toISOString();
      } else if (plan === 'ENTERPRISE') {
        typeName = 'LTVStudio Doanh Nghiệp (Enterprise)';
        expiresAt = 'LIFETIME';
      }

      const newKeys: License[] = [];
      for (let i = 0; i < count; i++) {
        newKeys.push({
          key: generateKey(plan),
          type: typeName,
          plan: plan,
          customer: customer,
          notes: notes,
          machineId: null,
          status: 'ACTIVE',
          createdAt: new Date().toISOString(),
          expiresAt: expiresAt,
          lastVerifiedAt: null
        });
      }

      if (useNeon) {
        await neonDb.createLicensesBatch(newKeys);
      } else {
        const currentList = await getFallbackLicenses();
        currentList.push(...newKeys);
        await saveFallbackLicenses(currentList);
      }

      return sendJson(200, {
        success: true,
        count: newKeys.length,
        keys: newKeys,
        message: `Đã tạo thành công ${newKeys.length} mã bản quyền mới!`
      });
    }

    // ── 7. ADMIN RESET HWID ────────────────────────────────────
    if (pathname === '/api/admin/licenses/reset-hwid' && req.method === 'POST') {
      if (!isAuthorizedAdmin()) return sendJson(401, { error: 'Unauthorized' });

      const body = await getBody(65536);
      const key = (body.key || '').trim().toUpperCase();

      if (useNeon) {
        await neonDb.updateLicense(key, { machineId: null });
      } else {
        const licenses = await getFallbackLicenses();
        const item = licenses.find(l => l.key.toUpperCase() === key);
        if (item) item.machineId = null;
        await saveFallbackLicenses(licenses);
      }

      return sendJson(200, { success: true, message: `Đã mở khóa thiết bị (Reset HWID) cho key ${key} thành công!` });
    }

    // ── 8. ADMIN TOGGLE STATUS ─────────────────────────────────
    if (pathname === '/api/admin/licenses/toggle-status' && req.method === 'POST') {
      if (!isAuthorizedAdmin()) return sendJson(401, { error: 'Unauthorized' });

      const body = await getBody(65536);
      const key = (body.key || '').trim().toUpperCase();

      let newStatus = 'ACTIVE';
      if (useNeon) {
        const current = await neonDb.getLicenseByKey(key);
        newStatus = current?.status === 'ACTIVE' ? 'REVOKED' : 'ACTIVE';
        await neonDb.updateLicense(key, { status: newStatus });
      } else {
        const licenses = await getFallbackLicenses();
        const item = licenses.find(l => l.key.toUpperCase() === key);
        if (item) {
          item.status = item.status === 'ACTIVE' ? 'REVOKED' : 'ACTIVE';
          newStatus = item.status;
        }
        await saveFallbackLicenses(licenses);
      }

      return sendJson(200, { success: true, status: newStatus, message: `Đã chuyển trạng thái key sang ${newStatus}` });
    }

    // ── 9. ADMIN EXTEND LICENSE ────────────────────────────────
    if (pathname === '/api/admin/licenses/extend' && req.method === 'POST') {
      if (!isAuthorizedAdmin()) return sendJson(401, { error: 'Unauthorized' });

      const body = await getBody(65536);
      const key = (body.key || '').trim().toUpperCase();
      const days = parseInt(body.days) || 30;

      let newExpiresAt = 'LIFETIME';
      if (body.lifetime) {
        newExpiresAt = 'LIFETIME';
      } else {
        let currentExp = new Date();
        let targetItem: License | null = null;
        if (useNeon) {
          targetItem = await neonDb.getLicenseByKey(key);
        } else {
          const lics = await getFallbackLicenses();
          targetItem = lics.find(l => l.key.toUpperCase() === key) || null;
        }

        if (targetItem && targetItem.expiresAt && targetItem.expiresAt !== 'LIFETIME') {
          const parsed = new Date(targetItem.expiresAt);
          if (parsed > new Date()) currentExp = parsed;
        }
        newExpiresAt = new Date(currentExp.getTime() + days * 86400000).toISOString();
      }

      if (useNeon) {
        await neonDb.updateLicense(key, { expiresAt: newExpiresAt, status: 'ACTIVE' });
      } else {
        const licenses = await getFallbackLicenses();
        const item = licenses.find(l => l.key.toUpperCase() === key);
        if (item) {
          item.expiresAt = newExpiresAt;
          item.status = 'ACTIVE';
        }
        await saveFallbackLicenses(licenses);
      }

      return sendJson(200, { success: true, expiresAt: newExpiresAt, message: `Đã gia hạn bản quyền đến: ${newExpiresAt}` });
    }

    // ── 10. ADMIN DELETE LICENSE ───────────────────────────────
    if (pathname === '/api/admin/licenses/delete' && req.method === 'POST') {
      if (!isAuthorizedAdmin()) return sendJson(401, { error: 'Unauthorized' });

      const body = await getBody(65536);
      const key = (body.key || '').trim().toUpperCase();

      if (useNeon) {
        await neonDb.deleteLicense(key);
      } else {
        let licenses = await getFallbackLicenses();
        licenses = licenses.filter(l => l.key.toUpperCase() !== key);
        await saveFallbackLicenses(licenses);
      }

      return sendJson(200, { success: true, message: `Đã xóa mã bản quyền ${key} thành công!` });
    }

    // ── 11. ADMIN GET / UPDATE VERSION CONFIG ──────────────────
    if (pathname === '/api/admin/version') {
      if (!isAuthorizedAdmin()) return sendJson(401, { error: 'Unauthorized' });

      if (req.method === 'GET') {
        const ver = useNeon ? await neonDb.getVersionConfig() : await getFallbackVersion();
        return sendJson(200, ver || {});
      }

      if (req.method === 'POST') {
        const body = await getBody(131072);
        const updateData: Partial<VersionConfig> = {
          version: body.version,
          changelog: body.changelog || body.releaseNotes,
          download_url: body.download_url || body.downloadUrl,
          force_update: !!body.force_update,
          updated_at: new Date().toISOString()
        };

        if (useNeon) {
          await neonDb.updateVersionConfig(updateData);
        } else {
          const current = await getFallbackVersion();
          Object.assign(current, updateData);
          await saveFallbackVersion(current);
        }

        return sendJson(200, { success: true, message: 'Đã cập nhật thông tin phiên bản thành công!' });
      }
    }

    // ── 12. ADMIN BACKUP DATABASE ──────────────────────────────
    if (pathname === '/api/admin/backup' && req.method === 'GET') {
      if (!isAuthorizedAdmin()) return sendJson(401, { error: 'Unauthorized' });

      const licenses = useNeon ? await neonDb.getLicenses() : await getFallbackLicenses();
      const version = useNeon ? await neonDb.getVersionConfig() : await getFallbackVersion();

      return sendJson(200, {
        exportedAt: new Date().toISOString(),
        totalLicenses: licenses?.length || 0,
        version: version,
        licenses: licenses
      });
    }

    // ── 13. ADMIN RESTORE DATABASE ─────────────────────────────
    if (pathname === '/api/admin/restore' && req.method === 'POST') {
      if (!isAuthorizedAdmin()) return sendJson(401, { error: 'Unauthorized' });

      const body = await getBody(5242880);

      if (useNeon) {
        await neonDb.restoreDatabase(body.licenses, body.version);
      } else {
        if (Array.isArray(body.licenses)) {
          await saveFallbackLicenses(body.licenses);
        }
        if (body.version && body.version.version) {
          await saveFallbackVersion(body.version);
        }
      }

      return sendJson(200, { success: true, message: 'Đã khôi phục dữ liệu thành công!' });
    }

    return sendJson(404, { error: 'API route not found', path: pathname });
  } catch (error: any) {
    console.error('[API Server Error]:', error);
    if (error.message === 'PAYLOAD_TOO_LARGE') {
      return sendJson(413, { error: 'Payload Too Large', message: 'Dữ liệu gửi lên vượt quá dung lượng cho phép!' });
    }
    return sendJson(500, { error: 'Internal Server Error', message: 'Đã xảy ra lỗi trên máy chủ. Vui lòng thử lại sau!' });
  }
}
