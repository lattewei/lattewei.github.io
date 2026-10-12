(function () {
  var media = window.matchMedia("(min-width: 1200px) and (hover: hover)");

  function storeGet() {
    try {
      return window.localStorage.getItem("latte.eye");
    } catch (error) {
      return null;
    }
  }
  function storeSet(value) {
    try {
      window.localStorage.setItem("latte.eye", value);
    } catch (error) {}
  }
  function originGet() {
    try {
      return window.sessionStorage.getItem("latte.eyeOrigin");
    } catch (error) {
      return null;
    }
  }
  function originSet(value) {
    try {
      window.sessionStorage.setItem("latte.eyeOrigin", value);
    } catch (error) {}
  }
  var enabled = storeGet() !== "off";
  var running = false;

  var RAMP = " .:-=+*#%@";
  var SCALE = 0.72;
  var FONT_PX = 12 * SCALE;
  var CELL_W = 7.2 * SCALE;
  var CELL_H = 12 * SCALE;
  var vw = window.innerWidth;
  var vh = window.innerHeight;
  var small = vw < 720;
  var COLS = small ? 26 : 40;
  var ROWS = small ? 11 : 13;
  var CODE =
    "const eye={x:0,y:0};function look(px,py){var dx=px-eye.x,dy=py-eye.y;var d=Math.hypot(dx,dy)||1;var k=Math.min(1,d/620);this.gx=dx/d*k;this.gy=dy/d*k;return[d,k];}const gaze=()=>{eye.x+=vel.x*dt;eye.y+=vel.y*dt;return Math.atan2(eye.y,eye.x);};";
  var SUB = 1;
  var SCROLL_RATE = 1.2;
  var FINE_W = CELL_W / SUB;
  var FINE_H = CELL_H / SUB;
  var FINE_FONT = FINE_H * 0.85;
  var W = COLS * CELL_W;
  var H = ROWS * CELL_H;
  var EYE_ALPHA = 0.82;
  var MARGIN = 100;
  var SPRING = 0.16;
  var DAMP = 0.72;
  var PLACE_EASE = 0.09;
  var NEAR = 90;
  var FAR = 620;
  var BOX = 20;
  var SHOW_TRACE = false;
  var IDLE_AFTER = 3500;
  var GAZE_SELECTOR = "a, h1, h2, h3";
  var SVG_NS = "http://www.w3.org/2000/svg";
  var reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  function cssVar(name, fallback) {
    var value = getComputedStyle(document.documentElement).getPropertyValue(name).trim();
    return value || fallback;
  }
  var INK = cssVar("--color-fg", "#f7f6f2");
  var WHITE = "#ffffff";
  var IRIS = "#a855f7";
  var BROWN_DARK = "#4a2f1a";

  function clamp(v, lo, hi) {
    return Math.max(lo, Math.min(hi, v));
  }

  var canvas = document.createElement("canvas");
  canvas.className = "eye";
  canvas.setAttribute("aria-hidden", "true");
  var dpr = Math.min(window.devicePixelRatio || 1, 2);
  canvas.width = Math.round(W * dpr);
  canvas.height = Math.round(H * dpr);
  canvas.style.width = W + "px";
  canvas.style.height = H + "px";
  document.body.appendChild(canvas);
  var ctx = canvas.getContext("2d");
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  var BLOCK_FONT = FONT_PX + 'px "JetBrains Mono", ui-monospace, monospace';
  var FINE_FONT_CSS = FINE_FONT + 'px "JetBrains Mono", ui-monospace, monospace';
  ctx.font = BLOCK_FONT;
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";

  var trace = document.createElementNS(SVG_NS, "svg");
  trace.setAttribute("class", "eye-trace");
  trace.setAttribute("aria-hidden", "true");
  var line = document.createElementNS(SVG_NS, "line");
  line.setAttribute("class", "eye-line");
  var box = document.createElementNS(SVG_NS, "rect");
  box.setAttribute("class", "eye-box");
  box.setAttribute("width", BOX);
  box.setAttribute("height", BOX);
  trace.appendChild(line);
  trace.appendChild(box);
  document.body.appendChild(trace);

  var caption = document.createElement("div");
  caption.className = "eye-caption is-off";
  caption.setAttribute("aria-hidden", "true");
  document.body.appendChild(caption);
  var typeTimer = null;
  var clearTimer = null;
  var pendingTimer = null;

  function hush() {
    if (typeTimer) { clearInterval(typeTimer); typeTimer = null; }
    if (clearTimer) { clearTimeout(clearTimer); clearTimer = null; }
    caption.classList.add("is-off");
  }

  function say(text, hold) {
    if (clearTimer) { clearTimeout(clearTimer); clearTimer = null; }
    caption.classList.remove("is-off");
    function schedule() {
      clearTimer = setTimeout(function () {
        clearTimer = null;
        caption.classList.add("is-off");
      }, hold || 2600);
    }
    if (reduce) {
      caption.textContent = text;
      schedule();
      return;
    }
    if (typeTimer) clearInterval(typeTimer);
    var i = 0;
    caption.textContent = "";
    typeTimer = setInterval(function () {
      i++;
      caption.textContent = text.slice(0, i);
      if (i >= text.length) {
        clearInterval(typeTimer);
        typeTimer = null;
        schedule();
      }
    }, 45);
  }

  var eyeX = 0;
  var eyeY = 0;
  var targetX = 0;
  var targetY = 0;
  var placed = false;
  var state = {
    gx: 0, gy: 0, gtx: 0, gty: 0, vx: 0, vy: 0,
    mx: -1, my: -1, has: false,
    blinkAt: -1e9, nextBlink: 0, scroll: 0,
    mode: "tracking", lastMove: 0, wanderAt: 0,
    sleep: 0, sleepTarget: 0,
    floatX: 0, floatY: 0,
    el: null, elCenter: null
  };

  function aimAt(x, y) {
    var dx = x - (eyeX + W / 2);
    var dy = y - (eyeY + H / 2);
    var dist = Math.sqrt(dx * dx + dy * dy);
    if (dist < 1) {
      state.gtx = 0;
      state.gty = 0;
      return;
    }
    var mag = clamp((dist - NEAR) / (FAR - NEAR), 0.16, 1);
    state.gtx = (dx / dist) * mag;
    state.gty = (dy / dist) * mag;
  }

  function setGazeEl(el) {
    state.el = el || null;
    if (!el) {
      state.elCenter = null;
      if (pendingTimer) { clearTimeout(pendingTimer); pendingTimer = null; }
      if (state.mode !== "idle") hush();
      return;
    }
    var rect = el.getBoundingClientRect();
    state.elCenter = [rect.left + rect.width / 2, rect.top + rect.height / 2];
    var custom = el.getAttribute("data-say");
    var text = custom;
    var hold = Math.max(3000, Math.round(custom.length * 45));
    if (!custom) {
      var label = (el.textContent || "").replace(/\s+/g, " ").trim().toLowerCase();
      if (label.length > 48) label = label.slice(0, 47) + "...";
      text = label ? "reading " + label : "";
      hold = 2600;
    }
    if (pendingTimer) clearTimeout(pendingTimer);
    if (text) {
      pendingTimer = setTimeout(function () {
        if (state.el === el && state.mode !== "sleeping") say(text, hold);
      }, 260);
    }
  }

  function place() {
    vw = window.innerWidth;
    vh = window.innerHeight;
    var bottomLeft = document.body.classList.contains("page-sport");
    if (bottomLeft) {
      targetX = MARGIN;
      targetY = vh - H - MARGIN;
    } else {
      targetX = vw - W - MARGIN;
      targetY = MARGIN;
    }
    if (!placed) {
      placed = true;
      if (originGet() === "bl") {
        eyeX = MARGIN;
        eyeY = vh - H - MARGIN;
      } else {
        eyeX = vw - W - MARGIN;
        eyeY = MARGIN;
      }
      originSet(bottomLeft ? "bl" : "tr");
    }
    canvas.style.transform = "translate(" + Math.round(eyeX) + "px," + Math.round(eyeY) + "px)";
    trace.setAttribute("width", vw);
    trace.setAttribute("height", vh);
    if (bottomLeft) {
      caption.style.left = MARGIN + "px";
      caption.style.right = "auto";
      caption.style.top = "auto";
      caption.style.bottom = Math.round(vh - targetY + 10) + "px";
    } else {
      caption.style.left = "auto";
      caption.style.right = MARGIN + "px";
      caption.style.top = Math.round(targetY + H + 10) + "px";
      caption.style.bottom = "auto";
    }
  }

  function draw(open) {
    var hy = H / 2;
    var a = (W / 2) * 0.98;
    var rimW = 5 * SCALE;
    var pcx = state.gx * a * 0.56;
    var pcy = state.gy * hy * 0.42;
    var rp = hy * 0.3;
    var ri = hy * 0.52;
    var si = Math.floor(state.scroll);
    ctx.clearRect(0, 0, W, H);
    for (var r = 0; r < ROWS; r++) {
      for (var c = 0; c < COLS; c++) {
        var x = (c + 0.5) * CELL_W - W / 2;
        var y = (r + 0.5) * CELL_H - hy;
        var u = x / a;
        if (u <= -1 || u >= 1) continue;
        var k = 1 - u * u;
        var top = -hy * 0.94 * open * Math.pow(k, 0.62);
        var bot = hy * 0.94 * open * Math.pow(k, 1.05);
        var v = 0;
        var tint = INK;
        var sclera = false;
        if (y >= top && y <= bot) {
          var dx = x - pcx;
          var dy = y - pcy;
          var d = Math.sqrt(dx * dx + dy * dy);
          var hx = x - (pcx - ri * 0.33);
          var hyy = y - (pcy - ri * 0.36);
          if (Math.sqrt(hx * hx + hyy * hyy) < ri * 0.24) {
            v = 1;
            tint = WHITE;
          } else if (d < rp) {
            v = 0.8;
            tint = BROWN_DARK;
          } else if (d < ri) {
            var rr = (d - rp) / (ri - rp);
            var ang = Math.atan2(dy, dx);
            var fiber = 0.5 + 0.5 * Math.sin(ang * 25 + 1.7 * Math.sin(ang * 5)) * (0.6 + 0.4 * Math.cos(rr * 6));
            v = 0.46 + 0.44 * fiber * (1 - 0.35 * rr);
            var limbus = rr > 0.8 ? (rr - 0.8) / 0.2 : 0;
            v *= 1 - 0.7 * limbus;
            tint = IRIS;
          } else {
            sclera = true;
          }
        }
        if (v < 0.9) {
          var dTop = Math.abs(y - top);
          var rim = dTop < rimW ? 1 - dTop / rimW : 0;
          if (rim * 0.95 > v) {
            v = rim * 0.95;
            tint = INK;
            sclera = false;
          }
        }
        if (sclera) {
          ctx.font = FINE_FONT_CSS;
          ctx.fillStyle = INK;
          ctx.globalAlpha = EYE_ALPHA * (0.5 + 0.12 * k);
          for (var sr = 0; sr < SUB; sr++) {
            for (var sc = 0; sc < SUB; sc++) {
              var gi = ((r * SUB + sr + si) * COLS * SUB + (c * SUB + sc)) % CODE.length;
              var glyph = CODE.charAt(gi);
              if (glyph === " ") continue;
              ctx.fillText(glyph, c * CELL_W + (sc + 0.5) * FINE_W, r * CELL_H + (sr + 0.5) * FINE_H);
            }
          }
          continue;
        }
        if (v < 0.07) continue;
        var ch = RAMP[clamp(Math.round(v * (RAMP.length - 1)), 0, RAMP.length - 1)];
        if (ch === " ") continue;
        ctx.font = BLOCK_FONT;
        ctx.globalAlpha = EYE_ALPHA;
        ctx.fillStyle = tint;
        ctx.fillText(ch, (c + 0.5) * CELL_W, (r + 0.5) * CELL_H);
      }
    }
    ctx.globalAlpha = 1;
    return [eyeX + state.floatX + W / 2 + pcx, eyeY + state.floatY + hy + pcy];
  }

  function updateTrace(pupil) {
    if (!SHOW_TRACE || !state.has) {
      trace.style.opacity = "0";
      return;
    }
    trace.style.opacity = "1";
    line.setAttribute("x1", pupil[0].toFixed(2));
    line.setAttribute("y1", pupil[1].toFixed(2));
    line.setAttribute("x2", state.mx.toFixed(2));
    line.setAttribute("y2", state.my.toFixed(2));
    box.setAttribute("x", (state.mx - BOX / 2).toFixed(2));
    box.setAttribute("y", (state.my - BOX / 2).toFixed(2));
  }

  function wander(now) {
    var ang = Math.random() * Math.PI * 2;
    var mag = 0.2 + Math.random() * 0.55;
    state.gtx = Math.cos(ang) * mag;
    state.gty = Math.sin(ang) * mag * 0.8;
    state.wanderAt = now + 1600 + Math.random() * 2800;
  }

  function frame() {
    if (!running) return;
    state.vx = (state.vx + (state.gtx - state.gx) * SPRING) * DAMP;
    state.vy = (state.vy + (state.gty - state.gy) * SPRING) * DAMP;
    state.gx = clamp(state.gx + state.vx, -1.15, 1.15);
    state.gy = clamp(state.gy + state.vy, -1.15, 1.15);

    var now = performance.now();
    var tsec = now / 1000;
    state.scroll = tsec * SCROLL_RATE;

    var placeEase = reduce ? 1 : PLACE_EASE;
    eyeX += (targetX - eyeX) * placeEase;
    eyeY += (targetY - eyeY) * placeEase;

    if (reduce) {
      state.floatX = 0;
      state.floatY = 0;
    } else {
      state.floatX = 0;
      state.floatY = -Math.sin(tsec * 0.85) * 4.5;
    }
    canvas.style.transform =
      "translate(" + Math.round(eyeX + state.floatX) + "px," + Math.round(eyeY + state.floatY) + "px)";

    if (state.mode === "tracking" && !state.elCenter && now - state.lastMove > IDLE_AFTER) {
      state.mode = "idle";
      state.wanderAt = now + 500;
      say("idle", 4000);
    } else if (state.mode === "idle" && now >= state.wanderAt) {
      if (reduce) {
        state.gtx = 0;
        state.gty = 0;
        state.wanderAt = now + 3000;
      } else {
        wander(now);
      }
    }

    state.sleep += (state.sleepTarget - state.sleep) * 0.08;

    if (state.mode !== "sleeping" && now >= state.nextBlink) {
      state.blinkAt = now;
      var base = state.mode === "idle" ? 4500 : 3000;
      var extra = state.mode === "idle" ? 5500 : 4500;
      state.nextBlink = now + base + Math.random() * extra;
    }
    var t = now - state.blinkAt;
    var blink = t >= 0 && t < 160 ? Math.sin((t / 160) * Math.PI) : 0;
    var open = (1 - 0.5 * state.sleep) * (1 - 0.94 * blink);
    updateTrace(draw(open));
    requestAnimationFrame(frame);
  }

  window.addEventListener("pointermove", function (event) {
    state.mx = event.clientX;
    state.my = event.clientY;
    state.has = true;
    state.lastMove = performance.now();
    state.sleepTarget = 0;
    if (state.mode === "sleeping") {
      state.mode = "tracking";
    } else if (state.mode === "idle") {
      state.mode = "tracking";
      hush();
    }
    if (state.elCenter) aimAt(state.elCenter[0], state.elCenter[1]);
    else aimAt(state.mx, state.my);
  }, { passive: true });

  document.addEventListener("pointerover", function (event) {
    var target = event.target;
    var el = target && target.closest ? target.closest(GAZE_SELECTOR) : null;
    if (el !== state.el) setGazeEl(el);
  }, true);

  window.addEventListener("scroll", function () {
    state.lastMove = performance.now();
    if (state.mode === "idle") {
      state.mode = "tracking";
      hush();
    }
    if (!state.el) return;
    var rect = state.el.getBoundingClientRect();
    state.elCenter = [rect.left + rect.width / 2, rect.top + rect.height / 2];
  }, { passive: true });

  function release() {
    state.has = false;
    state.gtx = 0;
    state.gty = 0;
  }

  function onPointerOut(event) {
    if (event.relatedTarget === null) release();
  }

  function sleep() {
    if (state.mode === "sleeping") return;
    state.mode = "sleeping";
    state.sleepTarget = 1;
    state.has = false;
    state.gtx = 0;
    state.gty = 0;
    state.el = null;
    state.elCenter = null;
    hush();
  }

  function wake() {
    var was = state.mode === "sleeping";
    state.sleepTarget = 0;
    state.mode = "tracking";
    state.lastMove = performance.now();
    if (was) {
      state.blinkAt = performance.now();
      say("welcome back", 2600);
    }
  }

  document.addEventListener("pointerleave", release);
  document.addEventListener("pointerout", onPointerOut);
  window.addEventListener("blur", sleep);
  window.addEventListener("focus", wake);
  document.addEventListener("visibilitychange", function () {
    if (document.hidden) sleep();
    else wake();
  });
  window.addEventListener("resize", place);
  window.addEventListener("pageshow", function (event) {
    if (!event.persisted) return;
    placed = false;
    place();
    if (enabled && media.matches) start();
  });

  trace.style.opacity = "0";
  state.lastMove = performance.now();
  state.nextBlink = performance.now() + 2500 + Math.random() * 3000;
  place();

  function start() {
    if (running || !enabled || !media.matches) return;
    running = true;
    requestAnimationFrame(frame);
  }

  function stop() {
    running = false;
  }

  function apply() {
    document.body.classList.toggle("eye-on", enabled);
    if (enabled && media.matches) start();
    else stop();
  }

  function setEnabled(value) {
    enabled = !!value;
    storeSet(enabled ? "on" : "off");
    if (enabled) {
      state.mode = "tracking";
      state.lastMove = performance.now();
      state.gx = state.gy = state.gtx = state.gty = state.vx = state.vy = 0;
      state.sleep = 0;
      state.sleepTarget = 0;
      state.el = null;
      state.elCenter = null;
      hush();
    }
    apply();
  }

  window.__latteEye = {
    toggle: function () {
      setEnabled(!enabled);
      return enabled;
    },
    isOn: function () {
      return enabled;
    }
  };

  function onMediaChange() {
    apply();
  }
  if (media.addEventListener) media.addEventListener("change", onMediaChange);
  else if (media.addListener) media.addListener(onMediaChange);

  apply();
})();
