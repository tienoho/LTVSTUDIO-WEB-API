/**
 * Cryptographic & Sanitization Utilities
 */

import crypto from 'crypto';
import { AUTH_TOKEN_SECRET } from '../config/constants';

// 1. Timing-Safe String Comparison (CWE-208 Prevention)
export function safeCompare(a: string, b: string): boolean {
  if (typeof a !== 'string' || typeof b !== 'string') return false;
  const bufA = Buffer.from(a, 'utf8');
  const bufB = Buffer.from(b, 'utf8');
  if (bufA.length !== bufB.length) {
    crypto.timingSafeEqual(bufA, bufA);
    return false;
  }
  return crypto.timingSafeEqual(bufA, bufB);
}

// 2. HWID Sanitization & Validation (Anti-Trivial / Anti-Spoof)
export function validateHwid(hwid: unknown): { valid: boolean; cleanHwid: string; reason?: string } {
  if (typeof hwid !== 'string') {
    return { valid: false, cleanHwid: '', reason: 'Mã định danh thiết bị (HWID) không hợp lệ.' };
  }
  const clean = hwid.trim();
  if (clean.length < 8) {
    return { valid: false, cleanHwid: clean, reason: 'Mã HWID quá ngắn (tối thiểu 8 ký tự bảo mật).' };
  }
  if (clean.length > 128) {
    return { valid: false, cleanHwid: clean.slice(0, 128), reason: 'Mã HWID vượt quá độ dài tối đa 128 ký tự.' };
  }

  const lower = clean.toLowerCase();
  const dummyValues = [
    '12345678', '00000000', '11111111', '88888888', '99999999',
    'test', 'default', 'null', 'undefined', 'unknown', 'none',
    'localhost', '00000000-0000-0000-0000-000000000000'
  ];
  if (dummyValues.includes(lower)) {
    return { valid: false, cleanHwid: clean, reason: 'Mã HWID không an toàn hoặc là giá trị mẫu.' };
  }

  if (!/^[a-zA-Z0-9_\-:\.]{8,128}$/.test(clean)) {
    return { valid: false, cleanHwid: clean, reason: 'Mã HWID chứa ký tự không hợp lệ.' };
  }

  return { valid: true, cleanHwid: clean };
}

// 3. Cryptographic Tamper-Proof Token Signer (HMAC-SHA256)
export function generateLicenseSignature(
  key: string,
  machineId: string,
  expiresAt: string | null,
  timestamp: number,
  nonce: string
): string {
  const payload = `${key}:${machineId}:${expiresAt || 'NULL'}:${timestamp}:${nonce}`;
  return crypto.createHmac('sha256', AUTH_TOKEN_SECRET).update(payload).digest('hex');
}

// 4. Password Hashing & Verification (Salted SHA-256 with Timing-Safe Protection)
export function hashPassword(password: string, customSalt?: string): string {
  const salt = customSalt || crypto.randomBytes(16).toString('hex');
  const hash = crypto.createHash('sha256').update(salt + password).digest('hex');
  return `${salt}:${hash}`;
}

export function verifyPassword(password: string, storedHash: string): boolean {
  if (!password || !storedHash || typeof password !== 'string' || typeof storedHash !== 'string') return false;
  if (!storedHash.includes(':')) return false;
  try {
    const [salt, expectedHash] = storedHash.split(':');
    if (!salt || !expectedHash) return false;
    const computed = crypto.createHash('sha256').update(salt + password).digest('hex');
    return safeCompare(computed, expectedHash);
  } catch {
    return false;
  }
}
