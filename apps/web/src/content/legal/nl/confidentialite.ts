import type { LegalPage } from '../types';

export const confidentialite: LegalPage = {
  title: 'Privacybeleid — Blowy',
  heading: 'Privacybeleid',
  description: 'Welke gegevens Blowy gebruikt, waarvoor, op welke rechtsgrond, hoe lang, wie er toegang toe heeft en hoe je je rechten uitoefent.',
  intro: 'Wat we over je weten, waarom, wie er toegang toe heeft, hoe lang we het bewaren en hoe je alles wist.',
  summary: {
    title: 'In het kort',
    items: [
      'We gebruiken je gegevens voor één ding: je minimoa tot leven brengen en je voorstellen aan mensen die bij je passen. **Geen reclame, geen verkoop.**',
      'Wat je zoekt en wie je wilt ontmoeten kan je seksuele geaardheid onthullen: we vragen je **uitdrukkelijke toestemming**, en je kunt die intrekken.',
      'Je **locatie** wordt alleen gebruikt als de app open is. Op de kaart wordt ze afgerond en verschoven, nooit live, en de **discrete modus** haalt je van de kaart.',
      'Je **bewijsfoto’s** worden gecontroleerd door een AI, door geen mens gezien, en binnen 24 uur verwijderd (tenzij je ze bewaart).',
      '**Geen mens leest je gesprekken.** Als jullie het allebei aanzetten, leest een AI jullie berichten zodat jullie minimoas kunnen reageren. Daarna wordt niets bewaard. De enige menselijke uitzondering: een gemeld bericht en de directe context, gelezen door een moderator.',
      'Je kunt alles in de app aanpassen en [je account verwijderen](@supprimer-mon-compte) wanneer je wilt. Voor de rest: {{email.privacy}}.',
    ],
  },
  toc: true,
  body: [
    { h2: '1. Wie verantwoordelijk is', id: 'responsable' },
    {
      p: 'De verwerkingsverantwoordelijke is **{{publisher.name}}**, {{publisher.legalForm}}, {{publisher.address}}, die de app en de website van Blowy uitgeeft ([colofon](@mentions-legales)).',
    },
    { ul: ['Voor elke vraag over je gegevens: {{email.privacy}}.', 'Functionaris voor gegevensbescherming: {{dpo.name}}.'] },
    { p: 'Dit beleid geldt voor de app Blowy en de website blowy.app. Voor de cookies van de website, zie de [cookiepagina](@cookies).' },

    { h2: '2. Wat we gebruiken, en waarom', id: 'donnees' },
    {
      p: 'Per gebruik: de betrokken gegevens, het doel, de rechtsgrond (wat ons volgens de AVG toestaat het te doen), de bewaartermijn en wie er toegang toe heeft. De termijnen staan samengevat in de [tabel met bewaartermijnen](#durees).',
    },

    { h3: 'Je account' },
    {
      ul: [
        '**Gegevens:** de identificatie die Apple of Google ons stuurt als je inlogt, en het bijbehorende e-mailadres. Bij Apple kan dat een doorstuuradres zijn dat je echte adres verbergt.',
        '**Doel:** je account aanmaken, je opnieuw laten inloggen, de toegang beveiligen, je schrijven over je account.',
        '**Rechtsgrond:** uitvoering van de overeenkomst.',
        '**Bewaartermijn:** zolang je account bestaat.',
        '**Toegang:** bevoegde medewerkers van Blowy, onze authenticatieprovider. Apple of Google weten dat je Blowy gebruikt, omdat het inloggen via hen loopt.',
      ],
    },

    { h3: 'Je voornaam en geboortedatum' },
    {
      ul: [
        '**Gegevens:** de voornaam (of bijnaam) die je kiest; je geboortedatum.',
        '**Doel:** je voornaam stelt je voor aan anderen. Je geboortedatum controleert dat je 18 of ouder bent, en dient voor het leeftijdsfilter bij ontmoetingen.',
        '**Rechtsgrond:** uitvoering van de overeenkomst; voor de leeftijd ook ons gerechtvaardigd belang om minderjarigen te beschermen.',
        '**Bewaartermijn:** zolang je account bestaat. Ben je jonger dan 18, dan stopt de aanmelding vóór het inloggen en wordt er niets opgeslagen.',
        '**Toegang:** je voornaam is zichtbaar voor de mensen aan wie je minimoa je voorstelt en voor je banden. Je geboortedatum wordt niet aan anderen getoond.',
      ],
    },

    { h3: 'Je geslacht, wat je zoekt, wie je wilt ontmoeten', id: 'sensibles' },
    {
      ul: [
        '**Gegevens:** je geslacht (vrouw, man, non-binair, of “zeg ik liever niet”); wat je zoekt (vrienden, meer, of allebei); als je “meer” zoekt, wie je wilt ontmoeten (vrouwen, mannen, iedereen).',
        '**Waarom dit gevoelig is:** samen kunnen deze antwoorden je **seksuele geaardheid** onthullen, een gegeven dat beschermd is door artikel 9 van de AVG.',
        '**Doel:** je alleen voorstellen aan mensen die hetzelfde zoeken als jij, en die iemand zoals jij willen ontmoeten.',
        '**Rechtsgrond:** je **uitdrukkelijke toestemming**, gevraagd bij het aanmelden voordat je antwoordt. Je kunt die intrekken: pas je antwoorden aan in de app (“zeg ik liever niet”, alleen “vrienden”) of verwijder je account. Zonder deze antwoorden kunnen we je geen ontmoetingen voor “meer” voorstellen.',
        '**Bewaartermijn:** zolang je account bestaat, of tot je je antwoorden aanpast.',
        '**Toegang:** het matchingalgoritme. Deze antwoorden dienen om te filteren: iemand aan wie je wordt voorgesteld kan afleiden dat jullie hetzelfde zoeken. Ze worden nooit voor reclame gebruikt of aan derden doorgegeven.',
      ],
    },

    { h3: 'Je locatie', id: 'localisation' },
    {
      ul: [
        '**Gegevens:** je positie, **alleen als de app open is** (nooit op de achtergrond), en een daaruit afgeleid geschat thuisgebied.',
        '**Doel:** je de kaart en de passende minimoas om je heen tonen; je ontmoetingen in de buurt voorstellen; bevestigen dat je echt buiten je thuisgebied bent geweest, zodat de sociaalmeter van je minimoa stijgt.',
        '**Wat anderen zien:** nooit je exacte positie. Die wordt afgerond op ongeveer 300 m en verschoven, en nooit live getoond. De **discrete modus** haalt je helemaal van de kaart.',
        '**Rechtsgrond:** je toestemming, via de locatietoestemming van je telefoon. Je kunt die altijd intrekken in de instellingen van je telefoon. Zonder locatie geen kaart en geen ontmoetingen in de buurt (dat zeggen we duidelijk), maar de rest van de app werkt.',
        '**Bewaartermijn:** we bewaren je laatste afgeronde positie en je geschatte thuisgebied, die bij elke update worden vervangen. We bewaren geen geschiedenis van je verplaatsingen.',
        '**Toegang:** bevoegde medewerkers van Blowy, onze hostingprovider, en de leverancier van de kaartondergrond, die het gebied ontvangt dat op het scherm staat.',
      ],
    },

    { h3: 'Je kijk en de compatibiliteit' },
    {
      ul: [
        '**Gegevens:** je antwoorden op de kijk-test (12 situaties), je antwoorden op de vragen van de dag, de gewoontes die je kiest en de gewoontes die je volhoudt, de manier waarop je voor je minimoa zorgt (regelmaat, tijdstippen, uitstapjes), en de 3 woorden die je vrienden voor je kiezen. Daaruit leiden we je “kijk” af op 5 assen, met een betrouwbaarheidsindex, en een “stijl” (sociaal, speels, teder, kletserig).',
        '**Doel:** de compatibiliteit met anderen berekenen en je voorstellen aan wie bij je past; elke ontmoeting uitleggen; je minimoa een karakter geven. Dit is **profilering**, [hieronder](#compatibilite) in detail uitgelegd.',
        '**Rechtsgrond:** uitvoering van de overeenkomst (het is de kern van de dienst).',
        '**Bewaartermijn:** zolang je account bestaat.',
        '**Toegang:** het matchingalgoritme. Iemand aan wie je wordt voorgesteld ziet jullie overeenkomsten en één verschil, nooit je antwoorden of een los cijfer.',
      ],
    },
    { p: 'We vragen nooit naar je geloof, politieke opvattingen of gezondheid.' },

    { h3: 'Je minimoa, je gewoontes en je reeks' },
    {
      ul: [
        '**Gegevens:** de naam en het uiterlijk van je minimoa, zijn meters (sociaal, honger, energie, humeur), wat je voor hem doet, je gewoontes en hun ritme, je reeks, je jokers, je voorwerpen, je weekoverzicht.',
        '**Doel:** het spel laten werken.',
        '**Rechtsgrond:** uitvoering van de overeenkomst.',
        '**Bewaartermijn:** zolang je account bestaat.',
        '**Toegang:** jij; je banden en de mensen aan wie je wordt voorgesteld zien je minimoa en zijn stijl.',
      ],
    },

    { h3: 'Bewijsfoto’s', id: 'preuves' },
    {
      ul: [
        '**Gegevens:** de foto die je in de app maakt als je minimoa om bewijs van een gewoonte vraagt (je sneakers bijvoorbeeld). Hij wordt gemaakt met de camera, niet gekozen uit je galerij.',
        '**Doel:** controleren of de gewoonte is volgehouden. Een AI antwoordt ja, nee of “niet zeker”, met een zin. Bij “niet zeker” vertrouwen we je.',
        '**Rechtsgrond:** je toestemming: jij kiest ervoor de foto te maken en te sturen.',
        '**Bewaartermijn:** **binnen 24 uur verwijderd**, tenzij je ervoor kiest hem in je privéherinneringen te bewaren (daar blijft hij tot je hem of je account verwijdert).',
        '**Toegang:** **geen mens ziet hem.** Alleen onze AI-leverancier ontvangt hem, verkleind, om hem te analyseren. Niemand anders op Blowy ziet hem.',
      ],
    },
    { p: 'Fotografeer liever geen andere mensen, documenten of gevoelige informatie.' },

    { h3: 'Je berichten, en het lezen ervan door een AI als jullie dat aanzetten' },
    {
      ul: [
        '**Gegevens:** de berichten die je in je banden uitwisselt, de datum ervan, en wat gelezen is.',
        '**Doel:** ze bij de ander bezorgen en ze in jullie gesprek bewaren.',
        '**Rechtsgrond:** uitvoering van de overeenkomst.',
        '**Bewaartermijn:** zolang de band bestaat. Verlaat je een band, dan wordt het gesprek voor jou gewist. Verwijdert een van jullie zijn account, dan verdwijnen de band en de berichten voor allebei.',
        '**Toegang:** jij en de ander. Een moderator kan een **gemeld** bericht en de directe context lezen (zie [meldingen](#signalements)).',
      ],
    },
    {
      note: '“Geen mens leest je gesprekken. Als jullie het allebei aanzetten, leest een AI jullie berichten zodat jullie minimoas kunnen reageren. Daarna wordt niets bewaard.”',
    },
    {
      ul: [
        '**Akkoord van ieder:** we vragen het jullie allebei, de eerste keer dat jullie de chat openen. Zegt een van jullie nee, dan leest niemand mee: de minimoas reageren alleen op het ritme van de band (stiltes, reeksen, uitdagingen).',
        '**Intrekken:** wanneer je wilt, in de opties van de band of in **Ik**. Het meelezen stopt direct voor die band.',
        '**Hoe:** geen analyse bij elk bericht. Bij een aanleiding (een stilte, een bepaald aantal berichten) wordt een kort venster met de laatste berichten naar onze AI-leverancier gestuurd, die de reactie van de minimoa voorstelt. Hoogstens 3 tussenkomsten per dag per band, en je kunt ze voor een band uitzetten.',
        '**Wat bewaard wordt:** niets van de analyse. Alleen de reactie van de minimoa verschijnt in de chat, als bericht.',
        '**Rechtsgrond:** de toestemming van ieder van jullie.',
      ],
    },

    { h3: 'De reeks en de mijlpalen van een band' },
    {
      ul: [
        '**Gegevens:** de dagen waarop ieder van jullie in de band heeft geschreven (niet de inhoud van de berichten) en de mijlpalen van de band (ontmoeting, bereikte niveaus, reeksrecords). Bij banden van vóór 15 november 2026 de foto’s die jullie elkaar daar stuurden; die blijven in jullie herinneringen. We ontvangen geen nieuwe meer.',
        '**Doel:** de reeks van de band (de dagen op rij dat jullie allebei schrijven), haar levens en niveaus laten werken, en jullie herinneringen tonen.',
        '**Rechtsgrond:** uitvoering van de overeenkomst.',
        '**Bewaartermijn:** zolang de band bestaat (dezelfde regels als berichten).',
        '**Toegang:** jij en de ander in de band. Foto’s staan in een privéruimte en zijn alleen via tijdelijke links bereikbaar.',
      ],
    },

    { h3: 'Meldingen' },
    {
      ul: [
        '**Gegevens:** het technische meldingstoken van je telefoon, je instellingen per soort melding, het tijdstip dat je voor de uitdaging van de dag kiest.',
        '**Doel:** je laten weten wat er speelt (uitdaging van de dag, nieuwe ontmoeting, bericht, ’s avonds “jij bent aan de beurt”, band of reeks in gevaar, gevraagd bewijs, weekoverzicht, herinnering aan het einde van de proefperiode). Stille uren van 22.00 tot 8.00 uur; buiten berichten hoogstens 3 per dag. Op iPhone gebruiken de widget en de live-activiteiten dezelfde gegevens.',
        '**Rechtsgrond:** je toestemming, via de toestemming op je telefoon. Je trekt die in via de instellingen van je telefoon of per soort in de app.',
        '**Bewaartermijn:** tot je meldingen uitzet of je account verwijdert.',
        '**Toegang:** onze leverancier voor het versturen van meldingen, en Apple of Google, die ze op je telefoon bezorgen.',
      ],
    },

    { h3: 'Blowy+-aankopen' },
    {
      ul: [
        '**Gegevens:** het gekozen abonnement, de data van aankoop, proefperiode en verlenging, de status van het abonnement, de transactie-ID. **We ontvangen nooit je betaalgegevens**: Apple of Google factureert je.',
        '**Doel:** de Blowy+-functies ontgrendelen, de aankoop bij de store controleren, de proefperiode en de herinnering beheren.',
        '**Rechtsgrond:** uitvoering van de overeenkomst; boekhoudkundige verplichtingen voor de transactiereferenties.',
        '**Bewaartermijn:** de status zolang je account bestaat; de transactiereferenties zo lang als onze boekhoudkundige verplichtingen vereisen (hoogstens 10 jaar).',
        '**Toegang:** bevoegde medewerkers van Blowy; Apple of Google, volgens hun eigen beleid.',
      ],
    },

    { h3: 'Meldingen van misbruik, blokkades en moderatie', id: 'signalements' },
    {
      ul: [
        '**Gegevens:** wie meldt, wie gemeld wordt, de betrokken band, de reden, de geschreven toelichting; het **gemelde bericht en de directe context**; blokkades; moderatiebeslissingen en het actielogboek.',
        '**Doel:** mensen beschermen, meldingen afhandelen (doel: binnen 24 uur), de [regels](@regles) handhaven, autoriteiten antwoorden, voorkomen dat een geblokkeerde persoon contact met je opneemt.',
        '**Rechtsgrond:** onze wettelijke verplichtingen (met name de digitaledienstenverordening) en ons gerechtvaardigd belang bij de veiligheid van de community.',
        '**Bewaartermijn:** zie de [tabel met bewaartermijnen](#durees).',
        '**Toegang:** bevoegde moderators van Blowy, en de autoriteiten als de wet dat vereist. De gemelde persoon weet niet wie hem heeft gemeld. Een geblokkeerde persoon krijgt geen bericht.',
      ],
    },

    { h3: 'Statistieken en beheer' },
    {
      ul: [
        '**Gegevens:** cijfers berekend uit de activiteit: aantal accounts, actieve accounts, retentie, abonnees en proefperiodes, reeksen, berichten van minimoas, voorgestelde en geaccepteerde ontmoetingen, AI-kosten.',
        '**Doel:** Blowy sturen en verbeteren, de kosten beheersen.',
        '**Rechtsgrond:** ons gerechtvaardigd belang.',
        '**Hoe:** deze statistieken worden berekend uit onze eigen database, in een interne tool die voorbehouden is aan enkele bevoegde mensen. Er zit geen tool voor bezoekersstatistieken of reclame in de app. De interne tool geeft geen toegang tot gesprekken, behalve tot een gemeld bericht en de directe context.',
        '**Bewaartermijn:** individuele gegevens volgen de looptijd van je account; geaggregeerde cijfers, waarmee je niet te identificeren bent, kunnen langer worden bewaard.',
      ],
    },

    { h3: 'Technische gegevens' },
    {
      ul: [
        '**Gegevens:** IP-adres, model en besturingssysteem van het toestel, appversie, taal, fout- en verbindingslogboeken.',
        '**Doel:** de dienst draaiende houden, beveiligen, misbruik beperken, bugs oplossen.',
        '**Rechtsgrond:** ons gerechtvaardigd belang; onze wettelijke verplichting om bepaalde verbindingsgegevens te bewaren.',
        '**Bewaartermijn:** zie de [tabel met bewaartermijnen](#durees).',
        '**Toegang:** het bevoegde technische team en onze hostingproviders.',
      ],
    },

    { h3: '“3 woorden” en uitnodigingen (mensen zonder account)' },
    {
      ul: [
        '**Gegevens:** als iemand je “3 woorden”-pagina of je uitnodiging op de website opent, tonen we je voornaam en je minimoa. Voor stemmen slaan we de gekozen woorden op en een niet-omkeerbare vingerafdruk van het IP-adres en de browser, om dubbele stemmen te beperken. Er is geen account nodig.',
        '**Rechtsgrond:** uitvoering van de overeenkomst voor jou; ons gerechtvaardigd belang om misbruik te voorkomen voor de vingerafdruk.',
        '**Bewaartermijn:** zolang je account bestaat.',
        '**Toegang:** jij ziet de woorden, nooit wie ze heeft gekozen.',
      ],
    },

    { h3: 'Als je ons schrijft' },
    {
      ul: [
        '**Gegevens:** je e-mailadres, je bericht, en wat nodig is om je verzoek af te handelen.',
        '**Rechtsgrond:** uitvoering van de overeenkomst of ons gerechtvaardigd belang om je te antwoorden; wettelijke verplichting voor verzoeken om je rechten uit te oefenen.',
        '**Bewaartermijn:** zie de [tabel met bewaartermijnen](#durees).',
      ],
    },

    { h2: '3. Hoe de compatibiliteit werkt', id: 'compatibilite' },
    { p: 'Je minimoa stelt je alleen voor aan mensen van wie de kijk op het leven dezelfde kant op gaat als die van jou. Dit is de logica, zonder geheimen:' },
    {
      ol: [
        '**Je kijk** wordt geplaatst op 5 assen: thuis (vrij, alleen ↔ een gezin stichten), wortels (hier blijven ↔ vertrekken), drive (tijd voor jezelf ↔ grote projecten), ritme (rustig, thuis ↔ intens, buiten), koers (van dag tot dag ↔ alles plannen). Elke as heeft een betrouwbaarheidsindex.',
        '**Waar hij vandaan komt**, met startgewichten: aanmeldtest 40% (daarna steeds minder), vraag van de dag 20%, gewoontes 25%, hoe je voor je minimoa zorgt 10%, de 3 woorden van je vrienden 5%. Hoe meer je Blowy gebruikt, hoe hoger de betrouwbaarheid.',
        '**De filters**: wat ieder zoekt, en voor “meer” wie hij wil ontmoeten; 18 jaar en ouder; het gebied; geblokkeerde mensen.',
        '**De score**: de nabijheid op de 5 assen, gewogen naar betrouwbaarheid. Voor “vrienden” telt de as thuis weinig; voor “meer” telt hij dubbel. De stijl (sociaal, speels, teder, kletserig) telt niet mee in de score.',
        '**De drempel**: onder 70% wordt niemand voorgesteld, ook al betekent dat minder mensen tonen.',
        '**De uitleg**: elke ontmoeting zegt waarom, met 3 overeenkomsten en 1 verschil om te ontdekken. Nooit een los cijfer.',
        '**Het aantal ontmoetingen** hangt ook af van de vorm van je minimoa (hoe beter je voor hem zorgt, hoe meer mensen hij je voorstelt) en van je abonnement.',
      ],
    },
    { p: 'Je kijk is indicatief: het is “je kijk, voorlopig”. Het is geen diagnose, en we gebruiken geen medische of psychologische termen.' },
    {
      p: '**Deze berekening neemt geen besluit met rechtsgevolgen** voor jou, of dat je in vergelijkbare mate aanmerkelijk treft. Ze bepaalt alleen aan wie je minimoa je voorstelt; jij kiest altijd zelf of je zwaait, accepteert of negeert. Je kunt ons om uitleg vragen, een uitkomst betwisten of bezwaar maken tegen deze verwerking door te schrijven naar {{email.privacy}}; in dat laatste geval kunnen we je niemand meer voorstellen.',
    },

    { h2: '4. Kunstmatige intelligentie', id: 'ia' },
    { p: 'Blowy gebruikt AI op drie plekken, en nergens anders:' },
    {
      table: {
        head: ['Gebruik', 'Wat de AI ontvangt', 'Wat bewaard wordt'],
        rows: [
          ['Bewijsfoto’s', 'De foto, verkleind', 'Het antwoord (ja, nee, niet zeker). De foto wordt binnen 24 uur verwijderd, tenzij je hem bewaart.'],
          ['Berichten lezen (als jullie het allebei aanzetten)', 'Een kort venster met de laatste berichten van de band', 'Niets van de analyse. Alleen de reactie van de minimoa verschijnt in de chat.'],
          ['Weekoverzicht en stem van de minimoas', 'Een samenvatting van je activiteit van de week (uitstapjes, gewoontes, reeks, banden)', 'De tekst van het overzicht, in de app.'],
        ],
      },
    },
    {
      p: 'Onze AI-leverancier is verwerker: hij verwerkt deze gegevens alleen voor ons, volgens onze instructies, en niet voor eigen doeleinden. Geen medewerker van Blowy ziet deze inhoud tijdens de analyse. AI-antwoorden kunnen fout zijn: ze hebben geen rechtsgevolgen, en bij twijfel over een bewijs vertrouwen we je.',
    },

    { h2: '5. Wat anderen zien', id: 'visibilite' },
    {
      ul: [
        '**Mensen aan wie je minimoa je voorstelt** zien je voornaam, je minimoa, zijn stijl, jullie overeenkomsten en één verschil, en je geschatte positie op de kaart (behalve in de discrete modus).',
        '**Je banden** zien daarnaast jullie berichten, jullie reeks, de mijlpalen van jullie band en jullie eerdere foto’s, als die er zijn.',
        '**Bezoekers van je “3 woorden”-pagina of je uitnodiging** zien je voornaam en je minimoa.',
        'Niemand ziet je e-mailadres, je geboortedatum, je exacte positie of je antwoorden op de kijk-test. Je bewijsfoto’s worden gecontroleerd door een AI: geen mens ziet ze, en ze worden binnen 24 uur verwijderd (tenzij je ze in je privéherinneringen bewaart).',
      ],
    },

    { h2: '6. Onze dienstverleners', id: 'prestataires' },
    { p: 'Deze verwerkers verwerken gegevens namens ons, volgens onze instructies, met een overeenkomst die voldoet aan artikel 28 van de AVG:' },
    {
      subprocessors: {
        head: ['Rol', 'Leverancier', 'Plaats van verwerking', 'Waarborg buiten de EU'],
        roles: {
          database: 'Database, authenticatie en opslag van foto’s',
          api: 'Hosting van de server van de app (API)',
          ai: 'AI: bewijsfoto’s, berichten lezen als dat aanstaat, weekoverzichten',
          email: 'Versturen van e-mails',
          push: 'Versturen van meldingen',
          maps: 'Kaartondergrond',
          site: 'Hosting van de website blowy.app',
        },
      },
    },
    {
      p: '**Apple en Google** spelen ook een rol, voor eigen rekening en volgens hun eigen beleid: inloggen (Inloggen met Apple, Google), verspreiding van de app (App Store, Google Play), betaling van Blowy+ en bezorging van meldingen.',
    },
    { p: 'Tot slot kunnen we verplicht zijn gegevens aan de autoriteiten te verstrekken als de wet dat vereist.' },

    { h2: '7. Doorgifte buiten de Europese Unie', id: 'transferts' },
    {
      p: 'We kiezen bij voorkeur leveranciers die gegevens in de Europese Unie verwerken. Als een leverancier gegevens buiten de EU verwerkt (de tabel hierboven geeft dat aan), is de doorgifte gedekt door een adequaatheidsbesluit van de Europese Commissie (bijvoorbeeld het EU-VS-kader voor gegevensbescherming, voor gecertificeerde bedrijven) of door de standaardcontractbepalingen van de Commissie. Je kunt een kopie krijgen door te schrijven naar {{email.privacy}}.',
    },

    { h2: '8. Hoe lang we je gegevens bewaren', id: 'durees' },
    {
      table: {
        head: ['Gegevens', 'Bewaartermijn'],
        rows: [
          ['Account, profiel, kijk, minimoa, gewoontes, instellingen', 'Zolang je account bestaat. Gewist zodra je het verwijdert.'],
          ['Inactief account', 'Verwijderd na 2 jaar zonder inloggen, na een waarschuwing.'],
          ['Locatie', 'Alleen de laatste afgeronde positie en het geschatte thuisgebied, bij elke update vervangen.'],
          ['Bewijsfoto’s', 'Binnen 24 uur, tenzij je ze in je privéherinneringen bewaart.'],
          ['Berichten lezen door de AI', 'Na de analyse wordt niets bewaard.'],
          ['Berichten, reeks, mijlpalen en eerdere foto’s van een band', 'Zolang de band bestaat.'],
          ['Aankopen', 'Status zolang het account bestaat; transactiereferenties tot 10 jaar (boekhoudkundige verplichtingen).'],
          ['Meldingen en moderatiebeslissingen', '1 jaar na afsluiting van het dossier, langer als een gerechtelijke procedure dat vereist.'],
          ['Definitieve uitsluiting', 'Een technische identificatie van het Apple- of Google-account, 3 jaar lang, om opnieuw aanmelden te voorkomen.'],
          ['Technische logboeken', '30 dagen, behalve bij een beveiligingsincident dat wordt onderzocht. Verbindingsgegevens die we wettelijk moeten bewaren: de wettelijke termijn, hoogstens een jaar.'],
          ['Contact met de klantenservice', '1 jaar na afsluiting van het verzoek.'],
          ['Verzoeken om je rechten uit te oefenen', '5 jaar, zodat we kunnen bewijzen dat we hebben geantwoord.'],
          ['Back-ups', 'Overschreven naarmate ze roteren, uiterlijk 30 dagen na verwijdering.'],
        ],
      },
    },

    { h2: '9. Je rechten', id: 'droits' },
    { p: 'Volgens de AVG en de Franse privacywet kun je op elk moment:' },
    {
      ul: [
        'je gegevens **inzien** en een kopie krijgen;',
        'ze laten **corrigeren** (veel ervan pas je direct in de app aan);',
        'ze laten **wissen** ([je account verwijderen](@supprimer-mon-compte) doet dat in één keer);',
        'je **toestemming intrekken** als die de grondslag van een verwerking is (gevoelige gegevens, locatie, bewijsfoto’s, berichten lezen door de AI, meldingen), zonder dat dit afdoet aan wat ervoor is gebeurd;',
        '**bezwaar maken** tegen een verwerking op grond van ons gerechtvaardigd belang, of om **beperking** vragen;',
        'de gegevens die je ons gaf in een machineleesbaar formaat krijgen (**overdraagbaarheid**);',
        '**instructies** geven over wat er na je overlijden met je gegevens gebeurt.',
      ],
    },
    {
      p: 'Om deze rechten uit te oefenen, schrijf je naar {{email.privacy}} of naar het postadres van {{publisher.name}}: {{publisher.address}}. We antwoorden binnen een maand; bij een complex verzoek kan die termijn met twee maanden worden verlengd, en dan laten we het je weten. We kunnen je vragen te bewijzen dat het verzoek echt van jou komt.',
    },
    {
      p: 'Vind je dat je rechten niet worden gerespecteerd, dan kun je een klacht indienen bij de **CNIL**, de Franse gegevensbeschermingsautoriteit (3 place de Fontenoy, TSA 80715, 75334 Paris Cedex 07, Frankrijk, [cnil.fr](https://www.cnil.fr/fr/plaintes)), of bij de gegevensbeschermingsautoriteit van je woonland in de Europese Unie.',
    },

    { h2: '10. Alleen voor volwassenen', id: 'mineurs' },
    {
      p: 'Blowy is alleen voor mensen van 18 jaar en ouder. We vragen de geboortedatum vóór het inloggen; onder de 18 stopt de aanmelding en wordt er niets aangemaakt. We verzamelen niet bewust gegevens over minderjarigen. Als we ontdekken dat een account van een minderjarige is, wordt het verwijderd. Je kunt het ons laten weten vanuit de app met de reden “Minderjarige”.',
    },

    { h2: '11. Beveiliging', id: 'securite' },
    {
      ul: [
        'Het verkeer tussen de app, de website en onze servers is versleuteld tijdens de overdracht (HTTPS).',
        'Geen wachtwoord bij ons: inloggen gaat via Apple of Google.',
        'Foto’s staan in een privéopslag, alleen bereikbaar via tijdelijke links.',
        'Toegang tot gegevens is beperkt tot wie die nodig heeft; de beheertool is voorbehouden aan bevoegde mensen, alleen-lezen behalve voor moderatie, en de acties erin worden gelogd.',
        'We bewaren zo weinig mogelijk: bewijsfoto’s binnen 24 uur verwijderd, afgeronde locatie, niets bewaard nadat de AI berichten heeft gelezen.',
      ],
    },
    {
      p: 'Geen enkel systeem is onfeilbaar. Bij een datalek melden we dat binnen 72 uur aan de CNIL als de wet dat vereist, en we laten het je direct weten als het een hoog risico voor je inhoudt.',
    },

    { h2: '12. Wijzigingen', id: 'changements' },
    {
      p: 'Als we dit beleid ingrijpend wijzigen (bijvoorbeeld een nieuw gebruik van je gegevens), laten we het je in de app weten voordat de wijzigingen ingaan, en vragen we opnieuw je toestemming waar dat nodig is. De datum van de laatste update staat bovenaan deze pagina.',
    },
  ],
};
