const http = require('http');
const fs = require('fs');
const path = require('path');

const PORT = 4000;
const ROOT = __dirname;

const MIME = {
  '.html': 'text/html',
  '.css': 'text/css',
  '.js': 'application/javascript',
  '.json': 'application/json',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.gif': 'image/gif',
  '.webp': 'image/webp',
  '.svg': 'image/svg+xml',
  '.ico': 'image/x-icon',
  '.md': 'text/markdown'
};

const server = http.createServer((req, res) => {
  let url = req.url.split('?')[0];
  if (url === '/') url = '/index.html';

  const filePath = path.join(ROOT, url);
  const ext = path.extname(filePath);

  // 安全检查：防止目录遍历
  if (!filePath.startsWith(ROOT)) {
    res.writeHead(403);
    res.end('Forbidden');
    return;
  }

  fs.readFile(filePath, (err, data) => {
    if (err) {
      if (err.code === 'ENOENT') {
        // 尝试读取 index.html（SPA fallback）
        fs.readFile(path.join(ROOT, 'index.html'), (e2, d2) => {
          if (e2) { res.writeHead(404); res.end('Not Found'); return; }
          res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' });
          res.end(d2);
        });
      } else {
        res.writeHead(500);
        res.end('Server Error');
      }
      return;
    }

    // 支持 PUT 请求（管理后台保存数据）
    if (req.method === 'PUT') {
      let body = '';
      req.on('data', chunk => body += chunk);
      req.on('end', () => {
        fs.writeFile(filePath, body, 'utf-8', (e) => {
          if (e) { res.writeHead(500); res.end('Write Error'); return; }
          res.writeHead(200, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({ success: true }));
        });
      });
      return;
    }

    res.writeHead(200, {
      'Content-Type': (MIME[ext] || 'application/octet-stream') + '; charset=utf-8',
      'Cache-Control': 'no-cache'
    });
    res.end(data);
  });
});

server.listen(PORT, () => {
  console.log(`\n  ✦ 紫微斗数知识分享\n`);
  console.log(`  前台首页:  http://localhost:${PORT}/`);
  console.log(`  详情页:    http://localhost:${PORT}/detail.html`);
  console.log(`  我的分享:  http://localhost:${PORT}/share.html`);
  console.log(`  管理后台:  http://localhost:${PORT}/admin.html`);
  console.log(`\n  按 Ctrl+C 停止服务\n`);
});
