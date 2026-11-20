// IZZR Labs — odometer ("rolling numbers") for blog posts.
//
// Markup (the FINAL value is the element's text, so it is correct without JS):
//   <span class="odo" data-odo-from="120">8</span>
// When the number scrolls into view, each digit column rolls once from the
// "from" value to the final one, then stops. Reduced motion or no
// IntersectionObserver: the script does nothing and the final number stays.
// Only put numbers on a page that come from real output you ran.
(function () {
  'use strict';

  var els = document.querySelectorAll('.odo[data-odo-from]');
  if (!els.length) {
    return;
  }
  var reduceMotion =
    window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  if (reduceMotion) {
    return;
  }

  function sequence(from, to, dir) {
    // from/to: a digit character or '' (blank). Returns the cells to scroll through.
    if (from === to) {
      return [to];
    }
    if (from === '' || to === '') {
      return [from, to];
    }
    var cells = [from];
    var cur = +from;
    while (cur !== +to) {
      cur = (cur + dir + 10) % 10;
      cells.push(String(cur));
    }
    return cells;
  }

  function build(el) {
    var finalText = el.textContent.trim();
    var fromText = String(el.getAttribute('data-odo-from')).trim();
    if (!/^\d+$/.test(finalText) || !/^\d+$/.test(fromText)) {
      return null;
    }
    var len = Math.max(finalText.length, fromText.length);
    var dir = +finalText >= +fromText ? 1 : -1;
    var cols = [];
    for (var i = 0; i < len; i++) {
      var f = fromText.charAt(fromText.length - len + i);
      var t = finalText.charAt(finalText.length - len + i);
      cols.push(sequence(f, t, dir));
    }
    return { finalText: finalText, cols: cols };
  }

  function arm(el) {
    var plan = build(el);
    if (!plan) {
      return null;
    }
    var label = el.textContent.trim();
    el.textContent = '';
    // Screen readers read the final number as plain text; the rolling columns are hidden from them.
    var sr = document.createElement('span');
    sr.className = 'visually-hidden';
    sr.textContent = label;
    el.appendChild(sr);
    var strips = [];
    plan.cols.forEach(function (cells) {
      var col = document.createElement('span');
      col.className = 'odo__col';
      col.setAttribute('aria-hidden', 'true');
      var strip = document.createElement('span');
      strip.className = 'odo__strip';
      cells.forEach(function (c) {
        var cell = document.createElement('span');
        cell.className = 'odo__cell';
        cell.textContent = c === '' ? ' ' : c;
        strip.appendChild(cell);
      });
      col.appendChild(strip);
      el.appendChild(col);
      strips.push({ col: col, strip: strip, steps: cells.length - 1, blankEnd: cells[cells.length - 1] === '' });
    });
    return strips;
  }

  function roll(strips) {
    strips.forEach(function (s, i) {
      s.strip.style.transitionDelay = i * 90 + 'ms';
      s.strip.style.transform = 'translateY(-' + s.steps + 'em)';
      if (s.blankEnd) {
        s.col.classList.add('odo__col--gone');
        s.col.style.transitionDelay = i * 90 + 600 + 'ms';
      }
    });
  }

  var armed = [];
  for (var i = 0; i < els.length; i++) {
    var strips = arm(els[i]);
    if (strips) {
      armed.push({ el: els[i], strips: strips });
    }
  }
  if (!armed.length) {
    return;
  }

  if (!('IntersectionObserver' in window)) {
    armed.forEach(function (a) {
      roll(a.strips);
    });
    return;
  }

  var observer = new IntersectionObserver(
    function (entries) {
      entries.forEach(function (entry) {
        if (!entry.isIntersecting) {
          return;
        }
        observer.unobserve(entry.target);
        armed.forEach(function (a) {
          if (a.el === entry.target) {
            // next frame, so the starting position is painted before the roll
            window.requestAnimationFrame(function () {
              roll(a.strips);
            });
          }
        });
      });
    },
    { threshold: 0.6 }
  );
  armed.forEach(function (a) {
    observer.observe(a.el);
  });
})();
