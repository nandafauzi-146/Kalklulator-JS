let pct = 0;
const pctEl = document.getElementById('pct');
const opening = document.getElementById('opening');
const app = document.getElementById('app');

const tick = setInterval(() => {
  pct += Math.floor(Math.random() * 8) + 2;
  if (pct >= 100) {
    pct = 100;
    clearInterval(tick);
    launchApp();
  }
  pctEl.textContent = pct + '%';
}, 80);

function launchApp() {
  setTimeout(() => {
    opening.classList.add('opening-fade-out');
    setTimeout(() => {
      opening.style.display = 'none';
      app.classList.add('visible');
    }, 700);
  }, 400);
}

// Kalkulator Logic
let currentInput = '0';
let previousInput = '';
let operator = null;
let shouldReset = false;
let history = [];

const displayEl = document.getElementById('display');
const exprEl = document.getElementById('expr');

function updateDisplay(val) {
  displayEl.textContent = val;
  displayEl.classList.remove('pop');
  void displayEl.offsetWidth;
  displayEl.classList.add('pop');
}

function inputNum(val) {
  if (shouldReset) {
    currentInput = val;
    shouldReset = false;
  } else {
    currentInput = (currentInput === '0' && val !== '.') ? val : currentInput + val;
  }
  if (currentInput.length > 14) currentInput = currentInput.slice(0, 14);
  updateDisplay(fmt(currentInput));
}

function inputDecimal() {
  if (shouldReset) {
    currentInput = '0.';
    shouldReset = false;
    updateDisplay('0.');
    return;
  }
  if (!currentInput.includes('.')) {
    currentInput += '.';
    updateDisplay(fmt(currentInput));
  }
}

function setOp(op) {
  if (operator && !shouldReset) calculate(false);
  previousInput = currentInput;
  operator = op;
  shouldReset = true;
  const sym = { '+': '+', '-': '−', '*': '×', '/': '÷' };
  exprEl.textContent = fmt(previousInput) + ' ' + sym[op];
}

function calculate(final = true) {
  if (!operator || !previousInput) return;
  const a = parseFloat(previousInput), b = parseFloat(currentInput);
  let result;
  switch (operator) {
    case '+': result = a + b; break;
    case '-': result = a - b; break;
    case '*': result = a * b; break;
    case '/': result = b === 0 ? 'Error' : a / b; break;
    default: return;
  }
  const sym = { '+': '+', '-': '−', '*': '×', '/': '÷' };
  if (final) {
    exprEl.textContent = fmt(previousInput) + ' ' + sym[operator] + ' ' + fmt(String(b)) + ' =';
    addHistory(fmt(previousInput) + ' ' + sym[operator] + ' ' + fmt(String(b)), result);
    operator = null;
  }
  currentInput = (result === 'Error') ? 'Error' : String(round(result));
  shouldReset = true;
  updateDisplay(result === 'Error' ? 'Error' : fmt(currentInput));
}

function clearAll() {
  currentInput = '0';
  previousInput = '';
  operator = null;
  shouldReset = false;
  exprEl.textContent = '';
  updateDisplay('0');
}

function toggleSign() {
  if (currentInput === '0' || currentInput === 'Error') return;
  currentInput = String(-parseFloat(currentInput));
  updateDisplay(fmt(currentInput));
}

function percent() {
  if (currentInput === 'Error') return;
  currentInput = String(parseFloat(currentInput) / 100);
  updateDisplay(fmt(currentInput));
}

function round(n) {
  return Math.round(n * 1e10) / 1e10;
}

function fmt(s) {
  if (s === 'Error') return 'Error';
  const f = parseFloat(s);
  if (isNaN(f)) return s;
  if (s.endsWith('.')) return s;
  const parts = s.split('.');
  return parseFloat(parts[0]).toLocaleString('id-ID') + (parts[1] !== undefined ? '.' + parts[1] : '');
}

document.querySelectorAll('.btn').forEach(btn => {
  btn.addEventListener('click', e => {
    rippleEffect(e, btn);
    const a = btn.dataset.action;
    if (a === 'num') inputNum(btn.dataset.val);
    else if (a === 'decimal') inputDecimal();
    else if (a === 'op') setOp(btn.dataset.op);
    else if (a === 'equals') calculate(true);
    else if (a === 'clear') clearAll();
    else if (a === 'sign') toggleSign();
    else if (a === 'percent') percent();
  });
});

function rippleEffect(e, btn) {
  const r = document.createElement('span');
  r.classList.add('ripple');
  const rect = btn.getBoundingClientRect();
  r.style.left = (e.clientX - rect.left - 40) + 'px';
  r.style.top = (e.clientY - rect.top - 40) + 'px';
  btn.appendChild(r);
  r.addEventListener('animationend', () => r.remove());
}

document.addEventListener('keydown', e => {
  if ('0123456789'.includes(e.key)) inputNum(e.key);
  else if (e.key === '.') inputDecimal();
  else if (e.key === '+') setOp('+');
  else if (e.key === '-') setOp('-');
  else if (e.key === '*') setOp('*');
  else if (e.key === '/') { e.preventDefault(); setOp('/'); }
  else if (e.key === 'Enter' || e.key === '=') calculate(true);
  else if (e.key === 'Backspace') {
    if (currentInput.length > 1 && !shouldReset) {
      currentInput = currentInput.slice(0, -1);
      updateDisplay(fmt(currentInput));
    } else {
      currentInput = '0';
      updateDisplay('0');
    }
  }
  else if (e.key === 'Escape') clearAll();
  else if (e.key === '%') percent();
});

function addHistory(expr, result) {
  if (result === 'Error') return;
  history.unshift({ expr, result: fmt(String(round(result))) });
  if (history.length > 20) history.pop();
  renderHistory();
}

function renderHistory() {
  const list = document.getElementById('histList');
  if (history.length === 0) {
    list.innerHTML = '<div class="no-hist">Belum ada perhitungan.</div>';
    return;
  }
  list.innerHTML = history.map((h, i) =>
    `<div class="hist-entry" onclick="recallHistory(${i})">
      <span>${h.expr}</span>
      <span class="result">= ${h.result}</span>
     </div>`
  ).join('');
}

function recallHistory(i) {
  currentInput = String(round(parseFloat(history[i].result.replace(/\./g, '').replace(',', '.'))));
  shouldReset = true;
  exprEl.textContent = '';
  updateDisplay(history[i].result);
}

function toggleHistory() {
  const panel = document.getElementById('histPanel');
  panel.classList.toggle('open');
}
