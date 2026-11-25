"""Demostraciones interactivas de la sección «Automatización e IA» (pedidas por Pol el 2026-11-25).

Cada tarjeta animada de la home lleva un botón «Pruébalo» que abre una página propia, como la
calculadora de seguimiento (tools/calculadora_ahorro.py): el visitante prueba la automatización con
un documento suyo o de ejemplo, ve el resultado en un «ERP Banteq» de mentira y calcula cuánto se
ahorraría. Todo se procesa en su navegador: no se envía nada a ningún servidor.

Fuente:
- assets-banteq/demos-interactivas/comun/   piezas compartidas (ERP, pasos, subida, ahorro, estilos)
- assets-banteq/demos-interactivas/<demo>/   el HTML del cuerpo (aquí abajo) y su JavaScript
- assets-banteq/demos-interactivas/ejemplos/ documentos de ejemplo (tools/demos_ejemplos.mjs)
- assets-banteq/vendor/                     pdf.js y tesseract.js, que solo se descargan al subir
- lib/facturas-lectura.mjs, lib/demos-ahorro.mjs, lib/demos-erp-datos.mjs (con sus tests)
- tools/textos_demos_interactivas.py         todos los textos en castellano, catalán e inglés

Se publica en /<ruta de cada idioma> (RUTAS) y en /demos/ (código, librerías y ejemplos). Cada
módulo lleva ?v=<huella> en sus import, para que Safari no mezcle versiones al publicar.
"""
from hashlib import sha1
from pathlib import Path
import html
import json
import re
import shutil

import contenido as C
import idiomas as ID
from assets import MARK_PATH
from textos_demos_interactivas import COMUNES, DEMOS

ROOT = Path(__file__).resolve().parent.parent
FUENTE = ROOT / "assets-banteq" / "demos-interactivas"
VENDOR = ROOT / "assets-banteq" / "vendor"
PUBLICO = "demos"  # /demos/: código compartido, librerías y ejemplos

# Dirección de cada demostración en los tres idiomas (sin «/» inicial).
RUTAS = {
    "facturas": {"es": "automatizaciones/facturas", "ca": "ca/automatitzacions/factures", "en": "en/automations/invoices"},
    "asistente": {"es": "automatizaciones/asistente", "ca": "ca/automatitzacions/assistent", "en": "en/automations/assistant"},
    "crm": {"es": "automatizaciones/crm", "ca": "ca/automatitzacions/crm", "en": "en/automations/crm"},
    "informes": {"es": "automatizaciones/informes", "ca": "ca/automatitzacions/informes", "en": "en/automations/reports"},
    "reservas": {"es": "automatizaciones/reservas", "ca": "ca/automatitzacions/reserves", "en": "en/automations/bookings"},
}
# Página de servicio (ruta en castellano) a la que cuelga cada demostración en las migas.
SERVICIO = {"facturas": "automatizacion-procesos", "asistente": "inteligencia-artificial", "crm": "automatizacion-procesos", "informes": "automatizacion-procesos", "reservas": "automatizacion-procesos"}
# Manual de ejemplo del asistente en cada idioma (tools/demos_manual_p12.mjs → demos_ejemplos.mjs).
MANUAL_EJEMPLO = {"es": "manual-prensa-P-12.pdf", "ca": "manual-premsa-P-12.pdf", "en": "P-12-press-manual.pdf"}
# Lista de contactos de ejemplo del CRM (tools/demos_contactos.mjs), en .csv y .xlsx.
CONTACTOS_EJEMPLO = {"es": "contactos-ejemplo", "ca": "contactes-exemple", "en": "contacts-sample"}
# Ventas de ejemplo de los informes (tools/demos_ventas.mjs): Excel limpio y CSV «sucio», y exportación de ERP.
VENTAS_EJEMPLO = {"es": ("ventas-ejemplo", "exportacion-erp"), "ca": ("vendes-exemple", "exportacio-erp"), "en": ("sales-sample", "erp-export")}


# Grupos de direcciones como los de idiomas.tabla() (no se añaden allí: idiomas.py forma parte de la
# firma de las instantáneas de prerender y estas páginas no cambian ninguna). build.py los suma para
# el selector de idioma, los enlaces de las páginas traducidas y los hreflang del sitemap.
def grupos():
    return [{**r, "servicio": True} for r in RUTAS.values()]


def grupo_de(ruta):
    ruta = ruta.strip("/")
    return next((g for g in grupos() if ruta in (g["es"], g["ca"], g["en"])), None)


def pares_ruta(idioma):
    return {"/" + g["es"]: "/" + g[idioma] for g in grupos()}


# Módulos de lib/ que usan las páginas (se publican en /demos/lib/).
LIB = ["facturas-lectura.mjs", "asistente-busqueda.mjs", "crm-leads.mjs", "informes-datos.mjs", "agenda.mjs", "demos-ahorro.mjs", "demos-erp-datos.mjs"]
MAX_MB = 10
INDICE = {"es": 0, "ca": 1, "en": 2}
NOMBRE_IDIOMA = {"es": "Castellano", "ca": "Català", "en": "English"}
INICIO_MIGA = {"es": "Inicio", "ca": "Inici", "en": "Home"}


def _huella(datos):
    return sha1(datos if isinstance(datos, bytes) else datos.encode("utf-8")).hexdigest()[:10]


def textos(demo, idioma):
    i = INDICE[idioma]
    return {k: v[i] for k, v in {**COMUNES, **DEMOS[demo]}.items()}


def _e(s):
    return html.escape(s, quote=True)


def _url(ruta):
    return f"{C.SITIO}/{ruta}" if ruta else f"{C.SITIO}/"


def _ruta(es_ruta, idioma):
    """Dirección de una página de la web (por su ruta en castellano) en `idioma`, con «/» inicial."""
    g = ID.tabla_por_es()[es_ruta]
    return "/" + g[idioma] if g[idioma] else "/"


# --- Cuerpo de cada demostración -------------------------------------------------------------------

CANDADO = ('<svg viewBox="0 0 16 16" aria-hidden="true"><rect x="3" y="7" width="10" height="7.5" rx="1.8"/>'
           '<path d="M5.5 7V5a2.5 2.5 0 0 1 5 0v2"/></svg>')
SUBIR = ('<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 15.5V4.5M7.5 9 12 4.5 16.5 9"/>'
         '<path d="M4.5 14.5v3a2 2 0 0 0 2 2h11a2 2 0 0 0 2-2v-3"/></svg>')


def subida(T, formatos_clave, accept):
    return (
        '<div class="subida" data-subida>'
        f'<input type="file" id="archivo" class="subida-input" accept="{_e(accept)}" aria-describedby="subida-formatos subida-privacidad subida-error">'
        f'<label class="subida-zona" for="archivo">{SUBIR}'
        f'<span class="subida-texto subida-escritorio">{_e(T["subida.arrastra"])} <u>{_e(T["subida.elige"])}</u></span>'
        f'<span class="subida-texto subida-tactil"><u>{_e(T["subida.movil"])}</u></span>'
        f'<small id="subida-formatos">{_e(T[formatos_clave])} · {_e(T["subida.max"].format(mb=MAX_MB))}</small></label>'
        f'<p class="subida-privacidad" id="subida-privacidad">{CANDADO}{_e(T["privacidad"])}</p>'
        '<p class="subida-error" id="subida-error" role="alert" hidden></p>'
        '</div>'
    )


def cuerpo_facturas(T):
    ejemplos = [("correcta", "factura-correcta.pdf"), ("error", "factura-con-error.pdf"), ("xml", "factura-facturae.xml")]
    botones = "".join(
        f'<button type="button" class="ejemplo" data-ejemplo="/{PUBLICO}/ejemplos/{a}">{_e(T["ejemplo." + k])}</button>'
        for k, a in ejemplos)
    fases = ["lectura", "extraccion", "validacion", "registro"]
    pasos = "".join(f'<li class="paso" data-estado="espera"><span class="paso-icono" aria-hidden="true"></span>'
                    f'<span class="paso-texto"><b>{_e(T["fase." + f])}</b><small></small></span></li>' for f in fases)
    campos = [("proveedor", "text", "organization", "campo-ancho"), ("nif", "text", "off", ""), ("numero", "text", "off", ""),
              ("fecha", "date", "off", ""), ("base", "text", "off", "importe"), ("iva", "text", "off", "importe"),
              ("total", "text", "off", "importe"), ("vencimiento", "date", "off", "")]
    filas = "".join(
        f'<div class="campo {cls}" data-campo="{k}"><label for="c-{k}">{_e(T["campo." + k])}<span class="campo-extra"></span></label>'
        f'<input id="c-{k}" name="{k}" type="{tipo}" autocomplete="{auto}"{" inputmode=" + chr(34) + "decimal" + chr(34) if cls == "importe" else ""} spellcheck="false">'
        f'<small class="campo-aviso" id="c-{k}-aviso" hidden></small></div>'
        for k, tipo, auto, cls in campos)
    return (
        '<div class="demo">'
        '<div class="demo-flujo">'
        '<section class="panel" aria-labelledby="t-paso1">'
        f'<h2 id="t-paso1">{_e(T["paso1"])}</h2>'
        + subida(T, "subida.formatos", ".pdf,.jpg,.jpeg,.png,.xml,application/pdf,image/jpeg,image/png,text/xml,application/xml")
        + f'<p class="ejemplos-tit">{_e(T["ejemplos"])}</p><div class="ejemplos">{botones}</div>'
        '</section>'
        '<section class="panel proceso" aria-labelledby="t-paso2">'
        f'<h2 id="t-paso2">{_e(T["paso2"])}</h2>'
        f'<p class="proceso-vacio" data-vacio>{_e(T["proceso.vacio"])}</p>'
        '<div class="proceso-cuerpo" hidden><figure class="vista" aria-live="off"><div class="vista-hoja"></div><figcaption class="oculto"></figcaption></figure>'
        f'<ol class="pasos">{pasos}</ol></div>'
        '<p class="proceso-aviso" data-aviso hidden></p>'
        '<p class="oculto" id="pasos-anuncio" aria-live="polite"></p>'
        '</section>'
        '<section class="panel revision" aria-labelledby="t-paso3" hidden>'
        f'<h2 id="t-paso3" tabindex="-1">{_e(T["paso3"])}</h2>'
        f'<p class="nota">{_e(T["campos.nota"])}</p>'
        f'<form class="campos" novalidate>{filas}</form>'
        f'<h3 class="checks-tit">{_e(T["comprobaciones"])}</h3><ul class="checks" aria-live="polite"></ul>'
        '<div class="acciones"><button type="button" class="boton" data-registrar><span></span><span class="boton-flecha" aria-hidden="true"></span></button>'
        f'<button type="button" class="boton-sec" data-otra hidden>{_e(T["boton.otra"])}</button></div>'
        '<div class="aviso-final" data-final role="status" hidden></div>'
        '</section>'
        '</div>'
        f'<aside class="demo-erp" data-erp data-pestana="facturas" aria-label="{_e(T["erp.titulo"])}"></aside>'
        '</div>'
    )


def cuerpo_asistente(T, idioma):
    fases = ["lectura", "indexacion", "pregunta", "respuesta"]
    pasos = "".join(f'<li class="paso" data-estado="espera"><span class="paso-icono" aria-hidden="true"></span>'
                    f'<span class="paso-texto"><b>{_e(T["fase." + f])}</b><small></small></span></li>' for f in fases)
    sugerencias = "".join(f'<button type="button" class="ejemplo sugerencia">{_e(T[f"sug.{i}"])}</button>' for i in (1, 2, 3))
    return (
        '<div class="demo">'
        '<div class="demo-flujo">'
        '<section class="panel" aria-labelledby="t-paso1">'
        f'<h2 id="t-paso1">{_e(T["paso1"])}</h2>'
        + subida(T, "subida.formatos", ".pdf,.docx,.txt,application/pdf,application/vnd.openxmlformats-officedocument.wordprocessingml.document,text/plain")
        + f'<p class="ejemplos-tit">{_e(T["ejemplos"])}</p><div class="ejemplos">'
        f'<button type="button" class="ejemplo" data-ejemplo="/{PUBLICO}/ejemplos/{MANUAL_EJEMPLO[idioma]}">{_e(T["ejemplo.manual"])}</button></div>'
        '</section>'
        '<section class="panel proceso" aria-labelledby="t-paso2">'
        f'<h2 id="t-paso2">{_e(T["paso2"])}</h2>'
        f'<p class="proceso-vacio" data-vacio>{_e(T["proceso.vacio"])}</p>'
        '<div class="proceso-cuerpo" hidden><figure class="vista"><div class="vista-hoja"></div><figcaption class="oculto"></figcaption></figure>'
        f'<ol class="pasos">{pasos}</ol></div>'
        '<p class="proceso-aviso" data-aviso hidden></p>'
        '<p class="oculto" id="pasos-anuncio" aria-live="polite"></p>'
        '</section>'
        '<section class="panel conversacion" aria-labelledby="t-paso3" hidden>'
        f'<h2 id="t-paso3" tabindex="-1">{_e(T["paso3"])}</h2>'
        '<div class="chat"><div class="chat-barra"><i></i><i></i><i></i><b data-chat-titulo></b></div>'
        '<div class="chat-mensajes" data-mensajes role="log" aria-live="polite" aria-relevant="additions"></div>'
        f'<div class="chat-sugerencias" role="group" aria-label="{_e(T["chat.sugerencias"])}">{sugerencias}</div>'
        f'<form class="chat-entrada" data-pregunta novalidate><label class="oculto" for="pregunta">{_e(T["chat.campo"])}</label>'
        f'<input id="pregunta" name="pregunta" type="text" maxlength="300" autocomplete="off" placeholder="{_e(T["chat.placeholder"])}">'
        f'<button type="submit" class="boton boton-enviar"><span>{_e(T["chat.enviar"])}</span><span class="boton-flecha" aria-hidden="true"></span></button></form></div>'
        f'<p class="nota chat-nota">{_e(T["sug.nota"])} {_e(T["chat.nota"])}</p>'
        '</section>'
        '</div>'
        f'<aside class="demo-erp" data-erp data-pestana="conocimiento" aria-label="{_e(T["erp.titulo"])}"></aside>'
        '</div>'
    )


def cuerpo_crm(T, idioma):
    fases = ["alta", "duplicados", "clasificacion", "bienvenida", "seguimiento"]
    pasos = "".join(f'<li class="paso" data-estado="espera"><span class="paso-icono" aria-hidden="true"></span>'
                    f'<span class="paso-texto"><b>{_e(T["fase." + f])}</b><small></small></span></li>' for f in fases)
    def campo(k, tipo="text", cls="", extra=""):
        control = (f'<textarea id="f-{k}" name="{k}" rows="3" maxlength="600"{extra}></textarea>' if tipo == "textarea"
                   else f'<input id="f-{k}" name="{k}" type="{tipo}" autocomplete="off"{extra}>')
        return f'<div class="web-campo {cls}"><label for="f-{k}">{_e(T["form." + k])}</label>{control}</div>'
    origenes = "".join(f'<option value="{o}">{_e(T["form.origen." + o])}</option>' for o in ("web", "recomendacion", "redes", "feria", "otro"))
    base = CONTACTOS_EJEMPLO[idioma]
    return (
        '<div class="demo">'
        '<div class="demo-flujo">'
        '<section class="panel entrada" aria-labelledby="t-paso1">'
        f'<h2 id="t-paso1">{_e(T["paso1"])}</h2>'
        f'<div class="modos" role="tablist" aria-label="{_e(T["modo.etiqueta"])}">'
        f'<button type="button" role="tab" id="modo-form" aria-controls="panel-form" aria-selected="true">{_e(T["modo.form"])}</button>'
        f'<button type="button" role="tab" id="modo-lista" aria-controls="panel-lista" aria-selected="false" tabindex="-1">{_e(T["modo.lista"])}</button></div>'
        '<div id="panel-form" role="tabpanel" aria-labelledby="modo-form">'
        f'<div class="web"><div class="chat-barra"><i></i><i></i><i></i><b>{_e(T["form.web"])}</b></div>'
        f'<form class="web-form" data-form novalidate><p class="web-titulo">{_e(T["form.titulo"])}</p>'
        + campo("nombre", extra=' maxlength="80"') + campo("empresa", extra=' maxlength="120"')
        + campo("email", "email", extra=' maxlength="160" inputmode="email"') + campo("telefono", "tel", extra=' maxlength="30" inputmode="tel"')
        + campo("mensaje", "textarea", "web-ancho")
        + f'<div class="web-campo web-ancho"><label for="f-origen">{_e(T["form.origen"])}</label><select id="f-origen" name="origen">{origenes}</select></div>'
        '<p class="form-error web-ancho" role="alert" hidden></p>'
        f'<div class="web-acciones web-ancho"><button type="submit" class="boton"><span>{_e(T["form.enviar"])}</span><span class="boton-flecha" aria-hidden="true"></span></button>'
        f'<button type="button" class="boton-sec" data-rellenar>{_e(T["form.ejemplo"])}</button></div></form></div>'
        f'<p class="nota entrada-nota">{_e(T["form.nota"])}</p></div>'
        '<div id="panel-lista" role="tabpanel" aria-labelledby="modo-lista" hidden>'
        f'<p class="nota entrada-nota entrada-intro">{_e(T["lista.texto"])}</p>'
        + subida(T, "subida.formatos", ".csv,.xlsx,text/csv,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet")
        + f'<p class="ejemplos-tit">{_e(T["ejemplos"])}</p><div class="ejemplos">'
        f'<button type="button" class="ejemplo" data-ejemplo="/{PUBLICO}/ejemplos/{base}.xlsx">{_e(T["ejemplo.lista"])}</button></div>'
        f'<p class="plantilla">{_e(T["plantilla"])} <a href="/{PUBLICO}/ejemplos/{base}.csv" download>CSV</a> · <a href="/{PUBLICO}/ejemplos/{base}.xlsx" download>Excel</a></p>'
        '</div>'
        '</section>'
        '<section class="panel proceso" aria-labelledby="t-paso2">'
        f'<h2 id="t-paso2">{_e(T["paso2"])}</h2>'
        f'<p class="proceso-vacio" data-vacio>{_e(T["proceso.vacio"])}</p>'
        f'<div class="proceso-cuerpo proceso-solo" hidden><ol class="pasos">{pasos}</ol></div>'
        '<p class="proceso-aviso" data-aviso hidden></p>'
        '<p class="oculto" id="pasos-anuncio" aria-live="polite"></p>'
        '</section>'
        '<section class="panel resultado" aria-labelledby="t-paso3" hidden>'
        f'<h2 id="t-paso3" tabindex="-1">{_e(T["paso3"])}</h2>'
        '<div data-resumen></div><div data-detalle aria-live="polite"></div>'
        '</section>'
        '</div>'
        f'<aside class="demo-erp" data-erp data-pestana="crm" aria-label="{_e(T["erp.titulo"])}"></aside>'
        '</div>'
    )


def cuerpo_informes(T, idioma):
    fases = ["lectura", "limpieza", "calculo", "informe"]
    pasos = "".join(f'<li class="paso" data-estado="espera"><span class="paso-icono" aria-hidden="true"></span>'
                    f'<span class="paso-texto"><b>{_e(T["fase." + f])}</b><small></small></span></li>' for f in fases)
    ventas, erp = VENTAS_EJEMPLO[idioma]
    ejemplos = [("excel", f"{ventas}.xlsx"), ("sucio", f"{ventas}.csv"), ("erp", f"{erp}.csv")]
    botones = "".join(f'<button type="button" class="ejemplo" data-ejemplo="/{PUBLICO}/ejemplos/{a}">{_e(T["ejemplo." + k])}</button>' for k, a in ejemplos)
    return (
        '<div class="demo">'
        '<div class="demo-flujo">'
        '<section class="panel" aria-labelledby="t-paso1">'
        f'<h2 id="t-paso1">{_e(T["paso1"])}</h2>'
        f'<p class="nota entrada-intro">{_e(T["datos.texto"])}</p>'
        + subida(T, "subida.formatos", ".csv,.xlsx,text/csv,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet")
        + f'<p class="ejemplos-tit">{_e(T["ejemplos"])}</p><div class="ejemplos">{botones}</div>'
        f'<p class="plantilla">{_e(T["plantilla"])} <a href="/{PUBLICO}/ejemplos/{ventas}.csv" download>CSV</a> · <a href="/{PUBLICO}/ejemplos/{ventas}.xlsx" download>Excel</a></p>'
        '<form class="mapa" data-mapa hidden novalidate>'
        f'<h3 id="t-mapa" tabindex="-1">{_e(T["mapa.titulo"])}</h3><p class="nota" data-mapa-texto></p>'
        '<div class="mapa-filas" data-mapa-filas></div><p class="form-error" role="alert" hidden></p>'
        f'<button type="submit" class="boton"><span>{_e(T["mapa.continuar"])}</span><span class="boton-flecha" aria-hidden="true"></span></button></form>'
        '</section>'
        '<section class="panel proceso" aria-labelledby="t-paso2">'
        f'<h2 id="t-paso2">{_e(T["paso2"])}</h2>'
        f'<p class="proceso-vacio" data-vacio>{_e(T["proceso.vacio"])}</p>'
        f'<div class="proceso-cuerpo proceso-solo" hidden><ol class="pasos">{pasos}</ol></div>'
        '<p class="proceso-aviso" data-aviso hidden></p>'
        '<p class="oculto" id="pasos-anuncio" aria-live="polite"></p>'
        '</section>'
        '<section class="panel resultado" aria-labelledby="t-paso3" hidden>'
        f'<h2 id="t-paso3" tabindex="-1">{_e(T["paso3"])}</h2>'
        '<div data-panel></div>'
        '</section>'
        '</div>'
        f'<aside class="demo-erp" data-erp data-pestana="informes" aria-label="{_e(T["erp.titulo"])}"></aside>'
        '</div>'
    )


def cuerpo_reservas(T, idioma):
    fases = ["reserva", "disponibilidad", "confirmacion", "recordatorio", "calendario"]
    pasos = "".join(f'<li class="paso" data-estado="espera"><span class="paso-icono" aria-hidden="true"></span>'
                    f'<span class="paso-texto"><b>{_e(T["fase." + f])}</b><small></small></span></li>' for f in fases)
    def campo(k, tipo="text", cls="", extra="", auto="off"):
        ayuda = T.get(f"form.{k}Ayuda")
        describe = f' aria-describedby="r-{k}-ayuda"' if ayuda else ""
        control = (f'<textarea id="r-{k}" name="{k}" rows="3" maxlength="1500"{describe}{extra}></textarea>' if tipo == "textarea"
                   else f'<input id="r-{k}" name="{k}" type="{tipo}" autocomplete="{auto}"{describe}{extra}>')
        nota = f'<small class="campo-ayuda" id="r-{k}-ayuda">{_e(ayuda)}</small>' if ayuda else ""
        return f'<div class="web-campo {cls}"><label for="r-{k}">{_e(T["form." + k])}</label>{control}{nota}</div>'
    acepto = T["form.acepto"].replace("{privacidad}", _ruta("privacidad", idioma))
    return (
        '<div class="demo">'
        '<div class="demo-flujo">'
        '<section class="panel" aria-labelledby="t-paso1">'
        f'<h2 id="t-paso1">{_e(T["paso1"])}</h2><div data-calendario></div>'
        '</section>'
        '<section class="panel" aria-labelledby="t-paso2">'
        f'<h2 id="t-paso2">{_e(T["paso2"])}</h2>'
        '<form class="web-form reserva-form" data-form novalidate>'
        + campo("nombre", extra=' maxlength="80" required', auto="name") + campo("empresa", extra=' maxlength="160"', auto="organization")
        + campo("email", "email", extra=' maxlength="254" inputmode="email" required', auto="email") + campo("telefono", "tel", extra=' maxlength="30" inputmode="tel"', auto="tel")
        + campo("mensaje", "textarea", "web-ancho")
        + f'<div class="trampa" aria-hidden="true"><label for="r-web">{_e(T["form.trampa"])}</label><input id="r-web" name="web" type="text" tabindex="-1" autocomplete="off"></div>'
        f'<div class="web-ancho campo-casilla"><input type="checkbox" id="r-acepto" name="acepto" required><label for="r-acepto">{acepto}</label></div>'
        '<p class="reserva-elegido web-ancho" data-elegido aria-live="polite"></p>'
        '<p class="form-error web-ancho" role="alert" hidden></p>'
        f'<div class="web-acciones web-ancho"><button type="submit" class="boton boton-grande"><span>{_e(T["form.reservar"])}</span><span class="boton-flecha" aria-hidden="true"></span></button></div>'
        f'<p class="nota web-ancho">{_e(T["form.nota"])}</p>'
        '</form>'
        '</section>'
        '<section class="panel proceso" aria-labelledby="t-paso3">'
        f'<h2 id="t-paso3">{_e(T["paso3"])}</h2>'
        f'<p class="proceso-vacio" data-vacio>{_e(T["proceso.vacio"])}</p>'
        f'<div class="proceso-cuerpo proceso-solo" hidden><ol class="pasos">{pasos}</ol></div>'
        '<p class="oculto" id="pasos-anuncio" aria-live="polite"></p>'
        '</section>'
        '<section class="panel resultado" aria-labelledby="t-res" hidden>'
        f'<h2 id="t-res" tabindex="-1">{_e(T["res.titulo"])}</h2><div data-resultado></div>'
        '</section>'
        '</div>'
        f'<aside class="demo-erp" data-erp data-pestana="reservas" aria-label="{_e(T["erp.titulo"])}"></aside>'
        '</div>'
    )


CUERPOS = {"facturas": lambda T, idioma: cuerpo_facturas(T), "asistente": cuerpo_asistente, "crm": cuerpo_crm, "informes": cuerpo_informes, "reservas": cuerpo_reservas}


# --- Página completa ----------------------------------------------------------------------------

def pagina(demo, idioma, iconos, versiones):
    T = textos(demo, idioma)
    rutas = RUTAS[demo]
    ruta = rutas[idioma]
    url = _url(ruta)
    inicio = _ruta("", idioma)
    servicio = _ruta(SERVICIO[demo], idioma)
    titulo, descripcion = T["meta.titulo"], T["meta.descripcion"]
    alternas = "".join(f'<link rel="alternate" hreflang="{l}" href="{_url(rutas[l])}">' for l in ID.IDIOMAS)
    alternas += f'<link rel="alternate" hreflang="x-default" href="{_url(rutas["es"])}">'
    ld = {"@context": "https://schema.org", "@graph": [
        {"@type": "WebPage", "@id": f"{url}#webpage", "url": url, "name": titulo, "description": descripcion, "inLanguage": idioma,
         "isPartOf": {"@id": f"{C.SITIO}/#website"}, "publisher": {"@id": f"{C.SITIO}/#organization"}},
        {"@type": "BreadcrumbList", "itemListElement": [
            {"@type": "ListItem", "position": 1, "name": INICIO_MIGA[idioma], "item": _url(inicio.strip("/"))},
            {"@type": "ListItem", "position": 2, "name": T["migas.servicio"], "item": _url(servicio.strip("/"))},
            {"@type": "ListItem", "position": 3, "name": T["migas.pagina"], "item": url}]},
    ]}
    marca = f'<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64" aria-hidden="true"><path d="{MARK_PATH}" fill="#fff"></path></svg>'
    otros = " · ".join(
        f'<a href="/{rutas[l]}" hreflang="{l}" lang="{l}"{" aria-current=" + chr(34) + "page" + chr(34) if l == idioma else ""}>{NOMBRE_IDIOMA[l]}</a>'
        for l in ID.IDIOMAS)
    datos_js = json.dumps(T, ensure_ascii=False).replace("</", "<\\/")
    ahorro = (
        f'<section class="ahorro" id="ahorro" aria-labelledby="t-ahorro"><h2 id="t-ahorro" class="ahorro-tit">{_e(T["ahorro.titulo"])}</h2>'
        f'<p class="ahorro-sub">{_e(T["ahorro.sub"])}</p><div data-ahorro="{demo}"></div></section>'
    )
    hablemos = f"{inicio}#hablemos"
    return f"""<!doctype html>
<html lang="{idioma}">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>{_e(titulo)}</title>
  <meta name="description" content="{_e(descripcion)}">
  <link rel="canonical" href="{url}">
  {alternas}
  <meta property="og:type" content="website">
  <meta property="og:locale" content="{ID.LOCALE[idioma]}">
  <meta property="og:site_name" content="Banteq">
  <meta property="og:title" content="{_e(titulo)}">
  <meta property="og:description" content="{_e(descripcion)}">
  <meta property="og:url" content="{url}">
  <meta property="og:image" content="{C.SITIO}/framerusercontent.com/images/mesMNsTTSgV6Xg1TUfNtMnEGZY.png">
  {iconos}
  <script type="application/ld+json">{json.dumps(ld, ensure_ascii=False)}</script>
  <link rel="preload" href="/fonts.gstatic.com/s/geist/v5/gyByhwUxId8gMEwcGFU.woff2" as="font" type="font/woff2" crossorigin>
  <link rel="stylesheet" href="/{PUBLICO}/comun/base.css?v={versiones['comun/base.css']}">
  <link rel="stylesheet" href="/{PUBLICO}/comun/demo.css?v={versiones['comun/demo.css']}">
  <script src="/banteq/procedencia.js" defer></script>
  <script type="module" src="/{PUBLICO}/{demo}/{demo}.js?v={versiones[f'{demo}/{demo}.js']}"></script>
</head>
<body data-demo="{demo}" data-inicio="{inicio}" data-hablemos="{hablemos}" data-max-mb="{MAX_MB}">
<a class="saltar" href="#demo">{_e(T["saltar"])}</a>
<header class="cab">
  <nav class="cab-pildora" aria-label="Banteq">
    <a class="cab-logo" href="{inicio}" aria-label="{_e(T["cab.inicio"])}">{marca}</a>
    <a class="cab-enlace" href="{inicio}#servicios">{_e(T["cab.automatizaciones"])}</a>
    <a class="cab-hablemos" href="{hablemos}">{_e(T["cab.hablemos"])}</a>
  </nav>
</header>

<main id="demo">
  <section class="intro" aria-labelledby="titulo">
    <p class="migas"><a href="{inicio}#servicios">{_e(T["migas.seccion"])}</a> <span aria-hidden="true">›</span> {_e(T["migas.pagina"])}</p>
    <h1 id="titulo">{_e(T["h1"])}</h1>
    <p class="sub">{_e(T["sub"])}</p>
  </section>
  {CUERPOS[demo](T, idioma)}
  <p class="datos-ejemplo">{_e(T["datos.ejemplo"])}</p>
  {ahorro}
  <section class="cierre" aria-labelledby="t-cierre">
    <h2 id="t-cierre">{_e(T["cierre.titulo"])}</h2>
    <p class="sub">{_e(T["cierre.texto"])}</p>
    <a class="boton boton-grande" href="{hablemos}"><span>{_e(T["cierre.boton"])}</span><span class="boton-flecha" aria-hidden="true"></span></a>
  </section>
</main>

<footer class="pie">
  <span>© Banteq 2026</span>
  <nav aria-label="{_e(T["pie.idiomas"])}" class="pie-idiomas">{otros}</nav>
  <nav aria-label="{_e(T["pie.legal"])}"><a href="{_ruta("aviso-legal", idioma)}">{_e(T["pie.legal"])}</a><a href="{_ruta("privacidad", idioma)}">{_e(T["pie.privacidad"])}</a><a href="{hablemos}">{_e(T["pie.contacto"])}</a></nav>
</footer>
<script type="application/json" id="bq-textos">{datos_js}</script>
</body>
</html>
"""


def paginas_fuente():
    """{url: html de referencia} de todas las páginas, para el lastmod del sitemap (build.py). Se usa
    la página con huellas fijas: así solo cambia si cambia su texto o su estructura."""
    fijas = {k: "0" for k in ("comun/base.css", "comun/demo.css", *(f"{d}/{d}.js" for d in RUTAS))}
    return {_url(r): pagina(d, l, "", fijas) for d, rr in RUTAS.items() for l, r in rr.items()}


def llms_items():
    """(nombre, url, descripción) de cada página en castellano, para llms.txt."""
    return [(textos(d, "es")["migas.pagina"] + " · demostración", _url(r["es"]), textos(d, "es")["meta.descripcion"]) for d, r in RUTAS.items()]


def llms_items_idioma(idioma):
    return [(textos(d, idioma)["h1"], _url(r[idioma]), textos(d, idioma)["meta.descripcion"]) for d, r in RUTAS.items()]


# --- Publicación ----------------------------------------------------------------------------------

RE_IMPORT = re.compile(r"""((?:\bfrom\s*|\bimport\s*\(\s*|\bimport\s+))(["'])(\.{1,2}/[^"'?]+)\2""")


def _publicar_modulos(destino):
    """Copia los módulos (comun, cada demo y lib) y añade ?v=<huella> a cada import relativo. La
    huella de un módulo incluye las de los que importa: si cambia una pieza, cambian todos los que
    dependen de ella."""
    archivos = {}
    for sub in ["comun", *RUTAS]:
        for f in sorted((FUENTE / sub).glob("*.js")):
            archivos[f"{sub}/{f.name}"] = f.read_text(encoding="utf-8")
    for nombre in LIB:
        archivos[f"lib/{nombre}"] = (ROOT / "lib" / nombre).read_text(encoding="utf-8")
    huellas, final = {}, {}

    def resolver(rel, pila=()):
        if rel in final:
            return
        assert rel not in pila, f"import circular en las demostraciones: {' → '.join(pila + (rel,))}"
        assert rel in archivos, f"las demostraciones importan {rel}, que no existe"
        texto = archivos[rel]
        base = Path(rel).parent

        def sustituir(m):
            destino_rel = str((base / m.group(3)).as_posix())
            partes = []
            for p in destino_rel.split("/"):
                if p == "..":
                    partes.pop()
                elif p != ".":
                    partes.append(p)
            dep = "/".join(partes)
            resolver(dep, pila + (rel,))
            return f"{m.group(1)}{m.group(2)}{m.group(3)}?v={huellas[dep]}{m.group(2)}"

        texto = RE_IMPORT.sub(sustituir, texto)
        final[rel] = texto
        huellas[rel] = _huella(texto)

    for rel in archivos:
        resolver(rel)
    for rel, texto in final.items():
        (destino / rel).parent.mkdir(parents=True, exist_ok=True)
        (destino / rel).write_text(texto, encoding="utf-8")
    return huellas


def comprobar_textos():
    manual = (ROOT / "tools" / "demos_manual_p12.mjs").read_text(encoding="utf-8")
    for idioma in ID.IDIOMAS:
        for i in (1, 2, 3):
            sug = textos("asistente", idioma)[f"sug.{i}"]
            assert json.dumps(sug, ensure_ascii=False) in manual, f"sugerencia {i} ({idioma}) distinta de demos_manual_p12.mjs: {sug}"
    for demo in RUTAS:
        for idioma in ID.IDIOMAS:
            assert set(textos(demo, idioma)) >= set(textos("facturas", "es")) - set(DEMOS["facturas"]), demo


def integrar():
    comprobar_textos()
    public = ROOT / "public"
    destino = public / PUBLICO
    if destino.exists():
        shutil.rmtree(destino)
    destino.mkdir(parents=True)
    versiones = _publicar_modulos(destino)
    # Estilos: la base es la hoja de la calculadora de ahorro (mismo aspecto); demo.css añade lo propio.
    for nombre, origen in (("base.css", ROOT / "assets-banteq" / "calculadora-ahorro" / "ahorro.css"), ("demo.css", FUENTE / "comun" / "demo.css")):
        texto = origen.read_text(encoding="utf-8")
        (destino / "comun" / nombre).write_text(texto, encoding="utf-8")
        versiones[f"comun/{nombre}"] = _huella(texto)
    shutil.copytree(FUENTE / "ejemplos", destino / "ejemplos")
    shutil.copytree(VENDOR, destino / "vendor")

    iconos = "".join(re.findall(r'<link rel="(?:icon|apple-touch-icon|manifest)"[^>]*>', (public / "index.html").read_text(encoding="utf-8")))
    assert iconos and "favicon.ico" in iconos, "no se encuentran los iconos de la home"
    for demo, rutas in RUTAS.items():
        for idioma, ruta in rutas.items():
            (public / ruta).mkdir(parents=True, exist_ok=True)
            (public / ruta / "index.html").write_text(pagina(demo, idioma, iconos, versiones), encoding="utf-8")


if __name__ == "__main__":
    integrar()
