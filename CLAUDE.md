# SUBE Canal: guía para trabajar en esta web

Instrucciones para Claude (Claude Code o claude.ai) y para cualquier persona que toque este repositorio. Leelas antes de cambiar algo.

## Quiénes y dónde

- **Web oficial:** `subecanal/web` → https://subecanal.com.ar. La administra Nahuel. **Nunca subir cambios directo ahí** (ni push, ni commits): los cambios se le entregan para que él los revise (hoy, zip + instrucciones; a futuro, pull request desde la web de prueba si él lo acepta).
- **Web de prueba:** `juanmagv16/web` (Juanma). Acá se prueba todo antes de pasarlo a la oficial. Su rama `main` se publica sola en GitHub Pages.
- Hablarle al equipo en castellano rioplatense y en lenguaje simple, sin tecnicismos.

## Reglas de trabajo (pedidas por Nahuel)

1. **Auditar primero.** Antes de cambiar, revisar cómo funciona hoy y por qué falla. Preguntar antes de cualquier decisión de diseño o de contenido.
2. **No modificar las planillas de Google.** Se leen, nunca se escriben.
3. **No inventar textos ni datos.** Si falta un dato (logo, descripción, nombre), se avisa como pendiente; no se completa a mano.
4. **No afirmar que algo funciona sin verificarlo.** En particular, la lectura de Google Sheets y Drive: si no se pudo probar en vivo, decirlo.
5. **Al terminar, informar:** qué se modificó, qué archivos, qué pruebas se hicieron y qué queda pendiente (ver como ejemplo `CAMBIOS-03-11.md`).
6. Mantener la estética SUBE: Anton para títulos, menú, botones y etiquetas; Roboto para textos largos; verde lima como acento. No cambiar la paleta ni las fuentes sin que lo pidan.

## Seguridad

- **Nunca pedir, aceptar ni escribir tokens, contraseñas o claves secretas.** Las crea la persona dueña de cada cuenta (GitHub, Supabase) y las carga ella misma en los Secrets.
- La clave pública de Supabase (`assets/mi-pase-config.js`) es pública a propósito; la seguridad depende de las reglas RLS de la base (`supabase/*.sql`).
- **No publicar datos de socios** ni de comercios fuera de lo que ya muestra la planilla.
- Las páginas de acceso del equipo y de gestión de Mi pase tienen nombre aleatorio a propósito: no enlazarlas desde la web ni escribir su dirección en textos públicos.
- **Redacción** (`/redaccion`) no tiene botón en la web oficial (`REDACCION_EN_MENU = False`). En la web de prueba está en `True` para probarla.

## Cómo está armada

Sitio estático: `build_site.py` genera todas las páginas `.html` a partir de plantillas que están en el mismo archivo y de los datos de `datos/`. **No editar los `.html` generados a mano**: se pisan en la próxima publicación. Se edita `build_site.py`, `style.css` o `assets/*.js`, y se regenera.

| Qué | Dónde |
|---|---|
| Páginas, menú, textos fijos, interruptores | `build_site.py` |
| Estilos | `style.css` (los ajustes nuevos van al final, en bloques con fecha) |
| Lectura de planillas y logos de Drive | `scripts/sync_planillas.py` → `datos/comercios.json`, `datos/programacion.csv`, `datos/programas.json`, `assets/socios/planilla/`, `assets/programas/` |
| Qué planillas se leen | `datos/fuentes.json` |
| Noticias (notas en Markdown) | `redaccion/*.md` (formato en `redaccion/_plantilla.txt`) |
| Panel de Redacción | `redaccion/index.html`, `assets/redaccion.*`, función `supabase/funciones/redaccion/` |
| Mi pase (credencial, socios, comercios) | `mi-pase.html`, `credencial.html`, `assets/mi-pase*.js`, `supabase/` |
| Publicación automática | `.github/workflows/publicar-sitio.yml` |

**Interruptores en `build_site.py`:** `SECCIONES_OCULTAS` (hoy, solo Tienda), `REDACCION_EN_MENU`, `GEOLOCALIZACION_ACTIVA`, `FRANJA_PROGRAMAS_ACTIVA`.

## Publicación

En cada push a `main`, cada hora y a pedido, GitHub Actions:

1. lee las dos planillas y baja los logos de Drive (`scripts/sync_planillas.py`);
2. achica las fotos de las notas (`scripts/optimizar_fotos.py`);
3. genera el sitio y revisa las notas (`build_site.py --revisar`);
4. guarda las páginas regeneradas con un commit automático y publica en GitHub Pages.

Requisitos en Settings: Pages → Source = **GitHub Actions**; Actions → Workflow permissions = **Read and write**.

Si un logo de Drive no se puede bajar (archivo privado), la publicación sigue: queda el logo anterior o ninguno, y lo avisa en el resumen de Actions. Si la publicación **falla** (cruz roja), la web queda congelada en la última versión buena: revisar Actions enseguida.

## Comandos

```bash
pip install pillow pyyaml pillow-heif pymupdf   # una sola vez
python build_site.py --revisar                  # genera el sitio y revisa las notas
python -m http.server 8000                      # ver la web en http://localhost:8000
python scripts/sync_planillas.py                # lee las planillas (necesita acceso a Google)
```

Antes de dar por terminado un cambio:

- `python build_site.py --revisar` sin errores ni avisos nuevos;
- mirar las páginas tocadas en computadora (~1440 px), tablet (~820 px) y celular (~375 px);
- el menú del celular tiene que mostrar todas las pestañas.

## Entregar cambios a la web oficial

- Partir de la versión que está publicada en `subecanal/web`, no de una vieja.
- El zip lleva **solo los archivos nuevos o cambiados** (GitHub acepta hasta 100 por subida), **con sus carpetas**, incluida `.github/`, y una copia a la vista de `publicar-sitio.yml` por si `.github` no se sube al arrastrar.
- **No incluir `CNAME`** (el dominio de la oficial) ni datos de prueba.
- Dejar `REDACCION_EN_MENU = False`.
- Acompañar con `INSTRUCCIONES.md` (cómo subirlo, paso a paso) y un informe `CAMBIOS-<fecha>.md`.

## Pendientes conocidos

- Logos de programas en Drive compartidos como privados: hay que pasarlos a «Cualquier persona con el vínculo: Lector».
- Supabase: activar Redacción (SQL `03`, función `redaccion`, Secrets) y agregar el dominio oficial en Authentication → URL Configuration. Ver `supabase/LEEME.md`.
- GitHub avisa que algunas acciones del workflow usan Node 20 (obsoleto): actualizarlas.
