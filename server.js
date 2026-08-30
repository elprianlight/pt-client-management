delete process.env.TURBOPACK;

process.on('uncaughtException', (err) => {
  if (err && (err.code === 'ECANCELED' || err.code === 'EPIPE') && err.syscall === 'read') {
    return;
  }
  console.error('Uncaught Exception:', err);
});

if (process.stdin && !process.stdin.isTTY) {
  process.stdin.on('error', () => {});
  try { process.stdin.resume(); } catch (e) {}
}

const http = require('http');
const next = require('next');

const dev = process.env.NODE_ENV !== 'production';
const hostname = '0.0.0.0';
const port = parseInt(process.env.PORT || '3000', 10);

// Disable turbopack explicitly for custom server
const app = next({ dev, hostname, port, turbo: false });
const handle = app.getRequestHandler();

let isReady = false;

const server = http.createServer(async (req, res) => {
  if (!isReady) {
    res.writeHead(503, {
      'Content-Type': 'text/html; charset=utf-8',
      'Retry-After': '2',
    });
    res.end(`<!DOCTYPE html>
<html lang="id">
<head>
  <meta charset="utf-8">
  <meta http-equiv="refresh" content="2">
  <title>Menyiapkan PT Client Management...</title>
  <style>
    body {
      background: #09090b;
      color: #f1f5f9;
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
      display: flex;
      align-items: center;
      justify-content: center;
      height: 100vh;
      margin: 0;
    }
    .card {
      background: rgba(24, 24, 27, 0.8);
      border: 1px solid rgba(255, 255, 255, 0.1);
      border-radius: 16px;
      padding: 32px 40px;
      text-align: center;
      max-width: 440px;
      box-shadow: 0 20px 40px rgba(0,0,0,0.5);
    }
    h2 { font-size: 20px; font-weight: 600; margin-bottom: 8px; color: #818cf8; }
    p { font-size: 14px; color: #94a3b8; line-height: 1.5; }
    .spinner {
      width: 28px; height: 28px;
      border: 3px solid rgba(99, 102, 241, 0.2);
      border-top-color: #6366f1;
      border-radius: 50%;
      animation: spin 0.8s linear infinite;
      margin: 0 auto 16px;
    }
    @keyframes spin { to { transform: rotate(360deg); } }
  </style>
</head>
<body>
  <div class="card">
    <div class="spinner"></div>
    <h2>Menyiapkan Aplikasi...</h2>
    <p>Server sedang mengompilasi modul Next.js. Halaman ini akan otomatis memuat aplikasi dalam beberapa detik.</p>
  </div>
</body>
</html>`);
    return;
  }

  try {
    await handle(req, res);
  } catch (err) {
    console.error('Error handling request:', req.url, err);
    res.statusCode = 500;
    res.end('Internal Server Error');
  }
});

server.listen(port, hostname, () => {
  console.log(`> HTTP Server langsung aktif dan mendengarkan di http://localhost:${port}`);
  console.log('  Mempersiapkan router & modul Next.js (Webpack mode)...');

  app.prepare()
    .then(() => {
      isReady = true;
      console.log(`> [BERHASIL] PT Client Management System 100% siap di http://localhost:${port}`);
    })
    .catch((err) => {
      console.error('Gagal menyiapkan Next.js:', err);
    });
});
