/* Layouts - V3: all writes use supported UE actions against real editables. */
export const COMPONENTS = ['global-title', 'global-text', 'global-image', 'teaser'];
export const LABELS = ['Global Title', 'Global Text', 'Global Image', 'Teaser'];
const field = 'classes_layoutv3column';
const delay = (ms) => new Promise((resolve) => { setTimeout(resolve, ms); });

export function assignedColumn(data) {
  const match = /^layout-v3-column-([1-4])$/.exec(data?.[field]);
  return match ? Number(match[1]) : 1;
}

export function childrenOf(editables, section) {
  const prefix = `${section.resource}/`;
  const seen = new Set();
  return editables.filter((editable) => {
    const suffix = editable.resource?.startsWith(prefix) && editable.resource.slice(prefix.length);
    if (!suffix || suffix.includes('/') || editable.prop || !COMPONENTS.includes(editable.model)
        || seen.has(editable.resource)) return false;
    seen.add(editable.resource);
    return true;
  });
}

export function createController(host, { wait = delay, attempts = 20 } = {}) {
  let busy = false;
  const read = async () => {
    const state = await host.editorState.get();
    if (!Array.isArray(state.editables)) {
      throw new Error('Unsupported editor state. Use native section Add.');
    }
    const sections = state.editables.filter((e) => e.model === 'section-custom-v3' && !e.prop);
    const unique = sections.filter((e, i) => sections
      .findIndex((s) => s.resource === e.resource) === i);
    const groups = await Promise.all(unique.map(async (editable) => {
      const { data } = await host.editorActions.details(editable);
      if (data?.layout !== 'columns-v3') return null;
      const count = /^[1-4]$/.test(data['column-count']) ? Number(data['column-count']) : 2;
      const items = await Promise.all(childrenOf(state.editables, editable).map(async (child) => {
        const details = await host.editorActions.details(child);
        return { editable: child, column: assignedColumn(details.data) };
      }));
      return { editable, count, items };
    }));
    return { location: state.location, groups: groups.filter(Boolean) };
  };
  const target = async (sectionResource, column) => {
    const snapshot = await read();
    const section = snapshot.groups.find((g) => g.editable.resource === sectionResource);
    if (!section || !Number.isInteger(column) || column < 1 || column > section.count) {
      throw new Error('The section or column changed. Refresh the panel and try again.');
    }
    return { snapshot, section };
  };
  const exclusive = async (operation) => {
    if (busy) throw new Error('An operation is already running.');
    busy = true;
    try { return await operation(); } finally { busy = false; }
  };
  const assign = (editable, column) => host.editorActions.update({
    target: { editable },
    patch: [{ op: 'replace', path: `/${field}`, value: `layout-v3-column-${column}` }],
  });
  return {
    read,
    select: (editable) => host.editorActions.selectEditables([editable]),
    reassign: (sectionResource, resource, column) => exclusive(async () => {
      const { section } = await target(sectionResource, column);
      const item = section.items.find((i) => i.editable.resource === resource);
      if (!item) throw new Error('The block moved or was removed. Refresh the panel.');
      await assign(item.editable, column);
    }),
    add: (sectionResource, column, componentId) => exclusive(async () => {
      if (!COMPONENTS.includes(componentId)) throw new Error('Unsupported component.');
      const before = await target(sectionResource, column);
      const existing = new Set(before.section.items.map((i) => i.editable.resource));
      // add() returns void: never guess a resource or retry creation after an uncertain result.
      try { await host.editorActions.add(before.section.editable, componentId); } catch (error) {
        throw new Error('Add did not confirm success. Check the section before retrying to avoid duplicates.', { cause: error });
      }
      let created;
      for (let attempt = 0; attempt < attempts; attempt += 1) {
        // eslint-disable-next-line no-await-in-loop
        const after = await target(sectionResource, column).catch((error) => {
          throw new Error('Add completed but the section cannot be read safely. Refresh and inspect the added block; do not add it again.', { cause: error });
        });
        if (after.snapshot.location !== before.snapshot.location) throw new Error('Page changed after Add. Check the original section.');
        const added = after.section.items.filter((i) => !existing.has(i.editable.resource));
        if (added.length > 1) throw new Error('More than one new block appeared. Set Assigned column manually; no block was reassigned.');
        if (added.length === 1 && added[0].editable.model === componentId) {
          [created] = added;
          break;
        }
        // eslint-disable-next-line no-await-in-loop
        await wait(250);
      }
      if (!created) throw new Error('Add completed but the new block could not be identified. Refresh and set Assigned column manually; do not add it again.');
      try { await assign(created.editable, column); } catch (error) {
        throw new Error('The block was added, but its column was not saved. Select it and set Layout - V3 → Assigned column manually.', { cause: error });
      }
      try { await host.editorActions.selectEditables([created.editable]); } catch (error) {
        throw new Error('The block was added and assigned, but selection failed. Refresh the editor; do not add it again.', { cause: error });
      }
    }),
  };
}
