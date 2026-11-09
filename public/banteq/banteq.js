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

  // Envío en curso (lo fija la validación de más abajo al dejar pasar un envío).
  let envio = null;
  const respuesta = (status, body) => new Response(JSON.stringify(body), { status, headers: { "Content-Type": "application/json" } });

  window.fetch = (input, init = {}) => {
    const isFramerForm = readHeader(init.headers, "Framer-POW") || readHeader(init.headers, "Framer-Form-Fields");
    if (!isFramerForm || !(init.body instanceof FormData)) return nativeFetch(input, init);
    return enviarSolicitud(Object.fromEntries(init.body.entries()), envio && envio.form);
  };

  // Envía la solicitud a /api/leads y deja el resultado a la vista. La usa Framer (primer intento,
  // a través de fetch) y, tras un error, la validación de más abajo: Framer se queda en su estado
  // de error y ya no reenvía, así que los reintentos se mandan desde aquí.
  const enviarSolicitud = (fields, form) => {
    const pick = (...keys) => keys.map((key) => fields[key]).find(Boolean) || "";
    // Campos trampa de Framer: si alguno viene relleno, es un bot y no se envía nada.
    const honeypots = ["website", "subject", "title", "description", "feedback", "notes", "details", "remarks", "comments"];
    if (honeypots.some((key) => fields[key])) return Promise.resolve(respuesta(200, {}));
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
    const clave = JSON.stringify(payload);
    // La misma solicitud ya se envió bien desde esta página: no se manda otra vez.
    if (form && form.dataset.bqEnviado === clave) {
      terminarEnvio(form, "ok", "Ya hemos recibido esta solicitud. Te escribiremos pronto.");
      return Promise.resolve(respuesta(200, { ok: true }));
    }
    payload.page = window.location.href;
    payload.pageTitle = document.title;
    payload.elapsedMs = form ? Date.now() - Number(form.dataset.bqInicio || 0) : undefined;

    return nativeFetch("/api/leads", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    }).then(
      async (res) => {
        let data = {};
        try {
          data = await res.clone().json();
        } catch {}
        if (res.ok && data.ok) {
          if (form) {
            form.dataset.bqEnviado = clave;
            delete form.dataset.bqFallo;
          }
          const destino = payload.contactPreference === "WhatsApp"
            ? `Te escribiremos por WhatsApp al ${payload.phone}.`
            : `Te responderemos a ${payload.email}${data.confirmation ? " y te hemos enviado una confirmación" : ""}.`;
          terminarEnvio(form, "ok", `Solicitud recibida. ${destino}`);
          return res;
        }
        // Cualquier otra respuesta es un error: nunca se da por enviada.
        if (form) form.dataset.bqFallo = "1";
        if (form && data.fields) marcarErroresServidor(form, data.fields);
        terminarEnvio(form, "error", data.code === "validation" || data.code === "rate_limit"
          ? data.error
          : "No hemos podido enviar tu solicitud. Inténtalo de nuevo en unos minutos.");
        return res.ok ? respuesta(502, { error: { message: data.error || "Envío no confirmado" } }) : res;
      },
      (error) => {
        if (form) form.dataset.bqFallo = "1";
        terminarEnvio(form, "error", "No hemos podido enviar tu solicitud. Revisa tu conexión e inténtalo de nuevo.");
        throw error;
      },
    );
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
  // Tarjetas de proyecto con demo: una grabación real de la web del cliente se reproduce encima de
  // la imagen de la tarjeta, que es su primer fotograma (tools/demo_margon.mjs). Con ratón, mientras
  // el cursor está sobre la tarjeta, y al salir vuelve a la imagen fija; sin ratón (móvil, tableta),
  // mientras la tarjeta se ve en pantalla. El vídeo no se descarga hasta que la tarjeta está cerca.
  // ---------------------------------------------------------------------------------------------
  const demos = window.BANTEQ_DEMOS || {};
  const DEMO_IMG = Object.keys(demos).map((name) => `img[src*="${name}"]`).join(",");
  const conRaton = window.matchMedia("(hover: hover) and (pointer: fine)");
  const ahorroDatos = () => !!(navigator.connection && navigator.connection.saveData);
  const mountDemo = (img) => {
    const marco = img.closest('[data-framer-name="Image"]');
    const tarjeta = marco && marco.closest(".framer-fesYP");
    if (!tarjeta || marco.querySelector(".bq-demo")) return;
    const src = demos[Object.keys(demos).find((name) => img.src.includes(name))];
    const video = document.createElement("video");
    video.className = "bq-demo";
    video.muted = true;
    video.loop = true;
    video.playsInline = true;
    video.preload = "none";
    video.setAttribute("aria-hidden", "true");
    marco.appendChild(video);
    let dentro = false; // el cursor está sobre la tarjeta
    let visible = false; // la tarjeta se ve (casi) entera
    const cargar = (modo) => {
      if (!video.src) {
        video.preload = modo;
        video.src = src;
      }
    };
    const sync = () => {
      const activo = !document.hidden && !reduceMotion.matches && (conRaton.matches ? dentro : visible && !ahorroDatos());
      if (activo) {
        cargar("auto");
        video.play().catch(() => {});
      } else {
        video.pause();
        video.classList.remove("bq-demo-on");
        // Con ratón, la próxima vez empieza desde el principio (cuando ya se ha fundido con la imagen).
        if (conRaton.matches && video.src) setTimeout(() => !dentro && (video.currentTime = 0), 220);
      }
    };
    // Solo se enseña cuando ya hay fotogramas: hasta entonces se sigue viendo la imagen fija.
    video.addEventListener("playing", () => video.classList.add("bq-demo-on"));
    // En el carrusel, la banda de las flechas cruza la tarjeta por el centro y no es hija suya: el
    // cursor «sale» de la tarjeta al pasar por ahí. Se escucha en el carrusel y se mira la posición.
    const zona = tarjeta.closest(".framer-HWODK") || tarjeta;
    const sobre = (event) => {
      const r = tarjeta.getBoundingClientRect();
      const ahora = event.pointerType === "mouse" && event.clientX >= r.left && event.clientX <= r.right && event.clientY >= r.top && event.clientY <= r.bottom;
      if (ahora !== dentro) {
        dentro = ahora;
        sync();
      }
    };
    zona.addEventListener("pointermove", sobre, { passive: true });
    zona.addEventListener("pointerleave", () => {
      if (dentro) {
        dentro = false;
        sync();
      }
    });
    new IntersectionObserver(([entry]) => {
      visible = entry.isIntersecting;
      sync();
    }, { threshold: 0.6 }).observe(marco);
    // Al acercarse la tarjeta: con ratón basta la cabecera del vídeo; sin él, se va a reproducir.
    const cerca = new IntersectionObserver(([entry]) => {
      if (!entry.isIntersecting || reduceMotion.matches || ahorroDatos()) return;
      cargar(conRaton.matches ? "metadata" : "auto");
      cerca.disconnect();
    }, { rootMargin: "300px" });
    cerca.observe(marco);
    document.addEventListener("visibilitychange", sync);
  };
  const scanDemos = () => DEMO_IMG && document.querySelectorAll(DEMO_IMG).forEach(mountDemo);


  // ---------------------------------------------------------------------------------------------
  // Demostraciones de la sección «Automatización e inteligencia artificial» (HTML en
  // tools/demos.py). Cada una es una línea de tiempo de pasos (data-pasos, en ms): un elemento con
  // data-en="k" aparece en el paso k y con data-hasta="m" desaparece en el m; data-marca="k" lo
  // resalta (botón pulsado, mesa elegida…); data-escribe teclea su texto. Solo corre la que se ve:
  // fuera de pantalla, con la pestaña oculta o en pausa no hay temporizadores. Con «reducir
  // movimiento» no arranca sola y enseña el resultado final. La barra de progreso es una animación
  // del compositor (Web Animations); los pasos cambian clases y el CSS hace las transiciones.
  // ---------------------------------------------------------------------------------------------
  const ICO_PAUSA = '<svg viewBox="0 0 16 16" aria-hidden="true"><path d="M5 3.5v9M11 3.5v9"/></svg>';
  const ICO_PLAY = '<svg viewBox="0 0 16 16" aria-hidden="true"><path d="M5 3.2v9.6L12.8 8z" fill="currentColor"/></svg>';
  const ICO_OTRA = '<svg viewBox="0 0 16 16" aria-hidden="true"><path d="M3 8a5 5 0 1 0 1.5-3.6M3 2.8v2.6h2.6"/></svg>';
  const mmss = (ms) => {
    const s = Math.max(0, Math.round(ms / 1000));
    return `${Math.floor(s / 60)}:${String(s % 60).padStart(2, "0")}`;
  };
  const demosActivas = new Set();
  let relojDemos = 0;
  const tickDemos = () => {
    for (const d of demosActivas) d.tick();
    if (!demosActivas.size) {
      clearInterval(relojDemos);
      relojDemos = 0;
    }
  };
  const montarDemo = (video) => {
    if (video.dataset.bqListo) return;
    video.dataset.bqListo = "1";
    const pasos = video.dataset.pasos.split(",").map(Number);
    const inicio = [];
    let total = 0;
    for (const p of pasos) {
      inicio.push(total);
      total += p;
    }
    const titulo = video.getAttribute("aria-label") || "Demostración";
    const ctrl = document.createElement("div");
    ctrl.className = "bq-dm-ctrl";
    ctrl.innerHTML =
      `<button type="button" class="bq-dm-play" aria-label="Reproducir ${titulo}">${ICO_PLAY}</button>` +
      `<span class="bq-dm-tiempo">0:00 / ${mmss(total)}</span><span class="bq-dm-barra"><i></i></span>` +
      `<button type="button" class="bq-dm-otra" aria-label="Volver a empezar ${titulo}">${ICO_OTRA}</button>`;
    video.appendChild(ctrl);
    const boton = ctrl.querySelector(".bq-dm-play");
    const tiempo = ctrl.querySelector(".bq-dm-tiempo");
    const barra = ctrl.querySelector(".bq-dm-barra i");
    const items = [...video.querySelectorAll("[data-en]")];
    const marcas = [...video.querySelectorAll("[data-marca]")];
    const fases = [...video.querySelectorAll(".bq-dm-fases li")];
    const escribir = [...video.querySelectorAll("[data-escribe]")];
    for (const el of escribir) el.dataset.texto = el.textContent;
    const anim = barra.animate([{ transform: "scaleX(0)" }, { transform: "scaleX(1)" }], { duration: total, fill: "both" });
    anim.pause();
    let paso = -1;
    let visible = false;
    let pausadaPorUsuario = false;
    const tecleos = new Map();
    const pararTecleos = () => {
      for (const id of tecleos.values()) clearInterval(id);
      tecleos.clear();
    };
    const teclear = (el) => {
      const texto = el.dataset.texto;
      if (reduceMotion.matches) return (el.textContent = texto);
      let n = Number(el.dataset.n || 0);
      el.classList.add("bq-tecleando");
      const id = setInterval(() => {
        n += 1;
        el.dataset.n = String(n);
        el.textContent = texto.slice(0, n);
        if (n >= texto.length) {
          clearInterval(id);
          tecleos.delete(el);
          el.classList.remove("bq-tecleando");
        }
      }, Math.max(18, Math.min(55, 900 / texto.length)));
      tecleos.set(el, id);
    };
    const aplicar = (k) => {
      if (k === paso) return;
      const atras = k < paso;
      paso = k;
      video.dataset.paso = String(k);
      for (const el of items) {
        const fuera = Boolean(el.dataset.hasta) && k >= Number(el.dataset.hasta);
        el.classList.toggle("on", k >= Number(el.dataset.en) && !fuera);
        el.classList.toggle("fuera", fuera);
      }
      for (const el of marcas) el.classList.toggle("marcado", k >= Number(el.dataset.marca));
      let actual = -1;
      fases.forEach((li, i) => {
        if (k >= Number(li.dataset.desde)) actual = i;
      });
      fases.forEach((li, i) => {
        li.classList.toggle("activa", i === actual);
        li.classList.toggle("hecha", i < actual);
      });
      for (const el of escribir) {
        const visibleEl = el.classList.contains("on") || !el.hasAttribute("data-en");
        const tocaEscribir = el.closest("[data-en]") ? el.closest("[data-en]").classList.contains("on") : true;
        if (atras || !visibleEl || !tocaEscribir) {
          if (tecleos.has(el)) {
            clearInterval(tecleos.get(el));
            tecleos.delete(el);
          }
          if (atras || !tocaEscribir) {
            el.dataset.n = "0";
            el.textContent = "";
          }
          continue;
        }
        if (Number(el.dataset.n || 0) < el.dataset.texto.length && !tecleos.has(el)) teclear(el);
      }
    };
    const pasoEn = (ms) => {
      let k = 0;
      for (let i = 0; i < inicio.length; i++) if (ms >= inicio[i]) k = i + 1;
      return k;
    };
    const ponerBoton = (reproduce) => {
      boton.innerHTML = reproduce ? ICO_PAUSA : ICO_PLAY;
      boton.setAttribute("aria-label", `${reproduce ? "Pausar" : "Reproducir"} ${titulo}`);
      video.classList.toggle("reproduce", reproduce);
    };
    const estado = {
      tick() {
        const ms = anim.currentTime || 0;
        aplicar(pasoEn(ms));
        tiempo.textContent = `${mmss(ms)} / ${mmss(total)}`;
      },
    };
    // Para revisar la demostración en un momento concreto (pruebas): video.bqIr(ms).
    video.bqIr = (ms) => {
      anim.currentTime = ms;
      paso = -1;
      estado.tick();
    };
    const reproducir = () => {
      if (anim.playState === "finished") reiniciar(false);
      // Los tecleos a medias siguen donde se quedaron.
      paso = -1;
      estado.tick();
      anim.play();
      ponerBoton(true);
      demosActivas.add(estado);
      if (!relojDemos) relojDemos = setInterval(tickDemos, 150);
    };
    const pausar = () => {
      anim.pause();
      pararTecleos();
      for (const el of escribir) el.classList.remove("bq-tecleando");
      ponerBoton(false);
      demosActivas.delete(estado);
    };
    const reiniciar = (seguir) => {
      pararTecleos();
      for (const el of escribir) {
        el.dataset.n = "0";
        el.textContent = "";
      }
      anim.currentTime = 0;
      aplicar(0);
      tiempo.textContent = `0:00 / ${mmss(total)}`;
      if (seguir) reproducir();
    };
    // Al acabar: un momento con el resultado a la vista, fundido y otra vez desde el principio.
    anim.onfinish = () => {
      demosActivas.delete(estado);
      estado.tick();
      ponerBoton(false);
      if (pausadaPorUsuario || !visible || reduceMotion.matches) return;
      video.classList.add("bq-dm-fundido");
      setTimeout(() => {
        video.classList.remove("bq-dm-fundido");
        if (visible && !pausadaPorUsuario && !document.hidden) reiniciar(true);
      }, 450);
    };
    const decidir = () => {
      const debe = visible && !pausadaPorUsuario && !document.hidden && !reduceMotion.matches;
      if (debe && anim.playState !== "running") reproducir();
      else if (!debe && anim.playState === "running") pausar();
    };
    boton.addEventListener("click", () => {
      if (anim.playState === "running") {
        pausadaPorUsuario = true;
        pausar();
      } else {
        pausadaPorUsuario = false;
        reproducir();
      }
    });
    ctrl.querySelector(".bq-dm-otra").addEventListener("click", () => {
      pausadaPorUsuario = false;
      reiniciar(true);
    });
    // Clic en la propia demostración = pausa / sigue, como en un vídeo.
    video.querySelector(".bq-dm-escena").addEventListener("click", () => boton.click());
    new IntersectionObserver(([entrada]) => {
      visible = entrada.isIntersecting;
      decidir();
    }, { threshold: 0.45 }).observe(video);
    document.addEventListener("visibilitychange", decidir);
    reduceMotion.addEventListener("change", decidir);
    // Estado inicial: en blanco para empezar a contar la historia; con «reducir movimiento», el
    // resultado final.
    if (reduceMotion.matches) {
      anim.currentTime = total;
      aplicar(pasos.length);
      for (const el of escribir) el.textContent = el.dataset.texto;
      tiempo.textContent = `${mmss(total)} / ${mmss(total)}`;
    } else aplicar(0);
  };
  const montarDemos = () => document.querySelectorAll(".bq-dm-video:not([data-bq-listo])").forEach(montarDemo);

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
    // Los avisos los pone la validación propia (debajo de cada campo), no el navegador.
    form.noValidate = true;
    form.dataset.bqInicio = String(Date.now());
    form.addEventListener("input", (event) => {
      if (event.target.matches && event.target.matches("[aria-invalid]")) desmarcar(event.target);
    });
    selector.addEventListener("change", () => {
      for (const input of form.querySelectorAll("[aria-invalid]")) desmarcar(input);
    });
  };
  // ---------------------------------------------------------------------------------------------
  // Validación del formulario de contacto, con el error debajo de cada campo, y estado del envío
  // (enviando, recibido o error) debajo del botón. Corre antes que Framer: si hay errores, o si ya
  // hay un envío en curso, Framer no llega a enviar nada.
  // ---------------------------------------------------------------------------------------------
  const TEXTOS = {
    Name: "Escribe tu nombre.",
    Company: "Escribe el nombre de tu empresa.",
    Message: "Cuéntanos qué te gustaría mejorar.",
    Phone: "Escribe tu número de WhatsApp.",
    PhoneMal34: "Revisa el número: en España son 9 cifras (por ejemplo, 612 345 678).",
    PhoneMal: "Revisa el número de teléfono (sin el prefijo del país).",
    Email: "Escribe tu correo electrónico.",
    EmailMal: "Revisa el correo: parece incompleto (por ejemplo, nombre@empresa.com).",
  };
  const DEL_SERVIDOR = { name: "Name", company: "Company", message: "Message", phone: "Phone", email: "Email" };
  const campo = (form, nombre) => form.querySelector(`[name="${nombre}"]`);
  const errorDe = (input, crear) => {
    const caja = input.closest("label") || input;
    let error = caja.nextElementSibling;
    if (error && error.classList.contains("bq-error")) return error;
    if (!crear) return null;
    error = document.createElement("p");
    error.className = "bq-error";
    error.id = `bq-error-${input.name}`;
    error.setAttribute("role", "alert");
    caja.after(error);
    return error;
  };
  const marcar = (input, texto) => {
    const caja = input.closest("label") || input;
    errorDe(input, true).textContent = texto;
    caja.dataset.bqInvalido = "1";
    input.setAttribute("aria-invalid", "true");
    input.setAttribute("aria-describedby", `bq-error-${input.name}`);
  };
  const desmarcar = (input) => {
    const caja = input.closest("label") || input;
    const error = errorDe(input, false);
    if (error) error.remove();
    delete caja.dataset.bqInvalido;
    input.removeAttribute("aria-invalid");
    input.removeAttribute("aria-describedby");
  };
  const validar = (form) => {
    const errores = [];
    const whatsapp = form.dataset.bqMetodo !== "email";
    for (const nombre of ["Name", "Company"]) {
      const input = campo(form, nombre);
      if (input && !input.value.trim()) errores.push([input, TEXTOS[nombre]]);
    }
    if (whatsapp) {
      const tel = campo(form, "Phone");
      const prefijo = (campo(form, "PhonePrefix") || {}).value || "34";
      const cifras = tel ? tel.value.replace(/\D/g, "").replace(prefijo === "39" ? /^$/ : /^0+/, "") : "";
      if (tel && !cifras) errores.push([tel, TEXTOS.Phone]);
      else if (tel && prefijo === "34" && !/^[6-9]\d{8}$/.test(cifras)) errores.push([tel, TEXTOS.PhoneMal34]);
      else if (tel && (cifras.length < 6 || cifras.length + prefijo.length > 15)) errores.push([tel, TEXTOS.PhoneMal]);
    } else {
      const email = campo(form, "Email");
      const valor = email ? email.value.trim() : "";
      if (email && !valor) errores.push([email, TEXTOS.Email]);
      else if (email && !/^[^\s@]+@[^\s@.]+(\.[^\s@.]+)*\.[a-z]{2,}$/i.test(valor)) errores.push([email, TEXTOS.EmailMal]);
    }
    const mensaje = form.querySelector('textarea[name="Message"], [name="Message"]');
    if (mensaje && !mensaje.value.trim()) errores.push([mensaje, TEXTOS.Message]);
    return errores;
  };
  const marcarErroresServidor = (form, fields) => {
    for (const [clave, texto] of Object.entries(fields)) {
      const input = DEL_SERVIDOR[clave] && campo(form, DEL_SERVIDOR[clave]);
      if (input) marcar(input, texto);
    }
  };
  const estadoDe = (form) => {
    let estado = form.querySelector(".bq-estado");
    if (estado) return estado;
    const boton = form.querySelector('[type="submit"]');
    const fila = boton && [...form.children].find((c) => c.contains(boton));
    estado = document.createElement("p");
    estado.className = "bq-estado";
    estado.setAttribute("aria-live", "polite");
    (fila || form.lastElementChild).after(estado);
    return estado;
  };
  const mostrarEstado = (form, tipo, texto) => {
    const estado = estadoDe(form);
    estado.dataset.tipo = tipo;
    estado.textContent = texto;
  };
  function terminarEnvio(form, tipo, texto) {
    if (!form) return;
    delete form.dataset.bqEnviando;
    clearTimeout(Number(form.dataset.bqGuarda || 0));
    if (envio && envio.form === form) envio = null;
    mostrarEstado(form, tipo, texto);
  }
  document.addEventListener(
    "submit",
    (event) => {
      const form = event.target;
      if (!(form instanceof HTMLFormElement) || !form.dataset.bqContacto) return;
      const parar = () => {
        event.preventDefault();
        event.stopImmediatePropagation();
      };
      // Un envío a la vez: los clics repetidos mientras se envía no hacen nada.
      if (form.dataset.bqEnviando) return parar();
      for (const input of form.querySelectorAll("[aria-invalid]")) desmarcar(input);
      const errores = validar(form);
      if (errores.length) {
        parar();
        for (const [input, texto] of errores) marcar(input, texto);
        errores[0][0].focus({ preventScroll: false });
        mostrarEstado(form, "error", errores.length > 1 ? "Revisa los campos marcados." : "Revisa el campo marcado.");
        return;
      }
      form.dataset.bqEnviando = "1";
      envio = { form };
      mostrarEstado(form, "enviando", "Enviando tu solicitud…");
      // Reintento tras un error: lo envía este script (Framer ya no lo haría).
      if (form.dataset.bqFallo) {
        parar();
        enviarSolicitud(Object.fromEntries(new FormData(form).entries()), form).catch(() => {});
      }
      // Si en 30 s no hubiera respuesta, se libera el formulario para poder reintentar.
      form.dataset.bqGuarda = String(setTimeout(() => {
        if (form.dataset.bqEnviando) terminarEnvio(form, "error", "No hemos podido confirmar el envío. Inténtalo de nuevo.");
      }, 30000));
    },
    true,
  );

  function enlazarDiagnostico(root) {
    const links = root.querySelectorAll ? root.querySelectorAll("a") : [];
    for (const link of links) {
      if (/^(?:solicitar diagn[oó]stico|realizar diagn[oó]stico avanzado|quiero mejorar)(?:\s*(?:solicitar diagn[oó]stico|realizar diagn[oó]stico avanzado|quiero mejorar))?$/i.test(link.textContent.trim())) link.setAttribute("href", "/diagnostico");
    }
  }
  // Respaldo para las variantes de Framer al cambiar de página o de tamaño. «Quiero mejorar» abre la
  // ventana con las dos opciones (contar su idea o hacer el diagnóstico avanzado); «Solicitar
  // diagnóstico» y «Realizar diagnóstico avanzado» (botón de la tarjeta «Primero entendemos cómo
  // trabajas») van directo al cuestionario. El enlace sigue apuntando a /diagnostico (sin JS, o
  // abierto en otra pestaña con Cmd/Ctrl).
  document.addEventListener("click", event => {
    const link = event.target.closest?.("a");
    if (link && /^(?:solicitar diagn[oó]stico|realizar diagn[oó]stico avanzado|quiero mejorar)(?:\s*(?:solicitar diagn[oó]stico|realizar diagn[oó]stico avanzado|quiero mejorar))?$/i.test(link.textContent.trim())) {
      link.setAttribute("href", "/diagnostico");
      if (!event.ctrlKey && !event.metaKey && !event.shiftKey && event.button === 0) {
        event.preventDefault(); event.stopImmediatePropagation();
        if (/^quiero mejorar/i.test(link.textContent.trim())) abrirMejorar(link);
        else window.location.assign("/diagnostico");
      }
    }
  }, true);
  const scanForms = () => {
    document.querySelectorAll("form:not([data-bq-contacto]):not([data-bq-propio])").forEach(enhanceContactForm);
    anclaPie();
    enlazarDiagnostico(document);
  };
  // En cuanto Framer monta un formulario o una tarjeta con demo (al cargar, al cambiar de página o
  // al rehacer la página en móvil), antes de que se pinte: solo se miran los nodos recién añadidos.
  new MutationObserver((mutations) => {
    let forms = false;
    let cards = false;
    let demos = false;
    for (const mutation of mutations) {
      for (const node of mutation.addedNodes) {
        if (node.nodeType !== 1) continue;
        enlazarDiagnostico(node);
        if (node.tagName === "A" && /^(?:solicitar diagn[oó]stico|realizar diagn[oó]stico avanzado|quiero mejorar)(?:\s*(?:solicitar diagn[oó]stico|realizar diagn[oó]stico avanzado|quiero mejorar))?$/i.test(node.textContent.trim())) node.setAttribute("href", "/diagnostico");
        forms = forms || node.tagName === "FORM" || !!node.querySelector("form");
        cards = cards || (!!DEMO_IMG && (node.matches(DEMO_IMG) || !!node.querySelector(DEMO_IMG)));
        demos = demos || node.classList.contains("bq-demos") || !!node.querySelector(".bq-dm-video");
      }
    }
    if (forms) scanForms();
    if (cards) scanDemos();
    if (demos) montarDemos();
  }).observe(document.documentElement, { childList: true, subtree: true });
  scanForms();
  scanDemos();
  montarDemos();

  setInterval(scanTickers, 1500);
  window.addEventListener("load", scanTickers);
  // Framer reanuda sus tiras al volver a la pestaña; después se vuelve a pausar lo que no se ve.
  document.addEventListener("visibilitychange", () => setTimeout(scanTickers, 0));
  reduceMotion.addEventListener("change", scanTickers);


  // ---------------------------------------------------------------------------------------------
  // Formulario del pie como destino de «Hablemos», «Solicitar diagnóstico» y «Cuéntanos tu caso»
  // (ya no hay página de contacto): enlaces a #hablemos. Baja suave hasta el formulario de la misma
  // página; con ratón, deja el cursor en el primer campo (en el móvil no, para no abrir el teclado).
  // ---------------------------------------------------------------------------------------------
  function anclaPie() {
    const caja = document.querySelector(".framer-cc1k0w-container");
    if (caja && !caja.id) caja.id = "hablemos";
    return caja;
  }
  const irAlFormulario = (suave) => {
    const caja = anclaPie();
    if (!caja) return false;
    caja.scrollIntoView({ behavior: suave && !reduceMotion.matches ? "smooth" : "auto", block: "start" });
    if (conRaton.matches) {
      const primero = caja.querySelector("input:not([type=hidden]):not([type=radio]):not(:disabled), textarea");
      if (primero) setTimeout(() => primero.focus({ preventScroll: true }), suave ? 650 : 0);
    }
    return true;
  };

  // ---------------------------------------------------------------------------------------------
  // Fórmula Banteq: ventana con la oferta y un formulario mínimo (empresa, web actual, cuota
  // mensual actual y WhatsApp o correo). Se abre desde los botones «Fórmula Banteq» (enlaces a #formula-banteq, en
  // la sección Desarrollo web de la home y en /desarrollo-web) o con esa dirección. Se envía a
  // /api/leads como «Fórmula Banteq». Condiciones (contenido.py → FORMULA_*, y el apartado 5 del
  // aviso legal): remodelación gratuita de una web informativa básica; cuota de mantenimiento con un
  // 25 % de descuento sobre la actual, hasta 50 €/mes, y nunca por debajo de 35 €/mes. Sin IVA.
  // ---------------------------------------------------------------------------------------------
  const ICONO_CERRAR = '<svg viewBox="0 0 20 20" aria-hidden="true" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round"><path d="M5 5l10 10M15 5 5 15"/></svg>';
  const ICONO_OK = '<svg viewBox="0 0 24 24" aria-hidden="true" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="m5 12.5 4.5 4.5L19 7.5"/></svg>';
  const FORMULA_HTML =
    '<div class="bq-fx-panel">' +
    `<button type="button" class="bq-fx-cerrar" aria-label="Cerrar">${ICONO_CERRAR}</button>` +
    '<div class="bq-fx-contenido">' +
    '<section class="bq-fx-oferta">' +
    '<p class="bq-fx-sello">Fórmula Banteq</p>' +
    '<h2 class="bq-fx-titulo" id="bq-fx-titulo">Tu web, renovada. <span>Tú solo contratas su mantenimiento.</span></h2>' +
    '<p class="bq-fx-intro">Remodelamos tu web sin coste de desarrollo básico al contratar nuestro mantenimiento. Ahorra un 25 % de tu cuota actual, hasta 50 €/mes, con una cuota mínima de 35 €/mes.</p>' +
    '<ul class="bq-fx-cifras">' +
    '<li><strong>0 €</strong><span>de desarrollo en tu web informativa</span></li>' +
    '<li><strong>25 %</strong><span>menos que tu cuota actual</span></li>' +
    '<li><strong><small>hasta</small> 50 €</strong><span>de ahorro al mes</span></li>' +
    "</ul>" +
    '<button type="button" class="bq-fx-ir">Pedir mi propuesta</button>' +
    '<ol class="bq-fx-pasos">' +
    "<li><b>Nos dices cuánto pagas hoy</b> por el mantenimiento de tu web.</li>" +
    "<li><b>En menos de 48 h</b> te enviamos la propuesta de tu web remodelada y la oferta de mantenimiento.</li>" +
    "<li><b>Si te convence,</b> dejamos por escrito qué incluye y renovamos tu web.</li>" +
    "</ol>" +
    '<p class="bq-fx-letra">La remodelación gratuita incluye una web informativa básica con formulario de contacto; las funcionalidades adicionales se presupuestan aparte. Importes sin IVA. <a href="/aviso-legal">Condiciones completas</a></p>' +
    "</section>" +
    '<section class="bq-fx-pedir" aria-labelledby="bq-fx-pedir-titulo">' +
    '<div class="bq-fx-formulario">' +
    '<h3 class="bq-fx-subtitulo" id="bq-fx-pedir-titulo">Pide tu propuesta</h3>' +
    '<p class="bq-fx-nota">Cuatro datos y te respondemos en menos de 48 h.</p>' +
    '<form class="bq-fx-form" data-bq-propio="formula" novalidate>' +
    '<div class="bq-fx-campo"><label for="bq-fx-empresa">Empresa</label>' +
    '<input id="bq-fx-empresa" name="company" type="text" autocomplete="organization" maxlength="160" placeholder="Nombre de tu empresa"></div>' +
    '<div class="bq-fx-campo"><label for="bq-fx-web">Tu web actual</label>' +
    '<input id="bq-fx-web" name="currentWebsite" type="text" inputmode="url" autocomplete="url" autocapitalize="off" spellcheck="false" maxlength="300" placeholder="tuempresa.com"></div>' +
    '<div class="bq-fx-campo"><label for="bq-fx-cuota">¿Cuánto pagas al mes por el mantenimiento de tu web? (sin IVA)</label>' +
    '<div class="bq-fx-caja bq-fx-euros"><input id="bq-fx-cuota" name="monthlyFee" type="text" inputmode="decimal" autocomplete="off" maxlength="12" placeholder="Por ejemplo, 120"><span aria-hidden="true">€/mes</span></div>' +
    '<p class="bq-fx-ahorro" aria-live="polite"></p></div>' +
    '<div class="bq-fx-campo"><span class="bq-fx-etiqueta" id="bq-fx-metodo-etiqueta">¿Por dónde te enviamos la propuesta?</span>' +
    '<div class="bq-metodo" role="radiogroup" aria-labelledby="bq-fx-metodo-etiqueta">' +
    '<label class="bq-metodo-opcion"><input type="radio" name="ContactMethod" value="whatsapp" checked>' +
    `<span class="bq-metodo-cara">${ICONO_WHATSAPP}<span>WhatsApp</span></span><span class="bq-metodo-sello">Recomendado</span></label>` +
    '<label class="bq-metodo-opcion"><input type="radio" name="ContactMethod" value="email">' +
    `<span class="bq-metodo-cara">${ICONO_CORREO}<span>Correo electrónico</span></span></label></div></div>` +
    '<div class="bq-fx-campo" data-bq-campo="tel"><label class="bq-fx-caja bq-fx-tel">' +
    '<input name="Phone" type="tel" inputmode="tel" autocomplete="tel-national" placeholder="Número de WhatsApp" aria-label="Número de WhatsApp">' +
    `<span class="bq-prefijo"><span class="bq-prefijo-valor">+34</span>${FLECHA}<select name="PhonePrefix" aria-label="Prefijo del país"></select></span></label></div>` +
    '<div class="bq-fx-campo" data-bq-campo="email"><input name="Email" type="email" autocomplete="email" maxlength="254" placeholder="Tu correo electrónico" aria-label="Correo electrónico"></div>' +
    '<input class="bq-fx-trampa" name="website" type="text" tabindex="-1" autocomplete="off" aria-hidden="true">' +
    '<button type="submit" class="bq-fx-enviar">Quiero mi propuesta</button>' +
    '<p class="bq-fx-estado" aria-live="polite"></p>' +
    '<p class="bq-fx-legal">Usaremos estos datos solo para preparar y enviarte la propuesta. <a href="/privacidad">Política de privacidad</a></p>' +
    "</form></div>" +
    '<div class="bq-fx-hecho" hidden tabindex="-1">' +
    `<span class="bq-fx-hecho-icono">${ICONO_OK}</span>` +
    '<h3 class="bq-fx-subtitulo">Solicitud recibida</h3>' +
    '<p class="bq-fx-hecho-texto"></p>' +
    '<button type="button" class="bq-fx-enviar bq-fx-listo">Cerrar</button>' +
    "</div></section></div></div>";

  const FX_TEXTOS = {
    company: "Escribe el nombre de tu empresa.",
    web: "Escribe la dirección de tu web actual.",
    webMal: "Revisa la dirección: por ejemplo, tuempresa.com.",
    cuota: "Indica cuánto pagas al mes, aunque sea aproximado.",
    cuotaMal: "Escribe el importe en euros, por ejemplo 120.",
  };
  // «120», «120,50», «1.200», «1.200,50 €» → número (o NaN).
  const leerEuros = (texto) => {
    let v = String(texto || "").replace(/[\s€]/g, "").replace(/(eur(os)?|\/mes|al?mes)$/i, "");
    if (!v) return NaN;
    if (v.includes(",") && v.includes(".")) v = v.replace(/\./g, "").replace(",", ".");
    else if (v.includes(",")) v = v.replace(",", ".");
    else if (/^\d{1,3}(\.\d{3})+$/.test(v)) v = v.replace(/\./g, "");
    return /^\d+(\.\d{1,2})?$/.test(v) ? Number(v) : NaN;
  };
  // «tuempresa.com», «www.tuempresa.com/inicio» o con https:// → «https://…» (o "" si no parece una web).
  const leerWeb = (texto) => {
    let v = String(texto || "").trim().replace(/\s+/g, "");
    if (!v) return "";
    if (!/^https?:\/\//i.test(v)) v = "https://" + v.replace(/^\/+/, "");
    try {
      const u = new URL(v);
      return /^[a-z0-9-]+(\.[a-z0-9-]+)*\.[a-z]{2,}$/i.test(u.hostname) ? u.href : "";
    } catch {
      return "";
    }
  };
  const euros = (n) => {
    const r = Math.round(n * 100) / 100;
    return new Intl.NumberFormat("es-ES", { minimumFractionDigits: r % 1 ? 2 : 0, maximumFractionDigits: 2 }).format(r);
  };
  // Descuento de la Fórmula: el menor de 25 % de la cuota actual, 50 €/mes y lo que pase de 35 €/mes.
  const FX_DESCUENTO = 0.25;
  const FX_AHORRO_MAX = 50;
  const FX_CUOTA_MIN = 35;
  const cuotaFormula = (actual) => {
    const rebaja = Math.max(0, Math.min(actual * FX_DESCUENTO, FX_AHORRO_MAX, actual - FX_CUOTA_MIN));
    return { nueva: Math.max(actual - rebaja, FX_CUOTA_MIN), rebaja };
  };

  let formula = null; // { dialog, form, … } una vez montada
  let formulaOrigen = null; // botón que la abrió (vuelve ahí el foco al cerrar)

  const montarFormula = () => {
    if (formula) return formula;
    const dialog = document.createElement("dialog");
    dialog.className = "bq-fx";
    dialog.setAttribute("aria-labelledby", "bq-fx-titulo");
    dialog.innerHTML = FORMULA_HTML;
    document.body.appendChild(dialog);
    const form = dialog.querySelector("form");
    const select = form.querySelector('select[name="PhonePrefix"]');
    for (const item of PREFIJOS.split(",")) {
      const [country, code] = item.split("|");
      select.add(new Option(`${country} (+${code})`, code, code === "34", code === "34"));
    }
    const cuota = form.querySelector('[name="monthlyFee"]');
    const ahorro = form.querySelector(".bq-fx-ahorro");
    const hecho = dialog.querySelector(".bq-fx-hecho");
    const caja = dialog.querySelector(".bq-fx-formulario");
    const sync = () => {
      const whatsapp = (form.querySelector('input[name="ContactMethod"]:checked') || {}).value !== "email";
      form.dataset.bqMetodo = whatsapp ? "whatsapp" : "email";
      form.querySelector(".bq-prefijo-valor").textContent = `+${select.value}`;
    };
    // Cuota orientativa con Banteq según lo que paga hoy (se confirma al revisar su mantenimiento).
    const calcular = () => {
      const n = leerEuros(cuota.value);
      ahorro.dataset.tipo = "";
      if (!cuota.value.trim() || !(n > 0)) ahorro.textContent = "";
      else {
        const { nueva, rebaja } = cuotaFormula(n);
        if (rebaja > 0) {
          if (rebaja >= FX_AHORRO_MAX) ahorro.dataset.tipo = "max";
          ahorro.innerHTML = `Con ${euros(n)} €/mes, tu cuota con Banteq sería de <b>${euros(nueva)} €/mes</b>: ${euros(rebaja)} € menos al mes. Te la confirmamos al revisar tu mantenimiento actual.`;
        } else ahorro.textContent = `La cuota mínima de mantenimiento con Banteq es de ${FX_CUOTA_MIN} €/mes, así que con ${euros(n)} €/mes no habría descuento.`;
      }
    };
    form.addEventListener("change", sync);
    cuota.addEventListener("input", calcular);
    form.addEventListener("input", (event) => {
      if (event.target.matches && event.target.matches("[aria-invalid]")) fxDesmarcar(event.target);
    });
    form.querySelector(".bq-metodo").addEventListener("change", () => {
      for (const input of form.querySelectorAll("[aria-invalid]")) fxDesmarcar(input);
    });
    form.addEventListener("submit", (event) => {
      event.preventDefault();
      enviarFormula();
    });
    dialog.querySelector(".bq-fx-cerrar").addEventListener("click", () => cerrarFormula());
    dialog.querySelector(".bq-fx-listo").addEventListener("click", () => cerrarFormula());
    // Móvil: la oferta va primero y el formulario debajo; este botón baja hasta él.
    dialog.querySelector(".bq-fx-ir").addEventListener("click", () => {
      dialog.querySelector(".bq-fx-pedir").scrollIntoView({ behavior: reduceMotion.matches ? "auto" : "smooth", block: "start" });
    });
    // Clic fuera del panel (en el fondo oscurecido) = cerrar. Esc lo gestiona el navegador.
    dialog.addEventListener("click", (event) => {
      if (event.target === dialog) cerrarFormula();
    });
    dialog.addEventListener("cancel", (event) => {
      event.preventDefault();
      cerrarFormula();
    });
    dialog.addEventListener("close", () => {
      document.documentElement.classList.remove("bq-fx-abierta");
      if (location.hash === "#formula-banteq") history.replaceState(history.state, "", location.pathname + location.search);
      if (formulaOrigen && formulaOrigen.isConnected) formulaOrigen.focus({ preventScroll: true });
      formulaOrigen = null;
    });
    sync();
    formula = { dialog, form, ahorro, hecho, caja, enviando: false, enviado: "", inicio: 0 };
    return formula;
  };

  const abrirFormula = (origen) => {
    const f = montarFormula();
    if (f.dialog.open) return;
    formulaOrigen = origen || null;
    if (!f.inicio) f.inicio = Date.now();
    f.dialog.classList.remove("bq-fx-cerrando");
    document.documentElement.classList.add("bq-fx-abierta");
    f.dialog.showModal();
    // El foco va al panel (no a un campo: en el móvil abriría el teclado tapando la oferta).
    f.dialog.querySelector(".bq-fx-contenido").scrollTop = 0;
    f.dialog.querySelector(".bq-fx-cerrar").focus({ preventScroll: true });
  };
  const cerrarFormula = () => {
    if (!formula || !formula.dialog.open) return;
    const { dialog } = formula;
    if (reduceMotion.matches) return dialog.close();
    dialog.classList.add("bq-fx-cerrando");
    setTimeout(() => {
      dialog.classList.remove("bq-fx-cerrando");
      dialog.close();
    }, 180);
  };

  // Una id por ventana: las dos tienen campos «Phone» y «Email».
  const fxErrorId = (input) => `bq-${input.closest(".bq-qm") ? "qm" : "fx"}-error-${input.name}`;
  const fxError = (input, crear) => {
    const campo = input.closest(".bq-fx-campo");
    let error = campo && campo.querySelector(".bq-error");
    if (error || !crear || !campo) return error;
    error = document.createElement("p");
    error.className = "bq-error";
    error.id = fxErrorId(input);
    error.setAttribute("role", "alert");
    campo.appendChild(error);
    return error;
  };
  const fxMarcar = (input, texto) => {
    fxError(input, true).textContent = texto;
    input.setAttribute("aria-invalid", "true");
    input.setAttribute("aria-describedby", fxErrorId(input));
  };
  const fxDesmarcar = (input) => {
    const error = fxError(input, false);
    if (error) error.remove();
    input.removeAttribute("aria-invalid");
    input.removeAttribute("aria-describedby");
  };
  const fxEstado = (tipo, texto) => {
    const estado = formula.form.querySelector(".bq-fx-estado");
    estado.dataset.tipo = tipo;
    estado.textContent = texto;
  };

  const enviarFormula = () => {
    const f = formula;
    const { form } = f;
    if (f.enviando) return;
    for (const input of form.querySelectorAll("[aria-invalid]")) fxDesmarcar(input);
    const errores = [];
    const company = form.querySelector('[name="company"]');
    const cuota = form.querySelector('[name="monthlyFee"]');
    const tel = form.querySelector('[name="Phone"]');
    const email = form.querySelector('[name="Email"]');
    const prefijo = form.querySelector('[name="PhonePrefix"]').value || "34";
    const whatsapp = form.dataset.bqMetodo !== "email";
    if (!company.value.trim()) errores.push([company, FX_TEXTOS.company]);
    const webInput = form.querySelector('[name="currentWebsite"]');
    const web = leerWeb(webInput.value);
    if (!webInput.value.trim()) errores.push([webInput, FX_TEXTOS.web]);
    else if (!web) errores.push([webInput, FX_TEXTOS.webMal]);
    const importe = leerEuros(cuota.value);
    if (!cuota.value.trim()) errores.push([cuota, FX_TEXTOS.cuota]);
    else if (!(importe > 0) || importe > 100000) errores.push([cuota, FX_TEXTOS.cuotaMal]);
    let cifras = "";
    if (whatsapp) {
      cifras = tel.value.replace(/\D/g, "");
      if (prefijo !== "39") cifras = cifras.replace(/^0+/, "");
      if (!cifras) errores.push([tel, TEXTOS.Phone]);
      else if (prefijo === "34" && !/^[6-9]\d{8}$/.test(cifras)) errores.push([tel, TEXTOS.PhoneMal34]);
      else if (cifras.length < 6 || cifras.length + prefijo.length > 15) errores.push([tel, TEXTOS.PhoneMal]);
    } else {
      const valor = email.value.trim();
      if (!valor) errores.push([email, TEXTOS.Email]);
      else if (!/^[^\s@]+@[^\s@.]+(\.[^\s@.]+)*\.[a-z]{2,}$/i.test(valor)) errores.push([email, TEXTOS.EmailMal]);
    }
    if (errores.length) {
      for (const [input, texto] of errores) fxMarcar(input, texto);
      errores[0][0].focus();
      fxEstado("error", errores.length > 1 ? "Revisa los campos marcados." : "Revisa el campo marcado.");
      return;
    }
    const payload = {
      formType: "Fórmula Banteq",
      origin: window.location.pathname,
      company: company.value.trim(),
      currentWebsite: web,
      monthlyFee: importe,
      contactPreference: whatsapp ? "WhatsApp" : "Correo electrónico",
      phone: whatsapp ? `+${prefijo}${cifras}` : "",
      email: whatsapp ? "" : email.value.trim(),
    };
    const clave = JSON.stringify(payload);
    const destino = whatsapp ? `por WhatsApp al ${payload.phone}` : `a ${payload.email}`;
    const terminar = (confirmacion) => {
      f.caja.hidden = true;
      f.hecho.hidden = false;
      f.hecho.querySelector(".bq-fx-hecho-texto").textContent =
        `Te responderemos en menos de 48 h ${destino} con la propuesta de tu web remodelada y la oferta de mantenimiento.` +
        (confirmacion ? " Te hemos enviado una confirmación a tu correo." : "");
      f.hecho.focus({ preventScroll: true });
    };
    // La misma solicitud ya llegó: no se envía otra vez.
    if (f.enviado === clave) return terminar(false);
    payload.page = window.location.href;
    payload.pageTitle = document.title;
    payload.elapsedMs = Date.now() - f.inicio;
    payload.hp = form.querySelector('[name="website"]').value;
    f.enviando = true;
    form.dataset.bqEnviando = "1";
    fxEstado("enviando", "Enviando tu solicitud…");
    const guarda = setTimeout(() => {
      if (!f.enviando) return;
      f.enviando = false;
      delete form.dataset.bqEnviando;
      fxEstado("error", "No hemos podido confirmar el envío. Inténtalo de nuevo.");
    }, 30000);
    nativeFetch("/api/leads", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(payload) })
      .then(async (res) => {
        let data = {};
        try {
          data = await res.json();
        } catch {}
        return { res, data };
      })
      .then(
        ({ res, data }) => {
          clearTimeout(guarda);
          f.enviando = false;
          delete form.dataset.bqEnviando;
          if (res.ok && data.ok) {
            f.enviado = clave;
            fxEstado("ok", "");
            return terminar(Boolean(data.confirmation));
          }
          const campos = { company: "company", currentWebsite: "currentWebsite", monthlyFee: "monthlyFee", phone: "Phone", email: "Email" };
          for (const [k, texto] of Object.entries(data.fields || {})) {
            const input = campos[k] && form.querySelector(`[name="${campos[k]}"]`);
            if (input) fxMarcar(input, texto);
          }
          fxEstado("error", data.code === "validation" || data.code === "rate_limit"
            ? data.error
            : "No hemos podido enviar tu solicitud. Inténtalo de nuevo en unos minutos.");
        },
        () => {
          clearTimeout(guarda);
          f.enviando = false;
          delete form.dataset.bqEnviando;
          fxEstado("error", "No hemos podido enviar tu solicitud. Revisa tu conexión e inténtalo de nuevo.");
        },
      );
  };

  // ---------------------------------------------------------------------------------------------
  // «Quiero mejorar»: ventana con dos opciones. Arriba, la rápida: contar la idea con texto libre y
  // dejar nombre, empresa y WhatsApp o correo (se envía a /api/leads como «Idea de mejora», aparte
  // de los diagnósticos). Debajo, destacada, la de más valor: el diagnóstico avanzado (de pago), que
  // lleva al cuestionario de /diagnostico sin cambiarlo. Se abre desde los botones «Quiero mejorar»
  // (home) o con la dirección …#quiero-mejorar. Mismo armazón y estilos que la de la Fórmula.
  // ---------------------------------------------------------------------------------------------
  const ICONO_PUNTO = '<svg viewBox="0 0 16 16" aria-hidden="true" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round"><path d="m3.5 8.5 3 3 6-7"/></svg>';
  const MEJORAR_HTML =
    '<div class="bq-fx-panel">' +
    `<button type="button" class="bq-fx-cerrar" aria-label="Cerrar">${ICONO_CERRAR}</button>` +
    '<div class="bq-fx-contenido">' +
    '<section class="bq-qm-idea" aria-labelledby="bq-qm-titulo">' +
    '<p class="bq-qm-antetitulo">Si sabes qué necesitas, cuéntanoslo.</p>' +
    '<h2 class="bq-qm-titulo" id="bq-qm-titulo">¿Ya tienes claro qué quieres mejorar?</h2>' +
    '<p class="bq-qm-intro">Cuéntanos qué tienes en mente y estudiaremos cómo podemos ayudarte a hacerlo realidad.</p>' +
    // Móvil: el diagnóstico queda lejos, abajo; este enlace baja hasta él.
    '<button type="button" class="bq-qm-saltar">¿No sabes por dónde empezar? <span>Ver el diagnóstico avanzado</span></button>' +
    '<div class="bq-qm-formulario">' +
    '<form class="bq-fx-form bq-qm-form" data-bq-propio="idea" novalidate>' +
    '<div class="bq-fx-campo"><label class="bq-qm-oculto" for="bq-qm-mensaje">Qué quieres mejorar</label>' +
    '<textarea id="bq-qm-mensaje" name="Message" rows="4" maxlength="5000" placeholder="Explícanos qué quieres mejorar, automatizar o desarrollar en tu empresa..."></textarea></div>' +
    '<div class="bq-qm-fila">' +
    '<div class="bq-fx-campo"><label for="bq-qm-nombre">Nombre</label>' +
    '<input id="bq-qm-nombre" name="Name" type="text" autocomplete="name" maxlength="120" placeholder="Tu nombre"></div>' +
    '<div class="bq-fx-campo"><label for="bq-qm-empresa">Empresa</label>' +
    '<input id="bq-qm-empresa" name="Company" type="text" autocomplete="organization" maxlength="160" placeholder="Tu empresa"></div>' +
    "</div>" +
    '<div class="bq-fx-campo"><span class="bq-fx-etiqueta" id="bq-qm-metodo-etiqueta">¿Cómo prefieres que te contactemos?</span>' +
    '<div class="bq-metodo" role="radiogroup" aria-labelledby="bq-qm-metodo-etiqueta">' +
    '<label class="bq-metodo-opcion"><input type="radio" name="ContactMethod" value="whatsapp" checked>' +
    `<span class="bq-metodo-cara">${ICONO_WHATSAPP}<span>WhatsApp</span></span></label>` +
    '<label class="bq-metodo-opcion"><input type="radio" name="ContactMethod" value="email">' +
    `<span class="bq-metodo-cara">${ICONO_CORREO}<span>Correo electrónico</span></span></label></div></div>` +
    '<div class="bq-fx-campo" data-bq-campo="tel"><label class="bq-fx-caja bq-fx-tel">' +
    '<input name="Phone" type="tel" inputmode="tel" autocomplete="tel-national" placeholder="Número de WhatsApp" aria-label="Número de WhatsApp">' +
    `<span class="bq-prefijo"><span class="bq-prefijo-valor">+34</span>${FLECHA}<select name="PhonePrefix" aria-label="Prefijo del país"></select></span></label></div>` +
    '<div class="bq-fx-campo" data-bq-campo="email"><input name="Email" type="email" autocomplete="email" maxlength="254" placeholder="Tu correo electrónico" aria-label="Correo electrónico"></div>' +
    '<input class="bq-fx-trampa" name="website" type="text" tabindex="-1" autocomplete="off" aria-hidden="true">' +
    '<button type="submit" class="bq-fx-enviar">Enviar mi idea</button>' +
    '<p class="bq-fx-estado" aria-live="polite"></p>' +
    '<p class="bq-fx-legal">Usaremos estos datos solo para responderte. <a href="/privacidad">Política de privacidad</a></p>' +
    "</form></div>" +
    '<div class="bq-fx-hecho bq-qm-hecho" hidden tabindex="-1">' +
    `<span class="bq-fx-hecho-icono">${ICONO_OK}</span>` +
    '<h3 class="bq-fx-subtitulo">Hemos recibido tu idea</h3>' +
    '<p class="bq-fx-hecho-texto"></p>' +
    "</div>" +
    "</section>" +
    '<div class="bq-qm-o" aria-hidden="true"><span>o bien</span></div>' +
    '<section class="bq-qm-diag" aria-labelledby="bq-qm-diag-titulo">' +
    '<div class="bq-qm-diag-cabeza"><p class="bq-fx-sello">Diagnóstico avanzado</p><p class="bq-qm-pago">Servicio de pago</p></div>' +
    '<h3 class="bq-qm-diag-titulo" id="bq-qm-diag-titulo">¿No sabes por dónde empezar?</h3>' +
    '<p class="bq-qm-diag-texto">Descubre las oportunidades que tu empresa todavía no está aprovechando. Con nuestro diagnóstico avanzado analizamos cómo trabajas, detectamos procesos que puedes automatizar y preparamos propuestas de mejora adaptadas a tu negocio.</p>' +
    '<ul class="bq-qm-puntos">' +
    `<li>${ICONO_PUNTO}<span><b>Avanzado y personalizado:</b> se adapta a tu empresa y a tu forma de trabajar.</span></li>` +
    `<li>${ICONO_PUNTO}<span><b>Analizamos tus procesos</b> y las herramientas que usáis.</span></li>` +
    `<li>${ICONO_PUNTO}<span><b>Identificamos oportunidades concretas</b> de automatización.</span></li>` +
    `<li>${ICONO_PUNTO}<span><b>Preparamos un mapa conceptual</b> de cómo funciona tu negocio.</span></li>` +
    `<li>${ICONO_PUNTO}<span><b>Revisamos tus respuestas</b> y te contactamos para presentarte el diagnóstico y las oportunidades detectadas.</span></li>` +
    "</ul>" +
    '<p class="bq-qm-lema">Si no sabes por dónde empezar, nosotros analizamos tu negocio y encontramos las oportunidades.</p>' +
    '<a class="bq-qm-diag-boton" href="/diagnostico"><span>Realizar diagnóstico avanzado</span><span class="bq-qm-flecha" aria-hidden="true"></span></a>' +
    '<p class="bq-qm-precio">El diagnóstico avanzado es un servicio de pago. Responder el cuestionario no supone contratarlo: cuando te presentemos el diagnóstico te explicaremos los honorarios y las condiciones de entrega.</p>' +
    "</section></div></div>";

  let mejorar = null; // { dialog, form, … } una vez montada
  let mejorarOrigen = null; // botón que la abrió (vuelve ahí el foco al cerrar)

  const montarMejorar = () => {
    if (mejorar) return mejorar;
    const dialog = document.createElement("dialog");
    dialog.className = "bq-fx bq-qm";
    dialog.setAttribute("aria-labelledby", "bq-qm-titulo");
    dialog.innerHTML = MEJORAR_HTML;
    document.body.appendChild(dialog);
    const form = dialog.querySelector("form");
    const select = form.querySelector('select[name="PhonePrefix"]');
    for (const item of PREFIJOS.split(",")) {
      const [country, code] = item.split("|");
      select.add(new Option(`${country} (+${code})`, code, code === "34", code === "34"));
    }
    const sync = () => {
      const whatsapp = (form.querySelector('input[name="ContactMethod"]:checked') || {}).value !== "email";
      form.dataset.bqMetodo = whatsapp ? "whatsapp" : "email";
      form.querySelector(".bq-prefijo-valor").textContent = `+${select.value}`;
    };
    form.addEventListener("change", sync);
    form.addEventListener("input", (event) => {
      if (event.target.matches && event.target.matches("[aria-invalid]")) fxDesmarcar(event.target);
    });
    form.querySelector(".bq-metodo").addEventListener("change", () => {
      for (const input of form.querySelectorAll('[name="Phone"], [name="Email"]')) fxDesmarcar(input);
    });
    form.addEventListener("submit", (event) => {
      event.preventDefault();
      enviarMejorar();
    });
    dialog.querySelector(".bq-fx-cerrar").addEventListener("click", () => cerrarMejorar());
    dialog.querySelector(".bq-qm-saltar").addEventListener("click", () => {
      dialog.querySelector(".bq-qm-diag").scrollIntoView({ behavior: reduceMotion.matches ? "auto" : "smooth", block: "start" });
    });
    // Clic fuera del panel (en el fondo oscurecido) = cerrar. Esc lo gestiona el navegador.
    dialog.addEventListener("click", (event) => {
      if (event.target === dialog) cerrarMejorar();
    });
    dialog.addEventListener("cancel", (event) => {
      event.preventDefault();
      cerrarMejorar();
    });
    dialog.addEventListener("close", () => {
      document.documentElement.classList.remove("bq-fx-abierta");
      if (location.hash === "#quiero-mejorar") history.replaceState(history.state, "", location.pathname + location.search);
      if (mejorarOrigen && mejorarOrigen.isConnected) mejorarOrigen.focus({ preventScroll: true });
      mejorarOrigen = null;
    });
    sync();
    mejorar = {
      dialog,
      form,
      caja: dialog.querySelector(".bq-qm-formulario"),
      hecho: dialog.querySelector(".bq-qm-hecho"),
      enviando: false,
      enviado: "",
      inicio: 0,
    };
    return mejorar;
  };

  const abrirMejorar = (origen) => {
    const m = montarMejorar();
    if (m.dialog.open) return;
    mejorarOrigen = origen || null;
    if (!m.inicio) m.inicio = Date.now();
    m.dialog.classList.remove("bq-fx-cerrando");
    document.documentElement.classList.add("bq-fx-abierta");
    m.dialog.showModal();
    m.dialog.querySelector(".bq-fx-contenido").scrollTop = 0;
    // Con ratón, el cursor ya en el texto; en el móvil no (el teclado taparía la ventana).
    if (conRaton.matches && !m.enviado) m.form.querySelector("textarea").focus({ preventScroll: true });
    else m.dialog.querySelector(".bq-fx-cerrar").focus({ preventScroll: true });
  };
  const cerrarMejorar = () => {
    if (!mejorar || !mejorar.dialog.open) return;
    const { dialog } = mejorar;
    if (reduceMotion.matches) return dialog.close();
    dialog.classList.add("bq-fx-cerrando");
    setTimeout(() => {
      dialog.classList.remove("bq-fx-cerrando");
      dialog.close();
    }, 180);
  };
  const qmEstado = (tipo, texto) => {
    const estado = mejorar.form.querySelector(".bq-fx-estado");
    estado.dataset.tipo = tipo;
    estado.textContent = texto;
  };

  const enviarMejorar = () => {
    const m = mejorar;
    const { form } = m;
    if (m.enviando) return;
    for (const input of form.querySelectorAll("[aria-invalid]")) fxDesmarcar(input);
    const errores = [];
    const mensaje = form.querySelector('[name="Message"]');
    const nombre = form.querySelector('[name="Name"]');
    const empresa = form.querySelector('[name="Company"]');
    const tel = form.querySelector('[name="Phone"]');
    const email = form.querySelector('[name="Email"]');
    const prefijo = form.querySelector('[name="PhonePrefix"]').value || "34";
    const whatsapp = form.dataset.bqMetodo !== "email";
    if (!mensaje.value.trim()) errores.push([mensaje, "Cuéntanos brevemente qué quieres mejorar."]);
    if (!nombre.value.trim()) errores.push([nombre, TEXTOS.Name]);
    if (!empresa.value.trim()) errores.push([empresa, TEXTOS.Company]);
    let cifras = "";
    if (whatsapp) {
      cifras = tel.value.replace(/\D/g, "");
      if (prefijo !== "39") cifras = cifras.replace(/^0+/, "");
      if (!cifras) errores.push([tel, TEXTOS.Phone]);
      else if (prefijo === "34" && !/^[6-9]\d{8}$/.test(cifras)) errores.push([tel, TEXTOS.PhoneMal34]);
      else if (cifras.length < 6 || cifras.length + prefijo.length > 15) errores.push([tel, TEXTOS.PhoneMal]);
    } else {
      const valor = email.value.trim();
      if (!valor) errores.push([email, TEXTOS.Email]);
      else if (!/^[^\s@]+@[^\s@.]+(\.[^\s@.]+)*\.[a-z]{2,}$/i.test(valor)) errores.push([email, TEXTOS.EmailMal]);
    }
    if (errores.length) {
      for (const [input, texto] of errores) fxMarcar(input, texto);
      errores[0][0].focus();
      qmEstado("error", errores.length > 1 ? "Revisa los campos marcados." : "Revisa el campo marcado.");
      return;
    }
    const payload = {
      formType: "Idea de mejora",
      origin: window.location.pathname,
      message: mensaje.value.trim(),
      name: nombre.value.trim(),
      company: empresa.value.trim(),
      contactPreference: whatsapp ? "WhatsApp" : "Correo electrónico",
      phone: whatsapp ? `+${prefijo}${cifras}` : "",
      email: whatsapp ? "" : email.value.trim(),
    };
    const clave = JSON.stringify(payload);
    const destino = whatsapp ? `por WhatsApp al ${payload.phone}` : `en ${payload.email}`;
    const terminar = (confirmacion) => {
      m.caja.hidden = true;
      m.hecho.hidden = false;
      m.hecho.querySelector(".bq-fx-hecho-texto").textContent =
        `Gracias, ${payload.name}. Revisaremos lo que nos cuentas y te contactaremos ${destino}.` +
        (confirmacion ? " Te hemos enviado una confirmación a tu correo." : "");
      m.hecho.focus({ preventScroll: true });
    };
    // La misma solicitud ya llegó: no se envía otra vez.
    if (m.enviado === clave) return terminar(false);
    payload.page = window.location.href;
    payload.pageTitle = document.title;
    payload.elapsedMs = Date.now() - m.inicio;
    payload.hp = form.querySelector('[name="website"]').value;
    m.enviando = true;
    form.dataset.bqEnviando = "1";
    qmEstado("enviando", "Enviando tu idea…");
    const guarda = setTimeout(() => {
      if (!m.enviando) return;
      m.enviando = false;
      delete form.dataset.bqEnviando;
      qmEstado("error", "No hemos podido confirmar el envío. Inténtalo de nuevo.");
    }, 30000);
    const fallo = (texto) => {
      clearTimeout(guarda);
      m.enviando = false;
      delete form.dataset.bqEnviando;
      qmEstado("error", texto);
    };
    nativeFetch("/api/leads", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(payload) })
      .then(async (res) => {
        let data = {};
        try {
          data = await res.json();
        } catch {}
        return { res, data };
      })
      .then(
        ({ res, data }) => {
          // Solo se confirma si el servidor dice que la ha guardado y avisado.
          if (res.ok && data.ok) {
            clearTimeout(guarda);
            m.enviando = false;
            delete form.dataset.bqEnviando;
            m.enviado = clave;
            qmEstado("ok", "");
            return terminar(Boolean(data.confirmation));
          }
          const campos = { message: "Message", name: "Name", company: "Company", phone: "Phone", email: "Email" };
          for (const [k, texto] of Object.entries(data.fields || {})) {
            const input = campos[k] && form.querySelector(`[name="${campos[k]}"]`);
            if (input) fxMarcar(input, texto);
          }
          fallo(data.code === "validation" || data.code === "rate_limit"
            ? data.error
            : "No hemos podido enviar tu idea. Inténtalo de nuevo en unos minutos.");
        },
        () => fallo("No hemos podido enviar tu idea. Revisa tu conexión e inténtalo de nuevo."),
      );
  };

  // Clics en los enlaces a #formula-banteq y #hablemos (antes que el router de Framer).
  document.addEventListener(
    "click",
    (event) => {
      const link = event.target.closest && event.target.closest('a[href$="#formula-banteq"], a[href$="#hablemos"]');
      if (!link || event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
      const url = new URL(link.href, window.location.href);
      if (url.origin !== window.location.origin) return;
      if (url.hash === "#formula-banteq") {
        event.preventDefault();
        event.stopPropagation();
        abrirFormula(link);
      } else if (
        // Framer escribe «#hablemos» como «./#hablemos», que fuera de la home apuntaría a la home:
        // siempre es el formulario de la misma página.
        (/^(\.\/)?#hablemos$/.test(link.getAttribute("href") || "") || url.pathname.replace(/\/+$/, "") === window.location.pathname.replace(/\/+$/, "")) &&
        irAlFormulario(true)
      ) {
        // El menú, si estaba abierto, lo cierra el manejador de enlaces de más abajo.
        event.preventDefault();
        event.stopPropagation();
      }
    },
    true,
  );
  // Llegada con la dirección …#formula-banteq o …#hablemos (p. ej. desde /contacto, que redirige).
  const alLlegar = () => {
    if (location.hash === "#formula-banteq") abrirFormula(null);
    else if (location.hash === "#quiero-mejorar") abrirMejorar(null);
    else if (location.hash === "#hablemos") {
      let intentos = 0;
      const probar = () => {
        if (irAlFormulario(false) || ++intentos > 40) return;
        setTimeout(probar, 150);
      };
      setTimeout(probar, 300);
    }
  };
  if (document.readyState === "complete") alLlegar();
  else window.addEventListener("load", alLlegar, { once: true });
  window.addEventListener("hashchange", () => {
    if (location.hash === "#formula-banteq") abrirFormula(null);
    else if (location.hash === "#quiero-mejorar") abrirMejorar(null);
  });

  // Home o subpágina (data-bq-pagina en <html>): el HTML de cada subpágina ya lo trae; el router de
  // Framer cambia de página sin recargar, así que se actualiza en cada cambio de dirección.
  const marcarPagina = () => {
    const sub = window.location.pathname.replace(/\/+$/, "") !== "";
    if (sub) document.documentElement.dataset.bqPagina = "sub";
    else delete document.documentElement.dataset.bqPagina;
  };
  for (const metodo of ["pushState", "replaceState"]) {
    const original = history[metodo];
    history[metodo] = function (...args) {
      const r = original.apply(this, args);
      marcarPagina();
      return r;
    };
  }
  window.addEventListener("popstate", marcarPagina);
  marcarPagina();

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
