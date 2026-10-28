/**
 * Select the Text authoring model for an EDS URL or its AEM content path.
 * AEM's home document is /content/eds-demo-site/index (see paths.json).
 */
export function getTextModel(pathname) {
  const path = pathname
    .replace(/^.*\/content\/eds-demo-site(?=\/|$)/, '')
    .split('/jcr:content')[0]
    .replace(/\.html$/, '')
    .replace(/\/$/, '') || '/';

  if (path === '/' || path === '/index') return 'text-home';
  if (path === '/freeform') return 'text-freeform';
  return 'text';
}

/** Apply authoring choices without changing saved content or CSS classes. */
export default function decorateTextModifiers(container = document) {
  const pageResource = document.querySelector('main[data-aue-resource]')?.dataset.aueResource;
  const model = getTextModel(pageResource || window.location.pathname);
  const selector = [
    '[data-aue-model="text"]',
    '[data-aue-model="text-home"]',
    '[data-aue-model="text-freeform"]',
    '[data-aue-type="richtext"][data-aue-resource][data-aue-prop="text"]:not([data-aue-model])',
  ].join(',');

  container.querySelectorAll(selector).forEach((element) => {
    // Rich-text fields inside blocks keep their own block authoring contract.
    if (element.closest('.block')) return;
    element.dataset.aueModel = model;
  });
}
