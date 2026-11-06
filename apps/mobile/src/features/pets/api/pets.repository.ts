/**
 * Pet (spec-v5 §5, §7.4). `GET /v1/pets/mine` sert encore la vue V4 (jauges) : on n'en lit que
 * l'identité commune V4/V5 (nom, espèce, stade). Souvenirs : `GET /v1/pets/mine/memories`
 * (contrat `PetMemoryPageSchema`), route non servie au 2026-11-06 → état « indisponible ».
 */
import {
  CreatePrimaryPetRequestSchema,
  PetMemoryPageSchema,
  SpeciesSchema,
  StageSchema,
  type CreatePrimaryPetRequest,
} from '@blowy/api-contract';
import { z } from 'zod';
import type { Api } from '../../../core/api/client';
import { routes } from '../../../core/api/routes';

export const MyPetSchema = z.object({
  id: z.string().uuid(),
  name: z.string(),
  species: SpeciesSchema,
  stage: StageSchema,
});
export type MyPet = z.infer<typeof MyPetSchema>;

export function createPetsRepository(api: Api) {
  return {
    mine: () => api.request('GET', routes.petMine, MyPetSchema),
    memories: () => api.request('GET', routes.petMemories, PetMemoryPageSchema),
    create: (body: CreatePrimaryPetRequest, cid: string) =>
      api.request('POST', routes.pets, MyPetSchema, CreatePrimaryPetRequestSchema.parse(body), {
        commandId: cid,
      }),
  };
}
