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
  scene.add(new THREE.HemisphereLight(0xcfe2ff, 0x2a3040, 2.0));
  const fillL = new THREE.DirectionalLight(0xffffff, 1.2);
  fillL.position.set(-3, 2, 8);
  scene.add(fillL);
  const key = new THREE.DirectionalLight(0xffffff, 3.0);
  key.position.set(4, 8, 6);
  scene.add(key);
  const rim = new THREE.DirectionalLight(0x4fe3ff, 1.1);
  rim.position.set(-6, 3, -5);
  scene.add(rim);
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
    const core = new THREE.MeshBasicMaterial({ color: 0xffffff });
    this.haloMat = new THREE.MeshBasicMaterial({
      color, transparent: true, opacity: 0.45, blending: THREE.AdditiveBlending, depthWrite: false,
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

/** Set opacity on every material under an object (materials must be transparent-capable). */
export function setOpacity(obj, o) {
  obj.visible = o > 0.003;
  obj.traverse((m) => {
    if (!m.material) return;
    const mats = Array.isArray(m.material) ? m.material : [m.material];
    for (const mat of mats) {
      if (mat.userData.baseOpacity === undefined) mat.userData.baseOpacity = mat.opacity;
      mat.transparent = true;
      mat.opacity = mat.userData.baseOpacity * o;
    }
  });
}
