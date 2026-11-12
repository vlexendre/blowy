/** Textes des rencontres, du détail d'une rencontre et de la carte. */
import type { TitleSegment } from '@blowy/ui';

const low = (s: string): string => s.toLowerCase();

export const rencontres = {
  kicker: 'cette semaine',
  title: (pet: string, n: number | null): TitleSegment[] => [
    { text: `${pet.toUpperCase()} A CROISÉ\n` },
    { text: n === null ? '…' : n === 0 ? 'PERSONNE.' : `${n} ${n > 1 ? 'PETS' : 'PET'}.`, dim: true },
  ],
  text: 'les potes de tes potes d’abord. le quartier ensuite.',
  map: 'la carte',
  mapA11y: 'Ouvrir la carte du quartier de ton pet',
  incomingCard: (name: string): string => `${name} veut te rencontrer`,
  incomingOwner: (pet: string, name: string): string => `${low(pet)}, le pet de ${name}`,
  owner: (name: string): string => `le pet de ${name}`,
  compat: 'd’accord',
  via: {
    friend_of_friend: (mutual: string | null): string => (mutual ? `par ${mutual}, pote de pote` : 'pote de pote'),
    nearby: (): string => 'près de chez toi',
    new: (): string => 'nouveau',
  },
  badgeNew: 'nouveau',
  introLabel: (myPet: string): string => `${low(myPet)} raconte`,
  wave: (pet: string): string => `saluer ${low(pet)}`,
  waved: 'salué · en attente',
  open: 'voir de plus près',
  openTalk: 'voir ce qu’ils se sont dit',
  plus: '+',
  accept: 'accepter',
  decline: 'pas cette fois',
  reminderShort: 'rien ne se passe sans ton tap.',
  emptyTitle: [{ text: 'PERSONNE\n' }, { text: 'POUR L’INSTANT', dim: true }] as TitleSegment[],
  emptyText: (pet: string): string => `${low(pet)} croise d’abord les potes de tes potes. invite les tiens : leurs potes viendront avec.`,
  emptyAction: 'partager mon lien d’invitation',
  shareMessage: (pet: string, url: string): string => `viens rencontrer ${pet} sur blowy 🐾 ${url}`,
  loadError: 'Impossible de charger les rencontres',
  retry: 'réessayer',
  actionError: 'Ça n’a pas marché. Réessaie.',
};

export const rencontre = {
  back: 'Retour',
  me: (pet: string): string => `${low(pet)} · toi`,
  them: (pet: string, name: string): string => `${low(pet)} · ${name}`,
  saysTitle: (pet: string): string => `ce que ${low(pet)} en dit`,
  theySay: (pet: string): string => `${low(pet)} t’a salué`,
  title: [{ text: 'RIEN SANS\n' }, { text: 'TON TAP.', dim: true }] as TitleSegment[],
  text: (name: string): string => `${name} ne voit rien tant que tu n’as pas dit oui.`,
  waitingText: (name: string): string => `ton salut est parti. si ${name} accepte, le chat s’ouvre.`,
  accept: (name: string): string => `ouvrir le chat avec ${name}`,
  decline: 'pas cette fois',
  wave: (pet: string): string => `saluer ${low(pet)}`,
  waved: 'salué · en attente',
  compatA11y: (n: number): string => `${n} % d’accord`,
  goneTitle: [{ text: 'PLUS\n' }, { text: 'LÀ', dim: true }] as TitleSegment[],
  goneText: 'cette rencontre n’est plus disponible.',
  goneAction: 'voir les rencontres',
  safetyTitle: 'sécurité',
  more: 'signaler ou bloquer',
};

export const carte = {
  back: 'Retour',
  title: [{ text: 'AUTOUR ' }, { text: 'DE TOI', dim: true }] as TitleSegment[],
  /** Pas de géolocalisation : on dit ce qu'on montre vraiment. */
  subtitle: (n: number): string => (n === 0 ? 'ton cercle · sans adresse' : `${n} ${n > 1 ? 'pets' : 'pet'} dans ton cercle · sans adresse`),
  badge: 'BLOWY+',
  me: 'toi',
  linkWho: (name: string): string => `le pet de ${name}`,
  linkVia: 'ton pote, déjà dans tes chats',
  openChat: (name: string): string => `ouvrir le chat avec ${name}`,
  hello: (pet: string): string => `${low(pet)} va dire bonjour`,
  helloSent: 'c’est parti. je te raconte ce soir. et non, je dirai rien de gênant. presque.',
  linkA11y: (name: string, pet: string): string => `${pet}, le pet de ${name}, déjà dans tes chats`,
  metA11y: (name: string, pet: string): string => `${pet}, le pet de ${name}, croisé`,
  compat: 'd’accord',
  empty: 'personne autour pour l’instant. ça se remplit à chaque rencontre.',
  rencontres: 'voir mes rencontres',
  loadError: 'Impossible de dessiner la carte',
  retry: 'réessayer',
};

/** Invitation reçue (/i/CODE), maquette V6-Invitation. */
export const invitation = {
  kicker: 'invitation',
  title: (name: string, pet: string): TitleSegment[] => [{ text: `${name.toUpperCase()} VEUT\n` }, { text: `TE PRÉSENTER ${pet.toUpperCase()}.`, dim: true }],
  note: 'vos pets se rencontrent tout de suite, sans passer par les rencontres. vous commencez avec ',
  noteBold: '7 vies',
  noteEnd: ' au niveau 1.',
  accept: 'accepter',
  later: 'plus tard',
  a11y: (pet: string, mine: string): string => `${pet} et ${mine}, côte à côte`,
};
