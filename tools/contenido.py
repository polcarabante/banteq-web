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
ZONA_FRASE = "Estamos en Santa Perpètua de Mogoda y trabajamos con empresas de Barcelona, el Vallès y alrededores."

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
    ("Book a free 30-minute AI strategy session.<br class=\"framer-text\">", "Analizamos cómo trabaja tu empresa y creamos un mapa conceptual de sus procesos, herramientas y conexiones.<br class=\"framer-text\">"),
    ("`Book a free 30-minute AI strategy session.`,g(`br`,{})", "`Analizamos cómo trabaja tu empresa y creamos un mapa conceptual de sus procesos, herramientas y conexiones.`,g(`br`,{})"),
    (
        "We’ll analyze your current workflows and identify the highest-ROI automation opportunities for your business.",
        (
            "Al finalizar el diagnóstico, recibirás un mapa completo y documentado de los procesos de tu empresa, "
            "estructurado para facilitar la implantación de un Sistema de Gestión de Calidad conforme a ISO 9001 y "
            "servir como base para un futuro proceso de certificación."
        ),
    ),
    ("Schedule a Session", "Solicitar diagnóstico"),
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
    ("Get this Template", "Solicitar diagnóstico"),
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
            ("3. Experiencia interactiva", ["Recorrido interactivo por el interior de un tren", "Escena 3D y animaciones de producto", "Configurador del módulo de aseo"]),
            ("4. Noticias y newsletter", ["Sección de noticias con una página para cada artículo", "Newsletter con confirmación de suscripción y página de baja", "Envío de correos gestionado con Resend"]),
        ],
        "resultado": "Una web corporativa preparada para acompañar procesos comerciales largos: clara para el comprador técnico, disponible en cinco idiomas y lista para crecer con nuevos contenidos.",
        "metricas": [("5", "Idiomas"), ("3", "Sectores"), ("3D", "Experiencia interactiva")],
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

PAGINA_CONTACTO = [
    ("Let’s Automate Your Growth", "Hablemos de tu empresa"),
    (
        "Looking to streamline operations, reduce costs, or scale your business with AI?",
        "¿Quieres automatizar procesos, implantar IA o Microsoft Copilot, o renovar tu web?"
        if MOSTRAR_COPILOT_FUNDAE
        else "¿Quieres automatizar procesos, implantar IA o renovar tu web?",
    ),
    ("We’re here to turn your vision into reality.", "Cuéntanos tu caso y te proponemos un primer paso razonable."),
    ("`Address`", "`Zona`"),
    ("Suite 502, Orion Tower", "Santa Perpètua de Mogoda, Barcelona"),
    ("`Office hours`", "`Primer paso`"),
    ("Monday to Friday, 9:00am - 6:00pm", "Diagnóstico de procesos"),
    ("`Email`", "`Respuesta`"),
    ("hello@conicorn.com", "Por email o WhatsApp, como prefieras"),
]

PAGINA_404 = [
    ("Back to Home", "Volver al inicio"),
    ("This page could not be founded.", "Esta página no existe o se ha movido."),
]


# ---------------------------------------------------------------------------
# Páginas legales (misma estructura que la plantilla). Los datos identificativos del
# titular (razón social, NIF, domicilio y email) no constan en los archivos: pendientes.
# ---------------------------------------------------------------------------

LEGAL_ACTUALIZACION = "Última actualización: septiembre de 2026"
LEGAL_PENDIENTE = "Datos del titular pendientes de completar: razón social, NIF, domicilio y email de contacto."

AVISO_LEGAL = [
    "Aviso legal y condiciones de uso", LEGAL_ACTUALIZACION,
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
    "5. Datos de contacto",
    LEGAL_PENDIENTE,
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
    "Lo que nos cuentes en los formularios de contacto",
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
    "Gestionar proyectos y la relación con clientes",
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
    "Puedes ejercer tus derechos de acceso, rectificación, supresión y oposición escribiéndonos. " + LEGAL_PENDIENTE,
]


# ---------------------------------------------------------------------------
# Zona y páginas de servicio (SEO). Solo lo que Banteq ofrece hoy y lo que ya está documentado en
# este archivo: sin Copilot ni FUNDAE, sin cifras ni testimonios.
# ---------------------------------------------------------------------------

# Texto de un bloque: una cadena, o una lista de trozos: "texto", ("b", "negrita") o
# ("a", "texto del enlace", destino). Destino: ruta de la web ("/contacto", "/proyectos/margon",
# "/#como-trabajamos") o URL completa.
# Bloques de una sección: ("p", texto) · ("ul", [texto, …]) · ("faq", [(pregunta, respuesta), …]).
_CIERRE = [
    ZONA_FRASE + " ",
    ("a", "Cuéntanos tu caso", "/contacto"),
    " y te proponemos un primer paso razonable.",
]

SERVICIOS = [
    {
        "slug": "automatizacion-procesos",
        "id": "bqSvAuto1",
        "menu": "Automatización",
        "nombre": "Automatización de procesos",
        "title": "Automatización de procesos para empresas en Barcelona | Banteq",
        "descripcion": (
            "Automatizamos facturas, documentos, correos, formularios y seguimiento comercial conectando "
            "las herramientas que ya usa tu empresa. En Barcelona y alrededores."
        ),
        "h1": "Automatización de procesos para empresas",
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
            ("Empezamos por un diagnóstico", [
                ("p", "Antes de automatizar nada, analizamos cómo trabaja tu empresa y dibujamos un mapa de sus procesos, herramientas y conexiones. Ese mapa muestra dónde se pierde tiempo y qué conviene automatizar primero."),
                ("p", "Al finalizar el diagnóstico, recibirás un mapa completo y documentado de los procesos de tu empresa, estructurado para facilitar la implantación de un Sistema de Gestión de Calidad conforme a ISO 9001 y servir como base para un futuro proceso de certificación."),
                ("p", ["Después seguimos un proceso claro: diseño, desarrollo, pruebas y formación de tu equipo. Así es ", ("a", "cómo trabajamos", "/#como-trabajamos"), "."]),
            ]),
            ("Sobre las herramientas que ya usas", [
                ("p", "No hace falta cambiar de programas. Trabajamos con Microsoft 365, Google Drive, WhatsApp, Notion, Airtable u Odoo, y las conectamos con n8n, Make o integraciones a medida cuando el proceso lo requiere."),
            ]),
            ("Con control y supervisión", [
                ("ul", [
                    "Revisión humana en los pasos sensibles",
                    "Registro de cada acción",
                    "Integraciones seguras y protección de datos",
                    "Pruebas con datos reales o de prueba antes de ponerlo en marcha",
                ]),
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
                ]),
            ]),
            ("¿Hablamos de tus procesos?", [
                ("p", _CIERRE),
                ("p", ["También te puede interesar: ", ("a", "inteligencia artificial para empresas", "/inteligencia-artificial"), " y ", ("a", "desarrollo web a medida", "/desarrollo-web"), "."]),
            ]),
        ],
    },
    {
        "slug": "inteligencia-artificial",
        "id": "bqSvIntA1",
        "menu": "IA aplicada",
        "nombre": "Inteligencia artificial para empresas",
        "title": "Inteligencia artificial para empresas en Barcelona | Banteq",
        "descripcion": (
            "Asistentes de IA para atención al cliente, documentación interna y clasificación de contactos, "
            "integrados en tus herramientas. En Barcelona y alrededores."
        ),
        "h1": "Inteligencia artificial para empresas",
        "subtitulo": "Asistentes que atienden, clasifican y redactan dentro de tus herramientas, con tu equipo al mando.",
        "intro": [
            "La inteligencia artificial ya es útil en el día a día de una empresa: responde consultas, encuentra información "
            "en tus documentos, clasifica lo que entra y prepara borradores. Lo difícil no es usarla, sino aplicarla donde de verdad aporta.",
            "En Banteq la integramos en tus procesos y en las herramientas que ya utilizas, y dejamos claro qué hace la IA y qué sigue decidiendo una persona.",
        ],
        "secciones": [
            ("Qué hacemos con inteligencia artificial", [
                ("ul", [
                    [("b", "Atención al cliente. "), "Asistentes que responden las consultas habituales y pasan a tu equipo las que necesitan a una persona."],
                    [("b", "Consultas sobre tu documentación interna. "), "Tu equipo pregunta con sus palabras y el asistente responde a partir de los documentos de la empresa."],
                    [("b", "Clasificación de contactos. "), "Cada solicitud llega etiquetada y a quien corresponde."],
                    [("b", "Borradores de respuesta. "), "La IA prepara el texto; una persona lo revisa y lo envía."],
                    [("b", "IA en tu web y en tus automatizaciones. "), "La añadimos a formularios, flujos y procesos donde aporta valor de verdad."],
                ]),
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
                ("p", "Trabajamos con modelos de OpenAI y los conectamos con tu correo, tus documentos, tu CRM o WhatsApp mediante n8n, Make o integraciones a medida. Después formamos a tu equipo y dejamos documentación para que use el sistema con autonomía."),
            ]),
            ("Empieza por un caso concreto", [
                ("p", ["La mejor forma de empezar es elegir una tarea y resolverla bien. En el diagnóstico de procesos vemos dónde la IA ahorra tiempo de verdad y dónde basta con una ", ("a", "automatización de procesos", "/automatizacion-procesos"), " más sencilla."]),
            ]),
            ("Preguntas frecuentes", [
                ("faq", [
                    ("¿La IA sustituye a las personas del equipo?", "No. Se ocupa de tareas repetitivas, como clasificar, buscar información o redactar un primer borrador, para que tu equipo dedique su tiempo a lo que requiere criterio. Las decisiones importantes siguen pasando por una persona."),
                    ("¿Qué pasa con los datos de nuestra empresa?", "Se usan solo para el alcance acordado, se protegen con medidas de seguridad adecuadas y no se emplean para entrenar modelos de IA públicos sin tu permiso expreso."),
                    ("¿Necesitamos conocimientos técnicos?", "No. Nos encargamos del análisis, el desarrollo, las integraciones y las pruebas. Después formamos a tu equipo y dejamos documentación."),
                    ("¿Por dónde empezamos?", "Por un diagnóstico de procesos: analizamos cómo trabaja tu empresa y elegimos contigo el primer caso de uso, el que más tiempo ahorra con menos riesgo."),
                ]),
            ]),
            ("¿Hablamos de tu caso?", [
                ("p", _CIERRE),
                ("p", ["También te puede interesar: ", ("a", "automatización de procesos", "/automatizacion-procesos"), " y ", ("a", "desarrollo web a medida", "/desarrollo-web"), "."]),
            ]),
        ],
    },
    {
        "slug": "desarrollo-web",
        "id": "bqSvWebM1",
        "menu": "Desarrollo web",
        "nombre": "Desarrollo web a medida",
        "title": "Desarrollo web a medida en Barcelona | Banteq",
        "descripcion": (
            "Diseñamos y desarrollamos webs corporativas a medida, rediseños y webs conectadas con tu CRM y "
            "tus automatizaciones. Sin plantillas. En Barcelona y alrededores."
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
                ("p", [("b", "Margon. "), "Web corporativa en cinco idiomas para una empresa metalúrgica, con una página por sector, un recorrido interactivo en 3D y una sección de noticias con newsletter. ", ("a", "Ver el proyecto de Margon", "/proyectos/margon")]),
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
                ("p", ["También te puede interesar: ", ("a", "automatización de procesos", "/automatizacion-procesos"), " e ", ("a", "inteligencia artificial para empresas", "/inteligencia-artificial"), "."]),
            ]),
        ],
    },
]

# Servicios de cada proyecto (enlaces desde su página) y web pública del cliente. La web nueva de
# Margon aún no está publicada (margon.es sigue siendo la anterior): sin enlace hasta entonces.
PROYECTO_SERVICIOS = {
    "margon": ["desarrollo-web"],
    "rentup-capital": ["desarrollo-web", "automatizacion-procesos"],
}
PROYECTO_WEB = {"rentup-capital": ("rentupcapital.com", "https://www.rentupcapital.com/")}


# «Quiénes somos»: cuadrado central por encima del carrusel de palabras (PROCESOS AUTOMATIZADOS…).
# Hoy muestra el logotipo de Banteq. Para poner un vídeo: copia el .mp4 (y, si quieres, un póster
# .jpg) a assets-banteq/web/ y escribe aquí sus nombres; el logo queda debajo como respaldo mientras
# el vídeo carga. Después, python3 tools/build.py.
CUADRO_CENTRAL = {
    "logo": "cuadro-logo.png",  # assets-banteq/generado (python3 tools/assets.py cuadro)
    "video": None,              # p. ej. "cuadro.mp4" (en assets-banteq/web)
    "poster": None,             # p. ej. "cuadro.jpg" (en assets-banteq/web)
}
