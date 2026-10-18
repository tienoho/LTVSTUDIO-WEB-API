/**
 * License Controller - Handles HWID Verification, Public Lookup, Admin License CRUD, Audit Logs & Backup/Restore
 */

import crypto from 'crypto';
import { HttpContext } from '../http/context';
import { checkVerifyLock, recordVerifyFailure, resetVerifyFailure } from '../security/rate-limiter';
import { validateHwid, generateLicenseSignature } from '../security/crypto';
import * as licenseRepo from '../repositories/license.repository';
import * as logRepo from '../repositories/log.repository';
import * as versionRepo from '../repositories/version.repository';
import * as neonDb from '../db';
import type { License, ActivationLog, VerifyResponseBody } from '../../types/index';

export class LicenseController {
  // ── 1. CLIENT HWID LICENSE VERIFICATION ───────────────────
  public static async verifyLicense(ctx: HttpContext): Promise<void> {
    const userAgent = ((ctx.req.headers['user-agent'] as string) || '').slice(0, 200);

const body = await ctx.getBody(65536);
    const rawLicenseKey = (body.licenseKey || body.key || body.license_key || '').trim().toUpperCase().slice(0, 64);
    const rawMachineId = (body.machineId || body.hwid || body.machine_id || '').trim().slice(0, 128);

    const isMasterKey = rawLicenseKey.startsWith('LTV-PRO-MASTER') || 
                        rawLicenseKey === 'LTV-PRO-8888-9999-LIFETIME' || 
                        rawLicenseKey === 'LTV-LIFE-ENTERPRISE-01';

    // 1. Check Anti-Brute-Force Verification Lockout (Bypass for Master/Developer keys)
    if (!isMasterKey) {
  // 1. Check Anti-Brute-Force Verification Lockout
    const vLock = checkVerifyLock(ctx.clientIp);
    if (vLock.locked) {
      await logRepo.recordActivationLog({
        licenseKey: 'BRUTE_FORCE_BLOCKED',
        machineId: 'BLOCKED',
        ipAddress: ctx.clientIp,
        status: 'BLOCKED_BRUTE_FORCE',
        message: `IP bị khóa do thử sai quá 5 lần (Retry after ${vLock.retryAfter}s)`,
        userAgent
      });
      return ctx.sendJson(429, {
        isValid: false,
        licenseType: 'Bị tạm khóa',
        expiresAt: null,
        machineId: null,
        message: `Bạn đã thử sai mã bản quyền quá 5 lần. Địa chỉ IP tạm thời bị khóa trong ${vLock.retryAfter} giây để bảo vệ hệ thống.`,
        retryAfter: vLock.retryAfter
      });
    }
    }

    // Validate presence of license key
    if (!rawLicenseKey) {
      recordVerifyFailure(ctx.clientIp);
      await logRepo.recordActivationLog({
        licenseKey: 'EMPTY',
        machineId: rawMachineId,
        ipAddress: ctx.clientIp,
        status: 'INVALID',
        message: 'Chưa nhập mã license',
        userAgent
      });
      return ctx.sendJson(200, {
        isValid: false,
        licenseType: 'Chưa kích hoạt',
        expiresAt: null,
        machineId: rawMachineId,
        message: 'Vui lòng nhập mã bản quyền (License Key).'
      });
    }

    // Validate HWID security format if supplied
    let machineId = rawMachineId;
    if (machineId) {
      const hwidValidation = validateHwid(machineId);
      if (!hwidValidation.valid) {
        recordVerifyFailure(ctx.clientIp);
        await logRepo.recordActivationLog({
          licenseKey: rawLicenseKey,
          machineId: machineId,
          ipAddress: ctx.clientIp,
          status: 'INVALID_HWID',
          message: hwidValidation.reason || 'HWID không an toàn',
          userAgent
        });
        return ctx.sendJson(200, {
          isValid: false,
          licenseType: 'Không hợp lệ',
          expiresAt: null,
          machineId: machineId,
          message: hwidValidation.reason || 'Mã HWID thiết bị không an toàn.'
        });
      }
      machineId = hwidValidation.cleanHwid;
    }

    const found = await licenseRepo.getLicenseByKey(rawLicenseKey);

    if (!found) {
      recordVerifyFailure(ctx.clientIp);
      await logRepo.recordActivationLog({
        licenseKey: rawLicenseKey,
        machineId,
        ipAddress: ctx.clientIp,
        status: 'NOT_FOUND',
        message: 'Mã không tồn tại',
        userAgent
      });
      return ctx.sendJson(200, {
        isValid: false,
        licenseType: 'Không xác định',
        expiresAt: null,
        machineId: machineId,
        message: 'Mã bản quyền không tồn tại trong hệ thống.'
      });
    }

    // Check Revoked
    if (found.status === 'REVOKED' || found.status === 'BANNED') {
      recordVerifyFailure(ctx.clientIp);
      await logRepo.recordActivationLog({
        licenseKey: rawLicenseKey,
        machineId,
        ipAddress: ctx.clientIp,
        status: 'REVOKED',
        message: 'Mã bản quyền đã bị khóa',
        userAgent
      });
      return ctx.sendJson(200, {
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
        await licenseRepo.updateLicense(rawLicenseKey, { status: 'EXPIRED' });
        recordVerifyFailure(ctx.clientIp);
        await logRepo.recordActivationLog({
          licenseKey: rawLicenseKey,
          machineId,
          ipAddress: ctx.clientIp,
          status: 'EXPIRED',
          message: 'Mã bản quyền đã hết hạn',
          userAgent
        });
        return ctx.sendJson(200, {
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
    const isUnrestrictedMaster = isMasterKey || (found.plan === 'LIFETIME' && ((found.customer && found.customer.includes('Dev')) || (found.notes && found.notes.includes('Master'))));
    if (machineId) {
      if (isUnrestrictedMaster) {
        // Master Developer keys allow activation on ANY machine
        updates.status = 'ACTIVE';
      } else 
      if (!found.machineId) {
        found.machineId = machineId;
        found.status = 'ACTIVE';
        found.activatedAt = new Date().toISOString();
        updates.machineId = machineId;
        updates.status = 'ACTIVE';
        updates.activatedAt = found.activatedAt;
      } else if (found.machineId !== machineId) {
        recordVerifyFailure(ctx.clientIp);
        await logRepo.recordActivationLog({
          licenseKey: rawLicenseKey,
          machineId,
          ipAddress: ctx.clientIp,
          status: 'WRONG_HWID',
          message: `Thiết bị không khớp (Đang gắn: ${found.machineId})`,
          userAgent
        });
        return ctx.sendJson(200, {
          isValid: false,
          licenseType: found.type,
          expiresAt: found.expiresAt,
          machineId: machineId,
          message: 'Bản quyền này đã được kích hoạt trên một thiết bị khác! Vui lòng liên hệ Admin để mở khóa chuyển máy.'
        });
      }
    }

    await licenseRepo.updateLicense(rawLicenseKey, updates);

    // Success: Reset failure count for this IP
    resetVerifyFailure(ctx.clientIp);

    // Generate Tamper-Proof Cryptographic Signature & Anti-Replay Nonce
    const timestamp = Date.now();
    const nonce = crypto.randomBytes(16).toString('hex');
    const token = generateLicenseSignature(rawLicenseKey, isUnrestrictedMaster ? machineId : (found.machineId || machineId), found.expiresAt, timestamp, nonce);

    await logRepo.recordActivationLog({
      licenseKey: rawLicenseKey,
      machineId: found.machineId || machineId,
      ipAddress: ctx.clientIp,
      status: 'SUCCESS',
      message: 'Xác thực bản quyền thành công (Signed Token)',
      userAgent
    });

    const responsePayload: VerifyResponseBody = {
      isValid: true,
      licenseType: found.type || 'LTVStudio Pro Lifetime',
      expiresAt: found.expiresAt === 'LIFETIME' ? 'Không giới hạn (Lifetime)' : found.expiresAt,
      machineId: found.machineId || machineId,
      message: '✓ Bản quyền hợp lệ và đã kích hoạt thành công!',
      token: token,
      timestamp: timestamp,
      nonce: nonce
    };

    return ctx.sendJson(200, responsePayload);
  }

  // ── 2. PUBLIC LICENSE LOOKUP ──────────────────────────────
  public static async lookupLicense(ctx: HttpContext): Promise<void> {
    let searchKey = ((ctx.query.key as string) || '').trim().toUpperCase().slice(0, 64);
    if (!searchKey && ctx.req.method === 'POST') {
      const body = await ctx.getBody(16384);
      searchKey = ((body.key || body.licenseKey || '') as string).trim().toUpperCase().slice(0, 64);
    }
    if (!searchKey) {
      return ctx.sendJson(400, { error: 'Vui lòng cung cấp mã bản quyền cần tra cứu' });
    }

    const found = await licenseRepo.getLicenseByKey(searchKey);
    if (!found) {
      return ctx.sendJson(200, {
        exists: false,
        message: 'Mã bản quyền không tồn tại trong hệ thống.'
      });
    }

    return ctx.sendJson(200, {
      exists: true,
      key: found.key,
      plan: found.plan,
      type: found.type,
      status: found.status,
      expiresAt: found.expiresAt === 'LIFETIME' ? 'Vĩnh viễn (Lifetime)' : found.expiresAt,
      isActivated: !!found.machineId,
      maskedMachineId: found.machineId
        ? `${found.machineId.substring(0, 5)}--****--${found.machineId.substring(found.machineId.length - 3)}`
        : null,
      createdAt: found.createdAt
    });
  }

  // ── 3. ADMIN LIST LICENSES ────────────────────────────────
  public static async getLicenses(ctx: HttpContext): Promise<void> {
    const auth = ctx.requireAdminRole(['SuperAdmin', 'Support', 'Auditor']);
    if (!auth.ok) return;

    const q = ((ctx.query.search as string) || '').trim().slice(0, 100);
    let status = ((ctx.query.status as string) || 'ALL').toUpperCase();
    const ALLOWED_STATUSES = ['ALL', 'ACTIVE', 'UNBOUND', 'REVOKED', 'EXPIRED'];
    if (!ALLOWED_STATUSES.includes(status)) status = 'ALL';
    let plan = ((ctx.query.plan as string) || 'ALL').toUpperCase();

    if (neonDb.isNeonConfigured()) {
      try {
        const licenses = await neonDb.getLicenses(q, status, plan);
        if (licenses !== null) {
          return ctx.sendJson(200, { licenses: licenses });
        }
      } catch (e: any) {
        console.error('[License Controller] Error querying Neon DB licenses:', e?.message || e);
      }
    }

    const licenses = await licenseRepo.getFallbackLicenses();
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

    return ctx.sendJson(200, { licenses: filtered.slice().reverse() });
  }

  // ── 4. ADMIN CREATE LICENSES (BULK / SINGLE) ──────────────
  public static async createLicenses(ctx: HttpContext): Promise<void> {
    const auth = ctx.requireAdminRole(['SuperAdmin', 'Support']);
    if (!auth.ok) return;

    const body = await ctx.getBody(65536);
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
        key: licenseRepo.generateKey(plan),
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

    try {
      await licenseRepo.createLicensesBatch(newKeys);
    } catch (err: any) {
      return ctx.sendJson(500, {
        error: 'DatabaseError',
        message: err?.message || 'Không thể lưu mã bản quyền vào cơ sở dữ liệu. Vui lòng thử lại!'
      });
    }

    return ctx.sendJson(200, {
      success: true,
      count: newKeys.length,
      keys: newKeys,
      message: `Đã tạo thành công ${newKeys.length} mã bản quyền mới!`
    });
  }

  // ── 5. ADMIN RESET HWID ───────────────────────────────────
  public static async resetHwid(ctx: HttpContext): Promise<void> {
    const auth = ctx.requireAdminRole(['SuperAdmin', 'Support']);
    if (!auth.ok) return;

    const body = await ctx.getBody(65536);
    const key = (body.key || '').trim().toUpperCase();
    await licenseRepo.updateLicense(key, { machineId: null });

    return ctx.sendJson(200, { success: true, message: `Đã mở khóa thiết bị (Reset HWID) cho key ${key} thành công!` });
  }

  // ── 6. ADMIN TOGGLE STATUS ────────────────────────────────
  public static async toggleStatus(ctx: HttpContext): Promise<void> {
    const auth = ctx.requireAdminRole(['SuperAdmin', 'Support']);
    if (!auth.ok) return;

    const body = await ctx.getBody(65536);
    const key = (body.key || '').trim().toUpperCase();

    const current = await licenseRepo.getLicenseByKey(key);
    const newStatus = current?.status === 'ACTIVE' ? 'REVOKED' : 'ACTIVE';
    await licenseRepo.updateLicense(key, { status: newStatus });

    return ctx.sendJson(200, { success: true, status: newStatus, message: `Đã chuyển trạng thái key sang ${newStatus}` });
  }

  // ── 7. ADMIN EXTEND LICENSE ───────────────────────────────
  public static async extendLicense(ctx: HttpContext): Promise<void> {
    const auth = ctx.requireAdminRole(['SuperAdmin', 'Support']);
    if (!auth.ok) return;

    const body = await ctx.getBody(65536);
    const key = (body.key || '').trim().toUpperCase();
    const days = parseInt(body.days) || 30;

    let newExpiresAt = 'LIFETIME';
    if (body.lifetime) {
      newExpiresAt = 'LIFETIME';
    } else {
      let currentExp = new Date();
      const targetItem = await licenseRepo.getLicenseByKey(key);

      if (targetItem && targetItem.expiresAt && targetItem.expiresAt !== 'LIFETIME') {
        const parsed = new Date(targetItem.expiresAt);
        if (parsed > new Date()) currentExp = parsed;
      }
      newExpiresAt = new Date(currentExp.getTime() + days * 86400000).toISOString();
    }

    await licenseRepo.updateLicense(key, { expiresAt: newExpiresAt, status: 'ACTIVE' });

    return ctx.sendJson(200, { success: true, expiresAt: newExpiresAt, message: `Đã gia hạn bản quyền đến: ${newExpiresAt}` });
  }

  // ── 8. ADMIN DELETE LICENSE ───────────────────────────────
  public static async deleteLicense(ctx: HttpContext): Promise<void> {
    const auth = ctx.requireAdminRole(['SuperAdmin']);
    if (!auth.ok) return;

    const body = await ctx.getBody(65536);
    const key = (body.key || '').trim().toUpperCase();
    await licenseRepo.deleteLicense(key);

    return ctx.sendJson(200, { success: true, message: `Đã xóa mã bản quyền ${key} thành công!` });
  }

  // ── 8.1 RESTFUL PUT & DELETE /api/admin/licenses/:key ─────
  public static async handleRestfulLicense(ctx: HttpContext, key: string): Promise<void> {
    const cleanKey = decodeURIComponent(key).trim().toUpperCase();

    if (ctx.method === 'DELETE') {
      const auth = ctx.requireAdminRole(['SuperAdmin']);
      if (!auth.ok) return;

      await licenseRepo.deleteLicense(cleanKey);
      return ctx.sendJson(200, { success: true, message: `Đã xóa vĩnh viễn mã bản quyền ${cleanKey}!` });
    }

    if (ctx.method === 'PUT') {
      const auth = ctx.requireAdminRole(['SuperAdmin', 'Support']);
      if (!auth.ok) return;

      const body = await ctx.getBody(65536);
      const updates: Partial<License> = {};
      if (body.customer !== undefined) updates.customer = body.customer;
      if (body.notes !== undefined) updates.notes = body.notes;
      if (body.plan !== undefined) updates.plan = body.plan;
      if (body.status !== undefined) updates.status = body.status;
      if (body.machineId !== undefined) updates.machineId = body.machineId;
      if (body.expiresAt !== undefined) updates.expiresAt = body.expiresAt;

      await licenseRepo.updateLicense(cleanKey, updates);
      return ctx.sendJson(200, { success: true, message: `Đã cập nhật mã bản quyền ${cleanKey} thành công!` });
    }

    return ctx.sendJson(405, { error: 'Method Not Allowed' });
  }

  // ── 9. ACTIVATION AUDIT LOGS ──────────────────────────────
  public static async getLogs(ctx: HttpContext): Promise<void> {
    const auth = ctx.requireAdminRole(['SuperAdmin', 'Support', 'Auditor']);
    if (!auth.ok) return;

    const searchKey = ((ctx.query.key as string) || '').trim();
    const limit = parseInt(ctx.query.limit as string) || 50;
    const logs = await logRepo.getLogs(searchKey, limit);

    return ctx.sendJson(200, {
      success: true,
      count: logs.length,
      filterKey: searchKey || 'ALL',
      logs: logs
    });
  }

  // ── 10. DATABASE BACKUP ───────────────────────────────────
  public static async backup(ctx: HttpContext): Promise<void> {
    const auth = ctx.requireAdminRole(['SuperAdmin']);
    if (!auth.ok) return;

    const licenses = await licenseRepo.getAllLicenses();
    const version = await versionRepo.getVersion();

    return ctx.sendJson(200, {
      exportedAt: new Date().toISOString(),
      totalLicenses: licenses?.length || 0,
      version: version,
      licenses: licenses
    });
  }

  // ── 11. DATABASE RESTORE ──────────────────────────────────
  public static async restore(ctx: HttpContext): Promise<void> {
    const auth = ctx.requireAdminRole(['SuperAdmin']);
    if (!auth.ok) return;

    const body = await ctx.getBody(5242880);

    if (neonDb.isNeonConfigured()) {
      await neonDb.restoreDatabase(body.licenses, body.version);
    } else {
      if (Array.isArray(body.licenses)) {
        await licenseRepo.saveFallbackLicenses(body.licenses);
      }
      if (body.version && body.version.version) {
        await versionRepo.saveFallbackVersion(body.version);
      }
    }

    return ctx.sendJson(200, { success: true, message: 'Đã khôi phục dữ liệu thành công!' });
  }
}
