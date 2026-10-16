/**
 * Configuration & Constant Definitions for LTVStudio API
 */

import path from 'path';
import type { License, VersionConfig, User } from '../../types/index';
import rawLicenses from '../../data/licenses.json';
import rawUsers from '../../data/users.json';
import rawVersion from '../../data/version_config.json';

export const RAW_ADMIN_SECRET = process.env.ADMIN_SECRET || 'ltvstudio_secret_admin_2026';
export const ADMIN_SECRET = RAW_ADMIN_SECRET.trim().replace(/^["']|["']$/g, '');
export const DEFAULT_FALLBACK_SECRET = 'ltvstudio_secret_admin_2026';
export const SUPPORT_SECRET = (process.env.SUPPORT_SECRET || 'ltvstudio_support_2026').trim().replace(/^["']|["']$/g, '');
export const AUDITOR_SECRET = (process.env.AUDITOR_SECRET || 'ltvstudio_auditor_2026').trim().replace(/^["']|["']$/g, '');
export const AUTH_TOKEN_SECRET = process.env.AUTH_TOKEN_SECRET || (ADMIN_SECRET + '_ltv_signature_secret_2026');
export const AUTH_TOKEN_TTL_SECONDS = parseInt(process.env.AUTH_TOKEN_TTL_SECONDS || '86400', 10);

export const LOCAL_DATA_DIR = typeof __dirname !== 'undefined'
  ? path.join(__dirname, '..', '..', 'data')
  : path.join(process.cwd(), 'data');
export const TMP_DATA_DIR = '/tmp';

export const DEFAULT_VERSION: VersionConfig = (rawVersion as VersionConfig) || {
  version: "1.0.0",
  changelog: "• Bản phát hành chính thức LTVStudio v1.0.0\n• Tích hợp mô hình AI Expressive TTS cao cấp đa cảm xúc\n• Tối ưu hệ thống bóc tách phụ đề và dịch thuật siêu tốc\n• Hệ thống kiểm soát bản quyền HWID đám mây bảo mật cao",
  download_url: "https://github.com/ltvstudio/releases/releases/download/v1.0.0/LTVStudio_Setup.exe",
  force_update: false
};

export const DEFAULT_LICENSES: License[] = (rawLicenses as unknown as License[]) || [];
export const DEFAULT_USERS: User[] = (rawUsers as unknown as User[]) || [];
