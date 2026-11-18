import type { LegalPage } from '../types';

export const cookies: LegalPage = {
  title: 'Cookies — Minimoa',
  heading: 'Cookies',
  description: 'Le site minimoa.app ne dépose aucun cookie. Ce qu’il charge depuis d’autres services, et ce que ces services reçoivent.',
  intro: 'Version courte : le site minimoa.app ne dépose aucun cookie. Voici le détail, vérifié dans son code.',
  body: [
    { h2: 'Ce que le site dépose', id: 'depose' },
    {
      p: 'Le site minimoa.app ne dépose **aucun cookie** et n’utilise pas le stockage local de ton navigateur. Le temps de la visite seulement (stockage de session, effacé à la fermeture de l’onglet), il garde le code d’un lien ouvert et le code de ton résultat au quiz, pour les réutiliser sur la page ; rien de tout ça n’est envoyé pour te suivre. Il n’utilise aucun outil de mesure d’audience, aucune publicité et aucun bouton de réseau social. C’est pour ça qu’il n’y a pas de bandeau de consentement.',
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
          ['Hébergeur du site : {{siteHost.name}}', 'Servir les pages', 'Toutes'],
          ['Serveur de l’app Minimoa (API)', 'Afficher le prénom et le minimoa de la personne, enregistrer les mots choisis', 'Pages « 3 mots » et invitation'],
          ['Serveur de l’app Minimoa (API)', 'Calculer et garder ton résultat au quiz, afficher le compteur d’un quartier, enregistrer ton inscription', 'Pages « Quel minimoa es-tu ? » et « Ouvre ton quartier »'],
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
      p: 'Ton navigateur te permet de bloquer ou supprimer les cookies et de limiter les requêtes vers d’autres sites. La police du site (Allo) est servie par le site lui-même : aucune police n’est chargée depuis un autre service.',
    },
    { p: 'Une question : {{email.privacy}}.' },
  ],
};
