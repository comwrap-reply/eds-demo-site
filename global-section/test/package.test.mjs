import assert from 'node:assert/strict';
import { readFile, readdir, access } from 'node:fs/promises';
import { test } from 'node:test';

const root = new URL('../', import.meta.url);
const read = async (path) => readFile(new URL(path, root), 'utf8');
const json = async (path) => JSON.parse(await read(path));

test('authoring contributions are resolved and retain the persisted contract', async () => {
  const definitions = await json('authoring/component-definition.json');
  const models = await json('authoring/component-models.json');
  const filters = await json('authoring/component-filters.json');
  const ids = ['global-section', 'global-title', 'global-text', 'global-image', 'teaser'];
  const definitionIds = definitions.groups.flatMap((group) => (
    group.components.map((item) => item.id)
  ));
  assert.deepEqual(definitionIds, ids);
  assert.deepEqual(models.map((item) => item.id), ids);
  assert.equal(definitions.groups[0].components[0].plugins.xwalk.page.template.layout, 'global-section-columns');
  assert.deepEqual(filters, [{ id: 'global-section', components: ids.slice(1) }]);
  assert(!JSON.stringify(models).includes('"..."'), 'no external aggregation references');
  const { fields } = await json('authoring/placement.json');
  models.slice(1).forEach((model) => {
    assert.deepEqual(model.fields.slice(-fields.length), fields);
    assert.equal(new Set(model.fields.map((field) => field.name)).size, model.fields.length);
  });
});

async function files(path = '') {
  const entries = await readdir(new URL(path || '.', root), { withFileTypes: true });
  return (await Promise.all(entries.filter((entry) => !['integration', 'node_modules', '.git'].includes(entry.name))
    .map((entry) => (entry.isDirectory() ? files(`${path}${entry.name}/`) : `${path}${entry.name}`)))).flat();
}

test('JavaScript and CSS dependency graph stays inside the copyable folder', async () => {
  const paths = (await files()).filter((path) => /\.(js|mjs|css)$/.test(path));
  await Promise.all(paths.map(async (path) => {
    const content = await read(path);
    const pattern = /(?:from\s*|import\s*\(?|@import\s*url\()['"]([^'"]+)['"]/g;
    await Promise.all([...content.matchAll(pattern)].map(async ([, specifier]) => {
      if (specifier.startsWith('node:')) return;
      assert(specifier.startsWith('.'), `${path}: unexpected dependency ${specifier}`);
      const dependency = new URL(specifier, new URL(path, root));
      assert(dependency.href.startsWith(root.href), `${path}: dependency escapes package`);
      await access(dependency);
    }));
  }));
});
