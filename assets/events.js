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
        '" alt="" loading="lazy" decoding="async" width="52" height="52" />'
      : '<span class="event-thumb-fallback" aria-hidden="true"></span>';
    if (item.href) {
      return (
        '<a class="event-thumb" href="' +
        escapeHtml(item.href) +
        '" target="_blank" rel="noopener noreferrer" aria-label="' +
        label +
        '">' +
        inner +
        "</a>"
      );
    }
    return '<span class="event-thumb" aria-hidden="true">' + inner + "</span>";
  }

  function title(item) {
    var text = escapeHtml(item.title);
    if (item.href) {
      return (
        '<a class="event-title" href="' +
        escapeHtml(item.href) +
        '" target="_blank" rel="noopener noreferrer">' +
        text +
        "</a>"
      );
    }
    return '<p class="event-title">' + text + "</p>";
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

  function render(root) {
    var items = allEvents();
    if (!items.length) {
      root.innerHTML = '<p class="entry-body">Nothing yet.</p>';
      return;
    }
    root.innerHTML =
      '<ul class="events-list">' +
      items
        .map(function (item) {
          return (
            '<li class="event-item">' +
            thumb(item) +
            '<div class="event-body">' +
            '<div class="event-head">' +
            title(item) +
            timeEl(item) +
            "</div>" +
            (item.description
              ? '<p class="event-desc">' + escapeHtml(item.description) + "</p>"
              : "") +
            "</div>" +
            "</li>"
          );
        })
        .join("") +
      "</ul>";
  }

  var root = document.querySelector("[data-events]");
  if (root) render(root);
})();
