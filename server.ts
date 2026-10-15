/**
 * LTVStudio Local & VPS Web API Server (TypeScript)
 * Bridges local HTTP requests to the unified api/index.ts handler and serves static files from public/
 */

import http from 'http';
import fs from 'fs';
import path from 'path';
import apiHandler from './api/index';

const PORT = Number(process.env.PORT) || 8080;
const PUBLIC_DIR = path.join(__dirname, 'public');

const MIME_TYPES: Record<string, string> = {
  '.html': 'text/html; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.js': 'application/javascript; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.svg': 'image/svg+xml',
  '.ico': 'image/x-icon'
};

const server = http.createServer(async (req: http.IncomingMessage, res: http.ServerResponse) => {
  const host = req.headers.host || `localhost:${PORT}`;
  const parsedUrl = new URL(req.url || '/', `http://${host}`);
  const pathname = parsedUrl.pathname || '/';

  // 1. API Routes -> Handled by Serverless api/index.ts
  if (pathname.startsWith('/api')) {
    try {
      return await apiHandler(req, res);
    } catch (err: any) {
      console.error('[API Handler Error]:', err);
      if (!res.headersSent) {
        res.writeHead(500, { 'Content-Type': 'application/json; charset=utf-8' });
        res.end(JSON.stringify({ error: 'Internal Server Error', message: 'Đã xảy ra lỗi trên máy chủ. Vui lòng thử lại sau!' }));
      }
      return;
    }
  }

  // Security Headers
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('X-Frame-Options', 'SAMEORIGIN');
  res.setHeader('X-XSS-Protection', '1; mode=block');
  res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');

  // 2. Proactive Path Traversal Check (CWE-22)
  try {
    const rawUrl = req.url || '';
    const decodedUrl = decodeURIComponent(rawUrl);
    if (decodedUrl.includes('..') || rawUrl.includes('..')) {
      res.writeHead(403, { 'Content-Type': 'text/plain; charset=utf-8' });
      res.end('403 Forbidden: Path traversal attempt blocked.');
      return;
    }
  } catch (e) {
    res.writeHead(400, { 'Content-Type': 'text/plain; charset=utf-8' });
    res.end('400 Bad Request');
    return;
  }

  // 3. Static Files in public/
  const reqPath = pathname === '/' ? '/index.html' : pathname;
  const normalizedReqPath = path.normalize(reqPath).replace(/^(\.\.[\/\\])+/, '');
  const resolvedPath = path.resolve(PUBLIC_DIR, '.' + path.sep + normalizedReqPath);

  // Strict Jail Check: Must reside within PUBLIC_DIR
  if (!resolvedPath.startsWith(path.resolve(PUBLIC_DIR))) {
    res.writeHead(403, { 'Content-Type': 'text/plain; charset=utf-8' });
    res.end('403 Forbidden: Access Denied');
    return;
  }

  const filePath = resolvedPath;

  fs.stat(filePath, (err: any, stats: any) => {
    if (!err && stats.isFile()) {
      const ext = path.extname(filePath).toLowerCase();
      const contentType = MIME_TYPES[ext] || 'application/octet-stream';
      res.writeHead(200, { 'Content-Type': contentType });
      fs.createReadStream(filePath).pipe(res);
    } else {
      // SPA Fallback: ONLY fallback to index.html if request has NO file extension
      const ext = path.extname(pathname);
      if (!ext) {
        const indexPath = path.join(PUBLIC_DIR, 'index.html');
        if (fs.existsSync(indexPath)) {
          res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' });
          fs.createReadStream(indexPath).pipe(res);
          return;
        }
      }
      res.writeHead(404, { 'Content-Type': 'application/json; charset=utf-8' });
      res.end(JSON.stringify({ error: '404 Not Found', path: pathname }));
    }
  });
});

server.listen(PORT, () => {
  console.log('======================================================================');
  console.log(`  🚀 LTVSTUDIO WEB API & LICENSE SERVER (TYPESCRIPT) ON PORT ${PORT} `);
  console.log('======================================================================');
  console.log(`  • Web Portal & Admin Center: http://localhost:${PORT}/`);
  console.log(`  • Health Check API:          http://localhost:${PORT}/api/health`);
  console.log(`  • Version API:               http://localhost:${PORT}/api/transform/version`);
  console.log(`  • Verify HWID API:           http://localhost:${PORT}/api/auth/verify`);
  console.log(`  • Public License Lookup:     http://localhost:${PORT}/api/license/lookup?key=...`);
  console.log('======================================================================');
});
