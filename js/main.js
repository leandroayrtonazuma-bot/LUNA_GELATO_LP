/* ============================================
   LUNA GELATO — main.js
   ============================================ */
(function () {
  'use strict';

  var prefersReduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  /* ---------- 1. Smooth scroll (Lenis) ---------- */
  var lenis = null;
  if (!prefersReduced && typeof Lenis !== 'undefined') {
    lenis = new Lenis({ lerp: 0.08, smoothWheel: true });
    function raf(t) { lenis.raf(t); requestAnimationFrame(raf); }
    requestAnimationFrame(raf);
  }

  /* helper: smooth-scroll to a target (works with or without Lenis) */
  function scrollToTarget(target) {
    if (!target) return;
    if (lenis) {
      lenis.scrollTo(target, { offset: -10 });
    } else {
      target.scrollIntoView({ behavior: prefersReduced ? 'auto' : 'smooth' });
    }
  }

  /* ---------- 2. Anchor links ---------- */
  document.querySelectorAll('a[href^="#"]').forEach(function (a) {
    a.addEventListener('click', function (e) {
      var id = a.getAttribute('href');
      if (id.length < 2) return;
      var target = document.querySelector(id);
      if (target) { e.preventDefault(); scrollToTarget(target); closeMenu(); }
    });
  });

  /* prevent navigation on placeholder links */
  document.querySelectorAll('[data-noop]').forEach(function (el) {
    el.addEventListener('click', function (e) { e.preventDefault(); });
  });

  /* ---------- 3. Header scroll state + sticky CTA ---------- */
  var header = document.getElementById('header');
  var stickyCta = document.getElementById('stickyCta');
  var heroEl = document.getElementById('hero');

  function onScroll(y) {
    if (header) header.classList.toggle('is-scrolled', y > 60);
    if (stickyCta && heroEl) {
      var heroBottom = heroEl.offsetHeight - 120;
      stickyCta.classList.toggle('is-shown', y > heroBottom);
    }
  }
  if (lenis) {
    lenis.on('scroll', function (e) { onScroll(e.scroll); });
  } else {
    window.addEventListener('scroll', function () { onScroll(window.scrollY); }, { passive: true });
  }
  onScroll(window.scrollY);

  /* ---------- 4. Hero staged entrance ---------- */
  /* Independent of image loading: paint initial state, then trigger on next frames. */
  if (heroEl) {
    requestAnimationFrame(function () {
      requestAnimationFrame(function () { heroEl.classList.add('is-ready'); });
    });
    /* guarantee visibility even if rAF is throttled (e.g. background tab) */
    setTimeout(function () { heroEl.classList.add('is-ready'); }, 250);
  }

  /* ---------- 5. Scroll reveal (Intersection Observer) ---------- */
  var revealEls = document.querySelectorAll('.reveal');
  if ('IntersectionObserver' in window && !prefersReduced) {
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (entry.isIntersecting) {
          var el = entry.target;
          var delay = el.getAttribute('data-delay') || 0;
          el.style.transitionDelay = delay + 'ms';
          el.classList.add('is-visible');
          io.unobserve(el);
        }
      });
    }, { threshold: 0.15, rootMargin: '0px 0px -8% 0px' });
    revealEls.forEach(function (el) { io.observe(el); });
  } else {
    revealEls.forEach(function (el) { el.classList.add('is-visible'); });
  }

  /* ---------- 6. Mobile drawer ---------- */
  var burger = document.getElementById('burger');
  function openMenu() {
    document.body.classList.add('menu-open');
    if (burger) { burger.setAttribute('aria-expanded', 'true'); burger.setAttribute('aria-label', 'メニューを閉じる'); }
    if (lenis) lenis.stop();
  }
  function closeMenu() {
    if (!document.body.classList.contains('menu-open')) return;
    document.body.classList.remove('menu-open');
    if (burger) { burger.setAttribute('aria-expanded', 'false'); burger.setAttribute('aria-label', 'メニューを開く'); }
    if (lenis) lenis.start();
  }
  if (burger) {
    burger.addEventListener('click', function () {
      document.body.classList.contains('menu-open') ? closeMenu() : openMenu();
    });
  }
  document.querySelectorAll('[data-close]').forEach(function (el) {
    el.addEventListener('click', closeMenu);
  });

  /* ---------- 7. Reservation modal ---------- */
  var modal = document.getElementById('reserveModal');
  var form = document.getElementById('reserveForm');
  var result = document.getElementById('formResult');
  var lastFocused = null;

  function openModal() {
    lastFocused = document.activeElement;
    closeMenu();
    modal.classList.add('is-open');
    modal.setAttribute('aria-hidden', 'false');
    if (lenis) lenis.stop();
    var first = modal.querySelector('input, select, button');
    if (first) setTimeout(function () { first.focus(); }, 60);
  }
  function closeModal() {
    modal.classList.remove('is-open');
    modal.setAttribute('aria-hidden', 'true');
    if (lenis) lenis.start();
    /* reset form view for next open */
    setTimeout(function () {
      if (form) { form.style.display = ''; form.reset(); }
      if (result) result.classList.remove('is-shown');
    }, 350);
    if (lastFocused) lastFocused.focus();
  }

  document.querySelectorAll('[data-reserve]').forEach(function (btn) {
    btn.addEventListener('click', openModal);
  });
  document.querySelectorAll('[data-close-modal]').forEach(function (el) {
    el.addEventListener('click', closeModal);
  });
  document.addEventListener('keydown', function (e) {
    if (e.key === 'Escape') {
      if (modal.classList.contains('is-open')) closeModal();
      else closeMenu();
    }
  });

  /* fake submit — nothing is sent anywhere */
  if (form) {
    form.addEventListener('submit', function (e) {
      e.preventDefault();
      form.style.display = 'none';
      if (result) result.classList.add('is-shown');
    });
  }

  /* ---------- 8. Menu marquee: pause while held / long-pressed ---------- */
  var marquee = document.getElementById('menuMarquee');
  var track = document.getElementById('menuTrack');
  if (marquee && track) {
    var pause = function () { track.classList.add('is-paused'); };
    var resume = function () { track.classList.remove('is-paused'); };
    marquee.addEventListener('pointerdown', pause);
    window.addEventListener('pointerup', resume);
    marquee.addEventListener('pointercancel', resume);
    marquee.addEventListener('pointerleave', resume);
    /* avoid the browser turning a long-press drag into text selection */
    marquee.addEventListener('dragstart', function (e) { e.preventDefault(); });
  }

  /* ---------- 9. will-change hygiene on hover cards ---------- */
  document.querySelectorAll('.flavor, .card').forEach(function (el) {
    el.addEventListener('mouseenter', function () { el.style.willChange = 'transform'; });
    el.addEventListener('mouseleave', function () { el.style.willChange = 'auto'; });
  });

})();
