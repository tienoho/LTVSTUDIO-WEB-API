/**
 * Neon Postgres Database Facade & Unified Exports
 * Adheres to SOLID Principles (SRP, OCP, LSP, ISP, DIP)
 */

// 1. Connection & Health
export {
  getDatabaseUrl,
  isNeonConfigured,
  getClient,
  checkDbHealth
} from './connection';

// 2. Schema Initializer & Seeder
export { initDb } from './schema';

// 3. Domain Model Mappers
export { mapLicenseRow, mapUserRow } from './mappers';

// 4. License Operations
export {
  getLicenses,
  getLicenseByKey,
  createLicense,
  createLicensesBatch,
  updateLicense,
  deleteLicense,
  getStats,
  restoreDatabase
} from './license.sql';

// 5. Version OTA Operations
export {
  getVersionConfig,
  updateVersionConfig
} from './version.sql';

// 6. Audit Trail & Activation Logs
export {
  logActivation,
  getActivationLogs
} from './log.sql';

// 7. Multi-User RBAC Operations
export {
  getAllDbUsers,
  getDbUserByUsername,
  createDbUser,
  updateDbUser,
  updateDbUserPassword,
  updateDbUserLastLogin,
  deleteDbUser
} from './user.sql';

// 8. Password Hashing (Cryptographic Security Re-export)
export { hashPassword, verifyPassword } from '../security/crypto';
