import type { CityPage } from '../types';

export const lyon: CityPage = {
  slug: 'lyon',
  name: 'Lyon',
  country: 'fr',
  meta: {
    title: 'Se faire des amis à Lyon : où rencontrer des gens',
    description: 'Rencontrer des gens à Lyon : Croix-Rousse, Guillotière, berges du Rhône, associations. Et ton minimoa qui te présente du monde près de chez toi.',
  },
  h1: 'Se faire des amis à Lyon',
  lead: 'Lyon a la réputation d’une ville un peu réservée, où les bandes se forment au lycée et ne bougent plus. C’est à moitié vrai. L’autre moitié, ce sont des berges pleines de monde dès qu’il fait beau, et des quartiers où l’on se dit bonjour.',
  keywords: [
    'rencontrer des gens à Lyon',
    'se faire des amis à Lyon',
    'se faire des amis sur Lyon',
    'où rencontrer des gens à Lyon',
    'comment se faire des amis à Lyon',
    'comment rencontrer des gens à Lyon',
  ],
  sections: [
    {
      title: 'Lyon, ville de cercles fermés ?',
      blocks: [
        'Beaucoup de nouveaux Lyonnais racontent la même chose : les collègues sont sympas, mais le vendredi soir, chacun rejoint ses amis d’enfance. Ce n’est pas de la froideur. Les Lyonnais nés ici ont souvent un réseau déjà complet, et n’en cherchent pas activement un autre.',
        'La solution n’est donc pas de forcer la porte de ces groupes, mais de trouver les autres gens qui arrivent : étudiants qui restent après leur diplôme, salariés mutés, couples qui quittent Paris. Ils sont nombreux, et ils cherchent aussi.',
      ],
    },
    {
      title: 'Les quartiers, de la Croix-Rousse à la Guillotière',
      blocks: [
        'Lyon se vit par arrondissement, et chacun a sa façon de rencontrer du monde :',
        {
          list: [
            '**La Croix-Rousse** (1er sur les pentes, 4e sur le plateau) : l’esprit village par excellence. Le marché du boulevard, les petites places et les cafés où l’on devient vite un habitué.',
            '**La Guillotière** (7e) : animée, mélangée, étudiante. On y sort beaucoup, et on y croise toujours quelqu’un.',
            '**La Presqu’île** (1er et 2e) : le centre, entre Rhône et Saône. Pratique pour se retrouver, moins pour s’enraciner.',
            '**Le Vieux Lyon** (5e) : très touristique, mais les pentes de Fourvière offrent de belles balades à faire à plusieurs.',
            '**Monplaisir, Gerland, Vaise** : plus résidentiels, avec des parcs, des clubs de sport et une vie de quartier discrète mais réelle.',
          ],
        },
      ],
    },
    {
      title: 'Où rencontrer des gens à Lyon',
      blocks: [
        {
          list: [
            '**Les berges du Rhône** : un long ruban piéton où l’on court, roule, pique-nique et joue à la pétanque. Les groupes de course du soir y sont nombreux et accueillent les débutants.',
            '**Le parc de la Tête d’Or** : le grand rendez-vous du week-end. Idéal pour un footing à plusieurs ou un pique-nique où chacun ramène quelqu’un.',
            '**Les quais de Saône** : plus calmes, parfaits pour une balade du dimanche avec une personne rencontrée la veille.',
            '**La Fête des Lumières** en décembre : la ville entière dehors pendant plusieurs soirs. Une belle occasion de proposer une sortie à une connaissance.',
            '**Les associations** : sport, théâtre, chorale, jardins partagés. Lyon en compte des milliers, et ta mairie d’arrondissement peut t’orienter vers celles de ton quartier.',
          ],
        },
        'Ne sous-estime pas les bouchons et les tables partagées : manger côte à côte délie les langues. Pour les plus réservés, notre guide [se faire des amis quand on est timide](/guides/se-faire-des-amis-timide/) propose des façons douces de se lancer.',
        'Lyon est aussi un carrefour. Si ton travail ou tes amis t’emmènent souvent vers la Suisse ou la Méditerranée, nos pages pour [se faire des amis à Genève](/se-faire-des-amis/geneve/) et pour [rencontrer du monde à Marseille](/se-faire-des-amis/marseille/) donnent les adresses qui comptent là-bas.',
      ],
    },
  ],
  minimoa: {
    title: 'Ce que Minimoa change à Lyon',
    blocks: [
      'Puisque les cercles lyonnais sont souvent déjà pleins, Minimoa te met en relation avec des gens qui, eux, ont de la place. Ton minimoa te présente des personnes de ton arrondissement dont la vision de la vie ressemble à la tienne, et il explique pourquoi il pense que vous allez vous entendre.',
      'Vous vous saluez, vous vous écrivez, puis vous pouvez tenir une habitude ensemble : courir sur les berges trois fois par semaine, lire, se coucher plus tôt. À plusieurs, dans un groupe de 3 à 8, on lâche moins vite. Plus tu sors, plus ton minimoa est en forme, et plus il te présente de monde.',
      'Ta position reste floue (arrondie à environ 300 mètres), personne ne t’écrit sans ton oui, et l’essentiel est gratuit. L’app est réservée aux 18 ans et plus.',
    ],
  },
  quartier: {
    text: 'Minimoa ouvre Lyon arrondissement par arrondissement : à 50 inscrits, ton arrondissement ouvre. Choisis le tien pour voir où il en est.',
    zones: Array.from({ length: 9 }, (_, i) => `lyon-${i + 1}`),
  },
  faq: [
    {
      q: 'Est-ce que les Lyonnais sont difficiles à approcher ?',
      a: 'Ils ont une réputation de réserve, surtout quand ils ont grandi ici et ont déjà leurs amis. Les nouveaux arrivants, eux, sont très ouverts. Cherche-les dans les activités régulières, les clubs et les associations plutôt que dans les bandes déjà formées.',
    },
    {
      q: 'Où rencontrer des gens à Lyon ?',
      a: 'Sur les berges du Rhône et au parc de la Tête d’Or pour le sport en groupe, à la Croix-Rousse pour l’ambiance de quartier, et dans les associations de ton arrondissement pour des rencontres qui durent.',
    },
    {
      q: 'Comment se faire des amis à Lyon après ses études ?',
      a: 'Le plus dur est de quitter le rythme de la fac, où l’on voit les mêmes gens tous les jours. Recrée cette répétition : un club, un cours du soir, une habitude tenue à plusieurs. Le guide [se faire des amis à l’âge adulte](/guides/se-faire-des-amis-adulte/) explique pourquoi cette régularité compte autant.',
    },
  ],
  near: ['marseille', 'montpellier', 'strasbourg'],
  guides: ['se-faire-des-amis-timide', 'se-faire-des-amis-adulte', 'associations-activites-rencontrer-du-monde'],
  image: { src: '/img/m/duo_check.webp', width: 700, height: 456, alt: 'Nino et Pia, deux minimoas, qui se font un check' },
  og: { lines: ['SE FAIRE', 'DES AMIS', 'À LYON.'], panel: 'coral' },
  updated: '2026-11-19',
};
