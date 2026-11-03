/* ============================================
   SUBE — widget de hora y clima (header, todas las páginas)
   ------------------------------------------------------
   La hora se calcula 100% en el navegador (Intl.DateTimeFormat
   con zona horaria de Argentina) y nunca puede fallar. El clima
   se pide a Open-Meteo (gratis, sin API key, pensado para
   consultarse directo desde el navegador). Si el clima no
   llega a tiempo o falla, igual se muestra la hora sola —
   el widget nunca rompe el header ni bloquea la carga.
   ============================================ */
(function () {
  "use strict";

  var LAT = -34.9214,
    LON = -57.9544; // La Plata
  var TIMEZONE = "America/Argentina/Buenos_Aires";
  var WEATHER_URL =
    "https://api.open-meteo.com/v1/forecast?latitude=" +
    LAT +
    "&longitude=" +
    LON +
    "&current=temperature_2m,weather_code&timezone=" +
    encodeURIComponent(TIMEZONE);

  var FETCH_TIMEOUT_MS = 5000; // no vale la pena esperar más que esto
  var WEATHER_REFRESH_MS = 15 * 60 * 1000; // el clima no cambia segundo a segundo
  var CLOCK_TICK_MS = 30 * 1000; // suficiente para que el minuto se vea al día

  // Códigos WMO que devuelve Open-Meteo -> ícono + texto corto en español.
  var WEATHER_CODES = {
    0: "☀️",
    1: "🌤️",
    2: "⛅",
    3: "☁️",
    45: "🌫️",
    48: "🌫️",
    51: "🌦️",
    53: "🌦️",
    55: "🌦️",
    61: "🌧️",
    63: "🌧️",
    65: "🌧️",
    71: "🌨️",
    73: "🌨️",
    75: "🌨️",
    80: "🌦️",
    81: "🌦️",
    82: "⛈️",
    95: "⛈️",
    96: "⛈️",
    99: "⛈️",
  };

  function fetchConTimeout(url, ms) {
    var controller = typeof AbortController !== "undefined" ? new AbortController() : null;
    var timer = controller
      ? setTimeout(function () {
          controller.abort();
        }, ms)
      : null;
    return fetch(url, controller ? { signal: controller.signal } : undefined).then(
      function (res) {
        if (timer) clearTimeout(timer);
        return res;
      },
      function (err) {
        if (timer) clearTimeout(timer);
        throw err;
      }
    );
  }

  function horaArgentina() {
    try {
      return new Intl.DateTimeFormat("es-AR", {
        timeZone: TIMEZONE,
        hour: "2-digit",
        minute: "2-digit",
        hourCycle: "h23",
      }).format(new Date());
    } catch (e) {
      return ""; // navegador sin soporte de Intl con timeZone: no mostramos hora rota
    }
  }

  // Día de la semana en Argentina (La Plata): corto para mostrar ("VIE")
  // y completo para lectores de pantalla ("viernes").
  var DIAS = ["domingo", "lunes", "martes", "miércoles", "jueves", "viernes", "sábado"];
  var CORTOS = ["DOM", "LUN", "MAR", "MIÉ", "JUE", "VIE", "SÁB"];
  function diaArgentina() {
    try {
      var en = new Intl.DateTimeFormat("en-US", { timeZone: TIMEZONE, weekday: "short" }).format(new Date());
      var i = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].indexOf(en);
      return i < 0 ? null : { corto: CORTOS[i], largo: DIAS[i] };
    } catch (e) {
      return null;
    }
  }

  // Único estado compartido: la hora se recalcula sola en cada render,
  // el clima queda cacheado acá hasta el próximo refresh.
  var clima = { icono: null, temp: null };

  function span(clase, texto) {
    var s = document.createElement("span");
    s.className = clase;
    s.textContent = texto;
    return s;
  }

  function render(container) {
    var hora = horaArgentina();
    var dia = diaArgentina();
    var hayClima = clima.icono && clima.temp !== null;
    if (!hora && !hayClima) {
      container.hidden = true;
      return;
    }
    container.hidden = false;
    container.textContent = "";
    var leer = [];
    if (hayClima) {
      container.appendChild(span("hw-clima", clima.icono + " " + Math.round(clima.temp) + "°"));
      leer.push(Math.round(clima.temp) + " grados en La Plata");
    }
    if (hayClima && hora) container.appendChild(span("hw-sep", "·"));
    if (hora) {
      container.appendChild(span("hw-hora", (dia ? dia.corto + " " : "") + hora));
      leer.push((dia ? dia.largo + ", " : "") + hora + " horas");
    }
    container.setAttribute("aria-label", leer.join(". "));
  }

  function cargarClima(container) {
    fetchConTimeout(WEATHER_URL, FETCH_TIMEOUT_MS)
      .then(function (res) {
        if (!res.ok) throw new Error("status " + res.status);
        return res.json();
      })
      .then(function (data) {
        var current = data && data.current;
        if (!current || typeof current.temperature_2m !== "number") {
          throw new Error("respuesta sin datos de clima");
        }
        clima.temp = current.temperature_2m;
        clima.icono = WEATHER_CODES[current.weather_code] || "🌡️";
        render(container);
      })
      .catch(function () {
        // Sin clima disponible por ahora: se sigue mostrando la hora sola,
        // no se rompe nada. Se vuelve a intentar en el próximo refresh.
        render(container);
      });
  }

  document.addEventListener("DOMContentLoaded", function () {
    var container = document.getElementById("header-weather");
    if (!container) return;

    render(container); // hora inmediata, no depende de red
    cargarClima(container); // clima en cuanto llegue

    setInterval(function () {
      render(container);
    }, CLOCK_TICK_MS);

    setInterval(function () {
      cargarClima(container);
    }, WEATHER_REFRESH_MS);
  });
})();
