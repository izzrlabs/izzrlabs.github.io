// IZZR Labs — blog index: the logo flask assembles itself out of code characters.
//
// Progressive enhancement. The HTML already holds the finished logo (an <img>
// inside .flask-hero). With JS off, or with reduced motion requested, nothing
// below runs and the logo simply sits there. Otherwise a <canvas> draws the
// glyphs flying into the flask shape once, then hands back to the real logo and
// stops: the animation loop ends by itself (no endless requestAnimationFrame).
//
// MASK is the flask's dark area on a 44 x 44 grid, generated (centre 780px crop) from
// assets/img/izzrlabs-logo.png by fonte/gerar_mascara.py (no image is read at
// run time, so it also works from file:// without a tainted canvas).
(function () {
  'use strict';

  var box = document.querySelector('[data-flask]');
  if (!box) {
    return;
  }
  var reduceMotion =
    window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var img = box.querySelector('img');
  if (reduceMotion || !img || !document.createElement('canvas').getContext) {
    return;
  }

  var MASK = [
'............................................',
'............................................',
'............................................',
'................############................',
'................############................',
'.................###....###.................',
'.................###.....##.................',
'.................###.....##.................',
'.................###.....##.................',
'.................###.....##.................',
'.................###.....##.................',
'.................###.....##.................',
'.................###.....##.................',
'.................###.....##.................',
'.................###.....##.................',
'.................###.....##.................',
'.................###.....##.................',
'.................##......###................',
'................###......###................',
'................##........###...............',
'...............###......#.###...............',
'..............###..........###..............',
'..............###..........###..............',
'.............###...##.......###.............',
'.............###...#........###.............',
'............###..............###............',
'............###...............##............',
'...........###................###...........',
'...........######################...........',
'..........########################..........',
'..........#########.#....##########.........',
'.........##########.#.....#########.........',
'........###########.###..###########........',
'........###########.##..############........',
'.......############.#..##############.......',
'.......############.......###########.......',
'......################################......',
'......################################......',
'......###..........................###......',
'.......##############################.......',
'........############################........',
'............................................',
'............................................',
'............................................',
  ];
  var N = MASK.length;
  var SIZE = 264;
  var CELL = SIZE / N;
  var TOKENS = ['{', '}', ';', '@', '->', '(', ')', '<', '>'];
  var DURATION = 1100;
  var SPREAD = 700;
  var BG = '#f59e0b'; // the logo tile
  var INK = '#0f0f0e'; // the logo flask

  var canvas = document.createElement('canvas');
  var ctx = canvas.getContext('2d');
  if (!ctx) {
    return;
  }
  var dpr = Math.min(window.devicePixelRatio || 1, 2);
  canvas.width = SIZE * dpr;
  canvas.height = SIZE * dpr;
  canvas.className = 'flask-hero__canvas';
  canvas.setAttribute('aria-hidden', 'true');
  ctx.scale(dpr, dpr);

  // Deterministic-enough pseudo random so the layout never depends on Math.random order.
  var seed = 7;
  function rnd() {
    seed = (seed * 16807) % 2147483647;
    return (seed - 1) / 2147483646;
  }

  var glyphs = [];
  for (var y = 0; y < N; y++) {
    for (var x = 0; x < N; x++) {
      if (MASK[y].charAt(x) === '#') {
        glyphs.push({
          tx: (x + 0.5) * CELL,
          ty: (y + 0.5) * CELL,
          sx: rnd() * SIZE,
          sy: rnd() * SIZE,
          delay: rnd() * SPREAD,
          final: TOKENS[Math.floor(rnd() * TOKENS.length)],
          alt: Math.floor(rnd() * TOKENS.length)
        });
      }
    }
  }

  function ease(t) {
    return 1 - Math.pow(1 - t, 3);
  }

  function draw(now) {
    var elapsed = now - startTime;
    ctx.fillStyle = BG;
    ctx.fillRect(0, 0, SIZE, SIZE);
    ctx.fillStyle = INK;
    ctx.font = '700 ' + Math.round(CELL * 1.25) + 'px ui-monospace, Menlo, Consolas, monospace';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    var done = true;
    for (var i = 0; i < glyphs.length; i++) {
      var g = glyphs[i];
      var t = (elapsed - g.delay) / DURATION;
      if (t < 1) {
        done = false;
      }
      t = Math.max(0, Math.min(1, t));
      var k = ease(t);
      var token = g.final;
      if (t < 0.85) {
        token = TOKENS[(g.alt + Math.floor(elapsed / 90)) % TOKENS.length];
      }
      ctx.globalAlpha = 0.25 + 0.75 * k;
      ctx.fillText(token, g.sx + (g.tx - g.sx) * k, g.sy + (g.ty - g.sy) * k);
    }
    ctx.globalAlpha = 1;
    return done;
  }

  var startTime = 0;
  function frame(now) {
    if (!startTime) {
      startTime = now;
    }
    if (draw(now)) {
      // Assembled: swap to the real logo and stop. No more frames are requested.
      box.classList.add('flask-hero--done');
      return;
    }
    window.requestAnimationFrame(frame);
  }

  box.classList.add('flask-hero--live');
  box.appendChild(canvas);
  window.requestAnimationFrame(frame);
})();
