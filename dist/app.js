(() => {
  'use strict';
  const $ = id => document.getElementById(id);
  const { evaluate, format } = window.CalculatorEngine;
  const STORAGE_KEY = 'orbit-calculator-history-v1';
  let expression = '', angle = 'DEG', answer = 0, solved = false, error = false;
  let history = [];
  try {
    const stored = JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]');
    if (Array.isArray(stored)) history = stored.filter(item => typeof item.expression === 'string' && item.expression.length <= 500 && Number.isFinite(item.value) && ['DEG', 'RAD'].includes(item.angle)).slice(0, 20);
  } catch { /* The calculator still works when local storage is unavailable. */ }
  const pretty = text => text.replace(/sqrt\(/g, '√(').replace(/pi/g, 'π').replace(/\*/g, '×').replace(/\//g, '÷').replace(/-/g, '−');
  function persistHistory() {
    try { localStorage.setItem(STORAGE_KEY, JSON.stringify(history)); } catch { /* Optional persistence. */ }
  }
  function setResult(value, isError = false) {
    $('result').textContent = value;
    $('result').classList.toggle('error', isError);
    $('result').classList.toggle('small', value.length > 15);
    $('result').scrollLeft = $('result').scrollWidth;
  }
  function render() {
    $('expression').textContent = expression ? pretty(expression) + (solved ? ' =' : '') : '\u00a0';
    $('expression').scrollLeft = $('expression').scrollWidth;
    $('display-label').textContent = solved ? 'THERE’S YOUR ANSWER' : 'LET’S WORK IT OUT';
    $('status').textContent = expression ? (solved ? 'Click a number to start fresh' : 'Enter to calculate') : 'Ready when you are';
    $('angle-label').textContent = angle === 'DEG' ? 'DEGREES' : 'RADIANS';
    if (!expression) { setResult('0'); return; }
    try {
      const result = solved ? answer : evaluate(expression, angle, answer);
      setResult(format(result));
    } catch { if (!error) setResult('…'); }
  }
  function insert(value) {
    if (expression.length + value.length > 500) { $('status').textContent = 'Maximum expression length reached'; return; }
    if (solved) {
      // Operators continue from the exact previous answer; a new value starts fresh.
      expression = /^[+*/^%!]/.test(value) || value === '-' ? '(' + String(answer) + ')' : '';
    }
    solved = false; error = false;
    expression += value;
    render();
  }
  function calculate() {
    if (!expression || solved) return;
    try {
      const value = evaluate(expression, angle, answer);
      history.unshift({ expression, value, angle });
      history = history.slice(0, 20);
      answer = value; solved = true; error = false;
      persistHistory(); renderHistory(); render();
    } catch (err) {
      error = true; setResult('Check calculation', true);
      $('status').textContent = err.message;
      $('display-label').textContent = 'A LITTLE ADJUSTMENT';
    }
  }
  function action(name) {
    if (name === 'equals') { calculate(); return; }
    error = false;
    if (name === 'clear') { expression = ''; solved = false; }
    if (name === 'backspace') { expression = expression.slice(0, -1); solved = false; }
    if (name === 'negate') {
      if (solved) expression = String(-answer);
      else if (expression.startsWith('-(') && expression.endsWith(')')) expression = expression.slice(2, -1);
      else expression = expression ? '-(' + expression + ')' : '-';
      solved = false;
    }
    render();
  }
  function renderHistory() {
    const list = $('history-list');
    list.replaceChildren();
    $('clear-history').disabled = history.length === 0;
    if (!history.length) {
      const empty = document.createElement('div');
      empty.className = 'empty-history';
      empty.innerHTML = '<div class="empty-orbit" aria-hidden="true">+</div><h3>A fresh start.</h3><p>Your calculations will land here.<br>Go on, give it a spin.</p>';
      list.append(empty);
      return;
    }
    for (const item of history) {
      const button = document.createElement('button');
      button.className = 'history-item';
      button.title = 'Reuse this result';
      const equation = document.createElement('span');
      equation.className = 'history-expression'; equation.textContent = pretty(item.expression) + ' =';
      const value = document.createElement('span');
      value.className = 'history-result'; value.textContent = format(item.value);
      const unit = document.createElement('span');
      unit.className = 'history-unit'; unit.textContent = item.angle;
      button.append(equation, unit, value);
      button.addEventListener('click', () => {
        if (solved || !expression) expression = String(item.value);
        else expression += '(' + String(item.value) + ')';
        solved = false; error = false; render();
      });
      list.append(button);
    }
  }
  $('keypad').addEventListener('click', event => {
    const button = event.target.closest('button');
    if (!button) return;
    if (button.dataset.insert !== undefined) insert(button.dataset.insert);
    else action(button.dataset.action);
  });
  document.querySelectorAll('[data-angle]').forEach(button => button.addEventListener('click', () => {
    angle = button.dataset.angle;
    document.querySelectorAll('[data-angle]').forEach(option => {
      const active = option.dataset.angle === angle;
      option.classList.toggle('active', active); option.setAttribute('aria-pressed', String(active));
    });
    error = false;
    // Keep completed calculations consistent with the angle used to solve them.
    if (solved) { expression = String(answer); solved = false; }
    render();
  }));
  function setMode(scientific) {
    $('scientific-keys').hidden = !scientific;
    document.querySelector('.calculator').classList.toggle('standard', !scientific);
    for (const [id, active] of [['scientific-mode', scientific], ['standard-mode', !scientific]]) {
      $(id).classList.toggle('active', active); $(id).setAttribute('aria-pressed', String(active));
    }
  }
  $('scientific-mode').addEventListener('click', () => setMode(true));
  $('standard-mode').addEventListener('click', () => setMode(false));
  $('clear-history').addEventListener('click', () => { history = []; persistHistory(); renderHistory(); });
  $('copy-button').addEventListener('click', async () => {
    try {
      const value = solved ? answer : evaluate(expression || '0', angle, answer);
      await navigator.clipboard.writeText(format(value));
      $('copy-label').textContent = 'Copied!';
    } catch { $('copy-label').textContent = 'Unavailable'; }
    setTimeout(() => { $('copy-label').textContent = 'Copy'; }, 1600);
  });
  const dialog = $('help-dialog');
  for (const id of ['help-button', 'shortcuts-button']) $(id).addEventListener('click', () => dialog.showModal());
  $('close-help').addEventListener('click', () => dialog.close());
  dialog.addEventListener('click', event => { if (event.target === dialog) { const box = dialog.getBoundingClientRect(); if (event.clientX < box.left || event.clientX > box.right || event.clientY < box.top || event.clientY > box.bottom) dialog.close(); } });
  document.addEventListener('keydown', event => {
    if (dialog.open || event.ctrlKey || event.metaKey || event.altKey || event.target.isContentEditable || ['INPUT', 'TEXTAREA', 'SELECT'].includes(event.target.tagName)) return;
    if (event.key === 'Enter' && event.target.tagName === 'BUTTON') return;
    if (event.key === 'Enter' || event.key === '=') { event.preventDefault(); calculate(); }
    else if (event.key === 'Escape' || event.key === 'Delete') { event.preventDefault(); action('clear'); }
    else if (event.key === 'Backspace') { event.preventDefault(); action('backspace'); }
    else if (/^[0-9.+\-*/^()%!a-z]$/i.test(event.key)) { event.preventDefault(); insert(event.key.toLowerCase()); }
  });
  renderHistory(); render();
})();
