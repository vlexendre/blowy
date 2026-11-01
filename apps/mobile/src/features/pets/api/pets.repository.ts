/** Repository pets : BlowyClient (`GET /v1/pets/mine`, `POST /v1/pets`, `/actions`, `/move`). */
import type { CreatePrimaryPetRequest, MovePetRequest, PetActionRequest } from '@blowy/api-contract';
import type { Api } from '../../../core/api/client';

export function createPetsRepository({ client }: Api) {
  return {
    mine: () => client.pets.mine(),
    create: (commandId: string, body: CreatePrimaryPetRequest) => client.pets.create(body, { commandId }),
    act: (commandId: string, petId: string, body: PetActionRequest) => client.pets.act(petId, body, { commandId }),
    move: (commandId: string, petId: string, body: MovePetRequest) => client.pets.move(petId, body, { commandId }),
  };
}
export type PetsRepository = ReturnType<typeof createPetsRepository>;
