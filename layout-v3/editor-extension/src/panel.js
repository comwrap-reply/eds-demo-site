/* Layouts - V3: accessible, collapsible column groups in a separate editor rail. */
import { COMPONENTS, LABELS, createController } from './controller.js';

export default async function mountPanel(root, host) {
  const controller = createController(host);
  const collapsed = new Set();
  let busy = false;
  const node = (tag, text) => {
    const element = document.createElement(tag);
    if (text) element.textContent = text;
    return element;
  };
  const status = node('p');
  status.setAttribute('role', 'status');
  const content = node('div');
  const refresh = node('button', 'Refresh columns');
  refresh.type = 'button';
  root.replaceChildren(node('h1', 'Layouts - V3'), node('p', 'Custom sections only. Native Columns use the built-in content tree. Changes are saved to AEM.'), refresh, status, content);
  const run = async (operation) => {
    if (busy) return;
    busy = true;
    root.querySelectorAll('button, select').forEach((element) => { element.disabled = true; });
    status.textContent = 'Working…';
    let message = '';
    try { await operation(); } catch (error) { message = error.message; }
    try {
      // eslint-disable-next-line no-use-before-define
      await render();
      status.textContent = message || 'Up to date.';
    } catch (error) { status.textContent = message || error.message; }
    busy = false;
    root.querySelectorAll('button, select').forEach((element) => { element.disabled = false; });
  };
  const button = (text, action) => {
    const element = node('button', text);
    element.type = 'button';
    element.addEventListener('click', () => run(action));
    return element;
  };
  const render = async () => {
    const { groups } = await controller.read();
    const fragment = document.createDocumentFragment();
    if (!groups.length) fragment.append(node('p', 'Add a Custom Section - V3 and enable Columns to get started.'));
    groups.forEach(({ editable, count, items }) => {
      const section = node('section');
      section.append(node('h2', editable.label || 'Custom Section - V3'));
      for (let column = 1; column <= count; column += 1) {
        const key = `${editable.resource}#${column}`;
        const details = node('details');
        details.open = !collapsed.has(key);
        details.addEventListener('toggle', () => {
          if (details.open) collapsed.delete(key); else collapsed.add(key);
        });
        const children = items.filter((item) => Math.min(item.column, count) === column);
        details.append(node('summary', `Column ${column} (${children.length})`));
        children.forEach((item) => {
          const row = node('div');
          row.className = 'layout-v3-panel-item';
          const label = item.editable.label || LABELS[COMPONENTS.indexOf(item.editable.model)];
          row.append(button(label, () => controller.select(item.editable)));
          const select = node('select');
          select.setAttribute('aria-label', `Assigned column for ${label}`);
          for (let number = 1; number <= count; number += 1) {
            const option = node('option', `Column ${number}`);
            option.value = number;
            select.append(option);
          }
          select.value = Math.min(item.column, count);
          row.append(select, button('Reassign', () => controller.reassign(editable.resource, item.editable.resource, Number(select.value))));
          if (item.column > count) row.append(node('p', `Saved for column ${item.column}; shown in the last available column.`));
          details.append(row);
        });
        if (!children.length) details.append(node('p', 'Empty column — add a component below.'));
        const picker = node('select');
        picker.setAttribute('aria-label', `Component for column ${column}`);
        COMPONENTS.forEach((id, i) => {
          const option = node('option', LABELS[i]);
          option.value = id;
          picker.append(option);
        });
        details.append(picker, button(`Add to column ${column}`, () => controller.add(editable.resource, column, picker.value)));
        section.append(details);
      }
      fragment.append(section);
    });
    content.replaceChildren(fragment);
  };
  refresh.addEventListener('click', () => run(async () => {}));
  await run(async () => {});
  return controller;
}
