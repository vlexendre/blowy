import type { CityPage } from '../types';

export const nice: CityPage = {
  slug: 'nice',
  name: 'Nice',
  meta: {
    title: 'Se faire des amis à Nice : où rencontrer des gens',
    description: 'Rencontrer des gens à Nice : Vieux-Nice, cours Saleya, Promenade des Anglais, port, colline du Château. Où se faire des amis, et ouvre ton quartier.',
  },
  h1: 'Se faire des amis à Nice',
  lead: 'Nice a la mer, la lumière et la montagne à une heure. Elle a aussi une population qui change avec les saisons, beaucoup de gens de passage, et des Niçois de longue date attachés à leur cercle. Se faire des amis y demande un peu de méthode.',
  keywords: [
    'se faire des amis à Nice',
    'se faire des amis Nice',
    'rencontrer des gens à Nice',
    'rencontrer des gens sur Nice',
    'site pour se faire des amis Nice',
  ],
  sections: [
    {
      title: 'Entre saisonniers, expatriés et Niçois de toujours',
      blocks: [
        'L’été, la ville se remplit de visiteurs, de travailleurs saisonniers et d’étudiants étrangers. L’hiver, elle redevient plus calme, plus locale. Si tu t’installes pour de bon, tu remarqueras vite cette différence : beaucoup de gens que tu rencontres en juillet sont repartis en octobre.',
        'Le conseil est donc simple : cherche les gens qui restent. Ceux qu’on retrouve au club, au marché ou au bord de l’eau tous les matins, été comme hiver. Ce sont eux qui deviendront des amis.',
      ],
    },
    {
      title: 'Les quartiers niçois',
      blocks: [
        {
          list: [
            '**Le Vieux-Nice** : ruelles colorées, cours Saleya et son marché, petites places. Touristique en journée, très vivant le soir.',
            '**Le port Lympia** : quartier en plein renouveau, avec ses cafés, ses bateaux et une vie locale en hausse.',
            '**La Libération** : autour de son grand marché quotidien, le quartier des Niçois qui font leurs courses et se disent bonjour.',
            '**Le Carré d’or et Jean-Médecin** : le centre commerçant, pratique pour se retrouver.',
            '**Cimiez et Saint-Roch** : résidentiels, plus calmes, sur les hauteurs ou à l’écart du centre.',
          ],
        },
      ],
    },
    {
      title: 'Où rencontrer des gens à Nice',
      blocks: [
        '**La Promenade des Anglais** : le grand terrain de jeu des coureurs, cyclistes et rollers. Courir le long de la baie à heure fixe, c’est croiser les mêmes têtes jusqu’à se dire bonjour.',
        '**La mer** : nage en eau libre le matin, paddle, plongée, voile. Les sports nautiques se pratiquent en club et en petit groupe, ce qui crée des liens solides.',
        '**La colline du Château** : un belvédère où l’on monte à plusieurs pour la vue, et un bon prétexte de sortie à proposer.',
        '**La Coulée verte** (promenade du Paillon) : l’espace vert au cœur de la ville, plein de monde aux beaux jours.',
        '**Le Carnaval** en février : la ville en fête pendant deux semaines. Une belle occasion de sortir en groupe.',
        '**La montagne** : les stations et les sentiers de l’arrière-pays sont tout proches. Les clubs de randonnée ou de ski organisent des sorties collectives où l’on fait connaissance pendant les trajets.',
        'Tu passes beaucoup de temps seul en dehors de la saison ? Notre guide [où rencontrer des gens quand on est seul](/guides/rencontrer-des-gens-seul/) a des idées concrètes.',
      ],
    },
  ],
  minimoa: {
    title: 'Minimoa à Nice',
    blocks: [
      'À Nice, la question n’est pas « où sont les gens ? » mais « qui reste ? ». Ton minimoa te présente des personnes qui habitent près de chez toi, dont la vision de la vie va avec la tienne. Des voisins, pas des touristes.',
      'Il te dit ce qui vous rapproche, puis tu choisis de saluer ou non. Si ça accroche, vous pouvez tenir une habitude commune (nager le matin, courir sur la Promenade), à deux ou dans un groupe de 3 à 8. Les liens ont 7 vies : de quoi ne pas se perdre de vue quand la saison s’emballe.',
      'L’essentiel est gratuit, sans pub. Ta position est arrondie, jamais en direct. Réservé aux 18 ans et plus.',
    ],
  },
  quartier: {
    text: 'Minimoa ouvre ville par ville : à 50 inscrits, Nice ouvre. Inscris-toi, puis invite tes voisins et tes collègues.',
    zones: ['nice'],
  },
  faq: [
    {
      q: 'Comment se faire des amis à Nice quand on vient d’arriver ?',
      a: 'Mise sur les activités qui durent toute l’année : un club nautique, un groupe de course, une association. En été, tu rencontreras beaucoup de monde de passage ; en hiver, tu sauras qui reste.',
    },
    {
      q: 'Existe-t-il un site ou une appli pour se faire des amis à Nice ?',
      a: 'Il en existe plusieurs, souvent pensées pour les événements. Minimoa fait autrement : ton minimoa te présente des gens qui habitent près de chez toi et te ressemblent. Il ouvre à Nice dès 50 inscrits, et tu peux suivre le compteur sur cette page.',
    },
    {
      q: 'Où rencontrer des gens à Nice ?',
      a: 'Au Vieux-Nice et au port pour sortir, sur la Promenade des Anglais et en mer pour le sport, au marché de la Libération pour la vie locale, et dans les clubs de randonnée pour les week-ends.',
    },
  ],
  near: ['marseille', 'montpellier', 'lyon'],
  guides: ['rencontrer-des-gens-seul', 'se-faire-des-amis-nouvelle-ville', 'associations-activites-rencontrer-du-monde'],
  image: { src: '/img/m/suzie_coucou.webp', width: 450, height: 500, alt: 'Suzie, une minimoa rose à antennes pompons, qui fait coucou' },
  og: { lines: ['SE FAIRE', 'DES AMIS', 'À NICE.'], panel: 'rose' },
  updated: '2026-11-18',
};
