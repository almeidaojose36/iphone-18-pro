// Chapter 4: raw mosaic → demosaic → white balance → denoise → tone.
import { THREE, baseScene, makeCamera, camPath, ramp, win, lerp, clamp01, hash, label } from '../util.js';
import { scenePixel } from '../photo.js';

const GW = 42, GH = 28, S = 0.18;
const bayer = (x, y) => (x % 2 === 0 && y % 2 === 0 ? 0 : x % 2 === 1 && y % 2 === 1 ? 2 : 1);
const CAST = [1.35, 1.0, 0.55], CHZ = [1.5, 0, -1.5];

export function build() {
  const scene = baseScene(), camera = makeCamera(36);
  const n = GW * GH;
  const geo = new THREE.BoxGeometry(S, S, S * 0.25);
  const mk = () => { const m = new THREE.InstancedMesh(geo, new THREE.MeshBasicMaterial(), n); m.frustumCulled = false; scene.add(m); return m; };
  const raw = mk(), fill = [mk(), mk(), mk()], fin = mk();
  const base = new Float32Array(n * 3), noise = new Float32Array(n * 3);
  for (let y = 0; y < GH; y++) for (let x = 0; x < GW; x++) {
    const i = y * GW + x, p = scenePixel((x + 0.5) / GW, (y + 0.5) / GH);
    for (let k = 0; k < 3; k++) { base[i * 3 + k] = p[k]; noise[i * 3 + k] = hash(i, k + 40) - 0.5; }
  }
  const m4 = new THREE.Matrix4(), q = new THREE.Quaternion(), ps = new THREE.Vector3(), sc = new THREE.Vector3(), col = new THREE.Color();
  const enc = (v) => Math.pow(clamp01(v), 1 / 2.2);
  const setCol = (mesh, i, r, g, b) => mesh.setColorAt(i, col.setRGB(enc(r), enc(g), enc(b), THREE.SRGBColorSpace));

  const stages = ['RAW', 'DEMOSAIC', 'WHITE BALANCE', 'DENOISE', 'TONE'];
  const SL = stages.map((s, i) => label(s, (i - 2) * 1.9, GH * S / 2 + 0.92, 0, 'stage'));
  const L = {
    raw: label('what the sensor actually delivers', 0, GH * S / 2 + 0.42, 0),
    one: label('each pixel measured only one colour', 0, GH * S / 2 + 0.42, 0),
    holes: label('⅔ of the colour data is missing', 0, GH * S / 2 + 0.42, 1.5),
    guess: label('estimate the gaps from neighbours, without crossing edges', 0, GH * S / 2 + 0.42, 1.5),
    wb: label('scale R, G, B until neutral looks neutral', 0, GH * S / 2 + 0.42, 0),
    dn: label('separate detail from random speckle', 0, GH * S / 2 + 0.42, 0),
    done: label('30–60 times a second, just for the viewfinder', 0, GH * S / 2 + 0.42, 0),
  };
  const labels = [...SL, ...Object.values(L)];

  function update(t, c) {
    for (const l of labels) l.o = 0;
    const tint = ramp(t, c.mosaic + 11, c.mosaic + 14);
    const merge = ramp(t, c.wb - 5, c.wb - 1.5);
    const split = ramp(t, c.demosaic + 1, c.demosaic + 5) * (1 - merge);
    const W = ramp(t, c.wb + 14, c.wb + 21), Dn = ramp(t, c.denoise + 5, c.denoise + 12), Tn = ramp(t, c.done - 6, c.done + 1);
    const fillSpan = (c.wb - 6 - (c.fill + 2));
    const showFinal = merge > 0.98;
    raw.visible = !showFinal; fin.visible = showFinal;
    for (const f of fill) f.visible = !showFinal && t > c.fill;
    const gain = lerp(1.0, 1.7, Tn), gap = lerp(0.86, 1.0, Tn), nz = 0.2 * (1 - Dn);

    for (let y = 0; y < GH; y++) for (let x = 0; x < GW; x++) {
      const i = y * GW + x, ch = bayer(x, y);
      const px = (x - GW / 2 + 0.5) * S, py = (GH / 2 - y - 0.5) * S;
      const appear = ramp(t, c.raw + 1 + (x + y) * 0.03, c.raw + 1.6 + (x + y) * 0.03);
      if (!showFinal) {
        // measured sample: dim, noisy, single channel
        const v = base[i * 3 + ch] * CAST[ch] * 1.25 + noise[i * 3 + ch] * 0.2;
        const gr = clamp01(v) * 0.75;
        m4.compose(ps.set(px, py, CHZ[ch] * split), q, sc.set(0.86 * appear, 0.86 * appear, 1));
        raw.setMatrixAt(i, m4);
        setCol(raw, i, lerp(gr, ch === 0 ? v : 0.01, tint), lerp(gr, ch === 1 ? v : 0.01, tint), lerp(gr, ch === 2 ? v : 0.01, tint));
        // interpolated samples for the two channels this pixel did not measure
        for (let k = 0; k < 3; k++) {
          const on = k === ch ? 0 : ramp(t, c.fill + 2 + (x / GW) * fillSpan, c.fill + 2.8 + (x / GW) * fillSpan);
          m4.compose(ps.set(px, py, CHZ[k] * split), q, sc.set(0.86 * on, 0.86 * on, 1));
          fill[k].setMatrixAt(i, m4);
          const vk = base[i * 3 + k] * CAST[k] * 1.25 + noise[i * 3 + k] * 0.2;
          setCol(fill[k], i, k === 0 ? vk : 0.01, k === 1 ? vk : 0.01, k === 2 ? vk : 0.01);
        }
      } else {
        m4.compose(ps.set(px, py, 0), q, sc.set(gap, gap, 1));
        fin.setMatrixAt(i, m4);
        const o = i * 3;
        setCol(fin, i,
          base[o] * gain * lerp(CAST[0], 1, W) + noise[o] * nz,
          base[o + 1] * gain * lerp(CAST[1], 1, W) + noise[o + 1] * nz,
          base[o + 2] * gain * lerp(CAST[2], 1, W) + noise[o + 2] * nz);
      }
    }
    for (const m of [raw, fin, ...fill]) if (m.visible) { m.instanceMatrix.needsUpdate = true; m.instanceColor.needsUpdate = true; }

    const stage = t < c.demosaic ? 0 : t < c.wb ? 1 : t < c.denoise ? 2 : t < c.denoise + 16 ? 3 : 4;
    SL.forEach((l, i) => { l.o = ramp(t, c.mosaic + 20, c.mosaic + 22) * (i === stage ? 1 : 0.3); l.cls = 'stage' + (i === stage ? ' on' : ''); });
    L.raw.o = win(t, c.mosaic + 0.5, c.mosaic + 10, 0.8);
    L.one.o = win(t, c.mosaic + 11, c.demosaic, 0.8);
    L.holes.o = win(t, c.demosaic + 5, c.fill + 1, 0.8);
    L.guess.o = win(t, c.fill + 3, c.wb - 5, 0.8);
    L.wb.o = win(t, c.wb + 12, c.denoise, 0.8);
    L.dn.o = win(t, c.denoise + 4, c.done - 6, 0.8);
    L.done.o = win(t, c.done + 4, c.done + 14, 0.8);
    camPath(camera, [
      { t: 0, p: [0, 0, 13], l: [0, 0, 0] },
      { t: c.mosaic + 8, p: [0, 0, 11.5], l: [0, 0, 0] },
      { t: c.mosaic + 14, p: [1.8, 0.6, 6.5], l: [1.2, 0.4, 0] },
      { t: c.demosaic, p: [0.5, 0.3, 11.5], l: [0, 0, 0] },
      { t: c.demosaic + 5, p: [8.5, 4, 9.5], l: [0, 0, 0] },
      { t: c.wb - 6, p: [-7, 3.5, 10.5], l: [0, 0, 0] },
      { t: c.wb, p: [0, 0, 12], l: [0, 0, 0] },
      { t: c.done, p: [0, 0, 11.5], l: [0, 0, 0] },
      { t: c.done + 40, p: [0, 0, 10], l: [0, 0, 0] },
    ], t);
  }
  return { scene, camera, labels, update };
}
