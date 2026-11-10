/* SUBE — Cartel para el local: arma el QR que lleva a la página de
   Comunidad de esta misma web (sirve igual en la web de prueba y en la
   oficial). Si no se puede cargar el QR, queda la dirección escrita. */
(function () {
  "use strict";
  var caja = document.getElementById("cartel-qr");
  var texto = document.getElementById("cartel-url");
  if (!caja) return;
  var url = new URL(caja.getAttribute("data-destino") || "comunidad.html", window.location.href).href;
  if (texto) texto.textContent = url.replace(/^https?:\/\//, "");
  var s = document.createElement("script");
  s.src = "https://cdn.jsdelivr.net/npm/qrcode-generator@1.4.4/qrcode.js";
  s.onload = function () {
    try {
      var qr = window.qrcode(0, "M");
      qr.addData(url);
      qr.make();
      caja.innerHTML = qr.createSvgTag({ cellSize: 6, margin: 2, scalable: true });
    } catch (e) { caja.hidden = true; }
  };
  s.onerror = function () { caja.hidden = true; };
  document.head.appendChild(s);
})();
