function getGap(block) {
  const gap = block.dataset.gap || block.getAttribute('gap');
  if (!gap) return '';

  const value = Number.parseFloat(gap);
  return Number.isFinite(value) && value >= 0 ? `${value}px` : '';
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

export default function decorate(block) {
  const cols = [...block.firstElementChild.children];
  block.classList.add(`columns-${cols.length}-cols`);

  if (!block.classList.contains('rainbow-sandwich-links') && hasUtilityAreaList(block)) {
    block.classList.add('rainbow-sandwich-links');
  }

  const gap = getGap(block);
  if (gap) block.style.setProperty('--columns-gap', gap);

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
