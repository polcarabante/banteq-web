"""Monta la demo de la tarjeta de Margon a partir de la grabación de tools/demo_margon.mjs.

Cada fotograma de la grabación se recorta según la cámara del guion (plano completo → acercamiento
al botón → plano completo) y se coloca dentro del mismo marco oscuro con halo que usan las tarjetas
del carrusel (assets.framed), de modo que el vídeo es la versión en movimiento de la imagen que ya
había. Salen, en assets-banteq/generado/:

  margon-demo.mp4        vídeo de la tarjeta (H.264, sin sonido)
  cms-card-margon.jpg    su primer fotograma: la imagen fija de la tarjeta y el póster del vídeo

Uso:  python3 tools/demo_margon.py [carpeta de la grabación]
"""
import json
import subprocess
import sys
import tempfile
from pathlib import Path

from PIL import Image, ImageDraw, ImageFilter

ROOT = Path(__file__).resolve().parent.parent
GEN = ROOT / "assets-banteq" / "generado"
SRC = Path(sys.argv[1]) if len(sys.argv) > 1 else Path(tempfile.gettempdir()) / "banteq-demo-margon"

# El marco de assets.framed() para 762×720 (relleno 7 %, radio 28), a 4/3 para pantallas densas
# (1016×960: H.264 necesita medidas pares).
ESCALA = 4 / 3
W, H = round(762 * ESCALA), round(720 * ESCALA)
PAD, RADIO = 0.07, round(28 * ESCALA)
FPS = 30
FUNDIDO = 0.35  # s finales que funden con el primer fotograma, para que el bucle no dé un salto


def ease(p):
    return 4 * p * p * p if p < 0.5 else 1 - (-2 * p + 2) ** 3 / 2


def camara(cam, t):
    """Estado de la cámara (zoom y centro, en px de página) en el instante t (ms)."""
    if t <= cam[0]["t"]:
        k = cam[0]
        return k["z"], k["cx"], k["cy"]
    for a, b in zip(cam, cam[1:]):
        if t <= b["t"]:
            e = ease((t - a["t"]) / (b["t"] - a["t"])) if b["t"] > a["t"] else 1
            return tuple(a[k] + (b[k] - a[k]) * e for k in ("z", "cx", "cy"))
    k = cam[-1]
    return k["z"], k["cx"], k["cy"]


def main():
    g = json.loads((SRC / "guion.json").read_text())
    vw, vh, dsf, ev, cam, frames = g["vw"], g["vh"], g["dsf"], g["ev"], g["cam"], g["frames"]
    t0, fin = ev["t0"], ev["fin"]

    sw = round(W * (1 - 2 * PAD))
    sh = round(sw * vh / vw)
    x0, y0 = (W - sw) // 2, (H - sh) // 2
    mascara = Image.new("L", (sw, sh), 0)
    ImageDraw.Draw(mascara).rounded_rectangle([0, 0, sw - 1, sh - 1], radius=RADIO, fill=255)
    halo = Image.new("L", (W, H), 0)
    m = round(10 * ESCALA)
    ImageDraw.Draw(halo).rounded_rectangle([x0 - m, y0 - m, x0 + sw + m, y0 + sh + m], radius=RADIO + m, fill=150)
    halo = halo.filter(ImageFilter.GaussianBlur(40 * ESCALA))
    fondo = Image.composite(Image.new("RGB", (W, H), (70, 95, 200)), Image.new("RGB", (W, H), (12, 12, 13)), halo)

    def componer(i, t):
        z, cx, cy = camara(cam, t)
        cw, ch = vw / z, vh / z
        left = min(max(cx - cw / 2, 0), vw - cw)
        top = min(max(cy - ch / 2, 0), vh - ch)
        shot = Image.open(SRC / "f" / frames[i]["f"]).convert("RGB")
        caja = tuple(v * dsf for v in (left, top, left + cw, top + ch))
        vista = shot.resize((sw, sh), Image.LANCZOS, box=caja)
        out = fondo.copy()
        out.paste(vista, (x0, y0), mascara)
        return out

    total = round((fin - t0) / 1000 * FPS)
    GEN.mkdir(parents=True, exist_ok=True)
    video = GEN / "margon-demo.mp4"
    ff = subprocess.Popen(
        ["ffmpeg", "-y", "-loglevel", "error", "-f", "rawvideo", "-pix_fmt", "rgb24", "-s", f"{W}x{H}", "-r", str(FPS), "-i", "-",
         "-an", "-c:v", "libx264", "-preset", "slow", "-crf", "25", "-pix_fmt", "yuv420p", "-profile:v", "high",
         "-movflags", "+faststart", "-g", str(FPS * 2), str(video)],
        stdin=subprocess.PIPE)
    primero, i = None, 0
    for n in range(total):
        t = t0 + n * 1000 / FPS
        while i + 1 < len(frames) and frames[i + 1]["ts"] <= t:
            i += 1
        img = componer(i, t)
        if primero is None:
            primero = img
        resto = (total - 1 - n) / FPS
        if resto < FUNDIDO:
            img = Image.blend(primero, img, resto / FUNDIDO)
        ff.stdin.write(img.tobytes())
    ff.stdin.close()
    if ff.wait():
        sys.exit("ffmpeg ha fallado")
    primero.resize((762, 720), Image.LANCZOS).save(GEN / "cms-card-margon.jpg", quality=88)
    print(f"{video.relative_to(ROOT)}: {total / FPS:.1f} s, {W}×{H}, {video.stat().st_size / 1024:.0f} KB")
    print(f"{(GEN / 'cms-card-margon.jpg').relative_to(ROOT)}: 762×720 (primer fotograma)")


if __name__ == "__main__":
    main()
