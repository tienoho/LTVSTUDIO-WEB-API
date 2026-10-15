/**
 * Auth Controller - Handles Admin Login, Session Verification, Logout & Change Password
 */

import { HttpContext } from '../http/context';
import { checkAdminLock, recordAdminFailure, resetAdminFailure } from '../security/rate-limiter';
import { validateRoleCredentials, createAdminSessionToken, ROLE_PERMISSIONS } from '../security/auth';
import { AUTH_TOKEN_TTL_SECONDS } from '../config/constants';
import * as userRepo from '../repositories/user.repository';
import * as neonDb from '../db';
import type { AdminRole, User } from '../../types/index';

export class AuthController {
  public static async login(ctx: HttpContext): Promise<void> {
    const adminLock = checkAdminLock(ctx.clientIp);
    if (adminLock.locked) {
      return ctx.sendJson(403, {
        error: 'Forbidden',
        message: `Địa chỉ IP đã bị tạm khóa do thử sai mật khẩu Admin quá 5 lần. Vui lòng thử lại sau ${adminLock.retryAfter} giây.`,
        retryAfter: adminLock.retryAfter
      });
    }

    const body = await ctx.getBody(16384);
    const secret = (body.secret || body.password || body.adminKey || body.key || ctx.headerKey || ctx.bearerKey || '').trim();
    const username = (body.username || 'admin').trim();
    const requestedRole = (body.role || '').trim();

    // 1. Xác thực trực tiếp từ CSDL Users (bảng users / users.json dự phòng)
    let authenticatedUser: User | null = null;
    const targetUser = await userRepo.getUserByUsername(username);

    if (targetUser) {
      if (targetUser.status !== 'ACTIVE') {
        return ctx.sendJson(403, {
          error: 'AccountLocked',
          message: 'Tài khoản này đã bị khóa hoặc tạm ngưng hoạt động. Vui lòng liên hệ Quản trị viên cấp cao.'
        });
      }

      // Kiểm tra mật khẩu mã hóa an toàn (Salted SHA-256)
      if (neonDb.verifyPassword(secret, targetUser.passwordHash)) {
        authenticatedUser = targetUser;
      }
    }

    // 2. Fallback sang validateRoleCredentials (bảo toàn tương thích ngược tuyệt đối)
    let finalRole: AdminRole = 'SuperAdmin';
    let finalUsername: string = username;
    let finalFullName: string = 'Quản Trị Viên';
    let finalEmail: string = '';

    if (authenticatedUser) {
      finalRole = authenticatedUser.role;
      finalUsername = authenticatedUser.username;
      finalFullName = authenticatedUser.fullName || authenticatedUser.username;
      finalEmail = authenticatedUser.email || '';
      await userRepo.updateUserLastLogin(authenticatedUser.username);
    } else {
      const fallbackAuth = validateRoleCredentials(secret, username, requestedRole);
      if (fallbackAuth && fallbackAuth.valid) {
        finalRole = fallbackAuth.role;
        finalUsername = fallbackAuth.username;
        finalFullName = fallbackAuth.username === 'admin' ? 'Super Administrator' : fallbackAuth.username;
      } else {
        recordAdminFailure(ctx.clientIp);
        return ctx.sendJson(401, {
          error: 'Unauthorized',
          message: 'Mã Quản trị viên, tài khoản hoặc mật khẩu không chính xác!'
        });
      }
    }

    resetAdminFailure(ctx.clientIp);
    const token = createAdminSessionToken(finalRole, finalUsername, AUTH_TOKEN_TTL_SECONDS);
    return ctx.sendJson(200, {
      success: true,
      token: token,
      expiresIn: AUTH_TOKEN_TTL_SECONDS,
      user: {
        username: finalUsername,
        fullName: finalFullName,
        email: finalEmail,
        role: finalRole,
        permissions: ROLE_PERMISSIONS[finalRole],
        loginAt: new Date().toISOString()
      },
      message: `Đăng nhập Quản trị viên thành công (Vai trò: ${finalRole})!`
    });
  }

  public static async verifySession(ctx: HttpContext): Promise<void> {
    const session = ctx.getAuthorizedAdminSession();
    if (!session.authorized) return ctx.sendAdminUnauthorized();
    return ctx.sendJson(200, {
      valid: true,
      success: true,
      authenticated: true,
      username: session.username,
      user: {
        username: session.username,
        role: session.role,
        permissions: session.permissions
      },
      message: `Phiên quản trị viên hợp lệ (Vai trò: ${session.role}).`
    });
  }

  public static async logout(ctx: HttpContext): Promise<void> {
    return ctx.sendJson(200, {
      success: true,
      message: 'Đã đăng xuất khỏi tài khoản Quản trị viên thành công!'
    });
  }

  public static async changePassword(ctx: HttpContext): Promise<void> {
    const session = ctx.getAuthorizedAdminSession();
    if (!session.authorized) return ctx.sendAdminUnauthorized();

    const body = await ctx.getBody(16384);
    const currentPassword = (body.currentPassword || body.oldPassword || '').trim();
    const newPassword = (body.newPassword || '').trim();
    const targetUsername = (body.targetUsername || body.username || session.username).trim();

    if (!newPassword || newPassword.length < 6) {
      return ctx.sendJson(400, {
        error: 'BadRequest',
        message: 'Mật khẩu mới phải có độ dài tối thiểu từ 6 ký tự trở lên!'
      });
    }

    const isSelf = targetUsername.toLowerCase() === session.username.toLowerCase();

    // Nếu không phải tự đổi mật khẩu chính mình -> bắt buộc phải là SuperAdmin
    if (!isSelf && session.role !== 'SuperAdmin' && !session.permissions.includes('users:manage')) {
      return ctx.sendJson(403, {
        error: 'Forbidden',
        message: 'Bạn không có quyền đổi mật khẩu cho tài khoản người dùng khác!'
      });
    }

    const targetUser = await userRepo.getUserByUsername(targetUsername);
    if (!targetUser) {
      return ctx.sendJson(404, {
        error: 'NotFound',
        message: `Không tìm thấy tài khoản '${targetUsername}' trong hệ thống!`
      });
    }

    // Nếu tự đổi mật khẩu cho chính mình, bắt buộc phải cung cấp mật khẩu cũ đúng
    if (isSelf) {
      if (!currentPassword) {
        return ctx.sendJson(400, {
          error: 'BadRequest',
          message: 'Vui lòng cung cấp mật khẩu hiện tại để xác thực!'
        });
      }
      if (!neonDb.verifyPassword(currentPassword, targetUser.passwordHash)) {
        return ctx.sendJson(400, {
          error: 'InvalidCurrentPassword',
          message: 'Mật khẩu hiện tại không chính xác!'
        });
      }
    }

    const newHash = neonDb.hashPassword(newPassword);
    await userRepo.updateUserPassword(targetUser.username, newHash);

    return ctx.sendJson(200, {
      success: true,
      message: isSelf
        ? 'Đổi mật khẩu thành công! Vui lòng ghi nhớ mật khẩu mới của bạn.'
        : `Đã thiết lập lại mật khẩu cho tài khoản '${targetUsername}' thành công!`
    });
  }
}
