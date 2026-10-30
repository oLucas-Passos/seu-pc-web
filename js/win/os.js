// O "sistema operacional" simulado: área de trabalho, janelas, barra de tarefas, menus e diálogos.
import { FS, SPECIAL, iconFor, ext, BAD_CHARS } from './fs.js';
import { icon, lico } from './icons.js';
import { genImage } from './gen.js';
import { store } from '../store.js';
import { APPS } from './apps/index.js';

const SET_KEY = 'win:settings';
const TASKBAR_H = 48;
const CELL_W = 92, CELL_H = 102;

export const DEFAULT_SETTINGS = {
  wallpaper: 'bloom', theme: 'light', accent: '#0067c0', username: 'Você', pcName: 'PC-DA-SALA',
  wifi: { on: true, connected: 'Casa_Silva', known: ['Casa_Silva'] }, bluetooth: false, airplane: false, paired: [],
  volume: 60, brightness: 100, textScale: 100, taskbarAlign: 'center', notifications: true,
  installed: ['explorer', 'notepad', 'calculator', 'paint', 'photos', 'browser', 'settings', 'taskmgr', 'store', 'player'],
  pinned: ['explorer', 'browser', 'notepad', 'store'],
  iconPos: {}, clock24: true, updates: 'pending', startup: { onedrive: true, spotify: false, teams: true },
};

const esc = s => String(s ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
export { esc };

function el(tag, cls, html) {
  const e = document.createElement(tag);
  if (cls) e.className = cls;
  if (html != null) e.innerHTML = html;
  return e;
}

export class WinOS {
  constructor(host, opts = {}) {
    this.host = host;
    this.opts = opts;
    this.fs = new FS();
    this.settings = this.loadSettings();
    this.windows = [];
    this.zTop = 10;
    this.listeners = new Map();
    this.clipboard = null;
    this.notifs = [];
    this.state = 'off';
    this.selected = new Set();
    this.timers = [];
    this.winSeq = 0;
    this.build();
    this.applySettings();
    this.fs.onChange(() => { if (this.state === 'desktop') this.renderDesktop(); });
    this.ro = new ResizeObserver(() => this.fit());
    this.ro.observe(host);
    this.fit();
    this.timers.push(setInterval(() => this.tickClock(), 10000));
  }

  /* ---------------- eventos ---------------- */
  on(evt, fn) {
    if (!this.listeners.has(evt)) this.listeners.set(evt, new Set());
    this.listeners.get(evt).add(fn);
    return () => this.listeners.get(evt)?.delete(fn);
  }
  emit(evt, data = {}) {
    for (const fn of this.listeners.get(evt) || []) try { fn(data, evt); } catch (e) { console.error(e); }
    for (const fn of this.listeners.get('*') || []) try { fn(data, evt); } catch (e) { console.error(e); }
  }

  /* ---------------- configurações ---------------- */
  loadSettings() {
    const s = store.get(SET_KEY, {});
    return { ...structuredClone(DEFAULT_SETTINGS), ...s, wifi: { ...DEFAULT_SETTINGS.wifi, ...(s.wifi || {}) }, startup: { ...DEFAULT_SETTINGS.startup, ...(s.startup || {}) } };
  }
  saveSettings() { store.set(SET_KEY, this.settings); }
  set(patch, evt) {
    Object.assign(this.settings, patch);
    this.saveSettings();
    this.applySettings();
    if (evt) this.emit(evt, patch);
  }
  resetAll() {
    store.remove(SET_KEY);
    this.fs.reset();
    this.settings = this.loadSettings();
    for (const w of [...this.windows]) this.close(w, { force: true });
    this.applySettings();
    this.renderDesktop();
  }
  wallpaperUrl() {
    const w = this.settings.wallpaper;
    if (w.startsWith('node:')) {
      const n = this.fs.get(w.slice(5));
      if (n) return n.dataUrl || genImage(n.gen || 'bloom', 1280, 800);
    }
    if (w.startsWith('color:')) return null;
    return genImage(w, 1280, 800);
  }
  applySettings() {
    const s = this.settings;
    const scr = this.screen;
    scr.classList.toggle('w-dark', s.theme === 'dark');
    scr.style.setProperty('--w-accent', s.accent);
    scr.style.setProperty('--w-fs', (s.textScale / 100).toString());
    scr.style.filter = s.brightness < 100 ? `brightness(${0.35 + s.brightness / 100 * 0.65})` : '';
    const url = this.wallpaperUrl();
    this.wall.style.backgroundImage = url ? `url("${url}")` : 'none';
    this.wall.style.backgroundColor = s.wallpaper.startsWith('color:') ? s.wallpaper.slice(6) : '#0b3f8f';
    this.taskbar.classList.toggle('left', s.taskbarAlign === 'left');
    this.renderTray();
  }

  /* ---------------- estrutura ---------------- */
  build() {
    this.host.innerHTML = '';
    this.viewport = el('div', 'wv');
    this.screen = el('div', 'ws');
    this.screen.tabIndex = 0;
    this.viewport.appendChild(this.screen);
    this.host.appendChild(this.viewport);
    const S = this.screen;
    this.desk = el('div', 'w-desk');
    this.wall = el('div', 'w-wall');
    this.iconsEl = el('div', 'w-icons');
    this.band = el('div', 'w-band');
    this.band.hidden = true;
    this.desk.append(this.wall, this.iconsEl, this.band);
    this.winLayer = el('div', 'w-winlayer');
    this.snapEl = el('div', 'w-snap');
    this.snapEl.hidden = true;
    this.taskbar = el('div', 'w-taskbar');
    this.startEl = el('div', 'w-panel w-start'); this.startEl.hidden = true;
    this.searchEl = el('div', 'w-panel w-searchp'); this.searchEl.hidden = true;
    this.quickEl = el('div', 'w-panel w-quick'); this.quickEl.hidden = true;
    this.calEl = el('div', 'w-panel w-cal'); this.calEl.hidden = true;
    this.ctxEl = el('div', 'w-ctx'); this.ctxEl.hidden = true;
    this.toastEl = el('div', 'w-toasts');
    this.altTabEl = el('div', 'w-alttab'); this.altTabEl.hidden = true;
    this.dlgLayer = el('div', 'w-dlglayer');
    this.lockEl = el('div', 'w-lock'); this.lockEl.hidden = true;
    this.bootEl = el('div', 'w-boot');
    this.hlEl = el('div', 'w-hl'); this.hlEl.hidden = true;
    S.append(this.desk, this.winLayer, this.snapEl, this.taskbar, this.startEl, this.searchEl, this.quickEl, this.calEl, this.toastEl, this.altTabEl, this.ctxEl, this.dlgLayer, this.lockEl, this.bootEl, this.hlEl);
    this.buildTaskbar();
    this.bindDesktop();
    this.bindGlobal();
    this.showBoot('off');
  }

  fit() {
    const r = this.host.getBoundingClientRect();
    if (!r.width || !r.height) return;
    const scale = Math.min(r.width / Math.max(1024, Math.min(1400, r.width)), r.height / 640);
    this.scale = scale;
    this.vw = Math.round(r.width / scale);
    this.vh = Math.round(r.height / scale);
    Object.assign(this.screen.style, { width: this.vw + 'px', height: this.vh + 'px', transform: `scale(${scale})` });
    for (const w of this.windows) { this.clampWin(w); this.applyGeom(w); }
    if (this.state === 'desktop') this.renderDesktop();
  }

  toLocal(cx, cy) {
    const r = this.screen.getBoundingClientRect();
    return { x: (cx - r.left) / this.scale, y: (cy - r.top) / this.scale };
  }
  rectOf(elm) {
    const r = elm.getBoundingClientRect(), s = this.screen.getBoundingClientRect();
    return { x: (r.left - s.left) / this.scale, y: (r.top - s.top) / this.scale, w: r.width / this.scale, h: r.height / this.scale };
  }

  /* ---------------- ligar / desligar ---------------- */
  showBoot(mode) {
    const B = this.bootEl;
    B.hidden = false;
    B.className = 'w-boot ' + mode;
    if (mode === 'off') {
      B.innerHTML = `<button class="w-poweron" data-tut="poweron">${lico('power', 34)}<span>Ligar o computador</span></button><p>O computador está desligado.</p>`;
      B.querySelector('button').onclick = () => this.boot();
    } else if (mode === 'sleep') {
      B.innerHTML = '<p>Suspenso. Clique ou aperte uma tecla para acordar.</p>';
      B.onclick = () => { B.onclick = null; this.showLock(); };
    } else {
      const txt = { booting: '', shutting: 'Desligando', restarting: 'Reiniciando' }[mode] || '';
      B.innerHTML = `<div class="w-bootlogo">${icon('start', 88)}</div><div class="w-spinner">${'<i></i>'.repeat(6)}</div><p>${txt}</p>`;
    }
  }
  hideBoot() { this.bootEl.hidden = true; this.bootEl.onclick = null; }

  boot(fast = false) {
    this.state = 'booting';
    this.emit('power', { state: 'boot' });
    this.showBoot('booting');
    setTimeout(() => this.showLock(), fast ? 200 : 1800);
  }
  showLock() {
    this.state = 'lock';
    this.hideBoot();
    this.closePanels();
    const L = this.lockEl;
    L.hidden = false;
    L.className = 'w-lock';
    L.style.backgroundImage = this.wallpaperUrl() ? `url("${this.wallpaperUrl()}")` : '';
    const now = new Date();
    L.innerHTML = `<div class="w-lock-clock"><b>${now.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}</b><span>${now.toLocaleDateString('pt-BR', { weekday: 'long', day: 'numeric', month: 'long' })}</span></div><p class="w-lock-hint">Clique em qualquer lugar ou aperte uma tecla para desbloquear</p>`;
    const go = () => { L.removeEventListener('click', go); this.screen.removeEventListener('keydown', key); this.showLogin(); };
    const key = (e) => { if (this.state === 'lock') go(); e.preventDefault(); };
    L.addEventListener('click', go);
    this.screen.addEventListener('keydown', key);
    this.screen.focus({ preventScroll: true });
    this.emit('power', { state: 'lock' });
  }
  showLogin() {
    const L = this.lockEl;
    L.className = 'w-lock login';
    L.innerHTML = `<div class="w-login">${icon('user', 120)}<b>${esc(this.settings.username)}</b>
      <button class="w-btn primary" data-tut="login">Entrar</button>
      <p>Num computador de verdade, aqui você digitaria sua senha ou PIN.</p></div>`;
    L.querySelector('button').onclick = () => this.login();
    L.querySelector('button').focus();
    this.emit('power', { state: 'unlocked' });
  }
  login() {
    this.lockEl.hidden = true;
    this.state = 'desktop';
    this.renderDesktop();
    this.renderTaskbar();
    this.screen.focus({ preventScroll: true });
    this.emit('power', { state: 'login' });
  }
  skipToDesktop() {
    this.hideBoot();
    this.lockEl.hidden = true;
    this.state = 'desktop';
    this.renderDesktop();
    this.renderTaskbar();
  }
  async shutdown(kind = 'shutdown') {
    this.closePanels();
    for (const w of [...this.windows]) {
      const ok = await this.close(w);
      if (ok === false) return;
    }
    this.state = 'off';
    this.emit('power', { state: kind });
    this.showBoot(kind === 'restart' ? 'restarting' : 'shutting');
    setTimeout(() => (kind === 'restart' ? this.boot() : this.showBoot('off')), 1600);
  }
  sleep() {
    this.closePanels();
    this.state = 'sleep';
    this.emit('power', { state: 'sleep' });
    this.showBoot('sleep');
  }
  lock() {
    this.closePanels();
    this.showLock();
  }

  /* ---------------- área de trabalho ---------------- */
  desktopItems() {
    const items = [
      { key: 'pc', name: 'Este Computador', icon: 'pc' },
      { key: 'trash', name: 'Lixeira', icon: this.fs.children(SPECIAL.TRASH).length ? 'trashFull' : 'trash' },
    ];
    for (const n of this.fs.children(SPECIAL.DESKTOP)) items.push({ key: n.id, name: n.name, icon: iconFor(n), node: n });
    return items;
  }

  renderDesktop() {
    const items = this.desktopItems();
    const rows = Math.max(1, Math.floor((this.vh - TASKBAR_H - 8) / CELL_H));
    const cols = Math.max(1, Math.floor((this.vw - 8) / CELL_W));
    const pos = this.settings.iconPos;
    const taken = new Set();
    const keys = new Set(items.map(i => i.key));
    for (const k of Object.keys(pos)) if (!keys.has(k)) delete pos[k];
    for (const it of items) {
      const p = pos[it.key];
      if (p && p[0] < cols && p[1] < rows && !taken.has(p.join(','))) taken.add(p.join(','));
      else delete pos[it.key];
    }
    for (const it of items) {
      if (pos[it.key]) continue;
      outer: for (let c = 0; c < cols; c++) for (let r = 0; r < rows; r++) if (!taken.has(c + ',' + r)) { pos[it.key] = [c, r]; taken.add(c + ',' + r); break outer; }
    }
    this.iconsEl.innerHTML = '';
    for (const it of items) {
      const [c, r] = pos[it.key] || [0, 0];
      const d = el('div', 'w-dicon' + (this.selected.has(it.key) ? ' sel' : ''), `${icon(it.icon, 48)}<span class="lbl">${esc(it.name)}</span>`);
      if (it.node && it.node.type === 'shortcut') d.insertAdjacentHTML('afterbegin', `<span class="w-shortcut">${icon('shortcut', 18)}</span>`);
      Object.assign(d.style, { left: 8 + c * CELL_W + 'px', top: 8 + r * CELL_H + 'px' });
      d.dataset.key = it.key;
      d.dataset.name = it.name;
      d.dataset.tut = 'icon-' + (it.node ? it.node.id : it.key);
      d.draggable = true;
      d.tabIndex = -1;
      this.iconsEl.appendChild(d);
    }
  }

  bindDesktop() {
    const D = this.desk;
    let lastClick = { key: null, t: 0 };
    let bandStart = null;
    D.addEventListener('pointerdown', (e) => {
      if (e.button === 2) return;
      this.closePanels();
      const ic = e.target.closest('.w-dicon');
      if (ic) {
        const k = ic.dataset.key;
        if (e.ctrlKey) { this.selected.has(k) ? this.selected.delete(k) : this.selected.add(k); }
        else if (!this.selected.has(k)) { this.selected.clear(); this.selected.add(k); }
        this.markSelection();
        const now = performance.now();
        if (lastClick.key === k && now - lastClick.t < 450) { lastClick = { key: null, t: 0 }; this.openDesktopItem(k); }
        else { lastClick = { key: k, t: now }; this.emit('desktop:select', { key: k, name: ic.dataset.name }); }
        return;
      }
      if (e.target.closest('.w-icon-rename')) return;
      this.selected.clear();
      this.markSelection();
      bandStart = this.toLocal(e.clientX, e.clientY);
      D.setPointerCapture(e.pointerId);
    });
    D.addEventListener('pointermove', (e) => {
      if (!bandStart) return;
      const p = this.toLocal(e.clientX, e.clientY);
      const x = Math.min(p.x, bandStart.x), y = Math.min(p.y, bandStart.y), w = Math.abs(p.x - bandStart.x), h = Math.abs(p.y - bandStart.y);
      if (w + h < 6) return;
      Object.assign(this.band.style, { left: x + 'px', top: y + 'px', width: w + 'px', height: h + 'px' });
      this.band.hidden = false;
      this.selected.clear();
      for (const ic of this.iconsEl.children) {
        const r = this.rectOf(ic);
        if (r.x < x + w && r.x + r.w > x && r.y < y + h && r.y + r.h > y) this.selected.add(ic.dataset.key);
      }
      this.markSelection();
    });
    D.addEventListener('pointerup', () => {
      if (bandStart && !this.band.hidden && this.selected.size) this.emit('desktop:band', { count: this.selected.size });
      bandStart = null; this.band.hidden = true;
    });
    D.addEventListener('contextmenu', (e) => {
      e.preventDefault();
      const p = this.toLocal(e.clientX, e.clientY);
      const ic = e.target.closest('.w-dicon');
      if (ic) {
        const k = ic.dataset.key;
        if (!this.selected.has(k)) { this.selected.clear(); this.selected.add(k); this.markSelection(); }
        this.contextMenu(p.x, p.y, this.iconMenu(k));
        this.emit('ctx:open', { target: 'icon', key: k });
      } else {
        this.contextMenu(p.x, p.y, this.desktopMenu(p));
        this.emit('ctx:open', { target: 'desktop' });
      }
    });
    // arrastar e soltar
    D.addEventListener('dragstart', (e) => {
      const ic = e.target.closest('.w-dicon');
      if (!ic) return;
      if (!this.selected.has(ic.dataset.key)) { this.selected.clear(); this.selected.add(ic.dataset.key); this.markSelection(); }
      const p = this.toLocal(e.clientX, e.clientY);
      e.dataTransfer.setData('text/plain', JSON.stringify({ src: 'desktop', keys: [...this.selected], from: ic.dataset.key, x: p.x, y: p.y }));
      e.dataTransfer.effectAllowed = 'move';
    });
    D.addEventListener('dragover', (e) => { e.preventDefault(); e.dataTransfer.dropEffect = 'move'; });
    D.addEventListener('drop', (e) => {
      e.preventDefault();
      let data;
      try { data = JSON.parse(e.dataTransfer.getData('text/plain')); } catch { return; }
      const p = this.toLocal(e.clientX, e.clientY);
      const target = e.target.closest('.w-dicon');
      const ids = data.src === 'desktop' ? data.keys.filter(k => k !== 'pc' && k !== 'trash') : data.ids;
      if (target && !(data.src === 'desktop' && data.keys.includes(target.dataset.key))) {
        const tk = target.dataset.key;
        if (tk === 'trash') { this.deleteNodes(ids); return; }
        const tn = this.fs.get(tk);
        if (tn && tn.type === 'folder') { this.moveNodes(ids, tn.id); return; }
      }
      if (data.src === 'explorer') { this.moveNodes(ids, SPECIAL.DESKTOP); }
      const cols = Math.max(1, Math.floor((this.vw - 8) / CELL_W));
      const rows = Math.max(1, Math.floor((this.vh - TASKBAR_H - 8) / CELL_H));
      const keys = data.src === 'desktop' ? data.keys : ids;
      const fromPos = data.src === 'desktop' ? this.settings.iconPos[data.from] : null;
      const tc = Math.max(0, Math.min(cols - 1, Math.floor((p.x - 8) / CELL_W)));
      const tr = Math.max(0, Math.min(rows - 1, Math.floor((p.y - 8) / CELL_H)));
      for (const k of keys) {
        const op = this.settings.iconPos[k];
        let c = tc, r = tr;
        if (fromPos && op) { c = Math.max(0, Math.min(cols - 1, tc + op[0] - fromPos[0])); r = Math.max(0, Math.min(rows - 1, tr + op[1] - fromPos[1])); }
        for (const [kk, pp] of Object.entries(this.settings.iconPos)) if (kk !== k && pp[0] === c && pp[1] === r) delete this.settings.iconPos[kk];
        this.settings.iconPos[k] = [c, r];
      }
      this.saveSettings();
      this.renderDesktop();
      this.emit('desktop:move', { keys });
    });
  }

  markSelection() {
    for (const ic of this.iconsEl.children) ic.classList.toggle('sel', this.selected.has(ic.dataset.key));
  }

  openDesktopItem(k) {
    this.emit('desktop:open', { key: k });
    if (k === 'pc') return this.openApp('explorer', { folder: 'thispc' });
    if (k === 'trash') return this.openApp('explorer', { folder: SPECIAL.TRASH });
    const n = this.fs.get(k);
    if (n) this.openFile(n);
  }

  iconMenu(k) {
    if (k === 'pc') return [
      { label: 'Abrir', bold: true, action: () => this.openDesktopItem('pc') },
      { sep: true },
      { label: 'Propriedades', action: () => this.openApp('settings', { page: 'system', sub: 'about' }) },
    ];
    if (k === 'trash') return [
      { label: 'Abrir', bold: true, action: () => this.openDesktopItem('trash') },
      { label: 'Esvaziar Lixeira', icon: 'trash', disabled: !this.fs.children(SPECIAL.TRASH).length, action: () => this.emptyTrash() },
    ];
    const ids = [...this.selected].filter(x => x !== 'pc' && x !== 'trash');
    return [
      { label: 'Abrir', bold: true, action: () => this.openDesktopItem(k) },
      { sep: true },
      { label: 'Recortar', icon: 'cut', shortcut: 'Ctrl+X', action: () => this.setClipboard('cut', ids) },
      { label: 'Copiar', icon: 'copy', shortcut: 'Ctrl+C', action: () => this.setClipboard('copy', ids) },
      { label: 'Renomear', icon: 'rename', shortcut: 'F2', tut: 'ctx-rename', action: () => this.renameDesktopIcon(k) },
      { label: 'Excluir', icon: 'trash', shortcut: 'Delete', tut: 'ctx-delete', action: () => this.deleteNodes(ids) },
      { sep: true },
      { label: 'Propriedades', action: () => this.properties(k) },
    ];
  }

  desktopMenu() {
    return [
      { label: 'Exibir', icon: 'view', submenu: [
        { label: 'Organizar ícones automaticamente', action: () => { this.settings.iconPos = {}; this.saveSettings(); this.renderDesktop(); } },
      ] },
      { label: 'Classificar por', icon: 'sort', submenu: [
        { label: 'Nome', action: () => { this.settings.iconPos = {}; this.saveSettings(); this.renderDesktop(); } },
      ] },
      { label: 'Atualizar', icon: 'refresh', action: () => this.renderDesktop() },
      { sep: true },
      { label: 'Colar', icon: 'paste', shortcut: 'Ctrl+V', disabled: !this.clipboard, action: () => this.paste(SPECIAL.DESKTOP) },
      { label: 'Novo', icon: 'plus', tut: 'ctx-new', submenu: [
        { label: 'Pasta', iconBig: 'folder', tut: 'ctx-new-folder', action: () => this.newItem(SPECIAL.DESKTOP, 'folder') },
        { label: 'Documento de texto', iconBig: 'txt', tut: 'ctx-new-txt', action: () => this.newItem(SPECIAL.DESKTOP, 'txt') },
      ] },
      { sep: true },
      { label: 'Personalizar', icon: 'brush', tut: 'ctx-personalize', action: () => this.openApp('settings', { page: 'personalization' }) },
    ];
  }

  newItem(parent, kind) {
    const node = kind === 'folder' ? this.fs.create(parent, 'Nova pasta', 'folder') : this.fs.create(parent, 'Novo documento de texto.txt', 'file', { content: '' });
    this.emit('fs:create', { node, parent });
    if (parent === SPECIAL.DESKTOP) {
      this.renderDesktop();
      this.selected.clear(); this.selected.add(node.id); this.markSelection();
      this.renameDesktopIcon(node.id);
    }
    return node;
  }

  renameDesktopIcon(k) {
    const ic = this.iconsEl.querySelector(`[data-key="${k}"]`);
    const n = this.fs.get(k);
    if (!ic || !n) return;
    const lbl = ic.querySelector('.lbl');
    const input = el('textarea', 'w-icon-rename');
    input.value = n.name;
    input.rows = 2;
    lbl.replaceWith(input);
    ic.draggable = false;
    input.focus();
    const e0 = ext(n.name);
    input.setSelectionRange(0, n.type === 'file' && e0 ? n.name.length - e0.length - 1 : n.name.length);
    let done = false;
    const commit = (ok) => {
      if (done) return;
      done = true;
      const v = input.value.replace(/\n/g, '').trim();
      if (ok && v && v !== n.name) this.renameNode(n.id, v);
      else this.renderDesktop();
      this.screen.focus({ preventScroll: true });
    };
    input.addEventListener('keydown', (e) => {
      e.stopPropagation();
      if (e.key === 'Enter') { e.preventDefault(); commit(true); }
      if (e.key === 'Escape') commit(false);
    });
    input.addEventListener('blur', () => commit(true));
    input.addEventListener('pointerdown', e => e.stopPropagation());
  }

  renameNode(id, name) {
    const n = this.fs.get(id);
    const oldExt = ext(n.name);
    if (n.type === 'file' && oldExt && ext(name) !== oldExt && !BAD_CHARS.test(name)) {
      // aviso clássico do Windows ao trocar a extensão
      return this.dialog({ title: 'Renomear', icon: 'warn', message: 'Se você alterar a extensão do nome do arquivo, ele poderá ficar inutilizável. Deseja mesmo alterá-la?', buttons: [{ label: 'Sim', value: true }, { label: 'Não', value: false, primary: true }] })
        .then(ok => ok ? this.doRename(id, name) : this.renderDesktop());
    }
    return this.doRename(id, name);
  }
  doRename(id, name) {
    const r = this.fs.rename(id, name);
    if (r.error) { this.dialog({ title: 'Renomear', icon: 'error', message: r.error }); this.renderDesktop(); return false; }
    this.emit('fs:rename', { node: r.node, old: r.old });
    return true;
  }

  deleteNodes(ids, permanent = false) {
    const list = ids.map(id => this.fs.get(id)).filter(Boolean);
    if (!list.length) return;
    if (permanent) {
      return this.dialog({ title: 'Excluir', icon: 'warn', message: list.length === 1 ? `Tem certeza de que deseja excluir permanentemente "${list[0].name}"?` : `Tem certeza de que deseja excluir permanentemente estes ${list.length} itens?`, buttons: [{ label: 'Sim', value: true, primary: true }, { label: 'Não', value: false }] })
        .then(ok => { if (ok) for (const n of list) { this.fs.purge(n.id); this.emit('fs:purge', { node: n }); } });
    }
    for (const n of list) {
      const r = this.fs.remove(n.id);
      if (r.error) { this.dialog({ title: 'Excluir', icon: 'error', message: r.error }); continue; }
      this.emit('fs:delete', { node: n });
    }
    this.selected.clear();
  }

  emptyTrash() {
    const n = this.fs.children(SPECIAL.TRASH).length;
    if (!n) return;
    this.dialog({ title: 'Excluir vários itens', icon: 'warn', message: `Tem certeza de que deseja excluir permanentemente ${n === 1 ? 'este item' : `estes ${n} itens`}? Não será possível recuperá-los.`, buttons: [{ label: 'Sim', value: true, primary: true }, { label: 'Não', value: false }] })
      .then(ok => { if (ok) { this.fs.emptyTrash(); this.emit('fs:empty', {}); this.renderDesktop(); } });
  }

  moveNodes(ids, parent) {
    for (const id of ids) {
      const r = this.fs.move(id, parent);
      if (r.error) { this.dialog({ title: 'Mover', icon: 'error', message: r.error }); continue; }
      if (!r.same) this.emit('fs:move', { node: r.node, to: parent });
    }
  }

  setClipboard(mode, ids) {
    if (!ids.length) return;
    this.clipboard = { mode, ids: [...ids] };
    this.emit('clipboard', { mode, ids });
  }
  paste(parent) {
    const cb = this.clipboard;
    if (!cb) return;
    for (const id of cb.ids) {
      const n = this.fs.get(id);
      if (!n || n.parent === SPECIAL.TRASH) continue;
      if (cb.mode === 'copy') {
        if (n.type === 'folder' && (id === parent || this.fs.isInside(parent, id))) { this.dialog({ title: 'Copiar', icon: 'error', message: 'A pasta de destino está dentro da pasta de origem.' }); continue; }
        const c = this.fs.copy(id, parent);
        this.emit('fs:copy', { node: c, from: n, to: parent });
      } else {
        const r = this.fs.move(id, parent);
        if (r.error) { this.dialog({ title: 'Mover', icon: 'error', message: r.error }); continue; }
        this.emit('fs:move', { node: r.node, to: parent });
      }
    }
    if (cb.mode === 'cut') this.clipboard = null;
    this.emit('fs:paste', { parent, mode: cb.mode });
  }

  properties(id) {
    const n = this.fs.get(id);
    if (!n) return;
    const isFolder = n.type === 'folder';
    const items = isFolder ? this.fs.children(id).length : null;
    this.dialog({
      title: `Propriedades de ${n.name}`, icon: null, width: 420,
      html: `<div class="w-props">${icon(iconFor(n), 48)}<b>${esc(n.name)}</b></div>
        <table class="w-kv"><tr><td>Tipo</td><td>${esc(isFolder ? 'Pasta de arquivos' : (n.type === 'shortcut' ? 'Atalho' : (ext(n.name).toUpperCase() + ' - arquivo')))}</td></tr>
        <tr><td>Local</td><td>${esc(this.fs.pathString(n.parent))}</td></tr>
        <tr><td>Tamanho</td><td>${this.fmtSize(this.fs.sizeOf(n))}${isFolder ? ` (${items} itens)` : ''}</td></tr>
        <tr><td>Criado em</td><td>${new Date(n.created).toLocaleString('pt-BR')}</td></tr>
        <tr><td>Modificado em</td><td>${new Date(n.modified).toLocaleString('pt-BR')}</td></tr></table>`,
    });
    this.emit('fs:properties', { node: n });
  }
  fmtSize(b) {
    if (b < 1024) return `${b} bytes`;
    if (b < 1048576) return `${Math.ceil(b / 1024)} KB`;
    return `${(b / 1048576).toFixed(1).replace('.', ',')} MB`;
  }

  openFile(n) {
    this.emit('file:open', { node: n });
    if (n.type === 'folder') return this.openApp('explorer', { folder: n.id });
    if (n.type === 'shortcut') return this.openApp(n.app);
    const e = ext(n.name);
    if (e === 'txt') return this.openApp('notepad', { node: n.id });
    if (e === 'jpg' || e === 'png') return this.openApp('photos', { node: n.id });
    if (e === 'mp3' || e === 'mp4') return this.openApp('player', { node: n.id });
    if (e === 'pdf') return this.openApp('browser', { url: 'arquivo://' + n.id });
    return this.dialog({ title: n.name, icon: 'question', message: 'Como você deseja abrir este arquivo? Nenhum aplicativo instalado sabe abrir este tipo de arquivo.' });
  }

  /* ---------------- janelas ---------------- */
  openApp(appId, args = {}) {
    if (this.state !== 'desktop') return null;
    const app = APPS[appId];
    if (!app) return null;
    if (!this.settings.installed.includes(appId) && !app.system) {
      this.dialog({ title: app.name, icon: 'info', message: `${app.name} não está instalado. Abra a Loja para instalar.` });
      return null;
    }
    this.closePanels();
    if (app.single) {
      const ex = this.windows.find(w => w.app === appId);
      if (ex) { ex.api.onArgs && ex.api.onArgs(args); this.restore(ex); this.focus(ex); return ex; }
    }
    const win = this.createWindow(app, args);
    this.emit('app:open', { app: appId, win });
    return win;
  }

  createWindow(app, args) {
    const n = this.windows.filter(w => !w.min).length;
    const W = Math.min(app.width || 760, this.vw - 30);
    const H = Math.min(app.height || 520, this.vh - TASKBAR_H - 24);
    const win = {
      id: 'w' + (++this.winSeq), app: app.id, title: app.name, iconName: app.icon,
      x: Math.round(Math.max(8, Math.min(this.vw - W - 8, (this.vw - W) / 2 - 120 + n * 34))),
      y: Math.round(Math.max(6, Math.min(this.vh - TASKBAR_H - H - 6, (this.vh - TASKBAR_H - H) / 2 - 50 + n * 30))),
      w: W, h: H, max: false, min: false, snap: null, prev: null, frozen: false, closeHooks: [], api: {},
    };
    const E = el('div', 'w-window');
    E.dataset.app = app.id;
    E.dataset.win = win.id;
    E.innerHTML = `<div class="w-titlebar"><span class="w-ticon">${icon(app.icon, 18)}</span><span class="w-title"></span>
      <div class="w-ctrls"><button data-act="min" data-tut="win-min" title="Minimizar">${lico('min', 16)}</button><button data-act="max" data-tut="win-max" title="Maximizar">${lico('max', 14)}</button><button data-act="close" data-tut="win-close" class="close" title="Fechar">${lico('close', 16)}</button></div></div>
      <div class="w-body"></div><div class="w-frozen-veil"></div>` +
      ['n', 's', 'e', 'w', 'ne', 'nw', 'se', 'sw'].map(d => `<div class="w-rs ${d}" data-dir="${d}"></div>`).join('');
    win.el = E;
    win.body = E.querySelector('.w-body');
    win.titleEl = E.querySelector('.w-title');
    this.winLayer.appendChild(E);
    this.windows.push(win);
    const ctx = {
      os: this, win, body: win.body, args,
      setTitle: (t) => { win.title = t; win.titleEl.textContent = win.frozen ? t + ' (Não está respondendo)' : t; this.renderTaskbar(); },
      onClose: (fn) => win.closeHooks.push(fn),
      emit: (e, d) => this.emit(e, d),
    };
    ctx.setTitle(app.name);
    this.bindWindow(win);
    try { win.api = app.open(ctx) || {}; } catch (e) { console.error(e); }
    this.applyGeom(win);
    this.focus(win);
    E.classList.add('w-opening');
    setTimeout(() => E.classList.remove('w-opening'), 220);
    return win;
  }

  bindWindow(win) {
    const E = win.el;
    E.addEventListener('pointerdown', () => this.focus(win), true);
    const tb = E.querySelector('.w-titlebar');
    let lastDown = 0;
    tb.addEventListener('pointerdown', (e) => {
      if (e.target.closest('button') || e.button !== 0) return;
      const now = performance.now();
      if (now - lastDown < 380) { lastDown = 0; this.toggleMax(win); return; }
      lastDown = now;
      this.startDrag(win, e);
    });
    tb.addEventListener('contextmenu', (e) => {
      e.preventDefault();
      const p = this.toLocal(e.clientX, e.clientY);
      this.contextMenu(p.x, p.y, [
        { label: 'Restaurar', icon: 'restore', disabled: !win.max && !win.snap, action: () => this.restoreSize(win) },
        { label: 'Minimizar', icon: 'min', action: () => this.minimize(win) },
        { label: 'Maximizar', icon: 'max', disabled: win.max, action: () => this.maximize(win) },
        { sep: true },
        { label: 'Fechar', icon: 'close', shortcut: 'Alt+F4', action: () => this.close(win) },
      ]);
    });
    E.querySelector('.w-ctrls').addEventListener('click', (e) => {
      const b = e.target.closest('button');
      if (!b) return;
      if (b.dataset.act === 'min') this.minimize(win);
      if (b.dataset.act === 'max') this.toggleMax(win);
      if (b.dataset.act === 'close') this.close(win);
    });
    for (const h of E.querySelectorAll('.w-rs')) h.addEventListener('pointerdown', (e) => this.startResize(win, e, h.dataset.dir));
  }

  startDrag(win, e) {
    const E = win.el;
    E.setPointerCapture(e.pointerId);
    const start = this.toLocal(e.clientX, e.clientY);
    let ox = win.x, oy = win.y, moved = false, snapTo = null;
    const move = (ev) => {
      const p = this.toLocal(ev.clientX, ev.clientY);
      const dx = p.x - start.x, dy = p.y - start.y;
      if (!moved && Math.hypot(dx, dy) < 4) return;
      if (!moved && (win.max || win.snap)) {
        const rel = (start.x - win.x) / win.w;
        const prev = win.prev || { w: Math.min(760, this.vw - 100), h: Math.min(520, this.vh - 120) };
        win.max = false; win.snap = null; E.classList.remove('max');
        win.w = prev.w; win.h = prev.h;
        ox = start.x - win.w * rel; oy = 0;
        this.updateMaxIcon(win);
      }
      moved = true;
      win.x = Math.round(ox + dx);
      win.y = Math.round(Math.max(0, Math.min(this.vh - TASKBAR_H - 30, oy + dy)));
      this.applyGeom(win);
      snapTo = p.x <= 3 ? 'left' : p.x >= this.vw - 3 ? 'right' : p.y <= 3 ? 'max' : null;
      this.showSnapPreview(snapTo);
    };
    const up = () => {
      E.removeEventListener('pointermove', move);
      E.removeEventListener('pointerup', up);
      this.showSnapPreview(null);
      if (!moved) return;
      if (snapTo === 'max') this.maximize(win);
      else if (snapTo) this.snapWin(win, snapTo);
      else { this.clampWin(win); this.applyGeom(win); this.emit('win:move', { app: win.app, x: win.x, y: win.y }); }
    };
    E.addEventListener('pointermove', move);
    E.addEventListener('pointerup', up);
  }

  startResize(win, e, dir) {
    e.stopPropagation();
    if (win.max) return;
    const E = win.el;
    E.setPointerCapture(e.pointerId);
    const s = this.toLocal(e.clientX, e.clientY);
    const g0 = { x: win.x, y: win.y, w: win.w, h: win.h };
    const minW = 320, minH = 200;
    const move = (ev) => {
      const p = this.toLocal(ev.clientX, ev.clientY);
      const dx = p.x - s.x, dy = p.y - s.y;
      if (dir.includes('e')) win.w = Math.max(minW, g0.w + dx);
      if (dir.includes('s')) win.h = Math.max(minH, g0.h + dy);
      if (dir.includes('w')) { win.w = Math.max(minW, g0.w - dx); win.x = g0.x + g0.w - win.w; }
      if (dir.includes('n')) { win.h = Math.max(minH, g0.h - dy); win.y = Math.max(0, g0.y + g0.h - win.h); }
      win.snap = null;
      this.applyGeom(win);
    };
    const up = () => {
      E.removeEventListener('pointermove', move);
      E.removeEventListener('pointerup', up);
      this.emit('win:resize', { app: win.app, w: win.w, h: win.h });
    };
    E.addEventListener('pointermove', move);
    E.addEventListener('pointerup', up);
  }

  showSnapPreview(kind) {
    const S = this.snapEl;
    if (!kind) { S.hidden = true; return; }
    const H = this.vh - TASKBAR_H;
    const g = kind === 'left' ? [0, 0, this.vw / 2, H] : kind === 'right' ? [this.vw / 2, 0, this.vw / 2, H] : [0, 0, this.vw, H];
    Object.assign(S.style, { left: g[0] + 6 + 'px', top: g[1] + 6 + 'px', width: g[2] - 12 + 'px', height: g[3] - 12 + 'px' });
    S.hidden = false;
  }

  clampWin(win) {
    win.w = Math.min(win.w, this.vw);
    win.h = Math.min(win.h, this.vh - TASKBAR_H);
    win.x = Math.max(-win.w + 120, Math.min(this.vw - 120, win.x));
    win.y = Math.max(0, Math.min(this.vh - TASKBAR_H - 40, win.y));
  }

  applyGeom(win) {
    const H = this.vh - TASKBAR_H;
    let g = { x: win.x, y: win.y, w: win.w, h: win.h };
    if (win.max) g = { x: 0, y: 0, w: this.vw, h: H };
    else if (win.snap === 'left') g = { x: 0, y: 0, w: this.vw / 2, h: H };
    else if (win.snap === 'right') g = { x: this.vw / 2, y: 0, w: this.vw / 2, h: H };
    Object.assign(win.el.style, { left: g.x + 'px', top: g.y + 'px', width: g.w + 'px', height: g.h + 'px' });
    win.el.classList.toggle('max', !!win.max);
    win.el.classList.toggle('snapped', !!win.snap);
    win.api.onResize && win.api.onResize(g);
  }

  updateMaxIcon(win) {
    const b = win.el.querySelector('[data-act="max"]');
    b.innerHTML = win.max ? lico('restore', 14) : lico('max', 14);
    b.title = win.max ? 'Restaurar' : 'Maximizar';
  }

  focus(win) {
    if (!win) return;
    if (this.active !== win) {
      win.el.style.zIndex = ++this.zTop;
      this.active = win;
      this.emit('app:focus', { app: win.app });
    }
    for (const w of this.windows) w.el.classList.toggle('active', w === win);
    this.renderTaskbar();
  }

  minimize(win) {
    if (win.min) return;
    win.min = true;
    win.el.classList.add('w-minimizing');
    setTimeout(() => { if (win.min) { win.el.hidden = true; win.el.classList.remove('w-minimizing'); } }, 190);
    if (this.active === win) {
      this.active = null;
      const next = this.topWindow();
      if (next) this.focus(next);
    }
    this.renderTaskbar();
    this.emit('win:minimize', { app: win.app });
  }
  restore(win) {
    if (!win.min) return;
    win.min = false;
    win.el.hidden = false;
    win.el.classList.remove('w-minimizing');
    win.el.classList.add('w-opening');
    setTimeout(() => win.el.classList.remove('w-opening'), 200);
    this.focus(win);
    this.emit('win:restore', { app: win.app });
  }
  maximize(win) {
    if (!win.max && !win.snap) win.prev = { x: win.x, y: win.y, w: win.w, h: win.h };
    win.max = true; win.snap = null;
    this.applyGeom(win);
    this.updateMaxIcon(win);
    this.emit('win:maximize', { app: win.app });
  }
  restoreSize(win) {
    if (win.prev) Object.assign(win, win.prev);
    win.max = false; win.snap = null;
    this.clampWin(win);
    this.applyGeom(win);
    this.updateMaxIcon(win);
    this.emit('win:unmaximize', { app: win.app });
  }
  toggleMax(win) { (win.max || win.snap) ? this.restoreSize(win) : this.maximize(win); }
  snapWin(win, side) {
    if (!win.max && !win.snap) win.prev = { x: win.x, y: win.y, w: win.w, h: win.h };
    win.max = false; win.snap = side;
    this.applyGeom(win);
    this.updateMaxIcon(win);
    this.emit('win:snap', { app: win.app, side });
  }
  topWindow() {
    return this.windows.filter(w => !w.min).sort((a, b) => (+b.el.style.zIndex) - (+a.el.style.zIndex))[0] || null;
  }

  async close(win, { force = false } = {}) {
    if (!this.windows.includes(win)) return true;
    if (!force && win.frozen) {
      const r = await this.dialog({ title: win.title, icon: 'warn', message: `${win.title} não está respondendo.\n\nSe você fechar o programa, poderá perder informações.`, buttons: [{ label: 'Aguardar o programa responder', value: 'wait' }, { label: 'Fechar o programa', value: 'close', primary: true }] });
      if (r !== 'close') return false;
      force = true;
      this.emit('frozen:resolved', { app: win.app, how: 'close' });
    }
    if (!force) {
      for (const hook of win.closeHooks) {
        const r = await hook();
        if (r === false) return false;
      }
    }
    win.api.onDestroy && win.api.onDestroy();
    win.el.classList.add('w-closing');
    this.windows = this.windows.filter(w => w !== win);
    setTimeout(() => win.el.remove(), 150);
    if (this.active === win) { this.active = null; const next = this.topWindow(); if (next) this.focus(next); }
    this.renderTaskbar();
    this.emit('app:close', { app: win.app, forced: force });
    return true;
  }

  freeze(win) {
    win.frozen = true;
    win.el.classList.add('frozen');
    win.titleEl.textContent = win.title + ' (Não está respondendo)';
    this.renderTaskbar();
  }

  showDesktop() {
    const visible = this.windows.filter(w => !w.min);
    if (visible.length) { this._peek = visible; visible.forEach(w => this.minimize(w)); }
    else if (this._peek) { this._peek.forEach(w => this.windows.includes(w) && this.restore(w)); this._peek = null; }
    this.emit('desktop:show', {});
  }

  altTab() {
    const list = this.windows.slice().sort((a, b) => (+b.el.style.zIndex) - (+a.el.style.zIndex));
    if (!list.length) return;
    const next = list.length > 1 ? list[1] : list[0];
    const A = this.altTabEl;
    A.innerHTML = list.map(w => `<div class="w-at${w === next ? ' sel' : ''}">${icon(w.iconName, 40)}<span>${esc(w.title)}</span></div>`).join('');
    A.hidden = false;
    clearTimeout(this._atT);
    this._atT = setTimeout(() => { A.hidden = true; }, 900);
    this.restore(next);
    this.focus(next);
    this.emit('shortcut', { combo: 'alt+tab', app: next.app });
  }

  /* ---------------- barra de tarefas ---------------- */
  buildTaskbar() {
    const T = this.taskbar;
    T.innerHTML = `<div class="w-tb-center"><button class="w-tbb w-startbtn" data-tut="start" title="Iniciar">${icon('start', 24)}</button>
      <button class="w-tbb w-searchbtn" data-tut="search" title="Pesquisar">${lico('search', 20)}</button><div class="w-tbapps"></div></div>
      <div class="w-tb-right"><button class="w-tray" data-tut="quick" title="Rede, som e bateria"></button>
      <button class="w-clock" data-tut="clock" title="Data e hora"></button><button class="w-showdesk" title="Mostrar área de trabalho" data-tut="showdesk"></button></div>`;
    T.querySelector('.w-startbtn').onclick = () => this.toggleStart();
    T.querySelector('.w-searchbtn').onclick = () => this.toggleSearch();
    T.querySelector('.w-tray').onclick = () => this.togglePanel(this.quickEl, () => this.renderQuick(), 'quick:open');
    T.querySelector('.w-clock').onclick = () => this.togglePanel(this.calEl, () => this.renderCalendar(), 'calendar:open');
    T.querySelector('.w-showdesk').onclick = () => this.showDesktop();
    T.addEventListener('contextmenu', (e) => {
      e.preventDefault();
      const p = this.toLocal(e.clientX, e.clientY);
      const b = e.target.closest('.w-tbapp');
      if (b) {
        const app = b.dataset.app;
        const pinned = this.settings.pinned.includes(app);
        const wins = this.windows.filter(w => w.app === app);
        this.contextMenu(p.x, p.y - 10, [
          { label: APPS[app].name, iconBig: APPS[app].icon, action: () => this.openApp(app) },
          { label: pinned ? 'Desafixar da barra de tarefas' : 'Fixar na barra de tarefas', icon: 'star', action: () => { this.settings.pinned = pinned ? this.settings.pinned.filter(x => x !== app) : [...this.settings.pinned, app]; this.saveSettings(); this.renderTaskbar(); this.emit(pinned ? 'taskbar:unpin' : 'taskbar:pin', { app }); } },
          wins.length ? { label: wins.length > 1 ? 'Fechar todas as janelas' : 'Fechar janela', icon: 'close', action: () => wins.forEach(w => this.close(w)) } : null,
        ].filter(Boolean), 'up');
      } else {
        this.contextMenu(p.x, p.y - 10, [
          { label: 'Gerenciador de Tarefas', iconBig: 'taskmgr', tut: 'ctx-taskmgr', action: () => this.openApp('taskmgr') },
          { sep: true },
          { label: 'Configurações da barra de tarefas', icon: 'gear', action: () => this.openApp('settings', { page: 'personalization' }) },
        ], 'up');
      }
      this.emit('ctx:open', { target: 'taskbar' });
    });
    this.tickClock();
  }

  renderTaskbar() {
    const box = this.taskbar.querySelector('.w-tbapps');
    if (!box) return;
    const running = [...new Set(this.windows.map(w => w.app))];
    const apps = [...this.settings.pinned.filter(a => this.settings.installed.includes(a) || APPS[a]?.system), ...running.filter(a => !this.settings.pinned.includes(a))];
    box.innerHTML = '';
    for (const a of apps) {
      const app = APPS[a];
      if (!app) continue;
      const wins = this.windows.filter(w => w.app === a);
      const active = this.active && this.active.app === a;
      const b = el('button', 'w-tbb w-tbapp' + (wins.length ? ' running' : '') + (active ? ' active' : ''), icon(app.icon, 26));
      b.dataset.app = a;
      b.dataset.tut = 'tb-' + a;
      b.title = wins.length ? wins.map(w => w.title).join(' · ') : app.name;
      b.onclick = () => {
        if (!wins.length) { this.openApp(a); return; }
        const top = wins.sort((x, y) => (+y.el.style.zIndex) - (+x.el.style.zIndex))[0];
        if (top.min) this.restore(top);
        else if (this.active === top) this.minimize(top);
        else this.focus(top);
      };
      box.appendChild(b);
    }
  }

  renderTray() {
    const t = this.taskbar.querySelector('.w-tray');
    if (!t) return;
    const s = this.settings;
    const net = s.airplane ? lico('plane', 17) : s.wifi.on && s.wifi.connected ? lico('wifi', 18) : lico('wifiOff', 18);
    t.innerHTML = `${net}${s.volume ? lico('volume', 18) : lico('mute', 18)}${lico('battery', 20)}`;
  }

  tickClock() {
    const c = this.taskbar.querySelector('.w-clock');
    if (!c) return;
    const d = new Date();
    c.innerHTML = `<span>${d.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}</span><span>${d.toLocaleDateString('pt-BR')}</span>`;
  }

  /* ---------------- painéis ---------------- */
  closePanels(except) {
    for (const p of [this.startEl, this.searchEl, this.quickEl, this.calEl]) if (p !== except && !p.hidden) { p.hidden = true; p.classList.remove('open'); if (p === this.startEl) this.emit('start:close', {}); }
    this.hideContext();
  }
  togglePanel(p, render, evt) {
    if (!p.hidden) { this.closePanels(); return; }
    this.closePanels(p);
    render();
    p.hidden = false;
    requestAnimationFrame(() => p.classList.add('open'));
    if (evt) this.emit(evt, {});
  }

  toggleStart() {
    this.togglePanel(this.startEl, () => this.renderStart(), 'start:open');
  }

  renderStart(view = 'pinned') {
    const S = this.startEl;
    const apps = this.settings.installed.map(id => APPS[id]).filter(a => a && !a.hidden);
    const recent = this.fs.recent(6);
    if (view === 'all') {
      const sorted = apps.slice().sort((a, b) => a.name.localeCompare(b.name, 'pt-BR'));
      S.innerHTML = `<div class="w-start-top"><div class="w-sbox">${lico('search', 16)}<input data-tut="start-search" placeholder="Pesquise aplicativos, configurações e documentos"></div></div>
        <div class="w-start-sec"><div class="w-sec-h"><b>Todos os aplicativos</b><button class="w-btn sm" data-back>${lico('back', 14)} Voltar</button></div>
        <div class="w-alllist">${sorted.map(a => `<button class="w-allapp" data-app="${a.id}" data-tut="sm-${a.id}">${icon(a.icon, 26)}<span>${esc(a.name)}</span></button>`).join('')}</div></div>${this.startFooter()}`;
      S.querySelector('[data-back]').onclick = () => this.renderStart('pinned');
    } else {
      S.innerHTML = `<div class="w-start-top"><div class="w-sbox">${lico('search', 16)}<input data-tut="start-search" placeholder="Pesquise aplicativos, configurações e documentos"></div></div>
        <div class="w-start-sec"><div class="w-sec-h"><b>Fixado</b><button class="w-btn sm" data-all data-tut="start-all">Todos os aplicativos ${lico('chevR', 14)}</button></div>
        <div class="w-pingrid">${apps.map(a => `<button class="w-pin" data-app="${a.id}" data-tut="sm-${a.id}">${icon(a.icon, 34)}<span>${esc(a.name)}</span></button>`).join('')}</div></div>
        <div class="w-start-sec"><div class="w-sec-h"><b>Recomendado</b></div>
        <div class="w-reclist">${recent.map(n => `<button class="w-rec" data-node="${n.id}">${icon(iconFor(n), 28)}<span><b>${esc(n.name)}</b><small>${new Date(n.modified).toLocaleDateString('pt-BR')}</small></span></button>`).join('') || '<p class="w-muted">Seus arquivos recentes aparecem aqui.</p>'}</div></div>${this.startFooter()}`;
      S.querySelector('[data-all]').onclick = () => { this.renderStart('all'); this.emit('start:all', {}); };
    }
    S.querySelectorAll('[data-app]').forEach(b => { b.onclick = () => { this.closePanels(); this.openApp(b.dataset.app); this.emit('start:launch', { app: b.dataset.app }); }; });
    S.querySelectorAll('[data-node]').forEach(b => { b.onclick = () => { this.closePanels(); const n = this.fs.get(b.dataset.node); if (n) this.openFile(n); }; });
    const input = S.querySelector('input');
    input.addEventListener('input', () => { if (input.value.trim()) { this.closePanels(); this.openSearch(input.value); } });
    S.querySelector('[data-power]').onclick = (e) => {
      const p = this.toLocal(e.clientX, e.clientY);
      this.contextMenu(p.x - 120, p.y - 10, [
        { label: 'Suspender', icon: 'sleep', tut: 'pw-sleep', action: () => this.sleep() },
        { label: 'Desligar', icon: 'power', tut: 'pw-shutdown', action: () => this.shutdown('shutdown') },
        { label: 'Reiniciar', icon: 'restart', tut: 'pw-restart', action: () => this.shutdown('restart') },
      ], 'up');
      this.emit('power:menu', {});
    };
    S.querySelector('[data-user]').onclick = (e) => {
      const p = this.toLocal(e.clientX, e.clientY);
      this.contextMenu(p.x, p.y - 10, [
        { label: 'Alterar configurações da conta', icon: 'user', action: () => this.openApp('settings', { page: 'accounts' }) },
        { label: 'Bloquear', icon: 'lock', action: () => this.lock() },
      ], 'up');
    };
    setTimeout(() => input.focus(), 30);
  }
  startFooter() {
    return `<div class="w-start-foot"><button class="w-userbtn" data-user>${icon('user', 30)}<span>${esc(this.settings.username)}</span></button>
      <button class="w-powerbtn" data-power data-tut="power" title="Ligar/Desligar">${lico('power', 20)}</button></div>`;
  }

  toggleSearch() {
    if (!this.searchEl.hidden) { this.closePanels(); return; }
    this.openSearch('');
  }
  openSearch(q) {
    this.closePanels(this.searchEl);
    const P = this.searchEl;
    P.innerHTML = `<div class="w-sbox big">${lico('search', 18)}<input data-tut="search-input" placeholder="Digite aqui para pesquisar" value="${esc(q)}"></div><div class="w-sresults"></div>`;
    P.hidden = false;
    requestAnimationFrame(() => P.classList.add('open'));
    const input = P.querySelector('input');
    const res = P.querySelector('.w-sresults');
    const SETTINGS_HITS = [
      { label: 'Alterar o papel de parede', kw: 'papel parede fundo tela imagem', page: 'personalization' },
      { label: 'Tema escuro / claro', kw: 'tema escuro claro modo noturno cores', page: 'personalization' },
      { label: 'Configurações de Wi-Fi', kw: 'wifi wi-fi internet rede conexão', page: 'network' },
      { label: 'Bluetooth e dispositivos', kw: 'bluetooth fone mouse dispositivo', page: 'bluetooth' },
      { label: 'Tamanho do texto', kw: 'texto letra tamanho fonte acessibilidade aumentar', page: 'accessibility' },
      { label: 'Desinstalar aplicativos', kw: 'desinstalar remover aplicativos programas', page: 'apps' },
      { label: 'Windows Update', kw: 'atualizar atualização update', page: 'update' },
      { label: 'Sobre este PC', kw: 'sobre pc computador especificações processador memória', page: 'system' },
      { label: 'Data e hora', kw: 'data hora relógio', page: 'time' },
    ];
    const render = () => {
      const v = input.value.trim().toLowerCase();
      const norm = s => s.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '');
      const nv = norm(v);
      const apps = this.settings.installed.map(id => APPS[id]).filter(a => a && !a.hidden && (!v || norm(a.name).includes(nv) || (a.keywords || '').includes(nv)));
      const sets = v ? SETTINGS_HITS.filter(s => norm(s.label + ' ' + s.kw).includes(nv)) : [];
      const files = v ? this.fs.search(v).slice(0, 6) : [];
      let html = '';
      if (apps.length) html += `<div class="w-sgroup"><b>Aplicativos</b>${apps.map((a, i) => `<button class="w-sres${i === 0 ? ' first' : ''}" data-app="${a.id}" data-tut="sr-${a.id}">${icon(a.icon, 26)}<span>${esc(a.name)}<small>Aplicativo</small></span></button>`).join('')}</div>`;
      if (sets.length) html += `<div class="w-sgroup"><b>Configurações</b>${sets.map(s => `<button class="w-sres" data-page="${s.page}">${icon('settings', 26)}<span>${esc(s.label)}<small>Configurações</small></span></button>`).join('')}</div>`;
      if (files.length) html += `<div class="w-sgroup"><b>Documentos</b>${files.map(n => `<button class="w-sres" data-node="${n.id}">${icon(iconFor(n), 26)}<span>${esc(n.name)}<small>${esc(this.fs.pathString(n.parent))}</small></span></button>`).join('')}</div>`;
      res.innerHTML = html || `<p class="w-muted">Nenhum resultado para "${esc(input.value)}".</p>`;
      res.querySelectorAll('[data-app]').forEach(b => { b.onclick = () => { this.closePanels(); this.openApp(b.dataset.app); this.emit('search:launch', { app: b.dataset.app, q: input.value }); }; });
      res.querySelectorAll('[data-page]').forEach(b => { b.onclick = () => { this.closePanels(); this.openApp('settings', { page: b.dataset.page }); }; });
      res.querySelectorAll('[data-node]').forEach(b => { b.onclick = () => { this.closePanels(); const n = this.fs.get(b.dataset.node); if (n) this.openFile(n); }; });
      if (v) this.emit('search:query', { q: input.value });
    };
    input.addEventListener('input', render);
    input.addEventListener('keydown', (e) => { if (e.key === 'Enter') { const f = res.querySelector('.w-sres'); f && f.click(); } if (e.key === 'Escape') this.closePanels(); });
    render();
    setTimeout(() => { input.focus(); input.setSelectionRange(input.value.length, input.value.length); }, 30);
    this.emit('search:open', {});
  }

  renderQuick(view = 'main') {
    const Q = this.quickEl;
    const s = this.settings;
    if (view === 'wifi') {
      const nets = this.networks();
      Q.innerHTML = `<div class="w-sec-h"><button class="w-btn sm" data-back>${lico('back', 14)}</button><b>Wi-Fi</b>
        <label class="w-switch"><input type="checkbox" data-wifi ${s.wifi.on ? 'checked' : ''}><i></i></label></div>
        <div class="w-netlist">${s.wifi.on ? nets.map(n => `<button class="w-net${s.wifi.connected === n.ssid ? ' on' : ''}" data-ssid="${esc(n.ssid)}" data-tut="net-${esc(n.ssid)}">${lico('wifi', 20)}<span><b>${esc(n.ssid)}</b><small>${s.wifi.connected === n.ssid ? 'Conectado' + (n.secure ? ', seguro' : '') : n.secure ? 'Protegida' : 'Aberta (não segura)'}</small></span>${n.secure ? lico('lock', 14) : ''}</button>`).join('') : '<p class="w-muted">O Wi-Fi está desligado.</p>'}</div>`;
      Q.querySelector('[data-back]').onclick = () => this.renderQuick();
      Q.querySelector('[data-wifi]').onchange = (e) => { this.setWifi(e.target.checked); this.renderQuick('wifi'); };
      Q.querySelectorAll('[data-ssid]').forEach(b => { b.onclick = () => this.connectWifi(b.dataset.ssid); });
      return;
    }
    const tile = (key, label, iconName, on, sub = '', tut = '') => `<div class="w-tile${on ? ' on' : ''}"><button class="w-tile-main" data-tile="${key}" data-tut="${tut}">${lico(iconName, 18)}</button>${sub ? `<button class="w-tile-more" data-more="${key}" title="Mais opções">${lico('chevR', 14)}</button>` : ''}<span>${esc(label)}</span></div>`;
    Q.innerHTML = `<div class="w-tiles">
      ${tile('wifi', s.wifi.on && s.wifi.connected ? s.wifi.connected : 'Wi-Fi', 'wifi', s.wifi.on, true, 'tile-wifi')}
      ${tile('bluetooth', 'Bluetooth', 'bluetooth', s.bluetooth)}
      ${tile('airplane', 'Modo avião', 'plane', s.airplane)}
      ${tile('dark', 'Tema escuro', 'moon', s.theme === 'dark', false, 'tile-dark')}
      ${tile('access', 'Acessibilidade', 'access', s.textScale > 100)}
      ${tile('settings', 'Configurações', 'gear', false)}
      </div>
      <div class="w-slider">${lico('sun', 18)}<input type="range" min="10" max="100" value="${s.brightness}" data-tut="brightness" data-range="brightness" aria-label="Brilho"></div>
      <div class="w-slider">${lico(s.volume ? 'volume' : 'mute', 18)}<input type="range" min="0" max="100" value="${s.volume}" data-tut="volume" data-range="volume" aria-label="Volume"><span class="w-val">${s.volume}</span></div>
      <div class="w-quick-foot">${lico('battery', 20)} 86%</div>`;
    Q.querySelectorAll('[data-tile]').forEach(b => {
      b.onclick = () => {
        const k = b.dataset.tile;
        if (k === 'wifi') { this.setWifi(!s.wifi.on); }
        if (k === 'bluetooth') { this.set({ bluetooth: !s.bluetooth }, 'bluetooth:toggle'); }
        if (k === 'airplane') { const on = !s.airplane; this.set({ airplane: on, wifi: { ...s.wifi, on: !on && s.wifi.on, connected: on ? null : s.wifi.connected } }, 'airplane:toggle'); }
        if (k === 'dark') { this.set({ theme: s.theme === 'dark' ? 'light' : 'dark' }, 'settings:theme'); }
        if (k === 'access') { this.closePanels(); this.openApp('settings', { page: 'accessibility' }); return; }
        if (k === 'settings') { this.closePanels(); this.openApp('settings'); return; }
        this.renderQuick();
      };
    });
    Q.querySelectorAll('[data-more]').forEach(b => { b.onclick = () => { this.renderQuick('wifi'); this.emit('quick:wifi', {}); }; });
    Q.querySelectorAll('[data-range]').forEach(r => {
      r.oninput = () => {
        const k = r.dataset.range, v = +r.value;
        this.settings[k] = v;
        this.saveSettings();
        this.applySettings();
        const val = r.parentElement.querySelector('.w-val');
        if (val) val.textContent = v;
        this.emit(k, { value: v });
      };
    });
  }

  networks() {
    return [
      { ssid: 'Casa_Silva', secure: true, password: 'familia2024' },
      { ssid: 'NET_2G_8F21', secure: true, password: null },
      { ssid: 'Vizinho_5G', secure: true, password: null },
      { ssid: 'Cafe_Gratis', secure: false },
    ];
  }
  setWifi(on) {
    const w = { ...this.settings.wifi, on, connected: on ? this.settings.wifi.connected : null };
    this.set({ wifi: w, airplane: on ? false : this.settings.airplane }, 'wifi:toggle');
  }
  async connectWifi(ssid) {
    const net = this.networks().find(n => n.ssid === ssid);
    const s = this.settings;
    if (s.wifi.connected === ssid) {
      this.set({ wifi: { ...s.wifi, connected: null } }, 'wifi:disconnect');
      this.renderQuick('wifi');
      return;
    }
    if (net.secure && !s.wifi.known.includes(ssid)) {
      const r = await this.dialog({ title: `Conectar a ${ssid}`, icon: null, message: 'Digite a chave de segurança da rede (a senha do Wi-Fi):', input: { type: 'password', placeholder: 'Senha do Wi-Fi', tut: 'wifi-pass' }, buttons: [{ label: 'Cancelar', value: false }, { label: 'Avançar', value: true, primary: true, tut: 'wifi-ok' }] });
      if (!r || !r.value) return;
      if (r.text !== net.password) {
        this.emit('wifi:wrong', { ssid });
        await this.dialog({ title: 'Não foi possível conectar', icon: 'error', message: 'A senha está incorreta. Confira letras maiúsculas e minúsculas e tente de novo.' });
        return;
      }
    } else if (!net.secure) {
      const ok = await this.dialog({ title: ssid, icon: 'warn', message: 'Esta é uma rede aberta: outras pessoas podem ver o que você envia por ela. Evite acessar banco ou digitar senhas em redes públicas.', buttons: [{ label: 'Cancelar', value: false }, { label: 'Conectar mesmo assim', value: true, primary: true }] });
      if (!ok) return;
    }
    const known = [...new Set([...s.wifi.known, ssid])];
    this.set({ wifi: { on: true, connected: ssid, known }, airplane: false }, null);
    this.emit('wifi:connect', { ssid, secure: net.secure });
    this.notify('Wi-Fi', `Conectado a ${ssid}`, 'settings');
    if (!this.quickEl.hidden) this.renderQuick('wifi');
  }
  online() { return this.settings.wifi.on && !!this.settings.wifi.connected && !this.settings.airplane; }

  renderCalendar() {
    const C = this.calEl;
    const d = new Date();
    const first = new Date(d.getFullYear(), d.getMonth(), 1);
    const days = new Date(d.getFullYear(), d.getMonth() + 1, 0).getDate();
    const start = first.getDay();
    let cells = '';
    for (let i = 0; i < start; i++) cells += '<span></span>';
    for (let i = 1; i <= days; i++) cells += `<span class="${i === d.getDate() ? 'today' : ''}">${i}</span>`;
    C.innerHTML = `<div class="w-notifs"><div class="w-sec-h"><b>Notificações</b>${this.notifs.length ? '<button class="w-btn sm" data-clear>Limpar tudo</button>' : ''}</div>
      ${this.notifs.length ? this.notifs.slice().reverse().map(n => `<div class="w-notif">${icon(n.icon, 22)}<span><b>${esc(n.title)}</b>${esc(n.text)}</span></div>`).join('') : '<p class="w-muted">Nenhuma notificação nova</p>'}</div>
      <div class="w-calbox"><b class="w-calh">${d.toLocaleDateString('pt-BR', { weekday: 'long', day: 'numeric', month: 'long' })}</b>
      <div class="w-calgrid">${['D', 'S', 'T', 'Q', 'Q', 'S', 'S'].map(x => `<span class="dow">${x}</span>`).join('')}${cells}</div></div>`;
    const c = C.querySelector('[data-clear]');
    if (c) c.onclick = () => { this.notifs = []; this.renderCalendar(); };
  }

  notify(title, text, iconName = 'info') {
    this.notifs.push({ title, text, icon: iconName, t: Date.now() });
    if (!this.settings.notifications) return;
    const t = el('div', 'w-toast', `${icon(iconName, 28)}<span><b>${esc(title)}</b>${esc(text)}</span>`);
    this.toastEl.appendChild(t);
    setTimeout(() => t.classList.add('out'), 4600);
    setTimeout(() => t.remove(), 5000);
  }

  /* ---------------- menu de contexto ---------------- */
  contextMenu(x, y, items, dir = 'down') {
    const C = this.ctxEl;
    C.innerHTML = '';
    const build = (list, host) => {
      for (const it of list) {
        if (it.sep) { host.appendChild(el('div', 'w-ctx-sep')); continue; }
        const b = el('button', 'w-ctx-item' + (it.bold ? ' bold' : ''), `<span class="ic">${it.iconBig ? icon(it.iconBig, 18) : it.icon ? lico(it.icon, 16) : ''}</span><span class="lb">${esc(it.label)}</span>${it.shortcut ? `<span class="sc">${it.shortcut}</span>` : ''}${it.submenu ? `<span class="sc">${lico('chevR', 14)}</span>` : ''}`);
        if (it.tut) b.dataset.tut = it.tut;
        if (it.disabled) b.disabled = true;
        if (it.submenu) {
          const sub = el('div', 'w-ctx w-sub');
          sub.hidden = true;
          build(it.submenu, sub);
          b.appendChild(sub);
          const open = () => { C.querySelectorAll('.w-sub').forEach(s => { if (s !== sub) s.hidden = true; }); sub.hidden = false; const r = this.rectOf(b); const sr = { w: 230 }; sub.style.left = (r.x + r.w + sr.w > this.vw ? -sr.w + 4 : r.w - 4) + 'px'; };
          b.addEventListener('pointerenter', open);
          b.addEventListener('click', (e) => { e.stopPropagation(); open(); });
        } else {
          b.addEventListener('click', (e) => { e.stopPropagation(); this.hideContext(); it.action && it.action(); });
        }
        host.appendChild(b);
      }
    };
    build(items, C);
    C.hidden = false;
    const r = { w: C.offsetWidth || 240, h: C.offsetHeight || 200 };
    let left = Math.min(x, this.vw - r.w - 4);
    let top = dir === 'up' ? y - r.h : Math.min(y, this.vh - r.h - 4);
    if (top < 4) top = 4;
    Object.assign(C.style, { left: Math.max(4, left) + 'px', top: top + 'px' });
  }
  hideContext() { this.ctxEl.hidden = true; }

  /* ---------------- diálogos ---------------- */
  dialog({ title = '', message = '', html = null, icon: ic = 'info', buttons = null, input = null, width = 440 } = {}) {
    return new Promise((resolve) => {
      const btns = buttons || [{ label: 'OK', value: true, primary: true }];
      const back = el('div', 'w-dlg-back');
      const box = el('div', 'w-dlg');
      box.style.width = width + 'px';
      box.innerHTML = `<div class="w-dlg-title">${esc(title)}<button class="w-dlg-x" title="Fechar">${lico('close', 14)}</button></div>
        <div class="w-dlg-body">${ic ? `<span class="w-dlg-ic">${icon(ic, 34)}</span>` : ''}<div class="w-dlg-msg">${html || esc(message).replace(/\n/g, '<br>')}
        ${input ? `<input class="w-input" type="${input.type || 'text'}" placeholder="${esc(input.placeholder || '')}" value="${esc(input.value || '')}" ${input.tut ? `data-tut="${input.tut}"` : ''}>` : ''}</div></div>
        <div class="w-dlg-foot">${btns.map((b, i) => `<button class="w-btn${b.primary ? ' primary' : ''}" data-i="${i}" ${b.tut ? `data-tut="${b.tut}"` : ''}>${esc(b.label)}</button>`).join('')}</div>`;
      back.appendChild(box);
      this.dlgLayer.appendChild(back);
      const inp = box.querySelector('input');
      const finish = (v) => { back.remove(); resolve(input ? { value: v, text: inp ? inp.value : '' } : v); };
      box.querySelectorAll('[data-i]').forEach(b => { b.onclick = () => finish(btns[+b.dataset.i].value); });
      box.querySelector('.w-dlg-x').onclick = () => finish(input ? null : (btns.find(b => b.value === false)?.value ?? null));
      box.addEventListener('keydown', (e) => {
        e.stopPropagation();
        if (e.key === 'Enter') { const p = btns.findIndex(b => b.primary); finish(btns[p >= 0 ? p : 0].value); }
        if (e.key === 'Escape') finish(input ? null : false);
      });
      setTimeout(() => (inp || box.querySelector('.w-btn.primary') || box.querySelector('.w-btn'))?.focus(), 30);
      this.emit('dialog:open', { title });
    });
  }

  // Janela "Salvar como" / "Abrir"
  fileDialog({ mode = 'save', title, defaultName = 'Sem título.txt', folder = SPECIAL.DOCS, exts = ['txt'] } = {}) {
    return new Promise((resolve) => {
      let cur = this.fs.get(folder) ? folder : SPECIAL.DOCS;
      let selectedId = null;
      const back = el('div', 'w-dlg-back');
      const box = el('div', 'w-dlg w-filedlg');
      box.innerHTML = `<div class="w-dlg-title">${esc(title || (mode === 'save' ? 'Salvar como' : 'Abrir'))}<button class="w-dlg-x">${lico('close', 14)}</button></div>
        <div class="w-fd-bar"><button class="w-btn sm" data-up title="Pasta acima">${lico('up', 14)}</button><div class="w-fd-path"></div></div>
        <div class="w-fd-main"><div class="w-fd-nav">${[[SPECIAL.DESKTOP, 'Área de Trabalho', 'folderDesktop'], [SPECIAL.DOCS, 'Documentos', 'folderDocs'], [SPECIAL.DOWNLOADS, 'Downloads', 'folderDown'], [SPECIAL.PICS, 'Imagens', 'folderPics'], [SPECIAL.MUSIC, 'Músicas', 'folderMusic']].map(([id, nm, ic]) => `<button data-go="${id}" data-tut="fd-${id}">${icon(ic, 20)}<span>${nm}</span></button>`).join('')}</div>
        <div class="w-fd-list"></div></div>
        <div class="w-fd-foot">${mode === 'save' ? `<label>Nome do arquivo:<input class="w-input" data-tut="fd-name" value="${esc(defaultName)}"></label>` : '<label>Arquivo:<input class="w-input" data-tut="fd-name" readonly></label>'}
        <span class="w-muted">Tipo: ${exts.map(e => '*.' + e).join(', ')}</span>
        <div class="w-fd-btns"><button class="w-btn primary" data-ok data-tut="fd-ok">${mode === 'save' ? 'Salvar' : 'Abrir'}</button><button class="w-btn" data-cancel>Cancelar</button></div></div>`;
      back.appendChild(box);
      this.dlgLayer.appendChild(back);
      const nameIn = box.querySelector('.w-fd-foot input');
      const listEl = box.querySelector('.w-fd-list');
      const render = () => {
        box.querySelector('.w-fd-path').textContent = this.fs.pathString(cur);
        const kids = this.fs.children(cur).filter(n => n.type === 'folder' || exts.includes(ext(n.name)));
        listEl.innerHTML = kids.map(n => `<button class="w-fd-item${n.id === selectedId ? ' sel' : ''}" data-id="${n.id}">${icon(iconFor(n), 22)}<span>${esc(n.name)}</span></button>`).join('') || '<p class="w-muted">Esta pasta está vazia.</p>';
        box.querySelectorAll('[data-go]').forEach(b => b.classList.toggle('sel', b.dataset.go === cur));
        let last = { id: null, t: 0 };
        listEl.querySelectorAll('[data-id]').forEach(b => {
          b.onclick = () => {
            const n = this.fs.get(b.dataset.id);
            const now = performance.now();
            const dbl = last.id === n.id && now - last.t < 450;
            last = { id: n.id, t: now };
            if (n.type === 'folder') { if (dbl) { cur = n.id; selectedId = null; render(); } else { selectedId = n.id; render(); } return; }
            selectedId = n.id;
            nameIn.value = n.name;
            render();
            if (dbl) ok();
          };
        });
      };
      const finish = (v) => { back.remove(); resolve(v); };
      const ok = async () => {
        let name = nameIn.value.trim();
        if (mode === 'open') {
          const n = selectedId && this.fs.get(selectedId);
          if (!n || n.type === 'folder') return;
          return finish({ folder: cur, name: n.name, node: n });
        }
        if (!name) return;
        if (BAD_CHARS.test(name)) { await this.dialog({ title: 'Salvar como', icon: 'error', message: 'Um nome de arquivo não pode conter estes caracteres: \\ / : * ? " < > |' }); return; }
        if (!exts.includes(ext(name))) name += '.' + exts[0];
        const ex = this.fs.findByName(cur, name);
        if (ex) {
          if (ex.type === 'folder') { cur = ex.id; render(); return; }
          const rep = await this.dialog({ title: 'Confirmar Salvar como', icon: 'warn', message: `${name} já existe.\nDeseja substituí-lo?`, buttons: [{ label: 'Sim', value: true }, { label: 'Não', value: false, primary: true }] });
          if (!rep) return;
          return finish({ folder: cur, name, node: ex });
        }
        finish({ folder: cur, name, node: null });
      };
      box.querySelector('[data-up]').onclick = () => { const n = this.fs.get(cur); if (n && n.parent && n.id !== SPECIAL.ROOT) { cur = n.parent; render(); } };
      box.querySelectorAll('[data-go]').forEach(b => { b.onclick = () => { cur = b.dataset.go; selectedId = null; render(); this.emit('filedlg:folder', { folder: cur }); }; });
      box.querySelector('[data-ok]').onclick = ok;
      box.querySelector('[data-cancel]').onclick = () => finish(null);
      box.querySelector('.w-dlg-x').onclick = () => finish(null);
      box.addEventListener('keydown', (e) => { e.stopPropagation(); if (e.key === 'Enter') ok(); if (e.key === 'Escape') finish(null); });
      render();
      setTimeout(() => { nameIn.focus(); if (mode === 'save') { const e0 = ext(nameIn.value); nameIn.setSelectionRange(0, e0 ? nameIn.value.length - e0.length - 1 : nameIn.value.length); } }, 40);
      this.emit('filedlg:open', { mode });
    });
  }

  /* ---------------- teclado e atalhos ---------------- */
  bindGlobal() {
    this.screen.addEventListener('pointerdown', (e) => {
      if (e.target.closest('.w-ctx')) return;
      if (!this.ctxEl.hidden) this.hideContext();
      const inPanel = e.target.closest('.w-panel, .w-taskbar');
      if (!inPanel) this.closePanels();
    }, true);
    this.screen.addEventListener('contextmenu', (e) => { if (!e.target.closest('input, textarea')) e.preventDefault(); });
    this.screen.addEventListener('keydown', (e) => {
      if (this.state !== 'desktop') return;
      const tag = e.target.tagName;
      const typing = /INPUT|TEXTAREA|SELECT/.test(tag);
      if (e.key === 'Escape') { this.closePanels(); this.hideContext(); }
      if (this.active && !this.active.min && this.active.api.onKey) {
        if (this.active.api.onKey(e, typing) === true) { e.preventDefault(); return; }
      }
      if (typing) return;
      if (this.active && this.active.el.contains(e.target)) return;
      const ids = [...this.selected].filter(k => k !== 'pc' && k !== 'trash');
      const k = e.key.toLowerCase();
      if (e.ctrlKey && k === 'c') { this.setClipboard('copy', ids); e.preventDefault(); this.emit('shortcut', { combo: 'ctrl+c' }); }
      else if (e.ctrlKey && k === 'x') { this.setClipboard('cut', ids); e.preventDefault(); this.emit('shortcut', { combo: 'ctrl+x' }); }
      else if (e.ctrlKey && k === 'v') { this.paste(SPECIAL.DESKTOP); e.preventDefault(); this.emit('shortcut', { combo: 'ctrl+v' }); }
      else if (e.ctrlKey && k === 'a') { this.desktopItems().forEach(i => this.selected.add(i.key)); this.markSelection(); e.preventDefault(); }
      else if (e.key === 'Delete') { this.deleteNodes(ids, e.shiftKey); }
      else if (e.key === 'F2' && ids.length === 1) { e.preventDefault(); this.renameDesktopIcon(ids[0]); }
      else if (e.key === 'Enter' && this.selected.size === 1) { this.openDesktopItem([...this.selected][0]); }
    });
  }

  shortcut(combo) {
    if (this.state === 'lock') { if (combo === 'win+l') return; this.showLogin(); return; }
    if (this.state !== 'desktop') return;
    switch (combo) {
      case 'win': this.toggleStart(); break;
      case 'win+d': this.showDesktop(); break;
      case 'win+e': this.openApp('explorer'); break;
      case 'win+l': this.lock(); break;
      case 'win+i': this.openApp('settings'); break;
      case 'alt+tab': this.altTab(); return;
      case 'alt+f4':
        if (this.active && !this.active.min) this.close(this.active);
        else this.dialog({ title: 'Desligar o Windows', icon: null, message: 'O que você deseja que o computador faça?', buttons: [{ label: 'Desligar', value: 'off', primary: true }, { label: 'Reiniciar', value: 'restart' }, { label: 'Cancelar', value: false }] })
          .then(v => { if (v === 'off') this.shutdown('shutdown'); if (v === 'restart') this.shutdown('restart'); });
        break;
      case 'ctrl+shift+esc': this.openApp('taskmgr'); break;
      case 'printscreen': {
        const name = this.fs.uniqueName(SPECIAL.PICS, 'Captura de tela.png');
        const node = this.fs.create(SPECIAL.PICS, name, 'file', { gen: this.settings.wallpaper.startsWith('node:') ? 'bloom' : this.settings.wallpaper });
        this.notify('Captura de tela', `Salva em Imagens como "${node.name}"`, 'photos');
        break;
      }
      default: break;
    }
    this.emit('shortcut', { combo });
  }

  /* ---------------- destaque para o tutor ---------------- */
  highlight(target) {
    this.clearHighlight();
    if (!target) return;
    const find = () => (typeof target === 'function' ? target() : this.screen.querySelector(target));
    const place = () => {
      const t = find();
      if (!t || t.closest('[hidden]') || !t.offsetParent) { this.hlEl.hidden = true; return; }
      const r = this.rectOf(t);
      Object.assign(this.hlEl.style, { left: r.x - 6 + 'px', top: r.y - 6 + 'px', width: r.w + 12 + 'px', height: r.h + 12 + 'px' });
      this.hlEl.hidden = false;
    };
    place();
    this._hlTimer = setInterval(place, 250);
    this._hlStop = setTimeout(() => this.clearHighlight(), 9000);
  }
  clearHighlight() {
    clearInterval(this._hlTimer);
    clearTimeout(this._hlStop);
    this.hlEl.hidden = true;
  }

  destroy() {
    this.timers.forEach(t => clearInterval(t));
    this.clearHighlight();
    for (const w of this.windows) w.api.onDestroy && w.api.onDestroy();
    this.ro.disconnect();
    this.host.innerHTML = '';
  }
}
