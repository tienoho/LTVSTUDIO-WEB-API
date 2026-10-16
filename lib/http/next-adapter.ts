/**
 * Next.js App Router API Adapter for LTVStudio API
 * Seamlessly adapts NextRequest and NextResponse to the decoupled Router & Controllers
 */

import { NextRequest, NextResponse } from 'next/server';
import { routeRequest } from './router';
import { checkRateLimit } from '../security/rate-limiter';
import { parseAdminSessionToken, isSecretValid, ROLE_PERMISSIONS } from '../security/auth';
import type { AdminRole } from '../../types/index';

export class NextHttpContext {
  public readonly req: NextRequest;
  public readonly pathname: string;
  public readonly method: string;
  public readonly query: Record<string, string | string[]>;
  public readonly clientIp: string;
  public readonly headerKey: string;
  public readonly bearerKey: string;
  private cachedBody: any = null;

  public responseStatus: number = 200;
  public responseData: any = null;
  public responseHeaders: Record<string, string> = {};
  public isResponded: boolean = false;

  constructor(req: NextRequest, params?: { slug?: string[] }) {
    const headersObj: Record<string, string> = {};
    req.headers.forEach((val, key) => {
      headersObj[key.toLowerCase()] = val;
    });

    this.req = new Proxy(req as any, {
      get(target, prop, receiver) {
        if (prop === 'headers') {
          return new Proxy(target.headers, {
            get(hTarget, hProp, hReceiver) {
              if (typeof hProp === 'string') {
                const lower = hProp.toLowerCase();
                if (lower in headersObj) {
                  return headersObj[lower];
                }
                if (typeof (hTarget as any)[hProp] === 'function') {
                  return (hTarget as any)[hProp].bind(hTarget);
                }
              }
              return Reflect.get(hTarget, hProp, hReceiver);
            }
          });
        }
        return Reflect.get(target, prop, receiver);
      }
    });
    this.method = req.method.toUpperCase();

    // Reconstruct canonical pathname
    if (params?.slug && Array.isArray(params.slug) && params.slug.length > 0) {
      this.pathname = '/api/' + params.slug.join('/');
    } else {
      const url = new URL(req.url);
      this.pathname = url.pathname.replace(/\/+$/, '') || '/api';
    }

    // Parse Search Params
    const url = new URL(req.url);
    const q: Record<string, string | string[]> = {};
    url.searchParams.forEach((val, key) => {
      q[key] = val;
    });
    this.query = q;

    // Detect client IP safely
    const xForwardedFor = req.headers.get('x-forwarded-for');
    let ip = '';
    if (xForwardedFor) {
      ip = xForwardedFor.split(',')[0].trim();
    }
    if (!ip) {
      ip = req.headers.get('x-real-ip') || '127.0.0.1';
    }
    this.clientIp = ip.replace(/^::ffff:/, '');

    // Extract auth headers
    this.headerKey = (req.headers.get('x-admin-key') || '').trim();
    const authHeader = req.headers.get('authorization') || '';
    this.bearerKey = authHeader.startsWith('Bearer ') ? authHeader.substring(7).trim() : '';
  }

  public sendJson(status: number, data: any): void {
    this.responseStatus = status;
    this.responseData = data;
    this.responseHeaders['Content-Type'] = 'application/json; charset=utf-8';
    this.isResponded = true;
  }

  public async getBody(maxBytes: number = 65536): Promise<any> {
    if (this.cachedBody !== null) return this.cachedBody;

    try {
      const contentType = this.req.headers.get('content-type') || '';
      if (contentType.includes('application/json')) {
        this.cachedBody = await this.req.json();
      } else {
        const text = await this.req.text();
        if (text && text.trim()) {
          try {
            this.cachedBody = JSON.parse(text);
          } catch {
            this.cachedBody = {};
          }
        } else {
          this.cachedBody = {};
        }
      }
      return this.cachedBody || {};
    } catch (err: any) {
      this.cachedBody = {};
      return this.cachedBody;
    }
  }

  public getAuthorizedAdminSession(): {
    authorized: boolean;
    role: AdminRole;
    username: string;
    permissions: string[];
    authType: 'token' | 'legacy_key';
  } {
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

  public toNextResponse(): NextResponse {
    const headers: Record<string, string> = {
      'X-Content-Type-Options': 'nosniff',
      'X-Frame-Options': 'SAMEORIGIN',
      'X-XSS-Protection': '1; mode=block',
      'Referrer-Policy': 'strict-origin-when-cross-origin',
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization, x-admin-key',
      ...this.responseHeaders
    };

    if (this.responseData !== null && this.responseData !== undefined) {
      return NextResponse.json(this.responseData, {
        status: this.responseStatus,
        headers
      });
    }

    return new NextResponse(null, {
      status: this.responseStatus,
      headers
    });
  }
}

export async function handleNextApiRequest(
  req: NextRequest, 
  params?: { slug?: string[] }
): Promise<NextResponse> {
  const ctx = new NextHttpContext(req, params);

  // 1. CWE-598 Mitigation
  if (ctx.query.adminKey || ctx.query.adminkey || ctx.query.password || ctx.query.secret) {
    return NextResponse.json({
      error: 'BadRequest',
      message: 'Vì lý do bảo mật (CWE-598), không được phép truyền mật khẩu qua URL (Query Parameter). Vui lòng sử dụng HTTP Header x-admin-key hoặc Authorization: Bearer <token>.'
    }, { status: 400 });
  }

  // 2. Sliding-window rate limit
  const rateLimit = checkRateLimit(ctx.clientIp, 180, 60000);
  if (!rateLimit.allowed) {
    return NextResponse.json({
      error: 'Too Many Requests',
      message: 'Bạn đã gửi quá nhiều yêu cầu đến máy chủ trong thời gian ngắn. Vui lòng thử lại sau giây lát!',
      retryAfter: rateLimit.retryAfter
    }, { status: 429 });
  }

  try {
    await routeRequest(ctx as any);
    return ctx.toNextResponse();
  } catch (error: any) {
    console.error('[Next.js API Server Error]:', error);
    if (error?.message === 'PAYLOAD_TOO_LARGE') {
      return NextResponse.json({ error: 'Payload Too Large', message: 'Dữ liệu gửi lên vượt quá dung lượng cho phép!' }, { status: 413 });
    }
    return NextResponse.json({
      error: 'Internal Server Error',
      message: error?.message || 'Đã xảy ra lỗi trên máy chủ. Vui lòng thử lại sau!'
    }, { status: 500 });
  }
}
