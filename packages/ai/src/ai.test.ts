import { describe, expect, it, vi } from 'vitest';
import { AiError } from './errors.js';
import { TEXT_CASES, TRANSCRIPT_CASES, VISION_CASES } from './eval/cases.js';
import { LocalContentModerationProvider, LocalMissionVisionProvider, LocalSignalProvider, LocalSuggestionProvider, LocalTranscriptionProvider, editorialSuggestions } from './local/local-adapters.js';
import { synthWav, parseWav } from './local/audio.js';
import { createOpenAiProviders, interpretStructured, classifyTranscript } from './openai/openai-adapters.js';
import { ModerationPipeline } from './pipeline/moderation-pipeline.js';
import { POLICY_VERSION, decideImage, decideTranscriptGate } from './policy.js';
import { AiRunner, DEFAULT_AI_LIMITS, MemoryAiJournal } from './runtime/runner.js';
import { MissionAssessmentSchema, SUGGESTION_MAX_CHARS } from './schemas.js';
import { AiEnvSchema, createAiProviders } from './factory.js';
import { UNSET_PRICES } from './cost.js';

const runner = (j = new MemoryAiJournal(), limits = {}) => new AiRunner({ journal: j, limits: { ...DEFAULT_AI_LIMITS, backoffBaseMs: 1, ...limits }, now: () => new Date('2026-11-02T10:00:00Z'), sleep: async () => undefined });

describe('évaluations synthétiques FR — adaptateur local (déterministe)', () => {
  for (const c of TEXT_CASES) {
    it(`${c.theme} · ${c.id}`, async () => {
      const prov = new LocalContentModerationProvider(false);
      const spy = vi.spyOn(prov, 'classifyText');
      const p = new ModerationPipeline(prov, runner());
      const r = await p.moderateText({ messageRef: c.id, text: c.text, authorId: 'u', contextId: 'c', level: c.level ?? 1, window: (c.window ?? []).map((w, i) => ({ ref: `w${i}`, ...w })), recentOwnBodies: c.recentOwnBodies ?? [] });
      expect(r.outcome).toBe('DECIDED');
      if (r.outcome !== 'DECIDED') return;
      expect(r.decision.action).toBe(c.expect.local);
      expect(r.decision.policyVersion).toBe(POLICY_VERSION);
      if (c.expect.distress) expect(r.decision.distress).toBe(true);
      if (c.expect.restricted) expect(r.decision.restricted).toBe(true);
      if (c.expect.noProviderCall) expect(spy).not.toHaveBeenCalled();
      // La détresse n'est jamais sanctionnée.
      if (c.expect.distress) expect(['REJECT', 'QUARANTINE']).not.toContain(r.decision.action);
    });
  }

  it('injection : la sortie ne contient aucun outil, destinataire ni règle modifiés', async () => {
    const r = await new ModerationPipeline(new LocalContentModerationProvider(false), runner()).moderateText({ messageRef: 'x', text: TEXT_CASES.find((c) => c.id === 'injection-2')!.text, authorId: 'u', contextId: 'c', level: 1, window: [], recentOwnBodies: [] });
    expect(r.outcome === 'DECIDED' && Object.keys(r.decision).sort()).toEqual(['action', 'caseRequired', 'distress', 'policyVersion', 'priority', 'reasonCode', 'restricted', 'signals']);
  });

  for (const v of VISION_CASES) {
    it(`vision · ${v.theme}`, async () => {
      const r = await new LocalMissionVisionProvider(false).assess({ missionKey: v.missionKey, criteria: ['critère'], image: { bytes: new Uint8Array([1]), mime: 'image/jpeg', width: v.width, height: v.height } });
      expect(MissionAssessmentSchema.parse(r.value).status).toBe(v.expectLocal);
      if (v.expectLocal === 'uncertain') expect(r.value.requiresReview).toBe(true);
    });
  }

  for (const t of TRANSCRIPT_CASES) {
    it(`voix · ${t.theme}`, async () => {
      const bytes = synthWav({ sampleRate: t.sampleRate, durationMs: 500, amplitude: t.amplitude });
      expect(parseWav(bytes)?.durationMs).toBe(500);
      const r = await new LocalTranscriptionProvider(false).transcribe({ bytes, mime: 'audio/wav', durationMs: 500 });
      expect(r.value.quality).toBe(t.expectLocal);
      expect(decideTranscriptGate(r.value.quality)?.action ?? 'PASS').toBe(t.expectLocal === 'OK' ? 'PASS' : 'HUMAN_REVIEW');
    });
  }

  it('suggestions locales : ≤ 3, ≤ 160 car., souvenirs réels seulement', async () => {
    const r = await new LocalSuggestionProvider(false).suggest({ messages: [], publicVision: [], memories: [{ id: 'm1', label: 'la partie au parc' }], dailyMission: 'Bien manger', level: 2, branch: 'UNDECIDED' });
    expect(r.value.length).toBeLessThanOrEqual(3);
    for (const s of r.value) {
      expect(s.text.length).toBeLessThanOrEqual(SUGGESTION_MAX_CHARS);
      for (const ref of s.memoryRefs) expect(ref).toBe('m1');
    }
    expect(editorialSuggestions({ memories: [], dailyMission: null }).every((s) => s.memoryRefs.length === 0)).toBe(true);
  });

  it('signaux : changement de relation en cours — evidence fictive repérable', async () => {
    const r = await new LocalSignalProvider(false).analyze({ events: [{ id: 'e1', speaker: 'A', text: 'haha trop bien [bogus-evidence]' }] });
    expect(r.value.evidenceEventIds).toContain('00000000-0000-7000-8000-000000000000');
  });

  it('image : catégories texte seules non évaluées ⇒ prudence (sexuel faible → revue)', () => {
    expect(decideImage({ flagged: false, scores: { sexual: 0.35 }, evaluated: ['sexual'], modality: 'image' }, 'PROFILE_PHOTO').action).toBe('HUMAN_REVIEW');
    expect(decideImage(null, 'PROFILE_PHOTO').action).toBe('HUMAN_REVIEW');
  });
});

describe('runner : panne ≠ approbation', () => {
  it('timeout de tâche → UNAVAILABLE, borné en tentatives', async () => {
    const j = new MemoryAiJournal();
    const prov = new LocalContentModerationProvider(false);
    const call = vi.spyOn(prov, 'classifyText').mockImplementation(() => new Promise(() => undefined));
    const p = new ModerationPipeline(prov, runner(j, { timeoutMs: 5, maxAttempts: 2 }));
    const r = await p.moderateText({ messageRef: 'm', text: 'bonjour', authorId: 'u', contextId: 'c', level: 1, window: [], recentOwnBodies: [] });
    expect(r).toMatchObject({ outcome: 'UNAVAILABLE', errorCode: 'TIMEOUT' });
    expect(call).toHaveBeenCalledTimes(2);
  });
  it('refus / format invalide : aucune nouvelle tentative, jamais approuvé', async () => {
    for (const m of ['[refuse]', '[invalid]']) {
      const r = await new ModerationPipeline(new LocalContentModerationProvider(false), runner()).moderateText({ messageRef: m, text: `x ${m}`, authorId: 'u', contextId: 'c', level: 1, window: [], recentOwnBodies: [] });
      expect(r.outcome).toBe('UNAVAILABLE');
    }
  });
  it('circuit breaker ouvert après N échecs', async () => {
    const r = runner(new MemoryAiJournal(), { breakerThreshold: 2, maxAttempts: 1 });
    const task = (i: number) => r.run({ kind: 'k', provider: 'p', promptVersion: 'v', subject: { type: 'S', id: `${i}` }, userId: null, contextId: null, contentHash: `${i}`, accessScope: 'a', cacheTtlMs: 0, call: async () => { throw new AiError('PROVIDER_ERROR', 'x'); }, validate: (v) => v });
    await expect(task(1)).rejects.toMatchObject({ code: 'PROVIDER_ERROR' });
    await expect(task(2)).rejects.toMatchObject({ code: 'PROVIDER_ERROR' });
    await expect(task(3)).rejects.toMatchObject({ code: 'CIRCUIT_OPEN' });
  });
  it('plafond utilisateur/jour et cache par hash', async () => {
    const j = new MemoryAiJournal();
    const r = runner(j, { perUserPerDay: 1 });
    const call = vi.fn(async () => ({ value: 1, usage: { provider: 'p', model: 'm', promptVersion: 'v', durationMs: 0, inputTokens: 1, outputTokens: 1, costMicros: 0, priceTableVersion: 'x' } }));
    const t = (h: string) => r.run({ kind: 'k', provider: 'p', promptVersion: 'v', subject: { type: 'S', id: 's' }, userId: 'u', contextId: null, contentHash: h, accessScope: 'a', cacheTtlMs: 60_000, call, validate: (v) => v as number });
    expect((await t('h1')).cached).toBe(false);
    expect((await t('h1')).cached).toBe(true);
    await expect(t('h2')).rejects.toMatchObject({ code: 'BUDGET_EXCEEDED' });
    expect(call).toHaveBeenCalledTimes(1);
  });
  it('résultat tardif après annulation (blocage pendant l’appel) : jeté, jamais mis en cache', async () => {
    const j = new MemoryAiJournal();
    const { jobKeyOf } = await import('./runtime/runner.js');
    const key = jobKeyOf('k', 'v', 'late', 'a|u:u|c:c');
    const r = runner(j);
    const call = vi.fn(async () => {
      j.cancelledDuringRun.add(key);
      return { value: 1, usage: { provider: 'p', model: 'm', promptVersion: 'v', durationMs: 0, inputTokens: 0, outputTokens: 0, costMicros: 0, priceTableVersion: 'x' } };
    });
    await expect(r.run({ kind: 'k', provider: 'p', promptVersion: 'v', subject: { type: 'S', id: 's' }, userId: 'u', contextId: 'c', contentHash: 'late', accessScope: 'a', cacheTtlMs: 60_000, call, validate: (v) => v })).rejects.toMatchObject({ code: 'CANCELLED' });
    expect(await j.cached(key, new Date())).toBeNull();
    expect(call).toHaveBeenCalledTimes(1);
  });

  it('tâche annulée (retrait de consentement) : jamais exécutée', async () => {
    const j = new MemoryAiJournal();
    const call = vi.fn();
    const r = runner(j);
    const spec = { kind: 'k', provider: 'p', promptVersion: 'v', subject: { type: 'S', id: 's' }, userId: 'u', contextId: null, contentHash: 'h', accessScope: 'a', cacheTtlMs: 0, call, validate: (v: unknown) => v };
    const { jobKeyOf } = await import('./runtime/runner.js');
    j.cancelled.add(jobKeyOf('k', 'v', 'h', 'a|u:u|c:-'));
    await expect(r.run(spec)).rejects.toMatchObject({ code: 'CANCELLED' });
    expect(call).not.toHaveBeenCalled();
  });
});

describe('adaptateurs OpenAI — tests de contrat (HTTP mocké, aucun appel réel)', () => {
  type Req = { url: string; body: unknown; headers: Record<string, string> };
  const mockFetch = (responder: (r: Req) => unknown, status = 200) => {
    const calls: Req[] = [];
    const f = (async (url: string, init: RequestInit) => {
      const headers = Object.fromEntries(new Headers(init.headers).entries());
      const body = typeof init.body === 'string' ? JSON.parse(init.body) : init.body;
      const req = { url: String(url), body, headers };
      calls.push(req);
      return new Response(JSON.stringify(responder(req)), { status, headers: { 'content-type': 'application/json' } });
    }) as unknown as typeof fetch;
    return { f, calls };
  };
  const cfg = (f: typeof fetch) => ({ apiKey: 'sk-test', moderationModel: 'omni-moderation-latest', textModel: 'text-model-x', visionModel: 'vision-model-x', transcriptionModel: 'transcribe-model-x', timeoutMs: 5000, prices: UNSET_PRICES, fetch: f, baseURL: 'https://api.test.invalid/v1' });

  it('modération : requête multimodale, modalités évaluées respectées', async () => {
    const { f, calls } = mockFetch(() => ({ id: 'modr', model: 'omni-moderation-latest', results: [{ flagged: false, categories: {}, category_scores: { harassment: 0.1, sexual: 0.02 }, category_applied_input_types: { harassment: ['text'], sexual: ['text', 'image'] } }] }));
    const p = createOpenAiProviders(cfg(f));
    const r = await p.moderation.classifyImage({ bytes: new Uint8Array([1, 2]), mime: 'image/png' });
    expect(calls[0]!.url).toMatch(/\/moderations$/);
    expect(calls[0]!.body).toMatchObject({ model: 'omni-moderation-latest', input: [{ type: 'image_url', image_url: { url: expect.stringMatching(/^data:image\/png;base64,/) } }] });
    expect(calls[0]!.headers.authorization).toBe('Bearer sk-test');
    expect(r.value.evaluated).toEqual(['sexual']);
  });

  it('Responses : store:false, json_schema strict, sortie revalidée', async () => {
    const out = { status: 'uncertain', visibleEvidence: [], missingEvidence: ['légume'], qualityIssues: ['flou'], confidenceSignal: 0.3, requiresReview: true, reasonCode: 'UNREADABLE' };
    const { f, calls } = mockFetch(() => ({ id: 'resp', object: 'response', status: 'completed', output: [{ type: 'message', id: 'm', role: 'assistant', status: 'completed', content: [{ type: 'output_text', text: JSON.stringify(out), annotations: [] }] }], usage: { input_tokens: 10, output_tokens: 5, total_tokens: 15 } }));
    const p = createOpenAiProviders(cfg(f));
    const r = await p.vision.assess({ missionKey: 'healthy_meal', criteria: ['légume'], image: { bytes: new Uint8Array([1]), mime: 'image/jpeg' } });
    const body = calls[0]!.body as { store: boolean; text: { format: { type: string; strict: boolean } }; input: { content: { type: string }[] }[]; model: string };
    expect(calls[0]!.url).toMatch(/\/responses$/);
    expect(body.store).toBe(false);
    expect(body.model).toBe('vision-model-x');
    expect(body.text.format).toMatchObject({ type: 'json_schema', strict: true });
    expect(body.input[0]!.content.map((c) => c.type)).toEqual(['input_text', 'input_image']);
    expect(r.value).toEqual(out);
    expect(r.usage).toMatchObject({ inputTokens: 10, outputTokens: 5, model: 'vision-model-x' });
  });

  it('Responses : refus, incomplet, format invalide → AiError (jamais une valeur)', () => {
    expect(() => interpretStructured({ status: 'completed', output: [{ type: 'message', content: [{ type: 'refusal' }] }] }, MissionAssessmentSchema)).toThrow(expect.objectContaining({ code: 'REFUSED' }));
    expect(() => interpretStructured({ status: 'incomplete', incomplete_details: { reason: 'max_output_tokens' } }, MissionAssessmentSchema)).toThrow(expect.objectContaining({ code: 'INCOMPLETE' }));
    expect(() => interpretStructured({ status: 'completed', output_parsed: { status: 'ok' } }, MissionAssessmentSchema)).toThrow(expect.objectContaining({ code: 'INVALID_FORMAT' }));
  });

  it('erreur HTTP 429 / 500 → AiError retryable', async () => {
    const { f } = mockFetch(() => ({ error: { message: 'rate' } }), 429);
    await expect(createOpenAiProviders(cfg(f)).moderation.classifyText('x')).rejects.toMatchObject({ code: 'RATE_LIMITED', retryable: true });
  });

  it('transcription : langue indéterminée → UNCERTAIN', async () => {
    const { f, calls } = mockFetch(() => ({ text: 'euh', languages: [] }));
    const r = await createOpenAiProviders(cfg(f)).transcription.transcribe({ bytes: synthWav({ sampleRate: 16000, durationMs: 100, amplitude: 1000 }), mime: 'audio/wav', durationMs: 100 });
    expect(calls[0]!.url).toMatch(/\/audio\/transcriptions$/);
    expect(r.value.quality).toBe('UNCERTAIN');
    expect(classifyTranscript({ text: 'bonjour à toi', languages: ['fr'], confidence: null })).toBe('OK');
    expect(classifyTranscript({ text: '[musique]', languages: ['fr'], confidence: null })).toBe('NON_VERBAL');
  });

  it('factory : production refuse local ; openai exige clé et modèles', () => {
    expect(() => createAiProviders(AiEnvSchema.parse({ AI_PROVIDER: 'local' }), true)).toThrow(/production/);
    expect(() => createAiProviders(AiEnvSchema.parse({ AI_PROVIDER: 'openai' }), true)).toThrow(/OPENAI_API_KEY/);
    expect(createAiProviders(AiEnvSchema.parse({ AI_PROVIDER: 'none' }), true)).toBeNull();
  });
});
