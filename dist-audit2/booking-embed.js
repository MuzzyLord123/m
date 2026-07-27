/**
 * Quooro Booking Widget – External Embed Script
 * Usage: <script src="https://your-domain.com/booking-embed.js"></script>
 *        <div data-quooro-booking="your-business-slug"></div>
 *
 * Optional attributes:
 *   data-quooro-color="#3b82f6"   – brand color override
 *   data-quooro-height="700"     – iframe height in px
 *   data-quooro-width="100%"     – iframe width
 *   data-quooro-rounded="12"     – border radius in px
 *   data-quooro-shadow="true"    – show box shadow
 *   data-quooro-mode="appointment|enquiry|table" – booking mode
 */
(function () {
  'use strict';

  function getBaseUrl() {
    var scripts = document.querySelectorAll('script[src*="booking-embed"]');
    if (scripts.length > 0) {
      var src = scripts[scripts.length - 1].src;
      var url = new URL(src);
      return url.origin;
    }
    return window.location.origin;
  }

  function init() {
    var baseUrl = getBaseUrl();
    var targets = document.querySelectorAll('[data-quooro-booking]');

    targets.forEach(function (el) {
      if (el.getAttribute('data-quooro-initialized')) return;
      el.setAttribute('data-quooro-initialized', 'true');

      var slug = el.getAttribute('data-quooro-booking');
      if (!slug) return;

      var color = el.getAttribute('data-quooro-color') || '';
      var height = el.getAttribute('data-quooro-height') || '700';
      var width = el.getAttribute('data-quooro-width') || '100%';
      var rounded = el.getAttribute('data-quooro-rounded') || '16';
      var shadow = el.getAttribute('data-quooro-shadow') !== 'false';
      var mode = el.getAttribute('data-quooro-mode') || 'appointment';

      var bookingUrl = baseUrl + '/book/' + encodeURIComponent(slug) + '?mode=' + mode;
      if (color) bookingUrl += '&brand=' + encodeURIComponent(color);

      var iframe = document.createElement('iframe');
      iframe.src = bookingUrl;
      iframe.width = width;
      iframe.height = height;
      iframe.frameBorder = '0';
      iframe.allow = 'payment';
      iframe.style.border = 'none';
      iframe.style.borderRadius = rounded + 'px';
      iframe.style.width = width;
      iframe.style.height = height + 'px';
      iframe.style.maxWidth = '100%';
      if (shadow) iframe.style.boxShadow = '0 4px 24px rgba(0,0,0,0.08)';
      iframe.title = 'Book an appointment';
      iframe.loading = 'lazy';

      el.innerHTML = '';
      el.appendChild(iframe);
    });
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }

  window.QuooroBooking = { init: init };
})();
