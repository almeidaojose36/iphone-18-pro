// Chapter 3: photodiodes, colour filters, microlenses and the "buckets in the rain" analogy.
import { THREE, COL, baseScene, makeCamera, camPath, ramp, win, lerp, clamp01, hash, label, edges, physGlass, roundedSlab, canvasTex } from '../util.js';

const N = 8, DEPTH = 1.2, M = 520, TOP = 10;
const fcol = (x, z) => (x % 2 === 0 && z % 2 === 0 ? 0 : x % 2 === 1 && z % 2 === 1 ? 2 : 1);   // RGGB
const RGB = [new THREE.Color(0xff4a4a), new THREE.Color(0x4be36c), new THREE.Color(0x4f86ff)];
const JEWEL = [new THREE.Color(0xff1626), new THREE.Color(0x0fd044), new THREE.Color(0x1846ff)];
const P = (i) => i - (N - 1) / 2;

export function build() {
  const scene = baseScene(), camera = makeCamera(40);
  const m4 = new THREE.Matrix4(), q = new THREE.Quaternion(), sc = new THREE.Vector3(), ps = new THREE.Vector3(), col = new THREE.Color();

  // the rest of the sensor: silicon wafer with a cell grid and metal micro-traces (tile = 2 × 2 cells)
  const tex = canvasTex(256, (g, S) => {
    g.fillStyle = '#0b0f1a'; g.fillRect(0, 0, S, S);
    for (let cy = 0; cy < 2; cy++) for (let cx = 0; cx < 2; cx++) {
      const x = cx * 128, y = cy * 128, gr = g.createRadialGradient(x + 64, y + 64, 6, x + 64, y + 64, 70);
      gr.addColorStop(0, '#2a3a5c'); gr.addColorStop(1, '#141c2e');
      g.fillStyle = gr; g.fillRect(x + 9, y + 9, 110, 110);
      g.fillStyle = '#c59a45'; g.fillRect(x + 12, y + 12, 16, 16);          // transfer gate contact
      g.fillStyle = '#0b0f1a'; g.fillRect(x + 16, y + 16, 8, 8);
    }
    g.fillStyle = '#b98f3e';                                                  // row / column metal lines
    for (const k of [0, 128]) { g.fillRect(0, k + 2, S, 2); g.fillRect(k + 2, 0, 2, S); }
    g.fillStyle = '#8fa3c4';
    for (const k of [0, 128]) { g.fillRect(0, k + 124, S, 1.5); g.fillRect(k + 124, 0, 1.5, S); }
    g.fillStyle = '#e0bd62';
    for (let i = 0; i < 8; i++) { g.beginPath(); g.arc(3 + (i % 2) * 128, 20 + i * 30, 2.5, 0, 7); g.fill(); }
  });
  tex.repeat.set(0.5, 0.5);
  const fs = new THREE.Shape([[-300, -300], [300, -300], [300, 300], [-300, 300]].map(([x, y]) => new THREE.Vector2(x, y)));
  const hole = N / 2 + 0.05;
  fs.holes.push(new THREE.Path([[-hole, -hole], [-hole, hole], [hole, hole], [hole, -hole]].map(([x, y]) => new THREE.Vector2(x, y))));
  const field = new THREE.Mesh(new THREE.ShapeGeometry(fs),
    new THREE.MeshPhysicalMaterial({ map: tex, metalness: 0.8, roughness: 0.5, iridescence: 0.45, iridescenceIOR: 1.7, envMapIntensity: 0.45 }));
  field.rotation.x = -Math.PI / 2; field.position.y = -0.03;
  scene.add(field);

  // silicon block with wells (walls = isolation trenches), metal lines along the wall tops
  const wallMat = new THREE.MeshPhysicalMaterial({ color: 0x46526e, metalness: 0.75, roughness: 0.32, iridescence: 0.7, iridescenceIOR: 1.7 });
  const walls = new THREE.InstancedMesh(new THREE.BoxGeometry(1, 1, 1), wallMat, (N + 1) * 2);
  const traces = new THREE.InstancedMesh(new THREE.BoxGeometry(1, 1, 1), new THREE.MeshStandardMaterial({ color: 0xd9b25a, metalness: 1, roughness: 0.28 }), (N + 1) * 2);
  for (let i = 0; i <= N; i++) {
    m4.compose(ps.set(i - N / 2, -DEPTH / 2, 0), q, sc.set(0.1, DEPTH, N + 0.1)); walls.setMatrixAt(i * 2, m4);
    m4.compose(ps.set(0, -DEPTH / 2, i - N / 2), q, sc.set(N + 0.1, DEPTH, 0.1)); walls.setMatrixAt(i * 2 + 1, m4);
    m4.compose(ps.set(i - N / 2, 0.004, 0), q, sc.set(0.03, 0.012, N + 0.1)); traces.setMatrixAt(i * 2, m4);
    m4.compose(ps.set(0, 0.004, i - N / 2), q, sc.set(N + 0.1, 0.012, 0.03)); traces.setMatrixAt(i * 2 + 1, m4);
  }
  const floor = new THREE.Mesh(new THREE.BoxGeometry(N + 0.1, 0.3, N + 0.1), new THREE.MeshStandardMaterial({ color: 0x0c1018, metalness: 0.6, roughness: 0.5 }));
  floor.position.y = -DEPTH - 0.15;
  scene.add(walls, traces, floor);

  // electrons collected in each well
  const fills = new THREE.InstancedMesh(new THREE.BoxGeometry(0.86, 1, 0.86), new THREE.MeshBasicMaterial(), N * N);
  fills.frustumCulled = false;
  scene.add(fills);

  // colour filters + microlenses
  const fgeo = roundedSlab(0.9, 0.9, 0.16, 0.1); fgeo.rotateX(Math.PI / 2);
  const filters = new THREE.InstancedMesh(fgeo, new THREE.MeshPhysicalMaterial({
    transmission: 0.82, thickness: 0.5, ior: 1.6, roughness: 0.04, clearcoat: 1, clearcoatRoughness: 0.03, envMapIntensity: 2.2,
    attenuationDistance: 0.6, transparent: true, opacity: 1, depthWrite: false }), N * N);
  const lenses = new THREE.InstancedMesh(new THREE.SphereGeometry(0.5, 28, 12, 0, Math.PI * 2, 0, Math.PI / 2),
    physGlass({ thickness: 0.25, iridescence: 0.6, env: 2.4, side: THREE.FrontSide }), N * N);
  for (let x = 0; x < N; x++) for (let z = 0; z < N; z++) {
    const i = x * N + z;
    filters.setColorAt(i, JEWEL[fcol(x, z)]);
    m4.compose(ps.set(P(x), 0, P(z)), q, sc.set(1, 1, 1)); filters.setMatrixAt(i, m4);
    m4.compose(ps.set(P(x), 0, P(z)), q, sc.set(0.96, 0.55, 0.96)); lenses.setMatrixAt(i, m4);
  }
  filters.frustumCulled = lenses.frustumCulled = false;
  scene.add(filters, lenses);

  // photons
  const photons = new THREE.InstancedMesh(new THREE.SphereGeometry(0.075, 10, 8), new THREE.MeshBasicMaterial(), M);
  photons.frustumCulled = false;
  scene.add(photons);

  // 2×2 block outline
  const blockGeo = new THREE.BoxGeometry(2.02, 0.5, 2.02);
  const block = edges(blockGeo, COL.white, 1);
  block.position.y = 0.35;
  scene.add(block);

  const L = {
    hair: label('each cell ≈ 1 micron · tens of millions per sensor', 0, 1.5, -5),
    well: label('photodiode: a well of silicon', -2.5, 0.6, 4.6),
    pe: label('1 photon in → 1 electron held', 2.5, 0.6, 4.6),
    filt: label('colour filter', -4.6, 0.6, 2.5), ml: label('microlens', 4.7, 1.0, 1.5),
    r: label('R', -0.5, 1.15, -0.5, 'num r'), g1: label('G', -0.5, 1.15, 0.5, 'num g'), g2: label('G', 0.5, 1.15, -0.5, 'num g'), b: label('B', 0.5, 1.15, 0.5, 'num b'),
    rain: label('photons = raindrops · wells = buckets', 0, 3.2, -4.5),
    few: label('few photons → luck decides → grain', 0, 2.2, -4.5, 'bad'),
    full: label('full well → clipped highlight', 0, 2.2, -4.5, 'bad'),
    read: label('each well is read out as a number', 0, 2.2, -4.5),
  };
  const labels = Object.values(L);

  const state = { F: 1, Lz: 1 };
  /** Electron level (0-1+) of well p at time t. */
  function level(x, z, t, c) {
    const h = hash(x, z), h2 = hash(z + 31, x + 7);
    const colourLoss = lerp(1, fcol(x, z) === 1 ? 0.8 : 0.6, state.F);
    let v = ramp(t, c.wells + 2, c.filters - 2) * 0.55 * (0.6 + 0.4 * h) * colourLoss * (1 - ramp(t, c.rain - 1, c.rain + 1));
    v += ramp(t, c.rain + 2, c.dark - 1) * 0.72 * (0.7 + 0.3 * h) * (1 - ramp(t, c.dark - 0.5, c.dark + 1));
    v += ramp(t, c.dark + 2, c.overflow - 1) * 0.34 * h2 * h2 * (1 - ramp(t, c.overflow - 0.5, c.overflow + 0.8));
    v += ramp(t, c.overflow + 1.5, c.overflow + 8) * 1.5 * (0.6 + 0.6 * h);
    return v * (1 - ramp(t, c.readout + 2.5 + z * 0.7, c.readout + 3.1 + z * 0.7));
  }

  function draw(t, c, rate) {
    for (let x = 0; x < N; x++) for (let z = 0; z < N; z++) {
      const i = x * N + z, v = level(x, z, t, c), lv = Math.max(0.001, Math.min(1, v));
      m4.compose(ps.set(P(x), -DEPTH + lv * DEPTH / 2, P(z)), q, sc.set(1, lv * DEPTH, 1));
      fills.setMatrixAt(i, m4);
      const sweep = win(t, c.readout + 2.2 + z * 0.7, c.readout + 3.1 + z * 0.7, 0.2);
      col.setRGB(0.25, 0.75, 1).lerp(RGB[fcol(x, z)], state.F * 0.55).lerp(col2.setRGB(1, 1, 1), Math.max(clamp01((v - 0.97) * 8), sweep));
      fills.setColorAt(i, col);
    }
    fills.instanceMatrix.needsUpdate = true; fills.instanceColor.needsUpdate = true;

    const T = 1.5, coloured = ramp(t, c.filters + 4, c.filters + 6), fy = 0.22;
    for (let i = 0; i < M; i++) {
      const tau = t / T + hash(i, 5), cyc = Math.floor(tau), f = tau - cyc;
      const x = Math.floor(hash(i, cyc + 1) * N), z = Math.floor(hash(cyc + 2, i) * N);
      const ci = Math.floor(hash(i + 3, cyc) * 3);
      const pass = state.F < 0.5 || ci === fcol(x, z);
      const yEnd = pass ? -DEPTH + Math.min(1, level(x, z, t, c)) * DEPTH : fy;
      const y = TOP - f * 1.25 * (TOP - yEnd);
      const alive = hash(i + 9, cyc) < rate && y > yEnd;
      const funnel = lerp(1, lerp(1, 0.25, clamp01((1.6 - y) / 1.4)), state.Lz);
      const jx = (hash(i, cyc + 4) - 0.5) * 0.8 * funnel, jz = (hash(cyc + 6, i) - 0.5) * 0.8 * funnel;
      m4.compose(ps.set(P(x) + jx, y, P(z) + jz), q, sc.setScalar(alive ? 1 : 0));
      photons.setMatrixAt(i, m4);
      col.setRGB(1, 0.95, 0.8).lerp(RGB[ci], coloured);
      photons.setColorAt(i, col);
    }
    photons.instanceMatrix.needsUpdate = true; photons.instanceColor.needsUpdate = true;
  }
  const col2 = new THREE.Color();

  function layers(F, Lz) {
    state.F = F; state.Lz = Lz;
    filters.position.y = 0.13 + (1 - F) * 5; filters.material.opacity = F; filters.visible = F > 0.01;
    lenses.position.y = 0.25 + (1 - Lz) * 5; lenses.material.opacity = Lz; lenses.visible = Lz > 0.01;
  }

  function update(t, c) {
    for (const l of labels) l.o = 0;
    layers(ramp(t, c.filters + 10, c.filters + 13), ramp(t, c.filters + 17, c.filters + 20));
    const ro = 1 - 0.85 * ramp(t, c.readout, c.readout + 2);
    filters.material.opacity *= ro; lenses.material.opacity *= ro;
    const rate =
      0.3 * ramp(t, c.wells + 2, c.wells + 4) + 0.2 * ramp(t, c.filters + 4, c.filters + 6) + 0.45 * ramp(t, c.rain + 1, c.rain + 3)
      - 0.89 * ramp(t, c.dark - 1, c.dark + 0.5) + 0.94 * ramp(t, c.overflow, c.overflow + 1.5) - ramp(t, c.readout - 0.5, c.readout + 1);
    draw(t, c, rate);
    block.visible = t > c.green + 1 && t < c.rain;
    L.hair.o = win(t, c.zoom + 9, c.wells + 1, 1);
    L.well.o = win(t, c.wells + 1, c.filters, 1);
    L.pe.o = win(t, c.wells + 6, c.filters, 1);
    L.filt.o = win(t, c.filters + 11, c.green, 1);
    L.ml.o = win(t, c.filters + 18, c.green, 1);
    for (const k of ['r', 'g1', 'g2', 'b']) L[k].o = win(t, c.green + 1.5, c.rain, 0.6);
    L.rain.o = win(t, c.rain + 2, c.dark, 1);
    L.few.o = win(t, c.dark + 2, c.overflow, 1);
    L.full.o = win(t, c.overflow + 4, c.readout, 1);
    L.read.o = win(t, c.readout + 2, 1e9, 1);
    camPath(camera, [
      { t: 0, p: [0, 150, 30], l: [0, 0, 0] },
      { t: c.zoom + 4, p: [0, 120, 26], l: [0, 0, 0] },
      { t: c.wells, p: [6, 9, 12], l: [0, -0.3, 0] },
      { t: c.filters, p: [-5, 7.5, 11.5], l: [0, -0.2, 0] },
      { t: c.filters + 9, p: [-8, 6.5, 9.5], l: [0, 0.5, 0] },
      { t: c.green, p: [7.5, 6, 9], l: [0, 0.3, 0] },
      { t: c.green + 4, p: [2.6, 4.6, 4.4], l: [0, 0.3, 0] },
      { t: c.rain, p: [3, 5, 5], l: [0, 0.2, 0] },
      { t: c.rain + 4, p: [9, 6.5, 11], l: [0, 1, 0] },
      { t: c.dark + 2, p: [-6.5, 4.5, 8.5], l: [0, -0.2, 0] },
      { t: c.overflow + 2, p: [6.5, 4.5, 8.5], l: [0, -0.2, 0] },
      { t: c.readout + 2, p: [0.5, 12, 9], l: [0, 0, 0] },
      { t: c.readout + 30, p: [0, 13, 8], l: [0, 0, 0] },
    ], t);
  }

  /** Outro: pull straight up and out of the wells. */
  function outro(u, t) {
    for (const l of labels) l.o = 0;
    layers(1, 1);
    block.visible = false;
    const c = { wells: -40, filters: -30, rain: -20, dark: 1e6, overflow: 1e6, readout: 1e6 };
    draw(t + 20, c, 0.5);
    camPath(camera, [
      { t: 0, p: [1.5, 1.6, 2.6], l: [0, -0.3, 0] },
      { t: 0.5, p: [5, 9, 9], l: [0, 0, 0] },
      { t: 1, p: [0, 150, 30], l: [0, 0, 0] },
    ], u);
  }

  return { scene, camera, labels, update, outro, envIntensity: 0.32 };
}
