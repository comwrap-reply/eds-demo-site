import { getMetadata } from '../../scripts/aem.js';

function getSearchEntries(payload) {
  return payload?.data || payload?.items || [];
}

function getResultPath(entry) {
  return entry.path || entry.url || entry.href || '';
}

function matchesQuery(entry, query) {
  const searchable = [entry.title, entry.description, entry.path]
    .filter(Boolean)
    .join(' ')
    .toLowerCase();
  return searchable.includes(query);
}

function createResult(entry) {
  const item = document.createElement('li');
  const title = document.createElement('h2');
  const link = document.createElement('a');
  link.href = getResultPath(entry);
  link.textContent = entry.title || getResultPath(entry);
  title.append(link);
  item.append(title);
  if (entry.description) {
    const description = document.createElement('p');
    description.textContent = entry.description;
    item.append(description);
  }
  return item;
}

/**
 * Decorates a client-side search page using the EDS query index.
 * @param {Element} block The search results block element
 */
export default async function decorate(block) {
  const indexPath = getMetadata('search-index') || '/query-index.json';
  const title = block.querySelector('h1') || document.createElement('h1');
  if (!title.textContent) title.textContent = 'Search results';
  const form = document.createElement('form');
  form.className = 'search-results-form';
  form.action = '/search-results/';
  const label = document.createElement('label');
  label.htmlFor = 'search-results-query';
  label.textContent = 'Search this site';
  const input = document.createElement('input');
  input.id = 'search-results-query';
  input.name = 'q';
  input.type = 'search';
  input.autocomplete = 'off';
  const submit = document.createElement('button');
  submit.type = 'submit';
  submit.textContent = 'Search';
  form.append(label, input, submit);

  const status = document.createElement('p');
  status.className = 'search-results-status';
  status.setAttribute('role', 'status');
  const results = document.createElement('ol');
  results.className = 'search-results-list';
  block.replaceChildren(title, form, status, results);

  const search = async (query) => {
    results.replaceChildren();
    if (!query) {
      status.textContent = 'Enter a search term to find a page.';
      return;
    }
    status.textContent = 'Searching…';
    try {
      const response = await fetch(indexPath);
      if (!response.ok) throw new Error('Search index is unavailable.');
      const entries = getSearchEntries(await response.json());
      const matches = entries
        .filter((entry) => !String(entry.robots || '').includes('noindex'))
        .filter((entry) => matchesQuery(entry, query.toLowerCase()));
      results.append(...matches.map(createResult));
      status.textContent = matches.length ? `${matches.length} result${matches.length === 1 ? '' : 's'} found.` : 'No matching pages found.';
    } catch (error) {
      status.textContent = error.message;
    }
  };

  const initialQuery = new URLSearchParams(window.location.search).get('q')?.trim() || '';
  input.value = initialQuery;
  form.addEventListener('submit', (event) => {
    event.preventDefault();
    const query = input.value.trim();
    const url = new URL(window.location);
    if (query) url.searchParams.set('q', query);
    else url.searchParams.delete('q');
    window.history.replaceState({}, '', url);
    search(query);
  });
  search(initialQuery);
}
