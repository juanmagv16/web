/* ============================================
   SUBE — sección Noticias
   ------------------------------------------------------
   1) Portada (noticias.html): los botones de sección filtran
      las tarjetas sin recargar la página.
   2) Nota (noticias/*.html): arma los links para compartir
      por WhatsApp y X, y el botón "Copiar link".
   Si algo falla, la página se sigue viendo completa.
   ============================================ */
(function () {
  // ---------- Filtros por sección ----------
  var chips = document.querySelectorAll('.news-chip');
  var list = document.getElementById('news-list');
  var empty = document.getElementById('news-empty');

  if (chips.length && list) {
    var cards = list.querySelectorAll('.nc');
    chips.forEach(function (chip) {
      chip.addEventListener('click', function () {
        var filter = chip.getAttribute('data-filter');
        chips.forEach(function (c) {
          var on = c === chip;
          c.classList.toggle('is-active', on);
          c.setAttribute('aria-pressed', on ? 'true' : 'false');
        });
        var visible = 0;
        cards.forEach(function (card) {
          var show = !filter || card.getAttribute('data-seccion') === filter;
          card.hidden = !show;
          if (show) visible++;
        });
        // Con filtro activo, todas las tarjetas tienen el mismo tamaño
        list.classList.toggle('is-filtered', !!filter);
        if (empty) empty.hidden = visible > 0;
      });
    });
  }

  // ---------- Compartir ----------
  var share = document.querySelector('[data-share]');
  if (!share) return;

  var url = window.location.href.split('#')[0];
  var titleEl = document.querySelector('.article-head h1');
  var title = titleEl ? titleEl.textContent.trim() : document.title;

  var wa = share.querySelector('[data-share-to="whatsapp"]');
  if (wa) wa.href = 'https://wa.me/?text=' + encodeURIComponent(title + ' ' + url);

  var x = share.querySelector('[data-share-to="x"]');
  if (x) x.href = 'https://x.com/intent/post?text=' + encodeURIComponent(title) +
    '&url=' + encodeURIComponent(url) + '&via=SUBEcanal';

  var copy = share.querySelector('[data-share-to="copy"]');
  if (copy) {
    copy.addEventListener('click', function () {
      var label = copy.querySelector('span');
      var done = function () {
        if (!label) return;
        label.textContent = '¡Link copiado!';
        setTimeout(function () { label.textContent = 'Copiar link'; }, 2000);
      };
      if (navigator.clipboard && navigator.clipboard.writeText) {
        navigator.clipboard.writeText(url).then(done, function () { window.prompt('Copiá el link:', url); });
      } else {
        window.prompt('Copiá el link:', url);
      }
    });
  }
})();
