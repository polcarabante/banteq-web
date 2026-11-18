"""Avisa a IndexNow (Bing y los demás buscadores que lo usan) de las páginas nuevas o cambiadas.

ChatGPT y Copilot buscan sobre el índice de Bing: cuanto antes lo sepa Bing, antes pueden citar
una página. Google no usa IndexNow (para Google sigue valiendo el sitemap y Search Console).

Uso, SIEMPRE después de que el cambio esté publicado en banteq.com (main), nunca desde una rama:

    python3 tools/indexnow.py                   # enseña qué enviaría (lastmod de hoy) y no envía nada
    python3 tools/indexnow.py --desde 2026-11-18 # páginas cambiadas desde esa fecha
    python3 tools/indexnow.py --todas            # todas las del sitemap
    python3 tools/indexnow.py --enviar           # (con cualquiera de las anteriores) envía de verdad

Toma las fechas de assets-banteq/seo/lastmod.json (las mismas del sitemap) y, antes de enviar,
comprueba que banteq.com sirve el archivo de la clave y que cada URL responde 200.
"""
import argparse
import datetime
import json
import sys
import urllib.error
import urllib.request
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent))
import contenido as C  # noqa: E402

ROOT = Path(__file__).resolve().parent.parent
LASTMOD = ROOT / "assets-banteq" / "seo" / "lastmod.json"
API = "https://api.indexnow.org/indexnow"
AGENTE = "banteq-indexnow/1.0"


def pedir(url, metodo="GET", datos=None, cabeceras=None):
    req = urllib.request.Request(url, data=datos, method=metodo, headers={"User-Agent": AGENTE, **(cabeceras or {})})
    try:
        with urllib.request.urlopen(req, timeout=20) as r:
            return r.status, r.read().decode("utf-8", "replace")
    except urllib.error.HTTPError as e:
        return e.code, e.read().decode("utf-8", "replace")


def main():
    ap = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    grupo = ap.add_mutually_exclusive_group()
    grupo.add_argument("--desde", help="fecha AAAA-MM-DD: páginas con lastmod igual o posterior")
    grupo.add_argument("--todas", action="store_true", help="todas las páginas del sitemap")
    ap.add_argument("--enviar", action="store_true", help="enviar de verdad (sin esto solo lo enseña)")
    args = ap.parse_args()

    fechas = json.loads(LASTMOD.read_text(encoding="utf-8"))
    desde = args.desde or datetime.date.today().isoformat()
    urls = sorted(u for u, d in fechas.items() if args.todas or d["fecha"] >= desde)
    if not urls:
        print(f"No hay páginas con lastmod desde {desde}.")
        return
    print(f"{len(urls)} páginas" + ("" if args.todas else f" con lastmod desde {desde}") + ":")
    for u in urls:
        print("  ", u)
    if not args.enviar:
        print("\nNo se ha enviado nada (añade --enviar cuando esto esté publicado en banteq.com).")
        return

    clave = C.INDEXNOW_CLAVE
    ubicacion = f"{C.SITIO}/{clave}.txt"
    estado, cuerpo = pedir(ubicacion)
    if estado != 200 or cuerpo.strip() != clave:
        sys.exit(f"{ubicacion} no está publicado o no contiene la clave ({estado}). ¿Está el cambio en main?")
    for u in urls:
        estado, _ = pedir(u, "HEAD")
        if estado != 200:
            sys.exit(f"{u} responde {estado}: no se envía nada.")

    host = C.SITIO.split("://", 1)[1]
    datos = json.dumps({"host": host, "key": clave, "keyLocation": ubicacion, "urlList": urls}).encode()
    estado, cuerpo = pedir(API, "POST", datos, {"Content-Type": "application/json; charset=utf-8"})
    # 200 = recibido; 202 = recibido, la clave se validará después. El resto es un error.
    print(f"\nIndexNow respondió {estado}" + (f": {cuerpo[:300]}" if cuerpo.strip() else ""))
    if estado not in (200, 202):
        sys.exit(1)


if __name__ == "__main__":
    main()
