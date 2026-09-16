/* ============================================================
   CAROUSEL IMAGE VIEWER — tap carousel image → fullscreen original
   with zoom/pan (Panzoom 4.6.2), navigation, keyboard & touch.
   Adapted from the Finca Papirucho implementation (cv-* viewer).
   ============================================================ */
(function () {
  var overlay = document.getElementById('cv-overlay');
  if (!overlay) return;
  var img = document.getElementById('cv-img');
  var wrap = document.getElementById('cv-img-wrap');
  var closeBtn = document.getElementById('cv-close');
  var hint = document.getElementById('cv-hint');
  var spinner = document.getElementById('cv-spinner');
  var counterEl = document.getElementById('cv-counter');
  var captionEl = document.getElementById('cv-caption');
  var prevBtn = document.getElementById('cv-prev');
  var nextBtn = document.getElementById('cv-next');
  var hintTimer = null;

  /* ---- Collection + current index ---- */
  var images = [];
  var captions = [];
  var idx = 0;
  var renderToken = 0;

  /* ---- In-memory image cache (instant back-navigation) ---- */
  var cache = {};

  /* ---- Scroll lock (reference-counted, safe for nested locks) ---- */
  var scrollLockCount = 0;
  function lockScroll() {
    scrollLockCount++;
    document.documentElement.style.overflow = 'hidden';
    document.body.style.overflow = 'hidden';
  }
  function unlockScroll() {
    if (scrollLockCount <= 0) return;
    scrollLockCount--;
    if (scrollLockCount === 0) {
      document.documentElement.style.overflow = '';
      document.body.style.overflow = '';
    }
  }

  function cachedImg(url) {
    if (!cache[url]) {
      var im = new Image();
      im.decoding = 'async';
      im.src = url;
      cache[url] = im;
    }
    return cache[url];
  }

  function isReady(url) {
    var im = cache[url];
    return !!(im && im.complete && im.naturalWidth > 0);
  }

  function preloadScope() {
    // Preload the whole set on small collections so any step is instant.
    if (images.length <= 8) {
      images.forEach(cachedImg);
      return;
    }
    cachedImg(images[(idx + 1) % images.length]);
    cachedImg(images[(idx - 1 + images.length) % images.length]);
  }

  /* ---- Zoom / pan state ---- */
  // Panzoom owns all zoom/pan math: wheel zoom anchored at the cursor,
  // pointer drag, and multi-touch pinch with a focal point.
  var lastTap = 0;
  var pzGesture = false; // a Panzoom gesture just ran; swallow the next click

  function resetZoom() {
    if (window.pz) {
      window.pz.reset({ animate: false });
    } else {
      img.style.transform = '';
    }
  }

  function initPanzoom() {
    if (!window.Panzoom || window.pz) return;
    var instance = window.Panzoom(img, {
      startScale: 1,
      minScale: 1,
      maxScale: 4,
      panOnlyWhenZoomed: true,
      animate: false
    });
    window.pz = instance;
    var startState = null;
    img.addEventListener('panzoomstart', function () {
      var s0 = instance.getScale();
      var p0 = instance.getPan();
      startState = { x: p0.x, y: p0.y, s: s0 };
    });
    img.addEventListener('panzoomend', function () {
      var t = instance.getPan();
      var s = instance.getScale();
      var moved = !startState ||
        Math.abs(t.x - startState.x) > 5 ||
        Math.abs(t.y - startState.y) > 5 ||
        Math.abs(s - startState.s) > 0.05;
      startState = null;
      pzGesture = moved;
      if (s <= 1) {
        instance.reset({ animate: false });
        return;
      }
      // Panzoom's transform is `scale(s) translate(x, y)`: convert the
      // viewport-based limits into pre-scale units before clamping.
      var r = img.getBoundingClientRect();
      var maxX = Math.max(0, (r.width - window.innerWidth) / 2 / s);
      var maxY = Math.max(0, (r.height - window.innerHeight) / 2 / s);
      var nx = Math.max(-maxX, Math.min(maxX, t.x));
      var ny = Math.max(-maxY, Math.min(maxY, t.y));
      if (nx !== t.x || ny !== t.y) {
        instance.setTransform({ x: nx, y: ny, scale: s }, { animate: false });
      }
    });
    return instance;
  }
  initPanzoom();

  function setCounter() {
    counterEl.textContent = (idx + 1) + ' / ' + images.length;
  }

  function showSpinner() {
    spinner.style.display = 'block';
    img.classList.remove('fading');
    img.classList.add('loading');
  }

  function render() {
    var src = images[idx];
    if (!src) return;
    // Token guards stale async callbacks on fast navigation / reopen.
    var token = ++renderToken;
    if (!isReady(src)) showSpinner();
    else {
      spinner.style.display = 'none';
      img.classList.remove('loading');
    }
    img.onload = function () {
      if (token !== renderToken) return;
      if (!isReady(img.src)) cache[img.src] = img;
      spinner.style.display = 'none';
      img.classList.remove('loading');
      void img.offsetWidth;
      img.classList.add('fading');
      requestAnimationFrame(function () { img.classList.remove('fading'); });
    };
    img.onerror = function () {
      if (token !== renderToken) return;
      spinner.style.display = 'none';
      img.classList.remove('loading');
    };
    img.src = src;
    img.alt = 'Imagen ampliada';
    captionEl.textContent = captions[idx] || '';
    resetZoom();
    setCounter();
    prevBtn.classList.toggle('hidden', images.length <= 1);
    nextBtn.classList.toggle('hidden', images.length <= 1);
    preloadScope();
  }

  function go(n) {
    if (images.length <= 1) return;
    idx = (n + images.length) % images.length;
    render();
  }

  function openViewer(srcArray, startIndex, capArray) {
    images = srcArray.slice();
    captions = capArray ? capArray.slice() : [];
    idx = ((startIndex || 0) + images.length) % images.length;
    overlay.classList.add('open');
    overlay.setAttribute('aria-hidden', 'false');
    document.body.classList.add('viewer-open');
    lockScroll();
    clearTimeout(hintTimer);
    hint.classList.remove('hidden');
    hintTimer = setTimeout(function () { hint.classList.add('hidden'); }, 4000);
    render();
  }

  function closeViewer() {
    overlay.classList.remove('open');
    overlay.setAttribute('aria-hidden', 'true');
    document.body.classList.remove('viewer-open');
    unlockScroll();
    renderToken++;
    img.onload = null;
    img.onerror = null;
    img.src = '';
    img.classList.remove('loading', 'fading');
    spinner.style.display = 'none';
    resetZoom();
    images = [];
    captions = [];
    captionEl.textContent = '';
    clearTimeout(hintTimer);
  }

  closeBtn.addEventListener('click', closeViewer);
  prevBtn.addEventListener('click', function () { go(idx - 1); });
  nextBtn.addEventListener('click', function () { go(idx + 1); });
  overlay.addEventListener('click', function (e) {
    if (pzGesture) return; // ignore clicks that were Panzoom gestures
    if (e.target === overlay || e.target === wrap) closeViewer();
  });
  document.addEventListener('keydown', function (e) {
    if (!overlay.classList.contains('open')) return;
    if (e.key === 'Escape') closeViewer();
    if (e.key === 'ArrowLeft') go(idx - 1);
    if (e.key === 'ArrowRight') go(idx + 1);
  });

  /* ---- Wheel zoom (desktop), anchored at the cursor position ---- */
  wrap.addEventListener('wheel', function (e) {
    if (!overlay.classList.contains('open')) return;
    if (!window.pz) return;
    window.pz.zoomWithWheel(e);
  }, { passive: false });

  /* ---- Pointer drag pans when zoomed; pinch zooms (owned by Panzoom) ---- */

  /* ---- Double-tap zoom (mobile) via Panzoom focal ---- */
  wrap.addEventListener('touchend', function (e) {
    if (!overlay.classList.contains('open') || e.changedTouches.length !== 1) return;
    var now = Date.now();
    if (now - lastTap < 300) {
      e.preventDefault();
      if (!window.pz) return;
      var s = window.pz.getScale();
      if (s > 1) {
        window.pz.reset({ animate: false });
      } else {
        var t = e.changedTouches[0];
        var r = img.getBoundingClientRect();
        window.pz.zoom(2.5, {
          focal: { x: t.clientX - r.left, y: t.clientY - r.top },
          animate: false
        });
      }
      lastTap = 0;
    } else {
      lastTap = now;
    }
  });

  /* ---- Horizontal swipe when not zoomed (Panzoom pans only when zoomed) ---- */
  var swipeX0 = 0, swipeY0 = 0, swipeActive = false;
  function currentScale() {
    return window.pz ? window.pz.getScale() : 1;
  }
  wrap.addEventListener('touchstart', function (e) {
    if (!overlay.classList.contains('open')) return;
    if (e.touches.length === 1 && currentScale() <= 1) {
      swipeX0 = e.touches[0].clientX;
      swipeY0 = e.touches[0].clientY;
      swipeActive = true;
      wrap.classList.add('grabbing');
    }
  }, { passive: true });

  wrap.addEventListener('touchmove', function (e) {
    if (swipeActive && e.touches.length === 1 && currentScale() <= 1) {
      e.preventDefault();
    }
  }, { passive: false });

  wrap.addEventListener('touchend', function (e) {
    if (currentScale() <= 1 && swipeActive && e.changedTouches.length === 1) {
      var dx = e.changedTouches[0].clientX - swipeX0;
      var dy = e.changedTouches[0].clientY - swipeY0;
      if (Math.abs(dx) > 45 && Math.abs(dx) > Math.abs(dy) * 1.4) {
        go(idx + (dx < 0 ? 1 : -1));
      }
    }
    swipeActive = false;
    wrap.classList.remove('grabbing');
  }, { passive: true });

  /* ---- Collect the image set of the clicked carousel slide ---- */
  function siblingsOf(clickedImg) {
    var container = clickedImg.closest('.image-carousel-container');
    if (!container || !container.parentNode) return null;
    var carousel = container.parentNode; // .image-carousel
    var imgs = Array.prototype.slice.call(carousel.querySelectorAll('img'));
    imgs = imgs.filter(function (i) { return i.src; });
    var start = imgs.indexOf(clickedImg);
    return { list: imgs, index: start >= 0 ? start : 0 };
  }

  /* ---- Attach to carousel images ---- */
  function attach(el) {
    el.style.cursor = 'pointer';
    el.addEventListener('click', function (e) {
      e.stopPropagation();
      var ref = siblingsOf(el);
      if (ref) {
        openViewer(
          ref.list.map(function (i) { return i.currentSrc || i.src; }),
          ref.index,
          ref.list.map(function (i) { return i.alt || ''; })
        );
      } else {
        openViewer([el.currentSrc || el.src], 0, [el.alt || '']);
      }
    });
  }

  document.querySelectorAll('.image-carousel .carousel-image img').forEach(attach);
})();