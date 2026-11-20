// IZZR Labs — after a menu click, the title and the text at the top of the
// page are typed in (About: its whole body), as if someone were writing them, with the orange cursor.
//
// Only after a click on the main menu or the logo (a flag in sessionStorage),
// never on a direct visit. The real elements stay in the DOM the whole time
// (hidden visually, same size), so the layout never moves and screen readers
// read them normally; an aria-hidden copy on top gets the letters, keeping
// its markup (italics, links). No JS, no storage, or reduced motion: plain page.
(function () {
  'use strict';

  var KEY = 'izzr-menu-nav';
  var reduce = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  function store(fn) {
    try {
      return fn(window.sessionStorage);
    } catch (err) {
      return null;
    }
  }

  // Remember menu clicks (main nav and logo; the language switch is left out).
  var nav = document.querySelectorAll('.site-nav a, .site-logo');
  for (var n = 0; n < nav.length; n++) {
    nav[n].addEventListener('click', function () {
      store(function (s) {
        s.setItem(KEY, '1');
      });
    });
  }

  var cameFromMenu = store(function (s) {
    var v = s.getItem(KEY);
    s.removeItem(KEY);
    return v;
  });
  var main = document.querySelector('main');
  var h1 = main && main.querySelector('h1');
  if (!cameFromMenu || !h1 || reduce) {
    return;
  }

  // The top of the page: the title and the text in its section. When that
  // section holds only the title (About), the body right under it is typed
  // too. Terminals, forms and buttons are left alone.
  var SKIP = '.terminal, form, .flip, .btn, nav, figure';
  var TEXT = 'h1, h2, h3, p, li';
  function textBlocks(root) {
    return Array.prototype.filter.call(root.querySelectorAll(TEXT), function (el) {
      return !el.closest(SKIP) && el.textContent.trim() && !el.querySelector(TEXT);
    });
  }
  var top = h1.closest('section') || h1.parentNode;
  var blocks = textBlocks(top);
  if (blocks.length === 1) {
    var body = top.nextElementSibling;
    if (body && body.querySelector('.prose')) {
      blocks = blocks.concat(textBlocks(body));
    }
  }

  var cursor = document.createElement('span');
  cursor.className = 'terminal__cursor terminal__cursor--typing';
  cursor.setAttribute('aria-hidden', 'true');

  // Put a typing copy over `el`; returns {nodes, texts, total, copy}.
  function prepare(el) {
    var copy = document.createElement('span');
    copy.className = 'type-over__copy';
    copy.setAttribute('aria-hidden', 'true');
    copy.innerHTML = el.innerHTML;
    var walker = document.createTreeWalker(copy, NodeFilter.SHOW_TEXT);
    var nodes = [];
    var texts = [];
    var total = 0;
    while (walker.nextNode()) {
      nodes.push(walker.currentNode);
      texts.push(walker.currentNode.data);
      total += walker.currentNode.data.length;
      walker.currentNode.data = '';
    }
    var real = document.createElement('span');
    real.className = 'type-over__real';
    while (el.firstChild) {
      real.appendChild(el.firstChild);
    }
    el.classList.add('type-over');
    el.appendChild(real);
    el.appendChild(copy);
    return { el: el, real: real, copy: copy, nodes: nodes, texts: texts, total: total };
  }

  function show(job, count) {
    var left = count;
    for (var k = 0; k < job.nodes.length; k++) {
      var take = Math.max(0, Math.min(job.texts[k].length, left));
      job.nodes[k].data = job.texts[k].slice(0, take);
      left -= take;
      if (left <= 0 || k === job.nodes.length - 1) {
        // Cursor right after the last letter shown.
        var node = job.nodes[k];
        node.parentNode.insertBefore(cursor, node.nextSibling);
        return;
      }
    }
  }

  function finish(job) {
    job.el.removeChild(job.copy);
    while (job.real.firstChild) {
      job.el.insertBefore(job.real.firstChild, job.real);
    }
    job.el.removeChild(job.real);
    job.el.classList.remove('type-over', 'type-over--wait');
  }

  function type(job, msPerStep, perStep, done) {
    var count = 0;
    (function next() {
      count = Math.min(job.total, count + perStep);
      show(job, count);
      if (count < job.total) {
        setTimeout(next, msPerStep);
      } else {
        done();
      }
    })();
  }

  try {
    var jobs = blocks.map(prepare);
    var textTotal = jobs.reduce(function (sum, job) {
      return sum + (/^H[1-3]$/.test(job.el.tagName) ? 0 : job.total);
    }, 0) || 1;
    jobs.forEach(function (job) {
      job.el.classList.add('type-over--wait'); // waits its turn, invisible
    });
    // Titles letter by letter (at most ~0.4 s); text blocks share the rest.
    (function run(n) {
      if (n >= jobs.length) {
        cursor.classList.remove('terminal__cursor--typing');
        return;
      }
      var job = jobs[n];
      job.el.classList.remove('type-over--wait');
      var heading = /^H[1-3]$/.test(job.el.tagName);
      // Text blocks share ~2 s by size (each 0.15-0.6 s), so a full screen
      // takes about 3 s at most whatever the page.
      var ms = heading ? Math.min(55, 300 / Math.max(job.total, 1)) : 16;
      var dur = Math.max(150, Math.min(600, 2000 * job.total / textTotal));
      var step = heading ? 1 : Math.max(1, Math.ceil(job.total / (dur / 16)));
      type(job, ms, step, function () {
        setTimeout(function () {
          var last = n === jobs.length - 1;
          setTimeout(function () {
            finish(job);
          }, last ? 900 : 0);
          run(n + 1);
        }, heading ? 550 : 60); // short pause after a title before its text starts
      });
    })(0);
  } catch (err) {
    var stuck = document.querySelectorAll('.type-over__copy');
    for (var s = 0; s < stuck.length; s++) {
      stuck[s].parentNode.classList.remove('type-over', 'type-over--wait');
      stuck[s].remove();
    }
  }
})();
