// UI strings set from script, in the page language (<html lang>): en at the root, es/ and pt/ folders.
var I18N = {
  en: { imageViewer: 'Image viewer', close: 'Close', zoomHint: 'Click the image to see it at full size', openMenus: 'Open menus', closeMenus: 'Close menus', emailCopied: 'Email copied: ', writeTo: 'Write to ', menu: 'Menu', skills: 'Skills', language: 'Language' },
  es: { imageViewer: 'Visor de imágenes', close: 'Cerrar', zoomHint: 'Haz clic en la imagen para verla en tamaño completo', openMenus: 'Abrir menús', closeMenus: 'Cerrar menús', emailCopied: 'Correo copiado: ', writeTo: 'Escribe a ', menu: 'Menú', skills: 'Habilidades', language: 'Idioma' },
  pt: { imageViewer: 'Visualizador de imagens', close: 'Fechar', zoomHint: 'Clique na imagem para vê-la em tamanho real', openMenus: 'Abrir menus', closeMenus: 'Fechar menus', emailCopied: 'E-mail copiado: ', writeTo: 'Escreva para ', menu: 'Menu', skills: 'Habilidades', language: 'Idioma' }
};
var T = I18N[(document.documentElement.lang || 'en').slice(0, 2)] || I18N.en;

// Phones: the header shrinks to logo + Menu button, which opens a full-screen panel
// with the page links and large language buttons. Built from the header's own links,
// so the panel follows the page language and the hrefs the build script wrote.
(function () {
  var header = document.getElementById('header');
  var inner = header && header.querySelector('.header-inner');
  if (!inner) return;
  var work = inner.querySelector('.nav-left a');
  var contact = inner.querySelector('.nav-right .pill--black');
  var langs = inner.querySelectorAll('.lang-switch a');
  var NAMES = { en: 'English', es: 'Español', pt: 'Português' };
  var ICON_MENU = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" aria-hidden="true"><path d="M4 8h16M4 16h16"/></svg>';
  var ICON_CLOSE = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" aria-hidden="true"><path d="M6 6l12 12M18 6L6 18"/></svg>';

  var panel = document.createElement('div');
  panel.className = 'mobile-menu';
  panel.id = 'mobile-menu';
  panel.hidden = true;
  var skillsHref = document.getElementById('skills') ? '#skills' : work.getAttribute('href').replace('#work', '#skills');
  panel.innerHTML =
    '<nav class="mobile-menu__links" aria-label="' + T.menu + '">' +
      '<a href="' + work.getAttribute('href') + '">' + work.textContent + '</a>' +
      '<a href="' + skillsHref + '">' + T.skills + '</a>' +
      '<a href="' + contact.getAttribute('href') + '">' + contact.textContent + '</a>' +
    '</nav>' +
    '<p class="eyebrow">' + T.language + '</p>' +
    '<div class="mobile-menu__langs"></div>';
  var langBox = panel.querySelector('.mobile-menu__langs');
  langs.forEach(function (a) {
    var b = a.cloneNode(true);
    b.textContent = NAMES[a.textContent.toLowerCase()] || a.textContent;
    langBox.appendChild(b);
  });
  header.after(panel);

  var btn = document.createElement('button');
  btn.type = 'button';
  btn.className = 'pill pill--black menu-btn';
  btn.setAttribute('aria-controls', 'mobile-menu');
  inner.querySelector('.nav-right').appendChild(btn);
  document.documentElement.classList.add('has-mobile-menu');

  function setOpen(open) {
    panel.hidden = !open;
    btn.setAttribute('aria-expanded', String(open));
    btn.innerHTML = (open ? ICON_CLOSE : ICON_MENU) + '<span>' + (open ? T.close : T.menu) + '</span>';
    document.body.classList.toggle('menu-open', open);
    if (open) panel.querySelector('a').focus();
  }
  setOpen(false);

  btn.addEventListener('click', function () { setOpen(panel.hidden); });
  panel.addEventListener('click', function (e) { if (e.target.closest('a')) setOpen(false); });
  document.addEventListener('keydown', function (e) {
    if (panel.hidden) return;
    if (e.key === 'Escape') { setOpen(false); btn.focus(); return; }
    if (e.key !== 'Tab') return;
    // Keep keyboard focus inside the open menu (button + panel links).
    var items = [btn].concat(Array.prototype.slice.call(panel.querySelectorAll('a')));
    var i = items.indexOf(document.activeElement);
    if (e.shiftKey && i <= 0) { e.preventDefault(); items[items.length - 1].focus(); }
    else if (!e.shiftKey && i === items.length - 1) { e.preventDefault(); items[0].focus(); }
  });
  // Rotating or resizing past the phone layout closes the menu.
  window.matchMedia('(min-width: 561px)').addEventListener('change', function (m) { if (m.matches && !panel.hidden) setOpen(false); });
})();

// Language switcher: keep the section the visitor is on (#work, #contact…) when changing language.
document.querySelectorAll('.lang-switch a, .mobile-menu__langs a').forEach(function (a) {
  a.addEventListener('click', function () {
    if (location.hash && a.href.indexOf('#') === -1) a.href += location.hash;
  });
});

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
  box.setAttribute('aria-label', T.imageViewer);
  box.innerHTML = '<button type="button" class="lightbox-close" aria-label="' + T.close + '">×</button>' +
    '<div class="lightbox-stage"><img alt=""></div>' +
    '<p class="lightbox-hint">' + T.zoomHint + '</p>';
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
      label.textContent = v ? T.closeMenus : T.openMenus;
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
  var links = document.querySelectorAll('a[data-email], button[data-copy-email]');
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
      var addr = a.getAttribute('data-email') || a.getAttribute('data-copy-email');
      var done = function () { show(T.emailCopied + addr); };
      if (navigator.clipboard && navigator.clipboard.writeText) {
        navigator.clipboard.writeText(addr).then(done, function () { show(T.writeTo + addr); });
      } else {
        show(T.writeTo + addr);
      }
    });
  });
})();

// Project 1 · color tokens: the accordion slides in, then its callouts, then the controls.
// It plays on its own (token types of one skin, then the next skin) until the visitor picks
// a skin or a token type; it resumes after a few idle seconds.
(function () {
  var root = document.querySelector('[data-tokens]');
  if (!root) return;
  var SKINS = {
    ocean:    { 'surface-page': '#0B101E', 'surface-card': '#232B3F', 'surface-row-alt': '#192136', 'surface-selected': '#305B86', 'border-accent': '#418CE2', 'border-card': '#20456A', 'border-odds': '#7A93AA', 'text-primary': '#FFFFFF', 'text-selected': '#FFFFFF', 'text-action': '#7A93AA', 'text-odds': '#D6D6D6', 'icon-primary': '#FFFFFF', 'icon-action': '#7A93AA' },
    red:      { 'surface-page': '#0B101E', 'surface-card': '#222631', 'surface-row-alt': '#1B1E27', 'surface-selected': '#851F33', 'border-accent': '#C92A38', 'border-card': '#3A3D45', 'border-odds': '#A7A7A7', 'text-primary': '#FFFFFF', 'text-selected': '#FFFFFF', 'text-action': '#A7A7A7', 'text-odds': '#D6D6D6', 'icon-primary': '#FFFFFF', 'icon-action': '#A7A7A7' },
    forest:   { 'surface-page': '#323030', 'surface-card': '#403F3F', 'surface-row-alt': '#1F1F21', 'surface-selected': '#506A1C', 'border-accent': '#97C15C', 'border-card': '#555555', 'border-odds': '#A7A7A7', 'text-primary': '#FFFFFF', 'text-selected': '#FFFFFF', 'text-action': '#A7A7A7', 'text-odds': '#D6D6D6', 'icon-primary': '#FFFFFF', 'icon-action': '#A7A7A7' },
    gold:     { 'surface-page': '#F0F1F3', 'surface-card': '#FFFFFF', 'surface-row-alt': '#D1D1D1', 'surface-selected': '#B0A88D', 'border-accent': '#BAAC71', 'border-card': '#B0A88D', 'border-odds': '#515661', 'text-primary': '#000000', 'text-selected': '#000000', 'text-action': '#515661', 'text-odds': '#000000', 'icon-primary': '#000000', 'icon-action': '#515661' },
    autumn:   { 'surface-page': '#191919', 'surface-card': '#403F3F', 'surface-row-alt': '#272727', 'surface-selected': '#9A6421', 'border-accent': '#F19D38', 'border-card': '#6E6D6D', 'border-odds': '#A7A7A7', 'text-primary': '#FFFFFF', 'text-selected': '#FFFFFF', 'text-action': '#A7A7A7', 'text-odds': '#D6D6D6', 'icon-primary': '#FFFFFF', 'icon-action': '#A7A7A7' },
    sapphire: { 'surface-page': '#041441', 'surface-card': '#51596B', 'surface-row-alt': '#484E5F', 'surface-selected': '#851F33', 'border-accent': '#C92A38', 'border-card': '#818FB4', 'border-odds': '#FFFFFF', 'text-primary': '#FFFFFF', 'text-selected': '#FFFFFF', 'text-action': '#FFFFFF', 'text-odds': '#D6D6D6', 'icon-primary': '#FFFFFF', 'icon-action': '#FFFFFF' },
    sky:      { 'surface-page': '#DEE1E7', 'surface-card': '#F0F1F3', 'surface-row-alt': '#D7DEE4', 'surface-selected': '#20456A', 'border-accent': '#418CE2', 'border-card': '#5D80C8', 'border-odds': '#20456A', 'text-primary': '#20456A', 'text-selected': '#F0F1F3', 'text-action': '#20456A', 'text-odds': '#20456A', 'icon-primary': '#20456A', 'icon-action': '#20456A' }
  };
  var VARS = { 'surface-page': '--c-page', 'surface-card': '--c-card', 'surface-row-alt': '--c-row-alt', 'surface-selected': '--c-selected', 'border-accent': '--c-b-accent', 'border-card': '--c-b-card', 'border-odds': '--c-b-odds', 'text-primary': '--c-t-primary', 'text-selected': '--c-t-selected', 'text-action': '--c-t-action', 'text-odds': '--c-t-odds', 'icon-primary': '--c-i-primary', 'icon-action': '--c-i-action' };
  var SKIN_ORDER = ['ocean', 'red', 'forest', 'gold', 'autumn', 'sapphire', 'sky'];
  var CAT_ORDER = ['surface', 'border', 'text', 'icon'];
  var STEP = 3200, IDLE = 8000;
  var reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var wide = window.matchMedia('(min-width: 900px)');

  var acc = root.querySelector('[data-tk-acc]');
  var wrap = root.querySelector('.tk-acc-wrap');
  var board = root.querySelector('.tk-board');
  var svg = root.querySelector('.tk-lines');
  var boxes = { top: root.querySelector('.tk-notes--top'), left: root.querySelector('.tk-notes--left'), bottom: root.querySelector('.tk-notes--bottom') };
  var src = [].slice.call(root.querySelectorAll('.tk-src li'));
  var skinBtns = [].slice.call(root.querySelectorAll('[data-skin]'));
  var catBtns = [].slice.call(root.querySelectorAll('.tk-cats [data-cat]'));
  var state = { skin: 'ocean', cat: 'surface' }, notes = [], marks = [], timer = null, idleTimer = null, started = false;
  root.style.setProperty('--tk-step', STEP + 'ms');

  function paintSkin() {
    var s = SKINS[state.skin];
    Object.keys(VARS).forEach(function (k) { acc.style.setProperty(VARS[k], s[k]); });
    notes.forEach(function (n) {
      var hex = s[n.dataset.token];
      n.querySelector('.tk-note__sw').style.setProperty('--sw', hex);
      n.querySelector('.tk-hex').textContent = hex;
    });
    skinBtns.forEach(function (b) { b.setAttribute('aria-pressed', String(b.dataset.skin === state.skin)); });
    var on = root.querySelector('.tk-skins [aria-pressed="true"]'), strip = on.parentNode; // keep the active skin in view on phones
    if (strip.scrollWidth > strip.clientWidth) strip.scrollTo({ left: on.offsetLeft - (strip.clientWidth - on.offsetWidth) / 2, behavior: reduce ? 'auto' : 'smooth' });
  }

  function anchorOf(li) {
    var t = acc.querySelector('[data-t="' + li.dataset.target + '"]');
    var b = board.getBoundingClientRect(), r = t.getBoundingClientRect();
    return { x: r.left - b.left + r.width * parseFloat(li.dataset.ax), y: r.top - b.top + r.height * parseFloat(li.dataset.ay) };
  }

  function drawLines() {
    svg.innerHTML = '';
    var b = board.getBoundingClientRect();
    marks.forEach(function (m, i) {
      var a = anchorOf(m.li);
      if (!wide.matches && m.li.dataset.side === 'left') a.x = acc.getBoundingClientRect().left - b.left; // phones: on the component's outer edge
      m.el.style.left = a.x + 'px'; m.el.style.top = a.y + 'px';
      if (!wide.matches) return;
      var r = notes[i].getBoundingClientRect(), side = m.li.dataset.side, d;
      if (side === 'left') {
        var sx = r.right - b.left, sy = r.top - b.top + r.height / 2, mx = sx + (a.x - sx) * .55;
        d = 'M' + sx + ' ' + sy + ' H' + mx + ' V' + a.y + ' H' + a.x;
      } else {
        var cx = r.left - b.left + r.width / 2, cy = side === 'top' ? r.bottom - b.top : r.top - b.top, my = cy + (a.y - cy) * .5;
        d = 'M' + cx + ' ' + cy + ' V' + my + ' H' + a.x + ' V' + a.y;
      }
      var p = document.createElementNS('http://www.w3.org/2000/svg', 'path');
      p.setAttribute('d', d);
      p.style.setProperty('--i', i);
      svg.appendChild(p);
      var len = p.getTotalLength();
      p.style.setProperty('--len', len);
      if (m.el.classList.contains('is-on')) {
        if (reduce) p.classList.add('is-on'); else requestAnimationFrame(function () { requestAnimationFrame(function () { p.classList.add('is-on'); }); });
      }
    });
  }

  function render(animate) {
    notes.forEach(function (n) { n.remove(); });
    marks.forEach(function (m) { m.el.remove(); });
    notes = []; marks = [];
    var list = src.filter(function (li) { return li.dataset.cat === state.cat; });
    list.forEach(function (li, i) {
      var n = document.createElement('div');
      n.className = 'tk-note';
      n.dataset.token = li.dataset.token;
      n.style.setProperty('--i', i);
      n.innerHTML = '<span class="tk-note__num">' + (i + 1) + '</span><span class="tk-note__sw"></span><span class="tk-note__txt">'
        + li.querySelector('code').outerHTML + '<small><span class="tk-hex"></span> · ' + li.querySelector('span').innerHTML + '</small></span>';
      (wide.matches ? boxes[li.dataset.side] : boxes.bottom).appendChild(n);
      notes.push(n);
      var m = document.createElement('span');
      m.className = 'tk-mark';
      m.textContent = i + 1;
      m.dataset.side = li.dataset.side;
      m.style.setProperty('--i', i);
      board.appendChild(m);
      marks.push({ el: m, li: li });
    });
    boxes.bottom.classList.toggle('tk-notes--list', !wide.matches);
    catBtns.forEach(function (b) { b.setAttribute('aria-pressed', String(b.dataset.cat === state.cat)); });
    paintSkin();
    var show = function () {
      notes.concat(marks.map(function (m) { return m.el; })).forEach(function (el) { el.classList.add('is-on'); });
      drawLines();
    };
    drawLines();
    if (animate && !reduce) requestAnimationFrame(function () { requestAnimationFrame(show); }); else show();
  }

  // autoplay: next token type; after the last one, next skin
  function tick() {
    var ci = CAT_ORDER.indexOf(state.cat);
    if (ci === CAT_ORDER.length - 1) {
      state.cat = CAT_ORDER[0];
      state.skin = SKIN_ORDER[(SKIN_ORDER.indexOf(state.skin) + 1) % SKIN_ORDER.length];
    } else {
      state.cat = CAT_ORDER[ci + 1];
    }
    restartProgress();
    render(true);
  }
  function restartProgress() { root.classList.remove('is-auto'); void root.offsetWidth; if (timer) root.classList.add('is-auto'); }
  function play() { if (reduce || timer) return; timer = setInterval(tick, STEP); restartProgress(); }
  function stop() { clearInterval(timer); timer = null; root.classList.remove('is-auto'); }
  function userPick() { stop(); clearTimeout(idleTimer); idleTimer = setTimeout(play, IDLE); }

  skinBtns.forEach(function (b) { b.addEventListener('click', function () { state.skin = b.dataset.skin; userPick(); paintSkin(); }); });
  catBtns.forEach(function (b) { b.addEventListener('click', function () { state.cat = b.dataset.cat; userPick(); render(true); }); });

  // intro: accordion → callouts → controls, then autoplay; pauses while off screen
  function start() {
    started = true;
    root.classList.add('is-in');
    setTimeout(function () { render(true); }, reduce ? 0 : 650);
    setTimeout(function () { root.classList.add('is-ready'); play(); }, reduce ? 0 : 1700);
  }
  if ('IntersectionObserver' in window) {
    new IntersectionObserver(function (es) {
      es.forEach(function (e) {
        if (e.isIntersecting) { if (!started) start(); else if (!idleTimer || !timer) play(); }
        else stop();
      });
    }, { threshold: .35 }).observe(wrap);
  } else { start(); }

  var raf;
  function relayout() { cancelAnimationFrame(raf); raf = requestAnimationFrame(function () { if (started) render(false); }); }
  window.addEventListener('resize', relayout);
  if (wide.addEventListener) wide.addEventListener('change', relayout);
  if (document.fonts && document.fonts.ready) document.fonts.ready.then(relayout);
})();
