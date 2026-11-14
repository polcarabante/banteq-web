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
  const TEXTOS = /*DICCIONARIO*/ {};
  const REGLAS = /*REGLAS*/ [].map(([patron, sustitucion]) => [new RegExp(patron), sustitucion]);
  const ENLACES = /*ENLACES*/ {};
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
