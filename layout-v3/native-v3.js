/* Layouts - V3: decorate actual AEM Columns cells; never manufacture saved resources. */
import { GAP_VALUES } from './layout-v3.js';

export default function decorateNativeV3(block) {
  if (!block.matches('.columns.layout-v3-native')) return;
  const gaps = [...block.classList].filter((name) => name.startsWith('layout-v3-gap-'));
  const token = gaps.length === 1 ? gaps[0].slice('layout-v3-gap-'.length) : 'medium';
  const gap = Object.hasOwn(GAP_VALUES, token) ? GAP_VALUES[token] : 24;
  block.style.setProperty('--layout-v3-gap', `${gap}px`);
  if (block.hasAttribute('data-aue-resource')) block.dataset.aueModel = 'columns-native-v3';
  [...block.children].filter((row) => row.tagName === 'DIV').forEach((row, rowIndex) => {
    row.classList.add('layout-v3-native-row');
    const cells = [...row.children].filter((cell) => cell.tagName === 'DIV');
    row.style.setProperty('--layout-v3-count', Math.max(1, cells.length));
    row.style.setProperty('--layout-v3-tablet-count', Math.min(2, Math.max(1, cells.length)));
    cells.forEach((cell, columnIndex) => {
      cell.classList.add('layout-v3-native-cell');
      cell.dataset.layoutV3Cell = `Row ${rowIndex + 1}, Column ${columnIndex + 1}`;
      if (cell.dataset.aueResource && cell.dataset.aueType === 'container') {
        cell.dataset.aueFilter = 'column-native-v3';
        cell.dataset.aueLabel = cell.dataset.layoutV3Cell;
      }
    });
  });
}
