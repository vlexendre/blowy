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
            'Pour la carte et les rencontres proches, seulement quand l’app est ouverte. Ta position exacte n’est jamais enregistrée : on garde seulement un point arrondi à environ 300 m. Les autres voient une position arrondie et décalée, et le mode discret te retire de la carte. Sans localisation, tu choisis ta ville à la main (Rencontres, ou Moi → Réglages → Ma position) et tu as quand même des rencontres.',
          ],
        },
        {
          q: 'Qui lit mes messages ?',
          a: [
            'Personne chez Blowy ne lit tes conversations, sauf un message signalé (par quelqu’un ou par notre filtre automatique) : un modérateur lit alors ce message et son contexte immédiat. Si vous l’activez tous les deux, une IA, celle de notre prestataire {{sub.ai.provider}}, lit vos derniers messages pour que vos minimoas puissent réagir ; chez Blowy, rien de cette lecture n’est gardé. Tu peux la couper dans les options du lien ou dans Moi → L’IA et toi.',
          ],
        },
        {
          q: 'Que deviennent mes photos de preuve ?',
          a: [
            'Avant ta première preuve, l’app te demande si une IA ({{sub.ai.provider}}) peut vérifier tes photos. Si tu acceptes, la photo réduite lui est envoyée ; sinon, tu valides tes habitudes sur parole, sans photo. Aucun humain ne voit tes photos de preuve, et elles sont supprimées sous 24 h, sauf si tu les gardes dans tes souvenirs privés. Tu changes d’avis dans Moi → L’IA et toi.',
          ],
        },
        {
          q: 'Pourquoi mon message, mon prénom ou ma photo a-t-il été refusé ?',
          a: [
            'Les prénoms, les noms de minimoa, les messages et les photos de profil passent par un filtre automatique, qui écarte ce qui enfreint nettement les [règles de la communauté](@regles). L’app te dit pourquoi, et ton texte reste là pour que tu le modifies. Tu penses que c’est une erreur ? Écris à {{email.support}} : une personne regarde.',
          ],
        },
        {
          q: 'Je ne me connecte plus. Que faire ?',
          a: [
            'La connexion passe par Apple (iPhone) ou Google (Android). Utilise le même identifiant Apple ou compte Google qu’à l’inscription. Ton compte est suspendu ? L’écran te dit jusqu’à quand, et te permet d’écrire à l’assistance pour contester. Si ça ne marche toujours pas, écris-nous à {{email.support}}.',
          ],
        },
        {
          q: 'Comment annuler Blowy+ ?',
          a: [
            'Dans les réglages de ton iPhone, pas dans Blowy : Réglages → ton nom → Abonnements (dans l’app, Moi → Blowy+ → Gérer mon abonnement y mène). Détails dans les [conditions de Blowy+](@abonnement#annuler).',
          ],
        },
        {
          q: 'Comment me faire rembourser ?',
          a: [
            'Les paiements passent par Apple : c’est Apple qui rembourse, selon ses conditions. Le lien est dans les [conditions de Blowy+](@abonnement#remboursements).',
          ],
        },
        {
          q: 'Comment signaler ou bloquer quelqu’un ?',
          a: ['Depuis le chat ou la rencontre, menu « … » en haut à droite, puis Signaler ou Bloquer ; dans un chat, un appui long sur un message permet de le signaler. Voir [sécurité et signalement](@securite).'],
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
