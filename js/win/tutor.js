// Painel do professor: mostra o passo atual, confere as ações no simulador e celebra cada conquista.
import { h, add, clear, icon } from '../ui.js';
import { store } from '../store.js';
import { LESSONS } from './lessons.js';

export function lessonsDone() { return store.get('lessons:done', []); }
function markDone(id) { const d = new Set(lessonsDone()); d.add(id); store.set('lessons:done', [...d]); }

export class Tutor {
  constructor(panel, os, { onPick } = {}) {
    this.panel = panel;
    this.os = os;
    this.onPick = onPick;
    this.lesson = null;
    this.idx = 0;
    this.unsub = null;
    this.mem = {};
    this.flash = null;
  }

  free() {
    this.stop();
    clear(this.panel);
    const done = new Set(lessonsDone());
    add(this.panel,
      h('span', { class: 'eyebrow' }, 'Modo livre'),
      h('h2', {}, 'Explore à vontade'),
      h('p', {}, 'Use o Windows simulado como quiser. Nada do que você fizer aqui afeta o seu computador de verdade.'),
      h('div', { class: 'tut-tips' },
        h('b', {}, 'Ideias para testar'),
        h('ul', {}, ['Abra o Navegador e visite os sites da barra de favoritos.', 'Crie uma pasta e arraste arquivos para dentro dela.', 'Instale um jogo pela Loja.', 'Troque o papel de parede em Configurações.'].map(t => h('li', {}, t))),
      ),
      h('b', { class: 'tut-sub' }, 'Ou escolha uma lição'),
      h('div', { class: 'tut-list' }, LESSONS.map((l, i) => h('button', { class: 'tut-li' + (done.has(l.id) ? ' done' : ''), type: 'button', onclick: () => this.onPick && this.onPick(l.id) },
        h('span', { class: 'n' }, done.has(l.id) ? icon('check') : String(i + 1)), h('span', {}, l.title)))),
    );
  }

  async start(id) {
    this.stop();
    const lesson = LESSONS.find(l => l.id === id);
    if (!lesson) return this.free();
    this.lesson = lesson;
    this.idx = -1;
    this.mem = {};
    this.renderIntro();
  }

  async begin() {
    const l = this.lesson;
    if (l.setup) await l.setup(this.os);
    this.idx = 0;
    this.unsub = this.os.on('*', (data, evt) => this.onEvent(evt, data));
    this.enterStep();
  }

  stop() {
    if (this.unsub) this.unsub();
    this.unsub = null;
    this.os.clearHighlight();
    clearTimeout(this.flash);
  }

  enterStep() {
    const step = this.step();
    this.os.clearHighlight();
    if (!step) return this.finish();
    this.render();
    if (step.check && step.check(this.os, this.mem)) setTimeout(() => this.complete(), 300);
  }

  step() { return this.lesson ? this.lesson.steps[this.idx] : null; }

  onEvent(evt, data) {
    const step = this.step();
    if (!step || step.quiz || this.busy) return;
    if (evt === step.on && (!step.when || step.when(data, this.os, this.mem))) { this.complete(); return; }
    if (step.check && step.check(this.os, this.mem)) this.complete();
  }

  complete() {
    if (this.busy) return;
    this.busy = true;
    this.os.clearHighlight();
    const box = this.panel.querySelector('.tut-now');
    if (box) box.classList.add('ok');
    const msgs = ['Muito bem!', 'Isso mesmo!', 'Perfeito!', 'Mandou bem!', 'Ótimo!'];
    const badge = this.panel.querySelector('.tut-ok');
    if (badge) { badge.textContent = msgs[this.idx % msgs.length]; badge.hidden = false; }
    this.flash = setTimeout(() => { this.busy = false; this.idx++; this.enterStep(); }, 1100);
  }

  skip() { if (!this.busy) this.complete(); }

  finish() {
    this.stop();
    const l = this.lesson;
    markDone(l.id);
    const i = LESSONS.indexOf(l);
    const next = LESSONS[i + 1];
    clear(this.panel);
    add(this.panel,
      h('div', { class: 'tut-confetti', 'aria-hidden': 'true' }, Array.from({ length: 18 }, (_, k) => h('i', { style: { '--k': k } }))),
      h('span', { class: 'eyebrow' }, `Lição ${i + 1} concluída`),
      h('h2', {}, l.title),
      h('p', { class: 'tut-outro' }, l.outro),
      h('div', { class: 'tut-actions' },
        next ? h('button', { class: 'btn btn-primary', type: 'button', onclick: () => this.onPick && this.onPick(next.id) }, 'Próxima: ' + next.title) : h('p', {}, h('b', {}, 'Você terminou todas as lições! Agora monte um PC na bancada 3D.')),
        h('button', { class: 'btn', type: 'button', onclick: () => this.start(l.id) }, 'Fazer de novo'),
        h('a', { class: 'btn btn-ghost', href: '#software' }, 'Ver todas as lições'),
      ),
    );
  }

  renderIntro() {
    const l = this.lesson;
    const i = LESSONS.indexOf(l);
    clear(this.panel);
    add(this.panel,
      h('span', { class: 'eyebrow' }, `Lição ${i + 1} de ${LESSONS.length} · ${l.level}`),
      h('h2', {}, l.title),
      h('p', { class: 'tut-intro' }, l.intro),
      h('p', { class: 'tut-meta' }, `${l.steps.length} passos · cerca de ${l.time}`),
      h('button', { class: 'btn btn-primary btn-lg', type: 'button', onclick: () => this.begin() }, 'Começar a lição'),
      h('button', { class: 'btn btn-ghost', type: 'button', onclick: () => this.free() }, 'Prefiro explorar livremente'),
    );
  }

  render() {
    const l = this.lesson;
    const step = this.step();
    const i = LESSONS.indexOf(l);
    clear(this.panel);
    const now = h('div', { class: 'tut-now' },
      h('span', { class: 'tut-step' }, `Passo ${this.idx + 1} de ${l.steps.length}`),
      step.quiz ? this.quiz(step.quiz) : h('p', { class: 'tut-text' }, step.text),
      step.hint ? h('p', { class: 'tut-hint' }, step.hint) : null,
      h('span', { class: 'tut-ok', hidden: true }, ''),
      !step.quiz ? h('div', { class: 'tut-actions' },
        step.target ? h('button', { class: 'btn btn-signal btn-sm', type: 'button', onclick: () => this.showWhere() }, 'Mostrar onde') : null,
        h('button', { class: 'btn btn-ghost btn-sm', type: 'button', onclick: () => this.skip() }, 'Pular este passo'),
      ) : null,
    );
    add(this.panel,
      h('span', { class: 'eyebrow' }, `Lição ${i + 1} · ${l.level}`),
      h('h2', {}, l.title),
      h('div', { class: 'tut-progress' }, h('i', { style: { width: (this.idx / l.steps.length * 100) + '%' } })),
      now,
      h('ol', { class: 'tut-steps' }, l.steps.map((s, k) => h('li', { class: k < this.idx ? 'done' : k === this.idx ? 'cur' : '' }, s.quiz ? 'Pergunta rápida' : shortText(s.text)))),
      h('div', { class: 'tut-foot' },
        h('button', { class: 'btn btn-sm', type: 'button', onclick: () => this.start(l.id) }, 'Recomeçar'),
        h('button', { class: 'btn btn-sm btn-ghost', type: 'button', onclick: () => this.free() }, 'Sair da lição'),
      ),
    );
  }

  showWhere() {
    const step = this.step();
    if (!step || !step.target) return;
    const el = this.os.screen.querySelector(step.target);
    const visible = el && el.offsetParent && !el.closest('[hidden]');
    // Se o item ainda não está na tela (ex.: dentro do menu Iniciar fechado), mostra por onde começar.
    if (!visible && /sm-|sr-|power|pw-|start-/.test(step.target)) this.os.highlight('[data-tut="start"]');
    else if (!visible && /set-|uninstall-/.test(step.target)) this.os.highlight('[data-tut="start"]');
    else this.os.highlight(step.target);
  }

  quiz(qz) {
    const fb = h('p', { class: 'tut-hint' });
    return h('div', { class: 'tut-quiz' },
      h('p', { class: 'tut-text' }, qz.q),
      h('div', { class: 'tut-opts' }, qz.options.map((o, k) => h('button', {
        class: 'btn', type: 'button',
        onclick: (e) => {
          if (k === qz.correct) { e.currentTarget.classList.add('right'); fb.textContent = qz.explain; this.complete(); }
          else { e.currentTarget.classList.add('wrong'); fb.textContent = 'Não é essa. ' + qz.explain; }
        },
      }, o))),
      fb,
    );
  }
}

function shortText(t) {
  const s = t.split(/[.:]/)[0];
  return s.length > 64 ? s.slice(0, 62) + '…' : s;
}
