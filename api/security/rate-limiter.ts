/**
 * Rate Limiting & Anti-Brute-Force Security Service
 */

interface RateRecord {
  count: number;
  resetTime: number;
}

const rateLimitMap = new Map<string, RateRecord>();

export function checkRateLimit(ip: string, limit: number = 150, windowMs: number = 60000) {
  const now = Date.now();
  let record = rateLimitMap.get(ip);
  if (!record || now > record.resetTime) {
    record = { count: 1, resetTime: now + windowMs };
    rateLimitMap.set(ip, record);
    return { allowed: true, remaining: limit - 1, retryAfter: 0 };
  }
  record.count++;
  if (record.count > limit) {
    return { allowed: false, remaining: 0, retryAfter: Math.ceil((record.resetTime - now) / 1000) };
  }
  return { allowed: true, remaining: limit - record.count, retryAfter: 0 };
}

// License Verification Anti-Brute-Force Tracker (Per IP)
interface VerifyFailRecord {
  count: number;
  resetTime: number;
  lockedUntil: number;
}

const verifyFailMap = new Map<string, VerifyFailRecord>();
const MAX_VERIFY_FAILS = 5;
const VERIFY_FAIL_WINDOW_MS = 10 * 60 * 1000; // 10 minutes window
const VERIFY_LOCKOUT_MS = 15 * 60 * 1000;    // 15 minutes lockout

export function checkVerifyLock(ip: string): { locked: boolean; retryAfter: number } {
  const now = Date.now();
  const rec = verifyFailMap.get(ip);
  if (!rec) return { locked: false, retryAfter: 0 };
  if (rec.lockedUntil > now) {
    return { locked: true, retryAfter: Math.ceil((rec.lockedUntil - now) / 1000) };
  }
  if (now > rec.resetTime && rec.lockedUntil <= now) {
    verifyFailMap.delete(ip);
    return { locked: false, retryAfter: 0 };
  }
  return { locked: false, retryAfter: 0 };
}

export function recordVerifyFailure(ip: string): void {
  const now = Date.now();
  let rec = verifyFailMap.get(ip);
  if (!rec || (now > rec.resetTime && rec.lockedUntil <= now)) {
    rec = { count: 1, resetTime: now + VERIFY_FAIL_WINDOW_MS, lockedUntil: 0 };
    verifyFailMap.set(ip, rec);
    return;
  }
  rec.count++;
  if (rec.count >= MAX_VERIFY_FAILS) {
    rec.lockedUntil = now + VERIFY_LOCKOUT_MS;
    console.warn(`[SECURITY LOCKOUT] IP ${ip} exceeded ${MAX_VERIFY_FAILS} failed verify attempts. Locked for 15 minutes.`);
  }
}

export function resetVerifyFailure(ip: string): void {
  verifyFailMap.delete(ip);
}

// Admin Authentication Anti-Brute-Force Tracker (Per IP)
interface AdminFailRecord {
  count: number;
  resetTime: number;
  lockedUntil: number;
}

const adminFailMap = new Map<string, AdminFailRecord>();
const MAX_ADMIN_FAILS = 5;
const ADMIN_FAIL_WINDOW_MS = 15 * 60 * 1000;
const ADMIN_LOCKOUT_MS = 15 * 60 * 1000;

export function checkAdminLock(ip: string): { locked: boolean; retryAfter: number } {
  const now = Date.now();
  const rec = adminFailMap.get(ip);
  if (!rec) return { locked: false, retryAfter: 0 };
  if (rec.lockedUntil > now) {
    return { locked: true, retryAfter: Math.ceil((rec.lockedUntil - now) / 1000) };
  }
  if (now > rec.resetTime && rec.lockedUntil <= now) {
    adminFailMap.delete(ip);
    return { locked: false, retryAfter: 0 };
  }
  return { locked: false, retryAfter: 0 };
}

export function recordAdminFailure(ip: string): void {
  const now = Date.now();
  let rec = adminFailMap.get(ip);
  if (!rec || (now > rec.resetTime && rec.lockedUntil <= now)) {
    rec = { count: 1, resetTime: now + ADMIN_FAIL_WINDOW_MS, lockedUntil: 0 };
    adminFailMap.set(ip, rec);
    return;
  }
  rec.count++;
  if (rec.count >= MAX_ADMIN_FAILS) {
    rec.lockedUntil = now + ADMIN_LOCKOUT_MS;
    console.warn(`[SECURITY LOCKOUT] IP ${ip} exceeded ${MAX_ADMIN_FAILS} failed admin attempts. Locked for 15 minutes.`);
  }
}

export function resetAdminFailure(ip: string): void {
  adminFailMap.delete(ip);
}

// Auto clean up stale maps
if (typeof setInterval !== 'undefined') {
  const timer = setInterval(() => {
    const now = Date.now();
    for (const [ip, rec] of rateLimitMap.entries()) {
      if (now > rec.resetTime) rateLimitMap.delete(ip);
    }
    for (const [ip, rec] of verifyFailMap.entries()) {
      if (now > rec.resetTime && rec.lockedUntil <= now) verifyFailMap.delete(ip);
    }
    for (const [ip, rec] of adminFailMap.entries()) {
      if (now > rec.resetTime && rec.lockedUntil <= now) adminFailMap.delete(ip);
    }
  }, 120000);
  if (timer.unref) timer.unref();
}

export function resetAllLocks(ip?: string): void {
  if (ip) {
    verifyFailMap.delete(ip);
    adminFailMap.delete(ip);
    rateLimitMap.delete(ip);
  } else {
    verifyFailMap.clear();
    adminFailMap.clear();
    rateLimitMap.clear();
  }
}
