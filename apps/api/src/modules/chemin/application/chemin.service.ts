import { Inject, Injectable } from '@nestjs/common';
import { cheminText, notificationTexts } from '@blowy/content';
import type {
  CheminMap,
  CheminQuestion as CheminQuestionDto,
  CheminQuota,
  CheminResult,
  CheminSession,
  CheminSessionResponse,
  CheminStreak,
  CheminAnswersBody,
} from '@blowy/contract';
import {
  type BonusReason,
  type CheminAnswerInput,
  type CheminFormat,
  type CheminQuestion,
  CHEMIN_FORMATS,
  type ClientCapabilities,
  type Day,
  type Locale,
  type StreakRule,
  type VisionProfile,
  type VisionSignal,
  answerValue,
  cheminMap,
  cheminQuota,
  dayOf,
  deliverableAnimation,
  isMatchable,
  knowsLevelOf,
  pickPersonOfDay,
  pickSession,
  revelationOf,
  sessionSparks,
  streakRulesOf,
  streakReward,
  streakAtRisk,
  jokersLeft,
  nextStreakMilestone,
  streakWeek,
  weekStartOf,
  type Species,
} from '@blowy/domain';
import type { Clock } from '../../../shared/clock';
import type { ClientAppInfo } from '../../../shared/client-app';
import { DomainError } from '../../../shared/errors';
import type { Ids } from '../../../shared/ids';
import { seedOf } from '../../../shared/seed';
import type { Env } from '../../../config/env';
import { CLOCK, ENCOUNTERS, ENV, IDS, PETS, PROFILES } from '../../../shared/tokens';
import type { EncountersRepository } from '../../encounters/ports';
import { ListEncounters } from '../../encounters/application/list-encounters.usecase';
import { toEncountersDto } from '../../encounters/interface/encounters.presenter';
import { ACQUISITIONS, type AcquisitionsRepository } from '../../growth/ports';
import { hasPlus } from '../../me/application/plus';
import type { Profile, ProfilesRepository } from '../../me/ports';
import type { PetsRepository } from '../../pets/ports';
import type {
  DailyChallengesRepository,
  RitualStateRecord,
  RitualStatesRepository,
} from '../../rituels/ports';
import { DAILY_CHALLENGES, RITUAL_STATES } from '../../rituels/tokens';
import { RitualsContext } from '../../rituels/application/rituals-context';
import { StreakService } from '../../rituels/application/streak.service';
import { VisionRecorder } from '../../vision/application/vision-recorder';
import type { PlacesRepository } from '../../vision/ports';
import { PLACES } from '../../vision/tokens';
import {
  type CheminAnswerRecord,
  type CheminAnswersRepository,
  type CheminProgressPatch,
  type CheminProgressRecord,
  type CheminProgressRepository,
  type CheminSessionRecord,
  type CheminSessionsRepository,
  type ContentQuestion,
  type ContentScene,
  inLocale,
} from '../ports';
import { CHEMIN_ANSWERS, CHEMIN_PROGRESS, CHEMIN_SESSIONS } from '../tokens';
import { CheminContentService, type LiveContent, toDomainQuestion } from './chemin-content';

const sessionError = (l: Locale): string => cheminText.in(l).errors.session;
const answersError = (l: Locale): string => cheminText.in(l).errors.answers;

/** Formats déclarés par l'app (`?formats=choice,slider`), inconnus ignorés ; null : rien de déclaré. */
export function parseFormats(raw: string | undefined): CheminFormat[] | null {
  if (!raw) return null;
  const list = raw
    .split(',')
    .map((f) => f.trim())
    .filter((f): f is CheminFormat => (CHEMIN_FORMATS as readonly string[]).includes(f));
  return list.length > 0 ? list : null;
}

interface Entered {
  profile: Profile;
  progress: CheminProgressRecord;
  state: RitualStateRecord;
  now: Date;
  today: Day;
  minimoa: string;
  /** Espèce du minimoa (null : pas encore de minimoa). */
  species: Species | null;
}

/**
 * Ton chemin (docs/CHEMIN.md) : la carte, la séance du jour, les réponses. Les règles sont dans `@blowy/domain`
 * (`chemin/`), le contenu dans la base (`CheminContentService`). Chaque réponse nourrit la vision (source `daily`,
 * comme la question du jour) : l'appariement s'améliore sans changer.
 */
@Injectable()
export class CheminService {
  constructor(
    @Inject(PROFILES) private readonly profiles: ProfilesRepository,
    @Inject(PETS) private readonly pets: PetsRepository,
    @Inject(CLOCK) private readonly clock: Clock,
    @Inject(IDS) private readonly ids: Ids,
    @Inject(CHEMIN_PROGRESS) private readonly progressRepo: CheminProgressRepository,
    @Inject(CHEMIN_SESSIONS) private readonly sessions: CheminSessionsRepository,
    @Inject(CHEMIN_ANSWERS) private readonly answers: CheminAnswersRepository,
    @Inject(CheminContentService) private readonly content: CheminContentService,
    @Inject(VisionRecorder) private readonly vision: VisionRecorder,
    @Inject(RitualsContext) private readonly rituals: RitualsContext,
    @Inject(StreakService) private readonly streaks: StreakService,
    @Inject(RITUAL_STATES) private readonly states: RitualStatesRepository,
    @Inject(DAILY_CHALLENGES) private readonly daily: DailyChallengesRepository,
    @Inject(ENCOUNTERS) private readonly encounters: EncountersRepository,
    @Inject(ACQUISITIONS) private readonly acquisitions: AcquisitionsRepository,
    @Inject(PLACES) private readonly places: PlacesRepository,
    @Inject(ListEncounters) private readonly listEncounters: ListEncounters,
    @Inject(ENV) private readonly env: Env,
  ) {}

  // ── Entrée : avancement, bonus du jour, règles de la série ─────────────────
  private async enter(userId: string, client: ClientAppInfo): Promise<Entered> {
    const profile = await this.profiles.findById(userId);
    if (!profile) throw new DomainError('not_onboarded');
    const now = this.clock.now();
    const today = dayOf(now);
    const at = now.toISOString();
    const existing = await this.progressRepo.find(userId);
    const patch: CheminProgressPatch = {};
    if (
      client.build !== null &&
      (client.build !== existing?.lastBuild || client.platform !== existing?.lastPlatform)
    ) {
      patch.lastBuild = client.build;
      patch.lastPlatform = client.platform;
    }
    if (existing?.bonusOn !== today) {
      const referrals = await this.acquisitions.countReferredBy(userId);
      let reason: BonusReason | null = null;
      // Un pote invité qui s'inscrit (depuis la dernière visite) ; la première fois, on prend la mesure sans bonus.
      if (existing && referrals > existing.referralsSeen) reason = 'invite_signup';
      if (referrals !== existing?.referralsSeen) patch.referralsSeen = referrals;
      if (!reason && (await this.answeredWaveOn(userId, today))) reason = 'wave_answered';
      if (reason) {
        patch.bonusOn = today;
        patch.bonusReason = reason;
      }
    }
    const progress =
      !existing || Object.keys(patch).length > 0
        ? await this.progressRepo.upsert(userId, patch, at)
        : existing;
    // Une seule série : à la première ouverture de Ton chemin, elle passe aux gels de Ton chemin.
    let state = await this.rituals.state(userId);
    const statePatch: Partial<RitualStateRecord> = {};
    if (state.streakRules !== 'chemin') statePatch.streakRules = 'chemin';
    if (state.lastSeenOn !== today) statePatch.lastSeenOn = today;
    if (Object.keys(statePatch).length > 0) {
      await this.states.upsert(userId, statePatch);
      state = { ...state, ...statePatch };
    }
    const pet = await this.pets.findByOwner(userId);
    return {
      profile,
      progress,
      state,
      now,
      today,
      minimoa: pet?.name ?? notificationTexts.in(profile.locale).yourMinimoa,
      species: pet?.species ?? null,
    };
  }

  /** Une réponse à un bonjour reçu aujourd'hui (signe accepté) fait gagner la séance bonus. */
  private async answeredWaveOn(userId: string, today: Day): Promise<boolean> {
    const all = await this.encounters.listInvolving(userId);
    return all.some(
      (e) => e.toUser === userId && e.status === 'accepted' && dayOf(new Date(e.statusAt)) === today,
    );
  }

  private async quota(
    userId: string,
    e: Pick<Entered, 'progress' | 'today' | 'profile' | 'now'>,
    locale: Locale,
  ): Promise<{ quota: CheminQuota; today: CheminSessionRecord[] }> {
    const today = await this.sessions.listForDay(userId, e.today);
    void locale;
    const q = cheminQuota({
      doneToday: today.filter((s) => s.status === 'done').length,
      bonusReason: null,
      plus: hasPlus(e.profile, e.now),
    });
    return { quota: { ...q, bonusHint: null }, today };
  }

  // ── Série ──────────────────────────────────────────────────────────────────
  async streakDto(
    userId: string,
    profile: Profile,
    state: RitualStateRecord,
    today: Day,
  ): Promise<CheminStreak> {
    const rule: StreakRule = this.rituals.streakRuleOf(profile, state);
    const rules = streakRulesOf(rule);
    const settled = await this.streaks.settled(state, today, rule);
    const from = weekStartOf(today);
    const [chemin, daily] = await Promise.all([
      this.sessions.doneDays(userId, from, today),
      this.daily.listBetween(userId, from, today),
    ]);
    const done = new Set<Day>([...chemin, ...daily.filter((d) => d.status === 'done').map((d) => d.day)]);
    return {
      current: settled.current,
      best: settled.best,
      doneToday: settled.lastDoneOn === today,
      atRisk: streakAtRisk(settled, today),
      freezesLeft: jokersLeft(settled, today, rule),
      freezesPerPeriod: rules.perPeriod,
      freezePeriod: rules.period,
      milestones: rules.milestones.map((days) => ({
        days,
        itemId: streakReward(days),
        reached: settled.best >= days,
      })),
      nextMilestone: nextStreakMilestone(settled.current, settled.best, rules.milestones),
      week: streakWeek(settled, today, done, dayOf(new Date(profile.createdAt))),
    };
  }

  private knows(profile: VisionProfile, locale: Locale) {
    const k = knowsLevelOf(profile);
    return { level: k.level, label: cheminText.in(locale).knows[k.level], percent: k.percent };
  }

  // ── Carte ──────────────────────────────────────────────────────────────────
  async map(userId: string, locale: Locale, client: ClientAppInfo): Promise<CheminMap> {
    const e = await this.enter(userId, client);
    const [live, snapshot, { quota }] = await Promise.all([
      this.content.live(),
      this.vision.current(userId),
      this.quota(userId, e, locale),
    ]);
    const caps: ClientCapabilities = { build: client.build, formats: null };
    const m = cheminMap(
      live.catalogue,
      { completedSteps: new Set(e.progress.completedSteps), testDone: snapshot.testDone },
      caps,
    );
    const t = cheminText.in(locale);
    const state =
      quota.used === 0 ? 'todo' : quota.left > 0 ? 'bonus' : quota.bonus > 0 ? 'all_done' : 'done';
    return {
      title: t.map.title,
      units: m.units.map((u) => {
        const unit = live.units.get(u.id);
        const texts = unit ? inLocale(unit.texts, locale) : { title: u.id, subtitle: '' };
        return {
          id: u.id,
          title: texts.title,
          subtitle: texts.subtitle,
          icon: unit?.icon ?? '',
          state: u.state,
          done: u.done,
          total: u.total,
          steps: u.steps.map((s) => {
            const step = live.steps.get(s.id);
            return { id: s.id, title: step ? inLocale(step.texts, locale).title : s.id, state: s.state };
          }),
        };
      }),
      currentStepId: m.currentStepId,
      stepsDone: m.stepsDone,
      stepsTotal: m.stepsTotal,
      today: {
        day: e.today,
        state,
        quota,
        line:
          state === 'todo'
            ? t.map.today.todo(e.minimoa)
            : state === 'done'
              ? t.map.today.done(e.minimoa)
              : t.map.today[state],
      },
      streak: await this.streakDto(userId, e.profile, e.state, e.today),
      knows: this.knows(snapshot.profile, locale),
      plus: hasPlus(e.profile, e.now),
    };
  }

  // ── Séance ─────────────────────────────────────────────────────────────────
  async session(
    userId: string,
    locale: Locale,
    client: ClientAppInfo,
    formats: CheminFormat[] | null,
  ): Promise<CheminSessionResponse> {
    const e = await this.enter(userId, client);
    const caps: ClientCapabilities = { build: client.build, formats };
    const [live, { quota, today }] = await Promise.all([this.content.live(), this.quota(userId, e, locale)]);
    // Le minimoa animé de son espèce (réglage de l'API, docs/MOTION.md) ; aucun : l'image habituelle.
    const mascot = e.species ? this.env.mascots[e.species] : null;
    const open = today.filter((s) => s.status === 'open').sort((a, b) => a.slot - b.slot)[0];
    if (open)
      return {
        session: this.render(open, live, locale, caps, e.minimoa),
        quota,
        reason: null,
        message: null,
        mascot,
      };
    if (quota.nextSlot === null)
      return {
        session: null,
        quota,
        reason: 'quota_used',
        message: cheminText.in(locale).session.quotaUsed(e.minimoa),
        mascot,
      };
    const [snapshot, answeredOn] = await Promise.all([
      this.vision.current(userId),
      this.answers.lastAnswered(userId),
    ]);
    const pick = pickSession({
      catalogue: live.catalogue,
      progress: { completedSteps: new Set(e.progress.completedSteps), testDone: snapshot.testDone },
      client: caps,
      answeredOn,
      vision: snapshot.profile,
      userId,
      day: e.today,
    });
    if (!pick)
      return {
        session: null,
        quota,
        reason: 'nothing_left',
        message: cheminText.in(locale).session.nothingLeft,
        mascot,
      };
    const record = await this.sessions.insertIfAbsent({
      id: this.ids.uuid(),
      userId,
      day: e.today,
      slot: quota.nextSlot,
      kind: pick.kind,
      stepId: pick.stepId,
      questions: pick.questions,
      status: 'open',
      result: null,
      createdAt: e.now.toISOString(),
      completedAt: null,
    });
    return {
      session: this.render(record, live, locale, caps, e.minimoa),
      quota,
      reason: null,
      message: null,
      mascot,
    };
  }

  private scene(
    scenes: readonly ContentScene[],
    kind: ContentScene['kind'],
    build: number | null,
    seed: string,
  ): { id: string; animation: string } {
    const ok = scenes.filter((s) => s.kind === kind && s.minBuild <= (build ?? 0));
    if (ok.length === 0) return { id: 'default', animation: kind === 'end' ? 'confetti' : 'fade' };
    const top = Math.max(...ok.map((s) => s.minBuild));
    const best = ok.filter((s) => s.minBuild === top).sort((a, b) => a.id.localeCompare(b.id));
    const s = best[seedOf(seed, kind) % best.length] ?? best[0]!;
    return { id: s.id, animation: s.animation };
  }

  private render(
    s: CheminSessionRecord,
    live: LiveContent,
    locale: Locale,
    caps: ClientCapabilities,
    minimoa: string,
  ): CheminSession {
    const t = cheminText.in(locale).session;
    const step = s.stepId ? live.steps.get(s.stepId) : undefined;
    const unit = step ? live.units.get(step.unitId) : undefined;
    const questions = s.questions.flatMap((p): CheminQuestionDto[] => {
      const q = live.questions.get(p.questionId);
      return q ? [this.renderQuestion(q, p.format, p.review, locale, caps)] : [];
    });
    return {
      id: s.id,
      day: s.day,
      slot: s.slot === 1 ? 'bonus' : 'daily',
      kind: s.kind,
      step:
        step && unit
          ? {
              id: step.id,
              title: inLocale(step.texts, locale).title,
              unitId: unit.id,
              unitTitle: inLocale(unit.texts, locale).title,
            }
          : null,
      intro:
        s.slot === 1
          ? t.bonus
          : s.kind === 'review'
            ? t.review(minimoa)
            : (t.intro[seedOf('chemin-intro', s.id) % t.intro.length] ?? t.intro[0]!)(minimoa),
      questions,
      transition: this.scene(live.scenes, 'transition', caps.build, s.id),
      endScene: this.scene(live.scenes, 'end', caps.build, s.id),
      done: s.status === 'done',
    };
  }

  private renderQuestion(
    q: ContentQuestion,
    format: CheminFormat,
    review: boolean,
    locale: Locale,
    caps: ClientCapabilities,
  ): CheminQuestionDto {
    const texts = inLocale(q.texts, locale);
    const domain = toDomainQuestion(q);
    const options = domain.options.map((o) => {
      const raw = q.options.find((x) => x.id === o.id);
      const ot = raw ? inLocale(raw.texts, locale) : { label: o.id, reaction: '' };
      return {
        id: o.id,
        label: ot.label,
        icon: o.icon,
        reaction: { text: ot.reaction, animation: deliverableAnimation(o, caps) },
      };
    });
    const slider =
      format === 'slider' && options.length >= 2
        ? {
            min: 0 as const,
            max: 100 as const,
            start: 50,
            reactions: {
              low: options[0]!.reaction,
              mid: { text: texts.mid ?? options[0]!.reaction.text, animation: null },
              high: options[1]!.reaction,
            },
          }
        : null;
    return { id: q.id, format, text: texts.text, review, options: options.slice(0, 6), slider };
  }

  // ── Réponses ───────────────────────────────────────────────────────────────
  async answer(
    userId: string,
    locale: Locale,
    client: ClientAppInfo,
    body: CheminAnswersBody,
  ): Promise<CheminResult> {
    const record = await this.sessions.find(body.sessionId);
    if (!record || record.userId !== userId) throw new DomainError('not_found', sessionError);
    if (record.status === 'done' && record.result)
      return { ...(record.result as CheminResult), alreadyRecorded: true };

    const live = await this.content.live();
    const wanted = record.questions.map((p) => p.questionId);
    const given = new Map(body.answers.map((a) => [a.questionId, a]));
    if (
      given.size !== body.answers.length ||
      given.size !== wanted.length ||
      !wanted.every((id) => given.has(id))
    )
      throw new DomainError('invalid', answersError);
    const session: {
      question: CheminQuestion;
      answer: Pick<CheminAnswerInput, 'optionId' | 'value'>;
      signal: number;
    }[] = [];
    for (const id of wanted) {
      const content = live.questions.get(id);
      const a = given.get(id);
      if (!content || !a) throw new DomainError('invalid', answersError);
      const question = toDomainQuestion(content);
      // Le format servi (repli compris) décide : un repli en choix se répond par une option.
      const served = record.questions.find((p) => p.questionId === id)?.format ?? question.format;
      const answer = { optionId: a.optionId ?? null, value: a.value ?? null };
      const signal = answerValue({ ...question, format: served === 'slider' ? 'slider' : 'choice' }, answer);
      if (signal === null) throw new DomainError('invalid', answersError);
      session.push({ question, answer, signal });
    }

    const e = await this.enter(userId, client);
    const at = e.now.toISOString();
    if (!(await this.sessions.markDone(record.id, at))) {
      const again = await this.sessions.find(record.id);
      if (again?.result) return { ...(again.result as CheminResult), alreadyRecorded: true };
      throw new DomainError('conflict');
    }
    // Étincelles : vitesse (mesurée ici, de l'ouverture de la séance à l'envoi) et cohérence avec ce que tu as déjà dit
    // (ta réponse précédente à la même question, sinon ce que ton minimoa sait de l'axe), lues avant d'enregistrer.
    const [before, previous] = await Promise.all([
      this.vision.current(userId),
      this.answers.latestFor([userId], wanted),
    ]);
    const prevSignal = new Map(previous.map((r) => [r.questionId, r.signal]));
    const sparks = sessionSparks(
      session.map((s) => ({
        value: s.signal,
        previous: prevSignal.get(s.question.id) ?? null,
        axis:
          before.testDone || before.profile[s.question.axis].confidence > 0
            ? before.profile[s.question.axis]
            : null,
      })),
      (e.now.getTime() - new Date(record.createdAt).getTime()) / 1000,
    );
    const rows: CheminAnswerRecord[] = session.map((s) => ({
      userId,
      sessionId: record.id,
      questionId: s.question.id,
      optionId: s.answer.optionId,
      value: s.answer.value,
      axis: s.question.axis,
      signal: s.signal,
      day: e.today,
      answeredAt: at,
    }));
    await this.answers.insertMany(rows);
    await this.vision.record(
      userId,
      rows.map((r): VisionSignal => ({ axis: r.axis, value: r.signal, source: 'daily', at })),
    );
    const completedSteps =
      record.kind === 'step' && record.stepId && !e.progress.completedSteps.includes(record.stepId)
        ? [...e.progress.completedSteps, record.stepId]
        : e.progress.completedSteps;
    const progress = await this.progressRepo.upsert(
      userId,
      {
        completedSteps,
        sessionsDone: e.progress.sessionsDone + 1,
        answersCount: e.progress.answersCount + rows.length,
        lastSessionOn: e.today,
      },
      at,
    );
    const { newItems, milestone } = await this.streaks.complete(userId, e.today);
    const state = await this.rituals.state(userId);

    const snapshot = await this.vision.current(userId);
    const caps: ClientCapabilities = { build: client.build, formats: null };
    const m = cheminMap(
      live.catalogue,
      { completedSteps: new Set(progress.completedSteps), testDone: snapshot.testDone },
      caps,
    );
    const step = record.stepId ? live.steps.get(record.stepId) : undefined;
    const unitState = step ? m.units.find((u) => u.id === step.unitId) : undefined;
    const nextStep = m.currentStepId ? live.steps.get(m.currentStepId) : undefined;
    const nextUnit = nextStep ? live.units.get(nextStep.unitId) : undefined;
    const t = cheminText.in(locale);
    const rev = revelationOf(rows.map((r) => ({ axis: r.axis, value: r.signal })));
    const { quota } = await this.quota(
      userId,
      { progress, today: e.today, profile: e.profile, now: e.now },
      locale,
    );
    const { person, empty } = await this.personOfDay(
      userId,
      locale,
      e.minimoa,
      session,
      live,
      snapshot.profile,
    );

    const result: CheminResult = {
      sessionId: record.id,
      alreadyRecorded: false,
      revelation: {
        title: t.revelation.title(e.minimoa),
        text: rev ? t.revelation.axes[rev.axis][rev.side] : t.revelation.none,
        axis: rev?.axis ?? null,
      },
      progress: {
        stepId: record.stepId,
        stepDone: record.kind === 'step',
        unitId: step?.unitId ?? null,
        unitDone: unitState?.state === 'done',
        next:
          nextStep && nextUnit
            ? {
                stepId: nextStep.id,
                title: inLocale(nextStep.texts, locale).title,
                unitTitle: inLocale(nextUnit.texts, locale).title,
              }
            : null,
        stepsDone: m.stepsDone,
        stepsTotal: m.stepsTotal,
      },
      streak: await this.streakDto(userId, e.profile, state, e.today),
      newItems,
      milestone,
      quota,
      knows: this.knows(snapshot.profile, locale),
      person,
      empty,
      sparks,
    };
    await this.sessions.saveResult(record.id, result);
    return result;
  }

  // ── Ta personne du jour ────────────────────────────────────────────────────
  private async personOfDay(
    userId: string,
    locale: Locale,
    minimoa: string,
    session: readonly { question: CheminQuestion; answer: Pick<CheminAnswerInput, 'optionId' | 'value'> }[],
    live: LiveContent,
    vision: VisionProfile,
  ): Promise<Pick<CheminResult, 'person' | 'empty'>> {
    const t = cheminText.in(locale);
    const r = await this.listEncounters.execute(userId, { record: false });
    const fresh = r.suggestions.filter((s) => !s.waved);
    const pool = (fresh.length > 0 ? fresh : r.suggestions).slice(0, 20);
    if (pool.length === 0) {
      const reason = !isMatchable(vision)
        ? 'not_ready'
        : (await this.places.find(userId))
          ? 'first_here'
          : 'no_location';
      return {
        person: null,
        empty: { reason, title: t.empty[reason].title, text: t.empty[reason].text(minimoa) },
      };
    }
    const theirs = await this.answers.latestFor(
      pool.map((s) => s.profile.id),
      session.map((s) => s.question.id),
    );
    const byUser = new Map<string, Map<string, Pick<CheminAnswerInput, 'optionId' | 'value'>>>();
    for (const a of theirs)
      byUser.set(
        a.userId,
        (byUser.get(a.userId) ?? new Map()).set(a.questionId, { optionId: a.optionId, value: a.value }),
      );
    const pick = pickPersonOfDay(
      session,
      pool.map((s) => ({
        id: s.profile.id,
        compatibility: s.compatibility,
        answers: byUser.get(s.profile.id) ?? new Map(),
      })),
    );
    const chosen = pool.find((s) => s.profile.id === pick?.id) ?? pool[0]!;
    const suggestion = toEncountersDto({ ...r, incoming: [], suggestions: [chosen] }, locale).suggestions[0]!;
    // « Vous deux : » d'abord les traits partagés de la séance, complétés par les points communs de la vision.
    const points = (pick?.tags ?? []).flatMap((tag) => (t.tags[tag] ? [t.tags[tag]!] : []));
    for (const c of suggestion.explanation.common) if (points.length < 2) points.push(c.text);
    const openerQ = pick?.openerQuestionId ? live.questions.get(pick.openerQuestionId) : undefined;
    const opener = openerQ ? inLocale(openerQ.texts, locale).opener : '';
    const line =
      t.person.line[seedOf('chemin-person', userId, chosen.profile.id) % t.person.line.length] ??
      t.person.line[0]!;
    return {
      person: {
        suggestion,
        title: t.person.title,
        line: line(minimoa, chosen.profile.displayName),
        together: { title: t.person.together, points: points.slice(0, 3) },
        opener: opener
          ? { text: opener, questionId: openerQ?.id ?? null }
          : { text: t.person.openerFallback, questionId: null },
      },
      empty: null,
    };
  }
}
