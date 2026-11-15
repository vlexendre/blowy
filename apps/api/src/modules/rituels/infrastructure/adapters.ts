/**
 * Adaptateurs des ports externes des rituels : vérification des preuves, reformulation du bilan, lecture des photos.
 * Version réelle (passerelle IA, stockage Supabase) et version mémoire (déterministe, pour les tests et le local).
 */
import { Logger } from '@nestjs/common';
import { habitById, habitProofPrompt, habitProofSystem, reviewText } from '@blowy/content';
import { type ProofVerdict, isKindText } from '@blowy/domain';
import type { AiGateway } from '../../../integrations/ai/ai-gateway';
import type { MemoryStorage } from '../../../integrations/storage/memory-storage';
import type { Db } from '../../../persistence/database.types';
import type { Coach, CoachInput, HabitProofInput, HabitProofVerdict, HabitVerifier, ProofImages } from '../ports';

const UNSURE: HabitProofVerdict = { verdict: 'unsure', byModel: false };
/** Côté le plus long envoyé au modèle de vision. */
export const PROOF_IMAGE_SIDE = 512;

/** Lit la réponse courte du modèle (YES / NO / UNSURE) ; tout le reste vaut « pas sûr ». */
export function parseProofAnswer(text: string): ProofVerdict {
  const word = text.trim().split(/\s+/)[0]?.replace(/[^a-z]/gi, '').toUpperCase();
  return word === 'YES' ? 'yes' : word === 'NO' ? 'no' : 'unsure';
}

/**
 * Vérification réelle : petit modèle de vision via la passerelle IA (fonction `habit_proof`), image réduite à 512 px,
 * réponse d'un mot, consigne stable (mise en cache). Si la passerelle refuse (interrupteur, budget, panne) ou si
 * l'image ne peut pas être lue : « pas sûr », donc on fait confiance.
 */
export class AiHabitVerifier implements HabitVerifier {
  private readonly logger = new Logger('HabitVerifier');

  constructor(
    private readonly gateway: AiGateway,
    private readonly images: ProofImages,
  ) {}

  async verify(input: HabitProofInput): Promise<HabitProofVerdict> {
    try {
      const habit = habitById(input.habitId);
      if (!habit) return UNSURE;
      const image = await this.images.read512(input.path);
      if (!image) return UNSURE;
      const result = await this.gateway.complete({
        feature: 'habit_proof',
        userId: input.userId,
        system: habitProofSystem,
        prompt: habitProofPrompt(habit),
        image,
        maxTokens: 4,
        tier: 'small',
        locale: input.locale,
      });
      if (!result.ok) return UNSURE;
      return { verdict: parseProofAnswer(result.text), byModel: true };
    } catch (err) {
      this.logger.warn(`vérification impossible : ${err instanceof Error ? err.message : 'erreur inconnue'}`);
      return UNSURE;
    }
  }
}

/**
 * Vérification en mémoire, déterministe : « oui » par défaut ; les tests peuvent imposer les prochains verdicts
 * d'une personne (`queue`).
 */
export class MemoryHabitVerifier implements HabitVerifier {
  private readonly queued = new Map<string, ProofVerdict[]>();
  readonly calls: HabitProofInput[] = [];

  queue(userId: string, ...verdicts: ProofVerdict[]): void {
    this.queued.set(userId, [...(this.queued.get(userId) ?? []), ...verdicts]);
  }

  async verify(input: HabitProofInput): Promise<HabitProofVerdict> {
    this.calls.push(input);
    const next = this.queued.get(input.userId)?.shift();
    return { verdict: next ?? 'yes', byModel: false };
  }
}

/**
 * Reformulation réelle du bilan : petit modèle via la passerelle (fonction `weekly_review`). Le texte rendu doit passer
 * le garde-fou de positivité ; sinon, ou si la passerelle refuse, on garde le modèle de phrases (null).
 */
export class AiCoach implements Coach {
  constructor(private readonly gateway: AiGateway) {}

  async rephrase(input: CoachInput): Promise<string | null> {
    try {
      const result = await this.gateway.complete({
        feature: 'weekly_review',
        userId: input.userId,
        system: reviewText.coachSystem,
        prompt: input.template,
        maxTokens: 300,
        tier: 'small',
        locale: input.locale,
      });
      if (!result.ok) return null;
      const text = result.text.trim();
      return isKindText(text) ? text : null;
    } catch {
      return null;
    }
  }
}

/** Bilan en mémoire : toujours le modèle de phrases. */
export class TemplateCoach implements Coach {
  async rephrase(): Promise<string | null> {
    return null;
  }
}

const IMAGE_TYPES = new Set(['image/jpeg', 'image/webp']);
const asMediaType = (t: string): 'image/jpeg' | 'image/webp' | null => (IMAGE_TYPES.has(t) ? (t as 'image/jpeg' | 'image/webp') : null);

/**
 * Photo réduite par le service d'images de Supabase Storage (512 px de côté au plus, format d'origine) :
 * le serveur ne décode jamais d'image lui-même.
 */
export class SupabaseProofImages implements ProofImages {
  constructor(private readonly client: Db) {}

  async read512(path: string) {
    const { data, error } = await this.client.storage
      .from('media')
      .download(path, { transform: { width: PROOF_IMAGE_SIDE, height: PROOF_IMAGE_SIDE, resize: 'contain', quality: 70, format: 'origin' } });
    if (error || !data) return null;
    const mediaType = asMediaType(data.type);
    if (!mediaType) return null;
    return { base64: Buffer.from(await data.arrayBuffer()).toString('base64'), mediaType };
  }
}

/** Photo lue dans le stockage mémoire (déjà petite : l'app compresse avant l'envoi). */
export class MemoryProofImages implements ProofImages {
  constructor(private readonly storage: MemoryStorage) {}

  async read512(path: string) {
    const file = this.storage.peek(path);
    const mediaType = file ? asMediaType(file.contentType) : null;
    if (!file || !mediaType) return null;
    return { base64: file.bytes.toString('base64'), mediaType };
  }
}
