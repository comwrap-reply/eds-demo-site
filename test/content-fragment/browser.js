import decorate, { getQueryURL } from '../../blocks/content-fragment/content-fragment.js';

const path = '/content/dam/eds-demo-site/content-fragments/energy-solutions';
const fixtures = {
  master: {
    heading: 'Energy for every day', body: { plaintext: 'Explore natural gas solutions for your home and business. This is the master content for the reusable Energy Solutions fragment.' }, link: '/contact-us/', linkText: 'Contact our team',
  },
  residential: {
    heading: 'Comfort starts at home', body: { plaintext: 'Bring dependable natural gas to everyday life, from cooking family meals to keeping your home comfortable. This is the residential variation.' }, link: '/residential/', linkText: 'Explore residential solutions',
  },
  commercial: {
    heading: 'Energy that works for your business', body: { plaintext: 'Support your business with natural gas solutions built around your operations. This is the commercial variation.' }, link: '/commercial/', linkText: 'Explore commercial solutions',
  },
};
const originalFetch = window.fetch;
let mode = 'success';
window.fetch = async (url, options) => {
  if (!String(url).includes('/graphql/execute.json/eds-demo-site/content-card-by-path;')) {
    return originalFetch(url, options);
  }
  if (mode === 'error') return new Response('', { status: 503 });
  const variation = decodeURIComponent(String(url).split(';variation=')[1]);
  const item = mode === 'empty' ? null : {
    ...(fixtures[variation] || fixtures.master),
    _variation: fixtures[variation] ? variation : 'master',
  };
  if (mode === 'unsafe') {
    item.heading = '<img src=x onerror=alert(1)>';
    // Deliberately malicious fixture verifies URL sanitization.
    // eslint-disable-next-line no-script-url
    item.link = 'javascript:alert(1)';
    item.body = { plaintext: '<script>alert(1)</script>' };
  }
  if (mode === 'optional') {
    delete item.body;
    delete item.link;
    delete item.linkText;
  }
  return Response.json({ data: { edsContentCardByPath: { item } } });
};

function makeBlock(variation = 'master', reference = path, author = false) {
  const block = document.createElement('div');
  block.className = 'content-fragment';
  if (author) block.setAttribute('data-aue-resource', 'urn:aemconnection:/test/block');
  [reference, variation].forEach((value) => {
    const row = document.createElement('div');
    const cell = document.createElement('div');
    cell.textContent = value;
    row.append(cell);
    block.append(row);
  });
  return block;
}

function assert(condition, message) {
  const result = document.createElement('li');
  result.textContent = `${condition ? 'PASS' : 'FAIL'}: ${message}`;
  document.querySelector('#results').append(result);
  if (!condition) throw new Error(message);
}

async function renderDemo() {
  const block = makeBlock(document.querySelector('#variation').value);
  document.querySelector('#demo').replaceChildren(block);
  await decorate(block);
}

document.querySelector('#variation').addEventListener('change', renderDemo);

async function run() {
  const cases = document.querySelector('#cases');
  await Object.keys(fixtures).reduce(async (previous, variation) => {
    await previous;
    const block = makeBlock(variation);
    cases.append(block);
    await decorate(block);
    assert(block.querySelector('h2')?.textContent === fixtures[variation].heading, `${variation} renders its own heading`);
    assert(block.querySelector('a')?.pathname === fixtures[variation].link, `${variation} renders its own CTA`);
    assert(block.dataset.fragmentVariation === variation, `${variation} records the delivered variation`);
  }, Promise.resolve());

  const blank = makeBlock('', '', true);
  await decorate(blank);
  assert(blank.textContent === 'Select a content fragment.', 'empty author reference has a placeholder');
  assert(blank.hasAttribute('data-aue-resource'), 'Universal Editor block instrumentation is preserved');
  const master = makeBlock('');
  await decorate(master);
  assert(master.dataset.fragmentVariation === 'master', 'empty variation defaults to master');
  const missing = makeBlock('removed-variation');
  await decorate(missing);
  assert(missing.dataset.fragmentVariation === 'master', 'GraphQL master fallback is represented accurately');

  mode = 'unsafe';
  const unsafe = makeBlock();
  await decorate(unsafe);
  assert(!unsafe.querySelector('img, script, a') && unsafe.textContent.includes('<script>'), 'content remains text and executable links are omitted');
  mode = 'optional';
  const optional = makeBlock();
  await decorate(optional);
  assert(optional.querySelector('h2') && !optional.querySelector('p, a'), 'missing optional fields do not create empty elements');
  mode = 'empty';
  const empty = makeBlock();
  await decorate(empty);
  assert(empty.textContent === 'This content is currently unavailable.', 'missing or wrong-model fragments have a graceful state');
  mode = 'error';
  const error = makeBlock();
  await decorate(error);
  assert(error.textContent === 'This content is currently unavailable.' && !error.hasAttribute('aria-busy'), 'request failures clear loading state');
  assert(getQueryURL({ path: `${path};other=value`, variation: 'campaign & sale' }).includes('%3Bother%3Dvalue;variation=campaign%20%26%20sale'), 'query variables cannot inject additional parameters');
  mode = 'success';
  cases.remove();
  await renderDemo();
  document.body.dataset.testStatus = 'passed';
}

run().catch((error) => {
  document.body.dataset.testStatus = 'failed';
  // eslint-disable-next-line no-console
  console.error(error);
});
