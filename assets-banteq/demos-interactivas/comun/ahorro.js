// Calculadora de ahorro de cada demostración: dos o tres datos con deslizador (mismo aspecto que la
// calculadora de seguimiento), horas y euros al mes y al año, la fórmula con los números del
// visitante en «¿Cómo lo calculamos?» (con los supuestos editables) y «Calcular mi caso completo»,
// que lleva al formulario «Hablemos» de la home con un mensaje ya escrito (banteq.js lo rellena).
import { AHORRO, calcularAhorro, formatoEuros, formatoNumero } from "../lib/demos-ahorro.mjs";
import { escapar, hablemos, idioma, t } from "./textos.js";

export const CLAVE_MENSAJE = "bq-hablemos-mensaje";

// opciones.unidades: { clave: [textoCorto, textoLargo] } con {v}; opciones.formula(r, f) y
// opciones.mensaje(r, f) devuelven textos (f = cifras ya formateadas).
export function montarAhorro(contenedor, id, opciones) {
  if (!contenedor) return null;
  const def = AHORRO[id];
  const pre = `ah-${id}`;
  const unidad = (c, v) => {
    const [corto, largo] = opciones.unidades[c.clave] || ["{v}", "{v}"];
    const n = formatoNumero(v, idioma, v % 1 ? 1 : 0);
    return [t(corto, { v: n }), t(largo, { v: n })];
  };
  const controles = def.controles
    .map((c) => {
      const ayuda = t(`a.${c.clave}.ayuda`);
      const tieneAyuda = ayuda !== `a.${c.clave}.ayuda`;
      return (
        `<div class="control"><div class="control-fila"><label for="${pre}-${c.clave}">${escapar(t(`a.${c.clave}`))}</label>` +
        `<output id="${pre}-v-${c.clave}" for="${pre}-${c.clave}"></output></div>` +
        (tieneAyuda ? `<p class="ayuda" id="${pre}-ayuda-${c.clave}">${escapar(ayuda)}</p>` : "") +
        `<input type="range" id="${pre}-${c.clave}" data-clave="${c.clave}" min="${c.min}" max="${c.max}" step="${c.paso}" value="${c.defecto}"` +
        `${tieneAyuda ? ` aria-describedby="${pre}-ayuda-${c.clave}"` : ""}></div>`
      );
    })
    .join("");
  const supuestos = def.supuestos
    .map(
      (s) =>
        `<div class="supuesto"><label for="${pre}-${s.clave}">${escapar(t(`a.${s.clave}`))}</label>` +
        `<input type="number" id="${pre}-${s.clave}" data-clave="${s.clave}" min="${s.min}" max="${s.max}" step="${s.paso}" value="${s.defecto}" inputmode="decimal" aria-describedby="${pre}-ayuda-${s.clave}">` +
        `<small id="${pre}-ayuda-${s.clave}">${escapar(t(`a.${s.clave}.ayuda`))}</small></div>`,
    )
    .join("");
  contenedor.innerHTML =
    '<div class="calc">' +
    `<section class="panel controles" aria-labelledby="${pre}-datos"><h3 id="${pre}-datos">${escapar(t("ahorro.datos"))}</h3>${controles}</section>` +
    `<section class="resultados" aria-labelledby="${pre}-res"><h3 class="oculto" id="${pre}-res">${escapar(t("ahorro.resultados"))}</h3>` +
    '<ul class="tarjetas">' +
    `<li class="tarjeta"><h4>${escapar(t("ahorro.horasMes"))}</h4><p class="cifra" data-r="horas"></p><p class="nota" data-r="jornadas"></p></li>` +
    `<li class="tarjeta"><h4>${escapar(t("ahorro.mes"))}</h4><p class="cifra"><span data-r="mes"></span> <span class="sufijo">${escapar(t("ahorro.estimado"))}</span></p></li>` +
    `<li class="tarjeta tarjeta-destacada tarjeta-ancha"><h4>${escapar(t("ahorro.año"))}</h4><p class="cifra"><span data-r="año"></span> <span class="sufijo">${escapar(t("ahorro.estimado"))}</span></p>` +
    `<p class="nota">${escapar(t("ahorro.añoNota"))}</p></li></ul>` +
    `<details class="como"><summary>${escapar(t("ahorro.como"))}</summary><p class="como-formula" data-r="formula"></p>` +
    `<fieldset class="supuestos"><legend>${escapar(t("ahorro.supuestos"))}</legend>${supuestos}</fieldset></details>` +
    `<div class="ahorro-acciones"><button type="button" class="boton" data-completo><span>${escapar(t("ahorro.completo"))}</span><span class="boton-flecha" aria-hidden="true"></span></button>` +
    `<p class="nota">${escapar(t("ahorro.completoNota"))}</p></div>` +
    `<p class="aviso-calculo">${escapar(t("ahorro.orientativo"))}</p>` +
    '<p class="oculto" aria-live="polite" data-anuncio></p></section></div>';

  const $ = (sel) => contenedor.querySelector(sel);
  const entradas = [...contenedor.querySelectorAll("input[data-clave]")];
  let ultimo = null;
  let temporizador;

  const leer = () => Object.fromEntries(entradas.map((i) => [i.dataset.clave, i.value === "" ? "" : Number(i.value)]));

  function pintar() {
    const r = calcularAhorro(id, leer());
    for (const c of def.controles) {
      const input = $(`#${pre}-${c.clave}`);
      const [corto, largo] = unidad(c, r.valores[c.clave]);
      $(`#${pre}-v-${c.clave}`).textContent = corto;
      input.setAttribute("aria-valuetext", largo);
      input.style.setProperty("--p", `${((r.valores[c.clave] - c.min) / (c.max - c.min)) * 100}%`);
    }
    const f = {
      // Con un decimal si lo tiene (13,5 h) y la cifra es pequeña; si no, entera.
      horas: t("unidad.h", { v: formatoNumero(r.horasMes, idioma, r.horasMes < 100 && Math.abs(r.horasMes - Math.round(r.horasMes)) >= 0.05 ? 1 : 0) }),
      mes: formatoEuros(r.euroMes, idioma),
      año: formatoEuros(r.euroAño, idioma),
    };
    $('[data-r="horas"]').textContent = f.horas;
    $('[data-r="jornadas"]').textContent = t("ahorro.horasNota", { jornadas: formatoNumero(r.horasMes / 8, idioma, 1) });
    $('[data-r="mes"]').textContent = f.mes;
    $('[data-r="año"]').textContent = f.año;
    $('[data-r="formula"]').textContent = opciones.formula(r, f);
    ultimo = { r, f };
    clearTimeout(temporizador);
    temporizador = setTimeout(() => {
      $("[data-anuncio]").textContent = t("ahorro.anuncio", { mes: f.mes, año: f.año });
    }, 700);
  }

  entradas.forEach((i) => {
    i.addEventListener("input", pintar);
    // Un supuesto fuera de rango se corrige al salir del campo (el cálculo ya lo limita).
    if (i.type === "number") i.addEventListener("change", () => {
      const v = calcularAhorro(id, leer()).valores[i.dataset.clave];
      i.value = String(v);
      pintar();
    });
  });
  $("[data-completo]").addEventListener("click", () => {
    if (!ultimo) return;
    try {
      sessionStorage.setItem(CLAVE_MENSAJE, opciones.mensaje(ultimo.r, ultimo.f));
    } catch {
      /* sin sessionStorage: el formulario llega vacío */
    }
    location.href = hablemos;
  });
  pintar();
  return { pintar };
}
