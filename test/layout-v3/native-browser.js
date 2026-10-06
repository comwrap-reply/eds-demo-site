/* Local-only native cell rendering and simulated UE snapshot checks. */
import { decorateMain } from '../../scripts/scripts.js';
import { loadSection } from '../../scripts/aem.js';
import decorateNativeV3 from '../../layout-v3/native-v3.js';
import { GAP_VALUES } from '../../layout-v3/layout-v3.js';

export default async function run() {
  let assertions = 0;
  const assert = (condition, message) => {
    assertions += 1;
    if (!condition) throw new Error(message);
  };
  const waitFor = async (check) => {
    const deadline = Date.now() + 5000;
    while (!check()) {
      if (Date.now() > deadline) throw new Error('Editor patch timed out');
      // eslint-disable-next-line no-await-in-loop
      await new Promise((resolve) => { setTimeout(resolve, 20); });
    }
  };
  const main = document.querySelector('main');
  const created = [];
  const mount = async (count, gap) => {
    const staging = document.createElement('main');
    const section = document.createElement('div');
    section.innerHTML = `<div class="columns layout-v3-native layout-v3-gap-${gap}" data-aue-type="component" data-aue-resource="urn:v3:/native-${gap}-${count}"><div>${Array.from({ length: count }, (_, i) => `<div data-aue-resource="urn:v3:/native-${gap}-${count}/c${i}" data-aue-type="container" data-aue-filter="column">${i === 0 ? '<h2>Native heading</h2><p><a href="#native-v3-empty">A native link</a></p>' : ''}</div>`).join('')}</div></div>`;
    staging.append(section);
    decorateMain(staging);
    main.append(section);
    created.push(section);
    await loadSection(section);
    return section.querySelector('.columns');
  };
  try {
    assert(!main.querySelector('[data-layout-v3-editor]'), 'public page has no editor helpers');
    // eslint-disable-next-line no-restricted-syntax
    for (const count of [1, 2, 3, 4]) {
      // eslint-disable-next-line no-restricted-syntax
      for (const [gap, size] of Object.entries(GAP_VALUES)) {
        // eslint-disable-next-line no-await-in-loop
        const block = await mount(count, gap);
        const cells = [...block.querySelectorAll('.layout-v3-native-cell')];
        const resources = cells.map((c) => c.dataset.aueResource);
        const row = block.firstElementChild;
        const columns = window.innerWidth < 900 ? 2 : 4;
        const expected = window.innerWidth < 600 ? 1 : Math.min(columns, count);
        assert(cells.length === count, 'all actual cells retained');
        assert(getComputedStyle(row).gridTemplateColumns.split(' ').length === expected, 'responsive native tracks');
        assert(parseFloat(getComputedStyle(row).gap) === size, 'native gap');
        assert(block.scrollWidth <= block.clientWidth + 1, 'native layout has no overflow');
        assert(cells.every((c) => c.dataset.aueFilter === 'column-native-v3'), 'default content only filter');
        decorateNativeV3(block);
        assert(cells.every((c, i) => c === block.firstElementChild.children[i]), 'repeated decoration retains cells');
        assert(cells.every((c, i) => c.dataset.aueResource === resources[i]), 'no resource rewriting');
        assert(block.dataset.aueModel === 'columns-native-v3', 'native V3 model');
      }
    }
    const legacy = document.createElement('div');
    legacy.className = 'columns';
    legacy.innerHTML = '<div><div>Legacy</div></div>';
    const oldHTML = legacy.outerHTML;
    decorateNativeV3(legacy);
    assert(legacy.outerHTML === oldHTML, 'non-V3 columns untouched');
    assert(!document.querySelector('#native-v3-empty [data-aue-resource]'), 'public fixture does not gain fabricated editables');
    const multi = document.querySelector('#native-v3-rows .columns');
    assert(multi.querySelectorAll('.layout-v3-native-row').length === 2, 'two actual rows');
    assert(multi.querySelectorAll('.layout-v3-native-cell').length === 6, 'six actual cells');
    await import('../../scripts/editor-support.js');
    const { refreshLayoutV3Editor } = await import('../../layout-v3/editor-v3.js');
    document.dispatchEvent(new CustomEvent('aue:ui-edit'));
    assert(document.querySelectorAll('#native-v3-empty .layout-v3-empty').length === 3, 'three empty guides in edit mode');
    const total = document.querySelectorAll('[data-layout-v3-editor]').length;
    refreshLayoutV3Editor();
    assert(document.querySelectorAll('[data-layout-v3-editor]').length === total, 'no duplicate placeholders');
    const block = created[1].querySelector('.columns');
    const cell = block.querySelector('.layout-v3-native-cell');
    const resource = cell.dataset.aueResource;
    const child = `${resource}/text`;
    const dispatch = (type, target, content) => main.dispatchEvent(new CustomEvent(`aue:content-${type}`, {
      bubbles: true,
      detail: {
        request: { target: { resource: target } },
        response: { updates: content ? [{ resource: target, content }] : [] },
      },
    }));
    dispatch('add', resource, `<div data-aue-resource="${resource}" data-aue-type="container"><p data-aue-resource="${child}" data-aue-type="richtext">Added text</p></div>`);
    await waitFor(() => !cell.isConnected);
    const newCell = block.querySelector('.layout-v3-native-cell');
    assert(newCell.dataset.aueResource === resource, 'cell-only patch preserves real resource');
    assert(newCell.textContent === 'Added text', 'native cell Add snapshot applied');
    dispatch('update', child, `<p data-aue-resource="${child}" data-aue-type="richtext">Updated text</p>`);
    await waitFor(() => newCell.textContent === 'Updated text');
    assert(block.isConnected && newCell.isConnected, 'default-content patch keeps outer block and cell');
    dispatch('remove', child);
    await waitFor(() => !!newCell.querySelector('.layout-v3-empty'));
    assert(newCell.dataset.aueResource === resource, 'removing content does not remove native cell');
    document.dispatchEvent(new CustomEvent('aue:ui-preview'));
    assert(!document.querySelector('[data-layout-v3-editor]'), 'preview removes all guides');
    assert(!document.querySelector('.layout-v3-is-editing'), 'preview removes outlines/sizing');
    return { viewport: window.innerWidth, assertions, result: 'passed' };
  } finally {
    created.forEach((section) => section.remove());
    document.dispatchEvent(new CustomEvent('aue:ui-preview'));
  }
}
