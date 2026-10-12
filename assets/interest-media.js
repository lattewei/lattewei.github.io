(function () {
  var root = document.querySelector("[data-interest-media]");
  if (!root) return;
  var name = root.getAttribute("data-interest-media");
  var exts = ["jpg", "jpeg", "png", "webp"];

  function probe(n) {
    var remaining = exts.length;
    var taken = false;
    exts.forEach(function (ext) {
      var img = new Image();
      img.onload = function () {
        if (taken) return;
        taken = true;
        img.alt = "";
        root.appendChild(img);
        probe(n + 1);
      };
      img.onerror = function () {
        remaining -= 1;
      };
      img.src = "../assets/interests/" + name + "/" + n + "." + ext;
    });
  }

  probe(1);
})();
