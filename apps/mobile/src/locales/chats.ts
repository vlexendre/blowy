/** Textes des chats et des liens (liste, chat, « Le lien » et ses étapes, fantôme, niveaux, options). */
import { TODO } from '@blowy/content';
import type { TitleSegment } from '@blowy/ui';
import { messages } from './runtime';

export const tabs = messages({
  fr: {
    chats: 'Chats',
    pet: 'Mon minimoa',
    rencontres: 'Rencontres',
    moi: 'Moi',
    a11y: 'Navigation principale',
  },
  en: {
    chats: 'Chats',
    pet: 'My minimoa',
    rencontres: 'Encounters',
    moi: 'Me',
    a11y: 'Main navigation',
  },
  es: TODO,
  pt: TODO,
  nl: TODO,
});

export const chats = messages({
  fr: {
    brand: 'blowy',
    title: (n: number): TitleSegment[] => [{ text: 'CHATS' }, ...(n > 0 ? [{ text: ` · ${n}`, dim: true }] : [])],
    newChat: 'Rencontrer un nouveau minimoa',
    wavesKicker: 'Rencontres',
    wavesTitle: (pet: string): TitleSegment[] => [{ text: `${pet.toUpperCase()} A CROISÉ ` }, { text: 'QUELQU’UN', dim: true }],
    wavesText: (names: string[]): string =>
      names.length === 1 ? `${names[0]} te fait signe. Tu réponds ?` : `${names.slice(0, -1).join(', ')} et ${names.at(-1)} te font signe.`,
    wavesA11y: (n: number): string => `${n} ${n > 1 ? 'personnes te font signe' : 'personne te fait signe'}. Ouvrir les rencontres.`,
    /** Bandeau : des séries en jeu ce soir, l'autre a écrit, pas toi. */
    turnKicker: 'Série en jeu',
    turnTitle: (n: number): TitleSegment[] => [{ text: `${n} ${n > 1 ? 'LIENS' : 'LIEN'} ` }, { text: n > 1 ? 'T’ATTENDENT' : 'T’ATTEND', dim: true }],
    turnText: (names: string[]): string =>
      names.length === 1
        ? `${names[0] ?? ''} t’a écrit aujourd’hui. Réponds avant minuit pour garder votre série.`
        : `${names.slice(0, -1).join(', ')} et ${names.at(-1) ?? ''} t’ont écrit aujourd’hui. Réponds avant minuit pour garder vos séries.`,
    turnA11y: 'Ouvrir le chat pour répondre',
    /** Ligne d'un lien : série (« 5 j ») et « à toi » quand l'autre a écrit aujourd'hui, pas toi. */
    streakUnit: 'j',
    turn: 'À toi',
    level: (n: number): string => `Niv. ${n}`,
    ghost: 'Lien fantôme 👻',
    isNew: 'Nouveau',
    emptyPreview: 'Dites-vous bonjour.',
    emptyTitle: [{ text: 'PAS ENCORE\n' }, { text: 'DE CHAT', dim: true }] as TitleSegment[],
    emptyText: (pet: string): string => `${pet} attend de croiser quelqu’un. Va voir les rencontres, ou envoie ton lien à tes potes.`,
    emptyAction: 'Voir les rencontres',
    shareInvite: 'Partager mon lien d’invitation',
    copied: 'Lien copié ✓',
    yourPet: 'Ton minimoa',
    shareMessage: (pet: string, url: string): string => `Viens rencontrer ${pet} sur Blowy : ${url}`,
    errorTitle: 'Impossible de charger tes chats',
    retry: 'Réessayer',
  },
  en: TODO,
  es: TODO,
  pt: TODO,
  nl: TODO,
});

export const link = messages({
  fr: {
    back: 'Retour aux chats',
    level: (n: number): string => `Niveau ${n} ›`,
    /** En-tête chargé (interrupteur des minimoas) : version courte. */
    levelShort: (n: number): string => `Niv. ${n} ›`,
    levelA11y: (n: number): string => `Niveau ${n} sur 7. Voir les niveaux du lien`,
    lives: (n: number): string => `${n} ${n > 1 ? 'vies' : 'vie'} sur 7`,
    options: 'Options du lien : signaler, bloquer, quitter',
    tabs: { chat: 'Chat', lien: 'Le lien' },
    loadError: 'Impossible d’ouvrir ce lien',
    gone: 'Ce lien n’existe plus.',
    retry: 'Réessayer',
    backToChats: 'Retour aux chats',
  },
  en: TODO,
  es: TODO,
  pt: TODO,
  nl: TODO,
});

/**
 * Onglet « Le lien » : la journée du lien (spéc §24), sa semaine, ses vies, le prochain niveau.
 * La série compte les jours d’affilée où vous vous êtes écrit, vous deux.
 */
export const today = messages({
  fr: {
    streakUnit: (n: number): string => (n > 1 ? 'jours' : 'jour'),
    streakA11y: (n: number): string => `Série : ${n} ${n > 1 ? 'jours' : 'jour'} d’affilée à vous écrire`,
    /** Les cinq états de la journée, vus par toi. */
    both: {
      title: [{ text: 'VOUS VOUS ÊTES\n' }, { text: 'ÉCRIT', dim: true }] as TitleSegment[],
      text: (n: number): string => `${n} ${n > 1 ? 'jours' : 'jour'} d’affilée. Demain, on remet ça.`,
    },
    yourTurn: {
      title: [{ text: 'À TOI\n' }, { text: 'D’ÉCRIRE', dim: true }] as TitleSegment[],
      text: (name: string, next: number): string =>
        next > 1 ? `${name} t’a écrit. Réponds avant minuit et la série passe à ${next}.` : `${name} t’a écrit. Réponds avant minuit et votre série commence.`,
    },
    theirTurn: {
      title: (name: string): TitleSegment[] => [{ text: 'AU TOUR\n' }, { text: `DE ${name.toUpperCase()}`, dim: true }],
      text: (name: string, next: number): string =>
        next > 1 ? `Tu as écrit. Si ${name} répond avant minuit, la série passe à ${next}.` : `Tu as écrit. Si ${name} répond avant minuit, votre série commence.`,
    },
    atStake: {
      title: [{ text: 'SÉRIE\n' }, { text: 'EN JEU', dim: true }] as TitleSegment[],
      text: (n: number): string => `${n} ${n > 1 ? 'jours' : 'jour'} d’affilée. Un message de chaque côté avant minuit, sinon elle repart de zéro.`,
    },
    fresh: {
      title: [{ text: 'UN MOT\n' }, { text: 'DE CHAQUE CÔTÉ', dim: true }] as TitleSegment[],
      text: 'Un message de ta part et un de la sienne dans la journée, et votre série commence. Chaque jour d’affilée la fait grandir.',
    },
    me: 'Toi',
    wrote: 'A écrit',
    waiting: 'Pas encore',
    ctaWrite: (name: string): string => `Écrire à ${name}`,
    ctaBack: 'Retourner au chat',
    dismiss: 'Fermer',
    weekTitle: 'Cette semaine',
    weekDays: ['D', 'L', 'M', 'M', 'J', 'V', 'S'] as const,
    halfMark: '1/2',
    livesCount: (n: number): string => `${n}/7`,
    livesText: 'Un jour entier sans message coûte une vie. Un jour d’échange à deux en rend une. À 0, le lien devient fantôme.',
    todoTitle: 'Prochain niveau',
    nextTodo: (level: number, title: string): string => `Niv. ${level} · ${title.toLowerCase()}`,
    nextChip: (n: number): string => `${n} xp`,
    maxText: 'Bout du chemin. L’œuf est à vous.',
    nextA11y: 'Voir les niveaux du lien',
  },
  en: TODO,
  es: TODO,
  pt: TODO,
  nl: TODO,
});

export const chat = messages({
  fr: {
    /** Pas de « lit tout » : le minimoa ne lit que si vous avez dit oui tous les deux (et c'est une IA). */
    placeholder: (name: string, _pet: string): string => `Écris à ${name}`,
    tones: { sweet: 'Mot doux', tease: 'Vanne' },
    send: 'Envoyer',
    ghostDisabled: 'Lien fantôme : ranime-le pour écrire',
    sendError: 'Ton message n’est pas parti. Il est toujours là, réessaie.',
    /** Ancienne photo du jour de l’autre, restée cachée (tu n’avais pas posté la tienne ce jour-là). */
    lockedPhoto: 'Photo restée cachée',
    typing: (name: string): string => `${name} écrit…`,
    emptyTitle: [{ text: 'DITES-VOUS\n' }, { text: 'BONJOUR', dim: true }] as TitleSegment[],
    emptyText: (pet: string, otherPet: string): string => `${pet} et ${otherPet} se sont trouvés. À toi le premier mot.`,
    loadError: 'Impossible de charger les messages',
    retry: 'Réessayer',
    today: 'Aujourd’hui',
    yesterday: 'Hier',
    /** Nom au-dessus d'une réplique de minimoa : « nino · brise-glace ». */
    role: (role: 'icebreaker' | 'nudge' | 'remark' | 'guard' | 'event', name: string): string =>
      `${name} · ${{ icebreaker: 'brise-glace', nudge: 'relance', remark: 'remarque', guard: 'garde-fou, rien que pour toi', event: 'annonce' }[role]}`,
    /** Sous le fil, au-dessus du champ. */
    rhythm: (max: number): string => `Les minimoas parlent ${max} fois par jour au plus.`,
    rhythmNoReading: (max: number): string => `Sans lecture : ils réagissent au rythme (silences, séries, défis), ${max} fois par jour au plus.`,
    rhythmMuted: 'Minimoas coupés dans ce chat.',
    /** Interrupteur de l'en-tête. */
    switchOn: 'Minimoas activés dans ce chat. Toucher pour les couper.',
    switchOff: 'Minimoas coupés dans ce chat. Toucher pour les réactiver.',
    mutedNotice: 'Vos minimoas se taisent ici. Les annonces du lien (niveau, vies) restent.',
    unmutedNotice: 'Vos minimoas peuvent reparler ici.',
    muteError: 'Le réglage n’est pas passé. Réessaie.',
    /** Signaler un message (appui long). */
    longPressHint: 'Signaler ce message',
    reportTitle: [{ text: 'CE ' }, { text: 'MESSAGE ?', dim: true }] as TitleSegment[],
    reportText: 'On ne voit que ce message et les quelques messages autour. Rien d’autre de votre conversation.',
    reportAction: 'Signaler ce message',
    quote: (body: string): string => `« ${body} »`,
    cancel: 'Annuler',
  },
  en: TODO,
  es: TODO,
  pt: TODO,
  nl: TODO,
});

/** Les étapes du lien et ses photos d’avant (bas de l’onglet « Le lien »). */
export const memories = messages({
  fr: {
    title: 'VOS ÉTAPES',
    met: 'Votre rencontre',
    level: (n: number, title: string): string => `Niveau ${n} : ${title.toLowerCase()}`,
    streak: (n: number): string => `${n} jours d’affilée à vous écrire`,
    earlier: 'Plus tôt',
    stats: (s: { daysTogether: number; duoDays: number; messages: number }): string =>
      `${s.daysTogether} ${s.daysTogether > 1 ? 'jours' : 'jour'} ensemble · ${s.duoDays} ${s.duoDays > 1 ? 'jours' : 'jour'} à vous écrire · ${s.messages} ${s.messages > 1 ? 'messages' : 'message'}`,
    bestStreak: (n: number): string => `Meilleure série : ${n} ${n > 1 ? 'jours' : 'jour'}`,
    photosTitle: 'VOS PHOTOS D’AVANT',
    blurredHint: 'Nettes au niveau 5',
    loadError: 'Impossible de charger vos étapes',
    retry: 'Réessayer',
  },
  en: TODO,
  es: TODO,
  pt: TODO,
  nl: TODO,
});

export const ghost = messages({
  fr: {
    title: [{ text: 'GHOSTING\n' }, { text: 'CONFIRMÉ.', dim: true }] as TitleSegment[],
    badge: (name: string): string => `${name} · lien fantôme`,
    text: (name: string): string => `7 jours de silence avec ${name}. Le lien est devenu fantôme.`,
    speech: (name: string): string => `J’ai attendu ${name} une semaine. Je suis devenu transparent. C’est normal ?`,
    speaker: (pet: string): string => `${pet}, version fantôme`,
    revive: 'Le ranimer',
    reviveHint: '(une seule fois)',
    already: 'Déjà ranimé une fois',
    leave: 'Le laisser partir',
    reviveError: 'Impossible de le ranimer.',
    cannotRevive: 'Ce lien a déjà été ranimé une fois.',
  },
  en: TODO,
  es: TODO,
  pt: TODO,
  nl: TODO,
});

/** Les minimoas dans un chat : accord de lecture, explication des rôles (spéc  9). */
export const minimoas = messages({
  fr: {
    consentTitle: [{ text: 'VOS MINIMOAS\n' }, { text: 'DANS CE CHAT.', dim: true }] as TitleSegment[],
    consentSubtitle: 'Ils lancent, relancent, et glissent une remarque.',
    /** La phrase de confidentialité vient de l'API (`consent.text`) : jamais réécrite ici. */
    ifRefused: (mine: string, theirs: string): string => `Si l’accord manque d’un côté, ${mine} et ${theirs} réagissent seulement au rythme : silences, séries, défis. Sans rien lire.`,
    /**
     * Où en est l'autre (`consent.theirs`) : « agreed » ou « not_yet ». Un refus et une question pas encore vue se
     * disent pareil, « pas encore activé de son côté » : jamais « a refusé », aucune pression.
     */
    otherWaiting: (name: string): string => `Pas encore activé du côté de ${name}. Tant que ce n’est pas le cas, l’IA ne lit rien. Modifiable dans les options du lien ou dans Moi.`,
    otherAgreed: (name: string): string => `${name} l’a activé de son côté. Si tu dis oui aussi, vos minimoas liront vos messages. Modifiable dans les options du lien ou dans Moi.`,
    bothYes: (name: string): string => `${name} a dit oui aussi : vos minimoas lisent vos messages. Modifiable dans les options du lien ou dans Moi.`,
    /** Accord venu du réglage par défaut (« Moi ») : pas de question, une ligne dans le chat. */
    byDefault: (on: boolean): string => (on ? 'Lecture par une IA : activée d’office pour ce chat (ton réglage).' : 'Lecture par une IA : coupée d’office pour ce chat (ton réglage).'),
    byDefaultChange: 'Changer',
    accept: 'J’active pour ce chat',
    decline: 'Sans lecture',
    later: 'Plus tard',
    error: 'Ton choix n’est pas passé. Réessaie.',
    /** Première fois : à quoi servent les minimoas d'un chat. */
    guideTitle: 'Ce que font vos minimoas ici',
    guideText: 'Ils brisent la glace, relancent après un silence, glissent une remarque. 3 fois par jour au plus.',
    guideMore: 'Voir les 5 rôles',
    guideClose: 'Compris',
    rolesTitle: [{ text: 'LEURS ' }, { text: 'RÔLES', dim: true }] as TitleSegment[],
    roles: [
      { key: 'icebreaker', icon: 'gel', title: 'Brise-glace', text: 'Au début du lien, une question tirée de vos points communs.' },
      { key: 'nudge', icon: 'eclair', title: 'Relance', text: 'Après un long silence : « Ça fait 3 jours. Vous en étiez à ce resto. »' },
      { key: 'remark', icon: 'etoiles', title: 'Remarque', text: 'De temps en temps, ce qu’ils remarquent de vous deux.' },
      { key: 'guard', icon: 'coeurs', title: 'Garde-fou', text: 'Si le ton monte, ton minimoa te propose une pause. Rien que pour toi.' },
      { key: 'review', icon: 'flamme', title: 'Bilan du dimanche', text: 'Une fois par semaine, la santé du lien, dans ton bilan.' },
    ] as const,
    rolesNote: 'Ils parlent avec le caractère de leur humain. Tu peux les couper pour ce chat, en haut à droite.',
    /** Options du lien. */
    sectionTitle: 'Minimoas dans ce chat',
    readingRow: 'Lecture par une IA',
    /** `theirs` : `consent.theirs` de l'API (absent d'une réponse plus ancienne). */
    readingSub: (on: boolean | null, both: boolean, theirs?: 'agreed' | 'not_yet', byDefault?: boolean): string => {
      const mine = on === null ? 'Pas encore choisi' : !on ? 'Non : ils réagissent seulement au rythme' : both ? 'Oui, vous deux' : 'Oui';
      const other = both || theirs === undefined ? '' : theirs === 'agreed' ? ' · activé de son côté' : ' · pas encore activé de son côté';
      return `${mine}${other}${byDefault ? ' · par défaut' : ''}`;
    },
    muteRow: 'Minimoas actifs',
    muteSub: (n: number, max: number): string => `${n} sur ${max} interventions aujourd’hui`,
  },
  en: TODO,
  es: TODO,
  pt: TODO,
  nl: TODO,
});

export const levels = messages({
  fr: {
    header: (name: string): string => `Ton lien avec ${name}`,
    kicker: (n: number): string => `Niveau ${n} sur 7`,
    /** « EMMÉNAGER / ENSEMBLE » : le dernier mot estompé sur la deuxième ligne. */
    heroTitle: (title: string): TitleSegment[] => {
      const words = title.toUpperCase().split(' ');
      const last = words.pop() ?? '';
      return words.length ? [{ text: `${words.join(' ')}\n` }, { text: last, dim: true }] : [{ text: last }];
    },
    progress: (into: number, span: number, next: number): string => `${into} / ${span} xp avant le niveau ${next}`,
    maxProgress: 'Dernier niveau atteint',
    current: 'Vous êtes là',
    next: (n: number): string => `Encore ${n} xp`,
    livesTitle: (n: number): TitleSegment[] => [{ text: `${n} ${n > 1 ? 'VIES' : 'VIE'} ` }, { text: 'SUR 7', dim: true }],
    livesText: 'Un jour d’échange à deux = +1 vie. Un jour de silence = −1 vie. À 0, le lien devient fantôme.',
  },
  en: TODO,
  es: TODO,
  pt: TODO,
  nl: TODO,
});

export const options = messages({
  fr: {
    close: 'Fermer',
    title: (name: string, pet: string): TitleSegment[] => [{ text: `${name.toUpperCase()} ` }, { text: `ET ${pet.toUpperCase()}`, dim: true }],
    meta: (created: string, level: number, lives: number): string => `Lien créé le ${created} · niveau ${level} · ${lives} ${lives > 1 ? 'vies' : 'vie'}`,
    levels: 'Voir les 7 niveaux',
    report: (name: string): string => `Signaler ${name}`,
    reportSub: 'On regarde chaque signalement',
    block: (name: string): string => `Bloquer ${name}`,
    blockSub: 'Plus de messages, plus de rencontre',
    leave: 'Quitter ce lien',
    leaveSub: 'Le chat et vos étapes disparaissent pour toi',
    reportTitle: (name: string): TitleSegment[] => [{ text: 'SIGNALER ' }, { text: name.toUpperCase(), dim: true }],
    reportIntro: (name: string): string => `${name} ne saura pas que ça vient de toi. Dis-nous ce qui ne va pas.`,
    reportReason: 'Qu’est-ce qui se passe ?',
    reportDetails: 'Des détails (facultatif)',
    reportDetailsHint: 'Ce qui s’est passé, quand. Ça nous aide à agir vite.',
    reportNote: 'Précise si tu veux (facultatif)',
    reportNotePlaceholder: 'Ce qui s’est passé, quand…',
    reportAlsoBlock: (name: string): string => `Bloquer ${name} aussi`,
    reportAlsoBlockSub: 'Le lien disparaît de tes chats.',
    reportSend: 'Envoyer le signalement',
    reportEmergency: 'En danger immédiat ? Appelle le 17 ou le 112.',
    reportDone: 'Merci. Ton signalement est envoyé, on le regarde vite.',
    reportPickFirst: 'Choisis une raison.',
    blockTitle: (name: string): TitleSegment[] => [{ text: 'BLOQUER ' }, { text: `${name.toUpperCase()} ?`, dim: true }],
    blockText: (name: string): string =>
      `${name} ne pourra plus t’écrire ni croiser ton minimoa. Ce lien disparaît. Tu pourras revenir dessus depuis Moi › Personnes bloquées.`,
    blockConfirm: 'Bloquer',
    leaveTitle: [{ text: 'QUITTER ' }, { text: 'CE LIEN ?', dim: true }] as TitleSegment[],
    leaveText: (name: string): string => `Ton chat avec ${name} et vos étapes disparaissent pour toi. Ce n’est pas un blocage.`,
    leaveConfirm: 'Quitter le lien',
    cancel: 'Annuler',
    error: 'Ça n’a pas marché. Réessaie.',
    selected: 'Sélectionné',
  },
  en: TODO,
  es: TODO,
  pt: TODO,
  nl: TODO,
});

/** Jours et mois pour les dates courtes. */
export const dates = messages({
  fr: {
    months: ['janv.', 'févr.', 'mars', 'avr.', 'mai', 'juin', 'juil.', 'août', 'sept.', 'oct.', 'nov.', 'déc.'] as const,
    weekdays: ['dimanche', 'lundi', 'mardi', 'mercredi', 'jeudi', 'vendredi', 'samedi'] as const,
    weekdaysShort: ['dim.', 'lun.', 'mar.', 'mer.', 'jeu.', 'ven.', 'sam.'] as const,
    today: 'aujourd’hui',
    yesterday: 'hier',
  },
  en: {
    months: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'],
    weekdays: ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'],
    weekdaysShort: ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'],
    today: 'today',
    yesterday: 'yesterday',
  },
  es: TODO,
  pt: TODO,
  nl: TODO,
});
