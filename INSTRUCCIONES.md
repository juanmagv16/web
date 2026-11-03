# SUBE Canal: cómo subir la versión definitiva

Para Nahuel (administración web) · 3/11/2026

Esta versión suma a la web publicada:

- los pedidos de **Generales y header**, **Comunidad** y **Contenidos**;
- **Noticias** y **Mi pase** en el menú;
- el panel de **Redacción** (`subecanal.com.ar/redaccion`), que no tiene ningún botón en la web.

## Paso 1 · Subir los archivos (una sola vez)

1. Descomprimí el .zip en tu computadora. Trae solo los archivos nuevos o cambiados (menos de 100, así entran en una sola subida).
2. En github.com/subecanal/web tocá **Add file → Upload files**.
3. Arrastrá **todo el contenido** de la carpeta descomprimida (no la carpeta en sí) y tocá **Commit changes**. Lo que tiene el mismo nombre se reemplaza; no hace falta borrar nada. El archivo `CNAME` (el dominio) no viene en el zip y queda como está.
4. **Lo más importante:** entrá a la carpeta `.github/workflows/` del repositorio y fijate que esté `publicar-sitio.yml`.
   - Las carpetas que empiezan con punto suelen no subirse al arrastrar. **Sin ese archivo los logos y la programación no se actualizan desde las planillas** (es lo que pasó con la versión anterior).
   - Si no está: **Add file → Create new file**, escribí como nombre `.github/workflows/publicar-sitio.yml`, pegá el contenido de `PEGAR-publicar-sitio.yml` (viene en el zip, a la vista) y tocá **Commit changes**.

## Paso 2 · Activar la publicación automática (una sola vez)

1. **Settings → Pages → Build and deployment → Source:** elegí **GitHub Actions**.
2. En esa pantalla, revisá que **Custom domain** diga `subecanal.com.ar` y que **Enforce HTTPS** esté tildado.
3. **Settings → Actions → General:**
   - **Allow all actions and reusable workflows**.
   - En «Workflow permissions», **Read and write permissions** → **Save**.
4. **Actions → Publicar el sitio → Run workflow**. En uno o dos minutos tiene que aparecer un tilde verde.
   - Si aparece una cruz roja, abrí el intento y mandá una captura del paso que falló.

Después, **cada hora y cada vez que se sube un cambio**, GitHub lee las dos planillas, baja los logos, regenera la web y la publica.

## Paso 3 · Planillas

Siguen siendo las mismas dos:

- [Comercios](https://docs.google.com/spreadsheets/d/1T7-2AKnZ1Ss7LwBhUYtFCkPZxjxFTJ3yF6EhMgFnD7M/edit)
- [Programación](https://docs.google.com/spreadsheets/d/1sf038ryCAifTFDUtAlhzYzwXquH3moezDdh43rLs2to/edit)

Las dos tienen que estar compartidas como **«Cualquier persona con el vínculo: Lector»**, y los logos de Drive también.

Para que aparezcan **todos los logos de los programas**, falta cargar en la columna `logo` el link de Drive de:

- Marcando la cancha
- Falopa Informativa Nacional
- ¿De qué viven?
- Chicha y limonada
- Umbrales

Además, revisar:

- **Umbrales:** el link de su playlist (`list=PLSOqo_jyCCX8`) parece cortado.
- **Chicha y limonada:** columnista «Juan Pelis» (¿Juan Velis?).
- **Munay arena:** el logo nuevo de la planilla se va a mostrar solo. Confirmar que sea el correcto.

## Paso 4 · Mi pase y Redacción (Supabase)

Usan la misma cuenta de Supabase que la versión de prueba.

1. **Mi pase en el dominio oficial.** En Supabase, **Authentication → URL Configuration**:
   - En **Site URL** poné `https://subecanal.com.ar`.
   - En **Redirect URLs** agregá `https://subecanal.com.ar/**`.
   - Sin esto, los links de los mails (activar cuenta, recuperar contraseña) llevan a la versión de prueba.
2. **Redacción.** Seguí `supabase/LEEME.md`, sección «Panel de Redacción». Para la web oficial:
   - La llave de GitHub la crea alguien con acceso a `subecanal/web`, limitada a ese repositorio y con permiso **Contents: Read and write**.
   - En los Secrets de Supabase: `GITHUB_REPO` = `subecanal/web`.
   - Desde ese momento, todo lo que se publique en el panel va a la web oficial.

## Interruptores (en `build_site.py`)

| Qué | Dónde | Hoy |
|---|---|---|
| Secciones ocultas | `SECCIONES_OCULTAS` | Solo Tienda |
| Botón «Ver qué tan cerca están» | `GEOLOCALIZACION_ACTIVA` | Apagado |
| Franja con logos de programas en la Home | `FRANJA_PROGRAMAS_ACTIVA` | Apagada |

Después de cambiar un interruptor alcanza con subir el archivo: GitHub regenera la web solo.
