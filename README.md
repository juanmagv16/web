# Sube Canal

Sitio web de Sube Canal: presenta los beneficios de la Comunidad de Pasajerxs y permite asociarse mediante Mercado Pago.

Es un sitio estático (HTML + CSS puro, sin build ni dependencias) pensado para alojarse gratis en **GitHub Pages**.

## Estructura

```
index.html          → toda la página (hero, beneficios, asociate)
style.css            → estilos (colores, tipografías, layout)
assets/
  logo.png            → logo de Sube Canal
  textura.jpg         → textura de fondo
  benefits.js         → intenta cargar los beneficios desde la planilla (ver abajo)
  socios/             → logos de los comercios/espacios con beneficios
```

## Beneficios automáticos desde Google Sheets

`assets/benefits.js` intenta traer los beneficios en vivo desde tu planilla
publicada ("Archivo → Compartir → Publicar en la web", exportada como CSV).
Si el navegador logra leerla, reemplaza automáticamente las tarjetas de la
sección Beneficios. **Si no puede** (por ejemplo si Google bloquea el acceso
desde otro dominio, o cambia la estructura de columnas), no pasa nada: la
página se queda con las tarjetas fijas que ya están escritas en `index.html`,
sin mostrar ningún error.

No pude probar en este entorno si Google permite ese acceso desde un sitio
externo (docs.google.com no está habilitado en mi sandbox), así que es
importante que lo verifiques vos una vez publicado el sitio:

1. Publicá el sitio en GitHub Pages (ver más abajo).
2. Abrilo, andá a la sección Beneficios y confirmá si los datos vienen de la
   planilla (probá cambiar un descuento en la planilla y recargar la página
   unos minutos después) o si se quedó con el listado fijo.
3. Si se quedó con el fijo, lo más probable es que los encabezados de columna
   de tu planilla no coincidan con lo que el script espera. El script busca,
   sin importar mayúsculas ni acentos, columnas cuyo título contenga:
   - **Nombre**: "nombre", "comercio", "negocio" o "espacio"
   - **Categoría** (opcional): "rubro" o "categoria"
   - **Instagram** (opcional): "instagram" o "ig"
   - **Logo** (opcional, URL pública a una imagen): "logo" o "imagen"
   - **Beneficio(s)**: cualquier columna que contenga "beneficio" o
     "descuento" (podés tener más de una, por ejemplo "Beneficio 1" y
     "Beneficio 2" — se muestran todas como viñetas)

   Si tus encabezados son distintos, mandámelos (o una captura de la
   primera fila de la planilla) y ajusto el script para que matcheen exacto.

Mientras tanto, el listado fijo en `index.html` sigue siendo la fuente de
verdad y se puede editar a mano como siempre.

## Noticias (redacción)

La sección **Noticias** se arma sola a partir de los archivos de texto de la carpeta `redaccion/`: una nota por archivo. Las fotos van en `assets/noticias/`. Cómo escribir y publicar una nota está explicado en [`redaccion/LEEME.md`](redaccion/LEEME.md). Después de agregar o editar una nota hay que regenerar el sitio con `python3 build_site.py`.

## Cómo publicarlo en GitHub Pages

1. Creá un repositorio nuevo en GitHub (por ejemplo `sube-canal`).
2. Subí **todos** estos archivos y carpetas manteniendo la misma estructura (podés arrastrarlos desde la web de GitHub, o con git):
   ```bash
   git init
   git add .
   git commit -m "Sitio Sube Canal"
   git branch -M main
   git remote add origin https://github.com/TU-USUARIO/sube-canal.git
   git push -u origin main
   ```
3. En el repositorio, andá a **Settings → Pages**.
4. En "Build and deployment" elegí **Deploy from a branch**, rama `main`, carpeta `/ (root)`.
5. Guardá. En un par de minutos el sitio queda publicado en:
   `https://TU-USUARIO.github.io/sube-canal/`

Si más adelante querés un dominio propio (ej. `subecanal.com`), en la misma sección "Pages" hay un campo "Custom domain" donde lo podés cargar (hay que apuntar el DNS del dominio a GitHub).

## Cómo editar contenido

Todo el texto y los links están directamente en `index.html`, ordenado por secciones (con comentarios `<!-- ... -->`):

- **Hero**: título y bajada principal.
- **Qué es**: las 3 tarjetas explicando el canal.
- **Beneficios**: una tarjeta `<article class="benefit-card">` por cada espacio adherido. Para sumar uno nuevo, copiá un bloque entero y cambiá nombre, categoría, beneficio(s) y link de Instagram. Si no tenés el logo, dejá `<div class="benefit-logo mono">X</div>` con la inicial.
- **Asociate**: los 3 planes con sus links de Mercado Pago — si cambian los montos o los links de suscripción, se editan ahí directamente.

Los colores y tipografías están centralizados como variables al principio de `style.css` (bloque `:root`), así que para cambiar la paleta alcanza con tocar esos valores en un solo lugar.

## Beneficios cargados actualmente

.exe informática, Carpincho, Casa Chicha, La Compostera, La Ola Indie, Mascaró, Mundo Semilla, Pao tatt, Refugio 62, Roots Pizza y Tatana. Carpincho, Pao tatt, Refugio 62 y Roots Pizza no tenían logo disponible al momento de armar el sitio, así que muestran un ícono con su inicial — se puede reemplazar apenas tengas el archivo.
