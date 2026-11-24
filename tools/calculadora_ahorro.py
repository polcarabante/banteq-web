"""Calculadora «¿Cuánto me ahorro?» del área de seguimiento de retrasos (pedida por Pol el 2026-11-24).

Página autónoma, como /diagnostico: su fuente está en assets-banteq/calculadora-ahorro/ y el cálculo
en lib/ahorro-calculo.mjs, que también usa api/ahorro.js (el envío del formulario). Se publica en
/automatizaciones/seguimiento/ahorro; la abre el botón de la tarjeta «Área de seguimiento de
retrasos» de la home (tools/demos.py). Cada archivo lleva ?v=<huella> para que Safari no mezcle
versiones al publicar (ver version_assets en build.py).
"""
from hashlib import sha1
from pathlib import Path
import re

from assets import MARK_PATH

ROOT = Path(__file__).resolve().parent.parent
RUTA = "automatizaciones/seguimiento/ahorro"


def _huella(texto):
    return sha1(texto.encode("utf-8")).hexdigest()[:10]


def integrar():
    fuente = ROOT / "assets-banteq" / "calculadora-ahorro"
    public = ROOT / "public"
    destino = public / RUTA
    destino.mkdir(parents=True, exist_ok=True)

    calculo = (ROOT / "lib" / "ahorro-calculo.mjs").read_text(encoding="utf-8")
    js = (fuente / "ahorro.js").read_text(encoding="utf-8")
    assert js.count("__V_CALCULO__") == 1
    js = js.replace("__V_CALCULO__", _huella(calculo))
    css = (fuente / "ahorro.css").read_text(encoding="utf-8")
    (destino / "ahorro-calculo.mjs").write_text(calculo, encoding="utf-8")
    (destino / "ahorro.js").write_text(js, encoding="utf-8")
    (destino / "ahorro.css").write_text(css, encoding="utf-8")

    # Mismos iconos que el resto de la web (con su versión) y el símbolo del menú.
    iconos = "".join(re.findall(r'<link rel="(?:icon|apple-touch-icon|manifest)"[^>]*>', (public / "index.html").read_text(encoding="utf-8")))
    assert iconos and "favicon.ico" in iconos, "no se encuentran los iconos de la home"
    marca = f'<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64" aria-hidden="true"><path d="{MARK_PATH}" fill="#fff"></path></svg>'
    pagina = (fuente / "index.html").read_text(encoding="utf-8")
    for marcador, valor in (("<!--ICONOS-->", iconos), ("__MARCA__", marca), ("__V_CSS__", _huella(css)), ("__V_JS__", _huella(js))):
        assert pagina.count(marcador) == 1, marcador
        pagina = pagina.replace(marcador, valor)
    (destino / "index.html").write_text(pagina, encoding="utf-8")


if __name__ == "__main__":
    integrar()
