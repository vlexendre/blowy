/** Bande et « Ta rue » (spec-v5 §7.3, contrats `connections`). */
import {
  BandLeaveResponseSchema,
  BandPageSchema,
  StreetGiftResponseSchema,
  StreetViewSchema,
} from '@blowy/api-contract';
import { z } from 'zod';
import type { Api } from '../../../core/api/client';
import { routes } from '../../../core/api/routes';

export function createBandRepository(api: Api) {
  return {
    band: () => api.request('GET', routes.band, BandPageSchema),
    street: () => api.request('GET', routes.street, StreetViewSchema),
    leave: (linkId: string, cid: string) =>
      api.request(
        'POST',
        routes.bandLeave(linkId),
        BandLeaveResponseSchema,
        {},
        { commandId: cid },
      ),
    arrange: (memoryIds: string[], cid: string) =>
      api.request('PUT', routes.streetArrangement, z.unknown(), { memoryIds }, { commandId: cid }),
    gift: (linkId: string, accessoryId: string, cid: string) =>
      api.request(
        'POST',
        routes.streetGifts,
        StreetGiftResponseSchema,
        { linkId, accessoryId },
        { commandId: cid },
      ),
  };
}
