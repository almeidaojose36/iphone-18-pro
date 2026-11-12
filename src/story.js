// The edit. Every move is keyed to a narration beat (content/script.js), whose times come from the
// recorded voice-over (content/timing.js), so the picture follows the audio.
import * as THREE from 'three';
import { Timeline, ShotCamera, pulse, ramp } from './timeline.js';
import { fader, rrect, rpoly, plate } from './kit.js';
import { glassify, heatMap, drift, glowSprite } from './fx.js';
import { W, H, D, LENS, STOPS, FOCAL, SOC } from './model/phone.js';
import { CHAPTERS, TITLE } from '../content/script.js';
import { TIMING } from '../content/timing.js';

export const DURATION = TIMING.total;
export const FOV = 30;
export const CARD = 3.6;                     // seconds a chapter title is on screen

export function buildStory({ phone, world, lights }) {
  const tl = new Timeline();
  const R = phone.refs;

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

  // ------------------------------------------------------------ looks
  const body = glassify(R.chassis), back = glassify(R.back), disp = glassify(R.display, 0xd8e4ff);
  const boardP = pivot(R.board, [-12, 40, -0.6]);
  for (const o of [R.soc, R.ram, R.nand]) o.children[0].material = o.children[0].material.clone();   // each chip lights up on its own
  const fBoard = fader(boardP), fBatt = fader(R.battery), fFront = fader(R.frontCam), fIr = fader(R.irCam), fCover = fader(R.apCover);
  const fScrews = R.screws.map((s) => fader(s));

  // ------------------------------------------------------------ key moments
  const tFlip1 = S('h2') + 0.2, tFlip2 = S('h3') - 0.5, tXray = S('h3') + 0.9;
  const tTitle = E('h3') + 0.5;
  const tBack = S('w1') + 0.9;
  const tPeel = E('w2') - 0.9, tAway = S('w4') - 0.5;
  const tLiftB = F('b2', 0.68);
  const tHero = CH('verdict') + 1.0, tJump = tHero - 0.5, tCollapse = S('v3') - 0.3;
  const HERO = { back: -20, vapor: 9, bottom: 16, battery: 27, screws: 34, board: 42, cams: 42, front: 54, display: 70 };

  // the phone itself: front up, flips over to show its back
  pose(world, [[tFlip1, [0, 0, 0, 0, 0, Math.PI], 2.6], [tFlip2, [0, 0, 0, 0, 0, 0], 2.4], [CH('in') + 0.7, [0, 0, 0, 0, 0, Math.PI], 2.4], [S('w2') - 0.6, [0, 0, 0, 0, 0, 0], 2.6],
    [tHero, [0, 0.0, 0, 0, 0.0, 0], 0.01]]);
  cue(tFlip1, 'whoosh', 0.7); cue(tFlip2, 'whoosh', 0.7); cue(CH('in') + 0.7, 'whoosh', 0.5); cue(S('w2') - 0.6, 'whoosh', 0.7);

  // lights come up out of the dark
  tl.hook((t) => {
    const b = lights.base, up = ramp(t, S('h1') - 1.4, 3.0), edge = ramp(t, 0.3, 2.2);
    lights.key.intensity = b.key * up; lights.fill.intensity = b.fill * up;
    lights.rim.intensity = b.rim * (0.25 + 0.75 * edge) * (3.2 - 2.2 * up); lights.rim2.intensity = b.rim2 * edge * (9 - 8.5 * up);
    lights.scene.environmentIntensity = b.env * (0.12 + 0.88 * up);
  });

  // glass look: solid ↔ x-ray
  const xr = [[tXray, 1, 1.6], [CH('in') + 0.5, 0, 1.4], [S('w4') - 0.4, 1, 1.6], [tJump, 0, 0.01]];
  keyed((v) => { body.solid(1 - v); body.glass(v); back.solid(1 - v); back.glass(v); }, xr, 0);
  const sweeps = [tXray - 0.2, S('w4') - 0.5, CH('cool') + 1.2, CH('eye') + 1.0];
  tl.hook((t) => { let p = -999, k = 0; for (const s of sweeps) { const u = (t - s) / 2.4; if (u > 0 && u < 1) { p = -H * 0.75 + u * H * 1.5; k = Math.sin(Math.PI * u) ** 0.7; } } body.sweep(p, k); back.sweep(p, k); disp.sweep(p, k * 0.7); });
  sweeps.forEach((s) => cue(s, 'sweep', 0.8));

  // ------------------------------------------------------------ display
  keyed((v) => { R.screen.material.emissiveIntensity = v * 1.05; R.screen.material.color.setScalar(0.03 + 0.97 * v); }, [[S('h1') - 1.0, 1, 1.8], [S('w2') + 1.4, 0, 1.2], [tCollapse + 2.6, 1, 1.6]], 0);
  pose(R.display, [[tPeel, [0, -2, 26, -0.1, 0, 0], 2.6], [S('w3') + 0.6, [0, 0, 32, 0, 0, 0], 1.8], [tAway, [0, 150, 70], 2.2], [tJump, [0, 0, HERO.display], 0.01], [tCollapse + 0.9, [0, 0, 0], 2.4]]);
  keyed((v, t) => { const x = t > tXray - 0.2 && t < CH('in') + 2 ? pulse(t, tXray, 1.6, CH('in') + 0.5, 1.4) : 0; disp.solid(v * (1 - x)); disp.glass(x); }, [[tAway + 0.5, 0, 1.4], [tJump, 1, 0.01]]);
  cue(tPeel, 'glass', 1); cue(tAway, 'whoosh', 0.6);
  // heat on the seam before the display lifts
  const seam = plate(rrect(W - 1.2, H - 1.2, 11), D / 2 + 0.02, D / 2 + 0.1, new THREE.MeshBasicMaterial({ color: 0xff5a1f, transparent: true, opacity: 0, blending: THREE.AdditiveBlending, depthWrite: false }),
    { bevel: 0, holes: [rrect(W - 4.4, H - 4.4, 9.4, 0, 0, THREE.Path)] });
  seam.castShadow = seam.receiveShadow = false; seam.name = ''; R.display.add(seam);
  tl.hook((t) => { const k = pulse(t, S('w2') + 4.2, 2.4, tPeel + 0.6, 1.6); seam.visible = k > 0.002; seam.material.opacity = k * (0.8 + 0.2 * Math.sin(t * 5)); });
  cue(S('w2') + 4.2, 'riser', 0.5);

  // ------------------------------------------------------------ rear glass
  pose(R.back, [[tBack, [0, 0, -24], 1.8], [tBack + 1.6, [-74, 0, -14, 0, 2.86, 0], 2.4], [N('w1') - 3.0, [0, 0, -24, 0, 0, 0], 1.8], [N('w1') - 1.5, [0, 0, 0], 1.3],
    [tJump, [0, 0, HERO.back], 0.01], [tCollapse + 0.2, [0, 0, 0], 2.2]]);
  cue(tBack, 'lift'); cue(N('w1') - 1.5, 'click', 0.8);

  // ------------------------------------------------------------ front sensors
  pose(R.frontCam, [[S('w5') + 0.5, [0, 0, 18], 1.8], [N('w5') - 1.3, [0, 0, 70], 1.4], [tJump, [0, 0, HERO.front], 0.01], [tCollapse + 0.75, [0, 0, 0], 2.2]]);
  pose(R.irCam, [[F('w5', 0.5), [0, 0, 13], 1.6], [N('w5') - 1.3, [0, 0, 70], 1.4], [tJump, [0, 0, HERO.front], 0.01], [tCollapse + 0.75, [0, 0, 0], 2.2]]);
  pose(R.earpiece, [[tJump, [0, 0, HERO.front], 0.01], [tCollapse + 0.75, [0, 0, 0], 2.2]]);
  keyed((v) => { fFront(v); fIr(v); }, [[N('w5') - 1.2, 0, 1.2], [tJump, 1, 0.01]]);
  cue(S('w5') + 0.5, 'servo', 0.7); cue(F('w5', 0.5), 'click', 0.7);

  // ------------------------------------------------------------ battery
  R.screws.forEach((s, i) => {
    const t0 = S('b2') + 0.25 + i * 0.2;
    pose(s, [[t0, [0, 0, 13 + (i % 3) * 2, 0, 0, 5], 0.8], [tLiftB + 1.0, [0, 0, 60], 1.4], [tJump, [0, 0, HERO.screws], 0.01], [tCollapse + 0.6, [0, 0, 0], 2.0]]);
    keyed(fScrews[i], [[tLiftB + 1.0, 0, 1.2], [tJump, 1, 0.01]]);
    cue(t0, 'screw', 0.8);
  });
  pose(R.battery, [[tLiftB, [0, 0, 26], 2.4], [S('b3') - 0.2, [0, 4, 30, 0.42, 0, 0], 2.2], [N('b3') - 1.3, [0, 0, 120, 0, 0, 0], 1.6], [tJump, [0, 0, HERO.battery], 0.01], [tCollapse + 0.45, [0, 0, 0], 2.2]]);
  pose(R.cell, [[F('b3', 0.5), [0, 0, 12], 2.0], [N('b3') - 0.2, [0, 0, 0], 0.01]]);
  keyed(fBatt, [[N('b3') - 1.2, 0, 1.2], [tJump, 1, 0.01]]);
  cue(tLiftB, 'lift'); cue(N('b3') - 1.3, 'whoosh', 0.6);
  // the adhesive lets go: a current runs between tray and cell
  const spark = glowSprite(0x7fb4ff, 70); spark.sprite.position.set(4, -18, -1.4); R.battery.add(spark.sprite);
  tl.hook((t) => { const k = pulse(t, F('b3', 0.22), 0.8, F('b3', 0.62), 1.2); spark.set(k * (0.55 + 0.25 * Math.sin(t * 17) + 0.2 * Math.sin(t * 41))); });
  cue(F('b3', 0.22), 'zap', 0.9); cue(F('b3', 0.5), 'click', 0.8);
  for (const p of [R.taptic, R.speaker, R.usb]) pose(p, [[tJump, [0, 0, HERO.bottom], 0.01], [tCollapse + 0.3, [0, 0, 0], 2.2]]);

  // ------------------------------------------------------------ vapor chamber
  pose(R.vapor, [[S('c1') + 1.2, [0, 0, 7], 2.0], [S('c3') - 0.6, [0, 0, 0], 1.6], [tJump, [0, 0, HERO.vapor], 0.01], [tCollapse + 0.25, [0, 0, 0], 2.2]]);
  const VP = [[-8.5, -56.5], [30.8, -56.5], [30.8, 15], [7, 15], [7, 34], [-30.8, 34], [-30.8, -41.5], [-8.5, -41.5]];
  const heat = heatMap(rpoly(VP, 2.2), -2.62, SOC); R.vapor.add(heat.mesh);
  const mist = drift({ n: 54, from: [SOC[0] + 4, SOC[1] - 4, -2.2], reach: 58, lift: 10, size: 14, opacity: 0.4, rate: 0.15, arc: [-1.95, -0.55], grow: 1.3 });
  const beads = drift({ n: 40, from: [SOC[0], SOC[1], -2.75], reach: 70, size: 2.2, color: 0x6fd0ff, opacity: 0.6, rate: 0.2, reverse: true, smoke: false, arc: [-2.3, -0.3] });
  R.vapor.add(mist.group, beads.group);
  const hot = glowSprite(0xffa060, 34); hot.sprite.position.set(SOC[0], SOC[1], -2.4); R.vapor.add(hot.sprite);
  tl.hook((t) => {
    const k = pulse(t, S('c2') + 0.2, 1.4, N('c2') - 1.2, 1.2);
    heat.set(k * 0.9, 0.12 + 0.95 * ramp(t, S('c2') + 0.4, 6.5), t);
    mist.set(pulse(t, F('c2', 0.16), 1.5, N('c2') - 1.4, 1.2), t);
    beads.set(pulse(t, F('c2', 0.72), 1.2, N('c2') - 1.2, 1.0), t);
    hot.set(k * (0.5 + 0.1 * Math.sin(t * 3)));
  });
  cue(S('c2') + 0.2, 'riser', 0.45); cue(F('c2', 0.16), 'steam', 0.9); cue(F('c2', 0.72), 'water', 0.6);

  // ------------------------------------------------------------ logic board
  pose(boardP, [[S('c1') + 0.3, [0, 0, 80], 1.6], [S('c3') - 0.5, [0, 0, 32, 0, Math.PI, 0], 2.6], [N('c4') - 1.4, [0, 0, 0, 0, 0, 0], 2.2], [tJump, [0, 0, HERO.board], 0.01], [tCollapse + 0.6, [0, 0, 0], 2.2]]);
  keyed(fBoard, [[S('c1') + 0.5, 0, 1.2], [S('c3') - 0.4, 1, 1.4]]);
  const tSplit = F('c3', 0.4), tSlide = F('c4', 0.6), tJoin = N('c4') - 2.6;
  pose(R.boardA, [[tSplit, [0, 0, -7], 1.8], [tSlide, [30, 0, -9], 1.8], [tJoin, [0, 0, -7], 1.0], [tJoin + 0.9, [0, 0, 0], 0.9]]);
  pose(R.boardB, [[tSplit, [0, 0, 7], 1.8], [tJoin + 0.9, [0, 0, 0], 0.9]]);
  cue(S('c1') + 0.3, 'lift', 0.7); cue(S('c3') - 0.5, 'whoosh', 0.6); cue(tSplit, 'servo', 0.9); cue(tSlide, 'slide', 0.5); cue(tJoin + 1.2, 'click');
  const socGlow = glowSprite(0xff8a4a, 30); socGlow.sprite.position.set(0, 0, -3.2); R.soc.add(socGlow.sprite);
  const socMat = R.soc.children[0].material, ramMat = R.ram.children[0].material, nandMat = R.nand.children[0].material;
  tl.hook((t) => {
    const k = pulse(t, S('c3') + 0.4, 1.2, tSplit + 0.5, 1.4);
    socGlow.set(k * 0.55);
    socMat.emissive.setHex(0xff5a1e); socMat.emissiveIntensity = k * 0.9 + pulse(t, F('c3', 0.62), 0.6, N('c3') - 0.6, 0.6) * 0.25;
    ramMat.emissive.setHex(0x5a8cff); ramMat.emissiveIntensity = pulse(t, S('c4') + 0.4, 0.8, tSlide, 0.8) * 0.5;
    nandMat.emissive.setHex(0x5a8cff); nandMat.emissiveIntensity = pulse(t, tSlide + 1.2, 0.8, tJoin, 0.6) * 0.5;
  });
  cue(S('c3') + 0.4, 'zap', 0.6);

  // ------------------------------------------------------------ cameras
  const tCam = S('e1') + 0.4, tIso = S('e2') - 0.9, tStack = S('e5') + 0.2, tUnit = F('e5', 0.66), tHome = N('e5') - 1.6;
  pose(R.tele, [[tCam, [0, 0, 24], 1.9], [tIso, [0, 0, 0], 1.6]]);
  pose(R.ultra, [[tCam + 0.25, [0, 0, 28], 1.9], [tIso + 0.1, [0, 0, 0], 1.6]]);
  // the main camera rises clear of the phone and turns its lens to the viewer
  pose(R.main, [[tCam + 0.5, [0, 0, 32], 1.9], [tIso, [-LENS.main[0], 10 - LENS.main[1], 86, -Math.PI / 2, 0, 0], 2.8], [tHome, [0, 0, 0, 0, 0, 0], 2.4]]);
  pose(R.cams, [[tJump, [0, 0, HERO.cams], 0.01], [tCollapse + 0.6, [0, 0, 0], 2.2]]);
  pose(R.rearSmall, [[tJump, [0, 0, HERO.vapor], 0.01], [tCollapse + 0.25, [0, 0, 0], 2.2]]);
  cue(tCam, 'servo', 0.9); cue(tIso, 'whoosh', 0.6); cue(tHome, 'whoosh', 0.5);
  pose(R.apCover, [[F('e2', 0.12), [0, 0, -4.5], 1.8], [tStack, [0, 0, -15], 1.8], [tUnit, [0, 0, 0], 1.6]]);
  keyed(fCover, [[F('e2', 0.14), 0, 1.6], [tStack, 1, 1.4]]);
  cue(F('e2', 0.12), 'click', 0.7);
  // exploded along the optical axis, then back to one sealed unit
  for (const [p, z] of [[R.aperture, -8], [R.mBarrel, 0], [R.mCan, 5], [R.mOis, 10.5], [R.mSensor, 17]]) if (z) pose(p, [[tStack, [0, 0, z], 1.9], [tUnit, [0, 0, 0], 1.6]]);
  cue(tStack, 'servo', 0.9); cue(tUnit + 1.2, 'click');
  // the iris
  const dOf = (f) => FOCAL / f;
  const steps = [[S('e3b') + 0.9, 1], [F('e3b', 0.56), 2], [F('e3b', 0.86), 3]];
  const iris = (t) => {
    let d = dOf(STOPS[0]);
    d += (dOf(4) - d) * pulse(t, F('h2', 0.66), 0.9, F('h2', 0.92), 1.1);                   // a first look, through the rear lens
    for (const [ts, i] of steps) d += (dOf(STOPS[i]) - d) * ramp(t, ts, 0.28);
    const m = pulse(t, S('e4') + 0.2, 0.8, S('e5') - 0.4, 0.8);                               // driven open and shut
    if (m > 0) d += ((dOf(4) + dOf(1.48)) / 2 + (dOf(1.48) - dOf(4)) / 2 * Math.cos((t - S('e4')) * 2.6) - d) * m;
    d += (dOf(STOPS[0]) - d) * ramp(t, S('e5') - 0.4, 0.6);
    return d;
  };
  tl.hook((t) => R.setAperture(iris(t)));
  steps.forEach(([t]) => cue(t, 'shutter')); cue(F('h2', 0.66), 'shutter', 0.7); cue(F('h2', 0.92), 'shutter', 0.6);
  for (let i = 0; i < 5; i++) cue(S('e4') + 0.4 + i * 1.21, 'shutter', 0.6);
  const driveMats = []; R.drive.traverse((o) => { if (o.isMesh && o.name === 'Drive coil') { o.material = o.material.clone(); driveMats.push(o.material); } });
  tl.hook((t) => { const k = pulse(t, S('e4') + 0.2, 0.8, S('e5') - 0.4, 0.8) * (0.6 + 0.4 * Math.sin((t - S('e4')) * 2.6) ** 2); for (const m of driveMats) { m.emissive.setHex(0x4f8dff); m.emissiveIntensity = k * 2.2; } });

  // ------------------------------------------------------------ camera
  const cam = new ShotCamera();
  const Lm = [-LENS.main[0] / 100, (D / 2 + 4.3) / 100, -LENS.main[1] / 100];        // main lens with the phone face down
  const Mc = [0, 0.86, -0.1];                                                          // main camera held in the air
  const Bd = [-0.12, 0.32, -0.4];                                                      // logic board held in the air
  cam.cut(0, [2.5, 0.07, 1.0], [0, 0.0, 0.05]);
  cam.to(S('h1') - 1.2, 4.2, [1.25, 1.55, 2.25], [0, 0, 0.08]);
  cam.to(F('h1', 0.6), 2.6, [2.35, 0.2, 1.35], [0, 0, 0.12]);
  cam.to(S('h2') - 0.2, 2.8, [1.1, 1.6, 2.1], [0, 0.03, 0]);
  cam.to(F('h2', 0.5), 3.2, [Lm[0] + 0.07, 0.36, Lm[2] + 0.23], Lm);
  cam.to(S('h3') - 0.5, 2.8, [0, 2.9, 2.5], [0, 0, 0.06]);
  cam.to(tTitle + 0.3, 5, [0.3, 3.0, 2.3], [0, 0, 0.06]);
  // the way in
  cam.to(CH('in') + 0.6, 2.8, [1.5, 1.65, 1.85], [0.2, 0, 0]);
  cam.to(tBack + 1.4, 3.0, [1.75, 1.7, 1.75], [0.42, 0.05, -0.02]);
  cam.to(S('w2') - 0.6, 2.9, [-1.3, 1.6, 2.1], [0, 0.03, 0.05]);
  cam.to(tPeel - 0.2, 3.0, [-2.05, 0.62, 1.9], [0, 0.14, 0]);
  cam.to(S('w3') + 3.2, 3.2, [-1.55, 1.15, 2.1], [0.1, 0.16, 0]);
  cam.to(S('w4') - 0.5, 3.2, [0, 2.5, 1.3], [0, 0, 0.03]);
  cam.to(S('w5') - 0.3, 2.8, [0.75, 1.25, 0.55], [-0.02, 0.1, -0.55]);
  // battery
  cam.to(CH('battery') + 0.5, 2.8, [1.2, 2.0, 1.85], [0.42, 0, 0.12]);
  cam.to(S('b2') - 0.3, 2.6, [0.9, 1.9, 1.75], [0.36, 0.04, 0.12]);
  cam.to(tLiftB - 0.2, 2.6, [1.65, 1.0, 2.05], [0.2, 0.17, 0.15]);
  cam.to(S('b3') - 0.2, 2.8, [1.45, 0.78, 1.9], [-0.1, 0.26, 0.14]);
  // staying cool
  cam.to(CH('cool') + 0.5, 2.8, [0, 2.6, 1.15], [0.3, 0, 0.06]);
  cam.to(S('c2') - 0.3, 3.2, [0.55, 1.65, 1.45], [0, 0.03, 0.1]);
  cam.to(F('c2', 0.6), 4.0, [-0.5, 1.45, 1.45], [0.02, 0.03, 0.1]);
  cam.to(S('c3') - 0.5, 3.0, [0.52, 1.2, 0.72], add(Bd, [0, 0, 0.02]));
  cam.to(tSplit - 0.2, 2.6, [0.62, 0.86, 0.62], add(Bd, [0, 0, 0.04]));
  cam.to(tSlide - 0.3, 2.6, [0.28, 1.25, 0.42], add(Bd, [-0.04, -0.04, 0.02]));
  // the eye
  cam.to(CH('eye') + 0.5, 2.8, [1.45, 1.55, 1.05], [0.05, 0.12, -0.42]);
  cam.to(tIso, 3.0, [0.2, 0.93, 0.5], add(Mc, [0, 0, 0.06]));
  cam.to(S('e3') - 0.3, 2.6, [-0.1, 0.885, 0.36], add(Mc, [0.036, 0, 0.07]));
  cam.to(F('e3', 0.45), 6, [-0.03, 0.9, 0.33], add(Mc, [0.034, 0, 0.07]));
  cam.to(S('e4') - 0.2, 2.6, [0.16, 0.95, 0.38], add(Mc, [0.03, 0, 0.07]));
  cam.to(tStack - 0.3, 2.8, [0.62, 1.02, 0.36], add(Mc, [0.0, -0.005, 0.02]));
  // the verdict
  cam.cut(tJump, [2.2, 1.35, 2.45], [-0.42, 0.26, 0]);
  cam.to(tJump + 0.1, N('v2') - tHero, [1.6, 1.2, 2.75], [-0.42, 0.26, 0]);
  cam.to(tCollapse, 3.4, [1.5, 1.0, 2.3], [0, 0.02, 0.05]);
  cam.to(S('v3') + 3.0, 6, [2.45, 0.22, 1.4], [0, 0.0, 0.1]);
  cam.finish();
  function add(a, b) { return a.map((x, i) => x + b[i]); }

  // ------------------------------------------------------------ on-screen text
  const v = new THREE.Vector3();
  const of = (obj, dx = 0, dy = 0, dz = 0) => () => obj.localToWorld(v.set(dx, dy, dz)).clone();
  const labels = [];
  const label = (t0, t1, at, off, title, text = '') => { labels.push({ t0, t1, at, off, title, text }); cue(t0, 'tick', 0.5); };
  const headlines = [];
  const head = (t0, t1, text, o = {}) => headlines.push({ t0, t1, text, ...o });
  const stats = [];
  const stat = (t0, t1, x, y, value, caption, bars) => { stats.push({ t0, t1, x, y, value, caption, bars }); cue(t0, 'tick', 0.7); };
  const P = phone.group;

  // hook
  label(S('h1') + 2.4, F('h1', 0.62), of(P, W / 2, 20, D / 2), [16, -10], '71.9 mm', 'Wide');
  label(F('h1', 0.68), N('h1') - 0.2, of(P, W / 2, -40, 0), [10, -14], '8.75 mm', 'Thick');
  label(F('h1', 0.68) + 0.5, N('h1') - 0.2, of(P, W / 2, 30, 0), [8, -20], '211 g', '');
  head(S('h2') + 0.5, F('h2', 0.3), 'A20 Pro. Two nanometers.', { y: 84, cls: 'small' });
  head(F('h2', 0.32), F('h2', 0.48), 'A vapor chamber.', { y: 84, cls: 'small' });
  head(F('h2', 0.52), N('h2') - 0.3, 'An aperture that opens and closes.', { y: 84, cls: 'small' });
  head(tTitle, CH('in') - 0.2, TITLE, { kicker: 'Teardown', cls: 'big', scrim: 0.5, sub: 'Layer by layer' });
  cue(tTitle, 'impact');
  // chapter titles
  CHAPTERS.filter((c) => c.title).forEach((c, i) => { head(CH(c.id) + 0.15, CH(c.id) + CARD, c.title, { kicker: `0${i + 1}`, cls: 'big', scrim: 0.72 }); cue(CH(c.id), 'chapter'); });
  // the way in
  label(tBack + 3.2, N('w1') - 3.2, of(R.back, 0, -50, -4), [-14, 16], 'Ceramic Shield back', 'Glass, opens easily');
  label(F('w1', 0.74), N('w1') - 3.2, of(R.coil, 21, -14, -3), [-12, -18], 'Wireless charging coil', 'Built into the panel');
  label(F('w1', 0.74) + 0.7, N('w1') - 3.2, of(R.coil, -26.4, -14, -3), [12, 14], 'MagSafe magnets', '');
  stat(S('w2') + 4.6, tPeel + 0.8, 76, 40, (t) => `${Math.round(21 + 49 * ramp(t, S('w2') + 4.8, 3.2))} °C`, 'To soften the display adhesive');
  label(tPeel + 2.2, S('w3') + 3.0, of(R.display, -W / 2, 20, 4), [-12, -16], 'Display', 'Glued to the frame');
  stat(F('w3', 0.52), N('w3') - 0.4, 77, 38, '3 of 4', 'Display frames cracked or pulled away · iFixit');
  const w4 = [[0.34, R.tele, [-17, 0, 3], [14, -12], 'Rear cameras', ''], [0.42, boardP, [-10, 10, 2], [-16, -6], 'Logic board', ''], [0.55, R.cell, [-20, -10, 2.3], [-20, 4], 'Battery', ''],
    [0.69, R.speaker, [4, 0, 2.2], [16, 2], 'Speaker', ''], [0.76, R.taptic, [-4, 0, 2], [-16, 4], 'Taptic Engine', ''], [0.88, R.usb, [0, -68.6, 1.6], [10, 12], 'USB-C port', '']];
  for (const [f, obj, p, off, title] of w4) label(F('w4', f), N('w4') - 0.3, of(obj, ...p), off, title);
  label(S('w5') + 1.6, N('w5') - 1.4, of(R.frontCam, 9, 0, 1), [14, -12], 'Front camera array', 'No screws, no glue');
  label(F('w5', 0.62), N('w5') - 1.4, of(R.irCam, 0, 0, 0.8), [-14, -10], 'Infrared camera', 'Now under the display');
  // battery
  stat(F('b1', 0.36), N('b1') - 0.4, 78, 40, '16.76 Wh', '4288 mAh · eSIM model');
  label(F('b1', 0.72), N('b1') - 0.4, of(R.tray, -31, -20, -2.6), [-16, 6], 'Steel tray', '');
  stat(S('b2') + 0.2, tLiftB + 1.6, 80, 34, (t) => String(Math.min(13, Math.max(0, Math.floor((t - S('b2') - 0.25) / 0.2) + 1))), 'Screws');
  label(tLiftB + 2.2, N('b2') - 0.3, of(R.battery, -30, -10, 0), [-14, -10], 'Tray and cell', 'Lift out as one piece');
  stat(F('b3', 0.5), N('b3') - 1.4, 22, 36, '12 V', 'About 90 seconds to release the adhesive');
  label(F('b3', 0.2), N('b3') - 1.4, of(R.tray, 30, -30, -2.6), [14, 12], 'Electrically released adhesive', '');
  // staying cool
  stat(F('c1', 0.62), N('c1') - 0.4, 80, 38, '3×', 'The surface area of iPhone 17 Pro’s · Apple');
  label(S('c1') + 3.0, N('c1') - 0.4, of(R.vapor, -30.8, -10, -2.9), [-14, -8], 'Vapor chamber', 'Sealed, with a little liquid inside');
  label(F('c2', 0.14), N('c2') - 1.2, of(R.vapor, SOC[0], SOC[1], -2.6), [-16, -12], 'Evaporates', 'Where the chip is hot');
  label(F('c2', 0.48), N('c2') - 1.2, of(R.vapor, 24, -44, -2.6), [14, 8], 'Condenses', 'Where the plate is cooler');
  label(F('c2', 0.76), N('c2') - 1.2, of(R.vapor, 6, -16, -2.6), [18, -14], 'Wick', 'Draws the liquid back');
  label(F('c3', 0.62), tSlide - 0.4, of(R.soc, 6.5, 6.5, -2.7), [-14, -14], 'A20 Pro', '2 nm · on the outside of the sandwich');
  label(tSplit + 1.6, tSlide - 0.4, of(R.boardA, 8, 26, -1.7), [-14, -8], 'Board A', '');
  label(tSplit + 1.9, tJoin - 0.2, of(R.boardB, 8, 26, 0.3), [-14, 8], 'Board B', '');
  label(S('c4') + 1.2, tSlide - 0.4, of(R.ram, -5, 6, -2.7), [14, -16], 'Memory', 'Beside the processor, not on top of it');
  label(tSlide + 1.6, tJoin - 0.2, of(R.nand, 6, 7, -0.9), [-14, -14], 'Flash storage', 'Inside the sandwich');
  // the eye
  label(tCam + 1.6, tIso - 0.2, of(R.tele, -10, 5, 3), [-14, -10], 'Telephoto', '48MP · 100 mm · tetraprism');
  label(tCam + 2.0, tIso - 0.2, of(R.ultra, -6, -4, 2.4), [-16, 8], 'Ultra Wide', '48MP · 13 mm');
  label(tCam + 2.4, tIso - 0.2, of(R.main, 7.7, -5, 2.6), [14, 8], 'Main', '48MP · 24 mm · variable aperture');
  label(F('e2', 0.34), N('e2') - 0.3, of(R.aperture, 3.6, -1.6, -7.5), [16, 10], 'Six blades', 'Each about as thin as a human hair');
  const fNow = (t) => { let i = 0; for (const [ts, k] of steps) if (t >= ts) i = k; return i; };
  stat(S('e3') + 1.6, S('e4') - 0.3, 74, 44, (t) => `ƒ/${STOPS[fNow(t)].toFixed(STOPS[fNow(t)] === 1.48 ? 2 : 1)}`, (t) => `${(FOCAL / STOPS[fNow(t)]).toFixed(1)} mm opening`);
  label(S('e4') + 1.0, S('e5') - 0.5, of(R.drive, 6.2, 2.4, -7.4), [14, -12], 'Magnetic drive', 'A magnet turns the rotor');
  const stack = [[R.apCover, [0, -6, 0], 'Cover'], [R.aperture, [0, -6, -7.3], 'Iris'], [R.mBarrel, [0, -5.2, -4], 'Lens'], [R.mOis, [0, -7.75, 0.3], 'Stabiliser'], [R.mSensor, [0, -7.75, 2.3], 'Sensor']];
  stack.forEach(([o, p, name], i) => label(tStack + 1.5 + i * 0.3, tUnit + 0.3, of(o, ...p), [[-4, -12], [-3, -17], [-2, -13], [3, -19], [6, -12]][i], name));
  head(tUnit + 0.6, tHome - 0.2, 'One sealed module. Replaced as a unit.', { y: 85, cls: 'small' });
  // the verdict
  stat(S('v1') + 3.2, N('v2') - 0.5, 24, 40, '7 / 10', 'Provisional repairability · iFixit', { of: 10, n: (t) => Math.floor(7 * ramp(t, S('v1') + 3.4, 1.8) + 0.01) });
  label(F('v2', 0.08), N('v2') - 0.5, of(R.tray, 31, -30, -2.6), [14, 4], 'Screwed-in battery tray', 'Credit');
  label(F('v2', 0.34), N('v2') - 0.5, of(R.tele, 7.7, 5, 0), [14, -4], 'Removable cameras', 'Credit');
  label(F('v2', 0.6), N('v2') - 0.5, of(R.display, W / 2, -20, 4), [14, -8], 'Entry through the display', 'Costs it');
  const tEnd = S('v3') + 6.2;
  head(tEnd, DURATION - 0.4, TITLE, { cls: 'big', scrim: 0.55, kicker: 'Teardown', sub: 'Teardown findings: iFixit · Specifications: Apple · An independent model, not affiliated with Apple' });
  cue(tEnd, 'impact', 0.8); cue(tHero - 0.5, 'servo', 0.8); cue(tCollapse, 'servo'); cue(tCollapse + 3.0, 'click'); cue(tCollapse + 2.6, 'chime', 0.7);

  sfx.sort((a, b) => a.t - b.t);
  return { tl, camera: cam, labels, headlines, stats, dips: [tJump], sfx, fadeIn: 1.2, fullTitle: TITLE };
}
