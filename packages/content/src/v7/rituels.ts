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
import { type Translation, defineMessages } from '../i18n/core';
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
  /** Habitude validée sans photo ni IA (« Sans vérification par IA ») : on fait confiance, ça compte. */
  selfCheckLines: ['C’est noté. Je te fais confiance.', 'Sur parole, ça compte. Bien joué.'] as readonly string[],
  /** Photo reçue sans accord pour l'IA (ancienne version de l'app) : personne ne l'a vérifiée, on fait confiance. */
  proofUncheckedLines: ['Photo reçue, pas vérifiée : tu n’as pas activé l’IA. Je te fais confiance, ça compte.'] as readonly string[],
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
      q_foyer_fetes: { text: 'Les fêtes de fin d’année, tu les vois…', choices: ['En famille, la mienne ou une à construire', 'Entre amis, ou en voyage'] },
      q_ancrage_offre: { text: 'Un job rêvé, mais à Montréal ?', choices: ['Je pars', 'Je cherche le même ici'] },
      q_ancrage_quartier: { text: 'Ton quartier dans cinq ans ?', choices: ['Le même, j’y ai mes repères', 'Aucune idée, et ça me plaît'] },
      q_ancrage_valise: { text: 'Une valise toujours prête ?', choices: ['Évidemment', 'Elle dort au grenier'] },
      q_elan_soirs: { text: 'Un projet perso te prendrait tes soirs pendant un an.', choices: ['Je fonce', 'Mes soirs sont sacrés'] },
      q_elan_vendredi: { text: 'Vendredi 18 h, un dossier urgent arrive.', choices: ['Je m’y mets, ça me motive', 'Lundi, il sera encore là'] },
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
      photo: 'Prends la photo dans l’app. Aucun humain ne la voit ; supprimée sous 24 h, sauf si tu la gardes.',
      write: 'Écris un message dans l’un de tes liens, puis reviens ici.',
      go_out: 'Réponds « oui » à « Tu as mis le nez dehors aujourd’hui ? ».',
    } as Record<DailyKind, string>,
  },
  /**
   * Ce qu'on dit des photos privées, partout où on en parle. Vrai à la lettre : aucun humain ne les voit ; la preuve
   * d'habitude est vérifiée par une IA tierce, seulement avec l'accord de la personne (`AiConsents`) ; toutes sont supprimées sous 24 h, sauf si la personne les garde.
   * Ne jamais écrire « personne ne la voit » sans préciser l'IA.
   */
  privacy: {
    proof: 'Prise ici, jamais depuis ta galerie. Aucun humain ne la voit : une IA tierce la vérifie si tu l’as accepté, puis elle est supprimée sous 24 h, sauf si tu la gardes.',
    daily: 'Prise ici, jamais depuis ta galerie. Aucun humain ne la voit. Supprimée sous 24 h, sauf si tu la gardes.',
  },
  /** Erreurs (codes du contrat, messages ici). */
  errors: {
    outingDone: 'Ta sortie du jour est déjà comptée. Merci pour l’air frais.',
    habitUnknown: 'Cette habitude n’existe pas.',
    habitLimit: (limit: number): string => `Tu suis déjà ${limit} habitudes. Avec Minimoa+, tu peux en suivre jusqu’à 6.`,
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
    noticed: (axis: string, pole: string): string => `Ta vision bouge un peu sur « ${axis} » : plutôt « ${pole} », pour l’instant.`,
    noticedSteady: 'Ta vision garde son cap cette semaine.',
    tip: {
      go_out: 'Une idée pour la semaine : une sortie de plus, même courte.',
      habit: 'Une idée pour la semaine : choisir une habitude simple et la montrer à ton minimoa.',
      challenge: 'Une idée pour la semaine : le défi du jour. Il prend deux minutes.',
      write: 'Une idée pour la semaine : écrire à quelqu’un que tu aimes bien, juste pour prendre des nouvelles.',
      keep_going: 'Une idée pour la semaine : continuer sur cette lancée.',
    } as Record<ReviewTip, string>,
    link: {
      streak: (name: string, streak: number): string => `Avec ${name} : ${streak} jours d’affilée à vous écrire.`,
      close: (name: string): string => `Avec ${name} : vous vous connaissez de mieux en mieux.`,
      steady: (name: string): string => `Avec ${name} : un lien solide.`,
      growing: (name: string): string => `Avec ${name} : ça se construit, tranquillement.`,
    } as Record<LinkNote, (name: string, streak: number) => string>,
    /** Minimoa+ : détail par axe sur quatre semaines (`pole` en minuscules) et audit de chaque lien. */
    detailedAxisStable: (axis: string): string => `${axis} : stable.`,
    detailedAxis: (axis: string, signedDelta: string, pole: string): string => `${axis} : ${signedDelta} vers « ${pole} ».`,
    detailedLink: (name: string, level: number, lives: number): string => `Avec ${name} : niveau ${level}, ${plural(lives, 'vie', 'vies')}.`,
  },
};

/** Pluriel des autres langues : seul 1 est singulier (0 est pluriel). */
const pl = (n: number, one: string, many: string): string => `${n} ${n === 1 ? one : many}`;

const en: Translation<RituelsText> = {
  habits: {
    marcher: { label: 'Walk', ask: 'Show me your sneakers.' },
    sport: { label: 'Exercise', ask: 'Show me your workout clothes.' },
    voir_un_ami: { label: 'See a friend', ask: 'Show me where you are. No faces needed.' },
    appeler_un_proche: { label: 'Call someone close', ask: 'Show me the phone you used.' },
    cuisiner: { label: 'Cook', ask: 'Show me what’s simmering.' },
    lire: { label: 'Read', ask: 'Show me the page you’re on.' },
    creer: { label: 'Make something', ask: 'Show me what you made.' },
    apprendre: { label: 'Learn', ask: 'Show me what you’re learning.' },
    se_coucher_tot: { label: 'Go to bed early', ask: 'Show me your nightstand.' },
    planifier: { label: 'Plan your week', ask: 'Show me your schedule.' },
    decouvrir: { label: 'Discover a new place', ask: 'Show me where you are.' },
    plantes: { label: 'Look after your plants', ask: 'Show me your plants.' },
  },
  rhythmLabel: { daily: 'Every day', three_per_week: '3 times a week' },
  proofVerdictLines: {
    yes: ['Seen. That counts.', 'Approved. Your minimoa takes note.', 'All good. Nice consistency.'],
    no: ['I can’t see the habit in this photo. You can take another one.', 'I don’t see the connection. Another photo?'],
    unsure: ['Hard to say. I trust you, it counts.', 'Not obvious, but I believe you. It counts.'],
  },
  selfCheckLines: ['Noted. I trust you.', 'On your word, it counts. Well done.'],
  proofUncheckedLines: ['Photo received, not checked: you haven’t turned on AI. I trust you, it counts.'],
  outing: {
    question: 'Did you step outside today?',
    answers: { saw_people: 'Yes, I saw people', walk: 'Yes, a walk', not_yet: 'Not yet' },
    reply: {
      saw_people: 'Perfect. I already feel more sociable.',
      walk: 'A walk is a walk. Thanks for the fresh air.',
      not_yet: 'Okay. I’ll wait by the door.',
    },
    confirmed: 'Your location confirms it: you really were outside.',
  },
  daily: {
    texts: {
      q_foyer_table: { text: 'A Sunday ten years from now?', choices: ['A big table, noise, kids', 'Free, nothing planned'] },
      q_foyer_cles: { text: 'Give someone a spare key to your place?', choices: ['Gladly, that’s how a home begins', 'My keys stay mine'] },
      q_foyer_fetes: { text: 'The holidays, you picture them…', choices: ['With family, my own or one to build', 'With friends, or traveling'] },
      q_ancrage_offre: { text: 'Your dream job, but in Montreal?', choices: ['I’m going', 'I’ll find the same here'] },
      q_ancrage_quartier: { text: 'Your neighborhood in five years?', choices: ['The same, I know every corner', 'No idea, and I like that'] },
      q_ancrage_valise: { text: 'A suitcase always packed?', choices: ['Obviously', 'It lives in the attic'] },
      q_elan_soirs: { text: 'A personal project would take your evenings for a year.', choices: ['I’m in', 'My evenings are sacred'] },
      q_elan_vendredi: { text: 'Friday, 6 p.m., an urgent file lands.', choices: ['I dive in, it fires me up', 'It’ll still be there Monday'] },
      q_elan_reve: { text: 'Your dream for the next five years is more…', choices: ['Building something big', 'Having time for myself'] },
      q_rythme_samedi: { text: 'Perfect Saturday night?', choices: ['Out, and we’ll see how late', 'At home, nice and quiet'] },
      q_rythme_agenda: { text: 'Your ideal week has…', choices: ['A night out almost every evening', 'Two nights out, no more'] },
      q_rythme_vacances: { text: 'On vacation, more like…', choices: ['Three activities a day', 'A hammock and a book'] },
      q_cap_argent: { text: 'An unexpected bonus comes in.', choices: ['I put it aside', 'I treat myself'] },
      q_cap_voyage: { text: 'A trip: you plan it…', choices: ['Months ahead', 'The night before, or not at all'] },
      q_cap_dix_ans: { text: 'Knowing where you’ll be in ten years?', choices: ['Reassuring', 'Suffocating'] },
      p_sourire: { text: 'Show me what made you smile today.', choices: null },
      p_fenetre: { text: 'Show me the view from your window.', choices: null },
      p_assiette: { text: 'Show me what’s on your plate today.', choices: null },
      p_couleur: { text: 'Show me something yellow.', choices: null },
      p_dehors: { text: 'Show me a corner of your street.', choices: null },
      p_objet: { text: 'Show me the thing you never go anywhere without.', choices: null },
      w_nouvelles: { text: 'Write to one of your links, just to see how they’re doing.', choices: null },
      w_souvenir: { text: 'Remind one of your links of a good memory.', choices: null },
      w_question: { text: 'Ask one of your links a real question.', choices: null },
      w_compliment: { text: 'Send one of your links a sincere compliment.', choices: null },
      o_air: { text: 'Go out for some air, even for ten minutes.', choices: null },
      o_cafe: { text: 'Have a coffee out, not at home.', choices: null },
      o_nouveau: { text: 'Walk down a street you don’t know.', choices: null },
      o_quelquun: { text: 'Go see someone, in person.', choices: null },
    },
    intro: 'Your daily challenge.',
    done: 'Done. See you tomorrow.',
    kindLabel: { question: 'A question', photo: 'A photo', write: 'A note to a link', go_out: 'Go out' },
    howTo: {
      question: 'Pick an answer.',
      photo: 'Take the photo in the app. No human sees it; it’s deleted within 24 hours unless you keep it.',
      write: 'Write a message in one of your links, then come back here.',
      go_out: 'Answer “yes” to “Did you step outside today?”',
    },
  },
  privacy: {
    proof: 'Taken here, never from your photo library. No human sees it: a third-party AI checks it if you agreed to that, then it’s deleted within 24 hours unless you keep it.',
    daily: 'Taken here, never from your photo library. No human sees it. Deleted within 24 hours unless you keep it.',
  },
  errors: {
    outingDone: 'Today’s outing already counts. Thanks for the fresh air.',
    habitUnknown: 'This habit doesn’t exist.',
    habitLimit: (limit: number): string => `You’re already tracking ${limit} habits. With Minimoa+, you can track up to 6.`,
    habitLimitPlus: 'You’re already tracking 6 habits: that’s the maximum.',
    habitTaken: 'You’re already tracking this habit.',
    habitNotFound: 'This habit isn’t being tracked anymore.',
    habitDoneToday: 'This habit already counts for today.',
    proofPath: 'This photo doesn’t match today’s proof.',
    proofMissing: 'The photo hasn’t arrived yet. Try again.',
    proofGone: 'This photo is no longer available.',
    dailyDone: 'Your daily challenge is already done. See you tomorrow.',
    dailyKind: 'That’s not what your daily challenge asks for.',
    dailyNotYet: {
      write: 'Write a message in one of your links first.',
      go_out: 'First, tell me if you stepped outside today.',
    },
    reviewNotFound: 'This review doesn’t exist.',
  },
  review: {
    title: 'Your week',
    intro: (petName: string): string => `${petName}’s weekly review.`,
    highlight: {
      outings: (v: ReviewVars): string => `${pl(v.outings, 'outing', 'outings')} this week. ${v.petName} got some fresh air with you.`,
      habits: (v: ReviewVars): string => `${pl(v.habitsKept, 'habit kept', 'habits kept')}. It shows on ${v.petName}.`,
      challenges: (v: ReviewVars): string => `${pl(v.challengesDone, 'daily challenge done', 'daily challenges done')}.`,
      streak: (v: ReviewVars): string => `Your streak is at ${v.streak} days. The flame is burning bright.`,
      calm: (v: ReviewVars): string => `A calm week. ${v.petName} made the most of it to rest.`,
    },
    noticed: (axis: string, pole: string): string => `Your vision is shifting a little on “${axis}”: leaning “${pole}”, for now.`,
    noticedSteady: 'Your vision held its course this week.',
    tip: {
      go_out: 'An idea for the week: one more outing, even a short one.',
      habit: 'An idea for the week: pick a simple habit and show it to your minimoa.',
      challenge: 'An idea for the week: the daily challenge. It takes two minutes.',
      write: 'An idea for the week: write to someone you like, just to see how they’re doing.',
      keep_going: 'An idea for the week: keep this momentum going.',
    },
    link: {
      streak: (name: string, streak: number): string => `With ${name}: ${streak} days in a row writing to each other.`,
      close: (name: string): string => `With ${name}: you’re getting to know each other better and better.`,
      steady: (name: string): string => `With ${name}: a solid link.`,
      growing: (name: string): string => `With ${name}: it’s building, one step at a time.`,
    },
    detailedAxisStable: (axis: string): string => `${axis}: steady.`,
    detailedAxis: (axis: string, signedDelta: string, pole: string): string => `${axis}: ${signedDelta} toward “${pole}”.`,
    detailedLink: (name: string, level: number, lives: number): string => `With ${name}: level ${level}, ${pl(lives, 'life', 'lives')}.`,
  },
};

const es: Translation<RituelsText> = {
  habits: {
    marcher: { label: 'Caminar', ask: 'Muéstrame tus zapatillas.' },
    sport: { label: 'Hacer deporte', ask: 'Muéstrame tu ropa de deporte.' },
    voir_un_ami: { label: 'Ver a un amigo', ask: 'Muéstrame dónde están. No hacen falta caras.' },
    appeler_un_proche: { label: 'Llamar a alguien cercano', ask: 'Muéstrame el teléfono que usaste.' },
    cuisiner: { label: 'Cocinar', ask: 'Muéstrame lo que tienes al fuego.' },
    lire: { label: 'Leer', ask: 'Muéstrame la página por la que vas.' },
    creer: { label: 'Crear algo', ask: 'Muéstrame lo que hiciste.' },
    apprendre: { label: 'Aprender', ask: 'Muéstrame lo que estás aprendiendo.' },
    se_coucher_tot: { label: 'Acostarse temprano', ask: 'Muéstrame tu mesita de noche.' },
    planifier: { label: 'Planear tu semana', ask: 'Muéstrame tu agenda.' },
    decouvrir: { label: 'Descubrir un lugar nuevo', ask: 'Muéstrame dónde estás.' },
    plantes: { label: 'Cuidar tus plantas', ask: 'Muéstrame tus plantas.' },
  },
  rhythmLabel: { daily: 'Todos los días', three_per_week: '3 veces por semana' },
  proofVerdictLines: {
    yes: ['Visto. Cuenta.', 'Validado. Tu minimoa toma nota.', 'Todo bien. Qué constancia.'],
    no: ['No reconozco el hábito en esta foto. Puedes tomar otra.', 'No veo la relación. ¿Otra foto?'],
    unsure: ['Difícil saberlo. Confío en ti, cuenta.', 'No está claro, pero te creo. Cuenta.'],
  },
  selfCheckLines: ['Anotado. Confío en ti.', 'Te tomo la palabra, cuenta. Bien hecho.'],
  proofUncheckedLines: ['Foto recibida, sin verificar: no has activado la IA. Confío en ti, cuenta.'],
  outing: {
    question: '¿Has salido a la calle hoy?',
    answers: { saw_people: 'Sí, vi gente', walk: 'Sí, una vuelta', not_yet: 'Todavía no' },
    reply: {
      saw_people: 'Perfecto. Ya me siento más sociable.',
      walk: 'Una vuelta es una vuelta. Gracias por el aire fresco.',
      not_yet: 'De acuerdo. Me quedo cerca de la puerta.',
    },
    confirmed: 'Tu ubicación lo confirma: de verdad estuviste fuera.',
  },
  daily: {
    texts: {
      q_foyer_table: { text: '¿Un domingo dentro de diez años?', choices: ['Una mesa grande, ruido, niños', 'Libre, sin planes'] },
      q_foyer_cles: { text: '¿Darle una copia de tus llaves a alguien?', choices: ['Con gusto, así empieza un hogar', 'Mis llaves son mías'] },
      q_foyer_fetes: { text: 'Las fiestas de fin de año, te las imaginas…', choices: ['En familia, la mía o una por formar', 'Con amigos, o de viaje'] },
      q_ancrage_offre: { text: '¿El trabajo de tus sueños, pero en Montreal?', choices: ['Me voy', 'Busco lo mismo aquí'] },
      q_ancrage_quartier: { text: '¿Tu barrio dentro de cinco años?', choices: ['El mismo, ahí tengo mis rutinas', 'Ni idea, y eso me gusta'] },
      q_ancrage_valise: { text: '¿Una maleta siempre lista?', choices: ['Por supuesto', 'Duerme en el trastero'] },
      q_elan_soirs: { text: 'Un proyecto personal te ocuparía las noches durante un año.', choices: ['Me lanzo', 'Mis noches son sagradas'] },
      q_elan_vendredi: { text: 'Viernes, 18 h, llega un asunto urgente.', choices: ['Me pongo, me motiva', 'El lunes seguirá ahí'] },
      q_elan_reve: { text: 'Tu sueño para los próximos cinco años es más bien…', choices: ['Construir algo grande', 'Tener tiempo para mí'] },
      q_rythme_samedi: { text: '¿Tu sábado noche ideal?', choices: ['Fuera, y ya veremos hasta qué hora', 'En casa, con calma'] },
      q_rythme_agenda: { text: 'Tu semana ideal tiene…', choices: ['Una salida casi cada noche', 'Dos noches fuera, no más'] },
      q_rythme_vacances: { text: 'De vacaciones, más bien…', choices: ['Tres actividades al día', 'Una hamaca y un libro'] },
      q_cap_argent: { text: 'Te llega un dinero extra inesperado.', choices: ['Lo ahorro', 'Me doy un capricho'] },
      q_cap_voyage: { text: 'Un viaje, lo preparas…', choices: ['Con meses de antelación', 'La víspera, o ni eso'] },
      q_cap_dix_ans: { text: '¿Saber dónde estarás dentro de diez años?', choices: ['Tranquilizador', 'Asfixiante'] },
      p_sourire: { text: 'Muéstrame lo que te hizo sonreír hoy.', choices: null },
      p_fenetre: { text: 'Muéstrame la vista desde tu ventana.', choices: null },
      p_assiette: { text: 'Muéstrame tu plato de hoy.', choices: null },
      p_couleur: { text: 'Muéstrame algo amarillo.', choices: null },
      p_dehors: { text: 'Muéstrame un rincón de tu calle.', choices: null },
      p_objet: { text: 'Muéstrame el objeto del que nunca te separas.', choices: null },
      w_nouvelles: { text: 'Escribe a uno de tus vínculos, solo para saber cómo le va.', choices: null },
      w_souvenir: { text: 'Recuérdale un buen momento a uno de tus vínculos.', choices: null },
      w_question: { text: 'Hazle una pregunta de verdad a uno de tus vínculos.', choices: null },
      w_compliment: { text: 'Envíale un cumplido sincero a uno de tus vínculos.', choices: null },
      o_air: { text: 'Sal a tomar el aire, aunque sean diez minutos.', choices: null },
      o_cafe: { text: 'Tómate un café fuera, no en casa.', choices: null },
      o_nouveau: { text: 'Pasa por una calle que no conozcas.', choices: null },
      o_quelquun: { text: 'Ve a ver a alguien, en persona.', choices: null },
    },
    intro: 'El reto del día.',
    done: 'Hecho. Hasta mañana.',
    kindLabel: { question: 'Una pregunta', photo: 'Una foto', write: 'Escribir a un vínculo', go_out: 'Salir' },
    howTo: {
      question: 'Elige una respuesta.',
      photo: 'Toma la foto en la app. Ningún humano la ve; se borra en 24 h, salvo que la guardes.',
      write: 'Escribe un mensaje en uno de tus vínculos y luego vuelve aquí.',
      go_out: 'Responde «sí» a «¿Has salido a la calle hoy?».',
    },
  },
  privacy: {
    proof: 'Tomada aquí, nunca desde tu galería. Ningún humano la ve: una IA de terceros la verifica si lo aceptaste, y luego se borra en 24 h, salvo que la guardes.',
    daily: 'Tomada aquí, nunca desde tu galería. Ningún humano la ve. Se borra en 24 h, salvo que la guardes.',
  },
  errors: {
    outingDone: 'Tu salida de hoy ya cuenta. Gracias por el aire fresco.',
    habitUnknown: 'Este hábito no existe.',
    habitLimit: (limit: number): string => `Ya sigues ${limit} hábitos. Con Minimoa+, puedes seguir hasta 6.`,
    habitLimitPlus: 'Ya sigues 6 hábitos: es el máximo.',
    habitTaken: 'Ya sigues este hábito.',
    habitNotFound: 'Ya no sigues este hábito.',
    habitDoneToday: 'Este hábito ya cuenta por hoy.',
    proofPath: 'Esta foto no corresponde a tu prueba de hoy.',
    proofMissing: 'La foto aún no ha llegado. Inténtalo de nuevo.',
    proofGone: 'Esta foto ya no está disponible.',
    dailyDone: 'El reto del día ya está hecho. Hasta mañana.',
    dailyKind: 'Eso no es lo que pide el reto del día.',
    dailyNotYet: {
      write: 'Primero escribe un mensaje en uno de tus vínculos.',
      go_out: 'Primero dime si has salido a la calle hoy.',
    },
    reviewNotFound: 'Este resumen no existe.',
  },
  review: {
    title: 'Tu semana',
    intro: (petName: string): string => `El resumen de ${petName}.`,
    highlight: {
      outings: (v: ReviewVars): string => `${pl(v.outings, 'salida', 'salidas')} esta semana. ${v.petName} tomó el aire contigo.`,
      habits: (v: ReviewVars): string => `${pl(v.habitsKept, 'hábito cumplido', 'hábitos cumplidos')}. A ${v.petName} se le nota.`,
      challenges: (v: ReviewVars): string => `${pl(v.challengesDone, 'reto del día superado', 'retos del día superados')}.`,
      streak: (v: ReviewVars): string => `Tu racha va por ${v.streak} días. La llama brilla.`,
      calm: (v: ReviewVars): string => `Una semana tranquila. ${v.petName} aprovechó para descansar.`,
    },
    noticed: (axis: string, pole: string): string => `Tu visión se mueve un poco en «${axis}»: más bien «${pole}», por ahora.`,
    noticedSteady: 'Tu visión mantiene el rumbo esta semana.',
    tip: {
      go_out: 'Una idea para la semana: una salida más, aunque sea corta.',
      habit: 'Una idea para la semana: elegir un hábito sencillo y mostrárselo a tu minimoa.',
      challenge: 'Una idea para la semana: el reto del día. Lleva dos minutos.',
      write: 'Una idea para la semana: escribir a alguien que te cae bien, para saber cómo le va.',
      keep_going: 'Una idea para la semana: seguir por este camino.',
    },
    link: {
      streak: (name: string, streak: number): string => `Con ${name}: ${streak} días seguidos escribiéndose.`,
      close: (name: string): string => `Con ${name}: se conocen cada vez mejor.`,
      steady: (name: string): string => `Con ${name}: un vínculo sólido.`,
      growing: (name: string): string => `Con ${name}: se va construyendo, con calma.`,
    },
    detailedAxisStable: (axis: string): string => `${axis}: estable.`,
    detailedAxis: (axis: string, signedDelta: string, pole: string): string => `${axis}: ${signedDelta} hacia «${pole}».`,
    detailedLink: (name: string, level: number, lives: number): string => `Con ${name}: nivel ${level}, ${pl(lives, 'vida', 'vidas')}.`,
  },
};

const pt: Translation<RituelsText> = {
  habits: {
    marcher: { label: 'Caminhar', ask: 'Me mostre seus tênis.' },
    sport: { label: 'Fazer exercício', ask: 'Me mostre sua roupa de treino.' },
    voir_un_ami: { label: 'Ver um amigo', ask: 'Me mostre onde vocês estão. Não precisa aparecer rosto.' },
    appeler_un_proche: { label: 'Ligar para alguém próximo', ask: 'Me mostre o telefone que você usou.' },
    cuisiner: { label: 'Cozinhar', ask: 'Me mostre o que está no fogo.' },
    lire: { label: 'Ler', ask: 'Me mostre a página em que você está.' },
    creer: { label: 'Criar algo', ask: 'Me mostre o que você fez.' },
    apprendre: { label: 'Aprender', ask: 'Me mostre o que você está aprendendo.' },
    se_coucher_tot: { label: 'Dormir cedo', ask: 'Me mostre sua mesa de cabeceira.' },
    planifier: { label: 'Planejar a semana', ask: 'Me mostre sua agenda.' },
    decouvrir: { label: 'Conhecer um lugar novo', ask: 'Me mostre onde você está.' },
    plantes: { label: 'Cuidar das plantas', ask: 'Me mostre suas plantas.' },
  },
  rhythmLabel: { daily: 'Todos os dias', three_per_week: '3 vezes por semana' },
  proofVerdictLines: {
    yes: ['Visto. Conta.', 'Validado. Seu minimoa anotou.', 'Tudo certo. Que constância.'],
    no: ['Não reconheço o hábito nesta foto. Você pode tirar outra.', 'Não vejo a relação. Outra foto?'],
    unsure: ['Difícil dizer. Confio em você, conta.', 'Não é óbvio, mas acredito em você. Contou.'],
  },
  selfCheckLines: ['Anotado. Confio em você.', 'Vale a sua palavra, conta. Mandou bem.'],
  proofUncheckedLines: ['Foto recebida, não verificada: você não ativou a IA. Confio em você, conta.'],
  outing: {
    question: 'Você saiu de casa hoje?',
    answers: { saw_people: 'Sim, vi gente', walk: 'Sim, uma volta', not_yet: 'Ainda não' },
    reply: {
      saw_people: 'Perfeito. Já me sinto mais sociável.',
      walk: 'Uma volta é uma volta. Obrigado pelo ar fresco.',
      not_yet: 'Tudo bem. Fico perto da porta.',
    },
    confirmed: 'Sua localização confirma: você saiu mesmo.',
  },
  daily: {
    texts: {
      q_foyer_table: { text: 'Um domingo daqui a dez anos?', choices: ['Uma mesa grande, barulho, crianças', 'Livre, sem planos'] },
      q_foyer_cles: { text: 'Dar uma cópia das suas chaves para alguém?', choices: ['Com prazer, é o começo de um lar', 'Minhas chaves ficam comigo'] },
      q_foyer_fetes: { text: 'As festas de fim de ano, você imagina…', choices: ['Em família, a minha ou uma a construir', 'Com amigos, ou viajando'] },
      q_ancrage_offre: { text: 'O emprego dos sonhos, mas em Montreal?', choices: ['Eu vou', 'Procuro o mesmo aqui'] },
      q_ancrage_quartier: { text: 'Seu bairro daqui a cinco anos?', choices: ['O mesmo, ali tenho meus cantos', 'Não faço ideia, e gosto disso'] },
      q_ancrage_valise: { text: 'Uma mala sempre pronta?', choices: ['Claro', 'Está no fundo do armário'] },
      q_elan_soirs: { text: 'Um projeto pessoal tomaria suas noites por um ano.', choices: ['Eu topo', 'Minhas noites são sagradas'] },
      q_elan_vendredi: { text: 'Sexta, 18h, chega um trabalho urgente.', choices: ['Começo já, isso me motiva', 'Segunda ainda vai estar lá'] },
      q_elan_reve: { text: 'Seu sonho para os próximos cinco anos é mais…', choices: ['Construir algo grande', 'Ter tempo para mim'] },
      q_rythme_samedi: { text: 'Sábado à noite perfeito?', choices: ['Na rua, e a gente vê até que horas', 'Em casa, com calma'] },
      q_rythme_agenda: { text: 'Sua semana ideal tem…', choices: ['Um programa quase toda noite', 'Duas noites fora, no máximo'] },
      q_rythme_vacances: { text: 'Nas férias, você prefere…', choices: ['Três atividades por dia', 'Uma rede e um livro'] },
      q_cap_argent: { text: 'Chega um bônus inesperado.', choices: ['Eu guardo', 'Eu me dou um agrado'] },
      q_cap_voyage: { text: 'Uma viagem, você prepara…', choices: ['Com meses de antecedência', 'Na véspera, ou nem isso'] },
      q_cap_dix_ans: { text: 'Saber onde você vai estar daqui a dez anos?', choices: ['Tranquilizador', 'Sufocante'] },
      p_sourire: { text: 'Me mostre o que te fez sorrir hoje.', choices: null },
      p_fenetre: { text: 'Me mostre a vista da sua janela.', choices: null },
      p_assiette: { text: 'Me mostre seu prato de hoje.', choices: null },
      p_couleur: { text: 'Me mostre algo amarelo.', choices: null },
      p_dehors: { text: 'Me mostre um cantinho da sua rua.', choices: null },
      p_objet: { text: 'Me mostre o objeto do qual você não se separa.', choices: null },
      w_nouvelles: { text: 'Escreva para um dos seus vínculos, só para saber como está.', choices: null },
      w_souvenir: { text: 'Lembre um dos seus vínculos de um bom momento.', choices: null },
      w_question: { text: 'Faça uma pergunta de verdade para um dos seus vínculos.', choices: null },
      w_compliment: { text: 'Mande um elogio sincero para um dos seus vínculos.', choices: null },
      o_air: { text: 'Saia para tomar um ar, nem que seja por dez minutos.', choices: null },
      o_cafe: { text: 'Tome um café na rua, não em casa.', choices: null },
      o_nouveau: { text: 'Passe por uma rua que você não conhece.', choices: null },
      o_quelquun: { text: 'Vá ver alguém, pessoalmente.', choices: null },
    },
    intro: 'O desafio do dia.',
    done: 'Feito. Até amanhã.',
    kindLabel: { question: 'Uma pergunta', photo: 'Uma foto', write: 'Mensagem a um vínculo', go_out: 'Sair' },
    howTo: {
      question: 'Escolha uma resposta.',
      photo: 'Tire a foto no app. Nenhum humano a vê; ela é apagada em até 24 h, a não ser que você a guarde.',
      write: 'Escreva uma mensagem em um dos seus vínculos e depois volte aqui.',
      go_out: 'Responda “sim” a “Você saiu de casa hoje?”.',
    },
  },
  privacy: {
    proof: 'Tirada aqui, nunca da sua galeria. Nenhum humano a vê: uma IA de terceiros a verifica se você aceitou, e depois ela é apagada em até 24 h, a não ser que você a guarde.',
    daily: 'Tirada aqui, nunca da sua galeria. Nenhum humano a vê. Apagada em até 24 h, a não ser que você a guarde.',
  },
  errors: {
    outingDone: 'Sua saída de hoje já foi contada. Obrigado pelo ar fresco.',
    habitUnknown: 'Esse hábito não existe.',
    habitLimit: (limit: number): string => `Você já acompanha ${limit} hábitos. Com o Minimoa+, dá para acompanhar até 6.`,
    habitLimitPlus: 'Você já acompanha 6 hábitos: é o máximo.',
    habitTaken: 'Você já acompanha esse hábito.',
    habitNotFound: 'Você não acompanha mais esse hábito.',
    habitDoneToday: 'Esse hábito já foi contado hoje.',
    proofPath: 'Essa foto não corresponde à sua prova de hoje.',
    proofMissing: 'A foto ainda não chegou. Tente de novo.',
    proofGone: 'Essa foto não está mais disponível.',
    dailyDone: 'O desafio do dia já foi feito. Até amanhã.',
    dailyKind: 'Não é isso que o desafio do dia pede.',
    dailyNotYet: {
      write: 'Primeiro, escreva uma mensagem em um dos seus vínculos.',
      go_out: 'Primeiro, me diga se você saiu de casa hoje.',
    },
    reviewNotFound: 'Esse resumo não existe.',
  },
  review: {
    title: 'Sua semana',
    intro: (petName: string): string => `O resumo de ${petName}.`,
    highlight: {
      outings: (v: ReviewVars): string => `${pl(v.outings, 'saída', 'saídas')} esta semana. ${v.petName} tomou um ar com você.`,
      habits: (v: ReviewVars): string => `${pl(v.habitsKept, 'hábito mantido', 'hábitos mantidos')}. Dá para notar em ${v.petName}.`,
      challenges: (v: ReviewVars): string => `${pl(v.challengesDone, 'desafio do dia cumprido', 'desafios do dia cumpridos')}.`,
      streak: (v: ReviewVars): string => `Sua sequência está em ${v.streak} dias. A chama brilha.`,
      calm: (v: ReviewVars): string => `Uma semana calma. ${v.petName} aproveitou para descansar.`,
    },
    noticed: (axis: string, pole: string): string => `Sua visão está mudando um pouco em “${axis}”: mais para “${pole}”, por enquanto.`,
    noticedSteady: 'Sua visão manteve o rumo esta semana.',
    tip: {
      go_out: 'Uma ideia para a semana: mais uma saída, mesmo que curtinha.',
      habit: 'Uma ideia para a semana: escolher um hábito simples e mostrar para o seu minimoa.',
      challenge: 'Uma ideia para a semana: o desafio do dia. Leva dois minutos.',
      write: 'Uma ideia para a semana: escrever para alguém de quem você gosta, para saber como a pessoa está.',
      keep_going: 'Uma ideia para a semana: manter esse embalo.',
    },
    link: {
      streak: (name: string, streak: number): string => `Com ${name}: ${streak} dias seguidos trocando mensagens.`,
      close: (name: string): string => `Com ${name}: vocês se conhecem cada vez melhor.`,
      steady: (name: string): string => `Com ${name}: um vínculo sólido.`,
      growing: (name: string): string => `Com ${name}: está se construindo, com calma.`,
    },
    detailedAxisStable: (axis: string): string => `${axis}: estável.`,
    detailedAxis: (axis: string, signedDelta: string, pole: string): string => `${axis}: ${signedDelta} rumo a “${pole}”.`,
    detailedLink: (name: string, level: number, lives: number): string => `Com ${name}: nível ${level}, ${pl(lives, 'vida', 'vidas')}.`,
  },
};

const nl: Translation<RituelsText> = {
  habits: {
    marcher: { label: 'Wandelen', ask: 'Laat me je sneakers zien.' },
    sport: { label: 'Sporten', ask: 'Laat me je sportkleren zien.' },
    voir_un_ami: { label: 'Vrienden zien', ask: 'Laat me zien waar jullie zijn. Gezichten hoeven niet.' },
    appeler_un_proche: { label: 'Iemand dierbaars bellen', ask: 'Laat me de telefoon zien die je gebruikte.' },
    cuisiner: { label: 'Koken', ask: 'Laat me zien wat er staat te pruttelen.' },
    lire: { label: 'Lezen', ask: 'Laat me de bladzijde zien waar je bent.' },
    creer: { label: 'Iets maken', ask: 'Laat me zien wat je gemaakt hebt.' },
    apprendre: { label: 'Leren', ask: 'Laat me zien wat je aan het leren bent.' },
    se_coucher_tot: { label: 'Vroeg naar bed', ask: 'Laat me je nachtkastje zien.' },
    planifier: { label: 'Je week plannen', ask: 'Laat me je planning zien.' },
    decouvrir: { label: 'Een nieuwe plek ontdekken', ask: 'Laat me zien waar je bent.' },
    plantes: { label: 'Voor je planten zorgen', ask: 'Laat me je planten zien.' },
  },
  rhythmLabel: { daily: 'Elke dag', three_per_week: '3 keer per week' },
  proofVerdictLines: {
    yes: ['Gezien. Telt mee.', 'Goedgekeurd. Je minimoa noteert het.', 'In orde. Mooi volgehouden.'],
    no: ['Ik herken de gewoonte niet op deze foto. Je mag een nieuwe maken.', 'Ik zie het verband niet. Nog een foto?'],
    unsure: ['Lastig te zeggen. Ik vertrouw je, het telt.', 'Niet duidelijk, maar ik geloof je. Het telt.'],
  },
  selfCheckLines: ['Genoteerd. Ik vertrouw je.', 'Op je woord, het telt. Goed bezig.'],
  proofUncheckedLines: ['Foto ontvangen, niet gecontroleerd: je hebt AI niet aangezet. Ik vertrouw je, het telt.'],
  outing: {
    question: 'Ben je vandaag buiten geweest?',
    answers: { saw_people: 'Ja, mensen gezien', walk: 'Ja, een rondje', not_yet: 'Nog niet' },
    reply: {
      saw_people: 'Perfect. Ik voel me nu al socialer.',
      walk: 'Een rondje is een rondje. Bedankt voor de frisse lucht.',
      not_yet: 'Oké. Ik blijf bij de deur.',
    },
    confirmed: 'Je locatie bevestigt het: je was echt buiten.',
  },
  daily: {
    texts: {
      q_foyer_table: { text: 'Een zondag over tien jaar?', choices: ['Een grote tafel, lawaai, kinderen', 'Vrij, niks gepland'] },
      q_foyer_cles: { text: 'Iemand een reservesleutel van je huis geven?', choices: ['Graag, zo begint een thuis', 'Mijn sleutels blijven van mij'] },
      q_foyer_fetes: { text: 'De feestdagen vier je het liefst…', choices: ['Met familie, mijn eigen of een die ik opbouw', 'Met vrienden, of op reis'] },
      q_ancrage_offre: { text: 'Je droombaan, maar dan in Montreal?', choices: ['Ik ga', 'Ik zoek hetzelfde hier'] },
      q_ancrage_quartier: { text: 'Je buurt over vijf jaar?', choices: ['Dezelfde, daar ken ik alles', 'Geen idee, en dat bevalt me'] },
      q_ancrage_valise: { text: 'Altijd een koffer klaarstaan?', choices: ['Natuurlijk', 'Die ligt op zolder'] },
      q_elan_soirs: { text: 'Een eigen project vraagt een jaar lang je avonden.', choices: ['Ik ga ervoor', 'Mijn avonden zijn heilig'] },
      q_elan_vendredi: { text: 'Vrijdag 18.00 uur, er komt een spoedklus binnen.', choices: ['Ik duik erin, dat motiveert me', 'Maandag ligt hij er nog'] },
      q_elan_reve: { text: 'Je droom voor de komende vijf jaar is eerder…', choices: ['Iets groots opbouwen', 'Tijd voor mezelf hebben'] },
      q_rythme_samedi: { text: 'Ideale zaterdagavond?', choices: ['Uit, en we zien wel hoe laat het wordt', 'Thuis, lekker rustig'] },
      q_rythme_agenda: { text: 'Je ideale week telt…', choices: ['Bijna elke avond een uitje', 'Twee avonden uit, niet meer'] },
      q_rythme_vacances: { text: 'Op vakantie liever…', choices: ['Drie activiteiten per dag', 'Een hangmat en een boek'] },
      q_cap_argent: { text: 'Er komt een onverwachte bonus binnen.', choices: ['Ik zet hem opzij', 'Ik trakteer mezelf'] },
      q_cap_voyage: { text: 'Een reis bereid je voor…', choices: ['Maanden van tevoren', 'De avond ervoor, of helemaal niet'] },
      q_cap_dix_ans: { text: 'Weten waar je over tien jaar bent?', choices: ['Geruststellend', 'Benauwend'] },
      p_sourire: { text: 'Laat me zien waar je vandaag om moest glimlachen.', choices: null },
      p_fenetre: { text: 'Laat me het uitzicht uit je raam zien.', choices: null },
      p_assiette: { text: 'Laat me je bord van vandaag zien.', choices: null },
      p_couleur: { text: 'Laat me iets geels zien.', choices: null },
      p_dehors: { text: 'Laat me een hoekje van je straat zien.', choices: null },
      p_objet: { text: 'Laat me het ding zien dat je altijd bij je hebt.', choices: null },
      w_nouvelles: { text: 'Stuur een van je banden een berichtje, gewoon om te horen hoe het gaat.', choices: null },
      w_souvenir: { text: 'Haal een mooie herinnering op met een van je banden.', choices: null },
      w_question: { text: 'Stel een van je banden een echte vraag.', choices: null },
      w_compliment: { text: 'Geef een van je banden een gemeend compliment.', choices: null },
      o_air: { text: 'Ga een frisse neus halen, al is het maar tien minuten.', choices: null },
      o_cafe: { text: 'Drink een koffie buiten de deur, niet thuis.', choices: null },
      o_nouveau: { text: 'Loop door een straat die je niet kent.', choices: null },
      o_quelquun: { text: 'Ga bij iemand langs, in het echt.', choices: null },
    },
    intro: 'De uitdaging van de dag.',
    done: 'Klaar. Tot morgen.',
    kindLabel: { question: 'Een vraag', photo: 'Een foto', write: 'Berichtje aan een band', go_out: 'Naar buiten' },
    howTo: {
      question: 'Kies een antwoord.',
      photo: 'Maak de foto in de app. Geen mens ziet hem; binnen 24 uur gewist, tenzij je hem bewaart.',
      write: 'Schrijf een bericht in een van je banden en kom dan hier terug.',
      go_out: 'Antwoord “ja” op “Ben je vandaag buiten geweest?”.',
    },
  },
  privacy: {
    proof: 'Hier gemaakt, nooit uit je fotogalerij. Geen mens ziet hem: een AI van een derde partij controleert hem als je daarmee akkoord bent gegaan, daarna wordt hij binnen 24 uur gewist, tenzij je hem bewaart.',
    daily: 'Hier gemaakt, nooit uit je fotogalerij. Geen mens ziet hem. Binnen 24 uur gewist, tenzij je hem bewaart.',
  },
  errors: {
    outingDone: 'Je uitje van vandaag telt al. Bedankt voor de frisse lucht.',
    habitUnknown: 'Deze gewoonte bestaat niet.',
    habitLimit: (limit: number): string => `Je volgt al ${limit} gewoontes. Met Minimoa+ kun je er tot 6 volgen.`,
    habitLimitPlus: 'Je volgt al 6 gewoontes: dat is het maximum.',
    habitTaken: 'Je volgt deze gewoonte al.',
    habitNotFound: 'Deze gewoonte volg je niet meer.',
    habitDoneToday: 'Deze gewoonte telt vandaag al.',
    proofPath: 'Deze foto hoort niet bij je bewijs van vandaag.',
    proofMissing: 'De foto is nog niet binnen. Probeer het opnieuw.',
    proofGone: 'Deze foto is niet meer beschikbaar.',
    dailyDone: 'De uitdaging van de dag is al gedaan. Tot morgen.',
    dailyKind: 'Dat is niet wat de uitdaging van de dag vraagt.',
    dailyNotYet: {
      write: 'Schrijf eerst een bericht in een van je banden.',
      go_out: 'Vertel me eerst of je vandaag buiten bent geweest.',
    },
    reviewNotFound: 'Dit weekoverzicht bestaat niet.',
  },
  review: {
    title: 'Jouw week',
    intro: (petName: string): string => `Het weekoverzicht van ${petName}.`,
    highlight: {
      outings: (v: ReviewVars): string => `${pl(v.outings, 'uitje', 'uitjes')} deze week. ${v.petName} ging met je mee naar buiten.`,
      habits: (v: ReviewVars): string => `${pl(v.habitsKept, 'gewoonte volgehouden', 'gewoontes volgehouden')}. Dat zie je aan ${v.petName}.`,
      challenges: (v: ReviewVars): string => `${pl(v.challengesDone, 'uitdaging van de dag gehaald', 'uitdagingen van de dag gehaald')}.`,
      streak: (v: ReviewVars): string => `Je reeks staat op ${v.streak} dagen. Het vlammetje gloeit.`,
      calm: (v: ReviewVars): string => `Een rustige week. ${v.petName} heeft lekker uitgerust.`,
    },
    noticed: (axis: string, pole: string): string => `Je visie verschuift een beetje bij „${axis}”: eerder “${pole}”, voorlopig.`,
    noticedSteady: 'Je visie houdt deze week koers.',
    tip: {
      go_out: 'Een idee voor deze week: nog één uitje, al is het kort.',
      habit: 'Een idee voor deze week: kies een simpele gewoonte en laat die aan je minimoa zien.',
      challenge: 'Een idee voor deze week: de uitdaging van de dag. Kost twee minuten.',
      write: 'Een idee voor deze week: stuur iemand die je graag mag een berichtje, gewoon om te horen hoe het gaat.',
      keep_going: 'Een idee voor deze week: gewoon zo doorgaan.',
    },
    link: {
      streak: (name: string, streak: number): string => `Met ${name}: al ${streak} dagen op rij schrijven jullie elkaar.`,
      close: (name: string): string => `Met ${name}: jullie leren elkaar steeds beter kennen.`,
      steady: (name: string): string => `Met ${name}: een stevige band.`,
      growing: (name: string): string => `Met ${name}: het groeit, rustig aan.`,
    },
    detailedAxisStable: (axis: string): string => `${axis}: stabiel.`,
    detailedAxis: (axis: string, signedDelta: string, pole: string): string => `${axis}: ${signedDelta} richting “${pole}”.`,
    detailedLink: (name: string, level: number, lives: number): string => `Met ${name}: niveau ${level}, ${pl(lives, 'leven', 'levens')}.`,
  },
};

export const rituelsText = defineMessages({ fr, en, es, pt, nl });
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
