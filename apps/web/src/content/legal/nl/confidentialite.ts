import type { LegalPage } from '../types';

export const confidentialite: LegalPage = {
  title: 'Privacybeleid — Minimoa',
  heading: 'Privacybeleid',
  description: 'Welke gegevens Minimoa gebruikt, waarvoor, op welke rechtsgrond, hoe lang, wie er toegang toe heeft en hoe je je rechten uitoefent.',
  intro: 'Wat we over je weten, waarom, wie er toegang toe heeft, hoe lang we het bewaren en hoe je alles wist.',
  summary: {
    title: 'In het kort',
    items: [
      'We gebruiken je gegevens voor één ding: je minimoa tot leven brengen en je voorstellen aan mensen die bij je passen. **Geen reclame, geen doorverkoop.**',
      'We vragen niet wat je zoekt: je minimoa legt banden, en wat ze worden is aan jullie. **We verzamelen geen gegevens over je geaardheid.**',
      'Je **locatie** wordt alleen gebruikt als de app open is, en **nooit exact opgeslagen**: we bewaren alleen een punt afgerond op ongeveer 300 m en je gebied. Op de kaart zien anderen een afgeronde en verschoven positie, nooit live, en de **discrete modus** haalt je van de kaart. Zonder locatie kies je zelf je stad.',
      'Een **externe AI**, die van {{sub.ai.provider}} ({{sub.ai.location}}), wordt op vier plekken gebruikt, [hieronder](#ia) uitgelegd: het meelezen van chats als jullie het allebei aanzetten, je bewijsfoto’s als je dat accepteert, de veiligheidscontrole van profielfoto’s en van sommige berichten, en het weekoverzicht, verstuurd zonder enige naam.',
      '**Niemand bij Minimoa leest je gesprekken**, behalve een gemeld bericht (gemeld door iemand of door ons automatische filter) en de directe context ervan, gelezen door een moderator.',
      'Je kunt alles in de app aanpassen en je [account verwijderen](@supprimer-mon-compte) wanneer je wilt. Voor de rest: {{email.privacy}}.',
    ],
  },
  toc: true,
  body: [
    { h2: '1. Wie is verantwoordelijk', id: 'responsable' },
    {
      p: 'De verwerkingsverantwoordelijke is **{{publisher.name}}**, {{publisher.legalForm}}, {{publisher.address}}, uitgever van de Minimoa-app en -website ([juridische informatie](@mentions-legales)).',
    },
    { ul: ['Voor elke vraag over je gegevens: {{email.privacy}}.', 'Functionaris voor gegevensbescherming: {{dpo.name}}.'] },
    { p: 'Dit beleid geldt voor de Minimoa-app en de website minimoa.app. Voor de cookies van de website, zie de [cookiepagina](@cookies).' },

    { h2: '2. Wat we gebruiken, en waarom', id: 'donnees' },
    {
      p: 'Per gebruik: de betrokken gegevens, het doel, de rechtsgrond (wat ons volgens de AVG toestaat het te doen), de bewaartermijn en wie er toegang toe heeft. De termijnen staan samengevat in de [tabel met bewaartermijnen](#durees).',
    },

    { h3: 'Je account' },
    {
      ul: [
        '**Gegevens:** de identificatie die Apple of Google ons stuurt als je inlogt, en het bijbehorende e-mailadres. Bij Apple kan dat een doorstuuradres zijn dat je echte adres verbergt. Bij Apple bewaren we ook een inlogtoken van Apple, dat alleen dient om de toegang van Minimoa tot je Apple ID in te trekken als je je account verwijdert.',
        '**Doel:** je account aanmaken, je opnieuw laten inloggen, de toegang beveiligen en je mailen over je account (welkom, nieuwe band, herinnering aan het einde van de proefperiode, waarschuwing van de moderatie, bericht vóór verwijdering wegens inactiviteit).',
        '**Rechtsgrond:** uitvoering van de overeenkomst.',
        '**Bewaartermijn:** zolang je account bestaat. Bij verwijdering wordt het Apple-token eerst bij Apple ingetrokken en daarna gewist. Een account zonder inlog gedurende 2 jaar wordt verwijderd, na een waarschuwingsmail 30 dagen vooraf.',
        '**Toegang:** het bevoegde Minimoa-team, onze authenticatieprovider en onze e-mailprovider. Apple of Google weten dat je Minimoa gebruikt, omdat het inloggen via hen loopt.',
      ],
    },

    { h3: 'Je voornaam en geboortedatum' },
    {
      ul: [
        '**Gegevens:** de voornaam (of bijnaam) die je kiest; je geboortedatum.',
        '**Doel:** je voornaam stelt je voor aan anderen. Hij gaat door ons automatische filter voordat hij wordt opgeslagen (zie [moderatie](#signalements)). Je geboortedatum controleert dat je 18 jaar of ouder bent, en dient voor het leeftijdsfilter bij ontmoetingen.',
        '**Rechtsgrond:** uitvoering van de overeenkomst; voor de leeftijd en het filter ook ons gerechtvaardigd belang om minderjarigen en de community te beschermen.',
        '**Bewaartermijn:** zolang je account bestaat. Ben je jonger dan 18, dan stopt de aanmelding vóór het inloggen en wordt er niets opgeslagen.',
        '**Toegang:** je voornaam is zichtbaar voor de mensen aan wie je minimoa je voorstelt en voor je banden. Je geboortedatum wordt niet aan anderen getoond.',
      ],
    },

    { h3: 'Je profielfoto', id: 'photo-profil' },
    {
      ul: [
        '**Gegevens:** de foto die je kiest, als je er een toevoegt (dat is optioneel), gemaakt met de camera of gekozen uit je galerij.',
        '**Doel:** je laten zien aan je banden: in een band blijft hij verborgen tot niveau 4, wazig op niveau 4 en scherp vanaf niveau 5.',
        '**Veiligheidscontrole:** voordat de foto wordt gepubliceerd, wordt hij verkleind en naar onze AI-provider {{sub.ai.provider}} gestuurd, die controleert dat er geen naaktheid, niemand die minderjarig lijkt, geen geweld, geen haat en geen reclame op staat. Dat zeggen we je in de app voordat je de foto kiest. Een afgekeurde foto wordt direct gewist, en het moderatieteam krijgt een automatische melding, zonder de foto. Is de controle op dat moment niet mogelijk, dan wordt de foto gepubliceerd en iets later gecontroleerd. Deze controle kan niet worden uitgezet: ze beschermt iedereen. Zonder profielfoto wordt er niets verstuurd.',
        '**Rechtsgrond:** uitvoering van de overeenkomst om hem te tonen; ons gerechtvaardigd belang en onze veiligheidsverplichtingen (gepubliceerde inhoud filteren) voor de controle.',
        '**Bewaartermijn:** zolang je hem houdt. Als je hem vervangt, wordt de oude gewist. Hij wordt gewist als je je account verwijdert.',
        '**Toegang:** je banden, afhankelijk van het niveau van de band; onze AI-provider, tijdens de controle.',
      ],
    },

    { h3: 'Je geslacht', id: 'sexe' },
    {
      ul: [
        '**Gegevens:** je geslacht (vrouw, man, non-binair of “zeg ik liever niet”).',
        '**Doel:** de teksten van de app goed formuleren, en statistieken zonder namen. **Het wordt niet gebruikt om te kiezen aan wie je minimoa je voorstelt.**',
        '**Rechtsgrond:** ons gerechtvaardigd belang. “Zeg ik liever niet” kan altijd, en je kunt je antwoord in de app wijzigen (**Ik → Instellingen → Wie je bent**).',
        '**Bewaartermijn:** zolang je account bestaat.',
        '**Toegang:** alleen jij. Het wordt nooit aan anderen getoond.',
        'We vragen niet wat je zoekt of wie je wilt ontmoeten: je minimoa legt banden, en wat ze worden is aan jullie. Antwoorden op die vragen van vóór 17 november 2026, en de toestemming die erbij hoorde, zijn gewist.',
      ],
    },

    { h3: 'Je locatie', id: 'localisation' },
    {
      ul: [
        '**Gegevens:** je positie, **alleen als de app open is** (nooit op de achtergrond). **Ze wordt nooit als zodanig opgeslagen**: onze server bewaart alleen het midden van het vak van ongeveer 300 m waarin je je bevindt, en je geschatte woongebied dat daaruit wordt afgeleid (zelfde nauwkeurigheid). De exacte positie dient alleen, tijdens het verzoek, om te weten of je buiten je woongebied bent.',
        '**Zonder locatie:** je kunt zelf je stad kiezen (gratis; eens per 30 dagen, of wanneer je wilt met Minimoa+). We bewaren dan alleen de gekozen stad en het midden ervan, die als gebied dienen.',
        '**Doel:** je de kaart tonen en de passende minimoa’s om je heen; je ontmoetingen in de buurt voorstellen; bevestigen dat een uitje echt buiten je woongebied plaatsvond, om de sociabiliteit van je minimoa te verhogen.',
        '**Wat anderen zien:** nooit je exacte positie. Ze zien een positie afgerond op ongeveer 300 m en verschoven, nooit live. De **discrete modus** haalt je helemaal van de kaart.',
        '**Rechtsgrond:** je toestemming, gegeven via de locatietoestemming van je telefoon of door je stad te kiezen. Je kunt die altijd intrekken: in de instellingen van je telefoon, of in de app (**Ik → Instellingen → Mijn locatie → Mijn locatie vergeten**), waarmee je positie en je gebied worden gewist.',
        '**Bewaartermijn:** het laatste afgeronde punt en je gebied (of de gekozen stad), vervangen bij elke update. We bewaren geen geschiedenis van je verplaatsingen.',
        '**Toegang:** het bevoegde Minimoa-team, onze hostingprovider en de leverancier van de kaartondergrond, die vanaf je telefoon het gebied ontvangt dat op het scherm staat.',
      ],
    },

    { h3: 'Je kijk en de compatibiliteit' },
    {
      ul: [
        '**Gegevens:** je antwoorden op de kijk-test (12 situaties), je antwoorden op de vragen van de dag, de gewoontes die je kiest en de gewoontes die je volhoudt, de manier waarop je voor je minimoa zorgt (regelmaat, tijdstippen, uitstapjes), en de 3 woorden die je vrienden voor je kiezen. Daaruit leiden we je “kijk” af op 5 assen, met een betrouwbaarheidsindex, en een “stijl” (sociaal, speels, teder, kletserig).',
        '**Doel:** de compatibiliteit met andere mensen berekenen en je voorstellen aan wie bij je past; elke ontmoeting uitleggen; je minimoa een karakter geven. Dit is **profilering**, [hieronder](#compatibilite) uitgebreid uitgelegd.',
        '**Rechtsgrond:** uitvoering van de overeenkomst (het is de kern van de dienst).',
        '**Bewaartermijn:** zolang je account bestaat.',
        '**Toegang:** het algoritme voor ontmoetingen. Iemand aan wie je wordt voorgesteld, ziet wat jullie gemeen hebben en één verschil, nooit je antwoorden of een los cijfer.',
      ],
    },
    { p: 'We vragen nooit naar je religie, je politieke opvattingen of je gezondheid.' },

    { h3: 'Je minimoa, je gewoontes en je reeks' },
    {
      ul: [
        '**Gegevens:** de naam en het uiterlijk van je minimoa, zijn meters (sociabiliteit, honger, energie, humeur), de handelingen die je doet, je gewoontes en hun ritme, je reeks, je jokers, je voorwerpen, je uitdagingen van de dag, je weekoverzicht. De naam van de minimoa gaat door ons automatische filter, net als je voornaam.',
        '**Doel:** het spel laten werken.',
        '**Rechtsgrond:** uitvoering van de overeenkomst.',
        '**Bewaartermijn:** zolang je account bestaat.',
        '**Toegang:** jij; je banden en de mensen aan wie je wordt voorgesteld zien je minimoa en zijn stijl.',
      ],
    },

    { h3: 'Bewijs- en uitdagingsfoto’s', id: 'preuves' },
    {
      ul: [
        '**Gegevens:** de foto die je in de app maakt als je minimoa om bewijs van een gewoonte vraagt (je sneakers, bijvoorbeeld), of voor een foto-uitdaging van de dag. Hij wordt met de camera gemaakt, niet uit je galerij gekozen.',
        '**Doel:** controleren dat een gewoonte is volgehouden; een uitdaging als gehaald tellen.',
        '**Controle door een AI, alleen als je dat accepteert:** vóór je eerste bewijs vertelt de app je wat er wordt verstuurd, naar wie en waarom, en jij kiest. Accepteer je, dan wordt elke bewijsfoto verkleind en met de naam van de gewoonte (niet je voornaam, niet je locatie) naar {{sub.ai.provider}} gestuurd, die ja, nee of “weet niet zeker” antwoordt, met een zin; bij “weet niet zeker” vertrouwen we je. Weiger je, dan **gaat er geen enkele foto naar een AI**: je bevestigt de gewoonte op je woord, zonder foto, en je reeks gaat net zo goed door. Je kunt altijd van gedachten veranderen via **Ik → De AI en jij**. Foto’s van uitdagingen worden nooit naar een AI gestuurd.',
        '**Rechtsgrond:** je toestemming, voor de controle door de AI; uitvoering van de overeenkomst, voor de tijdelijke opslag.',
        '**Bewaartermijn:** **binnen 24 uur uit onze opslag gewist**, tenzij je ervoor kiest hem in je privéherinneringen te bewaren (daar blijft hij tot je hem niet meer bewaart of je account verwijdert).',
        '**Toegang:** **geen mens ziet hem**, niet bij Minimoa en nergens anders op Minimoa. Alleen {{sub.ai.provider}} ontvangt een bewijsfoto, verkleind, als je dat hebt geaccepteerd.',
      ],
    },
    { p: 'Fotografeer liever geen andere mensen, documenten of gevoelige informatie.' },

    { h3: 'Je berichten, en het lezen ervan door een AI als jullie dat aanzetten', id: 'messages' },
    {
      ul: [
        '**Gegevens:** de berichten die je in je banden uitwisselt, hun datum en wat er gelezen is.',
        '**Doel:** ze aan de andere persoon doorgeven en ze in jullie gesprek bewaren.',
        '**Automatisch filter:** voordat een bericht wordt verstuurd, gaat het door ons filter, op onze servers (woordenlijsten in meerdere talen, zonder AI). Een duidelijke overtreding (bedreiging, haat, seksuele inhoud met een minderjarige, betaalde seks, oplichting) wordt niet verstuurd: we vertellen je waarom, je tekst blijft in het veld staan, en het moderatieteam krijgt een automatische melding met een kort fragment. Een grensgeval (belediging, expliciete seksuele inhoud) wordt wel verstuurd, maar gemeld aan het moderatieteam, en je minimoa stelt een pauze voor.',
        '**Rechtsgrond:** uitvoering van de overeenkomst; voor het filter ons gerechtvaardigd belang en onze veiligheidsverplichtingen.',
        '**Bewaartermijn:** zolang de band bestaat, dus zolang jullie beide accounts bestaan. Een band verlaten haalt hem uit jullie beider lijsten zonder het gesprek te wissen: het komt terug als jullie elkaar weer vinden. Als een van jullie zijn account verwijdert, worden de band en de berichten voor allebei gewist.',
        '**Toegang:** jij en de andere persoon. Een moderator kan een **gemeld** bericht lezen, gemeld door een van jullie of door het filter, met de directe context ervan (zie [meldingen](#signalements)).',
      ],
    },
    {
      note: 'De zin die de app jullie toont voordat jullie om toestemming wordt gevraagd: “Niemand bij Minimoa leest je gesprekken, behalve een gemeld bericht en de paar berichten eromheen, voor de moderatie. Als jullie het allebei aanzetten, leest een AI jullie laatste berichten zodat jullie minimoa’s erop kunnen reageren. Deze AI wordt geleverd door {{sub.ai.provider}} ({{sub.ai.location}}), onze dienstverlener, die deze berichten namens ons ontvangt. Je kunt je toestemming intrekken wanneer je wilt.”',
    },
    {
      ul: [
        '**Toestemming van elk:** we vragen het jullie allebei, de eerste keer dat jullie de chat openen (of één keer voor al je chats, als je een standaardinstelling kiest). Heeft een van jullie geen ja gezegd, dan leest de AI niets: de minimoa’s reageren dan alleen op het ritme van de band (stiltes, reeksen, uitdagingen), met kant-en-klare zinnen.',
        '**Intrekken:** wanneer je wilt, in de opties van de band, of voor al je chats via **Ik → De AI en jij**. Het meelezen stopt direct.',
        '**Hoe:** geen analyse van elk bericht. Als iets het in gang zet (een stilte, een bepaald aantal berichten, een oplopende toon), wordt een kort venster met de laatste berichten naar {{sub.ai.provider}} gestuurd, met de afzenders gemarkeerd als A en B, zonder jullie voornamen; de AI stelt de reactie van de minimoa voor. Maximaal 3 tussenkomsten per dag per band, en je kunt ze per band uitzetten. Loopt de toon op, dan kan je minimoa je een pauze voorstellen: dat bericht is alleen voor jou zichtbaar.',
        '**Veiligheidscontrole:** in een chat waarin jullie allebei het meelezen hebben geaccepteerd, kan een bericht waarover ons filter twijfelt (een link, bijvoorbeeld) ook apart naar {{sub.ai.provider}} worden gestuurd, na verzending, om te controleren of het de regels respecteert. Zo niet, dan wordt het gemeld aan het moderatieteam.',
        '**Wat er wordt bewaard:** bij Minimoa niets van het verstuurde venster of van de analyse; alleen de reactie van de minimoa verschijnt in de chat, als bericht. Wat {{sub.ai.provider}} aan zijn kant bewaart, en hoe lang: {{ai.retention}}.',
        '**Rechtsgrond:** de toestemming van ieder van jullie.',
      ],
    },

    { h3: 'De reeks en de mijlpalen van een band' },
    {
      ul: [
        '**Gegevens:** de dagen waarop ieder van jullie in de band schreef (niet de inhoud van de berichten) en de mijlpalen van de band (ontmoeting, bereikte niveaus, reeksrecords). Voor banden van vóór 15 november 2026 de “foto’s van de dag” die jullie elkaar daar stuurden: Minimoa ontvangt er geen nieuwe meer, en de oude blijven in de herinneringen van de band.',
        '**Doel:** de reeks van de band laten leven (de dagen achter elkaar dat jullie allebei schrijven), de levens en de niveaus, en jullie je herinneringen laten zien.',
        '**Rechtsgrond:** uitvoering van de overeenkomst.',
        '**Bewaartermijn:** zolang de band bestaat (zelfde regels als de berichten): de oude foto’s van de dag worden gewist als de band wordt gewist, of als een van jullie zijn account verwijdert.',
        '**Toegang:** jij en de andere persoon in de band (diens oude foto’s blijven voor jou wazig tot niveau 5). Foto’s worden in een privéruimte opgeslagen, alleen bereikbaar via tijdelijke links.',
      ],
    },

    { h3: 'Meldingen en e-mails' },
    {
      ul: [
        '**Gegevens:** het technische meldingstoken van je telefoon, je instellingen per type melding, het gekozen tijdstip voor de uitdaging van de dag; op iPhone de tokens van live-activiteiten.',
        '**Doel:** je op de hoogte brengen (uitdaging van de dag, nieuwe ontmoeting, bericht, “jij bent aan de beurt om te schrijven” ’s avonds, band of reeks in gevaar, gevraagd bewijs, weekoverzicht, herinnering aan het einde van de proefperiode; eerste stappen in de eerste 7 dagen, nieuws van je minimoa als je weg bent en op jullie verjaardagen, berichten over je Minimoa+-abonnement). Stille uren van 22 tot 8 uur; buiten berichten maximaal 3 per dag. De herinnering aan het einde van de proefperiode en de e-mails over je abonnement (welkom, mislukte betaling, einde) worden ook per e-mail verstuurd, ook als meldingen uit staan. De e-mail na 14 dagen afwezigheid en de enige herinnering een maand na het einde van Minimoa+ zet je uit met dezelfde instelling als de melding (“Nieuws van je minimoa”, “Je Minimoa+-abonnement”). Op iPhone gebruiken de widget en live-activiteiten dezelfde gegevens; een live-activiteit op het vergrendelscherm toont nooit iemands voornaam.',
        '**Rechtsgrond:** je toestemming voor meldingen, gegeven via de toestemming van je telefoon (je trekt die in via de instellingen van je telefoon of per type in de app); uitvoering van de overeenkomst voor e-mails over je account en je abonnement; gerechtvaardigd belang voor de afwezigheidsmail en de herinnering na het einde van Minimoa+ (je maakt bezwaar door de instelling uit te zetten).',
        '**Bewaartermijn:** tot je meldingen uitzet of je account verwijdert. De lijst van al verstuurde berichten (alleen het type en de datum, zodat hetzelfde bericht nooit twee keer gaat) wordt maximaal 400 dagen bewaard.',
        '**Toegang:** onze dienstverleners voor het versturen van meldingen en e-mails, en Apple of Google, die de meldingen naar je telefoon brengen.',
      ],
    },

    { h3: 'Minimoa+-aankopen' },
    {
      ul: [
        '**Gegevens:** het gekozen abonnement, de data van aankoop, proefperiode en verlenging, de status van het abonnement, de transactie-ID. **We ontvangen nooit je betaalgegevens**: Apple brengt het je in rekening.',
        '**Doel:** de Minimoa+-functies openen, de aankoop bij Apple controleren, de proefperiode en de herinnering beheren.',
        '**Rechtsgrond:** uitvoering van de overeenkomst; boekhoudkundige verplichtingen voor de transactiereferenties.',
        '**Bewaartermijn:** de status zolang je account bestaat; de transactiereferenties, losgekoppeld van je account als het wordt verwijderd, tot 10 jaar (boekhoudkundige verplichtingen).',
        '**Toegang:** het bevoegde Minimoa-team; Apple, volgens zijn eigen beleid.',
      ],
    },

    { h3: 'Filtering, meldingen van misbruik, blokkades en moderatie', id: 'signalements' },
    {
      ul: [
        '**Gegevens:** wie meldt, wie wordt gemeld, de betrokken band, de reden, de toelichting; het **gemelde bericht en de directe context ervan**; de automatische meldingen van ons filter (geweigerde voornaam of minimoa-naam, niet-verstuurd bericht met een fragment van maximaal 280 tekens, grensgeval, afgekeurde profielfoto, zonder de foto); blokkades; moderatiebeslissingen en het actielogboek.',
        '**Automatische filtering:** voornamen, minimoa-namen, berichten en profielfoto’s worden gefilterd voordat ze worden gepubliceerd (zie hierboven). Een geweigerde naam wordt niet opgeslagen, en de app vertelt je waarom.',
        '**Doel:** mensen beschermen, meldingen behandelen, de [regels](@regles) handhaven, autoriteiten antwoorden, voorkomen dat een geblokkeerde persoon contact met je opneemt. Het moderatieteam krijgt van elke nieuwe melding een e-mail: meteen bij een dringende melding (minderjarige, bedreiging), anders in een overzicht. Doel: behandeling binnen 24 uur; daarna komt de melding bovenaan de wachtrij.',
        '**Automatische schorsing, in slechts twee gevallen:** een bericht met expliciete pedoseksuele woordenschat, of een account dat door twee verschillende mensen als minderjarig is gemeld. Het account wordt dan maximaal 72 uur geschorst, terwijl een moderator ernaar kijkt; die heft de schorsing op of bevestigt ze. Buiten deze twee gevallen en de weigeringen van het filter wordt geen sanctie genomen zonder een mens.',
        '**Bezwaar maken:** je kunt tegen elke beslissing over jou, automatisch of niet, bezwaar maken door te mailen naar {{email.support}} (in de app heeft het scherm van een geschorst account daar een knop voor). Een mens bekijkt de beslissing opnieuw.',
        '**Rechtsgrond:** onze wettelijke verplichtingen (met name de digitaledienstenverordening) en ons gerechtvaardigd belang om de community veilig te houden.',
        '**Bewaartermijn:** zie de [tabel met bewaartermijnen](#durees). Als je je account verwijdert, blijven de meldingen over jou en het logboek van beslissingen bestaan tot ze worden gewist, zonder koppeling aan een account (het logboek bewaart de betrokken voornaam).',
        '**Toegang:** de bevoegde moderators van Minimoa, en de autoriteiten als de wet dat vereist. De gemelde persoon weet niet wie hem heeft gemeld. Een geblokkeerde persoon krijgt geen bericht.',
      ],
    },

    { h3: 'Statistieken en beheer' },
    {
      ul: [
        '**Gegevens:** cijfers berekend uit de activiteit: aantal accounts, actieve accounts, retentie, abonnees en proefperiodes, reeksen, berichten van minimoa’s, voorgestelde en geaccepteerde ontmoetingen, AI-kosten. Om ze te berekenen noteren we de dagen waarop je de app opent, en de ontmoetingen die aan iedereen worden voorgesteld.',
        '**Doel:** Minimoa sturen en verbeteren, de kosten beheersen.',
        '**Rechtsgrond:** ons gerechtvaardigd belang.',
        '**Hoe:** deze statistieken worden berekend uit onze eigen database, in een interne tool die voorbehouden is aan enkele bevoegde mensen. Er is geen tool voor bezoekersmetingen of reclame in de app. De interne tool geeft geen toegang tot gesprekken, behalve tot het gemelde bericht en de directe context ervan.',
        '**Bewaartermijn:** activiteitsdagen, 40 dagen; voorgestelde ontmoetingen, 30 dagen; teller van AI-gebruik per persoon, 2 dagen; interne ranglijst van de actiefste minimoa’s (voornaam en minimoa), 40 dagen. Geaggregeerde cijfers, waarmee je niet te identificeren bent, worden onbeperkt bewaard.',
      ],
    },

    { h3: 'Technische gegevens' },
    {
      ul: [
        '**Gegevens:** IP-adres, model en systeem van het apparaat, app-versie, taal, fout- en verbindingslogboeken.',
        '**Doel:** de dienst laten draaien, beveiligen, misbruik beperken, bugs oplossen.',
        '**Rechtsgrond:** ons gerechtvaardigd belang.',
        '**Bewaartermijn:** zie de [tabel met bewaartermijnen](#durees).',
        '**Toegang:** het bevoegde technische team en onze hostingproviders.',
      ],
    },

    { h3: '“3 woorden” en uitnodigingen (mensen zonder account)' },
    {
      ul: [
        '**Gegevens:** als iemand je “3 woorden”-pagina of je uitnodiging op de website opent, tonen we je voornaam en je minimoa. Voor de stemmen slaan we de gekozen woorden op en een niet-omkeerbare vingerafdruk van het IP-adres en de browser, om dubbele stemmen te beperken. Er is geen account nodig.',
        '**Rechtsgrond:** uitvoering van de overeenkomst voor jou; ons gerechtvaardigd belang om misbruik te voorkomen, voor de vingerafdruk.',
        '**Bewaartermijn:** zolang je account bestaat.',
        '**Toegang:** jij ziet de woorden, nooit wie ze koos.',
      ],
    },

    { h3: 'Als je ons schrijft' },
    {
      ul: [
        '**Gegevens:** je e-mailadres, je bericht en wat nodig is om je verzoek te behandelen.',
        '**Rechtsgrond:** uitvoering van de overeenkomst of ons gerechtvaardigd belang om je te antwoorden; wettelijke verplichting voor verzoeken om je rechten uit te oefenen.',
        '**Bewaartermijn:** zie de [tabel met bewaartermijnen](#durees).',
      ],
    },

    { h2: '3. Hoe de compatibiliteit werkt', id: 'compatibilite' },
    { p: 'Je minimoa stelt je alleen voor aan mensen van wie de kijk op het leven dezelfde kant op gaat als die van jou. Dit is de logica, zonder geheimen:' },
    {
      ol: [
        '**Je kijk** wordt geplaatst op 5 assen: thuis (vrij, alleen ↔ een gezin stichten), wortels (hier blijven ↔ vertrekken), drive (tijd voor jezelf ↔ grote projecten), ritme (rustig, thuis ↔ intens, buiten), koers (van dag tot dag ↔ alles plannen). Elke as heeft een betrouwbaarheidsindex.',
        '**Waar hij vandaan komt**, met startgewichten: test bij aanmelding 40% (daarna steeds minder), vraag van de dag 20%, gewoontes 25%, hoe je voor je minimoa zorgt 10%, de 3 woorden van je vrienden 5%. Hoe meer je Minimoa gebruikt, hoe hoger de betrouwbaarheid.',
        '**De filters**: 18 jaar en ouder; het gebied; geblokkeerde mensen. Jouw geslacht en dat van anderen filteren niet wie je wordt voorgesteld.',
        '**De score**: de nabijheid op de 5 assen, gewogen naar betrouwbaarheid. De as thuis telt minder dan de andere. De stijl (sociaal, speels, teder, kletserig) telt niet mee in de score.',
        '**De drempel**: onder 70% wordt niemand voorgesteld, ook al betekent dat minder mensen tonen.',
        '**De uitleg**: elke ontmoeting zegt waarom, met 3 overeenkomsten en 1 verschil om te ontdekken. Nooit een los cijfer.',
        '**Het aantal ontmoetingen** hangt ook af van de conditie van je minimoa (hoe beter je voor hem zorgt, hoe meer mensen hij je voorstelt) en van je abonnement.',
      ],
    },
    { p: 'Je kijk is indicatief: het is “je kijk, voor nu”. Het is geen diagnose, en we gebruiken geen medische of psychologische woorden.' },
    {
      p: '**Geen enkel besluit met rechtsgevolgen** voor jou, of dat je in vergelijkbare mate treft, wordt door deze berekening genomen. Ze bepaalt alleen aan wie je minimoa je voorstelt; jij kiest altijd of je zwaait, accepteert of negeert. Je kunt ons om uitleg vragen, een resultaat betwisten of bezwaar maken tegen deze verwerking door te mailen naar {{email.privacy}}; in dat laatste geval kunnen we je niemand meer voorstellen.',
    },

    { h2: '4. Kunstmatige intelligentie', id: 'ia' },
    {
      p: 'Minimoa gebruikt de AI van **{{sub.ai.provider}}** ({{sub.ai.location}}), een externe dienstverlener, op vier plekken en nergens anders. Alles is te zien, en wat ingetrokken kan worden, trek je in, in de app: **Ik → De AI en jij**.',
    },
    {
      table: {
        head: ['Gebruik', 'Wanneer', 'Wat de dienstverlener ontvangt', 'Wat Minimoa bewaart'],
        rows: [
          [
            'Meelezen van chats',
            'Alleen als jullie het allebei hebben aangezet; altijd in te trekken',
            'Een kort venster met de laatste berichten van de band, afzenders gemarkeerd als A en B, zonder jullie voornamen',
            'Niets van het venster of de analyse. Alleen de reactie van de minimoa verschijnt in de chat.',
          ],
          [
            'Bewijsfoto’s van gewoontes',
            'Alleen als je dat hebt geaccepteerd, één keer, vóór je eerste bewijs; in te trekken. Zonder toestemming: bevestiging op je woord, zonder foto',
            'De verkleinde foto en de naam van de gewoonte',
            'Het antwoord (ja, nee, weet niet zeker). De foto wordt binnen 24 uur gewist, tenzij je hem bewaart.',
          ],
          [
            'Veiligheidscontroles',
            'Elke profielfoto, vóór publicatie (kan niet worden uitgezet); een bericht waarover het filter twijfelt, alleen in een chat waarin jullie allebei het meelezen hebben geaccepteerd',
            'De verkleinde profielfoto; of dat ene bericht',
            'De beslissing (goedgekeurd, of afgekeurd en gemeld aan de moderatie). Een afgekeurde foto wordt gewist.',
          ],
          [
            'Weekoverzicht',
            'In actieve weken, om je overzicht te herformuleren',
            'Een tekst met cijfers en algemene zinnen, zonder enige voornaam of naam (niet de jouwe, niet die van je banden, niet die van je minimoa): niets waarmee je te identificeren bent',
            'De tekst van het overzicht, in de app.',
          ],
        ],
      },
    },
    {
      p: 'We sturen de AI-provider nooit je e-mailadres, je geboortedatum, je locatie of de identificatie van je account. Hij treedt op als verwerker: hij verwerkt deze gegevens alleen voor ons, volgens onze instructies, en niet voor eigen doeleinden. Wat hij aan zijn kant bewaart, en hoe lang: {{ai.retention}}. Foto’s van de uitdaging van de dag worden nooit naar een AI gestuurd. Zonder toestemming voor het meelezen van chats praten de minimoa’s met kant-en-klare zinnen, zonder AI.',
    },
    {
      p: 'Antwoorden van de AI kunnen fout zijn: ze hebben geen rechtsgevolgen. Bij twijfel over een bewijs vertrouwen we je; een ten onrechte afgekeurde profielfoto kun je melden aan {{email.support}}.',
    },

    { h2: '5. Wat anderen zien', id: 'visibilite' },
    {
      ul: [
        '**Mensen aan wie je minimoa je voorstelt** zien je voornaam, je minimoa, zijn stijl, wat jullie gemeen hebben en één verschil, en je geschatte positie op de kaart (behalve in de discrete modus).',
        '**Je banden** zien daarnaast jullie berichten, jullie reeks, de mijlpalen van jullie band, jullie oude foto’s van de dag als die er zijn, en je profielfoto als je er een hebt (verborgen tot niveau 4, wazig op niveau 4, scherp vanaf niveau 5).',
        '**Bezoekers van je “3 woorden”-pagina of je uitnodiging** zien je voornaam en je minimoa.',
        'Niemand ziet je e-mailadres, je geboortedatum, je geslacht, of je antwoorden op de kijk-test. Je exacte positie wordt nergens opgeslagen. Je bewijsfoto’s worden door geen mens gezien, en binnen 24 uur gewist (tenzij je ze in je privéherinneringen bewaart).',
      ],
    },

    { h2: '6. Onze dienstverleners', id: 'prestataires' },
    { p: 'Deze verwerkers verwerken gegevens namens ons, volgens onze instructies, met een overeenkomst die voldoet aan artikel 28 van de AVG:' },
    {
      subprocessors: {
        head: ['Rol', 'Dienstverlener', 'Plaats van verwerking', 'Waarborg buiten de EU'],
        roles: {
          database: 'Database, authenticatie en opslag van foto’s',
          api: 'Hosting van de server van de app (API)',
          ai: 'AI: meelezen van chats als jullie het allebei aanzetten, bewijsfoto’s als je dat accepteert, veiligheidscontrole van profielfoto’s en van sommige berichten, weekoverzicht (zonder namen)',
          email: 'Versturen van e-mails (account, herinnering aan het einde van de proefperiode, moderatiewaarschuwingen)',
          push: 'Versturen van meldingen',
          maps: 'Kaartondergrond',
          site: 'Hosting van de website minimoa.app',
        },
      },
    },
    {
      p: '**Apple en Google** zijn ook betrokken, voor eigen rekening en volgens hun eigen beleid: inloggen (Sign in with Apple, Google), distributie van de app (App Store, Google Play), betaling van Minimoa+ (App Store) en bezorging van meldingen.',
    },
    { p: 'Ten slotte kunnen we verplicht zijn gegevens aan de autoriteiten te verstrekken, als de wet dat vereist.' },

    { h2: '7. Doorgifte buiten de Europese Unie', id: 'transferts' },
    {
      p: 'We geven de voorkeur aan dienstverleners die gegevens in de Europese Unie verwerken. Als een dienstverlener gegevens buiten de EU verwerkt (de tabel hierboven vermeldt dat, bijvoorbeeld voor onze AI-provider), valt de doorgifte onder de waarborg die in de tabel staat: een adequaatheidsbesluit van de Europese Commissie (bijvoorbeeld het EU-VS-kader voor gegevensbescherming, voor gecertificeerde bedrijven) of de modelcontractbepalingen van de Commissie. Je kunt een kopie krijgen door te mailen naar {{email.privacy}}.',
    },

    { h2: '8. Hoe lang we je gegevens bewaren', id: 'durees' },
    {
      table: {
        head: ['Gegevens', 'Bewaartermijn'],
        rows: [
          ['Account, profiel, kijk, minimoa, gewoontes, instellingen', 'Zolang je account bestaat. Gewist zodra je het verwijdert.'],
          ['Inactief account', 'Verwijderd na 2 jaar zonder inlog, na een waarschuwingsmail 30 dagen vooraf.'],
          ['Apple-inlogtoken', 'Zolang je account bestaat. Bij Apple ingetrokken en daarna gewist als je het verwijdert.'],
          ['Locatie', 'Alleen het laatste afgeronde punt (ongeveer 300 m) en je gebied, of de gekozen stad, vervangen bij elke update. Gewist als je je locatie laat vergeten.'],
          ['Profielfoto', 'Zolang je hem houdt. De oude wordt gewist als je hem vervangt; een door de controle afgekeurde foto wordt direct gewist.'],
          ['Bewijs- en uitdagingsfoto’s', 'Binnen 24 uur, tenzij je ze in je privéherinneringen bewaart (tot je ze niet meer bewaart of je account verwijdert).'],
          ['Wat naar de AI wordt gestuurd', 'Minimoa bewaart niets, behalve het antwoord (reactie van de minimoa, oordeel over een bewijs, veiligheidsbeslissing, tekst van het overzicht). Bij de dienstverlener: {{ai.retention}}.'],
          ['Berichten, reeks, mijlpalen en oude foto’s van de dag van een band', 'Zolang de band bestaat, dus tot een van jullie zijn account verwijdert.'],
          ['Aankopen', 'Status zolang het account bestaat; transactiereferenties tot 10 jaar (boekhoudkundige verplichtingen), losgekoppeld van het account als het wordt verwijderd.'],
          ['Behandelde meldingen en moderatiebeslissingen', '1 jaar na het sluiten van het dossier, alleen langer als de wet dat vereist.'],
          ['Definitieve uitsluiting', 'Een niet-omkeerbare vingerafdruk van de Apple- of Google-identificatie van het account, gedurende 3 jaar, om een nieuwe aanmelding te voorkomen.'],
          ['Statistieken', 'Activiteitsdagen en interne ranglijst met namen: 40 dagen. Voorgestelde ontmoetingen: 30 dagen. Geaggregeerde cijfers, waarmee je niet te identificeren bent: onbeperkt.'],
          ['Technische logboeken van de app', 'Maximaal 30 dagen. De logboeken van onze hostingproviders volgen hun eigen termijnen.'],
          ['Contact met de klantenservice', '1 jaar na het sluiten van het verzoek.'],
          ['Verzoeken om je rechten uit te oefenen', '5 jaar, zodat we kunnen aantonen dat we hebben geantwoord.'],
          ['Back-ups', 'Overschreven naarmate ze roteren bij onze gegevenshost: {{dataHost.backupRetention}}.'],
        ],
      },
    },

    { h2: '9. Je rechten', id: 'droits' },
    { p: 'Volgens de AVG en de Franse wet op gegevensbescherming kun je op elk moment:' },
    {
      ul: [
        '**inzage** krijgen in je gegevens en een kopie ontvangen;',
        'ze laten **corrigeren** (veel ervan pas je direct in de app aan);',
        'ze laten **wissen** ([je account verwijderen](@supprimer-mon-compte) doet dat in één keer);',
        'je **toestemming intrekken** als die de basis is voor een verwerking (locatie, controle van bewijsfoto’s door de AI, meelezen van berichten door de AI, meldingen), zonder dat dit afdoet aan wat eerder is gedaan;',
        '**bezwaar maken** tegen een verwerking op basis van ons gerechtvaardigd belang, of om **beperking** ervan vragen;',
        'de gegevens die je ons hebt gegeven terugkrijgen in een machineleesbaar formaat (**overdraagbaarheid**);',
        '**instructies** geven over wat er na je overlijden met je gegevens gebeurt.',
      ],
    },
    {
      p: 'Om deze rechten uit te oefenen, mail je naar {{email.privacy}} of schrijf je naar het postadres van {{publisher.name}}: {{publisher.address}}. We antwoorden binnen een maand; die termijn kan voor een complex verzoek met twee maanden worden verlengd, en dan laten we je dat weten. We kunnen je vragen aan te tonen dat het verzoek echt van jou komt.',
    },
    {
      p: 'Vind je dat je rechten niet worden gerespecteerd, dan kun je een klacht indienen bij de **CNIL**, de Franse toezichthouder (3 place de Fontenoy, TSA 80715, 75334 Paris Cedex 07, Frankrijk, [cnil.fr](https://www.cnil.fr/fr/plaintes)), of bij de gegevensbeschermingsautoriteit van je woonland in de Europese Unie.',
    },

    { h2: '10. Alleen voor volwassenen', id: 'mineurs' },
    {
      p: 'Minimoa is alleen voor mensen van 18 jaar en ouder. We vragen de geboortedatum vóór het inloggen; onder de 18 stopt de aanmelding en wordt er niets aangemaakt. We verzamelen niet bewust gegevens over minderjarigen. Als we te weten komen dat een account van een minderjarige is, wordt het verwijderd. Je kunt het ons vanuit de app laten weten met de reden “Minderjarige”; een account dat zo door twee verschillende mensen is gemeld, wordt geschorst tot een moderator ernaar kijkt.',
    },

    { h2: '11. Beveiliging', id: 'securite' },
    {
      ul: [
        'De uitwisseling tussen de app, de website en onze servers is versleuteld tijdens de overdracht (HTTPS).',
        'We bewaren geen wachtwoorden: inloggen gaat via Apple of Google.',
        'Foto’s staan in een privéopslag, alleen bereikbaar via tijdelijke links.',
        'De toegang tot gegevens is beperkt tot de mensen die die nodig hebben; de beheertool is voorbehouden aan bevoegde mensen, alleen-lezen behalve voor moderatie, en de acties ervan worden gelogd.',
        'We bewaren zo weinig mogelijk: locatie nooit exact opgeslagen, bewijs- en uitdagingsfoto’s binnen 24 uur gewist, niets bij Minimoa bewaard van wat naar de AI wordt gestuurd.',
      ],
    },
    {
      p: 'Geen enkel systeem is onfeilbaar. Bij een datalek melden we dat binnen 72 uur aan de CNIL als de wet dat vereist, en we laten het je direct weten als het een hoog risico voor je inhoudt.',
    },

    { h2: '12. Wijzigingen', id: 'changements' },
    {
      p: 'Als we dit beleid ingrijpend wijzigen (bijvoorbeeld een nieuw gebruik van je gegevens), laten we je dat in de app weten voordat de wijzigingen ingaan, en vragen we opnieuw je toestemming als dat nodig is. De datum van de laatste update staat bovenaan deze pagina.',
    },
  ],
};
