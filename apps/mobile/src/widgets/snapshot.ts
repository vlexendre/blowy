/**
 * Instantané minimal du widget (pur, testé) : pet, série, rendez-vous qui attend.
 * Jamais de photo humaine, de message, de prénom humain ni de lieu réel (écran verrouillé).
 * « X attend Y » seulement si l'autre pet est réellement présent au lieu et le mien absent.
 */
import type { OwnPetView, RelationshipView } from '@blowy/api-contract';

export interface WidgetProps {
  petName: string;
  /** Pose → libellé déjà traduit (le widget ne peut pas importer i18n). */
  moodLabel: string;
  streakLabel: string | null;
  waitingLabel: string | null;
  /** Lien profond ouvert au tap (scheme blowy). */
  url: string;
  /** Titre d'état vide (pas de pet). */
  emptyLabel: string;
}

export interface WidgetWords {
  mood: (pose: OwnPetView['pose']) => string;
  streak: (days: number) => string;
  waiting: (other: string, mine: string) => string;
  empty: string;
}

export const WIDGET_SCHEME = 'blowy';

export function buildWidgetSnapshot(pet: Pick<OwnPetView, 'name' | 'pose'> | null, streakDays: number | null, rels: readonly Pick<RelationshipView, 'id' | 'type' | 'status' | 'otherPet' | 'otherPresence' | 'myPetHere' | 'paused'>[], words: WidgetWords): WidgetProps {
  if (!pet) return { petName: '', moodLabel: '', streakLabel: null, waitingLabel: null, url: `${WIDGET_SCHEME}://nest`, emptyLabel: words.empty };
  const waiting = rels.find((r) => r.type === 'DATE' && r.status === 'ACTIVE' && !r.paused && r.otherPresence === 'HERE' && !r.myPetHere);
  return {
    petName: pet.name,
    moodLabel: words.mood(pet.pose),
    streakLabel: streakDays !== null && streakDays > 0 ? words.streak(streakDays) : null,
    // Nom du PET partenaire uniquement (jamais l'humain).
    waitingLabel: waiting ? words.waiting(waiting.otherPet.name, pet.name) : null,
    url: waiting ? `${WIDGET_SCHEME}://widget/date/${waiting.id}` : `${WIDGET_SCHEME}://widget/pet`,
    emptyLabel: words.empty,
  };
}
