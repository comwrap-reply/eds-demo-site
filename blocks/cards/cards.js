import { createOptimizedPicture } from '../../scripts/aem.js';
import { moveInstrumentation } from '../../scripts/scripts.js';

function getLink(cell) {
  const link = cell?.querySelector?.('a[href]');
  const text = cell?.textContent?.trim();
  return link?.getAttribute('href') || text || '';
}

function buildCta(labelCell, linkCell) {
  const label = labelCell?.textContent?.trim();
  const href = getLink(linkCell);
  if (!label || !href) return null;

  const cta = document.createElement('a');
  cta.className = 'button primary cards-card-cta';
  cta.href = href;
  cta.textContent = label;

  const wrapper = document.createElement('p');
  wrapper.className = 'button-wrapper cards-card-cta-wrapper';
  wrapper.append(cta);
  return wrapper;
}

function buildCtaFromLink(linkCell) {
  const href = getLink(linkCell);
  if (!href) return null;

  const link = linkCell.querySelector?.('a[href]');
  const label = link?.textContent?.trim() || linkCell.textContent.trim() || 'LEARN MORE';

  const cta = document.createElement('a');
  cta.className = 'button primary cards-card-cta';
  cta.href = href;
  cta.textContent = label;

  const wrapper = document.createElement('p');
  wrapper.className = 'button-wrapper cards-card-cta-wrapper';
  wrapper.append(cta);
  return wrapper;
}

function hasContent(cell) {
  return !!cell?.textContent?.trim() || !!cell?.querySelector?.('picture, img');
}

function isIconCell(cell) {
  if (!cell) return false;
  const hasMedia = !!cell.querySelector('picture, img');
  const hasText = !!cell.textContent.trim();
  return hasMedia && !hasText;
}

function getCardParts(cells) {
  const hasDedicatedTitle = cells.length >= 4 && cells[2]?.querySelector?.('p, ul, ol, h1, h2, h3, h4, h5, h6');

  if (hasDedicatedTitle) {
    const icon = isIconCell(cells[0]) ? cells[0] : null;
    return {
      body: hasContent(cells[2]) ? cells[2] : null,
      cta: buildCtaFromLink(cells[3]),
      icon,
      titleCell: cells[1],
    };
  }

  const contentCells = cells.slice(0, 2).filter(hasContent);
  const icon = contentCells.find(isIconCell);
  const body = contentCells.find((cell) => cell !== icon) || contentCells[0];
  return {
    body,
    cta: buildCta(cells[2], cells[3]),
    icon: icon === body ? null : icon,
    titleCell: null,
  };
}

function buildTitle(titleCell) {
  if (!hasContent(titleCell)) return null;

  const authoredHeading = titleCell.querySelector('h1, h2, h3, h4, h5, h6');
  if (authoredHeading) return authoredHeading;

  const text = titleCell.textContent.trim();
  if (!text) return null;

  const title = document.createElement('h4');
  title.textContent = text;
  return title;
}

function decorateCardBody(body, icon, cta, titleCell) {
  const title = buildTitle(titleCell) || [...body.children].find((child) => /^H[1-6]$/.test(child.tagName));
  const description = document.createElement('div');
  description.className = 'cards-card-description';

  [...body.children].forEach((child) => {
    if (child !== title) description.append(child);
  });

  body.replaceChildren();
  if (title) {
    title.classList.add('cards-card-title');
    body.append(title);
  }
  if (icon) {
    icon.className = 'cards-card-icon';
    body.append(icon);
  }
  if (hasContent(description)) body.append(description);
  if (cta) body.append(cta);
}

export default function decorate(block) {
  /* change to ul, li */
  const ul = document.createElement('ul');
  [...block.children].forEach((row) => {
    const li = document.createElement('li');
    moveInstrumentation(row, li);
    const cells = [...row.children];
    const {
      body,
      cta,
      icon,
      titleCell,
    } = getCardParts(cells);

    if (body) {
      body.className = 'cards-card-body';
      decorateCardBody(body, icon, cta, titleCell);
      li.append(body);
    } else if (icon || cta || hasContent(titleCell)) {
      const fallback = document.createElement('div');
      fallback.className = 'cards-card-body';
      decorateCardBody(fallback, icon, cta, titleCell);
      li.append(fallback);
    }

    ul.append(li);
  });
  ul.querySelectorAll('picture > img').forEach((img) => {
    const optimizedPic = createOptimizedPicture(img.src, img.alt, false, [{ width: '200' }]);
    moveInstrumentation(img, optimizedPic.querySelector('img'));
    img.closest('picture').replaceWith(optimizedPic);
  });
  ul.querySelectorAll('.cards-card-icon > p > img, .cards-card-icon > img').forEach((img) => {
    const optimizedPic = createOptimizedPicture(img.src, img.alt, false, [{ width: '200' }]);
    moveInstrumentation(img, optimizedPic.querySelector('img'));
    const wrapper = img.closest('p') || img;
    wrapper.replaceWith(optimizedPic);
  });
  block.replaceChildren(ul);
}
