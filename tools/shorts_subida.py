"""Páginas informativas del cliente local de YouTube; sin OAuth ni datos de canales en la web."""
from pathlib import Path
from html import escape
import shutil

ROOT = Path(__file__).resolve().parent.parent

CSS = '''
@font-face{font-family:Geist;src:url(/shorts-subida/geist.woff2) format('woff2');font-display:swap}
:root{color-scheme:light;--ink:#202020;--muted:#555;--paper:#f6f6f4;--line:#cececa}
*{box-sizing:border-box}body{margin:0;background:var(--paper);color:var(--ink);font:400 1.0625rem/1.7 Geist,Arial,sans-serif}
::selection{background:#202020;color:white}a{color:inherit;text-underline-offset:.25em;text-decoration-thickness:1px}a:hover{color:#53506c}
a:focus-visible{outline:2px solid #514bb3;outline-offset:5px}header,main,footer{width:min(100% - 3rem,70rem);margin-inline:auto}
header{display:flex;align-items:center;justify-content:space-between;gap:2rem;padding:2rem 0;border-bottom:1px solid var(--line)}
.brand{font-size:1.4rem;font-weight:650;letter-spacing:-.03em;text-decoration:none}nav{display:flex;gap:1.4rem;flex-wrap:wrap;font-size:.9375rem}
main{padding:5rem 0 6rem;display:grid;grid-template-columns:minmax(0,1fr) minmax(0,2fr);column-gap:4rem}
.intro{grid-column:1/-1;margin-bottom:4rem;max-width:57rem}h1{font-size:clamp(2.5rem,6vw,5rem);font-weight:520;line-height:1.04;letter-spacing:-.04em;margin:0 0:1.5rem;text-wrap:balance}
.lead{font-size:clamp(1.2rem,2vw,1.5rem);line-height:1.5;max-width:48rem;margin:1.75rem 0;color:var(--muted)}
.date{font-size:.9375rem;color:var(--muted)}aside{font-size:.9375rem;color:var(--muted);max-width:24ch}
article{min-width:0;max-width:70ch}section+section{margin-top:2.75rem;padding-top:2.75rem;border-top:1px solid var(--line)}
h2{font-size:1.5rem;font-weight:560;line-height:1.25;letter-spacing:-.02em;margin:0 0 1rem;text-wrap:balance}p{margin:0 0 1rem}li+li{margin-top:.65rem}ul,ol{padding-left:1.3rem}
.links{display:flex;gap:1.25rem;flex-wrap:wrap;margin-top:2rem}.links a{padding:.65rem 0}footer{border-top:1px solid var(--line);padding:2rem 0 3rem;font-size:.9375rem;display:flex;justify-content:space-between;gap:1.5rem;flex-wrap:wrap}
@media(max-width:700px){header{align-items:flex-start;gap:1.25rem;flex-direction:column}nav{gap:1rem}main{display:block;padding-top:3rem}.intro{margin-bottom:2.5rem}aside{max-width:65ch;margin-bottom:2rem}h1{font-size:3rem}footer{display:block}footer nav{margin-top:1rem}}
'''.replace('margin:0 0:1.5rem','margin:0 0 1.5rem')

PAGES = {
    '': ('Shorts subida', 'Una herramienta de escritorio para subir y programar vídeos en los canales de YouTube de su propietario.', '''
<section><h2>Qué hace</h2><p>Shorts subida permite a su propietario preparar títulos y descripciones, subir vídeos y programar su publicación en sus propios canales de YouTube. Es una herramienta local de uso personal gestionada por Pol Carabante Martin, bajo la marca Banteq.</p><p>Esta web presenta la herramienta y sus prácticas de datos. La conexión con YouTube y las subidas se ejecutan en el ordenador del propietario.</p></section>
<section><h2>Cómo se conecta a YouTube</h2><ol><li>El propietario inicia sesión directamente en Google y elige el canal que desea conectar.</li><li>Google solicita su consentimiento para subir vídeos y consultar la información de su canal.</li><li>La herramienta comprueba qué canal se ha conectado y guarda una autorización independiente para cada canal.</li><li>El propietario prepara el contenido y ejecuta la subida o programación desde su ordenador.</li></ol></section>
<section><h2>Para qué pide permisos</h2><p>El permiso de subida permite enviar vídeos y sus metadatos a YouTube. El permiso de lectura permite identificar el canal conectado y consultar sus datos básicos, como el nombre, el número de vídeos y las estadísticas generales del canal. Esa comprobación ayuda a evitar subidas al canal equivocado.</p><p>La herramienta no necesita conocer la contraseña de Google. El consentimiento se concede en las páginas de Google.</p></section>
<section><h2>Uso personal y control del propietario</h2><p>Actualmente no se ofrece registro público ni acceso para clientes externos. Los archivos de vídeo, las colas de trabajo y las autorizaciones se guardan en el ordenador del propietario. Puedes consultar los detalles de conservación, revocación y eliminación en la política de privacidad.</p><div class="links"><a href="/shorts-subida/privacidad">Privacidad de Shorts subida</a><a href="/shorts-subida/condiciones">Condiciones de uso</a></div></section>
'''),
    'privacidad': ('Privacidad de Shorts subida', 'Cómo se utilizan los datos de Google y YouTube en esta herramienta de escritorio.', '''
<section><h2>Responsable y alcance</h2><p>El responsable es Pol Carabante Martin, que opera bajo la marca Banteq. Contacto: <a href="mailto:pol@banteq.org">pol@banteq.org</a>. Los datos identificativos completos figuran en el <a href="/aviso-legal">aviso legal de Banteq</a>.</p><p>Esta política describe Shorts subida, una herramienta local para los canales de su propietario. La navegación por la web de Banteq se describe en su <a href="/privacidad">política de privacidad general</a>.</p></section>
<section><h2>Datos a los que accede</h2><ul><li>Credenciales del cliente OAuth y autorizaciones de Google, incluidos los tokens necesarios para mantener la conexión.</li><li>Identificador y nombre del canal, y estadísticas básicas como el número de vídeos y suscriptores.</li><li>Vídeos seleccionados por el propietario, títulos, descripciones, etiquetas, ajustes de privacidad y fechas de publicación.</li><li>Colas de trabajo, identificadores de vídeos subidos y registros de las operaciones de la herramienta.</li></ul><p>La herramienta no recibe ni almacena la contraseña de tu cuenta de Google.</p></section>
<section><h2>Uso de los datos</h2><p>Los datos se utilizan para comprobar la identidad de cada canal, mantener la conexión autorizada y ejecutar las subidas o programaciones elegidas por el propietario. La conexión se basa en el consentimiento concedido directamente en Google y puede revocarse.</p><p>Los datos obtenidos de Google y YouTube no se venden, no se utilizan para publicidad y no se utilizan para entrenar modelos de inteligencia artificial de propósito general.</p></section>
<section><h2>Dónde se guardan y con quién se comparten</h2><p>Las autorizaciones, las colas y los registros se guardan en archivos locales del ordenador donde se ejecuta la herramienta. Los archivos de credenciales tienen acceso restringido al usuario del sistema. Es responsabilidad del propietario proteger el equipo y sus copias de seguridad.</p><p>Los vídeos y metadatos elegidos se transmiten a Google y YouTube para ejecutar las operaciones autorizadas. Estas páginas informativas de Banteq no reciben las credenciales de los canales ni los vídeos de la herramienta. No se ha configurado una base de datos web para almacenarlos.</p><p>Google y YouTube tratan los datos transmitidos conforme a sus propias condiciones y a la <a href="https://policies.google.com/privacy">Política de Privacidad de Google</a>.</p></section>
<section><h2>Conservación, revocación y eliminación</h2><p>Las autorizaciones se conservan localmente mientras el propietario mantenga la conexión; las colas, los identificadores y los registros permanecen hasta que los elimine. La herramienta no incorpora un borrado automático por plazo.</p><p>Puedes retirar el acceso de Shorts subida desde las <a href="https://myaccount.google.com/connections">conexiones de tu cuenta de Google</a>. Después, elimina las autorizaciones locales y los datos de trabajo que ya no necesites, incluidas las copias de seguridad bajo tu control.</p><p>Revocar el acceso o borrar los archivos locales no elimina los vídeos que ya se hayan enviado a YouTube. Puedes gestionarlos o eliminarlos desde YouTube Studio.</p><p>Para consultas o solicitudes de acceso, rectificación, supresión o limitación de datos personales bajo responsabilidad de Banteq, escribe a <a href="mailto:pol@banteq.org">pol@banteq.org</a>. También puedes acudir a la autoridad de protección de datos competente.</p></section>
<section><h2>Compromisos y cambios</h2><p>El uso y la transferencia de información recibida de las APIs de Google respetarán la <a href="https://developers.google.com/terms/api-services-user-data-policy">Política de Datos del Usuario de los Servicios de las APIs de Google</a>, incluidos sus requisitos de uso limitado.</p><p>Esta política se actualizará si cambia el funcionamiento de la herramienta. Cualquier acceso adicional a datos deberá explicarse y autorizarse antes de utilizarse.</p></section>
'''),
    'condiciones': ('Condiciones de Shorts subida', 'Condiciones para el uso personal de la herramienta y su conexión con YouTube.', '''
<section><h2>Objeto y acceso</h2><p>Shorts subida es una herramienta de escritorio de uso personal gestionada por Pol Carabante Martin, bajo la marca Banteq, para subir y programar vídeos en canales de YouTube que está autorizado a administrar. No se ofrece actualmente como servicio público ni dispone de registro abierto.</p></section>
<section><h2>Responsabilidad sobre las publicaciones</h2><p>El propietario elige el canal, los vídeos, sus textos, los ajustes de privacidad y las fechas. Debe contar con los derechos y autorizaciones necesarios sobre el contenido y revisar su exactitud antes de ejecutar una subida.</p><p>Usar la herramienta no concede derechos sobre contenidos de terceros ni permite eludir las normas de YouTube.</p></section>
<section><h2>Servicios de Google y YouTube</h2><p>La herramienta utiliza YouTube API Services. Su uso está sujeto a las <a href="https://www.youtube.com/t/terms">Condiciones del Servicio de YouTube</a> y al resto de políticas aplicables. El tratamiento de datos se explica en la <a href="/shorts-subida/privacidad">política de privacidad de Shorts subida</a> y en la <a href="https://policies.google.com/privacy">Política de Privacidad de Google</a>.</p><p>Google y YouTube pueden aplicar cuotas, revisiones, cambios de permisos o restricciones. No se garantiza que una subida o publicación programada se complete en una fecha determinada. El propietario debe comprobar su estado en YouTube Studio.</p></section>
<section><h2>Protección del acceso y finalización</h2><p>El propietario debe proteger su ordenador y las autorizaciones de los canales. Puede dejar de utilizar la herramienta en cualquier momento, revocar el acceso desde Google y eliminar los archivos locales siguiendo la política de privacidad.</p></section>
<section><h2>Contacto</h2><p>Para consultas sobre la herramienta, escribe a <a href="mailto:pol@banteq.org">pol@banteq.org</a>. Puedes consultar la identidad del responsable en el <a href="/aviso-legal">aviso legal de Banteq</a>.</p></section>
'''),
}

def integrar():
    root = ROOT / 'public' / 'shorts-subida'
    root.mkdir(exist_ok=True)
    shutil.copyfile(ROOT / 'assets-banteq' / 'diagnostico' / 'geist.woff2', root / 'geist.woff2')
    for slug, (title, lead, content) in PAGES.items():
        folder = root / slug
        folder.mkdir(exist_ok=True)
        route = '/shorts-subida' + ('/' + slug if slug else '')
        nav = '<nav aria-label="Shorts subida"><a href="/shorts-subida">Herramienta</a><a href="/shorts-subida/privacidad">Privacidad</a><a href="/shorts-subida/condiciones">Condiciones</a></nav>'
        html = f'''<!doctype html><html lang="es"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>{escape(title)} | Banteq</title><meta name="description" content="{escape(lead, quote=True)}"><link rel="canonical" href="https://banteq.com{route}"><link rel="icon" href="/favicon.ico"><style>{CSS}</style></head><body><header><a class="brand" href="/" aria-label="Banteq, página principal">Banteq</a>{nav}</header><main><div class="intro"><h1>{escape(title)}</h1><p class="lead">{escape(lead)}</p><p class="date">Última actualización: 18 de noviembre de 2026</p></div><aside>Una herramienta local de uso personal. El acceso a cada canal se autoriza directamente en Google.</aside><article>{content}</article></main><footer><span>© Banteq 2026</span><nav aria-label="Información de Banteq"><a href="/aviso-legal">Aviso legal</a><a href="mailto:pol@banteq.org">Contacto</a></nav></footer></body></html>'''
        (folder / 'index.html').write_text(html, encoding='utf-8')

if __name__ == '__main__':
    integrar()
