import assert from 'node:assert/strict';
import { test } from 'node:test';
import {
  sectionSettings, blockPlacement, assignColumns, groupRows, WIDTH_VALUES, GAP_VALUES,
} from '../runtime/settings.js';

test('original and renamed custom metadata enable layout; V1 and V2 stay excluded', () => {
  [undefined, {}, { layout: 'default' }, { layout: 'columns' }, { layout: 'columns-v2' }, { layout: 'unknown' }].forEach((data) => {
    assert.equal(sectionSettings(data).enabled, false);
  });
  assert.deepEqual(sectionSettings({ layout: 'columns-v3' }), { enabled: true, count: 2, gap: 24 });
  assert.deepEqual(sectionSettings({ layout: 'global-section-columns' }), { enabled: true, count: 2, gap: 24 });
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
    assert.equal(blockPlacement([`layout-width-${token}`]).width, width);
  });
  ['start', 'center', 'end'].forEach((align) => {
    assert.equal(blockPlacement([`layout-align-${align}`]).align, align);
  });
  assert.deepEqual(
    blockPlacement(['layout-column-0', 'layout-width-wrong', 'grid-span-3']),
    blockPlacement(),
  );
  assert.equal(blockPlacement(['layout-column-3', 'layout-column-4']).column, 1);
  assert.deepEqual(blockPlacement(['layout-v2-column-4', 'layout-v2-width-25']), blockPlacement());
  assert.deepEqual(blockPlacement(['layout-v3-column-4', 'layout-v3-width-25', 'layout-v3-align-end', 'layout-v3-row-share']), {
    column: 4, width: 0.25, align: 'end', row: 'share',
  });
});

test('original placement wins per field; renamed values are read-only fallback', () => {
  const tokens = ['layout-v3-column-2', 'layout-column-4', 'layout-width-50', 'layout-align-end', 'layout-row-share'];
  const before = [...tokens];
  assert.deepEqual(blockPlacement(tokens), {
    column: 2, width: 0.5, align: 'end', row: 'share',
  });
  assert.deepEqual(tokens, before, 'saved tokens are never changed');
  assert.equal(blockPlacement(['layout-v3-column-0', 'layout-column-4']).column, 1);
  assert.equal(blockPlacement(['layout-v3-column-2', 'layout-v3-column-3', 'layout-column-4']).column, 1);
  assert.equal(blockPlacement(['layout-v3-width-bad', 'layout-width-50']).width, 1);
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
