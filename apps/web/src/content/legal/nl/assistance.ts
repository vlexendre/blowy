import type { LegalPage } from '../types';

export const assistance: LegalPage = {
  title: 'Hulp en contact — Minimoa',
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
            'Je minimoa is jij in het klein: hij draagt je kijk op het leven en je gewoontes. Hij stelt je voor aan mensen met een passende kijk om banden te leggen. Wat ze worden, is aan jullie. Hoe beter je voor hem zorgt (door naar buiten te gaan, je gewoontes vol te houden), hoe meer mensen hij je voorstelt. Hij gaat nooit dood.',
          ],
        },
        {
          q: 'Hoe kiest mijn minimoa aan wie hij me voorstelt?',
          a: [
            'Hij vergelijkt je kijk (5 assen: thuis, wortels, drive, ritme, koers) met die van anderen, en stelt alleen mensen voor boven 70% compatibiliteit. Elke ontmoeting legt uit waarom: 3 overeenkomsten en 1 verschil. De details staan in het [privacybeleid](@confidentialite#compatibilite).',
          ],
        },
        {
          q: 'Waarom vraagt Minimoa om mijn locatie?',
          a: [
            'Voor de kaart en ontmoetingen in de buurt, alleen als de app open is. Je exacte positie wordt nooit opgeslagen: we bewaren alleen een punt afgerond op ongeveer 300 m. Anderen zien een afgeronde en verschoven positie, en de discrete modus haalt je van de kaart. Zonder locatie kies je zelf je stad (Ontmoetingen, of Ik → Instellingen → Mijn locatie) en krijg je toch ontmoetingen.',
          ],
        },
        {
          q: 'Wie leest mijn berichten?',
          a: [
            'Niemand bij Minimoa leest je gesprekken, behalve een gemeld bericht (gemeld door iemand of door ons automatische filter): een moderator leest dan dat bericht en de directe context ervan. Als jullie het allebei aanzetten, leest een AI, die van onze dienstverlener {{sub.ai.provider}}, jullie laatste berichten zodat jullie minimoa’s kunnen reageren; Minimoa bewaart niets van dat meelezen. Je zet het uit in de opties van de band of via Ik → De AI en jij.',
          ],
        },
        {
          q: 'Wat gebeurt er met mijn bewijsfoto’s?',
          a: [
            'Vóór je eerste bewijs vraagt de app of een AI ({{sub.ai.provider}}) je foto’s mag controleren. Accepteer je, dan wordt de verkleinde foto ernaartoe gestuurd; anders bevestig je je gewoontes op je woord, zonder foto. Geen mens ziet je bewijsfoto’s, en ze worden binnen 24 uur gewist, tenzij je ze in je privéherinneringen bewaart. Je kunt van gedachten veranderen via Ik → De AI en jij.',
          ],
        },
        {
          q: 'Waarom is mijn bericht, voornaam of foto geweigerd?',
          a: [
            'Voornamen, minimoa-namen, berichten en profielfoto’s gaan door een automatisch filter, dat tegenhoudt wat duidelijk tegen de [communityregels](@regles) ingaat. De app vertelt je waarom, en je tekst blijft staan zodat je hem kunt aanpassen. Denk je dat het een vergissing is? Mail naar {{email.support}}: een mens kijkt ernaar.',
          ],
        },
        {
          q: 'Ik kan niet meer inloggen. Wat nu?',
          a: [
            'Inloggen gaat via Apple (iPhone) of Google (Android). Gebruik dezelfde Apple ID of hetzelfde Google-account als bij de aanmelding. Is je account geschorst? Het scherm zegt tot wanneer, en laat je de klantenservice mailen om bezwaar te maken. Werkt het nog steeds niet, mail ons dan via {{email.support}}.',
          ],
        },
        {
          q: 'Hoe zeg ik Minimoa+ op?',
          a: [
            'In de instellingen van je iPhone, niet in Minimoa: Instellingen → je naam → Abonnementen (in de app brengt Ik → Minimoa+ → Mijn abonnement beheren je erheen). Details in de [voorwaarden van Minimoa+](@abonnement#annuler).',
          ],
        },
        {
          q: 'Hoe krijg ik mijn geld terug?',
          a: [
            'Betalingen lopen via Apple: Apple betaalt terug, volgens zijn voorwaarden. De link staat in de [voorwaarden van Minimoa+](@abonnement#remboursements).',
          ],
        },
        {
          q: 'Hoe meld of blokkeer ik iemand?',
          a: [
            'In de chat of bij de ontmoeting, menu “…” rechtsboven en dan Melden of Blokkeren; in een chat kun je een bericht melden door er lang op te drukken. Zie [veiligheid en meldingen](@securite).',
          ],
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
