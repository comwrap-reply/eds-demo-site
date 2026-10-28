import config from './config.js';

/** Read the reference and hidden variation rows emitted by AEM. */
export function readFragmentReference(block) {
  const [referenceRow, variationRow] = block.children;
  const reference = referenceRow?.querySelector('a')?.getAttribute('href')
    || referenceRow?.textContent.trim();
  if (!reference) return null;

  const url = new URL(reference, window.location.origin);
  const path = url.pathname.replace(/\.html$/, '');
  if (!path.startsWith('/content/dam/') || path === '/content/dam/') {
    throw new Error('Choose an AEM Content Fragment under /content/dam/.');
  }

  return { path, variation: variationRow?.textContent.trim() || 'master' };
}

/** Build a cacheable persisted-query request with encoded GraphQL variables. */
export function getQueryURL({ path, variation }, origin = window.location.origin) {
  const base = origin === config.authorOrigin ? config.authorOrigin : config.publishOrigin;
  return `${base}${config.queryPath};path=${encodeURIComponent(path)};variation=${encodeURIComponent(variation)}`;
}

/** Permit authored web, mail and telephone links; never render executable URLs. */
export function getSafeLink(value) {
  if (!value || typeof value !== 'string') return null;
  try {
    const url = new URL(value, window.location.origin);
    if (!['http:', 'https:', 'mailto:', 'tel:'].includes(url.protocol)) return null;
    return url.href;
  } catch {
    return null;
  }
}

function renderCard(item) {
  const article = document.createElement('article');
  article.className = 'content-fragment-card';

  if (item.heading) {
    const heading = document.createElement('h2');
    heading.textContent = item.heading;
    article.append(heading);
  }

  // The model uses plain text. Rendering as text also keeps author input inert.
  if (item.body?.plaintext) {
    const body = document.createElement('p');
    body.className = 'content-fragment-body';
    body.textContent = item.body.plaintext;
    article.append(body);
  }

  const href = getSafeLink(item.link);
  if (href && item.linkText?.trim()) {
    const paragraph = document.createElement('p');
    paragraph.className = 'button-container';
    const link = document.createElement('a');
    link.className = 'button primary';
    link.href = href;
    link.textContent = item.linkText;
    paragraph.append(link);
    article.append(paragraph);
  }

  return article;
}

function showMessage(block, message) {
  const paragraph = document.createElement('p');
  paragraph.className = 'content-fragment-message';
  paragraph.textContent = message;
  block.replaceChildren(paragraph);
}

/** Load the selected Content Card variation, retaining the block's UE instrumentation. */
export default async function decorate(block) {
  const isAuthor = block.hasAttribute('data-aue-resource');
  try {
    const reference = readFragmentReference(block);
    if (!reference) {
      if (isAuthor) showMessage(block, 'Select a content fragment.');
      else block.hidden = true;
      return;
    }

    showMessage(block, 'Loading content…');
    block.setAttribute('aria-busy', 'true');
    const response = await fetch(getQueryURL(reference), {
      credentials: 'same-origin',
      signal: AbortSignal.timeout(10000),
    });
    if (!response.ok) throw new Error(`Content Fragment request failed (${response.status}).`);
    const result = await response.json();
    const item = result.data?.edsContentCardByPath?.item;
    if (result.errors?.length || !item) throw new Error('Content Fragment is unavailable or uses a different model.');

    block.dataset.fragmentPath = reference.path;
    block.dataset.fragmentVariation = item._variation || 'master'; // eslint-disable-line no-underscore-dangle
    block.replaceChildren(renderCard(item));
  } catch (error) {
    showMessage(block, isAuthor
      ? 'Content fragment unavailable. Check the selected fragment and its delivery configuration.'
      : 'This content is currently unavailable.');
    // eslint-disable-next-line no-console
    console.warn('Content Fragment:', error);
  } finally {
    block.removeAttribute('aria-busy');
  }
}
