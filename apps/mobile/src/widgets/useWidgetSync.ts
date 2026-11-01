/**
 * Synchronise l'instantané du widget quand le pet / les relations changent (app ouverte).
 * Pas de mise à jour en arrière-plan forcée : rythme laissé à l'OS (timeline/rechargement).
 * Le module natif n'existe que dans un development build : on l'importe paresseusement et
 * on ignore son absence (Expo Go, web, tests).
 */
import { useEffect } from 'react';
import { t, tDynamic } from '../i18n';
import { useMyPet } from '../features/pets';
import { useRelationships } from '../features/relationships';
import { buildWidgetSnapshot, type WidgetProps } from './snapshot';

let widget: { updateSnapshot(p: WidgetProps): void } | null | undefined;
async function loadWidget() {
  if (widget !== undefined) return widget;
  try {
    widget = (await import('./BlowyPetWidget')).default;
  } catch {
    widget = null;
  }
  return widget;
}

export function useWidgetSync(): void {
  const pet = useMyPet();
  const rels = useRelationships();
  useEffect(() => {
    const snap = buildWidgetSnapshot(pet.data ?? null, null, rels.data?.items ?? [], {
      mood: (p) => tDynamic(`pose.${p}`),
      streak: (days) => t('nest.streak', { days }),
      waiting: (other, mine) => t('widget.waiting', { other, mine }),
      empty: t('widget.empty'),
    });
    void loadWidget().then((w) => {
      try {
        w?.updateSnapshot(snap);
      } catch {
        /* module natif absent : rien à faire */
      }
    });
  }, [pet.data, rels.data]);
}
