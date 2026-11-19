/**
 * Contenu de départ de Ton chemin (docs/CHEMIN.md) : 6 unités de 2 étapes, 5 questions par étape (60 questions).
 * Forme seulement (axe, sens, format, options, traits partagés) ; les textes sont dans `texts.<langue>.ts`.
 * Chargé par `pnpm --filter @blowy/api chemin:seed` (base réelle, idempotent) et par l'adaptateur mémoire.
 *
 * Inspirations (réécrites en scènes du quotidien, sans bonne réponse) : items libres de l'IPIP (Big Five :
 * extraversion → rythme, conscience → cap, ouverture → ancrage), valeurs de Schwartz (sécurité et tradition ↔
 * ouverture au changement, réussite ↔ hédonisme), styles d'attachement en version grand public (proximité ↔
 * indépendance → foyer). Jamais : santé mentale, religion, politique, orientation sexuelle ; rien qui suppose un
 * couple ou des enfants.
 *
 * Poids d'une option : sa place sur l'axe (−100 à 100) ; sens de toutes les questions de départ : 1. Curseur : la
 * première option est le bout gauche, la seconde le bout droit.
 * L'unité 1 reprend 10 des 12 situations du test de vision (`legacyTestId`) : qui a passé le test l'a déjà faite, et
 * l'inscription peut devenir « Étape 1 ».
 */
import type { CheminFormat, VisionAxis } from '@blowy/domain';

export interface SeedOption {
  icon: string;
  weight: number;
  tag: string | null;
}
export interface SeedQuestion {
  id: string;
  format: CheminFormat;
  axis: VisionAxis;
  options: SeedOption[];
  legacyTestId: string | null;
}
export interface SeedUnit {
  id: string;
  icon: string;
  steps: { id: string; questions: SeedQuestion[] }[];
}

const o = (icon: string, weight: number, tag: string | null = null): SeedOption => ({ icon, weight, tag });
const choice = (id: string, axis: VisionAxis, options: SeedOption[]): SeedQuestion => ({ id, format: 'choice', axis, options, legacyTestId: null });
const slider = (id: string, axis: VisionAxis, left: SeedOption, right: SeedOption): SeedQuestion => ({ id, format: 'slider', axis, options: [left, right], legacyTestId: null });
const legacy = (id: string, axis: VisionAxis, options: SeedOption[]): SeedQuestion => ({ id: `vision_${id}`, format: 'choice', axis, options, legacyTestId: id });

/** Traits partagés (« Vous deux : … ») ; libellés dans `cheminText.tags`. */
export const SEED_TAGS = [
  'calme',
  'monde',
  'dehors',
  'cocooning',
  'projets',
  'temps_libre',
  'cuisine',
  'aventure',
  'fete',
  'sport',
  'ordre',
  'spontane',
  'plan',
  'racines',
  'voyage',
  'famille',
  'liberte',
  'fidelite',
  'humour',
  'accueil',
  'curiosite',
  'musique',
  'nature',
  'ville',
] as const;

export const SEED_UNITS: SeedUnit[] = [
  {
    id: 'vision',
    icon: '🧭',
    steps: [
      {
        id: 'vision_1',
        questions: [
          legacy('dimanche', 'rythme', [o('🛋️', -70, 'cocooning'), o('🎨', 70, 'dehors')]),
          legacy('enfants', 'foyer', [o('🍽️', 80, 'famille'), o('🥐', -80, 'liberte')]),
          legacy('mutation', 'ancrage', [o('📦', 75, 'voyage'), o('🏡', -75, 'racines')]),
          legacy('heritage', 'cap', [o('🐷', 75, 'plan'), o('🎁', -75, 'spontane')]),
          legacy('promotion', 'elan', [o('📈', 75, 'projets'), o('🌙', -75, 'temps_libre')]),
        ],
      },
      {
        id: 'vision_2',
        questions: [
          legacy('vacances', 'cap', [o('🎫', -65, 'spontane'), o('🗓️', 65, 'plan')]),
          legacy('appartement', 'foyer', [o('🪺', 70, 'famille'), o('🎒', -70, 'liberte')]),
          legacy('vendredi', 'rythme', [o('🪩', 75, 'dehors'), o('🛏️', -75, 'calme')]),
          legacy('cinq_ans', 'ancrage', [o('📍', -70, 'racines'), o('🌍', 70, 'voyage')]),
          legacy('projet', 'elan', [o('🛠️', 70, 'projets'), o('🌤️', -70, 'temps_libre')]),
        ],
      },
    ],
  },
  {
    id: 'energie',
    icon: '⚡',
    steps: [
      {
        id: 'energie_1',
        questions: [
          slider('energie_batterie', 'rythme', o('🛋️', -100, 'calme'), o('🎉', 100, 'monde')),
          choice('energie_samedi', 'rythme', [o('☕', -60, 'calme'), o('🚲', 50, 'dehors'), o('🥞', 30, 'monde')]),
          choice('energie_soiree', 'rythme', [o('🙋', 70, 'monde'), o('🤝', 10), o('🏠', -60, 'calme')]),
          choice('energie_pluie', 'elan', [o('🛠️', 60, 'projets'), o('📚', -50, 'cocooning'), o('🧁', 0, 'cuisine')]),
          slider('energie_semaine', 'elan', o('🐢', -100, 'temps_libre'), o('🚀', 100, 'projets')),
        ],
      },
      {
        id: 'energie_2',
        questions: [
          choice('energie_vacances', 'rythme', [o('🏖️', -60, 'calme'), o('🥾', 50, 'aventure'), o('🍹', 70, 'fete')]),
          choice('energie_ce_soir', 'rythme', [o('🙌', 60, 'dehors'), o('🤔', 0), o('😴', -60, 'cocooning')]),
          choice('energie_semi', 'elan', [o('🏃', 60, 'sport'), o('👯', 10), o('🥐', -50, 'temps_libre')]),
          choice('energie_cafe', 'rythme', [o('📖', -50, 'calme'), o('🎶', 50, 'monde')]),
          slider('energie_cinq_ans', 'elan', o('🌱', -100, 'temps_libre'), o('🏔️', 100, 'projets')),
        ],
      },
    ],
  },
  {
    id: 'habitudes',
    icon: '🗓️',
    steps: [
      {
        id: 'habitudes_1',
        questions: [
          choice('habitudes_courses', 'cap', [o('📝', 60, 'ordre'), o('🛒', -50, 'spontane'), o('📱', 40, 'ordre')]),
          choice('habitudes_valise', 'cap', [o('🧳', 70, 'plan'), o('🌙', 0), o('⏰', -60, 'spontane')]),
          slider('habitudes_budget', 'cap', o('🎈', -100, 'spontane'), o('📊', 100, 'ordre')),
          choice('habitudes_dimanche_soir', 'cap', [o('📅', 60, 'plan'), o('🍿', -50, 'spontane')]),
          choice('habitudes_rdv', 'cap', [o('⌚', 50, 'ordre'), o('🕗', 20), o('🙃', -50, 'spontane')]),
        ],
      },
      {
        id: 'habitudes_2',
        questions: [
          choice('habitudes_diner', 'rythme', [o('🍲', -50, 'cuisine'), o('🍜', 50, 'dehors'), o('🥡', -20, 'cocooning')]),
          slider('habitudes_week_end', 'cap', o('🎲', -100, 'spontane'), o('🗓️', 100, 'plan')),
          choice('habitudes_bureau', 'cap', [o('🧺', 60, 'ordre'), o('🌪️', -50, 'spontane')]),
          choice('habitudes_matin', 'elan', [o('📋', 50, 'projets'), o('☕', -50, 'temps_libre')]),
          choice('habitudes_bouger', 'rythme', [o('🧘', -40, 'calme'), o('⚽', 60, 'sport'), o('🛋️', -20, 'cocooning')]),
        ],
      },
    ],
  },
  {
    id: 'valeurs',
    icon: '💎',
    steps: [
      {
        id: 'valeurs_1',
        questions: [
          choice('valeurs_racines', 'ancrage', [o('🏡', -60, 'racines'), o('🧭', 50, 'voyage')]),
          slider('valeurs_temps_argent', 'elan', o('⏳', -100, 'temps_libre'), o('💰', 100, 'projets')),
          choice('valeurs_repas', 'foyer', [o('🍽️', 60, 'famille'), o('🗺️', -20, 'liberte'), o('🥂', -50, 'liberte')]),
          choice('valeurs_demenagement', 'foyer', [o('💪', 40, 'fidelite'), o('🍕', 0), o('🚗', -30)]),
          choice('valeurs_reussite', 'elan', [o('🏆', 60, 'projets'), o('🌿', -60, 'temps_libre'), o('🫶', -10, 'famille')]),
        ],
      },
      {
        id: 'valeurs_2',
        questions: [
          slider('valeurs_etranger', 'ancrage', o('🏠', -100, 'racines'), o('✈️', 100, 'voyage')),
          choice('valeurs_chez_toi', 'foyer', [o('🪴', 50, 'accueil'), o('🔑', -40, 'liberte'), o('🚐', -70, 'liberte')]),
          choice('valeurs_occasion', 'cap', [o('⚡', -60, 'spontane'), o('🧐', 60, 'plan')]),
          choice('valeurs_dix_ans', 'foyer', [o('🏘️', 70, 'famille'), o('🌬️', -70, 'liberte'), o('🎁', 0)]),
          slider('valeurs_boulot', 'cap', o('🔒', 100, 'plan'), o('🎢', -100, 'spontane')),
        ],
      },
    ],
  },
  {
    id: 'autres',
    icon: '🤝',
    steps: [
      {
        id: 'autres_1',
        questions: [
          choice('autres_silence', 'foyer', [o('🧘', -40, 'liberte'), o('📱', 20, 'humour'), o('🤔', 30)]),
          choice('autres_bande', 'rythme', [o('👯', 60, 'monde'), o('🫂', -40, 'fidelite')]),
          choice('autres_improviste', 'foyer', [o('🎉', 50, 'accueil'), o('😬', -40, 'calme')]),
          choice('autres_anniversaire', 'rythme', [o('🎂', 70, 'fete'), o('🍷', -20), o('🙈', -60, 'calme')]),
          choice('autres_conseil', 'cap', [o('📋', 60, 'plan'), o('💬', -50, 'spontane'), o('🍕', 0, 'cuisine')]),
        ],
      },
      {
        id: 'autres_2',
        questions: [
          slider('autres_rencontrer', 'rythme', o('🫣', -100, 'calme'), o('🤩', 100, 'monde')),
          slider('autres_proches', 'foyer', o('🌬️', -100, 'liberte'), o('🫶', 100, 'famille')),
          choice('autres_vacances', 'cap', [o('🗂️', 70, 'plan'), o('🙋', 10), o('🎈', -50, 'spontane')]),
          choice('autres_voisins', 'ancrage', [o('👋', -60, 'racines'), o('🚪', 0), o('🕵️', 30)]),
          choice('autres_annule', 'cap', [o('😌', -40, 'spontane'), o('😤', 50, 'plan')]),
        ],
      },
    ],
  },
  {
    id: 'gouts',
    icon: '🎨',
    steps: [
      {
        id: 'gouts_1',
        questions: [
          choice('gouts_voyage', 'ancrage', [o('🏯', 70, 'voyage'), o('🏡', -50, 'racines'), o('🏙️', 20, 'ville')]),
          choice('gouts_resto', 'ancrage', [o('🌶️', 60, 'curiosite'), o('🍝', -50, 'racines')]),
          choice('gouts_musique', 'rythme', [o('🎧', -50, 'musique'), o('🎤', 60, 'fete'), o('🎸', 30, 'musique')]),
          slider('gouts_nature_ville', 'rythme', o('🌲', -100, 'nature'), o('🏙️', 100, 'ville')),
          slider('gouts_nouveau', 'ancrage', o('🧸', -100, 'racines'), o('🧪', 100, 'curiosite')),
        ],
      },
      {
        id: 'gouts_2',
        questions: [
          choice('gouts_film', 'ancrage', [o('🎬', -40, 'racines'), o('🎞️', 50, 'curiosite'), o('🍿', 0)]),
          choice('gouts_fin_week_end', 'ancrage', [o('🏕️', 50, 'aventure'), o('🛋️', -50, 'cocooning')]),
          choice('gouts_temps_libre', 'elan', [o('📖', -50, 'temps_libre'), o('🎯', 50, 'projets')]),
          choice('gouts_saison', 'rythme', [o('❄️', -60, 'cocooning'), o('☀️', 60, 'dehors'), o('🍂', -10, 'nature'), o('🌸', 20)]),
          choice('gouts_surprise', 'cap', [o('🤩', -60, 'spontane'), o('😅', 50, 'plan')]),
        ],
      },
    ],
  },
];

export const SEED_QUESTIONS: SeedQuestion[] = SEED_UNITS.flatMap((u) => u.steps.flatMap((s) => s.questions));
