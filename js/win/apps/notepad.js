// Bloco de Notas.
import { SPECIAL } from '../fs.js';
import { menubar } from './common.js';

export default {
  id: 'notepad', name: 'Bloco de Notas', icon: 'notepad', width: 720, height: 480, keywords: 'texto escrever notas bloco',
  open(ctx) {
    const { os, body, args } = ctx;
    const fs = os.fs;
    let node = args.node ? fs.get(args.node) : null;
    let saved = node ? (node.content || '') : '';
    let zoom = 100, wrap = true;
    body.classList.add('np');
    const ta = document.createElement('textarea');
    ta.className = 'np-text';
    ta.spellcheck = false;
    ta.dataset.tut = 'np-text';
    ta.value = saved;
    const status = document.createElement('div');
    status.className = 'np-status';
    const bar = menubar(os, [
      { label: 'Arquivo', tut: 'np-file', items: [
        { label: 'Novo', shortcut: 'Ctrl+N', action: () => newDoc() },
        { label: 'Nova janela', action: () => os.openApp('notepad') },
        { label: 'Abrir...', shortcut: 'Ctrl+O', action: () => openDoc() },
        { label: 'Salvar', shortcut: 'Ctrl+S', tut: 'np-save', action: () => save() },
        { label: 'Salvar como...', tut: 'np-saveas', action: () => save(true) },
        { sep: true },
        { label: 'Sair', action: () => os.close(ctx.win) },
      ] },
      { label: 'Editar', items: () => [
        { label: 'Desfazer', shortcut: 'Ctrl+Z', action: () => { ta.focus(); document.execCommand('undo'); } },
        { sep: true },
        { label: 'Recortar', shortcut: 'Ctrl+X', action: () => { ta.focus(); document.execCommand('cut'); } },
        { label: 'Copiar', shortcut: 'Ctrl+C', action: () => { ta.focus(); document.execCommand('copy'); } },
        { label: 'Colar', shortcut: 'Ctrl+V', action: () => pasteText() },
        { label: 'Selecionar tudo', shortcut: 'Ctrl+A', action: () => { ta.focus(); ta.select(); } },
        { sep: true },
        { label: 'Hora/Data', shortcut: 'F5', action: () => insert(new Date().toLocaleString('pt-BR')) },
      ] },
      { label: 'Exibir', items: () => [
        { label: 'Aumentar zoom', shortcut: 'Ctrl++', action: () => setZoom(zoom + 10) },
        { label: 'Diminuir zoom', shortcut: 'Ctrl+-', action: () => setZoom(zoom - 10) },
        { label: 'Restaurar zoom padrão', action: () => setZoom(100) },
        { sep: true },
        { label: 'Quebra automática de linha', checked: wrap, action: () => { wrap = !wrap; ta.wrap = wrap ? 'soft' : 'off'; ta.style.whiteSpace = wrap ? 'pre-wrap' : 'pre'; } },
      ] },
    ]);
    body.append(bar, ta, status);

    const name = () => (node ? node.name : 'Sem título');
    const dirty = () => ta.value !== saved;
    function refresh() {
      ctx.setTitle(`${dirty() ? '*' : ''}${name().replace(/\.txt$/i, '')} - Bloco de Notas`);
      const before = ta.value.slice(0, ta.selectionStart);
      const ln = before.split('\n').length, col = before.length - before.lastIndexOf('\n');
      status.innerHTML = `<span>Ln ${ln}, Col ${col}</span><span>${ta.value.length} caracteres</span><span>${zoom}%</span><span>Windows (CRLF)</span><span>UTF-8</span>`;
    }
    function setZoom(z) { zoom = Math.max(50, Math.min(300, z)); ta.style.fontSize = (15 * zoom / 100) + 'px'; refresh(); }
    function insert(t) {
      ta.focus();
      const s = ta.selectionStart, e = ta.selectionEnd;
      ta.setRangeText(t, s, e, 'end');
      ta.dispatchEvent(new Event('input'));
    }
    async function pasteText() {
      try { const t = await navigator.clipboard.readText(); if (t) insert(t); } catch {
        os.dialog({ title: 'Colar', icon: 'info', message: 'Use as teclas Ctrl+V para colar aqui.' });
      }
    }
    async function confirmDiscard() {
      if (!dirty()) return true;
      const r = await os.dialog({ title: 'Bloco de Notas', icon: null, message: `Deseja salvar as alterações em ${name()}?`, buttons: [{ label: 'Salvar', value: 'save', primary: true, tut: 'np-ask-save' }, { label: 'Não salvar', value: 'discard', tut: 'np-ask-discard' }, { label: 'Cancelar', value: false }] });
      if (r === 'save') return save();
      return r === 'discard';
    }
    async function newDoc() {
      if (!(await confirmDiscard())) return;
      node = null; saved = ''; ta.value = ''; refresh();
    }
    async function openDoc() {
      if (!(await confirmDiscard())) return;
      const r = await os.fileDialog({ mode: 'open', exts: ['txt'], folder: SPECIAL.DOCS });
      if (!r || !r.node) return;
      node = r.node; saved = node.content || ''; ta.value = saved; refresh();
      os.emit('notepad:open', { node });
    }
    async function save(as = false) {
      if (node && !as && fs.get(node.id)) {
        fs.write(node.id, { content: ta.value });
      } else {
        const r = await os.fileDialog({ mode: 'save', defaultName: node ? node.name : 'Sem título.txt', folder: node ? node.parent : SPECIAL.DOCS, exts: ['txt'] });
        if (!r) return false;
        if (r.node) { fs.write(r.node.id, { content: ta.value }); node = fs.get(r.node.id); }
        else { node = fs.create(r.folder, r.name, 'file', { content: ta.value }); os.emit('fs:create', { node, parent: r.folder }); }
      }
      saved = ta.value;
      refresh();
      os.emit('notepad:save', { node, content: saved, parent: node.parent });
      return true;
    }

    let typeT = null;
    ta.addEventListener('input', () => {
      refresh();
      clearTimeout(typeT);
      typeT = setTimeout(() => os.emit('notepad:type', { text: ta.value }), 250);
    });
    ta.addEventListener('keyup', refresh);
    ta.addEventListener('click', refresh);
    ta.addEventListener('keydown', (e) => {
      const k = e.key.toLowerCase();
      if (e.ctrlKey && k === 's') { e.preventDefault(); e.stopPropagation(); save(); os.emit('shortcut', { combo: 'ctrl+s' }); }
      else if (e.ctrlKey && k === 'n') { e.preventDefault(); newDoc(); }
      else if (e.ctrlKey && k === 'o') { e.preventDefault(); openDoc(); }
      else if (e.key === 'F5') { e.preventDefault(); insert(new Date().toLocaleString('pt-BR')); }
      else if (e.ctrlKey && ['c', 'v', 'x', 'z', 'a'].includes(k)) os.emit('shortcut', { combo: 'ctrl+' + k, app: 'notepad' });
    });
    ctx.onClose(() => confirmDiscard());
    setZoom(100);
    setTimeout(() => ta.focus(), 50);
    return {
      onArgs(a) { if (a.node && (!node || a.node !== node.id)) os.openApp('notepad', { ...a, _new: true }); },
      getText: () => ta.value,
      isDirty: dirty,
    };
  },
};
