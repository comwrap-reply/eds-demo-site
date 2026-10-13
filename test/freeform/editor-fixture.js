import decorate from '../../blocks/freeform/freeform.js';

const block = document.querySelector('.block');
const response = await fetch('/content/demo/freeform/jcr:content/root/section/freeform.json');
const { text } = await response.json();
const cell = block.querySelector(':scope > div > div');
if (text.startsWith('freeform:v1:')) {
  // Reproduce the AEM transformation that a raw JSON-only fixture used to miss.
  const icon = document.createElement('span');
  icon.className = 'icon icon-v1';
  cell.replaceChildren('freeform', icon, text.slice('freeform:v1:'.length));
} else {
  cell.textContent = text;
}
decorate(block);
document.querySelector('#deny-next-save').addEventListener('click', async () => {
  await fetch('/test/deny-next-save', { method: 'POST' });
  document.querySelector('#test-status').textContent = 'The next save will return HTTP 403.';
});
