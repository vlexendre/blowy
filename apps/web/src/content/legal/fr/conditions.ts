import type { LegalPage } from '../types';

export const conditions: LegalPage = {
  title: "Conditions générales d'utilisation — Minimoa",
  heading: "Conditions d'utilisation",
  description:
    "Le contrat entre toi et Minimoa : 18 ans et plus, ton compte, ce qui est permis, tes contenus, la modération, la fin du contrat, le droit applicable.",
  intro: 'Le contrat entre toi et Minimoa. En créant un compte, tu l’acceptes. Prends cinq minutes pour le lire.',
  summary: {
    title: 'En bref',
    items: [
      'Minimoa est réservé aux **adultes de 18 ans et plus**. Un compte par personne, pour une vraie personne.',
      'Ton **minimoa** porte ta vision de la vie et te présente des gens compatibles pour créer des liens. Ce qu’ils deviennent vous regarde. Ses messages sont automatiques : ce n’est pas une personne.',
      'Respecte les autres et les [règles de la communauté](@regles). Pas de harcèlement, pas de contenu sexuel, rien qui implique un mineur.',
      'Tes messages et tes photos restent à toi. Tu nous donnes seulement le droit de les traiter pour faire marcher Minimoa.',
      'Minimoa est gratuit. **Minimoa+** est un abonnement facultatif, payé via l’App Store, sur iPhone ([conditions de Minimoa+](@abonnement)).',
      'Tu peux partir quand tu veux : [supprimer ton compte](@supprimer-mon-compte) se fait dans l’app.',
      'Droit français. En cas de souci, écris-nous d’abord ; tu peux aussi saisir un médiateur, gratuitement.',
    ],
  },
  toc: true,
  body: [
    { h2: '1. Qui sommes-nous', id: 'editeur' },
    {
      p: "L'application Minimoa et le site minimoa.app sont édités par **{{publisher.name}}** (« Minimoa », « nous »). Ses coordonnées complètes sont dans les [mentions légales](@mentions-legales). Pour nous écrire : {{email.support}}.",
    },
    {
      p: 'Ces conditions s’appliquent à toute utilisation de l’app. Les [règles de la communauté](@regles), les [conditions de l’abonnement Minimoa+](@abonnement) et la [politique de confidentialité](@confidentialite) en font partie.',
    },

    { h2: "2. Ce qu'est Minimoa", id: 'service' },
    {
      p: 'Sur Minimoa, chacun élève un **minimoa**, un petit personnage qui porte sa vision de la vie : ce que la personne projette pour sa vie (foyer, lieu de vie, place du travail, rythme du quotidien, long terme). Le minimoa présente sa personne à des gens dont la vision est compatible, pour faire connaissance, et veille sur chaque lien.',
    },
    {
      ul: [
        '**La vision** se construit avec un test à l’inscription, une question par jour, tes habitudes et ta façon de t’occuper de ton minimoa. Elle est indicative et s’affine avec le temps.',
        '**Les rencontres** : ton minimoa ne te présente que des personnes dont la compatibilité dépasse un seuil. Rien ne se passe sans ton accord : tu salues, l’autre accepte, le lien se crée. Le fonctionnement est expliqué dans la [politique de confidentialité](@confidentialite#compatibilite).',
        '**Les liens** : un chat, une série qui grandit chaque jour où vous vous écrivez tous les deux, des souvenirs, et des vies qui baissent quand le lien reste silencieux.',
        '**Ton minimoa** a des jauges (sociabilité, faim, énergie, humeur), des habitudes à tenir, une série, des objets. Il ne meurt jamais.',
        '**La carte** montre les minimoas compatibles autour de toi (ou autour de la ville que tu as choisie, si tu n’actives pas la localisation), à une position volontairement imprécise.',
      ],
    },
    {
      p: '**Les minimoas ne sont pas des personnes.** Leurs messages, leurs remarques et le bilan de la semaine sont produits automatiquement, à partir de modèles de phrases ou d’une intelligence artificielle. Ils peuvent se tromper. Ce ne sont ni des conseils professionnels, ni des conseils médicaux, ni une garantie sur une personne.',
    },
    {
      p: 'Une compatibilité, même élevée, ne dit rien de l’honnêteté ou des intentions de quelqu’un. Minimoa ne vérifie pas l’identité des personnes et ne mène aucune enquête sur elles.',
    },

    { h2: '3. Qui peut utiliser Minimoa', id: 'age' },
    {
      ul: [
        '**Tu dois avoir 18 ans ou plus.** On te demande ta date de naissance avant la connexion. En dessous de 18 ans, l’inscription s’arrête et rien n’est créé. Mentir sur ton âge entraîne la fermeture du compte.',
        '**Un seul compte par personne**, pour une vraie personne : toi. Pas de compte partagé, pas de compte au nom de quelqu’un d’autre.',
        'Tu ne dois pas avoir été exclu de Minimoa, ni être interdit par la loi d’utiliser ce type de service.',
      ],
    },

    { h2: '4. Ton compte', id: 'compte' },
    {
      p: 'Tu te connectes avec **Apple** (sur iPhone) ou **Google** (sur Android). Ces services nous confirment ton identité ; on ne connaît pas ton mot de passe. Garde l’accès à ce compte Apple ou Google pour toi : ce qui se passe sur ton compte Minimoa est sous ta responsabilité. Si tu penses que quelqu’un y a accédé, écris-nous tout de suite.',
    },
    {
      p: 'Les informations que tu donnes (prénom, date de naissance, sexe) doivent être vraies et à jour. Tu peux les modifier dans l’app.',
    },

    { h2: '5. Ce qui est permis, et ce qui ne l’est pas', id: 'usage' },
    { p: 'Tu utilises Minimoa dans le respect de la loi, des autres et des [règles de la communauté](@regles). Il est notamment interdit :' },
    {
      ul: [
        'de harceler, menacer, insulter, humilier, faire du chantage, ou d’inciter à la haine ou à la violence ;',
        'd’envoyer de la nudité ou du contenu sexuel, y compris en photo de profil ou en photo de preuve ;',
        'd’impliquer une personne mineure de quelque manière que ce soit ;',
        'de publier un contenu illégal, violent ou choquant ;',
        'de te faire passer pour quelqu’un d’autre, de créer un faux profil ou plusieurs comptes ;',
        'd’arnaquer, de demander de l’argent, de faire de la publicité ou du spam ;',
        'de proposer ou de demander des services sexuels rémunérés ;',
        'de diffuser des informations privées ou des photos d’une autre personne sans son accord ;',
        'de tromper les vérifications (fausse photo de preuve, position falsifiée) ou de contourner le filtre automatique des contenus ;',
        'd’automatiser l’usage du service (robots, extraction de données), de contourner ses limites, ses blocages ou ses protections, ou d’en perturber le fonctionnement.',
      ],
    },

    { h2: '6. Tes contenus', id: 'contenus' },
    {
      p: 'Tes messages, tes photos et tes réponses restent à toi. Pour faire fonctionner Minimoa, tu nous accordes une **licence gratuite, non exclusive, pour le monde entier**, limitée à ce qui est nécessaire pour : les stocker, les transmettre aux personnes à qui tu les destines, les afficher dans l’app, les traiter techniquement (redimensionner une photo, par exemple) les filtrer automatiquement et, quand c’est prévu, les faire analyser par une IA (photos de preuve, si tu l’as accepté ; messages, si vous l’avez activé tous les deux ; photo de profil et messages qui laissent un doute, pour la sécurité ; voir la [politique de confidentialité](@confidentialite#ia)). Cette licence dure tant que le contenu est en ligne, et prend fin quand il est supprimé, sauf pour ce qu’on doit garder selon la [politique de confidentialité](@confidentialite#durees).',
    },
    { p: 'On n’utilise pas tes contenus pour de la publicité et on ne les vend pas.' },
    { p: 'Tu garantis que tu as le droit de publier ce que tu publies, et qu’il ne porte pas atteinte aux droits d’autrui (image, vie privée, droit d’auteur).' },

    { h2: '7. Signalement, modération et sanctions', id: 'moderation' },
    {
      p: 'Tu peux signaler ou bloquer une personne à tout moment depuis l’app ([comment faire](@securite)). Chaque signalement prévient l’équipe de modération, qui l’examine avec un objectif de réponse sous 24 h. Pour cela, un modérateur de Minimoa peut lire le message signalé et son contexte immédiat (les messages qui l’entourent). En dehors de ce cas, personne chez Minimoa ne lit tes conversations ; une IA ne les lit que si vous l’avez activé tous les deux.',
    },
    {
      p: 'Les prénoms, les noms de minimoa, les messages et les photos de profil passent par un **filtre automatique** avant d’être publiés : un contenu qui enfreint nettement les règles est refusé, et l’app te dit pourquoi ; un message limite est envoyé mais signalé à la modération. Dans deux cas seulement, le compte est **suspendu automatiquement** 72 h au plus, le temps qu’un modérateur regarde : vocabulaire pédocriminel explicite dans un message, ou compte signalé comme mineur par deux personnes différentes. Le modérateur lève ou confirme la suspension.',
    },
    { p: 'Selon la gravité, on peut :' },
    {
      ul: [
        'retirer un contenu ;',
        'envoyer un avertissement ;',
        'limiter certaines fonctions (rencontres, carte, photos) ;',
        'suspendre le compte, pour une durée limitée ;',
        'fermer le compte définitivement, pour un manquement grave ou répété.',
      ],
    },
    {
      p: 'Ce qui est grave et illégal (contenu impliquant un mineur, menace sérieuse, par exemple) est signalé aux autorités. Quand on prend une décision qui te concerne, on t’en donne les raisons, sauf si la loi l’interdit ou si cela mettrait quelqu’un en danger. Tu peux la contester, qu’elle soit automatique ou non, en écrivant à {{email.support}} dans les six mois ; une personne réexamine la décision.',
    },

    { h2: "8. L'intelligence artificielle dans Minimoa", id: 'ia' },
    {
      ul: [
        '**Lecture des messages** : seulement si vous l’activez tous les deux, pour que vos minimoas puissent réagir. Vous pouvez la couper quand vous voulez.',
        '**Photos de preuve** : seulement si tu l’acceptes, une IA dit si la photo correspond à l’habitude ; en cas de doute, on te fait confiance. Sans accord, tu valides sur parole, sans photo.',
        '**Vérifications de sécurité** : chaque photo de profil, et un message qui laisse un doute dans un chat où vous avez accepté la lecture tous les deux.',
        '**Bilan de la semaine** : reformulé par une IA, sans aucun prénom ni nom. Les autres remarques des minimoas viennent de modèles de phrases.',
      ],
    },
    {
      p: 'Cette IA est celle de {{sub.ai.provider}} ({{sub.ai.location}}), notre prestataire. Ces fonctions servent le jeu, la conversation et la sécurité. Aucune ne prend de décision qui produit des effets juridiques à ton égard. Le détail, et ce que reçoit le prestataire, est dans la [politique de confidentialité](@confidentialite#ia) ; tes accords se voient et se retirent dans l’app, **Moi → L’IA et toi**.',
    },

    { h2: '9. Gratuit, et Minimoa+ en option', id: 'blowy-plus' },
    {
      p: 'Minimoa est gratuit et sans publicité. **Minimoa+** est un abonnement facultatif qui ouvre des fonctions en plus. Il est vendu et facturé par Apple, sur iPhone (un abonnement pris sur iPhone suit ton compte sur tes autres appareils). Ses prix, ce qu’il contient, son renouvellement et la façon de l’annuler sont dans les [conditions de l’abonnement Minimoa+](@abonnement).',
    },
    {
      p: 'Si tu as téléchargé Minimoa sur l’App Store, le [contrat de licence standard d’Apple pour les applications](https://www.apple.com/legal/internet-services/itunes/dev/stdeula/) (« Licensed Application End User License Agreement ») s’applique aussi à l’app.',
    },
    {
      p: 'Les objets, jokers, séries, vies et autres éléments du jeu n’ont aucune valeur monétaire. Ils ne s’échangent pas, ne se revendent pas et ne se remboursent pas, sauf ce que la loi impose.',
    },

    { h2: '10. Fin du contrat', id: 'fin' },
    {
      ul: [
        '**De ton côté**, tu peux partir quand tu veux : dans l’app, **Moi → Réglages → Supprimer mon compte** ([ce qui est effacé](@supprimer-mon-compte)). Supprimer ton compte n’annule pas un abonnement Minimoa+ : annule-le aussi dans les réglages de ton iPhone.',
        '**De notre côté**, on peut suspendre ou fermer ton compte si tu ne respectes pas ces conditions, si la loi nous y oblige, ou si la sécurité de quelqu’un est en jeu. Sauf urgence ou manquement grave, on te prévient avant et on t’explique pourquoi.',
        'Si on arrête le service, on te prévient au moins 30 jours avant.',
      ],
    },

    { h2: '11. Disponibilité et responsabilité', id: 'responsabilite' },
    {
      p: 'On fait de notre mieux pour que Minimoa marche bien, tout le temps. On ne peut pas garantir l’absence de panne, de bug ou d’interruption, notamment pendant une mise à jour. On peut faire évoluer les fonctions de l’app.',
    },
    {
      p: 'Chacun est responsable de ce qu’il publie et de la façon dont il se comporte. Les rencontres en vrai se font sous ta responsabilité : lis nos [conseils de sécurité](@securite#rencontre). Nous ne sommes pas responsables du comportement d’un autre utilisateur, ni des dommages indirects, dans les limites permises par la loi.',
    },
    {
      p: 'Rien dans ces conditions ne limite notre responsabilité en cas de faute lourde ou intentionnelle, de dommage corporel, ni les droits que la loi te garantit en tant que consommateur, notamment la garantie légale de conformité des contenus et services numériques.',
    },

    { h2: '12. Propriété intellectuelle', id: 'propriete' },
    {
      p: 'La marque Minimoa, les minimoas, les illustrations, les textes et le logiciel appartiennent à {{publisher.name}} ou à ses partenaires. On te donne un droit personnel, non exclusif et non transférable d’utiliser l’app pour ton usage privé, tant que ton compte existe. Tu peux partager des captures d’écran de tes propres échanges, sans exposer les autres personnes.',
    },

    { h2: '13. Changements', id: 'changements' },
    {
      p: 'Ces conditions peuvent évoluer, par exemple quand une fonction arrive. Pour un changement important, on te prévient dans l’app au moins 30 jours avant qu’il s’applique, sauf si la loi ou la sécurité impose d’aller plus vite. Si tu n’es pas d’accord, tu peux supprimer ton compte avant cette date.',
    },

    { h2: '14. Droit applicable, litiges et médiation', id: 'litiges' },
    { p: 'Ces conditions sont régies par le **droit français**. Si tu vis dans un autre pays de l’Union européenne, tu gardes la protection des règles impératives de ton pays.' },
    { p: 'En cas de problème, écris-nous d’abord à {{email.support}} : on cherchera une solution amiable.' },
    {
      requires: ['mediator.name'],
      p: 'Si ta réclamation écrite n’aboutit pas, tu peux saisir gratuitement le médiateur de la consommation dont nous relevons, dans l’année qui suit ta réclamation :',
    },
    { ul: ['**Médiateur :** {{mediator.name}}', '**Adresse :** {{mediator.address}}', '**Site :** {{mediator.website}}'] },
    {
      p: 'À défaut d’accord, le litige est porté devant les tribunaux français compétents. Si tu es consommateur, tu peux aussi saisir le tribunal du lieu où tu vivais au moment de l’inscription ou de l’événement.',
    },
  ],
};
