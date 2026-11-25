// Zona de subida: un <input type="file"> de verdad (teclado, lector de pantalla y selector de
// archivos del móvil) con una etiqueta grande donde también se puede soltar el archivo. Comprueba
// tamaño, que no esté vacío y el formato antes de pasarlo a la demostración.
import { MAX_MB, t } from "./textos.js";

const formatoMB = (bytes) => (bytes / 1048576).toLocaleString(document.documentElement.lang || "es", { maximumFractionDigits: 1 });

// tipos: { pdf: { ext: [".pdf"], mime: ["application/pdf"] }, ... }. alElegir(archivo, tipo).
export function prepararSubida(raiz, { tipos, formatos, alElegir }) {
  const input = raiz.querySelector("input[type=file]");
  const zona = raiz.querySelector(".subida-zona");
  const error = raiz.querySelector(".subida-error");

  function mostrarError(texto) {
    error.textContent = texto || "";
    error.hidden = !texto;
    zona.classList.toggle("subida-mal", Boolean(texto));
  }

  function tipoDe(archivo) {
    const nombre = (archivo.name || "").toLowerCase();
    for (const [tipo, { ext, mime }] of Object.entries(tipos)) {
      if (ext.some((e) => nombre.endsWith(e)) || (archivo.type && mime.includes(archivo.type))) return tipo;
    }
    return null;
  }

  function comprobar(archivo) {
    if (!archivo) return null;
    if (!archivo.size) return mostrarError(t("error.vacio"));
    if (archivo.size > MAX_MB * 1048576) return mostrarError(t("error.grande", { mb: formatoMB(archivo.size), max: MAX_MB }));
    const tipo = tipoDe(archivo);
    if (!tipo) return mostrarError(t("error.formato", { formatos }));
    mostrarError("");
    alElegir(archivo, tipo);
  }

  input.addEventListener("change", () => {
    comprobar(input.files && input.files[0]);
    input.value = ""; // permite volver a elegir el mismo archivo
  });
  let dentro = 0;
  raiz.addEventListener("dragenter", (e) => {
    if (![...(e.dataTransfer?.types || [])].includes("Files")) return;
    e.preventDefault();
    dentro++;
    zona.classList.add("subida-encima");
  });
  raiz.addEventListener("dragover", (e) => {
    if ([...(e.dataTransfer?.types || [])].includes("Files")) e.preventDefault();
  });
  raiz.addEventListener("dragleave", () => {
    if (--dentro <= 0) {
      dentro = 0;
      zona.classList.remove("subida-encima");
    }
  });
  raiz.addEventListener("drop", (e) => {
    e.preventDefault();
    dentro = 0;
    zona.classList.remove("subida-encima");
    comprobar(e.dataTransfer?.files?.[0]);
  });
  return { mostrarError, tipoDe, comprobar };
}
