$(function () {

  let pct = 0;
  const tick = setInterval(() => {
    pct += Math.floor(Math.random() * 8) + 2;
    if (pct >= 100) {
      pct = 100;
      clearInterval(tick);
      setTimeout(launchApp, 400);
    }
    $('#pct').text(pct + '%');
    $('#loader').css('width', pct + '%');
  }, 80);

  function launchApp() {
    $('#opening').addClass('opening-fade-out');
    setTimeout(() => {
      $('#opening').remove();
      $('#app').addClass('visible');
    }, 700);
  }

  // ── STATE ──
  let currentInput = '0';
  let previousInput = '';
  let operator = null;
  let shouldReset = false;
  let history = [];

  const SYM = { '+': '+', '-': '−', '*': '×', '/': '÷' };

  // ── HELPERS ──
  function round(n) {
    return Math.round(n * 1e10) / 1e10;
  }

  function fmt(s) {
    if (s === 'Error') return 'Error';
    const f = parseFloat(s);
    if (isNaN(f)) return s;
    if (s.endsWith('.')) return s;
    const parts = s.split('.');
    return parseFloat(parts[0]).toLocaleString('id-ID') +
      (parts[1] !== undefined ? '.' + parts[1] : '');
  }

  // ── DISPLAY ──
  function updateDisplay(val) {
    $('#display').text(val).removeClass('pop');
    void $('#display')[0].offsetWidth;
    $('#display').addClass('pop');
  }

  // ── CORE LOGIC ──
  function inputNum(val) {
    if (shouldReset) {
      currentInput = val;
      shouldReset = false;
    } else {
      currentInput = (currentInput === '0') ? val : currentInput + val;
    }
    if (currentInput.replace('-', '').length > 14) currentInput = currentInput.slice(0, 14);
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
    $('#expr').text(fmt(previousInput) + ' ' + SYM[op]);
  }

  function calculate(final = true) {
    if (!operator || !previousInput) return;
    const a = parseFloat(previousInput);
    const b = parseFloat(currentInput);
    let result;
    switch (operator) {
      case '+': result = a + b; break;
      case '-': result = a - b; break;
      case '*': result = a * b; break;
      case '/': result = b === 0 ? 'Error' : a / b; break;
      default: return;
    }
    if (final) {
      $('#expr').text(fmt(previousInput) + ' ' + SYM[operator] + ' ' + fmt(String(b)) + ' =');
      addHistory(fmt(previousInput) + ' ' + SYM[operator] + ' ' + fmt(String(b)), result);
      operator = null;
    }
    currentInput = result === 'Error' ? 'Error' : String(round(result));
    shouldReset = true;
    updateDisplay(result === 'Error' ? 'Error' : fmt(currentInput));
  }

  function clearAll() {
    currentInput = '0';
    previousInput = '';
    operator = null;
    shouldReset = false;
    $('#expr').text('');
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

  // ── RIPPLE ──
  function rippleEffect(e, btn) {
    const r = $('<span class="ripple"></span>');
    const rect = btn.getBoundingClientRect();
    r.css({
      left: (e.clientX - rect.left - 40) + 'px',
      top:  (e.clientY - rect.top  - 40) + 'px'
    });
    $(btn).append(r);
    r.on('animationend', () => r.remove());
  }

  // ── BUTTON HANDLER (event delegation) ──
  $(document).on('click', '.btn', function (e) {
    rippleEffect(e, this);
    const a = $(this).data('action');
    if (a === 'num')     inputNum(String($(this).data('val')));
    if (a === 'decimal') inputDecimal();
    if (a === 'op')      setOp($(this).data('op'));
    if (a === 'equals')  calculate(true);
    if (a === 'clear')   clearAll();
    if (a === 'sign')    toggleSign();
    if (a === 'percent') percent();
  });

  // ── KEYBOARD ──
  $(document).on('keydown', function (e) {
    if ('0123456789'.includes(e.key)) inputNum(e.key);
    else if (e.key === '.')                    inputDecimal();
    else if (e.key === '+')                    setOp('+');
    else if (e.key === '-')                    setOp('-');
    else if (e.key === '*')                    setOp('*');
    else if (e.key === '/') { e.preventDefault(); setOp('/'); }
    else if (e.key === 'Enter' || e.key === '=') calculate(true);
    else if (e.key === 'Escape')               clearAll();
    else if (e.key === '%')                    percent();
    else if (e.key === 'Backspace') {
      if (!shouldReset && currentInput.length > 1) {
        currentInput = currentInput.slice(0, -1);
      } else {
        currentInput = '0';
      }
      updateDisplay(fmt(currentInput));
    }
  });

  // ── HISTORY ──
  function addHistory(expr, result) {
    if (result === 'Error') return;
    history.unshift({ expr, result: fmt(String(round(result))) });
    if (history.length > 20) history.pop();
    renderHistory();
  }

  function renderHistory() {
    const $list = $('#histList');
    if (history.length === 0) {
      $list.html('<div class="no-hist">Belum ada perhitungan.</div>');
      return;
    }
    $list.html(
      history.map((h, i) =>
        `<div class="hist-entry" data-idx="${i}">
          <span>${h.expr}</span>
          <span class="result">= ${h.result}</span>
        </div>`
      ).join('')
    );
    $('.hist-entry').on('click', function () {
      const h = history[$(this).data('idx')];
      currentInput = String(round(parseFloat(h.result.replace(/\./g, '').replace(',', '.'))));
      shouldReset = true;
      $('#expr').text('');
      updateDisplay(h.result);
    });
  }

  window.toggleHistory = function () {
    $('#histPanel').toggleClass('open');
  };

  $('#histToggle').on('click', function () {
    $('#histPanel').toggleClass('open');
  });

});