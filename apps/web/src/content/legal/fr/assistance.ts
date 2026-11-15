import type { LegalPage } from '../types';

export const assistance: LegalPage = {
  title: 'Assistance et contact — Blowy',
  heading: 'Assistance',
  description: 'Une question, un bug, un souci avec quelqu’un, ton abonnement ou tes données ? Les réponses les plus demandées, et comment nous écrire.',
  intro: 'Les questions qu’on nous pose le plus. Pas trouvé ? Écris-nous : un humain répond, pas un minimoa.',
  body: [
    { h2: 'Nous écrire', id: 'contact' },
    {
      table: {
        head: ['Pour', 'Écris à'],
        rows: [
          ['Une question, un bug, une idée', '{{email.support}}'],
          ['Tes données personnelles', '{{email.privacy}}'],
          ['Un problème de sécurité, un contenu illégal, un mineur', '{{email.safety}}, et signale aussi la personne dans l’app'],
        ],
      },
    },
    {
      p: 'Pour un bug, dis-nous ton modèle de téléphone, la version de l’app (en bas de **Moi → Réglages**) et ce que tu faisais. On répond en français ou en anglais.',
    },
    { note: '**En danger immédiat ?** N’attends pas notre réponse : appelle le **17** ou le **112**. Voir [sécurité et signalement](@securite).' },

    { h2: 'Questions fréquentes', id: 'faq' },
    {
      faq: [
        {
          q: 'C’est quoi, un minimoa ?',
          a: [
            'Ton minimoa, c’est toi en petit : il porte ta vision de la vie et tes habitudes. Il te présente des gens dont la vision est compatible avec la tienne, pour devenir potes ou plus. Plus tu t’en occupes (en sortant, en tenant tes habitudes), plus il te présente de monde. Il ne meurt jamais.',
          ],
        },
        {
          q: 'Comment mon minimoa choisit-il qui me présenter ?',
          a: [
            'Il compare ta vision (5 axes : foyer, ancrage, élan, rythme, cap) à celle des autres, et ne présente que les personnes au-dessus de 70 % de compatibilité. Chaque rencontre explique pourquoi : 3 points communs et 1 différence. Le détail est dans la [politique de confidentialité](@confidentialite#compatibilite).',
          ],
        },
        {
          q: 'Pourquoi Blowy demande-t-il ma position ?',
          a: [
            'Pour la carte et les rencontres proches, seulement quand l’app est ouverte. Ta position est arrondie et décalée pour les autres, et le mode discret te retire de la carte. Sans localisation, le reste de l’app fonctionne.',
          ],
        },
        {
          q: 'Qui lit mes messages ?',
          a: [
            'Aucun humain ne lit tes conversations. Si vous l’activez tous les deux, une IA lit vos messages pour que vos minimoas puissent réagir ; rien n’est conservé après. Tu peux la couper dans les options du lien ou dans Moi. Seule exception : si un message est signalé, un modérateur lit ce message et son contexte immédiat.',
          ],
        },
        {
          q: 'Que deviennent mes photos de preuve ?',
          a: ['Une IA vérifie la photo, aucun humain ne la voit, et elle est supprimée sous 24 h, sauf si tu la gardes dans tes souvenirs privés.'],
        },
        {
          q: 'Je ne me connecte plus. Que faire ?',
          a: [
            'La connexion passe par Apple (iPhone) ou Google (Android). Utilise le même identifiant Apple ou compte Google qu’à l’inscription. Si ça ne marche toujours pas, écris-nous à {{email.support}}.',
          ],
        },
        {
          q: 'Comment annuler Blowy+ ?',
          a: [
            'Dans les réglages de ton store, pas dans Blowy. iPhone : Réglages → ton nom → Abonnements. Android : Google Play → profil → Paiements et abonnements → Abonnements. Détails dans les [conditions de Blowy+](@abonnement#annuler).',
          ],
        },
        {
          q: 'Comment me faire rembourser ?',
          a: [
            'Les paiements passent par Apple ou Google : ce sont eux qui remboursent, selon leurs conditions. Les liens sont dans les [conditions de Blowy+](@abonnement#remboursements).',
          ],
        },
        {
          q: 'Comment signaler ou bloquer quelqu’un ?',
          a: ['Depuis le chat ou la rencontre, menu en haut à droite, puis Signaler ou Bloquer. Voir [sécurité et signalement](@securite).'],
        },
        {
          q: 'Comment supprimer mon compte ?',
          a: ['Moi → Réglages → Supprimer mon compte. Tout est expliqué sur la page [supprimer mon compte](@supprimer-mon-compte).'],
        },
        {
          q: 'Comment obtenir une copie de mes données ?',
          a: ['Écris à {{email.privacy}}. On te répond sous un mois. Tes droits sont détaillés dans la [politique de confidentialité](@confidentialite#droits).'],
        },
      ],
    },

    { h2: 'À lire aussi', id: 'documents' },
    {
      p: '[Conditions d’utilisation](@conditions) · [Confidentialité](@confidentialite) · [Règles de la communauté](@regles) · [Mentions légales](@mentions-legales)',
    },
  ],
};
