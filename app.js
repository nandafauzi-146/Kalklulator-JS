let pct = 0;
const pctEl = $('#pct');
const opening = $('#opening');
const app = $('#app');

const tick = setInterval(() => {
  pct += Math.floor(Math.random() * 8) + 2;
  if (pct >= 100) {
    pct = 100;
    clearInterval(tick);
    launchApp();
  }
  pctEl.text(pct + '%');
}, 80);

function launchApp() {
  setTimeout(() => {
    opening.addClass('opening-fade-out');
    setTimeout(() => {
      opening.css('display', 'none');
      app.addClass('visible');
    }, 700);
  }, 400);
}

// Kalkulator Logic

let currentInput = '0';
let previousInput = '';
let operator = null;
let shouldReset = false;
let history = [];

const displayEl = $('#display');
const exprEl = $('#expr');

function updateDisplay(val) {
  displayEl.text(val);
  displayEl.removeClass('pop');
  void displayEl[0].offsetWidth;
  displayEl.addClass('pop');
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
  exprEl.text(fmt(previousInput) + ' ' + sym[op]);
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
    exprEl.text(fmt(previousInput) + ' ' + sym[operator] + ' ' + fmt(String(b)) + ' =');
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
  exprEl.text('');
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


$('.btn').on('click', function(e) {
  rippleEffect(e, this);
  const a = $(this).data('action');
  if (a === 'num') inputNum($(this).data('val'));
  else if (a === 'decimal') inputDecimal();
  else if (a === 'op') setOp($(this).data('op'));
  else if (a === 'equals') calculate(true);
  else if (a === 'clear') clearAll();
  else if (a === 'sign') toggleSign();
  else if (a === 'percent') percent();
});

function rippleEffect(e, btn) {
  const r = $('<span class="ripple"></span>');
  const rect = btn.getBoundingClientRect();
  r.css({
    left: (e.clientX - rect.left - 40) + 'px',
    top: (e.clientY - rect.top - 40) + 'px'
  });
  $(btn).append(r);
  r.on('animationend', () => r.remove());
}

$(document).on('keydown', function(e) {
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
  const list = $('#histList');
  if (history.length === 0) {
    list.html('<div class="no-hist">Belum ada perhitungan.</div>');
    return;
  }
  list.html(history.map((h, i) =>
    `<div class="hist-entry" data-idx="${i}">
      <span>${h.expr}</span>
      <span class="result">= ${h.result}</span>
     </div>`
  ).join(''));
  $('.hist-entry').on('click', function() {
    recallHistory($(this).data('idx'));
  });
}

function recallHistory(i) {
  currentInput = String(round(parseFloat(history[i].result.replace(/\./g, '').replace(',', '.'))));
  shouldReset = true;
  exprEl.text('');
  updateDisplay(history[i].result);
}

function toggleHistory() {
  const panel = $('#histPanel');
  panel.toggleClass('open');
}
