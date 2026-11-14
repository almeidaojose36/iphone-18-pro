// Hook: a DSLR telephoto barrel next to a < 9 mm phone, then a single ray enters the lens.
// Units: 1 = 100 mm.
import { THREE, COL, baseScene, makeCamera, camPath, ramp, win, lerp, glow, Beam, label, glassMat, roundedSlab, setOpacity } from '../util.js';
import { photoCanvas } from '../photo.js';

export function build() {
  const scene = baseScene(), camera = makeCamera(38);

  // --- DSLR telephoto lens (cut-away barrel so the glass is visible) ---
  const lens = new THREE.Group();
  lens.position.set(-1.7, 0, 0);
  const metal = new THREE.MeshStandardMaterial({ color: 0x3a404c, metalness: 0.5, roughness: 0.4, side: THREE.DoubleSide });
  const ring = new THREE.MeshStandardMaterial({ color: 0x1c1f26, metalness: 0.3, roughness: 0.8, side: THREE.DoubleSide });
  const parts = [ // [x centre, length, radius, material]
    [-1.05, 0.5, 0.33, metal], [-0.3, 1.0, 0.41, ring], [0.75, 1.1, 0.5, metal],
  ];
  for (const [x, len, r, m] of parts) {
    const g = new THREE.CylinderGeometry(r, r, len, 64, 1, true, Math.PI * 0.75, Math.PI * 1.35);
    const mesh = new THREE.Mesh(g, m);
    mesh.rotation.z = Math.PI / 2;
    mesh.position.x = x;
    lens.add(mesh);
  }
  const red = new THREE.Mesh(new THREE.TorusGeometry(0.505, 0.012, 8, 64), new THREE.MeshBasicMaterial({ color: 0xff3b30 }));
  red.rotation.y = Math.PI / 2; red.position.x = 1.2;
  lens.add(red);
  const glass = glassMat(0.3);
  [[-1.1, 0.28, 0.05], [-0.7, 0.3, 0.07], [-0.35, 0.36, 0.05], [0.05, 0.38, 0.09], [0.5, 0.44, 0.06], [0.9, 0.46, 0.1], [1.2, 0.47, 0.07]]
    .forEach(([x, r, th]) => {
      const e = new THREE.Mesh(new THREE.SphereGeometry(1, 40, 20), glass);
      e.scale.set(th, r, r); e.position.x = x;
      lens.add(e);
    });
  scene.add(lens);

  // --- phone ---
  const phone = new THREE.Group();
  phone.position.set(1.5, 0, 0);
  const T = 0.0875;
  const body = new THREE.Mesh(roundedSlab(0.72, 1.5, T, 0.09),
    new THREE.MeshStandardMaterial({ color: 0x4a505c, metalness: 0.5, roughness: 0.35 }));
  phone.add(body);
  const plateau = new THREE.Mesh(roundedSlab(0.66, 0.4, 0.035, 0.08),
    new THREE.MeshStandardMaterial({ color: 0x5a616e, metalness: 0.5, roughness: 0.35 }));
  plateau.position.set(0, 0.5, T / 2 + 0.02);
  phone.add(plateau);
  const lensPos = [[-0.2, 0.6], [-0.2, 0.4], [-0.03, 0.5]];
  for (const [x, y] of lensPos) {
    const rim = new THREE.Mesh(new THREE.CylinderGeometry(0.085, 0.085, 0.03, 40),
      new THREE.MeshStandardMaterial({ color: 0x8a92a0, metalness: 0.5, roughness: 0.25 }));
    rim.rotation.x = Math.PI / 2; rim.position.set(x, y, T / 2 + 0.05);
    const gl = new THREE.Mesh(new THREE.CircleGeometry(0.066, 40),
      new THREE.MeshStandardMaterial({ color: 0x05070c, metalness: 1, roughness: 0.05, emissive: 0x0b2a44, emissiveIntensity: 0.8 }));
    gl.position.set(x, y, T / 2 + 0.066);
    phone.add(rim, gl);
  }
  const screenTex = new THREE.CanvasTexture(photoCanvas(240, 500, { gain: 1.7 }));
  screenTex.colorSpace = THREE.SRGBColorSpace;
  const screen = new THREE.Mesh(new THREE.PlaneGeometry(0.67, 1.45), new THREE.MeshBasicMaterial({ map: screenTex }));
  screen.rotation.y = Math.PI; screen.position.z = -T / 2 - 0.012;
  phone.add(screen);
  scene.add(phone);

  // thickness / length dimension bars
  const dimMat = new THREE.MeshBasicMaterial({ color: COL.cyan });
  const lensDim = new THREE.Mesh(new THREE.BoxGeometry(2.6, 0.008, 0.008), dimMat);
  lensDim.position.set(-1.7, -0.68, 0);
  scene.add(lensDim);

  // --- incoming ray ---
  const tele = new THREE.Vector3(1.5 - 0.2, 0.6, T / 2 + 0.07);
  const lampPos = new THREE.Vector3(-5, 5, 26);
  const beam = new Beam([lampPos, tele], COL.gold, 0.006);
  scene.add(beam.group);
  const lamp = glow(COL.gold, 7); lamp.position.copy(lampPos);
  scene.add(lamp);

  const L = {
    lens: label('professional telephoto · ≈ 260 mm of barrel', -1.7, 0.78, 0),
    thin: label('under 9 mm thick', 1.5, 0.98, 0),
    q1: label('zoom?', 0.2, 0.75, 0, 'big'), q2: label('steady?', 0.2, 0.45, 0, 'big'), q3: label('night?', 0.2, 0.15, 0, 'big'),
    ray: label('one ray of light', 0.9, 1.0, 1.2),
    end: label('What should we tear down next?', 0, 1.15, 0, 'big'),
  };
  const labels = Object.values(L);

  function update(t, c) {
    for (const l of labels) l.o = 0;
    lens.visible = true; lensDim.visible = true;
    setOpacity(phone, ramp(t, c.phone - 0.3, c.phone + 0.8));
    // edge-on at first (shows the thickness), then turns its back to camera
    phone.rotation.y = lerp(Math.PI / 2, 0.35, ramp(t, c.phone + 2.2, c.impossible)) * (1 - ramp(t, c.ray, c.ray + 4));
    phone.position.set(1.5, 0, 0);
    const pr = ramp(t, c.ray + 3, c.ray + 10);
    beam.setProgress(pr);
    lamp.visible = t > c.ray;
    L.lens.o = win(t, 1.5, c.impossible + 2.4, 0.8);
    L.thin.o = win(t, c.phone + 1.2, c.ray + 2, 0.8);
    L.q1.o = win(t, c.impossible + 2.6, c.ray, 0.5);
    L.q2.o = win(t, c.impossible + 4.2, c.ray, 0.5);
    L.q3.o = win(t, c.impossible + 6.2, c.ray, 0.5);
    L.ray.o = win(t, c.ray + 4, c.ray + 12, 1);
    camPath(camera, [
      { t: 0, p: [-2.6, 0.7, 3.4], l: [-1.7, 0, 0] },
      { t: c.phone - 0.5, p: [-1.2, 0.5, 4.0], l: [-1.6, 0, 0] },
      { t: c.phone + 1.5, p: [1.5, 0.15, 2.9], l: [1.5, 0, 0] },
      { t: c.impossible, p: [1.2, 0.2, 3.2], l: [1.5, 0, 0] },
      { t: c.impossible + 2.5, p: [0, 0.5, 6.6], l: [-0.1, 0, 0] },
      { t: c.ray + 1, p: [-0.3, 0.6, 6.8], l: [-0.1, 0, 0] },
      { t: c.ray + 7, p: [0.7, 0.9, 3.6], l: [1.3, 0.55, 0] },
      { t: c.ray + 24, p: [1.3, 0.62, 0.85], l: [1.3, 0.6, 0] },
    ], t);
  }

  /** Outro: u 0→1, the phone turns from its camera side to the finished photo on screen. */
  function outro(u, ask) {
    for (const l of labels) l.o = 0;
    lens.visible = false; lensDim.visible = false; lamp.visible = false;
    beam.setProgress(0);
    setOpacity(phone, 1);
    phone.position.set(0, 0, 0);
    phone.rotation.y = lerp(0, Math.PI + 0.25, ramp(u, 0.12, 0.6)) + 0.12 * Math.sin(u * 5);
    camPath(camera, [
      { t: 0, p: [-0.2, 0.6, 0.35], l: [-0.2, 0.6, 0] },
      { t: 0.25, p: [0.3, 0.3, 2.2], l: [0, 0.1, 0] },
      { t: 1, p: [0, 0.1, 3.4], l: [0, 0.1, 0] },
    ], u);
    L.end.o = ask;
  }

  return { scene, camera, labels, update, outro };
}
