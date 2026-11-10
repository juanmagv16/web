# Mi pase: configuración de Supabase

Supabase guarda la lista de socios, los comercios adheridos, el equipo de Sube y el registro de búsquedas, y se encarga de los ingresos con mail y contraseña.

## 1. Crear la estructura (una sola vez)

1. En Supabase, abrí el proyecto `sube-mi-pase` y entrá a **SQL Editor → New query**.
2. Abrí el archivo [`01-estructura.sql`](01-estructura.sql) y copiá todo su contenido.
3. **Antes de correrlo**, bajá hasta el final del archivo: ahí está la lista de mails del **equipo de Sube** (las personas que van a poder cargar el Excel y ver el registro). Reemplazá o agregá los mails que correspondan.
4. Pegalo en el editor y tocá **Run**. Tiene que terminar con "Success". Se puede volver a correr sin problema.

## 2. Que solo puedan crear cuenta quienes están en las listas

1. Entrá a **Authentication → Hooks** (en algunos paneles: *Auth Hooks*).
2. Agregá el hook **Before User Created**, tipo **Postgres**.
3. Elegí el esquema `public` y la función `solo_miembros`. Guardá.

Con esto, si alguien que no es socio, comercio adherido ni parte del equipo intenta activar una cuenta, Supabase la rechaza.

## 3. Direcciones de la web

En **Authentication → URL Configuration**:

- **Site URL:** `https://subecanal.com.ar/mi-pase.html`
- **Redirect URLs:** agregá también
  - `https://subecanal.com.ar/mi-pase.html`
  - `https://juanmagv16.github.io/web/mi-pase.html` (la copia de prueba)

Son las páginas a las que puede llevar el link que llega por mail.

## 4. Datos que necesita la web

En **Project Settings → API Keys** están:

- **Project URL** y clave **publishable** (`sb_publishable_…`): son públicas y van dentro de la web.
- Clave **secret** (`sb_secret_…`): **no se comparte ni se pega en ningún archivo**. Da acceso total a los datos de los socios.

## 5. Credenciales de la redacción (actualización de octubre 2026)

Para sumar las credenciales y el portal de trabajo de la redacción, volvé a correr **todo** `01-estructura.sql` en el SQL Editor (igual que en el paso 1). No borra ni cambia los datos cargados: agrega la tabla `redaccion`, la tabla `portal_enlaces` con 5 accesos de ejemplo y actualiza las funciones.

- Las personas del equipo se suman desde la administración → pestaña **Credenciales del equipo**.
- Entran desde el acceso del equipo, una página no publicada (su dirección está en `ACCESO_EQUIPO`, dentro de `build_site.py`). La administración tiene su propia página no publicada (`ACCESO_GESTION`).
- Los accesos del portal se editan en **Table Editor → portal_enlaces** (título, descripción, link, orden; `activo` en falso para ocultar uno).
- El código QR de cada credencial abre `credencial.html`, que muestra si es válida, sin pedir ingreso.

## Quién ve qué

| | Socio | Comercio | Redacción | Equipo Sube | Visitante |
|---|---|---|---|---|---|
| Su propio boleto | ✔ | — | ✔ (si además es socio) | — | — |
| Verificar a un socio (activo / no activo) | — | ✔ | — | — | — |
| Su credencial y el portal de trabajo | — | — | ✔ | ✔ (si además es de la redacción) | — |
| Comprobar una credencial con su código QR (nombre, área y sección) | ✔ | ✔ | ✔ | ✔ | ✔ |
| Lista de socios con mails | — | — | — | ✔ | — |
| Cargar el Excel mensual | — | — | — | ✔ | — |
| Alta y baja de comercios y de la redacción | — | — | — | ✔ | — |
| Registro de búsquedas | — | — | — | ✔ | — |

## Panel de Redacción (/redaccion)

La redacción entra a `/redaccion` (por ejemplo `https://subecanal.com.ar/redaccion`) con su mail y contraseña de SUBE. No hay ningún botón en la web que lleve ahí. El panel guarda los borradores en Supabase y, al publicar, escribe la nota en GitHub (carpeta `redaccion/`). GitHub regenera la web sola.

Quién entra: las personas **activas** de la tabla `redaccion` y las del `equipo`. Las notas publicadas solo las puede **borrar** el equipo; la redacción puede sacarlas de la web con «Visible en la web».

### Activarlo (una sola vez)

1. **Base de datos.** SQL Editor → New query → pegá todo `03-redaccion-notas.sql` → **Run**. Crea la tabla `notas` y cambia el acceso del portal de trabajo de `admin/` a `redaccion/`.
2. **Llave de GitHub** (la creás vos; no se la pases a nadie):
   - github.com → tu foto → **Settings → Developer settings → Personal access tokens → Fine-grained tokens → Generate new token**.
   - Nombre: `SUBE redacción`. Vencimiento: 1 año (anotá la fecha para renovarla).
   - **Repository access → Only select repositories →** el repositorio de la web.
   - **Permissions → Repository permissions → Contents: Read and write**. Nada más.
   - **Generate token** y copiala (empieza con `github_pat_`).
3. **Función.** Supabase → **Edge Functions → Deploy a new function → Via Editor**.
   - Nombre: `redaccion` (así, sin tilde).
   - Borrá el ejemplo y pegá todo el contenido de `funciones/redaccion/index.ts` → **Deploy**.
   - En la función → **Details** (o Settings): apagá **Verify JWT with legacy secret** → **Save**. La función comprueba sola quién ingresó.
4. **Secrets.** Edge Functions → **Secrets** → agregá:
   - `GITHUB_TOKEN` = la llave del paso 2
   - `GITHUB_REPO` = `juanmagv16/web` (en la web oficial: `subecanal/web`)
5. **Probar.** Entrá a `/redaccion` con tu usuario: tienen que aparecer las notas que ya están publicadas.

### Si algo falla

- *«Tu cuenta no tiene acceso a Redacción»*: esa persona no está activa en la tabla `redaccion` ni en `equipo`.
- *«No hay conexión o el panel todavía no está activado»*: falta el paso 3, o el nombre de la función no es `redaccion`.
- *«GitHub rechazó la llave»*: la llave venció o no tiene permiso **Contents: Read and write** sobre el repositorio. Generá otra y reemplazá `GITHUB_TOKEN`.
- Los mensajes técnicos quedan en Edge Functions → `redaccion` → **Logs**.

## Resumen para cada comercio (opcional)

Para que cada comercio vea en Mi pase cuántas verificaciones hizo (este mes y en total):

1. En Supabase, entrá a **SQL Editor**.
2. Pegá todo el contenido de `04-comercio-resumen.sql` y tocá **Run**.

Solo muestra números, nunca nombres. Mientras no se corra, la web funciona igual y el resumen no aparece.
