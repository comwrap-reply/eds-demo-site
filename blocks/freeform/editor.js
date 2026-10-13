import { decodeSource } from './source.js';
import { authorTarget, loadSource, saveSource } from './store.js';

const editors = new Map();
let observer;

function element(tag, className, text) {
  const result = document.createElement(tag);
  if (className) result.className = className;
  if (text) result.textContent = text;
  return result;
}

function openEditor(block, target, render, trigger, notice) {
  const dialog = element('dialog', 'freeform freeform-editor');
  const form = element('form');
  const title = element('h2', '', 'Edit HTML');
  title.id = 'freeform-editor-title';
  dialog.setAttribute('aria-labelledby', title.id);
  const help = element('p', '', 'Paste your HTML, including attributes and styles. Save to update this block.');
  help.id = 'freeform-editor-help';
  const label = element('label', '', 'HTML source');
  const input = element('textarea');
  input.id = 'freeform-editor-source';
  input.spellcheck = false;
  input.autocapitalize = 'off';
  input.setAttribute('aria-describedby', help.id);
  label.htmlFor = input.id;
  const status = element('p', 'freeform-editor-status', 'Loading saved HTML…');
  status.setAttribute('role', 'status');
  const actions = element('div', 'freeform-editor-actions');
  const cancel = element('button', '', 'Cancel');
  cancel.type = 'button';
  const save = element('button', '', 'Save');
  save.type = 'submit';
  save.disabled = true;
  input.disabled = true;
  actions.append(cancel, save);
  form.append(title, help, label, input, status, actions);
  dialog.append(form);
  document.body.append(dialog);

  let previous;
  let saving = false;
  const onUnload = (event) => {
    if (saving || (previous !== undefined && input.value !== decodeSource(previous))) {
      event.preventDefault();
      event.returnValue = '';
    }
  };
  window.addEventListener('beforeunload', onUnload);
  cancel.addEventListener('click', () => dialog.close());
  dialog.addEventListener('cancel', (event) => { if (saving) event.preventDefault(); });
  dialog.addEventListener('close', () => {
    window.removeEventListener('beforeunload', onUnload);
    dialog.remove();
    trigger.disabled = false;
    trigger.focus();
  });
  form.addEventListener('submit', async (event) => {
    event.preventDefault();
    if (saving || previous === undefined) return;
    if (!block.isConnected) {
      status.textContent = 'This block was moved or removed. Copy your HTML, then reload the page.';
      return;
    }
    saving = true;
    save.disabled = true;
    cancel.disabled = true;
    input.readOnly = true;
    status.textContent = 'Saving…';
    try {
      previous = await saveSource(target, input.value, previous);
      render(input.value);
      notice.textContent = 'HTML saved.';
      dialog.close();
    } catch (error) {
      status.textContent = error.message || 'Could not save. Your HTML is still here; try again.';
    } finally {
      saving = false;
      save.disabled = false;
      cancel.disabled = false;
      input.readOnly = false;
    }
  });
  trigger.disabled = true;
  dialog.showModal();
  loadSource(target).then((stored) => {
    if (!dialog.isConnected) return;
    input.value = decodeSource(stored);
    previous = stored;
    input.disabled = false;
    save.disabled = false;
    status.textContent = '';
    input.focus();
    input.setSelectionRange(0, 0);
    input.scrollTop = 0;
  }).catch((error) => {
    status.textContent = error.message || 'Could not load the saved HTML. Close and try again.';
  });
}

/** Author-only controls are siblings so authored scripts see only their own markup. */
export default function attachEditor(block, render) {
  if (!block.isConnected || editors.has(block)) return;
  const resource = block.dataset.aueResource;
  const name = resource?.split(':')[1];
  const meta = [...document.querySelectorAll('meta[name]')]
    .find((item) => item.name === `urn:adobe:aue:system:${name}`);
  const target = authorTarget(resource, meta?.content, window.location.origin);
  if (!target) return;

  const toolbar = element('div', 'freeform freeform-editor-tools');
  const trigger = element('button', '', 'Edit HTML');
  trigger.type = 'button';
  const hint = element('span', 'freeform-editor-hint', 'In Universal Editor, switch to Preview to use Edit HTML.');
  const notice = element('span', 'freeform-editor-status');
  notice.setAttribute('role', 'status');
  toolbar.append(trigger, hint, notice);
  block.before(toolbar);
  trigger.addEventListener('click', () => openEditor(block, target, render, trigger, notice));
  editors.set(block, toolbar);
  if (!observer) {
    observer = new MutationObserver(() => {
      editors.forEach((tools, owner) => {
        if (!owner.isConnected) {
          tools.remove();
          editors.delete(owner);
        } else if (tools.nextElementSibling !== owner) {
          owner.before(tools);
        }
      });
    });
    observer.observe(document.body, { childList: true, subtree: true });
  }
}
