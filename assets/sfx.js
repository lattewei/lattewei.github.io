(function () {
  var script = document.currentScript;
  var base = "assets/";
  if (script && script.src) {
    base = script.src.replace(/[?#].*$/, "").replace(/[^/]*$/, "");
  }

  function makeSound(name) {
    var audio = new Audio(base + name + ".wav");
    audio.preload = "auto";
    audio.volume = 0.7;
    return audio;
  }

  var clickSound = makeSound("onclick");
  var escapeSound = makeSound("echap");

  function play(audio) {
    try {
      audio.currentTime = 0;
      var promise = audio.play();
      if (promise && promise.catch) promise.catch(function () {});
    } catch (error) {}
  }

  function playThen(audio, done) {
    var finished = false;
    function finish() {
      if (finished) return;
      finished = true;
      audio.removeEventListener("ended", finish);
      done();
    }
    audio.addEventListener("ended", finish);
    try {
      audio.currentTime = 0;
      var promise = audio.play();
      if (promise && promise.catch) promise.catch(finish);
    } catch (error) {
      finish();
      return;
    }
    setTimeout(finish, 1000);
  }

  var overlay = null;
  var overlayImg = null;
  var lastFocus = null;

  function buildOverlay() {
    overlay = document.createElement("div");
    overlay.className = "lightbox";
    overlay.setAttribute("role", "dialog");
    overlay.setAttribute("aria-modal", "true");
    overlay.setAttribute("aria-label", "Photo");
    overlay.tabIndex = -1;
    overlayImg = document.createElement("img");
    overlayImg.alt = "";
    overlayImg.decoding = "async";
    overlay.appendChild(overlayImg);
    document.body.appendChild(overlay);
  }

  function isOpen() {
    return overlay !== null && overlay.classList.contains("is-open");
  }

  function openOverlay(img) {
    if (!overlay) buildOverlay();
    overlayImg.src = img.currentSrc || img.src;
    overlayImg.alt = img.alt || "";
    lastFocus = document.activeElement;
    overlay.classList.add("is-open");
    document.body.classList.add("lightbox-open");
    overlay.focus();
  }

  function closeOverlay() {
    if (!isOpen()) return;
    overlay.classList.remove("is-open");
    document.body.classList.remove("lightbox-open");
    play(escapeSound);
    if (lastFocus && lastFocus.focus) lastFocus.focus();
  }

  function isInternalLink(link) {
    if (link.hasAttribute("download")) return false;
    if ((link.getAttribute("target") || "").toLowerCase() === "_blank") return false;
    var href = link.getAttribute("href") || "";
    if (href.charAt(0) === "#") return true;
    var url;
    try {
      url = new URL(link.href, window.location.href);
    } catch (error) {
      return false;
    }
    if (url.protocol !== "http:" && url.protocol !== "https:") return false;
    return url.origin === window.location.origin;
  }

  function zoomableImage(img) {
    if (!img || img.tagName !== "IMG") return null;
    if (img.closest("a")) return null;
    if (img.classList.contains("avatar") || img.classList.contains("evm-mark")) return null;
    return img;
  }

  document.addEventListener(
    "click",
    function (event) {
      if (event.defaultPrevented || event.button !== 0) return;
      if (event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;

      if (isOpen()) {
        event.preventDefault();
        closeOverlay();
        return;
      }

      var target = event.target;
      if (!target || !target.closest) return;

      var link = target.closest("a[href]");
      if (link) {
        if (!isInternalLink(link)) return;
        var href = link.getAttribute("href") || "";
        if (href.charAt(0) === "#") {
          play(clickSound);
          return;
        }
        event.preventDefault();
        var destination = link.href;
        playThen(clickSound, function () {
          window.location.href = destination;
        });
        return;
      }

      var img = zoomableImage(target.closest("img"));
      if (img) {
        event.preventDefault();
        play(clickSound);
        openOverlay(img);
      }
    },
    true
  );

  document.addEventListener("keydown", function (event) {
    if (event.key !== "Escape") return;
    if (!isOpen()) return;
    event.preventDefault();
    closeOverlay();
  });
})();
