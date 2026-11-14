// Player: one master timeline, driven by audio/manifest.json (durations, cue times, captions).
//
// URL options:  ?clean   hide the control bar (for screen recording)
//               ?cc=0    hide captions          ?t=123.4  start at a time (seconds)
//               ?fx=0    no bloom / post-processing (faster)
//               ?record  no audio; frames are stepped from outside via window.renderAt(seconds)
import { THREE, clamp01, ramp } from './util.js';
import { EffectComposer } from '../vendor/addons/postprocessing/EffectComposer.js';
import { RenderPass } from '../vendor/addons/postprocessing/RenderPass.js';
import { UnrealBloomPass } from '../vendor/addons/postprocessing/UnrealBloomPass.js';
import { OutputPass } from '../vendor/addons/postprocessing/OutputPass.js';
import { HDRLoader } from '../vendor/addons/loaders/HDRLoader.js';
import { build as hook } from './scenes/hook.js';
import { build as prism } from './scenes/prism.js';
import { build as shift } from './scenes/shift.js';
import { build as photo } from './scenes/photodiodes.js';
import { build as isp } from './scenes/isp.js';
import { build as stack } from './scenes/stack.js';

const $ = (id) => document.getElementById(id);
const params = new URLSearchParams(location.search);
const RECORD = params.has('record');
if (params.has('clean') || RECORD) document.body.classList.add('clean');
if (params.get('cc') === '0') document.body.classList.add('nocc');

const manifest = await (await fetch('audio/manifest.json')).json();
const chapters = manifest.chapters, TOTAL = manifest.duration, FADE = 0.7;

const stageEl = $('stage'), overlay = $('overlay');
const renderer = new THREE.WebGLRenderer({ antialias: true, preserveDrawingBuffer: RECORD });
renderer.toneMapping = THREE.NeutralToneMapping;
renderer.toneMappingExposure = 1.0;
stageEl.prepend(renderer.domElement);

// studio reflections: a dark-studio HDRI (Poly Haven "Studio Small 08", CC0), prefiltered for PBR
const hdr = await new HDRLoader().loadAsync('assets/studio_small_08_1k.hdr');
hdr.mapping = THREE.EquirectangularReflectionMapping;
const envMap = new THREE.PMREMGenerator(renderer).fromEquirectangular(hdr).texture;
hdr.dispose();

const S = { hook: hook(), prism: prism(), shift: shift(), photo: photo(), isp: isp(), stack: stack() };
for (const sc of Object.values(S)) {
  for (const l of sc.labels) {
    l.el = document.createElement('div');
    l.el.className = 'lbl ' + l.cls; l._cls = l.cls;
    l.el.textContent = l.text;
    l.el.style.opacity = 0;
    overlay.append(l.el);
  }
  sc.scene.environment = envMap;
  sc.scene.environmentIntensity = sc.envIntensity ?? 0.45;
  if (sc.envRotation) sc.scene.environmentRotation.set(...sc.envRotation);
}

// post-processing: HDR render → subtle bloom → tone mapping
const FX = params.get('fx') !== '0';
const composer = new EffectComposer(renderer, new THREE.WebGLRenderTarget(4, 4, { type: THREE.HalfFloatType, samples: params.has('aa') ? +params.get('aa') : 4 }));
const renderPass = new RenderPass(S.hook.scene, S.hook.camera);
const bloom = new UnrealBloomPass(new THREE.Vector2(4, 4), 0.26, 0.5, 1.0);
composer.addPass(renderPass); if (params.get('bloom') !== '0') composer.addPass(bloom); composer.addPass(new OutputPass());

function layout() {
  const barH = document.body.classList.contains('clean') ? 0 : $('bar').offsetHeight;
  const W = innerWidth, H = innerHeight - barH;
  const w = Math.min(W, H * 16 / 9), h = w * 9 / 16;
  stageEl.style.width = w + 'px'; stageEl.style.height = h + 'px';
  renderer.setPixelRatio(RECORD ? 1 : Math.min(devicePixelRatio, 2));
  renderer.setSize(w, h, false);
  composer.setPixelRatio(renderer.getPixelRatio());
  composer.setSize(w, h);
  renderer.domElement.style.width = renderer.domElement.style.height = '';
}
addEventListener('resize', () => { layout(); draw(); });

// ---- timeline ----
let T = Math.min(TOTAL - 0.01, Math.max(0, parseFloat(params.get('t')) || 0)), playing = false, active = null, lastCh = -1;
const chapterAt = (t) => { let i = chapters.length - 1; while (i > 0 && t < chapters[i].start) i--; return i; };

/** Update the right scene for global time t; returns { scene, fade }. */
function resolve(t) {
  const i = chapterAt(t), ch = chapters[i], lt = t - ch.start, c = ch.cues;
  const cuts = [0, ch.duration];
  let sc;
  if (ch.id === 'outro') {
    cuts.push(c.prism, c.phone);
    if (lt < c.prism) { sc = S.photo; sc.outro(lt / c.prism, lt); }
    else if (lt < c.phone) { sc = S.prism; sc.outro((lt - c.prism) / (c.phone - c.prism)); }
    else { sc = S.hook; sc.outro((lt - c.phone) / (ch.duration - c.phone), ramp(lt, c.ask + 5.5, c.ask + 7)); }
  } else { sc = S[ch.id]; sc.update(lt, c, ch.duration); }
  let d = Infinity;
  for (const k of cuts) d = Math.min(d, Math.abs(lt - k));
  return { sc, i, ch, lt, fade: 1 - clamp01(d / FADE) };
}

const v = new THREE.Vector3();
function draw() {
  const { sc, i, ch, lt, fade } = resolve(T);
  if (active !== sc) { if (active) for (const l of active.labels) l.el.style.opacity = 0; active = sc; }
  const w = stageEl.clientWidth, h = stageEl.clientHeight;
  sc.camera.aspect = 16 / 9; sc.camera.updateProjectionMatrix(); sc.camera.updateMatrixWorld();
  if (FX) { renderPass.scene = sc.scene; renderPass.camera = sc.camera; composer.render(); } else renderer.render(sc.scene, sc.camera);
  for (const l of sc.labels) {
    if (l.o < 0.01) { l.el.style.opacity = 0; continue; }
    v.copy(l.pos).project(sc.camera);
    if (v.z > 1) { l.el.style.opacity = 0; continue; }
    if (l._cls !== l.cls) { l.el.className = 'lbl ' + l.cls; l._cls = l.cls; }
    l.el.style.opacity = l.o * (1 - fade);
    l.el.style.transform = `translate(${(v.x * 0.5 + 0.5) * w}px, ${(-v.y * 0.5 + 0.5) * h}px) translate(-50%, -50%)`;
  }
  $('fade').style.opacity = fade;
  // lower third
  const tEl = $('title');
  if (lastCh !== i) { tEl.querySelector('small').textContent = ch.label; tEl.querySelector('b').textContent = ch.title; lastCh = i; }
  tEl.style.opacity = lt > 0.5 && lt < 5.5 ? 1 : 0;
  if (RECORD) tEl.style.transition = 'none';
  // captions
  const cap = ch.captions.find((k) => lt >= k.start - 0.05 && lt <= k.end + 0.25);
  const cc = $('cc');
  if (cap) { if (cc.textContent !== cap.text) cc.textContent = cap.text; cc.style.opacity = 1; } else cc.style.opacity = 0;
  // controls
  if (!seeking) $('seek').value = T;
  $('time').textContent = `${fmt(T)} / ${fmt(TOTAL)}`;
  chips.forEach((b, k) => b.classList.toggle('on', k === i));
}
const fmt = (s) => `${Math.floor(s / 60)}:${String(Math.floor(s % 60)).padStart(2, '0')}`;

// ---- audio (one file per chapter; the timeline follows the audio clock while it plays) ----
const audios = RECORD ? [] : chapters.map((ch) => { const a = new Audio(ch.file); a.preload = 'auto'; return a; });
let muted = false, lastNow = 0;
function syncAudio(dt) {
  const i = chapterAt(T), ch = chapters[i], a = audios[i], want = T - ch.start - manifest.lead;
  audios.forEach((o, k) => { if (k !== i && !o.paused) o.pause(); });
  const inRange = a && want >= 0 && want < ch.audio - 0.05;
  if (inRange && !muted && a.readyState >= 2) {
    if (a.paused) { a.currentTime = want; a.play().catch(() => {}); T += dt; }
    else {
      // follow the audio clock; if the server could not seek the file, keep the visuals on wall-clock time
      const at = ch.start + manifest.lead + a.currentTime;
      T = Math.abs(at - T) < 0.6 ? at : T + dt;
    }
  } else { if (a && !a.paused) a.pause(); T += dt; }
}
function setPlaying(p) {
  playing = p;
  $('play').textContent = p ? '❚❚ Pause' : '▶ Play';
  if (!p) audios.forEach((a) => a.pause());
  lastNow = performance.now();
}
function seek(t) { T = Math.min(TOTAL - 0.01, Math.max(0, t)); audios.forEach((a) => a.pause()); draw(); }

function frame(now) {
  if (playing) {
    const dt = Math.min(0.1, (now - lastNow) / 1000);
    syncAudio(dt);
    if (T >= TOTAL - 0.02) { T = TOTAL - 0.02; setPlaying(false); }
    draw();
  }
  lastNow = now;
  requestAnimationFrame(frame);
}

// ---- controls ----
let seeking = false;
const chips = chapters.map((ch) => {
  const b = document.createElement('button');
  b.textContent = ch.label.replace('Chapter ', 'Ch ');
  b.title = ch.title;
  b.onclick = () => seek(ch.start);
  $('chips').append(b);
  return b;
});
$('seek').max = TOTAL;
$('seek').oninput = (e) => { seeking = true; seek(parseFloat(e.target.value)); };
$('seek').onchange = () => { seeking = false; };
$('play').onclick = () => setPlaying(!playing);
$('ccb').onclick = () => { $('ccb').classList.toggle('on', !document.body.classList.toggle('nocc')); };
$('mute').onclick = () => { muted = !muted; $('mute').textContent = muted ? '🔇' : '🔊'; audios.forEach((a) => a.pause()); };
if (document.body.classList.contains('nocc')) $('ccb').classList.remove('on');
addEventListener('keydown', (e) => {
  if (e.target.tagName === 'INPUT') return;
  const i = chapterAt(T);
  if (e.code === 'Space') { e.preventDefault(); setPlaying(!playing); }
  else if (e.key === 'ArrowRight') seek(e.shiftKey ? (chapters[i + 1]?.start ?? T) : T + 5);
  else if (e.key === 'ArrowLeft') seek(e.shiftKey ? chapters[Math.max(0, T - chapters[i].start < 2 ? i - 1 : i)].start : T - 5);
  else if (e.key === 'c') $('ccb').click();
  else if (e.key === 'm') $('mute').click();
  else if (e.key === 'h') { document.body.classList.toggle('clean'); layout(); draw(); }
});

layout();
draw();
requestAnimationFrame(frame);
window.renderAt = (t) => { T = Math.min(TOTAL - 0.01, Math.max(0, t)); draw(); };
window.timeline = { total: TOTAL, chapters };
window.ready = true;
