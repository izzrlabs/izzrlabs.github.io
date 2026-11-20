// IZZR Labs — section titles typed in, terminal style (Home, Products).
//
// Progressive enhancement only: every <h2 data-type-in> keeps its real text in
// the DOM the whole time (hidden visually while it types, so the layout never
// moves and screen readers read it normally). A copy on top, aria-hidden, gets
// the letters one by one with the same orange cursor as the terminal; the
// cursor blinks a few times and goes away. With this script absent or failing,
// or with reduced motion requested, the titles are plain text.
(function () {
  'use strict';

  var heads = document.querySelectorAll('[data-type-in]');
  if (!heads.length || !('IntersectionObserver' in window)) {
    return;
  }
  if (window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
    return;
  }

  var CHAR_MS = 55;
  var LINGER_MS = 1600; // cursor stays, blinking, after the last letter

  function type(h) {
    var text = h.textContent;
    var real = document.createElement('span');
    real.className = 'type-in__real';
    while (h.firstChild) {
      real.appendChild(h.firstChild);
    }
    var shown = document.createElement('span');
    shown.className = 'type-in__shown';
    shown.setAttribute('aria-hidden', 'true');
    var letters = document.createElement('span');
    var cursor = document.createElement('span');
    cursor.className = 'terminal__cursor terminal__cursor--typing';
    shown.appendChild(letters);
    shown.appendChild(cursor);
    h.classList.add('type-in');
    h.classList.remove('type-in--wait');
    h.appendChild(real);
    h.appendChild(shown);

    var i = 0;
    (function next() {
      i += 1;
      letters.textContent = text.slice(0, i);
      if (i < text.length) {
        setTimeout(next, CHAR_MS);
        return;
      }
      cursor.classList.remove('terminal__cursor--typing');
      setTimeout(function () {
        // Back to the plain heading: real text visible, copy gone.
        h.classList.remove('type-in');
        h.removeChild(shown);
        while (real.firstChild) {
          h.insertBefore(real.firstChild, real);
        }
        h.removeChild(real);
      }, LINGER_MS);
    })();
  }

  var observer = new IntersectionObserver(
    function (entries) {
      entries.forEach(function (entry) {
        if (entry.isIntersecting) {
          observer.unobserve(entry.target);
          try {
            type(entry.target);
          } catch (err) {
            entry.target.classList.remove('type-in--wait', 'type-in');
          }
        }
      });
    },
    { threshold: 1, rootMargin: '0px 0px -10% 0px' }
  );

  // Waiting titles keep their space but are not drawn yet, so a title never
  // flashes in full and then disappears to be typed.
  for (var i = 0; i < heads.length; i++) {
    heads[i].classList.add('type-in--wait');
    observer.observe(heads[i]);
  }
})();
