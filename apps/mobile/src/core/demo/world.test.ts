/**
 * Les fixtures du mode démo respectent les contrats : chaque réponse de chaque scénario est
 * validée par le schéma Zod de sa route (le même que l'app applique aux réponses réelles).
 */
import * as C from '@blowy/api-contract';
import { describe, expect, it } from 'vitest';
import type { z } from 'zod';
import { matchRoute } from './demo-fetch';
import { DEMO_SCENARIOS, demoScenario } from './scenarios';

const SCHEMAS: [RegExp, z.ZodType][] = [
  [/^\/v1\/me$/, C.SelfProfileSchema],
  [/^\/v1\/me\/neighborhood$/, C.NeighborhoodStatusViewSchema],
  [/^\/v1\/neighborhoods$/, C.NeighborhoodListSchema],
  [/^\/v1\/outings\/week$/, C.OutingWeekViewSchema],
  [/^\/v1\/outings\/[^/]+$/, C.OutingViewSchema],
  [/^\/v1\/outings\/[^/]+\/votes$/, C.OutingVotesViewSchema],
  [/^\/v1\/conversations$/, C.ConversationListSchema],
  [/^\/v1\/conversations\/[^/]+\/messages$/, C.MessagePageSchema],
  [/^\/v1\/me\/allowances$/, C.AllowancesViewSchema],
  [/^\/v1\/purchases\/products$/, C.ProductsResponseV5Schema],
  [/^\/v1\/teams\/mine$/, C.CreateTeamResponseSchema],
  [/^\/v1\/band$/, C.BandPageSchema],
  [/^\/v1\/band\/street$/, C.StreetViewSchema],
  [/^\/v1\/duos$/, C.DuoListSchema],
  [/^\/v1\/duos\/[^/]+$/, C.DuoViewSchema],
  [/^\/v1\/duo-lane$/, C.DuoLaneFeedSchema],
  [/^\/v1\/me\/reliability$/, C.ReliabilityViewSchema],
  [/^\/v1\/safety\/status$/, C.SafetyStatusViewSchema],
  [/^\/v1\/safety\/guardian-links$/, C.GuardianLinkListSchema],
  [/^\/v1\/pets\/mine\/memories$/, C.PetMemoryPageSchema],
  [/^\/v1\/preferences\/outings$/, C.OutingPreferencesV5Schema],
  [/^\/v1\/preferences\/intentions$/, C.IntentionsV5Schema],
  [/^\/v1\/consents$/, C.ConsentStateSchema],
  [/^\/v1\/me\/city-insights$/, C.CityInsightsViewSchema],
  [/^\/v1\/share-links$/, C.ShareLinkViewSchema],
  [/^\/v1\/public\/invites\/[^/]+$/, C.InvitePreviewSchema],
  [/^\/v1\/me\/notifications\/settings$/, C.NotificationSettingsViewSchema],
  [/^\/v1\/outings\/[^/]+\/seat\/accept$/, C.SeatAcceptResponseSchema],
  [/^\/v1\/subscriptions\/plus\/checkout$/, C.PlusCheckoutResponseSchema],
  [/^\/v1\/teams$/, C.CreateTeamResponseSchema],
];

describe('mode démo : fixtures conformes aux contrats', () => {
  for (const name of DEMO_SCENARIOS) {
    it(name, () => {
      const s = demoScenario(name)!;
      expect(Number.isNaN(Date.parse(s.now))).toBe(false);
      for (const r of s.routes) {
        if (r.method !== 'GET' || typeof r.respond === 'function' || typeof r.respond === 'symbol')
          continue;
        const schema = SCHEMAS.find(([re]) => re.test(r.path.replace(/:[a-z]+/g, 'x')))?.[1];
        if (!schema) continue;
        const res = schema.safeParse(r.respond);
        expect(
          res.success,
          `${name} ${r.path} : ${res.success ? '' : JSON.stringify(res.error.issues.slice(0, 3))}`,
        ).toBe(true);
      }
    });
  }

  it('route non décrite → 404 « Cannot GET » (jamais une donnée par défaut)', () => {
    expect(matchRoute(demoScenario('accueil')!.routes, 'GET', '/v1/inconnue')).toBeNull();
  });

  it('scénario inconnu → null', () => {
    expect(demoScenario('nope')).toBeNull();
  });
});
