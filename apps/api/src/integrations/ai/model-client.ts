/** Port bas niveau vers un fournisseur de modèles : un appel, une réponse et les jetons consommés. */
import type { AiTokenUsage } from '@blowy/domain';

export interface ModelCall {
  model: string;
  system: string;
  prompt: string;
  image?: { base64: string; mediaType: 'image/jpeg' | 'image/webp' };
  maxTokens: number;
}

export interface ModelReply {
  text: string;
  usage: AiTokenUsage;
}

export interface ModelClient {
  /** Lève une erreur en cas d'échec (réseau, 4xx, 5xx, réponse illisible). */
  complete(call: ModelCall): Promise<ModelReply>;
}
