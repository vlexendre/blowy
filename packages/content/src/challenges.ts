/**
 * Défis du jour (V6) : une question, deux réponses. Chaque réponse pousse un peu les jauges du minimoa,
 * en plus de l'effet de base du défi (`challenge_done`). L'API choisit le défi du jour de façon déterministe.
 * Les effets sont des données (`CHALLENGE_DATA`) ; les mots, par langue (`challengeText`).
 * Une réponse qui suit « tu… » continue la phrase (minuscule) ; une réponse autonome prend la majuscule.
 */
import type { Gauges, Locale } from '@blowy/domain';
import { TODO, defineMessages } from './i18n/core';

export interface ChallengeChoice {
  label: string;
  delta: Partial<Gauges>;
}

export interface Challenge {
  id: string;
  question: string;
  choices: readonly [ChallengeChoice, ChallengeChoice];
}

interface ChallengeData {
  id: string;
  deltas: readonly [Partial<Gauges>, Partial<Gauges>];
}

/** Ordre stable : le choix du jour se fait par indice. */
export const CHALLENGE_DATA: readonly ChallengeData[] = [
  { id: 'soiree', deltas: [{ social: -3 }, { social: 3 }] },
  { id: 'message', deltas: [{ talk: 3 }, { talk: -3 }] },
  { id: 'dispute', deltas: [{ tender: -3 }, { tender: 3 }] },
  { id: 'weekend', deltas: [{ play: -3 }, { play: 3 }] },
  { id: 'fete', deltas: [{ social: -3 }, { social: 3 }] },
  { id: 'vocal', deltas: [{ talk: 3 }, { talk: -2 }] },
  { id: 'compliment', deltas: [{ tender: 3 }, { tender: -2, play: 2 }] },
  { id: 'jeu', deltas: [{ play: 3, tender: -1 }, { play: 2, tender: 1 }] },
  { id: 'voyage', deltas: [{ play: -3 }, { play: 3 }] },
  { id: 'nouveau', deltas: [{ social: 3 }, { social: -3 }] },
  { id: 'secret', deltas: [{ talk: -3 }, { talk: 2, tender: 1 }] },
  { id: 'matin', deltas: [{ play: -2, talk: -1 }, { play: 2, talk: 1 }] },
  { id: 'cadeau', deltas: [{ tender: -2 }, { tender: 3 }] },
  { id: 'pluie', deltas: [{ social: -2 }, { play: 3 }] },
  { id: 'groupe', deltas: [{ talk: -3 }, { talk: 3 }] },
  { id: 'film', deltas: [{ play: 2 }, { tender: 2 }] },
  { id: 'retard', deltas: [{ play: 2, tender: -1 }, { tender: 2 }] },
  { id: 'cuisine', deltas: [{ play: -2 }, { play: 3 }] },
  { id: 'anniv', deltas: [{ social: -2, tender: 1 }, { social: 3 }] },
  { id: 'appel', deltas: [{ talk: 2, social: 1 }, { talk: -3 }] },
  { id: 'sport', deltas: [{ social: -2 }, { social: 2, play: 1 }] },
  { id: 'critique', deltas: [{ tender: -3 }, { play: 2 }] },
  { id: 'musique', deltas: [{ social: 2, talk: 1 }, { social: -1, tender: 1 }] },
  { id: 'dimanche', deltas: [{ play: -2 }, { play: 3 }] },
  { id: 'animaux', deltas: [{ tender: 3 }, { talk: 3 }] },
  { id: 'photo', deltas: [{ social: -3 }, { social: 2, play: 2 }] },
  { id: 'defi', deltas: [{ play: -2 }, { play: 3 }] },
  { id: 'mots', deltas: [{ tender: 2, talk: 2 }, { tender: 2, talk: -2 }] },
  { id: 'nuit', deltas: [{ social: -2 }, { talk: 3 }] },
  { id: 'vacances', deltas: [{ social: -3 }, { social: 3 }] },
  { id: 'blague', deltas: [{ play: 3 }, { talk: -2 }] },
  { id: 'dessert', deltas: [{ tender: 2 }, { tender: -2, play: 1 }] },
];

type ChallengeWords = { question: string; choices: readonly [string, string] };

export const challengeText = defineMessages({
  fr: {
    soiree: { question: 'Ce soir, plutôt…', choices: ['Canapé et plaid', 'Sortie improvisée'] },
    message: { question: 'Un message important, tu…', choices: ['écris un roman', 'réponds en un mot'] },
    dispute: { question: 'Un pote te vanne, tu…', choices: ['renvoies la balle', 'fais un câlin'] },
    weekend: { question: 'Le week-end idéal…', choices: ['Rien de prévu', 'Trois plans par jour'] },
    fete: { question: 'À une fête, tu es…', choices: ['près du buffet, tranquille', 'au milieu de la piste'] },
    vocal: { question: 'Les vocaux de 4 minutes…', choices: ['J’adore en envoyer', 'Je les écoute en x2'] },
    compliment: { question: 'On te fait un compliment, tu…', choices: ['en fais un en retour', 'fais une blague'] },
    jeu: { question: 'Un jeu de société, tu…', choices: ['joues pour gagner', 'joues pour rigoler'] },
    voyage: { question: 'En voyage, plutôt…', choices: ['Tout planifier', 'Se perdre exprès'] },
    nouveau: { question: 'Quelqu’un de nouveau arrive, tu…', choices: ['vas lui parler', 'attends qu’il vienne'] },
    secret: { question: 'Un secret, tu le…', choices: ['gardes pour toujours', 'racontes à ton minimoa'] },
    matin: { question: 'Le matin, tu es…', choices: ['en mode zombie', 'déjà en train de chanter'] },
    cadeau: { question: 'Un cadeau réussi, c’est…', choices: ['un truc utile', 'un truc qui fait pleurer'] },
    pluie: { question: 'Il pleut, tu…', choices: ['restes au chaud', 'sautes dans les flaques'] },
    groupe: { question: 'Dans un groupe de discussion, tu…', choices: ['lis sans écrire', 'lances les sujets'] },
    film: { question: 'Ce soir, film…', choices: ['qui fait rire', 'qui fait pleurer'] },
    retard: { question: 'Ton pote a 20 minutes de retard, tu…', choices: ['lui envoies un mème', 'lui dis de prendre son temps'] },
    cuisine: { question: 'En cuisine, tu…', choices: ['suis la recette', 'improvises tout'] },
    anniv: { question: 'Pour ton anniversaire…', choices: ['Un petit dîner à deux', 'Une grosse fête'] },
    appel: { question: 'Un appel inattendu, tu…', choices: ['décroches direct', 'laisses sonner'] },
    sport: { question: 'Le sport, c’est…', choices: ['en solo, avec mes écouteurs', 'en équipe, en criant'] },
    critique: { question: 'On critique ton look, tu…', choices: ['réponds cash', 'en ris avec eux'] },
    musique: { question: 'En soirée, la musique…', choices: ['C’est moi qui choisis', 'Je laisse faire'] },
    dimanche: { question: 'Dimanche, tu…', choices: ['ranges ta vie', 'pars à l’aventure'] },
    animaux: { question: 'Un chien croise ta route, tu…', choices: ['le caresses', 'lui parles comme à un humain'] },
    photo: { question: 'Sur les photos de groupe, tu…', choices: ['te caches derrière', 'fais une grimace devant'] },
    defi: { question: 'Un défi idiot entre potes, tu…', choices: ['regardes', 'relèves'] },
    mots: { question: 'Pour dire je t’aime bien, tu…', choices: ['le dis avec des mots', 'le montres sans rien dire'] },
    nuit: { question: 'À 2 h du matin, tu…', choices: ['dors depuis longtemps', 'refais le monde'] },
    vacances: { question: 'Les vacances idéales…', choices: ['Une cabane perdue', 'Un festival'] },
    blague: { question: 'Ta blague tombe à plat, tu…', choices: ['en refais une pire', 'changes de sujet'] },
    dessert: { question: 'Au restaurant, le dessert…', choices: ['Je partage', 'Personne n’y touche'] },
  } as Record<string, ChallengeWords>,
  en: TODO,
  es: TODO,
  pt: TODO,
  nl: TODO,
});

const cache = new Map<Locale, readonly Challenge[]>();

/** Les défis avec leurs mots dans une langue (français pour ce qui manque). */
export function challengesIn(locale: Locale): readonly Challenge[] {
  let list = cache.get(locale);
  if (!list) {
    const words = challengeText.in(locale);
    list = CHALLENGE_DATA.map((d) => {
      const w = words[d.id] ?? { question: d.id, choices: [d.id, d.id] };
      return { id: d.id, question: w.question, choices: [{ label: w.choices[0], delta: d.deltas[0] }, { label: w.choices[1], delta: d.deltas[1] }] as const };
    });
    cache.set(locale, list);
  }
  return list;
}
