function setSlideHeading(slide, index) {
  if (!index) return;
  const heading = slide.querySelector('h1');
  if (!heading) return;

  const replacement = document.createElement('h2');
  replacement.append(...heading.childNodes);
  heading.replaceWith(replacement);
}

function createButton(label, className) {
  const button = document.createElement('button');
  button.className = className;
  button.type = 'button';
  button.setAttribute('aria-label', label);
  button.textContent = label;
  return button;
}

/**
 * Decorates a manually controlled, non-autoplay hero carousel.
 * @param {Element} block The carousel block element
 */
export default function decorate(block) {
  const carouselId = block.id || `hero-carousel-${document.querySelectorAll('.hero-carousel').length}`;
  const slides = [...block.children].map((row, index) => {
    const cells = [...row.children];
    const slide = document.createElement('article');
    slide.className = 'hero-carousel-slide';
    slide.id = `${carouselId}-slide-${index + 1}`;
    slide.setAttribute('role', 'group');
    slide.setAttribute('aria-roledescription', 'slide');
    slide.setAttribute('aria-label', `${index + 1} of ${block.children.length}`);
    slide.hidden = index !== 0;

    const media = cells.shift();
    const content = cells.shift();
    if (media) {
      media.className = 'hero-carousel-media';
      slide.append(media);
    }
    if (content) {
      content.className = 'hero-carousel-content';
      setSlideHeading(content, index);
      slide.append(content);
    }
    return slide;
  });

  const viewport = document.createElement('div');
  viewport.className = 'hero-carousel-viewport';
  viewport.setAttribute('aria-live', 'polite');
  viewport.append(...slides);

  const controls = document.createElement('div');
  controls.className = 'hero-carousel-controls';
  const previous = createButton('Previous slide', 'hero-carousel-previous');
  const next = createButton('Next slide', 'hero-carousel-next');
  const indicators = document.createElement('div');
  indicators.className = 'hero-carousel-indicators';
  indicators.setAttribute('role', 'tablist');
  indicators.setAttribute('aria-label', 'Choose a slide');

  let activeIndex = 0;
  const selectSlide = (nextIndex) => {
    activeIndex = (nextIndex + slides.length) % slides.length;
    slides.forEach((slide, index) => {
      const active = index === activeIndex;
      slide.hidden = !active;
      slide.setAttribute('aria-hidden', String(!active));
      indicators.children[index].setAttribute('aria-selected', String(active));
      indicators.children[index].tabIndex = active ? 0 : -1;
    });
  };

  slides.forEach((slide, index) => {
    const indicator = document.createElement('button');
    indicator.className = 'hero-carousel-indicator';
    indicator.type = 'button';
    indicator.setAttribute('role', 'tab');
    indicator.setAttribute('aria-controls', slide.id);
    indicator.setAttribute('aria-label', `Show slide ${index + 1}`);
    indicator.textContent = String(index + 1);
    indicator.addEventListener('click', () => selectSlide(index));
    indicators.append(indicator);
  });

  previous.addEventListener('click', () => selectSlide(activeIndex - 1));
  next.addEventListener('click', () => selectSlide(activeIndex + 1));
  controls.append(previous, indicators, next);
  block.replaceChildren(viewport, controls);
  selectSlide(0);
}
