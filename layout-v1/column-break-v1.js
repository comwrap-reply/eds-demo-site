/**
 * Layouts - V1: existing Column Break behavior.
 *
 * Keeps the authorable marker available until the section decorator groups it.
 * @param {Element} block the Column Break block
 */
export default function decorateColumnBreakV1(block) {
  block.setAttribute('aria-label', 'Column Break');
}
