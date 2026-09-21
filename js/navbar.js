/**
 * ===================================================
 * NAVBAR, MOBILE DRAWER & BOTTOM NAVIGATION
 * ===================================================
 */

document.addEventListener('DOMContentLoaded', () => {
  initStickyNavbar();
  initMobileDrawer();
  highlightActiveNavLinks();
});

/**
 * Add shadow and backdrop styling to navbar on scroll
 */
function initStickyNavbar() {
  const header = document.querySelector('.site-header');
  if (!header) return;

  const onScroll = () => {
    if (window.scrollY > 15) {
      header.classList.add('is-scrolled');
    } else {
      header.classList.remove('is-scrolled');
    }
  };

  window.addEventListener('scroll', onScroll, { passive: true });
  onScroll();
}

/**
 * Handle mobile hamburger menu open/close and backdrop click
 */
function initMobileDrawer() {
  const toggleBtn = document.querySelector('.mobile-menu-toggle');
  const drawer = document.querySelector('.mobile-drawer');
  const overlay = document.querySelector('.mobile-drawer-overlay');
  const closeBtn = document.querySelector('.mobile-drawer-close');
  const mobileMenuTriggerBottom = document.querySelector('[data-trigger-mobile-menu]');

  if (!drawer || !overlay) return;

  const openDrawer = () => {
    drawer.classList.add('is-open');
    overlay.classList.add('is-open');
    if (toggleBtn) {
      toggleBtn.classList.add('is-open');
      toggleBtn.setAttribute('aria-expanded', 'true');
    }
    document.body.style.overflow = 'hidden';
  };

  const closeDrawer = () => {
    drawer.classList.remove('is-open');
    overlay.classList.remove('is-open');
    if (toggleBtn) {
      toggleBtn.classList.remove('is-open');
      toggleBtn.setAttribute('aria-expanded', 'false');
    }
    document.body.style.overflow = '';
  };

  if (toggleBtn) {
    toggleBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      const isOpen = drawer.classList.contains('is-open');
      isOpen ? closeDrawer() : openDrawer();
    });
  }

  if (mobileMenuTriggerBottom) {
    mobileMenuTriggerBottom.addEventListener('click', (e) => {
      e.preventDefault();
      openDrawer();
    });
  }

  if (closeBtn) {
    closeBtn.addEventListener('click', closeDrawer);
  }

  overlay.addEventListener('click', closeDrawer);

  // Close on Escape key
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && drawer.classList.contains('is-open')) {
      closeDrawer();
    }
  });

  // Close when clicking any nav link inside drawer
  const drawerLinks = drawer.querySelectorAll('a');
  drawerLinks.forEach(link => {
    link.addEventListener('click', () => {
      closeDrawer();
    });
  });
}

/**
 * Highlight active page link in desktop nav and bottom nav
 */
function highlightActiveNavLinks() {
  const currentPath = window.location.pathname.toLowerCase();
  const currentSearch = window.location.search.toLowerCase();

  // Helper matcher
  const isMatch = (href) => {
    if (!href) return false;
    const cleanHref = href.toLowerCase();
    if (currentPath.endsWith('/') || currentPath.endsWith('index.html')) {
      return cleanHref === 'index.html' || cleanHref === './' || cleanHref === '/';
    }
    return currentPath.includes(cleanHref.replace(/^\.\//, ''));
  };

  // Desktop Links
  document.querySelectorAll('.nav-link').forEach(link => {
    const href = link.getAttribute('href');
    if (isMatch(href)) {
      link.classList.add('is-active');
    } else {
      link.classList.remove('is-active');
    }
  });

  // Mobile Drawer Links
  document.querySelectorAll('.mobile-nav-link').forEach(link => {
    const href = link.getAttribute('href');
    if (isMatch(href)) {
      link.classList.add('is-active');
    } else {
      link.classList.remove('is-active');
    }
  });

  // Mobile Bottom Bar Links
  document.querySelectorAll('.bottom-nav-item').forEach(link => {
    const href = link.getAttribute('href');
    if (isMatch(href)) {
      link.classList.add('is-active');
    } else if (!link.classList.contains('is-wa')) {
      link.classList.remove('is-active');
    }
  });
}
