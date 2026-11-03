(function () {
  try {
    if (!sessionStorage.getItem("latte-reveal")) {
      sessionStorage.setItem("latte-reveal", "1");
      document.documentElement.classList.add("reveal");
    }
  } catch (error) {
    /* private mode / blocked storage: skip animation */
  }

  function initLightRays() {
    if (document.querySelector(".light-rays")) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

    var el = document.createElement("div");
    el.className = "light-rays";
    el.setAttribute("aria-hidden", "true");
    document.body.insertBefore(el, document.body.firstChild);

    var reduce = false;
    var targetX = 50;
    var targetY = -2;
    var currentX = 50;
    var currentY = -2;
    var raf = 0;

    function tick() {
      currentX += (targetX - currentX) * 0.06;
      currentY += (targetY - currentY) * 0.06;
      el.style.setProperty("--ray-x", currentX.toFixed(2) + "%");
      el.style.setProperty("--ray-y", currentY.toFixed(2) + "%");
      raf = 0;
      if (
        Math.abs(targetX - currentX) > 0.05 ||
        Math.abs(targetY - currentY) > 0.05
      ) {
        raf = window.requestAnimationFrame(tick);
      }
    }

    function onMove(event) {
      if (reduce) return;
      var w = window.innerWidth || 1;
      var h = window.innerHeight || 1;
      var nx = event.clientX / w - 0.5;
      var ny = event.clientY / h;
      targetX = 50 + nx * 10;
      targetY = -2 + ny * 6;
      if (!raf) raf = window.requestAnimationFrame(tick);
    }

    window.addEventListener("pointermove", onMove, { passive: true });
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", initLightRays);
  } else {
    initLightRays();
  }
})();
