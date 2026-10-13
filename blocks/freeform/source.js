const PREFIX = 'freeform:v1:';

/** Store HTML as text that survives AEM's rich-text normalization. */
export function encodeSource(source) {
  const bytes = new TextEncoder().encode(source);
  const binary = Array.from(bytes, (byte) => String.fromCharCode(byte)).join('');
  return PREFIX + btoa(binary);
}

/** Decode once, while retaining support for existing plain-text snippets. */
export function decodeSource(value) {
  const stored = value.trim();
  if (!stored.startsWith(PREFIX)) return value;
  const binary = atob(stored.slice(PREFIX.length));
  const bytes = Uint8Array.from(binary, (character) => character.charCodeAt(0));
  return new TextDecoder('utf-8', { fatal: true }).decode(bytes);
}
