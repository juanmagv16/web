/* ============================================
   SUBE — Panel de Redacción (/redaccion)
   ------------------------------------------------------
   - Ingreso con el usuario de SUBE (Supabase).
   - Todo lo que se guarda o publica pasa por la función
     "redaccion" de Supabase, que es la única que tiene la
     llave de GitHub. Este archivo nunca la ve.
   - El texto se edita como en un procesador de textos y se
     guarda en el mismo formato que ya usan las notas
     (redaccion/*.md), así la web las arma igual que siempre.
   ============================================ */
(function () {
  'use strict';

  var cfg = window.SUBE_PASE_CONFIG || {};
  var sb = window.supabase.createClient(cfg.url, cfg.clave, {
    auth: { persistSession: true, autoRefreshToken: true, detectSessionInUrl: false }
  });

  var SECCIONES = ['Actualidad', 'Política', 'Deportes', 'Cultura', 'Agenda', 'Sociedad', 'Economía'];
  var $ = function (id) { return document.getElementById(id); };
  var estado = { notas: [], repo: '', rama: 'main', nombre: '', equipo: false, filtro: 'todas', busca: '' };
  var nota = null;        // nota abierta en el editor
  var sucio = false;      // hay cambios sin guardar
  var ocupado = false;

  // ---------- utilidades ----------
  function esc(t) {
    return String(t == null ? '' : t).replace(/[&<>"']/g, function (c) {
      return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c];
    });
  }
  function hoy() {
    return new Intl.DateTimeFormat('en-CA', { timeZone: 'America/Argentina/Buenos_Aires' }).format(new Date());
  }
  function fechaCorta(iso) {
    if (!iso) return '';
    if (iso === hoy()) return 'Hoy';
    var p = String(iso).slice(0, 10).split('-');
    return p[2] + '/' + p[1] + (p[0] !== hoy().slice(0, 4) ? '/' + p[0] : '');
  }
  function slugify(t) {
    t = String(t || '').toLowerCase();
    [['á', 'a'], ['é', 'e'], ['í', 'i'], ['ó', 'o'], ['ú', 'u'], ['ü', 'u'], ['ñ', 'n']].forEach(function (p) { t = t.split(p[0]).join(p[1]); });
    return t.replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '') || 'nota';
  }
  function youtubeId(url) {
    var m = String(url || '').match(/(?:youtube\.com\/(?:watch\?(?:[^#\s]*&)?v=|shorts\/|live\/|embed\/)|youtu\.be\/)([A-Za-z0-9_-]{11})/);
    return m ? m[1] : '';
  }
  // Dirección de una foto para verla en el panel (aunque la web todavía no se haya regenerado)
  function urlFoto(img) {
    if (!img) return '';
    if (/^https?:\/\//.test(img)) return img;
    var nombre = img.replace(/^\/?(assets\/noticias\/)?/, '');
    if (estado.repo) return 'https://raw.githubusercontent.com/' + estado.repo + '/' + estado.rama + '/assets/noticias/' + encodeURIComponent(nombre);
    return '../assets/noticias/' + encodeURIComponent(nombre);
  }
  function iniciales(nombre) {
    var p = String(nombre || '').trim().split(/\s+/);
    return ((p[0] || '?')[0] + (p.length > 1 ? p[p.length - 1][0] : '')).toUpperCase();
  }

  function aviso(html, tipo, ms) {
    var t = document.createElement('div');
    t.className = 'toast' + (tipo === 'error' ? ' error' : '');
    t.setAttribute('role', 'status');
    t.innerHTML = html;
    document.body.appendChild(t);
    setTimeout(function () { t.remove(); }, ms || 5000);
  }

  // Ventana propia (en lugar de los cuadros del navegador)
  function ventana(op) {
    return new Promise(function (resolver) {
      var velo = document.createElement('div');
      velo.className = 'velo';
      velo.innerHTML = '<div class="ventana" role="dialog" aria-modal="true" aria-labelledby="vt">' +
        '<h2 id="vt">' + esc(op.titulo) + '</h2>' + (op.texto ? '<p>' + esc(op.texto) + '</p>' : '') +
        (op.campo ? '<input class="in" type="' + (op.tipo || 'text') + '" placeholder="' + esc(op.campo) + '" value="' + esc(op.valor || '') + '">' +
          '<p class="hint" style="margin:8px 0 0" hidden></p>' : '') +
        '<div class="botones"><button class="btn btn-ghost btn-sm" type="button" data-r="no">' + esc(op.cancelar || 'Cancelar') + '</button>' +
        '<button class="btn btn-sm' + (op.peligro ? ' btn-danger' : '') + '" type="button" data-r="si">' + esc(op.aceptar || 'Aceptar') + '</button></div></div>';
      document.body.appendChild(velo);
      var input = velo.querySelector('input');
      var hint = velo.querySelector('.hint');
      function cerrar(v) { velo.remove(); document.removeEventListener('keydown', tecla); resolver(v); }
      function aceptar() {
        if (!input) return cerrar(true);
        var v = input.value.trim();
        var err = op.validar ? op.validar(v) : '';
        if (err) { hint.textContent = err; hint.hidden = false; hint.style.color = '#ffb3b3'; input.focus(); return; }
        cerrar(v);
      }
      function tecla(e) {
        if (e.key === 'Escape') cerrar(input ? null : false);
        if (e.key === 'Enter' && input) { e.preventDefault(); aceptar(); }
      }
      velo.addEventListener('click', function (e) {
        var r = e.target.getAttribute && e.target.getAttribute('data-r');
        if (r === 'si') aceptar();
        else if (r === 'no' || e.target === velo) cerrar(input ? null : false);
      });
      document.addEventListener('keydown', tecla);
      (input || velo.querySelector('[data-r=si]')).focus();
    });
  }

  // ---------- conexión con la función ----------
  function api(accion, datos) {
    var cuerpo = Object.assign({ accion: accion }, datos || {});
    return sb.functions.invoke('redaccion', { body: cuerpo }).then(function (r) {
      if (!r.error) return r.data;
      var ctx = r.error.context;
      var status = ctx && ctx.status;
      var leer = ctx && typeof ctx.json === 'function' ? ctx.json().catch(function () { return {}; }) : Promise.resolve({});
      return leer.then(function (j) {
        var msg = (j && j.error) || '';
        if (!msg) {
          msg = /Failed to fetch|NetworkError|network/i.test(String(r.error.message))
            ? 'No hay conexión o el panel todavía no está activado. Revisá internet y probá de nuevo.'
            : 'Algo salió mal. Probá de nuevo en un minuto.';
        }
        var e = new Error(msg);
        e.status = status;
        throw e;
      });
    });
  }

  // ---------- pantallas ----------
  function mostrar(cual) {
    $('v-cargando').hidden = true;
    $('v-ingreso').hidden = cual !== 'ingreso';
    $('v-panel').hidden = cual === 'ingreso';
    $('v-lista').hidden = cual !== 'lista';
    $('v-editor').hidden = cual !== 'editor';
    window.scrollTo(0, 0);
  }

  // ---------- ingreso ----------
  document.querySelectorAll('[data-ver]').forEach(function (b) {
    b.addEventListener('click', function () {
      var i = $(b.getAttribute('data-ver'));
      i.type = i.type === 'password' ? 'text' : 'password';
      b.textContent = i.type === 'password' ? 'Mostrar' : 'Ocultar';
    });
  });

  function errorIngreso(msg) {
    var e = $('ingreso-error');
    e.textContent = msg || '';
    e.hidden = !msg;
  }

  $('form-ingreso').addEventListener('submit', function (ev) {
    ev.preventDefault();
    var mail = $('ing-mail').value.trim().toLowerCase();
    var clave = $('ing-clave').value;
    if (!mail || !clave) return errorIngreso('Completá tu mail y tu contraseña.');
    var boton = $('ing-boton');
    boton.disabled = true;
    errorIngreso('');
    sb.auth.signInWithPassword({ email: mail, password: clave }).then(function (r) {
      if (r.error) {
        var m = r.error.message || '';
        throw new Error(/Invalid login/i.test(m) ? 'Mail o contraseña incorrectos. Revisalos e intentá de nuevo.'
          : /not confirmed/i.test(m) ? 'Tu cuenta todavía no está activada. Activala desde «¿Primera vez…?».'
          : /network|fetch/i.test(m) ? 'No hay conexión. Revisá internet y probá de nuevo.'
          : 'No pudimos ingresar. Probá de nuevo.');
      }
      return entrar();
    }).catch(function (e) { errorIngreso(e.message); })
      .then(function () { boton.disabled = false; });
  });

  $('b-salir').addEventListener('click', function () {
    salirConCambios().then(function (ok) {
      if (!ok) return;
      sucio = false;
      sb.auth.signOut().then(function () { location.hash = ''; mostrar('ingreso'); });
    });
  });

  // Después de ingresar: comprueba que la cuenta sea de la redacción y trae las notas
  function entrar() {
    return api('listar').then(function (d) {
      cargarListado(d);
      ruta(true);
    }).catch(function (e) {
      if (e.status === 401 || e.status === 403) {
        return sb.auth.signOut().then(function () {
          mostrar('ingreso');
          errorIngreso(e.status === 403 ? 'Tu cuenta no tiene acceso a Redacción. Si deberías tenerlo, escribile a la coordinación.' : e.message);
        });
      }
      mostrar('ingreso');
      errorIngreso(e.message);
    });
  }

  // ---------- listado ----------
  function cargarListado(d) {
    estado.notas = d.notas || [];
    estado.repo = d.repo || estado.repo;
    estado.rama = d.rama || estado.rama;
    estado.nombre = d.nombre || estado.nombre;
    estado.equipo = !!d.equipo;
    $('u-nombre').textContent = estado.nombre;
    $('u-avatar').textContent = iniciales(estado.nombre);
    $('saludo').textContent = 'Hola, ' + (estado.nombre.split(' ')[0] || 'redacción');
    var av = $('lista-aviso');
    av.textContent = d.aviso || '';
    av.hidden = !d.aviso;
    pintarListado();
  }

  // La web muestra como Principal solo la más nueva; las otras quedan como destacadas
  function principalVigente() {
    var p = estado.notas.filter(function (n) { return n.estado === 'publicada' && n.jerarquia === 'Principal'; })
      .sort(function (a, b) { return a.fecha < b.fecha ? 1 : -1; });
    return p[0] ? p[0].id : null;
  }

  function pintarListado() {
    var ns = estado.notas;
    $('n-pub').textContent = ns.filter(function (n) { return n.estado === 'publicada'; }).length;
    $('n-bor').textContent = ns.filter(function (n) { return n.estado === 'borrador'; }).length;
    $('n-off').textContent = ns.filter(function (n) { return n.estado === 'fuera'; }).length;
    var principal = principalVigente();
    var busca = slugify(estado.busca);
    var lista = ns.filter(function (n) {
      if (busca !== 'nota' && slugify(n.titulo).indexOf(busca) < 0) return false;
      if (estado.filtro === 'todas') return true;
      if (estado.filtro === 'arriba') return n.estado === 'publicada' && n.jerarquia !== 'Normal';
      return n.estado === estado.filtro;
    });
    var cont = $('lista');
    if (!lista.length) {
      cont.innerHTML = '<div class="vacio">' + (ns.length ? 'No hay notas con ese filtro.' :
        'Todavía no hay notas. Tocá <b>+ Nueva nota</b> para escribir la primera.') + '</div>';
      return;
    }
    cont.innerHTML = lista.map(function (n) {
      var mini;
      var vid = youtubeId(n.video);
      if (n.imagen && !(n.portada === 'Video' && vid)) mini = '<div class="mini" style="background-image:url(\'' + esc(urlFoto(n.imagen)) + '\')"></div>';
      else if (vid) mini = '<div class="mini" style="background-image:url(\'https://i.ytimg.com/vi/' + vid + '/mqdefault.jpg\')"><span class="play">▶</span></div>';
      else mini = '<div class="mini">' + esc(String(n.seccion || '?').slice(0, 2)) + '</div>';
      var b = [];
      if (n.estado === 'publicada') {
        if (n.jerarquia === 'Principal') b.push('<span class="badge star">' + (n.id === principal ? '★ Principal' : 'Destacada') + '</span>');
        else if (n.jerarquia === 'Destacada') b.push('<span class="badge star">Destacada</span>');
        b.push('<span class="badge pub">Publicada</span>');
      } else if (n.estado === 'fuera') b.push('<span class="badge off">Fuera de la web</span>');
      else b.push('<span class="badge bor">Borrador</span>');
      if (n.cambios_sin_publicar) b.push('<span class="badge cam">Cambios sin publicar</span>');
      return '<a class="fila" href="#nota=' + esc(n.id) + '">' + mini +
        '<div><div class="meta"><span class="sec">' + esc(n.seccion) + '</span><span>' + esc(fechaCorta(n.fecha)) +
        ' · ' + esc(n.autor || n.creado_por_nombre || 'Redacción SUBE') + '</span></div>' +
        '<h3>' + esc(n.titulo || 'Nota sin título') + '</h3></div>' +
        '<div class="badges">' + b.join('') + '</div></a>';
    }).join('');
  }

  document.querySelectorAll('[data-filtro]').forEach(function (c) {
    c.addEventListener('click', function () {
      estado.filtro = c.getAttribute('data-filtro');
      document.querySelectorAll('[data-filtro]').forEach(function (o) { o.setAttribute('aria-pressed', String(o === c)); });
      pintarListado();
    });
  });
  $('buscar').addEventListener('input', function () { estado.busca = this.value; pintarListado(); });

  function recargarListado() {
    $('lista').innerHTML = '<p class="cargando">Cargando notas…</p>';
    return api('listar').then(cargarListado).catch(function (e) {
      if (e.status === 401) return sb.auth.signOut().then(function () { mostrar('ingreso'); errorIngreso(e.message); });
      $('lista').innerHTML = '<div class="vacio">' + esc(e.message) + '</div>';
    });
  }

  // ---------- texto de la nota: Markdown ⇄ editor ----------
  function inlineMd(t) {
    var s = esc(t);
    s = s.replace(/\*\*(.+?)\*\*/g, '<b>$1</b>');
    s = s.replace(/(^|[^*])\*(?!\s)(.+?)(?<!\s)\*(?!\*)/g, '$1<i>$2</i>');
    s = s.replace(/(^|[^\w_])_(?!\s)(.+?)(?<!\s)_(?![\w_])/g, '$1<i>$2</i>');
    s = s.replace(/\[([^\]]+)\]\(([^)\s]+)\)/g, function (m, txt, href) {
      return '<a href="' + href.replace(/"/g, '%22') + '">' + txt + '</a>';
    });
    return s;
  }

  // para el editor (videos como bloques) o para la vista previa (videos reproducibles)
  function mdAHtml(md, previa) {
    var bloques = String(md || '').replace(/\r\n/g, '\n').split(/\n\s*\n/).map(function (b) { return b.trim(); }).filter(Boolean);
    return bloques.map(function (b) {
      var lineas = b.split('\n').map(function (l) { return l.replace(/\s+$/, ''); });
      var img = b.match(/^!\[([^\]]*)\]\(([^)\s]+)(?:\s+"[^"]*")?\)$/);
      var solo = b.replace(/\\_/g, '_').match(/^<?(https?:\/\/\S+)>?$|^\[[^\]]*\]\((https?:\/\/[^)\s]+)\)$/);
      var vid = solo && youtubeId(solo[1] || solo[2]);
      if (vid) {
        var url = solo[1] || solo[2];
        return previa ? '<div class="video"><iframe src="https://www.youtube-nocookie.com/embed/' + vid + '" allowfullscreen loading="lazy"></iframe></div>'
          : bloqueVideo(url);
      }
      if (img) {
        return previa ? '<figure><img src="' + esc(urlFoto(img[2])) + '" alt="' + esc(img[1]) + '">' + (img[1] ? '<figcaption>' + esc(img[1]) + '</figcaption>' : '') + '</figure>'
          : '<p><img src="' + esc(urlFoto(img[2])) + '" data-archivo="' + esc(img[2]) + '" alt="' + esc(img[1]) + '"></p>';
      }
      if (/^#{2,6} /.test(b)) return '<h2>' + inlineMd(b.replace(/^#{2,6} /, '').trim()) + '</h2>';
      if (b.charAt(0) === '>') return '<blockquote>' + inlineMd(lineas.map(function (l) { return l.replace(/^>\s?/, '').trim(); }).join(' ')) + '</blockquote>';
      if (lineas.every(function (l) { return /^\s*[-*+] /.test(l); })) return '<ul>' + lineas.map(function (l) { return '<li>' + inlineMd(l.replace(/^\s*[-*+] /, '')) + '</li>'; }).join('') + '</ul>';
      if (lineas.every(function (l) { return /^\s*\d+[.)] /.test(l); })) return '<ol>' + lineas.map(function (l) { return '<li>' + inlineMd(l.replace(/^\s*\d+[.)] /, '')) + '</li>'; }).join('') + '</ol>';
      return '<p>' + lineas.map(function (l) { return inlineMd(l.replace(/\\$/, '').trim()); }).join(' ') + '</p>';
    }).join('');
  }

  function bloqueVideo(url) {
    return '<div class="bloque-video" contenteditable="false" data-video="' + esc(url) + '"><span class="play">▶</span>' +
      '<span><b>Video de YouTube</b><br>' + esc(url) + '</span></div>';
  }

  function textoPlano(t) { return t.replace(/ /g, ' ').replace(/\s+/g, ' '); }

  function inlineAMd(nodo) {
    var out = '';
    nodo.childNodes.forEach(function (n) {
      if (n.nodeType === 3) { out += textoPlano(n.nodeValue); return; }
      if (n.nodeType !== 1) return;
      var tag = n.tagName;
      var dentro = inlineAMd(n);
      var estilo = n.getAttribute('style') || '';
      if (tag === 'BR') out += '\n';
      else if (!dentro.trim()) out += dentro;
      else if (tag === 'B' || tag === 'STRONG' || /font-weight:\s*(bold|[6-9]00)/.test(estilo)) out += envolver(dentro, '**');
      else if (tag === 'I' || tag === 'EM' || /font-style:\s*italic/.test(estilo)) out += envolver(dentro, '*');
      else if (tag === 'A' && n.getAttribute('href')) out += '[' + dentro.trim() + '](' + n.getAttribute('href').trim().replace(/\s/g, '%20') + ')';
      else out += dentro;
    });
    return out;
  }
  // **negrita** sin espacios pegados a los asteriscos (si no, la web no la reconoce)
  function envolver(t, marca) {
    var m = t.match(/^(\s*)([\s\S]*?)(\s*)$/);
    return m[2] ? m[1] + marca + m[2] + marca + m[3] : t;
  }

  function editorAMd(raiz) {
    var bloques = [];
    function parrafo(txt) {
      txt.split('\n').forEach(function (p) { p = p.replace(/[ \t]+/g, ' ').trim(); if (p) bloques.push(p); });
    }
    function bloque(n) {
      if (n.nodeType === 3) { parrafo(textoPlano(n.nodeValue)); return; }
      if (n.nodeType !== 1) return;
      var tag = n.tagName;
      if (n.hasAttribute('data-video')) { bloques.push(n.getAttribute('data-video')); return; }
      if (tag === 'IMG') { if (n.getAttribute('data-archivo')) bloques.push('![' + (n.alt || '').replace(/[\[\]]/g, '') + '](' + n.getAttribute('data-archivo') + ')'); return; }
      if (/^H[1-6]$/.test(tag)) { var h = inlineAMd(n).replace(/\s+/g, ' ').trim(); if (h) bloques.push('## ' + h); return; }
      if (tag === 'BLOCKQUOTE') { var q = inlineAMd(n).replace(/\s+/g, ' ').trim(); if (q) bloques.push('> ' + q); return; }
      if (tag === 'UL' || tag === 'OL') {
        var items = Array.prototype.filter.call(n.children, function (li) { return li.tagName === 'LI'; })
          .map(function (li) { return inlineAMd(li).replace(/\s+/g, ' ').trim(); }).filter(Boolean);
        if (items.length) bloques.push(items.map(function (t, i) { return (tag === 'OL' ? (i + 1) + '. ' : '- ') + t; }).join('\n'));
        return;
      }
      // Párrafos (o divs) que contienen fotos o videos: se separan en bloques
      if (n.querySelector('img[data-archivo], [data-video], h2, blockquote, ul, ol, p, div')) {
        var buffer = document.createElement('span');
        n.childNodes.forEach(function (c) {
          if (c.nodeType === 1 && (c.matches('img[data-archivo], [data-video], h1, h2, h3, blockquote, ul, ol, p, div'))) {
            if (buffer.childNodes.length) { parrafo(inlineAMd(buffer)); buffer = document.createElement('span'); }
            bloque(c);
          } else buffer.appendChild(c.cloneNode(true));
        });
        if (buffer.childNodes.length) parrafo(inlineAMd(buffer));
        return;
      }
      parrafo(inlineAMd(n));
    }
    // Texto suelto (sin párrafo) seguido: un solo párrafo
    var suelto = document.createElement('span');
    function soltar() { if (suelto.childNodes.length) { parrafo(inlineAMd(suelto)); suelto = document.createElement('span'); } }
    raiz.childNodes.forEach(function (n) {
      var enLinea = n.nodeType === 3 || (n.nodeType === 1 && /^(B|STRONG|I|EM|A|SPAN|U|FONT|BR)$/.test(n.tagName) && !n.hasAttribute('data-video'));
      if (enLinea) { suelto.appendChild(n.cloneNode(true)); return; }
      soltar();
      bloque(n);
    });
    soltar();
    return bloques.join('\n\n');
  }

  // ---------- editor ----------
  var cuerpo = $('ed-cuerpo');
  try { document.execCommand('defaultParagraphSeparator', false, 'p'); } catch (e) { /* navegadores viejos */ }

  function opcionesSeccion(actual) {
    var lista = SECCIONES.slice();
    estado.notas.forEach(function (n) { if (n.seccion && lista.indexOf(n.seccion) < 0) lista.push(n.seccion); });
    if (actual && lista.indexOf(actual) < 0) lista.push(actual);
    $('ed-seccion').innerHTML = lista.map(function (s) { return '<option>' + esc(s) + '</option>'; }).join('') +
      '<option value="__otra">Otra…</option>';
    $('ed-seccion').value = actual || 'Actualidad';
    $('ed-seccion-otra').hidden = true;
  }
  $('ed-seccion').addEventListener('change', function () {
    var otra = this.value === '__otra';
    $('ed-seccion-otra').hidden = !otra;
    if (otra) $('ed-seccion-otra').focus();
  });

  function autoAlto(t) { t.style.height = 'auto'; t.style.height = t.scrollHeight + 'px'; }
  $('ed-titulo').addEventListener('input', function () { autoAlto(this); });
  $('ed-titulo').addEventListener('keydown', function (e) { if (e.key === 'Enter') e.preventDefault(); });

  function radio(nombre, valor) {
    var r = document.querySelector('input[name=' + nombre + '][value="' + valor + '"]');
    if (r) r.checked = true;
  }
  function valorRadio(nombre) {
    var r = document.querySelector('input[name=' + nombre + ']:checked');
    return r ? r.value : '';
  }

  function abrirEditor(n) {
    nota = n;
    sucio = false;
    $('ed-migas').textContent = n.id ? 'Editar nota' : 'Nueva nota';
    $('ed-titulo').value = n.titulo || '';
    $('ed-bajada').value = n.bajada || '';
    opcionesSeccion(n.seccion || 'Actualidad');
    $('ed-fecha').value = n.fecha || hoy();
    $('ed-autor').value = n.autor != null && n.id ? n.autor : estado.nombre;
    radio('jerarquia', n.jerarquia || 'Normal');
    $('ed-visible').checked = n.visible !== false;
    radio('portada', n.portada || 'Foto');
    $('ed-epigrafe').value = n.epigrafe || '';
    $('ed-video').value = n.video || '';
    ponerFoto(n.imagen || '');
    mostrarPortada();
    previaVideo();
    cuerpo.innerHTML = mdAHtml(n.cuerpo || '', false) || '<p><br></p>';
    revisarVacio();
    pintarEstado();
    var borrable = n.id && (!n.archivo || estado.equipo);
    $('panel-borrar').hidden = !borrable;
    $('borrar-ayuda').textContent = n.archivo ? 'Se borra también de la web.' : 'El borrador se borra para siempre.';
    mostrar('editor');
    autoAlto($('ed-titulo'));
    if (!n.id) $('ed-titulo').focus();
  }

  function pintarEstado() {
    var e = $('ed-estado');
    var n = nota || {};
    var txt, cls;
    if (!n.id) { txt = 'Borrador sin guardar'; cls = 'bor'; }
    else if (n.estado === 'publicada') { txt = n.cambios_sin_publicar || sucio ? 'Publicada · con cambios sin publicar' : 'Publicada en la web'; cls = n.cambios_sin_publicar || sucio ? 'bor' : 'pub'; }
    else if (n.estado === 'fuera') { txt = 'Fuera de la web' + (n.cambios_sin_publicar || sucio ? ' · con cambios' : ''); cls = ''; }
    else { txt = sucio ? 'Borrador · cambios sin guardar' : 'Borrador guardado'; cls = 'bor'; }
    e.textContent = txt;
    e.className = 'estado ' + cls;
    var link = n.archivo && n.estado === 'publicada' ? '../noticias/' + slugify(n.archivo.replace(/^.*\//, '').replace(/\.md$/, '').replace(/^\d{4}-\d{2}-\d{2}-?/, '')) + '.html' : '';
    $('ed-ayuda').innerHTML = 'Al publicar, la nota aparece en la web en uno o dos minutos.' +
      (link ? ' <a href="' + esc(link) + '" target="_blank" rel="noopener">Ver en la web ↗</a>' : '');
  }

  function marcarSucio() { if (!sucio) { sucio = true; pintarEstado(); } }
  $('form-nota').addEventListener('input', marcarSucio);
  $('form-nota').addEventListener('change', marcarSucio);
  cuerpo.addEventListener('input', marcarSucio);
  window.addEventListener('beforeunload', function (e) { if (sucio) { e.preventDefault(); e.returnValue = ''; } });

  function leerFormulario() {
    var sec = $('ed-seccion').value === '__otra' ? $('ed-seccion-otra').value.trim() : $('ed-seccion').value;
    return {
      id: nota && nota.id ? nota.id : undefined,
      titulo: $('ed-titulo').value.replace(/\s+/g, ' ').trim(),
      bajada: $('ed-bajada').value.trim(),
      seccion: sec || 'Actualidad',
      fecha: $('ed-fecha').value || hoy(),
      autor: $('ed-autor').value.trim(),
      jerarquia: valorRadio('jerarquia') || 'Normal',
      visible: $('ed-visible').checked,
      portada: valorRadio('portada') || 'Foto',
      imagen: nota ? nota.imagen || '' : '',
      epigrafe: $('ed-epigrafe').value.trim(),
      video: $('ed-video').value.trim(),
      cuerpo: editorAMd(cuerpo)
    };
  }

  function ocupar(si) {
    ocupado = si;
    document.querySelectorAll('[data-accion]').forEach(function (b) { b.disabled = si; });
  }

  function accionGuardar(publicar) {
    if (ocupado) return;
    var datos = leerFormulario();
    if (publicar) {
      if (!datos.titulo) { aviso('La nota necesita un título para publicarse.', 'error'); $('ed-titulo').focus(); return; }
      if (datos.video && !youtubeId(datos.video)) { aviso('El link del video no es de YouTube.', 'error'); return; }
      if (datos.portada === 'Video' && !youtubeId(datos.video)) { aviso('Elegiste un video como portada: pegá el link de YouTube.', 'error'); return; }
    }
    var p = publicar && (!datos.visible || (nota && nota.estado && nota.estado !== 'borrador')) ? Promise.resolve(true)
      : publicar ? ventana({ titulo: '¿Publicar la nota?', texto: 'Va a aparecer en la web en uno o dos minutos.', aceptar: 'Publicar' })
      : Promise.resolve(true);
    p.then(function (ok) {
      if (!ok) return;
      ocupar(true);
      return api(publicar ? 'publicar' : 'guardar', { nota: datos }).then(function (r) {
        nota = r.nota;
        sucio = false;
        pintarEstado();
        $('ed-migas').textContent = 'Editar nota';
        if (location.hash !== '#nota=' + nota.id) history.replaceState(null, '', '#nota=' + nota.id);
        $('panel-borrar').hidden = !(nota.id && (!nota.archivo || estado.equipo));
        actualizarEnLista(nota);
        if (publicar) aviso(datos.visible ? '¡Publicada! Va a aparecer en la web en uno o dos minutos.' : 'Listo: la nota sale de la web en uno o dos minutos.', '', 6000);
        else aviso('Guardado.', '', 2500);
      }).catch(function (e) {
        aviso(esc(e.message), 'error', 7000);
        if (e.status === 401) sb.auth.signOut().then(function () { mostrar('ingreso'); errorIngreso(e.message); });
      }).then(function () { ocupar(false); });
    });
  }

  function actualizarEnLista(n) {
    var i = estado.notas.findIndex(function (x) { return x.id === n.id; });
    if (i >= 0) estado.notas[i] = n; else estado.notas.unshift(n);
  }

  function accionBorrar() {
    if (!nota || !nota.id || ocupado) return;
    ventana({ titulo: '¿Borrar la nota?', texto: nota.archivo ? 'También se borra de la web. No se puede deshacer.' : 'El borrador se borra para siempre.', aceptar: 'Borrar', peligro: true })
      .then(function (ok) {
        if (!ok) return;
        ocupar(true);
        return api('borrar', { id: nota.id }).then(function () {
          estado.notas = estado.notas.filter(function (x) { return x.id !== nota.id; });
          sucio = false;
          aviso('Nota borrada.');
          location.hash = '';
        }).catch(function (e) { aviso(esc(e.message), 'error', 7000); }).then(function () { ocupar(false); });
      });
  }

  document.addEventListener('click', function (e) {
    var b = e.target.closest && e.target.closest('[data-accion]');
    if (!b) return;
    var a = b.getAttribute('data-accion');
    if (a === 'guardar') accionGuardar(false);
    else if (a === 'publicar') accionGuardar(true);
    else if (a === 'previa') vistaPrevia();
    else if (a === 'borrar') accionBorrar();
  });

  // ---------- barra de formato ----------
  var seleccionGuardada = null;
  function guardarSeleccion() {
    var s = window.getSelection();
    if (s.rangeCount && cuerpo.contains(s.anchorNode)) seleccionGuardada = s.getRangeAt(0).cloneRange();
  }
  function recuperarSeleccion() {
    var s = window.getSelection();
    // Si el cursor ya está en el texto, se deja donde está
    if (document.activeElement === cuerpo && s.rangeCount && cuerpo.contains(s.anchorNode)) return;
    cuerpo.focus();
    if (seleccionGuardada) { s.removeAllRanges(); s.addRange(seleccionGuardada); }
  }
  cuerpo.addEventListener('keyup', guardarSeleccion);
  cuerpo.addEventListener('mouseup', guardarSeleccion);
  cuerpo.addEventListener('blur', guardarSeleccion);
  document.addEventListener('selectionchange', function () {
    if (document.activeElement === cuerpo) {
      guardarSeleccion();
      var bloque = (function () { try { return document.queryCommandValue('formatBlock'); } catch (e) { return ''; } })();
      document.querySelectorAll('.barra-txt [data-cmd]').forEach(function (b) {
        var c = b.getAttribute('data-cmd');
        var on = false;
        try {
          if (c === 'bold' || c === 'italic') on = document.queryCommandState(c);
          else if (c === 'h2') on = /h2/i.test(bloque);
          else if (c === 'quote') on = /blockquote/i.test(bloque);
          else if (c === 'ul' || c === 'ol') { var bl = bloqueDelCursor(); on = !!bl && bl.tagName === c.toUpperCase(); }
        } catch (e) { /* nada */ }
        b.classList.toggle('on', on);
      });
    }
  });

  // Fotos y videos van como bloque propio, después del párrafo donde estaba el cursor
  // Listas hechas a mano: el comando del navegador deja el cursor al principio y arma HTML inválido
  function bloqueDelCursor() {
    var s = window.getSelection();
    var n = s.rangeCount ? s.getRangeAt(0).startContainer : null;
    if (!n || !cuerpo.contains(n)) return null;
    while (n && n.parentNode !== cuerpo) n = n.parentNode;
    return n;
  }
  function cursorAlFinal(el) {
    var r = document.createRange();
    r.selectNodeContents(el);
    r.collapse(false);
    var s = window.getSelection();
    s.removeAllRanges();
    s.addRange(r);
  }
  function alternarLista(tipo) {
    var b = bloqueDelCursor();
    if (!b || b.nodeType !== 1) { document.execCommand(tipo === 'UL' ? 'insertUnorderedList' : 'insertOrderedList'); return; }
    var ultimo;
    if (b.tagName === 'UL' || b.tagName === 'OL') {
      if (b.tagName === tipo) {
        // Sacar la lista: cada ítem vuelve a ser un párrafo
        Array.prototype.slice.call(b.children).forEach(function (li) {
          var p = document.createElement('p');
          while (li.firstChild) p.appendChild(li.firstChild);
          if (!p.firstChild) p.innerHTML = '<br>';
          cuerpo.insertBefore(p, b);
          ultimo = p;
        });
        cuerpo.removeChild(b);
      } else {
        var otra = document.createElement(tipo);
        while (b.firstChild) otra.appendChild(b.firstChild);
        cuerpo.replaceChild(otra, b);
        ultimo = otra.lastElementChild || otra;
      }
    } else if (b.hasAttribute && b.hasAttribute('data-video')) {
      return;
    } else {
      var lista = document.createElement(tipo);
      var li = document.createElement('li');
      while (b.firstChild) li.appendChild(b.firstChild);
      if (!li.firstChild) li.innerHTML = '<br>';
      lista.appendChild(li);
      cuerpo.replaceChild(lista, b);
      ultimo = li;
    }
    if (ultimo) cursorAlFinal(ultimo);
    marcarSucio();
    revisarVacio();
  }

  function insertarBloque(html) {
    var r = seleccionGuardada;
    var ref = r && cuerpo.contains(r.startContainer) ? r.startContainer : null;
    while (ref && ref.parentNode !== cuerpo) ref = ref.parentNode;
    var tmp = document.createElement('div');
    tmp.innerHTML = html;
    var nuevo = tmp.firstChild;
    var siguiente = document.createElement('p');
    siguiente.innerHTML = '<br>';
    var vacio = ref && ref.nodeType === 1 && !ref.textContent.trim() && !ref.querySelector('img,[data-video]');
    if (ref && vacio) cuerpo.replaceChild(nuevo, ref);
    else if (ref) cuerpo.insertBefore(nuevo, ref.nextSibling);
    else cuerpo.appendChild(nuevo);
    cuerpo.insertBefore(siguiente, nuevo.nextSibling);
    cuerpo.focus();
    var rango = document.createRange();
    rango.setStart(siguiente, 0);
    rango.collapse(true);
    var sel = window.getSelection();
    sel.removeAllRanges();
    sel.addRange(rango);
    seleccionGuardada = rango.cloneRange();
    marcarSucio();
    revisarVacio();
  }

  // El cuerpo siempre empieza con un párrafo (así Enter y los formatos funcionan bien)
  function revisarVacio() {
    var vacio = !cuerpo.textContent.trim() && !cuerpo.querySelector('img,[data-video],li');
    cuerpo.classList.toggle('vacio', vacio);
    if (!cuerpo.firstChild) cuerpo.innerHTML = '<p><br></p>';
    else if (cuerpo.firstChild.nodeType === 3 && cuerpo.childNodes.length === 1) {
      // Texto escrito directo en el cuerpo: se pasa a un párrafo sin mover el cursor de lugar
      var t = cuerpo.firstChild, sel = window.getSelection(), pos = sel.rangeCount ? sel.getRangeAt(0).startOffset : t.length;
      var p = document.createElement('p');
      cuerpo.replaceChild(p, t);
      p.appendChild(t);
      var rg = document.createRange();
      rg.setStart(t, Math.min(pos, t.length));
      rg.collapse(true);
      sel.removeAllRanges();
      sel.addRange(rg);
    }
  }
  cuerpo.addEventListener('input', revisarVacio);
  cuerpo.addEventListener('focus', revisarVacio);

  document.querySelector('.barra-txt').addEventListener('mousedown', function (e) {
    if (e.target.closest('[data-cmd]')) e.preventDefault(); // no perder la selección del texto
  });
  document.querySelector('.barra-txt').addEventListener('click', function (e) {
    var b = e.target.closest('[data-cmd]');
    if (!b) return;
    var c = b.getAttribute('data-cmd');
    if (c === 'bold' || c === 'italic') { recuperarSeleccion(); document.execCommand(c); }
    else if (c === 'h2') { recuperarSeleccion(); document.execCommand('formatBlock', false, b.classList.contains('on') ? 'p' : 'h2'); }
    else if (c === 'quote') { recuperarSeleccion(); document.execCommand('formatBlock', false, b.classList.contains('on') ? 'p' : 'blockquote'); }
    else if (c === 'ul' || c === 'ol') { recuperarSeleccion(); alternarLista(c.toUpperCase()); }
    else if (c === 'link') {
      var sel = seleccionGuardada && seleccionGuardada.toString();
      ventana({ titulo: 'Agregar link', texto: sel ? 'Se aplica al texto marcado: «' + sel.slice(0, 60) + '».' : 'Primero marcá el texto que querés convertir en link.',
        campo: 'https://…', tipo: 'url', aceptar: 'Agregar',
        validar: function (v) { return /^(https?:\/\/|mailto:)\S+$/.test(v) ? '' : 'Pegá un link que empiece con https://'; } })
        .then(function (url) {
          if (!url) return;
          recuperarSeleccion();
          if (sel) document.execCommand('createLink', false, url);
          else document.execCommand('insertHTML', false, '<a href="' + esc(url) + '">' + esc(url) + '</a>');
          marcarSucio();
        });
    } else if (c === 'video') {
      ventana({ titulo: 'Video de YouTube', texto: 'Pegá el link del video. Se va a ver en medio del texto.', campo: 'https://www.youtube.com/watch?v=…', tipo: 'url', aceptar: 'Agregar',
        validar: function (v) { return youtubeId(v) ? '' : 'Ese link no es de un video de YouTube.'; } })
        .then(function (url) { if (url) insertarBloque(bloqueVideo(url)); });
    } else if (c === 'foto') {
      elegirArchivo().then(function (f) {
        if (!f) return;
        subirFoto(f).then(function (nombre) {
          return ventana({ titulo: 'Epígrafe de la foto', texto: 'Opcional: quién aparece, dónde, crédito.', campo: 'Epígrafe', aceptar: 'Listo', cancelar: 'Sin epígrafe' })
            .then(function (epi) {
              insertarBloque('<p><img src="' + esc(urlFoto(nombre)) + '" data-archivo="' + esc(nombre) + '" alt="' + esc(epi || '') + '"></p>');
            });
        }).catch(function () { /* el aviso ya se mostró */ });
      });
    }
    marcarSucio();
  });

  // Pegar siempre como texto limpio (sin formatos raros de Word o de otras webs)
  cuerpo.addEventListener('paste', function (e) {
    var t = (e.clipboardData || window.clipboardData).getData('text/plain');
    if (t == null) return;
    e.preventDefault();
    var html = t.replace(/\r\n/g, '\n').split(/\n\s*\n|\n/).map(function (p) { return p.trim(); }).filter(Boolean)
      .map(function (p) { return youtubeId(p) && /^\S+$/.test(p) ? bloqueVideo(p) : '<p>' + esc(p) + '</p>'; }).join('');
    document.execCommand('insertHTML', false, html || esc(t));
  });

  // ---------- fotos ----------
  function elegirArchivo() {
    return new Promise(function (resolver) {
      var i = document.createElement('input');
      i.type = 'file';
      i.accept = 'image/jpeg,image/png,image/webp';
      i.onchange = function () { resolver(i.files && i.files[0]); };
      i.click();
    });
  }

  // Achica la foto en el navegador (1600 px, JPG) antes de subirla: sube rápido aunque sea del celular
  function achicar(archivo) {
    return new Promise(function (resolver, rechazar) {
      if (!/^image\/(jpeg|png|webp)$/.test(archivo.type)) return rechazar(new Error('La foto tiene que ser JPG, PNG o WEBP.'));
      var url = URL.createObjectURL(archivo);
      var img = new Image();
      img.onload = function () {
        var max = 1600;
        var esc_ = Math.min(1, max / Math.max(img.width, img.height));
        var c = document.createElement('canvas');
        c.width = Math.round(img.width * esc_);
        c.height = Math.round(img.height * esc_);
        var ctx = c.getContext('2d');
        ctx.fillStyle = '#ffffff';
        ctx.fillRect(0, 0, c.width, c.height);
        ctx.drawImage(img, 0, 0, c.width, c.height);
        URL.revokeObjectURL(url);
        var datos = c.toDataURL('image/jpeg', 0.85).split(',')[1];
        resolver({ datos: datos, tipo: 'image/jpeg', nombre: archivo.name.replace(/\.[a-z0-9]+$/i, '') + '.jpg' });
      };
      img.onerror = function () { URL.revokeObjectURL(url); rechazar(new Error('No pudimos abrir esa foto. Probá con otra.')); };
      img.src = url;
    });
  }

  function subirFoto(archivo) {
    aviso('Subiendo la foto…', '', 2500);
    ocupar(true);
    return achicar(archivo).then(function (f) { return api('subir_foto', f); })
      .then(function (r) { ocupar(false); return r.imagen; })
      .catch(function (e) { ocupar(false); aviso(esc(e.message), 'error', 7000); throw e; });
  }

  function ponerFoto(nombre) {
    if (nota) nota.imagen = nombre;
    var prev = $('foto-prev');
    prev.hidden = !nombre;
    $('foto-soltar').hidden = !!nombre;
    if (nombre) prev.querySelector('img').src = urlFoto(nombre);
  }
  $('foto-archivo').addEventListener('change', function () {
    var f = this.files && this.files[0];
    this.value = '';
    if (f) subirFoto(f).then(function (n) { ponerFoto(n); marcarSucio(); }).catch(function () {});
  });
  ['dragover', 'dragenter'].forEach(function (ev) {
    $('foto-soltar').addEventListener(ev, function (e) { e.preventDefault(); this.classList.add('sobre'); });
  });
  ['dragleave', 'drop'].forEach(function (ev) {
    $('foto-soltar').addEventListener(ev, function () { this.classList.remove('sobre'); });
  });
  $('foto-soltar').addEventListener('drop', function (e) {
    e.preventDefault();
    var f = e.dataTransfer.files && e.dataTransfer.files[0];
    if (f) subirFoto(f).then(function (n) { ponerFoto(n); marcarSucio(); }).catch(function () {});
  });
  $('foto-quitar').addEventListener('click', function () { ponerFoto(''); marcarSucio(); });

  function mostrarPortada() {
    var v = valorRadio('portada') === 'Video';
    $('portada-video').hidden = !v;
    $('portada-foto').hidden = v;
  }
  document.querySelectorAll('input[name=portada]').forEach(function (r) { r.addEventListener('change', mostrarPortada); });
  function previaVideo() {
    var id = youtubeId($('ed-video').value);
    $('video-prev').hidden = !id;
    if (id) $('video-prev').querySelector('img').src = 'https://i.ytimg.com/vi/' + id + '/mqdefault.jpg';
  }
  $('ed-video').addEventListener('input', previaVideo);

  // ---------- vista previa ----------
  function vistaPrevia() {
    var d = leerFormulario();
    var vid = youtubeId(d.video);
    var portada = '';
    if (vid && (d.portada === 'Video' || !d.imagen)) portada = '<div class="video"><iframe src="https://www.youtube-nocookie.com/embed/' + vid + '" allowfullscreen></iframe></div>';
    else if (d.imagen) portada = '<figure><img src="' + esc(urlFoto(d.imagen)) + '" alt="">' + (d.epigrafe ? '<figcaption>' + esc(d.epigrafe) + '</figcaption>' : '') + '</figure>';
    var p = document.createElement('div');
    p.className = 'previa';
    p.setAttribute('role', 'dialog');
    p.setAttribute('aria-label', 'Vista previa');
    var f = d.fecha.split('-');
    var meses = ['enero', 'febrero', 'marzo', 'abril', 'mayo', 'junio', 'julio', 'agosto', 'septiembre', 'octubre', 'noviembre', 'diciembre'];
    p.innerHTML = '<div class="previa-barra"><span>Vista previa · así se va a ver la nota (aproximado)</span>' +
      '<button class="btn btn-sm" type="button">Volver a editar</button></div>' +
      '<article class="nota"><span class="sec">' + esc(d.seccion) + '</span><h1>' + esc(d.titulo || 'Nota sin título') + '</h1>' +
      (d.bajada ? '<p class="bajada">' + esc(d.bajada) + '</p>' : '') +
      '<p class="firma">' + esc(d.autor || 'Redacción SUBE') + ' · ' + (+f[2]) + ' de ' + meses[+f[1] - 1] + ' de ' + f[0] + '</p>' +
      portada + '<div class="texto">' + (d.cuerpo ? mdAHtml(d.cuerpo, true) : '<p><i>Esta nota está en redacción.</i></p>') + '</div></article>';
    document.body.appendChild(p);
    document.body.style.overflow = 'hidden';
    function cerrar() { p.remove(); document.body.style.overflow = ''; document.removeEventListener('keydown', tecla); }
    function tecla(e) { if (e.key === 'Escape') cerrar(); }
    p.querySelector('button').addEventListener('click', cerrar);
    document.addEventListener('keydown', tecla);
  }

  // ---------- navegación (#, #nueva, #nota=ID) ----------
  function salirConCambios() {
    if (!sucio || $('v-editor').hidden) return Promise.resolve(true);
    return ventana({ titulo: 'Tenés cambios sin guardar', texto: 'Si salís ahora, se pierden.', aceptar: 'Salir sin guardar', cancelar: 'Seguir editando', peligro: true });
  }

  var hashActual = location.hash;
  function ruta(primeraVez) {
    var h = location.hash;
    if (h === '#nueva') {
      abrirEditor({});
    } else if (/^#nota=/.test(h)) {
      var id = decodeURIComponent(h.slice(6));
      mostrar('editor');
      $('ed-estado').textContent = 'Abriendo la nota…';
      api('leer', { id: id }).then(function (r) { abrirEditor(r.nota); }).catch(function (e) {
        aviso(esc(e.message), 'error');
        location.hash = '';
      });
    } else {
      mostrar('lista');
      if (primeraVez) pintarListado(); else { pintarListado(); recargarListado(); }
    }
    hashActual = location.hash;
  }
  window.addEventListener('hashchange', function () {
    if (location.hash === hashActual) return;
    var destino = location.hash;
    salirConCambios().then(function (ok) {
      if (!ok) { history.replaceState(null, '', hashActual); return; }
      sucio = false;
      history.replaceState(null, '', destino || location.pathname);
      ruta();
    });
  });

  // ---------- inicio ----------
  sb.auth.getSession().then(function (r) {
    if (r.data && r.data.session) return entrar();
    mostrar('ingreso');
  }).catch(function () { mostrar('ingreso'); });
})();
