/**
 * Formes structurelles des données affichées. Elles reprennent les champs des DTO de @blowy/contract
 * (Pet, PublicPet, Person, Link, Message, Suggestion, Incoming, Memories, PetEvent) sans en dépendre :
 * un écran peut passer l'objet du contrat tel quel.
 */
import type { FaceVisibility, Gauges, LinkStatus, Mood, PetEventKind, PetForm, Species } from '@blowy/domain';

/** Compatible avec `PublicPet` (et `Pet`, dont `mood` est absent). */
export interface PetLook {
  name: string;
  species: Species;
  form?: PetForm;
  mood?: Mood;
}

/** Compatible avec `Person`. */
export interface PersonLook {
  displayName: string;
  pet: PetLook;
  face: FaceVisibility;
  avatarUrl: string | null;
}

export type MessageAuthor = 'me' | 'other' | 'my_pet' | 'other_pet' | 'system';
export type MessageKind = 'text' | 'photo' | 'event';

/** Compatible avec `Message`. */
export interface MessageLook {
  id: string;
  author: MessageAuthor;
  kind: MessageKind;
  body: string | null;
  mediaUrl: string | null;
  at: string;
}

/** Compatible avec `Link.today`. */
export interface TodayLook {
  mine: boolean;
  theirs: boolean;
  myPhotoUrl: string | null;
  theirPhotoUrl: string | null;
}

/** Sous-ensemble de `Link` utilisé par la liste des chats. */
export interface LinkLook {
  other: PersonLook;
  myPet: PetLook;
  status: LinkStatus;
  lives: number;
  level: number;
  unread: number;
  lastMessage: { preview: string; at: string } | null;
}

/** Compatible avec `PetEvent`. */
export interface PetEventLook {
  id: string;
  kind: PetEventKind;
  delta: Partial<Gauges>;
  at: string;
}

/** Compatible avec `Memories.days[n]`. */
export interface MemoryDayLook {
  day: string;
  myPhotoUrl: string | null;
  theirPhotoUrl: string | null;
}

/** Compatible avec `Memories.stats`. */
export interface MemoryStatsLook {
  messages: number;
  photos: number;
  daysTogether: number;
  bestStreak: number;
}

/** Compatible avec `Suggestion`. */
export interface SuggestionLook {
  user: PersonLook;
  compatibility: number;
  intro: string;
  waved: boolean;
}

/** Compatible avec `Incoming`. */
export interface IncomingLook {
  from: PersonLook;
  compatibility: number;
  intro: string;
}

/** Segment d'un titre Anton : `dim` rend la partie estompée des maquettes. */
export interface TitleSegment {
  text: string;
  dim?: boolean;
}
export type TitleContent = string | readonly TitleSegment[];
