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
    // Método de contacto elegido (selector de más abajo): el cliente da el teléfono o el correo,
    // no los dos. Sin selector (si no llegó a montarse) el formulario sigue siendo el de correo.
    if (fields.ContactMethod === "whatsapp") {
      const prefix = String(fields.PhonePrefix || "34").replace(/\D/g, "");
      let number = String(fields.Phone || "").replace(/\D/g, "");
      // El 0 inicial de los números nacionales (06…, 07…) no forma parte del número internacional;
      // en Italia sí.
      if (prefix !== "39") number = number.replace(/^0+/, "");
      payload.contactPreference = "WhatsApp";
      payload.phone = number ? `+${prefix}${number}` : "";
      payload.email = "";
    } else if (fields.ContactMethod === "email") {
      payload.contactPreference = "Correo electrónico";
    }

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
  // ---------------------------------------------------------------------------------------------
  // Formulario de contacto: el cliente elige cómo prefiere que le contactemos, WhatsApp (por
  // defecto) o correo, y solo tiene que dar ese dato. El formulario es el de Framer; aquí se le
  // añaden el selector, el aviso y el campo de teléfono con prefijo, y se activa como obligatorio
  // solo el campo del método elegido. El aspecto está en banteq.css («Formulario de contacto»).
  // Nunca se abre WhatsApp: el dato viaja con el resto del formulario a /api/leads.
  // ---------------------------------------------------------------------------------------------
  const PREFIJOS =
    "España|34,Andorra|376,Portugal|351,Francia|33,Italia|39,Alemania|49,Reino Unido|44,Irlanda|353," +
    "Países Bajos|31,Bélgica|32,Luxemburgo|352,Suiza|41,Austria|43,Dinamarca|45,Suecia|46,Noruega|47," +
    "Finlandia|358,Islandia|354,Polonia|48,Chequia|420,Eslovaquia|421,Hungría|36,Rumanía|40,Bulgaria|359," +
    "Grecia|30,Croacia|385,Eslovenia|386,Serbia|381,Estonia|372,Letonia|371,Lituania|370,Ucrania|380," +
    "Malta|356,Chipre|357,Turquía|90,Marruecos|212,Argelia|213,Túnez|216,Egipto|20,Senegal|221," +
    "Guinea Ecuatorial|240,Nigeria|234,Sudáfrica|27,Estados Unidos y Canadá|1,México|52,Argentina|54," +
    "Bolivia|591,Brasil|55,Chile|56,Colombia|57,Costa Rica|506,Cuba|53,Ecuador|593,El Salvador|503," +
    "Guatemala|502,Honduras|504,Nicaragua|505,Panamá|507,Paraguay|595,Perú|51,Uruguay|598,Venezuela|58," +
    "Arabia Saudí|966,Catar|974,Emiratos Árabes Unidos|971,Israel|972,India|91,Pakistán|92,China|86," +
    "Hong Kong|852,Japón|81,Corea del Sur|82,Filipinas|63,Indonesia|62,Singapur|65,Tailandia|66," +
    "Vietnam|84,Australia|61,Nueva Zelanda|64";
  const ICONO_WHATSAPP =
    '<svg viewBox="0 0 24 24" aria-hidden="true"><path fill="currentColor" d="M17.47 14.38c-.3-.15-1.76-.87-2.03-.97-.27-.1-.47-.15-.67.15-.2.3-.77.97-.94 1.16-.17.2-.35.22-.64.08-.3-.15-1.26-.46-2.4-1.48-.88-.79-1.48-1.76-1.65-2.06-.17-.3-.02-.46.13-.6.13-.14.3-.35.44-.52.15-.18.2-.3.3-.5.1-.2.05-.37-.03-.52-.07-.15-.66-1.61-.91-2.2-.24-.58-.49-.5-.67-.51l-.57-.01c-.2 0-.52.07-.8.37-.27.3-1.04 1.02-1.04 2.48s1.07 2.88 1.21 3.07c.15.2 2.1 3.2 5.08 4.49.71.3 1.26.49 1.7.63.71.22 1.36.19 1.87.11.57-.08 1.76-.72 2-1.41.25-.7.25-1.29.18-1.42-.08-.12-.27-.2-.57-.35M12.05 21.79h-.01a9.87 9.87 0 0 1-5.03-1.38l-.36-.21-3.74.98 1-3.65-.24-.37a9.86 9.86 0 0 1-1.51-5.26c0-5.45 4.44-9.88 9.89-9.88a9.83 9.83 0 0 1 6.99 2.9 9.82 9.82 0 0 1 2.9 6.99c-.01 5.45-4.44 9.88-9.89 9.88m8.41-18.3A11.82 11.82 0 0 0 12.05 0C5.5 0 .16 5.34.16 11.89c0 2.1.55 4.14 1.59 5.95L.06 24l6.3-1.65a11.88 11.88 0 0 0 5.68 1.45h.01c6.55 0 11.89-5.34 11.89-11.89a11.82 11.82 0 0 0-3.48-8.42"/></svg>';
  const ICONO_CORREO =
    '<svg viewBox="0 0 24 24" aria-hidden="true" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><rect x="2.75" y="4.75" width="18.5" height="14.5" rx="3"/><path d="m3.5 7 8.5 6.25L20.5 7"/></svg>';
  const FLECHA = '<svg viewBox="0 0 10 10" aria-hidden="true" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><path d="m2 3.75 3 3 3-3"/></svg>';

  const enhanceContactForm = (form) => {
    if (form.dataset.bqContacto) return;
    const emailInput = form.querySelector('input[name="Email"]');
    const emailLabel = emailInput && emailInput.closest("label");
    if (!emailLabel || emailLabel.parentElement !== form) return;
    form.dataset.bqContacto = "1";

    const selector = document.createElement("div");
    selector.className = "bq-metodo";
    selector.setAttribute("role", "radiogroup");
    selector.setAttribute("aria-label", "¿Cómo prefieres que te contactemos?");
    selector.innerHTML =
      '<label class="bq-metodo-opcion"><input type="radio" name="ContactMethod" value="whatsapp" checked>' +
      `<span class="bq-metodo-cara">${ICONO_WHATSAPP}<span>WhatsApp</span></span>` +
      '<span class="bq-metodo-sello">Recomendado</span></label>' +
      '<label class="bq-metodo-opcion"><input type="radio" name="ContactMethod" value="email">' +
      `<span class="bq-metodo-cara">${ICONO_CORREO}<span>Correo electrónico</span></span></label>`;

    const note = document.createElement("p");
    note.className = "bq-metodo-nota";
    note.textContent = "Recomendamos WhatsApp para una comunicación más rápida y directa.";

    // El campo de teléfono es una copia del de correo: mismas clases de Framer, mismo aspecto.
    const telLabel = emailLabel.cloneNode(true);
    const telInput = telLabel.querySelector("input");
    telLabel.dataset.bqCampo = "tel";
    emailLabel.dataset.bqCampo = "email";
    telInput.removeAttribute("id");
    telInput.name = "Phone";
    telInput.type = "tel";
    telInput.value = "";
    telInput.placeholder = "Número de WhatsApp*";
    telInput.inputMode = "tel";
    telInput.autocomplete = "tel-national";
    telInput.setAttribute("aria-label", "Número de WhatsApp");
    // El prefijo va después del <input> en el HTML (y delante a la vista, con order: -1): así, al
    // tocar el hueco del campo, el <label> lleva el foco al número y no abre la lista de países.
    const prefix = document.createElement("span");
    prefix.className = "bq-prefijo";
    prefix.innerHTML = `<span class="bq-prefijo-valor">+34</span>${FLECHA}<select name="PhonePrefix" aria-label="Prefijo del país"></select>`;
    const select = prefix.querySelector("select");
    for (const item of PREFIJOS.split(",")) {
      const [country, code] = item.split("|");
      select.add(new Option(`${country} (+${code})`, code, code === "34", code === "34"));
    }
    telInput.after(prefix);

    emailLabel.before(selector, note, telLabel);

    const validateTel = () => {
      const digits = telInput.value.replace(/\D/g, "");
      const ok = select.value === "34" ? /^[6-9]\d{8}$/.test(digits) : digits.length >= 6 && digits.length <= 14;
      telInput.setCustomValidity(telInput.disabled || !digits || ok ? "" : "Introduce un número de teléfono válido.");
    };
    const sync = () => {
      const whatsapp = (form.querySelector('input[name="ContactMethod"]:checked') || {}).value !== "email";
      form.dataset.bqMetodo = whatsapp ? "whatsapp" : "email";
      // Solo cuenta (obligatorio, validado y enviado) el campo del método elegido.
      telInput.disabled = select.disabled = !whatsapp;
      telInput.required = whatsapp;
      emailInput.disabled = whatsapp;
      emailInput.required = !whatsapp;
      prefix.querySelector(".bq-prefijo-valor").textContent = `+${select.value}`;
      telInput.classList.toggle("framer-form-input-empty", !telInput.value);
      validateTel();
    };
    selector.addEventListener("change", sync);
    select.addEventListener("change", sync);
    telInput.addEventListener("input", sync);
    form.addEventListener("reset", () => setTimeout(sync, 0));
    sync();
  };
  const scanForms = () => document.querySelectorAll("form:not([data-bq-contacto])").forEach(enhanceContactForm);
  // En cuanto Framer monta un formulario (al cargar, al cambiar de página o al rehacer la página en
  // móvil), antes de que se pinte: solo se miran los nodos recién añadidos.
  new MutationObserver((mutations) => {
    for (const mutation of mutations) {
      for (const node of mutation.addedNodes) {
        if (node.nodeType === 1 && (node.tagName === "FORM" || node.querySelector("form"))) return scanForms();
      }
    }
  }).observe(document.documentElement, { childList: true, subtree: true });
  scanForms();

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
