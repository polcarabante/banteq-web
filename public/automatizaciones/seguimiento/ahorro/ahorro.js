// Calculadora «¿Cuánto me ahorro?»: cálculo en el navegador (lib/ahorro-calculo.mjs, el mismo que
// repite api/ahorro.js), botón final con la cifra al día y formulario de solicitud → /api/ahorro.
import { CONTROLES, calcular, formatoEuros, formatoNumero } from "./ahorro-calculo.mjs?v=2638c611cf";

const $ = (id) => document.getElementById(id);
const cargadaEn = Date.now();

const UNIDAD = {
  correosDia: (v) => [`${formatoNumero(v)}`, `${formatoNumero(v)} correos al día`],
  minCorreo: (v) => [`${v} min`, `${v} minutos`],
  minSeguimiento: (v) => [`${v} min`, `${v} minutos`],
  automatizable: (v) => [`${v} %`, `${v} por ciento`],
  dias: (v) => [`${v} días`, `${v} días`],
  costeHora: (v) => [`${v} €/h`, `${v} euros por hora`],
};

const entradas = CONTROLES.map((c) => $(c.clave));
let ultimo = null;
let enviada = false; // tras enviar, el botón no vuelve a abrir el formulario
let anuncioTimer;

const valores = () => Object.fromEntries(CONTROLES.map((c) => [c.clave, Number($(c.clave).value)]));

function pintar() {
  const v = valores();
  for (const c of CONTROLES) {
    const input = $(c.clave);
    const [corto, largo] = UNIDAD[c.clave](v[c.clave]);
    $(`v-${c.clave}`).textContent = corto;
    input.setAttribute("aria-valuetext", largo);
    input.style.setProperty("--p", `${((v[c.clave] - c.min) / (c.max - c.min)) * 100}%`);
  }
  const r = calcular(v);
  const n = r.redondeado;
  $("r-horasAño").textContent = formatoNumero(n.horasAño);
  $("r-empleados").textContent = formatoNumero(n.empleados, 2);
  $("r-ahorroBrutoMes").textContent = formatoEuros(n.ahorroBrutoMes);
  $("r-ahorroMes").textContent = formatoEuros(n.ahorroMes);
  $("r-herramientasMes").textContent = formatoEuros(n.herramientasMes);
  $("r-implantacion").textContent = formatoEuros(n.implantacion);
  $("r-mantenimientoMes").textContent = formatoEuros(n.mantenimientoMes);
  $("r-gananciaClienteMes").textContent = formatoEuros(n.gananciaClienteMes);

  $("no-compensa").hidden = r.compensa;
  document.querySelector(".calc").toggleAttribute("data-sin-ahorro", !r.compensa);
  const quiero = $("quiero");
  quiero.disabled = !r.compensa || enviada;
  $("quiero-texto").textContent = `Quiero ahorrar ${formatoEuros(n.gananciaClienteAño)} al año`;
  $("primer-año").textContent = `El primer año ahorras ${formatoEuros(n.gananciaPrimerAño)} (ahorro estimado), porque incluye la implantación`;
  $("primer-año").hidden = !r.compensa;
  if (!r.compensa) {
    $("solicitud").hidden = true;
    quiero.setAttribute("aria-expanded", "false");
  }
  if ($("enviar")) $("enviar").disabled = !r.compensa;

  // Para lectores de pantalla: un resumen cuando se deja de mover el control, no en cada paso.
  clearTimeout(anuncioTimer);
  anuncioTimer = setTimeout(() => {
    $("anuncio").textContent = r.compensa
      ? `Ahorro mensual estimado ${formatoEuros(n.ahorroMes)}. Ganas ${formatoEuros(n.gananciaClienteMes)} al mes y ${formatoEuros(n.gananciaClienteAño)} al año.`
      : "Con este volumen la automatización no compensa todavía.";
  }, 700);
  ultimo = { v, r };
}

entradas.forEach((input) => input.addEventListener("input", pintar));
pintar();

// --- Formulario -----------------------------------------------------------------------------------
const form = $("solicitud");
const quiero = $("quiero");
const estado = $("estado");
const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

quiero.addEventListener("click", () => {
  if (quiero.disabled) return;
  const abrir = form.hidden;
  form.hidden = !abrir;
  quiero.setAttribute("aria-expanded", String(abrir));
  if (abrir) {
    form.scrollIntoView({ behavior: matchMedia("(prefers-reduced-motion: reduce)").matches ? "auto" : "smooth", block: "nearest" });
    $("empresa").focus({ preventScroll: true });
  }
});

function marcar(id, mensaje) {
  const error = $(`error-${id}`);
  error.textContent = mensaje || "";
  error.hidden = !mensaje;
  if (mensaje) $(id).setAttribute("aria-invalid", "true");
  else $(id).removeAttribute("aria-invalid");
}

const REGLAS = {
  empresa: (v) => (!v ? "Escribe el nombre de tu empresa." : v.length > 160 ? "El nombre es demasiado largo." : ""),
  correo: (v) => (!v ? "Escribe tu correo." : !EMAIL.test(v) || v.length > 254 ? "Revisa el correo: por ejemplo, nombre@empresa.com." : ""),
  acepto: () => ($("acepto").checked ? "" : "Para enviar la solicitud, acepta la política de privacidad y los términos y condiciones."),
};
const valor = (id) => (id === "acepto" ? "" : $(id).value.trim());

function validar() {
  let primero = null;
  for (const id of Object.keys(REGLAS)) {
    const mensaje = REGLAS[id](valor(id));
    marcar(id, mensaje);
    if (mensaje && !primero) primero = id;
  }
  return { ok: !primero, primero, empresa: valor("empresa"), correo: valor("correo") };
}

// Un campo marcado se desmarca en cuanto vuelve a ser válido.
["empresa", "correo", "acepto"].forEach((id) => $(id).addEventListener(id === "acepto" ? "change" : "input", () => {
  if ($(id).getAttribute("aria-invalid") === "true" && !REGLAS[id](valor(id))) marcar(id, "");
}));

let enviando = false;
form.addEventListener("submit", async (event) => {
  event.preventDefault();
  if (enviando || !ultimo?.r.compensa) return;
  const { ok, primero, empresa, correo } = validar();
  if (!ok) {
    $(primero).focus();
    estado.textContent = "";
    return;
  }
  enviando = true;
  $("enviar").disabled = true;
  estado.removeAttribute("data-tipo");
  estado.textContent = "Enviando…";
  const entrada = window.BANTEQ_ENTRADA || {};
  try {
    const respuesta = await fetch("/api/ahorro", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        company: empresa,
        email: correo,
        acceptTerms: true,
        hp: $("web").value,
        elapsedMs: Date.now() - cargadaEn,
        valores: ultimo.v,
        page: location.href.split("#")[0].split("?")[0],
        sourceSignal: entrada.sourceSignal,
        entryPath: entrada.entryPath,
      }),
    });
    const datos = await respuesta.json().catch(() => ({}));
    if (!respuesta.ok || !datos.ok) {
      if (datos.fields) Object.entries(datos.fields).forEach(([k, m]) => { if ($(`error-${k}`)) marcar(k, m); });
      throw new Error(datos.error || "No hemos podido enviar tu solicitud. Inténtalo de nuevo en unos minutos.");
    }
    enviada = true;
    form.hidden = true;
    quiero.setAttribute("aria-expanded", "false");
    quiero.disabled = true;
    const recibida = $("recibida");
    // Si la confirmación al cliente no salió, no se le dice que se la hemos enviado.
    if (datos.confirmation === false) recibida.querySelector("p").innerHTML = "<strong>Solicitud recibida.</strong> Te responderemos en menos de 48 horas.";
    recibida.hidden = false;
    recibida.focus();
  } catch (error) {
    estado.dataset.tipo = "error";
    estado.textContent = error.message;
    $("enviar").disabled = false;
  } finally {
    enviando = false;
  }
});
