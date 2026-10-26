/* ============================================
   SUBE — Verificación pública de credenciales de la redacción
   ------------------------------------------------------
   Es la página que abre el código QR de cada credencial
   (credencial.html?c=CODIGO). No hace falta ingresar: muestra
   si la credencial es válida y, si lo es, nombre, área y sección.
   ============================================ */
(function () {
  var box = document.getElementById('cred-verif');
  if (!box || !window.SubePase) return;
  var API = window.SubePase;
  var MESES = ['enero', 'febrero', 'marzo', 'abril', 'mayo', 'junio', 'julio', 'agosto', 'septiembre', 'octubre', 'noviembre', 'diciembre'];

  function esc(t) {
    return String(t == null ? '' : t).replace(/[&<>"']/g, function (c) {
      return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c];
    });
  }
  var PARTICULAS = { de: 1, del: 1, la: 1, las: 1, los: 1, y: 1, e: 1, da: 1, di: 1, van: 1, von: 1 };
  function nombrePropio(t) {
    return String(t || '').trim().replace(/\s+/g, ' ').toLowerCase().split(' ').map(function (p, i) {
      if (i > 0 && PARTICULAS[p]) return p;
      return p.replace(/(^|[-'’])(\p{L})/gu, function (_, sep, letra) { return sep + letra.toUpperCase(); });
    }).join(' ');
  }
  function fechaLarga(iso) {
    var p = String(iso || '').slice(0, 10).split('-');
    return p.length === 3 ? (+p[2]) + ' de ' + MESES[+p[1] - 1] + ' de ' + p[0] : '—';
  }
  function ahora() {
    var d = new Date();
    return d.getDate() + ' de ' + MESES[d.getMonth()] + ' de ' + d.getFullYear() + ', ' +
      ('0' + d.getHours()).slice(-2) + ':' + ('0' + d.getMinutes()).slice(-2) + ':' + ('0' + d.getSeconds()).slice(-2);
  }

  function resultado(clase, icono, titulo, detalle) {
    box.innerHTML = '<div class="pase-result pase-result--' + clase + ' cred-result"><span class="pase-result-icon">' + icono + '</span>' +
      '<div><strong>' + titulo + '</strong>' + detalle + '</div></div>';
  }

  var codigo = new URLSearchParams(window.location.search).get('c');
  if (!codigo) {
    resultado('muted', '?', 'Escaneá el código QR de una credencial',
      '<span>Cada persona de la redacción de SUBE tiene una credencial con un código QR. Al escanearlo, esta página muestra si es válida.</span>');
    return;
  }

  API.verificarCredencial(codigo).then(function (c) {
    if (c && c.valida) {
      var area = esc(c.area) + (c.seccion ? ' · ' + esc(c.seccion) : '');
      resultado('ok', '✔', 'Credencial válida',
        '<span class="cred-verif-name">' + esc(nombrePropio(c.nombre + ' ' + c.apellido)) + '</span>' +
        '<span>Integra la redacción de SUBE · ' + area + '</span>' +
        '<span>Credencial N.º R-' + ('000' + c.numero).slice(-4) + ' · desde el ' + fechaLarga(c.desde) + '</span>' +
        '<span class="pase-muted" id="cred-hora">Comprobado el ' + ahora() + '</span>');
      setInterval(function () { var h = document.getElementById('cred-hora'); if (h) h.textContent = 'Comprobado el ' + ahora(); }, 1000);
    } else if (c) {
      resultado('no', '✘', 'Credencial dada de baja', '<span>Esta credencial ya no es válida. Ante cualquier duda, escribinos a <a href="mailto:laplatasube@gmail.com">laplatasube@gmail.com</a>.</span>');
    } else {
      resultado('no', '✘', 'Credencial no válida', '<span>Este código no corresponde a ninguna credencial de la redacción de SUBE.</span>');
    }
  }, function () {
    resultado('warn', '!', 'No pudimos comprobarla ahora', '<span>Revisá la conexión a internet y volvé a escanear el código.</span>');
  });
})();
