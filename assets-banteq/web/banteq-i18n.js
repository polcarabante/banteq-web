// Capa de idioma de las páginas en catalán (/ca/…) y en inglés (/en/…). tools/build.py genera de
// esta plantilla un archivo por idioma (i18n-ca.js, i18n-en.js) con el diccionario dentro, y solo
// lo carga en las páginas de ese idioma: la web en castellano no lo ve ni cambia en nada.
//
// Los textos de las páginas son los de la web en castellano y se traducen de dos formas:
//
// 1. BQT(texto): build.py envuelve con ella cada texto que los módulos de Framer pintan
//    (children:`…`), así que React recibe ya el texto traducido. Es lo que hace que los titulares
//    animados palabra a palabra o letra a letra salgan bien: Framer los trocea sobre el texto
//    traducido. Debe existir antes de que arranquen los módulos: este script se carga sin diferir.
// 2. Sobre la página pintada (MutationObserver): lo que no pasa por Framer (demostraciones animadas,
//    ventanas y avisos de banteq.js, atributos placeholder/aria-label/alt/title) y lo que se pinta
//    de los datos del CMS. Traduce los textos que coinciden exactamente con el diccionario (o con
//    una regla, si llevan datos dentro). Lo que no está en el diccionario se queda como está.
//
// Enlaces internos: apuntan a la página equivalente en este idioma. Desde una página traducida,
// los enlaces internos cargan la página entera (no la navegación sin recarga de Framer), para que
// cada página llegue con su idioma y sus metadatos.
(() => {
  const D = /*DATOS*/ {};
  const TEXTOS = D.textos;
  const REGLAS = D.reglas.map(([patron, sustitucion]) => [new RegExp(patron), sustitucion]);
  const ENLACES = D.enlaces;
  const ATRIBUTOS = ["placeholder", "aria-label", "title", "alt"];

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

  // Para los módulos de Framer (ver arriba). Lo que no es texto, o no está en el diccionario, pasa igual.
  window.BQT = (texto) => {
    if (typeof texto !== "string") return texto;
    const nuevo = traducir(texto);
    return nuevo === null ? texto : nuevo;
  };

  const textoDe = (nodo) => {
    const padre = nodo.parentElement;
    if (!padre || /^(SCRIPT|STYLE|TEXTAREA)$/.test(padre.tagName)) return;
    const nuevo = traducir(nodo.data);
    if (nuevo !== null && nuevo !== nodo.data) nodo.data = nuevo;
  };

  const aOtroIdioma = (enlace) => enlace.hasAttribute("hreflang");

  const rutaLocal = (href) => {
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
    if (el.tagName === "A" && el.hasAttribute("href") && !aOtroIdioma(el)) {
      const destino = rutaLocal(el.getAttribute("href"));
      if (destino && el.getAttribute("href") !== destino) el.setAttribute("href", destino);
    }
  };

  // Titulares que Framer anima palabra a palabra con datos del CMS (los títulos de proyecto): cada
  // palabra es un <span>. Se traduce la frase entera y se reparten sus palabras entre los <span>
  // que hay (sin añadir ni quitar elementos, que son de React: solo cambia el texto de cada uno).
  const palabras = (el) => {
    const hijos = el.children;
    if (hijos.length < 3 || hijos.length > 40) return;
    for (const h of hijos) if (h.tagName !== "SPAN" || h.children.length || !h.firstChild || h.firstChild.nodeType !== Node.TEXT_NODE) return;
    const nuevo = traducir(el.textContent);
    if (nuevo === null) return;
    const dest = nuevo.trim().split(/\s+/);
    const n = hijos.length;
    for (let k = 0; k < n; k++) {
      const resto = k === n - 1 ? dest.slice(k).join(" ") : dest[k] || "";
      const hay = hijos[k].firstChild;
      const nuevoTexto = resto + (k < n - 1 && resto ? " " : "");
      if (hay.data.trim() !== resto || (!/\s$/.test(hay.data) && k < n - 1 && resto)) hay.data = nuevoTexto;
    }
  };

  const recorrer = (raiz) => {
    if (raiz.nodeType === Node.TEXT_NODE) return textoDe(raiz);
    if (raiz.nodeType !== Node.ELEMENT_NODE) return;
    elemento(raiz);
    palabras(raiz);
    raiz.querySelectorAll("[placeholder],[aria-label],[title],[alt],a[href]").forEach(elemento);
    raiz.querySelectorAll("p,h1,h2,h3,h4,div").forEach(palabras);
    const textos = document.createTreeWalker(raiz, NodeFilter.SHOW_TEXT);
    for (let nodo; (nodo = textos.nextNode()); ) textoDe(nodo);
  };

  const observar = () => {
    recorrer(document.body);
    new MutationObserver((cambios) => {
      for (const cambio of cambios) {
        if (cambio.type === "childList") {
          cambio.addedNodes.forEach(recorrer);
          if (cambio.target.nodeType === Node.ELEMENT_NODE) palabras(cambio.target);
        }
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
      const local = aOtroIdioma(enlace) ? null : rutaLocal(url.href);
      if (local) url = new URL(local, location.origin);
      if (url.pathname.replace(/\/+$/, "") === location.pathname.replace(/\/+$/, "") && url.search === location.search) return;
      evento.preventDefault();
      evento.stopImmediatePropagation();
      location.assign(url.href);
    },
    true,
  );
})();
