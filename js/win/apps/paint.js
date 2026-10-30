// Paint: desenhar com lápis, pincel, formas e balde de tinta.
import { lico } from '../icons.js';
import { SPECIAL, ext } from '../fs.js';
import { genImage } from '../gen.js';
import { menubar } from './common.js';

const COLORS = ['#000000', '#7f7f7f', '#880015', '#ed1c24', '#ff7f27', '#fff200', '#22b14c', '#00a2e8', '#3f48cc', '#a349a4', '#ffffff', '#c3c3c3', '#b97a57', '#ffaec9', '#ffc90e', '#efe4b0', '#b5e61d', '#99d9ea', '#7092be', '#c8bfe7'];

export default {
  id: 'paint', name: 'Paint', icon: 'paint', width: 900, height: 600, keywords: 'desenhar pintar desenho',
  open(ctx) {
    const { os, body, args } = ctx;
    const fs = os.fs;
    let node = args.node ? fs.get(args.node) : null;
    let tool = 'pencil', color = '#000000', size = 3, dirty = false;
    const undo = [], redo = [];
    body.classList.add('paint');
    const bar = menubar(os, [
      { label: 'Arquivo', tut: 'paint-file', items: [
        { label: 'Novo', action: () => newImage() },
        { label: 'Abrir...', action: () => openImage() },
        { label: 'Salvar', shortcut: 'Ctrl+S', tut: 'paint-save', action: () => save() },
        { label: 'Salvar como...', action: () => save(true) },
        { sep: true },
        { label: 'Definir como plano de fundo', action: () => setWallpaper() },
      ] },
      { label: 'Editar', items: [
        { label: 'Desfazer', shortcut: 'Ctrl+Z', action: () => doUndo() },
        { label: 'Refazer', shortcut: 'Ctrl+Y', action: () => doRedo() },
        { label: 'Limpar tudo', action: () => { snapshot(); clear(); } },
      ] },
    ]);
    const tools = document.createElement('div');
    tools.className = 'paint-tools';
    const toolBtn = (id, iconName, label) => `<button class="w-ib${tool === id ? ' on' : ''}" data-tool="${id}" data-tut="paint-${id}" title="${label}">${lico(iconName, 20)}</button>`;
    tools.innerHTML = `<div class="paint-group">${toolBtn('pencil', 'pencil', 'Lápis')}${toolBtn('brush', 'brush', 'Pincel')}${toolBtn('eraser', 'eraser', 'Borracha')}${toolBtn('fill', 'bucket', 'Balde de tinta')}<small>Ferramentas</small></div>
      <div class="paint-group">${toolBtn('line', 'line', 'Linha')}${toolBtn('rect', 'rect', 'Retângulo')}${toolBtn('ellipse', 'ellipse', 'Elipse')}<small>Formas</small></div>
      <div class="paint-group"><select class="w-input sm" data-size aria-label="Espessura">${[1, 3, 6, 12, 24].map(s => `<option value="${s}" ${s === size ? 'selected' : ''}>${s} px</option>`).join('')}</select><small>Espessura</small></div>
      <div class="paint-group"><span class="paint-cur" title="Cor atual"></span><div class="paint-pal">${COLORS.map(c => `<button style="background:${c}" data-color="${c}" data-tut="color-${c.slice(1)}" title="${c}"></button>`).join('')}</div><input type="color" data-custom value="#000000" title="Mais cores"><small>Cores</small></div>
      <div class="paint-group"><button class="w-ib" data-undo title="Desfazer (Ctrl+Z)">${lico('undo', 20)}</button><button class="w-ib" data-redo title="Refazer">${lico('redo', 20)}</button><small>Histórico</small></div>`;
    const wrap = document.createElement('div');
    wrap.className = 'paint-canvaswrap';
    const cv = document.createElement('canvas');
    cv.width = 800; cv.height = 480;
    cv.className = 'paint-canvas';
    cv.dataset.tut = 'paint-canvas';
    const ov = document.createElement('canvas');
    ov.width = 800; ov.height = 480;
    ov.className = 'paint-overlay';
    const stage = document.createElement('div');
    stage.className = 'paint-stage';
    stage.append(cv, ov);
    wrap.appendChild(stage);
    const status = document.createElement('div');
    status.className = 'np-status';
    body.append(bar, tools, wrap, status);
    const g = cv.getContext('2d', { willReadFrequently: true });
    const og = ov.getContext('2d');

    function clear() { g.fillStyle = '#fff'; g.fillRect(0, 0, cv.width, cv.height); mark(); }
    function mark() { dirty = true; refresh(); }
    function refresh() {
      ctx.setTitle(`${dirty ? '*' : ''}${node ? node.name.replace(/\.(png|jpg)$/i, '') : 'Sem título'} - Paint`);
      tools.querySelector('.paint-cur').style.background = color;
      tools.querySelectorAll('[data-tool]').forEach(b => b.classList.toggle('on', b.dataset.tool === tool));
    }
    function snapshot() { undo.push(g.getImageData(0, 0, cv.width, cv.height)); if (undo.length > 30) undo.shift(); redo.length = 0; }
    function doUndo() { if (!undo.length) return; redo.push(g.getImageData(0, 0, cv.width, cv.height)); g.putImageData(undo.pop(), 0, 0); mark(); }
    function doRedo() { if (!redo.length) return; undo.push(g.getImageData(0, 0, cv.width, cv.height)); g.putImageData(redo.pop(), 0, 0); mark(); }
    function loadUrl(url) {
      const img = new Image();
      img.onload = () => { clear(); const k = Math.min(cv.width / img.width, cv.height / img.height); g.drawImage(img, 0, 0, img.width * k, img.height * k); dirty = false; refresh(); };
      img.src = url;
    }
    async function newImage() {
      if (dirty) {
        const r = await os.dialog({ title: 'Paint', icon: null, message: 'Deseja salvar as alterações?', buttons: [{ label: 'Salvar', value: 'save', primary: true }, { label: 'Não salvar', value: 'no' }, { label: 'Cancelar', value: false }] });
        if (!r) return;
        if (r === 'save' && !(await save())) return;
      }
      node = null; undo.length = 0; clear(); dirty = false; refresh();
    }
    async function openImage() {
      const r = await os.fileDialog({ mode: 'open', exts: ['png', 'jpg'], folder: SPECIAL.PICS });
      if (!r || !r.node) return;
      node = r.node;
      loadUrl(node.dataUrl || genImage(node.gen || 'bloom', 800, 480));
    }
    async function save(as = false) {
      const data = cv.toDataURL('image/png');
      if (node && !as && fs.get(node.id) && ext(node.name) === 'png') {
        if (!fs.write(node.id, { dataUrl: data, gen: null })) return storageFull();
      } else {
        const r = await os.fileDialog({ mode: 'save', defaultName: 'Meu desenho.png', folder: SPECIAL.PICS, exts: ['png'] });
        if (!r) return false;
        if (r.node) { if (!fs.write(r.node.id, { dataUrl: data, gen: null })) return storageFull(); node = fs.get(r.node.id); }
        else {
          node = fs.create(r.folder, r.name, 'file', { dataUrl: data });
          if (!fs.lastSaveOk) { fs.purge(node.id); node = null; return storageFull(); }
          os.emit('fs:create', { node, parent: r.folder });
        }
      }
      dirty = false;
      refresh();
      os.emit('paint:save', { node });
      return true;
    }
    function storageFull() {
      os.dialog({ title: 'Paint', icon: 'error', message: 'Não há espaço para salvar este desenho no simulador. Apague alguns desenhos antigos e tente de novo.' });
      return false;
    }
    async function setWallpaper() {
      if (!(await save())) return;
      os.set({ wallpaper: 'node:' + node.id }, 'settings:wallpaper');
    }

    function pos(e) {
      const r = cv.getBoundingClientRect();
      return { x: Math.round((e.clientX - r.left) / r.width * cv.width), y: Math.round((e.clientY - r.top) / r.height * cv.height) };
    }
    function flood(x, y, hex) {
      const img = g.getImageData(0, 0, cv.width, cv.height);
      const d = img.data, W = cv.width, H = cv.height;
      const i0 = (y * W + x) * 4;
      const t = [d[i0], d[i0 + 1], d[i0 + 2]];
      const c = [parseInt(hex.slice(1, 3), 16), parseInt(hex.slice(3, 5), 16), parseInt(hex.slice(5, 7), 16)];
      if (t[0] === c[0] && t[1] === c[1] && t[2] === c[2]) return;
      const match = i => Math.abs(d[i] - t[0]) + Math.abs(d[i + 1] - t[1]) + Math.abs(d[i + 2] - t[2]) < 60;
      const stack = [[x, y]];
      while (stack.length) {
        const [px, py] = stack.pop();
        let nx = px;
        while (nx >= 0 && match((py * W + nx) * 4)) nx--;
        nx++;
        let up = false, down = false;
        while (nx < W && match((py * W + nx) * 4)) {
          const i = (py * W + nx) * 4;
          d[i] = c[0]; d[i + 1] = c[1]; d[i + 2] = c[2]; d[i + 3] = 255;
          if (py > 0) { const m = match(((py - 1) * W + nx) * 4); if (m && !up) { stack.push([nx, py - 1]); up = true; } else if (!m) up = false; }
          if (py < H - 1) { const m = match(((py + 1) * W + nx) * 4); if (m && !down) { stack.push([nx, py + 1]); down = true; } else if (!m) down = false; }
          nx++;
        }
      }
      g.putImageData(img, 0, 0);
    }

    let drawing = null;
    ov.addEventListener('pointerdown', (e) => {
      ov.setPointerCapture(e.pointerId);
      const p = pos(e);
      snapshot();
      if (tool === 'fill') { flood(p.x, p.y, color); mark(); os.emit('paint:draw', { tool }); return; }
      drawing = { start: p, last: p };
      if (['pencil', 'brush', 'eraser'].includes(tool)) stroke(p, p);
    });
    ov.addEventListener('pointermove', (e) => {
      const p = pos(e);
      status.innerHTML = `<span>${p.x}, ${p.y} px</span><span>800 × 480 px</span>`;
      if (!drawing) return;
      if (['pencil', 'brush', 'eraser'].includes(tool)) { stroke(drawing.last, p); drawing.last = p; return; }
      og.clearRect(0, 0, ov.width, ov.height);
      shape(og, drawing.start, p);
    });
    ov.addEventListener('pointerup', (e) => {
      if (!drawing) return;
      const p = pos(e);
      if (['line', 'rect', 'ellipse'].includes(tool)) { og.clearRect(0, 0, ov.width, ov.height); shape(g, drawing.start, p); }
      drawing = null;
      mark();
      os.emit('paint:draw', { tool });
    });
    function stroke(a, b) {
      g.lineCap = 'round'; g.lineJoin = 'round';
      g.strokeStyle = tool === 'eraser' ? '#ffffff' : color;
      g.lineWidth = tool === 'pencil' ? Math.max(1, size / 2) : tool === 'eraser' ? size * 3 : size * 2;
      g.beginPath(); g.moveTo(a.x, a.y); g.lineTo(b.x, b.y); g.stroke();
    }
    function shape(c, a, b) {
      c.strokeStyle = color; c.lineWidth = size; c.lineCap = 'round';
      c.beginPath();
      if (tool === 'line') { c.moveTo(a.x, a.y); c.lineTo(b.x, b.y); }
      if (tool === 'rect') c.rect(Math.min(a.x, b.x), Math.min(a.y, b.y), Math.abs(b.x - a.x), Math.abs(b.y - a.y));
      if (tool === 'ellipse') c.ellipse((a.x + b.x) / 2, (a.y + b.y) / 2, Math.abs(b.x - a.x) / 2, Math.abs(b.y - a.y) / 2, 0, 0, Math.PI * 2);
      c.stroke();
    }
    tools.querySelectorAll('[data-tool]').forEach(b => { b.onclick = () => { tool = b.dataset.tool; refresh(); os.emit('paint:tool', { tool }); }; });
    tools.querySelectorAll('[data-color]').forEach(b => { b.onclick = () => { color = b.dataset.color; if (tool === 'eraser') tool = 'pencil'; refresh(); os.emit('paint:color', { color }); }; });
    tools.querySelector('[data-custom]').oninput = (e) => { color = e.target.value; refresh(); };
    tools.querySelector('[data-size]').onchange = (e) => { size = +e.target.value; };
    tools.querySelector('[data-undo]').onclick = doUndo;
    tools.querySelector('[data-redo]').onclick = doRedo;
    ctx.onClose(async () => {
      if (!dirty) return true;
      const r = await os.dialog({ title: 'Paint', icon: null, message: 'Deseja salvar as alterações no seu desenho?', buttons: [{ label: 'Salvar', value: 'save', primary: true }, { label: 'Não salvar', value: 'no' }, { label: 'Cancelar', value: false }] });
      if (r === 'save') return save();
      return r === 'no';
    });
    clear();
    dirty = false;
    if (node) loadUrl(node.dataUrl || genImage(node.gen || 'bloom', 800, 480));
    refresh();
    return {
      onKey(e) {
        const k = e.key.toLowerCase();
        if (e.ctrlKey && k === 's') { save(); return true; }
        if (e.ctrlKey && k === 'z') { doUndo(); return true; }
        if (e.ctrlKey && k === 'y') { doRedo(); return true; }
        return false;
      },
    };
  },
};
