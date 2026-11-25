// Cálculo de ahorro de las demostraciones interactivas (/automatizaciones/<demo>). Funciones puras,
// iguales en el navegador y en los tests (tests/demos-ahorro.test.mjs). Cada demostración tiene
// dos o tres datos principales (los controles que ve el visitante) y unos supuestos, también
// editables, en «¿Cómo lo calculamos?». Son estimaciones orientativas: la página las presenta
// como «ahorro estimado».
//
// Independiente de la calculadora de seguimiento (lib/ahorro-calculo.mjs): aquí no hay precios de
// Banteq, solo el tiempo y el dinero que se ahorra la empresa.

export const SEMANAS_MES = 52 / 12;

export const AHORRO = {
  // Automatización de procesos: facturas de proveedor al ERP.
  facturas: {
    controles: [
      { clave: "facturasMes", min: 10, max: 2000, paso: 10, defecto: 150 },
      { clave: "minFactura", min: 1, max: 20, paso: 1, defecto: 6 },
      { clave: "costeHora", min: 10, max: 60, paso: 1, defecto: 25 },
    ],
    supuestos: [
      { clave: "parteAutomatica", min: 50, max: 100, paso: 5, defecto: 90 },
      { clave: "tasaError", min: 0, max: 10, paso: 0.5, defecto: 2 },
      { clave: "costeError", min: 0, max: 200, paso: 5, defecto: 30 },
    ],
    // Horas: facturas × minutos × parte que se hace sola. Errores evitados: facturas × % con error ×
    // lo que cuesta cada error (localizarlo, rectificar y reclamar).
    calcular(v) {
      const horasMes = (v.facturasMes * v.minFactura * (v.parteAutomatica / 100)) / 60;
      const tiempoMes = horasMes * v.costeHora;
      const erroresMes = v.facturasMes * (v.tasaError / 100) * v.costeError;
      return { horasMes, partes: { tiempoMes, erroresMes }, euroMes: tiempoMes + erroresMes };
    },
  },
  // Asistentes de IA: respuestas con la documentación de la empresa.
  asistente: {
    controles: [
      { clave: "empleados", min: 1, max: 200, paso: 1, defecto: 10 },
      { clave: "consultasSemana", min: 1, max: 30, paso: 1, defecto: 5 },
      { clave: "minBuscando", min: 2, max: 60, paso: 1, defecto: 12 },
    ],
    supuestos: [
      { clave: "minConAsistente", min: 0, max: 15, paso: 1, defecto: 2 },
      { clave: "parteResuelta", min: 30, max: 100, paso: 5, defecto: 80 },
      { clave: "costeHora", min: 10, max: 60, paso: 1, defecto: 25 },
    ],
    // Horas: empleados × consultas por semana × semanas del mes × parte que resuelve el asistente ×
    // (minutos buscando − minutos que sigue costando con el asistente).
    calcular(v) {
      const consultasMes = v.empleados * v.consultasSemana * SEMANAS_MES;
      const horasMes = (consultasMes * (v.parteResuelta / 100) * Math.max(0, v.minBuscando - v.minConAsistente)) / 60;
      return { horasMes, partes: { consultasMes }, euroMes: horasMes * v.costeHora };
    },
  },
  // Ventas y CRM: alta, bienvenida y seguimiento de cada contacto, y clientes que no se pierden por
  // responder tarde.
  crm: {
    controles: [
      { clave: "leadsMes", min: 5, max: 500, paso: 5, defecto: 40 },
      { clave: "minGestion", min: 2, max: 60, paso: 1, defecto: 15 },
    ],
    supuestos: [
      { clave: "costeHora", min: 10, max: 60, paso: 1, defecto: 25 },
      { clave: "parteAutomatica", min: 50, max: 100, paso: 5, defecto: 85 },
      { clave: "tasaRecuperados", min: 0, max: 30, paso: 1, defecto: 5 },
      { clave: "tasaCierre", min: 0, max: 100, paso: 5, defecto: 20 },
      { clave: "beneficioCliente", min: 0, max: 20000, paso: 50, defecto: 400 },
    ],
    // Tiempo: contactos × minutos de gestión × parte que se hace sola. Clientes recuperados: contactos
    // que se perdían por responder tarde × los que acaban comprando × beneficio de cada cliente nuevo.
    calcular(v) {
      const horasMes = (v.leadsMes * v.minGestion * (v.parteAutomatica / 100)) / 60;
      const tiempoMes = horasMes * v.costeHora;
      const clientesMes = v.leadsMes * (v.tasaRecuperados / 100) * (v.tasaCierre / 100);
      const ventasMes = clientesMes * v.beneficioCliente;
      return { horasMes, partes: { tiempoMes, clientesMes, ventasMes }, euroMes: tiempoMes + ventasMes };
    },
  },
  // Informes y datos: el informe semanal para dirección, sin prepararlo nadie.
  informes: {
    controles: [
      { clave: "horasSemana", min: 0.5, max: 20, paso: 0.5, defecto: 4 },
      { clave: "costeHora", min: 10, max: 60, paso: 1, defecto: 25 },
    ],
    supuestos: [{ clave: "parteAutomatica", min: 50, max: 100, paso: 5, defecto: 90 }],
    // Horas: horas a la semana × 52/12 semanas × parte que se hace sola.
    calcular(v) {
      const horasMes = v.horasSemana * SEMANAS_MES * (v.parteAutomatica / 100);
      return { horasMes, partes: {}, euroMes: horasMes * v.costeHora };
    },
  },
  // Reservas y citas: menos llamadas para reservar y menos citas perdidas gracias a los recordatorios.
  reservas: {
    controles: [
      { clave: "llamadasDia", min: 1, max: 100, paso: 1, defecto: 15 },
      { clave: "minLlamada", min: 1, max: 15, paso: 1, defecto: 4 },
    ],
    supuestos: [
      { clave: "diasMes", min: 15, max: 31, paso: 1, defecto: 22 },
      { clave: "costeHora", min: 10, max: 60, paso: 1, defecto: 25 },
      { clave: "parteAutomatica", min: 30, max: 100, paso: 5, defecto: 80 },
      { clave: "citasMes", min: 0, max: 5000, paso: 10, defecto: 200 },
      { clave: "tasaNoShow", min: 0, max: 40, paso: 1, defecto: 8 },
      { clave: "reduccionNoShow", min: 0, max: 100, paso: 5, defecto: 50 },
      { clave: "valorCita", min: 0, max: 1000, paso: 5, defecto: 40 },
    ],
    // Tiempo: llamadas al día × minutos × días al mes × parte que pasa a reservarse sola. Citas
    // recuperadas: citas al mes × % que no se presenta × % que evitan los recordatorios × valor de una cita.
    calcular(v) {
      const horasMes = (v.llamadasDia * v.minLlamada * v.diasMes * (v.parteAutomatica / 100)) / 60;
      const tiempoMes = horasMes * v.costeHora;
      const citasRecuperadas = v.citasMes * (v.tasaNoShow / 100) * (v.reduccionNoShow / 100);
      const noShowsMes = citasRecuperadas * v.valorCita;
      return { horasMes, partes: { tiempoMes, citasRecuperadas, noShowsMes }, euroMes: tiempoMes + noShowsMes };
    },
  },
};

// Valores completos (controles y supuestos), dentro de rango y con los que falten por defecto.
export function valoresDe(id, entrada = {}) {
  const def = AHORRO[id];
  const v = {};
  for (const c of [...def.controles, ...def.supuestos]) {
    const n = Number(entrada[c.clave]);
    v[c.clave] = Number.isFinite(n) && entrada[c.clave] !== "" && entrada[c.clave] !== null ? Math.min(c.max, Math.max(c.min, n)) : c.defecto;
  }
  return v;
}

export function calcularAhorro(id, entrada) {
  const v = valoresDe(id, entrada);
  const r = AHORRO[id].calcular(v);
  return { valores: v, ...r, euroAño: r.euroMes * 12, horasAño: r.horasMes * 12 };
}

// --- Formato -----------------------------------------------------------------------------------------

const LOCALES = { es: "es-ES", ca: "ca-ES", en: "en-GB" };

const redondear = (n, d) => {
  const f = 10 ** d;
  return Math.round((n + Number.EPSILON) * f) / f;
};

// «1.284,60» en castellano y catalán (también con cuatro cifras), «1,284.60» en inglés.
export function formatoNumero(n, idioma = "es", decimales = 0) {
  const opciones = { minimumFractionDigits: decimales, maximumFractionDigits: decimales };
  const locale = LOCALES[idioma] || LOCALES.es;
  try {
    return new Intl.NumberFormat(locale, { ...opciones, useGrouping: "always" }).format(redondear(n, decimales));
  } catch {
    return new Intl.NumberFormat(locale, { ...opciones, useGrouping: true }).format(redondear(n, decimales));
  }
}

// «1.284,60 €» (espacio duro: no se parte la cifra del símbolo) o «€1,284.60» en inglés.
export function formatoEuros(n, idioma = "es", decimales = 0) {
  const cifra = formatoNumero(n, idioma, decimales);
  return idioma === "en" ? `€${cifra}` : `${cifra} €`;
}
