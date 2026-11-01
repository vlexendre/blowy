/**
 * Répliques des pets, classées par espèce × trait dominant × état × situation. Variables
 * allowlistées {autrePet}, {lieu}, {souvenir}. Règles éditoriales (vérifiées par tests) :
 * jamais de commentaire physique, jamais de parole à la place des humains (le pet parle de
 * lui et de l'autre PET, pas de ce que « ton humain pense/ressent »).
 */
import type { Species } from '@blowy/domain';

export const LINE_SITUATIONS = ['REFUSAL', 'CONCEDE', 'ARRIVAL', 'REUNION', 'HUG', 'PLAY', 'MISSION', 'GIFT', 'HUNGRY', 'SICK', 'ASLEEP', 'WAITING', 'NUDGE', 'MOVE_IN'] as const;
export type LineSituation = (typeof LINE_SITUATIONS)[number];
export const LINE_TRAITS = ['ANY', 'KIND', 'MISCHIEVOUS'] as const;
export type LineTrait = (typeof LINE_TRAITS)[number];

export interface PetLine {
  id: string;
  key: string;
  species: Species | 'ANY';
  trait: LineTrait;
  situation: LineSituation;
  fr: string;
}

type Row = [Species | 'ANY', LineTrait, LineSituation, string];

const ROWS: Row[] = [
  // Refus
  ['NINO', 'MISCHIEVOUS', 'REFUSAL', 'Non. {autrePet} me doit une revanche.'],
  ['NINO', 'MISCHIEVOUS', 'REFUSAL', 'Pas tout de suite, je cache un trésor ici.'],
  ['NINO', 'KIND', 'REFUSAL', 'Encore une minute avec {autrePet}, promis.'],
  ['NINO', 'ANY', 'REFUSAL', 'J’ai un plan secret {lieu}. Plus tard !'],
  ['SUZIE', 'ANY', 'REFUSAL', 'Je reste {lieu}, je viens d’arriver !'],
  ['SUZIE', 'MISCHIEVOUS', 'REFUSAL', 'Non non, {autrePet} n’a pas fini son histoire.'],
  ['SUZIE', 'KIND', 'REFUSAL', 'Juste un dernier câlin avec {autrePet}.'],
  ['PIA', 'ANY', 'REFUSAL', 'Pas maintenant, je suis en train de gagner.'],
  ['PIA', 'MISCHIEVOUS', 'REFUSAL', 'Je pars quand {autrePet} admet sa défaite.'],
  ['PIA', 'KIND', 'REFUSAL', 'On termine la partie et j’arrive.'],
  ['GASTON', 'ANY', 'REFUSAL', 'Mmh… je finis ma sieste {lieu}.'],
  ['GASTON', 'KIND', 'REFUSAL', 'On est bien ici, non ? Encore un peu.'],
  ['ANY', 'ANY', 'REFUSAL', 'Non. Je suis avec {autrePet}.'],
  // Cède (deuxième appel)
  ['ANY', 'ANY', 'CONCEDE', 'Bon. J’arrive.'],
  ['NINO', 'ANY', 'CONCEDE', 'D’accord, d’accord… je prends mes affaires.'],
  ['SUZIE', 'ANY', 'CONCEDE', 'J’arrive en courant !'],
  ['PIA', 'ANY', 'CONCEDE', 'Bon, match nul. J’arrive.'],
  ['GASTON', 'ANY', 'CONCEDE', 'J’arrive, tranquillement.'],
  // Arrivée
  ['ANY', 'ANY', 'ARRIVAL', 'Me voilà {lieu} !'],
  ['NINO', 'ANY', 'ARRIVAL', 'Qui a déplacé les coussins {lieu} ? Ah, c’était moi.'],
  ['SUZIE', 'ANY', 'ARRIVAL', 'Coucou {autrePet}, je suis là !'],
  ['PIA', 'ANY', 'ARRIVAL', 'Arrivée ! Premier point pour moi.'],
  ['GASTON', 'ANY', 'ARRIVAL', 'Bonjour {autrePet}. Il y a du goûter ?'],
  // Retrouvailles
  ['ANY', 'ANY', 'REUNION', 'Enfin ! Tu m’as manqué, {autrePet}.'],
  ['SUZIE', 'ANY', 'REUNION', 'Je t’attendais depuis tellement longtemps !'],
  ['NINO', 'ANY', 'REUNION', 'Je t’ai gardé une surprise, {autrePet}.'],
  ['PIA', 'ANY', 'REUNION', 'Revanche ? Revanche.'],
  ['GASTON', 'ANY', 'REUNION', 'Ah, {autrePet}. On s’installe ?'],
  ['ANY', 'ANY', 'REUNION', 'Tu te souviens ? {souvenir}'],
  // Câlin
  ['ANY', 'ANY', 'HUG', 'Câlin officiel. Ça compte double.'],
  ['SUZIE', 'ANY', 'HUG', 'Encore ! Encore un !'],
  ['SUZIE', 'KIND', 'HUG', 'C’est mon moment préféré de la journée.'],
  ['NINO', 'ANY', 'HUG', 'D’accord, mais je garde la balle.'],
  ['GASTON', 'ANY', 'HUG', 'Tout doux. Parfait.'],
  ['PIA', 'ANY', 'HUG', 'Câlin gagné. Je note.'],
  // Jeu
  ['ANY', 'ANY', 'PLAY', 'À toi de jouer, {autrePet} !'],
  ['NINO', 'MISCHIEVOUS', 'PLAY', 'J’ai caché la balle. Cherche !'],
  ['PIA', 'ANY', 'PLAY', 'Trois points à zéro. Pour l’instant.'],
  ['PIA', 'MISCHIEVOUS', 'PLAY', 'Tu triches, {autrePet} ! … Ah non, c’est moi.'],
  ['SUZIE', 'ANY', 'PLAY', 'Plus vite, plus vite !'],
  ['GASTON', 'ANY', 'PLAY', 'Je joue… depuis ce coussin.'],
  ['ANY', 'KIND', 'PLAY', 'On fait une partie tranquille ?'],
  // Mission
  ['ANY', 'ANY', 'MISSION', 'Mission réussie ! Je suis fier·e.'],
  ['PIA', 'ANY', 'MISSION', 'Mission validée. Classement : premier·e.'],
  ['GASTON', 'ANY', 'MISSION', 'Mission accomplie. Je mérite un goûter.'],
  ['NINO', 'ANY', 'MISSION', 'Facile. La prochaine, je la fais en sifflotant.'],
  ['SUZIE', 'ANY', 'MISSION', 'On l’a fait ! On l’a fait !'],
  ['ANY', 'ANY', 'MISSION', 'Mission à deux : {autrePet} et moi, imbattables.'],
  // Cadeau
  ['ANY', 'ANY', 'GIFT', 'Un cadeau ? Pour moi ? Je le mets {lieu}.'],
  ['NINO', 'ANY', 'GIFT', 'Je le garde. Personne ne le touche.'],
  ['SUZIE', 'ANY', 'GIFT', 'Merci {autrePet}, il est parfait !'],
  ['GASTON', 'ANY', 'GIFT', 'Ça se mange ? Non ? Je l’aime quand même.'],
  ['PIA', 'ANY', 'GIFT', 'Trophée ajouté à ma collection.'],
  // Faim
  ['ANY', 'ANY', 'HUNGRY', 'Mon ventre fait du bruit…'],
  ['GASTON', 'ANY', 'HUNGRY', 'Un petit goûter ? Un grand, même.'],
  ['NINO', 'ANY', 'HUNGRY', 'Je vais finir par chiper une pomme.'],
  ['SUZIE', 'ANY', 'HUNGRY', 'J’ai faim maintenant, pas dans cinq minutes !'],
  ['PIA', 'ANY', 'HUNGRY', 'Pas d’énergie pour gagner sans manger.'],
  // Malade
  ['ANY', 'ANY', 'SICK', 'Je ne me sens pas très bien… un soin m’aiderait.'],
  ['GASTON', 'ANY', 'SICK', 'Je reste au chaud. Tu me soignes ?'],
  ['NINO', 'ANY', 'SICK', 'Pas de bêtises aujourd’hui, je suis patraque.'],
  ['SUZIE', 'ANY', 'SICK', 'Tu restes un peu avec moi ?'],
  ['PIA', 'ANY', 'SICK', 'Pause dans la compétition. Je récupère.'],
  // Sommeil
  ['ANY', 'ANY', 'ASLEEP', 'Zzz…'],
  ['GASTON', 'ANY', 'ASLEEP', 'Zzz… goûter… zzz…'],
  ['NINO', 'ANY', 'ASLEEP', 'Zzz… je rêve d’un trésor.'],
  ['SUZIE', 'ANY', 'ASLEEP', 'Zzz… à demain {autrePet}…'],
  ['PIA', 'ANY', 'ASLEEP', 'Zzz… médaille d’or… zzz…'],
  // Attente
  ['ANY', 'ANY', 'WAITING', 'J’attends {autrePet} {lieu}.'],
  ['SUZIE', 'ANY', 'WAITING', 'Il arrive quand, {autrePet} ? Bientôt ?'],
  ['GASTON', 'ANY', 'WAITING', 'J’attends {autrePet}. Je ne suis pas pressé.'],
  ['NINO', 'ANY', 'WAITING', 'Si {autrePet} tarde, je déplace tout {lieu}.'],
  ['PIA', 'ANY', 'WAITING', 'J’ai déjà préparé le terrain de jeu {lieu}.'],
  // Relance (suggestion, l'humain choisit et réécrit)
  ['ANY', 'ANY', 'NUDGE', 'Et si tu parlais de ça : {souvenir}'],
  ['ANY', 'ANY', 'NUDGE', 'La mission du jour pourrait vous faire rire.'],
  ['NINO', 'ANY', 'NUDGE', 'Psst… et si tu racontais la dernière partie ?'],
  ['SUZIE', 'ANY', 'NUDGE', 'Une petite question pour relancer ?'],
  ['GASTON', 'ANY', 'NUDGE', 'Un sujet tout doux : le meilleur goûter ?'],
  ['PIA', 'ANY', 'NUDGE', 'Défi : proposer une idée de jeu à deux.'],
  // Emménagement
  ['ANY', 'ANY', 'MOVE_IN', 'Notre maison ! Je choisis où mettre le coussin.'],
  ['SUZIE', 'ANY', 'MOVE_IN', 'On habite ensemble avec {autrePet} !'],
  ['GASTON', 'ANY', 'MOVE_IN', 'Une maison pour deux. Et un frigo pour deux.'],
  ['NINO', 'ANY', 'MOVE_IN', 'J’ai déjà caché trois trésors dans la nouvelle maison.'],
  ['PIA', 'ANY', 'MOVE_IN', 'Nouvelle maison : je prends la meilleure place.'],
];

export const PET_LINES: PetLine[] = ROWS.map(([species, trait, situation, fr], i) => ({
  id: `line_${String(i + 1).padStart(3, '0')}`,
  key: `line.${situation.toLowerCase()}.${String(i + 1).padStart(3, '0')}`,
  species,
  trait,
  situation,
  fr,
}));

/** Choix de répliques candidates (le tirage seedé est fait par l'appelant) : spécifique → générique. */
export function candidateLines(species: Species, trait: Exclude<LineTrait, 'ANY'>, situation: LineSituation): PetLine[] {
  const score = (l: PetLine): number => (l.species === species ? 2 : 0) + (l.trait === trait ? 1 : 0);
  const pool = PET_LINES.filter((l) => l.situation === situation && (l.species === species || l.species === 'ANY') && (l.trait === trait || l.trait === 'ANY'));
  const best = Math.max(-1, ...pool.map(score));
  return pool.filter((l) => score(l) === best);
}
