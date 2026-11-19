import type { SeedTexts } from './texts';

export const fr: SeedTexts = {
  units: {
    vision: ['Ta vision de la vie', 'Ce que tu veux pour plus tard.'],
    energie: ['Ton énergie', 'Ce qui te recharge, ce qui te lance.'],
    habitudes: ['Tes habitudes de vie', 'Ton quotidien, sans filtre.'],
    valeurs: ['Ce qui compte pour toi', 'Ce que tu ne lâcherais pour rien.'],
    autres: ['Toi avec les autres', 'Tes amis, tes proches, et les nouveaux.'],
    gouts: ['Tes goûts', 'Ce qui te fait envie.'],
  },
  steps: {
    vision_1: 'Les grands choix',
    vision_2: 'Ton chez-toi, ton rythme',
    energie_1: 'Recharger les batteries',
    energie_2: 'Partir au quart de tour',
    habitudes_1: 'Organisé ou pas',
    habitudes_2: 'Tes journées',
    valeurs_1: 'Tes priorités',
    valeurs_2: 'Ici ou ailleurs',
    autres_1: 'Tes amis',
    autres_2: 'Tes proches',
    gouts_1: 'Découvrir',
    gouts_2: 'Tes plaisirs',
  },
  legacy: {
    dimanche: { o: 'Demande-lui à quoi ressemble son dimanche parfait.', r: ['Plaid et série : je m’installe à côté.', 'Je prends mon écharpe, on y va !'] },
    enfants: { o: 'Demande-lui comment se passent ses dimanches midi.', r: ['Il faudra rallonger la table.', 'Le brunch, c’est sacré.'] },
    mutation: { o: 'Demande-lui le pays où elle ou il partirait demain.', r: ['Je me glisse dans un carton.', 'Ici, c’est chez toi.'] },
    heritage: { o: 'Demande-lui ce qu’elle ou il ferait de 10 000 €.', r: ['Ta tirelire te remercie.', 'Les souvenirs, ça ne se perd pas.'] },
    promotion: { o: 'Demande-lui le projet qui l’occupe en ce moment.', r: ['Fonce, je garde la maison.', 'Tes soirées sont bien gardées.'] },
    vacances: { o: 'Demande-lui ses meilleures vacances.', r: ['L’aventure, la vraie.', 'Le planning est magnifique.'] },
    appartement: { o: 'Demande-lui à quoi ressemble son chez-soi rêvé.', r: ['Un nid, j’adore les nids.', 'Léger comme une plume.'] },
    vendredi: { o: 'Demande-lui son meilleur vendredi soir.', r: ['La nuit est jeune !', 'Bonne nuit, à demain.'] },
    cinq_ans: { o: 'Demande-lui où elle ou il se voit dans cinq ans.', r: ['Près des tiens, c’est précieux.', 'Envoie-moi une carte postale.'] },
    projet: { o: 'Demande-lui le projet qui lui tient à cœur.', r: ['Quel feu sacré !', 'Profiter d’abord, sage décision.'] },
  },
  q: {
    energie_batterie: {
      t: 'Après une semaine chargée, tu recharges tes batteries…',
      o: 'Demande-lui comment elle ou il recharge ses batteries.',
      a: [
        ['Au calme, chez moi', 'Plaid validé. Je fais le thé.'],
        ['Avec plein de monde autour', 'Je préviens la bande !'],
      ],
      m: 'Un peu des deux : le bon dosage.',
    },
    energie_samedi: {
      t: 'Samedi matin, aucun plan.',
      o: 'Demande-lui à quoi ressemble son samedi matin idéal.',
      a: [
        ['Café lent à la fenêtre, rien d’autre', 'Le luxe absolu : ne rien faire.'],
        ['Je sors, je verrai bien où', 'Je prends mon écharpe et je te suis.'],
        ['Un brunch avec des potes', 'Garde-moi une viennoiserie.'],
      ],
    },
    energie_soiree: {
      t: 'Une soirée où tu ne connais que la personne qui invite.',
      o: 'Demande-lui sa pire ou sa meilleure soirée chez des inconnus.',
      a: [
        ['J’y vais, j’adore rencontrer du monde', 'Tu vas revenir avec dix nouveaux contacts.'],
        ['J’y vais si je peux venir avec quelqu’un', 'En binôme, c’est malin.'],
        ['Je passe mon tour, ce soir c’est canapé', 'Le canapé te remercie.'],
      ],
    },
    energie_pluie: {
      t: 'Dimanche, il pleut des cordes. Tu…',
      o: 'Demande-lui ce qu’elle ou il fait quand il pleut tout le week-end.',
      a: [
        ['Avances sur un projet perso', 'Ça bosse dur, ici.'],
        ['Te perds dans un livre ou une série', 'Encore un épisode, je ne dirai rien.'],
        ['Cuisines un truc compliqué, pour le plaisir', 'Je goûte quand ?'],
      ],
    },
    energie_semaine: {
      t: 'Ta semaine idéale ressemble plutôt à…',
      o: 'Demande-lui à quoi ressemble sa semaine idéale.',
      a: [
        ['Tranquille, du temps pour moi', 'La sieste est un art.'],
        ['Remplie de choses qui avancent', 'Moteur allumé !'],
      ],
      m: 'Ni course ni sieste : l’équilibre.',
    },
    energie_vacances: {
      t: 'En vacances, ta journée parfaite…',
      o: 'Demande-lui sa journée de vacances parfaite.',
      a: [
        ['Transat, livre, rien d’autre', 'Je garde ta serviette.'],
        ['Rando à l’aube, visite l’après-midi', 'J’ai déjà mal aux pattes.'],
        ['Plage le jour, fête la nuit', 'Tu dors quand ?'],
      ],
    },
    energie_ce_soir: {
      t: '19 h, un message : « Ce soir, ça te dit ? »',
      o: 'Demande-lui la dernière fois qu’elle ou il a dit oui à un plan de dernière minute.',
      a: [
        ['Oui ! On se retrouve où ?', 'Déjà dans tes chaussures.'],
        ['Ça dépend de quoi', 'Prudence de chat.'],
        ['Pas ce soir, je suis en mode pyjama', 'Le pyjama a gagné.'],
      ],
    },
    energie_semi: {
      t: 'On te propose de courir un semi-marathon dans six mois.',
      o: 'Demande-lui le défi sportif qui la ou le tente.',
      a: [
        ['Je m’inscris, ça me motive', 'Je fais la pancarte.'],
        ['Peut-être, si on y va à plusieurs', 'En bande, tout passe mieux.'],
        ['Je viendrai t’encourager avec un croissant', 'Le meilleur poste, honnêtement.'],
      ],
    },
    energie_cafe: {
      t: 'Ton café préféré, c’est…',
      o: 'Demande-lui son café ou son bar préféré du coin.',
      a: [
        ['Une petite salle calme, avec des livres', 'Chut, je lis par-dessus ton épaule.'],
        ['Un endroit vivant, de la musique, du passage', 'Ça bouge, j’aime bien.'],
      ],
    },
    energie_cinq_ans: {
      t: 'Dans cinq ans, au travail ou dans tes projets, tu veux…',
      o: 'Demande-lui où elle ou il en sera dans cinq ans, côté projets.',
      a: [
        ['Que ça roule tranquille', 'Tranquille, mais sûr.'],
        ['Avoir franchi un cap', 'Je vois déjà le sommet.'],
      ],
      m: 'Avancer sans s’épuiser : c’est un plan.',
    },
    habitudes_courses: {
      t: 'Les courses de la semaine…',
      o: 'Demande-lui ce qu’elle ou il ne peut pas s’empêcher d’acheter.',
      a: [
        ['Une liste par rayon, rien n’est oublié', 'Tu peux faire la mienne ?'],
        ['J’improvise dans les allées', 'Et tu repars avec trois sortes de fromage.'],
        ['Livrées, prévues depuis dimanche', 'Efficace. Je note.'],
      ],
    },
    habitudes_valise: {
      t: 'Ta valise, tu la fais…',
      o: 'Demande-lui ce qu’elle ou il oublie toujours en voyage.',
      a: [
        ['Trois jours avant, avec une liste', 'Ta liste a sûrement une liste.'],
        ['La veille au soir', 'Le grand classique.'],
        ['Une heure avant de partir', 'Tu as pensé aux chaussettes ?'],
      ],
    },
    habitudes_budget: {
      t: 'Ton argent, tu le gères…',
      o: 'Demande-lui sa meilleure folie, ou sa meilleure économie.',
      a: [
        ['Au feeling', 'Vivre l’instant, c’est aussi un budget.'],
        ['Au centime près', 'Tableur ouvert, respect.'],
      ],
      m: 'Un œil dessus, sans s’en faire.',
    },
    habitudes_dimanche_soir: {
      t: 'Dimanche soir, tu…',
      o: 'Demande-lui son rituel du dimanche soir.',
      a: [
        ['Prépares ta semaine', 'Lundi n’a qu’à bien se tenir.'],
        ['Profites jusqu’à la dernière minute', 'Le lundi attendra.'],
      ],
    },
    habitudes_rdv: {
      t: 'Un rendez-vous à 20 h. Tu arrives…',
      o: 'Demande-lui sa meilleure excuse de retard.',
      a: [
        ['À 19 h 50, toujours un peu en avance', 'Personne n’arrive avant toi.'],
        ['À 20 h pile', 'Précision suisse.'],
        ['À 20 h 15, avec une bonne excuse', 'J’adore tes excuses.'],
      ],
    },
    habitudes_diner: {
      t: 'Ce soir, on mange…',
      o: 'Demande-lui le plat qu’elle ou il réussit le mieux.',
      a: [
        ['À la maison, je cuisine', 'Ça sent bon jusqu’ici.'],
        ['Dehors, j’ai envie de voir du monde', 'Je réserve une table pour quatre pattes.'],
        ['À emporter, sur le canapé', 'Le meilleur des deux mondes.'],
      ],
    },
    habitudes_week_end: {
      t: 'Ton week-end idéal est…',
      o: 'Demande-lui ce qu’elle ou il a prévu ce week-end. Ou pas.',
      a: [
        ['Totalement libre', 'Le hasard fait bien les choses.'],
        ['Calé à l’avance', 'Le planning est beau.'],
      ],
      m: 'Un plan, mais pas trop.',
    },
    habitudes_bureau: {
      t: 'Ton bureau, en ce moment…',
      o: 'Demande-lui l’objet le plus improbable sur son bureau.',
      a: [
        ['Chaque chose à sa place', 'Je n’ose rien toucher.'],
        ['Un joyeux désordre, mais je sais où tout est', 'Un système, un vrai.'],
      ],
    },
    habitudes_matin: {
      t: 'Le matin, ton premier réflexe…',
      o: 'Demande-lui à quoi ressemble son matin parfait.',
      a: [
        ['Penser à tout ce que je vais faire', 'Liste mentale lancée.'],
        ['Un café, en silence, sans rien prévoir', 'Le café d’abord, le monde ensuite.'],
      ],
    },
    habitudes_bouger: {
      t: 'Pour bouger, tu préfères…',
      o: 'Demande-lui le sport qu’elle ou il aimerait essayer.',
      a: [
        ['Yoga ou marche, tranquille', 'Respire. Je respire avec toi.'],
        ['Un sport en équipe', 'Je fais la mascotte.'],
        ['Bouger ? Je marche jusqu’au frigo', 'C’est du cardio, si on court.'],
      ],
    },
    valeurs_racines: {
      t: 'L’endroit où tu as grandi, pour toi c’est…',
      o: 'Demande-lui ce qui lui manque le plus de l’endroit où elle ou il a grandi.',
      a: [
        ['Mon port d’attache, j’y reviens souvent', 'Rien ne vaut la maison.'],
        ['Un bon souvenir, ma vie est ailleurs', 'Toujours un pas plus loin.'],
      ],
    },
    valeurs_temps_argent: {
      t: 'Plutôt plus de temps libre ou plus d’argent ?',
      o: 'Demande-lui ce qu’elle ou il ferait d’un jour de congé en plus par semaine.',
      a: [
        ['Plus de temps', 'Le temps, la vraie richesse.'],
        ['Plus d’argent', 'Tu m’offres un goûter ?'],
      ],
      m: 'Un peu des deux, c’est raisonnable.',
    },
    valeurs_repas: {
      t: 'Les grands repas de famille…',
      o: 'Demande-lui le plat de son enfance qu’elle ou il adore encore.',
      a: [
        ['Sacrés, je ne les rate jamais', 'Je ramène le dessert.'],
        ['J’aime bien, mais à ma façon', 'Les traditions, version toi.'],
        ['Je préfère les fêtes entre amis', 'La famille qu’on choisit.'],
      ],
    },
    valeurs_demenagement: {
      t: 'Un ami déménage samedi, rendez-vous à 8 h.',
      o: 'Demande-lui son pire ou son meilleur souvenir de déménagement.',
      a: [
        ['J’apporte les cartons et les croissants', 'Un cœur en or, certifié.'],
        ['Je passe le soir pour la pizza', 'La pizza, la meilleure étape.'],
        ['Je prête ma voiture, pas mon dos', 'Ton dos te dit merci.'],
      ],
    },
    valeurs_reussite: {
      t: 'Pour toi, une vie réussie, c’est d’abord…',
      o: 'Demande-lui ce qui la ou le rend fier en ce moment.',
      a: [
        ['Avoir construit quelque chose', 'Je te vois bien avec une statue.'],
        ['Du temps pour ce qui me plaît', 'Sage. Très sage.'],
        ['Des gens que j’aime autour de moi', 'Le plus beau des trésors.'],
      ],
    },
    valeurs_etranger: {
      t: 'Vivre un an à l’étranger, là, maintenant ?',
      o: 'Demande-lui la ville où elle ou il vivrait un an.',
      a: [
        ['Non merci, je suis bien ici', 'Ici, c’est chez toi.'],
        ['Je pars demain', 'Je me glisse dans ta valise.'],
      ],
      m: 'Pourquoi pas… un jour.',
    },
    valeurs_chez_toi: {
      t: 'Ton chez-toi idéal, c’est…',
      o: 'Demande-lui la pièce préférée de son chez-soi.',
      a: [
        ['Un nid où les gens passent tout le temps', 'Je réserve le canapé.'],
        ['Un endroit à moi, calme, à mes règles', 'Ton royaume, tes règles.'],
        ['Pas d’endroit fixe : là où je suis', 'Nomade dans l’âme.'],
      ],
    },
    valeurs_occasion: {
      t: 'Une super occasion, mais il faut décider en une heure.',
      o: 'Demande-lui la meilleure décision prise sur un coup de tête.',
      a: [
        ['Je fonce', 'Ça décoiffe !'],
        ['Je demande un délai pour réfléchir', 'Réfléchir, c’est déjà agir.'],
      ],
    },
    valeurs_dix_ans: {
      t: 'Dans dix ans, tu te vois plutôt…',
      o: 'Demande-lui à quoi ressemble une belle journée, dans dix ans.',
      a: [
        ['Avec une grande tribu autour de moi', 'Il faudra une grande table.'],
        ['Libre comme l’air, sans attaches', 'Le vent dans les poils.'],
        ['Aucune idée, et c’est très bien', 'L’avenir est une surprise.'],
      ],
    },
    valeurs_boulot: {
      t: 'Ton travail idéal est plutôt…',
      o: 'Demande-lui le métier qu’elle ou il aurait rêvé de faire enfant.',
      a: [
        ['Stable, je sais où je vais', 'Solide comme un roc.'],
        ['Changeant, plein de surprises', 'Les montagnes russes, ça te va bien.'],
      ],
      m: 'Du solide, avec un peu de piment.',
    },
    autres_silence: {
      t: 'Quelqu’un que tu apprécies ne répond pas depuis deux jours.',
      o: 'Demande-lui le meilleur message qu’on lui ait envoyé.',
      a: [
        ['Pas grave, chacun son rythme', 'Zen absolu.'],
        ['Je relance avec un petit mot drôle', 'Le mème parfait existe.'],
        ['Je me demande si j’ai dit un truc', 'Sûrement pas. Respire.'],
      ],
    },
    autres_bande: {
      t: 'Tes amis, c’est plutôt…',
      o: 'Demande-lui comment elle ou il a rencontré ses meilleurs amis.',
      a: [
        ['Une grande bande, toujours du monde', 'Je veux être dans le groupe.'],
        ['Deux ou trois, mais pour la vie', 'Peu, mais du solide.'],
      ],
    },
    autres_improviste: {
      t: 'Des amis débarquent chez toi sans prévenir.',
      o: 'Demande-lui ce qu’elle ou il sert quand des amis passent à l’improviste.',
      a: [
        ['Génial, je sors des verres', 'La porte est toujours ouverte !'],
        ['Avec plaisir, mais prévenez la prochaine fois', 'Un message, ce n’est pas compliqué.'],
      ],
    },
    autres_anniversaire: {
      t: 'Pour ton anniversaire, tu rêves de…',
      o: 'Demande-lui son plus bel anniversaire.',
      a: [
        ['Une grosse fête, tout le monde est invité', 'J’apporte les confettis.'],
        ['Un dîner avec quelques proches', 'Petit comité, grand moment.'],
        ['Qu’on l’oublie un peu, honnêtement', 'Motus. Je n’ai rien vu.'],
      ],
    },
    autres_conseil: {
      t: 'Un pote te demande conseil pour un gros choix.',
      o: 'Demande-lui le meilleur conseil qu’on lui ait donné.',
      a: [
        ['On fait la liste des pour et des contre', 'La liste, arme absolue.'],
        ['Écoute ton instinct', 'Le ventre a toujours raison.'],
        ['On en parle autour d’une pizza', 'La pizza aide à réfléchir, c’est prouvé.'],
      ],
    },
    autres_rencontrer: {
      t: 'Rencontrer de nouvelles personnes, pour toi c’est…',
      o: 'Demande-lui la rencontre la plus inattendue de sa vie.',
      a: [
        ['Intimidant', 'Pas d’inquiétude, je fais les présentations.'],
        ['Grisant', 'Tu vas adorer ce qu’on prépare.'],
      ],
      m: 'Ça dépend des jours, c’est normal.',
    },
    autres_proches: {
      t: 'Avec tes proches, tu as besoin…',
      o: 'Demande-lui comment elle ou il garde le contact avec ses proches.',
      a: [
        ['De beaucoup d’espace', 'De l’air, de l’air !'],
        ['De beaucoup de présence', 'Un câlin de minimoa, ça compte ?'],
      ],
      m: 'Proches, mais pas collés.',
    },
    autres_vacances: {
      t: 'Des vacances entre amis : qui organise ?',
      o: 'Demande-lui ses meilleures vacances entre amis.',
      a: [
        ['Moi, avec un tableur partagé', 'Tu as un onglet « imprévus » ?'],
        ['Je donne un coup de main', 'Le bras droit idéal.'],
        ['Les autres, je suis le mouvement', 'Tu fournis la bonne humeur.'],
      ],
    },
    autres_voisins: {
      t: 'Tes voisins…',
      o: 'Demande-lui l’adresse secrète de son quartier.',
      a: [
        ['Je connais leur prénom et celui de leur chat', 'Le quartier, c’est la famille.'],
        ['Un bonjour poli dans l’escalier', 'Courtois et discret.'],
        ['Il y a des voisins ?', 'Un mystère à résoudre.'],
      ],
    },
    autres_annule: {
      t: 'Un plan tombe à l’eau à la dernière minute.',
      o: 'Demande-lui ce qu’elle ou il fait d’une soirée libre imprévue.',
      a: [
        ['Chouette, une soirée libre', 'Le meilleur des cadeaux.'],
        ['Ça m’agace, j’avais tout calé', 'Ton agenda pleure un peu.'],
      ],
    },
    gouts_voyage: {
      t: 'Ton voyage de rêve…',
      o: 'Demande-lui le voyage qu’elle ou il rêve de faire.',
      a: [
        ['Un pays dont je ne parle pas la langue', 'Je révise mon dictionnaire.'],
        ['Une maison à la campagne, avec des amis', 'Le bonheur à deux heures de route.'],
        ['Une grande ville, musées et terrasses', 'Je prends le plan du métro.'],
      ],
    },
    gouts_resto: {
      t: 'Au restaurant, tu commandes…',
      o: 'Demande-lui le plat le plus étrange qu’elle ou il ait goûté.',
      a: [
        ['Le plat que je ne connais pas', 'Palais aventurier !'],
        ['Mon plat préféré, toujours le même', 'Pourquoi changer ce qui marche ?'],
      ],
    },
    gouts_musique: {
      t: 'En musique, ce soir, plutôt…',
      o: 'Demande-lui la chanson qu’elle ou il écoute en boucle.',
      a: [
        ['Un album en entier, au casque', 'Voyage sonore, ne pas déranger.'],
        ['Un concert, au premier rang', 'Je hurle les paroles avec toi.'],
        ['Un petit bar avec un groupe du coin', 'Les meilleures découvertes.'],
      ],
    },
    gouts_nature_ville: {
      t: 'Pour vivre, tu préfères…',
      o: 'Demande-lui son coin de nature, ou de ville, préféré.',
      a: [
        ['La nature, le silence', 'Les oiseaux te disent bonjour.'],
        ['La ville, l’énergie', 'Les néons, c’est joli aussi.'],
      ],
      m: 'Une ville avec un grand parc ?',
    },
    gouts_nouveau: {
      t: 'Essayer des choses nouvelles…',
      o: 'Demande-lui la dernière chose qu’elle ou il a essayée pour la première fois.',
      a: [
        ['Je préfère ce que je connais', 'Les valeurs sûres, c’est rassurant.'],
        ['J’adore, plus c’est bizarre mieux c’est', 'Je t’ai trouvé un cours de trapèze.'],
      ],
      m: 'De temps en temps, oui.',
    },
    gouts_film: {
      t: 'Un film, ce soir ?',
      o: 'Demande-lui le film qu’elle ou il pourrait revoir cent fois.',
      a: [
        ['Un classique déjà vu dix fois', 'Tu connais les répliques par cœur.'],
        ['Une pépite sous-titrée dont personne ne parle', 'Pointu ! J’apporte le pop-corn.'],
        ['Le gros film du moment', 'Sensations garanties.'],
      ],
    },
    gouts_fin_week_end: {
      t: 'Un week-end parfait se termine…',
      o: 'Demande-lui son plus beau dimanche soir.',
      a: [
        ['Dans un coin que je ne connaissais pas', 'L’exploration, ta passion.'],
        ['Chez moi, avec un bon plat', 'Rien ne vaut ses chaussons.'],
      ],
    },
    gouts_temps_libre: {
      t: 'Ton temps libre ressemble plutôt à…',
      o: 'Demande-lui ce qu’elle ou il apprend en ce moment.',
      a: [
        ['Des loisirs pour le plaisir, sans objectif', 'Le plaisir, ça suffit.'],
        ['Des choses où je progresse (langue, instrument)', 'Bientôt incollable.'],
      ],
    },
    gouts_saison: {
      t: 'Ta saison préférée…',
      o: 'Demande-lui son meilleur souvenir de sa saison préférée.',
      a: [
        ['L’hiver : plaid, soupe, bougies', 'Le plaid t’appartient.'],
        ['L’été : terrasses jusqu’à minuit', 'Les longues soirées, oui !'],
        ['L’automne : balades et feuilles mortes', 'Ça croustille sous les pattes.'],
        ['Le printemps : tout redémarre', 'Le grand réveil.'],
      ],
    },
    gouts_surprise: {
      t: 'On t’offre un week-end surprise : tu ne sais pas où tu vas.',
      o: 'Demande-lui la plus belle surprise qu’on lui ait faite.',
      a: [
        ['Le rêve', 'Valise prête en cinq minutes.'],
        ['J’aimerais au moins savoir quoi emporter', 'Prévoir un pull, c’est de la sagesse.'],
      ],
    },
  },
};
