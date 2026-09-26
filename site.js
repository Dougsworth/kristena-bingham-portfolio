/* Kristena Bingham — portfolio motion */
(function () {
  var root = document.documentElement;
  var reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var finePointer = window.matchMedia('(pointer: fine)').matches;
  if (reduced) root.classList.add('reduced');

  function store(get, key, val) {
    try { return get ? sessionStorage.getItem(key) : sessionStorage.setItem(key, val); } catch (e) { return null; }
  }

  /* Film grain, generated once */
  (function () {
    var g = document.querySelector('.grain');
    if (!g) return;
    var c = document.createElement('canvas'); c.width = c.height = 180;
    var x = c.getContext('2d'), d = x.createImageData(180, 180);
    for (var i = 0; i < d.data.length; i += 4) { var v = Math.random() * 255; d.data[i] = d.data[i + 1] = d.data[i + 2] = v; d.data[i + 3] = 255; }
    x.putImageData(d, 0, 0);
    g.style.backgroundImage = 'url(' + c.toDataURL() + ')';
  })();

  /* Kingston clock */
  function tick() {
    var t = new Intl.DateTimeFormat('en-US', { hour: 'numeric', minute: '2-digit', timeZone: 'America/Jamaica' }).format(new Date());
    document.querySelectorAll('[data-clock]').forEach(function (el) { el.textContent = 'Kingston ' + t; });
  }
  tick(); setInterval(tick, 30000);

  /* Copy email */
  document.querySelectorAll('[data-copy]').forEach(function (btn) {
    btn.addEventListener('click', function () {
      var text = btn.getAttribute('data-copy'), label = btn.querySelector('span') || btn, old = label.textContent;
      function done(msg) { label.textContent = msg; setTimeout(function () { label.textContent = old; }, 1800); }
      if (navigator.clipboard) navigator.clipboard.writeText(text).then(function () { done('Copied'); }, function () { done(text); });
      else done(text);
    });
  });

  var curtain = document.querySelector('.curtain');
  var loader = document.querySelector('.loader');

  var navigating = false;
  function hideCurtain() {
    if (!curtain) return;
    if (window.gsap) window.gsap.set(curtain, { y: 0, yPercent: 101 });
    else curtain.style.transform = 'translateY(101%)';
  }
  window.addEventListener('pageshow', function (e) {
    if (e.persisted) { navigating = false; hideCurtain(); }
  });

  if (!window.gsap || reduced) {
    if (loader) loader.remove();
    root.classList.remove('js');
    window.__kbReady = true;
    return;
  }
  window.__kbReady = true;

  var gsap = window.gsap;
  gsap.registerPlugin(window.ScrollTrigger, window.SplitText);
  var ST = window.ScrollTrigger;
  /* Start the curtain off-screen using percentages only, so no pixel offset sneaks in */
  hideCurtain();
  /* Safety net: never leave the curtain covering the page */
  setTimeout(function () {
    if (!curtain || navigating) return;
    var r = curtain.getBoundingClientRect();
    if (r.bottom > 0 && r.top < window.innerHeight) gsap.to(curtain, { yPercent: -101, duration: 0.6, ease: 'power3.inOut' });
  }, 2600);

  /* Smooth, weighted scroll */
  var lenis = null;
  if (window.Lenis) {
    lenis = new window.Lenis({ lerp: 0.085, smoothWheel: true });
    lenis.on('scroll', ST.update);
    gsap.ticker.add(function (t) { lenis.raf(t * 1000); });
    gsap.ticker.lagSmoothing(0);
  }
  document.querySelectorAll('a[href^="#"]').forEach(function (a) {
    a.addEventListener('click', function (e) {
      var id = a.getAttribute('href');
      if (id.length < 2) return;
      var t = document.querySelector(id);
      if (!t) return;
      e.preventDefault();
      if (lenis) lenis.scrollTo(t, { offset: -20, duration: 1.4 }); else t.scrollIntoView({ behavior: 'smooth' });
    });
  });

  /* Nav tucks away while scrolling down, returns on the way up */
  var navEl = document.querySelector('.nav');
  if (navEl) {
    ST.create({ start: 0, end: 'max', onUpdate: function (self) {
      var hide = self.direction === 1 && self.scroll() > 140;
      gsap.to(navEl, { yPercent: hide ? -110 : 0, duration: 0.45, ease: 'power3.out', overwrite: true });
    } });
  }

  /* Scroll progress hairline */
  gsap.to('.progress', { scaleX: 1, ease: 'none', scrollTrigger: { start: 0, end: 'max', scrub: 0.3 } });

  /* Page transitions */
  document.querySelectorAll('a[data-transition]').forEach(function (a) {
    a.addEventListener('click', function (e) {
      if (e.metaKey || e.ctrlKey || e.shiftKey || !curtain) return;
      e.preventDefault();
      navigating = true;
      var color = a.getAttribute('data-color') || '#7C5CFF';
      curtain.style.background = color;
      store(false, 'kb-curtain', color);
      gsap.fromTo(curtain, { y: 0, yPercent: 101 }, { yPercent: 0, duration: 0.75, ease: 'power4.inOut', onComplete: function () { window.location.href = a.href; } });
    });
  });

  /* Entrance */
  function entrance() {
    gsap.set('[data-kinetic], [data-lines]', { visibility: 'visible' });
    var tl = gsap.timeline({ defaults: { ease: 'expo.out' } });
    var name = document.querySelector('[data-kinetic]');
    if (name) {
      var split = new window.SplitText(name, { type: 'chars,lines', linesClass: 'line-mask', charsClass: 'char' });
      tl.from(split.chars, { yPercent: 118, rotate: 7, duration: 1.4, stagger: 0.035 }, 0);
      if (finePointer) kinetic(name, split.chars);
    }
    document.querySelectorAll('[data-lines]').forEach(function (el, i) {
      var s = new window.SplitText(el, { type: 'lines', linesClass: 'line-mask', mask: 'lines' });
      tl.from(s.lines, { yPercent: 110, duration: 1.3, stagger: 0.09 }, 0.1 + i * 0.1);
    });
    tl.to('.hero .reveal-up, .case-hero .reveal-up', { opacity: 1, y: 0, duration: 1.2, stagger: 0.08 }, 0.5);
  }

  var incoming = store(true, 'kb-curtain');
  var seen = store(true, 'kb-seen') === '1';
  store(false, 'kb-seen', '1');

  if (loader && !seen) {
    var count = loader.querySelector('.count');
    var obj = { v: 0 };
    gsap.timeline()
      .to(obj, { v: 100, duration: 1.6, ease: 'power2.inOut', onUpdate: function () { count.textContent = String(Math.round(obj.v)).padStart(3, '0'); } })
      .to(loader, { yPercent: -100, duration: 1, ease: 'power4.inOut' }, '+=0.15')
      .add(entrance, '-=0.55')
      .add(function () { loader.remove(); });
  } else {
    if (loader) loader.remove();
    if (incoming && curtain) {
      store(false, 'kb-curtain', '');
      curtain.style.background = incoming;
      gsap.set(curtain, { y: 0, yPercent: 0 });
      gsap.to(curtain, { yPercent: -101, duration: 0.9, ease: 'power4.inOut', delay: 0.05 });
      gsap.delayedCall(0.35, entrance);
    } else {
      entrance();
    }
  }

  /* Kinetic type: letters widen and thicken near the pointer */
  function kinetic(el, chars) {
    var px = -9999, py = -9999, raf = null;
    function frame() {
      raf = null;
      chars.forEach(function (c) {
        var r = c.getBoundingClientRect();
        var d = Math.hypot(px - (r.left + r.width / 2), py - (r.top + r.height / 2));
        var k = Math.max(0, 1 - d / 420);
        c.style.setProperty('--w', (100 + k * 25).toFixed(1));
        c.style.setProperty('--g', Math.round(700 + k * 200));
      });
    }
    el.closest('.hero').addEventListener('pointermove', function (e) { px = e.clientX; py = e.clientY; if (!raf) raf = requestAnimationFrame(frame); });
    el.closest('.hero').addEventListener('pointerleave', function () { px = py = -9999; if (!raf) raf = requestAnimationFrame(frame); });
  }

  /* Scroll reveals */
  ST.batch('.reveal-up', {
    start: 'top 90%',
    onEnter: function (els) {
      els = els.filter(function (e) { return !e.closest('.hero') && !e.closest('.case-hero'); });
      gsap.to(els, { opacity: 1, y: 0, duration: 1.1, stagger: 0.08, ease: 'power3.out' });
    }
  });
  document.querySelectorAll('[data-lines-scroll]').forEach(function (el) {
    var s = new window.SplitText(el, { type: 'lines', linesClass: 'line-mask', mask: 'lines' });
    gsap.from(s.lines, { yPercent: 110, duration: 1.2, stagger: 0.08, ease: 'expo.out', scrollTrigger: { trigger: el, start: 'top 88%' } });
  });

  /* Images open up and settle as they scroll in */
  document.querySelectorAll('.clip').forEach(function (frame) {
    var img = frame.querySelector('img');
    gsap.to(frame, { clipPath: 'inset(0% 0% 0% 0% round 4px)', ease: 'none', scrollTrigger: { trigger: frame, start: 'top 95%', end: 'top 35%', scrub: 0.6 } });
    if (img) gsap.fromTo(img, { scale: 1.18 }, { scale: 1, ease: 'none', scrollTrigger: { trigger: frame, start: 'top bottom', end: 'bottom top', scrub: true } });
  });

  /* Statement: words light up as you read */
  var big = document.querySelector('.statement .big');
  if (big) {
    var sw = new window.SplitText(big, { type: 'words', wordsClass: 'word' });
    gsap.to(sw.words, { opacity: 1, stagger: 0.1, ease: 'none', scrollTrigger: { trigger: big, start: 'top 80%', end: 'bottom 45%', scrub: 0.4 } });
  }

  /* Marquee that responds to scroll speed and direction */
  var track = document.querySelector('.marquee .track');
  if (track) {
    var x = 0, dir = -1, half = track.scrollWidth / 2, vel = 0;
    ST.create({ onUpdate: function (self) { dir = self.direction === 1 ? -1 : 1; vel = Math.min(Math.abs(self.getVelocity()) / 60, 18); } });
    gsap.ticker.add(function () {
      x += dir * (0.9 + vel); vel *= 0.92;
      if (x <= -half) x += half; if (x > 0) x -= half;
      track.style.transform = 'translate3d(' + x + 'px,0,0)';
    });
    window.addEventListener('resize', function () { half = track.scrollWidth / 2; });
  }

  /* Project list: floating preview and background flood */
  var floater = document.querySelector('.floater');
  var list = document.querySelector('.projects');
  if (floater && list && finePointer) {
    var fx = gsap.quickTo(floater, 'x', { duration: 0.7, ease: 'power3' });
    var fy = gsap.quickTo(floater, 'y', { duration: 0.7, ease: 'power3' });
    var imgs = floater.querySelectorAll('img');
    list.addEventListener('pointermove', function (e) {
      fx(e.clientX - floater.offsetWidth * 0.5);
      fy(e.clientY - floater.offsetHeight * 0.6);
    });
    list.querySelectorAll('.project a').forEach(function (a, i) {
      a.addEventListener('pointerenter', function () {
        var key = a.getAttribute('data-img');
        floater.classList.toggle('on', !!key);
        imgs.forEach(function (im) { im.classList.toggle('on', im.getAttribute('data-key') === key); });
        document.body.style.setProperty('--flood', a.getAttribute('data-color'));
      });
    });
    list.addEventListener('pointerleave', function () {
      floater.classList.remove('on');
      document.body.style.setProperty('--flood', '#0D0B14');
    });
  }

  /* Custom cursor */
  var cursor = document.querySelector('.cursor');
  if (cursor && finePointer) {
    var cx = gsap.quickTo(cursor, 'x', { duration: 0.25, ease: 'power3' });
    var cy = gsap.quickTo(cursor, 'y', { duration: 0.25, ease: 'power3' });
    window.addEventListener('pointermove', function (e) { cx(e.clientX); cy(e.clientY); });
    document.querySelectorAll('[data-cursor]').forEach(function (el) {
      el.addEventListener('pointerenter', function () { cursor.classList.add('big'); cursor.querySelector('span').textContent = el.getAttribute('data-cursor'); });
      el.addEventListener('pointerleave', function () { cursor.classList.remove('big'); });
    });
  }

  /* Magnetic button */
  document.querySelectorAll('.magnet').forEach(function (m) {
    if (!finePointer) return;
    var mx = gsap.quickTo(m, 'x', { duration: 0.6, ease: 'power3' });
    var my = gsap.quickTo(m, 'y', { duration: 0.6, ease: 'power3' });
    m.parentElement.addEventListener('pointermove', function (e) {
      var r = m.getBoundingClientRect();
      var dx = e.clientX - (r.left + r.width / 2), dy = e.clientY - (r.top + r.height / 2);
      if (Math.hypot(dx, dy) < 220) { mx(dx * 0.35); my(dy * 0.35); } else { mx(0); my(0); }
    });
    m.parentElement.addEventListener('pointerleave', function () { gsap.to(m, { x: 0, y: 0, duration: 1, ease: 'elastic.out(1, 0.4)' }); });
  });

  /* Horizontal screen galleries: pinned and driven by vertical scroll */
  var wideScreen = window.matchMedia('(min-width: 821px) and (hover: hover)').matches;
  document.querySelectorAll('.gallery').forEach(function (g) {
    var rail = g.querySelector('.rail');
    if (!rail || !wideScreen) return;
    function dist() { return Math.max(0, rail.scrollWidth - window.innerWidth); }
    gsap.to(rail, { x: function () { return -dist(); }, ease: 'none', scrollTrigger: { trigger: g, start: 'center center', end: function () { return '+=' + dist(); }, pin: true, scrub: 0.7, invalidateOnRefresh: true, anticipatePin: 1 } });
  });

  /* Highlight numbers count up */
  document.querySelectorAll('[data-count]').forEach(function (el) {
    var end = parseFloat(el.getAttribute('data-count')), o = { v: 0 };
    var suffix = el.getAttribute('data-suffix') || '';
    ST.create({ trigger: el, start: 'top 88%', once: true, onEnter: function () {
      gsap.to(o, { v: end, duration: 1.4, ease: 'power3.out', onUpdate: function () { el.firstChild.nodeValue = Math.round(o.v) + suffix; } });
    } });
  });

  /* Re-measure pinned sections whenever an image finishes loading */
  var refreshTimer = null;
  function queueRefresh() { clearTimeout(refreshTimer); refreshTimer = setTimeout(function () { ST.refresh(); }, 120); }
  document.querySelectorAll('img').forEach(function (im) { if (!im.complete) im.addEventListener('load', queueRefresh, { once: true }); });
  window.addEventListener('load', queueRefresh);

  /* Recalculate once web fonts land */
  if (document.fonts && document.fonts.ready) document.fonts.ready.then(function () { ST.refresh(); });
})();
