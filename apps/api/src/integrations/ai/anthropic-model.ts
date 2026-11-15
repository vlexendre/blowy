/**
 * Adaptateur réel : API Messages d'Anthropic (https://platform.claude.com/docs/en/api/messages).
 * - consigne système en bloc mis en cache (`cache_control: ephemeral`) : relue à 0,1× le prix d'entrée
 *   quand elle dépasse le minimum cachable du modèle (512 jetons pour Haiku 5.5 et Sonnet 5.5) ;
 * - `max_tokens` court fixé par l'appelant ; délai maximal de 15 s ; pas de nouvelle tentative
 *   (l'appelant a toujours une règle de repli, une deuxième tentative coûterait double).
 * La clé n'est jamais journalisée ; le texte envoyé non plus.
 */
import type { ModelCall, ModelClient, ModelReply } from './model-client';

export const ANTHROPIC_URL = 'https://api.anthropic.com/v1/messages';
export const ANTHROPIC_VERSION = '2023-06-01';
const TIMEOUT_MS = 15_000;

interface AnthropicResponse {
  content?: { type: string; text?: string }[];
  usage?: { input_tokens?: number; output_tokens?: number; cache_creation_input_tokens?: number | null; cache_read_input_tokens?: number | null };
  error?: { type?: string; message?: string };
}

export class AnthropicModel implements ModelClient {
  constructor(
    private readonly apiKey: string,
    private readonly doFetch: typeof fetch = fetch,
  ) {}

  /** Corps de la requête (exposé pour les tests de forme). */
  static body(call: ModelCall): Record<string, unknown> {
    const content: Record<string, unknown>[] = [];
    if (call.image) content.push({ type: 'image', source: { type: 'base64', media_type: call.image.mediaType, data: call.image.base64 } });
    content.push({ type: 'text', text: call.prompt });
    return {
      model: call.model,
      max_tokens: call.maxTokens,
      system: [{ type: 'text', text: call.system, cache_control: { type: 'ephemeral' } }],
      messages: [{ role: 'user', content }],
    };
  }

  async complete(call: ModelCall): Promise<ModelReply> {
    const res = await this.doFetch(ANTHROPIC_URL, {
      method: 'POST',
      headers: { 'content-type': 'application/json', 'x-api-key': this.apiKey, 'anthropic-version': ANTHROPIC_VERSION },
      body: JSON.stringify(AnthropicModel.body(call)),
      signal: AbortSignal.timeout(TIMEOUT_MS),
    });
    const json = (await res.json().catch(() => null)) as AnthropicResponse | null;
    if (!res.ok || !json) throw new Error(`Anthropic ${res.status} : ${json?.error?.type ?? 'réponse illisible'}`);
    const text = (json.content ?? [])
      .filter((b) => b.type === 'text' && typeof b.text === 'string')
      .map((b) => b.text)
      .join('')
      .trim();
    const u = json.usage ?? {};
    return {
      text,
      usage: { input: u.input_tokens ?? 0, output: u.output_tokens ?? 0, cacheWrite: u.cache_creation_input_tokens ?? 0, cacheRead: u.cache_read_input_tokens ?? 0 },
    };
  }
}
