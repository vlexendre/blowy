import { Inject, Injectable, Optional } from '@nestjs/common';
import { LiveActivities } from '../../notifications/live-activities';
import { DAILY_CHALLENGES as DAILY_CATALOGUE, type DailyDef, dailyById, dailyChallengesIn, type Locale, rituelsText, textOf } from '@blowy/content';
import type { DailyChallenge } from '@blowy/contract';
import { type DailyCandidate, type DailyStatus, type Day, advanceDaily, dayOf, initialDailyStatus, leastConfidentAxis, pickDailyChallenge, presentDailyCard } from '@blowy/domain';
import { EXTENSIONS, type Storage, type UploadTicket } from '../../../integrations/storage/ports';
import { DomainError } from '../../../shared/errors';
import type { Ids } from '../../../shared/ids';
import { IDS, LINKS, PETS, STORAGE } from '../../../shared/tokens';
import type { LinksRepository } from '../../links/ports';
import { PetCharacter } from '../../pets/application/pet-character';
import type { PetsRepository } from '../../pets/ports';
import { VISION_READER, VISION_SIGNALS, type VisionReader, type VisionSignals } from '../../vision/tokens';
import type { DailyChallengePatch, DailyChallengeRecord, DailyChallengesRepository, RitualPhotosRepository } from '../ports';
import { DAILY_CHALLENGES, RITUAL_PHOTOS } from '../tokens';
import { RitualsContext } from './rituals-context';
import { StreakService } from './streak.service';
import { requestLocale } from '../../../shared/locale';

const CANDIDATES: readonly DailyCandidate[] = DAILY_CATALOGUE.map((d) => ({ id: d.id, kind: d.kind, axis: d.axis }));

/** Définition d'un défi enregistré ; s'il a quitté le catalogue depuis, une consigne neutre de son type. */
export const dailyDefOf = (rec: Pick<DailyChallengeRecord, 'challengeId' | 'kind' | 'axis'>, locale: Locale = requestLocale()): DailyDef => {
  const catalogue = dailyChallengesIn(locale);
  return dailyById(rec.challengeId, locale) ?? catalogue.find((d) => d.kind === rec.kind) ?? catalogue[0]!;
};

export const toDailyDto = (rec: DailyChallengeRecord, locale: Locale = requestLocale()): DailyChallenge => {
  const def = dailyDefOf(rec, locale);
  const dailyText = rituelsText.in(locale).daily;
  const choices = def.choices ? [def.choices[0].label, def.choices[1].label] : null;
  return {
    day: rec.day,
    id: rec.challengeId,
    kind: rec.kind,
    kindLabel: dailyText.kindLabel[rec.kind],
    text: def.text,
    choices: rec.kind === 'question' ? choices : null,
    howTo: rec.status === 'done' ? dailyText.done : dailyText.howTo[rec.kind],
    status: rec.status,
    present: presentDailyCard(rec.status),
    answer: rec.answer,
    axis: rec.axis,
  };
};

/** Chemin d'une photo du défi : rangée par personne et par jour, jamais devinable. */
export const dailyPhotoPattern = (userId: string, day: Day): RegExp => new RegExp(`^rituals/${userId}/${day}/daily-[0-9a-f-]{36}\\.(jpg|webp)$`);

export interface DoneResult {
  record: DailyChallengeRecord;
  /** Objets débloqués par un palier de série. */
  newItems: string[];
  /** Vrai si c'est cet appel qui a fait le défi. */
  justDone: boolean;
}

/**
 * Le défi du jour : un par personne et par jour, choisi par le serveur (déterministe : jour + personne) au premier
 * passage du jour, puis enregistré (le choix ne bouge plus de la journée, même si la vision change).
 */
@Injectable()
export class DailyService {
  constructor(
    @Inject(RitualsContext) private readonly ctx: RitualsContext,
    @Inject(StreakService) private readonly streaks: StreakService,
    @Inject(DAILY_CHALLENGES) private readonly daily: DailyChallengesRepository,
    @Inject(RITUAL_PHOTOS) private readonly photos: RitualPhotosRepository,
    @Inject(LINKS) private readonly links: LinksRepository,
    @Inject(PETS) private readonly pets: PetsRepository,
    @Inject(PetCharacter) private readonly character: PetCharacter,
    @Inject(VISION_READER) private readonly vision: VisionReader,
    @Inject(VISION_SIGNALS) private readonly signals: VisionSignals,
    @Inject(STORAGE) private readonly storage: Storage,
    @Inject(IDS) private readonly ids: Ids,
    @Optional() @Inject(LiveActivities) private readonly live?: LiveActivities,
  ) {}

  /**
   * Défi du jour de la personne ; choisi et enregistré au premier appel du jour. Le jour de la création du minimoa, il
   * est enregistré comme déjà vu (`initialDailyStatus`) : rien ne monte en plein écran pendant la première session.
   */
  async ensure(userId: string, today: Day): Promise<DailyChallengeRecord> {
    const existing = await this.daily.find(userId, today);
    if (existing) return existing;
    const [links, profile, pet] = await Promise.all([this.links.listForUsers([userId]), this.vision.profileOf(userId), this.pets.findByOwner(userId)]);
    const pick = pickDailyChallenge({
      userId,
      day: today,
      catalogue: CANDIDATES,
      weakestAxis: leastConfidentAxis(profile),
      hasLinks: links.some((l) => l.status === 'active'),
    });
    return this.daily.insertIfAbsent({
      userId,
      day: today,
      challengeId: pick.id,
      kind: pick.kind,
      axis: pick.axis,
      status: initialDailyStatus(pet ? dayOf(new Date(pet.createdAt)) : null, today),
      answer: null,
      photoId: null,
      seenAt: null,
      acceptedAt: null,
      doneAt: null,
      createdAt: this.ctx.now().toISOString(),
    });
  }

  /** La carte a été montrée (acceptée ou rangée) : elle ne remonte plus en plein écran aujourd'hui. */
  async mark(userId: string, to: Extract<DailyStatus, 'seen' | 'accepted'>): Promise<DailyChallengeRecord> {
    const today = this.ctx.today();
    const rec = await this.ensure(userId, today);
    const status = advanceDaily(rec.status, to);
    if (status === rec.status) return rec;
    const at = this.ctx.now().toISOString();
    const patch: DailyChallengePatch = { status, ...(to === 'seen' ? { seenAt: at } : { acceptedAt: at, seenAt: rec.seenAt ?? at }) };
    await this.daily.update(userId, today, patch);
    return { ...rec, ...patch };
  }

  /** Question : la réponse devient une observation de vision (source « daily ») sur l'axe visé. */
  async answer(userId: string, choice: 0 | 1): Promise<DoneResult> {
    const today = this.ctx.today();
    const rec = await this.ensure(userId, today);
    if (rec.kind !== 'question') throw new DomainError('invalid', textOf(rituelsText, (t) => t.errors.dailyKind));
    if (rec.status === 'done') throw new DomainError('already_done', textOf(rituelsText, (t) => t.errors.dailyDone));
    const result = await this.finish(userId, rec, { answer: choice });
    const def = dailyDefOf(rec);
    const picked = def.choices?.[choice];
    if (result.justDone && picked && rec.axis) {
      await this.signals.record(userId, [{ axis: rec.axis, value: picked.value, source: 'daily', at: this.ctx.now().toISOString() }]);
    }
    return result;
  }

  async photoTicket(userId: string, contentType: 'image/jpeg' | 'image/webp'): Promise<UploadTicket> {
    const today = this.ctx.today();
    const rec = await this.ensure(userId, today);
    if (rec.kind !== 'photo') throw new DomainError('invalid', textOf(rituelsText, (t) => t.errors.dailyKind));
    if (rec.status === 'done') throw new DomainError('already_done', textOf(rituelsText, (t) => t.errors.dailyDone));
    return this.storage.createUploadTicket(`rituals/${userId}/${today}/daily-${this.ids.uuid()}.${EXTENSIONS[contentType]}`);
  }

  /** Photo du défi : privée, supprimée sous 24 h sauf si la personne la garde. */
  async photo(userId: string, path: string, keep: boolean): Promise<DoneResult> {
    const today = this.ctx.today();
    const rec = await this.ensure(userId, today);
    if (rec.kind !== 'photo') throw new DomainError('invalid', textOf(rituelsText, (t) => t.errors.dailyKind));
    if (rec.status === 'done') throw new DomainError('already_done', textOf(rituelsText, (t) => t.errors.dailyDone));
    if (!dailyPhotoPattern(userId, today).test(path)) throw new DomainError('invalid', textOf(rituelsText, (t) => t.errors.proofPath));
    if (!(await this.storage.exists(path))) throw new DomainError('invalid', textOf(rituelsText, (t) => t.errors.proofMissing));
    const photoId = this.ids.uuid();
    await this.photos.create({
      id: photoId,
      userId,
      source: 'daily',
      day: today,
      path,
      caption: dailyDefOf(rec).text,
      keep,
      createdAt: this.ctx.now().toISOString(),
      deletedAt: null,
    });
    return this.finish(userId, rec, { photoId });
  }

  /** « Écrire à un lien » et « sortir » : le serveur vérifie que c'est fait. */
  async complete(userId: string): Promise<DoneResult> {
    const today = this.ctx.today();
    const rec = await this.ensure(userId, today);
    if (rec.status === 'done') throw new DomainError('already_done', textOf(rituelsText, (t) => t.errors.dailyDone));
    if (rec.kind !== 'write' && rec.kind !== 'go_out') throw new DomainError('invalid', textOf(rituelsText, (t) => t.errors.dailyKind));
    const kind = rec.kind;
    if (!(await this.fulfilled(userId, rec, today))) throw new DomainError('invalid', textOf(rituelsText, (t) => t.errors.dailyNotYet[kind]));
    return this.finish(userId, rec, {});
  }

  /**
   * Valide sans demande explicite un défi « écrire » déjà accompli (message envoyé aujourd'hui) : appelé à l'ouverture,
   * seulement pour ce type et tant qu'il n'est pas fait (une lecture d'événements du jour).
   */
  async autoComplete(userId: string, rec: DailyChallengeRecord, today: Day): Promise<DoneResult | null> {
    if (rec.status === 'done' || rec.kind !== 'write') return null;
    if (!(await this.fulfilled(userId, rec, today))) return null;
    return this.finish(userId, rec, {});
  }

  /** Appelé quand la sortie du jour est comptée : un défi « sortir » se valide tout seul. */
  async onOuting(userId: string, today: Day): Promise<DoneResult | null> {
    const rec = await this.ensure(userId, today);
    if (rec.status === 'done' || rec.kind !== 'go_out') return null;
    return this.finish(userId, rec, {});
  }

  private async fulfilled(userId: string, rec: DailyChallengeRecord, today: Day): Promise<boolean> {
    if (rec.kind === 'go_out') {
      const state = await this.ctx.state(userId);
      return state.outingOn === today && state.outingAnswer !== null && state.outingAnswer !== 'not_yet';
    }
    if (rec.kind === 'write') {
      const pet = await this.pets.findByOwner(userId);
      return pet !== null && (await this.character.countToday(pet.id, 'message_sent')) > 0;
    }
    return false;
  }

  /** Passe le défi à « fait » (une seule fois), fait avancer la série et le caractère (`challenge_done`). */
  private async finish(userId: string, rec: DailyChallengeRecord, patch: DailyChallengePatch): Promise<DoneResult> {
    const now = this.ctx.now();
    const today = rec.day;
    const justDone = await this.daily.markDone(userId, today, patch, now.toISOString());
    const record: DailyChallengeRecord = { ...rec, ...patch, status: 'done', doneAt: rec.doneAt ?? now.toISOString() };
    if (!justDone) return { record: (await this.daily.find(userId, today)) ?? record, newItems: [], justDone };
    const { newItems, streak } = await this.streaks.complete(userId, today);
    // Activité en direct du défi (démarrée par l'app) : « Défi relevé », puis retirée.
    await this.live?.endChallenge(userId, { streak: streak.current, title: dailyDefOf(rec).text.slice(0, 120) });
    // Compteur « défis relevés » de la garde-robe et petit effet sur le caractère ; une fois par jour au plus.
    await this.character.apply(userId, 'challenge_done', { maxPerDay: 1 });
    return { record, newItems, justDone };
  }
}
