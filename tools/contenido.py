"""Contenido de la web de Banteq.

Fuentes del contenido (sin inventar cifras, testimonios ni proyectos):
- Web anterior (Kairvia): servicios de automatización, Microsoft Copilot, formación FUNDAE,
  proceso de trabajo, seguridad y FAQ.
- Repositorio de la web de Margon (~/margon-web): alcance real del proyecto.
- Repositorio de la web de RentUp Capital (~/Desktop/PÁGINAS WEB/rentupv2): alcance real.

Cada entrada es (texto original de la plantilla, texto de Banteq).
"""

# Microsoft Copilot y formación FUNDAE: retirados temporalmente de la web (aún no se ofrecen).
# Todo su contenido sigue en este archivo. Con True vuelven la sección «Microsoft Copilot y
# formación FUNDAE» (con el enlace al simulador de crédito), la tarjeta de Copilot en servicios, la
# pregunta sobre FUNDAE, «IA y Copilot» en el carrusel de «Quiénes somos», las menciones en contacto
# y aviso legal, la numeración 001–009 y los metadatos. Después: python3 tools/build.py (y
# python3 tools/assets.py og para la imagen de redes).
MOSTRAR_COPILOT_FUNDAE = False

# «¿Por qué Banteq?» (título, subtítulo y las tres tarjetas: negocio, de principio a fin, a medida):
# retirada de la web. Sus textos siguen en este archivo y se construye igual, pero no se publica:
# ni su HTML, ni la sección en el módulo de la home, ni su CSS (no se piden sus imágenes). Solo
# queda, sin ejecutarse, la definición del componente de tarjeta dentro del paquete de Framer.
# Con True vuelve en su sitio, entre «Quiénes somos» y «Automatización e IA», con su ancla
# #por-que-banteq y la numeración corrida.
MOSTRAR_POR_QUE_BANTEQ = False

META_TITLE = "Banteq | Automatización, IA y desarrollo web en Barcelona"
# Descripción para buscadores y redes (home y páginas sin una propia). Texto fijado por Banteq: no
# menciona Copilot ni FUNDAE, que ya no se ofrecen (MOSTRAR_COPILOT_FUNDAE no la cambia).
META_DESCRIPTION = (
    "Banteq Digital ayuda a las empresas a mejorar sus procesos mediante automatización, "
    "inteligencia artificial y desarrollo web a medida."
)

# Identidad en buscadores (tools/build.py → apply_seo): dominio canónico, sin www ni barra final, y
# nombre del sitio para Google (el que muestra encima de la URL en los resultados).
SITIO = "https://banteq.com"
NOMBRE_SITIO = "Banteq"
NOMBRE_ALTERNATIVO = "Banteq Digital"

# Dónde está Banteq y dónde trabaja. Se nombra de forma natural: una vez por página, sin listas de
# municipios.
LOCALIDAD = "Santa Perpètua de Mogoda"
PROVINCIA = "Barcelona"
# Desde el 2026-11-13 (auditoría SEO): la sede es la real y la zona de servicio, toda España en remoto.
ZONA_FRASE = "Estamos en Santa Perpètua de Mogoda (Barcelona) y trabajamos con empresas de Barcelona, el Vallès y, en remoto, del resto de España."
# Zona de servicio en los datos estructurados (de más cercana a más amplia). Sin lista de municipios.
ZONAS_SERVICIO = [("AdministrativeArea", "Vallès Occidental"), ("AdministrativeArea", "Barcelona"),
                  ("AdministrativeArea", "Cataluña"), ("Country", "España")]
CODIGO_POSTAL = "08130"
EMAIL_CONTACTO = "pol@banteq.org"  # el que ya publican el aviso legal y la política de privacidad
# Perfiles oficiales de Banteq en otras webs (datos estructurados: sameAs). Solo perfiles reales y
# reclamados: el de Trustpilot (verificado con el archivo de assets-banteq/raiz/). Añadir aquí los de
# LinkedIn, Google Business Profile, etc. cuando existan.
PERFILES = ["https://es.trustpilot.com/review/banteq.com"]
# Temas de los que trata la web (datos estructurados: knowsAbout). Solo lo que Banteq ofrece.
TEMAS = ["Automatización de procesos", "Inteligencia artificial aplicada a empresas", "n8n", "Make",
         "Integración de herramientas mediante API", "Desarrollo web a medida", "Rediseño de páginas web",
         "Mantenimiento web"]

# Pregunta nueva de la home (ocupa el hueco de la de FUNDAE, que ya no se publica).
FAQ_ZONA = ("¿Dónde trabajáis?", ZONA_FRASE + " Cuéntanos tu caso y vemos la mejor forma de empezar.")

# Orden final de las secciones de la home (la de equipo se elimina: no hay equipo documentado).
ORDEN_SECCIONES = [
    "Hero Section",
    "About Section",
    "Value Section",
    "Service Section",
    "Pricing Section",
    "Testimonial Section",
    "Case Studies Section",
    "Process Section",
    "Integrations Section",
    "FAQs Section",
]

# Secciones que se construyen igual (todos sus textos se aplican) pero no se publican: el build las
# quita al final del módulo de la home y del HTML. Volver a mostrarlas no requiere nada más.
SECCIONES_OCULTAS = ([] if MOSTRAR_POR_QUE_BANTEQ else ["Value Section"]) + (
    [] if MOSTRAR_COPILOT_FUNDAE else ["Pricing Section"]
)

# Anclas de sección en español (id original → id nuevo).
ANCLAS = {
    "about": "banteq",
    "value": "por-que-banteq",
    "service": "servicios",
    "pricing": "copilot-fundae" if MOSTRAR_COPILOT_FUNDAE else "seccion-oculta",
    "testimonial": "desarrollo-web",
    "project": "proyectos",
    "process": "como-trabajamos",
    "intergration": "herramientas",
    "faq": "preguntas-frecuentes",
}

# Rutas de página (ruta de Framer → ruta de Banteq).
RUTAS = {
    "/contact": "/contacto",
    "/case-studies": "/proyectos",
    "/terms-of-service": "/aviso-legal",
    "/privacy-policy": "/privacidad",
}

# Etiquetas de sección (número, nombre) en el orden nuevo. La numeración (001, 002…) se calcula
# con las secciones visibles, para que no salte ningún número si alguna está oculta.
_ETIQUETAS = [
    (("001", "who we are"), "quiénes somos", "About Section"),
    (("002", "value"), "por qué banteq", "Value Section"),
    (("003", "Capabilities"), "automatización e ia", "Service Section"),
    (("008", "pricing"), "copilot y fundae", "Pricing Section"),
    (("007", "testimonial"), "desarrollo web", "Testimonial Section"),
    (("005", "Case studies"), "proyectos", "Case Studies Section"),
    (("004", "process"), "cómo trabajamos", "Process Section"),
    (("006", "integrations"), "herramientas", "Integrations Section"),
    (("010", "FAQs"), "preguntas frecuentes", "FAQs Section"),
]


def _numerar(etiquetas):
    out, n = [], 0
    for original, nombre, seccion in etiquetas:
        n += seccion not in SECCIONES_OCULTAS
        out.append((original, (f"{n:03d}", nombre)))
    return out


ETIQUETAS = _numerar(_ETIQUETAS)

# Titulares animados palabra a palabra (el HTML los parte en <span> por palabra).
TITULARES = [
    ("Why Choose Us?", "¿Por qué Banteq?"),
    ("Our AI-Driven Services", "Automatización e inteligencia artificial"),
    ("Built for Growth at Every Stage", "Microsoft Copilot y formación FUNDAE"),
    ("What They’re Saying", "Webs que trabajan para tu negocio"),
    ("What We’ve Built", "Empresas que ya confían en Banteq"),
    ("How We Work", "Cómo trabajamos"),
    ("Technology Ecosystem", "Conectamos tus herramientas"),
    ("Common Questions", "Preguntas frecuentes"),
]

REVEAL = (
    "We help startups, SMEs & enterprises design and deploy intelligent automation systems that streamline operations and unlock scalable growth.",
    "Ayudamos a las empresas a trabajar mejor: analizamos cómo funcionan y aplicamos automatización, inteligencia artificial y desarrollo web donde de verdad aportan.",
)

# Sustituciones de texto en la home (módulo de la página + HTML pre-renderizado).
HOME = [
    # Hero
    ("Unicorn AI Partner", "Tecnología aplicada a empresas"),
    ("`Intelligent Automation `,g(`br`,{}),`for Modern Teams`", "`Tecnología que mejora `,g(`br`,{}),`cómo trabaja tu empresa`"),
    ("Intelligent Automation <br class=\"framer-text\">for Modern Teams", "Tecnología que mejora <br class=\"framer-text\">cómo trabaja tu empresa"),
    ("`Intelligent Automation for Modern Teams`", "`Tecnología que mejora cómo trabaja tu empresa`"),
    ("\"Intelligent Automation for Modern Teams\"", "\"Tecnología que mejora cómo trabaja tu empresa\""),
    (
        "We build AI-powered automation systems that eliminate manual work, reduce costs, and multiply your business performance.",
        "Analizamos cómo funciona tu empresa y aplicamos automatización, inteligencia artificial y desarrollo web para ganar tiempo, mejorar tu imagen y abrir nuevas oportunidades.",
    ),
    ("Work with Us", "Ver servicios"),
    # About: ticker
    ("`500+`", "`Procesos`"),
    (">500+<", ">Procesos<"),
    ("saved hours+", "automatizados"),
    ("`80%`", "`IA`"),
    (">80%<", ">IA<"),
    ("productivity boost", "y Copilot" if MOSTRAR_COPILOT_FUNDAE else "aplicada"),
    ("`5x`", "`Webs`"),
    (">5x<", ">Webs<"),
    ("FASTER RESPONSE", "a medida"),
    ("about us video thumbnail", "Banteq"),
    # Value
    ("We design business solutions aligned with your revenue goals.", "Analizamos procesos, herramientas y objetivos antes de proponer ninguna solución."),
    ("We design solutions aligned with your revenue goals.", "Analizamos cómo trabajas antes de proponer nada."),
    ("Business-First AI Strategy", "Primero, el negocio"),
    ("From strategy to development, followed by fast deployment.", "Diagnóstico, desarrollo, implantación, formación y soporte con un mismo equipo."),
    ("From strategy to development, followed by deployment.", "Del diagnóstico al soporte, con un mismo equipo."),
    ("End-to-End Implementation", "De principio a fin"),
    ("Custom-Built Automation", "Hecho a medida"),
    ("No templates. Every workflow is tailored to your unique operations.", "Sin plantillas: cada solución se adapta a tus herramientas y a tu forma de trabajar."),
    # Servicios (automatización e IA)
    ("AI Workflow Automation. ", "Automatización de procesos. "),
    ("AI Workflow Automation.", "Automatización de procesos.", "opcional"),
    (
        "Automate repetitive tasks across departments using intelligent triggers and decision logic.",
        "Documentos, facturas, correos, formularios y tareas repetitivas que se resuelven solos, con revisión humana donde hace falta.",
    ),
    ("Workflow mapping", "Mapa del proceso"),
    ("Real-time system integration.", "Conexión con tus herramientas"),
    ("Validated output", "Resultados supervisados"),
    ("AI Chatbots &amp; Conversational Agents.", "Asistentes de inteligencia artificial."),
    ("AI Chatbots & Conversational Agents.", "Asistentes de inteligencia artificial."),
    (
        "24/7 customer support, lead qualification, booking systems, and AI sales reps.",
        "Atención al cliente, consultas sobre tu documentación interna, clasificación de contactos y borradores de respuesta.",
    ),
    ("CRM &amp; Sales Automation.", "Ventas y CRM."),
    ("CRM & Sales Automation.", "Ventas y CRM."),
    (
        "Pipeline automation, AI lead scoring, follow-ups, predictive insights.",
        "Contactos clasificados, respuestas personalizadas, seguimiento automático y CRM siempre al día.",
    ),
    ("AI Data &amp; Reporting Systems. ", "Informes y datos. "),
    ("AI Data & Reporting Systems. ", "Informes y datos. "),
    ("AI Data & Reporting Systems.", "Informes y datos.", "opcional"),
    (
        "Automated dashboards, business intelligence, performance forecasting.",
        "Informes automáticos, métricas semanales y alertas para decidir con información al día.",
    ),
    ("Not sure what to automate first?", "¿No sabes por dónde empezar?"),
    ("Book a free 30-minute AI strategy session.<br class=\"framer-text\">", "En unos 30 minutos puedes dar el primer paso para cambiar cómo trabaja tu empresa y descubrir dónde recuperar tiempo.<br class=\"framer-text\">"),
    ("`Book a free 30-minute AI strategy session.`,g(`br`,{})", "`En unos 30 minutos puedes dar el primer paso para cambiar cómo trabaja tu empresa y descubrir dónde recuperar tiempo.`,g(`br`,{})"),
    (
        "We’ll analyze your current workflows and identify the highest-ROI automation opportunities for your business.",
        (
            "Preparamos dos diagnósticos separados: procesos y oportunidades de automatización. El primero organiza cómo trabajáis y ayuda a preparar el camino hacia ISO 9001. "
            "El segundo identifica tareas que podrían hacerse con menos tiempo y errores. Te contactaremos en menos de 72 horas naturales para comentar las conclusiones, los honorarios y las condiciones de entrega. "
            "Enviar el cuestionario no supone contratar ni pagar."
        ),
    ),
    # Botón de la tarjeta «Primero entendemos cómo trabajas»: va directo al cuestionario (/diagnostico).
    ("Schedule a Session", "Realizar diagnóstico avanzado"),
    # Copilot y FUNDAE (antes: precios)
    (
        "Whether you're starting small or scaling fast, we have an automation plan that fits.",
        "Implantamos Microsoft 365 Copilot y formamos a tu equipo para usarlo en su día a día. La formación puede bonificarse mediante FUNDAE.",
    ),
    ("Whether you&#x27;re starting small or scaling fast, we have an automation plan that fits.",
     "Implantamos Microsoft 365 Copilot y formamos a tu equipo para usarlo en su día a día. La formación puede bonificarse mediante FUNDAE.", "opcional"),
    ("Starter Automation", "Implantación de Copilot"),
    ("For small teams beginning their journey", "Para empresas que trabajan con Microsoft 365"),
    ("Growth Automation", "Formación en IA y Copilot"),
    ("For scaling businesses", "Bonificable con FUNDAE, según el crédito disponible"),
    ("Most Popular", "Bonificable"),
    ("What’s included:", "Qué incluye:"),
    ("Included everything in Starter, plus:", "Qué incluye:"),
    ("Workflow setup (1–3 systems)", "Revisión del entorno Microsoft 365"),
    ("Basic AI chatbot", "Configuración e implantación de Copilot"),
    ("CRM integration", "Casos de uso en Outlook, Teams, Word y Excel"),
    ("Advanced workflow automation", "Formación práctica con casos de tu empresa"),
    ("Multi-channel AI chatbot", "Contenidos adaptados a cada departamento"),
    ("Sales &amp; marketing automation", "Buenas prácticas de seguridad y datos"),
    ("Sales & marketing automation", "Buenas prácticas de seguridad y datos"),
    ("Dashboard &amp; reporting", "Gestión del crédito y la bonificación"),
    ("Dashboard & reporting", "Gestión del crédito y la bonificación"),
    ("Get Starter Package", "Implantar Copilot"),
    ("Get Growth Package", "Solicitar formación"),
    ("Not sure which plan is right for you?", "¿Cuánto crédito FUNDAE tiene tu empresa?"),
    ("Book a free 30-minute AI strategy session.", "Consúltalo en el simulador oficial y te ayudamos con el resto."),
    ("Book a Free Consultation", "Calcular mi crédito FUNDAE"),
    ("MONTHLY", "IMPLANTACIÓN"),
    ("ANNUALLY (SAVE 10%)", "FORMACIÓN"),
    # Desarrollo web (antes: testimonios)
    ("Scaling SaaS Operations with AI Automation", "Margon: web corporativa en cinco idiomas"),
    ("How Puno Automated 80% of Lead Handling", "RentUp Capital: web y formularios conectados"),
    ("Daniel Kim", "Diseño y desarrollo web"),
    ("Founder, ScaleLabs Education", "Webs corporativas"),
    (
        "Our enrollment process used to require manual follow-ups and spreadsheet tracking. Now, AI handles lead qualification, scheduling, reminders, and CRM updates automatically. We’ve increased enrollment conversion by 35% in just one quarter.",
        "Webs modernas y cuidadas al detalle, pensadas para explicar bien lo que haces, transmitir confianza y convertir visitas en contactos.",
    ),
    ("Alex Johnson", "Rediseño de webs"),
    ("Head of Operations, Finovate Consulting", "De web antigua a web actual"),
    (
        "Security and compliance were major concerns for us. They designed an automation architecture that was not only highly efficient but enterprise-grade secure.",
        "Renovamos webs que se han quedado atrás: nueva imagen, mejor estructura y una experiencia pensada primero para el móvil.",
    ),
    ("David Lee", "Experiencias interactivas"),
    ("Founder, Atodio Studio", "Animaciones y 3D"),
    (
        "We were spending hours on repetitive tasks. Their automation system saved us 30+ hours per week and dramatically improved our sales performance. Really impressive!",
        "Animaciones, transiciones y recorridos interactivos que hacen que tu producto o servicio se entienda de un vistazo.",
    ),
    ("Sarah Mitchell", "Formularios y captación"),
    ("COO, BrightPath SaaS", "Cada contacto, registrado"),
    (
        "We struggled with inconsistent lead follow-ups and slow response times. Their AI automation blueprint gave us clarity first, then execution. Now, our CRM runs intelligently, leads are scored automatically, and follow-ups happen without manual effort. We’ve increased demo bookings by 40% while reducing operational friction.",
        "Formularios que guardan cada solicitud en tu CRM, envían la confirmación a quien escribe y avisan a tu equipo al momento, sin trabajo manual.",
    ),
    ("Jonathan Reed", "Integraciones con IA"),
    ("Managing Director, Nexora Digital Agency", "Tu web, conectada"),
    (
        "We were scaling fast but drowning in manual workflows. Their automation system connected our CRM, email marketing, and reporting into one intelligent flow. The result? 30+ hours saved per week and complete visibility across our pipeline.",
        "Conectamos la web con tu correo, tu CRM o tus automatizaciones, y añadimos inteligencia artificial donde aporta valor de verdad.",
    ),
    ("Michael Tran", "Responsive y rendimiento"),
    ("Founder & CEO, Skyline Realty Group", "Perfecta en cualquier pantalla"),
    ("Founder &amp; CEO, Skyline Realty Group", "Perfecta en cualquier pantalla"),
    (
        "We reduced admin work by nearly 50% and doubled our qualified appointment bookings. The ROI was faster than we expected — and the system continues to scale with us.",
        "Diseño adaptado a móvil, tablet y escritorio, con buen rendimiento y una base técnica preparada para crecer contigo.",
    ),
    ("Laura Martinez", "Soluciones a medida"),
    ("CMO, Elevate Commerce Co.", "Lo que tu negocio necesite"),
    (
        "Marketing automation always felt fragmented — too many tools, not enough cohesion. They unified everything into one intelligent ecosystem. Campaign triggers, abandoned cart flows, segmentation — all automated with precision.",
        "Varios idiomas, newsletter, áreas específicas o funcionalidades propias: desarrollamos lo que tu negocio necesita, sin plantillas.",
    ),
    # Variantes de tablet y valores por defecto de componentes
    ("Automate repetitive tasks using intelligent triggers and decision logic.", "Documentos, facturas, correos y formularios que se resuelven solos, con revisión humana.", "opcional"),
    ("Automated dashboards, business intelligence, forecasting.", "Informes automáticos, métricas y alertas para decidir con datos.", "opcional"),
    (
        "We were spending hours on repetitive tasks. Their automation system saved us 30+ hours per week and dramatically improved our sales performance.",
        "Animaciones, transiciones y recorridos interactivos que hacen que tu producto o servicio se entienda de un vistazo.",
        "opcional",
    ),
    ("We analyze your workflows, bottlenecks, and revenue opportunities.", "Analizamos cómo trabaja tu empresa y dónde se pierde tiempo.", "opcional"),
    # Proyectos
    ("Explore all Case Studies", "Ver todos los proyectos"),
    # Proceso
    (
        "A proven process designed to transform complex workflows into scalable AI-powered systems — efficiently and strategically.",
        "Un proceso claro para pasar de tareas manuales a sistemas que funcionan, con tu equipo implicado en cada paso.",
    ),
    ("We analyze your workflows, bottlenecks, and revenue.", "Analizamos cómo trabaja tu empresa y dónde se pierde tiempo."),
    ("Discovery & Audit", "Diagnóstico"),
    ("Discovery &amp; Audit", "Diagnóstico"),
    (
        "We analyze your business workflows, bottlenecks, and revenue opportunities.",
        "Analizamos cómo trabaja tu empresa y detectamos tareas repetitivas, lentas o propensas a errores.",
    ),
    ("Automation Blueprint", "Mapa y diseño"),
    (
        "We design a detailed automation architecture aligned with KPIs.",
        "Definimos qué hará la tecnología, qué revisará tu equipo y qué herramientas se conectan.",
    ),
    ("Build & Integration", "Desarrollo e integración"),
    ("Build &amp; Integration", "Desarrollo e integración"),
    (
        "Our engineers implement AI systems and integrate with your existing tools.",
        "Construimos la solución y la conectamos con tu correo, Drive, Excel, CRM, ERP, WhatsApp o tu web.",
    ),
    ("Testing & Optimization", "Pruebas y ajustes"),
    ("Testing &amp; Optimization", "Pruebas y ajustes"),
    (
        "Performance testing, data validation, iterative refinement and optimization.",
        "Validamos con datos reales o de prueba y ajustamos hasta que el resultado es fiable.",
    ),
    ("Launch, monitor, and continuously optimize systems.", "Formamos a tu equipo y damos soporte con el uso real."),
    ("Deployment & Scaling", "Formación y soporte"),
    ("Deployment &amp; Scaling", "Formación y soporte"),
    (
        "Launch, monitor, and continuously optimize systems to support scalable growth.",
        "Formamos a tu equipo, dejamos documentación y seguimos ajustando el sistema con el uso real.",
    ),
    # Herramientas
    ("Try with Conicorn", "Hablemos"),
    (
        "Our automation architecture connects data, workflows, and platforms into a secure, high-performance system that grows with you.",
        "Trabajamos con las herramientas que ya usa tu empresa y las conectamos entre sí para que la información fluya sin copiar y pegar.",
    ),
    # FAQ
    ("What industries do you work with?", "¿Con qué tipo de empresas trabajáis?"),
    (
        "We work with businesses across a wide range of industries including real estate, healthcare, e-commerce, finance, education, legal, SaaS, marketing agencies, and local service businesses. Our AI automation systems are customized to fit your workflows, whether you need lead generation, customer support, appointment booking, CRM automation, or internal operations optimization.",
        "Con empresas de cualquier sector que quieran trabajar mejor: pymes, equipos administrativos, empresas industriales, inversión inmobiliaria o negocios de servicios. Lo importante no es el sector, sino que haya procesos, datos o tareas que se puedan mejorar con tecnología.",
    ),
    ("How long does implementation take?", "¿Cuánto tarda un proyecto?"),
    (
        "Project timelines typically range from 2 to 6 weeks, depending on complexity. Smaller automation systems — such as AI chatbots with CRM integration — can often be deployed within 2–3 weeks. More advanced projects involving multi-platform integrations, custom AI logic, internal workflow automation, and reporting dashboards may take 4–6 weeks or longer.",
        "Depende del alcance. Una automatización concreta o una web corporativa no se plantean igual que un sistema que conecta varios departamentos. Después del diagnóstico te damos un plan con fases y plazos concretos.",
    ),
    (
        "Project timelines typically range from 2 to 6 weeks, depending on complexity.Smaller automation systems — such as AI chatbots with CRM integration — can often be deployed within 2–3 weeks.More advanced projects involving multi-platform integrations, custom AI logic, internal workflow automation, and reporting dashboards may take 4–6 weeks or longer.",
        "Depende del alcance. Una automatización concreta o una web corporativa no se plantean igual que un sistema que conecta varios departamentos. Después del diagnóstico te damos un plan con fases y plazos concretos.",
    ),
    ("Do we need technical knowledge to work with you?", "¿Necesitamos conocimientos técnicos?"),
    (
        "No technical background is required. We handle the entire process — from strategy and setup to integrations, testing, and deployment. Our goal is to make AI automation simple and accessible while ensuring your team can easily manage and use the system after launch.",
        "No. Nos encargamos del análisis, el desarrollo, las integraciones y las pruebas. Después formamos a tu equipo y dejamos documentación para que pueda usar el sistema con autonomía.",
    ),
    ("Is AI automation secure?", "¿La IA trabaja sin supervisión?"),
    (
        "Yes. Security and data privacy are a top priority in every system we build. We use secure APIs, encrypted connections, role-based access controls, and trusted platforms to ensure your business data remains protected. We also follow best practices for compliance and system reliability.",
        "No en los procesos sensibles. Diseñamos las automatizaciones con revisión humana, registro de acciones y validaciones: la IA prepara, clasifica y ejecuta tareas, y las decisiones importantes siguen pasando por una persona.",
    ),
    ("What kind of ROI can we expect?", "¿Qué es FUNDAE y cómo se bonifica la formación?" if MOSTRAR_COPILOT_FUNDAE else FAQ_ZONA[0]),
    (
        "Most businesses see ROI through reduced manual work, faster response times, increased lead conversion, and improved operational efficiency. Depending on the automation scope, clients often save dozens of hours per week while improving customer experience and scaling operations without increasing overhead.",
        "FUNDAE permite a las empresas usar un crédito anual para formar a su plantilla mediante bonificaciones en las cotizaciones a la Seguridad Social. Te ayudamos a calcular el crédito disponible y a gestionar la documentación; la bonificación final depende del crédito y de los requisitos de cada empresa."
        if MOSTRAR_COPILOT_FUNDAE else FAQ_ZONA[1],
    ),
    ("Have any other questions?", "¿Tienes otra pregunta?"),
    ("Contact Us", "Contactar"),
    # Botón principal
    ("Get this Template", "Quiero mejorar"),
]


# Tarjeta «¿No sabes por dónde empezar?»: tarjeta clara de la derecha (título + frase, sobre el botón).
# Recoge la idea de la antigua tarjeta «Seguridad y control en cada proceso», que ya no se muestra.
DIAGNOSTICO_NOTA = (
    "Primero entendemos cómo trabajas.",
    "Después automatizamos de forma segura: protegemos tus datos y mantenemos la revisión humana "
    "donde importa para evitar errores.",
)

# Variantes móviles que la plantilla escribe en dos líneas.
LINEAS_MOVIL = [
    (("Not sure which plan is", "right for you?"), ("¿Cuánto crédito FUNDAE", "tiene tu empresa?")),
]

# Precios de la plantilla → nombres de servicio (Copilot / FUNDAE). No se muestran precios.
PRECIOS = [
    ("`$499.`", "`Copilot`"), (">$499.<", ">Copilot<"),
    ("`$399.`", "`Copilot`"), (">$399.<", ">Copilot<", "opcional"),
    ("`$1199.`", "`FUNDAE`"), (">$1199.<", ">FUNDAE<"),
    ("`$1099.`", "`FUNDAE`"), (">$1099.<", ">FUNDAE<", "opcional"),
    ("`$499.00`", "`Copilot`"), ("`$1199.00`", "`FUNDAE`"),
    ("`/Month`", "`Microsoft 365`"), (">/Month<", ">Microsoft 365<"),
]

# Integraciones: (etiqueta original, etiqueta nueva, icono Simple Icons o dibujo propio).
INTEGRACIONES = [
    ("HubSpot", "Microsoft 365", "microsoft"),
    ("Salesforce", "n8n", "n8n"),
    ("Zoho", "Make", "make"),
    ("Mailchimp", "OpenAI", "openai"),
    ("ActiveCampaign", "WhatsApp", "whatsapp"),
    ("Zapier", "Google Drive", "googledrive"),
    ("OpenAI", "Notion", "notion"),
    ("Cloud AI", "Airtable", "airtable"),
    ("Make", "Odoo", "odoo"),
    ("Custom APIs", "APIs a medida", "api"),
]

# Pie: el copyright nombra dónde está Banteq (señal local en todas las páginas).
PIE_COPYRIGHT = "© Banteq 2026 · Santa Perpètua de Mogoda, Barcelona"

# Navegación y pie (módulo compartido).
NAV = [
    ("`Get this Template`", "`Hablemos`"),
    ("`Menu`", "`Menú`"),
    ("`Home`", "`Inicio`"),
    ("QxmZp6UDH:`Case Studies`", "QxmZp6UDH:`Proyectos`"),
    ("QxmZp6UDH:`Contact`", "QxmZp6UDH:`Contacto`"),
    ("QxmZp6UDH:`404`", "QxmZp6UDH:`Servicios`"),
    ("QxmZp6UDH:`Terms`", "QxmZp6UDH:`Aviso legal`"),
    ("QxmZp6UDH:`Policy`", "QxmZp6UDH:`Privacidad`"),
    ("children:`Case Studies`", "children:`Proyectos`"),
    ("children:`Contact`", "children:`Contacto`"),
    ("children:`404`", "children:`Servicios`"),
    ("children:`Terms`", "children:`Aviso legal`"),
    ("children:`Privacy`", "children:`Privacidad`"),
    ("`© Conicorn 2026 | Built in `", f"`{PIE_COPYRIGHT}`"),
]

# Formulario del pie.
FORMULARIO = [
    ("Your Competitors Are Automating.", "Cuéntanos qué quieres mejorar."),
    ("Are you?", "Empezamos por ahí."),
    (
        "Stop wasting time on manual processes. Start building a self-running business.",
        "Revisaremos tu caso y te diremos qué tiene sentido automatizar, qué herramientas conectar o cómo mejorar tu web.",
    ),
    ("Your name*", "Tu nombre*"),
    ("Your company name*", "Empresa*"),
    ("Your business email*", "Email*"),
    ("Share project details*\\u2028\\u2028\\u2028", "¿Qué te gustaría mejorar?*"),
    ("Share project details*   ", "¿Qué te gustaría mejorar?*"),
    ("Send Your Request!", "Enviar solicitud"),
    ("Thank you", "¡Gracias! Te escribimos pronto"),
    ("Something went wrong", "No se ha podido enviar"),
]


# ---------------------------------------------------------------------------
# Proyectos (CMS). Sólo hechos documentados en los repositorios de cada web.
# ---------------------------------------------------------------------------

PROYECTOS = [
    {
        "slug": "margon",
        "titulo": "Margon: web corporativa para una empresa industrial",
        "descripcion": "Nueva web corporativa en cinco idiomas para una empresa metalúrgica de ciclo completo que trabaja para los sectores ferroviario, de defensa y de obra pública.",
        "logo": "banteq-margon-logo.png",
        "tarjeta": "banteq-margon-card.jpg",
        "cabecera": "banteq-margon-hero.jpg",
        "bloques_img": ["banteq-margon-1.jpg", "banteq-margon-2.jpg", "banteq-margon-3.jpg", "banteq-margon-4.jpg"],
        "ano": "2026",
        "cliente": "Margon",
        "sector": "Industria: ferroviario, defensa y obra pública",
        "servicios": "Diseño y desarrollo web, experiencia interactiva, multiidioma y newsletter",
        "reto": (
            "Margon es una empresa metalúrgica de ciclo completo: diseño, ingeniería, fabricación, montaje y postventa para fabricantes ferroviarios y grandes cuentas industriales. Necesitaba una web a la altura de ese nivel.",
            [
                ("Compradores técnicos:", " quien visita la web evalúa si Margon puede ser su proveedor, y tiene que encontrar sin rodeos capacidades, homologaciones y obra ejecutada."),
                ("Clientes en varios países:", " la web tenía que funcionar en varios idiomas, con la terminología técnica correcta en cada uno."),
                ("Tres sectores:", " ferroviario, defensa y obra pública, cada uno con su propio contenido."),
                ("Nada genérico:", " el objetivo era una experiencia moderna y tecnológica, lejos de la típica web industrial."),
            ],
        ),
        "solucion": "Diseñamos y desarrollamos la web desde cero, con una experiencia visual inmersiva y todo el contenido pensado para el comprador técnico.",
        "bloques": [
            ("1. Cinco idiomas", ["Español, català, English, Deutsch y français", "Cada página y cada noticia disponible en los cinco idiomas", "Normas y certificaciones con su nombre oficial en cada idioma"]),
            ("2. Una página por sector", ["Ferroviario, defensa y obra pública con páginas propias", "Obra ejecutada con los proyectos reales de la empresa", "Homologaciones, capacidad productiva y proceso integral"]),
            ("3. Experiencia interactiva", ["Entrada animada al interior de un tren desde la portada", "Recorrido por el salón de pasajeros: ocho conjuntos para ver de cerca", "Segunda animación para entrar en el módulo de aseo"]),
            ("4. Noticias y newsletter", ["Sección de noticias con una página para cada artículo", "Newsletter con confirmación de suscripción y página de baja", "Envío de correos gestionado con Resend"]),
        ],
        "resultado": "Una web corporativa preparada para acompañar procesos comerciales largos: clara para el comprador técnico, disponible en cinco idiomas y lista para crecer con nuevos contenidos.",
        # El ahorro es un dato de Pol (2026-10-09): tiempo que ya no se dedica a preparar y enviar el
        # boletín, ahora automatizado desde la web.
        "metricas": [("2", "Animaciones"), ("+2.500 €/año", "ahorrados en tiempo con el newsletter automatizado")],
        # Parte de la descripción que va en negrita en la tarjeta (los cinco idiomas ya no son una métrica).
        "destacado": "cinco idiomas",
        # Grabación real de la web que se reproduce sobre la imagen de la tarjeta (tools/demo_margon.*).
        "demo": "margon-demo.mp4",
    },
    {
        "slug": "rentup-capital",
        "titulo": "RentUp Capital: web y formularios automatizados",
        "descripcion": "Web para una firma de inversión inmobiliaria, con formularios conectados que guardan cada contacto y avisan al equipo automáticamente.",
        "logo": "banteq-rentup-logo.png",
        "tarjeta": "banteq-rentup-card.jpg",
        "cabecera": "banteq-rentup-hero.jpg",
        "bloques_img": ["banteq-rentup-1.jpg", "banteq-rentup-2.png", "banteq-rentup-3.jpg", "banteq-rentup-4.jpg"],
        "ano": "2026",
        "cliente": "RentUp Capital",
        "sector": "Inversión inmobiliaria",
        "servicios": "Diseño y desarrollo web, automatización de formularios e integración con Brevo y Resend",
        "reto": (
            "RentUp Capital ofrece inversión inmobiliaria con gestión integral: búsqueda, compra, reforma, alquiler y administración. Necesitaba una web que explicara bien cada línea de inversión y que no dejara escapar ningún contacto.",
            [
                ("Muchas líneas de servicio:", " inversión convencional, turística y por habitaciones, flipping, personal shopper, RentUp Income y club de inversión."),
                ("Captación de contactos:", " cada solicitud tenía que llegar al equipo y quedar registrada."),
                ("Comunicación con inversores:", " newsletter y un club de inversión con acceso por solicitud."),
            ],
        ),
        "solucion": "Diseñamos y desarrollamos la web completa y automatizamos todo lo que pasa después de enviar un formulario.",
        "bloques": [
            ("1. Una página para cada servicio", ["Once páginas: una para cada línea de inversión, el club y el equipo", "Estructura clara y SEO en cada página", "Diseño adaptado a móvil"]),
            ("2. Formularios automatizados", ["Solicitud de asesoramiento, club de inversión y newsletter", "Confirmación automática por email a cada persona", "Aviso interno al equipo con todos los datos"]),
            ("3. Contactos organizados", ["Cada contacto se guarda en su lista de Brevo", "Sin duplicados en la newsletter", "Alta manual protegida para el equipo"]),
            ("4. Seguridad y fiabilidad", ["Los envíos se hacen en el servidor, nunca desde el navegador", "Protección antispam y límite de peticiones", "Publicada en Vercel, con analítica"]),
        ],
        "resultado": "Una web en producción en rentupcapital.com que presenta todas las líneas de inversión y convierte cada formulario en un contacto registrado, confirmado y notificado al equipo.",
        "metricas": [("11", "Páginas"), ("3", "Formularios conectados"), ("2", "Herramientas integradas")],
    },
]

PAGINA_PROYECTO = [
    ("`AI Property Inquiry Chatbot for Real Estate Firms`", "`Proyecto`"),
    ("`Timeline`", "`Año`"),
    ("`Client`", "`Cliente`"),
    ("`Industry`", "`Sector`"),
    ("`Services`", "`Servicios`"),
    ("`Challenges`", "`Punto de partida`"),
    ("`Solutions`", "`Qué hicimos`"),
    ("`Results`", "`Resultado`"),
]

PAGINA_PROYECTOS = [
    ("`Case Studies`", "`Proyectos`"),
    (
        "`All graphical assets in this template are licensed for personal and commercial use. If you'd like to use a specific asset, please check the license below`",
        "`Empresas que ya confían en Banteq y el trabajo que hemos hecho con ellas.`",
    ),
]

TARJETA_PROYECTO = [
    ("`AI Workflow Automation for SaaS Company`", "`Proyecto`"),
    ("`We analyze your workflows, bottlenecks, and revenue opportunities.`", "`Descripción del proyecto.`"),
    ("`Demo Booking`", "`Dato`"),
    ("`Closing Rate`", "`Dato`"),
    ("`Engagement`", "`Dato`"),
]

PAGINA_404 = [
    ("Back to Home", "Volver al inicio"),
    ("This page could not be founded.", "Esta página no existe o se ha movido."),
]


# ---------------------------------------------------------------------------
# Páginas legales (misma estructura que la plantilla). Los datos identificativos del
# titular se incorporan con los datos facilitados por Pol.
# ---------------------------------------------------------------------------

LEGAL_ACTUALIZACION = "Última actualización: 1 de noviembre de 2026"
# El aviso legal cambió el 8 de noviembre de 2026 (condiciones de la Fórmula Banteq) y el 9 (garantía
# de 60 días); la privacidad, no.
AVISO_ACTUALIZACION = "Última actualización: 9 de noviembre de 2026"
LEGAL_TITULAR = "Titular: Pol Carabante Martin, profesional autónomo que opera bajo la marca Banteq. NIF: 54166747E. Domicilio profesional: C/Casal dels Mogoda, 08130 Santa Perpètua de Mogoda. Contacto: pol@banteq.org."
LEGAL_CONTACTO = LEGAL_TITULAR

AVISO_LEGAL = [
    "Aviso legal y condiciones de uso", AVISO_ACTUALIZACION,
    "Este aviso legal regula el acceso y el uso de la web de Banteq y la contratación de sus servicios de automatización, inteligencia artificial, formación y desarrollo web.",
    "Al navegar por esta web o contratar nuestros servicios, aceptas estas condiciones.",
    "Si no estás de acuerdo con alguna de ellas, te pedimos que no utilices la web.",
    "1. Sobre Banteq",
    "Banteq ayuda a las empresas a mejorar mediante la tecnología: analiza cómo trabajan y aplica automatización, inteligencia artificial y desarrollo web.",
    "Nuestros servicios pueden incluir:",
    "Automatización de procesos",
    "Implantación de herramientas de IA y Microsoft Copilot" if MOSTRAR_COPILOT_FUNDAE
    else "Implantación de herramientas de inteligencia artificial",
    "Formación en inteligencia artificial, bonificable mediante FUNDAE" if MOSTRAR_COPILOT_FUNDAE
    else "Formación del equipo en las herramientas implantadas",
    "Diseño, desarrollo y rediseño de páginas web",
    "Integraciones y soluciones digitales a medida",
    "El alcance de cada servicio se concreta en la propuesta o el contrato con cada cliente.",
    "2. Uso de la web",
    "Te comprometes a utilizar esta web de forma lícita.",
    "No está permitido:",
    "Utilizar la web de forma contraria a la ley",
    "Intentar acceder sin autorización a sistemas o redes",
    "Copiar, reproducir o distribuir sus contenidos sin permiso",
    "Interferir en la seguridad o el funcionamiento de la web",
    "Podemos restringir el acceso si detectamos un uso indebido.",
    "3. Servicios y proyectos",
    "Cuando contratas un servicio de Banteq:",
    "El alcance del trabajo se define en una propuesta o contrato independiente.",
    "Los plazos y entregables dependen de la complejidad del proyecto y de la colaboración del cliente.",
    "El cliente facilita los materiales, accesos e información necesarios para el proyecto.",
    "Si falta alguno de ellos, los plazos pueden verse afectados.",
    "4. Propiedad intelectual",
    "Salvo acuerdo en contrario:",
    "Pertenece al cliente",
    "Los datos que aporta",
    "Su marca y sus materiales",
    "Sus sistemas internos",
    "Pertenece a Banteq",
    "Metodologías propias",
    "Plantillas internas de automatización",
    "Componentes reutilizables",
    "Herramientas internas de desarrollo",
    "El cliente recibe los derechos de uso de los entregables creados para él, pero no puede revender ni redistribuir los sistemas propios de Banteq sin acuerdo expreso.",
    "7. Datos de contacto",
    LEGAL_CONTACTO,
]

PRIVACIDAD = [
    "Política de privacidad", LEGAL_ACTUALIZACION,
    "Esta política explica cómo Banteq recoge, utiliza y protege tus datos cuando visitas esta web o utilizas nuestros servicios.",
    "Al usar la web o nuestros servicios, aceptas el tratamiento descrito en esta política.",
    "1. Qué datos recogemos",
    "Podemos tratar los siguientes datos:",
    "Datos personales",
    "Nombre",
    "Correo electrónico",
    "Empresa",
    "Teléfono",
    "Lo que nos cuentes en los formularios de contacto y diagnóstico: procesos, herramientas, tiempos, categorías de datos y, si lo indicas, rangos de facturación y costes. No envíes datos personales de terceros ni credenciales.",
    "Datos de uso",
    "Dirección IP",
    "Navegador",
    "Tipo de dispositivo",
    "Páginas visitadas",
    "Tiempo en cada página",
    "Página de procedencia",
    "2. Para qué los usamos",
    "Utilizamos tus datos para:",
    "Responder a tus consultas y solicitudes",
    "Prestar los servicios contratados",
    "Mejorar la web y la experiencia de uso",
    "Informarte sobre nuestros servicios, si lo solicitas",
    "Gestionar proyectos y la relación con clientes. Las respuestas del cuestionario y los borradores de diagnóstico se guardan en el espacio de trabajo de Banteq en Notion. Se preparan propuestas internas de honorarios que Banteq revisa; no generan una contratación ni un cobro automático.",
    "Mantener la seguridad y evitar usos indebidos",
    "Solo recogemos los datos necesarios para estas finalidades.",
    "3. Inteligencia artificial y datos de clientes",
    "En los proyectos de automatización e IA, Banteq puede tratar datos que aporta el cliente para construir o hacer funcionar sus sistemas.",
    "Nos comprometemos a:",
    "Usar esos datos solo para el alcance acordado",
    "Protegerlos con medidas de seguridad adecuadas",
    "No usarlos para entrenar modelos de IA públicos sin permiso expreso",
    "El cliente es responsable de contar con la legitimación necesaria para los datos que aporta.",
    "4. Seguridad",
    "Aplicamos medidas razonables para proteger tus datos frente a:",
    "Accesos no autorizados",
    "Usos indebidos",
    "Divulgación",
    "Alteración",
    "Ningún sistema de transmisión o almacenamiento es completamente seguro, pero trabajamos para reducir los riesgos al mínimo.",
    "5. Contacto y derechos",
    "Puedes ejercer tus derechos de acceso, rectificación, supresión y oposición escribiéndonos. " + LEGAL_CONTACTO,
]


# Fórmula Banteq (pedida por Pol el 2026-11-01; condiciones del 2026-11-08). Al contratar con Banteq
# el mantenimiento de su web, la empresa recibe una remodelación gratuita de una web informativa
# sencilla (lo demás se presupuesta aparte) y una cuota de mantenimiento con descuento:
#   descuento = el menor de: 25 % de su cuota actual, 50 €/mes, o cuota actual − 35 € (nunca negativo).
# La cuota con Banteq nunca baja de 35 €/mes. Importes sin IVA. No hay permanencia ni penalizaciones
# definidas: no añadirlas. Mismas cifras en banteq.js (FX_*) y api/leads.js (FORMULA_*); build.py
# comprueba que coinciden. Las condiciones completas están en el aviso legal (CONDICIONES_FORMULA).
# Se abre con un botón en la sección «Desarrollo web» de la home (FORMULA_BOTON) y en /desarrollo-web
# (bloque "formula" de SERVICIOS). La ventana y su formulario los monta banteq.js; el envío va a
# /api/leads como «Fórmula Banteq».
FORMULA_DESCUENTO = 0.25
FORMULA_AHORRO_MAX = 50
FORMULA_CUOTA_MIN = 35


def formula_cuota(actual):
    """(cuota con Banteq, ahorro mensual) para una cuota actual en euros sin IVA."""
    ahorro = max(0.0, min(actual * FORMULA_DESCUENTO, FORMULA_AHORRO_MAX, actual - FORMULA_CUOTA_MIN))
    return max(actual - ahorro, FORMULA_CUOTA_MIN), ahorro


def _euros(n):
    return f"{n:.0f}" if n == int(n) else f"{n:.2f}".replace(".", ",")


# Ejemplos de las condiciones (los que dio Pol); se comprueban contra la fórmula.
FORMULA_EJEMPLOS = [(40, 35, 5), (60, 45, 15), (100, 75, 25), (150, 112.5, 37.5), (200, 150, 50), (300, 250, 50)]
for _actual, _nuevo, _ahorro in FORMULA_EJEMPLOS:
    assert formula_cuota(_actual) == (_nuevo, _ahorro), (_actual, formula_cuota(_actual))

# Botón de la home: sello, texto y final del texto (se oculta en pantallas de menos de 360 px,
# donde la frase entera ocuparía tres líneas).
FORMULA_BOTON = ("Fórmula Banteq", "Renueva tu web", " sin coste de desarrollo")

# Frase comercial (la fijó Pol) y nota breve; se usan en /desarrollo-web y en la ventana (banteq.js).
FORMULA_FRASE = (
    "Remodelamos tu web sin coste de desarrollo básico al contratar nuestro mantenimiento. "
    "Ahorra un 25 % de tu cuota actual, hasta 50 €/mes, con una cuota mínima de 35 €/mes."
)
FORMULA_NOTA = (
    "La remodelación gratuita incluye una web informativa básica con formulario de contacto; "
    "las funcionalidades adicionales se presupuestan aparte. Importes sin IVA."
)

# Aviso legal, apartado 5 (entre «4. Propiedad intelectual» y «6. Datos de contacto»).
# Bloques: ("p", texto) · ("ul", [texto, …]) · ("h", subtítulo) · ("tabla", cabeceras, filas).
CONDICIONES_FORMULA = ("5. Condiciones de la Fórmula Banteq", [
    ("p", "La Fórmula Banteq es una oferta para las empresas que contratan con Banteq el mantenimiento de su página web. "
          "Incluye una remodelación gratuita de la web y una reducción de la cuota de mantenimiento respecto a la que pagan actualmente."),
    ("h", "Remodelación gratuita de la web"),
    ("p", "La remodelación gratuita consiste en una web sencilla, de carácter informativo, que incluye:"),
    ("ul", [
        "Diseño moderno, profesional y adaptable a móviles",
        "Contenido básico de la empresa, sus servicios y datos de contacto",
        "Un formulario de contacto funcional",
        "Estructura y navegación básicas",
    ]),
    ("p", "No están incluidos gratuitamente los desarrollos avanzados, funcionalidades especiales, tiendas online, "
          "integraciones complejas, animaciones personalizadas, sistemas de reservas ni otras funcionalidades adicionales "
          "que excedan el alcance de una web informativa sencilla."),
    ("p", "Cualquier funcionalidad, personalización o desarrollo adicional se presupuesta y se contrata por separado, "
          "con la aceptación previa del cliente."),
    ("h", "Descuento en el mantenimiento"),
    ("p", "La cuota de mantenimiento con Banteq se calcula a partir de la cuota mensual que el cliente paga actualmente "
          "por el mantenimiento de su web:"),
    ("ul", [
        "Descuento del 25 % sobre la cuota mensual actual de mantenimiento.",
        "Ahorro máximo de 50 € al mes, equivalente a 600 € al año.",
        "Cuota mínima de mantenimiento con Banteq de 35 € al mes.",
    ]),
    ("p", "El descuento efectivo es el menor de estos tres importes: el 25 % de la cuota actual, 50 € al mes o la "
          "diferencia entre la cuota actual y 35 €. El precio resultante nunca es inferior a 35 € al mes y no se aplican "
          "descuentos negativos: si la cuota actual es de 35 € al mes o menos, no hay descuento."),
    ("p", "Todos los importes de la Fórmula Banteq, incluida la cuota actual del cliente que sirve de referencia, se "
          "expresan sin IVA. A las cuotas se les añade el IVA correspondiente."),
    ("p", "Ejemplos de cálculo (importes sin IVA):"),
    ("tabla", ("Mantenimiento actual", "Nuevo precio Banteq", "Ahorro mensual"),
     [(f"{_euros(a)} €/mes", f"{_euros(n)} €/mes", f"{_euros(h)} €") for a, n, h in FORMULA_EJEMPLOS]),
    ("h", "Condiciones de contratación"),
    ("ul", [
        "La cuota actual declarada por el cliente debe poder acreditarse mediante una factura o un documento equivalente.",
        "La propuesta está sujeta a la revisión del mantenimiento actual y de las necesidades técnicas de la web.",
        "La remodelación gratuita está condicionada a la contratación del mantenimiento con Banteq.",
        "Antes de comenzar el proyecto, se especifican por escrito las funcionalidades incluidas y las que tendrían un coste adicional.",
        "Banteq no realiza cargos adicionales sin la autorización previa del cliente.",
    ]),
])

# ---------------------------------------------------------------------------
# Garantía de satisfacción de 60 días (automatizaciones). Se muestra en la home (tarjeta bajo las
# demostraciones de «Automatización e IA», tools/demos.py), en /automatizacion-procesos (bloque
# "garantia" de SERVICIOS) y, con todas sus condiciones, en el apartado 6 del aviso legal
# (CONDICIONES_GARANTIA). Solo cubre el importe de implementación de las automatizaciones que el
# presupuesto marque como cubiertas: nunca desarrollo web, diagnósticos ni mantenimiento.
# ---------------------------------------------------------------------------
GARANTIA_DIAS = 60
GARANTIA_SELLO = "Garantía de satisfacción"
GARANTIA_TITULO = ("60 días", " de garantía. Si no ahorras tiempo, te devolvemos el coste de implementación.")
GARANTIA_TEXTO = (
    "Confiamos en el valor de nuestras automatizaciones. Si durante los primeros 60 días desde su puesta en "
    "funcionamiento no consigues ahorrar tiempo con la solución que hemos implantado, te devolvemos el importe "
    "de la implementación conforme a las condiciones de la garantía."
)
# Lo que no cubre, dicho en la propia tarjeta para no prometer más de la cuenta.
GARANTIA_ALCANCE = (
    "Cubre la implementación de las automatizaciones incluidas en la garantía. No incluye mantenimiento, "
    "herramientas externas ni costes de terceros."
)
GARANTIA_ENLACE = ("Condiciones de la garantía", "/aviso-legal#garantia")
# Referencia breve en /automatizacion-procesos.
GARANTIA_REF = (
    "Las automatizaciones que implantamos con garantía tienen 60 días para demostrar que te ahorran tiempo. "
    "Si no lo hacen, te devolvemos el coste de implementación."
)

CONDICIONES_GARANTIA = ("6. Garantía de satisfacción de 60 días", [
    ("p", "Las automatizaciones que Banteq implanta pueden incluir una garantía de satisfacción de 60 días. "
          "Este apartado explica qué cubre, cómo se comprueba el ahorro de tiempo y cómo se pide la devolución. "
          "La garantía se suma a los derechos que la ley reconoce al cliente; no los limita."),
    ("h", "Qué cubre"),
    ("ul", [
        "Solo el importe de implementación de las automatizaciones que el presupuesto o contrato aceptado identifique expresamente como cubiertas por la garantía.",
        "No incluye las cuotas de mantenimiento, las suscripciones o licencias de herramientas externas ni los costes de terceros, aunque los gestione Banteq.",
        "No se aplica a los servicios de desarrollo web, a los diagnósticos ni al mantenimiento, salvo que el presupuesto lo indique expresamente.",
    ]),
    ("h", "Duración"),
    ("p", "60 días naturales a partir de la puesta en funcionamiento y aceptación de la automatización. Esa fecha se "
          "deja por escrito, por ejemplo por correo electrónico, cuando la automatización empieza a funcionar en el "
          "trabajo real del cliente y este la acepta."),
    ("h", "Cómo se comprueba el ahorro de tiempo"),
    ("p", "Antes de comenzar el proyecto, Banteq y el cliente acuerdan por escrito, para cada automatización cubierta, "
          "el proceso al que se aplica, el tiempo que el equipo le dedica antes de automatizarlo y cómo se medirá "
          "después (por ejemplo, minutos por pedido, horas por semana o los registros de la propia herramienta)."),
    ("p", "Hay ahorro de tiempo verificable cuando, medido de esa forma, el tiempo dedicado al proceso durante la "
          "garantía es menor que el de antes de automatizarlo o, si se acordó un ahorro mínimo, cuando lo alcanza."),
    ("h", "Qué hace el cliente"),
    ("ul", [
        "Utilizar la automatización durante la garantía para la finalidad y en el proceso para los que se implantó.",
        "Facilitar la información acordada para comprobar los resultados, como registros de tiempo o datos de uso de la herramienta.",
    ]),
    ("h", "Cómo se pide la devolución"),
    ("ul", [
        "El cliente la solicita por escrito, en la dirección de contacto del apartado 7, dentro de los 60 días de garantía.",
        "Banteq revisa los resultados con el cliente aplicando la forma de medir acordada y responde por escrito en un plazo máximo de 15 días naturales.",
        "Si no hay ahorro de tiempo verificable, Banteq devuelve el importe de implementación cubierto en un plazo máximo de 30 días naturales desde esa respuesta, por el mismo medio con el que se pagó.",
        "Banteq solo puede denegar la devolución si la solicitud llega fuera de plazo, si la automatización no está cubierta por la garantía, si no se ha utilizado para su finalidad o si el cliente no ha facilitado la información acordada. La respuesta indicará el motivo.",
    ]),
])


# ---------------------------------------------------------------------------
# Zona y páginas de servicio (SEO). Solo lo que Banteq ofrece hoy y lo que ya está documentado en
# este archivo: sin Copilot ni FUNDAE, sin cifras ni testimonios.
# ---------------------------------------------------------------------------

# Texto de un bloque: una cadena, o una lista de trozos: "texto", ("b", "negrita") o
# ("a", "texto del enlace", destino). Destino: ruta de la web ("/proyectos/margon",
# "/#como-trabajamos"), ancla de la misma página ("#hablemos": el formulario del pie;
# "#formula-banteq": abre la Fórmula Banteq) o URL completa.
# ("formula", texto del botón): botón que abre la Fórmula Banteq (ver FORMULA, más abajo).
# ("garantia", None): distintivo de la garantía de 60 días (GARANTIA_REF, enlace a las condiciones).
# Bloques de una sección: ("p", texto) · ("ul", [texto, …]) · ("faq", [(pregunta, respuesta), …]).
_CIERRE = [
    ZONA_FRASE + " ",
    ("a", "Cuéntanos tu caso", "#hablemos"),
    " y te proponemos un primer paso razonable.",
]

# Cada página responde a una búsqueda distinta (para que no compitan entre sí):
#   /automatizacion-procesos  → qué procesos automatizar y cómo se hace (el problema del negocio)
#   /inteligencia-artificial  → cuándo aporta la IA y qué hace dentro de la empresa
#   /automatizacion-n8n       → la herramienta: n8n, Make, APIs e integración entre programas
#   /desarrollo-web           → diseño y desarrollo de webs a medida y rediseños
#   /mantenimiento-web        → mantenimiento y Fórmula Banteq (precio y condiciones)
# "principal": va en el menú (dos filas de la plantilla: no caben más). Todas van en el pie.
SERVICIOS = [
    {
        "slug": "automatizacion-procesos",
        "id": "bqSvAuto1",
        "menu": "Automatización",
        "principal": True,
        "nombre": "Automatización de procesos",
        "title": "Automatización de procesos para pymes en Barcelona | Banteq",
        "descripcion": (
            "Automatizamos facturas, correos, formularios y tareas repetitivas conectando las herramientas "
            "que ya usa tu empresa. Para pymes de Barcelona y de toda España."
        ),
        "h1": "Automatización de procesos para empresas y pymes",
        "subtitulo": "Tareas repetitivas que se resuelven solas, conectadas con las herramientas que ya usa tu equipo.",
        "intro": [
            "Facturas que se registran a mano, correos que hay que reenviar, datos que se copian de un Excel a otro, "
            "solicitudes que se quedan sin respuesta. Son tareas pequeñas que, sumadas, se llevan horas cada semana y "
            "acaban provocando errores.",
            "En Banteq analizamos cómo trabaja tu empresa, decidimos contigo qué merece la pena automatizar y lo "
            "construimos sobre tus herramientas, con revisión humana donde hace falta.",
        ],
        "secciones": [
            ("Qué procesos automatizamos", [
                ("ul", [
                    [("b", "Documentos y facturas. "), "Se reciben, se clasifican y se registran sin teclearlos de nuevo, con una persona que valida lo que lo necesita."],
                    [("b", "Correos y formularios. "), "Cada solicitud llega a quien debe, queda registrada y recibe respuesta."],
                    [("b", "Ventas y CRM. "), "Contactos clasificados, respuestas personalizadas, seguimiento automático y un CRM siempre al día."],
                    [("b", "Informes y datos. "), "Informes automáticos, métricas semanales y alertas para decidir con información al día."],
                    [("b", "Conexión entre herramientas. "), "Correo, Drive, Excel, CRM, ERP o WhatsApp conectados entre sí, para que la información pase de una a otra sin copiar y pegar."],
                ]),
            ]),
            ("Ejemplos de automatizaciones", [
                ("p", "Así queda una tarea cuando deja de hacerse a mano. Son ejemplos habituales; en tu empresa se adaptan a tus programas y a tu forma de trabajar."),
                ("ul", [
                    [("b", "Facturas de proveedores. "), "La factura llega por correo, se leen el proveedor, la fecha y los importes, se anota en tu hoja de cálculo o en tu programa de gestión y el PDF se archiva en su carpeta. Una persona revisa solo las que no cuadran."],
                    [("b", "Solicitudes de la web. "), "Cada formulario crea el contacto en tu CRM, envía una confirmación a quien escribe y avisa a la persona del equipo que debe responder."],
                    [("b", "Presupuestos y consultas. "), "Los correos entrantes se clasifican por tipo, se crea la ficha con los datos y se prepara un borrador de respuesta para revisar y enviar."],
                    [("b", "Informe semanal. "), "Los datos de ventas, pedidos o incidencias se recogen de cada herramienta y llegan resumidos al correo cada lunes."],
                    [("b", "Reservas y citas. "), "La cita queda en el calendario, el cliente recibe la confirmación y un recordatorio, y los cambios se actualizan solos."],
                ]),
            ]),
            ("Empezamos por un diagnóstico", [
                ("p", "Antes de automatizar nada, analizamos cómo trabaja tu empresa y dibujamos un mapa de sus procesos, herramientas y conexiones. Ese mapa muestra dónde se pierde tiempo y qué conviene automatizar primero."),
                ("p", "Preparamos dos diagnósticos separados: procesos y oportunidades de automatización. El primero organiza cómo trabajáis y ayuda a preparar el camino hacia ISO 9001. El segundo identifica tareas que podrían hacerse con menos tiempo y errores. Te contactaremos en menos de 72 horas naturales para comentar las conclusiones, los honorarios y las condiciones de entrega. Enviar el cuestionario no supone contratar ni pagar."),
                ("p", ["Después seguimos un proceso claro: diseño, desarrollo, pruebas y formación de tu equipo. Así es ", ("a", "cómo trabajamos", "/#como-trabajamos"), "."]),
            ]),
            ("Sobre las herramientas que ya usas", [
                ("p", ["No hace falta cambiar de programas. Trabajamos con Microsoft 365, Google Drive, WhatsApp, Notion, Airtable u Odoo, y las conectamos con n8n, Make o integraciones a medida cuando el proceso lo requiere. Lo explicamos en ", ("a", "automatización con n8n e integración de herramientas", "/automatizacion-n8n"), "."]),
                ("p", ["Cuando la tarea exige entender un texto, como leer un documento, clasificar un correo o redactar una respuesta, añadimos ", ("a", "inteligencia artificial", "/inteligencia-artificial"), " al proceso."]),
            ]),
            ("Con control y supervisión", [
                ("ul", [
                    "Revisión humana en los pasos sensibles",
                    "Registro de cada acción",
                    "Integraciones seguras y protección de datos",
                    "Pruebas con datos reales o de prueba antes de ponerlo en marcha",
                ]),
            ]),
            ("Garantía de 60 días", [
                ("garantia", None),
            ]),
            ("Un caso real: RentUp Capital", [
                ("p", "Para RentUp Capital, una firma de inversión inmobiliaria, automatizamos todo lo que ocurre después de enviar un formulario en su web: cada contacto se guarda en su lista, la persona recibe una confirmación por email y el equipo, un aviso con todos los datos."),
                ("p", [("a", "Ver el proyecto de RentUp Capital", "/proyectos/rentup-capital")]),
            ]),
            ("Preguntas frecuentes", [
                ("faq", [
                    ("¿Qué procesos se pueden automatizar?", "Los que se repiten y siguen reglas claras: registrar documentos y facturas, responder y clasificar correos, pasar datos entre programas, hacer seguimiento de contactos o preparar informes. En el diagnóstico vemos cuáles compensan en tu caso."),
                    ("¿Tenemos que cambiar de herramientas?", "No. Partimos de las que ya usa tu empresa y las conectamos entre sí. Solo proponemos una herramienta nueva cuando resuelve algo que las actuales no pueden."),
                    ("¿Qué pasa si una automatización se equivoca?", "Las diseñamos con validaciones, registro de acciones y revisión humana en los pasos sensibles, y las probamos antes de ponerlas en marcha. Las decisiones importantes siguen pasando por una persona."),
                    ("¿Necesitamos conocimientos técnicos?", "No. Nos encargamos del análisis, el desarrollo, las integraciones y las pruebas. Después formamos a tu equipo y dejamos documentación para que use el sistema con autonomía."),
                    ("¿Cuánto cuesta automatizar un proceso?", "Depende del proceso y de las herramientas que haya que conectar. Por eso empezamos por el diagnóstico: después recibes una propuesta con el alcance, las fases y el importe, y decides con esa información."),
                    ("¿Cuánto tiempo se ahorra?", "Depende de cuántas veces se repite la tarea y de cuánto tarda hoy. En las automatizaciones con garantía lo dejamos por escrito antes de empezar: cuánto tiempo dedica tu equipo al proceso y cómo se medirá después."),
                    ("¿Trabajáis con empresas de fuera de Barcelona?", "Sí. El análisis, el desarrollo y la formación pueden hacerse en remoto, así que trabajamos con empresas de toda España. Con las de Barcelona y el Vallès también podemos vernos en persona."),
                ]),
            ]),
            ("¿Hablamos de tus procesos?", [
                ("p", _CIERRE),
                ("p", ["También te puede interesar: ", ("a", "inteligencia artificial para empresas", "/inteligencia-artificial"), ", ", ("a", "automatización con n8n", "/automatizacion-n8n"), " y ", ("a", "desarrollo web a medida", "/desarrollo-web"), "."]),
            ]),
        ],
    },
    {
        "slug": "inteligencia-artificial",
        "id": "bqSvIntA1",
        "menu": "Inteligencia artificial",
        "nombre": "Inteligencia artificial para empresas",
        "title": "Inteligencia artificial para pymes en Barcelona | Banteq",
        "descripcion": (
            "Asistentes de IA que responden consultas, leen documentos, clasifican solicitudes y preparan "
            "borradores dentro de tus herramientas, con revisión humana."
        ),
        "h1": "Inteligencia artificial para empresas",
        "subtitulo": "Asistentes que atienden, clasifican y redactan dentro de tus herramientas, con tu equipo al mando.",
        "intro": [
            "La inteligencia artificial ya es útil en el día a día de una pyme: responde consultas, encuentra información "
            "en tus documentos, clasifica lo que entra y prepara borradores. Lo difícil no es usarla, sino aplicarla donde de verdad aporta.",
            "En Banteq la integramos en tus procesos y en las herramientas que ya utilizas, y dejamos claro qué hace la IA y qué sigue decidiendo una persona.",
        ],
        "secciones": [
            ("Qué hacemos con inteligencia artificial", [
                ("ul", [
                    [("b", "Atención al cliente. "), "Asistentes que responden las consultas habituales y pasan a tu equipo las que necesitan a una persona."],
                    [("b", "Consultas sobre tu documentación interna. "), "Tu equipo pregunta con sus palabras y el asistente responde a partir de los documentos de la empresa."],
                    [("b", "Lectura de documentos. "), "Facturas, pedidos o formularios de los que se extraen los datos para registrarlos sin teclearlos."],
                    [("b", "Clasificación de solicitudes. "), "Cada correo o formulario llega etiquetado y a quien corresponde."],
                    [("b", "Borradores de respuesta. "), "La IA prepara el texto; una persona lo revisa y lo envía."],
                ]),
            ]),
            ("Cuándo tiene sentido usar IA y cuándo no", [
                ("p", "La IA aporta cuando la tarea exige entender lenguaje: leer un texto que no viene siempre igual, decidir de qué trata un mensaje o redactar una respuesta. Si la tarea sigue reglas fijas, como pasar un dato de un programa a otro, suele bastar una automatización más sencilla, que es más barata y más predecible."),
                ("p", ["Por eso no empezamos por la tecnología. Primero miramos el proceso y después decidimos si necesita IA, una ", ("a", "automatización de procesos", "/automatizacion-procesos"), " sin IA o las dos cosas."]),
            ]),
            ("La IA propone, tu equipo decide", [
                ("p", "No dejamos procesos sensibles sin supervisión. Diseñamos cada solución con revisión humana, registro de acciones y validaciones: la IA prepara, clasifica y ejecuta tareas, y las decisiones importantes siguen pasando por una persona."),
            ]),
            ("Tus datos, bajo control", [
                ("ul", [
                    "Usamos los datos que aportas solo para el alcance acordado",
                    "Los protegemos con medidas de seguridad adecuadas",
                    "No los usamos para entrenar modelos de IA públicos sin tu permiso expreso",
                ]),
                ("p", ["Lo explicamos con detalle en nuestra ", ("a", "política de privacidad", "/privacidad"), "."]),
            ]),
            ("Integrada en lo que ya usas", [
                ("p", ["Trabajamos con modelos de OpenAI y los conectamos con tu correo, tus documentos, tu CRM o WhatsApp mediante ", ("a", "n8n, Make o integraciones a medida", "/automatizacion-n8n"), ". Después formamos a tu equipo y dejamos documentación para que use el sistema con autonomía."]),
            ]),
            ("Preguntas frecuentes", [
                ("faq", [
                    ("¿Qué diferencia hay entre automatización e inteligencia artificial?", "Una automatización sigue reglas fijas: si pasa esto, haz aquello. La inteligencia artificial interpreta textos, documentos o mensajes que no siguen un formato. Lo habitual es combinarlas: la IA entiende lo que entra y la automatización hace el resto."),
                    ("¿La IA sustituye a las personas del equipo?", "No. Se ocupa de tareas repetitivas, como clasificar, buscar información o redactar un primer borrador, para que tu equipo dedique su tiempo a lo que requiere criterio. Las decisiones importantes siguen pasando por una persona."),
                    ("¿Qué pasa con los datos de nuestra empresa?", "Se usan solo para el alcance acordado, se protegen con medidas de seguridad adecuadas y no se emplean para entrenar modelos de IA públicos sin tu permiso expreso."),
                    ("¿Sirve para un negocio pequeño?", "Sí, si hay una tarea concreta que se repite: responder siempre las mismas preguntas, leer documentos o clasificar correos. Lo importante no es el tamaño de la empresa, sino elegir bien el primer caso de uso."),
                    ("¿Por dónde empezamos?", "Por un diagnóstico de procesos: analizamos cómo trabaja tu empresa y elegimos contigo el primer caso de uso, el que más tiempo ahorra con menos riesgo."),
                ]),
            ]),
            ("¿Hablamos de tu caso?", [
                ("p", _CIERRE),
                ("p", ["También te puede interesar: ", ("a", "automatización de procesos", "/automatizacion-procesos"), " y ", ("a", "automatización con n8n", "/automatizacion-n8n"), "."]),
            ]),
        ],
    },
    {
        "slug": "automatizacion-n8n",
        "id": "bqSvN8nI1",
        "menu": "n8n e integraciones",
        "nombre": "Automatización con n8n e integración de herramientas",
        "title": "Automatización con n8n e integración de herramientas | Banteq",
        "descripcion": (
            "Conectamos tu correo, Excel, CRM, ERP, WhatsApp y tu web con n8n, Make o integraciones por API "
            "a medida. Los datos pasan de un programa a otro sin copiar y pegar."
        ),
        "h1": "Automatización con n8n e integración de herramientas",
        "subtitulo": "Tus programas, conectados entre sí: la información pasa de uno a otro sin copiar y pegar.",
        "intro": [
            "La mayoría de las empresas ya tiene buenas herramientas. El problema es que no se hablan: el pedido está en un programa, el cliente en otro y la factura en un tercero, y alguien dedica parte del día a pasar datos de un sitio a otro.",
            "En Banteq conectamos esas herramientas con n8n, con Make o con integraciones a medida mediante sus API, según lo que convenga a cada caso.",
        ],
        "secciones": [
            ("Qué es n8n y para qué lo usamos", [
                ("p", "n8n es una herramienta de automatización que conecta aplicaciones mediante flujos: cuando ocurre algo en un programa, se ejecutan una serie de pasos en otros. Puede usarse en la nube de n8n o instalarse en un servidor propio, y permite añadir lógica a medida e inteligencia artificial cuando el flujo lo necesita."),
                ("p", "La usamos para los procesos que cruzan varias herramientas: recoger un dato, transformarlo, comprobarlo y dejarlo donde debe estar, con avisos si algo falla."),
            ]),
            ("Qué herramientas conectamos", [
                ("ul", [
                    [("b", "Correo y documentos. "), "Microsoft 365 y Google Drive."],
                    [("b", "Datos y gestión. "), "Excel, Airtable, Notion y Odoo."],
                    [("b", "Clientes. "), "Tu CRM, WhatsApp y los formularios de tu web."],
                    [("b", "Inteligencia artificial. "), "Modelos de OpenAI para leer, clasificar o redactar dentro del flujo."],
                    [("b", "Programas sin conector. "), "Si la herramienta tiene API, la integramos a medida."],
                ]),
            ]),
            ("Ejemplos de flujos", [
                ("ul", [
                    [("b", "De Excel al CRM. "), "Cada fila nueva crea o actualiza el contacto, sin duplicados."],
                    [("b", "Del correo a la carpeta. "), "Los adjuntos de un tipo de correo se guardan con su nombre y en su sitio, y se anota quién los envió."],
                    [("b", "Del formulario al equipo. "), "La solicitud queda registrada, se confirma a quien escribe y se avisa a la persona responsable."],
                    [("b", "De varias herramientas a un informe. "), "Los datos se reúnen cada semana y llegan resumidos por correo."],
                ]),
                ("p", ["En ", ("a", "automatización de procesos", "/automatizacion-procesos"), " explicamos qué tareas conviene automatizar primero y cómo lo decidimos."]),
            ]),
            ("n8n, Make o una integración a medida", [
                ("p", "No hay una herramienta mejor para todo. Elegimos según el volumen de operaciones, lo sensibles que sean los datos, las herramientas que ya tienes y quién va a mantener el flujo después. Si ya trabajas con Make o con otra plataforma, partimos de ahí."),
            ]),
            ("Flujos que se pueden mantener", [
                ("ul", [
                    "Registro de cada ejecución y avisos cuando algo falla",
                    "Revisión humana en los pasos sensibles",
                    "Pruebas con datos reales o de prueba antes de ponerlo en marcha",
                    "Documentación y formación para que tu equipo entienda qué hace cada flujo",
                ]),
            ]),
            ("Preguntas frecuentes", [
                ("faq", [
                    ("¿Necesito tener n8n contratado?", "No. Si ya lo usas, trabajamos sobre tu instalación. Si no, te proponemos la opción que encaja con tu caso: la nube de n8n, un servidor propio u otra herramienta."),
                    ("¿n8n o Make?", "Depende del proceso. Valoramos el volumen, los datos que se manejan y quién lo mantendrá, y te explicamos por qué recomendamos una u otra."),
                    ("¿Podéis conectar un programa que no tiene integración?", "Si el programa ofrece una API, sí: desarrollamos la integración a medida. Si no la tiene, buscamos una alternativa, como trabajar con sus exportaciones."),
                    ("¿Qué pasa si un flujo falla?", "Cada flujo registra lo que hace y avisa cuando algo no sale como debe, para corregirlo cuanto antes. Los pasos sensibles llevan revisión humana."),
                    ("¿Los datos salen de nuestra empresa?", "Solo pasan por las herramientas que acordemos y se usan para el alcance pactado. Cuando conviene, n8n puede instalarse en un servidor propio."),
                ]),
            ]),
            ("¿Hablamos de tus herramientas?", [
                ("p", _CIERRE),
                ("p", ["También te puede interesar: ", ("a", "automatización de procesos", "/automatizacion-procesos"), " e ", ("a", "inteligencia artificial para empresas", "/inteligencia-artificial"), "."]),
            ]),
        ],
    },
    {
        "slug": "desarrollo-web",
        "id": "bqSvWebM1",
        "menu": "Desarrollo web",
        "principal": True,
        "nombre": "Desarrollo web a medida",
        "title": "Diseño y desarrollo web a medida en Barcelona | Banteq",
        "descripcion": (
            "Webs corporativas a medida, rediseños y webs conectadas con tu CRM y tus automatizaciones. "
            "Sin plantillas. Para empresas de Barcelona y de toda España."
        ),
        "h1": "Desarrollo web a medida",
        "subtitulo": "Webs corporativas diseñadas y desarrolladas desde cero, conectadas con tu negocio.",
        "intro": [
            "Tu web es, muchas veces, la primera reunión con un cliente. Tiene que explicar bien lo que haces, transmitir confianza y convertir visitas en contactos.",
            "Diseñamos y desarrollamos cada web a medida, sin plantillas, y la conectamos con tu correo, tu CRM o tus automatizaciones para que trabaje para tu negocio.",
        ],
        "secciones": [
            ("Qué tipo de webs hacemos", [
                ("ul", [
                    [("b", "Webs corporativas. "), "Modernas y cuidadas al detalle, pensadas para explicar bien lo que haces."],
                    [("b", "Rediseño de webs. "), "Nueva imagen, mejor estructura y una experiencia pensada primero para el móvil."],
                    [("b", "Experiencias interactivas. "), "Animaciones, 3D y recorridos que hacen que un producto se entienda de un vistazo."],
                    [("b", "Webs en varios idiomas. "), "Con la terminología correcta en cada uno."],
                    [("b", "Funcionalidades propias. "), "Newsletter, áreas específicas o lo que tu negocio necesite."],
                ]),
            ]),
            ("Fórmula Banteq: tu web, renovada al contratar el mantenimiento", [
                ("p", FORMULA_FRASE),
                ("p", [FORMULA_NOTA + " ", ("a", "Condiciones completas", "/aviso-legal"), "."]),
                ("p", ["Los ejemplos de cuota y lo que incluye están en ", ("a", "mantenimiento web para empresas", "/mantenimiento-web"), "."]),
                ("formula", "Descubre cómo funciona"),
            ]),
            ("Una web conectada, no un folleto", [
                ("ul", [
                    "Formularios que guardan cada solicitud en tu CRM",
                    "Confirmación automática a quien escribe",
                    "Aviso a tu equipo al momento",
                    "Integración con tu correo y con tus automatizaciones",
                ]),
                ("p", ["Es el mismo trabajo que hacemos en ", ("a", "automatización de procesos", "/automatizacion-procesos"), ", aplicado a tu web."]),
            ]),
            ("Rápida y bien construida", [
                ("p", "Diseño adaptado a móvil, tablet y escritorio, buen rendimiento y una base técnica preparada para crecer contigo. Cuidamos también la estructura y el SEO de cada página, para que tus clientes te encuentren."),
            ]),
            ("Proyectos reales", [
                ("p", [("b", "Margon. "), "Web corporativa en cinco idiomas para una empresa metalúrgica, con una página por sector, un recorrido interactivo por el interior de un tren y una sección de noticias con newsletter. ", ("a", "Ver el proyecto de Margon", "/proyectos/margon")]),
                ("p", [("b", "RentUp Capital. "), "Web de once páginas para una firma de inversión inmobiliaria, con formularios conectados que registran cada contacto y avisan al equipo. ", ("a", "Ver el proyecto de RentUp Capital", "/proyectos/rentup-capital")]),
            ]),
            ("Preguntas frecuentes", [
                ("faq", [
                    ("¿Trabajáis con plantillas?", "No. Cada web se diseña y se desarrolla para la empresa que la encarga: su contenido, su imagen y las funciones que necesita."),
                    ("¿Podéis rediseñar la web que ya tenemos?", "Sí. Renovamos webs que se han quedado atrás: nueva imagen, mejor estructura y una experiencia pensada primero para el móvil."),
                    ("¿La web puede conectarse con nuestro CRM o nuestro correo?", "Sí. Los formularios pueden guardar cada solicitud en tu CRM, enviar la confirmación a quien escribe y avisar a tu equipo al momento, sin trabajo manual."),
                    ("¿Hacéis webs en varios idiomas?", "Sí. La web que hemos desarrollado para Margon, por ejemplo, está disponible en cinco idiomas, con la terminología técnica correcta en cada uno."),
                ]),
            ]),
            ("¿Hablamos de tu web?", [
                ("p", _CIERRE),
                ("p", ["También te puede interesar: ", ("a", "mantenimiento web para empresas", "/mantenimiento-web"), " y ", ("a", "automatización de procesos", "/automatizacion-procesos"), "."]),
            ]),
        ],
    },
    {
        "slug": "mantenimiento-web",
        "id": "bqSvMant1",
        "menu": "Mantenimiento web",
        "nombre": "Mantenimiento web para empresas",
        "title": "Mantenimiento web para empresas | Fórmula Banteq",
        "descripcion": (
            "Pasa el mantenimiento de tu web a Banteq: la remodelamos sin coste de desarrollo básico y pagas "
            "un 25 % menos, hasta 50 €/mes. Cuota mínima: 35 €/mes."
        ),
        "h1": "Mantenimiento web para empresas",
        "subtitulo": "Con la Fórmula Banteq, tu web se renueva al contratar el mantenimiento y la cuota baja respecto a la que pagas hoy.",
        "intro": [
            "Muchas empresas pagan cada mes el mantenimiento de una web que lleva años sin cambiar. La cuota sigue; la web se queda atrás.",
            "La Fórmula Banteq junta las dos cosas: al contratar con nosotros el mantenimiento, rediseñamos tu web sin coste de desarrollo básico y la cuota se calcula a partir de la que pagas actualmente, con descuento.",
        ],
        "secciones": [
            ("Cómo funciona la Fórmula Banteq", [
                ("p", FORMULA_FRASE),
                ("ul", [
                    "Nos indicas cuánto pagas hoy por el mantenimiento de tu web",
                    "Revisamos tu web actual y sus necesidades técnicas",
                    "Recibes una propuesta con la cuota y, por escrito, lo que incluye la remodelación",
                    "Si la aceptas, remodelamos la web y pasamos a encargarnos del mantenimiento",
                ]),
                ("formula", "Calcular mi cuota"),
            ]),
            ("Cuánto pagarías", [
                ("p", "El descuento es el menor de estos tres importes: el 25 % de tu cuota actual, 50 € al mes o la diferencia entre tu cuota y 35 €. La cuota con Banteq nunca baja de 35 € al mes. Algunos ejemplos, sin IVA:"),
                ("ul", [f"Si pagas {_euros(a)} €/mes, pasarías a pagar {_euros(n)} €/mes: {_euros(h)} € menos cada mes." for a, n, h in FORMULA_EJEMPLOS]),
            ]),
            ("Qué incluye la remodelación gratuita", [
                ("p", "Una web sencilla, de carácter informativo, con:"),
                ("ul", list(CONDICIONES_FORMULA[1][3][1])),
                ("p", "Las tiendas online, los sistemas de reservas, las integraciones complejas, las animaciones personalizadas y otros desarrollos avanzados no forman parte de la remodelación gratuita: se presupuestan aparte y solo se hacen si los aceptas."),
            ]),
            ("Condiciones claras", [
                ("ul", [
                    "La cuota actual debe poder acreditarse con una factura o un documento equivalente",
                    "La remodelación gratuita está condicionada a contratar el mantenimiento con Banteq",
                    "Antes de empezar se especifica por escrito qué está incluido y qué tendría un coste adicional",
                    "No se realizan cargos adicionales sin tu autorización previa",
                ]),
                ("p", ["Las condiciones completas están en el ", ("a", "aviso legal", "/aviso-legal"), "."]),
            ]),
            ("Webs que hemos hecho", [
                ("p", ["Si quieres ver cómo trabajamos, estos son dos proyectos reales: ", ("a", "la web de Margon", "/proyectos/margon"), ", en cinco idiomas, y ", ("a", "la web de RentUp Capital", "/proyectos/rentup-capital"), ", con formularios automatizados. Y si necesitas algo más que una web informativa, mira ", ("a", "desarrollo web a medida", "/desarrollo-web"), "."]),
            ]),
            ("Preguntas frecuentes", [
                ("faq", [
                    ("¿Cuánto cuesta el mantenimiento web con Banteq?", "Se calcula a partir de lo que pagas hoy: un 25 % menos, con un ahorro máximo de 50 € al mes y una cuota mínima de 35 € al mes. Los importes son sin IVA."),
                    ("¿Y si ya pago 35 € al mes o menos?", "En ese caso no hay descuento: la cuota mínima con Banteq es de 35 € al mes."),
                    ("¿El rediseño de la web es gratis de verdad?", "Sí, para una web informativa sencilla con diseño adaptado a móviles, el contenido básico de la empresa y un formulario de contacto. Lo que exceda de eso se presupuesta aparte y solo se hace con tu aceptación."),
                    ("¿Qué necesito para pedir la propuesta?", "Saber cuánto pagas ahora por el mantenimiento y poder acreditarlo con una factura. Con eso y una revisión de tu web actual preparamos la propuesta."),
                    ("¿Qué incluye el mantenimiento?", "El alcance se concreta en la propuesta, después de revisar tu web actual y sus necesidades técnicas, y queda por escrito antes de empezar."),
                ]),
            ]),
            ("¿Hablamos de tu web?", [
                ("p", _CIERRE),
            ]),
        ],
    },
]

# Servicios de cada proyecto (enlaces desde su página) y web pública del cliente (en la línea
# «Relacionado» del final de la ficha).
PROYECTO_SERVICIOS = {
    "margon": ["desarrollo-web", "automatizacion-procesos"],
    "rentup-capital": ["desarrollo-web", "automatizacion-procesos"],
}
PROYECTO_WEB = {"rentup-capital": ("rentupcapital.com", "https://www.rentupcapital.com/")}

# Enlace visible a la web real de cada proyecto: bajo el subtítulo de su ficha y junto a «Ver
# proyecto» en su tarjeta. Se abre en pestaña nueva. La web nueva de Margon aún no está en margon.es:
# se enlaza su versión publicada en Vercel (pedido por Pol el 2026-10-16).
WEB_PROYECTO = {
    "rentup-capital": ("Visitar rentupcapital.com", "https://rentupcapital.com"),
    "margon": ("Visitar margon-web.vercel.app", "https://margon-web.vercel.app/"),
}


# «Quiénes somos»: cuadrado central por encima del carrusel de palabras (PROCESOS AUTOMATIZADOS…).
# Hoy muestra el logotipo de Banteq. Para poner un vídeo: copia el .mp4 (y, si quieres, un póster
# .jpg) a assets-banteq/web/ y escribe aquí sus nombres; el logo queda debajo como respaldo mientras
# el vídeo carga. Después, python3 tools/build.py.
CUADRO_CENTRAL = {
    "logo": "cuadro-logo.png",  # assets-banteq/generado (python3 tools/assets.py cuadro)
    "video": None,              # p. ej. "cuadro.mp4" (en assets-banteq/web)
    "poster": None,             # p. ej. "cuadro.jpg" (en assets-banteq/web)
}
