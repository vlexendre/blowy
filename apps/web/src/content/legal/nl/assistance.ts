import type { LegalPage } from '../types';

export const assistance: LegalPage = {
  title: 'Hulp en contact — Blowy',
  heading: 'Hulp',
  description: 'Een vraag, een bug, een probleem met iemand, met je abonnement of met je gegevens? De meest gezochte antwoorden, en hoe je ons schrijft.',
  intro: 'De vragen die we het vaakst krijgen. Niet gevonden? Schrijf ons: er antwoordt een mens, geen minimoa.',
  body: [
    { h2: 'Schrijf ons', id: 'contact' },
    {
      table: {
        head: ['Voor', 'Schrijf naar'],
        rows: [
          ['Een vraag, een bug, een idee', '{{email.support}}'],
          ['Je persoonsgegevens', '{{email.privacy}}'],
          ['Een veiligheidsprobleem, illegale inhoud, een minderjarige', '{{email.safety}}, en meld de persoon ook in de app'],
        ],
      },
    },
    {
      p: 'Gaat het om een bug, vertel ons dan je telefoonmodel, de appversie (onderaan in **Ik → Instellingen**) en wat je aan het doen was. We antwoorden in het Frans of het Engels.',
    },
    { note: '**Direct in gevaar?** Wacht niet op ons antwoord: bel **112** (of **17** in Frankrijk). Zie [veiligheid en melden](@securite).' },

    { h2: 'Veelgestelde vragen', id: 'faq' },
    {
      faq: [
        {
          q: 'Wat is een minimoa?',
          a: [
            'Je minimoa is jij in het klein: hij draagt je kijk op het leven en je gewoontes. Hij stelt je voor aan mensen met een passende kijk, als vrienden of meer. Hoe beter je voor hem zorgt (door naar buiten te gaan, je gewoontes vol te houden), hoe meer mensen hij je voorstelt. Hij gaat nooit dood.',
          ],
        },
        {
          q: 'Hoe kiest mijn minimoa aan wie hij me voorstelt?',
          a: [
            'Hij vergelijkt je kijk (5 assen: thuis, wortels, drive, ritme, koers) met die van anderen, en stelt alleen mensen voor boven 70% compatibiliteit. Elke ontmoeting legt uit waarom: 3 overeenkomsten en 1 verschil. De details staan in het [privacybeleid](@confidentialite#compatibilite).',
          ],
        },
        {
          q: 'Waarom vraagt Blowy om mijn locatie?',
          a: [
            'Voor de kaart en ontmoetingen in de buurt, alleen als de app open is. Voor anderen wordt je positie afgerond en verschoven, en de discrete modus haalt je van de kaart. Zonder locatie werkt de rest van de app gewoon.',
          ],
        },
        {
          q: 'Wie leest mijn berichten?',
          a: [
            'Geen mens leest je gesprekken. Als jullie het allebei aanzetten, leest een AI jullie berichten zodat jullie minimoas kunnen reageren; daarna wordt niets bewaard. Je zet het uit in de opties van de band of in Ik. De enige uitzondering: als een bericht wordt gemeld, leest een moderator dat bericht en de directe context.',
          ],
        },
        {
          q: 'Wat gebeurt er met mijn bewijsfoto’s?',
          a: ['Een AI controleert de foto, geen mens ziet hem, en hij wordt binnen 24 uur verwijderd, tenzij je hem in je privéherinneringen bewaart.'],
        },
        {
          q: 'Ik kan niet meer inloggen. Wat nu?',
          a: [
            'Inloggen gaat via Apple (iPhone) of Google (Android). Gebruik dezelfde Apple ID of hetzelfde Google-account als bij het aanmelden. Werkt het nog steeds niet, schrijf ons dan op {{email.support}}.',
          ],
        },
        {
          q: 'Hoe zeg ik Blowy+ op?',
          a: [
            'In de instellingen van je store, niet in Blowy. iPhone: Instellingen → je naam → Abonnementen. Android: Google Play → profiel → Betalingen en abonnementen → Abonnementen. Details in de [voorwaarden van Blowy+](@abonnement#annuler).',
          ],
        },
        {
          q: 'Hoe krijg ik mijn geld terug?',
          a: ['Betalingen lopen via Apple of Google: zij betalen terug, volgens hun voorwaarden. De links staan in de [voorwaarden van Blowy+](@abonnement#remboursements).'],
        },
        {
          q: 'Hoe meld of blokkeer ik iemand?',
          a: ['In de chat of bij de ontmoeting: menu rechtsboven, dan Melden of Blokkeren. Zie [veiligheid en melden](@securite).'],
        },
        {
          q: 'Hoe verwijder ik mijn account?',
          a: ['Ik → Instellingen → Mijn account verwijderen. Alles staat uitgelegd op de pagina [mijn account verwijderen](@supprimer-mon-compte).'],
        },
        {
          q: 'Hoe krijg ik een kopie van mijn gegevens?',
          a: ['Schrijf naar {{email.privacy}}. We antwoorden binnen een maand. Je rechten staan uitgelegd in het [privacybeleid](@confidentialite#droits).'],
        },
      ],
    },

    { h2: 'Lees ook', id: 'documents' },
    { p: '[Gebruiksvoorwaarden](@conditions) · [Privacy](@confidentialite) · [Communityregels](@regles) · [Colofon](@mentions-legales)' },
  ],
};
