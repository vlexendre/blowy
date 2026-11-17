/**
 * Rigueur et habitudes partagées (spéc. §25) mises en mots pour les jauges et la carte « Vous tenez tous les deux ».
 * Les nombres viennent du serveur (`RigourZ`) ; sans valeur (moins de 7 jours dus), « Trop tôt », jamais de chiffre.
 */
import type { Rigour, SharedHabits } from '@blowy/contract';
import type { SharedHabitsCardProps } from '@blowy/ui';

import { groupes } from '@/locales/groupes';
import { rituels } from '@/locales/rituels';
import { ui } from '@/locales/ui';

const t = groupes.rigour;

export function rigourView(r: Rigour): { value: number | null; label: string; valueLabel: string; accessibilityLabel: string } {
  const valueLabel = r.value === null ? t.tooEarly : ui.percent(r.value);
  return {
    value: r.value,
    label: t.label,
    valueLabel,
    accessibilityLabel: r.value === null ? ui.labelValue(t.label, t.tooEarlyLong) : t.a11y(valueLabel, r.dueDays),
  };
}

/** Props de `SharedHabitsCard` ; null quand rien n'est commun (ou que l'une des deux a coupé le réglage). */
export function sharedHabitsView(shared: SharedHabits | undefined, theirName: string): SharedHabitsCardProps | null {
  if (!shared || shared.habits.length === 0) return null;
  const side = (name: string, s: SharedHabits['habits'][number]['mine']) => {
    const r = rigourView(s.rigour);
    return { name, streak: s.streak, rigour: s.rigour.value, rigourLabel: r.valueLabel, accessibilityLabel: t.sideA11y(name, s.streak, r.valueLabel) };
  };
  const first = shared.habits[0];
  return {
    title: shared.habits.length === 1 && first ? t.sharedTitleOne(first.label) : t.sharedTitle,
    subtitle: shared.theirRigour?.value != null ? t.theirs(theirName, ui.percent(shared.theirRigour.value)) : undefined,
    habits: shared.habits.map((h) => ({
      key: h.habitId,
      emoji: rituels.habits.emoji[h.habitId],
      // Une seule habitude : son nom est déjà dans le titre.
      label: shared.habits.length === 1 ? '' : h.label,
      sides: [side(t.you, h.mine), side(theirName, h.theirs)] as const,
    })),
  };
}
