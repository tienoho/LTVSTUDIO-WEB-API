/**
 * Request Router & Dispatcher for LTVStudio API
 * Adheres to Open/Closed Principle (OCP) and Single Responsibility Principle (SRP)
 */

import { HttpContext } from './http/context';
import { AuthController } from './controllers/auth.controller';
import { UserController } from './controllers/user.controller';
import { VersionController } from './controllers/version.controller';
import { HealthController } from './controllers/health.controller';
import { LicenseController } from './controllers/license.controller';

export async function routeRequest(ctx: HttpContext): Promise<void> {
  const { pathname, method } = ctx;

  // 1. Health & Metrics
  if (pathname === '/api/health' && method === 'GET') {
    return await HealthController.getHealth(ctx);
  }
  if (pathname === '/api/admin/stats' && method === 'GET') {
    return await HealthController.getStats(ctx);
  }

  // 2. Auth & Session
  if (pathname === '/api/admin/login' && method === 'POST') {
    return await AuthController.login(ctx);
  }
  if (pathname === '/api/admin/verify-session' && method === 'GET') {
    return await AuthController.verifySession(ctx);
  }
  if (pathname === '/api/admin/logout' && method === 'POST') {
    return await AuthController.logout(ctx);
  }
  if (pathname === '/api/admin/change-password' && method === 'POST') {
    return await AuthController.changePassword(ctx);
  }
  if (pathname === '/api/admin/security/reset-lockout' && method === 'POST') {
    return await AuthController.resetLockout(ctx);
  }

  // 3. User Management
  if (pathname === '/api/admin/users') {
    if (method === 'GET') return await UserController.getUsers(ctx);
    if (method === 'POST') return await UserController.createUser(ctx);
  }
  if ((pathname === '/api/admin/users/update' || pathname === '/api/admin/users') && (method === 'POST' || method === 'PUT')) {
    return await UserController.updateUser(ctx);
  }
  if (pathname === '/api/admin/users/toggle-status' && method === 'POST') {
    return await UserController.toggleStatus(ctx);
  }
  if ((pathname === '/api/admin/users/delete' || pathname === '/api/admin/users') && (method === 'POST' || method === 'DELETE')) {
    return await UserController.deleteUser(ctx);
  }

  // 4. Version (OTA & Admin)
  if ((pathname === '/api/transform/version' || pathname === '/api/version') && method === 'GET') {
    return await VersionController.getClientVersion(ctx);
  }
  if (pathname === '/api/admin/version') {
    if (method === 'GET') return await VersionController.getAdminVersion(ctx);
    if (method === 'POST') return await VersionController.updateAdminVersion(ctx);
  }

  // 5. Client License Verification & Public Lookup
  if (pathname === '/api/auth/verify' && method === 'POST') {
    return await LicenseController.verifyLicense(ctx);
  }
  if (pathname === '/api/license/lookup' && (method === 'GET' || method === 'POST')) {
    return await LicenseController.lookupLicense(ctx);
  }

  // 6. Admin License Operations
  if (pathname === '/api/admin/licenses' && method === 'GET') {
    return await LicenseController.getLicenses(ctx);
  }
  if (pathname === '/api/admin/licenses/create' && method === 'POST') {
    return await LicenseController.createLicenses(ctx);
  }
  if (pathname === '/api/admin/licenses/reset-hwid' && method === 'POST') {
    return await LicenseController.resetHwid(ctx);
  }
  if (pathname === '/api/admin/licenses/toggle-status' && method === 'POST') {
    return await LicenseController.toggleStatus(ctx);
  }
  if (pathname === '/api/admin/licenses/extend' && method === 'POST') {
    return await LicenseController.extendLicense(ctx);
  }
  if (pathname === '/api/admin/licenses/delete' && method === 'POST') {
    return await LicenseController.deleteLicense(ctx);
  }

  // RESTful Resource: /api/admin/licenses/:key
  if (pathname.startsWith('/api/admin/licenses/')) {
    const pathAction = pathname.replace('/api/admin/licenses/', '');
    if (pathAction && !['create', 'reset-hwid', 'toggle-status', 'extend', 'delete', 'logs'].includes(pathAction)) {
      return await LicenseController.handleRestfulLicense(ctx, pathAction);
    }
  }

  // 7. Audit Logs
  if ((pathname === '/api/admin/licenses/logs' || pathname === '/api/admin/logs') && method === 'GET') {
    return await LicenseController.getLogs(ctx);
  }

  // 8. Database Backup & Restore
  if (pathname === '/api/admin/backup' && method === 'GET') {
    return await LicenseController.backup(ctx);
  }
  if (pathname === '/api/admin/restore' && method === 'POST') {
    return await LicenseController.restore(ctx);
  }

  // Route Not Found
  return ctx.sendJson(404, { error: 'API route not found', path: pathname });
}
