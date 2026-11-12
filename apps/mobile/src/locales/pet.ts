/** Textes de l'onglet Mon pet et de l'écran Évolution. */
import type { GaugeKey, PetForm } from '@blowy/domain';
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
  wardrobeA11y: 'garde-robe, avec blowy+',
  plus: '+',
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
