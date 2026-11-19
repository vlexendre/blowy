import type { PetView } from '@blowy/contract';
import { applyCare, type CareAction, shapeOf, wellbeing } from '@blowy/domain';

/** Le pet juste après un soin, d'après la règle du domaine (le serveur applique la même ; sa réponse fait foi). */
export function cared(view: PetView, action: CareAction): PetView {
  const needs = applyCare(view.pet.needs, action);
  return { ...view, pet: { ...view.pet, needs, wellbeing: wellbeing(needs), shape: shapeOf(needs) } };
}
