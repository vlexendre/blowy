import type { LegalPage } from '../types';

export const cookies: LegalPage = {
  title: 'Cookies — Minimoa',
  heading: 'Cookies',
  description: 'De website blowy.app plaatst geen cookies. Wat de site laadt van andere diensten, en wat die diensten ontvangen.',
  intro: 'Korte versie: de website blowy.app plaatst geen cookies. Hier de details, gecontroleerd in de code.',
  body: [
    { h2: 'Wat de website plaatst', id: 'depose' },
    {
      p: 'De website blowy.app plaatst **geen cookies** en slaat niets op in de opslag van je browser (geen local storage, geen session storage). Er zijn geen bezoekersstatistieken, geen reclame en geen knoppen van sociale netwerken. Daarom is er geen toestemmingsbanner.',
    },
    { p: 'Deze pagina gaat alleen over de website. De app Minimoa valt onder het [privacybeleid](@confidentialite).' },

    { h2: 'Wat de website laadt van andere diensten', id: 'tiers' },
    {
      p: 'Om te kunnen worden weergegeven, laadt de website een paar bestanden van andere servers. Die diensten plaatsen op deze manier geen cookies, maar ontvangen, zoals elke webserver, je IP-adres en technische informatie over je browser:',
    },
    {
      table: {
        head: ['Dienst', 'Waarvoor', 'Op welke pagina’s'],
        rows: [
          ['Google Fonts (Google)', 'Het lettertype Anton', 'Alle'],
          ['cdnjs (Cloudflare)', 'De animatiebibliotheek GSAP', 'Homepage'],
          ['Hostingprovider van de website: {{siteHost.name}}', 'De pagina’s leveren', 'Alle'],
          ['Server van de Minimoa-app (API)', 'De voornaam en minimoa van de persoon tonen, de gekozen woorden opslaan', 'Pagina’s “3 woorden” en uitnodiging'],
        ],
      },
    },
    {
      p: 'Op de “3 woorden”-pagina’s bewaren we een niet-omkeerbare vingerafdruk van je IP-adres en browser om dubbele stemmen te beperken (zie het [privacybeleid](@confidentialite#donnees)).',
    },

    { h2: 'Als dit verandert', id: 'changements' },
    {
      p: 'Als de website ooit cookies plaatst die niet strikt noodzakelijk zijn (bezoekersstatistieken bijvoorbeeld), vragen we eerst je toestemming, met een echte knop “weigeren”, en passen we deze pagina aan.',
    },

    { h2: 'Zelf de regie houden', id: 'reglages' },
    {
      p: 'Met je browser kun je cookies blokkeren of verwijderen en verzoeken naar andere sites beperken. De website blijft leesbaar als je externe lettertypen blokkeert: dan gebruikt hij die van je toestel.',
    },
    { p: 'Een vraag: {{email.privacy}}.' },
  ],
};
