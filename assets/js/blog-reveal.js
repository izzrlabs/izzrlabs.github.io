// IZZR Labs — blog index: post cards ease in as they scroll into view.
//
// Progressive enhancement. Cards are visible in the HTML. Only cards that start
// below the fold get the "reveal" class (hidden a little, 10px lower), and each
// gets "reveal--in" once when it enters the viewport. No scroll listeners and no
// scroll hijacking. With JS off, no IntersectionObserver, or reduced motion
// requested, the script leaves every card alone.
(function () {
  'use strict';

  var cards = document.querySelectorAll('.post-item');
  if (!cards.length || !('IntersectionObserver' in window)) {
    return;
  }
  var reduceMotion =
    window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  if (reduceMotion) {
    return;
  }

  var observer = new IntersectionObserver(
    function (entries) {
      entries.forEach(function (entry) {
        if (entry.isIntersecting) {
          entry.target.classList.add('reveal--in');
          observer.unobserve(entry.target);
        }
      });
    },
    { threshold: 0.15 }
  );

  var vh = window.innerHeight || document.documentElement.clientHeight;
  for (var i = 0; i < cards.length; i++) {
    if (cards[i].getBoundingClientRect().top < vh) {
      continue; // already on screen: leave it alone, no flash
    }
    cards[i].classList.add('reveal');
    observer.observe(cards[i]);
  }
})();
