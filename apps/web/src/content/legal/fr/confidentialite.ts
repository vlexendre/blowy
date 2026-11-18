import type { LegalPage } from '../types';

export const confidentialite: LegalPage = {
  title: 'Politique de confidentialité — Minimoa',
  heading: 'Politique de confidentialité',
  description:
    'Les données que Minimoa utilise, pourquoi, sur quelle base légale, combien de temps, qui y a accès, et comment exercer tes droits.',
  intro: 'Ce qu’on sait de toi, pourquoi, qui y a accès, combien de temps on le garde, et comment tout effacer.',
  summary: {
    title: 'En bref',
    items: [
      'On utilise tes données pour une chose : faire vivre ton minimoa et te présenter des gens compatibles. **Pas de publicité, pas de revente.**',
      'On ne te demande pas ce que tu cherches : ton minimoa crée des liens, leur nature vous regarde. **Aucune donnée sur ton orientation n’est collectée.**',
      'Ta **position** n’est utilisée que quand l’app est ouverte, et **jamais enregistrée exacte** : on garde seulement un point arrondi à environ 300 m et ta zone. Sur la carte, les autres voient une position arrondie et décalée, jamais en temps réel, et le **mode discret** te retire de la carte. Sans localisation, tu choisis ta ville à la main.',
      'Une **IA tierce**, celle de {{sub.ai.provider}} ({{sub.ai.location}}), intervient à quatre endroits, détaillés [plus bas](#ia) : la lecture des chats si vous l’activez tous les deux, tes photos de preuve si tu l’acceptes, la vérification de sécurité des photos de profil et de certains messages, et le bilan de la semaine, envoyé sans aucun nom.',
      '**Personne chez Minimoa ne lit tes conversations**, sauf un message signalé (par quelqu’un ou par notre filtre automatique) et son contexte immédiat, lus par un modérateur.',
      'Tu peux tout modifier dans l’app et [supprimer ton compte](@supprimer-mon-compte) à tout moment. Pour le reste : {{email.privacy}}.',
    ],
  },
  toc: true,
  body: [
    { h2: '1. Qui est responsable', id: 'responsable' },
    {
      p: 'Le responsable du traitement est **{{publisher.name}}**, {{publisher.legalForm}}, {{publisher.address}}, qui édite l’app et le site Minimoa ([mentions légales](@mentions-legales)).',
    },
    {
      ul: [
        'Pour toute question sur tes données : {{email.privacy}}.',
        'Nous n’avons pas désigné de délégué à la protection des données (DPO) : toutes tes demandes sur tes données vont à {{email.privacy}}.',
      ],
    },
    {
      p: 'Cette politique s’applique à l’app Minimoa et au site minimoa.app. Pour les cookies du site, voir la [page cookies](@cookies).',
    },

    { h2: "2. Ce qu'on utilise, et pourquoi", id: 'donnees' },
    {
      p: 'Pour chaque usage : les données concernées, le but, la base légale (ce qui nous autorise à le faire, selon le RGPD), la durée de conservation et qui y a accès. Les durées sont reprises dans le [tableau des durées](#durees).',
    },

    { h3: 'Ton compte' },
    {
      ul: [
        '**Données :** l’identifiant que nous transmet Apple ou Google quand tu te connectes, et l’adresse e-mail associée. Avec Apple, cette adresse peut être une adresse relais qui masque la vraie. Avec Apple, on garde aussi un jeton de connexion fourni par Apple, qui sert seulement à révoquer l’accès de Minimoa à ton identifiant Apple quand tu supprimes ton compte.',
        '**But :** créer ton compte, te reconnecter, sécuriser l’accès, et t’écrire pour ce qui concerne ton compte (bienvenue, nouveau lien, rappel de fin d’essai, avertissement de modération, prévenance avant une suppression pour inactivité).',
        '**Base légale :** exécution du contrat.',
        '**Durée :** tant que ton compte existe. À la suppression, le jeton Apple est d’abord révoqué auprès d’Apple, puis effacé. Un compte sans connexion pendant 2 ans est supprimé, après un e-mail de prévenance envoyé 30 jours avant.',
        '**Accès :** l’équipe Minimoa habilitée, notre hébergeur d’authentification, notre prestataire d’envoi d’e-mails. Apple ou Google savent que tu utilises Minimoa, puisque la connexion passe par eux.',
      ],
    },

    { h3: 'Ton prénom et ta date de naissance' },
    {
      ul: [
        '**Données :** le prénom (ou surnom) que tu choisis ; ta date de naissance.',
        '**But :** le prénom te présente aux autres. Il passe par notre filtre automatique avant d’être enregistré (voir [modération](#signalements)). La date de naissance vérifie que tu as 18 ans ou plus, et sert au filtre d’âge des rencontres.',
        '**Base légale :** exécution du contrat ; pour l’âge et le filtre, aussi notre intérêt légitime à protéger les mineurs et la communauté.',
        '**Durée :** tant que ton compte existe. Si tu as moins de 18 ans, l’inscription s’arrête avant la connexion et rien n’est enregistré.',
        '**Accès :** ton prénom est visible des personnes que ton minimoa te présente et de tes liens. Ta date de naissance n’est pas affichée aux autres.',
      ],
    },

    { h3: 'Ta photo de profil', id: 'photo-profil' },
    {
      ul: [
        '**Données :** la photo que tu choisis, si tu en ajoutes une (c’est facultatif), prise avec l’appareil photo ou choisie dans ta galerie.',
        '**But :** te montrer à tes liens : elle reste cachée dans un lien jusqu’au niveau 4, floue au niveau 4, nette à partir du niveau 5.',
        '**Vérification de sécurité :** avant d’être publiée, la photo est réduite et envoyée à notre prestataire d’IA, {{sub.ai.provider}}, qui vérifie qu’elle ne montre ni nudité, ni personne qui semble mineure, ni violence, ni haine, ni publicité. On te le dit dans l’app avant que tu choisisses la photo. Une photo refusée est effacée aussitôt, et l’équipe de modération reçoit un signalement automatique, sans la photo. Si la vérification n’est pas possible sur le moment, la photo est publiée et vérifiée un peu plus tard. Cette vérification ne se désactive pas : elle protège tout le monde. Sans photo de profil, rien n’est envoyé.',
        '**Base légale :** exécution du contrat pour l’afficher ; notre intérêt légitime et nos obligations de sécurité (filtrer les contenus publiés) pour la vérification.',
        '**Durée :** tant que tu la gardes. Quand tu la changes, l’ancienne est effacée. Elle est effacée quand tu supprimes ton compte.',
        '**Accès :** tes liens, selon le niveau du lien ; notre prestataire d’IA, le temps de la vérification.',
      ],
    },

    { h3: 'Ton sexe', id: 'sexe' },
    {
      ul: [
        '**Données :** ton sexe (femme, homme, non-binaire, ou « je préfère ne pas dire »).',
        '**But :** accorder les textes de l’app, et des statistiques sans nom. **Il ne sert pas à choisir qui ton minimoa te présente.**',
        '**Base légale :** notre intérêt légitime. « Je préfère ne pas dire » reste toujours possible, et tu peux changer ta réponse dans l’app (**Moi → Réglages → Qui tu es**).',
        '**Durée :** tant que ton compte existe.',
        '**Accès :** toi seul. Il n’est jamais montré aux autres.',
        'On ne te demande pas ce que tu cherches ni qui tu veux rencontrer : ton minimoa crée des liens, leur nature vous regarde. Les réponses données à ces questions avant le 17 novembre 2026, et l’accord qui allait avec, ont été effacées.',
      ],
    },

    { h3: 'Ta localisation', id: 'localisation' },
    {
      ul: [
        '**Données :** ta position, **seulement quand l’app est ouverte** (jamais en arrière-plan). **Elle n’est jamais enregistrée telle quelle** : notre serveur garde seulement le centre de la case d’environ 300 m où tu te trouves, et ta zone de domicile approximative, qui en est déduite (même précision). La position exacte sert seulement, le temps de la requête, à savoir si tu es hors de ta zone de domicile.',
        '**Sans localisation :** tu peux choisir ta ville à la main (gratuit ; une fois tous les 30 jours, ou quand tu veux avec Minimoa+). On garde alors seulement la ville choisie et son centre, qui servent de zone.',
        '**But :** te montrer la carte et les minimoas compatibles autour de toi ; te proposer des rencontres proches ; confirmer qu’une sortie a bien eu lieu hors de ta zone de domicile, pour faire monter la sociabilité de ton minimoa.',
        '**Ce que voient les autres :** jamais ta position exacte. Ils voient une position arrondie à environ 300 m et décalée, jamais en temps réel. Le **mode discret** te retire complètement de la carte.',
        '**Base légale :** ton consentement, donné via l’autorisation de localisation de ton téléphone, ou en choisissant ta ville. Tu peux le retirer à tout moment : dans les réglages du téléphone, ou dans l’app (**Moi → Réglages → Ma position → Oublier ma position**), ce qui efface ta position et ta zone.',
        '**Durée :** le dernier point arrondi et ta zone (ou la ville choisie), remplacés à chaque mise à jour. On ne garde pas l’historique de tes déplacements.',
        '**Accès :** l’équipe Minimoa habilitée, notre hébergeur, et le fournisseur du fond de carte, qui reçoit de ton téléphone la zone affichée à l’écran.',
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
        '**Données :** le nom et l’apparence de ton minimoa, ses jauges (sociabilité, faim, énergie, humeur), les gestes que tu fais, tes habitudes et leur rythme, ta série, tes jokers, tes objets, tes défis du jour, ton bilan de la semaine. Le nom du minimoa passe par notre filtre automatique, comme ton prénom.',
        '**But :** faire fonctionner le jeu.',
        '**Base légale :** exécution du contrat.',
        '**Durée :** tant que ton compte existe.',
        '**Accès :** toi ; tes liens et les personnes présentées voient ton minimoa et son style.',
      ],
    },

    { h3: 'Les photos de preuve et de défi', id: 'preuves' },
    {
      ul: [
        '**Données :** la photo que tu prends dans l’app quand ton minimoa demande une preuve d’habitude (par exemple tes baskets), ou pour un défi photo du jour. Elle est prise avec l’appareil photo, pas depuis ta galerie.',
        '**But :** vérifier qu’une habitude est tenue ; compter un défi relevé.',
        '**Vérification par une IA, seulement si tu l’acceptes :** avant ta première preuve, l’app te dit ce qui part, à qui et pourquoi, et tu choisis. Si tu acceptes, chaque photo de preuve est réduite et envoyée à {{sub.ai.provider}} avec le nom de l’habitude (ni ton prénom, ni ta position), qui répond oui, non ou « pas sûr », avec une phrase ; en cas de « pas sûr », on te fait confiance. Si tu refuses, **aucune photo ne part à une IA** : tu valides l’habitude sur parole, sans photo, et ta série avance pareil. Tu changes d’avis quand tu veux dans **Moi → L’IA et toi**. Les photos des défis ne sont jamais envoyées à une IA.',
        '**Base légale :** ton consentement, pour la vérification par l’IA ; exécution du contrat, pour le stockage temporaire.',
        '**Durée :** **supprimée de notre stockage sous 24 h**, sauf si tu choisis de la garder dans tes souvenirs privés (elle y reste jusqu’à ce que tu ne la gardes plus ou que tu supprimes ton compte).',
        '**Accès :** **aucun humain ne la voit**, ni chez Minimoa ni ailleurs sur Minimoa. Seul {{sub.ai.provider}} reçoit une photo de preuve, réduite, si tu l’as accepté.',
      ],
    },
    { p: 'Évite de photographier d’autres personnes, des documents ou des informations sensibles.' },

    { h3: 'Tes messages, et leur lecture par une IA si vous l’activez', id: 'messages' },
    {
      ul: [
        '**Données :** les messages que tu échanges dans tes liens, leur date, et ce qui a été lu.',
        '**But :** les transmettre à l’autre personne et les garder dans votre conversation.',
        '**Filtre automatique :** avant d’être envoyé, chaque message passe par notre filtre, sur nos serveurs (des listes de mots en plusieurs langues, sans IA). Une violation nette (menace, haine, contenu sexuel impliquant un mineur, sexe tarifé, arnaque) n’est pas envoyée : on te dit pourquoi, ton texte reste dans le champ, et l’équipe de modération reçoit un signalement automatique avec un court extrait. Un message limite (insulte, contenu sexuel explicite) est envoyé, mais signalé à l’équipe de modération, et ton minimoa te propose une pause.',
        '**Base légale :** exécution du contrat ; pour le filtre, notre intérêt légitime et nos obligations de sécurité.',
        '**Durée :** tant que le lien existe, c’est-à-dire tant que vos deux comptes existent. Quitter un lien le retire de vos listes à tous les deux, sans effacer la conversation : elle revient si vous vous retrouvez. Si l’un de vous supprime son compte, le lien et ses messages sont effacés pour les deux.',
        '**Accès :** toi et l’autre personne. Un modérateur peut lire un message **signalé**, par l’un de vous ou par le filtre, et son contexte immédiat (voir [signalements](#signalements)).',
      ],
    },
    {
      note: 'La phrase que l’app vous montre avant de vous demander votre accord : « Personne chez Minimoa ne lit tes conversations, sauf un message signalé et les quelques messages autour, pour la modération. Si vous l’activez l’un et l’autre, une IA lit vos derniers messages pour que vos minimoas puissent y réagir. Cette IA est fournie par {{sub.ai.provider}} ({{sub.ai.location}}), notre prestataire, qui reçoit ces messages pour nous. Tu peux retirer ton accord quand tu veux. »',
    },
    {
      ul: [
        '**Accord de chacun :** on vous le demande à tous les deux, à la première ouverture du chat (ou une fois pour tous tes chats, si tu choisis un réglage par défaut). Si l’un n’a pas dit oui, l’IA ne lit rien : les minimoas réagissent seulement au rythme du lien (silences, séries, défis), avec des phrases toutes faites.',
        '**Retrait :** à tout moment, dans les options du lien, ou pour tous tes chats dans **Moi → L’IA et toi**. La lecture s’arrête aussitôt.',
        '**Comment :** pas d’analyse à chaque message. Au moment d’un déclencheur (un silence, un certain nombre de messages, un ton qui monte), une courte fenêtre des derniers messages est envoyée à {{sub.ai.provider}}, avec les auteurs notés A et B, sans vos prénoms ; l’IA propose la réaction du minimoa. Au plus 3 interventions par jour et par lien, et tu peux les couper pour un lien. Si le ton monte, ton minimoa peut te proposer une pause : ce message n’est visible que par toi.',
        '**Vérification de sécurité :** dans un chat où vous avez accepté la lecture tous les deux, un message qui laisse un doute à notre filtre (un lien, par exemple) peut aussi être envoyé seul à {{sub.ai.provider}}, après l’envoi, pour vérifier qu’il respecte les règles. S’il ne les respecte pas, il est signalé à l’équipe de modération.',
        '**Ce qui est gardé :** chez Minimoa, rien de la fenêtre envoyée ni de l’analyse ; seule la réaction du minimoa apparaît dans le chat, comme un message. Ce que {{sub.ai.provider}} garde de son côté, et combien de temps : {{ai.retention}}.',
        '**Base légale :** le consentement de chacun de vous deux.',
      ],
    },

    { h3: 'La série et les étapes d’un lien' },
    {
      ul: [
        '**Données :** les jours où chacun de vous deux a écrit dans le lien (pas le contenu des messages) et les étapes du lien (rencontre, niveaux passés, records de série). Pour les liens d’avant le 15 novembre 2026, les « photos du jour » que vous vous y étiez envoyées : Minimoa n’en reçoit plus de nouvelles, et les anciennes restent dans les souvenirs du lien.',
        '**But :** faire vivre la série du lien (les jours d’affilée où vous vous écrivez tous les deux), ses vies et ses niveaux, et vous montrer vos souvenirs.',
        '**Base légale :** exécution du contrat.',
        '**Durée :** tant que le lien existe (mêmes règles que les messages) : les anciennes photos du jour sont effacées quand le lien l’est, ou quand l’un de vous supprime son compte.',
        '**Accès :** toi et l’autre personne du lien (ses anciennes photos restent floues pour toi jusqu’au niveau 5). Les photos sont stockées dans un espace privé, accessibles seulement par des liens temporaires.',
      ],
    },

    { h3: 'Les notifications et les e-mails' },
    {
      ul: [
        '**Données :** le jeton technique de ton téléphone pour les notifications, tes réglages par type de notification, l’heure choisie pour le défi du jour ; sur iPhone, les jetons des activités en direct.',
        '**But :** te prévenir (défi du jour, nouvelle rencontre, message, « à toi d’écrire » le soir, lien ou série en danger, preuve demandée, bilan, rappel de fin d’essai ; premiers pas les 7 premiers jours, nouvelles de ton minimoa quand tu t’absentes et à vos anniversaires, messages de ton abonnement Minimoa+). Heures calmes de 22 h à 8 h ; hors messages, 3 par jour au plus. Le rappel de fin d’essai et les e-mails de ton abonnement (bienvenue, paiement refusé, fin) partent aussi par e-mail, même si les notifications sont coupées. L’e-mail après 14 jours d’absence et la relance unique un mois après la fin de Minimoa+ se coupent avec le même réglage que la notification (« Nouvelles de ton minimoa », « Ton abonnement Minimoa+ »). Sur iPhone, le widget et les activités en direct utilisent les mêmes données ; une activité en direct sur l’écran verrouillé ne montre jamais le prénom de quelqu’un.',
        '**Base légale :** ton consentement pour les notifications, donné via l’autorisation de ton téléphone (tu le retires dans les réglages du téléphone ou type par type dans l’app) ; exécution du contrat pour les e-mails liés à ton compte et à ton abonnement ; intérêt légitime pour l’e-mail d’absence et la relance après la fin de Minimoa+ (tu t’y opposes en coupant le réglage).',
        '**Durée :** jusqu’à ce que tu désactives les notifications ou supprimes ton compte. La liste des messages déjà envoyés (seulement leur type et leur date, pour ne jamais envoyer deux fois le même) est gardée 400 jours au plus.',
        '**Accès :** nos prestataires d’envoi des notifications et des e-mails, et Apple ou Google, qui acheminent les notifications jusqu’à ton téléphone.',
      ],
    },

    { h3: 'Les achats Minimoa+' },
    {
      ul: [
        '**Données :** l’offre choisie, les dates d’achat, d’essai et de renouvellement, le statut de l’abonnement, l’identifiant de transaction. **On ne reçoit jamais tes données de paiement** : c’est Apple qui te facture.',
        '**But :** ouvrir les fonctions Minimoa+, vérifier l’achat auprès d’Apple, gérer l’essai et son rappel.',
        '**Base légale :** exécution du contrat ; obligations comptables pour les références de transaction.',
        '**Durée :** le statut tant que ton compte existe ; les références de transaction, détachées de ton compte s’il est supprimé, jusqu’à 10 ans (obligations comptables).',
        '**Accès :** l’équipe Minimoa habilitée ; Apple, selon sa propre politique.',
      ],
    },

    { h3: 'Filtrage, signalements, blocages et modération', id: 'signalements' },
    {
      ul: [
        '**Données :** qui signale, qui est signalé, le lien concerné, le motif, les précisions écrites ; le **message signalé et son contexte immédiat** ; les signalements automatiques de notre filtre (prénom ou nom de minimoa refusé, message non envoyé avec un extrait de 280 caractères au plus, message limite, photo de profil refusée, sans la photo) ; les blocages ; les décisions de modération et le journal des actions.',
        '**Filtrage automatique :** les prénoms, les noms de minimoa, les messages et les photos de profil sont filtrés avant d’être publiés (voir plus haut). Un prénom ou un nom refusé n’est pas enregistré, et l’app te dit pourquoi.',
        '**But :** protéger les personnes, traiter les signalements, appliquer les [règles](@regles), répondre aux autorités, empêcher une personne bloquée de te contacter. L’équipe de modération est prévenue par e-mail de chaque nouveau signalement : aussitôt pour un signalement urgent (personne mineure, menace), sinon dans un récapitulatif. Objectif : un traitement sous 24 h ; au-delà, le signalement remonte en tête de la file.',
        '**Suspension automatique, dans deux cas seulement :** un message qui contient du vocabulaire pédocriminel explicite, ou un compte signalé comme mineur par deux personnes différentes. Le compte est alors suspendu 72 h au plus, le temps qu’un modérateur regarde ; il lève ou confirme la suspension. En dehors de ces deux cas et des refus du filtre, aucune sanction n’est prise sans un humain.',
        '**Contester :** tu peux contester toute décision qui te concerne, automatique ou non, en écrivant à {{email.support}} (depuis l’app, l’écran d’un compte suspendu a un bouton pour ça). Une personne réexamine la décision.',
        '**Base légale :** nos obligations légales (notamment le règlement sur les services numériques) et notre intérêt légitime à assurer la sécurité de la communauté.',
        '**Durée :** voir le [tableau des durées](#durees). Si tu supprimes ton compte, les signalements qui te concernent et le journal des décisions restent jusqu’à leur effacement, sans lien avec un compte (le journal garde le prénom concerné).',
        '**Accès :** les modérateurs habilités de Minimoa, et les autorités si la loi l’exige. La personne signalée ne sait pas qui l’a signalée. Une personne bloquée n’est pas prévenue.',
      ],
    },

    { h3: 'D’où tu viens, et les étapes de ton parcours', id: 'croissance' },
    {
      ul: [
        '**Données :** la façon dont tu es arrivé·e sur Minimoa (le code d’un créateur, le lien « 3 mots » ou le lien de groupe ouvert, une invitation, ou rien de tout ça), lue **seulement** dans le lien que tu as ouvert avant ton inscription ou dans le code que tu as tapé (« Un code ? ») ; la personne qui t’a fait venir, s’il y en a une ; et les grandes étapes de ton parcours, une fois chacune : inscription terminée, premier lien, retour 1, 7 et 30 jours après, début d’essai et premier paiement Minimoa+.',
        '**Ce qu’on ne fait pas :** aucune empreinte de ton appareil (ni modèle, ni adresse IP, ni identifiant publicitaire), aucun outil de mesure tiers. Les visites des pages publiques (« 3 mots », invitation, groupe, code créateur), les premiers lancements de l’app, les votes et les partages sont seulement **comptés par jour**, sans IP ni identifiant : personne ne se cache derrière ces compteurs.',
        '**But :** savoir quels liens et quels créateurs font venir des gens qui restent, améliorer le parcours, et offrir l’objet de garde-robe « Parrain » à la personne qui en a fait venir une autre et à celle qui arrive (objet décoratif, jamais lié à un achat ni à un avis).',
        '**Base légale :** notre intérêt légitime.',
        '**Durée :** la source et les étapes, tant que ton compte existe. Quand tu le supprimes, la source est effacée et les étapes perdent tout lien avec toi (il ne reste qu’un nombre). Les compteurs du jour sont gardés sans limite.',
        '**Accès :** quelques personnes autorisées de l’équipe, dans l’outil interne, en chiffres seulement. Un créateur ne voit jamais qui est arrivé avec son code.',
      ],
    },

    { h3: 'Le quiz « Quel minimoa es-tu ? » et « Ouvre ton quartier » (site, sans compte)', id: 'quiz-quartier' },
    {
      ul: [
        '**Quiz :** tes réponses servent à calculer ton résultat dans la requête ; on ne garde **que le résultat** (l’espèce, le caractère et les jauges de départ), sous un code court, et le code du résultat de la personne qui t’a défié, s’il y en a un. Aucun nom, aucune adresse, aucune IP n’y est attaché. Le code sert à retrouver ton résultat et à pré-remplir ton minimoa si tu le tapes dans l’app. Effacé au bout d’un an.',
        '**Ouvre ton quartier :** ton adresse e-mail, le quartier choisi (dans une liste ou par code postal ; **jamais ta position**), ta langue, la date de ton accord et de ta confirmation, ton code pour inviter et, si tu es venu·e par le lien de quelqu’un, qui t’a invité·e. Tu comptes dans le compteur du quartier seulement après avoir confirmé ton adresse (double vérification). On t’écrit deux fois au plus : la confirmation, puis l’ouverture du quartier.',
        '**But :** te prévenir de l’ouverture de ton quartier, afficher le vrai compteur (un nombre, jamais une adresse), et offrir l’objet décoratif « Fondateur » aux 3 premières personnes qui ont invité dans le quartier.',
        '**Base légale :** ton consentement (case à cocher, jamais cochée d’avance), retirable à tout moment par le lien de désinscription présent dans chaque e-mail.',
        '**Durée :** non confirmée, l’inscription est effacée sous 7 jours. Désinscription : l’adresse est effacée tout de suite. Après l’e-mail d’ouverture, l’adresse est effacée sous 30 jours ; il ne reste qu’une ligne anonyme (quartier et code) pour le compteur et l’objet « Fondateur ».',
        '**Accès :** l’envoi des e-mails passe par notre prestataire d’e-mails ({{sub.email.provider}}). L’outil interne de l’équipe ne montre que des compteurs par quartier, jamais d’adresse.',
        '**Sur le site :** pendant ta visite, le code de ton résultat est gardé dans le stockage de session de ton navigateur (effacé quand tu fermes l’onglet), pour te remontrer ton résultat. Aucun cookie.',
      ],
    },

    { h3: 'Statistiques et administration' },
    {
      ul: [
        '**Données :** des chiffres calculés à partir de l’activité : nombre de comptes, comptes actifs, rétention, abonnés et essais, séries, messages des minimoas, rencontres proposées et acceptées, coûts de l’IA. Pour les calculer, on note les jours où tu ouvres l’app, et les rencontres proposées à chacun.',
        '**But :** piloter et améliorer Minimoa, maîtriser les coûts.',
        '**Base légale :** notre intérêt légitime.',
        '**Comment :** ces statistiques sont calculées à partir de notre propre base, dans un outil interne réservé à quelques personnes autorisées. Pas de publicité dans l’app ; le seul outil de mesure d’usage, {{sub.analytics.provider}}, ne fonctionne qu’avec ton accord ([voir plus bas](#statistiques-usage)). L’outil interne ne donne pas accès aux conversations, sauf au message signalé et à son contexte immédiat.',
        '**Durée :** jours d’activité, 40 jours ; rencontres proposées, 30 jours ; compteur d’usage de l’IA par personne, 2 jours ; classement interne des minimoas les plus actifs (prénom et minimoa), 40 jours. Les chiffres agrégés, qui ne permettent pas de t’identifier, sont gardés sans limite.',
      ],
    },

    { h3: 'Statistiques d’usage, seulement avec ton accord', id: 'statistiques-usage' },
    {
      ul: [
        '**Données :** un identifiant aléatoire créé par l’outil sur ton téléphone (sans ton prénom, ton adresse e-mail ni l’identifiant de ton compte), l’adresse IP, le modèle et le système de l’appareil, la version de l’app, la langue, et des actions faites dans l’app (pour l’instant, une seule : la création de ton compte). Ces données sont pseudonymes, pas anonymes : elles ne disent pas qui tu es, mais concernent ton téléphone.',
        '**But :** comprendre comment l’app est utilisée, pour l’améliorer. Jamais de publicité, jamais de suivi d’une app ou d’un site à l’autre.',
        '**Base légale :** ton consentement. On te pose la question juste avant de créer ton compte (« Oui, je participe » ou « Non merci », rien n’est choisi d’avance). Sans ton accord, rien n’est envoyé.',
        '**Retrait :** à tout moment, dans **Moi → Réglages → Statistiques d’usage**. L’envoi s’arrête aussitôt.',
        '**Accès :** notre outil de mesure, {{sub.analytics.provider}} ({{sub.analytics.location}}), qui traite ces données pour nous ; garantie du transfert : {{sub.analytics.safeguard}}.',
        '**Durée :** voir le [tableau des durées](#durees).',
      ],
    },

    { h3: 'Données techniques' },
    {
      ul: [
        '**Données :** adresse IP, modèle et système de l’appareil, version de l’app, langue, journaux d’erreurs et de connexion.',
        '**But :** faire tourner le service, le sécuriser, limiter les abus, corriger les bugs.',
        '**Base légale :** notre intérêt légitime.',
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
        '**D’où elle vient**, avec des poids de départ : test d’inscription 40 % (puis de moins en moins), question du jour 20 %, habitudes 25 %, façon de t’occuper de ton minimoa 10 %, les 3 mots de tes potes 5 %. Plus tu utilises Minimoa, plus la confiance monte.',
        '**Les filtres** : 18 ans et plus ; la zone ; les personnes bloquées. Ni ton sexe ni celui des autres ne filtrent qui t’est présenté.',
        '**Le score** : la proximité sur les 5 axes, pondérée par la confiance ; l’axe foyer compte moins que les autres. Le style (sociable, joueur, tendre, bavard) n’entre pas dans le score.',
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
    {
      p: 'Minimoa utilise l’IA de **{{sub.ai.provider}}** ({{sub.ai.location}}), un prestataire extérieur, à quatre endroits et nulle part ailleurs. Tout se voit, et ce qui peut l’être se retire, dans l’app : **Moi → L’IA et toi**.',
    },
    {
      table: {
        head: ['Usage', 'Quand', 'Ce que reçoit le prestataire', 'Ce qui est gardé chez Minimoa'],
        rows: [
          [
            'Lecture des chats',
            'Seulement si vous l’avez activée tous les deux ; retirable à tout moment',
            'Une courte fenêtre des derniers messages du lien, auteurs notés A et B, sans vos prénoms',
            'Rien de la fenêtre ni de l’analyse. Seule la réaction du minimoa apparaît dans le chat.',
          ],
          [
            'Photos de preuve d’habitude',
            'Seulement si tu l’as accepté, une fois, avant ta première preuve ; retirable. Sans accord : validation sur parole, sans photo',
            'La photo réduite et le nom de l’habitude',
            'La réponse (oui, non, pas sûr). La photo est supprimée sous 24 h, sauf si tu la gardes.',
          ],
          [
            'Vérifications de sécurité',
            'Chaque photo de profil, avant d’être publiée (ne se désactive pas) ; un message qui laisse un doute au filtre, seulement dans un chat où vous avez accepté la lecture tous les deux',
            'La photo de profil réduite ; ou ce seul message',
            'La décision (acceptée, ou refusée et signalée à la modération). Une photo refusée est effacée.',
          ],
          [
            'Bilan de la semaine',
            'Les semaines actives, pour reformuler ton bilan',
            'Un texte fait de chiffres et de phrases générales, sans aucun prénom ni nom (ni le tien, ni ceux de tes liens, ni celui de ton minimoa) : rien qui permette de t’identifier',
            'Le texte du bilan, dans l’app.',
          ],
        ],
      },
    },
    {
      p: 'On n’envoie jamais au prestataire d’IA ton adresse e-mail, ta date de naissance, ta position, ni l’identifiant de ton compte. Il agit comme sous-traitant : il traite ces données uniquement pour nous, sur nos instructions, et pas pour ses propres besoins. Ce qu’il garde de son côté, et combien de temps : {{ai.retention}}. Les photos des défis du jour ne sont jamais envoyées à une IA. Sans accord pour la lecture des chats, les minimoas parlent avec des phrases toutes faites, sans IA.',
    },
    {
      p: 'Les réponses de l’IA peuvent se tromper : elles n’ont aucun effet juridique. En cas de doute sur une preuve, on te fait confiance ; une photo de profil refusée à tort peut être signalée à {{email.support}}.',
    },

    { h2: '5. Ce que voient les autres', id: 'visibilite' },
    {
      ul: [
        '**Les personnes que ton minimoa te présente** voient ton prénom, ton minimoa, son style, vos points communs et une différence, et ta position approximative sur la carte (sauf en mode discret).',
        '**Tes liens** voient en plus vos messages, votre série, les étapes de votre lien, vos anciennes photos du jour s’il y en a, et ta photo de profil si tu en as une (cachée jusqu’au niveau 4, floue au niveau 4, nette à partir du niveau 5).',
        '**Les visiteurs de ta page « 3 mots » ou de ton invitation** voient ton prénom et ton minimoa.',
        'Personne ne voit ton adresse e-mail, ta date de naissance, ton sexe, ni tes réponses au test de vision. Ta position exacte n’est enregistrée nulle part. Tes photos de preuve ne sont vues par aucun humain, et elles sont supprimées sous 24 h (sauf si tu les gardes dans tes souvenirs privés).',
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
          ai: 'IA : lecture des chats si vous l’activez tous les deux, photos de preuve si tu l’acceptes, vérification de sécurité des photos de profil et de certains messages, bilan de la semaine (sans nom)',
          email: 'Envoi des e-mails (compte, rappel de fin d’essai, alertes de modération)',
          push: 'Envoi des notifications',
          maps: 'Fond de carte',
          analytics: 'Statistiques d’usage, seulement avec ton accord',
          site: 'Hébergement du site minimoa.app',
        },
      },
    },
    {
      p: '**Apple et Google** interviennent aussi, pour leur propre compte et selon leurs propres politiques : connexion (Sign in with Apple, Google), distribution de l’app (App Store, Google Play), paiement de Minimoa+ (App Store), et acheminement des notifications.',
    },
    { p: 'On peut enfin devoir communiquer des données aux autorités, quand la loi l’exige.' },

    { h2: "7. Transferts hors de l'Union européenne", id: 'transferts' },
    {
      p: 'On privilégie des prestataires qui traitent les données dans l’Union européenne. Quand un prestataire traite des données hors de l’UE (le tableau ci-dessus l’indique, par exemple notre prestataire d’IA), le transfert est encadré par la garantie indiquée dans le tableau : une décision d’adéquation de la Commission européenne (par exemple le cadre de protection des données UE–États-Unis, pour les entreprises certifiées) ou les clauses contractuelles types de la Commission. Tu peux en obtenir une copie en écrivant à {{email.privacy}}.',
    },

    { h2: '8. Combien de temps on garde tes données', id: 'durees' },
    {
      table: {
        head: ['Donnée', 'Durée'],
        rows: [
          ['Compte, profil, vision, minimoa, habitudes, réglages', 'Tant que ton compte existe. Effacés dès que tu le supprimes.'],
          ['Compte inactif', 'Supprimé après 2 ans sans connexion, après un e-mail de prévenance envoyé 30 jours avant.'],
          ['Jeton de connexion Apple', 'Tant que ton compte existe. Révoqué auprès d’Apple puis effacé quand tu le supprimes.'],
          ['Position', 'Seulement le dernier point arrondi (environ 300 m) et ta zone, ou la ville choisie, remplacés à chaque mise à jour. Effacés si tu oublies ta position.'],
          ['Photo de profil', 'Tant que tu la gardes. L’ancienne est effacée quand tu la changes ; une photo refusée par la vérification est effacée aussitôt.'],
          ['Photos de preuve et de défi', 'Sous 24 h, sauf si tu les gardes dans tes souvenirs privés (jusqu’à ce que tu ne les gardes plus ou supprimes ton compte).'],
          ['Ce qui est envoyé à l’IA', 'Rien n’est gardé chez Minimoa, sauf la réponse (réaction du minimoa, verdict d’une preuve, décision de sécurité, texte du bilan). Chez le prestataire : {{ai.retention}}.'],
          ['Messages, série, étapes et anciennes photos du jour d’un lien', 'Tant que le lien existe, c’est-à-dire jusqu’à la suppression du compte de l’un de vous deux.'],
          ['Achats', 'Statut tant que le compte existe ; références de transaction jusqu’à 10 ans (obligations comptables), détachées du compte s’il est supprimé.'],
          ['Signalements traités et décisions de modération', '1 an après la clôture du dossier, plus longtemps seulement si la loi l’impose.'],
          ['Exclusion définitive', 'Une empreinte non réversible de l’identifiant Apple ou Google du compte, pendant 3 ans, pour empêcher une réinscription.'],
          ['Statistiques', 'Jours d’activité et classement interne nominatif : 40 jours. Rencontres proposées : 30 jours. Chiffres agrégés, qui ne permettent pas de t’identifier : sans limite.'],
          ['Statistiques d’usage (si tu as dit oui)', 'Chez {{sub.analytics.provider}} : 25 mois au plus.'],
          ['Quiz du site et « Ouvre ton quartier »', 'Résultat du quiz : 1 an. Inscription non confirmée : 7 jours. Adresse e-mail : jusqu’à ta désinscription, ou 30 jours après l’e-mail d’ouverture du quartier.'],
          ['Source d’arrivée et étapes du parcours', 'Tant que ton compte existe ; effacées ou rendues anonymes à sa suppression. Compteurs du jour (visites, premiers lancements, votes, partages), sans personne derrière : sans limite.'],
          ['Journaux techniques de l’app', '30 jours au plus. Les journaux de nos hébergeurs suivent leurs propres durées.'],
          ['Échanges avec l’assistance', '1 an après la clôture de la demande.'],
          ['Demandes d’exercice de tes droits', '5 ans, pour pouvoir prouver qu’on y a répondu.'],
          ['Sauvegardes', 'Écrasées au fil de leur rotation chez notre hébergeur de données : {{dataHost.backupRetention}}.'],
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
        '**retirer ton consentement** quand il fonde un traitement (localisation, vérification des photos de preuve par l’IA, lecture des messages par l’IA, statistiques d’usage, notifications), sans que cela remette en cause ce qui a été fait avant ;',
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
      p: 'Minimoa est réservé aux personnes de 18 ans et plus. On demande la date de naissance avant la connexion ; en dessous de 18 ans, l’inscription s’arrête et rien n’est créé. On ne collecte pas sciemment de données sur des mineurs. Si on apprend qu’un compte appartient à une personne mineure, il est supprimé. Tu peux nous le signaler depuis l’app avec le motif « Personne mineure » ; un compte signalé ainsi par deux personnes différentes est suspendu en attendant un modérateur.',
    },

    { h2: '11. Sécurité', id: 'securite' },
    {
      ul: [
        'Les échanges entre l’app, le site et nos serveurs sont chiffrés en transit (HTTPS).',
        'Pas de mot de passe chez nous : la connexion passe par Apple ou Google.',
        'Les photos sont dans un stockage privé, accessibles seulement par des liens temporaires.',
        'L’accès aux données est limité aux personnes qui en ont besoin ; l’outil d’administration est réservé à des personnes autorisées, en lecture seule sauf pour la modération, et ses actions sont journalisées.',
        'On garde le moins possible : position jamais enregistrée exacte, photos de preuve et de défi supprimées sous 24 h, rien de gardé chez Minimoa de ce qui est envoyé à l’IA.',
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
