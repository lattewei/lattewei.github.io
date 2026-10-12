(function () {
  var avatar = document.querySelector(".avatar");
  if (!avatar || !window.__latteEye) return;
  var clicks = [];
  avatar.addEventListener("click", function () {
    var now = Date.now();
    clicks = clicks.filter(function (time) {
      return now - time < 500;
    });
    clicks.push(now);
    if (clicks.length >= 3) {
      clicks = [];
      window.__latteEye.toggle();
    }
  });
})();
