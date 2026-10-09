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
    # Logo del menú en el HTML inicial: apuntaba a la carpeta de la exportación (un 404 para quien
    # lea el HTML sin ejecutar JavaScript, como los rastreadores).
    h = h.replace('href="../breathtaking-step-882598.framer.app/index.html"', 'href="/"')
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
    ("© Conicorn 2026 | Built in ", C.PIE_COPYRIGHT),
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
        S[rel] = re.sub("(" + re.escape(C.PIE_COPYRIGHT) + r")<span[^>]*>(?:<a[^>]*>)?Framer(?:</a>)?</span>", r"\1", S[rel])
    apply_service_links()


def apply_service_links():
    """Enlaces a las páginas de servicio desde el menú y el pie de todas las páginas. Sustituyen al
    enlace único «Servicios» (que solo bajaba a la sección de la home): el menú pasa de 3 a 4 filas
    y el pie de 5 a 7 enlaces, con los mismos componentes y clases."""
    t = S[NAV_MOD]
    sv = C.SERVICIOS
    assert len(sv) == 3
    # Menú: la fila «Contacto · Servicios» se convierte en dos filas.
    a = t.find("o(d.div,{className:`framer-f26tnn`,\"data-framer-name\":`Row`")
    assert a > 0 and t.count("o(d.div,{className:`framer-f26tnn`") == 1
    b = jsx.match_bracket(t, a + 1)
    fila = t[a:b]
    contacto = "{href:{webPageId:`mow46yhcP`},implicitPathVariables:void 0}"
    seccion = "{href:{webPageId:`augiA20Il`,hash:`v30xxKYcD`},implicitPathVariables:void 0}"
    assert fila.count(contacto) == 2 and fila.count(seccion) == 2 and "QxmZp6UDH:`Contacto`" in fila and "QxmZp6UDH:`Servicios`" in fila

    def variante(izq, der, fila_id):
        """izq/der: (etiqueta, enlace, id). La fila original es (Contacto, VIYA0mWaJ) · (Servicios, Sqkmy1PTy)."""
        f = fila.replace("K6gMgeQhK", fila_id)
        f = f.replace(contacto, "\0IZQ\0").replace(seccion, "\0DER\0")
        f = f.replace("QxmZp6UDH:`Contacto`", f"QxmZp6UDH:`{izq[0]}`").replace("QxmZp6UDH:`Servicios`", f"QxmZp6UDH:`{der[0]}`")
        f = f.replace("VIYA0mWaJ", izq[2]).replace("Sqkmy1PTy", der[2])
        return f.replace("\0IZQ\0", izq[1]).replace("\0DER\0", der[1])

    enlace = lambda rid: f"{{href:{{webPageId:`{rid}`}},implicitPathVariables:void 0}}"
    fila2 = variante((sv[0]["menu"], enlace(sv[0]["id"]), "bqMnSrv01"), (sv[1]["menu"], enlace(sv[1]["id"]), "bqMnSrv02"), "K6gMgeQhK")
    fila3 = variante((sv[2]["menu"], enlace(sv[2]["id"]), "bqMnSrv03"), ("Contacto", contacto, "VIYA0mWaJ"), "bqMnFila3")
    t = t[:a] + fila2 + "," + fila3 + t[b:]
    # Pie: el enlace «Servicios» se convierte en tres.
    a = t.find("s(U,{", t.rfind("s(U,{", 0, t.find("children:`Servicios`}")))
    b = jsx.match_bracket(t, a + 1)
    bloque = t[a:b]
    assert "href:{webPageId:`augiA20Il`,hash:`v30xxKYcD`}" in bloque and bloque.count("cjjEg1nHt") == 2, "no se encuentra el enlace «Servicios» del pie"
    nuevos = []
    for k, s_ in enumerate(sv, 1):
        nuevos.append(bloque.replace("href:{webPageId:`augiA20Il`,hash:`v30xxKYcD`}", f"href:{{webPageId:`{s_['id']}`}}")
                      .replace("children:`Servicios`", f"children:`{s_['menu']}`").replace("cjjEg1nHt", f"bqPieSrv{k}"))
    S[NAV_MOD] = t[:a] + ",".join(nuevos) + t[b:]
    # Lo mismo en el pie del HTML inicial de la home.
    h = S[INDEX]
    k = h.find(">Servicios</a>")
    a = h.rfind('<div class="framer-inrpaz"', 0, k)
    b = html_element_extent(h, a, "div")
    bloque = h[a:b]
    assert bloque.count('href="/#servicios"') == 1
    S[INDEX] = h[:a] + "".join(bloque.replace('href="/#servicios"', f'href="/{s_["slug"]}"').replace(">Servicios<", f">{s_['menu']}<") for s_ in sv) + h[b:]


def fix_cards():
    replace(CARD_MOD, "`Read More`", "`Ver proyecto`")
    for rel in html_pages():
        replace(rel, ">Read More<", ">Ver proyecto<", required=False)


def inject_assets(rel):
    """Hoja de estilos y script propios de Banteq, cargados después de los de Framer."""
    h = S[rel]
    tag_css = '<link rel="stylesheet" href="/banteq/banteq.css">'
    tag_js = '<script src="/banteq/banteq.js" defer></script><script src="/banteq/banteq-liquid.js" defer></script>'
    # Demos en vídeo de las tarjetas de proyecto: imagen de la tarjeta → vídeo (lo usa banteq.js).
    demos = {Path(pr["tarjeta"]).stem: f"/banteq/{pr['demo']}" for pr in C.PROYECTOS if pr.get("demo")}
    if demos:
        tag_js = f"<script>window.BANTEQ_DEMOS={json.dumps(demos)}</script>" + tag_js
    if tag_css not in h:
        h = h.replace("</head>", f"{tag_css}{tag_js}</head>", 1)
    S[rel] = h


def copy_banteq_static():
    dst = OUT / "banteq"
    if dst.exists():
        shutil.rmtree(dst)
    shutil.copytree(ROOT / "assets-banteq" / "web", dst)
    # Reglas de secciones ocultas (bloques marcados en banteq.css con el nombre de la sección):
    # no se publican; vuelven solas al mostrar la sección.
    css = dst / "banteq.css"
    t = css.read_text(encoding="utf-8")
    for name in C.SECCIONES_OCULTAS:
        t = re.sub(rf"/\* \[{re.escape(name)}\] .*?/\* \[/{re.escape(name)}\] \*/\n\n?", "", t, flags=re.S)
        assert f"[{name}]" not in t, f"banteq.css: bloque de {name} mal cerrado"
    css.write_text(t, encoding="utf-8")


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


# Favicon e iconos, en la raíz del sitio: publicado ← generado (tools/assets.py iconos). Es el logo
# del menú: la B blanca sobre el disco negro.
ICONOS = {
    "favicon.png": "favicon-32.png",  # nombre que ya estaba publicado: se mantiene para páginas en caché
    "favicon-48x48.png": "favicon-48.png",  # Google pide múltiplos de 48 px
    "favicon-96x96.png": "favicon-96.png",
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
    cambia la URL y lo vuelven a pedir. Mientras el icono no cambie, la URL es siempre la misma
    (Google pide que la del favicon sea estable)."""
    import hashlib

    digest = hashlib.sha256()
    for source in sorted(set(ICONOS.values())) + ["favicon-16.png"]:
        digest.update((GEN / source).read_bytes())
    return digest.hexdigest()[:8]


def apply_icons():
    from PIL import Image

    for name, source in ICONOS.items():
        shutil.copy(GEN / source, OUT / name)
    # /favicon.ico (navegadores y buscadores lo piden aunque la página declare otro), con sus tres
    # medidas ya generadas en lugar de dejar que el formato reduzca la grande.
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
    """Iconos en el <head>: los de la plantilla (dos rel=icon por esquema de color, el mismo PNG de
    32 px, y el apple-touch-icon) se sustituyen por el juego completo. El .ico va primero (lo
    entiende todo); los PNG de 48 y 96 son los que Google puede usar en sus resultados (exige un
    múltiplo de 48 px); el de 192, para pantallas densas y Android."""
    v = icon_version()
    tags = (
        f'<link rel="icon" href="/favicon.ico?v={v}" sizes="48x48">'
        f'<link rel="icon" type="image/png" sizes="48x48" href="/favicon-48x48.png?v={v}">'
        f'<link rel="icon" type="image/png" sizes="96x96" href="/favicon-96x96.png?v={v}">'
        f'<link rel="icon" type="image/png" sizes="192x192" href="/icon-192.png?v={v}">'
        f'<link rel="apple-touch-icon" sizes="180x180" href="/apple-touch-icon.png?v={v}">'
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
    # Franja al cargar en móvil: el HTML exportado es el de escritorio ya hidratado, y Framer había
    # quitado de él las capas que en escritorio no se ven (clase hidden-72rtr7). Una es el «Video
    # Overlay», que en móvil y tableta iguala el tono del hero por encima y por debajo del vídeo de
    # la B: hasta que React la montaba (1–3 s en un teléfono), esas dos bandas se veían más oscuras.
    # Se devuelve al HTML tal como la pinta React, así está desde el primer fotograma; en escritorio
    # la oculta banteq.css y Framer la retira al hidratar, como hace con el resto de capas ocultas.
    replace(INDEX, '<div class="framer-1tph0pi" data-framer-name="Overlay"></div><div class="framer-11lkxjs-container">',
            '<div class="framer-1tph0pi" data-framer-name="Overlay"></div>' + HERO_VIDEO_OVERLAY +
            '<div class="framer-11lkxjs-container">')
    assert f"className:`{HERO_VIDEO_OVERLAY_CLASS}`" in S[HOME_MOD], "el módulo ya no pinta el Video Overlay así"
    # Al principio del <head> (lleva ~300 KB de CSS en línea): el póster se pide con los primeros
    # bytes y ya está cuando se pinta la portada por primera vez.
    h = S[INDEX]
    S[INDEX] = h.replace("<head>", "<head>" + PRELOAD_FONT + PRELOAD_POSTERS, 1)
    # El script principal de Framer es async y va después de #main: este script en línea, justo tras
    # #main, elige el vídeo del móvil antes de que Framer pueda arrancarlo (así el móvil no descarga
    # también el de escritorio). banteq-liquid.js mantiene la elección si luego cambia el tamaño.
    replace(INDEX, '<div id="__framer-badge-container">', HERO_SOURCE_SCRIPT + '<div id="__framer-badge-container">')
    (OUT / HERO_VIDEO).unlink()


# Geist (latín, fuente variable: un solo archivo para todos los pesos). Sin precarga llega después
# del primer pintado y, al sustituir a la fuente de reserva, mueve los textos: era el salto de
# diseño de la home en móvil (CLS 0,10: el subtítulo subía una línea). Va en todas las páginas.
PRELOAD_FONT = '<link rel="preload" as="font" type="font/woff2" crossorigin href="/fonts.gstatic.com/s/geist/v5/gyByhwUxId8gMEwcGFU.woff2">'
PRELOAD_POSTERS = (
    '<link rel="preload" as="image" href="/banteq/hero-b-poster.jpg" media="(min-width: 810px)">'
    '<link rel="preload" as="image" href="/banteq/hero-b-movil-poster.jpg" media="(max-width: 809.98px)">'
)
HERO_VIDEO_OVERLAY_CLASS = "framer-4gsoix hidden-72rtr7"
HERO_VIDEO_OVERLAY = f'<div class="{HERO_VIDEO_OVERLAY_CLASS}" data-framer-name="Video Overlay"></div>'
HERO_SOURCE_SCRIPT = (
    "<script>(function(){var v=document.querySelector('[data-framer-name=\"Hero Section\"] "
    "[data-framer-name=\"Background\"] video');if(v&&matchMedia('(max-width: 809.98px)').matches)"
    "{v.src='/banteq/hero-b-movil.mp4';v.dataset.banteqSrc='movil'}})()</script>"
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
    shutil.copy2(GEN / "pie-video-poster.jpg", OUT / "banteq" / "pie-video-poster.jpg")  # ver tools/prerender.mjs
    for pr in C.PROYECTOS:
        if pr.get("demo"):
            shutil.copy2(GEN / pr["demo"], OUT / "banteq" / pr["demo"])  # ver tools/demo_margon.mjs


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
# 6b. Páginas de servicio (contenido.SERVICIOS)
# ---------------------------------------------------------------------------
#
# Cada página de servicio es una copia del módulo de la página de texto de la plantilla (la del
# aviso legal): misma cabecera, mismo pie con formulario, mismas tipografías y mismos puntos de
# corte. Solo cambia el contenido de su columna, que se genera aquí con los mismos componentes y
# clases que usa la plantilla (texto enriquecido de Framer), y se registra como una ruta más.

HOME_ROUTE = "augiA20Il"
COL_TEXTO = "var(--token-8d6ef72b-962d-48df-af78-a514b20c6a38, rgb(82, 82, 82))"
# En las páginas de servicio la columna es larga y acaba sobre la parte gris del degradado de fondo
# (#b7b7b7): el gris de texto de la plantilla (82) se quedaba ahí en 3,8:1. Con 60 pasa de 5,5:1.
COL_TEXTO_SERVICIO = "rgb(60, 60, 60)"
COL_TITULO = "var(--token-1ebf9de7-133d-4417-ad6e-35a4c663a1d9, rgb(26, 26, 26))"
COL_SUBTITULO = "var(--token-c7252384-fca0-4580-9fcd-c3b52008f218, rgb(40, 40, 40))"
LINK_IMPORT = 'import{h as BQL}from"./framer.DrTRbU-a.mjs";'  # componente Link de Framer (como lo importa la home)


def service_mod(sv):
    return f"{SITE}/bq-servicio-{sv['slug']}.mjs"


def static_routes():
    """Ruta → id de página de Framer, y ancla de la home → id del elemento (para enlaces internos)."""
    t = S[MAIN_MOD]
    rutas = {path: rid for rid, path in re.findall(r"(\w+):\{elements:\{[^}]*\},page:N\(\(\)=>import\(`[^`]+`\)\),path:`([^`:]+)`\}", t)}
    rutas.update({"/" + sv["slug"]: sv["id"] for sv in C.SERVICIOS})
    i = t.find(HOME_ROUTE + ":{elements:{") + len(HOME_ROUTE) + len(":{elements:{")
    anclas = {name: eid for eid, name in re.findall(r"(\w+):`([^`]+)`", t[i:t.find("}", i)])}
    return rutas, anclas


def js_link(text, dest, scope, contador):
    """Enlace dentro de un texto: navega con el router de Framer (sin recargar) si es una página
    de la web; en pestaña nueva si es externa."""
    rutas, anclas = static_routes()
    externo = dest.startswith("http")
    if externo:
        href = f"`{dest}`"
    elif dest.startswith("/#"):
        href = f"{{webPageId:`{HOME_ROUTE}`,hash:`{anclas[dest[2:]]}`}}"
    elif dest in rutas:
        href = f"{{webPageId:`{rutas[dest]}`}}"
    else:  # páginas de proyecto (CMS): por su ruta
        assert dest.startswith("/proyectos/"), dest
        href = f"`{dest}`"
    contador[0] += 1
    return (
        f"o(BQL,{{href:{href},motionChild:!0,nodeId:`bqL{contador[0]:03d}`,openInNewTab:{'!0' if externo else '!1'},"
        f"relValues:[],scopeId:`{scope}`,smoothScroll:!1,children:o(l.a,{{className:`bq-enlace`,children:`{js_template(text)}`}})}})"
    )


def js_inline(texto, scope, contador):
    """Hijos de un párrafo: cadena, o lista de trozos (texto, negrita, enlace)."""
    if isinstance(texto, str):
        return f"`{js_template(texto)}`"
    out = []
    for parte in texto:
        if isinstance(parte, str):
            out.append(f"`{js_template(parte)}`")
        elif parte[0] == "b":
            out.append(f"o(`strong`,{{children:`{js_template(parte[1])}`}})")
        else:
            out.append(js_link(parte[1], parte[2], scope, contador))
    return "[" + ",".join(out) + "]"


def _rt(children, cls, nombre):
    """Bloque de texto enriquecido de Framer con una clase de maquetación de la plantilla."""
    return (f"o(b,{{__fromCanvasComponent:!0,children:{children},className:`{cls}`,\"data-framer-name\":`{nombre}`,"
            "fonts:[`Inter`],verticalAlignment:`top`,withExternalLayout:!0})")


def _el(tag, preset, preset_id, color, children):
    fn = "a" if children.startswith("[") else "o"
    return (f"{fn}(`{tag}`,{{className:`framer-styles-preset-{preset}`,\"data-styles-preset\":`{preset_id}`,dir:`auto`,"
            f"style:{{\"--framer-text-color\":`{color}`}},children:{children}}})")


def js_titulo(texto):
    """Título de sección (h2): en el teléfono la plantilla usa otro tamaño de letra."""
    txt = f"`{js_template(texto)}`"
    movil = _el("h2", "dmuwar", "PnTPvlabJ", COL_TITULO, txt)
    resto = _el("h2", "1nvzal8", "FYvoJIwJT", COL_TITULO, txt)
    return (f"o(p,{{breakpoint:S,overrides:{{xH4VXQETc:{{children:o(t,{{children:{movil}}})}}}},"
            f"children:{_rt(f'o(t,{{children:{resto}}})', 'framer-n8m9sc', 'Titulo')}}})")


def js_parrafo(texto, scope, contador):
    return _rt(f"o(t,{{children:{_el('p', '1qlfxwt', 'Ref37fLYE', COL_TEXTO_SERVICIO, js_inline(texto, scope, contador))}}})", "framer-4mj00g", "Texto")


def js_lista(items, scope, contador):
    lis = []
    for it in items:
        hijos = js_inline(it, scope, contador)
        fn = "a" if hijos.startswith("[") else "o"
        lis.append(f"o(`li`,{{\"data-preset-tag\":`p`,children:{fn}(`p`,{{style:{{\"--framer-text-color\":`{COL_TEXTO_SERVICIO}`}},children:{hijos}}})}})")
    ul = (f"a(`ul`,{{className:`framer-styles-preset-1qlfxwt`,\"data-styles-preset\":`Ref37fLYE`,dir:`auto`,"
          f"style:{{\"--framer-text-color\":`{COL_TEXTO_SERVICIO}`}},children:[{','.join(lis)}]}})")
    return _rt(f"o(t,{{children:{ul}}})", "framer-nbxqjv", "Lista")


def js_faq(preguntas, scope, contador):
    out = []
    for q, r in preguntas:
        h3 = _rt(f"o(t,{{children:{_el('h3', 'p6ud8h', 'uIOe7s18L', COL_SUBTITULO, f'`{js_template(q)}`')}}})", "framer-tm6xs4", "Pregunta")
        out.append(f"a(`div`,{{className:`framer-10noxlw`,\"data-framer-name\":`Stack`,children:[{h3},{js_parrafo(r, scope, contador)}]}})")
    return out


def js_service_main(sv):
    """Contenido de la columna de una página de servicio."""
    scope, contador = sv["id"], [0]
    intro_m = ",".join(_el("p", "16wioa8", "MQ9x832KF", COL_TEXTO_SERVICIO, f"`{js_template(x)}`") for x in sv["intro"])
    intro_d = ",".join(_el("p", "j5ar9w", "yzTX5vOKi", COL_TEXTO_SERVICIO, f"`{js_template(x)}`") for x in sv["intro"])
    bloques = [
        f"o(p,{{breakpoint:S,overrides:{{xH4VXQETc:{{children:a(t,{{children:[{intro_m}]}})}}}},"
        f"children:{_rt(f'a(t,{{children:[{intro_d}]}})', 'framer-16yka5q', 'Intro')}}})"
    ]
    for titulo, contenido in sv["secciones"]:
        hijos = [js_titulo(titulo)]
        for tipo, valor in contenido:
            if tipo == "p":
                hijos.append(js_parrafo(valor, scope, contador))
            elif tipo == "ul":
                hijos.append(js_lista(valor, scope, contador))
            elif tipo == "faq":
                hijos.extend(js_faq(valor, scope, contador))
            else:
                raise ValueError(tipo)
        bloques.append(f"a(`div`,{{className:`framer-1dcxdhn`,\"data-framer-name\":`Stack`,children:[{','.join(hijos)}]}})")
    return "[" + ",".join(bloques) + "]"


def neutralize_entrance():
    """En las páginas interiores, el título aparecía palabra a palabra y el subtítulo con un fundido
    al cargar. Cuando el HTML inicial ya se ha enseñado (móvil, window.BANTEQ_PRE; ver make_shells)
    esas dos animaciones se desactivan: el contenido ya está a la vista y repetirlas sería un
    parpadeo. En escritorio y tableta todo sigue igual."""
    for rel in (TERMS_MOD, PRIVACY_MOD, CASES_MOD, DETAIL_MOD):
        t = S[rel]
        t, n = re.subn(r"\beffect:(\w+),", r"effect:globalThis.BANTEQ_PRE?void 0:\1,", t)
        t, m = re.subn(r"__framer__styleAppearEffectEnabled:!0", "__framer__styleAppearEffectEnabled:!globalThis.BANTEQ_PRE", t)
        assert (n, m) == (1, 1), (rel, n, m)
        S[rel] = t


def build_service_pages():
    base = S[TERMS_MOD]
    for sv in C.SERVICIOS:
        t = base
        for viejo, nuevo in ((C.AVISO_LEGAL[0], sv["h1"]), (C.LEGAL_ACTUALIZACION, sv["subtitulo"])):
            marca = f"children:`{js_template(viejo)}`"
            assert t.count(marca) == 1, (sv["slug"], viejo, t.count(marca))
            t = t.replace(marca, f"children:`{js_template(nuevo)}`")
        i = t.find('className:`framer-inyegz`,"data-framer-name":`Main`,children:[')
        assert i > 0, "no se encuentra la columna de contenido de la página de texto"
        k = t.find("children:[", i) + len("children:")
        t = t[:k] + js_service_main(sv) + t[jsx.match_bracket(t, k):]
        assert "H6u27ToU_" in t
        t = t.replace("H6u27ToU_", sv["id"])
        S[service_mod(sv)] = LINK_IMPORT + t
        PAGINAS[sv["slug"]] = (sv["title"], sv["descripcion"])
    # Rutas nuevas: junto a la del aviso legal, y con la misma plantilla de página (cabecera y pie).
    m = S[MAIN_MOD]
    legal = re.search(r"H6u27ToU_:\{elements:\{\},page:N\(\(\)=>import\(`[^`]+`\)\),path:`/aviso-legal`\},", m)
    assert legal, "no se encuentra la ruta del aviso legal"
    nuevas = "".join(
        f"{sv['id']}:{{elements:{{}},page:N(()=>import(`./bq-servicio-{sv['slug']}.mjs`)),path:`/{sv['slug']}`}}," for sv in C.SERVICIOS
    )
    m = m[: legal.end()] + nuevas + m[legal.end():]
    casos = "".join(f"case`{sv['id']}`:" for sv in C.SERVICIOS)
    assert m.count("case`H6u27ToU_`:") == 2
    m = m.replace("case`H6u27ToU_`:", "case`H6u27ToU_`:" + casos)
    S[MAIN_MOD] = m


def apply_project_seo():
    """Páginas de proyecto: los rótulos «Punto de partida», «Qué hicimos» y «Resultado» pasan a ser
    encabezados (h2, con la misma clase: se ven igual), y bajo el resultado se enlazan los servicios
    relacionados y, si está publicada, la web del cliente (contenido.PROYECTO_SERVICIOS/_WEB)."""
    t = S[DETAIL_MOD]
    for rotulo in ("Punto de partida", "Qué hicimos", "Resultado"):
        viejo = 'o(`p`,{className:`framer-styles-preset-1nvzal8`,"data-styles-preset":`FYvoJIwJT`,dir:`auto`,children:`' + rotulo + "`})"
        assert t.count(viejo) == 1, rotulo
        t = t.replace(viejo, viejo.replace("o(`p`,", "o(`h2`,", 1))
    nombres = {sv["slug"]: sv["nombre"].lower() for sv in C.SERVICIOS}
    rutas = {sv["slug"]: sv["id"] for sv in C.SERVICIOS}
    n = [0]

    def enlace(texto, href, externo=False):
        n[0] += 1
        return (f"o(BQL,{{href:{href},motionChild:!0,nodeId:`bqPr{n[0]:03d}`,openInNewTab:{'!0' if externo else '!1'},relValues:[],"
                f"scopeId:`QTC5sKvau`,smoothScroll:!1,children:o(ne.a,{{className:`bq-enlace`,children:`{js_template(texto)}`}})}})")

    por_proyecto = []
    for pr in C.PROYECTOS:
        servicios = C.PROYECTO_SERVICIOS[pr["slug"]]
        trozos = ["`Servicios relacionados: `" if len(servicios) > 1 else "`Servicio relacionado: `"]
        for k, slug in enumerate(servicios):
            if k:
                trozos.append("` y `")
            trozos.append(enlace(nombres[slug], f"{{webPageId:`{rutas[slug]}`}}"))
        trozos.append("`.`")
        if pr["slug"] in C.PROYECTO_WEB:
            dominio, url = C.PROYECTO_WEB[pr["slug"]]
            trozos += ["` Web del cliente: `", enlace(dominio, f"`{url}`", True), "`.`"]
        por_proyecto.append(f"\"{pr['slug']}\":[{','.join(trozos)}]")
    slug = "(typeof location<`u`?location.pathname.replace(/\\/+$/,``).split(`/`).pop():``)"
    bloque = (
        "o(S,{__fromCanvasComponent:!0,children:o(t,{children:a(`p`,{className:`framer-styles-preset-1qlfxwt`,"
        f"\"data-styles-preset\":`Ref37fLYE`,dir:`auto`,style:{{\"--framer-text-color\":`{COL_TEXTO}`}},"
        f"children:({{{','.join(por_proyecto)}}})[{slug}]??[]}})}}),className:`framer-8h8rrf`,\"data-framer-name\":`Relacionado`,"
        "fonts:[`Inter`],verticalAlignment:`top`,withExternalLayout:!0}),"
    )
    ancla = "a(`div`,{className:`framer-zy84k1`,\"data-framer-name\":`Stat Wrap`"
    assert t.count(ancla) == 1
    S[DETAIL_MOD] = LINK_IMPORT + t.replace(ancla, bloque + ancla)
    # Página de contacto: «Por email o WhatsApp…» era un enlace mailto: sin dirección (roto).
    c = S[CONTACT_MOD]
    a = c.find("o(se,{href:`mailto:")
    assert a > 0, "no se encuentra el enlace mailto de la página de contacto"
    S[CONTACT_MOD] = c[:a] + "`Por WhatsApp o por email, como prefieras`" + c[jsx.match_bracket(c, a + 1):]


# Textos alternativos de las imágenes de la home y del pie (por id de imagen de Framer). Las
# decorativas (iconos junto a un texto que ya dice lo mismo) van vacías, que es lo correcto.
ALT = {
    "JoLUJzWcifYswzE6msfHXW4QOg": "Asistente de IA que resume los correos del día",
    "fjjKosDgY23zKW4wHEEqDuzH7s": "Asistente de IA que resume los correos del día",
    "ZorDrCsHnegaSiRVKyn1U0zE": "Ficha de un nuevo contacto marcado como cualificado",
    "6TuyOzSCZDNOdRtZ8FK3OJeJ8": "Gráfico de un informe semanal automático",
    "cgrW7f9W33xv3ZDvvKXaqAaaIL0": "Esquema de un proceso automatizado, con Banteq en el centro",
    "8U1vJYm3i4TejPV6zUq2qL12tAU": "Herramientas de una empresa conectadas entre sí",
    "aSmMadORFrjf0SEWGxtfp2qXEmA": "Portada de la web de Margon",
    "mKS6dvxPlvfsWt7d3VskQg0q8": "Portada de la web de RentUp Capital",
    "tQe8KYZERtfj6dEWPfoEV61M2Q": "Margon",
    "banteq-rentup-logo-blanco": "RentUp Capital",
    "I4qNVX0rmT5t1adTfrJrlvVIO9A": "Banteq",
    **{i: "" for i in (
        "n8zXCidbrBUAQChuau8L7G7DhQ", "xeCVP2BCTEN80S79boVREIjGMB0", "z6cPmsnJML2flePXMqm2kdZG6EI", "BnPovhu3UVva8wf8pdIhGnyeu0",
        "io1ebA6nKd3sIhRozjyWCmW7Pk", "Nc7T0UP7TMYghubatYlzblQr3vc", "Jd4Actw3iicp7lVmQL6Tty7Ezw", "ZWhfkzGB6c8iJeDzvp6nt6xFt4",
        "WOYTcCaxggRNt47bSlnpBZZRtp8",
        # Iconos de herramientas: su nombre va escrito al lado.
        "2xquyjyFTB2qMqOwhpLzMdYE", "5uPQw4lqjfuPQVY56gQ2VAps", "ZlucgVlz0X3yiswDce5ZZWPzxnU", "ZQy4IZjczFBHr315feUz6FY9Jc",
        "qn0FSop5Ezs3MCS3AzMwD3o2NR4", "NJei4VUurepCT7nFvab7lNWfGuE", "AhQIGlem4StUQWPLgPR6MUs5ioY", "oin8QcjYXzUlmHfyHtNW6VeuO4",
        "cDjkCDrLWvNdD8oA4b1Pjx9RaM", "VK3pQ5OWeJjNxkJwuh2e4tWvU",
        # Restos de la plantilla en el HTML inicial (tarjetas que el CMS sustituye al cargar, iconos
        # de redes ocultos, imagen tapada por el cuadrado central).
        "AD2HoNBg3wzuHti33ECtpWxwM", "S8Ya3bZm5hKzKHZ1WWwtc09Gu0", "E5IqsYnTd6volBburXjEsGHak4", "F1ceXDYLhKYcg9ROAsw3PtZSnQ",
        "dnhM1LvqvNjni0IxjdLhnIp2ACE", "gVKmWmun8uyy0BvdmPlOwEu1I", "2xvxH7w2Wb4vKKchKeUXeEAad4", "8tnVvk6l5lwFqJm4sXDTu6A59yE",
        "xPCk1w6MQxfXL3tva6NSiaV6SI",
    )},
}


def apply_alts():
    """Sustituye los alt genéricos de la plantilla («Service», «avatar», «logo»…) en los módulos y
    en el HTML inicial."""
    for rel in (HOME_MOD, NAV_MOD):
        t = S[rel]
        for stem, alt in ALT.items():
            alt_js = js_template(alt)
            # helper(objeto con src, `alt`)
            t = re.sub(r"(\{pixelHeight:\d+,pixelWidth:\d+,src:`[^`]*" + stem + r"[^`]*`(?:,srcSet:`[^`]*`)?\},`)[^`]*(`\))",
                       lambda m: m.group(1) + alt_js + m.group(2), t)
            # objeto con alt: y, más adelante, el src de esa imagen
            t = re.sub(r"(alt:`)[^`]*(`(?=[^{}]{0,420}" + stem + "))", lambda m: m.group(1) + alt_js + m.group(2), t)
        S[rel] = t
    for rel in html_pages():
        h = S[rel]

        def img(m):
            tag = m.group(0)
            for stem, alt in ALT.items():
                if stem in tag:
                    nuevo = f'alt="{html.escape(alt)}"'
                    return re.sub(r'alt="[^"]*"', nuevo, tag, count=1) if "alt=" in tag else tag.replace("<img", "<img " + nuevo, 1)
            return tag

        S[rel] = re.sub(r"<img\b[^>]*>", img, h)


# ---------------------------------------------------------------------------
# 7. Páginas que Framer pinta en el navegador
# ---------------------------------------------------------------------------

PAGINAS = {
    "contacto": ("Contacto | Banteq", "Cuéntanos qué quieres mejorar en tu empresa: automatización, inteligencia artificial, Microsoft Copilot, formación FUNDAE o tu web."
                 if C.MOSTRAR_COPILOT_FUNDAE else "Cuéntanos qué quieres mejorar en tu empresa: automatización, inteligencia artificial o tu web."),
    "proyectos": ("Proyectos | Banteq", "Empresas que ya confían en Banteq y el trabajo que hemos hecho con ellas."),
    "aviso-legal": ("Aviso legal | Banteq", "Aviso legal y condiciones de uso de la web y de los servicios de Banteq."),
    "privacidad": ("Política de privacidad | Banteq", "Qué datos personales trata Banteq, para qué los usa, cómo los protege y cómo ejercer tus derechos."),
    "404": ("Página no encontrada | Banteq", C.META_DESCRIPTION),
}


# HTML inicial de las páginas interiores (tools/prerender.mjs). Framer las pinta en el navegador:
# sin esto, su HTML llega vacío y en un móvil no se ve nada hasta descargar y ejecutar ~400 KB de
# JavaScript. La instantánea va en #bq-pre, delante de #main:
#  - En teléfono (< 800 px) se ve desde el primer momento. React pinta la página de verdad debajo,
#    oculta, y cuando está lista (título puesto e imágenes de la primera pantalla cargadas) se
#    cambia una por otra en el mismo fotograma.
#  - En tableta y escritorio no se enseña (la instantánea es la versión de teléfono): la página
#    carga como siempre. El contenido sigue estando en el HTML para los buscadores.
PRERENDER = ROOT / "assets-banteq" / "prerender"
PRE_CSS = (
    "#bq-pre{display:none}"
    "@media (max-width:799.98px){html:not(.bq-listo) #bq-pre{display:block}"
    # opacity y no visibility: algunos elementos de Framer fijan visibility y se verían a través.
    "html:not(.bq-listo) #main{position:absolute;top:0;left:0;width:100%;opacity:0;pointer-events:none}}"
)
# En la cabecera: decide si esta visita usa la instantánea (teléfono) y lo anota en BANTEQ_PRE, que
# es lo que miran los módulos de página para no repetir la animación de entrada. Sin JavaScript,
# en un teléfono la instantánea se queda a la vista (CSS de arriba).
PRE_BOOT = (
    "<script>(function(){var c=!!window.BANTEQ_CAPTURA,m=!c&&matchMedia('(max-width: 799.98px)').matches;"
    # Al capturar (tools/prerender.mjs) no se enseña ninguna instantánea, pero la página se pinta
    # como en el teléfono: sin animación de entrada.
    "window.BANTEQ_PRE=m||c;if(!m)document.documentElement.classList.add('bq-listo')})()</script>"
)
PRE_SWAP = (
    "<script>(function(){var d=document,pre=d.getElementById('bq-pre'),main=d.getElementById('main');"
    "if(!window.BANTEQ_PRE||window.BANTEQ_CAPTURA){pre&&pre.remove();return}"
    # Mientras se ve la instantánea, la página de verdad (debajo, transparente) no recibe foco ni la
    # leen los lectores de pantalla: no hay contenido duplicado.
    "main.inert=true;"
    "var t0=0,fin=false,cola=false,obs,iv;"
    # Lista: la página de verdad ya tiene su título y las imágenes de la primera pantalla (con 2,5 s
    # de margen como mucho para las imágenes).
    "function lista(){var h=main.querySelector('h1');if(!h||!h.textContent.trim())return false;"
    "if(!t0)t0=performance.now();var im=main.querySelectorAll('img');for(var i=0;i<im.length;i++){"
    "var r=im[i].getBoundingClientRect();if(r.width>0&&r.bottom>0&&r.top<innerHeight&&!im[i].complete)"
    "return performance.now()-t0>2500}"
    # …y los vídeos de la primera pantalla (el fondo de la página de contacto), su primer fotograma.
    "var v=main.querySelectorAll('video');for(i=0;i<v.length;i++){r=v[i].getBoundingClientRect();"
    "if(r.width>0&&r.bottom>0&&r.top<innerHeight&&v[i].readyState<2)return performance.now()-t0>2500}"
    "return true}"
    "function cambiar(){if(fin)return;fin=true;obs.disconnect();clearInterval(iv);pre.remove();main.inert=false;"
    "d.documentElement.classList.add('bq-listo')}"
    "function probar(){if(fin||cola||!lista())return;cola=true;"
    "requestAnimationFrame(function(){requestAnimationFrame(cambiar)})}"
    "obs=new MutationObserver(probar);obs.observe(main,{childList:true,subtree:true});"
    "iv=setInterval(probar,150)})()</script>"
)


def static_imports(rel):
    """Módulos que un módulo importa de forma estática (los dinámicos, import(`…`), no cuentan)."""
    base = rel.rsplit("/", 1)[0]
    return {f"{base}/{m}" for m in re.findall(r'(?:from|import)"\./([^"]+\.mjs)"', S[rel])}


def module_closure(*entradas):
    vistos, cola = [], list(entradas)
    while cola:
        rel = cola.pop(0)
        if rel in vistos:
            continue
        vistos.append(rel)
        cola.extend(sorted(static_imports(rel)))
    return vistos


def route_modules():
    """Ruta de Framer → módulo de su página (de la tabla de rutas del script principal)."""
    t = S[MAIN_MOD]
    return {path: f"{SITE}/{mod}" for mod, path in re.findall(r"page:N\(\(\)=>import\(`\./([^`]+)`\)\),path:`([^`]+)`", t)}


def page_preloads(page, path):
    """Cada página precarga los módulos que necesita ella. Los HTML salen del de la home, así que
    todas precargaban el módulo de la home (490 KB) y dejaban el suyo para el final, cuando el
    script principal ya había arrancado: en un móvil eso retrasaba varios segundos su contenido."""
    rutas = route_modules()
    ruta = "/" + path
    mod = rutas.get(ruta) or next((m for r, m in rutas.items() if ":" in r and ruta.startswith(r.split(":")[0])), None)
    assert mod, f"sin módulo para {ruta}"
    modulos = [m for m in module_closure(MAIN_MOD, mod) if m != MAIN_MOD]
    viejos = re.findall(r'<link rel="modulepreload"[^>]*>', page)
    assert viejos, path
    nuevos = "".join(f'<link rel="modulepreload" fetchpriority="low" href="/{m}">' for m in modulos)
    i = page.find(viejos[0])
    for v in viejos:
        page = page.replace(v, "", 1)
    return page[:i] + nuevos + page[i:]


def prerender_signature():
    import hashlib

    return hashlib.sha1((TOOLS / "contenido.py").read_bytes()).hexdigest()[:12]


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
    desactualizadas = []
    for path, (title, desc) in pages.items():
        page = re.sub(r"<title>[^<]*</title>", f"<title>{html.escape(title)}</title>", shell)
        page = re.sub(r'(<meta name="description" content=")[^"]*(")', lambda m: m.group(1) + html.escape(desc) + m.group(2), page)
        page = page_preloads(page, path)
        snap = PRERENDER / (path.replace("/", "__") + ".json")
        if snap.exists():
            data = json.loads(snap.read_text(encoding="utf-8"))
            if data.get("firma") != prerender_signature():
                desactualizadas.append(path)
            vacio = re.findall(r'<div id="main"[^>]*></div>', page)
            assert len(vacio) == 1, (path, vacio)
            page = page.replace(vacio[0], f'<div id="bq-pre">{data["html"]}</div>{vacio[0]}{PRE_SWAP}', 1)
            page = page.replace("</head>", f'<style data-bq-pre="">{PRE_CSS}{data["css"]}</style>{PRE_BOOT}</head>', 1)
        S[f"{path}/index.html"] = page
    if desactualizadas:
        print("AVISO: el HTML inicial de estas páginas se capturó con otro contenido; ejecuta `npm run prerender`:", ", ".join(desactualizadas))
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
    ]
    for old, new in pares:
        replace(INDEX, old, new, required=False)
    fix_project_cards_html()
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


METRICA_ANCHA = 4  # caracteres: una cifra más larga («+2.500 €/año») no cabe en un tercio de la fila


def fix_project_cards_html():
    """Tarjetas del carrusel de proyectos en el HTML inicial. Venían con la imagen, el logo y las
    cifras de ejemplo de la plantilla («+40%», «24/7»…), que React cambiaba por los del CMS al cargar:
    hasta entonces se leían, junto a nuestros textos, datos que no son de ningún proyecto. Ahora cada
    tarjeta lleva desde el HTML la imagen, el logo y las métricas de su proyecto."""
    h = S[INDEX]
    out, pos, n = [], 0, 0
    for m in re.finditer(r'<div class="framer-fesYP[ "]', h):
        a = m.start()
        if a < pos:
            continue
        b = html_element_extent(h, a, "div")
        card = h[a:b]
        pr = next((p for p in C.PROYECTOS if f">{html.escape(p['titulo'], quote=False)}<" in card), None)
        if pr is None:
            continue
        # Imagen y logo: como los pinta React con los datos del CMS (sin variantes de tamaño).
        for nombre, archivo, alt in (("Image", pr["tarjeta"], f"Web de {pr['cliente']}"), ("Logo", pr["logo"], pr["cliente"])):
            i = card.index("<img", card.index(f'data-framer-name="{nombre}"'))
            j = card.index(">", i) + 1
            tag = re.sub(r' (?:sizes|srcset)="[^"]*"', "", card[i:j])
            tag = re.sub(r' src="[^"]*"', f' src="/framerusercontent.com/images/{archivo}"', tag)
            tag = re.sub(r' alt="[^"]*"', f' alt="{html.escape(alt)}"', tag)
            card = card[:i] + tag + card[j:]
        # Métricas: cifra y nombre, en el orden en que están en la fila.
        i = card.index('<div class="framer-1tjgdmg"')
        j = html_element_extent(card, i, "div")
        textos = iter(html.escape(t, quote=False) for par in pr["metricas"] for t in par)
        fila, k = re.subn(r'(<p class="framer-text framer-styles-preset-(?:1nvzal8|1qlfxwt)"[^>]*>)[^<]*(</p>)',
                          lambda mm: mm.group(1) + next(textos) + mm.group(2), card[i:j])
        assert k == 6, (pr["slug"], k)
        if len(pr["metricas"][2][0]) > METRICA_ANCHA:
            fila = fila.replace('class="framer-1tjgdmg"', 'class="framer-1tjgdmg bq-datos-ancho"', 1)
        out.append(h[pos:a] + card[:i] + fila + card[j:])
        pos, n = b, n + 1
    assert n >= len(C.PROYECTOS), f"tarjetas de proyecto en el HTML: {n}"
    S[INDEX] = "".join(out) + h[pos:]


def apply_wide_metric():
    """Tercera métrica de las tarjetas de proyecto cuando es una cifra larga («+2.500 €/año»): no cabe
    en el tercio de fila que le da la plantilla, y en móvil la plantilla ni la pinta (solo enseña
    dos). El módulo de la tarjeta marca entonces la fila con una clase (el reparto está en banteq.css)
    y pinta la tercera también en móvil. Las tarjetas con cifras cortas quedan como estaban."""
    t = S[CARD_MOD]
    m = re.search(r"className:`framer-1p3jokw`.*?text:(\w+),verticalAlignment", t, re.S)
    assert m, "no se encuentra la tercera cifra de la tarjeta"
    ancha = f"(({m.group(1)}||``).length>{METRICA_ANCHA})"
    for old, new in (
        ("fe()&&o(d.div,{className:`framer-10ajrs0`", f"(fe()||{ancha})&&o(d.div,{{className:`framer-10ajrs0`"),
        ("o(d.div,{className:`framer-1tjgdmg`,", f"o(d.div,{{className:`framer-1tjgdmg`+({ancha}?` bq-datos-ancho`:``),"),
    ):
        assert t.count(old) == 1, old
        t = t.replace(old, new)
    S[CARD_MOD] = t


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


NOTA_DIAGNOSTICO_CLASE = "bq-diag-nota framer-text framer-styles-preset-1qlfxwt"


def apply_diagnostic_row():
    """Fila inferior de «Servicios»: se quita la tarjeta «Seguridad y control en cada proceso» y la de
    «¿No sabes por dónde empezar?» ocupa toda la fila (la composición está en banteq.css). Entre el
    texto y el botón se añade una nota corta (contenido.DIAGNOSTICO_NOTA) con la letra del texto de la
    tarjeta. Todo se hace a la vez en el módulo de la home y en el HTML: si solo se hiciera en uno,
    React daría error de hidratación."""
    destacado, resto = C.DIAGNOSTICO_NOTA
    src = S[HOME_MOD]
    assert src.count("className:`framer-whwse3`") == 1 and src.count("className:`framer-dyx1m5`") == 1
    remove_child_call(HOME_MOD, *jsx.call_containing(src, src.find("className:`framer-whwse3`")))
    src = S[HOME_MOD]
    fin = jsx.call_containing(src, src.find("className:`framer-dyx1m5`"))[1]
    nota = "h(`p`,{className:`%s`,children:[g(`span`,{children:`%s`}),` %s`]})" % (
        NOTA_DIAGNOSTICO_CLASE, js_template(destacado), js_template(resto))
    S[HOME_MOD] = src[:fin] + "," + nota + src[fin:]

    h = S[INDEX]
    assert h.count('class="framer-whwse3"') == 1 and h.count('class="framer-dyx1m5"') == 1
    a = h.rfind("<div", 0, h.find('class="framer-whwse3"'))
    h = h[:a] + h[html_element_extent(h, a, "div"):]
    fin = html_element_extent(h, h.rfind("<div", 0, h.find('class="framer-dyx1m5"')), "div")
    nota = '<p class="%s"><span>%s</span> %s</p>' % (
        NOTA_DIAGNOSTICO_CLASE, html.escape(destacado, quote=False), html.escape(resto, quote=False))
    S[INDEX] = h[:fin] + nota + h[fin:]


def hide_sections():
    """Secciones ocultas (contenido.SECCIONES_OCULTAS: «¿Por qué Banteq?» y la de Copilot y FUNDAE).
    Se construyen con sus textos, enlaces y numeración, y aquí se quitan del módulo de la home y del
    HTML a la vez (si solo se quitaran de uno, React daría error de hidratación). Volver a mostrarlas
    es cambiar la bandera en contenido.py."""
    for name in C.SECCIONES_OCULTAS:
        remove_child_call(HOME_MOD, *section_range_js(name))
        a, b = section_range_html(INDEX, name)
        S[INDEX] = S[INDEX][:a] + S[INDEX][b:]
    hide_copilot_fundae()


def hide_copilot_fundae():
    """Restos de Microsoft Copilot y FUNDAE fuera de su sección (contenido.MOSTRAR_COPILOT_FUNDAE)."""
    if C.MOSTRAR_COPILOT_FUNDAE:
        return
    # La quinta pregunta frecuente era la de FUNDAE; ahora ese hueco lo ocupa «¿Dónde trabajáis?»
    # (contenido.FAQ_ZONA), así que no hay nada que quitar de la lista.
    pregunta = {t[0]: t[1] for t in C.HOME}["What kind of ROI can we expect?"]
    assert not re.search(r"(?i)fundae|copilot", pregunta), pregunta
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


# ---------------------------------------------------------------------------
# Identidad en buscadores: canónicas, Open Graph, datos estructurados, robots.txt y sitemap.xml
# ---------------------------------------------------------------------------

def page_url(rel):
    """URL pública de una página generada (sin index.html ni barra final, como las sirve Vercel)."""
    path = rel[: -len("index.html")].strip("/")
    return f"{C.SITIO}/{path}"


def _ld(*nodos):
    data = {"@context": "https://schema.org", "@graph": [n for n in nodos if n]}
    return '<script type="application/ld+json">' + json.dumps(data, ensure_ascii=False) + "</script>"


ORG_ID = f"{C.SITIO}/#organization"
AREA = {"@type": "AdministrativeArea", "name": C.PROVINCIA}


def ld_organizacion():
    """La empresa: nombre, logo y localidad. Solo datos ciertos: sin calle, teléfono ni perfiles
    hasta tenerlos (cuando existan, aquí; y entonces tiene sentido pasar a LocalBusiness)."""
    return {
        "@type": "Organization",
        "@id": ORG_ID,
        "name": C.NOMBRE_SITIO,
        "alternateName": C.NOMBRE_ALTERNATIVO,
        "url": f"{C.SITIO}/",
        "logo": {"@type": "ImageObject", "url": f"{C.SITIO}/icon-512.png", "width": 512, "height": 512},
        "description": C.META_DESCRIPTION,
        "address": {"@type": "PostalAddress", "addressLocality": C.LOCALIDAD, "addressRegion": C.PROVINCIA, "addressCountry": "ES"},
        "areaServed": AREA,
    }


def ld_sitio():
    return {
        "@type": "WebSite",
        "@id": f"{C.SITIO}/#website",
        "name": C.NOMBRE_SITIO,
        "alternateName": C.NOMBRE_ALTERNATIVO,
        "url": f"{C.SITIO}/",
        "inLanguage": "es",
        "publisher": {"@id": ORG_ID},
    }


def ld_migas(*pasos):
    """Migas de pan: (nombre, url) desde la home hasta la página."""
    pasos = (("Inicio", f"{C.SITIO}/"),) + pasos
    return {
        "@type": "BreadcrumbList",
        "itemListElement": [{"@type": "ListItem", "position": k, "name": n, "item": u} for k, (n, u) in enumerate(pasos, 1)],
    }


def ld_faq(preguntas):
    return {
        "@type": "FAQPage",
        "mainEntity": [{"@type": "Question", "name": q, "acceptedAnswer": {"@type": "Answer", "text": r}} for q, r in preguntas],
    }


def faq_home():
    """Preguntas frecuentes de la home tal como se publican (contenido.HOME)."""
    originales = ["What industries do you work with?", "How long does implementation take?",
                  "Do we need technical knowledge to work with you?", "Is AI automation secure?", "What kind of ROI can we expect?"]
    out = []
    for k, entrada in enumerate(C.HOME):
        if entrada[0] in originales:
            out.append((entrada[1], C.HOME[k + 1][1]))
    assert len(out) == len(originales), out
    return out


def structured_data(rel):
    """JSON-LD de cada página. Todo sale de contenido.py: lo mismo que se lee en la página."""
    url = page_url(rel)
    servicios = {sv["slug"]: sv for sv in C.SERVICIOS}
    proyectos = {pr["slug"]: pr for pr in C.PROYECTOS}
    ruta = rel[: -len("index.html")].strip("/")
    if rel == INDEX:
        return _ld(ld_organizacion(), ld_sitio(), ld_faq(faq_home()))
    if ruta in servicios:
        sv = servicios[ruta]
        preguntas = [par for _, bloques in sv["secciones"] for tipo, valor in bloques if tipo == "faq" for par in valor]
        servicio = {
            "@type": "Service", "@id": f"{url}#servicio", "name": sv["nombre"], "serviceType": sv["nombre"],
            "description": sv["descripcion"], "url": url, "provider": {"@id": ORG_ID}, "areaServed": AREA,
        }
        return _ld(ld_organizacion(), servicio, ld_faq(preguntas), ld_migas((sv["nombre"], url)))
    if ruta == "proyectos":
        lista = {
            "@type": "ItemList",
            "itemListElement": [{"@type": "ListItem", "position": k, "name": pr["titulo"], "url": f"{C.SITIO}/proyectos/{pr['slug']}"}
                                for k, pr in enumerate(C.PROYECTOS, 1)],
        }
        return _ld(ld_organizacion(), {"@type": "CollectionPage", "@id": f"{url}#pagina", "name": "Proyectos", "url": url, "mainEntity": lista},
                   ld_migas(("Proyectos", url)))
    if ruta.startswith("proyectos/"):
        pr = proyectos[ruta.split("/")[1]]
        obra = {
            "@type": "CreativeWork", "@id": f"{url}#proyecto", "name": pr["titulo"], "description": pr["descripcion"], "url": url,
            "image": f"{C.SITIO}/framerusercontent.com/images/{pr['tarjeta']}", "dateCreated": pr["ano"], "about": pr["sector"],
            "creator": {"@id": ORG_ID}, "inLanguage": "es",
        }
        return _ld(ld_organizacion(), obra, ld_migas(("Proyectos", f"{C.SITIO}/proyectos"), (pr["cliente"], url)))
    if ruta == "contacto":
        return _ld(ld_organizacion(), {"@type": "ContactPage", "@id": f"{url}#pagina", "name": "Contacto", "url": url, "about": {"@id": ORG_ID}},
                   ld_migas(("Contacto", url)))
    return ""


def apply_seo():
    """Cada página se identifica a sí misma ante buscadores y redes. La plantilla dejaba en todas
    canonical y og:url = "/" (para Google, todas eran copias de la home) y el título, la descripción
    y la imagen de Open Graph/Twitter de la home, con la imagen en ruta relativa (las redes la
    piden absoluta). Además genera robots.txt y sitemap.xml."""
    og_image = f"{C.SITIO}/framerusercontent.com/images/{OG_IMAGE}"
    indexables, titulos = [], {}
    for rel in sorted(r for r in S.files if r.endswith(".html") and "third-party-assets" not in r):
        h = S[rel]
        head_end = h.find("</head>")
        head, rest = h[:head_end], h[head_end:]
        title = html.unescape(re.search(r"<title>([^<]*)</title>", head).group(1))
        desc = html.unescape(re.search(r'<meta name="description" content="([^"]*)"', head).group(1))
        es_404 = rel.startswith("404")
        if rel.endswith("index.html") and not re.match(r"proyectos/[^/]+/index\.html$", rel):  # las de proyecto ya lo traen del CMS
            titulos[rel] = title

        def meta(attr, value, head):
            head, n = re.subn(rf'<meta {attr} content="[^"]*">', f'<meta {attr} content="{html.escape(value)}">', head)
            assert n == 1, f"{rel}: {attr} aparece {n} veces"
            return head

        for attr in ('property="og:title"', 'name="twitter:title"'):
            head = meta(attr, title, head)
        for attr in ('property="og:description"', 'name="twitter:description"'):
            head = meta(attr, desc, head)
        for attr in ('property="og:image"', 'name="twitter:image"'):
            head = meta(attr, og_image, head)
        extra = f'<meta property="og:site_name" content="{C.NOMBRE_SITIO}"><meta property="og:locale" content="es_ES">'
        assert head.count('<link rel="canonical" href="/">') == 1 and head.count('<meta property="og:url" content="/">') == 1, rel
        if es_404:
            # La página de error no se indexa ni señala a ninguna URL como suya.
            head = head.replace('<link rel="canonical" href="/">', "").replace('<meta property="og:url" content="/">', extra)
            head, n = re.subn(r'<meta name="robots" content="[^"]*">', '<meta name="robots" content="noindex">', head)
            assert n == 1, rel
        else:
            url = page_url(rel)
            head = head.replace('<link rel="canonical" href="/">', f'<link rel="canonical" href="{url}">')
            head = head.replace('<meta property="og:url" content="/">', f'<meta property="og:url" content="{url}">' + extra)
            indexables.append(url)
            head += structured_data(rel)
        S[rel] = head + rest
    # Framer, en el navegador (y Google ejecuta JavaScript): al navegar reescribe la canónica con el
    # dominio del sitio, que en la exportación era el de la plantilla en framer.app…
    replace(MAIN_MOD, "siteCanonicalURL:`https://breathtaking-step-882598.framer.app`", f"siteCanonicalURL:`{C.SITIO}`")
    # …y pone como título el del módulo de cada página, que en las páginas sin título propio es el
    # de la home: /contacto acababa titulándose igual que la home. Se usa el <title> de cada ruta.
    titulos = {"/" + rel[: -len("index.html")].strip("/"): t for rel, t in titulos.items()}
    replace(
        FRAMER_MOD,
        "s(()=>{document.title=e.title||``,e.viewport&&document.querySelector(`meta[name=\"viewport\"]`)?.setAttribute(`content`,e.viewport)},[e.title,e.viewport])",
        "s(()=>{document.title=(" + json.dumps(titulos, ensure_ascii=False) + ")[location.pathname.replace(/\\/+$/,``)||`/`]||e.title||``,"
        "e.viewport&&document.querySelector(`meta[name=\"viewport\"]`)?.setAttribute(`content`,e.viewport)},[e.title,e.viewport,location.pathname])",
    )
    (OUT / "robots.txt").write_text(f"User-agent: *\nAllow: /\n\nSitemap: {C.SITIO}/sitemap.xml\n", encoding="utf-8")
    urls = "".join(f"  <url><loc>{html.escape(u)}</loc></url>\n" for u in sorted(indexables, key=lambda u: (u.count("/"), u)))
    (OUT / "sitemap.xml").write_text(
        '<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n' + urls + "</urlset>\n",
        encoding="utf-8",
    )


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
    apply_diagnostic_row()
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
    apply_wide_metric()
    neutralize_entrance()
    build_service_pages()
    apply_project_seo()
    apply_alts()
    for rel in html_pages():
        inject_assets(rel)
        apply_head_images(rel)

    hide_sections()
    make_shells()
    apply_seo()
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
