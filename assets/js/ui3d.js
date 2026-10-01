/* UI portfolio: Three.js scenes built from Kristena's real screens.
   - Home hero: the projects laid out as labelled sections on a design canvas; hover to select a frame, click to open it.
   - Project covers: the project's devices in 3D, tilting with the pointer, turning with scroll, and cycling screens.
   Falls back to the static images with reduced motion or no WebGL. */
import * as THREE from '/assets/js/vendor/three.module.min.js';

const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
const fine = window.matchMedia('(pointer: fine)').matches;
const small = () => window.innerWidth < 820;
function hasGL() { try { const c = document.createElement('canvas'); return !!(c.getContext('webgl2') || c.getContext('webgl')); } catch (e) { return false; } }

const IMG = '/assets/images/ui/';
const loader = new THREE.TextureLoader();
const cache = {};
function tex(src) {
  if (cache[src]) return cache[src];
  const t = loader.load(src);
  t.colorSpace = THREE.SRGBColorSpace; t.anisotropy = 8; t.generateMipmaps = true;
  return (cache[src] = t);
}

function rrShape(w, h, r) {
  const s = new THREE.Shape(), x = -w / 2, y = -h / 2;
  s.moveTo(x + r, y); s.lineTo(x + w - r, y); s.quadraticCurveTo(x + w, y, x + w, y + r);
  s.lineTo(x + w, y + h - r); s.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
  s.lineTo(x + r, y + h); s.quadraticCurveTo(x, y + h, x, y + h - r);
  s.lineTo(x, y + r); s.quadraticCurveTo(x, y, x + r, y);
  return s;
}
function rrPlane(w, h, r) {
  const g = new THREE.ShapeGeometry(rrShape(w, h, r), 10);
  const p = g.attributes.position, uv = g.attributes.uv;
  for (let i = 0; i < p.count; i++) uv.setXY(i, p.getX(i) / w + 0.5, p.getY(i) / h + 0.5);
  uv.needsUpdate = true; return g;
}
function slab(w, h, r, d, color, rough) {
  const g = new THREE.ExtrudeGeometry(rrShape(w, h, r), { depth: d, bevelEnabled: true, bevelThickness: d * 0.35, bevelSize: Math.min(r * 0.25, d * 0.5), bevelSegments: 3, curveSegments: 10 });
  g.translate(0, 0, -d / 2);
  return new THREE.Mesh(g, new THREE.MeshStandardMaterial({ color, roughness: rough, metalness: 0.15 }));
}
let shadowTex;
function shadowTexture() {
  if (shadowTex) return shadowTex;
  const c = document.createElement('canvas'); c.width = c.height = 256;
  const x = c.getContext('2d'); x.filter = 'blur(22px)'; x.fillStyle = 'rgba(0,0,0,0.55)';
  x.beginPath(); x.roundRect(48, 48, 160, 160, 30); x.fill();
  shadowTex = new THREE.CanvasTexture(c); return shadowTex;
}
function barTexture(url) {
  const c = document.createElement('canvas'); c.width = 1280; c.height = 56;
  const x = c.getContext('2d'); x.fillStyle = '#FBFAFD'; x.fillRect(0, 0, 1280, 56);
  x.fillStyle = '#E6E1EF'; [26, 50, 74].forEach((cx) => { x.beginPath(); x.arc(cx, 28, 7, 0, Math.PI * 2); x.fill(); });
  x.fillStyle = '#F1EFF6'; x.beginPath(); x.roundRect(400, 13, 480, 30, 8); x.fill();
  x.fillStyle = '#8A8698'; x.font = '500 17px Inter, Arial, sans-serif'; x.textAlign = 'center'; x.textBaseline = 'middle'; x.fillText(url, 640, 29);
  const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; t.anisotropy = 8; return t;
}

/* A device: phone or browser window. Returns { group, screen, swap(src) } */
function device(kind, width, srcs, opts = {}) {
  const group = new THREE.Group();
  let sw, sh, screenZ;
  if (kind === 'phone') {
    sw = width; sh = width * 844 / 390;
    const b = width * 0.045, r = width * 0.16, d = width * 0.09;
    const body = slab(sw + 2 * b, sh + 2 * b, r + b, d, 0x121218, 0.35); group.add(body);
    screenZ = d / 2 + d * 0.35 + 0.004;
    var screenGeo = rrPlane(sw, sh, r * 0.9);
  } else if (kind === 'card') {
    sw = width; sh = width * (opts.aspect || 2); const r = width * 0.07, d = width * 0.03;
    const body = slab(sw, sh, r, d, 0xFFFFFF, 0.7); group.add(body);
    screenZ = d / 2 + d * 0.35 + 0.004;
    var screenGeo = rrPlane(sw * 0.985, sh * 0.99, r * 0.9);
  } else {
    sw = width; sh = width * 910 / 1280; const bar = width * 0.035, d = width * 0.02, r = width * 0.018;
    const body = slab(sw, sh + bar, r, d, 0xF4F2F8, 0.6); body.position.y = bar / 2; group.add(body);
    screenZ = d / 2 + d * 0.35 + 0.004;
    const barMesh = new THREE.Mesh(new THREE.PlaneGeometry(sw - r * 0.6, bar), new THREE.MeshBasicMaterial({ map: barTexture(opts.url || ''), toneMapped: false }));
    barMesh.position.set(0, sh / 2 + bar / 2, screenZ); group.add(barMesh);
    var screenGeo = new THREE.PlaneGeometry(sw, sh);
  }
  const mat = new THREE.MeshBasicMaterial({ map: tex(srcs[0]), toneMapped: false });
  const screen = new THREE.Mesh(screenGeo, mat); screen.position.z = screenZ; group.add(screen);
  const top = new THREE.Mesh(screenGeo, new THREE.MeshBasicMaterial({ map: tex(srcs[0]), toneMapped: false, transparent: true, opacity: 0 }));
  top.position.z = screenZ + 0.002; group.add(top);
  // preload the rest
  srcs.slice(1).forEach(tex);
  let idx = 0, fading = 0;
  return {
    group, screen, top, size: [sw, sh],
    next() {
      if (srcs.length < 2) return;
      idx = (idx + 1) % srcs.length;
      top.material.map = tex(srcs[idx]); top.material.opacity = 0; fading = 0.0001;
    },
    tick(dt) {
      if (!fading) return;
      fading = Math.min(1, fading + dt * 2.4); top.material.opacity = fading;
      if (fading >= 1) { mat.map = top.material.map; top.material.opacity = 0; fading = 0; }
    },
  };
}

function makeRenderer(canvas, clear) {
  const r = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: clear == null, powerPreference: 'high-performance' });
  r.setPixelRatio(Math.min(window.devicePixelRatio || 1, small() ? 1.5 : 2));
  if (clear != null) r.setClearColor(clear, 1);
  return r;
}
function lights(scene) {
  scene.add(new THREE.AmbientLight(0xffffff, 1.4));
  const d = new THREE.DirectionalLight(0xffffff, 2.2); d.position.set(-3, 5, 8); scene.add(d);
  const rim = new THREE.DirectionalLight(0xB69CFF, 1.2); rim.position.set(6, -2, -4); scene.add(rim);
}
const ease = (t) => 1 - Math.pow(1 - t, 4);
const clamp = (v, a, b) => Math.max(a, Math.min(b, v));

/* Shared pointer, smoothed */
const ptr = { x: 0, y: 0, sx: 0, sy: 0 };
window.addEventListener('pointermove', (e) => { ptr.x = (e.clientX / window.innerWidth) * 2 - 1; ptr.y = (e.clientY / window.innerHeight) * 2 - 1; }, { passive: true });

function visible(el, cb) {
  const io = new IntersectionObserver((es) => es.forEach((e) => cb(e.isIntersecting)), { rootMargin: '100px' });
  io.observe(el);
}

/* ---------------- Home hero: a tidy design canvas ----------------
   Four labelled sections in a 2 x 2 grid, one per project, like sections on a Figma canvas.
   Hover a frame to select it, click to open the project. */
const NAMES = { followup: 'FollowUp', commute: 'Kingston Commute', dutchpot: 'Dutchpot', rentscope: 'RentScope' };
const COLORS = { followup: '#7C5CFF', commute: '#1E7B4A', dutchpot: '#F4B526', rentscope: '#2456D3' };
const PH = 1.62;                       // frame height for phones and cards
const PW = PH * 390 / 844;             // phone width
const RS = { search: 1013 / 560, list: 1174 / 560, listing: 1189 / 560 };
const SECTIONS = [
  { proj: 'followup', col: 0, row: 0, frames: [['browser', ['dashboard', 'log', 'discussion'], 2.5, null, 'followup.app/my-tasks']] },
  { proj: 'commute', col: 1, row: 0, frames: [['phone', ['plan'], PW], ['phone', ['live', 'delayed', 'unavailable'], PW], ['phone', ['compare'], PW]] },
  { proj: 'dutchpot', col: 0, row: 1, frames: [['phone', ['home'], PW], ['phone', ['recipe', 'basket', 'delivery'], PW], ['phone', ['tracking'], PW]] },
  { proj: 'rentscope', col: 1, row: 1, frames: [['card', ['list'], PH / RS.list, RS.list], ['card', ['search'], PH / RS.search, RS.search], ['card', ['listing'], PH / RS.listing, RS.listing]] },
];
const CELL_W = 2.9, CELL_H = 2.35, GAP_X = 0.5, GAP_Y = 0.25, FGAP = 0.14;

function labelTexture(text, color) {
  const c = document.createElement('canvas'); c.width = 1024; c.height = 96;
  const x = c.getContext('2d');
  x.fillStyle = color; x.fillRect(4, 30, 30, 30);
  x.fillStyle = 'rgba(238,236,230,0.82)'; x.font = '500 46px "IBM Plex Mono", ui-monospace, monospace'; x.textBaseline = 'middle';
  x.fillText(text.toUpperCase(), 56, 49);
  const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; t.anisotropy = 8; return t;
}
function dotTexture() {
  const c = document.createElement('canvas'); c.width = c.height = 64;
  const x = c.getContext('2d'); x.fillStyle = 'rgba(238,236,230,0.16)'; x.beginPath(); x.arc(32, 32, 2.2, 0, Math.PI * 2); x.fill();
  const t = new THREE.CanvasTexture(c); t.wrapS = t.wrapT = THREE.RepeatWrapping; return t;
}
function fadeMask() {
  const c = document.createElement('canvas'); c.width = c.height = 256;
  const x = c.getContext('2d'); const g = x.createRadialGradient(128, 128, 40, 128, 128, 128);
  g.addColorStop(0, '#fff'); g.addColorStop(1, '#000'); x.fillStyle = g; x.fillRect(0, 0, 256, 256);
  return new THREE.CanvasTexture(c);
}
function outline(w, h) {
  const p = 0.05, g = new THREE.BufferGeometry().setFromPoints([
    new THREE.Vector3(-w / 2 - p, -h / 2 - p, 0), new THREE.Vector3(w / 2 + p, -h / 2 - p, 0),
    new THREE.Vector3(w / 2 + p, h / 2 + p, 0), new THREE.Vector3(-w / 2 - p, h / 2 + p, 0)]);
  const l = new THREE.LineLoop(g, new THREE.LineBasicMaterial({ color: 0x0D99FF, transparent: true, opacity: 0 }));
  return l;
}

function initHome(hero) {
  const wrap = document.createElement('div'); wrap.className = 'hero-3d'; wrap.setAttribute('aria-hidden', 'true');
  const canvas = document.createElement('canvas'); wrap.appendChild(canvas); hero.prepend(wrap);
  const renderer = makeRenderer(canvas, null);
  const scene = new THREE.Scene(); lights(scene);
  const camera = new THREE.PerspectiveCamera(35, 1, 0.1, 60); camera.position.set(0, 0, 10);
  const board = new THREE.Group(); scene.add(board);

  // dotted canvas behind the sections
  const dots = dotTexture(); dots.repeat.set(26, 22);
  const grid = new THREE.Mesh(new THREE.PlaneGeometry(2 * CELL_W + GAP_X + 2.4, 2 * CELL_H + GAP_Y + 2.2),
    new THREE.MeshBasicMaterial({ map: dots, alphaMap: fadeMask(), transparent: true, depthWrite: false }));
  grid.position.z = -0.25; board.add(grid);

  const frames = [];
  SECTIONS.forEach((S, si) => {
    const cx = (S.col - 0.5) * (CELL_W + GAP_X), cy = (0.5 - S.row) * (CELL_H + GAP_Y);
    const sec = new THREE.Group(); sec.position.set(cx, cy, 0); board.add(sec);
    const lab = new THREE.Mesh(new THREE.PlaneGeometry(2.4, 0.225), new THREE.MeshBasicMaterial({ map: labelTexture(NAMES[S.proj], COLORS[S.proj]), transparent: true, depthWrite: false }));
    lab.position.set(-CELL_W / 2 + 1.2, CELL_H / 2 - 0.08, 0.01); sec.add(lab);
    const devs = S.frames.map(([kind, screens, w, aspect, url]) => device(kind, w, screens.map((s) => `${IMG}${S.proj}/screens/${s}.jpg`), { aspect, url }));
    const total = devs.reduce((a, d) => a + d.size[0], 0) + FGAP * (devs.length - 1);
    let x = -total / 2;
    devs.forEach((dev, fi) => {
      const holder = new THREE.Group();
      const fh = dev.size[1] + (S.frames[fi][0] === 'browser' ? dev.size[0] * 0.035 : 0);
      holder.position.set(x + dev.size[0] / 2, -0.13, 0); x += dev.size[0] + FGAP;
      holder.add(dev.group);
      const ol = outline(dev.size[0], fh); ol.position.set(0, S.frames[fi][0] === 'browser' ? dev.size[0] * 0.0175 : 0, 0.08); holder.add(ol);
      sec.add(holder);
      const i = frames.length;
      dev.screen.userData.i = i; dev.top.userData.i = i;
      frames.push({ dev, holder, ol, proj: S.proj, si, hover: 0, cycles: S.frames[fi][1].length > 1 });
    });
  });
  const hits = frames.flatMap((f) => [f.dev.screen, f.dev.top]);

  let baseScale = 1;
  function size() {
    const w = hero.clientWidth, h = hero.clientHeight;
    renderer.setSize(w, h, false); camera.aspect = w / h; camera.updateProjectionMatrix();
    const vh = 2 * Math.tan(THREE.MathUtils.degToRad(camera.fov / 2)) * camera.position.z, vw = vh * camera.aspect;
    const bw = 2 * CELL_W + GAP_X, bh = 2 * CELL_H + GAP_Y;
    if (small()) {
      baseScale = Math.min((vw * 0.94) / bw, (vh * 0.42) / bh);
      board.position.set(0, vh / 2 - (bh * baseScale) / 2 - vh * 0.1, 0);
    } else {
      // right-hand 47% of the hero, above the intro row
      baseScale = Math.min((vw * 0.5) / bw, (vh * 0.68) / bh);
      board.position.set(vw / 2 - (bw * baseScale) / 2 - vw * 0.04, vh / 2 - (bh * baseScale) / 2 - vh * 0.1, 0);
    }
    board.scale.setScalar(baseScale);
  }
  size(); window.addEventListener('resize', size);

  const ray = new THREE.Raycaster(), m = new THREE.Vector2();
  const cursor = document.querySelector('.cursor'); const label = cursor && cursor.querySelector('span');
  let hovered = -1;
  hero.addEventListener('pointermove', (e) => {
    const r = canvas.getBoundingClientRect();
    m.set(((e.clientX - r.left) / r.width) * 2 - 1, -((e.clientY - r.top) / r.height) * 2 + 1);
    ray.setFromCamera(m, camera);
    const hit = ray.intersectObjects(hits, false)[0];
    const i = hit && !e.target.closest('a,button') ? hit.object.userData.i : -1;
    if (i !== hovered) {
      hovered = i; hero.classList.toggle('over-screen', i >= 0);
      if (cursor && label) { if (i >= 0) { cursor.classList.add('big'); label.textContent = NAMES[frames[i].proj]; } else { cursor.classList.remove('big'); label.textContent = ''; } }
    }
  });
  hero.addEventListener('pointerleave', () => { hovered = -1; hero.classList.remove('over-screen'); if (cursor) cursor.classList.remove('big'); });
  hero.addEventListener('click', (e) => {
    if (hovered < 0 || e.target.closest('a,button')) return;
    const link = document.querySelector(`.work-card[href="/${frames[hovered].proj}"]`);
    if (link) link.click();
  });

  let on = true, last = performance.now(), cycle = 0, turn = 0;
  const t0 = performance.now() + (document.querySelector('.loader') ? 1300 : 150);
  visible(hero, (v) => { on = v; if (v) { last = performance.now(); requestAnimationFrame(frame); } });
  function frame(now) {
    if (!on) return;
    const dt = Math.min(0.05, (now - last) / 1000); last = now;
    ptr.sx += (ptr.x - ptr.sx) * 0.05; ptr.sy += (ptr.y - ptr.sy) * 0.05;
    const p = clamp(window.scrollY / Math.max(1, hero.offsetHeight), 0, 1);
    const tilt = small() ? 0 : 1;
    board.rotation.y = (-0.26 + ptr.sx * 0.07) * tilt * (1 - p * 0.7);
    board.rotation.x = (0.06 + ptr.sy * 0.05) * tilt;
    camera.position.z = 10 - ease(p) * 3.5;
    // one section's frames change screens at a time, in order
    cycle += dt;
    if (cycle > 2.6) { cycle = 0; const pick = frames.filter((f) => f.cycles); if (pick.length) pick[turn++ % pick.length].dev.next(); }
    frames.forEach((f, i) => {
      const a = ease(clamp(((now - t0) / 1000 - f.si * 0.14 - (i % 3) * 0.05) / 1.1, 0, 1));
      f.hover += ((hovered === i ? 1 : 0) - f.hover) * 0.15;
      f.holder.position.z = -(1 - a) * 2.5 + f.hover * 0.22;
      f.holder.scale.setScalar((0.94 + a * 0.06) * (1 + f.hover * 0.03));
      f.ol.material.opacity = f.hover;
      f.dev.tick(dt);
    });
    renderer.render(scene, camera);
    requestAnimationFrame(frame);
  }
  if (document.fonts && document.fonts.load) document.fonts.load('500 46px "IBM Plex Mono"').catch(() => {});
  requestAnimationFrame(frame);
}


/* ---------------- Home hero, version 2: Showcase ----------------
   One project at a time on a brand-coloured stage. The device turns away and the next one turns in.
   A numbered index on the left switches projects; clicking the device opens the project. */
const SHOW = [
  { proj: 'followup', type: 'Responsive web app', color: '#6739F5', kind: 'browser', screens: ['dashboard', 'log', 'discussion', 'approval'], w: 4.3, url: 'followup.app/my-tasks' },
  { proj: 'commute', type: 'Mobile app', color: '#0D6139', kind: 'phone', screens: ['live', 'plan', 'compare', 'delayed'], w: 1.62 },
  { proj: 'dutchpot', type: 'Concept mobile app', color: '#E2A21C', kind: 'phone', screens: ['recipe', 'home', 'basket', 'tracking'], w: 1.62 },
  { proj: 'rentscope', type: 'Web app · Data-led UX', color: '#2456D3', kind: 'card', screens: ['search'], w: 3.5 / (1013 / 560), aspect: 1013 / 560 },
];
function initShowcase(hero) {
  hero.classList.add('hero-show');
  const wrap = document.createElement('div'); wrap.className = 'hero-3d'; wrap.setAttribute('aria-hidden', 'true');
  const canvas = document.createElement('canvas'); wrap.appendChild(canvas); hero.prepend(wrap);
  // the index
  const idx = document.createElement('ol'); idx.className = 'hero-index';
  idx.innerHTML = SHOW.map((s, i) => `<li><button type="button" data-i="${i}"><span class="n">0${i + 1}</span><span class="t">${NAMES[s.proj]}</span><span class="k">${s.type}</span><i></i></button></li>`).join('');
  hero.appendChild(idx);
  const renderer = makeRenderer(canvas, null);
  const scene = new THREE.Scene(); lights(scene);
  const camera = new THREE.PerspectiveCamera(32, 1, 0.1, 60); camera.position.set(0, 0, 11);
  const stageG = new THREE.Group(); scene.add(stageG);
  const panelMat = new THREE.MeshBasicMaterial({ color: new THREE.Color(SHOW[0].color), toneMapped: false });
  const panel = new THREE.Mesh(rrPlane(5.6, 4.4, 0.08), panelMat); panel.position.z = -0.6; stageG.add(panel);
  const items = SHOW.map((S) => {
    const dev = device(S.kind, S.w, S.screens.map((s) => `${IMG}${S.proj}/screens/${s}.jpg`), { url: S.url, aspect: S.aspect });
    const holder = new THREE.Group(); holder.add(dev.group); stageG.add(holder);
    const sh = new THREE.Mesh(new THREE.PlaneGeometry(dev.size[0] * 1.5, dev.size[1] * 1.45), new THREE.MeshBasicMaterial({ map: shadowTexture(), transparent: true, depthWrite: false, opacity: 0.5 }));
    sh.position.set(0.25, -0.3, -0.45); holder.add(sh);
    if (S.kind === 'phone') { // a second phone behind, for depth
      const d2 = device('phone', S.w * 0.9, [`${IMG}${S.proj}/screens/${S.screens[1]}.jpg`]);
      d2.group.position.set(S.w * 0.95, -0.05, -0.35); d2.group.rotation.y = -0.18; holder.add(d2.group);
      dev.group.position.x = -S.w * 0.45;
    }
    holder.visible = false;
    return { S, dev, holder, w: 0 };
  });
  let active = 0, timer = 0;
  const buttons = [...idx.querySelectorAll('button')];
  function go(i) { active = (i + items.length) % items.length; timer = 0; buttons.forEach((b, j) => b.classList.toggle('on', j === active)); }
  buttons.forEach((b, i) => { b.addEventListener('click', () => go(i)); b.addEventListener('pointerenter', () => fine && go(i)); });
  go(0);
  function size() {
    const w = hero.clientWidth, h = hero.clientHeight;
    renderer.setSize(w, h, false); camera.aspect = w / h; camera.updateProjectionMatrix();
    const vh = 2 * Math.tan(THREE.MathUtils.degToRad(camera.fov / 2)) * camera.position.z, vw = vh * camera.aspect;
    if (small()) { const s = Math.min(vw * 0.9 / 5.6, vh * 0.4 / 4.4); stageG.scale.setScalar(s); stageG.position.set(0, vh / 2 - 4.4 * s / 2 - vh * 0.1, 0); }
    else { const s = Math.min(vw * 0.46 / 5.6, vh * 0.72 / 4.4); stageG.scale.setScalar(s); stageG.position.set(vw / 2 - 5.6 * s / 2 - vw * 0.045, vh / 2 - 4.4 * s / 2 - vh * 0.1, 0); }
  }
  size(); window.addEventListener('resize', size);
  const ray = new THREE.Raycaster(), m = new THREE.Vector2();
  const cursor = document.querySelector('.cursor'); const label = cursor && cursor.querySelector('span');
  let over = false;
  hero.addEventListener('pointermove', (e) => {
    const r = canvas.getBoundingClientRect();
    m.set(((e.clientX - r.left) / r.width) * 2 - 1, -((e.clientY - r.top) / r.height) * 2 + 1);
    ray.setFromCamera(m, camera);
    const o = !e.target.closest('a,button') && ray.intersectObject(panel, false).length > 0;
    if (o !== over) { over = o; hero.classList.toggle('over-screen', o); if (cursor && label) { cursor.classList.toggle('big', o); label.textContent = o ? 'Open' : ''; } }
  });
  hero.addEventListener('pointerleave', () => { over = false; hero.classList.remove('over-screen'); cursor && cursor.classList.remove('big'); });
  hero.addEventListener('click', (e) => { if (!over || e.target.closest('a,button')) return; const l = document.querySelector(`.work-card[href="/${SHOW[active].proj}"]`); if (l) l.click(); });
  const target = new THREE.Color();
  let on = true, last = performance.now(), swap = 0;
  visible(hero, (v) => { on = v; if (v) { last = performance.now(); requestAnimationFrame(frame); } });
  function frame(now) {
    if (!on) return;
    const dt = Math.min(0.05, (now - last) / 1000); last = now;
    ptr.sx += (ptr.x - ptr.sx) * 0.05; ptr.sy += (ptr.y - ptr.sy) * 0.05;
    timer += dt; swap += dt;
    if (timer > 5.5) go(active + 1);
    if (swap > 1.9) { swap = 0; items[active].dev.next(); }
    idx.style.setProperty('--p', Math.min(1, timer / 5.5));
    target.set(SHOW[active].color); panelMat.color.lerp(target, 0.08);
    const p = clamp(window.scrollY / Math.max(1, hero.offsetHeight), 0, 1);
    stageG.rotation.y = (fine ? ptr.sx * 0.12 : 0) - 0.08 + p * 0.3;
    stageG.rotation.x = (fine ? ptr.sy * 0.06 : 0);
    items.forEach((it, i) => {
      it.w += ((i === active ? 1 : 0) - it.w) * 0.09;
      it.holder.visible = it.w > 0.12;
      const dir = i === active ? 1 : -1;
      it.holder.rotation.y = (1 - it.w) * 0.9 * dir;
      it.holder.position.set((1 - it.w) * 1.6 * dir, Math.sin(now / 1100) * 0.05, (1 - it.w) * -1.5);
      it.holder.scale.setScalar(0.55 + it.w * 0.45);
      it.dev.tick(dt);
    });
    renderer.render(scene, camera);
    requestAnimationFrame(frame);
  }
  requestAnimationFrame(frame);
}

/* ---------------- Home hero, version 3: Deck ----------------
   The four project covers fanned like a hand of cards. Hover lifts a card, click opens it. */
function initDeck(hero) {
  hero.classList.add('hero-deck');
  const wrap = document.createElement('div'); wrap.className = 'hero-3d'; wrap.setAttribute('aria-hidden', 'true');
  const canvas = document.createElement('canvas'); wrap.appendChild(canvas); hero.prepend(wrap);
  const renderer = makeRenderer(canvas, null);
  const scene = new THREE.Scene(); lights(scene);
  const camera = new THREE.PerspectiveCamera(32, 1, 0.1, 60); camera.position.set(0, 0, 11);
  const deck = new THREE.Group(); scene.add(deck);
  const P = ['followup', 'commute', 'dutchpot', 'rentscope'];
  const CW = 3.4, CH = CW / 1.6;
  const cards = P.map((proj, i) => {
    const pivot = new THREE.Group(); deck.add(pivot);
    const g = new THREE.Group(); g.position.y = CH / 2 + 0.6; pivot.add(g);
    const body = slab(CW, CH, 0.1, 0.04, 0x15121F, 0.6); g.add(body);
    const face = new THREE.Mesh(rrPlane(CW, CH, 0.1), new THREE.MeshBasicMaterial({ map: tex(`${IMG}${proj}/hero.jpg`), toneMapped: false }));
    face.position.z = 0.04; g.add(face); face.userData.i = i;
    const sh = new THREE.Mesh(new THREE.PlaneGeometry(CW * 1.35, CH * 1.45), new THREE.MeshBasicMaterial({ map: shadowTexture(), transparent: true, depthWrite: false, opacity: 0.6 }));
    sh.position.set(0.15, -0.2, -0.06); g.add(sh);
    return { proj, pivot, g, face, base: (i - 1.5) * 0.2, hover: 0, deal: 0 };
  });
  function size() {
    const w = hero.clientWidth, h = hero.clientHeight;
    renderer.setSize(w, h, false); camera.aspect = w / h; camera.updateProjectionMatrix();
    const vh = 2 * Math.tan(THREE.MathUtils.degToRad(camera.fov / 2)) * camera.position.z, vw = vh * camera.aspect;
    if (small()) { const s = Math.min(vw * 0.9 / 6.8, vh * 0.42 / 4.6); deck.scale.setScalar(s); deck.position.set(0, vh / 2 - vh * 0.48, 0); }
    else { const s = Math.min(vw * 0.48 / 5.4, vh * 0.78 / 4.6); deck.scale.setScalar(s); deck.position.set(vw / 2 - 5.4 * s / 2 - vw * 0.04, -vh * 0.18, 0); }
  }
  size(); window.addEventListener('resize', size);
  const ray = new THREE.Raycaster(), m = new THREE.Vector2();
  const cursor = document.querySelector('.cursor'); const label = cursor && cursor.querySelector('span');
  let hovered = -1;
  hero.addEventListener('pointermove', (e) => {
    const r = canvas.getBoundingClientRect();
    m.set(((e.clientX - r.left) / r.width) * 2 - 1, -((e.clientY - r.top) / r.height) * 2 + 1);
    ray.setFromCamera(m, camera);
    const hit = !e.target.closest('a,button') && ray.intersectObjects(cards.map((c) => c.face), false)[0];
    const i = hit ? hit.object.userData.i : -1;
    if (i !== hovered) { hovered = i; hero.classList.toggle('over-screen', i >= 0); if (cursor && label) { cursor.classList.toggle('big', i >= 0); label.textContent = i >= 0 ? NAMES[cards[i].proj] : ''; } }
  });
  hero.addEventListener('pointerleave', () => { hovered = -1; hero.classList.remove('over-screen'); cursor && cursor.classList.remove('big'); });
  hero.addEventListener('click', (e) => { if (hovered < 0 || e.target.closest('a,button')) return; const l = document.querySelector(`.work-card[href="/${cards[hovered].proj}"]`); if (l) l.click(); });
  let on = true, last = performance.now(), auto = 0, autoT = 0;
  const t0 = performance.now() + (document.querySelector('.loader') ? 1300 : 150);
  visible(hero, (v) => { on = v; if (v) { last = performance.now(); requestAnimationFrame(frame); } });
  function frame(now) {
    if (!on) return;
    const dt = Math.min(0.05, (now - last) / 1000); last = now;
    ptr.sx += (ptr.x - ptr.sx) * 0.05; ptr.sy += (ptr.y - ptr.sy) * 0.05;
    autoT += dt; if (autoT > 2.8) { autoT = 0; auto = (auto + 1) % cards.length; }
    const focus = hovered >= 0 ? hovered : (fine ? -1 : auto);
    const p = clamp(window.scrollY / Math.max(1, hero.offsetHeight), 0, 1);
    deck.rotation.y = (fine ? ptr.sx * 0.1 : 0) - 0.12;
    deck.rotation.x = (fine ? ptr.sy * 0.05 : 0);
    cards.forEach((c, i) => {
      const a = ease(clamp(((now - t0) / 1000 - i * 0.12) / 1.0, 0, 1));
      c.hover += ((focus === i ? 1 : 0) - c.hover) * 0.12;
      const spread = 1 + p * 0.8 + (focus >= 0 ? 0.15 : 0);
      c.pivot.rotation.z = -(c.base * spread) * a * (1 - c.hover * 0.6);
      c.pivot.position.set((i - 1.5) * 0.55 * spread * a, -(1 - a) * 4, i * 0.12 + c.hover * 0.8);
      c.g.position.y = CH / 2 + 0.6 + c.hover * 0.45;
    });
    renderer.render(scene, camera);
    requestAnimationFrame(frame);
  }
  requestAnimationFrame(frame);
}

/* ---------------- Project covers ---------------- */
const STAGES = {
  followup: { bg: '#6739F5', items: [
    ['browser', ['timeline', 'companies'], 1.25, 0.75, -1.6, 5.0, -0.18, 'followup.app/clients/dane-mitchell'],
    ['browser', ['dashboard', 'log', 'discussion', 'approval'], -1.0, -0.55, 0.2, 5.4, 0.14, 'followup.app/my-tasks'],
  ], hero: 1 },
  commute: { bg: '#0D6139', items: [
    ['phone', ['compare'], -2.35, -0.15, -0.8, 1.95, 0.3],
    ['phone', ['live', 'delayed', 'unavailable', 'times'], 0, 0.1, 0.4, 2.05, 0],
    ['phone', ['plan', 'journey'], 2.35, -0.15, -0.8, 1.95, -0.3],
  ], hero: 1 },
  dutchpot: { bg: '#F4B526', items: [
    ['phone', ['home', 'aisle'], -2.35, -0.15, -0.8, 1.95, 0.3],
    ['phone', ['recipe', 'basket', 'delivery'], 0, 0.1, 0.4, 2.05, 0],
    ['phone', ['tracking'], 2.35, -0.15, -0.8, 1.95, -0.3],
  ], hero: 1 },
};
function initStage(cover, slug) {
  const S = STAGES[slug]; if (!S) return;
  const canvas = document.createElement('canvas'); canvas.className = 'stage-3d'; canvas.setAttribute('aria-hidden', 'true'); cover.appendChild(canvas);
  const renderer = makeRenderer(canvas, new THREE.Color(S.bg));
  const scene = new THREE.Scene(); lights(scene);
  const camera = new THREE.PerspectiveCamera(30, 1.6, 0.1, 50); camera.position.set(0, 0, 12);
  const world = new THREE.Group(); scene.add(world);
  const items = S.items.map((d, i) => {
    const [kind, screens, x, y, z, w, ry, url] = d;
    const dev = device(kind, w, screens.map((s) => `${IMG}${slug}/screens/${s}.jpg`), { url });
    const holder = new THREE.Group(); holder.position.set(x, y, z); world.add(holder);
    const sh = new THREE.Mesh(new THREE.PlaneGeometry(dev.size[0] * 1.5, (dev.size[1] + 0.3) * 1.45), new THREE.MeshBasicMaterial({ map: shadowTexture(), transparent: true, depthWrite: false, opacity: 0.55 }));
    sh.position.set(0.25, -0.35, -1.1); holder.add(sh);
    holder.add(dev.group); dev.group.rotation.y = ry;
    return { dev, holder, home: new THREE.Vector3(x, y, z), ry, seed: i * 1.7, sh };
  });
  function size() {
    const w = cover.clientWidth, h = cover.clientHeight;
    renderer.setSize(w, h, false); camera.aspect = w / h;
    camera.position.z = camera.aspect < 1.2 ? 12 * (1.6 / camera.aspect) * 0.62 : 12;
    camera.updateProjectionMatrix();
  }
  size(); window.addEventListener('resize', size);
  let on = false, last = performance.now(), cycle = 0, shown = false;
  visible(cover, (v) => { on = v; if (v) { last = performance.now(); requestAnimationFrame(frame); } });
  function frame(now) {
    if (!on) return;
    const dt = Math.min(0.05, (now - last) / 1000); last = now;
    ptr.sx += (ptr.x - ptr.sx) * 0.05; ptr.sy += (ptr.y - ptr.sy) * 0.05;
    const r = cover.getBoundingClientRect(); const vh = window.innerHeight;
    const q = clamp((vh - r.top) / (vh + r.height), 0, 1);
    world.rotation.y = (q - 0.45) * 0.5 + (fine ? ptr.sx * 0.16 : 0);
    world.rotation.x = (fine ? ptr.sy * 0.08 : 0) + (q - 0.45) * -0.12;
    cycle += dt; const swap = cycle > 3.4; if (swap) cycle = 0;
    items.forEach((it, i) => {
      const t = now / 1000 + it.seed;
      it.holder.position.set(it.home.x * (1 + (q - 0.45) * 0.12), it.home.y + Math.sin(t * 0.7) * 0.07, it.home.z + (i === S.hero ? q * 0.6 : -q * 0.4));
      it.dev.group.rotation.y = it.ry + Math.sin(t * 0.45) * 0.04;
      if (swap && i === S.hero) it.dev.next();
      it.dev.tick(dt);
    });
    renderer.render(scene, camera);
    if (!shown) { shown = true; cover.classList.add('is-3d'); }
    requestAnimationFrame(frame);
  }
}

if (!reduce && hasGL()) {
  const hero = document.querySelector('.hero[data-3d-home]');
  if (hero) {
    const v = new URLSearchParams(location.search).get('hero') || 'showcase';
    if (v === 'canvas') initHome(hero); else if (v === 'deck') initDeck(hero); else initShowcase(hero);
  }
  const cover = document.querySelector('.cover[data-3d]');
  if (cover) initStage(cover, cover.getAttribute('data-3d'));
}
