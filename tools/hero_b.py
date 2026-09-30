"""B líquida del hero: prepara la imagen para Higgsfield y convierte el vídeo generado en los
recursos de la web.

La referencia (assets-banteq/referencias/hero-b-referencia.webp) es una captura de la portada a
1536 px de ancho con la B ya colocada. Está en "espacio de página": encima del vídeo del hero la
plantilla pinta un degradado negro (40 % arriba → 8 % abajo). Para que el vídeo, una vez servido,
reproduzca exactamente la referencia, se deshace ese degradado y se lleva la B a las coordenadas
del fotograma 16:9 que el hero muestra con object-fit: cover.

    python3 tools/hero_b.py plate            → assets-banteq/hero-b/plate-input.png (para editar en Higgsfield)
    python3 tools/hero_b.py clean <png>      → assets-banteq/hero-b/plate.png (fondo exacto + B limpia)
    python3 tools/hero_b.py video <mp4>      → assets-banteq/generado/hero-b*.{mp4,jpg,png}

Pasos en Higgsfield (manuales): GPT Image 2.5 quita textos y botones de plate-input.png;
MiniMax H3 anima plate.png usándola como primer y último fotograma (bucle sin cortes).
"""
import subprocess
import sys
from pathlib import Path

from PIL import Image, ImageChops, ImageDraw, ImageFilter, ImageOps

TOOLS = Path(__file__).resolve().parent
ROOT = TOOLS.parent
REF = ROOT / "assets-banteq/referencias/hero-b-referencia.webp"
WORK = ROOT / "assets-banteq/hero-b"
GEN = ROOT / "assets-banteq/generado"
FFMPEG = "ffmpeg"

# Geometría de la captura de referencia (Safari, 1536 px de ancho).
REF_TOP = 124  # alto de la barra del navegador en la captura
VIEW_W, VIEW_H = 1536, 900
HERO_H = 988  # alto del hero a 1536 px (medido en la web)

# Fotograma del vídeo y cómo lo encaja object-fit: cover en el hero de 1536 × 988.
FW, FH = 1920, 1080
SCALE = max(VIEW_W / FW, HERO_H / FH)
OFF_X = (VIEW_W - FW * SCALE) / 2

# Recorte para móvil y tablet: centrado, así object-fit: cover lo coloca igual que el completo.
MOBILE_W = 810


def overlay_alpha(page_y):
    """Degradado 'Overlay' del hero: rgba(0,0,0,.4) 0% → rgba(0,0,0,.08) 97.3%."""
    t = min(max(page_y / (0.972973 * HERO_H), 0), 1)
    return 0.4 + (0.08 - 0.4) * t


def page_to_video_space(img):
    """Deshace el degradado fila a fila: vídeo = página / (1 - alfa)."""
    out = img.copy()
    for y in range(img.height):
        gain = 1 / (1 - overlay_alpha(y))
        lut = [min(255, round(v * gain)) for v in range(256)] * len(img.getbands())
        out.paste(img.crop((0, y, img.width, y + 1)).point(lut), (0, y))
    return out


def solve(a, b):
    """Gauss con pivote parcial (sistemas 6 × 6 del ajuste del fondo)."""
    n = len(b)
    m = [row[:] + [b[i]] for i, row in enumerate(a)]
    for c in range(n):
        p = max(range(c, n), key=lambda r: abs(m[r][c]))
        m[c], m[p] = m[p], m[c]
        for r in range(c + 1, n):
            f = m[r][c] / m[c][c]
            for k in range(c, n + 1):
                m[r][k] -= f * m[c][k]
    x = [0.0] * n
    for r in range(n - 1, -1, -1):
        x[r] = (m[r][n] - sum(m[r][k] * x[k] for k in range(r + 1, n))) / m[r][r]
    return x


def fit_background(img, keep):
    """Ajusta el fondo gris (cuadrático en x, y) con los píxeles donde keep(x, y) es cierto."""
    gray = img.convert("L")
    terms = lambda x, y: [1, x, y, x * x, x * y, y * y]
    ata = [[0.0] * 6 for _ in range(6)]
    atb = [0.0] * 6
    for y in range(0, gray.height, 6):
        for x in range(0, gray.width, 6):
            if not keep(x, y):
                continue
            t = terms(x / 1000, y / 1000)
            v = gray.getpixel((x, y))
            for i in range(6):
                atb[i] += t[i] * v
                for j in range(6):
                    ata[i][j] += t[i] * t[j]
    return solve(ata, atb), terms


def render_background(coef, terms, to_local):
    """Evalúa el ajuste en todo el fotograma (a baja resolución: el fondo es muy suave)."""
    small = Image.new("L", (FW // 8, FH // 8))
    for y in range(small.height):
        for x in range(small.width):
            lx, ly = to_local(x * 8 + 4, y * 8 + 4)
            v = sum(c * t for c, t in zip(coef, terms(lx / 1000, ly / 1000)))
            small.putpixel((x, y), max(0, min(255, round(v))))
    return small.resize((FW, FH), Image.BICUBIC).convert("RGB")


def plate():
    WORK.mkdir(parents=True, exist_ok=True)
    page = Image.open(REF).convert("RGB").crop((0, REF_TOP, VIEW_W, REF_TOP + VIEW_H))
    video = page_to_video_space(page)
    # Fondo: franjas laterales sin B ni textos (x < 300 o x > 1240 en la página).
    coef, terms = fit_background(video, lambda x, y: x < 300 or x > 1240)
    to_page = lambda fx, fy: (fx * SCALE + OFF_X, fy * SCALE)
    bg = render_background(coef, terms, to_page)
    # La captura, escalada al fotograma, cubre casi todo; los bordes se funden con el fondo.
    w, h = round(VIEW_W / SCALE), round(VIEW_H / SCALE)
    x0 = round(-OFF_X / SCALE)
    region = video.resize((w, h), Image.LANCZOS)
    mask = Image.new("L", (w, h), 0)
    # A la derecha, margen extra: la captura incluye la barra de desplazamiento de Safari.
    ImageDraw.Draw(mask).rectangle((40, -40, w - 81, h - 41), fill=255)
    mask = mask.filter(ImageFilter.GaussianBlur(20))
    frame = bg.copy()
    frame.paste(region, (x0, 0), mask)
    frame.save(WORK / "plate-input.png")
    bg.save(WORK / "background.png")
    print("plate-input.png", frame.size, "escala", round(SCALE, 4), "desplazamiento", round(OFF_X, 1))


def b_mask(img, bg, scale=4):
    """Silueta de la B (a 1/scale): lo que se separa del fondo, sin motas y con los huecos rellenos."""
    size = (FW // scale, FH // scale)
    diff = ImageChops.difference(img.convert("L").resize(size, Image.BILINEAR), bg.convert("L").resize(size, Image.BILINEAR))
    m = diff.point(lambda v: 255 if v > 14 else 0)
    m = m.filter(ImageFilter.MinFilter(3)).filter(ImageFilter.MaxFilter(3))  # quita motas del fondo
    m = m.filter(ImageFilter.MaxFilter(5)).filter(ImageFilter.MinFilter(5))  # cierra el contorno
    ImageDraw.floodfill(m, (0, 0), 128)
    m = m.point(lambda v: 0 if v == 128 else 255)
    # Solo la pieza conectada con el centro de la B: fuera quedan manchas del fondo editado.
    cx, cy = size[0] * 0.52, size[1] * 0.45
    seed = min(((x, y) for x in range(size[0]) for y in range(size[1]) if m.getpixel((x, y)) == 255),
               key=lambda p: (p[0] - cx) ** 2 + (p[1] - cy) ** 2)
    ImageDraw.floodfill(m, seed, 200)
    return m.point(lambda v: 255 if v == 200 else 0)


def clean(edited):
    """Fondo exacto (el ajustado en plate) + la B editada, fundida con un borde suave."""
    bg = Image.open(WORK / "background.png").convert("RGB")
    img = Image.open(edited).convert("RGB").resize((FW, FH), Image.LANCZOS)
    mask = b_mask(img, bg).filter(ImageFilter.MaxFilter(5)).resize((FW, FH), Image.BILINEAR)
    mask = mask.filter(ImageFilter.GaussianBlur(6))
    Image.composite(img, bg, mask).save(WORK / "plate.png")
    print("plate.png", (FW, FH))


def run(*args):
    return subprocess.run([FFMPEG, "-hide_banner", "-y", *args], check=True, capture_output=True, text=True)


def frame_count(src):
    out = subprocess.run([FFMPEG, "-hide_banner", "-i", str(src), "-map", "0:v", "-f", "null", "-"],
                         capture_output=True, text=True).stderr
    return int(out.rsplit("frame=", 1)[1].split()[0])


def mean_diff(a, b):
    h = ImageChops.difference(a, b).histogram()
    return sum(i * v for i, v in enumerate(h)) / sum(h)


def motion_curve(src):
    """Cambio entre fotogramas consecutivos dentro de la B (en gris y a 1/8 de resolución)."""
    w, h = FW // 8, FH // 8
    raw = subprocess.run([FFMPEG, "-hide_banner", "-loglevel", "error", "-i", str(src), "-vf",
                          f"scale={w}:{h},format=gray", "-f", "rawvideo", "-"], capture_output=True, check=True).stdout
    box = (80, 12, 172, 117)  # la B dentro del fotograma, a 1/8
    frames = [Image.frombytes("L", (w, h), raw[i:i + w * h]).crop(box) for i in range(0, len(raw), w * h)]
    return frames, [0.0] + [mean_diff(frames[i], frames[i - 1]) for i in range(1, len(frames))]


def retime(src, dst):
    """MiniMax arranca y frena al acercarse al fotograma fijo de inicio y fin (un segundo casi
    quieto) y además da un salto doble cada cuatro fotogramas. Se interpolan fotogramas a 48 fps
    y se eligen los que dan un cambio visual constante a 30 fps: el bucle no se para ni tiembla."""
    interp = WORK / "_interp.mp4"
    run("-i", str(src), "-an", "-vf", f"scale={FW}:{FH}:flags=lanczos,"
        "minterpolate=fps=48:mi_mode=mci:mc_mode=aobmc:me_mode=bidir:vsbmc=1",
        "-c:v", "libx264", "-preset", "fast", "-crf", "10", str(interp))
    frames, d = motion_curve(interp)
    middle = sorted(d[len(d) // 5: -len(d) // 5])
    step = middle[len(middle) // 2] * 48 / 30  # el tramo central, a su velocidad real
    cum = [0.0]
    for v in d[1:]:
        cum.append(cum[-1] + v)
    total = cum[-1] + mean_diff(frames[-1], frames[0])  # el salto del final al principio cuenta
    n = max(2, round(total / step))
    picks, j = [], 0
    for k in range(n):
        t = k * total / n
        while j + 1 < len(cum) and abs(cum[j + 1] - t) <= abs(cum[j] - t):
            j += 1
        if not picks or j != picks[-1]:
            picks.append(j)
    # Se decodifica en crudo y solo se pasan al codificador los fotogramas elegidos.
    size = FW * FH * 3 // 2  # yuv420p
    dec = subprocess.Popen([FFMPEG, "-hide_banner", "-loglevel", "error", "-i", str(interp),
                            "-f", "rawvideo", "-pix_fmt", "yuv420p", "-"], stdout=subprocess.PIPE)
    enc = subprocess.Popen([FFMPEG, "-hide_banner", "-loglevel", "error", "-y", "-f", "rawvideo",
                            "-pix_fmt", "yuv420p", "-s", f"{FW}x{FH}", "-r", "30", "-i", "-",
                            "-c:v", "libx264", "-preset", "slow", "-crf", "10", str(dst)], stdin=subprocess.PIPE)
    wanted = set(picks)
    for i in range(len(frames)):
        buf = dec.stdout.read(size)
        if len(buf) < size:
            break
        if i in wanted:
            enc.stdin.write(buf)
    enc.stdin.close()
    assert dec.wait() == 0 and enc.wait() == 0
    interp.unlink()
    print(f"retiempo: {len(frames)} fotogramas a 48 fps → {len(picks)} a 30 fps ({len(picks) / 30:.2f} s)")


def encode(src, dst, crop, crf):
    """H.264 sin audio, arranque rápido y un fotograma clave por segundo."""
    run("-i", str(src), "-vf", f"{crop}format=yuv420p", "-an", "-c:v", "libx264", "-preset", "slow",
        "-crf", str(crf), "-profile:v", "high", "-g", "30", "-movflags", "+faststart", str(dst))
    print(dst.name, f"{dst.stat().st_size / 1e6:.2f} MB")


def video(src):
    GEN.mkdir(parents=True, exist_ok=True)
    loop = WORK / "_bucle.mp4"
    retime(Path(src), loop)
    encode(loop, GEN / "hero-b.mp4", "", 23)
    encode(loop, GEN / "hero-b-movil.mp4", f"crop=864:{FH}:{(FW - 864) // 2}:0,", 24)
    loop.unlink()
    run("-i", str(GEN / "hero-b.mp4"), "-frames:v", "1", "-q:v", "3", str(GEN / "hero-b-poster.jpg"))
    # Máscara para el shader, a 1/4: R = la B (borde suave), G = zona de influencia (B ensanchada
    # ~150 px del fotograma, con caída suave), que es donde el cursor deforma el líquido.
    first = Image.open(GEN / "hero-b-poster.jpg").convert("RGB")
    bg = Image.open(WORK / "background.png").convert("RGB")
    m = b_mask(first, bg)
    r = m.filter(ImageFilter.GaussianBlur(1.2))
    g = m
    for _ in range(4):
        g = g.filter(ImageFilter.MaxFilter(9))
    g = g.filter(ImageFilter.GaussianBlur(9))
    g = ImageChops.lighter(g, m)
    Image.merge("RGB", (r, g, Image.new("L", m.size, 0))).save(GEN / "hero-b-mask.png", optimize=True)
    print("hero-b-poster.jpg, hero-b-mask.png", m.size)


if __name__ == "__main__":
    {"plate": plate, "clean": clean, "video": video}[sys.argv[1]](*sys.argv[2:])
