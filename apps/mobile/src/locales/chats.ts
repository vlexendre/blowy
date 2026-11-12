/** Textes des chats et des liens (liste, aujourd'hui, chat, souvenirs, fantôme, niveaux, options). */
import type { TitleSegment } from '@blowy/ui';

const low = (s: string): string => s.toLowerCase();

export const tabs = {
  chats: 'Chats',
  pet: 'Mon pet',
  rencontres: 'Rencontres',
  moi: 'Moi',
  a11y: 'Navigation principale',
};

export const chats = {
  brand: 'blowy',
  title: (n: number): TitleSegment[] => [{ text: 'CHATS' }, ...(n > 0 ? [{ text: ` · ${n}`, dim: true }] : [])],
  newChat: 'Rencontrer un nouveau pet',
  wavesKicker: 'rencontres',
  wavesTitle: (pet: string): TitleSegment[] => [{ text: `${pet.toUpperCase()} A CROISÉ ` }, { text: 'QUELQU’UN', dim: true }],
  wavesText: (names: string[]): string =>
    names.length === 1 ? `${names[0]} t’a salué. tu réponds ?` : `${names.slice(0, -1).join(', ')} et ${names.at(-1)} t’ont salué.`,
  wavesA11y: (n: number): string => `${n} ${n > 1 ? 'personnes t’ont salué' : 'personne t’a salué'}. Ouvrir les rencontres.`,
  photoKicker: 'photo du jour',
  photoTitle: (n: number): TitleSegment[] => [{ text: `${n} ${n > 1 ? 'LIENS' : 'LIEN'} ` }, { text: n > 1 ? 'T’ATTENDENT' : 'T’ATTEND', dim: true }],
  photoText: (names: string[]): string =>
    names.length === 1 ? `${low(names[0] ?? '')} veut voir ta tête.` : `${names.slice(0, -1).map(low).join(', ')} et ${low(names.at(-1) ?? '')} veulent voir ta tête.`,
  photoA11y: 'Ouvrir le lien pour envoyer ta photo du jour',
  level: (n: number): string => `niv. ${n}`,
  ghost: 'lien fantôme 👻',
  isNew: 'nouveau',
  emptyPreview: 'dites-vous bonjour 👋',
  emptyTitle: [{ text: 'PAS ENCORE\n' }, { text: 'DE CHAT', dim: true }] as TitleSegment[],
  emptyText: (pet: string): string => `${low(pet)} attend de croiser quelqu’un. va voir les rencontres, ou envoie ton lien à tes potes.`,
  emptyAction: 'voir les rencontres',
  shareInvite: 'partager mon lien d’invitation',
  copied: 'lien copié ✓',
  yourPet: 'ton pet',
  shareMessage: (pet: string, url: string): string => `viens rencontrer ${pet} sur blowy 🐾 ${url}`,
  errorTitle: 'Impossible de charger tes chats',
  retry: 'réessayer',
};

export const link = {
  back: 'Retour aux chats',
  level: (n: number): string => `niveau ${n} ›`,
  levelA11y: (n: number): string => `Niveau ${n} sur 7. Voir les niveaux du lien`,
  lives: (n: number): string => `${n} ${n > 1 ? 'vies' : 'vie'} sur 7`,
  options: 'Options du lien : signaler, bloquer, quitter',
  tabs: { today: 'aujourd’hui', chat: 'chat', memories: 'souvenirs' },
  loadError: 'Impossible d’ouvrir ce lien',
  gone: 'Ce lien n’existe plus.',
  retry: 'réessayer',
  backToChats: 'retour aux chats',
};

export const today = {
  title: [{ text: 'UNE PHOTO\n' }, { text: 'PAR JOUR', dim: true }] as TitleSegment[],
  streakUnit: (n: number): string => (n > 1 ? 'jours' : 'jour'),
  hint: '+1 vie quand vous avez posté tous les deux.',
  mineLabel: 'ta photo',
  mineBadge: 'posté ✓',
  mineEmpty: 'prends ta photo',
  mineEmptyCaption: 'avant minuit',
  theirsWaiting: (name: string): string => `${low(name)} : en attente`,
  theirsWaitingCaption: 'jusqu’à minuit',
  theirsLocked: (name: string): string => `${low(name)} a posté`,
  theirsLockedCaption: 'poste la tienne pour voir',
  theirsLabel: (name: string): string => low(name),
  ctaTake: 'prendre ma photo',
  ctaNudge: (name: string): string => `relancer ${low(name)}`,
  nudgeDraft: 'ta photo du jour ? 📸',
  pickTitle: [{ text: 'TA PHOTO ' }, { text: 'DU JOUR', dim: true }] as TitleSegment[],
  pickText: 'vous ne voyez la photo de l’autre qu’une fois la vôtre postée. une seule par jour.',
  camera: 'prendre une photo',
  library: 'choisir dans mes photos',
  sent: 'Photo envoyée. Elle se range dans vos souvenirs.',
  sending: 'envoi de ta photo…',
  dismiss: 'Fermer',
  alreadyDone: 'Tu as déjà envoyé ta photo du jour ici. Reviens demain.',
  notActive: 'Ce lien dort. Ranime-le pour envoyer ta photo.',
  failed: 'La photo n’est pas partie. Réessaie.',
  livesTitle: (n: number): TitleSegment[] => [{ text: `${n} ${n > 1 ? 'VIES' : 'VIE'} ` }, { text: 'SUR 7', dim: true }],
  livesText: 'un jour entier sans échange coûte une vie. la photo du jour faite à deux en rend une. à 0, le lien devient fantôme.',
  weekTitle: 'cette semaine',
  livesCount: (n: number): string => `${n}/7`,
  todoTitle: 'à faire',
  nextTodo: (level: number, title: string): string => `niv. ${level} · ${low(title)}`,
  halfMark: '1/2',
  streakLabel: (n: number): string => (n > 1 ? 'jours de série' : 'jour de série'),
  weekDays: ['D', 'L', 'M', 'M', 'J', 'V', 'S'] as const,
  nextKicker: 'prochain niveau',
  nextXp: (n: number): string => `encore ${n} xp`,
  nextChip: (n: number): string => `${n} xp`,
  maxKicker: 'dernier niveau',
  maxText: 'vous êtes allés au bout. l’œuf est à vous.',
  nextA11y: 'Voir les niveaux du lien',
};

export const chat = {
  placeholder: (name: string, pet: string): string => `écris à ${low(name)} (${low(pet)} lit tout)`,
  tones: { sweet: 'mot doux', tease: 'vanne' },
  attach: 'Envoyer ta photo du jour',
  send: 'Envoyer',
  ghostDisabled: 'lien fantôme : ranime-le pour écrire',
  sendError: 'Ton message n’est pas parti. Il est toujours là, réessaie.',
  lockedPhoto: 'envoie la tienne pour voir la sienne',
  emptyTitle: [{ text: 'DITES-VOUS\n' }, { text: 'BONJOUR', dim: true }] as TitleSegment[],
  emptyText: (pet: string, otherPet: string): string => `${low(pet)} et ${low(otherPet)} se sont trouvés. à toi le premier mot.`,
  loadError: 'Impossible de charger les messages',
  retry: 'réessayer',
  today: 'aujourd’hui',
  yesterday: 'hier',
};

export const memories = {
  kicker: (a: string, b: string): string => `fait par ${low(a)} & ${low(b)}`,
  title: [{ text: 'VOS\n' }, { text: 'SOUVENIRS', dim: true }] as TitleSegment[],
  subtitle: (days: number, streak: number): string =>
    `${days} ${days > 1 ? 'jours' : 'jour'} ensemble. meilleure série : ${streak} ${streak > 1 ? 'jours' : 'jour'}.`,
  photosTitle: (n: number): TitleSegment[] => [{ text: 'PHOTOS DU JOUR' }, { text: ` · ${n}`, dim: true }],
  blurredHint: 'nettes au niveau 5',
  stats: (s: { messages: number; photos: number; daysTogether: number }) => ({
    messages: s.messages > 1 ? 'messages' : 'message',
    photos: s.photos > 1 ? 'photos du jour' : 'photo du jour',
    daysTogether: s.daysTogether > 1 ? 'jours ensemble' : 'jour ensemble',
    bestStreak: 'meilleure série',
  }),
  empty: 'chaque photo du jour faite à deux se range ici. la première, c’est aujourd’hui ?',
  loadError: 'Impossible de charger vos souvenirs',
  retry: 'réessayer',
};

export const ghost = {
  title: [{ text: 'TU L’AS\n' }, { text: 'GHOSTÉ.', dim: true }] as TitleSegment[],
  badge: (name: string): string => `${name} · lien fantôme`,
  text: (name: string): string => `7 jours de silence avec ${name}. le lien est devenu fantôme.`,
  speech: (name: string): string => `j’ai attendu ${low(name)} une semaine. je suis devenu transparent, c’est normal ?`,
  speaker: (pet: string): string => `${low(pet)}, version fantôme`,
  revive: 'le ranimer',
  reviveHint: '(une seule fois)',
  already: 'déjà ranimé une fois',
  leave: 'le laisser partir',
  reviveError: 'Impossible de le ranimer.',
  cannotRevive: 'Ce lien a déjà été ranimé une fois.',
};

export const levels = {
  header: (name: string): string => `ton lien avec ${name}`,
  kicker: (n: number): string => `niveau ${n} sur 7`,
  /** « EMMÉNAGER / ENSEMBLE » : le dernier mot estompé sur la deuxième ligne. */
  heroTitle: (title: string): TitleSegment[] => {
    const words = title.toUpperCase().split(' ');
    const last = words.pop() ?? '';
    return words.length ? [{ text: `${words.join(' ')}\n` }, { text: last, dim: true }] : [{ text: last }];
  },
  progress: (into: number, span: number, next: number): string => `${into} / ${span} xp avant le niveau ${next}`,
  maxProgress: 'dernier niveau atteint',
  current: 'vous êtes là',
  next: (n: number): string => `encore ${n} xp`,
  livesTitle: (n: number): TitleSegment[] => [{ text: `${n} ${n > 1 ? 'VIES' : 'VIE'} ` }, { text: 'SUR 7', dim: true }],
  livesText: 'un truc fait ensemble = +1 vie. un jour de silence = −1 vie. à 0, le lien devient fantôme.',
};

export const options = {
  close: 'Fermer',
  title: (name: string, pet: string): TitleSegment[] => [{ text: `${name.toUpperCase()} ` }, { text: `ET ${pet.toUpperCase()}`, dim: true }],
  meta: (created: string, level: number, lives: number): string => `lien créé le ${created} · niveau ${level} · ${lives} ${lives > 1 ? 'vies' : 'vie'}`,
  levels: 'voir les 7 niveaux',
  report: (name: string): string => `signaler ${low(name)}`,
  reportSub: 'on regarde chaque signalement',
  block: (name: string): string => `bloquer ${low(name)}`,
  blockSub: 'plus de messages, plus de rencontre',
  leave: 'quitter ce lien',
  leaveSub: 'les souvenirs sont effacés pour toi',
  reportTitle: (name: string): TitleSegment[] => [{ text: 'SIGNALER ' }, { text: name.toUpperCase(), dim: true }],
  reportIntro: (name: string): string => `${low(name)} ne saura pas que ça vient de toi. dis-nous ce qui ne va pas.`,
  reportReason: 'qu’est-ce qui se passe ?',
  reportDetails: 'des détails (facultatif)',
  reportDetailsHint: 'ce qui s’est passé, quand. ça nous aide à agir vite.',
  reportNote: 'précise si tu veux (facultatif)',
  reportNotePlaceholder: 'ce qui s’est passé, quand…',
  reportAlsoBlock: (name: string): string => `bloquer ${low(name)} aussi`,
  reportAlsoBlockSub: 'le lien disparaît de tes chats.',
  reportSend: 'envoyer le signalement',
  reportEmergency: 'en danger immédiat ? appelle le 17 ou le 112.',
  reportDone: 'Merci. Ton signalement est envoyé, on le regarde vite.',
  reportPickFirst: 'Choisis une raison.',
  blockTitle: (name: string): TitleSegment[] => [{ text: 'BLOQUER ' }, { text: `${name.toUpperCase()} ?`, dim: true }],
  blockText: (name: string): string =>
    `${name} ne pourra plus t’écrire ni croiser ton pet. ce lien disparaît. tu pourras revenir dessus depuis Moi › personnes bloquées.`,
  blockConfirm: 'bloquer',
  leaveTitle: [{ text: 'QUITTER ' }, { text: 'CE LIEN ?', dim: true }] as TitleSegment[],
  leaveText: (name: string): string => `ton chat avec ${name} et vos souvenirs disparaissent pour toi. ce n’est pas un blocage.`,
  leaveConfirm: 'quitter le lien',
  cancel: 'annuler',
  error: 'Ça n’a pas marché. Réessaie.',
  selected: 'sélectionné',
};

/** Jours et mois pour les dates courtes. */
export const dates = {
  months: ['janv.', 'févr.', 'mars', 'avr.', 'mai', 'juin', 'juil.', 'août', 'sept.', 'oct.', 'nov.', 'déc.'] as const,
  weekdays: ['dimanche', 'lundi', 'mardi', 'mercredi', 'jeudi', 'vendredi', 'samedi'] as const,
  weekdaysShort: ['dim.', 'lun.', 'mar.', 'mer.', 'jeu.', 'ven.', 'sam.'] as const,
  today: 'aujourd’hui',
  yesterday: 'hier',
};
