// Relatório do PC, detalhes de peça, salvar montagem e exemplos.
import { h, add, clear, modal, toast, fmtBRL, copyText, icon } from '../ui.js';
import { store } from '../store.js';
import { allResults, RESOLUTIONS, STATUS, APP_STATUS } from './score.js';
import { APP_CATS } from './apps-data.js';
import { CAT_BY_ID } from './catalog.js';
import { specLine, tierLabel, kindLabel, coolerKind } from './parts.js';

const SPEC_LABELS = {
  cpu: { socket: 'Soquete', cores: 'Núcleos', threads: 'Threads', baseGHz: 'Frequência base (GHz)', boostGHz: 'Frequência turbo (GHz)', tdp: 'Consumo típico (W)', tdpMax: 'Consumo máximo (W)', igpuName: 'Vídeo integrado', st: 'Desempenho em 1 núcleo', mt: 'Desempenho com todos os núcleos', x3d: 'Cache 3D (V-Cache)', stockCooler: 'Vem com cooler na caixa' },
  gpu: { vram: 'Memória de vídeo (GB)', cores: 'Núcleos (shaders)', boostMHz: 'Frequência (MHz)', tdp: 'Consumo (W)', lengthCM: 'Comprimento (cm)', slots: 'Espessura (slots)', fans: 'Ventoinhas', rt: 'Ray Tracing', upscale: 'Upscaling (DLSS/FSR/XeSS)', idx: 'Índice de desempenho (RTX 4060 = 100)', power: 'Conector de energia' },
  ram: { type: 'Tipo', gb: 'Capacidade (GB)', mhz: 'Velocidade (MHz)', cl: 'Latência (CL)', rgb: 'Luzes RGB' },
  mobo: { socket: 'Soquete', chipset: 'Chipset', ramType: 'Tipo de memória', form: 'Tamanho', ramSlots: 'Entradas de memória', maxRam: 'Memória máxima (GB)', maxRamSpeed: 'Memória até (MHz)', m2Slots: 'Entradas M.2', sata: 'Portas SATA', pcieGen: 'PCIe (geração)', wifi: 'Wi-Fi', oc: 'Permite overclock' },
  storage: { kind: 'Tipo', form: 'Formato', gb: 'Capacidade (GB)', read: 'Leitura (MB/s)', gen: 'PCIe (geração)' },
  psu: { watts: 'Potência anunciada (W)', realWatts: 'Potência real segura (W)', rating: 'Selo de eficiência', modular: 'Modular', atx3: 'ATX 3.0 (cabo de 16 pinos)' },
  cooler: { kind: 'Tipo', capacity: 'Aguenta até (W)', heightCM: 'Altura (cm)', radiator: 'Radiador (mm)', fans: 'Ventoinhas', rgb: 'Luzes RGB' },
  case: { forms: 'Placas-mãe aceitas', maxGpu: 'Placa de vídeo até (cm)', maxCooler: 'Cooler até (cm)', radiators: 'Radiadores (mm)', fansIncluded: 'Ventoinhas inclusas', glass: 'Vidro', bays35: 'Baias de HD 3,5"', bays25: 'Lugares para SSD 2,5"' },
  fan: { size: 'Tamanho (mm)', cfm: 'Fluxo de ar (CFM)', rgb: 'Luzes RGB', noise: 'Ruído (dB)' },
};

function fmtVal(key, v, cat) {
  if (v === true) return 'Sim';
  if (v === false || v == null || v === '') return 'Não';
  if (Array.isArray(v)) return v.length ? v.join(', ') : 'Nenhum';
  if (key === 'kind' && cat === 'storage') return kindLabel(v);
  if (key === 'kind' && cat === 'cooler') return coolerKind(v);
  if (key === 'glass') return { none: 'Não (metal)', side: 'Lateral', 'side-front': 'Lateral e frente' }[v] || v;
  if (key === 'power') return { 8: '8 pinos', 6: '6 pinos', '2x8': '2 × 8 pinos', '3x8': '3 × 8 pinos', 16: '16 pinos (12V-2x6)' }[v] || v;
  if (key === 'gen' && !v) return '—';
  if (typeof v === 'number') return v.toLocaleString('pt-BR', { maximumFractionDigits: 1 });
  return String(v);
}

export function partDetails(part, { onInstall, onEdit } = {}) {
  const labels = SPEC_LABELS[part.cat] || {};
  const rows = Object.entries(labels)
    .filter(([k]) => part.specs[k] !== undefined && !(k === 'igpuName' && !part.specs.igpu) && !(k === 'radiator' && part.specs.kind !== 'aio') && !(k === 'heightCM' && part.specs.kind === 'aio'))
    .map(([k, label]) => h('tr', {}, h('th', { scope: 'row' }, label), h('td', {}, fmtVal(k, part.specs[k], part.cat))));
  const actions = [{ label: 'Fechar', value: null }];
  if (onEdit) actions.push({ label: 'Editar peça', value: 'edit', onClick: onEdit });
  if (onInstall) actions.push({ label: part.cat === 'case' ? 'Usar este gabinete' : 'Instalar', value: 'install', kind: 'primary', onClick: onInstall });
  modal({
    title: part.name,
    body: h('div', { class: 'grid', style: { gap: '14px' } },
      h('div', { class: 'toolbar' },
        h('span', { class: 'pill ' + (part.custom ? 'signal' : 'accent') }, part.custom ? 'Peça personalizada' : tierLabel(part.tier)),
        h('span', { class: 'pill' }, CAT_BY_ID[part.cat].name),
        h('span', { class: 'pill' }, `${part.brand} · ${part.year}`),
        h('span', { class: 'pill' }, fmtBRL(part.price)),
      ),
      h('p', {}, part.desc || 'Sem descrição.'),
      h('div', { class: 'table-wrap' }, h('table', { class: 'data' }, h('tbody', {}, rows))),
      h('p', { class: 'silk' }, 'Preço aproximado, apenas para comparação.'),
    ),
    actions,
  });
}

export function presetsDialog(presets, onPick) {
  const m = modal({
    title: 'PCs de exemplo',
    wide: true,
    body: h('div', { class: 'grid', style: { gap: '12px' } },
      h('p', {}, 'Carregue um PC já montado para ver como ele se sai. Depois você pode trocar as peças à vontade.'),
      h('div', { class: 'res-grid' }, presets.map(p => h('article', { class: 'card' },
        h('h3', {}, p.name),
        h('p', {}, p.desc),
        h('button', { class: 'btn btn-primary btn-sm', type: 'button', style: { justifySelf: 'start' }, onclick: () => { m.close(); onPick(p); } }, 'Carregar este PC'),
      ))),
    ),
  });
}

export function saveBuildDialog(state, a, onSaved) {
  const id = 'save-name';
  const input = h('input', { class: 'input', id, value: state.name || a.tier.label, maxlength: 60 });
  modal({
    title: 'Salvar este PC',
    body: h('div', { class: 'field' },
      h('label', { for: id }, 'Nome da montagem'),
      input,
      h('span', { class: 'help' }, 'Fica salvo neste navegador. Você encontra seus PCs na página Hardware.'),
    ),
    actions: [
      { label: 'Cancelar', value: null },
      {
        label: 'Salvar', kind: 'primary', value: true, onClick: () => {
          const name = input.value.trim() || 'Meu PC';
          const builds = store.get('builds', []);
          const existing = builds.find(b => b.name === name);
          const entry = {
            id: existing ? existing.id : 'b' + Date.now().toString(36),
            name, savedAt: new Date().toISOString(),
            state: JSON.parse(JSON.stringify({ ...state, name })),
            summary: { overall: a.scores.overall, tier: a.tier.label, price: a.price, working: a.working },
          };
          const list = existing ? builds.map(b => (b.id === existing.id ? entry : b)) : [...builds, entry];
          if (!store.set('builds', list)) { toast('Não foi possível salvar: o navegador bloqueou o armazenamento.', 'bad'); return false; }
          toast(`"${name}" salvo!`, 'ok');
          onSaved && onSaved(name);
          return true;
        },
      },
    ],
  });
}

function initials(name) {
  const w = name.replace(/[:()'’]/g, '').split(/[\s-]+/).filter(Boolean);
  if (w.length === 1) return w[0].slice(0, 2).toUpperCase();
  return (w[0][0] + (/\d/.test(w[1]) ? w[1] : w[1][0])).toUpperCase().slice(0, 3);
}

export function summaryText(a) {
  const b = a.build;
  const lines = ['Meu PC montado no Seu PC Web', ''];
  const add = (label, p) => p && lines.push(`${label}: ${p.name}`);
  add('Gabinete', b.case); add('Fonte', b.psu); add('Placa-mãe', b.mobo); add('Processador', b.cpu); add('Cooler', b.cooler);
  if (b.ram.length) lines.push(`Memória: ${b.ram.length}x ${b.ram[0].name} (${a.ram.gb} GB)`);
  b.storage.forEach(s => lines.push(`Armazenamento: ${s.name}`));
  add('Placa de vídeo', b.gpu);
  lines.push('', `Nota geral: ${a.scores.overall}/100 (${a.tier.label})`);
  lines.push(`Jogos ${a.scores.games} · Trabalho ${a.scores.work} · Dia a dia ${a.scores.daily} · Multitarefa ${a.scores.multi}`);
  lines.push(`Consumo estimado: ${a.power.load} W · Preço estimado: ${fmtBRL(a.price)}`);
  const r = allResults(a, 1080);
  const roda = r.games.filter(g => g.status !== 'no').map(g => g.name);
  if (roda.length) lines.push('', `Roda: ${roda.slice(0, 10).join(', ')}${roda.length > 10 ? '…' : ''}`);
  return lines.join('\n');
}

export function openResults(a, { name, onSave } = {}) {
  let tab = 'resumo';
  let res = 1080;
  let filter = 'all';
  const body = h('div', { class: 'grid', style: { gap: '18px' } });
  const tabsEl = h('div', { class: 'tabs', role: 'tablist' });
  const content = h('div', {});

  const head = h('div', { class: 'res-head' },
    h('div', { class: 'hud-big', style: { '--p': a.scores.overall } }, h('b', {}, a.working ? (a.beyond.overall ? '100+' : String(a.scores.overall)) : '–')),
    h('div', { class: 'grid', style: { gap: '4px' } },
      h('span', { class: 'silk' }, name || 'Seu PC'),
      h('h3', {}, a.tier.label),
      h('p', {}, a.tier.text),
      h('div', { class: 'toolbar' },
        h('span', { class: 'pill' }, `Preço estimado ${fmtBRL(a.price)}`),
        h('span', { class: 'pill' }, `Consumo até ${a.power.load} W`),
        a.build.gpu ? h('span', { class: 'pill' }, a.build.gpu.name) : h('span', { class: 'pill' }, a.gpu.name),
      ),
    ),
  );

  function renderTabs() {
    clear(tabsEl);
    for (const [id, label] of [['resumo', 'Resumo'], ['jogos', 'Jogos'], ['programas', 'Programas'], ['pecas', 'Peças']]) {
      tabsEl.appendChild(h('button', { class: 'tab', role: 'tab', type: 'button', 'aria-selected': String(tab === id), onclick: () => { tab = id; renderTabs(); renderContent(); } }, label));
    }
  }

  function bar(label, key, help) {
    return h('div', { class: 'hud-bar' },
      h('div', { class: 'lbl' }, h('span', {}, label), h('span', {}, a.beyond[key] ? '100+' : String(a.scores[key]))),
      h('div', { class: 'meter' }, h('i', { style: { width: a.scores[key] + '%' } })),
      h('span', { class: 'help', style: { fontSize: '13px', color: 'var(--ink-2)' } }, help),
    );
  }

  function renderContent() {
    clear(content);
    if (tab === 'resumo') {
      const issues = [...a.issues].sort((x, y) => ['bad', 'warn', 'info'].indexOf(x.level) - ['bad', 'warn', 'info'].indexOf(y.level));
      const r = allResults(a, 1080);
      const count = s => r.games.filter(g => g.status === s).length;
      add(content, h('div', { class: 'grid', style: { gap: '18px' } },
        h('div', { class: 'res-grid' },
          bar('Jogos', 'games', 'Quanto melhor, mais jogos rodam no alto e com mais quadros por segundo.'),
          bar('Trabalho pesado', 'work', 'Edição de vídeo, 3D, programação e programas profissionais.'),
          bar('Dia a dia', 'daily', 'Ligar rápido, navegar, Office, vídeos: o quanto o PC é "ágil".'),
          bar('Multitarefa', 'multi', 'Muitas coisas abertas ao mesmo tempo sem travar.'),
        ),
        a.working ? h('div', { class: 'toolbar' },
          h('span', { class: 'pill ok' }, `${count('max')} jogos no máximo`),
          h('span', { class: 'pill accent' }, `${count('good')} rodam bem`),
          h('span', { class: 'pill warn' }, `${count('min')} no mínimo`),
          h('span', { class: 'pill bad' }, `${count('no')} não rodam`),
        ) : null,
        a.bottleneck ? h('div', { class: 'alert warn' }, h('b', {}, 'Gargalo'), a.bottleneck.text) : null,
        issues.length ? h('div', { class: 'alerts' }, issues.map(i => h('div', { class: 'alert ' + i.level }, h('b', {}, i.title), i.text))) : h('div', { class: 'alert' }, h('b', {}, 'Nenhum problema encontrado'), 'As peças combinam bem entre si.'),
        h('p', { class: 'silk' }, 'Estimativas educativas baseadas em testes públicos. O resultado real varia com drivers, temperatura e configurações.'),
      ));
    } else if (tab === 'jogos') {
      const r = allResults(a, res);
      const selId = 'res-sel';
      const tools = h('div', { class: 'toolbar' },
        h('label', { for: selId, class: 'silk' }, 'Resolução'),
        h('select', { class: 'select', id: selId, onchange: (e) => { res = +e.target.value; renderContent(); } },
          RESOLUTIONS.map(x => h('option', { value: x.id, selected: x.id === res }, x.label))),
        h('div', { class: 'tabs' }, [['all', 'Todos'], ['max', 'No máximo'], ['good', 'Bem'], ['min', 'No mínimo'], ['no', 'Não roda']].map(([id, label]) =>
          h('button', { class: 'tab', type: 'button', 'aria-selected': String(filter === id), onclick: () => { filter = id; renderContent(); } }, label))),
      );
      const list = r.games.filter(g => filter === 'all' || g.status === filter);
      add(content, tools, h('p', { style: { color: 'var(--ink-2)', margin: '10px 0' } }, 'FPS = quadros por segundo. Acima de 60 fica bem fluido; abaixo de 30 começa a travar.'),
        h('div', { class: 'app-list' }, list.map(g => gameCard(g))));
      if (!list.length) add(content, h('div', { class: 'empty' }, 'Nenhum jogo nesta categoria.'));
    } else if (tab === 'programas') {
      const r = allResults(a, 1080);
      for (const c of APP_CATS.filter(c => c.id !== 'jogo')) {
        const items = r.apps.filter(x => x.cat === c.id);
        if (!items.length) continue;
        add(content, h('h3', { style: { fontSize: '18px', margin: '14px 0 8px' } }, c.label), h('div', { class: 'app-list' }, items.map(appCard)));
      }
    } else {
      const b = a.build;
      const rows = [];
      const add = (cat, p, qty = 1) => p && rows.push(h('tr', {}, h('td', {}, CAT_BY_ID[cat].name), h('td', {}, qty > 1 ? `${qty}× ${p.name}` : p.name, h('div', { class: 'pc-spec' }, specLine(p))), h('td', { class: 'num' }, fmtBRL(p.price * qty))));
      add('case', b.case); add('psu', b.psu); add('mobo', b.mobo); add('cpu', b.cpu); add('cooler', b.cooler);
      groupSame(b.ram).forEach(([p, n]) => add('ram', p, n));
      b.storage.forEach(s => add('storage', s));
      add('gpu', b.gpu);
      groupSame(b.fans).forEach(([p, n]) => add('fan', p, n));
      rows.push(h('tr', {}, h('td', {}, h('b', {}, 'Total')), h('td', {}), h('td', { class: 'num' }, h('b', {}, fmtBRL(a.price)))));
      add(content, h('div', { class: 'table-wrap' }, h('table', { class: 'data' },
        h('thead', {}, h('tr', {}, h('th', {}, 'Peça'), h('th', {}, 'Modelo'), h('th', { style: { textAlign: 'right' } }, 'Preço'))),
        h('tbody', {}, rows))));
    }
  }

  function gameCard(g) {
    const st = STATUS[g.status];
    return h('article', { class: 'app-card' },
      h('span', { class: 'app-ico', style: { background: g.color } }, initials(g.name)),
      h('div', { class: 'grid', style: { gap: '3px', minWidth: 0 } },
        h('span', { class: 'nm' }, g.name),
        h('div', { class: 'toolbar', style: { gap: '6px' } }, h('span', { class: 'pill ' + st.cls }, st.label), g.summary ? h('span', { class: 'fps' }, g.summary) : null),
        g.fps && g.fps.low != null ? h('div', { class: 'fps-row' }, ['low', 'medium', 'high', 'ultra'].map((k, i) => h('span', {}, h('b', {}, g.fps[k]), ['Baixo', 'Médio', 'Alto', 'Ultra'][i]))) : null,
        g.reason ? h('span', { class: 'why' }, g.reason) : null,
        g.notes.length ? h('span', { class: 'why' }, g.notes.join(' ')) : null,
      ),
    );
  }

  function appCard(x) {
    const st = APP_STATUS[x.status];
    return h('article', { class: 'app-card' },
      h('span', { class: 'app-ico', style: { background: x.color } }, initials(x.name)),
      h('div', { class: 'grid', style: { gap: '3px', minWidth: 0 } },
        h('span', { class: 'nm' }, x.name),
        h('span', { class: 'pill ' + st.cls, style: { justifySelf: 'start' } }, x.summary && x.status === 'min' && x.id === 'win11' ? x.summary : st.label),
        h('span', { class: 'why' }, x.what),
        x.reason ? h('span', { class: 'why' }, h('b', {}, x.reason)) : null,
        x.notes.length ? h('span', { class: 'why' }, x.notes.join(' ')) : null,
      ),
    );
  }

  renderTabs();
  renderContent();
  add(body, head, tabsEl, content);
  modal({
    title: 'O que este PC roda',
    wide: true,
    body,
    actions: [
      { label: 'Copiar resumo', value: null, onClick: () => { copySummary(a); return false; } },
      onSave ? { label: 'Salvar este PC', value: null, onClick: () => { onSave(); return false; } } : null,
      { label: 'Fechar', value: null, kind: 'primary' },
    ].filter(Boolean),
  });
}

function groupSame(list) {
  const m = new Map();
  for (const p of list) m.set(p.id, [p, (m.get(p.id)?.[1] || 0) + 1]);
  return [...m.values()];
}

async function copySummary(a) {
  const text = summaryText(a);
  if (await copyText(text)) { toast('Resumo copiado. Cole onde quiser!', 'ok'); return; }
  const ta = h('textarea', { class: 'textarea', rows: 12, readonly: true }, text);
  modal({ title: 'Copie o resumo', body: h('div', { class: 'grid' }, h('p', {}, 'Selecione o texto abaixo e copie (Ctrl+C).'), ta), actions: [{ label: 'Fechar', kind: 'primary' }] });
  setTimeout(() => { ta.focus(); ta.select(); }, 60);
}

export { icon };
