// IZZR Labs — 404 page. GitHub Pages serves this one file for any missing
// path. If the missing path was under /pt/ or /es/, show the help line in
// that language and point the trace links at that language's pages.
// Without this script everything stays in English and every link works.
(function () {
  'use strict';

  var m = /^\/(pt|es)\//.exec(window.location.pathname);
  if (!m) {
    return;
  }
  var lang = m[1];

  // Only the help line is translated, so only it gets the new lang; the
  // rest of the page stays English (lang="en" on <html>).
  var help = document.getElementById('notfound-help');
  if (help && help.getAttribute('data-' + lang)) {
    help.textContent = help.getAttribute('data-' + lang);
    help.setAttribute('lang', lang === 'pt' ? 'pt-BR' : 'es');
  }

  var links = document.querySelectorAll('.trace-link');
  for (var i = 0; i < links.length; i++) {
    var path = '/' + lang + '/' + links[i].getAttribute('data-path');
    links[i].setAttribute('href', path);
    links[i].textContent = path;
  }
})();
