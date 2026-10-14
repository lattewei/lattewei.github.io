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

  var unlocked = false;
  function unlock() {
    if (unlocked) return;
    unlocked = true;
    [clickSound, escapeSound].forEach(function (audio) {
      var volume = audio.volume;
      audio.volume = 0;
      function restore() {
        try {
          audio.pause();
        } catch (error) {}
        try {
          audio.currentTime = 0;
        } catch (error) {}
        audio.volume = volume;
      }
      try {
        var promise = audio.play();
        if (promise && promise.then) {
          promise.then(restore, function () {
            audio.volume = volume;
          });
        } else {
          restore();
        }
      } catch (error) {
        audio.volume = volume;
      }
    });
  }

  function play(audio) {
    try {
      audio.currentTime = 0;
    } catch (error) {}
    try {
      var promise = audio.play();
      if (promise && promise.catch) promise.catch(function () {});
    } catch (error) {}
  }

  var NAV_DELAY = 150;

  function playThen(audio, done) {
    play(audio);
    setTimeout(done, NAV_DELAY);
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
    var href = (link.getAttribute("href") || "").trim();
    if (!href) return false;
    if (href.charAt(0) === "#") return true;
    if (href.slice(0, 2) === "//") return false;
    if (/^[a-z][a-z0-9+.-]*:/i.test(href)) {
      var url;
      try {
        url = new URL(href, window.location.href);
      } catch (error) {
        return false;
      }
      if (url.protocol !== "http:" && url.protocol !== "https:") return false;
      return url.origin === window.location.origin;
    }
    return true;
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
        var sound = link.classList.contains("back") ? escapeSound : clickSound;
        playThen(sound, function () {
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

  document.addEventListener(
    "keydown",
    function (event) {
      if (event.key !== "Escape") return;
      if (!isOpen()) return;
      event.preventDefault();
      closeOverlay();
    }
  );

  var prefetched = {};
  function maybePrefetch(event) {
    if (window.location.protocol !== "http:" && window.location.protocol !== "https:") return;
    var target = event.target;
    if (!target || !target.closest) return;
    var link = target.closest("a[href]");
    if (!link || !isInternalLink(link)) return;
    var href = link.getAttribute("href") || "";
    if (!href || href.charAt(0) === "#") return;
    if (prefetched[link.href]) return;
    prefetched[link.href] = true;
    var el = document.createElement("link");
    el.rel = "prefetch";
    el.href = link.href;
    document.head.appendChild(el);
  }

  document.addEventListener("pointerdown", unlock, true);
  document.addEventListener("pointerover", maybePrefetch, true);
  document.addEventListener("focusin", maybePrefetch, true);
})();
