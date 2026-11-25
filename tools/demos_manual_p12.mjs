// Manual de ejemplo de la demostración «Asistentes de IA»: mantenimiento de la prensa hidráulica
// P-12 de una empresa ficticia (la misma prensa que la animación de la home). Inventado; los datos
// técnicos son verosímiles pero no son de ningún fabricante. tools/demos_ejemplos.mjs lo convierte
// en PDF (uno por idioma) y tests/asistente-busqueda.test.mjs lo usa para probar el buscador.
//
// Cada capítulo: [título, [[apartado, [párrafos o pasos «1. …»]], …]]. 23 apartados.

export const MANUAL = {
  es: {
    archivo: "manual-prensa-P-12.pdf",
    titulo: "Manual de mantenimiento · Prensa hidráulica P-12",
    subtitulo: "Talleres Riera S.L. · Revisión 4 · Documento de ejemplo con datos ficticios",
    capitulos: [
      ["1. Datos generales", [
        ["1.1 Identificación de la máquina", ["Prensa hidráulica de columnas P-12, con una fuerza nominal de 120 toneladas. Número de serie P12-0457, instalada en 2019 en la nave 2."]],
        ["1.2 Características técnicas", ["La presión nominal de trabajo es de 180 bar. La válvula de seguridad está tarada a 210 bar, que es la presión máxima.", "El depósito tiene 160 litros de aceite. El motor de la bomba es de 11 kW y la carrera de la corredera, de 400 mm."]],
      ]],
      ["2. Seguridad", [
        ["2.1 Equipos de protección", ["Para trabajar en la prensa son obligatorios gafas de seguridad, guantes anticorte y calzado de seguridad. Si el ruido supera 80 dB, también protectores auditivos."]],
        ["2.2 Bloqueo y consignación", ["Antes de cualquier intervención de mantenimiento:", "1. Para la máquina y desconecta el interruptor general.", "2. Bloquea el interruptor con tu candado personal y coloca la tarjeta de aviso.", "3. Descarga la presión del circuito hidráulico.", "4. Comprueba que no queda energía antes de empezar."]],
        ["2.3 Dispositivos de seguridad", ["La prensa tiene barrera fotoeléctrica, mando bimanual y parada de emergencia. Compruébalos al empezar cada turno. Si alguno no funciona, no se puede trabajar con la prensa."]],
      ]],
      ["3. Puesta en marcha", [
        ["3.1 Comprobaciones antes de arrancar", ["Revisa el nivel de aceite en el visor, que no haya fugas debajo de la máquina, que la barrera fotoeléctrica funcione y que el utillaje esté bien fijado."]],
        ["3.2 Arranque", ["Gira el interruptor general, pulsa marcha de la bomba y espera dos minutos para que el aceite se caliente. Haz un ciclo en vacío antes de la primera pieza."]],
        ["3.3 Parada al final del turno", ["Sube la corredera al punto muerto superior, para la bomba, desconecta el interruptor general y limpia la mesa de trabajo."]],
      ]],
      ["4. Sistema hidráulico", [
        ["4.1 Aceite recomendado", ["Usa aceite hidráulico HLP 46 (ISO VG 46). Si la nave está por debajo de 10 °C, HLP 32. No mezcles aceites de marcas distintas."]],
        ["4.2 Nivel de aceite", ["Comprueba el nivel cada día en el visor del depósito, con la corredera arriba. El nivel tiene que quedar entre las marcas MIN y MAX."]],
        ["4.3 Cambio de aceite", ["El aceite hidráulico se cambia cada 2.000 horas de funcionamiento o una vez al año, lo que llegue antes. Vacía el depósito con el aceite templado, límpialo, cambia el filtro de retorno y rellena con 160 litros."]],
        ["4.4 Filtros", ["El filtro de retorno se cambia cada 500 horas o cuando su indicador se ponga en rojo. El filtro de aire del depósito, cada 1.000 horas."]],
        ["4.5 Ajuste de la presión", ["Solo el personal autorizado puede ajustar la presión. Se regula en la válvula V2 hasta 180 bar, mirando el manómetro M1. Nunca se debe superar 210 bar."]],
      ]],
      ["5. Mantenimiento preventivo", [
        ["5.1 Tareas diarias", ["Comprueba el nivel de aceite, busca fugas, prueba la barrera fotoeléctrica y limpia la mesa al terminar."]],
        ["5.2 Tareas semanales", ["Engrasa las guías de la corredera con grasa EP2, revisa el apriete de los tornillos del utillaje y el estado de los latiguillos."]],
        ["5.3 Tareas mensuales", ["Limpia el radiador del intercambiador, comprueba que la temperatura del aceite no pasa de 55 °C mientras trabaja y prueba la parada de emergencia."]],
        ["5.4 Mantenimiento trimestral", ["1. Desconecta y bloquea la alimentación (apartado 2.2).", "2. Revisa el nivel y el filtro del aceite.", "3. Comprueba la presión: 180 bar en el manómetro M1.", "4. Anota la revisión en el parte de mantenimiento."]],
        ["5.5 Revisión anual", ["Una vez al año: cambio de aceite, revisión eléctrica completa, calibración del manómetro e inspección de las columnas y la estructura."]],
      ]],
      ["6. Averías frecuentes", [
        ["6.1 La prensa pierde presión", ["Si la prensa pierde presión, comprueba primero el nivel de aceite y busca fugas en latiguillos y racores. Si sigue perdiendo presión, avisa al responsable de mantenimiento: puede ser una fuga interna del cilindro. No toques la válvula de seguridad."]],
        ["6.2 Ruido en la bomba", ["Un ruido fuerte en la bomba suele indicar aire en el circuito o el filtro de aspiración obstruido. Revisa el nivel de aceite y purga el circuito."]],
        ["6.3 Aceite demasiado caliente", ["Si el aceite pasa de 60 °C, para la prensa. Limpia el radiador, comprueba que el ventilador gira y revisa el nivel de aceite."]],
        ["6.4 La corredera baja sola", ["Si la corredera baja sola con la máquina parada, puede fallar la válvula antirretorno. Detén la prensa, bloquéala y avisa a mantenimiento. No trabajes nunca debajo de la corredera."]],
      ]],
      ["7. Registro", [
        ["7.1 Parte de mantenimiento", ["Cada intervención se anota en el parte: fecha, horas de funcionamiento, tareas hechas y quién las ha hecho. Los partes se guardan cinco años."]],
      ]],
    ],
    sugerencias: ["¿Cada cuánto se cambia el aceite?", "¿Qué hago si la prensa pierde presión?", "¿Cuánto cuesta una prensa nueva?"],
  },
  ca: {
    archivo: "manual-premsa-P-12.pdf",
    titulo: "Manual de manteniment · Premsa hidràulica P-12",
    subtitulo: "Talleres Riera S.L. · Revisió 4 · Document d'exemple amb dades fictícies",
    capitulos: [
      ["1. Dades generals", [
        ["1.1 Identificació de la màquina", ["Premsa hidràulica de columnes P-12, amb una força nominal de 120 tones. Número de sèrie P12-0457, instal·lada el 2019 a la nau 2."]],
        ["1.2 Característiques tècniques", ["La pressió nominal de treball és de 180 bar. La vàlvula de seguretat està tarada a 210 bar, que és la pressió màxima.", "El dipòsit té 160 litres d'oli. El motor de la bomba és d'11 kW i la cursa de la corredora, de 400 mm."]],
      ]],
      ["2. Seguretat", [
        ["2.1 Equips de protecció", ["Per treballar a la premsa són obligatoris ulleres de seguretat, guants anticorte i calçat de seguretat. Si el soroll supera 80 dB, també protectors auditius."]],
        ["2.2 Bloqueig i consignació", ["Abans de qualsevol intervenció de manteniment:", "1. Atura la màquina i desconnecta l'interruptor general.", "2. Bloqueja l'interruptor amb el teu cadenat personal i posa-hi la targeta d'avís.", "3. Descarrega la pressió del circuit hidràulic.", "4. Comprova que no queda energia abans de començar."]],
        ["2.3 Dispositius de seguretat", ["La premsa té barrera fotoelèctrica, comandament bimanual i parada d'emergència. Comprova'ls en començar cada torn. Si algun no funciona, no es pot treballar amb la premsa."]],
      ]],
      ["3. Posada en marxa", [
        ["3.1 Comprovacions abans d'engegar", ["Revisa el nivell d'oli al visor, que no hi hagi fuites sota la màquina, que la barrera fotoelèctrica funcioni i que l'utillatge estigui ben fixat."]],
        ["3.2 Engegada", ["Gira l'interruptor general, prem marxa de la bomba i espera dos minuts perquè l'oli s'escalfi. Fes un cicle en buit abans de la primera peça."]],
        ["3.3 Aturada al final del torn", ["Puja la corredora al punt mort superior, atura la bomba, desconnecta l'interruptor general i neteja la taula de treball."]],
      ]],
      ["4. Sistema hidràulic", [
        ["4.1 Oli recomanat", ["Fes servir oli hidràulic HLP 46 (ISO VG 46). Si la nau està per sota de 10 °C, HLP 32. No barregis olis de marques diferents."]],
        ["4.2 Nivell d'oli", ["Comprova el nivell cada dia al visor del dipòsit, amb la corredora a dalt. El nivell ha de quedar entre les marques MIN i MAX."]],
        ["4.3 Canvi d'oli", ["L'oli hidràulic es canvia cada 2.000 hores de funcionament o un cop l'any, el que arribi abans. Buida el dipòsit amb l'oli tebi, neteja'l, canvia el filtre de retorn i omple'l amb 160 litres."]],
        ["4.4 Filtres", ["El filtre de retorn es canvia cada 500 hores o quan el seu indicador es posi vermell. El filtre d'aire del dipòsit, cada 1.000 hores."]],
        ["4.5 Ajust de la pressió", ["Només el personal autoritzat pot ajustar la pressió. Es regula a la vàlvula V2 fins a 180 bar, mirant el manòmetre M1. Mai no s'ha de superar 210 bar."]],
      ]],
      ["5. Manteniment preventiu", [
        ["5.1 Tasques diàries", ["Comprova el nivell d'oli, busca fuites, prova la barrera fotoelèctrica i neteja la taula en acabar."]],
        ["5.2 Tasques setmanals", ["Greixa les guies de la corredora amb greix EP2, revisa l'estrenyiment dels cargols de l'utillatge i l'estat dels tubs flexibles."]],
        ["5.3 Tasques mensuals", ["Neteja el radiador de l'intercanviador, comprova que la temperatura de l'oli no passa de 55 °C mentre treballa i prova la parada d'emergència."]],
        ["5.4 Manteniment trimestral", ["1. Desconnecta i bloqueja l'alimentació (apartat 2.2).", "2. Revisa el nivell i el filtre de l'oli.", "3. Comprova la pressió: 180 bar al manòmetre M1.", "4. Anota la revisió al full de manteniment."]],
        ["5.5 Revisió anual", ["Un cop l'any: canvi d'oli, revisió elèctrica completa, calibratge del manòmetre i inspecció de les columnes i l'estructura."]],
      ]],
      ["6. Avaries freqüents", [
        ["6.1 La premsa perd pressió", ["Si la premsa perd pressió, comprova primer el nivell d'oli i busca fuites als tubs flexibles i als racors. Si continua perdent pressió, avisa el responsable de manteniment: pot ser una fuita interna del cilindre. No toquis la vàlvula de seguretat."]],
        ["6.2 Soroll a la bomba", ["Un soroll fort a la bomba sol indicar aire al circuit o el filtre d'aspiració obstruït. Revisa el nivell d'oli i purga el circuit."]],
        ["6.3 Oli massa calent", ["Si l'oli passa de 60 °C, atura la premsa. Neteja el radiador, comprova que el ventilador gira i revisa el nivell d'oli."]],
        ["6.4 La corredora baixa sola", ["Si la corredora baixa sola amb la màquina aturada, pot fallar la vàlvula antiretorn. Atura la premsa, bloqueja-la i avisa manteniment. No treballis mai sota la corredora."]],
      ]],
      ["7. Registre", [
        ["7.1 Full de manteniment", ["Cada intervenció s'anota al full: data, hores de funcionament, tasques fetes i qui les ha fet. Els fulls es guarden cinc anys."]],
      ]],
    ],
    sugerencias: ["Cada quant es canvia l'oli?", "Què faig si la premsa perd pressió?", "Quant costa una premsa nova?"],
  },
  en: {
    archivo: "P-12-press-manual.pdf",
    titulo: "Maintenance manual · P-12 hydraulic press",
    subtitulo: "Talleres Riera S.L. · Revision 4 · Sample document with fictitious data",
    capitulos: [
      ["1. General information", [
        ["1.1 Machine identification", ["P-12 column-type hydraulic press with a rated force of 120 tonnes. Serial number P12-0457, installed in 2019 in building 2."]],
        ["1.2 Technical specifications", ["The rated working pressure is 180 bar. The safety valve is set to 210 bar, which is the maximum pressure.", "The tank holds 160 litres of oil. The pump motor is 11 kW and the ram stroke is 400 mm."]],
      ]],
      ["2. Safety", [
        ["2.1 Protective equipment", ["Safety glasses, cut-resistant gloves and safety footwear are mandatory when working at the press. If noise exceeds 80 dB, ear protection is also required."]],
        ["2.2 Lockout and tagout", ["Before any maintenance work:", "1. Stop the machine and switch off the main isolator.", "2. Lock the isolator with your personal padlock and attach the warning tag.", "3. Release the pressure in the hydraulic circuit.", "4. Check that no energy remains before you start."]],
        ["2.3 Safety devices", ["The press has a light curtain, two-hand control and an emergency stop. Test them at the start of every shift. If any of them fails, the press must not be used."]],
      ]],
      ["3. Start-up", [
        ["3.1 Checks before starting", ["Check the oil level in the sight glass, that there are no leaks under the machine, that the light curtain works and that the tooling is firmly fixed."]],
        ["3.2 Starting", ["Turn the main isolator, press pump start and wait two minutes for the oil to warm up. Run an empty cycle before the first part."]],
        ["3.3 Stopping at the end of the shift", ["Raise the ram to top dead centre, stop the pump, switch off the main isolator and clean the bed."]],
      ]],
      ["4. Hydraulic system", [
        ["4.1 Recommended oil", ["Use HLP 46 hydraulic oil (ISO VG 46). If the workshop is below 10 °C, use HLP 32. Do not mix oils from different brands."]],
        ["4.2 Oil level", ["Check the level every day in the tank sight glass, with the ram raised. The level must be between the MIN and MAX marks."]],
        ["4.3 Oil change", ["The hydraulic oil is changed every 2,000 operating hours or once a year, whichever comes first. Drain the tank while the oil is warm, clean it, replace the return filter and refill with 160 litres."]],
        ["4.4 Filters", ["The return filter is replaced every 500 hours or when its indicator turns red. The tank air filter, every 1,000 hours."]],
        ["4.5 Pressure adjustment", ["Only authorised staff may adjust the pressure. It is set at valve V2 up to 180 bar, reading gauge M1. Never exceed 210 bar."]],
      ]],
      ["5. Preventive maintenance", [
        ["5.1 Daily tasks", ["Check the oil level, look for leaks, test the light curtain and clean the bed at the end."]],
        ["5.2 Weekly tasks", ["Grease the ram guides with EP2 grease, check the tightness of the tooling bolts and the condition of the hoses."]],
        ["5.3 Monthly tasks", ["Clean the heat exchanger radiator, check that the oil temperature stays below 55 °C while running and test the emergency stop."]],
        ["5.4 Quarterly maintenance", ["1. Disconnect and lock out the power supply (section 2.2).", "2. Check the oil level and filter.", "3. Check the pressure: 180 bar on gauge M1.", "4. Log the inspection in the maintenance report."]],
        ["5.5 Annual inspection", ["Once a year: oil change, full electrical inspection, gauge calibration and inspection of the columns and frame."]],
      ]],
      ["6. Common faults", [
        ["6.1 The press loses pressure", ["If the press loses pressure, first check the oil level and look for leaks in hoses and fittings. If it keeps losing pressure, tell the maintenance manager: it may be an internal cylinder leak. Do not touch the safety valve."]],
        ["6.2 Pump noise", ["A loud noise from the pump usually means air in the circuit or a clogged suction filter. Check the oil level and bleed the circuit."]],
        ["6.3 Oil too hot", ["If the oil goes above 60 °C, stop the press. Clean the radiator, check that the fan is turning and check the oil level."]],
        ["6.4 The ram drifts down", ["If the ram drifts down with the machine stopped, the check valve may be failing. Stop the press, lock it out and tell maintenance. Never work under the ram."]],
      ]],
      ["7. Records", [
        ["7.1 Maintenance report", ["Every job is logged in the report: date, operating hours, tasks done and who did them. Reports are kept for five years."]],
      ]],
    ],
    sugerencias: ["How often is the oil changed?", "What do I do if the press loses pressure?", "How much does a new press cost?"],
  },
};
