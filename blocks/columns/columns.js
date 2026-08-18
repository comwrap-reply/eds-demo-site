import { loadCSS } from '../../scripts/aem.js';
import decorateGlobalText from '../global-text/global-text.js';
import decorateGlobalTitle from '../global-title/global-title.js';

function getGap(block) {
  const gap = block.dataset.gap || block.getAttribute('gap');
  if (!gap) return '';

  const value = Number.parseFloat(gap);
  return Number.isFinite(value) && value >= 0 ? `${value}px` : '';
}

const gridClassPrefixes = ['grid-span-', 'grid-offset-', 'grid-float-'];
const gridFloatPositions = { left: 'start', center: 'center', right: 'end' };
const nestedGlobalBlockDecorators = {
  'global-text': decorateGlobalText,
  'global-title': decorateGlobalTitle,
};

function hasGridPlacement(element) {
  return [...element.classList].some((className) => gridClassPrefixes
    .some((prefix) => className.startsWith(prefix)));
}

function getGridValue(element, prefix, fallback) {
  const className = [...element.classList].find((value) => value.startsWith(prefix));
  return Number.parseInt(className?.replace(prefix, ''), 10) || fallback;
}

function removeGridOffsets(element) {
  [...element.classList]
    .filter((className) => className.startsWith('grid-offset-'))
    .forEach((className) => element.classList.remove(className));
}

function unwrapNestedGlobalBlocks(block) {
  const wrappers = [...block.children]
    .flatMap((row) => [...row.children])
    .flatMap((column) => [...column.children])
    .filter((item) => item.tagName === 'P');

  const isNestedGlobalBlock = (item) => Object.keys(nestedGlobalBlockDecorators)
    .some((name) => item.classList.contains(name));

  return wrappers.flatMap((wrapper) => {
    const movableItems = [...wrapper.children]
      .filter((item) => isNestedGlobalBlock(item) || hasGridPlacement(item));
    if (!movableItems.length) return [];

    movableItems.forEach((item) => wrapper.before(item));
    if (!wrapper.textContent.trim() && !wrapper.children.length) wrapper.remove();
    return movableItems.filter(isNestedGlobalBlock);
  });
}

async function decorateNestedGlobalBlocks(block) {
  const nestedBlocks = unwrapNestedGlobalBlocks(block);
  const blockNames = [...new Set(nestedBlocks.flatMap((nestedBlock) => (
    Object.keys(nestedGlobalBlockDecorators).filter((name) => nestedBlock.classList.contains(name))
  )))];

  await Promise.all(blockNames.map((name) => (
    loadCSS(`${window.hlx.codeBasePath}/blocks/${name}/${name}.css`)
  )));

  nestedBlocks.forEach((nestedBlock) => {
    const name = Object.keys(nestedGlobalBlockDecorators)
      .find((blockName) => nestedBlock.classList.contains(blockName));
    nestedGlobalBlockDecorators[name](nestedBlock);
  });
}

function setupGrid(block) {
  [...block.children].flatMap((row) => [...row.children]).forEach((column) => {
    const gridItems = [...column.children].filter(hasGridPlacement);
    if (!gridItems.length) return;

    column.classList.add('grid-layout');

    gridItems.forEach((item) => {
      const span = getGridValue(item, 'grid-span-', 12);
      const offset = getGridValue(item, 'grid-offset-', 0);
      const floatClass = [...item.classList].find((className) => className.startsWith('grid-float-'));
      const floatPosition = floatClass?.replace('grid-float-', '');

      item.style.setProperty('--grid-span', span);
      if (offset && offset + span <= 12) item.style.setProperty('--grid-start', offset + 1);
      else {
        item.style.removeProperty('--grid-start');
        if (offset) removeGridOffsets(item);
      }

      if (floatPosition && gridFloatPositions[floatPosition]) {
        item.style.setProperty('--grid-justify', gridFloatPositions[floatPosition]);
      }
    });
  });
}

const utilityAreaNames = [
  'Florida City Gas',
  'Central Florida Gas',
  'TECO Peoples Gas',
  'Florida Public Utilities',
];

function hasUtilityAreaList(block) {
  const items = [...block.querySelectorAll('li')]
    .map((li) => li.textContent.trim().replace(/\s+/g, ' '));

  return utilityAreaNames.every((name) => items.includes(name));
}

export default async function decorate(block) {
  const cols = [...block.firstElementChild.children];
  block.classList.add(`columns-${cols.length}-cols`);

  if (!block.classList.contains('rainbow-sandwich-links') && hasUtilityAreaList(block)) {
    block.classList.add('rainbow-sandwich-links');
  }

  const gap = getGap(block);
  if (gap) block.style.setProperty('--columns-gap', gap);

  await decorateNestedGlobalBlocks(block);
  setupGrid(block);

  // setup image columns
  [...block.children].forEach((row) => {
    [...row.children].forEach((col) => {
      const pic = col.querySelector('picture');
      if (pic) {
        const picWrapper = pic.closest('div');
        if (picWrapper && picWrapper.children.length === 1) {
          // picture is only content in column
          picWrapper.classList.add('columns-img-col');
        }
      }
    });
  });
}
