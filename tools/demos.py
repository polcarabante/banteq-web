"""Sección «Automatización e inteligencia artificial» de la home: seis demostraciones animadas.

Cada tarjeta cuenta una automatización de principio a fin con interfaces de ejemplo (correo, ERP,
CRM, chat, panel, WhatsApp…). El HTML sale de aquí; el movimiento lo pone banteq.js («Demostraciones
de la sección Automatización») y el aspecto banteq.css («Demostraciones»).

Cómo se anima: cada demostración tiene una lista de pasos con su duración (data-pasos, en
milisegundos). Un elemento con data-en="k" aparece en el paso k; con data-hasta="m" desaparece en
el paso m. Las fases de arriba (data-desde) se marcan según el paso. data-escribe teclea el texto
del elemento al aparecer. Sin JavaScript se ve el estado final de cada demostración.

Los datos de las demostraciones son de ejemplo (no son clientes ni resultados reales) y la sección
lo dice al pie. Los textos de las tarjetas no prometen cifras.
"""

import html

# --- piezas comunes ---------------------------------------------------------------------------

OK = ('<svg class="bq-i-ok" viewBox="0 0 16 16" aria-hidden="true"><circle cx="8" cy="8" r="8"/>'
      '<path d="m4.6 8.3 2.3 2.3 4.5-4.9" fill="none"/></svg>')
CLIP = ('<svg class="bq-i" viewBox="0 0 16 16" aria-hidden="true"><path d="M10.5 4.5 5.8 9.2a1.4 1.4 0 0 0 2 2l5-5a2.8 2.8 0 0 0-4-4l-5 5a4.2 4.2 0 0 0 6 6l4.2-4.2" fill="none"/></svg>')
CHISPA = ('<svg class="bq-i bq-i-relleno" viewBox="0 0 16 16" aria-hidden="true"><path d="M8 1.5 9.4 6.6 14.5 8 9.4 9.4 8 14.5 6.6 9.4 1.5 8l5.1-1.4z"/></svg>')
DOC = ('<svg class="bq-i" viewBox="0 0 16 16" aria-hidden="true"><path d="M4 1.5h5.5L13 5v9.5H4z M9.5 1.5V5H13" fill="none"/></svg>')
CURSOR = ('<svg class="bq-cursor" viewBox="0 0 20 20" aria-hidden="true"><path d="M4 2.5v13.2l3.4-3.1 2.2 5 2.3-1-2.2-4.9 4.6-.3z"/></svg>')
WA = ('<svg class="bq-i bq-i-relleno" viewBox="0 0 24 24" aria-hidden="true"><path d="M12 2.2a9.8 9.8 0 0 0-8.4 14.9L2.3 21.8l4.8-1.3A9.8 9.8 0 1 0 12 2.2zm5.6 13.7c-.2.7-1.4 1.3-1.9 1.4-.5.1-1.1.1-1.8-.1-.4-.1-1-.3-1.7-.6-3-1.3-4.9-4.3-5.1-4.5-.1-.2-1.2-1.6-1.2-3.1s.8-2.2 1.1-2.5c.3-.3.6-.4.8-.4h.6c.2 0 .4 0 .7.5l.9 2.2c.1.2.1.4 0 .6l-.3.5-.4.5c-.1.1-.3.3-.1.6.2.3.7 1.2 1.6 2 1.1 1 2 1.3 2.3 1.4.3.1.5.1.6-.1l.9-1c.2-.3.4-.2.7-.1l2.1 1c.3.1.5.2.6.3.1.2.1.8-.1 1.5z"/></svg>')

ICONOS = {
    "procesos": '<path d="M12 3 3 7.5l9 4.5 9-4.5zM3 12l9 4.5 9-4.5M3 16.5 12 21l9-4.5"/>',
    "ia": '<path d="M4 5.5h16v10H9l-4.5 3.5V15.5H4z"/><path d="M9 10.5h.01M12 10.5h.01M15 10.5h.01"/>',
    "crm": '<path d="M5 20v-5M10 20V9M15 20v-7M20 20V5"/>',
    "informes": '<path d="M4 4v16h16"/><path d="m7.5 14 3.5-4 3 2.5L19 7"/>',
    "conexion": '<path d="M9.5 14.5 14.5 9.5"/><path d="M11 6.5 13 4.5a4 4 0 0 1 5.7 5.7l-2 2M13 17.5 11 19.5a4 4 0 0 1-5.7-5.7l2-2"/>',
    "reservas": '<rect x="3.5" y="5" width="17" height="15" rx="2.5"/><path d="M3.5 10h17M8 3v4M16 3v4"/><path d="m9 14.5 2 2 4-4"/>',
}


def en(desde, hasta=None):
    return f' data-en="{desde}"' + (f' data-hasta="{hasta}"' if hasta else "")


def ventana(titulo, cuerpo, cls="", extra=""):
    """Ventana de aplicación de ejemplo, con barra de título."""
    return (f'<div class="bq-ui {cls}"{extra}><div class="bq-ui-barra"><i></i><i></i><i></i>'
            f'<span>{titulo}</span></div><div class="bq-ui-cuerpo">{cuerpo}</div></div>')


def escena(desde, hasta, cuerpo, cls=""):
    return f'<div class="bq-esc {cls}"{en(desde, hasta)}>{cuerpo}</div>'


def esc(t):
    return html.escape(t, quote=False)


# --- las seis demostraciones -------------------------------------------------------------------

def demo_facturas():
    correo = ventana("Correo · Bandeja de entrada", (
        f'<div class="bq-mail bq-mail-nuevo"{en(1)}><b>Aceros Vallès S.L.</b><span>Factura F-0412 · octubre</span>{CLIP}<em>09:14</em></div>'
        '<div class="bq-mail"><b>Gestoría Martí</b><span>Modelo 303 · 3T</span><em>ayer</em></div>'
        '<div class="bq-mail"><b>Transportes Ribas</b><span>Albarán 2291</span><em>ayer</em></div>'
        f'<div class="bq-adjunto"{en(2)}>{DOC}<span>factura-F-0412.pdf</span><small>84 KB</small>'
        f'<span class="bq-ia-sello">{CHISPA}Factura detectada</span></div>'
    ), "bq-ui-llena")
    pdf = (f'<div class="bq-pdf"><div class="bq-pdf-cab"><b>FACTURA</b><small>F-0412</small></div>'
           '<p class="bq-pdf-emisor">Aceros Vallès S.L.</p><i class="bq-linea" style="--w:82%"></i>'
           '<i class="bq-linea" style="--w:64%"></i><i class="bq-linea" style="--w:74%"></i>'
           '<div class="bq-pdf-total"><span>Total</span><b>1.284,60 €</b></div>'
           f'<span class="bq-escaneo"{en(3, 8)}></span></div>')
    campos = [("Proveedor", "Aceros Vallès S.L.", 4), ("Nº factura", "F-0412", 5),
              ("Fecha", "28/10/2026", 6), ("Importe", "1.284,60 €", 7)]
    filas = "".join(
        f'<div class="bq-campo"><span>{k}</span><b{en(p)} data-escribe>{esc(v)}</b><span class="bq-campo-ok"{en(8)}>{OK}</span></div>'
        for k, v, p in campos)
    extraccion = (f'<div class="bq-dos">{pdf}<div class="bq-ui bq-ui-panel"><div class="bq-ui-tit">{CHISPA}Datos extraídos</div>{filas}'
                  f'<div class="bq-nota-ok"{en(8)}>{OK}Coincide con el pedido PC-118</div></div></div>')
    erp = ventana("ERP · Facturas de proveedor", (
        '<div class="bq-tabla"><div class="bq-tr bq-th"><span>Nº</span><span>Proveedor</span><span>Importe</span><span>Estado</span></div>'
        f'<div class="bq-tr bq-tr-nueva"{en(9)}><span>F-0412</span><span>Aceros Vallès</span><span>1.284,60 €</span><span class="bq-estado bq-estado-ok">Registrada</span></div>'
        '<div class="bq-tr"><span>F-0411</span><span>Gestoría Martí</span><span>121,00 €</span><span class="bq-estado">Pagada</span></div>'
        '<div class="bq-tr"><span>F-0409</span><span>Transportes Ribas</span><span>412,00 €</span><span class="bq-estado">Pagada</span></div></div>'
    ), "bq-ui-llena")
    aviso = f'<div class="bq-aviso"{en(10)}>{OK}<span><b>Factura registrada correctamente</b><small>Nadie ha tecleado ningún dato</small></span></div>'
    return {
        "id": "facturas", "icono": "procesos", "titulo": "Automatización de procesos",
        "ejemplo": "facturas de proveedor que llegan por correo y se registran solas en el ERP.",
        "fases": [("Correo", 1), ("Lectura con IA", 3), ("Validación", 8), ("ERP", 9)],
        "pasos": [2600, 2600, 1400, 1100, 1000, 1000, 1300, 2600, 2800, 5200],
        "escenas": escena(1, 3, correo) + escena(3, 9, extraccion) + escena(9, None, erp + aviso, "bq-esc-arriba"),
        "etiquetas": ["Sin teclear datos", "Validación antes de registrar", "Conectado a tu ERP"],
    }


def demo_asistente():
    pasos_resp = ["Desconecta y bloquea la alimentación.", "Revisa nivel y filtro del aceite.",
                  "Comprueba la presión: 180 bar.", "Anota la revisión en el parte."]
    lista = "".join(f'<li{en(6 + i)}>{esc(p)}</li>' for i, p in enumerate(pasos_resp))
    cuerpo = (
        f'<div class="bq-chat">'
        f'<div class="bq-burbuja bq-burbuja-yo"{en(2)}><span class="bq-ava">MR</span><p>¿Cómo se hace el mantenimiento de la prensa P-12?</p></div>'
        f'<div class="bq-buscando"{en(3, 5)}><p>{CHISPA}Consultando la documentación interna…</p>'
        f'<span class="bq-doc">{DOC}Plan de mantenimiento 2026.xlsx</span>'
        f'<span class="bq-doc bq-doc-elegido" data-marca="4">{DOC}Manual prensa P-12.pdf · pág. 14</span>'
        f'<span class="bq-doc">{DOC}Normas de seguridad.pdf</span></div>'
        f'<div class="bq-burbuja bq-burbuja-ia"{en(5)}><span class="bq-ava bq-ava-ia">{CHISPA}</span><div>'
        f'<p><b>Mantenimiento trimestral · prensa P-12</b></p><ol>{lista}</ol>'
        f'<span class="bq-fuente"{en(10)}>{DOC}Fuente: Manual P-12.pdf · pág. 14<em>Abrir</em></span>'
        f'<span class="bq-autorizado"{en(11)}>{OK}Solo documentos autorizados</span></div></div>'
        f'<div class="bq-chat-entrada"{en(1, 2)}><span data-escribe>¿Cómo se hace el mantenimiento de la prensa P-12?</span></div>'
        f'</div>'
    )
    return {
        "id": "asistente", "icono": "ia", "titulo": "Asistentes de inteligencia artificial",
        "ejemplo": "dudas técnicas del equipo resueltas con la documentación de la empresa.",
        "fases": [("Pregunta", 1), ("Búsqueda", 3), ("Respuesta", 5), ("Fuente", 10)],
        "pasos": [2900, 1200, 2200, 1600, 1300, 950, 950, 950, 1200, 2400, 5200],
        "escenas": escena(1, None, ventana("Asistente interno · Banteq", cuerpo, "bq-ui-llena")),
        "etiquetas": ["Responde con tus documentos", "Cita la fuente", "Uso interno o para clientes"],
    }


def demo_crm():
    formulario = ventana("tuweb.com · Contacto", (
        '<p class="bq-form-tit">Pide información</p>'
        f'<div class="bq-input"><small>Nombre</small><span{en(1)} data-escribe>Laura Gómez</span></div>'
        f'<div class="bq-input"><small>Empresa</small><span{en(2)} data-escribe>Talleres Gómez</span></div>'
        f'<div class="bq-input"><small>Email</small><span{en(3)} data-escribe>laura@talleresgomez.es</span></div>'
        f'<div class="bq-boton" data-marca="4">Enviar{CURSOR}</div>'
    ), "bq-ui-llena bq-ui-form")
    crm = (
        f'<div class="bq-ui bq-ficha"{en(5)}><span class="bq-ava bq-ava-grande">LG</span><span><b>Laura Gómez</b><small>Talleres Gómez · laura@talleresgomez.es</small></span>'
        '<span class="bq-chip-etapa">Nuevo · Web</span><span class="bq-ui-etq">CRM</span></div>'
        f'<div class="bq-ui bq-tarjeta"{en(6)}><span class="bq-tarjeta-ico">@</span><span><b>Gracias, Laura: te llamamos esta semana</b>'
        '<small>Email de bienvenida personalizado · enviado</small></span>' + OK + '</div>'
        f'<div class="bq-ui bq-tarjeta"{en(7)}><span class="bq-tarjeta-ico">✓</span><span><b>Llamar a Laura Gómez</b>'
        '<small>Mañana 10:00 · Marta (Ventas)</small></span><span class="bq-chip-etapa bq-chip-tarea">Tarea</span></div>'
    )
    aviso = f'<div class="bq-aviso"{en(8)}>{OK}<span><b>Ningún contacto se queda sin respuesta</b></span></div>'
    return {
        "id": "crm", "icono": "crm", "titulo": "Ventas y CRM",
        "ejemplo": "cada contacto de la web entra en el CRM, recibe respuesta y tiene seguimiento.",
        "fases": [("Formulario", 1), ("CRM", 5), ("Bienvenida", 6), ("Seguimiento", 7)],
        "pasos": [1500, 1300, 1700, 1300, 2600, 2700, 2600, 5200],
        "escenas": escena(1, 5, formulario) + escena(5, None, f'<div class="bq-pila">{crm}</div>' + aviso, "bq-esc-arriba"),
        "etiquetas": ["Seguimiento automático", "CRM siempre al día", "Respuesta al momento"],
    }


def demo_informes():
    fuentes = (
        f'<div class="bq-fuentes"><span class="bq-fuente-app"{en(1)}><i class="bq-app bq-app-verde">X</i>Ventas.xlsx</span>'
        f'<span class="bq-fuente-app"{en(2)}><i class="bq-app bq-app-azul">E</i>ERP · Producción</span>'
        f'<span class="bq-fuente-app"{en(3)}><i class="bq-app bq-app-lila">C</i>CRM · Pedidos</span></div>'
        f'<div class="bq-union"{en(4)}><span class="bq-flujo"></span><span class="bq-flujo"></span><span class="bq-flujo"></span>'
        f'<div class="bq-ui bq-union-caja"><b>{CHISPA}Uniendo datos</b><span class="bq-progreso"><i></i></span><small>3 fuentes · semana 44</small></div></div>'
    )
    barras = "".join(f'<i style="--h:{h}"></i>' for h in (0.42, 0.55, 0.48, 0.66, 0.6, 0.78, 0.9))
    panel = ventana("Panel de dirección · semana 44", (
        f'<div class="bq-kpis"{en(5)}><div><small>Ventas</small><b>48.250 €</b><em class="bq-sube">▲ 6 %</em></div>'
        '<div><small>Producción (uds)</small><b>1.240</b><em class="bq-sube">▲ 3 %</em></div>'
        '<div><small>Stock crítico</small><b>3 ref.</b><em class="bq-baja">revisar</em></div></div>'
        f'<div class="bq-barras"{en(6)}>{barras}</div>'
    ), "bq-ui-llena")
    envio = (
        f'<div class="bq-dos bq-dos-informe"><div class="bq-pdf bq-pdf-informe"{en(7)}><div class="bq-pdf-cab"><b>INFORME</b><small>S44</small></div>'
        '<p class="bq-pdf-emisor">Resumen semanal</p><span class="bq-mini-barras"><i></i><i></i><i></i><i></i></span>'
        '<i class="bq-linea" style="--w:80%"></i><i class="bq-linea" style="--w:60%"></i></div>'
        + ventana("Nuevo mensaje", (
            '<div class="bq-mensaje"><small>Para</small><span>Dirección</span></div>'
            '<div class="bq-mensaje"><small>Asunto</small><span>Informe semanal · semana 44</span></div>'
            f'<span class="bq-adjunto bq-adjunto-peq">{DOC}informe-S44.pdf</span>'
            f'<div class="bq-enviado"{en(8)}>{OK}Enviado · lunes 8:00</div>'
        ), "bq-ui-panel", en(7)) + '</div>'
    )
    aviso = f'<div class="bq-aviso"{en(9)}>{OK}<span><b>Informe en dirección sin prepararlo nadie</b></span></div>'
    return {
        "id": "informes", "icono": "informes", "titulo": "Informes y datos",
        "ejemplo": "un informe semanal para dirección con ventas, producción y stock, cada lunes.",
        "fases": [("Fuentes", 1), ("Recopilación", 4), ("Panel", 5), ("Informe", 7), ("Envío", 8)],
        "pasos": [900, 900, 1300, 2400, 1700, 2300, 2300, 2500, 5200],
        "escenas": escena(1, 5, fuentes, "bq-esc-fila") + escena(5, 7, panel) + escena(7, None, envio + aviso, "bq-esc-arriba"),
        "etiquetas": ["Datos de varias fuentes", "Informe sin intervención", "Decisiones con datos al día"],
    }


def demo_conexion():
    def caja(paso, app, cls, titulo, cuerpo, estado):
        return (f'<div class="bq-ui bq-nodo"{en(paso)}><div class="bq-nodo-cab"><i class="bq-app {cls}">{app[0]}</i><b>{app}</b></div>'
                f'<p>{titulo}</p><small>{cuerpo}</small><span class="bq-nodo-estado">{OK}{estado}</span></div>')
    rejilla = (
        '<div class="bq-red">'
        + caja(1, "Tienda online", "bq-app-lila", "Pedido #3271", "2 × Silla · 189,80 €", "Pagado")
        + caja(2, "ERP", "bq-app-azul", "Pedido registrado", "Cliente y factura", "Sincronizado")
        + caja(4, "Logística", "bq-app-naranja", "Preparar envío", "Almacén A · hoy 17:00", "Solicitado")
        + caja(3, "Inventario", "bq-app-verde", 'Silla Nord: <s>14</s> 12', "Stock actualizado", "Al día")
        + f'<span class="bq-flecha bq-flecha-1"{en(2)}>→</span><span class="bq-flecha bq-flecha-2"{en(3)}>↓</span>'
        + f'<span class="bq-flecha bq-flecha-3"{en(4)}>←</span>'
        + '</div>'
    )
    aviso = f'<div class="bq-aviso"{en(5)}>{OK}<span><b>Al cliente: «Tu pedido #3271 está en preparación»</b><small>Sin copiar ni pegar datos entre programas</small></span></div>'
    return {
        "id": "conexion", "icono": "conexion", "titulo": "Conexión entre herramientas",
        "ejemplo": "tienda online, ERP, inventario y logística sincronizados en cada pedido.",
        "fases": [("Pedido", 1), ("ERP", 2), ("Inventario", 3), ("Logística", 4), ("Cliente", 5)],
        "pasos": [2500, 2300, 2300, 2400, 5600],
        "escenas": escena(1, None, rejilla + aviso),
        "etiquetas": ["Sin copiar y pegar", "Inventario al día", "Sin duplicar datos"],
    }


def demo_reservas():
    widget = ventana("restaurante.com · Reservar", (
        '<p class="bq-form-tit">Reservar mesa</p>'
        f'<div class="bq-input bq-input-sel"{en(1)}><small>Día</small><span>Sábado, 8 de noviembre</span></div>'
        '<div class="bq-input-doble">'
        f'<div class="bq-input bq-input-sel"{en(1)}><small>Hora</small><span>21:00</span></div>'
        f'<div class="bq-input bq-input-sel"{en(1)}><small>Personas</small><span>4</span></div></div>'
        f'<div class="bq-boton" data-marca="2">Reservar{CURSOR}</div>'
    ), "bq-ui-llena bq-ui-form")
    def mesa(n):
        cls = "bq-mesa" + (" bq-mesa-ocupada" if n in (1, 3, 4, 7) else "") + (" bq-mesa-elegida" if n == 6 else "")
        marca = ' data-marca="3"' if n == 6 else ""
        return f'<i class="{cls}"{marca}>{n}</i>'
    mesas = "".join(mesa(n) for n in range(1, 9))
    sala = ventana("Disponibilidad · sábado 21:00", (
        f'<div class="bq-sala">{mesas}</div>'
        '<div class="bq-leyenda"><span><i class="bq-mesa-mini"></i>Libre</span><span><i class="bq-mesa-mini bq-mesa-ocupada"></i>Ocupada</span></div>'
        f'<div class="bq-registro"{en(4)}>{OK}<span><b>Reserva R-1048 registrada</b><small>Mesa 6 · 4 personas · 21:00</small></span></div>'
    ), "bq-ui-llena")
    whatsapp = (f'<div class="bq-wa"><div class="bq-wa-cab">{WA}<b>Restaurante · WhatsApp</b></div>'
                f'<p class="bq-wa-msg"{en(5)}>Hola, Jordi: tu reserva para <b>4 personas</b> el <b>sábado 8 de noviembre a las 21:00</b> está confirmada. Si necesitas cambiarla, responde a este mensaje.<small>21:00 ✓✓</small></p></div>')
    horas = [("20:00", "Marta · 2 pers."), ("20:30", "Pau · 6 pers.")]
    agenda = "".join(f'<div class="bq-hora"><small>{h}</small><span>{t}</span></div>' for h, t in horas)
    calendario = ventana("Sábado 8 nov", (
        f'{agenda}<div class="bq-hora bq-hora-nueva"{en(6)}><small>21:00</small><span>Jordi · 4 pers.</span></div>'
    ), "bq-ui-panel bq-calendario")
    return {
        "id": "reservas", "icono": "reservas", "titulo": "Reservas y citas",
        "ejemplo": "las reservas de un restaurante, con confirmación por WhatsApp y calendario al día.",
        "fases": [("Reserva", 1), ("Disponibilidad", 3), ("Registro", 4), ("WhatsApp", 5), ("Calendario", 6)],
        "pasos": [2400, 1300, 2500, 1900, 2800, 5400],
        "escenas": escena(1, 3, widget) + escena(3, 5, sala) + escena(5, None, f'<div class="bq-dos bq-dos-reserva">{whatsapp}{calendario}</div>'),
        "etiquetas": ["Reservas 24/7", "Confirmación automática", "Calendario al día"],
    }


DEMOS = [demo_facturas, demo_asistente, demo_crm, demo_informes, demo_conexion, demo_reservas]

SUBTITULO = "No son ideas genéricas: así se ve una automatización trabajando en una empresa como la tuya."
NOTA = "Demostraciones con datos de ejemplo."


def tarjeta(d):
    fases = "".join(f'<li data-desde="{desde}"><i>{n}</i><span>{esc(t)}</span></li>' for n, (t, desde) in enumerate(d["fases"], 1))
    etiquetas = "".join(f"<li>{esc(t)}</li>" for t in d["etiquetas"])
    icono = f'<svg viewBox="0 0 24 24" aria-hidden="true">{ICONOS[d["icono"]]}</svg>'
    pasos = ",".join(str(p) for p in d["pasos"])
    return (
        f'<article class="bq-dm" data-demo="{d["id"]}">'
        f'<div class="bq-dm-cab"><span class="bq-dm-icono">{icono}</span><div><h3>{esc(d["titulo"])}</h3>'
        f'<p><b>Ejemplo:</b> {esc(d["ejemplo"])}</p></div></div>'
        f'<div class="bq-dm-video" data-pasos="{pasos}" role="group" aria-label="Demostración: {esc(d["titulo"])}">'
        f'<ol class="bq-dm-fases">{fases}</ol><div class="bq-dm-escena">{d["escenas"]}</div></div>'
        f'<ul class="bq-dm-etiquetas">{etiquetas}</ul></article>'
    )


def seccion_html():
    """Contenido que sustituye a las tarjetas de la sección (dentro de un div.bq-demos)."""
    tarjetas = "".join(tarjeta(f()) for f in DEMOS)
    h = (f'<p class="bq-demos-sub">{esc(SUBTITULO)}</p><div class="bq-demos-rejilla">{tarjetas}</div>'
         f'<p class="bq-demos-nota">{esc(NOTA)}</p>')
    assert "`" not in h and "${" not in h and "\\" not in h, "el HTML de las demostraciones no puede ir en un template de JS"
    return h
