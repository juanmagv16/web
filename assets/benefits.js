/* ============================================
   SUBE CANAL — carga de beneficios desde Google Sheets
   ------------------------------------------------------
   Intenta traer los beneficios desde la planilla publicada
   (Archivo > Publicar en la web > CSV). Si Google no permite
   el acceso desde el navegador (CORS) o la hoja cambió de
   estructura, el script no rompe nada: la grilla se queda
   con las tarjetas fijas que ya están escritas en index.html.
   ============================================ */
(function () {
  "use strict";

  // Planilla de comercios (links en assets/planillas.js).
  var FUENTES = window.SubePlanillas
    ? window.SubePlanillas.fuentes("comercios")
    : [];

  function stripAccents(s) {
    return String(s || "").normalize("NFD").replace(/[\u0300-\u036f]/g, "");
  }
  function normalizeHeader(h) {
    return stripAccents(h).toLowerCase().trim();
  }

  // Parser de CSV simple, soporta comillas, comas y saltos de línea dentro de un campo.
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
      } else if (c === "\r") {
        /* ignorar */
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
  function findCols(headers, keywords) {
    var idxs = [];
    for (var i = 0; i < headers.length; i++) {
      var h = normalizeHeader(headers[i]);
      for (var k = 0; k < keywords.length; k++) {
        if (h.indexOf(keywords[k]) !== -1) {
          idxs.push(i);
          break;
        }
      }
    }
    return idxs;
  }

  function igHandle(v) {
    if (!v) return "";
    var m = String(v).match(/instagram\.com\/([^/?\s]+)/i);
    if (m) return "@" + m[1];
    return "@" + String(v).replace(/^@/, "").trim();
  }
  function igUrl(v) {
    if (!v) return "";
    var s = String(v).trim();
    if (/^https?:\/\//i.test(s)) return s;
    return "https://www.instagram.com/" + s.replace(/^@/, "") + "/";
  }
  function slugFromIg(v) {
    return igHandle(v).replace(/^@/, "");
  }

  function escapeHtml(s) {
    return String(s == null ? "" : s)
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;");
  }

  var IG_ICON =
    '<svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true"><rect x="3" y="3" width="18" height="18" rx="5"></rect><circle cx="12" cy="12" r="4"></circle><circle cx="17.3" cy="6.7" r="1"></circle></svg>';

  function cardHTML(item) {
    // El logo se resuelve así: 1) columna "Logo" de la planilla si trae una
    // URL, 2) si no, se intenta assets/socios/{handle}.{ext} (lo hace
    // assets/logo-autoload.js después de insertar las tarjetas), 3) si
    // tampoco existe, se queda el círculo con la inicial.
    var slug = slugFromIg(item.ig);
    var initial = escapeHtml((item.nombre || "?").trim().charAt(0).toUpperCase());
    var src = window.SubePlanillas ? window.SubePlanillas.logo(item.logo) : item.logo;
    var logo = src
      ? '<div class="benefit-logo"><img src="' +
        escapeHtml(src) +
        '" alt="' +
        escapeHtml(item.nombre) +
        '" loading="lazy" decoding="async" data-inicial="' + initial + '"></div>'
      : '<div class="benefit-logo mono" data-slug="' +
        escapeHtml(slug) +
        '" data-name="' +
        escapeHtml(item.nombre) +
        '">' +
        initial +
        "</div>";

    var perksHtml = item.perks
      .map(function (p) {
        return "<li>" + escapeHtml(p) + "</li>";
      })
      .join("");

    var igLink = item.ig
      ? '<a class="benefit-ig" href="' +
        escapeHtml(igUrl(item.ig)) +
        '" target="_blank" rel="noopener">' +
        IG_ICON +
        "<span>" +
        escapeHtml(igHandle(item.ig)) +
        "</span></a>"
      : "";

    return (
      '<article class="benefit-card"' +
      (item.ubicacion ? ' data-location="' + escapeHtml(item.ubicacion) + '"' : "") +
      ">" +
      '<div class="benefit-top">' +
      logo +
      "<div>" +
      '<div class="benefit-name">' +
      escapeHtml(item.nombre) +
      "</div>" +
      (item.categoria
        ? '<div class="benefit-cat">' + escapeHtml(item.categoria) + "</div>"
        : "") +
      "</div>" +
      "</div>" +
      '<ul class="benefit-perks">' +
      perksHtml +
      "</ul>" +
      '<div class="benefit-foot">' +
      igLink +
      "</div>" +
      "</article>"
    );
  }

  // Si una imagen de Drive no carga, se vuelve al círculo con la inicial
  function sinImagenRota(grid) {
    Array.prototype.forEach.call(grid.querySelectorAll(".benefit-logo img[data-inicial]"), function (img) {
      img.addEventListener("error", function () {
        var box = img.parentNode;
        box.classList.add("mono");
        box.textContent = img.getAttribute("data-inicial");
      });
    });
  }

  function render(items) {
    var grid = document.getElementById("benefit-grid");
    if (!grid || !items.length) return;
    grid.innerHTML = items.map(cardHTML).join("");
    sinImagenRota(grid);
    grid.setAttribute("data-fallback", "false");
    if (window.SubeAutoLogos) window.SubeAutoLogos(grid);
    if (window.SubeGeo) window.SubeGeo.repaint();
  }

  function leer(i) {
    return fetch(FUENTES[i]).then(function (res) {
      if (!res.ok) throw new Error("status " + res.status);
      return res.text();
    }).catch(function (err) {
      if (i + 1 < FUENTES.length) return leer(i + 1);
      throw err;
    });
  }

  leer(0)
    .then(function (text) {
      var rows = parseCSV(text);
      if (rows.length < 2) return;

      // La fila de encabezados no siempre es la primera (puede haber una
      // fila de aviso/título arriba). Buscamos, entre las primeras filas,
      // cuál contiene tanto una columna de nombre como una de beneficio.
      var headerRowIndex = -1,
        nombreCol = -1,
        catCol = -1,
        igCol = -1,
        logoCol = -1,
        ubicacionCol = -1,
        beneficioCols = [];

      for (var h = 0; h < Math.min(rows.length, 6); h++) {
        var candidateHeaders = rows[h];
        var nCol = findCol(candidateHeaders, ["comercio", "nombre", "negocio", "espacio"]);
        var bCols = findCols(candidateHeaders, ["beneficio", "descuento"]);
        if (nCol !== -1 && bCols.length) {
          headerRowIndex = h;
          nombreCol = nCol;
          beneficioCols = bCols;
          catCol = findCol(candidateHeaders, ["rubro", "categoria"]);
          igCol = findCol(candidateHeaders, ["instagram", " ig", "ig "]);
          logoCol = findCol(candidateHeaders, ["logo", "imagen", "grafica"]);
          ubicacionCol = findCol(candidateHeaders, ["ubicacion", "direccion", "domicilio"]);
          break;
        }
      }

      // Si no reconocemos las columnas clave, no tocamos nada:
      // se queda el listado fijo que ya está en el HTML.
      if (headerRowIndex === -1) return;

      var items = [];
      for (var r = headerRowIndex + 1; r < rows.length; r++) {
        var row = rows[r];
        var nombre = (row[nombreCol] || "").trim();
        if (!nombre) continue;

        // Cada celda de beneficio puede traer varios ítems separados
        // por salto de línea (ej: "10% en birras\n10% en talleres").
        var perks = [];
        beneficioCols.forEach(function (c) {
          (row[c] || "")
            .split(/\r?\n/)
            .map(function (v) {
              return v.trim();
            })
            .filter(function (v) {
              return v;
            })
            .forEach(function (v) {
              perks.push(v);
            });
        });
        if (!perks.length) continue;

        var igValue = igCol !== -1 ? (row[igCol] || "").trim() : "";
        items.push({
          nombre: nombre,
          categoria: catCol !== -1 ? (row[catCol] || "").trim() : "",
          ig: igValue,
          logo: logoCol !== -1 ? (row[logoCol] || "").trim() : "",
          ubicacion: ubicacionCol !== -1 ? (row[ubicacionCol] || "").trim() : "",
          perks: perks,
        });
      }
      if (items.length) render(items);
    })
    .catch(function () {
      // Sin acceso a la planilla (offline, CORS, etc): se mantiene
      // el listado fijo de index.html. No se muestra ningún error.
    });
})();
