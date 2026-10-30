// Peças reutilizadas pelos aplicativos (barra de menus, utilidades).
import { lico } from '../icons.js';
export const esc = s => String(s ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));

// defs: [{ label: 'Arquivo', tut, items: [{ label, shortcut, action, sep, disabled, tut }] }]
export function menubar(os, defs) {
  const bar = document.createElement('div');
  bar.className = 'w-menubar';
  let openMenu = null;
  const close = () => { if (openMenu) { openMenu.remove(); openMenu = null; bar.querySelectorAll('.on').forEach(b => b.classList.remove('on')); } };
  for (const d of defs) {
    const b = document.createElement('button');
    b.className = 'w-mb';
    b.textContent = d.label;
    if (d.tut) b.dataset.tut = d.tut;
    b.addEventListener('click', (e) => {
      e.stopPropagation();
      const was = b.classList.contains('on');
      close();
      if (was) return;
      b.classList.add('on');
      const m = document.createElement('div');
      m.className = 'w-ctx w-dropdown';
      for (const it of (typeof d.items === 'function' ? d.items() : d.items)) {
        if (it.sep) { m.appendChild(Object.assign(document.createElement('div'), { className: 'w-ctx-sep' })); continue; }
        const ib = document.createElement('button');
        ib.className = 'w-ctx-item';
        ib.innerHTML = `<span class="ic">${it.icon ? lico(it.icon, 15) : it.checked ? lico('check', 15) : ''}</span><span class="lb">${esc(it.label)}</span>${it.shortcut ? `<span class="sc">${it.shortcut}</span>` : ''}`;
        if (it.tut) ib.dataset.tut = it.tut;
        ib.disabled = !!it.disabled;
        ib.addEventListener('click', (ev) => { ev.stopPropagation(); close(); it.action && it.action(); });
        m.appendChild(ib);
      }
      m.style.left = b.offsetLeft + 'px';
      m.style.top = b.offsetTop + b.offsetHeight + 'px';
      bar.appendChild(m);
      openMenu = m;
      os.emit('menu:open', { label: d.label });
    });
    bar.appendChild(b);
  }
  document.addEventListener('pointerdown', (e) => { if (openMenu && !bar.contains(e.target)) close(); }, true);
  return bar;
}

export function html(strings, ...vals) {
  return strings.reduce((s, str, i) => s + str + (i < vals.length ? vals[i] : ''), '');
}

export function frag(markup) {
  const t = document.createElement('template');
  t.innerHTML = markup.trim();
  return t.content.firstElementChild;
}
