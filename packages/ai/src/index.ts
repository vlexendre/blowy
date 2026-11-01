/**
 * @blowy/ai — SERVER-ONLY (interdit dans les bundles mobile/web : règle ESLint racine).
 * Interfaces, adaptateurs OpenAI réels et locaux déterministes, prompts versionnés,
 * politique de modération versionnée, exécuteur (timeout/retries/breaker/plafonds/cache).
 */
export * from './errors.js';
export * from './schemas.js';
export * from './providers.js';
export * from './prompts.js';
export * from './policy.js';
export * from './cost.js';
export * from './runtime/runner.js';
export * from './pipeline/moderation-pipeline.js';
export * from './local/local-adapters.js';
export * from './local/audio.js';
export { createOpenAiProviders, interpretStructured, classifyTranscript, type OpenAiConfig } from './openai/openai-adapters.js';
export * from './factory.js';
