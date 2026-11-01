/**
 * Libellé vocalisé d'un pet (« Nino, joyeux, avec Suzie »). Logique pure : les mots sont
 * fournis déjà traduits par l'app (aucun texte en dur ici).
 */
import type { PetPose } from '@blowy/domain';
import type { StateOverlay } from '@blowy/sprites';

export interface PetLabelWords {
  /** Libellé de pose traduit (`pose.JOYFUL` → « joyeux »). */
  pose: (pose: PetPose) => string;
  /** « avec {name} ». */
  withOther: (name: string) => string;
  /** Libellé d'état superposé (« malade ») quand la pose exacte n'est pas dessinée. */
  overlay: (o: StateOverlay) => string;
  /** « en route vers {place} ». */
  walkingTo?: (place: string) => string;
}

export interface PetLabelInput {
  name: string;
  pose: PetPose;
  overlay?: StateOverlay | null;
  otherName?: string | null;
  walkingTo?: string | null;
  /** Accessoires portés, libellés traduits. */
  accessories?: readonly string[];
}

export function petAccessibilityLabel(input: PetLabelInput, words: PetLabelWords): string {
  const parts = [input.name, words.pose(input.pose)];
  // L'état ne doit jamais dépendre du seul dessin : on vocalise l'overlay s'il diffère.
  if (input.overlay) {
    const o = words.overlay(input.overlay);
    if (!parts.includes(o)) parts.push(o);
  }
  if (input.walkingTo && words.walkingTo) parts.push(words.walkingTo(input.walkingTo));
  if (input.otherName) parts.push(words.withOther(input.otherName));
  if (input.accessories && input.accessories.length > 0) parts.push(input.accessories.join(', '));
  return parts.join(', ');
}
