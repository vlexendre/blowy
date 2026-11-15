/**
 * Vérification des photos de profil (App Review 1.2). Approche la moins chère que la pile permet déjà : la même chaîne
 * que les preuves d'habitude — image réduite à 512 px par le service d'images de Supabase Storage (le serveur ne décode
 * jamais d'image), petit modèle de vision via `AiGateway` (fonction `moderation`, palier `small`, réponse d'un mot,
 * consigne stable), ≈ 600 jetons en entrée : ~0,00006 $ par photo.
 *
 * Ce qu'elle attrape : nudité et contenu sexuel, personne qui semble mineure, violence et sang, symboles de haine,
 * photo qui sert de publicité (texte, numéro, pseudo, code QR). Ce qu'elle n'attrape pas : une photo qui n'est pas de la
 * personne (usurpation), une photo anodine prise à quelqu'un sans son accord, ce qu'un modèle ne voit pas à 512 px.
 * Quand la passerelle refuse (coupée, budget, panne) : la photo est publiée (jamais bloquée par l'IA absente) et reste
 * « à vérifier » ; le minuteur la vérifie plus tard (`ModerationJobs`).
 */
import { Inject, Injectable, Logger } from '@nestjs/common';
import { photoModerationPrompt, photoModerationSystem } from '@blowy/content';
import { type AiModerationLabel, parseAiModeration } from '@blowy/domain';
import { AI_GATEWAY, type AiGateway } from '../../integrations/ai/ai-gateway';
import type { ProofImages } from '../rituels/ports';

export const PHOTO_IMAGES = Symbol('PHOTO_IMAGES');

/** ok : publiée · rejected : à retirer (`label`) · unchecked : IA indisponible, à revoir plus tard · unreadable : image illisible. */
export type PhotoVerdict = { kind: 'ok' } | { kind: 'rejected'; label: AiModerationLabel } | { kind: 'unchecked' } | { kind: 'unreadable' };

@Injectable()
export class PhotoCheck {
  private readonly logger = new Logger('PhotoCheck');

  constructor(
    @Inject(AI_GATEWAY) private readonly ai: AiGateway,
    @Inject(PHOTO_IMAGES) private readonly images: ProofImages,
  ) {}

  async check(userId: string, path: string, locale: string): Promise<PhotoVerdict> {
    try {
      const image = await this.images.read512(path);
      if (!image) return { kind: 'unreadable' };
      const result = await this.ai.complete({ feature: 'moderation', userId, system: photoModerationSystem, prompt: photoModerationPrompt, image, maxTokens: 4, tier: 'small', locale });
      if (!result.ok) return { kind: 'unchecked' };
      const parsed = parseAiModeration(result.text);
      // Réponse illisible : on garde la photo (comme « OK »), la modération humaine reste possible par signalement.
      if (!parsed || parsed.label === 'OK') return { kind: 'ok' };
      return { kind: 'rejected', label: parsed.label };
    } catch (err) {
      this.logger.warn(`vérification de photo impossible : ${err instanceof Error ? err.message : 'erreur inconnue'}`);
      return { kind: 'unchecked' };
    }
  }
}
