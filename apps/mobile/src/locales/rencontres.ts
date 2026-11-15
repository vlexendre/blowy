/** Textes des rencontres, du détail d'une rencontre et de la carte. */
import { TODO } from '@blowy/content';
import type { TitleSegment } from '@blowy/ui';
import { messages } from './runtime';

export const rencontres = messages({
  fr: {
    kicker: 'Cette semaine',
    title: (pet: string, n: number | null): TitleSegment[] => [
      { text: `${pet.toUpperCase()} A CROISÉ\n` },
      { text: n === null ? '…' : n === 0 ? 'PERSONNE.' : `${n} ${n > 1 ? 'MINIMOAS' : 'MINIMOA'}.`, dim: true },
    ],
    text: 'Seulement des visions qui vont avec la tienne.',
    map: 'La carte',
    mapA11y: 'Ouvrir la carte du quartier de ton minimoa',
    incomingCard: (name: string): string => `${name} veut te rencontrer`,
    incomingOwner: (pet: string, name: string): string => `${pet}, le minimoa de ${name}`,
    owner: (name: string): string => `Le minimoa de ${name}`,
    compat: 'd’accord',
    via: {
      friend_of_friend: (mutual: string | null): string => (mutual ? `Par ${mutual}, pote de pote` : 'Pote de pote'),
      nearby: (): string => 'Près de chez toi',
      new: (): string => 'Nouveau',
    },
    badgeNew: 'Nouveau',
    introLabel: (myPet: string): string => `${myPet} raconte`,
    wave: (pet: string): string => `Saluer ${pet}`,
    waved: 'Salué · en attente',
    open: 'Voir de plus près',
    openTalk: 'Voir ce qu’ils se sont dit',
    plus: '+',
    accept: 'Accepter',
    decline: 'Pas cette fois',
    reminderShort: 'Rien ne se passe sans ton tap.',
    emptyTitle: [{ text: 'PERSONNE\n' }, { text: 'POUR L’INSTANT', dim: true }] as TitleSegment[],
    emptyText: (pet: string): string =>
      `${pet} ne présente que des visions qui vont avec la tienne : il préfère personne à n’importe qui. Invite tes potes, leurs potes viendront avec.`,
    emptyAction: 'Partager mon lien d’invitation',
    /** Pas de suggestions : la raison, honnêtement, et ce qui aide. */
    noVision: {
      title: [{ text: 'D’ABORD\n' }, { text: 'TA VISION', dim: true }] as TitleSegment[],
      text: (pet: string): string => `${pet} présente des gens selon vos projets de vie. Sans ton test de vision, il ne sait pas encore qui te va. 12 questions, 2 minutes.`,
      action: 'Passer le test de vision',
    },
    noLocation: {
      title: 'Pas de rencontres près de chez toi',
      text: (pet: string): string =>
        `Sans ta localisation, ${pet} ne te présente que des potes de tes potes. Choisis ta ville à la main, ou active la localisation : ta position exacte n’est jamais enregistrée, seulement un point arrondi à 300 m environ.`,
      action: 'Activer la localisation',
      settings: 'Ouvrir les Réglages',
      denied: 'Tu as refusé la localisation : choisis ta ville à la main, ou active-la dans Réglages › Blowy › Position.',
      chooseCity: 'Choisir ma ville',
      deniedWeb: 'Ton navigateur bloque la localisation. Autorise-la dans les réglages du site.',
      unavailable: 'Position introuvable pour l’instant. Réessaie dehors ou dans un moment.',
    },
    /** Sous la liste : ce que fait le minimoa, en une ligne. */
    filterNote: (pet: string): string => `${pet} ne te présente que des gens au-dessus de 70 % d’accord sur la vision.`,
    /** Ce que vous cherchez tous les deux (`lookingFor` de l'API ; jamais « qui »). */
    lookingFor: { friends: 'Vous cherchez tous les deux des potes.', more: 'Vous cherchez tous les deux plus.', both: 'Vous cherchez tous les deux des potes, ou plus.' },
    /** Version courte du pourquoi, sur les cartes. */
    whyJoin: (title: string, items: string): string => `${title} : ${items}.`,
    /** Le texte de l'avantage vient de l'API (`usePlusPerks`), comme sur la feuille Blowy+. */
    morePlus: { title: 'Plus de rencontres avec Blowy+', cta: 'Voir' },
    shareMessage: (pet: string, url: string): string => `Viens rencontrer ${pet} sur Blowy : ${url}`,
    loadError: 'Impossible de charger les rencontres',
    retry: 'Réessayer',
    actionError: 'Ça n’a pas marché. Réessaie.',
    /** Minimoa qui boude : il ne croise plus personne (texte : `shapeLabel.boude`). */
    sulkTitle: (pet: string): TitleSegment[] => [{ text: `${pet.toUpperCase()}\n` }, { text: 'BOUDE.', dim: true }],
    sulkAction: 'M’occuper de lui',
    /** Salut refusé par l'API parce que le minimoa boude. */
    waveSulk: (pet: string): string => `${pet} boude : occupe-toi de lui avant de saluer.`,
    /** Minimoa un peu à plat (`shapeLabel.bof`). */
    bofTitle: (pet: string): string => `${pet} est un peu à plat`,
    /** Historique : rencontres passées, acceptées ou non. */
    history: {
      title: 'Déjà croisés',
      outcome: { linked: 'Liés', ended: 'Lien rangé', declined: 'Pas cette fois', waiting: 'En attente' },
      received: (pet: string, when: string): string => `${pet} t’a fait signe · ${when}`,
      sent: (pet: string, when: string): string => `Tu as salué ${pet} · ${when}`,
      openA11y: (name: string): string => `Ouvrir le chat avec ${name}`,
      more: 'Voir plus',
    },
  },
  en: TODO,
  es: TODO,
  pt: TODO,
  nl: TODO,
});

export const rencontre = messages({
  fr: {
    back: 'Retour',
    me: (pet: string): string => `${pet} · toi`,
    them: (pet: string, name: string): string => `${pet} · ${name}`,
    saysTitle: (pet: string): string => `Ce que ${pet} en dit`,
    theySay: (pet: string): string => `${pet} t’a fait signe`,
    title: [{ text: 'RIEN SANS\n' }, { text: 'TON TAP.', dim: true }] as TitleSegment[],
    text: (name: string): string => `${name} ne voit rien tant que tu n’as pas dit oui.`,
    waitingText: (name: string): string => `Ton salut est parti. Si ${name} accepte, le chat s’ouvre.`,
    accept: (name: string): string => `Ouvrir le chat avec ${name}`,
    decline: 'Pas cette fois',
    wave: (pet: string): string => `Saluer ${pet}`,
    waved: 'Salué · en attente',
    compatA11y: (n: number): string => `${n} % d’accord`,
    goneTitle: [{ text: 'PLUS\n' }, { text: 'LÀ', dim: true }] as TitleSegment[],
    goneText: 'Cette rencontre n’est plus disponible.',
    goneAction: 'Voir les rencontres',
    safetyTitle: 'Sécurité',
    more: 'Signaler ou bloquer',
    /** Pourquoi : légende des repères et libellés lus des pistes. */
    legendMe: 'toi',
    sameSide: (name: string): string => `Toi et ${name}, du même côté`,
    apartSide: (name: string): string => `Toi et ${name}, pas du même côté`,
    filterNote: (pet: string): string => `${pet} ne présente que des gens dont la vision va avec la tienne.`,
    unknownVision: 'Vos visions ne sont pas encore assez connues pour être comparées. Fiez-vous à ce que racontent vos minimoas.',
    wave2: 'Saluer',
  },
  en: TODO,
  es: TODO,
  pt: TODO,
  nl: TODO,
});

export const carte = messages({
  fr: {
    back: 'Retour',
    title: [{ text: 'AUTOUR ' }, { text: 'DE TOI', dim: true }] as TitleSegment[],
    /** Ce qu'on montre vraiment : la zone, arrondie, jamais en direct. */
    subtitle: (km: string): string => `Ta zone : ${km} km. Positions arrondies, jamais en direct.`,
    subtitleCity: (city: string, km: string): string => `${city}, ${km} km autour. Positions arrondies, jamais en direct.`,
    subtitleEverywhere: (km: string): string => `${km} km autour de toi. Positions arrondies, jamais en direct.`,
    me: 'Toi',
    meA11y: (pet: string): string => `${pet}, ton minimoa, au centre de ta zone`,
    pinA11y: (pet: string, name: string): string => `${pet}, le minimoa de ${name}. Voir pourquoi`,
    owner: (name: string): string => `Le minimoa de ${name}`,
    compat: 'd’accord',
    wave: (pet: string): string => `Saluer ${pet}`,
    /** Bouton de la fiche (demi-largeur) : court. */
    waved: 'En attente',
    /** On t'a salué (repère `waved_you`) : la réponse se donne sur l'écran de la rencontre. */
    wavedYou: (_name: string): string => 'Répondre',
    open: 'Voir de plus près',
    /** Puce sous la zone (le nombre vient du serveur ; cachée à zéro). */
    beyondA11y: (label: string): string => `${label}. Avec Blowy+, toute la carte.`,
    discreet: 'Discret',
    discreetA11y: (on: boolean): string => (on ? 'Mode discret activé : tu n’apparais sur la carte de personne' : 'Mode discret désactivé : les minimoas compatibles te voient sur la carte, position arrondie'),
    discreetOn: 'Mode discret : tu n’apparais sur la carte de personne. Les rencontres, elles, continuent.',
    plusTitle: 'Toute la carte, d’autres villes',
    plusText: 'Avec Blowy+',
    plusCta: 'Voir',
    city: 'Changer de ville',
    cityBack: 'Revenir à ma zone',
    cityTitle: [{ text: 'CHANGER ' }, { text: 'DE VILLE', dim: true }] as TitleSegment[],
    cityText: 'Tes rencontres se font autour de la ville choisie, sans bouger. Ta vraie position ne change pas.',
    cityError: 'La ville n’a pas changé. Réessaie.',
    cities: {
      paris: 'Paris',
      lyon: 'Lyon',
      marseille: 'Marseille',
      bordeaux: 'Bordeaux',
      lille: 'Lille',
      nantes: 'Nantes',
      toulouse: 'Toulouse',
      montpellier: 'Montpellier',
      strasbourg: 'Strasbourg',
      nice: 'Nice',
      bruxelles: 'Bruxelles',
      geneve: 'Genève',
      montreal: 'Montréal',
      londres: 'Londres',
      amsterdam: 'Amsterdam',
      lisbonne: 'Lisbonne',
      madrid: 'Madrid',
      barcelone: 'Barcelone',
    },
    empty: 'Personne de compatible dans ta zone pour l’instant. Ton minimoa préfère attendre que te présenter n’importe qui.',
    emptyAction: 'Voir mes rencontres',
    /** Pas de localisation : ce qui manque, et comment l'activer. */
    noLocation: {
      title: [{ text: 'OÙ ES-TU,\n' }, { text: 'EN GROS ?', dim: true }] as TitleSegment[],
      text: (pet: string): string => `Pour te montrer qui est compatible autour de toi, ${pet} a besoin de ta position. Seulement app ouverte, arrondie à 300 m environ et décalée, jamais en direct.`,
      without: 'Sans elle : pas de carte, et pas de rencontres près de chez toi (les potes de tes potes, si).',
      action: 'Activer la localisation',
      deniedTitle: [{ text: 'LOCALISATION\n' }, { text: 'COUPÉE', dim: true }] as TitleSegment[],
      denied: 'Tu as refusé l’accès à ta position. Pour voir la carte, autorise-la dans Réglages › Blowy › Position, puis reviens ici.',
      deniedWeb: 'Ton navigateur bloque la localisation pour ce site. Autorise-la dans ses réglages, puis réessaie.',
      settings: 'Ouvrir les Réglages',
      retry: 'Réessayer',
      unavailable: 'Position introuvable pour l’instant. Réessaie dans un moment.',
    },
    /** Sans localisation : choisir sa ville à la main (gratuit ; une fois tous les 30 jours sans Blowy+). */
    area: {
      choose: 'Choisir ma ville à la place',
      change: 'Changer de ville',
      title: [{ text: 'CHOISIS\n' }, { text: 'TA VILLE', dim: true }] as TitleSegment[],
      text: 'Sans ta position, dis-nous en gros où tu vis : ton minimoa te présente des gens compatibles autour, et ta carte s’y centre. Gratuit. Tu pourras en changer dans 30 jours (quand tu veux avec Blowy+).',
      current: (city: string) => `Ta zone : ${city} (choisie à la main)`,
      nextChange: (date: string) => `Prochain changement possible le ${date}.`,
      offSub: 'Ta ville choisie sert de zone : rencontres et carte autour d’elle.',
      forget: 'Oublier ma ville',
      error: 'Ce n’est pas passé. Réessaie.',
    },
    loadError: 'Impossible de dessiner la carte',
    retry: 'Réessayer',
  },
  en: TODO,
  es: TODO,
  pt: TODO,
  nl: TODO,
});

/** Invitation reçue (/i/CODE), maquette V6-Invitation. */
export const invitation = messages({
  fr: {
    kicker: 'Invitation',
    title: (name: string, pet: string): TitleSegment[] => [{ text: `${name.toUpperCase()} VEUT\n` }, { text: `TE PRÉSENTER ${pet.toUpperCase()}.`, dim: true }],
    note: 'Vos minimoas se rencontrent tout de suite, sans passer par les rencontres. Vous commencez avec ',
    noteBold: '7 vies',
    noteEnd: ' au niveau 1.',
    accept: 'Accepter',
    later: 'Plus tard',
    a11y: (pet: string, mine: string): string => `${pet} et ${mine}, côte à côte`,
  },
  en: TODO,
  es: TODO,
  pt: TODO,
  nl: TODO,
});
