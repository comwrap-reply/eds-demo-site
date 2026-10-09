/* Local browser regression checks. Not shipped: test/ is excluded by .hlxignore. */
import { decorateSections, decorateBlocks, loadSection } from '../../scripts/aem.js';
import decorateGlobalSection from '../../layout/global-section.js';
import { WIDTH_VALUES, GAP_VALUES } from '../../layout/layout.js';

const resource = (id) => `urn:layout-test:${id}`;
const blockHTML = (id, classes = '', text = id) => `<div class="global-text ${classes}" data-aue-resource="${resource(id)}" data-aue-type="component" data-aue-model="global-text"><div><div><p><a href="#layout-example">${text}</a></p></div></div></div>`;
const sectionHTML = (id, count, blocks = '', gap = 'medium', layout = 'global-section-columns') => `<div id="${id}" data-aue-resource="${resource(id)}" data-aue-type="container" data-aue-model="global-section" data-aue-filter="global-section">${blocks}<div class="section-metadata"><div><div>Layout</div><div>${layout}</div></div><div><div>Column count</div><div>${count}</div></div><div><div>Column gap</div><div>${gap}</div></div></div></div>`;

async function waitFor(check, message) {
  const deadline = Date.now() + 5000;
  while (!check()) {
    if (Date.now() > deadline) throw new Error(`Timed out: ${message}`);
    // eslint-disable-next-line no-await-in-loop
    await new Promise((resolve) => { setTimeout(resolve, 10); });
  }
}

export default async function runGlobalSectionBrowserChecks() {
  let assertions = 0;
  const assert = (condition, message) => {
    assertions += 1;
    if (!condition) throw new Error(message);
  };
  const near = (actual, expected, message) => assert(
    Math.abs(actual - expected) < 1.1,
    `${message}: expected ${expected}, got ${actual}`,
  );
  const desktop = window.innerWidth >= 900;
  const created = new Set();
  const main = document.querySelector('main');
  const mainResource = main.getAttribute('data-aue-resource');
  const parse = (html) => new DOMParser().parseFromString(html, 'text/html').body.firstElementChild;
  const mount = async (id, count, blocks, gap, layout) => {
    const staging = document.createElement('main');
    const section = parse(sectionHTML(id, count, blocks, gap, layout));
    staging.append(section);
    decorateSections(staging);
    decorateBlocks(staging);
    decorateGlobalSection(staging);
    main.append(section);
    created.add(id);
    await loadSection(section);
    return section;
  };
  const columns = (section) => [...section.querySelectorAll(':scope > .layout-grid > .layout-column')];
  const items = (section) => [...section.querySelectorAll('.layout-item')];
  const box = (element) => element.getBoundingClientRect();
  const dispatch = (type, updates, target, request = { target: { resource: target } }) => {
    main.dispatchEvent(new CustomEvent(`aue:content-${type}`, {
      bubbles: true, detail: { request, response: { updates } },
    }));
  };
  const updateSection = async (type, id, count, blocks, layout) => {
    const old = document.getElementById(id);
    dispatch(type, [{ resource: resource(id), content: sectionHTML(id, count, blocks, 'medium', layout) }], resource(id));
    await waitFor(() => document.getElementById(id) !== old
      && document.getElementById(id)?.dataset.sectionStatus === 'loaded', `${type} section`);
    return document.getElementById(id);
  };

  try {
    assert(!document.querySelector('[data-layout-editor]'), 'public page has no editor UI');
    const defaultSection = document.getElementById('layout-default');
    const defaultMarkup = defaultSection.outerHTML;
    decorateGlobalSection(defaultSection);
    assert(defaultSection.outerHTML === defaultMarkup, 'default section unchanged');

    const obsolete = await mount('check-obsolete', 2, blockHTML('obsolete', 'layout-v3-column-2'), 'medium', 'columns-v3');
    assert(!obsolete.querySelector('.layout-grid'), 'obsolete custom layout is not activated');
    assert(obsolete.textContent.includes('obsolete'), 'obsolete content remains visible without layout');
    const oldPlacement = await mount('check-old-placement', 2, blockHTML('old-placement', 'layout-v3-column-2 layout-v3-width-25'));
    assert(items(oldPlacement)[0].closest('.layout-column') === columns(oldPlacement)[0], 'obsolete placement tokens use new defaults');

    const example = document.getElementById('layout-example');
    const [firstColumn] = columns(example);
    const heading = example.querySelector('.global-title').parentElement;
    const teasers = [...example.querySelectorAll('.teaser')].map((block) => block.parentElement);
    near(box(heading).width, box(firstColumn).width * (desktop ? 0.25 : 1), 'example heading width');
    near(box(heading).right, box(firstColumn).right, 'example heading end alignment');
    if (desktop) {
      near(box(teasers[0]).y, box(teasers[1]).y, 'two half Teasers share one row');
      near(box(teasers[0]).width + box(teasers[1]).width + 24, box(firstColumn).width, 'half Teaser gaps fit');
    }
    assert(example.querySelector('.global-text').closest('.layout-column').dataset.layoutColumn === '2', 'Global Text in column 2');
    assert(getComputedStyle(example.querySelector('.panel-gray')).backgroundColor !== 'rgba(0, 0, 0, 0)', 'panel appearance retained');

    // All configured columns exist, including empty ones, at every responsive breakpoint.
    // eslint-disable-next-line no-restricted-syntax
    for (const count of [1, 2, 3, 4]) {
      // eslint-disable-next-line no-await-in-loop
      const section = await mount(`check-count-${count}`, count, blockHTML(`count-${count}`));
      const cols = columns(section);
      assert(cols.length === count, `${count} presentation columns`);
      const visibleTracks = window.innerWidth < 600 ? 1 : Math.min(desktop ? 4 : 2, count);
      const tracks = getComputedStyle(section.firstElementChild).gridTemplateColumns.split(' ').length;
      assert(tracks === visibleTracks, `${count} responsive column tracks`);
      assert(cols.slice(1).every((column) => !column.textContent), 'public empty columns contain no instructions');
    }

    // Authored order is stable within columns and is recoverable when the layout is disabled.
    const ordered = await mount('check-order', 4, [
      blockHTML('order-a', 'layout-column-3'), blockHTML('order-b'),
      blockHTML('order-c', 'layout-column-3'), blockHTML('order-d', 'layout-column-4'),
    ].join(''));
    const originalItems = items(ordered);
    assert(originalItems.map((item) => item.textContent).join(',') === 'order-b,order-a,order-c,order-d', 'column-major reading order');
    const grid = ordered.firstElementChild;
    originalItems[1].querySelector('a').focus({ preventScroll: true });
    const focused = document.activeElement;
    decorateGlobalSection(ordered);
    decorateGlobalSection(ordered);
    assert(ordered.firstElementChild === grid && document.activeElement === focused, 'unchanged decoration preserves nodes and focus');
    ordered.dataset.columnCount = '2';
    decorateGlobalSection(ordered);
    if (ordered.moveBefore) assert(document.activeElement === focused, 'count reflow preserves focus');
    assert(items(ordered).length === 4 && ordered.querySelectorAll('[data-layout-overflow]').length === 3, 'reduction keeps all blocks visible');
    assert(columns(ordered)[1].textContent === 'order-aorder-corder-d', 'reduction preserves saved order');
    ordered.dataset.columnCount = '4';
    decorateGlobalSection(ordered);
    assert(columns(ordered)[3].textContent === 'order-d', 'restoring count restores saved assignment');
    ordered.dataset.layout = 'default';
    decorateGlobalSection(ordered);
    assert(!ordered.querySelector('.layout-grid'), 'disable unwraps presentation');
    assert([...ordered.children].map((item) => item.textContent).join(',') === 'order-a,order-b,order-c,order-d', 'disable restores authored order');
    assert(originalItems.every((item) => ordered.contains(item)), 'same original editable nodes retained');

    // eslint-disable-next-line no-restricted-syntax
    for (const [gapName, gap] of Object.entries(GAP_VALUES)) {
      // eslint-disable-next-line no-restricted-syntax
      for (const [widthName, fraction] of Object.entries(WIDTH_VALUES)) {
        // eslint-disable-next-line no-restricted-syntax
        for (const align of ['start', 'center', 'end']) {
          // eslint-disable-next-line no-await-in-loop
          const fresh = await mount(
            'check-widths',
            1,
            blockHTML('width-own', `layout-width-${widthName} layout-align-${align}`),
            gapName,
          );
          const col = box(columns(fresh)[0]);
          const item = box(items(fresh)[0]);
          near(item.width, col.width * (desktop ? fraction : 1), `${gapName}/${widthName}/${align} own width`);
          const offset = !desktop || align === 'start' ? 0 : (col.width - item.width) / (align === 'center' ? 2 : 1);
          near(item.left, col.left + offset, `${align} own placement`);
          assert(fresh.scrollWidth <= fresh.clientWidth + 1, 'no own-row overflow');
          fresh.remove();
        }
      }
      // Two halves, four quarters, three thirds, and mixed complementary widths, plus wrapping.
      // eslint-disable-next-line no-restricted-syntax
      for (const tokens of [['50', '50'], ['25', '25', '25', '25'], ['third', 'third', 'third'], ['two-thirds', 'third'], ['75', '25']]) {
        const id = `check-shared-${gapName}-${tokens.join('-')}`;
        // eslint-disable-next-line no-await-in-loop
        const shared = await mount(id, 1, [...tokens, '100'].map((token, i) => blockHTML(`${id}-${i}`, `layout-width-${token} layout-row-share`)).join(''), gapName);
        const blocks = items(shared).map(box);
        if (desktop) {
          blocks.slice(0, -1).forEach((rect) => near(rect.y, blocks[0].y, 'complementary widths share row'));
          near(blocks.slice(0, -1).reduce((sum, rect) => sum + rect.width, 0) + gap * (tokens.length - 1), box(columns(shared)[0]).width, 'shared gap math');
          assert(blocks.at(-1).y >= blocks[0].bottom, 'full shared block wraps to next line');
        } else blocks.forEach((rect) => near(rect.width, box(columns(shared)[0]).width, 'shared blocks full width below desktop'));
        assert(shared.scrollWidth <= shared.clientWidth + 1, 'no shared-row overflow');
      }
    }

    const aligned = await mount('check-aligned', 1, ['center', 'center', 'end', 'end'].map((align, i) => blockHTML(`aligned-${i}`, `layout-width-25 layout-row-share layout-align-${align}`)).join(''));
    assert(aligned.querySelectorAll('.layout-row').length === 2, 'alignment changes interrupt shared groups');
    if (desktop) {
      const [a, b, c, d] = items(aligned).map(box);
      const col = box(columns(aligned)[0]);
      near((a.left + b.right) / 2, (col.left + col.right) / 2, 'center shared group');
      near(d.right, col.right, 'end shared group');
      near(c.y, d.y, 'end pair shares row');
    }

    // Actual repository editor handler, with simulated successful server snapshots only.
    await import('../../scripts/editor-support.js');
    assert(!document.querySelector('[data-layout-editor]'), 'loading editor support alone does not activate editing');
    document.dispatchEvent(new CustomEvent('aue:ui-edit'));
    const { initGlobalSectionEditor, refreshGlobalSectionEditor } = await import('../../layout/editor.js');
    initGlobalSectionEditor();
    const beforeUI = document.querySelectorAll('[data-layout-editor]').length;
    refreshGlobalSectionEditor();
    assert(document.querySelectorAll('[data-layout-editor]').length === beforeUI, 'editor refresh is idempotent');
    assert(document.querySelectorAll('#layout-empty .layout-empty').length === 2, 'only empty columns show instructions');
    assert(document.querySelector('#layout-reduction .layout-warning'), 'editor count-reduction warning');

    let a = blockHTML('live-a', 'layout-column-2');
    const b = blockHTML('live-b', 'layout-column-4');
    const c = blockHTML('live-c', 'layout-column-4');
    await mount('check-live', 2, a);
    refreshGlobalSectionEditor();
    // A service may send a main snapshot for a section-only property change.
    main.setAttribute('data-aue-resource', resource('main'));
    const oldLive = document.getElementById('check-live');
    dispatch('patch', [{ resource: resource('main'), content: `<main data-aue-resource="${resource('main')}">${sectionHTML('check-live', 4, a)}</main>` }], resource('check-live'));
    await waitFor(() => document.getElementById('check-live') !== oldLive
      && document.getElementById('check-live')?.dataset.sectionStatus === 'loaded', 'narrow main snapshot');
    let live = document.getElementById('check-live');
    assert(document.querySelector('main') === main && document.getElementById('layout-default') === defaultSection, 'section patch does not rebuild main or unrelated sections');
    assert(live.querySelectorAll('.layout-empty').length === 3, 'count increase creates new empty states');
    live = await updateSection('add', 'check-live', 4, a + b);
    assert(live.querySelectorAll('.layout-empty').length === 2, 'add removes its empty state');
    a = blockHTML('live-a', 'layout-column-4', 'edited-a');
    dispatch('update', [{ resource: resource('live-a'), content: a }], resource('live-a'));
    await waitFor(() => document.querySelector(`[data-aue-resource="${resource('live-a')}"]`)?.closest('.layout-column')?.dataset.layoutColumn === '4', 'block reassignment');
    assert(live.querySelectorAll('.layout-empty').length === 3, 'moving last block restores previous empty state');
    live = await updateSection('copy', 'check-live', 4, a + b + c);
    assert(items(live).length === 3, 'copy has one new editable');
    live = await updateSection('move', 'check-live', 4, c + b + a);
    assert(columns(live)[3].textContent === 'live-clive-bedited-a', 'native reorder follows saved snapshot');

    const destination = await mount('check-destination', 2, '');
    dispatch('move', [
      { resource: resource('check-live'), content: sectionHTML('check-live', 4, c + b) },
      { resource: resource('check-destination'), content: sectionHTML('check-destination', 2, a) },
    ], null, { to: { container: { resource: resource('check-destination') } } });
    await waitFor(() => document.getElementById('check-destination') !== destination
      && document.getElementById('check-destination')?.dataset.sectionStatus === 'loaded', 'cross-section move');
    live = document.getElementById('check-live');
    assert(items(live).length === 2 && items(document.getElementById('check-destination')).length === 1, 'both move snapshots applied');
    assert(document.querySelector(`[data-aue-resource="${resource('live-a')}"]`).classList.contains('layout-column-4'), 'clamped destination does not rewrite assignment');
    live = await updateSection('remove', 'check-live', 4, c);
    dispatch('remove', [], resource('live-c'));
    await waitFor(() => !document.querySelector(`[data-aue-resource="${resource('live-c')}"]`), 'contentless remove');
    assert(live.querySelectorAll('.layout-empty').length === 4, 'removing last block restores empty states');
    live = await updateSection('patch', 'check-live', 2, b, 'default');
    assert(!live.classList.contains('layout-columns') && !live.querySelector('[data-layout-editor]'), 'editor can turn Columns off');
    [3, 4].forEach((count) => dispatch('patch', [{ resource: resource('check-live'), content: sectionHTML('check-live', count, b) }], resource('check-live')));
    await waitFor(() => columns(document.getElementById('check-live')).length === 4
      && document.getElementById('check-live').dataset.sectionStatus === 'loaded', 'queued section changes');
    assert(document.querySelectorAll('#check-live > .layout-grid').length === 1, 'queued changes create one layout');
    const resources = [...main.querySelectorAll('[data-aue-type="component"]')].map((el) => el.dataset.aueResource);
    assert(new Set(resources).size === resources.length, 'no duplicate editable identities');
    document.dispatchEvent(new CustomEvent('aue:ui-preview'));
    assert(!document.querySelector('[data-layout-editor]'), 'preview removes placeholders and warnings');
    assert(!document.querySelector('.layout-is-editing'), 'preview removes editor-only sizing class');
    return { viewport: window.innerWidth, assertions, result: 'passed' };
  } finally {
    if (mainResource === null) main.removeAttribute('data-aue-resource');
    else main.setAttribute('data-aue-resource', mainResource);
    created.forEach((id) => document.getElementById(id)?.remove());
    document.dispatchEvent(new CustomEvent('aue:ui-preview'));
  }
}
