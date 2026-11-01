"""Integra el cuestionario en public y corrige solo las CTA de diagnóstico."""
from pathlib import Path
import base64
import re
ROOT=Path(__file__).resolve().parent.parent

def integrar():
    public=ROOT/'public'
    source=ROOT/'assets-banteq/diagnostico'
    s=(source/'cuestionario-procesos.src.html').read_text()
    s=s.replace('__GEIST__',base64.b64encode((source/'geist.woff2').read_bytes()).decode())
    (public/'diagnostico.html').write_text(s)
    for p in public.rglob('*'):
        if p.suffix not in ('.html','.mjs') or p.name=='diagnostico.html':continue
        t=p.read_text();old=t
        if p.suffix=='.html':
            def link(m):
                visible=re.sub(r'\s+',' ',re.sub(r'<[^>]+>',' ',m[0])).strip()
                if re.fullmatch(r'(?:(?:Solicitar diagnóstico|Quiero mejorar)\s*){1,2}',visible):
                    return re.sub(r'href="[^"]*"','href="/diagnostico"',m[0])
                if visible=='Hablemos':
                    return re.sub(r'href="[^"]*"','href="#hablemos"',m[0])
                return m[0]
            t=re.sub(r'<a\b[^>]*>.*?</a>',link,t,flags=re.S)
        else:
            # Propiedad del botón en los módulos Framer; no cambia las CTA de contacto.
            def prop(m):
                return re.sub(r'fLS9iwM5O:(?:`[^`]*`|e\[\d\])','fLS9iwM5O:`/diagnostico`',m[0])
            t=re.sub(r'\{fLS9iwM5O:[^{}]{0,280}q0dQpavo3:`(?:Solicitar diagnóstico|Quiero mejorar)`[^{}]{0,150}\}',prop,t)
            t=re.sub(r'overrides:\{tIuLSDdLr:\{fLS9iwM5O:e\[1\]\},tVeeAf4hB:\{fLS9iwM5O:e\[2\]\}\}[^{}]{0,100}children:g\(wt,\{[^{}]{0,240}q0dQpavo3:`(?:Solicitar diagnóstico|Quiero mejorar)`', lambda m: m[0].replace('fLS9iwM5O:e[1]','fLS9iwM5O:`/diagnostico`').replace('fLS9iwM5O:e[2]','fLS9iwM5O:`/diagnostico`'),t)
        if old!=t:p.write_text(t)

if __name__=='__main__':integrar()
