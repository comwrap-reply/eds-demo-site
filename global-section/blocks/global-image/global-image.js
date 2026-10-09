/**
 * Decorates a reusable image block.
 * @param {Element} block The Global Image block element.
 */
export default function decorate(block) {
  const picture = block.querySelector('picture');
  if (!picture) return;

  const figure = document.createElement('figure');
  figure.className = 'global-image-figure';
  figure.append(picture);
  block.replaceChildren(figure);
}
