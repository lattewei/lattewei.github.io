(function () {
  function escapeHtml(value) {
    return String(value)
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;");
  }

  function allEvents() {
    return (window.EVENTS || []).slice();
  }

  function thumb(item) {
    var label = escapeHtml(item.title || "Event");
    if (item.description) label += " — " + escapeHtml(item.description);
    var inner = item.image
      ? '<img src="' +
        escapeHtml(item.image) +
        '" alt="" loading="lazy" decoding="async" width="56" height="56" />'
      : '<span class="event-thumb-fallback" aria-hidden="true"></span>';
    var cls = ' class="event-thumb"';
    if (item.href) {
      return (
        '<a' +
        cls +
        ' href="' +
        escapeHtml(item.href) +
        '" target="_blank" rel="noopener noreferrer" aria-label="' +
        label +
        '">' +
        inner +
        "</a>"
      );
    }
    return '<span' + cls + ' aria-label="' + label + '">' + inner + "</span>";
  }

  function copy(item) {
    return (
      '<div class="event-copy">' +
      '<p class="event-title">' +
      escapeHtml(item.title) +
      "</p>" +
      (item.description
        ? '<p class="event-desc">' + escapeHtml(item.description) + "</p>"
        : "") +
      "</div>"
    );
  }

  function timeEl(item) {
    var label = escapeHtml(item.dateLabel || item.date || "");
    if (item.date) {
      return (
        '<time class="event-date" datetime="' +
        escapeHtml(item.date) +
        '">' +
        label +
        "</time>"
      );
    }
    return '<span class="event-date">' + label + "</span>";
  }

  function renderMobile(items) {
    return (
      '<ul class="events-mobile">' +
      items
        .map(function (item) {
          return (
            '<li class="event-mobile-item">' +
            '<div class="event-mobile-rail">' +
            thumb(item) +
            "</div>" +
            '<div class="event-mobile-body">' +
            timeEl(item) +
            copy(item) +
            "</div>" +
            "</li>"
          );
        })
        .join("") +
      "</ul>"
    );
  }

  function renderDesktop(items) {
    var n = items.length;
    var style = ' style="--event-count: ' + n + '"';
    var dates = items.map(timeEl).join("");
    var thumbs = items
      .map(function (item) {
        return '<div class="event-desktop-thumb">' + thumb(item) + "</div>";
      })
      .join("");
    var copies = items
      .map(function (item) {
        return '<div class="event-desktop-copy">' + copy(item) + "</div>";
      })
      .join("");
    return (
      '<div class="events-desktop"' +
      style +
      ">" +
      '<div class="event-desktop-dates">' +
      dates +
      "</div>" +
      '<div class="event-desktop-line" aria-hidden="true">' +
      '<div class="event-desktop-thumbs">' +
      thumbs +
      "</div>" +
      "</div>" +
      '<div class="event-desktop-copies" role="list">' +
      copies +
      "</div>" +
      "</div>"
    );
  }

  function render(root) {
    var items = allEvents();
    if (!items.length) {
      root.innerHTML = '<p class="entry-body">Nothing yet.</p>';
      return;
    }
    root.innerHTML = renderMobile(items) + renderDesktop(items);
  }

  var root = document.querySelector("[data-events]");
  if (root) render(root);
})();
