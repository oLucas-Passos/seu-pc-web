// Imagens de exemplo desenhadas por código (fotos e papéis de parede).
const cache = new Map();

export function genImage(kind, w = 800, h = 500) {
  const key = `${kind}:${w}x${h}`;
  if (cache.has(key)) return cache.get(key);
  const c = document.createElement('canvas');
  c.width = w; c.height = h;
  const g = c.getContext('2d');
  const sky = (top, bottom) => { const gr = g.createLinearGradient(0, 0, 0, h); gr.addColorStop(0, top); gr.addColorStop(1, bottom); g.fillStyle = gr; g.fillRect(0, 0, w, h); };
  const sun = (x, y, r, col) => { const gr = g.createRadialGradient(x, y, 0, x, y, r * 3); gr.addColorStop(0, col); gr.addColorStop(0.3, col); gr.addColorStop(1, 'rgba(255,255,255,0)'); g.fillStyle = gr; g.fillRect(0, 0, w, h); g.fillStyle = col; g.beginPath(); g.arc(x, y, r, 0, Math.PI * 2); g.fill(); };
  const hills = (base, amp, color, seed) => {
    g.fillStyle = color; g.beginPath(); g.moveTo(0, h);
    for (let x = 0; x <= w; x += 8) g.lineTo(x, base + Math.sin(x / (90 + seed * 20) + seed) * amp + Math.sin(x / 37 + seed * 3) * amp * 0.3);
    g.lineTo(w, h); g.closePath(); g.fill();
  };
  if (kind === 'praia') {
    sky('#5ab6f2', '#c9ecff');
    sun(w * 0.78, h * 0.22, h * 0.07, '#fff6c9');
    g.fillStyle = '#1f8fc7'; g.fillRect(0, h * 0.55, w, h * 0.2);
    g.fillStyle = 'rgba(255,255,255,0.5)';
    for (let i = 0; i < 18; i++) g.fillRect((i * 97) % w, h * 0.6 + (i % 4) * 10, 40, 2);
    hills(h * 0.74, 10, '#f1d8a0', 1);
    g.strokeStyle = '#6b4a2b'; g.lineWidth = 9; g.beginPath(); g.moveTo(w * 0.18, h * 0.85); g.quadraticCurveTo(w * 0.2, h * 0.55, w * 0.27, h * 0.38); g.stroke();
    g.fillStyle = '#2e8b3e';
    for (let i = 0; i < 6; i++) { g.save(); g.translate(w * 0.27, h * 0.38); g.rotate(-1.2 + i * 0.55); g.beginPath(); g.ellipse(45, 0, 55, 12, 0.3, 0, Math.PI * 2); g.fill(); g.restore(); }
  } else if (kind === 'montanha') {
    sky('#7fb3e6', '#e6f0f7');
    sun(w * 0.2, h * 0.2, h * 0.05, '#ffffff');
    g.fillStyle = '#8e9db3'; g.beginPath(); g.moveTo(0, h * 0.7); g.lineTo(w * 0.28, h * 0.25); g.lineTo(w * 0.5, h * 0.6); g.lineTo(w * 0.7, h * 0.18); g.lineTo(w, h * 0.62); g.lineTo(w, h); g.lineTo(0, h); g.fill();
    g.fillStyle = '#ffffff'; g.beginPath(); g.moveTo(w * 0.7, h * 0.18); g.lineTo(w * 0.64, h * 0.3); g.lineTo(w * 0.7, h * 0.27); g.lineTo(w * 0.76, h * 0.31); g.fill();
    g.beginPath(); g.moveTo(w * 0.28, h * 0.25); g.lineTo(w * 0.23, h * 0.34); g.lineTo(w * 0.29, h * 0.31); g.lineTo(w * 0.33, h * 0.34); g.fill();
    hills(h * 0.72, 18, '#3f7f46', 2);
    hills(h * 0.84, 12, '#2c6234', 4);
  } else if (kind === 'sol') {
    sky('#2b1a4d', '#ff8a4c');
    sun(w * 0.5, h * 0.62, h * 0.12, '#ffd36b');
    g.fillStyle = '#d65a3a'; g.fillRect(0, h * 0.66, w, h * 0.34);
    g.fillStyle = 'rgba(255,215,120,0.55)';
    for (let i = 0; i < 9; i++) g.fillRect(w * 0.5 - (60 - i * 6), h * 0.68 + i * 12, (60 - i * 6) * 2, 4);
    hills(h * 0.8, 14, '#2a1530', 5);
  } else if (kind === 'flores') {
    sky('#9ad3f5', '#e9f7ff');
    hills(h * 0.5, 20, '#5fae4f', 3);
    let s = 7;
    const rnd = () => ((s = (s * 9301 + 49297) % 233280) / 233280);
    const cols = ['#ff5a7a', '#ffd23a', '#ff8c2b', '#c86bff', '#ffffff'];
    for (let i = 0; i < 70; i++) {
      const x = rnd() * w, y = h * 0.55 + rnd() * h * 0.45, r = 6 + rnd() * 10;
      g.strokeStyle = '#3c7d32'; g.lineWidth = 2; g.beginPath(); g.moveTo(x, y); g.lineTo(x, y + r * 2.5); g.stroke();
      g.fillStyle = cols[i % cols.length];
      for (let k = 0; k < 5; k++) { g.beginPath(); g.arc(x + Math.cos(k * 1.26) * r * 0.7, y + Math.sin(k * 1.26) * r * 0.7, r * 0.55, 0, Math.PI * 2); g.fill(); }
      g.fillStyle = '#ffcc33'; g.beginPath(); g.arc(x, y, r * 0.35, 0, Math.PI * 2); g.fill();
    }
  } else if (kind === 'bloom' || kind === 'bloomDark') {
    const dark = kind === 'bloomDark';
    g.fillStyle = dark ? '#05122b' : '#cfe3f7'; g.fillRect(0, 0, w, h);
    const petal = (rot, col, sc) => {
      g.save(); g.translate(w * 0.5, h * 0.62); g.rotate(rot); g.scale(sc, sc);
      const gr = g.createLinearGradient(-w * 0.2, 0, w * 0.25, 0);
      gr.addColorStop(0, col[0]); gr.addColorStop(1, col[1]);
      g.fillStyle = gr; g.beginPath(); g.ellipse(w * 0.06, -h * 0.08, w * 0.24, h * 0.13, -0.5, 0, Math.PI * 2); g.fill(); g.restore();
    };
    const c1 = dark ? ['#0b3b8f', '#3d8bff'] : ['#3c7ee8', '#a6d1ff'];
    const c2 = dark ? ['#08306e', '#1f64d6'] : ['#1f5fc9', '#7cb6ff'];
    for (let i = 0; i < 7; i++) petal(-1.3 + i * 0.42, i % 2 ? c1 : c2, 1 + (i % 3) * 0.08);
    const glow = g.createRadialGradient(w * 0.5, h * 0.6, 0, w * 0.5, h * 0.6, w * 0.4);
    glow.addColorStop(0, dark ? 'rgba(90,160,255,0.45)' : 'rgba(255,255,255,0.6)'); glow.addColorStop(1, 'rgba(255,255,255,0)');
    g.fillStyle = glow; g.fillRect(0, 0, w, h);
  } else if (kind === 'aurora') {
    sky('#061a2b', '#0b3b44');
    for (let i = 0; i < 5; i++) {
      const gr = g.createLinearGradient(0, h * 0.2, 0, h * 0.7);
      gr.addColorStop(0, 'rgba(60,255,180,0)'); gr.addColorStop(0.5, `rgba(${60 + i * 30},255,${170 - i * 10},0.25)`); gr.addColorStop(1, 'rgba(60,255,180,0)');
      g.fillStyle = gr; g.beginPath(); g.moveTo(0, h * 0.4);
      for (let x = 0; x <= w; x += 10) g.lineTo(x, h * (0.35 + i * 0.03) + Math.sin(x / 120 + i) * 40);
      g.lineTo(w, h * 0.8); g.lineTo(0, h * 0.8); g.fill();
    }
    hills(h * 0.85, 10, '#02080d', 6);
  }
  const url = c.toDataURL('image/jpeg', 0.86);
  cache.set(key, url);
  return url;
}

export const WALLPAPERS = [
  { id: 'bloom', name: 'Flor azul' },
  { id: 'bloomDark', name: 'Flor noturna' },
  { id: 'montanha', name: 'Montanhas' },
  { id: 'praia', name: 'Praia' },
  { id: 'sol', name: 'Pôr do sol' },
  { id: 'aurora', name: 'Aurora' },
];
