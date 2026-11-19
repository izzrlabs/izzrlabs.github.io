// IZZR Labs — flip card for the chapter-1 question on Products.
//
// Progressive enhancement only: without this script the question and the
// answer are both visible, one under the other. With it, the card shows the
// question, and the button (or Enter/Space on it) turns it to the answer.
(function () {
  'use strict';

  var cards = document.querySelectorAll('.flip');
  for (var i = 0; i < cards.length; i++) {
    setup(cards[i]);
  }

  function setup(card) {
    var button = card.querySelector('.flip__toggle');
    if (!button) {
      return;
    }
    var show = card.getAttribute('data-label-show') || button.textContent;
    var hide = card.getAttribute('data-label-hide') || show;

    card.classList.add('flip--js');
    button.addEventListener('click', function () {
      var flipped = card.classList.toggle('is-flipped');
      button.setAttribute('aria-expanded', flipped ? 'true' : 'false');
      button.textContent = flipped ? hide : show;
    });
  }
})();
