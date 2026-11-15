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
    text: 'Les potes de tes potes d’abord. Le quartier ensuite.',
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
    emptyText: (pet: string): string => `${pet} croise d’abord les potes de tes potes. Invite les tiens : leurs potes viendront avec.`,
    emptyAction: 'Partager mon lien d’invitation',
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
    /** Pas de géolocalisation : on dit ce qu'on montre vraiment. */
    subtitle: (n: number): string => (n === 0 ? 'Ton cercle · sans adresse' : `${n} ${n > 1 ? 'minimoas' : 'minimoa'} dans ton cercle · sans adresse`),
    badge: 'BLOWY+',
    me: 'Toi',
    linkWho: (name: string): string => `Le minimoa de ${name}`,
    linkVia: 'Ton pote, déjà dans tes chats',
    openChat: (name: string): string => `Ouvrir le chat avec ${name}`,
    hello: (pet: string): string => `${pet} va dire bonjour`,
    helloSent: 'C’est parti. Je te raconte ce soir. Et non, je ne dirai rien de gênant. Presque.',
    linkA11y: (name: string, pet: string): string => `${pet}, le minimoa de ${name}, déjà dans tes chats`,
    metA11y: (name: string, pet: string): string => `${pet}, le minimoa de ${name}, croisé`,
    compat: 'd’accord',
    empty: 'Personne autour pour l’instant. Ça se remplit à chaque rencontre.',
    rencontres: 'Voir mes rencontres',
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
