// Small modelling kit: shapes, geometry helpers, canvas textures and PBR materials.
// The phone is modelled in millimetres (x across, y toward the top of the phone, z toward the screen).
import * as THREE from 'three';
import { RoundedBoxGeometry } from 'three/addons/geometries/RoundedBoxGeometry.js';

// ---------------------------------------------------------------- shapes (XY plane)

/** Rounded rectangle centred on (cx, cy). r may be one radius or [bottomLeft, bottomRight, topRight, topLeft]. */
export function rrect(w, h, r, cx = 0, cy = 0, Cls = THREE.Shape) {
  const [bl, br, tr, tl] = Array.isArray(r) ? r : [r, r, r, r];
  const s = new Cls(), x = cx - w / 2, y = cy - h / 2;
  s.moveTo(x + bl, y); s.lineTo(x + w - br, y); if (br) s.absarc(x + w - br, y + br, br, -Math.PI / 2, 0);
  s.lineTo(x + w, y + h - tr); if (tr) s.absarc(x + w - tr, y + h - tr, tr, 0, Math.PI / 2);
  s.lineTo(x + tl, y + h); if (tl) s.absarc(x + tl, y + h - tl, tl, Math.PI / 2, Math.PI);
  s.lineTo(x, y + bl); if (bl) s.absarc(x + bl, y + bl, bl, Math.PI, Math.PI * 1.5);
  return s;
}

/** Closed polygon through pts [[x, y], …] with every corner rounded by r. */
export function rpoly(pts, r, Cls = THREE.Shape) {
  const s = new Cls(), n = pts.length;
  const V = pts.map(([x, y]) => new THREE.Vector2(x, y));
  for (let i = 0; i < n; i++) {
    const p = V[i], a = V[(i + n - 1) % n], b = V[(i + 1) % n];
    const da = a.clone().sub(p), db = b.clone().sub(p);
    const k = Math.min(r, da.length() / 2, db.length() / 2);
    const p0 = p.clone().add(da.setLength(k)), p1 = p.clone().add(db.setLength(k));
    if (i === 0) s.moveTo(p0.x, p0.y); else s.lineTo(p0.x, p0.y);
    s.quadraticCurveTo(p.x, p.y, p1.x, p1.y);
  }
  s.closePath();
  return s;
}

export const circle = (r, cx = 0, cy = 0, Cls = THREE.Path) => { const s = new Cls(); s.absarc(cx, cy, r, 0, Math.PI * 2, false); return s; };

// ---------------------------------------------------------------- meshes

const shadowed = (m, name) => { m.castShadow = m.receiveShadow = true; if (name) m.name = name; return m; };

/** Shape extruded from z0 to z1, with a small bevel that keeps the outline's outer size. */
export function plate(shape, z0, z1, mat, { bevel = 0.12, holes = [], name, segs = 12, bsegs = 2 } = {}) {
  if (holes.length) { shape = shape.clone(); shape.holes.push(...holes); }
  const b = Math.min(bevel, (z1 - z0) * 0.45);
  const g = new THREE.ExtrudeGeometry(shape, { depth: z1 - z0 - 2 * b, bevelEnabled: b > 0, bevelThickness: b, bevelSize: b, bevelOffset: -b, bevelSegments: bsegs, curveSegments: segs });
  g.translate(0, 0, z0 + b);
  return shadowed(new THREE.Mesh(g, mat), name);
}

const boxCache = new Map();
/** Box of w×h×d centred at (x, y, z) with lightly rounded edges. */
export function box(w, h, d, mat, x = 0, y = 0, z = 0, name, r) {
  const min = Math.min(w, h, d);
  r ??= Math.min(min * 0.18, 0.25);
  const key = [w, h, d, r].map((v) => v.toFixed(3)).join('|');
  let g = boxCache.get(key);
  if (!g) boxCache.set(key, g = min < 0.45 ? new THREE.BoxGeometry(w, h, d) : new RoundedBoxGeometry(w, h, d, Math.max(w, h, d) > 9 ? 2 : 1, r));
  const m = new THREE.Mesh(g, mat);
  m.position.set(x, y, z);
  return shadowed(m, name);
}

const CYL = new THREE.CylinderGeometry(1, 1, 1, 36);
/** Cylinder of radius r from z0 to z1 (axis along z). */
export function cyl(r, z0, z1, mat, x = 0, y = 0, name) {
  const m = new THREE.Mesh(CYL, mat);
  m.rotation.x = Math.PI / 2; m.scale.set(r, z1 - z0, r); m.position.set(x, y, (z0 + z1) / 2);
  return shadowed(m, name);
}

/** Ring (tube) of outer radius ro and inner radius ri from z0 to z1. */
export function ring(ro, ri, z0, z1, mat, x = 0, y = 0, name, bevel = 0.1, segs = 20, bsegs = 1) {
  const s = new THREE.Shape(); s.absarc(0, 0, ro, 0, Math.PI * 2, false);
  const m = plate(s, z0, z1, mat, { bevel, holes: [circle(ri)], name, segs, bsegs });
  m.position.set(x, y, 0);
  return m;
}

/** Part of a sphere: a lens surface of aperture radius r and sag h, bulging toward −z (dir = −1) or +z. */
export function dome(r, h, mat, x = 0, y = 0, z = 0, dir = -1) {
  const R = (r * r + h * h) / (2 * h), th = Math.asin(Math.min(1, r / R));
  const g = new THREE.SphereGeometry(R, 28, 8, 0, Math.PI * 2, 0, th);
  g.translate(0, -(R - h), 0); g.rotateX(dir < 0 ? -Math.PI / 2 : Math.PI / 2);
  const m = new THREE.Mesh(g, mat); m.position.set(x, y, z);
  return m;
}

export function group(name, ...children) {
  const g = new THREE.Group();
  g.name = name;
  for (const c of children) if (c) g.add(c);
  return g;
}

/** Flat ribbon cable through points [[x, y, z], …], w wide. */
export function flex(points, w, mat, name, t = 0.12) {
  const g = group(name ?? 'Flex cable');
  for (let i = 0; i < points.length - 1; i++) {
    const a = new THREE.Vector3(...points[i]), b = new THREE.Vector3(...points[i + 1]);
    const len = a.distanceTo(b), m = box(len + w * 0.5, w, t, mat);
    m.position.copy(a).lerp(b, 0.5);
    m.rotation.z = Math.atan2(b.y - a.y, b.x - a.x);
    g.add(m);
  }
  return g;
}

/** Plane facing +z (or −z with flip) carrying a texture, sized w×h. */
export function decal(w, h, map, x, y, z, { flip = false, emissive = 0, transparent = false, opacity = 1, roughness = 0.5 } = {}) {
  const mat = new THREE.MeshStandardMaterial({ map, roughness, metalness: 0.1, transparent, opacity, alphaTest: transparent ? 0.02 : 0, polygonOffset: true, polygonOffsetFactor: -2 });
  if (emissive) { mat.emissive.set(0xffffff); mat.emissiveMap = map; mat.emissiveIntensity = emissive; }
  const m = new THREE.Mesh(new THREE.PlaneGeometry(w, h), mat);
  m.position.set(x, y, z); if (flip) m.rotation.y = Math.PI;
  return m;
}

// ---------------------------------------------------------------- textures

function canvas(w, h) { const c = document.createElement('canvas'); c.width = w; c.height = h; return [c, c.getContext('2d')]; }
function finish(c, { repeat, srgb = true } = {}) {
  const t = new THREE.CanvasTexture(c);
  if (srgb) t.colorSpace = THREE.SRGBColorSpace;
  t.anisotropy = 8;
  if (repeat) { t.wrapS = t.wrapT = THREE.RepeatWrapping; t.repeat.set(...repeat); }
  return t;
}
const rng = (seed) => () => (seed = (seed * 16807) % 2147483647) / 2147483647;
export const SANS = '"Inter Display", "Inter", -apple-system, "SF Pro Display", "Helvetica Neue", Helvetica, Arial, sans-serif';

/** Soft radial glow for sprites. */
export function glowTexture() {
  const [c, g] = canvas(128, 128);
  const gr = g.createRadialGradient(64, 64, 0, 64, 64, 64);
  gr.addColorStop(0, 'rgba(255,255,255,1)'); gr.addColorStop(0.3, 'rgba(255,255,255,.45)'); gr.addColorStop(1, 'rgba(255,255,255,0)');
  g.fillStyle = gr; g.fillRect(0, 0, 128, 128);
  return finish(c);
}

/** A wisp of vapour: layered soft blobs on a transparent ground. */
export function smokeTexture(seed = 3) {
  const [c, g] = canvas(256, 256), r = rng(seed);
  for (let i = 0; i < 46; i++) {
    const a = r() * 6.283, d = r() * 52, x = 128 + Math.cos(a) * d, y = 128 + Math.sin(a) * d, s = 22 + r() * 40;
    const gr = g.createRadialGradient(x, y, 0, x, y, s);
    gr.addColorStop(0, `rgba(255,255,255,${0.05 + r() * 0.09})`); gr.addColorStop(1, 'rgba(255,255,255,0)');
    g.fillStyle = gr; g.fillRect(0, 0, 256, 256);
  }
  const mask = g.createRadialGradient(128, 128, 30, 128, 128, 126); mask.addColorStop(0, 'rgba(0,0,0,1)'); mask.addColorStop(1, 'rgba(0,0,0,0)');
  g.globalCompositeOperation = 'destination-in'; g.fillStyle = mask; g.fillRect(0, 0, 256, 256);
  return finish(c);
}

/** Brushed / bead-blasted metal roughness map. */
export function brushedTexture(repeat = [1, 1]) {
  const [c, g] = canvas(512, 512), r = rng(3);
  g.fillStyle = '#b8b8b8'; g.fillRect(0, 0, 512, 512);
  for (let i = 0; i < 2600; i++) {
    const v = 150 + r() * 105 | 0;
    g.fillStyle = `rgba(${v},${v},${v},${0.10 + r() * 0.25})`;
    g.fillRect(r() * 512 - 120, r() * 512, 60 + r() * 380, 1 + (r() * 2 | 0));
  }
  return finish(c, { repeat, srgb: false });
}

/** Fine grain (anodised aluminium, frosted glass, moulded plastic). */
export function grainTexture(repeat = [4, 4]) {
  const [c, g] = canvas(256, 256), im = g.createImageData(256, 256), r = rng(5);
  for (let i = 0; i < im.data.length; i += 4) { const v = 150 + r() * 90 | 0; im.data[i] = im.data[i + 1] = im.data[i + 2] = v; im.data[i + 3] = 255; }
  g.putImageData(im, 0, 0);
  return finish(c, { repeat, srgb: false });
}

/** Circuit board: solder mask with traces, vias, pads and small parts. */
export function pcbTexture(base = '#101418', trace = '#1c242c', seed = 17) {
  const S = 1024, [c, g] = canvas(S, S), r = rng(seed);
  g.fillStyle = base; g.fillRect(0, 0, S, S);
  g.strokeStyle = trace; g.lineCap = 'round'; g.lineJoin = 'round';
  for (let i = 0; i < 170; i++) {
    let x = r() * S, y = r() * S; const n = 2 + (r() * 5 | 0), horiz = r() < 0.5;
    g.lineWidth = 2 + (r() * 2 | 0);
    for (let k = 0; k < n; k++) {
      g.beginPath(); let px = x + (horiz ? 0 : k * 7), py = y + (horiz ? k * 7 : 0); g.moveTo(px, py);
      for (let j = 0; j < 4; j++) { const len = 40 + r() * 160, jog = (r() - 0.5) * 60; if (horiz) { px += len; g.lineTo(px, py); px += Math.abs(jog); py += jog; } else { py += len; g.lineTo(px, py); py += Math.abs(jog); px += jog; } g.lineTo(px, py); }
      g.stroke();
    }
  }
  for (let i = 0; i < 520; i++) { const x = r() * S, y = r() * S; g.fillStyle = '#b9a35e'; g.beginPath(); g.arc(x, y, 2.6, 0, 7); g.fill(); g.fillStyle = '#0a0d10'; g.beginPath(); g.arc(x, y, 1.1, 0, 7); g.fill(); }
  for (let i = 0; i < 260; i++) {
    const x = r() * S, y = r() * S, w = 8 + r() * 20, h = 5 + r() * 10;
    g.fillStyle = '#cfd4d9'; g.fillRect(x - 3, y, 3, h); g.fillRect(x + w, y, 3, h);
    g.fillStyle = r() < 0.55 ? '#0b0c0e' : '#6d5234'; g.fillRect(x, y, w, h);
  }
  return finish(c);
}

/** Dimpled sheet (the vapor chamber): returns { map, bump } with a regular field of pressed dots. */
export function dimpleTextures(repeat) {
  const S = 128, [c, g] = canvas(S, S), [cb, gb] = canvas(S, S);
  g.fillStyle = '#8f949b'; g.fillRect(0, 0, S, S); gb.fillStyle = '#808080'; gb.fillRect(0, 0, S, S);
  for (const [x, y] of [[32, 32], [96, 96]]) {
    let gr = g.createRadialGradient(x - 4, y - 4, 2, x, y, 17); gr.addColorStop(0, '#d9dde2'); gr.addColorStop(0.75, '#6d7279'); gr.addColorStop(1, '#8f949b');
    g.fillStyle = gr; g.beginPath(); g.arc(x, y, 17, 0, 7); g.fill();
    gr = gb.createRadialGradient(x, y, 0, x, y, 18); gr.addColorStop(0, '#ffffff'); gr.addColorStop(0.7, '#c0c0c0'); gr.addColorStop(1, '#808080');
    gb.fillStyle = gr; gb.beginPath(); gb.arc(x, y, 18, 0, 7); gb.fill();
  }
  return { map: finish(c, { repeat }), bump: finish(cb, { repeat, srgb: false }) };
}

/** Woven mesh (the wick, the thermal 'chain mail'): returns { map, bump }. */
export function meshTextures(repeat, fg = '#c98a52', bg = '#3a2415') {
  const S = 64, [c, g] = canvas(S, S), [cb, gb] = canvas(S, S);
  g.fillStyle = bg; g.fillRect(0, 0, S, S); gb.fillStyle = '#202020'; gb.fillRect(0, 0, S, S);
  for (const [ctx, col] of [[g, fg], [gb, '#e0e0e0']]) { ctx.strokeStyle = col; ctx.lineWidth = 9; for (const o of [16, 48]) { ctx.beginPath(); ctx.moveTo(o, 0); ctx.lineTo(o, S); ctx.moveTo(0, o); ctx.lineTo(S, o); ctx.stroke(); } }
  g.fillStyle = 'rgba(255,225,190,.5)'; for (const x of [16, 48]) for (const y of [16, 48]) g.fillRect(x - 4, y - 4, 8, 8);
  return { map: finish(c, { repeat }), bump: finish(cb, { repeat, srgb: false }) };
}

// Blocks of the A20 Pro die as [x, y, w, h] in 0..1 (y down). A schematic: Apple publishes core counts, not a floor plan.
export const DIE = {
  p: [[0.05, 0.05, 0.2, 0.3], [0.27, 0.05, 0.2, 0.3]],
  e: [0, 1, 2, 3].map((i) => [0.05 + i * 0.107, 0.38, 0.097, 0.2]),
  gpu: [0, 1, 2, 3, 4, 5, 6].map((i) => (i < 4 ? [0.52 + i * 0.109, 0.05, 0.099, 0.25] : [0.52 + (i - 4) * 0.146, 0.33, 0.136, 0.25])),
  npu: [[0.05, 0.62, 0.2, 0.33], [0.27, 0.62, 0.2, 0.33]],
  io: [[0.52, 0.62, 0.43, 0.33]],
};
/** Schematic floor plan of the processor die. */
export function dieTexture() {
  const S = 1024, [c, g] = canvas(S, S), r = rng(7);
  g.fillStyle = '#0d1016'; g.fillRect(0, 0, S, S);
  const block = ([x, y, w, h], hue, label) => {
    const X = x * S, Y = y * S, Wd = w * S, Hd = h * S;
    g.fillStyle = `hsl(${hue} 45% 20%)`; g.fillRect(X, Y, Wd, Hd);
    for (let i = 0; i < Math.max(12, Wd * Hd / 1100); i++) { const bw = (0.05 + r() * 0.3) * Wd, bh = (0.05 + r() * 0.22) * Hd; g.fillStyle = `hsl(${hue + r() * 30 - 15} ${40 + r() * 30}% ${20 + r() * 32}%)`; g.fillRect(X + r() * (Wd - bw), Y + r() * (Hd - bh), bw, bh); }
    g.strokeStyle = 'rgba(255,214,90,.85)'; g.lineWidth = 4; g.strokeRect(X + 2, Y + 2, Wd - 4, Hd - 4);
    const size = Math.min(Hd / 2.6, Wd / (label.length * 0.62), 58);
    g.font = `700 ${size}px ${SANS}`; g.textAlign = 'center'; g.textBaseline = 'middle';
    g.fillStyle = 'rgba(0,0,0,.75)'; g.fillText(label, X + Wd / 2 + 2, Y + Hd / 2 + 2); g.fillStyle = '#ffe27a'; g.fillText(label, X + Wd / 2, Y + Hd / 2);
  };
  DIE.p.forEach((b) => block(b, 24, 'P')); DIE.e.forEach((b) => block(b, 44, 'E')); DIE.gpu.forEach((b) => block(b, 214, 'GPU'));
  DIE.npu.forEach((b) => block(b, 300, 'NPU')); DIE.io.forEach((b) => block(b, 172, 'CACHE · I/O'));
  return finish(c);
}

/** Text plate: chip markings, battery print. lines = [[text, sizePx, weight, colour], …]. */
export function textTexture(lines, { w = 512, h = 512, bg = null, align = 'center', pad = 40 } = {}) {
  const [c, g] = canvas(w, h);
  if (bg) { g.fillStyle = bg; g.fillRect(0, 0, w, h); }
  const total = lines.reduce((s, l) => s + l[1] * 1.25, 0);
  let y = (h - total) / 2;
  g.textAlign = align; g.textBaseline = 'middle';
  for (const [text, size, weight = 600, color = '#d7dbe0', spacing = 0] of lines) {
    g.font = `${weight} ${size}px ${SANS}`; g.fillStyle = color;
    try { g.letterSpacing = `${spacing}px`; } catch { /* older browsers */ }
    g.fillText(text, align === 'center' ? w / 2 : pad, y + size * 0.62);
    y += size * 1.25;
  }
  return finish(c);
}

/** The lit display: an abstract wallpaper of nested arcs (original artwork) with the Dynamic Island cut-out. */
export function wallpaperTexture(tone = [150, 34, 58]) {
  const W = 1024, H = 2180, [c, g] = canvas(W, H);
  const [r0, g0, b0] = tone, col = (k, a = 1) => `rgba(${r0 * k | 0},${g0 * k | 0},${b0 * k | 0},${a})`;
  const bg = g.createLinearGradient(0, 0, W, H); bg.addColorStop(0, col(0.55)); bg.addColorStop(0.5, col(0.34)); bg.addColorStop(1, col(0.5));
  g.fillStyle = bg; g.fillRect(0, 0, W, H);
  // ribbons: quarter-arc bands stepping down the screen, each with a bright rim
  const band = (cx, cy, R, a0, a1, wdt) => {
    g.lineWidth = wdt; g.strokeStyle = col(0.42, 0.9); g.beginPath(); g.arc(cx, cy, R, a0, a1); g.stroke();
    const rim = g.createLinearGradient(cx - R, cy - R, cx + R, cy + R); rim.addColorStop(0, 'rgba(255,170,190,.95)'); rim.addColorStop(1, 'rgba(255,120,150,.35)');
    g.lineWidth = 5; g.strokeStyle = rim; g.shadowColor = 'rgba(255,150,175,.9)'; g.shadowBlur = 26;
    g.beginPath(); g.arc(cx, cy, R + wdt / 2, a0, a1); g.stroke(); g.shadowBlur = 0;
  };
  for (let i = 0; i < 4; i++) {
    const y = 260 + i * 520, left = i % 2 === 0;
    band(left ? 0 : W, y + 260, 520, left ? -Math.PI / 2 : Math.PI / 2, left ? Math.PI / 2 : Math.PI * 1.5, 380);
    band(left ? W : 0, y, 300, left ? Math.PI / 2 : -Math.PI / 2, left ? Math.PI * 1.5 : Math.PI / 2, 240);
  }
  const v = g.createRadialGradient(W / 2, H / 2, H * 0.2, W / 2, H / 2, H * 0.62); v.addColorStop(0, 'rgba(0,0,0,0)'); v.addColorStop(1, 'rgba(0,0,0,.5)');
  g.fillStyle = v; g.fillRect(0, 0, W, H);
  return finish(c);
}

// ---------------------------------------------------------------- materials

export const FINISHES = {
  burgundy: { body: 0x4b1522, glass: 0x43131f, tone: [150, 34, 58] },
  black: { body: 0x1c1c1e, glass: 0x161618, tone: [70, 70, 78] },
  white: { body: 0xe3e1dc, glass: 0xdad8d3, tone: [150, 150, 150] },
  blue: { body: 0x9db4cf, glass: 0x8ea6c2, tone: [60, 100, 160] },
};

export function makeMaterials(finish = 'burgundy') {
  const F = FINISHES[finish] ?? FINISHES.burgundy;
  const std = (o) => new THREE.MeshStandardMaterial(o);
  const brushed = brushedTexture(), grain = grainTexture([6, 6]), dimple = dimpleTextures([1, 1]);
  const pcb = pcbTexture(), pcb2 = pcbTexture('#0d1512', '#18261f', 29);
  const wick = meshTextures([1, 1]), mail = meshTextures([1, 1], '#d4d8dd', '#4a4e55');
  return {
    finish: F,
    body: std({ color: F.body, metalness: 0.8, roughness: 0.5, roughnessMap: grain, bumpMap: grain, bumpScale: 0.06 }),
    backGlass: std({ color: F.glass, metalness: 0.25, roughness: 0.62, roughnessMap: grain }),
    bodyInner: std({ color: 0x3a3d43, metalness: 0.9, roughness: 0.5, roughnessMap: brushed }),
    glassBlack: std({ color: 0x050506, metalness: 0.3, roughness: 0.3 }),
    lensCover: std({ color: 0x0a0a0d, metalness: 0.3, roughness: 0.03, transparent: true, opacity: 0.22, depthWrite: false }),
    lensGlass: std({ color: 0x0b0818, metalness: 1.0, roughness: 0.05, emissive: 0x1c0c48, emissiveIntensity: 0.45 }),
    lensClear: std({ color: 0x9fb4d8, metalness: 0.2, roughness: 0.03, transparent: true, opacity: 0.3, depthWrite: false }),
    blade: std({ color: 0x232327, metalness: 0.7, roughness: 0.3, side: THREE.DoubleSide }),
    black: std({ color: 0x0e0f11, metalness: 0.3, roughness: 0.6 }),
    blackGloss: std({ color: 0x08090a, metalness: 0.6, roughness: 0.25 }),
    plastic: std({ color: 0x17181b, metalness: 0.0, roughness: 0.8, roughnessMap: grain }),
    steel: std({ color: 0xa3a8ae, metalness: 0.92, roughness: 0.36, roughnessMap: brushed }),
    steelDark: std({ color: 0x4b4f55, metalness: 0.9, roughness: 0.42, roughnessMap: brushed }),
    cell: std({ color: 0x3b3c40, metalness: 0.85, roughness: 0.42, roughnessMap: grain }),
    vapor: std({ color: 0xffffff, map: dimple.map, bumpMap: dimple.bump, bumpScale: 0.6, metalness: 0.9, roughness: 0.36 }),
    copper: std({ color: 0xc8733a, metalness: 1.0, roughness: 0.34, roughnessMap: brushed }),
    gold: std({ color: 0xd9a441, metalness: 1.0, roughness: 0.3 }),
    pcb: std({ color: 0xffffff, map: pcb, metalness: 0.1, roughness: 0.6 }),
    pcb2: std({ color: 0xffffff, map: pcb2, metalness: 0.1, roughness: 0.6 }),
    shield: std({ color: 0xb9bdc2, metalness: 0.95, roughness: 0.3, roughnessMap: brushed }),
    chip: std({ color: 0x101114, metalness: 0.3, roughness: 0.35 }),
    silicon: std({ color: 0x565c6b, metalness: 0.95, roughness: 0.16 }),
    flex: std({ color: 0x1a1512, metalness: 0.2, roughness: 0.55 }),
    amber: std({ color: 0x8a5a1c, metalness: 0.3, roughness: 0.45 }),
    magnet: std({ color: 0x2a2c30, metalness: 0.8, roughness: 0.4 }),
    pad: std({ color: 0x8e96a0, metalness: 0.1, roughness: 0.85, roughnessMap: grain }),
    white: std({ color: 0xe8e6e0, metalness: 0.0, roughness: 0.5 }),
    wick: std({ color: 0xffffff, map: wick.map, bumpMap: wick.bump, bumpScale: 0.5, metalness: 0.85, roughness: 0.42 }),
    mail: std({ color: 0xffffff, map: mail.map, bumpMap: mail.bump, bumpScale: 0.6, metalness: 0.9, roughness: 0.35 }),
    filler: std({ color: 0x6f86a8, metalness: 0.0, roughness: 0.9 }),
    sponge: std({ color: 0x2d3036, metalness: 0.0, roughness: 0.95, roughnessMap: grain, bumpMap: grain, bumpScale: 0.4 }),
    prism: std({ color: 0xa8d4ff, metalness: 0.1, roughness: 0.05, transparent: true, opacity: 0.38, depthWrite: false }),
    filter: std({ color: 0x2a0a1e, metalness: 0.7, roughness: 0.12 }),
    hair: std({ color: 0x6b4a2e, metalness: 0.0, roughness: 0.5 }),
    blackMatte: std({ color: 0x040405, metalness: 0.2, roughness: 0.5 }),
    flash: std({ color: 0x9c978a, metalness: 0.1, roughness: 0.55 }),
    sensor: std({ color: 0x2a3550, metalness: 0.9, roughness: 0.12, emissive: 0x101a40, emissiveIntensity: 0.4 }),
    oled: std({ color: 0x050506, metalness: 0.4, roughness: 0.12 }),
    _dimple: dimple,
  };
}

/** Give a subtree its own material copies and return fade(k): 1 solid … 0 gone. */
export function fader(obj) {
  const mats = new Map();
  obj.traverse((o) => {
    if (!o.isMesh && !o.isSprite) return;
    if (!mats.has(o.material)) { const m = o.material.clone(); mats.set(o.material, { m, op: o.material.opacity, tr: o.material.transparent, dw: o.material.depthWrite }); }
    o.material = mats.get(o.material).m;
  });
  let last = 1;
  const fade = (k) => {
    if (k === last) return; last = k;
    obj.visible = k > 0.003;
    for (const { m, op, tr, dw } of mats.values()) { m.transparent = tr || k < 0.999; m.opacity = op * k; m.depthWrite = dw && k > 0.5; }
  };
  fade.materials = [...mats.values()].map((e) => e.m);
  return fade;
}
