/* ============================================
   SUBE — Mi pase (pantallas)
   ------------------------------------------------------
   Pasajerxs: activan su cuenta con su mail, eligen contraseña
   y ven su boleto "vivo" (nombre, vigencia y hora en tiempo real).
   Comercios adheridos: buscan a un socio por nombre y apellido
   y ven si está activo o no.
   Equipo de Sube: carga el Excel mensual de socios, da de alta
   y de baja comercios y ve el registro de búsquedas.

   Los datos los maneja window.SubePase (assets/mi-pase-datos.js).
   ============================================ */
(function () {
  var app = document.getElementById('pase-app');
  if (!app || !window.SubePase) return;
  var API = window.SubePase;
  var DEMO = API.modo === 'demo';
  var MP_LINK = 'comunidad.html#asociate';
  var XLSX_URL = 'https://cdnjs.cloudflare.com/ajax/libs/xlsx/0.18.5/xlsx.full.min.js';
  var relojTimer = null;

  // ---------- Utilidades ----------
  function esc(t) {
    return String(t == null ? '' : t).replace(/[&<>"']/g, function (c) {
      return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c];
    });
  }
  var MESES = ['enero', 'febrero', 'marzo', 'abril', 'mayo', 'junio', 'julio', 'agosto', 'septiembre', 'octubre', 'noviembre', 'diciembre'];
  var DIAS = ['domingo', 'lunes', 'martes', 'miércoles', 'jueves', 'viernes', 'sábado'];
  function fechaCorta(iso) {
    if (!iso) return '—';
    var p = iso.slice(0, 10).split('-');
    return p[2] + '/' + p[1] + '/' + p[0];
  }
  function fechaHora(iso) {
    var d = new Date(iso);
    return ('0' + d.getDate()).slice(-2) + '/' + ('0' + (d.getMonth() + 1)).slice(-2) + '/' + d.getFullYear() +
      ' ' + ('0' + d.getHours()).slice(-2) + ':' + ('0' + d.getMinutes()).slice(-2);
  }
  function $(sel) { return app.querySelector(sel); }
  function on(sel, ev, fn) { var el = $(sel); if (el) el.addEventListener(ev, fn); }
  function pararReloj() { if (relojTimer) { clearInterval(relojTimer); relojTimer = null; } }

  function mostrar(html) {
    pararReloj();
    app.innerHTML = (DEMO ? avisoDemo() : '') + html;
    on('[data-reiniciar-demo]', 'click', function () {
      if (confirm('¿Volver a los datos de ejemplo? Se borran las pruebas que hiciste.')) API.reiniciarDemo().then(inicio);
    });
    app.querySelectorAll('input[type=password]').forEach(botonVerClave);
    var foco = app.querySelector('[autofocus]');
    if (foco) foco.focus();
    window.scrollTo({ top: 0 });
  }

  // Botón con un ojo para mostrar u ocultar lo que se escribe en la contraseña
  var OJO = '<svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true"><path d="M2 12s3.6-7 10-7 10 7 10 7-3.6 7-10 7S2 12 2 12z"></path><circle cx="12" cy="12" r="3"></circle></svg>';
  var OJO_TACHADO = '<svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true"><path d="M2 12s3.6-7 10-7c2.1 0 3.9.8 5.4 1.8M22 12s-3.6 7-10 7c-2.1 0-3.9-.8-5.4-1.8"></path><path d="M9.9 9.9a3 3 0 0 0 4.2 4.2"></path><path d="M3 3l18 18"></path></svg>';
  function botonVerClave(input) {
    var caja = document.createElement('span');
    caja.className = 'pase-pass';
    input.parentNode.insertBefore(caja, input);
    caja.appendChild(input);
    var btn = document.createElement('button');
    btn.type = 'button';
    btn.className = 'pase-pass-toggle';
    btn.setAttribute('aria-pressed', 'false');
    btn.setAttribute('aria-label', 'Mostrar contraseña');
    btn.innerHTML = OJO + '<span>Ver</span>';
    btn.addEventListener('click', function () {
      var visible = input.type === 'password';
      input.type = visible ? 'text' : 'password';
      btn.setAttribute('aria-pressed', visible ? 'true' : 'false');
      btn.setAttribute('aria-label', visible ? 'Ocultar contraseña' : 'Mostrar contraseña');
      btn.innerHTML = (visible ? OJO_TACHADO + '<span>Ocultar</span>' : OJO + '<span>Ver</span>');
      input.focus();
      try { var n = input.value.length; input.setSelectionRange(n, n); } catch (e) { /* ok */ }
    });
    caja.appendChild(btn);
  }

  function avisoDemo() {
    return '<div class="pase-demo" role="note">' +
      '<strong>Modo demostración.</strong> Los socios y comercios son inventados y lo que pruebes queda solo en tu navegador. ' +
      '<details><summary>Cuentas para probar</summary>' +
      '<ul>' +
      '<li><b>Pasajerx al día:</b> ana.demo@ejemplo.com · clave <code>sube1234</code></li>' +
      '<li><b>Pasajerx vencida:</b> carla.prueba@ejemplo.com · clave <code>sube1234</code></li>' +
      '<li><b>Pasajerx sin activar:</b> bruno.ejemplo@ejemplo.com (tocá "Activar mi cuenta")</li>' +
      '<li><b>Comercio:</b> casachicha@demo.subecanal.com.ar · clave <code>sube1234</code></li>' +
      '<li><b>Equipo Sube:</b> finanzas@demo.subecanal.com.ar · clave <code>sube1234</code></li>' +
      '</ul>' +
      '<button type="button" class="pase-link" data-reiniciar-demo>Volver a los datos de ejemplo</button>' +
      '</details></div>';
  }

  function errorHtml(msg) { return '<p class="pase-error" role="alert">' + esc(msg) + '</p>'; }
  function mostrarError(sel, err) {
    var box = $(sel); if (box) box.innerHTML = errorHtml(err && err.message ? err.message : err);
  }
  function ocupado(btn, si) { if (!btn) return; btn.disabled = si; btn.classList.toggle('is-busy', si); }

  var PRIVACIDAD = '<details class="pase-privacidad"><summary>Leer el aviso de privacidad</summary>' +
    document.getElementById('aviso-privacidad-texto').innerHTML + '</details>';

  // ============================================
  // INICIO: dos puertas
  // ============================================
  function inicio() {
    mostrar(
      '<div class="pase-doors">' +
      '<button type="button" class="pase-door" data-go="socio">' +
      '<span class="pase-door-eyebrow">Soy pasajerx</span>' +
      '<span class="pase-door-title">Ver mi boleto</span>' +
      '<span class="pase-door-desc">Entrá con tu mail para ver si estás al día y mostrar tu boleto en los comercios adheridos.</span>' +
      '<span class="pase-door-arrow">→</span></button>' +
      '<button type="button" class="pase-door pase-door--alt" data-go="comercio">' +
      '<span class="pase-door-eyebrow">Soy comercio adherido</span>' +
      '<span class="pase-door-title">Verificar socios</span>' +
      '<span class="pase-door-desc">Buscá a una persona por nombre y apellido para confirmar que es socia activa de la comunidad.</span>' +
      '<span class="pase-door-arrow">→</span></button>' +
      '</div>' +
      '<p class="pase-admin-link"><button type="button" class="pase-link" data-go="admin">Acceso equipo Sube</button></p>'
    );
    app.querySelectorAll('[data-go]').forEach(function (b) {
      b.addEventListener('click', function () { ingreso(b.getAttribute('data-go')); });
    });
  }

  // ============================================
  // INGRESO (los tres roles)
  // ============================================
  var TEXTOS = {
    socio: { titulo: 'Ingresá a tu pase', eyebrow: 'Pasajerx',
      ayuda: '¿Es la primera vez que entrás? Activá tu cuenta con el mail con el que te suscribiste.' },
    comercio: { titulo: 'Ingreso de comercios', eyebrow: 'Comercio adherido',
      ayuda: '¿Primera vez? Activá la cuenta con el mail que le diste a Sube.' },
    admin: { titulo: 'Equipo Sube', eyebrow: 'Administración', ayuda: '' }
  };

  function ingreso(rol) {
    var t = TEXTOS[rol];
    mostrar(
      '<div class="pase-card">' +
      '<button type="button" class="pase-back" data-volver>← Volver</button>' +
      '<p class="eyebrow">' + t.eyebrow + '</p><h2>' + t.titulo + '</h2>' +
      '<form class="pase-form" id="f-ingreso" novalidate>' +
      '<label>Mail<input type="email" name="mail" autocomplete="email" required autofocus></label>' +
      '<label>Contraseña<input type="password" name="clave" autocomplete="current-password" required></label>' +
      '<div id="f-error"></div>' +
      '<button class="btn btn-primary" type="submit">Ingresar</button>' +
      '</form>' +
      (rol !== 'admin'
        ? '<div class="pase-alt"><p>' + t.ayuda + '</p>' +
          '<button type="button" class="btn btn-ghost" data-activar>Activar mi cuenta</button>' +
          '<button type="button" class="pase-link" data-olvide>Olvidé mi contraseña</button></div>'
        : '') +
      '</div>'
    );
    on('[data-volver]', 'click', inicio);
    on('[data-activar]', 'click', function () { pedirEnlace(rol, false); });
    on('[data-olvide]', 'click', function () { pedirEnlace(rol, true); });
    on('#f-ingreso', 'submit', function (e) {
      e.preventDefault();
      var f = e.target, btn = f.querySelector('button[type=submit]');
      ocupado(btn, true);
      API.ingresar(rol, f.mail.value, f.clave.value).then(panel, function (err) {
        ocupado(btn, false); mostrarError('#f-error', err);
      });
    });
  }

  // ---------- Activar cuenta / olvidé mi contraseña ----------
  function pedirEnlace(rol, olvido) {
    mostrar(
      '<div class="pase-card">' +
      '<button type="button" class="pase-back" data-volver>← Volver</button>' +
      '<p class="eyebrow">' + TEXTOS[rol].eyebrow + '</p>' +
      '<h2>' + (olvido ? 'Recuperar contraseña' : 'Activar mi cuenta') + '</h2>' +
      '<p class="pase-sub">' + (rol === 'socio'
        ? 'Escribí el mail con el que te suscribiste en Mercado Pago. Te vamos a mandar un link para que elijas tu contraseña.'
        : 'Escribí el mail del comercio. Te vamos a mandar un link para que elijas la contraseña.') + '</p>' +
      '<form class="pase-form" id="f-enlace" novalidate>' +
      '<label>Mail<input type="email" name="mail" autocomplete="email" required autofocus></label>' +
      '<div id="f-error"></div>' +
      '<button class="btn btn-primary" type="submit">Enviarme el link</button>' +
      '</form></div>'
    );
    on('[data-volver]', 'click', function () { ingreso(rol); });
    on('#f-enlace', 'submit', function (e) {
      e.preventDefault();
      var btn = e.target.querySelector('button[type=submit]'); ocupado(btn, true);
      API.pedirEnlace(rol, e.target.mail.value).then(function (r) { enlaceEnviado(rol, r); }, function (err) {
        ocupado(btn, false);
        var extra = rol === 'socio'
          ? '<p class="pase-help">Si te suscribiste con otro mail, probá con ese. Si cambiaste de mail en Mercado Pago, avisanos desde <a href="comunidad.html#asociate">esta sección</a> o escribinos a <a href="mailto:laplatasube@gmail.com">laplatasube@gmail.com</a>.</p>'
          : '';
        $('#f-error').innerHTML = errorHtml(err.message) + extra;
      });
    });
  }

  function enlaceEnviado(rol, r) {
    mostrar(
      '<div class="pase-card pase-card--center">' +
      '<div class="pase-icon" aria-hidden="true">✉</div>' +
      '<h2>Revisá tu mail</h2>' +
      '<p class="pase-sub">Te mandamos un link a <strong>' + esc(r.enviado_a) + '</strong>. Abrilo desde este mismo dispositivo para elegir tu contraseña. Si no lo ves, fijate en spam o promociones.</p>' +
      (DEMO && r.enlace_demo
        ? '<div class="pase-demo pase-demo--inline"><strong>Demostración:</strong> todavía no se mandan mails de verdad. Tocá el botón para seguir como si hubieras abierto el link.' +
          '<button type="button" class="btn btn-primary" data-abrir>Abrir el link</button></div>'
        : '') +
      '<button type="button" class="pase-link" data-volver>Volver al ingreso</button></div>'
    );
    on('[data-volver]', 'click', function () { ingreso(rol); });
    on('[data-abrir]', 'click', function () { elegirClave(rol, r.enlace_demo); });
  }

  function elegirClave(rol, token) {
    mostrar(
      '<div class="pase-card">' +
      '<p class="eyebrow">' + TEXTOS[rol].eyebrow + '</p><h2>Elegí tu contraseña</h2>' +
      '<form class="pase-form" id="f-clave" novalidate>' +
      '<label>Contraseña nueva<input type="password" name="clave" autocomplete="new-password" minlength="8" required autofocus>' +
      '<span class="pase-hint">Al menos 8 caracteres.</span></label>' +
      '<label>Repetila<input type="password" name="clave2" autocomplete="new-password" required></label>' +
      (rol === 'socio'
        ? '<label class="pase-check"><input type="checkbox" name="privacidad"> <span>Leí y acepto el aviso de privacidad de Sube.</span></label>' + PRIVACIDAD
        : '') +
      '<div id="f-error"></div>' +
      '<button class="btn btn-primary" type="submit">Guardar y entrar</button>' +
      '</form></div>'
    );
    on('#f-clave', 'submit', function (e) {
      e.preventDefault();
      var f = e.target;
      if (f.clave.value !== f.clave2.value) return mostrarError('#f-error', 'Las dos contraseñas no coinciden.');
      var btn = f.querySelector('button[type=submit]'); ocupado(btn, true);
      API.definirClave(token, f.clave.value, f.privacidad ? f.privacidad.checked : true).then(panel, function (err) {
        ocupado(btn, false); mostrarError('#f-error', err);
      });
    });
  }

  // ============================================
  // PANELES
  // ============================================
  function panel(sesion) {
    if (!sesion) return inicio();
    if (sesion.rol === 'socio') return panelSocio(sesion);
    if (sesion.rol === 'comercio') return panelComercio(sesion);
    return panelAdmin(sesion, 'socios');
  }

  function barraSesion(sesion, rotulo) {
    return '<div class="pase-session"><span>' + rotulo + ' · <strong>' + esc(sesion.nombre) + '</strong></span>' +
      '<button type="button" class="pase-link" data-salir>Salir</button></div>';
  }
  function engancharSalir() { on('[data-salir]', 'click', function () { API.salir().then(inicio); }); }

  // ---------- Pasajerx: el boleto ----------
  function panelSocio(sesion) {
    API.miPase().then(function (p) {
      var nombre = esc(p.nombre + ' ' + p.apellido);
      var ticket;
      if (p.al_dia) {
        ticket =
          '<div class="ticket ticket--ok" aria-live="polite">' +
          '<div class="ticket-head"><img src="assets/logo.png" alt="SUBE"><span>Comunidad de Pasajerxs</span></div>' +
          '<div class="ticket-status"><span class="ticket-dot" aria-hidden="true"></span>Pasajerx al día</div>' +
          '<div class="ticket-name">' + nombre + '</div>' +
          '<div class="ticket-row"><span>Vigente hasta</span><strong>' + fechaCorta(p.vigente_hasta) + '</strong></div>' +
          '<div class="ticket-perf" aria-hidden="true"></div>' +
          '<div class="ticket-clock"><span class="ticket-time" id="t-hora">--:--:--</span><span class="ticket-date" id="t-fecha"></span></div>' +
          '<div class="ticket-strip" aria-hidden="true"></div>' +
          '<p class="ticket-foot">Mostrá esta pantalla en los comercios adheridos. La hora corre en vivo: una captura de pantalla no sirve.</p>' +
          '</div>';
      } else {
        ticket =
          '<div class="ticket ticket--off">' +
          '<div class="ticket-head"><img src="assets/logo.png" alt="SUBE"><span>Comunidad de Pasajerxs</span></div>' +
          '<div class="ticket-status">Suscripción vencida</div>' +
          '<div class="ticket-name">' + nombre + '</div>' +
          (p.vigente_hasta ? '<div class="ticket-row"><span>Venció el</span><strong>' + fechaCorta(p.vigente_hasta) + '</strong></div>' : '') +
          '<div class="ticket-perf" aria-hidden="true"></div>' +
          '<p class="ticket-foot">Para volver a usar los beneficios, renová tu aporte. Si ya pagaste, puede tardar hasta la próxima actualización mensual.</p>' +
          '<a class="btn btn-primary" href="' + MP_LINK + '">Renovar mi aporte</a>' +
          '</div>';
      }
      mostrar(barraSesion(sesion, 'Pasajerx') + '<div class="pase-ticket-wrap">' + ticket + '</div>' +
        '<p class="pase-note">¿Algún dato está mal? Escribinos a <a href="mailto:laplatasube@gmail.com">laplatasube@gmail.com</a>.</p>');
      engancharSalir();
      if (p.al_dia) iniciarReloj();
    }, function () { API.salir().then(inicio); });
  }

  function iniciarReloj() {
    var hora = $('#t-hora'), fecha = $('#t-fecha');
    function tick() {
      var d = new Date();
      if (hora) hora.textContent = ('0' + d.getHours()).slice(-2) + ':' + ('0' + d.getMinutes()).slice(-2) + ':' + ('0' + d.getSeconds()).slice(-2);
      if (fecha) fecha.textContent = DIAS[d.getDay()] + ' ' + d.getDate() + ' de ' + MESES[d.getMonth()];
    }
    tick(); relojTimer = setInterval(tick, 1000);
  }

  // ---------- Comercio: buscador ----------
  function panelComercio(sesion) {
    mostrar(barraSesion(sesion, 'Comercio') +
      '<div class="pase-card">' +
      '<p class="eyebrow">Verificar socio</p><h2>¿Es socix de la comunidad?</h2>' +
      '<p class="pase-sub">Escribí el nombre y el apellido tal como te lo dice la persona.</p>' +
      '<form class="pase-form pase-search" id="f-buscar" novalidate autocomplete="off">' +
      '<label class="sr-only" for="q">Nombre y apellido</label>' +
      '<input id="q" type="search" name="q" placeholder="Nombre y apellido" autocomplete="off" required autofocus>' +
      '<button class="btn btn-primary" type="submit">Verificar</button>' +
      '</form>' +
      '<div id="resultado" aria-live="polite"></div>' +
      '</div>'
    );
    engancharSalir();
    on('#f-buscar', 'submit', function (e) {
      e.preventDefault();
      var q = e.target.q.value, btn = e.target.querySelector('button[type=submit]');
      ocupado(btn, true);
      API.verificarSocio(q).then(function (r) {
        ocupado(btn, false);
        var nombre = esc(q.trim());
        var html;
        if (r.resultado === 'activo') html = '<div class="pase-result pase-result--ok"><span class="pase-result-icon">✔</span><div><strong>Socix activx</strong><span>' + nombre + ' está al día con la comunidad.</span></div></div>';
        else if (r.resultado === 'repetido') html = '<div class="pase-result pase-result--warn"><span class="pase-result-icon">!</span><div><strong>Hay más de un socio con ese nombre</strong><span>Pedile algún dato más (por ejemplo, su mail) y escribinos para confirmarlo.</span></div></div>';
        else html = '<div class="pase-result pase-result--no"><span class="pase-result-icon">✘</span><div><strong>No figura como socix activx</strong><span>Revisá que el nombre y el apellido estén bien escritos.</span></div></div>';
        $('#resultado').innerHTML = html;
        e.target.q.select();
      }, function (err) { ocupado(btn, false); $('#resultado').innerHTML = errorHtml(err.message); });
    });
  }

  // ============================================
  // ADMINISTRACIÓN
  // ============================================
  var PESTANAS = [['socios', 'Socios'], ['excel', 'Cargar Excel'], ['comercios', 'Comercios'], ['registro', 'Registro de búsquedas']];

  function panelAdmin(sesion, pestana) {
    mostrar(barraSesion(sesion, 'Equipo Sube') +
      '<div class="pase-tabs" role="tablist">' + PESTANAS.map(function (p) {
        return '<button type="button" role="tab" class="pase-tab' + (p[0] === pestana ? ' is-active' : '') + '" data-tab="' + p[0] + '" aria-selected="' + (p[0] === pestana) + '">' + p[1] + '</button>';
      }).join('') + '</div><div id="admin-body" class="pase-admin"><p class="pase-loading">Cargando…</p></div>');
    engancharSalir();
    app.querySelectorAll('[data-tab]').forEach(function (b) {
      b.addEventListener('click', function () { panelAdmin(sesion, b.getAttribute('data-tab')); });
    });
    ({ socios: adminSocios, excel: adminExcel, comercios: adminComercios, registro: adminRegistro })[pestana](sesion);
  }

  function badge(txt, tipo) { return '<span class="pase-badge pase-badge--' + tipo + '">' + txt + '</span>'; }

  // ---------- Socios ----------
  function adminSocios() {
    API.admin.socios().then(function (lista) {
      var activos = lista.filter(function (s) { return s.al_dia; }).length;
      var activadas = lista.filter(function (s) { return s.cuenta_activada; }).length;
      var body = $('#admin-body');
      body.innerHTML =
        '<div class="pase-stats">' +
        stat(lista.length, 'socios en la lista') + stat(activos, 'al día') + stat(activadas, 'activaron su cuenta') +
        '</div>' +
        '<input type="search" class="pase-filter" id="filtro" placeholder="Filtrar por nombre o mail">' +
        '<div class="pase-table-wrap"><table class="pase-table"><thead><tr><th>Nombre</th><th>Mail</th><th>Estado</th><th>Vigente hasta</th><th>Cuenta</th></tr></thead><tbody id="tbody"></tbody></table></div>';
      function pintar(f) {
        f = API.normalizar(f);
        $('#tbody').innerHTML = lista.filter(function (s) {
          return !f || API.normalizar(s.nombre + ' ' + s.apellido + ' ' + s.mail).indexOf(f) >= 0;
        }).sort(function (a, b) { return (a.apellido + a.nombre).localeCompare(b.apellido + b.nombre); }).map(function (s) {
          return '<tr><td>' + esc(s.nombre + ' ' + s.apellido) + '</td><td>' + esc(s.mail) + '</td><td>' +
            (s.al_dia ? badge('Al día', 'ok') : badge('Vencido', 'no')) + '</td><td>' + fechaCorta(s.vigente_hasta) + '</td><td>' +
            (s.cuenta_activada ? 'Activada' : '<span class="pase-muted">Sin activar</span>') + '</td></tr>';
        }).join('') || '<tr><td colspan="5" class="pase-muted">No hay socios que coincidan.</td></tr>';
      }
      pintar('');
      on('#filtro', 'input', function (e) { pintar(e.target.value); });
    });
  }
  function stat(n, txt) { return '<div class="pase-stat"><strong>' + n + '</strong><span>' + txt + '</span></div>'; }

  // ---------- Cargar Excel ----------
  function adminExcel(sesion) {
    $('#admin-body').innerHTML =
      '<div class="pase-card pase-card--flat">' +
      '<h3>Carga mensual de socios</h3>' +
      '<p class="pase-sub">Subí el Excel con <strong>todos</strong> los socios del mes. Quienes estaban en la lista y no figuran en el Excel nuevo pasan a <strong>vencidos</strong>. Antes de guardar vas a ver un resumen de los cambios.</p>' +
      '<p class="pase-sub">Columnas que se reconocen: <b>Nombre</b> y <b>Apellido</b> (o una sola columna "Nombre y apellido"), <b>Mail</b>, <b>Estado</b> (activo / inactivo) y, si querés, <b>Vigente hasta</b>. ' +
      '<a href="assets/plantilla-socios.xlsx" download>Descargar plantilla de ejemplo</a></p>' +
      '<label class="pase-drop" id="drop"><input type="file" id="archivo" accept=".xlsx,.xls,.csv" hidden>' +
      '<span class="pase-drop-title">Arrastrá el Excel acá</span><span class="pase-drop-sub">o tocá para elegirlo (.xlsx, .xls o .csv)</span></label>' +
      '<div id="excel-out"></div></div>';
    var drop = $('#drop'), input = $('#archivo');
    ['dragover', 'dragenter'].forEach(function (ev) { drop.addEventListener(ev, function (e) { e.preventDefault(); drop.classList.add('is-over'); }); });
    ['dragleave', 'drop'].forEach(function (ev) { drop.addEventListener(ev, function () { drop.classList.remove('is-over'); }); });
    drop.addEventListener('drop', function (e) { e.preventDefault(); if (e.dataTransfer.files[0]) leerArchivo(e.dataTransfer.files[0], sesion); });
    input.addEventListener('change', function () { if (input.files[0]) leerArchivo(input.files[0], sesion); });
  }

  function cargarXLSX() {
    if (window.XLSX) return Promise.resolve(window.XLSX);
    return new Promise(function (ok, mal) {
      var s = document.createElement('script');
      s.src = XLSX_URL; s.onload = function () { ok(window.XLSX); };
      s.onerror = function () { mal(new Error('No se pudo cargar el lector de Excel. Revisá la conexión y probá de nuevo.')); };
      document.head.appendChild(s);
    });
  }

  function leerArchivo(file, sesion) {
    var out = $('#excel-out');
    out.innerHTML = '<p class="pase-loading">Leyendo ' + esc(file.name) + '…</p>';
    cargarXLSX().then(function (XLSX) {
      return file.arrayBuffer().then(function (buf) {
        var wb = XLSX.read(buf, { type: 'array', cellDates: true });
        var hoja = wb.Sheets[wb.SheetNames[0]];
        var filas = XLSX.utils.sheet_to_json(hoja, { header: 1, defval: '', raw: true, blankrows: true });
        return interpretar(filas);
      });
    }).then(function (r) {
      if (r.error) { out.innerHTML = errorHtml(r.error); return; }
      return API.admin.previsualizarImportacion(r.filas).then(function (res) { mostrarResumen(res, r.filas, sesion); });
    }).catch(function (err) { out.innerHTML = errorHtml(err.message); });
  }

  // Reconoce las columnas aunque estén en otro orden o con otros nombres parecidos.
  function interpretar(filas) {
    var iHead = -1, map = null;
    for (var i = 0; i < Math.min(filas.length, 10); i++) {
      var m = mapear(filas[i]);
      if (m.mail >= 0 && (m.nombre >= 0 || m.completo >= 0)) { iHead = i; map = m; break; }
    }
    if (!map) return { error: 'No encontramos las columnas de nombre y mail. Revisá que la primera fila tenga los títulos (por ejemplo: Nombre, Apellido, Mail, Estado).' };
    var datos = filas.slice(iHead + 1).map(function (f, j) {
      var nombre = '', apellido = '';
      if (map.nombre >= 0) { nombre = txt(f[map.nombre]); apellido = map.apellido >= 0 ? txt(f[map.apellido]) : ''; }
      if (map.completo >= 0 && !nombre) {
        var partes = txt(f[map.completo]).split(/\s+/);
        nombre = partes.shift() || ''; apellido = partes.join(' ');
      }
      var estado = map.estado >= 0 ? API.normalizar(f[map.estado]) : 'activo';
      var activo = !estado || /^(activo|activa|si|ok|al dia|pago|pagado|1|true|vigente)/.test(estado);
      return { fila: iHead + j + 2, nombre: nombre, apellido: apellido, mail: txt(f[map.mail]),
        estado: activo ? 'activo' : 'inactivo', vigente_hasta: map.vigencia >= 0 ? fechaISO(f[map.vigencia]) : null };
    });
    return { filas: datos };
  }
  function txt(v) { return String(v == null ? '' : v).replace(/\s+/g, ' ').trim(); }
  function mapear(fila) {
    var m = { nombre: -1, apellido: -1, completo: -1, mail: -1, estado: -1, vigencia: -1 };
    (fila || []).forEach(function (c, i) {
      var h = API.normalizar(c);
      if (!h) return;
      if (/mail|correo/.test(h) && m.mail < 0) m.mail = i;
      else if (/nombre.*apellido|apellido.*nombre|nombre completo|socio|pasajer/.test(h) && m.completo < 0) m.completo = i;
      else if (/apellido/.test(h) && m.apellido < 0) m.apellido = i;
      else if (/nombre/.test(h) && m.nombre < 0) m.nombre = i;
      else if (/estado|activo|situacion/.test(h) && m.estado < 0) m.estado = i;
      else if (/vigen|hasta|vence|vencimiento/.test(h) && m.vigencia < 0) m.vigencia = i;
    });
    return m;
  }
  function fechaISO(v) {
    if (!v) return null;
    if (v instanceof Date && !isNaN(v)) return new Date(v.getTime() - v.getTimezoneOffset() * 60000).toISOString().slice(0, 10);
    var s = String(v).trim(), m;
    if ((m = s.match(/^(\d{1,2})[\/\-.](\d{1,2})[\/\-.](\d{2,4})$/))) {
      var y = m[3].length === 2 ? '20' + m[3] : m[3];
      return y + '-' + ('0' + m[2]).slice(-2) + '-' + ('0' + m[1]).slice(-2);
    }
    if (/^\d{4}-\d{2}-\d{2}/.test(s)) return s.slice(0, 10);
    return null;
  }

  function mostrarResumen(r, filas, sesion) {
    var out = $('#excel-out');
    var problemas = r.problemas.length
      ? '<details class="pase-problems" open><summary>' + r.problemas.length + ' fila(s) con problemas que no se van a cargar</summary><ul>' +
        r.problemas.map(function (p) { return '<li>Fila ' + p.fila + ': ' + esc(p.motivo) + (p.dato ? ' <span class="pase-muted">(' + esc(p.dato) + ')</span>' : '') + '</li>'; }).join('') +
        '</ul></details>'
      : '';
    out.innerHTML =
      '<h3 class="pase-h3">Resumen de cambios</h3>' +
      '<div class="pase-stats">' +
      stat(r.filas, 'socios en el Excel') + stat(r.nuevos, 'nuevos') + stat(r.siguen_activos, 'siguen al día') +
      stat(r.reactivados, 'vuelven a estar al día') + stat(r.pasan_a_inactivos + r.no_figuran, 'pasan a vencidos') +
      '</div>' +
      (r.no_figuran ? '<p class="pase-sub">De los que pasan a vencidos, <strong>' + r.no_figuran + '</strong> estaban al día y no figuran en este Excel.</p>' : '') +
      problemas +
      '<div class="pase-actions"><button class="btn btn-primary" type="button" id="aplicar">Guardar cambios</button>' +
      '<button class="btn btn-ghost" type="button" id="cancelar">Cancelar</button></div>';
    on('#cancelar', 'click', function () { panelAdmin(sesion, 'excel'); });
    on('#aplicar', 'click', function (e) {
      ocupado(e.target, true);
      API.admin.importar(filas).then(function () {
        out.innerHTML = '<div class="pase-result pase-result--ok"><span class="pase-result-icon">✔</span><div><strong>Lista de socios actualizada</strong><span>Los cambios ya se ven en los boletos y en el buscador de los comercios.</span></div></div>';
      }, function (err) { ocupado(e.target, false); out.insertAdjacentHTML('beforeend', errorHtml(err.message)); });
    });
  }

  // ---------- Comercios ----------
  function adminComercios(sesion) {
    API.admin.comercios().then(function (lista) {
      $('#admin-body').innerHTML =
        '<div class="pase-card pase-card--flat"><h3>Sumar un comercio</h3>' +
        '<p class="pase-sub">Al comercio le llega un mail con un link para elegir su contraseña.</p>' +
        '<form class="pase-form pase-form--row" id="f-comercio" novalidate>' +
        '<label>Nombre<input name="nombre" required placeholder="Ej: Casa Chicha"></label>' +
        '<label>Mail<input name="mail" type="email" required placeholder="comercio@mail.com"></label>' +
        '<button class="btn btn-primary" type="submit">Sumar</button></form><div id="f-error"></div></div>' +
        '<div class="pase-table-wrap"><table class="pase-table"><thead><tr><th>Comercio</th><th>Mail</th><th>Cuenta</th><th>Estado</th><th></th></tr></thead><tbody>' +
        lista.map(function (c) {
          return '<tr><td>' + esc(c.nombre) + '</td><td>' + esc(c.mail) + '</td><td>' +
            (c.cuenta_activada ? 'Activada' : '<span class="pase-muted">Sin activar</span>') + '</td><td>' +
            (c.activo ? badge('Adherido', 'ok') : badge('Dado de baja', 'no')) + '</td><td>' +
            '<button type="button" class="pase-link" data-toggle="' + c.id + '" data-activo="' + (c.activo ? '1' : '0') + '">' +
            (c.activo ? 'Dar de baja' : 'Reactivar') + '</button></td></tr>';
        }).join('') + '</tbody></table></div>';
      app.querySelectorAll('[data-toggle]').forEach(function (b) {
        b.addEventListener('click', function () {
          var activo = b.getAttribute('data-activo') === '1';
          if (activo && !confirm('¿Dar de baja este comercio? Ya no va a poder verificar socios.')) return;
          API.admin.cambiarEstadoComercio(b.getAttribute('data-toggle'), !activo).then(function () { adminComercios(sesion); });
        });
      });
      on('#f-comercio', 'submit', function (e) {
        e.preventDefault();
        var f = e.target, btn = f.querySelector('button[type=submit]'); ocupado(btn, true);
        API.admin.agregarComercio(f.nombre.value, f.mail.value).then(function (r) {
          adminComercios(sesion);
          setTimeout(function () {
            var box = $('#f-error');
            if (box) box.innerHTML = '<p class="pase-ok">Listo: le mandamos el link a ' + esc(r.enviado_a) + '.' +
              (DEMO ? ' <span class="pase-muted">(En la demostración no se envía el mail.)</span>' : '') + '</p>';
          }, 300);
        }, function (err) { ocupado(btn, false); mostrarError('#f-error', err); });
      });
    });
  }

  // ---------- Registro de búsquedas ----------
  var RESULTADOS = {
    activo: ['Activx', 'ok'], no_activo: ['Vencidx', 'no'], no_encontrado: ['No es socix', 'muted'], repetido: ['Nombre repetido', 'warn']
  };
  function adminRegistro() {
    API.admin.busquedas().then(function (lista) {
      var ahora = new Date();
      var mesActual = ahora.getFullYear() + '-' + ('0' + (ahora.getMonth() + 1)).slice(-2);
      var delMes = lista.filter(function (b) { return b.fecha.slice(0, 7) === mesActual; });
      function contar(arr, campo) {
        var c = {}; arr.forEach(function (b) { if (b[campo]) c[b[campo]] = (c[b[campo]] || 0) + 1; });
        return Object.keys(c).map(function (k) { return [k, c[k]]; }).sort(function (a, b) { return b[1] - a[1]; });
      }
      var porSocio = contar(lista.filter(function (b) { return b.resultado === 'activo' || b.resultado === 'no_activo'; }), 'socio');
      var porComercio = contar(lista, 'comercio');
      var porMes = {}; lista.forEach(function (b) { var m = b.fecha.slice(0, 7); porMes[m] = (porMes[m] || 0) + 1; });
      var meses = Object.keys(porMes).sort().reverse().slice(0, 6);
      function ranking(titulo, filas, vacio) {
        return '<div class="pase-rank"><h4>' + titulo + '</h4>' + (filas.length
          ? '<ol>' + filas.slice(0, 5).map(function (f) { return '<li><span>' + esc(f[0]) + '</span><strong>' + f[1] + '</strong></li>'; }).join('') + '</ol>'
          : '<p class="pase-muted">' + vacio + '</p>') + '</div>';
      }
      var comercios = porComercio.map(function (c) { return c[0]; });
      $('#admin-body').innerHTML =
        '<div class="pase-stats">' +
        stat(delMes.length, 'verificaciones este mes') +
        stat(contar(delMes, 'socio').length, 'socios distintos este mes') +
        stat(lista.length, 'verificaciones en total') +
        '</div>' +
        '<div class="pase-ranks">' +
        ranking('Socios más verificados', porSocio, 'Todavía no hay verificaciones.') +
        ranking('Comercios que más verifican', porComercio, 'Todavía no hay verificaciones.') +
        ranking('Verificaciones por mes', meses.map(function (m) { var p = m.split('-'); return [MESES[+p[1] - 1] + ' ' + p[0], porMes[m]]; }), 'Sin datos.') +
        '</div>' +
        '<p class="pase-note">Cada fila es una vez que un comercio buscó a alguien. Muestra que el comercio <strong>verificó</strong> al socio, no necesariamente que se haya usado el beneficio.</p>' +
        '<div class="pase-filters"><label>Comercio <select id="f-com"><option value="">Todos</option>' +
        comercios.map(function (c) { return '<option>' + esc(c) + '</option>'; }).join('') + '</select></label></div>' +
        '<div class="pase-table-wrap"><table class="pase-table"><thead><tr><th>Fecha</th><th>Comercio</th><th>Búsqueda</th><th>Resultado</th><th>Socio</th></tr></thead><tbody id="tbody"></tbody></table></div>';
      function pintar(com) {
        $('#tbody').innerHTML = lista.filter(function (b) { return !com || b.comercio === com; }).map(function (b) {
          var r = RESULTADOS[b.resultado] || [b.resultado, 'muted'];
          return '<tr><td>' + fechaHora(b.fecha) + '</td><td>' + esc(b.comercio) + '</td><td>' + esc(b.texto) + '</td><td>' +
            badge(r[0], r[1]) + '</td><td>' + (b.socio ? esc(b.socio) : '<span class="pase-muted">—</span>') + '</td></tr>';
        }).join('') || '<tr><td colspan="5" class="pase-muted">Todavía no hay búsquedas.</td></tr>';
      }
      pintar('');
      on('#f-com', 'change', function (e) { pintar(e.target.value); });
    });
  }

  // ============================================
  // ARRANQUE
  // ============================================
  API.sesionActual().then(function (s) {
    if (s) return panel(s);
    var h = (location.hash || '').replace('#', '');
    if (h === 'comercio' || h === 'socio' || h === 'admin') return ingreso(h);
    inicio();
  });
})();
