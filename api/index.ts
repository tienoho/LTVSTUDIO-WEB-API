/**
 * LTVStudio Serverless API & License Hub (TypeScript)
 * SOLID Architecture: Clean Facade, Re-exports & Serverless Entry Point
 */

import http from 'http';
import * as neonDb from '../lib/db';
import { HttpContext } from '../lib/http/context';
import { checkRateLimit } from '../lib/security/rate-limiter';
import { routeRequest } from '../lib/http/router';
import { DEFAULT_LICENSES, DEFAULT_VERSION, DEFAULT_USERS } from '../lib/config/constants';


// Non-blocking asynchronous Database Schema initialization (Neon Postgres)
try {
  if (neonDb.isNeonConfigured()) {
    neonDb.initDb(DEFAULT_LICENSES, DEFAULT_VERSION, DEFAULT_USERS).catch(err => {
      console.error('[Neon Postgres] Auto-init background error:', err?.message || err);
    });
  }
} catch (initErr: any) {
  console.error('[Neon Postgres] Auto-init synchronous error:', initErr?.message || initErr);
}

/**
 * Main Serverless HTTP Entry Point
 */
export default async function handler(req: http.IncomingMessage, res: http.ServerResponse): Promise<void> {
  try {
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

    // 5. Dispatch Request to Decoupled Controller via Router
    await routeRequest(ctx);
  } catch (error: any) {
    console.error('[API Server Error]:', error);
    try {
      if (!res.headersSent) {
        if (error?.message === 'PAYLOAD_TOO_LARGE') {
          res.writeHead(413, { 'Content-Type': 'application/json; charset=utf-8' });
          res.end(JSON.stringify({ error: 'Payload Too Large', message: 'Dữ liệu gửi lên vượt quá dung lượng cho phép!' }));
          return;
        }
        res.writeHead(500, { 'Content-Type': 'application/json; charset=utf-8' });
        res.end(JSON.stringify({ 
          error: 'Internal Server Error', 
          message: error?.message || 'Đã xảy ra lỗi trên máy chủ. Vui lòng thử lại sau!',
          detail: process.env.NODE_ENV !== 'production' ? error?.stack : undefined
        }));
      }
    } catch (sendErr) {
      res.end();
    }
  }
}

// Interop: support both default export and CommonJS module.exports pattern
(handler as any).default = handler;
