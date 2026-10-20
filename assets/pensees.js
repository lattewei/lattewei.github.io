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
    return (window.PENSEES || []).slice().sort(function (a, b) {
      return String(b.date).localeCompare(String(a.date));
    });
  }

  function postBySlug(slug) {
    return sortedPosts().filter(function (post) {
      return post.slug === slug;
    })[0];
  }

  function renderList(root) {
    var posts = sortedPosts();
    if (!posts.length) {
      root.innerHTML = "<p class=\"entry-body\">Nothing yet.</p>";
      return;
    }
    root.innerHTML = posts
      .map(function (post) {
        return (
          '<article class="pensee-row">' +
          '<a class="link-fg" href="pensees.html?p=' +
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
      .join("");
  }

  function renderArticle(root) {
    var params = new URLSearchParams(window.location.search);
    var slug = params.get("p");
    var post = slug ? postBySlug(slug) : null;
    if (!post) {
      document.title = "Not found · latte";
      root.innerHTML =
        '<a class="back" href="index.html" aria-label="Back to home"><span class="back-arrow" aria-hidden="true">←</span></a>' +
        '<h1 class="page-title">This thought is not here</h1>' +
        '<p class="page-body">The link is dead, or the slug changed.</p>';
      return;
    }
    document.title = post.title + " · latte";
    var body = (post.paragraphs || [])
      .map(function (paragraph) {
        return "<p>" + escapeHtml(paragraph) + "</p>";
      })
      .join("");
    root.innerHTML =
      '<a class="back" href="index.html" aria-label="Back to home"><span class="back-arrow" aria-hidden="true">←</span></a>' +
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
      "</div>";
  }

  var list = document.querySelector("[data-pensees-list]");
  if (list) renderList(list);
  var article = document.querySelector("[data-pensees-article]");
  if (article) renderArticle(article);
})();
