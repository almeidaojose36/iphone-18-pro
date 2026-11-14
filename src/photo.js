// The night-street photograph used by the ISP, stacking and outro scenes.
// assets/night-street.jpg: "Backplate – Vignaioli Night", Greg Zaal and Rico Cilliers via Poly Haven, CC0.
import { THREE, hash, clamp01 } from './util.js';

const img = new Image();
img.src = new URL('../assets/night-street.jpg', import.meta.url).href;
await img.decode();
export const PHOTO_ASPECT = img.naturalWidth / img.naturalHeight;

/** Source rectangle (px) that covers a w:h frame, centred on (cu, cv) in 0-1 photo coordinates. */
function cover(aspect, cu = 0.5, cv = 0.5) {
  const W = img.naturalWidth, H = img.naturalHeight;
  let sw = W, sh = W / aspect;
  if (sh > H) { sh = H; sw = H * aspect; }
  const sx = Math.min(W - sw, Math.max(0, cu * W - sw / 2)), sy = Math.min(H - sh, Math.max(0, cv * H - sh / 2));
  return [sx, sy, sw, sh];
}

function draw(w, h, centre) {
  const c = document.createElement('canvas');
  c.width = w; c.height = h;
  const ctx = c.getContext('2d', { willReadFrequently: true });
  ctx.imageSmoothingQuality = 'high';
  ctx.drawImage(img, ...cover(w / h, ...(centre || [])), 0, 0, w, h);
  return c;
}

const lin = new Float32Array(256);
for (let i = 0; i < 256; i++) lin[i] = Math.pow(i / 255, 2.2);

/** Linear-light RGB of the photo resampled to w × h (Float32Array, 3 per pixel). */
export function photoLinear(w, h) {
  const d = draw(w, h).getContext('2d').getImageData(0, 0, w, h).data, out = new Float32Array(w * h * 3);
  for (let i = 0; i < w * h; i++) { out[i * 3] = lin[d[i * 4]]; out[i * 3 + 1] = lin[d[i * 4 + 1]]; out[i * 3 + 2] = lin[d[i * 4 + 2]]; }
  return out;
}

const toSRGB = (x) => 255 * Math.pow(clamp01(x), 1 / 2.2);

/** A degraded version of the photo. opts: gain (exposure), noise (0-1, linear), seed, cast [r,g,b], mono */
export function photoCanvas(w, h, opts = {}) {
  const { gain = 1, noise = 0, seed = 1, cast = [1, 1, 1], mono = false } = opts;
  const c = draw(w, h), ctx = c.getContext('2d'), id = ctx.getImageData(0, 0, w, h), d = id.data;
  for (let i = 0; i < w * h; i++) {
    let r = lin[d[i * 4]] * gain * cast[0] + noise * (hash(i, seed) - 0.5);
    let g = lin[d[i * 4 + 1]] * gain * cast[1] + noise * (hash(i, seed + 11) - 0.5);
    let b = lin[d[i * 4 + 2]] * gain * cast[2] + noise * (hash(i, seed + 23) - 0.5);
    if (mono) r = g = b = (r + g + b) / 3;
    d[i * 4] = toSRGB(r); d[i * 4 + 1] = toSRGB(g); d[i * 4 + 2] = toSRGB(b);
  }
  ctx.putImageData(id, 0, 0);
  return c;
}

/** The photograph at full resolution as a texture, cropped to `aspect` around `centre` [u, v]. */
export function photoTexture(aspect = PHOTO_ASPECT, centre) {
  const [, , sw, sh] = cover(aspect, ...(centre || []));
  const t = new THREE.CanvasTexture(draw(Math.round(sw), Math.round(sh), centre));
  t.colorSpace = THREE.SRGBColorSpace; t.anisotropy = 8;
  return t;
}
