import type { GuidePage } from '../types';
import { SOURCES as S } from './sources';

/**
 * Requête de tête (docs/SEO.md §2) : « rencontrer des gens près de chez soi » (390 recherches par mois) et ses variantes
 * « autour de moi », « dans son quartier », « ses voisins ». Intention pratique et locale : par où commencer, de
 * l'immeuble au quartier, puis en ligne. Chiffres repris des sources déjà vérifiées (sources.ts).
 */
export const presDeChezSoi: GuidePage = {
  slug: 'rencontrer-des-gens-pres-de-chez-soi',
  meta: {
    title: 'Rencontrer des gens près de chez soi : par où commencer',
    description: 'Voisins, immeuble, maison de quartier, assos, bénévolat, applis locales : comment rencontrer des gens près de chez soi et les revoir sans effort.',
  },
  h1: 'Rencontrer des gens près de chez soi',
  short: 'Rencontrer des gens près de chez soi',
  lead: 'Les amis qui habitent à dix minutes, ce sont ceux qu’on voit vraiment. Pas besoin de traverser la ville ni de caler un rendez-vous trois semaines à l’avance. Voici comment rencontrer des gens autour de toi, de ton palier jusqu’au bout de ton quartier, sans forcer ta nature.',
  keywords: [
    'rencontrer des gens près de chez soi',
    'rencontrer des gens près de chez moi',
    'rencontrer des gens autour de moi',
    'se faire des amis près de chez soi',
    'rencontrer des gens de son quartier',
    'comment rencontrer ses voisins',
  ],
  sections: [
    {
      title: 'Pourquoi chercher tout près',
      blocks: [
        `On sous-estime souvent la distance. Une amitié a besoin de temps passé ensemble : le chercheur Jeffrey Hall estime qu’il faut environ **50 heures** pour qu’une connaissance devienne un copain, et environ **90 heures** pour devenir amis ([Hall, 2018](${S.hall2018.url})). Ces heures s’accumulent bien plus facilement avec quelqu’un que tu croises en allant chercher ton pain qu’avec une personne qui habite à quarante minutes de métro.`,
        `La proximité joue déjà un grand rôle dans la vie sociale des Français. D’après l’étude Solitudes de la Fondation de France, les voisins (54 %) sont le deuxième réseau de sociabilité le plus mobilisé, juste après les amis (58 %) et devant la famille ([Solitudes 2025](${S.fdf2025.url})). La même étude note que le sentiment de solitude est plus fréquent dans les grandes villes : 28 % des habitants des villes de plus de 100 000 habitants disent se sentir seuls, contre 21 % en milieu rural. Vivre entouré de monde ne suffit pas : encore faut-il le connaître.`,
        'La règle qui guide tout ce qui suit est simple : **cherche ce qui te fera revoir les mêmes personnes, souvent, sans effort**. Un voisin, un club au coin de la rue ou un marché du samedi y arrivent mieux qu’une grande soirée à l’autre bout de la ville.',
      ],
    },
    {
      title: 'Commencer par ton immeuble et ta rue',
      blocks: [
        'Le plus proche est souvent le plus négligé. Beaucoup de gens vivent des années à côté de voisins dont ils ne connaissent pas le prénom, alors que les occasions de se parler sont quotidiennes.',
        {
          list: [
            '**Le bonjour qui dure deux phrases.** Dans l’ascenseur ou devant les boîtes aux lettres, ajoute une question simple : « Vous êtes là depuis longtemps ? », « Tu connais un bon boulanger dans le coin ? ». Les gens aiment donner des conseils sur leur quartier.',
            '**Le petit service.** Réceptionner un colis, prêter une perceuse, arroser des plantes pendant les vacances : ces échanges créent de la confiance bien plus vite qu’une longue discussion.',
            '**Le mot dans le hall.** Une affiche « Apéro dans la cour samedi à 18 h, chacun apporte un truc » fonctionne mieux qu’on ne le croit, surtout si tu glisses aussi un mot dans quelques boîtes.',
            '**La Fête des voisins.** Chaque année, un vendredi de fin mai, des immeubles et des rues partout en France organisent un verre ou un repas entre voisins. C’est le prétexte parfait pour une première fois : personne ne trouve bizarre que tu viennes dire bonjour.',
          ],
        },
        'Un groupe de discussion d’immeuble ou de rue peut ensuite prendre le relais pour les annonces, les prêts d’objets et les invitations. Garde-le léger : il sert à se retrouver en vrai, pas à remplacer les rencontres.',
      ],
    },
    {
      title: 'Les lieux du quartier où l’on se revoit',
      blocks: [
        'Au-delà de ton immeuble, chaque quartier a ses endroits où les mêmes visages reviennent chaque semaine. Ce sont eux qu’il faut repérer.',
        {
          list: [
            '**La maison de quartier ou le centre social** : ateliers cuisine, couture, informatique, sorties, repas partagés. Ces lieux sont faits pour que les habitants se rencontrent, quels que soient leur âge et leurs moyens. Ta mairie te dira lequel est le plus proche.',
            '**La médiathèque** : clubs de lecture, ateliers d’écriture, soirées jeux, conférences. Un public calme, souvent des activités gratuites, et un rythme régulier.',
            '**Le marché** : en y allant chaque semaine au même stand, tu deviens un habitué. Les commerçants te reconnaissent, et les conversations avec les autres clients viennent d’elles-mêmes.',
            '**Le jardin partagé** : quelques mètres carrés, une saison entière à côté des mêmes personnes, et des sujets de discussion qui poussent tout seuls.',
            '**Le club de sport du coin** : course, badminton, volley, marche nordique en loisir. Choisis-le à moins de quinze minutes de chez toi, sinon tu finiras par ne plus y aller.',
          ],
        },
        `Pour trouver les associations proches, le forum des associations de la rentrée reste le meilleur point de départ, et la mairie tient souvent un annuaire en ligne. Avant de t’engager, tu peux vérifier qu’une association existe bien et qui la gère ([Service-public.fr](${S.servicePublicAsso.url})). Notre guide [des associations et activités pour rencontrer du monde](/guides/associations-activites-rencontrer-du-monde/) t’aide à choisir selon ton caractère.`,
      ],
    },
    {
      title: 'Donner un coup de main autour de chez toi',
      blocks: [
        `Le bénévolat local est l’un des moyens les plus sûrs de rencontrer des gens de ton quartier qui partagent tes valeurs. Aide aux devoirs, distribution alimentaire, visites à des personnes âgées, nettoyage d’un parc, coup de main pour la fête de quartier : [JeVeuxAider.gouv.fr](${S.jeVeuxAider.url}), la plateforme publique du bénévolat, permet de chercher des missions près de chez toi.`,
        'L’avantage, quand on est un peu réservé : tu as quelque chose à faire. On parle en travaillant côte à côte, sans avoir à trouver un sujet de conversation. Si l’idée d’aborder des inconnus te bloque, notre guide pour [se faire des amis quand on est timide](/guides/se-faire-des-amis-timide/) propose des petits pas très concrets.',
      ],
    },
    {
      title: 'En ligne, mais local',
      blocks: [
        'Les outils numériques ont un intérêt réel quand ils servent à **trouver qui, autour de toi, a envie de voir du monde**, puis à vous faire sortir de l’écran. Quelques pistes :',
        {
          list: [
            '**Les groupes de quartier** sur les réseaux sociaux : annonces, objets donnés, idées de sorties. Utiles pour savoir ce qui se passe, moins pour créer des liens si tu te contentes de lire.',
            '**Les plateformes d’événements** filtrées par distance : randonnées, cafés-langues, soirées jeux. Garde les groupes qui se réunissent souvent près de chez toi.',
            '**Les applis de voisinage** : elles partent de la proximité pour te mettre en lien avec des gens à quelques rues.',
          ],
        },
        'Avant de t’inscrire, pose une seule question : est-ce que cet outil me fera revoir les mêmes personnes ? Pour comparer les options sans classement truqué, lis notre tour d’horizon [des applis pour rencontrer de nouveaux amis](/guides/application-pour-se-faire-des-amis/).',
      ],
    },
    {
      title: 'Transformer un visage familier en ami',
      blocks: [
        'Croiser quelqu’un chaque semaine ne suffit pas toujours : il faut, à un moment, passer de « on se dit bonjour » à « on se voit ». C’est l’étape qui fait le plus peur, et pourtant elle est souvent mieux reçue qu’on ne l’imagine.',
        `Après une conversation, on a tendance à penser que l’autre nous a moins apprécié qu’en réalité ([Boothby et al., 2018](${S.boothby2018.url})). Et quand on reprend contact avec quelqu’un, la personne apprécie ce geste plus que nous ne le prévoyons ([Liu et al., 2023](${S.liu2023.url})). Autrement dit, ton voisin sympathique a probablement autant envie que toi de prolonger la discussion.`,
        {
          ordered: true,
          list: [
            '**Propose quelque chose de petit et proche** : un café au coin de la rue, un tour au marché, une partie de jeu de société chez toi.',
            '**Donne un moment précis** : « Samedi vers 11 h, ça te dit ? » marche mieux que « Il faudrait qu’on se voie un jour ».',
            '**Recommence** : une amitié de quartier se construit par petites fois répétées, pas en une grande soirée.',
          ],
        },
        `Et même quand ces liens restent légers, ils comptent. Les jours où l’on échange avec davantage de connaissances (voisins, commerçants, habitués), on se sent plus heureux et plus à sa place ([Sandstrom et Dunn, 2014](${S.sandstrom2014.url})).`,
      ],
    },
    {
      title: 'Selon l’endroit où tu vis',
      blocks: [
        { h3: 'En grande ville' },
        'L’offre est immense, et c’est justement le piège : on papillonne d’un événement à l’autre sans jamais revoir personne. Réduis ton terrain de jeu à ton arrondissement ou à ton quartier. Nos pages villes, comme [rencontrer des gens à Lyon](/se-faire-des-amis/lyon/) ou [se faire des amis à Paris](/se-faire-des-amis/paris/), donnent des pistes quartier par quartier.',
        { h3: 'En banlieue ou en ville moyenne' },
        'Les clubs, la médiathèque et les associations sportives y sont souvent le cœur de la vie locale. Le forum des associations de septembre et les fêtes de la commune sont de bonnes portes d’entrée.',
        { h3: 'À la campagne' },
        'Les gens sont moins nombreux, mais se recroisent plus. Le comité des fêtes, le club de foot ou de pétanque, la bibliothèque et le marché du village valent toutes les applis. Ose proposer ton aide pour une fête : c’est la façon la plus rapide d’être adopté.',
        'Si tu viens tout juste d’emménager, notre guide pour [se faire des amis dans une nouvelle ville](/guides/se-faire-des-amis-nouvelle-ville/) détaille les premières semaines.',
      ],
    },
    {
      title: 'Une aide pour savoir qui, autour de toi',
      blocks: [
        'Le plus dur, près de chez soi, c’est de deviner **qui a envie de rencontrer du monde**. Sur [Minimoa](/), un petit compagnon que tu élèves te présente des gens de ton quartier qui voient la vie comme toi, en t’expliquant ce que vous partagez. Rien ne se passe sans ton accord, et ta position n’est jamais affichée précisément.',
        'Un quartier s’ouvre quand assez de voisins sont inscrits : tu peux voir où en est le tien sur [la page Ouvre ton quartier](/quartier/), et découvrir quel minimoa te ressemble avec [le quiz de caractère](/quiz/). Ça ne remplace ni la Fête des voisins ni le club du coin, mais ça peut te donner un premier visage à saluer.',
      ],
    },
  ],
  faq: [
    {
      q: 'Comment rencontrer des gens près de chez soi ?',
      a: 'Commence par ce qui revient chaque semaine à moins de quinze minutes de chez toi : un club, la médiathèque, le marché, une maison de quartier, du bénévolat. Ajoute un vrai bonjour à tes voisins, et propose vite un café à la personne avec qui le courant passe.',
    },
    {
      q: 'Comment rencontrer des gens autour de moi gratuitement ?',
      a: 'Les médiathèques, les maisons de quartier, les jardins partagés, le bénévolat et la Fête des voisins ne coûtent rien ou presque. Les cafés-langues et les soirées jeux sont souvent gratuits ou au prix d’une consommation.',
    },
    {
      q: 'Comment faire connaissance avec ses voisins ?',
      a: 'Par petites touches : un bonjour qui dure deux phrases, un petit service, puis une invitation simple, comme un apéro dans la cour ou un café. La Fête des voisins, fin mai, est l’occasion idéale de faire le premier pas.',
    },
    {
      q: 'Quelle appli pour rencontrer des gens près de chez soi ?',
      a: 'Privilégie celles qui partent de la proximité et te font revoir les mêmes personnes : groupes de quartier, événements réguliers près de chez toi, applis de voisinage comme Minimoa. Une appli aide à trouver qui ; le reste se passe dehors.',
    },
  ],
  sources: [S.hall2018, S.fdf2025, S.servicePublicAsso, S.jeVeuxAider, S.boothby2018, S.liu2023, S.sandstrom2014],
  related: ['rencontrer-des-gens-seul', 'associations-activites-rencontrer-du-monde', 'se-faire-des-amis-nouvelle-ville'],
  image: { src: '/img/m/pia_coucou.webp', width: 450, height: 500, alt: 'Pia, une minimoa violette à petites cornes, qui fait coucou' },
  og: { lines: ['RENCONTRER', 'DES GENS', 'PRÈS DE', 'CHEZ TOI.'], panel: 'violet' },
  published: '2026-11-20',
  updated: '2026-11-20',
};
