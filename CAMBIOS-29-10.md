# SUBE Canal — Cambios de la entrega del 29/10/2026

## Generales
- **Tipografía:**
  - Anton pasa a usarse en títulos, menú, botones, etiquetas, horarios y nombres de programas.
  - Roboto queda para los textos largos (párrafos, descripciones, beneficios), como se definió.
- **Fondo:**
  - Se ve la textura `assets/textura.jpg` (antes una capa negra al 90% la tapaba).
  - Ocupa toda la pantalla, queda fija, sin uniones visibles y sin deformarse.
  - Se mantiene una capa oscura suave para que los textos se lean bien.
- **Logo del header:** 40 px de alto en computadora y 32 px en celular (antes 26 px), sin deformar.
- **Publicación automática:** GitHub lee las planillas cada hora, actualiza los datos y los logos, y publica. La configuración está en `INSTRUCCIONES.md`.

## Home
- **Bajada:** ahora es el texto aprobado por la gerencia: «Somos un canal platense hecho a pulmón. Creamos contenidos, generamos encuentros y construimos comunidad alrededor de la cultura local.»
- **Próxima parada:** el nombre del programa sale de la planilla, en mayúsculas.
- **Franja con logos de programas:** está programada pero apagada, a la espera de la aprobación y de los 5 logos que faltan.

## Comunidad
- **Celulares:** las tarjetas ya no se cortan.
  - La causa: cada tarjeta medía el 82% de la pantalla, pero el espacio entre las flechas era menor.
  - Ahora la tarjeta mide el ancho visible, sin ocultar contenido.
- **Slider infinito:**
  - Al llegar al último comercio sigue con el primero, y al ir hacia atrás desde el primero pasa al último.
  - Funciona con las flechas y deslizando con el dedo.
  - No se agregó ningún programa externo.
- **«¿Tenés un comercio o espacio en La Plata?»:**
  - Ahora tiene fondo verde lima, con una flecha que lo identifica como botón.
  - Se mantuvieron el texto y el destino (mail a laplatasube@gmail.com).
- **Sorteos mensuales:**
  - Es una tarjeta nueva entre los beneficios y el botón para sumar comercios.
  - Dice solo «En SUBE Canal hacemos sorteos todos los meses», con un botón «Seguinos en Instagram» (@subecanal).
  - No se mencionan premios, fechas ni condiciones.

## Contenidos
- **Programación:**
  - Los horarios están destacados (más grandes, en verde y con Anton).
  - Los nombres de los programas aparecen en mayúsculas: se transforman al mostrarse, sin cambiar la planilla.
  - Cada programa tiene una línea «Conduce: …» con los nombres de las columnas `conductor_b1` a `conductor_b3`, como texto sin links.
- **On demand:**
  - Las tarjetas salen de la planilla (filas con `frecuencia` = on demand).
  - Si el programa tiene perfil, la tarjeta lleva al perfil; si es solo una playlist, lleva directo a YouTube.
  - «Especiales» sigue escrito en el código solo hasta que se cargue su fila en la planilla.
- **Perfiles de los programas:** se generan con los datos de la planilla.
  - Muestran nombre, logo, descripción, horario, Instagram del programa, video y playlist, conducción, producción y columnistas.
  - Se quitaron los avisos internos que se veían en público («⚠️ Falta el subtítulo», «Todavía no tenemos cargado…»): si falta un dato, ese bloque no aparece.
  - Como ahora los datos salen de la planilla, en algunos perfiles cambian los nombres del equipo respecto de lo que se publicaba antes (por ejemplo, «Cipriano Ardaiz» en lugar de «Chipi Ardaiz»).

## Pruebas
Se probó en computadora (1280 px), tablet (820 px) y celular (360 px):

| Prueba | Resultado |
|---|---|
| Desplazamiento horizontal en las páginas | Ninguna lo tiene ✔ |
| Errores en la consola | Ninguno ✔ |
| Slider: más allá del último comercio | Pasa al primero ✔ |
| Slider: hacia atrás desde el primero | Pasa al último ✔ |
| Slider: deslizando con el dedo | Funciona ✔ |
| Contenidos | 7 programas con «Conduce:» ✔ |
| On demand | Umbrales y Especiales ✔ |
| Perfiles | Sin avisos internos ✔ |

**No se pudo probar desde nuestro entorno**, porque no tiene acceso a Google: la lectura real de las planillas por GitHub. En una prueba anterior, con estas mismas planillas, el mismo sistema funcionó bien.

## Pendiente de decisión
- **Páginas viejas:** `beneficios.html`, `pasajerxs.html` y `programacion.html` siguen abiertas para quien tenga la dirección, con contenido viejo. Recomendamos redirigirlas antes de difundir el sitio.
- **Mercado Pago:** verificar que los links y los montos ($5.000 y $7.500) estén vigentes.
