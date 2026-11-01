/**
 * Évaluation RÉELLE contre OpenAI — OPT-IN et PAYANTE. Non exécutée en CI.
 *
 *   BLOWY_AI_EVAL_LIVE=yes OPENAI_API_KEY=… OPENAI_TEXT_MODEL=… OPENAI_VISION_MODEL=… \
 *   OPENAI_TRANSCRIPTION_MODEL=… AI_EVAL_BUDGET_CALLS=60 pnpm --filter @blowy/ai eval:live
 *
 * Budget explicite : nombre maximal d'appels (AI_EVAL_BUDGET_CALLS, défaut 0 ⇒ refus).
 * Aucune donnée réelle : uniquement les cas synthétiques de cases.ts. Le rapport ne
 * contient que les ids de cas, actions et codes (pas les textes).
 */
import { AiEnvSchema, createAiProviders } from '../factory.js';
import { ModerationPipeline } from '../pipeline/moderation-pipeline.js';
import { AiRunner, DEFAULT_AI_LIMITS, MemoryAiJournal } from '../runtime/runner.js';
import { TEXT_CASES } from './cases.js';

async function main() {
  if (process.env.BLOWY_AI_EVAL_LIVE !== 'yes') {
    console.error('Refus : définir BLOWY_AI_EVAL_LIVE=yes (évaluation payante, opt-in).');
    process.exit(2);
  }
  const budget = Number(process.env.AI_EVAL_BUDGET_CALLS ?? '0');
  if (!Number.isInteger(budget) || budget <= 0) {
    console.error('Refus : AI_EVAL_BUDGET_CALLS (entier > 0) requis.');
    process.exit(2);
  }
  const env = AiEnvSchema.parse({ ...process.env, AI_PROVIDER: 'openai' });
  const providers = createAiProviders(env, false)!;
  const journal = new MemoryAiJournal();
  const runner = new AiRunner({ journal, limits: { ...DEFAULT_AI_LIMITS, globalCallsPerDay: budget, maxAttempts: 1 }, now: () => new Date(), sleep: (ms) => new Promise((r) => setTimeout(r, ms)) });
  const pipeline = new ModerationPipeline(providers.moderation, runner);
  let pass = 0;
  const rows: string[] = [];
  for (const c of TEXT_CASES) {
    const r = await pipeline.moderateText({ messageRef: c.id, text: c.text, authorId: 'eval', contextId: 'eval', level: c.level ?? 1, window: (c.window ?? []).map((w, i) => ({ ref: `w${i}`, ...w })), recentOwnBodies: c.recentOwnBodies ?? [] });
    const action = r.outcome === 'DECIDED' ? r.decision.action : `UNAVAILABLE:${r.errorCode}`;
    const ok = r.outcome === 'DECIDED' && c.expect.live.includes(r.decision.action);
    if (ok) pass++;
    rows.push(`${ok ? 'OK ' : 'KO '} ${c.id.padEnd(20)} ${c.theme.padEnd(28)} → ${action}`);
    if (r.outcome === 'UNAVAILABLE' && r.errorCode === 'BUDGET_EXCEEDED') break;
  }
  console.warn(rows.join('\n'));
  console.warn(`\n${pass}/${TEXT_CASES.length} conformes ; appels consommés : ${journal.counters.get(`global:${new Date().toISOString().slice(0, 10)}`) ?? 0}/${budget}`);
}

void main();
