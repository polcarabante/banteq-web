"""Versión en catalán de las páginas de servicio (/ca/…).

Mismo contenido que contenido.SERVICIOS, traducido: sin datos nuevos, sin cifras ni testimonios que
no estén en castellano. Cada página lleva "es": la ruta de su par en castellano (hreflang y enlace
de idioma). Las páginas de proyecto, las legales y la home siguen solo en castellano: los enlaces
hacia ellas lo indican.

INTERFAZ_CA / INTERFAZ_CA_REGLAS: textos del menú, el pie, el formulario y la ventana de la Fórmula
Banteq, que en estas páginas traduce assets-banteq/web/banteq-ca.js sobre la página ya pintada (el
código de la web en castellano no cambia). tools/build.py comprueba que cada texto en castellano
sigue existiendo tal cual; si alguien lo cambia, el build avisa para actualizar la traducción.
"""
import contenido as C

ZONA_FRASE = ("Som a Santa Perpètua de Mogoda (Barcelona) i treballem amb empreses de Barcelona, el Vallès i, "
              "en remot, de la resta d'Espanya.")
_TANCAMENT = [ZONA_FRASE + " ", ("a", "Explica'ns el teu cas", "#hablemos"), " i et proposem un primer pas raonable."]

FORMULA_FRASE = ("Remodelem el teu web sense cost de desenvolupament bàsic en contractar el nostre manteniment. "
                 "Estalvia un 25 % de la teva quota actual, fins a 50 €/mes, amb una quota mínima de 35 €/mes.")
FORMULA_NOTA = ("La remodelació gratuïta inclou un web informatiu bàsic amb formulari de contacte; "
                "les funcionalitats addicionals es pressuposten a part. Imports sense IVA.")

GARANTIA = {
    "ref": ("Les automatitzacions que implantem amb garantia tenen 60 dies per demostrar que t'estalvien temps. "
            "Si no ho fan, et retornem el cost d'implementació."),
    "alcance": ("Cobreix la implementació de les automatitzacions incloses en la garantia. No inclou manteniment, "
                "eines externes ni costos de tercers."),
    "enlace": ("Condicions de la garantia", "/aviso-legal#garantia"),
}

# Frase de cambio de idioma al final de cada página de servicio, con un enlace por idioma.
ALTERNA_CA = ("Aquesta pàgina també està disponible en ", {"es": "castellà", "en": "anglès"}, " i ", ".")

SERVICIOS_CA = [
    {
        "slug": "ca/automatitzacio-processos",
        "es": "automatizacion-procesos",
        "id": "bqCaAuto1",
        "nombre": "Automatització de processos",
        "title": "Automatització de processos per a pimes a Barcelona | Banteq",
        "descripcion": (
            "Automatitzem factures, correus, formularis i tasques repetitives connectant les eines que ja fa "
            "servir la teva empresa. Per a pimes de Barcelona i d'arreu d'Espanya."
        ),
        "h1": "Automatització de processos per a empreses i pimes",
        "subtitulo": "Tasques repetitives que es resolen soles, connectades amb les eines que ja fa servir el teu equip.",
        "intro": [
            "Factures que es registren a mà, correus que cal reenviar, dades que es copien d'un Excel a un altre, "
            "sol·licituds que es queden sense resposta. Són tasques petites que, sumades, s'emporten hores cada setmana i "
            "acaben provocant errors.",
            "A Banteq analitzem com treballa la teva empresa, decidim amb tu què val la pena automatitzar i ho "
            "construïm sobre les teves eines, amb revisió humana on cal.",
        ],
        "secciones": [
            ("Quins processos automatitzem", [
                ("ul", [
                    [("b", "Documents i factures. "), "Es reben, es classifiquen i es registren sense tornar-los a teclejar, amb una persona que valida el que ho necessita."],
                    [("b", "Correus i formularis. "), "Cada sol·licitud arriba a qui toca, queda registrada i rep resposta."],
                    [("b", "Vendes i CRM. "), "Contactes classificats, respostes personalitzades, seguiment automàtic i un CRM sempre al dia."],
                    [("b", "Informes i dades. "), "Informes automàtics, mètriques setmanals i alertes per decidir amb informació al dia."],
                    [("b", "Connexió entre eines. "), "Correu, Drive, Excel, CRM, ERP o WhatsApp connectats entre si, perquè la informació passi de l'una a l'altra sense copiar i enganxar."],
                ]),
            ]),
            ("Exemples d'automatitzacions", [
                ("p", "Així queda una tasca quan deixa de fer-se a mà. Són exemples habituals; a la teva empresa s'adapten als teus programes i a la teva manera de treballar."),
                ("ul", [
                    [("b", "Factures de proveïdors. "), "La factura arriba per correu, se'n llegeixen el proveïdor, la data i els imports, s'anota al teu full de càlcul o al teu programa de gestió i el PDF s'arxiva a la seva carpeta. Una persona revisa només les que no quadren."],
                    [("b", "Sol·licituds del web. "), "Cada formulari crea el contacte al teu CRM, envia una confirmació a qui escriu i avisa la persona de l'equip que ha de respondre."],
                    [("b", "Pressupostos i consultes. "), "Els correus entrants es classifiquen per tipus, es crea la fitxa amb les dades i es prepara un esborrany de resposta per revisar i enviar."],
                    [("b", "Informe setmanal. "), "Les dades de vendes, comandes o incidències es recullen de cada eina i arriben resumides al correu cada dilluns."],
                    [("b", "Reserves i cites. "), "La cita queda al calendari, el client rep la confirmació i un recordatori, i els canvis s'actualitzen sols."],
                ]),
            ]),
            ("Comencem per un diagnòstic", [
                ("p", "Abans d'automatitzar res, analitzem com treballa la teva empresa i dibuixem un mapa dels seus processos, eines i connexions. Aquest mapa mostra on es perd temps i què convé automatitzar primer."),
                ("p", "Preparem dos diagnòstics separats: processos i oportunitats d'automatització. El primer organitza com treballeu i ajuda a preparar el camí cap a la ISO 9001. El segon identifica tasques que es podrien fer amb menys temps i errors. Us contactarem en menys de 72 hores naturals per comentar les conclusions, els honoraris i les condicions de lliurament. Enviar el qüestionari no suposa contractar ni pagar."),
                ("p", ["Després seguim un procés clar: disseny, desenvolupament, proves i formació del teu equip. Així és ", ("a", "com treballem", "/#como-trabajamos"), "."]),
            ]),
            ("Sobre les eines que ja fas servir", [
                ("p", ["No cal canviar de programes. Treballem amb Microsoft 365, Google Drive, WhatsApp, Notion, Airtable o Odoo, i les connectem amb n8n, Make o integracions a mida quan el procés ho requereix. Ho expliquem a ", ("a", "automatització amb n8n i integració d'eines", "/ca/automatitzacio-n8n"), "."]),
                ("p", ["Quan la tasca exigeix entendre un text, com ara llegir un document, classificar un correu o redactar una resposta, afegim ", ("a", "intel·ligència artificial", "/ca/intelligencia-artificial"), " al procés."]),
            ]),
            ("Amb control i supervisió", [
                ("ul", [
                    "Revisió humana en els passos sensibles",
                    "Registre de cada acció",
                    "Integracions segures i protecció de dades",
                    "Proves amb dades reals o de prova abans de posar-ho en marxa",
                ]),
            ]),
            ("Garantia de 60 dies", [
                ("garantia", GARANTIA),
            ]),
            ("Un cas real: RentUp Capital", [
                ("p", "Per a RentUp Capital, una firma d'inversió immobiliària, vam automatitzar tot el que passa després d'enviar un formulari al seu web: cada contacte es desa a la seva llista, la persona rep una confirmació per correu i l'equip, un avís amb totes les dades."),
                ("p", [("a", "Veure el projecte de RentUp Capital", "/proyectos/rentup-capital")]),
            ]),
            ("Preguntes freqüents", [
                ("faq", [
                    ("Quins processos es poden automatitzar?", "Els que es repeteixen i segueixen regles clares: registrar documents i factures, respondre i classificar correus, passar dades entre programes, fer seguiment de contactes o preparar informes. En el diagnòstic veiem quins compensen en el teu cas."),
                    ("Hem de canviar d'eines?", "No. Partim de les que ja fa servir la teva empresa i les connectem entre si. Només proposem una eina nova quan resol alguna cosa que les actuals no poden."),
                    ("Què passa si una automatització s'equivoca?", "Les dissenyem amb validacions, registre d'accions i revisió humana en els passos sensibles, i les provem abans de posar-les en marxa. Les decisions importants continuen passant per una persona."),
                    ("Necessitem coneixements tècnics?", "No. Ens encarreguem de l'anàlisi, el desenvolupament, les integracions i les proves. Després formem el teu equip i deixem documentació perquè faci servir el sistema amb autonomia."),
                    ("Quant costa automatitzar un procés?", "Depèn del procés i de les eines que calgui connectar. Per això comencem pel diagnòstic: després reps una proposta amb l'abast, les fases i l'import, i decideixes amb aquesta informació."),
                    ("Quant de temps s'estalvia?", "Depèn de quantes vegades es repeteix la tasca i de quant triga avui. En les automatitzacions amb garantia ho deixem per escrit abans de començar: quant de temps dedica el teu equip al procés i com es mesurarà després."),
                    ("Treballeu amb empreses de fora de Barcelona?", "Sí. L'anàlisi, el desenvolupament i la formació es poden fer en remot, així que treballem amb empreses d'arreu d'Espanya. Amb les de Barcelona i el Vallès també ens podem veure en persona."),
                ]),
            ]),
            ("Parlem dels teus processos?", [
                ("p", _TANCAMENT),
                ("p", ["També et pot interessar: ", ("a", "intel·ligència artificial per a empreses", "/ca/intelligencia-artificial"), ", ", ("a", "automatització amb n8n", "/ca/automatitzacio-n8n"), " i ", ("a", "desenvolupament web a mida", "/ca/desenvolupament-web"), "."]),
            ]),
        ],
    },
    {
        "slug": "ca/intelligencia-artificial",
        "es": "inteligencia-artificial",
        "id": "bqCaIntA1",
        "nombre": "Intel·ligència artificial per a empreses",
        "title": "Intel·ligència artificial per a pimes a Barcelona | Banteq",
        "descripcion": (
            "Assistents d'IA que responen consultes, llegeixen documents, classifiquen sol·licituds i preparen "
            "esborranys dins de les teves eines, amb revisió humana."
        ),
        "h1": "Intel·ligència artificial per a empreses",
        "subtitulo": "Assistents que atenen, classifiquen i redacten dins de les teves eines, amb el teu equip al comandament.",
        "intro": [
            "La intel·ligència artificial ja és útil en el dia a dia d'una pime: respon consultes, troba informació "
            "als teus documents, classifica el que entra i prepara esborranys. El difícil no és fer-la servir, sinó aplicar-la on de debò aporta.",
            "A Banteq la integrem en els teus processos i en les eines que ja utilitzes, i deixem clar què fa la IA i què continua decidint una persona.",
        ],
        "secciones": [
            ("Què fem amb intel·ligència artificial", [
                ("ul", [
                    [("b", "Atenció al client. "), "Assistents que responen les consultes habituals i passen al teu equip les que necessiten una persona."],
                    [("b", "Consultes sobre la teva documentació interna. "), "El teu equip pregunta amb les seves paraules i l'assistent respon a partir dels documents de l'empresa."],
                    [("b", "Lectura de documents. "), "Factures, comandes o formularis dels quals s'extreuen les dades per registrar-les sense teclejar-les."],
                    [("b", "Classificació de sol·licituds. "), "Cada correu o formulari arriba etiquetat i a qui correspon."],
                    [("b", "Esborranys de resposta. "), "La IA prepara el text; una persona el revisa i l'envia."],
                ]),
            ]),
            ("Quan té sentit fer servir IA i quan no", [
                ("p", "La IA aporta quan la tasca exigeix entendre llenguatge: llegir un text que no arriba sempre igual, decidir de què tracta un missatge o redactar una resposta. Si la tasca segueix regles fixes, com ara passar una dada d'un programa a un altre, sol ser suficient una automatització més senzilla, que és més barata i més previsible."),
                ("p", ["Per això no comencem per la tecnologia. Primer mirem el procés i després decidim si necessita IA, una ", ("a", "automatització de processos", "/ca/automatitzacio-processos"), " sense IA o totes dues coses."]),
            ]),
            ("La IA proposa, el teu equip decideix", [
                ("p", "No deixem processos sensibles sense supervisió. Dissenyem cada solució amb revisió humana, registre d'accions i validacions: la IA prepara, classifica i executa tasques, i les decisions importants continuen passant per una persona."),
            ]),
            ("Les teves dades, sota control", [
                ("ul", [
                    "Fem servir les dades que aportes només per a l'abast acordat",
                    "Les protegim amb mesures de seguretat adequades",
                    "No les fem servir per entrenar models d'IA públics sense el teu permís exprés",
                ]),
                ("p", ["Ho expliquem amb detall a la nostra ", ("a", "política de privacitat", "/privacidad"), "."]),
            ]),
            ("Integrada en el que ja fas servir", [
                ("p", ["Treballem amb models d'OpenAI i els connectem amb el teu correu, els teus documents, el teu CRM o WhatsApp mitjançant ", ("a", "n8n, Make o integracions a mida", "/ca/automatitzacio-n8n"), ". Després formem el teu equip i deixem documentació perquè faci servir el sistema amb autonomia."]),
            ]),
            ("Preguntes freqüents", [
                ("faq", [
                    ("Quina diferència hi ha entre automatització i intel·ligència artificial?", "Una automatització segueix regles fixes: si passa això, fes allò. La intel·ligència artificial interpreta textos, documents o missatges que no segueixen un format. El més habitual és combinar-les: la IA entén el que entra i l'automatització fa la resta."),
                    ("La IA substitueix les persones de l'equip?", "No. S'ocupa de tasques repetitives, com ara classificar, buscar informació o redactar un primer esborrany, perquè el teu equip dediqui el temps al que requereix criteri. Les decisions importants continuen passant per una persona."),
                    ("Què passa amb les dades de la nostra empresa?", "Es fan servir només per a l'abast acordat, es protegeixen amb mesures de seguretat adequades i no s'utilitzen per entrenar models d'IA públics sense el teu permís exprés."),
                    ("Serveix per a un negoci petit?", "Sí, si hi ha una tasca concreta que es repeteix: respondre sempre les mateixes preguntes, llegir documents o classificar correus. L'important no és la mida de l'empresa, sinó triar bé el primer cas d'ús."),
                    ("Per on comencem?", "Per un diagnòstic de processos: analitzem com treballa la teva empresa i triem amb tu el primer cas d'ús, el que més temps estalvia amb menys risc."),
                ]),
            ]),
            ("Parlem del teu cas?", [
                ("p", _TANCAMENT),
                ("p", ["També et pot interessar: ", ("a", "automatització de processos", "/ca/automatitzacio-processos"), " i ", ("a", "automatització amb n8n", "/ca/automatitzacio-n8n"), "."]),
            ]),
        ],
    },
    {
        "slug": "ca/automatitzacio-n8n",
        "es": "automatizacion-n8n",
        "id": "bqCaN8nI1",
        "nombre": "Automatització amb n8n i integració d'eines",
        "title": "Automatització amb n8n i integració d'eines | Banteq",
        "descripcion": (
            "Connectem el teu correu, Excel, CRM, ERP, WhatsApp i el teu web amb n8n, Make o integracions per API "
            "a mida. Les dades passen d'un programa a un altre sense copiar i enganxar."
        ),
        "h1": "Automatització amb n8n i integració d'eines",
        "subtitulo": "Els teus programes, connectats entre si: la informació passa de l'un a l'altre sense copiar i enganxar.",
        "intro": [
            "La majoria de les empreses ja té bones eines. El problema és que no es parlen: la comanda és en un programa, el client en un altre i la factura en un tercer, i algú dedica part del dia a passar dades d'un lloc a un altre.",
            "A Banteq connectem aquestes eines amb n8n, amb Make o amb integracions a mida mitjançant les seves API, segons el que convingui a cada cas.",
        ],
        "secciones": [
            ("Què és n8n i per a què el fem servir", [
                ("p", "n8n és una eina d'automatització que connecta aplicacions mitjançant fluxos: quan passa alguna cosa en un programa, s'executen una sèrie de passos en d'altres. Es pot fer servir al núvol d'n8n o instal·lar-se en un servidor propi, i permet afegir lògica a mida i intel·ligència artificial quan el flux ho necessita."),
                ("p", "El fem servir per als processos que creuen diverses eines: recollir una dada, transformar-la, comprovar-la i deixar-la on ha d'estar, amb avisos si alguna cosa falla."),
            ]),
            ("Quines eines connectem", [
                ("ul", [
                    [("b", "Correu i documents. "), "Microsoft 365 i Google Drive."],
                    [("b", "Dades i gestió. "), "Excel, Airtable, Notion i Odoo."],
                    [("b", "Clients. "), "El teu CRM, WhatsApp i els formularis del teu web."],
                    [("b", "Intel·ligència artificial. "), "Models d'OpenAI per llegir, classificar o redactar dins del flux."],
                    [("b", "Programes sense connector. "), "Si l'eina té API, la integrem a mida."],
                ]),
            ]),
            ("Exemples de fluxos", [
                ("ul", [
                    [("b", "D'Excel al CRM. "), "Cada fila nova crea o actualitza el contacte, sense duplicats."],
                    [("b", "Del correu a la carpeta. "), "Els adjunts d'un tipus de correu es desen amb el seu nom i al seu lloc, i s'anota qui els ha enviat."],
                    [("b", "Del formulari a l'equip. "), "La sol·licitud queda registrada, es confirma a qui escriu i s'avisa la persona responsable."],
                    [("b", "De diverses eines a un informe. "), "Les dades es reuneixen cada setmana i arriben resumides per correu."],
                ]),
                ("p", ["A ", ("a", "automatització de processos", "/ca/automatitzacio-processos"), " expliquem quines tasques convé automatitzar primer i com ho decidim."]),
            ]),
            ("n8n, Make o una integració a mida", [
                ("p", "No hi ha una eina millor per a tot. Triem segons el volum d'operacions, com de sensibles són les dades, les eines que ja tens i qui mantindrà el flux després. Si ja treballes amb Make o amb una altra plataforma, partim d'aquí."),
            ]),
            ("Fluxos que es poden mantenir", [
                ("ul", [
                    "Registre de cada execució i avisos quan alguna cosa falla",
                    "Revisió humana en els passos sensibles",
                    "Proves amb dades reals o de prova abans de posar-ho en marxa",
                    "Documentació i formació perquè el teu equip entengui què fa cada flux",
                ]),
            ]),
            ("Preguntes freqüents", [
                ("faq", [
                    ("Necessito tenir n8n contractat?", "No. Si ja el fas servir, treballem sobre la teva instal·lació. Si no, et proposem l'opció que encaixa amb el teu cas: el núvol d'n8n, un servidor propi o una altra eina."),
                    ("n8n o Make?", "Depèn del procés. Valorem el volum, les dades que es manegen i qui ho mantindrà, i t'expliquem per què en recomanem l'un o l'altre."),
                    ("Podeu connectar un programa que no té integració?", "Si el programa ofereix una API, sí: desenvolupem la integració a mida. Si no en té, busquem una alternativa, com ara treballar amb les seves exportacions."),
                    ("Què passa si un flux falla?", "Cada flux registra el que fa i avisa quan alguna cosa no surt com cal, per corregir-ho com més aviat millor. Els passos sensibles porten revisió humana."),
                    ("Les dades surten de la nostra empresa?", "Només passen per les eines que acordem i es fan servir per a l'abast pactat. Quan convé, n8n es pot instal·lar en un servidor propi."),
                ]),
            ]),
            ("Parlem de les teves eines?", [
                ("p", _TANCAMENT),
                ("p", ["També et pot interessar: ", ("a", "automatització de processos", "/ca/automatitzacio-processos"), " i ", ("a", "intel·ligència artificial per a empreses", "/ca/intelligencia-artificial"), "."]),
            ]),
        ],
    },
    {
        "slug": "ca/desenvolupament-web",
        "es": "desarrollo-web",
        "id": "bqCaWebM1",
        "nombre": "Desenvolupament web a mida",
        "title": "Disseny i desenvolupament web a mida a Barcelona | Banteq",
        "descripcion": (
            "Webs corporatius a mida, redissenys i webs connectats amb el teu CRM i les teves automatitzacions. "
            "Sense plantilles. Per a empreses de Barcelona i d'arreu d'Espanya."
        ),
        "h1": "Desenvolupament web a mida",
        "subtitulo": "Webs corporatius dissenyats i desenvolupats des de zero, connectats amb el teu negoci.",
        "intro": [
            "El teu web és, moltes vegades, la primera reunió amb un client. Ha d'explicar bé el que fas, transmetre confiança i convertir visites en contactes.",
            "Dissenyem i desenvolupem cada web a mida, sense plantilles, i el connectem amb el teu correu, el teu CRM o les teves automatitzacions perquè treballi per al teu negoci.",
        ],
        "secciones": [
            ("Quin tipus de webs fem", [
                ("ul", [
                    [("b", "Webs corporatius. "), "Moderns i cuidats al detall, pensats per explicar bé el que fas."],
                    [("b", "Redisseny de webs. "), "Nova imatge, millor estructura i una experiència pensada primer per al mòbil."],
                    [("b", "Experiències interactives. "), "Animacions, 3D i recorreguts que fan que un producte s'entengui d'un cop d'ull."],
                    [("b", "Webs en diversos idiomes. "), "Amb la terminologia correcta en cadascun."],
                    [("b", "Funcionalitats pròpies. "), "Newsletter, àrees específiques o el que el teu negoci necessiti."],
                ]),
            ]),
            ("Fórmula Banteq: el teu web, renovat en contractar el manteniment", [
                ("p", FORMULA_FRASE),
                ("p", [FORMULA_NOTA + " ", ("a", "Condicions completes", "/aviso-legal"), "."]),
                ("p", ["Els exemples de quota i el que inclou són a ", ("a", "manteniment web per a empreses", "/ca/manteniment-web"), "."]),
                ("formula", "Descobreix com funciona"),
            ]),
            ("Un web connectat, no un fullet", [
                ("ul", [
                    "Formularis que desen cada sol·licitud al teu CRM",
                    "Confirmació automàtica a qui escriu",
                    "Avís al teu equip al moment",
                    "Integració amb el teu correu i amb les teves automatitzacions",
                ]),
                ("p", ["És la mateixa feina que fem a ", ("a", "automatització de processos", "/ca/automatitzacio-processos"), ", aplicada al teu web."]),
            ]),
            ("Ràpid i ben construït", [
                ("p", "Disseny adaptat a mòbil, tauleta i escriptori, bon rendiment i una base tècnica preparada per créixer amb tu. Cuidem també l'estructura i el SEO de cada pàgina, perquè els teus clients et trobin."),
            ]),
            ("Projectes reals", [
                ("p", [("b", "Margon. "), "Web corporatiu en cinc idiomes per a una empresa metal·lúrgica, amb una pàgina per sector, un recorregut interactiu per l'interior d'un tren i una secció de notícies amb newsletter. ", ("a", "Veure el projecte de Margon", "/proyectos/margon"), ]),
                ("p", [("b", "RentUp Capital. "), "Web d'onze pàgines per a una firma d'inversió immobiliària, amb formularis connectats que registren cada contacte i avisen l'equip. ", ("a", "Veure el projecte de RentUp Capital", "/proyectos/rentup-capital")]),
            ]),
            ("Preguntes freqüents", [
                ("faq", [
                    ("Treballeu amb plantilles?", "No. Cada web es dissenya i es desenvolupa per a l'empresa que l'encarrega: el seu contingut, la seva imatge i les funcions que necessita."),
                    ("Podeu redissenyar el web que ja tenim?", "Sí. Renovem webs que s'han quedat enrere: nova imatge, millor estructura i una experiència pensada primer per al mòbil."),
                    ("El web es pot connectar amb el nostre CRM o el nostre correu?", "Sí. Els formularis poden desar cada sol·licitud al teu CRM, enviar la confirmació a qui escriu i avisar el teu equip al moment, sense feina manual."),
                    ("Feu webs en diversos idiomes?", "Sí. El web que hem desenvolupat per a Margon, per exemple, està disponible en cinc idiomes, amb la terminologia tècnica correcta en cadascun."),
                ]),
            ]),
            ("Parlem del teu web?", [
                ("p", _TANCAMENT),
                ("p", ["També et pot interessar: ", ("a", "manteniment web per a empreses", "/ca/manteniment-web"), " i ", ("a", "automatització de processos", "/ca/automatitzacio-processos"), "."]),
            ]),
        ],
    },
    {
        "slug": "ca/manteniment-web",
        "es": "mantenimiento-web",
        "id": "bqCaMant1",
        "nombre": "Manteniment web per a empreses",
        "title": "Manteniment web per a empreses | Fórmula Banteq",
        "descripcion": (
            "Passa el manteniment del teu web a Banteq: el remodelem sense cost de desenvolupament bàsic i pagues "
            "un 25 % menys, fins a 50 €/mes. Quota mínima: 35 €/mes."
        ),
        "h1": "Manteniment web per a empreses",
        "subtitulo": "Amb la Fórmula Banteq, el teu web es renova en contractar el manteniment i la quota baixa respecte a la que pagues avui.",
        "intro": [
            "Moltes empreses paguen cada mes el manteniment d'un web que fa anys que no canvia. La quota continua; el web es queda enrere.",
            "La Fórmula Banteq ajunta les dues coses: en contractar amb nosaltres el manteniment, redissenyem el teu web sense cost de desenvolupament bàsic i la quota es calcula a partir de la que pagues actualment, amb descompte.",
        ],
        "secciones": [
            ("Com funciona la Fórmula Banteq", [
                ("p", FORMULA_FRASE),
                ("ul", [
                    "Ens indiques quant pagues avui pel manteniment del teu web",
                    "Revisem el teu web actual i les seves necessitats tècniques",
                    "Reps una proposta amb la quota i, per escrit, el que inclou la remodelació",
                    "Si l'acceptes, remodelem el web i passem a encarregar-nos del manteniment",
                ]),
                ("formula", "Calcular la meva quota"),
            ]),
            ("Quant pagaries", [
                ("p", "El descompte és el menor d'aquests tres imports: el 25 % de la teva quota actual, 50 € al mes o la diferència entre la teva quota i 35 €. La quota amb Banteq mai baixa de 35 € al mes. Alguns exemples, sense IVA:"),
                ("ul", [f"Si pagues {C._euros(a)} €/mes, passaries a pagar {C._euros(n)} €/mes: {C._euros(h)} € menys cada mes." for a, n, h in C.FORMULA_EJEMPLOS]),
            ]),
            ("Què inclou la remodelació gratuïta", [
                ("p", "Un web senzill, de caràcter informatiu, amb:"),
                ("ul", [
                    "Disseny modern, professional i adaptable a mòbils",
                    "Contingut bàsic de l'empresa, els seus serveis i dades de contacte",
                    "Un formulari de contacte funcional",
                    "Estructura i navegació bàsiques",
                ]),
                ("p", "Les botigues en línia, els sistemes de reserves, les integracions complexes, les animacions personalitzades i altres desenvolupaments avançats no formen part de la remodelació gratuïta: es pressuposten a part i només es fan si els acceptes."),
            ]),
            ("Condicions clares", [
                ("ul", [
                    "La quota actual s'ha de poder acreditar amb una factura o un document equivalent",
                    "La remodelació gratuïta està condicionada a contractar el manteniment amb Banteq",
                    "Abans de començar s'especifica per escrit què està inclòs i què tindria un cost addicional",
                    "No es fan càrrecs addicionals sense la teva autorització prèvia",
                ]),
                ("p", ["Les condicions completes són a l'", ("a", "avís legal", "/aviso-legal"), "."]),
            ]),
            ("Webs que hem fet", [
                ("p", ["Si vols veure com treballem, aquests són dos projectes reals: ", ("a", "el web de Margon", "/proyectos/margon"), ", en cinc idiomes, i ", ("a", "el web de RentUp Capital", "/proyectos/rentup-capital"), ", amb formularis automatitzats. I si necessites alguna cosa més que un web informatiu, mira ", ("a", "desenvolupament web a mida", "/ca/desenvolupament-web"), "."]),
            ]),
            ("Preguntes freqüents", [
                ("faq", [
                    ("Quant costa el manteniment web amb Banteq?", "Es calcula a partir del que pagues avui: un 25 % menys, amb un estalvi màxim de 50 € al mes i una quota mínima de 35 € al mes. Els imports són sense IVA."),
                    ("I si ja pago 35 € al mes o menys?", "En aquest cas no hi ha descompte: la quota mínima amb Banteq és de 35 € al mes."),
                    ("El redisseny del web és gratuït de debò?", "Sí, per a un web informatiu senzill amb disseny adaptat a mòbils, el contingut bàsic de l'empresa i un formulari de contacte. El que en sobrepassi es pressuposta a part i només es fa amb la teva acceptació."),
                    ("Què necessito per demanar la proposta?", "Saber quant pagues ara pel manteniment i poder-ho acreditar amb una factura. Amb això i una revisió del teu web actual preparem la proposta."),
                    ("Què inclou el manteniment?", "L'abast es concreta en la proposta, després de revisar el teu web actual i les seves necessitats tècniques, i queda per escrit abans de començar."),
                ]),
            ]),
            ("Parlem del teu web?", [
                ("p", _TANCAMENT),
            ]),
        ],
    },
]

# Nombre de la portada en las migas de pan de los datos estructurados.
INICIO = "Inici"
AUDIENCIA = "Pimes i petits negocis"

# ---------------------------------------------------------------------------
# Interfaz (menú, pie, formulario de contacto y ventana de la Fórmula Banteq): texto exacto en
# castellano → catalán. Los que se escriben igual (Menú, WhatsApp, Empresa, Email…) no hacen falta.
# ---------------------------------------------------------------------------
INTERFAZ_CA = {
    # Cabecera, menú y pie
    "Hablemos": "Parlem",
    "Inicio": "Inici",
    "Proyectos": "Projectes",
    "Automatización": "Automatització",
    "Inteligencia artificial": "Intel·ligència artificial",
    "n8n e integraciones": "n8n i integracions",
    "Desarrollo web": "Desenvolupament web",
    "Mantenimiento web": "Manteniment web",
    "Aviso legal": "Avís legal",
    "Privacidad": "Privacitat",
    # Formulario de contacto del pie
    "Cuéntanos qué quieres mejorar.": "Explica'ns què vols millorar.",
    "Empezamos por ahí.": "Comencem per aquí.",
    "Revisaremos tu caso y te diremos qué tiene sentido automatizar, qué herramientas conectar o cómo mejorar tu web.":
        "Revisarem el teu cas i et direm què té sentit automatitzar, quines eines connectar o com millorar el teu web.",
    "Tu nombre*": "El teu nom*",
    "¿Qué te gustaría mejorar?*": "Què t'agradaria millorar?*",
    "¿Cómo prefieres que te contactemos?": "Com prefereixes que et contactem?",
    "Recomendado": "Recomanat",
    "Correo electrónico": "Correu electrònic",
    "Recomendamos WhatsApp para una comunicación más rápida y directa.": "Recomanem WhatsApp per a una comunicació més ràpida i directa.",
    "Prefijo del país": "Prefix del país",
    "Enviar solicitud": "Enviar sol·licitud",
    "¡Gracias! Te escribimos pronto": "Gràcies! T'escriurem aviat",
    "No se ha podido enviar": "No s'ha pogut enviar",
    # Avisos del formulario
    "Escribe tu nombre.": "Escriu el teu nom.",
    "Escribe el nombre de tu empresa.": "Escriu el nom de la teva empresa.",
    "Cuéntanos qué te gustaría mejorar.": "Explica'ns què t'agradaria millorar.",
    "Escribe tu número de WhatsApp.": "Escriu el teu número de WhatsApp.",
    "Revisa el número: en España son 9 cifras (por ejemplo, 612 345 678).": "Revisa el número: a Espanya són 9 xifres (per exemple, 612 345 678).",
    "Revisa el número de teléfono (sin el prefijo del país).": "Revisa el número de telèfon (sense el prefix del país).",
    "Introduce un número de teléfono válido.": "Introdueix un número de telèfon vàlid.",
    "Escribe tu correo electrónico.": "Escriu el teu correu electrònic.",
    "Revisa el correo: parece incompleto (por ejemplo, nombre@empresa.com).": "Revisa el correu: sembla incomplet (per exemple, nom@empresa.com).",
    "Revisa los campos marcados.": "Revisa els camps marcats.",
    "Revisa el campo marcado.": "Revisa el camp marcat.",
    "Enviando tu solicitud…": "Enviant la teva sol·licitud…",
    "No hemos podido confirmar el envío. Inténtalo de nuevo.": "No hem pogut confirmar l'enviament. Torna-ho a provar.",
    "Ya hemos recibido esta solicitud. Te escribiremos pronto.": "Ja hem rebut aquesta sol·licitud. T'escriurem aviat.",
    "No hemos podido enviar tu solicitud. Inténtalo de nuevo en unos minutos.": "No hem pogut enviar la teva sol·licitud. Torna-ho a provar d'aquí a uns minuts.",
    "No hemos podido enviar tu solicitud. Revisa tu conexión e inténtalo de nuevo.": "No hem pogut enviar la teva sol·licitud. Revisa la connexió i torna-ho a provar.",
    "Envío no confirmado": "Enviament no confirmat",
    # Ventana de la Fórmula Banteq
    "Tu web, renovada.": "El teu web, renovat.",
    "Tú solo contratas su mantenimiento.": "Tu només en contractes el manteniment.",
    C.FORMULA_FRASE: FORMULA_FRASE,
    "de desarrollo en tu web informativa": "de desenvolupament al teu web informatiu",
    "menos que tu cuota actual": "menys que la teva quota actual",
    "hasta": "fins a",
    "de ahorro al mes": "d'estalvi al mes",
    "Pedir mi propuesta": "Demanar la meva proposta",
    "Nos dices cuánto pagas hoy": "Ens dius quant pagues avui",
    "por el mantenimiento de tu web.": "pel manteniment del teu web.",
    "En menos de 48 h": "En menys de 48 h",
    "te enviamos la propuesta de tu web remodelada y la oferta de mantenimiento.": "t'enviem la proposta del teu web remodelat i l'oferta de manteniment.",
    "Si te convence,": "Si et convenç,",
    "dejamos por escrito qué incluye y renovamos tu web.": "deixem per escrit què inclou i renovem el teu web.",
    C.FORMULA_NOTA: FORMULA_NOTA,
    "Condiciones completas": "Condicions completes",
    "Pide tu propuesta": "Demana la teva proposta",
    "Cuatro datos y te respondemos en menos de 48 h.": "Quatre dades i et responem en menys de 48 h.",
    "Tu web actual": "El teu web actual",
    "¿Cuánto pagas al mes por el mantenimiento de tu web? (sin IVA)": "Quant pagues al mes pel manteniment del teu web? (sense IVA)",
    "¿Por dónde te enviamos la propuesta?": "Per on t'enviem la proposta?",
    "Quiero mi propuesta": "Vull la meva proposta",
    "Usaremos estos datos solo para preparar y enviarte la propuesta.": "Farem servir aquestes dades només per preparar i enviar-te la proposta.",
    "Política de privacidad": "Política de privacitat",
    "Solicitud recibida": "Sol·licitud rebuda",
    "Cerrar": "Tancar",
    "Nombre de tu empresa": "Nom de la teva empresa",
    "tuempresa.com": "lamevaempresa.com",
    "Por ejemplo, 120": "Per exemple, 120",
    "Tu correo electrónico": "El teu correu electrònic",
    "Escribe la dirección de tu web actual.": "Escriu l'adreça del teu web actual.",
    "Revisa la dirección: por ejemplo, tuempresa.com.": "Revisa l'adreça: per exemple, lamevaempresa.com.",
    "Indica cuánto pagas al mes, aunque sea aproximado.": "Indica quant pagues al mes, encara que sigui aproximat.",
    "Escribe el importe en euros, por ejemplo 120.": "Escriu l'import en euros, per exemple 120.",
}

# Textos con datos dentro (teléfono, correo, importes): expresión regular → sustitución ($1, $2…).
REGLAS_CA = [
    (r"^Te escribiremos por WhatsApp al (.+)\.$", "T'escriurem per WhatsApp al $1."),
    (r"^Te responderemos a (.+) y te hemos enviado una confirmación\.$", "Et respondrem a $1 i t'hem enviat una confirmació."),
    (r"^Te responderemos a (.+)\.$", "Et respondrem a $1."),
    (r"^Con (.+) €/mes, tu cuota con Banteq sería de$", "Amb $1 €/mes, la teva quota amb Banteq seria de"),
    (r"^: (.+) € menos al mes\. Te la confirmamos al revisar tu mantenimiento actual\.$",
     ": $1 € menys al mes. Te la confirmem en revisar el teu manteniment actual."),
    (r"^La cuota mínima de mantenimiento con Banteq es de (.+) €/mes, así que con (.+) €/mes no habría descuento\.$",
     "La quota mínima de manteniment amb Banteq és de $1 €/mes, així que amb $2 €/mes no hi hauria descompte."),
    (r"^Te responderemos en menos de 48 h por WhatsApp al (.+) con la propuesta de tu web remodelada y la oferta de mantenimiento\. Te hemos enviado una confirmación a tu correo\.$",
     "Et respondrem en menys de 48 h per WhatsApp al $1 amb la proposta del teu web remodelat i l'oferta de manteniment. T'hem enviat una confirmació al teu correu."),
    (r"^Te responderemos en menos de 48 h por WhatsApp al (.+) con la propuesta de tu web remodelada y la oferta de mantenimiento\.$",
     "Et respondrem en menys de 48 h per WhatsApp al $1 amb la proposta del teu web remodelat i l'oferta de manteniment."),
    (r"^Te responderemos en menos de 48 h a (.+) con la propuesta de tu web remodelada y la oferta de mantenimiento\. Te hemos enviado una confirmación a tu correo\.$",
     "Et respondrem en menys de 48 h a $1 amb la proposta del teu web remodelat i l'oferta de manteniment. T'hem enviat una confirmació al teu correu."),
    (r"^Te responderemos en menos de 48 h a (.+) con la propuesta de tu web remodelada y la oferta de mantenimiento\.$",
     "Et respondrem en menys de 48 h a $1 amb la proposta del teu web remodelat i l'oferta de manteniment."),
]


# Tablas (castellano, catalán, inglés) de la home, los proyectos, las demostraciones y los avisos
# legales: tools/textos_*.py. Se funden con las de interfaz de arriba (si un texto está en las dos,
# la traducción tiene que ser la misma).
import textos_demos, textos_home, textos_legal, textos_proyectos, textos_meta  # noqa: E402

TABLAS = [textos_home.TABLA, textos_demos.TABLA, textos_proyectos.TABLA, textos_legal.TABLA, textos_meta.TABLA]


def fundir(base, columna):
    """Diccionario castellano → idioma: la base de interfaz más las tablas. Las entradas que se
    escriben igual en los dos idiomas no hacen falta (se omiten)."""
    out = dict(base)
    for tabla in TABLAS:
        for fila in tabla:
            es, nuevo = fila[0], fila[columna]
            assert out.get(es, nuevo) == nuevo, f"traducción distinta para {es[:60]!r}: {out[es]!r} / {nuevo!r}"
            out[es] = nuevo
    return {k: v for k, v in out.items() if " ".join(k.split()) != " ".join(v.split())}


TEXTOS_CA = fundir(INTERFAZ_CA, 1)
