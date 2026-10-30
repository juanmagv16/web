#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
Genera TODO el sitio de Sube Canal a partir de plantillas compartidas
(header, footer, nav) para que cada página quede consistente.

Correr con: python3 build_site.py
Vuelve a escribir: index.html, comunidad.html, contenidos.html,
noticias.html, tienda.html, contacto.html, y todos los archivos
dentro de programas/.

Para agregar/editar el contenido de un programa, buscar el diccionario
PROGRAMS más abajo.
"""
import os
import html
import re

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
TICKET_ICON = '<svg viewBox="0 0 24 24" width="26" height="26" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true"><path d="M3 8a2 2 0 0 0 2-2h14a2 2 0 0 0 2 2v2a2 2 0 0 0 0 4v2a2 2 0 0 0-2 2H5a2 2 0 0 0-2-2v-2a2 2 0 0 0 0-4z"></path><path d="M9 6v12" stroke-dasharray="2 2"></path></svg>'
BACK_ICON = '<svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true"><path d="M15 18l-6-6 6-6"></path></svg>'
BURGER_ICON = '''<svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true">
        <g class="line-open"><path d="M4 6h16M4 12h16M4 18h16"></path></g>
        <g class="line-close"><path d="M5 5l14 14M19 5L5 19"></path></g>
      </svg>'''

NAV_ITEMS = [
    ("comunidad", "Comunidad", "comunidad.html"),
    ("contenidos", "Contenidos", "contenidos.html"),
    ("tienda", "Tienda", "tienda.html"),
    ("contacto", "Contacto", "contacto.html"),
]

# Secciones ocultas al público por ahora. Para volver a mostrar una,
# sacala de esta lista y regenerá el sitio (python3 build_site.py):
# vuelven su link en el menú, sus accesos y su página completa.
# Mientras está oculta, su página redirige a la Home y no aparece en Google.
SECCIONES_OCULTAS = {"noticias", "tienda"}


def visible(seccion):
    return seccion not in SECCIONES_OCULTAS


def up(depth):
    """Prefijo relativo según la profundidad de la página (0 = raíz)."""
    return "../" * depth


def nav_links_html(depth, active):
    links = []
    for key, label, href in NAV_ITEMS:
        if not visible(key):
            continue
        cls = ' class="is-current"' if key == active else ""
        links.append('<a href="{u}{href}"{cls}>{label}</a>'.format(u=up(depth), href=href, cls=cls, label=label))
    return "\n      ".join(links)


def header_html(depth, active):
    return '''<header class="site-header">
  <div class="wrap">
    <div class="header-weather" id="header-weather" aria-live="polite" hidden></div>
    <a href="{u}index.html" class="brand"><img src="{u}assets/logo.png" alt="Sube Canal" width="269" height="104"></a>
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
      <picture>
        <source srcset="{u}assets/colectivo.webp" type="image/webp">
        <img class="footer-bus" src="{u}assets/colectivo.png" alt="Sube Canal — un viaje colectivo" width="919" height="288" loading="lazy" decoding="async">
      </picture>
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
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link rel="preload" href="{u}assets/fonts/Anton-Regular.woff2" as="font" type="font/woff2" crossorigin>
<link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Roboto:wght@400;500;700&display=swap">
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

HOME_BODY = '''{franja_programas}  <section class="hero">
    <div class="wrap">
      <div>
        <h1>Subite a este<br><span class="accent">viaje colectivo</span></h1>
        <div class="hero-sub">
          <p>Somos un canal platense hecho a pulmón. Creamos contenidos, generamos encuentros y construimos comunidad alrededor de la cultura local.</p>
          <p>La Comunidad de Pasajerxs sostiene SUBE todos los meses. Sumándote, vos también sos parte y accedés a beneficios en una red de espacios amigos.</p>
        </div>
        <div class="hero-actions">
          <a href="comunidad.html#asociate" class="btn btn-primary">Quiero ser pasajerx</a>
          <a href="comunidad.html#beneficios" class="btn btn-ghost">Ver beneficios</a>
        </div>
      </div>

      <div class="hero-player">
        <p class="hero-player-label">Último programa</p>
        <div class="video-embed">
          <iframe
            src="https://www.youtube.com/embed/videoseries?list={list_id}"
            title="SUBE — último programa"
            loading="lazy"
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
            allowfullscreen>
          </iframe>
        </div>

        <div class="next-stop" id="next-stop" aria-live="polite" data-perfiles="{perfiles}" hidden></div>
      </div>
    </div>
  </section>

{noticias_destacadas}  <section class="sponsors">
    <div class="wrap">
      <div class="sponsor-slots">
        <a class="sponsor-slot sponsor-slot--banner" href="contacto.html">
          <span class="sponsor-slot-label">Banner horizontal</span>
        </a>

        <div class="sponsor-slot-row">
          <a class="sponsor-slot sponsor-slot--square" href="contacto.html">
            <span class="sponsor-slot-label">Cuadrado</span>
          </a>
          <a class="sponsor-slot sponsor-slot--square" href="contacto.html">
            <span class="sponsor-slot-label">Cuadrado</span>
          </a>
          <a class="sponsor-slot sponsor-slot--square" href="contacto.html">
            <span class="sponsor-slot-label">Cuadrado</span>
          </a>
        </div>
      </div>
    </div>
  </section>
'''

# "Noticias destacadas" de la Home: se muestra solo si la sección Noticias
# está visible (ver SECCIONES_OCULTAS).
NOTICIAS_DESTACADAS = '''  <section class="featured-news">
    <div class="wrap">
      <div class="section-head">
        <h2>Noticias destacadas</h2>
      </div>
      <div class="news-grid">
        <a class="news-card" href="noticias.html">
          <span class="news-tag">Noticia destacada</span>
          <span class="news-title">¿Dónde está Adorni?</span>
        </a>
        <a class="news-card" href="noticias.html">
          <span class="news-tag">Noticia destacada</span>
          <span class="news-title">El campeón de la liga amateur platense</span>
        </a>
        <a class="news-card" href="noticias.html">
          <span class="news-tag">Noticia destacada</span>
          <span class="news-title">¿Dónde se chicha el finde?</span>
        </a>
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


# Geolocalización de comercios ("Ver qué tan cerca están"): apagada por
# ahora. Para volver a activarla, poné True. Los datos de ubicación de cada
# comercio y assets/geo.js siguen intactos.
GEOLOCALIZACION_ACTIVA = False
BOTON_UBICACION = '''      <button class="btn btn-ghost btn-location" id="activate-location" type="button">{pin} Ver qué tan cerca están</button>
'''


def comercios_planilla():
    """Copia de la planilla de comercios (datos/comercios.json). Se usa para
    que la página ya salga con los datos y logos correctos; después
    assets/benefits.js la actualiza en vivo desde la planilla."""
    import json
    ruta = os.path.join(ROOT, "datos", "comercios.json")
    if not os.path.exists(ruta):
        return None
    with open(ruta, encoding="utf-8") as fh:
        return json.load(fh).get("comercios") or None


def benefit_card_from_sheet(c):
    e = html.escape
    nombre = c["nombre"]
    logo_path = "assets/socios/planilla/{}.webp".format(c["slug"])
    if os.path.exists(os.path.join(ROOT, logo_path)):
        logo = '<div class="benefit-logo"><img src="{}" alt="{}" width="68" height="68" loading="lazy" decoding="async"></div>'.format(e(logo_path), e(nombre))
    else:
        logo = '<div class="benefit-logo mono" data-slug="{}" data-name="{}">{}</div>'.format(
            e(c.get("instagram") or c["slug"]), e(nombre), e(nombre[:1].upper()))
    perks = "".join("<li>{}</li>".format(e(b)) for b in c.get("beneficios", []))
    ig = c.get("instagram")
    foot = ('<a class="benefit-ig" href="https://www.instagram.com/{0}/" target="_blank" rel="noopener">{1}<span>@{0}</span></a>'.format(e(ig), IG_ICON)
            if ig else "")
    loc = ' data-location="{}"'.format(e(c["ubicacion"])) if c.get("ubicacion") else ""
    return """        <article class="benefit-card"{loc}>
          <div class="benefit-top">
            {logo}
            <div>
              <div class="benefit-name">{nombre}</div>
              <div class="benefit-cat">{rubro}</div>
            </div>
          </div>
          <ul class="benefit-perks">
            {perks}
          </ul>
          <div class="benefit-foot">
            {foot}
          </div>
        </article>""".format(loc=loc, logo=logo, nombre=e(nombre), rubro=e(c.get("rubro", "")), perks=perks, foot=foot)


def benefit_cards_html():
    comercios = comercios_planilla()
    if comercios:
        return "\n\n".join(benefit_card_from_sheet(c) for c in comercios if c.get("tipo") != "auspiciante")
    return "\n\n".join(benefit_card_html(*c) for c in BENEFIT_CARDS)


COMUNIDAD_BODY = '''  <section class="benefits" id="beneficios">
    <div class="wrap">
      <div class="section-head">
        <h2>Beneficios para nuestra comunidad</h2>
        <p>Espacios amigos que suman descuentos exclusivos para quienes sostienen a SUBE. Mostrá tu carnet de pasajerx y viajá con beneficios.</p>
      </div>

      <div class="carousel">
        <button class="carousel-arrow carousel-arrow--prev" type="button" aria-label="Ver beneficios anteriores">{arrow_left}</button>

        <div class="benefit-grid" id="benefit-grid" data-fallback="true">

{cards}

        </div>

        <button class="carousel-arrow carousel-arrow--next" type="button" aria-label="Ver más beneficios">{arrow_right}</button>
      </div>

{{boton_ubicacion}}
      <p class="benefits-note">Los descuentos y condiciones de cada beneficio son definidos por cada espacio adherido y pueden cambiar sin aviso previo.</p>

      <div class="raffle-card">
        <span class="raffle-icon" aria-hidden="true">{ticket}</span>
        <div class="raffle-text">
          <p class="raffle-eyebrow">Todos los meses</p>
          <h3>Sorteos mensuales</h3>
          <p>En SUBE Canal hacemos sorteos todos los meses.</p>
        </div>
        <a class="btn btn-ghost raffle-btn" href="https://www.instagram.com/subecanal" target="_blank" rel="noopener">{ig} Seguinos en Instagram</a>
      </div>

      <a class="partner-cta" href="mailto:laplatasube@gmail.com?subject=Quiero%20sumar%20mi%20comercio%20a%20SUBE">
        <span class="partner-cta-title">¿Tenés un comercio o espacio en La Plata?</span>
        <span class="partner-cta-desc">Si querés formar parte de esta red, contactate con nosotros y nuestro equipo comercial te estará respondiendo.</span>
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
    cards=benefit_cards_html(),
    chevron=CHEVRON_ICON,
    arrow_left=ARROW_LEFT_ICON,
    arrow_right=ARROW_RIGHT_ICON,
    pin=PIN_ICON,
    ig=IG_ICON_16,
    ticket=TICKET_ICON,
)

# ============================================================
# CONTENIDOS — Programación inline + Noticias como antes (card)
# ============================================================
# Grilla de respaldo (la de siempre), por si falta la copia de la planilla.
GRILLA_RESPALDO = '''      <div class="content-schedule" id="content-schedule">

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

'''

# Bloque "Noticias" de Contenidos: se muestra solo si Noticias está visible.
BLOQUE_NOTICIAS = '''      <div class="content-subhead content-subhead--noticias">
        <span class="content-subhead-eyebrow">Próximamente</span>
        <h3>Noticias</h3>
      </div>

      <a class="hub-card" href="noticias.html">
        <span class="hub-card-title">Coberturas, notas y actualidad</span>
        <span class="hub-card-desc">Estamos preparando esta sección — todavía no tiene contenido cargado.</span>
        <span class="hub-card-arrow">→</span>
      </a>

    </div>
  </section>
'''

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

{grilla}
{bloque_noticias}'''

NOTICIAS_BODY = '''  <section class="soon">
    <div class="wrap">
      <a class="back-link" href="contenidos.html">{back}Volver a Contenidos</a>
      <div class="section-head">
        <h2>Noticias</h2>
        <p>Estamos preparando esta sección. Muy pronto vas a poder leer acá coberturas, notas y actualidad hecha por SUBE.</p>
      </div>
    </div>
  </section>
'''.format(back=BACK_ICON)

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


# ------------------------------------------------------------
# Programación desde la copia de la planilla (datos/programacion.csv).
# Sirve para que Contenidos ya salga con descripciones y logos; después
# assets/schedule-grid.js la actualiza en vivo desde la planilla.
# ------------------------------------------------------------
DIAS_SEMANA = ["lunes", "martes", "miercoles", "jueves", "viernes", "sabado", "domingo"]
DIA_LABEL_ES = {"lunes": "Lunes", "martes": "Martes", "miercoles": "Miércoles", "jueves": "Jueves",
                "viernes": "Viernes", "sabado": "Sábado", "domingo": "Domingo"}


def _slugify(text):
    import unicodedata
    t = unicodedata.normalize("NFD", str(text or ""))
    t = "".join(c for c in t if unicodedata.category(c) != "Mn").lower()
    return re.sub(r"[^a-z0-9]+", "-", t).strip("-")


def _handle(url):
    m = re.search(r"instagram\.com/([^/?#\s]+)", str(url or ""), re.I)
    v = (m.group(1) if m else str(url or "")).lstrip("@").strip().strip("/")
    return v if re.fullmatch(r"[A-Za-z0-9._]{1,30}", v or "") else None


def _video(url):
    """(id del video, id de la lista) a partir del link de la planilla."""
    u = str(url or "")
    v = re.search(r"(?:[?&]v=|youtu\.be/|/embed/|/shorts/|/live/)([A-Za-z0-9_-]{11})", u)
    l = re.search(r"[?&]list=([A-Za-z0-9_-]+)", u)
    return (v.group(1) if v else ""), (l.group(1) if l else "")


def _horario(fila):
    dia = _slugify(fila.get("dia_semana", ""))
    if dia in DIA_LABEL_ES and fila.get("hora"):
        frec = {"7": "Todas las semanas", "14": "Cada dos semanas"}.get(fila.get("frecuencia_dias", ""), fila.get("frecuencia", "").capitalize())
        return " · ".join(x for x in (DIA_LABEL_ES[dia], fila["hora"][:5], frec) if x)
    return "On demand" if _slugify(fila.get("frecuencia", "")) == "on-demand" else ""


def conductores(fila):
    return [fila[k] for k in ("conductor_b1", "conductor_b2", "conductor_b3") if fila.get(k)]


def es_programa(fila):
    """Una fila de la planilla tiene perfil propio si es un programa con
    horario o con quien lo conduce. Lo demás (por ejemplo, «Especiales»)
    es una playlist y lleva directo a YouTube."""
    return bool(_horario(fila) and _horario(fila) != "On demand") or bool(conductores(fila))


def programa_desde_fila(f):
    video_id, list_id = _video(f.get("playlist"))
    gente = lambda claves: [(f[n], _handle(f.get(i))) for n, i in claves if f.get(n)]
    logo = "assets/programas/{}.webp".format(f["slug"])
    return {
        "slug": f["slug"],
        "name": f["nombre"],
        "video_id": video_id,
        "list_id": list_id,
        "schedule": _horario(f),
        "subtitle": f.get("descripcion", ""),
        "instagram": _handle(f.get("instagram_a1")),
        "hosts": gente([("conductor_b1", "instagram_b1"), ("conductor_b2", "instagram_b2"), ("conductor_b3", "instagram_b3")]),
        "production": gente([("produccion_c1", "instagram_c1"), ("produccion_c2", "instagram_c2")]),
        "columnists": [(f[k], None) for k in ("columnista_d1", "columnista_d2", "columnista_d3", "columnista_d4") if f.get(k)],
        "logo": logo if f.get("logo") and os.path.exists(os.path.join(ROOT, logo)) else "",
    }


def programas_perfiles():
    """Programas con perfil: salen de la planilla de programación. Si no hay
    copia de la planilla, se usa la lista fija PROGRAMS."""
    filas = programacion_planilla()
    if filas:
        return [programa_desde_fila(f) for f in filas if es_programa(f)]
    return [dict(p, logo="") for p in PROGRAMS]


def perfiles():
    """Perfiles de programa que existen en Contenidos: slug → nombre."""
    return {p["slug"]: p["name"] for p in programas_perfiles()}


def perfiles_json():
    import json
    return html.escape(json.dumps(perfiles(), ensure_ascii=False))


def programacion_planilla():
    import csv
    ruta = os.path.join(ROOT, "datos", "programacion.csv")
    if not os.path.exists(ruta):
        return []
    with open(ruta, encoding="utf-8") as fh:
        filas = [f for f in csv.reader(fh) if any(c.strip() for c in f)]
    if len(filas) < 2:
        return []
    titulos = [_slugify(t).replace("-", "_") for t in filas[0]]
    out = []
    for f in filas[1:]:
        d = {t: (f[k].strip() if k < len(f) else "") for k, t in enumerate(titulos)}
        d["nombre"] = d.get("nombre") or d.get("programa", "")
        if d["nombre"] and d.get("activo", "si").lower() in ("si", "sí"):
            d["slug"] = _slugify(d["nombre"])
            out.append(d)
    return out


def nombre_programa(fila):
    return perfiles().get(fila["slug"], fila["nombre"])


def link_programa(fila):
    e = html.escape
    if fila["slug"] in perfiles():
        return '<a href="programas/{}.html">{}</a>'.format(fila["slug"], e(nombre_programa(fila)))
    return "<span>{}</span>".format(e(fila["nombre"]))


def conduce_html(fila):
    nombres = conductores(fila)
    if not nombres:
        return ""
    texto = nombres[0] if len(nombres) == 1 else ", ".join(nombres[:-1]) + " y " + nombres[-1]
    return '<p class="schedule-conduce">Conduce: {}</p>'.format(html.escape(texto))


def info_programa_html(fila):
    e = html.escape
    desc = fila.get("descripcion", "")
    logo = "assets/programas/{}.webp".format(fila["slug"])
    tiene_logo = bool(fila.get("logo")) and os.path.exists(os.path.join(ROOT, logo))
    if not desc and not tiene_logo:
        return ""
    img = ('<img class="schedule-logo" src="{}" alt="{}" loading="lazy" decoding="async">'.format(logo, e("Logo de " + nombre_programa(fila)))
           if tiene_logo else "")
    return '<div class="schedule-info">{}{}</div>'.format(img, '<p class="schedule-desc">{}</p>'.format(e(desc)) if desc else "")


def grilla_contenidos_html():
    filas = programacion_planilla()
    if not filas:
        return GRILLA_RESPALDO.replace('id="content-schedule"', 'id="content-schedule" data-perfiles="{}"'.format(perfiles_json()))
    e = html.escape
    por_dia = {}
    for f in filas:
        dia = _slugify(f.get("dia_semana", ""))
        if dia in DIAS_SEMANA and re.match(r"^\d{1,2}:\d{2}", f.get("hora", "")):
            por_dia.setdefault(dia, []).append(f)
    bloques = []
    for dia in DIAS_SEMANA:
        if dia not in por_dia:
            continue
        lista = sorted(por_dia[dia], key=lambda f: [int(x) for x in f["hora"].split(":")[:2]])
        items = []
        for f in lista:
            alt = ""
            if f.get("frecuencia_dias") == "14":
                pareja = [o for o in lista if o is not f and o.get("frecuencia_dias") == "14"]
                alt = '\n              <span class="schedule-alt">Cada dos semanas{}</span>'.format(
                    ", alterna con " + e(nombre_programa(pareja[0])) if len(pareja) == 1 else "")
            info = info_programa_html(f)
            conduce = conduce_html(f)
            items.append("""            <li>
              <span class="schedule-time">{hora}</span>
              {link}{conduce}{alt}{info}
            </li>""".format(hora=e(f["hora"][:5]), link=link_programa(f), alt=alt,
                            conduce=("\n              " + conduce) if conduce else "",
                            info=("\n              " + info) if info else ""))
        bloques.append("""        <div class="schedule-day">
          <h3>{}</h3>
          <ul class="schedule-list">
{}
          </ul>
        </div>""".format(DIA_LABEL_ES[dia], "\n".join(items)))
    ondemand = []
    hay_especiales = False
    for f in filas:
        if _slugify(f.get("frecuencia", "")) != "on-demand":
            continue
        desc = f.get("descripcion", "")
        if f["slug"] in perfiles():
            href, extra, tag = "programas/{}.html".format(f["slug"]), "", "Programa"
        else:
            video_id, list_id = _video(f.get("playlist"))
            if not (video_id or list_id):
                continue  # sin link no se puede mostrar
            href = f["playlist"]
            extra, tag = ' target="_blank" rel="noopener"', "Playlist"
        hay_especiales = hay_especiales or f["slug"] == "especiales"
        ondemand.append("""            <li>
              <a href="{href}"{extra}>
                <span class="ondemand-main">
                  <span class="ondemand-name">{nombre}</span>{desc}
                </span>
                <span class="ondemand-tag">{tag}</span>
              </a>
            </li>""".format(href=e(href), extra=extra, tag=tag, nombre=e(f["nombre"]),
                            desc='\n                  <span class="ondemand-desc">{}</span>'.format(e(desc)) if desc else ""))
    if not hay_especiales:
        # Mientras «Especiales» no esté cargado como fila en la planilla
        ondemand.append("""            <li>
              <a href="https://www.youtube.com/watch?v=2E0gkC1fRDY&list=PLYT7ujTIBmWbglZ7Mmi-r4RnP1NqsDMt6" target="_blank" rel="noopener">
                <span class="ondemand-main">
                  <span class="ondemand-name">Especiales</span>
                  <span class="ondemand-desc">Navegá en todos nuestros especiales</span>
                </span>
                <span class="ondemand-tag">Playlist</span>
              </a>
            </li>""")
    return """      <div class="content-schedule" id="content-schedule" data-origen="planilla" data-perfiles="{perfiles}">

{dias}

        <div class="schedule-day" id="schedule-ondemand-block">
          <h3>On demand</h3>
          <ul class="ondemand-list">
{od}
          </ul>
        </div>

      </div>
""".format(perfiles=perfiles_json(), dias="\n\n".join(bloques), od="\n".join(ondemand))


# Franja con los logos de los programas entre el header y la portada.
# Está lista pero apagada hasta que se apruebe y estén todos los logos en la
# planilla. Para mostrarla, poné True y regenerá el sitio.
FRANJA_PROGRAMAS_ACTIVA = False


def franja_programas_html():
    if not FRANJA_PROGRAMAS_ACTIVA:
        return ""
    e = html.escape
    items = []
    for p in programas_perfiles():
        if p.get("logo"):
            icono = '<img src="{}" alt="" loading="lazy" decoding="async">'.format(p["logo"])
        else:
            icono = '<span class="program-strip-initial">{}</span>'.format(e(p["name"][:1].upper()))
        items.append('<a class="program-strip-item" href="programas/{}.html" title="{}">{}<span class="sr-only">{}</span></a>'.format(
            p["slug"], e(p["name"]), icono, e(p["name"])))
    return """  <nav class="program-strip" aria-label="Programas de SUBE">
    <div class="wrap program-strip-row">
      {}
    </div>
  </nav>

""".format("\n      ".join(items))


def pagina_oculta(titulo):
    """Página de una sección oculta: no aparece en buscadores y lleva a la Home."""
    return """<!DOCTYPE html>
<html lang="es-AR">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<meta name="robots" content="noindex, nofollow">
<meta http-equiv="refresh" content="0; url=index.html">
<title>{} · SUBE</title>
<link rel="canonical" href="index.html">
<script>location.replace("index.html");</script>
</head>
<body>
<p>Esta sección no está disponible por ahora. <a href="index.html">Ir al inicio de SUBE</a>.</p>
</body>
</html>
""".format(titulo)


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
    cards = []
    if p["hosts"]:
        cards.append('<div class="program-info-card"><h2>Conducen</h2>{}</div>'.format(people_list_html(p["hosts"])))
    if p["columnists"]:
        cards.append('<div class="program-info-card"><h2>Columnistas</h2>{}</div>'.format(people_list_html(p["columnists"])))
    if p["production"]:
        cards.append('<div class="program-info-card"><h2>Producción</h2>{}</div>'.format(people_list_html(p["production"])))
    return '<div class="program-info-grid">' + "".join(cards) + "</div>" if cards else ""


def subtitle_html(p):
    return '<p class="program-subtitle">{}</p>'.format(html.escape(p["subtitle"])) if p.get("subtitle") else ""


def ig_chip_html(p):
    if p.get("instagram"):
        return '<a class="program-ig-chip" href="{url}" target="_blank" rel="noopener">{icon}<span>@{handle}</span></a>'.format(
            url=ig_url(p["instagram"]), icon=IG_ICON, handle=p["instagram"]
        )
    return ""


def video_programa_html(p):
    if p.get("video_id"):
        src = "https://www.youtube.com/embed/{}{}".format(p["video_id"], "?list=" + p["list_id"] if p.get("list_id") else "")
    elif p.get("list_id"):
        src = "https://www.youtube.com/embed/videoseries?list=" + p["list_id"]
    else:
        return ""
    return """<div class="video-embed">
        <iframe
          src="{}"
          title="{} — SUBE"
          loading="lazy"
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
          allowfullscreen>
        </iframe>
      </div>""".format(src, html.escape(p["name"]))


def program_body(p):
    return '''  <section class="program-hero">
    <div class="wrap">
      <a class="back-link" href="../contenidos.html">{back}Volver a Contenidos</a>
      <div class="program-title">
        {logo}<div>
          <p class="eyebrow">Programa</p>
          <h1>{name}</h1>
        </div>
      </div>
      {subtitle}
      <div class="program-meta">
        {schedule}
        {ig_chip}
      </div>
    </div>
  </section>

  <section class="program-body">
    <div class="wrap">
      {video}

      {info_grid}
    </div>
  </section>
'''.format(
        back=BACK_ICON,
        name=html.escape(p["name"]),
        logo='<img class="program-logo" src="../{}" alt="Logo de {}" decoding="async">'.format(p["logo"], html.escape(p["name"])) if p.get("logo") else "",
        subtitle=subtitle_html(p),
        schedule='<span class="program-schedule">{}</span>'.format(p["schedule"]) if p.get("schedule") else "",
        ig_chip=ig_chip_html(p),
        video=video_programa_html(p),
        info_grid=info_grid_html(p),
    )


# ============================================================
# ESCRITURA DE ARCHIVOS
# ============================================================
if __name__ == "__main__":
    write(
        "index.html",
        page_html(
            "SUBE :: Un viaje colectivo por La Plata",
            "SUBE es un medio de comunicación autogestivo con identidad platense. Conocé los beneficios de la Comunidad de Pasajerxs y sumate como socix.",
            HOME_BODY.format(
                list_id=LIVE_PLAYLIST_ID,
                perfiles=perfiles_json(),
                franja_programas=franja_programas_html(),
                noticias_destacadas=NOTICIAS_DESTACADAS if visible("noticias") else "",
            ),
            depth=0,
            active=None,
            extra_scripts=["planillas.js", "schedule.js", "next-stop.js"],
        ),
    )
    write(
        "comunidad.html",
        page_html(
            "Comunidad · SUBE",
            "La Comunidad de Pasajerxs de SUBE: beneficios en comercios amigos y cómo sumarte con tu aporte.",
            COMUNIDAD_BODY.replace("{boton_ubicacion}", BOTON_UBICACION.format(pin=PIN_ICON) if GEOLOCALIZACION_ACTIVA else ""),
            depth=0,
            active="comunidad",
            extra_scripts=(["logo-autoload.js", "geo.js", "carousel.js"] if GEOLOCALIZACION_ACTIVA
                           else ["logo-autoload.js", "carousel.js"]),
        ),
    )
    write(
        "contenidos.html",
        page_html(
            "Contenidos · SUBE",
            "Programación y noticias de SUBE.",
            CONTENIDOS_BODY.replace("{grilla}", grilla_contenidos_html()).replace(
                "{bloque_noticias}", BLOQUE_NOTICIAS if visible("noticias") else ""),
            depth=0,
            active="contenidos",
            extra_scripts=["planillas.js", "schedule.js", "schedule-grid.js"],
        ),
    )
    write(
        "noticias.html",
        page_html(
            "Noticias · SUBE",
            "Noticias de SUBE. Próximamente.",
            NOTICIAS_BODY,
            depth=0,
            active="contenidos",
        ) if visible("noticias") else pagina_oculta("Noticias"),
    )
    write(
        "tienda.html",
        page_html(
            "Tienda · SUBE",
            "Tienda de SUBE. Próximamente.",
            TIENDA_BODY,
            depth=0,
            active="tienda",
        ) if visible("tienda") else pagina_oculta("Tienda"),
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

    for p in programas_perfiles():
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
