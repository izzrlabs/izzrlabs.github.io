// IZZR Labs — after a menu click, the page title and the text under it are
// typed in, as if someone were writing them, with the orange cursor.
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

  // The opening line right under the title (same block). Pages whose text
  // starts in another section (About) get only the title typed.
  var next = h1.nextElementSibling;
  var lead = next && next.tagName === 'P' ? next : null;

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
    var titleJob = prepare(h1);
    var leadJob = lead ? prepare(lead) : null;
    if (leadJob) {
      leadJob.el.classList.add('type-over--wait'); // waits its turn, invisible
    }
    show(titleJob, 0);
    // Title: letter by letter, at most about 0.9 s; text: about 1.4 s.
    type(titleJob, Math.min(60, 900 / Math.max(titleJob.total, 1)), 1, function () {
      setTimeout(function () {
        finish(titleJob);
        if (!leadJob) {
          return;
        }
        leadJob.el.classList.remove('type-over--wait');
        type(leadJob, 16, Math.max(1, Math.round(leadJob.total / 85)), function () {
          cursor.classList.remove('terminal__cursor--typing');
          setTimeout(function () {
            finish(leadJob);
          }, 900);
        });
      }, 180);
    });
  } catch (err) {
    var stuck = document.querySelectorAll('.type-over__copy');
    for (var s = 0; s < stuck.length; s++) {
      stuck[s].parentNode.classList.remove('type-over', 'type-over--wait');
      stuck[s].remove();
    }
  }
})();
