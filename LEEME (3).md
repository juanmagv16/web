# Redacción SUBE: cómo publicar una nota

Cada nota de la sección **Noticias** es un archivo de texto dentro de la carpeta `redaccion/`. No hace falta tocar código.

## La forma recomendada: el panel de redacción

Entrá a **/redaccion** del sitio (por ejemplo `https://subecanal.com.ar/redaccion`) con tu mail y tu contraseña de SUBE (las mismas de tu credencial). No hay ningún botón en la web que lleve ahí: se entra escribiendo la dirección.

1. Tocá **+ Nueva nota** y completá: título, bajada y el texto (con negritas, links, intertítulos, citas, listas, fotos y videos de YouTube en medio del texto).
2. A la derecha elegí la sección, la fecha, la firma, el lugar en Noticias (Principal, Destacada o Normal) y la portada (foto o video de YouTube).
3. **Guardar** deja la nota como **Borrador**: solo la ve la redacción.
4. **Vista previa** muestra cómo va a quedar.
5. **Publicar en la web**: en uno o dos minutos la nota está en la web.

Para corregir una nota publicada: abrila desde el listado, cambiá lo que haga falta y volvé a tocar **Publicar**. Para sacarla de la web sin borrarla: apagá **Visible en la web** y tocá **Publicar**.

¿Primera vez o te olvidaste la contraseña? Activá o recuperá tu cuenta desde **Mi pase** (`mi-pase.html`). Si te dice que tu cuenta no tiene acceso a Redacción, pedile a la coordinación que te sume.

## Otra forma: subir el archivo desde la web de GitHub

Sirve si el panel no está disponible. Las notas que se suben así también aparecen en el panel. Las notas del panel son archivos `.md` en esta carpeta; también se pueden seguir usando archivos `.txt` como el de la plantilla.

### Publicar una nota nueva (desde la web de GitHub, sin instalar nada)

1. Entrá a la carpeta **`redaccion`** del repositorio en github.com y tocá **Add file → Create new file**.
2. En el nombre del archivo escribí `AAAA-MM-DD-palabras-del-titulo.txt`. Por ejemplo: `2026-10-21-paro-docente.txt`.
   - El nombre (sin la fecha) es la dirección de la nota en la web: esa nota queda en `noticias/paro-docente.html`.
   - Minúsculas, sin tildes ni espacios: separá las palabras con guiones.
3. Abrí [`_plantilla.txt`](../_plantilla.txt) en otra pestaña, copiá su contenido, pegalo y completá los datos (ver la tabla).
4. Escribí la nota debajo de la línea `---`.
5. Si tiene foto: entrá a la carpeta **`assets/noticias`**, tocá **Add file → Upload files** y subila con el mismo nombre que pusiste en `imagen:`. Conviene subir la foto **antes** que la nota.
6. Tocá **Commit changes** (abajo o arriba a la derecha) y confirmá.

En uno o dos minutos la nota aparece publicada. Podés seguir el progreso en la pestaña **Actions**: un círculo amarillo significa que se está publicando; un tilde verde, que ya está en la web.

**Si aparece una cruz roja:** la nota tiene algún problema (por ejemplo, la fecha mal escrita o una foto que no se subió) y **no se publicó nada**. Entrá a **Actions**, abrí el último intento y en el paso "Generar el sitio y revisar las notas" vas a ver el motivo. Corregí el archivo (ícono del lápiz → editar → Commit changes) y se vuelve a intentar solo.

| Campo | Para qué sirve | ¿Obligatorio? |
|---|---|---|
| `titulo` | El título de la nota | Sí |
| `fecha` | Fecha de publicación, en formato `AAAA-MM-DD` | Sí |
| `seccion` | Política, Deportes, Cultura, Agenda, etc. Cada sección nueva aparece sola como filtro en la portada de Noticias | No (si falta, dice "Actualidad") |
| `bajada` | Una o dos oraciones que resumen la nota | No, pero recomendado |
| `autor` | Quién firma la nota | No (si falta, dice "Redacción SUBE") |
| `imagen` | Nombre de la foto, que se sube a la carpeta `assets/noticias/`. También puede ser un link completo a una imagen | No |
| `epigrafe` | Texto debajo de la foto | No |
| `video` | Link de un video de YouTube | No |
| `portada` | `video` para que el video vaya arriba en lugar de la foto (si no hay foto, va arriba solo) | No (por defecto, `foto`) |
| `jerarquia` | `principal` (la nota grande de arriba de Noticias), `destacada` (va después de la principal, antes que las demás) o `normal` | No (por defecto, `normal`) |
| `publicar` | `no` para guardar un borrador sin que aparezca en la web | No (por defecto, `si`) |

## Cómo escribir el cuerpo

- **Párrafos:** separalos con una línea en blanco.
- **Intertítulo:** empezá la línea con `## `.
- **Cita destacada:** empezá la línea con `> `.
- **Negrita:** `**así**`. **Cursiva:** `*así*`.
- **Link:** `[texto que se ve](https://direccion.com)`.
- **Video de YouTube en medio del texto:** pegá el link del video solo, en un párrafo aparte.

Si una nota todavía no tiene cuerpo, se publica igual y muestra el aviso "Esta nota está en redacción".

## Orden y portada

- La portada de Noticias ("Todas") ordena así: arriba y en grande, la **principal**; después las **destacadas**; después las **normales**. Dentro de cada grupo, de la más nueva a la más vieja según la `fecha`.
- Solo puede haber una principal: si marcás otra, la anterior pasa a destacada sola.
- Las pestañas de sección (Deportes, Política…) respetan ese mismo orden.
- La home muestra las 3 primeras notas de ese orden.

## Sacar o corregir una nota

- **Corregir:** abrí el archivo en GitHub, tocá el lápiz, editá y tocá **Commit changes**.
- **Despublicar sin borrar:** cambiá a `publicar: no`.
- **Borrar:** abrí el archivo, tocá los tres puntitos (⋯) → **Delete file** → **Commit changes**. Su página desaparece sola.

Los archivos que empiezan con `_` (como la plantilla) nunca se publican.
