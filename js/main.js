// ============================================
// NAVIGATION: mobile menu + scrollspy
// ============================================

document.addEventListener('DOMContentLoaded', function () {
  var menuBtn = document.getElementById('menuBtn');
  var navLinks = document.getElementById('navLinks');
  var navInner = document.getElementById('navInner');

  if (menuBtn) {
    menuBtn.addEventListener('click', function (e) {
      e.stopPropagation();
      toggleMenu();
    });
  }

  function toggleMenu() {
    var open = navLinks.classList.toggle('open');
    menuBtn.classList.toggle('close', open);
    menuBtn.setAttribute('aria-expanded', open ? 'true' : 'false');
  }

  // Close menu when a link is clicked
  navLinks.addEventListener('click', function (e) {
    if (e.target.closest('a')) {
      navLinks.classList.remove('open');
      menuBtn.classList.remove('close');
      menuBtn.setAttribute('aria-expanded', 'false');
    }
  });

  // Close menu on outside click
  document.addEventListener('click', function (e) {
    if (navLinks.classList.contains('open') &&
      !navLinks.contains(e.target) &&
      !menuBtn.contains(e.target)) {
      navLinks.classList.remove('open');
      menuBtn.classList.remove('close');
      menuBtn.setAttribute('aria-expanded', 'false');
    }
  });

  // Nav shadow on scroll
  window.addEventListener('scroll', function () {
    if (window.scrollY > 10) {
      navInner.classList.add('scrolled');
    } else {
      navInner.classList.remove('scrolled');
    }
  }, { passive: true });

  // Scrollspy
  var sections = Array.prototype.map.call(
    document.querySelectorAll('main[id], section[id]'),
    function (s) { return s; }
  );
  var links = Array.prototype.map.call(
    document.querySelectorAll('.nav-links a'),
    function (a) { return a; }
  );

  function onScroll() {
    var pos = window.scrollY + 120;
    var current = null;

    for (var i = 0; i < sections.length; i++) {
      if (sections[i].offsetTop <= pos) {
        current = sections[i].id;
      }
    }

    links.forEach(function (link) {
      link.classList.toggle('current', link.getAttribute('href') === '#' + current);
    });
  }

  window.addEventListener('scroll', onScroll, { passive: true });
  onScroll();
});