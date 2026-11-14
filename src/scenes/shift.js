// Chapter 2: sensor-shift stabilisation. The housing shakes; coils move the sensor so the image
// stays on the same spot of silicon.
import { THREE, COL, baseScene, makeCamera, camPath, ramp, win, glow, Beam, label, span, setOpacity, hash,
  physGlass, lensGeo, latheRing, brushedMetal, copperMat, woundCoil, flexureGeo, pcbTexture, canvasTex } from '../util.js';

const shake = (t, out) => {
  out.x = 0.1 * (Math.sin(t * 7.3) + 0.6 * Math.sin(t * 13.1 + 1) + 0.3 * Math.sin(t * 23.7 + 2));
  out.y = 0.1 * (Math.cos(t * 6.1) + 0.6 * Math.sin(t * 11.3 + 0.5) + 0.3 * Math.cos(t * 19.9));
  return out;
};

export function build() {
  const scene = baseScene(), camera = makeCamera(36);
  const W = 1.9, H = 1.45, FW = 3.3, FH = 2.7;

  // housing (shakes with the phone): brushed steel can, screws, magnets on steel yokes
  const housing = new THREE.Group();
  const hMat = brushedMetal(0x555a62, { roughness: 0.45 });
  for (const [x, y, w, h] of [[0, FH / 2, FW + 0.2, 0.2], [0, -FH / 2, FW + 0.2, 0.2], [FW / 2, 0, 0.2, FH - 0.2], [-FW / 2, 0, 0.2, FH - 0.2]]) {
    const b = new THREE.Mesh(new THREE.BoxGeometry(w, h, 0.5), hMat);
    b.position.set(x, y, 0);
    housing.add(b);
  }
  const back = new THREE.Mesh(new THREE.BoxGeometry(FW, FH, 0.06), brushedMetal(0x1c1f25, { roughness: 0.6 }));
  back.position.z = -0.28;
  housing.add(back);
  const screwMat = new THREE.MeshStandardMaterial({ color: 0xb9bdc4, metalness: 1, roughness: 0.3 });
  for (const [sx, sy] of [[1, 1], [1, -1], [-1, 1], [-1, -1]]) {
    const sc = new THREE.Mesh(new THREE.CylinderGeometry(0.055, 0.055, 0.03, 24), screwMat);
    sc.rotation.x = Math.PI / 2; sc.position.set(sx * FW / 2, sy * FH / 2, 0.26);
    const slot = new THREE.Mesh(new THREE.BoxGeometry(0.09, 0.014, 0.012), new THREE.MeshBasicMaterial({ color: 0x050607 }));
    slot.position.set(sx * FW / 2, sy * FH / 2, 0.275); slot.rotation.z = sx * sy * 0.6;
    housing.add(sc, slot);
  }
  const magN = new THREE.MeshStandardMaterial({ color: 0xb53232, metalness: 0.85, roughness: 0.32 });
  const magS = new THREE.MeshStandardMaterial({ color: 0x3252b5, metalness: 0.85, roughness: 0.32 });
  const sides = [[0, 1], [0, -1], [1, 0], [-1, 0]];
  for (const [sx, sy] of sides) {
    const horiz = sx === 0;
    const px = sx * (FW / 2 - 0.3), py = sy * (FH / 2 - 0.3);
    const yoke = new THREE.Mesh(new THREE.BoxGeometry(horiz ? 0.78 : 0.22, horiz ? 0.22 : 0.78, 0.05), screwMat);
    yoke.position.set(px, py, -0.225);
    housing.add(yoke);
    for (const k of [-1, 1]) {
      const m = new THREE.Mesh(new THREE.BoxGeometry(horiz ? 0.34 : 0.16, horiz ? 0.16 : 0.34, 0.2), k < 0 ? magN : magS);
      m.position.set(px + (horiz ? k * 0.17 : 0), py + (horiz ? 0 : k * 0.17), -0.1);
      housing.add(m);
    }
  }
  const lens = new THREE.Group();
  const lensEl = new THREE.Mesh(lensGeo(1.22, 0.24, 0.14, 0.05, 72), physGlass({ color: 0xe6f3ff, transmission: 0.95, thickness: 0.2, iridescence: 0.7, env: 2.2 }));
  const lensRing = new THREE.Mesh(latheRing([[1.26, -0.08], [1.4, -0.08], [1.4, 0.05], [1.34, 0.1], [1.26, 0.1]], 96), brushedMetal(0x2b2e35, { roughness: 0.4 }));
  lensEl.rotation.x = lensRing.rotation.x = Math.PI / 2;
  lens.add(lensEl, lensRing);
  lens.position.z = 1.4;
  housing.add(lens);
  scene.add(housing);

  // floating sensor: PCB with traces, ceramic carrier, die, wire bonds, solder joints, wound coils
  const sensor = new THREE.Group();
  const BW = W + 0.56, BH = H + 0.56;
  const board = new THREE.Mesh(new THREE.BoxGeometry(BW, BH, 0.06), new THREE.MeshStandardMaterial({ map: pcbTexture(2), metalness: 0.3, roughness: 0.5 }));
  board.position.z = -0.04;
  const carrier = new THREE.Mesh(new THREE.BoxGeometry(W + 0.12, H + 0.12, 0.05), new THREE.MeshStandardMaterial({ color: 0x23272e, metalness: 0.3, roughness: 0.55 }));
  carrier.position.z = 0.0;
  const pixTex = canvasTex(256, (g, S) => {
    g.fillStyle = '#1b2150'; g.fillRect(0, 0, S, S);
    for (let y = 0; y < 64; y++) for (let x = 0; x < 64; x++) { g.fillStyle = `rgba(120,150,255,${0.05 + 0.12 * hash(x, y)})`; g.fillRect(x * 4 + 0.5, y * 4 + 0.5, 3, 3); }
  });
  pixTex.repeat.set(6, 4.5);
  const die = new THREE.Mesh(new THREE.BoxGeometry(W, H, 0.05),
    new THREE.MeshPhysicalMaterial({ map: pixTex, color: 0xb8c4ff, metalness: 1, roughness: 0.18, iridescence: 1, iridescenceIOR: 1.9, emissive: 0x2a3a9a, emissiveIntensity: 0.25 }));
  die.position.z = 0.04;
  sensor.add(board, carrier, die);
  const gold = new THREE.MeshStandardMaterial({ color: 0xe6c460, metalness: 1, roughness: 0.22 });
  const tin = new THREE.MeshStandardMaterial({ color: 0xcfd4dc, metalness: 1, roughness: 0.3 });
  const NB = 2 * 26 + 2 * 18, m0 = new THREE.Matrix4(), qz = new THREE.Quaternion(), zAxis = new THREE.Vector3(0, 0, 1), one = new THREE.Vector3(1, 1, 1);
  const padsI = new THREE.InstancedMesh(new THREE.BoxGeometry(0.05, 0.028, 0.012), gold, NB);
  const bonds = new THREE.InstancedMesh(new THREE.TorusGeometry(0.05, 0.004, 5, 14, Math.PI), gold, NB);
  const solder = new THREE.InstancedMesh(new THREE.SphereGeometry(0.03, 10, 8), tin, NB);
  let bi = 0;
  const edge = (n, half, off, ang) => {
    for (let i = 0; i < n; i++) {
      const u = (i - (n - 1) / 2) * (2 * half * 0.92 / n);
      const base = new THREE.Vector3(u, off, 0).applyAxisAngle(zAxis, ang), out = new THREE.Vector3(0, 1, 0).applyAxisAngle(zAxis, ang);
      qz.setFromAxisAngle(zAxis, ang);
      m0.compose(base.clone().addScaledVector(out, 0.1).setZ(0.03), qz, one); padsI.setMatrixAt(bi, m0);
      // bond wire: a half-ring standing up, from the die edge to the pad
      const qb = new THREE.Quaternion().setFromAxisAngle(zAxis, ang + Math.PI / 2).multiply(new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(1, 0, 0), Math.PI / 2));
      m0.compose(base.clone().addScaledVector(out, 0.05).setZ(0.045), qb, one); bonds.setMatrixAt(bi, m0);
      m0.compose(base.clone().addScaledVector(out, 0.23).setZ(-0.012), qz, new THREE.Vector3(1, 1, 0.55)); solder.setMatrixAt(bi, m0);
      bi++;
    }
  };
  edge(26, W / 2, H / 2, 0); edge(26, W / 2, H / 2, Math.PI); edge(18, H / 2, W / 2, Math.PI / 2); edge(18, H / 2, W / 2, -Math.PI / 2);
  sensor.add(padsI, bonds, solder);
  const coilMat = copperMat();
  for (const [sx, sy] of sides) {
    const coil = sx === 0 ? woundCoil(0.74, 0.25, coilMat, { turns: 4, pitch: 0.026, wire: 0.026, layers: 4 }) : woundCoil(0.25, 0.74, coilMat, { turns: 4, pitch: 0.026, wire: 0.026, layers: 4 });
    coil.position.set(sx * (BW / 2 + 0.2), sy * (BH / 2 + 0.2), 0.0);
    const tab = new THREE.Mesh(new THREE.BoxGeometry(sx === 0 ? 0.86 : 0.42, sx === 0 ? 0.42 : 0.86, 0.04), board.material);
    tab.position.set(sx * (BW / 2 + 0.16), sy * (BH / 2 + 0.16), -0.07);
    sensor.add(coil, tab);
  }
  // image trail on the silicon: where the point of light has been during the "exposure"
  const N = 70, trail = new THREE.InstancedMesh(new THREE.SphereGeometry(0.028, 8, 6),
    new THREE.MeshBasicMaterial({ color: COL.gold, transparent: true, opacity: 0.85, blending: THREE.AdditiveBlending, depthWrite: false }), N);
  trail.position.z = 0.08;
  sensor.add(trail);
  scene.add(sensor);

  // flexure springs: serpentine ribbons from the sensor corners to the housing corners
  const armMat = new THREE.MeshStandardMaterial({ color: 0xd9dee6, metalness: 1, roughness: 0.28 });
  const flex = flexureGeo(6, 0.075, 0.012, 0.11);
  const arms = [[1, 1], [1, -1], [-1, 1], [-1, -1]].map(([sx, sy]) => {
    const m = new THREE.Mesh(flex, armMat);
    scene.add(m);
    return { m, sx, sy };
  });

  // the ray: fixed in the world
  const beam = new Beam([new THREE.Vector3(0, 0, 4.6), new THREE.Vector3(0, 0, 0.08)], COL.gold, 0.018);
  beam.setProgress(1);
  scene.add(beam.group);
  const spot = glow(COL.gold, 0.45); spot.position.z = 0.1;
  scene.add(spot);

  const L = {
    shake: label('hand tremor', 0, FH / 2 + 0.55, 0),
    smear: label('the image smears across the sensor', 0, FH / 2 + 0.55, 0, 'bad'),
    sensor: label('image sensor', 0, -H / 2 + 0.2, 0.1),
    coil: label('copper coil', BW / 2 + 0.2, 0.55, 0.2), mag: label('magnet', -FW / 2 + 0.3, -0.75, 0),
    spring: label('flexure spring', -FW / 2 - 0.45, FH / 2 - 0.25, 0.1),
    follow: label('coils push the sensor to follow the image', 0, FH / 2 + 0.6, 0, 'good'),
    rate: label('measure → move → check · thousands of times per second', 0, FH / 2 + 0.6, 0),
    result: label('steady image → longer exposure → more light', 0, FH / 2 + 0.6, 0, 'good'),
  };
  const labels = Object.values(L);
  const v = new THREE.Vector2(), a = new THREE.Vector3(), b = new THREE.Vector3(), m4 = new THREE.Matrix4();

  function update(t, c) {
    for (const l of labels) l.o = 0;
    const k = (tt) => ramp(tt, c.counter + 3.5, c.counter + 6);   // stabilisation on
    const amp = ramp(t, 1.5, 5);
    shake(t, v);
    housing.position.set(v.x * amp, v.y * amp, 0);
    const kk = k(t);
    sensor.position.set(v.x * amp * (1 - kk), v.y * amp * (1 - kk), 0);
    for (const { m, sx, sy } of arms) {
      a.set(sensor.position.x + sx * (BW / 2 - 0.03), sensor.position.y + sy * (BH / 2 - 0.03), 0);
      b.set(housing.position.x + sx * (FW / 2 - 0.12), housing.position.y + sy * (FH / 2 - 0.12), 0);
      span(m, a, b);
      m.scale.x = m.scale.z = 1;
    }
    // trail = spot position relative to the sensor over the last 0.6 s
    for (let i = 0; i < N; i++) {
      const tt = t - i * 0.009;
      shake(tt, v);
      const s = ramp(tt, 1.5, 5) * (1 - k(tt));
      m4.makeTranslation(-v.x * s, -v.y * s, 0);
      trail.setMatrixAt(i, m4);
    }
    trail.instanceMatrix.needsUpdate = true;
    // coil current glow follows how hard they are working
    shake(t, v); const x0 = v.x, y0 = v.y; shake(t + 0.02, v);
    coilMat.emissiveIntensity = kk * Math.min(2.5, Math.hypot(v.x - x0, v.y - y0) * 28);

    const ex = ramp(t, c.float + 9, c.float + 14);   // lift the lens away to reveal the mechanism
    lens.position.z = 1.4 + ex * 2.2;
    setOpacity(lens, 1 - 0.8 * ex);

    L.shake.o = win(t, 3, c.shake + 16, 1);
    L.smear.o = win(t, c.shake + 17, c.float + 2, 1);
    L.sensor.o = win(t, c.float + 14, c.counter, 1);
    L.spring.o = win(t, c.float + 19, c.counter, 1);
    L.coil.o = win(t, c.float + 21, c.counter, 1);
    L.mag.o = win(t, c.float + 23, c.counter, 1);
    L.follow.o = win(t, c.counter + 4, c.rate, 1);
    L.rate.o = win(t, c.rate + 2, c.result, 1);
    L.result.o = win(t, c.result + 4, 1e9, 1);
    // ~33° isometric view rather than straight down the optical axis
    camPath(camera, [
      { t: 0, p: [0, -5.6, 8.4], l: [0, 0.2, 0] },
      { t: c.shake + 14, p: [0, -3.9, 5.7], l: [0, 0.15, 0] },
      { t: c.float + 8, p: [0, -4.1, 6.0], l: [0, 0.15, 0] },
      { t: c.float + 15, p: [3.6, -3.6, 4.8], l: [0, 0.1, 0.2] },
      { t: c.counter, p: [2.6, -4.4, 4.6], l: [0, 0.1, 0.1] },
      { t: c.counter + 6, p: [0.8, -4.1, 6.0], l: [0, 0.15, 0] },
      { t: c.rate + 2, p: [-3.2, -3.5, 5.2], l: [0, 0.1, 0] },
      { t: c.result + 3, p: [0, -4.4, 6.6], l: [0, 0.2, 0] },
      { t: c.result + 30, p: [0, -3.9, 5.8], l: [0, 0.15, 0] },
    ], t);
  }
  return { scene, camera, labels, update, envIntensity: 0.32 };
}
