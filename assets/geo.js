/* ============================================
   SUBE — geolocalización de comercios
   ------------------------------------------------------
   Decodifica "Plus Codes" (Open Location Code) de forma
   100% local, sin llamar a ninguna API externa. El algoritmo
   de decodificación es una versión reducida, adaptada del
   original de Google (Apache License 2.0):
   https://github.com/google/open-location-code

   También calcula la distancia entre el usuario y cada
   comercio (fórmula de Haversine) cuando el visitante activa
   su ubicación.
   ============================================ */
(function () {
  "use strict";

  // ---------- Decodificador de Plus Codes (OLC), reducido ----------
  var CODE_ALPHABET = "23456789CFGHJMPQRVWX";
  var SEPARATOR = "+";
  var SEPARATOR_POSITION = 8;
  var ENCODING_BASE = CODE_ALPHABET.length;
  var LATITUDE_MAX = 90;
  var LONGITUDE_MAX = 180;
  var PAIR_CODE_LENGTH = 10;
  var PAIR_FIRST_PLACE_VALUE = Math.pow(ENCODING_BASE, PAIR_CODE_LENGTH / 2 - 1);
  var PAIR_PRECISION = Math.pow(ENCODING_BASE, 3);
  var GRID_COLUMNS = 4;
  var GRID_ROWS = 5;
  var MAX_DIGIT_COUNT = 15;
  var GRID_CODE_LENGTH = MAX_DIGIT_COUNT - PAIR_CODE_LENGTH;
  var GRID_LAT_FIRST_PLACE_VALUE = Math.pow(GRID_ROWS, GRID_CODE_LENGTH - 1);
  var GRID_LNG_FIRST_PLACE_VALUE = Math.pow(GRID_COLUMNS, GRID_CODE_LENGTH - 1);
  var FINAL_LAT_PRECISION = PAIR_PRECISION * Math.pow(GRID_ROWS, GRID_CODE_LENGTH);
  var FINAL_LNG_PRECISION = PAIR_PRECISION * Math.pow(GRID_COLUMNS, GRID_CODE_LENGTH);

  function clipLatitude(lat) {
    return Math.min(90, Math.max(-90, lat));
  }
  function normalizeLongitude(lng) {
    while (lng < -180) lng += 360;
    while (lng >= 180) lng -= 360;
    return lng;
  }

  function isValidOlc(code) {
    if (!code || typeof code !== "string") return false;
    if (code.indexOf(SEPARATOR) === -1) return false;
    if (code.indexOf(SEPARATOR) !== code.lastIndexOf(SEPARATOR)) return false;
    if (code.indexOf(SEPARATOR) > SEPARATOR_POSITION || code.indexOf(SEPARATOR) % 2 === 1) return false;
    var stripped = code.replace("+", "");
    for (var i = 0; i < stripped.length; i++) {
      if (CODE_ALPHABET.indexOf(stripped.charAt(i).toUpperCase()) === -1) return false;
    }
    return true;
  }
  function isShortOlc(code) {
    return isValidOlc(code) && code.indexOf(SEPARATOR) < SEPARATOR_POSITION;
  }

  function locationToIntegers(lat, lng) {
    var latVal = Math.floor(lat * FINAL_LAT_PRECISION) + LATITUDE_MAX * FINAL_LAT_PRECISION;
    latVal = Math.max(0, Math.min(latVal, 2 * LATITUDE_MAX * FINAL_LAT_PRECISION - 1));
    var lngVal = Math.floor(lng * FINAL_LNG_PRECISION) + LONGITUDE_MAX * FINAL_LNG_PRECISION;
    var full = 2 * LONGITUDE_MAX * FINAL_LNG_PRECISION;
    lngVal = ((lngVal % full) + full) % full;
    return [latVal, lngVal];
  }

  function encodeIntegers(latInt, lngInt, codeLength) {
    var code = new Array(MAX_DIGIT_COUNT + 1);
    code[SEPARATOR_POSITION] = SEPARATOR;
    if (codeLength > PAIR_CODE_LENGTH) {
      for (var i = MAX_DIGIT_COUNT - PAIR_CODE_LENGTH; i >= 1; i--) {
        var latDigit = latInt % GRID_ROWS;
        var lngDigit = lngInt % GRID_COLUMNS;
        code[SEPARATOR_POSITION + 2 + i] = CODE_ALPHABET.charAt(latDigit * GRID_COLUMNS + lngDigit);
        latInt = Math.floor(latInt / GRID_ROWS);
        lngInt = Math.floor(lngInt / GRID_COLUMNS);
      }
    } else {
      latInt = Math.floor(latInt / Math.pow(GRID_ROWS, GRID_CODE_LENGTH));
      lngInt = Math.floor(lngInt / Math.pow(GRID_COLUMNS, GRID_CODE_LENGTH));
    }
    code[SEPARATOR_POSITION + 1] = CODE_ALPHABET.charAt(latInt % ENCODING_BASE);
    code[SEPARATOR_POSITION + 2] = CODE_ALPHABET.charAt(lngInt % ENCODING_BASE);
    latInt = Math.floor(latInt / ENCODING_BASE);
    lngInt = Math.floor(lngInt / ENCODING_BASE);
    for (var j = PAIR_CODE_LENGTH / 2 + 1; j >= 0; j -= 2) {
      code[j] = CODE_ALPHABET.charAt(latInt % ENCODING_BASE);
      code[j + 1] = CODE_ALPHABET.charAt(lngInt % ENCODING_BASE);
      latInt = Math.floor(latInt / ENCODING_BASE);
      lngInt = Math.floor(lngInt / ENCODING_BASE);
    }
    if (codeLength >= SEPARATOR_POSITION) return code.slice(0, codeLength + 1).join("");
    return code.slice(0, codeLength).join("") + Array(SEPARATOR_POSITION - codeLength + 1).join("0") + SEPARATOR;
  }
  function encodeOlc(lat, lng, codeLength) {
    codeLength = codeLength || 10;
    var ints = locationToIntegers(lat, lng);
    return encodeIntegers(ints[0], ints[1], codeLength);
  }

  function decodeOlc(code) {
    code = code.replace("+", "").replace(/0/g, "").toUpperCase();
    var normalLat = -LATITUDE_MAX * PAIR_PRECISION;
    var normalLng = -LONGITUDE_MAX * PAIR_PRECISION;
    var digits = Math.min(code.length, PAIR_CODE_LENGTH);
    var pv = PAIR_FIRST_PLACE_VALUE;
    for (var i = 0; i < digits; i += 2) {
      normalLat += CODE_ALPHABET.indexOf(code.charAt(i)) * pv;
      normalLng += CODE_ALPHABET.indexOf(code.charAt(i + 1)) * pv;
      if (i < digits - 2) pv /= ENCODING_BASE;
    }
    var latPrecision = pv / PAIR_PRECISION;
    var lngPrecision = pv / PAIR_PRECISION;
    var gridLat = 0, gridLng = 0;
    if (code.length > PAIR_CODE_LENGTH) {
      var rowpv = GRID_LAT_FIRST_PLACE_VALUE;
      var colpv = GRID_LNG_FIRST_PLACE_VALUE;
      var d2 = Math.min(code.length, MAX_DIGIT_COUNT);
      for (var j = PAIR_CODE_LENGTH; j < d2; j++) {
        var digitVal = CODE_ALPHABET.indexOf(code.charAt(j));
        var row = Math.floor(digitVal / GRID_COLUMNS);
        var col = digitVal % GRID_COLUMNS;
        gridLat += row * rowpv;
        gridLng += col * colpv;
        if (j < d2 - 1) { rowpv /= GRID_ROWS; colpv /= GRID_COLUMNS; }
      }
      latPrecision = rowpv / FINAL_LAT_PRECISION;
      lngPrecision = colpv / FINAL_LNG_PRECISION;
    }
    var lat = normalLat / PAIR_PRECISION + gridLat / FINAL_LAT_PRECISION;
    var lng = normalLng / PAIR_PRECISION + gridLng / FINAL_LNG_PRECISION;
    // Centro de la celda (igual que CodeArea.latitudeCenter/longitudeCenter
    // en la librería oficial), no la esquina SO.
    return {
      lat: Math.min(lat + latPrecision / 2, LATITUDE_MAX),
      lng: Math.min(lng + lngPrecision / 2, LONGITUDE_MAX),
    };
  }

  function recoverNearestOlc(shortCode, refLat, refLng) {
    if (!isShortOlc(shortCode)) return null;
    refLat = clipLatitude(Number(refLat));
    refLng = normalizeLongitude(Number(refLng));
    shortCode = shortCode.toUpperCase();
    var paddingLength = SEPARATOR_POSITION - shortCode.indexOf(SEPARATOR);
    var resolution = Math.pow(20, 2 - paddingLength / 2);
    var half = resolution / 2;
    var prefix = encodeOlc(refLat, refLng, 10).substr(0, paddingLength);
    var area = decodeOlc(prefix + shortCode);
    if (refLat + half < area.lat && area.lat - resolution >= -LATITUDE_MAX) area.lat -= resolution;
    else if (refLat - half > area.lat && area.lat + resolution <= LATITUDE_MAX) area.lat += resolution;
    if (refLng + half < area.lng) area.lng -= resolution;
    else if (refLng - half > area.lng) area.lng += resolution;
    return area;
  }

  // Punto de referencia para recuperar Plus Codes cortos: centro de La Plata.
  var LA_PLATA_REF = { lat: -34.9214, lng: -57.9544 };

  function isPlusCode(text) {
    if (!text) return false;
    var candidate = text.trim().split(/\s|,/)[0]; // la parte antes del nombre de ciudad
    return isValidOlc(candidate);
  }

  /**
   * Intenta extraer lat/lng de un texto de ubicación. Devuelve {lat,lng} o
   * null si no se reconoce el formato (por ejemplo, una dirección de calle
   * común, que no se puede geocodificar sin un servicio externo).
   */
  function coordsFromLocationText(text) {
    if (!text) return null;
    var candidate = text.trim().split(/\s|,/)[0];
    if (!isValidOlc(candidate)) return null;
    try {
      var area = isShortOlc(candidate)
        ? recoverNearestOlc(candidate, LA_PLATA_REF.lat, LA_PLATA_REF.lng)
        : decodeOlc(candidate);
      if (!area) return null;
      return { lat: area.lat, lng: area.lng };
    } catch (e) {
      return null;
    }
  }

  // ---------- Distancia (Haversine) ----------
  function distanceKm(lat1, lng1, lat2, lng2) {
    var R = 6371;
    var dLat = ((lat2 - lat1) * Math.PI) / 180;
    var dLng = ((lng2 - lng1) * Math.PI) / 180;
    var a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos((lat1 * Math.PI) / 180) *
        Math.cos((lat2 * Math.PI) / 180) *
        Math.sin(dLng / 2) *
        Math.sin(dLng / 2);
    var c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
  }
  function formatDistance(km) {
    if (km < 1) return Math.round(km * 1000) + " m";
    return km.toFixed(1).replace(".0", "") + " km";
  }

  // ---------- Aplicar a las tarjetas de beneficios ----------
  function paintCards(userLat, userLng) {
    var cards = document.querySelectorAll(".benefit-card[data-location]");
    cards.forEach(function (card) {
      var loc = card.getAttribute("data-location");
      var coords = coordsFromLocationText(loc);
      var badge = card.querySelector(".benefit-distance");
      if (!coords) return; // dirección de calle: no la podemos ubicar todavía
      var km = distanceKm(userLat, userLng, coords.lat, coords.lng);
      if (!badge) {
        badge = document.createElement("span");
        badge.className = "benefit-distance";
        var foot = card.querySelector(".benefit-foot");
        if (foot) foot.appendChild(badge);
      }
      badge.textContent = "📍 a " + formatDistance(km);
      card.setAttribute("data-distance-km", km.toFixed(2));
    });
  }

  var lastPosition = null;

  function activateLocation(button) {
    if (!navigator.geolocation) {
      button.textContent = "Tu navegador no permite ubicación";
      button.disabled = true;
      return;
    }
    button.textContent = "Buscando tu ubicación…";
    button.disabled = true;
    navigator.geolocation.getCurrentPosition(
      function (pos) {
        lastPosition = { lat: pos.coords.latitude, lng: pos.coords.longitude };
        paintCards(lastPosition.lat, lastPosition.lng);
        button.textContent = "Ubicación activada ✓";
      },
      function () {
        button.textContent = "No pudimos acceder a tu ubicación";
        button.disabled = false;
      },
      { enableHighAccuracy: false, timeout: 8000 }
    );
  }

  document.addEventListener("DOMContentLoaded", function () {
    var button = document.getElementById("activate-location");
    if (button) {
      button.addEventListener("click", function () {
        activateLocation(button);
      });
    }
  });

  // Se re-exponen para que benefits.js pueda usarlas al insertar
  // tarjetas nuevas desde la planilla (mismo criterio, sin duplicar código).
  window.SubeGeo = {
    coordsFromLocationText: coordsFromLocationText,
    isPlusCode: isPlusCode,
    repaint: function () {
      if (lastPosition) paintCards(lastPosition.lat, lastPosition.lng);
    },
  };
})();
