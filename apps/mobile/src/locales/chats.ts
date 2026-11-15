/** Textes des chats et des liens (liste, aujourd'hui, chat, souvenirs, fantôme, niveaux, options). */
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
    photoKicker: 'Photo du jour',
    photoTitle: (n: number): TitleSegment[] => [{ text: `${n} ${n > 1 ? 'LIENS' : 'LIEN'} ` }, { text: n > 1 ? 'T’ATTENDENT' : 'T’ATTEND', dim: true }],
    photoText: (names: string[]): string =>
      names.length === 1 ? `${names[0] ?? ''} veut voir ta tête.` : `${names.slice(0, -1).join(', ')} et ${names.at(-1) ?? ''} veulent voir ta tête.`,
    photoA11y: 'Ouvrir le lien pour envoyer ta photo du jour',
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
    tabs: { today: 'Aujourd’hui', chat: 'Chat', memories: 'Souvenirs' },
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

export const today = messages({
  fr: {
    title: [{ text: 'UNE PHOTO\n' }, { text: 'PAR JOUR', dim: true }] as TitleSegment[],
    streakUnit: (n: number): string => (n > 1 ? 'jours' : 'jour'),
    hint: '+1 vie quand vous avez posté l’un et l’autre.',
    mineLabel: 'Ta photo',
    mineBadge: 'Posté ✓',
    mineEmpty: 'Prends ta photo',
    mineEmptyCaption: 'Avant minuit',
    theirsWaiting: (name: string): string => `${name} : en attente`,
    theirsWaitingCaption: 'Jusqu’à minuit',
    theirsLocked: (name: string): string => `${name} a posté`,
    theirsLockedCaption: 'Poste la tienne pour voir',
    theirsLabel: (name: string): string => name,
    ctaTake: 'Prendre ma photo',
    ctaNudge: (name: string): string => `Relancer ${name}`,
    nudgeDraft: 'Ta photo du jour ? 📸',
    pickTitle: [{ text: 'TA PHOTO ' }, { text: 'DU JOUR', dim: true }] as TitleSegment[],
    pickText: 'Vous ne voyez la photo de l’autre qu’une fois la vôtre postée. Une seule par jour.',
    camera: 'Prendre une photo',
    library: 'Choisir dans mes photos',
    sent: 'Photo envoyée. Elle se range dans vos souvenirs.',
    sending: 'Envoi de ta photo…',
    dismiss: 'Fermer',
    alreadyDone: 'Tu as déjà envoyé ta photo du jour ici. Reviens demain.',
    notActive: 'Ce lien dort. Ranime-le pour envoyer ta photo.',
    failed: 'La photo n’est pas partie. Réessaie.',
    livesTitle: (n: number): TitleSegment[] => [{ text: `${n} ${n > 1 ? 'VIES' : 'VIE'} ` }, { text: 'SUR 7', dim: true }],
    livesText: 'Un jour entier sans échange coûte une vie. La photo du jour faite à deux en rend une. À 0, le lien devient fantôme.',
    weekTitle: 'Cette semaine',
    livesCount: (n: number): string => `${n}/7`,
    todoTitle: 'À faire',
    nextTodo: (level: number, title: string): string => `Niv. ${level} · ${title.toLowerCase()}`,
    halfMark: '1/2',
    streakLabel: (n: number): string => (n > 1 ? 'jours de série' : 'jour de série'),
    weekDays: ['D', 'L', 'M', 'M', 'J', 'V', 'S'] as const,
    nextKicker: 'Prochain niveau',
    nextXp: (n: number): string => `Encore ${n} xp`,
    nextChip: (n: number): string => `${n} xp`,
    maxKicker: 'Dernier niveau',
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
    attach: 'Envoyer ta photo du jour',
    send: 'Envoyer',
    ghostDisabled: 'Lien fantôme : ranime-le pour écrire',
    sendError: 'Ton message n’est pas parti. Il est toujours là, réessaie.',
    lockedPhoto: 'Envoie la tienne pour voir la sienne',
    typing: (name: string): string => `${name} écrit…`,
    emptyTitle: [{ text: 'DITES-VOUS\n' }, { text: 'BONJOUR', dim: true }] as TitleSegment[],
    emptyText: (pet: string, otherPet: string): string => `${pet} et ${otherPet} se sont trouvés. À toi le premier mot.`,
    loadError: 'Impossible de charger les messages',
    retry: 'Réessayer',
    today: 'Aujourd’hui',
    yesterday: 'Hier',
    /** Nom au-dessus d'une réplique de minimoa : « nino · brise-glace ». */
    role: (role: 'icebreaker' | 'nudge' | 'remark' | 'guard' | 'event', name: string): string =>
      `${name} · ${{ icebreaker: 'brise-glace', nudge: 'relance', remark: 'remarque', guard: 'garde-fou, pour toi seul', event: 'annonce' }[role]}`,
    /** Sous le fil, au-dessus du champ. */
    rhythm: (max: number): string => `Les minimoas parlent ${max} fois par jour au plus.`,
    rhythmNoReading: (max: number): string => `Sans lecture : ils réagissent au rythme (silences, photos, défis), ${max} fois par jour au plus.`,
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

export const memories = messages({
  fr: {
    kicker: (a: string, b: string): string => `Fait par ${a} & ${b}`,
    title: [{ text: 'VOS\n' }, { text: 'SOUVENIRS', dim: true }] as TitleSegment[],
    subtitle: (days: number, streak: number): string =>
      `${days} ${days > 1 ? 'jours' : 'jour'} ensemble. Meilleure série : ${streak} ${streak > 1 ? 'jours' : 'jour'}.`,
    photosTitle: 'PHOTOS DU JOUR',
    blurredHint: 'Nettes au niveau 5',
    stats: (s: { messages: number; photos: number; daysTogether: number }) => ({
      messages: s.messages > 1 ? 'messages' : 'message',
      photos: s.photos > 1 ? 'photos du jour' : 'photo du jour',
      daysTogether: s.daysTogether > 1 ? 'jours ensemble' : 'jour ensemble',
      bestStreak: 'meilleure série',
    }),
    empty: 'Chaque photo du jour faite à deux se range ici. La première, c’est aujourd’hui ?',
    loadError: 'Impossible de charger vos souvenirs',
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
    ifRefused: (mine: string, theirs: string): string => `Si l’un de vous refuse, ${mine} et ${theirs} réagissent seulement au rythme : silences, photos, défis. Sans rien lire.`,
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
      { key: 'guard', icon: 'coeurs', title: 'Garde-fou', text: 'Si le ton monte, ton minimoa te propose une pause. À toi seul.' },
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
    livesText: 'Un truc fait ensemble = +1 vie. Un jour de silence = −1 vie. À 0, le lien devient fantôme.',
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
    leaveSub: 'Les souvenirs sont effacés pour toi',
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
    leaveText: (name: string): string => `Ton chat avec ${name} et vos souvenirs disparaissent pour toi. Ce n’est pas un blocage.`,
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
