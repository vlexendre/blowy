import type { LegalPage } from '../types';

export const abonnement: LegalPage = {
  title: 'Voorwaarden van het Blowy+-abonnement — Blowy',
  heading: 'Voorwaarden van het Blowy+-abonnement',
  description:
    'Blowy+: de abonnementen (€ 59,88 per jaar met 7 dagen gratis, of € 14,99 per maand), automatische verlenging, facturatie door Apple of Google, opzeggen, herroeping en terugbetalingen.',
  intro: 'Wat Blowy+ bevat, wat het kost, hoe het wordt verlengd en hoe je stopt. Zonder kleine lettertjes.',
  summary: {
    title: 'In het kort',
    items: [
      '**€ 59,88 per jaar**, met **7 dagen gratis** aan het begin, of **€ 14,99 per maand**, zonder proefperiode.',
      'Het abonnement **wordt automatisch verlengd** zolang je het niet opzegt.',
      '**Apple of Google** factureert je, en je zegt op in de instellingen van je store.',
      'De app of je account verwijderen **zegt het abonnement niet op**.',
      'Blowy blijft gratis zonder Blowy+.',
    ],
  },
  body: [
    { h2: 'Wat Blowy+ toevoegt', id: 'contenu' },
    {
      ul: [
        '**De hele kaart**, en de mogelijkheid om **van stad te wisselen** zonder je te verplaatsen (zonder Blowy+ zie je je eigen gebied, ongeveer 1,5 km om je heen).',
        '**Meer ontmoetingen.**',
        '**Meer jokers** om je reeks te beschermen (zonder Blowy+: één gratis joker per week).',
        '**6 gewoontes** in plaats van 2.',
        'Een **uitgebreid weekoverzicht**: hoe je kijk zich over 4 weken ontwikkelt en een check van elke band.',
        '**Je minimoa vrij hernoemen** (zonder Blowy+: eens per 60 dagen).',
        '**Premium voorwerpen**.',
      ],
    },
    { p: 'De precieze inhoud kan met de app veranderen. Als we een belangrijke functie van Blowy+ schrappen, laten we het je vooraf weten en kun je opzeggen.' },

    { h2: 'Abonnementen en prijzen', id: 'offres' },
    {
      table: {
        head: ['Abonnement', 'Prijs', 'Gratis proefperiode'],
        rows: [
          ['Jaarlijks', '€ 59,88 per jaar, oftewel € 4,99 per maand', '7 dagen, daarna € 59,88 per jaar'],
          ['Maandelijks', '€ 14,99 per maand', 'Geen proefperiode'],
        ],
      },
    },
    {
      p: 'De prijzen zijn inclusief belastingen, voor Frankrijk. In andere landen toont de store de prijs in jouw valuta, die kan afwijken. De prijs die geldt, is de prijs die de App Store of Google Play toont op het moment dat je de aankoop bevestigt.',
    },

    { h2: 'De gratis proefperiode', id: 'essai' },
    {
      ul: [
        'De proefperiode van 7 dagen geldt alleen voor het jaarabonnement, en alleen voor een nieuw abonnement, volgens de voorwaarden van de store (meestal één proefperiode per Apple- of Google-account).',
        'Tijdens de proefperiode is heel Blowy+ ontgrendeld en betaal je niets.',
        'Op dag 5 sturen we je een herinnering: nog 2 dagen.',
        'Zeg je niet **minstens 24 uur voor het einde van de proefperiode** op, dan wordt de eerste betaling van € 59,88 op dag 7 afgeschreven en begint het jaarabonnement.',
        'Zeg je op tijdens de proefperiode, dan houd je Blowy+ tot het einde van de 7 dagen en betaal je niets.',
      ],
    },

    { h2: 'Betaling en automatische verlenging', id: 'renouvellement' },
    {
      ul: [
        'Je koopt in de app, via de **App Store** (iPhone) of **Google Play** (Android). De betaling gaat van de betaalmethode van je Apple- of Google-account, bij het bevestigen van de aankoop of aan het einde van de proefperiode.',
        'Het abonnement **wordt automatisch verlengd** voor dezelfde periode (een jaar of een maand), tegen dezelfde prijs, tenzij je het **minstens 24 uur voor het einde van de lopende periode** opzegt.',
        'Als de prijs verandert, laat de store het je vooraf weten, volgens zijn regels, en vraagt hij je akkoord als die regels dat vereisen.',
        'We ontvangen nooit je bankgegevens. De store bevestigt ons alleen de aankoop, die onze server bij de store controleert.',
        'Nieuwe telefoon? Gebruik **Aankopen herstellen** in de app, met hetzelfde Apple- of Google-account.',
      ],
    },

    { h2: 'Opzeggen', id: 'annuler' },
    { p: 'Je zegt op in de instellingen van je store, niet in Blowy:' },
    {
      ul: [
        '**iPhone:** Instellingen → je naam → Abonnementen → Blowy → Zeg abonnement op.',
        '**Android:** Google Play → je profiel → Betalingen en abonnementen → Abonnementen → Blowy → Abonnement opzeggen.',
      ],
    },
    {
      p: 'Na het opzeggen blijft Blowy+ ontgrendeld tot het einde van de al betaalde periode; daarna gaat je account terug naar de gratis versie. Je minimoa, je banden en je gegevens blijven.',
    },
    { note: '**De app of je Blowy-account verwijderen zegt het abonnement niet op.** Zeg het eerst op in je store, anders wordt het gewoon gefactureerd.' },

    { h2: 'Herroepingsrecht', id: 'retractation' },
    {
      p: 'Als consument in de Europese Unie heb je in principe 14 dagen om een overeenkomst op afstand te herroepen. Blowy+ is een digitale dienst die direct wordt geleverd: door je te abonneren vraag je dat de toegang meteen begint. Herroep je binnen die termijn, dan kan een bedrag naar verhouding van de al geleverde dienst worden ingehouden, onder de voorwaarden van de wet.',
    },
    { p: 'Omdat de aankoop bij Apple of Google wordt gedaan, vraag je de herroeping bij hen aan:' },
    {
      ul: [
        '**Apple:** [reportaproblem.apple.com](https://reportaproblem.apple.com), of via de aankoopgeschiedenis van je account.',
        '**Google:** via je bestelgeschiedenis in Google Play ([hulp van Google Play](https://support.google.com/googleplay/answer/2479637)).',
      ],
    },
    { p: 'Tijdens de gratis proefperiode valt er niets te herroepen: zeg gewoon voor het einde op om niets te betalen.' },

    { h2: 'Terugbetalingen', id: 'remboursements' },
    {
      p: 'Omdat de betalingen door Apple of Google worden geïnd, **kunnen alleen zij terugbetalen**, volgens hun eigen voorwaarden. Wij kunnen dat niet in hun plaats doen. Werkte Blowy+ niet zoals het hoort? Schrijf ons dan ook op {{email.support}}: we helpen je, en je rechten als consument (met name de wettelijke conformiteitsgarantie) blijven volledig gelden.',
    },

    { h2: 'Als je account wordt opgeschort of gesloten', id: 'sanctions' },
    {
      p: 'Wordt je account gesloten wegens een ernstige overtreding van de [gebruiksvoorwaarden](@conditions), dan stopt ook de toegang tot Blowy+. Vergeet niet het abonnement in je store op te zeggen. Als we met de dienst stoppen, laten we het je minstens 30 dagen van tevoren weten en leggen we uit hoe je de ongebruikte periode terugbetaald krijgt.',
    },

    { h2: 'De rest', id: 'reste' },
    {
      p: 'Deze voorwaarden vullen de [gebruiksvoorwaarden](@conditions) aan, die ook voor Blowy+ gelden (met name het toepasselijk recht en de bemiddeling). Op de aankoop zelf zijn de voorwaarden van Apple of Google van toepassing. Een vraag: {{email.support}}.',
    },
  ],
};
