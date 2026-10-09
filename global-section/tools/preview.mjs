import { createServer } from 'node:http';
import { readFile, realpath } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import { sep } from 'node:path';

const root = await realpath(fileURLToPath(new URL('../', import.meta.url)));
const types = {
  svg: 'image/svg+xml',
  html: 'text/html',
  css: 'text/css',
  js: 'text/javascript',
  mjs: 'text/javascript',
  json: 'application/json',
};
const server = createServer(async (request, response) => {
  try {
    const { pathname } = new URL(request.url, 'http://localhost');
    if (pathname === '/') {
      response.writeHead(302, { Location: '/example/index.html' });
      response.end();
      return;
    }
    const path = decodeURIComponent(pathname);
    const type = types[path.split('.').pop()];
    if (!type || path.split('/').some((part) => part.startsWith('.')) || !['GET', 'HEAD'].includes(request.method)) throw new Error('Not found');
    const file = await realpath(`${root}${path}`);
    if (!file.startsWith(`${root}${sep}`)) throw new Error('Not found');
    const content = await readFile(file);
    response.writeHead(200, { 'Content-Type': `${type}; charset=utf-8`, 'Cache-Control': 'no-store', 'X-Content-Type-Options': 'nosniff' });
    response.end(request.method === 'HEAD' ? undefined : content);
  } catch {
    response.writeHead(404);
    response.end('Not found');
  }
});
const port = Number(process.env.PORT || 3002);
server.listen(port, '127.0.0.1', () => {
  // eslint-disable-next-line no-console
  console.log(`Global section example: http://127.0.0.1:${port}/`);
});
