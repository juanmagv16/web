# SUBE Canal: mejoras del 10/11/2026 (web de prueba)

Mejoras de jerarquía, secciones y experiencia para comunidad y comercios, hechas después de revisar cómo lo resuelven Cenital, Futurock, Indie Hoy, Tiempo Argentino, Club La Nación, elDiarioAR y Gelatina. Están **solo en la web de prueba** (`juanmagv16/web`). No se tocaron las planillas ni se inventaron datos: los textos nuevos reutilizan frases que ya estaban en la web o describen cómo funciona hoy el sistema.

## 1. Qué se modificó

### Home
- **Arriba, lo que viene:** «Próxima parada» pasa arriba del video, con la cuenta regresiva en un solo renglón en el celular.
- **Texto de bienvenida más corto:** queda el primer párrafo; el segundo («La Comunidad de Pasajerxs sostiene SUBE…») pasa a presentar la franja de beneficios.
- **Noticias con foto:** la nota principal va grande y las otras dos, más chicas (en el celular, en renglón con foto a la izquierda).
- **Franja nueva de la Comunidad:** los primeros 4 comercios de la planilla, con «Ver los 17 beneficios» y «Quiero ser pasajerx». La cantidad se cambia en `BENEFICIOS_HOME_CANTIDAD`.
- **Sponsors más chicos:** los tres logos van en una fila (antes ocupaban casi una pantalla y media en el celular).

### Comunidad
- **Beneficios en grilla** (antes, un carrusel de a uno), con **filtro por rubro**. Los rubros y las cantidades salen de la planilla.
- En el celular se ven 4 y un botón «Ver los 17 beneficios», para que los aportes no queden lejos.
- **«Cómo funciona» en tres pasos:** asociate, activá tu pase, mostralo.
- **Preguntas frecuentes** (5), armadas con información que ya estaba en la web.
- El botón «¿Tenés un comercio…?» ahora lleva a la página nueva para comercios.

### Contenidos
- **Tarjetas de «Programas»** debajo de la programación: logo, nombre y horario de cada uno, con link a su perfil.

### Contacto
- Ya no es una página «en construcción»: tres caminos (**Soy pasajerx**, **Tengo un comercio o espacio**, **Otras consultas**) con sus accesos y el mail.

### Comercios (nuevo)
- **`comercios.html` · «Sumá tu comercio»:** cómo funciona, qué datos se piden (los mismos de la planilla) y un botón que abre el mail ya armado con esos datos. No está en el menú: se llega desde Comunidad y Contacto.
- **`cartel.html` · Cartel para el local:** para imprimir, con un QR que lleva a Comunidad.
- **Resumen para cada comercio en Mi pase:** verificaciones de este mes, cuántas estaban al día y total. Solo números, sin nombres. Necesita correr `supabase/04-comercio-resumen.sql` (ver pendientes).

### Mi pase
- **Atajo en el celular:** la web ya se puede «agregar a la pantalla de inicio» y abre directo en Mi pase, con ícono de SUBE. El pase muestra cómo hacerlo en Android y en iPhone.

## 2. Archivos tocados

- `build_site.py`: Home, Comunidad, Contenidos, Contacto y las dos páginas nuevas.
- `style.css`: bloque «Mejoras del 10/11» al final.
- Nuevos: `assets/beneficios.js`, `assets/cartel.js`, `assets/icono-192.png`, `assets/icono-512.png`, `mi-pase.webmanifest`, `supabase/04-comercio-resumen.sql`, `comercios.html`, `cartel.html`.
- `assets/mi-pase.js`, `assets/mi-pase-supabase.js`, `assets/mi-pase-datos.js`: atajo y resumen del comercio.
- Las páginas `.html` regeneradas.
- `assets/carousel.js` ya no se usa en Comunidad (el archivo queda).

## 3. Pruebas realizadas

- Sitio generado con la revisión de notas: sin errores ni avisos.
- Capturas en celular (375 px), tablet (820 px) y computadora (1440 px) de Home, Comunidad, Contenidos, Contacto, Sumá tu comercio, Cartel, Noticias, Mi pase y un perfil de programa: sin desbordes ni superposiciones.
- Filtros de rubro y botón «Ver los 17 beneficios»: probados.
- Cartel: el QR se genera y lleva a Comunidad.
- Resumen del comercio: probado **en modo demostración** (`mi-pase.html?demo`).

**Sin verificar desde acá:**
- el resumen del comercio contra la base real (hay que correr el SQL 04);
- el atajo «agregar a la pantalla de inicio» en un celular de verdad;
- la lectura en vivo de planillas, Drive y YouTube (se confirma en Actions).

## 4. Pendiente

**Textos y decisiones que tienen que definir ustedes**
- Nombres para los planes de aporte (hoy los dos mensuales se llaman igual: «Aporte mensual»).
- Más preguntas frecuentes: cada cuánto se actualiza el aporte, cómo darse de baja paso a paso, qué pasa si cambio de mail.
- Confirmar los textos de «Sumá tu comercio» y del cartel.
- Qué 4 comercios van en la Home (hoy, los primeros de la planilla).

**No se hizo en esta tanda**
- **Aviso «EN VIVO»:** la planilla no dice cuánto dura cada programa. Hace falta una columna de duración o de hora de fin.
- **Mails de bienvenida y mensual de beneficios:** hay que elegir con qué herramienta mandarlos.
- **Redacción (programar notas, paso de revisión, aviso de nota abierta):** primero hay que activar el panel en Supabase para poder probarlo de verdad.
- **Panel para que el comercio edite su beneficio:** hoy los beneficios salen de la planilla, que no se modifica desde la web. El comercio avisa el cambio por mail.

**De antes**
- Logos de programas en Drive como privados.
- Supabase: activar Redacción y agregar el dominio oficial.
