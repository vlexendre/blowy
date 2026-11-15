import type { LegalUi } from '../types';

export const ui: LegalUi = {
  skip: 'naar de inhoud',
  download: 'downloaden',
  updated: 'Laatst bijgewerkt:',
  translationNotice: 'Dit is een vertaling. Als ze afwijkt van de Franse versie, geldt de Franse versie.',
  frenchVersion: 'Lees de Franse versie',
  languageLabel: 'Taal',
  tocLabel: 'Inhoud',
  otherDocs: 'Andere documenten',
  footerLabel: 'juridische links',
  footerLinks: [
    { slug: 'assistance', label: 'hulp' },
    { slug: 'mentions-legales', label: 'colofon' },
    { slug: 'conditions', label: 'voorwaarden' },
    { slug: 'confidentialite', label: 'privacy' },
    { slug: 'index', label: 'alles juridisch' },
  ],
  index: {
    title: 'Juridische informatie — Blowy',
    heading: 'Juridische informatie',
    description: 'Alle juridische documenten van Blowy: colofon, voorwaarden, privacy, Blowy+, regels, cookies, veiligheid, account verwijderen, hulp.',
    intro: 'Alles wat Blowy regelt, op één plek. De Franse versie is leidend.',
    publisherTitle: 'Wie Blowy uitgeeft',
    publisherText:
      'Blowy wordt uitgegeven door **{{publisher.name}}**. De details (rechtsvorm, inschrijving, adres, hostingproviders) staan in het [colofon](@mentions-legales). Schrijf ons: {{email.support}}.',
  },
  short: {
    'mentions-legales': 'Colofon',
    conditions: 'Gebruiksvoorwaarden',
    confidentialite: 'Privacy',
    abonnement: 'Blowy+-abonnement',
    regles: 'Communityregels',
    cookies: 'Cookies',
    securite: 'Veiligheid en melden',
    'supprimer-mon-compte': 'Mijn account verwijderen',
    assistance: 'Hulp',
  },
};
