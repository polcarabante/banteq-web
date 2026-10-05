// B líquida del hero.
// El vídeo (generado con Higgsfield) da la ondulación continua de la superficie y se muestra siempre
// con el <video> nativo de Framer (decodificación y composición por hardware). Solo cuando el cursor
// se acerca a la B se dibuja encima un lienzo WebGL transparente que usa ese mismo vídeo como textura
// y pinta únicamente la zona deformada: el líquido se hunde y se aparta alrededor del cursor y vuelve
// con un rebote y ondas. Fuera de esa zona el lienzo es transparente (se ve el vídeo nativo, así que
// no hay saltos de color al aparecer o desaparecer) y, en cuanto el líquido se asienta, se oculta y
// deja de dibujarse.
// Sin WebGL, en equipos muy modestos o con "reducir movimiento" queda el vídeo tal cual.
(() => {
  const VIDEO_SELECTOR = '[data-framer-name="Hero Section"] [data-framer-name="Background"] video';
  const SOURCES = {
    escritorio: { src: "/banteq/hero-b.mp4", poster: "/banteq/hero-b-poster.jpg" },
    movil: { src: "/banteq/hero-b-movil.mp4", poster: "/banteq/hero-b-movil-poster.jpg" },
  };
  // El vídeo móvil (720 × 784) es un recorte del fotograma alrededor de la B, con fondo liso
  // (tools/hero_b.py movil): así se lleva su uv a la de la máscara, que es la del fotograma.
  const MOBILE_MAP = [910 / 1920, 991 / 1080, 549 / 1920, 21 / 1080];
  const MASK_SRC = "/banteq/hero-b-mask.png"; // R: la B · G: zona de influencia (B ensanchada)
  const FRAME_W = 1920;
  const FRAME_H = 1080;
  const phone = matchMedia("(max-width: 809.98px)"); // mismo corte que el diseño móvil de Framer

  const reducedMotion = matchMedia("(prefers-reduced-motion: reduce)").matches;
  const cores = navigator.hardwareConcurrency || 8;
  const memory = navigator.deviceMemory || 8;
  const saveData = navigator.connection && navigator.connection.saveData;
  const coarse = matchMedia("(pointer: coarse)").matches;
  // 0: solo vídeo · 1: lienzo a 1× (móvil, 4 núcleos) · 2: hasta 1,25×
  const tier = saveData || cores <= 2 || memory <= 2 ? 0 : coarse || cores <= 4 || memory <= 4 ? 1 : 2;

  const VERT = `attribute vec2 aPos; varying vec2 vUv;
void main() { vUv = aPos * 0.5 + 0.5; gl_Position = vec4(aPos, 0.0, 1.0); }`;

  // Pendiente del líquido calculada analíticamente (una sola evaluación por píxel) y solo cerca del
  // cursor o de un frente de onda. Donde no hay deformación el píxel sale transparente sin leer el
  // vídeo, y se ve el <video> nativo de debajo.
  const FRAG = `#ifdef GL_FRAGMENT_PRECISION_HIGH
precision highp float;
#else
precision mediump float;
#endif
uniform sampler2D uVideo;
uniform sampler2D uMask;
uniform vec2 uRes;        // tamaño del lienzo (px)
uniform vec4 uCover;      // caja → uv del vídeo (object-fit: cover)
uniform vec4 uMaskRect;   // uv del vídeo → uv de la máscara (recorte móvil)
uniform vec2 uPointer;    // cursor suavizado (px del lienzo)
uniform float uDepth;     // hundimiento: 0 en reposo, 1 máximo, < 0 rebote
uniform float uRadius;    // radio de influencia (px del lienzo)
uniform float uRefract;   // desplazamiento máximo aproximado (px del lienzo)
uniform vec4 uRipples[4]; // ondas de retorno: x, y, edad (s), amplitud
varying vec2 vUv;

vec2 videoUv(vec2 p) { return p / uRes * uCover.xy + uCover.zw; }
vec2 maskUv(vec2 uv) { return uv * uMaskRect.xy + uMaskRect.zw; }

void main() {
  vec2 p = vec2(vUv.x, 1.0 - vUv.y) * uRes;
  vec2 uv = videoUv(p);
  float zone = texture2D(uMask, maskUv(uv)).g;
  vec2 slope = vec2(0.0);
  vec2 d = p - uPointer;
  float r = length(d) / uRadius;
  if (zone > 0.002) {
    // Hoyuelo bajo el cursor y el líquido apartado acumulándose en su borde.
    if (r < 1.35) {
      float rim = (r - 0.72) / 0.2;
      float dh = uDepth * (6.4 * r * exp(-3.2 * r * r) - 2.5 * rim * exp(-rim * rim));
      slope += dh * d / max(length(d), 0.001);
    }
    // Ondas de retorno: nacen en el borde del hoyuelo y se abren perdiendo fuerza.
    for (int i = 0; i < 4; i++) {
      vec4 w = uRipples[i];
      if (w.w <= 0.0) continue;
      vec2 dw = p - w.xy;
      float front = 0.55 + w.z * 1.3;
      float x = length(dw) / uRadius - front;
      if (abs(x) > 0.9) continue;
      float amp = w.w * exp(-w.z * 2.4) / front * exp(-7.0 * x * x);
      slope += amp * (-14.0 * x * cos(8.0 * x) - 8.0 * sin(8.0 * x)) * dw / max(length(dw), 0.001);
    }
  }
  float thin = clamp(uDepth, 0.0, 1.0) * exp(-r * r * 4.5) * step(0.002, zone);
  // Solo se pinta donde el líquido está deformado; en el resto se ve el vídeo nativo de debajo.
  float alpha = clamp(length(slope) * 6.0 + thin * 3.0, 0.0, 1.0);
  if (alpha < 0.004) {
    gl_FragColor = vec4(0.0);
  } else {
    vec3 col;
    // Refracción: se muestrea hacia el cursor, así el líquido parece apartarse de él.
    vec2 q = videoUv(p - slope * uRefract * zone);
    col = texture2D(uVideo, q).rgb;
    float liquid = texture2D(uMask, maskUv(q)).r;
    // En el centro del hoyuelo la capa de líquido es más fina: se transparenta el fondo gris.
    col = mix(col, vec3(0.8), thin * 0.4 * liquid);
    // Relieve y brillo de las paredes (luz desde arriba a la izquierda, como en la B).
    vec3 n = normalize(vec3(-slope * 0.8, 1.0));
    vec3 light = vec3(-0.4511, -0.5514, 0.7018);   // normalize(-0.45, -0.55, 0.7)
    vec3 halfV = vec3(-0.2445, -0.2989, 0.9224);   // normalize(light + vista)
    float spec = max(pow(max(dot(n, halfV), 0.0), 30.0) - 0.0887, 0.0); // 0.0887 = halfV.z^30
    col *= 1.0 + (dot(n, light) - light.z) * 0.6 * liquid;
    col += spec * 0.5 * liquid;
    gl_FragColor = vec4(col * alpha, alpha);
  }
}`;

  let current = null;
  let contextLosses = 0; // un contexto perdido se reconstruye; solo se abandona si se repite mucho

  const compile = (gl, type, source) => {
    const shader = gl.createShader(type);
    gl.shaderSource(shader, source);
    gl.compileShader(shader);
    if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) throw new Error(gl.getShaderInfoLog(shader));
    return shader;
  };

  const loadMask = () =>
    new Promise((resolve, reject) => {
      const img = new Image();
      img.onload = () => resolve(img);
      img.onerror = reject;
      img.src = MASK_SRC;
    });

  // En móvil, un vídeo propio con la B entera y más ligero. Al cargar ya lo eligen el script en
  // línea tras #main y las props del componente; aquí se mantiene si luego cambia el tamaño.
  const syncSource = (video) => {
    const kind = phone.matches ? "movil" : "escritorio";
    const want = SOURCES[kind];
    if (video.getAttribute("poster") !== want.poster) video.poster = want.poster;
    // Reasignar el mismo src reiniciaría el vídeo: solo se toca si cambia.
    if (video.getAttribute("src") !== want.src) {
      const playing = !video.paused;
      video.src = want.src;
      if (playing && !reducedMotion) video.play().catch(() => {});
    }
    if (video.dataset.banteqSrc !== kind) video.dataset.banteqSrc = kind;
  };

  function setup(video) {
    const state = { video, alive: true, cleanup: [] };
    current = state;
    const on = (target, type, fn, opts) => {
      target.addEventListener(type, fn, opts);
      state.cleanup.push(() => target.removeEventListener(type, fn, opts));
    };

    syncSource(video);
    if (reducedMotion) {
      // La B queda quieta en su primer fotograma.
      const hold = () => video.pause();
      hold();
      on(video, "play", hold);
      return;
    }
    if (tier === 0 || contextLosses > 4) return;

    const container = video.parentElement;
    const canvas = document.createElement("canvas");
    canvas.setAttribute("aria-hidden", "true");
    // Transparente y encima del vídeo: solo cubre la zona deformada.
    canvas.style.cssText = "position:absolute;inset:0;width:100%;height:100%;display:block;pointer-events:none;visibility:hidden";
    const gl = canvas.getContext("webgl", { alpha: true, premultipliedAlpha: true, antialias: false, depth: false, stencil: false });
    if (!gl) return;
    if (getComputedStyle(container).position === "static") container.style.position = "relative";
    container.appendChild(canvas);
    state.cleanup.push(() => {
      canvas.remove();
      const lose = gl.getExtension("WEBGL_lose_context");
      if (lose) lose.loseContext();
    });

    let program;
    try {
      program = gl.createProgram();
      gl.attachShader(program, compile(gl, gl.VERTEX_SHADER, VERT));
      gl.attachShader(program, compile(gl, gl.FRAGMENT_SHADER, FRAG));
      gl.linkProgram(program);
      if (!gl.getProgramParameter(program, gl.LINK_STATUS)) throw new Error(gl.getProgramInfoLog(program));
    } catch (error) {
      contextLosses = 99; // el shader no compila en este equipo: se queda el vídeo
      teardown();
      return;
    }
    gl.useProgram(program);
    gl.bindBuffer(gl.ARRAY_BUFFER, gl.createBuffer());
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 3, -1, -1, 3]), gl.STATIC_DRAW);
    const aPos = gl.getAttribLocation(program, "aPos");
    gl.enableVertexAttribArray(aPos);
    gl.vertexAttribPointer(aPos, 2, gl.FLOAT, false, 0, 0);
    const u = {};
    for (const name of ["uVideo", "uMask", "uRes", "uCover", "uMaskRect", "uPointer", "uDepth", "uRadius", "uRefract", "uRipples"]) {
      u[name] = gl.getUniformLocation(program, name);
    }
    const texture = (unit) => {
      const t = gl.createTexture();
      gl.activeTexture(gl.TEXTURE0 + unit);
      gl.bindTexture(gl.TEXTURE_2D, t);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
      return t;
    };
    const videoTex = texture(0);
    const maskTex = texture(1);
    gl.uniform1i(u.uVideo, 0);
    gl.uniform1i(u.uMask, 1);
    // Solo se dibuja el rectángulo que cubre el hoyuelo y las ondas; fuera de él el lienzo queda
    // transparente (WebGL lo borra en cada fotograma), así el shader no recorre toda la pantalla.
    gl.enable(gl.SCISSOR_TEST);
    const rippleData = new Float32Array(16);

    // Zona de influencia en CPU, para saber sin tocar la GPU si el cursor está sobre la B o cerca.
    let zone = null;
    loadMask()
      .then((img) => {
        if (!state.alive) return;
        gl.activeTexture(gl.TEXTURE1);
        gl.bindTexture(gl.TEXTURE_2D, maskTex);
        gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGB, gl.RGB, gl.UNSIGNED_BYTE, img);
        const c = document.createElement("canvas");
        c.width = img.naturalWidth;
        c.height = img.naturalHeight;
        const ctx = c.getContext("2d");
        ctx.drawImage(img, 0, 0);
        zone = { w: c.width, h: c.height, data: ctx.getImageData(0, 0, c.width, c.height).data };
      })
      .catch(() => {});

    // Geometría en caché: se mide solo cuando cambia el tamaño (ResizeObserver, ya con el layout
    // hecho), nunca en pointermove ni en cada fotograma.
    let box = { x: 0, y: 0, w: 1, h: 1 };
    let cover = [1, 1, 0, 0];
    let maskRect = [1, 1, 0, 0];
    let baseScale = 1;
    let quality = 1; // baja si el equipo no llega a ~50 FPS y vuelve a subir; nunca apaga el efecto
    let scale = 1;
    const resizeCanvas = () => {
      scale = baseScale * quality;
      canvas.width = Math.max(1, Math.round(box.w * scale));
      canvas.height = Math.max(1, Math.round(box.h * scale));
      gl.viewport(0, 0, canvas.width, canvas.height);
    };
    const measure = () => {
      const r = container.getBoundingClientRect();
      if (!r.width || !r.height) return;
      box = { x: r.left + window.scrollX, y: r.top + window.scrollY, w: r.width, h: r.height };
      const vw = video.videoWidth || FRAME_W;
      const vh = video.videoHeight || FRAME_H;
      const s = Math.max(box.w / vw, box.h / vh);
      cover = [box.w / (vw * s), box.h / (vh * s), (vw * s - box.w) / 2 / (vw * s), (vh * s - box.h) / 2 / (vh * s)];
      maskRect = video.dataset.banteqSrc === "movil" ? MOBILE_MAP : [1, 1, 0, 0];
      // Más píxeles de lienzo que píxeles de vídeo en pantalla no aportan detalle.
      const cap = Math.min(window.devicePixelRatio || 1, tier === 2 ? 1.25 : 1);
      baseScale = Math.min(cap, Math.max(0.6, 1 / s));
      resizeCanvas();
    };
    const ro = new ResizeObserver(measure);
    ro.observe(container);
    state.cleanup.push(() => ro.disconnect());
    on(video, "loadedmetadata", measure);

    const nearAt = (lx, ly) => {
      if (!zone || lx < 0 || ly < 0 || lx > box.w || ly > box.h) return 0;
      const uvx = (lx / box.w) * cover[0] + cover[2];
      const uvy = (ly / box.h) * cover[1] + cover[3];
      const mx = Math.floor((uvx * maskRect[0] + maskRect[2]) * zone.w);
      const my = Math.floor((uvy * maskRect[1] + maskRect[3]) * zone.h);
      if (mx < 0 || my < 0 || mx >= zone.w || my >= zone.h) return 0;
      return zone.data[(my * zone.w + mx) * 4 + 1] / 255;
    };

    // El listener solo guarda la posición; la física y el dibujo van en requestAnimationFrame.
    const pointer = { cx: 0, cy: 0, x: 0, y: 0, down: false, lastX: 0, lastY: 0, speed: 0 };
    const move = (event) => {
      pointer.cx = event.clientX;
      pointer.cy = event.clientY;
      pointer.down = true;
      if (!running && nearAt(event.pageX - box.x, event.pageY - box.y) > 0) start();
    };
    const release = () => {
      pointer.down = false;
    };
    on(window, "pointermove", move, { passive: true });
    on(window, "pointerdown", move, { passive: true });
    on(window, "pointerup", (e) => e.pointerType !== "mouse" && release(), { passive: true });
    on(window, "pointercancel", release, { passive: true });
    on(document.documentElement, "pointerleave", release, { passive: true });
    on(window, "blur", release);

    // Física: muelle subamortiguado (vuelve con un pequeño rebote) y ondas de retorno.
    let depth = 0;
    let depthVel = 0;
    let wasPressed = false;
    let lastRipple = 0;
    const ripples = [];
    const addRipple = (x, y, amp) => {
      if (ripples.length === 4) ripples.shift();
      ripples.push({ x, y, t: 0, amp });
    };

    // Un fotograma nuevo del vídeo solo se sube a la GPU cuando existe (≈30 por segundo).
    let newFrame = true;
    const hasVFC = "requestVideoFrameCallback" in HTMLVideoElement.prototype;
    let vfcPending = false;
    const onVideoFrame = () => {
      vfcPending = false;
      newFrame = true;
      if (running) watchFrames();
    };
    const watchFrames = () => {
      if (hasVFC && !vfcPending && state.alive) {
        vfcPending = true;
        video.requestVideoFrameCallback(onVideoFrame);
      }
    };

    let raf = 0;
    let running = false;
    let shown = false;
    let last = 0;
    let frames = 0;
    let frameTime = 0;
    let inView = true;
    const visible = () => state.alive && inView && !document.hidden;

    function start() {
      if (running || !visible() || !zone) return;
      running = true;
      last = 0;
      newFrame = true;
      pointer.x = pointer.cx - (box.x - window.scrollX);
      pointer.y = pointer.cy - (box.y - window.scrollY);
      pointer.lastX = pointer.x;
      pointer.lastY = pointer.y;
      watchFrames();
      raf = requestAnimationFrame(frame);
    }
    function stop() {
      cancelAnimationFrame(raf);
      raf = 0;
      running = false;
      if (shown) {
        shown = false;
        canvas.style.visibility = "hidden";
      }
    }
    state.cleanup.push(stop);

    function frame(now) {
      const dt = last ? Math.min((now - last) / 1000, 1 / 20) : 1 / 60;
      const interval = last ? now - last : 0;
      last = now;

      // Cursor en coordenadas del hero (el scroll puede moverlo sin que haya pointermove).
      const tx = pointer.cx - (box.x - window.scrollX);
      const ty = pointer.cy - (box.y - window.scrollY);
      const follow = 1 - Math.exp(-dt * 14);
      pointer.x += (tx - pointer.x) * follow;
      pointer.y += (ty - pointer.y) * follow;
      pointer.speed = pointer.speed * 0.85 + (Math.hypot(pointer.x - pointer.lastX, pointer.y - pointer.lastY) / dt) * 0.15;
      pointer.lastX = pointer.x;
      pointer.lastY = pointer.y;
      const target = pointer.down ? nearAt(tx, ty) : 0;
      depthVel += (70 * (target - depth) - 11 * depthVel) * dt;
      depth += depthVel * dt;
      const pressed = target > 0.35;
      if (wasPressed && !pressed) addRipple(pointer.x, pointer.y, 0.22 * Math.min(1, depth + 0.3));
      wasPressed = pressed;
      if (pressed && pointer.speed > 700 && now - lastRipple > 160) {
        addRipple(pointer.x, pointer.y, Math.min(0.14, pointer.speed / 8000) * target);
        lastRipple = now;
      }
      for (const w of ripples) w.t += dt;
      while (ripples.length && ripples[0].t > 1.8) ripples.shift();

      // Asentado: se vuelve al vídeo nativo y el bucle se detiene hasta que el cursor vuelva a la B.
      if (target === 0 && Math.abs(depth) < 0.002 && Math.abs(depthVel) < 0.01 && !ripples.length) {
        stop();
        return;
      }
      raf = requestAnimationFrame(frame);
      if (video.readyState < 2) return;

      if (newFrame || !hasVFC) {
        gl.activeTexture(gl.TEXTURE0);
        gl.bindTexture(gl.TEXTURE_2D, videoTex);
        gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGB, gl.RGB, gl.UNSIGNED_BYTE, video);
        newFrame = false;
      }
      // Radio del hueco bajo el cursor. Todo lo demás (hundimiento, borde apartado, refracción y
      // ondas) va en unidades de este radio, así que cambiarlo escala el efecto sin alterar su
      // intensidad. Antes min(170, max(100, 9 % del ancho)): ahora la mitad, más preciso.
      const radius = Math.min(85, Math.max(50, box.w * 0.045)) * scale;
      let x0 = canvas.width, y0 = canvas.height, x1 = 0, y1 = 0;
      const grow = (cx, cy, r) => {
        x0 = Math.min(x0, cx - r); y0 = Math.min(y0, cy - r);
        x1 = Math.max(x1, cx + r); y1 = Math.max(y1, cy + r);
      };
      if (Math.abs(depth) > 0.0005 || Math.abs(depthVel) > 0.005) grow(pointer.x * scale, pointer.y * scale, radius * 1.4);
      for (const w of ripples) grow(w.x * scale, w.y * scale, (1.45 + w.t * 1.3) * radius);
      x0 = Math.max(0, Math.floor(x0)); y0 = Math.max(0, Math.floor(y0));
      x1 = Math.min(canvas.width, Math.ceil(x1)); y1 = Math.min(canvas.height, Math.ceil(y1));
      if (x1 <= x0 || y1 <= y0) x0 = y0 = x1 = y1 = 0;
      gl.scissor(x0, canvas.height - y1, x1 - x0, y1 - y0); // origen de WebGL: abajo a la izquierda
      gl.uniform2f(u.uRes, canvas.width, canvas.height);
      gl.uniform4fv(u.uCover, cover);
      gl.uniform4fv(u.uMaskRect, maskRect);
      gl.uniform2f(u.uPointer, pointer.x * scale, pointer.y * scale);
      gl.uniform1f(u.uDepth, depth);
      gl.uniform1f(u.uRadius, radius);
      gl.uniform1f(u.uRefract, radius * 0.1);
      rippleData.fill(0);
      ripples.forEach((w, i) => rippleData.set([w.x * scale, w.y * scale, w.t, w.amp], i * 4));
      gl.uniform4fv(u.uRipples, rippleData);
      gl.drawArrays(gl.TRIANGLES, 0, 3);
      if (!shown) {
        shown = true;
        canvas.style.visibility = "visible";
      }

      // Si el equipo no llega a ~50 FPS se baja la resolución interna (mín. 60 %) y, cuando va
      // holgado, se recupera. Nunca se desactiva la interacción por tiempos: un navegador en
      // ahorro de energía limita requestAnimationFrame a 30 FPS sin que el efecto sea el culpable.
      if (interval > 0 && interval < 200) {
        frames++;
        frameTime += interval;
        if (frames === 60) {
          const avg = frameTime / frames;
          if (avg > 20 && quality > 0.6) {
            quality = Math.max(0.6, quality * 0.85);
            resizeCanvas();
          } else if (avg < 17.5 && quality < 1) {
            quality = Math.min(1, quality / 0.85);
            resizeCanvas();
          }
          frames = 0;
          frameTime = 0;
        }
      }
    }

    // Pestaña oculta o hero fuera de pantalla: vídeo en pausa y nada de dibujo. Al volver, el
    // vídeo sigue y la interacción arranca con el siguiente movimiento del cursor.
    // En móvil no se arranca el <video> del HTML pre-renderizado (data-banteq-previo): React lo
    // sustituye al hidratar y la B volvía a empezar desde 0 s. Hasta entonces se ve el póster, que
    // es el primer fotograma, y el vídeo nuevo de Framer arranca justo desde ahí.
    const sync = () => {
      if (visible()) {
        if (video.paused && !video.dataset.banteqPrevio) video.play().catch(() => {});
      } else {
        stop();
        if (!video.paused) video.pause();
      }
    };
    const io = new IntersectionObserver((entries) => {
      inView = entries[entries.length - 1].isIntersecting;
      sync();
    });
    io.observe(container);
    state.cleanup.push(() => io.disconnect());
    on(document, "visibilitychange", sync);
    on(canvas, "webglcontextlost", (e) => {
      e.preventDefault();
      contextLosses++;
      teardown(); // check() lo vuelve a montar en el siguiente ciclo
    });
    measure();
  }

  function teardown() {
    if (!current) return;
    current.alive = false;
    current.cleanup.forEach((fn) => fn());
    current = null;
  }

  // En móvil banteq.css deja el <video> casi transparente hasta que presenta su primer fotograma
  // (data-banteq-listo); mientras, se ve el póster del contenedor, que es ese mismo fotograma. Así
  // no asoma ningún fotograma vacío o a medio decodificar cuando React sustituye el <video>.
  const reveal = (video) => {
    if (video.dataset.banteqListo || video.banteqReveal) return;
    video.banteqReveal = true;
    const show = () => {
      video.dataset.banteqListo = "1";
    };
    const onTime = () => {
      if (video.currentTime <= 0) return;
      video.removeEventListener("timeupdate", onTime);
      show();
    };
    if ("requestVideoFrameCallback" in video) video.requestVideoFrameCallback(show);
    else video.addEventListener("timeupdate", onTime);
  };

  // Framer monta el hero al hidratar y lo vuelve a montar al navegar o cambiar de tamaño.
  const check = () => {
    if (document.hidden) return;
    const video = document.querySelector(VIDEO_SELECTOR);
    if (video) {
      syncSource(video);
      reveal(video);
    }
    if (current && current.video === video && video.isConnected) return;
    teardown();
    if (video) setup(video);
  };
  setInterval(check, 800);
  check();
})();
