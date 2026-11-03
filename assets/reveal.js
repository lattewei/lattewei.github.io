(function () {
  try {
    if (sessionStorage.getItem("latte-reveal")) return;
    sessionStorage.setItem("latte-reveal", "1");
    document.documentElement.classList.add("reveal");
  } catch (error) {
    /* private mode / blocked storage: skip animation */
  }
})();
