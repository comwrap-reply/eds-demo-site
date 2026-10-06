import {
  decorateBlock,
  decorateIcons,
  loadBlock,
  loadScript,
  loadSection,
  loadSections,
} from './aem.js';
import { decorateRichtext } from './editor-support-rte.js';
import { decorateButtons, decorateMain } from './scripts.js';
import decorateSectionV2 from '../layout-v2/section-v2.js';
import { initLayoutV2Editor, refreshLayoutV2Editor } from '../layout-v2/editor-v2.js';

let promiseChanges$ = Promise.resolve();
const listening = new WeakSet();

function resourceElements(root, resource) {
  return [...root.querySelectorAll('[data-aue-resource], [data-richtext-resource]')]
    .filter((element) => element.getAttribute('data-aue-resource') === resource
      || element.getAttribute('data-richtext-resource') === resource);
}

function contentElement(root, resource) {
  const elements = resourceElements(root, resource);
  return elements.find((element) => !element.hasAttribute('data-aue-prop')) || elements[0];
}

async function replaceContent(element, parsedUpdate, resource) {
  if (element.matches('main, .section')) {
    const replacement = contentElement(parsedUpdate, resource);
    if (!replacement) return false;
    // Decorate only fresh markup. Re-decorating grouped sections would mistake their
    // presentation columns for authored blocks.
    const staging = document.createElement('main');
    if (element.matches('main')) decorateMain(replacement);
    else { staging.append(replacement); decorateMain(staging); }
    decorateRichtext(replacement);
    replacement.style.display = 'none';
    element.replaceWith(replacement);
    if (replacement.matches('main')) await loadSections(replacement);
    else await loadSection(replacement);
    replacement.style.display = '';
    if (replacement.matches('main')) {
      // eslint-disable-next-line no-use-before-define
      attachEventListeners(replacement);
    }
    return true;
  }

  const block = element.closest('.block[data-aue-resource]');
  if (block) {
    const newBlock = contentElement(parsedUpdate, block.getAttribute('data-aue-resource'));
    if (!newBlock) return false;
    newBlock.style.display = 'none';
    const section = block.closest('.section');
    block.replaceWith(newBlock);
    decorateButtons(newBlock);
    decorateIcons(newBlock);
    decorateBlock(newBlock);
    decorateRichtext(newBlock);
    await loadBlock(newBlock);
    newBlock.style.display = '';
    if (section) decorateSectionV2(section);
    return true;
  }

  // Default content may have several rich-text siblings sharing one resource.
  const newElements = resourceElements(parsedUpdate, resource)
    .filter((candidate, i, all) => !all.some((parent, j) => i !== j && parent.contains(candidate)));
  if (!newElements.length) return false;
  const { parentElement } = element;
  const oldElements = resourceElements(parentElement, resource);
  element.replaceWith(...newElements);
  oldElements.filter((old) => old !== element && old.isConnected).forEach((old) => old.remove());
  decorateButtons(parentElement);
  decorateIcons(parentElement);
  decorateRichtext(parentElement);
  return true;
}

async function applyChanges(event) {
  const { detail } = event;
  const resource = detail?.request?.target?.resource
    || detail?.request?.target?.container?.resource
    || detail?.request?.to?.container?.resource
    || detail?.resource;
  const updates = detail?.response?.updates || [];
  const htmlUpdates = updates.filter((update) => update.content);

  if (!htmlUpdates.length) {
    // A successful native remove may omit replacement HTML. Remove the actual editable,
    // not its column. Other unsupported payloads retain the existing reload fallback.
    const element = resource && contentElement(document, resource);
    if (event.type !== 'aue:content-remove' || !element) return false;
    const section = element.closest('.section');
    const wrapper = element.parentElement;
    element.remove();
    if (wrapper.classList.contains('layout-v2-item') && !wrapper.children.length) wrapper.remove();
    if (section?.isConnected) decorateSectionV2(section);
    refreshLayoutV2Editor();
    return true;
  }

  await loadScript(`${window.hlx.codeBasePath}/scripts/dompurify.min.js`);
  const patches = htmlUpdates.map((update) => {
    const target = update.resource || resource;
    let element = target && contentElement(document, target);
    const sanitized = window.DOMPurify.sanitize(update.content, { USE_PROFILES: { html: true } });
    const parsed = new DOMParser().parseFromString(sanitized, 'text/html');
    let effectiveResource = target;
    // Some services return a whole-main snapshot for a single properties-panel change.
    // Keep unrelated sections and their state alive by extracting only the requested editable.
    if (element?.matches('main') && ['aue:content-patch', 'aue:content-update'].includes(event.type)) {
      const requested = resource && contentElement(document, resource);
      const specific = requested?.closest('.block[data-aue-resource], .section[data-aue-resource]');
      const specificResource = specific?.getAttribute('data-aue-resource');
      if (specific && contentElement(parsed, specificResource)) {
        element = specific;
        effectiveResource = specificResource;
      }
    }
    return { resource: effectiveResource, element, parsed };
  });
  if (patches.some(({ element }) => !element)) return false;
  // Parent snapshots contain their children. Apply each affected subtree only once,
  // including both section snapshots from a native cross-section move.
  const roots = patches.filter(({ element }, i) => !patches.some((parent, j) => j !== i
    && (parent.element === element ? j < i : parent.element.contains(element))));
  const results = [];
  // Preserve the saved update order.
  // eslint-disable-next-line no-restricted-syntax
  for (const patch of roots) {
    // eslint-disable-next-line no-await-in-loop
    results.push(await replaceContent(patch.element, patch.parsed, patch.resource));
  }
  refreshLayoutV2Editor();
  return results.length > 0 && results.every(Boolean);
}

function attachEventListeners(main) {
  if (!main || listening.has(main)) return;
  listening.add(main);
  [
    'aue:content-patch',
    'aue:content-update',
    'aue:content-add',
    'aue:content-move',
    'aue:content-remove',
    'aue:content-copy',
  ].forEach((eventType) => main.addEventListener(eventType, (event) => {
    event.stopPropagation();
    promiseChanges$ = promiseChanges$.then(() => applyChanges(event))
      .then((applied) => { if (!applied) window.location.reload(); })
      .catch(() => window.location.reload());
  }));
}

attachEventListeners(document.querySelector('main'));
initLayoutV2Editor();

// Preserve the existing rich-text observer; layout updates use the explicit event lifecycle.
decorateRichtext();
const observer = new MutationObserver(() => decorateRichtext());
observer.observe(document, { attributeFilter: ['data-richtext-prop'], subtree: true });
