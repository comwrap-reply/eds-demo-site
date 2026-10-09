/* Layouts: presentation only; authored nodes and properties are never cloned or saved. */
import {
  sectionSettings, blockPlacement, assignColumns, groupRows,
} from './settings.js';

const sections = new WeakMap();
const SUPPORTED = '.global-title, .global-text, .global-image, .teaser';

function move(parent, child) {
  // State-preserving moves keep focus, selection, and embedded content alive where supported.
  if (parent.moveBefore && parent.isConnected && child.isConnected) parent.moveBefore(child, null);
  else parent.append(child);
}

function clearItem(item) {
  item.classList.remove('layout-item');
  item.style.removeProperty('--layout-fraction');
  delete item.dataset.layoutOverflow;
}

function decorateSection(section) {
  const settings = sectionSettings(section.dataset);
  const previous = sections.get(section);
  if (!settings.enabled && !previous) return;
  section.classList.add('global-section');

  // The saved list is authored order, not the column-grouped DOM order. Structural editor
  // updates provide fresh section markup; block-only patches retain their original wrapper.
  const existing = (previous?.items || []).filter((item) => section.contains(item));
  const added = [...section.children].filter((item) => item !== previous?.grid
    && !item.hasAttribute('data-layout-editor') && !existing.includes(item));
  const items = [...existing, ...added];

  if (!settings.enabled) {
    items.forEach((item) => { clearItem(item); move(section, item); });
    previous.grid.remove();
    section.classList.remove('layout-columns', 'layout-is-editing');
    section.querySelectorAll('[data-layout-editor]').forEach((element) => element.remove());
    sections.delete(section);
    return;
  }

  const placements = items.map((element) => {
    const block = [...element.children].find((child) => child.matches(SUPPORTED));
    return { element, ...blockPlacement(block?.classList) };
  });
  const signature = JSON.stringify([
    settings, placements.map(({ element, ...placement }) => placement),
  ]);
  if (previous?.signature === signature && items.length === previous.items.length
      && items.every((item, i) => item === previous.items[i])) return;

  const grid = document.createElement('div');
  grid.className = 'layout-grid';
  grid.style.setProperty('--layout-count', settings.count);
  grid.style.setProperty('--layout-tablet-count', Math.min(2, settings.count));
  grid.style.setProperty('--layout-gap', `${settings.gap}px`);
  section.classList.add('layout-columns');
  section.append(grid);

  assignColumns(placements, settings.count).forEach((columnItems, index) => {
    const column = document.createElement('div');
    column.className = 'layout-column';
    column.dataset.layoutColumn = index + 1;
    grid.append(column);
    groupRows(columnItems).forEach(({ row, align, items: rowItems }) => {
      const line = document.createElement('div');
      line.className = `layout-row layout-row-${row}`;
      line.dataset.layoutAlign = align;
      column.append(line);
      rowItems.forEach(({ element, width, column: assigned }) => {
        element.classList.add('layout-item');
        element.style.setProperty('--layout-fraction', width);
        if (assigned > settings.count) element.dataset.layoutOverflow = assigned;
        else delete element.dataset.layoutOverflow;
        move(line, element);
      });
    });
  });
  previous?.grid.remove();
  sections.set(section, { items, grid, signature });
}

/** Decorate either one section or the sections inside a main element. */
export default function decorateGlobalSection(root) {
  if (root.matches('.section')) decorateSection(root);
  else root.querySelectorAll('.section').forEach(decorateSection);
}
