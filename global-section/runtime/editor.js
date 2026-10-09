/* Layouts: transient Universal Editor UI, never part of authored content. */

let editing = false;
let initialized = false;

export function refreshGlobalSectionEditor(root = document) {
  const sections = root.matches?.('.section') ? [root] : [...root.querySelectorAll('.section')];
  sections.forEach((section) => {
    section.querySelectorAll('[data-layout-editor]').forEach((element) => element.remove());
    const active = editing && section.classList.contains('layout-columns');
    section.classList.toggle('layout-is-editing', active);
    if (!active) return;
    const notice = (parent, text, className) => {
      const element = document.createElement('p');
      element.className = className;
      element.setAttribute('data-layout-editor', '');
      element.setAttribute('role', 'note');
      element.textContent = text;
      parent.append(element);
    };
    section.querySelectorAll(':scope > .layout-grid > .layout-column').forEach((column) => {
      if (!column.querySelector('.layout-item')) {
        notice(column, `Column ${column.dataset.layoutColumn} — Use Add in the Layouts panel, or the section’s Add action followed by Assigned column ${column.dataset.layoutColumn}.`, 'layout-empty');
      }
    });
    const overflow = section.querySelectorAll('[data-layout-overflow]');
    if (overflow.length) {
      notice(section, `${overflow.length} block(s) are assigned to a removed column. They are displayed in the last column; change Assigned column to save a new placement.`, 'layout-warning');
    }
  });
}

export function initGlobalSectionEditor() {
  if (initialized) return;
  initialized = true;
  const { href } = new URL('../editor.css', import.meta.url);
  if (![...document.styleSheets].some((sheet) => sheet.href === href)) {
    const link = document.createElement('link');
    link.rel = 'stylesheet';
    link.href = href;
    document.head.append(link);
  }
  const syncMode = () => {
    editing = document.documentElement.classList.contains('adobe-ue-edit')
      && !document.documentElement.classList.contains('adobe-ue-preview');
    refreshGlobalSectionEditor();
  };
  document.addEventListener('aue:ui-edit', () => { editing = true; refreshGlobalSectionEditor(); });
  document.addEventListener('aue:ui-preview', () => { editing = false; refreshGlobalSectionEditor(); });
  document.addEventListener('aue:initialized', () => queueMicrotask(syncMode));
  syncMode();
}
