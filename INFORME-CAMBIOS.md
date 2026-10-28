# SUBE Canal — Informe de optimización y ajustes (28/10/2026)

Trabajo hecho sobre la versión publicada en subecanal.com.ar (repositorio `subecanal/web`). No se reconstruyó el sitio: se tocaron solo las partes pedidas. Este archivo acompaña el .zip con el sitio completo, listo para subir.

## 1. Cambios realizados

### Secciones ocultas (Noticias, Tienda, Mi pase)
- **Tienda** sale del menú en todas las páginas, incluidas las tres páginas antiguas (`beneficios.html`, `pasajerxs.html`, `programacion.html`).
- **Noticias** sale de la Home (bloque «Noticias destacadas») y de Contenidos (tarjeta «Noticias»).
- `noticias.html` y `tienda.html` ya no muestran contenido: redirigen a la Home y le piden a Google que no las indexe. Así no se puede entrar ni con la dirección directa.
- **Mi pase** no existe en esta versión del sitio, así que no hubo nada que ocultar. En Comunidad no hay elementos de Mi pase: el texto «Mostrá tu carnet de pasajerx» no la menciona y quedó igual.
- Todo es reversible. Los textos y páginas siguen en `build_site.py`. Para volver a mostrar una sección, se la saca de `SECCIONES_OCULTAS` y se regenera el sitio.

### Home
- **Noticias destacadas:** oculta. La sección queda guardada como `NOTICIAS_DESTACADAS` en `build_site.py`.
- **Banners cuadrados:** ya no tenían imágenes y ya llevaban a Contacto, así que no cambiaron (se verificó cada link). Conservan su tamaño y su disposición.
- **Banners horizontales del final:** eliminados. Queda el banner horizontal de arriba.
- **Último programa:**
  - El título pasó a «Último programa» (también en el título accesible del reproductor).
  - La playlist pedida ya estaba cargada y se mantiene.
  - No hay ningún indicador de «en vivo».
- **Próxima parada:**
  - Lee la planilla de programación nueva, que usa la columna «nombre» en lugar de «programa».
  - El nombre del programa es un enlace subrayado en verde, con flecha, a su perfil en Contenidos (`programas/<programa>.html`). El enlace se arma solo a partir del nombre de la planilla, así que cambia cuando cambia la próxima emisión.
  - Cuando llega la hora del programa, pasa directo a la emisión siguiente. Antes quedaba fijo «Ahora en SUBE», pero la planilla no dice cuánto dura cada programa.

### Comunidad
- **Beneficios:** salen de la planilla de comercios nueva, con 17 comercios y los datos tal cual están en la planilla. El diseño de las tarjetas es el mismo.
- **Logos:**
  - Se usaron los archivos de la columna «Gráficas», en versión optimizada. Se revisó a mano que cada imagen corresponda a su comercio.
  - Los logos se muestran completos: antes se recortaban si no eran cuadrados.
- **Geolocalización:** el botón «Ver qué tan cerca están» está apagado y su script no se carga. El código y los datos de ubicación siguen intactos (`GEOLOCALIZACION_ACTIVA = False`).
- El resto de Comunidad no se tocó. Se comparó el contenido antes y después: solo cambiaron las tarjetas y se quitó el botón de ubicación.

### Contenidos
- Debajo del nombre de cada programa aparece su descripción y, si la planilla lo tiene, su logo. Las proporciones se respetan.
- La estructura del menú es la misma (Lunes, Jueves, On demand).
- «Cada dos semanas, alterna con…» se calcula con las fechas de la planilla.
- Los nombres que se muestran son los de los perfiles existentes, para que coincidan con cada ficha. No se creó ningún perfil nuevo.

### Contacto
- El contenido de la página quedó idéntico (se comparó línea por línea).
- Solo cambia lo que comparten todas las páginas:
  - el menú, sin Tienda;
  - la carga de tipografías;
  - el colectivo del pie, en un formato más liviano.

## 2. Cómo se leen las planillas (importante)

El sitio es estático, como siempre: no necesita servidor. Cada página pide la planilla directamente a Google desde el navegador de quien la visita, de la misma manera que el sitio ya lo hacía.

- Los links están en un solo archivo: `assets/planillas.js`.
- Las planillas tienen que estar compartidas como **«Cualquier persona con el vínculo: Lector»** (hoy lo están).
- **Si Google no responde, ninguna sección queda vacía.** Muestran una copia de los datos reales de las planillas tomada el 26/10/2026, guardada en `datos/` y en `assets/schedule.js`.
- **Recomendado:** publicar las dos planillas desde «Archivo → Compartir → Publicar en la web → CSV» y pegar esos links en el campo `publicada` de `assets/planillas.js`. Es la forma más estable de lectura.

## 3. Archivos modificados

**Nuevos**
- `assets/planillas.js`: links de las planillas y relación entre cada archivo de Drive y su logo.
- `assets/socios/planilla/*.webp`: 16 logos de comercios.
- `assets/programas/*.webp`: 3 logos de programas.
- `datos/comercios.json` y `datos/programacion.csv`: copia de respaldo de las planillas.
- `assets/fonts/Anton-Regular.woff2`, `assets/colectivo.webp` y `assets/textura.webp`: versiones livianas.
- `INFORME-CAMBIOS.md`: este informe.

**Modificados**
- Generador: `build_site.py`.
- Scripts: `assets/schedule.js`, `assets/schedule-grid.js`, `assets/next-stop.js` y `assets/benefits.js`.
- Estilos: `style.css`.
- Imagen: `assets/logo.png`, achicado sin cambiar cómo se ve.
- Documentación: `README.md`.
- Páginas regeneradas:
  - `index.html`, `comunidad.html`, `contenidos.html`, `contacto.html`, `noticias.html`, `tienda.html` y `programas/*.html`;
  - en las páginas antiguas `beneficios.html`, `pasajerxs.html` y `programacion.html`, solo se sacó el link a Tienda.

No se borró ningún archivo.

## 4. Optimizaciones técnicas

- **Tipografía del cuerpo (Roboto):** no se estaba cargando. El `@import` estaba después de otra regla del CSS y los navegadores lo ignoran, así que el texto salía con la letra genérica del sistema. Ahora se carga desde el encabezado de cada página, con conexión anticipada. **Este cambio se nota a la vista:** el cuerpo de texto pasa a verse en Roboto, que es la letra que el diseño define.
- **Tipografía de títulos (Anton):** formato WOFF2 con caracteres latinos. Pasa de 158 KB a 20 KB y se precarga; el TTF queda de respaldo.
- **Imágenes:**
  - Logo del encabezado: de 3563 × 1376 px y 31 KB a 269 × 104 px y 2 KB, con la misma nitidez a su tamaño real.
  - Colectivo del pie: WebP de 45 KB en lugar del PNG de 251 KB (el PNG queda para navegadores viejos). Además, carga diferida y medidas declaradas.
  - Textura de fondo: WebP de 41 KB en lugar del JPG de 169 KB (el JPG queda de respaldo).
  - Logos de comercios y programas: WebP de entre 3 y 75 KB, sin el «fondo cuadriculado» falso que traían algunos archivos.
- **Accesibilidad:**
  - Textos alternativos en logos y programas.
  - El enlace de Próxima parada tiene estilo de foco para quien navega con teclado.
  - Si un logo de Drive no carga, aparece la inicial del comercio en lugar de una imagen rota.
- **Robustez:**
  - Las horas se aceptan como «18:00» o «18:00:00».
  - Las fechas se aceptan como «2026-08-24» o «24/8/2026», y se elige la lectura que coincide con el día de la semana.
  - Una fila con datos inválidos se descarta sin romper el resto.

## 5. Pruebas realizadas y resultados

Se probó en un navegador Chromium automatizado, en tres tamaños: computadora (1280 px), tablet (820 px) y celular (390 px).

| Prueba | Resultado |
|---|---|
| Menú en todas las páginas | Comunidad · Contenidos · Contacto ✔ |
| `noticias.html` y `tienda.html` | Redirigen a la Home ✔ |
| Noticias destacadas y banners horizontales finales | No aparecen ✔ |
| Banners cuadrados | Los 3 llevan a `contacto.html` ✔ |
| Próxima parada (miércoles 28/10) | «El Amplificador – 10ma temporada → Jueves 29/10 · 18:00», cuenta regresiva activa y link a su perfil ✔ |
| Pasar a la emisión siguiente al llegar la hora | Probado adelantando el reloj ✔ |
| Próximas emisiones | Estación Freak 29/10 y 12/11; ¿De qué viven? 05/11 y 19/11 (se alternan) ✔ |
| Comunidad | 17 comercios; 16 con logo y Munay arena con su inicial ✔ |
| Botón de ubicación | No aparece ✔ |
| Contenidos | 7 descripciones y 3 logos ✔ |
| Perfiles | Abren bien ✔ |
| Ancho de página | Sin desplazamiento horizontal en ningún tamaño ✔ |
| Errores en la consola | Ninguno ✔ |
| Lectura «en vivo» | Simulada con datos reales en el formato que entrega Google (comillas, horas con segundos, fechas d/m/aaaa): se leyeron y se mostraron bien ✔ |

**Lo que no se pudo verificar desde este entorno** (no tiene acceso a Google ni a YouTube):
- **Lectura real de las planillas desde el sitio publicado.** Si fallara, se muestra la copia del 26/10. Para comprobarlo: cambiar un beneficio en la planilla, esperar unos minutos y recargar Comunidad.
- **Reproducción de la playlist.** El link es el correcto.
- **Miniaturas de Drive para comercios nuevos** que se agreguen a la planilla.

Avisos que ya existían: en la tarjeta de Munay arena, el sitio busca en `assets/socios/` un logo que no existe (4 avisos 404, sin efecto visible). Es el funcionamiento de `logo-autoload.js` y no se modificó.

## 6. Evaluación de las columnas de la planilla de Contenidos

La planilla tiene 26 columnas y 8 programas. Las fechas (AAAA-MM-DD) y las horas (HH:MM) están bien escritas y coinciden con el día de la semana.

| Columna | Qué tiene | Problemas | Sugerencia |
|---|---|---|---|
| `nombre` | Nombre del programa | Sin tildes ni mayúsculas («Estacion freak», «Streaming copa»). «Falopa informativa nacional» no coincide con «FIN! F@lopa…» del perfil | Escribirlo como se publica |
| `descripcion` | Texto del programa | Completa en 8 de 8. En FIN: «mas» sin tilde y mayúscula después de «;» | Revisar ortografía |
| `logo` | Link de Drive | Solo 3 de 8 (faltan Marcando la cancha, FIN, ¿De qué viven?, Chicha y limonada y Umbrales) | Completar y compartir como lector |
| `playlist` | Link de video + lista | Mezcla video y lista. El de Umbrales (`list=PLSOqo_jyCCX8`) parece cortado | Usar solo el link de la lista y revisar el de Umbrales |
| `dia_semana`, `hora` | Día y horario | Bien. Vacíos en Umbrales (on demand) | — |
| `frecuencia`, `frecuencia_dias` | «semanal/quincenal» y 7/14 | Dicen lo mismo de dos maneras. «on demand» está mezclado en frecuencia | Una sola columna «modalidad»: semanal, quincenal u on demand |
| `fecha_referencia` | Primera emisión | Bien | — |
| `temporada` | 2026 en todas las filas | No se usa | Quitarla o usarla en el perfil |
| `activo` | si/no | Bien | — |
| `instagram_a1` | Instagram del programa | Vacío en FIN y Umbrales | Completar si existe |
| `conductor_b1…b3`, `instagram_b1…b3` | Conducción | El tope es 3 personas | Ver propuesta abajo |
| `produccion_c1…c2`, `instagram_c1…c2` | Producción | El tope es 2 personas | Ver propuesta abajo |
| `columnista_d1…d4` | Columnistas | No tienen columna de Instagram, y hay posibles errores («Juan Pelis» por «Juan Velis», «Juanita» por «Juani Perone») | Ver propuesta abajo |

**Diferencias con los perfiles publicados:**
- Streaming Copa: «Cipriano» en la planilla y «Chipi» en el perfil.
- ¿De qué viven?: en la planilla la conducción es Agus Sandia, Eze Varano y Mili Lucero; en el perfil, Agus Fornari Soto, Eze Varano y Kiki Victoria.
- También hay columnistas distintos en Marcando la cancha, Estación Freak y Chicha y limonada.
- Los perfiles no se modificaron, porque no se pidió.

**Propuesta de estructura (no se tocó la planilla):**
- Una pestaña de programas: nombre como se publica, descripción, logo, playlist (solo la lista), modalidad, día, hora, fecha de primera emisión, duración, activo e Instagram.
- Una pestaña de equipo, con una fila por persona: programa | rol | nombre | Instagram. Así no hay tope de personas y los perfiles se pueden armar solos.

## 7. Pendientes

- **Logo de Munay arena:** el archivo de «Gráficas» es un PDF con un dibujo (montaña, olas y pelota) sin el nombre del comercio. No se muestra hasta confirmar que es su logo; para habilitarlo, hay que borrarlo de `LOGOS_PENDIENTES` en `assets/planillas.js`.
- **Logo de .exe informática:** el punto blanco del logo toca el borde y quedó levemente recortado al limpiarle el fondo. Conviene pedir el logo en PNG.
- **Programas sin logo en la planilla:** Marcando la cancha, FIN, ¿De qué viven?, Chicha y limonada y Umbrales.
- **Lectura en vivo:** confirmarla en el sitio publicado (ver punto 5). Si no funciona, publicar las planillas como CSV y pegar los links en `assets/planillas.js`.
- **Contraste:** el gris claro de algunos textos chicos (por ejemplo, el rubro de cada comercio) tiene un contraste más bajo que el recomendado. No se cambió para no alterar Comunidad, que está aprobada.

## 8. Dudas que necesitan decisión

1. **Páginas antiguas** `beneficios.html`, `pasajerxs.html` y `programacion.html`: no tienen ningún enlace desde el sitio, pero se puede entrar con la dirección directa y muestran contenido viejo. ¿Las redirigimos a Comunidad y Contenidos?
2. **Perfiles de programas:** ¿pasan a tomar el equipo (conducción, producción, columnistas) de la planilla?
3. **Duración:** ¿agregamos una columna de duración, para mostrar «En el aire» mientras dura cada programa?
4. **Rótulos de los banners:** los cuadrados y el banner horizontal muestran el texto «Cuadrado» y «Banner horizontal». ¿Lo dejamos así hasta que haya avisos, o los dejamos totalmente vacíos?
