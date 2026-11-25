// Pasos visibles del proceso (lectura → extracción → validación → registro…). Cada paso tiene un
// estado (espera, activo, hecho, aviso, error) y una línea de detalle; cada cambio se anuncia en una
// región aria-live para lectores de pantalla.
import { t } from "./textos.js";

export function crearPasos(lista, anunciador) {
  const pasos = [...lista.querySelectorAll(".paso")];
  const total = pasos.length;

  function poner(i, estado, detalle) {
    const li = pasos[i];
    if (!li) return;
    li.dataset.estado = estado;
    if (detalle !== undefined) li.querySelector("small").textContent = detalle;
    if (estado === "activo") li.setAttribute("aria-current", "step");
    else li.removeAttribute("aria-current");
    const extra = { hecho: t("pasos.hecho"), error: t("pasos.error"), aviso: "" }[estado] || "";
    if (anunciador && estado !== "espera") {
      anunciador.textContent = t("pasos.anuncio", {
        n: i + 1, total, paso: li.querySelector("b").textContent, detalle: [li.querySelector("small").textContent, extra].filter(Boolean).join(" · "),
      });
    }
  }

  return {
    activo: (i, detalle) => poner(i, "activo", detalle),
    hecho: (i, detalle) => poner(i, "hecho", detalle),
    aviso: (i, detalle) => poner(i, "aviso", detalle),
    error: (i, detalle) => poner(i, "error", detalle),
    detalle(i, texto) {
      if (pasos[i]) pasos[i].querySelector("small").textContent = texto;
    },
    reiniciar() {
      pasos.forEach((li) => {
        li.dataset.estado = "espera";
        li.removeAttribute("aria-current");
        li.querySelector("small").textContent = "";
      });
    },
  };
}
