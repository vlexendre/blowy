import type { LegalPage } from '../types';

export const securite: LegalPage = {
  title: 'Veiligheid en melden — Blowy',
  heading: 'Veiligheid en melden',
  description: 'Hoe je iemand meldt of blokkeert in Blowy, wat er daarna gebeurt, onze tips voor een eerste afspraak, noodnummers en ons beleid voor de bescherming van minderjarigen.',
  intro: 'Hoe je meldt, blokkeert, jezelf beschermt, en wie je belt in een noodgeval.',
  body: [
    { note: '**Direct in gevaar?** Bel **112** (alarmnummer in de hele Europese Unie). In Frankrijk: **17** (politie), of sms naar **114** als je niet kunt praten.' },

    { h2: 'Iemand melden', id: 'signaler' },
    {
      ol: [
        'Open de chat met de persoon, of zijn kaart bij je ontmoetingen.',
        'Tik op het menu (“…”) en dan op **Melden** (bij een ontmoeting: **Melden of blokkeren**). Voor een specifiek bericht druk je er lang op en kies je **Dit bericht melden**.',
        'Kies de reden: intimidatie, ongepaste inhoud, nepprofiel, minderjarige, of anders.',
        'Voeg eventueel een paar woorden toe (wat er gebeurde, wanneer). Zo kunnen we snel handelen.',
        'Je kunt de persoon tegelijk blokkeren.',
      ],
    },
    {
      p: 'De persoon weet niet dat de melding van jou komt. Heb je de app niet bij de hand? Schrijf naar {{email.safety}} met de voornaam van de persoon en wat er gebeurde.',
    },

    { h2: 'Wat er daarna gebeurt', id: 'suite' },
    {
      ul: [
        'Het moderatieteam krijgt van elke melding **een e-mail**: meteen bij iets dringends (minderjarige, bedreiging), anders in een overzicht. **Doel: een reactie binnen 24 uur**; daarna komt de melding bovenaan de wachtrij.',
        'Een moderator van Blowy leest **het gemelde bericht en de directe context**, en verder niets van je gesprekken.',
        'Afhankelijk van de ernst: verwijdering van de inhoud, waarschuwing, beperking, opschorting of sluiting van het account. Wat illegaal is, kan aan de autoriteiten worden doorgegeven.',
        'Een account dat door twee verschillende mensen als minderjarig is gemeld, wordt automatisch geschorst tot de moderator ernaar kijkt.',
        'De app bevestigt dat je melding is verstuurd. Om ieders privacy te beschermen, houden we je niet op de hoogte van de sanctie.',
      ],
    },

    { h2: 'Iemand blokkeren', id: 'bloquer' },
    {
      p: 'Kies in hetzelfde menu **Blokkeren**. De persoon kan je niet meer schrijven, jullie band verdwijnt, en jullie minimoas komen elkaar niet meer tegen, niet bij ontmoetingen en niet op de kaart. De persoon krijgt geen bericht. Geblokkeerde mensen vind je in **Ik → Instellingen → Geblokkeerde mensen**, waar je ze kunt deblokkeren.',
    },

    { h2: 'Je bescherming in de app', id: 'protections' },
    {
      ul: [
        'Je exacte positie wordt nooit opgeslagen; op de kaart is ze afgerond op ongeveer 300 m en verschoven, nooit live.',
        'Voornamen, berichten en profielfoto’s gaan door een **automatisch filter**: wat duidelijk tegen de [regels](@regles) ingaat, wordt niet gepubliceerd, een grensgeval wordt gemeld aan de moderatie.',
        'Als een band het niveau bereikt waarop jullie elkaar in het echt zien, herinnert de app je aan deze veiligheidstips.',
        'De **discrete modus** haalt je van de kaart.',
        'Niets gebeurt zonder jouw akkoord: jij zwaait, de ander accepteert, de band ontstaat.',
        'Je kunt een band altijd verlaten.',
      ],
    },

    { h2: 'Voordat je iemand in het echt ziet', id: 'rencontre' },
    {
      ul: [
        '**Neem je tijd.** Praat eerst in de app. Als iemand je opjaagt, is dat een signaal.',
        '**Een openbare plek**, de eerste keer: een café, een druk park. Niet bij jou thuis, niet bij de ander.',
        '**Laat iemand het weten**: waar, wanneer, met wie. Spreek een berichtje af tijdens of na de afspraak.',
        '**Blijf zelfstandig**: ga en kom terug op eigen gelegenheid. Houd je telefoon opgeladen.',
        '**Geef niet te snel** je adres, je werkplek of privégegevens.',
        '**Nooit geld.** Niemand heeft een goede reden om je erom te vragen. Meld het.',
        '**Let op je drankje**, en op wat je gebruikt.',
        '**Luister naar jezelf**: voelt iets niet goed, dan kun je gaan, zonder uitleg.',
      ],
    },
    { p: 'Een compatibiliteit, hoe hoog ook, garandeert niets over een persoon. Blowy controleert de identiteit van gebruikers niet.' },

    { h2: 'Handige nummers', id: 'urgences' },
    {
      table: {
        head: ['Nummer', 'Waarvoor'],
        rows: [
          ['**112**', 'Noodgevallen, vanuit elk land van de Europese Unie'],
          ['**17**', 'Politie, gendarmerie (Frankrijk)'],
          ['**15**', 'Medisch noodgeval, SAMU (Frankrijk)'],
          ['**18**', 'Brandweer (Frankrijk)'],
          ['**114**', 'Noodgevallen via sms, voor doven, slechthorenden of mensen die niet kunnen praten (Frankrijk)'],
          ['**3919**', 'Geweld tegen vrouwen, gratis en anoniem (Frankrijk)'],
          ['**3018**', 'Cyberpesten en online geweld, gratis en vertrouwelijk (Frankrijk)'],
          ['**119**', 'Kinderen in gevaar (Frankrijk)'],
        ],
      },
    },
    {
      p: 'Illegale inhoud online kun je ook melden op het officiële Franse platform [internet-signalement.gouv.fr](https://www.internet-signalement.gouv.fr). Buiten Frankrijk bel je 112 of de noodnummers van je land.',
    },

    { h2: 'Bescherming van minderjarigen', id: 'mineurs' },
    {
      p: 'Blowy is alleen voor volwassenen van 18 jaar en ouder. De geboortedatum wordt gevraagd vóór het inloggen; onder de 18 stopt de aanmelding en wordt er niets aangemaakt.',
    },
    {
      p: '**Nultolerantie** voor elke inhoud of elk gedrag dat een minderjarige seksualiseert of in gevaar brengt. Zodra we ervan weten: de inhoud wordt verwijderd, het account wordt definitief gesloten, en de feiten worden gemeld bij de bevoegde autoriteiten.',
    },
    {
      ul: [
        'In de app: **Melden**, reden “Minderjarige”.',
        'Per e-mail: {{email.safety}}.',
        'In Frankrijk kun je ook melden op [internet-signalement.gouv.fr](https://www.internet-signalement.gouv.fr), of **119** bellen als een kind in gevaar is.',
      ],
    },
    { p: 'Meer weten: [communityregels](@regles), [gebruiksvoorwaarden](@conditions#moderation).' },
  ],
};
