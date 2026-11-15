import type { LegalPage } from '../types';

export const supprimerMonCompte: LegalPage = {
  title: 'Mijn account en gegevens verwijderen — Blowy',
  heading: 'Mijn account verwijderen',
  description: 'Hoe je je Blowy-account en je gegevens verwijdert, wat er wordt gewist en wanneer, wat er wordt bewaard en waarom.',
  intro: 'Je kunt je account en je gegevens verwijderen wanneer je wilt, direct in de app. Zo werkt het, en dit wordt gewist.',
  body: [
    { h2: 'In de app', id: 'app' },
    { ol: ['Open het tabblad **Ik**.', 'Tik op **Instellingen**.', 'Tik op **Mijn account verwijderen**.', 'Typ het bevestigingswoord dat op het scherm staat.'] },
    { p: 'Dit is direct en definitief: daarna kan niets meer worden teruggehaald.' },
    {
      note: '**Heb je Blowy+?** Je account verwijderen zegt het abonnement niet op. Zeg het eerst op in de instellingen van je store ([hoe](@abonnement#annuler)).',
    },

    { h2: 'Zonder de app', id: 'sans-app' },
    {
      p: 'Kun je niet meer in de app? Schrijf naar {{email.privacy}}, zo mogelijk vanaf het e-mailadres dat aan je Apple- of Google-account is gekoppeld, en vraag om verwijdering van je account. We kunnen je vragen te bevestigen dat het account van jou is. We regelen het binnen hoogstens een maand en bevestigen als het klaar is.',
    },

    { h2: 'Wat meteen wordt gewist', id: 'efface' },
    {
      ul: [
        'je account, je voornaam, je geboortedatum, je geslacht, wat je zoekt;',
        'je minimoa, zijn kijk, zijn stijl, zijn voorwerpen, je gewoontes, je reeks;',
        'je locatie en je geschatte thuisgebied;',
        'je banden, met hun berichten, foto’s en mijlpalen. **Ze verdwijnen ook voor de andere mensen**;',
        'als herinnering bewaarde bewijsfoto’s;',
        'de ontvangen “3 woorden”, je uitnodigingen;',
        'je instellingen en de toestemming om je meldingen te sturen.',
      ],
    },

    { h2: 'Wat wordt bewaard, en waarom', id: 'garde' },
    {
      table: {
        head: ['Wat', 'Waarom', 'Hoe lang'],
        rows: [
          ['Technische back-ups', 'De dienst kunnen herstellen na een storing', 'Overschreven naarmate ze roteren, uiterlijk 30 dagen later'],
          ['Meldingen en moderatiebeslissingen', 'De veiligheid van anderen en wettelijke verplichtingen. Ze zijn niet meer aan je account gekoppeld.', '1 jaar na afsluiting van het dossier, langer als een gerechtelijke procedure dat vereist'],
          ['Bij definitieve uitsluiting: een technische identificatie van je Apple- of Google-account', 'Opnieuw aanmelden voorkomen', '3 jaar'],
          ['Referenties van Blowy+-aankopen', 'Boekhoudkundige verplichtingen', 'Tot 10 jaar'],
          ['Wettelijk verplichte verbindingsgegevens', 'Verzoeken van de autoriteiten beantwoorden', 'De wettelijke termijn, hoogstens een jaar'],
          ['Geaggregeerde statistieken', 'De dienst sturen. Je bent er niet mee te identificeren.', 'Onbeperkt'],
        ],
      },
    },
    {
      p: 'De “3 woorden” die jij voor anderen hebt gekozen, blijven op hun account staan: ze zijn anoniem. Apple of Google bewaren hun eigen aankoop- en inloggegevens, volgens hun beleid. Je kunt Blowy ook verwijderen uit de apps die aan je Apple ID of Google-account gekoppeld zijn.',
    },

    { h2: 'Een vraag', id: 'question' },
    { p: 'Schrijf naar {{email.privacy}}. Wat we bewaren en waarom staat in detail in het [privacybeleid](@confidentialite#durees).' },
  ],
};
