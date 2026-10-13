import { encodeSource } from './source.js';

/** Only save to an instrumented AEM resource on the current author origin. */
export function authorTarget(resource, connection, origin) {
  const match = resource?.match(/^urn:[^:]+:(\/content\/[\w/:-]+\/jcr:content\/[\w/:-]+)$/);
  const connectionURL = connection?.match(/^(?:aem|xwalk):(https?:\/\/.+)$/)?.[1];
  if (!match || !connectionURL) return null;
  try {
    if (new URL(connectionURL).origin !== origin) return null;
  } catch {
    return null;
  }
  const path = match[1];
  const [page, relative] = path.split('/jcr:content/');
  return { path, pageContent: `${page}/jcr:content`, relative };
}

async function requestJSON(url, options = {}) {
  const response = await fetch(url, {
    credentials: 'same-origin',
    cache: 'no-store',
    redirect: 'error',
    ...options,
    headers: { Accept: 'application/json', ...options.headers },
  });
  if (!response.ok) {
    if ([401, 403].includes(response.status)) {
      throw new Error('AEM denied access. Check that you are signed in and can edit this page. Your HTML is still here.');
    }
    throw new Error(`AEM request failed (${response.status}). Your HTML is still here; try again.`);
  }
  return response.json();
}

export async function loadSource(target) {
  const data = await requestJSON(`${target.path}.json`);
  if (data.model !== 'freeform'
      || data['sling:resourceType'] !== 'core/franklin/components/block/v1/block') {
    throw new Error('This Freeform block is no longer available. Reload the page before editing.');
  }
  if (data.text !== undefined && typeof data.text !== 'string') {
    throw new Error('The saved HTML has an unsupported format. It has not been changed.');
  }
  return data.text ?? '';
}

export async function saveSource(target, source, previous) {
  const value = encodeSource(source);
  const current = await loadSource(target);
  // Also permits a retry after a successful write whose response was lost.
  if (current === value) return value;
  if (current !== previous) {
    throw new Error('This block changed after you opened it. Copy your HTML, then close and reopen the editor to get the latest version.');
  }
  const { token } = await requestJSON('/libs/granite/csrf/token.json');
  if (!token) throw new Error('Sign in to AEM before saving. Your HTML is still here.');

  const body = new FormData();
  body.set(`./${target.relative}/text`, value);
  body.set(`./${target.relative}/text@TypeHint`, 'String');
  // Newly inserted blocks may not have visited the native properties panel yet.
  body.set(`./${target.relative}/modelFields`, 'text@textarea');
  body.set(`./${target.relative}/modelFields@TypeHint`, 'String[]');
  body.set(`./${target.relative}/jcr:lastModified`, '');
  body.set(`./${target.relative}/jcr:lastModifiedBy`, '');
  body.set('./cq:lastModified', new Date().toISOString());
  body.set('./cq:lastModified@TypeHint', 'Date');
  await requestJSON(target.pageContent, {
    method: 'POST',
    headers: { 'CSRF-Token': token },
    body,
  });
  if (await loadSource(target) !== value) {
    throw new Error('AEM did not return the saved HTML. Your HTML is still here; copy it before closing and check the page.');
  }
  return value;
}
