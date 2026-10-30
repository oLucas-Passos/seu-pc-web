// Sistema de arquivos de mentira, salvo só neste navegador.
import { store } from '../store.js';

const KEY = 'win:fs';
export const BAD_CHARS = /[\\/:*?"<>|]/;

export const SPECIAL = {
  ROOT: 'c', HOME: 'home', DESKTOP: 'desktop', DOCS: 'docs', DOWNLOADS: 'downloads', PICS: 'pics', MUSIC: 'music', VIDEOS: 'videos', TRASH: 'trash',
};

const TYPE_NAMES = {
  txt: 'Documento de texto', jpg: 'Imagem JPEG', png: 'Imagem PNG', pdf: 'Documento PDF', mp3: 'Arquivo de música', mp4: 'Arquivo de vídeo', lnk: 'Atalho',
};

export function typeName(node) {
  if (node.type === 'folder') return 'Pasta de arquivos';
  if (node.type === 'shortcut') return 'Atalho';
  return TYPE_NAMES[ext(node.name)] || 'Arquivo';
}

export function ext(name) {
  const i = name.lastIndexOf('.');
  return i > 0 ? name.slice(i + 1).toLowerCase() : '';
}

export function iconFor(node) {
  if (node.type === 'folder') {
    return { [SPECIAL.DOCS]: 'folderDocs', [SPECIAL.DOWNLOADS]: 'folderDown', [SPECIAL.PICS]: 'folderPics', [SPECIAL.MUSIC]: 'folderMusic', [SPECIAL.VIDEOS]: 'folderVideo', [SPECIAL.DESKTOP]: 'folderDesktop' }[node.id] || 'folder';
  }
  if (node.type === 'shortcut') return node.app;
  return { txt: 'txt', jpg: 'image', png: 'image', pdf: 'pdf', mp3: 'music', mp4: 'video' }[ext(node.name)] || 'file';
}

function seed() {
  const now = Date.now();
  const n = {};
  let t = now - 1000 * 60 * 60 * 24 * 30;
  const mk = (id, name, type, parent, extra = {}) => { n[id] = { id, name, type, parent, created: (t += 3600000), modified: t, ...extra }; };
  mk('c', 'Disco Local (C:)', 'folder', null, { system: true });
  mk('users', 'Usuários', 'folder', 'c', { system: true });
  mk('windows', 'Windows', 'folder', 'c', { system: true, locked: true });
  mk('progs', 'Arquivos de Programas', 'folder', 'c', { system: true, locked: true });
  mk('home', 'Você', 'folder', 'users', { system: true });
  mk('desktop', 'Área de Trabalho', 'folder', 'home', { system: true });
  mk('docs', 'Documentos', 'folder', 'home', { system: true });
  mk('downloads', 'Downloads', 'folder', 'home', { system: true });
  mk('pics', 'Imagens', 'folder', 'home', { system: true });
  mk('music', 'Músicas', 'folder', 'home', { system: true });
  mk('videos', 'Vídeos', 'folder', 'home', { system: true });
  mk('f1', 'Bem-vindo.txt', 'file', 'desktop', { content: 'Olá! Este é um Windows de mentira para você treinar.\n\nAqui você pode abrir programas, criar pastas, apagar arquivos e mudar configurações sem medo: nada do que você fizer afeta o seu computador de verdade.\n\nDica: use o botão "Restaurar simulador" para voltar tudo ao normal quando quiser.' });
  mk('s1', 'Navegador', 'shortcut', 'desktop', { app: 'browser' });
  mk('f2', 'Lista de compras.txt', 'file', 'docs', { content: 'Lista de compras\n\n- Arroz\n- Feijão\n- Café\n- Leite\n- Pão\n- Frutas da estação' });
  mk('f3', 'Receita de pão de queijo.txt', 'file', 'docs', { content: 'Pão de queijo da vovó\n\n500 g de polvilho azedo\n1 xícara de leite\n1/2 xícara de óleo\n2 ovos\n200 g de queijo meia cura ralado\n1 colher (chá) de sal\n\nMisture tudo, faça bolinhas e asse a 180 °C por 25 minutos.' });
  mk('d1', 'Trabalho', 'folder', 'docs');
  mk('f4', 'Relatório de vendas.txt', 'file', 'd1', { content: 'Relatório de vendas - março\n\nTotal: R$ 12.430,00\nMelhor produto: café especial\nObservação: aumentar o estoque para abril.' });
  mk('f5', 'Praia.jpg', 'file', 'pics', { gen: 'praia' });
  mk('f6', 'Montanhas.jpg', 'file', 'pics', { gen: 'montanha' });
  mk('f7', 'Pôr do sol.jpg', 'file', 'pics', { gen: 'sol' });
  mk('f8', 'Jardim.jpg', 'file', 'pics', { gen: 'flores' });
  mk('f9', 'Música relaxante.mp3', 'file', 'music', { duration: 184 });
  mk('f10', 'Aniversário da Ana.mp4', 'file', 'videos', { duration: 95 });
  mk('f11', 'Manual da impressora.pdf', 'file', 'downloads', { content: 'Manual da impressora\n\n1. Ligue a impressora na tomada.\n2. Coloque papel na bandeja.\n3. No computador, abra o documento e aperte Ctrl+P.\n4. Escolha a impressora e clique em Imprimir.' });
  mk('w1', 'explorer.exe', 'file', 'windows', { system: true });
  mk('w2', 'notepad.exe', 'file', 'windows', { system: true });
  mk('trash', 'Lixeira', 'folder', null, { system: true });
  return { nodes: n, seq: 100 };
}

export class FS {
  constructor() {
    const saved = store.get(KEY, null);
    this.data = saved && saved.nodes ? saved : seed();
    this.listeners = new Set();
  }
  save() {
    const ok = store.set(KEY, this.data);
    this.lastSaveOk = ok;
    this.listeners.forEach(fn => fn());
    return ok;
  }
  onChange(fn) { this.listeners.add(fn); return () => this.listeners.delete(fn); }
  reset() { this.data = seed(); this.save(); }

  get(id) { return this.data.nodes[id] || null; }
  children(id) {
    return Object.values(this.data.nodes).filter(n => n.parent === id)
      .sort((a, b) => (a.type === 'folder' ? 0 : 1) - (b.type === 'folder' ? 0 : 1) || a.name.localeCompare(b.name, 'pt-BR', { numeric: true }));
  }
  pathNodes(id) {
    const out = [];
    let n = this.get(id);
    while (n) { out.unshift(n); n = n.parent ? this.get(n.parent) : null; }
    return out;
  }
  pathString(id) {
    const p = this.pathNodes(id);
    if (id === SPECIAL.TRASH) return 'Lixeira';
    return p.map(n => (n.id === 'c' ? 'C:' : n.name)).join('\\');
  }
  isInside(id, ancestor) {
    let n = this.get(id);
    while (n) { if (n.id === ancestor) return true; n = n.parent ? this.get(n.parent) : null; }
    return false;
  }
  findByName(parent, name) {
    return this.children(parent).find(n => n.name.toLowerCase() === name.toLowerCase()) || null;
  }
  search(q) {
    const ql = q.toLowerCase();
    return Object.values(this.data.nodes).filter(n => !n.system && n.parent && n.parent !== SPECIAL.TRASH && this.isInside(n.id, SPECIAL.HOME) && n.name.toLowerCase().includes(ql));
  }
  recent(limit = 6) {
    return Object.values(this.data.nodes).filter(n => n.type === 'file' && !n.system && n.parent !== SPECIAL.TRASH && this.isInside(n.id, SPECIAL.HOME))
      .sort((a, b) => b.modified - a.modified).slice(0, limit);
  }
  uniqueName(parent, name) {
    if (!this.findByName(parent, name)) return name;
    const e = ext(name);
    const base = e ? name.slice(0, -(e.length + 1)) : name;
    for (let i = 2; i < 999; i++) {
      const cand = `${base} (${i})${e ? '.' + e : ''}`;
      if (!this.findByName(parent, cand)) return cand;
    }
    return name + Date.now();
  }
  validName(name) {
    if (!name || !name.trim()) return 'O nome não pode ficar vazio.';
    if (BAD_CHARS.test(name)) return 'Um nome de arquivo não pode conter estes caracteres: \\ / : * ? " < > |';
    return null;
  }
  newId() { return 'n' + (++this.data.seq); }

  create(parent, name, type = 'file', extra = {}) {
    const id = this.newId();
    const now = Date.now();
    const node = { id, name: this.uniqueName(parent, name), type, parent, created: now, modified: now, ...extra };
    if (type === 'file' && node.content == null && !node.gen && !node.dataUrl) node.content = '';
    this.data.nodes[id] = node;
    this.save();
    return node;
  }
  write(id, patch) {
    const n = this.get(id);
    if (!n) return null;
    Object.assign(n, patch, { modified: Date.now() });
    return this.save() ? n : null;
  }
  rename(id, name) {
    const n = this.get(id);
    const err = this.validName(name);
    if (err) return { error: err };
    if (n.system) return { error: 'Esta pasta do sistema não pode ser renomeada.' };
    const other = this.findByName(n.parent, name);
    if (other && other.id !== id) return { error: `Já existe um item chamado "${name}" nesta pasta.` };
    const old = n.name;
    n.name = name.trim();
    n.modified = Date.now();
    this.save();
    return { node: n, old };
  }
  move(id, parent) {
    const n = this.get(id);
    if (!n || n.system) return { error: 'Itens do sistema não podem ser movidos.' };
    if (id === parent || this.isInside(parent, id)) return { error: 'Não dá para mover uma pasta para dentro dela mesma.' };
    if (n.parent === parent) return { node: n, same: true };
    n.name = this.uniqueName(parent, n.name);
    n.parent = parent;
    n.modified = Date.now();
    this.save();
    return { node: n };
  }
  copy(id, parent, silent = false) {
    const n = this.get(id);
    if (!n) return null;
    let name = n.name;
    if (n.parent === parent) {
      const e = ext(name);
      const base = e && n.type !== 'folder' ? name.slice(0, -(e.length + 1)) : name;
      name = `${base} - Cópia${e && n.type !== 'folder' ? '.' + e : ''}`;
    }
    const { id: _i, parent: _p, name: _n, ...rest } = n;
    const copy = this.create(parent, name, n.type, { ...rest, system: false, locked: false });
    if (n.type === 'folder') for (const c of this.children(id)) this.copy(c.id, copy.id, true);
    if (!silent) this.save();
    return copy;
  }
  remove(id) {
    const n = this.get(id);
    if (!n || n.system) return { error: 'Itens do sistema não podem ser excluídos.' };
    n.origParent = n.parent;
    n.parent = SPECIAL.TRASH;
    n.deletedAt = Date.now();
    this.save();
    return { node: n };
  }
  restore(id) {
    const n = this.get(id);
    if (!n || n.parent !== SPECIAL.TRASH) return null;
    const dest = this.get(n.origParent) && n.origParent !== SPECIAL.TRASH ? n.origParent : SPECIAL.DESKTOP;
    n.name = this.uniqueName(dest, n.name);
    n.parent = dest;
    delete n.origParent; delete n.deletedAt;
    this.save();
    return n;
  }
  purge(id) {
    for (const c of this.children(id)) this.purge(c.id);
    delete this.data.nodes[id];
    this.save();
  }
  emptyTrash() {
    for (const c of this.children(SPECIAL.TRASH)) this.purge(c.id);
  }
  sizeOf(n) {
    if (n.type === 'folder') return this.children(n.id).reduce((t, c) => t + this.sizeOf(c), 0);
    if (n.dataUrl) return Math.round(n.dataUrl.length * 0.75);
    if (n.gen) return 2400000;
    if (n.duration) return n.duration * (ext(n.name) === 'mp4' ? 600000 : 32000);
    return new Blob([n.content || '']).size;
  }
}

export function fmtSize(b) {
  if (b < 1024) return `${b} bytes`;
  if (b < 1024 * 1024) return `${Math.ceil(b / 1024)} KB`;
  if (b < 1024 ** 3) return `${(b / 1024 / 1024).toFixed(1).replace('.', ',')} MB`;
  return `${(b / 1024 ** 3).toFixed(1).replace('.', ',')} GB`;
}

export function fmtDate(t) {
  const d = new Date(t);
  return d.toLocaleDateString('pt-BR') + ' ' + d.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
}
