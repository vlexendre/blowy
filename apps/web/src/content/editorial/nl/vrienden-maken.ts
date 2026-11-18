/**
 * /nl/vrienden-maken/ : page éditoriale en néerlandais pour la Flandre (docs/SEO.md §4). Néerlandais de Belgique,
 * neutre (« je »), mêmes termes que la landing nl (band, gewoontes, groepen, 7 levens, « Open je buurt »).
 */
import type { BuurtPage } from '../types';

export const vriendenMaken: BuurtPage = {
  path: '/nl/vrienden-maken/',
  meta: {
    title: 'Vrienden maken in je buurt: een app om vrienden te maken',
    description: 'Nieuwe vrienden maken in Antwerpen, Gent, Brussel of Leuven: waar je mensen leert kennen in je buurt, en hoe de app Minimoa je aan buren voorstelt.',
  },
  h1: 'Vrienden maken in je buurt',
  lead: 'Na je studies, na een verhuis of gewoon omdat je vrienden uitgezwermd zijn: op je dertigste of veertigste nieuwe vrienden maken voelt vreemd. Toch is het heel gewoon, en het begint bijna altijd dicht bij huis.',
  keywords: [
    'vrienden maken',
    'nieuwe vrienden maken',
    'vrienden maken in de buurt',
    'app om vrienden te maken',
    'vrienden maken app',
    'hoe nieuwe vrienden maken',
    'vrienden maken als volwassene',
    'vrienden maken antwerpen',
    'vrienden maken gent',
    'app vrienden maken belgië',
  ],
  sections: [
    {
      title: 'Waarom het later moeilijker wordt',
      blocks: [
        'Op school, in de jeugdbeweging of op kot zag je dezelfde mensen elke week, zonder iets te moeten plannen. Daarna valt dat weg: iedereen werkt, verhuist, krijgt kinderen, en afspraken worden iets wat je drie weken op voorhand in een agenda zet.',
        'Vriendschap groeit vooral uit herhaling: dezelfde gezichten, op dezelfde plek, keer op keer. Wie als volwassene vrienden wil maken, moet die herhaling dus zelf terugbrengen. En de makkelijkste plek daarvoor is je eigen buurt.',
      ],
    },
    {
      title: 'Mensen leren kennen in Antwerpen, Gent, Brussel en Leuven',
      blocks: [
        { h3: 'Antwerpen' },
        'Rond de **Dageraadplaats in Zurenborg** of op de pleintjes van **Borgerhout** zie je na een paar weken dezelfde mensen op het terras. **Park Spoor Noord** en het **Stadspark** zijn ideaal om aan te sluiten bij een loopgroep. Op zondagochtend is de **Vogelenmarkt** een goede gewoonte om erop uit te trekken, liefst met iemand die je beter wilt leren kennen.',
        { h3: 'Gent' },
        'In Gent zitten studenten en jonge gasten bij mooi weer langs de **Graslei en de Korenlei**. De **Gentse Feesten** in juli zijn het moment om met collega’s of buren mee te gaan. Wie sportief is, vindt aan de **Blaarmeersen** en in het **Citadelpark** loopgroepen en clubs. Veel wijken, zoals Dampoort of Sint-Amandsberg, hebben hun eigen buurtwerking.',
        { h3: 'Brussel' },
        'Brussel is meertalig, en dat is een troef. De **gemeenschapscentra** van de Vlaamse Gemeenschapscommissie, verspreid over de Brusselse gemeenten, organiseren cursussen, eetmomenten en buurtactiviteiten in het Nederlands. In **Muntpunt**, de grote Nederlandstalige bib in het centrum, vind je lezingen en activiteiten om Nederlands te oefenen. En rond **Flagey** of in **Sint-Gillis** ontdek je snel je vaste café.',
        { h3: 'Leuven' },
        'Leuven is een studentenstad, maar ook een stad waar veel jonge mensen na hun studies blijven werken. De **Oude Markt** is het bekende verzamelpunt; voor iets rustigers ga je naar het **Ladeuzeplein** of wandel je naar de **Abdij van Park**. Het **Provinciedomein Kessel-Lo** is ideaal voor een loopgroep of een picknick met nieuwe buren.',
      ],
    },
    {
      title: 'Wat overal werkt',
      blocks: [
        {
          list: [
            '**Een vereniging met een vast uur**: een koor, een sportclub, toneel, een volkstuinproject. Dezelfde mensen elke week, zonder dat je iemand moet uitnodigen.',
            '**Een loopcursus**: veel gemeenten en clubs organiseren beginnersgroepen. Samen van nul naar vijf kilometer schept een band.',
            '**De Dag van de Buren**, eind mei: een goed excuus om aan te bellen bij je buren, of om zelf een straatfeest te helpen organiseren.',
            '**Vrijwilligerswerk**: in een buurthuis, een bib, een voedselbank. Je werkt samen aan iets, en het gesprek komt vanzelf.',
            '**Een taaltafel**: Frans leren in Brussel of Nederlands oefenen met nieuwkomers. Iedereen is er om te praten.',
          ],
        },
        'Het belangrijkste: kies één ding, en hou het twee maanden vol. Na drie of vier keer ben je geen nieuwkomer meer, en een tweede afspraak voorstellen wordt dan heel natuurlijk.',
      ],
    },
  ],
  minimoa: {
    title: 'Hoe Minimoa je helpt',
    blocks: [
      'Minimoa is een app om vrienden te maken in je buurt, beschikbaar in België. Je kweekt er een minimoa, een klein harig wezentje dat op jou lijkt. Hij stelt je voor aan mensen bij jou in de buurt die het leven zien zoals jij, en zegt waarom: drie dingen die jullie gemeen hebben, één verschil om te ontdekken.',
      'Niemand schrijft je zonder jouw ja. Daarna leven jullie minimoa’s mee in de chat: ze breken het ijs, en elke band heeft 7 levens, zodat niemand stilletjes geghost wordt. Om elkaar echt te zien, kies je samen een gewoonte (elke zaterdag lopen in het park) of start je een groep van 3 tot 8 mensen.',
      'Het belangrijkste is gratis, zonder advertenties, vanaf 18 jaar. Je positie wordt afgerond op zo’n 300 meter en is nooit live te volgen. Minimoa gaat buurt per buurt open: bij 50 inschrijvingen gaat je buurt open.',
    ],
  },
  faq: [
    {
      q: 'Hoe maak je nieuwe vrienden als volwassene?',
      a: 'Breng de herhaling terug die je op school of op kot had: een vereniging, een loopgroep of vrijwilligerswerk met een vast uur, liefst dicht bij huis. Stel na een paar keer zelf een tweede afspraak voor, iets concreets en eenvoudigs.',
    },
    {
      q: 'Waar kan ik vrienden maken in mijn buurt?',
      a: 'In je buurthuis of gemeenschapscentrum, op de wekelijkse markt, in een sportclub of koor, en op buurtfeesten zoals de Dag van de Buren. Plekken waar je dezelfde mensen terugziet, werken het best.',
    },
    {
      q: 'Bestaat er een app om vrienden te maken in België?',
      a: 'Ja. Minimoa is beschikbaar in België: je minimoa stelt je voor aan mensen in je buurt die het leven zien zoals jij, en zegt waarom. Gratis, zonder swipes, vanaf 18 jaar.',
    },
    {
      q: 'Is het normaal om op je dertigste geen vrienden meer te hebben?',
      a: 'Het overkomt veel mensen: studievrienden verhuizen, iedereen heeft het druk. Het zegt niets over jou. Begin klein, met één activiteit per week, en geef het tijd: vriendschap groeit uit herhaalde ontmoetingen.',
    },
  ],
  image: { src: '/img/m/duo_check.webp', width: 700, height: 456, alt: 'Nino en Pia, twee minimoa’s, die elkaar een boks geven' },
  og: { lines: ['VRIENDEN', 'MAKEN IN', 'JE BUURT.'], panel: 'accent' },
  ogAlt: 'Harige minimoa’s naast de titel „Vrienden maken in je buurt.”',
  updated: '2026-11-18',
  ui: {
    home: 'Home',
    breadcrumbLabel: 'Kruimelpad',
    crumb: 'Vrienden maken',
    faqTitle: 'Veelgestelde vragen',
    cta: {
      title: 'Laat je minimoa je voorstellen',
      text: 'Ontdek in twee minuten welke minimoa bij je past, of kijk hoe ver je buurt staat. Gratis, nul swipes, vanaf 18 jaar.',
      quiz: 'Welke minimoa ben jij?',
      quartier: 'Open je buurt',
      home: 'Alles over Minimoa',
    },
    updated: 'Bijgewerkt op',
    footer: { label: 'Ontdekken', link: 'Vrienden maken' },
  },
};
