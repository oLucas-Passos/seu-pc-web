// Roteador do site: cada página é um módulo carregado sob demanda.
import { h, clear } from './ui.js';

const routes = {
  inicio: { load: () => import('./pages/home.js'), title: 'Início' },
  software: { load: () => import('./pages/software.js'), title: 'Software' },
  simulador: { load: () => import('./pages/simulator.js'), title: 'Simulador', app: true },
  hardware: { load: () => import('./pages/hardware.js'), title: 'Hardware' },
  montar: { load: () => import('./hw/builder.js'), title: 'Montar PC 3D', app: true },
  pecas: { load: () => import('./pages/parts.js'), title: 'Peças' },
  dicionario: { load: () => import('./pages/glossary.js'), title: 'Dicionário' },
};

const app = document.getElementById('app');
const rodape = document.getElementById('rodape');

// A página inicial já vem escrita no index.html. Guardamos uma cópia dela
// para poder mostrá-la de novo quando a pessoa voltar ao Início.
export const homeTemplate = document.createElement('template');
homeTemplate.content.appendChild(document.getElementById('pagina-inicio').cloneNode(true));
let cleanup = null;
let pendingParams = null;
let renderToken = 0;

export function go(route, params = null) {
  pendingParams = { route, params };
  if (location.hash.slice(1) === route) render();
  else location.hash = route;
}

async function render() {
  const token = ++renderToken;
  let name = location.hash.slice(1) || 'inicio';
  if (!routes[name]) name = 'inicio';
  const route = routes[name];
  const params = pendingParams && pendingParams.route === name ? pendingParams.params : null;
  pendingParams = null;

  if (cleanup) {
    try { cleanup(); } catch (e) { console.error(e); }
    cleanup = null;
  }
  document.body.classList.toggle('app-mode', !!route.app);
  document.title = name === 'inicio' ? 'Seu PC Web' : `${route.title} · Seu PC Web`;
  for (const a of document.querySelectorAll('.mainnav a')) {
    a.classList.toggle('active', a.dataset.route.split(' ').includes(name));
  }
  document.getElementById('mainNav').classList.remove('open');
  document.getElementById('navToggle').setAttribute('aria-expanded', 'false');

  rodape.hidden = true;
  clear(app);
  app.appendChild(h('div', { class: 'page' }, h('p', { class: 'silk' }, 'Carregando…')));
  try {
    const mod = await route.load();
    if (token !== renderToken) return;
    clear(app);
    const result = await mod.mount(app, params || {});
    if (token !== renderToken) {
      if (typeof result === 'function') result();
      return;
    }
    cleanup = typeof result === 'function' ? result : null;
    if (!route.app) {
      rodape.hidden = false;
      window.scrollTo(0, 0);
    }
  } catch (err) {
    console.error(err);
    clear(app);
    app.appendChild(h('div', { class: 'page' },
      h('div', { class: 'empty' },
        h('b', {}, 'Não foi possível abrir esta parte do site.'),
        h('span', {}, String(err && err.message || err)),
        h('a', { class: 'btn', href: '#inicio' }, 'Voltar ao início'),
      ),
    ));
  }
}


document.getElementById('navToggle').addEventListener('click', (e) => {
  const nav = document.getElementById('mainNav');
  const open = !nav.classList.contains('open');
  nav.classList.toggle('open', open);
  e.currentTarget.setAttribute('aria-expanded', String(open));
});

window.addEventListener('hashchange', render);
import('./intro.js').then(m => m.playIntro()).catch(() => {});
render();
