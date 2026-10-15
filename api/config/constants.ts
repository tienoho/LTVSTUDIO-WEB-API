/**
 * Configuration & Constant Definitions for LTVStudio API
 */

import path from 'path';
import type { License, VersionConfig, User } from '../../types/index';

export const RAW_ADMIN_SECRET = process.env.ADMIN_SECRET || 'ltvstudio_secret_admin_2026';
export const ADMIN_SECRET = RAW_ADMIN_SECRET.trim().replace(/^["']|["']$/g, '');
export const DEFAULT_FALLBACK_SECRET = 'ltvstudio_secret_admin_2026';
export const SUPPORT_SECRET = (process.env.SUPPORT_SECRET || 'ltvstudio_support_2026').trim().replace(/^["']|["']$/g, '');
export const AUDITOR_SECRET = (process.env.AUDITOR_SECRET || 'ltvstudio_auditor_2026').trim().replace(/^["']|["']$/g, '');
export const AUTH_TOKEN_SECRET = process.env.AUTH_TOKEN_SECRET || (ADMIN_SECRET + '_ltv_signature_secret_2026');
export const AUTH_TOKEN_TTL_SECONDS = parseInt(process.env.AUTH_TOKEN_TTL_SECONDS || '86400', 10);

export const LOCAL_DATA_DIR = path.join(__dirname, '..', '..', 'data');
export const TMP_DATA_DIR = '/tmp';

export const DEFAULT_VERSION: VersionConfig = {
  version: "1.0.0",
  changelog: "• Bản phát hành chính thức LTVStudio v1.0.0\n• Tích hợp mô hình AI Expressive TTS cao cấp đa cảm xúc\n• Tối ưu hệ thống bóc tách phụ đề và dịch thuật siêu tốc\n• Hệ thống kiểm soát bản quyền HWID đám mây bảo mật cao",
  download_url: "https://github.com/ltvstudio/releases/releases/download/v1.0.0/LTVStudio_Setup.exe",
  force_update: false
};

export const DEFAULT_LICENSES: License[] = [
  {
    key: "LTV-PRO-8888-9999-LIFETIME",
    type: "LTVStudio Pro Lifetime (Master License)",
    plan: "LIFETIME",
    customer: "Khách Hàng VIP Trọn Đời",
    notes: "Mã Master mặc định - Dành cho kiểm thử và kích hoạt",
    machineId: null,
    status: "ACTIVE",
    createdAt: "2026-01-01T00:00:00.000Z",
    expiresAt: "LIFETIME",
    lastVerifiedAt: null
  },
  {
    key: "LTV-PRO-MASTER-2026-DEV",
    type: "LTVStudio Pro Lifetime (Developer Master)",
    plan: "LIFETIME",
    customer: "LTVStudio Internal Dev Team",
    notes: "Khóa Master Developer - Dùng cho kiểm thử hệ thống",
    machineId: null,
    status: "ACTIVE",
    createdAt: "2026-01-01T00:00:00.000Z",
    expiresAt: "LIFETIME",
    lastVerifiedAt: null
  },
  {
    key: "LTV-TRIL-SAMPLE-WEEK-001",
    type: "LTVStudio Trial (7 Ngày Trải Nghiệm)",
    plan: "TRIAL",
    customer: "Khách Hàng Dùng Thử",
    notes: "Mã kích hoạt mẫu 7 ngày",
    machineId: null,
    status: "ACTIVE",
    createdAt: "2026-01-01T00:00:00.000Z",
    expiresAt: "2026-12-31T23:59:59.000Z",
    lastVerifiedAt: null
  }
];

export const DEFAULT_USERS: User[] = [
  {
    id: 1,
    username: "admin",
    passwordHash: "220b3ad4523152494a3639e7f96d1e40:73c06b10df60d167d0d3b7e0694cd434b4e355a3cec9d8d2d570b97282db2b41",
    fullName: "Quản Trị Viên Trưởng (SuperAdmin)",
    email: "admin@ltvstudio.com",
    role: "SuperAdmin",
    status: "ACTIVE",
    createdAt: "2026-01-01T00:00:00.000Z",
    updatedAt: "2026-01-01T00:00:00.000Z",
    lastLoginAt: null
  },
  {
    id: 2,
    username: "support",
    passwordHash: "8b4ec3b1813089a52e42d2d8281e8e6a:3961dcbeb57b57440088c79ac1316f8321e0b086da6d013ff8ec75f8df91b39d",
    fullName: "Chuyên Viên CSKH & Kỹ Thuật (Support)",
    email: "support@ltvstudio.com",
    role: "Support",
    status: "ACTIVE",
    createdAt: "2026-01-01T00:00:00.000Z",
    updatedAt: "2026-01-01T00:00:00.000Z",
    lastLoginAt: null
  },
  {
    id: 3,
    username: "auditor",
    passwordHash: "92d823c3dc443b539d98abfb42742d10:534a2fe67fdf42b502c206068a74428e8492244ddfc62912a4f7e22bc9993793",
    fullName: "Kiểm Toán & Kế Toán Hệ Thống (Auditor)",
    email: "auditor@ltvstudio.com",
    role: "Auditor",
    status: "ACTIVE",
    createdAt: "2026-01-01T00:00:00.000Z",
    updatedAt: "2026-01-01T00:00:00.000Z",
    lastLoginAt: null
  }
];
