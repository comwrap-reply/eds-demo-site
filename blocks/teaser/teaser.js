import { createOptimizedPicture } from '../../scripts/aem.js';
import { moveInstrumentation } from '../../scripts/scripts.js';

function getLink(cell) {
  const link = cell?.querySelector?.('a[href]');
  const text = cell?.textContent?.trim();
  return link?.getAttribute('href') || text || '';
}
// Build Cta
function buildCta(cell) {
  const href = getLink(cell);
  if (!href) return null;

  const link = cell.querySelector?.('a[href]');
  const label = link?.textContent?.trim() || cell.textContent.trim() || 'LEARN MORE';

  const cta = document.createElement('a');
  cta.className = 'button primary teaser-cta';
  cta.href = href;
  cta.textContent = label;

  const wrapper = document.createElement('p');
  wrapper.className = 'button-wrapper teaser-cta-wrapper';
  wrapper.append(cta);
  return wrapper;
}

export default function decorate(block) {
  const cells = [...block.children].map((row) => row.firstElementChild).filter(Boolean);
  const [imageCell, textCell, ctaCell] = cells;

  const image = imageCell?.querySelector('picture, img');
  const content = document.createElement('div');
  content.className = 'teaser-content';

  if (textCell?.textContent?.trim() || textCell?.children.length) {
    textCell.className = 'teaser-text';
    content.append(textCell);
  }

  const cta = buildCta(ctaCell);
  if (cta) content.append(cta);

  block.replaceChildren();

  if (image) {
    const imageWrapper = document.createElement('div');
    imageWrapper.className = 'teaser-image';
    imageWrapper.append(imageCell);
    block.append(imageWrapper);
  }

  if (content.children.length) block.append(content);

  block.querySelectorAll('picture > img').forEach((img) => {
    const optimizedPic = createOptimizedPicture(img.src, img.alt, false, [{ width: '1200' }]);
    moveInstrumentation(img, optimizedPic.querySelector('img'));
    img.closest('picture').replaceWith(optimizedPic);
  });
}
