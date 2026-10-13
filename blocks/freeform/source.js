// Colons invoke AEM icon expansion (for example, :v1: becomes an empty span).
const PREFIX = 'freeform-html-v2=';
const LEGACY_PREFIX = 'freeform:v1:';

/** Store HTML as text that survives AEM's rich-text normalization. */
export function encodeSource(source) {
  const bytes = new TextEncoder().encode(source);
  const binary = Array.from(bytes, (byte) => String.fromCharCode(byte)).join('');
  return PREFIX + btoa(binary);
}

/** Decode once, while retaining support for existing plain-text snippets. */
export function decodeSource(value) {
  const stored = value.trim();
  const prefix = [PREFIX, LEGACY_PREFIX].find((candidate) => stored.startsWith(candidate));
  if (!prefix) return value;
  const binary = atob(stored.slice(prefix.length));
  const bytes = Uint8Array.from(binary, (character) => character.charCodeAt(0));
  return new TextDecoder('utf-8', { fatal: true }).decode(bytes);
}

/** Read the delivered cell, including AEM-expanded markers from existing v1 saves. */
export function readSource(cell) {
  if (!cell) return '';
  const source = cell.cloneNode(true);
  source.querySelectorAll('span.icon.icon-v1').forEach((icon) => {
    // Only recover the known storage marker; other author-provided icons stay untouched.
    if (icon.previousSibling?.textContent.trim() === 'freeform') icon.replaceWith(':v1:');
  });
  source.querySelectorAll('br').forEach((br) => br.replaceWith('\n'));
  source.querySelectorAll('p').forEach((p) => p.append('\n'));
  return source.textContent;
}
