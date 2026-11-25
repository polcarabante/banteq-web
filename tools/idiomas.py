"""Idiomas de la web: castellano (el original), catalán (/ca/…) e inglés (/en/…).

Cada página tiene su dirección en los tres idiomas. Aquí está la tabla de direcciones y los textos
de los módulos contenido_ca.py y contenido_en.py (uno por idioma, misma estructura). Las secciones
comerciales bilingües se agrupan al final de este módulo.

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

# Secciones bilingües de servicio para consultas de compra.
# Cada entrada indica la sección de referencia, si sustituye su primer bloque, y el texto nuevo.
_SECCIONES_COMERCIALES = {
    'automatizacion-procesos': (
        'Cómo calcular si te compensa automatizar una tarea',
        False,
        ('Cómo automatizar el seguimiento de pedidos a proveedores en Excel', [
            ("p", "Simulación con Excel y Outlook. Antes, compras revisa la hoja de pedidos, busca las confirmaciones por correo y pide una fecha de entrega a cada proveedor. Con el flujo, las incidencias llegan a compras en una lista y cada aviso queda registrado en el pedido."),
            ("p", "Para reproducir el ejemplo, fija la fecha de comprobación en el 18 de noviembre. La hoja necesita un número de pedido, un correo de proveedor, una fecha de entrega, un estado y la fecha del último aviso. El flujo revisa los pedidos abiertos a diario y prepara un aviso a partir de las 48 horas de retraso si todavía no se ha enviado otro por esa fecha de entrega."),
            ("tabla", (
                ["Pedido de ejemplo", "Situación en Excel", "Resultado esperado"],
                [
                    ["P-101", "Entrega el 15 de noviembre, pendiente y sin aviso", "Prepara un correo para pedir una fecha actualizada y registra el aviso cuando se envía."],
                    ["P-102", "Entrega el 15 de noviembre, aviso enviado ayer", "Conserva el aviso registrado y evita duplicarlo."],
                    ["P-103", "Entrega el 17 de noviembre, pendiente", "Espera a que se cumplan las 48 horas."],
                    ["P-104", "Entrega el 15 de noviembre, correo del proveedor vacío", "Envía la incidencia a compras para completar el dato."],
                    ["P-105", "Entrega ya registrada", "Excluye el pedido de la revisión de retrasos."],
                ],
            )),
            ("p", ["Si el proveedor responde con una fecha nueva, compras la confirma antes de actualizar la hoja. Si falla el envío, el pedido queda pendiente de atención. Consulta ", ("a", "cómo documentar un proceso antes de automatizarlo", "/guias/documentar-proceso-antes-de-automatizar"), " para recoger tus propias reglas o ", ("a", "cuéntanos cómo haces hoy el seguimiento", "#hablemos"), "."]),
            ("p", ["Si haces el seguimiento por correo, estima el tiempo que podrías recuperar con la ", ("idioma", "calculadora de ahorro", "/automatizaciones/seguimiento/ahorro", "es"), "."]),
        ]),
    ),
    'automatizacion-n8n': (
        'Flujos que se pueden mantener',
        False,
        ('¿Cuánto cuesta una automatización con n8n?', [
            ("p", "El precio de una automatización con n8n se calcula según los programas que conecta, el volumen de ejecuciones y las excepciones que tiene que resolver. En Banteq separamos el coste inicial de los gastos recurrentes para que puedas comparar presupuestos con el mismo alcance."),
            ("ul", [
                [("b", "Implantación. "), "Diseño del flujo, conexiones, pruebas con datos de ejemplo, puesta en marcha y documentación."],
                [("b", "Plataforma e infraestructura. "), "Plan de n8n Cloud o servidor propio, más las licencias y consumos de otros servicios cuando correspondan."],
                [("b", "Mantenimiento. "), "Qué incluye la supervisión, quién atiende los fallos y qué cambios o ampliaciones se presupuestan aparte."],
            ]),
            ("p", "Ejemplo ficticio: pasar solicitudes del formulario a un CRM tiene un alcance distinto si hay que detectar duplicados, asignar un responsable según la zona y recuperar los envíos fallidos. Pide que el presupuesto diga cómo se prueba cada regla y qué gastos se repiten cada mes."),
            ("p", ["Para que podamos valorar tu proyecto, ", ("a", "indícanos la tarea, los programas y el volumen aproximado", "#hablemos"), ". Si hace falta un diagnóstico avanzado, es de pago y te indicaremos su alcance y precio antes de contratarlo."]),
        ]),
    ),
    'desarrollo-web': (
        '¿Hablamos de tu web?',
        True,
        ('¿Cómo contactar con Banteq para una web a medida?', [
            ("p", [C.ZONA_FRASE + " ", ("a", "Contacta con nuestro equipo de desarrollo web", "#hablemos"),
                   " para contarnos si necesitas una web nueva o un rediseño y cuándo te gustaría publicarla. "
                   "Revisamos tu solicitud y hablamos contigo del alcance antes de preparar el presupuesto."]),
        ]),
    ),
    'ca/automatitzacio-processos': (
        'Com pots calcular si et surt a compte automatitzar una tasca?',
        False,
        ('Com es pot automatitzar el seguiment de comandes a proveïdors a l’Excel?', [
            ("p", "Simulació amb l’Excel i l’Outlook. Abans, compres revisa el full de comandes, busca les confirmacions al correu i demana una data de lliurament a cada proveïdor. Amb el flux, compres rep les incidències en una llista i cada avís queda registrat a la comanda."),
            ("p", "Per reproduir l’exemple, fixa la data de comprovació en el 18 de novembre. Al full hi calen el número de comanda, el correu del proveïdor, la data de lliurament, l’estat i la data del darrer avís. El flux revisa les comandes obertes cada dia i prepara un avís a partir de les 48 hores de retard si encara no se n’ha enviat cap per a aquella data de lliurament."),
            ("tabla", (
                ["Comanda d’exemple", "Situació a l’Excel", "Resultat esperat"],
                [
                    ["P-101", "Lliurament el 15 de novembre, pendent i sense avís", "Prepara un correu per demanar una data actualitzada i registra l’avís quan s’envia."],
                    ["P-102", "Lliurament el 15 de novembre, avís enviat ahir", "Manté l’avís registrat i evita duplicar-lo."],
                    ["P-103", "Lliurament el 17 de novembre, pendent", "Espera que es compleixin les 48 hores."],
                    ["P-104", "Lliurament el 15 de novembre, sense correu del proveïdor", "Envia la incidència a compres perquè completi la dada."],
                    ["P-105", "Lliurament ja registrat", "Deixa la comanda fora de la revisió de retards."],
                ],
            )),
            ("p", ["Si el proveïdor respon amb una data nova, compres la confirma abans d’actualitzar el full. Si falla l’enviament, la comanda queda pendent de revisió. Consulta ", ("a", "com triar una empresa per automatitzar processos", "/guias/com-triar-empresa-automatitzacio-processos"), " per preparar una prova amb les teves regles o ", ("a", "explica’ns com fas ara el seguiment", "#hablemos"), "."]),
            ("p", ["Si fas el seguiment per correu, estima el temps que podries recuperar amb la ", ("idioma", "calculadora de ahorro", "/automatizaciones/seguimiento/ahorro", "es"), " (en castellà)."]),
        ]),
    ),
    'ca/automatitzacio-n8n': (
        'Fluxos que es poden mantenir',
        False,
        ('Quant costa una automatització amb n8n?', [
            ("p", "El preu d’una automatització amb n8n es calcula segons els programes que connecta, el volum d’execucions i les excepcions que ha de resoldre. A Banteq separem el cost inicial de les despeses recurrents perquè puguis comparar pressupostos amb el mateix abast."),
            ("ul", [
                [("b", "Implantació. "), "Disseny del flux, connexions, proves amb dades d’exemple, posada en marxa i documentació."],
                [("b", "Plataforma i infraestructura. "), "Pla d’n8n Cloud o servidor propi, més les llicències i els consums d’altres serveis, si escau."],
                [("b", "Manteniment. "), "Què inclou la supervisió, qui atén les incidències i quins canvis o ampliacions es pressuposten a part."],
            ]),
            ("p", "Exemple fictici: passar les sol·licituds d’un formulari a un CRM té un abast diferent si cal detectar duplicats, assignar una persona responsable segons la zona i recuperar els enviaments fallits. Demana que el pressupost indiqui com es prova cada regla i quines despeses es repeteixen cada mes."),
            ("p", ["Perquè puguem valorar el teu projecte, ", ("a", "indica’ns la tasca, els programes i el volum aproximat", "#hablemos"), ". Si cal una diagnosi avançada, és de pagament i t’indicarem què inclou i quant costa abans de contractar-la."]),
        ]),
    ),
    'ca/desenvolupament-web': (
        'Parlem del teu web?',
        True,
        ('Com pots contactar amb Banteq per a un web a mida?', [
            ("p", [CA.ZONA_FRASE + " ", ("a", "Contacta amb el nostre equip de desenvolupament web", "#hablemos"),
                   " per explicar-nos si et cal un web nou o un redisseny i quan t’agradaria publicar-lo. "
                   "Revisem la teva sol·licitud i parlem amb tu de l’abast abans de preparar el pressupost."]),
        ]),
    ),
}


def _aplicar_secciones_comerciales():
    for servicio in C.SERVICIOS + CA.SERVICIOS_CA:
        slug = servicio["slug"]
        if slug not in _SECCIONES_COMERCIALES:
            continue
        referencia, sustituir, nueva = _SECCIONES_COMERCIALES[slug]
        secciones = servicio["secciones"]
        posiciones = [i for i, (titulo, _) in enumerate(secciones) if titulo == referencia]
        if len(posiciones) != 1:
            raise ValueError(f"{slug}: se esperaba una sección «{referencia}»")
        posicion = posiciones[0]
        if sustituir:
            titulo, bloques = nueva
            secciones[posicion] = (titulo, bloques + secciones[posicion][1][1:])
        else:
            secciones.insert(posicion, nueva)


_aplicar_secciones_comerciales()
