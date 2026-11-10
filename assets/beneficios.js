/* ============================================
   SUBE — Comunidad: beneficios en grilla
   ------------------------------------------------------
   - Filtra las tarjetas por rubro (los botones los arma build_site.py
     con los rubros de la planilla).
   - En el celular muestra los primeros y un botón «Ver los N beneficios»,
     para que la página no quede eterna.
   Sin JavaScript se ven todas las tarjetas, sin filtros.
   ============================================ */
(function () {
  "use strict";

  var grid = document.getElementById("benefit-grid");
  if (!grid) return;
  var filtros = document.getElementById("benefit-filters");
  var mas = document.getElementById("benefit-more");
  var vacio = document.getElementById("benefit-empty");
  var PRIMEROS = 4;            // cuántos se ven de entrada en el celular
  var rubro = "";
  var abierto = false;

  function tarjetas() {
    return Array.prototype.slice.call(grid.querySelectorAll(".benefit-card"));
  }
  function esCelular() {
    return window.matchMedia("(max-width: 640px)").matches;
  }

  function pintar() {
    var visibles = 0;
    var recortar = esCelular() && !abierto && !rubro;
    tarjetas().forEach(function (card) {
      var coincide = !rubro || card.getAttribute("data-rubro") === rubro;
      var mostrar = coincide && (!recortar || visibles < PRIMEROS);
      card.hidden = !mostrar;
      if (coincide) visibles++;
    });
    if (vacio) vacio.hidden = visibles > 0;
    if (mas) mas.hidden = !(recortar && visibles > PRIMEROS);
  }

  if (filtros) {
    filtros.addEventListener("click", function (e) {
      var btn = e.target.closest("[data-rubro]");
      if (!btn) return;
      rubro = btn.getAttribute("data-rubro");
      Array.prototype.forEach.call(filtros.querySelectorAll("[data-rubro]"), function (b) {
        var activo = b === btn;
        b.classList.toggle("is-active", activo);
        b.setAttribute("aria-pressed", activo ? "true" : "false");
      });
      pintar();
    });
  }
  if (mas) {
    mas.addEventListener("click", function () { abierto = true; pintar(); });
  }
  window.addEventListener("resize", pintar);
  pintar();
})();
