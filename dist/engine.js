/* A small expression parser. Expressions are never executed as JavaScript. */
(function (root) {
  'use strict';
  const functions = new Set(['sin', 'cos', 'tan', 'asin', 'acos', 'atan', 'sqrt', 'ln', 'log', 'abs', 'exp']);
  function evaluate(expression, angle = 'DEG', answer = 0) {
    const input = expression.replace(/×/g, '*').replace(/÷/g, '/').replace(/−/g, '-').replace(/π/g, 'pi');
    if (input.length > 500) throw new Error('Calculation is too long');
    const tokens = [];
    let pos = 0;
    while (pos < input.length) {
      if (/\s/.test(input[pos])) { pos++; continue; }
      const number = input.slice(pos).match(/^(?:\d+\.?\d*|\.\d+)(?:[eE][+-]?\d+)?/);
      if (number) { tokens.push({ type: 'number', value: Number(number[0]) }); pos += number[0].length; continue; }
      const name = input.slice(pos).match(/^(?:asin|acos|atan|sqrt|sin|cos|tan|log|ln|abs|exp|ans|pi|e)/i);
      if (name) { tokens.push({ type: 'name', value: name[0].toLowerCase() }); pos += name[0].length; continue; }
      if ('+-*/^()%!'.includes(input[pos])) { tokens.push({ type: input[pos], value: input[pos++] }); continue; }
      throw new Error('Unknown symbol or function');
    }
    if (!tokens.length) return 0;
    // Adjacent values, constants and groups imply multiplication: 2π, 2(3), (2)(3).
    const expanded = [];
    for (const token of tokens) {
      const previous = expanded[expanded.length - 1];
      if (previous?.type === 'number' && token.type === 'number') throw new Error('Check the decimal point or add an operator');
      const endsValue = previous && (previous.type === 'number' || [')', '!', '%'].includes(previous.type) || (previous.type === 'name' && !functions.has(previous.value)));
      const startsValue = token.type === 'number' || token.type === 'name' || token.type === '(';
      if (endsValue && startsValue) expanded.push({ type: '*' });
      expanded.push(token);
    }
    let index = 0;
    const peek = () => expanded[index]?.type;
    const finite = value => { if (!Number.isFinite(value)) throw new Error('Result is outside the real-number range'); return value; };
    function call(name, value) {
      const radians = angle === 'DEG' ? value * Math.PI / 180 : value;
      const fromRadians = value => angle === 'DEG' ? value * 180 / Math.PI : value;
      switch (name) {
        case 'sin': return Math.sin(radians);
        case 'cos': return Math.cos(radians);
        case 'tan':
          if (Math.abs(Math.cos(radians)) < 1e-14) throw new Error('Tangent is undefined at this angle');
          return Math.tan(radians);
        case 'asin': case 'acos':
          if (Math.abs(value) > 1) throw new Error('Inverse sine and cosine need a value from −1 to 1');
          return fromRadians(name === 'asin' ? Math.asin(value) : Math.acos(value));
        case 'atan': return fromRadians(Math.atan(value));
        case 'sqrt': if (value < 0) throw new Error('Square root needs a non-negative value'); return Math.sqrt(value);
        case 'ln': case 'log': if (value <= 0) throw new Error('Logarithms need a positive value'); return name === 'ln' ? Math.log(value) : Math.log10(value);
        case 'abs': return Math.abs(value);
        case 'exp': return Math.exp(value);
      }
    }
    function prefix() {
      const token = expanded[index++];
      if (!token) throw new Error('Complete the expression');
      if (token.type === 'number') return finite(token.value);
      if (token.type === '+' || token.type === '-') return (token.type === '-' ? -1 : 1) * parse(25);
      if (token.type === '(') {
        const result = parse(0);
        if (peek() !== ')') throw new Error('Add a closing parenthesis');
        index++; return result;
      }
      if (token.type === 'name') {
        if (token.value === 'pi') return Math.PI;
        if (token.value === 'e') return Math.E;
        if (token.value === 'ans') return finite(answer);
        if (peek() !== '(') throw new Error('Add parentheses after the function');
        index++; const value = parse(0);
        if (peek() !== ')') throw new Error('Add a closing parenthesis');
        index++; return finite(call(token.value, value));
      }
      throw new Error('Check the expression');
    }
    function parse(minimum) {
      let left = prefix();
      while (index < expanded.length) {
        const operator = peek();
        if (operator === '!' || operator === '%') {
          if (40 < minimum) break;
          index++;
          if (operator === '%') left /= 100;
          else {
            if (!Number.isInteger(left) || left < 0) throw new Error('Factorial needs a non-negative integer');
            if (left > 170) throw new Error('Factorial supports values up to 170');
            let result = 1;
            for (let n = 2; n <= left; n++) result *= n;
            left = result;
          }
          continue;
        }
        const power = { '+': 10, '-': 10, '*': 20, '/': 20, '^': 30 }[operator];
        if (power === undefined || power < minimum) break;
        index++;
        const right = parse(operator === '^' ? power : power + 1);
        switch (operator) {
          case '+': left += right; break;
          case '-': left -= right; break;
          case '*': left *= right; break;
          case '/': if (right === 0) throw new Error('Cannot divide by zero'); left /= right; break;
          case '^': left = Math.pow(left, right); break;
        }
        finite(left);
      }
      return finite(left);
    }
    const value = parse(0);
    if (index !== expanded.length) throw new Error('Check the parentheses and operators');
    return Object.is(value, -0) ? 0 : value;
  }
  function format(value) {
    if (Object.is(value, -0) || value === 0) return '0';
    // Keep 12 significant digits for a readable display, retaining precision internally.
    return String(Number(value.toPrecision(12)));
  }
  root.CalculatorEngine = { evaluate, format };
  if (typeof module !== 'undefined' && module.exports) module.exports = root.CalculatorEngine;
})(typeof window !== 'undefined' ? window : globalThis);
