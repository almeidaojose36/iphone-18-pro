// Hook: a DSLR telephoto barrel next to a < 9 mm phone, then a single ray enters the lens.
// Units: 1 = 100 mm.
import { THREE, COL, baseScene, makeCamera, camPath, ramp, win, lerp, glow, Beam, label, roundedSlab, roundedPlane, setOpacity,
  physGlass, lensGeo, latheRing, ribbedRing, brushedMetal } from '../util.js';
import { photoTexture } from '../photo.js';

export function build() {
  const scene = baseScene(), camera = makeCamera(38);

  // --- DSLR telephoto lens, cut away so the glass is visible. Built along +Y (front), then laid on its side. ---
  const lens = new THREE.Group();
  lens.position.set(-1.7, 0, 0);
  const tube = new THREE.Group();
  tube.rotation.z = -Math.PI / 2;
  lens.add(tube);
  const P0 = 0.6, PL = Math.PI * 1.28;                       // kept arc; the gap faces the camera
  const DS = THREE.DoubleSide;
  const anod = brushedMetal(0x24272d, { roughness: 0.5, side: DS, bump: 0.4 });
  const chrome = new THREE.MeshStandardMaterial({ color: 0xd4d8de, metalness: 1, roughness: 0.14, side: DS });
  const rubber = new THREE.MeshStandardMaterial({ color: 0x0c0d10, metalness: 0, roughness: 0.88, side: DS });
  const inner = new THREE.MeshStandardMaterial({ color: 0x08090b, metalness: 0.2, roughness: 0.9, side: DS });
  const shell = (r0, r1, y0, y1, mat, wall = 0.022) => {
    const m = new THREE.Mesh(latheRing([[r0, y0], [r1, y1], [r1 - wall, y1], [r0 - wall, y0]], 96, P0, PL), mat);
    tube.add(m); return m;
  };
  // mount: bayonet + flange (bright metal), then the barrel sections
  shell(0.25, 0.25, -1.4, -1.33, chrome, 0.03);
  shell(0.31, 0.31, -1.33, -1.28, chrome, 0.06);
  shell(0.33, 0.33, -1.28, -0.86, anod);
  shell(0.345, 0.345, -0.86, -0.8, chrome, 0.03);
  shell(0.385, 0.385, -0.8, -0.1, inner);
  shell(0.39, 0.39, -0.1, 0.16, anod);
  shell(0.44, 0.44, 0.16, 0.76, inner);
  shell(0.47, 0.5, 0.76, 1.2, anod);
  shell(0.5, 0.56, 1.24, 1.62, inner, 0.012);                 // hood
  // ribbed rubber zoom and focus rings
  const zoomRing = new THREE.Mesh(ribbedRing(0.395, 0.66, 64, 0.016, P0, PL), rubber); zoomRing.position.y = -0.45;
  const focusRing = new THREE.Mesh(ribbedRing(0.45, 0.56, 120, 0.01, P0, PL), rubber); focusRing.position.y = 0.46;
  tube.add(zoomRing, focusRing);
  const red = new THREE.Mesh(new THREE.TorusGeometry(0.503, 0.011, 8, 96, PL), new THREE.MeshBasicMaterial({ color: 0xff3b30 }));
  red.rotation.set(Math.PI / 2, 0, Math.PI / 2 - P0 - PL); red.position.y = 1.22;
  tube.add(red);
  // glass: [y, semi-diameter, centre thickness, front sag, rear sag]
  const glass = physGlass({ color: 0xdff0ff, transmission: 0.93, thickness: 0.06, iridescence: 0.7, env: 2.4 });
  const retain = new THREE.MeshStandardMaterial({ color: 0x15171b, metalness: 0.6, roughness: 0.5 });
  [[1.12, 0.455, 0.11, 0.085, -0.03], [0.93, 0.44, 0.05, 0.015, 0.05], [0.56, 0.4, 0.13, 0.055, 0.055], [0.22, 0.345, 0.035, -0.045, -0.04],
    [-0.08, 0.33, 0.07, 0.05, -0.022], [-0.42, 0.33, 0.1, 0.045, 0.04], [-0.72, 0.29, 0.09, 0.05, 0.02], [-0.79, 0.29, 0.03, -0.02, -0.035],
    [-1.08, 0.27, 0.06, -0.02, 0.045]].forEach(([y, r, tc, s1, s2]) => {
    const e = new THREE.Mesh(lensGeo(r, tc, s1, s2), glass); e.position.y = y;
    const ring = new THREE.Mesh(new THREE.TorusGeometry(r * 1.05, 0.012, 8, 72), retain); ring.rotation.x = Math.PI / 2; ring.position.y = y;
    tube.add(e, ring);
  });
  // iris diaphragm
  const iris = new THREE.Mesh(new THREE.RingGeometry(0.15, 0.33, 9, 1), new THREE.MeshStandardMaterial({ color: 0x1b1d22, metalness: 0.8, roughness: 0.35, side: DS }));
  iris.rotation.x = Math.PI / 2; iris.position.y = -0.25;
  tube.add(iris);
  scene.add(lens);

  // --- phone: brushed titanium frame, glass back, camera plateau, three deep lenses ---
  const phone = new THREE.Group();
  phone.position.set(1.5, 0, 0);
  const T = 0.0875, zb = T / 2;
  const titanium = brushedMetal(0x8e8f93, { roughness: 0.55, env: 0.7 });
  scene.userData.lights.key.intensity = 1.5; scene.userData.lights.fillL.intensity = 0.4;
  phone.add(new THREE.Mesh(roundedSlab(0.72, 1.5, T, 0.1), titanium));
  const backGlass = new THREE.Mesh(roundedSlab(0.685, 1.465, 0.004, 0.088),
    new THREE.MeshPhysicalMaterial({ color: 0x6d7076, metalness: 0.35, roughness: 0.5, clearcoat: 0.5, clearcoatRoughness: 0.35 }));
  backGlass.position.z = zb + 0.0105;
  phone.add(backGlass);
  const plateau = new THREE.Mesh(roundedSlab(0.66, 0.4, 0.03, 0.085), brushedMetal(0x97989c, { roughness: 0.55, env: 0.7 }));
  plateau.position.set(0, 0.5, zb + 0.02);
  phone.add(plateau);
  const zp = zb + 0.0385;                                     // top of the plateau
  const steel = new THREE.MeshStandardMaterial({ color: 0xaeb1b7, metalness: 1, roughness: 0.3, envMapIntensity: 0.5 });
  const black = new THREE.MeshStandardMaterial({ color: 0x101216, metalness: 0.5, roughness: 0.45, side: DS });
  const coated = physGlass({ color: 0xcfd8ff, transmission: 0.85, thickness: 0.01, iridescence: 1, env: 0.9, emissive: 0x2a3466, emissiveIntensity: 0.35 });
  const sapphire = physGlass({ transmission: 1, thickness: 0.004, iridescence: 0.2, env: 0.25, roughness: 0.05 });
  const sensorMat = new THREE.MeshPhysicalMaterial({ color: 0x1a2260, metalness: 1, roughness: 0.2, iridescence: 1, iridescenceIOR: 1.8, emissive: 0x0b2a66, emissiveIntensity: 0.5 });
  const ringGeo = latheRing([[0.068, -0.004], [0.096, -0.004], [0.096, 0.034], [0.088, 0.046], [0.075, 0.046], [0.068, 0.04]], 72);
  const lensPos = [[-0.2, 0.6], [-0.2, 0.4], [-0.03, 0.5]];
  for (const [x, y] of lensPos) {
    const g = new THREE.Group();
    g.position.set(x, y, zp); g.rotation.x = Math.PI / 2;      // local +Y = out of the back of the phone
    const well = new THREE.Mesh(new THREE.CylinderGeometry(0.069, 0.069, 0.044, 48, 1, true), black); well.position.y = 0.022;
    const floor = new THREE.Mesh(new THREE.CircleGeometry(0.069, 48), black); floor.rotation.x = -Math.PI / 2; floor.position.y = 0.0008;
    const chip = new THREE.Mesh(new THREE.CircleGeometry(0.024, 32), sensorMat); chip.rotation.x = -Math.PI / 2; chip.position.y = 0.0016;
    const cover = new THREE.Mesh(new THREE.CylinderGeometry(0.072, 0.072, 0.003, 48), sapphire); cover.position.y = 0.041;
    g.add(new THREE.Mesh(ringGeo, steel), well, floor, chip, cover);
    // three coated elements stepping down towards the sensor, each in a black baffle
    [[0.033, 0.058, 0.01, 0.008, -0.002], [0.022, 0.046, 0.008, 0.005, 0.004], [0.011, 0.034, 0.007, -0.003, 0.005]].forEach(([yy, r, tc, s1, s2]) => {
      const e = new THREE.Mesh(lensGeo(r, tc, s1, s2, 40), coated); e.position.y = yy;
      const baffle = new THREE.Mesh(new THREE.RingGeometry(r, 0.07, 48), black); baffle.rotation.x = -Math.PI / 2; baffle.position.y = yy - 0.003;
      g.add(e, baffle);
    });
    phone.add(g);
  }
  // flash, LiDAR window, microphone
  const dot = (x, y, r, mat) => { const m = new THREE.Mesh(new THREE.CylinderGeometry(r, r, 0.004, 32), mat); m.rotation.x = Math.PI / 2; m.position.set(x, y, zp); phone.add(m); };
  dot(0.2, 0.6, 0.032, new THREE.MeshPhysicalMaterial({ color: 0xfff1c9, roughness: 0.35, clearcoat: 1, emissive: 0xffe2a0, emissiveIntensity: 0.12 }));
  dot(0.2, 0.42, 0.028, new THREE.MeshPhysicalMaterial({ color: 0x08090c, roughness: 0.1, clearcoat: 1 }));
  dot(0.2, 0.51, 0.007, black);
  // side buttons
  for (const [x, y, h] of [[0.362, 0.33, 0.07], [0.362, 0.18, 0.11], [0.362, 0.04, 0.11], [-0.362, 0.2, 0.17], [-0.362, -0.25, 0.13]]) {
    const b = new THREE.Mesh(roundedSlab(0.012, h, 0.03, 0.005), titanium); b.position.set(x, y, 0); phone.add(b);
  }
  // front: black bezel, the finished photograph on screen, dynamic island
  const bezel = new THREE.Mesh(roundedPlane(0.7, 1.48, 0.092), new THREE.MeshPhysicalMaterial({ color: 0x020203, roughness: 0.08, clearcoat: 1 }));
  bezel.rotation.y = Math.PI; bezel.position.z = -zb - 0.0108;
  const screen = new THREE.Mesh(roundedPlane(0.672, 1.452, 0.08), new THREE.MeshBasicMaterial({ map: photoTexture(0.672 / 1.452, [0.3, 0.5]) }));
  screen.rotation.y = Math.PI; screen.position.z = -zb - 0.0114;
  const island = new THREE.Mesh(roundedPlane(0.17, 0.05, 0.024), new THREE.MeshBasicMaterial({ color: 0x000000 }));
  island.rotation.y = Math.PI; island.position.set(0, 0.655, -zb - 0.012);
  phone.add(bezel, screen, island);
  scene.add(phone);

  // thickness / length dimension bars
  const dimMat = new THREE.MeshBasicMaterial({ color: COL.cyan });
  const lensDim = new THREE.Mesh(new THREE.BoxGeometry(2.6, 0.008, 0.008), dimMat);
  lensDim.position.set(-1.7, -0.68, 0);
  scene.add(lensDim);

  // --- incoming ray ---
  const tele = new THREE.Vector3(1.5 - 0.2, 0.6, zp + 0.012);
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

  return { scene, camera, labels, update, outro, envIntensity: 0.4 };
}
