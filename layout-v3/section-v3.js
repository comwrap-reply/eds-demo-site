/* Layouts - V3: presentation only; authored nodes and properties are never cloned or saved. */
import {
  sectionSettings, blockPlacement, assignColumns, groupRows,
} from './layout-v3.js';

const sections = new WeakMap();
const SUPPORTED = '.global-title, .global-text, .global-image, .teaser';

function move(parent, child) {
  // State-preserving moves keep focus, selection, and embedded content alive where supported.
  if (parent.moveBefore && parent.isConnected && child.isConnected) parent.moveBefore(child, null);
  else parent.append(child);
}

function clearItem(item) {
  item.classList.remove('layout-v3-item');
  item.style.removeProperty('--layout-v3-fraction');
  delete item.dataset.layoutV3Overflow;
}

function decorateSection(section) {
  const settings = sectionSettings(section.dataset);
  const previous = sections.get(section);
  if (!settings.enabled && !previous) return;

  // The saved list is authored order, not the column-grouped DOM order. Structural editor
  // updates provide fresh section markup; block-only patches retain their original wrapper.
  const existing = (previous?.items || []).filter((item) => section.contains(item));
  const added = [...section.children].filter((item) => item !== previous?.grid
    && !item.hasAttribute('data-layout-v3-editor') && !existing.includes(item));
  const items = [...existing, ...added];

  if (!settings.enabled) {
    items.forEach((item) => { clearItem(item); move(section, item); });
    previous.grid.remove();
    section.classList.remove('layout-v3', 'layout-v3-is-editing');
    section.querySelectorAll('[data-layout-v3-editor]').forEach((element) => element.remove());
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
  grid.className = 'layout-v3-grid';
  grid.style.setProperty('--layout-v3-count', settings.count);
  grid.style.setProperty('--layout-v3-tablet-count', Math.min(2, settings.count));
  grid.style.setProperty('--layout-v3-gap', `${settings.gap}px`);
  section.classList.add('layout-v3');
  section.append(grid);

  assignColumns(placements, settings.count).forEach((columnItems, index) => {
    const column = document.createElement('div');
    column.className = 'layout-v3-column';
    column.dataset.layoutV3Column = index + 1;
    grid.append(column);
    groupRows(columnItems).forEach(({ row, align, items: rowItems }) => {
      const line = document.createElement('div');
      line.className = `layout-v3-row layout-v3-row-${row}`;
      line.dataset.layoutV3Align = align;
      column.append(line);
      rowItems.forEach(({ element, width, column: assigned }) => {
        element.classList.add('layout-v3-item');
        element.style.setProperty('--layout-v3-fraction', width);
        if (assigned > settings.count) element.dataset.layoutV3Overflow = assigned;
        else delete element.dataset.layoutV3Overflow;
        move(line, element);
      });
    });
  });
  previous?.grid.remove();
  sections.set(section, { items, grid, signature });
}

/** Decorate either one section or the sections inside a main element. */
export default function decorateSectionV3(root) {
  if (root.matches('.section')) decorateSection(root);
  else root.querySelectorAll('.section').forEach(decorateSection);
}
