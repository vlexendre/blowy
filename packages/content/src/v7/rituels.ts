/**
 * Textes et catalogues des rituels (V7) : habitudes, défis du jour, « Tu es sorti aujourd’hui ? », verdicts de preuve,
 * bilan de la semaine. Dictionnaires à clés, en français ; une passe de traduction suivra (`rituelsText(locale)`).
 * Majuscule en début de phrase, espaces insécables avant : ; ? ! Jamais « pet » : « minimoa ».
 * Les règles (quand, combien, quoi dire) sont dans `@blowy/domain` (rituels) ; ici, seulement les mots et les catalogues.
 */
import type {
  DailyKind,
  HabitRhythm,
  LinkNote,
  OutingAnswer,
  ProofVerdict,
  ReviewHighlight,
  ReviewTip,
  VisionAxis,
} from '@blowy/domain';
import { visionAxisText } from './vision';

// ── Habitudes ──────────────────────────────────────────────────────────────

export interface HabitDef {
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
  label: string;
  /** Ce que le minimoa demande en photo (« Montre-moi tes baskets. »). */
  ask: string;
}

const h = (
  id: string,
  axis: VisionAxis,
  lean: number,
  social: boolean,
  sociability: number,
  rhythm: HabitRhythm,
  proofHour: number,
  label: string,
  ask: string,
): HabitDef => ({ id, axis, lean, social, sociability, rhythm, proofHour, label, ask });

/** Catalogue des habitudes, relié aux axes de vision. L'ordre est celui de l'écran de choix. */
export const HABITS: readonly HabitDef[] = [
  h('marcher', 'rythme', 30, false, 6, 'daily', 18, 'Marcher', 'Montre-moi tes baskets.'),
  h('sport', 'rythme', 40, false, 4, 'three_per_week', 19, 'Faire du sport', 'Montre-moi ta tenue de sport.'),
  h('voir_un_ami', 'rythme', 45, true, 15, 'three_per_week', 20, 'Voir un ami', 'Montre-moi où vous êtes. Pas besoin de visages.'),
  h('appeler_un_proche', 'foyer', 30, true, 10, 'three_per_week', 19, 'Appeler un proche', 'Montre-moi le téléphone qui a servi.'),
  h('cuisiner', 'foyer', 35, false, 0, 'three_per_week', 20, 'Cuisiner', 'Montre-moi ce qui mijote.'),
  h('lire', 'rythme', -35, false, 0, 'daily', 21, 'Lire', 'Montre-moi la page où tu en es.'),
  h('creer', 'elan', 40, false, 0, 'three_per_week', 20, 'Créer quelque chose', 'Montre-moi ce que tu as fait.'),
  h('apprendre', 'elan', 35, false, 0, 'daily', 20, 'Apprendre', 'Montre-moi ce que tu apprends.'),
  h('se_coucher_tot', 'rythme', -30, false, 0, 'daily', 21, 'Se coucher tôt', 'Montre-moi ta table de nuit.'),
  h('planifier', 'cap', 40, false, 0, 'three_per_week', 19, 'Préparer sa semaine', 'Montre-moi ton planning.'),
  h('decouvrir', 'ancrage', 40, false, 8, 'three_per_week', 17, 'Découvrir un nouvel endroit', 'Montre-moi où tu es.'),
  h('plantes', 'ancrage', -30, false, 0, 'three_per_week', 18, 'S’occuper de ses plantes', 'Montre-moi tes plantes.'),
];

const HABITS_BY_ID = new Map(HABITS.map((x) => [x.id, x]));
export const habitById = (id: string): HabitDef | undefined => HABITS_BY_ID.get(id);
export const HABIT_IDS: readonly string[] = HABITS.map((x) => x.id);

export const rhythmLabel: Record<HabitRhythm, string> = { daily: 'Tous les jours', three_per_week: '3 fois par semaine' };

/** Une phrase gentille par verdict ; plusieurs variantes, choisies de façon stable. */
export const proofVerdictLines: Record<ProofVerdict, readonly string[]> = {
  yes: ['Vu. Ça compte.', 'Validé. Ton minimoa prend note.', 'C’est bon. Belle régularité.'],
  no: ['Je ne reconnais pas l’habitude sur cette photo. Tu peux en reprendre une.', 'Je ne vois pas le rapport. Une autre photo ?'],
  unsure: ['Difficile à dire. Je te fais confiance, ça compte.', 'Je ne suis pas sûr, mais je te crois. C’est compté.'],
};

// ── « Tu es sorti aujourd’hui ? » ─────────────────────────────────────────

export const outingText = {
  question: 'Tu es sorti aujourd’hui ?',
  answers: { saw_people: 'Oui, j’ai vu du monde', walk: 'Oui, un tour', not_yet: 'Pas encore' } as Record<OutingAnswer, string>,
  /** Réponse du minimoa. */
  reply: {
    saw_people: 'Parfait. Je me sens déjà plus sociable.',
    walk: 'Un tour, c’est un tour. Merci pour l’air frais.',
    not_yet: 'D’accord. Je reste près de la porte.',
  } as Record<OutingAnswer, string>,
  confirmed: 'Ta position le confirme : tu étais bien dehors.',
} as const;

// ── Défis du jour ──────────────────────────────────────────────────────────

export interface DailyChoice {
  label: string;
  /** Valeur du signal de vision enregistré pour ce choix (−100 à 100). */
  value: number;
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

const q = (id: string, axis: VisionAxis, text: string, a: string, va: number, b: string, vb: number): DailyDef => ({
  id,
  kind: 'question',
  axis,
  text,
  choices: [
    { label: a, value: va },
    { label: b, value: vb },
  ],
});
const task = (id: string, kind: Exclude<DailyKind, 'question'>, text: string): DailyDef => ({ id, kind, axis: null, text, choices: null });

/** Catalogue des défis du jour. Chaque axe a au moins trois questions. */
export const DAILY_CHALLENGES: readonly DailyDef[] = [
  q('q_foyer_table', 'foyer', 'Un dimanche dans dix ans ?', 'Une grande table, du bruit, des enfants', 60, 'Libre, sans programme', -60),
  q('q_foyer_cles', 'foyer', 'Donner un double de tes clés à quelqu’un ?', 'Avec plaisir, c’est le début d’un foyer', 50, 'Mes clés restent à moi', -50),
  q('q_foyer_fetes', 'foyer', 'Les fêtes de fin d’année, tu les vois…', 'En famille, la tienne ou une à construire', 50, 'Entre amis, ou en voyage', -50),
  q('q_ancrage_offre', 'ancrage', 'Un job rêvé, mais à Montréal ?', 'Je pars', 60, 'Je cherche le même ici', -60),
  q('q_ancrage_quartier', 'ancrage', 'Ton quartier dans cinq ans ?', 'Le même, j’y ai mes repères', -50, 'Aucune idée, et ça me plaît', 50),
  q('q_ancrage_valise', 'ancrage', 'Une valise toujours prête ?', 'Évidemment', 50, 'Elle dort au grenier', -50),
  q('q_elan_soirs', 'elan', 'Un projet perso te prendrait tes soirs pendant un an.', 'Je fonce', 60, 'Mes soirs sont sacrés', -60),
  q('q_elan_vendredi', 'elan', 'Vendredi 18 h, un dossier urgent arrive.', 'Je m’y mets, ça me motive', 50, 'Lundi, il sera encore là', -50),
  q('q_elan_reve', 'elan', 'Ton rêve à cinq ans, c’est plutôt…', 'Construire quelque chose de grand', 50, 'Avoir du temps pour moi', -50),
  q('q_rythme_samedi', 'rythme', 'Samedi soir idéal ?', 'Dehors, et on verra jusqu’à quelle heure', 60, 'Chez moi, tranquille', -60),
  q('q_rythme_agenda', 'rythme', 'Ta semaine idéale compte…', 'Une sortie presque tous les soirs', 50, 'Deux soirs dehors, pas plus', -50),
  q('q_rythme_vacances', 'rythme', 'En vacances, plutôt…', 'Trois activités par jour', 50, 'Un hamac et un livre', -50),
  q('q_cap_argent', 'cap', 'Un bonus inattendu arrive.', 'Je le mets de côté', 60, 'Je me fais plaisir', -60),
  q('q_cap_voyage', 'cap', 'Un voyage, tu le prépares…', 'Des mois à l’avance', 50, 'La veille, ou pas du tout', -50),
  q('q_cap_dix_ans', 'cap', 'Savoir où tu seras dans dix ans ?', 'Rassurant', 50, 'Étouffant', -50),
  task('p_sourire', 'photo', 'Montre-moi ce qui t’a fait sourire aujourd’hui.'),
  task('p_fenetre', 'photo', 'Montre-moi la vue depuis ta fenêtre.'),
  task('p_assiette', 'photo', 'Montre-moi ton assiette du jour.'),
  task('p_couleur', 'photo', 'Montre-moi quelque chose de jaune.'),
  task('p_dehors', 'photo', 'Montre-moi un coin de ta rue.'),
  task('p_objet', 'photo', 'Montre-moi l’objet dont tu ne te sépares pas.'),
  task('w_nouvelles', 'write', 'Écris à quelqu’un de tes liens, juste pour prendre des nouvelles.'),
  task('w_souvenir', 'write', 'Rappelle un bon souvenir à l’un de tes liens.'),
  task('w_question', 'write', 'Pose une vraie question à l’un de tes liens.'),
  task('w_compliment', 'write', 'Envoie un compliment sincère à l’un de tes liens.'),
  task('o_air', 'go_out', 'Sors prendre l’air, même dix minutes.'),
  task('o_cafe', 'go_out', 'Prends un café dehors, pas chez toi.'),
  task('o_nouveau', 'go_out', 'Passe par une rue que tu ne connais pas.'),
  task('o_quelquun', 'go_out', 'Va voir quelqu’un, en vrai.'),
];

const DAILY_BY_ID = new Map(DAILY_CHALLENGES.map((d) => [d.id, d]));
export const dailyById = (id: string): DailyDef | undefined => DAILY_BY_ID.get(id);

export const dailyText = {
  /** Présentation de la carte par le minimoa. */
  intro: 'Le défi du jour.',
  done: 'Fait. À demain.',
  kindLabel: { question: 'Une question', photo: 'Une photo', write: 'Un mot à un lien', go_out: 'Sortir' } as Record<DailyKind, string>,
  /** Ce qu'il reste à faire pour que le défi compte (types qui se valident par une action ailleurs). */
  howTo: {
    question: 'Choisis une réponse.',
    photo: 'Prends la photo dans l’app.',
    write: 'Écris un message dans l’un de tes liens, puis reviens ici.',
    go_out: 'Réponds « oui » à « Tu es sorti aujourd’hui ? ».',
  } as Record<DailyKind, string>,
} as const;

// ── Erreurs (codes du contrat, messages ici) ───────────────────────────────

export const rituelsErrors = {
  outingDone: 'Ta sortie du jour est déjà comptée. Merci pour l’air frais.',
  habitUnknown: 'Cette habitude n’existe pas.',
  habitLimit: (limit: number): string => `Tu suis déjà ${limit} habitudes. Avec Blowy+, tu peux en suivre jusqu’à 6.`,
  habitLimitPlus: 'Tu suis déjà 6 habitudes : c’est le maximum.',
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
    go_out: 'Dis-moi d’abord si tu es sorti aujourd’hui.',
  },
  reviewNotFound: 'Ce bilan n’existe pas.',
} as const;

// ── Bilan de la semaine ────────────────────────────────────────────────────

const plural = (n: number, one: string, many: string): string => `${n} ${n > 1 ? many : one}`;

export interface ReviewVars {
  petName: string;
  outings: number;
  habitsKept: number;
  challengesDone: number;
  streak: number;
}

export const reviewText = {
  title: 'Ta semaine',
  intro: (petName: string): string => `Le bilan de ${petName}.`,
  highlight: {
    outings: (v: ReviewVars): string => `${plural(v.outings, 'sortie', 'sorties')} cette semaine. ${v.petName} a pris l’air avec toi.`,
    habits: (v: ReviewVars): string => `${plural(v.habitsKept, 'habitude tenue', 'habitudes tenues')}. Ça se voit sur ${v.petName}.`,
    challenges: (v: ReviewVars): string => `${plural(v.challengesDone, 'défi du jour relevé', 'défis du jour relevés')}.`,
    streak: (v: ReviewVars): string => `Ta série en est à ${v.streak} jours. La mèche brille.`,
    calm: (v: ReviewVars): string => `Une semaine calme. ${v.petName} en a profité pour se reposer.`,
  } as Record<ReviewHighlight, (v: ReviewVars) => string>,
  noticed: (axis: VisionAxis, direction: 'up' | 'down'): string => {
    const t = visionAxisText[axis];
    return `Ta vision bouge un peu sur ${t.name.toLowerCase()} : plutôt « ${(direction === 'up' ? t.high : t.low).toLowerCase()} », pour l’instant.`;
  },
  noticedSteady: 'Ta vision garde son cap cette semaine.',
  tip: {
    go_out: 'Une idée pour la semaine : une sortie de plus, même courte.',
    habit: 'Une idée pour la semaine : choisir une habitude simple et la montrer à ton minimoa.',
    challenge: 'Une idée pour la semaine : le défi du jour, il prend deux minutes.',
    write: 'Une idée pour la semaine : écrire à quelqu’un que tu aimes bien, juste pour prendre des nouvelles.',
    keep_going: 'Une idée pour la semaine : continuer sur cette lancée.',
  } as Record<ReviewTip, string>,
  link: {
    photo_streak: (name: string, streak: number): string => `Avec ${name} : ${streak} photos du jour d’affilée.`,
    close: (name: string): string => `Avec ${name} : vous vous connaissez de mieux en mieux.`,
    steady: (name: string): string => `Avec ${name} : un lien solide.`,
    growing: (name: string): string => `Avec ${name} : ça se construit, tranquillement.`,
  } as Record<LinkNote, (name: string, streak: number) => string>,
  /** Blowy+ : détail par axe sur quatre semaines et audit de chaque lien. */
  detailedAxis: (axis: VisionAxis, delta: number): string => {
    const t = visionAxisText[axis];
    if (Math.abs(delta) < 5) return `${t.name} : stable.`;
    return `${t.name} : ${delta > 0 ? '+' : '−'}${Math.abs(Math.round(delta))} vers « ${(delta > 0 ? t.high : t.low).toLowerCase()} ».`;
  },
  detailedLink: (name: string, level: number, lives: number): string => `Avec ${name} : niveau ${level}, ${plural(lives, 'vie', 'vies')}.`,
  /** Consigne stable donnée au modèle qui reformule (mise en cache par la passerelle IA). */
  coachSystem:
    'Tu es un petit personnage, le minimoa de la personne. Tu reformules son bilan de la semaine en français, en tutoyant, ' +
    'en 4 à 6 phrases courtes, avec un humour sec et chaleureux. Tu gardes tous les faits et tous les chiffres, sans en inventer. ' +
    'Tu restes toujours positif : tu nommes ce qui a marché ; le conseil reste une proposition. Aucun reproche, aucune culpabilité, ' +
    'aucun emoji, aucun diagnostic. Réponds seulement avec le texte du bilan.',
} as const;

// ── Preuve d'habitude : consigne de la vérification par IA ────────────────

export const habitProofSystem =
  'Tu vérifies une photo envoyée comme preuve d’une habitude. Réponds sur une seule ligne : ' +
  'YES si la photo montre clairement l’habitude, NO si elle n’a clairement aucun rapport, UNSURE sinon. ' +
  'Ne décris pas les personnes. Rien d’autre que YES, NO ou UNSURE.';

export const habitProofPrompt = (habit: HabitDef): string => `Habitude : « ${habit.label} ». Ce qui était demandé : « ${habit.ask} »`;

// ── Notifications (variables passées au Notifier ; le texte est rendu par la plateforme) ──

export const rituelsNotificationVars = {
  dailyChallenge: (d: DailyDef): Record<string, string> => ({ challenge: d.text }),
  habitProof: (habit: HabitDef): Record<string, string> => ({ habit: habit.label, ask: habit.ask }),
  streakInDanger: (streak: number): Record<string, string> => ({ streak: String(streak) }),
  itemUnlocked: (itemId: string, reason: string): Record<string, string> => ({ item: itemId, reason }),
  weeklyReview: (petName: string): Record<string, string> => ({ petName }),
} as const;

/** Dictionnaire des rituels pour une langue ; tout est en français en attendant la traduction. */
export function rituelsText(_locale: string = 'fr') {
  return { outingText, dailyText, reviewText, rituelsErrors, proofVerdictLines, rhythmLabel } as const;
}
