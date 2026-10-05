# Web de Banteq

Web de Banteq construida sobre la plantilla de Framer exportada (`site-export-1790717808575.zip`),
conservando su estructura, animaciones, efectos de scroll, responsive y componentes. Referencia
visual de la plantilla original: https://breathtaking-step-882598.framer.app

Se publica en Vercel desde `main` como sitio estático (ver «Despliegue en Vercel»).

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
| `tools/servidor-local.mjs` | Servidor para revisar la web en local (`npm run dev`). No se despliega. |
| `vercel.json`, `.vercelignore` | Despliegue en Vercel como sitio estático (ver abajo). |

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

### Favicon e iconos

El favicon de Banteq de siempre: la B blanca en un círculo `#0f0f0f` (`favicon-256`) y, para iOS, en
un cuadrado `#0f0f0f` (`apple-icon-180`), ambos dibujados en `tools/assets.py` → `brand()`.
`tools/build.py` → `apply_icons()` publica en la raíz:

| Archivo | Para qué |
| --- | --- |
| `favicon.ico` (16, 32 y 48) y `favicon.png` (32) | Pestañas, marcadores y buscadores (piden `/favicon.ico` aunque la página declare otro) |
| `apple-touch-icon.png` (180, opaco) | iPhone y iPad: pantalla de inicio, favoritos y sugerencias de Safari. También como `apple-touch-icon-precomposed.png`, que iOS pide por su cuenta |
| `site.webmanifest` + `icon-192.png`, `icon-512.png`, `icon-maskable-512.png` | Android (acceso directo; `display: browser`, abre la web en el navegador). Mismo dibujo renderizado a más resolución; el «maskable» es el cuadrado de iOS, con la B dentro de la zona segura |

Las etiquetas del `<head>` (todas las páginas, sin `media`) llevan `?v=<huella de los píxeles de los
iconos>`: Safari guarda los favicons en una caché propia por URL que no respeta las cabeceras HTTP y
también recuerda cuándo no encontró ninguno (durante el primer despliegue todo respondía 500); con
una URL nueva lo vuelve a pedir. En un iPhone que siga mostrando el icono genérico: Ajustes → Apps →
Safari → Avanzado → Datos de sitios web → borrar `banteq.com`, cerrar Safari y volver a abrir la web
(un acceso directo de la pantalla de inicio hay que quitarlo y añadirlo de nuevo).

## Despliegue en Vercel

La web es estática: Vercel sirve tal cual la carpeta `public/` (ya generada y versionada) y la única
función es `api/leads.js` (el formulario). No se ejecuta Python en Vercel; `tools/build.py` se usa
en local antes de hacer commit.

- `vercel.json` → `"framework": null` (sitio estático, preset «Other»), `outputDirectory: public` y
  un `buildCommand` que no hace nada. El `framework` del archivo manda sobre el preset guardado en el
  panel de Vercel.
- `.vercelignore` → no sube la plantilla original, las herramientas ni las fuentes de los recursos.
- **No crear `server.js`/`server.mjs`/`server.ts` en la raíz ni en `src/`.** Vercel detecta esos
  nombres como el servidor de la web (preset «Node»), los convierte en una función y le envía todas
  las peticiones, incluidos `/` y `/favicon.ico`. Así se rompió el primer despliegue (500
  `INTERNAL_FUNCTION_INVOCATION_FAILED` en todas las rutas): el antiguo `server.mjs` del servidor
  local estaba en la raíz. Por eso ahora es `tools/servidor-local.mjs`.

Para comprobar lo que generará Vercel sin desplegar: `npx vercel build` (crea `.vercel/output`:
`static/` con la web y `functions/api/leads.func`; no debe aparecer ninguna otra función).

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
  (radio 50–85 px, el 4,5 % del ancho del hero; antes 100–170 px) el líquido se hunde y se aparta, y
  al irse vuelve con un pequeño rebote y ondas. Solo actúa sobre la B. El tamaño se cambia en
  `radius` (todo lo demás va en unidades de ese radio, así que la intensidad no cambia).
- **Sin «pared» en los bordes**: la máscara (`hero-b-mask.png`, `python3 tools/hero_b.py mascara`)
  sale de los 87 fotogramas del bucle y no solo del primero, porque el contorno de la B «respira»
  unos píxeles: R es la fracción de fotogramas en que cada píxel es B (borde suave donde se mueve),
  G la zona del cursor (cuándo reacciona y cuánto se hunde) y B una zona de dibujo más ancha, donde
  la refracción no se atenúa, para que el hoyuelo y las ondas crucen el contorno sin aplastarse. En
  el shader no hay cortes en seco: el hoyuelo, las ondas y la opacidad del lienzo llegan a cero de
  forma continua antes del límite del cálculo y del scissor.
- **Rendimiento**: en reposo no hay WebGL ni bucle de animación: se ve el `<video>` nativo
  (decodificado y compuesto por hardware). El lienzo solo dibuja mientras el cursor está cerca de la
  B y se oculta en cuanto el líquido se asienta. `pointermove` solo guarda coordenadas (sin medir el
  layout). Se pausa con la pestaña oculta o el hero fuera de pantalla. Si el equipo no llega a
  ~50 FPS baja la resolución interna (hasta el 60 %) y la recupera cuando va holgado; **nunca**
  desactiva la interacción por tiempos. Sin WebGL o en equipos muy modestos, solo vídeo. Con
  "reducir movimiento", la B queda quieta.

### Carga del hero en móvil y tableta (sin franja)

En móvil y tableta el vídeo de la B no llena el hero: Framer iguala el tono por encima y por debajo
con una capa, «Video Overlay». El HTML exportado es el de escritorio ya hidratado y no la traía (en
escritorio no existe), así que solo aparecía al arrancar React: durante 1–3 s se veía una franja más
oscura arriba y otra abajo. El diseño móvil no se ha tocado; solo cambia lo que se pinta antes de
hidratar:

- `tools/build.py` (`apply_hero_b`) devuelve esa capa al HTML inicial, tal como la pinta React.
  En escritorio no se muestra (`banteq.css`) y Framer la retira al hidratar.
- El contenedor del vídeo lleva el póster y, debajo, un degradado con los grises del fondo del
  vídeo: su hueco tiene el color definitivo aunque el póster aún no haya llegado.
- El póster se precarga al principio del `<head>`.

Medido en WebKit (motor de Safari) a 390 y 430 px, en frío, pestaña nueva y recarga: antes la
franja duraba desde el primer pintado hasta hidratar (~2 s en local); ahora el fondo del primer
fotograma ya es el definitivo.

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

### Rendimiento durante el hover

Segunda auditoría, centrada en mover el cursor (no en el scroll) por «¿Por qué Banteq?» (sección
retirada después; ver «Estructura de la home») y «Conectamos tus herramientas». Medido 25 s por caso con recorridos de ratón rápidos (barridos de
izquierda a derecha, círculos sobre cada tarjeta, entrar y salir de cada tarjeta y del botón
central) en WebKit (WebKitGTK 2.52, el motor de Safari, con el cursor real del sistema) y en Chrome
con trazas. Lo que se ha cambiado:

| Qué cargaba el hover | Arreglo |
|---|---|
| Botón central «B · Hablemos»: Framer Motion animaba por JavaScript el degradado y la sombra interior de 40 px (repintado del círculo en cada fotograma + re-render de React) | Hover en CSS: una capa con el aspecto final exacto del hover que aparece al pasar el cursor, sin repintar. Sin transición ni escala: en WebKit cualquier animación del hover triplicaba los fotogramas lentos |
| Tarjetas de «¿Por qué Banteq?»: 6 `backdrop-filter` (aro del icono y pestaña del número) que WebKit rehacía en cada fotograma | Sin desenfoque (detrás hay fondo oscuro liso: se ve igual). No tenían efecto de hover propio: no se ha añadido ninguno |
| Halo azul del botón central con `filter: blur(20px)` sobre las tiras en movimiento | El mismo halo ya desenfocado como degradado radial (diferencia máx. 3/255) |
| Desvanecido de los extremos de las tiras con `mask-image` | Degradado blanco por encima (el fondo es blanco liso: resultado idéntico) sin máscaras |
| Tiras: al entrar o salir el cursor se reasignaba `playbackRate` a la animación (sin efecto visible) | Eliminado |
| Gestor de cursores de Framer: en cada `pointermove` lanzaba una animación de 0,2 s aunque no hay cursores propios | Ignora el movimiento si no hay cursores registrados |

Las fichas de herramientas no tenían efecto de hover ni listeners propios, y no hay efecto magnético
activo (el Magnetic Hover ya quedó inerte en la auditoría anterior).

| Cursor en movimiento, 25 s | Antes | Ahora |
|---|---|---|
| WebKit · «Conectamos» | 43,6 FPS · 242 fotogramas > 33 ms · 57 > 50 ms · p95 50 ms | 59,3 FPS · 27 > 33 ms · 2 > 50 ms · p95 20 ms |
| WebKit · «¿Por qué Banteq?» | 33 fotogramas > 33 ms · p99 38 ms | 1 > 33 ms · p99 17 ms |
| WebKit · «¿Por qué Banteq?» con el cursor quieto | 26 fotogramas > 33 ms | 1 |
| Chrome · «Conectamos» | 1006 repintados · hilo principal 10,3 % (42 % con CPU ×4) | 0 repintados · 7,2 % (28 %) |

## Cuadrado central de «Quiénes somos»

Encima del carrusel de palabras (PROCESOS AUTOMATIZADOS · IA APLICADA · WEBS A MEDIDA) hay un
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
3. 002 Automatización e IA (procesos, asistentes IA, ventas y CRM, informes, conexión entre herramientas, seguridad)
4. 003 Desarrollo web (diseño, rediseño, experiencias interactivas, formularios, integraciones, responsive, a medida)
5. 004 Proyectos: Margon y RentUp Capital, con página propia en `/proyectos/margon` y `/proyectos/rentup-capital`
6. 005 Cómo trabajamos
7. 006 Herramientas
8. 007 Preguntas frecuentes
9. Formulario de contacto (en todas las páginas)

### «¿Por qué Banteq?» (retirada)

La sección (título, subtítulo y las tres tarjetas: «Primero, el negocio», «De principio a fin»,
«Hecho a medida») no se publica: el build la quita del HTML y del módulo de la home a la vez, igual
que la de Copilot y FUNDAE, y tampoco publica su CSS (bloque `[Value Section]` de `banteq.css`), así
que no se piden sus iconos ni su fondo (4 peticiones menos) y la página es ~970 px más corta en
escritorio (~1.470 px en móvil). «Quiénes somos» enlaza directamente con «Automatización e IA», con
el mismo espacio que hay entre las demás secciones, y la numeración se recalcula sola. Ningún enlace
apuntaba a `#por-que-banteq`. Sus textos siguen en `tools/contenido.py`; para recuperarla:

```bash
# tools/contenido.py → MOSTRAR_POR_QUE_BANTEQ = True
npm run build
```

### Microsoft Copilot y formación FUNDAE (retirados temporalmente)

Mientras no se ofrezcan, no aparecen en ningún sitio de la web publicada: ni la sección «Microsoft
Copilot y formación FUNDAE» (con el enlace al simulador de crédito), ni la tarjeta de Copilot en
servicios (ese hueco lo ocupa «Conexión entre herramientas»), ni la pregunta sobre FUNDAE, ni «IA y
Copilot» en el carrusel, ni las menciones en contacto, aviso legal, metadatos e imagen para redes.
La numeración de secciones se recalcula sola y el build comprueba que no quede ninguna mención. Todo el contenido sigue en `tools/contenido.py`; para volver a mostrarlo:

```bash
# tools/contenido.py → MOSTRAR_COPILOT_FUNDAE = True
python3 tools/assets.py og   # imagen para redes con la línea de servicios completa
npm run build
```

El formulario (`api/leads.js`) mantiene la lista de Brevo de FUNDAE (`BREVO_FUNDAE_LIST_ID`); desde
la web ya no llega ninguna solicitud de ese tipo.

Páginas: `/contacto`, `/proyectos`, `/aviso-legal`, `/privacidad` y 404.

La sección de equipo de la plantilla se ha eliminado (no hay equipo documentado) y la de
testimonios se ha reconvertido en "Desarrollo web" (no hay testimonios reales).

## De dónde sale el contenido

- **Servicios, Copilot y FUNDAE (ahora ocultos), proceso, seguridad, FAQ**: web anterior de Kairvia (solo como fuente; la marca no aparece).
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
- **Formulario en Vercel**: `api/leads.js` necesita las variables de Brevo (`.env.example`) en el proyecto de Vercel.
