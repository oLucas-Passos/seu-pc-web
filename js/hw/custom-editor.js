// Editor de peças personalizadas: a pessoa cria a peça que quiser (real ou imaginária).
import { h, add, clear, modal, toast, fmtBRL, confirmBox } from '../ui.js';
import { CATEGORIES, CAT_BY_ID, PARTS } from './catalog.js';
import { saveCustomPart, deleteCustomPart, getPart, allParts } from './parts.js';
import { deriveCustomScores } from './score.js';

const SOCKETS = ['AM5', 'AM4', 'AM3+', 'LGA1851', 'LGA1700', 'LGA1200', 'LGA1151', 'LGA1150', 'LGA1155'];
const IGPU = [
  { v: 0, label: 'Não tem' }, { v: 5, label: 'Básico (só para usar o Windows)' }, { v: 13, label: 'Intermediário (jogos bem leves)' },
  { v: 28, label: 'Bom (jogos no baixo)' }, { v: 60, label: 'Ultra (imaginário)' },
];

// Campos de cada categoria. "where": specs (padrão) ou look.
const FIELDS = {
  cpu: [
    { key: 'socket', label: 'Soquete', type: 'select', options: SOCKETS, help: 'O encaixe na placa-mãe. Está na caixa do processador.' },
    { key: 'cores', label: 'Núcleos', type: 'number', min: 1, max: 512, step: 1, help: 'Quantos "cérebros" ele tem.' },
    { key: 'threads', label: 'Threads', type: 'number', min: 1, max: 1024, step: 1, help: 'Tarefas ao mesmo tempo. Normalmente o dobro dos núcleos.' },
    { key: 'baseGHz', label: 'Frequência base (GHz)', type: 'number', min: 0.5, max: 15, step: 0.1 },
    { key: 'boostGHz', label: 'Frequência turbo (GHz)', type: 'number', min: 0.5, max: 15, step: 0.1, help: 'A velocidade máxima. Pesa muito no desempenho.' },
    { key: 'tdp', label: 'Consumo típico (W)', type: 'number', min: 5, max: 2000, step: 1 },
    { key: 'tdpMax', label: 'Consumo máximo (W)', type: 'number', min: 5, max: 3000, step: 1, help: 'Quanto mais consome, mais esquenta e maior o cooler necessário.' },
    { key: 'igpu', label: 'Vídeo integrado', type: 'select', options: IGPU.map(o => o.v), labels: IGPU.map(o => o.label), num: true },
    { key: 'x3d', label: 'Tem cache 3D (V-Cache) para jogos', type: 'check' },
    { key: 'stockCooler', label: 'Vem com cooler na caixa', type: 'check' },
  ],
  gpu: [
    { key: 'chip', label: 'Fabricante do chip', type: 'select', options: ['NVIDIA', 'AMD', 'Intel', 'Outra'], help: 'Define a geração/arquitetura usada no cálculo.' },
    { key: 'vram', label: 'Memória de vídeo (GB)', type: 'number', min: 1, max: 256, step: 1, help: 'Jogos atuais pedem 8 GB ou mais.' },
    { key: 'cores', label: 'Núcleos (CUDA / stream processors)', type: 'number', min: 32, max: 100000, step: 1, help: 'Está no site do fabricante.' },
    { key: 'boostMHz', label: 'Frequência (MHz)', type: 'number', min: 200, max: 6000, step: 1 },
    { key: 'tdp', label: 'Consumo (W)', type: 'number', min: 10, max: 2000, step: 1 },
    { key: 'lengthCM', label: 'Comprimento (cm)', type: 'number', min: 10, max: 45, step: 0.1 },
    { key: 'slots', label: 'Espessura (slots)', type: 'select', options: [1, 2, 2.5, 3, 3.5, 4], num: true },
    { key: 'fans', label: 'Ventoinhas', type: 'select', options: [1, 2, 3], num: true },
    { key: 'rt', label: 'Tem Ray Tracing', type: 'check' },
    { key: 'upscale', label: 'Upscaling', type: 'select', options: ['', 'DLSS', 'DLSS 3', 'DLSS 4', 'FSR', 'FSR 4', 'XeSS'], labels: ['Nenhum', 'DLSS', 'DLSS 3', 'DLSS 4', 'FSR', 'FSR 4', 'XeSS'] },
    { key: 'power', label: 'Conector de energia', type: 'select', options: ['', '8', '2x8', '3x8', '16'], labels: ['Nenhum (só o slot)', '8 pinos', '2 × 8 pinos', '3 × 8 pinos', '16 pinos'] },
    { key: 'shroud', label: 'Cor da carcaça', type: 'color', where: 'look' },
    { key: 'accent', label: 'Cor das luzes', type: 'color', where: 'look' },
  ],
  ram: [
    { key: 'type', label: 'Tipo', type: 'select', options: ['DDR3', 'DDR4', 'DDR5'] },
    { key: 'gb', label: 'Capacidade do pente (GB)', type: 'number', min: 1, max: 512, step: 1 },
    { key: 'mhz', label: 'Velocidade (MHz)', type: 'number', min: 800, max: 12000, step: 100 },
    { key: 'cl', label: 'Latência (CL)', type: 'number', min: 6, max: 80, step: 1, help: 'Menor é melhor.' },
    { key: 'rgb', label: 'Luzes RGB', type: 'check' },
    { key: 'color', label: 'Cor do dissipador', type: 'color', where: 'look' },
  ],
  mobo: [
    { key: 'socket', label: 'Soquete', type: 'select', options: SOCKETS },
    { key: 'chipset', label: 'Chipset', type: 'text', help: 'Ex.: B650, Z790, B550.' },
    { key: 'ramType', label: 'Tipo de memória', type: 'select', options: ['DDR3', 'DDR4', 'DDR5'] },
    { key: 'form', label: 'Tamanho', type: 'select', options: ['ATX', 'mATX', 'ITX'], labels: ['ATX (grande)', 'Micro-ATX (média)', 'Mini-ITX (pequena)'] },
    { key: 'ramSlots', label: 'Entradas de memória', type: 'select', options: [2, 4], num: true },
    { key: 'maxRam', label: 'Memória máxima (GB)', type: 'number', min: 4, max: 4096, step: 4 },
    { key: 'maxRamSpeed', label: 'Memória até (MHz)', type: 'number', min: 800, max: 12000, step: 100 },
    { key: 'm2Slots', label: 'Entradas M.2', type: 'number', min: 0, max: 4, step: 1 },
    { key: 'sata', label: 'Portas SATA', type: 'number', min: 0, max: 8, step: 1 },
    { key: 'pcieGen', label: 'PCIe (geração)', type: 'number', min: 1, max: 7, step: 1 },
    { key: 'wifi', label: 'Wi-Fi', type: 'check' },
    { key: 'oc', label: 'Permite overclock', type: 'check' },
    { key: 'pcb', label: 'Cor da placa', type: 'color', where: 'look' },
    { key: 'accent', label: 'Cor dos dissipadores', type: 'color', where: 'look' },
  ],
  storage: [
    { key: 'kind', label: 'Tipo', type: 'select', options: ['hdd', 'sata', 'nvme'], labels: ['HD mecânico (3,5")', 'SSD SATA (2,5")', 'SSD NVMe M.2'] },
    { key: 'gb', label: 'Capacidade (GB)', type: 'number', min: 16, max: 200000, step: 1, help: '1 TB = 1000 GB.' },
    { key: 'read', label: 'Velocidade de leitura (MB/s)', type: 'number', min: 50, max: 50000, step: 10 },
    { key: 'gen', label: 'PCIe (só NVMe)', type: 'select', options: [0, 3, 4, 5, 6], labels: ['—', '3.0', '4.0', '5.0', '6.0'], num: true },
    { key: 'color', label: 'Cor', type: 'color', where: 'look' },
  ],
  psu: [
    { key: 'watts', label: 'Potência (W)', type: 'number', min: 100, max: 5000, step: 10 },
    { key: 'rating', label: 'Selo de eficiência', type: 'select', options: ['Sem selo', '80 Plus Bronze', '80 Plus Gold', '80 Plus Platinum'], help: 'Fontes sem selo entregam só ~60% do que prometem.' },
    { key: 'modular', label: 'Modular', type: 'check' },
    { key: 'atx3', label: 'ATX 3.0 (cabo de 16 pinos)', type: 'check' },
    { key: 'color', label: 'Cor', type: 'color', where: 'look' },
  ],
  cooler: [
    { key: 'kind', label: 'Tipo', type: 'select', options: ['box', 'tower', 'dual', 'aio'], labels: ['Cooler box', 'Torre a ar', 'Torre dupla a ar', 'Water cooler'] },
    { key: 'capacity', label: 'Aguenta processadores de até (W)', type: 'number', min: 30, max: 2000, step: 5 },
    { key: 'heightCM', label: 'Altura (cm, coolers a ar)', type: 'number', min: 4, max: 19, step: 0.1 },
    { key: 'radiator', label: 'Radiador (water cooler)', type: 'select', options: [240, 360], num: true },
    { key: 'rgb', label: 'Luzes RGB', type: 'check' },
    { key: 'fin', label: 'Cor das aletas', type: 'color', where: 'look' },
    { key: 'fan', label: 'Cor das ventoinhas', type: 'color', where: 'look' },
  ],
  case: [
    { key: 'forms', label: 'Placas-mãe aceitas', type: 'multi', options: ['ATX', 'mATX', 'ITX'] },
    { key: 'maxGpu', label: 'Placa de vídeo até (cm)', type: 'number', min: 15, max: 50, step: 0.5 },
    { key: 'maxCooler', label: 'Cooler até (cm)', type: 'number', min: 5, max: 19, step: 0.1 },
    { key: 'radiators', label: 'Radiadores aceitos', type: 'multi', options: [240, 360], num: true },
    { key: 'fansIncluded', label: 'Ventoinhas inclusas', type: 'number', min: 0, max: 7, step: 1 },
    { key: 'style', label: 'Estilo da frente', type: 'select', options: ['mesh', 'aquario', 'wood', 'classic', 'itx'], labels: ['Tela (airflow)', 'Vidro (aquário)', 'Madeira', 'Clássico bege', 'Compacto'] },
    { key: 'glass', label: 'Lateral', type: 'select', options: ['side', 'side-front', 'none'], labels: ['Vidro', 'Vidro na lateral e na frente', 'Metal'] },
    { key: 'color', label: 'Cor', type: 'color', where: 'look' },
    { key: 'accent', label: 'Cor de detalhe', type: 'color', where: 'look' },
  ],
  fan: [
    { key: 'cfm', label: 'Fluxo de ar (CFM)', type: 'number', min: 10, max: 200, step: 1, help: 'Quanto ar ela move. Mais é melhor.' },
    { key: 'noise', label: 'Ruído (dB)', type: 'number', min: 5, max: 60, step: 1 },
    { key: 'rgb', label: 'Luzes RGB', type: 'check' },
    { key: 'color', label: 'Cor da moldura', type: 'color', where: 'look' },
    { key: 'blade', label: 'Cor das pás', type: 'color', where: 'look' },
  ],
};

const clone = o => JSON.parse(JSON.stringify(o));

export function openCustomEditor({ cat = 'cpu', edit = null, onSave } = {}) {
  let draft;
  let template;
  if (edit) {
    draft = clone(edit);
    template = getPart(edit.baseId) || null;
  } else {
    template = PARTS.find(p => p.cat === cat && p.tier === 'intermediaria') || PARTS.find(p => p.cat === cat);
    draft = fromTemplate(template);
  }

  const formEl = h('div', { class: 'grid', style: { gap: '14px', minWidth: 0 } });
  const previewEl = h('aside', { class: 'card', style: { alignSelf: 'start', position: 'sticky', top: '0' } });
  const body = h('div', { class: 'grid', style: { gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 300px), 1fr))', gap: '20px', alignItems: 'start' } }, formEl, previewEl);

  function fromTemplate(t) {
    const d = clone(t);
    delete d.custom;
    d.id = null;
    d.baseId = t.id;
    d.name = t.name + ' (minha versão)';
    d.tier = 'custom';
    d.custom = true;
    d.look = d.look || {};
    if (d.cat === 'gpu' && !d.specs.chip) d.specs.chip = ['NVIDIA', 'AMD', 'Intel'].includes(t.brand) ? t.brand : 'Outra';
    return d;
  }

  function field(f) {
    const id = 'cf-' + f.key;
    const src = f.where === 'look' ? draft.look : f.top ? draft : draft.specs;
    const val = src[f.key];
    const set = (v) => { src[f.key] = v; renderPreview(); };
    let input;
    if (f.type === 'select') {
      input = h('select', { class: 'select', id, onchange: (e) => set(f.num ? Number(e.target.value) : e.target.value) },
        f.options.map((o, i) => h('option', { value: o, selected: String(val ?? '') === String(o) }, f.labels ? f.labels[i] : String(o))));
    } else if (f.type === 'check') {
      return h('label', { class: 'check', for: id }, h('input', { type: 'checkbox', id, checked: !!val, onchange: (e) => set(e.target.checked) }), f.label);
    } else if (f.type === 'multi') {
      const cur = new Set(val || []);
      return h('div', { class: 'field' }, h('span', { class: 'label' }, f.label),
        h('div', { class: 'toolbar' }, f.options.map(o => h('label', { class: 'check' },
          h('input', { type: 'checkbox', checked: cur.has(o), onchange: (e) => { if (e.target.checked) cur.add(o); else cur.delete(o); set(f.options.filter(x => cur.has(x))); } }), String(o)))));
    } else if (f.type === 'color') {
      input = h('input', { class: 'input', type: 'color', id, value: toHex(val || '#222222'), oninput: (e) => set(e.target.value) });
    } else if (f.type === 'text') {
      input = h('input', { class: 'input', id, value: val ?? '', oninput: (e) => set(e.target.value) });
    } else {
      input = h('input', { class: 'input', id, type: 'number', min: f.min, max: f.max, step: f.step, value: val ?? '', oninput: (e) => set(e.target.value === '' ? '' : Number(e.target.value)) });
    }
    return h('div', { class: 'field' }, h('label', { for: id }, f.label), input, f.help ? h('span', { class: 'help' }, f.help) : null);
  }

  function renderForm() {
    clear(formEl);
    const catId = 'cf-cat', tplId = 'cf-tpl';
    add(formEl, 
      h('div', { class: 'form-grid' },
        h('div', { class: 'field' }, h('label', { for: catId }, 'Tipo de peça'),
          h('select', { class: 'select', id: catId, disabled: !!edit, onchange: (e) => { template = PARTS.find(p => p.cat === e.target.value && p.tier === 'intermediaria') || PARTS.find(p => p.cat === e.target.value); draft = fromTemplate(template); renderForm(); renderPreview(); } },
            CATEGORIES.map(c => h('option', { value: c.id, selected: c.id === draft.cat }, c.name)))),
        h('div', { class: 'field' }, h('label', { for: tplId }, 'Começar a partir de'),
          h('select', { class: 'select', id: tplId, onchange: (e) => { const t = getPart(e.target.value); if (t) { const keepId = draft.id; template = t; draft = fromTemplate(t); if (edit) draft.id = keepId; renderForm(); renderPreview(); } } },
            PARTS.filter(p => p.cat === draft.cat).map(p => h('option', { value: p.id, selected: p.id === (template && template.id) }, p.name)))),
      ),
      h('p', { class: 'help', style: { color: 'var(--ink-2)', fontSize: '14px' } }, 'Escolha a peça mais parecida e mude o que quiser. Pode ser uma peça de verdade que você quer comprar ou uma peça imaginária, ultra forte.'),
      h('div', { class: 'form-grid' },
        field({ key: 'name', label: 'Nome', type: 'text', top: true }),
        field({ key: 'brand', label: 'Marca', type: 'text', top: true }),
        field({ key: 'year', label: 'Ano de lançamento', type: 'number', min: 1990, max: 2050, step: 1, top: true, help: 'Peças mais novas são mais eficientes.' }),
        field({ key: 'price', label: 'Preço (R$)', type: 'number', min: 0, max: 1000000, step: 10, top: true }),
      ),
      h('div', { class: 'form-grid' }, (FIELDS[draft.cat] || []).map(field)),
      h('div', { class: 'field' }, h('label', { for: 'cf-desc' }, 'Descrição (opcional)'),
        h('textarea', { class: 'textarea', id: 'cf-desc', rows: 2, oninput: (e) => { draft.desc = e.target.value; } }, draft.desc || '')),
    );
  }

  function normalized() {
    const p = clone(draft);
    const s = p.specs;
    for (const f of FIELDS[p.cat] || []) {
      if (f.type === 'number') {
        const v = Number(f.where === 'look' ? p.look[f.key] : s[f.key]);
        const c = isFinite(v) ? Math.min(f.max, Math.max(f.min, v)) : f.min;
        if (f.where === 'look') p.look[f.key] = c; else s[f.key] = c;
      }
    }
    p.year = Math.round(Math.min(2050, Math.max(1990, Number(p.year) || 2024)));
    p.price = Math.max(0, Number(p.price) || 0);
    p.name = String(p.name || '').trim() || 'Peça sem nome';
    p.brand = String(p.brand || '').trim() || 'Minha marca';
    if (p.cat === 'cpu') {
      s.threads = Math.max(s.cores, s.threads);
      s.baseGHz = Math.min(s.baseGHz, s.boostGHz);
      s.tdpMax = Math.max(s.tdp, s.tdpMax);
      s.igpuName = s.igpu ? (IGPU.find(o => o.v === s.igpu)?.label.split(' (')[0] || 'Integrado') + ' (vídeo integrado)' : undefined;
    }
    if (p.cat === 'gpu') {
      if (!s.power) s.power = null;
      if (!s.upscale) s.upscale = null;
    }
    if (p.cat === 'storage') {
      s.form = s.kind === 'hdd' ? '3.5' : s.kind === 'sata' ? '2.5' : 'm2';
      if (s.kind !== 'nvme') s.gen = 0;
      else if (!s.gen) s.gen = 4;
      if (s.kind === 'hdd') s.read = Math.min(s.read, 300);
      if (s.kind === 'sata') s.read = Math.min(s.read, 600);
      s.heatsink = s.kind === 'nvme' && s.gen >= 5;
    }
    if (p.cat === 'psu') s.realWatts = s.rating === 'Sem selo' ? Math.round(s.watts * 0.6) : s.watts;
    if (p.cat === 'cooler') {
      s.fans = s.kind === 'aio' ? s.radiator / 120 : s.kind === 'dual' ? 2 : 1;
      if (s.kind === 'box') s.heightCM = Math.min(s.heightCM, 7);
      if (s.kind === 'aio') { s.heightCM = 3.6; p.look.rgb = p.look.rgb || '#7c5cff'; }
    }
    if (p.cat === 'mobo') {
      if (p.specs.form === 'ITX') s.ramSlots = 2;
      s.m2Slots = Math.min(s.m2Slots, s.form === 'ATX' ? 4 : s.form === 'mATX' ? 2 : 1);
    }
    if (p.cat === 'case') {
      if (!s.forms || !s.forms.length) s.forms = ['ATX', 'mATX', 'ITX'];
      s.radiators = s.radiators || [];
      // gabinete precisa ter o tamanho certo para as placas que aceita
      const big = s.forms.includes('ATX') || s.forms.includes('mATX');
      const base = getPart(big ? 'case-airflow' : 'case-itx').specs;
      s.dims = clone(base.dims);
      s.dims.w = Math.max(base.dims.w, s.maxCooler + 6.5);
      s.psuPos = s.style === 'classic' ? 'top' : 'bottom';
      if (s.style === 'classic') { s.dims = { d: 42, h: 38, w: Math.max(20.5, s.maxCooler + 6.5) }; s.forms = s.forms.filter(f => f !== 'ATX'); if (!s.forms.length) s.forms = ['mATX']; s.radiators = []; }
      s.maxGpu = Math.min(s.maxGpu, s.dims.d - 3);
      s.fanSlots = s.style === 'classic' ? { front: 1, top: 0, rear: 1 } : clone(base.fanSlots);
      if (s.style === 'aquario') s.fanSlots.front = 0;
      const slots = (s.fanSlots.front || 0) + (s.fanSlots.top || 0) + (s.fanSlots.rear || 0);
      s.fansIncluded = Math.min(s.fansIncluded, slots);
      s.bays35 = big ? 2 : 0;
      s.bays25 = s.style === 'classic' ? 0 : 2;
      p.look.inner = p.look.color;
    }
    if (p.cat === 'fan') s.size = 120;
    return deriveCustomScores(p, template);
  }

  function renderPreview() {
    clear(previewEl);
    const p = normalized();
    const s = p.specs;
    const peers = allParts(p.cat).filter(x => !x.custom);
    const line = (k, v) => h('div', { class: 'hud-kv' }, h('span', {}, k), h('b', {}, v));
    add(previewEl, h('span', { class: 'silk' }, 'Prévia do desempenho'), h('h3', {}, p.name));
    if (p.cat === 'cpu') {
      const near = closest(peers, x => x.specs.mt, s.mt);
      const beats = peers.filter(x => x.specs.mt < s.mt).length;
      add(previewEl, 
        line('Desempenho em 1 núcleo', fmt(s.st)), line('Com todos os núcleos', fmt(s.mt)),
        meterRow('Jogos e programas leves', s.st / 140), meterRow('Programas pesados', s.mt / 230),
        h('p', {}, beats === peers.length ? 'Mais forte que qualquer processador do catálogo!' : `Parecido com: ${near.name}. Mais forte que ${beats} de ${peers.length} processadores do catálogo.`),
      );
    } else if (p.cat === 'gpu') {
      const near = closest(peers, x => x.specs.idx, s.idx);
      const beats = peers.filter(x => x.specs.idx < s.idx).length;
      add(previewEl, 
        line('Índice (RTX 4060 = 100)', fmt(s.idx)), meterRow('Jogos', s.idx / 400),
        h('p', {}, beats === peers.length ? 'A placa de vídeo mais forte do planeta!' : `Parecida com: ${near.name}. Mais forte que ${beats} de ${peers.length} placas do catálogo.`),
        s.vram < 8 ? h('p', { class: 'help' }, 'Com menos de 8 GB de memória de vídeo, muitos jogos novos ficam limitados.') : null,
      );
    } else if (p.cat === 'ram') {
      add(previewEl, line('Dois pentes somam', `${s.gb * 2} GB`), line('Velocidade', `${s.mhz} MHz`),
        h('p', {}, s.gb * 2 >= 32 ? 'Memória de sobra para jogos e trabalho pesado.' : s.gb * 2 >= 16 ? 'Quantidade ideal para a maioria das pessoas.' : 'Pouca memória para os dias de hoje.'));
    } else if (p.cat === 'storage') {
      add(previewEl, line('Capacidade', s.gb >= 1000 ? `${(s.gb / 1000).toLocaleString('pt-BR')} TB` : `${s.gb} GB`), line('Leitura', `${s.read.toLocaleString('pt-BR')} MB/s`),
        h('p', {}, `Cerca de ${Math.max(1, Math.round(s.read / 200))}x a velocidade de um HD comum.`));
    } else if (p.cat === 'psu') {
      add(previewEl, line('Entrega com segurança', `${s.realWatts} W`), h('p', {}, `Ideal para PCs que consomem até ~${Math.round(s.realWatts * 0.75)} W.`));
    } else if (p.cat === 'cooler') {
      add(previewEl, line('Aguenta', `${s.capacity} W`), h('p', {}, `Bom para processadores de até ${s.capacity} W de consumo máximo.`));
    } else if (p.cat === 'mobo') {
      add(previewEl, line('Soquete', s.socket), line('Memória', `${s.ramType}, até ${s.maxRam} GB`), line('Tamanho', s.form),
        h('p', {}, 'A placa-mãe não deixa o PC mais rápido sozinha, mas define quais peças você pode usar.'));
    } else if (p.cat === 'case') {
      add(previewEl, line('Aceita', s.forms.join(', ')), line('Placa de vídeo até', `${s.maxGpu} cm`), line('Ventoinhas inclusas', String(s.fansIncluded)));
    } else if (p.cat === 'fan') {
      add(previewEl, line('Fluxo de ar', `${s.cfm} CFM`), line('Ruído', `${s.noise} dB`));
    }
    add(previewEl, h('div', { class: 'hud-kv' }, h('span', {}, 'Preço'), h('b', {}, fmtBRL(p.price))));
  }

  renderForm();
  renderPreview();

  const actions = [{ label: 'Cancelar', value: null }];
  if (edit) {
    actions.push({
      label: 'Excluir peça', kind: 'danger', value: null, onClick: () => {
        confirmBox('Excluir peça', `Excluir "${edit.name}"? Montagens que usam esta peça vão perdê-la.`, { ok: 'Excluir', danger: true }).then(ok => {
          if (!ok) return;
          deleteCustomPart(edit.id);
          toast('Peça excluída.', 'ok');
          onSave && onSave(null);
          m.close();
        });
        return false;
      },
    });
  }
  actions.push({
    label: edit ? 'Salvar alterações' : 'Criar peça', kind: 'primary', value: true, onClick: () => {
      const p = normalized();
      p.id = edit ? edit.id : 'custom-' + Date.now().toString(36);
      p.custom = true;
      p.tier = 'custom';
      if (!saveCustomPart(p)) { toast('Não foi possível salvar: o navegador bloqueou o armazenamento.', 'bad'); return false; }
      onSave && onSave(p);
      return true;
    },
  });

  const m = modal({ title: edit ? 'Editar peça personalizada' : 'Criar peça personalizada', wide: true, body, actions });
  return m;
}

function closest(list, fn, v) {
  return list.reduce((best, x) => (Math.abs(fn(x) - v) < Math.abs(fn(best) - v) ? x : best), list[0]);
}
function fmt(v) { return Number(v).toLocaleString('pt-BR', { maximumFractionDigits: 0 }); }
function meterRow(label, frac) {
  return h('div', { class: 'hud-bar' },
    h('div', { class: 'lbl' }, h('span', {}, label), h('span', {}, frac > 1 ? 'fora da escala' : '')),
    h('div', { class: 'meter' }, h('i', { style: { width: Math.min(100, Math.max(2, frac * 100)) + '%' } })));
}
function toHex(c) {
  if (/^#[0-9a-f]{6}$/i.test(c)) return c;
  if (/^#[0-9a-f]{3}$/i.test(c)) return '#' + c.slice(1).split('').map(x => x + x).join('');
  return '#222222';
}

export { CAT_BY_ID };
