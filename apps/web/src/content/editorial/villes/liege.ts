import type { CityPage } from '../types';

export const liege: CityPage = {
  slug: 'liege',
  name: 'Liège',
  country: 'be',
  meta: {
    title: 'Se faire des amis à Liège : où rencontrer des gens',
    description: 'Rencontrer des gens à Liège : le Carré, Outremeuse, la Batte, les Coteaux, la Boverie et les associations. Et ton minimoa pour te présenter du monde.',
  },
  h1: 'Se faire des amis à Liège',
  lead: 'On l’appelle la Cité ardente, et ce n’est pas pour rien : Liège aime la fête, les terrasses et les discussions qui débordent. Mais entre une soirée réussie au Carré et un ami qu’on revoit chaque semaine, il y a un pas que la ville ne fait pas toute seule.',
  keywords: [
    'rencontrer des gens à Liège',
    'rencontrer des gens Liège',
    'se faire des amis à Liège',
    'se faire des amis Liège',
    'se faire des amis en Belgique',
  ],
  sections: [
    {
      title: 'Liège, ville franche et étudiante',
      blocks: [
        'Avec son université, ses hautes écoles et ses kots, Liège vit en partie au rythme des étudiants. Pendant les années d’études, les amis se font presque sans effort. Après, beaucoup partent travailler à Bruxelles ou ailleurs, et ceux qui restent voient leur bande se réduire.',
        'Les Liégeois ont la réputation d’être directs et chaleureux, et elle est souvent méritée : on te parlera facilement au comptoir ou au marché. Pour passer de la discussion à l’amitié, il faut juste revenir, et proposer.',
      ],
    },
    {
      title: 'Les quartiers liégeois',
      blocks: [
        {
          list: [
            '**Le Carré** : le cœur festif, ses ruelles et ses cafés. Idéal pour sortir en groupe, moins pour se parler au calme.',
            '**Outremeuse** : de l’autre côté de la Meuse, un quartier populaire et fier de ses traditions, qui fait sa grande fête autour du 15 août.',
            '**Saint-Léonard** : en pleine transformation, avec de nouveaux habitants, des initiatives de quartier et des bords de Meuse aménagés.',
            '**Le centre et Hors-Château** : les vieilles rues au pied des Coteaux, les musées et les petites places où l’on s’arrête.',
            '**Cointe, Laveu et Guillemins** : plus résidentiels, sur les hauteurs ou près de la gare, avec des parcs et une vie de quartier plus calme.',
          ],
        },
      ],
    },
    {
      title: 'Où rencontrer des gens à Liège',
      blocks: [
        '**La Batte**, le dimanche matin : le grand marché le long des quais de la Meuse. Un café en terrasse après, et tu as ton rituel de la semaine.',
        '**Les Coteaux de la Citadelle** : escaliers, jardins et vue sur la ville. Une balade parfaite à deux, et chaque automne la Nocturne des Coteaux, quand des milliers de bougies éclairent les sentiers.',
        '**Le parc de la Boverie et les bords de Meuse** : course, vélo, pique-nique dès qu’il fait beau. Les groupes de jogging y sont faciles à rejoindre.',
        '**Les clubs et les cercles** : sport, théâtre amateur, chorales, jeux de société. Liège a une vie associative très riche ; demande à ta commune ou à ta bibliothèque ce qui se passe près de chez toi.',
        '**Le Village de Noël** et les festivals d’été : la ville entière dehors, et une bonne occasion d’inviter une connaissance à prendre un péket.',
        'Tu es plutôt réservé ? Notre guide [se faire des amis quand on est timide](/guides/se-faire-des-amis-timide/) propose des petits pas qui marchent, même dans une ville aussi bavarde.',
        'Tu fais la navette vers la capitale ou vers le Grand-Duché ? Voici où [se faire des amis à Bruxelles](/se-faire-des-amis/bruxelles/) et comment [rencontrer du monde au Luxembourg](/se-faire-des-amis/luxembourg/) quand on y passe ses semaines.',
      ],
    },
  ],
  minimoa: {
    title: 'Minimoa à Liège',
    blocks: [
      'L’app est disponible en Belgique, comme en Suisse et au Luxembourg. À Liège, ton minimoa te présente des gens près de chez toi qui partagent ta façon de voir la vie, avec les raisons de son choix. Personne n’est présenté sans ton accord.',
      'Une fois en contact, vos minimoas animent la conversation : ils lancent un sujet, relancent quand l’un de vous oublie de répondre, et vous rappellent qu’un lien s’entretient. Pour passer au réel, choisissez une habitude commune, comme le marché de la Batte un dimanche sur deux.',
      'Gratuit pour l’essentiel, sans pub, à partir de 18 ans. Ta position est arrondie à environ 300 mètres.',
    ],
  },
  quartier: {
    text: 'Liège n’a pas encore son compteur de quartier sur ce site. La page Ouvre ton quartier montre où en sont les ouvertures ; en attendant, parle de Minimoa autour de toi : plus vous êtes nombreux près de chez toi, plus ton minimoa a de monde à te présenter.',
    zones: [],
  },
  faq: [
    {
      q: 'Comment rencontrer des gens à Liège ?',
      a: 'Mélange un rendez-vous festif (le Carré, Outremeuse) et une activité régulière en journée : un club, une chorale, du bénévolat, ou simplement le marché de la Batte chaque dimanche. Ce sont les rendez-vous répétés qui créent les amitiés.',
    },
    {
      q: 'Comment se faire des amis à Liège après ses études ?',
      a: 'Reproduis ce que l’université faisait pour toi : voir les mêmes personnes sans devoir organiser. Un cours du soir, un club de sport ou une association de quartier à horaire fixe font très bien ce travail.',
    },
    {
      q: 'Les Liégeois sont-ils accueillants ?',
      a: 'Oui, la convivialité liégeoise n’est pas une légende. La conversation vient vite ; pour qu’elle devienne une amitié, propose un deuxième rendez-vous précis plutôt qu’un vague « on se refait ça ».',
    },
  ],
  near: ['bruxelles', 'luxembourg', 'lille'],
  guides: ['se-faire-des-amis-timide', 'se-faire-des-amis-adulte', 'associations-activites-rencontrer-du-monde'],
  image: { src: '/img/m/nino_danse.webp', width: 450, height: 500, alt: 'Nino, un minimoa vert à mèche orange, qui danse' },
  og: { lines: ['SE FAIRE', 'DES AMIS', 'À LIÈGE.'], panel: 'wine' },
  updated: '2026-11-19',
};
