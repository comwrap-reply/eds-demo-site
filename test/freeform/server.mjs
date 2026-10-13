/* Local HTTP fixture, not an AEM implementation or a deployment dependency. */
import { createServer } from 'node:http';
import { readFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = fileURLToPath(new URL('../../', import.meta.url));
const pageContent = '/content/demo/freeform/jcr:content';
const property = './root/section/freeform/text';
let stored = '<p>Paste your HTML with Edit HTML.</p>';
let denyNextSave = false;
const types = { '.js': 'text/javascript', '.css': 'text/css', '.html': 'text/html' };

createServer(async (req, res) => {
  const url = new URL(req.url, 'http://localhost:3002');
  const send = (status, value, type = 'application/json') => {
    res.writeHead(status, { 'Content-Type': type, 'Cache-Control': 'no-store' });
    res.end(type === 'application/json' ? JSON.stringify(value) : value);
  };
  if (req.method === 'GET' && url.pathname === `${pageContent}/root/section/freeform.json`) {
    send(200, { model: 'freeform', 'sling:resourceType': 'core/franklin/components/block/v1/block', text: stored });
  } else if (req.method === 'GET' && url.pathname === '/libs/granite/csrf/token.json') {
    send(200, { token: 'local-test-token' });
  } else if (req.method === 'POST' && url.pathname === '/test/deny-next-save') {
    denyNextSave = true;
    send(200, {});
  } else if (req.method === 'POST' && url.pathname === pageContent) {
    if (denyNextSave || req.headers['csrf-token'] !== 'local-test-token') {
      denyNextSave = false;
      send(403, {});
      return;
    }
    const chunks = [];
    // eslint-disable-next-line no-restricted-syntax
    for await (const chunk of req) chunks.push(chunk);
    const form = await new Request(url, {
      method: 'POST', headers: req.headers, body: Buffer.concat(chunks),
    }).formData();
    stored = form.get(property);
    send(200, { status: { code: 200 } });
  } else if (req.method === 'GET') {
    const file = path.resolve(root, `.${url.pathname === '/' ? '/test/freeform/editor.html' : url.pathname}`);
    if (!file.startsWith(root) || !types[path.extname(file)]) { send(404, {}); return; }
    try {
      send(200, await readFile(file), types[path.extname(file)]);
    } catch { send(404, {}); }
  } else { send(404, {}); }
}).listen(3002, '127.0.0.1', () => {
  // eslint-disable-next-line no-console
  console.log('Freeform editor test: http://localhost:3002/test/freeform/editor.html');
});
