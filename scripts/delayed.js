import { getMetadata, loadCSS, loadScript } from './aem.js';

loadCSS('https://use.typekit.net/kvq0ono.css');

function loadGtm() {
  const container = getMetadata('gtm-container');
  if (!/^GTM-[A-Z0-9]+$/.test(container || '')) return;
  window.dataLayer = window.dataLayer || [];
  window.dataLayer.push({ 'gtm.start': new Date().getTime(), event: 'gtm.js' });
  loadScript(`https://www.googletagmanager.com/gtm.js?id=${container}`, { async: '' });
}

function loadFive9() {
  if (getMetadata('five9-enabled') !== 'true') return;
  loadScript('https://cdn.prod.us.five9.net/static/stable/chat/wrapper/index.js', { async: '' });
}

loadGtm();
loadFive9();
