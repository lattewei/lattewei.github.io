(function () {
  var KEY = "latte.theme";
  var DURATION = 560;
  var EASE = "cubic-bezier(0.4, 0, 0.2, 1)";
  var root = document.documentElement;
  var reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  var busy = false;

  function storeGet() {
    try {
      return window.localStorage.getItem(KEY);
    } catch (error) {
      return null;
    }
  }

  function storeSet(value) {
    try {
      window.localStorage.setItem(KEY, value);
    } catch (error) {}
  }

  function current() {
    return root.getAttribute("data-theme") === "light" ? "light" : "dark";
  }

  function apply(theme) {
    if (theme === "light") {
      root.setAttribute("data-theme", "light");
    } else {
      root.removeAttribute("data-theme");
    }
    root.style.colorScheme = theme;
    storeSet(theme);
    try {
      window.dispatchEvent(new CustomEvent("latte:theme", { detail: theme }));
    } catch (error) {}
  }

  function coverRadius(x, y) {
    var w = window.innerWidth;
    var h = window.innerHeight;
    return Math.ceil(Math.hypot(Math.max(x, w - x), Math.max(y, h - y)));
  }

  function originFrom(el) {
    var rect = el.getBoundingClientRect();
    return {
      x: rect.left + rect.width / 2,
      y: rect.top + rect.height / 2,
    };
  }

  function supportsVT() {
    return typeof document.startViewTransition === "function";
  }

  function revealWithVT(next, x, y) {
    var toDark = next === "dark";
    var r = coverRadius(x, y);
    var open = "circle(" + r + "px at " + x + "px " + y + "px)";
    var closed = "circle(0px at " + x + "px " + y + "px)";

    root.setAttribute("data-theme-transition", toDark ? "to-dark" : "to-light");

    var transition = document.startViewTransition(function () {
      apply(next);
    });

    transition.ready
      .then(function () {
        if (toDark) {
          document.documentElement.animate(
            { clipPath: [open, closed] },
            {
              duration: DURATION,
              easing: EASE,
              fill: "both",
              pseudoElement: "::view-transition-old(root)",
            }
          );
        } else {
          document.documentElement.animate(
            { clipPath: [closed, open] },
            {
              duration: DURATION,
              easing: EASE,
              fill: "both",
              pseudoElement: "::view-transition-new(root)",
            }
          );
        }
      })
      .catch(function () {});

    return transition.finished.finally(function () {
      root.removeAttribute("data-theme-transition");
      busy = false;
    });
  }

  function revealWithVeil(next, x, y) {
    var r = coverRadius(x, y);
    var toDark = next === "dark";
    var bg = next === "light" ? "#f7f6f2" : "#000000";
    var veil = document.createElement("div");
    veil.className = "theme-veil";
    veil.setAttribute("aria-hidden", "true");
    veil.style.background = bg;

    if (toDark) {
      apply(next);
      veil.style.background = "#f7f6f2";
      veil.style.clipPath = "circle(" + r + "px at " + x + "px " + y + "px)";
      document.body.appendChild(veil);
      requestAnimationFrame(function () {
        requestAnimationFrame(function () {
          veil.style.transition = "clip-path " + DURATION + "ms " + EASE;
          veil.style.clipPath = "circle(0px at " + x + "px " + y + "px)";
        });
      });
    } else {
      veil.style.clipPath = "circle(0px at " + x + "px " + y + "px)";
      document.body.appendChild(veil);
      requestAnimationFrame(function () {
        requestAnimationFrame(function () {
          veil.style.transition = "clip-path " + DURATION + "ms " + EASE;
          veil.style.clipPath = "circle(" + r + "px at " + x + "px " + y + "px)";
        });
      });
    }

    var done = false;
    function finish() {
      if (done) return;
      done = true;
      if (!toDark) apply(next);
      if (veil.parentNode) veil.parentNode.removeChild(veil);
      busy = false;
    }

    veil.addEventListener("transitionend", finish, { once: true });
    setTimeout(finish, DURATION + 80);
  }

  function switchTo(next, fromEl) {
    if (busy || next === current()) return;
    busy = true;

    if (reduce || !fromEl) {
      apply(next);
      busy = false;
      return;
    }

    var point = originFrom(fromEl);

    if (supportsVT()) {
      revealWithVT(next, point.x, point.y);
      return;
    }

    revealWithVeil(next, point.x, point.y);
  }

  function toggle(fromEl) {
    switchTo(current() === "light" ? "dark" : "light", fromEl);
  }

  function syncLabel(btn) {
    var light = current() === "light";
    btn.setAttribute("aria-label", light ? "Switch to dark mode" : "Switch to light mode");
    btn.setAttribute("aria-pressed", light ? "true" : "false");
  }

  function buildButton() {
    var btn = document.createElement("button");
    btn.type = "button";
    btn.className = "theme-toggle";
    btn.innerHTML =
      '<svg class="theme-icon" viewBox="0 0 24 24" aria-hidden="true">' +
      '<mask id="latte-theme-mask">' +
      '<rect width="24" height="24" fill="#fff"/>' +
      '<circle class="theme-mask-hole" cx="12" cy="12" r="8" fill="#000"/>' +
      "</mask>" +
      '<circle class="theme-disc" cx="12" cy="12" r="8" mask="url(#latte-theme-mask)"/>' +
      '<g class="theme-beams" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" fill="none">' +
      '<line x1="12" y1="2.4" x2="12" y2="4.4"/>' +
      '<line x1="12" y1="19.6" x2="12" y2="21.6"/>' +
      '<line x1="4.4" y1="4.4" x2="5.8" y2="5.8"/>' +
      '<line x1="18.2" y1="18.2" x2="19.6" y2="19.6"/>' +
      '<line x1="2.4" y1="12" x2="4.4" y2="12"/>' +
      '<line x1="19.6" y1="12" x2="21.6" y2="12"/>' +
      '<line x1="4.4" y1="19.6" x2="5.8" y2="18.2"/>' +
      '<line x1="18.2" y1="5.8" x2="19.6" y2="4.4"/>' +
      "</g>" +
      "</svg>";

    syncLabel(btn);
    btn.addEventListener("click", function () {
      toggle(btn);
    });
    window.addEventListener("latte:theme", function () {
      syncLabel(btn);
    });
    document.body.appendChild(btn);
  }

  var saved = storeGet();
  if (saved === "light" || saved === "dark") {
    apply(saved);
  } else {
    root.style.colorScheme = current();
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", buildButton);
  } else {
    buildButton();
  }
})();
