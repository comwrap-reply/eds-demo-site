import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { test } from 'node:test';
import {
  sectionSettings, blockPlacement, assignColumns, groupRows, WIDTH_VALUES, GAP_VALUES,
} from '../../layout-v2/layout-v2.js';

test('only the explicit V2 metadata enables the layout', () => {
  [undefined, {}, { layout: 'default' }, { layout: 'columns' }].forEach((data) => {
    assert.equal(sectionSettings(data).enabled, false);
  });
  assert.deepEqual(sectionSettings({ layout: 'columns-v2' }), { enabled: true, count: 2, gap: 24 });
});

test('counts 1–4 and existing gap tokens have deterministic safe defaults', () => {
  [1, 2, 3, 4].forEach((count) => {
    assert.equal(sectionSettings({ columnCount: String(count) }).count, count);
  });
  ['', '0', '5', '2.5', '-1', '2junk', 'NaN'].forEach((columnCount) => {
    assert.equal(sectionSettings({ columnCount }).count, 2);
  });
  Object.entries(GAP_VALUES).forEach(([columnGap, gap]) => {
    assert.equal(sectionSettings({ columnGap }).gap, gap);
  });
  assert.equal(sectionSettings({ columnGap: 'constructor' }).gap, 24);
});

test('placement defaults and all supported widths and alignments', () => {
  assert.deepEqual(blockPlacement(), {
    column: 1, width: 1, align: 'start', row: 'own',
  });
  Object.entries(WIDTH_VALUES).forEach(([token, width]) => {
    assert.equal(blockPlacement([`layout-v2-width-${token}`]).width, width);
  });
  ['start', 'center', 'end'].forEach((align) => {
    assert.equal(blockPlacement([`layout-v2-align-${align}`]).align, align);
  });
  assert.deepEqual(
    blockPlacement(['layout-v2-column-0', 'layout-v2-width-wrong', 'grid-span-3']),
    blockPlacement(),
  );
  assert.equal(blockPlacement(['layout-v2-column-3', 'layout-v2-column-4']).column, 1);
});

test('assignment retains saved order and empty columns', () => {
  const items = [2, 1, 2, 4, 1].map((column, id) => ({ id, column }));
  const columns = assignColumns(items, 4);
  assert.deepEqual(columns.map((column) => column.map(({ id }) => id)), [[1, 4], [0, 2], [], [3]]);
  assert.equal(columns[1][0], items[0]);
  [1, 2, 3, 4].forEach((count) => assert.equal(assignColumns([], count).length, count));
});

test('count reduction clamps rendering without altering saved assignments', () => {
  const items = [1, 4, 2, 3].map((column) => ({ column }));
  assert.deepEqual(assignColumns(items, 2)[1].map(({ column }) => column), [4, 2, 3]);
  assert.deepEqual(items.map(({ column }) => column), [1, 4, 2, 3]);
  assert.deepEqual(assignColumns(items, 4).map((column) => column.length), [1, 1, 1, 1]);
});

test('own rows and alignment changes interrupt consecutive compatible shared groups', () => {
  const items = ['share:start', 'share:start', 'own:start', 'share:center', 'share:end', 'share:end']
    .map((value) => { const [row, align] = value.split(':'); return { row, align }; });
  assert.deepEqual(groupRows(items).map(({ items: group }) => group.length), [2, 1, 1, 2]);
  assert.equal(groupRows(items)[0].items[0], items[0]);
});

test('generated definitions and shared models retain the V1 contracts', async () => {
  const json = async (path) => JSON.parse(await readFile(new URL(path, import.meta.url), 'utf8'));
  const [definitions, models, filters, shared, legacy] = await Promise.all([
    json('../../component-definition.json'), json('../../component-models.json'),
    json('../../component-filters.json'), json('../../layout-v2/_block-layout-v2.json'),
    json('../../layout-v1/_section-v1.json'),
  ]);
  ['layouts-v1', 'layouts-v2'].forEach((id) => {
    assert.equal(definitions.groups.filter((group) => group.id === id).length, 1);
  });
  const components = definitions.groups.flatMap((group) => group.components);
  ['section', 'columns', 'column-break', 'section-v2'].forEach((id) => {
    assert.equal(components.filter((component) => component.id === id).length, 1);
  });
  assert.deepEqual(filters.find(({ id }) => id === 'section'), legacy.filters[0]);
  assert.deepEqual(models.find(({ id }) => id === 'section'), legacy.models[0]);
  assert.ok(filters.find(({ id }) => id === 'main').components.includes('section-v2'));
  ['global-title', 'global-text', 'global-image', 'teaser'].forEach((id) => {
    assert.deepEqual(
      models.find((model) => model.id === id).fields.slice(-shared.fields.length),
      shared.fields,
    );
  });
});
