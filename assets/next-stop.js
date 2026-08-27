/* ============================================
   SUBE — bloque "PRÓXIMA PARADA" (Home)
   ------------------------------------------------------
   No lee ni calcula nada por su cuenta: solo consume
   window.SubeSchedule (assets/schedule.js) y dibuja el
   resultado. schedule.js ya se encarga de tener un
   fallback local si Google Sheets falla, así que acá solo
   queda cubrir el caso extremo de que ni siquiera el
   fallback tenga un programa calculable — en ese caso se
   muestra un mensaje amigable, nunca se deja el bloque vacío.
   ============================================ */
(function () {
  "use strict";

  var AR_OFFSET_MS = 3 * 60 * 60 * 1000; // Argentina UTC-3 fijo
  var DIAS_IDX = ["domingo", "lunes", "martes", "miercoles", "jueves", "viernes", "sabado"];
  var DIA_LABEL = {
    domingo: "Domingo",
    lunes: "Lunes",
    martes: "Martes",
    miercoles: "Miércoles",
    jueves: "Jueves",
    viernes: "Viernes",
    sabado: "Sábado",
  };

  function pad(n) {
    return String(n).length < 2 ? "0" + n : String(n);
  }
  function escapeHtml(s) {
    return String(s == null ? "" : s)
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;");
  }

  function fechaYHoraArgentina(utcMs) {
    var d = new Date(utcMs - AR_OFFSET_MS);
    return {
      diaSemana: DIA_LABEL[DIAS_IDX[d.getUTCDay()]],
      fecha: pad(d.getUTCDate()) + "/" + pad(d.getUTCMonth() + 1),
      hora: pad(d.getUTCHours()) + ":" + pad(d.getUTCMinutes()),
    };
  }

  function unidadHtml(valor, etiqueta) {
    return (
      '<div class="cd-unit"><span class="cd-num">' +
      valor +
      '</span><span class="cd-label">' +
      etiqueta +
      "</span></div>"
    );
  }

  var timerId = null;
  var enVivo = false;

  function pintarInicial(container, stop) {
    var cuando = fechaYHoraArgentina(stop.utc);
    container.hidden = false;
    container.innerHTML =
      '<p class="next-stop-label">Próxima parada</p>' +
      '<p class="next-stop-program">' +
      escapeHtml(stop.programa) +
      "</p>" +
      '<p class="next-stop-when">' +
      cuando.diaSemana +
      " " +
      cuando.fecha +
      " · " +
      cuando.hora +
      " hs</p>" +
      '<div class="next-stop-countdown" id="next-stop-countdown"></div>';
  }

  function pintarEnVivo(container, stop) {
    container.innerHTML =
      '<p class="next-stop-label next-stop-label--live">Ahora en SUBE</p>' +
      '<p class="next-stop-program">' +
      escapeHtml(stop.programa) +
      "</p>";
  }

  function tick(container, stop) {
    var diff = stop.utc - Date.now();

    if (diff <= 0) {
      if (!enVivo) {
        enVivo = true;
        pintarEnVivo(container, stop);
        if (timerId) {
          clearInterval(timerId);
          timerId = null;
        }
      }
      return;
    }

    var countdownEl = document.getElementById("next-stop-countdown");
    if (!countdownEl) return; // el bloque se re-renderizó por otro motivo

    var totalSeg = Math.floor(diff / 1000);
    var dias = Math.floor(totalSeg / 86400);
    var horas = Math.floor((totalSeg % 86400) / 3600);
    var minutos = Math.floor((totalSeg % 3600) / 60);
    var segundos = totalSeg % 60;

    countdownEl.innerHTML =
      unidadHtml(dias, dias === 1 ? "día" : "días") +
      unidadHtml(pad(horas), "hs") +
      unidadHtml(pad(minutos), "min") +
      unidadHtml(pad(segundos), "seg");
  }

  function iniciar(container, stop) {
    pintarInicial(container, stop);
    timerId = setInterval(function () {
      tick(container, stop);
    }, 1000);
    tick(container, stop); // primer pintado inmediato, sin esperar 1s
  }

  function pintarSinDatos(container) {
    container.hidden = false;
    container.innerHTML =
      '<p class="next-stop-label">Próxima parada</p>' +
      '<p class="next-stop-empty">Estamos preparando la próxima parada.</p>';
  }

  document.addEventListener("DOMContentLoaded", function () {
    var container = document.getElementById("next-stop");
    if (!container || !window.SubeSchedule) return;

    window.SubeSchedule.ready.then(function () {
      var stop = window.SubeSchedule.getNextStop();
      if (!stop) {
        // Ni la hoja ni el fallback local tenían un programa calculable:
        // igual mostramos algo amigable, nunca dejamos el bloque vacío.
        pintarSinDatos(container);
        return;
      }
      iniciar(container, stop);
    });
  });
})();
