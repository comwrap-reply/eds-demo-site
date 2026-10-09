/* Native Layouts - V3: transient UI for real native cells only. */
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
