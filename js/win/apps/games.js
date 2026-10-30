// Jogos instaláveis pela Loja: Campo Minado, Jogo da Velha e Cobrinha.
import { lico } from '../icons.js';

export const minesweeper = {
  id: 'minesweeper', name: 'Campo Minado', icon: 'minesweeper', width: 420, height: 520, store: true, keywords: 'jogo minas',
  open(ctx) {
    const { os, body } = ctx;
    const N = 9, MINES = 10;
    let grid, over, revealed, flags, time, timer, started;
    body.classList.add('ms');
    function reset() {
      grid = Array.from({ length: N * N }, () => ({ mine: false, n: 0, open: false, flag: false }));
      over = false; revealed = 0; flags = 0; time = 0; started = false;
      clearInterval(timer);
      render();
    }
    function plant(safe) {
      let placed = 0;
      while (placed < MINES) {
        const i = Math.floor(Math.random() * N * N);
        if (grid[i].mine || i === safe) continue;
        grid[i].mine = true; placed++;
      }
      grid.forEach((c, i) => { c.n = nbrs(i).filter(j => grid[j].mine).length; });
    }
    function nbrs(i) {
      const x = i % N, y = Math.floor(i / N), out = [];
      for (let dy = -1; dy <= 1; dy++) for (let dx = -1; dx <= 1; dx++) {
        if (!dx && !dy) continue;
        const nx = x + dx, ny = y + dy;
        if (nx >= 0 && ny >= 0 && nx < N && ny < N) out.push(ny * N + nx);
      }
      return out;
    }
    function open(i) {
      const c = grid[i];
      if (c.open || c.flag || over) return;
      if (!started) { started = true; plant(i); timer = setInterval(() => { time++; const t = body.querySelector('.ms-time'); if (t) t.textContent = String(time).padStart(3, '0'); }, 1000); os.emit('game:start', { app: 'minesweeper' }); }
      c.open = true; revealed++;
      if (c.mine) { over = 'lose'; clearInterval(timer); grid.forEach(g => { if (g.mine) g.open = true; }); render(); os.emit('game:lose', { app: 'minesweeper' }); return; }
      if (!c.n) nbrs(i).forEach(open);
      if (revealed === N * N - MINES) { over = 'win'; clearInterval(timer); os.emit('game:win', { app: 'minesweeper' }); }
    }
    function render() {
      const face = over === 'lose' ? '😵' : over === 'win' ? '😎' : '🙂';
      body.innerHTML = `<div class="ms-top"><span class="ms-cnt">${String(MINES - flags).padStart(3, '0')}</span><button class="ms-face" title="Novo jogo">${face}</button><span class="ms-cnt ms-time">${String(time).padStart(3, '0')}</span></div>
        <div class="ms-grid">${grid.map((c, i) => `<button class="ms-c${c.open ? ' o' : ''}${c.open && c.mine ? ' boom' : ''}" data-i="${i}" ${c.open && c.n && !c.mine ? `data-n="${c.n}"` : ''}>${c.flag && !c.open ? '🚩' : c.open ? (c.mine ? '💣' : c.n || '') : ''}</button>`).join('')}</div>
        <p class="ms-help">Clique para abrir · botão direito para marcar uma mina com bandeira</p>${over ? `<p class="ms-msg">${over === 'win' ? 'Você venceu!' : 'Boom! Tente de novo.'}</p>` : ''}`;
      body.querySelector('.ms-face').onclick = reset;
      body.querySelectorAll('[data-i]').forEach(b => {
        b.onclick = () => { open(+b.dataset.i); render(); };
        b.oncontextmenu = (e) => { e.preventDefault(); e.stopPropagation(); const c = grid[+b.dataset.i]; if (c.open || over) return; c.flag = !c.flag; flags += c.flag ? 1 : -1; render(); };
      });
    }
    reset();
    return { onDestroy() { clearInterval(timer); } };
  },
};

export const tictactoe = {
  id: 'tictactoe', name: 'Jogo da Velha', icon: 'tictactoe', width: 400, height: 500, store: true, keywords: 'jogo velha',
  open(ctx) {
    const { os, body } = ctx;
    let b, over, score = { voce: 0, pc: 0, velha: 0 };
    body.classList.add('ttt');
    const LINES = [[0, 1, 2], [3, 4, 5], [6, 7, 8], [0, 3, 6], [1, 4, 7], [2, 5, 8], [0, 4, 8], [2, 4, 6]];
    const winner = (s) => { for (const [a, c, d] of LINES) if (s[a] && s[a] === s[c] && s[a] === s[d]) return s[a]; return s.every(Boolean) ? 'velha' : null; };
    function reset() { b = Array(9).fill(null); over = null; render(); }
    function pcMove() {
      const free = b.map((v, i) => (v ? null : i)).filter(v => v != null);
      const tryWin = (mark) => free.find(i => { const t = b.slice(); t[i] = mark; return winner(t) === mark; });
      let m = tryWin('O');
      if (m == null) m = tryWin('X');
      if (m == null && !b[4]) m = 4;
      if (m == null) m = free[Math.floor(Math.random() * free.length)];
      if (m != null) b[m] = 'O';
    }
    function play(i) {
      if (b[i] || over) return;
      b[i] = 'X';
      over = winner(b);
      if (!over) { pcMove(); over = winner(b); }
      if (over) {
        score[over === 'X' ? 'voce' : over === 'O' ? 'pc' : 'velha']++;
        os.emit(over === 'X' ? 'game:win' : 'game:end', { app: 'tictactoe', result: over });
      }
      render();
    }
    function render() {
      body.innerHTML = `<div class="ttt-score"><span>Você (X): <b>${score.voce}</b></span><span>Velha: <b>${score.velha}</b></span><span>Computador (O): <b>${score.pc}</b></span></div>
        <div class="ttt-grid">${b.map((v, i) => `<button data-i="${i}" class="${v || ''}">${v || ''}</button>`).join('')}</div>
        <p class="ttt-msg">${over ? (over === 'X' ? 'Você venceu!' : over === 'O' ? 'O computador venceu.' : 'Deu velha!') : 'Sua vez: clique num quadrado.'}</p>
        <button class="w-btn primary" data-new>Nova partida</button>`;
      body.querySelectorAll('[data-i]').forEach(x => { x.onclick = () => play(+x.dataset.i); });
      body.querySelector('[data-new]').onclick = reset;
    }
    reset();
  },
};

export const snake = {
  id: 'snake', name: 'Cobrinha', icon: 'snake', width: 460, height: 560, store: true, keywords: 'jogo cobra snake',
  open(ctx) {
    const { os, body } = ctx;
    const N = 18, S = 22;
    let sn, dir, next, food, timer, score = 0, best = 0, state = 'ready';
    body.classList.add('snk');
    body.innerHTML = `<div class="snk-top"><span>Pontos: <b data-s>0</b></span><span>Recorde: <b data-b>0</b></span></div><canvas width="${N * S}" height="${N * S}" tabindex="0"></canvas>
      <div class="snk-pad"><button data-d="up">${lico('chevU', 22)}</button><button data-d="left">${lico('back', 22)}</button><button data-d="down">${lico('chevD', 22)}</button><button data-d="right">${lico('fwd', 22)}</button></div><p class="snk-help">Use as setas do teclado ou os botões.</p>`;
    const cv = body.querySelector('canvas'), g = cv.getContext('2d');
    function reset() { sn = [[8, 9], [7, 9], [6, 9]]; dir = [1, 0]; next = [1, 0]; score = 0; placeFood(); state = 'ready'; draw(); }
    function placeFood() { do { food = [Math.floor(Math.random() * N), Math.floor(Math.random() * N)]; } while (sn.some(([x, y]) => x === food[0] && y === food[1])); }
    function start() { if (state === 'run') return; if (state === 'over') reset(); state = 'run'; clearInterval(timer); timer = setInterval(step, 130); os.emit('game:start', { app: 'snake' }); }
    function step() {
      dir = next;
      const h = [sn[0][0] + dir[0], sn[0][1] + dir[1]];
      if (h[0] < 0 || h[1] < 0 || h[0] >= N || h[1] >= N || sn.some(([x, y]) => x === h[0] && y === h[1])) { state = 'over'; clearInterval(timer); best = Math.max(best, score); draw(); os.emit('game:end', { app: 'snake', score }); return; }
      sn.unshift(h);
      if (h[0] === food[0] && h[1] === food[1]) { score++; placeFood(); if (score === 5) os.emit('game:win', { app: 'snake', score }); } else sn.pop();
      draw();
    }
    function draw() {
      g.fillStyle = '#10261a'; g.fillRect(0, 0, cv.width, cv.height);
      g.fillStyle = '#ff5252'; g.beginPath(); g.arc(food[0] * S + S / 2, food[1] * S + S / 2, S / 2.6, 0, Math.PI * 2); g.fill();
      sn.forEach(([x, y], i) => { g.fillStyle = i ? '#4cd36b' : '#8af59f'; g.fillRect(x * S + 1, y * S + 1, S - 2, S - 2); });
      if (state !== 'run') {
        g.fillStyle = 'rgba(0,0,0,.55)'; g.fillRect(0, 0, cv.width, cv.height);
        g.fillStyle = '#fff'; g.font = 'bold 22px Segoe UI, Arial'; g.textAlign = 'center';
        g.fillText(state === 'over' ? `Fim de jogo! ${score} pontos` : 'Clique ou aperte uma seta para começar', cv.width / 2, cv.height / 2);
      }
      body.querySelector('[data-s]').textContent = score;
      body.querySelector('[data-b]').textContent = best;
    }
    const turn = (d) => {
      const m = { up: [0, -1], down: [0, 1], left: [-1, 0], right: [1, 0] }[d];
      if (m[0] === -dir[0] && m[1] === -dir[1]) return;
      next = m;
      start();
    };
    body.querySelectorAll('[data-d]').forEach(b => { b.onclick = () => turn(b.dataset.d); });
    cv.onclick = () => { cv.focus(); start(); };
    reset();
    return {
      onKey(e) {
        const d = { ArrowUp: 'up', ArrowDown: 'down', ArrowLeft: 'left', ArrowRight: 'right' }[e.key];
        if (!d) return false;
        turn(d);
        return true;
      },
      onDestroy() { clearInterval(timer); },
    };
  },
};
