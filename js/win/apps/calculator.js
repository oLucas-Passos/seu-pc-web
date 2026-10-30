// Calculadora (modo padrão).
export default {
  id: 'calculator', name: 'Calculadora', icon: 'calculator', width: 340, height: 520, single: true, keywords: 'contas calcular somar',
  open(ctx) {
    const { os, body } = ctx;
    body.classList.add('calc');
    let cur = '0', acc = null, op = null, fresh = true, expr = '', memory = 0;
    const fmt = (v) => {
      if (!isFinite(v)) return 'Não é possível dividir por zero';
      const s = Number(v.toPrecision(12)).toString();
      return s.replace('.', ',');
    };
    const num = () => parseFloat(cur.replace(',', '.'));
    const SYM = { '+': '+', '-': '−', '*': '×', '/': '÷' };
    body.innerHTML = `<div class="calc-head"><b>Padrão</b><span class="calc-mem"></span></div>
      <div class="calc-expr"></div><div class="calc-disp" data-tut="calc-display">0</div>
      <div class="calc-keys">${[
        ['%', 'pct'], ['CE', 'ce'], ['C', 'c'], ['⌫', 'bs'],
        ['¹⁄ₓ', 'inv'], ['x²', 'sq'], ['²√x', 'sqrt'], ['÷', '/'],
        ['7', '7'], ['8', '8'], ['9', '9'], ['×', '*'],
        ['4', '4'], ['5', '5'], ['6', '6'], ['−', '-'],
        ['1', '1'], ['2', '2'], ['3', '3'], ['+', '+'],
        ['+/−', 'neg'], ['0', '0'], [',', 'dot'], ['=', 'eq'],
      ].map(([l, k]) => `<button class="calc-k${/^\d$/.test(k) ? ' d' : ''}${k === 'eq' ? ' eq' : ''}" data-k="${k}" data-tut="calc-${k === '/' ? 'div' : k === '*' ? 'mul' : k === '-' ? 'sub' : k === '+' ? 'add' : k}">${l}</button>`).join('')}</div>`;
    const disp = body.querySelector('.calc-disp'), exEl = body.querySelector('.calc-expr');
    const show = () => {
      disp.textContent = cur;
      disp.style.fontSize = cur.length > 12 ? '26px' : cur.length > 9 ? '34px' : '44px';
      exEl.textContent = expr;
      body.querySelector('.calc-mem').textContent = memory ? 'M' : '';
    };
    const compute = (a, b, o) => o === '+' ? a + b : o === '-' ? a - b : o === '*' ? a * b : o === '/' ? (b === 0 ? Infinity : a / b) : b;
    function press(k) {
      if (/^\d$/.test(k)) { cur = fresh || cur === '0' ? k : (cur.length < 16 ? cur + k : cur); fresh = false; }
      else if (k === 'dot') { if (fresh) { cur = '0,'; fresh = false; } else if (!cur.includes(',')) cur += ','; }
      else if (k === 'bs') { if (!fresh) cur = cur.length > 1 ? cur.slice(0, -1) : '0'; }
      else if (k === 'ce') { cur = '0'; fresh = true; }
      else if (k === 'c') { cur = '0'; acc = null; op = null; expr = ''; fresh = true; }
      else if (k === 'neg') { if (cur !== '0') cur = cur.startsWith('-') ? cur.slice(1) : '-' + cur; }
      else if (k === 'pct') { cur = fmt(acc != null ? acc * num() / 100 : num() / 100); fresh = true; }
      else if (k === 'inv') { expr = `1/(${cur})`; cur = fmt(1 / num()); fresh = true; }
      else if (k === 'sq') { expr = `sqr(${cur})`; cur = fmt(num() * num()); fresh = true; }
      else if (k === 'sqrt') { expr = `√(${cur})`; cur = num() < 0 ? 'Entrada inválida' : fmt(Math.sqrt(num())); fresh = true; }
      else if ('+-*/'.includes(k)) {
        if (op && !fresh) acc = compute(acc, num(), op);
        else if (acc == null || !op) acc = num();
        op = k; fresh = true;
        cur = fmt(acc);
        expr = `${fmt(acc)} ${SYM[k]}`;
      } else if (k === 'eq') {
        if (op == null) return show();
        const b = num();
        const a = acc;
        const r = compute(a, b, op);
        expr = `${fmt(a)} ${SYM[op]} ${fmt(b)} =`;
        cur = fmt(r);
        os.emit('calc:result', { a, b, op, value: r });
        acc = null; op = null; fresh = true;
      }
      show();
    }
    body.querySelectorAll('[data-k]').forEach(b => { b.onclick = () => press(b.dataset.k); });
    show();
    return {
      onKey(e, typing) {
        if (typing) return false;
        const map = { Enter: 'eq', '=': 'eq', Backspace: 'bs', Escape: 'c', Delete: 'ce', ',': 'dot', '.': 'dot', '%': 'pct' };
        const k = /^[0-9]$/.test(e.key) ? e.key : '+-*/'.includes(e.key) ? e.key : map[e.key];
        if (!k) return false;
        press(k);
        const btn = body.querySelector(`[data-k="${CSS.escape(k)}"]`);
        if (btn) { btn.classList.add('press'); setTimeout(() => btn.classList.remove('press'), 120); }
        return true;
      },
    };
  },
};
