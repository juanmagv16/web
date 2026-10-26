/* SUBE — Mi pase: arranque.
   Por defecto se conecta a Supabase (datos reales).
   Con "?demo" en la dirección (mi-pase.html?demo) usa la demostración
   con datos inventados, para mostrar la sección sin tocar datos reales. */
(function () {
  var base = (document.currentScript && document.currentScript.src || '').replace(/[^\/]*$/, '');
  var demo = /[?&]demo\b/.test(window.location.search) || !window.SUBE_PASE_CONFIG;
  var SUPABASE_JS = 'https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2.115.0/dist/umd/supabase.js';

  function cargar(src) {
    return new Promise(function (ok, mal) {
      var s = document.createElement('script');
      s.src = src; s.onload = ok; s.onerror = function () { mal(src); };
      document.body.appendChild(s);
    });
  }
  var pasos = demo
    ? [base + 'mi-pase-datos.js']
    : [SUPABASE_JS, base + 'mi-pase-supabase.js'];

  pasos.reduce(function (p, src) { return p.then(function () { return cargar(src); }); }, Promise.resolve())
    .then(function () {
      // La página pública de verificación de credenciales usa su propio archivo.
      return cargar(base + (document.getElementById('cred-verif') ? 'credencial.js' : 'mi-pase.js'));
    })
    .catch(function () {
      var app = document.getElementById('pase-app') || document.getElementById('cred-verif');
      if (app) app.innerHTML = '<p class="pase-error" role="alert">No pudimos cargar Mi pase. Revisá tu conexión a internet y recargá la página.</p>';
    });
})();
