/* Layouts - V2: transient Universal Editor UI, never part of authored content. */
import { loadCSS } from '../scripts/aem.js';

let editing = false;
let initialized = false;

export function refreshLayoutV2Editor(root = document) {
  const sections = root.matches?.('.section') ? [root] : [...root.querySelectorAll('.section')];
  sections.forEach((section) => {
    section.querySelectorAll('[data-layout-v2-editor]').forEach((element) => element.remove());
    const active = editing && section.classList.contains('layout-v2');
    section.classList.toggle('layout-v2-is-editing', active);
    if (!active) return;
    const notice = (parent, text, className) => {
      const element = document.createElement('p');
      element.className = className;
      element.setAttribute('data-layout-v2-editor', '');
      element.setAttribute('role', 'note');
      element.textContent = text;
      parent.append(element);
    };
    section.querySelectorAll(':scope > .layout-v2-grid > .layout-v2-column').forEach((column) => {
      if (!column.querySelector('.layout-v2-item')) {
        notice(column, `Column ${column.dataset.layoutV2Column} — Use the section’s Add action, then set the new block’s Assigned column to ${column.dataset.layoutV2Column}.`, 'layout-v2-empty');
      }
    });
    const overflow = section.querySelectorAll('[data-layout-v2-overflow]');
    if (overflow.length) {
      notice(section, `${overflow.length} block(s) are assigned to a removed column. They are displayed in the last column; change Assigned column to save a new placement.`, 'layout-v2-warning');
    }
  });
}

export function initLayoutV2Editor() {
  if (initialized) return;
  initialized = true;
  loadCSS(`${window.hlx.codeBasePath}/layout-v2/editor-v2.css`);
  const syncMode = () => {
    editing = document.documentElement.classList.contains('adobe-ue-edit')
      && !document.documentElement.classList.contains('adobe-ue-preview');
    refreshLayoutV2Editor();
  };
  document.addEventListener('aue:ui-edit', () => { editing = true; refreshLayoutV2Editor(); });
  document.addEventListener('aue:ui-preview', () => { editing = false; refreshLayoutV2Editor(); });
  document.addEventListener('aue:initialized', () => queueMicrotask(syncMode));
  syncMode();
}
