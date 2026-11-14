"""Versión en inglés de la web (/en/…). Misma estructura que contenido_ca.py.

SERVICIOS_EN: las cinco páginas de servicio (contenido propio, con HTML inicial y datos
estructurados). TEXTOS_EN: castellano → inglés de todo lo demás (menú, pie, formularios, home,
proyectos, avisos legales, demostraciones…); lo traduce banteq-i18n.js (ver tools/idiomas.py).
Inglés británico, tono directo y sin promesas que la web en castellano no haga.
"""
import contenido as C
import contenido_ca as CA

ALTERNA_EN = ("This page is also available in ", {"es": "Spanish", "ca": "Catalan"}, " and ", ".")
INICIO = "Home"
AUDIENCIA = "SMEs and small businesses"

ZONA_FRASE = ("We are based in Santa Perpètua de Mogoda (Barcelona) and work with businesses in Barcelona, the Vallès and, "
              "remotely, the rest of Spain.")
_TANCAMENT = [ZONA_FRASE + " ", ("a", "Tell us about your case", "#hablemos"), " and we'll suggest a sensible first step."]

FORMULA_FRASE = ("We remodel your website at no basic development cost when you hire our maintenance. "
                 "Save 25% on your current fee, up to €50/month, with a minimum fee of €35/month.")
FORMULA_NOTA = ("The free remodel includes a basic informational website with a contact form; "
                "additional features are quoted separately. Amounts exclude VAT.")

GARANTIA = {
    "ref": ("Automations we implement with a guarantee have 60 days to prove they save you time. "
            "If they don't, we refund the implementation fee."),
    "alcance": ("It covers the implementation of the automations included in the guarantee. It does not include maintenance, "
                "external tools or third-party costs."),
    "enlace": ("Guarantee terms", "/aviso-legal#garantia"),
}

# ---------------------------------------------------------------------------
# Interfaz (menú, pie, formulario de contacto y ventana de la Fórmula Banteq): castellano → inglés.
# ---------------------------------------------------------------------------
INTERFAZ_EN = {
    "Hablemos": "Let's talk",
    "Inicio": "Home",
    "Proyectos": "Projects",
    "Automatización": "Automation",
    "Inteligencia artificial": "Artificial intelligence",
    "n8n e integraciones": "n8n and integrations",
    "Desarrollo web": "Web development",
    "Mantenimiento web": "Web maintenance",
    "Aviso legal": "Legal notice",
    "Privacidad": "Privacy",
    "Cuéntanos qué quieres mejorar.": "Tell us what you want to improve.",
    "Empezamos por ahí.": "We'll start there.",
    "Revisaremos tu caso y te diremos qué tiene sentido automatizar, qué herramientas conectar o cómo mejorar tu web.":
        "We'll review your case and tell you what makes sense to automate, which tools to connect or how to improve your website.",
    "Tu nombre*": "Your name*",
    "¿Qué te gustaría mejorar?*": "What would you like to improve?*",
    "¿Cómo prefieres que te contactemos?": "How would you prefer us to contact you?",
    "Recomendado": "Recommended",
    "Correo electrónico": "Email",
    "Recomendamos WhatsApp para una comunicación más rápida y directa.": "We recommend WhatsApp for faster, more direct communication.",
    "Prefijo del país": "Country code",
    "Enviar solicitud": "Send request",
    "¡Gracias! Te escribimos pronto": "Thank you! We'll write to you soon",
    "No se ha podido enviar": "It could not be sent",
    "Escribe tu nombre.": "Enter your name.",
    "Escribe el nombre de tu empresa.": "Enter your company name.",
    "Cuéntanos qué te gustaría mejorar.": "Tell us what you'd like to improve.",
    "Escribe tu número de WhatsApp.": "Enter your WhatsApp number.",
    "Revisa el número: en España son 9 cifras (por ejemplo, 612 345 678).": "Check the number: in Spain it has 9 digits (for example, 612 345 678).",
    "Revisa el número de teléfono (sin el prefijo del país).": "Check the phone number (without the country code).",
    "Introduce un número de teléfono válido.": "Enter a valid phone number.",
    "Escribe tu correo electrónico.": "Enter your email address.",
    "Revisa el correo: parece incompleto (por ejemplo, nombre@empresa.com).": "Check the email: it looks incomplete (for example, name@company.com).",
    "Revisa los campos marcados.": "Check the highlighted fields.",
    "Revisa el campo marcado.": "Check the highlighted field.",
    "Enviando tu solicitud…": "Sending your request…",
    "No hemos podido confirmar el envío. Inténtalo de nuevo.": "We couldn't confirm that it was sent. Please try again.",
    "Ya hemos recibido esta solicitud. Te escribiremos pronto.": "We've already received this request. We'll write to you soon.",
    "No hemos podido enviar tu solicitud. Inténtalo de nuevo en unos minutos.": "We couldn't send your request. Please try again in a few minutes.",
    "No hemos podido enviar tu solicitud. Revisa tu conexión e inténtalo de nuevo.": "We couldn't send your request. Check your connection and try again.",
    "Envío no confirmado": "Sending not confirmed",
    "Tu web, renovada.": "Your website, renewed.",
    "Tú solo contratas su mantenimiento.": "You just hire its maintenance.",
    C.FORMULA_FRASE: FORMULA_FRASE,
    "de desarrollo en tu web informativa": "of development on your informational website",
    "menos que tu cuota actual": "less than your current fee",
    "hasta": "up to",
    "de ahorro al mes": "saved per month",
    "Pedir mi propuesta": "Request my proposal",
    "Nos dices cuánto pagas hoy": "You tell us what you pay today",
    "por el mantenimiento de tu web.": "to maintain your website.",
    "En menos de 48 h": "Within 48 hours",
    "te enviamos la propuesta de tu web remodelada y la oferta de mantenimiento.": "we send you the proposal for your remodelled website and the maintenance offer.",
    "Si te convence,": "If you like it,",
    "dejamos por escrito qué incluye y renovamos tu web.": "we put in writing what it includes and renew your website.",
    C.FORMULA_NOTA: FORMULA_NOTA,
    "Condiciones completas": "Full terms",
    "Pide tu propuesta": "Request your proposal",
    "Cuatro datos y te respondemos en menos de 48 h.": "Four details and we'll reply within 48 hours.",
    "Tu web actual": "Your current website",
    "¿Cuánto pagas al mes por el mantenimiento de tu web? (sin IVA)": "How much do you pay per month to maintain your website? (excluding VAT)",
    "¿Por dónde te enviamos la propuesta?": "Where should we send the proposal?",
    "Quiero mi propuesta": "I want my proposal",
    "Usaremos estos datos solo para preparar y enviarte la propuesta.": "We'll use this data only to prepare and send you the proposal.",
    "Política de privacidad": "Privacy policy",
    "Solicitud recibida": "Request received",
    "Cerrar": "Close",
    "Nombre de tu empresa": "Your company name",
    "tuempresa.com": "yourcompany.com",
    "Por ejemplo, 120": "For example, 120",
    "Tu correo electrónico": "Your email address",
    "Escribe la dirección de tu web actual.": "Enter the address of your current website.",
    "Revisa la dirección: por ejemplo, tuempresa.com.": "Check the address: for example, yourcompany.com.",
    "Indica cuánto pagas al mes, aunque sea aproximado.": "Say how much you pay per month, even if approximate.",
    "Escribe el importe en euros, por ejemplo 120.": "Enter the amount in euros, for example 120.",
}

REGLAS_EN = [
    (r"^Te escribiremos por WhatsApp al (.+)\.$", "We'll write to you on WhatsApp at $1."),
    (r"^Te responderemos a (.+) y te hemos enviado una confirmación\.$", "We'll reply to $1 and have sent you a confirmation."),
    (r"^Te responderemos a (.+)\.$", "We'll reply to $1."),
    (r"^Con (.+) €/mes, tu cuota con Banteq sería de$", "With €$1/month, your fee with Banteq would be"),
    (r"^: (.+) € menos al mes\. Te la confirmamos al revisar tu mantenimiento actual\.$",
     ": €$1 less per month. We'll confirm it once we review your current maintenance."),
    (r"^La cuota mínima de mantenimiento con Banteq es de (.+) €/mes, así que con (.+) €/mes no habría descuento\.$",
     "The minimum maintenance fee with Banteq is €$1/month, so at €$2/month there would be no discount."),
    (r"^Te responderemos en menos de 48 h por WhatsApp al (.+) con la propuesta de tu web remodelada y la oferta de mantenimiento\. Te hemos enviado una confirmación a tu correo\.$",
     "We'll reply within 48 hours on WhatsApp at $1 with the proposal for your remodelled website and the maintenance offer. We've sent a confirmation to your email."),
    (r"^Te responderemos en menos de 48 h por WhatsApp al (.+) con la propuesta de tu web remodelada y la oferta de mantenimiento\.$",
     "We'll reply within 48 hours on WhatsApp at $1 with the proposal for your remodelled website and the maintenance offer."),
    (r"^Te responderemos en menos de 48 h a (.+) con la propuesta de tu web remodelada y la oferta de mantenimiento\. Te hemos enviado una confirmación a tu correo\.$",
     "We'll reply within 48 hours to $1 with the proposal for your remodelled website and the maintenance offer. We've sent a confirmation to your email."),
    (r"^Te responderemos en menos de 48 h a (.+) con la propuesta de tu web remodelada y la oferta de mantenimiento\.$",
     "We'll reply within 48 hours to $1 with the proposal for your remodelled website and the maintenance offer."),
]


SERVICIOS_EN = [
    {
        "slug": "en/process-automation",
        "es": "automatizacion-procesos",
        "id": "bqEnAuto1",
        "nombre": "Process automation",
        "title": "Process automation for SMEs in Barcelona | Banteq",
        "descripcion": (
            "We automate invoices, emails, forms and repetitive tasks by connecting the tools your business already "
            "uses. For SMEs in Barcelona and across Spain."
        ),
        "h1": "Process automation for businesses and SMEs",
        "subtitulo": "Repetitive tasks that take care of themselves, connected with the tools your team already uses.",
        "intro": [
            "Invoices entered by hand, emails that have to be forwarded, data copied from one spreadsheet to another, "
            "requests left unanswered. These are small tasks that add up to hours every week and end up causing mistakes.",
            "At Banteq we analyse how your business works, decide with you what is worth automating and build it on top of "
            "your own tools, with human review where it is needed.",
        ],
        "secciones": [
            ("Which processes we automate", [
                ("ul", [
                    [("b", "Documents and invoices. "), "They arrive, are sorted and are recorded without being retyped, with a person validating whatever needs it."],
                    [("b", "Emails and forms. "), "Every request reaches the right person, is recorded and gets a reply."],
                    [("b", "Sales and CRM. "), "Contacts sorted, personalised replies, automatic follow-up and a CRM that is always up to date."],
                    [("b", "Reports and data. "), "Automatic reports, weekly metrics and alerts so you can decide with up-to-date information."],
                    [("b", "Tool integration. "), "Email, Drive, Excel, CRM, ERP or WhatsApp connected to each other, so information moves from one to the next without copying and pasting."],
                ]),
            ]),
            ("Examples of automations", [
                ("p", "This is what a task looks like once it stops being done by hand. These are typical examples; in your business they are adapted to your software and the way you work."),
                ("ul", [
                    [("b", "Supplier invoices. "), "The invoice arrives by email, the supplier, date and amounts are read, they are entered in your spreadsheet or management software and the PDF is filed in its folder. A person only reviews the ones that don't add up."],
                    [("b", "Website enquiries. "), "Each form creates the contact in your CRM, sends a confirmation to whoever wrote and alerts the team member who has to reply."],
                    [("b", "Quotes and enquiries. "), "Incoming emails are sorted by type, a record is created with the details and a draft reply is prepared for you to review and send."],
                    [("b", "Weekly report. "), "Sales, order or incident data is collected from each tool and arrives summarised in your inbox every Monday."],
                    [("b", "Bookings and appointments. "), "The appointment goes into the calendar, the customer receives a confirmation and a reminder, and changes update themselves."],
                ]),
            ]),
            ("We start with a diagnostic", [
                ("p", "Before automating anything, we analyse how your business works and draw a map of its processes, tools and connections. That map shows where time is lost and what is best to automate first."),
                ("p", "We prepare two separate diagnostics: processes and automation opportunities. The first organises how you work and helps prepare the way towards ISO 9001. The second identifies tasks that could be done with less time and fewer errors. We will contact you within 72 calendar hours to go over the conclusions, fees and delivery terms. Submitting the questionnaire does not mean hiring us or paying anything."),
                ("p", ["After that we follow a clear process: design, development, testing and training for your team. This is ", ("a", "how we work", "/#como-trabajamos"), "."]),
            ]),
            ("About the tools you already use", [
                ("p", ["There is no need to switch software. We work with Microsoft 365, Google Drive, WhatsApp, Notion, Airtable or Odoo, and connect them with n8n, Make or custom integrations when the process calls for it. We explain this in ", ("a", "n8n automation and tool integration", "/en/n8n-automation"), "."]),
                ("p", ["When the task requires understanding text, such as reading a document, sorting an email or drafting a reply, we add ", ("a", "artificial intelligence", "/en/artificial-intelligence"), " to the process."]),
            ]),
            ("With control and oversight", [
                ("ul", [
                    "Human review at sensitive steps",
                    "A record of every action",
                    "Secure integrations and data protection",
                    "Testing with real or test data before going live",
                ]),
            ]),
            ("60-day guarantee", [
                ("garantia", GARANTIA),
            ]),
            ("A real case: RentUp Capital", [
                ("p", "For RentUp Capital, a real estate investment firm, we automated everything that happens after someone submits a form on their website: each contact is saved to their list, the person receives an email confirmation and the team gets an alert with all the details."),
                ("p", [("a", "See the RentUp Capital project", "/proyectos/rentup-capital")]),
            ]),
            ("Frequently asked questions", [
                ("faq", [
                    ("Which processes can be automated?", "Those that repeat and follow clear rules: recording documents and invoices, replying to and sorting emails, moving data between programs, following up on contacts or preparing reports. In the diagnostic we see which ones are worth it in your case."),
                    ("Do we have to change tools?", "No. We start from the ones your business already uses and connect them to each other. We only propose a new tool when it solves something the current ones can't."),
                    ("What happens if an automation gets something wrong?", "We design them with validations, action logs and human review at sensitive steps, and we test them before they go live. Important decisions still go through a person."),
                    ("Do we need technical knowledge?", "No. We take care of the analysis, development, integrations and testing. Afterwards we train your team and leave documentation so they can use the system independently."),
                    ("How much does it cost to automate a process?", "It depends on the process and the tools that need to be connected. That is why we start with the diagnostic: afterwards you receive a proposal with the scope, phases and price, and you decide with that information."),
                    ("How much time will it save?", "It depends on how often the task is repeated and how long it takes today. For automations with a guarantee we put it in writing before starting: how much time your team spends on the process and how it will be measured afterwards."),
                    ("Do you work with companies outside Barcelona?", "Yes. Analysis, development and training can be done remotely, so we work with businesses across Spain. With companies in Barcelona and the Vallès we can also meet in person."),
                ]),
            ]),
            ("Shall we talk about your processes?", [
                ("p", _TANCAMENT),
                ("p", ["You may also be interested in: ", ("a", "artificial intelligence for businesses", "/en/artificial-intelligence"), ", ", ("a", "n8n automation", "/en/n8n-automation"), " and ", ("a", "custom web development", "/en/web-development"), "."]),
            ]),
        ],
    },
    {
        "slug": "en/artificial-intelligence",
        "es": "inteligencia-artificial",
        "id": "bqEnIntA1",
        "nombre": "Artificial intelligence for businesses",
        "title": "Artificial intelligence for SMEs in Barcelona | Banteq",
        "descripcion": (
            "AI assistants that answer enquiries, read documents, sort requests and prepare drafts inside your tools, "
            "with human review."
        ),
        "h1": "Artificial intelligence for businesses",
        "subtitulo": "Assistants that respond, sort and draft inside your tools, with your team in charge.",
        "intro": [
            "Artificial intelligence is already useful in the day-to-day of an SME: it answers enquiries, finds information "
            "in your documents, sorts what comes in and prepares drafts. The hard part is not using it, but applying it where it really adds value.",
            "At Banteq we build it into your processes and the tools you already use, and we make clear what the AI does and what a person still decides.",
        ],
        "secciones": [
            ("What we do with artificial intelligence", [
                ("ul", [
                    [("b", "Customer service. "), "Assistants that answer the usual questions and pass to your team the ones that need a person."],
                    [("b", "Questions about your internal documentation. "), "Your team asks in their own words and the assistant replies from the company's documents."],
                    [("b", "Document reading. "), "Invoices, orders or forms from which data is extracted so it can be recorded without retyping."],
                    [("b", "Sorting requests. "), "Every email or form arrives labelled and with the right person."],
                    [("b", "Draft replies. "), "The AI prepares the text; a person reviews and sends it."],
                ]),
            ]),
            ("When it makes sense to use AI and when it doesn't", [
                ("p", "AI adds value when the task requires understanding language: reading text that doesn't always arrive in the same form, deciding what a message is about or drafting a reply. If the task follows fixed rules, such as moving a piece of data from one program to another, a simpler automation is usually enough, and it is cheaper and more predictable."),
                ("p", ["That is why we don't start with the technology. We look at the process first and then decide whether it needs AI, a ", ("a", "process automation", "/en/process-automation"), " without AI, or both."]),
            ]),
            ("The AI proposes, your team decides", [
                ("p", "We don't leave sensitive processes unsupervised. We design every solution with human review, action logs and validations: the AI prepares, classifies and carries out tasks, and important decisions still go through a person."),
            ]),
            ("Your data, under control", [
                ("ul", [
                    "We use the data you provide only for the agreed scope",
                    "We protect it with appropriate security measures",
                    "We do not use it to train public AI models without your express permission",
                ]),
                ("p", ["We explain this in detail in our ", ("a", "privacy policy", "/privacidad"), "."]),
            ]),
            ("Built into what you already use", [
                ("p", ["We work with OpenAI models and connect them to your email, your documents, your CRM or WhatsApp using ", ("a", "n8n, Make or custom integrations", "/en/n8n-automation"), ". Afterwards we train your team and leave documentation so they can use the system independently."]),
            ]),
            ("Frequently asked questions", [
                ("faq", [
                    ("What is the difference between automation and artificial intelligence?", "An automation follows fixed rules: if this happens, do that. Artificial intelligence interprets texts, documents or messages that don't follow a set format. The most common approach is to combine them: the AI understands what comes in and the automation does the rest."),
                    ("Does AI replace people on the team?", "No. It takes care of repetitive tasks, such as sorting, searching for information or writing a first draft, so your team can spend its time on what needs judgement. Important decisions still go through a person."),
                    ("What happens to our company's data?", "It is used only for the agreed scope, protected with appropriate security measures and not used to train public AI models without your express permission."),
                    ("Is it suitable for a small business?", "Yes, if there is a specific task that repeats: always answering the same questions, reading documents or sorting emails. What matters is not the size of the company, but choosing the first use case well."),
                    ("Where do we start?", "With a process diagnostic: we analyse how your business works and choose the first use case with you, the one that saves the most time with the least risk."),
                ]),
            ]),
            ("Shall we talk about your case?", [
                ("p", _TANCAMENT),
                ("p", ["You may also be interested in: ", ("a", "process automation", "/en/process-automation"), " and ", ("a", "n8n automation", "/en/n8n-automation"), "."]),
            ]),
        ],
    },
    {
        "slug": "en/n8n-automation",
        "es": "automatizacion-n8n",
        "id": "bqEnN8nI1",
        "nombre": "n8n automation and tool integration",
        "title": "n8n automation and tool integration | Banteq",
        "descripcion": (
            "We connect your email, Excel, CRM, ERP, WhatsApp and website with n8n, Make or custom API integrations. "
            "Data moves from one program to another without copying and pasting."
        ),
        "h1": "n8n automation and tool integration",
        "subtitulo": "Your programs, connected to each other: information moves from one to the next without copying and pasting.",
        "intro": [
            "Most businesses already have good tools. The problem is that they don't talk to each other: the order is in one program, the customer in another and the invoice in a third, and someone spends part of the day moving data from one place to another.",
            "At Banteq we connect those tools with n8n, with Make or with custom integrations through their APIs, depending on what suits each case.",
        ],
        "secciones": [
            ("What n8n is and what we use it for", [
                ("p", "n8n is an automation tool that connects applications through workflows: when something happens in one program, a series of steps runs in others. It can be used in n8n's cloud or installed on your own server, and it lets us add custom logic and artificial intelligence when the workflow needs it."),
                ("p", "We use it for processes that cross several tools: collecting a piece of data, transforming it, checking it and leaving it where it belongs, with alerts if something fails."),
            ]),
            ("Which tools we connect", [
                ("ul", [
                    [("b", "Email and documents. "), "Microsoft 365 and Google Drive."],
                    [("b", "Data and management. "), "Excel, Airtable, Notion and Odoo."],
                    [("b", "Customers. "), "Your CRM, WhatsApp and your website forms."],
                    [("b", "Artificial intelligence. "), "OpenAI models to read, sort or draft inside the workflow."],
                    [("b", "Programs without a connector. "), "If the tool has an API, we integrate it on a custom basis."],
                ]),
            ]),
            ("Examples of workflows", [
                ("ul", [
                    [("b", "From Excel to the CRM. "), "Every new row creates or updates the contact, with no duplicates."],
                    [("b", "From email to a folder. "), "Attachments from a type of email are saved with the right name and in the right place, and who sent them is noted."],
                    [("b", "From a form to the team. "), "The request is recorded, the sender gets a confirmation and the person responsible is alerted."],
                    [("b", "From several tools to one report. "), "Data is gathered every week and arrives summarised by email."],
                ]),
                ("p", ["In ", ("a", "process automation", "/en/process-automation"), " we explain which tasks are best to automate first and how we decide."]),
            ]),
            ("n8n, Make or a custom integration", [
                ("p", "There is no single best tool for everything. We choose based on the volume of operations, how sensitive the data is, the tools you already have and who will maintain the workflow afterwards. If you already work with Make or another platform, we start from there."),
            ]),
            ("Workflows you can maintain", [
                ("ul", [
                    "A record of every run and alerts when something fails",
                    "Human review at sensitive steps",
                    "Testing with real or test data before going live",
                    "Documentation and training so your team understands what each workflow does",
                ]),
            ]),
            ("Frequently asked questions", [
                ("faq", [
                    ("Do I need to have n8n already?", "No. If you already use it, we work on your installation. If not, we suggest the option that fits your case: n8n's cloud, your own server or another tool."),
                    ("n8n or Make?", "It depends on the process. We look at the volume, the data involved and who will maintain it, and we explain why we recommend one or the other."),
                    ("Can you connect a program that has no integration?", "If the program offers an API, yes: we build the integration to measure. If it doesn't, we look for an alternative, such as working with its exports."),
                    ("What happens if a workflow fails?", "Every workflow logs what it does and alerts you when something doesn't go as it should, so it can be fixed as soon as possible. Sensitive steps include human review."),
                    ("Does our data leave the company?", "It only passes through the tools we agree on and is used for the agreed scope. When it makes sense, n8n can be installed on your own server."),
                ]),
            ]),
            ("Shall we talk about your tools?", [
                ("p", _TANCAMENT),
                ("p", ["You may also be interested in: ", ("a", "process automation", "/en/process-automation"), " and ", ("a", "artificial intelligence for businesses", "/en/artificial-intelligence"), "."]),
            ]),
        ],
    },
    {
        "slug": "en/web-development",
        "es": "desarrollo-web",
        "id": "bqEnWebM1",
        "nombre": "Custom web development",
        "title": "Custom web design and development in Barcelona | Banteq",
        "descripcion": (
            "Custom corporate websites, redesigns and websites connected to your CRM and automations. "
            "No templates. For businesses in Barcelona and across Spain."
        ),
        "h1": "Custom web development",
        "subtitulo": "Corporate websites designed and built from scratch, connected to your business.",
        "intro": [
            "Your website is often the first meeting with a customer. It has to explain clearly what you do, build trust and turn visits into enquiries.",
            "We design and build each website to measure, with no templates, and connect it to your email, your CRM or your automations so that it works for your business.",
        ],
        "secciones": [
            ("What kinds of websites we build", [
                ("ul", [
                    [("b", "Corporate websites. "), "Modern and carefully crafted, designed to explain clearly what you do."],
                    [("b", "Website redesign. "), "A new look, better structure and an experience designed mobile-first."],
                    [("b", "Interactive experiences. "), "Animations, 3D and journeys that make a product clear at a glance."],
                    [("b", "Multilingual websites. "), "With the right terminology in each language."],
                    [("b", "Custom features. "), "Newsletters, dedicated areas or whatever your business needs."],
                ]),
            ]),
            ("Banteq Formula: your website, renewed when you hire maintenance", [
                ("p", FORMULA_FRASE),
                ("p", [FORMULA_NOTA + " ", ("a", "Full terms", "/aviso-legal"), "."]),
                ("p", ["Fee examples and what is included are in ", ("a", "web maintenance for businesses", "/en/web-maintenance"), "."]),
                ("formula", "Find out how it works"),
            ]),
            ("A connected website, not a brochure", [
                ("ul", [
                    "Forms that save each request in your CRM",
                    "Automatic confirmation to whoever writes",
                    "An instant alert to your team",
                    "Integration with your email and your automations",
                ]),
                ("p", ["It is the same work we do in ", ("a", "process automation", "/en/process-automation"), ", applied to your website."]),
            ]),
            ("Fast and well built", [
                ("p", "A design that adapts to mobile, tablet and desktop, good performance and a technical foundation ready to grow with you. We also take care of the structure and SEO of every page, so your customers can find you."),
            ]),
            ("Real projects", [
                ("p", [("b", "Margon. "), "A corporate website in five languages for a metalworking company, with a page for each sector, an interactive walk through the inside of a train and a news section with a newsletter. ", ("a", "See the Margon project", "/proyectos/margon")]),
                ("p", [("b", "RentUp Capital. "), "An eleven-page website for a real estate investment firm, with connected forms that record each contact and alert the team. ", ("a", "See the RentUp Capital project", "/proyectos/rentup-capital")]),
            ]),
            ("Frequently asked questions", [
                ("faq", [
                    ("Do you work with templates?", "No. Each website is designed and built for the company that commissions it: its content, its image and the features it needs."),
                    ("Can you redesign the website we already have?", "Yes. We renew websites that have fallen behind: a new look, better structure and an experience designed mobile-first."),
                    ("Can the website be connected to our CRM or our email?", "Yes. Forms can save each request in your CRM, send a confirmation to whoever wrote and alert your team straight away, with no manual work."),
                    ("Do you build websites in several languages?", "Yes. The website we built for Margon, for example, is available in five languages, with the right technical terminology in each."),
                ]),
            ]),
            ("Shall we talk about your website?", [
                ("p", _TANCAMENT),
                ("p", ["You may also be interested in: ", ("a", "web maintenance for businesses", "/en/web-maintenance"), " and ", ("a", "process automation", "/en/process-automation"), "."]),
            ]),
        ],
    },
    {
        "slug": "en/web-maintenance",
        "es": "mantenimiento-web",
        "id": "bqEnMant1",
        "nombre": "Web maintenance for businesses",
        "title": "Web maintenance for businesses | Banteq Formula",
        "descripcion": (
            "Move your website maintenance to Banteq: we remodel it at no basic development cost and you pay "
            "25% less, up to €50/month. Minimum fee: €35/month."
        ),
        "h1": "Web maintenance for businesses",
        "subtitulo": "With the Banteq Formula, your website is renewed when you hire maintenance and the fee drops compared with what you pay today.",
        "intro": [
            "Many businesses pay every month for the maintenance of a website that hasn't changed in years. The fee carries on; the website falls behind.",
            "The Banteq Formula puts the two together: when you hire us for maintenance, we redesign your website at no basic development cost and the fee is calculated from the one you currently pay, with a discount.",
        ],
        "secciones": [
            ("How the Banteq Formula works", [
                ("p", FORMULA_FRASE),
                ("ul", [
                    "You tell us how much you pay today to maintain your website",
                    "We review your current website and its technical needs",
                    "You receive a proposal with the fee and, in writing, what the remodel includes",
                    "If you accept, we remodel the website and take over its maintenance",
                ]),
                ("formula", "Calculate my fee"),
            ]),
            ("What you would pay", [
                ("p", "The discount is the lowest of these three amounts: 25% of your current fee, €50 per month, or the difference between your fee and €35. The fee with Banteq never falls below €35 per month. Some examples, excluding VAT:"),
                ("ul", [f"If you pay €{a:g}/month, you would pay €{n:g}/month: €{h:g} less every month." for a, n, h in C.FORMULA_EJEMPLOS]),
            ]),
            ("What the free remodel includes", [
                ("p", "A simple informational website with:"),
                ("ul", [
                    "A modern, professional design that adapts to mobile devices",
                    "Basic content about the company, its services and contact details",
                    "A working contact form",
                    "Basic structure and navigation",
                ]),
                ("p", "Online shops, booking systems, complex integrations, custom animations and other advanced developments are not part of the free remodel: they are quoted separately and only carried out if you accept them."),
            ]),
            ("Clear terms", [
                ("ul", [
                    "Your current fee must be verifiable with an invoice or an equivalent document",
                    "The free remodel is conditional on hiring maintenance with Banteq",
                    "Before starting, what is included and what would carry an extra cost is specified in writing",
                    "No additional charges are made without your prior authorisation",
                ]),
                ("p", ["The full terms are in the ", ("a", "legal notice", "/aviso-legal"), "."]),
            ]),
            ("Websites we have built", [
                ("p", ["If you want to see how we work, here are two real projects: ", ("a", "the Margon website", "/proyectos/margon"), ", in five languages, and ", ("a", "the RentUp Capital website", "/proyectos/rentup-capital"), ", with automated forms. And if you need more than an informational website, take a look at ", ("a", "custom web development", "/en/web-development"), "."]),
            ]),
            ("Frequently asked questions", [
                ("faq", [
                    ("How much does web maintenance with Banteq cost?", "It is calculated from what you pay today: 25% less, with a maximum saving of €50 per month and a minimum fee of €35 per month. Amounts exclude VAT."),
                    ("What if I already pay €35 per month or less?", "In that case there is no discount: the minimum fee with Banteq is €35 per month."),
                    ("Is the website redesign really free?", "Yes, for a simple informational website with a mobile-friendly design, the company's basic content and a contact form. Anything beyond that is quoted separately and only done with your acceptance."),
                    ("What do I need to request the proposal?", "To know how much you currently pay for maintenance and be able to show it with an invoice. With that and a review of your current website we prepare the proposal."),
                    ("What does maintenance include?", "The scope is set out in the proposal, after reviewing your current website and its technical needs, and it is put in writing before we start."),
                ]),
            ]),
            ("Shall we talk about your website?", [
                ("p", _TANCAMENT),
            ]),
        ],
    },
]

import textos_demos, textos_home, textos_legal, textos_proyectos, textos_meta  # noqa: E402

TABLAS = [textos_home.TABLA, textos_demos.TABLA, textos_proyectos.TABLA, textos_legal.TABLA, textos_meta.TABLA]
TEXTOS_EN = CA.fundir(INTERFAZ_EN, 2)
