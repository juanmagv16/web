# Redacción SUBE: cómo publicar una nota

Cada nota de la sección **Noticias** es un archivo de texto (`.txt`) dentro de esta carpeta. No hace falta tocar código.

## Publicar una nota nueva

1. Copiá el archivo `_plantilla.txt` y ponele un nombre nuevo con este formato: `AAAA-MM-DD-palabras-del-titulo.txt`. Por ejemplo, `2026-10-21-paro-docente.txt`.
   - El nombre (sin la fecha) es la dirección de la nota en la web. Esa nota quedaría en `noticias/paro-docente.html`.
   - Usá minúsculas, sin tildes ni espacios: separá las palabras con guiones.
2. Completá los datos de arriba (ver la tabla).
3. Escribí la nota debajo de la línea `---`.
4. Guardá el archivo y regenerá el sitio con `python3 build_site.py` (o pedíselo a quien mantenga la web).

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

- **Corregir:** editá el archivo y volvé a generar el sitio.
- **Despublicar sin borrar:** cambiá a `publicar: no`.
- **Borrar:** eliminá el archivo. Al regenerar el sitio, su página desaparece sola.

Los archivos que empiezan con `_` (como la plantilla) nunca se publican.
