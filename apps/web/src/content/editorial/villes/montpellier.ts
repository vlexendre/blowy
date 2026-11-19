import type { CityPage } from '../types';

export const montpellier: CityPage = {
  slug: 'montpellier',
  name: 'Montpellier',
  country: 'fr',
  meta: {
    title: 'Se faire des amis à Montpellier : rencontrer des gens',
    description: 'Se faire des amis à Montpellier : l’Écusson, le Peyrou, les plages, les associations. Où rencontrer des gens, et ouvre ton quartier sur Minimoa.',
  },
  h1: 'Se faire des amis à Montpellier',
  lead: 'Montpellier fait partie des grandes villes françaises qui grandissent le plus vite. Le soleil, la mer à côté, une population jeune : on y arrive nombreux, souvent sans connaître personne, et on cherche tous à peu près la même chose.',
  keywords: [
    'se faire des amis à Montpellier',
    'se faire des amis sur Montpellier',
    'rencontrer des gens à Montpellier',
    'rencontrer des gens sur Montpellier',
    'comment rencontrer des gens à Montpellier',
  ],
  sections: [
    {
      title: 'Une ville où presque tout le monde est nouveau',
      blocks: [
        'Entre les étudiants, les jeunes actifs du numérique et de la santé, et ceux qui viennent chercher le soleil, Montpellier est une ville de gens arrivés récemment. Dans beaucoup d’immeubles, personne n’est là depuis très longtemps.',
        'Ça rend les rencontres plus simples qu’ailleurs : on n’entre pas dans des cercles fermés depuis le collège. Mais ça a un revers. Les gens partent aussi, au bout de deux ou trois ans, et une amitié naissante peut s’arrêter avec un déménagement. Raison de plus pour multiplier les liens et les entretenir.',
      ],
    },
    {
      title: 'Les quartiers de Montpellier',
      blocks: [
        {
          list: [
            '**L’Écusson** : le centre historique piéton, ses ruelles, ses places et ses terrasses. C’est là que l’on se donne rendez-vous.',
            '**La Comédie et Antigone** : la grande place centrale, puis le quartier aux façades néoclassiques qui descend vers le Lez.',
            '**Les Beaux-Arts et Boutonnet** : quartiers vivants et étudiants, juste au nord du centre, avec une ambiance de village.',
            '**Port-Marianne** : quartier récent au bord du Lez, beaucoup de jeunes couples et de nouveaux habitants.',
            '**Figuerolles et Gambetta** : populaires, mélangés, avec leurs marchés et leurs cafés.',
          ],
        },
      ],
    },
    {
      title: 'Où rencontrer des gens à Montpellier',
      blocks: [
        '**La promenade du Peyrou** : au coucher du soleil, beaucoup de monde s’y installe. Un lieu idéal pour un premier rendez-vous entre nouveaux potes.',
        '**Les plages** : Palavas, Carnon et le littoral sont à portée de vélo ou de bus. Beach-volley, paddle, baignade : le sport de plage se pratique à plusieurs, et les groupes accueillent facilement.',
        '**Les bords du Lez** : pistes cyclables et chemins de course, très fréquentés en fin de journée.',
        '**Les marchés** : celui des Arceaux, sous l’aqueduc, et ceux des quartiers. Y retourner chaque semaine fait de toi un habitué.',
        '**L’arrière-pays** : le pic Saint-Loup et les garrigues sont à moins d’une heure. Les clubs de randonnée y emmènent des groupes le week-end, et une montée partagée rapproche vite.',
        '**Les associations** : clubs sportifs, langues, danse, théâtre. Le forum des associations de la rentrée permet d’en rencontrer beaucoup en un après-midi.',
        'Pour savoir quelle activité te ressemble, lis le guide pour [trouver l’association ou le club qui te va](/guides/associations-activites-rencontrer-du-monde/).',
        'Montpellier est au milieu de l’arc méditerranéen. Si tu fais souvent la route, nos pistes pour [rencontrer des gens à Toulouse](/se-faire-des-amis/toulouse/) et pour [se faire des amis à Marseille](/se-faire-des-amis/marseille/) te seront utiles. Et pour que Minimoa ouvre chez toi, [inscris ton quartier](/quartier/).',
      ],
    },
  ],
  minimoa: {
    title: 'Ce que Minimoa change à Montpellier',
    blocks: [
      'Dans une ville où tout le monde arrive, le plus dur est de trier. Ton minimoa le fait pour toi : il te présente des gens près de chez toi dont la vision de la vie va avec la tienne, et il te dit pourquoi, pour que tu n’aies pas à deviner.',
      'Ensuite, c’est la régularité qui fait le travail. Tenir une habitude ensemble (une baignade le dimanche, une course sur les bords du Lez, lire avant de dormir) garde le lien vivant, même quand l’un des deux est pris. Et si le silence s’installe, ton minimoa relance la conversation avant que le lien ne devienne fantôme.',
      'Gratuit, sans pub, réservé aux 18 ans et plus. Personne ne t’écrit sans ton accord.',
    ],
  },
  quartier: {
    text: 'Minimoa ouvre ville par ville : à 50 inscrits, Montpellier ouvre. Inscris-toi, et invite ceux qui viennent d’arriver comme toi.',
    zones: ['montpellier'],
  },
  faq: [
    {
      q: 'Comment se faire des amis sur Montpellier ?',
      a: 'Profite du fait que beaucoup de gens sont nouveaux : propose facilement une sortie (plage, randonnée, marché) à une personne rencontrée dans un club ou une association. Et revois-la vite : ici, les gens bougent beaucoup.',
    },
    {
      q: 'Où rencontrer des gens à Montpellier ?',
      a: 'Dans l’Écusson et aux Beaux-Arts pour la vie de quartier, au Peyrou pour les fins de journée, sur les plages et les bords du Lez pour le sport, et dans les associations pour les liens réguliers.',
    },
    {
      q: 'Montpellier est-elle une bonne ville pour rencontrer du monde ?',
      a: 'Oui : population jeune, beaucoup de nouveaux arrivants, une vie dehors toute l’année. Le seul piège est le renouvellement : entretiens les liens, car beaucoup partent après quelques années.',
    },
  ],
  near: ['marseille', 'toulouse', 'nice'],
  guides: ['associations-activites-rencontrer-du-monde', 'se-faire-des-amis-nouvelle-ville', 'se-faire-des-amis-timide'],
  image: { src: '/img/m/gaston_joue.webp', width: 450, height: 500, alt: 'Gaston, un minimoa orange à un seul grand œil, qui joue au ballon' },
  og: { lines: ['SE FAIRE', 'DES AMIS', 'À MONTPELLIER.'], panel: 'orange' },
  updated: '2026-11-19',
};
