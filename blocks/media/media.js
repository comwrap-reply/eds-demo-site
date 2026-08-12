/**
 * Decorates locally hosted media and surfaces caption requirements to authors.
 * @param {Element} block The media block element
 */
export default function decorate(block) {
  [...block.children].forEach((row) => {
    const [mediaCell, contentCell] = [...row.children];
    const item = document.createElement('figure');
    item.className = 'media-item';
    const video = mediaCell?.querySelector('video');

    if (mediaCell) {
      mediaCell.className = 'media-player';
      item.append(mediaCell);
    }
    if (contentCell) {
      const caption = document.createElement('figcaption');
      caption.className = 'media-caption';
      caption.append(...contentCell.childNodes);
      item.append(caption);
    }
    if (video && !video.querySelector('track[kind="captions"]')) {
      const warning = document.createElement('p');
      warning.className = 'media-caption-warning';
      warning.textContent = 'Captions are required before this video can be published.';
      item.append(warning);
    }
    row.replaceWith(item);
  });
}
