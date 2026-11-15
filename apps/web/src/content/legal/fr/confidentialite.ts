import type { LegalPage } from '../types';

export const confidentialite: LegalPage = {
  title: 'Politique de confidentialité — Blowy',
  heading: 'Politique de confidentialité',
  description:
    'Les données que Blowy utilise, pourquoi, sur quelle base légale, combien de temps, qui y a accès, et comment exercer tes droits.',
  intro: 'Ce qu’on sait de toi, pourquoi, qui y a accès, combien de temps on le garde, et comment tout effacer.',
  summary: {
    title: 'En bref',
    items: [
      'On utilise tes données pour une chose : faire vivre ton minimoa et te présenter des gens compatibles. **Pas de publicité, pas de revente.**',
      'Ce que tu cherches et qui tu veux rencontrer peut révéler ton orientation sexuelle : on te demande un **accord explicite**, et tu peux le retirer.',
      'Ta **position** n’est utilisée que quand l’app est ouverte. Sur la carte, elle est arrondie et décalée, jamais en temps réel, et le **mode discret** te retire de la carte.',
      'Tes **photos de preuve** sont vérifiées par une IA, vues par aucun humain, et supprimées sous 24 h (sauf si tu les gardes).',
      '**Aucun humain ne lit tes conversations.** Si vous l’activez tous les deux, une IA lit vos messages pour que vos minimoas puissent réagir. Rien n’est conservé après. Seule exception humaine : un message signalé et son contexte immédiat, lus par un modérateur.',
      'Tu peux tout modifier dans l’app et [supprimer ton compte](@supprimer-mon-compte) à tout moment. Pour le reste : {{email.privacy}}.',
    ],
  },
  toc: true,
  body: [
    { h2: '1. Qui est responsable', id: 'responsable' },
    {
      p: 'Le responsable du traitement est **{{publisher.name}}**, {{publisher.legalForm}}, {{publisher.address}}, qui édite l’app et le site Blowy ([mentions légales](@mentions-legales)).',
    },
    {
      ul: [
        'Pour toute question sur tes données : {{email.privacy}}.',
        'Délégué à la protection des données : {{dpo.name}}.',
      ],
    },
    {
      p: 'Cette politique s’applique à l’app Blowy et au site blowy.app. Pour les cookies du site, voir la [page cookies](@cookies).',
    },

    { h2: "2. Ce qu'on utilise, et pourquoi", id: 'donnees' },
    {
      p: 'Pour chaque usage : les données concernées, le but, la base légale (ce qui nous autorise à le faire, selon le RGPD), la durée de conservation et qui y a accès. Les durées sont reprises dans le [tableau des durées](#durees).',
    },

    { h3: 'Ton compte' },
    {
      ul: [
        '**Données :** l’identifiant que nous transmet Apple ou Google quand tu te connectes, et l’adresse e-mail associée. Avec Apple, cette adresse peut être une adresse relais qui masque la vraie.',
        '**But :** créer ton compte, te reconnecter, sécuriser l’accès, t’écrire pour ce qui concerne ton compte.',
        '**Base légale :** exécution du contrat.',
        '**Durée :** tant que ton compte existe.',
        '**Accès :** l’équipe Blowy habilitée, notre hébergeur d’authentification. Apple ou Google savent que tu utilises Blowy, puisque la connexion passe par eux.',
      ],
    },

    { h3: 'Ton prénom et ta date de naissance' },
    {
      ul: [
        '**Données :** le prénom (ou surnom) que tu choisis ; ta date de naissance.',
        '**But :** le prénom te présente aux autres. La date de naissance vérifie que tu as 18 ans ou plus, et sert au filtre d’âge des rencontres.',
        '**Base légale :** exécution du contrat ; pour l’âge, aussi notre intérêt légitime à protéger les mineurs.',
        '**Durée :** tant que ton compte existe. Si tu as moins de 18 ans, l’inscription s’arrête avant la connexion et rien n’est enregistré.',
        '**Accès :** ton prénom est visible des personnes que ton minimoa te présente et de tes liens. Ta date de naissance n’est pas affichée aux autres.',
      ],
    },

    { h3: 'Ton sexe, ce que tu cherches, qui tu veux rencontrer', id: 'sensibles' },
    {
      ul: [
        '**Données :** ton sexe (femme, homme, non-binaire, ou « je préfère ne pas dire ») ; ce que tu cherches (des potes, plus, ou les deux) ; si tu cherches « plus », qui tu veux rencontrer (des femmes, des hommes, tout le monde).',
        '**Pourquoi c’est sensible :** ensemble, ces réponses peuvent révéler ton **orientation sexuelle**, une donnée protégée par l’article 9 du RGPD.',
        '**But :** ne te présenter que des personnes qui cherchent la même chose que toi, et qui veulent rencontrer quelqu’un comme toi.',
        '**Base légale :** ton **consentement explicite**, demandé à l’inscription avant que tu répondes. Tu peux le retirer : modifie tes réponses dans l’app (« je préfère ne pas dire », « des potes » seulement) ou supprime ton compte. Sans ces réponses, on ne peut pas te proposer de rencontres « plus ».',
        '**Durée :** tant que ton compte existe, ou jusqu’à ce que tu modifies tes réponses.',
        '**Accès :** l’algorithme de rencontres. Ces réponses servent au filtrage : une personne qui t’est présentée peut en déduire que vous cherchez la même chose. Elles ne sont jamais utilisées pour de la publicité ni transmises à un tiers.',
      ],
    },

    { h3: 'Ta localisation', id: 'localisation' },
    {
      ul: [
        '**Données :** ta position, **seulement quand l’app est ouverte** (jamais en arrière-plan), et une zone approximative de ton domicile qui en est déduite.',
        '**But :** te montrer la carte et les minimoas compatibles autour de toi ; te proposer des rencontres proches ; confirmer qu’une sortie a bien eu lieu hors de ta zone de domicile, pour faire monter la sociabilité de ton minimoa.',
        '**Ce que voient les autres :** jamais ta position exacte. Elle est arrondie à environ 300 m et décalée, jamais affichée en temps réel. Le **mode discret** te retire complètement de la carte.',
        '**Base légale :** ton consentement, donné via l’autorisation de localisation de ton téléphone. Tu peux la retirer à tout moment dans les réglages du téléphone. Sans elle, pas de carte ni de rencontres proches (on te le dit clairement), mais le reste de l’app fonctionne.',
        '**Durée :** on garde ta dernière position arrondie et ta zone de domicile approximative, remplacées à chaque mise à jour. On ne garde pas l’historique de tes déplacements.',
        '**Accès :** l’équipe Blowy habilitée, notre hébergeur, et le fournisseur du fond de carte, qui reçoit la zone affichée à l’écran.',
      ],
    },

    { h3: 'Ta vision et la compatibilité' },
    {
      ul: [
        '**Données :** tes réponses au test de vision (12 situations), tes réponses aux questions du jour, les habitudes que tu choisis et celles que tu tiens, ta façon de t’occuper de ton minimoa (régularité, heures, sorties), et les 3 mots que tes potes choisissent pour toi. On en déduit ta « vision » sur 5 axes, avec un indice de confiance, et un « style » (sociable, joueur, tendre, bavard).',
        '**But :** calculer la compatibilité avec d’autres personnes et te présenter celles qui te correspondent ; expliquer chaque rencontre ; donner un caractère à ton minimoa. C’est du **profilage**, expliqué en détail [plus bas](#compatibilite).',
        '**Base légale :** exécution du contrat (c’est le cœur du service).',
        '**Durée :** tant que ton compte existe.',
        '**Accès :** l’algorithme de rencontres. Une personne qui t’est présentée voit vos points communs et une différence, jamais tes réponses ni un chiffre seul.',
      ],
    },
    { p: 'On ne te demande ni ta religion, ni tes opinions politiques, ni ta santé.' },

    { h3: 'Ton minimoa, tes habitudes et ta série' },
    {
      ul: [
        '**Données :** le nom et l’apparence de ton minimoa, ses jauges (sociabilité, faim, énergie, humeur), les gestes que tu fais, tes habitudes et leur rythme, ta série, tes jokers, tes objets, ton bilan de la semaine.',
        '**But :** faire fonctionner le jeu.',
        '**Base légale :** exécution du contrat.',
        '**Durée :** tant que ton compte existe.',
        '**Accès :** toi ; tes liens et les personnes présentées voient ton minimoa et son style.',
      ],
    },

    { h3: 'Les photos de preuve', id: 'preuves' },
    {
      ul: [
        '**Données :** la photo que tu prends dans l’app quand ton minimoa demande une preuve d’habitude (par exemple tes baskets). Elle est prise avec l’appareil photo, pas depuis ta galerie.',
        '**But :** vérifier que l’habitude est tenue. Une IA répond oui, non ou « pas sûr », avec une phrase. En cas de « pas sûr », on te fait confiance.',
        '**Base légale :** ton consentement : tu choisis de prendre et d’envoyer la photo.',
        '**Durée :** **supprimée sous 24 h**, sauf si tu choisis de la garder dans tes souvenirs privés (elle y reste jusqu’à ce que tu la supprimes ou que tu supprimes ton compte).',
        '**Accès :** **aucun humain ne la voit.** Seul notre fournisseur d’IA la reçoit, réduite, pour l’analyser. Personne d’autre sur Blowy ne la voit.',
      ],
    },
    { p: 'Évite de photographier d’autres personnes, des documents ou des informations sensibles.' },

    { h3: 'Tes messages, et leur lecture par une IA si vous l’activez' },
    {
      ul: [
        '**Données :** les messages que tu échanges dans tes liens, leur date, et ce qui a été lu.',
        '**But :** les transmettre à l’autre personne et les garder dans votre conversation.',
        '**Base légale :** exécution du contrat.',
        '**Durée :** tant que le lien existe. Si tu quittes un lien, la conversation est effacée pour toi. Si l’un de vous supprime son compte, le lien et ses messages disparaissent pour les deux.',
        '**Accès :** toi et l’autre personne. Un modérateur peut lire un message **signalé** et son contexte immédiat (voir [signalements](#signalements)).',
      ],
    },
    {
      note: '« Aucun humain ne lit tes conversations. Si vous l’activez tous les deux, une IA lit vos messages pour que vos minimoas puissent réagir. Rien n’est conservé après. »',
    },
    {
      ul: [
        '**Accord de chacun :** on vous le demande à tous les deux, à la première ouverture du chat. Si l’un refuse, personne ne lit : les minimoas réagissent seulement au rythme du lien (silences, séries, défis).',
        '**Retrait :** à tout moment, dans les options du lien ou dans **Moi**. La lecture s’arrête aussitôt pour ce lien.',
        '**Comment :** pas d’analyse à chaque message. Au moment d’un déclencheur (un silence, un certain nombre de messages), une courte fenêtre des derniers messages est envoyée à notre fournisseur d’IA, qui propose la réaction du minimoa. Au plus 3 interventions par jour et par lien, et tu peux les couper pour un lien.',
        '**Ce qui est gardé :** rien de l’analyse. Seule la réaction du minimoa apparaît dans le chat, comme un message.',
        '**Base légale :** le consentement de chacun de vous deux.',
      ],
    },

    { h3: 'La série et les étapes d’un lien' },
    {
      ul: [
        '**Données :** les jours où chacun de vous deux a écrit dans le lien (pas le contenu des messages) et les étapes du lien (rencontre, niveaux passés, records de série). Pour les liens d’avant le 15 novembre 2026, les photos que vous vous y étiez envoyées, qui restent dans vos souvenirs ; on n’en reçoit plus de nouvelles.',
        '**But :** faire vivre la série du lien (les jours d’affilée où vous vous écrivez tous les deux), ses vies et ses niveaux, et vous montrer vos souvenirs.',
        '**Base légale :** exécution du contrat.',
        '**Durée :** tant que le lien existe (mêmes règles que les messages).',
        '**Accès :** toi et l’autre personne du lien. Les photos sont stockées dans un espace privé, accessibles seulement par des liens temporaires.',
      ],
    },

    { h3: 'Les notifications' },
    {
      ul: [
        '**Données :** le jeton technique de ton téléphone pour les notifications, tes réglages par type de notification, l’heure choisie pour le défi du jour.',
        '**But :** te prévenir (défi du jour, nouvelle rencontre, message, « à toi d’écrire » le soir, lien ou série en danger, preuve demandée, bilan, rappel de fin d’essai). Heures calmes de 22 h à 8 h ; hors messages, 3 par jour au plus. Sur iPhone, le widget et les activités en direct utilisent les mêmes données.',
        '**Base légale :** ton consentement, donné via l’autorisation de ton téléphone. Tu le retires dans les réglages du téléphone ou type par type dans l’app.',
        '**Durée :** jusqu’à ce que tu désactives les notifications ou supprimes ton compte.',
        '**Accès :** notre prestataire d’envoi des notifications, et Apple ou Google, qui les acheminent jusqu’à ton téléphone.',
      ],
    },

    { h3: 'Les achats Blowy+' },
    {
      ul: [
        '**Données :** l’offre choisie, les dates d’achat, d’essai et de renouvellement, le statut de l’abonnement, l’identifiant de transaction. **On ne reçoit jamais tes données de paiement** : c’est Apple ou Google qui te facture.',
        '**But :** ouvrir les fonctions Blowy+, vérifier l’achat auprès du store, gérer l’essai et son rappel.',
        '**Base légale :** exécution du contrat ; obligations comptables pour les références de transaction.',
        '**Durée :** le statut tant que ton compte existe ; les références de transaction, le temps imposé par nos obligations comptables (10 ans au plus).',
        '**Accès :** l’équipe Blowy habilitée ; Apple ou Google, selon leurs propres politiques.',
      ],
    },

    { h3: 'Signalements, blocages et modération', id: 'signalements' },
    {
      ul: [
        '**Données :** qui signale, qui est signalé, le lien concerné, le motif, les précisions écrites ; le **message signalé et son contexte immédiat** ; les blocages ; les décisions de modération et le journal des actions.',
        '**But :** protéger les personnes, traiter les signalements (objectif : sous 24 h), appliquer les [règles](@regles), répondre aux autorités, empêcher une personne bloquée de te contacter.',
        '**Base légale :** nos obligations légales (notamment le règlement sur les services numériques) et notre intérêt légitime à assurer la sécurité de la communauté.',
        '**Durée :** voir le [tableau des durées](#durees).',
        '**Accès :** les modérateurs habilités de Blowy, et les autorités si la loi l’exige. La personne signalée ne sait pas qui l’a signalée. Une personne bloquée n’est pas prévenue.',
      ],
    },

    { h3: 'Statistiques et administration' },
    {
      ul: [
        '**Données :** des chiffres calculés à partir de l’activité : nombre de comptes, comptes actifs, rétention, abonnés et essais, séries, messages des minimoas, rencontres proposées et acceptées, coûts de l’IA.',
        '**But :** piloter et améliorer Blowy, maîtriser les coûts.',
        '**Base légale :** notre intérêt légitime.',
        '**Comment :** ces statistiques sont calculées à partir de notre propre base, dans un outil interne réservé à quelques personnes autorisées. Il n’y a pas d’outil de mesure d’audience ni de publicité dans l’app. L’outil interne ne donne pas accès aux conversations, sauf au message signalé et à son contexte immédiat.',
        '**Durée :** les données individuelles suivent la durée de ton compte ; les chiffres agrégés, qui ne permettent pas de t’identifier, peuvent être gardés plus longtemps.',
      ],
    },

    { h3: 'Données techniques' },
    {
      ul: [
        '**Données :** adresse IP, modèle et système de l’appareil, version de l’app, langue, journaux d’erreurs et de connexion.',
        '**But :** faire tourner le service, le sécuriser, limiter les abus, corriger les bugs.',
        '**Base légale :** notre intérêt légitime ; nos obligations légales de conservation de certaines données de connexion.',
        '**Durée :** voir le [tableau des durées](#durees).',
        '**Accès :** l’équipe technique habilitée et nos hébergeurs.',
      ],
    },

    { h3: 'Les « 3 mots » et les invitations (personnes sans compte)' },
    {
      ul: [
        '**Données :** quand quelqu’un ouvre ta page « 3 mots » ou ton invitation sur le site, on affiche ton prénom et ton minimoa. Pour les votes, on enregistre les mots choisis et une empreinte non réversible de l’adresse IP et du navigateur, pour limiter les votes en double. Aucun compte n’est demandé.',
        '**Base légale :** exécution du contrat pour toi ; notre intérêt légitime à éviter les abus pour l’empreinte.',
        '**Durée :** tant que ton compte existe.',
        '**Accès :** tu vois les mots, jamais qui les a choisis.',
      ],
    },

    { h3: 'Quand tu nous écris' },
    {
      ul: [
        '**Données :** ton adresse e-mail, ton message, et ce qu’il faut pour traiter ta demande.',
        '**Base légale :** exécution du contrat ou notre intérêt légitime à te répondre ; obligation légale pour les demandes d’exercice de tes droits.',
        '**Durée :** voir le [tableau des durées](#durees).',
      ],
    },

    { h2: '3. Comment marche la compatibilité', id: 'compatibilite' },
    {
      p: 'Ton minimoa ne te présente que des personnes dont la vision de la vie va dans le même sens que la tienne. Voici la logique, sans secret :',
    },
    {
      ol: [
        '**Ta vision** est placée sur 5 axes : foyer (libre, en solo ↔ fonder un foyer), ancrage (rester ici ↔ partir), élan (du temps pour soi ↔ de grands projets), rythme (calme, chez soi ↔ intense, dehors), cap (au jour le jour ↔ tout prévoir). Chaque axe a un indice de confiance.',
        '**D’où elle vient**, avec des poids de départ : test d’inscription 40 % (puis de moins en moins), question du jour 20 %, habitudes 25 %, façon de t’occuper de ton minimoa 10 %, les 3 mots de tes potes 5 %. Plus tu utilises Blowy, plus la confiance monte.',
        '**Les filtres** : ce que chacun cherche, et pour « plus », qui il veut rencontrer ; 18 ans et plus ; la zone ; les personnes bloquées.',
        '**Le score** : la proximité sur les 5 axes, pondérée par la confiance. Pour « potes », l’axe foyer compte peu ; pour « plus », il compte double. Le style (sociable, joueur, tendre, bavard) n’entre pas dans le score.',
        '**Le seuil** : en dessous de 70 %, personne n’est proposé, quitte à en montrer moins.',
        '**L’explication** : chaque rencontre dit pourquoi, avec 3 points communs et 1 différence à explorer. Jamais un chiffre seul.',
        '**Le nombre de rencontres** dépend aussi de la forme de ton minimoa (plus tu t’en occupes, plus il te présente de monde) et de ton abonnement.',
      ],
    },
    {
      p: 'Ta vision est indicative : c’est « ta vision, pour l’instant ». Ce n’est pas un diagnostic, et on n’utilise aucun vocabulaire médical ou psychologique.',
    },
    {
      p: '**Aucune décision produisant des effets juridiques** à ton égard, ou t’affectant de manière comparable, n’est prise par ce calcul. Il décide seulement qui ton minimoa te présente ; c’est toujours toi qui choisis de saluer, d’accepter ou d’ignorer. Tu peux nous demander des explications, contester un résultat ou t’opposer à ce traitement en écrivant à {{email.privacy}} ; dans ce dernier cas, on ne pourra plus te présenter de rencontres.',
    },

    { h2: "4. L'intelligence artificielle", id: 'ia' },
    { p: 'Blowy utilise une IA à trois endroits, et nulle part ailleurs :' },
    {
      table: {
        head: ['Usage', 'Ce que reçoit l’IA', 'Ce qui est gardé'],
        rows: [
          ['Photos de preuve', 'La photo, réduite', 'La réponse (oui, non, pas sûr). La photo est supprimée sous 24 h, sauf si tu la gardes.'],
          ['Lecture des messages (si vous l’activez tous les deux)', 'Une courte fenêtre des derniers messages du lien', 'Rien de l’analyse. Seule la réaction du minimoa apparaît dans le chat.'],
          ['Bilan de la semaine et voix des minimoas', 'Un résumé de ton activité de la semaine (sorties, habitudes, série, liens)', 'Le texte du bilan, dans l’app.'],
        ],
      },
    },
    {
      p: 'Notre fournisseur d’IA agit comme sous-traitant : il traite ces données uniquement pour nous, sur nos instructions, et pas pour ses propres besoins. Aucun humain de Blowy ne voit ces contenus pendant l’analyse. Les réponses de l’IA peuvent se tromper : elles n’ont aucun effet juridique, et en cas de doute sur une preuve, on te fait confiance.',
    },

    { h2: '5. Ce que voient les autres', id: 'visibilite' },
    {
      ul: [
        '**Les personnes que ton minimoa te présente** voient ton prénom, ton minimoa, son style, vos points communs et une différence, et ta position approximative sur la carte (sauf en mode discret).',
        '**Tes liens** voient en plus vos messages, votre série, les étapes de votre lien et vos photos d’avant s’il y en a.',
        '**Les visiteurs de ta page « 3 mots » ou de ton invitation** voient ton prénom et ton minimoa.',
        'Personne ne voit ton adresse e-mail, ta date de naissance, ta position exacte, ni tes réponses au test de vision. Tes photos de preuve sont vérifiées par une IA : aucun humain ne les voit, et elles sont supprimées sous 24 h (sauf si tu les gardes dans tes souvenirs privés).',
      ],
    },

    { h2: '6. Nos prestataires', id: 'prestataires' },
    {
      p: 'Ces sous-traitants traitent des données pour notre compte, sur nos instructions, avec un contrat conforme à l’article 28 du RGPD :',
    },
    {
      subprocessors: {
        head: ['Rôle', 'Prestataire', 'Lieu de traitement', 'Garantie si hors UE'],
        roles: {
          database: 'Base de données, authentification et stockage des photos',
          api: 'Hébergement du serveur de l’app (API)',
          ai: 'IA : photos de preuve, lecture des messages si activée, bilans',
          email: 'Envoi des e-mails',
          push: 'Envoi des notifications',
          maps: 'Fond de carte',
          site: 'Hébergement du site blowy.app',
        },
      },
    },
    {
      p: '**Apple et Google** interviennent aussi, pour leur propre compte et selon leurs propres politiques : connexion (Sign in with Apple, Google), distribution de l’app (App Store, Google Play), paiement de Blowy+, et acheminement des notifications.',
    },
    { p: 'On peut enfin devoir communiquer des données aux autorités, quand la loi l’exige.' },

    { h2: "7. Transferts hors de l'Union européenne", id: 'transferts' },
    {
      p: 'On privilégie des prestataires qui traitent les données dans l’Union européenne. Quand un prestataire traite des données hors de l’UE (le tableau ci-dessus l’indique), le transfert est encadré par une décision d’adéquation de la Commission européenne (par exemple le cadre de protection des données UE–États-Unis, pour les entreprises certifiées) ou par les clauses contractuelles types de la Commission. Tu peux en obtenir une copie en écrivant à {{email.privacy}}.',
    },

    { h2: '8. Combien de temps on garde tes données', id: 'durees' },
    {
      table: {
        head: ['Donnée', 'Durée'],
        rows: [
          ['Compte, profil, vision, minimoa, habitudes, réglages', 'Tant que ton compte existe. Effacés dès que tu le supprimes.'],
          ['Compte inactif', 'Supprimé après 2 ans sans connexion, après un message de prévenance.'],
          ['Position', 'Seulement la dernière position arrondie et la zone de domicile approximative, remplacées à chaque mise à jour.'],
          ['Photos de preuve', 'Sous 24 h, sauf si tu les gardes dans tes souvenirs privés.'],
          ['Lecture des messages par l’IA', 'Rien n’est conservé après l’analyse.'],
          ['Messages, série, étapes et photos d’avant d’un lien', 'Tant que le lien existe.'],
          ['Achats', 'Statut tant que le compte existe ; références de transaction jusqu’à 10 ans (obligations comptables).'],
          ['Signalements et décisions de modération', '1 an après la clôture du dossier, plus longtemps si une procédure judiciaire l’exige.'],
          ['Exclusion définitive', 'Un identifiant technique du compte Apple ou Google, pendant 3 ans, pour empêcher une réinscription.'],
          ['Journaux techniques', '30 jours, sauf incident de sécurité en cours d’analyse. Les données de connexion que la loi nous impose de garder : la durée fixée par la loi, un an au plus.'],
          ['Échanges avec l’assistance', '1 an après la clôture de la demande.'],
          ['Demandes d’exercice de tes droits', '5 ans, pour pouvoir prouver qu’on y a répondu.'],
          ['Sauvegardes', 'Écrasées au fil de leur rotation, au plus tard 30 jours après la suppression.'],
        ],
      },
    },

    { h2: '9. Tes droits', id: 'droits' },
    { p: 'Selon le RGPD et la loi Informatique et Libertés, tu peux à tout moment :' },
    {
      ul: [
        '**accéder** à tes données et en obtenir une copie ;',
        'les faire **corriger** (beaucoup se modifient directement dans l’app) ;',
        'les faire **effacer** ([supprimer ton compte](@supprimer-mon-compte) le fait d’un coup) ;',
        '**retirer ton consentement** quand il fonde un traitement (données sensibles, localisation, photos de preuve, lecture des messages par l’IA, notifications), sans que cela remette en cause ce qui a été fait avant ;',
        't’**opposer** à un traitement fondé sur notre intérêt légitime, ou en demander la **limitation** ;',
        'récupérer les données que tu nous as fournies dans un format lisible par une machine (**portabilité**) ;',
        'définir des **directives** sur le sort de tes données après ton décès.',
      ],
    },
    {
      p: 'Pour exercer ces droits, écris à {{email.privacy}} ou à l’adresse postale de {{publisher.name}} : {{publisher.address}}. On répond sous un mois ; ce délai peut être prolongé de deux mois pour une demande complexe, et on te prévient alors. On pourra te demander de prouver que la demande vient bien de toi.',
    },
    {
      p: 'Si tu estimes que tes droits ne sont pas respectés, tu peux saisir la **CNIL** (3 place de Fontenoy, TSA 80715, 75334 Paris Cedex 07, [cnil.fr](https://www.cnil.fr/fr/plaintes)) ou l’autorité de protection des données de ton pays de résidence dans l’Union européenne.',
    },

    { h2: '10. Réservé aux adultes', id: 'mineurs' },
    {
      p: 'Blowy est réservé aux personnes de 18 ans et plus. On demande la date de naissance avant la connexion ; en dessous de 18 ans, l’inscription s’arrête et rien n’est créé. On ne collecte pas sciemment de données sur des mineurs. Si on apprend qu’un compte appartient à une personne mineure, il est supprimé. Tu peux nous le signaler depuis l’app avec le motif « Personne mineure ».',
    },

    { h2: '11. Sécurité', id: 'securite' },
    {
      ul: [
        'Les échanges entre l’app, le site et nos serveurs sont chiffrés en transit (HTTPS).',
        'Pas de mot de passe chez nous : la connexion passe par Apple ou Google.',
        'Les photos sont dans un stockage privé, accessibles seulement par des liens temporaires.',
        'L’accès aux données est limité aux personnes qui en ont besoin ; l’outil d’administration est réservé à des personnes autorisées, en lecture seule sauf pour la modération, et ses actions sont journalisées.',
        'On garde le moins possible : photos de preuve supprimées sous 24 h, position arrondie, rien de conservé après la lecture des messages par l’IA.',
      ],
    },
    {
      p: 'Aucun système n’est infaillible. En cas de violation de données, on prévient la CNIL dans les 72 heures quand la loi l’exige, et on te prévient directement si elle présente un risque élevé pour toi.',
    },

    { h2: '12. Changements', id: 'changements' },
    {
      p: 'Si on modifie cette politique de façon importante (par exemple un nouvel usage de tes données), on te prévient dans l’app avant que les changements s’appliquent, et on te redemande ton accord quand il est nécessaire. La date de dernière mise à jour est en haut de cette page.',
    },
  ],
};
