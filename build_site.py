#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
Genera TODO el sitio de Sube Canal a partir de plantillas compartidas
(header, footer, nav) para que cada página quede consistente.

Correr con: python3 build_site.py
(con --revisar, cualquier aviso termina con error; lo usa la revisión
automática de GitHub)
Vuelve a escribir: index.html, comunidad.html, contenidos.html,
noticias.html, tienda.html, contacto.html, y todos los archivos
dentro de programas/ y noticias/.

Las notas de la sección Noticias NO se escriben acá: cada una es un
archivo de texto en la carpeta redaccion/ (ver redaccion/LEEME.md).

Para agregar/editar el contenido de un programa, buscar el diccionario
PROGRAMS más abajo.
"""
import html
import os
import re
import sys

ROOT = os.path.dirname(__file__)

# ============================================================
# ICONOS (SVG inline, se reusan en header/footer/tarjetas)
# ============================================================
IG_ICON = '<svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true"><rect x="3" y="3" width="18" height="18" rx="5"></rect><circle cx="12" cy="12" r="4"></circle><circle cx="17.3" cy="6.7" r="1"></circle></svg>'
IG_ICON_16 = IG_ICON.replace('width="14" height="14"', 'width="16" height="16"')
MAIL_ICON = '<svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true"><rect x="3" y="5" width="18" height="14" rx="2"></rect><path d="M3 7l9 6 9-6"></path></svg>'
TIKTOK_ICON = '<svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true"><path d="M14 3v10.5a3.5 3.5 0 1 1-3-3.46"></path><path d="M14 3c.3 2.2 2 4 4.5 4.2"></path></svg>'
X_ICON = '<svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true"><path d="M4 4l16 16M20 4L4 20"></path></svg>'
YOUTUBE_ICON = '<svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true"><rect x="2.5" y="5.5" width="19" height="13" rx="3.5"></rect><path d="M10.5 9.2v5.6l5-2.8-5-2.8z" fill="currentColor" stroke="none"></path></svg>'
CHEVRON_ICON = '<svg class="chevron" viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true"><path d="M6 9l6 6 6-6"></path></svg>'
ARROW_LEFT_ICON = '<svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="2.4" aria-hidden="true"><path d="M15 6l-6 6 6 6"></path></svg>'
ARROW_RIGHT_ICON = '<svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="2.4" aria-hidden="true"><path d="M9 6l6 6-6 6"></path></svg>'
PIN_ICON = '<svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true"><path d="M12 21s7-6.6 7-12a7 7 0 1 0-14 0c0 5.4 7 12 7 12z"></path><circle cx="12" cy="9" r="2.5"></circle></svg>'
BACK_ICON = '<svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true"><path d="M15 18l-6-6 6-6"></path></svg>'
BURGER_ICON = '''<svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true">
        <g class="line-open"><path d="M4 6h16M4 12h16M4 18h16"></path></g>
        <g class="line-close"><path d="M5 5l14 14M19 5L5 19"></path></g>
      </svg>'''

NAV_ITEMS = [
    ("comunidad", "Comunidad", "comunidad.html"),
    ("contenidos", "Contenidos", "contenidos.html"),
    ("noticias", "Noticias", "noticias.html"),
    ("tienda", "Tienda", "tienda.html"),
    ("contacto", "Contacto", "contacto.html"),
    ("mipase", "Mi pase", "mi-pase.html"),
]


def up(depth):
    """Prefijo relativo según la profundidad de la página (0 = raíz)."""
    return "../" * depth


def nav_links_html(depth, active):
    links = []
    for key, label, href in NAV_ITEMS:
        classes = []
        if key == active:
            classes.append("is-current")
        if key == "mipase":
            classes.append("nav-pass")
        cls = ' class="{}"'.format(" ".join(classes)) if classes else ""
        links.append('<a href="{u}{href}"{cls}>{label}</a>'.format(u=up(depth), href=href, cls=cls, label=label))
    return "\n      ".join(links)


def header_html(depth, active):
    return '''<header class="site-header">
  <div class="wrap">
    <div class="header-weather" id="header-weather" aria-live="polite" hidden></div>
    <a href="{u}index.html" class="brand"><img src="{u}assets/logo.png" alt="Sube Canal"></a>
    <nav class="nav-links" id="nav-links">
      {links}
    </nav>
    <button class="nav-toggle" id="nav-toggle" aria-label="Abrir menú" aria-expanded="false" aria-controls="nav-links">
      {burger}
    </button>
  </div>
</header>'''.format(u=up(depth), links=nav_links_html(depth, active), burger=BURGER_ICON)


def footer_html(depth):
    u = up(depth)
    return '''<footer>
  <div class="wrap">
    <div class="footer-strip">
      <img class="footer-bus" src="{u}assets/colectivo.png" alt="Sube Canal — un viaje colectivo">
      <div class="footer-channels">
        <a href="mailto:laplatasube@gmail.com">{mail}<span>laplatasube@gmail.com</span></a>
        <a href="https://www.instagram.com/subecanal" target="_blank" rel="noopener">{ig}<span>Instagram</span></a>
        <a href="https://www.tiktok.com/@subecanal" target="_blank" rel="noopener">{tiktok}<span>TikTok</span></a>
        <a href="https://x.com/SUBEcanal" target="_blank" rel="noopener">{x}<span>X</span></a>
        <a href="https://www.youtube.com/@subecanal" target="_blank" rel="noopener">{yt}<span>YouTube</span></a>
      </div>
    </div>
  </div>
</footer>'''.format(u=u, mail=MAIL_ICON, ig=IG_ICON_16, tiktok=TIKTOK_ICON, x=X_ICON, yt=YOUTUBE_ICON)


def page_html(title, description, body, depth, active, extra_scripts=None, body_id=None):
    extra_scripts = extra_scripts or []
    scripts = "\n".join('<script src="{u}assets/{s}"></script>'.format(u=up(depth), s=s) for s in extra_scripts)
    return '''<!DOCTYPE html>
<html lang="es-AR">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>{title}</title>
<meta name="description" content="{description}">
<link rel="icon" href="{u}assets/logo.png">
<link rel="stylesheet" href="{u}style.css">
</head>
<body>

{header}

<main{body_id_attr}>
{body}
</main>

{footer}

<script src="{u}assets/nav.js"></script>
<script src="{u}assets/weather.js"></script>
{scripts}
</body>
</html>
'''.format(
        title=title,
        description=description,
        u=up(depth),
        header=header_html(depth, active),
        body_id_attr=(' id="' + body_id + '"') if body_id else "",
        body=body,
        footer=footer_html(depth),
        scripts=scripts,
    ).replace("\n\n\n", "\n\n")


def write(path, html):
    full = os.path.join(ROOT, path)
    os.makedirs(os.path.dirname(full), exist_ok=True)
    with open(full, "w", encoding="utf-8") as f:
        f.write(html)
    print("generado:", path)


# ============================================================
# HOME (index.html)
# ============================================================
LIVE_PLAYLIST_ID = "PLYT7ujTIBmWat3a4FBqiq8kWbAD_kybd5"

HOME_BODY_TEMPLATE = '''  <section class="hero">
    <div class="wrap">
      <div>
        <h1>Subite a este<br><span class="accent">viaje colectivo</span></h1>
        <div class="hero-sub">
          <p>SUBE es un medio de comunicación independiente y autogestivo hecho en La Plata. Creamos contenidos, generamos encuentros y construimos comunidad alrededor de la cultura local.</p>
          <p>La Comunidad de Pasajerxs sostiene SUBE todos los meses. Sumándote, vos también sos parte y accedés a beneficios en una red de espacios amigos.</p>
        </div>
        <div class="hero-actions">
          <a href="comunidad.html#asociate" class="btn btn-primary">Quiero ser pasajerx</a>
          <a href="comunidad.html#beneficios" class="btn btn-ghost">Ver beneficios</a>
        </div>
      </div>

      <div class="hero-player">
        <p class="hero-player-label">En vivo / último programa</p>
        <div class="video-embed">
          <iframe
            src="https://www.youtube.com/embed/videoseries?list={list_id}"
            title="SUBE — en vivo"
            loading="lazy"
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
            allowfullscreen>
          </iframe>
        </div>

        <div class="next-stop" id="next-stop" aria-live="polite" hidden></div>
      </div>
    </div>
  </section>

  <section class="featured-news">
    <div class="wrap">
      <div class="section-head">
        <h2>Noticias destacadas</h2>
        <a class="section-head-link" href="noticias.html">Ver todas las noticias →</a>
      </div>
      <div class="news-grid">
{featured_news}
      </div>
    </div>
  </section>

  <section class="sponsors">
    <div class="wrap">
      <div class="sponsor-slots">
        <a class="sponsor-slot sponsor-slot--banner sponsor-banner" href="comunidad.html#beneficios" aria-label="Sponsors oficiales: Roots Cooperativa, Refugio 62 y Tatana">
          <img class="sponsor-banner-title" src="assets/sponsors/sponsors-oficiales-titulo.jpg" alt="" width="628" height="396" loading="lazy">
          <span class="sponsor-banner-logos">
            <img src="assets/sponsors/logo-roots-cooperativa.png" alt="Roots Cooperativa" loading="lazy">
            <img src="assets/sponsors/logo-refugio-62.png" alt="Refugio 62" loading="lazy">
            <img src="assets/sponsors/logo-tatana.png" alt="Tatana" loading="lazy">
          </span>
        </a>

        <div class="sponsor-slot-row">
          <a class="sponsor-slot sponsor-slot--square sponsor-slot--image" href="comunidad.html#beneficios">
            <img src="assets/sponsors/paradas-amigas-casa-chicha-carpincho.jpg" alt="Paradas amigas: Casa Chicha, 10% off en birras y talleres; Carpincho, 10% off con cupón exclusivo" width="1080" height="1080" loading="lazy">
          </a>
          <a class="sponsor-slot sponsor-slot--square sponsor-slot--image" href="https://www.gba.gob.ar" target="_blank" rel="noopener">
            <img src="assets/sponsors/publicidad-pba.jpg" alt="Gobierno de la Provincia de Buenos Aires" width="720" height="720" loading="lazy">
          </a>
          <a class="sponsor-slot sponsor-slot--square sponsor-slot--image" href="https://www.laplata.gob.ar" target="_blank" rel="noopener">
            <img src="assets/sponsors/publicidad-municipalidad-la-plata.jpg" alt="La Plata Capital — Municipalidad de La Plata" width="720" height="720" loading="lazy">
          </a>
        </div>

        <div class="sponsor-slot-row sponsor-slot-row--2">
          <a class="sponsor-slot sponsor-slot--banner" href="contacto.html">
            <span class="sponsor-slot-label">Banner horizontal</span>
          </a>
          <a class="sponsor-slot sponsor-slot--banner" href="contacto.html">
            <span class="sponsor-slot-label">Banner horizontal</span>
          </a>
        </div>
      </div>
    </div>
  </section>
'''

# ============================================================
# BENEFICIOS (beneficios.html) — grilla tal cual estaba
# ============================================================
BENEFIT_CARDS = [
    # (slug, inicial, nombre, categoria, [perks], ig, ubicacion_o_None)
    ("puntoexe.informatica", ".", ".exe informática", "Tecnología", ["15% de descuento en servicio técnico"], "puntoexe.informatica", None),
    ("carpincho.indumentaria", "C", "Carpincho", "Indumentaria", ["10% de descuento"], "carpincho.indumentaria", None),
    ("casachicha.lp", "C", "Casa Chicha", "Producción cultural", ["10% de descuento en birras", "10% de descuento en talleres (por cupo)"], "casachicha.lp", "15 1404, C. 61 996, B1900 La Plata"),
    ("imperialitosdelplata", "I", "Imperialitos del Plata", "Gastronomía", ["Sorteo de una docena"], "imperialitosdelplata", "Diag. 78 427, B1904 La Plata"),
    ("la_compostera", "L", "La Compostera", "Gastronomía", ["10% de descuento"], "la_compostera", "Av. 60 647, B1900 La Plata"),
    ("laola.indie", "L", "La Ola Indie", "Eventos", ["15% de descuento en entradas anticipadas"], "laola.indie", None),
    ("libreriamascaro", "M", "Mascaró", "Librería / Editorial", ["10% de descuento"], "libreriamascaro", "33H7+JF La Plata, Provincia de Buenos Aires"),
    ("munayarena", "M", "Munay Arena", "Gimnasio / Deportes", ["15% de descuento"], "munayarena", "3XXM+3M Gonnet, Provincia de Buenos Aires"),
    ("mundo.semilla", "M", "Mundo Semilla", "Gastronomía", ["10% de descuento en milanesas (acumulable con Cuenta DNI)"], "mundo.semilla", None),
    ("pao.tatt", "P", "Pao tatt", "Tatuajes", ["15% de descuento"], "pao.tatt", None),
    ("refugio62_", "R", "Refugio 62", "Gastronomía", ["10% de descuento en todas las cervezas"], "refugio62_", "33F5+V2 La Plata, Provincia de Buenos Aires"),
    ("roots_cooperativa", "R", "Roots Pizza", "Gastronomía", ["10% para la comunidad (acumulable con Cuenta DNI)"], "roots_cooperativa", "33H2+JP La Plata, Provincia de Buenos Aires"),
    ("tatana.ar", "T", "Tatana", "Gastronomía", ["10% de descuento en vermú seleccionados"], "tatana.ar", "33H6+R6 La Plata, Provincia de Buenos Aires"),
]


def benefit_card_html(slug, initial, name, cat, perks, ig, ubicacion=None):
    perks_html = "".join("<li>{}</li>".format(p) for p in perks)
    loc_attr = ' data-location="{}"'.format(ubicacion) if ubicacion else ""
    return '''        <article class="benefit-card"{loc_attr}>
          <div class="benefit-top">
            <div class="benefit-logo mono" data-slug="{slug}" data-name="{name}">{initial}</div>
            <div>
              <div class="benefit-name">{name}</div>
              <div class="benefit-cat">{cat}</div>
            </div>
          </div>
          <ul class="benefit-perks">
            {perks}
          </ul>
          <div class="benefit-foot">
            <a class="benefit-ig" href="https://www.instagram.com/{ig}/" target="_blank" rel="noopener">{icon}<span>@{ig}</span></a>
          </div>
        </article>'''.format(slug=slug, name=name, initial=initial, cat=cat, perks=perks_html, ig=ig, icon=IG_ICON, loc_attr=loc_attr)


COMUNIDAD_BODY = '''  <section class="benefits" id="beneficios">
    <div class="wrap">
      <div class="section-head">
        <h2>Beneficios para nuestra comunidad</h2>
        <p>Espacios amigos que suman descuentos exclusivos para quienes sostienen a SUBE. Mostrá tu boleto de pasajerx desde <a href="mi-pase.html">Mi pase</a> y viajá con beneficios.</p>
      </div>

      <div class="carousel">
        <button class="carousel-arrow carousel-arrow--prev" type="button" aria-label="Ver beneficios anteriores">{arrow_left}</button>

        <div class="benefit-grid" id="benefit-grid" data-fallback="true">

{cards}

        </div>

        <button class="carousel-arrow carousel-arrow--next" type="button" aria-label="Ver más beneficios">{arrow_right}</button>
      </div>

      <button class="btn btn-ghost btn-location" id="activate-location" type="button">{pin} Ver qué tan cerca están</button>

      <p class="benefits-note">Los descuentos y condiciones de cada beneficio son definidos por cada espacio adherido y pueden cambiar sin aviso previo.</p>

      <a class="partner-cta" href="mailto:laplatasube@gmail.com?subject=Quiero%20sumar%20mi%20comercio%20a%20SUBE">
        <span class="partner-cta-title">¿Tenés un comercio o espacio en La Plata?</span>
        <span class="partner-cta-desc">Si querés formar parte de esta red, contactate con nosotros y nuestro equipo comercial te estará respondiendo.</span>
      </a>
    </div>
  </section>

  <section class="pass-cta-section">
    <div class="wrap">
      <a class="pass-cta" href="mi-pase.html">
        <span class="pass-cta-ticket" aria-hidden="true">
          <span class="pass-cta-ticket-top">SUBE</span>
          <span class="pass-cta-ticket-mid">Pasajerx al día</span>
        </span>
        <span class="pass-cta-text">
          <span class="eyebrow">Mi pase</span>
          <span class="pass-cta-title">¿Ya sos pasajerx? Entrá y mostrá tu boleto</span>
          <span class="pass-cta-desc">Con tu mail ves si estás al día y tenés tu boleto para mostrar en los comercios adheridos. Si tenés un comercio adherido, desde ahí también podés verificar socios.</span>
        </span>
        <span class="pass-cta-arrow" aria-hidden="true">→</span>
      </a>
    </div>
  </section>

  <section class="join" id="asociate">
    <div class="wrap">
      <div class="section-head">
        <p class="eyebrow">Asociate</p>
        <h2>Elegí cómo subirte</h2>
        <p>Tu aporte sostiene la producción de Sube Canal y te suma a la Comunidad de Pasajerxs, con acceso a todos los beneficios de la red.</p>
      </div>

      <div class="plans">

        <div class="plan">
          <h3>Aporte mensual</h3>
          <div class="price">$5.000 <span>/ mes</span></div>
          <p class="desc">Suscripción mensual vía Mercado Pago. Podés cancelarla cuando quieras.</p>
          <a class="btn btn-primary" href="https://www.mercadopago.com.ar/subscriptions/checkout?preapproval_plan_id=2c93808497c462520197c89aa36c01c1" target="_blank" rel="noopener">Sumarme por $5.000</a>
        </div>

        <div class="plan featured">
          <span class="plan-tag">Recomendado</span>
          <h3>Aporte mensual</h3>
          <div class="price">$7.500 <span>/ mes</span></div>
          <p class="desc">Suscripción mensual vía Mercado Pago. Es el aporte que más sostiene la producción del canal.</p>
          <a class="btn btn-primary" href="https://www.mercadopago.com.ar/subscriptions/checkout?preapproval_plan_id=2c93808497c876110197c89c88040016" target="_blank" rel="noopener">Sumarme por $7.500</a>
        </div>

        <div class="plan">
          <h3>Aporte único</h3>
          <div class="price">A voluntad</div>
          <p class="desc">Un pago único, del monto que quieras, vía Mercado Pago. Ideal si preferís no suscribirte.</p>
          <a class="btn btn-primary" href="https://link.mercadopago.com.ar/subecanal" target="_blank" rel="noopener">Hacer un aporte</a>
        </div>

      </div>

      <details class="email-help">
        <summary>
          <span>¿Necesitás cambiar el mail asociado a tu suscripción?</span>
          {chevron}
        </summary>
        <div class="email-help-body">
          <p>Primero necesitamos que confirmes cuál es el mail con el que te suscribiste en Mercado Pago:</p>

          <ol class="email-help-steps">
            <li>
              <p><strong>Paso 1.</strong> Ingresá a tu App de Mercado Pago y tocá arriba en donde dice tu nombre.</p>
              <img src="assets/ayuda/cambio_1.jpeg" alt="Pantalla de Mercado Pago mostrando 'Hola, Nahuel' arriba a la izquierda" loading="lazy">
            </li>
            <li>
              <p><strong>Paso 2.</strong> Se te va a desplegar esta parte, donde aparece tu mail registrado.</p>
              <img src="assets/ayuda/cambio_2.jpeg" alt="Panel desplegado de Mercado Pago mostrando el mail registrado de la cuenta" loading="lazy">
            </li>
          </ol>

          <p>Una vez que ya sabés cuál es el correo que usás en Mercado Pago, completá el siguiente formulario:</p>
          <a class="btn btn-ghost" href="https://forms.gle/WpfyhGHWxJVBs8xD9" target="_blank" rel="noopener">Ir al formulario</a>
        </div>
      </details>

    </div>
  </section>
'''.format(
    cards="\n\n".join(benefit_card_html(*c) for c in BENEFIT_CARDS),
    chevron=CHEVRON_ICON,
    arrow_left=ARROW_LEFT_ICON,
    arrow_right=ARROW_RIGHT_ICON,
    pin=PIN_ICON,
)

# ============================================================
# CONTENIDOS — Programación inline + Noticias como antes (card)
# ============================================================
CONTENIDOS_BODY = '''  <section class="content">
    <div class="wrap">
      <div class="section-head">
        <h2>Contenidos</h2>
        <p>Todo lo que produce SUBE, en un solo lugar.</p>
      </div>

      <div class="content-subhead">
        <span class="content-subhead-eyebrow">En vivo y on demand</span>
        <h3>Programación</h3>
      </div>

      <div class="content-schedule" id="content-schedule">

        <div class="schedule-day">
          <h3>Lunes</h3>
          <ul class="schedule-list">
            <li>
              <span class="schedule-time">18:00</span>
              <a href="programas/streaming-copa.html">Streaming Copa</a>
            </li>
            <li>
              <span class="schedule-time">19:30</span>
              <a href="programas/marcando-la-cancha.html">Marcando la cancha</a>
            </li>
            <li>
              <span class="schedule-time">21:00</span>
              <a href="programas/falopa-informativa-nacional.html">FIN! F@lopa informativa nacional</a>
            </li>
          </ul>
        </div>

        <div class="schedule-day">
          <h3>Jueves</h3>
          <ul class="schedule-list">
            <li>
              <span class="schedule-time">18:00</span>
              <a href="programas/el-amplificador.html">El Amplificador – 10ma temporada</a>
            </li>
            <li>
              <span class="schedule-time">19:30</span>
              <a href="programas/estacion-freak.html">Estación Freak</a>
              <span class="schedule-alt">Cada dos semanas, alterna con ¿De qué viven?</span>
            </li>
            <li>
              <span class="schedule-time">20:00</span>
              <a href="programas/de-que-viven.html">¿De qué viven?</a>
              <span class="schedule-alt">Cada dos semanas, alterna con Estación Freak</span>
            </li>
            <li>
              <span class="schedule-time">21:30</span>
              <a href="programas/chicha-y-limonada.html">Chicha y limonada</a>
            </li>
          </ul>
        </div>

        <div class="schedule-day" id="schedule-ondemand-block">
          <h3>On demand</h3>
          <ul class="ondemand-list">
            <li>
              <a href="programas/umbrales.html">
                <span class="ondemand-main">
                  <span class="ondemand-name">Umbrales</span>
                </span>
                <span class="ondemand-tag">Programa</span>
              </a>
            </li>
            <li>
              <a href="https://www.youtube.com/watch?v=2E0gkC1fRDY&list=PLYT7ujTIBmWbglZ7Mmi-r4RnP1NqsDMt6" target="_blank" rel="noopener">
                <span class="ondemand-main">
                  <span class="ondemand-name">Especiales</span>
                  <span class="ondemand-desc">Navegá en todos nuestros especiales</span>
                </span>
                <span class="ondemand-tag">Playlist</span>
              </a>
            </li>
          </ul>
        </div>

      </div>

      <div class="content-subhead">
        <span class="content-subhead-eyebrow">Redacción SUBE</span>
        <h3>Noticias</h3>
      </div>

      <a class="hub-card" href="noticias.html">
        <span class="hub-card-title">Coberturas, notas y actualidad</span>
        <span class="hub-card-desc">La parte informativa de SUBE: lo que pasa en La Plata y en el país, contado por nuestra redacción.</span>
        <span class="hub-card-arrow">→</span>
      </a>

    </div>
  </section>
'''

# ============================================================
# NOTICIAS (noticias.html + noticias/*.html)
# ============================================================
# Cada nota es un archivo de texto dentro de la carpeta redaccion/.
# El formato está explicado en redaccion/LEEME.md y hay una plantilla
# lista para copiar en redaccion/_plantilla.txt. Los archivos que
# empiezan con "_" o que no terminan en .txt se ignoran.
NEWS_SOURCE_DIR = os.path.join(ROOT, "redaccion")
NEWS_DEFAULT_AUTHOR = "Redacción SUBE"
MESES = ["enero", "febrero", "marzo", "abril", "mayo", "junio", "julio",
         "agosto", "septiembre", "octubre", "noviembre", "diciembre"]
WHATSAPP_ICON = '<svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true"><path d="M20 11.5a8.5 8.5 0 0 1-12.6 7.4L3 20l1.2-4.2A8.5 8.5 0 1 1 20 11.5z"></path></svg>'
LINK_ICON = '<svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true"><path d="M10 14a4 4 0 0 0 5.7 0l3-3a4 4 0 0 0-5.7-5.7l-1 1"></path><path d="M14 10a4 4 0 0 0-5.7 0l-3 3a4 4 0 0 0 5.7 5.7l1-1"></path></svg>'

SI = ("si", "sí", "yes", "true", "1")


AVISOS = []


def avisar(msg):
    """Problemas que no frenan la generación del sitio, pero que la
    revisión automática de GitHub marca como error (ver --revisar)."""
    if msg not in AVISOS:
        AVISOS.append(msg)
        print("AVISO: " + msg)


def _slugify(text):
    text = text.lower()
    for a, b in (("á", "a"), ("é", "e"), ("í", "i"), ("ó", "o"), ("ú", "u"), ("ü", "u"), ("ñ", "n")):
        text = text.replace(a, b)
    text = re.sub(r"[^a-z0-9]+", "-", text).strip("-")
    return text or "nota"


def parse_note(path):
    """Lee un archivo de redaccion/ y devuelve un diccionario con la nota."""
    with open(path, encoding="utf-8") as f:
        raw = f.read().replace("\r\n", "\n")
    if "\n---" in raw:
        head, body = raw.split("\n---", 1)
        body = body.split("\n", 1)[1] if "\n" in body else ""
    else:
        head, body = raw, ""
    meta = {}
    for line in head.split("\n"):
        if ":" in line and not line.strip().startswith("#"):
            key, value = line.split(":", 1)
            meta[_slugify(key.strip())] = value.strip()

    name = os.path.splitext(os.path.basename(path))[0]
    if not meta.get("titulo"):
        raise SystemExit("ERROR en redaccion/{}: falta la línea 'titulo:'".format(os.path.basename(path)))
    fecha = meta.get("fecha", "")
    if not re.match(r"^\d{4}-\d{2}-\d{2}$", fecha):
        raise SystemExit("ERROR en redaccion/{}: la fecha tiene que tener el formato AAAA-MM-DD (por ejemplo 2026-10-19)".format(os.path.basename(path)))
    return {
        "slug": _slugify(meta.get("slug") or re.sub(r"^\d{4}-\d{2}-\d{2}-?", "", name)),
        "titulo": meta["titulo"],
        "seccion": meta.get("seccion") or "Actualidad",
        "bajada": meta.get("bajada", ""),
        "autor": meta.get("autor") or NEWS_DEFAULT_AUTHOR,
        "fecha": fecha,
        "imagen": meta.get("imagen", ""),
        "epigrafe": meta.get("epigrafe", ""),
        "destacada": meta.get("destacada", "").lower() in SI,
        "publicar": meta.get("publicar", "si").lower() in SI,
        "cuerpo": body.strip(),
    }


def load_news():
    """Todas las notas publicables, de la más nueva a la más vieja."""
    if not os.path.isdir(NEWS_SOURCE_DIR):
        return []
    notes = []
    for fname in sorted(os.listdir(NEWS_SOURCE_DIR)):
        if fname.startswith("_") or not fname.endswith(".txt"):
            continue
        note = parse_note(os.path.join(NEWS_SOURCE_DIR, fname))
        if note["publicar"]:
            notes.append(note)
    notes.sort(key=lambda n: (n["fecha"], n["slug"]), reverse=True)
    seen = set()
    for n in notes:
        if n["slug"] in seen:
            raise SystemExit("ERROR: hay dos notas con la misma dirección '{}'. Cambiale el nombre a una de las dos.".format(n["slug"]))
        seen.add(n["slug"])
    return notes


def fecha_larga(iso):
    y, m, d = (int(x) for x in iso.split("-"))
    return "{} de {} de {}".format(d, MESES[m - 1], y)


def fecha_corta(iso):
    y, m, d = (int(x) for x in iso.split("-"))
    return "{} {} {}".format(d, MESES[m - 1][:3], y)


def _inline(text):
    """Escapa el texto y aplica **negrita**, *cursiva* y [texto](link)."""
    t = html.escape(text, quote=False)
    t = re.sub(r"\*\*(.+?)\*\*", r"<strong>\1</strong>", t)
    t = re.sub(r"(?<!\*)\*(?!\s)(.+?)(?<!\s)\*(?!\*)", r"<em>\1</em>", t)

    def link(m):
        href = m.group(2).replace('"', "%22")
        external = href.startswith("http")
        attrs = ' target="_blank" rel="noopener"' if external else ""
        return '<a href="{}"{}>{}</a>'.format(href, attrs, m.group(1))
    return re.sub(r"\[([^\]]+)\]\(([^)\s]+)\)", link, t)


def body_to_html(body):
    """Convierte el cuerpo de la nota: párrafos separados por una línea en
    blanco, '## ' para un intertítulo y '> ' para una cita destacada."""
    blocks = [b.strip() for b in re.split(r"\n\s*\n", body) if b.strip()]
    out = []
    for b in blocks:
        if b.startswith("## "):
            out.append("<h2>{}</h2>".format(_inline(b[3:].strip())))
        elif b.startswith(">"):
            text = " ".join(line.lstrip("> ").strip() for line in b.split("\n"))
            out.append("<blockquote>{}</blockquote>".format(_inline(text)))
        else:
            out.append("<p>{}</p>".format(_inline(" ".join(line.strip() for line in b.split("\n")))))
    return "\n        ".join(out)


def _img_src(note, depth):
    img = note["imagen"]
    if not img:
        return ""
    if img.startswith("http"):
        return img
    if not os.path.isfile(os.path.join(ROOT, "assets", "noticias", img)):
        avisar("la nota '{}' usa la imagen '{}', pero no está en assets/noticias/. "
               "Se muestra sin foto hasta que la subas.".format(note["slug"], img))
        return ""
    return "{}assets/noticias/{}".format(up(depth), img)


def news_url(note, depth):
    return "{}noticias/{}.html".format(up(depth), note["slug"])


def news_card_html(note, depth, lead=False):
    e = html.escape
    src = _img_src(note, depth)
    media = ('<span class="nc-media"><img src="{}" alt="" loading="lazy"></span>'.format(e(src))
             if src else '<span class="nc-media nc-media--empty" aria-hidden="true"><span>{}</span></span>'.format(e(note["seccion"])))
    bajada = '<span class="nc-bajada">{}</span>'.format(e(note["bajada"])) if note["bajada"] else ""
    return '''<a class="nc{lead}" href="{url}" data-seccion="{sec_key}">
          {media}
          <span class="nc-body">
            <span class="nc-meta"><span class="nc-sec">{sec}</span><span class="nc-date">{fecha}</span></span>
            <span class="nc-title">{titulo}</span>
            {bajada}
          </span>
        </a>'''.format(
        lead=" nc--lead" if lead else "",
        url=news_url(note, depth),
        sec_key=e(_slugify(note["seccion"])),
        media=media,
        sec=e(note["seccion"]),
        fecha=fecha_corta(note["fecha"]),
        titulo=e(note["titulo"]),
        bajada=bajada,
    )


def news_index_body(notes):
    if not notes:
        listing = '<p class="news-empty">Todavía no hay notas publicadas. Volvé pronto.</p>'
        filters = ""
    else:
        sections = []
        for n in notes:
            if n["seccion"] not in sections:
                sections.append(n["seccion"])
        filters = ""
        if len(sections) > 1:
            chips = ['<button type="button" class="news-chip is-active" data-filter="">Todas</button>']
            chips += ['<button type="button" class="news-chip" data-filter="{}">{}</button>'.format(
                html.escape(_slugify(sec)), html.escape(sec)) for sec in sections]
            filters = '<div class="news-filters" role="group" aria-label="Filtrar por sección">\n        {}\n      </div>'.format("\n        ".join(chips))
        lead = news_card_html(notes[0], 0, lead=True)
        rest = "\n        ".join(news_card_html(n, 0) for n in notes[1:])
        listing = '''<div class="news-list" id="news-list">
        {lead}
        {rest}
      </div>
      <p class="news-empty" id="news-empty" hidden>No hay notas en esta sección todavía.</p>'''.format(lead=lead, rest=rest)

    return '''  <section class="news-page">
    <div class="wrap">
      <div class="news-page-head">
        <span class="eyebrow">Redacción SUBE</span>
        <h1>Noticias</h1>
        <p>Actualidad, coberturas y notas desde La Plata.</p>
      </div>
      {filters}
      {listing}
    </div>
  </section>
'''.format(filters=filters, listing=listing)


def news_article_body(note, notes):
    e = html.escape
    src = _img_src(note, 1)
    figure = ""
    if src:
        caption = '<figcaption>{}</figcaption>'.format(e(note["epigrafe"])) if note["epigrafe"] else ""
        figure = '<figure class="article-figure"><img src="{}" alt="{}">{}</figure>'.format(
            e(src), e(note["epigrafe"] or note["titulo"]), caption)
    if note["cuerpo"]:
        body = body_to_html(note["cuerpo"])
    else:
        body = '<p class="article-pending">Esta nota está en redacción. Volvé pronto para leerla completa.</p>'
    bajada = '<p class="article-bajada">{}</p>'.format(e(note["bajada"])) if note["bajada"] else ""

    others = [n for n in notes if n["slug"] != note["slug"]]
    same = [n for n in others if n["seccion"] == note["seccion"]]
    more = (same + [n for n in others if n not in same])[:3]
    more_html = ""
    if more:
        more_html = '''<aside class="article-more">
        <h2>Seguí leyendo</h2>
        <div class="news-list news-list--more">
        {}
        </div>
      </aside>'''.format("\n        ".join(news_card_html(n, 1) for n in more))

    return '''  <article class="article">
    <div class="wrap">
      <a class="back-link" href="../noticias.html">{back}Volver a Noticias</a>
      <header class="article-head">
        <p class="article-meta"><span class="nc-sec">{sec}</span><time datetime="{iso}">{fecha}</time></p>
        <h1>{titulo}</h1>
        {bajada}
        <p class="article-byline">Por {autor}</p>
      </header>
      {figure}
      <div class="article-body">
        {body}
      </div>
      <div class="article-share" data-share>
        <span>Compartir</span>
        <a class="share-btn" data-share-to="whatsapp" href="#" target="_blank" rel="noopener">{wa}WhatsApp</a>
        <a class="share-btn" data-share-to="x" href="#" target="_blank" rel="noopener">{x}X</a>
        <button type="button" class="share-btn" data-share-to="copy">{link}<span>Copiar link</span></button>
      </div>
      {more}
    </div>
  </article>
'''.format(
        back=BACK_ICON,
        sec=e(note["seccion"]),
        iso=note["fecha"],
        fecha=fecha_larga(note["fecha"]),
        titulo=e(note["titulo"]),
        bajada=bajada,
        autor=e(note["autor"]),
        figure=figure,
        body=body,
        wa=WHATSAPP_ICON,
        x=X_ICON,
        link=LINK_ICON,
        more=more_html,
    )


def home_featured_news_html(notes):
    """Las 3 tarjetas de 'Noticias destacadas' de la home: primero las
    marcadas como destacadas, y si faltan se completan con las más nuevas."""
    picked = [n for n in notes if n["destacada"]][:3]
    picked += [n for n in notes if n not in picked][:3 - len(picked)]
    cards = []
    for n in picked:
        cards.append('''        <a class="news-card" href="{url}">
          <span class="news-tag">{sec}</span>
          <span class="news-title">{titulo}</span>
        </a>'''.format(url=news_url(n, 0), sec=html.escape(n["seccion"]), titulo=html.escape(n["titulo"])))
    return "\n".join(cards)


def write_news_articles(notes):
    out_dir = os.path.join(ROOT, "noticias")
    current = {n["slug"] + ".html" for n in notes}
    # Borra páginas de notas que ya no existen (o que se despublicaron)
    if os.path.isdir(out_dir):
        for fname in os.listdir(out_dir):
            if fname.endswith(".html") and fname not in current:
                os.remove(os.path.join(out_dir, fname))
                print("borrado:", "noticias/" + fname)
    for n in notes:
        desc = n["bajada"] or n["titulo"]
        write(
            "noticias/{}.html".format(n["slug"]),
            page_html(
                "{} · Noticias · SUBE".format(html.escape(n["titulo"])),
                html.escape(desc),
                news_article_body(n, notes),
                depth=1,
                active="noticias",
                extra_scripts=["news.js"],
            ),
        )


# ============================================================
# MI PASE (mi-pase.html): socios, comercios y equipo Sube
# ============================================================
# La página es un "esqueleto": las pantallas las arma assets/mi-pase.js
# y los datos los maneja assets/mi-pase-datos.js (hoy en modo
# demostración; después se conecta a Supabase).
AVISO_PRIVACIDAD = '''<h3>Aviso de privacidad de Mi pase</h3>
<p><em>Borrador para revisar por el equipo de Sube.</em></p>
<p><strong>Quién es responsable.</strong> Sube Canal (La Plata) es responsable de los datos que se usan en Mi pase. Podés escribirnos a <a href="mailto:laplatasube@gmail.com">laplatasube@gmail.com</a>.</p>
<p><strong>Qué datos usamos.</strong> Tu nombre y apellido, tu mail, el estado de tu aporte a la Comunidad de Pasajerxs y la fecha hasta la que está vigente. No guardamos datos de tarjetas ni de pagos: los pagos se hacen en Mercado Pago.</p>
<p><strong>Para qué.</strong> Para que puedas ingresar a tu cuenta, ver tu boleto y usar los beneficios de la comunidad.</p>
<p><strong>Comercios adheridos.</strong> Los comercios de la red pueden buscarte por nombre y apellido para confirmar si estás al día. Solo ven la respuesta (activx o no), nunca tu mail ni otros datos. Sube registra qué comercio hizo cada verificación y cuándo, para cuidar el buen uso de la herramienta y conocer cómo se usan los beneficios.</p>
<p><strong>Tus derechos.</strong> Podés pedir ver, corregir o borrar tus datos escribiéndonos al mail de arriba, según la Ley 25.326 de Protección de Datos Personales. La Agencia de Acceso a la Información Pública es el organismo de control de esta ley.</p>'''

MI_PASE_BODY = '''  <section class="pase-page">
    <div class="wrap">
      <div class="pase-head">
        <span class="eyebrow">Comunidad de Pasajerxs</span>
        <h1>Mi pase</h1>
        <p>Tu boleto para usar los beneficios de la comunidad, y la herramienta de verificación para los comercios adheridos.</p>
      </div>

      <div id="pase-app" class="pase-app" aria-live="polite">
        <noscript><p class="pase-error">Para usar Mi pase necesitás tener JavaScript activado en el navegador.</p></noscript>
      </div>

      <template id="aviso-privacidad-texto">{aviso}</template>

      <details class="pase-privacy-footer" id="privacidad">
        <summary>Aviso de privacidad</summary>
        <div class="pase-privacidad-body">{aviso}</div>
      </details>
    </div>
  </section>
'''.format(aviso=AVISO_PRIVACIDAD)


TIENDA_BODY = '''  <section class="soon">
    <div class="wrap">
      <div class="section-head">
        <h2>Tienda</h2>
        <p>Muy pronto vas a poder comprar acá con nuestra tienda online.</p>
      </div>
    </div>
  </section>
'''

CONTACTO_BODY = '''  <section class="soon">
    <div class="wrap">
      <div class="section-head">
        <h2>Contacto</h2>
        <p>Esta sección la vamos a ir completando. Mientras tanto, escribinos directamente:</p>
      </div>
      <a class="btn btn-primary" href="mailto:laplatasube@gmail.com">Escribirnos por mail</a>
    </div>
  </section>
'''


# ============================================================
# PÁGINAS DE PROGRAMA (programas/*.html)
# ============================================================
# Cada persona es (nombre, handle_o_None)
PROGRAMS = [
    {
        "slug": "streaming-copa",
        "name": "Streaming Copa",
        "video_id": "V1ggB4EdYsg",
        "list_id": "PLYT7ujTIBmWb0QoWKs0vVNdaJGhMFRCdU",
        "schedule": "Lunes · 18:00 · Todas las semanas",
        "subtitle": "El programa del Torneo Copa del Rey",
        "instagram": "streamingcopa",
        "hosts": [("Mati Cañas", "matiascanasm"), ("Chipi Ardaiz", "chipiarda")],
        "columnists": [],
        "production": [],
    },
    {
        "slug": "marcando-la-cancha",
        "name": "Marcando la cancha",
        "video_id": "4S4S8tfHEok",
        "list_id": "PLYT7ujTIBmWYogyJY-uOZ4T5qc6VLCZzS",
        "schedule": "Lunes · 19:30 · Todas las semanas",
        "subtitle": None,
        "instagram": "marcandolacancha.sube",
        "hosts": [
            ("Agustina Coto", "aguscoto_"),
            ("Joaquín De Martino", "joacodemartino"),
            ("Santino Meli", "tinomeli_"),
        ],
        "columnists": [
            ("Eze", None),
            ("El perlas", None),
            ("Rulo", None),
            ("Juani Perone", "juaape_"),
        ],
        "production": [("Cami Del Canto", "camidelcant0")],
    },
    {
        "slug": "falopa-informativa-nacional",
        "name": "FIN! F@lopa informativa nacional",
        "video_id": "Vrjjcu1UXfA",
        "list_id": "PLYT7ujTIBmWbzBCsllEBDI-sC8iTx60qC",
        "schedule": "Lunes · 21:00 · Todas las semanas",
        "subtitle": None,
        "instagram": None,
        "hosts": [
            ("Albertina Bidart", "albertinabidart"),
            ("Fran Panella", "franpanella4"),
            ("Federico Machado", "fede_machado_b"),
        ],
        "columnists": [],
        "production": [("Juanma García", "juanmgvieira"), ("Pau Zoppolo", "paulazoppolo")],
    },
    {
        "slug": "el-amplificador",
        "name": "El Amplificador – 10ma temporada",
        "video_id": "ECgFfdi90q8",
        "list_id": "PLYT7ujTIBmWbDt100agv2nniNoCyQI_E4",
        "schedule": "Jueves · 18:00 · Todas las semanas",
        "subtitle": None,
        "instagram": "elamplificador",
        "hosts": [("Belén Raggio", "beraggio"), ("Diego Cisternas", "diecisternas")],
        "columnists": [],
        "production": [],
    },
    {
        "slug": "estacion-freak",
        "name": "Estación Freak",
        "video_id": "cITbAH_vBrI",
        "list_id": "PLYT7ujTIBmWZWm37-X_-CzKtCt5fgRIE1",
        "schedule": "Jueves · 19:30 · Cada dos semanas, alterna con ¿De qué viven?",
        "subtitle": None,
        "instagram": "estacion.freak",
        "hosts": [
            ("Majo Guano", "majoguano"),
            ("Sol Gimenez", "solencolores"),
            ("Ari Vargas", "vargasari__"),
        ],
        "columnists": [("Fidel Entraigas", "fidelentraigas"), ("Juani Perone", "juaape_")],
        "production": [("Majo Guano", "majoguano"), ("Mora Gutierrez", "mora.gutierrez")],
    },
    {
        "slug": "de-que-viven",
        "name": "¿De qué viven?",
        "video_id": "xOVJ7J8DEbE",
        "list_id": "PLYT7ujTIBmWYiJVF9dSRf6__ckwOeMf_E",
        "schedule": "Jueves · 20:00 · Cada dos semanas, alterna con Estación Freak",
        "subtitle": "Un programa de gestión cultural y coso..",
        "instagram": "dqv.sube",
        "hosts": [
            ("Agus Fornari Soto", "agussandia"),
            ("Eze Varano", "ezequiel.varano"),
            ("Kiki Victoria", "kikivictoriv"),
        ],
        "columnists": [],
        "production": [("Milagros Lucero", "luceritosinvela_"), ("Nahuel Fabián Maciel", "na.ue_")],
    },
    {
        "slug": "chicha-y-limonada",
        "name": "Chicha y limonada",
        "video_id": "vWfgmM3EDBg",
        "list_id": "PLYT7ujTIBmWbEmAmjwWQMRK0TahbqHlv2",
        "schedule": "Jueves · 21:30 · Todas las semanas",
        "subtitle": None,
        "instagram": "chichaylimonada.sube",
        "hosts": [
            ("Iña Asenjo", "inakiasag"),
            ("Mai Schneider", "mai.schnaider"),
            ("Paloma Cecilia", "palipax"),
        ],
        "columnists": [("Azu", None), ("Majo Guano", "majoguano"), ("Juan Velis", "juan_velis")],
        "production": [("Male Escaray", "malenaescaray"), ("Nani Sanchez", "nanisan___")],
    },
    {
        "slug": "umbrales",
        "name": "Umbrales",
        "video_id": "192gtJRG9KI",
        "list_id": "PLSOqo_jyCCX8",
        "schedule": "On demand",
        "subtitle": None,
        "instagram": None,
        "hosts": [("Euge Gallo", "eugegallo._"), ("Juan Velis", "juan_velis")],
        "columnists": [],
        "production": [("Nani Sanchez", "nanisan___")],
    },
]


def ig_url(handle):
    return "https://www.instagram.com/" + handle.lstrip("@") + "/"


def person_html(name, handle):
    if handle:
        return '<li><a href="{url}" target="_blank" rel="noopener">{icon}<span>{name}</span></a></li>'.format(
            url=ig_url(handle), icon=IG_ICON, name=name
        )
    return '<li><span class="person-plain">{name}</span></li>'.format(name=name)


def people_list_html(people):
    return '<ul class="people-list">' + "".join(person_html(n, h) for n, h in people) + "</ul>"


PENDING_HOSTS_NOTE = (
    '<p class="pending-note">⚠️ Todavía no tenemos cargado quién conduce y quién '
    "produce este programa. Pasame los nombres (y roles) y los agrego acá.</p>"
)
PENDING_IG_NOTE = (
    '<p class="pending-note">⚠️ Todavía no tenemos las redes sociales propias de '
    "este programa. Si tiene Instagram/otras redes, pasámelas y las agrego acá.</p>"
)


def info_grid_html(p):
    if not p["hosts"]:
        return (
            '<div class="program-info-grid">'
            '<div class="program-info-card"><h2>Quiénes lo hacen</h2>{pending_hosts}</div>'
            '<div class="program-info-card"><h2>Redes del programa</h2>{pending_ig}</div>'
            "</div>"
        ).format(pending_hosts=PENDING_HOSTS_NOTE, pending_ig=PENDING_IG_NOTE)

    cards = ['<div class="program-info-card"><h2>Conducen</h2>{list}</div>'.format(list=people_list_html(p["hosts"]))]
    if p["columnists"]:
        cards.append(
            '<div class="program-info-card"><h2>Columnistas</h2>{list}</div>'.format(
                list=people_list_html(p["columnists"])
            )
        )
    if p["production"]:
        cards.append(
            '<div class="program-info-card"><h2>Producción</h2>{list}</div>'.format(
                list=people_list_html(p["production"])
            )
        )
    return '<div class="program-info-grid">' + "".join(cards) + "</div>"


def subtitle_html(p):
    if p["subtitle"]:
        return '<p class="program-subtitle">{}</p>'.format(p["subtitle"])
    return (
        '<p class="program-subtitle program-subtitle--pending">'
        "⚠️ Falta el subtítulo (“Un programa sobre…”) — pasámelo y lo cargo.</p>"
    )


def ig_chip_html(p):
    if p["instagram"]:
        return '<a class="program-ig-chip" href="{url}" target="_blank" rel="noopener">{icon}<span>@{handle}</span></a>'.format(
            url=ig_url(p["instagram"]), icon=IG_ICON, handle=p["instagram"]
        )
    return '<span class="program-ig-chip program-ig-chip--pending">Sin Instagram propio todavía</span>'


def program_body(p):
    return '''  <section class="program-hero">
    <div class="wrap">
      <a class="back-link" href="../contenidos.html">{back}Volver a Contenidos</a>
      <p class="eyebrow">Programa</p>
      <h1>{name}</h1>
      {subtitle}
      <div class="program-meta">
        <span class="program-schedule">{schedule}</span>
        {ig_chip}
      </div>
    </div>
  </section>

  <section class="program-body">
    <div class="wrap">
      <div class="video-embed">
        <iframe
          src="https://www.youtube.com/embed/{video_id}?list={list_id}"
          title="{name} — SUBE"
          loading="lazy"
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
          allowfullscreen>
        </iframe>
      </div>

      {info_grid}
    </div>
  </section>
'''.format(
        back=BACK_ICON,
        name=p["name"],
        subtitle=subtitle_html(p),
        schedule=p["schedule"],
        ig_chip=ig_chip_html(p),
        video_id=p["video_id"],
        list_id=p["list_id"],
        info_grid=info_grid_html(p),
    )


# ============================================================
# ESCRITURA DE ARCHIVOS
# ============================================================
if __name__ == "__main__":
    NEWS = load_news()
    HOME_BODY = HOME_BODY_TEMPLATE.format(
        list_id=LIVE_PLAYLIST_ID,
        featured_news=home_featured_news_html(NEWS),
    )

    write(
        "index.html",
        page_html(
            "SUBE :: Un viaje colectivo por La Plata",
            "SUBE es un medio de comunicación autogestivo con identidad platense. Conocé los beneficios de la Comunidad de Pasajerxs y sumate como socix.",
            HOME_BODY,
            depth=0,
            active=None,
            extra_scripts=["schedule.js", "next-stop.js"],
        ),
    )
    write(
        "comunidad.html",
        page_html(
            "Comunidad · SUBE",
            "La Comunidad de Pasajerxs de SUBE: beneficios en comercios amigos y cómo sumarte con tu aporte.",
            COMUNIDAD_BODY,
            depth=0,
            active="comunidad",
            extra_scripts=["logo-autoload.js", "geo.js", "benefits.js", "carousel.js"],
        ),
    )
    write(
        "contenidos.html",
        page_html(
            "Contenidos · SUBE",
            "Programación y noticias de SUBE.",
            CONTENIDOS_BODY,
            depth=0,
            active="contenidos",
            extra_scripts=["schedule.js", "schedule-grid.js"],
        ),
    )
    write(
        "noticias.html",
        page_html(
            "Noticias · SUBE",
            "Noticias de actualidad, coberturas y notas de la redacción de SUBE, desde La Plata.",
            news_index_body(NEWS),
            depth=0,
            active="noticias",
            extra_scripts=["news.js"],
        ),
    )
    write_news_articles(NEWS)
    write(
        "mi-pase.html",
        page_html(
            "Mi pase · SUBE",
            "Mi pase: el boleto de la Comunidad de Pasajerxs de SUBE y la verificación de socios para comercios adheridos.",
            MI_PASE_BODY,
            depth=0,
            active="mipase",
            extra_scripts=["mi-pase-datos.js", "mi-pase.js"],
        ),
    )
    write(
        "tienda.html",
        page_html(
            "Tienda · SUBE",
            "Tienda de SUBE. Próximamente.",
            TIENDA_BODY,
            depth=0,
            active="tienda",
        ),
    )
    write(
        "contacto.html",
        page_html(
            "Contacto · SUBE",
            "Contactate con SUBE.",
            CONTACTO_BODY,
            depth=0,
            active="contacto",
        ),
    )

    for p in PROGRAMS:
        write(
            "programas/{}.html".format(p["slug"]),
            page_html(
                "{} · SUBE".format(p["name"]),
                "{} — programa de SUBE. Playlist, quiénes lo hacen y redes.".format(p["name"]),
                program_body(p),
                depth=1,
                active="contenidos",
            ),
        )

    # Modo revisión (lo usa GitHub en .github/workflows/revisar-sitio.yml):
    # cualquier aviso cuenta como error para que se vea la cruz roja.
    if "--revisar" in sys.argv and AVISOS:
        for msg in AVISOS:
            print("::error::" + msg)
        sys.exit(1)
