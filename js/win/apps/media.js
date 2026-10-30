// Fotos (visualizador de imagens) e Media Player.
import { lico } from '../icons.js';
import { ext } from '../fs.js';
import { genImage } from '../gen.js';
import { esc } from './common.js';

export const photos = {
  id: 'photos', name: 'Fotos', icon: 'photos', width: 820, height: 560, keywords: 'imagens fotos ver',
  open(ctx) {
    const { os, body, args } = ctx;
    const fs = os.fs;
    let node = args.node ? fs.get(args.node) : null;
    let zoom = 1, rot = 0;
    body.classList.add('ph');
    body.innerHTML = `<div class="ph-bar">
      <button class="w-ib" data-a="prev" title="Anterior">${lico('back')}</button><button class="w-ib" data-a="next" title="Próxima">${lico('fwd')}</button>
      <span class="ph-name"></span>
      <button class="w-ib" data-a="zin" title="Ampliar">${lico('zoomIn')}</button><button class="w-ib" data-a="zout" title="Reduzir">${lico('zoomOut')}</button>
      <button class="w-ib" data-a="rot" title="Girar">${lico('rotate')}</button>
      <button class="w-cb" data-a="wall" data-tut="ph-wallpaper">${lico('display')}<span>Definir como plano de fundo</span></button>
      <button class="w-ib" data-a="del" title="Excluir">${lico('trash')}</button></div>
      <div class="ph-view"><img alt=""></div>`;
    const img = body.querySelector('img');
    const siblings = () => node ? fs.children(node.parent).filter(n => ['jpg', 'png'].includes(ext(n.name))) : [];
    function show() {
      if (!node) {
        const first = fs.children('pics').find(n => ['jpg', 'png'].includes(ext(n.name)));
        node = first || null;
      }
      if (!node) { body.querySelector('.ph-view').innerHTML = '<p class="w-muted">Nenhuma imagem para mostrar.</p>'; return; }
      img.src = node.dataUrl || genImage(node.gen || 'bloom', 1200, 750);
      img.style.transform = `scale(${zoom}) rotate(${rot}deg)`;
      body.querySelector('.ph-name').textContent = node.name;
      ctx.setTitle(`${node.name} - Fotos`);
      const sib = siblings();
      body.querySelector('[data-a="prev"]').disabled = sib.length < 2;
      body.querySelector('[data-a="next"]').disabled = sib.length < 2;
      os.emit('photos:open', { node });
    }
    body.querySelector('.ph-bar').addEventListener('click', (e) => {
      const b = e.target.closest('[data-a]');
      if (!b || !node) return;
      const a = b.dataset.a;
      const sib = siblings();
      const i = sib.findIndex(n => n.id === node.id);
      if (a === 'prev') { node = sib[(i - 1 + sib.length) % sib.length]; zoom = 1; rot = 0; }
      if (a === 'next') { node = sib[(i + 1) % sib.length]; zoom = 1; rot = 0; }
      if (a === 'zin') zoom = Math.min(4, zoom * 1.25);
      if (a === 'zout') zoom = Math.max(0.25, zoom / 1.25);
      if (a === 'rot') rot = (rot + 90) % 360;
      if (a === 'wall') { os.set({ wallpaper: 'node:' + node.id }, 'settings:wallpaper'); os.emit('photos:wallpaper', { node }); os.notify('Plano de fundo', `"${node.name}" agora é o seu papel de parede.`, 'photos'); }
      if (a === 'del') {
        const next = sib.length > 1 ? sib[(i + 1) % sib.length] : null;
        os.deleteNodes([node.id]);
        if (!next) { os.close(ctx.win); return; }
        node = next;
      }
      show();
    });
    show();
    return { onArgs(a) { if (a.node) { node = fs.get(a.node); zoom = 1; rot = 0; show(); } } };
  },
};

export const player = {
  id: 'player', name: 'Media Player', icon: 'player', width: 560, height: 420, single: true, keywords: 'música vídeo tocar ouvir assistir',
  open(ctx) {
    const { os, body, args } = ctx;
    let node = args.node ? os.fs.get(args.node) : null;
    let playing = false, t = 0, timer = null;
    body.classList.add('mp');
    function render() {
      const isVideo = node && ext(node.name) === 'mp4';
      const dur = node?.duration || 120;
      body.innerHTML = `<div class="mp-screen ${isVideo ? 'video' : 'audio'}">${node ? (isVideo ? '<div class="mp-film"><span></span><span></span><span></span></div>' : '<div class="mp-eq">' + '<i></i>'.repeat(12) + '</div>') : '<p>Abra uma música ou um vídeo pelo Explorador de Arquivos.</p>'}<b>${node ? esc(node.name.replace(/\.\w+$/, '')) : 'Media Player'}</b></div>
        <div class="mp-ctrl"><span class="mp-t">${fmt(t)}</span><input type="range" min="0" max="${dur}" value="${t}" class="mp-seek" aria-label="Posição"><span>${fmt(dur)}</span></div>
        <div class="mp-btns"><button class="w-ib big" data-play data-tut="mp-play" ${node ? '' : 'disabled'}>${lico(playing ? 'pause' : 'play', 26)}</button>
        <span class="mp-vol">${lico('volume', 18)} ${os.settings.volume}%</span></div>`;
      body.classList.toggle('playing', playing);
      body.querySelector('[data-play]').onclick = toggle;
      body.querySelector('.mp-seek').oninput = (e) => { t = +e.target.value; body.querySelector('.mp-t').textContent = fmt(t); };
      ctx.setTitle(node ? `${node.name} - Media Player` : 'Media Player');
    }
    const fmt = s => `${Math.floor(s / 60)}:${String(Math.floor(s % 60)).padStart(2, '0')}`;
    function toggle() {
      playing = !playing;
      clearInterval(timer);
      if (playing) {
        os.emit('player:play', { node });
        timer = setInterval(() => {
          t++;
          if (t >= (node?.duration || 120)) { t = 0; playing = false; clearInterval(timer); render(); return; }
          const s = body.querySelector('.mp-seek'); if (s) s.value = t;
          const tt = body.querySelector('.mp-t'); if (tt) tt.textContent = fmt(t);
        }, 1000);
      }
      render();
    }
    render();
    if (node) toggle();
    return {
      onArgs(a) { if (a.node) { node = os.fs.get(a.node); t = 0; playing = false; clearInterval(timer); toggle(); } },
      onDestroy() { clearInterval(timer); },
    };
  },
};
