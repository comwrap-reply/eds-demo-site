import assert from 'node:assert/strict';
import { test } from 'node:test';
// Test the standalone extension without installing it as a public-site dependency.
// eslint-disable-next-line import/no-relative-packages
import { createController, childrenOf } from '../../layout-v3/editor-extension/src/controller.js';

function fixture() {
  const section = { id: 's', resource: 'urn:aem:/main/s', model: 'section-custom-v3' };
  const other = { id: 'other', resource: 'urn:aem:/main/other', model: 'section-custom-v3' };
  const child = { id: 'a', resource: `${section.resource}/a`, model: 'global-text' };
  const state = { location: 'https://author.example/page', editables: [section, other, child] };
  const values = new Map([[section.resource, { layout: 'columns-v3', 'column-count': '2' }], [other.resource, { layout: 'columns-v3', 'column-count': '4' }], [child.resource, { classes_layoutv3column: 'layout-v3-column-4' }]]);
  const writes = [];
  const host = {
    editorState: { get: async () => state },
    editorActions: {
      details: async (editable) => ({ data: values.get(editable.resource) }),
      add: async (parent, componentId) => {
        const editable = { id: 'new', model: componentId, resource: `${parent.resource}/new` };
        state.editables.push(editable);
        values.set(editable.resource, {});
        writes.push(['add', parent.resource, componentId]);
      },
      update: async ({ target, patch }) => {
        writes.push(['update', target.editable.resource, patch]);
        values.get(target.editable.resource)[patch[0].path.slice(1)] = patch[0].value;
      },
      selectEditables: async (editables) => writes.push(['select', editables[0].resource]),
    },
  };
  return {
    host,
    state,
    section,
    child,
    values,
    writes,
    controller: createController(host, { wait: async () => {}, attempts: 2 }),
  };
}

test('panel groups real immediate child resources; saved overflow assignments remain intact', async () => {
  const f = fixture();
  const { groups } = await f.controller.read();
  assert.equal(groups.length, 2);
  assert.equal(groups[0].items[0].column, 4);
  assert.equal(groups[0].count, 2);
  assert.deepEqual(f.writes, []);
  const nested = { ...f.child, resource: `${f.child.resource}/nested` };
  assert.deepEqual(childrenOf([f.child, { ...f.child, prop: 'text' }, nested, f.child], f.section), [f.child]);
});

test('Add creates once, updates only the identified new block, and selects it', async () => {
  const f = fixture();
  await f.controller.add(f.section.resource, 2, 'teaser');
  assert.deepEqual(f.writes, [
    ['add', f.section.resource, 'teaser'],
    ['update', `${f.section.resource}/new`, [{ op: 'replace', path: '/classes_layoutv3column', value: 'layout-v3-column-2' }]],
    ['select', `${f.section.resource}/new`],
  ]);
  assert.equal(f.values.get(f.child.resource).classes_layoutv3column, 'layout-v3-column-4');
});

test('reassignment changes one property, without moving/deleting the authored block', async () => {
  const f = fixture();
  await f.controller.reassign(f.section.resource, f.child.resource, 2);
  assert.equal(f.writes.length, 1);
  assert.equal(f.writes[0][0], 'update');
  assert.equal(f.state.editables[2], f.child);
});

test('invalid or stale targets and unsupported components cannot write', async () => {
  const f = fixture();
  await assert.rejects(f.controller.add(f.section.resource, 3, 'teaser'), /changed/);
  await assert.rejects(f.controller.add(f.section.resource, 1, 'freeform'), /Unsupported/);
  await assert.rejects(f.controller.reassign(f.section.resource, 'not-a-child', 1), /removed/);
  f.values.get(f.section.resource).layout = 'default';
  await assert.rejects(f.controller.add(f.section.resource, 1, 'teaser'), /changed/);
  assert.deepEqual(f.writes, []);
});

test('uncertain creation never automatically retries Add', async () => {
  const f = fixture();
  let adds = 0;
  f.host.editorActions.add = async () => { adds += 1; throw new Error('connection lost'); };
  await assert.rejects(f.controller.add(f.section.resource, 1, 'teaser'), /before retrying/);
  assert.equal(adds, 1);
  assert.deepEqual(f.writes, []);
});

test('ambiguous or absent new resources are not assigned', async () => {
  const f = fixture();
  f.host.editorActions.add = async () => {};
  await assert.rejects(f.controller.add(f.section.resource, 1, 'teaser'), /could not be identified/);
  f.host.editorActions.add = async () => {
    ['new1', 'new2'].forEach((id) => {
      const resource = `${f.section.resource}/${id}`;
      f.state.editables.push({ id, resource, model: 'teaser' });
      f.values.set(resource, {});
    });
  };
  await assert.rejects(f.controller.add(f.section.resource, 1, 'teaser'), /More than one/);
  assert.deepEqual(f.writes, []);
});

test('partial failure explains that content exists and preserves it', async () => {
  const f = fixture();
  f.host.editorActions.update = async () => { throw new Error('denied'); };
  await assert.rejects(f.controller.add(f.section.resource, 1, 'teaser'), /block was added/);
  assert.equal(f.writes.filter(([op]) => op === 'add').length, 1);
  assert.ok(f.state.editables.some((e) => e.id === 'new'));
});

test('a changed section after Add reports partial success without assigning or recreating', async () => {
  const f = fixture();
  const { add } = f.host.editorActions;
  f.host.editorActions.add = async (...args) => {
    await add(...args);
    f.values.get(f.section.resource).layout = 'default';
  };
  await assert.rejects(f.controller.add(f.section.resource, 1, 'teaser'), /do not add it again/);
  assert.equal(f.writes.length, 1);
  assert.equal(f.writes[0][0], 'add');
});

test('selection failure reports successful creation and assignment', async () => {
  const f = fixture();
  f.host.editorActions.selectEditables = async () => { throw new Error('selection failed'); };
  await assert.rejects(f.controller.add(f.section.resource, 2, 'teaser'), /added and assigned/);
  assert.equal(f.writes.length, 2);
  assert.equal(f.values.get(`${f.section.resource}/new`).classes_layoutv3column, 'layout-v3-column-2');
});

test('duplicate submissions are rejected while an operation is pending', async () => {
  const f = fixture();
  let finish;
  const originalAdd = f.host.editorActions.add;
  f.host.editorActions.add = (...args) => new Promise((resolve) => {
    finish = async () => { await originalAdd(...args); resolve(); };
  });
  const pending = f.controller.add(f.section.resource, 1, 'teaser');
  await assert.rejects(f.controller.add(f.section.resource, 1, 'teaser'), /already running/);
  // eslint-disable-next-line no-await-in-loop
  while (!finish) await new Promise((resolve) => { setImmediate(resolve); });
  await finish();
  await pending;
  assert.equal(f.writes.filter(([op]) => op === 'add').length, 1);
});
