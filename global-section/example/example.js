// Simulates the standard EDS decoration contract; not a replacement for aem.js.
import { decorateGlobalSection } from '../index.js';
import { attachGlobalSectionUpdates } from '../editor.js';
import title from '../blocks/global-title/global-title.js';
import text from '../blocks/global-text/global-text.js';
import image from '../blocks/global-image/global-image.js';
import teaser from '../blocks/teaser/teaser.js';

const decorators = {
  'global-title': title, 'global-text': text, 'global-image': image, teaser,
};
const camelCase = (value) => value.replace(/-([a-z])/g, (_, letter) => letter.toUpperCase());
export function decorateBlock(block) {
  block.classList.add('block');
  [block.dataset.blockName] = block.classList;
  block.dataset.blockStatus = 'initialized';
}
export function decorateMain(main) {
  [...main.children].forEach((section, i) => {
    section.classList.add('section');
    section.dataset.aueResource ||= `urn:global-section:${section.id || i}`;
    section.dataset.aueModel ||= 'global-section';
    const metadata = section.querySelector(':scope > .section-metadata');
    [...metadata?.children || []].forEach((row) => {
      const key = row.children[0].textContent.trim().toLowerCase().replaceAll(' ', '-');
      section.dataset[camelCase(key)] = row.children[1].textContent.trim();
    });
    metadata?.remove();
    [...section.children].forEach((child, index) => {
      const wrapper = document.createElement('div');
      child.replaceWith(wrapper);
      wrapper.append(child);
      if (decorators[child.classList[0]]) {
        child.dataset.aueResource ||= `${section.dataset.aueResource}/block-${index}`;
        decorateBlock(child);
      } else wrapper.className = 'default-content-wrapper';
    });
  });
  decorateGlobalSection(main);
}
export async function loadBlock(block) {
  if (block.dataset.blockStatus === 'loaded') return;
  decorators[block.dataset.blockName]?.(block);
  block.dataset.blockStatus = 'loaded';
}
export async function loadSection(section) {
  await Promise.all([...section.querySelectorAll('.block')].map(loadBlock));
  section.dataset.sectionStatus = 'loaded';
}
export async function loadSections(main) {
  await Promise.all([...main.querySelectorAll('.section')].map(loadSection));
}

const content = await (await fetch(new URL('./content.html', import.meta.url))).text();
const parsed = new DOMParser().parseFromString(content, 'text/html');
const main = document.querySelector('main');
main.replaceChildren(...parsed.body.children);
decorateMain(main);
await loadSections(main);
attachGlobalSectionUpdates({
  decorateMain,
  decorateBlock,
  loadBlock,
  loadSection,
  loadSections,
  decorateIcons: () => {},
  decorateButtons: () => {},
});
document.querySelectorAll('[data-mode]').forEach((button) => button.addEventListener('click', () => {
  document.dispatchEvent(new CustomEvent(`aue:ui-${button.dataset.mode}`));
}));
document.body.dataset.ready = 'true';
