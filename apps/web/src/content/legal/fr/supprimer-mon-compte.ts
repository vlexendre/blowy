import type { LegalPage } from '../types';

export const supprimerMonCompte: LegalPage = {
  title: 'Supprimer mon compte et mes données — Blowy',
  heading: 'Supprimer mon compte',
  description: 'Comment supprimer ton compte Blowy et tes données, ce qui est effacé et quand, ce qui est gardé et pourquoi.',
  intro: 'Tu peux supprimer ton compte et tes données quand tu veux, directement dans l’app. Voici comment, et ce que ça efface.',
  body: [
    { h2: 'Dans l’app', id: 'app' },
    {
      ol: [
        'Ouvre l’onglet **Moi**.',
        'Touche **Réglages**.',
        'Touche **Supprimer mon compte**.',
        'Écris « supprimer » pour confirmer.',
      ],
    },
    { p: 'C’est immédiat et définitif : on ne peut rien récupérer ensuite.' },
    {
      note: '**Tu as Blowy+ ?** Supprimer ton compte n’annule pas l’abonnement. Annule-le d’abord dans les réglages de ton store ([comment faire](@abonnement#annuler)).',
    },

    { h2: 'Sans l’app', id: 'sans-app' },
    {
      p: 'Tu n’as plus accès à l’app ? Écris à {{email.privacy}}, si possible depuis l’adresse e-mail liée à ton compte Apple ou Google, en demandant la suppression de ton compte. On pourra te demander de confirmer que le compte est bien le tien. On s’en occupe sous un mois au plus, et on te confirme quand c’est fait.',
    },

    { h2: 'Ce qui est effacé tout de suite', id: 'efface' },
    {
      ul: [
        'ton compte, ton prénom, ta date de naissance, ton sexe, ce que tu cherches ;',
        'ton minimoa, sa vision, son style, ses objets, tes habitudes, ta série ;',
        'ta position et ta zone de domicile approximative ;',
        'tes liens, avec leurs messages, leurs photos et leurs étapes. **Ils disparaissent aussi pour les autres personnes** ;',
        'tes photos de preuve gardées en souvenir ;',
        'les « 3 mots » reçus, tes invitations ;',
        'tes réglages et l’autorisation de t’envoyer des notifications.',
      ],
    },

    { h2: 'Ce qui est gardé, et pourquoi', id: 'garde' },
    {
      table: {
        head: ['Quoi', 'Pourquoi', 'Combien de temps'],
        rows: [
          ['Sauvegardes techniques', 'Pouvoir restaurer le service en cas de panne', 'Écrasées au fil de leur rotation, au plus tard 30 jours après'],
          ['Signalements et décisions de modération', 'Sécurité des autres et obligations légales. Ils ne sont plus rattachés à ton compte.', '1 an après la clôture du dossier, plus si une procédure judiciaire l’exige'],
          ['En cas d’exclusion définitive : un identifiant technique de ton compte Apple ou Google', 'Empêcher la réinscription', '3 ans'],
          ['Références des achats Blowy+', 'Obligations comptables', 'Jusqu’à 10 ans'],
          ['Données de connexion imposées par la loi', 'Répondre aux réquisitions des autorités', 'La durée fixée par la loi, un an au plus'],
          ['Statistiques agrégées', 'Piloter le service. Elles ne permettent pas de t’identifier.', 'Sans limite'],
        ],
      },
    },
    {
      p: 'Les « 3 mots » que tu as choisis pour d’autres restent sur leur compte : ils sont anonymes. Apple ou Google gardent leurs propres données d’achat et de connexion, selon leurs politiques. Tu peux aussi retirer Blowy des apps connectées à ton identifiant Apple ou à ton compte Google.',
    },

    { h2: 'Une question', id: 'question' },
    { p: 'Écris à {{email.privacy}}. Le détail de ce qu’on garde et pourquoi est dans la [politique de confidentialité](@confidentialite#durees).' },
  ],
};
