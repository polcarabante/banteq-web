# Web de Banteq

Web de Banteq construida sobre la plantilla de Framer exportada (`site-export-1790717808575.zip`),
conservando su estructura, animaciones, efectos de scroll, responsive y componentes. Referencia
visual de la plantilla original: https://breathtaking-step-882598.framer.app

**No está desplegada.** Solo se sirve en local para revisión.

## Verla en local

Solo hace falta Node 18 o superior (no hay dependencias que instalar):

```bash
cd ~/Desktop/BANTEQ/banteq-web
npm run dev
```

Abre http://localhost:4400 y deja la terminal abierta mientras la revisas (Ctrl+C para pararla).
Si el puerto 4400 está ocupado por otro programa: `PORT=4401 npm run dev`.

El servidor local también responde a `/api/leads`: el formulario funciona de principio a fin,
pero en local no guarda ni envía nada (solo lo muestra en la terminal).

No abras `public/index.html` con doble clic: Framer carga módulos JavaScript que el navegador
bloquea desde `file://`, y la página se queda en blanco. Siempre a través del servidor.

## Cómo está montado

| Carpeta / archivo | Qué es |
|---|---|
| `plantilla-original/` | La exportación de Framer tal cual, sin tocar. Es la fuente. |
| `tools/contenido.py` | **Todos los textos de Banteq**: secciones, proyectos, FAQ, contacto, legales. |
| `tools/build.py` | Aplica Banteq sobre la plantilla y genera `public/`. |
| `tools/assets.py` | Genera logo, iconos, ilustraciones e imágenes de proyectos (`assets-banteq/generado/`). |
| `tools/framercms.py` | Lee y escribe el CMS binario de Framer (proyectos de Margon y RentUp). |
| `assets-banteq/web/` | CSS y JS propios de Banteq (colores, ocultar restos, envío del formulario). |
| `assets-banteq/capturas/` | Capturas reales de las webs de Margon y RentUp. |
| `public/` | La web final que se sirve. **Se regenera entera**: no editar a mano. |
| `api/leads.js` | Endpoint del formulario para el despliegue (Brevo). Variables en `.env.example`. |

Framer pinta la página con React a partir de sus módulos `.mjs`; el HTML exportado es solo la
primera pintura. Por eso cada texto se cambia en los dos sitios, y por eso los cambios se hacen
con el script y no a mano.

### Cambiar un texto

1. Edita `tools/contenido.py`.
2. Ejecuta `npm run build` (equivale a `python3 tools/build.py`).
3. Recarga el navegador (no hace falta reiniciar el servidor).

Si un texto original de la plantilla no aparece donde se espera, el build se detiene y dice cuál.
También se detiene si algún HTML queda mal anidado: una etiqueta mal cerrada saca contenido
fuera de la zona que controla React y aparece duplicado bajo el pie.

### Regenerar imágenes

`python3 tools/assets.py` (usa Chrome y `puppeteer-core` del proyecto de Margon) y después
`python3 tools/build.py`.

## Estructura de la home

1. Hero: "Tecnología que mejora cómo trabaja tu empresa" + carrusel "Empresas que ya confían en Banteq" (Margon, RentUp Capital)
2. 001 Quiénes somos
3. 002 Por qué Banteq
4. 003 Automatización e IA (procesos, asistentes IA, ventas y CRM, informes, Microsoft Copilot, seguridad)
5. 004 Microsoft Copilot y formación FUNDAE (enlace al simulador oficial de crédito)
6. 005 Desarrollo web (diseño, rediseño, experiencias interactivas, formularios, integraciones, responsive, a medida)
7. 006 Proyectos: Margon y RentUp Capital, con página propia en `/proyectos/margon` y `/proyectos/rentup-capital`
8. 007 Cómo trabajamos
9. 008 Herramientas
10. 009 Preguntas frecuentes
11. Formulario de contacto (en todas las páginas)

Páginas: `/contacto`, `/proyectos`, `/aviso-legal`, `/privacidad` y 404.

La sección de equipo de la plantilla se ha eliminado (no hay equipo documentado) y la de
testimonios se ha reconvertido en "Desarrollo web" (no hay testimonios reales).

## De dónde sale el contenido

- **Servicios, Copilot, FUNDAE, proceso, seguridad, FAQ**: web anterior de Kairvia (solo como fuente; la marca no aparece).
- **Margon**: repositorio `~/margon-web` (cinco idiomas, páginas por sector, recorrido interactivo, 3D, configurador, noticias y newsletter).
- **RentUp Capital**: repositorio `~/Desktop/PÁGINAS WEB/rentupv2` y la web en producción (11 páginas, 3 formularios con Brevo y Resend).
- No hay cifras de resultados, testimonios ni proyectos inventados.

## Pendiente de decidir o completar

- **Datos legales** del titular (razón social, NIF, domicilio, email): aviso legal y privacidad los marcan como pendientes.
- **Email / teléfono / WhatsApp** de contacto de Banteq (la página de contacto no muestra ninguno).
- **Zona**: aparece "Santa Perpètua de Mogoda, Barcelona" (de los emails de prospección). Confirmar.
- **Logo**: no había logo de Banteq en los archivos; el símbolo (dos bloques que forman una B) y el logotipo en minúsculas son una propuesta.
- **Colores**: base monocroma de la plantilla + iridiscencia fría (azul Banteq `#5f7dff`). Propuesta.
- **Margon**: la web nueva aún no está publicada (margon.es sigue siendo la anterior). Decidir si se muestra el caso antes del lanzamiento.
- **Redes sociales**: ocultas en el pie hasta tener perfiles.
- **Despliegue**: `vercel.json` y `api/leads.js` preparados; faltan las variables de Brevo.
