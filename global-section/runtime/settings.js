/* Layouts: pure settings and grouping shared by rendering and tests. */

export const GAP_VALUES = {
  none: 0, small: 12, medium: 24, large: 48,
};
export const WIDTH_VALUES = {
  25: 1 / 4, third: 1 / 3, 50: 1 / 2, 'two-thirds': 2 / 3, 75: 3 / 4, 100: 1,
};

export function sectionSettings(data = {}) {
  return {
    enabled: data.layout === 'global-section-columns',
    count: /^[1-4]$/.test(data.columnCount) ? Number(data.columnCount) : 2,
    gap: Object.hasOwn(GAP_VALUES, data.columnGap) ? GAP_VALUES[data.columnGap] : 24,
  };
}

function option(classes, name, choices, fallback) {
  const prefix = `layout-${name}-`;
  const values = [...classes].filter((value) => value.startsWith(prefix))
    .map((value) => value.slice(prefix.length));
  return values.length === 1 && choices.includes(values[0]) ? values[0] : fallback;
}

export function blockPlacement(classes = []) {
  return {
    column: Number(option(classes, 'column', ['1', '2', '3', '4'], '1')),
    width: WIDTH_VALUES[option(classes, 'width', Object.keys(WIDTH_VALUES), '100')],
    align: option(classes, 'align', ['start', 'center', 'end'], 'start'),
    row: option(classes, 'row', ['own', 'share'], 'own'),
  };
}

export function groupRows(items) {
  return items.reduce((rows, item) => {
    const previous = rows[rows.length - 1];
    if (item.row === 'share' && previous?.row === 'share' && previous.align === item.align) {
      previous.items.push(item);
    } else {
      rows.push({ row: item.row, align: item.align, items: [item] });
    }
    return rows;
  }, []);
}

export function assignColumns(items, count) {
  const columns = Array.from({ length: count }, () => []);
  items.forEach((item) => columns[Math.min(item.column, count) - 1].push(item));
  return columns;
}
