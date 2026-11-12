import * as THREE from 'three';
import { RoomEnvironment } from 'three/addons/environments/RoomEnvironment.js';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { GLTFExporter } from 'three/addons/exporters/GLTFExporter.js';
import { EffectComposer } from 'three/addons/postprocessing/EffectComposer.js';
import { RenderPass } from 'three/addons/postprocessing/RenderPass.js';
import { GTAOPass } from 'three/addons/postprocessing/GTAOPass.js';
import { UnrealBloomPass } from 'three/addons/postprocessing/UnrealBloomPass.js';
import { OutputPass } from 'three/addons/postprocessing/OutputPass.js';
import { makeMaterials } from './kit.js';
import { buildPhone } from './model/phone.js';
import { buildStory, DURATION, FOV } from './story.js';
import { pulse, ramp } from './timeline.js';

const params = new URLSearchParams(location.search);
const RENDER = params.has('render');
document.body.classList.toggle('render', RENDER);
// ?quality=high (default): ambient occlusion, 4× MSAA and a soft bloom. ?quality=draft: plain forward render (for CPU-only machines).
const HIGH = (params.get('quality') ?? 'high') !== 'draft';

const stage = document.getElementById('stage');
const canvas = document.getElementById('view');
const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, preserveDrawingBuffer: RENDER });
renderer.toneMapping = THREE.ACESFilmicToneMapping;
renderer.toneMappingExposure = 1.15;
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFSoftShadowMap;

// ---- a black void: no floor, low ambient, hard rim lights
const scene = new THREE.Scene();
scene.background = new THREE.Color(0x000000);
scene.environment = new THREE.PMREMGenerator(renderer).fromScene(new RoomEnvironment(), 0.03).texture;
scene.environmentIntensity = 0.42;

const key = new THREE.DirectionalLight(0xfff6ec, 2.6);
key.position.set(1.6, 4.2, 2.6);
key.castShadow = true;
key.shadow.mapSize.set(4096, 4096); key.shadow.radius = 3;
Object.assign(key.shadow.camera, { left: -1.6, right: 1.6, top: 1.6, bottom: -1.6, near: 1, far: 12 });
key.shadow.bias = -0.0002; key.shadow.normalBias = 0.003;
const rim = new THREE.DirectionalLight(0xbcd0ff, 1.0);
rim.position.set(0.3, 1.0, -4);
const rim2 = new THREE.DirectionalLight(0xffffff, 0.3);
rim2.position.set(2.6, 0.9, -3.2);
const fill = new THREE.DirectionalLight(0xdfe8ff, 0.35);
fill.position.set(-2, 2.5, 4);
scene.add(key, rim, rim2, fill);
const lights = { key, rim, rim2, fill, base: { key: key.intensity, rim: rim.intensity, rim2: rim2.intensity, fill: fill.intensity, env: scene.environmentIntensity }, scene };

// ---- model: millimetres inside `rig`, which lays the phone flat, screen up, top edge away from the camera
const M = makeMaterials(params.get('finish') ?? 'burgundy');
const phone = buildPhone(M);
const rig = new THREE.Group(); rig.name = 'Rig';
rig.scale.setScalar(0.01); rig.rotation.x = -Math.PI / 2;
rig.add(phone.group);
const world = new THREE.Group(); world.name = 'World'; world.add(rig);
scene.add(world);

const story = buildStory({ phone, rig, world, M, lights, scene });
const camera = new THREE.PerspectiveCamera(FOV, 16 / 9, 0.01, 80);

// ---- post-processing (high quality only)
let composer = null, gtao = null;
if (HIGH) {
  const target = new THREE.WebGLRenderTarget(4, 4, { type: THREE.HalfFloatType, samples: 4 });
  composer = new EffectComposer(renderer, target);
  composer.addPass(new RenderPass(scene, camera));
  gtao = new GTAOPass(scene, camera, 4, 4);
  gtao.blendIntensity = 0.9;
  composer.addPass(gtao);
  if (params.get('ao') === '0') gtao.enabled = false;
  const bloom = new UnrealBloomPass(new THREE.Vector2(4, 4), Number(params.get('bloom') ?? 0.16), 0.6, 0.9);
  if (bloom.strength > 0) composer.addPass(bloom);
  composer.addPass(new OutputPass());
}
const controls = new OrbitControls(camera, canvas);
controls.enabled = false;

// ---- overlay
const $ = (id) => document.getElementById(id);
const overlay = $('overlay'), lines = $('lines');
const NS = 'http://www.w3.org/2000/svg';
const el = (cls, html = '') => { const e = document.createElement('div'); e.className = cls; e.innerHTML = html; overlay.append(e); return e; };

for (const h of story.headlines) {
  h.el = el(`headline ${h.cls ?? ''}`, `${h.kicker ? '<div class="k"></div>' : ''}<div class="t"></div>${h.sub ? '<div class="s"></div>' : ''}`);
  if (h.kicker) h.el.querySelector('.k').textContent = h.kicker;
  if (h.sub) h.el.querySelector('.s').textContent = h.sub;
  const t = h.el.querySelector('.t');
  h.words = h.text.split(' ').map((w, i, a) => { const s = document.createElement('span'); s.textContent = w + (i < a.length - 1 ? ' ' : ''); t.append(s); return s; });
  h.el.style.top = `${h.y ?? 50}%`;
}
for (const c of story.labels) {
  c.el = el(`label ${c.off[0] < 0 ? 'left' : 'right'}`, `<b></b>${c.text ? '<span></span>' : ''}`);
  c.el.children[0].textContent = c.title;
  if (c.text) c.el.children[1].textContent = c.text;
  c.line = document.createElementNS(NS, 'line'); c.dot = document.createElementNS(NS, 'circle');
  lines.append(c.line, c.dot);
}
for (const s of story.stats) {
  s.el = el('stat', `<div class="n"></div><div class="c"></div>${s.bars ? `<div class="bars">${'<i></i>'.repeat(s.bars.of)}</div>` : ''}`);
  s.el.style.left = `${s.x}%`; s.el.style.top = `${s.y}%`;
}

const fadeK = (t, c, d = 0.45) => pulse(t, c.t0, d, c.t1 - d, d);
function updateOverlay(t) {
  const Wd = stage.clientWidth, Hd = stage.clientHeight, u = Hd / 100;
  let scrim = 0;
  for (const h of story.headlines) {
    const on = t >= h.t0 - 0.05 && t <= h.t1 + 0.05;
    h.el.style.display = on ? '' : 'none';
    if (!on) continue;
    const base = ramp(t, h.t0, h.chapter ? 0.35 : 0.5), out = 1 - ramp(t, h.t1 - 0.45, 0.45), n = h.words.length, step = Math.min(0.16, 1.1 / n);
    h.words.forEach((w, i) => {
      const lit = h.chapter ? 1 : ramp(t, h.t0 + 0.25 + i * step, 0.55) * (1 - ramp(t, h.t1 - 1.15 + i * step * 0.6, 0.45));
      w.style.opacity = base * out * (0.34 + 0.66 * lit);
      w.style.filter = base < 0.999 ? `blur(${((1 - base) * 0.9 * u).toFixed(2)}px)` : 'none';
    });
    for (const q of ['.k', '.s']) { const e = h.el.querySelector(q); if (e) e.style.opacity = (h.chapter ? base : ramp(t, h.t0 + (q === '.s' ? 0.9 : 0.1), 0.6)) * out; }
    scrim = Math.max(scrim, (h.scrim ?? 0) * pulse(t, h.t0 - 0.05, 0.5, h.t1 - 0.5, 0.5));
  }
  $('scrim').style.opacity = scrim;
  // fades through black
  let black = t < story.fadeIn ? 1 - t / story.fadeIn : t > DURATION - 1.6 ? (t - DURATION + 1.6) / 1.6 : 0;
  for (const d of story.dips) black = Math.max(black, pulse(t, d - 0.4, 0.38, d + 0.02, 0.38));
  $('black').style.opacity = black;

  for (const s of story.stats) {
    const k = t >= s.t0 && t <= s.t1 ? fadeK(t, s) : 0;
    s.el.style.display = k > 0.001 ? '' : 'none';
    if (k <= 0.001) continue;
    s.el.style.opacity = k;
    const v = typeof s.value === 'function' ? s.value(t) : s.value, c = typeof s.caption === 'function' ? s.caption(t) : s.caption;
    if (s.el._v !== v) s.el.children[0].textContent = s.el._v = v;
    if (s.el._c !== c) s.el.children[1].textContent = s.el._c = c;
    if (s.bars) { const n = s.bars.n(t); [...s.el.children[2].children].forEach((b, i) => { b.style.background = i < n ? '#f5f5f7' : '#2c2c2e'; }); }
  }

  for (const c of story.labels) {
    const k = t >= c.t0 && t <= c.t1 ? fadeK(t, c, 0.4) : 0, show = k > 0.001;
    c.el.style.display = show ? '' : 'none';
    c.line.style.display = c.dot.style.display = show ? '' : 'none';
    if (!show) continue;
    const p = c.at().project(camera);
    const ax = (p.x * 0.5 + 0.5) * Wd, ay = (-p.y * 0.5 + 0.5) * Hd;
    const hw = c.el.offsetWidth / 2, hh = c.el.offsetHeight / 2, safe = 4 * u, side = Math.sign(c.off[0]) || 1;
    // the label's near edge sits at the end of the leader
    const ex = ax + c.off[0] * u, ey = ay + c.off[1] * u;
    const lx = Math.min(Wd - safe - hw, Math.max(safe + hw, ex + side * (hw + 1.2 * u))), ly = Math.min(Hd - safe - hh, Math.max(safe + hh, ey));
    c.el.style.left = lx + 'px'; c.el.style.top = ly + 'px'; c.el.style.opacity = k;
    c.el.style.transform = `translate(-50%, -50%) translateX(${(1 - k) * side * 1.5 * u}px)`;
    const grow = ramp(t, c.t0, 0.5), x2 = ax + (lx - side * (hw + 1.2 * u) - ax) * grow, y2 = ay + (ly - ay) * grow;
    const set = (e, o) => { for (const [a, b] of Object.entries(o)) e.setAttribute(a, b); e.style.opacity = k; };
    set(c.line, { x1: ax, y1: ay, x2, y2 });
    set(c.dot, { cx: ax, cy: ay, r: 0.32 * u });
  }
}

// ---- frame
let time = 0;
function setTime(t) {
  time = Math.min(DURATION, Math.max(0, t));
  story.tl.apply(time);
  if (!controls.enabled) {
    const c = story.camera.at(time);
    camera.position.copy(c.pos);
    camera.lookAt(c.look);
    // keep depth precision from the whole phone down to a 4.6 mm iris
    const d = c.pos.distanceTo(c.look);
    camera.near = Math.max(0.0004, d * 0.05); camera.far = 40;
    camera.updateProjectionMatrix();
    if (gtao) gtao.updateGtaoMaterial({ radius: Math.min(0.2, Math.max(0.003, d * 0.04)), distanceExponent: 1, thickness: 1, scale: 1, samples: 16, screenSpaceRadius: false });
  }
  camera.updateMatrixWorld();
  scene.updateMatrixWorld();
  if (composer) composer.render(); else renderer.render(scene, camera);
  updateOverlay(time);
}

function resize() {
  const w = stage.clientWidth, h = stage.clientHeight;
  // ?scale=0.8 renders the 3D at 80% and lets the browser upscale it; text stays sharp
  renderer.setPixelRatio(RENDER ? Number(params.get('scale') ?? 1) : Math.min(devicePixelRatio, 2));
  renderer.setSize(w, h, false);
  if (composer) { composer.setPixelRatio(renderer.getPixelRatio()); composer.setSize(w, h); }
  camera.aspect = w / h; camera.updateProjectionMatrix();
  lines.setAttribute('viewBox', `0 0 ${w} ${h}`);
  setTime(time);
}
addEventListener('resize', resize);
resize();

// ---- GLB export (every part is a named node; effects and glass twins are left out)
async function exportGlb() {
  const hidden = [];
  phone.group.traverse((o) => { if (o.userData.twin || o.isSprite || o.material?.isShaderMaterial) { if (o.visible) hidden.push(o); o.visible = false; } });
  const data = await new GLTFExporter().parseAsync(phone.group, { binary: true, onlyVisible: true });
  for (const o of hidden) o.visible = true;
  return data;
}

// ---- hooks for the headless renderer / exporter
window.__duration = DURATION;
window.__setTime = (t) => { setTime(t); return true; };
window.__exportGlb = async (t = 0) => {
  setTime(t);
  const bytes = new Uint8Array(await exportGlb());
  let s = ''; for (let i = 0; i < bytes.length; i += 0x8000) s += String.fromCharCode.apply(null, bytes.subarray(i, i + 0x8000));
  return btoa(s);
};
window.__scene = { scene, camera, phone, story, rig };
window.__sfx = story.sfx;
// a still from an arbitrary camera with the overlay hidden (for checking the model)
window.__view = (t, pos, look) => {
  setTime(t);
  overlay.style.display = lines.style.display = 'none';
  camera.position.set(...pos); camera.lookAt(...look);
  const d = camera.position.distanceTo(new THREE.Vector3(...look));
  camera.near = Math.max(0.0004, d * 0.05); camera.updateProjectionMatrix(); camera.updateMatrixWorld();
  if (composer) composer.render(); else renderer.render(scene, camera);
  return true;
};
{ const gl = renderer.getContext(), ext = gl.getExtension('WEBGL_debug_renderer_info'); window.__gpu = ext ? gl.getParameter(ext.UNMASKED_RENDERER_WEBGL) : gl.getParameter(gl.RENDERER); }
window.__renderOnly = () => { if (composer) composer.render(); else renderer.render(scene, camera); return true; };
window.__ready = true;

// ---- interactive playback
if (!RENDER) {
  const play = $('play'), scrub = $('scrub'), clock = $('clock');
  scrub.max = DURATION;
  let playing = true, last = performance.now();
  const start = parseFloat(params.get('t'));
  if (!Number.isNaN(start)) { time = start; playing = false; play.textContent = 'Play'; }
  play.onclick = () => { playing = !playing; play.textContent = playing ? 'Pause' : 'Play'; if (playing && time >= DURATION) time = 0; };
  scrub.oninput = () => { playing = false; play.textContent = 'Play'; setTime(+scrub.value); };
  $('free').onchange = (e) => { controls.enabled = e.target.checked; if (controls.enabled) controls.target.copy(story.camera.at(time).look); };
  $('glb').onclick = async () => {
    const a = document.createElement('a');
    a.href = URL.createObjectURL(new Blob([await exportGlb()], { type: 'model/gltf-binary' }));
    a.download = 'iphone-18-pro.glb'; a.click();
  };
  renderer.setAnimationLoop((now) => {
    const dt = (now - last) / 1000; last = now;
    if (playing) { time += dt; if (time >= DURATION) { time = DURATION; playing = false; play.textContent = 'Play'; } }
    if (controls.enabled) controls.update();
    setTime(time);
    scrub.value = time; clock.textContent = `${time.toFixed(2)} / ${DURATION.toFixed(0)} s`;
  });
}
