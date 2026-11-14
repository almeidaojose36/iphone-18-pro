// 2D layer: real-footage inserts, full-screen cards and the on-screen typography.
// Everything is a pure function of time, so the offline renderer can step it frame by frame.
import { clamp01, ramp, hash } from './util.js';
import { photoCanvas } from './photo.js';
import { ROAD } from './direction.js';

const W = 1920, H = 1080;
const GOLD = '#dcb46c', INK = '#f1ede4', DIM = '#8d8a82', BG = '#06090e';
const F_HEAD = '"Barlow Condensed", "Arial Narrow", sans-serif', F_SUB = 'Manrope, Arial, sans-serif', F_MONO = '"JetBrains Mono", monospace';

const $ = (id) => document.getElementById(id);
let clipC, cardC, cx, kx;
const clips = {};
const CLIPS = { beam: 60, macro: 54, smoke: 46, side: 46, chip: 41, rear: 31, frame: 77, thin: 48 };

export async function initUI() {
  clipC = $('clip'); cardC = $('card');
  kx = clipC.getContext('2d'); cx = cardC.getContext('2d');
  await Promise.all([`700 40px ${F_HEAD}`, `600 40px ${F_HEAD}`, `500 20px ${F_SUB}`, `500 20px ${F_MONO}`].map((f) => document.fonts.load(f)));
  const jobs = [];
  for (const [name, n] of Object.entries(CLIPS)) {
    clips[name] = [];
    for (let i = 1; i <= n; i++) {
      const im = new Image();
      im.src = `assets/clips/${name}/${String(i).padStart(3, '0')}.jpg`;
      clips[name].push(im); jobs.push(im.decode().catch(() => {}));
    }
  }
  await Promise.all(jobs);
}

// ---------- real footage ----------
export function drawClip(ins, lt) {
  const fr = clips[ins.clip], f = Math.min(fr.length - 1, Math.max(0, Math.floor(lt * 24 * (ins.rate || 1))));
  const z = 1 + 0.035 * clamp01(lt / ins.d);            // slow push-in so held frames never feel frozen
  kx.setTransform(z, 0, 0, z, 640 * (1 - z), 360 * (1 - z));
  kx.drawImage(fr[f], 0, 0, 1280, 720);
  kx.setTransform(1, 0, 0, 1, 0, 0);
}

// ---------- cards ----------
const cache = {};
const memo = (k, f) => cache[k] || (cache[k] = f());
const darkFrames = () => memo('dark', () => [1, 2, 3, 4, 5].map((s) => photoCanvas(960, 540, { gain: 0.34, noise: 0.2, seed: s * 7, cast: [0.92, 0.97, 1.12] })));
const goodFrame = () => memo('good', () => photoCanvas(1920, 1080, {}));
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
      ['FACTS FROM', 'Apple (tetraprism telephoto, sensor-shift stabilisation, Photonic Engine) · Yole Group teardown reports'],
      ['', 'Sony Semiconductor Solutions · Google Research (HDR+, burst photography)'],
      ['IPHONE 18 PRO FOOTAGE', 'Apple'],
      ['NIGHT PHOTOGRAPH', 'Greg Zaal and Rico Cilliers, Poly Haven (CC0) · every grainy version is our simulation on it'],
      ['STUDIO LIGHTING', 'Studio Small 08, Poly Haven (CC0)'],
      ['3D', 'our own models · illustrations of typical designs, not to scale'],
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
export function showLayer(kind) {
  clipC.style.display = kind === 'clip' ? 'block' : 'none';
  cardC.style.display = kind === 'card' ? 'block' : 'none';
}

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
