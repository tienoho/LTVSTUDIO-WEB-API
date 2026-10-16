/**
 * Vercel Serverless Catch-All API Handler
 * Handles all subroutes under /api/* (e.g. /api/admin/login, /api/health, /api/transform/version)
 */
import handler from './index';

(handler as any).default = handler;
export default handler;
