/**
 * Animations nommées par le serveur (Ton chemin : réaction d'une option, transition entre deux questions, scène de
 * fin ; docs/CHEMIN.md). Le serveur n'envoie que des noms que l'app déclare savoir jouer (`minBuild`) ; un nom inconnu
 * (contenu plus récent que l'app) retombe sur un repli neutre : rien de plus que le texte.
 */
import type { BurstKind } from './Burst';
import type { PetActorReaction } from './pets/PetActor';

export interface NamedMotion {
  /** Ce que fait le minimoa (`PetActor.react`). */
  reaction: PetActorReaction | null;
  /** Une explosion par-dessus (confettis, étoiles). */
  burst: BurstKind | null;
}

const NEUTRAL: NamedMotion = { reaction: null, burst: null };

const NAMED: Readonly<Record<string, NamedMotion>> = {
  hop: { reaction: 'joy', burst: null },
  joy: { reaction: 'joy', burst: null },
  confetti: { reaction: 'party', burst: 'confetti' },
  party: { reaction: 'party', burst: 'confetti' },
  stars: { reaction: 'proud', burst: 'stars' },
  sparkles: { reaction: 'joy', burst: 'sparkles' },
  wave: { reaction: 'wave', burst: null },
  think: { reaction: 'think', burst: null },
  surprise: { reaction: 'surprise', burst: null },
  clap: { reaction: 'clap', burst: null },
  laugh: { reaction: 'laugh', burst: null },
  dance: { reaction: 'dance', burst: null },
  shy: { reaction: 'shy', burst: null },
  fade: NEUTRAL,
  default: NEUTRAL,
};

/** Les noms que cette app sait jouer (pour `?formats=` ou un futur `?animations=`). */
export const NAMED_MOTIONS = Object.keys(NAMED);

/** Ce qu'il faut jouer pour un nom du serveur ; inconnu ou absent : rien (repli neutre). */
export function namedMotion(name: string | null | undefined): NamedMotion {
  if (!name) return NEUTRAL;
  return Object.prototype.hasOwnProperty.call(NAMED, name) ? (NAMED[name] as NamedMotion) : NEUTRAL;
}
