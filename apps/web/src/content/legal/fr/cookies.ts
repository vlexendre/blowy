import type { LegalPage } from '../types';

export const cookies: LegalPage = {
  title: 'Cookies — Minimoa',
  heading: 'Cookies',
  description: 'Le site blowy.app ne dépose aucun cookie. Ce qu’il charge depuis d’autres services, et ce que ces services reçoivent.',
  intro: 'Version courte : le site blowy.app ne dépose aucun cookie. Voici le détail, vérifié dans son code.',
  body: [
    { h2: 'Ce que le site dépose', id: 'depose' },
    {
      p: 'Le site blowy.app ne dépose **aucun cookie** et n’enregistre rien dans le stockage de ton navigateur (ni stockage local, ni stockage de session). Il n’utilise aucun outil de mesure d’audience, aucune publicité et aucun bouton de réseau social. C’est pour ça qu’il n’y a pas de bandeau de consentement.',
    },
    { p: 'Cette page concerne seulement le site. L’app Minimoa est couverte par la [politique de confidentialité](@confidentialite).' },

    { h2: 'Ce que le site charge depuis d’autres services', id: 'tiers' },
    {
      p: 'Pour s’afficher, le site charge quelques fichiers depuis d’autres serveurs. Ces services ne déposent pas de cookie par ce biais, mais ils reçoivent, comme tout serveur web, ton adresse IP et des informations techniques sur ton navigateur :',
    },
    {
      table: {
        head: ['Service', 'Pourquoi', 'Sur quelles pages'],
        rows: [
          ['Google Fonts (Google)', 'Les polices Anton et Bricolage Grotesque', 'Toutes'],
          ['cdnjs (Cloudflare)', 'La bibliothèque d’animation GSAP', 'Page d’accueil'],
          ['Hébergeur du site : {{siteHost.name}}', 'Servir les pages', 'Toutes'],
          ['Serveur de l’app Minimoa (API)', 'Afficher le prénom et le minimoa de la personne, enregistrer les mots choisis', 'Pages « 3 mots » et invitation'],
        ],
      },
    },
    {
      p: 'Sur les pages « 3 mots », on garde une empreinte non réversible de ton adresse IP et de ton navigateur pour limiter les votes en double (voir la [politique de confidentialité](@confidentialite#donnees)).',
    },

    { h2: 'Si ça change', id: 'changements' },
    {
      p: 'Si un jour le site dépose des cookies qui ne sont pas strictement nécessaires (mesure d’audience, par exemple), on te demandera ton accord avant, avec un vrai bouton « refuser », et cette page sera mise à jour.',
    },

    { h2: 'Garder la main', id: 'reglages' },
    {
      p: 'Ton navigateur te permet de bloquer ou supprimer les cookies et de limiter les requêtes vers d’autres sites. Le site restera lisible si tu bloques les polices externes : il utilisera celles de ton appareil.',
    },
    { p: 'Une question : {{email.privacy}}.' },
  ],
};
