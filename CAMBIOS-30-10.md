# SUBE Canal — Ajustes del 30/10/2026 (sobre la v3.1)

## Tipografía y legibilidad
- **Anton en todo el sitio** (títulos, menú, botones y textos largos). Se quitó Roboto: ya no se descarga nada de Google Fonts.
- Anton tiene un solo peso, así que se eliminaron las negritas (500/700) y se bloqueó la «negrita falsa» del navegador. La jerarquía se logra con tamaño, color y espaciado.
- Texto base: 17 px, interlineado 1,65 y espaciado entre letras 0,03em (Anton lo necesita para leerse bien en párrafos).
- Gris tenue (`--grey-dim`): de `#6b6b66` a `#8d8d87` (contraste de 3,7:1 a 5,5:1 sobre negro).
- Ningún texto queda por debajo de 0,82 rem (~13 px).
- La paleta, la textura y el diseño no se tocaron.

## Header: clima y hora
- Ahora es una **franja fina sobre el logo**, visible también en celular (antes se ocultaba).
- Mismo tamaño y tipografía que el menú (Anton 16,8 px), en blanco.
- Formato: `⛅ 18° · VIE 15:29` (día abreviado + hora de Argentina). Se actualiza sola.
- La fuente del clima (Open-Meteo) y su funcionamiento no cambiaron.
- La franja se desplaza con la página; el header con el logo y el menú sigue fijo arriba.

## Planillas
- **Los links de las planillas están en un solo lugar: `datos/fuentes.json`.** `build_site.py` los copia a `assets/planillas.js` (bloque «GENERADO»). Ya no hay que editar cuatro archivos.
- La tabla «logo de Drive → archivo local» de los programas también se genera sola.
- Se probó el lector (`scripts/sync_planillas.py`) con las dos planillas reales:
  - Comercios: 17 leídos; la nota de arriba («NO MODIFICAR…») se saltea bien y también la ubicación en Plus Code.
  - Contenidos: 9 filas, con Especiales y Umbrales en On demand.
- `datos/comercios.json` se actualizó con los nombres actuales de la planilla (Mascaró, Aurora, Roots cooperativa).

## Pendiente de confirmar
- **Munay arena:** el link del logo en la planilla cambió y el archivo anterior ya no figura en `logos_pendientes`, así que GitHub lo va a descargar y mostrar. Hay que confirmar que sea el logo correcto.
- **Chicha y limonada:** columnista «Juan Pelis» (¿Juan Velis?).
- **Umbrales:** el link de la playlist parece cortado (`list=PLSOqo_jyCCX8`).
- **Logos de programa que faltan:** Marcando la cancha, FIN, ¿De qué viven?, Chicha y limonada y Umbrales.
- `assets/benefits.js` no está incluido en ninguna página (Comunidad se arma al generar el sitio): queda sin uso.
