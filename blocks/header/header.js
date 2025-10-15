import { getConfig, getMetadata } from '../../scripts/ak.js';
import { loadFragment } from '../fragment/fragment.js';

const { locale } = getConfig();

const HEADER_PATH = '/fragments/nav/header';

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

      // Find the section with multiple <p><strong> and merge them into one section
      const sections = fragmentClone.querySelectorAll('.section');
      const fragmentContent = fragmentClone.querySelector('.fragment-content');
      
      sections.forEach((section, sectionIndex) => {
        const defaultContent = section.querySelector('.default-content');
        if (!defaultContent) return;

        const strongParagraphs = Array.from(defaultContent.querySelectorAll('p:has(strong)'));
        if (strongParagraphs.length > 1) {
          // This section has multiple titles - we need to split it
          const navBlocks = [];
          
          // Create nav-blocks for each title+content pair
          strongParagraphs.forEach((strongP, index) => {
            const blockDiv = document.createElement('div');
            blockDiv.className = 'nav-block';
            
            // Add the strong paragraph
            blockDiv.appendChild(strongP.cloneNode(true));
            
            // Check if there's a UL following this strong paragraph
            let nextSibling = strongP.nextElementSibling;
            if (nextSibling && nextSibling.tagName === 'UL') {
              blockDiv.appendChild(nextSibling.cloneNode(true));
            }
            
            // Store the nav-block for later
            navBlocks.push(blockDiv);
          });
          
          // Clear the original content and add the nav-blocks
          defaultContent.innerHTML = '';
          navBlocks.forEach(block => {
            defaultContent.appendChild(block);
          });
        }
      });

      // Add a class to prevent sub-nav links from being processed by main nav
      const subNavLinks = fragmentClone.querySelectorAll('a');
      subNavLinks.forEach((subLink) => {
        subLink.classList.add('sub-nav-link');
      });

      subNavMenu.append(fragmentClone);
      liContainer.append(subNavMenu);

      // hover behavior
      liContainer.addEventListener('mouseenter', () => {
        subNavMenu.classList.add('is-open');
        liContainer.classList.add('is-open');
      });

      liContainer.addEventListener('mouseleave', () => {
        subNavMenu.classList.remove('is-open');
        liContainer.classList.remove('is-open');
      });

      // mobile behavior
      link.addEventListener('click', (e) => {
        if (window.innerWidth <= 1280) {
          e.preventDefault();
          const nowOpen = !subNavMenu.classList.contains('is-open');
          subNavMenu.classList.toggle('is-open');
          liContainer.classList.toggle('is-open', nowOpen);
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
  section.classList.add('brands-section');
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

  const logoElement = navContent.querySelector('picture, img');
  if (logoElement) {
    logoArea.appendChild(logoElement);
  }

  const navArea = document.createElement('div');
  navArea.className = 'nav-area';

  const navLinks = document.createElement('div');
  navLinks.className = 'nav-links';

  const actionLinks = document.createElement('div');
  actionLinks.className = 'action-links';

  // Only select top-level navigation links (li > p > a), not nested sub-nav links
  const existingLinks = Array.from(navContent.querySelectorAll(':scope > ul > li > p > a'))
    .filter((link) => !link.closest('picture'));

  const linksToProcess = existingLinks.map((link) => link.cloneNode(true));

  for (const link of linksToProcess) {
    const decorated = await decorateNavItem(link);
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
