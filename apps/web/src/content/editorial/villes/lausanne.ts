import type { CityPage } from '../types';

export const lausanne: CityPage = {
  slug: 'lausanne',
  name: 'Lausanne',
  country: 'ch',
  meta: {
    title: 'Se faire des amis à Lausanne : rencontrer des gens',
    description: 'Se faire des amis à Lausanne : Flon, Ouchy, Sous-Gare, Cité, Lavaux, Festival de la Cité et sociétés locales. Où rencontrer des gens près de chez toi.',
  },
  h1: 'Se faire des amis à Lausanne',
  lead: 'Lausanne monte et descend : du lac à la cathédrale, chaque trajet est une petite randonnée. Ville étudiante, ville du sport, ville de passage pour beaucoup de jeunes actifs, elle donne plein d’occasions de rencontrer du monde. Encore faut-il en faire des habitudes.',
  keywords: [
    'se faire des amis à Lausanne',
    'se faire des amis Lausanne',
    'rencontrer des gens à Lausanne',
    'se faire des amis en Suisse',
  ],
  sections: [
    {
      title: 'Entre campus, lac et vignes',
      blocks: [
        'Avec l’université et l’EPFL au bord du lac, des milliers d’étudiants arrivent chaque année dans la région. Pendant les études, on se fait des amis au fil des cours et des associations. Une fois diplômé, beaucoup partent, et ceux qui restent doivent reconstruire un cercle hors du campus.',
        'Les Vaudois ont une réputation de calme et de retenue, et un humour pince-sans-rire qu’on apprend à aimer. On ne t’invitera peut-être pas à souper le premier mois ; mais si tu fais partie de la même société de gym ou du même chœur, le lien se fait naturellement.',
      ],
    },
    {
      title: 'Les quartiers lausannois',
      blocks: [
        {
          list: [
            '**Le Flon** : d’anciens entrepôts devenus quartier de sorties, de bars et de cinémas. Le point de rendez-vous du vendredi soir.',
            '**Ouchy** : les quais du Léman, la promenade et les terrasses. Pour courir, rouler ou simplement s’asseoir face aux Alpes.',
            '**Sous-Gare** : résidentiel, élégant et vivant, entre la gare et le lac, avec ses cafés de quartier.',
            '**La Cité et la vieille ville** : la cathédrale, les escaliers du Marché et les petites rues pavées. Chaque été, le quartier accueille un grand festival gratuit.',
            '**Chailly, Pontaise ou Malley** : des quartiers plus calmes ou en plein renouveau, avec de nouveaux immeubles et beaucoup de nouveaux voisins.',
          ],
        },
      ],
    },
    {
      title: 'Où rencontrer des gens à Lausanne',
      blocks: [
        '**Le Festival de la Cité**, en juillet : des spectacles gratuits dans la vieille ville. On y va à deux, on en repart à six.',
        '**Lavaux** : les vignes en terrasses au-dessus du lac, à quelques minutes de train. Les Caves ouvertes vaudoises, au printemps, sont l’occasion rêvée de proposer une sortie à des collègues.',
        '**Les sociétés locales** : gym, chœurs, fanfares, clubs de course, aviron. La Suisse est le pays des associations, et Lausanne n’y échappe pas. Une société, c’est un entraînement chaque semaine et une sortie annuelle.',
        '**Le sport en ville** : les courses populaires lausannoises attirent chaque année des milliers de coureurs. S’entraîner pour l’une d’elles en groupe soude plus qu’un apéro.',
        '**Les marchés** : le samedi et le mercredi dans le centre, entre la Riponne et la rue de Bourg. Le café qui suit est souvent le meilleur moment.',
        'Pour choisir une activité qui te ressemble, lis notre guide [associations et activités pour rencontrer du monde](/guides/associations-activites-rencontrer-du-monde/).',
      ],
    },
  ],
  minimoa: {
    title: 'Minimoa à Lausanne',
    blocks: [
      'L’app est disponible en Suisse, en Belgique et au Luxembourg. À Lausanne, ton minimoa te présente des gens près de chez toi qui partagent ta vision de la vie, et te dit pourquoi il a pensé à eux. Tu acceptes ou non : personne ne te contacte sans ton accord.',
      'Les minimoas vivent dans vos échanges : ils proposent un sujet, relancent la conversation, et vous évitent de laisser filer un lien qui démarrait bien. Pour vous voir, montez une habitude à deux (une course le long des quais d’Ouchy le mardi) ou un petit groupe de 3 à 8.',
      'L’essentiel est gratuit, sans pub, réservé aux plus de 18 ans. Ta position n’est jamais précise : elle est arrondie à environ 300 mètres.',
    ],
  },
  quartier: {
    text: 'Lausanne n’a pas encore son compteur de quartier sur ce site. La page Ouvre ton quartier te montre les villes déjà lancées ; en attendant, invite tes amis et collègues lausannois : chaque inscrit près de chez toi donne plus de choix à ton minimoa.',
    zones: [],
  },
  faq: [
    {
      q: 'Comment se faire des amis à Lausanne ?',
      a: 'Inscris-toi dans une société locale (sport, chœur, aviron) et tiens le rythme quelques mois. C’est le format qui fonctionne le mieux en Suisse romande : on se voit sans s’inviter, et la confiance vient avec le temps.',
    },
    {
      q: 'Comment se faire des amis en Suisse quand on vient d’ailleurs ?',
      a: 'Sois patient et régulier. Les Suisses ouvrent rarement leur cercle au premier café, mais une activité partagée chaque semaine change tout. Apprendre les codes locaux, comme la ponctualité, aide aussi.',
    },
    {
      q: 'Où rencontrer des gens à Lausanne ?',
      a: 'Au Flon pour sortir, à Ouchy pour le sport au bord du lac, dans les sociétés locales pour les liens durables, et au Festival de la Cité ou dans les caves de Lavaux pour les belles occasions.',
    },
  ],
  near: ['geneve', 'lyon', 'strasbourg'],
  guides: ['associations-activites-rencontrer-du-monde', 'se-faire-des-amis-adulte', 'se-faire-des-amis-timide'],
  image: { src: '/img/m/gaston_danse.webp', width: 450, height: 500, alt: 'Gaston, un minimoa orange à un seul grand œil, qui danse' },
  og: { lines: ['SE FAIRE', 'DES AMIS', 'À LAUSANNE.'], panel: 'night' },
  updated: '2026-11-18',
};
