/**
 * Défis du jour : une question, deux réponses. Chaque réponse pousse un peu les jauges du pet,
 * en plus de l'effet de base du défi (`challenge_done`). L'API choisit le défi du jour de façon déterministe.
 */
import type { Gauges } from '@blowy/domain';

export interface ChallengeChoice {
  label: string;
  delta: Partial<Gauges>;
}

export interface Challenge {
  id: string;
  question: string;
  choices: readonly [ChallengeChoice, ChallengeChoice];
}

const c = (id: string, question: string, a: string, da: Partial<Gauges>, b: string, db: Partial<Gauges>): Challenge => ({
  id,
  question,
  choices: [
    { label: a, delta: da },
    { label: b, delta: db },
  ],
});

export const CHALLENGES: readonly Challenge[] = [
  c('soiree', 'ce soir, plutôt…', 'canapé et plaid', { social: -3 }, 'sortie improvisée', { social: 3 }),
  c('message', 'un message important, tu…', 'écris un roman', { talk: 3 }, 'réponds en un mot', { talk: -3 }),
  c('dispute', 'un pote te vanne, tu…', 'renvoies la balle', { tender: -3 }, 'fais un câlin', { tender: 3 }),
  c('weekend', 'le week-end idéal…', 'rien de prévu', { play: -3 }, 'trois plans par jour', { play: 3 }),
  c('fete', 'à une fête, tu es…', 'près du buffet, tranquille', { social: -3 }, 'au milieu de la piste', { social: 3 }),
  c('vocal', 'les vocaux de 4 minutes…', 'j’adore en envoyer', { talk: 3 }, 'je les écoute en x2', { talk: -2 }),
  c('compliment', 'on te fait un compliment, tu…', 'en fais un en retour', { tender: 3 }, 'fais une blague', { tender: -2, play: 2 }),
  c('jeu', 'un jeu de société, tu…', 'joues pour gagner', { play: 3, tender: -1 }, 'joues pour rigoler', { play: 2, tender: 1 }),
  c('voyage', 'en voyage, plutôt…', 'tout planifier', { play: -3 }, 'se perdre exprès', { play: 3 }),
  c('nouveau', 'quelqu’un de nouveau arrive, tu…', 'vas lui parler', { social: 3 }, 'attends qu’il vienne', { social: -3 }),
  c('secret', 'un secret, tu le…', 'gardes pour toujours', { talk: -3 }, 'racontes à ton pet', { talk: 2, tender: 1 }),
  c('matin', 'le matin, tu es…', 'en mode zombie', { play: -2, talk: -1 }, 'déjà en train de chanter', { play: 2, talk: 1 }),
  c('cadeau', 'un cadeau réussi, c’est…', 'un truc utile', { tender: -2 }, 'un truc qui fait pleurer', { tender: 3 }),
  c('pluie', 'il pleut, tu…', 'restes au chaud', { social: -2 }, 'sautes dans les flaques', { play: 3 }),
  c('groupe', 'dans un groupe de discussion, tu…', 'lis sans écrire', { talk: -3 }, 'lances les sujets', { talk: 3 }),
  c('film', 'ce soir, film…', 'qui fait rire', { play: 2 }, 'qui fait pleurer', { tender: 2 }),
  c('retard', 'ton pote a 20 minutes de retard, tu…', 'lui envoies un mème', { play: 2, tender: -1 }, 'lui dis de prendre son temps', { tender: 2 }),
  c('cuisine', 'en cuisine, tu…', 'suis la recette', { play: -2 }, 'improvises tout', { play: 3 }),
  c('anniv', 'pour ton anniversaire…', 'un petit dîner à deux', { social: -2, tender: 1 }, 'une grosse fête', { social: 3 }),
  c('appel', 'un appel inattendu, tu…', 'décroches direct', { talk: 2, social: 1 }, 'laisses sonner', { talk: -3 }),
  c('sport', 'le sport, c’est…', 'seul avec mes écouteurs', { social: -2 }, 'en équipe, en criant', { social: 2, play: 1 }),
  c('critique', 'on critique ton look, tu…', 'réponds cash', { tender: -3 }, 'en ris avec eux', { play: 2 }),
  c('musique', 'en soirée, la musique…', 'c’est moi qui choisis', { social: 2, talk: 1 }, 'je laisse faire', { social: -1, tender: 1 }),
  c('dimanche', 'dimanche, tu…', 'ranges ta vie', { play: -2 }, 'pars à l’aventure', { play: 3 }),
  c('animaux', 'un chien croise ta route, tu…', 'le caresses', { tender: 3 }, 'lui parles comme à un humain', { talk: 3 }),
  c('photo', 'sur les photos de groupe, tu…', 'te caches derrière', { social: -3 }, 'fais une grimace devant', { social: 2, play: 2 }),
  c('defi', 'un défi idiot entre potes, tu…', 'regardes', { play: -2 }, 'relèves', { play: 3 }),
  c('mots', 'pour dire je t’aime bien, tu…', 'le dis avec des mots', { tender: 2, talk: 2 }, 'le montres sans rien dire', { tender: 2, talk: -2 }),
  c('nuit', 'à 2 h du matin, tu…', 'dors depuis longtemps', { social: -2 }, 'refais le monde', { talk: 3 }),
  c('vacances', 'les vacances idéales…', 'une cabane perdue', { social: -3 }, 'un festival', { social: 3 }),
  c('blague', 'ta blague tombe à plat, tu…', 'en refais une pire', { play: 3 }, 'changes de sujet', { talk: -2 }),
  c('dessert', 'au restaurant, le dessert…', 'je partage', { tender: 2 }, 'personne n’y touche', { tender: -2, play: 1 }),
];
