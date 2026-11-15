import type { LegalPage } from '../types';

export const regles: LegalPage = {
  title: 'Règles de la communauté — Blowy',
  heading: 'Règles de la communauté',
  description: 'Les règles de Blowy : respect, consentement, pas de harcèlement, pas de mineurs, pas de contenu sexuel. Ce qui se passe si on ne les respecte pas.',
  intro: 'Des minimoas, et de vrais humains derrière. Pour que ça reste un endroit où on a envie de revenir, quelques règles simples.',
  body: [
    { h2: 'Respecte les gens', id: 'respect' },
    {
      p: 'Derrière chaque minimoa, il y a une vraie personne. L’humour, oui ; l’humiliation, non. On peut ne pas être d’accord sans être blessant.',
    },

    { h2: 'Un non, c’est non', id: 'consentement' },
    {
      p: 'Si quelqu’un ne répond pas, ne te salue pas en retour, quitte un lien ou te bloque, c’est son choix. On ne relance pas en boucle, on ne crée pas un autre compte pour contourner un refus, et on ne cherche pas la personne ailleurs.',
    },

    { h2: 'Pas de harcèlement ni de haine', id: 'harcelement' },
    {
      p: 'Interdit : insultes, menaces, chantage, messages répétés non désirés, moqueries sur le physique, l’origine, la religion, le genre, l’orientation sexuelle ou le handicap, appels à la haine ou à la violence.',
    },

    { h2: '18 ans et plus, sans exception', id: 'majeurs' },
    {
      p: 'Blowy est réservé aux adultes. Tout compte d’une personne mineure est supprimé. Tout contenu qui sexualise un mineur est supprimé, son auteur est exclu, et nous le signalons aux autorités. Si tu penses parler à une personne mineure, signale-la avec le motif « Personne mineure ».',
    },

    { h2: 'Pas de nudité ni de contenu sexuel', id: 'contenus' },
    {
      p: 'Ni dans les messages, ni en photo de profil, ni en photo de preuve. Pas de contenu violent, choquant ou illégal non plus. Une photo de preuve, c’est tes baskets, ton livre, ton assiette : pas toi en tenue légère.',
    },

    { h2: 'Sois toi', id: 'authenticite' },
    {
      p: 'Un compte par personne, pour une vraie personne. Pas de faux profil, pas d’usurpation d’identité. Et pas de triche : pas de fausse photo de preuve, pas de position falsifiée.',
    },

    { h2: 'Pas d’arnaque ni de commerce', id: 'arnaques' },
    {
      p: 'On ne demande pas d’argent, de cadeaux ou de codes. Pas de publicité, pas de spam, pas de liens douteux, pas de services sexuels rémunérés. Quelqu’un te demande de l’argent ? Signale-le.',
    },

    { h2: 'Protège la vie privée des autres', id: 'vie-privee' },
    {
      p: 'Ne partage pas l’adresse, le numéro, les photos ou les messages de quelqu’un sans son accord. Ce qui se dit dans un lien reste dans le lien.',
    },

    { h2: 'Ce qui se passe si une règle n’est pas respectée', id: 'sanctions' },
    {
      p: 'On examine chaque signalement, avec un objectif de réponse sous 24 h. Un modérateur peut lire le message signalé et son contexte immédiat, rien de plus. Selon la gravité :',
    },
    {
      ol: [
        'le contenu est retiré ;',
        'la personne reçoit un avertissement ;',
        'certaines fonctions sont limitées, ou le compte est suspendu ;',
        'le compte est fermé définitivement, dès la première fois pour ce qui est grave (mineurs, menaces, violences, arnaques).',
      ],
    },
    {
      p: 'Ce qui est illégal peut être signalé aux autorités. La personne concernée reçoit les raisons de la décision et peut la contester ([conditions d’utilisation](@conditions#moderation)).',
    },

    { h2: 'Signaler et bloquer', id: 'signaler' },
    {
      p: 'Depuis un chat ou une rencontre, ouvre le menu et choisis **Signaler** ou **Bloquer**. La personne ne sait pas qui l’a signalée, et n’est pas prévenue d’un blocage. Tout est expliqué dans [sécurité et signalement](@securite).',
    },
    {
      p: 'Ces règles font partie des [conditions d’utilisation](@conditions). Une question, un doute : {{email.support}}. Un humain répond, pas un minimoa.',
    },
  ],
};
