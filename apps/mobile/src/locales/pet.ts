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
  rename: 'renommer',
  renameLabel: 'son petit nom',
  renameHint: '14 caractères max.',
  renameSave: 'garder ce nom',
  renameCancel: 'annuler',
  renameError: 'Impossible de le renommer. Réessaie.',
  gaugesTitle: 'son caractère',
  gaugesHint: 'touche une jauge',
  gaugeNames: { social: 'sociabilité', play: 'jeu', tender: 'tendresse', talk: 'parole' } as Record<GaugeKey, string>,
  gaugesFooter: 'sans activité, ses jauges retombent doucement vers 0.',
  challengeLabel: 'défi du jour',
  challengeDone: 'fait ! reviens demain',
  challengeError: 'Ta réponse n’est pas partie. Réessaie.',
  words: (n: number): string => (n === 0 ? 'aucun « 3 mots » reçu' : `${n} « 3 mots » ${n > 1 ? 'reçus' : 'reçu'}`),
  wordsText: 'tes potes te décrivent en 3 mots, ça fait bouger ses jauges.',
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
  age: (days: number): string => (days < 1 ? 'né aujourd’hui' : `${days} ${days > 1 ? 'jours' : 'jour'} avec toi`),
  now: 'aujourd’hui',
  formsTitle: 'ce qu’il peut devenir',
  formsHint: 'touche pour voir',
  current: 'sa forme',
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
    joueur: 'relever les défis du jour, envoyer des photos.',
    piquant: 'les vannes. beaucoup de vannes.',
    tendre: 'photos du jour, mots doux, soin de tes liens.',
  } as Record<PetForm, string>,
  howTitle: (form: string): string => `pour devenir ${low(form)} : `,
  timelineTitle: 'ce qui l’a fait bouger',
  timelineEmpty: 'rien encore. écris, salue, relève un défi : il bougera.',
  speech: 'dans un sens, puis dans l’autre. rien n’est définitif.',
  decay: 'si tu lâches, ses jauges retombent doucement vers 0.',
  formA11y: (form: string, current: boolean): string => `${form}${current ? ', sa forme actuelle' : ''}`,
};
