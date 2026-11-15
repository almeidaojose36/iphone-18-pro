// 2D layer: real-footage inserts, full-screen cards and the on-screen typography.
// Everything is a pure function of time, so the offline renderer can step it frame by frame.
import { clamp01, ramp, hash } from './util.js';
import { photoCanvas } from './photo.js';
import { ROAD } from './direction.js';

const W = 1920, H = 1080;
const GOLD = '#dcb46c', INK = '#f1ede4', DIM = '#8d8a82', BG = '#06090e';
const F_HEAD = '"Barlow Condensed", "Arial Narrow", sans-serif', F_SUB = 'Manrope, Arial, sans-serif', F_MONO = '"JetBrains Mono", monospace';

const $ = (id) => document.getElementById(id);
let cardC, cx;

export async function initUI() {
  cardC = $('card');
  cx = cardC.getContext('2d');
  await Promise.all([`700 40px ${F_HEAD}`, `600 40px ${F_HEAD}`, `500 20px ${F_SUB}`, `500 20px ${F_MONO}`].map((f) => document.fonts.load(f)));
}

// ---------- cards ----------
const cache = {};
const memo = (k, f) => cache[k] || (cache[k] = f());
const darkFrames = () => memo('dark', () => [1, 2, 3, 4, 5].map((s) => photoCanvas(960, 540, { gain: 0.34, noise: 0.2, seed: s * 7, cast: [0.92, 0.97, 1.12] })));
const goodFrame = () => memo('good', () => photoCanvas(1920, 1080, {}));
const variant = (o, w = 960, h = 540) => memo(JSON.stringify([o, w, h]), () => o.mosaic ? mosaic() : photoCanvas(w, h, o));
function mosaic() {
  const w = 240, h = 135, c = photoCanvas(w, h, { gain: 1.1 }), g = c.getContext('2d'), id = g.getImageData(0, 0, w, h), d = id.data;
  for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) {
    const i = (y * w + x) * 4, k = (y % 2) * 2 + (x % 2), keep = k === 0 ? 0 : k === 3 ? 2 : 1;
    for (let q = 0; q < 3; q++) if (q !== keep) d[i + q] = 0;
  }
  g.putImageData(id, 0, 0); return c;
}
const mergeFrames = () => memo('merge', () => {
  const w = 192, h = 120, acc = new Float32Array(w * h * 4), out = [];
  for (let n = 1; n <= 9; n++) {
    const c = photoCanvas(w, h, { gain: 0.9, noise: 0.42, seed: n * 13 }), id = c.getContext('2d').getImageData(0, 0, w, h);
    for (let i = 0; i < acc.length; i++) acc[i] += id.data[i];
    for (let i = 0; i < acc.length; i++) id.data[i] = acc[i] / n;
    c.getContext('2d').putImageData(id, 0, 0);
    out.push(c);
  }
  return out;
});

function bg() {
  const g = cx.createRadialGradient(W * 0.5, H * 0.45, 100, W * 0.5, H * 0.5, 1300);
  g.addColorStop(0, '#0c121b'); g.addColorStop(1, BG);
  cx.fillStyle = g; cx.fillRect(0, 0, W, H);
}
function txt(s, x, y, font, color = INK, align = 'left', alpha = 1, spacing = 0) {
  cx.font = font; cx.fillStyle = color; cx.textAlign = align; cx.globalAlpha = alpha;
  cx.letterSpacing = spacing + 'px';
  cx.fillText(s, x, y); cx.globalAlpha = 1; cx.letterSpacing = '0px';
}
const mono = (s, x, y, a = 1, col = GOLD, size = 22, align = 'left') => txt(s, x, y, `500 ${size}px ${F_MONO}`, col, align, a, 2);

const CARDS = {
  photo(t, ins) {
    if (ins.mode === 'dark') {
      const f = darkFrames()[Math.floor(t * 12) % 5];
      const jx = 6 * Math.sin(t * 7.1) + 4 * Math.sin(t * 13.3), jy = 5 * Math.sin(t * 9.7);
      cx.imageSmoothingEnabled = true;
      cx.drawImage(f, -20 + jx, -12 + jy, W + 40, H + 24);
    } else {
      const z = 1.02 + 0.05 * clamp01(t / ins.d);
      cx.drawImage(goodFrame(), W * (1 - z) / 2, H * (1 - z) / 2, W * z, H * z);
      if (ins.mode === 'calc') {
        // right of the wipe: the picture as the numbers it was computed from
        const x = W * ramp(t, 0.5, 3.6);
        cx.save(); cx.beginPath(); cx.rect(x, 0, W - x, H); cx.clip();
        cx.fillStyle = 'rgba(4,7,11,0.93)'; cx.fillRect(0, 0, W, H);
        cx.font = `500 17px ${F_MONO}`; cx.textAlign = 'left';
        const step = Math.floor(t * 8);
        for (let r = 0; r < 34; r++) for (let q = 0; q < 34; q++) {
          const v = 180 + Math.floor(hash(r * 40 + q, 3 + (hash(r, q) < 0.25 ? step : 0)) * 620);
          cx.fillStyle = hash(q, r + 9) < 0.12 ? GOLD : 'rgba(170,180,195,0.55)';
          cx.fillText(v, 14 + q * 57, 30 + r * 32);
        }
        cx.restore();
        cx.fillStyle = GOLD; cx.fillRect(x - 2, 0, 3, H);
      } else if (t < 0.18) { cx.fillStyle = `rgba(255,255,255,${0.5 * (1 - t / 0.18)})`; cx.fillRect(0, 0, W, H); }
    }
    vignette();
  },

  sensor(t) {
    bg();
    const s = 20, x0 = 180, y0 = 240, a = ramp(t, 0, 0.5);
    cx.globalAlpha = a; cx.fillStyle = 'rgba(40,58,80,0.35)'; cx.fillRect(x0, y0, 36 * s, 24 * s);
    cx.strokeStyle = INK; cx.lineWidth = 2.5; cx.strokeRect(x0, y0, 36 * s, 24 * s); cx.globalAlpha = 1;
    const p = ramp(t, 0.75, 1.15), w = 9.8 * s, h = 7.3 * s;
    cx.globalAlpha = p; cx.fillStyle = GOLD;
    cx.fillRect(x0 + 24, y0 + 24 * s - h - 24 + (1 - p) * 30, w, h); cx.globalAlpha = 1;
    mono('FULL-FRAME SENSOR', 1010, 300, a);
    txt('36 × 24 mm', 1010, 372, `600 76px ${F_HEAD}`, INK, 'left', a);
    mono('PHONE MAIN SENSOR · 1/1.3-INCH CLASS', 1010, 500, p);
    txt('about 9.8 × 7.3 mm', 1010, 572, `600 76px ${F_HEAD}`, GOLD, 'left', p);
    txt('roughly a fingernail · drawn at true relative size', 1010, 624, `500 28px ${F_SUB}`, DIM, 'left', p);
  },

  title(t) {
    bg();
    cx.fillStyle = 'rgba(220,180,108,0.05)';
    for (let x = 0; x < W; x += 48) for (let y = 0; y < H; y += 48) cx.fillRect(x, y, 2, 2);
    const word = 'DEEP TEARDOWN';
    cx.font = `700 250px ${F_HEAD}`; cx.letterSpacing = '10px';
    const tw = cx.measureText(word).width; let x = (W - tw) / 2;
    cx.textAlign = 'left';
    for (let i = 0; i < word.length; i++) {
      const a = ramp(t, 0.15 + i * 0.045, 0.45 + i * 0.045);
      cx.globalAlpha = a; cx.fillStyle = INK;
      cx.fillText(word[i], x, 560 + (1 - a) * 26);
      x += cx.measureText(word[i]).width;
    }
    cx.globalAlpha = 1; cx.letterSpacing = '0px';
    const l = ramp(t, 0.8, 1.5);
    cx.fillStyle = GOLD; cx.fillRect((W - tw) / 2, 612, tw * 0.56 * l, 4);
    txt('INSIDE THE PHONE CAMERA', (W + tw) / 2, 628, `600 44px ${F_HEAD}`, INK, 'right', ramp(t, 1.2, 1.8), 12);
  },

  road(t, ins, ch) {
    bg();
    mono('ONE RAY OF LIGHT · FIVE STOPS', W / 2, 250, ramp(t, 0, 0.4), GOLD, 24, 'center');
    const n = ROAD.length, bw = 300, gap = 36, x0 = (W - n * bw - (n - 1) * gap) / 2, y0 = 310, bh = 330;
    for (let i = 0; i < n; i++) {
      const x = x0 + i * (bw + gap), on = i === ins.idx, done = i < ins.idx, a = ramp(t, 0.1 + i * 0.07, 0.4 + i * 0.07);
      const hl = on ? ramp(t, 0.8, 1.2) : 0;
      cx.globalAlpha = a * (on ? 1 : done ? 0.38 : 0.6);
      cx.fillStyle = `rgba(220,180,108,${0.04 + 0.13 * hl})`; cx.strokeStyle = on ? GOLD : '#5d5546'; cx.lineWidth = on ? 3 : 1.5;
      cx.beginPath(); cx.roundRect(x, y0, bw, bh, 14); cx.fill(); cx.stroke();
      icon(i, x + bw / 2, y0 + 130, on ? GOLD : '#9c8a63');
      txt(ROAD[i], x + bw / 2, y0 + 280, `600 58px ${F_HEAD}`, on ? GOLD : INK, 'center', cx.globalAlpha, 2);
      mono('0' + (i + 1), x + 20, y0 + 38, cx.globalAlpha, on ? GOLD : DIM, 20);
      if (done) { cx.fillStyle = INK; cx.fillRect(x + 50, y0 + 262, bw - 100, 3); }
      cx.globalAlpha = 1;
    }
    const a = ramp(t, 1.0, 1.5);
    mono(ch.label.toUpperCase(), W / 2, 760, a, GOLD, 24, 'center');
    txt(ch.title.toUpperCase(), W / 2, 840, `700 76px ${F_HEAD}`, INK, 'center', a, 2);
  },

  merge(t) {
    bg();
    const fr = mergeFrames(), n = 1 + Math.min(8, Math.floor(ramp(t, 0.6, 4.6) * 8.999));
    const pw = 800, ph = 500, y = 250;
    cx.imageSmoothingEnabled = false;
    [[110, fr[0], 'ONE FRAME', INK], [1010, fr[n - 1], `${n} FRAME${n > 1 ? 'S' : ''} MERGED`, GOLD]].forEach(([x, im, lab, col]) => {
      cx.drawImage(im, x, y, pw, ph);
      cx.strokeStyle = 'rgba(241,237,228,0.5)'; cx.lineWidth = 2; cx.strokeRect(x, y, pw, ph);
      txt(lab, x, y - 22, `600 54px ${F_HEAD}`, col);
    });
    cx.imageSmoothingEnabled = true;
    const a = ramp(t, 4.2, 4.8);
    txt('9 FRAMES ≈ ⅓ THE NOISE', 110, 880, `700 84px ${F_HEAD}`, INK, 'left', a, 1);
    cx.fillStyle = GOLD; cx.globalAlpha = a; cx.fillRect(110, 900, 640 * a, 4); cx.globalAlpha = 1;
    mono('OUR SIMULATION ON A REAL PHOTO · NOISE FALLS WITH THE SQUARE ROOT OF THE FRAME COUNT', 110, 960, ramp(t, 0.3, 0.8), DIM, 20);
  },

  versus(t) {
    bg();
    const a = ramp(t, 0, 0.5), b = ramp(t, 1.6, 2.2);
    mono('TWO ANSWERS TO THE SAME PROBLEM', W / 2, 270, a, GOLD, 24, 'center');
    mono('THE LENS', 480, 440, a, DIM, 24, 'center');
    txt('SIZE', 480, 620, `700 220px ${F_HEAD}`, INK, 'center', a, 4);
    cx.fillStyle = '#4b463c'; cx.fillRect(W / 2 - 1, 380, 2, 330);
    mono('THE PHONE', 1440, 440, b, DIM, 24, 'center');
    txt('SPEED', 1440, 560, `700 150px ${F_HEAD}`, GOLD, 'center', b, 4);
    txt('+ MATHEMATICS', 1440, 690, `700 110px ${F_HEAD}`, GOLD, 'center', ramp(t, 3.2, 3.8), 4);
  },

  sources(t) {
    bg();
    const a = ramp(t, 0, 0.8);
    txt('SOURCES & CREDITS', 150, 200, `700 60px ${F_HEAD}`, GOLD, 'left', a, 3);
    const L = [
      ['FACTS FROM', 'Apple (published descriptions of the tetraprism telephoto and sensor-shift stabilisation) · Yole Group teardown reports'],
      ['', 'Sony Semiconductor Solutions · Google Research (HDR+, burst photography)'],
      ['NIGHT PHOTOGRAPH', 'Greg Zaal and Rico Cilliers, Poly Haven (CC0) · every grainy version is our simulation on it'],
      ['STUDIO LIGHTING', 'Studio Small 08, Poly Haven (CC0)'],
      ['3D', 'every model and animation is our own · illustrations of typical designs, not to scale'],
      ['VOICE · MUSIC · SOUND', 'generated with ElevenLabs'],
    ];
    let y = 300;
    for (const [k, v] of L) {
      if (k) { y += 26; mono(k, 150, y, a, GOLD, 20); y += 40; }
      txt(v, 150, y, `500 28px ${F_SUB}`, INK, 'left', a * 0.9); y += 42;
    }
    txt('DEEP TEARDOWN · 2026', 150, 1010, `600 34px ${F_HEAD}`, DIM, 'left', a, 6);
  },
};

const jit = (t) => [Math.sin(t * 7.1) + 0.6 * Math.sin(t * 13.3 + 1), Math.sin(t * 9.7) + 0.5 * Math.sin(t * 15.1)];
function boxLabel(s, x, y, col = INK, align = 'left') {
  cx.font = `500 30px ${F_MONO}`; cx.letterSpacing = '3px';
  const w = cx.measureText(s).width + 76, x0 = align === 'right' ? x - w : x;
  cx.fillStyle = 'rgba(8,11,16,0.82)'; cx.beginPath(); cx.roundRect(x0, y, w, 62, 8); cx.fill();
  cx.fillStyle = GOLD; cx.fillRect(x0 + 22, y + 24, 14, 14);
  cx.fillStyle = col; cx.textAlign = 'left'; cx.fillText(s, x0 + 52, y + 42); cx.letterSpacing = '0px';
}

Object.assign(CARDS, {
  // hand tremble: invisible on a wide shot, a smear once you zoom in
  shake(t, ins) {
    const g = goodFrame(), zt = ramp(t, ins.zoom, ins.zoom + 0.7), z = 1 + 4.2 * zt, [jx, jy] = jit(t);
    const fx = 0.74 * W, fy = 0.16 * H, amp = 2.2 * z;
    cx.fillStyle = '#000'; cx.fillRect(0, 0, W, H);
    const n = zt > 0.5 ? 6 : 1;
    for (let k = 0; k < n; k++) {
      const [qx, qy] = jit(t - k * 0.012);
      cx.globalAlpha = 1 / (k + 1);
      cx.save(); cx.translate(W / 2 + qx * amp, H / 2 + qy * amp); cx.scale(z, z); cx.translate(-(W / 2 + (fx - W / 2) * zt), -(H / 2 + (fy - H / 2) * zt));
      cx.drawImage(g, 0, 0, W, H); cx.restore();
    }
    cx.globalAlpha = 1; vignette();
    boxLabel(zt < 0.5 ? 'WIDE SHOT · THE TREMBLE IS INVISIBLE' : 'ZOOMED IN · THE SAME TREMBLE', 110, 930);
    void jx; void jy;
  },

  expose(t, ins) {
    const p = ramp(t, 0.6, ins.d - 1.4), steps = ['1/60', '1/30', '1/15', '1/8'], k = Math.min(3, Math.floor(p * 3.999));
    cx.drawImage(goodFrame(), 0, 0, W, H);
    cx.fillStyle = `rgba(0,0,0,${0.82 * (1 - p)})`; cx.fillRect(0, 0, W, H);
    vignette();
    mono('SHUTTER OPEN FOR', 110, 800, 1, GOLD, 24);
    txt(steps[k] + ' s', 110, 930, `700 150px ${F_HEAD}`, INK, 'left', 1, 2);
    cx.fillStyle = 'rgba(241,237,228,0.25)'; cx.fillRect(110, 970, 700, 6); cx.fillStyle = GOLD; cx.fillRect(110, 970, 700 * (0.125 + 0.875 * p), 6);
    mono('LIGHT COLLECTED', 830, 980, 1, DIM, 20);
  },

  hair(t) {
    bg();
    const s = 11;
    cx.strokeStyle = 'rgba(220,180,108,0.22)'; cx.lineWidth = 1; cx.beginPath();
    for (let x = 0; x <= W; x += s) { cx.moveTo(x, 0); cx.lineTo(x, H); }
    for (let y = 0; y <= H; y += s) { cx.moveTo(0, y); cx.lineTo(W, y); }
    cx.stroke();
    cx.fillStyle = GOLD; cx.fillRect(110 - (110 % s), 198 - (198 % s), s, s);
    const p = ramp(t, 0.3, 1.5);
    cx.save(); cx.translate(W * 0.62, H / 2); cx.rotate(-0.42);
    const g = cx.createLinearGradient(0, -385, 0, 385);
    g.addColorStop(0, '#1b120b'); g.addColorStop(0.3, '#6a4a2c'); g.addColorStop(0.55, '#8a6238'); g.addColorStop(1, '#140d08');
    cx.fillStyle = g; cx.fillRect(-1600, -385, 3200 * p, 770); cx.restore();
    boxLabel('ONE PIXEL ≈ 1 µm', 140, 170);
    boxLabel('ONE HUMAN HAIR ≈ 70 µm ACROSS', 110, 930);
  },

  hallway(t, ins) {
    bg();
    const p = ramp(t, 0.8, ins.d - 1.2), L = 1500, x0 = 210;
    mono('A LONG HALLWAY', x0, 250, 1, GOLD, 32);
    cx.strokeStyle = '#5d5546'; cx.lineWidth = 2; cx.strokeRect(x0, 280, L, 70);
    cx.fillStyle = GOLD; cx.fillRect(x0, 313, L * p, 4);
    cx.fillStyle = INK; cx.beginPath(); cx.arc(x0 + L * p, 315, 13, 0, 7); cx.fill();
    mono('A CLOSET, LINED WITH MIRRORS', x0, 480, 1, GOLD, 32);
    const bw = 520, bh = 400, by = 520, n = 7, seg = Math.hypot(bw / n, bh);
    cx.strokeStyle = INK; cx.lineWidth = 3; cx.strokeRect(x0, by, bw, bh);
    const pt = (u) => { const k = Math.min(n - 1, Math.floor(u * n)), f = u * n - k, up = k % 2; return [x0 + (k + f) * bw / n, by + (up ? 1 - f : f) * bh]; };
    cx.strokeStyle = GOLD; cx.lineWidth = 4; cx.beginPath(); cx.moveTo(x0, by);
    for (let u = 0; u <= p; u += 0.004) cx.lineTo(...pt(u));
    cx.stroke();
    const [rx, ry] = pt(p); cx.fillStyle = INK; cx.beginPath(); cx.arc(rx, ry, 13, 0, 7); cx.fill();
    txt('SAME DISTANCE', 880, 720, `700 120px ${F_HEAD}`, INK, 'left', ramp(t, 1.5, 2.2), 2);
    txt(`${Math.round(p * 100)} %  covered in both`, 884, 790, `500 34px ${F_SUB}`, DIM, 'left', ramp(t, 1.5, 2.2));
    void seg;
  },

  wipe(t, ins) {
    const a = variant(ins.a), b = variant(ins.b), x = W * ramp(t, ins.at ?? 1.2, (ins.at ?? 1.2) + 2.4);
    cx.imageSmoothingEnabled = !ins.a.mosaic; cx.drawImage(a, 0, 0, W, H);
    cx.save(); cx.beginPath(); cx.rect(0, 0, x, H); cx.clip(); cx.imageSmoothingEnabled = !ins.b.mosaic; cx.drawImage(b, 0, 0, W, H); cx.restore();
    cx.imageSmoothingEnabled = true;
    cx.fillStyle = GOLD; cx.fillRect(x - 2, 0, 4, H); vignette();
    if (x < W - 500) boxLabel(ins.la, W - 110, 930, INK, 'right');
    if (x > 520) boxLabel(ins.lb, 110, 930, INK);
  },

  // stabiliser off / on: the same zoomed crop, one trembling, one held still
  steady(t) {
    const g = goodFrame(), z = 4.6, fx = 0.74 * W, fy = 0.16 * H;
    cx.fillStyle = '#000'; cx.fillRect(0, 0, W, H);
    [[0, 26, 'STABILISER OFF'], [962, 1.2, 'STABILISER ON']].forEach(([x0, amp, lab]) => {
      cx.save(); cx.beginPath(); cx.rect(x0, 0, 958, H); cx.clip();
      const n = amp > 5 ? 6 : 1;
      for (let k = 0; k < n; k++) {
        const [qx, qy] = jit(t - k * 0.012);
        cx.globalAlpha = 1 / (k + 1);
        cx.save(); cx.translate(x0 + 479 + qx * amp, H / 2 + qy * amp); cx.scale(z, z); cx.translate(-fx, -fy); cx.drawImage(g, 0, 0, W, H); cx.restore();
      }
      cx.restore(); cx.globalAlpha = 1;
      boxLabel(lab, x0 + 70, 60, amp > 5 ? INK : GOLD);
    });
    cx.fillStyle = GOLD; cx.fillRect(958, 0, 4, H);
  },

  buffer(t) {
    bg();
    const fr = darkFrames(), tw = 330, th = 186, gap = 40, y = 420, off = (t * 150) % (tw + gap);
    mono('THE ROLLING BUFFER · FRAMES KEEP ARRIVING', 110, 350, 1, GOLD, 30);
    for (let i = -1; i < 6; i++) {
      const x = 110 + i * (tw + gap) + (tw + gap) - off, k = ((i - Math.floor(t * 150 / (tw + gap))) % 5 + 5) % 5;
      cx.globalAlpha = clamp01((x + tw - 80) / 200) * clamp01((W - 60 - x) / 200);
      cx.drawImage(fr[k], x, y, tw, th); cx.strokeStyle = 'rgba(241,237,228,0.5)'; cx.lineWidth = 2; cx.strokeRect(x, y, tw, th);
    }
    cx.globalAlpha = 1;
    mono('← OLDEST · THROWN AWAY', 110, 690, 1, DIM, 28); mono('NEWEST →', W - 110, 690, 1, INK, 28, 'right');
  },

  align(t) {
    const a = variant({ gain: 0.95, noise: 0.22, seed: 3 }), b = variant({ gain: 0.95, noise: 0.22, seed: 9 }), q = 1 - ramp(t, 1.2, 4.2);
    cx.drawImage(a, 0, 0, W, H);
    cx.globalAlpha = 0.5; cx.save(); cx.translate(W / 2 + 74 * q, H / 2 - 40 * q); cx.rotate(0.022 * q); cx.drawImage(b, -W / 2, -H / 2, W, H); cx.restore(); cx.globalAlpha = 1;
    vignette();
    boxLabel(q > 0.02 ? 'TWO FRAMES · YOUR HAND MOVED BETWEEN THEM' : 'ALIGNED', 110, 930, q > 0.02 ? INK : GOLD);
  },
});

function icon(i, x, y, col) {
  cx.strokeStyle = col; cx.lineWidth = 3; cx.beginPath();
  if (i === 0) { cx.moveTo(x - 70, y - 50); cx.lineTo(x - 70, y + 10); cx.lineTo(x - 20, y - 40); cx.lineTo(x + 30, y + 30); cx.lineTo(x + 70, y - 10); cx.lineTo(x + 70, y + 50); }
  else if (i === 1) { cx.rect(x - 34, y - 34, 68, 68); for (const s of [-1, 1]) { cx.moveTo(x + s * 34, y); cx.bezierCurveTo(x + s * 50, y - 22, x + s * 58, y + 22, x + s * 76, y); cx.moveTo(x, y + s * 34); cx.bezierCurveTo(x - 22, y + s * 50, x + 22, y + s * 58, x, y + s * 76); } }
  else if (i === 2) { for (let k = -1; k <= 1; k++) { cx.moveTo(x + k * 46 - 18, y - 30); cx.lineTo(x + k * 46 - 18, y + 46); cx.lineTo(x + k * 46 + 18, y + 46); cx.lineTo(x + k * 46 + 18, y - 30); } }
  else if (i === 3) { for (let r = 0; r < 4; r++) for (let q = 0; q < 4; q++) cx.rect(x - 62 + q * 32, y - 62 + r * 32, 26, 26); }
  else { for (let k = 3; k >= 0; k--) cx.rect(x - 70 + k * 12, y - 20 - k * 12, 104, 66); }
  cx.stroke();
  if (i === 2) { cx.fillStyle = col; for (const [dx, dy] of [[-46, -52], [0, -58], [46, -50], [-40, 30], [6, 34], [50, 30], [-52, 14]]) { cx.beginPath(); cx.arc(x + dx, y + dy, 5, 0, 7); cx.fill(); } }
}

function vignette() {
  const g = cx.createRadialGradient(W / 2, H / 2, 500, W / 2, H / 2, 1200);
  g.addColorStop(0, 'rgba(0,0,0,0)'); g.addColorStop(1, 'rgba(0,0,0,0.55)');
  cx.fillStyle = g; cx.fillRect(0, 0, W, H);
}

export function drawCard(ins, lt, ch) { cx.setTransform(1, 0, 0, 1, 0, 0); CARDS[ins.card](lt, ins, ch); }

/** Show the right 2D layer: 'clip', 'card' or none. */
export function showLayer(kind) { cardC.style.display = kind === 'card' ? 'block' : 'none'; }

// ---------- typography ----------
export function drawText(items, lt) {
  const head = $('head'), tag = $('tag');
  let h = null, g = null;
  for (const it of items) if (lt >= it.t && lt < it.t + it.d) { if (it.head) h = it; else if (it.tag) g = it; }
  if (h) {
    const u = lt - h.t, out = 1 - ramp(u, h.d - 0.35, h.d);
    if (head._it !== h) {
      head._it = h; head.className = 'pos-' + (h.pos || 'tl');
      head.querySelector('b').textContent = h.head; head.querySelector('span').textContent = h.sub || '';
    }
    head.style.opacity = out;
    const r = ramp(u, 0, 0.45);
    head.querySelector('b').style.clipPath = `inset(0 ${100 - r * 100}% 0 0)`;
    head.querySelector('i').style.width = ramp(u, 0.1, 0.7) * 100 + '%';
    head.querySelector('span').style.opacity = ramp(u, 0.45, 0.9);
  } else head.style.opacity = 0;
  if (g) {
    const u = lt - g.t, n = Math.floor(u * 34), full = g.tag.length + (g.sub ? g.sub.length : 0);
    tag.style.opacity = 1 - ramp(u, g.d - 0.3, g.d);
    tag.querySelector('b').textContent = g.tag.slice(0, n);
    tag.querySelector('span').textContent = g.sub ? g.sub.slice(0, Math.max(0, n - g.tag.length)) : '';
    tag.querySelector('u').style.opacity = n < full || Math.floor(u * 2.5) % 2 ? 1 : 0;
  } else tag.style.opacity = 0;
}
