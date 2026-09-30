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

## B líquida del hero

El fondo del hero es una B de cristal líquido negro (referencia: `assets-banteq/referencias/hero-b-referencia.webp`).

- **Movimiento continuo**: vídeo generado con Higgsfield. GPT Image 2.5 quitó textos y botones de la
  referencia; MiniMax H3 animó la imagen limpia usándola como primer y último fotograma (bucle sin
  cortes). `tools/hero_b.py` hace el resto: deshace el degradado del hero para que el color final
  coincida con la referencia, reparte el movimiento de forma uniforme (el modelo frenaba al final),
  codifica escritorio (1920 × 1080, 0,9 MB) y móvil (720 × 1200 con la B entera, 0,5 MB), y crea
  pósteres y máscara.
- **Reacción al cursor**: `assets-banteq/web/banteq-liquid.js`. Un lienzo WebGL transparente, encima
  del vídeo, usa el propio vídeo como textura y pinta solo la zona deformada: alrededor del cursor
  (radio 100–170 px) el líquido se hunde y se aparta, y al irse vuelve con un pequeño rebote y ondas.
  Solo actúa sobre la B.
- **Rendimiento**: en reposo no hay WebGL ni bucle de animación: se ve el `<video>` nativo
  (decodificado y compuesto por hardware). El lienzo solo dibuja mientras el cursor está cerca de la
  B y se oculta en cuanto el líquido se asienta. `pointermove` solo guarda coordenadas (sin medir el
  layout). Se pausa con la pestaña oculta o el hero fuera de pantalla. Si el equipo no llega a
  ~50 FPS baja la resolución interna (hasta el 60 %) y la recupera cuando va holgado; **nunca**
  desactiva la interacción por tiempos. Sin WebGL o en equipos muy modestos, solo vídeo. Con
  "reducir movimiento", la B queda quieta.

Para regenerar el vídeo a partir de uno nuevo de Higgsfield:

```bash
python3 tools/hero_b.py video ruta/al/video.mp4
npm run build
```

## Rendimiento

Auditado con trazas de Chrome (GPU real) antes y después; los arreglos están en `tools/build.py`
(`apply_performance`, `convert_heavy_images`) y en `assets-banteq/web/`. No cambian nada visible.

| Qué cargaba la página | Arreglo |
|---|---|
| Botón de play oculto de «Quiénes somos»: su Magnetic Hover tenía un `requestAnimationFrame` perpetuo que leía `getComputedStyle` y reescribía una hoja de estilos en cada fotograma (60 recálculos de estilo/s en toda la web) y un `mousemove` que forzaba layout | Componente inerte (sigue oculto) |
| Vídeo del pie en 4K H.264 4:2:2 de 10 bits: sin decodificación por hardware en Mac/iPhone | 1080p 4:2:0 de 8 bits (`tools/videos.py`) |
| Framer guardaba la posición de scroll con `history.replaceState` en cada `scrollend` (con Lenis, cada fotograma) | Se guarda al terminar el scroll |
| Lenis observaba todo el DOM y ejecutaba `querySelector` sobre la página en cada nodo añadido | Solo observa lo necesario |
| Lenis (smooth scroll) movía la página desde JavaScript en cada fotograma: cualquier trabajo del hilo principal se notaba como tirón del scroll, sobre todo en Safari | Scroll nativo (lo hace el compositor del navegador, en otro hilo). Los enlaces a secciones siguen desplazándose con suavidad |
| Ticker de Framer (tiras de herramientas, carrusel de palabras, logos del hero): al entrar o salir de pantalla re-renderizaba React y ponía/quitaba `will-change` en cada copia de cada elemento (decenas de capas creadas de golpe: fotogramas de 40–75 ms en Safari al entrar) | Una capa estable por tira, animación de compositor, una sola copia extra (tiras un 33–50 % más estrechas); la pausa fuera de pantalla la hace `banteq.js` sin tocar React |
| Fichas de «Conectamos tus herramientas»: dos sombras interiores con desenfoque que Safari pinta en el hilo principal | Mismo aspecto con contorno y degradado sin desenfoque |
| El gestor de cursores de Framer leía en cada fotograma aunque la web no tiene cursores propios: con los tickers de «Conectamos tus herramientas» en pantalla, el hilo principal producía un fotograma por refresco | Solo mira al mover el puntero |
| Reveal Text importaba Urbanist de Google Fonts sin usarla | Eliminado (sin peticiones a terceros) |
| `filter: blur(0px)` residual en 23 elementos del hero tras su animación | `filter: none` al terminar |
| B líquida: shader a pantalla completa 30 veces/s en reposo | Vídeo nativo en reposo; shader solo en la zona deformada |
| Móvil: podía descargar también el vídeo de escritorio | Se elige el vídeo antes de que arranque Framer |
| PNG pesadas (capturas, tarjetas, retratos) | WebP (la imagen para redes sigue en PNG). Las PNG originales se siguen publicando: una página o caché anterior las pediría |

Medido en Chrome con GPU (Apple M3, 1440 × 900 a DPR 2) y en WebKit, el motor de Safari
(scripts en la carpeta temporal de la sesión; se pueden rehacer). Durante un scroll de toda la página
a 1500 px/s, hilo principal original → ahora: 270 → 190 ms/s (JavaScript 142 → 67, estilo 51 → 16);
en móvil con la CPU a ¼: 731 → 426 ms/s. En WebKit, el mismo scroll pasa de 22 FPS a 60 FPS, y el
tirón al entrar en «Conectamos tus herramientas» baja de 54–59 ms a 25 ms. En reposo, el hilo
principal está prácticamente libre (hero 190 → 4 ms/s). Imágenes de la home: 482 → 210 KB.

## Cuadrado central de «Quiénes somos»

Encima del carrusel de palabras (PROCESOS AUTOMATIZADOS · IA Y COPILOT · WEBS A MEDIDA) hay un
cuadrado opaco con el logotipo de Banteq; el carrusel pasa por detrás. Su contenido se define en
`tools/contenido.py` → `CUADRO_CENTRAL`:

- **Logo** (ahora): `python3 tools/assets.py cuadro` genera `cuadro-logo.png`.
- **Vídeo** (más adelante): copia el `.mp4` (y un póster `.jpg` opcional) a `assets-banteq/web/`,
  escribe sus nombres en `"video"` y `"poster"` y ejecuta `npm run build`. El vídeo se coloca encima
  del logo, a pantalla del cuadrado, y solo se reproduce mientras se ve.

El aspecto (tamaño, esquinas, fondo, sombra) está en `assets-banteq/web/banteq.css`.

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
