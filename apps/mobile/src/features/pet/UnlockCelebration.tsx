import { itemLabel } from '@blowy/content';
import { itemById } from '@blowy/domain';
import { UnlockSheet } from '@blowy/ui';

import { unlock as t } from '@/locales/pet';

import { usePet, useSetOutfit, useUnlocks } from './index';

/**
 * Fête les objets tout juste gagnés (V6-Debloque), un par un : le pet le porte déjà dans l'aperçu ;
 * « il le porte » l'ajoute à sa tenue, « ranger » le laisse dans la garde-robe.
 */
export function UnlockCelebration() {
  const id = useUnlocks((s) => s.queue[0]);
  const next = useUnlocks((s) => s.next);
  const pet = usePet().data?.pet;
  const setOutfit = useSetOutfit();
  const item = id ? itemById(id) : undefined;
  if (!id || !item || !pet) return null;

  const name = itemLabel[id] ?? id;
  const outfit = { ...pet.outfit, [item.slot]: id };
  const text = item.unlock.kind === 'stat' ? (t.reason[item.unlock.stat]?.(item.unlock.n) ?? t.fallback) : t.fallback;
  return (
    <UnlockSheet
      visible
      itemId={id}
      itemName={name}
      pet={{ species: pet.species, outfit, name: pet.name }}
      kicker={t.kicker}
      title={t.title(name, pet.name)}
      text={text}
      wearLabel={t.wear}
      wearing={setOutfit.isPending}
      onWear={() => setOutfit.mutate(outfit, { onSettled: next })}
      closeLabel={t.store}
      onClose={next}
    />
  );
}
