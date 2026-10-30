// Utilitários 3D: materiais compartilhados, texturas de texto e peças básicas (ventoinha, parafuso).
import * as THREE from '../vendor/three.module.min.js';
import { RoundedBoxGeometry } from '../vendor/RoundedBoxGeometry.js';

export { THREE };

const matCache = new Map();
export const rgbMaterials = new Set();

export function mat(key, make) {
  if (!matCache.has(key)) matCache.set(key, make());
  return matCache.get(key);
}

export const M = {
  paint: (color, rough = 0.55) => mat(`paint:${color}:${rough}`, () => new THREE.MeshStandardMaterial({ color, roughness: rough, metalness: 0.25 })),
  metal: (color = '#b8bcc2', rough = 0.35) => mat(`metal:${color}:${rough}`, () => new THREE.MeshStandardMaterial({ color, roughness: rough, metalness: 0.9 })),
  plastic: (color = '#151515', rough = 0.6) => mat(`plastic:${color}:${rough}`, () => new THREE.MeshStandardMaterial({ color, roughness: rough, metalness: 0.05 })),
  gold: () => mat('gold', () => new THREE.MeshStandardMaterial({ color: '#d4a74a', roughness: 0.28, metalness: 1 })),
  copper: () => mat('copper', () => new THREE.MeshStandardMaterial({ color: '#c47a45', roughness: 0.3, metalness: 1 })),
  glass: () => mat('glass', () => new THREE.MeshStandardMaterial({
    color: '#bcd3e0', roughness: 0.04, metalness: 0.1, transparent: true, opacity: 0.16, depthWrite: false, side: THREE.DoubleSide,
  })),
  screw: () => mat('screw', () => new THREE.MeshStandardMaterial({ color: '#8f959c', roughness: 0.35, metalness: 0.95 })),
  ghost: () => mat('ghost', () => new THREE.MeshStandardMaterial({
    color: '#36e39a', emissive: '#1aa86b', emissiveIntensity: 0.6, transparent: true, opacity: 0.28, depthWrite: false,
  })),
  ghostHot: () => mat('ghostHot', () => new THREE.MeshStandardMaterial({
    color: '#ffd23a', emissive: '#e0a400', emissiveIntensity: 0.9, transparent: true, opacity: 0.45, depthWrite: false,
  })),
  hotspot: () => mat('hotspot', () => new THREE.MeshBasicMaterial({ color: '#ffd23a', transparent: true, opacity: 0.9, depthTest: false })),
  invisible: () => mat('invisible', () => new THREE.MeshBasicMaterial({ visible: false })),
  led: (color) => mat(`led:${color}`, () => new THREE.MeshStandardMaterial({ color: '#111', emissive: color, emissiveIntensity: 0 })),
};

// Material RGB: começa apagado, acende e muda de cor quando o PC liga.
export function rgbMat(base = '#7c5cff') {
  const m = new THREE.MeshStandardMaterial({ color: '#202020', emissive: new THREE.Color(base), emissiveIntensity: 0.0, roughness: 0.4 });
  m.userData.base = new THREE.Color(base);
  rgbMaterials.add(m);
  return m;
}

export function box(w, h, d, material, x = 0, y = 0, z = 0) {
  const m = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), material);
  m.position.set(x, y, z);
  return m;
}

export function rbox(w, h, d, r, material, x = 0, y = 0, z = 0) {
  const m = new THREE.Mesh(new RoundedBoxGeometry(w, h, d, 2, Math.min(r, w / 2, h / 2, d / 2)), material);
  m.position.set(x, y, z);
  return m;
}

export function cyl(r, h, material, segs = 24, axis = 'y') {
  const m = new THREE.Mesh(new THREE.CylinderGeometry(r, r, h, segs), material);
  if (axis === 'z') m.rotation.x = Math.PI / 2;
  if (axis === 'x') m.rotation.z = Math.PI / 2;
  return m;
}

/* ---------------- Texturas desenhadas em canvas ---------------- */

const texCache = new Map();
export function canvasTexture(key, w, h, draw) {
  if (texCache.has(key)) return texCache.get(key);
  const c = document.createElement('canvas');
  c.width = w; c.height = h;
  const g = c.getContext('2d');
  draw(g, w, h);
  const t = new THREE.CanvasTexture(c);
  t.colorSpace = THREE.SRGBColorSpace;
  t.anisotropy = 4;
  texCache.set(key, t);
  return t;
}

export function labelTexture(key, { w = 512, h = 256, bg = '#111', fg = '#fff', lines = [], border = null, align = 'center' }) {
  return canvasTexture('label:' + key, w, h, (g) => {
    g.fillStyle = bg; g.fillRect(0, 0, w, h);
    if (border) { g.strokeStyle = border; g.lineWidth = 8; g.strokeRect(6, 6, w - 12, h - 12); }
    g.textAlign = align; g.textBaseline = 'middle';
    const x = align === 'center' ? w / 2 : 30;
    lines.forEach((ln) => {
      g.fillStyle = ln.color || fg;
      g.font = `${ln.weight || 700} ${ln.size || 40}px ${ln.font || 'Arial, Helvetica, sans-serif'}`;
      g.fillText(ln.text, x, ln.y * h);
    });
  });
}

// Plano com textura, útil para etiquetas coladas em faces.
export function decal(w, h, texture, opts = {}) {
  const m = new THREE.Mesh(new THREE.PlaneGeometry(w, h), new THREE.MeshStandardMaterial({
    map: texture, roughness: opts.rough ?? 0.6, metalness: opts.metal ?? 0.1, transparent: !!opts.transparent,
  }));
  return m;
}

export function meshTexture(key, color, hole = '#000') {
  return canvasTexture('mesh:' + key, 256, 256, (g, w, h) => {
    g.fillStyle = color; g.fillRect(0, 0, w, h);
    g.fillStyle = hole;
    const s = 16;
    for (let y = 0; y < h + s; y += s * 0.87) {
      const off = (Math.round(y / (s * 0.87)) % 2) * s / 2;
      for (let x = 0; x < w + s; x += s) {
        g.beginPath();
        for (let k = 0; k < 6; k++) {
          const a = Math.PI / 3 * k + Math.PI / 6;
          const px = x + off + Math.cos(a) * 5.6, py = y + Math.sin(a) * 5.6;
          k ? g.lineTo(px, py) : g.moveTo(px, py);
        }
        g.closePath(); g.fill();
      }
    }
  });
}

export function finTexture(key, base, dark) {
  const t = canvasTexture('fin:' + key, 64, 256, (g, w, h) => {
    g.fillStyle = base; g.fillRect(0, 0, w, h);
    g.fillStyle = dark;
    for (let y = 0; y < h; y += 8) g.fillRect(0, y, w, 3);
  });
  t.wrapS = t.wrapT = THREE.RepeatWrapping;
  return t;
}

/* ---------------- Ventoinha ---------------- */

const fanGeoCache = new Map();
function frameGeometry(size, thick) {
  const key = size + ':' + thick;
  if (fanGeoCache.has(key)) return fanGeoCache.get(key);
  const s = size / 2, r = 0.9;
  const shape = new THREE.Shape();
  shape.moveTo(-s + r, -s);
  shape.lineTo(s - r, -s); shape.quadraticCurveTo(s, -s, s, -s + r);
  shape.lineTo(s, s - r); shape.quadraticCurveTo(s, s, s - r, s);
  shape.lineTo(-s + r, s); shape.quadraticCurveTo(-s, s, -s, s - r);
  shape.lineTo(-s, -s + r); shape.quadraticCurveTo(-s, -s, -s + r, -s);
  const hole = new THREE.Path();
  hole.absarc(0, 0, s * 0.94, 0, Math.PI * 2, true);
  shape.holes.push(hole);
  for (const [hx, hy] of [[1, 1], [1, -1], [-1, 1], [-1, -1]]) {
    const p = new THREE.Path();
    p.absarc(hx * s * 0.875, hy * s * 0.875, 0.22, 0, Math.PI * 2, true);
    shape.holes.push(p);
  }
  const g = new THREE.ExtrudeGeometry(shape, { depth: thick, bevelEnabled: false, curveSegments: 28 });
  g.translate(0, 0, -thick / 2);
  fanGeoCache.set(key, g);
  return g;
}

function bladeGeometry(r) {
  const key = 'blade:' + r;
  if (fanGeoCache.has(key)) return fanGeoCache.get(key);
  const sh = new THREE.Shape();
  sh.moveTo(0, -r * 0.12);
  sh.quadraticCurveTo(r * 0.55, -r * 0.32, r * 0.98, -r * 0.18);
  sh.quadraticCurveTo(r * 1.0, r * 0.1, r * 0.9, r * 0.22);
  sh.quadraticCurveTo(r * 0.5, r * 0.12, 0, r * 0.14);
  const g = new THREE.ExtrudeGeometry(sh, { depth: 0.12, bevelEnabled: false, curveSegments: 8 });
  fanGeoCache.set(key, g);
  return g;
}

// Ventoinha com eixo em Z local. userData.rotor gira quando o PC liga.
export function makeFan({ size = 12, thick = 2.5, frameColor = '#161616', bladeColor = '#1e1e1e', rgb = null, frame = true, blades = 7 } = {}) {
  const g = new THREE.Group();
  const r = size / 2 * 0.9;
  if (frame) {
    const f = new THREE.Mesh(frameGeometry(size, thick), M.plastic(frameColor, 0.55));
    g.add(f);
    // braços de sustentação do motor
    const strutM = M.plastic(frameColor, 0.6);
    for (let i = 0; i < 4; i++) {
      const s = box(size * 0.47, 0.35, 0.3, strutM);
      s.position.set(Math.cos(i * Math.PI / 2 + Math.PI / 4) * size * 0.235, Math.sin(i * Math.PI / 2 + Math.PI / 4) * size * 0.235, -thick / 2 + 0.2);
      s.rotation.z = i * Math.PI / 2 + Math.PI / 4;
      g.add(s);
    }
  }
  const rotor = new THREE.Group();
  const hubR = r * 0.32;
  const hub = cyl(hubR, thick * 0.7, M.plastic(bladeColor, 0.5), 28, 'z');
  rotor.add(hub);
  const bladeM = M.plastic(bladeColor, 0.45);
  const bg = bladeGeometry(r);
  for (let i = 0; i < blades; i++) {
    const holder = new THREE.Group();
    holder.rotation.z = (i / blades) * Math.PI * 2;
    const bl = new THREE.Mesh(bg, bladeM);
    bl.rotation.x = 0.42;
    bl.position.z = -0.1;
    holder.add(bl);
    rotor.add(holder);
  }
  const cap = cyl(hubR * 0.98, 0.1, M.plastic('#2a2a2a', 0.3), 28, 'z');
  cap.position.z = thick * 0.36;
  rotor.add(cap);
  if (rgb) {
    const ring = new THREE.Mesh(new THREE.TorusGeometry(size / 2 * 0.93, 0.12, 6, 48), rgbMat(rgb));
    ring.position.z = thick / 2 - 0.15;
    g.add(ring);
    const hubRing = new THREE.Mesh(new THREE.TorusGeometry(hubR * 0.85, 0.1, 6, 28), rgbMat(rgb));
    hubRing.position.z = thick * 0.37;
    rotor.add(hubRing);
  }
  g.add(rotor);
  g.userData.rotors = [rotor];
  return g;
}

/* ---------------- Parafuso ---------------- */

let screwGeo = null;
export function makeScrew() {
  if (!screwGeo) {
    const head = new THREE.CylinderGeometry(0.34, 0.34, 0.18, 16);
    head.translate(0, 0.09, 0);
    const shaft = new THREE.CylinderGeometry(0.15, 0.15, 0.7, 10);
    shaft.translate(0, -0.35, 0);
    screwGeo = { head, shaft };
  }
  const g = new THREE.Group();
  g.add(new THREE.Mesh(screwGeo.head, M.screw()));
  const sh = new THREE.Mesh(screwGeo.shaft, M.screw());
  g.add(sh);
  // fenda Phillips
  const slotM = M.plastic('#3a3d41', 0.6);
  const s1 = box(0.42, 0.05, 0.07, slotM, 0, 0.185, 0);
  const s2 = box(0.07, 0.05, 0.42, slotM, 0, 0.185, 0);
  g.add(s1, s2);
  return g;
}

// Orienta um objeto para que o eixo +Y local aponte na direção "dir".
export function alignYTo(obj, dir) {
  const q = new THREE.Quaternion().setFromUnitVectors(new THREE.Vector3(0, 1, 0), dir.clone().normalize());
  obj.quaternion.copy(q);
}

export function setGhost(obj, material) {
  obj.traverse(o => {
    if (o.isMesh) {
      o.material = material;
      o.castShadow = false;
    }
  });
}

export function disposeTree(obj) {
  obj.traverse(o => {
    if (o.isMesh && o.geometry && !o.geometry.userData?.shared) {
      // geometrias cacheadas são reaproveitadas; só descartamos as exclusivas
      if (!Array.from(fanGeoCache.values()).includes(o.geometry) && o.geometry !== screwGeo?.head && o.geometry !== screwGeo?.shaft) o.geometry.dispose();
    }
  });
}
