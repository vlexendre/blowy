import type { GuidePage } from '../types';
import { SOURCES as S } from './sources';

export const adulte: GuidePage = {
  slug: 'se-faire-des-amis-adulte',
  meta: {
    title: 'Comment se faire des amis à l’âge adulte',
    description: 'Après les études, les amis ne viennent plus tout seuls. Ce que dit la recherche, pourquoi c’est normal, et une méthode concrète pour s’en faire.',
  },
  h1: 'Comment se faire des amis à l’âge adulte',
  short: 'Se faire des amis à l’âge adulte',
  lead: 'À l’école, les amis arrivaient tout seuls. À 30 ans, entre le travail, les déménagements et les couples qui se forment, ils ne viennent plus sans qu’on aille les chercher. Ce n’est pas un échec personnel : c’est mécanique. Et ça se travaille.',
  keywords: [
    'comment se faire des amis adulte',
    'se faire des amis adulte',
    'comment se faire des amis quand on est adulte',
    'se faire des amis à l’âge adulte',
    'où se faire des amis adulte',
  ],
  sections: [
    {
      title: 'Pourquoi c’est plus difficile après 25 ans',
      blocks: [
        'Pendant l’enfance et les études, trois conditions étaient réunies sans effort : tu voyais les mêmes personnes **tous les jours**, **sans avoir à l’organiser**, dans un cadre où l’on avait **du temps à perdre ensemble**. La cour de récré, l’amphi, la coloc. À l’âge adulte, ces trois conditions disparaissent presque en même temps.',
        'Le travail occupe les journées, mais les collègues ne deviennent pas toujours des amis. Les amis d’avant déménagent, ont des enfants, changent d’horaires. Chaque changement de vie (nouvelle ville, séparation, nouveau poste) fait perdre une partie du réseau, et rien ne le reconstruit automatiquement.',
        `Tu n’es pas seul dans ce cas, loin de là. D’après l’étude [« Solitudes 2024 » de la Fondation de France](${S.fdf2024.url}), 35 % des 25-39 ans disent se sentir seuls souvent, contre 16 % des 60-69 ans. La tranche d’âge où l’on construit sa vie d’adulte est aussi celle où l’on se sent le plus seul.`,
      ],
    },
    {
      title: 'Ce que la recherche nous apprend',
      blocks: [
        { h3: 'Une amitié, c’est surtout du temps passé ensemble' },
        `Le chercheur Jeffrey Hall, de l’université du Kansas, a interrogé des adultes sur leurs amitiés naissantes ([Hall, 2018](${S.hall2018.url})). Ses estimations : il faut environ **50 heures** passées ensemble pour passer de connaissance à copain, environ **90 heures** pour devenir amis, et **plus de 200 heures** pour devenir amis proches. Ce n’est pas une règle exacte, mais l’ordre de grandeur est parlant : une soirée sympa ne suffit pas, il faut des dizaines de rendez-vous.`,
        'Conséquence pratique : une activité hebdomadaire de deux heures avec les mêmes personnes te donne une centaine d’heures par an. C’est exactement ce dont une amitié a besoin pour démarrer.',
        { h3: 'Les autres t’apprécient plus que tu ne le crois' },
        `Après une conversation avec un inconnu, on sous-estime systématiquement à quel point l’autre nous a apprécié. Des psychologues ont baptisé ce phénomène le « liking gap » ([Boothby et al., 2018](${S.boothby2018.url})). Ils l’ont observé après des échanges de quelques minutes, mais aussi dans des conversations plus longues et entre colocataires, plusieurs mois après leur rencontre. Autrement dit : la personne avec qui tu as discuté hier a probablement passé un meilleur moment que tu ne l’imagines.`,
        { h3: 'Reprendre contact fait plus plaisir que prévu' },
        `Envoyer un message à quelqu’un qu’on n’a pas vu depuis longtemps paraît souvent gênant. Pourtant, une série d’expériences menées auprès de milliers de participants montre que l’on sous-estime nettement à quel point la personne apprécie ce geste, surtout quand il est inattendu ([Liu et al., 2023](${S.liu2023.url})). Ton ancien collègue sympa, ta voisine de la fac : ils seront probablement contents d’avoir de tes nouvelles.`,
        { h3: 'Les petites relations comptent aussi' },
        `Tout ne doit pas devenir une grande amitié. Des études ont montré que les jours où l’on échange avec plus de « liens faibles » (camarades, voisins, habitués), on se sent plus heureux et plus à sa place ([Sandstrom et Dunn, 2014](${S.sandstrom2014.url})). Le boulanger qui te reconnaît, les habitués du club : ces relations légères ont de la valeur en elles-mêmes, et certaines deviennent des amitiés.`,
      ],
    },
    {
      title: 'Une méthode concrète, en six étapes',
      blocks: [
        {
          ordered: true,
          list: [
            '**Choisis un cadre qui revient.** Un cours, un club, une équipe, une association, un groupe de course : n’importe quoi, du moment que c’est **chaque semaine, avec les mêmes personnes, près de chez toi**. C’est l’ingrédient principal, bien avant le charisme.',
            '**Tiens-le au moins trois mois.** Les premières séances, tu es « le nouveau ». Vers la sixième, on te reconnaît. Vers la dixième, on t’attend. Beaucoup abandonnent juste avant que ça marche.',
            '**Propose le deuxième rendez-vous.** C’est l’étape que tout le monde attend de l’autre. Après une séance, propose quelque chose de simple et précis : « On prend un café après, la semaine prochaine ? » plutôt que « Faudrait qu’on se voie un jour ».',
            '**Relance tes anciens contacts.** Fais la liste de cinq personnes que tu aimais bien et que tu as perdues de vue. Écris-leur un message court, sans justification. Certaines répondront à peine, d’autres seront ravies.',
            '**Invite chez toi, même simplement.** Un apéro, une soupe, une soirée jeux. Inviter, c’est faire passer une relation de « on se croise » à « on se voit ». Et chacun peut amener quelqu’un.',
            '**Installe des rituels.** Une amitié adulte survit grâce à la régularité : un footing le dimanche, un appel le premier du mois, un resto tous les deux mois. Ce qui est prévu à l’avance résiste mieux aux agendas pleins.',
          ],
        },
        { note: 'Accepte le tri : toutes les connaissances ne deviendront pas des amis, et c’est normal. Sur dix personnes rencontrées dans un club, deux ou trois avec qui le courant passe vraiment, c’est déjà beaucoup.' },
      ],
    },
    {
      title: 'Les erreurs fréquentes',
      blocks: [
        {
          list: [
            '**Multiplier les événements ponctuels.** Les grandes soirées « pour rencontrer du monde » sont amusantes, mais on y revoit rarement les gens. Une activité régulière vaut dix soirées.',
            '**Attendre que l’autre propose.** L’autre attend probablement la même chose que toi. Lance-toi : au pire, il dira qu’il n’est pas dispo.',
            '**Chercher trop loin.** Une personne à quarante minutes de chez toi, tu la verras rarement. La proximité fait plus que les points communs.',
            '**Tout miser sur une seule personne.** Construis plusieurs liens en parallèle : si l’un s’éteint, les autres restent.',
          ],
        },
      ],
    },
    {
      title: 'Pourquoi ça vaut l’effort',
      blocks: [
        `Avoir des amis n’est pas seulement agréable. Une grande synthèse de 148 études, portant sur plus de 300 000 personnes, a montré que les personnes ayant des relations sociales plus fortes avaient une probabilité de survie supérieure de 50 % sur la période étudiée ([Holt-Lunstad et al., 2010](${S.holtLunstad2010.url})). L’Organisation mondiale de la santé estime qu’une personne sur six dans le monde est touchée par la solitude, et la relie à plus de 871 000 décès par an ([OMS, 2025](${S.oms2025.url})).`,
        'Il ne s’agit pas de te faire peur, mais de remettre les choses à leur place : consacrer du temps à tes amitiés n’est pas un luxe. C’est aussi important que bien dormir ou bouger.',
      ],
    },
    {
      title: 'Et les applis dans tout ça ?',
      blocks: [
        'Une appli ne remplace pas un club ou une association, mais elle peut t’aider à trouver des gens disponibles près de chez toi, ce qui est la partie la plus difficile à l’âge adulte. C’est l’idée de [Minimoa](/) : un petit compagnon que tu élèves, et qui te présente des gens de ton quartier dont la vision de la vie va avec la tienne, en te disant pourquoi. Vous pouvez ensuite tenir une habitude ensemble, ce qui recrée justement la régularité qui manque. Si tu es curieux, le [quiz](/quiz/) prend deux minutes.',
        'Quel que soit l’outil, la règle reste la même : du temps, de la régularité, et oser proposer la suite.',
      ],
    },
  ],
  faq: [
    {
      q: 'Est-ce normal de ne pas avoir d’amis à 30 ans ?',
      a: 'C’est beaucoup plus fréquent qu’on ne le croit. Entre 25 et 39 ans, plus d’une personne sur trois dit se sentir souvent seule, selon la Fondation de France. Les déménagements, le travail et la vie de couple dispersent les amitiés des études. Ça ne dit rien de ta valeur, et ça se reconstruit.',
    },
    {
      q: 'Combien de temps faut-il pour se faire un ami ?',
      a: 'Selon les travaux de Jeffrey Hall (2018), environ 50 heures passées ensemble pour devenir copains, 90 heures pour devenir amis et plus de 200 heures pour une amitié proche. Une activité hebdomadaire partagée est la façon la plus simple d’accumuler ce temps.',
    },
    {
      q: 'Où se faire des amis quand on est adulte ?',
      a: 'Dans les cadres qui reviennent chaque semaine avec les mêmes personnes : clubs de sport loisir, associations, bénévolat, chorales, cours du soir. Notre guide [associations et activités pour rencontrer du monde](/guides/associations-activites-rencontrer-du-monde/) t’aide à choisir.',
    },
    {
      q: 'Comment transformer une connaissance en ami ?',
      a: 'En proposant un rendez-vous précis en dehors du cadre où vous vous êtes rencontrés (un café, une balade), puis en le répétant. Le passage de « on se croise » à « on se voit exprès » est le vrai déclic.',
    },
  ],
  sources: [S.fdf2024, S.hall2018, S.boothby2018, S.liu2023, S.sandstrom2014, S.holtLunstad2010, S.oms2025],
  related: ['se-faire-des-amis-timide', 'se-faire-des-amis-nouvelle-ville', 'associations-activites-rencontrer-du-monde'],
  image: { src: '/img/m/duo_check.webp', width: 700, height: 456, alt: 'Nino et Pia, deux minimoas, qui se font un check' },
  og: { lines: ['SE FAIRE', 'DES AMIS', 'ADULTE.'], panel: 'accent' },
  published: '2026-11-18',
  updated: '2026-11-18',
};
