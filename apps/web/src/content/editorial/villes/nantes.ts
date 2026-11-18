import type { CityPage } from '../types';

export const nantes: CityPage = {
  slug: 'nantes',
  name: 'Nantes',
  meta: {
    title: 'Se faire des amis à Nantes : où rencontrer des gens',
    description: 'Se faire des amis à Nantes : île de Nantes, Bouffay, bords de l’Erdre, Talensac, associations. Où rencontrer des gens, et comment ouvrir ton quartier.',
  },
  h1: 'Se faire des amis à Nantes',
  lead: 'Nantes a une réputation de ville douce à vivre, et elle attire. Beaucoup de gens y arrivent pour un travail ou pour quitter Paris, avec la même question une fois installés : par où commencer quand on ne connaît personne ?',
  keywords: [
    'se faire des amis à Nantes',
    'se faire des amis sur Nantes',
    'rencontrer des gens à Nantes',
    'rencontrer des gens Nantes',
    'comment rencontrer des gens à Nantes',
  ],
  sections: [
    {
      title: 'Nantes, ville de nouveaux arrivants',
      blocks: [
        'La métropole nantaise gagne des habitants chaque année. Ça veut dire deux choses. D’abord, que tu es loin d’être seul à chercher du monde. Ensuite, que la ville est habituée à accueillir : la vie culturelle et associative y est riche, et souvent pensée pour qu’on y participe, pas seulement pour qu’on la regarde.',
        'Ce qui manque le plus aux nouveaux Nantais, ce n’est pas l’occasion de sortir. C’est la régularité : retrouver les mêmes têtes d’une semaine à l’autre, jusqu’à ce qu’une connaissance devienne une amie.',
      ],
    },
    {
      title: 'Les quartiers et leur ambiance',
      blocks: [
        {
          list: [
            '**Le Bouffay** : le vieux centre médiéval, ses ruelles et ses bars. Animé, surtout le soir.',
            '**L’île de Nantes** : anciens chantiers navals transformés, grands espaces, hangars, et un quartier en pleine construction où beaucoup d’habitants sont nouveaux.',
            '**Graslin et Talensac** : plus bourgeois, avec le marché de Talensac comme rendez-vous du week-end.',
            '**Chantenay et Zola** : plus résidentiels, une vraie vie de quartier, des familles et des jeunes actifs.',
            '**Les bords de l’Erdre** : au nord, une rivière bordée de chemins, de guinguettes en été et de clubs d’aviron.',
          ],
        },
      ],
    },
    {
      title: 'Les occasions de rencontrer du monde à Nantes',
      blocks: [
        '**L’été culturel** : chaque été, le parcours du Voyage à Nantes relie des œuvres à travers la ville. Le suivre à deux ou à trois est une excellente sortie à proposer à une personne rencontrée récemment.',
        '**Les bords de l’Erdre et de la Loire** : course, vélo, canoë, guinguettes. Les sports d’eau se pratiquent en club, en petit groupe, ce qui crée vite des liens.',
        '**Les marchés** de Talensac ou de la Petite-Hollande : y aller chaque semaine fait de toi un habitué, et les habitués se parlent.',
        '**Les jardins** : le Jardin des plantes près de la gare, et de nombreux jardins partagés de quartier où l’on jardine à plusieurs.',
        '**Le bénévolat culturel** : festivals et salles de concert cherchent régulièrement des bénévoles. Une façon de rencontrer des gens qui aiment la même musique que toi.',
        'Pour les associations à rejoindre selon ton caractère, lis notre guide [associations et activités pour rencontrer du monde](/guides/associations-activites-rencontrer-du-monde/).',
      ],
    },
  ],
  minimoa: {
    title: 'Ce que Minimoa apporte à Nantes',
    blocks: [
      'Dans une ville qui accueille autant de monde, le difficile est de trouver **les bonnes personnes**, près de chez toi. C’est le travail de ton minimoa : il te présente des gens de ton coin dont la vision de la vie va avec la tienne, et il t’explique ce que vous partagez.',
      'Tu restes maître de tout : tu salues si tu veux, l’autre accepte s’il veut. Ensuite, vous pouvez vous fixer une habitude commune (une sortie vélo le long de l’Erdre, un marché le samedi) et la tenir à plusieurs. Ton minimoa, lui, adore quand tu sors : plus tu vois du monde, plus il t’en présente.',
      'L’app est gratuite et sans pub, ta position n’est jamais montrée en direct, et elle est réservée aux 18 ans et plus.',
    ],
  },
  quartier: {
    text: 'Minimoa ouvre ville par ville : à 50 inscrits, Nantes ouvre. Inscris-toi, et fais passer le lien autour de toi.',
    zones: ['nantes'],
  },
  faq: [
    {
      q: 'Comment se faire des amis sur Nantes quand on vient de Paris ?',
      a: 'Profite du rythme plus calme : propose des choses simples et régulières (un footing, un marché, une sortie vélo) plutôt que des soirées. Beaucoup de Nantais sont arrivés récemment, eux aussi, et sont ouverts aux nouvelles têtes.',
    },
    {
      q: 'Où rencontrer des gens à Nantes ?',
      a: 'Au Bouffay pour sortir, sur l’île de Nantes et le long de l’Erdre pour les activités en plein air, dans les clubs de sport et les associations culturelles pour des liens durables.',
    },
    {
      q: 'Minimoa est-il ouvert à Nantes ?',
      a: 'Minimoa ouvre quand 50 personnes de la ville sont inscrites. Le compteur est sur cette page et sur [Ouvre ton quartier](/quartier/) ; on te prévient par e-mail à l’ouverture.',
    },
  ],
  near: ['rennes', 'bordeaux', 'paris'],
  guides: ['se-faire-des-amis-nouvelle-ville', 'associations-activites-rencontrer-du-monde', 'se-faire-des-amis-adulte'],
  image: { src: '/img/m/gaston_applaudit.webp', width: 450, height: 500, alt: 'Gaston, un minimoa orange à un seul grand œil, qui applaudit' },
  og: { lines: ['SE FAIRE', 'DES AMIS', 'À NANTES.'], panel: 'violet' },
  updated: '2026-11-18',
};
