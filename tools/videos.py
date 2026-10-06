"""Vídeos de la plantilla recodificados para que el navegador los decodifique por hardware.

El fondo del pie venía en 4K (3840 × 2160) y H.264 High 4:2:2 de 10 bits: ni los Mac ni los
iPhone tienen decodificación por hardware para ese perfil, así que el procesador lo decodificaba
por software en todas las páginas (el pie está en todas y la de contacto es casi solo pie). Se
sirve a 1920 × 1080, 4:2:0 de 8 bits y sin audio; bajo el velo y el desenfoque del pie no se
aprecia diferencia.

    python3 tools/videos.py          → assets-banteq/generado/pie-video.mp4 y su póster (los copia tools/build.py)
    python3 tools/videos.py poster   → solo el póster
"""
import subprocess
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
SRC = ROOT / "plantilla-original/framerusercontent.com/assets/S4N88TVzCfxigg9YZYcSIYNPk4.mp4"
DST = ROOT / "assets-banteq/generado/pie-video.mp4"


def pie():
    subprocess.run(
        ["ffmpeg", "-hide_banner", "-loglevel", "error", "-y", "-i", str(SRC), "-an",
         "-vf", "scale=1920:1080:flags=lanczos,format=yuv420p",
         "-c:v", "libx264", "-profile:v", "high", "-preset", "slow", "-crf", "22",
         "-g", "50", "-movflags", "+faststart", str(DST)],
        check=True,
    )
    print(DST.name, f"{DST.stat().st_size / 1e6:.2f} MB")


POSTER = ROOT / "assets-banteq/generado/pie-video-poster.jpg"


def pie_poster():
    """Primer fotograma del vídeo del pie, pequeño (es un fondo difuso): lo usa el HTML inicial de
    la página de contacto, donde ese vídeo es el fondo de la primera pantalla, hasta que el vídeo
    de verdad tiene su primer fotograma."""
    subprocess.run(
        ["ffmpeg", "-hide_banner", "-loglevel", "error", "-y", "-i", str(DST), "-frames:v", "1",
         "-vf", "scale=960:540:flags=lanczos", "-q:v", "5", str(POSTER)],
        check=True,
    )
    print(POSTER.name, f"{POSTER.stat().st_size / 1e3:.0f} KB")


if __name__ == "__main__":
    import sys

    if sys.argv[1:2] == ["poster"]:
        pie_poster()
    else:
        pie()
        pie_poster()
