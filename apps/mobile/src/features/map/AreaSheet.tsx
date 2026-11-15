/**
 * Sans localisation : choisir sa ville à la main (gratuit ; une fois tous les 30 jours sans Blowy+), parmi la même
 * liste que « Changer de ville ». Le serveur arrondit et garde la ville comme zone ; les rencontres et la carte s'y
 * centrent.
 */
import { Banner, ChoiceGrid, SheetTemplate, Text } from '@blowy/ui';

import { carte as t } from '@/locales/rencontres';
import { errorMessage } from '@/features/session';

import { CITIES } from './cities';
import { useArea } from './index';

export function AreaSheet({ visible, onClose, current }: { visible: boolean; onClose: () => void; current?: string | null }) {
  const area = useArea();
  return (
    <SheetTemplate visible={visible} onClose={onClose} title={t.area.title} closeLabel={t.back} scroll>
      <Text size={15} muted>
        {t.area.text}
      </Text>
      <ChoiceGrid
        items={CITIES.map((c) => ({ key: c.id, label: t.cities[c.id] }))}
        selected={current ? (CITIES.find((c) => t.cities[c.id] === current)?.id ?? null) : null}
        onSelect={(id) => {
          const c = CITIES.find((x) => x.id === id);
          if (!c) return;
          area.mutate({ label: t.cities[c.id], latitude: c.latitude, longitude: c.longitude }, { onSuccess: onClose });
        }}
      />
      {area.isError ? <Banner tone="error" text={errorMessage(area.error, t.area.error)} /> : null}
    </SheetTemplate>
  );
}
