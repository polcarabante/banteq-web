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

  // Enlaces a otras webs (simulador de FUNDAE…) en pestaña nueva; los propios, en la misma.
  document.addEventListener(
    "click",
    (event) => {
      const link = event.target.closest && event.target.closest("a[href]");
      if (!link) return;
      if (new URL(link.href, window.location.href).origin !== window.location.origin) {
        link.target = "_blank";
        link.rel = "noopener noreferrer";
      } else if (link.target === "_blank") {
        link.removeAttribute("target");
      }
    },
    true,
  );
})();
