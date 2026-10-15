/**
 * User Controller - Handles User CRUD & Role-Based Account Operations
 */

import { HttpContext } from '../http/context';
import * as userRepo from '../repositories/user.repository';
import * as neonDb from '../db';
import type { AdminRole, User } from '../../types/index';

export class UserController {
  public static async getUsers(ctx: HttpContext): Promise<void> {
    const session = ctx.getAuthorizedAdminSession();
    if (!session.authorized) return ctx.sendAdminUnauthorized();
    if (session.role !== 'SuperAdmin' && !session.permissions.includes('users:view')) {
      return ctx.sendJson(403, { error: 'Forbidden', message: 'Bạn không có quyền xem danh sách người dùng.' });
    }

    const users = await userRepo.getAllUsers();
    const dtos = users.map(u => ({
      id: u.id,
      username: u.username,
      fullName: u.fullName,
      email: u.email,
      role: u.role,
      status: u.status,
      createdAt: u.createdAt,
      updatedAt: u.updatedAt,
      lastLoginAt: u.lastLoginAt
    }));

    return ctx.sendJson(200, {
      success: true,
      count: dtos.length,
      users: dtos
    });
  }

  public static async createUser(ctx: HttpContext): Promise<void> {
    const session = ctx.getAuthorizedAdminSession();
    if (!session.authorized) return ctx.sendAdminUnauthorized();
    if (session.role !== 'SuperAdmin' && !session.permissions.includes('users:manage')) {
      return ctx.sendJson(403, { error: 'Forbidden', message: 'Chỉ Quản trị viên cấp cao (SuperAdmin) mới có quyền tạo người dùng mới.' });
    }

    const body = await ctx.getBody(16384);
    const username = (body.username || '').trim().toLowerCase();
    const password = (body.password || '').trim();
    const fullName = (body.fullName || '').trim() || username;
    const email = (body.email || '').trim().toLowerCase();
    let role: AdminRole = 'Support';
    if (body.role === 'SuperAdmin') role = 'SuperAdmin';
    else if (body.role === 'Auditor') role = 'Auditor';
    else role = 'Support';

    const status = (body.status === 'SUSPENDED' || body.status === 'INACTIVE' || body.status === 'LOCKED') ? 'SUSPENDED' : 'ACTIVE';

    if (!username || username.length < 3 || username.length > 32 || !/^[a-zA-Z0-9_\-\.]+$/.test(username)) {
      return ctx.sendJson(400, { error: 'BadRequest', message: 'Tên tài khoản không hợp lệ (3-32 ký tự chữ cái, số, gạch dưới).' });
    }
    if (!password || password.length < 6) {
      return ctx.sendJson(400, { error: 'BadRequest', message: 'Mật khẩu phải có độ dài tối thiểu từ 6 ký tự trở lên.' });
    }

    const existing = await userRepo.getUserByUsername(username);
    if (existing) {
      return ctx.sendJson(409, { error: 'Conflict', message: `Tài khoản '${username}' đã tồn tại trong hệ thống.` });
    }

    const passwordHash = neonDb.hashPassword(password);
    const newUser: User = {
      username,
      passwordHash,
      fullName,
      email,
      role,
      status,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      lastLoginAt: null
    };

    const created = await userRepo.createUser(newUser);
    if (!created) {
      return ctx.sendJson(500, { error: 'InternalServerError', message: 'Không thể tạo người dùng. Vui lòng thử lại.' });
    }

    return ctx.sendJson(201, {
      success: true,
      message: `Đã tạo tài khoản '${username}' thành công với vai trò ${role}!`,
      user: {
        username: newUser.username,
        fullName: newUser.fullName,
        email: newUser.email,
        role: newUser.role,
        status: newUser.status,
        createdAt: newUser.createdAt
      }
    });
  }

  public static async updateUser(ctx: HttpContext): Promise<void> {
    const session = ctx.getAuthorizedAdminSession();
    if (!session.authorized) return ctx.sendAdminUnauthorized();
    if (session.role !== 'SuperAdmin' && !session.permissions.includes('users:manage')) {
      return ctx.sendJson(403, { error: 'Forbidden', message: 'Bạn không có quyền chỉnh sửa thông tin người dùng.' });
    }

    const body = await ctx.getBody(16384);
    const username = (body.username || '').trim().toLowerCase();
    if (!username) {
      return ctx.sendJson(400, { error: 'BadRequest', message: 'Vui lòng chỉ định tài khoản cần cập nhật.' });
    }

    const target = await userRepo.getUserByUsername(username);
    if (!target) {
      return ctx.sendJson(404, { error: 'NotFound', message: `Không tìm thấy tài khoản '${username}'.` });
    }

    const updates: Partial<User> = {};
    if (body.fullName !== undefined) updates.fullName = String(body.fullName).trim();
    if (body.email !== undefined) updates.email = String(body.email).trim();

    if (body.role && (body.role === 'SuperAdmin' || body.role === 'Support' || body.role === 'Auditor')) {
      // Ngăn chặn tự hạ quyền chính mình nếu đang là tài khoản admin
      if (target.username === 'admin' && body.role !== 'SuperAdmin') {
        return ctx.sendJson(400, { error: 'BadRequest', message: 'Không được hạ vai trò của tài khoản quản trị gốc (admin).' });
      }
      updates.role = body.role as AdminRole;
    }

    if (body.status && (body.status === 'ACTIVE' || body.status === 'SUSPENDED' || body.status === 'INACTIVE' || body.status === 'LOCKED')) {
      if (target.username === 'admin' && body.status !== 'ACTIVE') {
        return ctx.sendJson(400, { error: 'BadRequest', message: 'Không được khóa tài khoản quản trị gốc (admin).' });
      }
      updates.status = body.status === 'ACTIVE' ? 'ACTIVE' : 'SUSPENDED';
    }

    await userRepo.updateUser(username, updates);
    return ctx.sendJson(200, {
      success: true,
      message: `Đã cập nhật thông tin tài khoản '${username}' thành công!`
    });
  }

  public static async toggleStatus(ctx: HttpContext): Promise<void> {
    const session = ctx.getAuthorizedAdminSession();
    if (!session.authorized) return ctx.sendAdminUnauthorized();
    if (session.role !== 'SuperAdmin' && !session.permissions.includes('users:manage')) {
      return ctx.sendJson(403, { error: 'Forbidden', message: 'Bạn không có quyền thay đổi trạng thái người dùng.' });
    }

    const body = await ctx.getBody(16384);
    const username = (body.username || '').trim().toLowerCase();
    if (!username) return ctx.sendJson(400, { error: 'BadRequest', message: 'Thiếu username.' });

    if (username === 'admin' || username === session.username.toLowerCase()) {
      return ctx.sendJson(400, { error: 'BadRequest', message: 'Không thể tự khóa tài khoản của chính mình hoặc tài khoản admin gốc.' });
    }

    const target = await userRepo.getUserByUsername(username);
    if (!target) return ctx.sendJson(404, { error: 'NotFound', message: 'Không tìm thấy tài khoản.' });

    const newStatus = target.status === 'ACTIVE' ? 'SUSPENDED' : 'ACTIVE';
    await userRepo.updateUser(username, { status: newStatus });

    return ctx.sendJson(200, {
      success: true,
      status: newStatus,
      message: `Đã chuyển trạng thái tài khoản '${username}' sang ${newStatus === 'ACTIVE' ? 'ĐANG HOẠT ĐỘNG' : 'ĐÃ TẠM KHÓA'}.`
    });
  }

  public static async deleteUser(ctx: HttpContext): Promise<void> {
    const session = ctx.getAuthorizedAdminSession();
    if (!session.authorized) return ctx.sendAdminUnauthorized();
    if (session.role !== 'SuperAdmin' && !session.permissions.includes('users:manage')) {
      return ctx.sendJson(403, { error: 'Forbidden', message: 'Bạn không có quyền xóa người dùng.' });
    }

    const body = await ctx.getBody(16384);
    const username = (body.username || (ctx.query.username as string) || '').trim().toLowerCase();
    if (!username) return ctx.sendJson(400, { error: 'BadRequest', message: 'Thiếu username cần xóa.' });

    if (username === 'admin' || username === session.username.toLowerCase()) {
      return ctx.sendJson(400, { error: 'BadRequest', message: 'Không được phép xóa tài khoản admin gốc hoặc tài khoản đang đăng nhập.' });
    }

    const deleted = await userRepo.deleteUser(username);
    if (!deleted) {
      return ctx.sendJson(404, { error: 'NotFound', message: `Không tìm thấy tài khoản '${username}' để xóa.` });
    }

    return ctx.sendJson(200, {
      success: true,
      message: `Đã xóa tài khoản '${username}' khỏi hệ thống thành công!`
    });
  }
}
