/** Textes des chats et des liens (liste, chat, « Le lien » et ses étapes, état du lien, lien endormi, niveaux, options). */
import type { TitleSegment } from '@blowy/ui';
import { messages } from './runtime';

/**
 * Les quatre onglets (ADA 2027, décision 8) : Minimoa · Quartier · Chats · Moi, libellés visibles sous chaque
 * pictogramme. Courts : ils tiennent sur une ligne à 320 pt dans les cinq langues. `badgeA11y` : la pastille lue par
 * VoiceOver avec le nom de l'onglet.
 */
export const tabs = messages({
  fr: {
    pet: 'Minimoa',
    quartier: 'Quartier',
    chats: 'Chats',
    moi: 'Moi',
    a11y: 'Navigation principale',
    badgeA11y: {
      chats: (tab: string, n: number): string => `${tab}, ${n} ${n > 1 ? 'non lus' : 'non lu'}`,
      quartier: (tab: string, n: number): string => `${tab}, ${n} ${n > 1 ? 'bonjours reçus' : 'bonjour reçu'}`,
    },
  },
  en: {
    pet: 'Minimoa',
    quartier: 'Nearby',
    chats: 'Chats',
    moi: 'Me',
    a11y: 'Main navigation',
    badgeA11y: {
      chats: (tab: string, n: number): string => `${tab}, ${n} unread`,
      quartier: (tab: string, n: number): string => `${tab}, ${n} ${n === 1 ? 'hello received' : 'hellos received'}`,
    },
  },
  es: {
    pet: 'Minimoa',
    quartier: 'Barrio',
    chats: 'Chats',
    moi: 'Yo',
    a11y: 'Navegación principal',
    badgeA11y: {
      chats: (tab: string, n: number): string => `${tab}, ${n} sin leer`,
      quartier: (tab: string, n: number): string => `${tab}, ${n} ${n === 1 ? 'saludo recibido' : 'saludos recibidos'}`,
    },
  },
  pt: {
    pet: 'Minimoa',
    quartier: 'Bairro',
    chats: 'Chats',
    moi: 'Eu',
    a11y: 'Navegação principal',
    badgeA11y: {
      chats: (tab: string, n: number): string => `${tab}, ${n} ${n === 1 ? 'não lida' : 'não lidas'}`,
      quartier: (tab: string, n: number): string => `${tab}, ${n} ${n === 1 ? 'oi recebido' : 'ois recebidos'}`,
    },
  },
  nl: {
    pet: 'Minimoa',
    quartier: 'Buurt',
    chats: 'Chats',
    moi: 'Ik',
    a11y: 'Hoofdnavigatie',
    badgeA11y: {
      chats: (tab: string, n: number): string => `${tab}, ${n} ongelezen`,
      quartier: (tab: string, n: number): string => `${tab}, ${n} ${n === 1 ? 'hallo ontvangen' : 'hallo’s ontvangen'}`,
    },
  },
});

export const chats = messages({
  fr: {
    brand: 'minimoa',
    title: (n: number): TitleSegment[] => [
      { text: 'CHATS' },
      ...(n > 0 ? [{ text: ` · ${n}`, dim: true }] : []),
    ],
    newChat: 'Rencontrer un nouveau minimoa',
    wavesKicker: 'Rencontres',
    wavesTitle: (pet: string): TitleSegment[] => [
      { text: `${pet.toUpperCase()} A TROUVÉ ` },
      { text: 'QUELQU’UN', dim: true },
    ],
    wavesText: (names: string[]): string =>
      names.length === 1
        ? `${names[0]} te fait signe. Tu réponds ?`
        : `${names.slice(0, -1).join(', ')} et ${names.at(-1)} te font signe.`,
    wavesA11y: (n: number): string =>
      `${n} ${n > 1 ? 'personnes te font signe' : 'personne te fait signe'}. Ouvrir les rencontres.`,
    /** Bandeau : des séries en jeu ce soir, l'autre a écrit, pas toi. */
    turnKicker: 'Un mot t’attend',
    turnTitle: (n: number): TitleSegment[] => [
      { text: `${n} ${n > 1 ? 'LIENS' : 'LIEN'} ` },
      { text: n > 1 ? 'T’ATTENDENT' : 'T’ATTEND', dim: true },
    ],
    turnText: (names: string[]): string =>
      names.length === 1
        ? `${names[0] ?? ''} t’a écrit aujourd’hui. Un petit mot et votre série continue.`
        : `${names.slice(0, -1).join(', ')} et ${names.at(-1) ?? ''} t’ont écrit aujourd’hui. Un petit mot et vos séries continuent.`,
    turnA11y: 'Ouvrir le chat pour répondre',
    /** Ligne d'un lien : série (« 5 j ») et « à toi » quand l'autre a écrit aujourd'hui, pas toi. */
    streakUnit: 'j',
    turn: 'À toi',
    level: (n: number): string => `Niv. ${n}`,
    /** L'état du lien quand il demande un peu d'attention (ADA-2027 item 27), sous l'aperçu. */
    mood: { moment: 'Un mot lui ferait plaisir', endormi: 'Lien endormi' },
    isNew: 'Nouveau',
    introducedBy: (pet: string): string => `Présentés par ${pet}`,
    emptyPreview: 'Dites-vous bonjour.',
    emptyTitle: [{ text: 'PAS ENCORE\n' }, { text: 'DE CHAT', dim: true }] as TitleSegment[],
    emptyText: (pet: string): string => `${pet} attend de croiser quelqu’un.`,
    emptyAction: 'Voir les rencontres',
    shareInvite: 'Partager mon lien d’invitation',
    copied: 'Lien copié ✓',
    yourPet: 'Ton minimoa',
    shareMessage: (pet: string, url: string): string => `Viens rencontrer ${pet} sur Minimoa : ${url}`,
    errorTitle: 'Impossible de charger tes chats',
    retry: 'Réessayer',
  },
  en: {
    brand: 'minimoa',
    title: (n: number): TitleSegment[] => [
      { text: 'CHATS' },
      ...(n > 0 ? [{ text: ` · ${n}`, dim: true }] : []),
    ],
    newChat: 'Meet a new minimoa',
    wavesKicker: 'Encounters',
    wavesTitle: (pet: string): TitleSegment[] => [
      { text: `${pet.toUpperCase()} FOUND ` },
      { text: 'SOMEONE', dim: true },
    ],
    wavesText: (names: string[]): string =>
      names.length === 1
        ? `${names[0]} waved at you. Wave back?`
        : `${names.slice(0, -1).join(', ')} and ${names.at(-1)} waved at you.`,
    wavesA11y: (n: number): string => `${n} ${n === 1 ? 'person' : 'people'} waved at you. Open encounters.`,
    turnKicker: 'A word is waiting',
    turnTitle: (n: number): TitleSegment[] => [
      { text: `${n} ${n === 1 ? 'LINK' : 'LINKS'} ` },
      { text: 'WAITING ON YOU', dim: true },
    ],
    turnText: (names: string[]): string =>
      names.length === 1
        ? `${names[0] ?? ''} wrote to you today. Reply whenever you like and your streak keeps going.`
        : `${names.slice(0, -1).join(', ')} and ${names.at(-1) ?? ''} wrote to you today. Reply whenever you like and your streaks keep going.`,
    turnA11y: 'Open the chat to reply',
    streakUnit: 'd',
    turn: 'Your turn',
    level: (n: number): string => `Lv. ${n}`,
    /** L'état du lien quand il demande un peu d'attention (ADA-2027 item 27), sous l'aperçu. */
    mood: { moment: 'A word would make their day', endormi: 'Sleeping link' },
    isNew: 'New',
    introducedBy: (pet: string): string => `Introduced by ${pet}`,
    emptyPreview: 'Say hello.',
    emptyTitle: [{ text: 'NO CHATS\n' }, { text: 'YET', dim: true }],
    emptyText: (pet: string): string => `${pet} is waiting to meet someone.`,
    emptyAction: 'See encounters',
    shareInvite: 'Share my invite link',
    copied: 'Link copied ✓',
    yourPet: 'Your minimoa',
    shareMessage: (pet: string, url: string): string => `Come meet ${pet} on Minimoa: ${url}`,
    errorTitle: 'Couldn’t load your chats',
    retry: 'Try again',
  },
  es: {
    brand: 'minimoa',
    title: (n: number): TitleSegment[] => [
      { text: 'CHATS' },
      ...(n > 0 ? [{ text: ` · ${n}`, dim: true }] : []),
    ],
    newChat: 'Conocer a un nuevo minimoa',
    wavesKicker: 'Encuentros',
    wavesTitle: (pet: string): TitleSegment[] => [
      { text: `${pet.toUpperCase()} ENCONTRÓ A ` },
      { text: 'ALGUIEN', dim: true },
    ],
    wavesText: (names: string[]): string =>
      names.length === 1
        ? `${names[0]} te ha saludado. ¿Respondes?`
        : `${names.slice(0, -1).join(', ')} y ${names.at(-1)} te han saludado.`,
    wavesA11y: (n: number): string =>
      `${n} ${n === 1 ? 'persona te ha saludado' : 'personas te han saludado'}. Abrir encuentros.`,
    turnKicker: 'Te espera un mensaje',
    turnTitle: (n: number): TitleSegment[] => [
      { text: `${n} ${n === 1 ? 'VÍNCULO' : 'VÍNCULOS'} ` },
      { text: n === 1 ? 'TE ESPERA' : 'TE ESPERAN', dim: true },
    ],
    turnText: (names: string[]): string =>
      names.length === 1
        ? `${names[0] ?? ''} te ha escrito hoy. Responde cuando quieras y la racha sigue.`
        : `${names.slice(0, -1).join(', ')} y ${names.at(-1) ?? ''} te han escrito hoy. Responde cuando quieras y las rachas siguen.`,
    turnA11y: 'Abrir el chat para responder',
    streakUnit: 'd',
    turn: 'Te toca',
    level: (n: number): string => `Niv. ${n}`,
    /** L'état du lien quand il demande un peu d'attention (ADA-2027 item 27), sous l'aperçu. */
    mood: { moment: 'Un mensaje le haría ilusión', endormi: 'Vínculo dormido' },
    isNew: 'Nuevo',
    introducedBy: (pet: string): string => `Presentados por ${pet}`,
    emptyPreview: 'Salúdense.',
    emptyTitle: [{ text: 'AÚN NO\n' }, { text: 'HAY CHATS', dim: true }],
    emptyText: (pet: string): string => `${pet} espera cruzarse con alguien.`,
    emptyAction: 'Ver encuentros',
    shareInvite: 'Compartir mi enlace de invitación',
    copied: 'Enlace copiado ✓',
    yourPet: 'Tu minimoa',
    shareMessage: (pet: string, url: string): string => `Ven a conocer a ${pet} en Minimoa: ${url}`,
    errorTitle: 'No se pudieron cargar tus chats',
    retry: 'Reintentar',
  },
  pt: {
    brand: 'minimoa',
    title: (n: number): TitleSegment[] => [
      { text: 'CHATS' },
      ...(n > 0 ? [{ text: ` · ${n}`, dim: true }] : []),
    ],
    newChat: 'Conhecer um novo minimoa',
    wavesKicker: 'Encontros',
    wavesTitle: (pet: string): TitleSegment[] => [
      { text: `${pet.toUpperCase()} ACHOU ` },
      { text: 'ALGUÉM', dim: true },
    ],
    wavesText: (names: string[]): string =>
      names.length === 1
        ? `${names[0]} acenou para você. Vai responder?`
        : `${names.slice(0, -1).join(', ')} e ${names.at(-1)} acenaram para você.`,
    wavesA11y: (n: number): string =>
      `${n} ${n === 1 ? 'pessoa acenou' : 'pessoas acenaram'} para você. Abrir encontros.`,
    turnKicker: 'Uma mensagem espera você',
    turnTitle: (n: number): TitleSegment[] => [
      { text: `${n} ${n === 1 ? 'VÍNCULO' : 'VÍNCULOS'} ` },
      { text: 'ESPERANDO VOCÊ', dim: true },
    ],
    turnText: (names: string[]): string =>
      names.length === 1
        ? `${names[0] ?? ''} escreveu para você hoje. Responda quando quiser e a sequência continua.`
        : `${names.slice(0, -1).join(', ')} e ${names.at(-1) ?? ''} escreveram para você hoje. Responda quando quiser e as sequências continuam.`,
    turnA11y: 'Abrir o chat para responder',
    streakUnit: 'd',
    turn: 'Sua vez',
    level: (n: number): string => `Nív. ${n}`,
    /** L'état du lien quand il demande un peu d'attention (ADA-2027 item 27), sous l'aperçu. */
    mood: { moment: 'Uma mensagem ia alegrar o dia', endormi: 'Vínculo dormindo' },
    isNew: 'Novo',
    introducedBy: (pet: string): string => `Apresentados por ${pet}`,
    emptyPreview: 'Digam oi.',
    emptyTitle: [{ text: 'AINDA SEM\n' }, { text: 'CHATS', dim: true }],
    emptyText: (pet: string): string => `${pet} está esperando cruzar com alguém.`,
    emptyAction: 'Ver encontros',
    shareInvite: 'Compartilhar meu link de convite',
    copied: 'Link copiado ✓',
    yourPet: 'Seu minimoa',
    shareMessage: (pet: string, url: string): string => `Vem conhecer ${pet} no Minimoa: ${url}`,
    errorTitle: 'Não foi possível carregar seus chats',
    retry: 'Tentar de novo',
  },
  nl: {
    brand: 'minimoa',
    title: (n: number): TitleSegment[] => [
      { text: 'CHATS' },
      ...(n > 0 ? [{ text: ` · ${n}`, dim: true }] : []),
    ],
    newChat: 'Een nieuwe minimoa ontmoeten',
    wavesKicker: 'Ontmoetingen',
    wavesTitle: (pet: string): TitleSegment[] => [
      { text: `${pet.toUpperCase()} VOND ` },
      { text: 'IEMAND', dim: true },
    ],
    wavesText: (names: string[]): string =>
      names.length === 1
        ? `${names[0]} zwaait naar je. Zwaai je terug?`
        : `${names.slice(0, -1).join(', ')} en ${names.at(-1)} zwaaien naar je.`,
    wavesA11y: (n: number): string =>
      `${n} ${n === 1 ? 'persoon zwaait' : 'personen zwaaien'} naar je. Ontmoetingen openen.`,
    turnKicker: 'Een berichtje wacht',
    turnTitle: (n: number): TitleSegment[] => [
      { text: `${n} ${n === 1 ? 'BAND' : 'BANDEN'} ` },
      { text: n === 1 ? 'WACHT OP JE' : 'WACHTEN OP JE', dim: true },
    ],
    turnText: (names: string[]): string =>
      names.length === 1
        ? `${names[0] ?? ''} heeft je vandaag geschreven. Antwoord wanneer je wilt en jullie reeks gaat door.`
        : `${names.slice(0, -1).join(', ')} en ${names.at(-1) ?? ''} hebben je vandaag geschreven. Antwoord wanneer je wilt en je reeksen gaan door.`,
    turnA11y: 'Chat openen om te antwoorden',
    streakUnit: 'd',
    turn: 'Aan jou',
    level: (n: number): string => `Niv. ${n}`,
    /** L'état du lien quand il demande un peu d'attention (ADA-2027 item 27), sous l'aperçu. */
    mood: { moment: 'Een berichtje doet vast goed', endormi: 'Slapende band' },
    isNew: 'Nieuw',
    introducedBy: (pet: string): string => `Voorgesteld door ${pet}`,
    emptyPreview: 'Zeg hallo.',
    emptyTitle: [{ text: 'NOG GEEN\n' }, { text: 'CHATS', dim: true }],
    emptyText: (pet: string): string => `${pet} wacht tot hij iemand tegenkomt.`,
    emptyAction: 'Ontmoetingen bekijken',
    shareInvite: 'Mijn uitnodigingslink delen',
    copied: 'Link gekopieerd ✓',
    yourPet: 'Je minimoa',
    shareMessage: (pet: string, url: string): string => `Kom ${pet} ontmoeten op Minimoa: ${url}`,
    errorTitle: 'Je chats konden niet worden geladen',
    retry: 'Opnieuw',
  },
});

export const link = messages({
  fr: {
    back: 'Retour aux chats',
    level: (n: number): string => `Niveau ${n} ›`,
    /** En-tête chargé (interrupteur des minimoas) : version courte. */
    levelShort: (n: number): string => `Niv. ${n} ›`,
    options: 'Options du lien : signaler, bloquer, quitter',
    tabs: { chat: 'Chat', lien: 'Le lien', souvenirs: 'Souvenirs' },
    loadError: 'Impossible d’ouvrir ce lien',
    gone: 'Ce lien n’existe plus.',
    retry: 'Réessayer',
    backToChats: 'Retour aux chats',
  },
  en: {
    back: 'Back to chats',
    level: (n: number): string => `Level ${n} ›`,
    levelShort: (n: number): string => `Lv. ${n} ›`,
    options: 'Link options: report, block, leave',
    tabs: { chat: 'Chat', lien: 'The link', souvenirs: 'Memories' },
    loadError: 'Couldn’t open this link',
    gone: 'This link no longer exists.',
    retry: 'Try again',
    backToChats: 'Back to chats',
  },
  es: {
    back: 'Volver a los chats',
    level: (n: number): string => `Nivel ${n} ›`,
    levelShort: (n: number): string => `Niv. ${n} ›`,
    options: 'Opciones del vínculo: reportar, bloquear, salir',
    tabs: { chat: 'Chat', lien: 'El vínculo', souvenirs: 'Recuerdos' },
    loadError: 'No se pudo abrir este vínculo',
    gone: 'Este vínculo ya no existe.',
    retry: 'Reintentar',
    backToChats: 'Volver a los chats',
  },
  pt: {
    back: 'Voltar aos chats',
    level: (n: number): string => `Nível ${n} ›`,
    levelShort: (n: number): string => `Nív. ${n} ›`,
    options: 'Opções do vínculo: denunciar, bloquear, sair',
    tabs: { chat: 'Chat', lien: 'O vínculo', souvenirs: 'Lembranças' },
    loadError: 'Não foi possível abrir este vínculo',
    gone: 'Este vínculo não existe mais.',
    retry: 'Tentar de novo',
    backToChats: 'Voltar aos chats',
  },
  nl: {
    back: 'Terug naar chats',
    level: (n: number): string => `Niveau ${n} ›`,
    levelShort: (n: number): string => `Niv. ${n} ›`,
    options: 'Opties van de band: melden, blokkeren, verlaten',
    tabs: { chat: 'Chat', lien: 'De band', souvenirs: 'Herinneringen' },
    loadError: 'Deze band kon niet worden geopend',
    gone: 'Deze band bestaat niet meer.',
    retry: 'Opnieuw',
    backToChats: 'Terug naar chats',
  },
});

/**
 * Onglet « Le lien » : la journée du lien (spéc §24), la ligne d'aide de son état, le prochain niveau.
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
        next > 1
          ? `${name} t’a écrit. Réponds quand tu veux et la série passe à ${next}.`
          : `${name} t’a écrit. Réponds quand tu veux et votre série commence.`,
    },
    theirTurn: {
      title: (name: string): TitleSegment[] => [
        { text: 'AU TOUR\n' },
        { text: `DE ${name.toUpperCase()}`, dim: true },
      ],
      text: (name: string, next: number): string =>
        next > 1
          ? `Tu as écrit. Quand ${name} répond, la série passe à ${next}.`
          : `Tu as écrit. Quand ${name} répond, votre série commence.`,
    },
    atStake: {
      title: [{ text: 'SÉRIE\n' }, { text: 'EN COURS', dim: true }] as TitleSegment[],
      text: (n: number): string =>
        `${n} ${n > 1 ? 'jours' : 'jour'} d’affilée. Un message de chaque côté chaque jour, et ça continue.`,
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
    /** Une seule ligne d'aide sous l'état du lien (onglet « Le lien »). */
    help:
      'Chaque jour où vous vous écrivez fait grandir le lien. Après une pause, il se réveille dès qu’un mot arrive.',
  },
  en: {
    streakUnit: (n: number): string => (n === 1 ? 'day' : 'days'),
    streakA11y: (n: number): string =>
      `Streak: ${n} ${n === 1 ? 'day' : 'days'} in a row writing to each other`,
    both: {
      title: [{ text: 'YOU BOTH\n' }, { text: 'WROTE', dim: true }],
      text: (n: number): string => `${n} ${n === 1 ? 'day' : 'days'} in a row. Same again tomorrow.`,
    },
    yourTurn: {
      title: [{ text: 'YOUR TURN\n' }, { text: 'TO WRITE', dim: true }],
      text: (name: string, next: number): string =>
        next > 1
          ? `${name} wrote to you. Reply whenever you like and the streak goes to ${next}.`
          : `${name} wrote to you. Reply whenever you like and your streak begins.`,
    },
    theirTurn: {
      title: (name: string): TitleSegment[] => [
        { text: 'NOW IT’S\n' },
        { text: `${name.toUpperCase()}’S TURN`, dim: true },
      ],
      text: (name: string, next: number): string =>
        next > 1
          ? `You wrote. When ${name} replies, the streak goes to ${next}.`
          : `You wrote. When ${name} replies, your streak begins.`,
    },
    atStake: {
      title: [{ text: 'STREAK\n' }, { text: 'GOING STRONG', dim: true }],
      text: (n: number): string =>
        `${n} ${n === 1 ? 'day' : 'days'} in a row. One message from each side each day keeps it going.`,
    },
    fresh: {
      title: [{ text: 'ONE WORD\n' }, { text: 'FROM EACH SIDE', dim: true }],
      text: 'One message from you and one from them on the same day, and your streak begins. Every day in a row makes it grow.',
    },
    me: 'You',
    wrote: 'Wrote',
    waiting: 'Not yet',
    ctaWrite: (name: string): string => `Write to ${name}`,
    ctaBack: 'Back to the chat',
    dismiss: 'Close',
    help:
      'Every day you write to each other makes the link grow. After a break, it wakes up the moment a word arrives.',
  },
  es: {
    streakUnit: (n: number): string => (n === 1 ? 'día' : 'días'),
    streakA11y: (n: number): string => `Racha: ${n} ${n === 1 ? 'día' : 'días'} seguidos escribiéndose`,
    both: {
      title: [{ text: 'MENSAJES\n' }, { text: 'CRUZADOS', dim: true }],
      text: (n: number): string => `${n} ${n === 1 ? 'día' : 'días'} seguidos. Mañana, otra vez.`,
    },
    yourTurn: {
      title: [{ text: 'TE TOCA\n' }, { text: 'ESCRIBIR', dim: true }],
      text: (name: string, next: number): string =>
        next > 1
          ? `${name} te ha escrito. Responde cuando quieras y la racha sube a ${next}.`
          : `${name} te ha escrito. Responde cuando quieras y empieza la racha.`,
    },
    theirTurn: {
      title: (name: string): TitleSegment[] => [
        { text: 'AHORA LE TOCA\n' },
        { text: `A ${name.toUpperCase()}`, dim: true },
      ],
      text: (name: string, next: number): string =>
        next > 1
          ? `Ya escribiste. Cuando ${name} responda, la racha sube a ${next}.`
          : `Ya escribiste. Cuando ${name} responda, empieza la racha.`,
    },
    atStake: {
      title: [{ text: 'RACHA\n' }, { text: 'EN MARCHA', dim: true }],
      text: (n: number): string =>
        `${n} ${n === 1 ? 'día' : 'días'} seguidos. Un mensaje de cada lado cada día y sigue.`,
    },
    fresh: {
      title: [{ text: 'UNA PALABRA\n' }, { text: 'DE CADA LADO', dim: true }],
      text: 'Un mensaje tuyo y uno de la otra persona en el mismo día, y empieza la racha. Cada día seguido la hace crecer.',
    },
    me: 'Tú',
    wrote: 'Escribió',
    waiting: 'Aún no',
    ctaWrite: (name: string): string => `Escribir a ${name}`,
    ctaBack: 'Volver al chat',
    dismiss: 'Cerrar',
    help:
      'Cada día que se escriben hace crecer el vínculo. Tras una pausa, se despierta en cuanto llega una palabra.',
  },
  pt: {
    streakUnit: (n: number): string => (n === 1 ? 'dia' : 'dias'),
    streakA11y: (n: number): string =>
      `Sequência: ${n} ${n === 1 ? 'dia' : 'dias'} seguidos escrevendo um para o outro`,
    both: {
      title: [{ text: 'VOCÊS SE\n' }, { text: 'ESCREVERAM', dim: true }],
      text: (n: number): string => `${n} ${n === 1 ? 'dia' : 'dias'} seguidos. Amanhã tem mais.`,
    },
    yourTurn: {
      title: [{ text: 'SUA VEZ\n' }, { text: 'DE ESCREVER', dim: true }],
      text: (name: string, next: number): string =>
        next > 1
          ? `${name} escreveu para você. Responda quando quiser e a sequência vai para ${next}.`
          : `${name} escreveu para você. Responda quando quiser e a sequência de vocês começa.`,
    },
    theirTurn: {
      title: (name: string): TitleSegment[] => [
        { text: 'AGORA É A VEZ\n' },
        { text: `DE ${name.toUpperCase()}`, dim: true },
      ],
      text: (name: string, next: number): string =>
        next > 1
          ? `Você escreveu. Quando ${name} responder, a sequência vai para ${next}.`
          : `Você escreveu. Quando ${name} responder, a sequência de vocês começa.`,
    },
    atStake: {
      title: [{ text: 'SEQUÊNCIA\n' }, { text: 'EM ANDAMENTO', dim: true }],
      text: (n: number): string =>
        `${n} ${n === 1 ? 'dia' : 'dias'} seguidos. Uma mensagem de cada lado por dia e ela continua.`,
    },
    fresh: {
      title: [{ text: 'UMA PALAVRA\n' }, { text: 'DE CADA LADO', dim: true }],
      text: 'Uma mensagem sua e uma da outra pessoa no mesmo dia, e a sequência de vocês começa. Cada dia seguido faz ela crescer.',
    },
    me: 'Você',
    wrote: 'Escreveu',
    waiting: 'Ainda não',
    ctaWrite: (name: string): string => `Escrever para ${name}`,
    ctaBack: 'Voltar ao chat',
    dismiss: 'Fechar',
    help:
      'Cada dia em que vocês se escrevem faz o vínculo crescer. Depois de uma pausa, ele acorda assim que chega uma palavra.',
  },
  nl: {
    streakUnit: (n: number): string => (n === 1 ? 'dag' : 'dagen'),
    streakA11y: (n: number): string => `Reeks: ${n} ${n === 1 ? 'dag' : 'dagen'} op rij elkaar geschreven`,
    both: {
      title: [{ text: 'JULLIE HEBBEN\n' }, { text: 'GESCHREVEN', dim: true }],
      text: (n: number): string => `${n} ${n === 1 ? 'dag' : 'dagen'} op rij. Morgen weer.`,
    },
    yourTurn: {
      title: [{ text: 'JOUW BEURT\n' }, { text: 'OM TE SCHRIJVEN', dim: true }],
      text: (name: string, next: number): string =>
        next > 1
          ? `${name} heeft je geschreven. Antwoord wanneer je wilt en de reeks gaat naar ${next}.`
          : `${name} heeft je geschreven. Antwoord wanneer je wilt en jullie reeks begint.`,
    },
    theirTurn: {
      title: (name: string): TitleSegment[] => [
        { text: 'NU IS\n' },
        { text: `${name.toUpperCase()} AAN DE BEURT`, dim: true },
      ],
      text: (name: string, next: number): string =>
        next > 1
          ? `Je hebt geschreven. Zodra ${name} antwoordt, gaat de reeks naar ${next}.`
          : `Je hebt geschreven. Zodra ${name} antwoordt, begint jullie reeks.`,
    },
    atStake: {
      title: [{ text: 'REEKS\n' }, { text: 'LOOPT', dim: true }],
      text: (n: number): string =>
        `${n} ${n === 1 ? 'dag' : 'dagen'} op rij. Eén bericht van elke kant per dag en hij gaat door.`,
    },
    fresh: {
      title: [{ text: 'EEN WOORD\n' }, { text: 'VAN ELKE KANT', dim: true }],
      text: 'Eén bericht van jou en één van de ander op dezelfde dag, en jullie reeks begint. Elke dag op rij laat hem groeien.',
    },
    me: 'Jij',
    wrote: 'Schreef',
    waiting: 'Nog niet',
    ctaWrite: (name: string): string => `${name} schrijven`,
    ctaBack: 'Terug naar de chat',
    dismiss: 'Sluiten',
    help:
      'Elke dag dat jullie elkaar schrijven laat de band groeien. Na een pauze wordt hij wakker zodra er een woord komt.',
  },
});

export const chat = messages({
  fr: {
    /** Pas de « lit tout » : le minimoa ne lit que si vous avez dit oui tous les deux (et c'est une IA). */
    placeholder: (name: string, _pet: string): string => `Écris à ${name}`,
    /** Envoi optimiste : sous une bulle en route depuis un moment, puis sous une bulle pas partie (la toucher la renvoie). */
    sending: 'Envoi…',
    failed: 'Pas envoyé · Réessayer',
    send: 'Envoyer',
    closedDisabled: 'Ce lien n’est plus ouvert',
    sendError: 'Ton message n’est pas parti. Il est toujours là, réessaie.',
    /** Titre d'un envoi raté (hors refus du filtre, dont la raison vient de l'API). */
    notSent: 'Message non envoyé',
    /** Sous la raison du refus (servie par l'API) : le texte n'est pas perdu. */
    refusedKeep: 'Ton texte est resté dans le champ : modifie-le avant de le renvoyer.',
    /** Ancienne photo du jour de l’autre, restée cachée (tu n’avais pas posté la tienne ce jour-là). */
    lockedPhoto: 'Photo restée cachée',
    typing: (name: string): string => `${name} écrit…`,
    emptyTitle: [{ text: 'DITES-VOUS\n' }, { text: 'BONJOUR', dim: true }] as TitleSegment[],
    emptyText: (pet: string, otherPet: string): string =>
      `${pet} et ${otherPet} se sont trouvés. À toi le premier mot.`,
    loadError: 'Impossible de charger les messages',
    retry: 'Réessayer',
    today: 'Aujourd’hui',
    yesterday: 'Hier',
    /** Nom au-dessus d'une réplique de minimoa : « Nino · brise-glace ». */
    role: (role: 'icebreaker' | 'nudge' | 'remark' | 'guard' | 'event', name: string): string =>
      `${name} · ${{ icebreaker: 'brise-glace', nudge: 'relance', remark: 'remarque', guard: 'garde-fou, rien que pour toi', event: 'annonce' }[role]}`,
    /** Sous le fil, au-dessus du champ. */
    rhythm: (max: number): string => `Les minimoas parlent ${max} fois par jour au plus.`,
    rhythmNoReading: (max: number): string => `Sans lecture · ${max} fois par jour au plus.`,
    rhythmMuted: 'Minimoas coupés dans ce chat.',
    /** Interrupteur de l'en-tête. */
    switchOn: 'Minimoas activés dans ce chat. Toucher pour les couper.',
    switchOff: 'Minimoas coupés dans ce chat. Toucher pour les réactiver.',
    mutedNotice: 'Vos minimoas se taisent ici. Les annonces du lien (niveau, série) restent.',
    unmutedNotice: 'Vos minimoas peuvent reparler ici.',
    muteError: 'Le réglage n’est pas passé. Réessaie.',
    /** Signaler un message (appui long). */
    longPressHint: 'Signaler ce message',
    reportTitle: [{ text: 'CE ' }, { text: 'MESSAGE ?', dim: true }] as TitleSegment[],
    reportText:
      'On ne voit que ce message et les quelques messages autour. Rien d’autre de votre conversation.',
    reportAction: 'Signaler ce message',
    quote: (body: string): string => `« ${body} »`,
    cancel: 'Annuler',
    rhythmA11y: 'Voir ce que font les minimoas dans ce chat',
  },
  en: {
    placeholder: (name: string, _pet: string): string => `Write to ${name}`,
    sending: 'Sending…',
    failed: 'Not sent · Retry',
    send: 'Send',
    closedDisabled: 'This link is no longer open',
    sendError: 'Your message didn’t go out. It’s still here, try again.',
    notSent: 'Message not sent',
    refusedKeep: 'Your text is still in the box: edit it before sending it again.',
    lockedPhoto: 'Photo stayed hidden',
    typing: (name: string): string => `${name} is typing…`,
    emptyTitle: [{ text: 'SAY\n' }, { text: 'HELLO', dim: true }],
    emptyText: (pet: string, otherPet: string): string =>
      `${pet} and ${otherPet} found each other. The first word is yours.`,
    loadError: 'Couldn’t load the messages',
    retry: 'Try again',
    today: 'Today',
    yesterday: 'Yesterday',
    role: (role: 'icebreaker' | 'nudge' | 'remark' | 'guard' | 'event', name: string): string =>
      `${name} · ${{ icebreaker: 'icebreaker', nudge: 'nudge', remark: 'remark', guard: 'safeguard, just for you', event: 'announcement' }[role]}`,
    rhythm: (max: number): string => `Minimoas speak ${max} times a day at most.`,
    rhythmNoReading: (max: number): string => `No reading · ${max} times a day at most.`,
    rhythmMuted: 'Minimoas muted in this chat.',
    switchOn: 'Minimoas on in this chat. Tap to mute them.',
    switchOff: 'Minimoas muted in this chat. Tap to turn them back on.',
    mutedNotice: 'Your minimoas go quiet here. Link announcements (level, streak) stay.',
    unmutedNotice: 'Your minimoas can talk here again.',
    muteError: 'The setting didn’t go through. Try again.',
    longPressHint: 'Report this message',
    reportTitle: [{ text: 'THIS ' }, { text: 'MESSAGE?', dim: true }],
    reportText: 'We only see this message and a few messages around it. Nothing else from your conversation.',
    reportAction: 'Report this message',
    quote: (body: string): string => `“${body}”`,
    cancel: 'Cancel',
    rhythmA11y: 'See what minimoas do in this chat',
  },
  es: {
    placeholder: (name: string, _pet: string): string => `Escribe a ${name}`,
    sending: 'Enviando…',
    failed: 'No enviado · Reintentar',
    send: 'Enviar',
    closedDisabled: 'Este vínculo ya no está abierto',
    sendError: 'Tu mensaje no se envió. Sigue aquí, inténtalo de nuevo.',
    notSent: 'Mensaje no enviado',
    refusedKeep: 'Tu texto sigue en el campo: modifícalo antes de volver a enviarlo.',
    lockedPhoto: 'Foto que quedó oculta',
    typing: (name: string): string => `${name} está escribiendo…`,
    emptyTitle: [{ text: 'DIGAN\n' }, { text: 'HOLA', dim: true }],
    emptyText: (pet: string, otherPet: string): string =>
      `${pet} y ${otherPet} se han encontrado. La primera palabra es tuya.`,
    loadError: 'No se pudieron cargar los mensajes',
    retry: 'Reintentar',
    today: 'Hoy',
    yesterday: 'Ayer',
    role: (role: 'icebreaker' | 'nudge' | 'remark' | 'guard' | 'event', name: string): string =>
      `${name} · ${{ icebreaker: 'rompehielos', nudge: 'empujoncito', remark: 'comentario', guard: 'salvaguarda, solo para ti', event: 'aviso' }[role]}`,
    rhythm: (max: number): string => `Los minimoas hablan ${max} veces al día como máximo.`,
    rhythmNoReading: (max: number): string => `Sin lectura · ${max} veces al día como máximo.`,
    rhythmMuted: 'Minimoas silenciados en este chat.',
    switchOn: 'Minimoas activados en este chat. Toca para silenciarlos.',
    switchOff: 'Minimoas silenciados en este chat. Toca para reactivarlos.',
    mutedNotice: 'Los minimoas se callan aquí. Los avisos del vínculo (nivel, racha) se mantienen.',
    unmutedNotice: 'Los minimoas pueden volver a hablar aquí.',
    muteError: 'El ajuste no se guardó. Inténtalo de nuevo.',
    longPressHint: 'Reportar este mensaje',
    reportTitle: [{ text: '¿ESTE ' }, { text: 'MENSAJE?', dim: true }],
    reportText: 'Solo vemos este mensaje y algunos mensajes de alrededor. Nada más de la conversación.',
    reportAction: 'Reportar este mensaje',
    quote: (body: string): string => `«${body}»`,
    cancel: 'Cancelar',
    rhythmA11y: 'Ver lo que hacen los minimoas en este chat',
  },
  pt: {
    placeholder: (name: string, _pet: string): string => `Escreva para ${name}`,
    sending: 'Enviando…',
    failed: 'Não enviado · Tentar de novo',
    send: 'Enviar',
    closedDisabled: 'Este vínculo não está mais aberto',
    sendError: 'Sua mensagem não foi enviada. Ela continua aqui, tente de novo.',
    notSent: 'Mensagem não enviada',
    refusedKeep: 'Seu texto continua no campo: edite antes de enviar de novo.',
    lockedPhoto: 'Foto que ficou oculta',
    typing: (name: string): string => `${name} está digitando…`,
    emptyTitle: [{ text: 'DIGAM\n' }, { text: 'OI', dim: true }],
    emptyText: (pet: string, otherPet: string): string =>
      `${pet} e ${otherPet} se encontraram. A primeira palavra é sua.`,
    loadError: 'Não foi possível carregar as mensagens',
    retry: 'Tentar de novo',
    today: 'Hoje',
    yesterday: 'Ontem',
    role: (role: 'icebreaker' | 'nudge' | 'remark' | 'guard' | 'event', name: string): string =>
      `${name} · ${{ icebreaker: 'quebra-gelo', nudge: 'cutucada', remark: 'comentário', guard: 'proteção, só para você', event: 'aviso' }[role]}`,
    rhythm: (max: number): string => `Os minimoas falam no máximo ${max} vezes por dia.`,
    rhythmNoReading: (max: number): string => `Sem leitura · no máximo ${max} vezes por dia.`,
    rhythmMuted: 'Minimoas silenciados neste chat.',
    switchOn: 'Minimoas ativados neste chat. Toque para silenciá-los.',
    switchOff: 'Minimoas silenciados neste chat. Toque para reativá-los.',
    mutedNotice: 'Os minimoas de vocês ficam quietos aqui. Os avisos do vínculo (nível, sequência) continuam.',
    unmutedNotice: 'Os minimoas de vocês podem voltar a falar aqui.',
    muteError: 'A configuração não foi salva. Tente de novo.',
    longPressHint: 'Denunciar esta mensagem',
    reportTitle: [{ text: 'ESTA ' }, { text: 'MENSAGEM?', dim: true }],
    reportText: 'Só vemos esta mensagem e algumas mensagens ao redor. Nada mais da conversa de vocês.',
    reportAction: 'Denunciar esta mensagem',
    quote: (body: string): string => `“${body}”`,
    cancel: 'Cancelar',
    rhythmA11y: 'Ver o que os minimoas fazem neste chat',
  },
  nl: {
    placeholder: (name: string, _pet: string): string => `Bericht aan ${name}`,
    sending: 'Versturen…',
    failed: 'Niet verstuurd · Opnieuw',
    send: 'Versturen',
    closedDisabled: 'Deze band is niet meer open',
    sendError: 'Je bericht is niet verstuurd. Het staat er nog, probeer het opnieuw.',
    notSent: 'Bericht niet verstuurd',
    refusedKeep: 'Je tekst staat nog in het veld: pas hem aan voor je hem opnieuw verstuurt.',
    lockedPhoto: 'Foto bleef verborgen',
    typing: (name: string): string => `${name} typt…`,
    emptyTitle: [{ text: 'ZEG ELKAAR\n' }, { text: 'HALLO', dim: true }],
    emptyText: (pet: string, otherPet: string): string =>
      `${pet} en ${otherPet} hebben elkaar gevonden. Jij mag het eerste woord.`,
    loadError: 'De berichten konden niet worden geladen',
    retry: 'Opnieuw',
    today: 'Vandaag',
    yesterday: 'Gisteren',
    role: (role: 'icebreaker' | 'nudge' | 'remark' | 'guard' | 'event', name: string): string =>
      `${name} · ${{ icebreaker: 'ijsbreker', nudge: 'duwtje', remark: 'opmerking', guard: 'vangnet, alleen voor jou', event: 'mededeling' }[role]}`,
    rhythm: (max: number): string => `De minimoas praten hooguit ${max} keer per dag.`,
    rhythmNoReading: (max: number): string => `Zonder meelezen · hooguit ${max} keer per dag.`,
    rhythmMuted: 'Minimoas staan uit in deze chat.',
    switchOn: 'Minimoas staan aan in deze chat. Tik om ze uit te zetten.',
    switchOff: 'Minimoas staan uit in deze chat. Tik om ze weer aan te zetten.',
    mutedNotice: 'Jullie minimoas zwijgen hier. Meldingen van de band (niveau, reeks) blijven.',
    unmutedNotice: 'Jullie minimoas mogen hier weer praten.',
    muteError: 'De instelling is niet opgeslagen. Probeer het opnieuw.',
    longPressHint: 'Dit bericht melden',
    reportTitle: [{ text: 'DIT ' }, { text: 'BERICHT?', dim: true }],
    reportText: 'We zien alleen dit bericht en een paar berichten eromheen. Verder niets van jullie gesprek.',
    reportAction: 'Dit bericht melden',
    quote: (body: string): string => `„${body}”`,
    cancel: 'Annuleren',
    rhythmA11y: 'Bekijk wat de minimoas in deze chat doen',
  },
});

/** Les étapes du lien et ses photos d’avant (bas de l’onglet « Le lien »). */
export const memories = messages({
  fr: {
    recapTitle: [{ text: 'VOUS DEUX,\n' }, { text: 'EN BREF', dim: true }] as TitleSegment[],
    recapStreak: (n: number): string => `${n} ${n > 1 ? 'jours' : 'jour'} sans en rater un.`,
    recapMessages: (n: number): string => `${n} ${n > 1 ? 'messages' : 'message'} à deux.`,
    share: 'Partager en story',
    storyKicker: 'Vous deux',
    storyUnit: (n: number): string => (n > 1 ? 'jours sans en rater un' : 'jour sans en rater un'),
    storyCallout: 'Ton minimoa te présente du monde :',
    storyMessage: (url: string): string => `Mon minimoa m’a présenté quelqu’un. Le tien t’attend : ${url}`,
    title: 'VOS ÉTAPES',
    met: 'Votre rencontre',
    level: (n: number, title: string): string => `Niveau ${n} : ${title.toLowerCase()}`,
    streak: (n: number): string => `${n} jours d’affilée à vous écrire`,
    earlier: 'Plus tôt',
    stats: (s: { daysTogether: number; duoDays: number; messages: number }): string =>
      `${s.daysTogether} ${s.daysTogether > 1 ? 'jours' : 'jour'} ensemble · ${s.duoDays} ${s.duoDays > 1 ? 'jours' : 'jour'} à vous écrire · ${s.messages} ${s.messages > 1 ? 'messages' : 'message'}`,
    bestStreak: (n: number): string => `Meilleure série : ${n} ${n > 1 ? 'jours' : 'jour'}`,
    photosTitle: 'VOS PHOTOS D’AVANT',
    blurredHint: 'Elles deviennent nettes au niveau 5 du lien',
    loadError: 'Impossible de charger vos étapes',
    retry: 'Réessayer',
  },
  en: {
    recapTitle: [{ text: 'YOU TWO,\n' }, { text: 'IN SHORT', dim: true }] as TitleSegment[],
    recapStreak: (n: number): string => `${n} ${n > 1 ? 'days' : 'day'} without missing one.`,
    recapMessages: (n: number): string => `${n} ${n > 1 ? 'messages' : 'message'} together.`,
    share: 'Share to story',
    storyKicker: 'You two',
    storyUnit: (n: number): string => (n > 1 ? 'days without missing one' : 'day without missing one'),
    storyCallout: 'Your minimoa introduces you to people:',
    storyMessage: (url: string): string => `My minimoa introduced me to someone. Yours is waiting: ${url}`,
    title: 'YOUR MILESTONES',
    met: 'You met',
    level: (n: number, title: string): string => `Level ${n}: ${title.toLowerCase()}`,
    streak: (n: number): string => `${n} days in a row writing to each other`,
    earlier: 'Earlier',
    stats: (s: { daysTogether: number; duoDays: number; messages: number }): string =>
      `${s.daysTogether} ${s.daysTogether === 1 ? 'day' : 'days'} together · ${s.duoDays} ${s.duoDays === 1 ? 'day' : 'days'} writing to each other · ${s.messages} ${s.messages === 1 ? 'message' : 'messages'}`,
    bestStreak: (n: number): string => `Best streak: ${n} ${n === 1 ? 'day' : 'days'}`,
    photosTitle: 'YOUR EARLIER PHOTOS',
    blurredHint: 'They turn sharp at link level 5',
    loadError: 'Couldn’t load your milestones',
    retry: 'Try again',
  },
  es: {
    recapTitle: [{ text: 'VOSOTROS,\n' }, { text: 'EN RESUMEN', dim: true }] as TitleSegment[],
    recapStreak: (n: number): string => `${n} ${n > 1 ? 'días' : 'día'} sin fallar ninguno.`,
    recapMessages: (n: number): string => `${n} ${n > 1 ? 'mensajes' : 'mensaje'} entre los dos.`,
    share: 'Compartir en historia',
    storyKicker: 'Vosotros dos',
    storyUnit: (n: number): string => (n > 1 ? 'días sin fallar ninguno' : 'día sin fallar ninguno'),
    storyCallout: 'Tu minimoa te presenta a gente:',
    storyMessage: (url: string): string => `Mi minimoa me presentó a alguien. El tuyo te espera: ${url}`,
    title: 'SUS ETAPAS',
    met: 'Cómo se conocieron',
    level: (n: number, title: string): string => `Nivel ${n}: ${title.toLowerCase()}`,
    streak: (n: number): string => `${n} días seguidos escribiéndose`,
    earlier: 'Antes',
    stats: (s: { daysTogether: number; duoDays: number; messages: number }): string =>
      `${s.daysTogether} ${s.daysTogether === 1 ? 'día' : 'días'} de vínculo · ${s.duoDays} ${s.duoDays === 1 ? 'día' : 'días'} escribiéndose · ${s.messages} ${s.messages === 1 ? 'mensaje' : 'mensajes'}`,
    bestStreak: (n: number): string => `Mejor racha: ${n} ${n === 1 ? 'día' : 'días'}`,
    photosTitle: 'SUS FOTOS DE ANTES',
    blurredHint: 'Se ven nítidas en el nivel 5 del vínculo',
    loadError: 'No se pudieron cargar sus etapas',
    retry: 'Reintentar',
  },
  pt: {
    recapTitle: [{ text: 'VOCÊS DOIS,\n' }, { text: 'EM RESUMO', dim: true }] as TitleSegment[],
    recapStreak: (n: number): string => `${n} ${n > 1 ? 'dias' : 'dia'} sem falhar nenhum.`,
    recapMessages: (n: number): string => `${n} ${n > 1 ? 'mensagens' : 'mensagem'} a dois.`,
    share: 'Compartilhar no story',
    storyKicker: 'Vocês dois',
    storyUnit: (n: number): string => (n > 1 ? 'dias sem falhar nenhum' : 'dia sem falhar nenhum'),
    storyCallout: 'Seu minimoa te apresenta pessoas:',
    storyMessage: (url: string): string =>
      `Meu minimoa me apresentou alguém. O seu está te esperando: ${url}`,
    title: 'SUAS ETAPAS',
    met: 'Vocês se conheceram',
    level: (n: number, title: string): string => `Nível ${n}: ${title.toLowerCase()}`,
    streak: (n: number): string => `${n} dias seguidos escrevendo um para o outro`,
    earlier: 'Antes',
    stats: (s: { daysTogether: number; duoDays: number; messages: number }): string =>
      `${s.daysTogether} ${s.daysTogether === 1 ? 'dia' : 'dias'} de vínculo · ${s.duoDays} ${s.duoDays === 1 ? 'dia' : 'dias'} trocando mensagens · ${s.messages} ${s.messages === 1 ? 'mensagem' : 'mensagens'}`,
    bestStreak: (n: number): string => `Melhor sequência: ${n} ${n === 1 ? 'dia' : 'dias'}`,
    photosTitle: 'AS FOTOS DE ANTES',
    blurredHint: 'Ficam nítidas no nível 5 do vínculo',
    loadError: 'Não foi possível carregar as etapas',
    retry: 'Tentar de novo',
  },
  nl: {
    recapTitle: [{ text: 'JULLIE TWEE,\n' }, { text: 'IN HET KORT', dim: true }] as TitleSegment[],
    recapStreak: (n: number): string => `${n} ${n > 1 ? 'dagen' : 'dag'} zonder er één te missen.`,
    recapMessages: (n: number): string => `${n} ${n > 1 ? 'berichten' : 'bericht'} samen.`,
    share: 'Delen in story',
    storyKicker: 'Jullie twee',
    storyUnit: (n: number): string =>
      n > 1 ? 'dagen zonder er één te missen' : 'dag zonder er één te missen',
    storyCallout: 'Je minimoa stelt je voor aan mensen:',
    storyMessage: (url: string): string => `Mijn minimoa stelde me iemand voor. De jouwe wacht op je: ${url}`,
    title: 'JULLIE MIJLPALEN',
    met: 'Jullie ontmoeting',
    level: (n: number, title: string): string => `Niveau ${n}: ${title.toLowerCase()}`,
    streak: (n: number): string => `${n} dagen op rij elkaar geschreven`,
    earlier: 'Eerder',
    stats: (s: { daysTogether: number; duoDays: number; messages: number }): string =>
      `${s.daysTogether} ${s.daysTogether === 1 ? 'dag' : 'dagen'} samen · ${s.duoDays} ${s.duoDays === 1 ? 'dag' : 'dagen'} elkaar geschreven · ${s.messages} ${s.messages === 1 ? 'bericht' : 'berichten'}`,
    bestStreak: (n: number): string => `Langste reeks: ${n} ${n === 1 ? 'dag' : 'dagen'}`,
    photosTitle: 'JULLIE EERDERE FOTO’S',
    blurredHint: 'Ze worden scherp op niveau 5 van de band',
    loadError: 'Jullie mijlpalen konden niet worden geladen',
    retry: 'Opnieuw',
  },
});

/**
 * L'état d'un lien, en une phrase douce (ADA-2027 item 27, cahier LOT2 §2.4) : jamais de chiffre, de jauge ni de perte.
 * `vivant` : quelqu'un a écrit ces deux derniers jours ; `calme` ; `moment` : une semaine de silence ; `endormi` : deux.
 */
export const warmth = messages({
  fr: {
    vivant: 'Vous vous parlez souvent.',
    calme: 'C’est calme en ce moment.',
    moment: 'Ça fait un moment. Un mot lui ferait plaisir.',
    endormi: 'Le lien fait la sieste. Il se réveille au premier mot.',
  },
  en: {
    vivant: 'You two talk often.',
    calme: 'It’s quiet right now.',
    moment: 'It’s been a while. A word would make their day.',
    endormi: 'The link is napping. It wakes up with the first word.',
  },
  es: {
    vivant: 'Hablan a menudo.',
    calme: 'Está todo tranquilo por ahora.',
    moment: 'Hace tiempo. Un mensaje le haría ilusión.',
    endormi: 'El vínculo está de siesta. Se despierta con la primera palabra.',
  },
  pt: {
    vivant: 'Vocês conversam sempre.',
    calme: 'Está tudo tranquilo por agora.',
    moment: 'Faz um tempo. Uma mensagem ia alegrar o dia.',
    endormi: 'O vínculo está tirando uma soneca. Acorda com a primeira palavra.',
  },
  nl: {
    vivant: 'Jullie praten vaak met elkaar.',
    calme: 'Het is even rustig.',
    moment: 'Het is even geleden. Een berichtje doet vast goed.',
    endormi: 'De band doet een dutje. Bij het eerste woord wordt hij wakker.',
  },
});

/** Lien endormi en plein écran (ancien écran « fantôme ») : « Le réveiller » ou « Le laisser partir ». */
export const sleep = messages({
  fr: {
    title: [{ text: 'UNE PETITE\n' }, { text: 'PAUSE.', dim: true }] as TitleSegment[],
    badge: (name: string): string => `${name} · lien endormi`,
    text: (name: string): string => `Ça fait un moment avec ${name}. Le lien fait la sieste, il se réveille quand tu veux.`,
    speech: (name: string): string => `J’ai pensé à ${name} cette semaine. Un petit mot, quand tu veux.`,
    speaker: (pet: string): string => `${pet}, en pleine sieste`,
    wake: 'Le réveiller',
    leave: 'Le laisser partir',
    wakeError: 'Impossible de le réveiller.',
  },
  en: {
    title: [{ text: 'A LITTLE\n' }, { text: 'BREAK.', dim: true }],
    badge: (name: string): string => `${name} · sleeping link`,
    text: (name: string): string => `It’s been a while with ${name}. The link is napping and wakes up whenever you like.`,
    speech: (name: string): string => `I’ve been thinking about ${name} this week. A little word, whenever you like.`,
    speaker: (pet: string): string => `${pet}, napping`,
    wake: 'Wake it up',
    leave: 'Let it go',
    wakeError: 'Couldn’t wake it up.',
  },
  es: {
    title: [{ text: 'UNA PEQUEÑA\n' }, { text: 'PAUSA.', dim: true }],
    badge: (name: string): string => `${name} · vínculo dormido`,
    text: (name: string): string => `Hace tiempo con ${name}. El vínculo echa una siesta y se despierta cuando quieras.`,
    speech: (name: string): string => `He pensado en ${name} esta semana. Una palabrita, cuando quieras.`,
    speaker: (pet: string): string => `${pet}, de siesta`,
    wake: 'Despertarlo',
    leave: 'Dejarlo ir',
    wakeError: 'No se pudo despertar.',
  },
  pt: {
    title: [{ text: 'UMA PEQUENA\n' }, { text: 'PAUSA.', dim: true }],
    badge: (name: string): string => `${name} · vínculo dormindo`,
    text: (name: string): string => `Faz um tempo com ${name}. O vínculo está tirando uma soneca e acorda quando você quiser.`,
    speech: (name: string): string => `Pensei em ${name} esta semana. Uma palavrinha, quando você quiser.`,
    speaker: (pet: string): string => `${pet}, de soneca`,
    wake: 'Acordar',
    leave: 'Deixar ir',
    wakeError: 'Não foi possível acordar.',
  },
  nl: {
    title: [{ text: 'EVEN\n' }, { text: 'PAUZE.', dim: true }],
    badge: (name: string): string => `${name} · slapende band`,
    text: (name: string): string => `Het is even geleden met ${name}. De band doet een dutje en wordt wakker wanneer jij wilt.`,
    speech: (name: string): string => `Ik heb deze week aan ${name} gedacht. Een berichtje, wanneer jij wilt.`,
    speaker: (pet: string): string => `${pet}, even dutten`,
    wake: 'Wakker maken',
    leave: 'Laten gaan',
    wakeError: 'Wakker maken is niet gelukt.',
  },
});

/** Les minimoas dans un chat : accord de lecture, explication des rôles (spéc  9). */
export const minimoas = messages({
  fr: {
    /** Accord venu du réglage par défaut (« Moi ») : pas de question, une ligne dans le chat. */
    byDefault: (on: boolean): string =>
      on
        ? 'Lecture par une IA : activée d’office pour ce chat (ton réglage).'
        : 'Lecture par une IA : coupée d’office pour ce chat (ton réglage).',
    byDefaultChange: 'Changer',
    error: 'Ton choix n’est pas passé. Réessaie.',
    /** Première fois : à quoi servent les minimoas d'un chat. */
    guideTitle: 'Ce que font vos minimoas ici',
    guideMore: 'Voir les 4 rôles',
    guideClose: 'Compris',
    rolesTitle: [{ text: 'LEURS ' }, { text: 'RÔLES', dim: true }] as TitleSegment[],
    roles: [
      {
        key: 'icebreaker',
        icon: 'gel',
        title: 'Brise-glace',
        text: 'Au début du lien, une question tirée de vos points communs.',
      },
      {
        key: 'nudge',
        icon: 'eclair',
        title: 'Relance',
        text: 'Après un long silence : « Ça fait 3 jours. Vous en étiez à ce resto. »',
      },
      {
        key: 'remark',
        icon: 'etoiles',
        title: 'Remarque',
        text: 'De temps en temps, ce qu’ils remarquent de vous deux.',
      },
      {
        key: 'guard',
        icon: 'gel',
        title: 'Garde-fou',
        text: 'Si le ton monte, ton minimoa te propose une pause. Rien que pour toi.',
      },
    ] as const,
    rolesNote:
      'Ils parlent avec le caractère de leur humain. Tu peux les couper pour ce chat, en haut à droite.',
    /** Options du lien. */
    sectionTitle: 'Minimoas dans ce chat',
    readingRow: 'Lecture par une IA',
    /** `theirs` : `consent.theirs` de l'API (absent d'une réponse plus ancienne). */
    readingSub: (
      on: boolean | null,
      both: boolean,
      theirs?: 'agreed' | 'not_yet',
      byDefault?: boolean,
    ): string => {
      const mine =
        on === null
          ? 'Pas encore choisi'
          : !on
            ? 'Non : ils réagissent seulement au rythme'
            : both
              ? 'Oui, vous deux'
              : 'Oui';
      const other =
        both || theirs === undefined
          ? ''
          : theirs === 'agreed'
            ? ' · activé de son côté'
            : ' · pas encore activé de son côté';
      return `${mine}${other}${byDefault ? ' · par défaut' : ''}`;
    },
    muteRow: 'Minimoas actifs',
    muteSub: (n: number, max: number): string => `${n} sur ${max} interventions aujourd’hui`,
  },
  en: {
    byDefault: (on: boolean): string =>
      on
        ? 'AI reading: turned on for this chat by default (your setting).'
        : 'AI reading: turned off for this chat by default (your setting).',
    byDefaultChange: 'Change',
    error: 'Your choice didn’t go through. Try again.',
    guideTitle: 'What your minimoas do here',
    guideMore: 'See the 4 roles',
    guideClose: 'Got it',
    rolesTitle: [{ text: 'THEIR ' }, { text: 'ROLES', dim: true }],
    roles: [
      {
        key: 'icebreaker',
        icon: 'gel',
        title: 'Icebreaker',
        text: 'At the start of the link, a question drawn from what you have in common.',
      },
      {
        key: 'nudge',
        icon: 'eclair',
        title: 'Nudge',
        text: 'After a long silence: “It’s been 3 days. You were talking about that restaurant.”',
      },
      {
        key: 'remark',
        icon: 'etoiles',
        title: 'Remark',
        text: 'Now and then, what they notice about the two of you.',
      },
      {
        key: 'guard',
        icon: 'gel',
        title: 'Safeguard',
        text: 'If things get heated, your minimoa suggests a break. Just for you.',
      },
    ],
    rolesNote: 'They talk with their human’s personality. You can mute them for this chat, top right.',
    sectionTitle: 'Minimoas in this chat',
    readingRow: 'AI reading',
    readingSub: (
      on: boolean | null,
      both: boolean,
      theirs?: 'agreed' | 'not_yet',
      byDefault?: boolean,
    ): string => {
      const mine =
        on === null
          ? 'Not chosen yet'
          : !on
            ? 'No: they only react to the rhythm'
            : both
              ? 'Yes, both of you'
              : 'Yes';
      const other =
        both || theirs === undefined ? '' : theirs === 'agreed' ? ' · on for them' : ' · not on for them yet';
      return `${mine}${other}${byDefault ? ' · default' : ''}`;
    },
    muteRow: 'Minimoas active',
    muteSub: (n: number, max: number): string => `${n} of ${max} interventions today`,
  },
  es: {
    byDefault: (on: boolean): string =>
      on
        ? 'Lectura por IA: activada por defecto en este chat (tu ajuste).'
        : 'Lectura por IA: desactivada por defecto en este chat (tu ajuste).',
    byDefaultChange: 'Cambiar',
    error: 'Tu elección no se guardó. Inténtalo de nuevo.',
    guideTitle: 'Lo que hacen los minimoas aquí',
    guideMore: 'Ver los 4 papeles',
    guideClose: 'Entendido',
    rolesTitle: [{ text: 'SUS ' }, { text: 'PAPELES', dim: true }],
    roles: [
      {
        key: 'icebreaker',
        icon: 'gel',
        title: 'Rompehielos',
        text: 'Al principio del vínculo, una pregunta sacada de lo que tienen en común.',
      },
      {
        key: 'nudge',
        icon: 'eclair',
        title: 'Empujoncito',
        text: 'Tras un largo silencio: «Hace 3 días. Estaban hablando de ese restaurante».',
      },
      {
        key: 'remark',
        icon: 'etoiles',
        title: 'Comentario',
        text: 'De vez en cuando, lo que notan entre ustedes.',
      },
      {
        key: 'guard',
        icon: 'gel',
        title: 'Salvaguarda',
        text: 'Si el tono sube, tu minimoa te propone una pausa. Solo para ti.',
      },
    ],
    rolesNote: 'Hablan con el carácter de su humano. Puedes silenciarlos en este chat, arriba a la derecha.',
    sectionTitle: 'Minimoas en este chat',
    readingRow: 'Lectura por IA',
    readingSub: (
      on: boolean | null,
      both: boolean,
      theirs?: 'agreed' | 'not_yet',
      byDefault?: boolean,
    ): string => {
      const mine =
        on === null
          ? 'Aún sin elegir'
          : !on
            ? 'No: solo reaccionan al ritmo'
            : both
              ? 'Sí, por ambas partes'
              : 'Sí';
      const other =
        both || theirs === undefined
          ? ''
          : theirs === 'agreed'
            ? ' · activado por la otra parte'
            : ' · aún no activado por la otra parte';
      return `${mine}${other}${byDefault ? ' · por defecto' : ''}`;
    },
    muteRow: 'Minimoas activos',
    muteSub: (n: number, max: number): string => `${n} de ${max} intervenciones hoy`,
  },
  pt: {
    byDefault: (on: boolean): string =>
      on
        ? 'Leitura por IA: ativada por padrão neste chat (sua configuração).'
        : 'Leitura por IA: desativada por padrão neste chat (sua configuração).',
    byDefaultChange: 'Mudar',
    error: 'Sua escolha não foi salva. Tente de novo.',
    guideTitle: 'O que os minimoas fazem aqui',
    guideMore: 'Ver os 4 papéis',
    guideClose: 'Entendi',
    rolesTitle: [{ text: 'OS ' }, { text: 'PAPÉIS', dim: true }],
    roles: [
      {
        key: 'icebreaker',
        icon: 'gel',
        title: 'Quebra-gelo',
        text: 'No começo do vínculo, uma pergunta tirada do que vocês têm em comum.',
      },
      {
        key: 'nudge',
        icon: 'eclair',
        title: 'Cutucada',
        text: 'Depois de um longo silêncio: “Já faz 3 dias. Vocês estavam falando daquele restaurante.”',
      },
      {
        key: 'remark',
        icon: 'etoiles',
        title: 'Comentário',
        text: 'De vez em quando, o que eles percebem em vocês.',
      },
      {
        key: 'guard',
        icon: 'gel',
        title: 'Proteção',
        text: 'Se o clima esquentar, seu minimoa sugere uma pausa. Só para você.',
      },
    ],
    rolesNote:
      'Eles falam com o jeito do seu humano. Você pode silenciá-los neste chat, no canto superior direito.',
    sectionTitle: 'Minimoas neste chat',
    readingRow: 'Leitura por IA',
    readingSub: (
      on: boolean | null,
      both: boolean,
      theirs?: 'agreed' | 'not_yet',
      byDefault?: boolean,
    ): string => {
      const mine =
        on === null
          ? 'Ainda não escolhido'
          : !on
            ? 'Não: eles reagem só ao ritmo'
            : both
              ? 'Sim, dos dois lados'
              : 'Sim';
      const other =
        both || theirs === undefined
          ? ''
          : theirs === 'agreed'
            ? ' · ativado do outro lado'
            : ' · ainda não ativado do outro lado';
      return `${mine}${other}${byDefault ? ' · padrão' : ''}`;
    },
    muteRow: 'Minimoas ativos',
    muteSub: (n: number, max: number): string => `${n} de ${max} intervenções hoje`,
  },
  nl: {
    byDefault: (on: boolean): string =>
      on
        ? 'Meelezen door AI: standaard aan in deze chat (jouw instelling).'
        : 'Meelezen door AI: standaard uit in deze chat (jouw instelling).',
    byDefaultChange: 'Wijzigen',
    error: 'Je keuze is niet opgeslagen. Probeer het opnieuw.',
    guideTitle: 'Wat jullie minimoas hier doen',
    guideMore: 'Bekijk de 4 rollen',
    guideClose: 'Begrepen',
    rolesTitle: [{ text: 'HUN ' }, { text: 'ROLLEN', dim: true }],
    roles: [
      {
        key: 'icebreaker',
        icon: 'gel',
        title: 'IJsbreker',
        text: 'Aan het begin van de band: een vraag op basis van wat jullie gemeen hebben.',
      },
      {
        key: 'nudge',
        icon: 'eclair',
        title: 'Duwtje',
        text: 'Na een lange stilte: „Al 3 dagen niks. Jullie hadden het over dat restaurant.”',
      },
      {
        key: 'remark',
        icon: 'etoiles',
        title: 'Opmerking',
        text: 'Af en toe: wat hun opvalt aan jullie tweeën.',
      },
      {
        key: 'guard',
        icon: 'gel',
        title: 'Vangnet',
        text: 'Loopt het hoog op, dan stelt je minimoa een pauze voor. Alleen voor jou.',
      },
    ],
    rolesNote: 'Ze praten met het karakter van hun mens. Je kunt ze voor deze chat uitzetten, rechtsboven.',
    sectionTitle: 'Minimoas in deze chat',
    readingRow: 'Meelezen door AI',
    readingSub: (
      on: boolean | null,
      both: boolean,
      theirs?: 'agreed' | 'not_yet',
      byDefault?: boolean,
    ): string => {
      const mine =
        on === null
          ? 'Nog niet gekozen'
          : !on
            ? 'Nee: ze reageren alleen op het ritme'
            : both
              ? 'Ja, jullie allebei'
              : 'Ja';
      const other =
        both || theirs === undefined
          ? ''
          : theirs === 'agreed'
            ? ' · aan bij de ander'
            : ' · nog niet aan bij de ander';
      return `${mine}${other}${byDefault ? ' · standaard' : ''}`;
    },
    muteRow: 'Minimoas actief',
    muteSub: (n: number, max: number): string => `${n} van ${max} beurten vandaag`,
  },
});

export const levels = messages({
  fr: {
    current: 'Vous êtes là',
  },
  en: {
    current: 'You’re here',
  },
  es: {
    current: 'Están aquí',
  },
  pt: {
    current: 'Vocês estão aqui',
  },
  nl: {
    current: 'Hier zijn jullie',
  },
});

export const options = messages({
  fr: {
    close: 'Fermer',
    title: (name: string, pet: string): TitleSegment[] => [
      { text: `${name.toUpperCase()} ` },
      { text: `ET ${pet.toUpperCase()}`, dim: true },
    ],
    meta: (created: string, level: number): string => `Lien créé le ${created} · niveau ${level}`,
    report: (name: string): string => `Signaler ${name}`,
    reportSub: 'On regarde chaque signalement',
    block: (name: string): string => `Bloquer ${name}`,
    blockSub: 'Plus de messages, plus de rencontre',
    leave: 'Quitter ce lien',
    leaveSub: 'Le lien disparaît de vos chats, à tous les deux',
    reportTitle: (name: string): TitleSegment[] => [
      { text: 'SIGNALER ' },
      { text: name.toUpperCase(), dim: true },
    ],
    reportIntro: (name: string): string =>
      `${name} ne saura pas que ça vient de toi. Dis-nous ce qui ne va pas.`,
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
    blockTitle: (name: string): TitleSegment[] => [
      { text: 'BLOQUER ' },
      { text: `${name.toUpperCase()} ?`, dim: true },
    ],
    blockText: (name: string): string =>
      `${name} ne pourra plus t’écrire ni croiser ton minimoa. Ce lien disparaît. Tu pourras revenir dessus depuis Moi › Personnes bloquées.`,
    blockConfirm: 'Bloquer',
    leaveTitle: [{ text: 'QUITTER ' }, { text: 'CE LIEN ?', dim: true }] as TitleSegment[],
    leaveText: (name: string): string =>
      `Ton lien avec ${name} disparaît de vos chats, à tous les deux. Ce n’est pas un blocage : si vous vous retrouvez sur Minimoa, il revient, avec votre conversation.`,
    leaveConfirm: 'Quitter le lien',
    cancel: 'Annuler',
    error: 'Ça n’a pas marché. Réessaie.',
    selected: 'Sélectionné',
  },
  en: {
    close: 'Close',
    title: (name: string, pet: string): TitleSegment[] => [
      { text: `${name.toUpperCase()} ` },
      { text: `AND ${pet.toUpperCase()}`, dim: true },
    ],
    meta: (created: string, level: number): string => `Link created ${created} · level ${level}`,
    report: (name: string): string => `Report ${name}`,
    reportSub: 'We look at every report',
    block: (name: string): string => `Block ${name}`,
    blockSub: 'No more messages, no more encounters',
    leave: 'Leave this link',
    leaveSub: 'The link disappears from both your chats',
    reportTitle: (name: string): TitleSegment[] => [
      { text: 'REPORT ' },
      { text: name.toUpperCase(), dim: true },
    ],
    reportIntro: (name: string): string => `${name} won’t know it came from you. Tell us what’s wrong.`,
    reportReason: 'What’s going on?',
    reportDetails: 'Details (optional)',
    reportDetailsHint: 'What happened, and when. It helps us act fast.',
    reportNote: 'Add details if you like (optional)',
    reportNotePlaceholder: 'What happened, when…',
    reportAlsoBlock: (name: string): string => `Block ${name} too`,
    reportAlsoBlockSub: 'The link disappears from your chats.',
    reportSend: 'Send report',
    reportEmergency: 'In immediate danger? Call 911, 112 or your local emergency number.',
    reportDone: 'Thanks. Your report has been sent, we’ll look at it quickly.',
    reportPickFirst: 'Pick a reason.',
    blockTitle: (name: string): TitleSegment[] => [
      { text: 'BLOCK ' },
      { text: `${name.toUpperCase()}?`, dim: true },
    ],
    blockText: (name: string): string =>
      `${name} won’t be able to write to you or meet your minimoa anymore. This link disappears. You can undo this in Me › Blocked people.`,
    blockConfirm: 'Block',
    leaveTitle: [{ text: 'LEAVE ' }, { text: 'THIS LINK?', dim: true }],
    leaveText: (name: string): string =>
      `Your link with ${name} disappears from both your chats. It’s not a block: if you find each other again on Minimoa, it comes back, with your conversation.`,
    leaveConfirm: 'Leave link',
    cancel: 'Cancel',
    error: 'That didn’t work. Try again.',
    selected: 'Selected',
  },
  es: {
    close: 'Cerrar',
    title: (name: string, pet: string): TitleSegment[] => [
      { text: `${name.toUpperCase()} ` },
      { text: `Y ${pet.toUpperCase()}`, dim: true },
    ],
    meta: (created: string, level: number): string => `Vínculo creado el ${created} · nivel ${level}`,
    report: (name: string): string => `Reportar a ${name}`,
    reportSub: 'Revisamos cada reporte',
    block: (name: string): string => `Bloquear a ${name}`,
    blockSub: 'Ni mensajes ni encuentros',
    leave: 'Salir de este vínculo',
    leaveSub: 'El vínculo desaparece de los chats de ambas partes',
    reportTitle: (name: string): TitleSegment[] => [
      { text: 'REPORTAR A ' },
      { text: name.toUpperCase(), dim: true },
    ],
    reportIntro: (name: string): string => `${name} no sabrá que viene de ti. Cuéntanos qué pasa.`,
    reportReason: '¿Qué está pasando?',
    reportDetails: 'Detalles (opcional)',
    reportDetailsHint: 'Qué pasó y cuándo. Nos ayuda a actuar rápido.',
    reportNote: 'Añade detalles si quieres (opcional)',
    reportNotePlaceholder: 'Qué pasó, cuándo…',
    reportAlsoBlock: (name: string): string => `Bloquear también a ${name}`,
    reportAlsoBlockSub: 'El vínculo desaparece de tus chats.',
    reportSend: 'Enviar el reporte',
    reportEmergency: '¿En peligro inmediato? Llama al 112 o al número de emergencias local.',
    reportDone: 'Gracias. Tu reporte se ha enviado, lo revisaremos pronto.',
    reportPickFirst: 'Elige un motivo.',
    blockTitle: (name: string): TitleSegment[] => [
      { text: '¿BLOQUEAR A ' },
      { text: `${name.toUpperCase()}?`, dim: true },
    ],
    blockText: (name: string): string =>
      `${name} ya no podrá escribirte ni cruzarse con tu minimoa. Este vínculo desaparece. Puedes deshacerlo en Yo › Personas bloqueadas.`,
    blockConfirm: 'Bloquear',
    leaveTitle: [{ text: '¿SALIR DE ' }, { text: 'ESTE VÍNCULO?', dim: true }],
    leaveText: (name: string): string =>
      `Tu vínculo con ${name} desaparece de los chats de ambas partes. No es un bloqueo: si vuelven a encontrarse en Minimoa, regresa, con la conversación.`,
    leaveConfirm: 'Salir del vínculo',
    cancel: 'Cancelar',
    error: 'No ha funcionado. Inténtalo de nuevo.',
    selected: 'Seleccionado',
  },
  pt: {
    close: 'Fechar',
    title: (name: string, pet: string): TitleSegment[] => [
      { text: `${name.toUpperCase()} ` },
      { text: `E ${pet.toUpperCase()}`, dim: true },
    ],
    meta: (created: string, level: number): string => `Vínculo criado em ${created} · nível ${level}`,
    report: (name: string): string => `Denunciar ${name}`,
    reportSub: 'Analisamos cada denúncia',
    block: (name: string): string => `Bloquear ${name}`,
    blockSub: 'Sem mensagens, sem encontros',
    leave: 'Sair deste vínculo',
    leaveSub: 'O vínculo some dos chats dos dois lados',
    reportTitle: (name: string): TitleSegment[] => [
      { text: 'DENUNCIAR ' },
      { text: name.toUpperCase(), dim: true },
    ],
    reportIntro: (name: string): string =>
      `${name} não vai saber que veio de você. Conte para a gente o que está errado.`,
    reportReason: 'O que está acontecendo?',
    reportDetails: 'Detalhes (opcional)',
    reportDetailsHint: 'O que aconteceu e quando. Isso nos ajuda a agir rápido.',
    reportNote: 'Explique se quiser (opcional)',
    reportNotePlaceholder: 'O que aconteceu, quando…',
    reportAlsoBlock: (name: string): string => `Bloquear ${name} também`,
    reportAlsoBlockSub: 'O vínculo some dos seus chats.',
    reportSend: 'Enviar denúncia',
    reportEmergency: 'Em perigo imediato? Ligue para o 190 ou para o número de emergência local.',
    reportDone: 'Obrigado. Sua denúncia foi enviada, vamos analisá-la rapidinho.',
    reportPickFirst: 'Escolha um motivo.',
    blockTitle: (name: string): TitleSegment[] => [
      { text: 'BLOQUEAR ' },
      { text: `${name.toUpperCase()}?`, dim: true },
    ],
    blockText: (name: string): string =>
      `${name} não vai mais poder escrever para você nem cruzar com seu minimoa. Este vínculo some. Você pode desfazer isso em Eu › Pessoas bloqueadas.`,
    blockConfirm: 'Bloquear',
    leaveTitle: [{ text: 'SAIR ' }, { text: 'DESTE VÍNCULO?', dim: true }],
    leaveText: (name: string): string =>
      `Seu vínculo com ${name} some dos chats dos dois lados. Não é um bloqueio: se vocês se reencontrarem no Minimoa, ele volta, com a conversa.`,
    leaveConfirm: 'Sair do vínculo',
    cancel: 'Cancelar',
    error: 'Não deu certo. Tente de novo.',
    selected: 'Selecionado',
  },
  nl: {
    close: 'Sluiten',
    title: (name: string, pet: string): TitleSegment[] => [
      { text: `${name.toUpperCase()} ` },
      { text: `EN ${pet.toUpperCase()}`, dim: true },
    ],
    meta: (created: string, level: number): string => `Band gemaakt op ${created} · niveau ${level}`,
    report: (name: string): string => `${name} melden`,
    reportSub: 'We bekijken elke melding',
    block: (name: string): string => `${name} blokkeren`,
    blockSub: 'Geen berichten en ontmoetingen meer',
    leave: 'Deze band verlaten',
    leaveSub: 'De band verdwijnt bij jullie allebei uit de chats',
    reportTitle: (name: string): TitleSegment[] => [
      { text: 'MELD ' },
      { text: name.toUpperCase(), dim: true },
    ],
    reportIntro: (name: string): string =>
      `${name} weet niet dat het van jou komt. Vertel ons wat er mis is.`,
    reportReason: 'Wat is er aan de hand?',
    reportDetails: 'Details (optioneel)',
    reportDetailsHint: 'Wat er gebeurde, en wanneer. Zo kunnen we snel handelen.',
    reportNote: 'Licht toe als je wilt (optioneel)',
    reportNotePlaceholder: 'Wat er gebeurde, wanneer…',
    reportAlsoBlock: (name: string): string => `${name} ook blokkeren`,
    reportAlsoBlockSub: 'De band verdwijnt uit je chats.',
    reportSend: 'Melding versturen',
    reportEmergency: 'In direct gevaar? Bel 112.',
    reportDone: 'Bedankt. Je melding is verstuurd, we bekijken hem snel.',
    reportPickFirst: 'Kies een reden.',
    blockTitle: (name: string): TitleSegment[] => [
      { text: 'BLOKKEER ' },
      { text: `${name.toUpperCase()}?`, dim: true },
    ],
    blockText: (name: string): string =>
      `${name} kan je niet meer schrijven en je minimoa niet meer tegenkomen. Deze band verdwijnt. Je kunt dit terugdraaien via Ik › Geblokkeerde personen.`,
    blockConfirm: 'Blokkeren',
    leaveTitle: [{ text: 'DEZE BAND ' }, { text: 'VERLATEN?', dim: true }],
    leaveText: (name: string): string =>
      `Je band met ${name} verdwijnt bij jullie allebei uit de chats. Het is geen blokkade: vinden jullie elkaar terug op Minimoa, dan komt hij terug, met jullie gesprek.`,
    leaveConfirm: 'Band verlaten',
    cancel: 'Annuleren',
    error: 'Dat lukte niet. Probeer het opnieuw.',
    selected: 'Geselecteerd',
  },
});

/** Jours et mois pour les dates courtes. */
export const dates = messages({
  fr: {
    months: [
      'janv.',
      'févr.',
      'mars',
      'avr.',
      'mai',
      'juin',
      'juil.',
      'août',
      'sept.',
      'oct.',
      'nov.',
      'déc.',
    ] as const,
    weekdays: ['dimanche', 'lundi', 'mardi', 'mercredi', 'jeudi', 'vendredi', 'samedi'] as const,
    weekdaysShort: ['dim.', 'lun.', 'mar.', 'mer.', 'jeu.', 'ven.', 'sam.'] as const,
    today: 'aujourd’hui',
    yesterday: 'hier',
    /** « 12 oct. » : jour et mois abrégé. */
    dayMonth: (day: number, month: string): string => `${day} ${month}`,
    /** « lundi 3 nov. » */
    weekdayDate: (weekday: string, date: string): string => `${weekday} ${date}`,
  },
  en: {
    months: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'],
    weekdays: ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'],
    weekdaysShort: ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'],
    today: 'today',
    yesterday: 'yesterday',
    dayMonth: (day: number, month: string): string => `${month} ${day}`,
    weekdayDate: (weekday: string, date: string): string => `${weekday}, ${date}`,
  },
  es: {
    months: ['ene.', 'feb.', 'mar.', 'abr.', 'may.', 'jun.', 'jul.', 'ago.', 'sept.', 'oct.', 'nov.', 'dic.'],
    weekdays: ['domingo', 'lunes', 'martes', 'miércoles', 'jueves', 'viernes', 'sábado'],
    weekdaysShort: ['dom.', 'lun.', 'mar.', 'mié.', 'jue.', 'vie.', 'sáb.'],
    today: 'hoy',
    yesterday: 'ayer',
    dayMonth: (day: number, month: string): string => `${day} ${month}`,
    weekdayDate: (weekday: string, date: string): string => `${weekday} ${date}`,
  },
  pt: {
    months: ['jan.', 'fev.', 'mar.', 'abr.', 'mai.', 'jun.', 'jul.', 'ago.', 'set.', 'out.', 'nov.', 'dez.'],
    weekdays: [
      'domingo',
      'segunda-feira',
      'terça-feira',
      'quarta-feira',
      'quinta-feira',
      'sexta-feira',
      'sábado',
    ],
    weekdaysShort: ['dom.', 'seg.', 'ter.', 'qua.', 'qui.', 'sex.', 'sáb.'],
    today: 'hoje',
    yesterday: 'ontem',
    dayMonth: (day: number, month: string): string => `${day} ${month}`,
    weekdayDate: (weekday: string, date: string): string => `${weekday}, ${date}`,
  },
  nl: {
    months: ['jan.', 'feb.', 'mrt.', 'apr.', 'mei', 'jun.', 'jul.', 'aug.', 'sep.', 'okt.', 'nov.', 'dec.'],
    weekdays: ['zondag', 'maandag', 'dinsdag', 'woensdag', 'donderdag', 'vrijdag', 'zaterdag'],
    weekdaysShort: ['zo', 'ma', 'di', 'wo', 'do', 'vr', 'za'],
    today: 'vandaag',
    yesterday: 'gisteren',
    dayMonth: (day: number, month: string): string => `${day} ${month}`,
    weekdayDate: (weekday: string, date: string): string => `${weekday} ${date}`,
  },
});
