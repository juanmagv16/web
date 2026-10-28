/* ============================================
   SUBE — planillas de Google Sheets que usa la web
   ------------------------------------------------------
   Un solo lugar para los links de las planillas y para los
   logos. Lo usan assets/schedule.js (Próxima parada y
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

  var PLANILLAS = {
    programacion: { id: "1sf038ryCAifTFDUtAlhzYzwXquH3moezDdh43rLs2to", gid: "0", publicada: "" },
    comercios: { id: "1T7-2AKnZ1Ss7LwBhUYtFCkPZxjxFTJ3yF6EhMgFnD7M", gid: "0", publicada: "" },
  };

  // Logos optimizados guardados en el sitio, por id del archivo de Drive
  // que figura en la planilla (columna "Gráficas" o "logo"). Se revisó a
  // mano que cada uno corresponda a su comercio o programa.
  var LOGOS_LOCALES = {
    // Comercios (planilla de comercios, columna "Gráficas")
    "17RMkZ7wKA1nxl2SkTZ9WC29gktgz7jj1": "assets/socios/planilla/puntoexe-informatica.webp",
    "15Uv_G3FN8PXsiBtFzfFzg0vAKrDCJMZi": "assets/socios/planilla/lamparas-aurora.webp",
    "1vvIM8zalrGOqr_GvDri_kplcLqtj5VbZ": "assets/socios/planilla/carpincho-indumentaria.webp",
    "1xkA8f73Lcu_VV7HKcG-ETbNtnb9gGnI2": "assets/socios/planilla/casachicha-lp.webp",
    "1s-pmvb2b9gvWma1jdwttY5IvW2NITRra": "assets/socios/planilla/estacionquenoma.webp",
    "18GeIpa1FSANoKXGGCH1ClqFB3dcfrbeu": "assets/socios/planilla/la-compostera.webp",
    "17ZR3rvdHyt3Ia__mM4l4sQgPMWFcnc9S": "assets/socios/planilla/laola-indie.webp",
    "1GtQZOu3keTuHFYHesfSO3LLmmbtsDAI4": "assets/socios/planilla/libreriamascaro.webp",
    "1vQjT_LlwliQNW6Bcrkm-gdxRI4r17F3H": "assets/socios/planilla/mundo-semilla.webp",
    "1hMJP8ZW6zvPG4FzX3sXHof-nKAvPe4DW": "assets/socios/planilla/pao-tatt.webp",
    "1pQNyvqkEckCh0hb2s43PCo52lGUCJ_Tg": "assets/socios/planilla/refugio62.webp",
    "13FVwr3zFyA7I7Kt3YtGT00sH_SjeBP1W": "assets/socios/planilla/roots-cooperativa.webp",
    "15t6ucrvzppol55rgQRyPR6erfJfbhjkI": "assets/socios/planilla/tatana-ar.webp",
    "12XlaMC3tH36uWBMvWs_vRok7NhNMQLfW": "assets/socios/planilla/ve-gui.webp",
    "1Tvs9C5twMYRx2KbtMhPeESBHaXBzdIzz": "assets/socios/planilla/vaga-arg.webp",
    "1EMyP24ZnSGZtzrkth_0AV99G69_ImJxm": "assets/socios/planilla/cuatrogatoslocos.webp",
    // Programas (planilla de programación, columna "logo")
    "1-hdIhxhj2IQs9N7EaJiw2u0oiYEXPU03": "assets/programas/streaming-copa.webp",
    "1blua-_wQVW23XCF9EZwF3pK4HDc66k81": "assets/programas/el-amplificador.webp",
    "1Oru7sSbWzna0eQ64kWo9ASmDBMpvmzi4": "assets/programas/estacion-freak.webp",
  };

  // Archivos que no se muestran hasta confirmar que corresponden
  // (Munay arena: un PDF con un dibujo sin el nombre del comercio).
  var LOGOS_PENDIENTES = { "1SamSQ182pxsponUXAcrLw_XcqTz7hZkV": true };

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
      return [p.publicada, gviz(p.id, p.gid)].filter(Boolean);
    },
    logo: logo,
    driveId: driveId,
  };
})();
