/* ============================================
   SUBE — Próxima Parada (lectura de Programación)
   ------------------------------------------------------
   Sigue el mismo patrón que assets/benefits.js: lee la
   planilla publicada como CSV, es tolerante a que la fila
   de encabezados no sea la primera, e ignora en silencio
   cualquier fila con datos inválidos sin romper el resto
   del sitio.

   Este archivo NO toca el DOM ni dibuja nada todavía.
   Solo calcula y expone el resultado en window.SubeSchedule
   para que un futuro componente visual (el "contador") lo
   consuma cuando se diseñe.

   Zona horaria: Argentina es UTC-3 fijo, sin horario de
   verano desde 2009, así que no hace falta ninguna librería
   de husos horarios: alcanza con un offset constante.
   ============================================ */
(function () {
  "use strict";

  // Copia de la planilla de programación que GitHub actualiza cada hora
  // (scripts/sync_planillas.py; el link de la planilla está en
  // datos/fuentes.json). Si falta o no sirve, se usa el respaldo de abajo.
  var FUENTES_CSV = [
    "datos/programacion.csv",
    // Planilla anterior publicada: se usa solo mientras no exista la copia de arriba.
    "https://docs.google.com/spreadsheets/d/e/2PACX-1vRFybsjITyt2XR-XYTWibjY4PItJ46VK27XJOuHQ0JrJ-tZujG6duyDrwlsTdZLRbJusM-rZyMqxtky/pub?output=csv&gid=141065091&single=true"
  ];

  var AR_OFFSET_MS = 3 * 60 * 60 * 1000; // Argentina = UTC-3 (fijo, sin DST)
  var DAY_MS = 24 * 60 * 60 * 1000;

  var DIA_A_INDICE = {
    domingo: 0,
    lunes: 1,
    martes: 2,
    miercoles: 3,
    jueves: 4,
    viernes: 5,
    sabado: 6,
  };

  // ---------- Helpers compartidos (mismo criterio que benefits.js) ----------
  function stripAccents(s) {
    return String(s || "").normalize("NFD").replace(/[\u0300-\u036f]/g, "");
  }
  function normalizeHeader(h) {
    return stripAccents(h).toLowerCase().trim();
  }
  function normalizeValue(v) {
    return stripAccents(String(v || "")).toLowerCase().trim();
  }

  function parseCSV(rawText) {
    var text = String(rawText).replace(/\r\n/g, "\n").replace(/\r/g, "\n");
    var rows = [],
      row = [],
      field = "",
      inQuotes = false;
    for (var i = 0; i < text.length; i++) {
      var c = text[i];
      if (inQuotes) {
        if (c === '"') {
          if (text[i + 1] === '"') {
            field += '"';
            i++;
          } else {
            inQuotes = false;
          }
        } else {
          field += c;
        }
      } else if (c === '"') {
        inQuotes = true;
      } else if (c === ",") {
        row.push(field);
        field = "";
      } else if (c === "\n") {
        row.push(field);
        rows.push(row);
        row = [];
        field = "";
      } else {
        field += c;
      }
    }
    if (field.length || row.length) {
      row.push(field);
      rows.push(row);
    }
    return rows.filter(function (r) {
      return r.some(function (cell) {
        return cell.trim() !== "";
      });
    });
  }

  function findCol(headers, keywords) {
    for (var i = 0; i < headers.length; i++) {
      var h = normalizeHeader(headers[i]);
      for (var k = 0; k < keywords.length; k++) {
        if (h.indexOf(keywords[k]) !== -1) return i;
      }
    }
    return -1;
  }
  // Igual que findCol, pero exige coincidencia exacta (para no confundir
  // "frecuencia" con "frecuencia_dias", que comparten la palabra "frecuencia").
  function findColExact(headers, names) {
    for (var i = 0; i < headers.length; i++) {
      var h = normalizeHeader(headers[i]);
      if (names.indexOf(h) !== -1) return i;
    }
    return -1;
  }

  // ---------- Validación de cada campo ----------
  function parseDiaSemana(raw) {
    var v = normalizeValue(raw);
    return DIA_A_INDICE.hasOwnProperty(v) ? v : null;
  }
  function parseHora(raw) {
    var m = /^([01]?\d|2[0-3]):([0-5]\d)$/.exec(String(raw || "").trim());
    if (!m) return null;
    return { h: parseInt(m[1], 10), m: parseInt(m[2], 10) };
  }
  function parseFrecuenciaDias(raw) {
    var n = parseInt(String(raw || "").trim(), 10);
    if (!isFinite(n) || n <= 0) return null;
    return n;
  }
  function parseFechaReferencia(raw) {
    var m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(String(raw || "").trim());
    if (!m) return null;
    var y = parseInt(m[1], 10),
      mo = parseInt(m[2], 10),
      d = parseInt(m[3], 10);
    var ms = Date.UTC(y, mo - 1, d);
    var check = new Date(ms);
    // Rechaza fechas imposibles (ej: 2026-02-30), que Date "normaliza" en
    // vez de fallar.
    if (check.getUTCFullYear() !== y || check.getUTCMonth() !== mo - 1 || check.getUTCDate() !== d) {
      return null;
    }
    return ms; // medianoche UTC de ese día calendario, usado solo como contador de días
  }
  function parseActivo(raw) {
    var v = normalizeValue(raw); // normalizeValue ya saca tildes: "sí" -> "si"
    if (v === "si") return true;
    if (v === "no") return false;
    return null; // cualquier otro valor -> dato inválido, no "sí" ni "no"
  }

  // ---------- Reloj de Argentina (UTC-3 fijo) ----------
  // Devuelve un Date cuyos getters UTC (getUTCFullYear, getUTCHours, etc.)
  // representan la hora de pared en Argentina en este instante, sin
  // depender del huso horario del dispositivo del visitante.
  function nowInArgentina() {
    return new Date(Date.now() - AR_OFFSET_MS);
  }
  function todayUTCms(argentinaNow) {
    return Date.UTC(argentinaNow.getUTCFullYear(), argentinaNow.getUTCMonth(), argentinaNow.getUTCDate());
  }

  /**
   * Calcula el próximo instante (epoch real, en UTC) en que un programa
   * sale al aire, a partir de "ahora". Devuelve null si el programa ya
   * no tiene próximas emisiones calculables (no debería pasar con datos
   * válidos, pero se cubre por las dudas).
   */
  function proximaEmisionUTC(fechaReferenciaMs, frecuenciaDias, horaObj, referenciaHoy) {
    var hoyMs = todayUTCms(referenciaHoy);
    var diasPasados = Math.round((hoyMs - fechaReferenciaMs) / DAY_MS);
    var resto = ((diasPasados % frecuenciaDias) + frecuenciaDias) % frecuenciaDias;
    var diasHastaProxima = resto === 0 ? 0 : frecuenciaDias - resto;
    var candidatoDiaMs = hoyMs + diasHastaProxima * DAY_MS;

    // Instante real (UTC) de la emisión: la hora está en horario argentino,
    // así que para pasar a UTC hay que sumarle el offset (+3 h).
    var candidatoUTC = candidatoDiaMs + (horaObj.h * 60 + horaObj.m) * 60 * 1000 + AR_OFFSET_MS;

    // Si el candidato es "hoy" pero el horario ya pasó, saltamos un ciclo completo.
    if (candidatoUTC <= Date.now()) {
      candidatoUTC += frecuenciaDias * DAY_MS;
    }
    return candidatoUTC;
  }

  function diaSemanaDeFecha(ms) {
    // getUTCDay() sobre una medianoche UTC "pura" da el día de semana real
    // de ese calendario, 0=domingo.
    var idx = new Date(ms).getUTCDay();
    for (var nombre in DIA_A_INDICE) {
      if (DIA_A_INDICE[nombre] === idx) return nombre;
    }
    return null;
  }

  // ---------- Parseo de una fila a un programa válido (o null) ----------
  function filaAPrograma(row, cols) {
    var programa = (row[cols.programa] || "").trim();
    if (!programa) return null;

    var activo = parseActivo(row[cols.activo]);
    if (activo === null) return null; // valor de "activo" inválido -> fila inválida, se descarta
    if (activo === false) return null; // activo = no -> se ignora, no participa del cálculo

    var dia = parseDiaSemana(row[cols.dia_semana]);
    var hora = parseHora(row[cols.hora]);
    var frecuenciaDias = parseFrecuenciaDias(row[cols.frecuencia_dias]);
    var fechaRefMs = parseFechaReferencia(row[cols.fecha_referencia]);

    // Cualquier campo inválido -> se descarta la fila entera, sin romper
    // el resto (requisito explícito del proyecto).
    if (!dia || !hora || !frecuenciaDias || fechaRefMs === null) return null;

    // Chequeo de consistencia: si la fecha_referencia no cae realmente en
    // el día de semana declarado, hay un error de carga -> se descarta.
    if (diaSemanaDeFecha(fechaRefMs) !== dia) return null;

    return {
      programa: programa,
      dia_semana: dia,
      hora: hora,
      frecuencia: cols.frecuencia !== -1 ? (row[cols.frecuencia] || "").trim() : "",
      frecuencia_dias: frecuenciaDias,
      fecha_referencia_ms: fechaRefMs,
      temporada: cols.temporada !== -1 ? (row[cols.temporada] || "").trim() : "",
    };
  }

  // ---------- Cálculo público ----------
  var cachedPrograms = null; // últimos programas válidos leídos de la hoja

  function calcularProximaParada(programs, referenciaHoy) {
    referenciaHoy = referenciaHoy || nowInArgentina();
    var mejor = null;
    programs.forEach(function (p) {
      var utc = proximaEmisionUTC(p.fecha_referencia_ms, p.frecuencia_dias, p.hora, referenciaHoy);
      if (!isFinite(utc)) return; // defensivo: no hay próxima emisión calculable, se descarta
      if (mejor === null || utc < mejor.utc) {
        mejor = { programa: p.programa, utc: utc, temporada: p.temporada, dia_semana: p.dia_semana, hora: p.hora };
      }
    });
    return mejor;
  }

  function calcularProximasEmisiones(programs, cantidadPorPrograma, referenciaHoy) {
    referenciaHoy = referenciaHoy || nowInArgentina();
    var resultado = [];
    programs.forEach(function (p) {
      var acumulado = [];
      var base = referenciaHoy;
      for (var i = 0; i < cantidadPorPrograma; i++) {
        var utc = proximaEmisionUTC(p.fecha_referencia_ms, p.frecuencia_dias, p.hora, base);
        acumulado.push(utc);
        // Para la siguiente vuelta, "hoy" pasa a ser el día después de esta emisión.
        base = new Date(utc + DAY_MS - AR_OFFSET_MS);
      }
      resultado.push({ programa: p.programa, emisiones_utc: acumulado });
    });
    return resultado;
  }

  // ---------- Copia local de respaldo (fallback) ----------
  // Última programación validada manualmente en la conversación con SUBE.
  // Está escrita como CSV, con las mismas columnas exactas que la hoja
  // real, para que pase por el mismo parseo y las mismas validaciones
  // que el dato en vivo — cero lógica duplicada. Para actualizarla,
  // alcanza con editar este texto (no hay que tocar ninguna función).
  var FALLBACK_CSV =
    "programa,dia_semana,hora,frecuencia,frecuencia_dias,fecha_referencia,temporada,activo\n" +
    "Streaming Copa,lunes,18:00,semanal,7,2026-08-24,2026,si\n" +
    "Marcando la cancha,lunes,19:30,semanal,7,2026-08-24,2026,si\n" +
    "F@lopa informativa nacional,lunes,21:00,semanal,7,2026-08-24,2026,si\n" +
    "El amplificador,jueves,18:00,semanal,7,2026-08-27,2026,si\n" +
    "Estacion freak,jueves,19:30,quincenal,14,2026-09-03,2026,si\n" +
    "De que viven,jueves,20:00,quincenal,14,2026-08-27,2026,si\n" +
    "Chicha y limonada,jueves,21:30,semanal,7,2026-08-27,2026,si\n";

  var FETCH_TIMEOUT_MS = 6000; // no bloquea la Home: a los 6s se corta y se usa el fallback

  // fetch() con límite de tiempo, usando AbortController nativo (sin
  // dependencias externas). Si la hoja tarda más de FETCH_TIMEOUT_MS,
  // se aborta el pedido y se sigue con el fallback.
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

  // Todo el parseo de un texto CSV de Programación a una lista de
  // programas válidos, en un solo lugar: lo usan tanto la hoja real
  // como el fallback, así que cualquier corrección de validación se
  // escribe una sola vez.
  function parsearProgramacion(text) {
    var rows = parseCSV(text);
    if (rows.length < 2) return [];

    var cols = null;
    for (var h = 0; h < Math.min(rows.length, 6); h++) {
      var candidate = rows[h];
      var progCol = findCol(candidate, ["programa"]);
      var diaCol = findCol(candidate, ["dia_semana", "dia semana", "diasemana"]);
      if (progCol !== -1 && diaCol !== -1) {
        cols = {
          headerRowIndex: h,
          programa: progCol,
          dia_semana: diaCol,
          hora: findCol(candidate, ["hora"]),
          frecuencia_dias: (function () {
            var exact = findColExact(candidate.map(normalizeHeader), ["frecuencia_dias", "frecuencia dias"]);
            return exact !== -1 ? exact : findCol(candidate, ["frecuencia_dias", "frecuencia dias"]);
          })(),
          frecuencia: findColExact(candidate.map(normalizeHeader), ["frecuencia"]),
          fecha_referencia: findCol(candidate, ["fecha_referencia", "fecha referencia", "referencia"]),
          temporada: findCol(candidate, ["temporada"]),
          activo: findCol(candidate, ["activo"]),
        };
        break;
      }
    }
    if (!cols || cols.hora === -1 || cols.frecuencia_dias === -1 || cols.fecha_referencia === -1 || cols.activo === -1) {
      return [];
    }

    var programas = [];
    for (var r = cols.headerRowIndex + 1; r < rows.length; r++) {
      var p = filaAPrograma(rows[r], cols);
      if (p) programas.push(p);
    }
    return programas;
  }

  // ---------- Carga desde Google Sheets, con fallback automático ----------
  var ultimaFuente = "ninguna"; // "sheets" | "fallback" | "ninguna"
  var ultimoError = null;

  function intentar(i) {
    return fetchConTimeout(FUENTES_CSV[i], FETCH_TIMEOUT_MS)
      .then(function (res) {
        if (!res.ok) throw new Error("status " + res.status);
        return res.text();
      })
      .then(function (text) {
        var programas = parsearProgramacion(text);
        // "Datos inválidos" también cuenta como fallo: si la hoja respondió
        // pero no reconocimos ni un solo programa válido (encabezados
        // movidos, pestaña equivocada, todo marcado inactivo, etc.), se
        // considera que la fuente principal no sirvió esta vez.
        if (!programas.length) throw new Error("la hoja respondió pero sin programas válidos");
        ultimaFuente = "sheets";
        ultimoError = null;
        return programas;
      })
      .catch(function (err) {
        if (i + 1 < FUENTES_CSV.length) return intentar(i + 1);
        throw err;
      });
  }

  function cargar() {
    return intentar(0)
      .catch(function (err) {
        ultimoError = String((err && err.message) || err);
        var fallback = parsearProgramacion(FALLBACK_CSV);
        ultimaFuente = fallback.length ? "fallback" : "ninguna";
        return fallback; // puede ser [] si hasta el fallback fallara (no debería)
      });
  }

  var loadPromise = cargar().then(function (programas) {
    cachedPrograms = programas;
    return programas;
  });

  // ---------- API pública ----------
  window.SubeSchedule = {
    // Devuelve una Promise que resuelve cuando termina de leer/parsear
    // (ya sea desde la hoja o, si hizo falta, desde el fallback).
    ready: loadPromise,
    // { programa, utc, dia_semana, hora, temporada } | null (sin datos válidos)
    getNextStop: function () {
      if (!cachedPrograms || !cachedPrograms.length) return null;
      return calcularProximaParada(cachedPrograms);
    },
    // Útil para debug/verificación: las próximas N emisiones de cada programa.
    getUpcoming: function (n) {
      if (!cachedPrograms || !cachedPrograms.length) return [];
      return calcularProximasEmisiones(cachedPrograms, n || 3);
    },
    // "sheets" | "fallback" | "ninguna" — de dónde salió el dato actual.
    getSource: function () {
      return ultimaFuente;
    },
    // Motivo por el que se recurrió al fallback (null si vino de Sheets).
    getLastError: function () {
      return ultimoError;
    },
    // Lista completa de programas activos y válidos (Sheets, o el
    // fallback local si la hoja no respondió). La usa la grilla de
    // Programación en Contenidos para no duplicar los horarios en HTML.
    getAllPrograms: function () {
      return cachedPrograms ? cachedPrograms.slice() : [];
    },
  };
})();
