/**
 * Version Controller - Handles OTA Version Check & Admin Version Management
 */

import { HttpContext } from '../http/context';
import * as versionRepo from '../repositories/version.repository';
import type { VersionConfig } from '../../types/index';

export class VersionController {
  public static async getClientVersion(ctx: HttpContext): Promise<void> {
    const ver = await versionRepo.getVersion();
    return ctx.sendJson(200, {
      version: ver?.version || '1.0.0',
      changelog: ver?.changelog || ver?.releaseNotes || 'Bản cập nhật tối ưu hiệu năng và sửa lỗi giao diện.',
      download_url: ver?.download_url || ver?.downloadUrl || 'https://github.com/ltvstudio/releases/releases',
      force_update: ver?.force_update || false
    });
  }

  public static async getAdminVersion(ctx: HttpContext): Promise<void> {
    const auth = ctx.requireAdminRole(['SuperAdmin', 'Support']);
    if (!auth.ok) return;

    const ver = await versionRepo.getVersion();
    return ctx.sendJson(200, ver || {});
  }

  public static async updateAdminVersion(ctx: HttpContext): Promise<void> {
    const auth = ctx.requireAdminRole(['SuperAdmin']);
    if (!auth.ok) return;

    const body = await ctx.getBody(131072);
    const updateData: Partial<VersionConfig> = {
      version: body.version,
      changelog: body.changelog || body.releaseNotes,
      download_url: body.download_url || body.downloadUrl,
      force_update: !!body.force_update,
      updated_at: new Date().toISOString()
    };

    await versionRepo.updateVersion(updateData);
    return ctx.sendJson(200, { success: true, message: 'Đã cập nhật thông tin phiên bản thành công!' });
  }
}
