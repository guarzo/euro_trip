// Europe Trip Planning - Main JavaScript

(function() {
  'use strict';

  // ============================================
  // Mobile Navigation
  // ============================================
  const menuToggle = document.querySelector('.menu-toggle');
  const siteNav = document.querySelector('.site-nav');

  if (menuToggle && siteNav) {
    menuToggle.addEventListener('click', function() {
      const isOpen = siteNav.classList.toggle('open');
      menuToggle.setAttribute('aria-expanded', isOpen);
    });

    document.addEventListener('click', function(e) {
      if (!menuToggle.contains(e.target) && !siteNav.contains(e.target)) {
        siteNav.classList.remove('open');
        menuToggle.setAttribute('aria-expanded', 'false');
      }
    });
  }

  // ============================================
  // Smooth scroll for anchor links
  // ============================================
  document.querySelectorAll('a[href^="#"]').forEach(function(anchor) {
    anchor.addEventListener('click', function(e) {
      const href = this.getAttribute('href');
      if (href === '#') return;

      const target = document.querySelector(href);
      if (target) {
        e.preventDefault();
        target.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }
    });
  });

  // ============================================
  // Interest Toggles (localStorage, per-device)
  // ============================================
  // Each person's picks live only in their own browser. Nothing is shared
  // or sent anywhere — Giscus threads are where shared opinions go.
  const INTEREST_KEY = 'euro-trip-interest';
  const INTEREST_STATES = ['unset', 'yes', 'no'];
  const INTEREST_LABELS = {
    unset: '☆ Interested?',
    yes: '★ Interested',
    no: '✕ Not for me'
  };

  function loadInterests() {
    try {
      return JSON.parse(localStorage.getItem(INTEREST_KEY)) || {};
    } catch (e) {
      return {};
    }
  }

  function saveInterests(state) {
    try {
      localStorage.setItem(INTEREST_KEY, JSON.stringify(state));
    } catch (e) {
      // Private browsing or a full quota — the toggle still works for this
      // page view, it just won't survive a reload. Not worth interrupting for.
    }
  }

  function renderInterest(btn, value) {
    const state = value || 'unset';
    btn.dataset.interestState = state;
    btn.textContent = INTEREST_LABELS[state];
    btn.setAttribute('aria-pressed', state === 'yes');
  }

  const interestButtons = document.querySelectorAll('.interest-toggle');

  if (interestButtons.length > 0) {
    const interests = loadInterests();

    interestButtons.forEach(function(btn) {
      const key = btn.dataset.interestKey;
      if (!key) return;

      renderInterest(btn, interests[key]);

      btn.addEventListener('click', function(e) {
        // The toggle sits inside a link on the cities index; without these
        // the click would navigate away instead of cycling the state.
        e.preventDefault();
        e.stopPropagation();

        const current = btn.dataset.interestState || 'unset';
        const next = INTEREST_STATES[(INTEREST_STATES.indexOf(current) + 1) % INTEREST_STATES.length];

        if (next === 'unset') {
          delete interests[key];
        } else {
          interests[key] = next;
        }

        saveInterests(interests);
        renderInterest(btn, next);
      });
    });
  }

})();
