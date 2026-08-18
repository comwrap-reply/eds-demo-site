/**
 * Keeps the authorable marker available until the section decorator groups it.
 * @param {Element} block the Column Break block
 */
export default function decorate(block) {
  block.setAttribute('aria-label', 'Column Break');
}
