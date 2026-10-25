/* ============================================
   SUBE — Mi pase: capa de datos REAL (Supabase)
   ------------------------------------------------------
   Misma forma que assets/mi-pase-datos.js (la demostración),
   pero los datos viven en Supabase. Las reglas de quién ve qué
   están en la base (supabase/01-estructura.sql): aunque alguien
   modifique esta página en su navegador, no puede ver datos
   que no le correspondan.
   ============================================ */
(function () {
  var cfg = window.SUBE_PASE_CONFIG || {};
  var sb = window.supabase.createClient(cfg.url, cfg.clave, {
    auth: { persistSession: true, autoRefreshToken: true, detectSessionInUrl: true, flowType: 'implicit' }
  });

  // ¿La persona llegó desde el link del mail? (activar cuenta / recuperar contraseña)
  var vinoDelMail = /access_token=|type=(magiclink|signup|recovery|invite)/.test(window.location.hash) ||
    /[?&](code|token_hash)=/.test(window.location.search);
  var errorDelMail = (function () {
    var h = new URLSearchParams(window.location.hash.replace(/^#/, ''));
    return h.get('error_description') || null;
  })();

  var ROLES = { equipo: 'admin', comercio: 'comercio', socio: 'socio' };

  function fallo(err, porDefecto) {
    var msg = (err && (err.message || err.error_description)) || porDefecto || 'Algo salió mal. Probá de nuevo.';
    if (/Invalid login credentials/i.test(msg)) msg = 'El mail o la contraseña no son correctos.';
    else if (/Email not confirmed/i.test(msg)) msg = 'Tu cuenta todavía no está activada. Tocá "Activar mi cuenta".';
    else if (/rate limit|too many|security purposes/i.test(msg)) msg = 'Ya pediste un link hace muy poco. Esperá unos minutos y volvé a probar.';
    else if (/not authorized/i.test(msg)) msg = 'Todavía no podemos enviar mails a esa dirección (el envío de mails de Sube está en configuración).';
    else if (/Password should be at least/i.test(msg)) msg = 'La contraseña tiene que tener al menos 8 caracteres.';
    else if (/same password|different from the old/i.test(msg)) msg = 'Elegí una contraseña distinta a la anterior.';
    else if (/Failed to fetch|NetworkError|network/i.test(msg)) msg = 'No hay conexión. Revisá internet y probá de nuevo.';
    return new Error(msg);
  }
  function rpc(nombre, args) {
    return sb.rpc(nombre, args || {}).then(function (r) { if (r.error) throw fallo(r.error); return r.data; });
  }
  function normalizar(txt) {
    return String(txt || '').normalize('NFD').replace(/[̀-ͯ]/g, '')
      .toLowerCase().replace(/[^a-z0-9ñ@._+\- ]/g, ' ').replace(/\s+/g, ' ').trim();
  }
  function mailValido(m) { return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(m); }
  function urlDeVuelta() { return window.location.origin + window.location.pathname; }

  // Arma la sesión que usan las pantallas: { rol, nombre, mail }
  function armarSesion() {
    return sb.auth.getSession().then(function (r) {
      var s = r.data && r.data.session;
      if (!s) return null;
      var mail = (s.user.email || '').toLowerCase();
      return rpc('mi_rol').then(function (rol) {
        if (rol === 'comercio_baja') {
          return sb.auth.signOut().then(function () { throw new Error('La cuenta de este comercio está dada de baja. Escribinos a laplatasube@gmail.com.'); });
        }
        if (!rol) {
          return sb.auth.signOut().then(function () { throw new Error('Tu mail ya no figura entre los socios de la comunidad. Si creés que es un error, escribinos a laplatasube@gmail.com.'); });
        }
        var tabla = rol === 'equipo' ? 'equipo' : rol === 'comercio' ? 'comercios' : 'socios';
        return sb.from(tabla).select('nombre').eq(rol === 'equipo' ? 'mail' : 'user_id', rol === 'equipo' ? mail : s.user.id).maybeSingle()
          .then(function (q) {
            return { rol: ROLES[rol], id: s.user.id, nombre: (q.data && q.data.nombre) || mail, mail: mail };
          });
      });
    });
  }

  window.SubePase = {
    modo: 'real',
    normalizar: normalizar,

    sesionActual: function () { return armarSesion().catch(function () { return null; }); },

    // Si llegó desde el link del mail, lo primero es elegir la contraseña.
    pasoPendiente: function () {
      if (errorDelMail) {
        history.replaceState(null, '', urlDeVuelta());
        return Promise.resolve({ tipo: 'error', mensaje: /expired|invalid/i.test(errorDelMail)
          ? 'El link venció o ya se usó. Pedí uno nuevo.' : errorDelMail });
      }
      if (!vinoDelMail) return Promise.resolve(null);
      vinoDelMail = false;
      return armarSesion().then(function (s) {
        history.replaceState(null, '', urlDeVuelta());
        return s ? { tipo: 'elegir_clave', rol: s.rol } : null;
      }, function (err) {
        history.replaceState(null, '', urlDeVuelta());
        return { tipo: 'error', mensaje: err.message };
      });
    },

    ingresar: function (rol, mail, clave) {
      return sb.auth.signInWithPassword({ email: String(mail).trim().toLowerCase(), password: clave })
        .then(function (r) { if (r.error) throw fallo(r.error); return armarSesion(); });
    },

    salir: function () { return sb.auth.signOut().then(function () {}); },

    // Manda el link para activar la cuenta o recuperar la contraseña.
    // El filtro de la base (solo_miembros) rechaza mails que no estén en las listas.
    pedirEnlace: function (rol, mail) {
      mail = String(mail || '').trim().toLowerCase();
      if (!mailValido(mail)) return Promise.reject(new Error('Revisá el mail: parece estar mal escrito.'));
      return sb.auth.signInWithOtp({ email: mail, options: { shouldCreateUser: true, emailRedirectTo: urlDeVuelta() } })
        .then(function (r) {
          if (r.error) {
            if (/No encontramos/.test(r.error.message)) {
              throw new Error(rol === 'socio'
                ? 'No encontramos ese mail entre los socios de la comunidad.'
                : 'Ese mail no corresponde a ningún comercio adherido.');
            }
            throw fallo(r.error);
          }
          return { enviado_a: mail };
        });
    },

    definirClave: function (token, clave, aceptoPrivacidad) {
      if (!clave || clave.length < 8) return Promise.reject(new Error('La contraseña tiene que tener al menos 8 caracteres.'));
      return armarSesion().then(function (s) {
        if (!s) throw new Error('El link venció. Pedí uno nuevo.');
        if (s.rol === 'socio' && !aceptoPrivacidad) throw new Error('Para activar tu cuenta tenés que aceptar el aviso de privacidad.');
        return sb.auth.updateUser({ password: clave }).then(function (r) {
          if (r.error && !/same password|different from the old/i.test(r.error.message)) throw fallo(r.error);
          return s.rol === 'socio' ? rpc('aceptar_privacidad') : null;
        }).then(function () { return s; });
      });
    },

    miPase: function () {
      return rpc('mi_pase').then(function (p) { if (!p) throw new Error('No encontramos tu pase.'); return p; });
    },

    verificarSocio: function (texto) {
      var palabras = normalizar(texto).split(' ').filter(Boolean);
      if (palabras.length < 2) return Promise.reject(new Error('Escribí nombre y apellido.'));
      return rpc('verificar_socio', { texto: texto }).then(function (r) { return { resultado: r }; });
    },

    admin: {
      socios: function () {
        var hoy = new Date(); hoy.setMinutes(hoy.getMinutes() - hoy.getTimezoneOffset());
        var hoyISO = hoy.toISOString().slice(0, 10);
        return sb.from('socios').select('id,nombre,apellido,mail,estado,vigente_hasta,user_id').order('apellido')
          .then(function (r) {
            if (r.error) throw fallo(r.error);
            return r.data.map(function (s) {
              return { id: s.id, nombre: s.nombre, apellido: s.apellido, mail: s.mail, estado: s.estado,
                vigente_hasta: s.vigente_hasta, cuenta_activada: !!s.user_id,
                al_dia: s.estado === 'activo' && (!s.vigente_hasta || s.vigente_hasta >= hoyISO) };
            });
          });
      },

      previsualizarImportacion: function (filas) {
        var v = validar(filas);
        return rpc('importar_socios', { filas: v.validas, aplicar: false }).then(function (r) {
          r.problemas = v.problemas; return r;
        });
      },

      importar: function (filas) {
        return rpc('importar_socios', { filas: validar(filas).validas, aplicar: true });
      },

      comercios: function () {
        return sb.from('comercios').select('id,nombre,mail,activo,user_id').order('nombre').then(function (r) {
          if (r.error) throw fallo(r.error);
          return r.data.map(function (c) { return { id: c.id, nombre: c.nombre, mail: c.mail, activo: c.activo, cuenta_activada: !!c.user_id }; });
        });
      },

      // Suma el comercio y le manda el link para que elija su contraseña.
      agregarComercio: function (nombre, mail) {
        mail = String(mail || '').trim().toLowerCase();
        if (!String(nombre || '').trim()) return Promise.reject(new Error('Falta el nombre del comercio.'));
        if (!mailValido(mail)) return Promise.reject(new Error('Revisá el mail del comercio.'));
        return sb.from('comercios').insert({ nombre: nombre.trim(), mail: mail }).then(function (r) {
          if (r.error) throw (/duplicate|unique/i.test(r.error.message) ? new Error('Ya hay un comercio con ese mail.') : fallo(r.error));
          return sb.auth.signInWithOtp({ email: mail, options: { shouldCreateUser: true, emailRedirectTo: urlDeVuelta() } });
        }).then(function (r) {
          if (r && r.error) return { enviado_a: mail, aviso: 'El comercio quedó cargado, pero no se pudo mandar el mail (' + fallo(r.error).message + '). Puede activarlo él mismo desde "Activar mi cuenta".' };
          return { enviado_a: mail };
        });
      },

      cambiarEstadoComercio: function (id, activo) {
        return sb.from('comercios').update({ activo: !!activo }).eq('id', id).then(function (r) { if (r.error) throw fallo(r.error); return true; });
      },

      busquedas: function () { return rpc('registro_busquedas'); }
    }
  };

  // Revisa las filas del Excel antes de mandarlas a la base.
  function validar(filas) {
    var vistos = {}, validas = [], problemas = [];
    filas.forEach(function (f, i) {
      var fila = f.fila || i + 2;
      var mail = String(f.mail || '').trim().toLowerCase();
      if (!f.nombre && !f.apellido && !mail) return;
      if (!mailValido(mail)) { problemas.push({ fila: fila, motivo: 'Mail vacío o mal escrito', dato: f.mail || '' }); return; }
      if (vistos[mail]) { problemas.push({ fila: fila, motivo: 'Mail repetido (ya está en la fila ' + vistos[mail] + ')', dato: mail }); return; }
      if (!f.nombre) { problemas.push({ fila: fila, motivo: 'Falta el nombre', dato: mail }); return; }
      vistos[mail] = fila;
      validas.push({ nombre: f.nombre, apellido: f.apellido || '', mail: mail,
        estado: f.estado === 'inactivo' ? 'inactivo' : 'activo', vigente_hasta: f.vigente_hasta || null });
    });
    return { validas: validas, problemas: problemas };
  }
})();
