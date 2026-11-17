import type { LegalPage } from '../types';

export const supprimerMonCompte: LegalPage = {
  title: 'Mijn account en gegevens verwijderen — Minimoa',
  heading: 'Mijn account verwijderen',
  description: 'Hoe je je Minimoa-account en je gegevens verwijdert, wat er wordt gewist en wanneer, wat er wordt bewaard en waarom.',
  intro: 'Je kunt je account en je gegevens verwijderen wanneer je wilt, direct in de app. Zo werkt het, en dit wordt gewist.',
  body: [
    { h2: 'In de app', id: 'app' },
    { ol: ['Open het tabblad **Ik**.', 'Tik op **Instellingen**.', 'Tik op **Mijn account verwijderen**.', 'Typ het bevestigingswoord dat op het scherm staat.'] },
    { p: 'Dit is direct en definitief: daarna kan niets meer worden teruggehaald.' },
    {
      note: '**Heb je Minimoa+?** Je account verwijderen zegt het abonnement niet op. Zeg het eerst op in de instellingen van je iPhone ([hoe](@abonnement#annuler)).',
    },

    { h2: 'Zonder de app', id: 'sans-app' },
    {
      p: 'Kun je niet meer in de app? Schrijf naar {{email.privacy}}, zo mogelijk vanaf het e-mailadres dat aan je Apple- of Google-account is gekoppeld, en vraag om verwijdering van je account. We kunnen je vragen te bevestigen dat het account van jou is. We regelen het binnen hoogstens een maand en bevestigen als het klaar is.',
    },

    { h2: 'Wat meteen wordt gewist', id: 'efface' },
    {
      ul: [
        'je account, je voornaam, je geboortedatum, je geslacht, je profielfoto;',
        'je Apple-inlogtoken, nadat de toegang van Minimoa tot je Apple ID bij Apple is ingetrokken;',
        'je minimoa, zijn kijk, zijn stijl, zijn voorwerpen, je gewoontes, je reeks;',
        'je afgeronde positie, je geschatte woongebied of de stad die je koos;',
        'je banden, met hun berichten, oude foto’s van de dag en mijlpalen. **Ze verdwijnen ook voor de andere mensen**;',
        'je bewijs- en uitdagingsfoto’s, bewaard als herinnering of nog niet gewist;',
        'de “3 woorden” die je kreeg, je uitnodigingen;',
        'je instellingen en de toestemming om je meldingen te sturen.',
      ],
    },

    { h2: 'Wat wordt bewaard, en waarom', id: 'garde' },
    {
      table: {
        head: ['Wat', 'Waarom', 'Hoe lang'],
        rows: [
          ['Technische back-ups', 'De dienst kunnen herstellen na een storing', 'Overschreven naarmate ze roteren: {{dataHost.backupRetention}}'],
          ['Meldingen en moderatiebeslissingen', 'De veiligheid van anderen en wettelijke verplichtingen. Ze zijn aan geen enkel account meer gekoppeld; het logboek van beslissingen bewaart de betrokken voornaam.', '1 jaar na het sluiten van het dossier (een melding die nog open is: tot ze is behandeld, daarna 1 jaar), alleen langer als de wet dat vereist'],
          ['Bij definitieve uitsluiting: een niet-omkeerbare vingerafdruk van je Apple- of Google-identificatie', 'Een nieuwe aanmelding voorkomen', '3 jaar'],
          ['Referenties van Minimoa+-aankopen', 'Boekhoudkundige verplichtingen. Ze zijn aan geen enkel account meer gekoppeld.', 'Tot 10 jaar'],
          ['Activiteitsdagen en interne ranglijst (statistieken)', 'De cijfers van de dienst berekenen', 'Maximaal 40 dagen'],
          ['Geaggregeerde statistieken', 'De dienst sturen. Je bent er niet mee te identificeren.', 'Onbeperkt'],
        ],
      },
    },
    {
      p: 'De “3 woorden” die jij voor anderen hebt gekozen, blijven op hun account staan: ze zijn anoniem. Apple of Google bewaren hun eigen aankoop- en inloggegevens, volgens hun beleid. Bij Apple haalt de verwijdering Minimoa ook weg uit de apps die je Apple ID gebruiken; bij Google kun je dat via je Google-account doen. Wat al naar onze AI-provider is gestuurd, volgt wat die aan zijn kant bewaart ([privacybeleid](@confidentialite#ia)).',
    },

    { h2: 'Een vraag', id: 'question' },
    { p: 'Schrijf naar {{email.privacy}}. Wat we bewaren en waarom staat in detail in het [privacybeleid](@confidentialite#durees).' },
  ],
};
