/**
 * Soins gratuits (jamais d'achat requis) : nourrir et soigner. Le soin de maladie ne rapporte
 * pas d'XP (aucun contournement du gel) ; nourrir rapporte de l'XP pet plafonnée.
 */
import { adjustGauge, isSick } from '../gauges/index.js';
import { grantPetXp } from '../progression/index.js';
import { PET_DAILY_KEYS } from '../model/index.js';
import { localDayKey } from '../time/index.js';
import { rollDaily } from '../shared/index.js';
import { defineHandler } from './handler.js';
import { findPet } from './guards.js';

export const feedHandler = defineHandler('FEED_PET', (world, ev, ctx, out) => {
  const pet = findPet(world, ev.petId, out);
  if (!pet) return;
  const c = ctx.tuning.care.feed;
  adjustGauge(pet, 'satiety', c.satiety, ctx.tuning);
  pet.daily = rollDaily(pet.daily, localDayKey(ctx.now, pet.tz), PET_DAILY_KEYS);
  if (pet.daily.counts.feedXp >= c.petXpGainsPerDay) {
    out.push({ type: 'NO_GAIN_CAP_REACHED', action: 'FEED', relationshipId: null, petId: pet.id });
    return;
  }
  pet.daily.counts.feedXp += 1;
  grantPetXp(pet, 'FEED', c.petXp, ev.weekendEntitlement, ctx, out);
});

export const healHandler = defineHandler('HEAL_PET', (world, ev, ctx, out) => {
  const pet = findPet(world, ev.petId, out);
  if (!pet) return;
  const wasSick = isSick(pet, ctx.tuning);
  adjustGauge(pet, 'health', ctx.tuning.care.heal.health, ctx.tuning);
  if (wasSick && !isSick(pet, ctx.tuning)) out.push({ type: 'PET_RECOVERED', petId: pet.id });
});
