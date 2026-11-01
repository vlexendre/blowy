/**
 * Missions : critères OBSERVABLES pour la vision (aucun jugement de personne, aucun visage
 * requis) + alternative accessible. La preuve reste privée par défaut (§5.5).
 */
import type { Passion } from '@blowy/domain';

export interface MissionDefinition {
  id: string;
  key: string;
  title: string;
  /** Critères observables sur la photo (ce que la vision doit constater). */
  criteria: string[];
  /** Alternative accessible (mobilité, budget, sans sortie). */
  accessibleAlternative: string;
  boost: 'SATIETY' | 'MOOD';
  passions: Passion[];
  faceRequired: false;
}

const m = (id: string, title: string, criteria: string[], accessibleAlternative: string, boost: 'SATIETY' | 'MOOD', passions: Passion[]): MissionDefinition => ({
  id,
  key: `mission.${id}`,
  title,
  criteria,
  accessibleAlternative,
  boost,
  passions,
  faceRequired: false,
});

export const MISSIONS: MissionDefinition[] = [
  m('healthy_meal', 'Bien manger', ['une assiette avec au moins un légume ou un fruit visible'], 'Photo d’un fruit ou d’un verre d’eau posé sur une table', 'SATIETY', ['CUISINE']),
  m('walk_outside', 'Prendre l’air', ['un extérieur visible (ciel, arbre, rue ou parc)'], 'Photo d’une fenêtre ouverte sur l’extérieur', 'MOOD', ['NATURE']),
  m('book_page', 'Une page par jour', ['un livre ou une liseuse ouverte'], 'Capture d’un livre audio en cours d’écoute', 'MOOD', ['LECTURE']),
  m('cook_something', 'Petit chef', ['un plat ou des ingrédients en préparation'], 'Photo d’une tartine ou d’un bol préparé', 'SATIETY', ['CUISINE']),
  m('music_moment', 'Moment musique', ['un instrument, un casque, une enceinte ou un écran de lecture musicale'], 'Capture de la chanson écoutée', 'MOOD', ['MUSIQUE']),
  m('stretch', 'Étirements', ['un tapis, une serviette ou un espace dégagé pour bouger'], 'Photo d’une chaise près de laquelle faire des étirements assis', 'MOOD', ['SPORT']),
  m('draw_doodle', 'Gribouillis', ['un dessin, croquis ou collage réalisé sur papier ou écran'], 'Photo de trois traits sur un post-it', 'MOOD', ['ART']),
  m('plant_care', 'Main verte', ['une plante, une fleur ou un arbre'], 'Photo d’une image de plante dans un livre ou à l’écran', 'MOOD', ['NATURE']),
  m('board_game', 'Partie de jeu', ['un plateau, des cartes, des dés ou un écran de jeu'], 'Capture d’un jeu de mots ou de logique sur téléphone', 'MOOD', ['JEUX']),
  m('new_place', 'Petit explorateur', ['un lieu ou une rue différente de chez soi (panneau, façade, vitrine)'], 'Photo d’un objet de voyage ou d’une carte', 'MOOD', ['VOYAGE']),
  m('dance_spot', 'Pas de danse', ['un espace où danser, ou des chaussures de danse'], 'Capture de la musique sur laquelle danser assis', 'MOOD', ['DANSE']),
  m('film_night', 'Séance ciné', ['un écran, une affiche ou un ticket de film'], 'Capture de la bande-annonce regardée', 'MOOD', ['CINEMA']),
  m('hydrate', 'Hydratation', ['un verre, une gourde ou une tasse'], 'Aucune alternative nécessaire : un verre d’eau suffit', 'SATIETY', []),
  m('tidy_corner', 'Coin rangé', ['un petit espace rangé (bureau, étagère, table)'], 'Photo d’un seul objet remis à sa place', 'MOOD', []),
];
