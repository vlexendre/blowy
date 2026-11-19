import type { CityPage } from '../types';

export const marseille: CityPage = {
  slug: 'marseille',
  name: 'Marseille',
  country: 'fr',
  meta: {
    title: 'Se faire des amis à Marseille : rencontrer du monde',
    description: 'Se faire des amis à Marseille : Cours Julien, Panier, Vieux-Port, calanques. Où rencontrer des gens, et comment ouvrir ton arrondissement sur Minimoa.',
  },
  h1: 'Se faire des amis à Marseille',
  lead: 'À Marseille, on te parle. Au marché, à l’arrêt de bus, sur la plage. La ville a un sens du contact immédiat que beaucoup de nouveaux arrivants adorent. Le défi, c’est que Marseille est immense, et que chaque quartier vit presque comme un village.',
  keywords: [
    'se faire des amis à Marseille',
    'se faire des amis Marseille',
    'rencontrer des gens à Marseille',
    'rencontrer des gens sur Marseille',
    'comment rencontrer des gens à Marseille',
  ],
  sections: [
    {
      title: 'Une ville-monde découpée en villages',
      blocks: [
        'Marseille compte seize arrondissements et plus d’une centaine de quartiers, chacun avec son nom, son marché, ses habitudes. On est « de Noailles », « d’Endoume » ou « de la Belle de Mai » avant d’être Marseillais. Pour toi, c’est une bonne nouvelle : à l’échelle du quartier, on reconnaît vite les visages.',
        'L’autre réalité, ce sont les distances. Entre les quartiers nord et les plages du sud, il peut y avoir plus d’une heure de transport. Une amitié a beaucoup plus de chances de durer si vous habitez dans le même coin.',
      ],
    },
    {
      title: 'Les quartiers pour commencer',
      blocks: [
        {
          list: [
            '**Le Cours Julien et la Plaine** (6e et 5e) : murs peints, bars, concerts, librairies. Le quartier alternatif où l’on sort et où l’on se parle.',
            '**Le Panier** (2e) : le plus vieux quartier de la ville, des ruelles en pente et une vraie vie de voisinage derrière les touristes.',
            '**Le Vieux-Port et Noailles** (1er) : le centre et son marché, le plus vivant et le plus mélangé.',
            '**Endoume et le Vallon des Auffes** (7e) : un air de village de pêcheurs, des habitants attachés à leur coin, des baignades à la pointe.',
            '**Les 8e et 9e**, vers les plages et les calanques : plus résidentiels, sportifs, tournés vers la mer.',
          ],
        },
      ],
    },
    {
      title: 'Où rencontrer des gens à Marseille',
      blocks: [
        '**La mer** : beach-volley sur les plages du Prado, nage en eau libre, paddle, voile. Les clubs nautiques sont nombreux et une sortie en bateau à plusieurs vaut toutes les soirées.',
        '**Les calanques** : la randonnée en groupe est une institution. Les associations de randonnée et les clubs alpins locaux organisent des sorties pour tous les niveaux, et partager une montée crée des liens.',
        '**La pétanque** : pas un cliché, une vraie porte d’entrée. Dans beaucoup de quartiers, un terrain voit les mêmes joueurs revenir chaque soir. Demande à faire une partie.',
        '**La culture** : concerts au Cours Julien, expositions, cinémas de quartier, et des institutions comme le Mucem dont les esplanades sont aussi des lieux de rendez-vous.',
        '**Les associations de quartier** : comités d’intérêt de quartier, jardins partagés, aide aux devoirs. Marseille a une vie associative très locale.',
        'Tu préfères les sorties en petit comité ? Le guide [rencontrer du monde quand on est réservé](/guides/se-faire-des-amis-timide/) est pour toi.',
        'Le littoral se partage. Si tu as de la famille ou des amis plus loin sur la côte, voici comment [se faire des amis à Nice](/se-faire-des-amis/nice/) et où [rencontrer des gens à Montpellier](/se-faire-des-amis/montpellier/).',
      ],
    },
  ],
  minimoa: {
    title: 'Comment Minimoa t’aide à Marseille',
    blocks: [
      'Marseille se vit par quartier, et Minimoa aussi. Ton minimoa ne te présente que des gens **proches de chez toi**, dont la vision de la vie va avec la tienne. Pas quelqu’un à l’autre bout de la ville que tu ne reverras jamais : un voisin avec qui aller nager à Malmousque ou marcher dans les calanques le dimanche.',
      'Il te dit pourquoi il pense que vous allez vous entendre, puis te laisse décider. Si vous accrochez, vous pouvez tenir une habitude ensemble, ou monter un petit groupe de quartier pour les apéros et les sorties. Plus tu sors, plus ton minimoa est en forme, et plus il t’ouvre de rencontres.',
      'Position arrondie, jamais en direct ; personne ne t’écrit sans ton accord ; gratuit, sans pub, à partir de 18 ans.',
    ],
  },
  quartier: {
    text: 'Minimoa ouvre Marseille arrondissement par arrondissement : à 50 inscrits, le tien ouvre. Choisis-le et regarde où il en est.',
    zones: Array.from({ length: 16 }, (_, i) => `marseille-${i + 1}`),
  },
  faq: [
    {
      q: 'Est-ce facile de se faire des amis à Marseille ?',
      a: 'Engager la conversation, oui : Marseille est une ville où l’on se parle volontiers. Construire une amitié demande, comme partout, de se revoir. Reste dans ton quartier et cherche des activités régulières, à la mer ou dans les associations.',
    },
    {
      q: 'Où rencontrer des gens à Marseille quand on vient d’arriver ?',
      a: 'Au Cours Julien et à la Plaine pour sortir, dans les clubs de randonnée et de sports nautiques pour les activités, et sur les terrains de pétanque de ton quartier pour la vie de voisinage.',
    },
    {
      q: 'Quel quartier de Marseille pour rencontrer du monde ?',
      a: 'Le 6e (Cours Julien) est le plus animé pour les rencontres, le 7e (Endoume) le plus « village ». Mais à Marseille, la distance compte : le meilleur quartier est celui où tu vis.',
    },
  ],
  near: ['montpellier', 'nice', 'lyon'],
  guides: ['se-faire-des-amis-timide', 'se-faire-des-amis-nouvelle-ville', 'associations-activites-rencontrer-du-monde'],
  image: { src: '/img/m/nino_bain.webp', width: 450, height: 500, alt: 'Nino, un minimoa vert à mèche orange, qui prend son bain' },
  og: { lines: ['SE FAIRE', 'DES AMIS', 'À MARSEILLE.'], panel: 'violet' },
  updated: '2026-11-19',
};
