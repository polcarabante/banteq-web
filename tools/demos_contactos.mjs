// Lista de contactos de ejemplo de la demostración «Ventas y CRM» (inventados). Incluye a propósito
// un duplicado de un contacto que ya está en el CRM (Laura Gómez, LEAD-0086), otro repetido dentro
// del propio archivo (Marc Vidal) y un correo mal escrito. tools/demos_ejemplos.mjs genera con ella
// los CSV y Excel de ejemplo en castellano, catalán e inglés.

const FILAS = [
  ["Laura Gómez", "Talleres Gómez", "laura@talleresgomez.es", "", ["Queremos ampliar el pedido de piezas", "Volem ampliar la comanda de peces", "We'd like to increase our parts order"], "Web"],
  ["Marc Vidal", "Mecanizados Rubí S.L.", "marc.vidal@mecanizadosrubi.es", "600 000 112", ["Necesito presupuesto para automatizar pedidos esta semana", "Necessito pressupost per automatitzar comandes aquesta setmana", "I need a quote to automate orders this week"], "Google"],
  ["Carla Domènech", "Clínica Dental Domènech", "recepcion@clinicadomenech.es", "600 000 134", ["¿Podéis gestionar las citas por WhatsApp?", "Podeu gestionar les cites per WhatsApp?", "Can you handle appointments via WhatsApp?"], "Web"],
  ["Jordi Serra", "", "jserra.info@gmail.com", "", ["Información general", "Informació general", "General information"], "Instagram"],
  ["Sònia Ferrer", "Transportes Ferrer", "sonia@transportesferrer.es", "600 000 145", ["Queremos una demo del seguimiento de pedidos", "Volem una demo del seguiment de comandes", "We'd like a demo of order tracking"], ["Feria", "Fira", "Trade show"]],
  ["Marc Vidal", "Mecanizados Rubí", "marc.vidal@mecanizadosrubi.es", "", ["", "", ""], "LinkedIn"],
  ["Pedro Ruiz", "Reformas Ruiz", "pedro.reformasruiz@hotmail.com", "600 000 178", ["¿Trabajáis con empresas pequeñas?", "Treballeu amb empreses petites?", "Do you work with small companies?"], ["Recomendación de un cliente", "Recomanació d'un client", "Referral from a client"]],
  ["Anna Puig", "Restaurante Can Puig", "anna@canpuig", "", ["Reservas online", "Reserves en línia", "Online bookings"], "Web"],
  ["Elena Lluch", "Asesoría Lluch", "elena@asesorialluch.es", "", ["Me interesa automatizar la facturación", "M'interessa automatitzar la facturació", "I'm interested in automating invoicing"], ["Email", "Correu", "Email"]],
];

export const CONTACTOS = Object.fromEntries(
  [["es", 0, "contactos-ejemplo", ["Nombre", "Empresa", "Email", "Teléfono", "Comentarios", "Origen"], ";"],
   ["ca", 1, "contactes-exemple", ["Nom", "Empresa", "Correu", "Telèfon", "Comentaris", "Origen"], ";"],
   ["en", 2, "contacts-sample", ["Name", "Company", "Email", "Phone", "Notes", "Source"], ","]]
    .map(([idioma, i, archivo, cabecera, sep]) => [idioma, {
      archivo, sep,
      filas: [cabecera, ...FILAS.map(([n, e, m, t, coment, origen]) => [n, e, m, t, coment[i], Array.isArray(origen) ? origen[i] : origen])],
    }]),
);
