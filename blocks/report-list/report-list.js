/**
 * Decorates an author-managed list of market-report documents.
 * @param {Element} block The report list block element
 */
export default function decorate(block) {
  const list = document.createElement('ol');
  list.className = 'report-list-items';

  [...block.children].forEach((row) => {
    const [dateCell, contentCell, linkCell] = [...row.children];
    const item = document.createElement('li');
    item.className = 'report-list-item';
    if (dateCell) {
      dateCell.className = 'report-list-date';
      item.append(dateCell);
    }
    if (contentCell) {
      contentCell.className = 'report-list-content';
      item.append(contentCell);
    }
    if (linkCell) {
      linkCell.className = 'report-list-link';
      const link = linkCell.querySelector('a[href]');
      if (link) {
        link.classList.add('button', 'secondary');
        link.target = '_blank';
        link.rel = 'noopener';
      }
      item.append(linkCell);
    }
    list.append(item);
  });

  block.replaceChildren(list);
}
