#!/usr/bin/env python3
"""
Trae los datos de las planillas de Google Sheets que usa la web:
  - Comercios de la Comunidad (y sus logos desde Drive)
  - Programación (grilla de Contenidos y "Próxima parada" de la portada)

Lo corre GitHub automáticamente (ver .github/workflows/publicar-sitio.yml)
antes de generar el sitio. Los links de las planillas están en
datos/fuentes.json. Deja:
  - datos/comercios.json          → la lista que usa build_site.py
  - assets/socios/planilla/*.png  → los logos, achicados y listos para la web
  - datos/programacion.csv        → la copia que lee assets/schedule.js

Si la planilla no responde o viene vacía, NO toca nada: la web sigue con
la última versión buena y se muestra un aviso en GitHub.

Requisitos de la planilla:
  - Compartida como "Cualquier persona con el vínculo: Lector".
  - Fila 1 con los títulos. Se reconocen (sin importar mayúsculas ni tildes):
      Nombre · Rubro · Instagram · Beneficio (y Beneficio 2, 3…) ·
      Ubicación · Logo o Gráficas · Tipo (opcional) · Activo (opcional)
  - Los logos: link de Drive (compartido igual que la planilla) o link
    directo a una imagen.

Uso manual:  python3 scripts/sync_planillas.py
"""
import csv
import io
import json
import os
import re
import sys
import unicodedata
import urllib.request

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
FUENTES = os.path.join(ROOT, "datos", "fuentes.json")
SALIDA = os.path.join(ROOT, "datos", "comercios.json")
LOGOS_DIR = os.path.join(ROOT, "assets", "socios", "planilla")
LOGO_MAX = 320  # px del lado más largo
PROG_LOGOS_DIR = os.path.join(ROOT, "assets", "programas", "planilla")
PROG_SALIDA = os.path.join(ROOT, "datos", "programas.json")


def nota(msg):
    # Resumen visible en GitHub (pestaña Actions) sin ser una advertencia.
    print("::notice::" + msg if os.environ.get("GITHUB_ACTIONS") else msg)


def aviso(msg):
    # En GitHub se ve como un aviso amarillo; en la terminal, como texto.
    print("::warning::" + msg if os.environ.get("GITHUB_ACTIONS") else "AVISO: " + msg)


def norm(t):
    t = unicodedata.normalize("NFD", str(t or ""))
    t = "".join(c for c in t if unicodedata.category(c) != "Mn")
    return re.sub(r"\s+", " ", t.lower()).strip()


def slugify(t):
    return re.sub(r"[^a-z0-9]+", "-", norm(t)).strip("-") or "comercio"


def descargar(url, limite=8 * 1024 * 1024):
    req = urllib.request.Request(url, headers={"User-Agent": "Mozilla/5.0 (SUBE web)"})
    with urllib.request.urlopen(req, timeout=30) as r:
        tipo = r.headers.get("Content-Type", "")
        datos = r.read(limite + 1)
    if len(datos) > limite:
        raise ValueError("archivo demasiado grande")
    return datos, tipo


def url_csv(cfg):
    m = re.search(r"/spreadsheets/d/([a-zA-Z0-9_-]+)", cfg["planilla"])
    if not m:
        raise ValueError("el link de la planilla no parece de Google Sheets")
    url = "https://docs.google.com/spreadsheets/d/{}/export?format=csv".format(m.group(1))
    gid = str(cfg.get("gid", "")).strip()
    if gid:
        url += "&gid=" + gid
    return url


def columnas(titulos):
    t = [norm(x) for x in titulos]

    def una(*claves):
        for i, h in enumerate(t):
            if any(h == c or h.startswith(c) for c in claves):
                return i
        return -1

    return {
        "nombre": una("nombre", "comercio", "negocio", "espacio"),
        "rubro": una("rubro", "categoria"),
        "instagram": una("link de instagram", "instagram", "ig"),
        "beneficios": [i for i, h in enumerate(t) if h.startswith("beneficio") or h.startswith("descuento")],
        "ubicacion": una("ubicacion", "direccion", "domicilio"),
        "logo": una("logo", "imagen", "grafica"),
        "tipo": una("tipo"),
        "activo": una("activo", "visible", "publicar"),
    }


def handle_instagram(v):
    v = str(v or "").strip()
    m = re.search(r"instagram\.com/([^/?#\s]+)", v, re.I)
    if m:
        v = m.group(1)
    v = v.lstrip("@").strip().strip("/")
    return v if re.fullmatch(r"[A-Za-z0-9._]{1,30}", v or "") else ""


def url_imagen(v):
    v = str(v or "").strip()
    if not v.startswith("http"):
        return ""
    m = re.search(r"drive\.google\.com/(?:file/d/|open\?id=|uc\?(?:[^#]*&)?id=)([a-zA-Z0-9_-]+)", v)
    if m:
        return "https://drive.google.com/uc?export=download&id=" + m.group(1)
    return v


def guardar_logo(url, slug, carpeta=None):
    from PIL import Image  # se instala en GitHub (pip install pillow)
    carpeta = carpeta or LOGOS_DIR
    datos, tipo = descargar(url)
    if "text/html" in tipo:
        raise ValueError("Drive devolvió una página en lugar de la imagen (¿el archivo está compartido con 'Cualquier persona con el vínculo'?)")
    im = Image.open(io.BytesIO(datos))
    im.load()
    if im.mode not in ("RGB", "RGBA"):
        im = im.convert("RGBA")
    ancho, alto = im.size
    im.thumbnail((LOGO_MAX, LOGO_MAX))  # achica sin deformar (mantiene la proporción)
    os.makedirs(carpeta, exist_ok=True)
    nombre = slug + ".png"
    im.save(os.path.join(carpeta, nombre), optimize=True)
    guardar_logo.ultimo = "{}x{} → {}x{}".format(ancho, alto, im.size[0], im.size[1])
    return os.path.relpath(os.path.join(carpeta, nombre), ROOT).replace(os.sep, "/")


def leer_csv(cfg):
    """Descarga una pestaña de Google Sheets como filas de CSV."""
    url = url_csv(cfg)
    try:
        crudo, _ = descargar(url)
    except Exception:  # noqa: BLE001
        # Plan B: la otra forma de exportar de Google
        crudo, _ = descargar(url.replace("/export?format=csv", "/gviz/tq?tqx=out:csv"))
    texto = crudo.decode("utf-8-sig")
    if texto.lstrip().startswith("<"):
        raise ValueError("Google pidió iniciar sesión: la planilla tiene que estar compartida como 'Cualquier persona con el vínculo: Lector'")
    return texto


def sync_programacion(cfg):
    """Guarda la pestaña de programación tal cual (assets/schedule.js la
    interpreta) y arma datos/programas.json con la descripción y el logo
    de cada programa (los usa build_site.py en Contenidos)."""
    destino = os.path.join(ROOT, "datos", "programacion.csv")
    try:
        texto = leer_csv(cfg)
    except Exception as e:  # noqa: BLE001
        aviso("No se pudo leer la planilla de programación ({}). La web sigue con los datos anteriores.".format(e))
        return
    filas = list(csv.reader(io.StringIO(texto)))
    head = None
    for i, f in enumerate(filas[:10]):
        t = [norm(x) for x in f]
        if any(h in ("programa", "nombre") for h in t) and any(h.startswith("hora") for h in t):
            head = i
            break
    datos = [f for f in filas if any(c.strip() for c in f)]
    if head is None or len(datos) < 2:
        aviso("En la planilla de programación no encontramos los títulos (Nombre o Programa, Hora…) o no tiene programas. La web sigue con los datos anteriores.")
        return
    with open(destino, "w", encoding="utf-8", newline="") as fh:
        fh.write(texto if texto.endswith("\n") else texto + "\n")
    titulos = [norm(x) for x in filas[head]]
    nota("Programación: {} filas guardadas. Columnas: {}".format(len(datos) - 1, " | ".join(filas[head])))

    def col(*nombres):
        for n in nombres:
            if n in titulos:
                return titulos.index(n)
        return -1
    c_nombre, c_desc, c_logo = col("nombre", "programa"), col("descripcion"), col("logo")
    programas, usados = [], set()
    for n, f in enumerate(filas[head + 1:], start=head + 2):
        nombre = f[c_nombre].strip() if 0 <= c_nombre < len(f) else ""
        if not nombre:
            continue
        slug = slugify(nombre)
        p = {"slug": slug, "nombre": nombre,
             "descripcion": f[c_desc].strip() if 0 <= c_desc < len(f) else "", "logo": ""}
        url = url_imagen(f[c_logo]) if 0 <= c_logo < len(f) else ""
        if url:
            try:
                p["logo"] = guardar_logo(url, slug, PROG_LOGOS_DIR)
                usados.add(slug + ".png")
                nota("Logo de programa OK, fila {} ({}): {}".format(n, nombre, guardar_logo.ultimo))
            except Exception as e:  # noqa: BLE001
                aviso("Programación, fila {} ({}): no se pudo usar el logo: {}".format(n, nombre, e))
        programas.append(p)
    if os.path.isdir(PROG_LOGOS_DIR):
        for fn in os.listdir(PROG_LOGOS_DIR):
            if fn not in usados:
                os.remove(os.path.join(PROG_LOGOS_DIR, fn))
    with open(PROG_SALIDA, "w", encoding="utf-8") as fh:
        json.dump({"programas": programas}, fh, ensure_ascii=False, indent=2)
        fh.write("\n")


def main():
    if not os.path.exists(FUENTES):
        aviso("No está datos/fuentes.json: la web sigue con los datos anteriores.")
        return 0
    fuentes = json.load(open(FUENTES, encoding="utf-8"))
    if fuentes.get("programacion"):
        sync_programacion(fuentes["programacion"])
    if fuentes.get("comercios"):
        sync_comercios(fuentes["comercios"])
    return 0


def sync_comercios(cfg):
    try:
        filas = list(csv.reader(io.StringIO(leer_csv(cfg))))
    except Exception as e:  # noqa: BLE001
        aviso("No se pudo leer la planilla de comercios ({}). La web sigue con los datos anteriores.".format(e))
        return

    # La fila de títulos puede no ser la primera (por ejemplo, si hay un título arriba)
    head, cols = None, None
    for i, f in enumerate(filas[:10]):
        c = columnas(f)
        if c["nombre"] >= 0 and (c["beneficios"] or c["rubro"] >= 0):
            head, cols = i, c
            break
    if cols is None:
        aviso("En la planilla de comercios no encontramos la fila de títulos (Nombre, Rubro, Beneficio…). La web sigue con los datos anteriores.")
        return

    def celda(f, i):
        return f[i].strip() if 0 <= i < len(f) and f[i] else ""

    comercios, vistos, problemas = [], set(), []
    for n, f in enumerate(filas[head + 1:], start=head + 2):
        nombre = celda(f, cols["nombre"])
        if not nombre:
            continue
        activo = norm(celda(f, cols["activo"]))
        if activo in ("no", "n", "0", "false", "oculto", "baja"):
            continue
        tipo = norm(celda(f, cols["tipo"]))
        beneficios = []
        for i in cols["beneficios"]:
            for b in re.split(r"\s*(?:\n|;|\s\|\s)\s*", celda(f, i)):
                if b.strip():
                    beneficios.append(b.strip())
        ig = handle_instagram(celda(f, cols["instagram"]))
        slug = slugify(ig or nombre)
        while slug in vistos:
            slug += "-2"
        vistos.add(slug)
        c = {
            "slug": slug,
            "nombre": nombre,
            "rubro": celda(f, cols["rubro"]),
            "instagram": ig,
            "beneficios": beneficios,
            "ubicacion": celda(f, cols["ubicacion"]),
            "tipo": "auspiciante" if tipo.startswith("ausp") else ("ambos" if tipo.startswith("amb") else "adherido"),
            "logo": "",
        }
        url = url_imagen(celda(f, cols["logo"]))
        if url:
            try:
                c["logo"] = guardar_logo(url, slug)
                nota("Logo de comercio OK, fila {} ({}): {}".format(n, nombre, guardar_logo.ultimo))
            except Exception as e:  # noqa: BLE001
                problemas.append("fila {} ({}): no se pudo usar el logo: {}".format(n, nombre, e))
        elif celda(f, cols["logo"]):
            problemas.append("fila {} ({}): la columna de logo no tiene un link válido".format(n, nombre))
        if c["tipo"] != "auspiciante" and not beneficios:
            problemas.append("fila {} ({}): no tiene beneficio cargado".format(n, nombre))
        comercios.append(c)

    if not comercios:
        aviso("La planilla de comercios vino sin comercios. Por las dudas, la web sigue con los datos anteriores.")
        return

    # Logos que ya no se usan
    usados = {os.path.basename(c["logo"]) for c in comercios if c["logo"]}
    if os.path.isdir(LOGOS_DIR):
        for fn in os.listdir(LOGOS_DIR):
            if fn not in usados:
                os.remove(os.path.join(LOGOS_DIR, fn))

    with open(SALIDA, "w", encoding="utf-8") as fh:
        json.dump({"comercios": comercios}, fh, ensure_ascii=False, indent=2)
        fh.write("\n")
    con_logo = sum(1 for c in comercios if c["logo"])
    nota("Comercios leídos de la planilla: {} ({} con logo). Columnas: {}".format(len(comercios), con_logo, " | ".join(filas[head])))
    for p in problemas:
        aviso(p)
    return


if __name__ == "__main__":
    sys.exit(main())
