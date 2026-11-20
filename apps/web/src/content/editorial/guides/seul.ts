import type { GuidePage } from '../types';
import { SOURCES as S } from './sources';

export const seul: GuidePage = {
  slug: 'rencontrer-des-gens-seul',
  meta: {
    title: 'Où rencontrer des gens quand on est seul(e) ?',
    description: 'Seul ou seule et envie de voir du monde ? Les lieux et activités où l’on rencontre vraiment des gens, comment sortir seul sans malaise, et qui appeler.',
  },
  h1: 'Où rencontrer des gens quand on est seul(e)',
  short: 'Rencontrer des gens quand on est seul(e)',
  lead: 'Seul après une rupture, un déménagement, un départ à la retraite, ou simplement parce que la vie a dispersé tout le monde. Quelle que soit la raison, la question est la même : où aller pour rencontrer des gens, sans que ce soit gênant ?',
  keywords: [
    'comment rencontrer des gens quand on est seul',
    'comment rencontrer des gens quand on est seule',
    'où rencontrer des gens',
    'ou rencontrer des gens quand on est seul',
    'sortir seul pour rencontrer des gens',
    'se faire des amis quand on est seul',
  ],
  sections: [
    {
      title: 'Seul, isolé : ce n’est pas la même chose',
      blocks: [
        `La Fondation de France distingue deux choses ([Solitudes 2025](${S.fdf2025.url})). L’**isolement** décrit une situation objective : peu de relations avec la famille, les amis, les voisins, les collègues ou les associations. La **solitude** est un ressenti : on peut être entouré et se sentir seul, ou vivre seul sans en souffrir. Près d’un Français sur quatre (24 %) dit se sentir seul.`,
        `C’est loin d’être un problème marginal. L’Organisation mondiale de la santé estime qu’une personne sur six dans le monde est touchée par la solitude ([OMS, 2025](${S.oms2025.url})). Si tu te reconnais là-dedans, tu n’as rien d’anormal, et chercher du monde est une démarche saine, pas un aveu de faiblesse.`,
      ],
    },
    {
      title: 'Les endroits où l’on rencontre vraiment des gens',
      blocks: [
        'Tous les lieux ne se valent pas. Les meilleurs ont trois points communs : on y **revient régulièrement**, on y **fait quelque chose ensemble**, et le **groupe reste à peu près le même**. Voici les plus fiables.',
        { h3: 'Les activités régulières' },
        {
          list: [
            '**Les cours** (langue, danse, cuisine, poterie, théâtre) : un petit groupe, un horaire fixe, plusieurs mois ensemble.',
            '**Les clubs de sport en loisir** : course, randonnée, volley, badminton, escalade. Les sports collectifs créent des liens particulièrement vite.',
            '**La chorale et la musique** : chanter ensemble crée une complicité immédiate, et beaucoup de chorales amateurs accueillent sans audition.',
          ],
        },
        { h3: 'Les endroits où l’on aide' },
        {
          list: [
            `**Le bénévolat** : distribution alimentaire, aide aux devoirs, visites à des personnes âgées, festivals. Tu rencontres des gens qui partagent tes valeurs, et tu te sens utile. [JeVeuxAider.gouv.fr](${S.jeVeuxAider.url}) recense des missions près de chez toi.`,
            '**Les jardins partagés** et les associations de quartier : on y voit les mêmes voisins chaque semaine, autour d’un projet concret.',
          ],
        },
        { h3: 'Les lieux où l’on vient pour parler' },
        {
          list: [
            '**Les cafés-langues** : le principe même est de discuter avec des inconnus. Idéal pour un premier pas.',
            '**Les bars à jeux et soirées jeux de société** : le jeu sert de prétexte, les règles donnent un sujet, et on change de table.',
            '**Les médiathèques** : clubs de lecture, ateliers, conférences, souvent gratuits. Un public calme, idéal si tu n’aimes pas le bruit.',
          ],
        },
        'Pour aller plus loin, notre guide [associations et activités pour rencontrer du monde](/guides/associations-activites-rencontrer-du-monde/) aide à choisir selon ton caractère.',
      ],
    },
    {
      title: 'Sortir seul(e) sans se sentir bizarre',
      blocks: [
        'Aller seul à une activité où tout le monde semble déjà se connaître, c’est intimidant. Quelques astuces aident beaucoup.',
        {
          list: [
            '**Arrive un peu en avance.** C’est le moment où les gens sont dispersés et disponibles. Arriver quand tout le monde est déjà en groupe est bien plus difficile.',
            '**Donne-toi une mission simple** : poser une question à une personne, retenir deux prénoms. Ça transforme l’angoisse en petit objectif.',
            '**Va là où être seul est normal** : un cours, une randonnée organisée, un atelier. Personne n’y vient en bande.',
            '**Reviens.** La deuxième fois est toujours plus facile que la première, et la troisième plus que la deuxième.',
          ],
        },
        `Rappelle-toi que ton cerveau te ment un peu. Dans des expériences menées dans les transports en commun, les gens prévoyaient que parler à un inconnu serait désagréable ; ceux qui l’ont fait ont pourtant passé un meilleur trajet que ceux restés seuls ([Epley et Schroeder, 2014](${S.epley2014.url})). Les autres ont souvent plus envie de discuter que tu ne le crois.`,
      ],
    },
    {
      title: 'Si tu es une femme seule',
      blocks: [
        'Beaucoup de femmes hésitent à sortir seules, et c’est compréhensible. Quelques réflexes simples permettent de profiter des rencontres en restant à l’aise :',
        {
          list: [
            '**Privilégie les cadres organisés** (cours, associations, sorties de groupe) où les participants sont connus des organisateurs.',
            '**Pour une première rencontre en tête-à-tête**, choisis un lieu public, préviens un proche, et prévois ton propre trajet. Tu pars quand tu veux.',
            '**Écoute ton instinct.** Tu n’as jamais à te justifier de décliner une invitation.',
            '**Cherche les groupes non mixtes** si tu t’y sens mieux : clubs de course, randonnées ou cercles de lecture entre femmes existent dans la plupart des villes.',
          ],
        },
      ],
    },
    {
      title: 'Les petits contacts comptent',
      blocks: [
        `En attendant de rencontrer de vrais amis, ne néglige pas les échanges légers : le commerçant qui te reconnaît, le voisin à qui tu dis bonjour, les habitués du club. Des chercheurs ont montré que les jours où l’on interagit avec davantage de ces « liens faibles », on se sent plus heureux et plus à sa place ([Sandstrom et Dunn, 2014](${S.sandstrom2014.url})). Ce ne sont pas des miettes : c’est le tissu qui rend une ville habitable.`,
      ],
    },
    {
      title: 'Une semaine pour remettre du monde dans ta vie',
      blocks: [
        'Plutôt que de tout changer d’un coup, essaie une semaine avec un petit pas par jour. Rien d’héroïque, mais tout compte.',
        {
          ordered: true,
          list: [
            '**Lundi** : écris à une personne perdue de vue. Un simple « J’ai pensé à toi, tu deviens quoi ? » suffit.',
            '**Mardi** : repère deux activités régulières près de chez toi (club, cours, association) et note leurs horaires. Pour savoir où chercher, vois [comment rencontrer des gens dans ton quartier](/guides/rencontrer-des-gens-pres-de-chez-soi/).',
            '**Mercredi** : dis bonjour à un voisin ou à un commerçant, et échange quelques phrases.',
            '**Jeudi** : inscris-toi à une séance d’essai ou à une mission de bénévolat.',
            '**Vendredi** : sors une heure dans un lieu animé, même sans objectif : un marché du soir, une médiathèque, un café.',
            '**Week-end** : va à ta séance d’essai. Arrive en avance, retiens un prénom, et dis « à la semaine prochaine ».',
          ],
        },
        'La semaine suivante, garde ce qui a marché et recommence. Au bout d’un mois, tu auras un rendez-vous fixe et quelques visages familiers.',
      ],
    },
    {
      title: 'Quand la solitude pèse trop',
      blocks: [
        'Il y a des moments où sortir semble au-dessus de tes forces. Ce n’est pas une faiblesse, et tu peux être aidé.',
        {
          list: [
            `**SOS Amitié** écoute 24 h/24 et 7 j/7, de façon anonyme et gratuite, au 09 72 39 40 50 (et par chat). D’autres lignes existent, comme Croix-Rouge écoute au 0 800 858 858 ; [Santé.fr les recense](${S.santeFrEcoute.url}).`,
            '**Ton médecin traitant** peut t’écouter et t’orienter, y compris vers un psychologue.',
            '**En cas d’idées suicidaires**, appelle le **3114**, le numéro national de prévention du suicide, gratuit et ouvert jour et nuit. En cas d’urgence, le 15 ou le 112.',
          ],
        },
      ],
    },
    {
      title: 'Une aide pour faire le premier pas',
      blocks: [
        'Le plus dur, quand on est seul, c’est souvent de savoir **qui**, près de chez soi, a envie de voir du monde. Sur [Minimoa](/), un petit compagnon que tu élèves te présente des gens de ton quartier qui voient la vie comme toi, en t’expliquant ce que vous partagez. Rien ne se passe sans ton accord, et ta position n’est jamais affichée précisément. Ça ne remplace pas un club ou un café-langue, mais ça peut t’éviter d’y aller seul. Si tu veux comparer, nous avons passé en revue [les différentes applis pour rencontrer du monde](/guides/application-pour-se-faire-des-amis/).',
      ],
    },
  ],
  faq: [
    {
      q: 'Comment rencontrer des gens quand on est seule ?',
      a: 'Mise sur les activités régulières en petit groupe (cours, club, chorale, bénévolat), où venir seule est la norme. Pour un premier tête-à-tête, choisis un lieu public et préviens un proche. Les cafés-langues et soirées jeux sont de bons premiers pas.',
    },
    {
      q: 'Où sortir seul pour rencontrer du monde ?',
      a: 'Là où l’on fait quelque chose ensemble : cours, randonnées organisées, ateliers en médiathèque, soirées jeux, cafés-langues, bénévolat. Les bars et les grandes soirées sont moins efficaces : on y parle, mais on s’y revoit rarement.',
    },
    {
      q: 'Quelle activité faire seul pour rencontrer des gens ?',
      a: 'Une activité de groupe qui revient chaque semaine : sport collectif loisir, chorale, théâtre amateur, jardin partagé, bénévolat. Choisis-la près de chez toi et à un horaire que tu pourras tenir plusieurs mois.',
    },
    {
      q: 'Que faire quand on se sent très seul ?',
      a: 'En parler, déjà : à un proche, à ton médecin, ou à une ligne d’écoute comme SOS Amitié (09 72 39 40 50, 24 h/24). Puis viser un seul petit pas par semaine : un cours d’essai, un bonjour à un voisin, un message à un ancien ami.',
    },
  ],
  sources: [S.fdf2025, S.oms2025, S.epley2014, S.sandstrom2014, S.jeVeuxAider, S.santeFrEcoute],
  related: ['associations-activites-rencontrer-du-monde', 'se-faire-des-amis-timide', 'se-faire-des-amis-nouvelle-ville'],
  image: { src: '/img/m/nino_pense.webp', width: 450, height: 500, alt: 'Nino, un minimoa vert à mèche orange, qui réfléchit' },
  og: { lines: ['SEUL ?', 'OÙ', 'RENCONTRER', 'DU MONDE.'], panel: 'night' },
  published: '2026-11-18',
  updated: '2026-11-19',
};
