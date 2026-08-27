/* ============================================
   SUBE — grilla de Programación (Contenidos)
   ------------------------------------------------------
   No lee Google Sheets por su cuenta: usa exactamente los
   mismos datos ya parseados por assets/schedule.js (la misma
   fuente que calcula "Próxima Parada"), para que el horario
   de cada programa exista en un solo lugar.

   El HTML estático de Lunes/Jueves que trae la página al
   cargar queda como contenido de respaldo: si por lo que sea
   no llegan datos válidos (Sheets caído y hasta el fallback
   de schedule.js fallara), esos dos bloques se dejan tal
   cual están, sin romper nada. El bloque "On demand" nunca
   se toca — no sale de la planilla.
   ============================================ */
(function () {
  "use strict";

  // Nombre del programa (tal como está escrito en la planilla) -> slug de
  // su página en /programas/. Es la única lista que hay que tocar si se
  // renombra un programa en la hoja o se agrega uno nuevo con página propia.
  var SLUGS = {
    "streaming copa": "streaming-copa",
    "marcando la cancha": "marcando-la-cancha",
    "falopa informativa nacional": "falopa-informativa-nacional",
    "flopa informativa nacional": "falopa-informativa-nacional",
    "f4lopa informativa nacional": "falopa-informativa-nacional",
    "fin falopa informativa nacional": "falopa-informativa-nacional",
    "fin flopa informativa nacional": "falopa-informativa-nacional",
    "fin f4lopa informativa nacional": "falopa-informativa-nacional",
    "el amplificador": "el-amplificador",
    "estacion freak": "estacion-freak",
    "de que viven": "de-que-viven",
    "chicha y limonada": "chicha-y-limonada",
  };

  var DIAS_LABEL = {
    lunes: "Lunes",
    martes: "Martes",
    miercoles: "Miércoles",
    jueves: "Jueves",
    viernes: "Viernes",
    sabado: "Sábado",
    domingo: "Domingo",
  };
  var DIAS_ORDEN = ["lunes", "martes", "miercoles", "jueves", "viernes", "sabado", "domingo"];

  function normalizar(s) {
    return String(s || "")
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .toLowerCase()
      .replace(/[¿?¡!@]/g, "")
      .replace(/\s+/g, " ")
      .trim();
  }

  function slugPara(nombrePrograma) {
    return SLUGS[normalizar(nombrePrograma)] || null;
  }

  function pad(n) {
    return String(n).length < 2 ? "0" + n : String(n);
  }

  function escapeHtml(s) {
    return String(s == null ? "" : s)
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;");
  }

  function itemHtml(p) {
    var slug = slugPara(p.programa);
    var horaTexto = pad(p.hora.h) + ":" + pad(p.hora.m);
    var nombreHtml = slug
      ? '<a href="programas/' + slug + '.html">' + escapeHtml(p.programa) + "</a>"
      : "<span>" + escapeHtml(p.programa) + "</span>";
    var alt = p.frecuencia_dias >= 14 ? '<span class="schedule-alt">Cada dos semanas</span>' : "";
    return (
      "<li><span class=\"schedule-time\">" + horaTexto + "</span>" + nombreHtml + alt + "</li>"
    );
  }

  function diaHtml(dia, items) {
    items.sort(function (a, b) {
      return a.hora.h * 60 + a.hora.m - (b.hora.h * 60 + b.hora.m);
    });
    return (
      '<div class="schedule-day"><h3>' +
      DIAS_LABEL[dia] +
      '</h3><ul class="schedule-list">' +
      items.map(itemHtml).join("") +
      "</ul></div>"
    );
  }

  function render(container, ondemandBlock, programas) {
    if (!programas.length) return; // sin datos calculables: se deja el respaldo estático

    var porDia = {};
    programas.forEach(function (p) {
      if (!porDia[p.dia_semana]) porDia[p.dia_semana] = [];
      porDia[p.dia_semana].push(p);
    });

    var html = DIAS_ORDEN.filter(function (d) {
      return porDia[d] && porDia[d].length;
    })
      .map(function (d) {
        return diaHtml(d, porDia[d]);
      })
      .join("");

    if (!html) return;

    // Sacamos únicamente los bloques de día generados a mano (Lunes/Jueves),
    // dejando el de "On demand" exactamente donde está, para no tocar ese
    // pedazo de diseño ni su posición dentro del contenedor.
    Array.prototype.slice.call(container.querySelectorAll(".schedule-day")).forEach(function (el) {
      if (el !== ondemandBlock) el.remove();
    });
    ondemandBlock.insertAdjacentHTML("beforebegin", html);
  }

  document.addEventListener("DOMContentLoaded", function () {
    var container = document.getElementById("content-schedule");
    var ondemandBlock = document.getElementById("schedule-ondemand-block");
    if (!container || !ondemandBlock || !window.SubeSchedule) return;

    window.SubeSchedule.ready.then(function () {
      var programas = window.SubeSchedule.getAllPrograms();
      render(container, ondemandBlock, programas);
    });
  });
})();
