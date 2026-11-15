/**
 * Voix des minimoas dans la conversation (chantier « plateforme », spéc §9).
 * Dictionnaires à clés par langue (seul le français est écrit ; repli sur le français), par rôle et par voix.
 * Fonctions pures : la variante est choisie par `seed`, jamais par un tirage. Jamais le mot « pet ».
 */
import type { LinkHealthKey, Locale, MinimoaVoice, VisionAxis } from '@blowy/domain';
import { TODO, defineMessages, fillTemplate } from '../i18n/core';
import { type AiProcessor, DEFAULT_AI_PROCESSOR, aiProcessorView } from '../ai-provider';

export { fillTemplate };

/** Langue d'un texte de l'API. */
type Lang = Locale;

type VoiceLines = Readonly<Record<MinimoaVoice, readonly string[]>>;

interface ChatLines {
  /** Accord de lecture : nomme le prestataire d'IA et son pays (configuration de l'API, jamais écrits en dur). */
  confidentiality: (provider: string, country: string) => string;
  system: { linkCreated: string };
  /** Brise-glace par axe de vision partagé ({other} = minimoa de l'autre). */
  icebreaker: Readonly<Record<VisionAxis, readonly string[]>>;
  /** Brise-glace sans point commun connu. */
  icebreakerGeneric: readonly string[];
  /** Relance au rythme seulement ({days}, {other}). */
  nudge: VoiceLines;
  /** Remarque au rythme seulement. */
  remark: VoiceLines;
  /** Premier message du jour dans le lien. */
  firstOfDay: VoiceLines;
  /** Réaction à un mot doux / à une vanne ({other}). */
  sweet: VoiceLines;
  tease: VoiceLines;
  /** Garde-fou, vu par la seule personne concernée. */
  guard: VoiceLines;
  /** Une ligne par lien dans le bilan de la semaine ({name} = prénom de l'autre). */
  health: Readonly<Record<LinkHealthKey, string>>;
}

const FR: ChatLines = {
  /** Texte de la spéc (§9), servi avec l'état de l'accord pour que l'app montre partout les mêmes mots. */
  // App Review 5.1.2(i) : dire que l'IA est un tiers, lequel et où (audit B5). Pas de « aucun humain » : un message
  // signalé (par une personne ou par le filtre) et son contexte immédiat sont lus par la modération.
  confidentiality: (provider: string, country: string): string =>
    `Personne chez Blowy ne lit tes conversations, sauf un message signalé et les quelques messages autour, pour la modération. Si vous l’activez l’un et l’autre, une IA lit vos derniers messages pour que vos minimoas puissent y réagir. Cette IA est fournie par ${provider} (${country}), notre prestataire, qui reçoit ces messages pour nous. Tu peux retirer ton accord quand tu veux.`,
  /** Bandeaux du système dans le chat. */
  system: { linkCreated: 'Vos minimoas se sont trouvés. Vous pouvez vous écrire.' },

  icebreaker: {
    foyer: [
      'Vous voyez le foyer un peu pareil, vous deux. Question : le dîner du dimanche idéal, il ressemble à quoi ?',
      'Point commun repéré côté foyer. Alors : grande tablée ou tête-à-tête ?',
    ],
    ancrage: [
      'Vous avez la même idée de l’endroit où vivre. Question : la ville où vous vous voyez dans cinq ans ?',
      'Ici ou ailleurs, vous êtes d’accord. Le dernier endroit qui vous a donné envie de rester ?',
    ],
    elan: [
      'Côté projets, vous allez dans le même sens. Le truc qui vous occupe la tête en ce moment ?',
      'Même rapport au travail, vous deux. Un projet perso que vous n’avez encore dit à personne ?',
    ],
    rythme: [
      'Même rythme de vie, ça se voit. Votre soirée parfaite en semaine ?',
      'Vous vivez à la même vitesse. Dernière sortie qui valait le coup ?',
    ],
    cap: [
      'Vous prévoyez à peu près pareil, vous deux. Les prochaines vacances : réservées ou au feeling ?',
      'Même façon de voir loin. Le dernier achat que vous avez préparé des mois ?',
    ],
  },
  icebreakerGeneric: [
    'Bon. {other} et moi, on a fait les présentations. À vous : le meilleur moment de votre semaine ?',
    'On vous a trouvés compatibles, on ne se trompe pas souvent. Première question : café ou apéro ?',
  ],
  nudge: {
    doux: ['Ça fait {days} jours. {other} et moi, on se demandait comment vous alliez.', 'Petit silence de {days} jours. Un mot suffit, vous savez.'],
    sec: ['{days} jours sans un mot. Je dis ça, je dis rien.', '{days} jours. {other} commence à bâiller.'],
    joueur: ['{days} jours de silence. Je propose un jeu : le premier qui écrit a gagné.', 'Allô ? {days} jours ! {other} et moi, on s’ennuie.'],
    pose: ['Ça fait {days} jours. Vous en étiez où ?', '{days} jours de calme. On reprend quand vous voulez.'],
  },
  remark: {
    doux: ['Vous vous répondez vite. Je note.', 'J’aime bien quand vous parlez comme ça.'],
    sec: ['Ça papote. Je prends des notes.', 'Vous êtes d’accord sur plus de choses que vous ne croyez.'],
    joueur: ['Ça va vite ici. {other}, tu suis ?', 'Je compte les points. Égalité, pour l’instant.'],
    pose: ['Vous êtes d’accord sur plus de choses que vous ne croyez.', 'Belle conversation. Je me fais discret.'],
  },
  firstOfDay: {
    doux: ['Premier message du jour. {other} et moi, on est contents.', 'Bonjour vous deux. Ça commence bien.'],
    sec: ['Premier message du jour. Enfin.', 'Ah, ça se réveille.'],
    joueur: ['Premier message du jour ! {other}, t’as vu ?', 'C’est parti pour aujourd’hui.'],
    pose: ['Premier message du jour. Le lien respire.', 'Bonjour. Je m’installe et j’écoute.'],
  },
  sweet: {
    doux: ['Oh. C’était doux, ça. {other} fait semblant de ne pas rougir.', 'Mot doux noté. On garde.'],
    sec: ['C’était presque gentil. Je note.', 'Tout mignon. Je fais semblant de ne rien voir.'],
    joueur: ['Oh. {other}, tu as vu ça ?', 'Mot doux détecté. Je danse, intérieurement.'],
    pose: ['C’était doux. {other} ronronne, je crois.', 'Joli. Je ne dis rien de plus.'],
  },
  tease: {
    doux: ['Aïe. Gentiment, hein.', 'Ça pique un peu. {other} prépare sa réponse.'],
    sec: ['Piqué. J’adore.', 'Bien envoyé.'],
    joueur: ['La vanne ! {other} prépare sa revanche.', 'Ça chambre sec ici. Je m’installe.'],
    pose: ['Je n’ai rien vu, rien entendu. Mais c’était drôle.', 'Vanne notée. Match retour attendu.'],
  },
  guard: {
    doux: ['Ça chauffe un peu, non ? Une pause de dix minutes, et on reprend plus doucement.', 'Ça a l’air tendu. Tu veux souffler avant de répondre ?'],
    sec: ['Le ton monte. Pause, et tu relis avant d’envoyer ?', 'On respire. Dix minutes, puis tu réponds.'],
    joueur: ['Temps mort ! Je siffle une pause de dix minutes.', 'Ça s’échauffe. Pause goûter, et on reprend ?'],
    pose: ['Le ton monte un peu. Une pause, peut-être ?', 'Tu veux qu’on fasse une pause avant de répondre ?'],
  },
  health: {
    new: 'Avec {name} : ça vient de commencer, tout est possible.',
    quiet: 'Avec {name} : une semaine calme, un mot suffira pour relancer.',
    together: 'Avec {name} : vous vous écrivez presque tous les jours. Ça se voit.',
    lively: 'Avec {name} : vous vous parlez beaucoup, et ça se sent.',
    one_sided: 'Avec {name} : tu donnes le rythme, c’est précieux.',
    balanced: 'Avec {name} : vous vous répondez bien, l’un comme l’autre.',
  },
};

export const chatText = defineMessages({ fr: FR, en: TODO, es: TODO, pt: TODO, nl: TODO });
const linesFor = (lang: Lang): ChatLines => chatText.in(lang);

/** Phrase de l'accord de lecture, avec le prestataire d'IA de la configuration (`AiProcessor`). */
export const chatConfidentialityText = (lang: Lang, processor: AiProcessor = DEFAULT_AI_PROCESSOR): string => {
  const p = aiProcessorView(lang, processor);
  return chatText.in(lang).confidentiality(p.name, p.country);
};

const pick = (variants: readonly string[], seed: number): string => {
  const n = variants.length;
  return variants[((Math.trunc(seed) % n) + n) % n] ?? variants[0] ?? '';
};


export interface ChatLineContext {
  lang: Lang;
  voice: MinimoaVoice;
  seed: number;
  /** Nom du minimoa de l'autre. */
  other: string;
}

export const chatLines = {
  icebreaker(lang: Lang, axis: VisionAxis | null, other: string, seed: number): string {
    const l = linesFor(lang);
    return fillTemplate(pick(axis ? l.icebreaker[axis] : l.icebreakerGeneric, seed), { other });
  },
  nudge: (c: ChatLineContext, days: number): string => fillTemplate(pick(linesFor(c.lang).nudge[c.voice], c.seed), { other: c.other, days }),
  remark: (c: ChatLineContext): string => fillTemplate(pick(linesFor(c.lang).remark[c.voice], c.seed), { other: c.other }),
  firstOfDay: (c: ChatLineContext): string => fillTemplate(pick(linesFor(c.lang).firstOfDay[c.voice], c.seed), { other: c.other }),
  sweet: (c: ChatLineContext): string => fillTemplate(pick(linesFor(c.lang).sweet[c.voice], c.seed), { other: c.other }),
  tease: (c: ChatLineContext): string => fillTemplate(pick(linesFor(c.lang).tease[c.voice], c.seed), { other: c.other }),
  guard: (c: ChatLineContext): string => fillTemplate(pick(linesFor(c.lang).guard[c.voice], c.seed), { other: c.other }),
  health: (lang: Lang, key: LinkHealthKey, name: string): string => fillTemplate(linesFor(lang).health[key], { name }),
};

// ── Consignes de l'IA (stables : mises en cache côté fournisseur) ─────────

/** Description de chaque voix, insérée dans la demande (pas dans la consigne, qui reste identique pour tous). */
export const MINIMOA_VOICE_PROMPT: Readonly<Record<MinimoaVoice, string>> = {
  doux: 'tendre et bienveillant',
  sec: 'pince-sans-rire, humour sec, jamais méchant',
  joueur: 'joueur et taquin',
  pose: 'posé, calme, peu de mots',
};

const LANGUAGE_NAMES: Readonly<Record<Locale, string>> = { fr: 'français', en: 'anglais', es: 'espagnol', pt: 'portugais', nl: 'néerlandais' };
export const languageName = (lang: Lang): string => LANGUAGE_NAMES[lang];

/**
 * Consigne système du chat. Elle ne change jamais d'un appel à l'autre (cache du fournisseur).
 * Le modèle reçoit une fenêtre courte de messages anonymisés (A / B) et rend une réplique ou RIEN.
 */
export const CHAT_AI_SYSTEM = [
  'Tu es un minimoa : une petite créature qui accompagne une personne dans une appli de rencontres amicales ou amoureuses entre adultes.',
  'Deux personnes, A et B, discutent. Ton humain est indiqué dans la demande. Tu parles dans leur conversation, au plus une phrase courte (moins de 120 caractères).',
  'Rôles possibles : « relance » (après un silence, rappelle avec légèreté le dernier sujet), « remarque » (observation drôle ou bienveillante sur la conversation), « garde-fou » (le ton monte : propose une pause à ton humain, sans juger ni prendre parti).',
  'Règles : tutoiement, pas d’emoji, pas de conseil de séduction, pas de jugement, jamais de reproche, pas de question intrusive, ne cite pas de message mot pour mot, ne révèle rien de privé, ne parle jamais de toi comme d’une IA.',
  'Si tu n’as rien d’utile ou de drôle à dire, ou si le sujet est sensible (santé, deuil, violence, sexualité, argent), réponds exactement : RIEN.',
  'Réponds uniquement par la phrase, ou par RIEN.',
].join('\n');

export interface ChatAiPromptInput {
  role: 'relance' | 'remarque' | 'garde-fou';
  lang: Lang;
  voice: MinimoaVoice;
  /** Lettre de l'humain du minimoa qui parle. */
  owner: 'A' | 'B';
  /** Fenêtre courte, du plus ancien au plus récent. */
  window: readonly { who: 'A' | 'B'; text: string }[];
  silenceDays?: number;
}

export function chatAiPrompt(i: ChatAiPromptInput): string {
  const lines = i.window.map((m) => `${m.who} : ${m.text}`).join('\n');
  return [
    `Rôle : ${i.role}. Ton humain : ${i.owner}. Ta voix : ${MINIMOA_VOICE_PROMPT[i.voice]}. Langue : ${languageName(i.lang)}.`,
    i.silenceDays !== undefined ? `Silence depuis ${i.silenceDays} jours.` : '',
    'Derniers messages :',
    lines,
  ]
    .filter((l) => l.length > 0)
    .join('\n');
}

/** Bandeaux du système dans le chat. */
export const chatSystemText = (lang: Lang): { linkCreated: string } => chatText.in(lang).system;
