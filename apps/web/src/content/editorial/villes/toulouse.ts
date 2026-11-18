import type { CityPage } from '../types';

export const toulouse: CityPage = {
  slug: 'toulouse',
  name: 'Toulouse',
  meta: {
    title: 'Se faire des amis à Toulouse : où rencontrer du monde',
    description: 'Se faire des amis à Toulouse : Carmes, Saint-Cyprien, prairie des Filtres, canal du Midi, associations. Et ton minimoa pour rencontrer des voisins.',
  },
  h1: 'Se faire des amis à Toulouse',
  lead: 'Toulouse est une grande ville étudiante qui vit dehors une bonne partie de l’année. On y arrive pour la fac, pour l’aéronautique ou pour le soleil, et on se rend compte qu’après le premier cercle de collègues, il faut aller chercher le reste.',
  keywords: [
    'se faire des amis à Toulouse',
    'se faire des amis sur Toulouse',
    'rencontrer des gens à Toulouse',
    'comment se faire des amis à Toulouse',
    'comment rencontrer des gens à Toulouse',
    'où rencontrer des gens à Toulouse',
  ],
  sections: [
    {
      title: 'La ville rose, entre étudiants et ingénieurs',
      blocks: [
        'Toulouse a deux visages qui se croisent peu. D’un côté, des dizaines de milliers d’étudiants qui font vivre le centre en semaine. De l’autre, les salariés de l’aéronautique et du spatial, souvent arrivés d’ailleurs pour un poste, installés en périphérie, et dont la vie sociale tourne autour du travail.',
        'Si tu es dans le second groupe, le risque est connu : des journées pleines, des collègues sympathiques, et des week-ends un peu vides. La bonne nouvelle, c’est que Toulouse se prête très bien aux activités de groupe en plein air, et que beaucoup de gens sont dans ton cas.',
      ],
    },
    {
      title: 'Quartiers où la vie se passe',
      blocks: [
        {
          list: [
            '**Les Carmes** : petites rues, marché couvert, cafés serrés. Un quartier où l’on devient habitué en quelques semaines.',
            '**Saint-Cyprien**, rive gauche : populaire et vivant, avec ses marchés et ses bords de Garonne.',
            '**Le Capitole et Saint-Pierre** : le centre de la sortie, la place Saint-Pierre se remplit les soirs de beau temps.',
            '**Arnaud-Bernard et Saint-Sernin** : étudiant, mélangé, avec une vie associative riche.',
            '**Les Minimes, Compans-Caffarelli, Saint-Agne** : plus résidentiels, avec des parcs et une vie de quartier plus tranquille.',
          ],
        },
      ],
    },
    {
      title: 'Où rencontrer des gens à Toulouse',
      blocks: [
        '**La prairie des Filtres et les quais de la Daurade** : au coucher du soleil, une bonne partie de la ville s’y assoit au bord de la Garonne. Arrive avec un jeu de cartes ou un molkky, et la conversation vient souvent seule.',
        '**Le canal du Midi** : ses berges ombragées sont un itinéraire de course et de vélo très fréquenté. Les groupes de course du soir y sont faciles à rejoindre.',
        '**Le rugby** : ici, c’est une culture. Regarder un match dans un bar de quartier, c’est se retrouver à commenter avec les voisins de table, même sans y connaître grand-chose.',
        '**Le marché Saint-Aubin** du dimanche : marché, brocante et rendez-vous de quartier. Un bon endroit pour devenir un visage familier.',
        '**Les associations** : clubs de sport loisir, danse, théâtre, jardins partagés, astronomie. Ta mairie de quartier et les forums des associations de la rentrée sont les meilleurs points d’entrée.',
        'Si les week-ends te pèsent, notre guide [où rencontrer des gens quand on est seul](/guides/rencontrer-des-gens-seul/) propose des idées pour les sorties en solo.',
      ],
    },
  ],
  minimoa: {
    title: 'Comment Minimoa t’aide à Toulouse',
    blocks: [
      'Minimoa ne remplace pas la prairie des Filtres. Il t’aide à y aller avec quelqu’un. Ton minimoa te présente des gens près de chez toi qui partagent ta façon de voir la vie, et il te dit pourquoi : mêmes rythmes, mêmes envies, une différence à explorer.',
      'Vous vous saluez, vous vous parlez, et si le courant passe, vous pouvez tenir une habitude ensemble : courir le long du canal, aller au marché le dimanche, lire avant de dormir. Les groupes de 3 à 8 personnes tiennent une série commune : quand tout le monde est à jour, elle monte.',
      'Personne ne t’écrit sans ton accord. Ta position est arrondie et jamais montrée en direct. C’est gratuit, sans pub, à partir de 18 ans.',
    ],
  },
  quartier: {
    text: 'Minimoa ouvre ville par ville : à 50 inscrits, Toulouse ouvre. Inscris-toi en dix secondes, et partage le lien à tes collègues fraîchement arrivés.',
    zones: ['toulouse'],
  },
  faq: [
    {
      q: 'Comment se faire des amis à Toulouse en dehors du travail ?',
      a: 'Choisis une activité qui revient chaque semaine et qui n’a rien à voir avec ton métier : sport collectif loisir, chorale, bénévolat. C’est la régularité, plus que l’intensité, qui transforme des inconnus en amis.',
    },
    {
      q: 'Où rencontrer des gens à Toulouse ?',
      a: 'Au bord de la Garonne (prairie des Filtres, quais de la Daurade), le long du canal du Midi pour le sport, aux Carmes et à Saint-Cyprien pour la vie de quartier, et dans les associations pour les liens qui durent.',
    },
    {
      q: 'Toulouse est-elle une bonne ville pour rencontrer du monde ?',
      a: 'Oui : beaucoup de monde vient d’ailleurs, le climat pousse à vivre dehors, et la ville reste assez compacte pour se voir sans traverser la métropole. Le plus dur est souvent de sortir du cercle du travail.',
    },
  ],
  near: ['montpellier', 'bordeaux', 'marseille'],
  guides: ['rencontrer-des-gens-seul', 'se-faire-des-amis-adulte', 'associations-activites-rencontrer-du-monde'],
  image: { src: '/img/m/suzie_danse.webp', width: 450, height: 500, alt: 'Suzie, une minimoa rose à antennes pompons, qui danse' },
  og: { lines: ['SE FAIRE', 'DES AMIS', 'À TOULOUSE.'], panel: 'rose' },
  updated: '2026-11-18',
};
