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

  function cover(item) {
    if (!item.image) {
      return '<div class="event-cover event-cover-empty" aria-hidden="true"></div>';
    }
    return (
      '<div class="event-cover">' +
      '<img src="' +
      escapeHtml(item.image) +
      '" alt="" loading="lazy" decoding="async" width="320" height="180" />' +
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

  function cardInner(item) {
    return (
      cover(item) +
      '<div class="event-card-body">' +
      timeEl(item) +
      '<p class="event-title">' +
      escapeHtml(item.title) +
      "</p>" +
      (item.description
        ? '<p class="event-desc">' + escapeHtml(item.description) + "</p>"
        : "") +
      "</div>"
    );
  }

  function render(root) {
    var items = allEvents();
    if (!items.length) {
      root.innerHTML = '<p class="entry-body">Nothing yet.</p>';
      return;
    }
    root.innerHTML =
      '<div class="events-grid">' +
      items
        .map(function (item) {
          if (item.href) {
            return (
              '<a class="event-card" href="' +
              escapeHtml(item.href) +
              '" target="_blank" rel="noopener noreferrer">' +
              cardInner(item) +
              "</a>"
            );
          }
          return '<article class="event-card">' + cardInner(item) + "</article>";
        })
        .join("") +
      "</div>";
  }

  var root = document.querySelector("[data-events]");
  if (root) render(root);
})();
