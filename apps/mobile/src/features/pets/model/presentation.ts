/**
 * Présentation d'un pet : mots i18n pour le libellé VoiceOver, jauges affichables.
 * Pur (dépend seulement de t()) ; testé.
 */
import type { PetGauges, PetPose, Species } from '@blowy/domain';
import type { PetLabelWords } from '@blowy/ui-mobile/pure';
import { t, tDynamic } from '../../../i18n';

export const petLabelWords: PetLabelWords = {
  pose: (p: PetPose) => tDynamic(`pose.${p}`),
  withOther: (name) => t('pet.withOther', { name }),
  overlay: (o) => tDynamic(`overlay.${o}`),
  walkingTo: (place) => t('pet.walkingTo', { place }),
};

export const speciesName = (s: Species): string => tDynamic(`species.${s}`);

export const GAUGE_ORDER = ['satiety', 'energy', 'mood', 'health'] as const;
/** Seuils d'alerte repris des règles de pose (§5.2) : santé < 30, faim < 25, énergie < 15, humeur < 30. */
const CRITICAL: Record<keyof PetGauges, number> = { satiety: 25, energy: 15, mood: 30, health: 30 };

export function gaugeRows(g: PetGauges) {
  return GAUGE_ORDER.map((k) => {
    const value = Math.round(Math.max(0, Math.min(100, g[k])));
    const critical = value < CRITICAL[k];
    return { key: k, label: tDynamic(`pet.gauge.${k}`), value, valueText: t('pet.gauge.value', { value }), criticalLabel: critical ? t('pet.gauge.critical') : null };
  });
}
