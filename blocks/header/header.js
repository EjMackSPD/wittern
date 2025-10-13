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
  openMenus.forEach((m) => m.classList.remove('is-open'));
}

function closeAllSubMenus() {
  const openSubMenus = document.body.querySelectorAll('.sub-nav-menu.is-open');
  openSubMenus.forEach((m) => m.classList.remove('is-open'));
}

function docClose(e) {
  if (e.target.closest('header')) return;
  closeAllMenus();
  closeAllSubMenus();
}

function toggleMenu(menu) {
  const isOpen = menu.classList.contains('is-open');
  closeAllMenus();
  if (isOpen) {
    document.removeEventListener('click', docClose);
    return;
  }
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
      const fragment = await loadFragment(`${locale.prefix}${HEADER_PATH}/languages`);
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
      currPref = matchMedia('(prefers-color-scheme: dark)').matches ? 'dark-scheme' : 'light-scheme';
    }
    const theme = currPref === 'dark-scheme'
      ? { add: 'light-scheme', remove: 'dark-scheme' }
      : { add: 'dark-scheme', remove: 'light-scheme' };

    body.classList.remove(theme.remove);
    body.classList.add(theme.add);
    localStorage.setItem('color-scheme', theme.add);

    const sections = document.querySelectorAll('.section');
    sections.forEach((s) => setColorScheme(s));
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
  wrapper.className = `action-wrapper ${icon?.classList[1]?.replace('icon-', '') || ''}`;
  wrapper.append(btn);
  link.parentElement.parentElement.replaceChild(wrapper, link.parentElement);

  if (pattern === '/tools/widgets/language') decorateLanguage(btn);
  if (pattern === '/tools/widgets/scheme') decorateScheme(btn);
  if (pattern === '/tools/widgets/toggle') decorateNavToggle(btn);
}

// DYNAMIC SUB NAVIGATION
async function decorateNavItem(link) {
  const liContainer = document.createElement('div');
  liContainer.className = 'nav-item-container';
  liContainer.append(link);

  const label = link.textContent.trim().toLowerCase().replace(/\s+/g, '-');
  const subNavPath = `${locale.prefix}${HEADER_PATH}/${label}`;

  try {
    const fragment = await loadFragment(subNavPath);
    if (fragment) {
      // Add dropdown indicator to the link
      const indicator = document.createElement('span');
      indicator.className = 'nav-dropdown-indicator';
      indicator.innerHTML = '>';
      link.appendChild(indicator);

      const subNavMenu = document.createElement('div');
      subNavMenu.className = 'sub-nav-menu';
      
      // Clone the fragment to avoid affecting the original
      const fragmentClone = fragment.cloneNode(true);
      
      // Add a class to prevent sub-nav links from being processed by main nav
      const subNavLinks = fragmentClone.querySelectorAll('a');
      subNavLinks.forEach(subLink => {
        subLink.classList.add('sub-nav-link');
      });
      
      subNavMenu.append(fragmentClone);
      liContainer.append(subNavMenu);

      // hover behavior
      liContainer.addEventListener('mouseenter', () => {
        subNavMenu.classList.add('is-open');
      });
      liContainer.addEventListener('mouseleave', () => {
        subNavMenu.classList.remove('is-open');
      });

      // mobile behavior
      link.addEventListener('click', (e) => {
        if (window.innerWidth <= 1280) {
          e.preventDefault();
          subNavMenu.classList.toggle('is-open');
          const others = document.querySelectorAll('.sub-nav-menu.is-open');
          others.forEach((menu) => {
            if (menu !== subNavMenu) menu.classList.remove('is-open');
          });
        }
      });
    }
  } catch {
    // no sub-nav fragment found; just render the link
  }

  return liContainer;
}

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

async function decorateNavSection(section) {
  section.classList.add('main-nav-section');
  const navContent = section.querySelector('.default-content');
  if (!navContent) return;

  const logoArea = document.createElement('div');
  logoArea.className = 'logo-area';
  logoArea.style.cssText = 'display:flex;align-items:center;justify-content:space-between;padding:0 16px;';

  const navArea = document.createElement('div');
  navArea.className = 'nav-area';

  const navLinks = document.createElement('div');
  navLinks.className = 'nav-links';

  const actionLinks = document.createElement('div');
  actionLinks.className = 'action-links';

  const logoElement = navContent.querySelector('picture, img');
  if (logoElement) {
    logoElement.style.cssText = 'width:250px;height:auto;flex-shrink:0;';
    logoArea.appendChild(logoElement);
  }

  const existingLinks = navContent.querySelectorAll('a:not(.sub-nav-link)');
  for (const link of existingLinks) {
    const decorated = await decorateNavItem(link.cloneNode(true));
    navLinks.append(decorated);
  }

  const fragment = section.closest('.header-content');
  if (fragment) {
    const allSections = fragment.querySelectorAll('.section');
    allSections.forEach((sect) => {
      const sectContent = sect.querySelector('.default-content');
      if (sectContent) {
        const searchLink = sectContent.querySelector('a[href*="search"]');
        const contactLink = sectContent.querySelector('a[href*="contact"]');
        if (searchLink) actionLinks.append(searchLink.cloneNode(true));
        if (contactLink) {
          const cloned = contactLink.cloneNode(true);
          cloned.classList.add('contact-btn');
          actionLinks.append(cloned);
        }
      }
    });
  }

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

  mobileMenuBtn.addEventListener('click', (e) => {
    e.stopPropagation();
    const isOpen = navArea.classList.contains('mobile-open');
    navArea.classList.toggle('mobile-open');
    mobileMenuBtn.setAttribute('aria-expanded', !isOpen);
    document.body.classList.toggle('mobile-menu-open', !isOpen);
  });

  document.addEventListener('click', (e) => {
    if (!section.contains(e.target) && navArea.classList.contains('mobile-open')) {
      navArea.classList.remove('mobile-open');
      mobileMenuBtn.setAttribute('aria-expanded', 'false');
      document.body.classList.remove('mobile-menu-open');
    }
  });

  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && navArea.classList.contains('mobile-open')) {
      navArea.classList.remove('mobile-open');
      mobileMenuBtn.setAttribute('aria-expanded', 'false');
      document.body.classList.remove('mobile-menu-open');
    }
  });

  navArea.append(navLinks, actionLinks);
  logoArea.appendChild(mobileMenuBtn);

  navContent.innerHTML = '';
  navContent.append(logoArea, navArea);
}

async function decorateActionSection(section) {
  section.classList.add('actions-section');
  const links = section.querySelectorAll('a');
  links.forEach((l) => {
    if (l.textContent.toLowerCase().includes('contact')) l.classList.add('contact-btn');
  });
}

async function decorateHeader(fragment) {
  const sections = fragment.querySelectorAll(':scope > .section');
  if (sections[0]) decorateBrandSection(sections[0]);
  if (sections[1]) await decorateNavSection(sections[1]);
  if (sections[2]) await decorateActionSection(sections[2]);

  for (const pattern of HEADER_ACTIONS) decorateAction(fragment, pattern);
}

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
