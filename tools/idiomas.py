"""Idiomas de la web: castellano (el original), catalán (/ca/…) e inglés (/en/…).

Cada página tiene su dirección en los tres idiomas. Aquí está la tabla de direcciones y los textos
de los módulos contenido_ca.py y contenido_en.py (uno por idioma, misma estructura). Nada de esto
cambia la web en castellano.

Cómo se traduce cada cosa (ver tools/build.py, «Idiomas»):
- Páginas de servicio: contenido propio por idioma (SERVICIOS_CA / SERVICIOS_EN), con su HTML inicial.
- Resto de páginas (home, proyectos, avisos legales): son las mismas páginas de Framer con otra
  dirección (/ca, /en/projects…). Sus textos se traducen donde Framer los pinta (build.py envuelve
  cada texto con BQT(), definido por i18n-<idioma>.js) y, para lo que no pasa por Framer
  (demostraciones, ventanas de banteq.js), sobre la página pintada (banteq-i18n.js).
"""
import contenido as C
import contenido_ca as CA
import contenido_en as EN

IDIOMAS = ("es", "ca", "en")
OTROS = ("ca", "en")
MODULO = {"ca": CA, "en": EN}
NOMBRE = {"es": "Español", "ca": "Català", "en": "English"}
CODIGO = {"es": "ES", "ca": "CA", "en": "EN"}
LOCALE = {"es": "es_ES", "ca": "ca_ES", "en": "en_GB"}

# Direcciones de las páginas que no son de servicio (sin «/» inicial; "" es la portada).
_BASE = {
    "": {"ca": "ca", "en": "en"},
    "proyectos": {"ca": "ca/projectes", "en": "en/projects"},
    "aviso-legal": {"ca": "ca/avis-legal", "en": "en/legal-notice"},
    "privacidad": {"ca": "ca/privacitat", "en": "en/privacy"},
}
# Las páginas de proyecto cambian solo el prefijo; el final (slug) es el mismo en los tres idiomas.
PREFIJO_PROYECTO = {"ca": "ca/projectes", "en": "en/projects"}


# Frase de cambio de idioma al final de las páginas de servicio (las de catalán e inglés, en su módulo).
ALTERNA_ES = ("Esta página también está disponible en ", {"ca": "catalán", "en": "inglés"}, " y ", ".")


def tabla():
    """Lista de grupos: {"es": ruta, "ca": ruta, "en": ruta, "servicio": bool} (sin «/» inicial)."""
    grupos = [{"es": es, **rutas, "servicio": False} for es, rutas in _BASE.items()]
    for pr in C.PROYECTOS:
        grupos.append({"es": f"proyectos/{pr['slug']}", **{l: f"{p}/{pr['slug']}" for l, p in PREFIJO_PROYECTO.items()}, "servicio": False})
    for sv in C.SERVICIOS:
        g = {"es": sv["slug"], "servicio": True}
        for idioma in OTROS:
            par = next((x for x in servicios(idioma) if x["es"] == sv["slug"]), None)
            assert par, f"falta la página de servicio {sv['slug']} en {idioma}"
            g[idioma] = par["slug"]
        grupos.append(g)
    return grupos


def servicios(idioma):
    return getattr(MODULO[idioma], f"SERVICIOS_{idioma.upper()}")


def idioma_de(ruta):
    """Idioma de una ruta («ca/…» → ca, «en/…» → en, la raíz «ca» o «en» también)."""
    primero = ruta.strip("/").split("/")[0]
    return primero if primero in OTROS else "es"


def textos(idioma):
    return getattr(MODULO[idioma], f"TEXTOS_{idioma.upper()}")


def reglas(idioma):
    return getattr(MODULO[idioma], f"REGLAS_{idioma.upper()}")


def pares_ruta(idioma):
    """Dirección en castellano (con «/») → dirección en `idioma` (con «/»), para reescribir enlaces."""
    return {"/" + g["es"] if g["es"] else "/": "/" + g[idioma] for g in tabla()}


def grupo_de(ruta):
    """Grupo de direcciones al que pertenece una ruta (en cualquiera de sus idiomas), o None."""
    ruta = ruta.strip("/")
    return next((g for g in tabla() if ruta in (g["es"], g["ca"], g["en"])), None)


def tabla_por_es():
    return {g["es"]: g for g in tabla()}


def es_de_alias(ruta):
    """Para una ruta /ca… o /en… de una página que no es de servicio, la ruta en castellano de su
    par ("" para la portada); None si no es de ese tipo (castellano o página de servicio)."""
    g = grupo_de(ruta)
    if g is None or g["servicio"] or ruta.strip("/") == g["es"]:
        return None
    return g["es"]
