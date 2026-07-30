// Mobile nav, smooth scrolling, and the slam. Moved verbatim from the former
// app.js IIFE; behavior is unchanged.

export function initUI() {
  const menuToggle = document.querySelector('.menu-toggle');
  const siteNav = document.querySelector('.site-nav');

  if (menuToggle && siteNav) {
    menuToggle.addEventListener('click', function () {
      const isOpen = siteNav.classList.toggle('open');
      menuToggle.setAttribute('aria-expanded', isOpen);
    });

    document.addEventListener('click', function (e) {
      if (!menuToggle.contains(e.target) && !siteNav.contains(e.target)) {
        siteNav.classList.remove('open');
        menuToggle.setAttribute('aria-expanded', 'false');
      }
    });

    // The nav covers the page on mobile, so Escape must get out of it.
    document.addEventListener('keydown', function (e) {
      if (e.key !== 'Escape' || !siteNav.classList.contains('open')) return;
      siteNav.classList.remove('open');
      menuToggle.setAttribute('aria-expanded', 'false');
      menuToggle.focus();
    });
  }

  document.querySelectorAll('a[href^="#"]').forEach(function (anchor) {
    anchor.addEventListener('click', function (e) {
      const href = this.getAttribute('href');
      if (href === '#') return;

      const target = document.querySelector(href);
      if (target) {
        e.preventDefault();
        target.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }
    });
  });

  // The wall's native motion: a poster goes up in one beat. Content is
  // visible by default — the hiding class is only added once we know both
  // IntersectionObserver and a non-reduced motion preference are in play,
  // so no-JS and reduced-motion readers never see a blank column.
  const wantsMotion = !window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  if (wantsMotion && 'IntersectionObserver' in window) {
    const targets = document.querySelectorAll('.section-heading, .bill, .alert, .daylight');

    if (targets.length > 0) {
      document.documentElement.classList.add('js-slam');
      targets.forEach(function (el) { el.classList.add('slam-in'); });

      const observer = new IntersectionObserver(function (entries) {
        entries.forEach(function (entry) {
          if (!entry.isIntersecting) return;
          entry.target.classList.add('slammed');
          observer.unobserve(entry.target);
        });
      }, { rootMargin: '0px 0px -8% 0px', threshold: 0.05 });

      targets.forEach(function (el) { observer.observe(el); });
    }
  }
}
