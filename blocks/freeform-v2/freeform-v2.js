/**
 * Reads pasted source while retaining line breaks introduced by the RTE.
 * @param {Node} node A node in the authored rich-text content.
 * @returns {string} HTML source as text.
 */
function readSource(node) {
  if (node.nodeType === Node.TEXT_NODE) return node.textContent;
  if (node.nodeType !== Node.ELEMENT_NODE) return '';
  if (node.tagName === 'BR') return '\n';

  const text = [...node.childNodes].map(readSource).join('');
  return node.matches('p, div, pre, li, blockquote, h1, h2, h3, h4, h5, h6')
    ? `${text}\n` : text;
}

/**
 * Applies the RTE filter and optionally renders pasted HTML source.
 * @param {Element} block The Freeform v2 block element.
 */
export default function decorate(block) {
  block.querySelector(':scope > .freeform-v2-rendered')?.remove();
  const sourceRow = block.firstElementChild;
  sourceRow?.classList.remove('freeform-v2-source');

  block.querySelectorAll('[data-aue-type="richtext"][data-aue-prop="text"]').forEach((editable) => {
    editable.dataset.aueFilter = 'freeform-v2';
  });
  block.querySelectorAll('[data-richtext-prop="text"]').forEach((editable) => {
    editable.dataset.richtextFilter = 'freeform-v2';
  });

  const content = sourceRow?.firstElementChild;
  if (!block.classList.contains('render-html') || !content) return;

  // Parse once: encoded entities inside the authored source must stay literal.
  const template = document.createElement('template');
  template.innerHTML = readSource(content);
  const rendered = document.createElement('div');
  rendered.className = 'freeform-v2-rendered';
  rendered.append(template.content);

  // Keep the original RTE value/instrumentation for property-panel editing.
  sourceRow.classList.add('freeform-v2-source');
  block.append(rendered);
}
