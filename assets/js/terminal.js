// IZZR Labs — terminal retype animation (Home build log, Products kit card).
//
// Progressive enhancement only: every <pre data-retype> already holds the
// full, correct log in the HTML. This script retypes each one once, when it
// scrolls into view, then restores the original markup (so colored spans
// like "BUILD SUCCESS" come back). With this script absent or failing, or
// with reduced motion requested, the page is already correct.
(function () {
  'use strict';

  var els = document.querySelectorAll('[data-retype]');
  if (!els.length) {
    return;
  }

  var reduceMotion =
    window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  if (reduceMotion) {
    return;
  }

  var CHARS_PER_STEP = 3;
  var STEP_DELAY_MS = 10;

  function retype(el) {
    var full = el.textContent;
    var original = el.cloneNode(true);

    function restore() {
      while (el.firstChild) {
        el.removeChild(el.firstChild);
      }
      while (original.firstChild) {
        el.appendChild(original.firstChild);
      }
      el.removeAttribute('aria-busy');
      el.style.minHeight = '';
      if (el.textContent !== full) {
        el.textContent = full;
      }
    }

    try {
      var lines = full.split('\n');
      var lineIndex = 0;
      var charIndex = 0;
      var typed = '';

      // Keep the box at its full-text height while it retypes (no layout shift).
      el.style.minHeight = el.offsetHeight + 'px';
      el.setAttribute('aria-busy', 'true');
      el.textContent = '';

      var step = function () {
        if (lineIndex >= lines.length) {
          restore();
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
      restore();
    }
  }

  if (!('IntersectionObserver' in window)) {
    for (var i = 0; i < els.length; i++) {
      retype(els[i]);
    }
    return;
  }

  var observer = new IntersectionObserver(
    function (entries) {
      entries.forEach(function (entry) {
        if (entry.isIntersecting) {
          observer.unobserve(entry.target);
          retype(entry.target);
        }
      });
    },
    { threshold: 0.4 }
  );

  for (var j = 0; j < els.length; j++) {
    observer.observe(els[j]);
  }
})();
