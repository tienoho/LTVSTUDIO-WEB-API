/**
 * LTVStudio Serverless API & License Hub (TypeScript)
 * SOLID Architecture: Clean Facade, Re-exports & Serverless Entry Point
 */

import http from 'http';
import * as neonDb from './db';
import { HttpContext } from './http/context';
import { checkRateLimit } from './security/rate-limiter';
import { routeRequest } from './http/router';
import { DEFAULT_LICENSES, DEFAULT_VERSION, DEFAULT_USERS } from './config/constants';

// Re-export Security & Auth functions for backwards compatibility with tests and external consumers
export { safeCompare, validateHwid, generateLicenseSignature } from './security/crypto';
export {
  ROLE_PERMISSIONS,
  isSecretValid,
  validateRoleCredentials,
  AdminSessionData,
  createAdminSessionToken,
  parseAdminSessionToken,
  verifyAdminSessionToken
} from './security/auth';

// Non-blocking asynchronous Database Schema initialization (Neon Postgres)
if (neonDb.isNeonConfigured()) {
  neonDb.initDb(DEFAULT_LICENSES, DEFAULT_VERSION, DEFAULT_USERS).catch(err => {
    console.error('[Neon Postgres] Auto-init background error:', err.message);
  });
}

/**
 * Main Serverless HTTP Entry Point
 */
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

  const ctx = new HttpContext(req, res);

  // 3. CWE-598 Mitigation: Prohibit Sensitive Admin Credentials in Query Parameters
  if (ctx.query.adminKey || ctx.query.adminkey || ctx.query.password || ctx.query.secret) {
    return ctx.sendJson(400, {
      error: 'BadRequest',
      message: 'Vì lý do bảo mật (CWE-598), không được phép truyền mật khẩu qua URL (Query Parameter). Vui lòng sử dụng HTTP Header x-admin-key hoặc Authorization: Bearer <token>.'
    });
  }

  // 4. In-Memory Sliding-Window General Rate Limiting (CWE-799)
  const rateLimit = checkRateLimit(ctx.clientIp, 180, 60000);
  if (!rateLimit.allowed) {
    return ctx.sendJson(429, {
      error: 'Too Many Requests',
      message: 'Bạn đã gửi quá nhiều yêu cầu đến máy chủ trong thời gian ngắn. Vui lòng thử lại sau giây lát!',
      retryAfter: rateLimit.retryAfter
    });
  }

  try {
    // 5. Dispatch Request to Decoupled Controller via Router
    await routeRequest(ctx);
  } catch (error: any) {
    console.error('[API Server Error]:', error);
    if (error.message === 'PAYLOAD_TOO_LARGE') {
      return ctx.sendJson(413, { error: 'Payload Too Large', message: 'Dữ liệu gửi lên vượt quá dung lượng cho phép!' });
    }
    return ctx.sendJson(500, { error: 'Internal Server Error', message: 'Đã xảy ra lỗi trên máy chủ. Vui lòng thử lại sau!' });
  }
}
