// IZZR Labs — Gumroad buttons show the command they run (Home, Products).
//
// On mouse hover (or keyboard focus), the button's label gives way to the real
// destination typed as a shell command: "$ open izzrlabs.gumroad.com/l/...".
// The address comes from the link's own href. The real label never leaves the
// DOM (it is only hidden visually, keeping the button's size), so the link's
// accessible name stays "Get it on Gumroad". Touch screens: nothing changes.
// With this script absent or reduced motion requested, the buttons are plain.
(function () {
  'use strict';

  if (window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
    return;
  }
  var mouse = window.matchMedia && window.matchMedia('(hover: hover) and (pointer: fine)').matches;

  var CHAR_MS = 16;
  var buttons = document.querySelectorAll('a.btn[href*="gumroad.com"]');

  Array.prototype.forEach.call(buttons, function (btn) {
    var url;
    try {
      url = new URL(btn.href);
    } catch (err) {
      return;
    }
    var command = '$ open ' + url.host + url.pathname.replace(/\/$/, '');

    var label = document.createElement('span');
    label.className = 'btn__label';
    while (btn.firstChild) {
      label.appendChild(btn.firstChild);
    }
    var cmd = document.createElement('span');
    cmd.className = 'btn__cmd';
    cmd.setAttribute('aria-hidden', 'true');
    var typed = document.createElement('span');
    var cursor = document.createElement('span');
    cursor.className = 'terminal__cursor terminal__cursor--typing';
    cmd.appendChild(typed);
    cmd.appendChild(cursor);
    btn.appendChild(label);
    btn.appendChild(cmd);

    var timer = null;

    function show() {
      if (btn.classList.contains('btn--cmd')) {
        return;
      }
      btn.classList.add('btn--cmd');
      cursor.classList.add('terminal__cursor--typing');
      var i = 0;
      (function next() {
        i += 1;
        typed.textContent = command.slice(0, i);
        if (i < command.length) {
          timer = setTimeout(next, CHAR_MS);
        } else {
          cursor.classList.remove('terminal__cursor--typing');
        }
      })();
    }

    function hide() {
      clearTimeout(timer);
      btn.classList.remove('btn--cmd');
      typed.textContent = '';
    }

    if (mouse) {
      btn.addEventListener('mouseenter', show);
      btn.addEventListener('mouseleave', hide);
    }
    btn.addEventListener('focus', function () {
      if (btn.matches(':focus-visible')) {
        show();
      }
    });
    btn.addEventListener('blur', hide);
  });
})();
