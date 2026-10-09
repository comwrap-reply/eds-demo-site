import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { test } from 'node:test';

const json = async (path) => JSON.parse(await readFile(new URL(`../../${path}`, import.meta.url), 'utf8'));

test('Global section uses only the new identity and retains layout defaults', async () => {
  const source = await json('layout/_global-section.json');
  const defs = await json('component-definition.json');
  const models = await json('component-models.json');
  const filters = await json('component-filters.json');
  const definition = defs.groups.flatMap((group) => group.components)
    .find((component) => component.id === 'global-section');
  assert.deepEqual(definition, source.definitions[0]);
  assert.equal(definition.title, 'Global section');
  assert.deepEqual(definition.plugins.xwalk.page, {
    resourceType: 'core/franklin/components/section/v1/section',
    template: {
      name: 'Global section',
      model: 'global-section',
      filter: 'global-section',
      layout: 'global-section-columns',
      'column-count': '2',
      'column-gap': 'medium',
    },
  });
  assert.deepEqual(models.find((model) => model.id === 'global-section'), source.models[0]);
  assert.deepEqual(filters.find((filter) => filter.id === 'global-section'), source.filters[0]);
  assert(filters.find((filter) => filter.id === 'main').components.includes('global-section'));
  ['global-title', 'global-text', 'global-image', 'teaser'].forEach((id) => {
    const field = models.find((model) => model.id === id).fields
      .find((item) => item.name === 'classes_layoutcolumn');
    assert.equal(field.description, 'Used inside Global section with Columns layout.');
  });
});

test('Global section and Native V3 have separate groups and isolated filters', async () => {
  const defs = await json('component-definition.json');
  const models = await json('component-models.json');
  const filters = await json('component-filters.json');
  const groups = defs.groups.filter((g) => g.id === 'layouts-v3');
  assert.equal(groups.length, 1);
  assert.deepEqual(groups[0].components.map((c) => c.id), ['section-native-v3', 'columns-native-v3']);
  const layouts = defs.groups.filter((g) => g.id === 'layouts');
  assert.equal(layouts.length, 1);
  assert.equal(layouts[0].title, 'Layouts');
  assert.deepEqual(layouts[0].components.map((c) => c.id), ['global-section']);
  const all = defs.groups.flatMap((g) => g.components);
  assert.equal(new Set(all.map((c) => c.id)).size, all.length);
  assert.equal(new Set(models.map((m) => m.id)).size, models.length);
  assert.equal(new Set(filters.map((f) => f.id)).size, filters.length);
  assert.deepEqual(filters.find((f) => f.id === 'column-native-v3').components, ['title', 'text', 'image', 'button']);
  assert.deepEqual(filters.find((f) => f.id === 'global-section').components, ['global-title', 'global-text', 'global-image', 'teaser']);
  const shared = await json('layout/_block-layout.json');
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

test('the site and portable package have identical saved custom contracts', async () => {
  assert.deepEqual(await json('layout/_global-section.json'), await json('global-section/authoring/section.json'));
  assert.deepEqual(await json('layout/_block-layout.json'), await json('global-section/authoring/placement.json'));
  const files = await Promise.all(['component-definition.json', 'component-models.json', 'component-filters.json'].map(json));
  const generated = JSON.stringify(files);
  assert(!generated.includes('section-custom-v3'), 'no old custom definition/model/filter');
  assert(!generated.includes('columns-v3'), 'no old custom layout value');
  assert(!generated.includes('classes_layoutv3'), 'no old placement properties');
  assert(!generated.includes('Layout - V3'), 'no old placement tab');
});
