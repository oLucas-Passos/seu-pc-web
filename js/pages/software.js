import { h, icon } from '../ui.js';
import { go } from '../main.js';
import { LESSONS } from '../win/lessons.js';
import { lessonsDone } from '../win/tutor.js';

export function mount(root) {
  const done = new Set(lessonsDone());
  const levels = ['Básico', 'Intermediário', 'Avançado'];
  const next = LESSONS.find(l => !done.has(l.id));
  root.appendChild(h('div', { class: 'page' },
    h('header', { class: 'page-head' },
      h('p', { class: 'eyebrow' }, 'Software'),
      h('h1', {}, 'Aprenda a usar o Windows'),
      h('p', { class: 'lead' }, 'Software são os programas, aquilo que aparece na tela. Treine num Windows simulado, com um professor que mostra cada passo e confere se você acertou.'),
      h('div', { class: 'hero-actions' },
        next ? h('button', { class: 'btn btn-primary btn-lg', type: 'button', onclick: () => go('simulador', { lesson: next.id }) }, done.size ? 'Continuar: ' + next.title : 'Começar a primeira lição', icon('arrow'))
          : h('span', { class: 'pill ok' }, 'Você concluiu todas as lições!'),
        h('button', { class: 'btn btn-lg', type: 'button', onclick: () => go('simulador') }, 'Usar o simulador livremente'),
      ),
      h('div', { class: 'stat-row' },
        h('div', { class: 'stat' }, h('b', {}, `${done.size}/${LESSONS.length}`), h('span', {}, 'lições concluídas')),
        h('div', { class: 'meter', style: { flex: '1 1 200px', alignSelf: 'center', maxWidth: '360px' } }, h('i', { style: { width: (done.size / LESSONS.length * 100) + '%' } })),
      ),
    ),
    h('section', { class: 'lesson-cols' }, levels.map(lv => h('div', { class: 'lesson-group' },
      h('h3', {}, lv, h('span', { class: 'pill' }, `${LESSONS.filter(l => l.level === lv && done.has(l.id)).length}/${LESSONS.filter(l => l.level === lv).length}`)),
      LESSONS.filter(l => l.level === lv).map(l => h('button', { class: 'lesson' + (done.has(l.id) ? ' done' : ''), type: 'button', onclick: () => go('simulador', { lesson: l.id }) },
        h('span', { class: 'lnum' }, done.has(l.id) ? icon('check') : String(LESSONS.indexOf(l) + 1)),
        h('span', {}, h('span', { class: 'ltitle' }, l.title), h('br'), h('span', { class: 'ldesc' }, l.desc)),
        h('span', { class: 'lmeta' }, l.time),
      )),
    ))),
    h('section', { class: 'section' },
      h('h2', {}, 'Como funciona o simulador'),
      h('div', { class: 'grid grid-3' },
        h('article', { class: 'card' }, h('h3', {}, 'Um professor ao lado'), h('p', {}, 'O painel da direita diz o que fazer. Se não encontrar, clique em "Mostrar onde" e o lugar certo pisca na tela.')),
        h('article', { class: 'card' }, h('h3', {}, 'Teclas especiais'), h('p', {}, 'Algumas teclas, como a tecla Windows e o Alt+Tab, são do seu computador de verdade. Por isso há uma barra de botões acima da tela para testá-las no simulador.')),
        h('article', { class: 'card' }, h('h3', {}, 'Errou? Sem problema'), h('p', {}, 'Apague, feche e mude o que quiser. O botão "Restaurar simulador" deixa tudo como era no começo.')),
      ),
    ),
  ));
}
