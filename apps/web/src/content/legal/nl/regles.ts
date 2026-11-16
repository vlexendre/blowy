import type { LegalPage } from '../types';

export const regles: LegalPage = {
  title: 'Communityregels — Minimoa',
  heading: 'Communityregels',
  description: 'De regels van Minimoa: respect, toestemming, geen intimidatie, geen minderjarigen, geen seksuele inhoud. Wat er gebeurt als ze niet worden nageleefd.',
  intro: 'Minimoas, met echte mensen erachter. Om er een plek van te houden waar je graag terugkomt, een paar simpele regels.',
  body: [
    { h2: 'Respecteer mensen', id: 'respect' },
    { p: 'Achter elke minimoa zit een echt mens. Humor, ja; vernedering, nee. Je kunt het oneens zijn zonder te kwetsen.' },

    { h2: 'Nee is nee', id: 'consentement' },
    {
      p: 'Als iemand niet antwoordt, niet terugzwaait, een band verlaat of je blokkeert, is dat zijn keuze. Je blijft niet aandringen, je maakt geen nieuw account om een afwijzing te omzeilen, en je zoekt de persoon niet ergens anders op.',
    },

    { h2: 'Geen intimidatie of haat', id: 'harcelement' },
    {
      p: 'Verboden: beledigingen, bedreigingen, chantage, herhaalde ongewenste berichten, spot met iemands uiterlijk, afkomst, geloof, gender, seksuele geaardheid of beperking, oproepen tot haat of geweld.',
    },

    { h2: '18 jaar en ouder, zonder uitzondering', id: 'majeurs' },
    {
      p: 'Minimoa is alleen voor volwassenen. Elk account van een minderjarige wordt verwijderd. Elke inhoud die een minderjarige seksualiseert wordt verwijderd, de maker wordt uitgesloten en we melden het bij de autoriteiten. Denk je dat je met een minderjarige praat? Meld die persoon met de reden “Minderjarige”.',
    },

    { h2: 'Geen naaktheid of seksuele inhoud', id: 'contenus' },
    {
      p: 'Niet in berichten, niet als profielfoto, niet als bewijsfoto. Ook geen gewelddadige, schokkende of illegale inhoud. Een bewijsfoto is je sneakers, je boek, je bord: niet jij in je ondergoed.',
    },

    { h2: 'Wees jezelf', id: 'authenticite' },
    { p: 'Eén account per persoon, voor een echte persoon. Geen nepprofielen, geen identiteitsfraude. En niet valsspelen: geen nepbewijsfoto’s, geen vervalste locatie.' },

    { h2: 'Geen oplichting of handel', id: 'arnaques' },
    {
      p: 'Je vraagt niet om geld, cadeaus of codes. Geen reclame, geen spam, geen dubieuze links, geen betaalde seksuele diensten. Vraagt iemand je om geld? Meld het.',
    },

    { h2: 'Bescherm de privacy van anderen', id: 'vie-privee' },
    { p: 'Deel niemands adres, nummer, foto’s of berichten zonder toestemming. Wat in een band wordt gezegd, blijft in de band.' },

    { h2: 'Wat er gebeurt als een regel wordt overtreden', id: 'sanctions' },
    {
      p: 'Voornamen, minimoa-namen, berichten en profielfoto’s gaan door een **automatisch filter**: wat duidelijk tegen deze regels ingaat, wordt niet gepubliceerd, en de app zegt waarom; een grensgeval (een belediging, bijvoorbeeld) wordt wel verstuurd, maar gemeld aan het moderatieteam. Elke melding, van een persoon of van het filter, waarschuwt het team, dat ze bekijkt met als doel een reactie binnen 24 uur. Een moderator kan het gemelde bericht en de directe context lezen, verder niets. Afhankelijk van de ernst:',
    },
    {
      ol: [
        'wordt de inhoud verwijderd;',
        'krijgt de persoon een waarschuwing;',
        'worden sommige functies beperkt, of wordt het account opgeschort;',
        'wordt het account definitief gesloten, bij ernstige zaken meteen de eerste keer (minderjarigen, bedreigingen, geweld, oplichting).',
      ],
    },
    {
      p: 'Twee gevallen schorsen een account automatisch, maximaal 72 uur, terwijl een moderator ernaar kijkt: expliciete pedoseksuele woordenschat in een bericht, of een account dat door twee verschillende mensen als minderjarig is gemeld. Wat illegaal is, kan aan de autoriteiten worden gemeld. De betrokkene krijgt de redenen van de beslissing en kan er bezwaar tegen maken, of ze nu automatisch was of niet ([gebruiksvoorwaarden](@conditions#moderation)).',
    },

    { h2: 'Melden en blokkeren', id: 'signaler' },
    {
      p: 'Open in een chat of bij een ontmoeting het menu en kies **Melden** of **Blokkeren**; in een chat kun je een bericht ook melden door er lang op te drukken. De persoon weet niet wie hem heeft gemeld, en krijgt geen bericht van een blokkade. Alles wordt uitgelegd in [veiligheid en melden](@securite).',
    },
    { p: 'Deze regels maken deel uit van de [gebruiksvoorwaarden](@conditions). Een vraag of twijfel: {{email.support}}. Er antwoordt een mens, geen minimoa.' },
  ],
};
