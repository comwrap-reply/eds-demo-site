import { moveInstrumentation } from '../../scripts/scripts.js';

const headingSelector = 'h1, h2, h3, h4, h5, h6';

/**
 * Decorates a reusable title block.
 * @param {Element} block The Global Title block element.
 */
export default function decorate(block) {
  const existingHeading = block.querySelector(headingSelector);
  if (existingHeading) {
    existingHeading.classList.add('global-title-heading');
    return;
  }

  const source = [...block.children].find((child) => child.textContent.trim());
  const title = source?.textContent.trim();
  if (!title) return;

  const heading = document.createElement('h2');
  heading.className = 'global-title-heading';
  heading.textContent = title;
  moveInstrumentation(source, heading);
  block.replaceChildren(heading);
}
