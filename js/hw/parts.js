// Registro único de peças: catálogo oficial + peças criadas pela pessoa.
import { PARTS, TIERS } from './catalog.js';
import { store } from '../store.js';

const BY_ID = new Map(PARTS.map(p => [p.id, p]));

export function customParts() {
  return store.get('customParts', []);
}

export function allParts(cat) {
  const list = [...PARTS, ...customParts()];
  return cat ? list.filter(p => p.cat === cat) : list;
}

export function getPart(id) {
  if (!id) return null;
  return BY_ID.get(id) || customParts().find(p => p.id === id) || null;
}

export function saveCustomPart(part) {
  const list = customParts();
  const i = list.findIndex(p => p.id === part.id);
  if (i >= 0) list[i] = part; else list.push(part);
  return store.set('customParts', list);
}

export function deleteCustomPart(id) {
  store.set('customParts', customParts().filter(p => p.id !== id));
}

export function tierLabel(t) {
  return (TIERS[t] || TIERS.basica).label;
}

// Linha curta com as especificações principais, para listas e cartões.
export function specLine(p) {
  const s = p.specs || {};
  switch (p.cat) {
    case 'cpu': return `${s.cores} núcleos / ${s.threads} threads · até ${s.boostGHz} GHz · ${s.socket}${s.igpu ? ' · vídeo integrado' : ''}`;
    case 'gpu': return `${s.vram} GB de memória de vídeo · ${s.tdp} W · ${s.lengthCM} cm${s.rt ? ' · Ray Tracing' : ''}`;
    case 'ram': return `${s.type} · ${s.gb} GB · ${s.mhz} MHz${s.rgb ? ' · RGB' : ''}`;
    case 'mobo': return `${s.socket} · ${s.ramType} · ${s.form} · ${s.ramSlots} entradas de RAM · ${s.m2Slots} M.2`;
    case 'storage': return `${kindLabel(s.kind)} · ${s.gb >= 1000 ? (s.gb / 1000) + ' TB' : s.gb + ' GB'} · ${s.read.toLocaleString('pt-BR')} MB/s`;
    case 'psu': return `${s.watts} W · ${s.rating}${s.modular ? ' · modular' : ''}`;
    case 'cooler': return `${coolerKind(s.kind)} · aguenta ~${s.capacity} W${s.kind === 'aio' ? ` · radiador ${s.radiator} mm` : ` · ${s.heightCM} cm de altura`}`;
    case 'case': return `${s.forms.join(', ')} · placa de vídeo até ${s.maxGpu} cm · ${s.fansIncluded} ventoinha(s) inclusa(s)`;
    case 'fan': return `${s.size} mm · ${s.cfm} CFM · ${s.noise} dB${s.rgb ? ' · RGB' : ''}`;
    default: return '';
  }
}

export function kindLabel(kind) {
  return { hdd: 'HD mecânico', sata: 'SSD SATA', nvme: 'SSD NVMe M.2' }[kind] || kind;
}

export function coolerKind(kind) {
  return { box: 'Cooler box', tower: 'Torre a ar', dual: 'Torre dupla a ar', aio: 'Water cooler' }[kind] || kind;
}
