/**
 * The one piece of inline script on the site.
 *
 * It does two jobs, both of which have to happen before first paint:
 *
 *   1. Decides whether the seam draws. It draws once per session, so the
 *      decision has to be made before the line is painted or it either flashes
 *      in already-finished or replays on every navigation.
 *
 *   2. Stamps data-js on <html> and starts watching for the elements that
 *      reveal on scroll.
 *
 * The second one is the important one, and it is why this is not a React
 * component. Every reveal on this site is written so that the DEFAULT state —
 * no JavaScript, or JavaScript that has not run yet — is the finished state:
 * type in place, photographs in colour. The hidden state only exists inside
 * `html[data-js]`. So if this script never runs, nothing is invisible; the page
 * simply has no animation. The alternative, which is what a motion library does
 * out of the box, is server-rendering `opacity: 0` and hoping hydration
 * arrives — and if it does not, the visitor gets a blank page with the text
 * sitting in the markup where only a crawler will ever see it.
 *
 * The MutationObserver is there because navigation within the site is
 * client-side: the elements on the next page do not exist when this runs.
 */
export const REVEAL_SCRIPT = `
(function () {
  var html = document.documentElement;

  try {
    if (sessionStorage.getItem('ego:seam')) html.dataset.seamDrawn = '1';
    else sessionStorage.setItem('ego:seam', '1');
  } catch (e) {}

  if (!('IntersectionObserver' in window)) return;
  html.dataset.js = '1';

  var io = new IntersectionObserver(function (entries) {
    for (var i = 0; i < entries.length; i++) {
      var entry = entries[i];
      if (!entry.isIntersecting) continue;
      var el = entry.target;
      el.setAttribute(el.hasAttribute('data-arrive') ? 'data-arrived' : 'data-in', 'true');
      io.unobserve(el);
    }
  }, { rootMargin: '0px 0px -12% 0px' });

  function watch(root) {
    var nodes = root.querySelectorAll('[data-arrive],[data-slide]');
    for (var i = 0; i < nodes.length; i++) io.observe(nodes[i]);
  }

  function start() {
    watch(document);
    new MutationObserver(function (records) {
      for (var i = 0; i < records.length; i++) {
        var added = records[i].addedNodes;
        for (var j = 0; j < added.length; j++) {
          var node = added[j];
          if (node.nodeType !== 1) continue;
          if (node.hasAttribute('data-arrive') || node.hasAttribute('data-slide')) io.observe(node);
          watch(node);
        }
      }
    }).observe(document.body, { childList: true, subtree: true });
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', start);
  else start();
})();
`;
