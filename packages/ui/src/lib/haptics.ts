import * as Haptics from 'expo-haptics';
import { Platform } from 'react-native';

export type HapticKind = 'light' | 'medium' | 'selection' | 'success' | 'warning';

/** Retour haptique discret ; sans effet sur le web ou si l'appareil ne le gère pas. */
export function haptic(kind: HapticKind = 'light'): void {
  if (Platform.OS === 'web') return;
  const run = (): Promise<void> => {
    switch (kind) {
      case 'selection':
        return Haptics.selectionAsync();
      case 'success':
        return Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      case 'warning':
        return Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
      case 'medium':
        return Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
      default:
        return Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
  };
  run().catch(() => undefined);
}

/**
 * Accords visuel ↔ toucher (docs/MOTION.md, règle 7) : un nom de moment plutôt qu'un type de vibration.
 * - `press` appui · `select` changement de sélection · `land` un pet ou un objet qui se pose
 * - `success` réussite · `celebrate` fête (objet débloqué, niveau) · `error` refus, code faux
 */
export type HapticMoment = 'press' | 'select' | 'land' | 'success' | 'celebrate' | 'error';

const MOMENTS: Record<HapticMoment, HapticKind> = {
  press: 'light',
  select: 'selection',
  land: 'medium',
  success: 'success',
  celebrate: 'success',
  error: 'warning',
};

/** Vibration associée à un moment d'animation (aucun effet sur le web). */
export function hapticFor(moment: HapticMoment): void {
  haptic(MOMENTS[moment]);
}
