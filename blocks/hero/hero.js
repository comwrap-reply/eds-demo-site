function getCell(row) {
  return row?.firstElementChild || row;
}

function getLink(cell) {
  const link = cell?.querySelector?.('a[href]');
  const text = cell?.textContent?.trim();
  if (link) return link.getAttribute('href');

  return /^(\/|#|https?:|mailto:|tel:)/i.test(text) ? text : '';
}

function hasContent(cell) {
  return !!(cell?.textContent?.trim() || cell?.children.length);
}

function hasRichTextContent(row) {
  const cell = getCell(row);
  return !!cell?.querySelector?.('h1, h2, h3, h4, h5, h6, p, ul, ol, blockquote');
}

function appendContent(cell, content) {
  if (!hasContent(cell)) return;

  cell.classList.add('hero-copy');
  content.append(cell);
}

function getRows(rows) {
  if (rows.length > 4) {
    return {
      altRow: rows[1],
      contentRow: rows[2],
      ctaTextRow: rows[3],
      ctaLinkRow: rows[4],
    };
  }

  if (rows.length > 3 && !hasRichTextContent(rows[1])) {
    return {
      altRow: rows[1],
      contentRow: rows[2],
      ctaTextRow: null,
      ctaLinkRow: rows[3],
    };
  }

  if (rows.length > 3) {
    return {
      altRow: null,
      contentRow: rows[1],
      ctaTextRow: rows[2],
      ctaLinkRow: rows[3],
    };
  }

  return {
    altRow: null,
    contentRow: rows[1],
    ctaTextRow: null,
    ctaLinkRow: rows[2],
  };
}

/**
 * loads and decorates the hero block
 * @param {Element} block The hero block element
 */
export default function decorate(block) {
  const rows = [...block.children];
  const [imageRow] = rows;
  const {
    altRow,
    contentRow,
    ctaTextRow,
    ctaLinkRow,
  } = getRows(rows);
  const imageCell = getCell(imageRow);
  const altCell = getCell(altRow);
  const contentCell = getCell(contentRow);
  const picture = imageCell?.querySelector?.('picture');

  if (picture) {
    const img = picture.querySelector('img');
    const alt = altCell?.textContent?.trim();
    if (img && alt) img.setAttribute('alt', alt);
    block.prepend(picture);
  }

  const content = document.createElement('div');
  content.className = 'hero-content';
  appendContent(contentCell, content);
  content.querySelectorAll('h1').forEach((heading) => heading.classList.add('adaptive-carousel--title'));

  const existingCta = content.querySelector('a.button, a[href].hero-cta');
  if (!existingCta) {
    const ctaText = ctaTextRow?.textContent?.trim()
      || ctaLinkRow?.querySelector?.('a[href]')?.textContent?.trim()
      || 'GET A FREE QUOTE';
    const ctaHref = getLink(ctaLinkRow) || '/get-a-quote';
    const cta = document.createElement('a');
    cta.className = 'button accent hero-cta';
    cta.href = ctaHref;
    cta.textContent = ctaText;

    const ctaWrapper = document.createElement('p');
    ctaWrapper.className = 'button-wrapper hero-cta-wrapper';
    ctaWrapper.append(cta);
    content.append(ctaWrapper);
  }

  block.textContent = '';
  if (picture) block.append(picture);
  block.append(content);
}
