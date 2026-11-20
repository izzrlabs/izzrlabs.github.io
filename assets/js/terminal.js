// IZZR Labs — terminal replay (Home build log, Products kit card, blog posts).
//
// Progressive enhancement only: every <pre data-retype> already holds the
// full, real log in the HTML. This script replays it once, the way a real
// terminal shows it: commands ("$ ..." and "# ..." lines) are typed with a
// cursor, output lines stream in, test runs get a spinner while they "run",
// and the final BUILD SUCCESS / failure line lights up. At the end the
// original markup is put back untouched. With this script absent or failing,
// or with reduced motion requested, the page is already correct.
(function () {
  'use strict';

  var els = document.querySelectorAll('[data-retype]');
  if (!els.length) {
    return;
  }
  if (window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
    return;
  }

  var TYPE_MS = 34; // per character of a command
  var ENTER_MS = 380; // pause after a command, before its output
  var LINE_MS = 70; // between plain output lines
  var SPIN_MS = 1100; // how long a "Running ..." line spins
  var SPINNER = ['⠋', '⠙', '⠹', '⠸', '⠼', '⠴', '⠦', '⠧', '⠇', '⠏'];

  function isCommand(text) {
    return /^\s*[$#]/.test(text);
  }

  function wait(ms) {
    return new Promise(function (resolve) {
      setTimeout(resolve, ms);
    });
  }

  // Split the original HTML into lines. Spans never cross a line in our logs;
  // if one ever does, fall back to plain text lines (no colors while playing).
  function htmlLines(el) {
    var lines = el.innerHTML.split('\n');
    var balanced = lines.every(function (l) {
      return (l.match(/<span\b/g) || []).length === (l.match(/<\/span>/g) || []).length;
    });
    if (balanced) {
      return lines;
    }
    return el.textContent.split('\n').map(function (t) {
      var d = document.createElement('div');
      d.textContent = t;
      return d.innerHTML;
    });
  }

  function textOf(html) {
    var d = document.createElement('div');
    d.innerHTML = html;
    return d.textContent;
  }

  function replay(el) {
    var originalHTML = el.innerHTML;
    var full = el.textContent;
    var figure = el.closest('.terminal');
    var lines = htmlLines(el);

    function restore() {
      el.innerHTML = originalHTML;
      if (el.textContent !== full) {
        el.textContent = full;
      }
      el.removeAttribute('aria-busy');
    }

    var cursor = document.createElement('span');
    cursor.className = 'terminal__cursor';
    cursor.setAttribute('aria-hidden', 'true');

    var spin = document.createElement('span');
    spin.className = 'terminal__spin';
    spin.setAttribute('aria-hidden', 'true');

    var done = '';

    function paint(currentHTML, tail) {
      el.innerHTML = done + currentHTML;
      if (tail) {
        el.appendChild(tail);
      }
    }

    async function play() {
      el.setAttribute('data-replayed', '');
      el.setAttribute('aria-busy', 'true');
      paint('', cursor);
      await wait(300);

      for (var i = 0; i < lines.length; i++) {
        var html = lines[i];
        var text = textOf(html);

        if (isCommand(text)) {
          cursor.classList.add('terminal__cursor--typing');
          // Short commands type at a human pace; long ones finish in about a second.
          var perChar = Math.min(TYPE_MS, 1000 / Math.max(text.length, 1));
          for (var c = 1; c <= text.length; c++) {
            var part = document.createElement('div');
            part.textContent = text.slice(0, c);
            paint(part.innerHTML, cursor);
            await wait(perChar + (text.charAt(c - 1) === ' ' && perChar === TYPE_MS ? 30 : 0));
          }
          cursor.classList.remove('terminal__cursor--typing');
          paint(html, cursor);
          await wait(ENTER_MS);
        } else if (/\bRunning\b/.test(text)) {
          for (var t = 0, f = 0; t < SPIN_MS; t += 80, f++) {
            spin.textContent = ' ' + SPINNER[f % SPINNER.length];
            paint(html, spin);
            await wait(80);
          }
        } else {
          var lightsUp = /terminal__(ok|err)/.test(html);
          if (lightsUp) {
            await wait(220);
          }
          paint(html, null);
          await wait(lightsUp ? 260 : LINE_MS);
        }
        done += html + (i < lines.length - 1 ? '\n' : '');
        paint('', null);
      }

      restore();
      if (figure) {
        // The build's verdict is the last colored line of the log.
        for (var k = lines.length - 1; k >= 0; k--) {
          var verdict = lines[k].match(/terminal__(ok|err)/);
          if (verdict) {
            figure.classList.add('terminal--' + verdict[1]);
            break;
          }
        }
      }
      // A fresh prompt with a blinking cursor: decoration only, not output.
      var prompt = document.createElement('span');
      prompt.className = 'terminal__prompt';
      prompt.setAttribute('aria-hidden', 'true');
      prompt.textContent = '\n$ ';
      prompt.appendChild(cursor);
      el.appendChild(prompt);
    }

    play().catch(restore);
  }

  if (!('IntersectionObserver' in window)) {
    for (var i = 0; i < els.length; i++) {
      replay(els[i]);
    }
    return;
  }

  var observer = new IntersectionObserver(
    function (entries) {
      entries.forEach(function (entry) {
        if (entry.isIntersecting) {
          observer.unobserve(entry.target);
          replay(entry.target);
        }
      });
    },
    { threshold: 0.4 }
  );

  for (var j = 0; j < els.length; j++) {
    observer.observe(els[j]);
  }

  // Reserve each box's final height (full log + the closing prompt line)
  // right away, before the first paint, so nothing on the page ever moves.
  function reserve() {
    for (var r = 0; r < els.length; r++) {
      if (els[r].hasAttribute('data-replayed')) {
        continue; // already playing: its height is set
      }
      var lineH = parseFloat(getComputedStyle(els[r]).lineHeight) || 22;
      els[r].style.minHeight = '';
      els[r].style.minHeight = Math.ceil(els[r].offsetHeight + lineH) + 'px';
    }
  }
  reserve();
  if (document.fonts && document.fonts.ready) {
    document.fonts.ready.then(reserve);
  }
})();
