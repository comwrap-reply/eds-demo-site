import decorate from '../../blocks/freeform/freeform.js';

const block = document.querySelector('.block');
const response = await fetch('/content/demo/freeform/jcr:content/root/section/freeform.json');
const { text } = await response.json();
block.querySelector(':scope > div > div').textContent = text;
decorate(block);
document.querySelector('#deny-next-save').addEventListener('click', async () => {
  await fetch('/test/deny-next-save', { method: 'POST' });
  document.querySelector('#test-status').textContent = 'The next save will return HTTP 403.';
});
