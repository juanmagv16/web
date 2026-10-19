/* Menú hamburguesa para mobile */
(function () {
  "use strict";
  var toggle = document.getElementById("nav-toggle");
  var nav = document.getElementById("nav-links");
  if (!toggle || !nav) return;

  function close() {
    nav.classList.remove("is-open");
    toggle.setAttribute("aria-expanded", "false");
  }
  function open() {
    nav.classList.add("is-open");
    toggle.setAttribute("aria-expanded", "true");
  }

  toggle.addEventListener("click", function () {
    if (nav.classList.contains("is-open")) close();
    else open();
  });

  // Cerrar al elegir un link o al tocar afuera del menú
  nav.querySelectorAll("a").forEach(function (a) {
    a.addEventListener("click", close);
  });
  document.addEventListener("click", function (e) {
    if (!nav.contains(e.target) && !toggle.contains(e.target)) close();
  });
  window.addEventListener("resize", function () {
    if (window.innerWidth > 1140) close();
  });
})();
