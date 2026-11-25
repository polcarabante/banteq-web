// Calendario de videollamadas con Banteq: los próximos tres días hábiles y sus huecos de 30 minutos
// (lib/agenda.mjs), con los ya reservados desactivados. Los huecos los da api/reservas.js. Lo usan
// la demostración «Reservas y citas» y la ventana «Quiero mejorar» (banteq.js), que le pasa sus
// propios textos e idioma.
import { escapar as escaparBase, idioma as idiomaPagina, t as tPagina } from "./textos.js";

const LOCALES = { es: "es-ES", ca: "ca-ES", en: "en-GB" };

// opciones: { alElegir(seleccion|null), t, idioma, api }. Devuelve { recargar, seleccion, limpiar }.
export function montarCalendario(contenedor, opciones = {}) {
  const t = opciones.t || tPagina;
  const idioma = opciones.idioma || idiomaPagina;
  const api = opciones.api || "/api/reservas";
  const escapar = escaparBase;
  const locale = LOCALES[idioma] || LOCALES.es;
  const fechaDia = (dia, o) => new Date(`${dia}T12:00:00Z`).toLocaleDateString(locale, { timeZone: "UTC", ...o });
  let dias = [];
  let diaActual = null;
  let elegido = null;

  const avisar = () => opciones.alElegir?.(elegido ? { ...elegido, etiqueta: etiqueta(elegido) } : null);
  const etiqueta = (s) => {
    const fecha = `${fechaDia(s.dia, { weekday: "long" })} ${fechaDia(s.dia, { day: "numeric", month: "long" })}`;
    return t("fecha.hora", { fecha, hora: s.hora });
  };

  function pintar() {
    if (!dias.length) return;
    const dia = dias.find((d) => d.dia === diaActual) || dias[0];
    const botonesDias = dias.map((d) => {
      const libres = d.horas.filter((h) => h.libre).length;
      return `<button type="button" class="cal-dia" data-dia="${d.dia}" aria-pressed="${d.dia === dia.dia}"${libres ? "" : " disabled"}>` +
        `<span class="cal-dia-sem">${escapar(fechaDia(d.dia, { weekday: "short" }))}</span><b>${escapar(fechaDia(d.dia, { day: "numeric" }))}</b>` +
        `<span class="cal-dia-mes">${escapar(fechaDia(d.dia, { month: "short" }))}</span><small>${escapar(t("cal.libres", { n: libres }))}</small></button>`;
    }).join("");
    const grupo = (nombre, horas) => horas.length ? `<p class="cal-franja">${escapar(t(nombre))}</p><div class="cal-horas">${horas.map((h) => {
      const sel = elegido && elegido.inicio === h.inicio;
      return `<button type="button" class="cal-hora" data-inicio="${h.inicio}" data-hora="${h.hora}" aria-pressed="${Boolean(sel)}"${h.libre ? "" : ` disabled aria-label="${escapar(`${h.hora}, ${t("cal.ocupado")}`)}"`}>${escapar(h.hora)}</button>`;
    }).join("")}</div>` : "";
    contenedor.innerHTML =
      `<p class="cal-zona">${escapar(t("cal.zona"))}</p>` +
      `<div class="cal-dias" role="group" aria-label="${escapar(t("cal.dias"))}">${botonesDias}</div>` +
      `<div role="group" aria-label="${escapar(t("cal.horas"))}">` +
      grupo("cal.manana", dia.horas.filter((h) => h.hora < "15:00")) + grupo("cal.tarde", dia.horas.filter((h) => h.hora >= "15:00")) + "</div>";
  }

  contenedor.addEventListener("click", (e) => {
    const d = e.target.closest(".cal-dia");
    if (d && !d.disabled) {
      diaActual = d.dataset.dia;
      pintar();
      contenedor.querySelector(`.cal-dia[data-dia="${diaActual}"]`)?.focus();
      return;
    }
    const h = e.target.closest(".cal-hora");
    if (h && !h.disabled) {
      elegido = { inicio: h.dataset.inicio, dia: diaActual || dias[0].dia, hora: h.dataset.hora };
      pintar();
      contenedor.querySelector(`.cal-hora[data-inicio="${elegido.inicio}"]`)?.focus();
      avisar();
    }
  });

  async function recargar() {
    contenedor.innerHTML = `<p class="cal-estado">${escapar(t("cal.cargando"))}</p>`;
    try {
      const r = await fetch(api, { headers: { Accept: "application/json" } });
      const datos = await r.json();
      if (!r.ok || !datos.ok) throw new Error(String(r.status));
      if (!datos.activo) {
        contenedor.innerHTML = `<p class="cal-estado cal-inactivo">${escapar(t("cal.inactivo"))}</p>`;
        return { activo: false };
      }
      dias = datos.dias;
      if (!dias.some((d) => d.dia === diaActual && d.horas.some((h) => h.libre))) diaActual = (dias.find((d) => d.horas.some((h) => h.libre)) || dias[0]).dia;
      if (elegido && !dias.some((d) => d.horas.some((h) => h.inicio === elegido.inicio && h.libre))) {
        elegido = null;
        avisar();
      }
      pintar();
      return { activo: true };
    } catch {
      contenedor.innerHTML = `<p class="cal-estado">${escapar(t("cal.error"))}</p><button type="button" class="boton-sec" data-reintentar>${escapar(t("cal.reintentar"))}</button>`;
      contenedor.querySelector("[data-reintentar]").addEventListener("click", recargar);
      return { activo: true, error: true };
    }
  }

  recargar();
  return {
    recargar,
    seleccion: () => (elegido ? { ...elegido, etiqueta: etiqueta(elegido) } : null),
    dias: () => dias,
    limpiar() {
      elegido = null;
      pintar();
      avisar();
    },
  };
}
