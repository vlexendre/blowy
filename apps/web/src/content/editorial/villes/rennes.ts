import type { CityPage } from '../types';

export const rennes: CityPage = {
  slug: 'rennes',
  name: 'Rennes',
  country: 'fr',
  meta: {
    title: 'Se faire des amis à Rennes : où rencontrer des gens',
    description: 'Rencontrer des gens à Rennes : place Sainte-Anne, marché des Lices, Thabor, bords de Vilaine, associations. Et ton minimoa pour te présenter des Rennais.',
  },
  h1: 'Se faire des amis à Rennes',
  lead: 'Rennes est une ville jeune, à taille humaine, où l’on traverse le centre à pied en vingt minutes. Parfait pour se revoir souvent. Encore faut-il savoir où trouver les gens quand on n’a plus vingt ans et plus de partiels.',
  keywords: [
    'se faire des amis à Rennes',
    'rencontrer des gens à Rennes',
    'rencontrer des gens sur Rennes',
    'rencontrer des gens Rennes',
    'comment rencontrer des gens à Rennes',
  ],
  sections: [
    {
      title: 'Une ville jeune, mais pas que pour les étudiants',
      blocks: [
        'Rennes compte une très forte population étudiante par rapport à sa taille, et ça se sent : le jeudi soir, le centre appartient aux vingt ans. Si tu es dans cette tranche d’âge, tu trouveras du monde sans chercher.',
        'Pour les jeunes actifs, les trentenaires qui arrivent avec un poste, ou ceux qui restent après leurs études, c’est différent. La ville reste accueillante, mais il faut aller vers les lieux où l’on se retrouve en dehors de la fête : marchés, clubs, associations, jardins.',
      ],
    },
    {
      title: 'Les quartiers de Rennes',
      blocks: [
        {
          list: [
            '**Le centre historique**, autour de la place Sainte-Anne et des maisons à pans de bois : le cœur de la sortie, avec la célèbre rue Saint-Michel, surnommée « rue de la Soif ».',
            '**Les Lices** : la place du grand marché du samedi matin, l’un des plus grands de France. Le vrai rendez-vous hebdomadaire des Rennais.',
            '**Thabor et Saint-Hélier** : calmes et verts, autour du parc du Thabor.',
            '**Sud-Gare et la Courrouze** : quartiers en mutation, beaucoup de nouveaux logements et donc de nouveaux habitants.',
            '**Villejean et Beaulieu** : les quartiers des campus, vivants pendant l’année universitaire.',
          ],
        },
      ],
    },
    {
      title: 'Où rencontrer des gens à Rennes',
      blocks: [
        '**Le marché des Lices** le samedi : beaucoup de Rennais y passent la matinée, entre courses et café. Y aller chaque semaine, c’est se faire connaître des commerçants, puis des habitués.',
        '**Le parc du Thabor** : pique-niques, lecture, jeux. Les beaux jours, c’est l’endroit où proposer un rendez-vous détendu.',
        '**Les bords de Vilaine** et le canal d’Ille-et-Rance : idéals pour la course et le vélo, et des points de départ pour des sorties à plusieurs le week-end.',
        '**La culture** : les Trans Musicales en décembre, les salles de concert, et les Champs Libres, lieu culturel près de la gare qui accueille conférences et expositions.',
        '**Les associations** : Rennes a une vie associative très dense, du sport au théâtre en passant par les langues et la musique bretonne. Un fest-noz est d’ailleurs une excellente façon de rencontrer du monde : on danse en chaîne, main dans la main, sans avoir besoin de savoir.',
        'Tu viens d’emménager ? Notre guide pour [repartir de zéro dans une ville inconnue](/guides/se-faire-des-amis-nouvelle-ville/) te propose un plan pour les trois premiers mois.',
        'Avec Paris à environ une heure et demie de TGV et Nantes tout près, beaucoup de Rennais ont une vie en deux endroits. Nos pages pour [rencontrer du monde à Nantes](/se-faire-des-amis/nantes/) et pour [se faire des amis à Paris quand on n’y connaît personne](/se-faire-des-amis/paris/) prolongent celle-ci. Et pour Minimoa, [ouvre ton quartier rennais](/quartier/).',
      ],
    },
  ],
  minimoa: {
    title: 'Minimoa à Rennes',
    blocks: [
      'Dans une ville compacte comme Rennes, la proximité joue en ta faveur. Ton minimoa te présente des personnes de ta ville qui voient la vie comme toi, et te dit ce que vous avez en commun : même rythme, mêmes envies, une différence à explorer.',
      'À partir de là, c’est vous qui décidez. Une habitude tenue à deux ou en groupe (le marché du samedi, une course au Thabor) est souvent le meilleur moyen de passer de « on s’est parlé une fois » à « on se voit toutes les semaines ». Et ton minimoa adore que tu sortes : il te le rend en te présentant plus de monde.',
      'Ta position n’est jamais en direct, rien ne se passe sans ton accord, l’app est gratuite et réservée aux 18 ans et plus.',
    ],
  },
  quartier: {
    text: 'Minimoa ouvre ville par ville : à 50 inscrits, Rennes ouvre. Inscris-toi, et invite tes voisins pour accélérer.',
    zones: ['rennes'],
  },
  faq: [
    {
      q: 'Comment rencontrer des gens à Rennes quand on n’est plus étudiant ?',
      a: 'Fuis les soirs de fête étudiante et vise les rendez-vous réguliers : marché des Lices le samedi, clubs de sport loisir, associations culturelles, jardins partagés. Tu y croiseras des gens de ton âge et de ton rythme.',
    },
    {
      q: 'Rennes est-elle une ville facile pour se faire des amis ?',
      a: 'Plutôt, oui : la ville est jeune, compacte et très associative. On s’y croise souvent, ce qui aide une connaissance à devenir une amie. Le plus important est de proposer de se revoir.',
    },
    {
      q: 'Où rencontrer des gens à Rennes ?',
      a: 'Place Sainte-Anne pour sortir, aux Lices pour le marché, au Thabor pour les après-midis, et dans les associations, très nombreuses, pour des liens qui durent.',
    },
  ],
  near: ['nantes', 'paris', 'lille'],
  guides: ['se-faire-des-amis-nouvelle-ville', 'se-faire-des-amis-adulte', 'rencontrer-des-gens-seul'],
  image: { src: '/img/m/pia_coucou.webp', width: 450, height: 500, alt: 'Pia, une minimoa violette à petites cornes, qui fait coucou' },
  og: { lines: ['SE FAIRE', 'DES AMIS', 'À RENNES.'], panel: 'accent' },
  updated: '2026-11-19',
};
