/**
 * Repository pets : contrats @blowy/api-contract/pets (C). Routes : POST /v1/pets,
 * GET /v1/pets/me, POST /v1/pets/:id/actions, POST /v1/pets/:id/move.
 * Au 2026-11-01 le contrôleur pets n'est pas monté : les écrans affichent « indisponible ».
 */
import { OwnPetViewSchema, PetActionResultSchema, type CreatePrimaryPetRequest, type MovePetRequest, type PetActionRequest } from '@blowy/api-contract';
import type { Http } from '../../../core/api/http';
import { routes } from '../../../core/api/routes';

export function createPetsRepository(http: Http) {
  return {
    mine: () => http.request({ method: 'GET', path: routes.pets.mine }, OwnPetViewSchema),
    create: (commandId: string, body: CreatePrimaryPetRequest) => http.request({ method: 'POST', path: routes.pets.create, body, commandId }, OwnPetViewSchema),
    act: (commandId: string, petId: string, body: PetActionRequest) => http.request({ method: 'POST', path: routes.pets.action(petId), body, commandId }, PetActionResultSchema),
    move: (commandId: string, petId: string, body: MovePetRequest) => http.request({ method: 'POST', path: routes.pets.move(petId), body, commandId }, OwnPetViewSchema),
  };
}
export type PetsRepository = ReturnType<typeof createPetsRepository>;
