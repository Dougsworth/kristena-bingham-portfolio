/* UI portfolio: Three.js scenes built from Kristena's real screens.
   - Home hero: a field of floating devices you can hover and click through to each project.
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

/* ---------------- Home hero ---------------- */
const NAMES = { followup: 'FollowUp', commute: 'Kingston Commute', dutchpot: 'Dutchpot' };
const HOME = [
  ['followup', 'browser', ['dashboard'], 3.4, 1.75, -1.2, 3.0, -0.22, 'followup.app/my-tasks'],
  ['commute', 'phone', ['live', 'delayed'], 4.35, 0.25, 0.4, 1.1, -0.32],
  ['dutchpot', 'phone', ['recipe', 'basket'], 2.55, -0.25, 1.3, 1.05, -0.14],
  ['followup', 'browser', ['timeline'], 5.6, 2.25, -3.0, 3.0, -0.36, 'followup.app/clients/dane-mitchell'],
  ['dutchpot', 'phone', ['home'], 6.3, -0.9, -2.0, 1.05, -0.36],
  ['commute', 'phone', ['plan'], -1.0, 2.3, -3.5, 1.1, 0.26],
  ['dutchpot', 'phone', ['tracking'], 7.8, 1.2, -4.8, 1.05, -0.5],
  ['commute', 'phone', ['compare'], -3.7, 2.7, -6.0, 1.1, 0.36],
  ['followup', 'browser', ['companies'], 1.0, 3.9, -7.0, 3.2, 0.1, 'followup.app/companies'],
  ['commute', 'phone', ['journey'], 9.0, -1.0, -7.5, 1.15, -0.5],
];
function initHome(hero) {
  const bg = new THREE.Color('#0D0B14');
  const wrap = document.createElement('div'); wrap.className = 'hero-3d'; wrap.setAttribute('aria-hidden', 'true');
  const canvas = document.createElement('canvas'); wrap.appendChild(canvas); hero.prepend(wrap);
  const renderer = makeRenderer(canvas, null);
  const scene = new THREE.Scene(); scene.fog = new THREE.Fog(bg, 9, 21); lights(scene);
  const camera = new THREE.PerspectiveCamera(35, 1, 0.1, 60); camera.position.set(0, 0, 10);
  const world = new THREE.Group(); scene.add(world);
  const items = [];
  const list = small() ? HOME.slice(0, 7) : HOME;
  list.forEach((d, i) => {
    const [proj, kind, screens, x, y, z, w, ry, url] = d;
    const dev = device(kind, w, screens.map((s) => `${IMG}${proj}/screens/${s}.jpg`), { url });
    const holder = new THREE.Group(); holder.add(dev.group); world.add(holder);
    dev.group.rotation.y = ry; dev.group.rotation.x = 0.04;
    dev.screen.userData.i = i; dev.top.userData.i = i;
    items.push({ dev, holder, proj, home: new THREE.Vector3(x, y, z), delay: 0.12 * i, seed: Math.random() * 10, hover: 0, ry });
  });
  const hits = items.flatMap((it) => [it.dev.screen, it.dev.top]);

  function size() {
    const w = hero.clientWidth, h = hero.clientHeight;
    renderer.setSize(w, h, false); camera.aspect = w / h;
    if (small()) { world.scale.setScalar(0.42); world.position.set(-1.35, 1.75, 0); }
    else { world.scale.setScalar(Math.min(1, camera.aspect / 1.6)); world.position.set(0, 0, 0); }
    camera.updateProjectionMatrix();
  }
  size(); window.addEventListener('resize', size);

  // hover + click through to the project
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
      hovered = i;
      hero.classList.toggle('over-screen', i >= 0);
      if (cursor && label) {
        if (i >= 0) { cursor.classList.add('big'); label.textContent = NAMES[items[i].proj]; }
        else { cursor.classList.remove('big'); label.textContent = ''; }
      }
    }
  });
  hero.addEventListener('pointerleave', () => { hovered = -1; hero.classList.remove('over-screen'); if (cursor) cursor.classList.remove('big'); });
  hero.addEventListener('click', (e) => {
    if (hovered < 0 || e.target.closest('a,button')) return;
    const link = document.querySelector(`.work-card[href="/${items[hovered].proj}"]`);
    if (link) link.click();
  });

  let on = true, t0 = performance.now() + (document.querySelector('.loader') && !document.documentElement.classList.contains('reduced') ? 1500 : 200), last = performance.now(), cycle = 0;
  visible(hero, (v) => { on = v; if (v) { last = performance.now(); requestAnimationFrame(frame); } });
  function frame(now) {
    if (!on) return;
    const dt = Math.min(0.05, (now - last) / 1000); last = now;
    ptr.sx += (ptr.x - ptr.sx) * 0.05; ptr.sy += (ptr.y - ptr.sy) * 0.05;
    const p = clamp(window.scrollY / Math.max(1, hero.offsetHeight), 0, 1);
    camera.position.z = 10 - ease(p) * 7;
    camera.position.x = ptr.sx * 0.5 + p * 1.5; camera.position.y = -ptr.sy * 0.35;
    camera.lookAt(p * 2.2, 0, -2);
    world.rotation.y = ptr.sx * 0.12 + p * 0.35;
    cycle += dt;
    const swap = cycle > 3.2; if (swap) cycle = 0;
    items.forEach((it, i) => {
      const a = ease(clamp(((now - t0) / 1000 - it.delay) / 1.6, 0, 1));
      const t = now / 1000 + it.seed;
      it.holder.position.set(it.home.x, it.home.y + Math.sin(t * 0.6) * 0.08, it.home.z - (1 - a) * 18);
      it.hover += ((hovered === i ? 1 : 0) - it.hover) * 0.12;
      it.holder.scale.setScalar(1 + it.hover * 0.06);
      it.dev.group.rotation.y = it.ry * (1 - it.hover) + Math.sin(t * 0.4) * 0.05;
      it.dev.group.rotation.x = 0.04 + Math.cos(t * 0.5) * 0.03;
      if (swap && i < 3) it.dev.next();
      it.dev.tick(dt);
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
  if (hero) initHome(hero);
  const cover = document.querySelector('.cover[data-3d]');
  if (cover) initStage(cover, cover.getAttribute('data-3d'));
}
