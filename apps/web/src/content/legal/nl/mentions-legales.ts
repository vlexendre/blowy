import type { LegalPage } from '../types';

export const mentionsLegales: LegalPage = {
  title: 'Colofon — Minimoa',
  heading: 'Colofon',
  description: 'Wie Minimoa uitgeeft, wie het host en hoe je ons bereikt.',
  intro: 'Wie de app en de website van Minimoa uitgeeft, wie ze host, en hoe je ons bereikt.',
  body: [
    { h2: 'Uitgever', id: 'editeur' },
    { p: 'De website minimoa.app en de app Minimoa worden uitgegeven door:' },
    {
      ul: [
        '**Naam:** {{publisher.name}}',
        '**Rechtsvorm:** {{publisher.legalForm}}',
        '**Maatschappelijk kapitaal:** {{publisher.shareCapital}}',
        '**Inschrijving (SIREN, RCS):** {{publisher.registration}}',
        '**Btw-nummer:** {{publisher.vatNumber}}',
        '**Statutaire zetel:** {{publisher.address}}',
        '**Telefoon:** {{publisher.phone}}',
        '**E-mail:** {{email.support}}',
      ],
    },
    { h2: 'Verantwoordelijke uitgever', id: 'publication' },
    { p: '{{publisher.publicationDirector}}' },
    { h2: 'Hosting', id: 'hebergement' },
    { h3: 'De website minimoa.app' },
    { ul: ['**Hostingprovider:** {{siteHost.name}}', '**Adres:** {{siteHost.address}}', '**Telefoon:** {{siteHost.phone}}'] },
    { h3: 'De gegevens van de app' },
    {
      ul: [
        '**Hostingprovider:** {{dataHost.name}}',
        '**Adres:** {{dataHost.address}}',
        '**Telefoon:** {{dataHost.phone}}',
        '**Locatie van de servers:** {{dataHost.region}}',
      ],
    },
    { p: 'De volledige lijst van onze dienstverleners staat in het [privacybeleid](@confidentialite#prestataires).' },
    { h2: 'Contact', id: 'contact' },
    {
      ul: [
        'Hulp, vragen, klachten: {{email.support}}.',
        'Persoonsgegevens: {{email.privacy}}.',
        'Veiligheid en illegale inhoud: {{email.safety}}, of de meldknop in de app.',
      ],
    },
    {
      p: '{{email.support}} is ook ons centrale contactpunt voor autoriteiten en gebruikers volgens de Europese digitaledienstenverordening (DSA). We antwoorden in het Frans of het Engels.',
    },
    { h2: 'Illegale inhoud melden', id: 'signaler' },
    {
      p: 'Meld het bericht of de persoon in de app: dat is het snelst (zie [veiligheid en melden](@securite)). Je kunt ook schrijven naar {{email.safety}}, met wat het probleem is, waar het staat en waarom je denkt dat het illegaal is.',
    },
    { h2: 'Intellectueel eigendom', id: 'propriete' },
    {
      p: 'Het merk Minimoa, de minimoas, de illustraties, teksten, animaties en software zijn beschermd door het intellectuele-eigendomsrecht. Ze zijn van {{publisher.name}} of haar partners. Ze kopiëren of hergebruiken zonder toestemming is verboden, behalve wat de wet toestaat (kort citaat, privékopie).',
    },
    { p: 'Lettertype van de website en haar afbeeldingen: Allo (Josh Puckett), onder de SIL Open Font License. Animaties op de homepage: de GSAP-bibliotheek.' },
  ],
};
