/**
 * LTVStudio Serverless Web API & License Manager
 * Supports Neon Postgres Cloud Database & Hybrid Local Fallback
 * Enhanced Security Edition: Timing-Attack Safe, Rate-Limited, Input-Sanitized, OWASP Hardened
 */

const fs = require('fs');
const path = require('path');
const url = require('url');
const crypto = require('crypto');
const neonDb = require('./db.js');

// Configuration
const ADMIN_SECRET = process.env.ADMIN_SECRET || 'ltvstudio_secret_admin_2026';

// Local / Serverless filesystem paths
const LOCAL_DATA_DIR = path.join(__dirname, '..', 'data');
const TMP_DATA_DIR = process.platform === 'win32' ? path.join(__dirname, '..', 'data') : '/tmp';

// Initial Seed Data
const DEFAULT_VERSION = {
  version: "1.0.0",
  changelog: "• Ra mắt phiên bản LTVStudio 1.0.0 Pro Edition\n• Tích hợp giọng đọc Microsoft Edge Neural (Hoài My, Nam Minh) siêu tự nhiên\n• Khắc phục hoàn toàn lỗi dịch thuật 50 dòng\n• Hỗ trợ xuất phụ đề Song Ngữ và tương thích font Premiere/CapCut",
  releaseNotes: "• Ra mắt phiên bản LTVStudio 1.0.0 Pro Edition\n• Tích hợp giọng đọc Microsoft Edge Neural (Hoài My, Nam Minh) siêu tự nhiên\n• Khắc phục hoàn toàn lỗi dịch thuật 50 dòng\n• Hỗ trợ xuất phụ đề Song Ngữ và tương thích font Premiere/CapCut",
  download_url: "https://www.mmo-tools.online/downloads/LTVStudio-Windows-Setup.exe",
  downloadUrl: "https://www.mmo-tools.online/downloads/LTVStudio-Windows-Setup.exe",
  force_update: false
};

const DEFAULT_LICENSES = [
  {
    key: "LTV-PRO-8888-9999-LIFETIME",
    type: "LTVStudio Pro Lifetime",
    plan: "LIFETIME",
    customer: "Khách hàng Danh Dự (VIP)",
    notes: "Key kích hoạt vĩnh viễn mặc định",
    machineId: null,
    status: "ACTIVE",
    createdAt: new Date().toISOString(),
    expiresAt: "LIFETIME",
    lastVerifiedAt: null
  },
  {
    key: "LTV-PRO-DEMO-TRIAL-7DAYS",
    type: "Bản dùng thử (Trial 7 ngày)",
    plan: "TRIAL",
    customer: "Người dùng Thử nghiệm",
    notes: "Key dùng thử trải nghiệm mẫu",
    machineId: null,
    status: "ACTIVE",
    createdAt: new Date().toISOString(),
    expiresAt: new Date(Date.now() + 7 * 86400000).toISOString(),
    lastVerifiedAt: null
  }
];

// In-Memory fallback cache
let memoryLicenses = null;
let memoryVersion = null;

// ── SECURITY HELPERS ─────────────────────────────────────────

// 1. In-Memory Sliding-Window Rate Limiter (Zero external dependencies)
const rateLimitMap = new Map();
function checkRateLimit(ip, limit = 120, windowMs = 60000) {
  const now = Date.now();
  let record = rateLimitMap.get(ip);
  if (!record || now > record.resetTime) {
    record = { count: 1, resetTime: now + windowMs };
    rateLimitMap.set(ip, record);
    return { allowed: true, remaining: limit - 1 };
  }
  record.count++;
  if (record.count > limit) {
    return { allowed: false, remaining: 0, retryAfter: Math.ceil((record.resetTime - now) / 1000) };
  }
  return { allowed: true, remaining: limit - record.count };
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

// 2. Timing-Safe String Comparison (Prevents Side-Channel Timing Attacks CWE-208)
function safeCompare(a, b) {
  if (typeof a !== 'string' || typeof b !== 'string') return false;
  const bufA = Buffer.from(a, 'utf8');
  const bufB = Buffer.from(b, 'utf8');
  if (bufA.length !== bufB.length) {
    // Constant time dummy check to avoid length leak timing
    crypto.timingSafeEqual(bufA, bufA);
    return false;
  }
  return crypto.timingSafeEqual(bufA, bufB);
}

// ── FALLBACK STORAGE (FILE / TMP / MEMORY) ────────────────────
async function getFallbackLicenses() {
  if (memoryLicenses) return memoryLicenses;

  const pathsToTry = [
    path.join(LOCAL_DATA_DIR, 'licenses.json'),
    path.join(TMP_DATA_DIR, 'ltvstudio_licenses.json')
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
  await saveFallbackLicenses(memoryLicenses);
  return memoryLicenses;
}

async function saveFallbackLicenses(licenses) {
  memoryLicenses = licenses;
  const pathsToTry = [
    path.join(LOCAL_DATA_DIR, 'licenses.json'),
    path.join(TMP_DATA_DIR, 'ltvstudio_licenses.json')
  ];

  for (const p of pathsToTry) {
    try {
      const dir = path.dirname(p);
      if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
      fs.writeFileSync(p, JSON.stringify(licenses, null, 2), 'utf8');
    } catch (e) {}
  }
}

async function getFallbackVersion() {
  if (memoryVersion) return memoryVersion;

  const pathsToTry = [
    path.join(LOCAL_DATA_DIR, 'version_config.json'),
    path.join(TMP_DATA_DIR, 'ltvstudio_version.json')
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
  return memoryVersion;
}

async function saveFallbackVersion(config) {
  memoryVersion = config;
  const pathsToTry = [
    path.join(LOCAL_DATA_DIR, 'version_config.json'),
    path.join(TMP_DATA_DIR, 'ltvstudio_version.json')
  ];

  for (const p of pathsToTry) {
    try {
      const dir = path.dirname(p);
      if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
      fs.writeFileSync(p, JSON.stringify(config, null, 2), 'utf8');
    } catch (e) {}
  }
}

function generateKey(plan) {
  const prefix = plan === 'LIFETIME' ? 'LTV-LIFE' : (plan === 'TRIAL' ? 'LTV-TRIL' : 'LTV-PRO');
  const part1 = crypto.randomBytes(3).toString('hex').toUpperCase();
  const part2 = crypto.randomBytes(3).toString('hex').toUpperCase();
  const part3 = crypto.randomBytes(3).toString('hex').toUpperCase();
  return `${prefix}-${part1}-${part2}-${part3}`;
}

// ── ACTIVATION AUDIT LOGS STORAGE (FALLBACK) ────────────────
let memoryLogs = null;

async function getFallbackLogs(key = '', limit = 50) {
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

  let list = memoryLogs;
  if (key && key.trim()) {
    const upperKey = key.trim().toUpperCase();
    list = list.filter(l => (l.licenseKey || '').toUpperCase() === upperKey);
  }
  const lim = Math.min(Math.max(parseInt(limit) || 50, 1), 200);
  return list.slice(0, lim);
}

async function saveFallbackLog(entry) {
  if (!memoryLogs) await getFallbackLogs();
  const logItem = {
    id: Date.now() + Math.floor(Math.random() * 1000),
    licenseKey: entry.licenseKey || '',
    machineId: entry.machineId || '',
    ipAddress: entry.ipAddress || '',
    status: entry.status || 'SUCCESS',
    message: entry.message || '',
    userAgent: entry.userAgent || '',
    createdAt: new Date().toISOString()
  };
  memoryLogs.unshift(logItem);
  if (memoryLogs.length > 500) memoryLogs = memoryLogs.slice(0, 500);

  try {
    const logPath = path.join(LOCAL_DATA_DIR, 'activation_logs.json');
    const dir = path.dirname(logPath);
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
    fs.writeFileSync(logPath, JSON.stringify(memoryLogs, null, 2), 'utf8');
  } catch (e) {}
  return logItem;
}

// ── SERVERLESS MAIN HANDLER ──────────────────────────────────
module.exports = async function handler(req, res) {
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
  const clientIp = (req.headers['x-forwarded-for'] || req.socket?.remoteAddress || '127.0.0.1').split(',')[0].trim();
  const rateLimit = checkRateLimit(clientIp, 150, 60000); // 150 reqs / min / IP
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

  const parsedUrl = url.parse(req.url, true);
  const pathname = parsedUrl.pathname.replace(/^\/api\/index\.js/, '/api');
  const query = parsedUrl.query;

  const sendJson = (status, data) => {
    res.statusCode = status;
    res.setHeader('Content-Type', 'application/json; charset=utf-8');
    res.end(JSON.stringify(data));
  };

  // 5. Safe Body Parser with Payload Size Limit (Prevents DoS CWE-400)
  const getBody = (maxBytes = 1048576) => new Promise((resolve, reject) => {
    if (req.body && typeof req.body === 'object') return resolve(req.body);
    let bodyStr = '';
    let received = 0;
    let rejected = false;

    req.on('data', chunk => {
      if (rejected) return;
      received += chunk.length;
      if (received > maxBytes) {
        rejected = true;
        req.removeAllListeners('data');
        req.resume(); // Drain the remainder so connection stays intact
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
    req.on('error', err => {
      if (!rejected) reject(err);
    });
  });

  // 6. Timing-Safe Admin Authentication
  
    const recordActivationLog = async (entry) => {
      try {
        if (useNeon) {
          await neonDb.logActivation(entry);
        } else {
          await saveFallbackLog(entry);
        }
      } catch (e) {
        console.error('[Audit Log Error]:', e.message);
      }
    };

    const isAuthorizedAdmin = () => {
    let provided = req.headers['x-admin-key'] || query.adminKey || '';
    const authHeader = req.headers['authorization'] || '';
    if (authHeader.startsWith('Bearer ')) {
      provided = authHeader.substring(7).trim();
    }
    return safeCompare(provided, ADMIN_SECRET);
  };

  try {
        // ── 0. HEALTH CHECK & MONITORING ENDPOINT (PUBLIC) ─────────
    if ((pathname === '/api/health' || pathname === '/api/status') && req.method === 'GET') {
      let dbHealth = { connected: true, driver: 'local_file_fallback', latencyMs: 0 };

      if (useNeon) {
        const nCheck = await neonDb.checkDbHealth();
        dbHealth = {
          connected: nCheck.connected,
          driver: 'neon_postgres',
          latencyMs: nCheck.latencyMs,
          error: nCheck.error || null
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

      return sendJson(200, {
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
      });
    }

    // ── 0.1 ADMIN: ACTIVATION AUDIT LOGS ───────────────────────
    if (pathname === '/api/admin/licenses/logs' && req.method === 'GET') {
      if (!isAuthorizedAdmin()) return sendJson(401, { error: 'Unauthorized: Sai mã admin secret' });

      const searchKey = (query.key || '').trim();
      const limit = parseInt(query.limit) || 50;
      let logs = [];

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
      const ver = useNeon ? (await neonDb.getVersionConfig() || DEFAULT_VERSION) : await getFallbackVersion();
      return sendJson(200, {
        version: ver.version,
        changelog: ver.changelog,
        releaseNotes: ver.changelog,
        download_url: ver.download_url || ver.downloadUrl,
        downloadUrl: ver.download_url || ver.downloadUrl,
        force_update: ver.force_update || false
      });
    }

    // ── 2. CLIENT AUTH VERIFY (HWID Lock) ─────────────────────
    if (pathname === '/api/auth/verify' && req.method === 'POST') {
      const body = await getBody(65536); // Max 64KB
      const licenseKey = (body.licenseKey || body.key || '').trim().toUpperCase().slice(0, 64);
      const machineId = (body.machineId || body.hwid || '').trim().slice(0, 128);
      const userAgent = (req.headers['user-agent'] || '').slice(0, 200);

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

      let found = null;
      if (useNeon) {
        found = await neonDb.getLicenseByKey(licenseKey);
      } else {
        const licenses = await getFallbackLicenses();
        found = licenses.find(l => l.key.toUpperCase() === licenseKey);
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
      const updates = { lastVerifiedAt: new Date().toISOString() };
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
      const searchKey = (query.key || '').trim().toUpperCase().slice(0, 64);
      if (!searchKey) {
        return sendJson(400, { error: 'Vui lòng cung cấp mã license key cần tra cứu' });
      }

      let found = null;
      if (useNeon) {
        found = await neonDb.getLicenseByKey(searchKey);
      } else {
        const licenses = await getFallbackLicenses();
        found = licenses.find(l => l.key.toUpperCase() === searchKey);
      }

      if (!found) {
        return sendJson(200, { exists: false, message: 'Không tìm thấy thông tin bản quyền này trong hệ thống.' });
      }

      let maskedHwid = null;
      if (found.machineId) {
        maskedHwid = found.machineId.length > 8
          ? found.machineId.substring(0, 4) + '-****-' + found.machineId.substring(found.machineId.length - 4)
          : 'Đã kích hoạt';
      }

      let daysLeft = 'Không giới hạn';
      if (found.expiresAt && found.expiresAt !== 'LIFETIME' && found.expiresAt !== 'Vĩnh viễn') {
        const diff = new Date(found.expiresAt).getTime() - Date.now();
        daysLeft = diff > 0 ? Math.ceil(diff / (1000 * 3600 * 24)) + ' ngày' : 'Đã hết hạn';
      }

      return sendJson(200, {
        exists: true,
        key: found.key,
        plan: found.plan,
        type: found.type,
        status: found.status,
        expiresAt: found.expiresAt === 'LIFETIME' ? 'Vĩnh viễn (Lifetime)' : found.expiresAt,
        daysLeft: daysLeft,
        isBound: !!found.machineId,
        maskedMachineId: maskedHwid,
        createdAt: found.createdAt
      });
    }

    // ── 4. ADMIN STATS ─────────────────────────────────────────
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

      return sendJson(200, {
        total,
        active,
        unactivated,
        revoked,
        lifetime,
        currentVersion: ver.version,
        downloadUrl: ver.download_url,
        dbProvider: 'Local JSON / Memory'
      });
    }

    // ── 5. ADMIN LIST LICENSES ─────────────────────────────────
    if (pathname === '/api/admin/licenses' && req.method === 'GET') {
      if (!isAuthorizedAdmin()) return sendJson(401, { error: 'Unauthorized' });

      const q = (query.search || '').trim().slice(0, 100);
      let status = (query.status || 'ALL').toUpperCase();
      const ALLOWED_STATUSES = ['ALL', 'ACTIVE', 'UNBOUND', 'REVOKED', 'EXPIRED'];
      if (!ALLOWED_STATUSES.includes(status)) status = 'ALL';
      let plan = (query.plan || 'ALL').toUpperCase();

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
      const ALLOWED_PLANS = ['LIFETIME', '1_YEAR', '1_MONTH', 'TRIAL'];
      if (!ALLOWED_PLANS.includes(plan)) plan = 'LIFETIME';

      const count = Math.min(Math.max(parseInt(body.count || 1, 10), 1), 50);
      const customer = (body.customer || 'Khách hàng').trim().slice(0, 100);
      const notes = (body.notes || '').trim().slice(0, 500);

      const createdKeys = [];
      for (let i = 0; i < count; i++) {
        let typeName = 'LTVStudio Pro Lifetime';
        let expiresAt = 'LIFETIME';

        const now = new Date();
        if (plan === 'TRIAL') {
          typeName = 'Bản dùng thử (Trial 7 ngày)';
          now.setDate(now.getDate() + 7);
          expiresAt = now.toISOString();
        } else if (plan === '1_MONTH') {
          typeName = 'LTVStudio Pro (1 Tháng)';
          now.setDate(now.getDate() + 30);
          expiresAt = now.toISOString();
        } else if (plan === '1_YEAR') {
          typeName = 'LTVStudio Pro (1 Năm)';
          now.setDate(now.getDate() + 365);
          expiresAt = now.toISOString();
        }

        const newKey = generateKey(plan);
        const item = {
          key: newKey,
          type: typeName,
          plan: plan,
          customer: count > 1 ? `${customer} #${i+1}` : customer,
          notes: notes,
          machineId: null,
          status: 'ACTIVE',
          createdAt: new Date().toISOString(),
          expiresAt: expiresAt,
          lastVerifiedAt: null
        };
        createdKeys.push(item);
      }

      if (useNeon) {
        await neonDb.createLicensesBatch(createdKeys);
      } else {
        const licenses = await getFallbackLicenses();
        licenses.push(...createdKeys);
        await saveFallbackLicenses(licenses);
      }

      return sendJson(200, { success: true, count: createdKeys.length, keys: createdKeys });
    }

    // ── 7. ADMIN RESET HWID ────────────────────────────────────
    if (pathname === '/api/admin/licenses/reset-hwid' && req.method === 'POST') {
      if (!isAuthorizedAdmin()) return sendJson(401, { error: 'Unauthorized' });
      const body = await getBody(65536);
      const key = (body.key || '').trim().toUpperCase().slice(0, 64);

      if (useNeon) {
        const success = await neonDb.updateLicense(key, { machineId: null });
        if (!success) return sendJson(404, { error: 'Không tìm thấy key' });
      } else {
        const licenses = await getFallbackLicenses();
        const item = licenses.find(l => l.key.toUpperCase() === key);
        if (!item) return sendJson(404, { error: 'Không tìm thấy key' });
        item.machineId = null;
        await saveFallbackLicenses(licenses);
      }

      return sendJson(200, { success: true, message: `Đã mở khóa Machine ID cho key ${key}! Khách có thể kích hoạt trên máy mới.` });
    }

    // ── 8. ADMIN TOGGLE STATUS ─────────────────────────────────
    if (pathname === '/api/admin/licenses/toggle-status' && req.method === 'POST') {
      if (!isAuthorizedAdmin()) return sendJson(401, { error: 'Unauthorized' });
      const body = await getBody(65536);
      const key = (body.key || '').trim().toUpperCase().slice(0, 64);

      let newStatus = 'ACTIVE';
      if (useNeon) {
        const item = await neonDb.getLicenseByKey(key);
        if (!item) return sendJson(404, { error: 'Không tìm thấy key' });
        newStatus = item.status === 'ACTIVE' ? 'REVOKED' : 'ACTIVE';
        await neonDb.updateLicense(key, { status: newStatus });
      } else {
        const licenses = await getFallbackLicenses();
        const item = licenses.find(l => l.key.toUpperCase() === key);
        if (!item) return sendJson(404, { error: 'Không tìm thấy key' });
        item.status = item.status === 'ACTIVE' ? 'REVOKED' : 'ACTIVE';
        newStatus = item.status;
        await saveFallbackLicenses(licenses);
      }

      return sendJson(200, { success: true, status: newStatus });
    }

    // ── 9. ADMIN EXTEND DURATION ───────────────────────────────
    if (pathname === '/api/admin/licenses/extend' && req.method === 'POST') {
      if (!isAuthorizedAdmin()) return sendJson(401, { error: 'Unauthorized' });
      const body = await getBody(65536);
      const key = (body.key || '').trim().toUpperCase().slice(0, 64);
      const days = Math.min(Math.max(parseInt(body.days || 30, 10), 1), 3650); // Max 10 years
      const makeLifetime = body.makeLifetime === true;

      let item = null;
      if (useNeon) {
        item = await neonDb.getLicenseByKey(key);
        if (!item) return sendJson(404, { error: 'Không tìm thấy key' });
      } else {
        const licenses = await getFallbackLicenses();
        item = licenses.find(l => l.key.toUpperCase() === key);
        if (!item) return sendJson(404, { error: 'Không tìm thấy key' });
      }

      let newPlan = item.plan;
      let newType = item.type;
      let newExpiresAt = item.expiresAt;

      if (makeLifetime) {
        newPlan = 'LIFETIME';
        newType = 'LTVStudio Pro Lifetime';
        newExpiresAt = 'LIFETIME';
      } else {
        const baseDate = (item.expiresAt && item.expiresAt !== 'LIFETIME' && item.expiresAt !== 'Vĩnh viễn')
          ? new Date(Math.max(new Date(item.expiresAt).getTime(), Date.now()))
          : new Date();
        baseDate.setDate(baseDate.getDate() + days);
        newExpiresAt = baseDate.toISOString();
      }

      const updates = { plan: newPlan, type: newType, expiresAt: newExpiresAt, status: 'ACTIVE' };

      if (useNeon) {
        await neonDb.updateLicense(key, updates);
      } else {
        const licenses = await getFallbackLicenses();
        const found = licenses.find(l => l.key.toUpperCase() === key);
        if (found) Object.assign(found, updates);
        await saveFallbackLicenses(licenses);
      }

      return sendJson(200, { success: true, item: { ...item, ...updates } });
    }

    // ── 10. ADMIN DELETE KEY ───────────────────────────────────
    if (pathname === '/api/admin/licenses/delete' && req.method === 'POST') {
      if (!isAuthorizedAdmin()) return sendJson(401, { error: 'Unauthorized' });
      const body = await getBody(65536);
      const key = (body.key || '').trim().toUpperCase().slice(0, 64);

      if (useNeon) {
        const ok = await neonDb.deleteLicense(key);
        if (!ok) return sendJson(404, { error: 'Không tìm thấy key' });
      } else {
        let licenses = await getFallbackLicenses();
        const initLen = licenses.length;
        licenses = licenses.filter(l => l.key.toUpperCase() !== key);
        if (licenses.length === initLen) return sendJson(404, { error: 'Không tìm thấy key' });
        await saveFallbackLicenses(licenses);
      }

      return sendJson(200, { success: true, message: `Đã xóa key ${key}` });
    }

    // ── 11. ADMIN VERSION MANAGEMENT ───────────────────────────
    if (pathname === '/api/admin/version') {
      if (!isAuthorizedAdmin()) return sendJson(401, { error: 'Unauthorized' });

      if (req.method === 'GET') {
        const ver = useNeon ? (await neonDb.getVersionConfig() || DEFAULT_VERSION) : await getFallbackVersion();
        return sendJson(200, ver);
      }
      if (req.method === 'POST') {
        const body = await getBody(131072); // Max 128KB
        const current = useNeon ? (await neonDb.getVersionConfig() || DEFAULT_VERSION) : await getFallbackVersion();
        const updated = {
          version: (body.version || current.version).slice(0, 32),
          changelog: (body.changelog !== undefined ? body.changelog : current.changelog).slice(0, 5000),
          releaseNotes: (body.changelog !== undefined ? body.changelog : current.changelog).slice(0, 5000),
          download_url: (body.download_url || current.download_url).slice(0, 1000),
          downloadUrl: (body.download_url || current.download_url).slice(0, 1000),
          force_update: body.force_update !== undefined ? !!body.force_update : current.force_update,
          updated_at: new Date().toISOString()
        };

        if (useNeon) {
          await neonDb.updateVersionConfig(updated);
        } else {
          await saveFallbackVersion(updated);
        }

        return sendJson(200, { success: true, config: updated });
      }
    }

    // ── 12. ADMIN BACKUP & RESTORE ─────────────────────────────
    if (pathname === '/api/admin/backup' && req.method === 'GET') {
      if (!isAuthorizedAdmin()) return sendJson(401, { error: 'Unauthorized' });
      const licenses = useNeon ? (await neonDb.getLicenses('', 'ALL')) : (await getFallbackLicenses());
      const version = useNeon ? (await neonDb.getVersionConfig()) : (await getFallbackVersion());
      return sendJson(200, {
        exportedAt: new Date().toISOString(),
        dbSource: useNeon ? 'Neon Postgres' : 'Local File',
        licenses: licenses || [],
        version: version || DEFAULT_VERSION
      });
    }

    if (pathname === '/api/admin/restore' && req.method === 'POST') {
      if (!isAuthorizedAdmin()) return sendJson(401, { error: 'Unauthorized' });
      const body = await getBody(5242880); // Max 5MB for backup restore

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
  } catch (error) {
    console.error('[API Server Error]:', error);
    if (error.message === 'PAYLOAD_TOO_LARGE') {
      return sendJson(413, { error: 'Payload Too Large', message: 'Dữ liệu gửi lên vượt quá dung lượng cho phép!' });
    }
    // Prevent internal sensitive leak (CWE-209)
    return sendJson(500, { error: 'Internal Server Error', message: 'Đã xảy ra lỗi trên máy chủ. Vui lòng thử lại sau!' });
  }
};
