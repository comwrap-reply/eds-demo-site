import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';

const [fixture, sitemap] = await Promise.all([
  readFile(new URL('./fixtures/onlyfng-routes.json', import.meta.url), 'utf8'),
  readFile(new URL('./fixtures/onlyfng-sitemap.xml', import.meta.url), 'utf8'),
]);
const routes = JSON.parse(fixture);
const sitemapPaths = [...sitemap.matchAll(/<loc>([^<]+)<\/loc>/g)]
  .map(([, location]) => new URL(location).pathname)
  .sort();
const fixturePaths = routes.map(({ path }) => path).sort();

assert.equal(new Set(fixturePaths).size, fixturePaths.length, 'fixture routes must be unique');
assert.deepEqual(fixturePaths, sitemapPaths, 'fixture routes must exactly match the sitemap');
routes.forEach(({ path, blocks }) => {
  assert.ok(Array.isArray(blocks), `${path} must declare its expected block patterns`);
});

// eslint-disable-next-line no-console
console.log(`Validated ${routes.length} OnlyFNG sitemap routes and importer expectations.`);
