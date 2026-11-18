import type { CityPage } from '../types';

export const strasbourg: CityPage = {
  slug: 'strasbourg',
  name: 'Strasbourg',
  meta: {
    title: 'Se faire des amis à Strasbourg : rencontrer des gens',
    description: 'Se faire des amis à Strasbourg : Krutenau, Petite France, Neudorf, quais, Orangerie, winstubs et associations. Où rencontrer des gens près de chez toi.',
  },
  h1: 'Se faire des amis à Strasbourg',
  lead: 'Strasbourg est une ville européenne au sens propre : institutions internationales, étudiants du monde entier, l’Allemagne de l’autre côté du Rhin. On y entend plusieurs langues dans le même tram. Une richesse, et un défi pour qui veut des amis qui restent.',
  keywords: [
    'se faire des amis à Strasbourg',
    'se faire des amis Strasbourg',
    'rencontrer des gens à Strasbourg',
    'rencontrer des gens Strasbourg',
  ],
  sections: [
    {
      title: 'Une ville de passage… et d’attaches',
      blocks: [
        'Entre les stagiaires des institutions européennes, les étudiants Erasmus et les fonctionnaires en poste pour quelques années, une partie de Strasbourg vit au rythme des arrivées et des départs. Les cercles internationaux se forment vite, et se défont aussi vite.',
        'À côté, il y a les Strasbourgeois installés, attachés à leur quartier, à leur winstub et à leurs traditions. Ils sont parfois réservés au premier abord, mais fidèles une fois le lien fait. La clé, ici comme ailleurs, c’est de revenir aux mêmes endroits.',
      ],
    },
    {
      title: 'Les quartiers strasbourgeois',
      blocks: [
        {
          list: [
            '**La Krutenau** : le quartier étudiant et festif, au bord de l’Ill. Bars, restaurants, et une ambiance où l’on se parle.',
            '**La Grande Île et la Petite France** : le centre historique, entouré d’eau. Superbe, mais très touristique ; parfait pour une balade à deux.',
            '**Neudorf** : grand quartier résidentiel, familial et vivant, avec sa place du marché.',
            '**L’Esplanade** : autour du campus, jeune et animé pendant l’année universitaire.',
            '**Le quartier des Quinze et la Robertsau** : verts et calmes, près du parc de l’Orangerie et des institutions européennes.',
          ],
        },
      ],
    },
    {
      title: 'Où rencontrer des gens à Strasbourg',
      blocks: [
        '**Les quais de l’Ill** : promenades, course et vélo. Strasbourg est l’une des villes les plus cyclables de France, et les sorties vélo en groupe y sont faciles à organiser.',
        '**Le parc de l’Orangerie** : le grand parc où l’on se retrouve le week-end, pour courir ou pique-niquer.',
        '**Les soirées d’échange linguistique** : avec autant de nationalités, les « tandems » et cafés-langues sont nombreux. Tu parles français, l’autre veut le pratiquer : la conversation est déjà lancée.',
        '**Les winstubs** : ces petites tavernes alsaciennes ont souvent de grandes tables. Une soirée en groupe y est conviviale par nature.',
        '**Le marché de Noël** : l’hiver, la ville entière est dehors. Un vin chaud partagé est un très bon deuxième rendez-vous.',
        '**De l’autre côté du Rhin** : Kehl est à quelques arrêts de tram. Une sortie transfrontalière en petit groupe, ça crée des souvenirs communs.',
        'Pour choisir une association qui te ressemble, lis notre guide [associations et activités pour rencontrer du monde](/guides/associations-activites-rencontrer-du-monde/).',
      ],
    },
  ],
  minimoa: {
    title: 'Comment Minimoa t’aide à Strasbourg',
    blocks: [
      'Strasbourg est assez petite pour qu’un ami de quartier devienne un ami du quotidien. C’est ce que cherche ton minimoa : il te présente des gens près de chez toi, dont la vision de la vie va avec la tienne, et te dit pourquoi.',
      'Une fois que vous vous êtes salués, vous pouvez transformer l’essai : une habitude à deux ou un petit groupe de 3 à 8 (une sortie vélo le samedi, une balade à l’Orangerie, apprendre l’allemand ensemble). Vos minimoas relancent la conversation après un silence, pour que le lien ne s’éteigne pas.',
      'Rien ne se passe sans ton accord. Ta position est arrondie à environ 300 mètres. L’app est gratuite, sans pub, à partir de 18 ans.',
    ],
  },
  quartier: {
    text: 'Minimoa ouvre ville par ville : à 50 inscrits, Strasbourg ouvre. Inscris-toi, et invite tes voisins de palier.',
    zones: ['strasbourg'],
  },
  faq: [
    {
      q: 'Comment se faire des amis à Strasbourg ?',
      a: 'Combine deux choses : les cercles internationaux, très ouverts, pour rencontrer vite du monde, et une activité locale régulière (club, association, marché de quartier) pour des liens qui durent après le départ des stagiaires.',
    },
    {
      q: 'Les Strasbourgeois sont-ils accueillants ?',
      a: 'Souvent réservés au début, très fidèles ensuite. Revenir aux mêmes endroits, dire bonjour, proposer une sortie simple : c’est ce qui ouvre les portes.',
    },
    {
      q: 'Où rencontrer des gens à Strasbourg ?',
      a: 'À la Krutenau pour sortir, à l’Orangerie et le long de l’Ill pour le sport, dans les cafés-langues pour les rencontres internationales, et dans les associations de ton quartier pour les amitiés durables.',
    },
  ],
  near: ['lille', 'lyon', 'paris'],
  guides: ['se-faire-des-amis-nouvelle-ville', 'se-faire-des-amis-timide', 'associations-activites-rencontrer-du-monde'],
  image: { src: '/img/m/nino_coucou.webp', width: 450, height: 500, alt: 'Nino, un minimoa vert à mèche orange, qui fait coucou' },
  og: { lines: ['SE FAIRE', 'DES AMIS', 'À STRASBOURG.'], panel: 'night' },
  updated: '2026-11-18',
};
