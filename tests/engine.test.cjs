const assert = require('node:assert/strict');
const { evaluate, format } = require('../dist/engine.js');
const cases = [
  ['2+3*4', 14], ['(2+3)*4', 20], ['8/4/2', 1], ['2^3^2', 512],
  ['-2^2', -4], ['(-2)^2', 4], ['2^-3', .125], ['2(3+4)', 14],
  ['2pi', 2*Math.PI], ['(2)(3)', 6], ['3!2', 12], ['0!', 1], ['5!', 120],
  ['50%', .5], ['200*10%', 20], ['sin(30)', .5], ['cos(60)', .5],
  ['tan(45)', 1], ['asin(0.5)', 30], ['acos(0.5)', 60], ['atan(1)', 45],
  ['sqrt(144)+2^3', 20], ['ln(e)', 1], ['log(1000)', 3], ['exp(1)', Math.E],
  ['abs(-12)', 12], ['1e-7+2e-7', 3e-7], ['2e', 2*Math.E], ['π×2', 2*Math.PI],
];
for (const [expression, expected] of cases) {
  const result = evaluate(expression);
  assert.ok(Math.abs(result - expected) < 1e-12*Math.max(1, Math.abs(expected)), `${expression}: ${result} != ${expected}`);
}
assert.ok(Math.abs(evaluate('sin(pi/2)', 'RAD')-1) < 1e-12);
assert.ok(Math.abs(evaluate('asin(1)', 'RAD')-Math.PI/2) < 1e-12);
assert.equal(evaluate('ans*2', 'DEG', 42), 84);
assert.equal(format(evaluate('0.1+0.2')), '0.3');
for (const expression of ['1/0', 'sqrt(-1)', 'log(0)', 'ln(-1)', 'asin(2)', 'acos(-2)', 'tan(90)', '171!', '2.5!', '(-1)!', '2+', '(2+3', '2+3)', 'alert(1)', '2**3', 'exp(1000)', '2..3']) {
  assert.throws(() => evaluate(expression), undefined, expression);
}
console.log('All arithmetic, scientific, precision, and invalid-input checks passed.');
