# SUBE Canal — Cómo subir esta versión y activar la publicación automática

Para: Nahuel (administración web) · 29/10/2026

## Paso 1 · Subir los archivos

1. Descomprimí el .zip en tu computadora.
2. En github.com/subecanal/web tocá **Add file → Upload files**.
3. Arrastrá **todo el contenido** de la carpeta descomprimida (no la carpeta en sí) y tocá **Commit changes**. Los archivos con el mismo nombre se reemplazan; no hace falta borrar nada antes.
4. **Importante:** comprobá que se haya subido el archivo `.github/workflows/publicar-sitio.yml`. Las carpetas que empiezan con punto a veces no se suben al arrastrar.
   - Para verificarlo, entrá a `.github/workflows/` en el repositorio.
   - Si no está, tocá **Add file → Create new file**, escribí como nombre `.github/workflows/publicar-sitio.yml`, pegá el contenido del archivo que está en el .zip y tocá **Commit changes**.

## Paso 2 · Activar la publicación automática (una sola vez)

1. **Settings → Pages → Build and deployment → Source:** elegí **GitHub Actions** (hoy dice «Deploy from a branch»).
2. En esa misma pantalla, revisá que **Custom domain** siga diciendo `subecanal.com.ar` y que **Enforce HTTPS** esté tildado.
3. **Settings → Actions → General:**
   - En «Actions permissions», tiene que estar marcada **Allow all actions and reusable workflows**.
   - En «Workflow permissions», elegí **Read and write permissions** y tocá **Save**.
4. Entrá a la pestaña **Actions**, elegí **Publicar el sitio** a la izquierda y tocá **Run workflow → Run workflow**.
5. En uno o dos minutos tiene que aparecer un tilde verde. Si aparece una cruz roja, abrí el intento y mandanos una captura del paso que falló.

## Cómo funciona después

- **Cada hora, y cada vez que se sube un cambio**, GitHub lee las dos planillas, actualiza los datos y los logos, regenera el sitio y lo publica.
  - Comercios: https://docs.google.com/spreadsheets/d/1T7-2AKnZ1Ss7LwBhUYtFCkPZxjxFTJ3yF6EhMgFnD7M/edit
  - Programación: https://docs.google.com/spreadsheets/d/1sf038ryCAifTFDUtAlhzYzwXquH3moezDdh43rLs2to/edit
- **Para que funcione**, las planillas tienen que seguir compartidas como «Cualquier persona con el vínculo: Lector», y los logos de Drive también.
- **Si una planilla no se puede leer**, el sitio sigue con los últimos datos buenos. El motivo aparece en la pestaña **Actions**, como aviso amarillo.
- **Para forzar una actualización** sin esperar la hora: Actions → Publicar el sitio → Run workflow.

## Lo que hay que cargar en la planilla de programación

- **Especiales:** agregar una fila con `nombre` = Especiales, `descripcion`, `playlist` (el link de la lista de YouTube), `frecuencia` = on demand y `activo` = si. Al aparecer en la planilla, la tarjeta deja de estar escrita en el código.
- **Logos que faltan:** Marcando la cancha, FIN, ¿De qué viven?, Chicha y limonada y Umbrales. Link de Drive compartido como lector, en la columna `logo`.
- **Umbrales:** el link de su playlist (`list=PLSOqo_jyCCX8`) parece estar cortado.

## Interruptores (en `build_site.py`)

| Qué | Dónde | Hoy |
|---|---|---|
| Secciones ocultas (Noticias, Tienda) | `SECCIONES_OCULTAS` | Ocultas |
| Botón «Ver qué tan cerca están» | `GEOLOCALIZACION_ACTIVA` | Apagado |
| Franja con logos de programas en la Home | `FRANJA_PROGRAMAS_ACTIVA` | Apagada, hasta aprobarla y tener todos los logos |

Después de cambiar un interruptor, alcanza con subir el archivo: GitHub regenera el sitio solo.

## Logos que no se muestran a propósito

En `datos/fuentes.json`, `logos_pendientes` lista los archivos de Drive que no se muestran hasta confirmar que corresponden. Hoy está el de Munay arena: un PDF con un dibujo sin el nombre del comercio. Para mostrarlo, hay que borrar su id de esa lista.
