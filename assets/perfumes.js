(function () {
  function escapeHtml(value) {
    return String(value)
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;");
  }

  function allPerfumes() {
    return (window.PERFUMES || []).slice();
  }

  function bySlug(slug) {
    return allPerfumes().filter(function (item) {
      return item.slug === slug;
    })[0];
  }

  function metaLine(item) {
    var parts = [];
    if (item.house) parts.push(item.house);
    if (item.kind) parts.push(item.kind);
    if (item.notes) parts.push(item.notes);
    return parts.join(" · ");
  }

  var backList =
    '<a class="back" href="perfume.html" aria-label="Back to perfume"><span class="back-arrow" aria-hidden="true">←</span></a>';
  var backDetail =
    '<a class="back" href="perfumes.html" aria-label="Back to perfume list"><span class="back-arrow" aria-hidden="true">←</span></a>';

  function renderList(root) {
    var items = allPerfumes();
    var body = items.length
      ? items
          .map(function (item) {
            var meta = metaLine(item);
            return (
              '<article class="perfume-row">' +
              '<a class="link-fg" href="perfumes.html?p=' +
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
    document.title = "Perfume list · latte";
    root.innerHTML =
      backList +
      '<h1 class="page-title">Perfume list</h1>' +
      '<div data-perfumes-list>' +
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
      '<h1 class="page-title">' +
      escapeHtml(item.name) +
      "</h1>" +
      (meta
        ? '<p class="perfume-detail-meta">' + escapeHtml(meta) + "</p>"
        : "") +
      '<div class="page-body">' +
      (body || "<p>Nothing written yet.</p>") +
      "</div>";
  }

  var root = document.querySelector("[data-perfumes]");
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
      '<h1 class="page-title">This perfume is not here</h1>' +
      '<p class="page-body">The link is dead, or the slug changed.</p>';
    return;
  }
  renderArticle(root, item);
})();
