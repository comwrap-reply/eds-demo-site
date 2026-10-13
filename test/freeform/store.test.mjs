/* global globalThis */
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { test } from 'node:test';

const read = (file) => readFile(new URL(`../../blocks/freeform/${file}`, import.meta.url), 'utf8');
const moduleURL = (code) => `data:text/javascript,${encodeURIComponent(code)}`;
const sourceURL = moduleURL(await read('source.js'));
const { encodeSource } = await import(sourceURL);
const { authorTarget, loadSource, saveSource } = await import(moduleURL(
  (await read('store.js')).replace("'./source.js'", JSON.stringify(sourceURL)),
));
const origin = 'https://author.example.com';
const resource = 'urn:aemconnection:/content/site/page/jcr:content/root/section/freeform';
const target = authorTarget(resource, `aem:${origin}`, origin);

function backend(t, { text = '', rejectPost = false, rewrite = false } = {}) {
  let stored = text;
  const calls = [];
  t.mock.method(globalThis, 'fetch', async (url, options) => {
    calls.push({ url, options });
    if (url === `${target.path}.json`) {
      return Response.json({ model: 'freeform', 'sling:resourceType': 'core/franklin/components/block/v1/block', text: stored });
    }
    if (url === '/libs/granite/csrf/token.json') return Response.json({ token: 'test-token' });
    assert.equal(url, target.pageContent);
    if (rejectPost) return new Response('', { status: 403 });
    stored = rewrite ? 'changed by server' : options.body.get(`./${target.relative}/text`);
    return Response.json({ status: { code: 200 } });
  });
  return { calls, stored: () => stored };
}

test('author target rejects other origins, invalid resources, and traversal', () => {
  assert.equal(target.path, '/content/site/page/jcr:content/root/section/freeform');
  assert.equal(target.relative, 'root/section/freeform');
  assert.deepEqual(authorTarget(resource, `xwalk:${origin}`, origin), target);
  assert.equal(authorTarget(resource, 'aem:https://other.example.com', origin), null);
  assert.equal(authorTarget(resource, undefined, origin), null);
  ['/etc/password', '/content/site/../page/jcr:content/freeform', '/content/site/%2e%2e/page/jcr:content/freeform', '/content/site/page/jcr:content/freeform?delete=true'].forEach((path) => {
    assert.equal(authorTarget(`urn:aemconnection:${path}`, `aem:${origin}`, origin), null);
  });
});

test('save sends encoded content with CSRF and verifies the persisted value', async (t) => {
  const api = backend(t, { text: 'old HTML' });
  const snippet = await readFile(new URL('./fixtures/services.html', import.meta.url), 'utf8');
  assert.equal(await loadSource(target), 'old HTML');
  assert.equal(await saveSource(target, snippet, 'old HTML'), encodeSource(snippet));
  const post = api.calls.find(({ options }) => options.method === 'POST');
  assert.equal(post.options.headers['CSRF-Token'], 'test-token');
  assert.equal(post.options.credentials, 'same-origin');
  assert.equal(post.options.redirect, 'error');
  assert.equal(post.options.body.get(`./${target.relative}/text`), encodeSource(snippet));
  assert.equal(post.options.body.get(`./${target.relative}/modelFields`), 'text@textarea');
  assert.equal(post.options.body.get(`./${target.relative}/modelFields@TypeHint`), 'String[]');
  assert.equal(post.options.body.get('./cq:lastModified@TypeHint'), 'Date');
  assert.equal(api.calls.at(-1).url, `${target.path}.json`);
});

test('changed content is not overwritten', async (t) => {
  const api = backend(t, { text: 'another authors update' });
  await assert.rejects(saveSource(target, '<div>new</div>', 'old HTML'), /changed after you opened/);
  assert.equal(api.calls.length, 1);
  assert.equal(api.stored(), 'another authors update');
});

test('failed permissions and altered readback do not report a successful save', async (t) => {
  backend(t, { rejectPost: true });
  await assert.rejects(saveSource(target, '<p>new</p>', ''), /denied access/);
  t.mock.restoreAll();
  backend(t, { rewrite: true });
  await assert.rejects(saveSource(target, '<p>new</p>', ''), /did not return the saved HTML/);
});

test('retry after a lost save response succeeds without another write', async (t) => {
  const api = backend(t, { text: encodeSource('<p>already saved</p>') });
  assert.equal(await saveSource(target, '<p>already saved</p>', 'old'), api.stored());
  assert.equal(api.calls.length, 1);
});

test('empty source persists the marker instead of deleting a property', async (t) => {
  const api = backend(t, { text: 'old' });
  await saveSource(target, '', 'old');
  assert.equal(api.stored(), 'freeform-html-v2=');
});

test('deleted blocks, missing sessions and network failures stop before writing', async (t) => {
  const fake = t.mock.method(globalThis, 'fetch', async () => new Response('', { status: 404 }));
  await assert.rejects(saveSource(target, 'new', ''), /404/);
  assert.equal(fake.mock.calls.length, 1);
  fake.mock.mockImplementation(async (url) => Response.json(url.endsWith('token.json') ? {} : {
    model: 'freeform', 'sling:resourceType': 'core/franklin/components/block/v1/block', text: '',
  }));
  await assert.rejects(saveSource(target, 'new', ''), /Sign in/);
  fake.mock.mockImplementation(async () => { throw new Error('Network unavailable'); });
  await assert.rejects(saveSource(target, 'new', ''), /Network unavailable/);
});
