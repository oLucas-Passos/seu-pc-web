import { h, icon, confirmBox, toast, fmtBRL, clear } from '../ui.js';
import { store } from '../store.js';
import { go } from '../main.js';
import { partIcon } from '../hw/part-icons.js';
import { PRESETS } from '../hw/presets.js';

const LEARN = [
  { cat: 'cpu', name: 'Processador (CPU)', analogy: 'É o cérebro: lê cada instrução dos programas e faz as contas.',
    look: ['Núcleos: quantas tarefas pesadas ele aguenta ao mesmo tempo.', 'GHz: a velocidade de cada núcleo.', 'Soquete: precisa ser igual ao da placa-mãe.', '"F" no nome (Intel) = sem vídeo integrado.'] },
  { cat: 'ram', name: 'Memória RAM', analogy: 'É a mesa de trabalho: quanto maior, mais coisas abertas ao mesmo tempo sem bagunça.',
    look: ['Hoje, 16 GB é o ideal; 8 GB é o mínimo.', 'Use 2 pentes iguais (dual channel).', 'DDR4 e DDR5 não são compatíveis entre si.'] },
  { cat: 'storage', name: 'Armazenamento (SSD e HD)', analogy: 'É o armário: guarda o Windows, os programas e seus arquivos, mesmo desligado.',
    look: ['SSD é muito mais rápido que HD: o PC liga em segundos.', 'M.2 NVMe é o SSD mais rápido e encaixa direto na placa-mãe.', 'HD é bom para guardar muita coisa barato.'] },
  { cat: 'gpu', name: 'Placa de vídeo (GPU)', analogy: 'É o artista: desenha cada imagem que aparece na tela, até 144 vezes por segundo.',
    look: ['Essencial para jogos, edição de vídeo e IA.', 'Memória de vídeo (VRAM): 8 GB ou mais para jogos atuais.', 'Confira o tamanho: placas grandes não cabem em todo gabinete.'] },
  { cat: 'mobo', name: 'Placa-mãe', analogy: 'É o esqueleto e o sistema nervoso: liga todas as peças e faz elas conversarem.',
    look: ['Define qual processador e qual memória você pode usar.', 'Tamanhos: ATX (grande), Micro-ATX e Mini-ITX (pequena).', 'Entradas M.2 para SSDs rápidos.'] },
  { cat: 'psu', name: 'Fonte', analogy: 'É o coração: bombeia energia na medida certa para cada peça.',
    look: ['Nunca economize aqui: fonte ruim pode queimar o PC.', 'Prefira selo 80 Plus (Bronze, Gold...).', 'Escolha uns 30% acima do consumo do PC.'] },
  { cat: 'cooler', name: 'Cooler', analogy: 'É o ventilador do cérebro: tira o calor do processador.',
    look: ['Processadores fortes precisam de coolers maiores.', 'Water cooler usa líquido e um radiador.', 'Sempre com pasta térmica entre ele e o processador.'] },
  { cat: 'case', name: 'Gabinete', analogy: 'É a casa: protege as peças e organiza o caminho do ar.',
    look: ['Precisa aceitar o tamanho da placa-mãe.', 'Confira o comprimento máximo de placa de vídeo.', 'Frente com tela deixa o ar entrar melhor.'] },
  { cat: 'fan', name: 'Ventoinhas', analogy: 'São as janelas abertas da casa: fazem o ar circular.',
    look: ['Frente puxa ar fresco para dentro.', 'Traseira e topo jogam o ar quente para fora.', 'Mais ventoinhas = peças mais frescas e duráveis.'] },
];

export function mount(root) {
  const page = h('div', { class: 'page' });
  root.appendChild(page);
  const savedSec = h('section', { class: 'section' });

  page.append(
    h('header', { class: 'page-head' },
      h('p', { class: 'eyebrow' }, 'Hardware'),
      h('h1', {}, 'O que tem dentro do computador'),
      h('p', { class: 'lead' }, 'Hardware são as peças físicas, aquilo que dá para tocar. Conheça cada uma com comparações do dia a dia e depois monte o seu PC em 3D.'),
      h('div', { class: 'hero-actions' },
        h('a', { class: 'btn btn-primary btn-lg', href: '#montar' }, 'Abrir a bancada 3D', icon('arrow')),
        h('a', { class: 'btn btn-lg', href: '#pecas' }, 'Ver todas as peças'),
      ),
    ),
    h('section', { class: 'section' },
      h('h2', {}, 'Conheça as peças'),
      h('p', {}, 'Um computador precisa de 7 peças para funcionar: gabinete, fonte, placa-mãe, processador, cooler, memória e armazenamento. A placa de vídeo é obrigatória só quando o processador não tem vídeo integrado.'),
      h('div', { class: 'grid grid-3' }, LEARN.map(l => h('article', { class: 'card part-card' },
        h('span', { class: 'part-ico' }, partIcon(l.cat)),
        h('h3', {}, l.name),
        h('p', { class: 'analogy' }, l.analogy),
        h('div', { class: 'grid', style: { gap: '6px' } },
          h('span', { class: 'silk' }, 'Na hora de comprar'),
          h('ul', {}, l.look.map(t => h('li', {}, t))),
        ),
      ))),
    ),
    h('section', { class: 'section' },
      h('h2', {}, 'Comece por um PC pronto'),
      h('p', {}, 'Carregue um destes exemplos na bancada para ver quanto ele custa, quanto consome e quais jogos e programas roda.'),
      h('div', { class: 'grid grid-3' }, PRESETS.map(p => h('article', { class: 'card' },
        h('h3', {}, p.name),
        h('p', {}, p.desc),
        h('button', { class: 'btn btn-sm', type: 'button', style: { justifySelf: 'start' }, onclick: () => go('montar', { preset: p.id }) }, 'Abrir na bancada'),
      ))),
    ),
    savedSec,
  );

  function renderSaved() {
    clear(savedSec);
    const builds = store.get('builds', []);
    savedSec.append(h('h2', {}, 'Meus PCs salvos'));
    if (!builds.length) {
      savedSec.append(h('div', { class: 'empty' }, h('b', {}, 'Nenhum PC salvo ainda.'), h('span', {}, 'Monte um PC na bancada 3D e clique em "Salvar".'), h('a', { class: 'btn btn-primary btn-sm', href: '#montar' }, 'Ir para a bancada')));
      return;
    }
    savedSec.append(h('div', { class: 'table-wrap' }, h('table', { class: 'data' },
      h('thead', {}, h('tr', {}, h('th', {}, 'Nome'), h('th', {}, 'Categoria'), h('th', { style: { textAlign: 'right' } }, 'Nota'), h('th', { style: { textAlign: 'right' } }, 'Preço'), h('th', {}, ''))),
      h('tbody', {}, [...builds].reverse().map(b => h('tr', {},
        h('td', {}, h('b', {}, b.name), h('div', { class: 'pc-sub' }, new Date(b.savedAt).toLocaleDateString('pt-BR'))),
        h('td', {}, b.summary?.tier || '—'),
        h('td', { class: 'num' }, b.summary?.working ? String(b.summary.overall) : '–'),
        h('td', { class: 'num' }, fmtBRL(b.summary?.price || 0)),
        h('td', { style: { whiteSpace: 'nowrap', textAlign: 'right' } },
          h('button', { class: 'btn btn-sm btn-primary', type: 'button', onclick: () => go('montar', { load: b.id }) }, 'Abrir'), ' ',
          h('button', { class: 'btn btn-sm btn-ghost btn-danger', type: 'button', 'aria-label': 'Excluir ' + b.name, onclick: async () => {
            if (!(await confirmBox('Excluir PC salvo', `Excluir "${b.name}"?`, { ok: 'Excluir', danger: true }))) return;
            store.set('builds', store.get('builds', []).filter(x => x.id !== b.id));
            toast('PC excluído.', 'ok');
            renderSaved();
          } }, icon('trash')),
        ),
      ))),
    )));
  }
  renderSaved();
}
