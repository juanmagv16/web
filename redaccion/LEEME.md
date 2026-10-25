# Redacción SUBE: cómo publicar una nota

Cada nota de la sección **Noticias** es un archivo de texto (`.txt`) dentro de esta carpeta. No hace falta tocar código.

## Publicar una nota nueva (desde la web de GitHub, sin instalar nada)

1. Entrá a la carpeta **`redaccion`** del repositorio en github.com y tocá **Add file → Create new file**.
2. En el nombre del archivo escribí `AAAA-MM-DD-palabras-del-titulo.txt`. Por ejemplo: `2026-10-21-paro-docente.txt`.
   - El nombre (sin la fecha) es la dirección de la nota en la web: esa nota queda en `noticias/paro-docente.html`.
   - Minúsculas, sin tildes ni espacios: separá las palabras con guiones.
3. Abrí [`_plantilla.txt`](_plantilla.txt) en otra pestaña, copiá su contenido, pegalo y completá los datos (ver la tabla).
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
| `destacada` | `si` para que aparezca entre las 3 "Noticias destacadas" de la home | No |
| `publicar` | `no` para guardar un borrador sin que aparezca en la web | No (por defecto, `si`) |

## Cómo escribir el cuerpo

- **Párrafos:** separalos con una línea en blanco.
- **Intertítulo:** empezá la línea con `## `.
- **Cita destacada:** empezá la línea con `> `.
- **Negrita:** `**así**`. **Cursiva:** `*así*`.
- **Link:** `[texto que se ve](https://direccion.com)`.

Si una nota todavía no tiene cuerpo, se publica igual y muestra el aviso "Esta nota está en redacción".

## Orden y portada

- La portada de Noticias muestra las notas de la más nueva a la más vieja, según la `fecha`. La más nueva va arriba, en grande.
- La home muestra 3 notas: primero las marcadas como `destacada: si` (las más nuevas) y, si no alcanzan, se completan con las últimas publicadas.

## Sacar o corregir una nota

- **Corregir:** abrí el archivo en GitHub, tocá el lápiz, editá y tocá **Commit changes**.
- **Despublicar sin borrar:** cambiá a `publicar: no`.
- **Borrar:** abrí el archivo, tocá los tres puntitos (⋯) → **Delete file** → **Commit changes**. Su página desaparece sola.

Los archivos que empiezan con `_` (como la plantilla) nunca se publican.
