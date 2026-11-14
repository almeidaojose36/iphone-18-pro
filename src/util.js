import * as THREE from '../vendor/three.module.js';
export { THREE };

export const clamp01 = (x) => Math.min(1, Math.max(0, x));
export const lerp = (a, b, t) => a + (b - a) * t;
export const smooth = (x) => { x = clamp01(x); return x * x * (3 - 2 * x); };
/** 0 → 1 smoothly while t goes from a to b. */
export const ramp = (t, a, b) => smooth((t - a) / (b - a || 1e-6));
/** 1 inside [a, b], with soft edges of width e. */
export const win = (t, a, b, e = 0.5) => ramp(t, a, a + e) * (1 - ramp(t, b - e, b));
/** Deterministic pseudo-random in [0, 1). */
export const hash = (n, m = 0) => {
  const s = Math.sin(n * 127.1 + m * 311.7 + 17.3) * 43758.5453;
  return s - Math.floor(s);
};
export const mod = (a, n) => ((a % n) + n) % n;

export const COL = {
  bg: 0x05070b, gold: 0xffc65a, cyan: 0x4fe3ff, copper: 0xd98a4a, glass: 0x9fd4ff,
  metal: 0x2a2f38, dark: 0x12151b, red: 0xff4d4d, green: 0x49e06a, blue: 0x4d7dff, white: 0xffffff,
};

export function baseScene() {
  const scene = new THREE.Scene();
  scene.background = new THREE.Color(COL.bg);
  scene.add(new THREE.HemisphereLight(0xcfe2ff, 0x2a3040, 0.55));
  const fillL = new THREE.DirectionalLight(0xffffff, 0.7);
  fillL.position.set(-3, 2, 8);
  scene.add(fillL);
  const key = new THREE.DirectionalLight(0xffffff, 2.6);
  key.position.set(4, 8, 6);
  scene.add(key);
  // rim lights from behind so metal and glass edges catch a highlight
  const rim = new THREE.DirectionalLight(0x7fe9ff, 2.2);
  rim.position.set(-6, 3, -5);
  scene.add(rim);
  const rim2 = new THREE.DirectionalLight(0xffd9a8, 1.6);
  rim2.position.set(7, -2, -6);
  scene.add(rim2);
  scene.userData.lights = { fillL, key, rim, rim2 };
  return scene;
}

export function makeCamera(fov = 40) {
  return new THREE.PerspectiveCamera(fov, 16 / 9, 0.05, 400);
}

const _a = new THREE.Vector3(), _b = new THREE.Vector3();
/** keys: [{t, p:[x,y,z], l:[x,y,z]}] sorted by t; smooth interpolation between neighbours. */
export function camPath(cam, keys, t) {
  let i = 0;
  while (i < keys.length - 2 && t > keys[i + 1].t) i++;
  const k0 = keys[i], k1 = keys[Math.min(i + 1, keys.length - 1)];
  const u = k1 === k0 ? 0 : ramp(t, k0.t, k1.t);
  _a.fromArray(k0.p).lerp(_b.fromArray(k1.p), u);
  cam.position.copy(_a);
  _a.fromArray(k0.l).lerp(_b.fromArray(k1.l), u);
  cam.lookAt(_a);
}

let _glowTex;
export function glowTexture() {
  if (_glowTex) return _glowTex;
  const c = document.createElement('canvas');
  c.width = c.height = 128;
  const g = c.getContext('2d');
  const grad = g.createRadialGradient(64, 64, 0, 64, 64, 64);
  grad.addColorStop(0, 'rgba(255,255,255,1)');
  grad.addColorStop(0.25, 'rgba(255,255,255,0.45)');
  grad.addColorStop(1, 'rgba(255,255,255,0)');
  g.fillStyle = grad;
  g.fillRect(0, 0, 128, 128);
  _glowTex = new THREE.CanvasTexture(c);
  return _glowTex;
}

export function glow(color, size = 1) {
  const s = new THREE.Sprite(new THREE.SpriteMaterial({
    map: glowTexture(), color, blending: THREE.AdditiveBlending, depthWrite: false, transparent: true,
  }));
  s.scale.setScalar(size);
  return s;
}

const UP = new THREE.Vector3(0, 1, 0);
/** Place a unit-height Y cylinder/box mesh so it spans a → b. */
export function span(mesh, a, b, frac = 1) {
  _a.copy(b).sub(a);
  const len = _a.length() * frac;
  mesh.visible = len > 1e-4;
  if (!mesh.visible) return;
  mesh.quaternion.setFromUnitVectors(UP, _a.normalize());
  mesh.position.copy(a).addScaledVector(_a, len / 2);
  mesh.scale.set(1, len, 1);
}

/** A glowing polyline beam that can be drawn progressively. */
export class Beam {
  constructor(points, color = COL.gold, radius = 0.03) {
    this.group = new THREE.Group();
    this.points = points.map((p) => p.clone());
    this.lengths = [];
    this.total = 0;
    const core = new THREE.MeshBasicMaterial({ color: 0xffffff, transparent: true, depthWrite: false });
    core.color.setScalar(1.8);   // HDR white: picked up by the bloom pass
    this.haloMat = new THREE.MeshBasicMaterial({
      color, transparent: true, opacity: 0.3, blending: THREE.AdditiveBlending, depthWrite: false,
    });
    const geo = new THREE.CylinderGeometry(1, 1, 1, 12, 1, true);
    this.segs = [];
    for (let i = 0; i < points.length - 1; i++) {
      const len = points[i].distanceTo(points[i + 1]);
      this.lengths.push(len);
      this.total += len;
      const c = new THREE.Mesh(geo, core), h = new THREE.Mesh(geo, this.haloMat);
      this.segs.push({ c, h });
      this.group.add(c, h);
    }
    this.r = radius;
    this.head = glow(color, radius * 14);
    this.group.add(this.head);
    this.headPos = new THREE.Vector3();
    this.setProgress(0);
  }
  /** Fraction (0-1) of the path at which vertex i sits. */
  fracAt(i) {
    let d = 0;
    for (let k = 0; k < i; k++) d += this.lengths[k];
    return d / this.total;
  }
  setProgress(p, from = 0) {
    let d0 = clamp01(from) * this.total, d1 = clamp01(p) * this.total, acc = 0;
    this.group.visible = d1 > d0 + 1e-5;
    for (let i = 0; i < this.segs.length; i++) {
      const L = this.lengths[i], a = this.points[i], b = this.points[i + 1];
      const s = clamp01((d0 - acc) / L), e = clamp01((d1 - acc) / L);
      const { c, h } = this.segs[i];
      if (e - s < 1e-5) { c.visible = h.visible = false; } else {
        _a.copy(a).lerp(b, s); _b.copy(a).lerp(b, e);
        const pa = _a.clone(), pb = _b.clone();
        span(c, pa, pb); span(h, pa, pb);
        c.scale.x = c.scale.z = this.r; h.scale.x = h.scale.z = this.r * 3.2;
        this.headPos.copy(pb);
      }
      acc += L;
    }
    this.head.position.copy(this.headPos);
  }
}

/** A text label anchored to a 3D point; main.js projects it to the screen each frame. */
export function label(text, x = 0, y = 0, z = 0, cls = '') {
  return { text, pos: new THREE.Vector3(x, y, z), o: 0, cls };
}

export function glassMat(opacity = 0.22, color = COL.glass) {
  return new THREE.MeshPhysicalMaterial({
    color, transparent: true, opacity, roughness: 0.05, metalness: 0, side: THREE.DoubleSide,
    depthWrite: false, clearcoat: 1, emissive: color, emissiveIntensity: 0.08,
  });
}

export function edges(geo, color = COL.cyan, opacity = 0.7) {
  return new THREE.LineSegments(new THREE.EdgesGeometry(geo, 20),
    new THREE.LineBasicMaterial({ color, transparent: true, opacity }));
}

/** Rounded rectangle slab (x × y, extruded in z, centred). */
export function roundedSlab(w, h, d, r) {
  const s = new THREE.Shape();
  const x = -w / 2, y = -h / 2;
  s.moveTo(x + r, y); s.lineTo(x + w - r, y); s.quadraticCurveTo(x + w, y, x + w, y + r);
  s.lineTo(x + w, y + h - r); s.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
  s.lineTo(x + r, y + h); s.quadraticCurveTo(x, y + h, x, y + h - r);
  s.lineTo(x, y + r); s.quadraticCurveTo(x, y, x + r, y);
  const g = new THREE.ExtrudeGeometry(s, { depth: d, bevelEnabled: true, bevelSize: d * 0.12, bevelThickness: d * 0.12, bevelSegments: 3 });
  g.translate(0, 0, -d / 2);
  return g;
}

/** Rounded rectangle plane with 0-1 UVs. */
export function roundedPlane(w, h, r) {
  const s = new THREE.Shape(), x = -w / 2, y = -h / 2;
  s.moveTo(x + r, y); s.lineTo(x + w - r, y); s.quadraticCurveTo(x + w, y, x + w, y + r);
  s.lineTo(x + w, y + h - r); s.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
  s.lineTo(x + r, y + h); s.quadraticCurveTo(x, y + h, x, y + h - r);
  s.lineTo(x, y + r); s.quadraticCurveTo(x, y, x + r, y);
  const g = new THREE.ShapeGeometry(s, 8), p = g.attributes.position, uv = g.attributes.uv;
  for (let i = 0; i < p.count; i++) uv.setXY(i, p.getX(i) / w + 0.5, p.getY(i) / h + 0.5);
  return g;
}

/** Set opacity on every material under an object; materials go back to opaque once fully faded in. */
export function setOpacity(obj, o) {
  obj.visible = o > 0.003;
  obj.traverse((m) => {
    if (!m.material) return;
    const mats = Array.isArray(m.material) ? m.material : [m.material];
    for (const mat of mats) {
      if (mat.userData.baseOpacity === undefined) { mat.userData.baseOpacity = mat.opacity; mat.userData.baseTransparent = mat.transparent; }
      mat.transparent = mat.userData.baseTransparent || o < 0.999;
      mat.opacity = mat.userData.baseOpacity * o;
    }
  });
}

// ---------- physically based materials and detailed geometry ----------

/** Optical glass: transmissive, ior 1.52, with a thin-film (anti-reflective coating) sheen. */
export function physGlass(o = {}) {
  return new THREE.MeshPhysicalMaterial({
    color: o.color ?? 0xffffff, transmission: o.transmission ?? 1, ior: o.ior ?? 1.52, thickness: o.thickness ?? 0.08,
    roughness: o.roughness ?? 0.03, metalness: 0, specularIntensity: 1, envMapIntensity: o.env ?? 1.8,
    iridescence: o.iridescence ?? 0.4, iridescenceIOR: 1.38, iridescenceThicknessRange: [120, 420],
    attenuationColor: new THREE.Color(o.tint ?? 0xcfeaff), attenuationDistance: o.attDist ?? 5,
    emissive: o.emissive ?? 0x000000, emissiveIntensity: o.emissiveIntensity ?? 0,
    side: o.side ?? THREE.DoubleSide, depthWrite: false, transparent: true, opacity: o.opacity ?? 1,
  });
}

/**
 * Lens element as a solid of revolution about Y. r = semi-diameter, tc = centre thickness,
 * s1 / s2 = sag of the top / bottom surface at the rim (positive = that surface bulges outward).
 * Biconvex: s1 > 0, s2 > 0. Meniscus: opposite signs. Biconcave: both negative.
 */
export function lensGeo(r, tc, s1, s2, seg = 56) {
  const pts = [], n = 14;
  for (let i = 0; i <= n; i++) { const h = (i / n) * r; pts.push(new THREE.Vector2(h, tc / 2 - s1 * (h / r) ** 2)); }
  pts.push(new THREE.Vector2(r * 1.04, tc / 2 - s1), new THREE.Vector2(r * 1.04, -tc / 2 + s2));
  for (let i = n; i >= 0; i--) { const h = (i / n) * r; pts.push(new THREE.Vector2(h, -tc / 2 + s2 * (h / r) ** 2)); }
  const g = new THREE.LatheGeometry(pts, seg);
  g.computeVertexNormals();
  return g;
}

/** Ring / tube of revolution about Y from a closed [radius, y] profile; optional cut-away. */
export function latheRing(profile, seg = 96, phiStart = 0, phiLen = Math.PI * 2) {
  const pts = profile.map(([r, y]) => new THREE.Vector2(r, y));
  pts.push(pts[0].clone());
  const g = new THREE.LatheGeometry(pts, seg, phiStart, phiLen);
  g.computeVertexNormals();
  return g;
}

/** Ribbed (knurled rubber) ring about Y: ridges run along the axis. */
export function ribbedRing(r, len, ribs = 90, depth = 0.012, phiStart = 0, phiLen = Math.PI * 2) {
  const seg = Math.max(8, Math.round(ribs * 4 * phiLen / (Math.PI * 2)));
  const g = new THREE.CylinderGeometry(r, r, len, seg, 1, true, phiStart, phiLen);
  const p = g.attributes.position;
  for (let i = 0; i < p.count; i++) {
    const x = p.getX(i), z = p.getZ(i), a = Math.atan2(x, z);
    const k = 1 + (depth / r) * (Math.cos(a * ribs) > 0.1 ? 1 : 0);
    p.setX(i, x * k); p.setZ(i, z * k);
  }
  g.computeVertexNormals();
  return g;
}

let _brushed;
/** Fine directional streaks, for roughness + bump on machined metal. */
export function brushedTexture() {
  if (_brushed) return _brushed;
  const c = document.createElement('canvas'); c.width = c.height = 512;
  const g = c.getContext('2d');
  g.fillStyle = '#808080'; g.fillRect(0, 0, 512, 512);
  for (let i = 0; i < 5200; i++) {
    const y = hash(i, 1) * 512, x = hash(i, 2) * 512, len = 40 + hash(i, 3) * 360, v = hash(i, 4) > 0.5 ? 255 : 0;
    g.fillStyle = `rgba(${v},${v},${v},${0.03 + hash(i, 5) * 0.09})`;
    g.fillRect(x, y, len, 1); g.fillRect(x - 512, y, len, 1);
  }
  _brushed = new THREE.CanvasTexture(c);
  _brushed.wrapS = _brushed.wrapT = THREE.RepeatWrapping; _brushed.anisotropy = 8;
  return _brushed;
}

/** Brushed titanium / aluminium. */
export function brushedMetal(color = 0x8d8f94, o = {}) {
  const t = brushedTexture();
  return new THREE.MeshPhysicalMaterial({
    color, metalness: 1, roughness: o.roughness ?? 0.42, roughnessMap: t, bumpMap: t, bumpScale: o.bump ?? 0.6,
    envMapIntensity: o.env ?? 1.0, clearcoat: o.clearcoat ?? 0, side: o.side ?? THREE.FrontSide,
  });
}

export function copperMat() {
  return new THREE.MeshPhysicalMaterial({ color: 0xd07a3a, metalness: 1, roughness: 0.32, clearcoat: 0.7, clearcoatRoughness: 0.25,
    envMapIntensity: 1.6, emissive: 0xff7a20, emissiveIntensity: 0 });
}

/** A flat wound coil (racetrack spiral of enamelled wire), lying in XY, stacked in Z. */
export function woundCoil(w, h, mat, o = {}) {
  const turns = o.turns ?? 7, pitch = o.pitch ?? 0.026, wire = o.wire ?? 0.024, layers = o.layers ?? 3, e = o.square ?? 0.35;
  const pts = [], S = 48;
  for (let s = 0; s <= turns * S; s++) {
    const th = (s / S) * Math.PI * 2, ins = pitch * s / S, a = w / 2 - ins, b = h / 2 - ins, c = Math.cos(th), d = Math.sin(th);
    pts.push(new THREE.Vector3(a * Math.sign(c) * Math.abs(c) ** e, b * Math.sign(d) * Math.abs(d) ** e, 0));
  }
  const geo = new THREE.TubeGeometry(new THREE.CatmullRomCurve3(pts), turns * S, wire / 2, 5, false);
  const grp = new THREE.Group();
  for (let l = 0; l < layers; l++) { const m = new THREE.Mesh(geo, mat); m.position.z = (l - (layers - 1) / 2) * wire * 0.92; grp.add(m); }
  return grp;
}

/** Unit-length (along Y, centred) serpentine flexure ribbon; stretch with span(). */
export function flexureGeo(bends = 5, amp = 0.09, thick = 0.014, tall = 0.1) {
  const pts = [new THREE.Vector3(0, -0.5, 0), new THREE.Vector3(0, -0.44, 0)];
  for (let i = 0; i < bends; i++) pts.push(new THREE.Vector3((i % 2 ? -1 : 1) * amp, -0.36 + (0.72 * (i + 0.5)) / bends, 0));
  pts.push(new THREE.Vector3(0, 0.44, 0), new THREE.Vector3(0, 0.5, 0));
  const g = new THREE.TubeGeometry(new THREE.CatmullRomCurve3(pts, false, 'catmullrom', 0.25), 90, thick, 6, false);
  g.scale(1, 1, tall / (2 * thick));
  g.computeVertexNormals();
  return g;
}

/** Canvas texture helper. draw(ctx, size). */
export function canvasTex(size, draw, srgb = true) {
  const c = document.createElement('canvas'); c.width = c.height = size;
  draw(c.getContext('2d'), size);
  const t = new THREE.CanvasTexture(c);
  if (srgb) t.colorSpace = THREE.SRGBColorSpace;
  t.wrapS = t.wrapT = THREE.RepeatWrapping; t.anisotropy = 8;
  return t;
}

/** Green PCB with gold traces and pads. */
export function pcbTexture(seed = 1) {
  return canvasTex(512, (g, S) => {
    g.fillStyle = '#0d3a22'; g.fillRect(0, 0, S, S);
    g.strokeStyle = '#1c6a3c'; g.lineWidth = 3;
    for (let i = 0; i < 46; i++) {
      let x = hash(i, seed) * S, y = hash(i, seed + 1) * S;
      g.beginPath(); g.moveTo(x, y);
      for (let k = 0; k < 4; k++) { const d = 20 + hash(i, k + seed + 2) * 90; if (k % 2) y += (hash(i, k + 9) > 0.5 ? d : -d); else x += (hash(k, i + 5) > 0.5 ? d : -d); g.lineTo(x, y); }
      g.stroke();
    }
    g.strokeStyle = '#c9a24a'; g.lineWidth = 2;
    for (let i = 0; i < 26; i++) {
      let x = hash(i, seed + 20) * S, y = hash(i, seed + 21) * S;
      g.beginPath(); g.moveTo(x, y);
      for (let k = 0; k < 3; k++) { const d = 30 + hash(i, k + seed + 30) * 110; if (k % 2) x += d; else y += (hash(i, k) > 0.5 ? d : -d); g.lineTo(x, y); }
      g.stroke();
      g.fillStyle = '#e2c15e'; g.beginPath(); g.arc(x, y, 5, 0, 7); g.fill();
      g.fillStyle = '#0d3a22'; g.beginPath(); g.arc(x, y, 2, 0, 7); g.fill();
    }
  });
}
