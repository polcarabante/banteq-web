// Demostración «Reservas y citas»: es una reserva real de videollamada con Pol (lo pidió él el
// 2026-11-25). El visitante elige día y hora, deja sus datos y api/reservas.js guarda la reserva en
// Brevo, avisa a Banteq, le manda la confirmación con la cita en .ics y programa el recordatorio de
// una hora antes. La página enseña cada paso, lo que le llega por correo y la agenda del día.
import { montarAhorro } from "../comun/ahorro.js?v=b860c75e88";
import { montarCalendario } from "../comun/calendario.js?v=148549c2a3";
import { anadir, montarERP } from "../comun/erp.js?v=494fabfa89";
import { crearPasos } from "../comun/pasos.js?v=eb663277c1";
import { escapar, esperar, idioma, mostrar, OK_SVG, t } from "../comun/textos.js?v=792941e660";
import { formatoEuros, formatoNumero } from "../lib/demos-ahorro.mjs?v=6c69fafb8a";

const $ = (s, raiz = document) => raiz.querySelector(s);
montarERP($("[data-erp]"));
const form = $("[data-form]");
const errorForm = $(".form-error", form);
const elegidoTxt = $("[data-elegido]");
const proceso = $(".proceso");
const pasos = crearPasos($(".pasos"), $("#pasos-anuncio"));
const resultado = $(".resultado");
const cargadaEn = Date.now();
const EMAIL = /^[^\s@]+@[^\s@.]+(\.[^\s@.]+)*\.[a-z]{2,}$/i;
const LOCALE = { es: "es-ES", ca: "ca-ES", en: "en-GB" }[idioma];

const calendario = montarCalendario($("[data-calendario]"), {
  alElegir: (s) => {
    elegidoTxt.textContent = s ? t("cal.elegido", { fecha: s.etiqueta }) : "";
    if (s && errorForm.dataset.campo === "hora") errorForm.hidden = true;
  },
});

const enMadrid = (iso, o) => new Date(iso).toLocaleString(LOCALE, { timeZone: "Europe/Madrid", ...o });
const fechaLarga = (iso) => t("fecha.hora", {
  fecha: `${enMadrid(iso, { weekday: "long" })} ${enMadrid(iso, { day: "numeric", month: "long" })}`,
  hora: enMadrid(iso, { hour: "2-digit", minute: "2-digit" }),
});

function marcarError(clave, campo) {
  errorForm.textContent = t(clave);
  errorForm.dataset.campo = campo;
  errorForm.hidden = false;
  form.querySelectorAll("[aria-invalid]").forEach((el) => el.removeAttribute("aria-invalid"));
  const el = campo === "hora" ? $(".cal-hora:not([disabled])") : form.elements[campo];
  if (el && campo !== "hora") el.setAttribute("aria-invalid", "true");
  el?.focus();
}

let enviando = false;
form.addEventListener("submit", async (e) => {
  e.preventDefault();
  if (enviando) return;
  const sel = calendario.seleccion();
  const v = (k) => form.elements[k].value.trim();
  if (!sel) return marcarError("form.faltaHora", "hora");
  if (!v("nombre")) return marcarError("form.faltaNombre", "nombre");
  if (!EMAIL.test(v("email"))) return marcarError("form.emailMal", "email");
  if (!form.elements.acepto.checked) return marcarError("form.faltaAcepto", "acepto");
  errorForm.hidden = true;
  form.querySelectorAll("[aria-invalid]").forEach((el) => el.removeAttribute("aria-invalid"));

  enviando = true;
  const boton = $('button[type="submit"]', form);
  boton.disabled = true;
  boton.querySelector("span").textContent = t("form.reservando");
  $("[data-vacio]").hidden = true;
  $(".proceso-cuerpo").hidden = false;
  resultado.hidden = true;
  pasos.reiniciar();
  mostrar(proceso);
  pasos.activo(0, t("det.reserva", { nombre: v("nombre"), fecha: sel.etiqueta }));
  const entrada = window.BANTEQ_ENTRADA || {};
  let resp;
  let datos = {};
  try {
    resp = await fetch("/api/reservas", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        nombre: v("nombre"), empresa: v("empresa"), email: v("email"), telefono: v("telefono"), mensaje: v("mensaje"),
        inicio: sel.inicio, idioma, origen: "demo-reservas", acceptTerms: true, hp: form.elements.web.value,
        elapsedMs: Date.now() - cargadaEn, page: location.href.split("#")[0].split("?")[0], sourceSignal: entrada.sourceSignal, entryPath: entrada.entryPath,
      }),
    });
    datos = await resp.json().catch(() => ({}));
  } catch {
    datos = { error: t("cal.error") };
  }
  await esperar(500);
  boton.disabled = false;
  boton.querySelector("span").textContent = t("form.reservar");
  enviando = false;

  if (!resp?.ok || !datos.ok) {
    pasos.error(0, t("det.error"));
    if (datos.code === "ocupado" || datos.code === "hueco") {
      pasos.error(1, t("det.ocupado"));
      calendario.recargar();
    }
    errorForm.textContent = datos.fields ? Object.values(datos.fields)[0] : datos.error || t("cal.error");
    errorForm.dataset.campo = "";
    errorForm.hidden = false;
    mostrar(form, "center");
    return;
  }

  pasos.hecho(0, t("det.reserva", { nombre: v("nombre"), fecha: sel.etiqueta }));
  const pasosOk = [
    [1, "hecho", t("det.libre")],
    [2, datos.confirmacion === false ? "aviso" : "hecho", datos.confirmacion === false ? t("det.correoFallo") : t("det.correo", { email: v("email") })],
    [3, "hecho", t(datos.recordatorio === "programado" ? "det.recProgramado" : "det.recPendiente", { fecha: fechaLarga(new Date(new Date(sel.inicio).getTime() - 3600000).toISOString()) })],
    [4, "hecho", t("det.calendario", { ref: datos.ref })],
  ];
  for (const [i, estado, detalle] of pasosOk) {
    await esperar(300);
    pasos.activo(i, "");
    await esperar(550);
    pasos[estado](i, detalle);
  }
  anadir("reservas", { nombre: v("nombre"), dia: sel.dia, hora: sel.hora, estado: "confirmada" });
  pintarResultado(sel, v("nombre"));
  form.reset();
  calendario.recargar();
  resultado.hidden = false;
  mostrar(resultado, "start");
  $("#t-res").focus({ preventScroll: true });
});

function pintarResultado(sel, nombre) {
  const dia = calendario.dias().find((d) => d.dia === sel.dia);
  const agenda = (dia?.horas || []).map((h) => {
    const tuya = h.inicio === sel.inicio;
    const estado = tuya ? t("res.tuya") : h.libre ? t("res.libre") : t("res.ocupada");
    return `<li class="agenda-fila${tuya ? " agenda-tuya" : h.libre ? "" : " agenda-ocupada"}"><small>${escapar(h.hora)}</small><span>${tuya ? `${OK_SVG}${escapar(`${estado} · ${nombre}`)}` : escapar(estado)}</span></li>`;
  }).join("");
  const diaTxt = new Date(`${sel.dia}T12:00:00Z`).toLocaleDateString(LOCALE, { timeZone: "UTC", weekday: "long", day: "numeric", month: "long" });
  const recordatorio = new Date(new Date(sel.inicio).getTime() - 3600000).toISOString();
  $("[data-resultado]").innerHTML =
    `<p class="res-resumen">${escapar(t("res.texto", { fecha: sel.etiqueta }))}</p>` +
    `<div class="correo"><div class="chat-barra"><i></i><i></i><i></i><b>${escapar(t("correo.ventana"))}</b></div>` +
    `<div class="correo-cab"><small>1</small><span>${escapar(t("correo.asunto", { fecha: sel.etiqueta }))}</span></div>` +
    `<div class="correo-cab"><small>2</small><span>${escapar(t("correo.recAsunto", { hora: sel.hora }))}<em class="correo-cuando">${escapar(fechaLarga(recordatorio))}</em></span></div>` +
    `<p class="correo-estado">📎 videollamada-banteq.ics</p></div>` +
    `<div class="agenda"><h3>${escapar(t("res.dia", { dia: diaTxt }))}</h3><ul>${agenda}</ul></div>` +
    `<div class="acciones"><button type="button" class="boton-sec" data-otra>${escapar(t("res.otra"))}</button></div>`;
  $("[data-otra]").addEventListener("click", () => {
    resultado.hidden = true;
    mostrar($("[data-calendario]"), "start");
    $(".cal-hora:not([disabled])")?.focus();
  });
}

// --- Ahorro --------------------------------------------------------------------------------------
const num = (n, d = 0) => formatoNumero(n, idioma, d);
montarAhorro($("[data-ahorro]"), "reservas", {
  unidades: { llamadasDia: ["{v}", "a.llamadasDia.largo"], minLlamada: ["unidad.min", "unidad.minLargo"] },
  formula: (r, f) => {
    const v = r.valores;
    return t("a.formula", {
      llamadasDia: num(v.llamadasDia), minLlamada: num(v.minLlamada), diasMes: num(v.diasMes), parteAutomatica: num(v.parteAutomatica), horas: f.horas,
      costeHora: t("unidad.eurHora", { v: num(v.costeHora) }), tiempo: formatoEuros(r.partes.tiempoMes, idioma),
      citasMes: num(v.citasMes), tasaNoShow: num(v.tasaNoShow), reduccionNoShow: num(v.reduccionNoShow), citas: num(r.partes.citasRecuperadas, r.partes.citasRecuperadas % 1 ? 1 : 0),
      valorCita: formatoEuros(v.valorCita, idioma), noShows: formatoEuros(r.partes.noShowsMes, idioma), mes: f.mes, año: f.año,
    });
  },
  mensaje: (r, f) => t("a.mensaje", { llamadasDia: num(r.valores.llamadasDia), minLlamada: num(r.valores.minLlamada), mes: f.mes, año: f.año }),
});
