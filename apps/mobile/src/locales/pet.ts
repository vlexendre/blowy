/** Textes de l'accueil (Mon pet), du caractère, de la garde-robe et de l'écran Évolution. */
import type { GaugeKey, ItemSlot, NeedKey, PetForm, StatKey } from '@blowy/domain';
import type { TitleSegment } from '@blowy/ui';

const low = (s: string): string => s.toLowerCase();

/** « plutôt joueur », adjectif accordé au masculin (le pet). */
const formTitle: Record<PetForm, string> = {
  equilibre: 'ÉQUILIBRÉ.',
  casanier: 'PLUTÔT\nCASANIER',
  sociable: 'PLUTÔT\nSOCIABLE',
  joueur: 'PLUTÔT\nJOUEUR.',
  piquant: 'PLUTÔT\nPIQUANT',
  tendre: 'PLUTÔT\nTENDRE.',
};

export const pet = {
  title: (name: string, form: PetForm): TitleSegment[] => [{ text: `${name.toUpperCase()},\n` }, { text: formTitle[form], dim: true }],
  mood: (form: PetForm): string => (form === 'equilibre' ? 'd’humeur égale' : `d’humeur ${moodWord[form]}`),
  speech: {
    equilibre: 'je suis un peu tout à la fois. fais-moi pencher.',
    casanier: 'un plaid, une série. c’est tout ce que je demande.',
    sociable: 'je me sens pousser des antennes.',
    joueur: 'on joue à quoi aujourd’hui ?',
    piquant: 'je dis les choses. gentiment. presque.',
    tendre: 'viens là que je te fasse un câlin.',
  } as Record<PetForm, string>,
  petA11y: (name: string): string => `${name}, toucher pour le renommer`,
  renameA11y: (name: string): string => `renommer ${name}`,
  renameLabel: 'son petit nom',
  renameHint: '14 caractères max.',
  renameSave: 'garder ce nom',
  renameCancel: 'annuler',
  renameError: 'Impossible de le renommer. Réessaie.',
  gaugesTitle: 'son caractère',
  gaugesHint: 'touche une jauge',
  gaugeNames: { social: 'sociabilité', play: 'jeu', tender: 'tendresse', talk: 'parole' } as Record<GaugeKey, string>,
  gaugesFooter: 'sans activité, ses jauges retombent doucement vers 0.',
  /** Encadré sous les jauges : ce qui fait monter (↑) ou baisser (↓) la jauge choisie, et son effet sur l'allure. */
  gaugeDetail: {
    social: { up: 'croiser de nouveaux pets, ouvrir des chats', down: 'rester avec les mêmes liens', look: 'sociable : des antennes poussent. casanier : il s’arrondit, paupières lourdes.' },
    play: { up: 'défis, quiz, jeux dans le chat', down: 'les conversations calmes', look: 'joueur : une dent, un sourire en coin. posé : le regard tranquille.' },
    tender: { up: 'photos du jour, câlins, prendre soin', down: 'les vannes et les roasts', look: 'tendre : poils longs, joues roses. piquant : poils dressés, une crête.' },
    talk: { up: 'messages et vocaux', down: 'le silence radio', look: 'bavard : la bouche s’agrandit. discret : elle se fait toute petite.' },
  } as Record<GaugeKey, { up: string; down: string; look: string }>,
  week: '7 jours',
  weekQuiet: 'rien de neuf',
  /** « +12 sociable », « −5 bavard » : variation signée, nommée par le pôle haut de la jauge. */
  weekDelta: (value: number, pole: string): string => `${value > 0 ? '+' : '−'}${Math.abs(value)} ${pole}`,
  weekMet: (n: number): string => `${n} ${n > 1 ? 'pets croisés' : 'pet croisé'}`,
  wardrobe: 'garde-robe',
  wardrobeA11y: 'ouvrir la garde-robe',
  back: 'Retour',
  challengeLabel: 'défi du jour',
  challengeDone: 'fait ! reviens demain',
  challengeError: 'Ta réponse n’est pas partie. Réessaie.',
  words: (n: number): string => (n === 0 ? 'aucun « 3 mots » reçu' : `${n} « 3 mots » ${n > 1 ? 'reçus' : 'reçu'}`),
  evolution: 'son évolution',
  loadError: 'Impossible de charger ton pet',
  retry: 'réessayer',
};

const moodWord: Record<Exclude<PetForm, 'equilibre'>, string> = {
  casanier: 'casanière',
  sociable: 'sociable',
  joueur: 'joueuse',
  piquant: 'piquante',
  tendre: 'tendre',
};

export const evolution = {
  back: 'Retour',
  title: [{ text: 'IL CHANGE\n' }, { text: 'AVEC TOI.', dim: true }] as TitleSegment[],
  age: (days: number): string =>
    days < 1 ? 'né aujourd’hui' : days < 60 ? `${days} ${days > 1 ? 'jours' : 'jour'} avec toi` : `${Math.floor(days / 30)} mois avec toi`,
  /** Puce de date d'une étape passée (« septembre »). */
  month: (iso: string): string => new Date(iso).toLocaleDateString('fr-FR', { month: 'long' }),
  /** Légende d'une forme dans la frise. */
  story: {
    equilibre: 'un peu de tout.',
    casanier: 'que du canapé.',
    sociable: 'des pets croisés.',
    joueur: 'toujours partant.',
    piquant: 'la vanne facile.',
    tendre: 'que des câlins.',
  } as Record<PetForm, string>,
  /** Ce que la forme change à son allure. */
  look: {
    equilibre: '→ ni crête ni antennes.',
    casanier: '→ tout rond, paupières lourdes.',
    sociable: '→ des antennes poussent.',
    joueur: '→ une dent de plus, sourire en coin.',
    piquant: '→ poils courts dressés et une crête.',
    tendre: '→ poils longs et joues roses.',
  } as Record<PetForm, string>,
  now: 'aujourd’hui',
  formsTitle: 'ce qu’il peut devenir',
  formsHint: 'touche pour voir',
  formCaption: {
    equilibre: 'un peu de tout',
    casanier: 'plus de calme',
    sociable: 'plus de rencontres',
    joueur: 'plus de défis',
    piquant: 'plus de vannes',
    tendre: 'plus de câlins',
  } as Record<PetForm, string>,
  how: {
    equilibre: 'rien de marqué : ses jauges restent proches du centre.',
    casanier: 'rester avec les mêmes liens, saluer moins de monde.',
    sociable: 'croiser de nouveaux pets, saluer, accepter des rencontres.',
    joueur: 'défis, quiz, et tu perds jamais exprès.',
    piquant: 'vannes, roasts, second degré à volonté.',
    tendre: 'photo du jour, câlins, soin de tes liens.',
  } as Record<PetForm, string>,
  howTitle: (form: string): string => `pour devenir ${low(form)} : `,
  speech: 'dans un sens, puis dans l’autre. rien n’est définitif.',
  decay: 'si tu lâches, ses jauges retombent doucement vers 0.',
};

const plural = (n: number, one: string, many: string): string => `${n} ${n > 1 ? many : one}`;

/** Accueil : le pet, ses besoins, les soins (V6-Accueil, V6-Boude). */
export const home = {
  wardrobe: 'garde-robe',
  wardrobeA11y: 'ouvrir sa garde-robe',
  petA11y: (name: string): string => `${name}, ton pet`,
  /** Ce que dit le pet : choisi selon son besoin le plus urgent, sinon une phrase joyeuse (3 par cas). */
  speech: {
    hunger: ['j’ai faim. et tu n’es pas venu hier.', 'mon ventre fait des bruits bizarres.', 'un petit truc à grignoter ?'],
    energy: ['je tombe de sommeil…', 'mes yeux se ferment tout seuls.', 'une sieste, vite.'],
    mood: ['je m’ennuie à mourir.', 'on joue ? juste un peu ?', 'un câlin, ça se refuse pas.'],
  } as Record<NeedKey, readonly string[]>,
  happy: ['on sort ce soir ? je suis prêt.', 'je suis au top. merci chef.', 'regarde-moi ce style.'],
  careError: 'Ça n’a pas marché. Réessaie.',
  /** Carte garde-robe. */
  wardrobeTitle: (owned: number, total: number): string => `${plural(owned, 'objet', 'objets')} sur ${total}`,
  wardrobeNext: (item: string, goal: string, have: number, need: number): string => `prochain : ${item}. ${goal} (${have}/${need})`,
  wardrobeAll: 'tu as tout gagné. respect.',
  wardrobeLoading: 'sa garde-robe…',
  newCount: (n: number): string => (n > 1 ? `${n} nouveaux` : '1 nouveau'),
  /** Carte caractère. */
  character: 'son caractère',
  characterText: (form: string, challengeDone: boolean): string => `${form} · ${challengeDone ? 'défi du jour relevé' : 'défi du jour à faire'}`,
  characterA11y: 'ouvrir son caractère',
  /** Carte « il ne sort plus » (il boude). */
  sulkTitle: (name: string): string => `${name.toLowerCase()} ne sort plus`,
  sulkText: 'tant qu’il boude, il ne croise personne et tu ne peux plus saluer. tes liens, eux, continuent.',
  loadError: 'Impossible de charger ton pet',
  retry: 'réessayer',
};

/** Fête d'un objet gagné (V6-Debloque). */
export const unlock = {
  kicker: 'nouveau !',
  title: (item: string, pet: string): TitleSegment[] => [{ text: `${item.toUpperCase()}\n` }, { text: `POUR ${pet.toUpperCase()}.`, dim: true }],
  /** Ce qui l'a débloqué, au passé. */
  reason: {
    careDays: (n: number): string => `${plural(n, 'jour', 'jours')} de soins. c’est mérité.`,
    links: (n: number): string => `${plural(n, 'lien créé', 'liens créés')}. bien joué.`,
    bestLevel: (n: number): string => `niveau ${n} dans un lien. vous l’avez fait.`,
    bestStreak: (n: number): string => `une série de ${n} photos du jour. chapeau.`,
    challenges: (n: number): string => `${plural(n, 'défi relevé', 'défis relevés')}. pas mal.`,
    words: (n: number): string => `${plural(n, 'pote a', 'potes ont')} donné leurs 3 mots.`,
  } as Record<StatKey, (n: number) => string>,
  fallback: 'il est rangé dans sa garde-robe.',
  wear: 'il le porte',
  store: 'ranger dans la garde-robe',
};

/** Garde-robe (V6-GardeRobe, V6-Objet). */
export const wardrobe = {
  title: [{ text: 'GARDE-' }, { text: 'ROBE', dim: true }] as TitleSegment[],
  back: 'Retour',
  count: (owned: number, total: number): string => `${owned} / ${total}`,
  countA11y: (owned: number, total: number): string => `${owned} objets sur ${total}`,
  empty: 'rien',
  worn: 'porté',
  new: 'nouveau',
  premium: 'bientôt',
  hints: { owned: 'toucher pour le lui mettre', worn: 'toucher pour le retirer', locked: 'toucher pour voir comment le gagner', premium: 'bientôt disponible' },
  petA11y: (name: string): string => `${name} habillé`,
  /** Sous un objet à gagner : l'étape en bref. */
  goalShort: {
    careDays: (n: number): string => plural(n, 'jour de soins', 'jours de soins'),
    links: (n: number): string => plural(n, 'lien', 'liens'),
    bestLevel: (n: number): string => `niveau ${n} d’un lien`,
    bestStreak: (n: number): string => `série de ${n} photos`,
    challenges: (n: number): string => plural(n, 'défi', 'défis'),
    words: (n: number): string => (n > 1 ? `3 mots de ${n} potes` : '3 mots d’un pote'),
  } as Record<StatKey, (n: number) => string>,
  /** Titre de la fiche : le dernier mot estompé (« COURONNE DE / FLEURS »). */
  itemTitle: (name: string): TitleSegment[] => {
    const words = name.toUpperCase().split(' ');
    if (words.length < 2) return [{ text: words[0] ?? '' }];
    return [{ text: `${words.slice(0, -1).join(' ')} ` }, { text: words[words.length - 1] ?? '', dim: true }];
  },
  where: {
    head: 'se pose sur la tête. tes potes le verront dans vos chats.',
    face: 'se porte sur le visage. tes potes le verront dans vos chats.',
    body: 'se porte sur lui. tes potes le verront dans vos chats.',
    toy: 'reste à ses pieds. tes potes le verront dans vos chats.',
  } as Record<ItemSlot, string>,
  /** Où il en est, sous la barre. */
  goalHint: {
    careDays: (have: number): string => (have === 0 ? 'commence aujourd’hui : un soin suffit.' : `tu t’en es occupé ${plural(have, 'jour', 'jours')}.`),
    links: (have: number): string => (have === 0 ? 'pas encore de lien.' : `tu as ${plural(have, 'lien', 'liens')}.`),
    bestLevel: (have: number): string => (have === 0 ? 'pas encore de lien.' : `ton meilleur lien est au niveau ${have}.`),
    bestStreak: (have: number): string => (have === 0 ? 'pas encore de série.' : `ta meilleure série : ${plural(have, 'jour', 'jours')}.`),
    challenges: (have: number): string => `${plural(have, 'défi relevé', 'défis relevés')} pour l’instant.`,
    words: (have: number): string => (have === 0 ? 'personne n’a encore choisi tes 3 mots.' : `${plural(have, 'pote a', 'potes ont')} déjà répondu.`),
  } as Record<StatKey, (have: number) => string>,
  /** Raccourci vers l'endroit où on avance. */
  shortcut: {
    careDays: 'm’occuper de lui',
    links: 'trouver des pets',
    bestLevel: 'aller dans mes chats',
    bestStreak: 'faire la photo du jour',
    challenges: 'relever le défi du jour',
    words: 'partager mes 3 mots',
  } as Record<StatKey, string>,
  premiumNote: 'bientôt disponible',
  premiumText: 'cet objet arrive avec blowy+. pas encore en vente : on te prévient dès qu’il l’est.',
  close: 'fermer',
  loadError: 'Impossible d’ouvrir la garde-robe',
  outfitError: 'La tenue n’a pas changé. Réessaie.',
  retry: 'réessayer',
};
