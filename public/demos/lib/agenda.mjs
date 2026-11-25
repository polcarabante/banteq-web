// Agenda de videollamadas con Banteq: la usan la demostración «Reservas y citas»
// (/automatizaciones/reservas), la ventana «Quiero mejorar» y api/reservas.js, que vuelve a
// comprobar aquí cada reserva (no se fía del navegador).
//
// Lo fijó Pol el 2026-11-25: de lunes a viernes, de 10 a 14 h y de 16 a 19 h (hora de Madrid),
// llamadas de 30 minutos, en los tres próximos días hábiles (sin contar hoy) y sin festivos. Los
// huecos ya reservados no se ofrecen.

export const AGENDA = {
  zona: "Europe/Madrid",
  franjas: [["10:00", "14:00"], ["16:00", "19:00"]],
  duracion: 30, // minutos
  diasHabiles: 3,
};

// Festivos nacionales y de Cataluña (2026 y 2027). Los locales de Santa Perpètua no están: Pol puede
// añadirlos aquí. Un día que no está en la lista y no es fin de semana se ofrece.
export const FESTIVOS = new Set([
  "2026-01-01", "2026-01-06", "2026-04-03", "2026-04-06", "2026-05-01", "2026-06-24", "2026-08-15", "2026-09-11",
  "2026-10-12", "2026-11-01", "2026-12-08", "2026-12-25", "2026-12-26",
  "2027-01-01", "2027-01-06", "2027-03-26", "2027-03-29", "2027-05-01", "2027-06-24", "2027-08-15", "2027-09-11",
  "2027-10-12", "2027-11-01", "2027-12-06", "2027-12-08", "2027-12-25", "2027-12-26",
]);

// --- Hora de Madrid --------------------------------------------------------------------------------

const partes = (f) => {
  const p = new Intl.DateTimeFormat("en-US", {
    timeZone: AGENDA.zona, hourCycle: "h23", year: "numeric", month: "2-digit", day: "2-digit", hour: "2-digit", minute: "2-digit", second: "2-digit",
  }).formatToParts(f);
  const v = (k) => Number(p.find((x) => x.type === k).value);
  return { año: v("year"), mes: v("month"), dia: v("day"), hora: v("hour"), minuto: v("minute"), segundo: v("second") };
};

// Minutos que Madrid va por delante de UTC en ese instante (60 en invierno, 120 en verano).
export function desfaseMadrid(f) {
  const p = partes(f);
  return (Date.UTC(p.año, p.mes - 1, p.dia, p.hora, p.minuto, p.segundo) - Math.floor(f.getTime() / 1000) * 1000) / 60000;
}

// Instante UTC de una hora de Madrid («2026-11-26», «10:30»).
export function madridAUtc(dia, hora) {
  const [a, m, d] = dia.split("-").map(Number);
  const [h, min] = hora.split(":").map(Number);
  const supuesto = Date.UTC(a, m - 1, d, h, min);
  let t = supuesto - desfaseMadrid(new Date(supuesto)) * 60000;
  t = supuesto - desfaseMadrid(new Date(t)) * 60000; // cambio de hora: segunda pasada
  return new Date(t);
}

// Día («aaaa-mm-dd») y hora («hh:mm») de Madrid de un instante.
export function enMadrid(f) {
  const p = partes(f);
  const dos = (n) => String(n).padStart(2, "0");
  return { dia: `${p.año}-${dos(p.mes)}-${dos(p.dia)}`, hora: `${dos(p.hora)}:${dos(p.minuto)}` };
}

const siguienteDia = (dia) => {
  const [a, m, d] = dia.split("-").map(Number);
  return new Date(Date.UTC(a, m - 1, d + 1)).toISOString().slice(0, 10);
};
const diaSemana = (dia) => new Date(`${dia}T12:00:00Z`).getUTCDay();

export const esHabil = (dia) => diaSemana(dia) !== 0 && diaSemana(dia) !== 6 && !FESTIVOS.has(dia);

// Los próximos días hábiles después de hoy (en Madrid).
export function diasHabiles(ahora = new Date(), n = AGENDA.diasHabiles) {
  const dias = [];
  let dia = enMadrid(ahora).dia;
  while (dias.length < n) {
    dia = siguienteDia(dia);
    if (esHabil(dia)) dias.push(dia);
  }
  return dias;
}

// Horas de inicio de un día: 10:00, 10:30… 13:30 y 16:00… 18:30.
export function horasDelDia() {
  const horas = [];
  for (const [desde, hasta] of AGENDA.franjas) {
    const aMin = (h) => Number(h.slice(0, 2)) * 60 + Number(h.slice(3));
    for (let m = aMin(desde); m + AGENDA.duracion <= aMin(hasta); m += AGENDA.duracion) {
      horas.push(`${String(Math.floor(m / 60)).padStart(2, "0")}:${String(m % 60).padStart(2, "0")}`);
    }
  }
  return horas;
}

// Huecos de la ventana: [{ dia, horas: [{ hora, inicio (ISO UTC), libre }] }]. `ocupados`: inicios ISO.
export function huecos(ahora = new Date(), ocupados = []) {
  const tomados = new Set(ocupados.map((x) => new Date(x).toISOString()));
  return diasHabiles(ahora).map((dia) => ({
    dia,
    horas: horasDelDia().map((hora) => {
      const inicio = madridAUtc(dia, hora).toISOString();
      return { hora, inicio, libre: !tomados.has(inicio) };
    }),
  }));
}

// ¿Es `inicio` (ISO) un hueco de la ventana actual? (No mira si está ocupado.)
export function esHueco(inicio, ahora = new Date()) {
  const f = new Date(inicio);
  if (Number.isNaN(f.getTime())) return false;
  const iso = f.toISOString();
  return huecos(ahora).some((d) => d.horas.some((h) => h.inicio === iso));
}

// --- Calendario (.ics) ------------------------------------------------------------------------------

const icsFecha = (f) => f.toISOString().replace(/[-:]/g, "").replace(/\.\d{3}/, "");
const icsTexto = (s) => String(s ?? "").replace(/\\/g, "\\\\").replace(/;/g, "\\;").replace(/,/g, "\\,").replace(/\r?\n/g, "\\n");

// Evento para añadir al calendario (RFC 5545), con aviso una hora antes.
export function ics({ uid, inicio, titulo, descripcion, url, organizador }) {
  const f = new Date(inicio);
  const fin = new Date(f.getTime() + AGENDA.duracion * 60000);
  return [
    "BEGIN:VCALENDAR", "VERSION:2.0", "PRODID:-//Banteq//Reservas//ES", "CALSCALE:GREGORIAN", "METHOD:PUBLISH",
    "BEGIN:VEVENT",
    `UID:${uid}`, `DTSTAMP:${icsFecha(new Date())}`, `DTSTART:${icsFecha(f)}`, `DTEND:${icsFecha(fin)}`,
    `SUMMARY:${icsTexto(titulo)}`, `DESCRIPTION:${icsTexto(descripcion)}`,
    ...(url ? [`URL:${url}`, `LOCATION:${icsTexto(url)}`] : []),
    ...(organizador ? [`ORGANIZER;CN=Banteq:mailto:${organizador}`] : []),
    "BEGIN:VALARM", "TRIGGER:-PT60M", "ACTION:DISPLAY", `DESCRIPTION:${icsTexto(titulo)}`, "END:VALARM",
    "END:VEVENT", "END:VCALENDAR", "",
  ].join("\r\n");
}
