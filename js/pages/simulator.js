import { h, toast, confirmBox } from '../ui.js';
import { go } from '../main.js';
import { WinOS } from '../win/os.js';
import { Tutor } from '../win/tutor.js';

const KEYS = [
  ['win', 'Tecla Windows', 'Abre o menu Iniciar'],
  ['win+d', 'Win + D', 'Mostra a Área de Trabalho'],
  ['win+e', 'Win + E', 'Abre o Explorador de Arquivos'],
  ['alt+tab', 'Alt + Tab', 'Troca de janela'],
  ['alt+f4', 'Alt + F4', 'Fecha a janela ativa'],
  ['ctrl+shift+esc', 'Ctrl + Shift + Esc', 'Abre o Gerenciador de Tarefas'],
  ['win+l', 'Win + L', 'Bloqueia o computador'],
  ['printscreen', 'Print Screen', 'Tira uma foto da tela'],
];

export function mount(root, params = {}) {
  const host = h('div', { class: 'sim-host' });
  const panel = h('aside', { class: 'sim-tutor', 'aria-live': 'polite' });
  const keys = h('div', { class: 'sim-keys', role: 'toolbar', 'aria-label': 'Teclas especiais' },
    h('span', { class: 'silk' }, 'Teclas'),
    KEYS.map(([combo, label, title]) => h('button', { class: 'sim-key', type: 'button', title, onclick: () => { os.shortcut(combo); os.screen.focus({ preventScroll: true }); } }, label)),
    h('span', { class: 'sim-sp' }),
    h('button', { class: 'sim-key', type: 'button', onclick: () => fullscreen() }, 'Tela cheia'),
    h('button', { class: 'sim-key warn', type: 'button', onclick: () => resetSim() }, 'Restaurar simulador'),
  );
  const wrap = h('div', { class: 'simpage' }, h('div', { class: 'sim-left' }, keys, host, h('p', { class: 'sim-rotate' }, 'Dica: no celular, gire a tela na horizontal para enxergar melhor.')), panel);
  root.appendChild(wrap);

  const os = new WinOS(host);
  const tutor = new Tutor(panel, os, { onPick: (id) => go('simulador', { lesson: id }) });

  async function resetSim() {
    const ok = await confirmBox('Restaurar simulador', 'Os arquivos, configurações e programas instalados no Windows simulado voltam ao estado inicial.', { ok: 'Restaurar' });
    if (!ok) return;
    os.resetAll();
    toast('Simulador restaurado.', 'ok');
    if (tutor.lesson) tutor.start(tutor.lesson.id);
    else { os.skipToDesktop(); }
  }
  function fullscreen() {
    const el = wrap;
    if (document.fullscreenElement) document.exitFullscreen().catch(() => {});
    else if (el.requestFullscreen) el.requestFullscreen().catch(() => toast('Seu navegador não permitiu a tela cheia aqui.', 'warn'));
  }

  if (params.lesson) {
    tutor.start(params.lesson);
    os.skipToDesktop();
  } else {
    tutor.free();
    os.boot();
  }

  return () => {
    tutor.stop();
    os.destroy();
    if (document.fullscreenElement) document.exitFullscreen().catch(() => {});
  };
}
