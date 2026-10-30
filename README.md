# Orbit — Scientific Calculator

A responsive calculator built with plain HTML, CSS, and JavaScript. Open `dist/index.html` in a browser; no installation or build is required. For clipboard support, serve the folder on localhost or HTTPS.

## Features

- Standard arithmetic with operator precedence and parentheses
- Sine, cosine, tangent and their inverses in degrees or radians
- Natural and base-ten logarithms, powers, square roots, factorials, exponentials, absolute values, π, and e
- Live previews, keyboard input, copy result, and a standard/scientific mode switch
- Up to 20 calculations saved in this browser, with reusable results and a clear-history action
- Responsive layout, labeled controls, keyboard focus styles, and reduced-motion support

## Input examples

`sin(30)` → 0.5 in DEG mode

`sqrt(144) + 2^3` → 20

`5!` → 120

`200 * 10%` → 20 (percent is division by 100)

`2pi` → 6.28318530718 (adjacent values multiply)

`-2^2` → -4, while `(-2)^2` → 4

Functions require closing parentheses. The calculator works with real numbers and JavaScript floating-point precision; the display rounds to 12 significant digits. Factorials accept integers from 0 to 170. No typed expression is executed as code.

## Verify the math engine

Run `node tests/engine.test.cjs`.
