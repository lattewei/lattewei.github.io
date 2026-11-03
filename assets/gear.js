(function () {
  function escapeHtml(value) {
    return String(value)
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;");
  }

  function allGear() {
    return (window.GEAR || []).slice();
  }

  function bySlug(slug) {
    return allGear().filter(function (item) {
      return item.slug === slug;
    })[0];
  }

  function metaLine(item) {
    var parts = [];
    if (item.brand) parts.push(item.brand);
    if (item.kind) parts.push(item.kind);
    if (item.notes) parts.push(item.notes);
    return parts.join(" · ");
  }

  var backList =
    '<a class="back" href="music.html" aria-label="Back to music"><span class="back-arrow" aria-hidden="true">←</span></a>';
  var backDetail =
    '<a class="back" href="gear.html" aria-label="Back to my gear"><span class="back-arrow" aria-hidden="true">←</span></a>';

  function renderList(root) {
    var items = allGear();
    var body = items.length
      ? items
          .map(function (item) {
            var meta = metaLine(item);
            return (
              '<article class="perfume-row">' +
              '<a class="link-fg perfume-name" href="gear.html?p=' +
              encodeURIComponent(item.slug) +
              '">' +
              escapeHtml(item.name) +
              "</a>" +
              (meta
                ? '<span class="perfume-meta">' + escapeHtml(meta) + "</span>"
                : "") +
              "</article>"
            );
          })
          .join("")
      : '<p class="entry-body">Nothing yet.</p>';
    document.title = "My gear · latte";
    root.innerHTML =
      backList +
      '<h1 class="page-title">My gear</h1>' +
      '<div data-gears-list>' +
      body +
      "</div>";
  }

  function renderArticle(root, item) {
    document.title = item.name + " · latte";
    var body = (item.paragraphs || [])
      .map(function (paragraph) {
        return "<p>" + escapeHtml(paragraph) + "</p>";
      })
      .join("");
    var meta = metaLine(item);
    root.innerHTML =
      backDetail +
      '<h1 class="page-title perfume-name">' +
      escapeHtml(item.name) +
      "</h1>" +
      (meta
        ? '<p class="perfume-detail-meta">' + escapeHtml(meta) + "</p>"
        : "") +
      '<div class="page-body">' +
      (body || "<p>Nothing written yet.</p>") +
      "</div>";
  }

  var root = document.querySelector("[data-gears]");
  if (!root) return;

  var slug = new URLSearchParams(window.location.search).get("p");
  if (!slug) {
    renderList(root);
    return;
  }

  var item = bySlug(slug);
  if (!item) {
    document.title = "Not found · latte";
    root.innerHTML =
      backDetail +
      '<h1 class="page-title">This item is not here</h1>' +
      '<p class="page-body">The link is dead, or the slug changed.</p>';
    return;
  }
  renderArticle(root, item);
})();
