import type { SeedTexts } from './texts';

export const nl: SeedTexts = {
  units: {
    vision: ['Jouw kijk op het leven', 'Wat je later wilt.'],
    energie: ['Jouw energie', 'Wat je oplaadt, wat je aanzet.'],
    habitudes: ['Jouw gewoontes', 'Je dagelijks leven, zonder filter.'],
    valeurs: ['Wat voor jou telt', 'Wat je voor niets zou opgeven.'],
    autres: ['Jij en de anderen', 'Je vrienden, je naasten en nieuwe mensen.'],
    gouts: ['Jouw smaak', 'Waar je zin in hebt.'],
  },
  steps: {
    vision_1: 'De grote keuzes',
    vision_2: 'Jouw thuis, jouw tempo',
    energie_1: 'Opladen',
    energie_2: 'In een tel vertrokken',
    habitudes_1: 'Georganiseerd of niet',
    habitudes_2: 'Jouw dagen',
    valeurs_1: 'Jouw prioriteiten',
    valeurs_2: 'Hier of ergens anders',
    autres_1: 'Je vrienden',
    autres_2: 'Je naasten',
    gouts_1: 'Ontdekken',
    gouts_2: 'Jouw pleziertjes',
  },
  legacy: {
    dimanche: { o: 'Vraag hoe de perfecte zondag eruitziet.', r: ['Dekentje en serie: ik kruip erbij.', 'Ik pak mijn sjaal, we gaan!'] },
    enfants: { o: 'Vraag hoe de zondagslunches eruitzien.', r: ['Dan moet de tafel langer.', 'Brunch is heilig.'] },
    mutation: { o: 'Vraag naar welk land die persoon morgen zou vertrekken.', r: ['Ik verstop me in een doos.', 'Hier is je thuis.'] },
    heritage: { o: 'Vraag wat die persoon met € 10.000 zou doen.', r: ['Je spaarvarken bedankt je.', 'Herinneringen raak je nooit kwijt.'] },
    promotion: { o: 'Vraag naar het project waar die persoon nu mee bezig is.', r: ['Ga ervoor, ik pas op het huis.', 'Je avonden zijn veilig.'] },
    vacances: { o: 'Vraag naar de beste vakantie ooit.', r: ['Echt avontuur.', 'Wat een mooie planning.'] },
    appartement: { o: 'Vraag hoe het droomhuis eruitziet.', r: ['Een nest, ik hou van nesten.', 'Licht als een veertje.'] },
    vendredi: { o: 'Vraag naar de beste vrijdagavond ooit.', r: ['De nacht is jong!', 'Slaap lekker, tot morgen.'] },
    cinq_ans: { o: 'Vraag waar die persoon zichzelf over vijf jaar ziet.', r: ['Dicht bij de jouwen, dat is goud waard.', 'Stuur me een ansichtkaart.'] },
    projet: { o: 'Vraag naar het project dat het meest aan het hart ligt.', r: ['Wat een vuur!', 'Eerst genieten, wijs besluit.'] },
  },
  q: {
    energie_batterie: {
      t: 'Na een drukke week laad je op…',
      o: 'Vraag hoe die persoon oplaadt.',
      a: [
        ['Rustig, thuis', 'Dekentje goedgekeurd. Ik zet thee.'],
        ['Met veel mensen om me heen', 'Ik waarschuw de groep!'],
      ],
      m: 'Een beetje van allebei: de juiste dosis.',
    },
    energie_samedi: {
      t: 'Zaterdagochtend, geen plannen.',
      o: 'Vraag hoe de ideale zaterdagochtend eruitziet.',
      a: [
        ['Rustig koffie bij het raam, verder niets', 'De ultieme luxe: niets doen.'],
        ['Ik ga naar buiten en zie wel waar ik uitkom', 'Ik pak mijn sjaal en ga mee.'],
        ['Brunchen met vrienden', 'Bewaar een croissantje voor me.'],
      ],
    },
    energie_soiree: {
      t: 'Een feest waar je alleen degene kent die uitnodigt.',
      o: 'Vraag naar het beste of slechtste feest met onbekenden.',
      a: [
        ['Ik ga, ik hou van nieuwe mensen', 'Je komt terug met tien nieuwe contacten.'],
        ['Ik ga als ik iemand mee mag nemen', 'Met z’n tweeën, slim.'],
        ['Ik sla over, vanavond is het bank', 'De bank bedankt je.'],
      ],
    },
    energie_pluie: {
      t: 'Zondag, het regent pijpenstelen. Jij…',
      o: 'Vraag wat die persoon doet als het het hele weekend regent.',
      a: [
        ['Werkt aan een eigen project', 'Hier wordt hard gewerkt.'],
        ['Verdwijnt in een boek of een serie', 'Nog één aflevering, ik zeg niets.'],
        ['Kookt iets ingewikkelds, voor de lol', 'Wanneer mag ik proeven?'],
      ],
    },
    energie_semaine: {
      t: 'Je ideale week lijkt meer op…',
      o: 'Vraag hoe de ideale week eruitziet.',
      a: [
        ['Rustig, tijd voor mezelf', 'Een dutje is een kunst.'],
        ['Vol dingen die vooruitgaan', 'Motor aan!'],
      ],
      m: 'Geen race, geen dutje: balans.',
    },
    energie_vacances: {
      t: 'Op vakantie is je perfecte dag…',
      o: 'Vraag naar de perfecte vakantiedag.',
      a: [
        ['Ligstoel, boek, verder niets', 'Ik hou je handdoek bezet.'],
        ['Wandelen bij zonsopgang, ’s middags bezienswaardigheden', 'Mijn pootjes doen al pijn.'],
        ['Overdag strand, ’s nachts feest', 'Wanneer slaap jij?'],
      ],
    },
    energie_ce_soir: {
      t: '19 uur, een berichtje: “Zin in iets vanavond?”',
      o: 'Vraag wanneer die persoon voor het laatst ja zei tegen een last-minuteplan.',
      a: [
        ['Ja! Waar spreken we af?', 'Je schoenen staan al aan.'],
        ['Hangt ervan af wat', 'Voorzichtig als een kat.'],
        ['Vanavond niet, ik zit in pyjamamodus', 'De pyjama wint.'],
      ],
    },
    energie_semi: {
      t: 'Iemand stelt voor over zes maanden een halve marathon te lopen.',
      o: 'Vraag welke sportieve uitdaging die persoon trekt.',
      a: [
        ['Ik schrijf me in, dat motiveert me', 'Ik maak het spandoek.'],
        ['Misschien, als we met een groep gaan', 'Samen gaat alles makkelijker.'],
        ['Ik kom je aanmoedigen met een croissant', 'Eerlijk, de beste plek.'],
      ],
    },
    energie_cafe: {
      t: 'Je favoriete café is…',
      o: 'Vraag naar het favoriete café of de favoriete bar in de buurt.',
      a: [
        ['Een klein, rustig zaaltje met boeken', 'Sst, ik lees over je schouder mee.'],
        ['Een levendige plek, muziek, mensen die komen en gaan', 'Er gebeurt wat, leuk.'],
      ],
    },
    energie_cinq_ans: {
      t: 'Over vijf jaar, in je werk of je projecten, wil je…',
      o: 'Vraag waar de projecten van die persoon over vijf jaar staan.',
      a: [
        ['Dat alles rustig loopt', 'Rustig, maar zeker.'],
        ['Een stap verder zijn', 'Ik zie de top al.'],
      ],
      m: 'Vooruit zonder jezelf uit te putten: dat is een plan.',
    },
    habitudes_courses: {
      t: 'De boodschappen van de week…',
      o: 'Vraag wat die persoon altijd koopt, of het nou moet of niet.',
      a: [
        ['Een lijst per gangpad, niets vergeten', 'Doe je de mijne ook?'],
        ['Ik improviseer tussen de schappen', 'En je komt thuis met drie soorten kaas.'],
        ['Bezorgd, sinds zondag gepland', 'Efficiënt. Genoteerd.'],
      ],
    },
    habitudes_valise: {
      t: 'Je koffer pak je…',
      o: 'Vraag wat die persoon altijd vergeet op reis.',
      a: [
        ['Drie dagen van tevoren, met een lijstje', 'Je lijstje heeft vast een lijstje.'],
        ['De avond ervoor', 'Het grote klassieker.'],
        ['Een uur voor vertrek', 'Aan sokken gedacht?'],
      ],
    },
    habitudes_budget: {
      t: 'Je geld beheer je…',
      o: 'Vraag naar de leukste uitspatting, of de beste besparing.',
      a: [
        ['Op gevoel', 'In het moment leven is ook een budget.'],
        ['Tot op de cent', 'Spreadsheet open, respect.'],
      ],
      m: 'Een oogje in het zeil, zonder stress.',
    },
    habitudes_dimanche_soir: {
      t: 'Zondagavond…',
      o: 'Vraag naar het zondagavondritueel.',
      a: [
        ['Bereid je je week voor', 'Maandag moet zich maar gedragen.'],
        ['Geniet je tot de laatste minuut', 'Maandag kan wachten.'],
      ],
    },
    habitudes_rdv: {
      t: 'Een afspraak om 20 uur. Je komt…',
      o: 'Vraag naar het beste smoesje om te laat te komen.',
      a: [
        ['Om 19.50 uur, altijd iets te vroeg', 'Niemand is er eerder dan jij.'],
        ['Om 20 uur precies', 'Zwitserse precisie.'],
        ['Om 20.15 uur, met een goed smoesje', 'Ik hou van je smoesjes.'],
      ],
    },
    habitudes_diner: {
      t: 'Vanavond eten we…',
      o: 'Vraag naar het gerecht dat die persoon het best maakt.',
      a: [
        ['Thuis, ik kook', 'Het ruikt tot hier lekker.'],
        ['Buiten, ik wil mensen zien', 'Ik reserveer een tafel voor vier pootjes.'],
        ['Afhaal, op de bank', 'Het beste van twee werelden.'],
      ],
    },
    habitudes_week_end: {
      t: 'Je ideale weekend is…',
      o: 'Vraag wat die persoon dit weekend van plan is. Of niet.',
      a: [
        ['Helemaal vrij', 'Het toeval doet het goed.'],
        ['Van tevoren gepland', 'Mooie planning.'],
      ],
      m: 'Een plan, maar niet te veel.',
    },
    habitudes_bureau: {
      t: 'Je bureau, op dit moment…',
      o: 'Vraag naar het meest onwaarschijnlijke ding op dat bureau.',
      a: [
        ['Alles op zijn plek', 'Ik durf niets aan te raken.'],
        ['Een vrolijke chaos, maar ik weet waar alles ligt', 'Een systeem, een echt.'],
      ],
    },
    habitudes_matin: {
      t: '’s Ochtends is je eerste reflex…',
      o: 'Vraag hoe de perfecte ochtend eruitziet.',
      a: [
        ['Denken aan alles wat ik ga doen', 'Mentale lijst wordt geladen.'],
        ['Koffie, in stilte, zonder plannen', 'Eerst koffie, dan de wereld.'],
      ],
    },
    habitudes_bouger: {
      t: 'Om te bewegen kies je…',
      o: 'Vraag welke sport die persoon zou willen proberen.',
      a: [
        ['Yoga of wandelen, rustig', 'Adem in. Ik adem mee.'],
        ['Een teamsport', 'Ik ben de mascotte.'],
        ['Bewegen? Ik loop naar de koelkast', 'Het is cardio als je rent.'],
      ],
    },
    valeurs_racines: {
      t: 'De plek waar je opgroeide is voor jou…',
      o: 'Vraag wat die persoon het meest mist van de plek waar die opgroeide.',
      a: [
        ['Mijn thuishaven, ik ga er vaak terug', 'Oost west, thuis best.'],
        ['Een fijne herinnering, mijn leven is ergens anders', 'Altijd een stap verder.'],
      ],
    },
    valeurs_temps_argent: {
      t: 'Liever meer vrije tijd of meer geld?',
      o: 'Vraag wat die persoon zou doen met een extra vrije dag per week.',
      a: [
        ['Meer tijd', 'Tijd, de echte rijkdom.'],
        ['Meer geld', 'Trakteer je me op iets lekkers?'],
      ],
      m: 'Van allebei een beetje, verstandig.',
    },
    valeurs_repas: {
      t: 'Grote familiediners…',
      o: 'Vraag naar een gerecht uit de jeugd waar die persoon nog steeds dol op is.',
      a: [
        ['Heilig, ik mis er nooit een', 'Ik neem het toetje mee.'],
        ['Leuk, maar op mijn manier', 'Tradities, jouw versie.'],
        ['Ik vier liever met vrienden', 'De familie die je kiest.'],
      ],
    },
    valeurs_demenagement: {
      t: 'Een vriend verhuist zaterdag, om 8 uur.',
      o: 'Vraag naar de beste of slechtste verhuizing ooit.',
      a: [
        ['Ik neem dozen en croissants mee', 'Gouden hart, gecertificeerd.'],
        ['Ik kom ’s avonds voor de pizza', 'De pizza, het beste deel.'],
        ['Ik leen mijn auto uit, niet mijn rug', 'Je rug bedankt je.'],
      ],
    },
    valeurs_reussite: {
      t: 'Een geslaagd leven is voor jou vooral…',
      o: 'Vraag waar die persoon nu trots op is.',
      a: [
        ['Iets opgebouwd hebben', 'Ik zie je al met een standbeeld.'],
        ['Tijd voor wat ik leuk vind', 'Wijs. Heel wijs.'],
        ['Mensen van wie ik hou om me heen', 'De mooiste schat.'],
      ],
    },
    valeurs_etranger: {
      t: 'Een jaar in het buitenland wonen, nu meteen?',
      o: 'Vraag in welke stad die persoon een jaar zou wonen.',
      a: [
        ['Nee dank je, ik zit hier goed', 'Hier is je thuis.'],
        ['Ik vertrek morgen', 'Ik glip in je koffer.'],
      ],
      m: 'Waarom niet… ooit.',
    },
    valeurs_chez_toi: {
      t: 'Je ideale thuis is…',
      o: 'Vraag naar de favoriete plek in huis.',
      a: [
        ['Een nest waar altijd mensen langskomen', 'Ik claim de bank.'],
        ['Een eigen plek, rustig, met mijn regels', 'Jouw rijk, jouw regels.'],
        ['Geen vaste plek: waar ik ben', 'Een nomade in hart en nieren.'],
      ],
    },
    valeurs_occasion: {
      t: 'Een geweldige kans, maar je moet binnen een uur beslissen.',
      o: 'Vraag naar de beste impulsieve beslissing ooit.',
      a: [
        ['Ik ga ervoor', 'Wind door mijn vacht!'],
        ['Ik vraag bedenktijd', 'Nadenken is ook al doen.'],
      ],
    },
    valeurs_dix_ans: {
      t: 'Over tien jaar zie je jezelf…',
      o: 'Vraag hoe een mooie dag er over tien jaar uitziet.',
      a: [
        ['Met een grote stam om me heen', 'Dan is er een lange tafel nodig.'],
        ['Vrij als een vogel, zonder verplichtingen', 'De wind door mijn vacht.'],
        ['Geen idee, en dat is prima', 'De toekomst is een verrassing.'],
      ],
    },
    valeurs_boulot: {
      t: 'Je ideale werk is eerder…',
      o: 'Vraag welk beroep die persoon als kind wilde.',
      a: [
        ['Stabiel, ik weet waar ik heen ga', 'Zo vast als een rots.'],
        ['Wisselend, vol verrassingen', 'Achtbanen passen bij je.'],
      ],
      m: 'Stevig, met een snufje peper.',
    },
    autres_silence: {
      t: 'Iemand die je leuk vindt, reageert al twee dagen niet.',
      o: 'Vraag naar het leukste berichtje dat die persoon ooit kreeg.',
      a: [
        ['Geeft niet, ieder zijn tempo', 'Helemaal zen.'],
        ['Ik stuur iets grappigs', 'De perfecte meme bestaat.'],
        ['Ik vraag me af of ik iets verkeerds zei', 'Vast niet. Adem in.'],
      ],
    },
    autres_bande: {
      t: 'Je vrienden zijn eerder…',
      o: 'Vraag hoe die persoon haar of zijn beste vrienden leerde kennen.',
      a: [
        ['Een grote groep, altijd mensen', 'Ik wil in de groep.'],
        ['Twee of drie, maar voor het leven', 'Weinig, maar stevig.'],
      ],
    },
    autres_improviste: {
      t: 'Vrienden staan onaangekondigd voor je deur.',
      o: 'Vraag wat die persoon schenkt als er onverwacht vrienden langskomen.',
      a: [
        ['Top, ik pak de glazen', 'De deur staat altijd open!'],
        ['Leuk, maar laat het volgende keer even weten', 'Een berichtje is niet moeilijk.'],
      ],
    },
    autres_anniversaire: {
      t: 'Voor je verjaardag droom je van…',
      o: 'Vraag naar de mooiste verjaardag ooit.',
      a: [
        ['Een groot feest, iedereen uitgenodigd', 'Ik neem de confetti mee.'],
        ['Een etentje met een paar dierbaren', 'Klein gezelschap, groot moment.'],
        ['Dat iedereen het een beetje vergeet, eerlijk', 'Mondje dicht. Ik heb niets gezien.'],
      ],
    },
    autres_conseil: {
      t: 'Een vriend vraagt je advies over een grote keuze.',
      o: 'Vraag naar het beste advies dat die persoon ooit kreeg.',
      a: [
        ['We maken een lijst met voors en tegens', 'De lijst, het ultieme wapen.'],
        ['Volg je gevoel', 'Je buik heeft altijd gelijk.'],
        ['We bespreken het bij een pizza', 'Pizza helpt bij nadenken, bewezen.'],
      ],
    },
    autres_rencontrer: {
      t: 'Nieuwe mensen ontmoeten is voor jou…',
      o: 'Vraag naar de meest onverwachte ontmoeting ooit.',
      a: [
        ['Spannend, een beetje eng', 'Geen zorgen, ik stel jullie voor.'],
        ['Heerlijk opwindend', 'Je gaat genieten van wat we voorbereiden.'],
      ],
      m: 'Hangt van de dag af, heel normaal.',
    },
    autres_proches: {
      t: 'Met je naasten heb je nodig…',
      o: 'Vraag hoe die persoon contact houdt met haar of zijn naasten.',
      a: [
        ['Veel ruimte', 'Lucht, lucht!'],
        ['Veel nabijheid', 'Telt een knuffel van een minimoa?'],
      ],
      m: 'Dichtbij, maar niet aan elkaar vastgeplakt.',
    },
    autres_vacances: {
      t: 'Op vakantie met vrienden: wie organiseert?',
      o: 'Vraag naar de leukste vakantie met vrienden.',
      a: [
        ['Ik, met een gedeelde spreadsheet', 'Is er een tabblad “onvoorzien”?'],
        ['Ik help mee', 'De ideale rechterhand.'],
        ['De anderen, ik volg de flow', 'Jij zorgt voor de goede sfeer.'],
      ],
    },
    autres_voisins: {
      t: 'Je buren…',
      o: 'Vraag naar het geheime plekje in de buurt.',
      a: [
        ['Ik ken hun naam en die van hun kat', 'De buurt is familie.'],
        ['Een beleefd hallo op de trap', 'Hoffelijk en discreet.'],
        ['Zijn er buren?', 'Een mysterie om op te lossen.'],
      ],
    },
    autres_annule: {
      t: 'Een plan gaat op het laatste moment niet door.',
      o: 'Vraag wat die persoon doet met een onverwachte vrije avond.',
      a: [
        ['Leuk, een vrije avond', 'Het mooiste cadeau.'],
        ['Balen, ik had alles gepland', 'Je agenda huilt een beetje.'],
      ],
    },
    gouts_voyage: {
      t: 'Je droomreis…',
      o: 'Vraag naar de reis waar die persoon van droomt.',
      a: [
        ['Een land waarvan ik de taal niet spreek', 'Ik pak mijn woordenboek erbij.'],
        ['Een huis op het platteland, met vrienden', 'Geluk op twee uur rijden.'],
        ['Een grote stad, musea en terrasjes', 'Ik pak de metrokaart.'],
      ],
    },
    gouts_resto: {
      t: 'In een restaurant bestel je…',
      o: 'Vraag naar het vreemdste gerecht dat die persoon ooit proefde.',
      a: [
        ['Het gerecht dat ik niet ken', 'Avontuurlijke smaakpapillen!'],
        ['Mijn lievelingsgerecht, altijd hetzelfde', 'Waarom veranderen wat werkt?'],
      ],
    },
    gouts_musique: {
      t: 'Muziek vanavond, eerder…',
      o: 'Vraag welk nummer die persoon nu grijsdraait.',
      a: [
        ['Een heel album, met koptelefoon', 'Muzikale reis, niet storen.'],
        ['Een concert, eerste rij', 'Ik schreeuw de tekst met je mee.'],
        ['Een barretje met een lokale band', 'De beste ontdekkingen.'],
      ],
    },
    gouts_nature_ville: {
      t: 'Om te wonen kies je…',
      o: 'Vraag naar het favoriete plekje in de natuur, of in de stad.',
      a: [
        ['De natuur, de stilte', 'De vogels zeggen gedag.'],
        ['De stad, de energie', 'Neon is ook mooi.'],
      ],
      m: 'Een stad met een groot park?',
    },
    gouts_nouveau: {
      t: 'Nieuwe dingen proberen…',
      o: 'Vraag wat die persoon het laatst voor het eerst deed.',
      a: [
        ['Ik hou het liever bij wat ik ken', 'Zekerheden zijn geruststellend.'],
        ['Heerlijk, hoe gekker hoe beter', 'Ik heb een trapezeles voor je gevonden.'],
      ],
      m: 'Af en toe, ja.',
    },
    gouts_film: {
      t: 'Een film vanavond?',
      o: 'Vraag welke film die persoon honderd keer zou kunnen zien.',
      a: [
        ['Een klassieker die ik al tien keer zag', 'Je kent alle zinnen uit je hoofd.'],
        ['Een ondertiteld pareltje waar niemand het over heeft', 'Verfijnd! Ik neem popcorn mee.'],
        ['De grote film van het moment', 'Spanning gegarandeerd.'],
      ],
    },
    gouts_fin_week_end: {
      t: 'Een perfect weekend eindigt…',
      o: 'Vraag naar de mooiste zondagavond ooit.',
      a: [
        ['Op een plek waar ik nog nooit was', 'Ontdekken is jouw ding.'],
        ['Thuis, met lekker eten', 'Er gaat niets boven je pantoffels.'],
      ],
    },
    gouts_temps_libre: {
      t: 'Je vrije tijd lijkt meer op…',
      o: 'Vraag wat die persoon op dit moment leert.',
      a: [
        ['Hobby’s voor de lol, zonder doel', 'Plezier is genoeg.'],
        ['Dingen waarin ik beter word (een taal, een instrument)', 'Straks onverslaanbaar.'],
      ],
    },
    gouts_saison: {
      t: 'Je favoriete seizoen…',
      o: 'Vraag naar de mooiste herinnering aan dat favoriete seizoen.',
      a: [
        ['De winter: dekentje, soep, kaarsjes', 'Het dekentje is van jou.'],
        ['De zomer: terrasjes tot middernacht', 'Lange avonden, ja!'],
        ['De herfst: wandelen en ritselende bladeren', 'Knispert onder mijn pootjes.'],
        ['De lente: alles begint opnieuw', 'Het grote ontwaken.'],
      ],
    },
    gouts_surprise: {
      t: 'Je krijgt een verrassingsweekend: je weet niet waar je heen gaat.',
      o: 'Vraag naar de mooiste verrassing die die persoon ooit kreeg.',
      a: [
        ['Een droom', 'Koffer gepakt in vijf minuten.'],
        ['Ik wil op z’n minst weten wat ik moet inpakken', 'Een trui meenemen is wijsheid.'],
      ],
    },
  },
};
