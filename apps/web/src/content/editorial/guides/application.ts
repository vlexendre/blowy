import type { GuidePage } from '../types';
import { SOURCES as S } from './sources';

/**
 * Requête de tête (docs/SEO.md §2) : « application / appli / app / site pour se faire des amis » (~6 500 recherches par
 * mois). La première page Google n'est faite que de listes : on y répond par une comparaison honnête des familles
 * d'applis, où Minimoa est une option parmi d'autres. Faits sur les autres services vérifiés dans leurs pages d'aide
 * (sources), sans prix : ils changent trop souvent.
 */
export const application: GuidePage = {
  slug: 'application-pour-se-faire-des-amis',
  meta: {
    title: 'Application pour se faire des amis : bien choisir',
    description: 'Appli de profils, d’événements, de dîners entre inconnus ou de quartier : comment choisir une application pour se faire des amis, et bien s’en servir.',
  },
  h1: 'Quelle application pour se faire des amis ?',
  short: 'Choisir une application pour se faire des amis',
  lead: 'Il existe aujourd’hui des dizaines d’applis pour se faire des amis, et presque toutes promettent la même chose. Elles ne fonctionnent pourtant pas du tout pareil. Voici comment s’y retrouver, sans classement truqué : ce que fait chaque famille d’applis, pour qui elle marche, et comment éviter de collectionner les conversations qui ne mènent nulle part.',
  keywords: [
    'application pour se faire des amis',
    'appli pour se faire des amis',
    'app pour se faire des amis',
    'site pour se faire des amis',
    'application pour se faire des amis gratuite',
    'meilleure application pour se faire des amis',
  ],
  sections: [
    {
      title: 'Ce qu’une appli peut faire pour toi (et ce qu’elle ne fera pas)',
      blocks: [
        'Une application ne crée pas d’amitié. Elle règle un seul problème, mais c’est souvent le plus bloquant : **savoir qui, près de chez toi, a lui aussi envie de rencontrer du monde**. Dans la rue, au bureau ou au sport, tu ne peux pas le deviner. Dans une appli, tout le monde est là pour ça.',
        `Le reste se joue hors de l’écran. Le chercheur Jeffrey Hall estime qu’il faut environ **50 heures** passées ensemble pour devenir copains et environ **90 heures** pour devenir amis ([Hall, 2018](${S.hall2018.url})). Aucune messagerie ne t’apportera ces heures-là. La bonne question n’est donc pas « quelle appli a le plus d’inscrits ? », mais « **laquelle me fera revoir les mêmes personnes** ? ».`,
        'Garde ce critère en tête : c’est lui qui sépare les applis qui t’occupent de celles qui t’entourent. Pour comprendre pourquoi l’amitié se complique une fois les études finies, lis notre guide sur [l’amitié à l’âge adulte](/guides/se-faire-des-amis-adulte/).',
      ],
    },
    {
      title: 'Les quatre grandes familles d’applis',
      blocks: [
        { h3: 'Les applis de profils, sur le modèle des applis de rencontre' },
        `Tu remplis un profil, tu fais défiler ceux des autres, et vous discutez quand l’intérêt est réciproque. **Bumble** a longtemps proposé un mode amitié, BFF, et une appli à part, Bumble For Friends. Aux États-Unis, les deux ont été fusionnés dans une nouvelle appli BFF ; ailleurs, l’ancien fonctionnement reste en place pour l’instant ([centre d’aide de Bumble](${S.bumbleBff.url})).`,
        '**Pour qui** : les gens à l’aise à l’écrit, qui aiment choisir sur profil. **La limite** : on retrouve les travers des applis de rencontre, avec beaucoup de conversations, peu de rendez-vous, et des échanges qui s’éteignent après trois messages.',
        { h3: 'Les plateformes d’événements et de sorties' },
        `**Meetup** regroupe des communautés autour d’un sujet (randonnée, langues, jeux, technologie) qui organisent des rendez-vous. Rejoindre des groupes et s’inscrire aux événements reste gratuit, une formule payante ajoutant des fonctions comme la liste des participants ([centre d’aide de Meetup](${S.meetupFree.url})). **OnVaSortir** suit une logique proche, très française : des membres proposent une sortie, un resto, un concert ou une balade, avec un nombre de places, et les autres s’y inscrivent.`,
        '**Pour qui** : celles et ceux qui préfèrent une activité à une conversation. **La limite** : un événement ponctuel ne suffit pas. Le jour où un groupe se réunit chaque semaine avec les mêmes têtes, garde-le.',
        { h3: 'Les dîners entre inconnus' },
        `**Timeleft** te fait passer un test de personnalité, puis t’attribue une table avec cinq personnes choisies pour vous correspondre ([Timeleft](${S.timeleftHow.url})). Les dîners ont lieu le mercredi, en groupes de 4 à 6, et le repas se paie sur place, en plus de l’appli ([fiche App Store](${S.timeleftStore.url})).`,
        '**Pour qui** : les gens qui aiment être pris en charge et n’ont pas envie d’organiser. **La limite** : chaque dîner te fait rencontrer des inconnus différents. C’est à toi de reprendre contact avec la personne qui t’a plu, sinon tu recommences à zéro la semaine suivante.',
        { h3: 'Les applis de quartier et de voisinage' },
        'Ici, le critère de départ est la proximité : te mettre en lien avec des gens qui vivent à quelques rues. C’est moins spectaculaire qu’une soirée, mais c’est la condition la plus simple pour se revoir sans effort : on se recroise à la boulangerie, on improvise un café un mardi soir. Les applis ne sont d’ailleurs qu’une piste parmi d’autres pour [se faire des amis près de chez soi](/guides/rencontrer-des-gens-pres-de-chez-soi/).',
        '**Pour qui** : tout le monde, et surtout les personnes qui viennent d’emménager ou qui ont peu de temps. **La limite** : tant que peu de voisins sont inscrits, il ne se passe pas grand-chose. Ces applis grandissent rue par rue.',
      ],
    },
    {
      title: 'Les bons critères pour choisir',
      blocks: [
        'Avant de télécharger quoi que ce soit, pose-toi ces cinq questions.',
        {
          ordered: true,
          list: [
            '**Est-ce que je reverrai les mêmes personnes ?** Un groupe fixe, une activité qui revient, des gens de ton quartier : tout ce qui crée de la répétition vaut mieux qu’un flux infini de nouveaux profils.',
            '**Est-ce près de chez moi ?** Une amitié à quarante minutes de transport survit rarement à l’hiver. Vise un rayon où un « on se voit ce soir ? » reste possible.',
            '**Est-ce que je sais pourquoi on me présente cette personne ?** Des centres d’intérêt communs, une façon de voir la vie : un point de départ concret rend la première conversation bien plus facile.',
            '**Ma vie privée est-elle protégée ?** Regarde ce qui est montré de ta position, qui peut te contacter, et s’il existe un moyen simple de bloquer et de signaler.',
            '**Qu’est-ce qui est vraiment gratuit ?** La plupart de ces applis sont gratuites au départ, avec des options payantes. Lis ce que couvre la version gratuite avant de t’abonner.',
          ],
        },
        'Aucune appli ne coche tout. Beaucoup de gens en combinent deux : une pour les sorties, une pour leur quartier.',
      ],
    },
    {
      title: 'Bien utiliser une appli pour se faire des amis',
      blocks: [
        {
          list: [
            '**Propose vite un vrai rendez-vous.** Après quelques messages, suggère un café, une balade ou une activité précise, avec un jour. Plus l’échange dure à l’écrit, plus il s’essouffle.',
            '**Choisis un lieu public pour la première fois**, et préviens un proche de ton rendez-vous. C’est une précaution simple, pas de la méfiance.',
            '**Prévois le deuxième rendez-vous dès le premier.** « On remet ça dans quinze jours ? » vaut mieux que « on se refait ça un de ces quatre ».',
            '**Rejoins un petit groupe plutôt qu’une foule.** À trois ou quatre, chacun parle et tout le monde se souvient de tout le monde.',
            '**Laisse-toi du temps.** Les premières rencontres sont parfois tièdes. C’est normal : l’amitié vient avec la répétition, pas au premier verre.',
          ],
        },
        'Si l’idée de parler à des inconnus te noue le ventre, notre guide pour [se faire des amis quand on est timide](/guides/se-faire-des-amis-timide/) propose des premiers pas progressifs. Et si tu ne veux pas tout miser sur un écran, la liste des [associations et clubs où l’on rencontre vraiment du monde](/guides/associations-activites-rencontrer-du-monde/) est un excellent complément.',
      ],
    },
    {
      title: 'Les applis ne suffisent pas, et c’est normal',
      blocks: [
        'Une appli est un point de départ, pas une vie sociale. Les amitiés les plus solides naissent presque toujours d’un cadre qui revient : un club, un atelier, une équipe, des voisins. Si tu viens d’arriver quelque part, pense aussi au guide pour [recréer un cercle d’amis après un déménagement](/guides/se-faire-des-amis-nouvelle-ville/).',
        'Les pistes changent aussi d’une ville à l’autre : les quais et les clubs de course pour [rencontrer du monde à Bordeaux](/se-faire-des-amis/bordeaux/), la vie étudiante et associative pour [se faire des amis à Rennes](/se-faire-des-amis/rennes/), les clubs qui tournent toute l’année, au-delà des saisonniers, pour [se faire un cercle d’amis à Nice](/se-faire-des-amis/nice/). Toutes nos pages sont réunies sur [Se faire des amis dans ta ville](/se-faire-des-amis/).',
      ],
    },
    {
      title: 'Et Minimoa, dans tout ça ?',
      blocks: [
        'On ne va pas faire semblant d’être neutres : [Minimoa](/) est notre appli, et elle appartient à la quatrième famille. Tu élèves un petit compagnon, ton minimoa, qui te présente des gens de ton quartier qui voient la vie comme toi, en te disant ce que vous avez en commun et ce qui vous distingue. Pas de swipe, et rien ne se passe sans ton accord.',
        'Pour que les rencontres tiennent, l’app mise sur la répétition : des habitudes à tenir ensemble, en groupes de 3 à 8 personnes, et des liens qui deviennent « fantômes » après une semaine de silence. Ta position n’est jamais affichée précisément. L’essentiel est gratuit et sans pub, et l’app est réservée aux adultes.',
        'Minimoa ouvre quartier par quartier : sur [Ouvre ton quartier](/quartier/), tape ton code postal, et ton quartier ouvre à 50 inscrits. En attendant, le [quiz « Quel minimoa es-tu ? »](/quiz/) te dit quel compagnon te ressemble.',
      ],
    },
  ],
  faq: [
    {
      q: 'Quelle est la meilleure application pour se faire des amis ?',
      a: 'Il n’y en a pas une seule : tout dépend de ce qui te convient. Les plateformes d’événements conviennent si tu aimes les activités, les dîners entre inconnus si tu veux être pris en charge, les applis de quartier si tu veux revoir facilement les mêmes gens. Le meilleur critère reste : est-ce que je reverrai ces personnes ?',
    },
    {
      q: 'Existe-t-il une application gratuite pour se faire des amis ?',
      a: 'Oui, la plupart des applis d’amitié sont gratuites au départ, avec des options payantes. Sur Meetup par exemple, rejoindre des groupes et s’inscrire aux événements est gratuit. Avant de payer, vérifie ce que la version gratuite permet déjà.',
    },
    {
      q: 'Est-ce que ça marche vraiment, une appli pour se faire des amis ?',
      a: 'Oui, si tu t’en sers pour sortir de l’écran. Les amitiés naissent du temps passé ensemble : propose vite un vrai rendez-vous, puis un deuxième. Une appli qui te fait revoir les mêmes personnes, près de chez toi, a plus de chances de marcher qu’un flux infini de profils.',
    },
    {
      q: 'Comment se faire des amis sur une appli sans que ce soit gênant ?',
      a: 'Sois clair dès le départ : tu cherches des amis, pas un rendez-vous amoureux. Propose une activité précise (un café, une balade, une soirée jeux) dans un lieu public, à plusieurs si tu préfères. Une activité donne un sujet de conversation et enlève la pression.',
    },
  ],
  sources: [S.hall2018, S.bumbleBff, S.meetupFree, S.timeleftHow, S.timeleftStore],
  related: ['se-faire-des-amis-nouvelle-ville', 'associations-activites-rencontrer-du-monde', 'se-faire-des-amis-timide'],
  image: { src: '/img/m/nino_coucou.webp', width: 450, height: 500, alt: 'Nino, un minimoa vert à mèche orange, qui fait coucou' },
  og: { lines: ['QUELLE', 'APPLI POUR', 'SE FAIRE', 'DES AMIS ?'], panel: 'coral' },
  published: '2026-11-19',
  updated: '2026-11-19',
};
