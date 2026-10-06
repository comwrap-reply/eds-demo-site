/* Local-only SDK mock for exercising the actual extension UI. No AEM connection. */
// eslint-disable-next-line import/no-relative-packages
import mountPanel from '../../layout-v3/editor-extension/src/panel.js';

export default async function setup() {
  const section = {
    id: 'section', resource: 'urn:test:/main/section', model: 'section-custom-v3', label: 'Example section (simulation)',
  };
  const first = {
    id: 'title', resource: `${section.resource}/title`, model: 'global-title', label: 'Quarter-width heading',
  };
  const state = { location: 'https://example.test/fixture', editables: [section, first] };
  const data = new Map([
    [section.resource, { layout: 'columns-v3', 'column-count': '2' }],
    [first.resource, { classes_layoutv3column: 'layout-v3-column-1' }],
  ]);
  const writes = [];
  let count = 0;
  const host = {
    editorState: { get: async () => state },
    editorActions: {
      details: async (editable) => ({ data: data.get(editable.resource) }),
      add: async (parent, model) => {
        count += 1;
        const editable = {
          id: `new-${count}`, resource: `${parent.resource}/new-${count}`, model, label: `Added ${model}`,
        };
        state.editables.push(editable);
        data.set(editable.resource, {});
        writes.push({ action: 'add', resource: editable.resource });
      },
      update: async ({ target, patch }) => {
        data.get(target.editable.resource)[patch[0].path.slice(1)] = patch[0].value;
        writes.push({ action: 'update', resource: target.editable.resource, patch });
      },
      selectEditables: async ([editable]) => { writes.push({ action: 'select', resource: editable.resource }); },
    },
  };
  await mountPanel(document.querySelector('main'), host);
  document.querySelector('h1').textContent = 'Layouts - V3 — LOCAL SIMULATION';
  document.querySelector('main > p').textContent = 'Local simulation only. No changes are saved to AEM.';
  return { state, writes, data };
}
