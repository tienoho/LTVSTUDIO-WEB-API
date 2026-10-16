/**
 * HttpContext & Request Helper
 */

import http from 'http';
import { parseAdminSessionToken, isSecretValid, ROLE_PERMISSIONS } from '../security/auth';
import type { AdminRole } from '../../types/index';

export class HttpContext {
  public readonly req: http.IncomingMessage;
  public readonly res: http.ServerResponse;
  public readonly pathname: string;
  public readonly method: string;
  public readonly query: Record<string, string | string[]>;
  public readonly clientIp: string;
  public readonly headerKey: string;
  public readonly bearerKey: string;
  private cachedBody: any = null;

  constructor(req: http.IncomingMessage, res: http.ServerResponse) {
    this.req = req;
    this.res = res;
    this.method = (req.method || 'GET').toUpperCase();

    const host = req.headers.host || 'localhost';
    const parsedUrl = new URL(req.url || '/', `http://${host}`);
    let path = parsedUrl.pathname || '/';

    const q: Record<string, string | string[]> = {};
    parsedUrl.searchParams.forEach((val, key) => {
      q[key] = val;
    });

    // Vercel Serverless Function & Rewrite Compatibility
    const matchedPath = req.headers['x-matched-path'] || req.headers['x-forwarded-uri'] || req.headers['x-original-url'];
    if (typeof matchedPath === 'string' && matchedPath.startsWith('/api')) {
      path = matchedPath.split('?')[0];
    } else {
      const slug = q.slug || (req as any).query?.slug;
      const apiPath = q.apiPath || (req as any).query?.apiPath;
      if (slug) {
        const slugVal = Array.isArray(slug) ? slug.join('/') : slug;
        if (slugVal && !path.includes(slugVal)) {
          path = '/api/' + slugVal;
        }
      } else if (apiPath) {
        const apiPathVal = Array.isArray(apiPath) ? apiPath.join('/') : apiPath;
        if (apiPathVal && !path.includes(apiPathVal)) {
          path = '/api/' + apiPathVal;
        }
      }
    }

    this.pathname = path;
    this.query = q;

    // Detect client IP safely
    const xForwardedFor = req.headers['x-forwarded-for'];
    let ip = '';
    if (typeof xForwardedFor === 'string') {
      ip = xForwardedFor.split(',')[0].trim();
    } else if (Array.isArray(xForwardedFor) && xForwardedFor.length > 0) {
      ip = xForwardedFor[0].trim();
    }
    if (!ip) {
      ip = (req.headers['x-real-ip'] as string) || req.socket.remoteAddress || '127.0.0.1';
    }
    this.clientIp = ip.replace(/^::ffff:/, '');

    // Extract auth headers
    this.headerKey = ((req.headers['x-admin-key'] as string) || '').trim();
    const authHeader = (req.headers['authorization'] as string) || '';
    this.bearerKey = authHeader.startsWith('Bearer ') ? authHeader.substring(7).trim() : '';
  }

  public sendJson(status: number, data: any): void {
    if (this.res.headersSent) return;
    this.res.writeHead(status, { 'Content-Type': 'application/json; charset=utf-8' });
    this.res.end(JSON.stringify(data));
  }

  public async getBody(maxBytes: number = 65536): Promise<any> {
    if (this.cachedBody !== null) return this.cachedBody;

    // Vercel Serverless pre-parsed body support
    const rawReq = this.req as any;
    if (rawReq.body !== undefined && rawReq.body !== null) {
      if (typeof rawReq.body === 'object') {
        this.cachedBody = rawReq.body;
        return this.cachedBody;
      }
      if (typeof rawReq.body === 'string' && rawReq.body.trim()) {
        try {
          this.cachedBody = JSON.parse(rawReq.body);
          return this.cachedBody;
        } catch {
          this.cachedBody = {};
          return this.cachedBody;
        }
      }
      if (Buffer.isBuffer(rawReq.body)) {
        try {
          this.cachedBody = JSON.parse(rawReq.body.toString('utf8'));
          return this.cachedBody;
        } catch {
          this.cachedBody = {};
          return this.cachedBody;
        }
      }
    }

    return new Promise((resolve, reject) => {
      let bodyStr = '';
      let receivedBytes = 0;

      this.req.on('data', chunk => {
        receivedBytes += chunk.length;
        if (receivedBytes > maxBytes) {
          this.req.destroy();
          reject(new Error('PAYLOAD_TOO_LARGE'));
          return;
        }
        bodyStr += chunk;
      });

      this.req.on('end', () => {
        if (!bodyStr.trim()) {
          this.cachedBody = {};
          resolve({});
          return;
        }
        try {
          this.cachedBody = JSON.parse(bodyStr);
          resolve(this.cachedBody);
        } catch {
          this.cachedBody = {};
          resolve({});
        }
      });

      this.req.on('error', err => reject(err));
    });
  }

  public getAuthorizedAdminSession(): {
    authorized: boolean;
    role: AdminRole;
    username: string;
    permissions: string[];
    authType: 'token' | 'legacy_key';
  } {
    // 1. Bearer Session Token Check
    if (this.bearerKey) {
      const session = parseAdminSessionToken(this.bearerKey);
      if (session) {
        return {
          authorized: true,
          role: session.role,
          username: session.username,
          permissions: session.permissions,
          authType: 'token'
        };
      }
    }

    // 2. Fallback to header x-admin-key (Legacy compatibility)
    if (this.headerKey && isSecretValid(this.headerKey)) {
      return {
        authorized: true,
        role: 'SuperAdmin',
        username: 'admin',
        permissions: ROLE_PERMISSIONS.SuperAdmin,
        authType: 'legacy_key'
      };
    }

    return {
      authorized: false,
      role: 'Auditor',
      username: '',
      permissions: [],
      authType: 'legacy_key'
    };
  }

  public sendAdminUnauthorized(): void {
    this.sendJson(401, {
      error: 'Unauthorized',
      message: 'Yêu cầu phiên đăng nhập Quản trị viên (Bearer Token) hoặc mã x-admin-key hợp lệ.'
    });
  }

  public requireAdminRole(allowedRoles: AdminRole[]): { ok: boolean; session?: any } {
    const session = this.getAuthorizedAdminSession();
    if (!session.authorized) {
      this.sendAdminUnauthorized();
      return { ok: false };
    }

    if (!allowedRoles.includes(session.role)) {
      this.sendJson(403, {
        error: 'Forbidden',
        message: `Tài khoản vai trò [${session.role}] không có quyền thực hiện hành động này. Yêu cầu quyền [${allowedRoles.join(' hoặc ')}]!`,
        requiredRoles: allowedRoles,
        currentRole: session.role
      });
      return { ok: false };
    }

    return { ok: true, session };
  }
}
