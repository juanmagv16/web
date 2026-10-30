/* ============================================
   SUBE — planillas de Google Sheets que usa la web
   ------------------------------------------------------
   Los links de las planillas se cargan en un solo lugar:
   datos/fuentes.json (build_site.py los copia acá). Lo usan assets/schedule.js (Próxima parada y
   Contenidos) y assets/benefits.js (Comunidad).

   Cómo se leen: el navegador pide cada planilla como CSV.
   Las planillas tienen que estar compartidas como
   "Cualquier persona con el vínculo: Lector".
   Si además se publican (Archivo → Compartir → Publicar en
   la web → CSV), se puede pegar ese link en "publicada" y
   se usa primero.

   Si no se puede leer la planilla, cada sección muestra la
   última copia guardada en el sitio (no se rompe nada).
   ============================================ */
(function () {
  "use strict";

  function gviz(id, gid) {
    return "https://docs.google.com/spreadsheets/d/" + id + "/gviz/tq?tqx=out:csv&headers=1&gid=" + gid;
  }

  // >>> GENERADO por build_site.py desde datos/fuentes.json y datos/programacion.csv.
  // No se edita a mano: para cambiar una planilla se edita datos/fuentes.json.
  var PLANILLAS = {"programacion": {"id": "1sf038ryCAifTFDUtAlhzYzwXquH3moezDdh43rLs2to", "gid": "0", "publicada": ""}, "comercios": {"id": "1T7-2AKnZ1Ss7LwBhUYtFCkPZxjxFTJ3yF6EhMgFnD7M", "gid": "0", "publicada": ""}};
  var LOGOS_LOCALES = {
    "1-hdIhxhj2IQs9N7EaJiw2u0oiYEXPU03": "assets/programas/streaming-copa.webp",
    "1blua-_wQVW23XCF9EZwF3pK4HDc66k81": "assets/programas/el-amplificador.webp",
    "1Oru7sSbWzna0eQ64kWo9ASmDBMpvmzi4": "assets/programas/estacion-freak.webp"
  };
  var LOGOS_PENDIENTES = {"1SamSQ182pxsponUXAcrLw_XcqTz7hZkV": true};
  // <<< FIN GENERADO

  function driveId(url) {
    var m = String(url || "").match(/drive\.google\.com\/(?:file\/d\/|open\?id=|uc\?(?:[^#]*&)?id=|thumbnail\?(?:[^#]*&)?id=)([a-zA-Z0-9_-]+)/);
    return m ? m[1] : "";
  }

  // Devuelve la imagen a usar para un link de la planilla ("" si no hay):
  // 1) el logo optimizado guardado en el sitio; 2) la miniatura pública
  // de Drive; 3) un link directo a una imagen.
  function logo(url, prefijo) {
    var id = driveId(url);
    if (id) {
      if (LOGOS_PENDIENTES[id]) return "";
      if (LOGOS_LOCALES[id]) return (prefijo || "") + LOGOS_LOCALES[id];
      return "https://drive.google.com/thumbnail?id=" + id + "&sz=w400";
    }
    return /^https?:\/\/\S+\.(png|jpe?g|webp|gif|svg)(\?\S*)?$/i.test(String(url || "").trim()) ? String(url).trim() : "";
  }

  window.SubePlanillas = {
    fuentes: function (nombre) {
      var p = PLANILLAS[nombre];
      // 1) la copia que GitHub actualiza cada hora en datos/ (la más confiable),
      // 2) la planilla publicada, si se cargó su link, 3) la planilla en vivo.
      var copia = nombre === "programacion" ? "datos/programacion.csv" : "";
      return [copia, p.publicada, gviz(p.id, p.gid)].filter(Boolean);
    },
    logo: logo,
    driveId: driveId,
  };
})();
