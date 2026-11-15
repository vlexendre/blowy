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
      note: '**Tu as Blowy+ ?** Supprimer ton compte n’annule pas l’abonnement. Annule-le d’abord dans les réglages de ton iPhone ([comment faire](@abonnement#annuler)).',
    },

    { h2: 'Sans l’app', id: 'sans-app' },
    {
      p: 'Tu n’as plus accès à l’app ? Écris à {{email.privacy}}, si possible depuis l’adresse e-mail liée à ton compte Apple ou Google, en demandant la suppression de ton compte. On pourra te demander de confirmer que le compte est bien le tien. On s’en occupe sous un mois au plus, et on te confirme quand c’est fait.',
    },

    { h2: 'Ce qui est effacé tout de suite', id: 'efface' },
    {
      ul: [
        'ton compte, ton prénom, ta date de naissance, ton sexe, ce que tu cherches, ta photo de profil ;',
        'ton jeton de connexion Apple, après avoir révoqué auprès d’Apple l’accès de Blowy à ton identifiant ;',
        'ton minimoa, sa vision, son style, ses objets, tes habitudes, ta série ;',
        'ta position arrondie, ta zone de domicile approximative ou ta ville choisie ;',
        'tes liens, avec leurs messages, leurs anciennes photos du jour et leurs étapes. **Ils disparaissent aussi pour les autres personnes** ;',
        'tes photos de preuve et de défi, gardées en souvenir ou pas encore effacées ;',
        'les « 3 mots » reçus, tes invitations ;',
        'tes réglages et l’autorisation de t’envoyer des notifications.',
      ],
    },

    { h2: 'Ce qui est gardé, et pourquoi', id: 'garde' },
    {
      table: {
        head: ['Quoi', 'Pourquoi', 'Combien de temps'],
        rows: [
          ['Sauvegardes techniques', 'Pouvoir restaurer le service en cas de panne', 'Écrasées au fil de leur rotation : {{dataHost.backupRetention}}'],
          ['Signalements et décisions de modération', 'Sécurité des autres et obligations légales. Ils ne sont plus rattachés à un compte ; le journal des décisions garde le prénom concerné.', '1 an après la clôture du dossier (un signalement encore ouvert : jusqu’à son traitement, puis 1 an), plus longtemps seulement si la loi l’impose'],
          ['En cas d’exclusion définitive : une empreinte non réversible de ton identifiant Apple ou Google', 'Empêcher la réinscription', '3 ans'],
          ['Références des achats Blowy+', 'Obligations comptables. Elles ne sont plus rattachées à un compte.', 'Jusqu’à 10 ans'],
          ['Jours d’activité et classement interne (statistiques)', 'Calculer les chiffres du service', '40 jours au plus'],
          ['Statistiques agrégées', 'Piloter le service. Elles ne permettent pas de t’identifier.', 'Sans limite'],
        ],
      },
    },
    {
      p: 'Les « 3 mots » que tu as choisis pour d’autres restent sur leur compte : ils sont anonymes. Apple ou Google gardent leurs propres données d’achat et de connexion, selon leurs politiques. Avec Apple, la suppression retire aussi Blowy des apps qui utilisent ton identifiant Apple ; avec Google, tu peux le faire depuis ton compte Google. Ce qui a déjà été envoyé à notre prestataire d’IA suit ce qu’il garde de son côté ([politique de confidentialité](@confidentialite#ia)).',
    },

    { h2: 'Une question', id: 'question' },
    { p: 'Écris à {{email.privacy}}. Le détail de ce qu’on garde et pourquoi est dans la [politique de confidentialité](@confidentialite#durees).' },
  ],
};
