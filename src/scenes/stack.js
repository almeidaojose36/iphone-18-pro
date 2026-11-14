// Chapter 5: rolling buffer → tap → align → fuse.
import { THREE, COL, baseScene, makeCamera, camPath, ramp, win, lerp, hash, mod, label, edges } from '../util.js';
import { photoCanvas, photoTexture } from '../photo.js';
import { brushedMetal, pcbTexture } from '../util.js';

const K = 9, PW = 3.6, PH = 2.4;

export function build() {
  const scene = baseScene(), camera = makeCamera(36);
  const tex = (cv) => { const t = new THREE.CanvasTexture(cv); t.colorSpace = THREE.SRGBColorSpace; return t; };
  const pg = new THREE.PlaneGeometry(PW, PH);
  const frames = [];
  for (let j = 0; j < K; j++) {
    const long = j === K - 1;
    const mat = new THREE.MeshBasicMaterial({
      map: tex(photoCanvas(480, 320, long ? { gain: 1.0, noise: 0.07, seed: j } : { gain: 0.42, noise: 0.16, seed: j * 7 + 1 })),
      transparent: true, depthWrite: false, side: THREE.DoubleSide,
    });
    const mesh = new THREE.Mesh(pg, mat);
    const outline = edges(pg, COL.cyan, 0);
    mesh.add(outline);
    mesh.renderOrder = j;
    scene.add(mesh);
    frames.push({ mesh, mat, outline, ox: (hash(j, 1) - 0.5) * 0.5, oy: (hash(j, 2) - 0.5) * 0.36, rot: (hash(j, 3) - 0.5) * 0.12 });
  }
  const finMat = new THREE.MeshBasicMaterial({ map: photoTexture(PW / PH), transparent: true, depthWrite: false });
  const fin = new THREE.Mesh(pg, finMat);
  fin.renderOrder = 20;
  scene.add(fin);

  // the chip doing the work: package substrate, gold pads, brushed lid, glowing die grid
  const chip = new THREE.Group();
  const sub = new THREE.Mesh(new THREE.BoxGeometry(3.0, 0.08, 3.0), new THREE.MeshStandardMaterial({ map: pcbTexture(7), metalness: 0.3, roughness: 0.5 }));
  sub.position.y = -0.1;
  const chipMat = brushedMetal(0x2a2d33, { roughness: 0.35 });
  chipMat.emissive = new THREE.Color(COL.cyan); chipMat.emissiveIntensity = 0;
  const cb = new THREE.BoxGeometry(2.4, 0.14, 2.4);
  chip.add(sub, new THREE.Mesh(cb, chipMat), edges(cb, COL.cyan, 0.5));
  const padGeo = new THREE.BoxGeometry(0.07, 0.03, 0.16), padMat = new THREE.MeshStandardMaterial({ color: 0xe2c15e, metalness: 1, roughness: 0.25 });
  const pads = new THREE.InstancedMesh(padGeo, padMat, 80), pm = new THREE.Matrix4(), pq = new THREE.Quaternion(), yAxis = new THREE.Vector3(0, 1, 0);
  for (let s4 = 0; s4 < 4; s4++) for (let k = 0; k < 20; k++) {
    const u = (k - 9.5) * 0.14, a4 = s4 * Math.PI / 2;
    pq.setFromAxisAngle(yAxis, a4);
    pm.compose(new THREE.Vector3(u, -0.05, 1.36).applyAxisAngle(yAxis, a4), pq, new THREE.Vector3(1, 1, 1));
    pads.setMatrixAt(s4 * 20 + k, pm);
  }
  chip.add(pads);
  const grid = new THREE.GridHelper(2.2, 11, COL.cyan, 0x1f6f80);
  grid.position.y = 0.08;
  chip.add(grid);
  chip.position.y = -2.3;
  scene.add(chip);

  const flash = new THREE.Mesh(new THREE.PlaneGeometry(60, 40), new THREE.MeshBasicMaterial({ color: 0xffffff, transparent: true, opacity: 0, depthTest: false }));
  flash.renderOrder = 99;
  scene.add(flash);

  const L = {
    one: label('one exposure: too dark, too noisy, or blurred', 0, PH / 2 + 0.4, 0, 'bad'),
    buf: label('rolling buffer · already shooting before you tap', 0, PH / 2 + 0.5, 0),
    tap: label('tap = “this moment”', 0, PH / 2 + 0.9, 0, 'big'),
    long: label('+ one long exposure for the shadows', 2.6, 0.2, 2.3),
    align: label('align: shift and warp each frame, patch by patch', 0, PH / 2 + 0.9, 0),
    fuse: label('9 frames averaged → about ⅓ the noise', 0, PH / 2 + 0.8, 0, 'good'),
    chip: label('neural engine picks, pixel by pixel', 0, -2.75, 1.3),
    fin: label('many measurements, the best of each', 0, PH / 2 + 0.35, 0, 'good'),
  };
  const labels = Object.values(L);

  function update(t, c) {
    for (const l of labels) l.o = 0;
    const conv = ramp(t, c.buffer + 0.5, c.buffer + 3);            // into the conveyor
    const G = ramp(t, c.tap + 1.2, c.tap + 4);                     // into the stack
    const Fz = ramp(t, c.fuse + 1, c.fuse + 9);                    // compress
    const out = ramp(t, c.fuse + 9, c.fuse + 14);                  // fused result takes over
    const sp = lerp(0.5, 0.012, Fz);
    for (let j = 0; j < K; j++) {
      const f = frames[j];
      const s = mod(t * 0.11 + j / K, 1), cx = lerp(6.5, -6.5, s);
      const A = ramp(t, c.align + 9 + j * 0.8, c.align + 9.7 + j * 0.8);
      // conveyor pose
      let x = cx * conv, y = 0, z = -Math.abs(cx) * 0.35 * conv, ry = cx * 0.1 * conv, rz = 0;
      let op = j === 0 ? lerp(1, Math.sin(Math.PI * s), conv) : conv * Math.sin(Math.PI * s);
      // stack pose
      x = lerp(x, f.ox * (1 - A), G); y = lerp(y, f.oy * (1 - A), G);
      z = lerp(z, (j - (K - 1) / 2) * sp, G); ry = lerp(ry, 0, G); rz = f.rot * (1 - A) * G;
      op = lerp(op, 0.78, G) * (1 - out);
      f.mesh.position.set(x, y, z); f.mesh.rotation.set(0, ry, rz);
      f.mat.opacity = op; f.mesh.visible = op > 0.01;
      f.outline.material.opacity = Math.max(win(t, c.align + 9 + j * 0.8, c.align + 11 + j * 0.8, 0.3), 0.25 * G) * (1 - out);
    }
    fin.position.z = 0.1; finMat.opacity = ramp(t, c.fuse + 7, c.fuse + 13); fin.visible = finMat.opacity > 0.01;
    const dtap = t - (c.tap + 1.1);
    flash.material.opacity = dtap > 0 ? 0.85 * Math.exp(-dtap * 5) : 0;
    flash.position.copy(camera.position).multiplyScalar(0.5); flash.quaternion.copy(camera.quaternion);
    const work = win(t, c.align + 8, c.fuse + 14, 2);
    chip.visible = t > c.tap + 2 && t < c.final + 2;
    chipMat.emissiveIntensity = work * (0.07 + 0.05 * Math.sin(t * 9));

    L.one.o = win(t, c.problem + 2, c.buffer, 0.8);
    L.buf.o = win(t, c.buffer + 4, c.tap, 0.8);
    L.tap.o = win(t, c.tap + 3, c.tap + 9, 0.6);
    L.long.o = win(t, c.tap + 10, c.align, 0.8);
    L.align.o = win(t, c.align + 8, c.fuse, 0.8);
    L.fuse.o = win(t, c.fuse + 9, c.final, 0.8);
    L.chip.o = win(t, c.fuse + 14, c.final, 0.8);
    L.fin.o = win(t, c.final + 5, 1e9, 0.8);
    camPath(camera, [
      { t: 0, p: [0, 0, 6.2], l: [0, 0, 0] },
      { t: c.buffer, p: [0, 0, 6.6], l: [0, 0, 0] },
      { t: c.buffer + 4, p: [0, 1.2, 9.5], l: [0, 0, -0.6] },
      { t: c.tap + 1, p: [0, 1.2, 9.5], l: [0, 0, -0.6] },
      { t: c.tap + 5, p: [6.2, 2.4, 7.4], l: [0, -0.3, 0] },
      { t: c.align + 8, p: [5.2, 1.6, 7.8], l: [0, -0.2, 0] },
      { t: c.fuse, p: [1.5, 0.8, 9.2], l: [0, -0.3, 0] },
      { t: c.fuse + 9, p: [4.5, 1.2, 8], l: [0, -0.4, 0] },
      { t: c.final + 3, p: [0, 0, 6.4], l: [0, 0, 0] },
      { t: c.final + 30, p: [0, 0, 5.4], l: [0, 0, 0] },
    ], t);
  }
  return { scene, camera, labels, update };
}
