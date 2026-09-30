"""Vídeos de la plantilla recodificados para que el navegador los decodifique por hardware.

El fondo del pie venía en 4K (3840 × 2160) y H.264 High 4:2:2 de 10 bits: ni los Mac ni los
iPhone tienen decodificación por hardware para ese perfil, así que el procesador lo decodificaba
por software en todas las páginas (el pie está en todas y la de contacto es casi solo pie). Se
sirve a 1920 × 1080, 4:2:0 de 8 bits y sin audio; bajo el velo y el desenfoque del pie no se
aprecia diferencia.

    python3 tools/videos.py      → assets-banteq/generado/pie-video.mp4 (lo copia tools/build.py)
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


if __name__ == "__main__":
    pie()
