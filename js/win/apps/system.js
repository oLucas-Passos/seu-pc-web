// Gerenciador de Tarefas e Loja de aplicativos.
import { icon, lico } from '../icons.js';
import { APPS } from './registry.js';
import { deviceSpecs } from './settings.js';
import { esc } from './common.js';

const BACKGROUND = [
  { name: 'Antivírus do Windows', icon: 'settings', mem: 180 },
  { name: 'Serviço de atualização', icon: 'settings', mem: 42 },
  { name: 'Áudio do Windows', icon: 'settings', mem: 18 },
  { name: 'Spooler de impressão', icon: 'settings', mem: 9 },
];

export const taskmgr = {
  id: 'taskmgr', name: 'Gerenciador de Tarefas', icon: 'taskmgr', width: 780, height: 520, single: true, keywords: 'travado travou processos desempenho finalizar',
  open(ctx) {
    const { os, body } = ctx;
    let tab = 'proc', selected = null;
    const hist = { cpu: [], mem: [], disk: [], net: [] };
    const usage = new Map();
    body.classList.add('tm');
    body.innerHTML = `<nav class="tm-nav">${[['proc', 'Processos', 'apps'], ['perf', 'Desempenho', 'clock'], ['start', 'Aplicativos de inicialização', 'power']].map(([id, n, ic]) => `<button data-tab="${id}" data-tut="tm-${id}">${lico(ic, 18)}<span>${n}</span></button>`).join('')}</nav><main class="tm-main"></main>`;
    const main = body.querySelector('.tm-main');
    const rnd = (a, b) => a + Math.random() * (b - a);
    function sample() {
      for (const w of os.windows) {
        const u = usage.get(w.id) || { cpu: rnd(0, 4), mem: rnd(40, 220) };
        u.cpu = w.frozen ? rnd(85, 99) : Math.max(0, Math.min(30, u.cpu + rnd(-2, 2)));
        u.mem = Math.max(20, u.mem + rnd(-3, 3));
        usage.set(w.id, u);
      }
      const total = Math.min(100, 4 + [...os.windows].reduce((t, w) => t + (usage.get(w.id)?.cpu || 0), 0) / 2 + rnd(0, 6));
      hist.cpu.push(total); hist.mem.push(38 + os.windows.length * 3 + rnd(-1, 1)); hist.disk.push(rnd(0, 12)); hist.net.push(os.online() ? rnd(0, 30) : 0);
      for (const k of Object.keys(hist)) if (hist[k].length > 60) hist[k].shift();
    }
    function render() {
      body.querySelectorAll('[data-tab]').forEach(b => b.classList.toggle('on', b.dataset.tab === tab));
      if (tab === 'proc') {
        const rows = os.windows.filter(w => w.app !== 'taskmgr').map(w => {
          const u = usage.get(w.id) || { cpu: 0, mem: 50 };
          return `<tr class="${selected === w.id ? 'sel' : ''}${w.frozen ? ' frozen' : ''}" data-w="${w.id}" data-tut="tm-row-${w.app}"><td>${icon(w.iconName, 18)} ${esc(w.title.replace(' (Não está respondendo)', ''))}</td><td>${w.frozen ? '<b class="tm-bad">Não está respondendo</b>' : ''}</td><td>${u.cpu.toFixed(1).replace('.', ',')}%</td><td>${Math.round(u.mem)} MB</td></tr>`;
        }).join('');
        const bg = BACKGROUND.map(p => `<tr class="bg"><td>${icon(p.icon, 18)} ${p.name}</td><td></td><td>${rnd(0, 1.5).toFixed(1).replace('.', ',')}%</td><td>${p.mem} MB</td></tr>`).join('');
        const sel = os.windows.find(w => w.id === selected);
        main.innerHTML = `<div class="tm-head"><h2>Processos</h2><button class="w-btn" data-end data-tut="tm-end" ${sel ? '' : 'disabled'}>Finalizar tarefa</button></div>
          <table class="tm-table"><thead><tr><th>Nome</th><th>Status</th><th>CPU ${Math.round(hist.cpu.at(-1) || 0)}%</th><th>Memória</th></tr></thead>
          <tbody><tr class="grp"><td colspan="4">Aplicativos (${os.windows.filter(w => w.app !== 'taskmgr').length})</td></tr>${rows || '<tr><td colspan="4" class="w-muted">Nenhum aplicativo aberto</td></tr>'}<tr class="grp"><td colspan="4">Processos em segundo plano (${BACKGROUND.length})</td></tr>${bg}</tbody></table>`;
        main.querySelectorAll('[data-w]').forEach(r => { r.onclick = () => { selected = r.dataset.w; render(); os.emit('taskmgr:select', { app: os.windows.find(w => w.id === selected)?.app }); }; });
        const end = main.querySelector('[data-end]');
        end.onclick = async () => {
          const w = os.windows.find(x => x.id === selected);
          if (!w) return;
          const wasFrozen = w.frozen;
          await os.close(w, { force: true });
          os.emit('taskmgr:end', { app: w.app, frozen: wasFrozen });
          if (wasFrozen) os.emit('frozen:resolved', { app: w.app, how: 'taskmgr' });
          selected = null;
          render();
        };
      } else if (tab === 'perf') {
        const sp = deviceSpecs();
        main.innerHTML = `<h2>Desempenho</h2><div class="tm-perf">${[['cpu', 'CPU', sp.cpu, '#1f8be0'], ['mem', 'Memória', sp.ram, '#8a3ac9'], ['disk', 'Disco 0 (C:)', sp.disk, '#2e9d4f'], ['net', 'Wi-Fi', os.online() ? os.settings.wifi.connected : 'Desconectado', '#d97b1a']].map(([k, n, d, c]) => `<div class="tm-graph"><div><b>${n}</b><small>${esc(d)}</small></div><canvas width="300" height="90" data-g="${k}" data-c="${c}"></canvas><span>${Math.round(hist[k].at(-1) || 0)}%</span></div>`).join('')}</div>`;
        main.querySelectorAll('canvas').forEach(cv => {
          const g = cv.getContext('2d'), data = hist[cv.dataset.g], col = cv.dataset.c;
          g.clearRect(0, 0, 300, 90);
          g.strokeStyle = 'rgba(128,128,128,.25)';
          for (let y = 0; y < 90; y += 22.5) { g.beginPath(); g.moveTo(0, y); g.lineTo(300, y); g.stroke(); }
          g.beginPath(); g.moveTo(0, 90);
          data.forEach((v, i) => g.lineTo(i * 5, 90 - v * 0.9));
          g.lineTo((data.length - 1) * 5, 90); g.closePath();
          g.fillStyle = col + '33'; g.fill();
          g.beginPath(); data.forEach((v, i) => (i ? g.lineTo(i * 5, 90 - v * 0.9) : g.moveTo(0, 90 - v * 0.9))); g.strokeStyle = col; g.lineWidth = 2; g.stroke();
        });
      } else {
        const st = os.settings.startup;
        const names = { onedrive: 'Nuvem de arquivos', spotify: 'Player de música', teams: 'Chat do trabalho' };
        main.innerHTML = `<h2>Aplicativos de inicialização</h2><p class="w-muted">Programas que abrem sozinhos quando o computador liga. Desativar os que você não usa deixa o PC ligar mais rápido.</p>
          <table class="tm-table"><thead><tr><th>Nome</th><th>Status</th><th>Impacto</th><th></th></tr></thead><tbody>${Object.entries(st).map(([k, on]) => `<tr><td>${names[k]}</td><td>${on ? 'Habilitado' : 'Desabilitado'}</td><td>${k === 'teams' ? 'Alto' : 'Médio'}</td><td><button class="w-btn sm" data-st="${k}">${on ? 'Desabilitar' : 'Habilitar'}</button></td></tr>`).join('')}</tbody></table>`;
        main.querySelectorAll('[data-st]').forEach(b => { b.onclick = () => { st[b.dataset.st] = !st[b.dataset.st]; os.saveSettings(); os.emit('taskmgr:startup', { app: b.dataset.st, on: st[b.dataset.st] }); render(); }; });
      }
    }
    body.querySelectorAll('[data-tab]').forEach(b => { b.onclick = () => { tab = b.dataset.tab; render(); os.emit('taskmgr:tab', { tab }); }; });
    for (let i = 0; i < 30; i++) sample();
    render();
    const timer = setInterval(() => { sample(); if (tab !== 'start') render(); }, 1000);
    const unsub = os.on('app:close', () => render());
    return { onDestroy() { clearInterval(timer); unsub(); } };
  },
};

export const STORE_ITEMS = [
  { id: 'minesweeper', desc: 'O clássico: descubra todos os quadrados sem explodir nenhuma mina.', rating: 4.7, size: '12 MB', cat: 'Jogos' },
  { id: 'tictactoe', desc: 'Jogo da velha contra o computador. Será que você ganha?', rating: 4.4, size: '4 MB', cat: 'Jogos' },
  { id: 'snake', desc: 'Guie a cobrinha para comer as frutas sem bater nas paredes.', rating: 4.6, size: '6 MB', cat: 'Jogos' },
];

export const storeApp = {
  id: 'store', name: 'Loja', icon: 'store', width: 860, height: 560, single: true, keywords: 'instalar baixar aplicativos jogos loja',
  open(ctx) {
    const { os, body } = ctx;
    const installing = new Map();
    body.classList.add('st');
    function render() {
      const inst = os.settings.installed;
      body.innerHTML = `<div class="st-hero"><div><h1>Loja</h1><p>Aplicativos e jogos verificados. Instalar por aqui é mais seguro do que baixar de sites desconhecidos.</p></div>${icon('store', 72)}</div>
        <h3>Jogos grátis</h3><div class="st-grid">${STORE_ITEMS.map(it => {
          const a = APPS[it.id];
          const p = installing.get(it.id);
          const has = inst.includes(it.id);
          return `<div class="st-card">${icon(a.icon, 56)}<div class="st-info"><b>${esc(a.name)}</b><small>${it.cat} · ★ ${String(it.rating).replace('.', ',')} · ${it.size}</small><p>${esc(it.desc)}</p>
            ${p != null ? `<div class="ex-bar"><i style="width:${p}%"></i></div><small>Baixando e instalando... ${p}%</small>` : has ? `<div class="st-btns"><button class="w-btn primary" data-open="${it.id}" data-tut="store-open-${it.id}">Abrir</button><span class="w-muted">Instalado</span></div>` : `<button class="w-btn primary" data-get="${it.id}" data-tut="store-install-${it.id}">Instalar</button>`}</div></div>`;
        }).join('')}</div>
        <p class="w-muted st-foot">Para desinstalar, vá em Configurações > Aplicativos.</p>`;
      body.querySelectorAll('[data-get]').forEach(b => { b.onclick = () => install(b.dataset.get); });
      body.querySelectorAll('[data-open]').forEach(b => { b.onclick = () => os.openApp(b.dataset.open); });
    }
    function install(id) {
      installing.set(id, 0);
      render();
      os.emit('store:installing', { app: id });
      const t = setInterval(() => {
        const v = Math.min(100, installing.get(id) + 9 + Math.random() * 12);
        installing.set(id, Math.round(v));
        if (v >= 100) {
          clearInterval(t);
          installing.delete(id);
          if (!os.settings.installed.includes(id)) os.set({ installed: [...os.settings.installed, id] });
          os.notify('Instalação concluída', `${APPS[id].name} está pronto para usar. Ele aparece no menu Iniciar.`, APPS[id].icon);
          os.emit('store:install', { app: id });
        }
        render();
      }, 260);
      timers.push(t);
    }
    const timers = [];
    render();
    const unsub = os.on('app:uninstall', render);
    return { onDestroy() { timers.forEach(clearInterval); unsub(); } };
  },
};
