import { getConfig, getMetadata } from '../../scripts/ak.js';
import { loadFragment } from '../fragment/fragment.js';
import { setColorScheme } from '../section-metadata/section-metadata.js';

const { locale } = getConfig();

const HEADER_PATH = '/fragments/nav/header';
const HEADER_ACTIONS = [
  '/tools/widgets/scheme',
  '/tools/widgets/language',
  '/tools/widgets/toggle',
];

function closeAllMenus() {
  const openMenus = document.body.querySelectorAll('header .is-open');
  for (const openMenu of openMenus) {
    openMenu.classList.remove('is-open');
  }
}

function docClose(e) {
  if (e.target.closest('header')) return;
  closeAllMenus();
}

function toggleMenu(menu) {
  const isOpen = menu.classList.contains('is-open');
  closeAllMenus();
  if (isOpen) {
    document.removeEventListener('click', docClose);
    return;
  }

  // Setup the global close event
  document.addEventListener('click', docClose);
  menu.classList.add('is-open');
}

function decorateLanguage(btn) {
  const section = btn.closest('.section');
  btn.addEventListener('click', async () => {
    let menu = section.querySelector('.language.menu');
    if (!menu) {
      const content = document.createElement('div');
      content.classList.add('block-content');
      const fragment = await loadFragment(
        `${locale.prefix}${HEADER_PATH}/languages`,
      );
      menu = document.createElement('div');
      menu.className = 'language menu';
      menu.append(fragment);
      content.append(menu);
      section.append(content);
    }
    toggleMenu(section);
  });
}

function decorateScheme(btn) {
  btn.addEventListener('click', async () => {
    const { body } = document;

    let currPref = localStorage.getItem('color-scheme');
    if (!currPref) {
      currPref = matchMedia('(prefers-color-scheme: dark)').matches
        ? 'dark-scheme'
        : 'light-scheme';
    }

    const theme = currPref === 'dark-scheme'
      ? { add: 'light-scheme', remove: 'dark-scheme' }
      : { add: 'dark-scheme', remove: 'light-scheme' };

    body.classList.remove(theme.remove);
    body.classList.add(theme.add);
    localStorage.setItem('color-scheme', theme.add);
    // Re-calculatie section schemes
    const sections = document.querySelectorAll('.section');
    for (const section of sections) {
      setColorScheme(section);
    }
  });
}

function decorateNavToggle(btn) {
  btn.addEventListener('click', () => {
    const header = document.body.querySelector('header');
    if (header) header.classList.toggle('is-mobile-open');
  });
}

async function decorateAction(header, pattern) {
  const link = header.querySelector(`[href*="${pattern}"]`);
  if (!link) return;

  const icon = link.querySelector('.icon');
  const text = link.textContent;
  const btn = document.createElement('button');
  if (icon) btn.append(icon);
  if (text) {
    const textSpan = document.createElement('span');
    textSpan.className = 'text';
    textSpan.textContent = text;
    btn.append(textSpan);
  }
  const wrapper = document.createElement('div');
  wrapper.className = `action-wrapper ${icon.classList[1].replace(
    'icon-',
    '',
  )}`;
  wrapper.append(btn);
  link.parentElement.parentElement.replaceChild(wrapper, link.parentElement);

  if (pattern === '/tools/widgets/language') decorateLanguage(btn);
  if (pattern === '/tools/widgets/scheme') decorateScheme(btn);
  if (pattern === '/tools/widgets/toggle') decorateNavToggle(btn);
}

// eslint-disable-next-line no-unused-vars
function decorateMenu(li) {
  return null;
}

// Removed unused decorateMegaMenu function

// Removed unused decorateNavItem function

function decorateBrandSection(section) {
  section.classList.add('brand-section');
  const brandLink = section.querySelector('a');
  if (brandLink && brandLink.childNodes.length > 1) {
    const [, text] = brandLink.childNodes;
    const span = document.createElement('span');
    span.className = 'brand-text';
    span.append(text);
    brandLink.append(span);
  }
}

function decorateNavSection(section) {
  section.classList.add('main-nav-section');
  const navContent = section.querySelector('.default-content');
  
  if (!navContent) return;

  // Create navigation structure
  const navLinks = document.createElement('div');
  navLinks.className = 'nav-links';

  const actionLinks = document.createElement('div');
  actionLinks.className = 'action-links';

  // Get navigation links from the brand section (which has the main nav)
  const header = section.closest('header');
  const brandSection = header ? header.querySelector('.brand-section') : null;

  // Move navigation links from brand section to nav section
  if (brandSection) {
    const brandLinks = brandSection.querySelectorAll('a');
    brandLinks.forEach((link) => {
      if (link.href.includes('vending') || link.href.includes('get-started')
          || link.href.includes('financing') || link.href.includes('why-vending')
          || link.href.includes('support') || link.href.includes('resources')
          || link.href.includes('about')) {
        navLinks.appendChild(link);
      }
    });
  }

  // Move existing action links from this section
  const links = navContent.querySelectorAll('a');
  links.forEach((link) => {
    if (link.href.includes('search') || link.href.includes('contact')) {
      actionLinks.appendChild(link);
    }
  });

  // Clear existing content and add new structure
  navContent.innerHTML = '';
  navContent.appendChild(navLinks);
  navContent.appendChild(actionLinks);
}

async function decorateActionSection(section) {
  section.classList.add('actions-section');

  // Style Contact Us button
  const contactLinks = section.querySelectorAll('a');
  contactLinks.forEach((link) => {
    if (link.textContent.toLowerCase().includes('contact')) {
      link.classList.add('contact-btn');
    }
  });
}

function decorateBrandsSection(section) {
  section.classList.add('brands-section');
  // Keep the existing "Author Kit" content but style it
  const link = section.querySelector('a');
  if (link) {
    link.style.color = '#ff6600';
  }
}

async function decorateHeader(fragment) {
  const sections = fragment.querySelectorAll(':scope > .section');

  // Process brands section first (if it exists)
  if (sections[0] && sections[0].querySelector('a[href*="Author"]')) {
    decorateBrandsSection(sections[0]);
    if (sections[1]) decorateBrandSection(sections[1]);
    if (sections[2]) decorateNavSection(sections[2]);
    if (sections[3]) decorateActionSection(sections[3]);
  } else {
    // Original structure: brand, nav, actions
    if (sections[0]) decorateBrandSection(sections[0]);
    if (sections[1]) decorateNavSection(sections[1]);
    if (sections[2]) decorateActionSection(sections[2]);
  }

  for (const pattern of HEADER_ACTIONS) {
    decorateAction(fragment, pattern);
  }
}

/**
 * loads and decorates the header
 * @param {Element} el The header element
 */
export default async function init(el) {
  const headerMeta = getMetadata('header');
  const path = headerMeta || HEADER_PATH;
  try {
    const fragment = await loadFragment(`${locale.prefix}${path}`);
    fragment.classList.add('header-content');
    await decorateHeader(fragment);
    el.append(fragment);
  } catch (e) {
    throw Error(e);
  }
}
