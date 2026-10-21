// Header: full-width at the top, collapses into a floating bubble after scrolling.
(function () {
  var header = document.getElementById('header');
  var THRESHOLD = 40;

  function update() {
    header.classList.toggle('is-bubble', window.scrollY > THRESHOLD);
  }

  window.addEventListener('scroll', update, { passive: true });
  update();

  var year = document.getElementById('year');
  if (year) year.textContent = new Date().getFullYear();
})();

// Scroll reveal (ref. bajgartoffice.com/studies):
// "pop" = images/blocks rise from a slight tilt; "slide" = text/lists slide in from the right, staggered.
(function () {
  if (!('IntersectionObserver' in window)) return;
  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;

  var POP = '.hero .display, .section-head, .story > h2, .feature-headline, .compare, .slider-row, .feature-img, .removed-deck, .project-image, .footer .display, .p3-feature, [data-pop]';
  var SLIDE = '.hero .lead, .cta-row, .skill-group, .story-text > p, .fact, .contact-icons > li, .process-steps > li, .process-stats > div, .rollout > li, .outcome-points > li, [data-slide]';

  function mark(selector, type) {
    var groups = new Map();
    document.querySelectorAll(selector).forEach(function (el) {
      // Stagger siblings that share a parent (cards in a grid, paragraphs in a story…).
      var n = groups.get(el.parentNode) || 0;
      groups.set(el.parentNode, n + 1);
      el.classList.add('reveal', 'reveal--' + type);
      el.style.setProperty('--reveal-delay', Math.min(n, 6) * 80 + 'ms');
    });
  }

  mark(POP, 'pop');
  mark(SLIDE, 'slide');

  var observer = new IntersectionObserver(function (entries) {
    entries.forEach(function (entry) {
      if (!entry.isIntersecting) return;
      entry.target.classList.add('is-visible');
      observer.unobserve(entry.target);
    });
  }, { rootMargin: '0px 0px -10% 0px', threshold: 0.1 });

  document.querySelectorAll('.reveal').forEach(function (el) { observer.observe(el); });
})();

// Before / After: toggle buttons switch versions (mobile shows one image at a time).
// The first time a comparison is mostly on screen, it flips to "After" on its own; after that the user is in control.
(function () {
  var items = document.querySelectorAll('[data-compare]');
  if (!items.length) return;

  function setState(item, state) {
    if (item.dataset.state === state) return;
    item.dataset.animated = 'true'; // no wipe on page load, only on real changes
    item.dataset.state = state;
    item.querySelectorAll('[data-show]').forEach(function (btn) {
      btn.setAttribute('aria-pressed', String(btn.dataset.show === state));
    });
  }

  items.forEach(function (item) {
    item.querySelectorAll('[data-show]').forEach(function (btn) {
      btn.addEventListener('click', function () {
        item.dataset.touched = 'true';
        setState(item, btn.dataset.show);
      });
    });
  });

  if (!('IntersectionObserver' in window)) return;
  var observer = new IntersectionObserver(function (entries) {
    entries.forEach(function (entry) {
      if (!entry.isIntersecting) return;
      var item = entry.target;
      observer.unobserve(item);
      setTimeout(function () {
        if (!item.dataset.touched) setState(item, 'after');
      }, 900);
    });
  }, { threshold: 0.6 });

  items.forEach(function (item) { observer.observe(item); });
})();

// "What was removed" deck (mobile): cards stack with a tilt; next flicks the front card away.
(function () {
  var deck = document.querySelector('[data-deck]');
  if (!deck) return;
  var cards = Array.prototype.slice.call(deck.querySelectorAll('.removed-card'));
  var order = cards.map(function (_, i) { return i; });
  var count = deck.querySelector('[data-deck-count]');
  var busy = false;

  function paint() {
    order.forEach(function (idx, pos) { cards[idx].dataset.pos = pos; });
    count.textContent = (order[0] + 1) + ' / ' + cards.length;
  }
  function next() {
    if (busy) return;
    busy = true;
    var front = cards[order[0]];
    front.classList.add('is-leaving');
    setTimeout(function () {
      order.push(order.shift());
      front.classList.remove('is-leaving');
      paint();
      busy = false;
    }, 380);
  }
  function prev() {
    if (busy) return;
    order.unshift(order.pop());
    paint();
  }

  deck.querySelector('[data-deck-next]').addEventListener('click', next);
  deck.querySelector('[data-deck-prev]').addEventListener('click', prev);

  var list = deck.querySelector('.removed-list');
  var startX = null;
  list.addEventListener('pointerdown', function (e) { startX = e.clientX; });
  list.addEventListener('pointerup', function (e) {
    if (startX === null) return;
    var dx = e.clientX - startX;
    startX = null;
    if (dx < -40) next(); else if (dx > 40) prev();
  });

  paint();
})();

// Lightbox: project images open larger on click; click again for full size, Esc / backdrop / × to close.
(function () {
  var imgs = document.querySelectorAll('.project-image img, .compare-img img, .feature-img img');
  if (!imgs.length || typeof HTMLDialogElement !== 'function') return;

  var box = document.createElement('dialog');
  box.className = 'lightbox';
  box.setAttribute('aria-label', 'Image viewer');
  box.innerHTML = '<button type="button" class="lightbox-close" aria-label="Close">×</button>' +
    '<div class="lightbox-stage"><img alt=""></div>' +
    '<p class="lightbox-hint">Click the image to see it at full size</p>';
  document.body.appendChild(box);
  var big = box.querySelector('img');
  var stage = box.querySelector('.lightbox-stage');

  function close() { box.classList.remove('is-zoomed'); box.close(); }

  imgs.forEach(function (img) {
    img.setAttribute('data-zoomable', '');
    img.setAttribute('tabindex', '0');
    img.setAttribute('role', 'button');
    function open() {
      big.src = img.currentSrc || img.src;
      big.alt = img.alt;
      box.classList.remove('is-zoomed');
      box.showModal();
    }
    img.addEventListener('click', open);
    img.addEventListener('keydown', function (e) {
      if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); open(); }
    });
  });

  big.addEventListener('click', function (e) { e.stopPropagation(); box.classList.toggle('is-zoomed'); });
  stage.addEventListener('click', close);           // click outside the image
  box.querySelector('.lightbox-close').addEventListener('click', close);
  box.addEventListener('cancel', function () { box.classList.remove('is-zoomed'); }); // Esc
})();


// Video: plays only while it is on screen (starts from the beginning the first time it scrolls in).
(function () {
  var videos = document.querySelectorAll('video[data-play-in-view]');
  if (!videos.length || !('IntersectionObserver' in window)) return;
  var observer = new IntersectionObserver(function (entries) {
    entries.forEach(function (entry) {
      var v = entry.target;
      if (entry.isIntersecting) {
        if (!v.dataset.started) { v.currentTime = 0; v.dataset.started = 'true'; }
        var p = v.play();
        if (p && p.catch) p.catch(function () {});
      } else {
        v.pause();
      }
    });
  }, { threshold: 0.5 });
  videos.forEach(function (v) { v.pause(); observer.observe(v); });
})();

// Drag-to-compare slider: the range input moves the dividing line; images load (and animations start) when it scrolls in.
(function () {
  document.querySelectorAll('[data-slider]').forEach(function (box) {
    var range = box.querySelector('.slider-range');
    var touched = false;
    function set(v) { box.style.setProperty('--pos', v + '%'); }
    range.addEventListener('input', function () { touched = true; set(range.value); });

    function start() {
      box.querySelectorAll('img[data-src]').forEach(function (img) { img.src = img.dataset.src; img.removeAttribute('data-src'); });
      // Small hint that the line can be dragged: 50% → 70% → 50%.
      if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
      var t0 = null;
      function step(t) {
        if (touched) return;
        if (t0 === null) t0 = t;
        var k = Math.min((t - t0) / 1600, 1);
        var v = 50 + 20 * Math.sin(k * Math.PI);
        set(v); range.value = v;
        if (k < 1) requestAnimationFrame(step);
      }
      setTimeout(function () { requestAnimationFrame(step); }, 600);
    }

    if (!('IntersectionObserver' in window)) { start(); return; }
    var io = new IntersectionObserver(function (entries) {
      if (!entries[0].isIntersecting) return;
      io.disconnect();
      start();
    }, { threshold: 0.4 });
    io.observe(box);
  });
})();

// Project 2: 100-dot grid (19 filled) and timeline bars animate when they scroll into view.
(function () {
  var dots = document.querySelector('.tb-dots');
  if (dots) {
    var html = '';
    for (var i = 0; i < 100; i++) {
      html += i < 19 ? '<i class="is-filled" style="--d:' + i * 45 + 'ms"></i>' : '<i></i>';
    }
    dots.innerHTML = html;
  }
  var targets = document.querySelectorAll('[data-animate]');
  if (!targets.length) return;
  if (!('IntersectionObserver' in window) || window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
    targets.forEach(function (t) { t.classList.add('is-on'); });
    return;
  }
  var io = new IntersectionObserver(function (entries) {
    entries.forEach(function (e) {
      if (!e.isIntersecting) return;
      e.target.classList.add('is-on');
      io.unobserve(e.target);
    });
  }, { threshold: 0.35 });
  targets.forEach(function (t) { io.observe(t); });
})();

// Menu before/after: the "open" video plays once when it scrolls in; the button then toggles open/close.
// Both videos stay loaded and stacked; the one being shown holds on its last frame.
(function () {
  document.querySelectorAll('[data-menu-toggle]').forEach(function (box) {
    var openV = box.querySelector('.menu-video--open');
    var closeV = box.querySelector('.menu-video--close');
    var btn = box.querySelector('.menu-toggle');
    var label = btn.querySelector('span');
    var isOpen = false, started = false;

    function play(show, hide) {
      show.currentTime = 0;
      var p = show.play();
      if (p && p.catch) p.catch(function () {});
      show.classList.add('is-active');
      hide.classList.remove('is-active');
      hide.pause();
    }
    function setOpen(v) {
      isOpen = v;
      if (v) play(openV, closeV); else play(closeV, openV);
      label.textContent = v ? 'Close menus' : 'Open menus';
      btn.setAttribute('aria-pressed', v ? 'true' : 'false');
    }
    btn.addEventListener('click', function () { started = true; setOpen(!isOpen); });

    if (!('IntersectionObserver' in window)) return;
    var io = new IntersectionObserver(function (entries) {
      if (entries[0].isIntersecting && !started) { started = true; setOpen(true); io.disconnect(); }
    }, { threshold: 0.5 });
    io.observe(box);
  });
})();

// Email buttons: open the visitor's mail app (mailto) and also copy the address,
// so it still works for people who use webmail and have no mail app set up.
(function () {
  var links = document.querySelectorAll('a[data-email]');
  if (!links.length) return;
  var toast;
  function show(msg) {
    if (!toast) {
      toast = document.createElement('div');
      toast.className = 'email-toast';
      toast.setAttribute('role', 'status');
      document.body.appendChild(toast);
    }
    toast.textContent = msg;
    toast.classList.add('is-on');
    clearTimeout(toast._t);
    toast._t = setTimeout(function () { toast.classList.remove('is-on'); }, 3200);
  }
  links.forEach(function (a) {
    a.addEventListener('click', function () {
      var addr = a.getAttribute('data-email');
      var done = function () { show('Email copied: ' + addr); };
      if (navigator.clipboard && navigator.clipboard.writeText) {
        navigator.clipboard.writeText(addr).then(done, function () { show('Write to ' + addr); });
      } else {
        show('Write to ' + addr);
      }
    });
  });
})();
