/**
 * Read escaped source without losing line breaks used by JavaScript comments.
 * @param {Element} cell The authored text cell.
 * @returns {string} The original snippet.
 */
function readSource(cell) {
  if (!cell) return '';
  const source = cell.cloneNode(true);
  source.querySelectorAll('br').forEach((br) => br.replaceWith('\n'));
  source.querySelectorAll('p').forEach((p) => p.append('\n'));
  return source.textContent;
}

/**
 * Recreate an inert script so the browser executes it, retaining authored attributes.
 * @param {HTMLScriptElement} original The script parsed from the snippet.
 * @returns {Promise} Resolves when the next script may start.
 */
function activateScript(original) {
  if (!original.isConnected) return Promise.resolve();
  const script = document.createElement('script');
  [...original.attributes].forEach(({ name, value }) => script.setAttribute(name, value));
  script.textContent = original.textContent;

  const type = script.type.trim().toLowerCase();
  const classic = !type || /^(text|application)\/(javascript|ecmascript)$/.test(type);
  const wait = classic && !script.noModule
    && !script.hasAttribute('async') && script.hasAttribute('src');
  if (classic && !script.hasAttribute('async')) script.async = false;

  return new Promise((resolve) => {
    if (wait) {
      script.addEventListener('load', resolve, { once: true });
      script.addEventListener('error', resolve, { once: true });
    }
    original.replaceWith(script);
    if (!wait) resolve();
  });
}

/**
 * Render author-provided HTML, styles, and scripts, matching the legacy Freeform component.
 * @param {Element} block The Freeform block.
 */
export default function decorate(block) {
  const source = readSource(block.querySelector(':scope > div > div'));
  const template = document.createElement('template');
  // Intentional HTML execution: Freeform is an author-controlled code component.
  template.innerHTML = source;
  const scripts = [...template.content.querySelectorAll('script')];
  block.replaceChildren(template.content);

  // Keep dependency order without delaying section loading on third-party requests.
  scripts.reduce(
    (previous, script) => previous.then(() => activateScript(script)),
    Promise.resolve(),
  );
}
