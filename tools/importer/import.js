/* global WebImporter */

const SOURCE_ORIGIN = 'https://www.onlyfng.com';
const CONTENT_SELECTORS = 'h1, h2, h3, h4, h5, h6, p, ul, ol, blockquote, table';

function createTable(name, rows, document) {
  return WebImporter.DOMUtils.createTable([[name], ...rows], document);
}

function getSourceURL(url, originalURL) {
  return new URL(originalURL || url || SOURCE_ORIGIN);
}

function normalizeHref(href, sourceURL) {
  if (!href) return '';
  try {
    const target = new URL(href, sourceURL);
    if (target.origin !== sourceURL.origin) return target.href;
    return `${target.pathname.replace(/\.html$/, '/')}${target.search}${target.hash}`;
  } catch (error) {
    return href;
  }
}

function copyImage(image, document, url, originalURL) {
  if (!image) return null;
  const copy = image.cloneNode(true);
  const src = copy.getAttribute('src') || image.closest('picture')?.querySelector('source[srcset]')?.getAttribute('srcset');
  if (!src) return copy;

  try {
    const proxyURL = new URL(url);
    const sourceURL = getSourceURL(url, originalURL);
    const imageURL = new URL(src, sourceURL);
    copy.src = imageURL.origin === sourceURL.origin
      ? new URL(`${imageURL.pathname}${imageURL.search}${imageURL.hash}`, proxyURL).href
      : imageURL.href;
  } catch (error) {
    copy.removeAttribute('src');
  }

  copy.removeAttribute('srcset');
  copy.removeAttribute('loading');
  copy.removeAttribute('class');
  return copy;
}

function copyLink(link, sourceURL) {
  const copy = link.cloneNode(true);
  const href = copy.getAttribute('href');
  if (href) copy.setAttribute('href', normalizeHref(href, sourceURL));
  copy.removeAttribute('class');
  copy.removeAttribute('style');
  return copy;
}

function copyContent(element, document, sourceURL) {
  const content = document.createElement('div');
  if (!element) return content;
  element.querySelectorAll(CONTENT_SELECTORS).forEach((node) => {
    if (node.closest('.cmp-form, .header, .footer, noindex, script, style')) return;
    if (node.parentElement?.closest(CONTENT_SELECTORS) && node.parentElement !== element) return;
    const copy = node.cloneNode(true);
    copy.querySelectorAll('a[href]').forEach((link) => link.replaceWith(copyLink(link, sourceURL)));
    copy.querySelectorAll('img').forEach((image) => image.replaceWith(copyImage(image, document, sourceURL, sourceURL)));
    copy.removeAttribute('class');
    copy.removeAttribute('style');
    if (copy.textContent.trim() || copy.querySelector('img, a')) content.append(copy);
  });
  return content;
}

function copyMedia(element, document, url, originalURL) {
  const sourceURL = getSourceURL(url, originalURL);
  const video = element?.querySelector('video');
  if (video) {
    const copy = video.cloneNode(true);
    copy.removeAttribute('class');
    copy.querySelectorAll('source[src]').forEach((source) => {
      source.src = normalizeHref(source.getAttribute('src'), sourceURL);
    });
    if (copy.poster) copy.poster = normalizeHref(copy.poster, sourceURL);
    return copy;
  }
  const image = element?.querySelector('img');
  return copyImage(image, document, url, originalURL);
}

function appendMetadata(main, document) {
  const metadata = WebImporter.Blocks.getMetadata(document);
  if (Object.keys(metadata).length) {
    main.append(WebImporter.Blocks.getMetadataBlock(document, metadata));
  }
}

function getMainContent(document) {
  return document.querySelector('body > .root > .aem-Grid > .responsivegrid')
    || document.querySelector('main')
    || document.body;
}

function createHero(component, document, url, originalURL) {
  const image = component.querySelector('.hero-banner__img--desktop img, .hero-banner__img img, picture img');
  const content = copyContent(component.querySelector('.hero-banner__content') || component, document, getSourceURL(url, originalURL));
  const alt = image?.getAttribute('alt')?.trim();
  const rows = [[copyImage(image, document, url, originalURL)]];
  if (alt) rows.push([alt]);
  rows.push([content]);
  return createTable('Hero (no-cta)', rows, document);
}

function createHeroCarousel(component, document, url, originalURL) {
  const sourceURL = getSourceURL(url, originalURL);
  const rows = [...component.querySelectorAll('.slides > li')].map((slide) => {
    const image = copyImage(slide.querySelector('picture img, img'), document, url, originalURL);
    const content = copyContent(
      slide.querySelector('.wrap-copy.hide-mobile article, .wrap-copy article, article'),
      document,
      sourceURL,
    );
    return [image, content];
  }).filter((row) => row.some(Boolean));
  return rows.length ? createTable('Hero Carousel', rows, document) : null;
}

function getTopLevelColumns(component) {
  const columns = [...component.querySelectorAll('.column-control > .bootstrap-container > .row > section')];
  return columns.filter((column) => !column.parentElement?.closest('section') || column.parentElement.closest('section') === component);
}

function createColumns(component, document, url, originalURL) {
  const sourceURL = getSourceURL(url, originalURL);
  const columns = getTopLevelColumns(component);
  if (columns.length < 2 || columns.length > 4) return null;
  const row = columns.map((column) => {
    const cell = copyContent(column, document, sourceURL);
    column.querySelectorAll('img').forEach((image) => cell.append(copyImage(image, document, url, originalURL)));
    return cell;
  });
  return row.some((cell) => cell.children.length) ? createTable('Columns', [row], document) : null;
}

function createCards(component, document, url, originalURL) {
  const sourceURL = getSourceURL(url, originalURL);
  const cards = [...component.querySelectorAll('.promo-carousel__feature-story, .content-card')];
  const rows = cards.map((card) => {
    const image = copyImage(card.querySelector('img'), document, url, originalURL);
    const content = copyContent(card.querySelector('.content-card--content') || card, document, sourceURL);
    const cta = card.querySelector('a.btn, a.button, a[href*=".pdf"]');
    const cells = [image, content];
    if (cta) cells.push(copyLink(cta, sourceURL));
    return cells;
  }).filter((cells) => cells.some((cell) => cell?.textContent?.trim() || cell?.getAttribute?.('src')));
  if (!rows.length) return null;
  const variant = component.querySelector('.content-card--icon') ? 'Cards (icon)' : 'Cards';
  return createTable(variant, rows, document);
}

function createProfileCards(component, document, url, originalURL) {
  const sourceURL = getSourceURL(url, originalURL);
  const profiles = [...component.querySelectorAll('img[alt*="Regional Energy Manager" i], img[alt*="Director" i]')]
    .map((image) => image.closest('.columnctrcomp, section, .contentcard') || image.parentElement);
  const rows = profiles.map((profile) => [
    copyImage(profile.querySelector('img'), document, url, originalURL),
    copyContent(profile, document, sourceURL),
  ]).filter((row) => row[0] && row[1].children.length);
  return rows.length ? createTable('Cards (profile)', rows, document) : null;
}

function createReportList(component, document, url, originalURL) {
  const sourceURL = getSourceURL(url, originalURL);
  const reports = [...component.querySelectorAll('a[href*="/market-reports/"][href$=".pdf"]')];
  const rows = reports.map((link) => {
    const container = link.closest('.content-card, .columnctrcomp, section') || link.parentElement;
    const content = copyContent(container, document, sourceURL);
    const date = document.createElement('p');
    const match = link.getAttribute('href').match(/(\d{2})[._-](\d{2})[._-](\d{4})/);
    date.textContent = match ? `${match[1]}/${match[2]}/${match[3]}` : '';
    return [date, content, copyLink(link, sourceURL)];
  });
  return rows.length ? createTable('Report List', rows, document) : null;
}

function getFormType(sourceURL) {
  if (sourceURL.pathname.includes('/paperless')) return 'paperless';
  if (sourceURL.pathname.includes('/market-reports')) return 'market-reports';
  return 'quote';
}

function createForm(component, document, sourceURL) {
  if (!component) return null;
  const type = getFormType(sourceURL);
  const content = document.createElement('div');
  const heading = component.closest('.columnctrcomp, main, body')?.querySelector('h1, h2');
  if (heading) content.append(heading.cloneNode(true));
  const intro = component.previousElementSibling?.querySelector?.('p');
  if (intro) content.append(intro.cloneNode(true));
  const submit = component.querySelector('button[type="submit"], input[type="submit"]');
  return createTable(`Form (${type})`, [[content, submit?.value || submit?.textContent?.trim() || 'Submit']], document);
}

function createMedia(component, document, url, originalURL) {
  const video = component.querySelector('video');
  if (!video) return null;
  const content = document.createElement('div');
  const heading = component.parentElement?.querySelector('h1, h2, h3');
  if (heading) content.append(heading.cloneNode(true));
  return createTable('Media', [[copyMedia(component, document, url, originalURL), content]], document);
}

function appendDefaultContent(main, page, document, sourceURL) {
  const containers = [...page.querySelectorAll('.cmp-text, .content-card--content')];
  const seen = new Set();
  containers.forEach((container) => {
    if (container.closest('.herobanner, .adaptive-hero-carousel, .promocarousel, .cmp-form')) return;
    const content = copyContent(container, document, sourceURL);
    const signature = content.textContent.trim();
    if (!signature || seen.has(signature)) return;
    seen.add(signature);
    main.append(content);
  });
}

function appendSourceComponents(main, page, document, url, originalURL) {
  const sourceURL = getSourceURL(url, originalURL);
  const carousel = page.querySelector('.adaptive-hero-carousel');
  const hero = page.querySelector('.herobanner');
  if (carousel) {
    const carouselBlock = createHeroCarousel(carousel, document, url, originalURL);
    if (carouselBlock) main.append(carouselBlock);
  } else if (hero) main.append(createHero(hero, document, url, originalURL));

  const form = page.querySelector('form.cmp-form, form#new_form');
  const reportList = sourceURL.pathname.includes('/market-reports/')
    ? createReportList(page, document, url, originalURL)
    : null;
  if (reportList) main.append(reportList);

  [...page.querySelectorAll('video')].forEach((video) => {
    const media = createMedia(video.parentElement, document, url, originalURL);
    if (media) main.append(media);
  });

  if (sourceURL.pathname.includes('/contact-us/')) {
    const profiles = createProfileCards(page, document, url, originalURL);
    if (profiles) main.append(profiles);
  }

  const topLevel = [...page.querySelectorAll('.columnctrcomp')]
    .filter((component) => !component.parentElement?.closest('.columnctrcomp'));
  topLevel.forEach((component) => {
    const columns = createColumns(component, document, url, originalURL);
    if (columns) main.append(columns);
  });

  const cards = createCards(page.querySelector('.promocarousel') || page, document, url, originalURL);
  if (cards && !sourceURL.pathname.includes('/market-reports/')) main.append(cards);
  if (form) main.append(createForm(form, document, sourceURL));

  appendDefaultContent(main, page, document, sourceURL);
  if (!main.children.length) main.append(copyContent(page, document, sourceURL));
}

export default {
  transformDOM: ({ document, url, params }) => {
    const main = document.createElement('main');
    const sourceURL = getSourceURL(url, params.originalURL);
    const page = getMainContent(document);
    appendSourceComponents(main, page, document, url, sourceURL.href);
    appendMetadata(main, document);
    return main;
  },

  generateDocumentPath: ({ url }) => {
    const pathname = new URL(url).pathname.replace(/\.html$/, '');
    const path = pathname.endsWith('/') ? `${pathname}index` : pathname;
    return WebImporter.FileUtils.sanitizePath(path);
  },
};
