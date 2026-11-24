"""SEO técnico y GEO que no dependen de Framer: FAQPage de las guías, llms-full.txt, robots.txt y las
comprobaciones del build (metadatos, hreflang, enlaces internos, JSON-LD, sitemap).

build.py lo llama desde apply_seo() y desde main(). Nada de aquí toca el diseño: solo texto plano,
datos estructurados y comprobaciones. Las funciones no leen estado global de build.py; reciben lo que
necesitan para que sea fácil de probar y de fusionar.
"""
import datetime
import html
import json
import re
import sys
from pathlib import Path
from urllib.parse import urlsplit

import contenido as C
import idiomas as ID

# Rastreadores de buscadores y de asistentes de IA que se permiten de forma explícita. No se bloquea
# ninguno: la regla general (*) ya permite todo, pero los bloques con nombre evitan dudas cuando un
# rastreador solo obedece a su propio bloque.
ROBOTS_BOTS = ("OAI-SearchBot", "ChatGPT-User", "GPTBot", "PerplexityBot", "ClaudeBot", "Claude-SearchBot",
               "Google-Extended", "Applebot-Extended", "Bingbot")


def robots_txt():
    bloque = "Allow: /\nDisallow: /api/\n"
    # /diagnostico (cuestionario) ya lleva noindex y debe poder rastrearse para que se lea esa etiqueta.
    partes = ["User-agent: *\n" + bloque] + [f"User-agent: {b}\n{bloque}" for b in ROBOTS_BOTS]
    return "\n".join(partes) + f"\nSitemap: {C.SITIO}/sitemap.xml\n"


# ---------------------------------------------------------------------------
# Texto visible de una página: lo comparten FAQPage y llms-full.txt
# ---------------------------------------------------------------------------

def texto(fragmento):
    """HTML → texto plano con espacios normalizados."""
    fragmento = re.sub(r"<(script|style|template)\b.*?</\1>", " ", fragmento, flags=re.S)
    return " ".join(html.unescape(re.sub(r"<[^>]+>", " ", fragmento)).split())


def _secciones_guia(t):
    """[(titulo_h2, html_de_la_seccion)] de una guía autónoma (<section><h2>…</h2>…</section>)."""
    return [(texto(m.group(2)), m.group(3)) for m in re.finditer(r"<section\b([^>]*)>\s*<h2[^>]*>(.*?)</h2>(.*?)</section>", t, re.S)
            if "relacionados" not in m.group(1)]


def _parrafos(seccion):
    """Párrafos y elementos de lista de una sección, sin código ni tablas ni la llamada a la acción."""
    seccion = re.sub(r"<(pre|table)\b.*?</\1>", " ", seccion, flags=re.S)
    seccion = re.sub(r"<p\b[^>]*class=\"[^\"]*\baction\b[^\"]*\"[^>]*>.*?</p>", " ", seccion, flags=re.S)
    return [t for t in (texto(m.group(2)) for m in re.finditer(r"<(p|li)\b[^>]*>(.*?)</\1>", seccion, re.S)) if t]


def preguntas_guia(t):
    """Pares (pregunta, respuesta) de una guía: cada H2 en forma de pregunta con su texto debajo. La
    respuesta es el texto visible de esa sección (párrafos y listas); las secciones de contacto (con
    llamada a la acción) no cuentan. Hacen falta al menos dos para publicar FAQPage."""
    out = []
    for titulo, cuerpo in _secciones_guia(t):
        if not titulo.endswith("?") or "data-bq-contacto-guia" in cuerpo or 'class="action"' in cuerpo:
            continue
        respuesta = " ".join(_parrafos(cuerpo))
        if len(respuesta) >= 40:
            out.append((titulo, respuesta))
    return out if len(out) >= 2 else []


def guia_con_faq(t, ld_faq):
    """Añade un script FAQPage al <head> de la guía (sin editar su HTML fuente) si tiene preguntas."""
    pares = preguntas_guia(t)
    if not pares or '"FAQPage"' in t:
        return t
    data = {"@context": "https://schema.org", "@graph": [ld_faq(pares)]}
    script = '<script type="application/ld+json">' + json.dumps(data, ensure_ascii=False) + "</script>"
    assert "</head>" in t
    return t.replace("</head>", script + "\n</head>", 1)


# ---------------------------------------------------------------------------
# llms-full.txt
# ---------------------------------------------------------------------------

def _plano(x):
    """Texto de un fragmento de contenido.py: cadena o lista/tupla de cadenas y marcas ('b', t) / ('a', t, href)."""
    if isinstance(x, str):
        return x
    if isinstance(x, tuple) and x and x[0] == "b":
        return f"**{x[1].strip()}** " if x[1].endswith(" ") else f"**{x[1]}**"
    if isinstance(x, tuple) and x and x[0] in ("a", "idioma"):
        href = x[2] if x[2].startswith("http") else C.SITIO + (x[2] if x[2].startswith("/") else "/" + x[2])
        return f"[{x[1]}]({href})"
    return "".join(_plano(i) for i in x)


def _md_bloque(tipo, valor):
    if tipo == "p":
        return [_plano(valor), ""]
    if tipo == "ul":
        return [*(f"- {_plano(i)}" for i in valor), ""]
    if tipo == "faq":
        return [x for q, r in valor for x in (f"**{q}**", "", _plano(r), "")]
    if tipo == "tabla":
        cab, filas = valor
        fila = lambda c: "| " + " | ".join(str(x).replace("|", "/") for x in c) + " |"
        return [fila(cab), fila(["---"] * len(cab)), *(fila(f) for f in filas), ""]
    if tipo == "garantia":
        return [_plano(C.GARANTIA_TITULO), "", _plano(C.GARANTIA_TEXTO), "", _plano(C.GARANTIA_ALCANCE), ""]
    return []  # formula (botón de la calculadora) y otros: no son texto


def md_servicio(sv):
    out = [sv["subtitulo"], "", *(x for p in sv["intro"] for x in (_plano(p), ""))]
    for titulo, bloques in sv["secciones"]:
        out += [f"#### {titulo}", ""]
        for tipo, valor in bloques:
            out += _md_bloque(tipo, valor)
    return out


def md_proyecto(pr):
    out = [f"Cliente: {pr['cliente']}. Sector: {pr['sector']}. Año: {pr['ano']}. Servicios: {pr['servicios']}.", ""]
    out += [f"**El reto.** {_plano(pr['reto'])}", "", f"**La solución.** {_plano(pr['solucion'])}", ""]
    for titulo, items in pr["bloques"]:
        out += [f"#### {titulo}", "", *(f"- {i}" for i in items), ""]
    out += [f"**El resultado.** {_plano(pr['resultado'])}", ""]
    if pr.get("metricas"):
        out += [*(f"- {c}: {e}" for c, e in pr["metricas"]), ""]
    return out


def md_guia(t):
    """Contenido principal de una guía autónoma (entre el h1 y el final del artículo) en Markdown."""
    i = t.find("<h1")
    j = t.find("</article>")
    cuerpo = t[i:j if j > i else len(t)]
    cuerpo = re.sub(r'<section\b[^>]*class="[^"]*relacionados[^"]*".*?</section>', " ", cuerpo, flags=re.S)
    cuerpo = re.sub(r'<p\b[^>]*class="[^"]*migas[^"]*".*?</p>', " ", cuerpo, flags=re.S)
    out = []

    def tabla(m):
        filas = [[texto(c).replace("|", "/") for c in re.findall(r"<t[hd]\b[^>]*>(.*?)</t[hd]>", f, re.S)]
                 for f in re.findall(r"<tr\b[^>]*>(.*?)</tr>", m.group(0), re.S)]
        if not filas:
            return ""
        md = ["| " + " | ".join(f) + " |" for f in filas]
        md.insert(1, "| " + " | ".join("---" for _ in filas[0]) + " |")
        return "\n\n" + "\n".join(md) + "\n\n"

    cuerpo = re.sub(r"<table\b.*?</table>", tabla, cuerpo, flags=re.S)
    cuerpo = re.sub(r"<pre\b[^>]*>(.*?)</pre>", lambda m: "\n\n```\n" + html.unescape(re.sub(r"<[^>]+>", "", m.group(1))).strip("\n") + "\n```\n\n", cuerpo, flags=re.S)
    cuerpo = re.sub(r"<h1\b[^>]*>.*?</h1>", "", cuerpo, count=1, flags=re.S)
    cuerpo = re.sub(r"<h([23])\b[^>]*>(.*?)</h\1>", lambda m: f"\n\n{'#' * (int(m.group(1)) + 2)} {texto(m.group(2))}\n\n", cuerpo, flags=re.S)
    cuerpo = re.sub(r"<li\b[^>]*>(.*?)</li>", lambda m: f"\n- {texto(m.group(1))}", cuerpo, flags=re.S)
    cuerpo = re.sub(r"<p\b[^>]*>(.*?)</p>", lambda m: f"\n\n{texto(m.group(1))}\n\n", cuerpo, flags=re.S)
    cuerpo = re.sub(r"</(ul|ol)>", "\n\n", cuerpo)
    # Lo que queda de marcado (div, section, spans…) se quita; los bloques ya convertidos conservan su formato.
    partes = re.split(r"(```.*?```)", cuerpo, flags=re.S)
    partes = [p if p.startswith("```") else html.unescape(re.sub(r"<[^>]+>", "", p)) for p in partes]
    out = "".join(partes)
    # Dentro de un bloque de código se respeta la sangría; fuera, se recorta y se quitan los huecos dobles.
    lineas, codigo = [], False
    for l in out.split("\n"):
        if l.startswith("```"):
            codigo = not codigo
        lineas.append(l.rstrip() if codigo else l.strip())
    md = re.sub(r"\n{3,}", "\n\n", "\n".join(lineas)).strip()
    md = re.sub(r"(?m)^(- .*)\n\n(?=- )", r"\1\n", md)  # los elementos de una lista van seguidos
    return md.split("\n") + [""]


def llms_full(guias, fechas):
    """Texto de llms-full.txt. guias: [(slug, html_fuente, idioma)]; fechas: {url: 'AAAA-MM-DD'}."""
    hoy = datetime.date.today().isoformat()
    lineas = [
        f"# {C.NOMBRE_SITIO}: contenido completo", "",
        f"> Texto de las páginas principales de {C.SITIO} (servicios, proyectos y guías), sin menús ni pie, para "
        f"asistentes de IA. Versión resumida con enlaces: {C.SITIO}/llms.txt. Generado desde el mismo contenido que la web.", "",
        f"{C.ZONA_FRASE} Contacto: {C.EMAIL_CONTACTO}.", "",
        "## Servicios", ""]
    pagina = lambda nivel, titulo, url, fecha, cuerpo, idioma="es": [
        f"{'#' * nivel} {titulo}", "", f"URL: {url}", f"Actualizado: {fecha or hoy}", f"Idioma: {idioma}", "", *cuerpo]
    for sv in C.SERVICIOS:
        url = f"{C.SITIO}/{sv['slug']}"
        lineas += pagina(3, sv["h1"], url, fechas.get(url), md_servicio(sv))
    lineas += ["## Proyectos", ""]
    for pr in C.PROYECTOS:
        url = f"{C.SITIO}/proyectos/{pr['slug']}"
        lineas += pagina(3, pr["titulo"], url, fechas.get(url), md_proyecto(pr))
    lineas += ["## Guías", ""]
    for slug, t, idioma in guias:
        url = f"{C.SITIO}/guias/{slug}"
        h1 = texto(re.search(r"<h1[^>]*>(.*?)</h1>", t, re.S).group(1))
        lineas += pagina(3, h1, url, fechas.get(url), md_guia(t), idioma)
    return "\n".join(lineas).rstrip() + "\n"


# ---------------------------------------------------------------------------
# Comprobaciones del build
# ---------------------------------------------------------------------------

def _paginas_del_sitemap(out):
    xml = (out / "sitemap.xml").read_text(encoding="utf-8")
    return xml, re.findall(r"<url>(.*?)</url>", xml, re.S)


def _archivo_de(out, url):
    ruta = url[len(C.SITIO):].strip("/")
    return out / ruta / "index.html" if ruta else out / "index.html"


def _ld_nodos(t):
    """(nodos, errores) de todos los JSON-LD de una página."""
    nodos, errores = [], []
    for b in re.findall(r'<script type="application/ld\+json">(.*?)</script>', t, re.S):
        try:
            d = json.loads(b)
        except ValueError as e:
            errores.append(f"JSON-LD no válido: {e}")
            continue
        nodos += d.get("@graph", [d]) if isinstance(d, dict) else d
    return nodos, errores


def _destinos_validos(root, out):
    vercel = json.loads((root / "vercel.json").read_text(encoding="utf-8"))
    reescritas = {r["source"] for r in vercel.get("rewrites", [])}
    redirigidas = {r["source"] for r in vercel.get("redirects", [])}
    return reescritas, redirigidas


def comprobar(root, out, avisar_solo=()):
    """Comprueba la web generada en `out`. Devuelve (errores, avisos): listas de textos.
    avisar_solo: prefijos de ruta cuyos errores pasan a avisos (páginas de otro responsable)."""
    errores, avisos = [], []
    hoy = datetime.date.today().isoformat()
    xml, entradas = _paginas_del_sitemap(out)
    reescritas, redirigidas = _destinos_validos(root, out)
    paginas = {}
    for e in entradas:
        url = html.unescape(re.search(r"<loc>(.*?)</loc>", e).group(1))
        paginas[url] = (e, _archivo_de(out, url))

    def fallo(url, msg):
        ruta = url[len(C.SITIO):].strip("/")
        destino = avisos if any(ruta == p or ruta.startswith(p + "/") for p in avisar_solo) else errores
        destino.append(f"{url}: {msg}")

    if len(paginas) != len(entradas):
        errores.append("sitemap.xml: URL repetidas")
    hreflang = {}  # url → {idioma: url}
    longitudes = []
    for url, (entrada, f) in sorted(paginas.items()):
        if not f.exists():
            fallo(url, f"en el sitemap pero sin archivo ({f.relative_to(out)})")
            continue
        t = f.read_text(encoding="utf-8")
        cabeza = t[: t.find("</head>")]
        # --- metadatos
        m = re.search(r"<title>([^<]*)</title>", cabeza)
        titulo = html.unescape(m.group(1)).strip() if m else ""
        m = re.search(r'<meta name="description" content="([^"]*)"', cabeza)
        desc = html.unescape(m.group(1)).strip() if m else ""
        canon = re.search(r'<link rel="canonical" href="([^"]*)"', cabeza)
        h1 = len(re.findall(r"<h1[\s>]", t))
        if not titulo:
            fallo(url, "sin <title>")
        if not desc:
            fallo(url, "sin meta description")
        if not canon or not canon.group(1).startswith(C.SITIO):
            fallo(url, f"canónica ausente o no absoluta ({canon.group(1) if canon else '-'})")
        elif canon.group(1) != url:
            fallo(url, f"la canónica {canon.group(1)} no coincide con la URL del sitemap")
        if h1 != 1:
            fallo(url, f"{h1} etiquetas h1 (debe haber una)")
        if "noindex" in cabeza and re.search(r'name="robots" content="[^"]*noindex', cabeza):
            fallo(url, "está en el sitemap pero lleva noindex")
        if len(titulo) > 60:
            longitudes.append((url, f"title de {len(titulo)} caracteres (>60)"))
        if desc and not 70 <= len(desc) <= 160:
            longitudes.append((url, f"description de {len(desc)} caracteres (fuera de 70-160)"))
        # --- JSON-LD
        nodos, errs = _ld_nodos(t)
        for e in errs:
            fallo(url, e)
        tipos = [n.get("@type") for n in nodos]
        if urlsplit(url).path not in ("", "/", "/ca", "/en") and "BreadcrumbList" not in tipos:
            fallo(url, "sin BreadcrumbList")
        for n in nodos:
            if n.get("@type") == "BreadcrumbList":
                items = n["itemListElement"]
                if [i["position"] for i in items] != list(range(1, len(items) + 1)):
                    fallo(url, "BreadcrumbList con posiciones no correlativas")
                for i in items:
                    if "item" in i and not i["item"].startswith(C.SITIO):
                        fallo(url, f"miga con URL no absoluta: {i['item']}")
                    if not i.get("name"):
                        fallo(url, "miga sin nombre")
                ultimo = items[-1]
                if "item" in ultimo and ultimo["item"].rstrip("/") != url.rstrip("/"):
                    fallo(url, f"la última miga apunta a {ultimo['item']}, no a la propia página")
            if n.get("@type") == "FAQPage":
                visible = " ".join(texto(t[t.find("</head>"):]).split())
                for q in n["mainEntity"]:
                    # Las páginas de servicio traen el texto pre-renderizado aparte (npm run prerender):
                    # solo se exige coincidencia cuando la pregunta ya está en el HTML.
                    if q["name"] not in visible:
                        if "/guias/" in url:
                            fallo(url, f"FAQPage con una pregunta que no está visible: {q['name'][:60]}")
                    elif q["acceptedAnswer"]["text"][:60] not in visible:
                        fallo(url, f"FAQPage: la respuesta no coincide con la visible ({q['name'][:50]})")
        # --- hreflang
        alts = dict(re.findall(r'<link rel="alternate" hreflang="([^"]+)" href="([^"]+)"', cabeza))
        if alts:
            hreflang[url] = alts
        # --- enlaces internos
        for href in sorted(set(re.findall(r'<a\b[^>]*?\bhref="(/[^"]*)"', t))):
            ruta = urlsplit(href).path
            if ruta in ("/", "") or ruta.startswith("//"):
                continue
            ruta_corta = ruta.rstrip("/")
            if (ruta_corta in reescritas or ruta_corta in redirigidas or ruta.startswith("/api/")
                    or (out / ruta.lstrip("/")).is_file() or (out / ruta.strip("/") / "index.html").is_file()
                    or (out / (ruta.strip("/") + ".html")).is_file()):
                continue
            fallo(url, f"enlace interno roto: {href}")
        # --- sitemap: lastmod
        lm = re.search(r"<lastmod>(.*?)</lastmod>", entrada)
        if not lm or not re.fullmatch(r"\d{4}-\d{2}-\d{2}", lm.group(1)) or lm.group(1) > hoy:
            fallo(url, f"lastmod incorrecto en el sitemap ({lm.group(1) if lm else '-'})")
        path = urlsplit(url).path
        if path.startswith("/api") or path.startswith("/diagnostico") or path.rstrip("/") in redirigidas or path.endswith((".html", "/index")):
            fallo(url, "URL que no debe estar en el sitemap (api, diagnóstico, redirigida o con .html)")
    # hreflang recíproco y presente en el sitemap
    for url, alts in sorted(hreflang.items()):
        if url not in alts.values():
            fallo(url, "hreflang sin autorreferencia")
        for idioma, destino in alts.items():
            if destino not in paginas:
                fallo(url, f"hreflang {idioma} apunta a {destino}, que no está en el sitemap")
            elif url not in hreflang.get(destino, {}).values():
                fallo(url, f"hreflang no recíproco: {destino} no enlaza de vuelta")
        en_sitemap = dict(re.findall(r'hreflang="([^"]+)" href="([^"]+)"', paginas[url][0]))
        if en_sitemap != alts:
            fallo(url, "los xhtml:link del sitemap no coinciden con los hreflang de la página")
    # llms.txt debe nombrar todas las páginas del sitemap
    llms = (out / "llms.txt").read_text(encoding="utf-8")
    for url in paginas:
        if url.rstrip("/") not in llms.replace(C.SITIO + "/)", C.SITIO + ")"):
            avisos.append(f"{url}: no aparece en llms.txt")
    if f"{C.SITIO}/llms-full.txt" not in llms:
        errores.append("llms.txt no enlaza llms-full.txt")
    # robots.txt
    robots = (out / "robots.txt").read_text(encoding="utf-8")
    for b in ROBOTS_BOTS:
        if f"User-agent: {b}\nAllow: /\nDisallow: /api/" not in robots:
            errores.append(f"robots.txt: falta el bloque de {b}")
    for url, msg in longitudes:
        avisos.append(f"{url}: {msg}")
    return errores, avisos


def informar(errores, avisos):
    """Imprime el resultado; devuelve False si hay errores."""
    if avisos:
        print(f"\nAvisos SEO ({len(avisos)}):")
        for a in avisos:
            print("  -", a)
    if errores:
        print(f"\nERRORES SEO ({len(errores)}):", file=sys.stderr)
        for e in errores:
            print("  -", e, file=sys.stderr)
    return not errores
