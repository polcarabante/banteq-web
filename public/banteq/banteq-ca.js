// Capa de idioma de las páginas en catalán (/ca/…). Solo se carga en ellas (tools/build.py).
//
// El contenido de cada página ya está en catalán (tools/contenido_ca.py). Lo que comparten todas las
// páginas (menú, pie, formulario de contacto y ventana de la Fórmula Banteq) lo pintan los
// componentes de Framer y banteq.js en castellano: aquí se traduce sobre la página ya pintada, sin
// tocar ese código. Así la web en castellano no cambia en nada.
//
// - Textos: se sustituyen los que coinciden exactamente con el diccionario (o con una regla, si
//   llevan datos dentro). Lo que no está en el diccionario se queda como está.
// - Enlaces a servicios: apuntan a su página en catalán (menos el enlace «castellà», marcado con
//   hreflang="es", que lleva a propósito a la versión en castellano).
// - Navegación: desde una página en catalán, los enlaces internos cargan la página entera (no la
//   navegación sin recarga de Framer), para que cada página llegue con su idioma y sus metadatos.
(() => {
  if (!/^\/ca(\/|$)/.test(location.pathname)) return;
  const TEXTOS = {"Hablemos": "Parlem", "Inicio": "Inici", "Proyectos": "Projectes", "Automatización": "Automatització", "Inteligencia artificial": "Intel·ligència artificial", "n8n e integraciones": "n8n i integracions", "Desarrollo web": "Desenvolupament web", "Mantenimiento web": "Manteniment web", "Aviso legal": "Avís legal", "Privacidad": "Privacitat", "Cuéntanos qué quieres mejorar.": "Explica'ns què vols millorar.", "Empezamos por ahí.": "Comencem per aquí.", "Revisaremos tu caso y te diremos qué tiene sentido automatizar, qué herramientas conectar o cómo mejorar tu web.": "Revisarem el teu cas i et direm què té sentit automatitzar, quines eines connectar o com millorar el teu web.", "Tu nombre*": "El teu nom*", "¿Qué te gustaría mejorar?*": "Què t'agradaria millorar?*", "¿Cómo prefieres que te contactemos?": "Com prefereixes que et contactem?", "Recomendado": "Recomanat", "Correo electrónico": "Correu electrònic", "Recomendamos WhatsApp para una comunicación más rápida y directa.": "Recomanem WhatsApp per a una comunicació més ràpida i directa.", "Prefijo del país": "Prefix del país", "Enviar solicitud": "Enviar sol·licitud", "¡Gracias! Te escribimos pronto": "Gràcies! T'escriurem aviat", "No se ha podido enviar": "No s'ha pogut enviar", "Escribe tu nombre.": "Escriu el teu nom.", "Escribe el nombre de tu empresa.": "Escriu el nom de la teva empresa.", "Cuéntanos qué te gustaría mejorar.": "Explica'ns què t'agradaria millorar.", "Escribe tu número de WhatsApp.": "Escriu el teu número de WhatsApp.", "Revisa el número: en España son 9 cifras (por ejemplo, 612 345 678).": "Revisa el número: a Espanya són 9 xifres (per exemple, 612 345 678).", "Revisa el número de teléfono (sin el prefijo del país).": "Revisa el número de telèfon (sense el prefix del país).", "Introduce un número de teléfono válido.": "Introdueix un número de telèfon vàlid.", "Escribe tu correo electrónico.": "Escriu el teu correu electrònic.", "Revisa el correo: parece incompleto (por ejemplo, nombre@empresa.com).": "Revisa el correu: sembla incomplet (per exemple, nom@empresa.com).", "Revisa los campos marcados.": "Revisa els camps marcats.", "Revisa el campo marcado.": "Revisa el camp marcat.", "Enviando tu solicitud…": "Enviant la teva sol·licitud…", "No hemos podido confirmar el envío. Inténtalo de nuevo.": "No hem pogut confirmar l'enviament. Torna-ho a provar.", "Ya hemos recibido esta solicitud. Te escribiremos pronto.": "Ja hem rebut aquesta sol·licitud. T'escriurem aviat.", "No hemos podido enviar tu solicitud. Inténtalo de nuevo en unos minutos.": "No hem pogut enviar la teva sol·licitud. Torna-ho a provar d'aquí a uns minuts.", "No hemos podido enviar tu solicitud. Revisa tu conexión e inténtalo de nuevo.": "No hem pogut enviar la teva sol·licitud. Revisa la connexió i torna-ho a provar.", "Envío no confirmado": "Enviament no confirmat", "Tu web, renovada.": "El teu web, renovat.", "Tú solo contratas su mantenimiento.": "Tu només en contractes el manteniment.", "Remodelamos tu web sin coste de desarrollo básico al contratar nuestro mantenimiento. Ahorra un 25 % de tu cuota actual, hasta 50 €/mes, con una cuota mínima de 35 €/mes.": "Remodelem el teu web sense cost de desenvolupament bàsic en contractar el nostre manteniment. Estalvia un 25 % de la teva quota actual, fins a 50 €/mes, amb una quota mínima de 35 €/mes.", "de desarrollo en tu web informativa": "de desenvolupament al teu web informatiu", "menos que tu cuota actual": "menys que la teva quota actual", "hasta": "fins a", "de ahorro al mes": "d'estalvi al mes", "Pedir mi propuesta": "Demanar la meva proposta", "Nos dices cuánto pagas hoy": "Ens dius quant pagues avui", "por el mantenimiento de tu web.": "pel manteniment del teu web.", "En menos de 48 h": "En menys de 48 h", "te enviamos la propuesta de tu web remodelada y la oferta de mantenimiento.": "t'enviem la proposta del teu web remodelat i l'oferta de manteniment.", "Si te convence,": "Si et convenç,", "dejamos por escrito qué incluye y renovamos tu web.": "deixem per escrit què inclou i renovem el teu web.", "La remodelación gratuita incluye una web informativa básica con formulario de contacto; las funcionalidades adicionales se presupuestan aparte. Importes sin IVA.": "La remodelació gratuïta inclou un web informatiu bàsic amb formulari de contacte; les funcionalitats addicionals es pressuposten a part. Imports sense IVA.", "Condiciones completas": "Condicions completes", "Pide tu propuesta": "Demana la teva proposta", "Cuatro datos y te respondemos en menos de 48 h.": "Quatre dades i et responem en menys de 48 h.", "Tu web actual": "El teu web actual", "¿Cuánto pagas al mes por el mantenimiento de tu web? (sin IVA)": "Quant pagues al mes pel manteniment del teu web? (sense IVA)", "¿Por dónde te enviamos la propuesta?": "Per on t'enviem la proposta?", "Quiero mi propuesta": "Vull la meva proposta", "Usaremos estos datos solo para preparar y enviarte la propuesta.": "Farem servir aquestes dades només per preparar i enviar-te la proposta.", "Política de privacidad": "Política de privacitat", "Solicitud recibida": "Sol·licitud rebuda", "Cerrar": "Tancar", "Nombre de tu empresa": "Nom de la teva empresa", "tuempresa.com": "lamevaempresa.com", "Por ejemplo, 120": "Per exemple, 120", "Tu correo electrónico": "El teu correu electrònic", "Escribe la dirección de tu web actual.": "Escriu l'adreça del teu web actual.", "Revisa la dirección: por ejemplo, tuempresa.com.": "Revisa l'adreça: per exemple, lamevaempresa.com.", "Indica cuánto pagas al mes, aunque sea aproximado.": "Indica quant pagues al mes, encara que sigui aproximat.", "Escribe el importe en euros, por ejemplo 120.": "Escriu l'import en euros, per exemple 120."};
  const REGLAS = [["^Te escribiremos por WhatsApp al (.+)\\.$", "T'escriurem per WhatsApp al $1."], ["^Te responderemos a (.+) y te hemos enviado una confirmación\\.$", "Et respondrem a $1 i t'hem enviat una confirmació."], ["^Te responderemos a (.+)\\.$", "Et respondrem a $1."], ["^Con (.+) €/mes, tu cuota con Banteq sería de$", "Amb $1 €/mes, la teva quota amb Banteq seria de"], ["^: (.+) € menos al mes\\. Te la confirmamos al revisar tu mantenimiento actual\\.$", ": $1 € menys al mes. Te la confirmem en revisar el teu manteniment actual."], ["^La cuota mínima de mantenimiento con Banteq es de (.+) €/mes, así que con (.+) €/mes no habría descuento\\.$", "La quota mínima de manteniment amb Banteq és de $1 €/mes, així que amb $2 €/mes no hi hauria descompte."], ["^Te responderemos en menos de 48 h por WhatsApp al (.+) con la propuesta de tu web remodelada y la oferta de mantenimiento\\. Te hemos enviado una confirmación a tu correo\\.$", "Et respondrem en menys de 48 h per WhatsApp al $1 amb la proposta del teu web remodelat i l'oferta de manteniment. T'hem enviat una confirmació al teu correu."], ["^Te responderemos en menos de 48 h por WhatsApp al (.+) con la propuesta de tu web remodelada y la oferta de mantenimiento\\.$", "Et respondrem en menys de 48 h per WhatsApp al $1 amb la proposta del teu web remodelat i l'oferta de manteniment."], ["^Te responderemos en menos de 48 h a (.+) con la propuesta de tu web remodelada y la oferta de mantenimiento\\. Te hemos enviado una confirmación a tu correo\\.$", "Et respondrem en menys de 48 h a $1 amb la proposta del teu web remodelat i l'oferta de manteniment. T'hem enviat una confirmació al teu correu."], ["^Te responderemos en menos de 48 h a (.+) con la propuesta de tu web remodelada y la oferta de mantenimiento\\.$", "Et respondrem en menys de 48 h a $1 amb la proposta del teu web remodelat i l'oferta de manteniment."]].map(([patron, sustitucion]) => [new RegExp(patron), sustitucion]);
  const ENLACES = {"/automatizacion-procesos": "/ca/automatitzacio-processos", "/inteligencia-artificial": "/ca/intelligencia-artificial", "/automatizacion-n8n": "/ca/automatitzacio-n8n", "/desarrollo-web": "/ca/desenvolupament-web", "/mantenimiento-web": "/ca/manteniment-web"};
  const ATRIBUTOS = ["placeholder", "aria-label", "title"];

  const traducir = (texto) => {
    const partes = /^(\s*)([\s\S]*?)(\s*)$/.exec(texto);
    const nucleo = partes[2].replace(/\s+/g, " ");
    if (!nucleo) return null;
    if (Object.prototype.hasOwnProperty.call(TEXTOS, nucleo)) return partes[1] + TEXTOS[nucleo] + partes[3];
    for (const [patron, sustitucion] of REGLAS) {
      if (patron.test(nucleo)) return partes[1] + nucleo.replace(patron, sustitucion) + partes[3];
    }
    return null;
  };

  const textoDe = (nodo) => {
    const padre = nodo.parentElement;
    if (!padre || /^(SCRIPT|STYLE|OPTION|TEXTAREA)$/.test(padre.tagName)) return;
    const nuevo = traducir(nodo.data);
    if (nuevo !== null && nuevo !== nodo.data) nodo.data = nuevo;
  };

  const aCastellano = (enlace) => enlace.getAttribute("hreflang") === "es";

  const rutaCatalana = (href) => {
    try {
      const url = new URL(href, location.href);
      if (url.origin !== location.origin) return null;
      const destino = ENLACES[url.pathname.replace(/\/+$/, "") || "/"];
      return destino ? destino + url.search + url.hash : null;
    } catch {
      return null;
    }
  };

  const elemento = (el) => {
    for (const atributo of ATRIBUTOS) {
      const valor = el.getAttribute(atributo);
      if (!valor) continue;
      const nuevo = traducir(valor);
      if (nuevo !== null && nuevo !== valor) el.setAttribute(atributo, nuevo);
    }
    if (el.tagName === "A" && el.hasAttribute("href") && !aCastellano(el)) {
      const destino = rutaCatalana(el.getAttribute("href"));
      if (destino && el.getAttribute("href") !== destino) el.setAttribute("href", destino);
    }
  };

  const recorrer = (raiz) => {
    if (raiz.nodeType === Node.TEXT_NODE) return textoDe(raiz);
    if (raiz.nodeType !== Node.ELEMENT_NODE) return;
    elemento(raiz);
    raiz.querySelectorAll("[placeholder],[aria-label],[title],a[href]").forEach(elemento);
    const textos = document.createTreeWalker(raiz, NodeFilter.SHOW_TEXT);
    for (let nodo; (nodo = textos.nextNode()); ) textoDe(nodo);
  };

  const observar = () => {
    recorrer(document.body);
    new MutationObserver((cambios) => {
      for (const cambio of cambios) {
        if (cambio.type === "childList") cambio.addedNodes.forEach(recorrer);
        else if (cambio.type === "characterData") textoDe(cambio.target);
        else if (cambio.target.nodeType === Node.ELEMENT_NODE) elemento(cambio.target);
      }
    }).observe(document.body, {
      childList: true,
      subtree: true,
      characterData: true,
      attributes: true,
      attributeFilter: [...ATRIBUTOS, "href"],
    });
  };
  if (document.body) observar();
  else document.addEventListener("DOMContentLoaded", observar);

  // Enlaces internos: carga completa de la página de destino (en su idioma), salvo las anclas de la
  // propia página (#hablemos, #formula-banteq), que siguen funcionando como siempre.
  document.addEventListener(
    "click",
    (evento) => {
      if (evento.defaultPrevented || evento.button !== 0 || evento.metaKey || evento.ctrlKey || evento.shiftKey || evento.altKey) return;
      const enlace = evento.target.closest && evento.target.closest("a[href]");
      if (!enlace || (enlace.target && enlace.target !== "_self") || enlace.hasAttribute("download")) return;
      let url;
      try {
        url = new URL(enlace.getAttribute("href"), location.href);
      } catch {
        return;
      }
      if (url.origin !== location.origin) return;
      const catalana = aCastellano(enlace) ? null : rutaCatalana(url.href);
      if (catalana) url = new URL(catalana, location.origin);
      if (url.pathname === location.pathname && url.search === location.search) return;
      evento.preventDefault();
      evento.stopImmediatePropagation();
      location.assign(url.href);
    },
    true,
  );
})();
