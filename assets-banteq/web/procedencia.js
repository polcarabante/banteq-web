// Origen observado al llegar a una página, sin identificadores ni almacenamiento del navegador.
(() => {
  const rutaGuias = /^\/guias(?:\/[a-z0-9-]+)?\/?$/;
  const canales = new Set(["paid", "email", "campaign", "ai", "google", "search", "internal", "referral", "unknown"]);
  const query = new URLSearchParams(location.search);
  let anterior;
  try { anterior = new URL(document.referrer); } catch { /* Puede faltar la referencia. */ }

  function detectarCanal() {
    const medio = (query.get("utm_medium") || "").trim().toLowerCase();
    if (["gclid", "dclid", "msclkid", "gbraid", "wbraid"].some(key => query.has(key)) ||
        ["cpc", "ppc", "paid", "paid_search", "paid_social", "display", "cpm"].includes(medio)) return "paid";
    if (["email", "e-mail", "newsletter"].includes(medio)) return "email";
    if (medio && medio !== "organic" && medio !== "referral") return "campaign";
    if ((query.get("utm_source") || "").toLowerCase() === "chatgpt.com") return "ai";
    if (!anterior) return medio === "referral" ? "campaign" : "unknown";
    const host = anterior.hostname.toLowerCase();
    const de = domain => host === domain || host.endsWith("." + domain);
    if (host === location.hostname || de("banteq.com")) return "internal";
    if (["chatgpt.com", "chat.openai.com", "perplexity.ai", "claude.ai", "gemini.google.com", "copilot.microsoft.com"].some(de)) return "ai";
    if (["google.es", "google.com", "google.cat"].some(domain => host === domain || host === "www." + domain)) return "google";
    if (["bing.com", "duckduckgo.com", "search.yahoo.com", "search.brave.com", "ecosia.org"].some(de)) return "search";
    return "referral";
  }

  let sourceSignal = detectarCanal();
  let entryPath = location.pathname;
  const paso = location.hash.match(/^#hablemos~bq-([a-z]+)$/);
  if (paso && canales.has(paso[1])) {
    if (sourceSignal === "internal" && anterior?.origin === location.origin && rutaGuias.test(anterior.pathname)) {
      sourceSignal = paso[1];
      entryPath = anterior.pathname;
    }
    history.replaceState(history.state, "", location.pathname + location.search + "#hablemos");
  }
  window.BANTEQ_ENTRADA = { sourceSignal, entryPath };

  // Solo el contacto desde una guía necesita pasar el canal entre documentos.
  if (rutaGuias.test(location.pathname)) {
    document.addEventListener("click", event => {
      if (event.defaultPrevented || event.button !== 0 || event.metaKey || event.ctrlKey || event.altKey || event.shiftKey) return;
      const enlace = event.target.closest?.("a[data-bq-contacto-guia]");
      if (!enlace) return;
      const destino = new URL(enlace.href);
      if (destino.origin !== location.origin || destino.hash !== "#hablemos") return;
      event.preventDefault();
      destino.hash = "hablemos~bq-" + sourceSignal;
      location.assign(destino.href);
    });
  }
})();
