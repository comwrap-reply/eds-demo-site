/**
 * Applies the RTE filter without rewriting authored HTML or instrumentation.
 * @param {Element} block The Freeform v2 block element.
 */
export default function decorate(block) {
  block.querySelectorAll('[data-aue-type="richtext"][data-aue-prop="text"]').forEach((editable) => {
    editable.dataset.aueFilter = 'freeform-v2';
  });
  block.querySelectorAll('[data-richtext-prop="text"]').forEach((editable) => {
    editable.dataset.richtextFilter = 'freeform-v2';
  });
}
