import { homeTemplate } from '../main.js';
import { store } from '../store.js';

export function mount(root) {
  const done = store.get('lessons:done', []);
  const builds = store.get('builds', []);
  const custom = store.get('customParts', []);

  // O conteúdo da página está no html/index.html; aqui só preenchemos o progresso.
  const page = homeTemplate.content.firstElementChild.cloneNode(true);
  const progress = (key, text, frac) => {
    page.querySelector(`[data-prog="${key}"]`).textContent = text;
    page.querySelector(`[data-meter="${key}"]`).style.width = Math.max(3, frac * 100) + '%';
  };
  progress('licoes', `${done.length}/15 lições concluídas`, done.length / 15);
  progress('pcs', `${builds.length} PC(s) salvo(s) · ${custom.length} peça(s) sua(s)`, Math.min(1, builds.length / 3));
  root.appendChild(page);

  // contadores animados
  page.querySelectorAll('[data-count]').forEach(b => {
    const n = +b.dataset.count, t0 = performance.now();
    const tick = (t) => { const p = Math.min(1, (t - t0) / 1200); b.textContent = Math.round(n * (1 - Math.pow(1 - p, 3))) + (p >= 1 && n >= 40 ? '+' : ''); if (p < 1) requestAnimationFrame(tick); };
    requestAnimationFrame(tick);
  });
  // parallax leve no visual
  const vis = page.querySelector('.hm-visual');
  const move = (e) => { const r = vis.getBoundingClientRect(); const x = (e.clientX - r.left) / r.width - .5, y = (e.clientY - r.top) / r.height - .5; vis.style.setProperty('--rx', (y * -6) + 'deg'); vis.style.setProperty('--ry', (x * 8) + 'deg'); };
  page.querySelector('.hm-hero').addEventListener('pointermove', move);
}

