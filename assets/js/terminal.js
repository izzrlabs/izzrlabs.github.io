// IZZR Labs — Home page terminal animation.
//
// Progressive enhancement only: #build-log already holds the full, correct
// build log as plain text in the HTML. This script retypes it once, then
// restores the original markup (so "BUILD SUCCESS" stays green). With this
// script absent or failing, the page is already correct.
(function () {
  'use strict';

  var el = document.getElementById('build-log');
  if (!el) {
    return;
  }

  var reduceMotion =
    window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  if (reduceMotion) {
    return;
  }

  var full = el.textContent;
  var original = el.cloneNode(true);

  try {
    var lines = full.split('\n');
    var CHARS_PER_STEP = 3;
    var STEP_DELAY_MS = 10; // whole log types in well under 2.5s
    var lineIndex = 0;
    var charIndex = 0;
    var typed = '';

    el.setAttribute('aria-busy', 'true');
    el.textContent = '';

    var step = function () {
      if (lineIndex >= lines.length) {
        while (el.firstChild) {
          el.removeChild(el.firstChild);
        }
        while (original.firstChild) {
          el.appendChild(original.firstChild);
        }
        el.removeAttribute('aria-busy');
        if (el.textContent !== full) {
          el.textContent = full;
        }
        return;
      }

      var line = lines[lineIndex];
      if (charIndex < line.length) {
        charIndex = Math.min(charIndex + CHARS_PER_STEP, line.length);
        el.textContent = typed + line.slice(0, charIndex);
        setTimeout(step, STEP_DELAY_MS);
        return;
      }

      typed += line + '\n';
      lineIndex += 1;
      charIndex = 0;
      setTimeout(step, STEP_DELAY_MS);
    };

    setTimeout(step, STEP_DELAY_MS);
  } catch (err) {
    el.removeAttribute('aria-busy');
    el.textContent = full;
  }
})();
