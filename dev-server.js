'use strict';

const http = require('http');
const path = require('path');
const fs = require('fs');

const rootDir = __dirname;
const port = process.env.PORT || 3000;

function send(res, status, headers, body) {
  res.writeHead(status, headers);
  res.end(body);
}

function contentType(filePath) {
  const ext = path.extname(filePath).toLowerCase();
  if (ext === '.html') return 'text/html; charset=utf-8';
  if (ext === '.css') return 'text/css; charset=utf-8';
  if (ext === '.js') return 'application/javascript; charset=utf-8';
  if (ext === '.svg') return 'image/svg+xml';
  if (ext === '.png') return 'image/png';
  if (ext === '.jpg' || ext === '.jpeg') return 'image/jpeg';
  if (ext === '.json') return 'application/json; charset=utf-8';
  return 'application/octet-stream';
}

async function handleSendLead(req, res) {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return send(res, 200, {
      'Content-Type': 'application/json',
      'Access-Control-Allow-Origin': process.env.ALLOW_ORIGIN || '*',
      'Access-Control-Allow-Methods': 'POST,OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type',
    }, JSON.stringify({ ok: true }));
  }

  if (req.method !== 'POST') {
    return send(res, 405, { 'Content-Type': 'application/json' }, JSON.stringify({ ok: false, error: 'Method not allowed' }));
  }

  try {
    let body = '';
    req.on('data', (chunk) => { body += chunk; });
    req.on('end', async () => {
      const event = {
        body: body || '{}',
        requestContext: { http: { method: 'POST' } },
      };
      const handlerPath = path.join(rootDir, 'server', 'send-lead', 'index.js');
      // eslint-disable-next-line @typescript-eslint/no-var-requires
      const { handler } = require(handlerPath);
      const result = await handler(event);
      const headers = result.headers || { 'Content-Type': 'application/json' };
      send(res, result.statusCode || 200, headers, typeof result.body === 'string' ? result.body : JSON.stringify(result.body || {}));
    });
  } catch (err) {
    // eslint-disable-next-line no-console
    console.error('send-lead error', err);
    return send(res, 500, { 'Content-Type': 'application/json' }, JSON.stringify({ ok: false, error: 'Internal error' }));
  }
}

function serveStatic(req, res) {
  const urlPath = decodeURIComponent(req.url.split('?')[0]);
  let filePath = path.join(rootDir, urlPath === '/' ? '/index.html' : urlPath);
  // Prevent directory traversal
  if (!filePath.startsWith(rootDir)) {
    return send(res, 400, { 'Content-Type': 'text/plain' }, 'Bad request');
  }
  fs.stat(filePath, (err, stats) => {
    if (!err && stats.isDirectory()) {
      filePath = path.join(filePath, 'index.html');
    }
    fs.readFile(filePath, (readErr, data) => {
      if (readErr) {
        // SPA fallback: serve index.html for unknown routes
        const fallback = path.join(rootDir, 'index.html');
        return fs.readFile(fallback, (fbErr, fbData) => {
          if (fbErr) return send(res, 404, { 'Content-Type': 'text/plain' }, 'Not Found');
          return send(res, 200, { 'Content-Type': 'text/html; charset=utf-8' }, fbData);
        });
      }
      return send(res, 200, { 'Content-Type': contentType(filePath) }, data);
    });
  });
}

const server = http.createServer((req, res) => {
  if (req.url && req.url.startsWith('/api/send-lead')) {
    return void handleSendLead(req, res);
  }
  return void serveStatic(req, res);
});

server.listen(port, () => {
  // eslint-disable-next-line no-console
  console.log(`Dev server running at http://localhost:${port}`);
});


