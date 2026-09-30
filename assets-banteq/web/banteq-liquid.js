// B líquida del hero.
// El vídeo (generado con Higgsfield) da la ondulación continua de la superficie. Encima, un shader
// WebGL usa ese mismo <video> como textura y hace que el líquido se aparte alrededor del cursor
// (hoyuelo con el líquido desplazado hacia los lados) y vuelva de forma elástica, con ondas.
// Sin WebGL, en equipos modestos o con "reducir movimiento" se queda el vídeo de Framer tal cual.
(() => {
  const VIDEO_SELECTOR = '[data-framer-name="Hero Section"] [data-framer-name="Background"] video';
  const SOURCES = {
    escritorio: { src: "/banteq/hero-b.mp4", poster: "/banteq/hero-b-poster.jpg" },
    movil: { src: "/banteq/hero-b-movil.mp4", poster: "/banteq/hero-b-movil-poster.jpg" },
  };
  // El vídeo móvil (720 × 1200) es un recorte reducido del fotograma con fondo añadido arriba y
  // abajo (tools/hero_b.py): así se lleva su uv a la de la máscara, que es la del fotograma.
  const MOBILE_MAP = [818 / 1920, 1200 / 950, 595 / 1920, -125 / 950];
  const MASK_SRC = "/banteq/hero-b-mask.png"; // R: la B · G: zona de influencia (B ensanchada)
  const FRAME_W = 1920;
  const FRAME_H = 1080;
  const phone = matchMedia("(max-width: 809.98px)"); // mismo corte que el diseño móvil de Framer

  const reducedMotion = matchMedia("(prefers-reduced-motion: reduce)").matches;
  const cores = navigator.hardwareConcurrency || 8;
  const memory = navigator.deviceMemory || 8;
  const saveData = navigator.connection && navigator.connection.saveData;
  const coarse = matchMedia("(pointer: coarse)").matches;
  // 0: solo vídeo · 1: shader ligero (móvil, 4 núcleos) · 2: completo
  const tier = saveData || cores <= 2 || memory <= 2 ? 0 : coarse || cores <= 4 || memory <= 4 ? 1 : 2;

  const VERT = `attribute vec2 aPos; varying vec2 vUv;
void main() { vUv = aPos * 0.5 + 0.5; gl_Position = vec4(aPos, 0.0, 1.0); }`;

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

float height(vec2 p) {
  float r = length(p - uPointer) / uRadius;
  // Hoyuelo bajo el cursor y el líquido apartado acumulándose en su borde (todo dentro del radio).
  float rim = (r - 0.72) / 0.2;
  float h = uDepth * (0.25 * exp(-rim * rim) - exp(-r * r * 3.2));
  // Ondas de retorno: nacen en el borde del hoyuelo y se abren perdiendo fuerza.
  for (int i = 0; i < 4; i++) {
    vec4 w = uRipples[i];
    if (w.w <= 0.0) continue;
    float front = 0.55 + w.z * 1.3;
    float x = length(p - w.xy) / uRadius - front;
    h += w.w * exp(-w.z * 2.4) / front * exp(-x * x * 7.0) * cos(x * 8.0);
  }
  return h;
}

vec2 videoUv(vec2 p) { return p / uRes * uCover.xy + uCover.zw; }

void main() {
  vec2 p = vec2(vUv.x, 1.0 - vUv.y) * uRes;
  float zone = texture2D(uMask, videoUv(p) * uMaskRect.xy + uMaskRect.zw).g;
  vec3 col;
  if (zone < 0.002) {
    col = texture2D(uVideo, videoUv(p)).rgb; // fondo: el vídeo sin tocar
  } else {
    float e = max(1.0, uRadius * 0.012);
    float h0 = height(p);
    vec2 slope = vec2(height(p + vec2(e, 0.0)) - h0, height(p + vec2(0.0, e)) - h0) / e * uRadius;
    // Refracción: se muestrea hacia el cursor, así el líquido parece apartarse de él.
    vec2 q = p - slope * uRefract * zone;
    col = texture2D(uVideo, videoUv(q)).rgb;
    float liquid = texture2D(uMask, videoUv(q) * uMaskRect.xy + uMaskRect.zw).r;
    // En el centro del hoyuelo la capa de líquido es más fina: se transparenta el fondo gris.
    float r = length(p - uPointer) / uRadius;
    float thin = clamp(uDepth, 0.0, 1.0) * exp(-r * r * 4.5);
    col = mix(col, vec3(0.8), thin * 0.4 * liquid);
    // Relieve y brillo de las paredes (luz desde arriba a la izquierda, como en la B).
    vec3 n = normalize(vec3(-slope * 0.8, 1.0));
    vec3 light = normalize(vec3(-0.45, -0.55, 0.7));
    vec3 halfV = normalize(light + vec3(0.0, 0.0, 1.0));
    float spec = max(pow(max(dot(n, halfV), 0.0), 30.0) - pow(halfV.z, 30.0), 0.0);
    float relief = dot(n, light) - light.z;
    col *= 1.0 + relief * 0.6 * liquid;
    col += spec * 0.5 * liquid;
  }
  gl_FragColor = vec4(col, 1.0);
}`;

  let current = null;
  let webglOff = false; // si falla o va lento, no se reintenta en esta visita

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

  // En móvil, un vídeo propio con la B entera y más ligero. Hasta que se asigna, banteq.css
  // oculta el póster de escritorio en móvil para que la B no dé un salto al cargar.
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
    if (tier === 0 || webglOff) return;

    const container = video.parentElement;
    const canvas = document.createElement("canvas");
    canvas.setAttribute("aria-hidden", "true");
    canvas.style.cssText = "position:absolute;inset:0;width:100%;height:100%;display:block;pointer-events:none;opacity:0";
    const gl = canvas.getContext("webgl", { alpha: false, antialias: false, depth: false, stencil: false, premultipliedAlpha: false });
    if (!gl) return;
    if (getComputedStyle(container).position === "static") container.style.position = "relative";
    container.appendChild(canvas);
    state.cleanup.push(() => {
      canvas.remove();
      video.style.opacity = "";
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
      disable();
      return;
    }
    gl.useProgram(program);
    const buffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
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

    // Zona de influencia en CPU, para saber si el cursor está sobre la B o cerca.
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
        needsDraw = true;
      })
      .catch(teardown);

    // Tamaño: ~1,1 píxeles del lienzo por píxel del vídeo; más no aporta detalle.
    let scale = 1;
    let box = { w: 1, h: 1 };
    let cover = [1, 1, 0, 0];
    let maskRect = [1, 1, 0, 0];
    const layout = () => {
      const r = container.getBoundingClientRect();
      if (!r.width || !r.height) return;
      box = { w: r.width, h: r.height, left: r.left, top: r.top };
      const vw = video.videoWidth || FRAME_W;
      const vh = video.videoHeight || FRAME_H;
      const s = Math.max(box.w / vw, box.h / vh);
      cover = [box.w / (vw * s), box.h / (vh * s), (vw * s - box.w) / 2 / (vw * s), (vh * s - box.h) / 2 / (vh * s)];
      maskRect = video.dataset.banteqSrc === "movil" ? MOBILE_MAP : [1, 1, 0, 0];
      const cap = Math.min(window.devicePixelRatio || 1, tier === 2 ? 1.5 : 1);
      const target = Math.min(cap, Math.max(0.6, (1 / s) * 1.1)) * quality;
      scale = target;
      canvas.width = Math.round(box.w * scale);
      canvas.height = Math.round(box.h * scale);
      gl.viewport(0, 0, canvas.width, canvas.height);
      needsDraw = true;
    };
    let quality = 1;
    const ro = new ResizeObserver(layout);
    ro.observe(container);
    state.cleanup.push(() => ro.disconnect());
    on(video, "loadedmetadata", layout);

    // Cursor y física del líquido (muelle subamortiguado: vuelve con un pequeño rebote).
    const pointer = { x: 0, y: 0, tx: 0, ty: 0, inside: false, lastMove: 0, speed: 0 };
    let depth = 0;
    let depthVel = 0;
    let wasPressed = false;
    let lastRipple = 0;
    const ripples = [];
    const addRipple = (x, y, amp) => {
      if (ripples.length === 4) ripples.shift();
      ripples.push({ x, y, t: 0, amp });
    };
    const nearness = () => {
      if (!zone || !pointer.inside) return 0;
      const uvx = (pointer.tx / box.w) * cover[0] + cover[2];
      const uvy = (pointer.ty / box.h) * cover[1] + cover[3];
      const mx = Math.floor((uvx * maskRect[0] + maskRect[2]) * zone.w);
      const my = Math.floor((uvy * maskRect[1] + maskRect[3]) * zone.h);
      if (mx < 0 || my < 0 || mx >= zone.w || my >= zone.h) return 0;
      return zone.data[(my * zone.w + mx) * 4 + 1] / 255;
    };
    const move = (event) => {
      const r = container.getBoundingClientRect();
      const x = event.clientX - r.left;
      const y = event.clientY - r.top;
      const now = performance.now();
      const dt = Math.max(now - pointer.lastMove, 8) / 1000;
      pointer.speed = Math.hypot(x - pointer.tx, y - pointer.ty) / dt;
      pointer.tx = x;
      pointer.ty = y;
      pointer.lastMove = now;
      const inside = x >= 0 && y >= 0 && x <= r.width && y <= r.height;
      if (inside && !pointer.inside && depth < 0.05) {
        pointer.x = x;
        pointer.y = y;
      }
      pointer.inside = inside;
      wake();
    };
    const release = () => {
      pointer.inside = false;
      wake();
    };
    on(window, "pointermove", move, { passive: true });
    on(window, "pointerdown", move, { passive: true });
    on(window, "pointerup", (e) => e.pointerType !== "mouse" && release(), { passive: true });
    on(window, "pointercancel", release, { passive: true });
    on(document.documentElement, "pointerleave", release, { passive: true });
    on(window, "blur", release);

    // Solo se sube un fotograma nuevo del vídeo cuando existe (≈30 por segundo).
    let newFrame = true;
    let needsDraw = true;
    const onVideoFrame = () => {
      newFrame = true;
      if (state.alive) video.requestVideoFrameCallback(onVideoFrame);
    };
    const hasVFC = "requestVideoFrameCallback" in HTMLVideoElement.prototype;
    if (hasVFC) video.requestVideoFrameCallback(onVideoFrame);

    let raf = 0;
    let last = 0;
    let shown = false;
    let slowFrames = 0;
    let measured = 0;
    const frame = (now) => {
      raf = requestAnimationFrame(frame);
      const dt = Math.min((now - (last || now)) / 1000, 1 / 20);
      const frameMs = now - last;
      last = now;

      const follow = 1 - Math.exp(-dt * 14);
      pointer.x += (pointer.tx - pointer.x) * follow;
      pointer.y += (pointer.ty - pointer.y) * follow;
      const target = nearness();
      depthVel += (70 * (target - depth) - 11 * depthVel) * dt;
      depth += depthVel * dt;
      const pressed = target > 0.35;
      if (wasPressed && !pressed) addRipple(pointer.x, pointer.y, 0.22 * Math.min(1, depth + 0.3));
      wasPressed = pressed;
      if (pressed && pointer.speed > 700 && now - lastRipple > 160) {
        addRipple(pointer.x, pointer.y, Math.min(0.14, pointer.speed / 8000) * target);
        lastRipple = now;
      }
      pointer.speed *= 0.9;
      for (const w of ripples) w.t += dt;
      while (ripples.length && ripples[0].t > 1.8) ripples.shift();

      const moving = Math.abs(depth) > 0.002 || Math.abs(depthVel) > 0.002 || ripples.length > 0;
      if (!hasVFC && !video.paused) newFrame = true;
      if (!newFrame && !moving && !needsDraw) return;
      if (video.readyState < 2) return;

      if (newFrame) {
        gl.activeTexture(gl.TEXTURE0);
        gl.bindTexture(gl.TEXTURE_2D, videoTex);
        gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGB, gl.RGB, gl.UNSIGNED_BYTE, video);
        newFrame = false;
      }
      needsDraw = false;
      const radius = Math.min(170, Math.max(100, box.w * 0.09)) * scale;
      gl.uniform2f(u.uRes, canvas.width, canvas.height);
      gl.uniform4fv(u.uCover, cover);
      gl.uniform4fv(u.uMaskRect, maskRect);
      gl.uniform2f(u.uPointer, pointer.x * scale, pointer.y * scale);
      gl.uniform1f(u.uDepth, zone ? depth : 0);
      gl.uniform1f(u.uRadius, radius);
      gl.uniform1f(u.uRefract, radius * 0.1);
      const data = new Float32Array(16);
      ripples.forEach((w, i) => data.set([w.x * scale, w.y * scale, w.t, w.amp], i * 4));
      gl.uniform4fv(u.uRipples, data);
      gl.drawArrays(gl.TRIANGLES, 0, 3);

      if (!shown) {
        shown = true;
        canvas.style.opacity = "1";
        video.style.opacity = "0";
      }
      // Si el equipo no llega a ~40 FPS mientras el líquido se mueve, se baja la resolución;
      // si aun así no llega, se vuelve al vídeo sin efecto.
      if (moving && frameMs > 0 && frameMs < 250) {
        measured++;
        if (frameMs > 25) slowFrames++;
        if (measured === 45) {
          if (slowFrames > 25) {
            if (quality > 0.62) {
              quality *= 0.8;
              layout();
            } else {
              disable();
            }
          }
          measured = 0;
          slowFrames = 0;
        }
      }
    };

    // Se pausa con la pestaña oculta o el hero fuera de pantalla.
    let inView = true;
    const running = () => state.alive && inView && !document.hidden;
    function wake() {
      if (running() && !raf) {
        last = 0;
        raf = requestAnimationFrame(frame);
      }
    }
    const sleep = () => {
      cancelAnimationFrame(raf);
      raf = 0;
    };
    const sync = () => {
      if (running()) {
        if (video.paused) video.play().catch(() => {});
        wake();
      } else {
        sleep();
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
      disable();
    });
    state.cleanup.push(sleep);
    layout();
    wake();
  }

  function disable() {
    webglOff = true;
    teardown();
  }

  function teardown() {
    if (!current) return;
    current.alive = false;
    current.cleanup.forEach((fn) => fn());
    current = null;
  }

  // Framer monta el hero al hidratar y lo vuelve a montar al navegar o cambiar de tamaño.
  const check = () => {
    const video = document.querySelector(VIDEO_SELECTOR);
    if (video) syncSource(video);
    if (current && current.video === video && video.isConnected) return;
    teardown();
    if (video) setup(video);
  };
  setInterval(check, 800);
  check();
})();
