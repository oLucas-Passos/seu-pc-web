// Bancada 3D: escolher, encaixar, parafusar, ligar cabos e ligar o PC.
import { THREE, M, makeScrew, makeFan, alignYTo, setGhost, rgbMaterials, canvasTexture } from './three-util.js';
import { OrbitControls } from '../vendor/OrbitControls.js';
import { RoomEnvironment } from '../vendor/RoomEnvironment.js';
import * as MD from './models.js';
import { caseFrame, BOARDS, rowY, gpuRowFor, gpuThick, radiatorMount, includedFanIds } from './layout.js';
import { CATEGORIES, CAT_BY_ID } from './catalog.js';
import { allParts, getPart, specLine, tierLabel } from './parts.js';
import { analyze, bootCheck } from './score.js';
import { h, add, clear, icon, modal, toast, fmtBRL, confirmBox } from '../ui.js';
import { store } from '../store.js';
import { partIcon } from './part-icons.js';
import { openResults, saveBuildDialog, partDetails, presetsDialog } from './results.js';
import { openCustomEditor } from './custom-editor.js';
import { PRESETS } from './presets.js';
import { Sound } from './sound.js';

const V = (x, y, z) => new THREE.Vector3(x, y, z);
const ease = {
  out: t => 1 - Math.pow(1 - t, 3),
  inOut: t => (t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2),
};
const sleep = ms => new Promise(r => setTimeout(r, ms));
const newUid = () => 'i' + Date.now().toString(36) + Math.random().toString(36).slice(2, 6);
const emptyState = () => ({ v: 1, caseId: null, items: [], paste: false, cables: { atx24: false, eps: false, pcie: false, sata: {} }, closed: false, name: '' });

const PLACE_HINT = {
  case: '',
  psu: 'A fonte fica embaixo, na parte de trás, com a ventoinha virada para baixo para puxar ar fresco.',
  mobo: 'Alinhe a placa-mãe com os furos da bandeja e com a abertura do painel traseiro.',
  cpu: 'Repare no triângulo dourado num canto: ele mostra o lado certo. Nunca force o processador.',
  cooler: 'O cooler vai bem em cima do processador, para puxar o calor dele.',
  ram: 'O pente só entra de um jeito por causa do chanfro. Com 2 pentes, use as entradas destacadas (A2 e B2).',
  gpu: 'A placa de vídeo vai no slot comprido (PCIe x16) logo abaixo do processador.',
  storage: 'Cada tipo de disco tem seu lugar: M.2 na placa-mãe, SSD SATA preso na bandeja e HD na gaveta de baixo.',
  fan: 'Ventoinhas da frente puxam ar para dentro. A de trás e as do topo jogam o ar quente para fora.',
};

const FACTS = {
  psu: 'A fonte converte os 127/220 V da tomada em 12 V, 5 V e 3,3 V. Uma fonte ruim pode queimar o PC inteiro.',
  mobo: 'Os pinos dourados embaixo da placa (espaçadores) evitam que ela encoste no metal e dê curto.',
  cpu: 'Um processador moderno tem bilhões de transistores, cada um menor que um vírus.',
  cooler: 'Sem cooler, um processador passa de 100 °C em poucos segundos e desliga para se proteger.',
  ram: 'A RAM só guarda as coisas enquanto o PC está ligado. Desligou, ela esvazia.',
  gpu: 'Uma placa de vídeo forte tem milhares de pequenos núcleos trabalhando ao mesmo tempo para desenhar cada quadro.',
  storage: 'SSD não tem peças que se mexem; por isso é tão mais rápido e resistente que o HD.',
  fan: 'O ideal é entrar um pouco mais de ar do que sai: isso evita poeira entrando pelas frestas.',
  cables: 'Os cabos só encaixam de um jeito. Se não entrar, não force: vire o conector.',
};

export async function mount(root, params = {}) {
  /* ------------------------------ estado ------------------------------ */
  let state = loadInitialState(params);
  let activeCat = 'case';
  let mode = 'idle'; // idle | placing | fastening | animating
  let placing = null, fastening = null, selected = null;
  let F = null;
  let powered = false, bootToken = 0, fanTarget = 0, fanSpeed = 0;
  let listQuery = '', listSort = 'perf', onlyCompat = false, guideMin = window.innerWidth < 760, lastFact = null;
  let snapHintAt = 0;

  /* ------------------------------ DOM ------------------------------ */
  const canvas = h('canvas', { tabindex: '0', 'aria-label': 'Bancada 3D de montagem do computador' });
  const guideEl = h('div', { class: 'bp-guide' });
  const instrEl = h('div', { class: 'bp-instr', hidden: true });
  const selectEl = h('div', { class: 'bp-select', hidden: true });
  const failEl = h('div', { class: 'bp-fail', hidden: true });
  const emptyEl = h('div', { class: 'bp-empty', hidden: true }, h('div', {}, h('b', {}, 'Escolha um gabinete para começar'), h('span', {}, 'Ele é a "casa" onde todas as peças vão ficar.')));
  const toolsEl = h('div', { class: 'bp-tools' });
  const catsEl = h('div', { class: 'bp-cats', role: 'tablist', 'aria-label': 'Categorias de peças' });
  const listEl = h('div', { class: 'bp-list' });
  const hudEl = h('aside', { class: 'bp-right', 'aria-label': 'Desempenho do PC' });
  const stage = h('section', { class: 'bp-stage' }, canvas, emptyEl, guideEl, toolsEl, instrEl, selectEl, failEl);
  const layout = h('div', { class: 'builder' }, h('aside', { class: 'bp-left' }, catsEl, listEl), stage, hudEl);
  root.appendChild(layout);

  /* ------------------------------ three.js ------------------------------ */
  const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.05;
  const scene = new THREE.Scene();
  const pmrem = new THREE.PMREMGenerator(renderer);
  scene.environment = pmrem.fromScene(new RoomEnvironment(renderer), 0.04).texture;
  scene.add(new THREE.HemisphereLight(0xffffff, 0x2a3a33, 0.55));
  const sun = new THREE.DirectionalLight(0xffffff, 1.2);
  sun.position.set(40, 90, 70);
  scene.add(sun);
  const camera = new THREE.PerspectiveCamera(38, 1, 1, 1200);
  camera.position.set(14, 34, 118);
  const controls = new OrbitControls(camera, canvas);
  controls.target.set(0, 22, 0);
  controls.enableDamping = true;
  controls.dampingFactor = 0.09;
  controls.minDistance = 14;
  controls.maxDistance = 240;
  controls.maxPolarAngle = Math.PI * 0.6;

  const floor = new THREE.Mesh(new THREE.CircleGeometry(220, 64), new THREE.MeshStandardMaterial({ color: '#27322e', roughness: 0.92, metalness: 0 }));
  floor.rotation.x = -Math.PI / 2;
  floor.position.y = -1.2;
  scene.add(floor);
  const shadowTex = canvasTexture('contact-shadow', 256, 256, (g) => {
    const gr = g.createRadialGradient(128, 128, 10, 128, 128, 128);
    gr.addColorStop(0, 'rgba(0,0,0,0.55)'); gr.addColorStop(1, 'rgba(0,0,0,0)');
    g.fillStyle = gr; g.fillRect(0, 0, 256, 256);
  });
  const shadow = new THREE.Mesh(new THREE.PlaneGeometry(1, 1), new THREE.MeshBasicMaterial({ map: shadowTex, transparent: true, depthWrite: false }));
  shadow.rotation.x = -Math.PI / 2;
  shadow.position.y = -1.18;
  scene.add(shadow);

  const world = new THREE.Group();
  scene.add(world);
  const hotGroup = new THREE.Group();
  scene.add(hotGroup);
  let caseObj = null, monitor = null, selBox = null, pasteMesh = null;
  const objs = new Map();
  const cableMeshes = new Map();
  const rotorSet = new Set();
  const raycaster = new THREE.Raycaster();
  const ringTex = hotTexture('#ffd23a');
  const plugTex = hotTexture('#3ad7ff');

  function hotTexture(color) {
    return canvasTexture('hot-' + color, 128, 128, (g) => {
      g.strokeStyle = color; g.lineWidth = 11;
      g.beginPath(); g.arc(64, 64, 46, 0, Math.PI * 2); g.stroke();
      g.globalAlpha = 0.3; g.fillStyle = color;
      g.beginPath(); g.arc(64, 64, 40, 0, Math.PI * 2); g.fill();
      g.globalAlpha = 1;
      g.beginPath(); g.arc(64, 64, 13, 0, Math.PI * 2); g.fill();
    });
  }

  /* ------------------------------ tweens ------------------------------ */
  const tweens = [];
  function tween(duration, update, fn = ease.inOut) {
    return new Promise(res => tweens.push({ t0: performance.now(), duration, update, fn, res }));
  }
  function runTweens(now) {
    for (let i = tweens.length - 1; i >= 0; i--) {
      const tw = tweens[i];
      const p = Math.min(1, (now - tw.t0) / tw.duration);
      tw.update(tw.fn(p));
      if (p >= 1) { tweens.splice(i, 1); tw.res(); }
    }
  }

  /* ------------------------------ helpers de estado ------------------------------ */
  function loadInitialState(p) {
    if (p.preset) return emptyState();
    if (p.load) {
      const b = store.get('builds', []).find(x => x.id === p.load);
      if (b) return sanitize(JSON.parse(JSON.stringify(b.state)));
    }
    return sanitize(store.get('builder:current', null) || emptyState());
  }
  function sanitize(s) {
    const st = Object.assign(emptyState(), s || {});
    st.cables = Object.assign({ atx24: false, eps: false, pcie: false, sata: {} }, st.cables || {});
    if (st.caseId && !getPart(st.caseId)) st.caseId = null;
    st.items = (st.items || []).filter(i => getPart(i.partId));
    if (!st.caseId) st.items = [];
    return st;
  }
  function save() { store.set('builder:current', state); }
  const partOf = item => (item ? getPart(item.partId) : null);
  const itemByCat = cat => state.items.find(i => partOf(i)?.cat === cat) || null;
  const itemsByCat = cat => state.items.filter(i => partOf(i)?.cat === cat);
  const moboPart = () => partOf(itemByCat('mobo'));

  function specBuild() {
    const one = cat => { const i = itemByCat(cat); return i ? { ...partOf(i), uid: i.uid } : null; };
    const many = cat => itemsByCat(cat).map(i => ({ ...partOf(i), uid: i.uid }));
    return {
      case: getPart(state.caseId), psu: one('psu'), mobo: one('mobo'), cpu: one('cpu'), cooler: one('cooler'), gpu: one('gpu'),
      ram: many('ram'), storage: many('storage'), fans: many('fan'),
      paste: state.paste, cables: state.cables, loose: state.items.filter(i => !i.done).length,
    };
  }

  /* ------------------------------ posições de encaixe ------------------------------ */
  function sockH(mob) { return mob && (mob.specs.socket === 'AM4' || mob.specs.socket === 'AM3+') ? 0.43 : 0.32; }

  function slotDef(slotId, part) {
    if (!F) return null;
    const mob = part.cat === 'mobo' ? part : moboPart();
    const B = BOARDS[mob ? mob.specs.form : 'ATX'];
    const W = (u, v, z) => V(F.boardX0 + u, F.boardY0 - v, F.pcbZ + z);
    const def = { id: slotId, pos: null, rot: new THREE.Euler(), approach: V(0, 0, 1), dist: 10, screws: [], view: 'side' };
    const down = V(0, 0, -1);
    if (slotId === 'psu') {
      const c = F.psuCenter;
      Object.assign(def, { pos: c.clone(), dist: 18, view: 'back', placeView: 'side' });
      for (const sy of [-1, 1]) for (const sz of [-1, 1]) def.screws.push({ pos: V(-F.d / 2, c.y + sy * 3.3, c.z + sz * 6.2), axis: V(1, 0, 0) });
    } else if (slotId === 'mobo') {
      Object.assign(def, { pos: V(F.boardX0, F.boardY0, F.pcbZ), dist: 16, view: 'side' });
      def.screws = BOARDS[part.specs.form].holes.map(([u, v]) => ({ pos: W(u, v, 0.005), axis: down }));
    } else if (slotId === 'cpu') {
      Object.assign(def, { pos: W(B.socket[0], B.socket[1], sockH(mob)), dist: 7, view: 'socket', lever: true });
    } else if (slotId === 'cooler') {
      const z = sockH(mob) + 0.45;
      Object.assign(def, { pos: W(B.socket[0], B.socket[1], z), dist: 12, view: 'cooler' });
      for (const [a, b] of [[1, 1], [1, -1], [-1, 1], [-1, -1]]) def.screws.push({ pos: W(B.socket[0] + a * 3.8, B.socket[1] + b * 3.8, z + 0.73), axis: down });
      if (part.specs.kind === 'aio') {
        const rm = radiatorMount(F, part.specs.radiator);
        if (rm) for (const sx of [-1, 1]) for (const sz of [-1, 1]) def.screws.push({ pos: V(rm.center.x + sx * (rm.length / 2 - 3), F.h, rm.center.z + sz * 4.5), axis: V(0, -1, 0) });
      }
    } else if (slotId.startsWith('ram')) {
      const i = +slotId.slice(3);
      Object.assign(def, { pos: W(MD.ramSlotU(B, mob.specs, i), B.ram.v0 + B.ram.len / 2, 0.3), dist: 8, view: 'ram', clips: i });
    } else if (slotId === 'gpu') {
      const r = gpuRowFor(mob.specs.form);
      Object.assign(def, { pos: V(F.boardX0 + 4.2, rowY(F, r), F.pcbZ + 1.1), dist: 14, view: 'side' });
      const need = Math.ceil(part.specs.slots || 2);
      def.rows = Array.from({ length: need }, (_, k) => r + k);
      for (let k = 0; k < Math.min(3, need); k++) def.screws.push({ pos: V(-F.d / 2 + F.t + 0.5, rowY(F, r) - 0.75 - k * 2.032, F.pcbZ + MD.LEDGE_Z + 0.06), axis: down });
    } else if (slotId.startsWith('m2_')) {
      const [u, v] = B.m2[+slotId.slice(3)];
      Object.assign(def, { pos: W(u, v, 0.32), dist: 6, view: 'm2' });
      def.screws = [{ pos: W(u + 7.75, v, 0.41), axis: down }];
    } else if (slotId.startsWith('bay35_')) {
      const bay = F.bays35.find(b => b.id === slotId);
      Object.assign(def, { pos: bay.pos.clone(), dist: 14, view: 'lower' });
      for (const sx of [-1, 1]) def.screws.push({ pos: V(bay.pos.x + sx * 3.5, bay.pos.y - 0.1, bay.pos.z + 7.95), axis: down });
    } else if (slotId.startsWith('bay25_')) {
      const bay = F.bays25.find(b => b.id === slotId);
      Object.assign(def, { pos: V(bay.pos.x, bay.pos.y, F.trayZ + 0.42), dist: 9, view: 'tray' });
      for (const sx of [-1, 1]) for (const sy of [-1, 1]) def.screws.push({ pos: V(def.pos.x + sx * 3.6, def.pos.y + sy * 4.9, F.trayZ + 0.18), axis: down });
    } else if (slotId.startsWith('fan_')) {
      const m = F.fanMounts.find(f => f.id === slotId.slice(4));
      Object.assign(def, { pos: m.pos.clone(), rot: m.rot.clone(), dist: 9 });
      def.approach = m.kind === 'front' ? V(-1, 0, 0) : m.kind === 'rear' ? V(1, 0, 0) : V(0, -1, 0);
      def.view = m.kind === 'front' ? 'frontInside' : m.kind === 'rear' ? 'rearInside' : 'topInside';
      const q = new THREE.Quaternion().setFromEuler(m.rot);
      for (const [a, b] of [[1, 1], [1, -1], [-1, 1], [-1, -1]]) {
        def.screws.push({ pos: m.pos.clone().add(V(a * 5.25, b * 5.25, -1.27).applyQuaternion(q)), axis: V(0, 0, 1).applyQuaternion(q) });
      }
    }
    return def;
  }

  function m2BlockedByGpu(i) {
    const gi = itemByCat('gpu');
    if (!gi) return false;
    const g = partOf(gi), mob = moboPart();
    const B = BOARDS[mob.specs.form];
    const [u, v] = B.m2[i];
    const gx0 = F.boardX0 + 4.2 + MD.GPU_BRACKET_X, gx1 = gx0 + g.specs.lengthCM;
    const gy1 = rowY(F, gpuRowFor(mob.specs.form)), gy0 = gy1 - gpuThick(g);
    const mx0 = F.boardX0 + u, mx1 = mx0 + 8, my = F.boardY0 - v;
    return mx1 > gx0 && mx0 < gx1 && my + 1.1 > gy0 && my - 1.1 < gy1;
  }

  function availableSlots(part) {
    const R = reason => ({ slots: [], reason });
    if (part.cat === 'case') return { slots: ['case'] };
    const cas = getPart(state.caseId);
    if (!cas || !F) return R('Escolha um gabinete primeiro.');
    const cs = cas.specs;
    const used = new Set(state.items.map(i => i.slot));
    const mob = moboPart();
    const single = slot => {
      const occ = state.items.find(i => i.slot === slot);
      return occ ? { slots: [slot], replace: occ.uid } : { slots: [slot] };
    };
    const s = part.specs;
    switch (part.cat) {
      case 'psu': return single('psu');
      case 'mobo':
        if (!cs.forms.includes(s.form)) return R(`Não cabe: o gabinete aceita ${cs.forms.join(', ')} e esta placa é ${s.form}.`);
        return single('mobo');
      case 'cpu':
        if (!mob) return R('Instale a placa-mãe primeiro.');
        if (mob.specs.socket !== s.socket) return R(`Não encaixa: o processador é ${s.socket} e a placa-mãe é ${mob.specs.socket}.`);
        return single('cpu');
      case 'cooler': {
        const cpuI = itemByCat('cpu');
        if (!cpuI) return R('Instale o processador primeiro.');
        if (!cpuI.done) return R('Trave o processador primeiro: abaixe a alavanca do soquete.');
        if (s.kind === 'aio') {
          if (!cs.radiators.includes(s.radiator)) return R(`O gabinete não tem espaço para radiador de ${s.radiator} mm.`);
          const rm = radiatorMount(F, s.radiator);
          if (!rm) return R('Faltam posições no topo do gabinete para o radiador.');
          const inc = includedFanIds(F, cs.fansIncluded);
          if (rm.ids.some(id => inc.includes(id) || used.has('fan_' + id))) return R('Há ventoinhas no topo. Remova-as para instalar o radiador.');
        } else if (s.heightCM > cs.maxCooler) {
          return R(`Alto demais: tem ${s.heightCM} cm e o gabinete aceita até ${cs.maxCooler} cm.`);
        }
        return single('cooler');
      }
      case 'ram': {
        if (!mob) return R('Instale a placa-mãe primeiro.');
        if (s.type !== mob.specs.ramType) return R(`Não encaixa: a placa-mãe usa ${mob.specs.ramType} e este pente é ${s.type}. O chanfro fica em outro lugar.`);
        const order = mob.specs.ramSlots === 4 ? [1, 3, 0, 2] : [0, 1];
        const free = order.filter(i => !used.has('ram' + i));
        if (!free.length) return R('Todas as entradas de memória estão ocupadas.');
        return { slots: free.map(i => 'ram' + i) };
      }
      case 'gpu': {
        if (!mob) return R('Instale a placa-mãe primeiro.');
        if (s.lengthCM > cs.maxGpu) return R(`Não cabe: tem ${s.lengthCM} cm e o gabinete aceita até ${cs.maxGpu} cm.`);
        const r = gpuRowFor(mob.specs.form);
        for (let k = 0; k < Math.ceil(s.slots || 2); k++) if (!F.openings.includes(r + k)) return R(`Grossa demais: ocupa ${s.slots} slots e o gabinete não tem espaço para isso.`);
        return single('gpu');
      }
      case 'storage': {
        if (s.form === 'm2') {
          if (!mob) return R('Instale a placa-mãe primeiro.');
          const n = Math.min(mob.specs.m2Slots, BOARDS[mob.specs.form].m2.length);
          if (!n) return R('Esta placa-mãe é antiga e não tem entrada M.2. Use um SSD SATA.');
          const free = []; let blocked = 0;
          for (let i = 0; i < n; i++) {
            if (used.has('m2_' + i)) continue;
            if (m2BlockedByGpu(i)) { blocked++; continue; }
            free.push('m2_' + i);
          }
          if (!free.length) return R(blocked ? 'A entrada M.2 livre está embaixo da placa de vídeo. Remova a placa de vídeo, instale o SSD e depois recoloque a placa.' : 'Todas as entradas M.2 estão ocupadas.');
          return { slots: free };
        }
        const bays = (s.form === '3.5' ? F.bays35 : [...F.bays25, ...F.bays35]).map(b => b.id).filter(id => !used.has(id));
        if (!bays.length) return R(s.form === '3.5' ? 'Não há baia livre para HD de 3,5" neste gabinete.' : 'Não há lugar livre para SSD neste gabinete.');
        return { slots: bays };
      }
      case 'fan': {
        const inc = new Set(includedFanIds(F, cs.fansIncluded));
        const cooler = partOf(itemByCat('cooler'));
        const radIds = cooler?.specs.kind === 'aio' ? (radiatorMount(F, cooler.specs.radiator)?.ids || []) : [];
        const rank = id => (id.includes('front') ? 0 : id.includes('rear') ? 1 : 2);
        const free = F.fanMounts.filter(m => !inc.has(m.id) && !radIds.includes(m.id) && !used.has('fan_' + m.id)).map(m => 'fan_' + m.id);
        if (!free.length) return R('Não há mais lugar para ventoinhas neste gabinete.');
        return { slots: free.sort((a, b) => rank(a) - rank(b)) };
      }
      default: return R('Categoria desconhecida.');
    }
  }

  /* ------------------------------ objetos 3D ------------------------------ */
  function buildPartObject(part, slotId) {
    let obj;
    switch (part.cat) {
      case 'psu': obj = MD.buildPSU(part); break;
      case 'mobo': obj = MD.buildMobo(part); break;
      case 'cpu': obj = MD.buildCPU(part); break;
      case 'cooler': {
        const ctx = {};
        if (part.specs.kind === 'aio' && F) {
          const rm = radiatorMount(F, part.specs.radiator);
          const def = slotDef('cooler', part);
          if (rm && def) ctx.radiator = { offset: rm.center.clone().sub(def.pos), length: rm.length, n: rm.n };
        }
        obj = MD.buildCooler(part, ctx);
        break;
      }
      case 'ram': obj = MD.buildRAM(part); break;
      case 'gpu': obj = MD.buildGPU(part); break;
      case 'storage':
        obj = part.specs.form === 'm2' ? MD.buildM2(part) : part.specs.form === '3.5' ? MD.buildHDD(part) : MD.buildSSD25(part, { sled: !!slotId && slotId.startsWith('bay35') });
        break;
      case 'fan': obj = MD.buildCaseFan(part); break;
      default: obj = new THREE.Group();
    }
    const holder = new THREE.Group();
    holder.add(obj);
    holder.userData.inner = obj;
    holder.userData.partId = part.id;
    return holder;
  }

  function registerRotors(obj, add = true) {
    obj.traverse(o => (o.userData.rotors || []).forEach(r => (add ? rotorSet.add(r) : rotorSet.delete(r))));
  }

  function buildWorld() {
    for (const c of [...world.children]) world.remove(c);
    clearHotspots();
    objs.clear(); cableMeshes.clear(); rotorSet.clear(); rgbMaterials.clear();
    caseObj = null; pasteMesh = null;
    if (selBox) { scene.remove(selBox); selBox = null; }
    const cas = getPart(state.caseId);
    F = cas ? caseFrame(cas.specs) : null;
    emptyEl.hidden = !!cas;
    if (!cas) { shadow.visible = false; return; }
    shadow.visible = true;
    shadow.scale.set(F.d + 30, F.w + 26, 1);
    caseObj = MD.buildCase(cas, F);
    world.add(caseObj);
    const light = cas.look.color === '#eef0f2';
    for (const id of includedFanIds(F, cas.specs.fansIncluded)) {
      const m = F.fanMounts.find(f => f.id === id);
      const fan = makeFan({ frameColor: light ? '#e9e9ec' : '#141414', bladeColor: light ? '#f2f2f2' : '#1c1c1c', rgb: ['intermediaria', 'avancada', 'topo'].includes(cas.tier) ? '#3ad7ff' : null });
      fan.position.copy(m.pos);
      fan.rotation.copy(m.rot);
      caseObj.add(fan);
    }
    registerRotors(caseObj);
    for (const item of state.items) placeItemObject(item);
    refreshCovers();
    syncCables();
    if (state.paste && itemByCat('cpu')) addPasteMesh();
    caseObj.userData.sidePanel.visible = !!state.closed;
  }

  function placeItemObject(item) {
    const part = partOf(item);
    const def = slotDef(item.slot, part);
    const holder = buildPartObject(part, item.slot);
    holder.position.copy(def.pos);
    holder.rotation.copy(def.rot);
    holder.userData.uid = item.uid;
    world.add(holder);
    objs.set(item.uid, holder);
    registerRotors(holder);
    const done = item.done ? def.screws.map((_, i) => i) : (item.sdone || []);
    holder.updateMatrixWorld(true);
    for (const i of done) {
      const s = def.screws[i];
      if (!s) continue;
      const sc = makeScrew();
      alignYTo(sc, s.axis.clone().negate());
      sc.position.copy(s.pos);
      holder.attach(sc);
    }
    if (part.cat === 'mobo') applyMoboState();
    return holder;
  }

  function moboInner() {
    const mi = itemByCat('mobo');
    return mi ? objs.get(mi.uid)?.userData.inner : null;
  }

  function applyMoboState() {
    const mob = moboInner();
    if (!mob) return;
    const cpuI = itemByCat('cpu');
    mob.userData.lever.rotation.x = cpuI && cpuI.done ? 0 : 1.75;
    const used = new Set(state.items.map(i => i.slot));
    mob.userData.ramLatches.forEach((latches, i) => latches.forEach(p => { p.rotation.x = used.has('ram' + i) ? 0 : p.userData.openAngle; }));
  }

  function refreshCovers() {
    if (!caseObj) return;
    const gi = itemByCat('gpu');
    const rows = gi ? slotDef('gpu', partOf(gi)).rows : [];
    for (const [r, cover] of caseObj.userData.slotCovers) cover.visible = !rows.includes(r);
  }

  function addPasteMesh() {
    const ci = itemByCat('cpu');
    const obj = ci && objs.get(ci.uid);
    if (!obj) return null;
    if (pasteMesh) pasteMesh.parent?.remove(pasteMesh);
    pasteMesh = MD.buildPaste();
    pasteMesh.position.set(0, 0, 0.44);
    obj.userData.inner.add(pasteMesh);
    return pasteMesh;
  }

  /* ------------------------------ câmera ------------------------------ */
  function viewPose(name) {
    if (!F) return { pos: V(14, 34, 118), target: V(0, 22, 0) };
    const { d, h: H, w } = F;
    const mob = moboPart();
    const B = BOARDS[mob ? mob.specs.form : 'ATX'];
    const bc = V(F.boardX0 + B.w / 2, F.boardY0 - B.h / 2, F.pcbZ);
    const sock = V(F.boardX0 + B.socket[0], F.boardY0 - B.socket[1], F.pcbZ);
    const size = Math.max(d, H);
    let v;
    switch (name) {
      case 'board': v = { pos: bc.clone().add(V(6, 4, 46)), target: bc }; break;
      case 'socket': v = { pos: sock.clone().add(V(8, 5, 24)), target: sock }; break;
      case 'cooler': v = { pos: sock.clone().add(V(20, 2, 38)), target: sock.clone().add(V(0, 0, 4)) }; break;
      case 'ram': { const t = V(F.boardX0 + B.ram.u0 + 1.4, F.boardY0 - B.ram.v0 - B.ram.len / 2, F.pcbZ + 1); v = { pos: t.clone().add(V(13, 6, 27)), target: t }; break; }
      case 'm2': v = { pos: bc.clone().add(V(3, -3, 32)), target: bc.clone().add(V(-1, -3, 0)) }; break;
      case 'back': v = { pos: V(-d / 2 - 60, H * 0.38, 34), target: V(-d / 2, H * 0.3, 0) }; break;
      case 'lower': v = { pos: V(d * 0.22, 15, w / 2 + 44), target: V(d * 0.2, 5, 0) }; break;
      case 'tray': v = { pos: V(d * 0.3, H * 0.48, w / 2 + 40), target: V(d * 0.24, H * 0.42, F.trayZ) }; break;
      case 'frontInside': v = { pos: V(-8, H * 0.5, w / 2 + 50), target: V(d / 2 - 2, H * 0.5, 0) }; break;
      case 'rearInside': v = { pos: V(12, H * 0.72, w / 2 + 44), target: V(-d / 2 + 2, H * 0.74, 0) }; break;
      case 'topInside': v = { pos: V(0, H * 0.3, w / 2 + 48), target: V(0, H - 2, 0) }; break;
      case 'front': v = { pos: V(d / 2 + size * 1.25, H * 0.62, w / 2 + 34), target: V(0, H * 0.45, 0) }; break;
      case 'boot': v = { pos: V(-16, H * 0.8, w / 2 + size * 2.1), target: V(-d / 2 - 12, H * 0.5, 0) }; break;
      default: v = { pos: V(5, H * 0.58, w / 2 + size * 1.95), target: V(0, H * 0.46, 0) };
    }
    const aspect = camera.aspect || 1.5;
    const k = Math.pow(Math.max(1, 1.35 / aspect), 0.85);
    if (k > 1) v.pos = v.target.clone().add(v.pos.clone().sub(v.target).multiplyScalar(k));
    return v;
  }

  function goView(name, dur = 800) {
    const v = viewPose(name);
    const p0 = camera.position.clone(), t0 = controls.target.clone();
    return tween(dur, t => { camera.position.lerpVectors(p0, v.pos, t); controls.target.lerpVectors(t0, v.target, t); });
  }

  /* ------------------------------ pontos clicáveis ------------------------------ */
  function addHotspot(pos, onClick, kind = 'screw', label = '') {
    const s = new THREE.Sprite(new THREE.SpriteMaterial({ map: kind === 'cable' ? plugTex : ringTex, depthTest: false, transparent: true }));
    const base = { screw: 1.5, lever: 2.0, cable: 2.4, paste: 2.6 }[kind] || 1.6;
    s.position.copy(pos);
    s.scale.setScalar(base);
    s.renderOrder = 999;
    s.userData = { onClick, kind, base, label };
    hotGroup.add(s);
    return s;
  }
  function removeHotspot(s) { if (s) { hotGroup.remove(s); s.material.dispose(); } }
  function clearHotspots() { for (const s of [...hotGroup.children]) removeHotspot(s); }

  /* ------------------------------ colocar peça ------------------------------ */
  function cancelModes() {
    if (placing) {
      for (const g of placing.ghosts) world.remove(g);
      world.remove(placing.obj);
      placing = null;
    }
    if (fastening) {
      if (fastening.screws) for (const s of fastening.screws) if (!s.done) world.remove(s.mesh);
      fastening = null;
    }
    clearHotspots();
    mode = 'idle';
    controls.mouseButtons.LEFT = THREE.MOUSE.ROTATE;
    controls.touches.ONE = THREE.TOUCH.ROTATE;
    canvas.className = '';
    deselect();
    renderInstr();
  }

  async function requestInstall(part) {
    if (mode === 'animating') return;
    if (powered) powerOff();
    hideFail();
    if (part.cat === 'case') return setCase(part);
    const av = availableSlots(part);
    if (av.reason) { toast(av.reason, 'bad', 4600); return; }
    if (av.replace) {
      const old = partOf(state.items.find(i => i.uid === av.replace));
      const deps = dependents(state.items.find(i => i.uid === av.replace));
      const extra = deps.length ? ` Isso também tira: ${deps.map(d => partOf(d).name).join(', ')}.` : '';
      const ok = await confirmBox('Trocar peça', `Trocar ${old.name} por ${part.name}?${extra}`, { ok: 'Trocar' });
      if (!ok) return;
      removeItem(av.replace);
      return requestInstall(part);
    }
    if (part.cat === 'cooler' && !state.paste) {
      const res = await modal({
        title: 'Esqueceu a pasta térmica?',
        body: h('p', {}, 'A pasta térmica preenche os micro-espaços entre o processador e o cooler, para o calor passar. Sem ela o processador esquenta muito e perde desempenho.'),
        actions: [{ label: 'Instalar sem pasta', value: 'skip' }, { label: 'Aplicar pasta agora', value: 'paste', kind: 'primary' }],
      }).result;
      if (!res) return;
      if (res === 'paste') { await applyPaste(); await sleep(300); }
    }
    startPlacing(part, av.slots);
  }

  function startPlacing(part, slotIds) {
    cancelModes();
    const slots = slotIds.map(id => ({ id, def: slotDef(id, part) }));
    const ghosts = slots.map((s, i) => {
      const g = buildPartObject(part, s.id);
      setGhost(g, M.ghost());
      g.position.copy(s.def.pos);
      g.rotation.copy(s.def.rot);
      g.userData.slotIndex = i;
      world.add(g);
      return g;
    });
    const obj = buildPartObject(part, slots[0].id);
    obj.rotation.copy(slots[0].def.rot);
    world.add(obj);
    placing = { part, slots, ghosts, obj, snapped: null, target: new THREE.Vector3(), started: false };
    mode = 'placing';
    controls.mouseButtons.LEFT = null;
    controls.touches.ONE = null;
    const def0 = slots[0].def;
    goView(def0.placeView || def0.view).then(() => {
      if (!placing || placing.started) return;
      // a peça começa no canto da tela, perto de quem está montando
      const p = planePoint(0.22, 0.7);
      if (p) { placing.obj.position.copy(p); placing.target.copy(p); }
    });
    obj.position.copy(def0.pos.clone().add(def0.approach.clone().multiplyScalar(def0.dist + 10)).add(V(-8, -4, 0)));
    placing.target.copy(obj.position);
    renderInstr();
    renderList();
  }

  function dragPlane() {
    const def = (placing.snapped ?? placing.slots[0]).def;
    const anchor = def.pos.clone().add(def.approach.clone().multiplyScalar(def.dist));
    const n = camera.getWorldDirection(new THREE.Vector3()).negate();
    return new THREE.Plane().setFromNormalAndCoplanarPoint(n, anchor);
  }
  function planePoint(nx, ny) {
    raycaster.setFromCamera(new THREE.Vector2(nx * 2 - 1, -(ny * 2 - 1)), camera);
    const out = new THREE.Vector3();
    return raycaster.ray.intersectPlane(dragPlane(), out) ? out : null;
  }

  function toScreen(v) {
    const p = v.clone().project(camera);
    const r = canvas.getBoundingClientRect();
    return { x: (p.x + 1) / 2 * r.width, y: (1 - p.y) / 2 * r.height, behind: p.z > 1 };
  }

  function updatePlacing(ev) {
    if (!placing) return;
    const r = canvas.getBoundingClientRect();
    const px = ev.clientX - r.left, py = ev.clientY - r.top;
    placing.started = true;
    let best = null, bestD = 1e9;
    for (const s of placing.slots) {
      const a = toScreen(s.def.pos);
      const b = toScreen(s.def.pos.clone().add(s.def.approach.clone().multiplyScalar(s.def.dist)));
      const dd = Math.min(Math.hypot(a.x - px, a.y - py), Math.hypot(b.x - px, b.y - py));
      if (dd < bestD) { bestD = dd; best = s; }
    }
    const snapPx = Math.max(70, Math.min(r.width, r.height) * 0.1);
    const prev = placing.snapped;
    placing.snapped = bestD < snapPx ? best : null;
    if (placing.snapped) {
      const d = placing.snapped.def;
      placing.target.copy(d.pos.clone().add(d.approach.clone().multiplyScalar(d.dist)));
      placing.obj.rotation.copy(d.rot);
    } else {
      const p = planePoint(px / r.width, py / r.height);
      if (p) placing.target.copy(p);
    }
    if (prev !== placing.snapped) {
      placing.ghosts.forEach((g, i) => setGhost(g, placing.snapped && placing.slots[i] === placing.snapped ? M.ghostHot() : M.ghost()));
      if (placing.snapped) Sound.click();
      renderInstr();
    }
  }

  async function install(slot) {
    const { part, obj } = placing;
    const def = slot.def;
    for (const g of placing.ghosts) world.remove(g);
    placing = null;
    mode = 'animating';
    controls.mouseButtons.LEFT = THREE.MOUSE.ROTATE;
    controls.touches.ONE = THREE.TOUCH.ROTATE;
    instrEl.hidden = true;
    let holder = obj;
    if (part.cat === 'storage' && part.specs.form === '2.5' && slot.id.startsWith('bay35')) {
      world.remove(obj);
      holder = buildPartObject(part, slot.id);
      holder.position.copy(obj.position);
      world.add(holder);
    }
    const item = { uid: newUid(), partId: part.id, slot: slot.id, done: false, sdone: [] };
    holder.userData.uid = item.uid;
    holder.rotation.copy(def.rot);
    objs.set(item.uid, holder);
    registerRotors(holder);
    const start = holder.position.clone();
    const appr = def.pos.clone().add(def.approach.clone().multiplyScalar(def.dist));
    await tween(320, t => holder.position.lerpVectors(start, appr, t));
    await tween(480, t => holder.position.lerpVectors(appr, def.pos, t), ease.out);
    Sound.snap();
    state.items.push(item);
    if (part.cat === 'gpu') refreshCovers();
    if (part.cat === 'ram') animateLatches(def.clips, true);
    if (part.cat === 'storage' && part.specs.form === '2.5' && slot.id.startsWith('bay35')) toast('O SSD de 2,5" foi preso na gaveta de 3,5" com um adaptador.', 'ok');
    save();
    mode = 'idle';
    if (def.lever) startLever(item);
    else if (def.screws.length) startFastening(item);
    else { item.done = true; save(); showFact(part.cat); }
    refreshAll();
  }

  function animateLatches(i, close) {
    const mob = moboInner();
    const latches = mob?.userData.ramLatches[i];
    if (!latches) return;
    for (const p of latches) {
      const a0 = p.rotation.x, a1 = close ? 0 : p.userData.openAngle;
      tween(250, t => { p.rotation.x = a0 + (a1 - a0) * t; });
    }
    if (close) setTimeout(() => Sound.snap(), 200);
  }

  /* ------------------------------ parafusos ------------------------------ */
  function startFastening(item) {
    const part = partOf(item);
    const def = slotDef(item.slot, part);
    mode = 'fastening';
    const done = new Set(item.sdone || []);
    const screws = def.screws.map((s, i) => {
      if (done.has(i)) return { def: s, done: true };
      const sc = makeScrew();
      alignYTo(sc, s.axis.clone().negate());
      sc.position.copy(s.pos.clone().sub(s.axis.clone().multiplyScalar(2.2)));
      world.add(sc);
      return { def: s, mesh: sc, done: false, hs: addHotspot(s.pos, () => fasten(i), 'screw') };
    });
    fastening = { item, screws };
    canvas.className = 'screw';
    goView(def.view);
    renderInstr();
    renderList();
  }

  async function fasten(i) {
    const f = fastening;
    const s = f?.screws[i];
    if (!s || s.done) return;
    s.done = true;
    removeHotspot(s.hs);
    const start = s.mesh.position.clone();
    const q0 = s.mesh.quaternion.clone();
    Sound.screw();
    await tween(560, t => {
      s.mesh.position.lerpVectors(start, s.def.pos, t);
      s.mesh.quaternion.copy(q0).multiply(new THREE.Quaternion().setFromAxisAngle(V(0, 1, 0), -t * Math.PI * 8));
    });
    const holder = objs.get(f.item.uid);
    if (holder) holder.attach(s.mesh);
    f.item.sdone = [...new Set([...(f.item.sdone || []), i])];
    save();
    if (fastening !== f) return;
    renderInstr();
    if (f.screws.every(x => x.done)) finishFastening();
  }

  function finishFastening() {
    const item = fastening.item;
    item.done = true;
    fastening = null;
    mode = 'idle';
    canvas.className = '';
    clearHotspots();
    save();
    const p = partOf(item);
    toast(`${p.name}: bem preso!`, 'ok');
    showFact(p.cat);
    refreshAll();
  }

  async function fastenAll() {
    const f = fastening;
    if (!f || !f.screws) return;
    for (let i = 0; i < f.screws.length; i++) {
      if (fastening !== f) return;
      if (!f.screws[i].done) { fasten(i); await sleep(140); }
    }
  }

  function startLever(item) {
    const mob = moboInner();
    if (!mob) return;
    mode = 'fastening';
    const lever = mob.userData.lever;
    lever.updateMatrixWorld(true);
    const tip = lever.localToWorld(mob.userData.leverTip.clone());
    const hs = addHotspot(tip, () => closeLever(), 'lever');
    fastening = { item, lever: true, hs };
    canvas.className = 'point';
    goView('socket');
    renderInstr();
    renderList();
  }

  async function closeLever() {
    const f = fastening;
    if (!f || !f.lever) return;
    removeHotspot(f.hs);
    const lever = moboInner().userData.lever;
    const a0 = lever.rotation.x;
    await tween(420, t => { lever.rotation.x = a0 * (1 - t); });
    Sound.snap();
    f.item.done = true;
    fastening = null;
    mode = 'idle';
    canvas.className = '';
    save();
    toast('Processador travado no soquete.', 'ok');
    showFact('cpu');
    refreshAll();
  }

  async function applyPaste() {
    const ci = itemByCat('cpu');
    if (!ci || state.paste) return;
    if (!ci.done) { toast('Primeiro abaixe a alavanca para travar o processador.', 'warn'); return; }
    clearHotspots();
    state.paste = true;
    save();
    await goView('socket', 500);
    const m = addPasteMesh();
    if (m) await tween(600, t => m.scale.set(0.01 + t, 0.01 + t, 0.22 * (0.05 + t)), ease.out);
    toast('Pasta térmica aplicada: uma bolinha do tamanho de um grão de ervilha no centro basta.', 'ok', 4200);
    refreshAll();
  }

  /* ------------------------------ cabos ------------------------------ */
  function cablePorts() {
    const out = [];
    const psuI = itemByCat('psu'), mobI = itemByCat('mobo');
    if (!F || !psuI || !mobI) return out;
    const mob = partOf(mobI);
    const B = BOARDS[mob.specs.form];
    const W = (u, v, z) => V(F.boardX0 + u, F.boardY0 - v, F.pcbZ + z);
    out.push({ key: 'atx24', label: 'Cabo de 24 pinos da placa-mãe', why: 'Leva energia para a placa-mãe inteira. Sem ele, nada liga.', pos: W(B.atx24[0] + 0.55, B.atx24[1] + 2.6, 0.65), r: 0.75 });
    out.push({ key: 'eps', label: 'Cabo de 8 pinos do processador (EPS)', why: 'Energia exclusiva do processador, no canto de cima da placa.', pos: W(B.eps[0], B.eps[1], 1.35), r: 0.45 });
    const gi = itemByCat('gpu');
    const g = partOf(gi);
    if (g && g.specs.power) {
      const holder = objs.get(gi.uid);
      const pp = holder?.userData.inner.userData.powerPort;
      if (pp) out.push({ key: 'pcie', label: 'Energia da placa de vídeo (PCIe)', why: 'Placas de vídeo fortes precisam de mais energia do que o slot entrega.', pos: holder.localToWorld(pp.clone()), r: 0.5 });
    }
    for (const it of state.items) {
      const p = partOf(it);
      if (p?.cat === 'storage' && p.specs.form !== 'm2') {
        out.push({ key: 'sata:' + it.uid, label: `SATA: ${p.name}`, why: 'Dois cabos: um de dados (vai na placa-mãe) e um de energia (vem da fonte).', pos: drivePort(it), r: 0.3 });
      }
    }
    return out;
  }

  function drivePort(it) {
    const p = partOf(it), pos = slotDef(it.slot, p).pos;
    if (p.specs.form === '3.5') return V(pos.x + 3, pos.y, pos.z - 7.4);
    if (it.slot.startsWith('bay35')) return V(pos.x, pos.y, pos.z - 5.2);
    return V(pos.x - 2, pos.y - 5.1, pos.z + 0.1);
  }

  const isConnected = key => (key.startsWith('sata:') ? !!state.cables.sata[key.slice(5)] : !!state.cables[key]);

  function cablePath(port) {
    const c = F.psuCenter;
    const p = port.pos;
    const sx = F.top ? c.x + 3 : c.x + 7.2;
    const sy = F.top ? c.y - 4.6 : c.y + 1.5;
    if (port.key === 'atx24') {
      return F.top
        ? [V(sx, sy, c.z - 2), V(p.x + 2.4, c.y - 9, F.trayZ + 1.6), V(p.x + 2.2, p.y + 1, p.z + 0.4), V(p.x + 0.4, p.y, p.z)]
        : [V(sx, sy, c.z - 2), V(p.x + 2.6, F.shroudTop + 1.6, F.trayZ + 1.4), V(p.x + 2.4, p.y - 1.2, p.z + 0.3), V(p.x + 0.4, p.y, p.z)];
    }
    if (port.key === 'eps') {
      return F.top
        ? [V(sx, sy, c.z - 4), V(p.x + 1, p.y + 2.5, p.z + 1.5), V(p.x, p.y + 0.4, p.z + 0.5), p.clone()]
        : [V(sx, sy, c.z - 4), V(c.x + 6, c.y + 6, F.trayZ - 0.9), V(F.boardX0 + 2.5, F.boardY0 + 1.8, F.trayZ - 0.9), V(p.x, p.y + 1.6, p.z + 0.7), p.clone()];
    }
    if (port.key === 'pcie') {
      return [V(sx, sy + 1, c.z + 3), V(p.x - 4, Math.max(F.shroudTop, p.y - 9) + 1.5, p.z + 2.6), V(p.x, p.y - 1.5, p.z + 2.6), V(p.x, p.y, p.z + 1.2), p.clone()];
    }
    const mid = V((sx + p.x) / 2, Math.min(sy, p.y) + 1.5, (c.z + p.z) / 2 + 2);
    return [V(sx, sy - 1, c.z + 1), mid, V(p.x, p.y, p.z + 1.5), p.clone()];
  }

  function makeCableMesh(port) {
    const g = new THREE.Group();
    const pts = cablePath(port);
    const curve = new THREE.CatmullRomCurve3(pts);
    const geo = new THREE.TubeGeometry(curve, 90, port.r, 10);
    const tube = new THREE.Mesh(geo, M.plastic(port.key === 'atx24' ? '#121212' : '#181818', 0.75));
    g.add(tube);
    const head = new THREE.Mesh(new THREE.BoxGeometry(port.r * 2.4, port.r * 2.4, port.r * 2.4), M.plastic('#0a0a0a', 0.5));
    head.position.copy(pts[pts.length - 1]);
    g.add(head);
    if (port.key.startsWith('sata:')) {
      const mob = moboPart();
      const B = BOARDS[mob.specs.form];
      const s = V(F.boardX0 + B.sata[0] + 0.5, F.boardY0 - B.sata[1], F.pcbZ + 0.4);
      const dp = [s, V(s.x + 2.5, s.y - 2, s.z + 1.5), V(port.pos.x + 1, port.pos.y + 1.5, port.pos.z + 1.6), port.pos.clone().add(V(1, 0, 0))];
      const data = new THREE.Mesh(new THREE.TubeGeometry(new THREE.CatmullRomCurve3(dp), 60, 0.18, 6), M.plastic('#c62828', 0.6));
      g.add(data);
    }
    g.userData = { tube, head };
    return g;
  }

  function syncCables() {
    const ports = cablePorts();
    const keys = new Set(ports.filter(p => isConnected(p.key)).map(p => p.key));
    for (const [k, m] of cableMeshes) if (!keys.has(k)) { world.remove(m); cableMeshes.delete(k); }
    for (const p of ports) if (keys.has(p.key) && !cableMeshes.has(p.key)) {
      const m = makeCableMesh(p);
      world.add(m);
      cableMeshes.set(p.key, m);
    }
    // limpa estados de cabos de peças que não existem mais
    for (const uid of Object.keys(state.cables.sata)) if (!state.items.some(i => i.uid === uid)) delete state.cables.sata[uid];
    if (!itemByCat('gpu')) state.cables.pcie = false;
    if (!itemByCat('psu')) state.cables = { atx24: false, eps: false, pcie: false, sata: {} };
    if (!itemByCat('mobo')) { state.cables.atx24 = false; state.cables.eps = false; }
  }

  async function connectCable(key) {
    const port = cablePorts().find(p => p.key === key);
    if (!port || isConnected(key) || mode === 'animating') return;
    if (key.startsWith('sata:')) state.cables.sata[key.slice(5)] = true; else state.cables[key] = true;
    save();
    const m = makeCableMesh(port);
    world.add(m);
    cableMeshes.set(key, m);
    const { tube, head } = m.userData;
    const total = tube.geometry.index.count;
    head.visible = false;
    for (const s of hotGroup.children) if (s.userData.label === key) removeHotspot(s);
    await tween(900, t => tube.geometry.setDrawRange(0, Math.floor(total * t / 6) * 6), ease.out);
    head.visible = true;
    tube.geometry.setDrawRange(0, Infinity);
    Sound.snap();
    if (cablePorts().every(p => isConnected(p.key))) { toast('Todos os cabos ligados!', 'ok'); showFact('cables'); }
    refreshAll();
  }

  function showCableHotspots() {
    for (const s of [...hotGroup.children]) if (s.userData.kind === 'cable') removeHotspot(s);
    if (mode !== 'idle' || activeCat !== 'cables') return;
    for (const p of cablePorts()) if (!isConnected(p.key)) addHotspot(p.pos, () => connectCable(p.key), 'cable', p.key);
  }

  function showPasteHotspot() {
    for (const s of [...hotGroup.children]) if (s.userData.kind === 'paste') removeHotspot(s);
    const ci = itemByCat('cpu');
    if (mode !== 'idle' || !ci || !ci.done || state.paste || itemByCat('cooler')) return;
    const obj = objs.get(ci.uid);
    if (obj) addHotspot(obj.position.clone().add(V(0, 0, 0.8)), () => applyPaste(), 'paste');
  }

  /* ------------------------------ remover / trocar ------------------------------ */
  function dependents(item) {
    const p = partOf(item);
    if (!p) return [];
    if (p.cat === 'mobo') return state.items.filter(i => ['cpu', 'cooler', 'ram', 'gpu'].includes(partOf(i)?.cat) || i.slot.startsWith('m2_'));
    if (p.cat === 'cpu') return state.items.filter(i => partOf(i)?.cat === 'cooler');
    return [];
  }

  async function requestRemove(uid) {
    const item = state.items.find(i => i.uid === uid);
    if (!item) return;
    if (powered) powerOff();
    const deps = dependents(item);
    if (deps.length) {
      const ok = await confirmBox('Remover peça', `Para tirar ${partOf(item).name} também é preciso tirar: ${deps.map(d => partOf(d).name).join(', ')}.`, { ok: 'Remover tudo', danger: true });
      if (!ok) return;
    }
    if (fastening?.item.uid === uid || placing) cancelModes();
    removeItem(uid);
    refreshAll();
  }

  function removeItem(uid) {
    const item = state.items.find(i => i.uid === uid);
    if (!item) return;
    for (const d of dependents(item)) removeItem(d.uid);
    const p = partOf(item);
    const obj = objs.get(uid);
    if (obj) { registerRotors(obj, false); world.remove(obj); objs.delete(uid); }
    state.items = state.items.filter(i => i.uid !== uid);
    if (p?.cat === 'cpu') { state.paste = false; pasteMesh = null; }
    if (p?.cat === 'ram') animateLatches(+item.slot.slice(3), false);
    if (p?.cat === 'gpu') refreshCovers();
    if (p?.cat === 'cpu') { const mob = moboInner(); if (mob) tween(300, t => { mob.userData.lever.rotation.x = 1.75 * t; }); }
    if (selected === uid) deselect();
    syncCables();
    save();
  }

  async function setCase(part) {
    if (state.caseId === part.id) { toast('Este gabinete já está em uso.', 'ok'); return; }
    cancelModes();
    if (powered) powerOff();
    const old = state.items.map(i => ({ ...i }));
    const oldCables = { ...state.cables };
    state.caseId = part.id;
    state.items = [];
    state.closed = false;
    F = caseFrame(part.specs);
    const dropped = [];
    const order = ['psu', 'mobo', 'cpu', 'cooler', 'ram', 'storage', 'gpu', 'fan'];
    old.sort((a, b) => order.indexOf(partOf(a).cat) - order.indexOf(partOf(b).cat));
    for (const it of old) {
      const p = partOf(it);
      const ok = autoInstall(p, it.done);
      if (!ok) dropped.push(p.name);
    }
    state.cables = { atx24: !!oldCables.atx24, eps: !!oldCables.eps, pcie: !!oldCables.pcie, sata: {} };
    if (!itemByCat('cpu')) state.paste = false;
    buildWorld();
    save();
    if (caseObj) {
      caseObj.position.y = 26;
      tween(700, t => { caseObj.position.y = 26 * (1 - t); }, ease.out).then(() => Sound.snap());
    }
    goView('side');
    if (dropped.length) toast(`Não couberam no novo gabinete e foram retiradas: ${dropped.join(', ')}.`, 'warn', 6000);
    activeCat = nextStep().tab || 'psu';
    refreshAll();
  }

  function autoInstall(part, done = true) {
    const av = availableSlots(part);
    if (!av.slots || !av.slots.length || av.replace) return null;
    const slot = av.slots[0];
    const def = slotDef(slot, part);
    const item = { uid: newUid(), partId: part.id, slot, done, sdone: done ? def.screws.map((_, i) => i) : [] };
    state.items.push(item);
    return item;
  }

  function loadPreset(preset) {
    cancelModes();
    if (powered) powerOff();
    state = emptyState();
    state.name = preset.name;
    const cas = getPart(preset.parts.case);
    state.caseId = cas.id;
    F = caseFrame(cas.specs);
    const P = preset.parts;
    const seq = [P.psu, P.mobo, P.cpu, P.cooler, ...(P.ram || []), ...(P.storage || []), P.gpu, ...(P.fans || [])].filter(Boolean);
    for (const id of seq) {
      const p = getPart(id);
      if (!p || !autoInstall(p)) console.warn('Não coube no exemplo:', id);
    }
    state.paste = true;
    state.cables = { atx24: true, eps: true, pcie: true, sata: {} };
    for (const it of state.items) { const p = partOf(it); if (p.cat === 'storage' && p.specs.form !== 'm2') state.cables.sata[it.uid] = true; }
    buildWorld();
    save();
    goView('side');
    activeCat = 'cables';
    refreshAll();
    toast(`Exemplo carregado: ${preset.name}. Aperte "Ligar o PC" para testar.`, 'ok', 4500);
  }

  async function newBuild() {
    if (state.items.length || state.caseId) {
      const ok = await confirmBox('Começar um PC novo', 'A montagem atual será descartada. Se quiser guardá-la, use "Salvar" antes.', { ok: 'Começar do zero', danger: true });
      if (!ok) return;
    }
    cancelModes();
    if (powered) powerOff();
    state = emptyState();
    buildWorld();
    save();
    activeCat = 'case';
    goView('side');
    refreshAll();
  }

  /* ------------------------------ seleção ------------------------------ */
  function select(uid) {
    deselect();
    const obj = objs.get(uid);
    if (!obj) return;
    selected = uid;
    selBox = new THREE.BoxHelper(obj, 0xffd23a);
    selBox.material.depthTest = false;
    selBox.renderOrder = 998;
    scene.add(selBox);
    renderSelect();
  }
  function deselect() {
    selected = null;
    if (selBox) { scene.remove(selBox); selBox = null; }
    selectEl.hidden = true;
  }

  /* ------------------------------ ligar o PC ------------------------------ */
  function ensureMonitor() {
    if (!F) return;
    if (!monitor) {
      monitor = MD.buildMonitor();
      scene.add(monitor);
    }
    monitor.position.set(-F.d / 2 - 36, -1.2, -8);
    monitor.rotation.y = 0.32;
    monitor.visible = true;
  }

  function drawMonitor(kind, data = {}) {
    if (!monitor) return;
    const { ctx: c, canvas: cv, tex, led } = monitor.userData;
    const W = cv.width, H = cv.height;
    c.fillStyle = '#000'; c.fillRect(0, 0, W, H);
    led.emissiveIntensity = kind === 'off' ? 0 : 2;
    if (kind === 'nosignal') {
      c.fillStyle = '#0b1830'; c.fillRect(W / 2 - 230, H / 2 - 70, 460, 140);
      c.strokeStyle = '#6aa7ff'; c.lineWidth = 3; c.strokeRect(W / 2 - 230, H / 2 - 70, 460, 140);
      c.fillStyle = '#d9e6ff'; c.textAlign = 'center';
      c.font = 'bold 38px Arial'; c.fillText('Sem sinal', W / 2, H / 2 - 8);
      c.font = '22px Arial'; c.fillText('Verifique o cabo de vídeo', W / 2, H / 2 + 32);
      c.textAlign = 'left';
    } else if (kind === 'post' || kind === 'error') {
      c.fillStyle = '#d6dcd9'; c.font = '24px Consolas, monospace';
      (data.lines || []).forEach((ln, i) => c.fillText(ln, 36, 56 + i * 36));
      c.fillStyle = '#ffd23a'; c.font = 'bold 26px Consolas, monospace';
      c.fillText('SEU PC WEB BIOS', W - 290, 56);
      if (kind === 'error') {
        c.fillStyle = '#ff6b6b'; c.font = 'bold 26px Consolas, monospace';
        (data.error || []).forEach((ln, i) => c.fillText(ln, 36, H - 110 + i * 36));
      }
    } else if (kind === 'boot') {
      const s = 34, cx = W / 2, cy = H / 2 - 50;
      c.fillStyle = '#2f8cff';
      for (const [dx, dy] of [[-1, -1], [1, -1], [-1, 1], [1, 1]]) c.fillRect(cx + (dx < 0 ? -s - 3 : 3), cy + (dy < 0 ? -s - 3 : 3), s, s);
      for (let i = 0; i < 6; i++) {
        const a = (data.t || 0) * 5 - i * 0.45;
        c.globalAlpha = 1 - i * 0.14;
        c.fillStyle = '#fff';
        c.beginPath(); c.arc(cx + Math.cos(a) * 26, cy + 130 + Math.sin(a) * 26, 4.5, 0, Math.PI * 2); c.fill();
      }
      c.globalAlpha = 1;
    } else if (kind === 'ready') {
      const gr = c.createLinearGradient(0, 0, W, H);
      gr.addColorStop(0, '#0f3d6e'); gr.addColorStop(1, '#3a8fd9');
      c.fillStyle = gr; c.fillRect(0, 0, W, H);
      c.fillStyle = 'rgba(255,255,255,0.18)'; c.fillRect(0, H - 48, W, 48);
      c.fillStyle = '#fff'; c.textAlign = 'center';
      c.font = 'bold 54px Arial'; c.fillText('Seu PC ligou!', W / 2, H / 2 - 10);
      c.font = '26px Arial'; c.fillText(data.sub || 'Tudo funcionando', W / 2, H / 2 + 36);
      c.textAlign = 'left';
    }
    tex.needsUpdate = true;
  }

  function setPowerVisuals(on, fans = on) {
    fanTarget = fans ? 26 : 0;
    if (caseObj) for (const m of caseObj.userData.leds) m.emissiveIntensity = on ? 2.4 : 0;
    if (!on) for (const m of rgbMaterials) m.emissiveIntensity = 0;
  }

  function hideFail() { failEl.hidden = true; }

  function showFail(r, ok = false) {
    clear(failEl);
    failEl.className = 'bp-fail' + (ok ? ' ok' : '');
    add(failEl, 
      h('span', { class: 'silk' }, ok ? 'Ligou com avisos' : 'O que aconteceu'),
      h('h3', {}, r.title),
      h('p', {}, r.text),
      r.fix ? h('div', { class: 'fix' }, h('b', {}, 'Como resolver: '), r.fix) : null,
      h('div', { class: 'row' },
        ok ? h('button', { class: 'btn btn-primary btn-sm', onclick: () => { hideFail(); showResults(); } }, 'Ver desempenho') : null,
        h('button', { class: 'btn btn-sm', onclick: () => { hideFail(); powerOff(); } }, 'Desligar'),
      ),
    );
    failEl.hidden = false;
  }

  async function powerOn() {
    if (mode !== 'idle') cancelModes();
    if (!F) { toast('Escolha um gabinete e instale as peças primeiro.', 'warn'); return; }
    const token = ++bootToken;
    const alive = () => token === bootToken;
    const b = specBuild();
    const a = analyze(b);
    const r = bootCheck(b, a);
    hideFail();
    powered = true;
    renderHUD();
    mode = 'animating';
    // fecha a tampa lateral
    const side = caseObj.userData.sidePanel;
    if (!side.visible) {
      side.visible = true;
      state.closed = true;
      const z1 = side.position.z;
      side.position.z = z1 + 14;
      tween(600, t => { side.position.z = z1 + 14 * (1 - t); }, ease.out);
      renderTools();
    }
    ensureMonitor();
    drawMonitor('off');
    await goView('boot', 900);
    if (!alive()) return;
    mode = 'idle';
    const btn = caseObj.userData.powerButton;
    if (btn) { const y0 = btn.position.y; tween(160, t => { btn.position.y = y0 - Math.sin(t * Math.PI) * 0.2; }); }
    Sound.click();
    await sleep(350);
    if (!alive()) return;

    const postLines = buildPost(b, a);
    if (!r.ok) {
      const silent = ['no-psu', 'no-mobo', 'cable-24'].includes(r.code);
      if (silent) {
        setPowerVisuals(false);
        await sleep(600);
        if (!alive()) return;
        showFail(r);
        return;
      }
      if (r.code === 'psu-dead') {
        setPowerVisuals(true);
        await sleep(350);
        setPowerVisuals(false);
        if (!alive()) return;
        showFail(r);
        return;
      }
      setPowerVisuals(true);
      Sound.humStart();
      if (r.code === 'no-ram') {
        await sleep(500);
        const t = Sound.beepPattern([0.7, 0.7, 0.7]);
        drawMonitor('nosignal');
        await sleep(t * 1000);
      } else if (r.code === 'no-cooler') {
        drawMonitor('post', { lines: ['Seu PC Web BIOS v2.6', '', 'CPU: ' + (b.cpu?.name || '?'), 'Temperatura da CPU: 74 °C', 'Temperatura da CPU: 93 °C', 'Temperatura da CPU: 105 °C  !!!'] });
        await sleep(2600);
        if (!alive()) return;
        setPowerVisuals(false);
        Sound.humStop();
        drawMonitor('off');
      } else if (['no-storage', 'cable-sata'].includes(r.code)) {
        Sound.beep(0.15);
        for (let i = 1; i <= postLines.length; i++) {
          if (!alive()) return;
          drawMonitor('post', { lines: postLines.slice(0, i) });
          await sleep(220);
        }
        drawMonitor('error', { lines: postLines, error: ['Nenhum dispositivo de inicialização encontrado.', 'Insira um disco de boot e pressione qualquer tecla.'] });
      } else {
        await sleep(400);
        drawMonitor('nosignal');
      }
      if (!alive()) return;
      showFail(r);
      return;
    }

    setPowerVisuals(true);
    Sound.humStart();
    await sleep(500);
    Sound.beep(0.14);
    for (let i = 1; i <= postLines.length; i++) {
      if (!alive()) return;
      drawMonitor('post', { lines: postLines.slice(0, i) });
      await sleep(230);
    }
    await sleep(500);
    const t0 = performance.now();
    while (performance.now() - t0 < 2200) {
      if (!alive()) return;
      drawMonitor('boot', { t: (performance.now() - t0) / 1000 });
      await sleep(40);
    }
    drawMonitor('ready', { sub: `${a.tier.label} · nota ${a.scores.overall}` });
    Sound.chime();
    await sleep(700);
    if (!alive()) return;
    if (r.warnings.length) {
      showFail({ title: 'Funcionou, mas atenção', text: r.warnings.join(' '), fix: null }, true);
    } else {
      showResults();
    }
  }

  function buildPost(b, a) {
    const mb = a.ram.gb * 1024;
    const lines = [
      'Seu PC Web BIOS v2.6   (C) 2026',
      '',
      `Placa-mãe: ${b.mobo?.name || '-'}`,
      `Processador: ${b.cpu?.name || '-'} @ ${b.cpu?.specs.boostGHz || '?'} GHz`,
      `Memória: ${mb.toLocaleString('pt-BR')} MB ${a.ram.type}-${a.ram.mhz} ${a.ram.dual ? '(Dual Channel)' : '(Single Channel)'}  OK`,
      `Vídeo: ${b.gpu ? b.gpu.name : a.gpu.name}`,
    ];
    b.storage.forEach((s, i) => lines.push(`Disco ${i + 1}: ${s.name}`));
    const temp = Math.round(34 + (1 - a.cpuThermal) * 45 + (b.paste ? 0 : 22));
    lines.push(`Temperatura da CPU: ${temp} °C`, 'Teclado e mouse USB... OK', '', 'Pressione DEL para entrar no Setup');
    return lines;
  }

  function powerOff() {
    bootToken++;
    powered = false;
    setPowerVisuals(false);
    Sound.humStop();
    drawMonitor('off');
    hideFail();
    renderHUD();
  }

  function showResults() {
    const a = analyze(specBuild());
    openResults(a, { name: state.name, onSave: () => saveBuildDialog(state, a, n => { state.name = n; save(); }) });
  }

  function showFact(cat) {
    lastFact = FACTS[cat] || null;
    renderGuide();
  }

  /* ------------------------------ passos ------------------------------ */
  function nextStep() {
    return steps().find(s => !s.done && !s.optional) || { key: 'boot', label: 'Ligue o PC!', tab: null };
  }

  function steps() {
    const has = cat => itemsByCat(cat).length > 0;
    const allDone = cat => itemsByCat(cat).every(i => i.done);
    const cpu = partOf(itemByCat('cpu'));
    const ports = cablePorts();
    return [
      { key: 'case', label: 'Escolha o gabinete', tab: 'case', done: !!state.caseId, tip: 'O gabinete define o tamanho do PC e quais peças cabem nele.' },
      { key: 'psu', label: 'Instale a fonte', tab: 'psu', done: has('psu') && allDone('psu'), tip: 'A fonte fica embaixo, atrás, e é presa com 4 parafusos pelo lado de fora.' },
      { key: 'mobo', label: 'Prenda a placa-mãe', tab: 'mobo', done: has('mobo') && allDone('mobo'), tip: 'Ela é a base de tudo: as outras peças se encaixam nela.' },
      { key: 'cpu', label: 'Encaixe o processador', tab: 'cpu', done: has('cpu') && allDone('cpu'), tip: 'Ele precisa ter o mesmo soquete da placa-mãe.' },
      { key: 'paste', label: 'Passe a pasta térmica', tab: 'cooler', done: state.paste, hidden: !has('cpu'), optional: !has('cpu'), tip: 'Uma bolinha no centro do processador ajuda o calor a passar para o cooler.', action: 'paste' },
      { key: 'cooler', label: 'Instale o cooler', tab: 'cooler', done: has('cooler') && allDone('cooler'), tip: 'Ele fica em cima do processador e tira o calor dele.' },
      { key: 'ram', label: 'Coloque a memória RAM', tab: 'ram', done: has('ram') && allDone('ram'), tip: 'Com dois pentes iguais a memória fica mais rápida (dual channel).' },
      { key: 'storage', label: 'Instale o SSD ou HD', tab: 'storage', done: has('storage') && allDone('storage'), tip: 'É onde o Windows e seus arquivos ficam guardados.' },
      { key: 'gpu', label: 'Placa de vídeo', tab: 'gpu', done: has('gpu') && allDone('gpu'), optional: !!(cpu && cpu.specs.igpu) && !has('gpu'), tip: cpu && cpu.specs.igpu ? 'Opcional: seu processador já tem vídeo integrado.' : 'Seu processador não tem vídeo integrado: a placa de vídeo é obrigatória.' },
      { key: 'fan', label: 'Ventoinhas extras', tab: 'fan', done: has('fan'), optional: true, tip: 'Opcional: mais ventoinhas = peças mais frescas.' },
      { key: 'cables', label: 'Ligue os cabos', tab: 'cables', done: ports.length > 0 && ports.every(p => isConnected(p.key)), tip: 'Conecte a energia da placa-mãe, do processador e das outras peças.' },
    ].filter(s => !s.hidden);
  }

  /* ------------------------------ interface: categorias e lista ------------------------------ */
  function renderCats() {
    clear(catsEl);
    const tabs = [...CATEGORIES.map(c => ({ id: c.id, name: c.name })), { id: 'cables', name: 'Cabos' }];
    for (const t of tabs) {
      const has = t.id === 'case' ? !!state.caseId : t.id === 'cables' ? cablePorts().length > 0 && cablePorts().every(p => isConnected(p.key)) : itemsByCat(t.id).length > 0;
      const short = { mobo: 'Placa-mãe', storage: 'Disco', gpu: 'Vídeo', ram: 'Memória', psu: 'Fonte', cpu: 'Processador', fan: 'Ventoinha' }[t.id] || t.name;
      catsEl.appendChild(h('button', {
        class: 'bp-cat', role: 'tab', type: 'button', 'aria-selected': String(activeCat === t.id), title: t.name,
        onclick: () => { activeCat = t.id; if (placing) cancelModes(); renderList(); renderCats(); showCableHotspots(); showPasteHotspot(); },
      }, t.id === 'cables' ? cableIcon() : partIcon(t.id), short, has ? h('span', { class: 'dot', 'aria-label': 'instalado' }) : null));
    }
  }

  function cableIcon() {
    const span = document.createElement('span');
    span.innerHTML = '<svg viewBox="0 0 32 32" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round"><path d="M6 26c0-7 5-6 9-9s4-8 9-9"/><rect x="21" y="4" width="7" height="6" rx="1"/><rect x="3" y="22" width="7" height="6" rx="1"/><path d="M23 4V2M26 4V2"/></svg>';
    return span.firstChild;
  }

  function perfOf(p) {
    const s = p.specs;
    switch (p.cat) {
      case 'cpu': return (s.st / 140) * 0.5 + (s.mt / 230) * 0.5;
      case 'gpu': return s.idx / 400;
      case 'ram': return (s.gb / 32) * 0.6 + (s.mhz / 6400) * 0.4;
      case 'storage': return Math.log(s.read) / Math.log(14500);
      case 'psu': return s.watts / 1500;
      case 'cooler': return s.capacity / 340;
      case 'fan': return s.cfm / 60;
      default: return null;
    }
  }

  function renderList() {
    clear(listEl);
    if (activeCat === 'cables') return renderCableList();
    const cat = CAT_BY_ID[activeCat];
    listEl.appendChild(h('div', { class: 'bp-list-head' },
      h('span', { class: 'silk' }, cat.required ? 'Obrigatório' : 'Opcional'),
      h('h2', {}, cat.plural),
      h('p', {}, cat.short),
    ));
    if (activeCat !== 'case') {
      listEl.appendChild(h('button', { class: 'btn btn-sm', type: 'button', onclick: () => openCustomEditor({ cat: activeCat, onSave: (p) => { activeCat = p.cat; refreshAll(); toast(`Peça "${p.name}" criada! Ela já aparece na lista.`, 'ok'); } }) }, icon('plus'), 'Criar peça personalizada'));
    }
    // instaladas
    const inst = activeCat === 'case' ? (state.caseId ? [{ uid: null, partId: state.caseId, done: true }] : []) : itemsByCat(activeCat);
    if (inst.length) {
      listEl.appendChild(h('div', { class: 'installed' },
        h('span', { class: 'silk' }, activeCat === 'case' ? 'Em uso' : `Instalado (${inst.length})`),
        inst.map(it => h('div', { class: 'installed-row' },
          h('span', {}, partOf(it).name),
          it.uid && !it.done ? h('button', { class: 'btn btn-sm btn-signal', type: 'button', onclick: () => resumeFasten(it) }, 'Apertar') : null,
          it.uid ? h('button', { class: 'icon-btn', type: 'button', title: 'Remover', 'aria-label': 'Remover ' + partOf(it).name, onclick: () => requestRemove(it.uid) }, icon('trash')) : null,
        )),
      ));
    }
    const searchId = 'bp-search';
    const sortId = 'bp-sort';
    listEl.appendChild(h('div', { class: 'bp-filters' },
      h('input', { class: 'input', id: searchId, type: 'search', placeholder: 'Buscar…', value: listQuery, 'aria-label': 'Buscar peça', oninput: (e) => { listQuery = e.target.value; renderCards(); } }),
      h('select', { class: 'select input', id: sortId, 'aria-label': 'Ordenar', onchange: (e) => { listSort = e.target.value; renderCards(); } },
        h('option', { value: 'perf', selected: listSort === 'perf' }, 'Mais fortes'),
        h('option', { value: 'price', selected: listSort === 'price' }, 'Mais baratas'),
        h('option', { value: 'year', selected: listSort === 'year' }, 'Mais novas'),
      ),
      h('label', { class: 'check', style: { fontSize: '13.5px' } }, h('input', { type: 'checkbox', checked: onlyCompat, onchange: (e) => { onlyCompat = e.target.checked; renderCards(); } }), 'Só compatíveis'),
    ));
    const cards = h('div', { class: 'grid', style: { gap: '10px' } });
    listEl.appendChild(cards);
    function renderCards() {
      clear(cards);
      let parts = allParts(activeCat);
      const q = listQuery.trim().toLowerCase();
      if (q) parts = parts.filter(p => (p.name + ' ' + p.brand).toLowerCase().includes(q));
      const scored = parts.map(p => ({ p, av: availableSlots(p), perf: perfOf(p) }));
      const sorted = scored.sort((A, Bb) => listSort === 'price' ? A.p.price - Bb.p.price : listSort === 'year' ? Bb.p.year - A.p.year : (Bb.perf ?? Bb.p.price / 1000) - (A.perf ?? A.p.price / 1000));
      for (const { p, av, perf } of sorted) {
        const bad = av.reason;
        if (onlyCompat && bad) continue;
        cards.appendChild(partCard(p, av, perf));
      }
      if (!cards.children.length) cards.appendChild(h('div', { class: 'empty' }, 'Nenhuma peça encontrada.'));
    }
    renderCards();
  }

  function partCard(p, av, perf) {
    const inUse = p.cat === 'case' ? state.caseId === p.id : false;
    const bad = av.reason;
    const label = p.cat === 'case' ? (inUse ? 'Em uso' : 'Usar este') : av.replace ? 'Trocar' : 'Instalar';
    return h('article', { class: 'pc-card' + (bad ? ' incompat' : '') },
      h('div', { class: 'pc-top' },
        h('span', { class: 'pc-name' }, p.name),
        h('span', { class: 'pill ' + (p.custom ? 'signal' : p.tier === 'antiga' ? '' : 'accent') }, p.custom ? 'Sua peça' : tierLabel(p.tier)),
      ),
      h('span', { class: 'pc-sub' }, `${p.brand} · ${p.year}`),
      h('span', { class: 'pc-spec' }, specLine(p)),
      perf != null ? h('div', { class: 'pc-perf' }, h('div', { class: 'meter' }, h('i', { style: { width: Math.min(100, Math.max(3, perf * 100)) + '%' } })), h('span', {}, perf > 1.01 ? 'fora da escala' : 'potência')) : null,
      bad ? h('span', { class: 'pc-compat bad' }, bad) : (p.cat !== 'case' ? h('span', { class: 'pc-compat ok' }, av.replace ? 'Compatível (substitui a atual)' : 'Compatível') : null),
      h('div', { class: 'pc-foot' },
        h('span', { class: 'pc-price' }, fmtBRL(p.price)),
        h('button', { class: 'btn btn-sm btn-ghost', type: 'button', onclick: () => partDetails(p, { onInstall: bad ? null : () => requestInstall(p), onEdit: p.custom ? () => openCustomEditor({ edit: p, onSave: () => refreshAll() }) : null }) }, 'Detalhes'),
        h('button', { class: 'btn btn-sm btn-primary', type: 'button', disabled: !!bad || inUse, onclick: () => requestInstall(p) }, label),
      ),
    );
  }

  function renderCableList() {
    listEl.appendChild(h('div', { class: 'bp-list-head' },
      h('span', { class: 'silk' }, 'Obrigatório'),
      h('h2', {}, 'Cabos'),
      h('p', {}, 'Sem energia nada funciona. Clique em "Ligar" ou nos pontos azuis na bancada.'),
    ));
    const ports = cablePorts();
    if (!ports.length) {
      listEl.appendChild(h('div', { class: 'empty' }, 'Instale a fonte e a placa-mãe para poder ligar os cabos.'));
      return;
    }
    for (const p of ports) {
      const on = isConnected(p.key);
      listEl.appendChild(h('article', { class: 'pc-card' },
        h('div', { class: 'pc-top' }, h('span', { class: 'pc-name' }, p.label), h('span', { class: 'pill ' + (on ? 'ok' : 'warn') }, on ? 'Ligado' : 'Desligado')),
        h('span', { class: 'pc-spec' }, p.why),
        h('div', { class: 'pc-foot' }, h('span', { class: 'pc-price' }), h('button', { class: 'btn btn-sm btn-primary', type: 'button', disabled: on, onclick: () => connectCable(p.key) }, on ? 'Pronto' : 'Ligar')),
      ));
    }
    if (ports.some(p => !isConnected(p.key))) {
      listEl.appendChild(h('button', { class: 'btn btn-sm', type: 'button', onclick: async () => { for (const p of cablePorts()) if (!isConnected(p.key)) { await connectCable(p.key); } } }, 'Ligar todos os cabos'));
    }
  }

  function resumeFasten(item) {
    cancelModes();
    const def = slotDef(item.slot, partOf(item));
    if (def.lever) startLever(item); else startFastening(item);
  }

  /* ------------------------------ interface: HUD ------------------------------ */
  function renderHUD() {
    clear(hudEl);
    const a = analyze(specBuild());
    const sc = a.scores;
    const working = a.working;
    hudEl.appendChild(h('div', { class: 'hud-score' },
      h('div', { class: 'hud-big', style: { '--p': working ? sc.overall : 0 } }, h('b', {}, working ? (a.beyond.overall ? '100+' : String(sc.overall)) : '–')),
      h('div', { class: 'hud-tier' }, h('span', { class: 'silk' }, 'Nota geral'), h('b', {}, a.tier.label), h('span', {}, a.tier.text)),
    ));
    const bar = (label, key) => h('div', { class: 'hud-bar' },
      h('div', { class: 'lbl' }, h('span', {}, label), h('span', {}, working ? (a.beyond[key] ? '100+' : String(sc[key])) : '–')),
      h('div', { class: 'meter' }, h('i', { style: { width: (working ? sc[key] : 0) + '%' } })),
    );
    hudEl.appendChild(h('div', { class: 'hud-bars' }, bar('Jogos', 'games'), bar('Trabalho pesado', 'work'), bar('Dia a dia', 'daily'), bar('Multitarefa', 'multi')));

    const ratio = a.power.psuReal ? a.power.load / a.power.psuReal : 0;
    hudEl.appendChild(h('div', { class: 'hud-sec' },
      h('span', { class: 'silk' }, h('span', {}, 'Energia'), h('span', {}, a.power.psu ? `fonte ${a.power.psu} W` : 'sem fonte')),
      h('div', { class: 'hud-kv' }, h('span', {}, 'Consumo máximo estimado'), h('b', {}, `${a.power.load} W`)),
      a.power.psu ? h('div', { class: 'meter ' + (ratio > 1 ? 'bad' : ratio > 0.85 ? 'warn' : '') }, h('i', { style: { width: Math.min(100, ratio * 100) + '%' } })) : null,
      h('div', { class: 'hud-kv' }, h('span', {}, 'Fonte recomendada'), h('b', {}, `${a.power.recommended} W`)),
    ));
    hudEl.appendChild(h('div', { class: 'hud-sec' },
      h('span', { class: 'silk' }, h('span', {}, 'Preço estimado'), h('span', {}, '')),
      h('div', { class: 'hud-kv' }, h('span', {}, (() => { const n = state.items.length + (state.caseId ? 1 : 0); return n === 1 ? '1 peça' : `${n} peças`; })()), h('b', { style: { fontSize: '20px' } }, fmtBRL(a.price))),
    ));
    const st = steps();
    const nx = nextStep();
    hudEl.appendChild(h('div', { class: 'hud-sec' },
      h('span', { class: 'silk' }, h('span', {}, 'Montagem'), h('span', {}, `${st.filter(s => s.done).length}/${st.length}`)),
      h('ul', { class: 'checklist' }, st.map(s => h('li', { class: (s.done ? 'done' : s.key === nx.key ? 'next' : '') + (s.optional && !s.done ? ' opt' : '') },
        h('span', { class: 'ck' }, s.done ? icon('check') : null), h('span', {}, s.label + (s.optional && !s.done ? ' (opcional)' : ''))))),
    ));
    const alerts = [...a.issues].sort((x, y) => ['bad', 'warn', 'info'].indexOf(x.level) - ['bad', 'warn', 'info'].indexOf(y.level)).slice(0, 4);
    if (a.bottleneck) alerts.push({ level: 'info', title: 'Gargalo', text: a.bottleneck.text });
    if (alerts.length) {
      hudEl.appendChild(h('div', { class: 'hud-sec' }, h('span', { class: 'silk' }, 'Avisos'),
        h('div', { class: 'alerts' }, alerts.map(i => h('div', { class: 'alert ' + i.level }, h('b', {}, i.title), i.text)))));
    }
    hudEl.appendChild(h('div', { class: 'hud-actions' },
      h('button', { class: 'btn btn-signal btn-lg', type: 'button', onclick: () => (powered ? powerOff() : powerOn()) }, icon('power'), powered ? 'Desligar o PC' : 'Ligar o PC'),
      h('button', { class: 'btn', type: 'button', disabled: !working, onclick: showResults }, 'Ver o que este PC roda'),
      h('div', { class: 'row' },
        h('button', { class: 'btn btn-sm', type: 'button', disabled: !state.caseId, onclick: () => saveBuildDialog(state, a, n => { state.name = n; save(); }) }, icon('save'), 'Salvar'),
        h('button', { class: 'btn btn-sm', type: 'button', onclick: () => presetsDialog(PRESETS, loadPreset) }, 'Exemplos'),
      ),
      h('button', { class: 'btn btn-sm btn-ghost', type: 'button', onclick: newBuild }, 'Começar um PC novo'),
    ));
  }

  function renderGuide() {
    clear(guideEl);
    guideEl.classList.toggle('min', guideMin);
    const nx = nextStep();
    const ci = itemByCat('cpu');
    let btn = null;
    if (nx.key === 'boot') btn = h('button', { class: 'btn btn-signal btn-sm', type: 'button', onclick: () => (powered ? powerOff() : powerOn()) }, icon('power'), powered ? 'Desligar' : 'Ligar o PC');
    else if (nx.action === 'paste') btn = h('button', { class: 'btn btn-signal btn-sm', type: 'button', onclick: applyPaste, disabled: !(ci && ci.done) }, 'Aplicar pasta térmica');
    else if (nx.tab && nx.tab !== activeCat) btn = h('button', { class: 'btn btn-signal btn-sm', type: 'button', onclick: () => { activeCat = nx.tab; refreshAll(); } }, 'Ver ' + (nx.tab === 'cables' ? 'cabos' : CAT_BY_ID[nx.tab].plural.toLowerCase()));
    add(guideEl, 
      h('button', { class: 'bp-guide-toggle', type: 'button', 'aria-label': guideMin ? 'Expandir dica' : 'Recolher dica', onclick: () => { guideMin = !guideMin; renderGuide(); } }, guideMin ? '+' : '–'),
      h('span', { class: 'silk' }, nx.key === 'boot' ? 'Tudo montado' : 'Próximo passo'),
      h('b', {}, nx.label),
      h('p', {}, nx.key === 'boot' ? 'Aperte o botão de ligar e veja se o seu PC funciona.' : nx.tip),
      btn,
      lastFact ? h('p', { class: 'fact' }, h('b', { style: { fontSize: '13.5px' } }, 'Você sabia? '), lastFact) : null,
    );
  }

  function renderInstr() {
    clear(instrEl);
    if (mode === 'placing' && placing) {
      const p = placing.part;
      add(instrEl, 
        h('div', { class: 'txt' },
          h('span', {}, placing.snapped ? `Solte para encaixar ${artigo(p)} ${p.name}.` : `Leve ${artigo(p)} ${p.name} até a sombra verde e clique para encaixar.`),
          h('small', {}, (PLACE_HINT[p.cat] || '') + ' Gire a câmera com o botão direito do mouse (ou dois dedos).'),
        ),
        h('button', { class: 'btn dark', type: 'button', onclick: autoPlace }, 'Encaixar para mim'),
        h('button', { class: 'btn', type: 'button', onclick: () => { cancelModes(); refreshAll(); } }, 'Cancelar'),
      );
      instrEl.hidden = false;
    } else if (mode === 'fastening' && fastening) {
      if (fastening.lever) {
        add(instrEl, 
          h('div', { class: 'txt' }, h('span', {}, 'Abaixe a alavanca para travar o processador.'), h('small', {}, 'Clique no ponto amarelo na ponta da alavanca. Ela prende o processador sem precisar de força.')),
          h('button', { class: 'btn dark', type: 'button', onclick: closeLever }, 'Abaixar alavanca'),
        );
      } else {
        const n = fastening.screws.length, d = fastening.screws.filter(s => s.done).length;
        add(instrEl, 
          h('div', { class: 'txt' }, h('span', {}, `Aperte os parafusos: clique em cada ponto amarelo (${d}/${n}).`), h('small', {}, 'Na vida real, aperte em "X" (cantos opostos) e sem força exagerada.')),
          h('button', { class: 'btn dark', type: 'button', onclick: fastenAll }, 'Apertar todos'),
          h('button', { class: 'btn', type: 'button', onclick: () => { cancelModes(); refreshAll(); } }, 'Depois'),
        );
      }
      instrEl.hidden = false;
    } else {
      instrEl.hidden = true;
    }
  }

  function artigo(p) {
    return ['cpu', 'cooler', 'gabinete', 'fan'].includes(p.cat) ? 'o' : p.cat === 'ram' ? 'o pente' : p.cat === 'storage' ? 'o' : 'a';
  }

  async function autoPlace() {
    if (!placing) return;
    const slot = placing.slots[0];
    placing.snapped = slot;
    placing.ghosts.forEach((g, i) => setGhost(g, i === 0 ? M.ghostHot() : M.ghost()));
    const d = slot.def;
    placing.target.copy(d.pos.clone().add(d.approach.clone().multiplyScalar(d.dist)));
    placing.obj.rotation.copy(d.rot);
    await sleep(450);
    if (placing) install(slot);
  }

  function renderSelect() {
    clear(selectEl);
    const item = state.items.find(i => i.uid === selected);
    if (!item) { selectEl.hidden = true; return; }
    const p = partOf(item);
    add(selectEl, 
      h('span', { class: 'silk' }, CAT_BY_ID[p.cat].name),
      h('b', {}, p.name),
      h('span', { class: 'pc-spec' }, specLine(p)),
      h('div', { class: 'row' },
        h('button', { class: 'btn btn-sm', type: 'button', onclick: () => partDetails(p, {}) }, 'Detalhes'),
        !item.done ? h('button', { class: 'btn btn-sm btn-signal', type: 'button', onclick: () => resumeFasten(item) }, 'Apertar') : null,
        h('button', { class: 'btn btn-sm btn-danger', type: 'button', onclick: () => requestRemove(item.uid) }, icon('trash'), 'Remover'),
        h('button', { class: 'btn btn-sm btn-ghost', type: 'button', onclick: deselect }, 'Fechar'),
      ),
    );
    selectEl.hidden = false;
  }

  function renderTools() {
    clear(toolsEl);
    const tool = (label, on, pressed) => h('button', { class: 'bp-tool', type: 'button', 'aria-pressed': pressed == null ? null : String(!!pressed), onclick: on }, label);
    add(toolsEl, 
      tool('Vista lateral', () => goView('side')),
      tool('Placa-mãe', () => goView('board')),
      tool('Traseira', () => goView('back')),
      tool('Frente', () => goView('front')),
      tool('Tampa', () => toggleSide(), !!state.closed),
      tool(Sound.muted ? 'Som: desligado' : 'Som: ligado', () => { Sound.toggle(); renderTools(); }, !Sound.muted),
    );
  }

  function toggleSide() {
    if (!caseObj) return;
    const side = caseObj.userData.sidePanel;
    state.closed = !state.closed;
    const z1 = F.w / 2 - 0.2;
    if (state.closed) {
      side.visible = true;
      side.position.z = z1 + 14;
      tween(500, t => { side.position.z = z1 + 14 * (1 - t); }, ease.out);
    } else {
      tween(400, t => { side.position.z = z1 + 14 * t; }).then(() => { if (!state.closed) side.visible = false; side.position.z = z1; });
    }
    save();
    renderTools();
  }

  function refreshAll() {
    renderCats();
    renderList();
    renderHUD();
    renderGuide();
    renderInstr();
    renderTools();
    showCableHotspots();
    showPasteHotspot();
    if (selected) renderSelect();
  }

  /* ------------------------------ entrada ------------------------------ */
  let down = null;
  function ndc(ev) {
    const r = canvas.getBoundingClientRect();
    return new THREE.Vector2(((ev.clientX - r.left) / r.width) * 2 - 1, -((ev.clientY - r.top) / r.height) * 2 + 1);
  }
  function onPointerDown(ev) {
    down = { x: ev.clientX, y: ev.clientY, t: performance.now(), button: ev.button };
    if (mode === 'placing') { updatePlacing(ev); canvas.className = 'grab'; }
  }
  function onPointerMove(ev) {
    if (mode === 'placing') { updatePlacing(ev); return; }
    if (mode === 'animating') return;
    raycaster.setFromCamera(ndc(ev), camera);
    const hit = raycaster.intersectObjects(hotGroup.children, false)[0];
    if (mode === 'fastening') canvas.className = hit ? 'point' : 'screw';
    else canvas.className = hit ? 'point' : '';
  }
  function onPointerUp(ev) {
    const moved = down ? Math.hypot(ev.clientX - down.x, ev.clientY - down.y) : 0;
    const wasRight = down && down.button === 2;
    down = null;
    if (wasRight) return;
    if (mode === 'placing' && placing) {
      updatePlacing(ev);
      canvas.className = '';
      if (placing.snapped) install(placing.snapped);
      else if (moved < 6 && performance.now() - snapHintAt > 2500) { snapHintAt = performance.now(); toast('Leve a peça até a sombra verde. Quando ela ficar amarela, clique.', 'warn'); }
      return;
    }
    if (moved > 6 || mode === 'animating') return;
    raycaster.setFromCamera(ndc(ev), camera);
    const hot = raycaster.intersectObjects(hotGroup.children, false)[0];
    if (hot) { hot.object.userData.onClick(); return; }
    if (mode !== 'idle') return;
    const hits = raycaster.intersectObjects([...objs.values()], true);
    for (const hHit of hits) {
      let o = hHit.object;
      while (o && !o.userData.uid) o = o.parent;
      if (o && o.userData.uid) { select(o.userData.uid); return; }
    }
    deselect();
  }
  function onKey(ev) {
    if (ev.target && /input|textarea|select/i.test(ev.target.tagName)) return;
    if (ev.key === 'Escape') { if (mode === 'placing' || mode === 'fastening') { cancelModes(); refreshAll(); } else deselect(); }
    if ((ev.key === 'Delete' || ev.key === 'Backspace') && selected) requestRemove(selected);
  }
  canvas.addEventListener('pointerdown', onPointerDown);
  canvas.addEventListener('pointermove', onPointerMove);
  canvas.addEventListener('pointerup', onPointerUp);
  canvas.addEventListener('contextmenu', e => e.preventDefault());
  window.addEventListener('keydown', onKey);

  /* ------------------------------ laço de animação ------------------------------ */
  const ro = new ResizeObserver(() => {
    const r = stage.getBoundingClientRect();
    if (!r.width || !r.height) return;
    renderer.setSize(r.width, r.height, false);
    camera.aspect = r.width / r.height;
    camera.updateProjectionMatrix();
  });
  ro.observe(stage);

  let last = performance.now();
  renderer.setAnimationLoop((now) => {
    const dt = Math.min(0.05, (now - last) / 1000);
    last = now;
    runTweens(now);
    controls.update();
    if (placing) placing.obj.position.lerp(placing.target, 0.25);
    fanSpeed += (fanTarget - fanSpeed) * Math.min(1, dt * 1.6);
    if (fanSpeed > 0.02) for (const r of rotorSet) r.rotation.z += fanSpeed * dt;
    if (powered && fanTarget > 0) {
      let i = 0;
      for (const m of rgbMaterials) {
        m.emissive.setHSL(((now * 0.00008) + i * 0.07) % 1, 0.85, 0.5);
        m.emissiveIntensity = 1.7;
        i++;
      }
    }
    const pulse = 1 + 0.14 * Math.sin(now * 0.006);
    for (const s of hotGroup.children) s.scale.setScalar(s.userData.base * pulse);
    if (selBox) selBox.update();
    renderer.render(scene, camera);
  });

  /* ------------------------------ início ------------------------------ */
  if (params.preset) {
    state = emptyState();
    const pr = PRESETS.find(p => p.id === params.preset);
    buildWorld();
    if (pr) loadPreset(pr);
  } else {
    buildWorld();
  }
  activeCat = state.caseId ? (nextStep().tab || 'case') : 'case';
  {
    const v = viewPose(state.caseId ? 'side' : 'default');
    camera.position.copy(v.pos);
    controls.target.copy(v.target);
  }
  refreshAll();
  if (!state.caseId) toast('Comece escolhendo um gabinete na lista.', 'ok');

  return () => {
    bootToken++;
    renderer.setAnimationLoop(null);
    ro.disconnect();
    window.removeEventListener('keydown', onKey);
    controls.dispose();
    pmrem.dispose();
    renderer.dispose();
    Sound.humStop();
    rgbMaterials.clear();
  };
}
