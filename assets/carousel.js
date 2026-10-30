/* Carrusel de beneficios, en loop infinito.
   ------------------------------------------------------
   Las tarjetas se copian una vez antes y una vez después de la lista
   original. Cuando la persona llega a una de las copias (con las flechas
   o deslizando con el dedo), el carrusel salta sin animación a la misma
   tarjeta de la lista original: se ve como una tira continua, sin tener
   que volver para atrás. Las copias no se leen con lector de pantalla ni
   se recorren con el teclado (solo las originales). */
(function () {
  "use strict";

  document.querySelectorAll(".carousel").forEach(function (carousel) {
    var track = carousel.querySelector(".benefit-grid");
    var prev = carousel.querySelector(".carousel-arrow--prev");
    var next = carousel.querySelector(".carousel-arrow--next");
    if (!track || !prev || !next) return;

    var armando = false;
    var originales = [];
    var anchoSet = 0;

    function copiar(card) {
      var c = card.cloneNode(true);
      c.setAttribute("aria-hidden", "true");
      c.classList.add("is-clone");
      c.querySelectorAll("a, button").forEach(function (el) { el.setAttribute("tabindex", "-1"); });
      return c;
    }

    function saltar(x) {
      // Movimiento instantáneo (sin la animación suave del carrusel)
      track.style.scrollBehavior = "auto";
      track.style.scrollSnapType = "none";
      track.scrollLeft = x;
      track.offsetHeight; // fuerza el reacomodo antes de devolver los estilos
      track.style.scrollSnapType = "";
      track.style.scrollBehavior = "";
    }

    function medir() {
      if (originales.length < 2) return;
      var primerCopiaFinal = track.querySelector(".is-clone-end");
      anchoSet = primerCopiaFinal ? primerCopiaFinal.offsetLeft - originales[0].offsetLeft : 0;
    }

    function armar() {
      armando = true;
      track.querySelectorAll(".is-clone").forEach(function (c) { c.remove(); });
      originales = Array.prototype.slice.call(track.children).filter(function (c) {
        return c.classList.contains("benefit-card");
      });
      if (originales.length < 2) { armando = false; return; }
      var antes = document.createDocumentFragment();
      var despues = document.createDocumentFragment();
      originales.forEach(function (card, i) {
        antes.appendChild(copiar(card));
        var d = copiar(card);
        if (i === 0) d.classList.add("is-clone-end");
        despues.appendChild(d);
      });
      track.insertBefore(antes, track.firstChild);
      track.appendChild(despues);
      medir();
      saltar(anchoSet); // arranca en la primera tarjeta original
      // Las flechas nunca se deshabilitan: siempre hay más tarjetas
      prev.disabled = false;
      next.disabled = false;
      setTimeout(function () { armando = false; }, 0);
    }

    // Si se pasó a las copias, vuelve a la tarjeta equivalente de la lista original
    function acomodar() {
      if (!anchoSet) return;
      if (track.scrollLeft < anchoSet * 0.5) saltar(track.scrollLeft + anchoSet);
      else if (track.scrollLeft > anchoSet * 1.5) saltar(track.scrollLeft - anchoSet);
    }

    function porPagina(dir) {
      acomodar();
      track.scrollBy({ left: dir * track.clientWidth * 0.9, behavior: "smooth" });
    }
    prev.addEventListener("click", function () { porPagina(-1); });
    next.addEventListener("click", function () { porPagina(1); });

    // Cuando termina de moverse (con flechas, mouse o dedo), se acomoda
    var espera = null;
    if ("onscrollend" in window) {
      track.addEventListener("scrollend", acomodar);
    } else {
      track.addEventListener("scroll", function () {
        clearTimeout(espera);
        espera = setTimeout(acomodar, 140);
      });
    }

    window.addEventListener("resize", function () {
      var relativo = anchoSet ? (track.scrollLeft - anchoSet) / anchoSet : 0;
      medir();
      if (anchoSet) saltar(anchoSet + relativo * anchoSet);
    });

    // Si otro script reemplaza las tarjetas (datos de la planilla), se rearma
    new MutationObserver(function () {
      if (!armando) armar();
    }).observe(track, { childList: true });

    armar();
  });
})();
