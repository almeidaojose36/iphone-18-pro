// Chapter 1: the tetraprism. A parallelogram glass block; the ray reflects off a mirror-coated
// slanted face, the top (TIR), the bottom (TIR) and a second slanted mirror, then exits to the sensor.
import { THREE, COL, baseScene, makeCamera, camPath, ramp, win, lerp, clamp01, glow, Beam, label, glassMat, edges, setOpacity } from '../util.js';

const V = (x, y, z = 0) => new THREE.Vector3(x - 2.6, y - 0.5, z);   // prism-local → world

export function build() {
  const scene = baseScene(), camera = makeCamera(36);

  // --- prism (h = 1, slanted faces at 30°) ---
  const s = new THREE.Shape();
  [[0, 1], [3.464, 1], [5.196, 0], [1.732, 0]].forEach(([x, y], i) => (i ? s.lineTo(x, y) : s.moveTo(x, y)));
  const pg = new THREE.ExtrudeGeometry(s, { depth: 1, bevelEnabled: false });
  pg.translate(-2.6, -0.5, -0.5);
  const prism = new THREE.Group();
  prism.add(new THREE.Mesh(pg, glassMat(0.2)), edges(pg, COL.cyan, 0.85));
  // mirror coatings on the two slanted faces
  const mirrorMat = new THREE.MeshStandardMaterial({ color: 0xdfe8f5, metalness: 1, roughness: 0.15, side: THREE.DoubleSide, transparent: true, opacity: 0.55 });
  for (const [a, b] of [[V(0, 1), V(1.732, 0)], [V(3.464, 1), V(5.196, 0)]]) {
    const m = new THREE.Mesh(new THREE.PlaneGeometry(2, 1), mirrorMat);
    m.position.copy(a).lerp(b, 0.5);
    m.rotation.z = -Math.PI / 6;
    m.rotation.x = Math.PI / 2;
    m.rotation.order = 'ZXY';
    prism.add(m);
  }
  scene.add(prism);

  // --- lens stack above the entry point ---
  const stack = new THREE.Group();
  const glass = glassMat(0.32);
  [[1.3, 0.62, 0.1], [1.55, 0.58, 0.07], [1.8, 0.6, 0.11], [2.08, 0.66, 0.08]].forEach(([y, r, th]) => {
    const e = new THREE.Mesh(new THREE.SphereGeometry(1, 40, 20), glass);
    e.scale.set(r, th, r); e.position.copy(V(0.866, y));
    stack.add(e);
  });
  const barrel = new THREE.Mesh(new THREE.CylinderGeometry(0.72, 0.72, 1.05, 48, 1, true, Math.PI * 0.5, Math.PI),
    new THREE.MeshStandardMaterial({ color: 0x1b1e24, metalness: 0.8, roughness: 0.4, side: THREE.DoubleSide }));
  barrel.position.copy(V(0.866, 1.7));
  stack.add(barrel);
  scene.add(stack);

  // --- phone chassis reference planes (back glass above, display below) ---
  const chassis = new THREE.Group();
  const wallMat = new THREE.MeshBasicMaterial({ color: 0x8aa0b8, transparent: true, opacity: 0.16, side: THREE.DoubleSide, depthWrite: false });
  const yTop = 2.45, yBot = -0.85;
  for (const y of [yTop, yBot]) {
    const w = new THREE.Mesh(new THREE.BoxGeometry(11, 0.06, 2.4), wallMat);
    w.position.set(0, y - 0.5, 0);
    const e = edges(w.geometry, 0x8aa0b8, 0.5);
    e.position.copy(w.position);
    chassis.add(w, e);
  }
  scene.add(chassis);

  // --- sensor + focus coils ---
  const sensor = new THREE.Group();
  const chip = new THREE.Mesh(new THREE.BoxGeometry(1.2, 0.08, 0.9),
    new THREE.MeshStandardMaterial({ color: 0x1d3b2b, metalness: 0.5, roughness: 0.4, emissive: 0x0d5a3a, emissiveIntensity: 0.5 }));
  const die = new THREE.Mesh(new THREE.BoxGeometry(0.9, 0.02, 0.66),
    new THREE.MeshStandardMaterial({ color: 0x232a4a, metalness: 0.9, roughness: 0.15, emissive: 0x3344aa, emissiveIntensity: 0.4 }));
  die.position.y = 0.05;
  const coilMat = new THREE.MeshStandardMaterial({ color: COL.copper, metalness: 0.9, roughness: 0.3, emissive: COL.copper, emissiveIntensity: 0 });
  for (const sx of [-1, 1]) {
    const coil = new THREE.Mesh(new THREE.TorusGeometry(0.2, 0.05, 10, 28), coilMat);
    coil.scale.set(0.6, 1, 2); coil.rotation.x = Math.PI / 2; coil.position.set(sx * 0.8, 0, 0);
    sensor.add(coil);
  }
  sensor.add(chip, die);
  const spot = glow(COL.gold, 0.5);
  spot.position.y = 0.1;
  sensor.add(spot);
  const sensorHome = V(4.33, -0.3);
  scene.add(sensor);

  // --- beams ---
  const pts = [V(0.866, 7), V(0.866, 0.5), V(1.732, 1), V(3.464, 0), V(4.33, 0.5), V(4.33, -0.22)];
  const beam = new Beam(pts, COL.gold, 0.028);
  scene.add(beam.group);
  const fr = [1, 2, 3, 4].map((i) => beam.fracAt(i));
  const flashes = [1, 2, 3, 4].map((i) => { const g = glow(COL.cyan, 0.9); g.position.copy(pts[i]); scene.add(g); return g; });

  // straight, unfolded version of the same optical path
  const straightEnd = V(0.866, 1 - 5.25);
  const ghost = new Beam([V(0.866, 7), straightEnd], COL.red, 0.022);
  scene.add(ghost.group);
  const ghostSensor = new THREE.Mesh(new THREE.BoxGeometry(1.2, 0.08, 0.9),
    new THREE.MeshStandardMaterial({ color: 0x4a1d1d, emissive: 0xff3030, emissiveIntensity: 0.6, transparent: true }));
  ghostSensor.position.copy(straightEnd).y -= 0.06;
  scene.add(ghostSensor);

  const L = {
    lens: label('telephoto lens', -3.4, 1.25, 0),
    body: label('phone body', 4.6, yTop - 0.5 + 0.3, 0),
    need: label('light needs > 15 mm to come into focus', -0.2, -2.2, 0),
    nofit: label('doesn’t fit', -1.73, -4.9, 0, 'bad'),
    tetra: label('tetraprism', 0.6, 0.95, 0.5),
    n1: label('1', pts[1].x - 0.05, pts[1].y - 0.42, 0.5, 'num'), n2: label('2', pts[2].x, pts[2].y + 0.32, 0.5, 'num'),
    n3: label('3', pts[3].x, pts[3].y - 0.32, 0.5, 'num'), n4: label('4', pts[4].x + 0.3, pts[4].y + 0.3, 0.5, 'num'),
    mirror: label('mirror-coated face', pts[1].x - 1.2, pts[1].y - 0.75, 0.5),
    tir: label('total internal reflection', pts[2].x + 0.4, pts[2].y + 0.75, 0.5),
    sensor: label('image sensor', sensorHome.x + 0.2, sensorHome.y - 0.5, 0.5),
    same: label('same distance, unfolded', -0.1, -3.0, 0),
    focus: label('autofocus: the sensor moves, in microns', sensorHome.x + 0.2, sensorHome.y + 1.75, 0.5),
  };
  const labels = Object.values(L);

  function state(t, c) {
    const fold = ramp(t, c.fold + 0.5, c.fold + 3.5);
    setOpacity(prism, fold);
    // the sensor slides from the "straight" position to its folded home
    sensor.position.copy(sensorHome);
    setOpacity(sensor, fold);
    spot.visible = t > c.b4 + 2;

    // straight-path ghost: drawn during "focal", hidden at "fold", returns for the hallway analogy
    const g1 = ramp(t, c.focal + 5, c.focal + 13) * (1 - ramp(t, c.fold, c.fold + 2.5));
    const g2 = win(t, c.hallway + 8, c.focus + 1, 2);
    ghost.setProgress(Math.max(g1 > 0 ? ramp(t, c.focal + 5, c.focal + 13) : 0, g2 > 0 ? ramp(t, c.hallway + 8, c.hallway + 14) : 0));
    ghost.haloMat.color.set(g2 > 0 ? COL.cyan : COL.red);
    ghost.group.visible = ghost.group.visible && (g1 > 0.01 || g2 > 0.01);
    setOpacity(ghostSensor, Math.max(ramp(t, c.focal + 12, c.focal + 14) * (1 - ramp(t, c.fold, c.fold + 2.5)), 0));

    // main beam: reaches each bounce exactly on the spoken count
    const ks = [c.bounce + 0.6, c.b1, c.b2, c.b3, c.b4, c.b4 + 2.2], vs = [0, fr[0], fr[1], fr[2], fr[3], 1];
    let p = 0;
    for (let i = 0; i < 5; i++) if (t >= ks[i]) p = lerp(vs[i], vs[i + 1], clamp01((t - ks[i]) / (ks[i + 1] - ks[i])));
    beam.setProgress(p);
    flashes.forEach((f, i) => {
      const dt = t - ks[i + 1];
      f.visible = dt > 0;
      f.scale.setScalar(0.35 + 1.4 * Math.exp(-dt * 2.5));
    });

    // focus hunt: damped oscillation of the sensor along the beam
    const tf = t - (c.focus + 9);
    const dy = t < c.focus + 3 ? 0 : tf < 0 ? 0.16 * ramp(t, c.focus + 3, c.focus + 5) : 0.16 * Math.exp(-tf * 0.55) * Math.cos(tf * 3.2);
    sensor.position.y += dy;
    coilMat.emissiveIntensity = Math.min(2, Math.abs(dy) * 14);
    spot.scale.setScalar(0.35 + Math.abs(dy) * 9);
    return { fold, dy };
  }

  function update(t, c) {
    for (const l of labels) l.o = 0;
    stack.visible = chassis.visible = true;
    state(t, c);
    L.lens.o = win(t, c.focal + 1.5, c.bounce, 1);
    L.body.o = win(t, c.focal + 3, c.hallway, 1);
    L.need.o = win(t, c.focal + 8, c.fold, 1);
    L.nofit.o = win(t, c.focal + 14, c.fold + 1, 0.6);
    L.tetra.o = win(t, c.fold + 5, c.bounce + 2, 0.8);
    [L.n1, L.n2, L.n3, L.n4].forEach((l, i) => { l.o = ramp(t, c['b' + (i + 1)], c['b' + (i + 1)] + 0.25) * (1 - ramp(t, c.focus, c.focus + 2)); });
    L.mirror.o = win(t, c.bounce + 3, c.b2, 0.6);
    L.tir.o = win(t, c.b1 + 2.5, c.b3, 0.6);
    L.sensor.o = win(t, c.b4 + 2, c.hallway + 3, 0.8);
    L.same.o = win(t, c.hallway + 12, c.focus, 1);
    L.focus.o = win(t, c.focus + 8, 1e9, 1);
    const sx = sensorHome.x, sy = sensorHome.y;
    camPath(camera, [
      { t: 0, p: [-0.5, -0.9, 15.5], l: [-0.4, -1.3, 0] },
      { t: c.fold, p: [0.8, -1.0, 16], l: [-0.2, -1.3, 0] },
      { t: c.fold + 4, p: [0.5, 0.9, 10.5], l: [0, 0.3, 0] },
      { t: c.bounce + 2, p: [-1.6, 1.4, 9.6], l: [-0.3, 0.4, 0] },
      { t: c.b4 + 3, p: [2.0, 1.0, 9.0], l: [0.3, 0, 0] },
      { t: c.hallway + 7, p: [1.5, 0.6, 10.5], l: [0.2, 0, 0] },
      { t: c.hallway + 12, p: [0.5, -1.2, 16], l: [0, -1.4, 0] },
      { t: c.focus, p: [0.5, -1.2, 16], l: [0, -1.4, 0] },
      { t: c.focus + 4, p: [sx + 0.9, sy + 1.2, 5.2], l: [sx, sy + 0.25, 0] },
      { t: c.focus + 30, p: [sx + 0.2, sy + 0.9, 4.4], l: [sx, sy + 0.2, 0] },
    ], t);
  }

  /** Outro pass: the full folded beam, camera pulling back out of the glass. */
  function outro(u) {
    for (const l of labels) l.o = 0;
    stack.visible = chassis.visible = true;
    setOpacity(prism, 1); setOpacity(sensor, 1); setOpacity(ghostSensor, 0);
    sensor.position.copy(sensorHome);
    ghost.setProgress(0);
    beam.setProgress(1, ramp(u, 0.15, 1) * 0.0);
    flashes.forEach((f) => { f.visible = true; f.scale.setScalar(0.4); });
    spot.visible = true; spot.scale.setScalar(0.4);
    coilMat.emissiveIntensity = 0.6 + 0.6 * Math.sin(u * 40);
    camPath(camera, [
      { t: 0, p: [sensorHome.x + 0.3, sensorHome.y + 0.7, 3.2], l: [sensorHome.x, sensorHome.y + 0.2, 0] },
      { t: 0.55, p: [0.6, 0.8, 9], l: [0, 0.2, 0] },
      { t: 1, p: [-1.4, 3.2, 12], l: [-1.2, 1.2, 0] },
    ], u);
  }

  return { scene, camera, labels, update, outro };
}
