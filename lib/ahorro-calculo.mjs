// Calculadora «¿Cuánto me ahorro?» (área de seguimiento de retrasos). Un solo cálculo para la
// página (/automatizaciones/seguimiento/ahorro, se copia junto a ella al compilar) y para
// api/ahorro.js, que lo repite con los valores recibidos: el correo a Banteq nunca se fía de las
// cifras que manda el navegador. Las condiciones de precio están en el apartado 8 del aviso legal.

// Controles: clave, rango, paso y valor por defecto (los fijó Pol el 2026-11-24).
export const CONTROLES = [
  { clave: "correosDia", min: 5, max: 300, paso: 5, defecto: 40 },
  { clave: "minCorreo", min: 1, max: 15, paso: 1, defecto: 6 },
  { clave: "minSeguimiento", min: 0, max: 10, paso: 1, defecto: 2 },
  { clave: "automatizable", min: 50, max: 100, paso: 5, defecto: 85 },
  { clave: "dias", min: 200, max: 260, paso: 5, defecto: 220 },
  { clave: "costeHora", min: 10, max: 40, paso: 1, defecto: 16 },
];

export const HORAS_JORNADA_AÑO = 1760;
export const PARTE_MANTENIMIENTO = 0.25;

export const VALORES_DEFECTO = Object.fromEntries(CONTROLES.map((c) => [c.clave, c.defecto]));

// Herramientas incluidas según el volumen: hasta 50 correos/día, 30 €; de 51 a 150, 60 €; de 151 a 300, 100 €.
export function herramientasMes(correosDia) {
  if (correosDia <= 50) return 30;
  if (correosDia <= 150) return 60;
  return 100;
}

// Valores válidos (dentro de rango y en un paso exacto) o null si alguno no lo es.
export function validarValores(entrada) {
  const valores = {};
  for (const { clave, min, max, paso } of CONTROLES) {
    const v = Number(entrada?.[clave]);
    if (!Number.isFinite(v) || v < min || v > max || Math.abs((v - min) / paso - Math.round((v - min) / paso)) > 1e-9) return null;
    valores[clave] = v;
  }
  return valores;
}

const redondear = (n, decimales = 0) => {
  const f = 10 ** decimales;
  return Math.round((n + Number.EPSILON) * f) / f;
};

// Cálculo exacto con las fórmulas acordadas; `redondeado` es lo que se enseña (euros sin decimales,
// horas enteras, empleados con 2 decimales).
export function calcular(v) {
  const horasAño = (v.correosDia * (v.minCorreo + v.minSeguimiento) * (v.automatizable / 100) * v.dias) / 60;
  const ahorroBrutoMes = (horasAño * v.costeHora) / 12;
  const herramientas = herramientasMes(v.correosDia);
  const ahorroMes = Math.max(0, ahorroBrutoMes - herramientas);
  const implantacion = ahorroMes;
  const mantenimientoMes = PARTE_MANTENIMIENTO * ahorroMes;
  const gananciaClienteMes = (1 - PARTE_MANTENIMIENTO) * ahorroMes;
  const gananciaClienteAño = 12 * gananciaClienteMes;
  const gananciaPrimerAño = gananciaClienteAño - implantacion;
  const exacto = {
    horasAño, empleados: horasAño / HORAS_JORNADA_AÑO, ahorroBrutoMes, herramientasMes: herramientas, ahorroMes,
    implantacion, mantenimientoMes, gananciaClienteMes, gananciaClienteAño, gananciaPrimerAño,
  };
  const redondeado = Object.fromEntries(Object.entries(exacto).map(([k, n]) => [k, redondear(n, k === "empleados" ? 2 : 0)]));
  return { ...exacto, redondeado, compensa: redondeado.ahorroMes > 0 };
}

// Formato es-ES: «11.698», «0,57». Intl en es-ES no separa los miles de números de cuatro cifras
// («1330»); useGrouping «always» los separa siempre («1.330»), que es lo que se lee en un precio.
export function formatoNumero(n, decimales = 0) {
  const opciones = { minimumFractionDigits: decimales, maximumFractionDigits: decimales, useGrouping: "always" };
  try {
    return new Intl.NumberFormat("es-ES", opciones).format(redondear(n, decimales));
  } catch {
    return new Intl.NumberFormat("es-ES", { ...opciones, useGrouping: true }).format(redondear(n, decimales));
  }
}
// Espacio duro entre la cifra y el símbolo: «1.300 €» no se parte en dos líneas.
export const formatoEuros = (n) => `${formatoNumero(n)}\u00a0€`;
