// Abertura animada: o PC "liga", a placa acende e o nome aparece. Mostrada uma vez por visita.
export function playIntro() {
  let seen = false;
  try { seen = sessionStorage.getItem('seupcweb:intro') === '1'; } catch { /* sem armazenamento */ }
  if (seen || matchMedia('(prefers-reduced-motion: reduce)').matches) return;
  try { sessionStorage.setItem('seupcweb:intro', '1'); } catch { /* sem armazenamento */ }

  const lines = ['SEU PC WEB BIOS v3.0', 'Processador ........ OK', 'Memória 16384 MB ... OK', 'Placa de vídeo ..... OK', 'Carregando lições .. OK'];
  const el = document.createElement('div');
  el.className = 'intro';
  el.innerHTML = `
    <svg class="intro-board" viewBox="0 0 400 260" aria-hidden="true">
      <rect x="10" y="10" width="380" height="240" rx="10" class="ib-pcb"/>
      <path class="ib-trace t1" d="M40 60 H150 V120 H230"/>
      <path class="ib-trace t2" d="M40 200 H120 V150 H230"/>
      <path class="ib-trace t3" d="M360 40 V110 H290"/>
      <path class="ib-trace t4" d="M360 220 V150 H290"/>
      <path class="ib-trace t5" d="M200 230 V180"/>
      <rect x="230" y="95" width="60" height="70" rx="4" class="ib-chip"/>
      <rect x="244" y="110" width="32" height="40" rx="2" class="ib-core"/>
      <rect x="320" y="40" width="10" height="180" rx="2" class="ib-ram"/>
      <rect x="338" y="40" width="10" height="180" rx="2" class="ib-ram r2"/>
      <circle cx="40" cy="60" r="5" class="ib-node"/><circle cx="40" cy="200" r="5" class="ib-node"/>
    </svg>
    <pre class="intro-post"></pre>
    <div class="intro-name"><span>Seu PC</span> <b>Web</b></div>
    <p class="intro-tag">Aprenda computador do zero.</p>
    <button class="intro-skip" type="button">Pular abertura</button>`;
  document.body.appendChild(el);
  const post = el.querySelector('.intro-post');
  let i = 0;
  const t = setInterval(() => { post.textContent += (i ? '\n' : '') + lines[i]; if (++i >= lines.length) clearInterval(t); }, 260);
  const end = () => { clearInterval(t); el.classList.add('out'); setTimeout(() => el.remove(), 700); };
  el.querySelector('.intro-skip').onclick = end;
  setTimeout(end, 3900);
}
