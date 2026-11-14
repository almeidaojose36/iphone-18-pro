// Chapter 1: the tetraprism. A parallelogram glass block; the ray reflects off a mirror-coated
// slanted face, the top (TIR), the bottom (TIR) and a second slanted mirror, then exits to the sensor.
import { THREE, COL, baseScene, makeCamera, camPath, ramp, win, lerp, clamp01, glow, Beam, label, edges, setOpacity,
  physGlass, lensGeo, latheRing, brushedMetal, copperMat, woundCoil, pcbTexture } from '../util.js';

const V = (x, y, z = 0) => new THREE.Vector3(x - 2.6, y - 0.5, z);   // prism-local → world

export function build() {
  const scene = baseScene(), camera = makeCamera(36);

  // --- prism (h = 1, slanted faces at 30°): refractive glass, mirror coatings on the slanted faces ---
  const s = new THREE.Shape();
  [[0, 1], [3.464, 1], [5.196, 0], [1.732, 0]].forEach(([x, y], i) => (i ? s.lineTo(x, y) : s.moveTo(x, y)));
  const pg = new THREE.ExtrudeGeometry(s, { depth: 0.96, bevelEnabled: true, bevelSize: 0.02, bevelThickness: 0.02, bevelSegments: 2 });
  pg.translate(-2.6, -0.5, -0.48);
  const prism = new THREE.Group();
  const crystal = physGlass({ color: 0xeaf8ff, transmission: 0.97, thickness: 0.55, tint: 0x9fe6ff, attDist: 2.2, iridescence: 0.3, env: 2.6, roughness: 0.02 });
  prism.add(new THREE.Mesh(pg, crystal), edges(pg, COL.cyan, 0.28));
  const mirrorMat = new THREE.MeshStandardMaterial({ color: 0xeaf0f7, metalness: 1, roughness: 0.07, side: THREE.DoubleSide, envMapIntensity: 1.4 });
  for (const [a, b] of [[V(0, 1), V(1.732, 0)], [V(3.464, 1), V(5.196, 0)]]) {
    const m = new THREE.Mesh(new THREE.PlaneGeometry(2.04, 1.0), mirrorMat);
    m.position.copy(a).lerp(b, 0.5);
    m.rotation.z = -Math.PI / 6;
    m.rotation.x = Math.PI / 2;
    m.rotation.order = 'ZXY';
    prism.add(m);
  }
  scene.add(prism);

  // --- lens stack above the entry point: meniscus elements in a stepped, cut-away barrel ---
  const stack = new THREE.Group();
  stack.position.copy(V(0.866, 0));
  const glass = physGlass({ color: 0xe2f1ff, transmission: 0.93, thickness: 0.08, iridescence: 0.8, env: 2.4 });
  const blackMat = new THREE.MeshStandardMaterial({ color: 0x0b0c0f, metalness: 0.4, roughness: 0.6, side: THREE.DoubleSide });
  [[2.09, 0.62, 0.17, 0.1, -0.035], [1.84, 0.57, 0.06, -0.035, 0.075], [1.58, 0.56, 0.13, 0.06, 0.045], [1.33, 0.6, 0.08, 0.045, -0.055]].forEach(([y, r, tc, s1, s2]) => {
    const e = new THREE.Mesh(lensGeo(r, tc, s1, s2), glass); e.position.y = y;
    const spacer = new THREE.Mesh(latheRing([[r * 1.04, y - 0.05], [0.7, y - 0.05], [0.7, y + 0.05], [r * 1.04, y + 0.05]], 64, Math.PI / 2, Math.PI), blackMat);
    stack.add(e, spacer);
  });
  stack.add(new THREE.Mesh(latheRing([[0.7, 1.16], [0.78, 1.16], [0.78, 2.12], [0.72, 2.22], [0.66, 2.22], [0.7, 2.14]], 64, Math.PI / 2, Math.PI), blackMat));
  scene.add(stack);

  // --- phone chassis, sectioned along the optical axis (everything sits behind z = 0) ---
  const chassis = new THREE.Group();
  const yTop = 2.45, yBot = -0.85, D = 1.3, zc = -D / 2 - 0.02;
  const part = (x0, x1, y0, y1, mat, d = D, z = zc) => {
    const m = new THREE.Mesh(new THREE.BoxGeometry(x1 - x0, y1 - y0, d), mat);
    m.position.set((x0 + x1) / 2, (y0 + y1) / 2, z); chassis.add(m); return m;
  };
  const titanium = brushedMetal(0x9a9b9f, { roughness: 0.4 });
  const steelMat = brushedMetal(0x5e636b, { roughness: 0.5 });
  const backGlassMat = new THREE.MeshPhysicalMaterial({ color: 0x79808a, metalness: 0.2, roughness: 0.3, clearcoat: 1, clearcoatRoughness: 0.2 });
  const coverMat = new THREE.MeshPhysicalMaterial({ color: 0x0c0e12, metalness: 0, roughness: 0.06, clearcoat: 1 });
  const oledMat = new THREE.MeshStandardMaterial({ color: 0x0a0c11, emissive: 0x3d6bff, emissiveIntensity: 0.55, roughness: 0.4 });
  const dark = new THREE.MeshStandardMaterial({ color: 0x17191e, metalness: 0.3, roughness: 0.6 });
  const yT = yTop - 0.5, yB = yBot - 0.5, lx = V(0.866, 0).x;
  // back: glass either side of the camera plateau; plateau raised around the lens, sapphire window on top
  part(-14, lx - 1.2, yT - 0.05, yT + 0.06, backGlassMat); part(lx + 1.2, 14, yT - 0.05, yT + 0.06, backGlassMat);
  part(lx - 1.3, lx - 0.8, yT - 0.08, yT + 0.36, titanium); part(lx + 0.8, lx + 1.3, yT - 0.08, yT + 0.36, titanium);
  part(lx - 0.82, lx + 0.82, yT + 0.2, yT + 0.36, titanium, 0.5, -D + 0.25);
  const win0 = new THREE.Mesh(new THREE.CylinderGeometry(0.78, 0.78, 0.07, 64), physGlass({ thickness: 0.07, iridescence: 0.3, env: 0.9, roughness: 0.08 }));
  win0.position.set(lx, yT + 0.3, 0);
  const winRing = new THREE.Mesh(latheRing([[0.78, -0.06], [0.88, -0.06], [0.88, 0.04], [0.84, 0.08], [0.78, 0.08]], 72), new THREE.MeshStandardMaterial({ color: 0xa4a8ae, metalness: 1, roughness: 0.4, envMapIntensity: 0.7 }));
  winRing.position.set(lx, yT + 0.3, 0);
  chassis.add(win0, winRing);
  // front: steel support plate, OLED panel, cover glass
  part(-14, 14, yB + 0.02, yB + 0.07, steelMat); part(-14, 14, yB - 0.03, yB + 0.02, oledMat); part(-14, 14, yB - 0.15, yB - 0.03, coverMat);
  // camera module can: back plate and floor under the prism
  part(-2.9, 2.95, -1.15, yT - 0.12, steelMat, 0.04, -0.66);
  part(-2.9, 0.75, -0.62, -0.54, steelMat, 1.2, -0.06);
  // battery (right) and logic board with chips and shield cans (left)
  part(3.1, 14, yB + 0.14, yT - 0.14, dark);
  part(3.1, 14, yT - 0.5, yT - 0.42, new THREE.MeshStandardMaterial({ color: 0xc9ccd2, metalness: 1, roughness: 0.3 }), D + 0.01);
  part(-8.6, -3.15, 0.2, 0.3, new THREE.MeshStandardMaterial({ map: pcbTexture(3), metalness: 0.2, roughness: 0.55 }));
  const lid = brushedMetal(0x8f949c, { roughness: 0.45 });
  part(-5.4, -4.5, 0.3, 0.72, lid); part(-4.35, -3.3, 0.3, 0.55, dark); part(-5.3, -3.9, -0.25, 0.2, dark); part(-3.75, -3.3, -0.05, 0.2, lid);
  part(-14, -3.15, -1.2, -0.45, dark); part(-14, -3.15, 0.95, yT - 0.14, dark); part(-14, -5.7, -0.45, 0.95, dark); part(-8.4, -7.2, 0.3, 0.6, lid); part(-6.9, -5.9, 0.3, 0.5, dark);
  scene.add(chassis);

  // --- sensor on its flex board, wound focus coils on the carrier, magnets fixed to the module ---
  const sensor = new THREE.Group();
  const chip = new THREE.Mesh(new THREE.BoxGeometry(1.5, 0.05, 1.05), new THREE.MeshStandardMaterial({ map: pcbTexture(5), metalness: 0.3, roughness: 0.5 }));
  const carrier = new THREE.Mesh(new THREE.BoxGeometry(1.12, 0.06, 0.84), new THREE.MeshStandardMaterial({ color: 0x24282f, metalness: 0.3, roughness: 0.5 }));
  carrier.position.y = 0.05;
  const die = new THREE.Mesh(new THREE.BoxGeometry(0.9, 0.02, 0.66),
    new THREE.MeshPhysicalMaterial({ color: 0x232a55, metalness: 1, roughness: 0.16, iridescence: 1, iridescenceIOR: 1.8, emissive: 0x3344aa, emissiveIntensity: 0.3 }));
  die.position.y = 0.09;
  const padMat = new THREE.MeshStandardMaterial({ color: 0xe2c15e, metalness: 1, roughness: 0.25 });
  const pads = new THREE.InstancedMesh(new THREE.BoxGeometry(0.03, 0.012, 0.05), padMat, 44), pm = new THREE.Matrix4();
  for (let i = 0; i < 22; i++) for (const sz of [-1, 1]) { pm.makeTranslation((i - 10.5) * 0.045, 0.085, sz * 0.385); pads.setMatrixAt(i * 2 + (sz > 0 ? 1 : 0), pm); }
  const coilMat = copperMat();
  for (const sx of [-1, 1]) {
    const coil = woundCoil(0.34, 0.8, coilMat, { turns: 5, pitch: 0.024, wire: 0.024, layers: 4 });
    coil.rotation.x = Math.PI / 2; coil.position.set(sx * 0.98, 0.03, 0);
    sensor.add(coil);
  }
  sensor.add(chip, carrier, die, pads);
  const spot = glow(COL.gold, 0.5);
  spot.position.y = 0.13;
  sensor.add(spot);
  const sensorHome = V(4.33, -0.3);
  scene.add(sensor);
  const magnets = new THREE.Group();
  for (const sx of [-1, 1]) for (const k of [-1, 1]) {
    const m = new THREE.Mesh(new THREE.BoxGeometry(0.16, 0.12, 0.8), new THREE.MeshStandardMaterial({ color: k < 0 ? 0xb03434 : 0x3454b0, metalness: 0.8, roughness: 0.35 }));
    m.position.set(sensorHome.x + sx * 0.98 + k * 0.085, sensorHome.y - 0.2, 0);
    magnets.add(m);
  }
  scene.add(magnets);

  // --- beams ---
  const pts = [V(0.866, 7), V(0.866, 0.5), V(1.732, 1), V(3.464, 0), V(4.33, 0.5), V(4.33, -0.22)];
  const beam = new Beam(pts, COL.gold, 0.024);
  scene.add(beam.group);
  const fr = [1, 2, 3, 4].map((i) => beam.fracAt(i));
  const flashes = [1, 2, 3, 4].map((i) => { const g = glow(COL.cyan, 0.9); g.position.copy(pts[i]); scene.add(g); return g; });

  // straight, unfolded version of the same optical path
  const straightEnd = V(0.866, 1 - 5.25);
  const ghost = new Beam([V(0.866, 7), straightEnd], COL.red, 0.022);
  scene.add(ghost.group);
  const ghostSensor = new THREE.Mesh(new THREE.BoxGeometry(1.2, 0.08, 0.9),
    new THREE.MeshStandardMaterial({ color: 0x4a1d1d, emissive: 0xff3030, emissiveIntensity: 0.6, transparent: true, depthTest: false }));
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
    setOpacity(sensor, fold); setOpacity(magnets, fold);
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
    setOpacity(prism, 1); setOpacity(sensor, 1); setOpacity(magnets, 1); setOpacity(ghostSensor, 0);
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
