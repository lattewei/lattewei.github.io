(function () {
  function escapeHtml(value) {
    return String(value)
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;");
  }

  function formatDate(value) {
    var match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(value);
    if (!match) return value;
    var months = [
      "Jan",
      "Feb",
      "Mar",
      "Apr",
      "May",
      "Jun",
      "Jul",
      "Aug",
      "Sep",
      "Oct",
      "Nov",
      "Dec",
    ];
    return Number(match[3]) + " " + months[Number(match[2]) - 1] + " " + match[1];
  }

  function sortedPosts() {
    return (window.DREAMS || []).slice().sort(function (a, b) {
      return String(b.date).localeCompare(String(a.date));
    });
  }

  function postBySlug(slug) {
    return sortedPosts().filter(function (post) {
      return post.slug === slug;
    })[0];
  }

  var back =
    '<a class="back" href="index.html" aria-label="Back to home"><span class="back-arrow" aria-hidden="true">←</span></a>';

  function renderList(root) {
    var posts = sortedPosts();
    var body = posts.length
      ? posts
          .map(function (post) {
            return (
              '<article class="pensee-row">' +
              '<a class="link-fg" href="dreams.html?p=' +
              encodeURIComponent(post.slug) +
              '">' +
              escapeHtml(post.title) +
              "</a>" +
              '<time class="date-label" datetime="' +
              escapeHtml(post.date) +
              '">' +
              escapeHtml(formatDate(post.date)) +
              "</time>" +
              "</article>"
            );
          })
          .join("")
      : '<p class="entry-body">Nothing yet.</p>';
    document.title = "Dreams · latte";
    root.innerHTML =
      back + '<h1 class="page-title">Dreams</h1><div data-dreams-list>' + body + "</div>";
  }

  function renderArticle(root, post) {
    document.title = post.title + " · latte";
    var body = (post.paragraphs || [])
      .map(function (paragraph) {
        return "<p>" + escapeHtml(paragraph) + "</p>";
      })
      .join("");
    var media = (post.images || [])
      .map(function (image) {
        return (
          '<img src="' +
          escapeHtml(image.src) +
          '" alt="' +
          escapeHtml(image.alt || "") +
          '">'
        );
      })
      .join("");
    root.innerHTML =
      '<a class="back" href="dreams.html" aria-label="Back to dreams"><span class="back-arrow" aria-hidden="true">←</span></a>' +
      '<h1 class="page-title">' +
      escapeHtml(post.title) +
      "</h1>" +
      '<time class="date-label article-date" datetime="' +
      escapeHtml(post.date) +
      '">' +
      escapeHtml(formatDate(post.date)) +
      "</time>" +
      '<div class="page-body">' +
      body +
      "</div>" +
      (media ? '<div class="page-media">' + media + "</div>" : "");
  }

  var root = document.querySelector("[data-dreams]");
  if (!root) return;
  var slug = new URLSearchParams(window.location.search).get("p");
  if (!slug) {
    renderList(root);
    return;
  }
  var post = postBySlug(slug);
  if (!post) {
    document.title = "Not found · latte";
    root.innerHTML =
      back +
      '<h1 class="page-title">This dream is not here</h1>' +
      '<p class="page-body">The link is dead, or the slug changed.</p>';
    return;
  }
  renderArticle(root, post);
})();
