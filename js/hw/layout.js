// Geometria do gabinete e da placa-mãe (em centímetros).
// Eixos: X = traseira (−) → frente (+); Y = para cima; Z = bandeja da placa (−) → lado aberto (+).
import { THREE } from './three-util.js';

const V = (x, y, z) => new THREE.Vector3(x, y, z);

export const ROW_V0 = 16.0;
export const ROW_PITCH = 2.032;
export const rowV = r => ROW_V0 + r * ROW_PITCH;

// Posições na placa-mãe em coordenadas da placa: u = para a direita, v = para baixo, a partir do canto superior esquerdo.
export const BOARDS = {
  ATX: {
    w: 24.4, h: 30.5,
    socket: [12.6, 8.2],
    ram: { u0: 17.7, du: 0.95, v0: 1.9, len: 13.4 },
    rows: [{ row: 0, type: 'x1' }, { row: 1, type: 'x16', gpu: true }, { row: 3, type: 'x1' }, { row: 4, type: 'x16' }, { row: 6, type: 'x1' }],
    m2: [[7.0, 14.6], [8.0, 20.06], [8.0, 26.16], [8.0, 29.35]],
    atx24: [23.55, 9.0], eps: [3.2, 0.7], sata: [23.55, 19.5],
    chipset: [16.6, 19.5, 5, 5],
    io: [0, 1.0, 3.4, 13.8],
    vrmLeft: [3.7, 2.2, 3.3, 10.6], vrmTop: [6.6, 1.2, 9.0, 1.9],
    battery: [13.6, 23.0],
    holes: [[0.8, 0.8], [13.8, 0.8], [23.4, 0.8], [13.8, 13.0], [23.4, 14.8], [0.8, 15.4], [0.8, 29.7], [17.0, 29.7], [23.4, 29.7]],
  },
  mATX: {
    w: 24.4, h: 24.4,
    socket: [12.2, 8.2],
    ram: { u0: 17.4, du: 0.95, v0: 1.9, len: 13.4 },
    rows: [{ row: 0, type: 'x1' }, { row: 1, type: 'x16', gpu: true }, { row: 3, type: 'x16' }],
    m2: [[7.0, 14.6], [8.0, 20.06]],
    atx24: [23.55, 8.6], eps: [3.2, 0.7], sata: [23.55, 16.4],
    chipset: [16.6, 17.4, 4.6, 4.2],
    io: [0, 1.0, 3.4, 13.8],
    vrmLeft: [3.7, 2.2, 3.3, 10.6], vrmTop: [6.6, 1.2, 8.6, 1.9],
    battery: [17.6, 22.6],
    holes: [[0.8, 0.8], [13.4, 0.8], [23.4, 0.8], [13.4, 13.0], [23.4, 14.6], [0.8, 15.4], [0.8, 23.6], [15.0, 23.6], [23.4, 23.6]],
  },
  ITX: {
    w: 17, h: 17,
    socket: [8.4, 6.6],
    ram: { u0: 13.4, du: 0.95, v0: 1.5, len: 13.4 },
    rows: [{ row: 0, type: 'x16', gpu: true }],
    m2: [[3.8, 12.6]],
    atx24: [15.9, 1.6], eps: [4.4, 0.7], sata: [15.9, 8.4],
    chipset: null,
    io: [0, 1.0, 3.4, 13.8],
    vrmLeft: [3.6, 2.2, 1.6, 7.0], vrmTop: [5.6, 0.9, 6.0, 1.5],
    battery: null,
    holes: [[0.8, 0.5], [16.2, 0.5], [0.8, 16.2], [16.2, 16.2]],
  },
};

export function gpuRowFor(form) {
  return BOARDS[form].rows.find(r => r.gpu).row;
}

export function gpuHeight(gpu) {
  const L = gpu.specs.lengthCM;
  return L < 19.5 ? 11 : L < 26 ? 12 : 13.6;
}

export function gpuThick(gpu) {
  return Math.max(1, gpu.specs.slots || 2) * ROW_PITCH - 0.25;
}

// Tudo que depende só do gabinete.
export function caseFrame(caseSpec) {
  const { d, h, w } = caseSpec.dims;
  const t = 0.5;
  const trayZ = -w / 2 + 2.4;
  const pcbZ = trayZ + 0.65 + 0.16;
  const boardX0 = -d / 2 + 1.8;
  const top = caseSpec.psuPos === 'top';
  const boardY0 = top ? h - 11.5 : h - 4.8;
  const shroudTop = top ? 0 : 9.8;
  const inner = { x0: -d / 2 + t, x1: d / 2 - t, y0: t, y1: h - t, z0: -w / 2 + t, z1: w / 2 - t };

  const psuCenter = V(-d / 2 + t + 7.05, top ? h - t - 0.1 - 4.3 : 0.6 + 4.3, -w / 2 + t + 0.3 + 7.5);
  const openings = caseSpec.forms.includes('ATX') ? [0, 1, 2, 3, 4, 5, 6]
    : caseSpec.forms.includes('mATX') ? [0, 1, 2, 3] : [0, 1, 2];

  const fanMounts = [];
  const fz = (pcbZ + 4.7 + inner.z1) / 2;
  if (caseSpec.fanSlots.rear) {
    fanMounts.push({ id: 'rear', kind: 'rear', pos: V(inner.x0 + 1.3, top ? h - t - 8.9 - 6.4 : boardY0 - 6.6, fz), rot: new THREE.Euler(0, -Math.PI / 2, 0) });
  }
  const frontZ = (trayZ + inner.z1) / 2;
  for (let i = 0; i < (caseSpec.fanSlots.front || 0); i++) {
    fanMounts.push({ id: 'front' + i, kind: 'front', pos: V(inner.x1 - 1.3, (top ? h - t - 16 : h - t - 9) - i * 12.2, frontZ), rot: new THREE.Euler(0, Math.PI / 2, 0) });
  }
  const topZ = inner.z1 - 6.6;
  for (let i = 0; i < (caseSpec.fanSlots.top || 0); i++) {
    fanMounts.push({ id: 'top' + i, kind: 'top', pos: V(inner.x0 + 9 + i * 12.2, inner.y1 - 1.3, topZ), rot: new THREE.Euler(-Math.PI / 2, 0, 0) });
  }

  const bays35 = [];
  for (let i = 0; i < (caseSpec.bays35 || 0); i++) {
    bays35.push({ id: 'bay35_' + i, pos: V(inner.x1 - 3 - 5.6, 2.3 + i * 3.4, inner.z1 - 1 - 7.35) });
  }
  const maxBoardW = caseSpec.forms.includes('ATX') || caseSpec.forms.includes('mATX') ? 24.4 : 17;
  const frontInner = inner.x1 - 2.6;
  const b25x = (boardX0 + maxBoardW + frontInner) / 2;
  const bays25 = [];
  for (let i = 0; i < (caseSpec.bays25 || 0); i++) {
    const y = shroudTop + 6.5 + i * 11.5;
    if (y + 5 > h - 5) break;
    bays25.push({ id: 'bay25_' + i, pos: V(b25x, y, trayZ + 0.4) });
  }

  return { d, h, w, t, trayZ, pcbZ, boardX0, boardY0, shroudTop, inner, psuCenter, openings, fanMounts, bays35, bays25, top };
}

export function boardToWorld(F, u, v, z = 0) {
  return V(F.boardX0 + u, F.boardY0 - v, F.pcbZ + z);
}

export function rowY(F, r) {
  return F.boardY0 - rowV(r);
}

// Quais posições de ventoinha do topo o radiador ocupa.
export function radiatorMount(F, radiator) {
  const n = Math.round(radiator / 120);
  const tops = F.fanMounts.filter(m => m.kind === 'top').slice(0, n);
  if (tops.length < n) return null;
  const cx = tops.reduce((s, m) => s + m.pos.x, 0) / n;
  return { n, ids: tops.map(m => m.id), center: V(cx, F.inner.y1 - 1.4, tops[0].pos.z), length: n * 12 + 3.5 };
}

export function includedFanIds(F, count) {
  const order = ['rear', 'front0', 'front1', 'front2', 'top0', 'top1', 'top2'];
  const avail = new Set(F.fanMounts.map(m => m.id));
  return order.filter(id => avail.has(id)).slice(0, count);
}
