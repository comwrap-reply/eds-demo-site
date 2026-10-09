import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { test } from 'node:test';

const json = async (path) => JSON.parse(await readFile(new URL(`../../${path}`, import.meta.url), 'utf8'));

test('Global section renames author-facing labels without changing V3 identity or defaults', async () => {
  const source = await json('layout-v3/_custom-v3.json');
  const defs = await json('component-definition.json');
  const models = await json('component-models.json');
  const filters = await json('component-filters.json');
  const definition = defs.groups.flatMap((group) => group.components)
    .find((component) => component.id === 'section-custom-v3');
  assert.deepEqual(definition, source.definitions[0]);
  assert.equal(definition.title, 'Global section');
  assert.deepEqual(definition.plugins.xwalk.page, {
    resourceType: 'core/franklin/components/section/v1/section',
    template: {
      name: 'Global section',
      model: 'section-custom-v3',
      filter: 'section-custom-v3',
      layout: 'columns-v3',
      'column-count': '2',
      'column-gap': 'medium',
    },
  });
  assert.deepEqual(models.find((model) => model.id === 'section-custom-v3'), source.models[0]);
  assert.deepEqual(filters.find((filter) => filter.id === 'section-custom-v3'), source.filters[0]);
  assert(filters.find((filter) => filter.id === 'main').components.includes('section-custom-v3'));
  ['global-title', 'global-text', 'global-image', 'teaser'].forEach((id) => {
    const field = models.find((model) => model.id === id).fields
      .find((item) => item.name === 'classes_layoutv3column');
    assert.equal(field.description, 'Only used inside Global section with Columns layout. Native Columns - V3 uses standard content instead.');
  });
});

test('both V3 approaches are registered once and use isolated allowed-content filters', async () => {
  const defs = await json('component-definition.json');
  const models = await json('component-models.json');
  const filters = await json('component-filters.json');
  const groups = defs.groups.filter((g) => g.id === 'layouts-v3');
  assert.equal(groups.length, 1);
  assert.deepEqual(groups[0].components.map((c) => c.id), ['section-native-v3', 'columns-native-v3', 'section-custom-v3']);
  const all = defs.groups.flatMap((g) => g.components);
  assert.equal(new Set(all.map((c) => c.id)).size, all.length);
  assert.equal(new Set(models.map((m) => m.id)).size, models.length);
  assert.equal(new Set(filters.map((f) => f.id)).size, filters.length);
  assert.deepEqual(filters.find((f) => f.id === 'column-native-v3').components, ['title', 'text', 'image', 'button']);
  assert.deepEqual(filters.find((f) => f.id === 'section-custom-v3').components, ['global-title', 'global-text', 'global-image', 'teaser']);
  const shared = await json('layout-v3/_block-layout-v3.json');
  ['global-title', 'global-text', 'global-image', 'teaser'].forEach((id) => {
    const { fields } = models.find((m) => m.id === id);
    const placement = fields.filter((f) => shared.fields.some((s) => s.name === f.name));
    assert.deepEqual(placement, shared.fields);
    assert.equal(new Set(fields.map((f) => f.name)).size, fields.length);
  });
  const native = all.find((c) => c.id === 'columns-native-v3').plugins.xwalk.page;
  assert.equal(native.resourceType, 'core/franklin/components/columns/v1/columns');
  assert.deepEqual(Object.keys(native.template).sort(), ['classes', 'classes_gap', 'columns', 'rows']);
});
