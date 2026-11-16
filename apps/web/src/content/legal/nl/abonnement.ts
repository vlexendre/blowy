import type { LegalPage } from '../types';

export const abonnement: LegalPage = {
  title: 'Voorwaarden van het Minimoa+-abonnement — Minimoa',
  heading: 'Voorwaarden van het Minimoa+-abonnement',
  description:
    'Minimoa+: wat het bevat, de abonnementen (€ 59,88 per jaar met 7 dagen gratis, of € 14,99 per maand), automatische verlenging, facturatie door Apple, opzeggen, wat er aan het einde gebeurt, herroeping en terugbetalingen.',
  intro: 'Wat Minimoa+ bevat, wat het kost, hoe het wordt verlengd en hoe je stopt. Zonder kleine lettertjes.',
  summary: {
    title: 'In het kort',
    items: [
      '**€ 59,88 per jaar**, met **7 dagen gratis** aan het begin, of **€ 14,99 per maand**, zonder proefperiode.',
      'Het abonnement **wordt automatisch verlengd** zolang je het niet opzegt.',
      'Minimoa+ koop je op iPhone: **Apple** factureert je, en je zegt op in de instellingen van je iPhone.',
      'Op dag 5 van de proefperiode laten we het je weten **via een melding en per e-mail**.',
      'De app of je account verwijderen **zegt het abonnement niet op**.',
      'Minimoa blijft gratis zonder Minimoa+.',
    ],
  },
  body: [
    { h2: 'Wat Minimoa+ toevoegt', id: 'contenu' },
    {
      ul: [
        '**De hele kaart**, en **van stad wisselen wanneer je wilt**, zonder te verhuizen. Zonder Minimoa+ zie je je gebied (ongeveer 1,5 km om je heen); zonder locatie kies je zelf je stad, maximaal eens per 30 dagen.',
        '**Elke dag één ontmoeting extra.**',
        '**3 reeksjokers per week** om je reeks te beschermen (zonder Minimoa+: één per week).',
        '**Tot 6 gewoontes** tegelijk (zonder Minimoa+: 2).',
        'Het **uitgebreide zondagsoverzicht**: hoe je kijk over 4 weken is veranderd en een check-up van elke band.',
        '**Je minimoa een andere naam geven wanneer je wilt** (zonder Minimoa+: eens per 60 dagen).',
        '**Alle premiumvoorwerpen uit de kledingkast**: ze zijn van je minimoa en kunnen meteen worden gedragen, zolang het abonnement loopt.',
      ],
    },
    { p: 'De precieze inhoud kan met de app veranderen. Als we een belangrijke Minimoa+-functie schrappen, laten we het je vooraf weten en kun je opzeggen.' },

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
      p: 'De prijzen zijn inclusief belastingen, voor Frankrijk. In andere landen toont de App Store de prijs in je eigen valuta, die kan verschillen. De geldende prijs is die welke de App Store toont op het moment dat je de aankoop bevestigt.',
    },

    { h2: 'De gratis proefperiode', id: 'essai' },
    {
      ul: [
        'De proefperiode van 7 dagen geldt alleen voor het jaarabonnement, en alleen voor een nieuw abonnement, onder de voorwaarden van Apple (meestal één proefperiode per Apple-account).',
        'Tijdens de proefperiode is heel Minimoa+ open en betaal je niets.',
        'Op dag 5 sturen we je een herinnering: nog 2 dagen. Die komt via een melding (als je die hebt toegestaan) en per e-mail, naar het adres van je Apple-account.',
        'Zeg je niet **minstens 24 uur voor het einde van de proefperiode** op, dan wordt op dag 7 de eerste betaling van € 59,88 afgeschreven en begint het jaarabonnement.',
        'Zeg je op tijdens de proefperiode, dan houd je Minimoa+ tot het einde van de 7 dagen en betaal je niets.',
      ],
    },

    { h2: 'Betaling en automatische verlenging', id: 'renouvellement' },
    {
      ul: [
        'Je koopt in de app, op iPhone, via de **App Store**. De betaling wordt afgeschreven van de betaalmethode van je Apple-account, bij het bevestigen van de aankoop of aan het einde van de proefperiode. Op Android en op het web is Minimoa+ niet te koop; een abonnement dat je op iPhone neemt, volgt je Minimoa-account overal.',
        'Het abonnement **wordt automatisch verlengd** voor dezelfde periode (een jaar of een maand), tegen dezelfde prijs, tenzij je het **minstens 24 uur voor het einde van de lopende periode** opzegt.',
        'Als de prijs verandert, laat Apple het je vooraf weten, volgens zijn regels, en vraagt je akkoord als die regels dat vereisen.',
        'We ontvangen nooit je bankgegevens. Apple bevestigt ons alleen de aankoop, die onze server bij Apple controleert.',
        'Nieuwe telefoon? Gebruik **Aankopen herstellen** in de app, met hetzelfde Apple-account.',
      ],
    },

    { h2: 'Opzeggen', id: 'annuler' },
    { p: 'Je zegt op in de instellingen van je iPhone, niet in Minimoa (in de app brengt **Ik → Minimoa+ → Mijn abonnement beheren** je erheen):' },
    { ul: ['**iPhone:** Instellingen → je naam → Abonnementen → Minimoa → Zeg abonnement op.'] },
    {
      p: 'Na het opzeggen blijft Minimoa+ open tot het einde van de al betaalde periode, daarna gaat je account terug naar de gratis versie. Je minimoa, je banden en je gegevens blijven.',
    },
    { note: '**De app of je Minimoa-account verwijderen zegt het abonnement niet op.** Zeg het eerst op in de instellingen van je iPhone, anders wordt het gewoon gefactureerd.' },

    { h2: 'Als Minimoa+ stopt', id: 'fin' },
    {
      ul: [
        'De kaart gaat terug naar je gebied (of naar de stad die je zelf koos); de stad die je met Minimoa+ koos, blijft bewaard en komt terug met een nieuw abonnement.',
        'Eén ontmoeting minder per dag, één joker per week, het eenvoudige zondagsoverzicht, een nieuwe naam eens per 60 dagen.',
        'De gewoontes die je al volgt, blijven; je kunt er alleen een toevoegen als je er minder dan 2 hebt.',
        'Je minimoa **ruimt de premiumvoorwerpen op**: ze worden weer vergrendeld, en komen terug met een nieuw abonnement.',
        'Verder wordt er niets gewist: je minimoa, je banden, je reeksen en de verdiende voorwerpen blijven.',
      ],
    },

    { h2: 'Herroepingsrecht', id: 'retractation' },
    {
      p: 'Als consument in de Europese Unie heb je in principe 14 dagen om een overeenkomst op afstand te herroepen. Minimoa+ is een digitale dienst die direct wordt geleverd: door je te abonneren vraag je dat de toegang meteen begint. Herroep je binnen die termijn, dan kan een bedrag naar verhouding van de al geleverde dienst worden ingehouden, onder de voorwaarden van de wet.',
    },
    { p: 'Omdat de aankoop bij Apple wordt gedaan, vraag je de herroeping bij Apple aan:' },
    { ul: ['**Apple:** [reportaproblem.apple.com](https://reportaproblem.apple.com), of via de aankoopgeschiedenis van je account.'] },
    { p: 'Tijdens de gratis proefperiode valt er niets te herroepen: zeg gewoon voor het einde op om niets te betalen.' },

    { h2: 'Terugbetalingen', id: 'remboursements' },
    {
      p: 'Omdat de betalingen door Apple worden geïnd, **kan alleen Apple terugbetalen**, volgens zijn eigen voorwaarden. Wij kunnen dat niet in hun plaats doen. Werkte Minimoa+ niet zoals verwacht, mail ons dan ook via {{email.support}}: we helpen je, en je consumentenrechten (met name de wettelijke conformiteitsgarantie) blijven volledig van toepassing.',
    },

    { h2: 'Als je account wordt opgeschort of gesloten', id: 'sanctions' },
    {
      p: 'Wordt je account gesloten wegens een ernstige schending van de [gebruiksvoorwaarden](@conditions), dan stopt ook de toegang tot Minimoa+. Vergeet niet het abonnement op te zeggen in de instellingen van je iPhone. Als we de dienst stoppen, laten we het je minstens 30 dagen vooraf weten en leggen we uit hoe je de ongebruikte periode terugbetaald krijgt.',
    },

    { h2: 'De rest', id: 'reste' },
    {
      p: 'Deze voorwaarden vullen de [gebruiksvoorwaarden](@conditions) aan, die ook voor Minimoa+ gelden (met name het toepasselijk recht en de bemiddeling). De voorwaarden van Apple gelden voor de aankoop zelf. Een vraag: {{email.support}}.',
    },
  ],
};
