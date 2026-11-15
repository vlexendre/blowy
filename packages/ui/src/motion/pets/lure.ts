import { useMemo } from 'react';
import type { View } from 'react-native';
import { type AnimatedRef, type SharedValue, useAnimatedRef, useSharedValue } from 'react-native-reanimated';

/**
 * Un objet qu'on porte vers le pet (soin glissé jusqu'à lui) : position du doigt en coordonnées de la fenêtre,
 * mise à jour sur le fil natif, et la zone où le lâcher (le pet). Partagé entre `CareBar` (qui écrit) et
 * `PetStage` / `PetActor` (qui lisent : le pet regarde l'objet, ouvre la bouche quand il approche).
 */
export interface PetLure {
  /** Centre de l'objet porté (fenêtre, pt). */
  x: SharedValue<number>;
  y: SharedValue<number>;
  /** 1 tant qu'un objet est porté, 0 sinon. */
  on: SharedValue<number>;
  /** Zone de dépôt : la vue du pet (à brancher par `PetStage`). */
  target: AnimatedRef<View>;
}

/** Crée le lien entre la barre de soins et le pet de l'accueil (`<PetStage lure>` + `<CareBar lure>`). */
export function usePetLure(): PetLure {
  const x = useSharedValue(0);
  const y = useSharedValue(0);
  const on = useSharedValue(0);
  const target = useAnimatedRef<View>();
  return useMemo(() => ({ x, y, on, target }), [x, y, on, target]);
}

/** Marge autour du pet où un objet lâché compte encore (pt). */
export const LURE_SLOP = 18;

/** L'objet est-il lâché sur le pet ? (worklet ; `rect` : mesure de la zone de dépôt). */
export function lureHits(px: number, py: number, rect: { pageX: number; pageY: number; width: number; height: number } | null): boolean {
  'worklet';
  if (!rect) return false;
  return px >= rect.pageX - LURE_SLOP && px <= rect.pageX + rect.width + LURE_SLOP && py >= rect.pageY - LURE_SLOP && py <= rect.pageY + rect.height + LURE_SLOP;
}
