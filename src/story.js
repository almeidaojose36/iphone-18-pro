// The edit. Every move is keyed to a narration beat (content/script.js), whose times come from the
// recorded voice-over (content/timing.js), so the picture follows the audio.
import * as THREE from 'three';
import { Timeline, ShotCamera, pulse, ramp } from './timeline.js';
import { fader, rrect, rpoly, plate, DIE } from './kit.js';
import { glassify, heatMap, drift, glowSprite } from './fx.js';
import { W, H, D, LENS, STOPS, FOCAL, SOC } from './model/phone.js';
import { CHAPTERS, TITLE } from '../content/script.js';
import { TIMING } from '../content/timing.js';

export const DURATION = TIMING.total;
export const FOV = 30;
export const CARD = 3.6;                     // seconds a chapter title is on screen

export function buildStory({ phone, world, lights }) {
  const tl = new Timeline();
  const R = phone.refs, P = phone.group;

  // ------------------------------------------------------------ time helpers
  const order = [];
  for (const c of CHAPTERS) { if (c.title) order.push({ start: TIMING.chapters[c.id].start }); for (const b of c.beats) order.push({ id: b.id, start: TIMING.beats[b.id].start }); }
  const S = (id) => TIMING.beats[id].start;                       // beat starts
  const E = (id) => S(id) + TIMING.beats[id].dur;                 // narration ends
  const N = (id) => { const i = order.findIndex((o) => o.id === id); return order[i + 1]?.start ?? DURATION; }; // next thing starts
  const CH = (id) => TIMING.chapters[id].start;
  const F = (id, f) => S(id) + (E(id) - S(id)) * f;               // a fraction of the way through a beat

  const sfx = [];                       // { t, name, gain } for the sound mix
  const cue = (t, name, gain = 1) => sfx.push({ t: +t.toFixed(3), name, gain });

  // ------------------------------------------------------------ motion helpers
  /** Keyed pose: keys are [time, [x, y, z, rx, ry, rz], duration]; each key eases from wherever the part is. */
  const pose = (obj, keys) => {
    tl.move(obj, {}, { in: 0, dur: 1 });
    tl.hook((t) => {
      const v = [0, 0, 0, 0, 0, 0];
      for (const [kt, kv, kd] of keys) { const k = ramp(t, kt, kd); if (k <= 0) break; for (let i = 0; i < 6; i++) v[i] += ((kv[i] ?? 0) - v[i]) * k; }
      obj.position.x += v[0]; obj.position.y += v[1]; obj.position.z += v[2];
      obj.rotation.x += v[3]; obj.rotation.y += v[4]; obj.rotation.z += v[5];
    });
  };
  /** Keyed scalar: keys are [time, value, duration]; calls fn(value) every frame. */
  const keyed = (fn, keys, start = 1) => tl.hook((t) => { let v = start; for (const [kt, kv, kd] of keys) { const k = ramp(t, kt, kd); if (k <= 0) break; v += (kv - v) * k; } fn(v, t); });
  /** Re-parent obj under a pivot at c (so it can turn about its own centre). */
  const pivot = (obj, c) => { const g = new THREE.Group(); g.name = obj.name + ' pivot'; g.position.set(...c); obj.parent.add(g); g.add(obj); obj.position.sub(g.position); return g; };
  /** Give a mesh its own material, so it can light up alone. */
  const own = (m) => (m.material = m.material.clone());
  const lit = (get, color, fn) => tl.hook((t) => { const m = get(); m.emissive.setHex(color); m.emissiveIntensity = fn(t); });

  // ------------------------------------------------------------ the larger Pro Max, as a glass outline with its battery
  const maxG = new THREE.Group(); maxG.name = 'iPhone 18 Pro Max (outline)';
  for (const o of [R.chassis, R.back]) maxG.add(o.clone());
  maxG.scale.set(78.0 / W, 163.4 / H, 1); maxG.position.set(96, 0, 0); P.add(maxG);
  const maxShell = glassify(maxG); maxShell.solid(0);
  const maxCell = R.cell.clone(); maxCell.name = 'Pro Max battery (outline)'; maxCell.scale.set(1.0, 1.02, 1); maxG.add(maxCell);
  const fMaxCell = fader(maxCell);

  // ------------------------------------------------------------ looks
  for (const o of [R.socLid, R.ram, R.nand]) own(o.children[0]);                 // each chip lights up on its own
  own(R.modem); own(R.n1); own(R.dPanel.children[1]); R.usbFlex.children.forEach(own); own(R.cell.children[0]);
  R.drive.traverse((o) => { if (o.isMesh && o.name === 'Drive coil') own(o); });
  const body = glassify(R.chassis), back = glassify(R.back), disp = glassify(R.display, 0xd8e4ff);
  const boardP = pivot(R.board, [-12, 40, -0.6]);
  const fBoard = fader(boardP), fBatt = fader(R.battery), fFront = fader(R.frontCam), fIr = fader(R.irCam), fCover = fader(R.apCover), fTeleLid = fader(R.teleLid);
  const fScrews = R.screws.map((s) => fader(s));
  // these fade on their own inside the board (taken after the board's fader, so both apply to the same materials)
  const fSocLid = fader(R.socLid), fStack = [R.tChain, R.tFill, R.tPad].map((o) => fader(o));

  // ------------------------------------------------------------ key moments
  const PI = Math.PI;
  const tFlip1 = S('h2') + 0.2, tFlip2 = S('h3') - 0.5, tXray = S('h3') + 1.6, tTitle = E('h3') + 0.4;
  const tBack = S('w1') + 0.9, tPeel = F('w2b', 0.8), tAway = S('w4') - 0.5;
  const tLayers = CH('display') + 0.8, tDispOut = S('d2') - 0.7, tUnder = S('d5') - 0.8, tUnderOut = N('d5') - 1.5;
  const tLiftB = F('b2', 0.68), tBattOut = N('b4') - 1.4;
  const tHero = CH('verdict') + 1.0, tJump = tHero - 0.5, tCollapse = S('v3') - 0.3;
  const HERO = { back: -20, vapor: 9, bottom: 16, battery: 27, screws: 34, board: 42, cams: 42, front: 54, display: 70 };
  const home = (z, dt = 0.4) => [[tJump, [0, 0, z], 0.01], [tCollapse + dt, [0, 0, 0], 2.2]];

  // the phone itself: front up, flips over to show its back
  const flips = [[tFlip1, PI], [tFlip2, 0], [F('o2', 0.42), PI], [S('o3') - 0.8, 0], [CH('in') + 0.7, PI], [S('w2') - 0.6, 0]];
  pose(world, flips.map(([t, a]) => [t, [0, 0, 0, 0, 0, a], 2.5]));
  flips.forEach(([t]) => cue(t, 'whoosh', 0.65));

  // lights come up out of the dark
  tl.hook((t) => {
    const b = lights.base, up = ramp(t, S('h1') - 1.4, 3.0), edge = ramp(t, 0.3, 2.2);
    lights.key.intensity = b.key * up; lights.fill.intensity = b.fill * up;
    lights.rim.intensity = b.rim * (0.25 + 0.75 * edge) * (3.2 - 2.2 * up); lights.rim2.intensity = b.rim2 * edge * (9 - 8.5 * up);
    lights.scene.environmentIntensity = b.env * (0.12 + 0.88 * up);
  });

  // glass look: solid ↔ x-ray; the body glows warm when it is carrying heat
  const xr = [[tXray, 1, 1.6], [CH('outside') + 0.5, 0, 1.4], [S('w4') - 0.4, 1, 1.6], [tJump, 0, 0.01]];
  const cold = new THREE.Color(0xd6e2f4), warm = new THREE.Color(0xff9a5a);
  keyed((v, t) => {
    const k = pulse(t, S('c2c') + 0.6, 2.4, N('c2c') - 1.0, 1.4);
    body.mat.uniforms.uColor.value.copy(cold).lerp(warm, k);
    body.solid(1 - v); body.glass(v * (1 + 0.7 * k)); back.solid(1 - v); back.glass(v);
  }, xr, 0);
  const sweeps = [tXray - 0.2, S('w4') - 0.5, CH('battery') + 1.0, CH('cool') + 1.2, CH('cameras') + 1.0];
  tl.hook((t) => { let p = -999, k = 0; for (const s of sweeps) { const u = (t - s) / 2.4; if (u > 0 && u < 1) { p = -H * 0.75 + u * H * 1.5; k = Math.sin(PI * u) ** 0.7; } } body.sweep(p, k); back.sweep(p, k); disp.sweep(p, k * 0.7); });
  sweeps.forEach((s) => cue(s, 'sweep', 0.8));

  // ------------------------------------------------------------ display
  keyed((v) => { R.screen.material.emissiveIntensity = v * 1.05; R.screen.material.color.setScalar(0.03 + 0.97 * v); }, [[S('h1') - 1.0, 1, 1.8], [S('w2') + 1.4, 0, 1.2], [tCollapse + 2.6, 1, 1.6]], 0);
  pose(R.display, [[tPeel, [0, -2, 26, -0.1, 0, 0], 2.6], [S('w3') + 0.6, [0, 0, 32, 0, 0, 0], 1.8], [tAway, [0, 150, 70], 2.2],
    [tLayers - 0.4, [0, 0, 62], 0.01], [tDispOut, [0, 150, 80], 2.0], [tUnder - 0.4, [-80, 0, 20, 0, -2.85, 0], 0.01], [tUnderOut, [-80, 0, 90, 0, -2.85, 0], 1.6],
    [tJump, [0, 0, HERO.display], 0.01], [tCollapse + 0.9, [0, 0, 0], 2.4]]);
  keyed((v, t) => { const x = t > tXray - 0.2 && t < CH('outside') + 2 ? pulse(t, tXray, 1.6, CH('outside') + 0.5, 1.4) : 0; disp.solid(v * (1 - x)); disp.glass(x); },
    [[tAway + 0.5, 0, 1.4], [tLayers, 1, 1.2], [tDispOut + 0.4, 0, 1.4], [tUnder, 1, 1.2], [tUnderOut + 0.2, 0, 1.2], [tJump, 1, 0.01]]);
  // its three layers
  pose(R.dGlass, [[S('d1') + 1.6, [0, 0, 16], 1.8], [tDispOut - 0.2, [0, 0, 0], 1.2]]);
  pose(R.dBack, [[S('d1') + 2.0, [0, 0, -16], 1.8], [tDispOut - 0.2, [0, 0, 0], 1.2]]);
  cue(tPeel, 'glass', 1); cue(tAway, 'whoosh', 0.6); cue(S('d1') + 1.6, 'servo', 0.8); cue(tDispOut, 'whoosh', 0.5);
  lit(() => R.dPanel.children[1].material, 0xff2a6a, (t) => pulse(t, S('d5') + 0.8, 0.8, tUnderOut, 0.8) * (1.2 + 0.5 * Math.sin(t * 4)));
  // heat on the seam before the display lifts; the same seam shown as the water seal
  const seam = plate(rrect(W - 1.2, H - 1.2, 11), D / 2 + 0.02, D / 2 + 0.1, new THREE.MeshBasicMaterial({ color: 0xff5a1f, transparent: true, opacity: 0, blending: THREE.AdditiveBlending, depthWrite: false }),
    { bevel: 0, holes: [rrect(W - 4.4, H - 4.4, 9.4, 0, 0, THREE.Path)] });
  seam.castShadow = seam.receiveShadow = false; seam.name = ''; R.display.add(seam);
  tl.hook((t) => {
    const hot = pulse(t, S('w2') + 4.2, 2.4, tPeel + 0.6, 1.6), wet = pulse(t, S('o6') + 1.2, 1.4, N('o6') - 0.8, 1.2), k = Math.max(hot, wet);
    seam.visible = k > 0.002; seam.material.color.setHex(wet > hot ? 0x3fa8ff : 0xff5a1f); seam.material.opacity = k * (0.8 + 0.2 * Math.sin(t * 5));
  });
  cue(S('w2') + 4.2, 'riser', 0.5); cue(S('o6') + 1.2, 'water', 0.7);

  // ------------------------------------------------------------ rear glass
  pose(R.back, [[tBack, [0, 0, -24], 1.8], [tBack + 1.6, [-74, 0, -14, 0, 2.86, 0], 2.4], [N('w1') - 3.0, [0, 0, -24, 0, 0, 0], 1.8], [N('w1') - 1.5, [0, 0, 0], 1.3], ...home(HERO.back, 0.2)]);
  cue(tBack, 'lift'); cue(N('w1') - 1.5, 'click', 0.8);

  // ------------------------------------------------------------ front sensors
  pose(R.frontCam, [[S('d2') + 2.6, [0, 0, 18], 1.8], [tUnder - 0.6, [0, 0, 0], 1.4], ...home(HERO.front, 0.75)]);
  pose(R.irCam, [[F('d4', 0.2), [0, 0, 13], 1.6], [tUnder - 0.6, [0, 0, 0], 1.4], ...home(HERO.front, 0.75)]);
  pose(R.earpiece, home(HERO.front, 0.75));
  keyed((v) => { fFront(v); fIr(v); }, [[N('d5') - 1.2, 0, 1.2], [tJump, 1, 0.01]]);
  cue(S('d2') + 2.6, 'servo', 0.7); cue(F('d4', 0.2), 'click', 0.7);
  // the dot projector's pattern
  const dots = new THREE.Group(); dots.name = ''; R.frontCam.add(dots);
  const dotMap = glowSprite(0xffffff, 1).sprite.material.map, hash = (i, s) => { const x = Math.sin(i * 127.1 + s * 311.7) * 43758.5453; return x - Math.floor(x); };
  const dotS = [];
  for (let i = 0; i < 150; i++) {
    const s = new THREE.Sprite(new THREE.SpriteMaterial({ map: dotMap, color: 0xff3b5c, transparent: true, depthWrite: false, blending: THREE.AdditiveBlending, opacity: 0 }));
    const a = hash(i, 1) * 6.283, r = Math.sqrt(hash(i, 2)) * 0.42, len = 14 + hash(i, 3) * 58;
    s.position.set(-4.2 + Math.cos(a) * r * len, Math.sin(a) * r * len, 1.2 + len); s.scale.setScalar(0.9 + len * 0.02); s.userData.len = len; s.renderOrder = 7; dots.add(s); dotS.push(s);
  }
  const tDots = F('d3', 0.42);
  tl.hook((t) => { const k = pulse(t, tDots, 0.8, N('d3') - 0.6, 0.8); dots.visible = k > 0.002; if (dots.visible) for (const [i, s] of dotS.entries()) s.material.opacity = k * ramp(t, tDots + s.userData.len * 0.012, 0.3) * (0.55 + 0.45 * Math.sin(t * 5 + i)); });
  cue(tDots, 'data', 0.7);

  // ------------------------------------------------------------ battery
  R.screws.forEach((s, i) => {
    const t0 = S('b2') + 0.25 + i * 0.2;
    pose(s, [[t0, [0, 0, 13 + (i % 3) * 2, 0, 0, 5], 0.8], [tLiftB + 1.0, [0, 0, 60], 1.4], [tJump, [0, 0, HERO.screws], 0.01], [tCollapse + 0.6, [0, 0, 0], 2.0]]);
    keyed(fScrews[i], [[tLiftB + 1.0, 0, 1.2], [tJump, 1, 0.01]]);
    cue(t0, 'screw', 0.8);
  });
  pose(R.battery, [[tLiftB, [0, 0, 26], 2.4], [S('b3') - 0.2, [0, 4, 30, 0.42, 0, 0], 2.2], [tBattOut, [0, 0, 120, 0, 0, 0], 1.6], ...home(HERO.battery, 0.45)]);
  pose(R.cell, [[F('b3', 0.5), [0, 0, 12], 2.0], [F('b3b', 0.35), [0, 0, 0], 1.6]]);
  keyed(fBatt, [[tBattOut + 0.1, 0, 1.2], [tJump, 1, 0.01]]);
  cue(tLiftB, 'lift'); cue(tBattOut, 'whoosh', 0.6); cue(F('b3b', 0.35) + 1.4, 'click', 0.8);
  // the adhesive lets go: a current runs between tray and cell
  const spark = glowSprite(0x7fb4ff, 70); spark.sprite.position.set(4, -18, -1.4); R.battery.add(spark.sprite);
  tl.hook((t) => { const k = pulse(t, F('b3', 0.22), 0.8, F('b3', 0.62), 1.2); spark.set(k * (0.55 + 0.25 * Math.sin(t * 17) + 0.2 * Math.sin(t * 41))); });
  cue(F('b3', 0.22), 'zap', 0.9);
  lit(() => R.cell.children[0].material, 0x39d98a, (t) => pulse(t, F('b4', 0.52), 1.0, tBattOut, 0.8) * 0.03 * (0.7 + 0.3 * Math.sin(t * 3)));
  // Pro Max comparison
  keyed((v) => { maxShell.glass(v * 0.9); fMaxCell(v); }, [[F('b1b', 0.05), 1, 1.2], [N('b1b') - 1.0, 0, 1.0]], 0);
  cue(F('b1b', 0.05), 'whoosh', 0.5);

  // ------------------------------------------------------------ bottom end
  const tBot = S('p1') + 2.2, tBotIn = N('p3') - 1.6;
  pose(R.speaker, [[tBot, [0, 0, 15], 1.8], [S('p2') - 0.4, [0, 0, 0], 1.4], ...home(HERO.bottom, 0.3)]);
  pose(R.taptic, [[F('p1', 0.52), [0, 0, 15], 1.8], [S('p2') - 0.2, [0, 0, 0], 1.4], ...home(HERO.bottom, 0.3)]);
  pose(R.usb, [[S('p2') + 0.8, [0, 0, 14], 1.8], [S('p3') + 0.2, [0, 0, 5], 1.6], [tBotIn, [0, 0, 0], 1.2], ...home(HERO.bottom, 0.3)]);
  tl.hook((t) => { R.taptic.position.x += 0.5 * Math.sin(t * 46) * pulse(t, F('p1', 0.62), 0.5, N('p1') - 0.8, 0.5); });
  R.usbFlex.children.forEach((m, i) => lit(() => m.material, 0x4f9dff, (t) => pulse(t, S('p3') + 1.0, 0.8, tBotIn, 0.8) * (0.6 + 0.9 * Math.max(0, Math.sin(t * 3.2 - i * 1.3)))));
  cue(tBot, 'servo', 0.7); cue(F('p1', 0.52), 'servo', 0.6); cue(F('p1', 0.62), 'data', 0.4); cue(S('p2') + 0.8, 'lift', 0.8); cue(S('p3') + 1.0, 'data', 0.7); cue(tBotIn + 1.0, 'click', 0.7);

  // ------------------------------------------------------------ vapor chamber
  pose(R.vapor, [[S('c1') + 1.2, [0, 0, 7], 2.0], [S('c2c') - 0.4, [0, 0, 0], 1.8], ...home(HERO.vapor, 0.25)]);
  pose(R.vLidG, [[S('c1b') + 1.0, [0, 0, 11], 1.8], [S('c2') - 1.0, [0, 0, 0], 1.4]]);
  pose(R.vWick, [[S('c1b') + 1.3, [0, 0, 5.5], 1.8], [S('c2') - 1.1, [0, 0, 0], 1.4]]);
  cue(S('c1') + 1.2, 'lift', 0.6); cue(S('c1b') + 1.0, 'servo', 0.8); cue(S('c2') - 1.0, 'click', 0.6);
  const VP = [[-8.5, -56.5], [30.8, -56.5], [30.8, 15], [7, 15], [7, 34], [-30.8, 34], [-30.8, -41.5], [-8.5, -41.5]];
  const heat = heatMap(rpoly(VP, 2.2), -2.62, SOC); R.vapor.add(heat.mesh);
  const mist = drift({ n: 54, from: [SOC[0] + 4, SOC[1] - 4, -2.2], reach: 58, lift: 10, size: 14, opacity: 0.4, rate: 0.15, arc: [-1.95, -0.55], grow: 1.3 });
  const beads = drift({ n: 40, from: [SOC[0], SOC[1], -2.75], reach: 70, size: 2.2, color: 0x6fd0ff, opacity: 0.6, rate: 0.2, reverse: true, smoke: false, arc: [-2.3, -0.3] });
  R.vapor.add(mist.group, beads.group);
  const hot = glowSprite(0xffa060, 34); hot.sprite.position.set(SOC[0], SOC[1], -2.4); R.vapor.add(hot.sprite);
  const tHeatOut = N('c2c') - 1.2;
  tl.hook((t) => {
    const k = pulse(t, S('c2') + 0.2, 1.4, tHeatOut, 1.2);
    heat.set(k * 0.9, 0.12 + 0.95 * ramp(t, S('c2') + 0.4, 6.5), t);
    mist.set(pulse(t, F('c2', 0.16), 1.5, tHeatOut - 0.2, 1.2), t);
    beads.set(pulse(t, F('c2', 0.72), 1.2, tHeatOut, 1.0), t);
    hot.set(k * (0.5 + 0.1 * Math.sin(t * 3)));
  });
  cue(S('c2') + 0.2, 'riser', 0.45); cue(F('c2', 0.16), 'steam', 0.9); cue(F('c2', 0.72), 'water', 0.6); cue(S('c2b') + 0.5, 'steam', 0.5);

  // ------------------------------------------------------------ logic board
  const tSplit = F('c3', 0.4), tTurn = S('c6') - 0.9, tOpen = S('c7') + 0.3, tJoin = N('c7') - 2.6;
  pose(boardP, [[S('c1') + 0.3, [0, 0, 80], 1.6], [S('c3') - 0.5, [0, 0, 32, 0, PI, 0], 2.6], [tTurn, [0, 0, 32, 0, 0, 0], 2.2], [N('c7') - 1.4, [0, 0, 0, 0, 0, 0], 2.2], ...home(HERO.board, 0.6)]);
  let kBoard = 1;                                   // parts with their own fade inside the board multiply by the board's
  keyed((v) => { kBoard = v; fBoard(v); }, [[S('c1') + 0.5, 0, 1.2], [S('c3') - 0.4, 1, 1.4]]);
  // chip side up: board A above (its local −z is up while the board is turned over)
  pose(R.boardA, [[tSplit, [0, 0, -7], 1.8], [tJoin + 0.9, [0, 0, 0], 0.9]]);
  pose(R.boardB, [[tSplit, [0, 0, 7], 1.8], [tOpen, [0, -46, 9], 2.0], [tJoin, [0, 0, 7], 1.0], [tJoin + 0.9, [0, 0, 0], 0.9]]);
  cue(S('c1') + 0.3, 'lift', 0.7); cue(S('c3') - 0.5, 'whoosh', 0.6); cue(tSplit, 'servo', 0.9); cue(tTurn, 'whoosh', 0.6); cue(tOpen, 'slide', 0.5); cue(tJoin + 1.2, 'click');
  const socGlow = glowSprite(0xff8a4a, 30); socGlow.sprite.position.set(0, 0, -3.2); R.soc.add(socGlow.sprite);
  tl.hook((t) => { socGlow.set(pulse(t, S('c3') + 0.4, 1.2, tSplit + 0.5, 1.4) * 0.55); });
  lit(() => R.socLid.children[0].material, 0xff5a1e, (t) => pulse(t, S('c3') + 0.4, 1.2, tSplit + 0.5, 1.4) * 0.9 + pulse(t, F('c3', 0.62), 0.6, N('c3') - 0.6, 0.6) * 0.25);
  lit(() => R.ram.children[0].material, 0x5a8cff, (t) => pulse(t, S('c4') + 0.4, 0.8, N('c4') - 0.8, 0.8) * 0.5);
  lit(() => R.nand.children[0].material, 0x5a8cff, (t) => pulse(t, tOpen + 1.4, 0.8, tJoin, 0.6) * 0.5);
  lit(() => R.modem.material, 0x4f8dff, (t) => pulse(t, F('c6', 0.3), 0.6, N('c6b') - 0.6, 0.6) * 0.35);
  lit(() => R.n1.material, 0x39d98a, (t) => pulse(t, F('c6', 0.58), 0.6, N('c6') - 0.4, 0.6) * 0.35);
  cue(S('c3') + 0.4, 'zap', 0.6);
  // thermal stack between chip and chamber (shown only while it is being explained)
  const tStackA = S('c3b') + 0.4, tStackZ = N('c3b') - 1.0;
  [R.tChain, R.tFill, R.tPad].forEach((o, i) => {
    pose(o, [[tStackA - 0.5, [0, 0, -2.6 - i * 2.6], 0.01], [tStackZ, [0, 0, 0], 1.0]]);
    keyed((v) => fStack[i](v * kBoard), [[tStackA + i * 0.35, 1, 0.8], [tStackZ + 0.2, 0, 0.8]], 0);
  });
  cue(tStackA, 'servo', 0.7);
  // under the lid: the die
  const tDecap = S('c5') + 0.3, tRecap = N('c5b') - 1.0;
  pose(R.socLid, [[tDecap, [0, 0, -7], 1.8], [tRecap, [0, 0, 0], 1.0]]);
  keyed((v) => fSocLid(v * kBoard), [[tDecap + 0.2, 0, 1.4], [tRecap, 1, 0.9]]);
  cue(tDecap, 'lift', 0.6); cue(tRecap + 0.9, 'click', 0.6);

  // ------------------------------------------------------------ cameras
  const tCam = S('e1') + 0.4, tPrism = S('k3') + 0.6, tPrismOut = N('k4') - 1.2, tIso = S('e2') - 1.0;
  const tTeleReturn = F('k3', 0.39), tMainFace = F('k6', 0.68);
  const tBlade = S('e2b') + 0.4, tBladeIn = N('e2c') - 1.0, tStack = S('e5') + 0.2, tUnit = F('e5', 0.66), tHome = N('e5c') - 1.6;
  pose(R.ultra, [[tCam + 0.25, [0, 0, 28], 1.9], [S('k2') + 0.2, [0, 0, 40, -PI / 2], 1.4], [S('k3') - 0.2, [0, 0, 28], 1.2], [S('k5') - 0.6, [0, 0, 0], 1.6]]);
  pose(R.tele, [[tCam, [0, 0, 24], 1.9], [tPrism, [0, 0, 58, -PI / 2], 1.6],
    [tTeleReturn, [0, 0, 58], 1.5], [tPrismOut, [0, 0, 24], 1.6], [S('k5') - 0.6, [0, 0, 0], 1.6]]);
  keyed(fTeleLid, [[tTeleReturn + 0.5, 0, 1.4], [tPrismOut - 0.4, 1, 1.0]]);
  pose(R.rearSmall, [[S('k5') + 0.3, [0, 0, 18], 1.8], [N('k5') - 1.0, [0, 0, 0], 1.4], ...home(HERO.vapor, 0.25)]);
  // the main camera rises clear of the phone and turns its lens to the viewer
  pose(R.main, [[tCam + 0.5, [0, 0, 32], 1.9], [S('k5') - 0.6, [0, 0, 0], 1.6], [S('k6') - 0.4, [0, 0, 46, -0.5, 0, 0], 2.2],
    [tMainFace, [0, 0, 46, -PI / 2], 1.5],
    [tIso, [-LENS.main[0], 10 - LENS.main[1], 86, -PI / 2, 0, 0], 2.8], [tHome, [0, 0, 0, 0, 0, 0], 2.4]]);
  pose(R.cams, home(HERO.cams, 0.6));
  cue(tCam, 'servo', 0.9); cue(tPrism, 'lift', 0.6); cue(S('k5') + 0.3, 'servo', 0.6); cue(S('k6') - 0.4, 'lift', 0.6); cue(tIso, 'whoosh', 0.6); cue(tHome, 'whoosh', 0.5);
  // light folded through the tetraprism: in through the lens, four bounces, onto the sensor
  const beamPts = [[0, 0, -9], [0, 0, -1.5], [-2.2, 3.5, -0.35], [-8, 3.5, -2.55], [-13.8, 3.5, -0.35], [-19.6, 3.5, -2.55], [-25.2, 3.5, -2.4]].map((p) => new THREE.Vector3(...p));
  const beam = new THREE.Group(); beam.name = ''; R.tele.add(beam);
  const beamMat = new THREE.MeshBasicMaterial({ color: 0xfff1c9, transparent: true, opacity: 0.95, blending: THREE.AdditiveBlending, depthWrite: false, depthTest: false });
  const segs = beamPts.slice(1).map((b, i) => { const a = beamPts[i], m = new THREE.Mesh(new THREE.CylinderGeometry(0.16, 0.16, 1, 8).translate(0, 0.5, 0), beamMat); m.position.copy(a); m.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), b.clone().sub(a).normalize()); m.userData.len = a.distanceTo(b); m.renderOrder = 8; m.name = ''; beam.add(m); return m; });
  const tBeam = F('k3', 0.6);
  tl.hook((t) => { const k = pulse(t, tBeam, 0.2, tPrismOut - 0.6, 0.6); beam.visible = k > 0.002; beamMat.opacity = 0.9 * k; segs.forEach((m, i) => { m.scale.y = Math.max(0.001, m.userData.len * ramp(t, tBeam + i * 0.42, 0.42)); }); });
  cue(tBeam, 'data', 0.8); for (let i = 2; i < 6; i++) cue(tBeam + i * 0.42, 'tick', 0.9);
  // LiDAR pulses
  const lidar = glowSprite(0xff4466, 10); lidar.sprite.position.set(-21.5, 45.5, -6); R.rearSmall.add(lidar.sprite);
  tl.hook((t) => { const k = pulse(t, F('k5', 0.45), 0.4, N('k5') - 1.0, 0.5), u = ((t * 1.6) % 1); lidar.set(k * (1 - u) * 0.8); lidar.sprite.scale.setScalar(8 + 60 * u); });
  cue(F('k5', 0.45), 'data', 0.5);
  // the iris: cover off, one blade out for a closer look, then the whole unit exploded
  pose(R.apCover, [[F('e2', 0.22), [0, 0, -4.5], 1.8], [tStack, [0, 0, -15], 1.8], [tUnit, [0, 0, 0], 1.6]]);
  keyed(fCover, [[F('e2', 0.24), 0, 1.6], [tStack, 1, 1.4]]);
  cue(F('e2', 0.22), 'click', 0.7);
  pose(R.blades[0], [[tBlade, [-1.5, -2.2, -3.6], 1.8], [tBladeIn, [0, 0, 0], 1.2]]);
  const bladeMat = own(R.blades[0].children[0]);
  lit(() => bladeMat, 0x8fb0ff, (t) => pulse(t, tBlade + 0.4, 1.0, tBladeIn, 0.8) * 0.1);
  cue(tBlade, 'servo', 0.6); cue(tBladeIn + 1.0, 'click', 0.5);
  tl.hook((t) => { const k = pulse(t, S('e2c') + 0.2, 0.6, tBladeIn - 0.2, 0.5); R.hair.visible = R.screw2.visible = k > 0.01; R.hair.scale.x = R.hair.scale.z = 0.035 * Math.max(k, 0.01); R.screw2.scale.setScalar(Math.max(0.001, k)); });
  for (const [p, z] of [[R.aperture, -8], [R.mCan, 5], [R.mOis, 10.5], [R.mSensor, 17]]) pose(p, [[tStack, [0, 0, z], 1.9], [tUnit, [0, 0, 0], 1.6]]);
  cue(tStack, 'servo', 0.9); cue(tUnit + 1.2, 'click');
  const dOf = (f) => FOCAL / f, WIDE = dOf(STOPS[0]), NARROW = dOf(4);
  const steps = [[S('e3b') + 0.9, 1], [F('e3b', 0.56), 2], [F('e3b', 0.86), 3]];
  const iris = (t) => {
    let d = WIDE;
    d += (NARROW - d) * pulse(t, F('h2', 0.66), 0.9, F('h2', 0.92), 1.1);                    // a first look, through the rear lens
    for (const [ts, i] of steps) d += (dOf(STOPS[i]) - d) * ramp(t, ts, 0.28);
    d += (WIDE - d) * ramp(t, S('e3c') - 0.2, 0.9);                                           // wide: more light, soft background
    d += (NARROW - d) * ramp(t, F('e3c', 0.42), 0.9);                                         // narrow: more in focus
    const m = pulse(t, S('e4') + 0.2, 0.8, S('e5') - 0.4, 0.8);                               // driven open and shut
    if (m > 0) d += ((NARROW + WIDE) / 2 + (WIDE - NARROW) / 2 * Math.cos((t - S('e4')) * 2.6) - d) * m;
    d += (WIDE - d) * ramp(t, S('e5') - 0.4, 0.6);
    return d;
  };
  tl.hook((t) => R.setAperture(iris(t)));
  steps.forEach(([t]) => cue(t, 'shutter')); for (const t of [F('h2', 0.66), F('h2', 0.92), S('e3c') - 0.2, F('e3c', 0.42)]) cue(t, 'shutter', 0.7);
  for (let i = 0; i < 5; i++) cue(S('e4') + 0.4 + i * 1.21, 'shutter', 0.6);
  R.drive.traverse((o) => { if (o.isMesh && o.name === 'Drive coil') lit(() => o.material, 0x4f8dff, (t) => pulse(t, S('e4') + 0.2, 0.8, S('e5') - 0.4, 0.8) * (0.6 + 0.4 * Math.sin((t - S('e4')) * 2.6) ** 2) * 2.2); });

  // ------------------------------------------------------------ camera
  const cam = new ShotCamera();
  const add = (a, b) => a.map((x, i) => x + b[i]);
  const Lm = [-LENS.main[0] / 100, (D / 2 + 4.3) / 100, -LENS.main[1] / 100];        // main lens with the phone face down
  const Mc = [0, 0.86, -0.1];                                                          // main camera held in the air
  const Bd = [-0.12, 0.32, -0.4];                                                      // logic board held in the air
  const Tl = [0.06, 0.56, -0.66];                                                      // telephoto held in the air
  cam.cut(0, [2.5, 0.07, 1.0], [0, 0.0, 0.05]);
  cam.to(S('h1') - 1.2, 4.2, [1.25, 1.55, 2.25], [0, 0, 0.08]);
  cam.to(F('h1', 0.6), 2.6, [2.35, 0.2, 1.35], [0, 0, 0.12]);
  cam.to(S('h2') - 0.2, 2.8, [1.1, 1.6, 2.1], [0, 0.03, 0]);
  cam.to(F('h2', 0.5), 3.2, [Lm[0] + 0.07, 0.36, Lm[2] + 0.23], Lm);
  cam.to(S('h2b') - 0.2, 3.2, [0.9, 1.5, 1.9], [0.35, 0.03, -0.1]);
  cam.to(S('h3') - 0.5, 2.8, [0, 2.9, 2.5], [0, 0, 0.06]);
  cam.to(tTitle + 0.3, 5, [0.3, 3.0, 2.3], [0, 0, 0.06]);
  // the outside
  cam.to(CH('outside') + 0.5, 3.0, [1.5, 1.5, 2.1], [0.3, 0, 0.05]);
  cam.to(S('o2') - 0.3, 3.0, [-1.2, 1.7, 2.0], [0.3, 0, 0.05]);
  cam.to(F('o2', 0.42), 3.0, [1.4, 1.6, 1.9], [0.3, 0.02, -0.05]);
  cam.to(S('o3') - 0.8, 3.0, [-2.3, 0.75, 0.25], [-0.1, 0, -0.26]);
  cam.to(F('o3', 0.56), 2.8, [2.3, 0.75, 0.6], [0.1, 0, -0.05]);
  cam.to(S('o4') - 0.4, 2.8, [0.45, 0.5, 2.05], [0.05, 0, 0.62]);
  cam.to(S('o5') - 0.4, 3.0, [0, 2.7, 1.4], [0, 0, 0]);
  cam.to(F('o5', 0.72), 3.0, [0.35, 1.3, -0.1], [0.12, 0, -0.62]);
  cam.to(S('o6') - 0.3, 3.2, [-1.4, 1.5, 2.0], [0.3, 0, 0.05]);
  // the way in
  cam.to(CH('in') + 0.6, 2.8, [1.5, 1.65, 1.85], [0.2, 0, 0]);
  cam.to(tBack + 1.4, 3.0, [1.75, 1.7, 1.75], [0.42, 0.05, -0.02]);
  cam.to(S('w2') - 0.6, 2.9, [-1.3, 1.6, 2.1], [0.3, 0.03, 0.05]);
  cam.to(S('w2b') - 0.3, 3.2, [-1.7, 1.2, 2.0], [0.3, 0.03, 0.05]);
  cam.to(tPeel - 0.2, 3.0, [-2.05, 0.62, 1.9], [0.2, 0.14, 0]);
  cam.to(S('w3') + 3.2, 3.2, [-1.55, 1.15, 2.1], [0.3, 0.16, 0]);
  cam.to(S('w3b') - 0.2, 4.0, [1.5, 0.9, 2.2], [0, 0.2, 0]);
  cam.to(S('w4') - 0.5, 3.2, [0, 2.5, 1.3], [0, 0, 0.03]);
  // display and Face ID
  cam.to(tLayers - 0.4, 3.0, [1.7, 1.25, 2.1], [0.35, 0.5, 0]);
  cam.to(F('d1', 0.5), 5.0, [1.3, 0.95, 2.3], [0.35, 0.55, 0]);
  cam.to(S('d2') - 0.5, 2.8, [0.75, 1.25, 0.55], [-0.02, 0.1, -0.55]);
  cam.to(S('d3') - 0.2, 2.8, [0.9, 0.75, 0.15], [0.02, 0.36, -0.62]);
  cam.to(S('d4') - 0.3, 2.8, [-0.55, 1.05, 0.2], [-0.15, 0.12, -0.6]);
  cam.to(tUnder - 0.2, 3.0, [-1.3, 1.45, 0.75], [-0.62, 0.2, -0.45]);
  // battery
  cam.to(CH('battery') + 0.5, 2.8, [1.2, 2.0, 1.85], [0.42, 0, 0.12]);
  cam.to(S('b1b') - 0.3, 2.6, [0.8, 3.0, 2.5], [0.5, 0, 0.25]);
  cam.to(S('b2') - 0.4, 2.6, [0.9, 1.9, 1.75], [0.36, 0.04, 0.12]);
  cam.to(tLiftB - 0.2, 2.6, [1.65, 1.0, 2.05], [0.2, 0.17, 0.15]);
  cam.to(S('b2b') + 0.5, 6.0, [-1.3, 1.1, 2.0], [0, 0.2, 0.15]);
  cam.to(S('b3') - 0.2, 2.8, [1.45, 0.78, 1.9], [-0.1, 0.26, 0.14]);
  cam.to(S('b3b') + 0.3, 4.0, [1.0, 1.1, 2.0], [0.3, 0.26, 0.14]);
  cam.to(S('b4') - 0.2, 3.0, [1.5, 1.2, 1.9], [0.45, 0.24, 0.1]);
  // the bottom end
  cam.to(CH('bottom') + 0.5, 2.8, [0.5, 1.5, 1.75], [0, 0, 0.5]);
  cam.to(F('p1', 0.5), 4.0, [-0.6, 1.15, 1.7], [0, 0.08, 0.55]);
  cam.to(S('p2') - 0.2, 2.8, [0.45, 0.9, 1.7], [0.08, 0.08, 0.66]);
  cam.to(S('p3') - 0.2, 3.2, [-0.7, 2.5, 1.2], [-0.35, 0, 0.05]);
  // staying cool
  cam.to(CH('cool') + 0.5, 2.8, [0, 2.6, 1.15], [0.3, 0, 0.06]);
  cam.to(S('c1b') - 0.2, 3.0, [1.7, 0.75, 1.7], [0.3, 0.1, 0.1]);
  cam.to(S('c2') - 0.9, 3.2, [0.55, 1.65, 1.45], [0, 0.03, 0.1]);
  cam.to(F('c2', 0.6), 4.0, [-0.5, 1.45, 1.45], [0.02, 0.03, 0.1]);
  cam.to(S('c2b') + 0.2, 5.0, [0.1, 1.5, 1.5], [0, 0.03, 0.12]);
  cam.to(S('c2c') - 0.2, 3.4, [1.45, 1.5, 2.0], [0.3, 0, 0.05]);
  // the brain
  cam.to(S('c3') - 0.5, 3.0, [0.52, 1.2, 0.72], add(Bd, [0, 0, 0.02]));
  cam.to(tSplit - 0.2, 2.6, [0.62, 0.86, 0.62], add(Bd, [0, 0, 0.04]));
  cam.to(tStackA - 0.2, 2.6, [0.3, 0.82, 0.2], [-0.2, 0.44, -0.27]);
  cam.to(S('c4') - 0.3, 2.6, [0.45, 1.0, 0.3], [-0.2, 0.39, -0.27]);
  cam.to(tDecap - 0.1, 2.8, [-0.08, 0.78, -0.1], [-0.11, 0.4, -0.262]);
  cam.to(S('c5b') - 0.2, 3.0, [0.2, 0.85, 0.2], [0.02, 0.4, -0.27]);
  cam.to(tTurn - 0.2, 3.0, [0.6, 1.15, 0.55], add(Bd, [0, 0.05, 0.04]));
  cam.to(S('c6b') - 0.2, 4.0, [0.2, 1.2, 0.5], add(Bd, [0.05, 0.02, 0.1]));
  cam.to(tOpen - 0.2, 2.8, [0.5, 1.35, 0.6], add(Bd, [-0.04, -0.05, 0.16]));
  // three cameras
  cam.to(CH('cameras') + 0.5, 2.8, [1.45, 1.55, 1.05], [0.05, 0.12, -0.42]);
  cam.to(S('k2') - 0.2, 2.6, [0.22, 0.86, -0.29], [0.035, 0.42, -0.54]);
  cam.to(tPrism - 0.1, 2.1, [0.36, 1.06, -0.38], [0.19, 0.6, -0.625]);
  cam.to(tTeleReturn, 2.0, [0.62, 1.15, -0.05], Tl);
  cam.to(tBeam - 0.3, 3.0, [0.2, 1.3, -0.28], add(Tl, [-0.02, 0, 0]));
  cam.to(S('k4') - 0.1, 3.0, [0.7, 1.05, 0.0], add(Tl, [0.12, -0.05, 0]));
  cam.to(S('k5') - 0.6, 2.8, [-1.0, 1.1, 0.25], [-0.15, 0.12, -0.5]);
  cam.to(S('k6') - 0.4, 3.0, [1.0, 0.95, 0.35], [0.24, 0.42, -0.45]);
  cam.to(tMainFace, 1.8, [0.37, 0.94, -0.16], [0.19, 0.48, -0.455]);
  // the eye
  cam.to(tIso, 3.0, [0.2, 0.93, 0.5], add(Mc, [0, 0, 0.06]));
  cam.to(tBlade - 0.1, 2.6, [0.06, 0.9, 0.28], add(Mc, [0.0, 0.0, 0.1]));
  cam.to(S('e3') - 0.5, 2.6, [-0.1, 0.885, 0.36], add(Mc, [0.036, 0, 0.07]));
  cam.to(F('e3', 0.45), 6, [-0.03, 0.9, 0.33], add(Mc, [0.034, 0, 0.07]));
  cam.to(S('e3c') - 0.2, 4.0, [0.05, 0.92, 0.42], add(Mc, [0.0, -0.02, 0.07]));
  cam.to(S('e4') - 0.2, 2.6, [0.16, 0.95, 0.38], add(Mc, [0.03, 0, 0.07]));
  cam.to(tStack - 0.3, 2.8, [0.62, 1.02, 0.36], add(Mc, [0.0, -0.005, 0.02]));
  cam.to(S('e5b') - 0.2, 4.0, [0.5, 1.0, 0.5], add(Mc, [0.12, 0, 0.02]));
  cam.to(S('e5c') - 0.2, 5.0, [-0.3, 0.98, 0.52], add(Mc, [0, -0.03, 0.02]));
  // the verdict
  cam.cut(tJump, [2.2, 1.35, 2.45], [-0.42, 0.26, 0]);
  cam.to(tJump + 0.1, N('v2') - tHero, [1.6, 1.2, 2.75], [-0.42, 0.26, 0]);
  cam.to(S('v2b') - 0.2, N('v2c') - S('v2b'), [-1.2, 1.3, 2.9], [0, 0.22, 0]);
  cam.to(tCollapse, 3.4, [1.5, 1.0, 2.3], [0, 0.02, 0.05]);
  cam.to(S('v3') + 3.0, 6, [2.45, 0.22, 1.4], [0, 0.0, 0.1]);
  cam.finish();

  // ------------------------------------------------------------ on-screen text
  const v = new THREE.Vector3();
  const of = (obj, dx = 0, dy = 0, dz = 0) => () => obj.localToWorld(v.set(dx, dy, dz)).clone();
  const labels = [];
  const label = (t0, t1, at, off, title, text = '') => { labels.push({ t0, t1, at, off, title, text }); cue(t0, 'tick', 0.5); };
  const headlines = [];
  const head = (t0, t1, text, o = {}) => headlines.push({ t0, t1, text, ...o });
  const stats = [];
  const stat = (t0, t1, x, y, value, caption, bars) => { stats.push({ t0, t1, x, y, value, caption, bars }); cue(t0, 'tick', 0.7); };
  const low = { y: 85, cls: 'small' };

  // hook
  label(S('h1') + 2.4, F('h1', 0.62), of(P, W / 2, 20, D / 2), [16, -10], '71.9 mm', 'Wide');
  label(F('h1', 0.68), N('h1') - 0.2, of(P, W / 2, -40, 0), [10, -14], '8.75 mm', 'Thick');
  label(F('h1', 0.68) + 0.5, N('h1') - 0.2, of(P, W / 2, 30, 0), [8, -20], '211 g', '');
  head(S('h2') + 0.5, F('h2', 0.3), 'A20 Pro. Two nanometers.', low);
  head(F('h2', 0.32), F('h2', 0.48), 'A vapor chamber.', low);
  head(F('h2', 0.52), N('h2') - 0.3, 'An aperture that opens and closes.', low);
  head(F('h2b', 0.52), N('h2b') - 0.3, 'Six moving blades inside one camera module.', low);
  head(tTitle, CH('outside') - 0.2, TITLE, { kicker: 'Deep teardown', cls: 'big', scrim: 0.5, sub: 'Layer by layer' });
  cue(tTitle, 'impact');
  // chapter titles
  CHAPTERS.filter((c) => c.title).forEach((c, i) => { head(CH(c.id) + 0.15, CH(c.id) + CARD, c.title, { kicker: String(i + 1).padStart(2, '0'), cls: 'big chapter', scrim: 0.72, chapter: true }); cue(CH(c.id), 'chapter'); });
  // the outside
  label(F('o1', 0.3), N('o1') - 0.3, of(P, W / 2, -30, 0), [14, 10], 'Aluminum unibody', 'One piece');
  stat(F('o1', 0.62), N('o1') - 0.3, 78, 38, '85%', 'Recycled aluminum in the enclosure · Apple');
  label(S('o2') + 1.4, F('o2', 0.42), of(P, 0, -20, D / 2), [22, -16], 'Ceramic Shield 2', 'Front glass');
  label(F('o2', 0.6), N('o2') - 0.3, of(R.back, 0, -30, -D / 2), [22, 10], 'Ceramic Shield back', 'Set into the aluminum');
  label(F('o2', 0.82), N('o2') - 0.3, of(P, 0, 54, -D / 2 - 2.5), [20, -14], 'Camera plateau', '');
  const B = R.btn, at = (b, dx = 0) => of(P, b.userData.at[0] + dx, b.userData.at[1], 0);
  label(S('o3') + 1.4, F('o3', 0.54), at(B.action, -1), [-6, -18], 'Action button', '');
  label(S('o3') + 2.4, F('o3', 0.54), at(B.volDown, -1), [8, -18], 'Volume', '');
  label(F('o3', 0.68), N('o3') - 0.3, at(B.side, 1), [-10, -18], 'Side button', '');
  label(F('o3', 0.84), N('o3') - 0.3, at(B.cc, 1), [8, -18], 'Camera Control', '');
  label(S('o4') + 1.2, N('o4') - 0.3, of(P, -19, -H / 2, 0), [-12, -14], 'Microphone', '');
  label(S('o4') + 1.8, N('o4') - 0.3, of(P, 19, -H / 2, 0), [12, -14], 'Speaker', '');
  label(F('o4', 0.6), N('o4') - 0.3, of(P, 0, -H / 2, 0), [10, 16], 'USB-C', 'Up to 10 Gb/s');
  label(S('o5') + 0.8, F('o5', 0.7), of(P, -W / 2 + 3, 10, D / 2), [-14, -8], '6.3-inch OLED', '2622 × 1206 · 460 ppi');
  label(F('o5', 0.22), F('o5', 0.7), of(P, W / 2 - 3, 30, D / 2), [14, -12], '120 Hz', 'ProMotion');
  label(F('o5', 0.42), F('o5', 0.7), of(P, W / 2 - 3, -30, D / 2), [14, 6], '3000 nits', 'Peak outdoor brightness');
  label(F('o5', 0.8), N('o5') - 0.3, of(P, 7.7, 66.2, D / 2), [14, -10], 'Dynamic Island', 'Smaller');
  stat(F('o6', 0.3), N('o6') - 0.5, 77, 40, 'IP68', '6 meters of water, for 30 minutes');
  // the way in
  label(tBack + 3.2, N('w1') - 3.2, of(R.back, 0, -50, -4), [-14, 16], 'Ceramic Shield back', 'Glass, opens easily');
  label(F('w1', 0.74), N('w1') - 3.2, of(R.coil, 21, -14, -3), [-12, -18], 'Wireless charging coil', 'Built into the panel');
  label(F('w1', 0.74) + 0.7, N('w1') - 3.2, of(R.coil, -26.4, -14, -3), [12, 14], 'MagSafe magnets', '');
  stat(S('w2') + 1.6, S('w2b') + 0.6, 76, 40, '70 °C', 'Approximate temperature to soften the adhesive');
  label(tPeel + 2.6, S('w3') + 3.0, of(R.display, -W / 2, 20, 4), [-12, -16], 'Display', 'Glued to the frame');
  head(S('w3b') + 1.6, N('w3b') - 0.3, 'The main components are accessed through the display.', low);
  const w4 = [[0.34, R.tele, [-17, 0, 3], [14, -12], 'Rear cameras'], [0.42, boardP, [-10, 10, 2], [-16, -6], 'Logic board'], [0.55, R.cell, [-20, -10, 2.3], [-20, 4], 'Battery'],
    [0.69, R.speaker, [4, 0, 2.2], [16, 2], 'Speaker'], [0.76, R.taptic, [-4, 0, 2], [-16, 4], 'Taptic Engine'], [0.88, R.usb, [0, -68.6, 1.6], [10, 12], 'USB-C port']];
  for (const [f, obj, p, off, title] of w4) label(F('w4', f), N('w4') - 0.3, of(obj, ...p), off, title);
  // display and Face ID
  label(F('d1', 0.24), tDispOut - 0.4, of(R.dGlass, W / 2 - 1, -40, 4), [14, -8], 'Cover glass', 'Ceramic Shield 2');
  label(F('d1', 0.42), tDispOut - 0.4, of(R.dPanel, W / 2 - 3, -40, 3.2), [14, 0], 'OLED panel', 'Makes the light');
  label(F('d1', 0.78), tDispOut - 0.4, of(R.dBack, W / 2 - 5, -40, 2.9), [14, 8], 'Heat spreader', '');
  label(S('d2') + 3.4, N('d2') - 0.3, of(R.frontCam, 10.5, 0, 0.8), [14, -12], 'Front camera array', 'No screws, no glue');
  label(S('d3') + 1.0, N('d3') - 0.4, of(R.frontCam, 4.2, 0, 1.3), [14, 8], 'Selfie camera', '18MP Center Stage');
  label(F('d3', 0.36), N('d3') - 0.4, of(R.frontCam, -4.2, 0, 1.2), [-14, 10], 'Dot projector', 'Infrared dot pattern');
  label(F('d4', 0.42), tUnder - 0.8, of(R.irCam, 0, 0, 0.8), [-14, -12], 'Infrared camera', 'Now under the display');
  label(S('d5') + 1.6, tUnderOut - 0.2, of(R.dPanel, -22.5, 64, 2.9), [14, -14], 'Infrared-pass filter', 'Likely function');
  label(S('d5') + 0.4, tUnderOut - 0.2, of(R.dBack, 10, -30, 2.85), [-10, 18], 'Underside of the display', '');
  // battery
  stat(F('b1', 0.36), S('b1b') + 0.2, 78, 40, '16.76 Wh', '4288 mAh · eSIM model');
  label(F('b1', 0.72), N('b1') - 0.4, of(R.tray, -31, -20, -2.6), [-16, 6], 'Steel tray', '');
  stat(S('b1b') + 0.6, N('b1b') - 0.5, 50, 84, '21.75 Wh', 'iPhone 18 Pro Max · 5567 mAh');
  label(S('b1b') + 1.0, N('b1b') - 0.5, of(maxG, 20, -60, 4), [10, 14], 'iPhone 18 Pro Max', 'Outline, to scale');
  stat(S('b2') + 0.2, tLiftB + 1.6, 80, 34, (t) => String(Math.min(13, Math.max(0, Math.floor((t - S('b2') - 0.25) / 0.2) + 1))), 'Screws');
  label(tLiftB + 2.2, N('b2') - 0.3, of(R.battery, -30, -10, 0), [-14, -10], 'Tray and cell', 'Lift out as one piece');
  head(F('b2b', 0.55), N('b2b') - 0.3, 'It comes out with a screwdriver.', low);
  stat(F('b3', 0.5), N('b3') - 0.4, 22, 36, '12 V', 'About 90 seconds to release the adhesive');
  label(F('b3', 0.2), N('b3') - 0.4, of(R.tray, 30, -30, -2.6), [14, 12], 'Electrically released adhesive', '');
  label(F('b3b', 0.42), N('b3b') - 0.3, of(R.battery, 30, -20, 0), [14, -10], 'Replacement part', 'Tray and cell together');
  stat(S('b4') + 0.8, F('b4', 0.5), 80, 36, '100%', 'Recycled cobalt · Apple');
  stat(F('b4', 0.54), tBattOut, 80, 36, '50%', 'In about 15 minutes, with a 60 W charger', { of: 10, n: (t) => Math.floor(5 * ramp(t, F('b4', 0.56), 2.2) + 0.01) });
  // the bottom end
  label(tBot + 1.4, S('p2') - 0.5, of(R.speaker, 13.5, 0, 2.1), [14, -10], 'Speaker', 'Sealed enclosure');
  label(F('p1', 0.6), S('p2') - 0.5, of(R.taptic, -9.7, 0, 1.8), [-14, -10], 'Taptic Engine', 'A weight moved by a magnet');
  label(S('p2') + 2.2, S('p3') - 0.2, of(R.usb, 4.8, -68.6, 1.5), [14, -12], 'USB-C port', 'A separate part');
  label(S('p3') + 1.6, tBotIn - 0.2, of(R.usbFlex, -32.2, -10, -2.1), [-14, -6], 'Flex cable', 'Runs up the side to the logic board');
  // staying cool
  stat(F('c1', 0.62), N('c1') - 0.4, 80, 38, '3×', 'The surface area of iPhone 17 Pro’s · Apple');
  label(S('c1') + 3.0, N('c1') - 0.4, of(R.vapor, -30.8, -10, -2.9), [-14, -8], 'Vapor chamber', 'Sealed, with a little liquid inside');
  label(S('c1b') + 2.6, S('c2') - 1.2, of(R.vLidG, 30.8, -30, -3), [14, -10], 'Upper skin', '');
  label(S('c1b') + 3.0, S('c2') - 1.2, of(R.vWick, 29.8, -30, -3.17), [14, 0], 'Wick', 'Fine mesh');
  label(S('c1b') + 3.4, S('c2') - 1.2, of(R.vBase, 30.8, -30, -3.3), [14, 10], 'Lower skin', '');
  label(F('c2', 0.14), N('c2') - 0.6, of(R.vapor, SOC[0], SOC[1], -2.6), [-16, -12], 'Evaporates', 'Where the chip is hot');
  label(F('c2', 0.48), N('c2') - 0.6, of(R.vapor, 24, -44, -2.6), [14, 8], 'Condenses', 'Where the plate is cooler');
  label(F('c2', 0.76), N('c2') - 0.6, of(R.vapor, 6, -16, -2.6), [18, -14], 'Wick', 'Draws the liquid back');
  head(S('c2b') + 1.0, N('c2b') - 0.3, 'No pump. No fan.', low);
  label(S('c2c') + 1.6, N('c2c') - 1.0, of(P, W / 2, -20, 0), [12, 8], 'Aluminum body', 'Carries the heat away');
  stat(F('c2c', 0.48), N('c2c') - 0.8, 78, 34, '40%', 'Better sustained performance · Apple’s claim');
  // the brain
  label(F('c3', 0.62), tStackA - 0.3, of(R.soc, 6.5, 6.5, -2.7), [-14, -14], 'A20 Pro', 'On the outside of the sandwich');
  label(tSplit + 1.6, tStackA - 0.3, of(R.boardA, 8, 26, -1.7), [-14, -8], 'Board A', '');
  label(tSplit + 1.9, tStackA - 0.3, of(R.boardB, 8, 26, 0.3), [-14, 8], 'Board B', '');
  const tk = [[R.tChain, 'Fine metal mesh', '', 0.3, 5, -12], [R.tPad, 'Spongy pad', '', 0.52, -1, -2], [R.tFill, 'Gap filler', 'Molds itself to the gap', 0.72, 2, 10]];
  tk.forEach(([o, title, text, f, y, oy]) => label(F('c3b', f), tStackZ - 0.2, of(o, -6, y, -2.75), [-14, oy], title, text));
  label(S('c4') + 1.2, N('c4') - 0.5, of(R.ram, -5, 6, -2.7), [14, -16], 'Memory', 'Beside the processor, not on top of it');
  const dieAt = ([x, y, w, h]) => of(R.die, -(x + w / 2 - 0.5) * 9.7, (0.5 - y - h / 2) * 9.7, -2.37);
  label(F('c5', 0.2), tRecap - 0.3, dieAt(DIE.p[0]), [-37, -16], '2 performance cores', '');
  label(F('c5', 0.34), tRecap - 0.3, dieAt(DIE.e[0]), [-27, 0], '4 efficiency cores', '');
  label(F('c5', 0.52), tRecap - 0.3, dieAt(DIE.gpu[1]), [27, -16], '7-core GPU', '');
  label(F('c5', 0.72), tRecap - 0.3, dieAt(DIE.npu[1]), [14, 16], 'Dual 16-core Neural Engine', '');
  head(F('c5', 0.1), N('c5') - 0.3, 'Schematic: Apple publishes the core counts, not the floor plan.', { y: 92, cls: 'small' });
  stat(S('c5b') + 0.2, N('c5b') - 0.9, 80, 40, '2 nm', 'Process · Apple');
  label(F('c6', 0.32), N('c6b') - 0.5, of(R.modem, 3, 3, 0.6), [14, -14], 'C2 modem', 'Cellular · Apple-designed');
  label(F('c6', 0.6), N('c6') - 0.3, of(R.n1, -3, 0, 0.6), [-14, -12], 'N1', 'Wi-Fi 7 · Bluetooth 6 · Thread');
  head(S('c6b') + 1.4, N('c6b') - 0.3, 'US iPhone 18 Pro Max: a Qualcomm modem.', low);
  label(tOpen + 1.8, tJoin - 0.2, of(R.nand, 6, 7, -0.4), [14, -12], 'Flash storage', 'Inside the sandwich');
  // three cameras
  label(S('k2') + 1.0, N('k2') - 0.3, of(R.ultra, 6.3, 0, 2.2), [14, -10], 'Ultra Wide', '48MP · 13 mm · ƒ/2.2');
  stat(F('k2', 0.6), N('k2') - 0.3, 22, 40, '120°', 'Field of view');
  label(S('k3') + 0.8, tTeleReturn, of(R.tele, 7.7, 0, -2.6), [14, -10], 'Telephoto', '48MP · ƒ/2.8');
  label(tBeam + 0.4, tPrismOut - 0.8, of(R.prism, -13.5, 6.7, -0.2), [-14, -12], 'Tetraprism', 'Four reflections');
  label(tBeam + 2.4, tPrismOut - 0.8, of(R.prism, -25.2, 3.5, -2.4), [-12, 14], 'Sensor', '');
  stat(S('k4') + 0.6, N('k4') - 1.0, 80, 38, '4×', 'Optical zoom · 100 mm equivalent');
  label(S('k5') + 1.2, N('k5') - 1.0, of(R.rearSmall, -21.5, 63, -2.2), [-14, -12], 'Flash', '');
  label(F('k5', 0.4), N('k5') - 1.0, of(R.rearSmall, -21.5, 45.5, -2), [-14, 8], 'LiDAR Scanner', 'Depth from pulses of infrared light');
  label(S('k6') + 1.2, tIso - 0.2, of(R.main, 7.7, 5, 2.6), [14, -14], 'Main camera', '48MP · 24 mm');
  label(F('k6', 0.3), tMainFace, of(R.mSensor, 7.7, -4, 2.3), [14, 6], 'Sensor', 'A little under half an inch across');
  label(F('k6', 0.48), tMainFace, of(R.mOis, -7.7, 0, 0.3), [-14, -4], 'Sensor-shift stabilization', '');
  head(F('k6', 0.72), N('k6') - 0.4, 'The main camera lifts out as a module.', low);
  // the eye
  label(F('e2', 0.5), N('e2') - 0.3, of(R.aperture, 3.6, -1.6, -7.5), [16, 10], 'Six blades', 'Each about as thin as a human hair');
  label(F('e2b', 0.42), tBladeIn - 0.3, of(R.blades[0], 0, 0, -7.3), [-14, -10], 'Pivot hole', '');
  label(F('e2b', 0.62), tBladeIn - 0.3, of(R.blades[0], 2.1, -0.6, -7.3), [14, -12], 'Slot', 'A pin slides here');
  label(S('e2c') + 0.8, tBladeIn - 0.3, of(R.screw2, 0, 0, 1), [14, 10], '2 mm screw', '');
  label(S('e2c') + 1.2, tBladeIn - 0.3, of(R.hair, 0, 0, -5), [-14, 10], 'Human hair', '');
  const fNow = (t) => { let i = 0; for (const [ts, k] of steps) if (t >= ts) i = k; return i; };
  stat(S('e3') + 1.6, S('e3c') - 0.6, 74, 44, (t) => `ƒ/${STOPS[fNow(t)].toFixed(STOPS[fNow(t)] === 1.48 ? 2 : 1)}`, (t) => `${(FOCAL / STOPS[fNow(t)]).toFixed(1)} mm opening`);
  head(S('e3c') + 0.6, F('e3c', 0.4), 'Wide: more light, a softer background.', low);
  head(F('e3c', 0.44), F('e3c', 0.74), 'Narrow: more of the scene in focus.', low);
  label(S('e4') + 1.0, S('e5') - 0.5, of(R.drive, 6.2, 2.4, -7.4), [14, -12], 'Magnetic drive', 'A magnet turns the rotor');
  const stack = [[R.apCover, [0, -6, 0], 'Cover'], [R.aperture, [0, -6, -7.3], 'Iris'], [R.mBarrel, [0, -5.2, -4], 'Lens'], [R.mOis, [0, -7.75, 0.3], 'Stabilizer'], [R.mSensor, [0, -7.75, 2.3], 'Sensor']];
  stack.forEach(([o, p, name], i) => label(tStack + 1.5 + i * 0.3, tUnit + 0.3, of(o, ...p), [[-4, -12], [-3, -17], [-2, -13], [3, -19], [6, -12]][i], name));
  head(tUnit + 0.6, N('e5') - 0.3, 'One sealed module. Replaced as a unit.', low);
  stat(F('e5b', 0.3), N('e5b') - 0.4, 76, 42, '$249', 'iPhone 17 Pro camera assembly · Apple Self Service Repair');
  head(F('e5c', 0.3), N('e5c') - 1.8, 'Variable aperture. One replaceable module.', low);
  // the verdict
  label(F('v2', 0.08), N('v2') - 0.5, of(R.tray, 31, -30, -2.6), [14, 4], 'Screwed-in battery tray', '');
  label(F('v2', 0.34), N('v2') - 0.5, of(R.tele, 7.7, 5, 0), [14, -4], 'Removable cameras', '');
  label(F('v2', 0.6), N('v2') - 0.5, of(R.display, W / 2, -20, 4), [14, -8], 'Entry through the display', 'Adhesive seal');
  head(F('v2b', 0.4), N('v2b') - 0.3, 'Parts are calibrated with Repair Assistant.', low);
  head(S('v2c') + 0.6, N('v2c') - 0.6, 'Replacement part availability varies by model.', low);
  const tEnd = S('v3') + 6.2;
  head(tEnd, DURATION - 0.4, TITLE, { cls: 'big', scrim: 0.55, kicker: 'Deep teardown', sub: 'Specifications: Apple · An independent model, not affiliated with Apple' });
  cue(tEnd, 'impact', 0.8); cue(tJump, 'servo', 0.8); cue(tCollapse, 'servo'); cue(tCollapse + 3.0, 'click'); cue(tCollapse + 2.6, 'chime', 0.7);

  sfx.sort((a, b) => a.t - b.t);
  return { tl, camera: cam, labels, headlines, stats, dips: [tJump], sfx, fadeIn: 1.2, fullTitle: TITLE };
}
