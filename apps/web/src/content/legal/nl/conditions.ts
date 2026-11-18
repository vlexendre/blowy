import type { LegalPage } from '../types';

export const conditions: LegalPage = {
  title: 'Gebruiksvoorwaarden — Minimoa',
  heading: 'Gebruiksvoorwaarden',
  description: 'De overeenkomst tussen jou en Minimoa: 18 jaar en ouder, je account, wat mag, je inhoud, moderatie, einde van de overeenkomst, toepasselijk recht.',
  intro: 'De overeenkomst tussen jou en Minimoa. Als je een account aanmaakt, ga je ermee akkoord. Neem vijf minuten om ze te lezen.',
  summary: {
    title: 'In het kort',
    items: [
      'Minimoa is alleen voor **volwassenen van 18 jaar en ouder**. Eén account per persoon, voor een echte persoon.',
      'Je **minimoa** draagt jouw kijk op het leven en stelt je voor aan mensen die bij je passen om banden te leggen. Wat ze worden, is aan jullie. Zijn berichten zijn automatisch: het is geen persoon.',
      'Respecteer anderen en de [communityregels](@regles). Geen intimidatie, geen seksuele inhoud, niets waarbij een minderjarige betrokken is.',
      'Je berichten en foto’s blijven van jou. Je geeft ons alleen het recht om ze te verwerken zodat Minimoa werkt.',
      'Minimoa is gratis. **Minimoa+** is een optioneel abonnement, betaald via de App Store, op iPhone ([voorwaarden van Minimoa+](@abonnement)).',
      'Je kunt vertrekken wanneer je wilt: [je account verwijderen](@supprimer-mon-compte) doe je in de app.',
      'Frans recht is van toepassing. Is er een probleem, schrijf ons eerst; je kunt ook gratis naar een bemiddelaar.',
    ],
  },
  toc: true,
  body: [
    { h2: '1. Wie we zijn', id: 'editeur' },
    {
      p: 'De app Minimoa en de website minimoa.app worden uitgegeven door **{{publisher.name}}** (“Minimoa”, “wij”). Alle gegevens staan in het [colofon](@mentions-legales). Schrijf ons: {{email.support}}.',
    },
    {
      p: 'Deze voorwaarden gelden voor elk gebruik van de app. De [communityregels](@regles), de [voorwaarden van het Minimoa+-abonnement](@abonnement) en het [privacybeleid](@confidentialite) maken er deel van uit.',
    },

    { h2: '2. Wat Minimoa is', id: 'service' },
    {
      p: 'Op Minimoa voedt iedereen een **minimoa** op, een klein figuurtje dat zijn of haar kijk op het leven draagt: wat iemand voor zijn leven voor ogen heeft (een thuis en gezin, waar je wilt wonen, de plaats van werk, het ritme van elke dag, de lange termijn). De minimoa stelt zijn mens voor aan mensen met een passende kijk, om elkaar te leren kennen, en waakt over elke band.',
    },
    {
      ul: [
        '**Je kijk** wordt opgebouwd met een test bij het aanmelden, één vraag per dag, je gewoontes en de manier waarop je voor je minimoa zorgt. Hij is indicatief en wordt na verloop van tijd nauwkeuriger.',
        '**Ontmoetingen**: je minimoa stelt je alleen voor aan mensen van wie de compatibiliteit boven een drempel ligt. Niets gebeurt zonder jouw akkoord: jij zwaait, de ander accepteert, de band ontstaat. Hoe het werkt staat in het [privacybeleid](@confidentialite#compatibilite).',
        '**Banden**: een chat, een reeks die groeit op elke dag dat jullie allebei schrijven, herinneringen, en levens die dalen als het stil blijft.',
        '**Je minimoa** heeft meters (sociaal, honger, energie, humeur), gewoontes om vol te houden, een reeks, voorwerpen. Hij gaat nooit dood.',
        '**De kaart** toont passende minimoas om je heen (of rond de stad die je koos, als je je locatie niet aanzet), op een bewust onnauwkeurige plek.',
      ],
    },
    {
      p: '**Minimoas zijn geen mensen.** Hun berichten, opmerkingen en het weekoverzicht worden automatisch gemaakt, met zinssjablonen of met kunstmatige intelligentie. Ze kunnen zich vergissen. Het is geen professioneel advies, geen medisch advies en geen garantie over iemand.',
    },
    { p: 'Een compatibiliteit, hoe hoog ook, zegt niets over iemands eerlijkheid of bedoelingen. Minimoa controleert de identiteit van mensen niet en doet geen onderzoek naar hen.' },

    { h2: '3. Wie Minimoa mag gebruiken', id: 'age' },
    {
      ul: [
        '**Je moet 18 jaar of ouder zijn.** We vragen je geboortedatum voordat je inlogt. Onder de 18 stopt de aanmelding en wordt er niets aangemaakt. Liegen over je leeftijd leidt tot sluiting van het account.',
        '**Eén account per persoon**, voor een echte persoon: jij. Geen gedeelde accounts, geen accounts op naam van iemand anders.',
        'Je mag niet eerder van Minimoa zijn uitgesloten, en de wet mag je het gebruik van dit soort dienst niet verbieden.',
      ],
    },

    { h2: '4. Je account', id: 'compte' },
    {
      p: 'Je logt in met **Apple** (op iPhone) of **Google** (op Android). Die diensten bevestigen je identiteit; we kennen je wachtwoord nooit. Houd de toegang tot dat Apple- of Google-account voor jezelf: wat er op je Minimoa-account gebeurt, valt onder jouw verantwoordelijkheid. Denk je dat iemand erin is gekomen? Schrijf ons meteen.',
    },
    { p: 'De informatie die je geeft (voornaam, geboortedatum, geslacht) moet kloppen en actueel zijn. Je kunt ze in de app aanpassen.' },

    { h2: '5. Wat mag, en wat niet', id: 'usage' },
    { p: 'Je gebruikt Minimoa met respect voor de wet, voor anderen en voor de [communityregels](@regles). Het is in het bijzonder verboden om:' },
    {
      ul: [
        'te intimideren, bedreigen, beledigen, vernederen, chanteren, of aan te zetten tot haat of geweld;',
        'naaktheid of seksuele inhoud te sturen, ook als profielfoto of bewijsfoto;',
        'een minderjarige op welke manier ook te betrekken;',
        'illegale, gewelddadige of schokkende inhoud te plaatsen;',
        'je voor te doen als iemand anders, een nepprofiel of meerdere accounts aan te maken;',
        'mensen op te lichten, om geld te vragen, reclame te maken of te spammen;',
        'betaalde seksuele diensten aan te bieden of te vragen;',
        'privégegevens of foto’s van iemand anders zonder toestemming te delen;',
        'de controles te misleiden (valse bewijsfoto, vervalste locatie) of het automatische inhoudsfilter te omzeilen;',
        'het gebruik van de dienst te automatiseren (bots, scraping), de grenzen, blokkades of beveiliging te omzeilen, of de werking te verstoren.',
      ],
    },

    { h2: '6. Je inhoud', id: 'contenus' },
    {
      p: 'Je berichten, foto’s en antwoorden blijven van jou. Om Minimoa te laten werken, geef je ons een **gratis, niet-exclusieve, wereldwijde licentie**, beperkt tot wat nodig is om: ze op te slaan, ze te bezorgen bij de mensen voor wie ze bedoeld zijn, ze in de app te tonen, ze technisch te verwerken (een foto verkleinen bijvoorbeeld) en, waar voorzien, ze automatisch te filteren en, waar voorzien, ze door een AI te laten analyseren (bewijsfoto’s, als je dat hebt geaccepteerd; berichten, als jullie dat allebei hebben aangezet; profielfoto en berichten die twijfel wekken, voor de veiligheid; zie het [privacybeleid](@confidentialite#ia)). Deze licentie loopt zolang de inhoud online staat en eindigt als die wordt verwijderd, behalve voor wat we moeten bewaren volgens het [privacybeleid](@confidentialite#durees).',
    },
    { p: 'We gebruiken je inhoud niet voor reclame en we verkopen hem niet.' },
    { p: 'Je garandeert dat je het recht hebt om te plaatsen wat je plaatst, en dat het geen inbreuk maakt op de rechten van anderen (portretrecht, privacy, auteursrecht).' },

    { h2: '7. Melden, moderatie en sancties', id: 'moderation' },
    {
      p: 'Je kunt iemand altijd melden of blokkeren vanuit de app ([hoe](@securite)). Elke melding waarschuwt het moderatieteam, dat ze bekijkt met als doel een reactie binnen 24 uur. Daarvoor kan een moderator van Minimoa het gemelde bericht en de directe context lezen (de berichten eromheen). Buiten dit geval leest niemand bij Minimoa je gesprekken; een AI leest ze alleen als jullie dat allebei hebben aangezet.',
    },
    {
      p: 'Voornamen, minimoa-namen, berichten en profielfoto’s gaan door een **automatisch filter** voordat ze worden gepubliceerd: inhoud die duidelijk tegen de regels ingaat, wordt geweigerd, en de app vertelt je waarom; een grensgeval wordt wel verstuurd, maar gemeld aan de moderatie. In slechts twee gevallen wordt het account **automatisch geschorst**, maximaal 72 uur, terwijl een moderator ernaar kijkt: expliciete pedoseksuele woordenschat in een bericht, of een account dat door twee verschillende mensen als minderjarig is gemeld. De moderator heft de schorsing op of bevestigt ze.',
    },
    { p: 'Afhankelijk van de ernst kunnen we:' },
    {
      ul: [
        'inhoud verwijderen;',
        'een waarschuwing sturen;',
        'sommige functies beperken (ontmoetingen, kaart, foto’s);',
        'het account tijdelijk opschorten;',
        'het account definitief sluiten, bij een ernstige of herhaalde overtreding.',
      ],
    },
    {
      p: 'Wat ernstig en illegaal is (inhoud met een minderjarige, een serieuze bedreiging bijvoorbeeld), melden we bij de autoriteiten. Als we een beslissing over jou nemen, geven we je de redenen, tenzij de wet dat verbiedt of het iemand in gevaar zou brengen. Je kunt ertegen in bezwaar gaan, of de beslissing nu automatisch was of niet, door binnen zes maanden te mailen naar {{email.support}}; een mens bekijkt de beslissing opnieuw.',
    },

    { h2: '8. Kunstmatige intelligentie in Minimoa', id: 'ia' },
    {
      ul: [
        '**Berichten lezen**: alleen als jullie het allebei aanzetten, zodat jullie minimoa’s kunnen reageren. Jullie kunnen het altijd uitzetten.',
        '**Bewijsfoto’s**: alleen als je dat accepteert, zegt een AI of de foto bij de gewoonte past; bij twijfel vertrouwen we je. Zonder toestemming bevestig je op je woord, zonder foto.',
        '**Veiligheidscontroles**: elke profielfoto, en een bericht dat twijfel wekt in een chat waarin jullie allebei het meelezen hebben geaccepteerd.',
        '**Weekoverzicht**: door een AI herschreven, zonder enige voornaam of naam. De andere opmerkingen van de minimoa’s komen uit kant-en-klare zinnen.',
      ],
    },
    {
      p: 'Deze AI is die van {{sub.ai.provider}} ({{sub.ai.location}}), onze dienstverlener. Deze functies dienen het spel, het gesprek en de veiligheid. Geen ervan neemt een beslissing met rechtsgevolgen voor jou. De details, en wat de dienstverlener ontvangt, staan in het [privacybeleid](@confidentialite#ia); je toestemmingen zie en trek je in in de app, **Ik → De AI en jij**.',
    },

    { h2: '9. Gratis, met Minimoa+ als optie', id: 'blowy-plus' },
    {
      p: 'Minimoa is gratis en zonder reclame. **Minimoa+** is een optioneel abonnement dat extra functies ontgrendelt. Het wordt verkocht en gefactureerd door Apple, op iPhone (een abonnement dat je op iPhone neemt, volgt je account op je andere apparaten). Wat het bevat, de prijzen, de gratis proefperiode, de verlenging en hoe je opzegt staan in de [voorwaarden van het Minimoa+-abonnement](@abonnement).',
    },
    {
      p: 'Heb je Minimoa uit de App Store gedownload, dan geldt voor de app ook Apples [standaard licentieovereenkomst voor apps](https://www.apple.com/legal/internet-services/itunes/dev/stdeula/) (“Licensed Application End User License Agreement”).',
    },
    {
      p: 'Voorwerpen, jokers, reeksen, levens en andere spelelementen hebben geen geldwaarde. Ze kunnen niet worden geruild, doorverkocht of terugbetaald, behalve waar de wet dat vereist.',
    },

    { h2: '10. Einde van de overeenkomst', id: 'fin' },
    {
      ul: [
        '**Jij** kunt vertrekken wanneer je wilt: in de app, **Ik → Instellingen → Mijn account verwijderen** ([wat er gewist wordt](@supprimer-mon-compte)). Je account verwijderen zegt een Minimoa+-abonnement niet op: zeg het ook op in de instellingen van je iPhone.',
        '**Wij** kunnen je account opschorten of sluiten als je je niet aan deze voorwaarden houdt, als de wet ons dat oplegt, of als iemands veiligheid op het spel staat. Behalve bij spoed of een ernstige overtreding waarschuwen we je vooraf en leggen we uit waarom.',
        'Als we met de dienst stoppen, laten we het je minstens 30 dagen van tevoren weten.',
      ],
    },

    { h2: '11. Beschikbaarheid en aansprakelijkheid', id: 'responsabilite' },
    {
      p: 'We doen ons best om Minimoa altijd goed te laten werken. We kunnen niet garanderen dat er nooit storingen, bugs of onderbrekingen zijn, vooral tijdens een update. We kunnen de functies van de app aanpassen.',
    },
    {
      p: 'Iedereen is verantwoordelijk voor wat hij plaatst en hoe hij zich gedraagt. Afspreken in het echt doe je op eigen verantwoordelijkheid: lees onze [veiligheidstips](@securite#rencontre). We zijn niet aansprakelijk voor het gedrag van een andere gebruiker, noch voor indirecte schade, voor zover de wet dat toestaat.',
    },
    {
      p: 'Niets in deze voorwaarden beperkt onze aansprakelijkheid bij grove nalatigheid of opzet, of bij lichamelijk letsel, noch de rechten die de wet je als consument geeft, met name de wettelijke conformiteitsgarantie voor digitale inhoud en diensten.',
    },

    { h2: '12. Intellectueel eigendom', id: 'propriete' },
    {
      p: 'Het merk Minimoa, de minimoas, de illustraties, teksten en software zijn van {{publisher.name}} of haar partners. We geven je een persoonlijk, niet-exclusief en niet-overdraagbaar recht om de app privé te gebruiken, zolang je account bestaat. Je mag screenshots van je eigen gesprekken delen, zonder anderen bloot te stellen.',
    },

    { h2: '13. Wijzigingen', id: 'changements' },
    {
      p: 'Deze voorwaarden kunnen veranderen, bijvoorbeeld als er een nieuwe functie komt. Bij een belangrijke wijziging laten we het je in de app minstens 30 dagen van tevoren weten, tenzij de wet of de veiligheid sneller handelen vereist. Ben je het er niet mee eens, dan kun je je account vóór die datum verwijderen.',
    },

    { h2: '14. Toepasselijk recht, geschillen en bemiddeling', id: 'litiges' },
    { p: 'Op deze voorwaarden is **Frans recht** van toepassing. Woon je in een ander EU-land, dan behoud je de bescherming van de dwingende regels van je land.' },
    { p: 'Is er een probleem? Schrijf ons eerst op {{email.support}}: we zoeken samen een oplossing.' },
    { requires: ['mediator.name'], p: 'Lost je schriftelijke klacht niets op, dan kun je binnen een jaar na je klacht gratis terecht bij de consumentenbemiddelaar waar wij onder vallen:' },
    { ul: ['**Bemiddelaar:** {{mediator.name}}', '**Adres:** {{mediator.address}}', '**Website:** {{mediator.website}}'] },
    {
      p: 'Komen we er niet uit, dan gaat het geschil naar de bevoegde Franse rechter. Als consument kun je ook naar de rechter van de plaats waar je woonde bij het aanmelden of op het moment van de gebeurtenis.',
    },
  ],
};
