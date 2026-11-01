/** Nourrir le pet d'un ami Quartier : amitié +5, +10 pièces chacun ; 3 récompenses/jour/donneur, 1 par paire/jour. */
import { PET_DAILY_KEYS } from '../model/index.js';
import { adjustGauge } from '../gauges/index.js';
import { localDayKey } from '../time/index.js';
import { rollDaily } from '../shared/index.js';
import { defineHandler, reject } from './handler.js';
import { findPet } from './guards.js';

export const feedFriendHandler = defineHandler('FEED_FRIEND', (world, ev, ctx, out) => {
  const pair = world.neighborhood[ev.neighborhoodId];
  if (!pair) return reject(out, 'NOT_FOUND');
  const donorSide = pair.petIds.indexOf(ev.donorPetId);
  if (donorSide < 0) return reject(out, 'NOT_FOUND');
  const donor = findPet(world, ev.donorPetId, out);
  const friend = findPet(world, pair.petIds[donorSide === 0 ? 1 : 0], out);
  if (!donor || !friend) return;
  const f = ctx.tuning.actions.feedFriend;
  adjustGauge(friend, 'satiety', f.satiety, ctx.tuning);
  const dayKey = localDayKey(ctx.now, donor.tz);
  donor.daily = rollDaily(donor.daily, dayKey, PET_DAILY_KEYS);
  if (pair.rewardDayKey !== dayKey) {
    pair.rewardDayKey = dayKey;
    pair.rewardsToday = 0;
  }
  if (donor.daily.counts.feedFriendRewards >= f.rewardedPerDonorPerDay || pair.rewardsToday >= f.rewardedPerPairPerDay) {
    out.push({ type: 'NO_GAIN_CAP_REACHED', action: 'FEED_FRIEND', relationshipId: null, petId: donor.id });
    return;
  }
  donor.daily.counts.feedFriendRewards += 1;
  pair.rewardsToday += 1;
  pair.friendship = Math.min(f.friendshipMax, pair.friendship + f.friendship);
  // Registre unique : la clé d'idempotence identifie la récompense (paire, donneur, jour).
  for (const pet of [donor, friend])
    out.push({ type: 'COINS_CREDIT', petId: pet.id, amount: ctx.tuning.coins.neighborhoodFeed, reason: 'NEIGHBORHOOD_FEED', idempotencyKey: `feed:${pair.id}:${donor.id}:${dayKey}:${pet.id}` });
});
