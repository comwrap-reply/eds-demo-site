import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { test } from 'node:test';

const source = await readFile(new URL('../../blocks/freeform/source.js', import.meta.url), 'utf8');
const { encodeSource, decodeSource } = await import(`data:text/javascript,${encodeURIComponent(source)}`);
const services = await readFile(new URL('./fixtures/services.html', import.meta.url), 'utf8');

test('the pasted services card survives storage byte for byte', () => {
  const stored = encodeSource(services);
  assert.ok(stored.startsWith('freeform-html-v2='));
  assert.ok(!stored.includes('<'));
  assert.ok(!stored.includes(':'), 'storage must not trigger AEM icon notation');
  assert.equal(decodeSource(`\n${stored}\n`), services);
});

test('Unicode, entities, scripts, and source whitespace survive exactly once', () => {
  const snippet = '\n<div aria-label="café 日本語 🦋">&amp; &lt;tag&gt;</div>\n<script>\n// keep this newline\nwindow.example = "✓";\n</script>\n';
  assert.equal(decodeSource(encodeSource(snippet)), snippet);
  assert.equal(decodeSource(encodeSource('freeform:v1:literal source')), 'freeform:v1:literal source');
});

test('empty and legacy source remain compatible', () => {
  assert.equal(encodeSource(''), 'freeform-html-v2=');
  assert.equal(decodeSource(encodeSource('')), '');
  assert.equal(decodeSource(''), '');
  assert.equal(decodeSource(services), services);
  assert.equal(decodeSource('SGVsbG8='), 'SGVsbG8=');
});

test('corrupted encoded source is rejected instead of executed', () => {
  assert.throws(() => decodeSource('freeform-html-v2=<script>bad()</script>'));
  assert.throws(() => decodeSource('freeform-html-v2=/w=='));
  assert.throws(() => decodeSource('freeform:v1:<script>bad()</script>'));
  assert.throws(() => decodeSource('freeform:v1:/w=='));
});

test('existing v1 saves remain readable and migrate on the next save', () => {
  const legacy = `freeform:v1:${encodeSource(services).split('freeform-html-v2=')[1]}`;
  assert.equal(decodeSource(legacy), services);
  assert.equal(decodeSource('freeform:v1:'), '');
  assert.ok(encodeSource(decodeSource(legacy)).startsWith('freeform-html-v2='));
});
