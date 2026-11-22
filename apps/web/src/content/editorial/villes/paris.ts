import type { CityPage } from '../types';

const zones = Array.from({ length: 20 }, (_, i) => `paris-${i + 1}`);

export const paris: CityPage = {
  slug: 'paris',
  name: 'Paris',
  country: 'fr',
  meta: {
    title: 'Se faire des amis à Paris : où rencontrer des gens',
    description: 'Rencontrer des gens à Paris quand on ne connaît personne : quartiers, lieux, activités, et comment ton minimoa te présente des voisins qui te ressemblent.',
  },
  h1: 'Se faire des amis à Paris',
  lead: 'Plus de deux millions d’habitants, des terrasses à chaque coin de rue, et pourtant on peut vivre des années sans connaître personne dans son immeuble. Bonne nouvelle : à Paris, tout se joue à l’échelle de l’arrondissement.',
  keywords: [
    'rencontrer des gens à Paris',
    'se faire des amis à Paris',
    'se faire des amis sur Paris',
    'comment rencontrer des gens à Paris',
    'comment se faire des amis à Paris',
    'activités pour rencontrer des gens Paris',
    'où rencontrer des gens à Paris',
  ],
  sections: [
    {
      title: 'Paris, une ville où tout le monde vient d’ailleurs',
      blocks: [
        'Études, premier poste, rupture, mutation : beaucoup de gens que tu croises dans le métro ne sont pas nés ici. On a l’impression que chacun a déjà sa bande, alors qu’énormément de monde cherche exactement la même chose que toi, souvent en silence.',
        'Le piège parisien, c’est la taille. Tu t’entends bien avec quelqu’un du 15e à une soirée dans le 18e, et vous ne vous revoyez jamais : quarante minutes de ligne 12 pour boire un verre. Les amitiés qui tiennent sont celles qui se voient sans effort : même quartier, même ligne, mêmes habitudes.',
      ],
    },
    {
      title: 'Les quartiers où l’on se parle plus facilement',
      blocks: [
        'Chaque arrondissement a son ambiance, et certains se prêtent mieux que d’autres aux rencontres du quotidien :',
        {
          list: [
            '**Le 11e et le 20e** (Oberkampf, Belleville, Ménilmontant) : beaucoup de jeunes actifs, des terrasses serrées où l’on finit par discuter avec la table d’à côté.',
            '**Le 10e**, autour du canal Saint-Martin : les quais se remplissent dès les premiers beaux jours, et un apéro au bord de l’eau attire vite du monde.',
            '**Le 17e**, côté Batignolles : une ambiance de village, un grand parc, des parents et des chiens, donc des conversations qui démarrent toutes seules.',
            '**Le 13e**, côté Butte-aux-Cailles : des rues pavées, des bars de quartier, des habitués qui se reconnaissent.',
            '**Le 18e**, de Montmartre à la Goutte-d’Or : touristique en haut de la butte, très vivant et très local dès qu’on descend.',
          ],
        },
        'Le meilleur quartier pour te faire des amis reste le tien. Quelqu’un à dix minutes à pied, tu le reverras ; à l’autre bout de Paris, beaucoup moins.',
      ],
    },
    {
      title: 'Où rencontrer des gens à Paris, concrètement',
      blocks: [
        'Les endroits qui marchent le mieux sont ceux où tu reviens chaque semaine, avec les mêmes personnes. La répétition fait plus que le charisme.',
        {
          list: [
            '**Les parcs** : les Buttes-Chaumont, le parc de la Villette ou le bois de Vincennes accueillent des groupes de course, de foot ou de pique-nique tous les week-ends. Beaucoup sont ouverts à qui se présente.',
            '**Les cafés-langues** : de nombreux bars organisent des soirées d’échange linguistique. On y vient pour parler, c’est le principe, donc personne ne te trouvera bizarre de lancer la conversation.',
            '**Les ateliers de quartier** : la Ville propose des activités à l’année (danse, théâtre, céramique, langues) dans ses centres d’animation, à des tarifs accessibles. Un cours hebdomadaire, c’est le même groupe pendant des mois.',
            '**Le bénévolat** : distributions alimentaires, aide aux devoirs, ressourceries. Tu rends service, et tu côtoies des gens qui partagent tes valeurs.',
            '**Les grands rendez-vous** : la Fête de la musique en juin ou la Nuit blanche à l’automne transforment la ville en terrasse géante. Parfait pour sortir avec une connaissance et en rencontrer d’autres.',
          ],
        },
        'Tu hésites ? Le guide des [clubs et associations où l’on se fait des amis](/guides/associations-activites-rencontrer-du-monde/) t’aide à choisir. Et si Paris te pèse, [Lille, à une heure de TGV](/se-faire-des-amis/lille/), ou [la vie rennaise](/se-faire-des-amis/rennes/) ont aussi leurs pages, comme [Reims](/se-faire-des-amis/reims/).',
      ],
    },
  ],
  minimoa: {
    title: 'Comment Minimoa t’aide à Paris',
    blocks: [
      'Minimoa part d’une idée simple : à Paris, la distance tue plus d’amitiés que le manque d’atomes crochus. Ton minimoa, un petit compagnon que tu élèves dans l’app, ne te présente que des gens **près de chez toi** dont la vision de la vie va avec la tienne. Il te dit pourquoi : trois points communs, une différence à explorer.',
      'Ensuite, rien ne se passe sans ton accord. Tu salues, l’autre accepte, vous vous écrivez. Vous pouvez aussi tenir une habitude ensemble (marcher le matin, lire, courir le long du canal) dans un groupe de 3 à 8 personnes, ou créer un groupe libre pour les gens de ton arrondissement. Et quand tu sors, ton minimoa est en forme : il te présente encore plus de monde.',
      'Ta position n’est jamais affichée en direct : elle est arrondie à environ 300 mètres et décalée. Minimoa est gratuit, sans pub, et réservé aux 18 ans et plus.',
    ],
  },
  quartier: {
    text: 'À Paris, Minimoa ouvre arrondissement par arrondissement : à 50 inscrits, le tien ouvre. Choisis-le, et invite tes voisins pour qu’il ouvre plus vite.',
    zones,
  },
  faq: [
    {
      q: 'Est-ce difficile de se faire des amis à Paris ?',
      a: 'C’est surtout lent au début. La ville est grande, les journées sont longues, et chacun a l’air pressé. Mais énormément de Parisiens viennent d’ailleurs et cherchent aussi du monde. Ce qui aide le plus : rester dans ton arrondissement et revoir les mêmes têtes chaque semaine.',
    },
    {
      q: 'Comment rencontrer des gens à Paris quand on ne connaît personne ?',
      a: 'Choisis une activité régulière près de chez toi (un cours, un club de course, du bénévolat) et tiens-la au moins deux mois. Ajoute une sortie ponctuelle par mois, comme un café-langue. Le guide pour [s’installer et se faire des amis après un déménagement](/guides/se-faire-des-amis-nouvelle-ville/) détaille un plan pour les premières semaines.',
    },
    {
      q: 'Quelles activités pour rencontrer des gens à Paris ?',
      a: 'Celles où l’on se revoit : sports collectifs ou groupes de course dans les parcs, ateliers des centres d’animation de la Ville, chorales, théâtre amateur, bénévolat. Les soirées géantes sont plus amusantes que efficaces : on y parle beaucoup, on s’y revoit peu.',
    },
    {
      q: 'Minimoa est-il disponible à Paris ?',
      a: 'Minimoa ouvre arrondissement par arrondissement. Inscris-toi dans le tien sur la page [Ouvre ton quartier](/quartier/) : tu vois combien de personnes sont déjà inscrites, et on te prévient par e-mail dès qu’il ouvre.',
    },
  ],
  near: ['lille', 'rennes', 'nantes'],
  guides: ['se-faire-des-amis-nouvelle-ville', 'se-faire-des-amis-adulte', 'associations-activites-rencontrer-du-monde'],
  image: { src: '/img/m/groupe.webp', width: 700, height: 334, alt: 'Suzie, Nino et Gaston, trois minimoas, qui se tapent dans la main' },
  og: { lines: ['SE FAIRE', 'DES AMIS', 'À PARIS.'], panel: 'accent' },
  updated: '2026-11-19',
};
