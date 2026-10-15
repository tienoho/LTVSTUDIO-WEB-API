/**
 * LTVStudio Local & VPS Web API Server (TypeScript)
 * Bridges local HTTP requests to the unified api/index.ts handler and serves static files from public/
 */

import http from 'http';
import fs from 'fs';
import path from 'path';
import apiHandler from './api/index';

const PORT = Number(process.env.PORT) || 8080;
const DIST_DIR = path.join(__dirname, 'dist');
const PUBLIC_DIR = path.join(__dirname, 'public');

const MIME_TYPES: Record<string, string> = {
  '.html': 'text/html; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.js': 'application/javascript; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.webp': 'image/webp',
  '.svg': 'image/svg+xml',
  '.ico': 'image/x-icon',
  '.woff': 'font/woff',
  '.woff2': 'font/woff2',
  '.ttf': 'font/ttf',
  '.webmanifest': 'application/manifest+json'
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
    const decodedPath = decodeURIComponent(pathname);
    if (decodedPath.includes('..') || pathname.includes('..')) {
      res.writeHead(403, { 'Content-Type': 'text/plain; charset=utf-8' });
      res.end('403 Forbidden: Path traversal attempt blocked.');
      return;
    }
  } catch (e) {
    res.writeHead(400, { 'Content-Type': 'text/plain; charset=utf-8' });
    res.end('400 Bad Request');
    return;
  }

  // 3. Static Files & React SPA Routing (Prioritize dist/ then public/)
  const reqPath = pathname === '/' ? '/index.html' : pathname;
  const normalizedReqPath = path.normalize(reqPath).replace(/^(\.\.[\/\\])+/, '');
  
  const sendFileStream = (targetPath: string) => {
    const ext = path.extname(targetPath).toLowerCase();
    const contentType = MIME_TYPES[ext] || 'application/octet-stream';
    res.setHeader('Cache-Control', 'no-cache, must-revalidate');
    res.setHeader('Content-Type', contentType);
    const stream = fs.createReadStream(targetPath);
    stream.on('open', () => {
      if (!res.headersSent) {
        res.writeHead(200);
      }
    });
    stream.on('error', (err) => {
      if (!res.headersSent) {
        res.writeHead(500, { 'Content-Type': 'text/plain' });
        res.end('500 Internal Server Error');
      } else {
        res.destroy();
      }
    });
    req.on('close', () => stream.destroy());
    stream.pipe(res);
  };

  // Check in dist/ first
  const distResolved = path.resolve(DIST_DIR, '.' + path.sep + normalizedReqPath);
  if (distResolved.startsWith(path.resolve(DIST_DIR)) && fs.existsSync(distResolved) && fs.statSync(distResolved).isFile()) {
    return sendFileStream(distResolved);
  }

  // Check in public/ second
  const publicResolved = path.resolve(PUBLIC_DIR, '.' + path.sep + normalizedReqPath);
  if (publicResolved.startsWith(path.resolve(PUBLIC_DIR)) && fs.existsSync(publicResolved) && fs.statSync(publicResolved).isFile()) {
    return sendFileStream(publicResolved);
  }

  // Clean URLs & SPA Client-side Fallback (Return dist/index.html or public/index.html)
  const distIndex = path.join(DIST_DIR, 'index.html');
  if (fs.existsSync(distIndex)) {
    return sendFileStream(distIndex);
  }

  const publicIndex = path.join(PUBLIC_DIR, 'index.html');
  if (fs.existsSync(publicIndex)) {
    return sendFileStream(publicIndex);
  }

  res.writeHead(404, { 'Content-Type': 'application/json; charset=utf-8' });
  res.end(JSON.stringify({ error: '404 Not Found', path: pathname }));
});

server.on('error', (err: any) => {
  if (err.code === 'EADDRINUSE') {
    console.error(`[Server Error] Cổng ${PORT} đang được sử dụng bởi một tiến trình khác.`);
  } else {
    console.error('[Server Error]:', err);
  }
});

process.on('uncaughtException', (err: any) => {
  console.error('[Uncaught Exception Defended]:', err.message);
});

process.on('unhandledRejection', (reason: any) => {
  console.error('[Unhandled Rejection Defended]:', reason);
});

process.on('exit', (code) => {
  console.log(`[Process Exit Event] Server process exiting with code: ${code}`);
});

process.on('SIGINT', () => {
  console.log('[Process Signal] Received SIGINT, shutting down cleanly...');
  server.close(() => process.exit(0));
  setTimeout(() => process.exit(0), 1500).unref();
});

process.on('SIGTERM', () => {
  console.log('[Process Signal] Received SIGTERM, shutting down cleanly...');
  server.close(() => process.exit(0));
  setTimeout(() => process.exit(0), 1500).unref();
});

if (!process.env.VERCEL) {
  server.listen(PORT, () => {
    console.log('======================================================================');
    console.log(`  🚀 LTVSTUDIO WEB API & LICENSE SERVER (TYPESCRIPT) ON PORT ${PORT} `);
    console.log('======================================================================');
    console.log(`  • Home & Download Portal:    http://localhost:${PORT}/`);
    console.log(`  • License Key Lookup:        http://localhost:${PORT}/lookup`);
    console.log(`  • Admin Management Center:   http://localhost:${PORT}/admin`);
    console.log(`  • Developer API Docs:        http://localhost:${PORT}/docs`);
    console.log(`  • Health Check API:          http://localhost:${PORT}/api/health`);
    console.log(`  • Version API:               http://localhost:${PORT}/api/transform/version`);
    console.log(`  • Verify HWID API:           http://localhost:${PORT}/api/auth/verify`);
    console.log('======================================================================');
  });
}

export default server;
