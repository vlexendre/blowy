/**
 * Accueil (V6-GAccueil) : l'état du moment et le chemin (`logic.ts`, pur et testé), le minimoa qui joue (`usePetPlay`),
 * les morceaux composés de @blowy/ui (`HomePanel`, `HomeNowCard`). L'écran `app/(tabs)/pet.tsx` ne fait qu'assembler.
 */
import { useEncounters } from '@/features/encounters';

export * from './logic';
export { usePetPlay, type PetPlay } from './play';
export { HomePanel } from './HomePanel';
export { HomeNowCard } from './HomeNowCard';
export { useHomeVisit } from './visit';
export { useHomeCompact } from './compact';

/** Le premier bonjour reçu qui attend une réponse (état `bonjour`), et combien d'autres ; null sinon. */
export function useHomeHello() {
  const incoming = useEncounters().data?.incoming ?? [];
  const first = incoming[0];
  if (!first) return null;
  const p = first.from;
  return { name: p.displayName, pet: p.pet, face: p.face, avatarUrl: p.avatarUrl, more: incoming.length - 1 };
}
