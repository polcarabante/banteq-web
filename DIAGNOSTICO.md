# Diagnósticos de Banteq

La ruta `/diagnostico` se genera desde `assets-banteq/diagnostico/cuestionario-procesos.src.html` con `tools/diagnostico.py`, invocado por el generador normal de la web. No editar directamente `public/diagnostico.html`.

`api/diagnosticos.js` valida el envío y utiliza `lib/notion-diagnostico.mjs` para adjuntar las respuestas originales y preparar tres páginas: procesos, oportunidades y propuesta comercial interna. Además genera en memoria dos PDF (procesos y oportunidades) con `lib/diagnostico-pdf.mjs` y los sube a la propiedad **Adjuntar archivo** del proyecto. No adjunta la propuesta comercial interna al PDF del cliente. El motor es determinista; no invoca un servicio de IA ni envía los borradores al cliente. Los hallazgos conservan la referencia al proceso y los datos desconocidos quedan pendientes de revisión.

## Configuración de servidor

Crear una integración interna de Notion con lectura, inserción y actualización, y acceso solo a Proyectos. Configurar como secreto de servidor `NOTION_DIAGNOSTIC_TOKEN` y como variable `NOTION_PROJECTS_DATA_SOURCE_ID=40bbb7ce-1909-801d-a08f-000b9ca8e79d` en Vercel, en los entornos de prueba y producción que corresponda. La conexión de Notion del chat no proporciona credenciales a las funciones desplegadas.

Esquema esperado: Nombre del proyecto (título), Estado con Sin empezar, Prioridad con Alta, Fecha de inicio, Fecha de finalización, Referencia diagnóstico (texto), Facturación declarada (texto), Honorarios propuestos (€) (número), Revisión diagnóstico con Pendiente y Adjuntar archivo (archivos). Estos campos se verificaron y los cuatro últimos se añadieron en la sesión de preparación.

Sin credenciales, el endpoint devuelve 503. El servidor local usa el endpoint real del diagnóstico y no simula éxito. Para probar la conexión real en local, configurar las variables mediante un entorno seguro; no dejar claves en archivos versionados.

Los precios de `lib/diagnostico.mjs` son una propuesta inicial pendiente de aprobación, no un presupuesto aceptado. El plazo de contacto se guarda con 72 horas naturales desde la recepción inicial.

## Validación

Ejecutar `node --test tests/diagnostico.test.mjs`. Las pruebas usan un proveedor simulado y no envían datos al exterior.

Después de configurar credenciales, probar desde el navegador con una empresa ficticia: comprobar respuesta original, tres páginas, dos PDF en Adjuntar archivo, honorarios propuestos y vencimiento; repetir el envío sin editar y verificar la misma referencia. No confundir el éxito de las pruebas simuladas con una conexión de producción probada.

Antes de abrir a público: completar los datos pendientes de la política de privacidad, revisar la vista de escritorio y móvil y las páginas prerenderizadas, activar protección distribuida frente a spam y envíos concurrentes según el volumen previsto. La búsqueda de referencias de Notion reduce duplicados normales, pero no impone unicidad entre instancias simultáneas. No se han provisionado servicios adicionales.

Los PDF originales y su generador local no se han modificado. Esta integración conserva las páginas editables y adjunta los dos PDF de los borradores nuevos. Banteq debe revisarlos antes de entregar. El envío solo se confirma tras comprobar ambos PDF en la propiedad. Los reintentos conservan los adjuntos existentes y no vuelven a subir archivos del mismo nombre; si falla el segundo PDF, se reanuda desde él. Los borradores anteriores sin PDF se completan al reprocesar sus mismas respuestas con su referencia original.
