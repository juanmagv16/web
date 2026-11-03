# SUBE Canal: versión definitiva (3/11/2026)

Informe para Nahuel sobre los pedidos de los tres archivos (Generales y header, Comunidad y Contenidos), con:

- **Noticias** y **Mi pase**, ahora en el menú;
- el panel de **Redacción** en `/redaccion`, oculto.

La base es la web publicada (versión del 29/10). Cómo subirla: **INSTRUCCIONES.md**.

## 1. Auditoría: qué estaba fallando

**Por qué los logos y los datos no se actualizaban**

- La versión del 29/10 se subió **sin la carpeta `.github`**. Sin ella no corre la actualización automática: nadie leía las planillas y la web seguía con los datos del 26–28/10.
- Los logos de comercios se guardan siempre con el mismo nombre de archivo, así que el navegador podía seguir mostrando el viejo.
- Comunidad además cargaba imágenes viejas puestas a mano (`assets/socios/*.png`) cuando faltaba un logo.

**Qué lee cada sección de las planillas**

| Sección | Planilla | Columnas que usa |
|---|---|---|
| Comunidad | Comercios | Nombre, Rubro, Instagram, Beneficio, Graficas (logo), Ubicación |
| Contenidos, perfiles y «Próxima parada» (Home) | Programación | nombre, descripcion, logo, playlist, dia_semana, hora, frecuencia, frecuencia_dias, fecha_referencia, activo, instagram_a1, conductor_b1–b3, produccion_c1–c2, columnista_d1–d4 |

**Umbrales**

- La planilla sí tiene a sus conductores (Euge Gallo y Juan Velis) y su producción (Nani Sanchez).
- Como es «on demand», el código lo mandaba a una lista aparte que no mostraba el renglón «Conduce». El dato estaba; fallaba la forma de mostrarlo.

**Especiales**

- Ya tiene su fila en la planilla (descripción y playlist, sin conductores).
- El código conservaba una tarjeta escrita a mano y, como la web no se regeneraba, se veía esa.

**Lo que no pude verificar desde acá:** la lectura en vivo de Google Sheets y de Drive. Mi entorno no tiene acceso a Google. Usé la última lectura real de las planillas (la que hizo GitHub el 30/10). La confirmación final es el tilde verde en **Actions** después de subir esta versión.

## 2. Qué se modificó

### Generales y header

- **Textura:** la misma imagen, más liviana.
  - El respaldo JPG baja de 174 KB a 144 KB.
  - En celulares se usa un recorte cuadrado de 36 KB (antes, 72 KB) que no se agranda de más.
- **Legibilidad:** Anton queda en títulos, menú, botones y etiquetas, y Roboto en los textos largos.
  - El gris tenue sube de contraste (de 3,7:1 a 5,5:1).
  - Ningún texto informativo queda debajo de ~13 px.
  - Las etiquetas chicas en Anton tienen más espacio entre letras.
  - No se cambiaron la paleta ni las fuentes.
- **Clima y hora:**
  - Con la letra y el tamaño del menú, en el formato «⛅ 21° · MAR 14:33».
  - El día y la hora son de Argentina (La Plata) y se actualizan solos.
  - En celulares se ve arriba a la izquierda en dos renglones, sin tapar el logo (antes estaba oculto).
  - La fuente del clima (Open-Meteo) no cambió.

### Comunidad

- **Logos:** salen solo de la planilla.
  - GitHub los vuelve a bajar cada hora.
  - Llevan una marca de versión (`?v=…`) para que el navegador muestre el nuevo cuando cambia.
  - Si Drive falla un rato, queda el último logo bueno.
  - Ya no se usan las imágenes viejas cargadas a mano.
- **Sorteos:** el título pasa a «Sorteos exclusivos para pasajerxs», más grande. Se mantiene el texto actual y el botón de Instagram.
- **Botón del mail:** ahora dice «¿No te llegan nuestros correos? Revisá el mail de tu suscripción».
  - Tiene ícono, borde verde a la izquierda y la flecha en verde.
  - El contenido no cambió: los mismos pasos de Mercado Pago y el mismo formulario.

### Contenidos

- **Cada programa:** primero el nombre; debajo, «Conduce: …» en verde SUBE; debajo, la descripción, con el logo al costado (ya no queda debajo de «Conduce»). En celulares el logo va debajo del texto.
- **«Cada dos semanas, alterna con…»:** se sacó en todos lados, sin reemplazo.
- **On demand:** tiene el mismo formato que el resto.
  - Umbrales muestra «Conduce: Euge Gallo y Juan Velis» y lleva a su perfil.
  - Especiales sale de su fila de la planilla y lleva a su playlist.
  - Se borró la tarjeta escrita a mano.
- **Perfiles:**
  - La descripción usa todo el ancho, así entra en un renglón cuando el texto no es muy largo.
  - Conducción, Columnistas y Producción van en un solo bloque, entre la descripción y el video, sin links y sin categorías vacías.
  - El chip de Instagram del programa se mantiene.
- **Logos de programas:** se muestran todos los que tienen link en la columna `logo`. Hoy solo 3 de 8 lo tienen (ver pendientes).

### Noticias, Mi pase y Redacción

- **Menú:** Noticias y Mi pase aparecen en el menú. La Home muestra las noticias destacadas.
- **Mi pase:** credencial, verificación de comercios y accesos ocultos del equipo.
- **Redacción (`/redaccion`):**
  - Cada persona entra con su usuario de SUBE.
  - Borradores privados, vista previa y publicación directa a la web.
  - Ningún botón del sitio lleva al panel.

## 3. Archivos tocados (principales)

- `build_site.py`: header, Comunidad, Contenidos y perfiles.
- `style.css`: bloques «Ajustes del 3/11».
- `assets/weather.js`: día de la semana.
- `assets/schedule-grid.js`: sin «alterna con».
- `scripts/sync_planillas.py`: mantiene el último logo bueno.
- `assets/textura*.{jpg,webp}`.
- Las páginas `.html` regeneradas.
- Lo de Noticias, Mi pase y Redacción: `noticias/`, `mi-pase.html`, `credencial.html`, `redaccion/`, `assets/redaccion.*`, `assets/mi-pase*.js`, `supabase/`.

## 4. Pruebas realizadas

- Generé el sitio completo con la revisión de notas: sin errores ni avisos.
- Capturas en computadora (1440 px), tablet (820 px) y celular (375 px) de:
  - Home, Comunidad, Contenidos;
  - los perfiles de Umbrales y Estación Freak;
  - Noticias y Mi pase.
- Comprobé que:
  - el header no se superpone en ninguna medida;
  - el widget muestra día y hora correctos;
  - «Conduce» va bajo el título;
  - no queda ningún «alterna con».
- Comunidad: los logos de la planilla cargan y el carrusel sigue funcionando.
- Panel de Redacción probado de punta a punta con datos simulados: ingreso, listado, edición, negritas, intertítulos, listas, videos, vista previa y publicación. Las 5 notas publicadas se abren y se guardan sin cambios.
- Reparé restos de una unión de versiones en `style.css` que anulaban los últimos estilos.

## 5. Pendiente

- **Subir `.github/workflows/publicar-sitio.yml` y activar Actions** (INSTRUCCIONES, pasos 1 y 2). Sin esto, ningún cambio de planilla llega a la web.
- **Logos de programas que faltan en la planilla:** Marcando la cancha, Falopa Informativa Nacional, ¿De qué viven?, Chicha y limonada y Umbrales.
- **Umbrales:** el link de su playlist parece cortado (`list=PLSOqo_jyCCX8`). Hasta corregirlo, el reproductor de su perfil puede no cargar.
- **Chicha y limonada:** columnista «Juan Pelis» (¿Juan Velis?).
- **Munay arena:** confirmar que el logo nuevo de la planilla sea el correcto.
- **Supabase:**
  - agregar el dominio oficial en Authentication → URL Configuration;
  - activar Redacción con `GITHUB_REPO = subecanal/web` (INSTRUCCIONES, paso 4).
- **Sin verificar desde acá:** la lectura en vivo de Google Sheets, Drive y YouTube. Se confirma con el tilde verde en Actions y mirando la web publicada.
