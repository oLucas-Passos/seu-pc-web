import { h, clear, icon, fmtBRL, toast } from '../ui.js';
import { CATEGORIES, CAT_BY_ID } from '../hw/catalog.js';
import { allParts, customParts, specLine, tierLabel } from '../hw/parts.js';
import { partDetails } from '../hw/results.js';
import { openCustomEditor } from '../hw/custom-editor.js';
import { partIcon } from '../hw/part-icons.js';

export function mount(root) {
  let cat = 'cpu';
  let q = '';
  const page = h('div', { class: 'page' });
  root.appendChild(page);
  const mineSec = h('section', { class: 'section' });
  const tabs = h('div', { class: 'tabs', role: 'tablist', 'aria-label': 'Categorias' });
  const tableHost = h('div', {});

  page.append(
    h('header', { class: 'page-head' },
      h('p', { class: 'eyebrow' }, 'Catálogo'),
      h('h1', {}, 'Todas as peças'),
      h('p', { class: 'lead' }, 'Compare peças antigas, intermediárias e topo de linha. Não achou a que você quer? Crie a sua: pode ser a do orçamento que você recebeu ou uma peça imaginária.'),
      h('div', { class: 'hero-actions' },
        h('button', { class: 'btn btn-primary', type: 'button', onclick: () => openCustomEditor({ cat, onSave: (p) => { if (p) { cat = p.cat; toast(`"${p.name}" criada!`, 'ok'); } renderAll(); } }) }, icon('plus'), 'Criar peça personalizada'),
        h('a', { class: 'btn', href: '#montar' }, 'Montar um PC com elas'),
      ),
    ),
    mineSec,
    h('section', { class: 'section' },
      h('h2', {}, 'Catálogo'),
      h('div', { class: 'toolbar' }, tabs,
        h('input', { class: 'input', id: 'parts-q', type: 'search', placeholder: 'Buscar por nome ou marca', 'aria-label': 'Buscar peça', style: { flex: '1 1 220px' }, oninput: (e) => { q = e.target.value; renderTable(); } })),
      tableHost,
    ),
  );

  function renderMine() {
    clear(mineSec);
    const mine = customParts();
    mineSec.append(h('h2', {}, 'Minhas peças'));
    if (!mine.length) {
      mineSec.append(h('div', { class: 'empty' }, h('b', {}, 'Você ainda não criou nenhuma peça.'), h('span', {}, 'Comece a partir de uma peça parecida e altere núcleos, memória, velocidade, cores…')));
      return;
    }
    mineSec.append(h('div', { class: 'grid grid-3' }, mine.map(p => h('article', { class: 'card' },
      h('div', { class: 'toolbar', style: { justifyContent: 'space-between' } }, h('span', { class: 'part-ico', style: { width: '40px', height: '40px', display: 'grid', placeItems: 'center', color: 'var(--pcb)' } }, partIcon(p.cat)), h('span', { class: 'pill signal' }, CAT_BY_ID[p.cat].name)),
      h('h3', {}, p.name),
      h('p', { class: 'pc-spec' }, specLine(p)),
      h('div', { class: 'toolbar' },
        h('button', { class: 'btn btn-sm', type: 'button', onclick: () => partDetails(p, { onEdit: () => openCustomEditor({ edit: p, onSave: renderAll }) }) }, 'Detalhes'),
        h('button', { class: 'btn btn-sm', type: 'button', onclick: () => openCustomEditor({ edit: p, onSave: renderAll }) }, icon('edit'), 'Editar'),
      ),
    ))));
  }

  function renderTabs() {
    clear(tabs);
    for (const c of CATEGORIES) {
      tabs.appendChild(h('button', { class: 'tab', type: 'button', role: 'tab', 'aria-selected': String(c.id === cat), onclick: () => { cat = c.id; renderTabs(); renderTable(); } }, c.plural));
    }
  }

  function renderTable() {
    clear(tableHost);
    const ql = q.trim().toLowerCase();
    const list = allParts(cat).filter(p => !ql || (p.name + ' ' + p.brand).toLowerCase().includes(ql)).sort((a, b) => a.year - b.year || a.price - b.price);
    tableHost.append(h('p', { style: { color: 'var(--ink-2)', margin: '12px 0' } }, CAT_BY_ID[cat].short),
      h('div', { class: 'table-wrap' }, h('table', { class: 'data' },
        h('thead', {}, h('tr', {}, h('th', {}, 'Peça'), h('th', {}, 'Ano'), h('th', {}, 'Nível'), h('th', {}, 'Principais características'), h('th', { style: { textAlign: 'right' } }, 'Preço aprox.'), h('th', {}, ''))),
        h('tbody', {}, list.map(p => h('tr', {},
          h('td', {}, h('b', {}, p.name), h('div', { class: 'pc-sub' }, p.brand)),
          h('td', { class: 'num' }, String(p.year)),
          h('td', {}, h('span', { class: 'pill ' + (p.custom ? 'signal' : p.tier === 'topo' ? 'ok' : p.tier === 'antiga' ? '' : 'accent') }, p.custom ? 'Sua peça' : tierLabel(p.tier))),
          h('td', { style: { minWidth: '240px' } }, specLine(p)),
          h('td', { class: 'num' }, fmtBRL(p.price)),
          h('td', {}, h('button', { class: 'btn btn-sm btn-ghost', type: 'button', onclick: () => partDetails(p, { onEdit: p.custom ? () => openCustomEditor({ edit: p, onSave: renderAll }) : null }) }, 'Detalhes')),
        ))),
      )));
  }

  function renderAll() { renderMine(); renderTabs(); renderTable(); }
  renderAll();
}
