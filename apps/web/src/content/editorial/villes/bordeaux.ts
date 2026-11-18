import type { CityPage } from '../types';

export const bordeaux: CityPage = {
  slug: 'bordeaux',
  name: 'Bordeaux',
  country: 'fr',
  meta: {
    title: 'Se faire des amis à Bordeaux : rencontrer du monde',
    description: 'Se faire des amis à Bordeaux : quais de la Garonne, Chartrons, Saint-Michel, rive droite. Où rencontrer des gens, et ouvre ton quartier sur Minimoa.',
  },
  h1: 'Se faire des amis à Bordeaux',
  lead: 'Bordeaux attire chaque année des gens qui veulent changer de vie. Résultat : une ville pleine de nouveaux venus qui, passé le premier été en terrasse, se demandent comment on se fait de vrais amis ici.',
  keywords: [
    'se faire des amis à Bordeaux',
    'se faire des amis sur Bordeaux',
    'rencontrer des gens à Bordeaux',
    'rencontrer des gens sur Bordeaux',
    'comment rencontrer des gens sur Bordeaux',
  ],
  sections: [
    {
      title: 'Une ville qui a changé de visage',
      blocks: [
        'En une vingtaine d’années, Bordeaux est passée de « belle endormie » à ville qui attire. Les quais ont été rendus aux piétons, la ligne à grande vitesse a rapproché Paris, et beaucoup d’actifs sont arrivés avec leur ordinateur portable et aucune connaissance sur place.',
        'C’est une chance : tu n’es pas le seul à repartir de zéro. Le revers, c’est qu’on se croise beaucoup sans se revoir. Les terrasses sont pleines, mais une amitié naît rarement entre deux verres avec des inconnus. Elle naît de la répétition.',
      ],
    },
    {
      title: 'Quartiers : rive gauche, rive droite',
      blocks: [
        {
          list: [
            '**Saint-Pierre et Saint-Michel** : le cœur ancien. Saint-Michel, autour de sa flèche et de son marché, garde un côté populaire et mélangé où l’on discute facilement.',
            '**Les Chartrons** : anciens entrepôts de négociants devenus quartier de brocantes, de cafés et de familles. Le dimanche matin, tout le monde est sur les quais.',
            '**La Victoire et Saint-Genès** : le Bordeaux étudiant, animé en semaine, idéal si tu as la vingtaine.',
            '**La Bastide**, rive droite : des espaces plus aérés, des lieux alternatifs dans d’anciennes casernes, et une vue sur la façade des quais.',
            '**Les Bassins à flot** : quartier neuf, beaucoup de jeunes couples et de nouveaux arrivants, donc beaucoup de gens disponibles.',
          ],
        },
      ],
    },
    {
      title: 'Les bons endroits pour rencontrer des gens à Bordeaux',
      blocks: [
        '**Les quais de la Garonne** sont le terrain de jeu commun : course à pied, roller, vélo, pique-nique. Plusieurs clubs et groupes de course s’y retrouvent en fin de journée et acceptent les nouveaux.',
        '**Les marchés** du week-end, aux Chartrons, aux Capucins ou à Saint-Michel, sont des endroits parfaits pour devenir un visage familier. Un habitué finit toujours par connaître les autres habitués.',
        '**Le Jardin public** et le parc Bordelais accueillent pique-niques, lectures au soleil et parties de molkky, qui se rejoignent volontiers.',
        '**Le sport collectif** : rugby à toucher, volley sur sable, aviron. Bordeaux a une vraie culture sportive, et les clubs loisirs cherchent souvent des joueurs.',
        '**Le vin**, évidemment. Les ateliers de dégustation, souvent en petit groupe, sont un excellent prétexte pour parler à des inconnus sans malaise.',
        'Tu viens de poser tes cartons ? Lis aussi notre guide pour [se faire des amis dans une nouvelle ville](/guides/se-faire-des-amis-nouvelle-ville/).',
      ],
    },
  ],
  minimoa: {
    title: 'Minimoa à Bordeaux',
    blocks: [
      'Bordeaux n’est pas immense : on peut presque tout faire à vélo. C’est parfait pour Minimoa. Ton minimoa te présente des gens de ta ville qui voient la vie comme toi, en te disant ce que vous avez en commun, et ce qui vous distingue.',
      'Une rencontre devient une amitié quand on se revoit. Dans l’app, vous pouvez tenir une habitude ensemble (une sortie vélo, une course sur les quais le jeudi), dans un groupe de 3 à 8 personnes où l’oubli de l’un coûte une vie au groupe. Les liens ont 7 vies : un silence trop long, et le lien devient fantôme.',
      'Rien sans ton accord, une position arrondie et jamais en direct, et une app gratuite, réservée aux adultes.',
    ],
  },
  quartier: {
    text: 'Minimoa ouvre ville par ville : à 50 inscrits, Bordeaux ouvre. Inscris-toi, puis invite tes voisins et tes collègues pour aller plus vite.',
    zones: ['bordeaux'],
  },
  faq: [
    {
      q: 'Comment rencontrer des gens sur Bordeaux quand on vient d’arriver ?',
      a: 'Commence par une activité régulière près de chez toi, plutôt que par des soirées. Un club de course sur les quais, un sport collectif en loisir ou du bénévolat te font revoir les mêmes personnes chaque semaine, ce qui est la base d’une amitié.',
    },
    {
      q: 'Bordeaux est-elle une ville accueillante ?',
      a: 'Beaucoup de Bordelais sont eux-mêmes arrivés récemment, ce qui rend la ville plutôt ouverte. La difficulté est ailleurs : on se croise beaucoup en terrasse sans se revoir. Propose vite un deuxième rendez-vous.',
    },
    {
      q: 'Quel quartier de Bordeaux pour rencontrer du monde ?',
      a: 'Saint-Michel et la Victoire pour l’animation, les Chartrons pour l’ambiance de village, les Bassins à flot pour croiser d’autres nouveaux arrivants. Le meilleur reste celui où tu habites : la proximité fait plus que le quartier à la mode.',
    },
  ],
  near: ['toulouse', 'nantes', 'montpellier'],
  guides: ['se-faire-des-amis-nouvelle-ville', 'associations-activites-rencontrer-du-monde', 'rencontrer-des-gens-seul'],
  image: { src: '/img/m/nino_marche.webp', width: 450, height: 500, alt: 'Nino, un minimoa vert à mèche orange, qui part en balade' },
  og: { lines: ['SE FAIRE', 'DES AMIS', 'À BORDEAUX.'], panel: 'wine' },
  updated: '2026-11-18',
};
