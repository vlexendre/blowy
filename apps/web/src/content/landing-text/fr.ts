/**
 * Textes de la landing, en français (la langue source : elle fixe la forme des autres langues).
 * Tutoiement, majuscule en début de phrase, ton sec plutôt que mignon. Le personnage est un minimoa.
 * `{x}` : rempli au rendu. Prix : des fonctions qui reçoivent le montant déjà mis en forme (jamais écrit ici).
 */
import type { TitleLine } from '../landing';

export const fr = {
  meta: {
    title: 'Minimoa — Ton entremetteur social, près de chez toi',
    description:
      'Ton minimoa apprend à te connaître, puis te présente des gens près de chez toi qui te ressemblent. Des potes, et pourquoi pas plus. Gratuit, zéro swipe.',
    ogAlt: 'Nino croque une pomme, puis fait un check à Suzie, le minimoa de Léa, sous le titre « Prends soin de ton minimoa. Il te présente des potes. »',
  },
  dots: {
    top: 'Accueil',
    comment: 'Comment ça marche',
    pet: 'Il est vivant',
    garde: 'Garde-robe',
    caractere: 'Caractère',
    habitudes: 'Habitudes',
    groupes: 'Groupes',
    chats: 'Dans tes chats',
    vies: '7 vies',
    rencontres: 'Rencontres',
    sorties: 'Sorties',
    mots: '3 mots',
    ecrans: 'L’app en images',
    plus: 'Minimoa+',
    faq: 'Questions',
    go: 'Télécharger',
  },
  nav: {
    logoLabel: 'Minimoa, retour en haut',
    sectionsLabel: 'Sections',
    dotsLabel: 'Aller à la section',
    links: { pet: 'Son minimoa', habitudes: 'Habitudes', groupes: 'Groupes', rencontres: 'Rencontres', plus: 'Minimoa+' },
  },
  hero: {
    title: [{ text: 'TON' }, { text: 'ENTREMETTEUR', dim: true }, { text: 'SOCIAL.', dim: true }] as TitleLine[],
    lead: 'Ton minimoa apprend à te connaître, et toi avec. Puis il te présente des gens près de chez toi qui te ressemblent. Des potes, et pourquoi pas plus.',
    primary: 'Quel minimoa es-tu ?',
    secondary: 'Ouvre ton quartier',
    b1: { who: 'Léa', text: 'On marche demain matin ?' },
    tag: 'Gratuit · zéro swipe · 18 ans et plus',
    loop: { label: 'Minimoa en deux temps', care: 'Tu prends soin de lui', meet: 'Il te présente du monde' },
    careAlt: 'Nino, un minimoa vert à mèche orange, croque une pomme',
    meetAlt: 'Nino fait un check à Suzie, le minimoa de Léa',
  },
  how: {
    title: [{ text: 'COMMENT' }, { text: 'ÇA MARCHE.', dim: true }] as TitleLine[],
    steps: [
      { title: 'Il apprend à te connaître', meta: 'chaque jour', text: 'Quelques questions par jour. En te présentant à lui, tu apprends aussi à te connaître.' },
      { title: 'Il te présente des gens près de chez toi', meta: 'et dit pourquoi', text: 'Des personnes qui te ressemblent, avec vos points communs. Des potes, et pourquoi pas plus.' },
      { title: 'Vous vous écrivez, vous vous voyez', meta: 'rien sans ton accord', text: 'Tu salues, l’autre accepte. Personne ne t’écrit sans ton oui.' },
    ],
    cta: 'Quel minimoa es-tu ?',
    quartier: 'Ton quartier ouvre à 50',
  },
  alive: {
    title: [{ text: 'IL EST VIVANT.' }, { text: 'OCCUPE-TOI', dim: true }, { text: 'DE LUI.', dim: true }] as TitleLine[],
    lead: 'Il a faim, sommeil, envie de jouer et de voir du monde. Tu t’en occupes : il te le rend.',
    speciesLabel: 'Choisis ton minimoa',
    careLabel: 'Prends soin de lui',
    speciesAlt: { nino: 'Nino, vert à mèche orange', suzie: 'Suzie, rose à antennes pompons', gaston: 'Gaston, orange, un seul grand œil', pia: 'Pia, violette à petites cornes' },
    restSay: 'Alors, on fait quoi ?',
    actions: {
      nourrir: { label: 'Nourrir', say: 'Miam. Encore une ?' },
      jouer: { label: 'Jouer', say: 'Lance-la. Plus loin !' },
      sieste: { label: 'Sieste', say: 'Zzz… cinq minutes.' },
      calin: { label: 'Câlin', say: 'Ça chatouille !' },
      bain: { label: 'Bain', say: 'Pas dans les yeux, hein.' },
      danse: { label: 'Danser', say: 'Regarde-moi ça.' },
    },
    /** « {name} : {action} » (texte alternatif de la pose) */
    poseAlt: '{name} : {action}',
  },
  wardrobe: {
    title: [{ text: 'IL S’HABILLE.' }, { text: 'TU GAGNES', dim: true }, { text: 'SES AFFAIRES.', dim: true }] as TitleLine[],
    lead: 'Bob, lunettes, écharpe, couronne : chaque objet se porte, sur chaque pose. Tu les gagnes avec ta série, tes habitudes et tes défis.',
    looks: {
      nino_bob: { items: 'Bob, lunettes rondes, écharpe', how: 'Dès le départ' },
      gaston_casque: { items: 'Casquette, sac à dos, ballon', how: 'Avec tes liens' },
      suzie_couronne: { items: 'Couronne, collier de perles, fleur', how: '100 jours de série' },
      pia_hiver: { items: 'Bonnet, écharpe, aura de flocons', how: 'Collection Hiver · Minimoa+' },
    },
    /** texte alternatif : « {who} habillé : {items} » */
    alt: '{who} habillé : {items}',
    rewards: 'Paliers de série',
  },
  character: {
    title: [{ text: 'IL A SON CARACTÈRE.' }, { text: 'ET IL CHANGE', dim: true }, { text: 'AVEC TOI', dim: true }] as TitleLine[],
    lead: 'Ce que tu fais, tes habitudes et les mots de tes potes le font pencher d’un côté ou de l’autre. Rien n’est définitif.',
    groupLabel: 'Fais évoluer Nino',
    moods: {
      casanier: { label: 'casanier', alt: 'Nino casanier, tout rond, paupières lourdes' },
      equilibre: { label: 'équilibré', alt: 'Nino équilibré, souriant et posé' },
      sociable: { label: 'sociable', alt: 'Nino sociable, entouré d’étincelles' },
      tendre: { label: 'tendre', alt: 'Nino tendre, poils longs et joues roses' },
      piquant: { label: 'piquant', alt: 'Nino piquant, poils dressés' },
      joueur: { label: 'joueur', alt: 'Nino joueur, sourire en coin' },
    },
    gauges: [
      { low: 'casanier', high: 'sociable', aria: 'Sociabilité' },
      { low: 'posé', high: 'joueur', aria: 'Jeu' },
      { low: 'piquant', high: 'tendre', aria: 'Tendresse' },
      { low: 'discret', high: 'bavard', aria: 'Parole' },
    ],
  },
  habits: {
    title: [{ text: 'TIENS TES' }, { text: 'HABITUDES.' }, { text: 'IL TIENT LES COMPTES.', dim: true }] as TitleLine[],
    lead: 'Marcher, lire, te coucher tôt : choisis-en deux. Ton minimoa demande une preuve au bon moment et note ta régularité, sans jamais te faire la morale.',
    cards: [
      { name: 'Marcher', rhythm: 'Tous les jours' },
      { name: 'Lire', rhythm: '3 fois par semaine' },
    ],
    streakUnit: 'jours',
    rigourLabel: 'Régularité sur 28 jours',
    /** « {label} : {name} » (lecteurs d'écran) */
    rigourAria: '{label} : {name}',
    percent: '{n} %',
    tooEarly: 'Trop tôt pour le dire',
    week: {
      label: 'La série de la semaine',
      days: ['L', 'M', 'M', 'J', 'V', 'S', 'D'],
      legend: { done: 'fait', joker: 'joker', today: 'aujourd’hui' },
      note: 'Un jour manqué ? Un joker le couvre. Sinon la série repart, et ton record reste.',
    },
    challenge: { label: 'Le défi du jour', text: 'Écris à quelqu’un que tu n’as pas vu depuis un mois.', go: 'J’y vais', later: 'Plus tard' },
    petAlt: 'Nino, fier, les poings sur les hanches',
  },
  groups: {
    title: [{ text: 'À PLUSIEURS,' }, { text: 'ON LÂCHE', dim: true }, { text: 'MOINS VITE.', dim: true }] as TitleLine[],
    lead: 'De 3 à 8 sur une même habitude : la série monte quand tout le monde est à jour, un oubli coûte une vie au groupe, un joker te couvre.',
    card: {
      name: 'Marche du matin',
      /** « {n} vies sur {max} » */
      livesAria: '{n} vies sur {max}',
      streakUnit: 'jours ensemble',
      today: 'Aujourd’hui · 2/3 à jour',
      members: [
        { name: 'Léa', state: 'Tenu' },
        { name: 'Inès', state: 'Joker' },
        { name: 'Toi', state: 'Pas encore' },
      ],
      note: 'Chacun voit l’état du jour des autres. C’est dit avant de rejoindre.',
    },
    together: {
      label: 'La tenir ensemble',
      text: '3 personnes près de toi tiennent aussi Lire. La tenir ensemble ?',
      note: 'Seul le nombre est montré. Les prénoms n’apparaissent qu’entre ceux qui disent oui.',
    },
    free: { name: 'Les potes du 11e', kind: 'Groupe libre', text: 'Un chat entre potes, sans vies ni série.' },
  },
  chats: {
    title: [{ text: 'IL VIT' }, { text: 'DANS TES', dim: true }, { text: 'CHATS', dim: true }] as TitleLine[],
    lead: 'Vos minimoas brisent la glace, relancent après un silence et calment le jeu si le ton monte.',
    leadBold: 'Trois fois par jour au plus, et tu peux les couper.',
    phone: {
      name: 'Léa',
      status: '✦ 5 · niv. 3',
      tabs: ['Chat', 'Le lien'],
      messages: [
        { who: 'Léa', text: 'J’ai vu 4 épisodes d’un coup 💀' },
        { who: '', text: 'Encore ? Il est 1 h.' },
        { who: 'Léa', text: 'Ce soir, je dors tôt. Promis.' },
        { who: '', text: 'Tu dis ça tous les soirs.' },
        { who: 'Nino · relance', text: 'Vous tenez tous les deux « Se coucher tôt ». Ça tombe bien.' },
        { who: 'Suzie · remarque', text: 'Léa a déjà perdu. Je la connais.' },
      ],
      mini: 'Série du lien · 12 jours',
      input: 'Écris à Léa',
    },
    apps: [
      { label: 'Brise-glace', title: 'Au début d’un lien', text: 'Une question tirée de vos points communs.' },
      { label: 'Relance', title: 'Après un silence', text: '« Ça fait 3 jours. Vous en étiez à ce resto. »' },
      { label: 'Garde-fou', title: 'Si le ton monte', text: 'Il propose une pause, à toi seul.' },
    ],
    privacy: 'Aucun humain ne lit tes conversations. Si vous l’activez tous les deux, une IA lit vos derniers messages pour que vos minimoas y réagissent.',
  },
  lives: {
    title: [{ text: '7 VIES.' }, { text: 'NE GHOSTE', dim: true }, { text: 'PERSONNE.', dim: true }] as TitleLine[],
    lead: 'Chaque lien a 7 vies, et un jour de silence en coûte une. Vous vous écrivez tous les deux ? La série du lien monte. À zéro vie, le lien devient fantôme 👻',
    /** texte sous les étincelles, de 5 vies à 0 */
    lines: ['vies avec Tom. Il ne répond plus trop…', '4 jours sans nouvelles…', 'Nino commence à s’inquiéter', 'Ça ne sent pas bon', 'Dernière vie. Écris-lui !', 'Lien fantôme 👻'],
    /** ce que dit Nino, de 5 vies à 0 */
    says: ['Tom ? T’es là ?', 'Tom ?', 'Allô la Terre', 'Je deviens tout pâle', 'Dernière chance', 'Bouh. Ghosté.'],
    revived: 'Ranimé. Dernière fois, hein.',
    revivedSay: 'Je suis de retour 💚',
    chip: 'On peut le ranimer une fois. Une seule.',
    ghostAlt: 'Nino devenu fantôme, bleuté et transparent',
  },
  encounters: {
    title: [{ text: 'IL TE PRÉSENTE' }, { text: 'DU MONDE.', dim: true }] as TitleLine[],
    lead: 'Il ne te présente que des gens dont la vision de la vie va avec la tienne, et il dit pourquoi. Ce que vous en faites vous regarde.',
    duoAlt: 'Nino et Pia qui se tapent dans la main',
    m1: 'T’es le minimoa de qui, toi ?',
    m2: 'D’Alex. Marche le matin, lit le soir.',
    why: { label: 'Pourquoi Sasha', common: ['Même rythme', 'Rester ici', 'Tout prévoir'], diff: 'Une différence à explorer : l’élan' },
    ctaLabel: 'Rien ne se passe sans ton tap',
    yes: 'Saluer Sasha',
    no: 'Pas cette fois',
  },
  outings: {
    title: [{ text: 'SORS.' }, { text: 'IL ADORE ÇA.' }, { text: 'TOI AUSSI.', dim: true }] as TitleLine[],
    lead: 'Plus tu sors et vois du monde, plus il est en forme, et plus il te présente de gens près de chez toi.',
    question: { text: 'Tu as mis le nez dehors aujourd’hui ?', answers: ['🙌 Vu du monde', '🚶 Un tour', '🛋️ Pas encore'] },
    map: {
      label: 'La carte',
      zone: 'Ta zone',
      more: '12 minimoas plus loin',
      facts: ['Position arrondie à 300 m environ, et décalée', 'Jamais en direct', 'Mode discret : tu disparais de la carte'],
    },
    meet: { title: 'Avant de voir Léa', text: 'Un lieu public, un proche prévenu, ton propre trajet. Et tu pars quand tu veux.' },
    petAlt: 'Nino qui part en balade',
  },
  threeWords: {
    title: [{ text: 'DÉCRIS-MOI' }, { text: 'EN 3 MOTS.', dim: true }, { text: 'SOIS SYMPA.', dim: true }] as TitleLine[],
    leadBefore: 'Ton lien',
    leadLink: 'minimoa.app/m/…',
    leadAfter: 'en story. Tes potes votent en anonyme, et leurs mots font évoluer ton minimoa.',
    cardLabel: 'Anonyme · choisis-en 3',
    question: 'DÉCRIS ALEX',
    questionAccent: 'EN 3 MOTS',
    groupLabel: 'Mots pour Alex',
    words: ['drôle', 'loyal·e', 'solaire', 'têtu·e', 'bavard·e', 'chill', 'chaotique', 'mystérieux·se'],
    evoPrefix: 'Nino devient',
    evoEmpty: 'Choisis jusqu’à 3 mots',
  },
  screens: {
    title: [{ text: 'L’APP,' }, { text: 'EN VRAI.', dim: true }] as TitleLine[],
    lead: 'Les écrans de Minimoa, tels qu’ils sont dans l’app.',
    /** « Écran de l’app Minimoa, {n} sur {total} » (repli si une capture n'a pas de texte alternatif) */
    alt: 'Écran de l’app Minimoa, {n} sur {total}',
    /** dit quand les captures montrées ne sont pas dans la langue de la page */
    frenchShots: '(Captures en français.)',
    listLabel: 'Écrans de l’app',
    /** Texte alternatif de chaque capture (nom de fichier sans largeur). */
    shots: {
      '01-des-potes': '« Des potes près de chez toi. » L’accueil de l’app : la carte « Léa te fait signe » (son minimoa, Suzie, est venu dire bonjour) et Nino, en chapeau de fête et monocle, à 92 % d’envie de sortir ; Suzie et Pia saluent autour.',
      '02-pourquoi': '« Qui voient la vie comme toi. » La rencontre de Nino et Pia, compatibles à 83 %, et la carte « Léa te fait signe » : 78 % compatibles, 3 points communs, 1 différence à explorer, « Pas cette fois » ou « Accepter ».',
      '03-groupe': '« Une habitude, à plusieurs. » Le groupe « Marche du matin » : qui a tenu aujourd’hui, la semaine en cours, l’habitude Marcher à prouver en photo et « Il manque 2 personnes pour lancer la série » ; Suzie et Nino se saluent.',
      '04-sortie': '« Vois-les pour de vrai. » Le chat du groupe « Les potes du 11e », où Malo propose un apéro jeudi et Yanis ramène des chips, et ce que Nino dit de Pia, rencontrée par Malo ; Pia éclate de rire.',
      '05-soins': '« Il prend soin de toi. » Nino et ses soins (Nourrir, Jouer, Sieste), et la carte « Moi, en 3 mots » où ses potes le décrivent : drôle, tendre, cash ; Nino croque une pomme.',
      '06-garde-robe': '« Habille-le comme toi. » La garde-robe : Nino en chapeau de fête et monocle, 14 objets sur 74, des objets à gagner par séries de jours et des objets Minimoa+ (auréole, cornes, tricorne de pirate, bonnet d’hiver), entourés d’une casquette, d’un bob, d’une couronne et d’une écharpe.',
      '07-quartier': '« Ton quartier, en vrai. » La carte « Autour de toi » : ta zone de 1,5 km, Yanis, Inès et Léa à des positions arrondies, le mode discret, et la carte « Cette semaine, Nino a trouvé 5 personnes ».',
    } as Record<string, string>,
  },
  plus: {
    title: [{ text: 'MINIMOA+.' }, { text: 'POUR ALLER', dim: true }, { text: 'PLUS LOIN.', dim: true }] as TitleLine[],
    lead: 'L’essentiel est gratuit, sans pub. Minimoa+ ouvre la carte, les jokers et la collection Hiver.',
    free: {
      name: 'Gratuit',
      note: (zero: string) => `${zero}, pour toujours`,
      items: ['Ton minimoa, ses soins, sa garde-robe', '2 habitudes, 2 groupes', '1 joker par semaine', 'Ta zone sur la carte', 'Zéro pub. Jamais.'],
    },
    pro: {
      name: 'Minimoa+',
      note: (days: number) => `${days} jours offerts sur l’annuel`,
      items: ['Toute la carte, et changer de ville', 'Une rencontre de plus par jour', '3 jokers par semaine', '6 habitudes, 10 groupes', 'Le bilan détaillé du dimanche', 'La collection Hiver'],
      price: (year: string) => `${year} par an`,
      priceNote: (month: string, days: number) => `soit ${month} par mois · ${days} jours offerts`,
      others: (month: string, week: string) => `Ou ${month} par mois, ou ${week} par semaine, sans essai.`,
      renew: 'Renouvellement automatique, annulable à tout moment dans les réglages de ton téléphone.',
      terms: 'Conditions de Minimoa+',
      cta: 'Essayer dans l’app',
    },
    petAlt: 'Pia en bonnet et écharpe de la collection Hiver',
  },
  faq: {
    title: [{ text: 'DES' }, { text: 'QUESTIONS ?' }, { text: 'NORMAL.', dim: true }] as TitleLine[],
    sideBefore: 'Une autre ?',
    sideLink: 'Écris-nous',
    sideAfter: '. Un humain répond. Pas un minimoa.',
    /** réponses en HTML simple (<b> autorisé) */
    items: [
      { q: 'C’est une app de rencontre ?', a: 'Non. Minimoa crée des relations : ton minimoa te présente des gens dont la vision de la vie va avec la tienne. <b>Ce que vous en faites vous regarde</b>, et rien ne se passe sans ton tap.' },
      { q: 'Mon minimoa peut mourir ?', a: 'Non, jamais. Il boude si tu le laisses tomber. C’est le <b>lien</b> qui devient fantôme après 7 jours de silence, et on peut le ranimer une fois.' },
      { q: 'Qui voit ma position ?', a: 'Personne ne la voit précise : sur la carte, elle est <b>arrondie à 300 m environ et décalée</b>, jamais en direct. Le mode discret te retire de la carte.' },
      { q: 'Qui voit mes habitudes ?', a: 'Tes liens et les personnes que ton minimoa te présente voient leur nom, ta série et ta régularité. <b>Jamais tes photos de preuve.</b> Un réglage coupe tout.' },
      { q: 'À partir de quel âge ?', a: '<b>18 ans.</b> Ta date de naissance est demandée à l’inscription ; en dessous, rien n’est créé.' },
    ],
    price: {
      q: 'C’est payant ?',
      a: (year: string, days: number, month: string, week: string) =>
        `Non. Minimoa est gratuit et sans pub. <b>Minimoa+</b> coûte ${year} par an (${days} jours offerts), ${month} par mois ou ${week} par semaine.`,
    },
  },
  final: {
    title: [{ text: 'TON MINIMOA' }, { text: 'T’ATTEND.' }, { text: 'IL S’ENNUIE DÉJÀ.', dim: true }] as TitleLine[],
    bandAlt: 'Nino, Suzie, Gaston et Pia qui font la fête',
  },
};

export type LandingText = typeof fr;
