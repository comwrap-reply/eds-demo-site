const layoutColumns = {
  'two-column': 2,
  'three-column': 3,
  'four-column': 4,
};

function getLayoutClass(section) {
  return Object.keys(layoutColumns).find((className) => section.classList.contains(className));
}

function isColumnBreak(wrapper) {
  return wrapper.firstElementChild?.classList.contains('column-break');
}

function groupSectionChildren(children) {
  const groups = [[]];
  children.forEach((child) => {
    if (isColumnBreak(child)) groups.push([]);
    else groups[groups.length - 1].push(child);
  });
  return groups;
}

function buildLayout(groups) {
  const layout = document.createElement('div');
  layout.className = 'multi-column-layout';

  groups.forEach((group, index) => {
    const column = document.createElement('div');
    column.className = 'layout-column';
    column.dataset.column = String(index + 1);
    group.forEach((child) => column.append(child));
    layout.append(column);
  });

  return layout;
}

/**
 * Groups direct section children into independently flowing columns.
 * @param {Element} main the main element
 */
export default function decorateMultiColumnSections(main) {
  main.querySelectorAll(':scope > div.section').forEach((section) => {
    const layoutClass = getLayoutClass(section);
    if (!layoutClass || section.dataset.multiColumnStatus) return;

    const children = [...section.children];
    const breakCount = children.filter(isColumnBreak).length;
    const expectedBreakCount = layoutColumns[layoutClass] - 1;

    if (breakCount !== expectedBreakCount) {
      // eslint-disable-next-line no-console
      console.warn(
        `Skipped ${layoutClass} section: expected ${expectedBreakCount} Column Break(s), found ${breakCount}.`,
      );
      section.dataset.multiColumnStatus = 'invalid';
      return;
    }

    const groups = groupSectionChildren(children);
    section.replaceChildren(buildLayout(groups));
    section.dataset.multiColumnStatus = 'loaded';
  });
}
