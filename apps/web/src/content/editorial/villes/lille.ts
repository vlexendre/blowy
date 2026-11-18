import type { CityPage } from '../types';

export const lille: CityPage = {
  slug: 'lille',
  name: 'Lille',
  country: 'fr',
  meta: {
    title: 'Se faire des amis à Lille : où rencontrer des gens',
    description: 'Rencontrer des gens à Lille : Wazemmes, Vieux-Lille, Citadelle, estaminets, braderie, associations. Et ton minimoa pour te présenter des voisins.',
  },
  h1: 'Se faire des amis à Lille',
  lead: 'Le Nord a la réputation d’être chaleureux, et Lille la mérite plutôt bien : on y parle facilement au comptoir. Mais une ville où l’on discute avec tout le monde n’est pas forcément une ville où l’on se fait vite des amis proches.',
  keywords: [
    'rencontrer des gens à Lille',
    'rencontrer des gens Lille',
    'se faire des amis à Lille',
    'se faire des amis sur Lille',
    'comment se faire des amis sur Lille',
  ],
  sections: [
    {
      title: 'Lille, chaleureuse… et très étudiante',
      blocks: [
        'Lille est l’une des plus grandes villes universitaires de France. Pendant les études, se faire des amis y est presque automatique. Le changement arrive après : les promotions se dispersent, et ceux qui restent pour travailler voient leur cercle fondre d’un été à l’autre.',
        'Les nouveaux arrivants, eux, découvrent une ville où il est facile d’engager la conversation, notamment dans les estaminets, ces petits restaurants typiques où l’on mange au coude-à-coude. Reste à transformer ces bons moments en rendez-vous réguliers.',
      ],
    },
    {
      title: 'Les quartiers de Lille',
      blocks: [
        {
          list: [
            '**Wazemmes** : populaire, mélangé, avec son grand marché du dimanche matin. Un quartier où l’on se croise et se recroise.',
            '**Le Vieux-Lille** : pavés, façades flamandes, boutiques et bars. Plus chic, très agréable pour une balade à deux.',
            '**Moulins** : ancien quartier ouvrier, aujourd’hui très étudiant et associatif.',
            '**Fives et Saint-Maurice-Pellevoisin** : résidentiels, avec une vie de quartier en plein renouveau et de nombreux nouveaux habitants.',
            '**Le centre**, autour de la Grand’Place : le point de rendez-vous évident pour retrouver quelqu’un.',
          ],
        },
      ],
    },
    {
      title: 'Où rencontrer des gens à Lille',
      blocks: [
        '**La Citadelle et le bois de Boulogne** : le poumon vert de la ville. Groupes de course, sport en plein air et pique-niques s’y retrouvent toute l’année, même quand le ciel hésite.',
        '**La Braderie**, le premier week-end de septembre : la ville entière dans la rue, et l’occasion parfaite pour proposer une sortie à une connaissance de la rentrée.',
        '**Les estaminets et bars de quartier** : les tables partagées et les soirées jeux de société y sont fréquentes. Viens en habitué plutôt qu’en touriste.',
        '**Les clubs sportifs et culturels** : chorales, théâtre, escalade, foot loisir. La métropole en regorge, et le forum des associations de la rentrée est l’endroit pour faire le tour.',
        '**La Belgique à deux pas** : une excursion à Gand, à Bruges ou à [Bruxelles](/se-faire-des-amis/bruxelles/) en petit groupe soude bien plus qu’une soirée de plus en centre-ville.',
        'Tu restes après tes études et ton cercle a fondu ? Notre guide [se faire des amis à l’âge adulte](/guides/se-faire-des-amis-adulte/) parle justement de ce moment.',
      ],
    },
  ],
  minimoa: {
    title: 'Minimoa à Lille',
    blocks: [
      'À Lille, tu discutes facilement, mais tu revois rarement. Minimoa aide sur ce point précis. Ton minimoa te présente des gens près de chez toi qui partagent ta vision de la vie, avec les raisons de son choix, et vous laisse décider de la suite.',
      'Vos minimoas vivent dans vos discussions : ils brisent la glace, relancent après un silence, et chaque lien a 7 vies pour vous rappeler de ne ghoster personne. Pour vous voir pour de vrai, vous pouvez tenir une habitude ensemble, comme courir à la Citadelle deux fois par semaine.',
      'L’essentiel est gratuit, sans pub. Ta position est arrondie à environ 300 mètres, jamais en direct. Réservé aux 18 ans et plus.',
    ],
  },
  quartier: {
    text: 'Minimoa ouvre ville par ville : à 50 inscrits, Lille ouvre. Inscris-toi, et partage le lien à tes anciens camarades de promo restés dans le coin.',
    zones: ['lille'],
  },
  faq: [
    {
      q: 'Comment se faire des amis sur Lille après ses études ?',
      a: 'Recrée ce que la fac faisait pour toi : voir les mêmes personnes chaque semaine sans avoir à l’organiser. Un club, un cours du soir ou du bénévolat à horaire fixe font très bien ce travail.',
    },
    {
      q: 'Les Lillois sont-ils accueillants ?',
      a: 'La convivialité du Nord n’est pas un mythe : on te parlera facilement au comptoir ou au marché. Pour aller plus loin, il faut proposer un deuxième rendez-vous, idéalement quelque chose de régulier.',
    },
    {
      q: 'Où rencontrer des gens à Lille ?',
      a: 'À Wazemmes et dans le Vieux-Lille pour la vie de quartier, à la Citadelle pour le sport, dans les estaminets pour les tables partagées, et dans les associations pour les liens qui durent.',
    },
  ],
  near: ['bruxelles', 'paris', 'strasbourg'],
  guides: ['se-faire-des-amis-adulte', 'associations-activites-rencontrer-du-monde', 'se-faire-des-amis-timide'],
  image: { src: '/img/m/pia_rit.webp', width: 450, height: 500, alt: 'Pia, une minimoa violette à petites cornes, qui éclate de rire' },
  og: { lines: ['SE FAIRE', 'DES AMIS', 'À LILLE.'], panel: 'orange' },
  updated: '2026-11-18',
};
