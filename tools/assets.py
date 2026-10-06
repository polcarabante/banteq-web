"""Genera los recursos gráficos de Banteq (logo, iconos, ilustraciones, imágenes de proyectos).

Las piezas con texto o vectores se maquetan en HTML y se renderizan con Chrome
(tools/capture.mjs) usando las mismas fuentes de la plantilla (Geist e Inter), para que
encajen tipográficamente con la web. El resto se compone con Pillow.

    python3 tools/assets.py
    python3 tools/assets.py iconos   → solo favicon e iconos (Pillow)

Salida: assets-banteq/generado/ (lo consume tools/build.py).
"""
import json
import subprocess
import sys
from pathlib import Path

from PIL import Image, ImageChops, ImageEnhance, ImageFilter, ImageOps

TOOLS = Path(__file__).resolve().parent
sys.path.insert(0, str(TOOLS))

import contenido as C  # noqa: E402

ROOT = TOOLS.parent
TPL = ROOT / "plantilla-original"
IMG = TPL / "framerusercontent.com/images"
GEN = ROOT / "assets-banteq/generado"
SRC = GEN / "_html"
CAPS = ROOT / "assets-banteq/capturas"

FONTS = f"""
@font-face {{ font-family: Geist; font-weight: 100 900; src: url('file://{TPL}/fonts.gstatic.com/s/geist/v5/gyByhwUxId8gMEwcGFU.woff2'); }}
@font-face {{ font-family: Inter; font-weight: 400; src: url('file://{TPL}/framerusercontent.com/assets/GrgcKwrN6d3Uz8EwcLHZxwEfC4.woff2'); }}
@font-face {{ font-family: Inter; font-weight: 600; src: url('file://{TPL}/framerusercontent.com/assets/yDtI2UI8XcEg1W2je9XPN3Noo.woff2'); }}
@font-face {{ font-family: Inter; font-weight: 700; src: url('file://{TPL}/framerusercontent.com/assets/syRNPWzAMIrcJ3wIlPIP43KjQs.woff2'); }}
"""

# Iridiscencia de Banteq (misma que los tokens de banteq.css).
IRIS = "linear-gradient(135deg, #b4c3ff 0%, #c9fbf1 30%, #d6ccff 55%, #a8e6ff 78%, #5f7dff 100%)"


def rrect(x, y, w, h, rl, rr):
    """Rectángulo con radios distintos a izquierda y derecha (bloques del símbolo)."""
    return (
        f"M{x + rl},{y} H{x + w - rr} A{rr},{rr} 0 0 1 {x + w},{y + rr} V{y + h - rr} "
        f"A{rr},{rr} 0 0 1 {x + w - rr},{y + h} H{x + rl} A{rl},{rl} 0 0 1 {x},{y + h - rl} "
        f"V{y + rl} A{rl},{rl} 0 0 1 {x + rl},{y} Z"
    )


# Símbolo de Banteq: dos bloques apilados que forman una B (procesos que encajan).
MARK_PATH = rrect(13, 9, 30, 21, 2.5, 10.5) + " " + rrect(13, 34, 38, 21, 2.5, 10.5)


def mark_svg(fill="#fff", size="100%", view="0 0 64 64", extra=""):
    return f'<svg xmlns="http://www.w3.org/2000/svg" viewBox="{view}" width="{size}" height="{size}" {extra}><path d="{MARK_PATH}" fill="{fill}"/></svg>'


def mark_path_scaled(scale, dx=0, dy=0):
    """Trazado del símbolo escalado (para incrustarlo en SVG de otras medidas)."""
    import re

    def sc(m):
        return f"{float(m.group(0)) * scale:.3f}"

    p = re.sub(r"-?\d+(?:\.\d+)?", sc, MARK_PATH)
    return p, (dx, dy)


# Iconos de línea (24×24) para servicios web y botones.
ICONS = {
    "web": '<rect x="3" y="4" width="18" height="16" rx="2.5"/><path d="M3 8.5h18"/><path d="M6.5 6.25h.01M9 6.25h.01"/><path d="M7 13h6M7 16h4"/>',
    "rediseno": '<path d="M19.5 11A7.5 7.5 0 0 0 6 6.3"/><path d="M5 3v4h4"/><path d="M4.5 13A7.5 7.5 0 0 0 18 17.7"/><path d="M19 21v-4h-4"/>',
    "3d": '<path d="M12 3l8 4.5v9L12 21l-8-4.5v-9z"/><path d="M12 12l8-4.5M12 12v9M12 12L4 7.5"/>',
    "formulario": '<rect x="4" y="3.5" width="16" height="17" rx="2.5"/><path d="M8 8h8M8 12h8M8 16h3.5"/><path d="M14 16.3l1.4 1.4 2.6-2.8"/>',
    "integracion": '<circle cx="6" cy="6" r="2.5"/><circle cx="18" cy="6" r="2.5"/><circle cx="12" cy="18" r="2.5"/><path d="M8.5 6h7M7.3 8.2l3.5 7.5M16.7 8.2l-3.5 7.5"/>',
    "responsive": '<rect x="2.5" y="4" width="14" height="10.5" rx="1.8"/><path d="M6.5 18h6M9.5 14.5V18"/><rect x="17.5" y="8" width="4.5" height="12" rx="1.2"/>',
    "medida": '<path d="M4 7h9M17 7h3M4 17h3M11 17h9"/><circle cx="15" cy="7" r="2"/><circle cx="9" cy="17" r="2"/>',
    "flujo": '<rect x="3" y="3" width="6" height="6" rx="1.5"/><rect x="15" y="3" width="6" height="6" rx="1.5"/><rect x="9" y="15" width="6" height="6" rx="1.5"/><path d="M6 9v2.5a1.5 1.5 0 0 0 1.5 1.5h9A1.5 1.5 0 0 0 18 11.5V9M12 13v2"/>',
}


def icon_svg(name, color="#1a1a1a", stroke=1.6):
    return (
        f'<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="{color}" '
        f'stroke-width="{stroke}" stroke-linecap="round" stroke-linejoin="round">{ICONS[name]}</svg>'
    )


def page(body, w, h, extra_css="", bg="transparent"):
    return f"""<!doctype html><html><head><meta charset="utf-8"><style>{FONTS}
    html,body{{margin:0;padding:0;width:{w}px;height:{h}px;background:{bg};overflow:hidden;
      -webkit-font-smoothing:antialiased;font-family:Inter,sans-serif}}
    *{{box-sizing:border-box}} {extra_css}</style></head><body>{body}</body></html>"""


JOBS = []


def html_asset(name, w, h, body, css="", bg="transparent", scale=1):
    SRC.mkdir(parents=True, exist_ok=True)
    f = SRC / f"{name}.html"
    f.write_text(page(body, w, h, css, bg), encoding="utf-8")
    JOBS.append({"url": f"file://{f}", "width": w, "height": h, "scale": scale, "out": str(GEN / f"{name}.png"),
                 "wait": 400, "transparent": bg == "transparent"})


# ---------------------------------------------------------------------------
# Marca
# ---------------------------------------------------------------------------

def brand():
    # Logotipo grande del pie (sustituye al de la plantilla, 1440×324, blanco con degradado).
    html_asset(
        "footer-logo", 1440, 324,
        f'<div class="l">{mark_svg("#fff", "250px")}<span>banteq</span></div>',
        """.l{display:flex;align-items:center;justify-content:center;gap:34px;height:324px;
           -webkit-mask-image:linear-gradient(to bottom,#000 18%,rgba(0,0,0,.3) 100%);opacity:.9}
           .l span{font-family:Geist;font-weight:600;font-size:250px;letter-spacing:-.055em;color:#fff;line-height:1;margin-top:-18px}""",
    )
    # Texto circular del pie.
    text = "banteq · banteq · banteq · banteq · banteq · "
    html_asset(
        "circle-text", 320, 320,
        f"""<svg viewBox="0 0 320 320" width="320" height="320" xmlns="http://www.w3.org/2000/svg">
        <defs><path id="c" d="M160,160 m-128,0 a128,128 0 1,1 256,0 a128,128 0 1,1 -256,0"/></defs>
        <text font-family="Inter" font-size="26" fill="#fff" textLength="800" lengthAdjust="spacing"><textPath href="#c" textLength="800" lengthAdjust="spacing">{text}</textPath></text>
        <g transform="translate(97 97) scale(1.97)"><path d="{MARK_PATH}" fill="#fff"/></g></svg>""",
    )
    html_asset("mark-white-200", 200, 200, f'<div style="padding:44px">{mark_svg("#fff", "112px")}</div>')
    html_asset("favicon-256", 256, 256,
               f'<div style="width:256px;height:256px;border-radius:50%;background:#0f0f0f;padding:58px">{mark_svg("#fff", "140px")}</div>')
    # Disco oscuro con el símbolo (tarjetas "¿No sabes por dónde empezar?").
    html_asset(
        "cta-disc", 320, 320,
        f'<div class="d">{mark_svg("#fff", "150px")}</div>',
        f""".d{{width:320px;height:320px;border-radius:50%;display:flex;align-items:center;justify-content:center;
           background:radial-gradient(120% 120% at 30% 20%,#3a3a3a 0%,#161616 55%,#050505 100%);position:relative}}
           .d:after{{content:"";position:absolute;inset:0;border-radius:50%;padding:6px;background:{IRIS};
           -webkit-mask:linear-gradient(#000 0 0) content-box,linear-gradient(#000 0 0);-webkit-mask-composite:xor;opacity:.9}}""",
    )


# ---------------------------------------------------------------------------
# Favicon e iconos (pestañas, resultados de Google, pantalla de inicio de iPhone y Android)
# ---------------------------------------------------------------------------
#
# El icono es el logo del menú de la web: el símbolo de Banteq (MARK_PATH, la B blanca) sobre un
# disco negro. No se rediseña nada; solo cambia cuánto ocupa la B dentro del disco, porque un
# favicon se ve a 16–18 px (pestañas, resultados de Google) y con la proporción del menú (36 % del
# alto) la B se quedaba en 6 px. Aquí ocupa algo más de la mitad del alto, con margen de sobra para
# que sus esquinas no toquen el borde del disco.

ICONO_FONDO = (15, 15, 15)  # #0f0f0f, el negro de la marca
ICONO_ALTO_B = 0.56  # alto de la B respecto al disco
ICONO_ALTO_B_CUADRADO = 0.54  # en el cuadrado opaco de iOS (redondea él las esquinas)
ICONO_ALTO_B_MASKABLE = 0.46  # Android recorta el «maskable» a un círculo del 80 %: la B entera queda dentro
BLOQUES = ((30, 21), (38, 21))  # ancho y alto de los dos bloques de MARK_PATH; hueco de 4 entre ellos
HUECO, ALTO_MARCA = 4, 46


def _bloque(draw, x0, y0, w, h, s):
    """Bloque del símbolo: esquinas izquierdas casi rectas y extremo derecho redondo (como MARK_PATH:
    radio izquierdo = 2,5/21 del alto, derecho = medio alto). En unidades del lienzo × s."""
    rl, rr = h * 2.5 / 21, h / 2
    x0, y0, w, h, rl, rr = (v * s for v in (x0, y0, w, h, rl, rr))
    draw.rounded_rectangle([x0, y0, x0 + w - rr, y0 + h - 1], radius=rl, fill="white")
    draw.rounded_rectangle([x0 + rl, y0, x0 + w - 1, y0 + h - 1], radius=rr, fill="white")


def _icono(size, disco, alto_b=None):
    """Icono de size × size con el símbolo blanco centrado. disco: fondo redondo con las esquinas
    transparentes (favicon); si no, cuadrado entero y opaco (apple-touch-icon y «maskable»).
    Hasta 96 px las medidas del símbolo se ajustan a píxeles enteros (alto de cada bloque, hueco,
    anchos y posición): así los bordes rectos de la B salen nítidos y el hueco entre los dos bloques
    no se emborrona. Se dibuja sobremuestreado y se reduce con BOX (cobertura exacta de cada píxel)."""
    from PIL import ImageDraw

    alto_b = alto_b or (ICONO_ALTO_B if disco else ICONO_ALTO_B_CUADRADO)
    s = 16 if size <= 96 else 8
    im = Image.new("RGBA", (size * s, size * s), (0, 0, 0, 0))
    d = ImageDraw.Draw(im)
    color = ICONO_FONDO + (255,)
    if disco:
        d.ellipse([0, 0, size * s - 1, size * s - 1], fill=color)
    else:
        d.rectangle([0, 0, size * s, size * s], fill=color)
    u = alto_b * size / ALTO_MARCA  # una unidad del símbolo
    h, hueco, (w_top, _), (w_bottom, _) = BLOQUES[0][1] * u, HUECO * u, *[(w * u, 0) for w, _ in BLOQUES]
    if size <= 96:
        h, hueco, w_top, w_bottom = max(1, round(h)), max(1, round(hueco)), round(w_top), round(w_bottom)
    x0, y0 = (size - w_bottom) / 2, (size - (2 * h + hueco)) / 2
    if size <= 96:
        x0, y0 = int(x0 + 0.5), int(y0 + 0.5)
    _bloque(d, x0, y0, w_top, h, s)
    _bloque(d, x0, y0 + h + hueco, w_bottom, h, s)
    im = im.resize((size, size), Image.BOX)
    return im if disco else im.convert("RGB")


def iconos():
    """Favicon en 16/32/48/96 (pestañas, favicon.ico y Google, que pide múltiplos de 48), 192 y 512
    (manifest), apple-touch-icon de 180 y 512 «maskable» (opacos: la B queda dentro de la zona segura)."""
    for size in (16, 32, 48, 96):
        _icono(size, True).save(GEN / f"favicon-{size}.png")
    for size in (192, 512):
        _icono(size, True).save(GEN / f"icon-{size}.png")
    _icono(180, False).save(GEN / "apple-touch-icon-180.png")
    _icono(512, False, ICONO_ALTO_B_MASKABLE).save(GEN / "icon-maskable-512.png")


def og_image():
    """Imagen para compartir en redes (Open Graph). La línea de servicios sigue a
    contenido.MOSTRAR_COPILOT_FUNDAE."""
    servicios = (
        "Automatización · Inteligencia artificial · Microsoft Copilot · Formación FUNDAE · Desarrollo web"
        if C.MOSTRAR_COPILOT_FUNDAE
        else "Automatización · Inteligencia artificial · Desarrollo web"
    )
    html_asset(
        "og", 1200, 630,
        f"""<div class="og"><div class="lock">{mark_svg("#fff", "92px")}<span>banteq</span></div>
        <h1>Tecnología que mejora<br>cómo trabaja tu empresa</h1>
        <p>{servicios}</p></div>""",
        f""".og{{width:1200px;height:630px;padding:80px 90px;color:#fff;
           background:radial-gradient(80% 90% at 85% 10%,rgba(95,125,255,.35),transparent 60%),
           radial-gradient(70% 80% at 10% 100%,rgba(168,230,255,.18),transparent 60%),#0b0b0c}}
           .lock{{display:flex;align-items:center;gap:18px}} .lock span{{font-family:Geist;font-weight:600;font-size:64px;letter-spacing:-.05em}}
           h1{{font-family:Geist;font-weight:500;font-size:74px;line-height:1.02;letter-spacing:-.045em;margin:70px 0 28px;
           background:{IRIS};-webkit-background-clip:text;color:transparent}}
           p{{font-size:24px;color:rgba(255,255,255,.65);margin:0}}""",
    )


# ---------------------------------------------------------------------------
# Iconos de servicios (sustituyen avatares de stock)
# ---------------------------------------------------------------------------

def icon_tiles():
    for name in ["web", "rediseno", "3d", "formulario", "integracion", "responsive", "medida", "flujo"]:
        html_asset(
            f"tile-{name}", 400, 400,
            f'<div class="t">{icon_svg(name, "#1a1a1a", 1.5)}</div>',
            f""".t{{width:400px;height:400px;border-radius:50%;background:{IRIS};display:flex;align-items:center;justify-content:center}}
               .t svg{{width:190px;height:190px}}""",
        )


# ---------------------------------------------------------------------------
# Ilustraciones del bloque de servicios
# ---------------------------------------------------------------------------

ORB = f"""<div class="orb"><div class="in">{mark_svg("#5f7dff", "26px")}</div></div>"""
BUBBLE_CSS = f"""
 .orb{{width:74px;height:74px;border-radius:50%;background:radial-gradient(circle,#fff 42%,rgba(255,255,255,0) 72%),{IRIS};
   display:flex;align-items:center;justify-content:center;flex:none}}
 .orb .in{{width:46px;height:46px;border-radius:50%;background:#fff;display:flex;align-items:center;justify-content:center}}
 .row{{display:flex;align-items:center;gap:14px}}
 .dots{{background:#fff;border-radius:18px;height:74px;width:108px;display:flex;gap:10px;align-items:center;justify-content:center}}
 .dots i{{width:11px;height:11px;border-radius:50%;background:#d6d6d6}} .dots i:last-child{{background:#ebebeb}}
 .me{{white-space:nowrap;background:#4b4b4b;color:#fff;border-radius:22px;padding:22px 24px;font-size:25px;letter-spacing:-.01em;
   box-shadow:0 0 0 2px rgba(255,255,255,.35) inset,0 6px 18px rgba(0,0,0,.18);filter:blur(.25px)}}
 .bot{{white-space:nowrap;background:#fff;color:#1a1a1a;border-radius:22px;padding:22px 24px;font-size:25px;letter-spacing:-.01em}}
 .av{{width:78px;height:78px;border-radius:50%;flex:none;display:flex;align-items:center;justify-content:center;
   font-family:Geist;font-weight:600;font-size:26px;color:#1a1a1a;background:{IRIS}}}
"""


def chat(name, w, h, pad_left, gap):
    html_asset(
        name, w, h,
        f"""<div style="padding:0 0 0 {pad_left}px;display:flex;flex-direction:column;gap:{gap}px">
        <div class="row">{ORB}<div class="dots"><i></i><i></i><i></i></div></div>
        <div class="row" style="margin-left:86px"><div class="me">¿Me resumes los correos de hoy?</div><div class="av">LM</div></div>
        <div class="row">{ORB}<div class="bot">Claro, aquí tienes el resumen.</div></div></div>""",
        BUBBLE_CSS,
    )


def lead_card():
    side = lambda x, n, b, o, s: f"""<div class="c side" style="left:{x}px;opacity:{o};transform:scale({s})">
      <div class="av2">{n[:2].upper()}</div><div class="n">{n}</div><div class="b">{b}</div></div>"""
    html_asset(
        "lead-card", 580, 367,
        f"""<div class="wrap">
        {side(0, "Email", "Pendiente", .35, .82)}{side(492 - 86, "Web", "Nuevo", .35, .82)}
        {side(72, "WhatsApp", "Respondido", .6, .9)}{side(330, "Teléfono", "Seguimiento", .6, .9)}
        <div class="c main"><div class="avm">MR</div><div class="nm">Nuevo contacto</div><div class="bm">● Cualificado</div></div></div>""",
        f""".wrap{{position:relative;width:580px;height:367px}}
        .c{{position:absolute;border-radius:40px;background:#fff;display:flex;flex-direction:column;align-items:center}}
        .side{{top:120px;width:176px;height:200px;background:rgba(255,255,255,.85);padding-top:34px;gap:10px;filter:blur(1px)}}
        .av2{{width:62px;height:62px;border-radius:50%;background:#e9e9e9;display:flex;align-items:center;justify-content:center;
           font-family:Geist;font-weight:600;color:#9a9a9a;font-size:20px}}
        .n{{font-size:20px;color:#8a8a8a}} .b{{font-size:15px;color:#7fb896;background:#eaf5ee;border-radius:10px;padding:6px 12px}}
        .main{{left:158px;top:40px;width:264px;height:327px;padding-top:38px;gap:18px;border:3px solid transparent;
           background:linear-gradient(#fff,#fff) padding-box,{IRIS} border-box;box-shadow:0 20px 40px rgba(0,0,0,.08)}}
        .avm{{width:104px;height:104px;border-radius:50%;background:{IRIS};display:flex;align-items:center;justify-content:center;
           font-family:Geist;font-weight:600;font-size:34px;color:#1a1a1a}}
        .nm{{font-size:27px;color:#1a1a1a;letter-spacing:-.01em}}
        .bm{{font-size:21px;color:#1c7a47;background:#e2f1e8;border-radius:14px;padding:12px 18px}}""",
    )


def chart_label():
    src = IMG / "6TuyOzSCZDNOdRtZ8FK3OJeJ8.png"
    html_asset(
        "chart", 600, 257,
        f"""<img src="file://{src}" style="position:absolute;inset:0;width:600px;height:257px">
        <div class="lab">Informe semanal</div>""",
        """.lab{position:absolute;left:380px;top:52px;width:192px;height:42px;border-radius:12px;background:#fff;
           border:1px solid #e3e3e3;display:flex;align-items:center;justify-content:center;font-size:17px;color:#1a1a1a;letter-spacing:-.01em}""",
    )


def diagram_icon():
    src = IMG / "cgrW7f9W33xv3ZDvvKXaqAaaIL0.png"
    html_asset(
        "diagram", 750, 780,
        f"""<img src="file://{src}" style="position:absolute;inset:0;width:750px;height:780px">
        <div class="cover">{mark_svg("#a9a9a9", "64px")}</div>""",
        """.cover{position:absolute;left:304px;top:65px;width:141px;height:141px;border-radius:50%;
           background:radial-gradient(circle,#fff 60%,#f7f7f7 100%);display:flex;align-items:center;justify-content:center}""",
    )


# ---------------------------------------------------------------------------
# Logos de clientes
# ---------------------------------------------------------------------------

def logo_mono(src, color, out, pad=0):
    im = Image.open(src).convert("RGBA")
    alpha = im.split()[3]
    bbox = alpha.getbbox()
    alpha = alpha.crop(bbox)
    solid = Image.new("RGBA", alpha.size, color)
    solid.putalpha(alpha)
    if pad:
        canvas = Image.new("RGBA", (solid.width + 2 * pad, solid.height + 2 * pad), (0, 0, 0, 0))
        canvas.alpha_composite(solid, (pad, pad))
        solid = canvas
    solid.save(out)
    return solid


def fit_canvas(im, w, h, align="left"):
    """Encaja un logo en un lienzo transparente de w×h, centrado en vertical."""
    im = im.copy()
    im.thumbnail((w, h), Image.LANCZOS)
    canvas = Image.new("RGBA", (w, h), (0, 0, 0, 0))
    x = 0 if align == "left" else (w - im.width) // 2
    canvas.alpha_composite(im, (x, (h - im.height) // 2))
    return canvas


def client_logos():
    rent_white = logo_mono(Path.home() / "rentup/static/logogrande1.png", (255, 255, 255, 255), GEN / "rentup-white.png")
    rent_dark = logo_mono(Path.home() / "rentup/static/negro.png", (41, 41, 41, 255), GEN / "rentup-dark.png")
    marg_white = logo_mono(Path.home() / "margon-web/assets/brand/margon-logo-white.png", (255, 255, 255, 255), GEN / "margon-white.png")
    marg_dark = logo_mono(Path.home() / "margon-web/assets/brand/margon-logo-white.png", (41, 41, 41, 255), GEN / "margon-dark.png")
    # Tarjetas grandes de "Desarrollo web" (logo blanco sobre la foto, 636×128).
    fit_canvas(marg_white, 636, 96).save(GEN / "feature-logo-margon.png")
    fit_canvas(rent_white, 636, 112).save(GEN / "feature-logo-rentup.png")
    # Tarjetas del CMS de proyectos (logo oscuro, 276×64).
    for im, name, box_h in ((marg_dark, "cms-logo-margon.png", 34), (rent_dark, "cms-logo-rentup.png", 44)):
        canvas = Image.new("RGBA", (276, 64), (0, 0, 0, 0))
        logo = fit_canvas(im, 276, box_h)
        canvas.alpha_composite(logo, (0, (64 - box_h) // 2))
        canvas.save(GEN / name)


# ---------------------------------------------------------------------------
# Imágenes de proyectos (capturas reales de las webs)
# ---------------------------------------------------------------------------

def cover(im, w, h, focus_y=0.0):
    """Recorta la imagen para cubrir w×h (como object-fit: cover), anclada arriba por defecto."""
    r = max(w / im.width, h / im.height)
    im = im.resize((round(im.width * r), round(im.height * r)), Image.LANCZOS)
    x = (im.width - w) // 2
    y = round((im.height - h) * focus_y)
    return im.crop((x, y, x + w, y + h))


def framed(shot, w, h, pad=0.07, radius=28):
    """Captura dentro de un marco oscuro con esquinas redondeadas, al estilo de la plantilla."""
    bg = Image.new("RGB", (w, h), (12, 12, 13))
    glow = Image.new("RGB", (w, h), (0, 0, 0))
    inner_w = round(w * (1 - 2 * pad))
    inner_h = round(inner_w * shot.height / shot.width)
    if inner_h > h * (1 - 2 * pad):
        inner_h = round(h * (1 - 2 * pad))
        inner_w = round(inner_h * shot.width / shot.height)
    s = shot.resize((inner_w, inner_h), Image.LANCZOS)
    mask = Image.new("L", s.size, 0)
    from PIL import ImageDraw

    ImageDraw.Draw(mask).rounded_rectangle([0, 0, s.width - 1, s.height - 1], radius=radius, fill=255)
    x, y = (w - s.width) // 2, (h - s.height) // 2
    # Halo azul Banteq detrás de la captura.
    halo = Image.new("L", (w, h), 0)
    ImageDraw.Draw(halo).rounded_rectangle([x - 10, y - 10, x + s.width + 10, y + s.height + 10], radius=radius + 10, fill=150)
    halo = halo.filter(ImageFilter.GaussianBlur(40))
    bg = Image.composite(Image.new("RGB", (w, h), (70, 95, 200)), bg, halo)
    bg.paste(s, (x, y), mask)
    return bg


def project_images():
    shots = {k: Image.open(CAPS / f"{k}.png").convert("RGB") for k in
             ["margon-home", "margon-ferroviario", "margon-defensa", "margon-home-movil",
              "rentup-home", "rentup-club", "rentup-home-movil"]}
    out = {}
    # Tarjetas del carrusel de proyectos (762×720) y cabecera del detalle (1280×720).
    framed(shots["margon-home"], 762, 720).save(GEN / "cms-card-margon.jpg", quality=88)
    framed(shots["rentup-home"], 762, 720).save(GEN / "cms-card-rentup.jpg", quality=88)
    cover(shots["margon-home"], 1280, 720, 0).save(GEN / "cms-hero-margon.jpg", quality=88)
    cover(shots["rentup-home"], 1280, 720, 0).save(GEN / "cms-hero-rentup.jpg", quality=88)
    # Bloques del detalle (616×480).
    framed(shots["margon-home-movil"].crop((0, 0, 780, 1400)), 616, 480, pad=0.06).save(GEN / "cms-margon-1.jpg", quality=88)
    framed(shots["margon-ferroviario"], 616, 480).save(GEN / "cms-margon-2.jpg", quality=88)
    framed(shots["margon-defensa"], 616, 480).save(GEN / "cms-margon-3.jpg", quality=88)
    framed(shots["margon-home"], 616, 480).save(GEN / "cms-margon-4.jpg", quality=88)
    framed(shots["rentup-home"], 616, 480).save(GEN / "cms-rentup-1.jpg", quality=88)
    framed(shots["rentup-club"].crop((0, 0, 1440, 780)), 616, 480).save(GEN / "cms-rentup-3.jpg", quality=88)
    framed(shots["rentup-home-movil"].crop((0, 0, 780, 1400)), 616, 480, pad=0.06).save(GEN / "cms-rentup-4.jpg", quality=88)
    # Tarjetas grandes de "Desarrollo web" (632×735): la web en el móvil.
    return out


def flow_illustration():
    """Bloque 2 de RentUp: qué pasa cuando alguien envía un formulario."""
    step = lambda icon, t, s: f'<div class="s"><div class="i">{icon_svg(icon, "#1a1a1a", 1.6)}</div><b>{t}</b><span>{s}</span></div>'
    html_asset(
        "cms-rentup-2", 616, 480,
        f"""<div class="w"><div class="k">Cada solicitud</div>
        {step("formulario", "Formulario web", "Asesoramiento, club o newsletter")}
        <div class="a"></div>{step("integracion", "Brevo", "El contacto se guarda en su lista")}
        <div class="a"></div>{step("flujo", "Resend", "Confirmación a quien escribe y aviso al equipo")}</div>""",
        f""".w{{width:616px;height:480px;background:#f2f2f2;padding:40px 70px;display:flex;flex-direction:column;align-items:center}}
        .k{{font-size:14px;letter-spacing:.12em;text-transform:uppercase;color:#8a8a8a;margin-bottom:18px}}
        .s{{width:100%;background:#fff;border-radius:22px;padding:16px 20px;display:grid;grid-template-columns:52px 1fr;
           grid-template-rows:auto auto;column-gap:16px;align-items:center;box-shadow:0 0 0 1px #e6e6e6}}
        .i{{grid-row:1/3;width:52px;height:52px;border-radius:50%;background:{IRIS};display:flex;align-items:center;justify-content:center}}
        .i svg{{width:26px;height:26px}} b{{font-family:Geist;font-weight:600;font-size:21px;color:#1a1a1a;letter-spacing:-.02em}}
        span{{font-size:15px;color:#6b6b6b}} .a{{width:2px;height:24px;background:linear-gradient(#5f7dff,#a8e6ff);margin:6px 0}}""",
    )


def about_image():
    """'Quiénes somos': fotograma de las ondas abstractas del pie con la iridiscencia de Banteq."""
    frame = GEN / "_frame_about.png"
    subprocess.run(
        ["ffmpeg", "-loglevel", "error", "-y", "-ss", "3.2", "-i",
         str(TPL / "framerusercontent.com/assets/S4N88TVzCfxigg9YZYcSIYNPk4.mp4"), "-frames:v", "1", str(frame)],
        check=True,
    )
    im = Image.open(frame).convert("RGB")
    im = cover(im, 1200, 800, 0.55)
    gray = ImageOps.grayscale(im).convert("RGB")
    grad = Image.new("RGB", (1200, 800))
    from PIL import ImageDraw

    d = ImageDraw.Draw(grad)
    stops = [(0, (180, 195, 255)), (0.35, (201, 251, 241)), (0.6, (214, 204, 255)), (0.8, (168, 230, 255)), (1, (95, 125, 255))]
    for x in range(1200):
        t = x / 1199
        for (t0, c0), (t1, c1) in zip(stops, stops[1:]):
            if t0 <= t <= t1:
                k = (t - t0) / (t1 - t0)
                d.line([(x, 0), (x, 799)], fill=tuple(round(a + (b - a) * k) for a, b in zip(c0, c1)))
                break
    # Negros levantados y matiz iridiscente: la franja visible (una píldora muy panorámica)
    # queda luminosa y encaja con el fondo gris claro de la sección.
    lifted = gray.point(lambda v: round(70 + v * (235 - 70) / 255))
    tinted = ImageChops.multiply(lifted, grad)
    out = Image.blend(lifted, tinted, 0.6)
    out = ImageEnhance.Contrast(out).enhance(1.05)
    out.save(GEN / "about.jpg", quality=90)


def integration_icons():
    """Iconos de herramientas (Simple Icons, CC0) en el gris de la plantilla."""
    import urllib.request

    slugs = ["n8n", "make", "openai", "whatsapp", "googledrive", "notion", "airtable", "odoo"]
    icons = {}
    for slug in slugs:
        dst = GEN / f"_si-{slug}.svg"
        if not dst.exists():
            url = f"https://cdn.jsdelivr.net/npm/simple-icons@13/icons/{slug}.svg"
            dst.write_bytes(urllib.request.urlopen(url, timeout=30).read())
        icons[slug] = dst.read_text()
    # Microsoft no está en Simple Icons: cuatro cuadrados, y un icono genérico para APIs.
    icons["microsoft"] = '<svg viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path d="M2 2h9.5v9.5H2zM12.5 2H22v9.5h-9.5zM2 12.5h9.5V22H2zM12.5 12.5H22V22h-9.5z"/></svg>'
    icons["api"] = ('<svg viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg" fill="none" stroke="#000" stroke-width="2.2" '
                    'stroke-linecap="round" stroke-linejoin="round"><path d="M8 6l-6 6 6 6M16 6l6 6-6 6M13.5 4l-3 16"/></svg>')
    for slug, svg in icons.items():
        svg = svg.replace("<svg ", '<svg width="100%" height="100%" ', 1)
        html_asset(f"tool-{slug}", 80, 80, f'<div class="t">{svg}</div>',
                   """.t{width:80px;height:80px;padding:12px}.t svg{fill:#525252;display:block}
                      .t svg[stroke]{fill:none;stroke:#525252}""")


def feature_cards():
    """Tarjetas grandes de 'Desarrollo web' (632×735): la web del cliente en una ventana de
    navegador sobre fondo oscuro, con la parte inferior libre para el título superpuesto."""
    for name, shot in (("feature-margon", "margon-home"), ("feature-rentup", "rentup-home")):
        html_asset(
            name, 632, 735,
            f"""<div class="bg"><div class="win"><div class="bar"><i></i><i></i><i></i></div>
            <img src="file://{CAPS / (shot + '.png')}"></div></div>""",
            f""".bg{{position:relative;width:632px;height:735px;overflow:hidden;
               background:radial-gradient(70% 55% at 70% 22%,rgba(95,125,255,.55),transparent 70%),
               radial-gradient(60% 50% at 20% 40%,rgba(168,230,255,.18),transparent 70%),#09090b}}
               .win{{position:absolute;left:46px;top:128px;width:540px;border-radius:18px;overflow:hidden;
               background:#141416;box-shadow:0 0 0 1px rgba(255,255,255,.14),0 30px 80px rgba(0,0,0,.55)}}
               .bar{{height:26px;display:flex;align-items:center;gap:7px;padding:0 12px;background:#1b1b1e}}
               .bar i{{width:8px;height:8px;border-radius:50%;background:rgba(255,255,255,.22)}}
               .win img{{display:block;width:540px}}
               .bg:after{{content:"";position:absolute;inset:0;background:linear-gradient(to bottom,transparent 52%,rgba(9,9,11,.85) 72%,#09090b 86%)}}""",
            bg="#09090b",
        )


def cuadro():
    """Logotipo blanco (símbolo + «banteq») para el cuadrado central de «Quiénes somos».
    Fondo transparente y sin degradado; se recorta al contenido después de renderizarlo."""
    html_asset(
        "cuadro-logo", 1000, 300,
        f'<div class="l">{mark_svg("#fff", "220px")}<span>banteq</span></div>',
        """.l{display:flex;align-items:center;justify-content:center;gap:30px;height:300px}
           .l span{font-family:Geist;font-weight:600;font-size:220px;letter-spacing:-.055em;color:#fff;line-height:1;margin-top:-16px}""",
    )


def trim(name, pad=8):
    im = Image.open(GEN / name)
    box = im.getbbox()
    im.crop((max(0, box[0] - pad), max(0, box[1] - pad), min(im.width, box[2] + pad), min(im.height, box[3] + pad))).save(GEN / name, optimize=True)


def transparent(name, w, h):
    Image.new("RGBA", (w, h), (0, 0, 0, 0)).save(GEN / name)


def main():
    GEN.mkdir(parents=True, exist_ok=True)
    brand()
    iconos()
    og_image()
    icon_tiles()
    chat("chat-648", 648, 288, 2, 18)
    chat("chat-600", 600, 257, 0, 10)
    lead_card()
    chart_label()
    diagram_icon()
    flow_illustration()
    integration_icons()
    feature_cards()
    cuadro()
    (GEN / "_jobs.json").write_text(json.dumps(JOBS, indent=1))
    subprocess.run(["node", str(TOOLS / "capture.mjs"), str(GEN / "_jobs.json")], check=True)
    trim("cuadro-logo.png")
    client_logos()
    project_images()
    about_image()
    transparent("empty-100x96.png", 100, 96)
    print("OK →", GEN)


def solo(nombre, generar):
    """python3 tools/assets.py cuadro | og — solo esa pieza (logotipo del cuadrado central o imagen
    para redes)."""
    GEN.mkdir(parents=True, exist_ok=True)
    generar()
    jobs = GEN / f"_jobs-{nombre}.json"  # aparte: _jobs.json es la lista completa de main()
    jobs.write_text(json.dumps(JOBS, indent=1))
    subprocess.run(["node", str(TOOLS / "capture.mjs"), str(jobs)], check=True)
    jobs.unlink()
    if nombre == "cuadro":
        trim("cuadro-logo.png")
    print("OK →", GEN)


if __name__ == "__main__":
    piezas = {"cuadro": cuadro, "og": og_image}
    if sys.argv[1:2] == ["iconos"]:  # solo Pillow, sin Chrome
        GEN.mkdir(parents=True, exist_ok=True)
        iconos()
        print("OK →", GEN)
    elif sys.argv[1:2] and sys.argv[1] in piezas:
        solo(sys.argv[1], piezas[sys.argv[1]])
    else:
        main()
