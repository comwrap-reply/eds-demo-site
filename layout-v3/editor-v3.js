/* Layouts - V3: transient Universal Editor UI, never part of authored content. */
import { loadCSS } from '../scripts/aem.js';
import decorateNativeV3 from './native-v3.js';

let editing = false;
let initialized = false;

export function refreshLayoutV3Editor(root = document) {
  const sections = root.matches?.('.section') ? [root] : [...root.querySelectorAll('.section')];
  sections.forEach((section) => {
    section.querySelectorAll('[data-layout-v3-editor]').forEach((element) => element.remove());
    section.querySelectorAll('.columns.layout-v3-native').forEach((block) => {
      decorateNativeV3(block);
      block.classList.toggle('layout-v3-is-editing', editing);
      if (!editing) return;
      block.querySelectorAll('.layout-v3-native-cell').forEach((cell) => {
        if (cell.textContent.trim() || cell.querySelector('picture, img, video, a')) return;
        const help = document.createElement('p');
        help.dataset.layoutV3Editor = '';
        help.className = 'layout-v3-empty';
        help.textContent = 'Select this column, then use the editor’s + Add action.';
        cell.append(help);
      });
    });
    const active = editing && section.classList.contains('layout-v3');
    section.classList.toggle('layout-v3-is-editing', active);
    if (!active) return;
    const notice = (parent, text, className) => {
      const element = document.createElement('p');
      element.className = className;
      element.setAttribute('data-layout-v3-editor', '');
      element.setAttribute('role', 'note');
      element.textContent = text;
      parent.append(element);
    };
    section.querySelectorAll(':scope > .layout-v3-grid > .layout-v3-column').forEach((column) => {
      if (!column.querySelector('.layout-v3-item')) {
        notice(column, `Column ${column.dataset.layoutV3Column} — Use Add in the Layouts - V3 panel, or the section’s Add action followed by Assigned column ${column.dataset.layoutV3Column}.`, 'layout-v3-empty');
      }
    });
    const overflow = section.querySelectorAll('[data-layout-v3-overflow]');
    if (overflow.length) {
      notice(section, `${overflow.length} block(s) are assigned to a removed column. They are displayed in the last column; change Assigned column to save a new placement.`, 'layout-v3-warning');
    }
  });
}

export function initLayoutV3Editor() {
  if (initialized) return;
  initialized = true;
  loadCSS(`${window.hlx.codeBasePath}/layout-v3/editor-v3.css`);
  const syncMode = () => {
    editing = document.documentElement.classList.contains('adobe-ue-edit')
      && !document.documentElement.classList.contains('adobe-ue-preview');
    refreshLayoutV3Editor();
  };
  document.addEventListener('aue:ui-edit', () => { editing = true; refreshLayoutV3Editor(); });
  document.addEventListener('aue:ui-preview', () => { editing = false; refreshLayoutV3Editor(); });
  document.addEventListener('aue:initialized', () => queueMicrotask(syncMode));
  syncMode();
}
