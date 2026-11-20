/**
 * Ton chemin (docs/CHEMIN.md), en mémoire : carte, séance du jour, réponses (idempotentes), révélation, série unique,
 * quota et bonus social, personne du jour, profil, formats selon le build, défi du jour retiré des nouvelles apps,
 * rappel du matin, administration du contenu.
 */
import { randomUUID } from 'node:crypto';
import { type ApiClient, createAdminClient, createApiClient } from '@blowy/api-client';
import type { CheminSession } from '@blowy/contract';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { CheminDailyPush } from '../src/modules/chemin/application/chemin-push';
import { SEED_QUESTIONS, SEED_TAGS, SEED_UNITS } from '../src/modules/chemin/seed/catalogue';
import { SEED_TEXTS } from '../src/modules/chemin/seed/build';
import { cheminText } from '@blowy/content';
import { LOCALES } from '@blowy/domain';
import { type TestWorld, apiError, onboardBody, startWorld } from './helpers';

const CHEMIN_BUILD = 60;
const ADMIN = 'ops@minimoa.app';

/** Réponses « premier choix » partout (curseurs à 20) : deux personnes ainsi se rejoignent sur tout. */
const firstChoices = (s: CheminSession) => ({
  sessionId: s.id,
  answers: s.questions.map((q) => (q.format === 'slider' ? { questionId: q.id, value: 20 } : { questionId: q.id, optionId: q.options[0]!.id })),
});

describe('Ton chemin', () => {
  let w: TestWorld;
  const app = (id: string, build = CHEMIN_BUILD, locale?: string): ApiClient =>
    createApiClient({ baseUrl: w.baseUrl, getToken: () => `test:${id}`, getClientInfo: () => ({ platform: 'ios', build }), ...(locale ? { getLocale: () => locale } : {}) });
  const person = async (name: string, build = CHEMIN_BUILD) => {
    const id = randomUUID();
    const api = app(id, build);
    await api.me.onboard(onboardBody({ displayName: name }));
    return { id, api };
  };

  beforeAll(async () => {
    w = await startWorld({ APP_IOS_CHEMIN_BUILD: String(CHEMIN_BUILD), ADMIN_EMAILS: ADMIN });
  });
  afterAll(() => w.close());

  it('le contenu de départ : 6 unités de 2 étapes, 60 questions', () => {
    expect(SEED_UNITS).toHaveLength(6);
    expect(SEED_UNITS.every((u) => u.steps.length === 2 && u.steps.every((s) => s.questions.length === 5))).toBe(true);
    expect(new Set(SEED_QUESTIONS.map((q) => q.id)).size).toBe(60);
  });

  it('chaque langue a chaque texte de départ, avec autant d’options', () => {
    for (const l of LOCALES) {
      const t = SEED_TEXTS[l];
      for (const u of SEED_UNITS) {
        expect(t.units[u.id], `${l} ${u.id}`).toBeDefined();
        for (const s of u.steps) expect(t.steps[s.id], `${l} ${s.id}`).toBeTruthy();
      }
      for (const q of SEED_QUESTIONS) {
        if (q.legacyTestId) {
          expect(t.legacy[q.legacyTestId]?.r, `${l} ${q.id}`).toHaveLength(2);
          continue;
        }
        const qt = t.q[q.id];
        expect(qt?.a, `${l} ${q.id}`).toHaveLength(q.options.length);
        if (q.format === 'slider') expect(qt?.m, `${l} ${q.id}`).toBeTruthy();
        for (const [label, reaction] of qt?.a ?? []) expect(label && reaction, `${l} ${q.id}`).toBeTruthy();
      }
      for (const tag of SEED_TAGS) expect(cheminText.in(l).tags[tag], `${l} ${tag}`).toBeTruthy();
    }
    // Jamais « pet » dans un texte vu par les gens.
    expect(JSON.stringify(SEED_TEXTS)).not.toMatch(/\bpets?\b/i);
  });

  it('la carte : le test de vision passé vaut l’unité 1, série aux gels de Ton chemin', async () => {
    const a = await person('Alma');
    const map = await a.api.chemin.map();
    expect(map.title).toBe('Ton chemin');
    expect(map.units).toHaveLength(6);
    expect(map.units[0]).toMatchObject({ id: 'vision', state: 'done' });
    expect(map.currentStepId).toBe('energie_1');
    expect(map.today).toMatchObject({ state: 'todo', quota: { free: 1, bonus: 0, left: 1, nextSlot: 0 } });
    expect(map.streak).toMatchObject({ current: 0, freezePeriod: 'month', freezesPerPeriod: 1 });
    expect(map.streak.milestones.map((m) => m.days)).toEqual([7, 30, 100, 365]);
  });

  it('séance, réponses, révélation, série, personne du jour, idempotence', async () => {
    const b = await person('Bérénice');
    const a = await person('Abel');
    // Bérénice fait sa séance d'abord : mêmes réponses qu'Abel ensuite.
    const sb = (await b.api.chemin.session()).session!;
    await b.api.chemin.answer(firstChoices(sb));

    const res = await a.api.chemin.session();
    const s = res.session!;
    expect(s).toMatchObject({ slot: 'daily', kind: 'step', step: { id: 'energie_1', unitTitle: 'Ton énergie' }, done: false });
    expect(s.questions).toHaveLength(5);
    expect(s.questions.map((q) => q.id)).toEqual(['energie_batterie', 'energie_samedi', 'energie_soiree', 'energie_pluie', 'energie_semaine']);
    const slider = s.questions[0]!;
    expect(slider).toMatchObject({ format: 'slider', slider: { min: 0, max: 100, start: 50 } });
    expect(slider.slider?.reactions.mid.text).toBe('Un peu des deux : le bon dosage.');
    expect(s.questions[1]!.options[0]).toMatchObject({ label: 'Café lent à la fenêtre, rien d’autre', reaction: { text: 'Le luxe absolu : ne rien faire.' } });
    // Même séance tant qu'elle n'est pas finie.
    expect((await a.api.chemin.session()).session!.id).toBe(s.id);

    // Réponses incomplètes ou fausses : refusées.
    expect((await apiError(a.api.chemin.answer({ sessionId: s.id, answers: [{ questionId: 'energie_samedi', optionId: 'a' }] }))).code).toBe('invalid');
    const wrong = firstChoices(s);
    wrong.answers[1] = { questionId: 'energie_samedi', optionId: 'zz' };
    expect((await apiError(a.api.chemin.answer(wrong))).code).toBe('invalid');
    expect((await apiError(b.api.chemin.answer(firstChoices(s)))).code).toBe('not_found');

    const r = await a.api.chemin.answer(firstChoices(s));
    // Étincelles : 10 pour la séance, puis vitesse (horloge de test : réponse instantanée, donc trop vite) et cohérence.
    expect(r.sparks?.done).toBe(10);
    expect(r.sparks?.speed).toBe(0);
    expect(r.sparks?.total).toBeGreaterThanOrEqual(10);
    expect(r.sparks?.total).toBeLessThanOrEqual(25);
    expect(r.alreadyRecorded).toBe(false);
    expect(r.revelation).toMatchObject({ title: 'Ce que Nino a appris', axis: 'rythme' });
    // Rythme : −60, −60, +70 → entre les deux.
    expect(r.revelation.text).toBe('Toi, tu passes du canapé à la fête sans forcer.');
    expect(r.progress).toMatchObject({ stepId: 'energie_1', stepDone: true, unitDone: false, next: { stepId: 'energie_2' }, stepsDone: 3, stepsTotal: 12 });
    expect(r.streak).toMatchObject({ current: 1, doneToday: true });
    expect(r.quota).toMatchObject({ used: 1, left: 0, nextSlot: null });
    expect(r.person?.suggestion.user.id).toBe(b.id);
    expect(r.person?.title).toBe('Ta personne du jour');
    expect(r.person?.together.title).toBe('Vous deux :');
    expect(r.person?.together.points).toContain('le goût du calme');
    expect(r.person?.opener).toEqual({ text: 'Demande-lui comment elle ou il recharge ses batteries.', questionId: 'energie_batterie' });
    expect(r.empty).toBeNull();

    // Rejouer : même résultat, rien de compté deux fois.
    const again = await a.api.chemin.answer(firstChoices(s));
    expect(again).toMatchObject({ sessionId: s.id, alreadyRecorded: true, streak: { current: 1 } });
    const after = await a.api.chemin.session();
    expect(after).toMatchObject({ session: null, reason: 'quota_used' });
    expect(after.message).toContain('demain');

    // Le lendemain : l'étape suivante, la série continue.
    w.clock.advanceDays(1);
    const next = (await a.api.chemin.session()).session!;
    expect(next.step?.id).toBe('energie_2');
    const r2 = await a.api.chemin.answer(firstChoices(next));
    expect(r2.streak.current).toBe(2);
  });

  it('personne près de soi : un état honnête', async () => {
    const lone = randomUUID();
    const api = app(lone);
    await api.me.onboard(onboardBody({ displayName: 'Solal', location: { latitude: -45.87, longitude: 170.5 } }));
    const s = (await api.chemin.session()).session!;
    const r = await api.chemin.answer(firstChoices(s));
    expect(r.person).toBeNull();
    expect(r.empty).toMatchObject({ reason: 'first_here', title: 'Tu es parmi les premiers ici' });
  });

  it('une séance bonus se gagne en répondant à un bonjour', async () => {
    const c = await person('Cyprien');
    const d = await person('Daphné');
    const s = (await c.api.chemin.session()).session!;
    await c.api.chemin.answer(firstChoices(s));
    expect((await c.api.chemin.session()).reason).toBe('quota_used');
    await d.api.encounters.list();
    await d.api.encounters.wave(c.id);
    const incoming = (await c.api.encounters.list()).incoming.find((i) => i.from.id === d.id)!;
    await c.api.encounters.accept(incoming.id);
    const bonus = await c.api.chemin.session();
    expect(bonus.quota).toMatchObject({ bonus: 1, bonusReason: 'wave_answered', left: 1, nextSlot: 1, bonusHint: null });
    expect(bonus.session).toMatchObject({ slot: 'bonus', intro: 'Séance bonus ! Merci d’avoir fait venir du monde.' });
    await c.api.chemin.answer(firstChoices(bonus.session!));
    const map = await c.api.chemin.map();
    expect(map.today).toMatchObject({ state: 'all_done', quota: { used: 2, left: 0 } });
    expect(map.streak.current).toBe(1);
  });

  it('formats selon l’app : sans curseur déclaré, pas de curseur', async () => {
    const e = await person('Élie');
    const s = (await e.api.chemin.session(['choice'])).session!;
    expect(s.questions.every((q) => q.format === 'choice')).toBe(true);
    expect(s.questions.map((q) => q.id)).toEqual(['energie_samedi', 'energie_soiree', 'energie_pluie']);
  });

  it('textes dans la langue de l’app', async () => {
    const id = randomUUID();
    await app(id).me.onboard(onboardBody({ displayName: 'Ann', locale: 'en' }));
    const s = (await app(id, CHEMIN_BUILD, 'en').chemin.session()).session!;
    expect(s.step?.unitTitle).toBe('Your energy');
    expect(s.questions[1]!.text).toBe('Saturday morning, no plans.');
  });

  it('profil : jauges, « il te connaît », type, rapport détaillé réservé à Minimoa+', async () => {
    const f = await person('Fanny');
    const p = await f.api.chemin.profil();
    expect(p.title).toBe('Ce que Nino sait de toi');
    expect(p.gauges).toHaveLength(5);
    expect(['little', 'well', 'very_well']).toContain(p.knows.level);
    expect(p.type === null ? p.typeHint : p.type.name).toBeTruthy();
    expect(p).toMatchObject({ detail: null, detailLocked: true, answers: 0 });
  });

  it('le défi du jour n’est plus proposé aux apps qui ont Ton chemin', async () => {
    const g = await person('Gaspard');
    w.clock.advanceDays(1); // pas le jour de l'inscription
    const today = await g.api.rituals.today();
    expect(today.challengeRetired).toBe(true);
    expect(today.challenge.present).toBe(false);
    const old = await person('Hugo', 41);
    const oldToday = await old.api.rituals.today();
    expect(oldToday.challengeRetired).toBe(false);
  });

  it('rappel du matin : la séance pour les apps qui l’ont, le défi pour les autres', async () => {
    const push = w.app.get(CheminDailyPush);
    const i = await person('Iris');
    const j = await person('Jade', 41);
    await i.api.chemin.map();
    w.clock.advanceDays(1);
    await i.api.chemin.map();
    await j.api.rituals.today();
    const now = w.clock.now();
    expect(await push.morning(i.id, now)).toEqual({ step: 'chemin', minimoa: 'Nino' });
    expect((await push.morning(j.id, now))?.step).toBeUndefined();
    const s = (await i.api.chemin.session()).session!;
    await i.api.chemin.answer(firstChoices(s));
    expect(await push.morning(i.id, now)).toBeNull();
  });

  it('administration : une question créée en brouillon, publiée, arrive dans le parcours', async () => {
    const admin = createAdminClient({ baseUrl: w.baseUrl, getToken: () => `test:${randomUUID()}:${ADMIN}` });
    const all = await admin.chemin();
    expect(all.questions).toHaveLength(60);
    expect(all.questions.every((q) => q.status === 'live' && q.warnings.every((x) => x.startsWith('Pas encore traduit')))).toBe(true);
    expect(all.stats.sessionsToday).toBeGreaterThanOrEqual(0);

    await admin.createCheminUnit({
      id: 'bonus_test',
      position: 99,
      icon: '🧪',
      minBuild: 0,
      texts: { fr: { title: 'Essai', subtitle: 'Une unité d’essai.' } },
      steps: [{ id: 'bonus_test_1', position: 0, texts: { fr: { title: 'Essai 1' } } }],
    });
    const body = {
      id: 'essai_politique',
      stepId: 'bonus_test_1',
      position: 0,
      format: 'choice' as const,
      axis: 'rythme' as const,
      direction: 1 as const,
      minBuild: 0,
      legacyTestId: null,
      texts: { fr: { text: 'Tu votes pour quel parti politique ?', opener: 'Demande-lui.' } },
      options: [
        { id: 'a', icon: '🅰️', weight: -50, tag: null, animation: null, reactionMinBuild: 0, texts: { fr: { label: 'A', reaction: 'Ah.' } } },
        { id: 'b', icon: '🅱️', weight: 50, tag: null, animation: null, reactionMinBuild: 0, texts: { fr: { label: 'B', reaction: 'Bé.' } } },
      ],
    };
    const created = await admin.createCheminQuestion(body);
    expect(created.status).toBe('draft');
    expect(created.warnings.some((x) => x.startsWith('Sujet interdit'))).toBe(true);
    expect((await apiError(admin.setCheminQuestionStatus('essai_politique', 'live'))).code).toBe('invalid');
    await admin.updateCheminQuestion('essai_politique', { ...body, texts: { fr: { text: 'Plutôt thé ou café ?', opener: 'Demande-lui son café préféré.' } } });
    expect((await admin.setCheminQuestionStatus('essai_politique', 'reviewed')).status).toBe('reviewed');
    await admin.setCheminQuestionStatus('essai_politique', 'live');
    await admin.setCheminUnitStatus('bonus_test', 'live');
    const k = await person('Kim');
    const map = await k.api.chemin.map();
    expect(map.units.at(-1)).toMatchObject({ id: 'bonus_test', title: 'Essai', steps: [{ id: 'bonus_test_1', state: 'locked' }] });

    // Un brouillon ne part jamais dans l'app.
    await admin.setCheminQuestionStatus('essai_politique', 'draft');
    expect((await k.api.chemin.map()).units.some((u) => u.id === 'bonus_test')).toBe(false);
    // Réservé à l'équipe.
    const outsider = createAdminClient({ baseUrl: w.baseUrl, getToken: () => `test:${randomUUID()}:x@y.z` });
    expect((await apiError(outsider.chemin())).code).toBe('forbidden');
  });
});
