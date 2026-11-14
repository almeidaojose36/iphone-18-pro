// Chapter 2: sensor-shift stabilisation. The housing shakes; coils move the sensor so the image
// stays on the same spot of silicon.
import { THREE, COL, baseScene, makeCamera, camPath, ramp, win, glow, Beam, label, glassMat, span, setOpacity } from '../util.js';

const shake = (t, out) => {
  out.x = 0.1 * (Math.sin(t * 7.3) + 0.6 * Math.sin(t * 13.1 + 1) + 0.3 * Math.sin(t * 23.7 + 2));
  out.y = 0.1 * (Math.cos(t * 6.1) + 0.6 * Math.sin(t * 11.3 + 0.5) + 0.3 * Math.cos(t * 19.9));
  return out;
};

export function build() {
  const scene = baseScene(), camera = makeCamera(36);
  const W = 1.9, H = 1.45, FW = 3.3, FH = 2.7;

  // housing (shakes with the phone)
  const housing = new THREE.Group();
  const hMat = new THREE.MeshStandardMaterial({ color: 0x2a2f38, metalness: 0.8, roughness: 0.35 });
  for (const [x, y, w, h] of [[0, FH / 2, FW + 0.2, 0.2], [0, -FH / 2, FW + 0.2, 0.2], [FW / 2, 0, 0.2, FH], [-FW / 2, 0, 0.2, FH]]) {
    const b = new THREE.Mesh(new THREE.BoxGeometry(w, h, 0.5), hMat);
    b.position.set(x, y, 0);
    housing.add(b);
  }
  const back = new THREE.Mesh(new THREE.BoxGeometry(FW, FH, 0.06), new THREE.MeshStandardMaterial({ color: 0x15181e, metalness: 0.5, roughness: 0.6 }));
  back.position.z = -0.28;
  housing.add(back);
  // magnets on the housing, facing each coil
  const magN = new THREE.MeshStandardMaterial({ color: 0xc23b3b, metalness: 0.6, roughness: 0.4 });
  const magS = new THREE.MeshStandardMaterial({ color: 0x3b5fc2, metalness: 0.6, roughness: 0.4 });
  const sides = [[0, 1], [0, -1], [1, 0], [-1, 0]];
  for (const [sx, sy] of sides) {
    const horiz = sx === 0;
    const px = sx * (FW / 2 - 0.3), py = sy * (FH / 2 - 0.3);
    for (const k of [-1, 1]) {
      const m = new THREE.Mesh(new THREE.BoxGeometry(horiz ? 0.34 : 0.14, horiz ? 0.14 : 0.34, 0.16), k < 0 ? magN : magS);
      m.position.set(px + (horiz ? k * 0.17 : 0), py + (horiz ? 0 : k * 0.17), -0.12);
      housing.add(m);
    }
  }
  const lens = new THREE.Group();
  const lensEl = new THREE.Mesh(new THREE.SphereGeometry(1, 48, 24), glassMat(0.2));
  lensEl.scale.set(1.25, 1.25, 0.16);
  const lensRing = new THREE.Mesh(new THREE.TorusGeometry(1.27, 0.06, 12, 64), hMat);
  lens.add(lensEl, lensRing);
  lens.position.z = 1.4;
  housing.add(lens);
  scene.add(housing);

  // floating sensor
  const sensor = new THREE.Group();
  const board = new THREE.Mesh(new THREE.BoxGeometry(W + 0.5, H + 0.5, 0.05), new THREE.MeshStandardMaterial({ color: 0x143524, metalness: 0.4, roughness: 0.5 }));
  board.position.z = -0.03;
  const die = new THREE.Mesh(new THREE.BoxGeometry(W, H, 0.06),
    new THREE.MeshStandardMaterial({ color: 0x20264a, metalness: 0.95, roughness: 0.12, emissive: 0x2a3a9a, emissiveIntensity: 0.35 }));
  sensor.add(board, die);
  const coilMat = new THREE.MeshStandardMaterial({ color: COL.copper, metalness: 0.9, roughness: 0.3, emissive: 0xff8a30, emissiveIntensity: 0 });
  for (const [sx, sy] of sides) {
    const coil = new THREE.Mesh(new THREE.TorusGeometry(0.13, 0.035, 10, 32), coilMat);
    coil.scale.set(sx === 0 ? 2.2 : 1, sx === 0 ? 1 : 2.2, 1);
    coil.position.set(sx * (W / 2 + 0.12), sy * (H / 2 + 0.12), 0.01);
    sensor.add(coil);
  }
  // image trail on the silicon: where the point of light has been during the "exposure"
  const N = 70, trail = new THREE.InstancedMesh(new THREE.SphereGeometry(0.028, 8, 6),
    new THREE.MeshBasicMaterial({ color: COL.gold, transparent: true, opacity: 0.85, blending: THREE.AdditiveBlending, depthWrite: false }), N);
  trail.position.z = 0.05;
  sensor.add(trail);
  scene.add(sensor);

  // flexure springs: sensor corners → housing corners
  const armMat = new THREE.MeshStandardMaterial({ color: 0xcfd6e2, metalness: 1, roughness: 0.25 });
  const arms = [[1, 1], [1, -1], [-1, 1], [-1, -1]].map(([sx, sy]) => {
    const m = new THREE.Mesh(new THREE.CylinderGeometry(0.018, 0.018, 1, 6), armMat);
    scene.add(m);
    return { m, sx, sy };
  });

  // the ray: fixed in the world
  const beam = new Beam([new THREE.Vector3(0, 0, 4.6), new THREE.Vector3(0, 0, 0.05)], COL.gold, 0.02);
  beam.setProgress(1);
  scene.add(beam.group);
  const spot = glow(COL.gold, 0.45); spot.position.z = 0.08;
  scene.add(spot);

  const L = {
    shake: label('hand tremor', 0, FH / 2 + 0.55, 0),
    smear: label('the image smears across the sensor', 0, FH / 2 + 0.55, 0, 'bad'),
    sensor: label('image sensor', 0, -H / 2 + 0.2, 0.1),
    coil: label('copper coil', W / 2 + 0.25, 0.5, 0.2), mag: label('magnet', -FW / 2 + 0.3, -0.75, 0),
    spring: label('flexure spring', -W / 2 - 0.5, H / 2 + 0.55, 0),
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
      a.set(sensor.position.x + sx * (W / 2 + 0.25), sensor.position.y + sy * (H / 2 + 0.25), 0);
      b.set(housing.position.x + sx * (FW / 2 - 0.1), housing.position.y + sy * (FH / 2 - 0.1), 0);
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
    setOpacity(lens, 1 - 0.75 * ex);

    L.shake.o = win(t, 3, c.shake + 16, 1);
    L.smear.o = win(t, c.shake + 17, c.float + 2, 1);
    L.sensor.o = win(t, c.float + 14, c.counter, 1);
    L.spring.o = win(t, c.float + 19, c.counter, 1);
    L.coil.o = win(t, c.float + 21, c.counter, 1);
    L.mag.o = win(t, c.float + 23, c.counter, 1);
    L.follow.o = win(t, c.counter + 4, c.rate, 1);
    L.rate.o = win(t, c.rate + 2, c.result, 1);
    L.result.o = win(t, c.result + 4, 1e9, 1);
    camPath(camera, [
      { t: 0, p: [0, 0.2, 9.5], l: [0, 0, 0] },
      { t: c.shake + 14, p: [0, 0, 6.2], l: [0, 0, 0] },
      { t: c.float + 8, p: [0, 0, 6.6], l: [0, 0, 0] },
      { t: c.float + 15, p: [4.6, 2.6, 6.2], l: [0, 0, 0.3] },
      { t: c.counter, p: [3.6, -1.6, 6.4], l: [0, 0, 0.2] },
      { t: c.counter + 6, p: [1.2, 0.4, 7.0], l: [0, 0, 0] },
      { t: c.rate + 2, p: [-3.2, 2.0, 6.4], l: [0, 0, 0] },
      { t: c.result + 3, p: [0, 0, 7.8], l: [0, 0, 0] },
      { t: c.result + 30, p: [0, 0, 6.6], l: [0, 0, 0] },
    ], t);
  }
  return { scene, camera, labels, update };
}
