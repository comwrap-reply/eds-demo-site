// Public entry point. No imports from the host site's scripts or other layouts.
// eslint-disable-next-line import/prefer-default-export
export { default as decorateGlobalSection } from './runtime/section.js';
// Import editor.js separately, only from the host's editor-support entry point.
