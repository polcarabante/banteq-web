"""Genera la web de Banteq en ./public a partir de la exportación original de Framer.

La plantilla de Framer se mantiene intacta en ./plantilla-original. Este script copia
esa exportación, la reorganiza para servirse desde la raíz y aplica encima todos los
cambios de Banteq (textos, rutas, colores, imágenes, CMS y formularios), de forma que
el resultado se puede regenerar siempre desde cero:

    python3 tools/build.py

Framer hidrata la página con React a partir de sus módulos .mjs, así que cada texto se
cambia a la vez en el módulo (lo que ve el usuario) y en el HTML pre-renderizado (primera
pintura y buscadores). Cada sustitución comprueba que el texto original existe: si hay una
errata en la tabla, el build falla en vez de dejar contenido a medias.
"""
import html
import json
import re
import shutil
import sys
from html.parser import HTMLParser
from pathlib import Path

TOOLS = Path(__file__).resolve().parent
sys.path.insert(0, str(TOOLS))

import contenido as C  # noqa: E402
import jsx  # noqa: E402

ROOT = TOOLS.parent
SRC = ROOT / "plantilla-original"
OUT = ROOT / "public"
PAGES_SRC = SRC / "breathtaking-step-882598.framer.app"
SITE = "framerusercontent.com/sites/70yiSpZyA9Z5dxDKIiuNjl"

HOME_MOD = f"{SITE}/NhFQdiIRh8t4Z5f_dIAyXZYFib7HyY9dx83J-5rcp1s.CVnBnd9A.mjs"
NAV_MOD = f"{SITE}/OnkOaWSAt.DHJdZSEP.mjs"
FORM_MOD = f"{SITE}/TZstgc4Ug.D6CbMJeG.mjs"
CARD_MOD = f"{SITE}/P55aRylGH.CWJQDQD0.mjs"
MAIN_MOD = f"{SITE}/script_main.DS4nwfgn.mjs"
SHARED_MOD = f"{SITE}/shared-lib.BO1lBLoM.mjs"
FRAMER_MOD = f"{SITE}/framer.DrTRbU-a.mjs"
CONTACT_MOD = f"{SITE}/eGLyM1V0aU7qtM-T8MOdbX3-XiwTlizOTYP3IzrJnFA.CZEsQl8c.mjs"
CASES_MOD = f"{SITE}/VKDLLyTios2Zd0jk1CLqFhDLR7XtQbwEwCFou7Hgscw.CNgFRH1L.mjs"
DETAIL_MOD = f"{SITE}/-j3X5ZE7k7IpCk1B7FCCGNnRx-KJXICCrbL_gYn8OgU.Crss1fyR.mjs"
NOTFOUND_MOD = f"{SITE}/Z_WE6k5IO8QVH3oBmWST9YH1F1M-Rt7iUct8Njd0OwI.BXs3vXGP.mjs"
TERMS_MOD = f"{SITE}/_0UeanCh6NgteMj9Ryg25cKN2i4509un5Yw9g64v4E8.CM69hB_P.mjs"
PRIVACY_MOD = f"{SITE}/-oM1torQuEXrx-drvjgmsym6yWPzhUTlsjawAm_O87U.gUA1NVco.mjs"

INDEX = "index.html"


class Site:
    """Carga perezosa de los archivos de texto de ./public y escritura al final."""

    def __init__(self):
        self.files = {}

    def __getitem__(self, rel):
        if rel not in self.files:
            self.files[rel] = (OUT / rel).read_text(encoding="utf-8")
        return self.files[rel]

    def __setitem__(self, rel, value):
        self.files[rel] = value

    def save(self):
        for rel, text in self.files.items():
            p = OUT / rel
            p.parent.mkdir(parents=True, exist_ok=True)
            p.write_text(text, encoding="utf-8")


S = Site()
MISSES = []


def _html_forms(text):
    forms = [text]
    for form in (html.escape(text, quote=False), html.escape(text, quote=True).replace("&#x27;", "&#x27;")):
        if form not in forms:
            forms.append(form)
    return forms


def replace(rel, old, new, required=True, is_html=None):
    """Sustituye old→new en un archivo. En HTML prueba también la forma escapada."""
    text = S[rel]
    is_html = rel.endswith(".html") if is_html is None else is_html
    total = 0
    if is_html:
        for form, new_form in zip(_html_forms(old), _html_forms(new)):
            n = text.count(form)
            if n:
                text = text.replace(form, new_form)
                total += n
    else:
        total = text.count(old)
        text = text.replace(old, new)
    S[rel] = text
    if required and not total:
        MISSES.append((rel, old))
    return total


def replace_any(rels, old, new):
    """Sustituye en varios archivos; exige al menos una coincidencia en total."""
    total = sum(replace(r, old, new, required=False) for r in rels)
    if not total:
        MISSES.append((",".join(Path(r).name[:12] for r in rels), old))
    return total


# ---------------------------------------------------------------------------
# 1. Copia y estructura
# ---------------------------------------------------------------------------

def copy_template():
    if OUT.exists():
        shutil.rmtree(OUT)
    OUT.mkdir()
    for d in SRC.iterdir():
        if d.is_dir() and d.name != PAGES_SRC.name:
            shutil.copytree(d, OUT / d.name)
    (OUT / INDEX).write_text((PAGES_SRC / "index.html").read_text(encoding="utf-8"), encoding="utf-8")


def fix_html_paths(rel):
    h = S[rel]
    h = h.replace("../breathtaking-step-882598.framer.app/contact/index.html", C.RUTAS["/contact"])
    h = h.replace("../breathtaking-step-882598.framer.app/case-studies/index.html", C.RUTAS["/case-studies"])
    h = h.replace("https://breathtaking-step-882598.framer.app/terms-of-service", C.RUTAS["/terms-of-service"])
    h = h.replace("https://breathtaking-step-882598.framer.app/privacy-policy", C.RUTAS["/privacy-policy"])
    h = re.sub(r"https://breathtaking-step-882598\.framer\.app/case-studies/[a-z0-9-]+", C.RUTAS["/case-studies"], h)
    h = h.replace("https://breathtaking-step-882598.framer.app/404", "/#servicios")
    h = h.replace("https://breathtaking-step-882598.framer.app/", "/")
    h = h.replace("../framerusercontent.com/", "/framerusercontent.com/")
    h = h.replace("../fonts.gstatic.com/", "/fonts.gstatic.com/")
    h = h.replace("../fonts.googleapis.com/", "/fonts.googleapis.com/")
    S[rel] = h


def strip_framer_extras(rel):
    """Quita la analítica de Framer, la barra de edición y metadatos de la plantilla."""
    h = S[rel]
    h = re.sub(r'<script[^>]*events\.framer\.com[^>]*></script>', "", h)
    h = re.sub(r'<script[^>]*framer\.com/edit/init\.mjs[^>]*></script>', "", h)
    h = re.sub(r'<link[^>]*framer\.com/edit/init\.mjs[^>]*>', "", h)
    h = re.sub(r'<meta name="generator"[^>]*>', "", h)
    h = re.sub(r'<meta name="framer-search-index[^>]*>', "", h)
    h = re.sub(r'<!-- Made in Framer[^>]*-->', "", h)
    S[rel] = h


# ---------------------------------------------------------------------------
# 2. Secciones: orden, anclas y eliminación
# ---------------------------------------------------------------------------

def section_calls(src):
    """Devuelve {nombre: (inicio, fin)} de cada sección de la home en el módulo JS."""
    out = {}
    for name in C.ORDEN_SECCIONES + ["Team Section"]:
        i = src.find('"data-framer-name":`%s`' % name)
        out[name] = jsx.call_containing(src, i)
    return out


def reorder_sections_js():
    src = S[HOME_MOD]
    calls = section_calls(src)
    ordered = sorted(calls.items(), key=lambda kv: kv[1][0])
    start, end = ordered[0][1][0], ordered[-1][1][1]
    # Las secciones son hermanas consecutivas separadas por comas dentro de children:[...]
    between = [src[ordered[k][1][1]:ordered[k + 1][1][0]] for k in range(len(ordered) - 1)]
    assert all(b == "," for b in between), between
    pieces = {name: src[a:b] for name, (a, b) in calls.items()}
    S[HOME_MOD] = src[:start] + ",".join(pieces[n] for n in C.ORDEN_SECCIONES) + src[end:]


def html_element_extent(h, start, tag):
    """Devuelve el fin del elemento <tag> que empieza en start (cuenta anidados)."""
    depth = 0
    for m in re.compile(rf"<{tag}\b|</{tag}>").finditer(h, start):
        depth += 1 if m.group(0) != f"</{tag}>" else -1
        if depth == 0:
            return m.end()
    raise ValueError("etiqueta sin cerrar")


def reorder_sections_html(rel):
    h = S[rel]
    spans = {}
    for name in C.ORDEN_SECCIONES + ["Team Section"]:
        i = h.find(f'data-framer-name="{name}"')
        a = h.rfind("<section", 0, i)
        spans[name] = (a, html_element_extent(h, a, "section"))
    ordered = sorted(spans.values())
    for (a1, b1), (a2, b2) in zip(ordered, ordered[1:]):
        assert b1 == a2, h[b1:a2][:200]
    start, end = ordered[0][0], ordered[-1][1]
    S[rel] = h[:start] + "".join(h[slice(*spans[n])] for n in C.ORDEN_SECCIONES) + h[end:]


def rename_anchors():
    main = S[MAIN_MOD]
    a = main.find("augiA20Il:{elements:{")
    b = main.find("}", a + len("augiA20Il:{elements:{"))
    block = main[a:b]
    for old, new in C.ANCLAS.items():
        assert f"`{old}`" in block, old
        block = block.replace(f"`{old}`", f"`{new}`")
    S[MAIN_MOD] = main[:a] + block + main[b:]
    for old, new in C.ANCLAS.items():
        replace(INDEX, f'id="{old}"', f'id="{new}"')


def rename_routes():
    for old, new in C.RUTAS.items():
        replace(MAIN_MOD, f"path:`{old}`", f"path:`{new}`")
    replace(MAIN_MOD, "path:`/case-studies/:M01tXmL0I`", "path:`/proyectos/:M01tXmL0I`")


# ---------------------------------------------------------------------------
# 3. Textos
# ---------------------------------------------------------------------------

def split_heading_html(rel, old, new):
    """Titulares que Framer anima palabra a palabra: cada palabra es un <span> en el HTML."""
    h = S[rel]
    words = [html.escape(w, quote=False) for w in old.split(" ")]
    pat = re.compile(
        r'<span style="([^"]*)">' + re.escape(words[0]) + r"</span>"
        + "".join(r'\s*<span style="[^"]*">' + re.escape(w) + r"</span>" for w in words[1:])
    )
    count = 0

    def sub(m):
        nonlocal count
        count += 1
        style = m.group(1)
        return " ".join(f'<span style="{style}">{html.escape(w, quote=False)}</span>' for w in new.split(" "))

    S[rel] = pat.sub(sub, h)
    return count


def reveal_text_html(rel, new):
    """El texto de 'Quiénes somos' se revela letra a letra: se regenera span a span."""
    h = S[rel]
    i = h.find('data-framer-name="Reveal Text"')
    end = html_element_extent(h, h.rfind("<div", 0, i), "div")
    block = h[i:end]

    def rebuild(m):
        opening = m.group(1)
        style = re.search(r'<span><span style="([^"]*)">', m.group(2)).group(1)
        words = new.split(" ")
        parts = []
        for k, w in enumerate(words):
            chars = "".join(f'<span style="{style}">{html.escape(c, quote=False)}</span>' for c in w)
            parts.append(f"<span>{chars}{'&nbsp;' if k < len(words) - 1 else ''}</span>")
        return opening + "".join(parts) + "</p>"

    block, n = re.subn(r'(<p style="font-family:[^"]*">)(.*?)</p>', rebuild, block, flags=re.S)
    assert n >= 1
    S[rel] = h[:i] + block + h[end:]


def js_template(text):
    return text.replace("\\", "\\\\").replace("`", "\\`").replace("${", "\\${")


def apply_home_texts():
    home_files = [HOME_MOD, INDEX]
    for old, new in C.TITULARES:
        replace(HOME_MOD, f"`{old}`", f"`{js_template(new)}`")
        if not split_heading_html(INDEX, old, new):
            MISSES.append((INDEX, "titular " + old))
    old, new = C.REVEAL
    replace(HOME_MOD, f"`{old}`", f"`{js_template(new)}`")
    reveal_text_html(INDEX, new)
    for (onum, olab), (nnum, nlab) in C.ETIQUETAS:
        replace(HOME_MOD, f"NT4fTBnN4:`{onum}`,Wg5l9sjZU:`{olab}`", f"NT4fTBnN4:`{nnum}`,Wg5l9sjZU:`{nlab}`")
    for (a, b2), (na, nb) in C.LINEAS_MOVIL:
        replace(HOME_MOD, f"`{a}`,g(`br`,{{}}),`{b2}`", f"`{na}`,g(`br`,{{}}),`{nb}`")
        replace(INDEX, f'{a}<br class="framer-text">{b2}', f'{na}<br class="framer-text">{nb}', required=False)
    # De más largo a más corto: así un texto corto nunca altera otro más largo que lo contiene.
    for old, new, *flag in sorted(C.HOME + C.PRECIOS, key=lambda t: -len(t[0])):
        if flag:
            for rel in home_files:
                replace(rel, old, new, required=False)
        else:
            replace_any(home_files, old, new)


def apply_section_labels_html():
    """Las etiquetas '00X · nombre' se pintan en el HTML como dos <p> sueltos."""
    h = S[INDEX]
    for (onum, olab), (nnum, nlab) in C.ETIQUETAS:
        pat = re.compile(
            r"(>)" + re.escape(onum) + r"(</p>(?:(?!</section>).){0,1600}?>)" + re.escape(olab) + r"(</p>)", re.S
        )
        h, n = pat.subn(lambda m: m.group(1) + nnum + m.group(2) + html.escape(nlab, quote=False) + m.group(3), h, count=1)
        if not n:
            MISSES.append((INDEX, f"etiqueta {onum} {olab}"))
    S[INDEX] = h


def apply_integrations():
    """Cambia las etiquetas de las integraciones por posición (hay nombres repetidos)."""
    src = S[HOME_MOD]
    for old, new, _ in C.INTEGRACIONES:
        n = src.count(f"XOtFedeka:`{old}`")
        if not n:
            MISSES.append((HOME_MOD, "integración " + old))
        src = src.replace(f"XOtFedeka:`{old}`", f"XOtFedeka:`\u0000{new}`")
    S[HOME_MOD] = src.replace("\u0000", "")
    h = S[INDEX]
    labels = {old: new for old, new, _ in C.INTEGRACIONES}
    # En el HTML cada etiqueta es un <p> dentro de un elemento "Intergration/Item".
    h = re.sub(
        r'(data-framer-name="Intergration/Item".{0,2500}?<p class="framer-text[^>]*>)([^<]+)(</p>)',
        lambda m: m.group(1) + labels.get(html.unescape(m.group(2)), m.group(2)) + m.group(3),
        h,
        flags=re.S,
    )
    S[INDEX] = h


def apply_nav_footer():
    for old, new in C.NAV:
        replace_any([NAV_MOD], old, new)
    # El contenedor del formulario llega sin "action" (Framer lo añade al publicar en su hosting).
    replace(FORM_MOD, "c(C,{className:`framer-6j5orb`,", "c(C,{action:`/api/leads`,className:`framer-6j5orb`,")
    for old, new in C.FORMULARIO:
        replace(FORM_MOD, old, new, required=False)
        for rel in html_pages():
            replace(rel, old.replace("\\u2028", " "), new, required=False)


def apply_nav_html():
    """En el HTML el botón del menú y el de la cabecera comparten texto con el hero."""
    for rel in html_pages():
        h = S[rel]
        h, n = re.subn(r'(data-framer-name="Get this Template"(?:(?!</p>).)*?>)Get this Template</p>', r"\1Hablemos</p>", h, flags=re.S)
        h = h.replace('">Menu</p>', '">Menú</p>')
        S[rel] = h


# ---------------------------------------------------------------------------
# 3b. Ajustes puntuales (textos repetidos, precios, enlaces, pie)
# ---------------------------------------------------------------------------

SUBTITULO_VALOR = (
    "No empezamos por la tecnología, sino por cómo trabaja tu empresa. "
    "Después elegimos la herramienta adecuada para cada caso."
)


def section_range_js(name):
    src = S[HOME_MOD]
    return jsx.call_containing(src, src.find('"data-framer-name":`%s`' % name))


def section_range_html(rel, name):
    h = S[rel]
    a = h.rfind("<section", 0, h.find(f'data-framer-name="{name}"'))
    return a, html_element_extent(h, a, "section")


def replace_in_range(rel, rng, old, new):
    text = S[rel]
    a, b = rng
    seg = text[a:b]
    if old not in seg:
        MISSES.append((rel, "en sección: " + old[:60]))
    S[rel] = text[:a] + seg.replace(old, new) + text[b:]


def fix_value_subtitle():
    hero_sub = {t[0]: t[1] for t in C.HOME}[
        "We build AI-powered automation systems that eliminate manual work, reduce costs, and multiply your business performance."
    ]
    replace_in_range(HOME_MOD, section_range_js("Value Section"), f"`{hero_sub}`", f"`{SUBTITULO_VALOR}`")
    replace_in_range(INDEX, section_range_html(INDEX, "Value Section"), hero_sub, SUBTITULO_VALOR)


def fix_prices():
    """Sin precios: 'Copilot · Microsoft 365' y 'FUNDAE · formación bonificable'."""
    for rel in (HOME_MOD, INDEX):
        t = S[rel]
        if rel.endswith(".mjs"):
            t, n1 = re.subn(r"(`(?:Copilot|FUNDAE)`,g\(T\.span,\{style:\{[^{}]*\},children:)`00`", r"\1``", t)
            t, n2 = re.subn(r"(`FUNDAE`.{0,6000}?)`Microsoft 365`", r"\1`bonificable`", t, flags=re.S)
        else:
            t, n1 = re.subn(r"(>(?:Copilot|FUNDAE)<span[^>]*>)00(</span>)", r"\1\2", t)
            t, n2 = re.subn(r"(>FUNDAE<.{0,6000}?>)Microsoft 365(<)", r"\1bonificable\2", t, flags=re.S)
        if not (n1 and n2):
            MISSES.append((rel, f"precios ({n1}, {n2})"))
        S[rel] = t


def set_links_before(rel, label, link_js, prop="q0dQpavo3"):
    """Cambia los enlaces del bloque ne({links:[...]}) que envuelve al botón con ese texto."""
    t = S[rel]
    i = t.find(f"{prop}:`{label}`")
    if i < 0:
        MISSES.append((rel, "botón " + label))
        return
    j = t.rfind("links:[", 0, i)
    k = jsx.match_bracket(t, j + len("links:"))
    n = t[j:k].count("{href:")
    links = ",".join(f"{{href:{link_js},implicitPathVariables:void 0}}" for _ in range(n))
    S[rel] = t[:j] + f"links:[{links}]" + t[k:]


def fix_links():
    replace(HOME_MOD, "fLS9iwM5O:`framer.com`", "fLS9iwM5O:`/contacto`")
    # La imagen de "Quiénes somos" abría un vídeo de YouTube de la plantilla.
    replace(HOME_MOD, "WwoFhkv5M:`https://www.youtube.com/watch?v=8AHPXm9Y6mI`", "WwoFhkv5M:`/proyectos`")
    set_links_before(HOME_MOD, "Ver servicios", "{webPageId:`augiA20Il`,hash:`v30xxKYcD`}")
    replace(HOME_MOD, "href:`framer.com`", "href:{webPageId:`mow46yhcP`}")
    set_links_before(HOME_MOD, "Calcular mi crédito FUNDAE", "`https://simuladorcredito.fundae.es`")
    # Cabecera: "Hablemos" lleva a contacto; el enlace "Servicios" (antes 404) a la sección.
    replace(NAV_MOD, "href:`https://www.framer.com/marketplace/templates/`", "href:{webPageId:`mow46yhcP`}")
    t = S[NAV_MOD]
    t = t.replace("{href:{webPageId:`HaABzrLei`}", "{href:{webPageId:`augiA20Il`,hash:`v30xxKYcD`}")
    t = t.replace("href:{webPageId:`HaABzrLei`}", "href:{webPageId:`augiA20Il`,hash:`v30xxKYcD`}")
    S[NAV_MOD] = t


PIE_HTML = [
    (">Case Studies<", ">Proyectos<"), (">Contact<", ">Contacto<"), (">404<", ">Servicios<"),
    (">Terms<", ">Aviso legal<"), (">Privacy<", ">Privacidad<"), (">Policy<", ">Privacidad<"), (">Home<", ">Inicio<"),
    ("© Conicorn 2026 | Built in ", "© Banteq 2026 · Tecnología aplicada a empresas"),
]


def fix_new_tab_links():
    """La plantilla abría en pestaña nueva enlaces que ahora son internos (contacto, proyectos…).
    Los externos (simulador de FUNDAE) los abre banteq.js en pestaña nueva."""
    for rel in (NAV_MOD, HOME_MOD):
        S[rel] = S[rel].replace("openInNewTab:!0", "openInNewTab:!1")
    for rel in html_pages():
        h = S[rel]
        h = h.replace('href="https://framer.com/"', 'href="/contacto"')
        h = h.replace('href="https://www.youtube.com/watch?v=8AHPXm9Y6mI"', 'href="/proyectos"')
        S[rel] = h


def fix_footer():
    replace(NAV_MOD, "children:`Framer`", "children:``")
    for rel in html_pages():
        for old, new in PIE_HTML:
            replace(rel, old, new, required=False)
    for rel in html_pages():
        S[rel] = re.sub(r"(© Banteq 2026 · Tecnología aplicada a empresas)<span[^>]*>(?:<a[^>]*>)?Framer(?:</a>)?</span>", r"\1", S[rel])


def fix_cards():
    replace(CARD_MOD, "`Read More`", "`Ver proyecto`")
    for rel in html_pages():
        replace(rel, ">Read More<", ">Ver proyecto<", required=False)


def inject_assets(rel):
    """Hoja de estilos y script propios de Banteq, cargados después de los de Framer."""
    h = S[rel]
    tag_css = '<link rel="stylesheet" href="/banteq/banteq.css">'
    tag_js = '<script src="/banteq/banteq.js" defer></script><script src="/banteq/banteq-liquid.js" defer></script>'
    if tag_css not in h:
        h = h.replace("</head>", f"{tag_css}{tag_js}</head>", 1)
    S[rel] = h


def copy_banteq_static():
    dst = OUT / "banteq"
    if dst.exists():
        shutil.rmtree(dst)
    shutil.copytree(ROOT / "assets-banteq" / "web", dst)


# ---------------------------------------------------------------------------
# 5. Imágenes y marca
# ---------------------------------------------------------------------------

GEN = ROOT / "assets-banteq" / "generado"
IMAGES = OUT / "framerusercontent.com" / "images"

# Imagen de la plantilla (id) → recurso de Banteq. Se sustituyen todas sus variantes (_1, _2…)
# conservando el tamaño exacto de cada una para no alterar el maquetado.
IMAGENES = {
    # Marca
    "I4qNVX0rmT5t1adTfrJrlvVIO9A": "footer-logo.png",
    "mKbXv8lki4zruFfs2T6taqrWjQ": "circle-text.png",
    "yGoZAzR8EIAGLasEyJ03Xy7Alak": "mark-white-200.png",
    "hSJqEYHyLRRma3mRO6bmI40DmGQ": "favicon-256.png",
    "GByWiHsXIEoQYCw5SOt9BadKZU": "favicon-256.png",
    "AoHi1aQSypMfgG7T044jIHec3ew": "favicon-256.png",
    "mesMNsTTSgV6Xg1TUfNtMnEGZY": "og.png",
    # Fotos de stock → símbolo de Banteq e iconos de servicio
    "0OZnIstjScoZPAUkdNLUST2H6I": "cta-disc.png",
    "nksBogTRxkMRik85FxTEGIcclg": "cta-disc.png",
    "n8zXCidbrBUAQChuau8L7G7DhQ": "tile-flujo.png",
    "xeCVP2BCTEN80S79boVREIjGMB0": "tile-web.png",
    "yIkRlzOeYgbByvg5aLPH3jwplw": "about.jpg",
    "z6cPmsnJML2flePXMqm2kdZG6EI": "tile-web.png",
    "BnPovhu3UVva8wf8pdIhGnyeu0": "tile-rediseno.png",
    "io1ebA6nKd3sIhRozjyWCmW7Pk": "tile-3d.png",
    "Nc7T0UP7TMYghubatYlzblQr3vc": "tile-formulario.png",
    "Jd4Actw3iicp7lVmQL6Tty7Ezw": "tile-integracion.png",
    "ZWhfkzGB6c8iJeDzvp6nt6xFt4": "tile-responsive.png",
    "WOYTcCaxggRNt47bSlnpBZZRtp8": "tile-medida.png",
    "XZPB5Ggowpq8oDHAS6cc7FQYLc": "empty-100x96.png",
    # Ilustraciones de servicios en español
    "JoLUJzWcifYswzE6msfHXW4QOg": "chat-648.png",
    "fjjKosDgY23zKW4wHEEqDuzH7s": "chat-600.png",
    "ZorDrCsHnegaSiRVKyn1U0zE": "lead-card.png",
    "6TuyOzSCZDNOdRtZ8FK3OJeJ8": "chart.png",
    "cgrW7f9W33xv3ZDvvKXaqAaaIL0": "diagram.png",
    # Desarrollo web: la web de cada cliente en el móvil
    "aSmMadORFrjf0SEWGxtfp2qXEmA": "feature-margon.png",
    "mKS6dvxPlvfsWt7d3VskQg0q8": "feature-rentup.png",
    "tQe8KYZERtfj6dEWPfoEV61M2Q": "feature-logo-margon.png",
    # Integraciones (mismo orden que contenido.INTEGRACIONES)
    "2xquyjyFTB2qMqOwhpLzMdYE": "tool-microsoft.png",
    "5uPQw4lqjfuPQVY56gQ2VAps": "tool-n8n.png",
    "ZlucgVlz0X3yiswDce5ZZWPzxnU": "tool-make.png",
    "ZQy4IZjczFBHr315feUz6FY9Jc": "tool-openai.png",
    "qn0FSop5Ezs3MCS3AzMwD3o2NR4": "tool-whatsapp.png",
    "NJei4VUurepCT7nFvab7lNWfGuE": "tool-googledrive.png",
    "AhQIGlem4StUQWPLgPR6MUs5ioY": "tool-notion.png",
    "oin8QcjYXzUlmHfyHtNW6VeuO4": "tool-airtable.png",
    "cDjkCDrLWvNdD8oA4b1Pjx9RaM": "tool-odoo.png",
    "VK3pQ5OWeJjNxkJwuh2e4tWvU": "tool-api.png",
}

# Recursos nuevos que se publican junto a las imágenes de Framer.
NUEVAS = {
    "banteq-rentup-logo-blanco.png": "feature-logo-rentup.png",
    "banteq-margon-logo.png": "cms-logo-margon.png",
    "banteq-rentup-logo.png": "cms-logo-rentup.png",
    "banteq-margon-card.jpg": "cms-card-margon.jpg",
    "banteq-rentup-card.jpg": "cms-card-rentup.jpg",
    "banteq-margon-hero.jpg": "cms-hero-margon.jpg",
    "banteq-rentup-hero.jpg": "cms-hero-rentup.jpg",
    **{f"banteq-margon-{i}.jpg": f"cms-margon-{i}.jpg" for i in range(1, 5)},
    "banteq-rentup-1.jpg": "cms-rentup-1.jpg",
    "banteq-rentup-2.png": "cms-rentup-2.png",
    "banteq-rentup-3.jpg": "cms-rentup-3.jpg",
    "banteq-rentup-4.jpg": "cms-rentup-4.jpg",
}


def _fit(src, size, contain):
    from PIL import Image

    im = Image.open(src).convert("RGBA")
    w, h = size
    if im.size == size:
        return im
    if contain:
        im.thumbnail((w, h), Image.LANCZOS)
        canvas = Image.new("RGBA", (w, h), (0, 0, 0, 0))
        canvas.alpha_composite(im, ((w - im.width) // 2, (h - im.height) // 2))
        return canvas
    r = max(w / im.width, h / im.height)
    im = im.resize((max(w, round(im.width * r)), max(h, round(im.height * r))), Image.LANCZOS)
    x, y = (im.width - w) // 2, (im.height - h) // 2
    return im.crop((x, y, x + w, y + h))


def apply_images():
    from PIL import Image

    for image_id, source in IMAGENES.items():
        targets = [p for folder in (IMAGES, OUT / "framerusercontent.com" / "assets")
                   for p in folder.glob(f"{image_id}*") if p.suffix == ".png"]
        if not targets:
            MISSES.append(("imágenes", image_id))
        contain = source.startswith(("tool-", "feature-logo", "mark-", "favicon", "circle"))
        for target in targets:
            size = Image.open(target).size
            _fit(GEN / source, size, contain).save(target)
    for name, source in NUEVAS.items():
        shutil.copy(GEN / source, IMAGES / name)
    shutil.copy(GEN / "favicon-32.png", OUT / "framerusercontent.com" / "sites" / "icons" / "writing-hand-favicon.png")
    apply_icons()


# Favicon e iconos (tools/assets.py iconos), en la raíz del sitio: publicado ← generado.
ICONOS = {
    "favicon.png": "favicon-32.png",
    "favicon-48.png": "favicon-48.png",
    "apple-touch-icon.png": "apple-touch-icon-180.png",
    # iOS lo pide por su cuenta si una página no declara apple-touch-icon; así no da 404.
    "apple-touch-icon-precomposed.png": "apple-touch-icon-180.png",
    "icon-192.png": "icon-192.png",
    "icon-512.png": "icon-512.png",
    "icon-maskable-512.png": "icon-maskable-512.png",
}
MANIFEST = {
    "name": "Banteq",
    "short_name": "Banteq",
    "start_url": "/",
    "display": "browser",  # el acceso directo abre la web en el navegador, como siempre
    "background_color": "#0f0f0f",
    "theme_color": "#0f0f0f",
    "icons": [
        {"src": "/icon-192.png", "sizes": "192x192", "type": "image/png"},
        {"src": "/icon-512.png", "sizes": "512x512", "type": "image/png"},
        {"src": "/icon-maskable-512.png", "sizes": "512x512", "type": "image/png", "purpose": "maskable"},
    ],
}


def icon_version():
    """Huella de los iconos: va como ?v= en las etiquetas del <head>. Safari (y Chrome) guardan el
    favicon en una caché propia por URL que no respeta las cabeceras HTTP; si cambia el icono,
    cambia la URL y lo vuelven a pedir."""
    import hashlib

    digest = hashlib.sha256()
    for source in sorted(set(ICONOS.values())) + ["favicon-16.png"]:
        digest.update((GEN / source).read_bytes())
    return digest.hexdigest()[:8]


def apply_icons():
    from PIL import Image

    for name, source in ICONOS.items():
        shutil.copy(GEN / source, OUT / name)
    # /favicon.ico (navegadores y buscadores lo piden aunque la página declare otro): las tres
    # medidas dibujadas a píxel, no una reducción de la grande.
    small = {size: Image.open(GEN / f"favicon-{size}.png").convert("RGBA") for size in (16, 32, 48)}
    small[48].save(OUT / "favicon.ico", sizes=[(16, 16), (32, 32), (48, 48)], append_images=[small[16], small[32]])
    v = icon_version()
    manifest = json.loads(json.dumps(MANIFEST))
    for icon in manifest["icons"]:
        icon["src"] += f"?v={v}"
    (OUT / "site.webmanifest").write_text(json.dumps(manifest, indent=2, ensure_ascii=False) + "\n", encoding="utf-8")


def mark_svg_28(fill="rgb(255,255,255)"):
    """Símbolo de Banteq para el botón redondo de la cabecera (mismo viewBox que el original)."""
    from assets import MARK_PATH

    return (
        '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64">'
        f'<path d="{MARK_PATH}" fill="{fill}"></path></svg>'
    )


def apply_nav_logo():
    t = S[NAV_MOD]
    i = t.find("svg:`<svg")
    j = t.find("</svg>`", i) + len("</svg>`")
    assert "M 14.127 0.263" in t[i:j]
    S[NAV_MOD] = t[:i] + f"svg:`{mark_svg_28()}`" + t[j:]
    encoded = (
        mark_svg_28().replace('"', "%22").replace("<", "&lt;").replace(">", "&gt;").replace("#", "%23")
    )
    for rel in html_pages():
        h = S[rel]
        h, n = re.subn(
            r"url\(&quot;data:image/svg\+xml,&lt;svg[^)]*?viewBox=%220 0 28 28%22.*?&lt;/svg&gt;&quot;\)",
            lambda m: f"url(&quot;data:image/svg+xml,{encoded}&quot;)" if "M 14.127 0.263" in m.group(0) else m.group(0),
            h,
            flags=re.S,
        )
        S[rel] = h


def apply_head_images(rel):
    """Iconos en el <head>: los de la plantilla (dos rel=icon por esquema de color, el mismo PNG, y
    el apple-touch-icon) se sustituyen por el juego completo, con ?v= para saltar la caché de
    favicons de Safari cuando cambien."""
    v = icon_version()
    tags = (
        f'<link rel="icon" href="/favicon.ico?v={v}" sizes="16x16 32x32 48x48">'
        f'<link rel="icon" href="/favicon.png?v={v}" type="image/png" sizes="32x32">'
        f'<link rel="icon" href="/icon-192.png?v={v}" type="image/png" sizes="192x192">'
        f'<link rel="apple-touch-icon" href="/apple-touch-icon.png?v={v}" sizes="180x180">'
        f'<link rel="manifest" href="/site.webmanifest?v={v}">'
    )
    h = S[rel]
    h, n = re.subn(r'<link href="[^"]*" rel="icon" media="\(prefers-color-scheme: light\)">\s*', "", h)
    h, m = re.subn(r'<link href="[^"]*" rel="icon" media="\(prefers-color-scheme: dark\)">\s*', "", h)
    h, k = re.subn(r'<link rel="apple-touch-icon" href="[^"]*">', tags, h)
    # Las páginas de la web llevan las tres; los HTML auxiliares de terceros, ninguna.
    assert (n, m, k) in ((1, 1, 1), (0, 0, 0)), f"{rel}: etiquetas de iconos inesperadas {(n, m, k)}"
    S[rel] = h


def apply_feature_cards():
    """Tarjetas grandes de 'Desarrollo web': enlazan a cada proyecto; RentUp lleva su propio logo."""
    t = S[HOME_MOD]
    yt = "b8x8mNBgl:`https://www.youtube.com/watch?v=8AHPXm9Y6mI`"
    assert t.count(yt) == 2, t.count(yt)
    t = t.replace(yt + ",gUHaHW81l:`Margon", "b8x8mNBgl:`/proyectos/margon`,gUHaHW81l:`Margon")
    t = t.replace(
        yt + ",gUHaHW81l:`RentUp",
        "b8x8mNBgl:`/proyectos/rentup-capital`,lq_IYm4wR:Ku({pixelHeight:128,pixelWidth:636,"
        "src:`../../../framerusercontent.com/images/banteq-rentup-logo-blanco.png`,"
        "srcSet:`../../../framerusercontent.com/images/banteq-rentup-logo-blanco.png 636w`},`RentUp Capital`),"
        "gUHaHW81l:`RentUp",
    )
    assert yt not in t
    S[HOME_MOD] = t
    # Primera pintura: logo de RentUp en su tarjeta (la segunda que usa el logo de la plantilla).
    h = S[INDEX]
    a, b = section_range_html(INDEX, "Testimonial Section")
    seg = h[a:b]
    k = seg.find(">RentUp Capital: web y formularios conectados<")
    start = seg.rfind('data-framer-name="Logo"', 0, k)
    assert 0 <= start < k, "No se encuentra el logo de la tarjeta de RentUp en el HTML"
    piece = seg[start:k].replace("tQe8KYZERtfj6dEWPfoEV61M2Q_1.png", "banteq-rentup-logo-blanco.png").replace(
        "tQe8KYZERtfj6dEWPfoEV61M2Q.png", "banteq-rentup-logo-blanco.png")
    seg = seg[:start] + piece + seg[k:]
    S[INDEX] = h[:a] + seg + h[b:]


MARQUEE_LABEL = "Empresas que ya confían en Banteq"


def apply_hero_marquee():
    """Carrusel del hero: logos de los clientes reales en lugar de los logos de ejemplo."""
    t = S[HOME_MOD]
    i = t.find("slots:[", t.find(",Eo=G(_(function"))
    j = jsx.match_bracket(t, i + len("slots:"))
    label = (
        "g(`div`,{style:{display:`flex`,alignItems:`center`,height:32,flexShrink:0,whiteSpace:`nowrap`,"
        "fontFamily:`Geist, sans-serif`,fontSize:15,fontWeight:500,letterSpacing:`0.08em`,"
        f"textTransform:`uppercase`,color:`rgba(255,255,255,0.72)`}},children:`{MARQUEE_LABEL}`}})"
    )
    logo = lambda src, h, alt: (
        f"g(`div`,{{style:{{display:`flex`,alignItems:`center`,height:32,flexShrink:0}},"
        f"children:g(`img`,{{src:`/banteq/logos/{src}`,alt:`{alt}`,height:{h},style:{{height:{h},width:`auto`,display:`block`,opacity:.9}}}})}})"
    )
    slots = [label, logo("margon-white.png", 22, "Margon"), logo("rentup-white.png", 26, "RentUp Capital")]
    S[HOME_MOD] = t[:i] + "slots:[" + ",".join(slots * 2) + "]" + t[j:]


HERO_VIDEO = "framerusercontent.com/assets/b3Bk2z34loWAeMvpX7fNvAf275A.mp4"
HERO_B = ["hero-b.mp4", "hero-b-movil.mp4", "hero-b-poster.jpg", "hero-b-movil-poster.jpg", "hero-b-mask.png"]


def apply_hero_b():
    """Fondo del hero: la B líquida (vídeo de Higgsfield, tools/hero_b.py) en lugar de la forma de
    la plantilla. El póster pinta la B desde el primer instante; banteq-liquid.js añade el cursor."""
    for name in HERO_B:
        shutil.copy2(GEN / name, OUT / "banteq" / name)
    # Vídeo y póster según el ancho ya en las props del componente: si Framer vuelve a crear el
    # <video> al hidratar, lo hace con el del móvil y el teléfono no descarga el de escritorio.
    # El póster va también en el componente: si no, al hidratar desaparece y hay un instante sin B.
    movil = "(typeof matchMedia<`u`&&matchMedia(`(max-width: 809.98px)`).matches)"
    replace(HOME_MOD, f"posterEnabled:!0,srcFile:`../../../{HERO_VIDEO}`",
            f"poster:{movil}?`/banteq/hero-b-movil-poster.jpg`:`/banteq/hero-b-poster.jpg`,posterEnabled:!0,"
            f"srcFile:{movil}?`/banteq/hero-b-movil.mp4`:`/banteq/hero-b.mp4`")
    # Sin atributo poster en el HTML: el navegador lo pediría antes de saber si es móvil. El póster
    # lo pinta banteq.css como fondo del <video>, con el de cada tamaño por media query.
    replace(INDEX, f'<video src="/{HERO_VIDEO}"', '<video src="/banteq/hero-b.mp4"')
    # Al principio del <head> (lleva ~300 KB de CSS en línea): así el póster y la fuente se piden
    # en cuanto llegan los primeros bytes y ya están cuando se pinta la portada por primera vez.
    h = S[INDEX]
    S[INDEX] = h.replace("<head>", "<head>" + PRELOAD_POSTERS, 1)
    # El script principal de Framer es async y va después de #main: este script en línea, justo tras
    # #main, elige el vídeo del móvil antes de que Framer pueda arrancarlo (así el móvil no descarga
    # también el de escritorio). banteq-liquid.js mantiene la elección si luego cambia el tamaño.
    replace(INDEX, '<div id="__framer-badge-container">', HERO_SOURCE_SCRIPT + '<div id="__framer-badge-container">')
    (OUT / HERO_VIDEO).unlink()


PRELOAD_POSTERS = (
    '<link rel="preload" as="image" href="/banteq/hero-b-poster.jpg" media="(min-width: 810px)">'
    '<link rel="preload" as="image" href="/banteq/hero-b-movil-poster.jpg" media="(max-width: 809.98px)">'
    # Geist (latín, fuente variable: un solo archivo para todos los pesos). Sin esto llega después
    # del primer pintado y el titular salta unos píxeles al cambiar de la fuente de reserva.
    '<link rel="preload" as="font" type="font/woff2" crossorigin href="/fonts.gstatic.com/s/geist/v5/gyByhwUxId8gMEwcGFU.woff2">'
)
HERO_SOURCE_SCRIPT = (
    "<script>(function(){var v=document.querySelector('[data-framer-name=\"Hero Section\"] "
    "[data-framer-name=\"Background\"] video');if(v&&matchMedia('(max-width: 809.98px)').matches)"
    "{v.src='/banteq/hero-b-movil.mp4';v.dataset.banteqSrc='movil';v.dataset.banteqPrevio='1'}})()</script>"
)


def apply_cuadro():
    """Cuadrado central de «Quiénes somos» (tools/contenido.py → CUADRO_CENTRAL). El aspecto (tamaño,
    fondo, logo) está en banteq.css; si hay vídeo, banteq.js lo coloca encima del logo."""
    cfg = C.CUADRO_CENTRAL
    shutil.copy2(GEN / cfg["logo"], OUT / "banteq" / "cuadro-logo.png")
    if cfg.get("video"):
        data = {"video": f"/banteq/{cfg['video']}", "poster": f"/banteq/{cfg['poster']}" if cfg.get("poster") else None}
        for name in (cfg["video"], cfg.get("poster")):
            assert not name or (OUT / "banteq" / name).exists(), f"falta assets-banteq/web/{name}"
        S[INDEX] = S[INDEX].replace("</head>", f"<script>window.BANTEQ_CUADRO={json.dumps(data)}</script></head>", 1)


PIE_VIDEO = "framerusercontent.com/assets/S4N88TVzCfxigg9YZYcSIYNPk4.mp4"


def apply_performance():
    """Arreglos medidos con trazas de Chrome (ver README, «Rendimiento»). No cambian nada visible."""
    # El botón de reproducir de «Quiénes somos» está oculto (la imagen no es un vídeo), pero su
    # componente Magnetic Hover mantenía un requestAnimationFrame perpetuo que en cada fotograma
    # leía getComputedStyle y reescribía una hoja de estilos (60 recálculos de estilo por segundo
    # en toda la página), y un mousemove global que forzaba layout. Se deja inerte.
    replace(HOME_MOD, "a=ae.current()===ae.canvas,o=Tr()", "a=!0,o=Tr()")
    replace(HOME_MOD, "return x.addEventListener(`mousemove`,t),()=>x.removeEventListener(`mousemove`,t)", "return()=>{}")
    # Reveal Text importaba Urbanist de Google Fonts en todas las visitas aunque la instancia usa
    # Geist: petición a terceros inútil (y datos a Google).
    replace(HOME_MOD, "@import url('https://fonts.googleapis.com/css2?family=Urbanist:wght@400&display=swap');", "")
    # Smooth scroll (Lenis): observaba todo el árbol DOM y, en cada nodo que Framer añade al hacer
    # scroll, recorría la página con querySelector buscando un atributo que la web no usa.
    replace(SHARED_MOD, "t.observe(document.documentElement,{childList:!0,subtree:!0,attributes:!0,attributeFilter:[`data-frameruni-stop-scroll`]}),", "")
    # Scroll nativo en lugar del suavizado de Lenis. Lenis movía la página desde JavaScript en cada
    # fotograma: cualquier trabajo del hilo principal (animaciones ligadas al scroll, entrada de
    # secciones) se convertía en un tirón del propio scroll. El scroll nativo lo hace el compositor
    # del navegador, en otro hilo, y sigue fluido aunque el hilo principal esté ocupado. Los enlaces
    # a secciones siguen desplazándose con suavidad (scrollIntoView de Framer).
    replace(SHARED_MOD, "if(typeof j!=`function`){console.error(`Lenis is not available`);return}", "return;")
    # Sin Lenis sobra también su barrido inicial: getComputedStyle de los ~2.400 elementos de la página.
    replace(SHARED_MOD, "let e=document.getElementsByTagName(`*`);", "let e=[];")
    # Restauración del scroll de Framer: guardaba la posición con history.replaceState en cada
    # «scrollend», que con Lenis llega en cada fotograma. Ahora se guarda cuando el scroll se detiene.
    replace(FRAMER_MOD, "if(!(`onscrollend`in M))", "if(!0)")
    # Cursores personalizados de Framer: la web no tiene ninguno (todas las páginas registran {}),
    # pero el gestor mantenía una lectura en cada fotograma. Mientras los tickers de «Conectamos tus
    # herramientas» están en pantalla, eso obligaba al hilo principal a producir un fotograma por
    # refresco para actualizar sus animaciones (tirones). Ahora solo mira al mover el puntero.
    replace(FRAMER_MOD, "je.read(u,!0),e=n.clientX", "je.read(u),e=n.clientX")
    replace(FRAMER_MOD, "document.addEventListener(`pointerup`,f),je.read(u,!0)", "document.addEventListener(`pointerup`,f),je.read(u)")
    # El mismo gestor, en cada pointermove, arrancaba una animación de 0,2 s de la opacidad del cursor
    # (inexistente): mientras se mueve el ratón, el bucle de Framer trabajaba en cada fotograma, en
    # toda la web. Sin cursores registrados el movimiento se ignora; si alguno se registrara, vuelve
    # a funcionar con el siguiente movimiento.
    replace(FRAMER_MOD, "function d(n){if(n.pointerType===`touch`){Ie(u);return}je.read(u),",
            "function d(n){if(Qe(s.current.cursors))return;if(n.pointerType===`touch`){Ie(u);return}je.read(u),")
    # Hover (medido con movimiento continuo del cursor, ver README «Rendimiento durante el hover»).
    # Botón central de «Conectamos tus herramientas»: su variante de hover la animaba Framer Motion
    # por JavaScript (degradado de fondo y sombra interior de 40 px, un repintado completo del círculo
    # en cada fotograma, además de un re-render de React al entrar y al salir). En WebKit era el
    # grueso de los fotogramas de 40–90 ms. Ahora el hover es CSS (banteq.css): la misma apariencia
    # final en una capa que solo cambia de opacidad.
    replace(HOME_MOD, "Ss={kjCYFr2ql:{hover:!0}}", "Ss={}")
    # Tiras en bucle (herramientas, palabras de «Quiénes somos», logos del hero): al entrar o salir el
    # cursor de una tira se reasignaba playbackRate a la animación (con hoverFactor 1, al mismo
    # valor), lo que en WebKit la reposiciona y la vuelve a enviar al compositor. Sin efecto visible.
    replace(HOME_MOD, ",onMouseEnter:()=>{be.current=!0,G.current&&(G.current.playbackRate=x)},"
                      "onMouseLeave:()=>{be.current=!1,G.current&&(G.current.playbackRate=1)}", "")
    # Ticker de Framer (tiras de «Conectamos tus herramientas», carrusel de palabras y logos del
    # hero). Al entrar o salir de pantalla cambiaba un estado de React que volvía a renderizar toda
    # la tira y ponía o quitaba will-change en cada copia de cada elemento: el navegador creaba y
    # destruía decenas de capas de golpe (medido en WebKit: fotogramas de 40–75 ms al entrar).
    # Ahora cada tira es una sola capa estable que se mueve con una animación de compositor; la pausa
    # fuera de pantalla la hace banteq.js sin tocar React.
    replace(HOME_MOD, "let ye=oe?!0:C(B);", "let ye=!0;")
    replace(HOME_MOD, "willChange:ye?`transform`:void 0", "willChange:void 0")
    # Una sola copia extra (lo justo para el bucle) y el recorrido de un periodo: capas un tercio
    # más pequeñas y menos nodos, con la misma velocidad.
    replace(HOME_MOD, "!oe&&le&&pe.parent&&(ge=Math.round(pe.parent/pe.children*2)+1,ge=Math.min(ge,pr),U=1)",
            "!oe&&le&&pe.parent&&(ge=Math.max(1,Math.ceil(pe.parent/pe.children)),ge=Math.min(ge,pr),U=1)")
    replace(HOME_MOD, "let W=pe.children+pe.children*Math.round(pe.parent/pe.children);", "let W=pe.children;")
    # Vídeo del pie: 4K en H.264 4:2:2 de 10 bits, que ningún Mac ni iPhone decodifica por hardware.
    # Se sirve en 1080p 4:2:0 de 8 bits (tools/videos.py), con el mismo nombre.
    shutil.copy2(GEN / "pie-video.mp4", OUT / PIE_VIDEO)


def copy_logos():
    dst = OUT / "banteq" / "logos"
    dst.mkdir(parents=True, exist_ok=True)
    for name in ("margon-white.png", "rentup-white.png", "margon-dark.png", "rentup-dark.png"):
        shutil.copy(GEN / name, dst / name)


# ---------------------------------------------------------------------------
# 6. Proyectos (CMS de Framer)
# ---------------------------------------------------------------------------

CMS_DIRS = [SITE, "framerusercontent.com/cms/4vmvXLwOaYKa4yez469o/S2CsbvEsNOqyxIhbyKUP"]
COLLECTION_MODS = [f"{SITE}/z9TJQq07u.Bq8zfRx3.mjs", "framerusercontent.com/modules/4vmvXLwOaYKa4yez469o/S2CsbvEsNOqyxIhbyKUP/z9TJQq07u.js"]
CAMPOS_NUEVOS = {"bqAno": "ano", "bqCliente": "cliente", "bqSector": "sector", "bqServicios": "servicios"}


def _img(name, w, h, alt):
    import framercms as fc

    # Sin srcSet: el mapa de URLs de la exportación sólo reescribe src a la copia local.
    url = f"https://framerusercontent.com/images/{name}?width={w}&height={h}"
    return (fc.IMAGE, {"src": url, "pixelWidth": w, "pixelHeight": h, "alt": alt})


def _rich(*nodes):
    import framercms as fc

    return (fc.RICHTEXT, json.dumps([1, *nodes], ensure_ascii=False, separators=(",", ":")))


def _p(text):
    return [4, "p", {"dir": "auto"}, [5, text]]


def _li(*children):
    return [4, "li", {"data-preset-tag": "p"}, [4, "p", None, *children]]


def _ul(items):
    return [4, "ul", {"dir": "auto"}, *items]


def build_cms():
    import framercms as fc

    src_chunk = (SRC / SITE / "z9TJQq07u-chunk-default-0.framercms").read_bytes()
    src_index = (SRC / SITE / "z9TJQq07u-indexes-default-0.framercms").read_bytes()
    template = fc.read_chunk(src_chunk)
    ids = [template[0]["id"][1], template[1]["id"][1]]
    items = []
    for k, pr in enumerate(C.PROYECTOS):
        f = {"id": (fc.STRING, ids[k]), "createdAt": template[k]["createdAt"], "updatedAt": template[k]["updatedAt"]}
        if k > 0:
            f["previousItemId"] = (fc.STRING, ids[k - 1])
        if k < len(C.PROYECTOS) - 1:
            f["nextItemId"] = (fc.STRING, ids[k + 1])
        intro, puntos = pr["reto"]
        f.update({
            "Lsqa3XOW1": (fc.STRING, pr["titulo"]),
            "M01tXmL0I": (fc.STRING, pr["slug"]),
            "Jt1zju2Et": (fc.STRING, pr["descripcion"]),
            "dtN9EfA78": _img(pr["logo"], 276, 64, pr["cliente"]),
            "QMqIceaci": _img(pr["tarjeta"], 762, 720, f"Web de {pr['cliente']}"),
            "WChCcVerq": _rich(_p(intro), _ul([_li([4, "strong", None, [5, b]], [5, t]) for b, t in puntos])),
            "K38eBSYv6": _img(pr["cabecera"], 1280, 720, f"Web de {pr['cliente']}"),
            "x9lUzv3W9": _rich(_p(pr["solucion"])),
        })
        img_keys = ["jfokI0GXU", "Xs39mdCt1", "IebmUOGpn", "Qghb15JDR"]
        txt_keys = ["iSQhmrVZ1", "hltPHUpPj", "YU9CYGq4j", "VYa5mDerr"]
        for (titulo, puntos_b), ik, tk, im in zip(pr["bloques"], img_keys, txt_keys, pr["bloques_img"]):
            f[ik] = _img(im, 616, 480, titulo)
            f[tk] = _rich([4, "p", {"dir": "auto"}, [4, "strong", None, [5, titulo]]], _ul([_li([5, x]) for x in puntos_b]))
        f["VP5uhfljk"] = _rich(_p(pr["resultado"]))
        for (valor, nombre), kv, kn in zip(pr["metricas"], ["HuRupB55d", "sIAhHzqTY", "jNEfZPTBj"], ["wx9y36BaQ", "zTKG0DlAJ", "qlPM_T3ez"]):
            f[kv] = (fc.STRING, valor)
            f[kn] = (fc.STRING, nombre)
        for campo, clave in CAMPOS_NUEVOS.items():
            f[campo] = (fc.STRING, pr[clave])
        items.append(f)

    chunk, pointers = fc.write_chunk(items)
    index_defs = fc.read_indexes(src_index)
    index, ranges = fc.write_indexes(index_defs, items, pointers)
    for d in CMS_DIRS:
        for suffix in ("", "_1"):
            (OUT / d / f"z9TJQq07u-chunk-default-0{suffix}.framercms").write_bytes(chunk)
            (OUT / d / f"z9TJQq07u-indexes-default-0{suffix}.framercms").write_bytes(index)

    for rel in COLLECTION_MODS:
        t = S[rel]
        found = re.findall(r"range:\{from:\d+,to:\d+\}", t)
        assert len(found) == len(ranges), (rel, len(found), len(ranges))
        it = iter(ranges)
        t = re.sub(r"range:\{from:\d+,to:\d+\}", lambda m: "range:{from:%d,to:%d}" % next(it), t)
        t, n = re.subn(
            r"(createdAt:\{isNullable:!0,type:(\w+)\.Date\},)",
            lambda m: m.group(1) + "".join(f"{c}:{{isNullable:!0,type:{m.group(2)}.String}}," for c in CAMPOS_NUEVOS),
            t,
            count=1,
        )
        S[rel] = t
    # Las imágenes nuevas del CMS se resuelven a local con el mapa de URLs de cada página.
    extra = ",".join(f'"images/{Path(n).stem}":"framerusercontent.com/images/{n}"' for n in NUEVAS)
    for rel in html_pages():
        S[rel] = S[rel].replace("var m = {", "var m = {" + extra + ",", 1)


def apply_project_pages():
    for old, new in C.PAGINA_PROYECTO:
        replace(DETAIL_MOD, old, new)
    t = S[DETAIL_MOD]
    # Campos nuevos del CMS en la consulta y en las variables de la página.
    i = t.find("select:[", t.find("Q=e=>({from:{alias:`QTC5sKvau`"))
    j = jsx.match_bracket(t, i + len("select:"))
    extra = "".join(f",{{collection:`QTC5sKvau`,name:`{c}`,type:`Identifier`}}" for c in CAMPOS_NUEVOS)
    t = t[: j - 1] + extra + t[j - 1:]
    anchor = "qlPM_T3ez:Ce=_(`qlPM_T3ez`)??``,"
    assert anchor in t
    t = t.replace(anchor, anchor + "".join(f"{c}:${c}=_(`{c}`)??``," for c in CAMPOS_NUEVOS))
    for old, var in (("8 weeks", "$bqAno"), ("OneFin", "$bqCliente"), ("Fintech", "$bqSector"),
                     ("Custom AI Integrations, AI Workflow Automation, Internal Tooling", "$bqServicios"),
                     ("We analyze company workflows, bottlenecks, and revenue opportunities.", "D")):
        n = t.count(f"children:`{old}`")
        if not n:
            MISSES.append((DETAIL_MOD, old))
        t = t.replace(f"children:`{old}`", f"children:{var}")
    S[DETAIL_MOD] = t
    for old, new in C.PAGINA_PROYECTOS:
        replace(CASES_MOD, old, new)
    for old, new in C.TARJETA_PROYECTO:
        replace(CARD_MOD, old, new, required=False)
    for old, new in C.PAGINA_CONTACTO:
        replace(CONTACT_MOD, old, new)
    for old, new in C.PAGINA_404:
        replace(NOTFOUND_MOD, old, new)
    replace(f"{SITE}/3KB8JVX0XPCELUYDCiu6xYPRdLRb6m_91NISrPoGRD0.DdsJ13Uw.mjs", "} - Conicorn`", "} | Banteq`")
    for rel, textos in ((TERMS_MOD, C.AVISO_LEGAL), (PRIVACY_MOD, C.PRIVACIDAD)):
        src = (SRC / rel).read_text(encoding="utf-8")
        originales = list(dict.fromkeys(re.findall(r"children:`([^`$]{2,900})`", src)))
        assert len(originales) == len(textos), (rel, len(originales), len(textos))
        for old, new in sorted(zip(originales, textos), key=lambda p: -len(p[0])):
            replace(rel, f"children:`{old}`", f"children:`{js_template(new)}`")


# ---------------------------------------------------------------------------
# 7. Páginas que Framer pinta en el navegador
# ---------------------------------------------------------------------------

PAGINAS = {
    "contacto": ("Contacto | Banteq", "Cuéntanos qué quieres mejorar en tu empresa: automatización, inteligencia artificial, Microsoft Copilot, formación FUNDAE o tu web."
                 if C.MOSTRAR_COPILOT_FUNDAE else "Cuéntanos qué quieres mejorar en tu empresa: automatización, inteligencia artificial o tu web."),
    "proyectos": ("Proyectos | Banteq", "Empresas que ya confían en Banteq y el trabajo que hemos hecho con ellas."),
    "aviso-legal": ("Aviso legal | Banteq", C.META_DESCRIPTION),
    "privacidad": ("Política de privacidad | Banteq", C.META_DESCRIPTION),
    "404": ("Página no encontrada | Banteq", C.META_DESCRIPTION),
}


def make_shells():
    """La exportación sólo trae la home pre-renderizada; el resto de rutas las pinta el router
    de Framer en el navegador. Cada ruta recibe un HTML con la cabecera y los estilos de la home,
    sin datos de hidratación y con el contenedor vacío, para que no se vea la home un instante."""
    h = S[INDEX]
    h = re.sub(r' data-framer-hydrate-v2="[^"]*"', "", h, count=1)
    i = h.find('<div id="main"')
    start = h.find(">", i) + 1
    end = html_element_extent(h, i, "div")
    # #main queda vacío (sin la home ni su pie) y bien cerrado: Framer lo pinta con createRoot.
    shell = h[:start] + "</div>" + h[end:]
    shell = shell.replace(PRELOAD_POSTERS, "").replace(HERO_SOURCE_SCRIPT, "")
    pages = dict(PAGINAS)
    for pr in C.PROYECTOS:
        pages[f"proyectos/{pr['slug']}"] = (f"{pr['titulo']} | Banteq", pr["descripcion"])
    for path, (title, desc) in pages.items():
        page = re.sub(r"<title>[^<]*</title>", f"<title>{html.escape(title)}</title>", shell)
        page = re.sub(r'(<meta name="description" content=")[^"]*(")', lambda m: m.group(1) + html.escape(desc) + m.group(2), page)
        S[f"{path}/index.html"] = page
    # Para rutas que no existen el servidor entrega 404.html; el router de Framer sólo pinta su
    # página 404 si la URL es /404, así que se ajusta antes de que arranque.
    S["404.html"] = S["404/index.html"].replace(
        "<head>", "<head><script>location.pathname!=='/404'&&history.replaceState(null,'','/404')</script>", 1
    )


COPILOT_CARD = (
    "Microsoft Copilot.",
    " Resúmenes de correos y reuniones, documentos y análisis en Outlook, Teams, Word y Excel, con tu equipo formado para usarlo.",
)
# Mientras Copilot no se ofrece (contenido.MOSTRAR_COPILOT_FUNDAE), la misma tarjeta presenta un
# servicio que la web ya describe en «Conectamos tus herramientas» y en el proceso: así la cuadrícula
# no queda con un hueco.
CONEXION_CARD = (
    "Conexión entre herramientas.",
    " Correo, Drive, Excel, CRM, ERP o WhatsApp conectados entre sí, para que la información pase de una a otra sin copiar y pegar.",
)


def fix_duplicate_service_card():
    """La plantilla repetía la tarjeta de chatbots; la quinta (ilustración del arco) pasa a Copilot."""
    old_title = "Asistentes de inteligencia artificial."
    old_body = [t[1] for t in C.HOME if t[0].startswith("24/7 customer support")][0]
    new_title, new_body = COPILOT_CARD if C.MOSTRAR_COPILOT_FUNDAE else CONEXION_CARD
    for rel in (HOME_MOD, INDEX):
        text = S[rel]
        a, b = section_range_js("Service Section") if rel == HOME_MOD else section_range_html(rel, "Service Section")
        seg, out, pos, n = text[a:b], [], 0, 0
        while True:
            k = seg.find(old_title, pos)
            if k < 0:
                break
            ahead = seg[k:k + 6000]
            arc, chat = ahead.find("8U1vJYm3i4TejPV6zUq2qL12tAU"), ahead.find("JoLUJzWcifYswzE6msfHXW4QOg")
            if arc >= 0 and (chat < 0 or arc < chat):
                out.append(seg[pos:k] + new_title)
                pos = k + len(old_title)
                body_at = seg.find(old_body, pos, pos + 400)
                if body_at >= 0:
                    out.append(seg[pos:body_at] + new_body.strip() if seg[body_at - 1] != " " else seg[pos:body_at] + new_body.strip())
                    pos = body_at + len(old_body)
                n += 1
            else:
                out.append(seg[pos:k + len(old_title)])
                pos = k + len(old_title)
        out.append(seg[pos:])
        if not n:
            MISSES.append((rel, "tarjeta Copilot"))
        S[rel] = text[:a] + "".join(out) + text[b:]


def fix_prerendered_leftovers():
    """Textos que el HTML pre-renderizado guarda de otra forma que el módulo JS."""
    hero_old = "We build AI-powered automation systems that eliminate manual work, reduce costs, and multiply your business performance."
    hero_new = {t[0]: t[1] for t in C.HOME}[hero_old]
    split_heading_html(INDEX, hero_old, hero_new)
    # Tarjetas de ejemplo del carrusel de proyectos (el runtime las sustituye por las del CMS).
    m, r = C.PROYECTOS
    pares = [
        ("AI Property Inquiry Chatbot for Real Estate Firms", m["titulo"]),
        ("An intelligent chatbot that qualifies property inquiries, answers buyer questions, and schedules viewings.", m["descripcion"]),
        ("AI Project Management Automation for Creative Teams", r["titulo"]),
        ("Streamlining project coordination and task assignments for faster delivery and smoother collaboration.", r["descripcion"]),
        ("AI Workflow Automation for Finance SaaS Company", m["titulo"]),
        ("We analyze real estate workflows, identify operational bottlenecks, and uncover revenue opportunities.", m["descripcion"]),
        (">Lead Response<", ">Idiomas<"), (">View Bookings<", ">Sectores<"), (">Engagement<", ">Experiencia interactiva<"),
        (">Faster Delivery<", ">Páginas<"), (">Admin Work<", ">Formularios conectados<"), (">Productivity<", ">Herramientas integradas<"),
        (">Demo Booking<", ">Idiomas<"), (">Closing Rate<", ">Sectores<"),
    ]
    for old, new in pares:
        replace(INDEX, old, new, required=False)
    # Sello de Framer (oculto por CSS, pero su texto estaba en el HTML).
    h = S[INDEX]
    i = h.find('<div id="__framer-badge-container"')
    if i >= 0:
        j = html_element_extent(h, i, "div")
        h = h[:i] + '<div id="__framer-badge-container"></div>' + h[j:]
    S[INDEX] = h
    # El runtime hidrataba el sello sobre ese HTML: vacío, React daba error de hidratación
    # (#418/#423) en todas las páginas. Sin sello, no se monta.
    replace(
        MAIN_MOD,
        "(function(){Q&&a(()=>{x(document.getElementById(`__framer-badge-container`),"
        "f(m,{},f(p(()=>import(`./PX9hIOIVM.Bh3Sw9Ys.mjs`)))))})})()",
        "(function(){})()",
    )


def remove_child_call(rel, start, end):
    """Quita una llamada JSX de un array children:[…] junto con la coma que la separa."""
    t = S[rel]
    if t[end:end + 1] == ",":
        end += 1
    elif t[start - 1:start] == ",":
        start -= 1
    else:
        raise AssertionError(f"{rel}: la llamada no es un elemento de una lista")
    S[rel] = t[:start] + t[end:]


def hide_copilot_fundae():
    """Microsoft Copilot y FUNDAE (contenido.MOSTRAR_COPILOT_FUNDAE = False). Todo se construye con sus
    textos, enlaces y numeración, y aquí se quita del módulo de la home y del HTML a la vez (si solo
    se quitara de uno, React daría error de hidratación). Volver a mostrarlo es cambiar la bandera."""
    if C.MOSTRAR_COPILOT_FUNDAE:
        return
    for name in C.SECCIONES_OCULTAS:
        remove_child_call(HOME_MOD, *section_range_js(name))
        a, b = section_range_html(INDEX, name)
        S[INDEX] = S[INDEX][:a] + S[INDEX][b:]
    # Pregunta frecuente sobre FUNDAE: es la última de la lista, así que no queda hueco.
    pregunta = {t[0]: t[1] for t in C.HOME}["What kind of ROI can we expect?"]
    t = S[HOME_MOD]
    item = jsx.call_containing(t, t.find(f"`{pregunta}`"))
    container = jsx.call_containing(t, item[0] - 1)
    wrapper = jsx.call_containing(t, container[0] - 1)
    cls = re.match(r"g\(\w+,\{className:`(framer-[a-z0-9]+-container)`", t[container[0]:]).group(1)
    remove_child_call(HOME_MOD, *wrapper)
    h = S[INDEX]
    k = h.find(html.escape(pregunta, quote=False))
    a = h.rfind(f'<div class="{cls}"', 0, k)
    assert a >= 0, "No se encuentra la pregunta de FUNDAE en el HTML"
    S[INDEX] = h[:a] + h[html_element_extent(h, a, "div"):]
    for rel in (HOME_MOD, INDEX):
        # Nombres internos de capas que heredaron esos textos (no se ven, pero van en el código).
        S[rel] = re.sub(r'data-framer-name="[^"]*(?:Copilot|FUNDAE|simulador)[^"]*"', 'data-framer-name="Texto"', S[rel])
        S[rel] = re.sub(r'"data-framer-name":`[^`]*(?:Copilot|FUNDAE|simulador)[^`]*`', '"data-framer-name":`Texto`', S[rel])
    # Las tarjetas de la sección son componentes aparte: ya no se pintan, pero su texto seguía en el
    # módulo publicado. Se vacía (al volver a mostrarlo, el build los genera de nuevo).
    S[HOME_MOD] = re.sub(r"`[^`$\\]*(?:Copilot|FUNDAE|fundae)[^`$\\]*`", "``", S[HOME_MOD])
    for rel in (HOME_MOD, INDEX):
        assert not re.search(r"(?i)copilot|fundae", S[rel]), f"{rel}: queda Copilot o FUNDAE"


LIMPIEZA = [
    ("© Conicorn 2026 | License | Powered by Webflow", "Copyright"),
    ("1. About Conicorn", "Apartado 1"),
    ("(Founder of Conicorn)", "(Banteq)"),
    ("N!nh Logo", "Credito"),
    ("children:`N!nh`", "children:``"),
    (">N!nh<", "><"),
    ("href:`ninhstudio.com`", "href:`/`"),
    ('href="https://ninhstudio.com/"', 'href="/"'),
]


def final_cleanup():
    """Nombres internos de capas y restos no visibles de la plantilla."""
    for p in list(OUT.rglob("*.mjs")) + list(OUT.rglob("*.html")):
        rel = p.relative_to(OUT).as_posix()
        text = S[rel]
        if not any(old in text for old, _ in LIMPIEZA) and "onicorn" not in text:
            continue
        for old, new in LIMPIEZA:
            text = text.replace(old, new)
        text = re.sub(r'"data-framer-name":`[^`]*[Cc]onicorn[^`]*`', '"data-framer-name":`Texto`', text)
        text = re.sub(r'data-framer-name="[^"]*[Cc]onicorn[^"]*"', 'data-framer-name="Texto"', text)
        S[rel] = text
    for p in (OUT / SITE).glob("searchIndex-*.json"):
        p.unlink()


def html_pages():
    return [p.relative_to(OUT).as_posix() for p in OUT.rglob("index.html")]


OG_IMAGE = "mesMNsTTSgV6Xg1TUfNtMnEGZY.png"  # imagen para compartir en redes: se queda en PNG


def convert_heavy_images():
    """Las PNG de más de 60 KB (capturas de proyectos, tarjetas, retratos de la plantilla) pasan a
    WebP, que pesa bastante menos con el mismo aspecto, y se cambian todas sus referencias."""
    from PIL import Image

    renamed = {}
    for png in sorted((OUT / "framerusercontent.com" / "images").glob("*.png")):
        if png.name == OG_IMAGE or png.stat().st_size < 60_000:
            continue
        webp = png.with_suffix(".webp")
        im = Image.open(png)
        has_alpha = im.mode in ("RGBA", "LA") or (im.mode == "P" and "transparency" in im.info)
        im.convert("RGBA" if has_alpha else "RGB").save(webp, "WEBP", quality=85, method=6)
        if webp.stat().st_size > png.stat().st_size * 0.8:
            webp.unlink()
            continue
        # La PNG original se queda publicada: una página o caché anterior a la conversión (Safari
        # guarda mucho) aún la pediría, y sin ella saldrían imágenes rotas.
        renamed[png.name] = webp.name
    # Los archivos ya en disco y los generados en este build (páginas de make_shells) aún en memoria.
    on_disk = {p.relative_to(OUT).as_posix() for p in OUT.rglob("*") if p.suffix in (".html", ".mjs", ".js") and p.is_file()}
    rels = sorted(on_disk | {rel for rel in S.files if rel.endswith((".html", ".mjs", ".js"))})
    for rel in rels:
        text = S[rel]
        if ".png" not in text:
            continue
        for old, new in renamed.items():
            text = text.replace(old, new)
        S[rel] = text
    for old in renamed:
        assert all(old not in S[rel] for rel in rels), old
    return renamed


class _TagBalance(HTMLParser):
    VOID = {"area", "base", "br", "col", "embed", "hr", "img", "input", "link", "meta", "source", "track", "wbr"}

    def __init__(self):
        super().__init__(convert_charrefs=True)
        self.stack, self.errors = [], []

    def handle_starttag(self, tag, attrs):
        if tag not in self.VOID:
            self.stack.append(tag)

    def handle_endtag(self, tag):
        if tag in self.VOID:
            return
        if self.stack and self.stack[-1] == tag:
            self.stack.pop()
        else:
            self.errors.append(f"línea {self.getpos()[0]}: </{tag}> cierra <{self.stack[-1] if self.stack else '-'}>")


def check_html_structure():
    """Una etiqueta mal cerrada saca contenido fuera de #main: React no puede hidratar y
    deja copias duplicadas bajo el pie. La exportación original está perfectamente anidada."""
    for rel in [r for r in S.files if r.endswith(".html")]:
        checker = _TagBalance()
        checker.feed(S[rel])
        assert not checker.errors and not checker.stack, f"{rel}: HTML mal anidado — {checker.errors[:3]}"


# ---------------------------------------------------------------------------
# 4. Metadatos
# ---------------------------------------------------------------------------

def apply_meta(rel):
    h = S[rel]
    h = h.replace('<html lang="en"', '<html lang="es"')
    h = re.sub(r"<title>[^<]*</title>", f"<title>{C.META_TITLE}</title>", h)
    for attr in ('name="description"', 'property="og:description"', 'name="twitter:description"'):
        h = re.sub(rf'<meta {attr} content="[^"]*">', f'<meta {attr} content="{html.escape(C.META_DESCRIPTION)}">', h)
    for attr in ('property="og:title"', 'name="twitter:title"'):
        h = re.sub(rf'<meta {attr} content="[^"]*">', f'<meta {attr} content="{html.escape(C.META_TITLE)}">', h)
    S[rel] = h


def apply_shared_meta():
    replace(SHARED_MOD, "Conicorn - AI Automation Agency SaaS Template", C.META_TITLE)
    replace(
        SHARED_MOD,
        "Conicorns is a modern Framer template designed for startups to build beautiful websites, manage workflows, and grow their business.",
        C.META_DESCRIPTION,
    )


# ---------------------------------------------------------------------------

def main():
    copy_template()
    fix_html_paths(INDEX)
    strip_framer_extras(INDEX)
    reorder_sections_js()
    reorder_sections_html(INDEX)
    rename_anchors()
    rename_routes()
    apply_nav_html()
    apply_home_texts()
    apply_section_labels_html()
    apply_integrations()
    apply_nav_footer()
    fix_value_subtitle()
    fix_duplicate_service_card()
    fix_prices()
    fix_links()
    fix_footer()
    fix_new_tab_links()
    fix_cards()
    fix_prerendered_leftovers()
    apply_meta(INDEX)
    apply_shared_meta()
    copy_banteq_static()
    copy_logos()
    apply_images()
    apply_nav_logo()
    apply_feature_cards()
    apply_hero_marquee()
    apply_hero_b()
    apply_performance()
    apply_cuadro()
    build_cms()
    apply_project_pages()
    for rel in html_pages():
        inject_assets(rel)
        apply_head_images(rel)

    hide_copilot_fundae()
    make_shells()
    final_cleanup()
    convert_heavy_images()
    check_html_structure()
    S.save()
    if MISSES:
        print("\nTextos originales NO encontrados:")
        for rel, old in MISSES:
            print(f"  - {Path(rel).name[:24]}: {old[:90]!r}")
        sys.exit(1)
    print("OK →", OUT)


if __name__ == "__main__":
    main()
