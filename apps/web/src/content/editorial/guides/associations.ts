import type { GuidePage } from '../types';
import { SOURCES as S } from './sources';

export const associations: GuidePage = {
  slug: 'associations-activites-rencontrer-du-monde',
  meta: {
    title: 'Associations et activités pour rencontrer du monde',
    description: 'Quelle association ou activité choisir pour rencontrer des gens ? Selon ton caractère, ton temps et ton budget, où chercher et comment bien démarrer.',
  },
  h1: 'Associations et activités pour rencontrer du monde',
  short: 'Associations et activités pour rencontrer du monde',
  lead: 'Rejoindre une association reste l’un des moyens les plus sûrs de se faire des amis à l’âge adulte. Encore faut-il choisir la bonne, et tenir assez longtemps pour que la magie opère. Voici comment t’y prendre.',
  keywords: [
    'association pour rencontrer des gens',
    'activités pour rencontrer des gens',
    'association pour se faire des amis',
    'activité pour se faire des amis',
    'quelle activité pour rencontrer des gens',
    'quelle association pour rencontrer des gens',
  ],
  sections: [
    {
      title: 'Pourquoi les associations marchent si bien',
      blocks: [
        'Une association réunit, presque par définition, tout ce dont une amitié a besoin.',
        {
          list: [
            '**La répétition** : tu vois les mêmes personnes chaque semaine, sans avoir à organiser quoi que ce soit.',
            '**Un objectif commun** : monter un spectacle, gagner un match, faire pousser des tomates. On parle de ce qu’on fait, et la conversation n’est jamais forcée.',
            '**Des rôles** : trésorier, accueil, capitaine, responsable du matériel. Un rôle te place naturellement au contact des autres.',
            '**Des valeurs partagées** : on choisit une association pour ce qui nous tient à cœur. Les gens que tu y croises ont donc déjà quelque chose en commun avec toi.',
          ],
        },
        `Le temps passé ensemble est la clé. Selon les travaux de Jeffrey Hall, il faut environ 50 heures pour qu’une connaissance devienne un copain, et environ 90 pour devenir amis ([Hall, 2018](${S.hall2018.url})). Deux heures par semaine dans un club, c’est une centaine d’heures en un an : le compte est bon.`,
      ],
    },
    {
      title: 'Choisir selon ton caractère',
      blocks: [
        'La meilleure activité est celle que tu auras envie de faire même les soirs de pluie. Quelques pistes selon les profils :',
        { h3: 'Tu aimes bouger' },
        'Sports collectifs en loisir (volley, foot à cinq, basket, ultimate), clubs de course, randonnée, escalade en salle, aviron ou canoë. Le sport collectif soude particulièrement vite : on gagne et on perd ensemble. Beaucoup de clubs ont des sections « loisir » sans compétition.',
        { h3: 'Tu as la fibre créative' },
        'Théâtre amateur ou improvisation, chorale, fanfare, atelier de poterie, couture, photo. Les projets créatifs en groupe, comme un spectacle de fin d’année, créent des souvenirs communs très forts.',
        { h3: 'Tu as envie d’être utile' },
        `Bénévolat dans l’aide alimentaire, l’accompagnement scolaire, l’accueil de personnes exilées, les visites à des personnes âgées isolées, la protection de la nature. La plateforme publique [JeVeuxAider.gouv.fr](${S.jeVeuxAider.url}) propose des milliers de missions, triées par lieu et par durée. Un engagement régulier, même deux heures par semaine, crée plus de liens qu’une journée ponctuelle.`,
        { h3: 'Tu es curieux' },
        'Associations d’échange linguistique, clubs de lecture, cercles de discussion, sorties culturelles, astronomie, généalogie, histoire locale. Idéal si tu préfères les conversations aux efforts physiques.',
        { h3: 'Tu préfères le calme' },
        'Clubs de jeux de société ou d’échecs, jardins partagés, ateliers de réparation (« repair cafés »), groupes de marche douce. Des activités tranquilles, avec un objet commun qui évite les silences gênants.',
        { h3: 'Tu veux t’investir dans ton quartier' },
        'Associations de quartier, comités des fêtes, conseils citoyens, amicales de locataires, épiceries solidaires. Tu rencontres tes voisins, ceux que tu croiseras le plus souvent.',
      ],
    },
    {
      title: 'Où trouver une association près de chez toi',
      blocks: [
        {
          list: [
            '**Le forum des associations** : la plupart des communes en organisent un à la rentrée, en septembre. En un après-midi, tu fais le tour des clubs, tu poses tes questions et tu repars avec des dates d’essai.',
            '**Ta mairie** : le site de ta commune ou de ta mairie de quartier publie souvent un annuaire des associations locales.',
            '**La médiathèque et les centres sociaux** : leurs panneaux d’affichage et leurs agendas regorgent d’ateliers et de clubs.',
            `**Les annuaires officiels** : [Service-public.fr explique comment se renseigner sur une association](${S.servicePublicAsso.url}) (objet, siège, statuts), utile pour vérifier qu’elle existe bien.`,
            '**Le bouche-à-oreille** : demande à tes collègues, à tes voisins, à tes commerçants. Les meilleures associations sont souvent les moins visibles en ligne.',
          ],
        },
        'Si tu vis dans une grande ville, nos pages [Se faire des amis dans ta ville](/se-faire-des-amis/) donnent des idées propres à chacune.',
      ],
    },
    {
      title: 'Les bonnes questions à poser avant de t’inscrire',
      blocks: [
        {
          list: [
            '**Est-ce près de chez moi ?** Au-delà de vingt minutes de trajet, la motivation chute vite en hiver.',
            '**L’horaire tient-il avec ma vie ?** Un créneau qui tombe mal finira par sauter.',
            '**Le groupe est-il stable ?** Un cours où les mêmes personnes reviennent toute l’année vaut mieux qu’un événement où l’on change de tête à chaque fois.',
            '**Y a-t-il un moment pour se parler ?** Un verre après l’entraînement, une pause pendant l’atelier. Sans ce moment, on fait l’activité côte à côte sans jamais se connaître.',
            '**Puis-je essayer ?** Beaucoup d’associations proposent une ou deux séances d’essai gratuites.',
          ],
        },
        'Côté budget, la cotisation annuelle d’une association de loisir reste souvent modeste, et le bénévolat est gratuit. Renseigne-toi aussi auprès de ta commune : certaines proposent des aides pour les activités sportives ou culturelles.',
      ],
    },
    {
      title: 'Bien démarrer : les trois premiers mois',
      blocks: [
        {
          ordered: true,
          list: [
            '**Reste après.** Le vrai lien se crée dans le quart d’heure qui suit l’activité : le rangement, le verre, la discussion sur le trottoir.',
            '**Prends un petit rôle.** Proposer d’aider à l’installation, à l’accueil ou à la communication te fait connaître de tout le monde très vite.',
            '**Retiens les prénoms** et utilise-les. C’est tout bête, et ça change tout.',
            '**Propose une sortie hors du cadre** à une ou deux personnes avec qui le courant passe : un café, une expo, un match.',
            '**Tiens bon jusqu’au troisième mois.** Les premières semaines sont souvent un peu solitaires. C’est normal : tu es en train d’accumuler les heures qui font une amitié.',
          ],
        },
        `Même si tu ne te fais pas d’ami proche tout de suite, ces liens plus légers comptent. Des recherches montrent que les jours où l’on échange avec plus de connaissances, on se sent plus heureux et plus à sa place ([Sandstrom et Dunn, 2014](${S.sandstrom2014.url})).`,
      ],
    },
    {
      title: 'Les activités sans association',
      blocks: [
        'Tout ne passe pas par une association déclarée. Les groupes de course informels, les soirées jeux dans les bars, les cafés-langues, les ateliers des médiathèques ou les cours municipaux fonctionnent très bien aussi, à condition de garder la même règle : revenir, encore et encore.',
        `Et pour les jours où tu doutes, souviens-toi que ça vaut l’effort : la solitude touche une personne sur six dans le monde, selon l’[Organisation mondiale de la santé](${S.oms2025.url}), et le lien social est associé à une meilleure santé.`,
      ],
    },
    {
      title: 'Tenir une activité à plusieurs',
      blocks: [
        'Le plus difficile, avec une nouvelle activité, est de ne pas lâcher. Sur [Minimoa](/), tu peux tenir une habitude (marcher, courir, lire, aller au club) dans un groupe de 3 à 8 personnes près de chez toi : la série monte quand tout le monde est à jour, et un oubli coûte une vie au groupe. Ton minimoa te présente aussi des gens de ton quartier qui partagent ta vision de la vie. Une façon de trouver des partenaires d’activité avant même de pousser la porte d’un club.',
      ],
    },
  ],
  faq: [
    {
      q: 'Quelle association pour rencontrer des gens ?',
      a: 'Celle qui se réunit chaque semaine, près de chez toi, en petit groupe stable, avec un moment pour se parler. Le thème compte moins que ces conditions : sport collectif loisir, chorale, théâtre amateur, bénévolat régulier ou jardin partagé fonctionnent très bien.',
    },
    {
      q: 'Quelles activités pour se faire des amis ?',
      a: 'Les activités de groupe régulières : sports collectifs, randonnée en club, chorale, improvisation, cours de langue, jeux de société, bénévolat. Les événements ponctuels (grandes soirées, salons) permettent de rencontrer du monde, mais rarement de le revoir.',
    },
    {
      q: 'Comment trouver une association près de chez moi ?',
      a: 'Le forum des associations de la rentrée, le site de ta mairie, les panneaux de la médiathèque et des centres sociaux, et JeVeuxAider.gouv.fr pour le bénévolat. Demande aussi autour de toi : le bouche-à-oreille reste très efficace.',
    },
    {
      q: 'Rejoindre une association coûte-t-il cher ?',
      a: 'Souvent non : la cotisation annuelle d’une association de loisir est généralement modeste, beaucoup proposent des séances d’essai gratuites, et le bénévolat ne coûte rien. Certaines communes aident aussi à payer les activités.',
    },
  ],
  sources: [S.hall2018, S.sandstrom2014, S.jeVeuxAider, S.servicePublicAsso, S.oms2025],
  related: ['se-faire-des-amis-adulte', 'rencontrer-des-gens-seul', 'se-faire-des-amis-timide'],
  image: { src: '/img/m/bande_fete.webp', width: 1200, height: 421, alt: 'Nino, Suzie, Gaston et Pia, quatre minimoas, qui font la fête' },
  og: { lines: ['ASSOS ET', 'ACTIVITÉS', 'POUR SE FAIRE', 'DES AMIS.'], panel: 'orange' },
  published: '2026-11-18',
  updated: '2026-11-18',
};
