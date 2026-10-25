/* ============================================
   SUBE — Mi pase: capa de datos (MODO DEMOSTRACIÓN)
   ------------------------------------------------------
   Este archivo hace de "servidor de mentira" para poder
   recorrer la sección completa antes de conectar Supabase.
   Los datos son inventados y se guardan solo en el navegador
   de quien prueba la página (nadie más los ve).

   Todas las funciones devuelven promesas y tienen la misma
   forma que van a tener en la versión real, así que para
   pasar a Supabase solo hay que reemplazar este archivo:
   las pantallas (assets/mi-pase.js) no cambian.

   IMPORTANTE: en modo demostración no hay seguridad real
   (cualquiera podría ver estos datos con las herramientas
   del navegador). Por eso solo lleva datos inventados.
   ============================================ */
(function () {
  var MODO = 'demo';
  var KEY = 'sube-mi-pase-demo-v2';
  var SESSION_KEY = 'sube-mi-pase-demo-sesion';

  function hoyISO(offsetDias) {
    var d = new Date();
    d.setDate(d.getDate() + (offsetDias || 0));
    return d.toISOString().slice(0, 10);
  }

  function semilla() {
    var finDeMes = (function () {
      var d = new Date();
      return new Date(d.getFullYear(), d.getMonth() + 1, 0).toISOString().slice(0, 10);
    })();
    var socios = [
      ['Ana', 'Demo', 'ana.demo@ejemplo.com', 'activo', finDeMes, 'sube1234'],
      ['Bruno', 'Ejemplo', 'bruno.ejemplo@ejemplo.com', 'activo', finDeMes, null],
      ['Carla', 'Prueba', 'carla.prueba@ejemplo.com', 'inactivo', hoyISO(-20), 'sube1234'],
      ['Diego', 'Muestra', 'diego.muestra@ejemplo.com', 'activo', finDeMes, null],
      ['Elena', 'Ficticia', 'elena.ficticia@ejemplo.com', 'activo', finDeMes, null],
      ['Facundo', 'Inventado', 'facu.inventado@ejemplo.com', 'inactivo', hoyISO(-45), null],
      ['Gabriela', 'Ensayo', 'gabi.ensayo@ejemplo.com', 'activo', finDeMes, null],
      ['Juan', 'Repetido', 'juan.repetido1@ejemplo.com', 'activo', finDeMes, null],
      ['Juan', 'Repetido', 'juan.repetido2@ejemplo.com', 'activo', finDeMes, null],
      ['Lucía', 'Simulada', 'lucia.simulada@ejemplo.com', 'activo', finDeMes, null]
    ].map(function (s, i) {
      return {
        id: 's' + (i + 1), nombre: s[0], apellido: s[1], mail: s[2],
        estado: s[3], vigente_hasta: s[4], clave: s[5],
        acepto_privacidad: !!s[5], creado: hoyISO(-90)
      };
    });
    var comercios = [
      ['Casa Chicha (demo)', 'casachicha@demo.subecanal.com.ar', true, 'sube1234'],
      ['Carpincho (demo)', 'carpincho@demo.subecanal.com.ar', true, null],
      ['Tatana (demo)', 'tatana@demo.subecanal.com.ar', false, null]
    ].map(function (c, i) {
      return { id: 'c' + (i + 1), nombre: c[0], mail: c[1], activo: c[2], clave: c[3] };
    });
    var busquedas = [];
    var ejemplos = [
      [-34, 'c1', 'Ana Demo'], [-33, 'c2', 'Diego Muestra'], [-31, 'c1', 'Elena Ficticia'],
      [-28, 'c1', 'Ana Demo'], [-12, 'c2', 'Carla Prueba'], [-9, 'c1', 'Gabriela Ensayo'],
      [-6, 'c2', 'Ana Demo'], [-3, 'c1', 'Lucía Simulada'], [-2, 'c1', 'Persona Desconocida'],
      [-1, 'c2', 'Juan Repetido']
    ];
    var estado = { socios: socios, comercios: comercios, busquedas: busquedas, admins: [
      { id: 'a1', nombre: 'Finanzas (demo)', mail: 'finanzas@demo.subecanal.com.ar', clave: 'sube1234' }
    ] };
    ejemplos.forEach(function (e) {
      var d = new Date(); d.setDate(d.getDate() + e[0]); d.setHours(12 + (e[0] % 7 + 7) % 7, 15, 0, 0);
      registrarBusqueda(estado, e[1], e[2], d.toISOString());
    });
    return estado;
  }

  // ---------- Guardado (navegador de quien prueba) ----------
  var memoria = null;
  function leer() {
    if (memoria) return memoria;
    try {
      var raw = localStorage.getItem(KEY);
      if (raw) { memoria = JSON.parse(raw); return memoria; }
    } catch (e) { /* sin almacenamiento: se usa memoria */ }
    memoria = semilla();
    guardar();
    return memoria;
  }
  function guardar() {
    try { localStorage.setItem(KEY, JSON.stringify(memoria)); } catch (e) { /* ok */ }
  }
  var sesion = null;
  function leerSesion() {
    if (sesion) return sesion;
    try { sesion = JSON.parse(sessionStorage.getItem(SESSION_KEY) || 'null'); } catch (e) { sesion = null; }
    return sesion;
  }
  function guardarSesion(s) {
    sesion = s;
    try {
      if (s) sessionStorage.setItem(SESSION_KEY, JSON.stringify(s));
      else sessionStorage.removeItem(SESSION_KEY);
    } catch (e) { /* ok */ }
  }

  // ---------- Utilidades ----------
  function normalizar(txt) {
    return String(txt || '').normalize('NFD').replace(/[̀-ͯ]/g, '')
      .toLowerCase().replace(/[^a-z0-9ñ@._+\- ]/g, ' ').replace(/\s+/g, ' ').trim();
  }
  function normalizarMail(m) { return String(m || '').trim().toLowerCase(); }
  function mailValido(m) { return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(m); }
  function nombreCompleto(s) { return (s.nombre + ' ' + s.apellido).trim(); }
  function estaAlDia(s) {
    if (s.estado !== 'activo') return false;
    if (s.vigente_hasta && s.vigente_hasta < hoyISO(0)) return false;
    return true;
  }
  function esperar(valor) {
    return new Promise(function (ok) { setTimeout(function () { ok(valor); }, 250); });
  }
  function error(msg) {
    return new Promise(function (_, mal) { setTimeout(function () { mal(new Error(msg)); }, 250); });
  }
  function copia(o) { return JSON.parse(JSON.stringify(o)); }

  function registrarBusqueda(estado, comercioId, texto, fechaISO) {
    var buscado = normalizar(texto);
    var coinciden = estado.socios.filter(function (s) { return normalizar(nombreCompleto(s)) === buscado; });
    var resultado, socioId = null;
    if (coinciden.length === 0) resultado = 'no_encontrado';
    else if (coinciden.length > 1) resultado = 'repetido';
    else { socioId = coinciden[0].id; resultado = estaAlDia(coinciden[0]) ? 'activo' : 'no_activo'; }
    estado.busquedas.push({
      id: 'b' + (estado.busquedas.length + 1),
      fecha: fechaISO || new Date().toISOString(),
      comercio_id: comercioId, texto: texto.trim(), resultado: resultado, socio_id: socioId
    });
    return resultado;
  }

  // ---------- Activaciones (en la versión real llegan por mail) ----------
  var enlaces = {};
  function crearEnlace(tipo, id) {
    var token = Math.random().toString(36).slice(2) + Date.now().toString(36);
    enlaces[token] = { tipo: tipo, id: id, vence: Date.now() + 60 * 60 * 1000 };
    return token;
  }

  // ============================================
  // API pública: window.SubePase
  // ============================================
  window.SubePase = {
    modo: MODO,
    normalizar: normalizar,

    // ---- Sesión ----
    sesionActual: function () {
      var s = leerSesion();
      return Promise.resolve(s ? copia(s) : null);
    },

    ingresar: function (rol, mail, clave) {
      var db = leer(); mail = normalizarMail(mail);
      var lista = rol === 'socio' ? db.socios : rol === 'comercio' ? db.comercios : db.admins;
      var u = lista.find(function (x) { return x.mail === mail; });
      if (!u || !u.clave) return error(u ? 'Tu cuenta todavía no está activada. Tocá "Activar mi cuenta".' : 'El mail o la contraseña no son correctos.');
      if (u.clave !== clave) return error('El mail o la contraseña no son correctos.');
      if (rol === 'comercio' && !u.activo) return error('La cuenta de este comercio está dada de baja. Escribinos a laplatasube@gmail.com.');
      var s = { rol: rol, id: u.id, nombre: rol === 'socio' ? u.nombre : u.nombre, mail: u.mail };
      guardarSesion(s);
      return esperar(copia(s));
    },

    salir: function () { guardarSesion(null); return Promise.resolve(); },

    // Paso 1 de la activación (o "olvidé mi contraseña"): verifica que el
    // mail esté en la lista y "envía" el link. En la demo, el link se
    // devuelve para poder seguir sin un mail real.
    pedirEnlace: function (rol, mail) {
      var db = leer(); mail = normalizarMail(mail);
      if (!mailValido(mail)) return error('Revisá el mail: parece estar mal escrito.');
      var lista = rol === 'socio' ? db.socios : db.comercios;
      var u = lista.find(function (x) { return x.mail === mail; });
      if (!u) {
        return error(rol === 'socio'
          ? 'No encontramos ese mail en la comunidad.'
          : 'Ese mail no corresponde a ningún comercio adherido.');
      }
      if (rol === 'comercio' && !u.activo) return error('La cuenta de este comercio está dada de baja.');
      return esperar({ enviado_a: mail, enlace_demo: crearEnlace(rol, u.id) });
    },

    // Paso 2: con el link, elige su contraseña y queda adentro.
    definirClave: function (token, clave, aceptoPrivacidad) {
      var e = enlaces[token];
      if (!e || e.vence < Date.now()) return error('El link venció. Pedí uno nuevo.');
      if (!clave || clave.length < 8) return error('La contraseña tiene que tener al menos 8 caracteres.');
      var db = leer();
      var lista = e.tipo === 'socio' ? db.socios : db.comercios;
      var u = lista.find(function (x) { return x.id === e.id; });
      if (e.tipo === 'socio' && !aceptoPrivacidad && !u.acepto_privacidad) return error('Para activar tu cuenta tenés que aceptar el aviso de privacidad.');
      u.clave = clave;
      if (e.tipo === 'socio') u.acepto_privacidad = true;
      delete enlaces[token];
      guardar();
      var s = { rol: e.tipo, id: u.id, nombre: u.nombre, mail: u.mail };
      guardarSesion(s);
      return esperar(copia(s));
    },

    // ---- Socio ----
    miPase: function () {
      var s = leerSesion(); if (!s || s.rol !== 'socio') return error('Tenés que ingresar.');
      var u = leer().socios.find(function (x) { return x.id === s.id; });
      return esperar({ nombre: u.nombre, apellido: u.apellido, mail: u.mail,
        al_dia: estaAlDia(u), vigente_hasta: u.vigente_hasta || null });
    },


    // ---- Comercio ----
    verificarSocio: function (texto) {
      var s = leerSesion(); if (!s || s.rol !== 'comercio') return error('Tenés que ingresar como comercio.');
      var palabras = normalizar(texto).split(' ').filter(Boolean);
      if (palabras.length < 2) return error('Escribí nombre y apellido.');
      var db = leer();
      var r = registrarBusqueda(db, s.id, texto);
      guardar();
      return esperar({ resultado: r === 'no_encontrado' ? 'no_activo' : r });
    },

    // ---- Administración ----
    admin: {
      socios: function () { return esperar(copia(leer().socios.map(function (s) {
        return { id: s.id, nombre: s.nombre, apellido: s.apellido, mail: s.mail, estado: s.estado,
          vigente_hasta: s.vigente_hasta, al_dia: estaAlDia(s), cuenta_activada: !!s.clave };
      }))); },

      // Compara el Excel con la lista actual SIN guardar nada.
      previsualizarImportacion: function (filas) { return esperar(compararImportacion(filas).resumen); },

      // Aplica el Excel: el Excel es la lista completa del mes.
      importar: function (filas) {
        var db = leer(); var r = compararImportacion(filas);
        r.filasValidas.forEach(function (f) {
          var s = db.socios.find(function (x) { return x.mail === f.mail; });
          if (s) { s.nombre = f.nombre; s.apellido = f.apellido; s.estado = f.estado; s.vigente_hasta = f.vigente_hasta; }
          else db.socios.push({ id: 's' + Date.now().toString(36) + Math.random().toString(36).slice(2, 5),
            nombre: f.nombre, apellido: f.apellido, mail: f.mail, estado: f.estado,
            vigente_hasta: f.vigente_hasta, clave: null, acepto_privacidad: false, creado: hoyISO(0) });
        });
        var enExcel = {}; r.filasValidas.forEach(function (f) { enExcel[f.mail] = true; });
        db.socios.forEach(function (s) { if (!enExcel[s.mail]) s.estado = 'inactivo'; });
        guardar();
        return esperar(r.resumen);
      },

      comercios: function () { return esperar(copia(leer().comercios.map(function (c) {
        return { id: c.id, nombre: c.nombre, mail: c.mail, activo: c.activo, cuenta_activada: !!c.clave };
      }))); },

      agregarComercio: function (nombre, mail) {
        var db = leer(); mail = normalizarMail(mail);
        if (!nombre.trim()) return error('Falta el nombre del comercio.');
        if (!mailValido(mail)) return error('Revisá el mail del comercio.');
        if (db.comercios.some(function (c) { return c.mail === mail; })) return error('Ya hay un comercio con ese mail.');
        var c = { id: 'c' + Date.now().toString(36), nombre: nombre.trim(), mail: mail, activo: true, clave: null };
        db.comercios.push(c); guardar();
        return esperar({ enviado_a: mail, enlace_demo: crearEnlace('comercio', c.id) });
      },

      cambiarEstadoComercio: function (id, activo) {
        var c = leer().comercios.find(function (x) { return x.id === id; });
        c.activo = !!activo; guardar(); return esperar(true);
      },

      busquedas: function () {
        var db = leer();
        var socios = {}; db.socios.forEach(function (s) { socios[s.id] = s; });
        var comercios = {}; db.comercios.forEach(function (c) { comercios[c.id] = c; });
        return esperar(db.busquedas.slice().reverse().map(function (b) {
          var s = b.socio_id && socios[b.socio_id];
          return { fecha: b.fecha, comercio: (comercios[b.comercio_id] || {}).nombre || '—',
            texto: b.texto, resultado: b.resultado, socio: s ? nombreCompleto(s) : null };
        }));
      }
    },

    // Solo demo: volver a los datos de ejemplo.
    reiniciarDemo: function () {
      memoria = semilla(); guardar(); guardarSesion(null); return Promise.resolve();
    }
  };

  function compararImportacion(filas) {
    var db = leer();
    var actuales = {}; db.socios.forEach(function (s) { actuales[s.mail] = s; });
    var vistos = {}, validas = [], problemas = [];
    filas.forEach(function (f, i) {
      var fila = f.fila || i + 2; // número de fila tal como se ve en el Excel
      var mail = normalizarMail(f.mail);
      if (!f.nombre && !f.apellido && !mail) return; // fila vacía
      if (!mailValido(mail)) { problemas.push({ fila: fila, motivo: f.motivo_mail || 'Mail vacío o mal escrito', dato: f.mail || ((f.nombre || '') + ' ' + (f.apellido || '')).trim() }); return; }
      if (vistos[mail]) { problemas.push({ fila: fila, motivo: 'Mail repetido (ya está en la fila ' + vistos[mail] + ')', dato: mail }); return; }
      if (!f.nombre) { problemas.push({ fila: fila, motivo: 'Falta el nombre', dato: mail }); return; }
      vistos[mail] = fila;
      validas.push({ nombre: f.nombre, apellido: f.apellido || '', mail: mail,
        estado: f.estado === 'inactivo' ? 'inactivo' : 'activo', vigente_hasta: f.vigente_hasta || null });
    });
    var nuevos = 0, siguen = 0, reactivados = 0, bajas = 0, bajasPorAusencia = 0;
    validas.forEach(function (f) {
      var s = actuales[f.mail];
      if (!s) { nuevos++; return; }
      var antes = s.estado === 'activo';
      if (f.estado === 'activo' && antes) siguen++;
      else if (f.estado === 'activo' && !antes) reactivados++;
      else if (f.estado === 'inactivo' && antes) bajas++;
    });
    db.socios.forEach(function (s) { if (!vistos[s.mail] && s.estado === 'activo') bajasPorAusencia++; });
    return {
      filasValidas: validas,
      resumen: {
        filas: validas.length, nuevos: nuevos, siguen_activos: siguen, reactivados: reactivados,
        pasan_a_inactivos: bajas, no_figuran: bajasPorAusencia, problemas: problemas
      }
    };
  }
})();
