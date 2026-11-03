#!/usr/bin/env python3
"""
Achica las fotos de las notas (assets/noticias/) para que la web cargue
rápido y el repositorio no crezca de más. Lo corre GitHub al publicar.

- Lado más largo: 1600 px como máximo.
- Solo toca fotos que pasan de ese tamaño o de 400 KB.
- Mantiene el mismo nombre y formato, así las notas no cambian.
"""
import os
import sys

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
CARPETA = os.path.join(ROOT, "assets", "noticias")
MAX_LADO = 1600
MAX_BYTES = 400 * 1024


def main():
    try:
        from PIL import Image, ImageOps
    except ImportError:
        print("Pillow no está instalado: las fotos quedan como están.")
        return 0
    if not os.path.isdir(CARPETA):
        return 0
    for fn in sorted(os.listdir(CARPETA)):
        ext = fn.lower().rsplit(".", 1)[-1]
        if ext not in ("jpg", "jpeg", "png", "webp"):
            continue
        ruta = os.path.join(CARPETA, fn)
        antes = os.path.getsize(ruta)
        try:
            im = Image.open(ruta)
            im = ImageOps.exif_transpose(im)
        except Exception as e:  # noqa: BLE001
            print("No se pudo abrir {}: {}".format(fn, e))
            continue
        if antes <= MAX_BYTES and max(im.size) <= MAX_LADO:
            continue
        im.thumbnail((MAX_LADO, MAX_LADO))
        if ext in ("jpg", "jpeg"):
            im.convert("RGB").save(ruta, "JPEG", quality=82, optimize=True, progressive=True)
        elif ext == "webp":
            im.save(ruta, "WEBP", quality=80, method=6)
        else:
            im.save(ruta, "PNG", optimize=True)
        despues = os.path.getsize(ruta)
        if despues >= antes:
            continue
        print("Foto achicada: {} ({} KB → {} KB)".format(fn, antes // 1024, despues // 1024))
    return 0


if __name__ == "__main__":
    sys.exit(main())
