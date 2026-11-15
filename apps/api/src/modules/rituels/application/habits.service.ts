import { Inject, Injectable } from '@nestjs/common';
import { type HabitDef, habitById, rituelsNotificationVars, habitsIn, rituelsText, textOf } from '@blowy/content';
import type { Habit, HabitCatalogue } from '@blowy/contract';
import {
  type Day,
  HABIT_RHYTHMS,
  type HabitRhythm,
  ITEMS,
  type ProofVerdict,
  addDays,
  canAddHabit,
  habitDay,
  habitStreak,
  proofCounts,
  seedOf,
  shouldAskProof,
} from '@blowy/domain';
import { EXTENSIONS, MEDIA_URL_SECONDS, type Storage, type UploadTicket } from '../../../integrations/storage/ports';
import { DomainError } from '../../../shared/errors';
import type { Ids } from '../../../shared/ids';
import { IDS, STORAGE } from '../../../shared/tokens';
import { PetCharacter } from '../../pets/application/pet-character';
import { VISION_SIGNALS, type VisionSignals } from '../../vision/tokens';
import type {
  HabitCheckRecord,
  HabitChecksRepository,
  HabitRecord,
  HabitVerifier,
  HabitsRepository,
  RitualPhotoRecord,
  RitualPhotosRepository,
  RitualStatesRepository,
} from '../ports';
import { HABIT_CHECKS, HABIT_VERIFIER, HABITS, RITUAL_PHOTOS, RITUAL_STATES } from '../tokens';
import { RitualNotifications, RitualsContext } from './rituals-context';
import { requestLocale } from '../../../shared/locale';
import { AiConsents } from '../../ai-consents/application/ai-consents.service';

/** Fenêtre relue pour les séries d'habitude (au-delà, la série affichée plafonne). */
export const HABIT_HISTORY_DAYS = 120;

export const habitPhotoPattern = (userId: string, ref: string, day: Day): RegExp =>
  new RegExp(`^rituals/${userId}/${day}/habit-${ref}-[0-9a-f-]{36}\\.(jpg|webp)$`);

const pickLine = (lines: readonly string[], seed: string): string => lines[seedOf(seed) % lines.length] ?? lines[0] ?? '';
const lineFor = (verdict: ProofVerdict, seed: string): string => pickLine(rituelsText.in(requestLocale()).proofVerdictLines[verdict], seed);

/** Définition d'une habitude suivie ; une habitude retirée du catalogue garde un libellé neutre. */
const defOf = (habit: HabitRecord): HabitDef =>
  habitById(habit.habitId, requestLocale()) ?? { id: habit.habitId, axis: 'rythme', lean: 0, social: false, sociability: 0, rhythm: habit.rhythm, proofHour: habit.proofHour, label: habit.habitId, ask: '' };

export function toHabitDto(habit: HabitRecord, checks: readonly HabitCheckRecord[], today: Day, hour: number): Habit {
  const def = defOf(habit);
  const mine = checks.filter((c) => c.habitRef === habit.id);
  const keptDays = mine.filter((c) => proofCounts(c.verdict)).map((c) => c.day);
  const day = habitDay(habit.rhythm, keptDays, today);
  const todayCheck = mine.find((c) => c.day === today) ?? null;
  return {
    ref: habit.id,
    habitId: habit.habitId,
    label: def.label,
    ask: def.ask,
    social: def.social,
    rhythm: habit.rhythm,
    rhythmLabel: rituelsText.in(requestLocale()).rhythmLabel[habit.rhythm],
    proofHour: habit.proofHour,
    today: {
      doneToday: day.doneToday,
      doneThisWeek: day.doneThisWeek,
      target: day.target,
      due: day.due,
      askNow: shouldAskProof(day, hour, habit.proofHour),
      verdict: todayCheck?.verdict ?? null,
      line: todayCheck?.line ?? null,
    },
    streak: habitStreak(habit.rhythm, keptDays, today),
    since: habit.createdAt,
  };
}

export interface ProofOutcome {
  photo: RitualPhotoRecord;
  verdict: ProofVerdict;
  counted: boolean;
  line: string;
  habit: Habit;
  newItems: string[];
}

/**
 * Habitudes : catalogue relié aux axes de vision, rythme, limite selon l'abonnement (`entitlements().habits`),
 * preuve en photo vérifiée par le port `HabitVerifier` (« pas sûr » compte). Une habitude tenue fait évoluer le minimoa
 * (compteur `habitsKept` → objets), monte sa sociabilité si elle est tournée vers les autres, et renseigne la vision.
 */
@Injectable()
export class HabitsService {
  constructor(
    @Inject(RitualsContext) private readonly ctx: RitualsContext,
    @Inject(HABITS) private readonly habits: HabitsRepository,
    @Inject(HABIT_CHECKS) private readonly checks: HabitChecksRepository,
    @Inject(RITUAL_PHOTOS) private readonly photos: RitualPhotosRepository,
    @Inject(RITUAL_STATES) private readonly states: RitualStatesRepository,
    @Inject(HABIT_VERIFIER) private readonly verifier: HabitVerifier,
    @Inject(PetCharacter) private readonly character: PetCharacter,
    @Inject(VISION_SIGNALS) private readonly signals: VisionSignals,
    @Inject(RitualNotifications) private readonly notifications: RitualNotifications,
    @Inject(STORAGE) private readonly storage: Storage,
    @Inject(IDS) private readonly ids: Ids,
    @Inject(AiConsents) private readonly aiConsents: AiConsents,
  ) {}

  async catalogue(userId: string): Promise<HabitCatalogue> {
    const [profile, active] = await Promise.all([this.ctx.profile(userId), this.habits.listActive(userId)]);
    return {
      habits: habitsIn(requestLocale()).map((h) => ({ id: h.id, label: h.label, ask: h.ask, axis: h.axis, social: h.social, rhythm: h.rhythm, proofHour: h.proofHour })),
      rhythms: HABIT_RHYTHMS.map((id) => ({ id, label: rituelsText.in(requestLocale()).rhythmLabel[id] })),
      limit: this.ctx.limitsOf(profile).habits,
      used: active.length,
    };
  }

  /** Habitudes suivies avec leur état du jour. */
  async list(userId: string): Promise<{ habits: Habit[]; limit: number; canAdd: boolean }> {
    const [profile, active] = await Promise.all([this.ctx.profile(userId), this.habits.listActive(userId)]);
    const today = this.ctx.today();
    const checks = await this.checks.listSince(
      active.map((h) => h.id),
      addDays(today, -HABIT_HISTORY_DAYS),
    );
    const limit = this.ctx.limitsOf(profile).habits;
    return { habits: active.map((h) => toHabitDto(h, checks, today, this.ctx.hour())), limit, canAdd: canAddHabit(active.length, limit) };
  }

  /** Habitudes dont la preuve est demandée maintenant (accueil), et celles à faire aujourd'hui. */
  async todaySummary(userId: string): Promise<{ due: number; asked: { habitRef: string; ask: string }[] }> {
    const active = await this.habits.listActive(userId);
    if (active.length === 0) return { due: 0, asked: [] };
    const today = this.ctx.today();
    const checks = await this.checks.listSince(
      active.map((h) => h.id),
      addDays(today, -7),
    );
    const dtos = active.map((h) => toHabitDto(h, checks, today, this.ctx.hour()));
    return { due: dtos.filter((d) => d.today.due).length, asked: dtos.filter((d) => d.today.askNow).map((d) => ({ habitRef: d.ref, ask: d.ask })) };
  }

  async add(userId: string, habitId: string, rhythm?: HabitRhythm, proofHour?: number): Promise<void> {
    const def = habitById(habitId, requestLocale());
    if (!def) throw new DomainError('invalid', textOf(rituelsText, (t) => t.errors.habitUnknown));
    const [profile, active] = await Promise.all([this.ctx.profile(userId), this.habits.listActive(userId)]);
    const limit = this.ctx.limitsOf(profile).habits;
    if (active.some((h) => h.habitId === habitId)) throw new DomainError('conflict', textOf(rituelsText, (t) => t.errors.habitTaken));
    if (!canAddHabit(active.length, limit)) throw new DomainError('forbidden', limit >= 6 ? textOf(rituelsText, (t) => t.errors.habitLimitPlus) : textOf(rituelsText, (t) => t.errors.habitLimit(limit)));
    const created = await this.habits.create({
      id: this.ids.uuid(),
      userId,
      habitId,
      rhythm: rhythm ?? def.rhythm,
      proofHour: proofHour ?? def.proofHour,
      createdAt: this.ctx.now().toISOString(),
      archivedAt: null,
      askedOn: null,
    });
    if (!created) throw new DomainError('conflict', textOf(rituelsText, (t) => t.errors.habitTaken));
    // Choisir une habitude dit déjà quelque chose de sa vision (moitié du poids d'une habitude tenue).
    await this.signals.record(userId, [{ axis: def.axis, value: Math.round(def.lean / 2), source: 'habit', at: this.ctx.now().toISOString() }]);
  }

  async update(userId: string, ref: string, patch: { rhythm?: HabitRhythm; proofHour?: number }): Promise<void> {
    await this.owned(userId, ref);
    await this.habits.update(ref, patch);
  }

  /** Arrêter une habitude : elle quitte la liste, son historique reste. */
  async remove(userId: string, ref: string): Promise<void> {
    await this.owned(userId, ref);
    await this.habits.update(ref, { archivedAt: this.ctx.now().toISOString() });
  }

  async proofTicket(userId: string, ref: string, contentType: 'image/jpeg' | 'image/webp'): Promise<UploadTicket> {
    await this.owned(userId, ref);
    const today = this.ctx.today();
    await this.notCountedYet(ref, today);
    return this.storage.createUploadTicket(`rituals/${userId}/${today}/habit-${ref}-${this.ids.uuid()}.${EXTENSIONS[contentType]}`);
  }

  /** Preuve envoyée : vérifiée (oui / non / pas sûr), une phrase gentille ; « pas sûr » compte, « non » permet de réessayer. */
  async proof(userId: string, ref: string, path: string, keep: boolean): Promise<ProofOutcome> {
    const habit = await this.owned(userId, ref);
    const today = this.ctx.today();
    const previous = await this.notCountedYet(ref, today);
    if (!habitPhotoPattern(userId, ref, today).test(path)) throw new DomainError('invalid', textOf(rituelsText, (t) => t.errors.proofPath));
    if (!(await this.storage.exists(path))) throw new DomainError('invalid', textOf(rituelsText, (t) => t.errors.proofMissing));
    const def = defOf(habit);
    const now = this.ctx.now().toISOString();
    const photo: RitualPhotoRecord = { id: this.ids.uuid(), userId, source: 'habit', day: today, path, caption: def.label, keep, createdAt: now, deletedAt: null };
    await this.photos.create(photo);

    // App Review 5.1.2(i) (audit B5) : l'image ne part au prestataire d'IA qu'avec l'accord explicite de la personne.
    // Sans accord (jamais demandé, refusé ou retiré) : personne ne la vérifie, on fait confiance (« pas sûr » compte).
    const checked = await this.aiConsents.proofsAllowed(userId);
    const verdict: ProofVerdict = checked
      ? (await this.verifier.verify({ userId, locale: (await this.ctx.profile(userId)).locale ?? 'fr', habitId: habit.habitId, path })).verdict
      : 'unsure';
    const line = checked ? lineFor(verdict, path) : pickLine(rituelsText.in(requestLocale()).proofUncheckedLines, path);
    const { counted, newItems, habitDto } = await this.record(userId, habit, def, previous, verdict, line, photo.id, now);
    return { photo, verdict, counted, line, habit: habitDto, newItems };
  }

  /**
   * Habitude tenue sans photo ni IA (« Sans vérification par IA ») : rien n'est envoyé à personne ; on fait confiance,
   * comme pour un « pas sûr ». Mêmes effets qu'une preuve qui compte (série, objets, sociabilité, vision).
   */
  async done(userId: string, ref: string): Promise<{ verdict: ProofVerdict; counted: boolean; line: string; habit: Habit; newItems: string[] }> {
    const habit = await this.owned(userId, ref);
    const today = this.ctx.today();
    const previous = await this.notCountedYet(ref, today);
    const def = defOf(habit);
    const now = this.ctx.now().toISOString();
    const line = pickLine(rituelsText.in(requestLocale()).selfCheckLines, `${ref}:${today}`);
    const { counted, newItems, habitDto } = await this.record(userId, habit, def, previous, 'unsure', line, null, now);
    return { verdict: 'unsure', counted, line, habit: habitDto, newItems };
  }

  /** Enregistre la preuve du jour et, si elle compte, ses effets (compteur, objets, sociabilité, vision). */
  private async record(
    userId: string,
    habit: HabitRecord,
    def: HabitDef,
    previous: HabitCheckRecord | null,
    verdict: ProofVerdict,
    line: string,
    photoId: string | null,
    now: string,
  ): Promise<{ counted: boolean; newItems: string[]; habitDto: Habit }> {
    const ref = habit.id;
    const today = this.ctx.today();
    const counted = proofCounts(verdict);
    await this.checks.upsert({ id: previous?.id ?? this.ids.uuid(), habitRef: ref, userId, day: today, verdict, line, photoId, createdAt: now });

    let newItems: string[] = [];
    if (counted) {
      const kept = await this.states.addHabitsKept(userId, 1);
      newItems = ITEMS.filter((i) => i.unlock.kind === 'stat' && i.unlock.stat === 'habitsKept' && i.unlock.n === kept).map((i) => i.id);
      await this.character.apply(userId, 'habit_done', { sociability: def.sociability });
      await this.signals.record(userId, [{ axis: def.axis, value: def.lean, source: 'habit', at: now }]);
      for (const item of newItems) await this.notifications.send(userId, 'item_unlocked', rituelsNotificationVars.itemUnlocked(item, `habits_${kept}`));
    }
    const checks = await this.checks.listSince([ref], addDays(today, -HABIT_HISTORY_DAYS));
    return { counted, newItems, habitDto: toHabitDto(habit, checks, today, this.ctx.hour()) };
  }

  /** Garder (ou ne plus garder) une photo privée dans ses souvenirs ; une photo déjà supprimée ne revient pas. */
  async keepPhoto(userId: string, photoId: string, keep: boolean): Promise<void> {
    const photo = await this.photos.find(photoId);
    if (!photo || photo.userId !== userId) throw new DomainError('not_found');
    if (photo.deletedAt !== null) throw new DomainError('not_found', textOf(rituelsText, (t) => t.errors.proofGone));
    await this.photos.setKeep(photoId, keep);
  }

  /** Souvenirs privés : photos gardées, URL signées d'une heure. */
  async memories(userId: string, before: string | null, limit: number): Promise<{ items: (RitualPhotoRecord & { url: string })[]; nextBefore: string | null }> {
    const rows = await this.photos.listKept(userId, before, limit);
    const items = await Promise.all(rows.map(async (p) => ({ ...p, url: await this.storage.signedUrl(p.path, MEDIA_URL_SECONDS) })));
    return { items, nextBefore: rows.length === limit ? (rows[rows.length - 1]?.createdAt ?? null) : null };
  }

  private async owned(userId: string, ref: string): Promise<HabitRecord> {
    const habit = await this.habits.find(ref);
    if (!habit || habit.userId !== userId || habit.archivedAt !== null) throw new DomainError('not_found', textOf(rituelsText, (t) => t.errors.habitNotFound));
    return habit;
  }

  /** Preuve du jour déjà comptée : refusée. Rend la preuve « non » du jour s'il y en a une (elle sera remplacée). */
  private async notCountedYet(ref: string, today: Day): Promise<HabitCheckRecord | null> {
    const check = await this.checks.find(ref, today);
    if (check && proofCounts(check.verdict)) throw new DomainError('already_done', textOf(rituelsText, (t) => t.errors.habitDoneToday));
    return check;
  }
}
