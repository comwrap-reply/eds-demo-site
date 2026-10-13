import { decodeSource, encodeSource, readSource } from '../../blocks/freeform/source.js';
import decorate from '../../blocks/freeform/freeform.js';

const html = await (await fetch('/test/freeform/fixtures/aem-v1.plain.html')).text();
const expected = (await (await fetch('/test/freeform/fixtures/services.html')).text()).trimEnd();
const parsed = new DOMParser().parseFromString(html, 'text/html');
const original = parsed.querySelector('.freeform');
const cell = original.querySelector(':scope > div > div');
const results = document.querySelector('#results');
const check = (name, assertion) => {
  const result = document.createElement('li');
  try {
    if (!assertion()) throw new Error(name);
    result.textContent = `PASS: ${name}`;
  } catch (error) {
    result.textContent = `FAIL: ${name} — ${error.message}`;
  }
  results.append(result);
};

check('fixture includes the AEM-expanded v1 icon', () => !!cell.querySelector('.icon-v1'));
check('existing saved HTML is recovered exactly', () => decodeSource(readSource(cell)) === expected);
check('reading does not mutate delivered markup', () => !!cell.querySelector('.icon-v1'));
const decorated = cell.cloneNode(true);
decorated.querySelector('.icon-v1').append(document.createElement('img'));
check('recovery also works after global icon decoration', () => decodeSource(readSource(decorated)) === expected);

const block = original.cloneNode(true);
document.querySelector('main').append(block);
decorate(block);
check('the refreshed block renders wrappers, IDs, ARIA, and styles', () => {
  const card = block.querySelector('[role="region"]');
  return card?.getAttribute('aria-labelledby') === 'services-heading'
    && card.querySelector('h2').id === 'services-heading'
    && card.style.padding === '20px'
    && card.querySelector('a').getAttribute('aria-label') === 'Learn more about our services';
});

const v2 = document.createElement('div');
v2.textContent = encodeSource(expected);
check('new saves survive delivery as plain text', () => decodeSource(readSource(v2)) === expected);
const empty = document.createElement('div');
empty.innerHTML = '<p>freeform<span class="icon icon-v1"></span></p>';
check('empty existing saves decode correctly', () => decodeSource(readSource(empty)) === '');
check('unmarked plain text is not mistaken for an encoded payload', () => decodeSource('freeformPGRpdj4=') === 'freeformPGRpdj4=');
