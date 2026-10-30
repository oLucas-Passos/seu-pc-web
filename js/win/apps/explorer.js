// Explorador de Arquivos (também mostra a Lixeira e "Este Computador").
import { icon, lico } from '../icons.js';
import { SPECIAL, iconFor, typeName, ext, fmtSize, fmtDate } from '../fs.js';
import { esc } from './common.js';

const NAV = [
  ['home', 'Início', 'folder'],
  [SPECIAL.DESKTOP, 'Área de Trabalho', 'folderDesktop'],
  [SPECIAL.DOCS, 'Documentos', 'folderDocs'],
  [SPECIAL.DOWNLOADS, 'Downloads', 'folderDown'],
  [SPECIAL.PICS, 'Imagens', 'folderPics'],
  [SPECIAL.MUSIC, 'Músicas', 'folderMusic'],
  [SPECIAL.VIDEOS, 'Vídeos', 'folderVideo'],
  null,
  ['thispc', 'Este Computador', 'pc'],
  [SPECIAL.TRASH, 'Lixeira', 'trash'],
];
const NAV_TUT = { home: 'nav-home', desktop: 'nav-desktop', docs: 'nav-docs', downloads: 'nav-downloads', pics: 'nav-pics', music: 'nav-music', videos: 'nav-videos', thispc: 'nav-pc', trash: 'nav-trash' };

export default {
  id: 'explorer', name: 'Explorador de Arquivos', icon: 'explorer', width: 900, height: 560, keywords: 'pastas arquivos explorador documentos',
  open(ctx) {
    const { os, body, args } = ctx;
    const fs = os.fs;
    let loc = args.folder || 'home';
    let hist = [loc], hi = 0;
    let view = 'grid', sortBy = 'name', query = '';
    let sel = new Set(), anchor = null;
    body.classList.add('ex');
    body.innerHTML = `
      <div class="ex-top">
        <button class="w-ib" data-a="back" title="Voltar">${lico('back')}</button>
        <button class="w-ib" data-a="fwd" title="Avançar">${lico('fwd')}</button>
        <button class="w-ib" data-a="up" title="Pasta acima" data-tut="ex-up">${lico('up')}</button>
        <button class="w-ib" data-a="refresh" title="Atualizar">${lico('refresh')}</button>
        <div class="ex-addr" data-tut="ex-address"></div>
        <div class="w-sbox ex-search">${lico('search', 15)}<input placeholder="Pesquisar" data-tut="ex-search"></div>
      </div>
      <div class="ex-cmd"></div>
      <div class="ex-main"><nav class="ex-nav"></nav><div class="ex-content" tabindex="0"></div></div>
      <div class="ex-status"></div>`;
    const $ = s => body.querySelector(s);
    const content = $('.ex-content');
    const navEl = $('.ex-nav');

    const isFolder = id => !!fs.get(id) && fs.get(id).type === 'folder';
    const title = () => loc === 'home' ? 'Início' : loc === 'thispc' ? 'Este Computador' : loc === SPECIAL.TRASH ? 'Lixeira' : fs.get(loc)?.name || 'Explorador';

    function go(to, push = true) {
      if (to !== 'home' && to !== 'thispc' && !fs.get(to)) to = 'home';
      loc = to;
      sel.clear();
      query = '';
      $('.ex-search input').value = '';
      if (push) { hist = hist.slice(0, hi + 1); hist.push(to); hi = hist.length - 1; }
      render();
      os.emit('explorer:navigate', { folder: to, name: title() });
    }

    function items() {
      if (loc === 'home' || loc === 'thispc') return [];
      let list = fs.children(loc);
      if (query) list = fs.search(query).filter(n => fs.isInside(n.id, loc));
      const cmp = {
        name: (a, b) => a.name.localeCompare(b.name, 'pt-BR', { numeric: true }),
        date: (a, b) => b.modified - a.modified,
        type: (a, b) => typeName(a).localeCompare(typeName(b)),
        size: (a, b) => fs.sizeOf(b) - fs.sizeOf(a),
      }[sortBy];
      return list.sort((a, b) => (a.type === 'folder' ? 0 : 1) - (b.type === 'folder' ? 0 : 1) || cmp(a, b));
    }

    function renderNav() {
      navEl.innerHTML = NAV.map(n => n ? `<button class="ex-navi${loc === n[0] ? ' on' : ''}" data-go="${n[0]}" data-tut="${NAV_TUT[n[0]]}">${icon(n[0] === SPECIAL.TRASH && fs.children(SPECIAL.TRASH).length ? 'trashFull' : n[2], 20)}<span>${n[1]}</span></button>` : '<hr>').join('');
      navEl.querySelectorAll('[data-go]').forEach(b => {
        b.onclick = () => go(b.dataset.go);
        if (b.dataset.go !== 'home' && b.dataset.go !== 'thispc') {
          b.addEventListener('dragover', e => { e.preventDefault(); b.classList.add('drop'); });
          b.addEventListener('dragleave', () => b.classList.remove('drop'));
          b.addEventListener('drop', e => { e.preventDefault(); b.classList.remove('drop'); dropInto(e, b.dataset.go); });
        }
      });
    }

    function renderAddr() {
      const A = $('.ex-addr');
      let crumbs;
      if (loc === 'home' || loc === 'thispc' || loc === SPECIAL.TRASH) crumbs = [[loc, title()]];
      else {
        const path = fs.pathNodes(loc);
        crumbs = [['thispc', 'Este Computador'], ...path.map(n => [n.id, n.id === 'c' ? 'Disco Local (C:)' : n.name])];
        if (fs.isInside(loc, SPECIAL.HOME)) crumbs = path.filter(n => fs.isInside(n.id, SPECIAL.HOME) && n.id !== SPECIAL.HOME).map(n => [n.id, n.name]);
      }
      A.innerHTML = `<span class="ex-crumb-ic">${icon(loc === 'thispc' ? 'pc' : loc === SPECIAL.TRASH ? 'trash' : 'folder', 18)}</span>` + crumbs.map(([id, nm], i) => `<button class="ex-crumb" data-go="${id}">${esc(nm)}</button>${i < crumbs.length - 1 ? lico('chevR', 12) : ''}`).join('');
      A.querySelectorAll('[data-go]').forEach(b => { b.onclick = (e) => { e.stopPropagation(); go(b.dataset.go); }; });
    }

    function renderCmd() {
      const C = $('.ex-cmd');
      const trash = loc === SPECIAL.TRASH;
      const virtual = loc === 'home' || loc === 'thispc';
      const has = sel.size > 0;
      const locked = !virtual && !trash && fs.get(loc)?.locked;
      C.innerHTML = trash ? `
        <button class="w-cb" data-c="empty" data-tut="cmd-empty">${lico('trash')}<span>Esvaziar Lixeira</span></button>
        <button class="w-cb" data-c="restoreAll" data-tut="cmd-restore-all">${lico('undo')}<span>Restaurar todos os itens</span></button>
        <button class="w-cb" data-c="restore" data-tut="cmd-restore" ${has ? '' : 'disabled'}>${lico('undo')}<span>Restaurar os itens selecionados</span></button>
        <span class="w-cbsep"></span><button class="w-cb" data-c="view">${lico(view === 'grid' ? 'list' : 'view')}<span>Exibir</span></button>` : `
        <button class="w-cb primary" data-c="new" data-tut="cmd-new" ${virtual || locked ? 'disabled' : ''}>${lico('plus')}<span>Novo</span>${lico('chevD', 12)}</button>
        <span class="w-cbsep"></span>
        <button class="w-cb ic" data-c="cut" data-tut="cmd-cut" title="Recortar (Ctrl+X)" ${has ? '' : 'disabled'}>${lico('cut')}</button>
        <button class="w-cb ic" data-c="copy" data-tut="cmd-copy" title="Copiar (Ctrl+C)" ${has ? '' : 'disabled'}>${lico('copy')}</button>
        <button class="w-cb ic" data-c="paste" data-tut="cmd-paste" title="Colar (Ctrl+V)" ${os.clipboard && !virtual && !locked ? '' : 'disabled'}>${lico('paste')}</button>
        <button class="w-cb ic" data-c="rename" data-tut="cmd-rename" title="Renomear (F2)" ${sel.size === 1 ? '' : 'disabled'}>${lico('rename')}</button>
        <button class="w-cb ic" data-c="delete" data-tut="cmd-delete" title="Excluir (Delete)" ${has ? '' : 'disabled'}>${lico('trash')}</button>
        <span class="w-cbsep"></span>
        <button class="w-cb" data-c="sort">${lico('sort')}<span>Classificar</span>${lico('chevD', 12)}</button>
        <button class="w-cb" data-c="view" data-tut="cmd-view">${lico(view === 'grid' ? 'list' : 'view')}<span>Exibir</span>${lico('chevD', 12)}</button>`;
      C.querySelectorAll('[data-c]').forEach(b => { b.onclick = (e) => command(b.dataset.c, e); });
    }

    function command(c, e) {
      const ids = [...sel];
      const at = e ? os.toLocal(e.clientX, e.clientY) : { x: 300, y: 200 };
      switch (c) {
        case 'new': os.contextMenu(at.x, at.y + 14, [
          { label: 'Pasta', iconBig: 'folder', tut: 'new-folder', action: () => newItem('folder') },
          { label: 'Documento de texto', iconBig: 'txt', tut: 'new-txt', action: () => newItem('txt') },
        ]); break;
        case 'cut': os.setClipboard('cut', ids); renderCmd(); break;
        case 'copy': os.setClipboard('copy', ids); renderCmd(); break;
        case 'paste': os.paste(loc); break;
        case 'rename': if (ids.length === 1) startRename(ids[0]); break;
        case 'delete': loc === SPECIAL.TRASH ? os.deleteNodes(ids, true) : os.deleteNodes(ids); sel.clear(); break;
        case 'empty': os.emptyTrash(); break;
        case 'restoreAll': for (const n of fs.children(SPECIAL.TRASH)) { const r = fs.restore(n.id); if (r) os.emit('fs:restore', { node: r }); } break;
        case 'restore': for (const id of ids) { const r = fs.restore(id); if (r) os.emit('fs:restore', { node: r }); } sel.clear(); break;
        case 'sort': os.contextMenu(at.x, at.y + 14, [
          { label: 'Nome', icon: sortBy === 'name' ? 'check' : null, action: () => { sortBy = 'name'; render(); } },
          { label: 'Data de modificação', icon: sortBy === 'date' ? 'check' : null, action: () => { sortBy = 'date'; render(); } },
          { label: 'Tipo', icon: sortBy === 'type' ? 'check' : null, action: () => { sortBy = 'type'; render(); } },
          { label: 'Tamanho', icon: sortBy === 'size' ? 'check' : null, action: () => { sortBy = 'size'; render(); } },
        ]); break;
        case 'view': os.contextMenu(at.x, at.y + 14, [
          { label: 'Ícones grandes', icon: view === 'grid' ? 'check' : null, tut: 'view-grid', action: () => { view = 'grid'; render(); os.emit('explorer:view', { view }); } },
          { label: 'Detalhes', icon: view === 'details' ? 'check' : null, tut: 'view-details', action: () => { view = 'details'; render(); os.emit('explorer:view', { view }); } },
        ]); break;
        default: break;
      }
    }

    function newItem(kind) {
      const node = os.newItem(loc, kind);
      sel = new Set([node.id]);
      render();
      startRename(node.id);
    }

    function startRename(id) {
      const it = content.querySelector(`[data-id="${id}"] .ex-name`);
      const n = fs.get(id);
      if (!it || !n) return;
      const input = document.createElement('input');
      input.className = 'ex-rename';
      input.value = n.name;
      it.replaceWith(input);
      input.focus();
      const e0 = ext(n.name);
      input.setSelectionRange(0, n.type === 'file' && e0 ? n.name.length - e0.length - 1 : n.name.length);
      let done = false;
      const commit = async (ok) => {
        if (done) return;
        done = true;
        const v = input.value.trim();
        if (ok && v && v !== n.name) await os.renameNode(id, v);
        render();
        content.focus();
      };
      input.addEventListener('keydown', (e) => { e.stopPropagation(); if (e.key === 'Enter') commit(true); if (e.key === 'Escape') commit(false); });
      input.addEventListener('blur', () => commit(true));
      input.addEventListener('pointerdown', e => e.stopPropagation());
    }

    function open(id) {
      const n = fs.get(id);
      if (!n) return;
      if (loc === SPECIAL.TRASH) { os.dialog({ title: n.name, icon: 'info', message: 'Para abrir este item, restaure-o primeiro (botão direito > Restaurar).' }); return; }
      if (n.type === 'folder') go(n.id); else os.openFile(n);
    }

    function dropInto(e, target) {
      let data;
      try { data = JSON.parse(e.dataTransfer.getData('text/plain')); } catch { return; }
      const ids = data.src === 'desktop' ? data.keys.filter(k => k !== 'pc' && k !== 'trash') : data.ids;
      if (!ids || !ids.length) return;
      if (target === SPECIAL.TRASH) os.deleteNodes(ids);
      else os.moveNodes(ids, target);
    }

    function itemMenu(id) {
      const n = fs.get(id);
      const ids = [...sel];
      if (loc === SPECIAL.TRASH) return [
        { label: 'Restaurar', icon: 'undo', tut: 'ctx-restore', action: () => command('restore') },
        { sep: true },
        { label: 'Excluir permanentemente', icon: 'trash', action: () => os.deleteNodes(ids, true) },
        { label: 'Propriedades', action: () => os.properties(id) },
      ];
      return [
        { label: 'Abrir', bold: true, action: () => open(id) },
        n.type === 'file' && ['jpg', 'png'].includes(ext(n.name)) ? { label: 'Definir como plano de fundo', icon: 'display', action: () => { os.set({ wallpaper: 'node:' + id }, 'settings:wallpaper'); } } : null,
        { sep: true },
        { label: 'Recortar', icon: 'cut', shortcut: 'Ctrl+X', action: () => command('cut') },
        { label: 'Copiar', icon: 'copy', shortcut: 'Ctrl+C', tut: 'ctx-copy', action: () => command('copy') },
        { label: 'Renomear', icon: 'rename', shortcut: 'F2', tut: 'ctx-rename', action: () => startRename(id) },
        { label: 'Excluir', icon: 'trash', shortcut: 'Delete', tut: 'ctx-delete', action: () => command('delete') },
        { sep: true },
        { label: 'Propriedades', action: () => os.properties(id) },
      ].filter(Boolean);
    }

    function bgMenu() {
      const virtual = loc === 'home' || loc === 'thispc' || loc === SPECIAL.TRASH;
      return [
        { label: 'Exibir', icon: 'view', submenu: [
          { label: 'Ícones grandes', action: () => { view = 'grid'; render(); } },
          { label: 'Detalhes', action: () => { view = 'details'; render(); } },
        ] },
        { label: 'Atualizar', icon: 'refresh', action: render },
        { sep: true },
        { label: 'Colar', icon: 'paste', shortcut: 'Ctrl+V', tut: 'ctx-paste', disabled: !os.clipboard || virtual, action: () => os.paste(loc) },
        { label: 'Novo', icon: 'plus', disabled: virtual, tut: 'ctx-new', submenu: [
          { label: 'Pasta', iconBig: 'folder', tut: 'ctx-new-folder', action: () => newItem('folder') },
          { label: 'Documento de texto', iconBig: 'txt', tut: 'ctx-new-txt', action: () => newItem('txt') },
        ] },
      ];
    }

    function renderContent() {
      const C = content;
      C.className = 'ex-content ' + view;
      if (loc === 'thispc') {
        const folders = NAV.slice(1, 7);
        C.innerHTML = `<h4>Pastas</h4><div class="ex-grid">${folders.map(([id, nm, ic]) => `<div class="ex-item" data-open="${id}">${icon(ic, 48)}<span class="ex-name">${nm}</span></div>`).join('')}</div>
          <h4>Dispositivos e unidades</h4><div class="ex-drive" data-open="c" data-tut="drive-c">${icon('pc', 48)}<div><b>Disco Local (C:)</b><div class="ex-bar"><i style="width:63%"></i></div><small>176 GB livres de 476 GB</small></div></div>`;
      } else if (loc === 'home') {
        const recent = fs.recent(8);
        C.innerHTML = `<h4>Acesso rápido</h4><div class="ex-grid">${NAV.slice(1, 7).map(([id, nm, ic]) => `<div class="ex-item" data-open="${id}" data-tut="qa-${id}">${icon(ic, 48)}<span class="ex-name">${nm}</span></div>`).join('')}</div>
          <h4>Recentes</h4><div class="ex-rows">${recent.map(n => `<div class="ex-row" data-file="${n.id}">${icon(iconFor(n), 22)}<span>${esc(n.name)}</span><span>${fmtDate(n.modified)}</span><span>${esc(fs.pathString(n.parent).replace('C:\\Usuários\\Você\\', ''))}</span></div>`).join('') || '<p class="w-muted">Nada por aqui ainda.</p>'}</div>`;
      } else {
        const list = items();
        const warn = fs.get(loc)?.locked ? '<div class="ex-warn">Cuidado: esta pasta guarda arquivos do sistema. Mexer aqui pode estragar o Windows. (No simulador eles são protegidos.)</div>' : '';
        if (!list.length) {
          C.innerHTML = warn + `<p class="ex-empty">${query ? 'Nenhum item corresponde à pesquisa.' : loc === SPECIAL.TRASH ? 'A Lixeira está vazia.' : 'Esta pasta está vazia.'}</p>`;
        } else if (view === 'grid') {
          C.innerHTML = warn + `<div class="ex-grid">${list.map(n => `<div class="ex-item${sel.has(n.id) ? ' sel' : ''}" data-id="${n.id}" draggable="true" data-name="${esc(n.name)}">${icon(iconFor(n), 48)}<span class="ex-name">${esc(n.name)}</span></div>`).join('')}</div>`;
        } else {
          C.innerHTML = warn + `<div class="ex-table"><div class="ex-th"><span>Nome</span><span>${loc === SPECIAL.TRASH ? 'Local original' : 'Data de modificação'}</span><span>Tipo</span><span>Tamanho</span></div>${list.map(n => `<div class="ex-tr${sel.has(n.id) ? ' sel' : ''}" data-id="${n.id}" draggable="true" data-name="${esc(n.name)}"><span>${icon(iconFor(n), 20)}<span class="ex-name">${esc(n.name)}</span></span><span>${loc === SPECIAL.TRASH ? esc(fs.pathString(n.origParent)) : fmtDate(n.modified)}</span><span>${esc(typeName(n))}</span><span>${n.type === 'folder' ? '' : fmtSize(fs.sizeOf(n))}</span></div>`).join('')}</div>`;
        }
      }
      let last = { id: null, t: 0 };
      C.querySelectorAll('[data-open]').forEach(d => {
        d.onclick = () => {
          const now = performance.now();
          if (last.id === d.dataset.open && now - last.t < 450) go(d.dataset.open);
          last = { id: d.dataset.open, t: now };
          C.querySelectorAll('.sel').forEach(x => x.classList.remove('sel'));
          d.classList.add('sel');
        };
      });
      C.querySelectorAll('[data-file]').forEach(d => { d.ondblclick = () => { const n = fs.get(d.dataset.file); n && os.openFile(n); }; });
      C.querySelectorAll('[data-id]').forEach(d => {
        const id = d.dataset.id;
        d.addEventListener('pointerdown', (e) => {
          if (e.button === 2) { if (!sel.has(id)) { sel = new Set([id]); markSel(); } return; }
          if (e.ctrlKey) { sel.has(id) ? sel.delete(id) : sel.add(id); anchor = id; }
          else if (e.shiftKey && anchor) {
            const ids = items().map(n => n.id);
            const [a, b] = [ids.indexOf(anchor), ids.indexOf(id)].sort((x, y) => x - y);
            sel = new Set(ids.slice(a, b + 1));
          } else if (!sel.has(id)) { sel = new Set([id]); anchor = id; }
          markSel();
          const now = performance.now();
          if (last.id === id && now - last.t < 450 && !e.ctrlKey && !e.shiftKey) { last = { id: null, t: 0 }; open(id); return; }
          last = { id, t: now };
          os.emit('explorer:select', { id, name: fs.get(id)?.name });
        });
        d.addEventListener('contextmenu', (e) => { e.preventDefault(); e.stopPropagation(); const p = os.toLocal(e.clientX, e.clientY); os.contextMenu(p.x, p.y, itemMenu(id)); os.emit('ctx:open', { target: 'explorer-item', id }); });
        d.addEventListener('dragstart', (e) => {
          if (!sel.has(id)) { sel = new Set([id]); markSel(); }
          e.dataTransfer.setData('text/plain', JSON.stringify({ src: 'explorer', ids: [...sel] }));
        });
        if (fs.get(id)?.type === 'folder') {
          d.addEventListener('dragover', (e) => { e.preventDefault(); d.classList.add('drop'); });
          d.addEventListener('dragleave', () => d.classList.remove('drop'));
          d.addEventListener('drop', (e) => { e.preventDefault(); e.stopPropagation(); d.classList.remove('drop'); dropInto(e, id); });
        }
      });
    }

    function markSel() {
      content.querySelectorAll('[data-id]').forEach(d => d.classList.toggle('sel', sel.has(d.dataset.id)));
      renderCmd();
      renderStatus();
    }

    function renderStatus() {
      const n = loc === 'home' || loc === 'thispc' ? null : items().length;
      $('.ex-status').textContent = n == null ? '' : `${n} ${n === 1 ? 'item' : 'itens'}${sel.size ? `   |   ${sel.size} ${sel.size === 1 ? 'item selecionado' : 'itens selecionados'}` : ''}`;
    }

    function render() {
      for (const id of [...sel]) if (!fs.get(id) || (loc !== 'home' && loc !== 'thispc' && fs.get(id).parent !== loc)) sel.delete(id);
      if (loc !== 'home' && loc !== 'thispc' && !fs.get(loc)) loc = 'home';
      ctx.setTitle(title());
      renderNav(); renderAddr(); renderCmd(); renderContent(); renderStatus();
      $('[data-a="back"]').disabled = hi <= 0;
      $('[data-a="fwd"]').disabled = hi >= hist.length - 1;
      $('[data-a="up"]').disabled = !isFolder(loc) || !fs.get(loc).parent || loc === SPECIAL.TRASH;
      $('.ex-search input').placeholder = `Pesquisar em ${title()}`;
    }

    $('[data-a="back"]').onclick = () => { if (hi > 0) { hi--; go(hist[hi], false); } };
    $('[data-a="fwd"]').onclick = () => { if (hi < hist.length - 1) { hi++; go(hist[hi], false); } };
    $('[data-a="up"]').onclick = () => { const n = fs.get(loc); if (n && n.parent) go(n.parent === 'users' ? 'c' : n.parent); };
    $('[data-a="refresh"]').onclick = render;
    $('.ex-search input').addEventListener('input', (e) => { query = e.target.value.trim(); renderContent(); renderStatus(); if (query) os.emit('explorer:search', { q: query }); });
    content.addEventListener('pointerdown', (e) => { if (!e.target.closest('[data-id],[data-open],[data-file]')) { sel.clear(); markSel(); } });
    content.addEventListener('contextmenu', (e) => { if (e.target.closest('[data-id]')) return; e.preventDefault(); const p = os.toLocal(e.clientX, e.clientY); os.contextMenu(p.x, p.y, bgMenu()); os.emit('ctx:open', { target: 'explorer-bg' }); });
    content.addEventListener('dragover', (e) => { if (isFolder(loc) && loc !== SPECIAL.TRASH) e.preventDefault(); });
    content.addEventListener('drop', (e) => { e.preventDefault(); if (isFolder(loc)) dropInto(e, loc); });

    const unsub = fs.onChange(() => render());
    render();

    return {
      onArgs(a) { if (a.folder) go(a.folder); },
      onDestroy() { unsub(); },
      onKey(e, typing) {
        if (typing) return false;
        const k = e.key.toLowerCase();
        const ids = [...sel];
        if (e.ctrlKey && k === 'c') { command('copy'); os.emit('shortcut', { combo: 'ctrl+c' }); return true; }
        if (e.ctrlKey && k === 'x') { command('cut'); os.emit('shortcut', { combo: 'ctrl+x' }); return true; }
        if (e.ctrlKey && k === 'v') { if (isFolder(loc) && loc !== SPECIAL.TRASH) os.paste(loc); os.emit('shortcut', { combo: 'ctrl+v' }); return true; }
        if (e.ctrlKey && k === 'a') { sel = new Set(items().map(n => n.id)); markSel(); return true; }
        if (e.key === 'Delete' && ids.length) { loc === SPECIAL.TRASH || e.shiftKey ? os.deleteNodes(ids, true) : os.deleteNodes(ids); return true; }
        if (e.key === 'F2' && ids.length === 1) { startRename(ids[0]); return true; }
        if (e.key === 'Enter' && ids.length === 1) { open(ids[0]); return true; }
        if (e.key === 'Backspace') { $('[data-a="back"]').click(); return true; }
        return false;
      },
    };
  },
};
