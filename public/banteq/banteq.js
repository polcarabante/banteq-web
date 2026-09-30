// Ajustes de Banteq sobre el runtime de Framer.
(() => {
  // Los formularios de Framer envían a la API de Framer. Aquí se redirigen al
  // endpoint propio (/api/leads), que guarda el contacto y avisa al equipo.
  const nativeFetch = window.fetch.bind(window);

  const readHeader = (headers, name) => {
    if (!headers) return undefined;
    if (typeof headers.get === "function") return headers.get(name);
    return headers[name];
  };

  window.fetch = (input, init = {}) => {
    const isFramerForm = readHeader(init.headers, "Framer-POW") || readHeader(init.headers, "Framer-Form-Fields");
    if (!isFramerForm || !(init.body instanceof FormData)) return nativeFetch(input, init);

    const fields = Object.fromEntries(init.body.entries());
    const pick = (...keys) => keys.map((key) => fields[key]).find(Boolean) || "";
    // Campos trampa de Framer: si alguno viene relleno, es un bot y no se envía nada.
    const honeypots = ["website", "subject", "title", "description", "feedback", "notes", "details", "remarks", "comments"];
    if (honeypots.some((key) => fields[key])) return Promise.resolve(new Response("{}", { status: 200 }));
    const payload = {
      formType: "Contacto web",
      origin: window.location.pathname,
      name: pick("Name", "name", "Nombre"),
      company: pick("Company", "company", "Empresa"),
      email: pick("Email", "email"),
      message: pick("Message", "message", "Mensaje"),
    };

    return nativeFetch("/api/leads", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
  };

  // Tiras en bucle (tiras de herramientas, carrusel de palabras, logos del hero). Cada tira es una
  // animación de compositor sobre su <ul>; aquí solo se pausa fuera de pantalla (con margen para que
  // ya esté en marcha al entrar), con la pestaña oculta y con «reducir movimiento». Sin React.
  const reduceMotion = matchMedia("(prefers-reduced-motion: reduce)");
  const tickers = new Map(); // <ul> → visible
  const isLoop = (a) => a.effect && a.effect.getTiming().iterations === Infinity && a.effect.target && a.effect.target.tagName === "UL";
  const applyTicker = (ul) => {
    const run = tickers.get(ul) && !document.hidden && !reduceMotion.matches;
    for (const a of ul.getAnimations()) {
      if (!isLoop(a)) continue;
      if (run && a.playState === "paused") a.play();
      else if (!run && a.playState === "running") a.pause();
    }
  };
  const tickerIO = new IntersectionObserver(
    (entries) => {
      for (const entry of entries) {
        const ul = entry.target.querySelector(":scope > ul");
        if (!ul || !tickers.has(ul)) continue;
        tickers.set(ul, entry.isIntersecting);
        applyTicker(ul);
      }
    },
    { rootMargin: "200px 0px" },
  );
  const scanTickers = () => {
    if (document.hidden) return;
    for (const [ul] of tickers) {
      if (!ul.isConnected) {
        tickerIO.unobserve(ul.parentElement);
        tickers.delete(ul);
      }
    }
    for (const a of document.getAnimations()) {
      if (!isLoop(a)) continue;
      const ul = a.effect.target;
      if (!tickers.has(ul)) {
        tickers.set(ul, true);
        tickerIO.observe(ul.parentElement);
      }
    }
    // Framer vuelve a crear la animación al cambiar de tamaño: se reaplica el estado conocido.
    for (const [ul] of tickers) applyTicker(ul);
    mountCuadroVideo();
  };

  // «Quiénes somos»: si el cuadrado central tiene vídeo (tools/contenido.py → CUADRO_CENTRAL), se
  // coloca encima del logo y solo se reproduce mientras se ve.
  const cuadro = window.BANTEQ_CUADRO;
  const mountCuadroVideo = () => {
    if (!cuadro || !cuadro.video) return;
    const inner = document.querySelector('#banteq [data-framer-name="Video Inner"]');
    if (!inner || inner.querySelector(".bq-cuadro-video")) return;
    const video = document.createElement("video");
    video.className = "bq-cuadro-video";
    video.muted = true;
    video.loop = true;
    video.playsInline = true;
    video.preload = "none";
    video.setAttribute("aria-hidden", "true");
    if (cuadro.poster) video.poster = cuadro.poster;
    video.src = cuadro.video;
    inner.appendChild(video);
    new IntersectionObserver(([entry]) => {
      if (entry.isIntersecting && !document.hidden && !reduceMotion.matches) video.play().catch(() => {});
      else video.pause();
    }).observe(inner);
  };
  setInterval(scanTickers, 1500);
  window.addEventListener("load", scanTickers);
  // Framer reanuda sus tiras al volver a la pestaña; después se vuelve a pausar lo que no se ve.
  document.addEventListener("visibilitychange", () => setTimeout(scanTickers, 0));
  reduceMotion.addEventListener("change", scanTickers);

  // Menú de la cabecera: al elegir un enlace, la página cambiaba (o bajaba hasta la sección, como
  // «Servicios» en la home) pero el menú seguía abierto encima: el router de Framer mantiene la
  // cabecera montada entre páginas. Se cierra como al pulsar «×» (el botón responde a onTap de
  // Framer: pointerdown + pointerup).
  const closeMenuAfter = (link) => {
    const nav = link.closest('.framer-KFp9B[data-framer-name="Open"]');
    const toggle = nav && nav.querySelector('[data-highlight][data-framer-name="Open"]');
    if (!toggle) return;
    requestAnimationFrame(() => {
      const opts = { bubbles: true, cancelable: true, composed: true, isPrimary: true, pointerId: 1, pointerType: "mouse", button: 0 };
      toggle.dispatchEvent(new PointerEvent("pointerdown", { ...opts, buttons: 1 }));
      toggle.dispatchEvent(new PointerEvent("pointerup", { ...opts, buttons: 0 }));
    });
  };

  // Enlaces a otras webs en pestaña nueva; los propios, en la misma.
  document.addEventListener(
    "click",
    (event) => {
      const link = event.target.closest && event.target.closest("a[href]");
      if (!link) return;
      if (new URL(link.href, window.location.href).origin !== window.location.origin) {
        link.target = "_blank";
        link.rel = "noopener noreferrer";
      } else {
        if (link.target === "_blank") link.removeAttribute("target");
        closeMenuAfter(link);
      }
    },
    true,
  );
})();
