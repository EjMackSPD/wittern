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

    const theme = currPref === 'dark-scheme' ? { add: 'light-scheme', remove: 'dark-scheme' } : { add: 'dark-scheme', remove: 'light-scheme' };

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

// eslint-disable-next-line no-unused-vars
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

  if (!navContent) {
    return;
  }

  // Create logo area (left 25%)
  const logoArea = document.createElement('div');
  logoArea.className = 'logo-area';
  logoArea.style.cssText = 'display: flex; align-items: center; justify-content: space-between; padding: 0 16px;';

  // Create navigation area (right 75% with glass background)
  const navArea = document.createElement('div');
  navArea.className = 'nav-area';

  // Create navigation structure within nav area
  const navLinks = document.createElement('div');
  navLinks.className = 'nav-links';

  const actionLinks = document.createElement('div');
  actionLinks.className = 'action-links';

  // Find and move logo to logo area
  const logoElement = navContent.querySelector('picture, img');
  if (logoElement) {
    // Force logo size with inline styles
    if (logoElement.tagName === 'PICTURE') {
      logoElement.style.cssText = 'width: 250px; height: auto; flex-shrink: 0;';
      const img = logoElement.querySelector('img');
      if (img) {
        img.style.cssText = 'width: 250px; height: auto;';
      }
    } else {
      logoElement.style.cssText = 'width: 250px; height: auto; flex-shrink: 0;';
    }
    logoArea.appendChild(logoElement);
  }

  // Get only the top-level navigation links (exclude sub-navigation items)
  const linkSelectors = [
    ':scope > a',
    ':scope > p > a',
    ':scope > div > a',
    ':scope > span > a',
    ':scope > strong > a',
    ':scope > em > a',
  ];

  const findDirectLink = (container) => {
    if (container.matches('a')) return container;
    for (const selector of linkSelectors) {
      const direct = container.querySelector(selector);
      if (direct) return direct;
    }
    return null;
  };

  const topLevelLinks = [];

  [...navContent.children].forEach((child) => {
    if (child.matches('ul, ol')) {
      child.querySelectorAll(':scope > li').forEach((item) => {
        const link = findDirectLink(item);
        if (link) topLevelLinks.push(link);
      });
    } else {
      const link = findDirectLink(child);
      if (link) topLevelLinks.push(link);
    }
  });

  topLevelLinks.forEach((link) => {
    navLinks.appendChild(link.cloneNode(true));
  });

  // Get action links from the fragment - look in all sections
  const fragment = section.closest('.header-content');
  if (fragment) {
    const allSections = fragment.querySelectorAll('.section');

    allSections.forEach((sect) => {
      const sectContent = sect.querySelector('.default-content');
      if (sectContent) {
        const searchLink = sectContent.querySelector('a[href*="search"]');
        const contactLink = sectContent.querySelector('a[href*="contact"]');

        if (searchLink) {
          actionLinks.appendChild(searchLink.cloneNode(true));
        }
        if (contactLink) {
          const clonedContact = contactLink.cloneNode(true);
          clonedContact.classList.add('contact-btn');
          actionLinks.appendChild(clonedContact);
        }
      }
    });
  }

  // Create mobile hamburger button with SVG icon (guaranteed to show)
  const mobileMenuBtn = document.createElement('button');
  mobileMenuBtn.className = 'mobile-menu-btn';
  mobileMenuBtn.innerHTML = `
    <svg width="30" height="24" viewBox="0 0 30 24" fill="none" xmlns="http://www.w3.org/2000/svg">
      <rect width="30" height="3" fill="white" rx="1.5"/>
      <rect y="10.5" width="30" height="3" fill="white" rx="1.5"/>
      <rect y="21" width="30" height="3" fill="white" rx="1.5"/>
    </svg>
  `;
  mobileMenuBtn.setAttribute('aria-label', 'Toggle mobile menu');
  mobileMenuBtn.setAttribute('aria-expanded', 'false');

  // Add mobile menu functionality
  mobileMenuBtn.addEventListener('click', (e) => {
    e.stopPropagation();
    const isOpen = navArea.classList.contains('mobile-open');
    navArea.classList.toggle('mobile-open');
    mobileMenuBtn.setAttribute('aria-expanded', !isOpen);
    document.body.classList.toggle('mobile-menu-open', !isOpen);
  });

  // Close mobile menu when clicking outside
  document.addEventListener('click', (e) => {
    if (
      !section.contains(e.target)
      && navArea.classList.contains('mobile-open')
    ) {
      navArea.classList.remove('mobile-open');
      mobileMenuBtn.setAttribute('aria-expanded', 'false');
      document.body.classList.remove('mobile-menu-open');
    }
  });

  // Close mobile menu when pressing Escape key
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && navArea.classList.contains('mobile-open')) {
      navArea.classList.remove('mobile-open');
      mobileMenuBtn.setAttribute('aria-expanded', 'false');
      document.body.classList.remove('mobile-menu-open');
    }
  });

  // Add nav links and action links to nav area
  navArea.appendChild(navLinks);
  navArea.appendChild(actionLinks);

  // Add mobile menu button to logo area on mobile
  logoArea.appendChild(mobileMenuBtn);

  // Clear existing content and add new structure
  navContent.innerHTML = '';
  navContent.appendChild(logoArea);
  navContent.appendChild(navArea);
}

async function decorateActionSection(section) {
  section.classList.add('actions-section');
  const contactLinks = section.querySelectorAll('a');
  contactLinks.forEach((link) => {
    if (link.textContent.toLowerCase().includes('contact')) {
      link.classList.add('contact-btn');
    }
  });
}

// eslint-disable-next-line no-unused-vars
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

  if (sections[0]) {
    decorateBrandsSection(sections[0]);
  }

  if (sections[1]) {
    decorateNavSection(sections[1]);
  }

  if (sections[2]) {
    decorateActionSection(sections[2]);
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
