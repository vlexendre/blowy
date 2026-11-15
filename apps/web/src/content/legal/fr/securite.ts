import type { LegalPage } from '../types';

export const securite: LegalPage = {
  title: 'Sécurité et signalement — Blowy',
  heading: 'Sécurité et signalement',
  description:
    'Comment signaler ou bloquer quelqu’un dans Blowy, ce qui se passe ensuite, nos conseils pour une première rencontre, les numéros d’urgence, et notre politique de protection des mineurs.',
  intro: 'Comment signaler, bloquer, se protéger, et qui appeler en cas d’urgence.',
  body: [
    { note: '**En danger immédiat ?** Appelle le **17** (police) ou le **112** (urgences, partout dans l’Union européenne). Par SMS si tu ne peux pas parler : **114**.' },

    { h2: 'Signaler quelqu’un', id: 'signaler' },
    {
      ol: [
        'Ouvre le chat avec la personne, ou sa fiche dans tes rencontres.',
        'Touche le menu (« … »), puis **Signaler** (dans une rencontre : **Signaler ou bloquer**). Pour un message précis, fais un appui long dessus, puis **Signaler ce message**.',
        'Choisis la raison : harcèlement, contenu inapproprié, faux profil, personne mineure, ou autre.',
        'Ajoute quelques mots si tu veux (ce qui s’est passé, quand). Ça nous aide à agir vite.',
        'Tu peux bloquer la personne en même temps.',
      ],
    },
    {
      p: 'La personne ne sait pas que le signalement vient de toi. Tu n’as pas l’app sous la main ? Écris à {{email.safety}} avec le prénom de la personne et ce qui s’est passé.',
    },

    { h2: 'Ce qui se passe ensuite', id: 'suite' },
    {
      ul: [
        'L’équipe de modération est **prévenue par e-mail** de chaque signalement : tout de suite pour ce qui est urgent (personne mineure, menace), sinon dans un récapitulatif. **Objectif : une réponse sous 24 h** ; au-delà, le signalement remonte en tête de la file.',
        'Un modérateur de Blowy lit **le message signalé et son contexte immédiat**, et rien d’autre de tes conversations.',
        'Selon la gravité : retrait du contenu, avertissement, limitation, suspension ou fermeture du compte. Ce qui est illégal peut être transmis aux autorités.',
        'Un compte signalé comme mineur par deux personnes différentes est suspendu automatiquement, en attendant le modérateur.',
        'L’app te confirme que ton signalement est bien envoyé. Pour protéger la vie privée de chacun, on ne te tient pas au courant de la sanction.',
      ],
    },

    { h2: 'Bloquer quelqu’un', id: 'bloquer' },
    {
      p: 'Dans le même menu, choisis **Bloquer**. La personne ne peut plus t’écrire, votre lien disparaît, et vos minimoas ne se croiseront plus, ni en rencontre ni sur la carte. Elle n’est pas prévenue. Tu retrouves les personnes bloquées dans **Moi → Réglages → Personnes bloquées**, où tu peux les débloquer.',
    },

    { h2: 'Tes protections dans l’app', id: 'protections' },
    {
      ul: [
        'Ta position exacte n’est jamais enregistrée ; sur la carte, elle est arrondie à environ 300 m et décalée, jamais en temps réel.',
        'Les prénoms, les messages et les photos de profil passent par un **filtre automatique** : ce qui enfreint nettement les [règles](@regles) n’est pas publié, un message limite est signalé à la modération.',
        'Quand un lien atteint le niveau où l’on se voit en vrai, l’app te rappelle ces conseils de sécurité.',
        'Le **mode discret** te retire de la carte.',
        'Rien ne se passe sans ton accord : tu salues, l’autre accepte, le lien se crée.',
        'Tu peux quitter un lien à tout moment.',
      ],
    },

    { h2: 'Avant de se voir en vrai', id: 'rencontre' },
    {
      ul: [
        '**Prends ton temps.** Discute dans l’app d’abord. Quelqu’un qui te presse est un signal.',
        '**Lieu public**, pour la première fois : un café, un parc fréquenté. Pas chez toi, pas chez l’autre.',
        '**Préviens un proche** : où, quand, avec qui. Convenez d’un message à envoyer pendant ou après.',
        '**Garde ton autonomie** : viens et repars par tes propres moyens. Garde ton téléphone chargé.',
        '**Ne donne pas trop vite** ton adresse, ton lieu de travail ou tes informations privées.',
        '**Jamais d’argent.** Personne n’a de bonne raison de t’en demander. Signale-le.',
        '**Fais attention à ton verre**, et à ce que tu consommes.',
        '**Écoute-toi** : si quelque chose cloche, tu peux partir, sans te justifier.',
      ],
    },
    {
      p: 'Une compatibilité, même élevée, ne garantit rien sur une personne. Blowy ne vérifie pas l’identité des utilisateurs.',
    },

    { h2: 'Numéros utiles', id: 'urgences' },
    {
      table: {
        head: ['Numéro', 'Pour quoi'],
        rows: [
          ['**112**', 'Urgences, depuis n’importe quel pays de l’Union européenne'],
          ['**17**', 'Police, gendarmerie (France)'],
          ['**15**', 'Urgence médicale, Samu (France)'],
          ['**18**', 'Pompiers (France)'],
          ['**114**', 'Urgences par SMS, pour les personnes sourdes, malentendantes, ou qui ne peuvent pas parler (France)'],
          ['**3919**', 'Violences faites aux femmes, gratuit et anonyme (France)'],
          ['**3018**', 'Cyberharcèlement et violences numériques, gratuit et confidentiel (France)'],
          ['**119**', 'Enfance en danger (France)'],
        ],
      },
    },
    {
      p: 'Un contenu illégal en ligne peut aussi être signalé à la plateforme officielle [internet-signalement.gouv.fr](https://www.internet-signalement.gouv.fr). Hors de France, appelle le 112 ou les numéros d’urgence de ton pays.',
    },

    { h2: 'Protection des mineurs', id: 'mineurs' },
    {
      p: 'Blowy est réservé aux adultes de 18 ans et plus. La date de naissance est demandée avant la connexion ; en dessous de 18 ans, l’inscription s’arrête et rien n’est créé.',
    },
    {
      p: '**Tolérance zéro** pour tout contenu ou comportement qui sexualise ou met en danger un mineur. Dès qu’on en a connaissance : le contenu est retiré, le compte est fermé définitivement, et les faits sont signalés aux autorités compétentes.',
    },
    {
      ul: [
        'Dans l’app : **Signaler**, motif « Personne mineure ».',
        'Par e-mail : {{email.safety}}.',
        'En France, tu peux aussi signaler sur [internet-signalement.gouv.fr](https://www.internet-signalement.gouv.fr), ou appeler le **119** si un enfant est en danger.',
      ],
    },
    {
      p: 'Pour en savoir plus : [règles de la communauté](@regles), [conditions d’utilisation](@conditions#moderation).',
    },
  ],
};
