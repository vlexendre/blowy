import type { GuidePage } from '../types';
import { SOURCES as S } from './sources';

export const timide: GuidePage = {
  slug: 'se-faire-des-amis-timide',
  meta: {
    title: 'Se faire des amis quand on est timide : le guide',
    description: 'Timide et envie de nouveaux amis ? Ce que ta timidité exagère, les situations qui t’aident, des petits pas concrets, et quand en parler à un professionnel.',
  },
  h1: 'Se faire des amis quand on est timide',
  short: 'Se faire des amis quand on est timide',
  lead: 'Tu as envie de voir plus de monde, mais l’idée d’aborder quelqu’un te noue le ventre. Bonne nouvelle : on n’a pas besoin de devenir extraverti pour se faire des amis. Il suffit de choisir les bonnes situations, et d’avancer à petits pas.',
  keywords: [
    'comment se faire des amis quand on est timide',
    'comment rencontrer des gens quand on est timide',
    'se faire des amis timide',
    'rencontrer des gens timide',
  ],
  sections: [
    {
      title: 'Timide, réservé, ou anxieux ?',
      blocks: [
        'La timidité est un trait très courant : on se sent mal à l’aise face à des inconnus, on rougit, on cherche ses mots, on préfère observer avant de parler. C’est inconfortable, mais ce n’est pas une maladie. Beaucoup de gens timides ont des amitiés profondes et durables : elles démarrent simplement plus lentement.',
        `Il arrive que la peur devienne beaucoup plus forte. La [brochure de Psycom sur les troubles anxieux](${S.psycom.url}) décrit la phobie sociale comme une « peur irraisonnée et intense des situations où l’on est exposé au regard d’autrui ». Si tu évites systématiquement les situations sociales, si cela t’empêche de travailler, d’étudier ou de vivre comme tu le voudrais, parles-en à ton médecin traitant : ça se soigne bien, et des séances chez un psychologue peuvent être prises en charge (dispositif Mon soutien psy, conditions sur ameli.fr).`,
        'Ce guide s’adresse surtout à la timidité ordinaire : celle qui freine, sans bloquer.',
      ],
    },
    {
      title: 'Ce que ta timidité exagère',
      blocks: [
        'La timidité fonctionne comme un mauvais prévisionniste. Elle te prédit des scénarios gênants, et elle se trompe plus souvent que tu ne crois. La recherche en psychologie l’a montré de plusieurs façons.',
        { h3: 'On croit que parler à un inconnu sera désagréable' },
        `Dans une série d’expériences menées dans des trains et des bus de Chicago, des chercheurs ont demandé à des passagers soit de discuter avec leur voisin, soit de rester seuls, soit de faire comme d’habitude ([Epley et Schroeder, 2014](${S.epley2014.url})). Les participants prévoyaient que la solitude serait plus agréable. C’est l’inverse qui s’est produit : ceux qui avaient parlé à un inconnu ont trouvé leur trajet plus agréable. Ils avaient aussi sous-estimé l’envie des autres de discuter.`,
        { h3: 'On croit que l’autre ne nous a pas apprécié' },
        `Après une conversation, on a tendance à penser que l’autre nous a moins apprécié qu’en réalité ([Boothby et al., 2018](${S.boothby2018.url})). Les chercheurs ont observé que les participants ne remarquaient pas les signes d’intérêt de leur interlocuteur (sourires, questions, relances), trop occupés à se juger eux-mêmes. Ce décalage touche tout le monde, et sans doute plus encore les timides.`,
        'Retiens ceci : le malaise que tu ressens pendant une conversation ne dit presque rien de ce que l’autre en pense.',
      ],
    },
    {
      title: 'Choisis des situations qui travaillent pour toi',
      blocks: [
        'Un timide n’a aucun intérêt à se jeter dans une soirée bondée où il ne connaît personne. Il existe des contextes beaucoup plus confortables, où la rencontre se fait presque toute seule.',
        {
          list: [
            '**Les activités avec un objet commun.** Jeux de société, chorale, escalade, atelier de poterie, jardin partagé : on regarde la même chose, on a un sujet tout trouvé, et les silences ne sont pas gênants.',
            '**Les petits groupes.** Un cours de six personnes vaut mieux qu’un événement de cent. On y retient les prénoms, et on y est remarqué sans avoir à se mettre en avant.',
            '**Les rôles.** Être bénévole à l’accueil d’un festival, tenir un stand, servir dans une association : le rôle te donne un script. Tu sais quoi dire, et les gens viennent vers toi.',
            '**La répétition.** Revenir chaque semaine au même endroit fait le travail à ta place. À la cinquième séance, tu n’as plus besoin d’aborder qui que ce soit : on te dit bonjour.',
            '**L’écrit d’abord.** Pour beaucoup de timides, échanger quelques messages avant de se voir rend la première rencontre beaucoup plus simple.',
          ],
        },
      ],
    },
    {
      title: 'Des petits pas, dans l’ordre',
      blocks: [
        'Le courage social se muscle comme le reste : progressivement. Voici une échelle possible. Passe à la marche suivante quand la précédente te paraît banale.',
        {
          ordered: true,
          list: [
            '**Dire bonjour et sourire** aux habitués de ta boulangerie, de ta salle de sport, de ton immeuble.',
            '**Poser une question pratique** à quelqu’un (« Tu sais si le cours a lieu jeudi ? »). C’est court et sans enjeu.',
            '**Faire un petit commentaire partagé** sur ce que vous vivez (« Il était dur, ce cours »). Ça invite à répondre sans obliger.',
            '**Poser une question ouverte** : « Tu fais ça depuis longtemps ? », « Qu’est-ce qui t’a donné envie ? ». Les gens adorent parler de ce qui les passionne.',
            '**Proposer une suite précise** : « On y va ensemble la semaine prochaine ? ». Précis, c’est plus facile à accepter qu’un vague « faudrait qu’on se voie ».',
          ],
        },
        { note: 'Une astuce de timide : prépare deux ou trois questions avant d’arriver. Ce n’est pas tricher, c’est se donner une rampe.' },
      ],
    },
    {
      title: 'Pendant la conversation',
      blocks: [
        {
          list: [
            '**Écoute plus que tu ne parles.** C’est souvent la force des timides, et les gens s’en souviennent.',
            '**Rebondis sur un détail.** « Tu as dit que tu venais de Lille ? » montre que tu as écouté, et relance sans effort.',
            '**Parle un peu de toi aussi.** Une amitié se construit dans les deux sens. Un souvenir, un goût, une anecdote suffisent.',
            '**Accepte les blancs.** Un silence de trois secondes te paraît long ; pour l’autre, il est à peine perceptible.',
            '**Pars quand tu veux.** « Bon, je file, à jeudi ! » est une sortie parfaite. Mieux vaut finir sur une bonne note que s’épuiser.',
          ],
        },
      ],
    },
    {
      title: 'Après : la partie que tout le monde oublie',
      blocks: [
        `Le plus dur, pour un timide, n’est souvent pas la première conversation mais la relance. On n’ose pas écrire, de peur de déranger. Pourtant, on sous-estime nettement à quel point un message inattendu fait plaisir ([Liu et al., 2023](${S.liu2023.url})). Un « C’était sympa jeudi, tu reviens la semaine prochaine ? » ne dérange personne.`,
        'Garde aussi ton énergie : tu n’as pas besoin de sortir tous les soirs. Une activité régulière, une ou deux relances par semaine, et tu avances à ton rythme.',
      ],
    },
    {
      title: 'Ce qui marche moins bien',
      blocks: [
        'Certaines stratégies semblent aider sur le moment, mais freinent sur la durée.',
        {
          list: [
            '**Boire pour se détendre.** Un verre peut délier la langue, mais s’il devient la condition pour parler aux autres, la timidité revient intacte le lendemain, et les liens créés ainsi restent souvent superficiels.',
            '**Se forcer dans les situations les plus dures.** Une grande soirée où tu ne connais personne n’est pas un bon entraînement : tu risques surtout d’en sortir épuisé et convaincu que « ce n’est pas pour toi ».',
            '**Se comparer aux extravertis.** Ils ont souvent beaucoup de connaissances, pas forcément plus d’amis proches. Ta façon de créer des liens, plus lente et plus profonde, a sa propre valeur.',
            '**Attendre d’être prêt.** On se sent rarement prêt. Le confort vient en faisant, pas avant.',
          ],
        },
      ],
    },
    {
      title: 'Un coup de pouce pour la première approche',
      blocks: [
        'La partie la plus intimidante, c’est le premier message à un inconnu. Sur [Minimoa](/), c’est ton minimoa qui fait les présentations : il te présente des gens près de chez toi, avec trois points communs et une différence à explorer. Tu as donc un sujet de conversation tout prêt, et personne ne peut t’écrire sans ton accord. Dans la discussion, vos minimoas peuvent même briser la glace avec une question tirée de ce que vous partagez. D’autres applis fonctionnent autrement (événements, dîners entre inconnus) : notre tour d’horizon des [applis pour se faire des amis](/guides/application-pour-se-faire-des-amis/) t’aide à trouver celle qui convient à ta timidité.',
        'Ce n’est qu’un outil parmi d’autres : la répétition, les petits groupes et les relances restent tes meilleurs alliés.',
      ],
    },
  ],
  faq: [
    {
      q: 'Comment se faire des amis quand on est timide et adulte ?',
      a: 'Choisis une activité régulière en petit groupe, avec un objet commun (jeu, sport, musique, bénévolat), et tiens-la plusieurs mois. La répétition fait le travail d’approche à ta place : au bout de quelques séances, on vient vers toi.',
    },
    {
      q: 'Timidité ou phobie sociale : comment faire la différence ?',
      a: 'La timidité gêne, mais tu fais quand même les choses. La phobie sociale fait éviter les situations et pèse sur la vie quotidienne (travail, études, relations). Dans ce second cas, parles-en à ton médecin : c’est un trouble fréquent, qui se soigne bien.',
    },
    {
      q: 'Comment rencontrer des gens quand on est timide ?',
      a: 'Plutôt dans des cadres où l’on a quelque chose à faire ensemble : cours, clubs, associations, bénévolat avec un rôle précis. Évite les grandes soirées où il faut tout faire à l’instinct. Échanger d’abord par écrit peut aussi aider.',
    },
  ],
  sources: [S.psycom, S.epley2014, S.boothby2018, S.liu2023],
  related: ['se-faire-des-amis-adulte', 'associations-activites-rencontrer-du-monde', 'rencontrer-des-gens-seul'],
  image: { src: '/img/m/nino_timide.webp', width: 450, height: 500, alt: 'Nino, un minimoa vert à mèche orange, un peu timide' },
  og: { lines: ['TIMIDE ?', 'TU PEUX', 'TE FAIRE', 'DES AMIS.'], panel: 'rose' },
  published: '2026-11-18',
  updated: '2026-11-19',
};
