// Motion-graphics effects: the glass "x-ray" look, heat bloom on the vapor chamber, vapour and liquid.
import * as THREE from 'three';
import { fader, glowTexture, smokeTexture } from './kit.js';

/**
 * Glass look for an assembly: every mesh gets a twin drawn with a fresnel shader (bright edges, clear faces).
 * Returns { solid(k), glass(k), sweep(pos, k) }: cross-fade between the real materials and the glass twin,
 * and run a band of light through the glass along the phone's length.
 */
export function glassify(obj, color = 0xd6e2f4) {
  const solid = fader(obj);
  const mat = new THREE.ShaderMaterial({
    uniforms: { uColor: { value: new THREE.Color(color) }, uK: { value: 0 }, uSweep: { value: -999 }, uSweepK: { value: 0 }, uWidth: { value: 14 } },
    vertexShader: `varying vec3 vN; varying vec3 vV; varying vec3 vP;
      void main() { vec4 mv = modelViewMatrix * vec4(position, 1.0); vN = normalize(normalMatrix * normal); vV = normalize(-mv.xyz); vP = position; gl_Position = projectionMatrix * mv; }`,
    fragmentShader: `uniform vec3 uColor; uniform float uK, uSweep, uSweepK, uWidth; varying vec3 vN; varying vec3 vV; varying vec3 vP;
      void main() {
        float f = pow(1.0 - abs(dot(normalize(vN), normalize(vV))), 2.4);
        float band = exp(-pow((vP.y - uSweep) / uWidth, 2.0)) * uSweepK;
        float a = (0.008 + 0.66 * f) * uK + band * (0.05 + 1.3 * f);
        gl_FragColor = vec4(uColor * a, 1.0);
      }`,
    transparent: true, blending: THREE.AdditiveBlending, depthWrite: false, side: THREE.DoubleSide,
  });
  const twins = [];
  obj.traverse((o) => { if (o.isMesh && o.geometry.attributes.normal && !o.material.map) twins.push(o); });
  for (const o of twins) {
    const t = new THREE.Mesh(o.geometry, mat);
    t.position.copy(o.position); t.rotation.copy(o.rotation); t.scale.copy(o.scale); t.renderOrder = 5; t.name = '';
    t.userData.twin = true; o.parent.add(t);
  }
  const setTwins = (v) => { obj.traverse((o) => { if (o.userData.twin) o.visible = v; }); };
  setTwins(false);
  return {
    solid: (k) => { solid(k); obj.visible = true; obj.traverse((o) => { if ((o.isMesh || o.isSprite) && !o.userData.twin) o.visible = k > 0.003; }); },
    glass: (k) => { mat.uniforms.uK.value = k; setTwins(k > 0.002 || mat.uniforms.uSweepK.value > 0.002); },
    sweep: (pos, k) => { mat.uniforms.uSweep.value = pos; mat.uniforms.uSweepK.value = k; },
    mat,
  };
}

/** Thermal picture over a flat part: heat spreads from `hot` (x, y) as `spread` goes 0 → 1. */
export function heatMap(shape, z, hot) {
  const mat = new THREE.ShaderMaterial({
    uniforms: { uK: { value: 0 }, uSpread: { value: 0 }, uHot: { value: new THREE.Vector2(...hot) }, uT: { value: 0 } },
    vertexShader: 'varying vec2 vP; void main() { vP = position.xy; gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0); }',
    fragmentShader: `uniform float uK, uSpread, uT; uniform vec2 uHot; varying vec2 vP;
      void main() {
        float d = distance(vP, uHot) / 95.0;
        float h = clamp(1.0 - d / max(uSpread, 0.001), 0.0, 1.0);
        h = pow(h, 1.35) * (0.94 + 0.06 * sin(uT * 2.2 + d * 20.0));
        vec3 cool = vec3(0.05, 0.42, 0.5), warm = vec3(1.0, 0.36, 0.2), hot = vec3(1.0, 0.72, 0.5), white = vec3(1.0, 0.97, 0.92);
        vec3 c = mix(cool, warm, smoothstep(0.0, 0.3, h)); c = mix(c, hot, smoothstep(0.3, 0.7, h)); c = mix(c, white, smoothstep(0.75, 1.0, h));
        float a = uK * (0.5 + 0.45 * smoothstep(0.0, 0.25, h));
        gl_FragColor = vec4(c * a * (1.05 + 1.25 * h), a);
      }`,
    transparent: true, depthWrite: false, blending: THREE.CustomBlending, blendSrc: THREE.OneFactor, blendDst: THREE.OneMinusSrcAlphaFactor,
    polygonOffset: true, polygonOffsetFactor: -4,
  });
  const m = new THREE.Mesh(new THREE.ShapeGeometry(shape, 24), mat);
  m.position.z = z; m.renderOrder = 4; m.visible = false; m.name = '';
  return { mesh: m, set: (k, spread, t) => { m.visible = k > 0.002; mat.uniforms.uK.value = k; mat.uniforms.uSpread.value = spread; mat.uniforms.uT.value = t; } };
}

const hash = (i, s) => { const x = Math.sin(i * 127.1 + s * 311.7) * 43758.5453; return x - Math.floor(x); };

/**
 * Particles that drift from `from` outward (or inward with reverse): vapour wisps or liquid beads.
 * Every position is a function of time, so frames can be rendered in any order.
 */
export function drift({ n = 40, from, reach = 30, lift = 0, size = 10, color = 0xffffff, opacity = 0.5, rate = 0.22, reverse = false, smoke = true, arc = [0, Math.PI * 2], grow = 1.6 }) {
  const g = new THREE.Group(); g.name = '';
  const maps = smoke ? [smokeTexture(3), smokeTexture(11), smokeTexture(23)] : [glowTexture()];
  const ps = [];
  for (let i = 0; i < n; i++) {
    const s = new THREE.Sprite(new THREE.SpriteMaterial({ map: maps[i % maps.length], color, transparent: true, depthWrite: false, opacity: 0, blending: THREE.AdditiveBlending, rotation: hash(i, 5) * 6.28 }));
    s.renderOrder = 6; g.add(s);
    ps.push({ s, a: arc[0] + hash(i, 1) * (arc[1] - arc[0]), ph: hash(i, 2), sp: 0.7 + hash(i, 3) * 0.6, sz: size * (0.6 + hash(i, 4) * 0.8), rot: (hash(i, 6) - 0.5) * 0.6 });
  }
  g.visible = false;
  return {
    group: g,
    set(k, t) {
      g.visible = k > 0.002;
      if (!g.visible) return;
      for (const p of ps) {
        let u = (t * rate * p.sp + p.ph) % 1; if (u < 0) u += 1;
        const e = reverse ? 1 - u : u, d = reverse ? 7 + (reach - 7) * e : reach * Math.sqrt(e);
        p.s.position.set(from[0] + Math.cos(p.a) * d, from[1] + Math.sin(p.a) * d, from[2] + lift * e * e);
        const sc = p.sz * (smoke ? 0.5 + grow * e : 1);
        p.s.scale.set(sc, sc, 1);
        p.s.material.opacity = k * opacity * Math.sin(Math.PI * u) ** (smoke ? 0.8 : 0.5);
        if (smoke) p.s.material.rotation += 0;   // rotation is fixed per particle; drift gives the motion
      }
    },
  };
}

/** Soft glow sprite (heat source, energised parts). */
export function glowSprite(color, size) {
  const s = new THREE.Sprite(new THREE.SpriteMaterial({ map: glowTexture(), color, transparent: true, depthWrite: false, depthTest: false, blending: THREE.AdditiveBlending, opacity: 0 }));
  s.scale.set(size, size, 1); s.renderOrder = 7; s.visible = false; s.name = '';
  return { sprite: s, set: (k) => { s.visible = k > 0.002; s.material.opacity = k; } };
}
