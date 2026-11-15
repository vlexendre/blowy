/**
 * Textes et catalogues des rituels (V7) : habitudes, défis du jour, « Tu as mis le nez dehors aujourd’hui ? »,
 * verdicts de preuve, bilan de la semaine. Données (axes, rythmes, heures) ici ; mots par langue dans `rituelsText`.
 * Les règles (quand, combien, quoi dire) sont dans `@blowy/domain` (rituels) ; ici, seulement les mots et les catalogues.
 */
import type {
  DailyKind,
  HabitRhythm,
  LinkNote,
  Locale,
  OutingAnswer,
  ProofVerdict,
  ReviewHighlight,
  ReviewTip,
  VisionAxis,
} from '@blowy/domain';
import { TODO, defineMessages } from '../i18n/core';
import { visionText } from './vision';

// ── Habitudes (données) ───────────────────────────────────────────────────

interface HabitData {
  id: string;
  /** Axe de vision que l'habitude renseigne, et dans quel sens (valeur du signal, de −100 à 100). */
  axis: VisionAxis;
  lean: number;
  /** Tournée vers les autres : elle fait monter la sociabilité du minimoa. */
  social: boolean;
  /** Points de sociabilité gagnés quand elle est tenue. */
  sociability: number;
  /** Rythme proposé par défaut. */
  rhythm: HabitRhythm;
  /** Heure (Paris) à laquelle le minimoa demande la preuve, sauf choix de la personne. */
  proofHour: number;
}

export interface HabitDef extends HabitData {
  label: string;
  /** Ce que le minimoa demande en photo (« Montre-moi tes baskets. »). */
  ask: string;
}

const h = (id: string, axis: VisionAxis, lean: number, social: boolean, sociability: number, rhythm: HabitRhythm, proofHour: number): HabitData => ({
  id,
  axis,
  lean,
  social,
  sociability,
  rhythm,
  proofHour,
});

/** Catalogue des habitudes, relié aux axes de vision. L'ordre est celui de l'écran de choix. */
const HABIT_DATA: readonly HabitData[] = [
  h('marcher', 'rythme', 30, false, 6, 'daily', 18),
  h('sport', 'rythme', 40, false, 4, 'three_per_week', 19),
  h('voir_un_ami', 'rythme', 45, true, 15, 'three_per_week', 20),
  h('appeler_un_proche', 'foyer', 30, true, 10, 'three_per_week', 19),
  h('cuisiner', 'foyer', 35, false, 0, 'three_per_week', 20),
  h('lire', 'rythme', -35, false, 0, 'daily', 21),
  h('creer', 'elan', 40, false, 0, 'three_per_week', 20),
  h('apprendre', 'elan', 35, false, 0, 'daily', 20),
  h('se_coucher_tot', 'rythme', -30, false, 0, 'daily', 21),
  h('planifier', 'cap', 40, false, 0, 'three_per_week', 19),
  h('decouvrir', 'ancrage', 40, false, 8, 'three_per_week', 17),
  h('plantes', 'ancrage', -30, false, 0, 'three_per_week', 18),
];

// ── Défis du jour (données) ────────────────────────────────────────────────

export interface DailyChoice {
  label: string;
  /** Valeur du signal de vision enregistré pour ce choix (−100 à 100). */
  value: number;
}

interface DailyData {
  id: string;
  kind: DailyKind;
  axis: VisionAxis | null;
  /** Questions seulement : valeur de chaque choix. */
  values: readonly [number, number] | null;
}

export interface DailyDef {
  id: string;
  kind: DailyKind;
  axis: VisionAxis | null;
  /** Ce que le minimoa propose (question ou consigne). */
  text: string;
  /** Questions seulement : deux choix. */
  choices: readonly [DailyChoice, DailyChoice] | null;
}

const q = (id: string, axis: VisionAxis, va: number, vb: number): DailyData => ({ id, kind: 'question', axis, values: [va, vb] });
const task = (id: string, kind: Exclude<DailyKind, 'question'>): DailyData => ({ id, kind, axis: null, values: null });

/** Catalogue des défis du jour. Chaque axe a au moins trois questions. */
const DAILY_DATA: readonly DailyData[] = [
  q('q_foyer_table', 'foyer', 60, -60),
  q('q_foyer_cles', 'foyer', 50, -50),
  q('q_foyer_fetes', 'foyer', 50, -50),
  q('q_ancrage_offre', 'ancrage', 60, -60),
  q('q_ancrage_quartier', 'ancrage', -50, 50),
  q('q_ancrage_valise', 'ancrage', 50, -50),
  q('q_elan_soirs', 'elan', 60, -60),
  q('q_elan_vendredi', 'elan', 50, -50),
  q('q_elan_reve', 'elan', 50, -50),
  q('q_rythme_samedi', 'rythme', 60, -60),
  q('q_rythme_agenda', 'rythme', 50, -50),
  q('q_rythme_vacances', 'rythme', 50, -50),
  q('q_cap_argent', 'cap', 60, -60),
  q('q_cap_voyage', 'cap', 50, -50),
  q('q_cap_dix_ans', 'cap', 50, -50),
  task('p_sourire', 'photo'),
  task('p_fenetre', 'photo'),
  task('p_assiette', 'photo'),
  task('p_couleur', 'photo'),
  task('p_dehors', 'photo'),
  task('p_objet', 'photo'),
  task('w_nouvelles', 'write'),
  task('w_souvenir', 'write'),
  task('w_question', 'write'),
  task('w_compliment', 'write'),
  task('o_air', 'go_out'),
  task('o_cafe', 'go_out'),
  task('o_nouveau', 'go_out'),
  task('o_quelquun', 'go_out'),
];

// ── Mots ───────────────────────────────────────────────────────────────────

export interface ReviewVars {
  petName: string;
  outings: number;
  habitsKept: number;
  challengesDone: number;
  streak: number;
}

const plural = (n: number, one: string, many: string): string => `${n} ${n > 1 ? many : one}`;

const fr = {
  habits: {
      marcher: { label: 'Marcher', ask: 'Montre-moi tes baskets.' },
      sport: { label: 'Faire du sport', ask: 'Montre-moi ta tenue de sport.' },
      voir_un_ami: { label: 'Voir un ami', ask: 'Montre-moi où vous êtes. Pas besoin de visages.' },
      appeler_un_proche: { label: 'Appeler un proche', ask: 'Montre-moi le téléphone qui a servi.' },
      cuisiner: { label: 'Cuisiner', ask: 'Montre-moi ce qui mijote.' },
      lire: { label: 'Lire', ask: 'Montre-moi la page où tu en es.' },
      creer: { label: 'Créer quelque chose', ask: 'Montre-moi ce que tu as fait.' },
      apprendre: { label: 'Apprendre', ask: 'Montre-moi ce que tu apprends.' },
      se_coucher_tot: { label: 'Se coucher tôt', ask: 'Montre-moi ta table de nuit.' },
      planifier: { label: 'Préparer sa semaine', ask: 'Montre-moi ton planning.' },
      decouvrir: { label: 'Découvrir un nouvel endroit', ask: 'Montre-moi où tu es.' },
      plantes: { label: 'S’occuper de ses plantes', ask: 'Montre-moi tes plantes.' },
  } as Record<string, { label: string; ask: string }>,
  rhythmLabel: { daily: 'Tous les jours', three_per_week: '3 fois par semaine' } as Record<HabitRhythm, string>,
  /** Une phrase par verdict ; plusieurs variantes, choisies de façon stable. */
  proofVerdictLines: {
    yes: ['Vu. Ça compte.', 'Validé. Ton minimoa prend note.', 'C’est bon. Belle régularité.'],
    no: ['Je ne reconnais pas l’habitude sur cette photo. Tu peux en reprendre une.', 'Je ne vois pas le rapport. Une autre photo ?'],
    unsure: ['Difficile à dire. Je te fais confiance, ça compte.', 'Pas évident, mais je te crois. C’est compté.'],
  } as Record<ProofVerdict, readonly string[]>,
  outing: {
    question: 'Tu as mis le nez dehors aujourd’hui ?',
    answers: { saw_people: 'Oui, j’ai vu du monde', walk: 'Oui, un tour', not_yet: 'Pas encore' } as Record<OutingAnswer, string>,
    /** Réponse du minimoa. */
    reply: {
      saw_people: 'Parfait. Je me sens déjà plus sociable.',
      walk: 'Un tour, c’est un tour. Merci pour l’air frais.',
      not_yet: 'D’accord. Je reste près de la porte.',
    } as Record<OutingAnswer, string>,
    confirmed: 'Ta position le confirme : tu étais bien dehors.',
  },
  daily: {
    texts: {
      q_foyer_table: { text: 'Un dimanche dans dix ans ?', choices: ['Une grande table, du bruit, des enfants', 'Libre, sans programme'] },
      q_foyer_cles: { text: 'Donner un double de tes clés à quelqu’un ?', choices: ['Avec plaisir, c’est le début d’un foyer', 'Mes clés restent à moi'] },
      q_foyer_fetes: { text: 'Les fêtes de fin d’année, tu les vois…', choices: ['En famille, la tienne ou une à construire', 'Entre amis, ou en voyage'] },
      q_ancrage_offre: { text: 'Un job rêvé, mais à Montréal ?', choices: ['Je pars', 'Je cherche le même ici'] },
      q_ancrage_quartier: { text: 'Ton quartier dans cinq ans ?', choices: ['Le même, j’y ai mes repères', 'Aucune idée, et ça me plaît'] },
      q_ancrage_valise: { text: 'Une valise toujours prête ?', choices: ['Évidemment', 'Elle dort au grenier'] },
      q_elan_soirs: { text: 'Un projet perso te prendrait tes soirs pendant un an.', choices: ['Je fonce', 'Mes soirs sont sacrés'] },
      q_elan_vendredi: { text: 'Vendredi 18 h, un dossier urgent arrive.', choices: ['Je m’y mets, ça me motive', 'Lundi, il sera encore là'] },
      q_elan_reve: { text: 'Ton rêve à cinq ans, c’est plutôt…', choices: ['Construire quelque chose de grand', 'Avoir du temps pour moi'] },
      q_rythme_samedi: { text: 'Samedi soir idéal ?', choices: ['Dehors, et on verra jusqu’à quelle heure', 'Chez moi, tranquille'] },
      q_rythme_agenda: { text: 'Ta semaine idéale compte…', choices: ['Une sortie presque tous les soirs', 'Deux soirs dehors, pas plus'] },
      q_rythme_vacances: { text: 'En vacances, plutôt…', choices: ['Trois activités par jour', 'Un hamac et un livre'] },
      q_cap_argent: { text: 'Un bonus inattendu arrive.', choices: ['Je le mets de côté', 'Je me fais plaisir'] },
      q_cap_voyage: { text: 'Un voyage, tu le prépares…', choices: ['Des mois à l’avance', 'La veille, ou pas du tout'] },
      q_cap_dix_ans: { text: 'Savoir où tu seras dans dix ans ?', choices: ['Rassurant', 'Étouffant'] },
      p_sourire: { text: 'Montre-moi ce qui t’a fait sourire aujourd’hui.', choices: null },
      p_fenetre: { text: 'Montre-moi la vue depuis ta fenêtre.', choices: null },
      p_assiette: { text: 'Montre-moi ton assiette du jour.', choices: null },
      p_couleur: { text: 'Montre-moi quelque chose de jaune.', choices: null },
      p_dehors: { text: 'Montre-moi un coin de ta rue.', choices: null },
      p_objet: { text: 'Montre-moi l’objet dont tu ne te sépares pas.', choices: null },
      w_nouvelles: { text: 'Écris à quelqu’un de tes liens, juste pour prendre des nouvelles.', choices: null },
      w_souvenir: { text: 'Rappelle un bon souvenir à l’un de tes liens.', choices: null },
      w_question: { text: 'Pose une vraie question à l’un de tes liens.', choices: null },
      w_compliment: { text: 'Envoie un compliment sincère à l’un de tes liens.', choices: null },
      o_air: { text: 'Sors prendre l’air, même dix minutes.', choices: null },
      o_cafe: { text: 'Prends un café dehors, pas chez toi.', choices: null },
      o_nouveau: { text: 'Passe par une rue que tu ne connais pas.', choices: null },
      o_quelquun: { text: 'Va voir quelqu’un, en vrai.', choices: null },
    } as Record<string, { text: string; choices: readonly [string, string] | null }>,
    /** Présentation de la carte par le minimoa. */
    intro: 'Le défi du jour.',
    done: 'Fait. À demain.',
    kindLabel: { question: 'Une question', photo: 'Une photo', write: 'Un mot à un lien', go_out: 'Sortir' } as Record<DailyKind, string>,
    /** Ce qu'il reste à faire pour que le défi compte (types qui se valident par une action ailleurs). */
    howTo: {
      question: 'Choisis une réponse.',
      photo: 'Prends la photo dans l’app.',
      write: 'Écris un message dans l’un de tes liens, puis reviens ici.',
      go_out: 'Réponds « oui » à « Tu as mis le nez dehors aujourd’hui ? ».',
    } as Record<DailyKind, string>,
  },
  /** Erreurs (codes du contrat, messages ici). */
  errors: {
    outingDone: 'Ta sortie du jour est déjà comptée. Merci pour l’air frais.',
    habitUnknown: 'Cette habitude n’existe pas.',
    habitLimit: (limit: number): string => `Tu suis déjà ${limit} habitudes. Avec Blowy+, tu peux en suivre jusqu’à 6.`,
    habitLimitPlus: 'Tu suis déjà 6 habitudes : c’est le maximum.',
    habitTaken: 'Tu suis déjà cette habitude.',
    habitNotFound: 'Cette habitude n’est plus suivie.',
    habitDoneToday: 'Cette habitude est déjà comptée aujourd’hui.',
    proofPath: 'Cette photo ne correspond pas à ta preuve du jour.',
    proofMissing: 'La photo n’est pas encore arrivée. Réessaie.',
    proofGone: 'Cette photo n’est plus disponible.',
    dailyDone: 'Le défi du jour est déjà fait. À demain.',
    dailyKind: 'Ce n’est pas ce que demande le défi du jour.',
    dailyNotYet: {
      write: 'Écris d’abord un message dans l’un de tes liens.',
      go_out: 'Dis-moi d’abord si tu as mis le nez dehors aujourd’hui.',
    },
    reviewNotFound: 'Ce bilan n’existe pas.',
  },
  /** Bilan de la semaine. */
  review: {
    title: 'Ta semaine',
    intro: (petName: string): string => `Le bilan de ${petName}.`,
    highlight: {
      outings: (v: ReviewVars): string => `${plural(v.outings, 'sortie', 'sorties')} cette semaine. ${v.petName} a pris l’air avec toi.`,
      habits: (v: ReviewVars): string => `${plural(v.habitsKept, 'habitude tenue', 'habitudes tenues')}. Ça se voit sur ${v.petName}.`,
      challenges: (v: ReviewVars): string => `${plural(v.challengesDone, 'défi du jour relevé', 'défis du jour relevés')}.`,
      streak: (v: ReviewVars): string => `Ta série en est à ${v.streak} jours. La mèche brille.`,
      calm: (v: ReviewVars): string => `Une semaine calme. ${v.petName} en a profité pour se reposer.`,
    } as Record<ReviewHighlight, (v: ReviewVars) => string>,
    /** `axis` : nom de l'axe en minuscules ; `pole` : le pôle vers lequel la vision bouge. */
    noticed: (axis: string, pole: string): string => `Ta vision bouge un peu sur ${axis} : plutôt « ${pole} », pour l’instant.`,
    noticedSteady: 'Ta vision garde son cap cette semaine.',
    tip: {
      go_out: 'Une idée pour la semaine : une sortie de plus, même courte.',
      habit: 'Une idée pour la semaine : choisir une habitude simple et la montrer à ton minimoa.',
      challenge: 'Une idée pour la semaine : le défi du jour. Il prend deux minutes.',
      write: 'Une idée pour la semaine : écrire à quelqu’un que tu aimes bien, juste pour prendre des nouvelles.',
      keep_going: 'Une idée pour la semaine : continuer sur cette lancée.',
    } as Record<ReviewTip, string>,
    link: {
      photo_streak: (name: string, streak: number): string => `Avec ${name} : ${streak} photos du jour d’affilée.`,
      close: (name: string): string => `Avec ${name} : vous vous connaissez de mieux en mieux.`,
      steady: (name: string): string => `Avec ${name} : un lien solide.`,
      growing: (name: string): string => `Avec ${name} : ça se construit, tranquillement.`,
    } as Record<LinkNote, (name: string, streak: number) => string>,
    /** Blowy+ : détail par axe sur quatre semaines (`pole` en minuscules) et audit de chaque lien. */
    detailedAxisStable: (axis: string): string => `${axis} : stable.`,
    detailedAxis: (axis: string, signedDelta: string, pole: string): string => `${axis} : ${signedDelta} vers « ${pole} ».`,
    detailedLink: (name: string, level: number, lives: number): string => `Avec ${name} : niveau ${level}, ${plural(lives, 'vie', 'vies')}.`,
  },
};

export const rituelsText = defineMessages({ fr, en: TODO, es: TODO, pt: TODO, nl: TODO });
export type RituelsText = typeof fr;

// ── Catalogues dans une langue ─────────────────────────────────────────────

const habitCache = new Map<Locale, readonly HabitDef[]>();
/** Les habitudes avec leurs mots dans une langue (français pour ce qui manque). */
export function habitsIn(locale: Locale): readonly HabitDef[] {
  let list = habitCache.get(locale);
  if (!list) {
    const words = rituelsText.in(locale).habits;
    list = HABIT_DATA.map((d) => ({ ...d, label: words[d.id]?.label ?? d.id, ask: words[d.id]?.ask ?? '' }));
    habitCache.set(locale, list);
  }
  return list;
}
export const habitById = (id: string, locale: Locale = 'fr'): HabitDef | undefined => habitsIn(locale).find((x) => x.id === id);
export const HABIT_IDS: readonly string[] = HABIT_DATA.map((x) => x.id);
/** Catalogue en français : pour les données (axes, rythmes). Le texte montré passe par `habitsIn(locale)`. */
export const HABITS: readonly HabitDef[] = habitsIn('fr');

const dailyCache = new Map<Locale, readonly DailyDef[]>();
/** Les défis du jour avec leurs mots dans une langue (français pour ce qui manque). */
export function dailyChallengesIn(locale: Locale): readonly DailyDef[] {
  let list = dailyCache.get(locale);
  if (!list) {
    const words = rituelsText.in(locale).daily.texts;
    list = DAILY_DATA.map((d) => {
      const w = words[d.id];
      const choices: DailyDef['choices'] =
        d.values && w?.choices ? [{ label: w.choices[0], value: d.values[0] }, { label: w.choices[1], value: d.values[1] }] : null;
      return { id: d.id, kind: d.kind, axis: d.axis, text: w?.text ?? d.id, choices };
    });
    dailyCache.set(locale, list);
  }
  return list;
}
export const dailyById = (id: string, locale: Locale = 'fr'): DailyDef | undefined => dailyChallengesIn(locale).find((d) => d.id === id);
/** Catalogue en français : pour les données (identifiants, types, axes). Le texte montré passe par `dailyChallengesIn(locale)`. */
export const DAILY_CHALLENGES: readonly DailyDef[] = dailyChallengesIn('fr');

// ── Bilan : phrases qui ont besoin des noms d'axes ─────────────────────────

export function reviewNoticedLine(locale: Locale, axis: VisionAxis, direction: 'up' | 'down'): string {
  const a = visionText.in(locale).axes[axis];
  return rituelsText.in(locale).review.noticed(a.name.toLowerCase(), (direction === 'up' ? a.high : a.low).toLowerCase());
}

export function reviewDetailedAxisLine(locale: Locale, axis: VisionAxis, delta: number): string {
  const a = visionText.in(locale).axes[axis];
  const r = rituelsText.in(locale).review;
  if (Math.abs(delta) < 5) return r.detailedAxisStable(a.name);
  return r.detailedAxis(a.name, `${delta > 0 ? '+' : '−'}${Math.abs(Math.round(delta))}`, (delta > 0 ? a.high : a.low).toLowerCase());
}

// ── Consignes des modèles (stables : mises en cache côté fournisseur ; pas montrées aux personnes) ──

/** Consigne donnée au modèle qui reformule le bilan : il garde la langue du texte reçu. */
export const reviewCoachSystem =
  'Tu es un petit personnage, le minimoa de la personne. Tu reformules son bilan de la semaine dans la langue du texte reçu, en tutoyant, ' +
  'en 4 à 6 phrases courtes, avec un humour sec et chaleureux. Tu gardes tous les faits et tous les chiffres, sans en inventer. ' +
  'Tu restes toujours positif : tu nommes ce qui a marché ; le conseil reste une proposition. Aucun reproche, aucune culpabilité, ' +
  'aucun emoji, aucun diagnostic. Réponds seulement avec le texte du bilan.';

export const habitProofSystem =
  'Tu vérifies une photo envoyée comme preuve d’une habitude. Réponds sur une seule ligne : ' +
  'YES si la photo montre clairement l’habitude, NO si elle n’a clairement aucun rapport, UNSURE sinon. ' +
  'Ne décris pas les personnes. Rien d’autre que YES, NO ou UNSURE.';

export const habitProofPrompt = (habit: HabitDef): string => `Habitude : « ${habit.label} ». Ce qui était demandé : « ${habit.ask} »`;

// ── Notifications (variables passées au Notifier ; le texte est rendu par `v7/notifications`) ──

export const rituelsNotificationVars = {
  dailyChallenge: (d: DailyDef): Record<string, string> => ({ challenge: d.text }),
  habitProof: (habit: HabitDef): Record<string, string> => ({ habit: habit.label, ask: habit.ask }),
  streakInDanger: (streak: number): Record<string, string> => ({ streak: String(streak) }),
  itemUnlocked: (itemId: string, reason: string): Record<string, string> => ({ item: itemId, reason }),
  weeklyReview: (petName: string): Record<string, string> => ({ petName }),
} as const;
