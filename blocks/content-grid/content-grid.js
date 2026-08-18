import { createOptimizedPicture } from '../../scripts/aem.js';
import { moveInstrumentation } from '../../scripts/scripts.js';

const gridWidths = {
  10: 6,
  20: 12,
  25: 15,
  33: 20,
  35: 21,
  40: 24,
  50: 30,
  60: 36,
  65: 39,
  66: 40,
  75: 45,
  80: 48,
  90: 54,
  100: 60,
};

function hasContent(cell) {
  return !!cell?.textContent?.trim() || !!cell?.querySelector('picture, img');
}

function getGridValue(item, type, fallback) {
  const className = [...item.classList].find((value) => value.startsWith(`grid-${type}-`));
  return Number.parseInt(className?.replace(`grid-${type}-`, ''), 10) || fallback;
}

function moveGridClasses(from, to) {
  [...from.classList]
    .filter((className) => className.startsWith('grid-width-') || className.startsWith('grid-start-'))
    .forEach((className) => to.classList.add(className));
}

function buildTitle(cell) {
  if (!hasContent(cell)) return null;

  const heading = cell.querySelector('h1, h2, h3, h4, h5, h6');
  if (heading) return heading;

  const title = document.createElement('h3');
  title.textContent = cell.textContent.trim();
  return title;
}

function buildImage(cell) {
  const image = cell?.querySelector('img');
  if (!image) return null;

  const picture = createOptimizedPicture(image.src, image.alt, false, [{ width: '750' }]);
  moveInstrumentation(image, picture.querySelector('img'));

  const figure = document.createElement('figure');
  figure.className = 'content-grid-item-image';
  figure.append(picture);
  return figure;
}

function buildText(cell) {
  if (!hasContent(cell)) return null;

  const content = document.createElement('div');
  content.className = 'content-grid-item-text';
  if (cell.children.length) content.append(...cell.children);
  else {
    const paragraph = document.createElement('p');
    paragraph.textContent = cell.textContent.trim();
    content.append(paragraph);
  }
  return content;
}

function buildCta(cell) {
  const link = cell?.querySelector('a[href]');
  if (!link) return null;

  const label = link.textContent.trim() || cell.textContent.trim();
  if (!label) return null;

  const cta = document.createElement('a');
  cta.className = 'button primary content-grid-item-cta';
  cta.href = link.href;
  cta.textContent = label;

  const wrapper = document.createElement('p');
  wrapper.className = 'button-wrapper content-grid-item-cta-wrapper';
  wrapper.append(cta);
  return wrapper;
}

function hasValidPlacement(item) {
  const width = getGridValue(item, 'width', 100);
  const start = getGridValue(item, 'start', 0);
  return gridWidths[width] && (!start || start + width <= 100);
}

function buildItem(row) {
  const item = document.createElement('article');
  item.className = 'content-grid-item';
  moveInstrumentation(row, item);
  moveGridClasses(row, item);

  if (!hasValidPlacement(item)) {
    [...item.classList]
      .filter((className) => className.startsWith('grid-start-'))
      .forEach((className) => item.classList.remove(className));
  }

  const [titleCell, imageCell, textCell, ctaCell] = [...row.children];
  const title = buildTitle(titleCell);
  const image = buildImage(imageCell);
  const text = buildText(textCell);
  const cta = buildCta(ctaCell);

  if (title) item.append(title);
  if (image) item.append(image);
  if (text) item.append(text);
  if (cta) item.append(cta);
  return item;
}

/**
 * Decorates a collection of positioned content cards.
 * @param {Element} block The Content Grid block element.
 */
export default function decorate(block) {
  const items = document.createElement('div');
  items.className = 'content-grid-items';
  [...block.children].forEach((row) => items.append(buildItem(row)));
  block.replaceChildren(items);
}
