// Optional editor entry point; public pages need only index.js and section.css.
export { initGlobalSectionEditor, refreshGlobalSectionEditor } from './runtime/editor.js';
export { default as attachGlobalSectionUpdates } from './runtime/updates.js';
export { decorateRichtext } from './runtime/richtext.js';
