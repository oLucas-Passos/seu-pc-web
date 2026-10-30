// Configurações do Windows simulado.
import { icon, lico } from '../icons.js';
import { genImage, WALLPAPERS } from '../gen.js';
import { SPECIAL, ext } from '../fs.js';
import { store } from '../../store.js';
import { getPart } from '../../hw/parts.js';
import { APPS } from './registry.js';
import { esc } from './common.js';

const PAGES = [
  ['system', 'Sistema', 'display'], ['bluetooth', 'Bluetooth e dispositivos', 'bluetooth'], ['network', 'Rede e Internet', 'wifi'],
  ['personalization', 'Personalização', 'brush'], ['apps', 'Aplicativos', 'apps'], ['accounts', 'Contas', 'user'],
  ['time', 'Hora e idioma', 'clock'], ['accessibility', 'Acessibilidade', 'access'], ['update', 'Windows Update', 'update'],
];
const ACCENTS = ['#0067c0', '#0078d4', '#e3008c', '#c50f1f', '#ca5010', '#986f0b', '#107c10', '#00838f', '#6b69d6', '#5d5a58'];

export function deviceSpecs() {
  const st = store.get('builder:current', null);
  const parts = (st?.items || []).map(i => getPart(i.partId)).filter(Boolean);
  const cpu = parts.find(p => p.cat === 'cpu');
  const gpu = parts.find(p => p.cat === 'gpu');
  const ram = parts.filter(p => p.cat === 'ram').reduce((t, p) => t + p.specs.gb, 0);
  const disk = parts.find(p => p.cat === 'storage');
  if (!cpu || !ram) return { cpu: 'Intel Core i5-12400F @ 4,4 GHz', ram: '16 GB', gpu: 'NVIDIA GeForce RTX 3050 8GB', disk: 'SSD NVMe 512 GB', fromBuild: false };
  return {
    cpu: `${cpu.name} @ ${String(cpu.specs.boostGHz).replace('.', ',')} GHz`,
    ram: `${ram} GB`,
    gpu: gpu ? gpu.name : (cpu.specs.igpuName || 'Vídeo integrado'),
    disk: disk ? disk.name : '—',
    fromBuild: true,
  };
}

export default {
  id: 'settings', name: 'Configurações', icon: 'settings', width: 920, height: 600, single: true, keywords: 'configurar opções ajustes papel parede tema wifi',
  open(ctx) {
    const { os, body, args } = ctx;
    let page = args.page || 'system';
    let updState = os.settings.updates;
    body.classList.add('set');
    body.innerHTML = `<aside class="set-nav"><div class="set-user">${icon('user', 54)}<span><b></b><small>Conta local</small></span></div>
      <div class="w-sbox">${lico('search', 15)}<input placeholder="Localizar uma configuração" data-tut="set-search"></div><nav></nav></aside><main class="set-main"></main>`;
    const nav = body.querySelector('nav');
    const main = body.querySelector('.set-main');
    const s = () => os.settings;

    function renderNav(filter = '') {
      body.querySelector('.set-user b').textContent = s().username;
      const f = filter.toLowerCase();
      nav.innerHTML = PAGES.filter(p => !f || p[1].toLowerCase().includes(f)).map(([id, nm, ic]) => `<button class="set-navi${id === page ? ' on' : ''}" data-p="${id}" data-tut="set-${id}">${lico(ic, 18)}<span>${nm}</span></button>`).join('');
      nav.querySelectorAll('[data-p]').forEach(b => { b.onclick = () => go(b.dataset.p); });
    }
    function go(p, sub) {
      page = p;
      renderNav();
      render(sub);
      os.emit('settings:page', { page: p });
    }
    const card = (title, desc, control, tut = '') => `<div class="set-card" ${tut ? `data-tut="${tut}"` : ''}><div><b>${title}</b>${desc ? `<small>${desc}</small>` : ''}</div><div class="set-ctl">${control}</div></div>`;
    const sw = (key, on, tut = '') => `<label class="w-switch"><input type="checkbox" data-sw="${key}" ${on ? 'checked' : ''} ${tut ? `data-tut="${tut}"` : ''}><i></i></label>`;

    function render(sub) {
      const S = s();
      const title = PAGES.find(p => p[0] === page)[1];
      let h = `<h1>${title}</h1>`;
      if (page === 'system') {
        const sp = deviceSpecs();
        h += `<h3>Tela</h3>${card('Brilho', 'Ajuste o brilho da tela', `<input type="range" min="10" max="100" value="${S.brightness}" data-range="brightness" data-tut="set-brightness">`)}
          <h3>Som</h3>${card('Volume', 'Volume dos alto-falantes', `<input type="range" min="0" max="100" value="${S.volume}" data-range="volume">`)}
          <h3>Notificações</h3>${card('Notificações', 'Avisos de aplicativos e do sistema', sw('notifications', S.notifications))}
          <h3>Armazenamento</h3><div class="set-card col"><b>Disco Local (C:)</b><div class="ex-bar"><i style="width:63%"></i></div><small>300 GB usados de 476 GB · Aplicativos 120 GB · Documentos 48 GB · Arquivos temporários 12 GB</small></div>
          <h3 id="about">Sobre</h3><div class="set-card col about" data-tut="set-about"><table class="w-kv">
          <tr><td>Nome do dispositivo</td><td>${esc(S.pcName)} <button class="w-btn sm" data-rename-pc>Renomear este PC</button></td></tr>
          <tr><td>Processador</td><td>${esc(sp.cpu)}</td></tr><tr><td>Memória RAM instalada</td><td>${esc(sp.ram)}</td></tr>
          <tr><td>Placa de vídeo</td><td>${esc(sp.gpu)}</td></tr><tr><td>Armazenamento</td><td>${esc(sp.disk)}</td></tr>
          <tr><td>Sistema</td><td>Windows simulado (Seu PC Web), 64 bits</td></tr></table>
          ${sp.fromBuild ? '<p class="w-muted">Estas são as peças do PC que você montou na bancada 3D.</p>' : '<p class="w-muted">Monte um PC na bancada 3D e as peças dele aparecem aqui.</p>'}</div>`;
      } else if (page === 'bluetooth') {
        h += card('Bluetooth', S.bluetooth ? 'Ligado: visível como ' + S.pcName : 'Desligado', sw('bluetooth', S.bluetooth, 'set-bt'))
          + `<div class="set-card"><div><b>Dispositivos</b><small>${S.paired.length ? S.paired.map(esc).join(', ') : 'Nenhum dispositivo pareado'}</small></div><div class="set-ctl"><button class="w-btn" data-add-bt data-tut="set-bt-add" ${S.bluetooth ? '' : 'disabled'}>${lico('plus', 14)} Adicionar dispositivo</button></div></div>
          <div class="set-card col bt-list" hidden></div>`;
      } else if (page === 'network') {
        const nets = os.networks();
        h += card('Wi-Fi', S.wifi.on ? (S.wifi.connected ? `Conectado a ${S.wifi.connected}` : 'Ligado, sem conexão') : 'Desligado', sw('wifi', S.wifi.on, 'set-wifi'))
          + card('Modo avião', 'Desliga todas as conexões sem fio', sw('airplane', S.airplane))
          + (S.wifi.on ? `<h3>Redes disponíveis</h3>${nets.map(n => `<div class="set-card"><div><b>${lico('wifi', 16)} ${esc(n.ssid)}</b><small>${S.wifi.connected === n.ssid ? 'Conectado' : n.secure ? 'Protegida por senha' : 'Aberta: qualquer um pode ver o que você envia'}</small></div><div class="set-ctl"><button class="w-btn${S.wifi.connected === n.ssid ? '' : ' primary'}" data-net="${esc(n.ssid)}" data-tut="set-net-${esc(n.ssid)}">${S.wifi.connected === n.ssid ? 'Desconectar' : 'Conectar'}</button></div></div>`).join('')}` : '');
      } else if (page === 'personalization') {
        const pics = os.fs.children(SPECIAL.PICS).filter(n => ['jpg', 'png'].includes(ext(n.name))).slice(0, 6);
        h += `<h3>Plano de fundo</h3><div class="set-walls">${WALLPAPERS.map(w => `<button class="set-wall${S.wallpaper === w.id ? ' on' : ''}" data-wall="${w.id}" data-tut="wall-${w.id}" title="${w.name}" style="background-image:url('${genImage(w.id, 320, 200)}')"><span>${w.name}</span></button>`).join('')}
          ${pics.map(n => `<button class="set-wall${S.wallpaper === 'node:' + n.id ? ' on' : ''}" data-wall="node:${n.id}" title="${esc(n.name)}" style="background-image:url('${n.dataUrl || genImage(n.gen || 'bloom', 320, 200)}')"><span>${esc(n.name)}</span></button>`).join('')}
          <button class="set-wall color${S.wallpaper.startsWith('color:') ? ' on' : ''}" data-wall="color:${S.accent}" style="background:${S.accent}"><span>Cor sólida</span></button></div>
          <h3>Cores</h3>${card('Escolha o modo', 'Claro ou escuro (descansa a vista à noite)', `<select class="w-input" data-theme data-tut="set-theme"><option value="light" ${S.theme === 'light' ? 'selected' : ''}>Claro</option><option value="dark" ${S.theme === 'dark' ? 'selected' : ''}>Escuro</option></select>`)}
          <div class="set-card col"><b>Cor de destaque</b><div class="set-accents">${ACCENTS.map(c => `<button style="background:${c}" class="${S.accent === c ? 'on' : ''}" data-accent="${c}" data-tut="accent-${c.slice(1)}" title="${c}"></button>`).join('')}</div></div>
          <h3>Barra de tarefas</h3>${card('Alinhamento', 'Onde ficam o botão Iniciar e os ícones', `<select class="w-input" data-align><option value="center" ${S.taskbarAlign === 'center' ? 'selected' : ''}>Centro</option><option value="left" ${S.taskbarAlign === 'left' ? 'selected' : ''}>Esquerda</option></select>`)}`;
      } else if (page === 'apps') {
        const list = S.installed.map(id => APPS[id]).filter(Boolean);
        h += `<p class="w-muted">Programas instalados neste computador. Os que vieram da Loja podem ser desinstalados.</p>${list.map(a => `<div class="set-card"><div style="display:flex;gap:12px;align-items:center">${icon(a.icon, 32)}<span><b>${esc(a.name)}</b><small>${a.store ? 'Instalado pela Loja' : 'Aplicativo do sistema'}</small></span></div><div class="set-ctl">${a.store ? `<button class="w-btn" data-uninstall="${a.id}" data-tut="uninstall-${a.id}">Desinstalar</button>` : '<small class="w-muted">Não pode ser removido</small>'}</div></div>`).join('')}`;
      } else if (page === 'accounts') {
        h += `<div class="set-card col"><div style="display:flex;gap:16px;align-items:center">${icon('user', 72)}<div><b style="font-size:20px">${esc(S.username)}</b><small>Administrador · conta local</small></div></div></div>
          ${card('Seu nome', 'Aparece na tela de entrada e no menu Iniciar', `<input class="w-input" data-username value="${esc(S.username)}" data-tut="set-username" maxlength="24"><button class="w-btn primary" data-save-name>Salvar</button>`)}
          ${card('Opções de entrada', 'Senha, PIN ou impressão digital protegem o computador quando você não está por perto.', '<small class="w-muted">Sempre use uma senha que só você saiba.</small>')}`;
      } else if (page === 'time') {
        const d = new Date();
        h += card('Data e hora atuais', d.toLocaleString('pt-BR', { dateStyle: 'full', timeStyle: 'short' }), '')
          + card('Fuso horário', '(UTC-03:00) Brasília', '')
          + card('Idioma', 'Português (Brasil)', '');
      } else if (page === 'accessibility') {
        h += card('Tamanho do texto', 'Deixa as letras do Windows maiores', `<input type="range" min="100" max="140" step="10" value="${S.textScale}" data-range="textScale" data-tut="set-textsize"><span class="w-val">${S.textScale}%</span>`)
          + card('Tema escuro', 'Fundo escuro e letras claras', sw('darkTheme', S.theme === 'dark'))
          + card('Notificações', 'Mostrar avisos na tela', sw('notifications', S.notifications))
          + `<p class="w-muted">Dica: nos navegadores, Ctrl e + aumentam o zoom das páginas.</p>`;
      } else if (page === 'update') {
        const msg = { pending: ['Atualizações disponíveis', 'Atualização de segurança para o Windows simulado (KB5031234)', 'Baixar e instalar'], checking: ['Procurando atualizações...', 'Aguarde um momento', null], installing: ['Instalando atualizações...', 'Não desligue o computador', null], restart: ['Reinicialização necessária', 'Reinicie para terminar de instalar', 'Reiniciar agora'], done: ['Você está atualizado', `Última verificação: hoje, ${new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}`, 'Verificar se há atualizações'] }[updState];
        h += `<div class="set-card big">${lico('update', 40)}<div><b>${msg[0]}</b><small>${msg[1]}</small>${['checking', 'installing'].includes(updState) ? '<div class="ex-bar prog"><i></i></div>' : ''}</div><div class="set-ctl">${msg[2] ? `<button class="w-btn primary" data-upd data-tut="set-update-btn">${msg[2]}</button>` : ''}</div></div>
          <p class="w-muted">Manter o sistema atualizado corrige falhas de segurança. Deixe as atualizações automáticas ligadas.</p>`;
      }
      main.innerHTML = h;
      bind();
      if (sub === 'about') setTimeout(() => main.querySelector('#about')?.scrollIntoView(), 30);
    }

    function bind() {
      main.querySelectorAll('[data-range]').forEach(r => {
        r.oninput = () => {
          const k = r.dataset.range;
          os.settings[k] = +r.value;
          os.saveSettings(); os.applySettings();
          const v = r.parentElement.querySelector('.w-val'); if (v) v.textContent = r.value + '%';
          os.emit(k === 'textScale' ? 'settings:textsize' : k, { value: +r.value });
        };
      });
      main.querySelectorAll('[data-sw]').forEach(c => {
        c.onchange = () => {
          const k = c.dataset.sw, on = c.checked;
          if (k === 'wifi') os.setWifi(on);
          else if (k === 'airplane') os.set({ airplane: on, wifi: { ...s().wifi, on: !on, connected: on ? null : s().wifi.connected } }, 'airplane:toggle');
          else if (k === 'darkTheme') os.set({ theme: on ? 'dark' : 'light' }, 'settings:theme');
          else if (k === 'bluetooth') os.set({ bluetooth: on }, 'bluetooth:toggle');
          else os.set({ [k]: on });
          render();
        };
      });
      main.querySelectorAll('[data-wall]').forEach(b => { b.onclick = () => { os.set({ wallpaper: b.dataset.wall }, 'settings:wallpaper'); render(); }; });
      main.querySelectorAll('[data-accent]').forEach(b => { b.onclick = () => { os.set({ accent: b.dataset.accent }, 'settings:accent'); render(); }; });
      const th = main.querySelector('[data-theme]'); if (th) th.onchange = () => { os.set({ theme: th.value }, 'settings:theme'); };
      const al = main.querySelector('[data-align]'); if (al) al.onchange = () => { os.set({ taskbarAlign: al.value }, 'settings:taskbar'); };
      main.querySelectorAll('[data-net]').forEach(b => { b.onclick = async () => { await os.connectWifi(b.dataset.net); render(); }; });
      main.querySelectorAll('[data-uninstall]').forEach(b => {
        b.onclick = async () => {
          const id = b.dataset.uninstall;
          const ok = await os.dialog({ title: 'Desinstalar', icon: 'question', message: `Este aplicativo e as informações relacionadas a ele serão desinstalados.\n\nDesinstalar ${APPS[id].name}?`, buttons: [{ label: 'Desinstalar', value: true, primary: true, tut: 'uninstall-ok' }, { label: 'Cancelar', value: false }] });
          if (!ok) return;
          for (const w of os.windows.filter(x => x.app === id)) await os.close(w, { force: true });
          os.set({ installed: s().installed.filter(x => x !== id), pinned: s().pinned.filter(x => x !== id) });
          os.renderTaskbar();
          os.emit('app:uninstall', { app: id });
          os.notify('Aplicativo desinstalado', `${APPS[id].name} foi removido.`, 'settings');
          render();
        };
      });
      const sn = main.querySelector('[data-save-name]');
      if (sn) sn.onclick = () => { const v = main.querySelector('[data-username]').value.trim(); if (v) { os.set({ username: v }, 'settings:username'); renderNav(); render(); os.notify('Contas', `Seu nome agora é ${v}.`, 'settings'); } };
      const rp = main.querySelector('[data-rename-pc]');
      if (rp) rp.onclick = async () => {
        const r = await os.dialog({ title: 'Renomear seu PC', icon: null, message: 'Novo nome (sem espaços):', input: { value: s().pcName }, buttons: [{ label: 'Cancelar', value: false }, { label: 'Avançar', value: true, primary: true }] });
        if (r && r.value && r.text.trim()) { os.set({ pcName: r.text.trim().replace(/\s+/g, '-').toUpperCase().slice(0, 15) }); render(); }
      };
      const ab = main.querySelector('[data-add-bt]');
      if (ab) ab.onclick = () => {
        const L = main.querySelector('.bt-list');
        L.hidden = false;
        L.innerHTML = '<b>Procurando dispositivos...</b><div class="ex-bar prog"><i></i></div>';
        setTimeout(() => {
          L.innerHTML = '<b>Escolha um dispositivo</b>' + [['Fone de ouvido JBL', 'headphones'], ['Caixa de som Bluetooth', 'volume'], ['Celular da Ana', 'device']].map(([n, ic]) => `<button class="set-btdev" data-dev="${n}">${lico(ic, 18)} ${n}</button>`).join('');
          L.querySelectorAll('[data-dev]').forEach(b => { b.onclick = () => { const p = [...new Set([...s().paired, b.dataset.dev])]; os.set({ paired: p }); os.emit('bluetooth:pair', { device: b.dataset.dev }); os.notify('Bluetooth', `${b.dataset.dev} conectado.`, 'settings'); render(); }; });
        }, 1500);
      };
      const ub = main.querySelector('[data-upd]');
      if (ub) ub.onclick = () => {
        if (updState === 'restart') { os.set({ updates: 'done' }); os.shutdown('restart'); return; }
        if (updState === 'done') { updState = 'checking'; render(); setTimeout(() => { updState = 'done'; render(); os.emit('update:check', { result: 'none' }); }, 1800); return; }
        updState = 'checking'; render(); os.emit('update:check', { result: 'found' });
        setTimeout(() => { updState = 'installing'; render(); }, 1500);
        setTimeout(() => { updState = 'restart'; os.set({ updates: 'restart' }); render(); os.emit('update:installed', {}); os.notify('Windows Update', 'Reinicie o computador para concluir a atualização.', 'settings'); }, 4200);
      };
    }

    body.querySelector('.set-nav input').addEventListener('input', (e) => renderNav(e.target.value));
    renderNav();
    render(args.sub);
    setTimeout(() => os.emit('settings:page', { page }), 0);
    return { onArgs(a) { if (a.page) go(a.page, a.sub); } };
  },
};
