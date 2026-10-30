// Modelos 3D procedurais de cada peça, em escala real (centímetros).
import {
  THREE, M, box, rbox, cyl, canvasTexture, labelTexture, decal, meshTexture, finTexture, makeFan, rgbMat,
} from './three-util.js';
import { BOARDS, rowV, rowY, gpuHeight, gpuThick, radiatorMount } from './layout.js';

export const LEDGE_Z = 11.6;
export const GPU_BRACKET_X = -5.35;

function place(obj, pos) {
  obj.position.copy(pos);
  return obj;
}

function seeded(seed) {
  let s = 0;
  for (const ch of String(seed)) s = (s * 31 + ch.charCodeAt(0)) >>> 0;
  return () => ((s = (s * 1664525 + 1013904223) >>> 0) / 4294967296);
}

/* ============================== GABINETE ============================== */

export function buildCase(part, F) {
  const s = part.specs, L = part.look;
  const { d, h, w, t } = F;
  const g = new THREE.Group();
  g.userData = { slotCovers: new Map(), leds: [] };
  const paint = M.paint(L.color, 0.5);
  const inner = M.paint(L.inner || L.color, 0.62);
  const dark = M.plastic('#0f1012', 0.7);

  // base, tampa lateral direita, bandeja da placa-mãe
  g.add(box(d, t, w, paint, 0, t / 2, 0));
  g.add(box(d, h, t, paint, 0, h / 2, -w / 2 + t / 2));
  g.add(box(d - 2 * t, h - 2 * t, 0.25, inner, 0, h / 2, F.trayZ - 0.125));

  // topo
  const topM = s.style === 'classic' ? paint : M.paint(L.color, 0.5);
  g.add(box(d, t, w, topM, 0, h - t / 2, 0));
  if (s.fanSlots.top && s.style !== 'classic') {
    const tex = meshTexture(`top-${part.id}`, L.color, '#050505').clone();
    tex.wrapS = tex.wrapT = THREE.RepeatWrapping;
    tex.repeat.set(4, 1.4);
    tex.needsUpdate = true;
    const vent = new THREE.Mesh(new THREE.PlaneGeometry(d * 0.78, w * 0.62), new THREE.MeshStandardMaterial({ map: tex, roughness: 0.7 }));
    vent.rotation.x = -Math.PI / 2;
    vent.position.set(-d * 0.05, h + 0.01, w * 0.08);
    g.add(vent);
  }

  // passa-cabos de borracha
  const boardRight = F.boardX0 + (s.forms.includes('ATX') || s.forms.includes('mATX') ? 24.4 : 17);
  for (let i = 0; i < 3; i++) {
    const gy = F.boardY0 - 4 - i * 8.5;
    if (gy < F.shroudTop + 3) break;
    g.add(rbox(1.3, 5.5, 0.3, 0.4, dark, boardRight + 1.7, gy, F.trayZ + 0.05));
  }
  g.add(rbox(6, 1.3, 0.3, 0.4, dark, F.boardX0 + 4, F.boardY0 + 1.7, F.trayZ + 0.05));

  // traseira com recortes (painel I/O, slots de expansão, ventoinha, fonte)
  g.add(buildRearPanel(part, F, paint));

  // tampas dos slots de expansão (somem quando a placa de vídeo é instalada)
  const coverM = M.metal(L.color === '#eef0f2' ? '#e9ebee' : '#3a3d42', 0.45);
  for (const r of F.openings) {
    const cover = box(0.12, 1.55, 10.0, coverM, -d / 2 + t + 0.07, rowY(F, r) - 0.85, F.pcbZ + 0.4 + 5.0);
    g.add(cover);
    g.userData.slotCovers.set(r, cover);
  }
  const rows = F.openings;
  const ledgeTop = rowY(F, rows[0]) + 0.6, ledgeBot = rowY(F, rows[rows.length - 1]) - 2.0;
  g.add(box(1.0, ledgeTop - ledgeBot, 0.5, paint, -d / 2 + t + 0.5, (ledgeTop + ledgeBot) / 2, F.pcbZ + LEDGE_Z - 0.25));

  // frente
  g.add(buildFront(part, F, paint));

  // botão liga/desliga e LED
  const led = M.led('#4fd1ff');
  g.userData.leds.push(led);
  if (s.style === 'classic') {
    const btn = cyl(1.0, 0.5, M.plastic('#cfc7b2', 0.5), 24, 'x');
    btn.position.set(d / 2 + 0.7, h - 13, 0);
    g.add(btn);
    const l = box(0.2, 0.4, 0.8, led, d / 2 + 0.55, h - 15.2, 0);
    g.add(l);
    g.userData.powerButton = btn;
  } else {
    const btn = cyl(0.75, 0.3, M.plastic('#202225', 0.4), 24);
    btn.position.set(d / 2 - 3.2, h + 0.15, w / 2 - 4.5);
    g.add(btn);
    const ring = new THREE.Mesh(new THREE.TorusGeometry(0.8, 0.09, 6, 28), led);
    ring.rotation.x = Math.PI / 2;
    ring.position.set(d / 2 - 3.2, h + 0.22, w / 2 - 4.5);
    g.add(ring);
    g.userData.powerButton = btn;
    for (let i = 0; i < 2; i++) g.add(box(1.4, 0.15, 0.55, dark, d / 2 - 7 - i * 2.2, h + 0.05, w / 2 - 4.5));
  }

  // capa da fonte (PSU shroud) com logo
  if (!F.top) {
    const x0 = F.inner.x0, x1 = F.inner.x1 - 3;
    const zw = F.inner.z1 - F.trayZ;
    g.add(box(x1 - x0, 0.4, zw, paint, (x0 + x1) / 2, F.shroudTop - 0.2, (F.trayZ + F.inner.z1) / 2));
    const lip = box(x1 - x0, 2.0, 0.3, paint, (x0 + x1) / 2, F.shroudTop - 1.2, F.inner.z1 - 0.15);
    g.add(lip);
    const logo = decal(10, 1.4, labelTexture('shroud-logo-' + (L.color === '#eef0f2' ? 'w' : 'k'), {
      w: 512, h: 72, bg: L.color, lines: [{ text: 'SEU PC WEB', y: 0.52, size: 44, weight: 800, color: L.color === '#eef0f2' ? '#2a2d31' : '#e8ece9', font: 'Arial Black, Arial, sans-serif' }],
    }));
    logo.position.set(x0 + 9, F.shroudTop - 1.2, F.inner.z1 + 0.01);
    g.add(logo);
  }

  // gaiola de HD 3,5"
  if (F.bays35.length) {
    const b0 = F.bays35[0].pos, n = F.bays35.length;
    const cageH = n * 3.4 + 0.6, cy = b0.y - 1.6 + cageH / 2;
    for (const sx of [-1, 1]) g.add(box(0.25, cageH, 15.4, inner, b0.x + sx * 5.6, cy, b0.z));
    g.add(box(11.4, 0.25, 15.4, inner, b0.x, b0.y - 1.7, b0.z));
  }

  // pés
  for (const sx of [-1, 1]) for (const sz of [-1, 1]) {
    const foot = rbox(4, 1.2, 3, 0.4, dark, sx * (d / 2 - 4), -0.6, sz * (w / 2 - 3));
    g.add(foot);
  }

  // tampa lateral (vidro ou metal)
  const side = new THREE.Group();
  if (s.glass === 'none') {
    side.add(box(d, h, 0.3, paint, 0, h / 2, 0));
  } else {
    side.add(box(d - 0.6, h - 0.6, 0.35, M.glass(), 0, h / 2, 0));
    const tint = M.plastic('#0c0c0c', 0.3);
    side.add(box(d - 0.6, 1.4, 0.37, tint, 0, h - 1.0, 0), box(d - 0.6, 1.4, 0.37, tint, 0, 1.0, 0));
    side.add(box(1.4, h - 0.6, 0.37, tint, d / 2 - 1.0, h / 2, 0), box(1.4, h - 0.6, 0.37, tint, -d / 2 + 1.0, h / 2, 0));
  }
  side.position.z = w / 2 - 0.2;
  side.visible = false;
  g.add(side);
  g.userData.sidePanel = side;
  return g;
}

function buildRearPanel(part, F, paint) {
  const { d, h, w, t } = F;
  const sh = new THREE.Shape();
  sh.moveTo(-w / 2, 0); sh.lineTo(w / 2, 0); sh.lineTo(w / 2, h); sh.lineTo(-w / 2, h); sh.closePath();
  const rect = (z0, z1, y0, y1) => {
    const p = new THREE.Path();
    p.moveTo(z0, y0); p.lineTo(z1, y0); p.lineTo(z1, y1); p.lineTo(z0, y1); p.closePath();
    sh.holes.push(p);
  };
  // painel I/O
  rect(F.pcbZ - 0.2, F.pcbZ + 4.6, F.boardY0 - 14.9, F.boardY0 - 0.9);
  // slots de expansão
  for (const r of F.openings) rect(F.pcbZ + 0.4, F.pcbZ + 10.4, rowY(F, r) - 1.6, rowY(F, r) - 0.1);
  // ventoinha traseira
  const rear = F.fanMounts.find(m => m.id === 'rear');
  if (rear) {
    const c = new THREE.Path();
    c.absarc(rear.pos.z, rear.pos.y, 5.6, 0, Math.PI * 2, true);
    sh.holes.push(c);
  }
  // fonte
  const pc = F.psuCenter;
  rect(pc.z - 7.2, pc.z + 7.2, pc.y - 4.1, pc.y + 4.1);
  const geo = new THREE.ExtrudeGeometry(sh, { depth: t, bevelEnabled: false, curveSegments: 32 });
  const m = new THREE.Mesh(geo, paint);
  m.rotation.y = -Math.PI / 2;
  m.position.x = -d / 2 + t;
  const grp = new THREE.Group();
  grp.add(m);
  // grade da ventoinha traseira
  if (rear) {
    const grill = M.metal('#55595f', 0.5);
    for (let i = -2; i <= 2; i++) {
      const bar = box(0.12, 0.15, 11, grill, -d / 2 + 0.1, rear.pos.y + i * 2.2, rear.pos.z);
      grp.add(bar);
    }
  }
  return grp;
}

function buildFront(part, F, paint) {
  const s = part.specs, L = part.look;
  const { d, h, w, t } = F;
  const g = new THREE.Group();
  const x = d / 2 - t / 2;
  if (s.style === 'aquario') {
    g.add(box(0.35, h - 0.6, w - 0.6, M.glass(), x, h / 2, 0));
    g.add(box(t, h, 1.0, paint, x, h / 2, w / 2 - 0.5), box(t, h, 1.0, paint, x, h / 2, -w / 2 + 0.5));
    g.add(box(t, 1.2, w, paint, x, h - 0.6, 0), box(t, 1.2, w, paint, x, 0.6, 0));
  } else if (s.style === 'wood') {
    g.add(box(t, h, w, paint, x, h / 2, 0));
    const rnd = seeded(part.id);
    const n = 10, sw = (w - 2) / n;
    for (let i = 0; i < n; i++) {
      const c = new THREE.Color(L.accent).offsetHSL(0, 0, (rnd() - 0.5) * 0.06);
      g.add(box(0.7, h - 4, sw * 0.62, M.paint('#' + c.getHexString(), 0.75), d / 2 + 0.35, h / 2, -w / 2 + 1 + sw * (i + 0.5)));
    }
  } else if (s.style === 'classic') {
    g.add(box(t * 2, h, w, paint, x - t / 2, h / 2, 0));
    const bay = M.paint('#cfc7b2', 0.6), slotM = M.plastic('#2a2a2a', 0.6);
    for (let i = 0; i < 2; i++) {
      g.add(box(0.4, 4.1, w - 4, bay, d / 2 + 0.2, h - 3.5 - i * 4.6, 0));
      g.add(box(0.42, 0.12, w - 6, slotM, d / 2 + 0.22, h - 3.5 - i * 4.6 - 1.2, 0));
    }
    g.add(box(0.4, 2.6, 10.2, bay, d / 2 + 0.2, h - 10.5, -1));
    g.add(box(0.42, 0.25, 8, slotM, d / 2 + 0.22, h - 10.2, -1));
    for (let i = 0; i < 8; i++) g.add(box(0.42, 0.22, w - 8, slotM, d / 2 + 0.22, 3 + i * 0.7, 0));
  } else {
    const tex = meshTexture(`front-${part.id}`, L.color, '#040404').clone();
    tex.wrapS = tex.wrapT = THREE.RepeatWrapping;
    tex.repeat.set(w / 7, h / 7);
    tex.needsUpdate = true;
    const meshM = new THREE.MeshStandardMaterial({ map: tex, roughness: 0.75, metalness: 0.2 });
    g.add(box(t, h, w, paint, x, h / 2, 0));
    const face = new THREE.Mesh(new THREE.PlaneGeometry(w - 2.4, h - 3), meshM);
    face.rotation.y = Math.PI / 2;
    face.position.set(d / 2 + 0.02, h / 2, 0);
    g.add(face);
    if (s.style === 'itx') g.add(box(0.2, h - 3, 0.5, M.paint(L.accent, 0.4), d / 2 + 0.05, h / 2, w / 2 - 1.0));
  }
  return g;
}

/* ============================== PLACA-MÃE ============================== */

export function buildMobo(part) {
  const s = part.specs, L = part.look;
  const B = BOARDS[s.form];
  const g = new THREE.Group();
  g.userData = { ramLatches: [], form: s.form };
  const at = (u, v, z = 0) => new THREE.Vector3(u, -v, z);

  // placa (PCB) com serigrafia
  const silk = moboSilkTexture(part, B);
  const pcbSide = M.plastic(L.pcb, 0.6);
  const pcbTop = new THREE.MeshStandardMaterial({ map: silk, roughness: 0.55, metalness: 0.1 });
  const pcb = new THREE.Mesh(new THREE.BoxGeometry(B.w, B.h, 0.16), [pcbSide, pcbSide, pcbSide, pcbSide, pcbTop, pcbSide]);
  pcb.position.set(B.w / 2, -B.h / 2, -0.08);
  g.add(pcb);

  const accent = M.paint(L.accent, 0.38);
  const blackP = M.plastic('#141414', 0.55);
  const slotM = M.plastic(L.slot, 0.5);

  // soquete do processador
  const [su, sv] = B.socket;
  const pga = s.socket === 'AM4' || s.socket === 'AM3+';
  const lever = new THREE.Group();
  if (pga) {
    const sock = box(4.4, 5.0, 0.42, M.plastic('#e9e4d6', 0.6));
    sock.position.copy(at(su, sv + 0.2, 0.21));
    g.add(sock);
    const holes = decal(3.8, 3.8, canvasTexture('pga-holes', 128, 128, (c) => {
      c.fillStyle = '#e9e4d6'; c.fillRect(0, 0, 128, 128);
      c.fillStyle = '#9a958a';
      for (let y = 4; y < 128; y += 5) for (let x = 4; x < 128; x += 5) c.fillRect(x, y, 2, 2);
    }));
    holes.position.copy(at(su, sv, 0.425));
    g.add(holes);
  } else {
    g.add(place(box(5.4, 5.8, 0.3, M.plastic('#2b2d30', 0.6)), at(su, sv, 0.15)));
    const lp = M.metal('#a9aeb4', 0.35);
    // moldura de retenção
    g.add(place(box(5.4, 0.5, 0.2, lp), at(su, sv - 2.65, 0.4)));
    g.add(place(box(5.4, 0.5, 0.2, lp), at(su, sv + 2.65, 0.4)));
    g.add(place(box(0.5, 5.8, 0.2, lp), at(su - 2.45, sv, 0.4)));
    g.add(place(box(0.5, 5.8, 0.2, lp), at(su + 2.45, sv, 0.4)));
    const pins = decal(3.9, 4.4, canvasTexture('lga-pins', 128, 128, (c) => {
      c.fillStyle = '#3a2e1c'; c.fillRect(0, 0, 128, 128);
      c.fillStyle = '#d4a74a';
      for (let y = 3; y < 128; y += 4) for (let x = 3; x < 128; x += 4) c.fillRect(x, y, 1.5, 1.5);
    }), { metal: 0.6, rough: 0.4 });
    pins.position.copy(at(su, sv, 0.305));
    g.add(pins);
  }
  // alavanca: gira em torno do eixo X a partir da ponta de baixo
  lever.position.copy(at(su + 3.0, sv + 2.7, 0.3));
  const rod = cyl(0.11, 5.6, M.metal('#c9cdd2', 0.3), 10);
  rod.position.y = 2.8;
  lever.add(rod);
  const handle = cyl(0.17, 1.0, M.plastic('#1b1b1b', 0.5), 10, 'x');
  handle.position.set(0.45, 5.6, 0);
  lever.add(handle);
  lever.rotation.x = 1.75;
  g.add(lever);
  g.userData.lever = lever;
  g.userData.leverTip = new THREE.Vector3(0.45, 5.6, 0);

  // dissipadores do VRM
  const [lu, lv, lw, lh] = B.vrmLeft, [tu, tv, tw, th] = B.vrmTop;
  g.add(rbox(lw, lh, 3.0, 0.35, accent, lu + lw / 2, -(lv + lh / 2), 1.5));
  g.add(rbox(tw, th, 2.6, 0.35, accent, tu + tw / 2, -(tv + th / 2), 1.3));
  const fins = M.plastic('#0d0d0d', 0.8);
  for (let i = 0; i < 6; i++) g.add(box(0.1, lh * 0.8, 0.1, fins, lu + 0.5 + i * (lw - 1) / 5, -(lv + lh / 2), 3.02));

  // painel traseiro de conexões (I/O)
  const [iu, iv, iw, ih] = B.io;
  const ioCover = rbox(iw, ih, 4.2, 0.3, M.paint(darker(L.accent), 0.45), iu + iw / 2, -(iv + ih / 2), 2.1);
  g.add(ioCover);
  const ports = decal(ih, 4.0, ioPortsTexture(), { rough: 0.5 });
  ports.rotation.y = -Math.PI / 2;
  ports.rotation.z = Math.PI / 2;
  ports.position.set(iu - 0.01, -(iv + ih / 2), 2.1);
  g.add(ports);
  const ioLabel = decal(ih * 0.7, iw * 0.6, labelTexture('io-brand-' + part.brand, {
    w: 512, h: 128, bg: darker(L.accent), lines: [{ text: part.brand.toUpperCase(), y: 0.55, size: 60, weight: 800, color: '#e8e8e8' }],
  }));
  ioLabel.rotation.z = Math.PI / 2;
  ioLabel.position.set(iu + iw / 2, -(iv + ih / 2), 4.21);
  g.add(ioLabel);
  if (part.tier === 'topo' || part.tier === 'avancada') {
    const strip = box(0.2, ih * 0.8, 0.2, rgbMat(L.accent === '#e3e5e8' ? '#4fd1ff' : '#ff3b6b'));
    strip.position.set(iu + iw + 0.02, -(iv + ih / 2), 3.4);
    g.add(strip);
  }

  // slots de memória
  const n = s.ramSlots;
  for (let i = 0; i < n; i++) {
    const u = ramSlotU(B, s, i);
    const color = n === 4 && (i === 1 || i === 3) ? M.plastic(lighter(L.slot), 0.5) : slotM;
    g.add(place(box(0.62, B.ram.len, 0.85, color), at(u, B.ram.v0 + B.ram.len / 2, 0.425)));
    const latches = [];
    for (const end of [0, 1]) {
      const pivot = new THREE.Group();
      pivot.position.copy(at(u, end ? B.ram.v0 + B.ram.len : B.ram.v0, 0.3));
      const lt = box(0.66, 0.55, 1.05, color);
      lt.position.set(0, end ? -0.3 : 0.3, 0.5);
      pivot.add(lt);
      pivot.userData.openAngle = end ? -0.5 : 0.5;
      pivot.rotation.x = pivot.userData.openAngle;
      g.add(pivot);
      latches.push(pivot);
    }
    g.userData.ramLatches.push(latches);
  }

  // slots PCIe
  const metalSlot = part.tier === 'avancada' || part.tier === 'topo';
  for (const r of B.rows) {
    const len = r.type === 'x16' ? 8.9 : 2.5;
    const v = rowV(r.row);
    const m = r.type === 'x16' && metalSlot ? M.metal('#c4c8cd', 0.3) : slotM;
    g.add(place(box(len, 0.75, 1.1, m), at(4.2 + len / 2, v, 0.55)));
    if (r.type === 'x16') g.add(place(box(0.7, 0.85, 1.2, blackP), at(4.2 + len + 0.35, v, 0.6)));
  }

  // M.2
  for (let i = 0; i < Math.min(s.m2Slots, B.m2.length); i++) {
    const [mu, mv] = B.m2[i];
    g.add(place(box(0.55, 2.3, 0.55, blackP), at(mu + 0.27, mv, 0.27)));
    const st = cyl(0.25, 0.35, M.gold(), 12, 'z');
    st.position.copy(at(mu + 7.75, mv, 0.18));
    g.add(st);
  }

  // chipset
  if (B.chipset) {
    const [cu, cv, cw, ch] = B.chipset;
    g.add(rbox(cw, ch, 1.0, 0.3, accent, cu + cw / 2, -(cv + ch / 2), 0.5));
    const lab = decal(cw * 0.8, ch * 0.35, labelTexture('chip-' + part.id, {
      w: 512, h: 160, bg: L.accent, lines: [{ text: s.chipset, y: 0.5, size: 96, weight: 900, color: isLight(L.accent) ? '#30343a' : '#f2f2f2' }],
    }));
    lab.position.copy(at(cu + cw / 2, cv + ch / 2, 1.01));
    g.add(lab);
  }

  // conectores de energia
  const conn = M.plastic(isLight(L.pcb) ? '#f2f2f2' : '#1a1a1a', 0.5);
  const [au, av] = B.atx24;
  g.add(place(box(1.0, 5.2, 1.3, conn), at(au, av + 2.6, 0.65)));
  const [eu, ev] = B.eps;
  g.add(place(box(2.0, 0.95, 1.3, conn), at(eu, ev, 0.65)));
  const [sau, sav] = B.sata;
  for (let i = 0; i < Math.min(4, s.sata); i++) g.add(place(box(0.9, 0.55, 0.8, M.plastic('#1d1d1d', 0.5)), at(sau, sav + i * 0.75, 0.4)));

  // capacitores
  const capM = M.metal('#3c3f44', 0.4);
  for (let i = 0; i < 7; i++) {
    const c = cyl(0.3, 0.9, capM, 12, 'z');
    c.position.copy(at(lu + lw + 0.55, lv + 0.9 + i * 1.3, 0.45));
    if (lu + lw + 0.55 < su - 2.8) g.add(c);
  }
  if (B.battery) {
    const bat = cyl(1.0, 0.32, M.metal('#c5c9ce', 0.3), 24, 'z');
    bat.position.copy(at(B.battery[0], B.battery[1], 0.16));
    g.add(bat);
  }
  // anéis dos furos de parafuso
  const ringM = M.metal('#c9cdd2', 0.35);
  for (const [hu, hv] of B.holes) {
    const ring = new THREE.Mesh(new THREE.RingGeometry(0.18, 0.42, 20), ringM);
    ring.position.copy(at(hu, hv, 0.005));
    g.add(ring);
  }
  return g;
}

export function ramSlotU(B, s, i) {
  if (s.ramSlots === 2 && s.form !== 'ITX') return B.ram.u0 + B.ram.du + i * 2 * B.ram.du;
  return B.ram.u0 + i * B.ram.du;
}

function moboSilkTexture(part, B) {
  const S = 40;
  return canvasTexture('silk:' + part.id, Math.round(B.w * S), Math.round(B.h * S), (c, W, H) => {
    const L = part.look, sp = part.specs;
    c.fillStyle = L.pcb; c.fillRect(0, 0, W, H);
    const rnd = seeded(part.id);
    const trace = isLight(L.pcb) ? 'rgba(0,0,0,0.08)' : 'rgba(255,255,255,0.07)';
    c.strokeStyle = trace; c.lineWidth = 2;
    for (let i = 0; i < 160; i++) {
      let x = rnd() * W, y = rnd() * H;
      c.beginPath(); c.moveTo(x, y);
      for (let k = 0; k < 3; k++) {
        if (rnd() < 0.5) x += (rnd() - 0.5) * 260; else y += (rnd() - 0.5) * 260;
        c.lineTo(x, y);
      }
      c.stroke();
    }
    const ink = L.silk || (isLight(L.pcb) ? '#30343a' : '#e9ece8');
    c.fillStyle = ink; c.strokeStyle = ink;
    c.font = '600 22px Consolas, monospace';
    const txt = (t, u, v, size = 22) => { c.font = `600 ${size}px Consolas, monospace`; c.fillText(t, u * S, v * S); };
    const [su, sv] = B.socket;
    txt('CPU1 ' + sp.socket, su - 2.8, sv + 3.6);
    const n = sp.ramSlots;
    const names = n === 4 ? ['DIMM_A1', 'DIMM_A2', 'DIMM_B1', 'DIMM_B2'] : ['DIMM_A2', 'DIMM_B2'];
    for (let i = 0; i < n; i++) {
      const u = ramSlotU(B, sp, i);
      c.save(); c.translate((u + 0.15) * S, (B.ram.v0 + B.ram.len + 0.9) * S); c.rotate(-Math.PI / 2);
      c.font = '600 15px Consolas, monospace'; c.fillText(names[i], 0, 0); c.restore();
    }
    for (const r of B.rows) txt(r.type === 'x16' ? `PCIEX16_${r.row + 1}` : `PCIEX1_${r.row + 1}`, 4.2, rowV(r.row) - 0.6, 17);
    for (let i = 0; i < Math.min(sp.m2Slots, B.m2.length); i++) txt(`M.2_${i + 1}`, B.m2[i][0] + 2.5, B.m2[i][1] + 1.6, 16);
    c.save(); c.translate((B.atx24[0] - 0.7) * S, (B.atx24[1] + 5) * S); c.rotate(-Math.PI / 2); c.font = '600 16px Consolas, monospace'; c.fillText('ATX_PWR', 0, 0); c.restore();
    txt('CPU_PWR', B.eps[0] + 1.3, B.eps[1] + 0.5, 15);
    // contornos
    c.lineWidth = 2;
    c.strokeRect((su - 3.0) * S, (sv - 3.2) * S, 6.0 * S, 6.4 * S);
    for (const [hu, hv] of B.holes) { c.beginPath(); c.arc(hu * S, hv * S, 0.6 * S, 0, Math.PI * 2); c.stroke(); }
    // nome do modelo
    c.globalAlpha = 0.9;
    c.font = '800 46px Arial, sans-serif';
    const bx = B.w > 20 ? 16.4 : 6.0, by = B.w > 20 ? B.h - 1.4 : B.h - 0.5;
    c.fillText(sp.chipset, bx * S, by * S);
    c.font = '600 18px Consolas, monospace';
    c.fillText(part.name.toUpperCase().slice(0, 30), bx * S, (by - 1.5) * S);
    c.globalAlpha = 1;
  });
}

function ioPortsTexture() {
  return canvasTexture('io-ports', 512, 160, (c, W, H) => {
    c.fillStyle = '#9ea3a9'; c.fillRect(0, 0, W, H);
    const port = (x, y, w, h, col) => { c.fillStyle = '#222'; c.fillRect(x - 3, y - 3, w + 6, h + 6); c.fillStyle = col; c.fillRect(x, y, w, h); };
    port(20, 30, 40, 18, '#1f6fd6'); port(20, 80, 40, 18, '#1f6fd6');
    port(80, 30, 40, 18, '#111'); port(80, 80, 40, 18, '#111');
    port(140, 40, 54, 22, '#1b1b1b');
    port(215, 30, 40, 40, '#1b1b1b');
    port(275, 30, 40, 18, '#c62828'); port(275, 80, 40, 18, '#c62828');
    port(335, 35, 28, 14, '#111'); port(335, 85, 28, 14, '#111');
    const jacks = ['#7cc142', '#f59bc2', '#5aa8e6', '#f2a33a', '#111', '#888'];
    jacks.forEach((col, i) => { c.fillStyle = col; c.beginPath(); c.arc(400 + (i % 3) * 34, 40 + Math.floor(i / 3) * 50, 12, 0, Math.PI * 2); c.fill(); });
  });
}

/* ============================== PROCESSADOR ============================== */

export function cpuSize(part) {
  const sk = part.specs.socket;
  if (sk === 'LGA1700' || sk === 'LGA1851') return [3.75, 4.5];
  if (sk.startsWith('LGA')) return [3.75, 3.75];
  return [4.0, 4.0];
}

export function buildCPU(part) {
  const g = new THREE.Group();
  const [sx, sy] = cpuSize(part);
  const intel = part.brand === 'Intel';
  const sub = box(sx, sy, 0.12, M.plastic(intel ? '#1f5f36' : '#2a4f37', 0.5), 0, 0, 0.06);
  g.add(sub);
  const ihs = rbox(sx * 0.84, sy * (intel ? 0.8 : 0.84), 0.3, 0.2, M.metal('#c9cdd2', 0.3), 0, 0, 0.27);
  g.add(ihs);
  const words = part.name.split(' ');
  const brand = words[0].toUpperCase();
  const rest = words.slice(1).join(' ');
  const tex = labelTexture('cpu-' + part.id, {
    w: 512, h: 512, bg: '#c9cdd2',
    lines: [
      { text: brand, y: 0.3, size: 74, weight: 900, color: '#5c6168' },
      { text: rest.length > 18 ? rest.slice(0, 18) : rest, y: 0.52, size: 46, weight: 700, color: '#5c6168' },
      { text: part.specs.cores + ' NÚCLEOS', y: 0.7, size: 34, weight: 600, color: '#6c7178' },
    ],
  });
  const lab = decal(sx * 0.8, sy * 0.76, tex, { metal: 0.6, rough: 0.35 });
  lab.position.z = 0.425;
  g.add(lab);
  const tri = new THREE.Mesh(new THREE.CircleGeometry(0.25, 3), M.gold());
  tri.position.set(-sx / 2 + 0.3, -sy / 2 + 0.3, 0.125);
  g.add(tri);
  return g;
}

export function buildPaste() {
  const m = new THREE.Mesh(new THREE.SphereGeometry(0.6, 20, 12), M.plastic('#9aa0a6', 0.35));
  m.scale.set(1, 1, 0.22);
  return m;
}

/* ============================== COOLER ============================== */

export function buildCooler(part, ctx = {}) {
  const s = part.specs, L = part.look;
  const g = new THREE.Group();
  g.userData.rotors = [];
  const metal = M.metal(L.fin || '#c4c7cb', 0.35);
  const bar = M.metal('#9aa0a6', 0.4);
  // suportes em X até os 4 parafusos
  for (const a of [Math.PI / 4, -Math.PI / 4]) {
    const b = box(10.8, 0.9, 0.35, s.kind === 'box' ? M.plastic('#1a1a1a') : bar, 0, 0, 0.55);
    b.rotation.z = a;
    g.add(b);
  }

  if (s.kind === 'box') {
    const core = cyl(1.5, 0.6, M.copper(), 24, 'z');
    core.position.z = 0.3;
    g.add(core);
    const finM = M.metal('#b5b9be', 0.4);
    for (let i = 0; i < 40; i++) {
      const fin = box(3.2, 0.08, 2.5, finM);
      const a = (i / 40) * Math.PI * 2;
      fin.position.set(Math.cos(a) * 2.6, Math.sin(a) * 2.6, 1.9);
      fin.rotation.z = a;
      g.add(fin);
    }
    const shroud = new THREE.Mesh(new THREE.CylinderGeometry(4.6, 4.6, 1.8, 40, 1, true), M.plastic('#161616', 0.5));
    shroud.material.side = THREE.DoubleSide;
    shroud.rotation.x = Math.PI / 2;
    shroud.position.z = 4.4;
    g.add(shroud);
    const fan = makeFan({ size: 9, thick: 1.4, frame: false, bladeColor: '#202020', blades: 9 });
    fan.position.z = 4.4;
    g.add(fan);
    g.userData.rotors.push(...fan.userData.rotors);
    const top = new THREE.Mesh(new THREE.RingGeometry(4.0, 4.6, 40), M.plastic('#1d1d1d', 0.5));
    top.position.z = 5.3;
    g.add(top);
    return g;
  }

  if (s.kind === 'aio') return buildAIO(part, ctx, g);

  // torre (simples ou dupla)
  const H = s.heightCM;
  const base = rbox(4.0, 4.0, 0.9, 0.2, M.metal('#d0d3d6', 0.3), 0, 0, 0.45);
  g.add(base);
  const dual = s.kind === 'dual';
  const stacks = dual ? [-3.4, 3.4] : [0];
  const depth = dual ? 4.2 : 5.0;
  const z0 = dual ? 4.6 : 3.6, z1 = H - 0.3;
  const count = Math.floor((z1 - z0) / 0.24);
  const finGeo = new THREE.BoxGeometry(depth, 12.4, 0.05);
  for (const sx of stacks) {
    const inst = new THREE.InstancedMesh(finGeo, metal, count);
    const mtx = new THREE.Matrix4();
    for (let i = 0; i < count; i++) {
      mtx.makeTranslation(sx, 0, z0 + i * 0.24);
      inst.setMatrixAt(i, mtx);
    }
    g.add(inst);
    const cap = box(depth + 0.15, 12.6, 0.35, L.top ? M.plastic(L.top, 0.4) : metal, sx, 0, z1 + 0.15);
    g.add(cap);
  }
  // heatpipes de cobre em U
  const pipeM = M.copper();
  const legs = dual ? [-4.5, -2.7, -0.9, 0.9, 2.7, 4.5] : [-3.6, -1.2, 1.2, 3.6];
  const ox = dual ? 3.4 : 1.6;
  legs.forEach((y, i) => {
    const a = dual ? -ox - 0.9 + (i % 2) * 1.8 : -ox;
    const b = dual ? ox - 0.9 + (i % 2) * 1.8 : ox;
    const pts = [
      new THREE.Vector3(a, y, z1 - 0.4), new THREE.Vector3(a, y, 2.0), new THREE.Vector3(a * 0.5, y, 0.7),
      new THREE.Vector3(b * 0.5, y, 0.7), new THREE.Vector3(b, y, 2.0), new THREE.Vector3(b, y, z1 - 0.4),
    ];
    const tube = new THREE.Mesh(new THREE.TubeGeometry(new THREE.CatmullRomCurve3(pts), 30, 0.3, 8), pipeM);
    g.add(tube);
  });
  // ventoinhas
  const fans = [];
  if (dual) {
    fans.push({ x: 0, z: (z0 + z1) / 2 + 0.3 });
    fans.push({ x: 3.4 + depth / 2 + 1.3, z: Math.max(z1 - 6.1, 10.8) });
  } else {
    fans.push({ x: depth / 2 + 1.3, z: z1 - 6.2 });
  }
  for (const f of fans) {
    const fan = makeFan({ size: 12, thick: 2.5, frameColor: L.fan || '#141414', bladeColor: L.blade || '#1e1e1e' });
    fan.rotation.y = Math.PI / 2;
    fan.position.set(f.x, 0, f.z);
    g.add(fan);
    g.userData.rotors.push(...fan.userData.rotors);
  }
  // logo no topo
  const lab = decal(depth * 0.9, 5, labelTexture('cool-' + part.id, {
    w: 256, h: 512, bg: L.top || '#1a1a1a', lines: [{ text: part.brand.toUpperCase(), y: 0.5, size: 42, weight: 800, color: '#d9d9d9' }],
  }));
  lab.position.set(stacks[stacks.length - 1], 0, z1 + 0.33);
  g.add(lab);
  return g;
}

function buildAIO(part, ctx, g) {
  const s = part.specs, L = part.look;
  const pump = cyl(3.3, 3.0, M.plastic('#141414', 0.45), 40, 'z');
  pump.position.z = 1.5;
  g.add(pump);
  const ring = new THREE.Mesh(new THREE.TorusGeometry(3.0, 0.14, 8, 48), rgbMat(L.rgb || '#7c5cff'));
  ring.position.z = 3.05;
  g.add(ring);
  const face = decal(4.6, 4.6, labelTexture('pump-' + part.id, {
    w: 256, h: 256, bg: '#0b0b0b',
    lines: s.radiator === 360 ? [{ text: '38°C', y: 0.5, size: 70, weight: 800, color: '#7fe7ff' }] : [{ text: part.brand.toUpperCase(), y: 0.5, size: 42, weight: 800, color: '#cfcfcf' }],
  }));
  face.position.z = 3.02;
  g.add(face);

  // radiador no topo do gabinete (posição relativa ao processador)
  const rad = ctx.radiator;
  if (rad) {
    const rg = new THREE.Group();
    rg.position.copy(rad.offset);
    const fin = finTexture('rad', '#1d1d1d', '#090909').clone();
    fin.repeat.set(rad.length / 2, 1);
    fin.needsUpdate = true;
    const core = new THREE.Mesh(new THREE.BoxGeometry(rad.length - 3.4, 2.7, 12.0), new THREE.MeshStandardMaterial({ map: fin, roughness: 0.7, metalness: 0.4 }));
    rg.add(core);
    for (const sx of [-1, 1]) rg.add(box(1.7, 3.0, 12.4, M.plastic('#121212', 0.5), sx * (rad.length / 2 - 0.85), 0, 0));
    for (let i = 0; i < rad.n; i++) {
      const fan = makeFan({ size: 12, thick: 2.5, frameColor: L.fan || '#141414', bladeColor: '#202020', rgb: L.rgb });
      fan.rotation.x = -Math.PI / 2;
      fan.position.set(-((rad.n - 1) * 12) / 2 + i * 12, -2.7 / 2 - 1.25, 0);
      rg.add(fan);
      g.userData.rotors.push(...fan.userData.rotors);
    }
    g.add(rg);
    // mangueiras
    const tubeM = M.plastic('#101010', 0.7);
    const endX = rad.offset.x + (rad.offset.x > 0 ? -1 : 1) * (rad.length / 2 - 0.9);
    for (const k of [-1, 1]) {
      const p0 = new THREE.Vector3(2.8, k * 1.0, 1.8);
      const pts = [
        p0, new THREE.Vector3(5.5, k * 1.0, 4.0),
        new THREE.Vector3(endX * 0.6 + 3, rad.offset.y - 6, rad.offset.z * 0.6 + k * 1.2),
        new THREE.Vector3(endX, rad.offset.y - 1.6, rad.offset.z + k * 2.2),
      ];
      g.add(new THREE.Mesh(new THREE.TubeGeometry(new THREE.CatmullRomCurve3(pts), 40, 0.55, 10), tubeM));
    }
  }
  return g;
}

/* ============================== MEMÓRIA ============================== */

export function ramHeight(part) {
  return part.look.bare ? 3.1 : part.specs.rgb ? 4.3 : 3.5;
}

export function buildRAM(part) {
  const s = part.specs, L = part.look;
  const g = new THREE.Group();
  const H = ramHeight(part);
  g.add(box(0.12, 13.3, 3.1, M.plastic('#1e6b3a', 0.5), 0, 0, 1.55));
  const notch = s.type === 'DDR3' ? -1.3 : s.type === 'DDR4' ? -0.4 : 0;
  const leftLen = 13.3 / 2 + notch - 0.25, rightLen = 13.3 - leftLen - 0.5;
  g.add(box(0.14, leftLen - 0.4, 0.42, M.gold(), 0, -13.3 / 2 + 0.2 + (leftLen - 0.4) / 2, 0.25));
  g.add(box(0.14, rightLen - 0.4, 0.42, M.gold(), 0, 13.3 / 2 - 0.2 - (rightLen - 0.4) / 2, 0.25));
  if (L.bare) {
    const chip = M.plastic('#111', 0.4);
    for (let i = 0; i < 8; i++) for (const sx of [-1, 1]) g.add(box(0.12, 1.1, 0.95, chip, sx * 0.12, -5.6 + i * 1.6, 1.9));
    const st = decal(4.5, 1.2, labelTexture('ramst-' + part.id, { w: 512, h: 128, bg: '#f5f5f5', lines: [{ text: `${part.brand} ${s.gb}GB ${s.type}-${s.mhz}`, y: 0.5, size: 40, color: '#222' }] }));
    st.rotation.y = Math.PI / 2; st.rotation.z = Math.PI / 2; st.position.set(0.2, 3, 1.4);
    g.add(st);
  } else {
    const spread = M.paint(L.color, 0.35);
    g.add(rbox(0.75, 13.3, H - 0.4, 0.1, spread, 0, 0, 0.6 + (H - 0.4) / 2));
    const label = decal(9, 1.4, labelTexture('ram-' + part.id, {
      w: 1024, h: 160, bg: L.color,
      lines: [{ text: `${part.brand.toUpperCase()}  ${s.type}  ${s.gb}GB`, y: 0.52, size: 72, weight: 800, color: isLight(L.color) ? '#2a2a2a' : '#e8e8e8' }],
    }));
    label.rotation.y = Math.PI / 2;
    label.rotation.z = Math.PI / 2;
    label.position.set(0.38, 0, H * 0.55);
    g.add(label);
    if (s.rgb) {
      g.add(box(0.6, 12.8, 0.6, rgbMat('#ff4fd8'), 0, 0, H + 0.1));
    } else {
      g.add(box(0.78, 13.3, 0.3, M.paint(darker(L.color), 0.4), 0, 0, H - 0.05));
    }
  }
  return g;
}

/* ============================== PLACA DE VÍDEO ============================== */

export function buildGPU(part) {
  const s = part.specs, L = part.look;
  const g = new THREE.Group();
  g.userData.rotors = [];
  const len = s.lengthCM, H = gpuHeight(part), T = gpuThick(part);
  const x0 = GPU_BRACKET_X, x1 = GPU_BRACKET_X + len, cx = (x0 + x1) / 2;
  const z0 = -0.8;
  const shroud = M.paint(L.shroud, 0.45);
  // PCB e contatos
  g.add(box(len - 0.6, 0.16, H - 0.4, M.plastic('#173d29', 0.6), cx + 0.15, 0, z0 + (H - 0.4) / 2));
  g.add(box(8.6, 0.18, 0.8, M.gold(), 4.45, 0, z0 + 0.4));
  // dissipador e carcaça
  g.add(box(len - 1.4, T - 0.9, H - 1.2, M.metal('#3b3e42', 0.55), cx + 0.3, -(T - 0.9) / 2 - 0.12, z0 + H / 2));
  const fanN = s.fans || 1;
  const fanD = Math.min((len - 3.2) / fanN - 0.3, H - 1.6, 10);
  const plate = new THREE.Shape();
  const pw = len - 0.5, ph = H - 0.3;
  plate.moveTo(-pw / 2, -ph / 2); plate.lineTo(pw / 2, -ph / 2); plate.lineTo(pw / 2, ph / 2); plate.lineTo(-pw / 2, ph / 2); plate.closePath();
  const fanX = [];
  for (let i = 0; i < fanN; i++) {
    const fx = (-((fanN - 1) * (fanD + 0.4)) / 2 + i * (fanD + 0.4)) + 0.6;
    fanX.push(fx);
    const hole = new THREE.Path();
    hole.absarc(fx, 0, fanD / 2, 0, Math.PI * 2, true);
    plate.holes.push(hole);
  }
  const plateGeo = new THREE.ExtrudeGeometry(plate, { depth: 0.5, bevelEnabled: false, curveSegments: 28 });
  const plateMesh = new THREE.Mesh(plateGeo, shroud);
  plateMesh.rotation.x = Math.PI / 2;
  plateMesh.position.set(cx + 0.25, -T + 0.5, z0 + H / 2);
  g.add(plateMesh);
  // laterais da carcaça
  g.add(box(len - 0.5, T - 0.4, 0.3, shroud, cx + 0.25, -T / 2, z0 + H - 0.15));
  g.add(box(len - 0.5, T - 0.4, 0.3, shroud, cx + 0.25, -T / 2, z0 + 0.35));
  g.add(box(0.3, T - 0.4, H - 0.3, shroud, x1 - 0.15, -T / 2, z0 + H / 2));
  for (let i = 0; i < fanN; i++) {
    const fan = makeFan({ size: fanD, thick: 1.2, frame: false, bladeColor: '#1b1b1b', blades: 9 });
    fan.rotation.x = Math.PI / 2;
    fan.position.set(cx + 0.25 + fanX[i], -T + 0.75, z0 + H / 2);
    g.add(fan);
    g.userData.rotors.push(...fan.userData.rotors);
  }
  // backplate
  g.add(box(len - 0.7, 0.22, H - 0.6, M.metal('#2a2c2f', 0.5), cx + 0.2, 0.22, z0 + H / 2));
  // nome na borda de cima (virada para o vidro)
  const chip = s.chip || part.brand;
  const nameTxt = chip === 'NVIDIA' ? (part.name.includes('RTX') ? 'GEFORCE RTX' : 'GEFORCE GTX') : chip === 'AMD' ? 'RADEON' : chip === 'Intel' ? 'INTEL ARC' : part.brand.toUpperCase();
  const brandTex = labelTexture('gpuname-' + part.id, {
    w: 512, h: 96, bg: L.shroud,
    lines: [{ text: nameTxt, y: 0.55, size: 58, weight: 900, color: isLight(L.shroud) ? '#2d3238' : '#f1f1f1' }],
  });
  const nameDecal = decal(Math.min(len * 0.45, 11), Math.min(T * 0.42, 2.0), brandTex);
  nameDecal.position.set(cx - len * 0.12, -T / 2, z0 + H + 0.02);
  g.add(nameDecal);
  if (part.tier === 'topo' || part.tier === 'avancada' || part.cat === 'gpu' && part.custom) {
    g.add(box(len * 0.3, 0.3, 0.12, rgbMat(L.accent || '#76b900'), cx + len * 0.25, -T / 2, z0 + H + 0.05));
  }
  // suporte metálico traseiro com saídas de vídeo
  const bracketM = M.metal('#c3c7cc', 0.35);
  const bh = Math.ceil(s.slots || 2) * 2.032 - 0.4;
  g.add(box(0.12, bh, 11.4, bracketM, x0, 0.25 - bh / 2, z0 + 11.4 / 2));
  g.add(box(1.0, bh, 0.12, bracketM, x0 + 0.5, 0.25 - bh / 2, LEDGE_Z - 1.1));
  const ports = decal(9, 1.3, gpuPortsTexture(), {});
  ports.rotation.y = -Math.PI / 2;
  ports.position.set(x0 - 0.07, -0.85, z0 + 5.4);
  g.add(ports);
  // conector de energia
  if (s.power) {
    const pw2 = s.power === '16' ? 1.4 : s.power === '2x8' ? 4.2 : s.power === '3x8' ? 6.3 : 2.1;
    const px = x1 - 6 - pw2 / 2;
    g.add(box(pw2, 0.9, 0.9, M.plastic('#111', 0.5), px, -0.6, z0 + H - 0.4 + 0.45));
    g.userData.powerPort = new THREE.Vector3(px, -0.6, z0 + H + 0.5);
  }
  return g;
}

function gpuPortsTexture() {
  return canvasTexture('gpu-ports', 512, 72, (c, W, H) => {
    c.fillStyle = '#c3c7cc'; c.fillRect(0, 0, W, H);
    c.fillStyle = '#1d1d1d';
    for (let i = 0; i < 3; i++) c.fillRect(30 + i * 110, 20, 80, 32);
    c.fillRect(370, 22, 70, 28);
    c.fillStyle = '#7d8288';
    for (let x = 0; x < W; x += 14) c.fillRect(x, 60, 8, 6);
  });
}

/* ============================== ARMAZENAMENTO ============================== */

export function buildM2(part) {
  const s = part.specs, L = part.look;
  const g = new THREE.Group();
  g.add(box(8, 2.2, 0.08, M.plastic('#0f2a1a', 0.5), 4, 0, 0.04));
  g.add(box(0.5, 2.0, 0.09, M.gold(), 0.25, 0, 0.045));
  if (s.heatsink) {
    const fin = finTexture('m2hs', '#2b2d30', '#111').clone();
    fin.repeat.set(1, 6); fin.needsUpdate = true;
    g.add(box(7.4, 2.25, 0.9, new THREE.MeshStandardMaterial({ map: fin, roughness: 0.5, metalness: 0.6 }), 4.2, 0, 0.55));
  } else {
    const chip = M.plastic('#121212', 0.4);
    g.add(box(1.2, 1.2, 0.12, chip, 1.6, 0, 0.14), box(1.7, 1.5, 0.12, chip, 3.8, 0, 0.14), box(1.7, 1.5, 0.12, chip, 5.9, 0, 0.14));
    const lab = decal(6.6, 1.9, labelTexture('m2-' + part.id, {
      w: 640, h: 180, bg: L.color,
      lines: [
        { text: part.brand.toUpperCase(), y: 0.32, size: 52, weight: 800, color: L.label || '#fff' },
        { text: `NVMe ${s.gb >= 1000 ? s.gb / 1000 + 'TB' : s.gb + 'GB'}  ·  ${s.read} MB/s`, y: 0.72, size: 38, weight: 600, color: '#e6e6e6' },
      ],
    }));
    lab.position.set(4.2, 0, 0.21);
    g.add(lab);
  }
  return g;
}

export function buildHDD(part) {
  const s = part.specs, L = part.look;
  const g = new THREE.Group();
  g.add(box(10.2, 2.6, 14.7, M.metal(L.color, 0.45)));
  g.add(box(9.4, 0.12, 9.8, M.plastic('#16391f', 0.6), 0, -1.36, -1.5));
  const lab = decal(8.6, 10.5, labelTexture('hdd-' + part.id, {
    w: 512, h: 640, bg: '#e8e9eb',
    lines: [
      { text: part.brand.toUpperCase(), y: 0.15, size: 50, weight: 900, color: '#1a1a1a' },
      { text: part.name.replace(/^HD\s+/, '').replace(part.brand, '').trim(), y: 0.3, size: 36, weight: 700, color: '#333' },
      { text: s.gb >= 1000 ? `${s.gb / 1000} TB` : `${s.gb} GB`, y: 0.55, size: 110, weight: 900, color: '#1a1a1a' },
      { text: '7200 RPM · SATA 6Gb/s', y: 0.8, size: 30, weight: 600, color: '#555' },
    ],
  }));
  lab.rotation.x = -Math.PI / 2;
  lab.position.y = 1.31;
  g.add(lab);
  // gaveta (trilho) com alça voltada para o lado aberto
  const sled = M.plastic('#1c1d20', 0.6);
  g.add(box(10.9, 0.3, 15.2, sled, 0, -1.45, 0));
  g.add(box(10.9, 2.9, 0.6, sled, 0, -0.1, 7.65));
  g.add(box(4, 0.8, 0.3, M.plastic('#2c2e33', 0.5), 0, -0.2, 8.0));
  return g;
}

export function buildSSD25(part, opts = {}) {
  if (opts.sled) {
    // SSD deitado numa gaveta de 3,5" com adaptador
    const g = new THREE.Group();
    const ssd = buildSSD25(part);
    ssd.rotation.x = -Math.PI / 2;
    ssd.position.y = -0.7;
    g.add(ssd);
    const sled = M.plastic('#1c1d20', 0.6);
    g.add(box(10.9, 0.3, 15.2, sled, 0, -1.45, 0));
    g.add(box(10.9, 2.9, 0.6, sled, 0, -0.1, 7.65));
    g.add(box(0.3, 1.2, 15.2, sled, -5.3, -0.9, 0), box(0.3, 1.2, 15.2, sled, 5.3, -0.9, 0));
    return g;
  }
  const s = part.specs, L = part.look;
  const g = new THREE.Group();
  g.add(box(7.7, 10.7, 0.12, M.metal('#5d6268', 0.5), 0, 0, -0.3));
  g.add(rbox(7.0, 10.0, 0.7, 0.15, M.paint(L.color, 0.5)));
  const lab = decal(6.2, 7.5, labelTexture('ssd-' + part.id, {
    w: 512, h: 620, bg: L.color,
    lines: [
      { text: part.brand.toUpperCase(), y: 0.22, size: 66, weight: 900, color: L.label || '#e53935' },
      { text: 'SSD', y: 0.45, size: 90, weight: 900, color: '#f0f0f0' },
      { text: s.gb >= 1000 ? `${s.gb / 1000} TB` : `${s.gb} GB`, y: 0.68, size: 64, weight: 800, color: '#f0f0f0' },
    ],
  }));
  lab.position.z = 0.36;
  g.add(lab);
  return g;
}

/* ============================== FONTE ============================== */

export function buildPSU(part) {
  const s = part.specs, L = part.look;
  const g = new THREE.Group();
  g.userData.rotors = [];
  g.add(rbox(14, 8.6, 15, 0.3, M.paint(L.color, 0.5)));
  const fan = makeFan({ size: 12, thick: 1.0, frame: false, bladeColor: '#1a1a1a', blades: 9 });
  fan.rotation.x = Math.PI / 2;
  fan.position.y = -4.1;
  g.add(fan);
  g.userData.rotors.push(...fan.userData.rotors);
  const grill = M.metal('#2a2a2a', 0.5);
  for (const r of [2, 3.8, 5.6]) {
    const ring = new THREE.Mesh(new THREE.TorusGeometry(r, 0.07, 6, 40), grill);
    ring.rotation.x = Math.PI / 2;
    ring.position.y = -4.36;
    g.add(ring);
  }
  // etiqueta voltada para o lado aberto
  const badge = { 'Sem selo': '#7a7f86', '80 Plus Bronze': '#b8743a', '80 Plus Gold': '#d4af37', '80 Plus Platinum': '#cfd5db' }[s.rating] || '#888';
  const lab = decal(12, 6.8, labelTexture('psu-' + part.id, {
    w: 768, h: 436, bg: L.color,
    lines: [
      { text: part.brand.toUpperCase(), y: 0.22, size: 74, weight: 900, color: L.label || '#fff' },
      { text: `${s.watts}W`, y: 0.52, size: 130, weight: 900, color: '#f2f2f2' },
      { text: s.rating.toUpperCase(), y: 0.82, size: 46, weight: 800, color: badge },
    ],
  }));
  lab.position.z = 7.52;
  g.add(lab);
  // traseira: grade, tomada e chave
  const rear = decal(8.2, 14, canvasTexture('psu-rear', 256, 440, (c, W, H) => {
    c.fillStyle = '#1a1a1a'; c.fillRect(0, 0, W, H);
    c.fillStyle = '#050505';
    for (let y = 12; y < H * 0.62; y += 18) for (let x = 12 + ((y / 18) % 2) * 9; x < W - 8; x += 18) { c.beginPath(); c.arc(x, y, 6, 0, Math.PI * 2); c.fill(); }
    c.fillStyle = '#0a0a0a'; c.fillRect(60, H * 0.7, 90, 70);
    c.fillStyle = '#333'; c.fillRect(75, H * 0.73, 60, 45);
    c.fillStyle = '#c62828'; c.fillRect(175, H * 0.72, 34, 54);
  }));
  rear.rotation.y = -Math.PI / 2;
  rear.rotation.z = Math.PI / 2;
  rear.position.x = -7.02;
  g.add(rear);
  if (s.modular) {
    const sock = M.plastic('#0d0d0d', 0.6);
    for (let i = 0; i < 6; i++) g.add(box(0.2, 1.0, 1.6, sock, 7.05, 2.2 - Math.floor(i / 3) * 1.6, -4 + (i % 3) * 2.6));
  } else {
    const stub = cyl(1.4, 1.2, M.plastic('#0f0f0f', 0.7), 16, 'x');
    stub.position.set(7.5, 1.5, 0);
    g.add(stub);
  }
  return g;
}

/* ============================== VENTOINHA ============================== */

export function buildCaseFan(part) {
  const L = part.look;
  return makeFan({ size: 12, thick: 2.5, frameColor: L.color, bladeColor: L.blade, rgb: part.specs.rgb ? '#3ad7ff' : null });
}

/* ============================== MONITOR ============================== */

export function buildMonitor() {
  const g = new THREE.Group();
  const black = M.plastic('#121314', 0.45);
  g.add(rbox(56, 34, 1.6, 0.6, black, 0, 33, 0));
  const c = document.createElement('canvas');
  c.width = 1024; c.height = 600;
  const tex = new THREE.CanvasTexture(c);
  tex.colorSpace = THREE.SRGBColorSpace;
  const screen = new THREE.Mesh(new THREE.PlaneGeometry(53.4, 31.2), new THREE.MeshBasicMaterial({ map: tex, toneMapped: false }));
  screen.position.set(0, 33.4, 0.82);
  g.add(screen);
  g.add(box(4, 16, 1.6, black, 0, 10, -2.2));
  g.add(rbox(22, 1.0, 14, 0.4, black, 0, 0.5, -1));
  const led = M.led('#4fd1ff');
  g.add(box(0.6, 0.3, 0.2, led, 24, 16.3, 0.85));
  g.userData = { canvas: c, ctx: c.getContext('2d'), tex, led };
  return g;
}

/* ============================== utilidades de cor ============================== */

function hexToRgb(hex) {
  const c = new THREE.Color(hex);
  return [c.r, c.g, c.b];
}
export function isLight(hex) {
  const [r, g, b] = hexToRgb(hex);
  return 0.299 * r + 0.587 * g + 0.114 * b > 0.6;
}
function darker(hex) {
  return '#' + new THREE.Color(hex).offsetHSL(0, 0, -0.12).getHexString();
}
function lighter(hex) {
  return '#' + new THREE.Color(hex).offsetHSL(0, 0, 0.12).getHexString();
}

export { radiatorMount };
