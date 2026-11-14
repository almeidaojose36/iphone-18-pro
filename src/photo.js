// A procedural night-street "photo" used by the ISP, stacking and outro scenes.
import { hash, clamp01 } from './util.js';

const sm = (a, b, x) => { const t = clamp01((x - a) / (b - a)); return t * t * (3 - 2 * t); };

/** Linear-light RGB of the ideal scene at (u, v), u,v in 0-1, v = 0 at the top. */
export function scenePixel(u, v) {
  // sky
  let r = 0.02 + 0.05 * v, g = 0.03 + 0.08 * v, b = 0.09 + 0.16 * v;
  // moon
  const md = Math.hypot((u - 0.82) * 1.5, v - 0.16);
  const moon = sm(0.05, 0.035, md) + 0.25 * sm(0.22, 0.0, md);
  r += moon * 0.8; g += moon * 0.85; b += moon * 0.9;
  // skyline
  const col = Math.floor(u * 9), bh = 0.28 + 0.3 * hash(col, 3);
  const horizon = 0.72;
  if (v > horizon - bh && v < horizon) {
    r = 0.035; g = 0.04; b = 0.06;
    const wx = (u * 9 - col) * 5, wy = (v - (horizon - bh)) * 28;
    const cx = wx - Math.floor(wx), cy = wy - Math.floor(wy);
    const lit = hash(Math.floor(wx) + col * 7, Math.floor(wy)) > 0.52;
    if (lit && cx > 0.25 && cx < 0.8 && cy > 0.25 && cy < 0.75 && wx > 0.4 && wx < 4.6) {
      const warm = hash(col, Math.floor(wy)) > 0.4;
      r = warm ? 0.95 : 0.55; g = warm ? 0.7 : 0.75; b = warm ? 0.3 : 0.95;
    }
  }
  // road
  if (v >= horizon) {
    const d = (v - horizon) / (1 - horizon);
    r = 0.03 + 0.03 * d; g = 0.035 + 0.03 * d; b = 0.05 + 0.04 * d;
    const lane = Math.abs(u - 0.5 - (0.28 - u) * 0 ) ;
    if (Math.abs(u - 0.62) < 0.006 + 0.02 * d && Math.floor(d * 7) % 2 === 0) { r += 0.35; g += 0.33; b += 0.25; }
    void lane;
  }
  // streetlamp: pole + head + warm glow + wet-road reflection
  const lx = 0.28, ly = 0.3;
  if (Math.abs(u - lx) < 0.006 && v > ly && v < 0.9) { r = 0.02; g = 0.02; b = 0.025; }
  const ld = Math.hypot((u - lx) * 1.6, v - ly);
  const lampGlow = 1.6 * sm(0.03, 0.0, ld) + 0.55 * Math.exp(-ld * 9);
  r += lampGlow * 1.0; g += lampGlow * 0.72; b += lampGlow * 0.32;
  if (v > horizon) {
    const refl = Math.exp(-Math.abs(u - lx) * 30) * 0.5 * Math.exp(-(v - horizon) * 3);
    r += refl; g += refl * 0.7; b += refl * 0.3;
  }
  return [r, g, b];
}

const toSRGB = (x) => 255 * Math.pow(clamp01(x), 1 / 2.2);

/**
 * Render the scene to a canvas.
 * opts: gain (exposure), noise (0-1), seed, cast [r,g,b] multipliers, mono (grayscale), clip (highlight clipping level)
 */
export function photoCanvas(w, h, opts = {}) {
  const { gain = 1, noise = 0, seed = 1, cast = [1, 1, 1], mono = false } = opts;
  const c = document.createElement('canvas');
  c.width = w; c.height = h;
  const ctx = c.getContext('2d');
  const img = ctx.createImageData(w, h);
  for (let y = 0; y < h; y++) {
    for (let x = 0; x < w; x++) {
      let [r, g, b] = scenePixel((x + 0.5) / w, (y + 0.5) / h);
      const i = y * w + x;
      r = r * gain * cast[0] + noise * (hash(i, seed) - 0.5);
      g = g * gain * cast[1] + noise * (hash(i, seed + 11) - 0.5);
      b = b * gain * cast[2] + noise * (hash(i, seed + 23) - 0.5);
      if (mono) r = g = b = (r + g + b) / 3;
      img.data[i * 4] = toSRGB(r); img.data[i * 4 + 1] = toSRGB(g); img.data[i * 4 + 2] = toSRGB(b);
      img.data[i * 4 + 3] = 255;
    }
  }
  ctx.putImageData(img, 0, 0);
  return c;
}
